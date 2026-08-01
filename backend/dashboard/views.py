from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models import Count, Q
from dashboard.models import ActivityLog
from dashboard.serializers import ActivityLogSerializer
from users.models import CustomUser
from hackathons.models import Hackathon
from registrations.models import Registration
from teams.models import Team
from memberships.models import HackathonMember
from common.permissions import IsPlatformOwner, IsHackathonOrganizer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ActivityLog.objects.none()

        if user.is_superuser:
            queryset = ActivityLog.objects.all().order_by('-timestamp')
            user_id = self.request.query_params.get('user_id')
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            return queryset

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            # Check if user is organizer
            is_organizer = HackathonMember.objects.filter(
                hackathon_id=hackathon_id,
                user=user,
                role='Organizer',
                invitation_status='Accepted'
            ).exists()
            if is_organizer:
                return ActivityLog.objects.filter(hackathon_id=hackathon_id).order_by('-timestamp')

        # Fallback: users only see their own logs
        return ActivityLog.objects.filter(user=user).order_by('-timestamp')


class DashboardAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[IsPlatformOwner])
    def platform_owner(self, request):
        """
        Global platform statistics for Platform Owner
        """
        total_users = CustomUser.objects.count()
        total_hackathons = Hackathon.objects.count()
        
        # Breakdown of hackathons
        draft_hackathons = Hackathon.objects.filter(status='Draft').count()
        published_hackathons = Hackathon.objects.filter(status='Published').count()
        running_hackathons = Hackathon.objects.filter(status='Running').count()
        completed_hackathons = Hackathon.objects.filter(status='Completed').count()
        
        total_registrations = Registration.objects.count()
        approved_registrations = Registration.objects.filter(status='Approved').count()
        pending_registrations = Registration.objects.filter(status='Pending').count()
        
        # Recent user activity logs
        recent_logs = ActivityLog.objects.all().order_by('-timestamp')[:15]
        logs_serializer = ActivityLogSerializer(recent_logs, many=True)

        recent_users = CustomUser.objects.all().order_by('-date_joined')[:5]
        recent_hackathons = Hackathon.objects.all().order_by('-created_at')[:5]

        # Let's count user registrations over time or role distributions
        volunteers_count = HackathonMember.objects.filter(role='Volunteer', invitation_status='Accepted').count()
        judges_count = HackathonMember.objects.filter(role='Judge', invitation_status='Accepted').count()
        organizers_count = HackathonMember.objects.filter(role='Organizer', invitation_status='Accepted').count()
        participants_count = HackathonMember.objects.filter(role='Participant', invitation_status='Accepted').count()

        return Response({
            "users": {
                "total": total_users,
                "recent": [{"id": u.id, "username": u.username, "email": u.email, "joined": u.date_joined} for u in recent_users]
            },
            "hackathons": {
                "total": total_hackathons,
                "draft": draft_hackathons,
                "published": published_hackathons,
                "running": running_hackathons,
                "completed": completed_hackathons,
                "recent": [{"id": h.id, "title": h.title, "status": h.status, "created": h.created_at} for h in recent_hackathons]
            },
            "registrations": {
                "total": total_registrations,
                "approved": approved_registrations,
                "pending": pending_registrations,
            },
            "memberships": {
                "organizers": organizers_count,
                "volunteers": volunteers_count,
                "judges": judges_count,
                "participants": participants_count
            },
            "recent_activity": logs_serializer.data
        })

    @action(detail=False, methods=['get'])
    def organizer(self, request):
        """
        Hackathon-specific statistics for Organizer
        """
        hackathon_id = request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        if not hackathon_id:
            return Response({"detail": "hackathon_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check permissions: Platform Owner OR Hackathon Organizer
        is_owner = request.user.is_superuser
        is_organizer = HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=request.user,
            role='Organizer',
            invitation_status='Accepted'
        ).exists()

        if not (is_owner or is_organizer):
            return Response({"detail": "You do not have organizer permissions for this hackathon."}, status=status.HTTP_403_FORBIDDEN)

        hackathon = get_object_or_404(Hackathon, pk=hackathon_id)

        # Basic counts
        total_registrations = Registration.objects.filter(hackathon=hackathon).count()
        approved_registrations = Registration.objects.filter(hackathon=hackathon, status='Approved').count()
        pending_registrations = Registration.objects.filter(hackathon=hackathon, status='Pending').count()
        rejected_registrations = Registration.objects.filter(hackathon=hackathon, status='Rejected').count()

        total_teams = Team.objects.filter(hackathon=hackathon).count()
        
        # Teams with project submissions
        teams_submitted = Team.objects.filter(
            hackathon=hackathon
        ).exclude(
            project_title__isnull=True
        ).exclude(
            project_title=''
        ).count()

        # Checked-in (Attendance)
        checked_in_participants = Registration.objects.filter(hackathon=hackathon, checked_in=True).count()

        # Members count by role
        members_by_role = HackathonMember.objects.filter(
            hackathon=hackathon, 
            invitation_status='Accepted'
        ).values('role').annotate(count=Count('role'))

        members_breakdown = {
            "Organizer": 0,
            "Volunteer": 0,
            "Judge": 0,
            "Mentor": 0,
            "Participant": 0
        }
        for item in members_by_role:
            members_breakdown[item['role']] = item['count']

        # Recent activities in this hackathon
        recent_logs = ActivityLog.objects.filter(hackathon=hackathon).order_by('-timestamp')[:5]
        logs_serializer = ActivityLogSerializer(recent_logs, many=True)

        return Response({
            "hackathon_title": hackathon.title,
            "status": hackathon.status,
            "registrations": {
                "total": total_registrations,
                "approved": approved_registrations,
                "pending": pending_registrations,
                "rejected": rejected_registrations
            },
            "teams": {
                "total": total_teams,
                "submitted": teams_submitted,
            },
            "checked_in_attendance": checked_in_participants,
            "members": members_breakdown,
            "recent_activity": logs_serializer.data
        })

