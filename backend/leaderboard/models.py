from django.db import models
from django.conf import settings
from hackathons.models import Hackathon
from teams.models import Team

class Score(models.Model):
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='scores')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='scores')
    judge = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_scores')
    
    design_score = models.IntegerField(default=0)
    execution_score = models.IntegerField(default=0)
    innovation_score = models.IntegerField(default=0)
    presentation_score = models.IntegerField(default=0)
    
    feedback = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['team', 'judge'], name='unique_team_judge_score')
        ]

    @property
    def total_score(self):
        return self.design_score + self.execution_score + self.innovation_score + self.presentation_score

    def __str__(self):
        return f"Score for {self.team.name} by {self.judge.username} ({self.total_score})"

