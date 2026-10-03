"""
Security tests for the session-based authentication endpoints.

Covers the cases listed in the Stage 2 plan: registration, duplicate
identifiers, login/logout, anonymous access, cross-user access, CSRF
enforcement, session cookies and CORS.
"""

import json

from django.contrib.auth import get_user_model
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.test import Client, TestCase, override_settings
from django.urls import reverse

User = get_user_model()

REGISTER_URL = "/api/auth/register/"
LOGIN_URL = "/api/auth/login/"
LOGOUT_URL = "/api/auth/logout/"
ME_URL = "/api/auth/me/"
CSRF_URL = "/api/auth/csrf/"

ORIGIN = "http://localhost:3000"


def read_json(response):
    return json.loads(response.content.decode())


class CsrfTestMixin:
    """
    Enforces CSRF on the test client so that "no CSRF token" really does fail.

    The default Django test client bypasses CSRF checks. Setting
    ``enforce_csrf_checks=True`` makes the tests exercise the same code path a
    real cross-origin POST would.
    """

    def csrf_client(self) -> Client:
        client = Client(enforce_csrf_checks=True)
        return client

    def get_csrf_token(self, client: Client) -> str:
        """Fetch a CSRF cookie the same way the frontend does."""
        client.get(CSRF_URL, HTTP_ORIGIN=ORIGIN)
        return client.cookies["csrftoken"].value


class ThrottleResetMixin:
    """
    Clears the throttle cache between tests.

    Throttle state lives in the default cache, which is *not* reset by the
    test runner. Without this, one test's login attempts would throttle the
    next test and the suite would fail for reasons unrelated to the code.
    """

    def setUp(self) -> None:
        super().setUp()
        cache.clear()

    def post_json(self, client: Client, url: str, payload: dict, token: str | None = None, **extra):
        data = json.dumps(payload)
        headers = {"HTTP_ORIGIN": ORIGIN, "content_type": "application/json", **extra}
        if token:
            headers["HTTP_X_CSRFTOKEN"] = token
        return client.post(url, data=data, **headers)


class RegistrationTests(ThrottleResetMixin, CsrfTestMixin, TestCase):
    """1, 2 - registration and duplicate identifier handling."""

    def test_register_with_email_creates_user_and_session(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            REGISTER_URL,
            {"identifier": "Sara@example.com", "password": "Str0ngPass!23"},
            token,
        )

        self.assertEqual(response.status_code, 201)
        body = read_json(response)
        self.assertEqual(body["email"], "Sara@example.com")
        self.assertNotIn("password", body)

        user = User.objects.get(email="Sara@example.com")
        self.assertTrue(user.check_password("Str0ngPass!23"))
        self.assertNotEqual(user.password, "Str0ngPass!23")
        # Registration signs the user in.
        self.assertIn("sessionid", client.cookies)

    def test_register_with_mobile_normalizes_to_e164(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            REGISTER_URL,
            {"identifier": "09123456789", "password": "Str0ngPass!23"},
            token,
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(read_json(response)["phone_number"], "+989123456789")
        self.assertTrue(User.objects.filter(phone_number="+989123456789").exists())

    def test_register_with_duplicate_email_is_rejected(self):
        User.objects.create_user(username="existing", email="dup@example.com", password="pw")
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            REGISTER_URL,
            {"identifier": "DUP@example.com", "password": "Str0ngPass!23"},
            token,
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("identifier", read_json(response))
        self.assertEqual(User.objects.filter(email__iexact="dup@example.com").count(), 1)

    def test_register_with_duplicate_mobile_is_rejected(self):
        User.objects.create_user(
            username="existing", email="a@example.com", phone_number="+989123456789", password="pw"
        )
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client,
            REGISTER_URL,
            {"identifier": "09123456789", "password": "Str0ngPass!23"},
            token,
        )

        self.assertEqual(response.status_code, 400)

    def test_register_with_invalid_mobile_is_rejected(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, REGISTER_URL, {"identifier": "12345", "password": "Str0ngPass!23"}, token
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_register_with_weak_password_is_rejected(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, REGISTER_URL, {"identifier": "weak@example.com", "password": "1234"}, token
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", read_json(response))
        self.assertEqual(User.objects.count(), 0)

    def test_password_is_never_returned(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)
        response = self.post_json(
            client,
            REGISTER_URL,
            {"identifier": "quiet@example.com", "password": "Str0ngPass!23"},
            token,
        )
        self.assertNotIn("Str0ngPass!23", response.content.decode())
        self.assertNotIn("password", response.content.decode())


class LoginLogoutTests(ThrottleResetMixin, CsrfTestMixin, TestCase):
    """3, 4, 5, 11 - login, logout and session cookies."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="sara",
            email="sara@example.com",
            phone_number="+989123456789",
            password="Str0ngPass!23",
        )

    def test_login_with_email(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}, token
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("sessionid", client.cookies)

    def test_login_with_mobile(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, LOGIN_URL, {"identifier": "09123456789", "password": "Str0ngPass!23"}, token
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("sessionid", client.cookies)

    def test_login_with_username(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara", "password": "Str0ngPass!23"}, token
        )

        self.assertEqual(response.status_code, 200)

    def test_login_with_wrong_password_fails(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "wrong-password"}, token
        )

        self.assertEqual(response.status_code, 400)
        self.assertNotIn("sessionid", client.cookies)

    def test_login_with_unknown_identifier_gives_same_error(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        unknown = self.post_json(
            client, LOGIN_URL, {"identifier": "nobody@example.com", "password": "whatever123"}, token
        )
        wrong = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "whatever123"}, token
        )

        # Identical response so the endpoint does not reveal which accounts exist.
        self.assertEqual(unknown.status_code, wrong.status_code)
        self.assertEqual(read_json(unknown), read_json(wrong))

    def test_inactive_user_cannot_login(self):
        self.user.is_active = False
        self.user.save()

        client = self.csrf_client()
        token = self.get_csrf_token(client)
        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}, token
        )

        self.assertEqual(response.status_code, 400)

    def test_logout_ends_session(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)
        self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}, token
        )

        # Django rotates the CSRF token on login, so re-read it.
        token = client.cookies["csrftoken"].value

        me = client.get(ME_URL, HTTP_ORIGIN=ORIGIN)
        self.assertEqual(me.status_code, 200)

        response = self.post_json(client, LOGOUT_URL, {}, token)
        self.assertEqual(response.status_code, 204)

        # The server-side session is gone, so the endpoint is protected again.
        self.assertEqual(client.get(ME_URL, HTTP_ORIGIN=ORIGIN).status_code, 403)

    def test_session_cookie_is_httponly(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)
        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}, token
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.cookies["sessionid"]["httponly"])
        self.assertEqual(response.cookies["sessionid"]["samesite"], "Lax")


@override_settings(CORS_ALLOWED_ORIGINS=[ORIGIN])
class CsrfEnforcementTests(ThrottleResetMixin, CsrfTestMixin, TestCase):
    """9, 10 - CSRF on state-changing requests."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="sara", email="sara@example.com", password="Str0ngPass!23"
        )

    def test_login_post_without_csrf_is_rejected(self):
        client = self.csrf_client()
        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertNotIn("sessionid", client.cookies)

    def test_register_post_without_csrf_is_rejected(self):
        client = self.csrf_client()
        response = self.post_json(
            client, REGISTER_URL, {"identifier": "new@example.com", "password": "Str0ngPass!23"}
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(User.objects.count(), 1)

    def test_logout_post_without_csrf_is_rejected(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.user)

        response = self.post_json(client, LOGOUT_URL, {})
        self.assertEqual(response.status_code, 403)

    def test_post_with_valid_csrf_succeeds(self):
        client = self.csrf_client()
        token = self.get_csrf_token(client)
        response = self.post_json(
            client, LOGIN_URL, {"identifier": "sara@example.com", "password": "Str0ngPass!23"}, token
        )
        self.assertEqual(response.status_code, 200)

    def test_post_with_wrong_csrf_is_rejected(self):
        client = self.csrf_client()
        self.get_csrf_token(client)
        response = self.post_json(
            client,
            LOGIN_URL,
            {"identifier": "sara@example.com", "password": "Str0ngPass!23"},
            "not-a-valid-token",
        )
        self.assertEqual(response.status_code, 403)


class AccessControlTests(ThrottleResetMixin, CsrfTestMixin, TestCase):
    """6, 7, 8 - anonymous access and cross-user access."""

    def setUp(self):
        self.alice = User.objects.create_user(
            username="alice", email="alice@example.com", password="Str0ngPass!23"
        )
        self.bob = User.objects.create_user(
            username="bob", email="bob@example.com", password="Str0ngPass!23"
        )

    def test_anonymous_cannot_read_me(self):
        response = Client().get(ME_URL, HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.status_code, 403)

    def test_anonymous_cannot_logout(self):
        response = Client().post(
            LOGOUT_URL, data="{}", content_type="application/json", HTTP_ORIGIN=ORIGIN
        )
        self.assertEqual(response.status_code, 403)

    def test_user_reads_only_their_own_data(self):
        client = Client()
        client.force_login(self.alice)
        response = client.get(ME_URL, HTTP_ORIGIN=ORIGIN)

        self.assertEqual(response.status_code, 200)
        body = read_json(response)
        self.assertEqual(body["id"], self.alice.id)
        self.assertNotEqual(body["id"], self.bob.id)
        # There is no /me/<id>/ route at all, so no IDOR surface exists.
        self.assertEqual(Client().get("/api/auth/me/1/", HTTP_ORIGIN=ORIGIN).status_code, 404)

    def test_authenticated_user_gets_403_when_reaching_for_another_user(self):
        client = Client()
        client.force_login(self.bob)
        response = client.get("/api/auth/me/%s/" % self.alice.id, HTTP_ORIGIN=ORIGIN)
        self.assertIn(response.status_code, (403, 404))

    def test_user_permission_class_is_required_by_default(self):
        from django.conf import settings

        self.assertEqual(
            settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"],
            ["rest_framework.permissions.IsAuthenticated"],
        )


@override_settings(CORS_ALLOWED_ORIGINS=[ORIGIN])
class CorsTests(TestCase):
    """12, 13 - CORS behaviour."""

    def test_allowed_origin_receives_cors_header(self):
        response = Client().get(ME_URL, HTTP_ORIGIN=ORIGIN)
        self.assertEqual(response.headers.get("Access-Control-Allow-Origin"), ORIGIN)
        self.assertEqual(response.headers.get("Access-Control-Allow-Credentials"), "true")

    def test_disallowed_origin_receives_no_cors_header(self):
        response = Client().get(ME_URL, HTTP_ORIGIN="http://evil.example.com")
        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))

    def test_preflight_from_disallowed_origin_is_rejected(self):
        response = Client().options(
            LOGIN_URL,
            HTTP_ORIGIN="http://evil.example.com",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        )
        self.assertIsNone(response.headers.get("Access-Control-Allow-Origin"))

    def test_cors_is_not_wildcard(self):
        from django.conf import settings

        self.assertNotIn("CORS_ALLOW_ALL_ORIGINS", dir(settings))
        self.assertEqual(settings.CORS_ALLOWED_ORIGINS, [ORIGIN])


class ThrottleTests(ThrottleResetMixin, CsrfTestMixin, TestCase):
    """Brute-force protection on the login endpoint."""

    def test_login_is_rate_limited(self):
        User.objects.create_user(
            username="sara", email="sara@example.com", password="Str0ngPass!23"
        )
        client = self.csrf_client()
        token = self.get_csrf_token(client)

        statuses = []
        for _ in range(15):
            response = self.post_json(
                client,
                LOGIN_URL,
                {"identifier": "sara@example.com", "password": "wrong-password"},
                token,
            )
            statuses.append(response.status_code)

        self.assertIn(429, statuses, "login endpoint should throttle repeated attempts")


class AdminPasswordTests(TestCase):
    """10 - password management in the admin."""

    def test_change_form_shows_readonly_hash_and_exposes_set_password(self):
        from core.forms import CustomUserChangeForm

        form = CustomUserChangeForm()
        # Django's UserChangeForm shows the password as a ReadOnlyPasswordHashField
        # and links to a separate "Set password" form. The raw password is never
        # accepted or displayed, which is the documented behaviour.
        self.assertIn("password", form.fields)
        self.assertIsInstance(
            form.fields["password"], ReadOnlyPasswordHashField
        )

        user = User.objects.create_user(username="u", password="Str0ngPass!23")
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="Str0ngPass!23"
        )
        self.client.force_login(admin_user)
        response = self.client.get(
            reverse("admin:core_customuser_change", args=[user.id])
        )
        self.assertEqual(response.status_code, 200)
        # The admin UI is rendered in Persian, so assert on the reset-password
        # link target rather than the translated label.
        self.assertContains(response, "/password/")

    def test_creation_form_stores_hashed_password(self):
        from core.forms import CustomUserCreationForm

        form = CustomUserCreationForm(
            data={
                "username": "newadmin",
                "email": "admin@example.com",
                "password1": "Str0ngPass!23",
                "password2": "Str0ngPass!23",
            }
        )
        self.assertTrue(form.is_valid(), form.errors)
        user = form.save()
        self.assertNotEqual(user.password, "Str0ngPass!23")
        self.assertTrue(user.check_password("Str0ngPass!23"))


class UserModelTests(TestCase):
    """Phone normalization and identifier helpers."""

    def test_normalize_phone_variants(self):
        normalize = User.normalize_phone
        self.assertEqual(normalize("09123456789"), "+989123456789")
        self.assertEqual(normalize("+989123456789"), "+989123456789")
        self.assertEqual(normalize("00989123456789"), "+989123456789")
        self.assertEqual(normalize("9123456789"), "+989123456789")
        self.assertIsNone(normalize(""))
        self.assertIsNone(normalize(None))

    def test_get_identifier_prefers_email(self):
        user = User.objects.create_user(
            username="u", email="e@example.com", phone_number="+989120000000"
        )
        self.assertEqual(user.get_identifier(), "e@example.com")

    def test_customer_link_is_optional_for_guests(self):
        from store.models import Customer

        guest = Customer.objects.create(
            first_name="Guest", last_name="User", email="g@example.com",
            phone_number="09120000000", referral_code="GUEST1",
        )
        self.assertIsNone(guest.user)

        customer = Customer.objects.create(
            first_name="Sara", last_name="A", email="s2@example.com",
            phone_number="09130000000", referral_code="SARA2",
        )
        user = User.objects.create_user(username="sara2", email="s2@example.com")
        customer.user = user
        customer.save()

        # related_name="customer" gives the reverse one-to-one accessor.
        self.assertEqual(user.customer, customer)
        self.assertEqual(customer.user, user)

        other = User.objects.create_user(username="nobody")
        # No reverse row, so the descriptor raises rather than returning None.
        self.assertFalse(Customer.objects.filter(user=other).exists())
        with self.assertRaises(ObjectDoesNotExist):
            other.customer
