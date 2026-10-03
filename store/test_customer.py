"""
Tests for Customer and Address.

The rules being pinned down here are Qandak's own: one address per customer,
the customer id is the address id, an update never creates a second address,
and one user can never reach another user's data.
"""

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Address, Customer

User = get_user_model()


def make_user(username="sara", **kwargs):
    # Each user gets a distinct phone number because CustomUser.phone_number
    # is unique; reusing one would raise IntegrityError by design.
    defaults = dict(
        email=f"{username}@example.com",
        first_name="Sara",
        last_name="Ahmadi",
        phone_number="+989" + str(abs(hash(username)) % 10**9).zfill(9),
    )
    defaults.update(kwargs)
    return User.objects.create_user(username=username, password="Str0ngPass!23", **defaults)


def make_customer(**kwargs):
    defaults = dict(
        first_name="Sara",
        last_name="Ahmadi",
        email="sara@example.com",
        phone_number="+989123456789",
    )
    defaults.update(kwargs)
    return Customer.objects.create(**defaults)


class CustomerModelTests(TestCase):
    def test_customer_with_user(self):
        user = make_user()
        customer = Customer.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone_number=user.phone_number,
        )

        self.assertEqual(customer.user, user)
        self.assertEqual(user.customer, customer)

    def test_guest_customer_without_user(self):
        customer = make_customer()

        self.assertIsNone(customer.user)
        # A guest still has a full domain record: an order can point at it.
        self.assertEqual(customer.email, "sara@example.com")
        self.assertEqual(customer.phone_number, "+989123456789")

    def test_user_can_have_at_most_one_customer(self):
        user = make_user()
        Customer.objects.create(
            user=user, first_name="A", last_name="B",
            email="a@example.com", phone_number="09120000000",
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Customer.objects.create(
                    user=user, first_name="C", last_name="D",
                    email="c@example.com", phone_number="09130000000",
                )

    def test_referral_code_is_generated_and_unique(self):
        first = make_customer(email="a@example.com")
        second = make_customer(email="b@example.com")

        self.assertTrue(first.referral_code)
        self.assertNotEqual(first.referral_code, second.referral_code)

    def test_explicit_referral_code_is_kept(self):
        customer = make_customer(email="a@example.com", referral_code="KEEPTHIS")
        self.assertEqual(customer.referral_code, "KEEPTHIS")

    def test_str(self):
        customer = make_customer()
        self.assertEqual(str(customer), "Sara Ahmadi")


class AddressModelTests(TestCase):
    def setUp(self):
        self.customer = make_customer()

    def test_address_pk_is_the_customer_id(self):
        address = Address.objects.create(customer=self.customer, address="Tehran")
        self.assertEqual(address.pk, self.customer.pk)

    def test_customer_has_exactly_one_address(self):
        address = Address.objects.create(customer=self.customer, address="Tehran")
        self.assertEqual(self.customer.address, address)

    def test_second_address_for_same_customer_is_rejected(self):
        Address.objects.create(customer=self.customer, address="Tehran")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Address.objects.create(customer=self.customer, address="Another city")

        self.assertEqual(Address.objects.filter(customer=self.customer).count(), 1)

    def test_two_customers_each_get_their_own_address(self):
        other = make_customer(email="other@example.com")
        first_address = Address.objects.create(customer=self.customer, address="Tehran")
        second_address = Address.objects.create(customer=other, address="Shiraz")

        self.assertNotEqual(first_address.pk, second_address.pk)
        self.assertEqual(first_address.address, "Tehran")
        self.assertEqual(second_address.address, "Shiraz")

    def test_customer_is_required_on_address(self):
        # `customer` is the primary key, so an address cannot exist without one.
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Address.objects.create(address="No owner")

    def test_deleting_customer_deletes_address(self):
        Address.objects.create(customer=self.customer, address="Tehran")
        self.customer.delete()
        self.assertEqual(Address.objects.count(), 0)


class AddressApiTests(TestCase):
    """Owner is always resolved from request.user, never from the request."""

    def setUp(self):
        self.user = make_user("sara")
        self.other_user = make_user("bob", email="bob@example.com")
        self.customer = Customer.objects.create(
            user=self.user, first_name="Sara", last_name="Ahmadi",
            email="sara@example.com", phone_number="+989123456789",
        )
        self.other_customer = Customer.objects.create(
            user=self.other_user, first_name="Bob", last_name="Karimi",
            email="bob@example.com", phone_number="+989350000000",
        )

    def test_anonymous_cannot_read_address(self):
        self.assertEqual(self.client.get("/api/customer/address/").status_code, 403)

    def test_anonymous_cannot_write_address(self):
        for method in ("put", "patch"):
            with self.subTest(method=method):
                response = getattr(self.client, method)(
                    "/api/customer/address/",
                    data='{"address": "Tehran"}',
                    content_type="application/json",
                )
                self.assertEqual(response.status_code, 403)
        self.assertEqual(Address.objects.count(), 0)

    def test_get_without_address_returns_404_and_creates_nothing(self):
        self.client.force_login(self.user)

        response = self.client.get("/api/customer/address/")

        self.assertEqual(response.status_code, 404)
        # A read must have no side effects at all.
        self.assertEqual(Address.objects.count(), 0)

    def test_get_does_not_create_a_customer(self):
        user = make_user("carol", email="carol@example.com")
        self.client.force_login(user)
        self.assertFalse(Customer.objects.filter(user=user).exists())

        self.client.get("/api/customer/address/")

        self.assertFalse(Customer.objects.filter(user=user).exists())

    def test_get_returns_the_existing_address(self):
        Address.objects.create(customer=self.customer, address="Tehran, Valiasr")
        self.client.force_login(self.user)

        response = self.client.get("/api/customer/address/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"address": "Tehran, Valiasr"})
        self.assertEqual(Address.objects.count(), 1)

    def test_put_creates_the_address_when_missing(self):
        self.client.force_login(self.user)

        response = self.client.put(
            "/api/customer/address/",
            data='{"address": "Tehran, Valiasr"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"address": "Tehran, Valiasr"})
        self.assertEqual(Address.objects.count(), 1)
        self.assertEqual(self.customer.address.address, "Tehran, Valiasr")

    def test_patch_without_address_returns_404(self):
        self.client.force_login(self.user)

        response = self.client.patch(
            "/api/customer/address/",
            data='{"address": "Tehran"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Address.objects.count(), 0)

    def test_patch_updates_the_same_row(self):
        Address.objects.create(customer=self.customer, address="First address")
        self.client.force_login(self.user)

        original = Address.objects.get(customer=self.customer)
        self.client.patch(
            "/api/customer/address/",
            data='{"address": "Second address"}',
            content_type="application/json",
        )
        updated = Address.objects.get(customer=self.customer)

        self.assertEqual(original.pk, updated.pk)
        self.assertEqual(original.pk, self.customer.pk)
        self.assertEqual(updated.address, "Second address")
        self.assertEqual(Address.objects.count(), 1)

    def test_put_updates_the_same_row_when_one_exists(self):
        Address.objects.create(customer=self.customer, address="One")
        self.client.force_login(self.user)
        pk = Address.objects.get(customer=self.customer).pk

        self.client.put(
            "/api/customer/address/",
            data='{"address": "Two"}',
            content_type="application/json",
        )

        self.assertEqual(Address.objects.count(), 1)
        self.assertEqual(Address.objects.get(customer=self.customer).pk, pk)
        self.assertEqual(Address.objects.get(customer=self.customer).address, "Two")

    def test_repeated_updates_never_create_a_second_address(self):
        Address.objects.create(customer=self.customer, address="start")
        self.client.force_login(self.user)
        for text in ("one", "two", "three", "four"):
            self.client.patch(
                "/api/customer/address/",
                data=f'{{"address": "{text}"}}',
                content_type="application/json",
            )

        self.assertEqual(Address.objects.filter(customer=self.customer).count(), 1)
        self.customer.address.refresh_from_db()
        self.assertEqual(self.customer.address.address, "four")

    def test_repeated_put_never_creates_a_second_address(self):
        self.client.force_login(self.user)
        for text in ("one", "two", "three"):
            self.client.put(
                "/api/customer/address/",
                data=f'{{"address": "{text}"}}',
                content_type="application/json",
            )

        self.assertEqual(Address.objects.filter(customer=self.customer).count(), 1)
        self.assertEqual(self.customer.address.address, "three")

    def test_empty_address_is_rejected(self):
        Address.objects.create(customer=self.customer, address="Something")
        self.client.force_login(self.user)
        response = self.client.patch(
            "/api/customer/address/",
            data='{"address": ""}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.customer.address.refresh_from_db()
        self.assertEqual(self.customer.address.address, "Something")

    def test_user_sees_only_their_own_address(self):
        Address.objects.create(customer=self.customer, address="Sara's home")
        Address.objects.create(customer=self.other_customer, address="Bob's home")

        self.client.force_login(self.user)
        data = self.client.get("/api/customer/address/").json()

        self.assertEqual(data["address"], "Sara's home")
        self.assertNotIn("Bob's home", str(data))

    def test_user_cannot_change_another_customers_address(self):
        Address.objects.create(customer=self.other_customer, address="Bob's home")

        self.client.force_login(self.user)
        self.client.patch(
            "/api/customer/address/",
            data='{"address": "Hijacked"}',
            content_type="application/json",
        )

        self.other_customer.address.refresh_from_db()
        self.assertEqual(self.other_customer.address.address, "Bob's home")

    def test_idor_attempts_are_rejected(self):
        """No route accepts a customer or address id, so none of these exist."""
        Address.objects.create(customer=self.customer, address="Sara's home")
        Address.objects.create(customer=self.other_customer, address="Bob's home")
        self.client.force_login(self.user)

        for url in (
            f"/api/customer/address/{self.other_customer.pk}/",
            f"/api/customer/address/?customer={self.other_customer.pk}",
            f"/api/customer/address/?customer_id={self.other_customer.pk}",
            f"/api/customer/address/?address_id={self.other_customer.pk}",
            f"/api/customer/address/?user_id={self.other_user.pk}",
        ):
            with self.subTest(url=url):
                response = self.client.patch(
                    url,
                    data='{"address": "Hijacked"}',
                    content_type="application/json",
                )
                # A path that names another customer does not exist (404); a
                # query parameter is simply ignored and the write lands on the
                # caller's own address (200) or is rejected (400/403).
                self.assertIn(response.status_code, (200, 400, 403, 404))

        self.other_customer.address.refresh_from_db()
        self.assertEqual(self.other_customer.address.address, "Bob's home")

    def test_payload_cannot_point_at_another_customer(self):
        """Even if a foreign key is smuggled into the body it is ignored."""
        Address.objects.create(customer=self.customer, address="Sara's home")
        Address.objects.create(customer=self.other_customer, address="Bob's home")
        self.client.force_login(self.user)

        self.client.patch(
            "/api/customer/address/",
            data=f'{{"address": "Mine", "customer": {self.other_customer.pk}}}',
            content_type="application/json",
        )

        self.other_customer.address.refresh_from_db()
        self.assertEqual(self.other_customer.address.address, "Bob's home")
        # The write landed on the caller's own address, as it always does.
        self.customer.address.refresh_from_db()
        self.assertEqual(self.customer.address.address, "Mine")


class CustomerApiTests(TestCase):
    def setUp(self):
        self.user = make_user("sara")

    def test_anonymous_cannot_read_customer(self):
        self.assertEqual(self.client.get("/api/customer/").status_code, 403)

    def test_customer_profile_is_returned(self):
        self.client.force_login(self.user)
        response = self.client.get("/api/customer/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(
            set(data),
            {
                "first_name", "last_name", "email", "phone_number",
                "referral_code", "is_registered", "address",
            },
        )
        self.assertEqual(data["email"], "sara@example.com")
        self.assertTrue(data["is_registered"])
        self.assertTrue(data["referral_code"])

    def test_customer_is_created_on_first_access(self):
        self.assertFalse(Customer.objects.exists())

        self.client.force_login(self.user)
        self.client.get("/api/customer/")

        customer = Customer.objects.get()
        self.assertEqual(customer.user, self.user)
        self.assertEqual(customer.email, self.user.email)

    def test_customer_profile_is_read_only(self):
        self.client.force_login(self.user)
        response = self.client.patch(
            "/api/customer/",
            data='{"email": "hijack@example.com"}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 405)

    def test_two_users_get_separate_customers(self):
        other = make_user("bob", email="bob@example.com")

        self.client.force_login(self.user)
        self.client.get("/api/customer/")
        self.client.force_login(other)
        self.client.get("/api/customer/")

        self.assertEqual(Customer.objects.count(), 2)
