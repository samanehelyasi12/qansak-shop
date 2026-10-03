from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q
from uuid import uuid4



class Category(models.Model):
    """A product category, e.g. cake, cookie, bread."""

    title = models.CharField(max_length=255)
    # The storefront routes on slugs (/categories/<slug>), so a category needs
    # one the same way a product does.
    slug = models.SlugField(max_length=255, unique=True)
    description = models.CharField(max_length=500, blank=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    # Merchandising helper used by the admin only: lets a manager pin one
    # product as the face of the category. Not exposed by the public API.
    top_product = models.ForeignKey(
        "Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="featured_in_categories",
    )

    class Meta:
        verbose_name_plural = "categories"
        ordering = ("title",)

    def __str__(self) -> str:
        return self.title


class Discount(models.Model):
    """
    A discount issued to one customer, usable on one order.

    Qandak's discounts belong to a customer. There is no coupon campaign system
    and no public code table: a discount is issued, the customer uses it once,
    and the order keeps the amount that was actually taken off.

    ``used_order`` is a OneToOneField, which gives two guarantees at the
    database level rather than in application code: a discount can be attached
    to at most one order, so it cannot be spent twice, and an order can carry
    at most one discount, so discounts never stack.

    ``is_used`` is not stored. It duplicated what ``used_at`` already said, and
    two sources of truth for usage state is how a discount ends up marked used
    twice. It survives only as a read-only property.
    """

    DISCOUNT_FIRST_PURCHASE = "first"
    DISCOUNT_REFERRAL = "referral"

    DISCOUNT_TYPES = [
        (DISCOUNT_FIRST_PURCHASE, "First purchase"),
        (DISCOUNT_REFERRAL, "Referral"),
    ]

    customer = models.ForeignKey(
        "Customer", on_delete=models.CASCADE, related_name="discounts"
    )
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    percent = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    # --- Usage state. Both are set together when the discount is spent. ---
    used_at = models.DateTimeField(null=True, blank=True)
    # OneToOne, so one discount cannot be spent twice and one order cannot
    # carry two discounts.
    used_order = models.OneToOneField(
        "Order",
        on_delete=models.PROTECT,
        related_name="applied_discount",
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("customer", "discount_type"))]

    def __str__(self) -> str:
        return f"{self.get_discount_type_display()} {self.percent}% for {self.customer}"

    @property
    def is_used(self) -> bool:
        """Derived from ``used_at``; never stored, so it cannot disagree."""
        return self.used_at is not None

    @property
    def is_available(self) -> bool:
        return self.used_at is None

class Product(models.Model):
    """A product in the store.

    ``price`` is the base price in whole tomans. The final price a customer
    pays also depends on the options they pick; see ``store.pricing`` for the
    rule and ``ProductOptionValue.price_delta`` for the adjustment.
    """

    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    inventory = models.PositiveIntegerField(default=0)
    preparation_hours = models.PositiveSmallIntegerField(
        default=0, help_text="Hours needed to prepare this product."
    )
    is_best_seller = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    datetime_created = models.DateTimeField(auto_now_add=True)
    datetime_modified = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-datetime_created",)
        indexes = [models.Index(fields=("category", "slug"))]

    def __str__(self) -> str:
        return self.name

    @property
    def in_stock(self) -> bool:
        return self.inventory > 0

    @property
    def average_rating(self):
        """
        Mean score of the approved reviews, or ``None`` when the queryset was
        not annotated.

        The catalog views annotate this as ``rating_average`` so a list page
        costs one extra query in total rather than one per product.
        """
        return getattr(self, "rating_average", None)


class ProductOption(models.Model):
    """
    A choice the customer makes about a product, e.g. size or flavour.

    A product has zero or more options; a product with none is simply sold as
    it is. The storefront addresses options by slug, so the slug is unique
    within a product.
    """

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="options")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(fields=("product", "slug"), name="unique_option_slug_per_product")
        ]

    def __str__(self) -> str:
        return f"{self.product.name} - {self.name}"


class ProductOptionValue(models.Model):
    """
    One possible choice within a :class:`ProductOption`.

    ``price_delta`` is the only pricing input a choice contributes. It is set
    by staff in the admin and is never accepted from the storefront, so the
    backend stays the sole authority on the final price.
    """

    option = models.ForeignKey(ProductOption, on_delete=models.CASCADE, related_name="values")
    label = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    price_delta = models.DecimalField(
        max_digits=12,
        decimal_places=0,
        default=0,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Amount added to the base price, in tomans.",
    )
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(fields=("option", "slug"), name="unique_value_slug_per_option")
        ]

    def __str__(self) -> str:
        return f"{self.option.name}: {self.label}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    # The gallery renders images in this order, so the position is meaningful.
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")

    def __str__(self) -> str:
        return f"{self.product.name} image {self.position}"

class Customer(models.Model):
    """
    A shopper of the store.

    The name, email and phone live here rather than being read through
    ``user`` because a guest checkout has no account at all. Those fields are
    therefore the domain's own copy of who is ordering, not a duplicate of
    ``CustomUser``: they are filled from the account when one is linked, and
    they are the only record that exists for a guest.

    ``referral_code`` is a customer-facing code used by the referral program.
    Stage 6 owns the reward rules; generating a unique code is a requirement
    of this field itself, so it happens here.
    """

    # Nullable so that a guest can check out without an account. The OneToOne
    # keeps it one-to-one: an account has at most one customer profile.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer",
        null=True,
        blank=True,
    )
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=255)
    referral_code = models.CharField(max_length=20, unique=True)
    referred_by = models.ForeignKey("self",on_delete=models.SET_NULL,null=True,blank=True,related_name="referrals")

    class Meta:
        ordering = ("-id",)

    def __str__(self) -> str:
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        super().save(*args, **kwargs)

    def generate_referral_code(self) -> str:
        """A short, unique, human-typeable code built from the customer id."""
        import secrets
        import string

        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = "".join(secrets.choice(alphabet) for _ in range(8))
            if not Customer.objects.filter(referral_code=code).exists():
                return code


class Address(models.Model):
    """
    The single delivery address of a customer.

    Qandak's rule is one address per customer: the customer id *is* the address
    id (``primary_key=True``) and ``related_name="address"``. Changing an
    address is an UPDATE of this row, never a second Address for the same
    customer.
    """

    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="address",
    )
    # The storefront collects a single free-text address, so that is what is
    # stored. Splitting it into province/city/street is not forced on the
    # frontend.
    address = models.TextField()

    class Meta:
        verbose_name_plural = "addresses"

    def __str__(self) -> str:
        return f"Address for {self.customer}"


class Order(models.Model):
    """
    A customer's order.

    Every monetary and descriptive field on this row is a snapshot taken when
    the order is placed. The order must keep showing what was actually bought
    and paid for, so later edits to a product's name, price or options, or to
    the customer's address, never rewrite an order that already exists.
    """

    # Fulfillment states, from the storefront's own order page.
    STATUS_CONFIRMED = "confirmed"
    STATUS_PREPARING = "preparing"
    STATUS_READY = "ready"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELED = "cancelled"

    ORDER_STATUS = [
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_PREPARING, "Preparing"),
        (STATUS_READY, "Ready"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELED, "Cancelled"),
    ]

    DELIVERY_EXPRESS = "express"
    DELIVERY_STANDARD = "standard"
    DELIVERY_PICKUP = "pickup"
    DELIVERY_METHODS = [
        (DELIVERY_EXPRESS, "Express"),
        (DELIVERY_STANDARD, "Standard"),
        (DELIVERY_PICKUP, "Pickup"),
    ]

    # A customer, registered or guest. PROTECT because an order is a financial
    # record and must not disappear with the account.
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name="orders"
    )

    # Human-facing codes. `order_code` is what the customer quotes back to the
    # store; `tracking_code` follows the delivery. Both are generated in save().
    order_code = models.CharField(max_length=20, unique=True, editable=False)
    tracking_code = models.CharField(max_length=20, unique=True, editable=False)

    # --- Snapshot of the buyer at the time of the order ---
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone_number = models.CharField(max_length=255)
    # The single free-text address, copied from the customer's Address.
    address = models.TextField()

    delivery_method = models.CharField(
        max_length=20, choices=DELIVERY_METHODS, default=DELIVERY_STANDARD
    )

    datetime_created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20, choices=ORDER_STATUS, default=STATUS_CONFIRMED
    )

    subtotal = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    # The amount actually taken off, snapshotted here. Changing a Discount's
    # percent later must never rewrite an order that already exists.
    discount = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=0, default=0)

    # Idempotency gate for referral rewards. A qualifying purchase grants
    # rewards exactly once: the grant is a single conditional UPDATE on this
    # column, so a second processing of the same payment event updates zero
    # rows and does nothing. Set by the discount stage, called from payment.
    referral_processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-datetime_created",)

    def __str__(self) -> str:
        return f"{self.order_code} ({self.customer})"

    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = self._generate_code("ORD")
        if not self.tracking_code:
            self.tracking_code = self._generate_code("TRK")
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_code(prefix: str) -> str:
        import secrets
        import string

        alphabet = string.ascii_uppercase + string.digits
        while True:
            code = f"{prefix}-{''.join(secrets.choice(alphabet) for _ in range(5))}"
            if not Order.objects.filter(order_code=code).exists():
                return code


class OrderItem(models.Model):
    """
    One line of an order.

    A product can appear more than once in the same order when the customer
    picked different options (a 1kg and a 2kg cake, say), so there is
    deliberately no uniqueness constraint on (order, product).

    Everything the order history needs is copied here: the product name, slug,
    the unit price, the line total and the chosen options. Editing a product
    later therefore cannot rewrite the price a customer was charged.
    """

    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    # --- Snapshots ---
    product_name = models.CharField(max_length=255)
    product_slug = models.SlugField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    total = models.DecimalField(max_digits=12, decimal_places=0)
    # The option slugs as chosen, e.g. {"size": "2kg", "flavour": "cocoa"}.
    # Stored verbatim so the line can still be explained if the product's
    # options change afterwards.
    selected_options = models.JSONField(default=dict, blank=True)
    # The labels and deltas that applied at the time, kept so the order page
    # can show what was bought without re-reading today's catalog.
    options_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("id",)

    def __str__(self) -> str:
        return f"{self.quantity} x {self.product_name}"
        
class Comment(models.Model):
    """Represents a comment on a product."""
     
    COMMENT_STATUS_WAITING ='w'
    COMMENT_STATUS_APPROVED='a'
    COMMENT_STATUS_NOTAPPROVED='na'
    COMMENT_STATUS=[
        (COMMENT_STATUS_WAITING,'Waiting'),
        (COMMENT_STATUS_APPROVED,'Approved'),
        (COMMENT_STATUS_NOTAPPROVED,'Not Approved'),
        
    ]
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="comments")
    name = models.CharField(max_length=255)
    body = models.TextField()
    # A score belongs to the review, not to the product. Product.rating is
    # derived from the approved reviews rather than stored, so it cannot go
    # stale.
    rating = models.PositiveSmallIntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    datetime_created = models.DateTimeField(auto_now_add=True)
    # max_length=2 because the "na" (not approved) value is two characters.
    status = models.CharField(max_length=2, choices=COMMENT_STATUS, default=COMMENT_STATUS_WAITING)

    class Meta:
        ordering = ("-datetime_created",)
        indexes = [models.Index(fields=("product", "status"))]

    def __str__(self) -> str:
        return f"{self.name} on {self.product.name}"

class Cart(models.Model):
    """Represents a customer's shopping cart."""
    id = models.UUIDField(primary_key=True , default=uuid4)
    customer = models.OneToOneField(Customer ,on_delete=models.CASCADE , related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    
class CartItem(models.Model):
    """Represents a product within a shopping cart."""
    
    cart = models.ForeignKey(Cart , on_delete=models.CASCADE)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    
    class Meta:
        unique_together=[['cart','product']]
        
        
class Payment(models.Model):
    """
    A payment attempt for an order.

    This row is the truth about money only. Whether an order has been paid for
    is answered by ``status`` here and never by ``Order.status``, which is the
    fulfillment state the shop moves an order through.

    ``amount`` is in whole tomans, the same unit as the rest of the store. The
    conversion to the gateway's unit happens in one place, at the gateway
    boundary, and nowhere else.

    ``authority`` is the gateway's identifier for this attempt, returned when
    the payment is started. The callback carries it back, and it is how a
    payment is resolved without trusting anything the callback says about the
    order. It is unique, so one gateway attempt can belong to one row.
    """

    PAYMENT_STATUS_PENDING = "p"
    PAYMENT_STATUS_SUCCESS = "s"
    PAYMENT_STATUS_FAILED = "f"

    PAYMENT_STATUS = [
        (PAYMENT_STATUS_PENDING, "Pending"),
        (PAYMENT_STATUS_SUCCESS, "Success"),
        (PAYMENT_STATUS_FAILED, "Failed"),
    ]

    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=0)
    status = models.CharField(
        max_length=1, choices=PAYMENT_STATUS, default=PAYMENT_STATUS_PENDING
    )
    # The gateway's own reference for a completed payment. Unique, so the same
    # gateway transaction cannot be recorded twice.
    transaction_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    authority = models.CharField(max_length=64, blank=True, null=True, unique=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            # At most one *pending* payment per order. A failed or successful
            # payment does not block a fresh attempt, so a customer whose
            # payment failed can retry, while two live attempts on one order
            # cannot exist. Enforced by the database, not by application code.
            models.UniqueConstraint(
                fields=("order",),
                condition=Q(status="p"),  # PAYMENT_STATUS_PENDING
                name="one_pending_payment_per_order",
            )
        ]

    def __str__(self) -> str:
        return f"{self.order.order_code} - {self.get_status_display()}"