"""
Discount rules for Qandak.

Two kinds exist and nothing else:

``first``     15% off the first purchase of a registered customer.
``referral``  a reward granted after a referral has actually paid.

The guiding rule is that a reward is never granted because somebody *typed a
code*. It is granted when a qualifying purchase completes, which Stage 7 decides
by calling :func:`process_qualifying_purchase`.

Amounts are always computed here from the stored ``percent``. Nothing a client
sends can set a percentage, an amount, an owner or a usage state.
"""

from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.utils import timezone

from .models import Customer, Discount, Order, Payment

FIRST_PURCHASE_PERCENT = 15
REFERRAL_PERCENT = 15

HUNDRED = Decimal("100")


class DiscountError(Exception):
    """A problem with a submitted discount. Safe to show to the customer."""

    def __init__(self, message: str, field: str = ""):
        self.message = message
        self.field = field
        super().__init__(message)


def compute_discount_amount(subtotal: Decimal, percent: int) -> Decimal:
    """The amount to take off, rounded to whole tomans."""
    return (subtotal * Decimal(percent) / HUNDRED).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )


def resolve_discount_for_customer(customer: Customer, code: str) -> Discount:
    """
    Find a discount belonging to ``customer``.

    The code a customer types is their own ``referral_code``, and the lookup is
    always scoped to the customer checking out. A code that belongs to somebody
    else is not a way to reach their discount: the comparison is against the
    caller's own code, and the returned discount is chosen from the caller's
    own unused ones.
    """
    if not code or code != customer.referral_code:
        raise DiscountError("This discount code is not valid.", field="discount_code")

    discount = (
        customer.discounts.filter(used_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if discount is None:
        raise DiscountError(
            "You do not have an unused discount.", field="discount_code"
        )
    return discount


@transaction.atomic
def apply_discount(order: Order, discount: Discount) -> int:
    """
    Take ``discount`` off ``order`` and mark the discount spent.

    Returns the amount removed.

    Re-read inside the transaction and re-check availability, then claim the
    discount with a conditional UPDATE that only matches a row still unused.
    Two concurrent requests cannot both win that claim, so a discount cannot be
    spent twice. This is a single SQL statement rather than a Python ``if``,
    which is what makes it safe without row-level locking (SQLite has none).
    """
    claimed = (
        Discount.objects.filter(pk=discount.pk, used_at__isnull=True)
        .update(used_at=timezone.now(), used_order=order)
    )
    if not claimed:
        raise DiscountError("This discount has already been used.", field="discount_code")

    discount.refresh_from_db()

    amount = compute_discount_amount(order.subtotal, discount.percent)
    order.discount = amount
    order.total = order.subtotal + order.shipping_cost - amount
    order.save(update_fields=["discount", "total"])
    return amount


def available_discounts_for(customer: Customer) -> list:
    """The customer's unused discounts, newest first."""
    return list(customer.discounts.filter(used_at__isnull=True))


def register_referral(new_customer: Customer, code: str) -> Customer | None:
    """
    Record that ``new_customer`` was referred by whoever owns ``code``.

    Only the link is stored here. No reward is created: a reward belongs to a
    purchase that has actually been paid for, which is
    :func:`process_qualifying_purchase`'s job.

    Returns the referring customer, or ``None`` if the code matched nobody.
    """
    referrer = Customer.objects.filter(referral_code=code).first()
    if referrer is None:
        return None
    if referrer.pk == new_customer.pk:
        raise DiscountError("You cannot use your own referral code.", field="referral_code")

    new_customer.referred_by = referrer
    new_customer.save(update_fields=["referred_by"])
    return referrer


@transaction.atomic
def process_qualifying_purchase(order: Order) -> list:
    """
    Grant the rewards a completed purchase earns.

    Called by the payment stage once a payment has actually succeeded. Running
    it twice for the same order is harmless: the guard below is a single
    conditional UPDATE, so the second call matches no row and grants nothing.

    Returns the discounts created by this call, empty on a repeat call.
    """
    if order.status == Order.STATUS_CANCELED:
        return []

    # Claim the order first. If this updates zero rows, rewards for this order
    # have already been granted and the event is a duplicate.
    claimed = (
        Order.objects.filter(pk=order.pk, referral_processed_at__isnull=True)
        .update(referral_processed_at=timezone.now())
    )
    if not claimed:
        return []

    customer = order.customer
    granted = []

    # A first purchase reward is only for someone with an account: a guest has
    # no identity to recognise on a return visit. See the report for the open
    # business question about this.
    #
    # What counts as an earlier purchase is the same rule that gates this whole
    # function: a reward follows a *completed payment*, never a placed order. An
    # earlier order therefore only counts once money has actually moved for it,
    # so an order the customer placed and then abandoned -- or cancelled -- leaves
    # the first-purchase reward intact for the purchase they do complete.
    #
    # The order being settled is excluded: by the time this runs its own payment
    # has just been marked successful, so counting it would make every customer
    # look like a returning one and the reward could never be granted.
    has_paid_order_before = (
        Order.objects.filter(
            customer=customer,
            payments__status=Payment.PAYMENT_STATUS_SUCCESS,
        )
        .exclude(pk=order.pk)
        .exclude(status=Order.STATUS_CANCELED)
        .exists()
    )
    if customer.user_id is not None and not has_paid_order_before:
        granted.append(
            Discount.objects.create(
                customer=customer,
                discount_type=Discount.DISCOUNT_FIRST_PURCHASE,
                percent=FIRST_PURCHASE_PERCENT,
            )
        )

    # The referral reward is split: the person who shared the code, and the
    # person who used it. Both are granted only now, after payment.
    if customer.referred_by_id is not None:
        granted.append(
            Discount.objects.create(
                customer=customer,
                discount_type=Discount.DISCOUNT_REFERRAL,
                percent=REFERRAL_PERCENT,
            )
        )
        granted.append(
            Discount.objects.create(
                customer=customer.referred_by,
                discount_type=Discount.DISCOUNT_REFERRAL,
                percent=REFERRAL_PERCENT,
            )
        )

    return granted
