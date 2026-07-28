from django.db import models
from django.conf import settings
from hackathons.models import Hackathon

class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=255)
    hackathon = models.ForeignKey(Hackathon, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"

def log_activity(user, action, hackathon=None, details=None):
    ActivityLog.objects.create(
        user=user,
        action=action,
        hackathon=hackathon,
        details=details
    )

