from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Count
from hackathons.models import Hackathon
from teams.models import Team, TeamMember, TeamInvitation, TeamJoinRequest
from teams.serializers import TeamSerializer, TeamInvitationSerializer, TeamJoinRequestSerializer
from memberships.models import HackathonMember
from notifications.models import Notification
from common.permissions import IsHackathonOrganizer, IsHackathonParticipant
from dashboard.models import log_activity

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all().order_by('-created_at')
    serializer_class = TeamSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can delete the team."}, status=status.HTTP_403_FORBIDDEN)
        if instance.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot delete team after submission or approval."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Log activity
        log_activity(
            request.user,
            "Deleted team",
            hackathon=instance.hackathon,
            details=f"Deleted team: {instance.name}"
        )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join_by_invite_code(self, request):
        invite_code = request.data.get('invite_code')
        if not invite_code:
            return Response({"detail": "invite_code is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        team = Team.objects.filter(invite_code=invite_code).first()
        if not team:
            return Response({"detail": "Invalid invite code or link."}, status=status.HTTP_404_NOT_FOUND)
            
        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot join a submitted or approved team."}, status=status.HTTP_400_BAD_REQUEST)
            
        max_size = team.hackathon.max_team_size
        if team.members.count() >= max_size:
            return Response({"detail": "This team is already full."}, status=status.HTTP_400_BAD_REQUEST)
            
        if TeamMember.objects.filter(hackathon=team.hackathon, user=request.user).exists():
            return Response({"detail": "You are already a member of a team in this hackathon."}, status=status.HTTP_400_BAD_REQUEST)
            
        from registrations.models import Registration
        reg = Registration.objects.filter(hackathon=team.hackathon, user=request.user, status='Approved').first()
        if not reg:
            return Response({"detail": "You must be registered and approved in this hackathon to join a team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already requested
        if TeamJoinRequest.objects.filter(team=team, requester=request.user, status='Pending').exists():
            return Response({"detail": "Join request to this team is already pending."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            join_req = TeamJoinRequest.objects.create(
                team=team,
                requester=request.user,
                status='Pending'
            )
            
            log_activity(
                request.user,
                "Requested to join team via link",
                hackathon=team.hackathon,
                details=f"Requested to join team: {team.name} via invite link"
            )
            
            Notification.objects.create(
                user=team.created_by,
                title="New Team Join Request",
                message=f"{request.user.username} has requested to join your team '{team.name}' via invite link."
            )
            
        return Response({"detail": f"Successfully sent join request for team '{team.name}'! The leader has been notified.", "team_id": team.id})

    def get_permissions(self):
        if self.action in ['create', 'leave', 'submit_project']:
            # Must be a participant or organizer
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy', 'kick_member']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Team.objects.none()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        my_only = self.request.query_params.get('my_only') == 'true'

        if hackathon_id:
            queryset = Team.objects.filter(hackathon_id=hackathon_id)
            if my_only:
                queryset = queryset.filter(members__user=user)
            return queryset

        # By default, list teams user is a member of
        return Team.objects.filter(members__user=user)

    def check_permissions(self, request):
        super().check_permissions(request)
        
        # Verify role in hackathon if hackathon_id is present
        hackathon_id = request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        if hackathon_id and self.action == 'create':
            # Check if user is registered/accepted participant
            is_participant = HackathonMember.objects.filter(
                hackathon_id=hackathon_id,
                user=request.user,
                role='Participant',
                invitation_status='Accepted'
            ).exists()
            # Organizer and platform owners can bypass
            if not is_participant and not request.user.is_superuser:
                self.permission_denied(
                    request,
                    message="Only registered Participants can create a team in this hackathon."
                )

    def perform_create(self, serializer):
        with transaction.atomic():
            team = serializer.save(created_by=self.request.user)
            # Create a leader TeamMember record
            TeamMember.objects.create(
                team=team,
                user=self.request.user,
                role='Leader',
                hackathon=team.hackathon
            )
            log_activity(
                self.request.user,
                "Created team",
                hackathon=team.hackathon,
                details=f"Created team: {team.name} in {team.hackathon.title}"
            )

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """
        Leave a team. If the leader leaves:
        - Transfer leadership to another member if possible
        - Otherwise delete the team
        """
        team = self.get_object()
        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot leave team after submission or approval."}, status=status.HTTP_400_BAD_REQUEST)
        member_record = get_object_or_404(TeamMember, team=team, user=request.user)

        with transaction.atomic():
            member_record.delete()
            log_activity(
                request.user,
                "Left team",
                hackathon=team.hackathon,
                details=f"Left team: {team.name}"
            )

            other_members = team.members.all().order_by('joined_at')
            if not other_members.exists():
                # Delete team if empty
                team.delete()
                return Response({"detail": "You left the team. The team was empty and has been deleted."}, status=status.HTTP_200_OK)
            
            if member_record.role == 'Leader':
                # Promote the next member to Leader
                next_leader = other_members.first()
                next_leader.role = 'Leader'
                next_leader.save()
                
                team.created_by = next_leader.user
                team.save()

                Notification.objects.create(
                    user=next_leader.user,
                    title="Promoted to Team Leader",
                    message=f"The previous leader left. You are now the leader of team {team.name}."
                )

        return Response({"detail": "Successfully left the team."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def kick_member(self, request, pk=None):
        """
        Leader kicks a member from the team
        """
        team = self.get_object()
        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot modify team roster after submission or approval."}, status=status.HTTP_400_BAD_REQUEST)
        if team.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can kick members."}, status=status.HTTP_403_FORBIDDEN)

        kick_user_id = request.data.get('user_id')
        if not kick_user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        if kick_user_id == team.created_by.id:
            return Response({"detail": "Cannot kick yourself. Use the leave endpoint instead."}, status=status.HTTP_400_BAD_REQUEST)

        member_record = get_object_or_404(TeamMember, team=team, user_id=kick_user_id)
        member_record.delete()

        log_activity(
            request.user,
            f"Kicked member {member_record.user.username}",
            hackathon=team.hackathon,
            details=f"Kicked user {member_record.user.username} from team {team.name}"
        )

        Notification.objects.create(
            user=member_record.user,
            title="Kicked from Team",
            message=f"You have been removed from team {team.name} by the leader."
        )

        return Response(self.get_serializer(team).data)

    @action(detail=True, methods=['post', 'put', 'patch'])
    def submit_project(self, request, pk=None):
        """
        Leader submits project details/submission links
        """
        team = self.get_object()
        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot edit deliverables after submission or approval."}, status=status.HTTP_400_BAD_REQUEST)
        if team.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can submit projects."}, status=status.HTTP_403_FORBIDDEN)

        team.project_title = request.data.get('project_title', team.project_title)
        team.project_description = request.data.get('project_description', team.project_description)
        team.project_submission_link = request.data.get('project_submission_link', team.project_submission_link)
        team.save()

        log_activity(
            request.user,
            "Submitted project details",
            hackathon=team.hackathon,
            details=f"Submitted project for team {team.name}: {team.project_title}"
        )

        # Notify other team members
        for member in team.members.all():
            if member.user != request.user:
                Notification.objects.create(
                    user=member.user,
                    title="Project Updated",
                    message=f"Leader updated team project details for {team.name}."
                )

        return Response(self.get_serializer(team).data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Team leader submits the team for organizer approval.
        Enforces team size constraints.
        """
        team = self.get_object()
        if team.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can submit the team."}, status=status.HTTP_403_FORBIDDEN)
            
        if team.status not in ['Pending', 'Rejected']:
            return Response({"detail": "Team can only be submitted if it is Pending or Rejected."}, status=status.HTTP_400_BAD_REQUEST)

        # Check membership count against min/max limits
        member_count = team.members.count()
        min_size = team.hackathon.min_team_size
        max_size = team.hackathon.max_team_size

        if member_count < min_size:
            return Response({
                "detail": f"Team size ({member_count}) is less than the minimum required size ({min_size}) for this hackathon."
            }, status=status.HTTP_400_BAD_REQUEST)

        if member_count > max_size:
            return Response({
                "detail": f"Team size ({member_count}) exceeds the maximum allowed size ({max_size}) for this hackathon."
            }, status=status.HTTP_400_BAD_REQUEST)

        team.status = 'Submitted'
        team.save()

        log_activity(
            request.user,
            "Submitted team",
            hackathon=team.hackathon,
            details=f"Submitted team {team.name} for organizer approval."
        )

        return Response(self.get_serializer(team).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Organizer approves the team submission, making it selected for the hackathon.
        """
        team = self.get_object()
        
        # Check if requester is organizer
        is_organizer = HackathonMember.objects.filter(
            hackathon=team.hackathon,
            user=request.user,
            role='Organizer',
            invitation_status='Accepted'
        ).exists()

        if not is_organizer and not request.user.is_superuser:
            return Response({"detail": "Only Hackathon Organizers can approve teams."}, status=status.HTTP_403_FORBIDDEN)

        if team.status != 'Submitted':
            return Response({"detail": "Only submitted teams can be approved."}, status=status.HTTP_400_BAD_REQUEST)

        team.status = 'Approved'
        team.save()

        log_activity(
            request.user,
            "Approved team",
            hackathon=team.hackathon,
            details=f"Approved team: {team.name}"
        )

        # Notify team members
        for member in team.members.all():
            Notification.objects.create(
                user=member.user,
                title="Team Approved & Selected",
                message=f"Congratulations! Your team '{team.name}' has been approved and selected for {team.hackathon.title}."
            )

        return Response(self.get_serializer(team).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Organizer rejects the team submission.
        """
        team = self.get_object()
        
        # Check if requester is organizer
        is_organizer = HackathonMember.objects.filter(
            hackathon=team.hackathon,
            user=request.user,
            role='Organizer',
            invitation_status='Accepted'
        ).exists()

        if not is_organizer and not request.user.is_superuser:
            return Response({"detail": "Only Hackathon Organizers can reject teams."}, status=status.HTTP_403_FORBIDDEN)

        if team.status != 'Submitted':
            return Response({"detail": "Only submitted teams can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

        team.status = 'Rejected'
        team.save()

        log_activity(
            request.user,
            "Rejected team",
            hackathon=team.hackathon,
            details=f"Rejected team: {team.name}"
        )

        # Notify team members
        for member in team.members.all():
            Notification.objects.create(
                user=member.user,
                title="Team Submission Rejected",
                message=f"Your team submission for '{team.name}' in {team.hackathon.title} was rejected by organizers."
            )

        return Response(self.get_serializer(team).data)

class TeamInvitationViewSet(viewsets.ModelViewSet):
    queryset = TeamInvitation.objects.all().order_by('-invited_at')
    serializer_class = TeamInvitationSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return TeamInvitation.objects.none()
            
        # User sees invites sent to them or invites sent from teams they lead
        return TeamInvitation.objects.filter(
            Q(invitee=user) | Q(team__created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data['team']
        invitee = serializer.validated_data['invitee']
        
        # Check if current user is the leader of the team
        if team.created_by != self.request.user and not self.request.user.is_superuser:
            self.permission_denied(self.request, message="Only the Team Leader can invite members.")

        if team.status in ['Submitted', 'Approved']:
            self.permission_denied(self.request, message="Cannot invite members to a submitted or approved team.")

        # Check if team size limit exceeded
        max_size = team.hackathon.max_team_size
        current_members = team.members.count()
        if current_members >= max_size:
            self.permission_denied(self.request, message="Team has reached its maximum size limit.")

        invitation = serializer.save()
        
        # Send user notification
        Notification.objects.create(
            user=invitee,
            title="Team Invitation",
            message=f"You have been invited to join team '{team.name}' in {team.hackathon.title}."
        )

    @action(detail=False, methods=['get'])
    def my_invitations(self, request):
        invitations = TeamInvitation.objects.filter(invitee=request.user, status='Pending')
        serializer = self.get_serializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = get_object_or_404(TeamInvitation, pk=pk, invitee=request.user)
        if invitation.status != 'Pending':
            return Response({"detail": "Invitation is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        team = invitation.team
        
        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot join a submitted or approved team."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify user is not already in a team
        if TeamMember.objects.filter(hackathon=team.hackathon, user=request.user).exists():
            invitation.status = 'Rejected'
            invitation.save()
            return Response({"detail": "You are already a member of a team in this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        # Check capacity
        max_size = team.hackathon.max_team_size
        if team.members.count() >= max_size:
            return Response({"detail": "This team is already full."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            invitation.status = 'Accepted'
            invitation.save()

            # Create team member
            TeamMember.objects.create(
                team=team,
                user=request.user,
                role='Member',
                hackathon=team.hackathon
            )

            # Reject/Cancel all other pending invitations for this user in this hackathon
            TeamInvitation.objects.filter(
                invitee=request.user,
                team__hackathon=team.hackathon,
                status='Pending'
            ).update(status='Rejected')

            log_activity(
                request.user,
                "Joined team",
                hackathon=team.hackathon,
                details=f"Joined team: {team.name} via invitation"
            )

            # Notify team leader
            Notification.objects.create(
                user=team.created_by,
                title="Invitation Accepted",
                message=f"{request.user.username} accepted the invitation to join team {team.name}."
            )

        return Response(TeamInvitationSerializer(invitation).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invitation = get_object_or_404(TeamInvitation, pk=pk, invitee=request.user)
        if invitation.status != 'Pending':
            return Response({"detail": "Invitation is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        invitation.status = 'Rejected'
        invitation.save()

        # Notify team leader
        Notification.objects.create(
            user=invitation.team.created_by,
            title="Invitation Rejected",
            message=f"{request.user.username} rejected the invitation to join team {invitation.team.name}."
        )

        return Response(TeamInvitationSerializer(invitation).data)

    @action(detail=False, methods=['post'])
    def request_join(self, request):
        """
        Participant requests to join a team by team name (case-insensitive)
        """
        team_name = request.data.get('team_name')
        hackathon_id = request.data.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        
        if not team_name:
            return Response({"detail": "team_name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not hackathon_id:
            return Response({"detail": "Hackathon ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Look up team by name and hackathon
        team = Team.objects.filter(hackathon_id=hackathon_id, name__iexact=team_name).first()
        if not team:
            return Response({"detail": f"Team with name '{team_name}' does not exist in this hackathon."}, status=status.HTTP_404_NOT_FOUND)

        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot request to join a submitted or approved team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check capacity
        max_size = team.hackathon.max_team_size
        if team.members.count() >= max_size:
            return Response({"detail": "This team is already full."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify requester is registered and NOT in any other team
        if TeamMember.objects.filter(hackathon_id=hackathon_id, user=request.user).exists():
            return Response({"detail": "You are already a member of a team in this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already requested
        if TeamJoinRequest.objects.filter(team=team, requester=request.user, status='Pending').exists():
            return Response({"detail": "Join request to this team is already pending."}, status=status.HTTP_400_BAD_REQUEST)

        # Create join request
        join_req = TeamJoinRequest.objects.create(
            team=team,
            requester=request.user,
            status='Pending'
        )

        # Notify team leader
        Notification.objects.create(
            user=team.created_by,
            title="New Team Join Request",
            message=f"{request.user.username} has requested to join your team '{team.name}'."
        )

        return Response(TeamJoinRequestSerializer(join_req).data, status=status.HTTP_201_CREATED)

from django.db.models import Q

class TeamJoinRequestViewSet(viewsets.ModelViewSet):
    queryset = TeamJoinRequest.objects.all().order_by('-created_at')
    serializer_class = TeamJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        
        # Leaders see incoming requests for their team; requesters see their sent requests
        qs = TeamJoinRequest.objects.filter(
            Q(requester=user) | Q(team__created_by=user)
        ).distinct()

        if hackathon_id:
            qs = qs.filter(team__hackathon_id=hackathon_id)

        return qs

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        join_req = self.get_object()
        team = join_req.team

        # Verify requester is the team leader
        if team.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can accept join requests."}, status=status.HTTP_403_FORBIDDEN)

        if join_req.status != 'Pending':
            return Response({"detail": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        if team.status in ['Submitted', 'Approved']:
            return Response({"detail": "Cannot accept members to a submitted or approved team."}, status=status.HTTP_400_BAD_REQUEST)

        # Check capacity
        max_size = team.hackathon.max_team_size
        if team.members.count() >= max_size:
            return Response({"detail": "This team has reached its maximum size limit."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify user is not already in a team
        if TeamMember.objects.filter(hackathon=team.hackathon, user=join_req.requester).exists():
            join_req.status = 'Rejected'
            join_req.save()
            return Response({"detail": "User is already a member of a team in this hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            join_req.status = 'Accepted'
            join_req.save()

            # Create team member
            TeamMember.objects.create(
                team=team,
                user=join_req.requester,
                role='Member',
                hackathon=team.hackathon
            )

            # Reject/Cancel all other pending requests and invitations for this user in this hackathon
            TeamInvitation.objects.filter(
                invitee=join_req.requester,
                team__hackathon=team.hackathon,
                status='Pending'
            ).update(status='Rejected')

            TeamJoinRequest.objects.filter(
                requester=join_req.requester,
                team__hackathon=team.hackathon,
                status='Pending'
            ).exclude(pk=join_req.pk).update(status='Rejected')

            log_activity(
                request.user,
                "Accepted team join request",
                hackathon=team.hackathon,
                details=f"Accepted join request from {join_req.requester.username} for team {team.name}"
            )

            # Notify requester
            Notification.objects.create(
                user=join_req.requester,
                title="Join Request Accepted",
                message=f"Your request to join team '{team.name}' has been accepted!"
            )

        return Response(TeamJoinRequestSerializer(join_req).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        join_req = self.get_object()
        team = join_req.team

        # Verify requester is the team leader
        if team.created_by != request.user and not request.user.is_superuser:
            return Response({"detail": "Only the Team Leader can reject join requests."}, status=status.HTTP_403_FORBIDDEN)

        if join_req.status != 'Pending':
            return Response({"detail": "Request is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        join_req.status = 'Rejected'
        join_req.save()

        # Notify requester
        Notification.objects.create(
            user=join_req.requester,
            title="Join Request Declined",
            message=f"Your request to join team '{team.name}' was declined by the leader."
        )

        return Response(TeamJoinRequestSerializer(join_req).data)

