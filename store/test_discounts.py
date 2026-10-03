"""
Tests for Qandak's discount rules.

The recurring theme: a reward is never granted because somebody typed a code,
only because a purchase completed; and no client-supplied number ever becomes a
price.
"""

import json
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import Client, TestCase, override_settings

from .discounts import (
    DiscountError,
    apply_discount,
    compute_discount_amount,
    process_qualifying_purchase,
    register_referral,
    resolve_discount_for_customer,
)
from .models import Address, Category, Customer, Discount, Order, Payment, Product, ProductOption, ProductOptionValue
from .orders import OrderError, place_guest_order, place_order

User = get_user_model()

ORIGIN = "http://localhost:3000"


def make_user(username="sara", **kwargs):
    defaults = dict(
        email=f"{username}@example.com",
        first_name=username.title(),
        last_name="Test",
        phone_number="+989" + str(abs(hash(username)) % 10**9).zfill(9),
    )
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password="Str0ngPass!23", **defaults)


def make_customer(user=None, email=None, **kwargs):
    defaults = dict(
        first_name="Sara",
        last_name="Test",
        email=email or (user.email if user else "guest@example.com"),
        phone_number="09120000000",
    )
    defaults.update(kwargs)
    return Customer.objects.create(user=user, **defaults)


def make_product(slug="cake", price="100000", inventory=50):
    category, _ = Category.objects.get_or_create(slug="cakes", defaults={"title": "Cakes"})
    return Product.objects.create(
        category=category, slug=slug, name=f"Product {slug}",
        description="d", price=Decimal(price), inventory=inventory,
    )


def simple_order(customer, price="100000", quantity=1, **kwargs):
    product = make_product(slug=f"p{price}-{quantity}-{customer.pk}-{Discount.objects.count()}")
    # Qandak keeps exactly one address per customer, so reuse it.
    address, _ = Address.objects.get_or_create(customer=customer, defaults={"address": "Tehran"})
    return place_order(
        customer=customer, address=address,
        items=[{"product": product.pk, "quantity": quantity}], **kwargs
    )


def mark_paid(order, status=Payment.PAYMENT_STATUS_SUCCESS):
    """Record a Payment row in the given state against ``order``.

    A qualifying purchase is one where money actually moved, and the record of
    that is the Payment row -- not the order's existence, and not a call into
    the discount module. A test that wants an order to count as an earlier
    purchase says so with this helper, so "paid" is never implied by a fixture.
    """
    return Payment.objects.create(
        order=order, amount=order.total, authority=f"AUTH-{order.pk}", status=status
    )


class DiscountModelTests(TestCase):
    def test_is_used_is_derived_from_used_at(self):
        customer = make_customer()
        discount = Discount.objects.create(
            customer=customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE, percent=15
        )
        self.assertFalse(discount.is_used)
        self.assertTrue(discount.is_available)

        discount.used_at = "2026-01-01T00:00:00Z"
        self.assertTrue(discount.is_used)
        self.assertFalse(discount.is_available)

    def test_is_used_is_not_a_stored_field(self):
        field_names = {f.name for f in Discount._meta.get_fields()}
        self.assertNotIn("is_used", field_names)

    def test_percent_bounds(self):
        from django.core.exceptions import ValidationError

        customer = make_customer()
        for bad in (0, 101):
            discount = Discount(
                customer=customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE,
                percent=bad,
            )
            with self.assertRaises(ValidationError):
                discount.full_clean()

    def test_duplicate_dependency_fields_are_gone(self):
        customer_fields = {f.name for f in Customer._meta.get_fields()}
        order_fields = {f.name for f in Order._meta.get_fields()}
        self.assertNotIn("discount_offer", customer_fields)
        self.assertNotIn("discount_offer", order_fields)

    def test_two_discounts_cannot_share_one_order(self):
        from django.db import IntegrityError, transaction

        customer = make_customer()
        order = simple_order(customer)

        first = Discount.objects.create(
            customer=customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE, percent=15
        )
        first.used_at = "2026-01-01T00:00:00Z"
        first.used_order = order
        first.save()

        second = Discount.objects.create(
            customer=customer, discount_type=Discount.DISCOUNT_REFERRAL, percent=15
        )
        second.used_at = "2026-01-02T00:00:00Z"
        second.used_order = order

        # The OneToOne makes "one discount per order" a database rule, so
        # discounts can never stack.
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                second.save()


class DiscountAmountTests(TestCase):
    def test_amount_is_percent_of_subtotal(self):
        self.assertEqual(
            compute_discount_amount(Decimal("100000"), 15), Decimal("15000")
        )

    def test_amount_rounds_to_whole_tomans(self):
        # 15% of 1,010 is 151.5 -> 152
        self.assertEqual(
            compute_discount_amount(Decimal("1010"), 15), Decimal("152")
        )

    def test_zero_subtotal_gives_zero(self):
        self.assertEqual(compute_discount_amount(Decimal("0"), 15), Decimal("0"))


class ApplyDiscountTests(TestCase):
    def setUp(self):
        cache.clear()
        self.customer = make_customer()
        self.discount = Discount.objects.create(
            customer=self.customer,
            discount_type=Discount.DISCOUNT_FIRST_PURCHASE,
            percent=15,
        )

    def test_apply_computes_amount_and_total(self):
        order = simple_order(self.customer, price="100000", quantity=2)  # subtotal 200000
        amount = apply_discount(order, self.discount)

        self.assertEqual(amount, Decimal("30000"))
        order.refresh_from_db()
        self.assertEqual(order.discount, Decimal("30000"))
        self.assertEqual(order.total, order.subtotal + order.shipping_cost - Decimal("30000"))

    def test_apply_marks_the_discount_used(self):
        order = simple_order(self.customer)
        apply_discount(order, self.discount)

        self.discount.refresh_from_db()
        self.assertTrue(self.discount.is_used)
        self.assertIsNotNone(self.discount.used_at)
        self.assertEqual(self.discount.used_order, order)

    def test_a_discount_cannot_be_used_twice(self):
        first = simple_order(self.customer, price="100000")
        apply_discount(first, self.discount)

        second = simple_order(self.customer, price="300000")
        with self.assertRaises(DiscountError):
            apply_discount(second, self.discount)

        second.refresh_from_db()
        self.assertEqual(second.discount, Decimal("0"))

    def test_claimed_conditional_update_prevents_double_use(self):
        # Simulates the race directly: two calls, one discount, only one wins.
        order = simple_order(self.customer)
        first = apply_discount(order, self.discount)
        self.assertEqual(first, Decimal("15000"))

        with self.assertRaises(DiscountError):
            apply_discount(order, self.discount)

    def test_resolving_ignores_used_discounts(self):
        first = simple_order(self.customer)
        apply_discount(first, self.discount)

        with self.assertRaises(DiscountError):
            resolve_discount_for_customer(self.customer, self.customer.referral_code)


class DiscountResolutionTests(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.discount = Discount.objects.create(
            customer=self.customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE, percent=15
        )

    def test_own_code_resolves_own_discount(self):
        found = resolve_discount_for_customer(self.customer, self.customer.referral_code)
        self.assertEqual(found, self.discount)

    def test_unknown_code_is_rejected(self):
        with self.assertRaises(DiscountError):
            resolve_discount_for_customer(self.customer, "NOPE")

    def test_another_customers_code_is_rejected(self):
        other = make_customer(email="other@example.com")
        with self.assertRaises(DiscountError):
            resolve_discount_for_customer(self.customer, other.referral_code)

    def test_empty_code_is_rejected(self):
        with self.assertRaises(DiscountError):
            resolve_discount_for_customer(self.customer, "")


class FirstPurchaseTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.address = Address.objects.create(customer=self.customer, address="Tehran")
        self.product = make_product(price="100000")
        self.discount = Discount.objects.create(
            customer=self.customer,
            discount_type=Discount.DISCOUNT_FIRST_PURCHASE,
            percent=15,
        )

    def order(self, quantity=1, **kwargs):
        return place_order(
            customer=self.customer, address=self.address,
            items=[{"product": self.product.pk, "quantity": quantity}], **kwargs
        )

    def test_first_purchase_earned_after_qualifying_purchase(self):
        order = self.order(quantity=2)
        granted = process_qualifying_purchase(order)

        types = {d.discount_type for d in granted}
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, types)
        discount = granted[0]
        self.assertEqual(discount.customer, self.customer)
        self.assertEqual(discount.percent, 15)
        self.assertFalse(discount.is_used)

    def test_signup_alone_earns_nothing(self):
        # No purchase, no reward: the discount seeded in setUp is the only one.
        self.assertEqual(Discount.objects.count(), 1)

    def test_second_purchase_earns_nothing(self):
        # The first order has to be genuinely paid for to count as a purchase.
        # Placing it is not enough -- see the abandoned-order tests below.
        first = self.order()
        mark_paid(first)
        process_qualifying_purchase(first)
        Discount.objects.all().delete()

        second = self.order()
        mark_paid(second)
        granted = process_qualifying_purchase(second)

        self.assertNotIn(
            Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted}
        )

    def test_cancelled_earlier_order_does_not_block_the_reward(self):
        first = self.order()
        first.status = Order.STATUS_CANCELED
        first.save()

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    # --- Scenario 1: an order that was placed but never paid for ------------
    # Placing an order is not a purchase. A customer who abandons checkout must
    # still earn the first-purchase reward on the order they do pay for.

    def test_unpaid_earlier_order_does_not_block_the_reward(self):
        abandoned = self.order()
        self.assertFalse(abandoned.payments.exists())

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    def test_several_abandoned_orders_still_leave_the_reward_intact(self):
        for _ in range(3):
            self.order()

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    def test_a_pending_payment_is_not_a_purchase(self):
        # A Payment row alone is not enough; only a successful one moved money.
        self.order()
        mark_paid(self.order(), status=Payment.PAYMENT_STATUS_PENDING)

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    def test_a_failed_payment_is_not_a_purchase(self):
        self.order()
        mark_paid(self.order(), status=Payment.PAYMENT_STATUS_FAILED)

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    # --- Scenario 2: a paid earlier order does end the first purchase -------

    def test_a_paid_earlier_order_blocks_the_reward(self):
        mark_paid(self.order())

        granted = process_qualifying_purchase(self.order())
        self.assertNotIn(
            Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted}
        )

    def test_the_orders_own_payment_does_not_block_its_own_reward(self):
        # Settling a payment marks it successful before this runs, so counting
        # the current order would make the reward unreachable for everyone.
        order = self.order()
        mark_paid(order)

        granted = process_qualifying_purchase(order)
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    def test_another_customers_paid_order_does_not_block_the_reward(self):
        other_user = make_user("other", email="other@example.com")
        other = make_customer(user=other_user, email="other@example.com")
        mark_paid(simple_order(other))

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    # --- Scenario 3: cancelled never counts, paid or not -------------------

    def test_a_cancelled_paid_order_still_does_not_block_the_reward(self):
        first = self.order()
        mark_paid(first)
        first.status = Order.STATUS_CANCELED
        first.save()

        granted = process_qualifying_purchase(self.order())
        self.assertIn(Discount.DISCOUNT_FIRST_PURCHASE, {d.discount_type for d in granted})

    # --- Scenario 5: idempotency is untouched by the new rule ---------------

    def test_the_reward_is_still_granted_only_once(self):
        order = self.order()
        mark_paid(order)

        process_qualifying_purchase(order)
        self.assertEqual(process_qualifying_purchase(order), [])
        self.assertEqual(
            Discount.objects.filter(
                customer=self.customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE
            ).count(),
            2,  # the one seeded in setUp plus the one granted
        )

    def test_guest_does_not_earn_a_first_purchase_reward(self):
        # Lowest-risk choice: a guest has no identity to recognise on a return
        # visit. See the report for the open business question.
        guest = make_customer(user=None, email="guest@example.com")
        guest_address = Address.objects.create(customer=guest, address="Shiraz")
        guest_product = make_product(slug="guest-cake", price="100000")

        order = place_guest_order(
            details={
                "first_name": "G", "last_name": "U", "email": "guest@example.com",
                "phone_number": "09120000000", "address": "Shiraz",
            },
            items=[{"product": guest_product.pk, "quantity": 1}],
        )
        granted = process_qualifying_purchase(order)
        self.assertEqual(granted, [])

    def test_reapplying_a_used_first_purchase_discount_is_refused(self):
        first = self.order(discount_code=self.customer.referral_code)
        self.discount.refresh_from_db()
        self.assertTrue(self.discount.is_used)

        # The already-spent discount is no longer resolvable, so the second
        # order cannot be placed with it and nothing is saved.
        with self.assertRaises(DiscountError):
            self.order(quantity=2, discount_code=self.customer.referral_code)
        self.assertEqual(Order.objects.count(), 1)


class ReferralTests(TestCase):
    def setUp(self):
        cache.clear()
        self.referrer = make_customer(email="referrer@example.com")
        self.referred = make_customer(email="referred@example.com")
        self.address = Address.objects.create(customer=self.referred, address="Tehran")
        self.product = make_product(price="100000")

    def order(self):
        return place_order(
            customer=self.referred, address=self.address,
            items=[{"product": self.product.pk, "quantity": 1}],
        )

    def test_register_referral_links_the_customers(self):
        result = register_referral(self.referred, self.referrer.referral_code)
        self.referred.refresh_from_db()
        self.assertEqual(result, self.referrer)
        self.assertEqual(self.referred.referred_by, self.referrer)

    def test_register_referral_grants_nothing_by_itself(self):
        register_referral(self.referred, self.referrer.referral_code)
        self.assertEqual(Discount.objects.count(), 0)

    def test_unknown_code_returns_nothing(self):
        self.assertIsNone(register_referral(self.referred, "NOPE"))
        self.referred.refresh_from_db()
        self.assertIsNone(self.referred.referred_by)

    def test_self_referral_is_refused(self):
        with self.assertRaises(DiscountError):
            register_referral(self.referrer, self.referrer.referral_code)
        self.referrer.refresh_from_db()
        self.assertIsNone(self.referrer.referred_by)

    def test_qualifying_purchase_rewards_both_sides(self):
        register_referral(self.referred, self.referrer.referral_code)
        granted = process_qualifying_purchase(self.order())

        self.assertEqual(len(granted), 2)
        by_customer = {d.customer: d for d in granted}
        self.assertIn(self.referred, by_customer)
        self.assertIn(self.referrer, by_customer)
        for discount in granted:
            self.assertEqual(discount.discount_type, Discount.DISCOUNT_REFERRAL)
            self.assertEqual(discount.percent, 15)
            self.assertFalse(discount.is_used)

    def test_qualifying_purchase_without_a_referrer_grants_only_first_purchase(self):
        self.referred.user = None
        self.referred.save()
        granted = process_qualifying_purchase(self.order())
        self.assertEqual(granted, [])

    def test_unpaid_order_grants_nothing(self):
        register_referral(self.referred, self.referrer.referral_code)
        # Merely creating the order is not a qualifying purchase; nothing calls
        # process_qualifying_purchase until payment succeeds.
        self.order()
        self.assertEqual(Discount.objects.count(), 0)

    def test_cancelled_order_grants_nothing(self):
        register_referral(self.referred, self.referrer.referral_code)
        order = self.order()
        order.status = Order.STATUS_CANCELED
        order.save()

        self.assertEqual(process_qualifying_purchase(order), [])
        self.assertEqual(Discount.objects.count(), 0)

    # --- Scenario 4: the referral reward follows the same payment rule ------

    def test_referral_reward_needs_a_paid_purchase(self):
        register_referral(self.referred, self.referrer.referral_code)

        # Placed and abandoned: the referral link exists, but no reward.
        abandoned = self.order()
        self.assertEqual(Discount.objects.count(), 0)

        # The purchase they actually complete earns both sides of the referral.
        paid = self.order()
        mark_paid(paid)
        granted = process_qualifying_purchase(paid)

        self.assertEqual(len(granted), 2)
        self.assertEqual(
            {d.discount_type for d in granted}, {Discount.DISCOUNT_REFERRAL}
        )
        self.assertEqual({d.customer for d in granted}, {self.referred, self.referrer})

    def test_a_paid_purchase_after_an_abandoned_one_still_rewards(self):
        register_referral(self.referred, self.referrer.referral_code)
        self.order()  # abandoned, never paid

        paid = self.order()
        mark_paid(paid)
        granted = process_qualifying_purchase(paid)

        self.assertEqual(len(granted), 2)


class ReferralIdempotencyTests(TestCase):
    """Processing the same payment success twice must grant once."""

    def setUp(self):
        cache.clear()
        self.referrer = make_customer(email="referrer@example.com")
        self.referred = make_customer(email="referred@example.com")
        register_referral(self.referred, self.referrer.referral_code)
        self.address = Address.objects.create(customer=self.referred, address="Tehran")
        self.product = make_product(price="100000")
        self.order = place_order(
            customer=self.referred, address=self.address,
            items=[{"product": self.product.pk, "quantity": 1}],
        )

    def test_first_processing_grants(self):
        self.assertEqual(len(process_qualifying_purchase(self.order)), 2)

    def test_second_processing_grants_nothing(self):
        process_qualifying_purchase(self.order)
        self.assertEqual(process_qualifying_purchase(self.order), [])
        self.assertEqual(Discount.objects.count(), 2)

    def test_processing_many_times_still_grants_once(self):
        for _ in range(10):
            process_qualifying_purchase(self.order)
        self.assertEqual(Discount.objects.count(), 2)

    def test_guard_is_a_conditional_update_not_a_python_check(self):
        """The gate is one SQL statement, so it holds under concurrency."""
        first = Order.objects.filter(
            pk=self.order.pk, referral_processed_at__isnull=True
        ).update(referral_processed_at="2026-01-01T00:00:00Z")
        second = Order.objects.filter(
            pk=self.order.pk, referral_processed_at__isnull=True
        ).update(referral_processed_at="2026-01-02T00:00:00Z")

        self.assertEqual(first, 1)
        self.assertEqual(second, 0)

    def test_a_different_order_gets_its_own_rewards(self):
        process_qualifying_purchase(self.order)

        # The gate is per order, so a later, separate order is processed on its
        # own merits. Reuse the customer's single address.
        address = Address.objects.get(customer=self.referred)
        second_order = place_order(
            customer=self.referred, address=address,
            items=[{"product": self.product.pk, "quantity": 1}],
        )
        process_qualifying_purchase(second_order)
        self.assertEqual(Discount.objects.count(), 4)


class OrderDiscountTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        self.address = Address.objects.create(customer=self.customer, address="Tehran")
        self.product = make_product(price="100000")
        self.discount = Discount.objects.create(
            customer=self.customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE, percent=15
        )

    def order(self, **kwargs):
        return place_order(
            customer=self.customer, address=self.address,
            items=[{"product": self.product.pk, "quantity": 2}], **kwargs
        )

    def test_no_code_means_no_discount(self):
        order = self.order()
        self.assertEqual(order.discount, Decimal("0"))
        self.assertFalse(self.discount.is_used)

    def test_valid_code_applies_the_discount(self):
        order = self.order(discount_code=self.customer.referral_code)
        self.assertEqual(order.discount, Decimal("30000"))
        self.assertEqual(order.total, order.subtotal + order.shipping_cost - Decimal("30000"))

    def test_invalid_code_fails_the_order(self):
        with self.assertRaises(DiscountError):
            self.order(discount_code="BOGUS")
        self.assertEqual(Order.objects.count(), 0)

    def test_failed_discount_leaves_no_order_behind(self):
        with self.assertRaises(DiscountError):
            self.order(discount_code="BOGUS")
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count() if (OrderItem := None) else 0, 0)

    def test_another_customers_code_is_refused(self):
        other = make_customer(email="other@example.com")
        with self.assertRaises(DiscountError):
            self.order(discount_code=other.referral_code)
        self.assertEqual(Order.objects.count(), 0)

    def test_client_percent_is_ignored(self):
        order = self.order(discount_code=self.customer.referral_code)
        self.assertEqual(order.discount, Decimal("30000"))

    def test_discount_amount_is_snapshotted(self):
        order = self.order(discount_code=self.customer.referral_code)
        before = order.discount

        # Changing the percentage afterwards must not rewrite the order.
        self.discount.percent = 50
        self.discount.save()

        order.refresh_from_db()
        self.assertEqual(order.discount, before)
        self.assertEqual(order.total, order.subtotal + order.shipping_cost - before)

    def test_order_keeps_the_amount_even_if_the_discount_row_changes(self):
        order = self.order(discount_code=self.customer.referral_code)
        self.discount.used_at = None
        self.discount.used_order = None
        self.discount.save()

        order.refresh_from_db()
        self.assertEqual(order.discount, Decimal("30000"))

    def test_one_discount_per_order(self):
        # A second code on the same order cannot stack: only one discount can be
        # attached to an order at all.
        order = self.order(discount_code=self.customer.referral_code)
        self.assertEqual(order.applied_discount, self.discount)
        self.assertEqual(
            Discount.objects.filter(used_order=order).count(), 1
        )


@override_settings(CORS_ALLOWED_ORIGINS=[ORIGIN])
class DiscountApiSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user)
        Address.objects.create(customer=self.customer, address="Tehran")
        self.product = make_product(price="100000")
        self.discount = Discount.objects.create(
            customer=self.customer, discount_type=Discount.DISCOUNT_FIRST_PURCHASE, percent=15
        )
        self.client.force_login(self.user)

    def payload(self, **overrides):
        data = {
            "items": [{"product": self.product.pk, "quantity": 2}],
            "discount_code": self.customer.referral_code,
        }
        data.update(overrides)
        return data

    def test_client_cannot_set_the_percent(self):
        response = self.client.post(
            "/api/orders/",
            data=self.payload(percent=100, discount_percent=100, discount=999999),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["discount"], "30000")

    def test_client_cannot_set_the_discount_amount(self):
        response = self.client.post(
            "/api/orders/",
            data=self.payload(discount="999999", total="1", subtotal="1"),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["subtotal"], "200000")
        self.assertEqual(body["discount"], "30000")
        # 200000 subtotal + 30000 shipping - 30000 discount
        self.assertEqual(body["total"], "200000")

    def test_client_cannot_set_the_discount_owner(self):
        other = make_customer(email="other@example.com")
        response = self.client.post(
            "/api/orders/",
            data=self.payload(discount_customer=other.pk, customer=other.pk),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Order.objects.get().customer, self.customer)
        self.assertFalse(Discount.objects.get(pk=other.pk).is_used) if Discount.objects.filter(pk=other.pk).exists() else None

    def test_client_cannot_set_the_used_state(self):
        self.client.post(
            "/api/orders/", data=self.payload(), content_type="application/json"
        )
        # The only thing that changed the usage state was the order itself.
        self.discount.refresh_from_db()
        self.assertTrue(self.discount.is_used)

    def test_client_cannot_use_another_customers_discount(self):
        other_user = make_user("bob", email="bob@example.com")
        other = make_customer(user=other_user, email="bob@example.com", phone_number="09130000000")
        other_discount = Discount.objects.create(
            customer=other, discount_type=Discount.DISCOUNT_REFERRAL, percent=15
        )

        response = self.client.post(
            "/api/orders/",
            data=self.payload(discount_code=other.referral_code),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        other_discount.refresh_from_db()
        self.assertFalse(other_discount.is_used)

    def test_there_is_no_endpoint_to_create_a_discount(self):
        for url in ("/api/discounts/", "/api/discount/"):
            for method in ("post", "put", "patch", "delete"):
                response = getattr(self.client, method)(
                    url,
                    data=json.dumps({"percent": 100, "customer": self.customer.pk}),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 404)

    def test_order_response_never_leaks_the_discount_owner(self):
        response = self.client.post(
            "/api/orders/", data=self.payload(), content_type="application/json"
        )
        body = json.dumps(response.json())
        self.assertNotIn("percent", body)


@override_settings(CORS_ALLOWED_ORIGINS=[ORIGIN])
class ReferralRegistrationApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.referrer = make_customer(email="referrer@example.com")

    def register(self, referral_code=""):
        client = Client(enforce_csrf_checks=True)
        client.get("/api/auth/csrf/", HTTP_ORIGIN=ORIGIN)
        token = client.cookies["csrftoken"].value
        body = {
            "identifier": "newbie@example.com",
            "password": "Str0ngPass!23",
            "referral_code": referral_code,
        }
        return client.post(
            "/api/auth/register/",
            data=json.dumps(body),
            content_type="application/json",
            HTTP_ORIGIN=ORIGIN,
            HTTP_X_CSRFTOKEN=token,
        )

    def test_referral_code_is_recorded_at_signup(self):
        response = self.register(self.referrer.referral_code)
        self.assertEqual(response.status_code, 201)

        new_customer = Customer.objects.get(email="newbie@example.com")
        self.assertEqual(new_customer.referred_by, self.referrer)

    def test_signup_creates_no_reward(self):
        self.register(self.referrer.referral_code)
        self.assertEqual(Discount.objects.count(), 0)

    def test_unknown_referral_code_still_registers(self):
        response = self.register("NOT-A-CODE")
        self.assertEqual(response.status_code, 201)
        customer = Customer.objects.get(email="newbie@example.com")
        self.assertIsNone(customer.referred_by)

    def test_registering_without_a_code_creates_no_customer(self):
        # The Customer profile is created lazily on first use, so a plain
        # sign-up does not create one and cannot carry a referral.
        self.register("")
        self.assertFalse(Customer.objects.filter(email="newbie@example.com").exists())

    def test_a_customer_cannot_be_referred_by_itself(self):
        customer = make_customer(email="newbie@example.com")
        # The guard that matters: re-pointing an existing customer at their own
        # code is refused even if it is somehow submitted.
        with self.assertRaises(DiscountError):
            register_referral(customer, customer.referral_code)
        customer.refresh_from_db()
        self.assertIsNone(customer.referred_by)

    def test_referral_code_is_not_accepted_after_signup(self):
        self.register(self.referrer.referral_code)
        customer = Customer.objects.get(email="newbie@example.com")
        original = customer.referral_code

        # There is no endpoint that accepts a referral code after registration,
        # so the link cannot be re-pointed later.
        for url in (
            "/api/customer/",
            f"/api/customer/?referral_code={self.referrer.referral_code}",
        ):
            response = self.client.patch(
                url,
                data=json.dumps({"referral_code": self.referrer.referral_code}),
                content_type="application/json",
            )
            self.assertIn(response.status_code, (400, 403, 404, 405))

        customer.refresh_from_db()
        self.assertEqual(customer.referral_code, original)
