from django.contrib import admin
from announcements.models import Announcement, Rule, ScheduleItem

class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'hackathon', 'created_by', 'created_at')
    list_filter = ('hackathon', 'created_at')
    search_fields = ('title', 'content')

class RuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'hackathon', 'created_at', 'updated_at')
    list_filter = ('hackathon', 'created_at')
    search_fields = ('title', 'content')

class ScheduleItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'hackathon', 'start_time', 'end_time', 'venue')
    list_filter = ('hackathon', 'start_time')
    search_fields = ('title', 'description', 'venue')

admin.site.register(Announcement, AnnouncementAdmin)
admin.site.register(Rule, RuleAdmin)
admin.site.register(ScheduleItem, ScheduleItemAdmin)
