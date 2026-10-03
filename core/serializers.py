"""
Serializers for authentication.

Only the fields the frontend actually renders are exposed. The password is
write-only and never appears in a response.
"""

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the signed-in user."""

    identifier = serializers.CharField(source="get_identifier", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "identifier", "email", "phone_number", "first_name", "last_name")
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    """
    Creates an account from the frontend's single ``identifier`` field.

    The identifier may be an email address or an Iranian mobile number. An
    email-like value is stored as ``email``; anything else is normalized to
    E.164 and stored as ``phone_number``.
    """

    identifier = serializers.CharField(max_length=254, trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    # Optional. Recorded once, at sign-up, and only as a link: entering a code
    # never grants a reward, because a reward belongs to a completed purchase.
    referral_code = serializers.CharField(
        max_length=20, required=False, allow_blank=True, trim_whitespace=True
    )

    def validate_identifier(self, value: str) -> str:
        if "@" in value:
            # Leave email normalization to the model/manager.
            return value

        try:
            return User.normalize_phone(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if exc.message_dict else exc.messages
            ) from exc

    def validate(self, attrs: dict) -> dict:
        identifier = attrs["identifier"]
        lookup = {"email__iexact": identifier} if "@" in identifier else {"phone_number": identifier}

        if User.objects.filter(**lookup).exists():
            field = "email" if "@" in identifier else "phone_number"
            raise serializers.ValidationError(
                {"identifier": [f"An account with this {field} already exists."]}
            )

        try:
            validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc

        return attrs

    def create(self, validated_data: dict) -> User:
        identifier = validated_data.pop("identifier")
        password = validated_data.pop("password")
        validated_data.pop("referral_code", None)

        fields = {
            "email": identifier if "@" in identifier else "",
            "phone_number": None if "@" in identifier else identifier,
            "first_name": validated_data.get("first_name", ""),
            "last_name": validated_data.get("last_name", ""),
            # Derived, not user supplied: the frontend never asks for a username.
            "username": self._unique_username(identifier),
        }

        user = User(**fields)
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def _unique_username(identifier: str) -> str:
        base = identifier.split("@")[0] if "@" in identifier else f"user{identifier[-4:]}"
        base = "".join(ch for ch in base.lower() if ch.isalnum() or ch in "._-+")[:140] or "user"

        candidate = base
        suffix = 1
        while User.objects.filter(username=candidate).exists():
            suffix += 1
            candidate = f"{base}{suffix}"

        return candidate


class LoginSerializer(serializers.Serializer):
    """Validates credentials and returns the authenticated user."""

    identifier = serializers.CharField(max_length=254, trim_whitespace=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["identifier"],
            password=attrs["password"],
        )

        if user is None:
            # Deliberately identical for unknown identifier and wrong password.
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid identifier or password."]}
            )

        attrs["user"] = user
        return attrs
