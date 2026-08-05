from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from hackathons.models import Hackathon, HackathonTitle
from hackathons.serializers import HackathonSerializer, HackathonTitleSerializer
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

        # Automatically update all hackathon statuses based on current timeline
        from django.utils import timezone
        now = timezone.now()
        
        # 1. Transition Draft to Published if publish_time has passed
        Hackathon.objects.filter(
            status='Draft',
            publish_time__isnull=False,
            publish_time__lte=now
        ).update(status='Published')

        # 2. Update other non-Draft, non-Cancelled statuses
        base_q = ~Q(status__in=['Draft', 'Cancelled'])
        Hackathon.objects.filter(base_q, registration_start__gt=now).update(status='Published')
        Hackathon.objects.filter(base_q, registration_start__lte=now, registration_end__gt=now).update(status='Registration Open')
        Hackathon.objects.filter(base_q, registration_end__lte=now, start_date__gt=now).update(status='Registration Closed')
        Hackathon.objects.filter(base_q, start_date__lte=now, end_date__gt=now).update(status='Running')
        Hackathon.objects.filter(base_q, end_date__lte=now).update(status='Completed')
            
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

    @action(detail=True, methods=['post'], permission_classes=[IsHackathonOrganizer])
    def toggle_release_titles(self, request, pk=None):
        hackathon = self.get_object()
        hackathon.is_problem_statements_released = not hackathon.is_problem_statements_released
        hackathon.save()
        
        status_str = "released" if hackathon.is_problem_statements_released else "hidden"
        log_activity(
            request.user,
            f"Toggled problem statements release status ({status_str})",
            hackathon=hackathon,
            details=f"Problem statements are now {status_str} for {hackathon.title}"
        )

        return Response({
            "detail": f"Problem statements are now {status_str} for participants.",
            "is_problem_statements_released": hackathon.is_problem_statements_released
        })


class HackathonTitleViewSet(viewsets.ModelViewSet):
    queryset = HackathonTitle.objects.all().order_by('-created_at')
    serializer_class = HackathonTitleSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return HackathonTitle.objects.none()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            return HackathonTitle.objects.filter(hackathon_id=hackathon_id).order_by('created_at')
        return HackathonTitle.objects.all().order_by('created_at')

    def check_permissions(self, request):
        super().check_permissions(request)
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            hackathon_id = request.data.get('hackathon') or request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
            if self.action in ['update', 'partial_update', 'destroy'] and not hackathon_id and hasattr(self, 'get_object'):
                try:
                    obj = self.get_object()
                    hackathon_id = obj.hackathon.id
                except Exception:
                    pass

            if hackathon_id:
                is_organizer = request.user.is_superuser or HackathonMember.objects.filter(
                    hackathon_id=hackathon_id,
                    user=request.user,
                    role='Organizer',
                    invitation_status='Accepted'
                ).exists()
                if not is_organizer:
                    self.permission_denied(
                        request,
                        message="Only Hackathon Organizers can manage problem titles."
                    )


