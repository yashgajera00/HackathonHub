from django.db import models
from django.conf import settings

class Hackathon(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Published', 'Published'),
        ('Registration Open', 'Registration Open'),
        ('Registration Closed', 'Registration Closed'),
        ('Running', 'Running'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    banner = models.ImageField(upload_to='hackathons/banners/', blank=True, null=True)
    logo = models.ImageField(upload_to='hackathons/logos/', blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    registration_start = models.DateTimeField()
    registration_end = models.DateTimeField()
    venue = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    max_team_size = models.IntegerField(default=4)
    min_team_size = models.IntegerField(default=1)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Draft')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_hackathons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

