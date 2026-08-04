import uuid
from django.db import models
from django.conf import settings
from hackathons.models import Hackathon

class Registration(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Approved')
    registered_at = models.DateTimeField(auto_now_add=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(blank=True, null=True)
    qr_code_uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        ordering = ['-registered_at', '-id']
        constraints = [
            models.UniqueConstraint(fields=['hackathon', 'user'], name='unique_hackathon_user_registration')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.hackathon.title} ({self.status})"


class FoodCoupon(models.Model):
    MEAL_TYPE_CHOICES = [
        ('Lunch', 'Lunch'),
        ('Dinner', 'Dinner'),
        ('Breakfast', 'Breakfast'),
        ('Snack', 'Snack'),
        ('Special', 'Special VIP'),
    ]

    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='food_coupons')
    name = models.CharField(max_length=150)
    meal_type = models.CharField(max_length=50, choices=MEAL_TYPE_CHOICES, default='Lunch')
    description = models.TextField(blank=True, default='')
    meal_date = models.DateField(blank=True, null=True)
    default_coupons_per_person = models.PositiveIntegerField(default=1)
    target_roles = models.CharField(max_length=100, default='All')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.meal_type}) - {self.hackathon.title}"


class UserFoodToken(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='user_food_tokens')
    food_coupon = models.ForeignKey(FoodCoupon, on_delete=models.CASCADE, related_name='user_tokens')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='food_tokens')
    token_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    total_coupons = models.PositiveIntegerField(default=1)
    used_coupons = models.PositiveIntegerField(default=0)
    is_extra = models.BooleanField(default=False)
    notes = models.CharField(max_length=255, blank=True, default='')
    issued_at = models.DateTimeField(auto_now_add=True)
    last_scanned_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['food_coupon', 'user'], name='unique_user_food_coupon')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.food_coupon.name} ({self.used_coupons}/{self.total_coupons})"


class FoodRedemptionLog(models.Model):
    token = models.ForeignKey(UserFoodToken, on_delete=models.CASCADE, related_name='redemption_logs')
    scanned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='scanned_food_redemptions')
    redeemed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Success')

    def __str__(self):
        return f"{self.token.user.username} redeemed {self.token.food_coupon.name} at {self.redeemed_at}"


