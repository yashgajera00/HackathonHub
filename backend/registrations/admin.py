from django.contrib import admin
from registrations.models import Registration

class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'hackathon', 'status', 'checked_in', 'registered_at')
    list_filter = ('status', 'checked_in', 'hackathon')
    search_fields = ('user__username', 'hackathon__title')

admin.site.register(Registration, RegistrationAdmin)
