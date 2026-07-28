from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from memberships.models import HackathonMember
from memberships.serializers import HackathonMemberSerializer
from hackathons.models import Hackathon
from notifications.models import Notification
from common.permissions import IsPlatformOwner, IsHackathonOrganizer, IsHackathonVolunteer
from dashboard.models import log_activity

class HackathonMemberViewSet(viewsets.ModelViewSet):
    queryset = HackathonMember.objects.all().order_by('-joined_at')
    serializer_class = HackathonMemberSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Organizer, Volunteer or Platform Owner can list memberships of a hackathon
            return [IsHackathonVolunteer()]
        elif self.action in ['create', 'destroy', 'update', 'partial_update', 'remove_member']:
            # Only Organizer or Platform Owner can manage memberships
            return [IsHackathonOrganizer()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return HackathonMember.objects.none()

        if user.is_superuser:
            return HackathonMember.objects.all()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            # Filters memberships to those in the specific hackathon
            return HackathonMember.objects.filter(hackathon_id=hackathon_id)

        # By default, list only accepted memberships of the user
        return HackathonMember.objects.filter(user=user, invitation_status='Accepted')

    def perform_create(self, serializer):
        # Set invited_by to current user
        # Status is default 'Pending' unless the platform owner does it (then Accepted)
        inv_status = 'Accepted' if self.request.user.is_superuser else 'Pending'
        
        # Check if inviting participant directly
        # Usually participants register themselves. But organizer can invite judges/mentors/volunteers.
        member = serializer.save(
            invited_by=self.request.user,
            invitation_status=inv_status
        )
        
        log_activity(
            self.request.user,
            f"Invited {member.user.username} as {member.role}",
            hackathon=member.hackathon,
            details=f"Invited user {member.user.username} (ID: {member.user.id}) as {member.role} to hackathon {member.hackathon.title}"
        )
        
        # Create user notification
        Notification.objects.create(
            user=member.user,
            title="Hackathon Invitation",
            message=f"You have been invited to join {member.hackathon.title} as a {member.role}."
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_memberships(self, request):
        """
        List all hackathons where the user is an accepted member
        """
        memberships = HackathonMember.objects.filter(user=request.user, invitation_status='Accepted')
        serializer = self.get_serializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_invitations(self, request):
        """
        List all pending invitations for the current user
        """
        invitations = HackathonMember.objects.filter(user=request.user, invitation_status='Pending')
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept_invitation(self, request, pk=None):
        """
        Accept an invitation to join a hackathon
        """
        membership = get_object_or_404(HackathonMember, pk=pk, user=request.user)
        if membership.invitation_status != 'Pending':
            return Response({"detail": "Invitation is not pending."}, status=status.HTTP_400_BAD_REQUEST)
            
        membership.invitation_status = 'Accepted'
        membership.save()
        
        log_activity(
            request.user,
            f"Accepted invitation as {membership.role}",
            hackathon=membership.hackathon,
            details=f"User accepted invitation to {membership.hackathon.title} as {membership.role}"
        )
        
        # Create notification for organizer who invited them
        if membership.invited_by:
            Notification.objects.create(
                user=membership.invited_by,
                title="Invitation Accepted",
                message=f"{request.user.username} accepted your invitation to join {membership.hackathon.title} as {membership.role}."
            )
            
        return Response(self.get_serializer(membership).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject_invitation(self, request, pk=None):
        """
        Reject an invitation to join a hackathon
        """
        membership = get_object_or_404(HackathonMember, pk=pk, user=request.user)
        if membership.invitation_status != 'Pending':
            return Response({"detail": "Invitation is not pending."}, status=status.HTTP_400_BAD_REQUEST)
            
        membership.invitation_status = 'Rejected'
        membership.save()
        
        log_activity(
            request.user,
            f"Rejected invitation as {membership.role}",
            hackathon=membership.hackathon,
            details=f"User rejected invitation to {membership.hackathon.title} as {membership.role}"
        )
        
        # Create notification for organizer who invited them
        if membership.invited_by:
            Notification.objects.create(
                user=membership.invited_by,
                title="Invitation Rejected",
                message=f"{request.user.username} rejected your invitation to join {membership.hackathon.title} as {membership.role}."
            )
            
        return Response(self.get_serializer(membership).data)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """
        Organizer removes a member from their hackathon
        """
        # Detail action for Organizer role.
        # Check that member belongs to the hackathon controlled by Organizer
        membership = self.get_object()
        
        if membership.role == 'Organizer' and not request.user.is_superuser:
            # Cannot remove other organizers unless superuser
            # Check if there are other organizers left.
            orgs_count = HackathonMember.objects.filter(
                hackathon=membership.hackathon, 
                role='Organizer', 
                invitation_status='Accepted'
            ).count()
            if orgs_count <= 1:
                return Response({"detail": "Cannot remove the only Organizer of the hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        membership.invitation_status = 'Removed'
        membership.save()
        
        log_activity(
            request.user,
            f"Removed member {membership.user.username}",
            hackathon=membership.hackathon,
            details=f"Removed user {membership.user.username} from hackathon {membership.hackathon.title}"
        )
        
        Notification.objects.create(
            user=membership.user,
            title="Removed from Hackathon",
            message=f"You have been removed from {membership.hackathon.title}."
        )
        
        return Response(self.get_serializer(membership).data)
