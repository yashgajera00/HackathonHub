from django.contrib import admin
from dashboard.models import ActivityLog

class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'hackathon', 'timestamp')
    list_filter = ('action', 'hackathon', 'timestamp')
    search_fields = ('user__username', 'action', 'details')

admin.site.register(ActivityLog, ActivityLogAdmin)
