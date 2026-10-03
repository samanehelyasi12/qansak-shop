import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from store.models import Product, ProductImage, Category

print("total products:", Product.objects.count())
print("--- newest 8 ---")
for p in Product.objects.order_by("-id")[:8]:
    print(
        p.id,
        "|",
        p.slug,
        "|",
        p.name,
        "| price:",
        p.price,
        "| inv:",
        p.inventory,
        "| cat:",
        p.category.slug,
        "| imgs:",
        ProductImage.objects.filter(product=p).count(),
    )
print("--- all slugs ---")
print(list(Product.objects.values_list("slug", flat=True)))
print("--- categories ---")
print(list(Category.objects.values_list("slug", "title")))