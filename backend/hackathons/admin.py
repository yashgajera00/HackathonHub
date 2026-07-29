from django.contrib import admin
from hackathons.models import Hackathon

class HackathonAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'start_date', 'end_date', 'venue', 'created_by', 'created_at')
    list_filter = ('status', 'city', 'country', 'start_date')
    search_fields = ('title', 'description', 'venue', 'city', 'state', 'country')
    prepopulated_fields = {'slug': ('title',)}

admin.site.register(Hackathon, HackathonAdmin)
