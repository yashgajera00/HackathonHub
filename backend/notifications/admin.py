from django.contrib import admin
from notifications.models import Notification

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'read', 'created_at')
    list_filter = ('read', 'created_at')
    search_fields = ('user__username', 'title', 'message')

admin.site.register(Notification, NotificationAdmin)
