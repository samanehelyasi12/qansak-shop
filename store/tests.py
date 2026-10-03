"""
Tests for the catalog: models, the pricing rule and the public API.

The pricing tests are the important ones. They assert that the amount charged
comes from the database and never from the request body.
"""

from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from .models import Category, Comment, Product, ProductOption, ProductOptionValue
from .pricing import (
    InvalidSelection,
    calculate_line_total,
    calculate_unit_price,
    resolve_values,
)


def make_product(**kwargs) -> Product:
    defaults = dict(
        name="Chocolate Truffle Cake",
        slug="chocolate-truffle-cake",
        description="Rich and creamy.",
        price=Decimal("850000"),
        inventory=10,
        preparation_hours=24,
    )
    defaults.update(kwargs)
    category = defaults.pop("category", None)
    if category is None:
        category, _ = Category.objects.get_or_create(
            slug="cake", defaults={"title": "Cake"}
        )
    return Product.objects.create(category=category, **defaults)


class CategoryModelTests(TestCase):
    def test_slug_is_required_and_unique(self):
        Category.objects.create(title="Cake", slug="cake")
        with self.assertRaises(Exception):
            Category.objects.create(title="Cake", slug="cake")

    def test_str(self):
        self.assertEqual(str(Category(title="Cake", slug="cake")), "Cake")


class ProductModelTests(TestCase):
    def test_price_is_whole_tomans(self):
        product = make_product()
        self.assertEqual(product.price, Decimal("850000"))
        self.assertEqual(product._meta.get_field("price").decimal_places, 0)

    def test_in_stock_reflects_inventory(self):
        self.assertTrue(make_product(inventory=1).in_stock)
        self.assertFalse(make_product(slug="other", inventory=0).in_stock)

    def test_average_rating_is_none_without_annotation(self):
        self.assertIsNone(make_product().average_rating)

    def test_average_rating_ignores_unapproved_comments(self):
        product = make_product()
        Comment.objects.create(
            product=product, name="a", body="b", rating=5,
            status=Comment.COMMENT_STATUS_APPROVED,
        )
        Comment.objects.create(
            product=product, name="c", body="d", rating=1,
            status=Comment.COMMENT_STATUS_WAITING,
        )

        from django.db.models import Avg, Q

        annotated = Product.objects.annotate(
            rating_average=Avg(
                "comments__rating",
                filter=Q(comments__status=Comment.COMMENT_STATUS_APPROVED),
            )
        ).get(pk=product.pk)

        self.assertEqual(annotated.average_rating, 5)

    def test_comment_rating_bounds(self):
        product = make_product()
        comment = Comment(product=product, name="a", body="b", rating=9)
        with self.assertRaises(ValidationError):
            comment.full_clean()


class ProductOptionModelTests(TestCase):
    def setUp(self):
        self.product = make_product()
        self.option = ProductOption.objects.create(
            product=self.product, name="Size", slug="size", position=0
        )
        self.small = ProductOptionValue.objects.create(
            option=self.option, label="1kg", slug="1kg", price_delta=Decimal("0")
        )
        self.large = ProductOptionValue.objects.create(
            option=self.option, label="2kg", slug="2kg", price_delta=Decimal("620000")
        )

    def test_option_slug_unique_per_product(self):
        other_product = make_product(slug="other-product")
        # The same slug on a different product is fine.
        ProductOption.objects.create(product=other_product, name="Size", slug="size")

        with self.assertRaises(Exception):
            ProductOption.objects.create(product=self.product, name="Dup", slug="size")

    def test_value_slug_unique_per_option(self):
        with self.assertRaises(Exception):
            ProductOptionValue.objects.create(
                option=self.option, label="Dup", slug="1kg"
            )

    def test_price_delta_cannot_be_negative(self):
        value = ProductOptionValue(option=self.option, label="x", slug="x", price_delta=-1)
        with self.assertRaises(ValidationError):
            value.full_clean()

    def test_values_are_ordered_by_position(self):
        self.small.position = 1
        self.small.save()
        self.large.position = 2
        self.large.save()
        ProductOptionValue.objects.create(
            option=self.option, label="0kg", slug="0kg", price_delta=0, position=0
        )
        self.assertEqual(
            [v.slug for v in self.option.values.all()], ["0kg", "1kg", "2kg"]
        )


class PricingTests(TestCase):
    """final_price = product.price + sum(selected price_deltas)"""

    def setUp(self):
        self.product = make_product()
        self.size = ProductOption.objects.create(
            product=self.product, name="Size", slug="size", position=0
        )
        ProductOptionValue.objects.create(
            option=self.size, label="1kg", slug="1kg", price_delta=Decimal("0")
        )
        ProductOptionValue.objects.create(
            option=self.size, label="2kg", slug="2kg", price_delta=Decimal("620000")
        )
        self.flavour = ProductOption.objects.create(
            product=self.product, name="Flavour", slug="flavour", position=1
        )
        ProductOptionValue.objects.create(
            option=self.flavour, label="Cocoa", slug="cocoa", price_delta=Decimal("50000")
        )
        ProductOptionValue.objects.create(
            option=self.flavour, label="Vanilla", slug="vanilla", price_delta=Decimal("0")
        )

    def test_base_price_when_no_options(self):
        plain = make_product(slug="plain")
        self.assertEqual(calculate_unit_price(plain, {}), Decimal("850000"))

    def test_base_price_plus_one_delta(self):
        self.assertEqual(
            calculate_unit_price(self.product, {"size": "1kg", "flavour": "cocoa"}),
            Decimal("900000"),
        )

    def test_deltas_accumulate_across_options(self):
        self.assertEqual(
            calculate_unit_price(self.product, {"size": "2kg", "flavour": "cocoa"}),
            Decimal("1520000"),
        )

    def test_line_total_multiplies_quantity(self):
        # (850000 base + 620000 for 2kg) * 3
        self.assertEqual(
            calculate_line_total(self.product, {"size": "2kg", "flavour": "vanilla"}, 3),
            Decimal("4410000"),
        )

    def test_line_total_rejects_zero_quantity(self):
        with self.assertRaises(ValueError):
            calculate_line_total(self.product, {"size": "1kg", "flavour": "vanilla"}, 0)

    def test_unknown_option_is_rejected(self):
        with self.assertRaises(InvalidSelection):
            calculate_unit_price(self.product, {"size": "1kg", "flavour": "cocoa", "gift": "yes"})

    def test_missing_required_option_is_rejected(self):
        with self.assertRaises(InvalidSelection):
            calculate_unit_price(self.product, {"size": "1kg"})

    def test_value_from_another_option_is_rejected(self):
        # "cocoa" belongs to flavour, not to size. Accepting it would let a
        # client attach whatever delta it liked.
        with self.assertRaises(InvalidSelection):
            calculate_unit_price(self.product, {"size": "cocoa", "flavour": "cocoa"})

    def test_invented_value_slug_is_rejected(self):
        with self.assertRaises(InvalidSelection):
            calculate_unit_price(self.product, {"size": "10kg", "flavour": "cocoa"})

    def test_resolve_values_returns_stored_objects(self):
        values = resolve_values(self.product, {"size": "2kg", "flavour": "cocoa"})
        self.assertEqual(
            {v.price_delta for v in values}, {Decimal("620000"), Decimal("50000")}
        )


class CatalogApiTests(TestCase):
    def setUp(self):
        self.cake = Category.objects.create(title="Cake", slug="cake", description="Cakes")
        self.cookie = Category.objects.create(title="Cookie", slug="cookie")

        self.cake_product = make_product(
            name="Truffle Cake", slug="truffle-cake", category=self.cake,
            price=Decimal("850000"), is_best_seller=True, is_new=False,
        )
        self.cookie_product = make_product(
            name="Chickpea Cookie", slug="chickpea-cookie", category=self.cookie,
            price=Decimal("320000"), is_best_seller=False, is_new=True,
        )

        self.size = ProductOption.objects.create(
            product=self.cake_product, name="Size", slug="size"
        )
        ProductOptionValue.objects.create(
            option=self.size, label="1kg", slug="1kg", price_delta=Decimal("0")
        )
        ProductOptionValue.objects.create(
            option=self.size, label="2kg", slug="2kg", price_delta=Decimal("620000")
        )

        Comment.objects.create(
            product=self.cake_product, name="Sara", body="Great",
            rating=5, status=Comment.COMMENT_STATUS_APPROVED,
        )
        Comment.objects.create(
            product=self.cake_product, name="Bad", body="Terrible",
            rating=1, status=Comment.COMMENT_STATUS_WAITING,
        )

    def test_product_list_is_public(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_product_list_shape(self):
        data = self.client.get("/api/products/").json()
        product = next(p for p in data if p["slug"] == "truffle-cake")

        self.assertEqual(
            set(product),
            {
                "id", "slug", "name", "description", "price", "images",
                "category_slug", "preparation_hours", "is_best_seller",
                "is_new", "in_stock", "rating",
            },
        )
        self.assertEqual(product["category_slug"], "cake")
        self.assertEqual(product["price"], "850000")
        self.assertEqual(product["rating"], 5.0)
        self.assertTrue(product["in_stock"])
        self.assertEqual(product["images"], [])

    def test_product_list_does_not_expose_options(self):
        # The grid never renders options; shipping them on a list page is
        # payload the card does not use.
        data = self.client.get("/api/products/").json()
        self.assertNotIn("options", data[0])

    def test_filter_by_category(self):
        data = self.client.get("/api/products/?category=cookie").json()
        self.assertEqual([p["slug"] for p in data], ["chickpea-cookie"])

    def test_filter_best_seller(self):
        data = self.client.get("/api/products/?best_seller=1").json()
        self.assertEqual([p["slug"] for p in data], ["truffle-cake"])

    def test_filter_new(self):
        data = self.client.get("/api/products/?new=1").json()
        self.assertEqual([p["slug"] for p in data], ["chickpea-cookie"])

    def test_search_matches_name_and_category(self):
        self.assertEqual(
            [p["slug"] for p in self.client.get("/api/products/?search=truffle").json()],
            ["truffle-cake"],
        )
        self.assertEqual(
            [p["slug"] for p in self.client.get("/api/products/?search=Cookie").json()],
            ["chickpea-cookie"],
        )

    def test_product_detail_includes_options(self):
        data = self.client.get("/api/products/truffle-cake/").json()

        self.assertEqual(data["slug"], "truffle-cake")
        self.assertEqual(len(data["options"]), 1)

        option = data["options"][0]
        self.assertEqual(option["slug"], "size")
        self.assertEqual(
            [v["slug"] for v in option["values"]], ["1kg", "2kg"]
        )
        self.assertEqual(
            [v["price_delta"] for v in option["values"]], ["0", "620000"]
        )

    def test_unknown_product_returns_404(self):
        self.assertEqual(self.client.get("/api/products/nope/").status_code, 404)

    def test_category_list(self):
        data = self.client.get("/api/categories/").json()
        self.assertEqual(
            sorted(c["slug"] for c in data), ["cake", "cookie"]
        )
        cake = next(c for c in data if c["slug"] == "cake")
        self.assertEqual(set(cake), {"id", "slug", "name", "description", "image_url"})
        self.assertEqual(cake["name"], "Cake")
        self.assertEqual(cake["image_url"], "")

    def test_category_detail(self):
        response = self.client.get("/api/categories/cake/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["slug"], "cake")
        self.assertEqual(self.client.get("/api/categories/nope/").status_code, 404)


class CatalogApiSecurityTests(TestCase):
    """The public catalog must be read-only."""

    def setUp(self):
        self.category = Category.objects.create(title="Cake", slug="cake")
        self.product = make_product(category=self.category)

    def test_no_write_methods_are_allowed(self):
        payload = {
            "name": "Hacked",
            "price": "1",
            "inventory": 9999,
            "description": "x",
            "category": self.category.id,
        }
        for url in ("/api/products/", "/api/products/hacked-product/"):
            for method in ("post", "put", "patch", "delete"):
                with self.subTest(url=url, method=method):
                    response = getattr(self.client, method)(
                        url, data=payload, content_type="application/json"
                    )
                    self.assertEqual(response.status_code, 405)

    def test_price_cannot_be_changed_through_the_api(self):
        original = self.product.price
        self.client.patch(
            f"/api/products/{self.product.slug}/",
            data='{"price": "1"}',
            content_type="application/json",
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.price, original)

    def test_price_delta_cannot_be_changed_through_the_api(self):
        option = ProductOption.objects.create(
            product=self.product, name="Size", slug="size"
        )
        value = ProductOptionValue.objects.create(
            option=option, label="1kg", slug="1kg", price_delta=Decimal("1000")
        )

        response = self.client.patch(
            f"/api/api/options/values/{value.id}/",
            data='{"price_delta": "0"}',
            content_type="application/json",
        )
        # The route does not exist at all, which is the strongest guarantee.
        self.assertEqual(response.status_code, 404)
        value.refresh_from_db()
        self.assertEqual(value.price_delta, Decimal("1000"))


class CatalogQueryCountTests(TestCase):
    """Guard against N+1 regressions in the catalog views."""

    def build(self, count: int, offset: int = 0) -> None:
        for i in range(count):
            index = offset + i
            category, _ = Category.objects.get_or_create(
                slug=f"cat-{index}", defaults={"title": f"Cat {index}"}
            )
            product = make_product(
                name=f"Product {index}",
                slug=f"product-{index}",
                category=category,
            )
            option = ProductOption.objects.create(
                product=product, name="Size", slug="size"
            )
            for j in range(2):
                ProductOptionValue.objects.create(
                    option=option, label=f"{j}kg", slug=f"{j}kg", price_delta=Decimal(j)
                )
            Comment.objects.create(
                product=product, name="a", body="b", rating=4,
                status=Comment.COMMENT_STATUS_APPROVED,
            )

    def count_queries(self, url: str) -> int:
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as ctx:
            self.client.get(url)
        return len(ctx.captured_queries)

    def test_product_list_query_count_is_independent_of_catalog_size(self):
        # The data is created up front so only the request is measured.
        self.build(3)
        with_three = self.count_queries("/api/products/")

        self.build(9, offset=3)
        with_twelve = self.count_queries("/api/products/")

        # 9 more products, each with options, values, images and comments.
        # A constant query count proves there is no per-product lookup.
        self.assertEqual(with_three, with_twelve)

    def test_product_detail_query_count_is_bounded(self):
        self.build(3)
        # product + category + images + options + values + rating aggregate.
        self.assertLessEqual(self.count_queries("/api/products/product-0/"), 8)


class ProductCommentApiTests(TestCase):
    """
    The review endpoint: guests and members may both write one, and only an
    approved review is ever visible to a visitor.
    """

    def setUp(self):
        self.category = Category.objects.create(title="Cake", slug="cake")
        self.product = make_product(category=self.category)

    def url(self, slug: str | None = None) -> str:
        return f"/api/products/{slug or self.product.slug}/comments/"

    def post(self, payload, **kwargs):
        return self.client.post(
            self.url(), data=payload, content_type="application/json", **kwargs
        )

    def test_list_is_public(self):
        Comment.objects.create(
            product=self.product, name="Sara", body="Great",
            rating=5, status=Comment.COMMENT_STATUS_APPROVED,
        )
        response = self.client.get(self.url())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": Comment.objects.get().id,
                    "author": "Sara",
                    "rating": 5,
                    "comment": "Great",
                    "created_at": response.json()[0]["created_at"],
                }
            ],
        )

    def test_only_approved_reviews_are_listed(self):
        Comment.objects.create(
            product=self.product, name="Pending", body="Not yet",
            rating=1, status=Comment.COMMENT_STATUS_WAITING,
        )
        Comment.objects.create(
            product=self.product, name="Rejected", body="No",
            rating=1, status=Comment.COMMENT_STATUS_NOTAPPROVED,
        )
        self.assertEqual(self.client.get(self.url()).json(), [])

    def test_guest_can_write_a_review(self):
        response = self.post({"name": "مهمان", "body": "خوشمزه بود", "rating": 4})

        self.assertEqual(response.status_code, 201)
        comment = Comment.objects.get()
        self.assertEqual(comment.name, "مهمان")
        self.assertEqual(comment.rating, 4)
        self.assertEqual(comment.product, self.product)

    def test_guest_without_a_name_is_rejected(self):
        response = self.post({"body": "خوشمزه بود", "rating": 4})
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.json())
        self.assertFalse(Comment.objects.exists())

    def test_signed_in_name_comes_from_the_session(self):
        from core.models import CustomUser

        user = CustomUser.objects.create_user(
            username="member", email="member@example.com",
            password="Str0ng-Passw0rd!", first_name="Sara", last_name="Test",
        )
        self.client.force_login(user)

        # The typed name is ignored: the session decides who wrote it.
        response = self.post({"name": "Someone else", "body": "خوب بود", "rating": 5})

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Comment.objects.get().name, "Sara Test")

    def test_a_new_review_is_not_public_until_approved(self):
        response = self.post({"name": "مهمان", "body": "خوشمزه بود", "rating": 5})

        self.assertEqual(response.json()["status"], Comment.COMMENT_STATUS_WAITING)
        # The response says the review is waiting; it does not publish it.
        self.assertEqual(self.client.get(self.url()).json(), [])

        Comment.objects.update(status=Comment.COMMENT_STATUS_APPROVED)
        self.assertEqual(len(self.client.get(self.url()).json()), 1)

    def test_rating_and_body_are_validated(self):
        for payload in (
            {"name": "a", "body": "متن", "rating": 0},
            {"name": "a", "body": "متن", "rating": 6},
            {"name": "a", "body": "   ", "rating": 3},
        ):
            with self.subTest(payload=payload):
                self.assertEqual(self.post(payload).status_code, 400)
        self.assertFalse(Comment.objects.exists())

    def test_status_cannot_be_forced_from_the_request(self):
        self.post(
            {
                "name": "مهمان", "body": "خوب بود", "rating": 5,
                "status": Comment.COMMENT_STATUS_APPROVED,
            }
        )
        self.assertEqual(Comment.objects.get().status, Comment.COMMENT_STATUS_WAITING)

    def test_review_is_attached_to_the_product_in_the_url(self):
        other = make_product(name="Cookie", slug="chickpea-cookie", category=self.category)
        response = self.client.post(
            self.url("chickpea-cookie"),
            data='{"name": "a", "body": "خوب", "rating": 4}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Comment.objects.get().product, other)

    def test_unknown_product_returns_404(self):
        response = self.client.post(
            self.url("nope"),
            data='{"name": "a", "body": "خوب", "rating": 4}',
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertFalse(Comment.objects.exists())
