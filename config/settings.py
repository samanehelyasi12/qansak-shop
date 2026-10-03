"""
Django settings for the Qandak Bakery backend.

This project is an API-only backend for the Next.js frontend, so there are no
frontend pages here. All configuration values that are environment specific are
read from the environment; the defaults below are development-only values.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool = False) -> bool:
    """Read a boolean flag from the environment."""
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


# SECURITY WARNING: set a real SECRET_KEY in the environment for production.
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-key-do-not-use-in-production",
)

DEBUG = env_bool("DJANGO_DEBUG", default=True)

# Security-sensitive toggles are driven by DJANGO_DEBUG so that development on
# plain http://localhost keeps working while production defaults to the secure
# values. In production DJANGO_DEBUG must be False and DJANGO_SECURE must be
# "on" (or the individual DJANGO_*_SECURE flags must be set explicitly).
SECURE = not DEBUG or env_bool("DJANGO_SECURE")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# Origins allowed to call the API. The Next.js frontend runs on its own port,
# so without this every cross-origin request would be rejected.
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "DJANGO_CORS_ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Where the payment gateway sends the browser back to. The gateway itself always
# calls this backend to verify, and only then is the customer redirected here to
# see the recorded outcome. It is configuration, never a value in a request, so
# a browser cannot talk the backend into redirecting somewhere else.
FRONTEND_BASE_URL = os.environ.get(
    "DJANGO_FRONTEND_BASE_URL", "http://localhost:3000"
).rstrip("/")


# Sessions and CSRF
# https://docs.djangoproject.com/en/6.1/topics/http/sessions/
# https://docs.djangoproject.com/en/6.1/ref/csrf/

# Authentication is session based. The session id is stored in the cookie and
# the CSRF token is required on every state-changing request, which is what
# rest_framework.authentication.SessionAuthentication enforces.
SESSION_ENGINE = "django.contrib.sessions.backends.db"

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = SECURE
SESSION_COOKIE_SAMESITE = os.environ.get("DJANGO_SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_AGE = int(os.environ.get("DJANGO_SESSION_COOKIE_AGE", 60 * 60 * 24 * 14))

CSRF_COOKIE_HTTPONLY = False  # the frontend must read the token from the cookie
CSRF_COOKIE_SECURE = SECURE
CSRF_COOKIE_SAMESITE = os.environ.get("DJANGO_CSRF_COOKIE_SAMESITE", "Lax")
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

# Transport security. Only meaningful when DEBUG is False.
SECURE_SSL_REDIRECT = SECURE
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", 31536000))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE
SECURE_HSTS_PRELOAD = SECURE
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    # Local
    'store',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = 'fa'

TIME_ZONE = 'Asia/Tehran'

USE_I18N = True

USE_TZ = True


# Model defaults

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = 'static/'

# Product and category images. Without MEDIA_URL/MEDIA_ROOT the ImageField's
# .url cannot be produced, so the API could not return a single image URL.
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# Email
# https://docs.djangoproject.com/en/6.1/topics/email/#topic-email-configuration

EMAIL_BACKEND = os.environ.get(
    "DJANGO_EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)


# Payment gateway
# https://www.zarinpal.com/docs/
#
# The merchant id is a credential: it lives in the environment and is never
# written into code, a response or a log. The sandbox base url is used unless
# DJANGO_DEBUG is off, so a development machine cannot take real money.

ZARINPAL_MERCHANT_ID = os.environ.get("ZARINPAL_MERCHANT_ID", "")
ZARINPAL_API_BASE_URL = os.environ.get(
    "ZARINPAL_API_BASE_URL",
    "https://payment.zarinpal.com" if not DEBUG else "https://sandbox.zarinpal.com",
)
# The absolute origin the gateway sends the customer back to, e.g.
# https://api.qandak.example. No trailing slash.
PAYMENT_CALLBACK_BASE_URL = os.environ.get("PAYMENT_CALLBACK_BASE_URL", "").rstrip("/")
# No outbound gateway call may hang a request thread indefinitely.
PAYMENT_GATEWAY_TIMEOUT = int(os.environ.get("PAYMENT_GATEWAY_TIMEOUT", "15"))


# Django REST Framework
# https://www.django-rest-framework.org/api-guide/settings/

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    # Individual views opt in to AllowAny. Nothing is public by accident.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # Brute-force protection. Scopes are applied per view via
    # ``throttle_scope``; see DEFAULT_THROTTLE_RATES below.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'login': os.environ.get("DJANGO_THROTTLE_LOGIN", "10/min"),
        'register': os.environ.get("DJANGO_THROTTLE_REGISTER", "5/hour"),
        # Guest checkout is public, so it needs a limit of its own.
        'guest_order': os.environ.get("DJANGO_THROTTLE_GUEST_ORDER", "5/hour"),
        'payment': os.environ.get("DJANGO_THROTTLE_PAYMENT", "10/min"),
        'payment_callback': os.environ.get("DJANGO_THROTTLE_PAYMENT_CALLBACK", "30/min"),
        'payment_result': os.environ.get("DJANGO_THROTTLE_PAYMENT_RESULT", "30/min"),
        # Reviews are open to guests, so the write path is rate limited.
        'comment': os.environ.get("DJANGO_THROTTLE_COMMENT", "5/hour"),
    },
}

AUTHENTICATION_BACKENDS = [
    "core.backends.IdentifierAuthBackend",
]

AUTH_USER_MODEL = "core.CustomUser"
