from django.contrib import admin
from memberships.models import HackathonMember

class HackathonMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'hackathon', 'role', 'invitation_status', 'joined_at')
    list_filter = ('role', 'invitation_status', 'hackathon')
    search_fields = ('user__username', 'hackathon__title')

admin.site.register(HackathonMember, HackathonMemberAdmin)
