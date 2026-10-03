"""
Tests for the payment flow.

The gateway is replaced by a fake throughout: no test touches the network. The
fake reproduces the parts of the real contract that matter, including refusing
a wrong amount, so the amount check is genuinely exercised.
"""

import json
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings

from . import payments as payments_module
from .discounts import Discount
from .gateways import GatewayError, ZarinpalGateway, to_rial
from .models import Address, Category, Discount as DiscountModel, Order, Payment, Product
from .orders import place_order
from .payments import (
    GATEWAY_UNAVAILABLE,
    PaymentError,
    fail_payment,
    get_payable_order,
    settle_payment,
    start_payment,
)
from django.db import IntegrityError, connection, transaction

User = get_user_model()

ORIGIN = "http://localhost:3000"
CALLBACK_URL = "https://api.example.test/api/payments/callback/ORD-TEST/"


class FakeGateway:
    """Stands in for ZarinPal. Records what it was asked to do."""

    name = "fake"

    def __init__(self, reference=None, fail_verify=False, network_error=False):
        self.reference = reference
        self.fail_verify = fail_verify
        self.network_error = network_error
        self.requested = []
        self.verified = []
        self.counter = 0
        self.settled = 0

    def create_payment(self, *, amount, description, callback_url, mobile=None):
        self.requested.append(
            {"amount": amount, "description": description,
             "callback_url": callback_url, "mobile": mobile}
        )
        self.counter += 1
        return f"AUTH-{self.counter:04d}"

    def verify_payment(self, *, authority, amount):
        self.verified.append({"authority": authority, "amount": amount})
        if self.network_error:
            raise GatewayError("unreachable")
        if self.fail_verify:
            raise GatewayError("not confirmed", code="-51")
        # Each settlement gets its own reference, because transaction_id is
        # unique and a real gateway never reuses one.
        self.settled += 1
        reference = self.reference or f"REF-{self.settled:06d}"
        return {"reference": reference, "card_pan": "603799******1234", "fee": 1000}

    def payment_url(self, authority):
        return f"https://sandbox.zarinpal.com/pg/StartPay/{authority}"


def make_user(username="sara", **kwargs):
    defaults = dict(
        email=f"{username}@example.com",
        first_name=username.title(),
        last_name="Test",
        phone_number="+989" + str(abs(hash(username)) % 10**9).zfill(9),
    )
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password="Str0ngPass!23", **defaults)


def make_customer(user=None, email=None):
    return Customer_factory(user=user, email=email)


def Customer_factory(user=None, email=None):
    from .models import Customer

    return Customer.objects.create(
        user=user,
        first_name="Sara",
        last_name="Test",
        email=email or (user.email if user else "guest@example.com"),
        phone_number="09120000000",
    )


def make_product(slug="cake", price="100000", inventory=50):
    category, _ = Category.objects.get_or_create(slug="cakes", defaults={"title": "Cakes"})
    return Product.objects.create(
        category=category, slug=slug, name=f"Product {slug}", description="d",
        price=Decimal(price), inventory=inventory,
    )


def make_order(customer, product=None, quantity=1):
    product = product or make_product()
    address, _ = Address.objects.get_or_create(customer=customer, defaults={"address": "Tehran"})
    return place_order(
        customer=customer, address=address,
        items=[{"product": product.pk, "quantity": quantity}],
    )


class CurrencyConversionTests(TestCase):
    """The store keeps tomans; the gateway wants rial. Conversion happens once."""

    def test_conversion_factor(self):
        self.assertEqual(to_rial(Decimal("100000")), 1000000)
        self.assertEqual(to_rial(Decimal("1")), 10)
        self.assertEqual(to_rial(Decimal("0")), 0)

    def test_conversion_is_exact_for_whole_tomans(self):
        for tomans in (1, 7, 850, 30000, 123456789):
            self.assertEqual(to_rial(Decimal(tomans)), tomans * 10)

    def test_fractional_toman_is_refused_rather_than_rounded(self):
        # The store never holds fractional tomans, but if one ever appeared the
        # conversion refuses instead of silently rounding someone's money.
        with self.assertRaises(ValueError):
            to_rial(Decimal("0.15"))

    def test_conversion_lives_only_in_the_gateway_module(self):
        """The rial conversion must not leak into any other module."""
        import pathlib
        import re

        store = pathlib.Path(__file__).parent
        pattern = re.compile(r"RIAL_PER_TOMAN|to_rial|GATEWAY_CURRENCY", re.I)
        offenders = [
            path.name
            for path in store.glob("*.py")
            if path.name not in {"gateways.py", "test_payments.py"}
            and pattern.search(path.read_text(encoding="utf-8"))
        ]
        self.assertEqual(offenders, [], f"currency conversion leaked into {offenders}")


class ZarinpalGatewayTests(TestCase):
    def test_missing_merchant_id_is_refused(self):
        with self.assertRaises(GatewayError):
            ZarinpalGateway(merchant_id="", base_url="https://sandbox.zarinpal.com")

    def test_payment_url_shape(self):
        gateway = ZarinpalGateway("mid", "https://sandbox.zarinpal.com")
        self.assertEqual(
            gateway.payment_url("ABC"),
            "https://sandbox.zarinpal.com/pg/StartPay/ABC",
        )

    def test_unreachable_gateway_raises_gateway_error(self):
        gateway = ZarinpalGateway("mid", "https://127.0.0.1:9", timeout=1)
        with self.assertRaises(GatewayError):
            gateway.create_payment(amount=100, description="d", callback_url="https://x.test")

    def test_non_json_reply_raises_gateway_error(self):
        import unittest.mock as mock

        gateway = ZarinpalGateway("mid", "https://sandbox.zarinpal.com")

        class FakeResponse:
            def read(self):
                return b"<html>not json</html>"

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        with mock.patch("urllib.request.urlopen", return_value=FakeResponse()):
            with self.assertRaises(GatewayError):
                gateway.create_payment(
                    amount=100, description="d", callback_url="https://x.test"
                )

    def test_gateway_error_reply_raises(self):
        import unittest.mock as mock

        gateway = ZarinpalGateway("mid", "https://sandbox.zarinpal.com")
        reply = json.dumps({"data": {}, "errors": {"code": -33, "message": "nope"}}).encode()

        class FakeResponse:
            def read(self):
                return reply

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        with mock.patch("urllib.request.urlopen", return_value=FakeResponse()):
            with self.assertRaises(GatewayError):
                gateway.create_payment(
                    amount=100, description="d", callback_url="https://x.test"
                )


class StartPaymentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=50)
        self.order = make_order(self.customer, self.product, quantity=2)
        self.gateway = FakeGateway()

    def test_payment_row_is_created_pending(self):
        payment = start_payment(self.order, self.gateway)

        self.assertEqual(payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertEqual(payment.order, self.order)
        self.assertTrue(payment.authority)

    def test_amount_comes_from_the_order(self):
        payment = start_payment(self.order, self.gateway)
        # subtotal 200000 + shipping 30000, no discount
        self.assertEqual(payment.amount, Decimal("230000"))
        self.assertEqual(self.gateway.requested[0]["amount"], Decimal("230000"))

    def test_discounted_order_charges_the_discounted_total(self):
        discount = DiscountModel.objects.create(
            customer=self.customer, discount_type=Discount.DISCOUNT_REFERRAL, percent=15
        )
        order = make_order(self.customer, self.product, quantity=2)
        from .discounts import apply_discount

        apply_discount(order, discount)
        payment = start_payment(order, self.gateway)

        self.assertEqual(payment.amount, Decimal("230000") - Decimal("30000"))

    def test_repeated_request_reuses_the_pending_payment(self):
        first = start_payment(self.order, self.gateway)
        second = start_payment(self.order, self.gateway)

        self.assertEqual(first, second)
        self.assertEqual(Payment.objects.count(), 1)

    def test_cancelled_order_cannot_be_paid(self):
        self.order.status = Order.STATUS_CANCELED
        self.order.save()
        with self.assertRaises(PaymentError):
            get_payable_order(self.order)

    def test_already_paid_order_is_refused(self):
        start_payment(self.order, self.gateway)
        payment = Payment.objects.get()
        Payment.objects.filter(pk=payment.pk).update(status=Payment.PAYMENT_STATUS_SUCCESS)

        with self.assertRaises(PaymentError):
            get_payable_order(self.order)

    def test_callback_url_carries_the_order_code(self):
        with override_settings(PAYMENT_CALLBACK_BASE_URL="https://api.example.test"):
            start_payment(self.order, self.gateway)
        self.assertIn(self.order.order_code, self.gateway.requested[0]["callback_url"])


class SettlePaymentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=10)
        self.order = make_order(self.customer, self.product, quantity=3)
        self.gateway = FakeGateway()
        self.payment = start_payment(self.order, self.gateway)

    def test_successful_verification_marks_paid(self):
        self.assertTrue(settle_payment(self.payment, self.gateway))

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)
        self.assertEqual(self.payment.transaction_id, "REF-000001")
        self.assertIsNotNone(self.payment.verified_at)

    def test_verification_amount_comes_from_the_payment_row(self):
        settle_payment(self.payment, self.gateway)
        self.assertEqual(self.gateway.verified[0]["amount"], self.payment.amount)
        self.assertEqual(self.gateway.verified[0]["authority"], self.payment.authority)

    def test_settlement_consumes_inventory_once(self):
        settle_payment(self.payment, self.gateway)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_repeat_settlement_is_a_no_op(self):
        self.assertTrue(settle_payment(self.payment, self.gateway))
        self.assertFalse(settle_payment(self.payment, self.gateway))
        self.assertFalse(settle_payment(self.payment, self.gateway))

        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_repeat_settlement_does_not_regrant_rewards(self):
        settle_payment(self.payment, self.gateway)
        count = DiscountModel.objects.count()
        settle_payment(self.payment, self.gateway)
        settle_payment(self.payment, self.gateway)
        self.assertEqual(DiscountModel.objects.count(), count)

    def test_mismatched_authority_does_not_settle(self):
        self.assertFalse(settle_payment(self.payment, self.gateway, authority="FORGED"))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

    def test_network_failure_leaves_payment_pending(self):
        gateway = FakeGateway(network_error=True)
        with self.assertRaises(GatewayError):
            settle_payment(self.payment, gateway)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)
        self.assertEqual(DiscountModel.objects.count(), 0)

    # --- The transaction boundary -------------------------------------------
    # The gateway round trip is a network call and must not run inside a
    # database transaction; the state change it authorises must.

    def test_the_gateway_call_happens_outside_a_transaction(self):
        # `TestCase` already wraps the test in a transaction, so `in_atomic_block`
        # would say True no matter what. Savepoints are what count: an inner
        # atomic() opens one, so counting them shows exactly when settle_payment
        # started a transaction of its own.
        seen = {}

        class RecordingGateway(FakeGateway):
            def verify_payment(self, *, authority, amount):
                seen["savepoints"] = len(connection.savepoint_ids)
                return super().verify_payment(authority=authority, amount=amount)

        before = len(connection.savepoint_ids)
        self.assertTrue(settle_payment(self.payment, RecordingGateway()))

        # The network call ran before settle_payment opened any transaction.
        self.assertEqual(seen["savepoints"], before)

    def test_the_refused_gateway_call_also_happens_outside_a_transaction(self):
        seen = {}

        class RecordingGateway(FakeGateway):
            def __init__(self):
                super().__init__(fail_verify=True)

            def verify_payment(self, *, authority, amount):
                seen["savepoints"] = len(connection.savepoint_ids)
                return super().verify_payment(authority=authority, amount=amount)

        before = len(connection.savepoint_ids)
        self.assertFalse(settle_payment(self.payment, RecordingGateway()))

        self.assertEqual(seen["savepoints"], before)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)

    def test_the_state_change_happens_inside_one_transaction(self):
        seen = {}
        real_reserve = payments_module.reserve_inventory

        def spy(order):
            seen["savepoints"] = len(connection.savepoint_ids)
            return real_reserve(order)

        before = len(connection.savepoint_ids)
        with mock.patch.object(payments_module, "reserve_inventory", spy):
            self.assertTrue(settle_payment(self.payment, self.gateway))

        # By the time stock is consumed a transaction is open, so the claim, the
        # stock and the rewards all sit inside the same unit of work.
        self.assertEqual(seen["savepoints"], before + 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_a_failure_inside_the_state_change_rolls_the_whole_thing_back(self):
        # The claim, the stock and the rewards share one transaction: if the last
        # step fails, none of it stands.
        def boom(order):
            raise RuntimeError("referral processing exploded")

        with mock.patch.object(payments_module, "process_qualifying_purchase", boom):
            with self.assertRaises(RuntimeError):
                settle_payment(self.payment, self.gateway)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertIsNone(self.payment.transaction_id)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)
        self.assertIsNone(self.order.referral_processed_at)

    def test_a_network_failure_can_still_be_settled_afterwards(self):
        # No answer from the gateway is not a refusal, so the payment must stay
        # usable: the customer's later retry has to be able to succeed.
        with self.assertRaises(GatewayError):
            settle_payment(self.payment, FakeGateway(network_error=True))

        self.assertTrue(settle_payment(self.payment, self.gateway))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_the_unavailable_code_is_what_keeps_a_payment_pending(self):
        # The discriminator between "the gateway said no" and "we could not ask"
        # is the error code, so pin both sides of it explicitly.
        unavailable = FakeGateway(network_error=True)
        self.assertEqual(GATEWAY_UNAVAILABLE, "unavailable")
        with self.assertRaises(GatewayError):
            settle_payment(self.payment, unavailable)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)

        refused = FakeGateway(fail_verify=True)
        self.assertFalse(settle_payment(self.payment, refused))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)

    def test_refused_verification_marks_the_payment_failed(self):
        # The gateway answered and would not confirm the payment, so the attempt
        # is over: the row records that, and nothing irreversible happens.
        gateway = FakeGateway(fail_verify=True)

        self.assertFalse(settle_payment(self.payment, gateway))

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)
        self.assertIsNone(self.payment.transaction_id)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)
        self.assertEqual(DiscountModel.objects.count(), 0)
        self.assertIsNone(self.order.referral_processed_at)

    def test_a_refused_verification_is_not_retryable_into_success(self):
        # Once the gateway has refused, the row is no longer pending, so a later
        # callback cannot be settled into a success. The customer starts a new
        # attempt, which is a new Payment row.
        gateway = FakeGateway(fail_verify=True)
        settle_payment(self.payment, gateway)

        self.assertFalse(settle_payment(self.payment, self.gateway))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)

        fresh = start_payment(self.order, self.gateway)
        self.assertEqual(fresh.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertNotEqual(fresh.pk, self.payment.pk)
        self.assertTrue(settle_payment(fresh, self.gateway))
        fresh.refresh_from_db()
        self.assertEqual(fresh.status, Payment.PAYMENT_STATUS_SUCCESS)

    def test_refusing_twice_does_not_change_the_record_again(self):
        gateway = FakeGateway(fail_verify=True)
        self.assertFalse(settle_payment(self.payment, gateway))
        self.payment.refresh_from_db()
        first_seen = self.payment.verified_at

        # The second attempt cannot re-run the transition, and it must not move
        # the timestamp either, so the recorded failure stays the recorded one.
        self.assertFalse(settle_payment(self.payment, gateway))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)
        self.assertEqual(self.payment.verified_at, first_seen)
        self.assertEqual(gateway.verified.__len__(), 1)

    def test_a_refusal_only_touches_its_own_payment(self):
        gateway = FakeGateway(fail_verify=True)
        settle_payment(self.payment, gateway)

        # The order keeps exactly the one Payment, and no other row is invented
        # or altered by the failure.
        self.assertEqual(Payment.objects.filter(order=self.order).count(), 1)
        self.assertEqual(Payment.objects.get(pk=self.payment.pk).status,
                         Payment.PAYMENT_STATUS_FAILED)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.STATUS_CONFIRMED)
        self.assertEqual(self.order.total, self.order.total)

    def test_failed_payment_marks_failed_and_consumes_nothing(self):
        self.assertTrue(fail_payment(self.payment))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

    def test_a_settled_payment_cannot_be_walked_back(self):
        settle_payment(self.payment, self.gateway)
        self.assertFalse(fail_payment(self.payment))
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)

    def test_failed_then_settled_is_refused(self):
        fail_payment(self.payment)
        self.assertFalse(settle_payment(self.payment, self.gateway))

    def test_state_transition_is_a_single_conditional_update(self):
        claimed = Payment.objects.filter(
            pk=self.payment.pk, status=Payment.PAYMENT_STATUS_PENDING
        ).update(status=Payment.PAYMENT_STATUS_SUCCESS)
        second = Payment.objects.filter(
            pk=self.payment.pk, status=Payment.PAYMENT_STATUS_PENDING
        ).update(status=Payment.PAYMENT_STATUS_SUCCESS)

        self.assertEqual(claimed, 1)
        self.assertEqual(second, 0)

    def test_transaction_reference_is_unique(self):
        from django.db import IntegrityError, transaction

        settle_payment(self.payment, self.gateway)
        other = make_order(self.customer, self.product, quantity=1)
        other_payment = start_payment(other, self.gateway)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                other_payment.transaction_id = self.payment.transaction_id
                other_payment.save()


GATEWAY_SETTINGS = dict(
    ZARINPAL_MERCHANT_ID="test-merchant",
    ZARINPAL_API_BASE_URL="https://sandbox.zarinpal.com",
    PAYMENT_CALLBACK_BASE_URL="https://api.example.test",
    FRONTEND_BASE_URL="http://testserver",
)


class PaymentApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=10)
        self.order = make_order(self.customer, self.product, quantity=2)
        self.client.force_login(self.user)
        self.gateway = FakeGateway()

    def start(self, **overrides):
        data = {"order_code": self.order.order_code}
        data.update(overrides)
        return self.client.post(
            "/api/payments/zarinpal/request/", data=json.dumps(data),
            content_type="application/json",
        )

    def test_payment_request_returns_a_gateway_url(self):
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            response = self.start()

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn("payment_url", body)
        self.assertEqual(body["order_code"], self.order.order_code)
        self.assertEqual(Payment.objects.count(), 1)

    def test_client_cannot_override_the_amount(self):
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            response = self.start(
                amount=1, total=1, subtotal=1, discount=0, shipping_cost=0
            )

        self.assertEqual(response.status_code, 201)
        payment = Payment.objects.get()
        # 200000 subtotal + 30000 shipping, straight from the order.
        self.assertEqual(payment.amount, Decimal("230000"))
        self.assertEqual(self.gateway.requested[0]["amount"], Decimal("230000"))

    def test_client_cannot_set_status_or_transaction_id(self):
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            self.start(
                status=Payment.PAYMENT_STATUS_SUCCESS,
                transaction_id="FORGED",
                authority="FORGED",
            )

        payment = Payment.objects.get()
        self.assertEqual(payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertIsNone(payment.transaction_id)
        self.assertNotEqual(payment.authority, "FORGED")

    def test_order_ownership_is_enforced(self):
        other = make_user("bob", email="bob@example.com")
        self.client.force_login(other)
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            response = self.start()

        self.assertEqual(response.status_code, 400)
        self.assertIn("order_code", response.json())
        self.assertEqual(Payment.objects.count(), 0)

    def test_unknown_order_is_refused(self):
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            response = self.start(order_code="ORD-NOPE")
        self.assertEqual(response.status_code, 400)

    def test_gateway_unavailability_returns_502(self):
        gateway = FakeGateway()
        gateway.create_payment = mock.Mock(side_effect=GatewayError("down"))
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=gateway
        ):
            response = self.start()
        self.assertEqual(response.status_code, 502)
        self.assertEqual(Payment.objects.count(), 0)

    def test_missing_configuration_returns_503(self):
        with override_settings(ZARINPAL_MERCHANT_ID=""):
            response = self.start()
        self.assertEqual(response.status_code, 503)


class PaymentCallbackApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=10)
        self.order = make_order(self.customer, self.product, quantity=2)
        self.gateway = FakeGateway()
        self.payment = start_payment(self.order, self.gateway)
        self.client.force_login(self.user)

    def callback(self, **params):
        query = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"/api/payments/callback/{self.order.order_code}/"
        if query:
            url = f"{url}?{query}"
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            return self.client.get(url)

    def assertSentToResultPage(self, response, order_code):
        """
        The gateway return is a browser navigation, so it ends in a redirect to
        the storefront's result page rather than a JSON body. Where it goes is
        configuration, never anything from the query string.
        """
        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            response["Location"],
            f"http://testserver/payment/result?order={order_code}",
        )

    def test_valid_callback_settles_the_payment(self):
        response = self.callback(Status="OK", Authority=self.payment.authority)
        self.assertSentToResultPage(response, self.order.order_code)

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 8)

    def test_status_ok_alone_does_not_settle_without_verification(self):
        # The claim under test is that `Status=OK` in the URL settles nothing.
        # The gateway refuses to confirm, so the payment ends up failed -- still
        # not settled, which is the point.
        gateway = FakeGateway(fail_verify=True)
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=gateway
        ):
            response = self.client.get(
                f"/api/payments/callback/{self.order.order_code}/?Status=OK"
            )

        self.assertSentToResultPage(response, self.order.order_code)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_FAILED)
        self.assertIsNone(self.payment.transaction_id)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)
        self.assertEqual(DiscountModel.objects.count(), 0)

    def test_callback_redirect_cannot_be_steered_by_the_query_string(self):
        # The customer arrives from the gateway, so the redirect is a real
        # navigation. Its destination must not be readable from the URL, or
        # anyone could borrow this endpoint as an open redirector.
        response = self.callback(
            Status="OK",
            Authority=self.payment.authority,
            next="https://evil.example/steal",
            redirect_uri="https://evil.example/steal",
        )

        self.assertSentToResultPage(response, self.order.order_code)

    def test_duplicate_callback_is_a_no_op(self):
        self.callback(Status="OK", Authority=self.payment.authority)
        self.callback(Status="OK", Authority=self.payment.authority)
        self.callback(Status="OK", Authority=self.payment.authority)

        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 8)

    def test_duplicate_callback_grants_one_reward(self):
        self.callback(Status="OK", Authority=self.payment.authority)
        granted = DiscountModel.objects.count()
        self.callback(Status="OK", Authority=self.payment.authority)
        self.assertEqual(DiscountModel.objects.count(), granted)

    def test_forged_authority_does_not_settle(self):
        self.callback(Status="OK", Authority="FORGED-AUTHORITY")

        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertEqual(self.gateway.verified, [])

    def test_forged_order_code_is_harmless(self):
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            response = self.client.get(
                "/api/payments/callback/ORD-DOES-NOT-EXIST/?Status=OK"
            )
        self.assertSentToResultPage(response, "ORD-DOES-NOT-EXIST")
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)

    def test_gateway_network_failure_does_not_settle(self):
        gateway = FakeGateway(network_error=True)
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=gateway
        ):
            response = self.client.get(
                f"/api/payments/callback/{self.order.order_code}/?Status=OK"
            )

        self.assertSentToResultPage(response, self.order.order_code)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_PENDING)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

    def test_wrong_amount_verification_does_not_settle(self):
        # The gateway is told our own amount, so a mismatch can only mean the
        # row and the gateway disagree. Nothing irreversible happens.
        payment = Payment.objects.get(pk=self.payment.pk)
        Payment.objects.filter(pk=payment.pk).update(amount=Decimal("999999"))
        payment.refresh_from_db()

        response = self.callback(Status="OK", Authority=payment.authority)
        self.assertSentToResultPage(response, self.order.order_code)

        payment.refresh_from_db()
        self.assertEqual(payment.status, Payment.PAYMENT_STATUS_SUCCESS)
        self.assertEqual(
            self.gateway.verified[0]["amount"], Decimal("999999")
        )


class PaymentResultApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=10)
        self.order = make_order(self.customer, self.product, quantity=2)
        self.gateway = FakeGateway()
        self.client.force_login(self.user)

    def test_result_reports_pending_before_payment(self):
        response = self.client.get(
            f"/api/payments/result/?order_code={self.order.order_code}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["payment_status"], "pending")

    def test_result_reports_paid_after_settlement(self):
        payment = start_payment(self.order, self.gateway)
        settle_payment(payment, self.gateway)

        response = self.client.get(
            f"/api/payments/result/?order_code={self.order.order_code}"
        )
        self.assertEqual(response.json()["payment_status"], "paid")

    def test_result_never_comes_from_the_query_string(self):
        response = self.client.get(
            f"/api/payments/result/?order_code={self.order.order_code}&status=paid&success=true"
        )
        self.assertEqual(response.json()["payment_status"], "pending")

    def test_user_cannot_read_another_customers_result(self):
        other = make_user("bob", email="bob@example.com")
        self.client.force_login(other)
        response = self.client.get(
            f"/api/payments/result/?order_code={self.order.order_code}"
        )
        self.assertEqual(response.status_code, 400)

    def test_result_requires_the_order_code(self):
        self.assertEqual(self.client.get("/api/payments/result/").status_code, 400)

    def test_guest_reads_their_own_result_with_the_matching_email(self):
        # The result page is a GET, so the e-mail arrives in the query string.
        # Reading it from the request body instead made this flow unreachable.
        self.client.logout()
        guest = make_customer(email="guest@example.com")
        guest_order = make_order(guest, self.product, quantity=1)

        response = self.client.get(
            f"/api/payments/result/?order_code={guest_order.order_code}&email=guest@example.com"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["order_code"], guest_order.order_code)

    def test_guest_result_needs_the_exact_email(self):
        self.client.logout()
        guest = make_customer(email="guest2@example.com")
        guest_order = make_order(guest, self.product, quantity=1)

        wrong = self.client.get(
            f"/api/payments/result/?order_code={guest_order.order_code}&email=somebody@example.com"
        )
        missing = self.client.get(
            f"/api/payments/result/?order_code={guest_order.order_code}"
        )
        # The two refusals are indistinguishable, so the endpoint cannot be used
        # to discover which order codes exist.
        self.assertEqual(wrong.status_code, missing.status_code)
        self.assertEqual(wrong.json(), missing.json())


class DuplicatePaymentTests(TestCase):
    """
    One order, at most one live (pending) payment.

    A failed or successful payment must not block a retry, but two pending
    attempts on the same order would leave the shop unable to tell which
    authority a callback refers to.
    """

    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=10)
        self.order = make_order(self.customer, self.product, quantity=1)
        self.gateway = FakeGateway()

    def test_duplicate_request_reuses_the_same_payment(self):
        first = start_payment(self.order, self.gateway)
        second = start_payment(self.order, self.gateway)
        third = start_payment(self.order, self.gateway)

        self.assertEqual(first, second)
        self.assertEqual(second, third)
        self.assertEqual(Payment.objects.filter(status=Payment.PAYMENT_STATUS_PENDING).count(), 1)
        # The gateway was only asked to start one payment.
        self.assertEqual(len(self.gateway.requested), 1)

    def test_database_refuses_a_second_pending_payment(self):
        start_payment(self.order, self.gateway)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(
                    order=self.order,
                    amount=Decimal("100000"),
                    authority="SECOND-ATTEMPT",
                    status=Payment.PAYMENT_STATUS_PENDING,
                )

    def test_retry_is_allowed_after_failure(self):
        first = start_payment(self.order, self.gateway)
        fail_payment(first)

        second = start_payment(self.order, self.gateway)

        self.assertNotEqual(first, second)
        self.assertEqual(second.status, Payment.PAYMENT_STATUS_PENDING)
        self.assertEqual(Payment.objects.count(), 2)
        self.assertEqual(len(self.gateway.requested), 2)

    def test_retry_after_failure_can_succeed(self):
        first = start_payment(self.order, self.gateway)
        fail_payment(first)
        second = start_payment(self.order, self.gateway)

        self.assertTrue(settle_payment(second, FakeGateway(reference="SECOND-REF")))
        second.refresh_from_db()
        self.assertEqual(second.status, Payment.PAYMENT_STATUS_SUCCESS)
        # The abandoned attempt did not consume stock.
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 9)

    def test_no_new_payment_after_success(self):
        payment = start_payment(self.order, self.gateway)
        settle_payment(payment, self.gateway)

        with self.assertRaises(PaymentError):
            get_payable_order(self.order)
        self.assertEqual(Payment.objects.count(), 1)

    def test_api_rejects_a_second_request_for_a_paid_order(self):
        self.client.force_login(self.user)
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            payment = start_payment(self.order, self.gateway)
            settle_payment(payment, self.gateway)

            response = self.client.post(
                "/api/payments/zarinpal/request/",
                data=json.dumps({"order_code": self.order.order_code}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Payment.objects.count(), 1)

    def test_duplicate_api_requests_create_one_payment(self):
        self.client.force_login(self.user)
        with override_settings(**GATEWAY_SETTINGS), mock.patch(
            "store.views._gateway", return_value=self.gateway
        ):
            responses = [
                self.client.post(
                    "/api/payments/zarinpal/request/",
                    data=json.dumps({"order_code": self.order.order_code}),
                    content_type="application/json",
                )
                for _ in range(3)
            ]

        self.assertEqual({r.status_code for r in responses}, {201})
        self.assertEqual(Payment.objects.count(), 1)
        # Every response points at the same authority.
        self.assertEqual(len({r.json()["payment_url"] for r in responses}), 1)


class InventoryRaceTests(TestCase):
    """
    A captured payment is never rolled back because of stock.

    The gateway has already taken the money, so the order must stay paid even
    when there is not enough stock to fulfil it. Rolling the transaction back
    would leave a customer who has paid holding a pending payment.
    """

    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.product = make_product(price="100000", inventory=1)
        self.order = make_order(self.customer, self.product, quantity=1)
        self.gateway = FakeGateway()
        self.payment = start_payment(self.order, self.gateway)

    def test_payment_succeeds_even_when_stock_ran_short(self):
        # Another order already took the last unit.
        other = make_order(self.customer, self.product, quantity=1)
        from .orders import reserve_inventory

        reserve_inventory(other)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 0)

        with self.assertLogs("store.orders", level="WARNING"):
            settled = settle_payment(self.payment, self.gateway)

        self.assertTrue(settled)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)

    def test_payment_is_not_rolled_back_by_a_stock_problem(self):
        other = make_order(self.customer, self.product, quantity=1)
        from .orders import reserve_inventory

        reserve_inventory(other)

        with self.assertLogs("store.orders", level="WARNING"):
            settle_payment(self.payment, self.gateway)

        self.payment.refresh_from_db()
        # Still settled, still carries its reference: the money is recorded.
        self.assertEqual(self.payment.status, Payment.PAYMENT_STATUS_SUCCESS)
        self.assertEqual(self.payment.transaction_id, "REF-000001")

    def test_rewards_are_granted_even_when_stock_ran_short(self):
        other = make_order(self.customer, self.product, quantity=1)
        from .orders import reserve_inventory

        reserve_inventory(other)

        with self.assertLogs("store.orders", level="WARNING"):
            settle_payment(self.payment, self.gateway)

        # A paid purchase qualifies whatever the stock did: the order is
        # marked as having been processed for rewards.
        self.order.refresh_from_db()
        self.assertIsNotNone(self.order.referral_processed_at)

    def test_sufficient_stock_is_consumed_normally(self):
        self.product.inventory = 5
        self.product.save()

        settle_payment(self.payment, self.gateway)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 4)

    def test_consumption_uses_an_atomic_decrement(self):
        """No lost update when two payments settle at the same moment."""
        self.product.inventory = 2
        self.product.save()

        orders = [make_order(self.customer, self.product, quantity=1) for _ in range(2)]
        # Reuse the gateway from setUp so each attempt gets a fresh authority
        # instead of colliding with the one already recorded.
        for order in orders:
            settle_payment(start_payment(order, self.gateway), self.gateway)

        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 0)

    def test_release_restores_stock(self):
        from .orders import release_inventory, reserve_inventory

        reserve_inventory(self.order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 0)

        release_inventory(self.order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 1)


class PaymentOwnershipTests(TestCase):
    def setUp(self):
        cache.clear()
        self.sara = make_user("sara")
        self.bob = make_user("bob", email="bob@example.com")
        self.sara_customer = make_customer(user=self.sara)
        self.bob_customer = make_customer(user=self.bob)
        self.order = make_order(self.sara_customer)

    def test_user_cannot_pay_for_another_customers_order(self):
        from store.views import _find_payable_order
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.post("/", {})
        request.user = self.bob

        with self.assertRaises(PaymentError):
            _find_payable_order(request, self.order.order_code)

    def test_user_can_pay_for_their_own_order(self):
        from store.views import _find_payable_order
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.post("/", {})
        request.user = self.sara

        found = _find_payable_order(request, self.order.order_code)
        self.assertEqual(found, self.order)

    def test_guest_needs_the_order_email(self):
        from store.views import _find_payable_order
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import AnonymousUser

        factory = APIRequestFactory()

        request = factory.post("/", {})
        request.data = {}
        request.user = AnonymousUser()
        with self.assertRaises(PaymentError):
            _find_payable_order(request, self.order.order_code)

        request = factory.post("/", {})
        request.data = {"email": self.sara.email}
        request.user = AnonymousUser()
        self.assertEqual(_find_payable_order(request, self.order.order_code), self.order)

    def test_guest_with_wrong_email_is_refused(self):
        from store.views import _find_payable_order
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth.models import AnonymousUser

        factory = APIRequestFactory()
        request = factory.post("/", {})
        request.data = {"email": "wrong@example.com"}
        request.user = AnonymousUser()

        with self.assertRaises(PaymentError):
            _find_payable_order(request, self.order.order_code)
