import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ.setdefault("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
django.setup()

from rest_framework.test import APIClient

c = APIClient()

r = c.get("/api/products/")
print("list:", r.status_code, len(r.json()))
print("slugs:", [p["slug"] for p in r.json()])

r = c.get("/api/products/?category=jar-cake")
print("jar-cake:", r.status_code, r.json())

r = c.get("/api/products/gr/")
print("detail gr:", r.status_code, r.json())

r = c.get("/api/categories/")
print("categories:", r.status_code, [x["slug"] for x in r.json()])