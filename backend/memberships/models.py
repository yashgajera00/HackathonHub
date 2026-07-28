from django.db import models
from django.conf import settings
from hackathons.models import Hackathon

class HackathonMember(models.Model):
    ROLE_CHOICES = [
        ('Organizer', 'Organizer'),
        ('Volunteer', 'Volunteer'),
        ('Judge', 'Judge'),
        ('Mentor', 'Mentor'),
        ('Participant', 'Participant'),
    ]

    INVITATION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
        ('Removed', 'Removed'),
    ]

    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    joined_at = models.DateTimeField(auto_now_add=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sent_memberships'
    )
    invitation_status = models.CharField(
        max_length=50, 
        choices=INVITATION_STATUS_CHOICES, 
        default='Pending'
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['hackathon', 'user'], name='unique_hackathon_user')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.hackathon.title} ({self.role})"

