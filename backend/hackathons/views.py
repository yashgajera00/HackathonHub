from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django.db.models import Q
from hackathons.models import Hackathon
from hackathons.serializers import HackathonSerializer
from memberships.models import HackathonMember
from common.permissions import IsPlatformOwner, IsHackathonOrganizer
from dashboard.models import log_activity

class HackathonViewSet(viewsets.ModelViewSet):
    queryset = Hackathon.objects.all().order_by('-created_at')
    serializer_class = HackathonSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'city', 'state', 'country']
    ordering_fields = ['start_date', 'created_at', 'title']

    def get_permissions(self):
        if self.action == 'create':
            # Needs can_create_hackathon permission
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only Platform Owner or Organizer of this hackathon can edit/delete
            return [IsHackathonOrganizer()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Hackathon.objects.none()
            
        # Platform Owner sees all
        if user.is_superuser:
            return Hackathon.objects.all().order_by('-created_at')

        # Filter: Organizers/members see their draft hackathons; others only see published/running/etc (exclude 'Draft')
        # We can fetch hackathons where user is a member OR status is not Draft.
        return Hackathon.objects.filter(
            Q(memberships__user=user) | ~Q(status='Draft')
        ).distinct().order_by('-created_at')

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.action == 'create':
            if not (request.user.can_create_hackathon or request.user.is_superuser):
                self.permission_denied(
                    request,
                    message="You do not have permission to create a hackathon. Contact Platform Owner."
                )

    def perform_create(self, serializer):
        hackathon = serializer.save(created_by=self.request.user)
        # Automatically make the creator the Organizer of this hackathon
        HackathonMember.objects.create(
            hackathon=hackathon,
            user=self.request.user,
            role='Organizer',
            invitation_status='Accepted',
            invited_by=self.request.user
        )
        log_activity(
            self.request.user, 
            "Created hackathon", 
            hackathon=hackathon, 
            details=f"Created hackathon: {hackathon.title}"
        )

