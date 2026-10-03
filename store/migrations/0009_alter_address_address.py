"""
Tightens ``Address.address`` back to NOT NULL.

0008 had to add the column as nullable because a NOT NULL column cannot be
added to a table that already has rows. Any row that predates the change is
filled with an empty string first, so the constraint can be applied safely.
"""

from django.db import migrations, models


def fill_blank_addresses(apps, schema_editor):
    Address = apps.get_model("store", "Address")
    Address.objects.filter(address__isnull=True).update(address="")


class Migration(migrations.Migration):
    dependencies = [
        ("store", "0008_alter_address_options_alter_customer_options_and_more"),
    ]

    operations = [
        migrations.RunPython(fill_blank_addresses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="address",
            name="address",
            field=models.TextField(),
        ),
    ]
