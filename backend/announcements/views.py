from rest_framework import viewsets, permissions
from announcements.models import Announcement, Rule, ScheduleItem
from announcements.serializers import AnnouncementSerializer, RuleSerializer, ScheduleItemSerializer
from common.permissions import IsHackathonOrganizer
from dashboard.models import log_activity

class BaseHackathonFilterViewSet(viewsets.ModelViewSet):
    """
    Base viewset to automatically filter by hackathon_id from query params or header
    """
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHackathonOrganizer()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        # We need the model class to do filtering
        model_class = self.serializer_class.Meta.model
        queryset = model_class.objects.all()
        
        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            return queryset.filter(hackathon_id=hackathon_id)
            
        return queryset

class AnnouncementViewSet(BaseHackathonFilterViewSet):
    serializer_class = AnnouncementSerializer

    def perform_create(self, serializer):
        ann = serializer.save(created_by=self.request.user)
        log_activity(
            self.request.user, 
            "Created announcement", 
            hackathon=ann.hackathon, 
            details=f"Created announcement: {ann.title}"
        )

class RuleViewSet(BaseHackathonFilterViewSet):
    serializer_class = RuleSerializer

    def perform_create(self, serializer):
        rule = serializer.save()
        log_activity(
            self.request.user, 
            "Created hackathon rule", 
            hackathon=rule.hackathon, 
            details=f"Created rule: {rule.title}"
        )

class ScheduleItemViewSet(BaseHackathonFilterViewSet):
    serializer_class = ScheduleItemSerializer

    def perform_create(self, serializer):
        item = serializer.save()
        log_activity(
            self.request.user, 
            "Created schedule item", 
            hackathon=item.hackathon, 
            details=f"Created schedule item: {item.title}"
        )

