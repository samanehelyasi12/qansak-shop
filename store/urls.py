from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListView,
    GuestOrderCreateView,
    MyAddressView,
    MyCustomerView,
    OrderDetailView,
    OrderListCreateView,
    PaymentCallbackView,
    PaymentResultView,
    PaymentStartView,
    ProductCommentView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path(
        "products/<slug:slug>/comments/",
        ProductCommentView.as_view(),
        name="product-comments",
    ),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category-detail"),
    path("customer/", MyCustomerView.as_view(), name="my-customer"),
    path("customer/address/", MyAddressView.as_view(), name="my-address"),
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path(
        "guest-orders/",
        GuestOrderCreateView.as_view(),
        name="guest-order-create",
    ),
    path(
        "orders/<str:order_code>/",
        OrderDetailView.as_view(),
        name="order-detail",
    ),
    # --- Payment ---
    path(
        "payments/zarinpal/request/",
        PaymentStartView.as_view(),
        name="payment-start",
    ),
    path(
        "payments/callback/<str:order_code>/",
        PaymentCallbackView.as_view(),
        name="payment-callback",
    ),
    path(
        "payments/result/",
        PaymentResultView.as_view(),
        name="payment-result",
    ),
]
