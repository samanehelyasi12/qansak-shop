"""
Restores the NOT NULL constraints on the order snapshots.

0010 had to add these columns as nullable because Django cannot add a NOT NULL
column to a table that already has rows. The order table is empty, so this
migration only has to assert that; if it is ever run against a non-empty table
the guard below stops it rather than silently inventing order data.

Note that dropping the ``(order, product)`` uniqueness on OrderItem is a
separate, deliberate change: the storefront allows one product to appear more
than once in an order when the customer picked different options.
"""

from django.db import migrations, models


def assert_no_legacy_orders(apps, schema_editor):
    Order = apps.get_model("store", "Order")
    if Order.objects.exists():
        raise RuntimeError(
            "Refusing to tighten the order snapshots: pre-existing orders would "
            "lose their data. Back them up or remove them first."
        )


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0010_alter_order_options_alter_orderitem_options_and_more"),
    ]

    operations = [
        migrations.RunPython(assert_no_legacy_orders, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="order", name="order_code",
            field=models.CharField(editable=False, max_length=20, unique=True),
        ),
        migrations.AlterField(
            model_name="order", name="tracking_code",
            field=models.CharField(editable=False, max_length=20, unique=True),
        ),
        migrations.AlterField(
            model_name="order", name="first_name", field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="order", name="last_name", field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="order", name="email", field=models.EmailField(max_length=254),
        ),
        migrations.AlterField(
            model_name="order", name="phone_number", field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="order", name="address", field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="orderitem", name="product_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name="orderitem", name="product_slug", field=models.SlugField(),
        ),
        migrations.AlterField(
            model_name="orderitem", name="price",
            field=models.DecimalField(decimal_places=0, max_digits=12),
        ),
        migrations.AlterField(
            model_name="orderitem", name="total",
            field=models.DecimalField(decimal_places=0, max_digits=12),
        ),
    ]
