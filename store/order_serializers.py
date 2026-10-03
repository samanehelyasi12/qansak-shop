"""
Serializers for placing and viewing orders.

``OrderItemInputSerializer`` is the only place a client describes what it
wants. It has no price fields at all: ``unit_price``, ``total``, ``subtotal``,
``shipping_cost`` and the order ``total`` are absent from every writable
serializer, so there is nothing for a client to fill in wrongly.
"""

from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    """One requested line. Deliberately carries no monetary field."""

    product = serializers.IntegerField()
    quantity = serializers.IntegerField(required=False, default=1, min_value=1)
    selected_options = serializers.DictField(required=False, default=dict)


class OrderCreateSerializer(serializers.Serializer):
    """
    The order submission for a signed-in customer.

    ``customer`` and every amount are not accepted here. The customer comes
    from the session and the amounts are computed on the server, so nothing in
    this payload can influence them.
    """

    items = OrderItemInputSerializer(many=True)
    delivery_method = serializers.ChoiceField(
        choices=Order.DELIVERY_METHODS, required=False, default=Order.DELIVERY_STANDARD
    )
    # The only discount-related field a client may send. It is matched against
    # the signed-in customer's own code; the percent and the resulting amount
    # are read from the database.
    discount_code = serializers.CharField(required=False, allow_blank=True, max_length=20)


class GuestOrderCreateSerializer(OrderCreateSerializer):
    """
    The order submission for a shopper with no account.

    Adds the contact details a guest has to type at checkout. Note what is
    *not* here: no customer, no user, no owner of any kind. The Customer record
    behind the order is derived from ``email`` on the server.
    """

    first_name = serializers.CharField(max_length=255)
    last_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone_number = serializers.CharField(max_length=255)
    address = serializers.CharField()


class OrderItemSerializer(serializers.ModelSerializer):
    """A stored line, shown from its own snapshot."""

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product_name",
            "product_slug",
            "quantity",
            "price",
            "total",
            "selected_options",
            "options_snapshot",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    """
    An order as the customer sees it.

    Every field comes from the snapshot, including the buyer details, so a
    later profile edit does not rewrite the order.
    """

    items = OrderItemSerializer(many=True, read_only=True)
    customer = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "order_code",
            "tracking_code",
            "datetime_created",
            "status",
            "delivery_method",
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "address",
            "items",
            "subtotal",
            "shipping_cost",
            "discount",
            "total",
            "customer",
        )
        read_only_fields = fields

    def get_customer(self, obj) -> dict:
        # The buyer's name and contact are already on the order itself; this
        # only reports whether they had an account.
        return {
            "first_name": obj.first_name,
            "last_name": obj.last_name,
            "phone": obj.phone_number,
            "is_registered": obj.customer.user_id is not None,
        }
