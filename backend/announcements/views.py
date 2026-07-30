from rest_framework import viewsets, permissions
from announcements.models import Announcement, Rule, ScheduleItem
from announcements.serializers import AnnouncementSerializer, RuleSerializer, ScheduleItemSerializer
from common.permissions import IsHackathonOrganizer
from dashboard.models import log_activity

def notify_enrolled_users(hackathon, title, message, exclude_user=None):
    from registrations.models import Registration
    from memberships.models import HackathonMember
    from notifications.models import Notification

    user_ids = set()
    # 1. Users with approved registrations
    regs = Registration.objects.filter(hackathon=hackathon, status='Approved')
    for r in regs:
        user_ids.add(r.user_id)
    # 2. Users with accepted memberships (staff, organizers, judges, etc.)
    members = HackathonMember.objects.filter(hackathon=hackathon, invitation_status='Accepted')
    for m in members:
        user_ids.add(m.user_id)

    if exclude_user:
        user_ids.discard(exclude_user.id)

    # Bulk create notifications
    notifications = [
        Notification(user_id=uid, title=title, message=message)
        for uid in user_ids
    ]
    Notification.objects.bulk_create(notifications)

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
        
        # Send notifications
        title = f"New Announcement: {ann.title}"
        snippet = ann.content[:150] + "..." if len(ann.content) > 150 else ann.content
        message = f"An announcement has been posted for '{ann.hackathon.title}': {snippet}"
        notify_enrolled_users(ann.hackathon, title, message, exclude_user=self.request.user)

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
        
        # Send notifications
        title = f"New Hackathon Rule: {rule.title}"
        snippet = rule.content[:150] + "..." if len(rule.content) > 150 else rule.content
        message = f"A new rule has been added to '{rule.hackathon.title}': {snippet}"
        notify_enrolled_users(rule.hackathon, title, message, exclude_user=self.request.user)

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
        
        # Send notifications
        title = f"Schedule Update: {item.title}"
        time_str = item.start_time.strftime('%Y-%m-%d %I:%M %p')
        venue_str = f" at {item.venue}" if item.venue else ""
        message = f"A new event '{item.title}' has been added to '{item.hackathon.title}' schedule{venue_str}, starting at {time_str}."
        notify_enrolled_users(item.hackathon, title, message, exclude_user=self.request.user)

