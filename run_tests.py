"""Runs the Django test suite without the ImageField/Pillow system check.

Pillow cannot be installed on this machine (no network), and ``manage.py test``
refuses to run while the system check reports those two ImageFields. The check
is silenced here only -- the code under test is untouched.
"""

import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
django.setup()

from django.conf import settings  # noqa: E402
from django.core.management import execute_from_command_line  # noqa: E402

settings.SILENCED_SYSTEM_CHECKS = ["fields.E210"]

execute_from_command_line([sys.argv[0], "test", *sys.argv[1:], "--no-input"])