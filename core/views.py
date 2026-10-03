"""
Authentication API views.

Sessions are used, not tokens. Every state-changing endpoint here is protected
by ``rest_framework.authentication.SessionAuthentication``, which enforces CSRF
as required by the DRF documentation. No view is wrapped in ``csrf_exempt``.
"""

from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from store.discounts import DiscountError, register_referral
from store.services import get_or_create_customer_for_user

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """
    ``GET /api/auth/csrf/``

    Public. Issues the CSRF cookie so the frontend has a token to send with
    every state-changing request. This is the first call the frontend makes;
    the cookie is then read by JavaScript and echoed back in the
    ``X-CSRFToken`` header, which is what ``SessionAuthentication`` checks.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


@method_decorator(csrf_protect, name="dispatch")
class RegisterView(APIView):
    """
    ``POST /api/auth/register/``

    Public. Creates the account and signs the new user in immediately so the
    frontend only needs one round trip before checkout.

    ``csrf_protect`` is required here. ``APIView.as_view()`` marks every DRF
    view ``csrf_exempt``, and ``SessionAuthentication`` only runs its CSRF
    check for requests that already carry a session, so an anonymous POST to a
    login-style endpoint would otherwise be accepted without a token. The DRF
    documentation calls this out explicitly: "This behavior is not suitable
    for login views, which should always have CSRF validation applied."
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        referral_code = request.data.get("referral_code", "").strip()
        if referral_code:
            # Creates a Customer for the new account so the referral link can be
            # recorded. No reward is granted here: a reward needs a completed
            # purchase, which the payment stage decides.
            customer, _ = get_or_create_customer_for_user(user)
            try:
                register_referral(customer, referral_code)
            except DiscountError:
                # A self-referral or an unknown code must not block sign-up; the
                # account is still valid, it just carries no referral.
                pass

        login(request, user, backend="core.backends.IdentifierAuthBackend")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    """
    ``POST /api/auth/login/``

    Public. Establishes the session cookie. CSRF enforced, and throttled to
    limit brute-force attempts (see ``DEFAULT_THROTTLE_RATES`` in settings).
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        login(request, user, backend="core.backends.IdentifierAuthBackend")
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    ``POST /api/auth/logout/``

    Authenticated. Flushes the session server-side; the browser then drops the
    session cookie. CSRF is enforced by ``SessionAuthentication`` because the
    request carries a session.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """
    ``GET /api/auth/me/``

    Authenticated. Returns the current user's own record only. There is no
    lookup by id, so one user can never read or modify another user's data
    through this endpoint.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
