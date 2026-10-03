"""
Public read-only catalog API.

Only the endpoints the existing pages need:

* ``/api/products/``          the product grid, with the filters the grid and
                              the header search actually apply
* ``/api/products/<slug>/``   the product detail page
* ``/api/categories/``        the category list used by the home and grid pages
* ``/api/categories/<slug>/`` the category page

Everything here is public read access. There is no create, update or delete
endpoint for the catalog: prices and option deltas are staff data and are
edited in the Django admin.
"""

import logging

from django.conf import settings
from django.db.models import Avg, Prefetch, Q
from django.shortcuts import redirect
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .discounts import DiscountError
from .gateways import GatewayError, ZarinpalGateway
from .models import (
    Address,
    Category,
    Comment,
    Customer,
    Order,
    Payment,
    Product,
    ProductOption,
)
from .order_serializers import (
    GuestOrderCreateSerializer,
    OrderCreateSerializer,
    OrderSerializer,
)
from .orders import OrderError, place_guest_order, place_order
from .payment_serializers import PaymentRequestSerializer, PaymentSerializer
from .payments import PaymentError, get_payable_order, settle_payment, start_payment

logger = logging.getLogger(__name__)
from .serializers import (
    AddressSerializer,
    CategorySerializer,
    CommentCreateSerializer,
    CommentSerializer,
    CustomerSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from .services import get_or_create_customer_for_user


def product_queryset(with_options: bool = False):
    """
    Base queryset for products.

    ``select_related("category")`` removes the per-product category lookup and
    ``prefetch_related("images")`` the per-product image lookup. The rating
    annotation is what lets the serializer show a score without a query per
    product. The ``Meta.ordering`` on the related models makes the gallery and
    the option lists come back in the right order.
    """
    queryset = Product.objects.select_related("category").prefetch_related("images")

    queryset = queryset.annotate(
        rating_average=Avg(
            "comments__rating",
            filter=Q(comments__status=Comment.COMMENT_STATUS_APPROVED),
        )
    )

    if with_options:
        queryset = queryset.prefetch_related(
            Prefetch(
                "options",
                queryset=ProductOption.objects.prefetch_related("values"),
            )
        )

    return queryset


class ProductListView(generics.ListAPIView):
    """
    ``GET /api/products/``

    Optional query parameters, each one mirroring an existing frontend filter:

    ``?category=<slug>``   products in a category
    ``?best_seller=1``    the "best sellers" strip
    ``?new=1``            the "new products" strip
    ``?search=<text>``    the header search box
    """

    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = product_queryset()
        params = self.request.query_params

        if category := params.get("category"):
            queryset = queryset.filter(category__slug=category)
        if params.get("best_seller"):
            queryset = queryset.filter(is_best_seller=True)
        if params.get("new"):
            queryset = queryset.filter(is_new=True)
        if search := params.get("search", "").strip():
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(category__title__icontains=search)
            )

        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """``GET /api/products/<slug>/`` — the product page."""

    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_queryset(self):
        return product_queryset(with_options=True)


class CategoryListView(generics.ListAPIView):
    """``GET /api/categories/`` — the category grid."""

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    queryset = Category.objects.all()


class CategoryDetailView(generics.RetrieveAPIView):
    """``GET /api/categories/<slug>/`` — the category page header."""

    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    queryset = Category.objects.all()


class ProductCommentView(APIView):
    """
    ``GET`` / ``POST`` ``/api/products/<slug>/comments/`` — the reviews.

    ``GET`` is public and returns the approved reviews only, newest first. A
    review still waiting for moderation is deliberately absent: approving it is
    the admin's decision, and nothing else may make it visible.

    ``POST`` submits a review. It is open to guests as well as signed-in
    customers -- a review should not require an account -- so the throttle below
    is the only thing standing between a visitor and unlimited writes. The
    response is ``201`` with a body saying the review is waiting for approval,
    not the review itself, because it is not public yet.
    """

    permission_classes = [AllowAny]

    def get_throttles(self):
        # Scoped, so the read is never throttled: only the write is limited.
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_product(self) -> Product:
        slug = self.kwargs["slug"]
        try:
            return Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            raise NotFound("محصول یافت نشد.")

    def get(self, request, slug):
        product = self.get_product()
        comments = product.comments.filter(status=Comment.COMMENT_STATUS_APPROVED)
        return Response(CommentSerializer(comments, many=True).data)

    def post(self, request, slug):
        product = self.get_product()
        serializer = CommentCreateSerializer(
            data=request.data,
            context={"request": request, "product": product},
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        return Response(
            {
                "id": comment.id,
                "status": comment.status,
                "message": "نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.",
            },
            status=status.HTTP_201_CREATED,
        )


def existing_customer(request):
    """
    The customer profile of the authenticated user, or ``None``.

    Read-only: it never creates anything. Used by the GET paths so that a
    plain read has no side effects.
    """
    return getattr(request.user, "customer", None)


def request_customer(request) -> Customer:
    """
    The customer profile of the authenticated user, created on first use.

    The owner is always taken from ``request.user``; no identifier from the
    request is involved, so there is no way to address another customer's data.
    """
    customer = existing_customer(request)
    if customer is not None:
        return customer
    customer, _ = get_or_create_customer_for_user(request.user)
    return customer


class MyCustomerView(generics.RetrieveAPIView):
    """
    ``GET /api/customer/``

    The signed-in customer's own profile. Read-only: the checkout form posts
    these details as part of the order, so there is no separate write endpoint
    for the profile itself.
    """

    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    queryset = Customer.objects.all()

    def get_object(self):
        return request_customer(self.request)


class MyAddressView(APIView):
    """
    ``GET`` / ``PUT`` / ``PATCH`` ``/api/customer/address/`` — the signed-in
    customer's address.

    Qandak's rule is one address per customer, and the three methods differ
    only in how the single row is obtained:

    ``GET``    read only. If there is no address yet, 404. A read must not
               create a Customer or an Address.
    ``PUT``    create the address if it is missing, otherwise update the
               existing row.
    ``PATCH``  update the existing row only; 404 if there is nothing to update.

    None of them can ever produce a second Address for the same customer, and
    none of them creates a new row on a repeated update.
    """

    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customer = existing_customer(request)
        if customer is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            address = customer.address
        except Address.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        return Response(self.serializer_class(address).data)

    def put(self, request):
        customer = request_customer(request)
        # The row is created with a placeholder and immediately overwritten by
        # the payload; PUT is the only method allowed to bring one into being.
        address, _ = Address.objects.get_or_create(
            customer=customer, defaults={"address": ""}
        )
        return self._update(address, request)

    def patch(self, request):
        customer = existing_customer(request)
        if customer is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        try:
            address = customer.address
        except Address.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        return self._update(address, request)

    def _update(self, address, request):
        serializer = self.serializer_class(
            address, data=request.data, partial=request.method == "PATCH"
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


def _orders_for(user):
    """
    Only the signed-in customer's own orders.

    Filtering the queryset is what stops one customer from seeing another's
    orders; an object-level permission alone would not help, because a list
    endpoint never runs a per-object check.

    ``select_related("customer")`` is there because the serializer reports
    whether the buyer had an account, which means reading ``customer.user_id``.
    Without it that read is one extra query per order, so the list grew by one
    query for every order on the page.
    """
    return Order.objects.filter(customer__user=user).select_related("customer")


class OrderListCreateView(generics.ListCreateAPIView):
    """
    ``GET  /api/orders/`` — the customer's own order history.
    ``POST /api/orders/`` — place an order.

    There is no update endpoint: an order's prices and snapshots are fixed once
    it is placed.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        return _orders_for(self.request.user).prefetch_related("items")

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer = request_customer(request)
        try:
            address = customer.address
        except Address.DoesNotExist:
            address = None

        try:
            order = place_order(
                customer=customer,
                items=serializer.validated_data["items"],
                delivery_method=serializer.validated_data["delivery_method"],
                address=address,
                discount_code=serializer.validated_data.get("discount_code") or None,
            )
        except (OrderError, DiscountError) as exc:
            field = exc.field or "non_field_errors"
            raise ValidationError({field: [exc.message]}) from exc

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class GuestOrderCreateView(APIView):
    """
    ``POST /api/guest-orders/`` — place an order without an account.

    Kept separate from ``/api/orders/`` on purpose. That endpoint is scoped to
    the signed-in customer and is throttled as an authenticated action; guest
    checkout is public, so it needs its own surface, its own throttling and its
    own validation of the contact details it needs.

    The request carries the guest's name, e-mail, phone and address. It cannot
    name a customer: the Customer is resolved from those details by
    ``resolve_guest_customer``, and an e-mail that belongs to a registered
    account is refused rather than reused.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "guest_order"

    def post(self, request):
        serializer = GuestOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order = place_guest_order(
                details={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "email": data["email"],
                    "phone_number": data["phone_number"],
                    "address": data["address"],
                },
                items=data["items"],
                delivery_method=data["delivery_method"],
                discount_code=data.get("discount_code") or None,
            )
        except (OrderError, DiscountError) as exc:
            field = exc.field or "non_field_errors"
            raise ValidationError({field: [exc.message]}) from exc

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    """
    ``GET /api/orders/<order_code>/`` — one of the customer's own orders.

    Looked up by ``order_code`` within the customer's own orders only, so a
    code belonging to someone else is simply not found.
    """

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "order_code"

    def get_queryset(self):
        return _orders_for(self.request.user).prefetch_related("items")


# --------------------------------------------------------------------------
# Payment
# --------------------------------------------------------------------------


def _gateway():
    """The configured payment gateway, or None when it is not set up."""
    from django.conf import settings

    if not getattr(settings, "ZARINPAL_MERCHANT_ID", ""):
        return None
    return ZarinpalGateway(
        merchant_id=settings.ZARINPAL_MERCHANT_ID,
        base_url=settings.ZARINPAL_API_BASE_URL,
        timeout=settings.PAYMENT_GATEWAY_TIMEOUT,
    )


def _resolve_own_order(request, order_code: str) -> Order:
    """
    Resolve an order the caller is entitled to see.

    Signed-in customers are matched against their own orders only. A guest is
    matched on the order code together with the e-mail the order was placed
    with, because a guest has no session to check.

    This checks ownership only. Whether the order can still be paid for is a
    separate question, asked by :func:`get_payable_order`, so that the result
    endpoint can still report on an order that has already been paid.
    """
    order = (
        Order.objects.select_related("customer")
        .filter(order_code=order_code)
        .first()
    )
    if order is None:
        raise PaymentError("Order not found.", field="order_code")

    if request.user.is_authenticated:
        if order.customer.user_id != request.user.id:
            # Same answer as "not found", so the endpoint does not confirm that
            # somebody else's order exists.
            raise PaymentError("Order not found.", field="order_code")
    else:
        # A guest may reach this from either place: the result page is a GET and
        # carries the e-mail in the query string, while a payment request is a
        # POST and carries it in the body. Reading only one of them meant the
        # documented guest result flow could never match.
        email = (
            getattr(request, "query_params", {}).get("email")
            or getattr(request, "data", {}).get("email")
            or ""
        ).strip().lower()
        if not email or order.email.lower() != email:
            raise PaymentError("Order not found.", field="order_code")

    return order


def _find_payable_order(request, order_code: str) -> Order:
    """An order the caller owns and may still pay for."""
    return get_payable_order(_resolve_own_order(request, order_code), user=request.user)


class PaymentStartView(APIView):
    """
    ``POST /api/payments/zarinpal/request/``

    Starts a payment for an order. The response carries only what the storefront
    needs to send the customer to the gateway.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment"

    def post(self, request):
        serializer = PaymentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Ownership and order state are checked before the gateway is touched,
        # so a caller cannot probe for somebody else's order by watching the
        # gateway's availability.
        try:
            order = _find_payable_order(request, serializer.validated_data["order_code"])
        except (PaymentError, DiscountError, OrderError) as exc:
            field = exc.field or "non_field_errors"
            raise ValidationError({field: [exc.message]}) from exc

        gateway = _gateway()
        if gateway is None:
            return Response(
                {"detail": "Payments are not available right now."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            payment = start_payment(order, gateway)
        except GatewayError:
            return Response(
                {"detail": "The payment gateway is unavailable. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except PaymentError as exc:
            field = exc.field or "non_field_errors"
            raise ValidationError({field: [exc.message]}) from exc

        return Response(
            {
                "payment_url": gateway.payment_url(payment.authority),
                "order_code": order.order_code,
            },
            status=status.HTTP_201_CREATED,
        )


def _redirect_to_result_page(order_code: str):
    """
    Sends the browser from the gateway callback to the storefront's result page.

    The gateway return is a navigation, not an API call, so answering it with
    JSON would leave the customer staring at a raw payload. Verification has
    already happened by this point; the page then reads the recorded outcome
    from ``/api/payments/result/``.

    The destination comes from settings, never from the query string, so nothing
    in the URL can steer the redirect somewhere else.
    """
    return redirect(f"{settings.FRONTEND_BASE_URL}/payment/result?order={order_code}")


class PaymentCallbackView(APIView):
    """
    ``GET /api/payments/callback/<order_code>/``

    Where the gateway sends the customer back. Public, because the gateway calls
    it, but it decides nothing on its own: the query string is only a trigger
    to verify the stored authority with the gateway.

    ``Status=OK`` in the query is never treated as proof of payment.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_callback"

    def get(self, request, order_code):
        gateway = _gateway()
        if gateway is None:
            # Nothing can be verified, so nothing is claimed. The result page
            # reads the stored payment and shows the truth.
            return _redirect_to_result_page(order_code)

        payment = (
            Payment.objects.select_related("order")
            .filter(order__order_code=order_code, status=Payment.PAYMENT_STATUS_PENDING)
            .order_by("-created_at")
            .first()
        )
        if payment is None:
            # Either unknown or already handled. Either way there is nothing to
            # verify, and the result endpoint reports the truth.
            return _redirect_to_result_page(order_code)

        authority = request.query_params.get("Authority") or request.query_params.get("authority")

        try:
            settle_payment(payment, gateway, authority=authority)
        except GatewayError:
            # A verification that could not complete leaves the payment
            # pending: no stock consumed, no rewards, no false success.
            logger.info("Payment verification for %s did not complete", order_code)
        except Exception:  # noqa: BLE001 - never let a callback 500 the flow
            logger.exception("Unexpected error while settling payment for %s", order_code)

        return _redirect_to_result_page(order_code)

    def _no_payment_response(self, order_code):
        """Also a redirect: the browser came from the gateway, not from an API."""
        return _redirect_to_result_page(order_code)


class PaymentResultView(APIView):
    """
    ``GET /api/payments/result/?order_code=...&email=...``

    The storefront's result page reads the truth from here rather than deciding
    success from a query string. Signed-in customers need only the order code;
    a guest must also give the e-mail the order was placed with.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_result"

    def get(self, request):
        order_code = (request.query_params.get("order_code") or "").strip()
        if not order_code:
            raise ValidationError({"order_code": ["This field is required."]})
        try:
            # Ownership only. A settled order still has a result to report.
            order = _resolve_own_order(request, order_code)
        except (PaymentError, DiscountError, OrderError) as exc:
            field = exc.field or "non_field_errors"
            raise ValidationError({field: [exc.message]}) from exc

        payment = order.payments.order_by("-created_at").first()
        data = {
            "order_code": order.order_code,
            "order_status": order.status,
            "amount": str(payment.amount) if payment else str(order.total),
        }
        if payment is None:
            data["payment_status"] = "pending"
        else:
            data["payment_status"] = {
                Payment.PAYMENT_STATUS_PENDING: "pending",
                Payment.PAYMENT_STATUS_SUCCESS: "paid",
                Payment.PAYMENT_STATUS_FAILED: "failed",
            }[payment.status]
            data["paid_at"] = payment.verified_at

        return Response(data)
