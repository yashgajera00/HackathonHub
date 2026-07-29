from django.contrib import admin
from leaderboard.models import Score

class ScoreAdmin(admin.ModelAdmin):
    list_display = ('team', 'hackathon', 'judge', 'design_score', 'execution_score', 'innovation_score', 'presentation_score', 'total_score', 'submitted_at')
    list_filter = ('hackathon', 'judge', 'submitted_at')
    search_fields = ('team__name', 'judge__username')

admin.site.register(Score, ScoreAdmin)
