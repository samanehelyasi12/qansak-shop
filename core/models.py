import re

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class CustomUser(AbstractUser):
    """
    Authentication identity for the storefront.

    This model is deliberately kept to identity concerns only. Anything that
    describes a shopper (name, address, orders, referral) lives in
    ``store.Customer`` and is linked through a OneToOne field.

    ``username`` remains the ``USERNAME_FIELD`` inherited from ``AbstractUser``
    so that ``createsuperuser``, the admin site and ``ModelBackend`` keep
    working unchanged. Logins are accepted by email *or* mobile through
    ``core.backends.IdentifierAuthBackend``; ``username`` is derived from the
    identifier at registration time and is not something the frontend fills in.

    Both ``email`` and ``phone_number`` are nullable but individually unique.
    That allows a customer to register with an email address, a mobile number,
    or both, while still guaranteeing that an identifier identifies at most one
    account.
    """

    email = models.EmailField(blank=True, null=True, unique=True)
    phone_number = models.CharField(
        max_length=20, blank=True, null=True, unique=True, verbose_name="mobile"
    )

    REQUIRED_FIELDS = ["email"]

    def get_identifier(self) -> str:
        """The value the person actually signs in with."""
        return self.email or self.phone_number or self.username

    def clean(self) -> None:
        super().clean()
        # normalize_email is a manager helper; the model needs the base version.
        self.email = BaseUserManager.normalize_email(self.email) or None
        self.phone_number = self.normalize_phone(self.phone_number)

    @staticmethod
    def normalize_phone(value):
        """
        Normalize Iranian mobile numbers to E.164 (+989xxxxxxxxx).

        Accepts the forms a person is likely to type: ``09xxxxxxxxx``,
        ``+989xxxxxxxxx`` or ``00989xxxxxxxxx``. Returns ``None`` for empty
        input so the unique constraint does not collide on ``''``.

        Raises ``ValidationError`` when the value is clearly meant to be a
        mobile number but is malformed. Callers that are merely *searching*
        (such as the authentication backend) should use
        :meth:`phone_digits_or_none` instead.
        """
        if not value:
            return None

        digits = re.sub(r"\D", "", value)
        if not digits:
            raise ValidationError({"phone_number": "Enter a valid mobile number."})

        if digits.startswith("00"):
            # International prefix, e.g. 00989123456789.
            digits = digits[2:]
        if digits.startswith("98"):
            digits = "0" + digits[2:]
        elif len(digits) == 10 and digits.startswith("9"):
            digits = "0" + digits

        if not re.fullmatch(r"09\d{9}", digits):
            raise ValidationError(
                {"phone_number": "Enter a valid Iranian mobile number, e.g. 09123456789."}
            )

        return f"+98{digits[1:]}"

    @staticmethod
    def phone_digits_or_none(value):
        """
        Best-effort mobile normalization for lookups: returns the E.164 form
        or ``None`` if the input is not a usable mobile number.

        Used by the authentication backend, where the supplied identifier may
        be an email address or a username and must never raise.
        """
        try:
            return CustomUser.normalize_phone(value)
        except ValidationError:
            return None
