"""
Order placement.

The client sends *what* was chosen and never *how much it costs*:

    {"product": 12, "quantity": 2, "selected_options": {"size": "2kg"}}

Every amount on the resulting order is computed here from the database. Any
price, subtotal, shipping cost, discount or total that arrives in the request
body is ignored, because the pricing is not the client's to decide.

The whole placement runs inside a transaction: if one line fails validation the
order is not left behind half written.
"""

import logging
from decimal import Decimal

from django.db import transaction
from django.db.models import F

from .discounts import apply_discount, resolve_discount_for_customer
from .models import Address, Customer, Order, OrderItem, Product
from .pricing import (
    InvalidSelection,
    resolve_values,
    unit_price_from_values,
)

# The storefront's own delivery price. It lives here, on the server, so a
# client cannot choose its own shipping cost.
SHIPPING_COST = Decimal("30000")

logger = logging.getLogger(__name__)

# No shipping when the customer collects the order themselves.
PICKUP_SHIPPING_COST = Decimal("0")

MAX_ITEMS_PER_ORDER = 50
MAX_QUANTITY_PER_ITEM = 99


class OrderError(Exception):
    """A problem with the submitted order. The message is safe to show."""

    def __init__(self, message: str, field: str = ""):
        self.message = message
        self.field = field
        super().__init__(message)


def resolve_guest_customer(details: dict) -> tuple:
    """
    Find or create the Customer behind a guest checkout.

    A guest has no account, so their contact details arrive in the request and
    become a Customer record, which is what an order is attached to.

    The customer is never chosen by the client. The only lookup performed is on
    the e-mail the guest typed, and:

    * if that e-mail belongs to a registered account, the guest is refused and
      asked to sign in, so nobody can quietly place orders under someone else's
      identity;
    * otherwise the existing guest customer is reused, so someone returning as
      a guest keeps one continuous history instead of a new row per order.
    """
    email = details["email"]
    existing = Customer.objects.filter(email__iexact=email).first()

    if existing is not None and existing.user_id is not None:
        raise OrderError(
            "This e-mail belongs to an account. Please sign in to place your order.",
            field="email",
        )

    if existing is not None:
        # Refresh the details the guest just supplied.
        existing.first_name = details["first_name"]
        existing.last_name = details["last_name"]
        existing.phone_number = details["phone_number"]
        existing.save(update_fields=["first_name", "last_name", "phone_number"])
        return existing, None

    return Customer.objects.create(
        first_name=details["first_name"],
        last_name=details["last_name"],
        email=email,
        phone_number=details["phone_number"],
    ), None


@transaction.atomic
def place_guest_order(
    *,
    details: dict,
    items,
    delivery_method: str = Order.DELIVERY_STANDARD,
    discount_code: str | None = None,
) -> Order:
    """
    Place an order for a shopper with no account.

    ``details`` carries the guest's contact details and delivery address. The
    Customer is resolved from those details, never from an identifier supplied
    by the client, and the address is snapshotted straight onto the order.

    The transaction covers the customer lookup/creation as well, so a basket
    that turns out to be invalid does not leave a half-registered customer
    behind.
    """
    for field in ("first_name", "last_name", "email", "phone_number", "address"):
        if not str(details.get(field) or "").strip():
            raise OrderError(f"{field.replace('_', ' ').capitalize()} is required.", field=field)

    customer, _ = resolve_guest_customer(details)
    return place_order(
        customer=customer,
        items=items,
        delivery_method=delivery_method,
        address=None,
        guest_address=details["address"].strip(),
        discount_code=discount_code,
    )


class OrderItemInput:
    """One requested line, parsed and validated."""

    def __init__(self, product, quantity, selected_options, values=None):
        self.product = product
        self.quantity = quantity
        self.selected_options = selected_options
        # The option values already resolved for this line. Held so the caller can
        # price the line and write its snapshot without looking them up again.
        self.values = list(values) if values is not None else []


def _as_pk(value):
    """
    The primary key a submitted ``product`` would resolve to, or ``None``.

    Mirrors what a per-row ``get(pk=...)`` used to accept: integers, digit
    strings and ``Decimal``. A float or anything unparseable has no row behind
    it, which is the same answer the old lookup gave when it raised.
    """
    if isinstance(value, float):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _fetch_products(raw_items) -> dict:
    """
    Load every product an order mentions, and its options, in one go.

    Ordering an item used to mean one query for the product, one for its options
    and one per chosen option value -- and the choices were then looked up two
    more times while pricing the line and writing its snapshot. Fetching the
    whole basket here turns that into a fixed number of queries no matter how
    many lines the order has.

    The result is a ``pk -> Product`` map. A product that does not exist is
    simply absent, which the caller reports exactly as before.
    """
    wanted = set()
    for raw in raw_items:
        if not isinstance(raw, dict):
            continue
        pk = _as_pk(raw.get("product"))
        if pk is not None:
            wanted.add(pk)

    if not wanted:
        return {}

    rows = Product.objects.filter(pk__in=wanted).prefetch_related("options__values")
    return {row.pk: row for row in rows}


def parse_items(raw_items) -> list:
    if not isinstance(raw_items, (list, tuple)) or not raw_items:
        raise OrderError("An order needs at least one item.", field="items")
    if len(raw_items) > MAX_ITEMS_PER_ORDER:
        raise OrderError(f"An order can hold at most {MAX_ITEMS_PER_ORDER} items.", field="items")

    # One fetch for the whole basket, before any per-line work. The loop below
    # still checks each line in the same order as before, so an invalid line is
    # still reported with its own number and its own message.
    products = _fetch_products(raw_items)

    items = []
    for index, raw in enumerate(raw_items):
        if not isinstance(raw, dict):
            raise OrderError(f"Item {index + 1} is malformed.", field="items")

        product_id = raw.get("product")
        if product_id is None:
            raise OrderError(f"Item {index + 1} is missing a product.", field="items")

        product = products.get(_as_pk(product_id))
        if product is None:
            raise OrderError(f"Item {index + 1}: unknown product.", field="items")

        quantity = raw.get("quantity", 1)
        if not isinstance(quantity, int) or isinstance(quantity, bool):
            raise OrderError(
                f"Item {index + 1}: quantity must be a whole number.", field="items"
            )
        if quantity < 1:
            raise OrderError(f"Item {index + 1}: quantity must be at least 1.", field="items")
        if quantity > MAX_QUANTITY_PER_ITEM:
            raise OrderError(
                f"Item {index + 1}: quantity may not exceed {MAX_QUANTITY_PER_ITEM}.",
                field="items",
            )

        selected_options = raw.get("selected_options") or {}
        if not isinstance(selected_options, dict):
            raise OrderError(
                f"Item {index + 1}: selected_options must be an object.", field="items"
            )

        # Raises InvalidSelection for an unknown option, a missing required
        # option, or a value that does not belong to the option. Resolved once
        # here; the caller reuses the result for pricing and for the snapshot.
        try:
            values = resolve_values(product, selected_options)
        except InvalidSelection as exc:
            raise OrderError(f"Item {index + 1}: {exc}", field="items") from exc

        if product.inventory < quantity:
            raise OrderError(
                f"Item {index + 1}: only {product.inventory} of "
                f"'{product.name}' left in stock.",
                field="items",
            )

        items.append(OrderItemInput(product, quantity, dict(selected_options), values))

    return items


def build_option_snapshot(values) -> dict:
    """Labels and deltas as they stood when the order was placed."""
    return {
        value.option.slug: {
            "option": value.option.name,
            "value": value.label,
            "price_delta": str(value.price_delta),
        }
        for value in values
    }


def snapshot_customer(customer: Customer, address: Address | None) -> dict:
    return {
        "first_name": customer.first_name,
        "last_name": customer.last_name,
        "email": customer.email,
        "phone_number": customer.phone_number,
        "address": address.address if address else "",
    }


@transaction.atomic
def place_order(
    *,
    customer: Customer,
    items,
    delivery_method: str = Order.DELIVERY_STANDARD,
    address: Address | None = None,
    guest_address: str | None = None,
    discount_code: str | None = None,
) -> Order:
    """
    Create an order for ``customer``.

    ``items`` are the raw dicts from the request. ``address`` is the customer's
    own Address row; ``guest_address`` carries the text a guest typed at
    checkout. Exactly one of the two is used, and it is only ever copied into
    the order, never linked to.

    ``discount_code`` is the only discount-related thing a client may send, and
    it is resolved against this customer's own discounts. The percentage and the
    resulting amount both come from the database.
    """
    parsed_items = parse_items(items)

    if delivery_method not in dict(Order.DELIVERY_METHODS):
        raise OrderError("Unknown delivery method.", field="delivery_method")

    buyer = snapshot_customer(customer, address)
    if guest_address is not None:
        buyer["address"] = guest_address.strip()
    if not buyer["address"].strip():
        raise OrderError("A delivery address is required.", field="address")

    order = Order.objects.create(
        customer=customer,
        delivery_method=delivery_method,
        first_name=buyer["first_name"],
        last_name=buyer["last_name"],
        email=buyer["email"],
        phone_number=buyer["phone_number"],
        address=buyer["address"],
        shipping_cost=(
            PICKUP_SHIPPING_COST
            if delivery_method == Order.DELIVERY_PICKUP
            else SHIPPING_COST
        ),
    )

    subtotal = Decimal("0")
    for item in parsed_items:
        # The values were already resolved while parsing, from the same rows, so
        # pricing and the snapshot reuse them instead of looking them up again.
        unit_price = unit_price_from_values(item.product, item.values)
        line_total = unit_price * item.quantity

        OrderItem.objects.create(
            order=order,
            product=item.product,
            quantity=item.quantity,
            product_name=item.product.name,
            product_slug=item.product.slug,
            price=unit_price,
            total=line_total,
            selected_options=item.selected_options,
            options_snapshot=build_option_snapshot(item.values),
        )
        subtotal += line_total

    order.subtotal = subtotal
    order.discount = Decimal("0")
    order.total = subtotal + order.shipping_cost
    order.save(update_fields=["subtotal", "discount", "total"])

    if discount_code:
        # Resolved and applied against this customer's own discounts only.
        # The amount is computed from the stored percent, never from the request.
        discount = resolve_discount_for_customer(customer, discount_code)
        apply_discount(order, discount)

    return order


def reserve_inventory(order: Order) -> None:
    """
    Take stock out of availability for a placed order.

    Qandak's rule is that placing an order is not the same as paying for it: a
    payment that is never completed, or expires, must not have consumed stock
    for good. So ``place_order`` only *checks* availability, and the real
    decrement happens here, at the moment payment confirms the order.

    This is deliberately Option A (consume on payment) rather than a separate
    reservation table. A reservation would need its own model, an expiry
    mechanism and a sweeper to release lapsed holds, none of which can run
    without a background worker, and none of which is justified before the
    payment flow exists. If reservations are ever needed, this function is the
    one place to change.

    The decrement is a single conditional UPDATE using ``F``, which is safe on
    SQLite and loses no updates when two payments settle at once.

    It deliberately never raises. A payment that the gateway has already
    captured must not be undone by a stock problem: rolling the transaction
    back here would leave a customer who has paid holding a pending payment and
    no record of the money. So when stock has run short the order is still
    treated as paid, the shortfall is logged for an operator to act on, and the
    order stays open for fulfilment. See the production limitations in the
    Stage 7 audit.
    """
    for item in order.items.select_related("product"):
        consumed = (
            Product.objects.filter(pk=item.product_id, inventory__gte=item.quantity)
            .update(inventory=F("inventory") - item.quantity)
        )
        if not consumed:
            # Paid, but not enough stock. Log it; do not fail the payment.
            logger.warning(
                "Order %s paid but stock was short for product %s (wanted %s, have %s)",
                order.order_code,
                item.product_slug,
                item.quantity,
                item.product.inventory,
            )


def release_inventory(order: Order) -> None:
    """
    Return stock to availability when a paid order is cancelled or refunded.

    The mirror of :func:`reserve_inventory`, so the two always agree on what
    was taken.
    """
    for item in order.items.select_related("product"):
        Product.objects.filter(pk=item.product_id).update(
            inventory=F("inventory") + item.quantity
        )
