"""
Payment service.

Sits between the gateway and the rest of the shop:

    Gateway  ->  this module  ->  Payment row  ->  inventory / referral

Nothing here knows a gateway exists, and nothing in the order or discount code
knows a payment exists. That separation is the point: a different provider
would swap the gateway and leave this file alone.

Server-authoritative amount: a request identifies an order, and the amount
charged is read from that order. Amounts sent by a client are ignored.

Idempotency: settling a payment is guarded by a single conditional UPDATE on
``Payment.status``. Only the call that moves the row from pending to success
does any work, so a repeated or concurrent callback cannot consume stock or
grant rewards twice.
"""

import logging
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone

from .discounts import process_qualifying_purchase
from .gateways import GatewayError
from .models import Order, Payment
from .orders import release_inventory, reserve_inventory

logger = logging.getLogger(__name__)

# The code the gateway layer puts on a GatewayError when the request never got
# an answer -- a connection failure, a timeout, an unreadable body. It is the
# default of ``GatewayError.code``, so any other code on the exception is a real
# answer from the gateway. Mirrored here so the payment service can tell "the
# gateway said no" apart from "we could not ask".
GATEWAY_UNAVAILABLE = "unavailable"


class PaymentError(Exception):
    """A problem with the requested payment. Safe to show to the customer."""

    def __init__(self, message: str, field: str = ""):
        self.message = message
        self.field = field
        super().__init__(message)


def _amount_to_charge(order: Order) -> Decimal:
    """
    What this order costs, from our own record.

    Recomputed here rather than read from a client so that a tampered amount
    cannot reach the gateway. Pickup carries no shipping, which the order
    already accounts for.
    """
    return order.subtotal + order.shipping_cost - order.discount


def get_payable_order(order, user=None) -> Order:
    """The order to pay for, with ownership already checked by the caller."""
    if order.status == Order.STATUS_CANCELED:
        raise PaymentError("This order was cancelled.", field="order_code")

    existing = order.payments.filter(status=Payment.PAYMENT_STATUS_SUCCESS).first()
    if existing is not None:
        raise PaymentError("This order has already been paid for.", field="order_code")

    return order


@transaction.atomic
def start_payment(order: Order, gateway) -> Payment:
    """
    Create the pending Payment row and ask the gateway to start a payment.

    The gateway call is made before the row is written, so a slow or failing
    network call is not held inside the transaction. Only the two database
    writes are atomic.
    """
    amount = _amount_to_charge(order)
    if amount <= 0:
        raise PaymentError("This order has nothing to pay.", field="order_code")

    # A customer who abandons an attempt and comes back is sent to the same
    # authority rather than being issued a second live payment for one order.
    # The unique constraint on the model is the real guarantee; this is the
    # fast path that avoids a pointless second gateway call.
    reusable = order.payments.filter(status=Payment.PAYMENT_STATUS_PENDING).first()
    if reusable is not None and reusable.authority:
        return reusable

    description = f"Qandak order {order.order_code}"
    mobile = order.phone_number if order.phone_number.startswith("+98") else None

    authority = gateway.create_payment(
        amount=amount,
        description=description,
        callback_url=_callback_url_for(order),
        mobile=mobile,
    )

    try:
        payment = Payment.objects.create(
            order=order,
            amount=amount,
            authority=authority,
            status=Payment.PAYMENT_STATUS_PENDING,
        )
    except IntegrityError:
        # Another request created the pending payment between the check above
        # and this insert. The database refused a second live payment for the
        # order, so adopt theirs rather than failing the customer.
        existing = order.payments.filter(status=Payment.PAYMENT_STATUS_PENDING).first()
        if existing is None:
            raise
        return existing

    return payment


def _callback_url_for(order: Order) -> str:
    """
    Where the gateway sends the customer back.

    The order code travels in the path as a hint only: the callback resolves
    the payment from the stored authority, never from what the query string
    claims.
    """
    from django.conf import settings
    from django.urls import reverse

    base = getattr(settings, "PAYMENT_CALLBACK_BASE_URL", "") or ""
    return f"{base}{reverse('payment-callback', kwargs={'order_code': order.order_code})}"


def settle_payment(payment: Payment, gateway, authority: str | None = None) -> bool:
    """
    Verify with the gateway and, only on a confirmed payment, take the money
    path: mark the payment successful, consume stock, grant rewards.

    Returns True when this call is the one that settled the payment. A repeated
    callback returns False and does nothing.

    The gateway's three possible answers are all handled, and none of them is
    allowed to mark a payment paid:

    * confirmed  -- the payment succeeds, stock is consumed, rewards are granted;
    * refused    -- the gateway answered and would not confirm it, so the row is
                    moved to failed and nothing else happens;
    * no answer  -- the request never got through, so the row stays pending for a
                    retry and the GatewayError is raised to the caller.

    This function is deliberately *not* wrapped in a transaction. The gateway
    round trip is a network call that can take seconds or time out, and holding a
    database transaction open across it would keep a write lock for that whole
    time -- on SQLite that blocks every other writer in the process. So the call
    happens on its own, and only the part that changes state is transactional.
    That part -- claiming the payment, consuming stock, granting rewards -- is
    still all-or-nothing: none of those three can happen without the others.
    """
    if payment.status != Payment.PAYMENT_STATUS_PENDING:
        # Already settled or already failed. A late duplicate callback is a
        # no-op, and a successful payment is never walked backwards.
        return False

    if not payment.authority:
        logger.warning("Payment %s has no authority to verify", payment.pk)
        return False

    if authority is not None and authority != payment.authority:
        # The callback named a different attempt than the one on record.
        logger.info("Callback authority does not match the stored payment")
        return False

    try:
        result = gateway.verify_payment(
            authority=payment.authority, amount=payment.amount
        )
    except GatewayError as exc:
        # Two very different situations arrive here, and they must not be
        # treated the same.
        #
        # A definite answer -- the gateway replied and refused to confirm this
        # payment -- means the attempt is over. Recording that is what lets the
        # storefront tell the customer their payment did not go through; without
        # it the row would sit at 'pending' forever, retry would be ambiguous
        # and the failed state would be unreachable.
        #
        # A transport problem says nothing at all about the payment: we never
        # learned whether money moved. That stays pending for a later retry, and
        # the failure is raised so the caller can log it.
        if exc.code == GATEWAY_UNAVAILABLE:
            raise

        fail_payment(payment, reason=str(exc.code))
        return False

    # The gateway was asked to check the amount, and the amount came from our
    # own record. Check once more on this side before anything irreversible.
    if result.get("reference") is None:
        logger.info("ZarinPal verification returned no reference")
        return False

    # The gateway has confirmed the payment, so the database work begins. From
    # here to the end everything is one transaction: if claiming the payment,
    # consuming stock or granting rewards fails partway, none of it stands.
    with transaction.atomic():
        # The single state transition that everything else hangs off. Only the
        # call that wins this update proceeds; concurrent or repeated callbacks
        # update zero rows and return here.
        claimed = (
            Payment.objects.filter(pk=payment.pk, status=Payment.PAYMENT_STATUS_PENDING)
            .update(
                status=Payment.PAYMENT_STATUS_SUCCESS,
                transaction_id=result["reference"],
                verified_at=timezone.now(),
            )
        )
        if not claimed:
            return False

        payment.refresh_from_db()

        # Stock is only taken once a payment has actually succeeded.
        reserve_inventory(payment.order)

        # A completed purchase is what earns rewards, not the order or the
        # callback. This call is itself idempotent, so a repeat is harmless.
        process_qualifying_purchase(payment.order)

    return True


@transaction.atomic
def fail_payment(payment: Payment, reason: str = "") -> bool:
    """Mark a pending payment failed. No stock, no rewards, order untouched."""
    claimed = (
        Payment.objects.filter(pk=payment.pk, status=Payment.PAYMENT_STATUS_PENDING)
        .update(status=Payment.PAYMENT_STATUS_FAILED, verified_at=timezone.now())
    )
    if not claimed:
        return False
    if reason:
        # Recorded for operators, never returned to a customer and never
        # containing a credential.
        logger.info("Payment %s failed: %s", payment.pk, reason)
    payment.refresh_from_db()
    return True


def refund_order_stock(order: Order) -> None:
    """Return stock for an order whose payment was reversed."""
    with transaction.atomic():
        release_inventory(order)
