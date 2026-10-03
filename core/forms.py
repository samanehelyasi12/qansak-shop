"""Forms for managing users from the Django admin."""

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    """Admin form for creating a user, including the mobile number."""

    phone_number = forms.CharField(
        max_length=20, required=False, help_text="Optional. Iranian mobile number."
    )

    class Meta:
        model = User
        fields = ("username", "email", "phone_number", "first_name", "last_name")

    def clean_email(self):
        # AbstractUser leaves email optional and unvalidated for uniqueness;
        # the admin form should behave the same way the API does.
        email = self.cleaned_data.get("email")
        if not email:
            return email
        if User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("A user with that email already exists.")
        return email


class CustomUserChangeForm(UserChangeForm):
    """
    Admin form for editing a user.

    ``UserChangeForm`` intentionally hides the ``password`` field because the
    raw password is never stored; setting it is done through the dedicated
    "Set password" form. That is the documented Django behaviour, so this form
    does not try to render a password field. The only thing added here is the
    mobile number, which ``UserChangeForm`` does not know about.
    """

    class Meta:
        model = User
        fields = ("username", "email", "phone_number", "first_name", "last_name")
