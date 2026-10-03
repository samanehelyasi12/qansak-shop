"""
Small helpers shared between the auth views and the store.

Lives apart from ``store.views`` so that ``core`` can use it without importing
the view module, which would be circular.
"""

from .models import Customer


def get_or_create_customer_for_user(user) -> tuple:
    """
    Return ``(customer, created)`` for an authenticated account.

    The Customer profile is created on first use. A guest Customer always has
    ``user`` set to ``None``, so this never collides with one.
    """
    customer = getattr(user, "customer", None)
    if customer is not None:
        return customer, False

    customer = Customer.objects.create(
        user=user,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email or f"{user.pk}@guest.invalid",
        phone_number=user.phone_number or "",
    )
    return customer, True
