from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    Address,
    Category,
    Comment,
    Customer,
    Discount,
    Order,
    OrderItem,
    Payment,
    Product,
    ProductImage,
    ProductOption,
    ProductOptionValue,
)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("__str__", "email", "phone_number", "referral_code", "user")
    # "user" tells staff at a glance who is a guest and who has an account.
    list_filter = ("referred_by",)
    search_fields = ("first_name", "last_name", "email", "phone_number", "referral_code")
    # The referral link is set once, at sign-up, and is what stops one customer
    # from re-pointing a referral at themselves later.
    readonly_fields = ("referral_code", "referred_by")

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        # The referral code identifies the customer in the referral program;
        # changing it by hand would break links other people already hold.
        if obj is not None:
            readonly.append("user")
        return readonly


class ProductOptionValueInline(admin.TabularInline):
    model = ProductOptionValue
    extra = 1


class ProductOptionInline(admin.TabularInline):
    model = ProductOption
    extra = 1
    # The values belong to the options, so they are nested one level deeper
    # rather than repeating the option form for every value.
    inlines = [ProductOptionValueInline]


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "position")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "top_product")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    # "top_product" is chosen from every product, which is a long list to open
    # per row; autocomplete keeps the changelist usable as the shop grows.
    autocomplete_fields = ("top_product",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "inventory", "in_stock", "is_best_seller", "is_new")
    list_filter = ("category", "is_best_seller", "is_new")
    search_fields = ("name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("datetime_created", "datetime_modified")
    inlines = [ProductOptionInline, ProductImageInline]

    @admin.display(description="in stock")
    def in_stock(self, obj):
        return obj.in_stock

    def get_queryset(self, request):
        # Same for the product dropdown used by CategoryAdmin.autocomplete_fields.
        return super().get_queryset(request).select_related("category")


@admin.register(ProductOption)
class ProductOptionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product", "position")
    list_filter = ("product",)
    search_fields = ("name", "slug", "product__name")
    autocomplete_fields = ("product",)
    inlines = [ProductOptionValueInline]


@admin.register(ProductOptionValue)
class ProductOptionValueAdmin(admin.ModelAdmin):
    list_display = ("label", "slug", "option", "price_delta", "position")
    list_filter = ("option",)
    search_fields = ("label", "slug", "option__name")
    autocomplete_fields = ("option",)


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    """
    Issued discounts and whether they were spent.

    Nothing here is editable by hand: a discount is either issued by the system
    or it is not, and its usage state is written in the same transaction that
    applies it to an order. Allowing an admin to tick "used" would create a
    second way for a discount to look spent.
    """

    list_display = ("customer", "discount_type", "percent", "created_at", "used", "used_order")
    list_filter = ("discount_type", "used_at", "created_at")
    search_fields = ("customer__email", "customer__first_name", "customer__last_name")
    autocomplete_fields = ("customer",)
    readonly_fields = (
        "customer",
        "discount_type",
        "percent",
        "created_at",
        "used_at",
        "used_order",
    )

    @admin.display(boolean=True, description="used")
    def used(self, obj):
        return obj.is_used

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        # View-only: a manager needs to see what was issued and spent, but the
        # rows are written by the system.
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    # The address id is the customer id, so it is shown rather than editable.
    list_display = ("customer", "address")
    search_fields = ("customer__first_name", "customer__last_name", "customer__email", "address")
    autocomplete_fields = ("customer",)

    def get_readonly_fields(self, request, obj=None):
        # The link between the address and its owner must not be reassignable.
        return ("customer",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    # Read-only: the snapshots are the record of what was actually bought and
    # charged, so they must not be editable by hand.
    extra = 0
    can_delete = False
    fields = ("product_name", "quantity", "price", "total", "selected_options")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_code",
        "customer",
        "status",
        "delivery_method",
        "total",
        "datetime_created",
    )
    list_filter = ("status", "delivery_method", "datetime_created")
    search_fields = ("order_code", "tracking_code", "email", "phone_number", "customer__email")
    readonly_fields = (
        "order_code",
        "tracking_code",
        "customer",
        "first_name",
        "last_name",
        "email",
        "phone_number",
        "address",
        "subtotal",
        "shipping_cost",
        "discount",
        "total",
        "datetime_created",
    )
    inlines = [OrderItemInline]

    def has_add_permission(self, request):
        # Orders are placed through the storefront, not typed into the admin.
        return False

    def has_delete_permission(self, request, obj=None):
        # An order is a financial record.
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Payments are read here, not edited.

    Status, amount and the gateway reference are written by the payment
    service in one transaction with the stock movement they cause. Letting an
    admin hand-edit them would put a second, unaudited way to mark an order
    paid.
    """

    list_display = ("order", "amount", "status", "created_at", "verified_at")
    list_filter = ("status", "created_at")
    search_fields = ("order__order_code", "order__email", "order__phone_number")
    readonly_fields = (
        "order",
        "amount",
        "status",
        "transaction_id",
        "authority",
        "created_at",
        "verified_at",
    )
    autocomplete_fields = ("order",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    # The moderation queue is the reason this admin exists, so the status
    # filter and ordering are what a manager actually uses here.
    list_display = ("name", "product", "rating", "status", "datetime_created")
    list_filter = ("status", "rating", "datetime_created")
    search_fields = ("name", "body", "product__name")
    readonly_fields = ("datetime_created",)
    actions = ("approve_comments", "reject_comments")

    @admin.action(description=_("Approve selected comments"))
    def approve_comments(self, request, queryset):
        queryset.update(status=Comment.COMMENT_STATUS_APPROVED)

    @admin.action(description=_("Mark selected comments as not approved"))
    def reject_comments(self, request, queryset):
        queryset.update(status=Comment.COMMENT_STATUS_NOTAPPROVED)
