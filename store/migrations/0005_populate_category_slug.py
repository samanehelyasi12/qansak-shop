"""
Populates ``Category.slug`` from the existing titles.

The field had to be added as nullable first because a non-null column cannot be
added to a table that already has rows. This migration fills it in, and the
next one tightens it back to NOT NULL.
"""

from django.db import migrations
from django.utils.text import slugify


def populate_category_slugs(apps, schema_editor):
    Category = apps.get_model("store", "Category")

    for category in Category.objects.filter(slug__isnull=True).iterator():
        base = slugify(category.title)[:240] or "category"
        candidate = base
        suffix = 1
        while Category.objects.filter(slug=candidate).exclude(pk=category.pk).exists():
            suffix += 1
            candidate = f"{base}-{suffix}"
        category.slug = candidate
        category.save(update_fields=["slug"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0004_productoption_productoptionvalue_and_more"),
    ]

    operations = [
        migrations.RunPython(populate_category_slugs, noop),
    ]
