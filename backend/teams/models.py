from django.db import models
from django.conf import settings
from hackathons.models import Hackathon

class Team(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=100)
    project_title = models.CharField(max_length=255, blank=True, null=True)
    project_description = models.TextField(blank=True, null=True)
    project_submission_link = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_teams')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['hackathon', 'name'], name='unique_team_name_per_hackathon')
        ]

    def __str__(self):
        return f"{self.name} ({self.hackathon.title})"

class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('Leader', 'Leader'),
        ('Member', 'Member'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Member')
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='team_members') # Added for DB constraint
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # User can only be in one team per hackathon
            models.UniqueConstraint(fields=['hackathon', 'user'], name='unique_user_team_per_hackathon')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.team.name} ({self.role})"

class TeamInvitation(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    invitee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    invited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['team', 'invitee'], name='unique_team_invitee')
        ]

    def __str__(self):
        return f"Invite: {self.team.name} to {self.invitee.username} ({self.status})"

