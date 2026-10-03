"""
Server-side pricing rule for products with options.

The storefront may only send *which* choices the customer made. The amounts
themselves always come from the database:

    final_price = product.price + sum(selected value price_deltas)

Nothing in this module accepts a price, an amount or a delta from the client,
which is what makes the order total in Stage 5 trustworthy.
"""

from decimal import Decimal

from .models import Product, ProductOptionValue


class InvalidSelection(ValueError):
    """Raised when a submitted selection does not belong to the product."""

    def __init__(self, slug: str, message: str):
        self.slug = slug
        super().__init__(message)


def resolve_values(product: Product, selections: dict) -> list:
    """
    Turn ``{option_slug: value_slug}`` into the matching value objects.

    Raises :class:`InvalidSelection` when an option does not exist on this
    product, when a required option has no selection, or when the chosen value
    belongs to a different option. Refusing unknown values is what stops a
    client from inventing its own price adjustment.
    """
    options = {option.slug: option for option in product.options.all()}

    unknown = set(selections) - set(options)
    if unknown:
        raise InvalidSelection(
            sorted(unknown)[0],
            f"'{sorted(unknown)[0]}' is not an option of this product.",
        )

    missing = set(options) - set(selections)
    if missing:
        raise InvalidSelection(
            sorted(missing)[0],
            f"'{sorted(missing)[0]}' is required for this product.",
        )

    values = []
    for option_slug, value_slug in selections.items():
        option = options[option_slug]
        # Read the option's values off the prefetch cache rather than issuing a
        # fresh query per option. `(option, slug)` is unique in the database, so
        # picking out of the loaded list is the same row the query would return.
        value = next((v for v in option.values.all() if v.slug == value_slug), None)
        if value is None:
            raise InvalidSelection(
                value_slug, f"'{value_slug}' is not a valid choice for '{option_slug}'."
            )
        values.append(value)

    return values


def unit_price_from_values(product: Product, values) -> Decimal:
    """
    The unit price for choices that have already been resolved.

    The deltas still come from the database -- they are the stored
    ``price_delta`` on the resolved values -- so this is only a shortcut past the
    lookup, never past the pricing rule.
    """
    deltas = [value.price_delta for value in values]
    return product.price + sum(deltas, Decimal("0"))


def calculate_unit_price(product: Product, selections: dict) -> Decimal:
    """Return the price of one unit of ``product`` with ``selections`` applied."""
    return unit_price_from_values(product, resolve_values(product, selections))


def calculate_line_total(product: Product, selections: dict, quantity: int) -> Decimal:
    """Return the price of ``quantity`` units with ``selections`` applied."""
    if quantity < 1:
        raise ValueError("quantity must be at least 1")
    return calculate_unit_price(product, selections) * quantity
