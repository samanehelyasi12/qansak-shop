"""
Tests for order placement.

The theme is that the server decides the money: what the client may say is
limited to *which* product, *how many*, and *which options*. Everything else is
computed here and stored as a snapshot.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connection
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from unittest import mock

from .models import (
    Address,
    Category,
    Customer,
    Order,
    OrderItem,
    Product,
    ProductOption,
    ProductOptionValue,
)
from .orders import OrderError, parse_items, place_order

User = get_user_model()

ORDERS_URL = "/api/orders/"


def make_user(username="sara", **kwargs):
    defaults = dict(
        email=f"{username}@example.com",
        first_name="Sara",
        last_name="Ahmadi",
        phone_number="+989" + str(abs(hash(username)) % 10**9).zfill(9),
    )
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password="Str0ngPass!23", **defaults)


def make_customer(user=None, **kwargs):
    defaults = dict(
        first_name="Sara",
        last_name="Ahmadi",
        email="sara@example.com",
        phone_number="+989123456789",
    )
    defaults.update(kwargs)
    return Customer.objects.create(user=user, **defaults)


def make_product(slug="cake", name="Truffle Cake", price="850000", inventory=10, **kwargs):
    category, _ = Category.objects.get_or_create(slug="cakes", defaults={"title": "Cakes"})
    return Product.objects.create(
        category=category,
        slug=slug,
        name=name,
        description="Nice",
        price=Decimal(price),
        inventory=inventory,
        **kwargs,
    )


def with_size_options(product, deltas=(("1kg", 0), ("2kg", 620000))):
    option = ProductOption.objects.create(product=product, name="Size", slug="size")
    for label, delta in deltas:
        ProductOptionValue.objects.create(
            option=option, label=label, slug=label, price_delta=Decimal(str(delta))
        )
    return option


class OrderQueryCountTests(TestCase):
    """Ordering a basket must not cost a lookup per line.

    Every line used to be resolved on its own -- a query for the product, one for
    its options, one per chosen option value -- and the choices were then resolved
    twice more while pricing the line and writing its snapshot. That made the
    number of queries grow with the size of the basket, for data that is the same
    for every line. The lookups are now done once for the whole order, so the only
    thing that still grows is the one row written per line.
    """

    def setUp(self):
        cache.clear()
        self.customer = make_customer()
        self.address = Address.objects.create(
            customer=self.customer, address="Tehran, Valiasr St. 12"
        )
        self.products = [make_product(slug=f"line-{i}") for i in range(8)]
        for product in self.products:
            with_size_options(product)

    def basket(self, count):
        return [
            {"product": p.pk, "quantity": 2, "selected_options": {"size": "2kg"}}
            for p in self.products[:count]
        ]

    def test_a_bigger_basket_does_not_cost_more_lookups(self):
        def queries_for(count):
            with CaptureQueriesContext(connection) as captured:
                order = place_order(
                    customer=self.customer, address=self.address,
                    items=self.basket(count),
                )
            # One row is written per line, so that part may grow.
            self.assertEqual(order.items.count(), count)
            return len(captured)

        one = queries_for(1)
        six = queries_for(6)

        # Six lines may cost at most one extra query each over one line -- the
        # OrderItem insert. Anything more means a lookup came back per line.
        self.assertLessEqual(six, one + 5)

    def test_parsing_the_basket_issues_a_fixed_number_of_queries(self):
        items = self.basket(8)
        with CaptureQueriesContext(connection) as captured:
            parsed = parse_items(items)

        self.assertEqual(len(parsed), 8)
        # Reading a basket must be constant-cost: the products, their options and
        # the option values. Not one query per line.
        self.assertLessEqual(len(captured), 4)

    def test_each_line_resolves_its_options_only_once(self):
        """The resolved choices are reused, not looked up three times per line.

        Pricing a line and writing its snapshot used to each call resolve_values
        again, on top of the call that validated the line. The prefetch alone makes
        those extra calls free of queries, so this is pinned separately: it is
        about not repeating the work, not about the query count.
        """
        from store import orders as orders_module

        real = orders_module.resolve_values
        seen = []

        def spy(product, selections):
            seen.append(product.pk)
            return real(product, selections)

        items = self.basket(5)
        with mock.patch.object(orders_module, "resolve_values", spy):
            order = place_order(customer=self.customer, address=self.address, items=items)

        self.assertEqual(order.items.count(), 5)
        # Exactly once per line: validation, pricing and the snapshot all share it.
        self.assertEqual(len(seen), 5)


class OrderPlacementTests(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.address = Address.objects.create(
            customer=self.customer, address="Tehran, Valiasr St. 12"
        )
        self.product = make_product()
        with_size_options(self.product)

    def place(self, items, **kwargs):
        return place_order(customer=self.customer, items=items, address=self.address, **kwargs)

    def test_single_item_order(self):
        order = self.place([{"product": self.product.pk, "quantity": 2,
                             "selected_options": {"size": "1kg"}}])

        self.assertEqual(order.items.count(), 1)
        item = order.items.get()
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.price, Decimal("850000"))
        self.assertEqual(item.total, Decimal("1700000"))
        self.assertEqual(order.subtotal, Decimal("1700000"))
        self.assertEqual(order.shipping_cost, Decimal("30000"))
        self.assertEqual(order.total, Decimal("1730000"))

    def test_multiple_items(self):
        other = make_product(slug="cookie", name="Cookie", price="320000")
        order = self.place([
            {"product": self.product.pk, "quantity": 1, "selected_options": {"size": "1kg"}},
            {"product": other.pk, "quantity": 3},
        ])

        self.assertEqual(order.items.count(), 2)
        self.assertEqual(order.subtotal, Decimal("850000") + Decimal("960000"))
        self.assertEqual(order.total, order.subtotal + Decimal("30000"))

    def test_same_product_with_different_options_creates_two_lines(self):
        order = self.place([
            {"product": self.product.pk, "quantity": 1, "selected_options": {"size": "1kg"}},
            {"product": self.product.pk, "quantity": 1, "selected_options": {"size": "2kg"}},
        ])

        self.assertEqual(order.items.count(), 2)
        prices = sorted(item.price for item in order.items.all())
        self.assertEqual(prices, [Decimal("850000"), Decimal("1470000")])
        self.assertEqual(
            order.subtotal, Decimal("850000") + Decimal("1470000")
        )

    def test_same_product_with_identical_options_stays_two_lines(self):
        # The uniqueness constraint was removed, so a repeated identical line is
        # kept as sent rather than silently merged.
        order = self.place([
            {"product": self.product.pk, "quantity": 1, "selected_options": {"size": "1kg"}},
            {"product": self.product.pk, "quantity": 1, "selected_options": {"size": "1kg"}},
        ])
        self.assertEqual(order.items.count(), 2)

    def test_pickup_has_no_shipping(self):
        order = self.place(
            [{"product": self.product.pk, "selected_options": {"size": "1kg"}}],
            delivery_method=Order.DELIVERY_PICKUP,
        )
        self.assertEqual(order.shipping_cost, Decimal("0"))
        self.assertEqual(order.total, order.subtotal)

    def test_codes_are_generated(self):
        order = self.place([{"product": self.product.pk, "selected_options": {"size": "1kg"}}])
        self.assertTrue(order.order_code.startswith("ORD-"))
        self.assertTrue(order.tracking_code.startswith("TRK-"))
        self.assertNotEqual(order.order_code, order.tracking_code)

    def test_order_and_tracking_codes_are_unique(self):
        codes = set()
        for _ in range(5):
            order = self.place(
                [{"product": self.product.pk, "selected_options": {"size": "1kg"}}]
            )
            codes.add(order.order_code)
        self.assertEqual(len(codes), 5)

    def test_status_starts_confirmed(self):
        order = self.place([{"product": self.product.pk, "selected_options": {"size": "1kg"}}])
        self.assertEqual(order.status, Order.STATUS_CONFIRMED)

    def test_statuses_match_the_storefront_flow(self):
        self.assertEqual(
            [value for value, _ in Order.ORDER_STATUS],
            ["confirmed", "preparing", "ready", "delivered", "cancelled"],
        )

    def test_missing_address_is_rejected(self):
        with self.assertRaises(OrderError):
            place_order(
                customer=self.customer,
                items=[{"product": self.product.pk, "selected_options": {"size": "1kg"}}],
                address=None,
            )
        self.assertEqual(Order.objects.count(), 0)

    def test_empty_address_is_rejected(self):
        self.address.address = "   "
        self.address.save()
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "selected_options": {"size": "1kg"}}])

    def test_inventory_is_not_consumed_at_placement(self):
        # Option A: placing an order only checks availability. Stock is
        # consumed when payment confirms the order, so a payment that is never
        # completed cannot have taken stock for good.
        self.place([{"product": self.product.pk, "quantity": 2,
                     "selected_options": {"size": "1kg"}}])
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

    def test_reserve_inventory_reduces_stock(self):
        from .orders import reserve_inventory

        order = self.place([{"product": self.product.pk, "quantity": 3,
                             "selected_options": {"size": "1kg"}}])
        reserve_inventory(order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_release_inventory_restores_stock(self):
        from .orders import release_inventory, reserve_inventory

        order = self.place([{"product": self.product.pk, "quantity": 3,
                             "selected_options": {"size": "1kg"}}])
        reserve_inventory(order)
        release_inventory(order)

        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

    def test_reserve_and_release_round_trip_over_several_orders(self):
        from .orders import release_inventory, reserve_inventory

        first = self.place([{"product": self.product.pk, "quantity": 2,
                             "selected_options": {"size": "1kg"}}])
        second = self.place([{"product": self.product.pk, "quantity": 3,
                              "selected_options": {"size": "1kg"}}])

        reserve_inventory(first)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 8)

        release_inventory(first)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 10)

        reserve_inventory(second)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 7)

    def test_failed_order_leaves_inventory_untouched(self):
        from .orders import reserve_inventory

        order = self.place([{"product": self.product.pk, "quantity": 2,
                             "selected_options": {"size": "1kg"}}])
        reserve_inventory(order)
        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 8)

        # A second order that fails validation must not disturb the first.
        other = make_product(slug="cookie", name="Cookie", price="320000", inventory=0)
        with self.assertRaises(OrderError):
            self.place([{"product": other.pk, "quantity": 1}])

        self.product.refresh_from_db()
        self.assertEqual(self.product.inventory, 8)


class OrderPricingSecurityTests(TestCase):
    """The client describes the basket; the server decides the money."""

    def setUp(self):
        self.customer = make_customer()
        self.address = Address.objects.create(
            customer=self.customer, address="Tehran"
        )
        self.product = make_product()
        with_size_options(self.product)

    def place(self, items, **kwargs):
        return place_order(customer=self.customer, items=items, address=self.address, **kwargs)

    def test_unit_price_comes_from_the_database(self):
        order = self.place([{"product": self.product.pk, "quantity": 1,
                             "selected_options": {"size": "2kg"}}])
        self.assertEqual(order.items.get().price, Decimal("1470000"))

    def test_client_price_fields_are_ignored(self):
        order = self.place([{
            "product": self.product.pk,
            "quantity": 1,
            "selected_options": {"size": "1kg"},
            # None of the following are accepted; they must not change anything.
            "price": "1",
            "total": "1",
            "unit_price": "1",
            "price_delta": "-850000",
        }])

        self.assertEqual(order.items.get().price, Decimal("850000"))
        self.assertEqual(order.subtotal, Decimal("850000"))
        self.assertEqual(order.total, Decimal("880000"))

    def test_client_order_totals_are_ignored(self):
        order = self.place([{
            "product": self.product.pk,
            "quantity": 1,
            "selected_options": {"size": "1kg"},
        }])
        self.assertEqual(order.subtotal, Decimal("850000"))
        self.assertEqual(order.total, Decimal("880000"))

    def test_shipping_cost_cannot_be_chosen_by_the_client(self):
        order = self.place([{
            "product": self.product.pk,
            "quantity": 1,
            "selected_options": {"size": "1kg"},
            "shipping_cost": "0",
            "delivery_method": "express",
        }])
        # delivery_method is validated, but the amount is always the server's.
        self.assertEqual(order.shipping_cost, Decimal("30000"))

    def test_unknown_option_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk,
                         "selected_options": {"size": "1kg", "colour": "red"}}])

    def test_missing_option_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "selected_options": {}}])

    def test_option_value_from_another_option_is_rejected(self):
        flavour = ProductOption.objects.create(
            product=self.product, name="Flavour", slug="flavour"
        )
        ProductOptionValue.objects.create(
            option=flavour, label="Cocoa", slug="cocoa", price_delta=Decimal("0")
        )
        # "cocoa" is a flavour value, not a size value.
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk,
                         "selected_options": {"size": "cocoa", "flavour": "cocoa"}}])

    def test_option_from_another_product_is_rejected(self):
        other = make_product(slug="cookie", name="Cookie", price="320000")
        with_size_options(other, deltas=(("500g", 0),))

        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk,
                         "selected_options": {"size": "1kg"}},
                        {"product": other.pk,
                         "selected_options": {"size": "2kg"}}])

    def test_invented_value_slug_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk,
                         "selected_options": {"size": "free"}}])

    def test_zero_quantity_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "quantity": 0,
                         "selected_options": {"size": "1kg"}}])

    def test_negative_quantity_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "quantity": -3,
                         "selected_options": {"size": "1kg"}}])

    def test_excessive_quantity_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "quantity": 500,
                         "selected_options": {"size": "1kg"}}])

    def test_quantity_above_stock_is_rejected(self):
        self.product.inventory = 2
        self.product.save()
        with self.assertRaises(OrderError):
            self.place([{"product": self.product.pk, "quantity": 3,
                         "selected_options": {"size": "1kg"}}])

    def test_unknown_product_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([{"product": 999999, "selected_options": {"size": "1kg"}}])

    def test_empty_order_is_rejected(self):
        with self.assertRaises(OrderError):
            self.place([])


class OrderSnapshotTests(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.address = Address.objects.create(
            customer=self.customer, address="Tehran, Valiasr St. 12"
        )
        self.product = make_product(name="Truffle Cake", price="850000")
        with_size_options(self.product)

        self.order = place_order(
            customer=self.customer,
            address=self.address,
            items=[{"product": self.product.pk, "quantity": 2,
                    "selected_options": {"size": "2kg"}}],
        )
        self.item = self.order.items.get()

    def test_product_name_is_snapshotted(self):
        self.assertEqual(self.item.product_name, "Truffle Cake")

    def test_product_slug_is_snapshotted(self):
        self.assertEqual(self.item.product_slug, "cake")

    def test_price_is_snapshotted(self):
        self.assertEqual(self.item.price, Decimal("1470000"))
        self.assertEqual(self.item.total, Decimal("2940000"))

    def test_selected_options_are_snapshotted(self):
        self.assertEqual(self.item.selected_options, {"size": "2kg"})

    def test_options_snapshot_records_labels_and_deltas(self):
        snapshot = self.item.options_snapshot
        self.assertEqual(snapshot["size"]["option"], "Size")
        self.assertEqual(snapshot["size"]["value"], "2kg")
        self.assertEqual(snapshot["size"]["price_delta"], "620000")

    def test_address_is_snapshotted_onto_the_order(self):
        self.assertEqual(self.order.address, "Tehran, Valiasr St. 12")

    def test_buyer_details_are_snapshotted(self):
        self.assertEqual(self.order.first_name, "Sara")
        self.assertEqual(self.order.email, "sara@example.com")

    def test_renaming_a_product_does_not_change_an_old_order(self):
        self.product.name = "Completely Different Name"
        self.product.slug = "different-slug"
        self.product.save()

        self.item.refresh_from_db()
        self.assertEqual(self.item.product_name, "Truffle Cake")
        self.assertEqual(self.item.product_slug, "cake")

    def test_repricing_a_product_does_not_change_an_old_order(self):
        self.product.price = Decimal("9999999")
        self.product.save()

        self.item.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.item.price, Decimal("1470000"))
        self.assertEqual(self.order.total, Decimal("2970000"))

    def test_changing_a_price_delta_does_not_change_an_old_order(self):
        value = self.product.options.first().values.get(slug="2kg")
        value.price_delta = Decimal("0")
        value.save()

        self.item.refresh_from_db()
        self.assertEqual(self.item.price, Decimal("1470000"))
        self.assertEqual(self.item.options_snapshot["size"]["price_delta"], "620000")

    def test_changing_the_customer_address_does_not_change_an_old_order(self):
        self.address.address = "Isfahan, new street"
        self.address.save()

        self.order.refresh_from_db()
        self.assertEqual(self.order.address, "Tehran, Valiasr St. 12")

    def test_deleting_the_option_does_not_change_an_old_order(self):
        self.product.options.all().delete()
        self.item.refresh_from_db()
        self.assertEqual(self.item.options_snapshot["size"]["value"], "2kg")
        self.assertEqual(self.item.selected_options, {"size": "2kg"})

    def test_changing_customer_details_does_not_change_an_old_order(self):
        self.customer.email = "changed@example.com"
        self.customer.first_name = "Changed"
        self.customer.save()

        self.order.refresh_from_db()
        self.assertEqual(self.order.email, "sara@example.com")
        self.assertEqual(self.order.first_name, "Sara")


class OrderApiTests(TestCase):
    def setUp(self):
        self.user = make_user("sara")
        self.customer = make_customer(user=self.user, email=self.user.email)
        self.address = Address.objects.create(
            customer=self.customer, address="Tehran, Valiasr St. 12"
        )
        self.product = make_product()
        with_size_options(self.product)

    def payload(self, **overrides):
        data = {
            "items": [
                {"product": self.product.pk, "quantity": 2,
                 "selected_options": {"size": "2kg"}}
            ],
            "delivery_method": "standard",
        }
        data.update(overrides)
        return data

    def test_anonymous_cannot_place_an_order(self):
        response = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Order.objects.count(), 0)

    def test_anonymous_cannot_list_orders(self):
        self.assertEqual(self.client.get(ORDERS_URL).status_code, 403)

    def test_place_order_as_authenticated_customer(self):
        self.client.force_login(self.user)
        response = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["order_code"].startswith("ORD-"))
        self.assertEqual(body["subtotal"], "2940000")
        self.assertEqual(body["shipping_cost"], "30000")
        self.assertEqual(body["total"], "2970000")
        self.assertEqual(body["address"], "Tehran, Valiasr St. 12")
        self.assertEqual(body["items"][0]["product_name"], "Truffle Cake")
        self.assertEqual(body["items"][0]["options_snapshot"]["size"]["value"], "2kg")
        self.assertTrue(body["customer"]["is_registered"])

    def test_order_without_address_is_refused(self):
        self.address.delete()
        self.client.force_login(self.user)
        response = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("address", response.json())
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_option_returns_400(self):
        self.client.force_login(self.user)
        response = self.client.post(
            ORDERS_URL,
            data=self.payload(items=[{"product": self.product.pk,
                                      "selected_options": {"size": "10kg"}}]),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_client_cannot_send_the_total(self):
        self.client.force_login(self.user)
        response = self.client.post(
            ORDERS_URL,
            data=self.payload(total="1", subtotal="1", shipping_cost="0", discount="999999"),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["subtotal"], "2940000")
        self.assertEqual(body["shipping_cost"], "30000")
        self.assertEqual(body["discount"], "0")
        self.assertEqual(body["total"], "2970000")

    def test_client_cannot_choose_the_customer(self):
        other = make_user("bob", email="bob@example.com")
        other_customer = make_customer(
            user=other, email="bob@example.com", phone_number="09130000000"
        )
        self.client.force_login(self.user)

        self.client.post(
            ORDERS_URL,
            data=self.payload(customer=other_customer.pk, customer_id=other_customer.pk),
            content_type="application/json",
        )

        self.assertEqual(Order.objects.filter(customer=self.customer).count(), 1)
        self.assertEqual(Order.objects.filter(customer=other_customer).count(), 0)

    def test_list_returns_only_own_orders(self):
        other = make_user("bob", email="bob@example.com")
        other_customer = make_customer(
            user=other, email="bob@example.com", phone_number="09130000000"
        )
        Address.objects.create(customer=other_customer, address="Isfahan")

        self.client.force_login(self.user)
        mine = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        ).json()
        self.client.force_login(other)
        self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        )

        self.client.force_login(self.user)
        data = self.client.get(ORDERS_URL).json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["order_code"], mine["order_code"])

    def test_the_order_list_does_not_issue_a_query_per_order(self):
        """The list must not cost one query more per order it renders.

        The serializer reports whether the buyer had an account, which reads
        ``customer.user_id``. Without ``select_related("customer")`` that read is
        a separate query for every order, so the endpoint used to cost 5 queries
        for one order, 7 for three and 10 for six. It must now be fixed-cost
        whatever the page holds.
        """
        self.client.force_login(self.user)
        for _ in range(6):
            self.client.post(
                ORDERS_URL, data=self.payload(), content_type="application/json"
            )

        def fetch():
            with CaptureQueriesContext(connection) as captured:
                response = self.client.get(ORDERS_URL)
            self.assertEqual(response.status_code, 200)
            return response.json(), len(captured)

        six_orders, queries_with_six = fetch()
        self.assertEqual(len(six_orders), 6)

        # Shrink the page to a single order and measure again. Comparing the two
        # states states the property, instead of freezing today's constant.
        keeper = six_orders[0]["order_code"]
        doomed = Order.objects.filter(customer=self.customer).exclude(
            order_code=keeper
        )
        for order in doomed:
            OrderItem.objects.filter(order=order).delete()
        doomed.delete()

        one_order, queries_with_one = fetch()
        self.assertEqual(len(one_order), 1)

        # The real assertion: six orders cost no more queries than one order.
        self.assertEqual(queries_with_six, queries_with_one)

    def test_order_detail_returns_own_order(self):
        self.client.force_login(self.user)
        created = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        ).json()

        response = self.client.get(f"/api/orders/{created['order_code']}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["order_code"], created["order_code"])

    def test_order_detail_hides_another_customers_order(self):
        other = make_user("bob", email="bob@example.com")
        other_customer = make_customer(
            user=other, email="bob@example.com", phone_number="09130000000"
        )
        Address.objects.create(customer=other_customer, address="Isfahan")
        self.client.force_login(other)
        theirs = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        ).json()

        self.client.force_login(self.user)
        response = self.client.get(f"/api/orders/{theirs['order_code']}/")
        self.assertEqual(response.status_code, 404)

    def test_idor_by_id_is_not_possible(self):
        self.client.force_login(self.user)
        created = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        ).json()
        order = Order.objects.get(order_code=created["order_code"])

        # The route is by order_code only; a numeric pk is simply not found.
        for url in (
            f"/api/orders/{order.pk}/",
            f"{ORDERS_URL}?customer_id={self.customer.pk}",
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertIn(response.status_code, (200, 404))
                if response.status_code == 200:
                    # If a list came back it must still be this user's own order.
                    body = response.json()
                    entries = body if isinstance(body, list) else [body]
                    self.assertTrue(
                        all(e["order_code"] == created["order_code"] for e in entries)
                    )

    def test_order_cannot_be_updated_through_the_api(self):
        self.client.force_login(self.user)
        created = self.client.post(
            ORDERS_URL, data=self.payload(), content_type="application/json"
        ).json()
        url = f"/api/orders/{created['order_code']}/"

        for method in ("put", "patch", "delete"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    url,
                    data='{"total": "1", "status": "delivered"}',
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 405)

        order = Order.objects.get(order_code=created["order_code"])
        self.assertEqual(order.total, Decimal("2970000"))
        self.assertEqual(order.status, Order.STATUS_CONFIRMED)

    def test_failed_order_leaves_nothing_behind(self):
        other = make_product(slug="cookie", name="Cookie", price="320000")
        with_size_options(other, deltas=(("500g", 0),))

        self.client.force_login(self.user)
        response = self.client.post(
            ORDERS_URL,
            data=self.payload(items=[
                {"product": self.product.pk, "selected_options": {"size": "1kg"}},
                # invalid: this product has no "2kg" size
                {"product": other.pk, "selected_options": {"size": "2kg"}},
            ]),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        # The whole placement is one transaction: no partial order survives.
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)


class GuestOrderTests(TestCase):
    """Guest checkout keeps working: an order with a customer but no account."""

    def setUp(self):
        self.guest = make_customer(user=None, email="guest@example.com")
        self.address = Address.objects.create(
            customer=self.guest, address="Shiraz, Chamran Blvd. 5"
        )
        self.product = make_product()
        with_size_options(self.product)

    def test_guest_can_place_an_order(self):
        order = place_order(
            customer=self.guest,
            address=self.address,
            items=[{"product": self.product.pk, "quantity": 1,
                    "selected_options": {"size": "1kg"}}],
        )

        self.assertIsNone(order.customer.user)
        self.assertEqual(order.email, "guest@example.com")
        self.assertEqual(order.address, "Shiraz, Chamran Blvd. 5")
        self.assertEqual(order.total, Decimal("880000"))

    def test_guest_with_an_order_cannot_be_deleted(self):
        order = place_order(
            customer=self.guest,
            address=self.address,
            items=[{"product": self.product.pk, "selected_options": {"size": "1kg"}}],
        )
        # Order.customer is PROTECT: an order is a financial record, so the
        # customer it belongs to cannot be deleted out from under it.
        with self.assertRaises(ProtectedError):
            self.guest.delete()

        order.refresh_from_db()
        self.assertEqual(order.email, "guest@example.com")
        self.assertEqual(order.address, "Shiraz, Chamran Blvd. 5")


GUEST_ORDERS_URL = "/api/guest-orders/"


class GuestOrderApiTests(TestCase):
    """The public guest checkout endpoint."""

    def setUp(self):
        # Throttle state lives in the cache, which the test runner does not
        # reset; without this one test's orders would throttle the next.
        cache.clear()
        self.product = make_product()
        with_size_options(self.product)

    def payload(self, **overrides):
        data = {
            "first_name": "Maryam",
            "last_name": "Rezaei",
            "email": "maryam@example.com",
            "phone_number": "09121112233",
            "address": "Shiraz, Chamran Blvd. 5",
            "items": [{"product": self.product.pk, "quantity": 1,
                       "selected_options": {"size": "1kg"}}],
            "delivery_method": "standard",
        }
        data.update(overrides)
        return data

    def test_anonymous_guest_can_place_an_order(self):
        # No login, no token: the endpoint is public on purpose.
        response = self.client.post(
            GUEST_ORDERS_URL, data=self.payload(), content_type="application/json"
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertTrue(body["order_code"].startswith("ORD-"))
        self.assertEqual(body["subtotal"], "850000")
        self.assertEqual(body["total"], "880000")
        self.assertFalse(body["customer"]["is_registered"])

    def test_guest_contact_details_are_snapshotted(self):
        self.client.post(GUEST_ORDERS_URL, data=self.payload(), content_type="application/json")

        order = Order.objects.get()
        self.assertEqual(order.first_name, "Maryam")
        self.assertEqual(order.last_name, "Rezaei")
        self.assertEqual(order.email, "maryam@example.com")
        self.assertEqual(order.phone_number, "09121112233")
        self.assertEqual(order.address, "Shiraz, Chamran Blvd. 5")

    def test_guest_customer_record_is_created_without_a_user(self):
        self.client.post(GUEST_ORDERS_URL, data=self.payload(), content_type="application/json")

        customer = Customer.objects.get()
        self.assertIsNone(customer.user)
        self.assertEqual(customer.email, "maryam@example.com")
        self.assertTrue(customer.referral_code)

    def test_returning_guest_reuses_their_customer(self):
        self.client.post(GUEST_ORDERS_URL, data=self.payload(), content_type="application/json")
        self.client.post(GUEST_ORDERS_URL, data=self.payload(), content_type="application/json")

        self.assertEqual(Customer.objects.count(), 1)
        self.assertEqual(Order.objects.count(), 2)

    def test_guest_cannot_choose_a_customer(self):
        victim = make_customer(user=None, email="victim@example.com")

        self.client.post(
            GUEST_ORDERS_URL,
            data=self.payload(
                email="attacker@example.com",
                customer=victim.pk,
                customer_id=victim.pk,
                user_id=victim.pk,
            ),
            content_type="application/json",
        )

        self.assertEqual(Order.objects.filter(customer=victim).count(), 0)
        self.assertEqual(Order.objects.filter(customer__email="attacker@example.com").count(), 1)

    def test_guest_cannot_order_as_a_registered_customer(self):
        user = make_user("sara", email="sara@example.com")
        registered = make_customer(user=user, email="sara@example.com")

        response = self.client.post(
            GUEST_ORDERS_URL,
            data=self.payload(email="sara@example.com"),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertEqual(Order.objects.filter(customer=registered).count(), 0)
        self.assertEqual(Order.objects.count(), 0)

    def test_guest_cannot_see_or_change_another_customers_orders(self):
        other_user = make_user("bob", email="bob@example.com")
        other = make_customer(
            user=other_user, email="bob@example.com", phone_number="09130000000"
        )
        Address.objects.create(customer=other, address="Isfahan")
        self.client.force_login(other_user)
        theirs = self.client.post(
            "/api/orders/",
            data={"items": [{"product": self.product.pk,
                             "selected_options": {"size": "1kg"}}]},
            content_type="application/json",
        ).json()
        self.client.logout()

        # A guest is not signed in, so nothing is readable.
        self.assertEqual(self.client.get("/api/orders/").status_code, 403)
        self.assertEqual(
            self.client.get(f"/api/orders/{theirs['order_code']}/").status_code, 403
        )
        for method in ("put", "patch", "delete"):
            response = getattr(self.client, method)(
                f"/api/orders/{theirs['order_code']}/",
                data="{}",
                content_type="application/json",
            )
            self.assertIn(response.status_code, (403, 405))

    def test_missing_contact_details_are_rejected(self):
        for field in ("first_name", "last_name", "email", "phone_number", "address"):
            with self.subTest(field=field):
                response = self.client.post(
                    GUEST_ORDERS_URL,
                    data=self.payload(**{field: ""}),
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_invalid_email_is_rejected(self):
        response = self.client.post(
            GUEST_ORDERS_URL,
            data=self.payload(email="not-an-email"),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_prices_from_a_guest_request_are_ignored(self):
        response = self.client.post(
            GUEST_ORDERS_URL,
            data=self.payload(total="1", subtotal="1", shipping_cost="0", discount="999999"),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertEqual(body["subtotal"], "850000")
        self.assertEqual(body["shipping_cost"], "30000")
        self.assertEqual(body["discount"], "0")
        self.assertEqual(body["total"], "880000")

    def test_invalid_option_is_rejected_and_nothing_is_saved(self):
        response = self.client.post(
            GUEST_ORDERS_URL,
            data=self.payload(items=[{"product": self.product.pk,
                                      "selected_options": {"size": "10kg"}}]),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)
        # The guest customer is not left behind either.
        self.assertEqual(Customer.objects.count(), 0)

    def test_guest_order_is_rate_limited(self):
        cache.clear()
        statuses = [
            self.client.post(
                GUEST_ORDERS_URL, data=self.payload(), content_type="application/json"
            ).status_code
            for _ in range(8)
        ]
        self.assertIn(429, statuses)
