from django.contrib import admin
from teams.models import Team, TeamMember, TeamInvitation

class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'hackathon', 'project_title', 'created_by', 'created_at')
    list_filter = ('hackathon', 'created_at')
    search_fields = ('name', 'project_title', 'project_description')

class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'role', 'hackathon', 'joined_at')
    list_filter = ('role', 'hackathon', 'joined_at')
    search_fields = ('user__username', 'team__name')

class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ('team', 'invitee', 'status', 'invited_at')
    list_filter = ('status', 'invited_at')
    search_fields = ('team__name', 'invitee__username')

admin.site.register(Team, TeamAdmin)
admin.site.register(TeamMember, TeamMemberAdmin)
admin.site.register(TeamInvitation, TeamInvitationAdmin)
