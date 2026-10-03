"""
Serializers for the public catalog.

These mirror the shapes the existing Next.js pages already consume
(``types/product.ts`` and ``types/category.ts``), so the frontend does not need
to change its types when it starts calling the API.

The catalog serializers are read-only: prices and option deltas are staff data
and are edited in the Django admin. The one writable path a visitor gets is a
product review, handled by :class:`CommentCreateSerializer` below.
"""

from rest_framework import serializers

from .models import (
    Address,
    Category,
    Comment,
    Customer,
    Product,
    ProductOption,
    ProductOptionValue,
)


class ProductOptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOptionValue
        fields = ("id", "slug", "label", "price_delta")
        read_only_fields = fields


class ProductOptionSerializer(serializers.ModelSerializer):
    # `values` is prefetched onto the instance by the view, so this does not
    # trigger a query per option.
    values = ProductOptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductOption
        fields = ("id", "slug", "name", "values")
        read_only_fields = fields


class ProductListSerializer(serializers.ModelSerializer):
    """
    Shape used by the grid and list pages.

    Options and their values are omitted here: the catalog needs the base
    price and the flags, and shipping every option of every product on a list
    page would be a lot of payload for data the card never renders.
    """

    category_slug = serializers.CharField(source="category.slug", read_only=True)
    images = serializers.SerializerMethodField()
    in_stock = serializers.BooleanField(read_only=True)
    rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "description",
            "price",
            "images",
            "category_slug",
            "preparation_hours",
            "is_best_seller",
            "is_new",
            "in_stock",
            "rating",
        )
        read_only_fields = fields

    def get_images(self, obj) -> list:
        request = self.context.get("request")
        return [request.build_absolute_uri(image.image.url) for image in obj.images.all()]

    def get_rating(self, obj):
        return round(obj.average_rating, 1) if obj.average_rating is not None else 0


class ProductDetailSerializer(ProductListSerializer):
    """Adds the options, which only the product page renders."""

    options = ProductOptionSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ("options",)


class CategorySerializer(serializers.ModelSerializer):
    # The frontend type calls this "name"; the column has always been "title".
    name = serializers.CharField(source="title", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "slug", "name", "description", "image_url")
        read_only_fields = fields

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url)


class AddressSerializer(serializers.ModelSerializer):
    """
    The customer's own address.

    There is no id in the payload on purpose: the address id is the customer id,
    and the owner is always the authenticated user, so nothing in the request
    can point at someone else's row.
    """

    class Meta:
        model = Address
        fields = ("address",)
        # `address` is the one writable field. The customer is deliberately
        # absent from `fields`, so it can never be set from the request body.
        extra_kwargs = {"address": {"allow_blank": False}}


class CustomerSerializer(serializers.ModelSerializer):
    """The signed-in customer's own profile. Read-only."""

    is_registered = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = (
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "referral_code",
            "is_registered",
            "address",
        )
        read_only_fields = fields

    def get_is_registered(self, obj) -> bool:
        return obj.user_id is not None

    def get_address(self, obj) -> str:
        address = getattr(obj, "address", None)
        return address.address if address else ""


class CommentSerializer(serializers.ModelSerializer):
    """
    One approved review, as the storefront shows it.

    Only the approved ones are ever serialized by the public list endpoint: a
    review that has not been through moderation must not reach a visitor.
    """

    # The frontend calls the reviewer "author" and the text "comment".
    author = serializers.CharField(source="name", read_only=True)
    comment = serializers.CharField(source="body", read_only=True)
    created_at = serializers.DateTimeField(source="datetime_created", read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "author", "rating", "comment", "created_at")
        read_only_fields = fields


class CommentCreateSerializer(serializers.ModelSerializer):
    """
    A review submitted from the product page.

    Whoever writes it -- signed in or a guest -- supplies a score and a body.
    The name is taken from the session when there is one and is otherwise what
    the visitor typed, so a guest can review too without an account.

    Two things are deliberately not writable here:

    * ``status``. A new review starts as ``waiting`` and becomes visible only
      after a staff member approves it in the admin.
    * ``product``. The product comes from the URL the request was made to.
    """

    name = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        help_text="Only used when the reviewer has no session.",
    )

    class Meta:
        model = Comment
        fields = ("name", "body", "rating")
        extra_kwargs = {
            "body": {"allow_blank": False},
            # The model's own 1..5 validators already run here; declaring them
            # again would only repeat the same message twice.
            "rating": {"min_value": 1, "max_value": 5},
        }

    def validate_body(self, value: str) -> str:
        body = value.strip()
        if not body:
            raise serializers.ValidationError("متن نظر نمی‌تواند خالی باشد.")
        return body

    def validate(self, attrs):
        # A guest has to say who they are; a signed-in reviewer does not, their
        # name comes from the session and anything typed is ignored.
        if not self.context["request"].user.is_authenticated:
            name = (attrs.get("name") or "").strip()
            if not name:
                raise serializers.ValidationError(
                    {"name": "برای ثبت نظر، نام خود را وارد کنید."}
                )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        if user.is_authenticated:
            display_name = " ".join(
                part for part in (user.first_name, user.last_name) if part
            ).strip()
            name = display_name or user.username
        else:
            name = validated_data["name"].strip()

        return Comment.objects.create(
            product=self.context["product"],
            name=name,
            body=validated_data["body"],
            rating=validated_data.get("rating") or 5,
            # Never approved on submission: the admin queue is the gate.
            status=Comment.COMMENT_STATUS_WAITING,
        )
