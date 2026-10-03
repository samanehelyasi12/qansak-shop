"""
Authentication backend allowing sign-in with an email address or a mobile
number, in addition to the username that ``ModelBackend`` already supports.

The frontend registration form collects a single ``identifier`` field that may
hold either an email address or a phone number, so the login endpoint has to
resolve both. Rather than changing ``USERNAME_FIELD`` (which would ripple into
migrations, the admin, ``createsuperuser`` and every ``ModelBackend`` lookup),
this backend adds identifier resolution on top of the default behaviour.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q


class IdentifierAuthBackend(ModelBackend):
    """
    ``ModelBackend`` that first tries the exact ``username``, then treats the
    supplied value as an email address or a mobile number.

    Password verification, ``user_can_authenticate`` and permission checks are
    inherited unchanged, so security behaviour stays identical to the default
    backend.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()

        if username is None:
            username = kwargs.get(UserModel.USERNAME_FIELD)

        if username is None or password is None:
            return None

        # The username, email and phone lookups are alternatives, so the phone
        # clause is only added when the input really is a mobile number.
        # ``phone_digits_or_none`` returns ``None`` for anything that is not a
        # number, and ``phone_number=None`` would then match every account that
        # has no number on file -- turning every username-only sign-in into a
        # MultipleObjectsReturned failure.
        lookups = Q(username=username) | Q(email__iexact=username)
        phone_number = UserModel.phone_digits_or_none(username)
        if phone_number is not None:
            lookups |= Q(phone_number=phone_number)

        try:
            user = UserModel._default_manager.get(lookups)
        except UserModel.DoesNotExist:
            # Run the default hasher once to mitigate timing attacks.
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            # More than one account shares the identifier. Refuse to guess
            # which one was meant rather than authenticating an arbitrary one.
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None
