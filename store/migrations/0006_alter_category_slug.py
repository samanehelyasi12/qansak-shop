"""
Tightens ``Category.slug`` back to NOT NULL now that 0005 filled it in.
"""

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0005_populate_category_slug"),
    ]

    operations = [
        migrations.AlterField(
            model_name="category",
            name="slug",
            field=models.SlugField(max_length=255, unique=True),
        ),
    ]
