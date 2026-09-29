from django.db import models



class Category(models.Model):
    """Represents a product category."""
     
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=500 , blank=True)
    top_product = models.ForeignKey("Product",on_delete=models.SET_NULL ,null=True,related_name='+')
    
class Discount(models.Model):
    """Represents a discount assigned to a customer."""
    
    DISCOUNT_FIRST_PURCHASE = "first"
    DISCOUNT_REFERRAL = "referral"

    DISCOUNT_TYPES = [
        (DISCOUNT_FIRST_PURCHASE, "First Purchase"),
        (DISCOUNT_REFERRAL, "Referral"),
    ]

    customer = models.ForeignKey("Customer",on_delete=models.CASCADE,related_name="discounts")
    discount_type = models.CharField(max_length=20,choices=DISCOUNT_TYPES)
    percent = models.PositiveSmallIntegerField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Product(models.Model):
    """Represents a product in the store.""" 
    
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category , on_delete=models.PROTECT , related_name='products')
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=12,decimal_places=0)
    inventory = models.PositiveIntegerField()
    datetime_created = models.DateTimeField(auto_now_add=True)
    datetime_modified = models.DateTimeField(auto_now=True)
    
    
class ProductImage(models.Model):
    product = models.ForeignKey( "Product",on_delete=models.CASCADE,related_name="images")
    image = models.ImageField(upload_to="products/")

class Customer(models.Model):
    """Represents a customer of the store."""
     
    discount_offer = models.OneToOneField("Discount",on_delete=models.PROTECT,null=True,blank=True,related_name="order")
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=255)
    referral_code = models.CharField(max_length=20, unique=True)
    referred_by = models.ForeignKey("self",on_delete=models.SET_NULL,null=True,blank=True,related_name="referrals")
    
class Address(models.Model):
    """Stores the customer's address."""
    
    customer = models.OneToOneField(Customer , on_delete=models.CASCADE , primary_key=True)
    province = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    street = models.CharField(max_length=255)
    
    
class Order(models.Model):
    """Represents a customer's order."""
      
    ORDER_STATUS_PAID='p'
    ORDER_STATUS_UNPAID ='u'
    ORDER_STATUS_CANCELED ='c'
    ORDER_STATUS =[
        (ORDER_STATUS_PAID,'Paid'),
        (ORDER_STATUS_UNPAID,'Unpaid'),
        (ORDER_STATUS_CANCELED,'Canceled'),
    ]
    customer = models.ForeignKey(Customer , on_delete=models.PROTECT)
    discount_offer = models.ForeignKey("Discount",on_delete=models.PROTECT,null=True,blank=True,related_name="orders")
    province = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    street = models.CharField(max_length=255)
    datetime_created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=1,choices=ORDER_STATUS,default=ORDER_STATUS_UNPAID)
    subtotal = models.DecimalField(max_digits=12,decimal_places=0)
    discount = models.DecimalField(max_digits=12,decimal_places=0)
    total = models.DecimalField(max_digits=12,decimal_places=0)  
    
class OrderItem(models.Model):
    """Represents a product within an order."""
    
    order = models.ForeignKey(Order , on_delete=models.PROTECT )   
    product = models.ForeignKey(Product , on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12,decimal_places=0)
    
    class Meta:
        unique_together =[['order','product']]
        
        
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
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    body = models.TextField()
    datetime_created = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=2, choices=COMMENT_STATUS,default=COMMENT_STATUS_WAITING)

class Cart(models.Model):
    """Represents a customer's shopping cart."""
     
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
    """Represents a payment attempt for an order."""
    
    PAYMENT_STATUS_PENDING = "p"
    PAYMENT_STATUS_SUCCESS = "s"
    PAYMENT_STATUS_FAILED = "f"

    PAYMENT_STATUS = [
    (PAYMENT_STATUS_PENDING, "Pending"),
    (PAYMENT_STATUS_SUCCESS, "Success"),
    (PAYMENT_STATUS_FAILED, "Failed"),]
    
    order = models.ForeignKey(Order,on_delete=models.PROTECT,related_name="payments")
    amount = models.DecimalField(max_digits=12,decimal_places=0)
    status = models.CharField(max_length=1 , choices=PAYMENT_STATUS , default=PAYMENT_STATUS_PENDING)
    transaction_id = models.CharField(max_length=255,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)