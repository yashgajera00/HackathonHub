from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from registrations.models import Registration
from registrations.serializers import RegistrationSerializer
from memberships.models import HackathonMember
from notifications.models import Notification
from common.permissions import IsPlatformOwner, IsHackathonOrganizer, IsHackathonVolunteer
from dashboard.models import log_activity

class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all().order_by('-registered_at')
    serializer_class = RegistrationSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['approve', 'reject']:
            return [IsHackathonOrganizer()]
        elif self.action in ['check_in', 'check_in_by_qr']:
            return [IsHackathonVolunteer()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Registration.objects.none()

        if user.is_superuser:
            return Registration.objects.all()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            # If user is Organizer or Volunteer, let them see all registrations for the hackathon
            is_staff_member = HackathonMember.objects.filter(
                hackathon_id=hackathon_id,
                user=user,
                role__in=['Organizer', 'Volunteer'],
                invitation_status='Accepted'
            ).exists()
            if is_staff_member:
                return Registration.objects.filter(hackathon_id=hackathon_id)
            
            # Otherwise, they only see their own registration for this hackathon
            return Registration.objects.filter(hackathon_id=hackathon_id, user=user)

        # By default, list user's own registrations
        return Registration.objects.filter(user=user)

    def perform_create(self, serializer):
        reg = serializer.save(user=self.request.user)
        log_activity(
            self.request.user, 
            "Registered for hackathon", 
            hackathon=reg.hackathon, 
            details=f"User registered for {reg.hackathon.title}"
        )
        
        # Notify Organizers of the registration
        organizers = HackathonMember.objects.filter(hackathon=reg.hackathon, role='Organizer', invitation_status='Accepted')
        for org in organizers:
            Notification.objects.create(
                user=org.user,
                title="New Registration Request",
                message=f"{self.request.user.username} has registered for {reg.hackathon.title}."
            )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve registration & automatically add as Participant in HackathonMember
        """
        registration = self.get_object()
        if registration.status != 'Pending':
            return Response({"detail": "Registration is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = 'Approved'
        registration.save()

        # Check if already a HackathonMember, if not create one as Participant
        member, created = HackathonMember.objects.get_or_create(
            hackathon=registration.hackathon,
            user=registration.user,
            defaults={
                'role': 'Participant',
                'invitation_status': 'Accepted',
                'invited_by': request.user
            }
        )
        if not created and member.invitation_status != 'Accepted':
            member.role = 'Participant'
            member.invitation_status = 'Accepted'
            member.save()

        log_activity(
            request.user, 
            f"Approved registration of {registration.user.username}", 
            hackathon=registration.hackathon, 
            details=f"Approved registration for {registration.user.username}"
        )

        Notification.objects.create(
            user=registration.user,
            title="Registration Approved",
            message=f"Your registration for {registration.hackathon.title} has been approved! You are now a Participant."
        )

        return Response(self.get_serializer(registration).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject registration
        """
        registration = self.get_object()
        if registration.status != 'Pending':
            return Response({"detail": "Registration is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = 'Rejected'
        registration.save()

        log_activity(
            request.user, 
            f"Rejected registration of {registration.user.username}", 
            hackathon=registration.hackathon, 
            details=f"Rejected registration for {registration.user.username}"
        )

        Notification.objects.create(
            user=registration.user,
            title="Registration Rejected",
            message=f"Your registration for {registration.hackathon.title} was rejected by the organizers."
        )

        return Response(self.get_serializer(registration).data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """
        Manual check-in by volunteer/organizer
        """
        registration = self.get_object()
        if registration.status != 'Approved':
            return Response({"detail": "Registration must be approved to check-in."}, status=status.HTTP_400_BAD_REQUEST)

        registration.checked_in = True
        registration.checked_in_at = timezone.now()
        registration.save()

        log_activity(
            request.user,
            f"Checked-in user {registration.user.username}",
            hackathon=registration.hackathon,
            details=f"Manually checked-in {registration.user.username}"
        )

        Notification.objects.create(
            user=registration.user,
            title="Checked In",
            message=f"You have been successfully checked in to {registration.hackathon.title}."
        )

        return Response(self.get_serializer(registration).data)

    @action(detail=False, methods=['post'])
    def check_in_by_qr(self, request):
        """
        Check-in by scanning QR code (UUID lookup)
        """
        qr_code_uuid = request.data.get('qr_code_uuid')
        hackathon_id = request.data.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        if not qr_code_uuid:
            return Response({"detail": "qr_code_uuid is required."}, status=status.HTTP_400_BAD_REQUEST)

        registration = get_object_or_404(Registration, qr_code_uuid=qr_code_uuid)

        # Enforce that the scanned ticket belongs to the currently active hackathon context
        if hackathon_id and str(registration.hackathon.id) != str(hackathon_id):
            return Response({
                "detail": f"This ticket belongs to {registration.hackathon.title}, not the currently selected hackathon."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Verify the scanning user is a staff member of THIS specific hackathon
        target_hackathon_id = hackathon_id or registration.hackathon.id
        if not request.user.is_superuser:
            is_staff = HackathonMember.objects.filter(
                hackathon_id=target_hackathon_id,
                user=request.user,
                role__in=['Organizer', 'Volunteer'],
                invitation_status='Accepted'
            ).exists()
            if not is_staff:
                return Response({
                    "detail": "You do not have permission to check-in participants for this hackathon."
                }, status=status.HTTP_403_FORBIDDEN)

        if registration.status != 'Approved':
            return Response({"detail": "This registration is not approved."}, status=status.HTTP_400_BAD_REQUEST)

        if registration.checked_in:
            return Response({
                "detail": f"{registration.user.username} is already checked in.",
                "registration": self.get_serializer(registration).data
            }, status=status.HTTP_200_OK)

        registration.checked_in = True
        registration.checked_in_at = timezone.now()
        registration.save()

        log_activity(
            request.user,
            f"QR Checked-in user {registration.user.username}",
            hackathon=registration.hackathon,
            details=f"QR checked-in {registration.user.username} via UUID: {qr_code_uuid}"
        )

        Notification.objects.create(
            user=registration.user,
            title="Checked In via QR Code",
            message=f"You have been checked in to {registration.hackathon.title} via QR code."
        )

        return Response({
            "detail": f"Successfully checked in {registration.user.username}!",
            "registration": self.get_serializer(registration).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def certificate(self, request, pk=None):
        """
        Generate/Retrieve Certificate for an approved and checked-in participant
        """
        registration = self.get_object()
        
        # Verify ownership or staff permissions
        if registration.user != request.user and not request.user.is_superuser:
            # Check if organizer/volunteer
            is_staff = HackathonMember.objects.filter(
                hackathon=registration.hackathon,
                user=request.user,
                role__in=['Organizer', 'Volunteer'],
                invitation_status='Accepted'
            ).exists()
            if not is_staff:
                return Response({"detail": "You do not have permission to view this certificate."}, status=status.HTTP_403_FORBIDDEN)

        if registration.status != 'Approved':
            return Response({"detail": "Registration must be approved to receive a certificate."}, status=status.HTTP_400_BAD_REQUEST)

        # They must have checked-in OR the hackathon must be completed
        is_completed = registration.hackathon.status == 'Completed'
        if not registration.checked_in and not is_completed:
            return Response({"detail": "Certificate is only issued after checking-in or completing the hackathon."}, status=status.HTTP_400_BAD_REQUEST)

        issue_date = registration.checked_in_at or registration.hackathon.end_date or timezone.now()
        cert_id = f"HH-CERT-{registration.id}-{str(registration.qr_code_uuid)[:8].upper()}"

        return Response({
            "certificate_id": cert_id,
            "participant_name": f"{registration.user.first_name} {registration.user.last_name}".strip() or registration.user.username,
            "hackathon_title": registration.hackathon.title,
            "start_date": registration.hackathon.start_date,
            "end_date": registration.hackathon.end_date,
            "issue_date": issue_date,
            "verification_uuid": registration.qr_code_uuid,
            "status": "Valid"
        }, status=status.HTTP_200_OK)

