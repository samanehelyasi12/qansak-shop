"""
Serializers for payment.

``PaymentRequestSerializer`` takes an order code and nothing else. There is no
field for an amount, a status, a transaction id or a customer, so there is
nothing for a client to fill in wrongly.
"""

from rest_framework import serializers

from .models import Payment


class PaymentRequestSerializer(serializers.Serializer):
    """
    Ask the gateway to start a payment for an existing order.

    The client names the order; the amount is read from the order on the
    server.
    """

    order_code = serializers.CharField(max_length=20)


class PaymentSerializer(serializers.ModelSerializer):
    """The payment as the customer may see it.

    The gateway's authority and transaction reference are deliberately not
    exposed: they are internal identifiers, and a customer does not need them
    to see whether they paid.
    """

    order_code = serializers.CharField(source="order.order_code", read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ("order_code", "amount", "status", "created_at")
        read_only_fields = fields

    def get_status(self, obj) -> str:
        # Matches the vocabulary the storefront already renders.
        return {
            Payment.PAYMENT_STATUS_PENDING: "pending",
            Payment.PAYMENT_STATUS_SUCCESS: "paid",
            Payment.PAYMENT_STATUS_FAILED: "failed",
        }[obj.status]
