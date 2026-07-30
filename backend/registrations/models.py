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

