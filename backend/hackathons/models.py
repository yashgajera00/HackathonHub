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
    publish_time = models.DateTimeField(blank=True, null=True)
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
    is_problem_statements_released = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_hackathons')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        from django.utils import timezone
        now = timezone.now()

        # If status is Cancelled, don't touch it.
        if self.status != 'Cancelled':
            # Check if publish_time is set and in the future
            if self.publish_time and now < self.publish_time:
                self.status = 'Draft'
            else:
                # If status is Draft, check if publish_time has passed
                if self.status == 'Draft':
                    if self.publish_time and now >= self.publish_time:
                        self.status = 'Published'
                
                # If status is not Draft (Published, Registration Open, etc.):
                if self.status != 'Draft':
                    if now < self.registration_start:
                        self.status = 'Published'
                    elif self.registration_start <= now < self.registration_end:
                        self.status = 'Registration Open'
                    elif self.registration_end <= now < self.start_date:
                        self.status = 'Registration Closed'
                    elif self.start_date <= now < self.end_date:
                        self.status = 'Running'
                    else:
                        self.status = 'Completed'

        super().save(*args, **kwargs)


class HackathonTitle(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='titles')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.hackathon.title})"


