from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomerUserCreationForms,CustomUserChangeForm


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    add_form = CustomerUserCreationForms
    form = CustomUserChangeForm
    list_display = ('email','username')
    
    