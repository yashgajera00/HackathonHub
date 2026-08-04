from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from registrations.models import Registration, FoodCoupon, UserFoodToken, FoodRedemptionLog
from registrations.serializers import RegistrationSerializer, FoodCouponSerializer, UserFoodTokenSerializer, FoodRedemptionLogSerializer
from memberships.models import HackathonMember
from notifications.models import Notification
from common.permissions import IsPlatformOwner, IsHackathonOrganizer, IsHackathonVolunteer
from dashboard.models import log_activity
from users.models import CustomUser

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
        reg = serializer.save(user=self.request.user, status='Approved')
        log_activity(
            self.request.user, 
            "Registered for hackathon", 
            hackathon=reg.hackathon, 
            details=f"User registered for {reg.hackathon.title}"
        )
        
        # Automatically add as Participant in HackathonMember so they can form/join a team
        HackathonMember.objects.get_or_create(
            hackathon=reg.hackathon,
            user=self.request.user,
            defaults={
                'role': 'Participant',
                'invitation_status': 'Accepted'
            }
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
        if registration.status not in ['Pending', 'Rejected']:
            return Response({"detail": "Registration must be pending or rejected to approve."}, status=status.HTTP_400_BAD_REQUEST)

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
        if registration.status not in ['Pending', 'Approved']:
            return Response({"detail": "Registration must be pending or approved to reject."}, status=status.HTTP_400_BAD_REQUEST)

        registration.status = 'Rejected'
        registration.checked_in = False
        registration.checked_in_at = None
        registration.save()

        # Remove Participant membership if any
        HackathonMember.objects.filter(
            hackathon=registration.hackathon,
            user=registration.user,
            role='Participant'
        ).delete()

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


class FoodCouponViewSet(viewsets.ModelViewSet):
    queryset = FoodCoupon.objects.all().order_by('-created_at')
    serializer_class = FoodCouponSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return FoodCoupon.objects.none()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            return FoodCoupon.objects.filter(hackathon_id=hackathon_id)
        return FoodCoupon.objects.all()

    def perform_create(self, serializer):
        food_coupon = serializer.save()
        hackathon = food_coupon.hackathon

        # Automatically generate user food tokens for all eligible participants & staff
        target_roles = food_coupon.target_roles or 'All'
        
        # 1. Registered Approved Participants
        if target_roles in ['All', 'Participant']:
            regs = Registration.objects.filter(hackathon=hackathon, status='Approved')
            for reg in regs:
                UserFoodToken.objects.get_or_create(
                    hackathon=hackathon,
                    food_coupon=food_coupon,
                    user=reg.user,
                    defaults={'total_coupons': food_coupon.default_coupons_per_person}
                )

        # 2. Staff Members (Volunteers, Judges, Organizers, Mentors)
        staff_memberships = HackathonMember.objects.filter(
            hackathon=hackathon,
            invitation_status='Accepted'
        )
        if target_roles != 'All':
            staff_memberships = staff_memberships.filter(role=target_roles)

        for m in staff_memberships:
            UserFoodToken.objects.get_or_create(
                hackathon=hackathon,
                food_coupon=food_coupon,
                user=m.user,
                defaults={'total_coupons': food_coupon.default_coupons_per_person}
            )

    @action(detail=False, methods=['post'])
    def issue_extra(self, request):
        user = request.user
        hackathon_id = request.data.get('hackathon') or request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        
        # Check permissions (Must be Organizer or Platform Owner)
        is_organizer = user.is_superuser or HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=user,
            role='Organizer',
            invitation_status='Accepted'
        ).exists()

        if not is_organizer:
            return Response({"detail": "Only Hackathon Organizers can award extra food coupons."}, status=status.HTTP_403_FORBIDDEN)

        target_user_id = request.data.get('user_id')
        food_coupon_id = request.data.get('food_coupon_id')
        extra_count = int(request.data.get('extra_coupons', 1))
        notes = request.data.get('notes', 'Extra meal coupon awarded by Organizer')

        if not target_user_id or not food_coupon_id:
            return Response({"detail": "user_id and food_coupon_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        food_coupon = get_object_or_404(FoodCoupon, id=food_coupon_id)
        target_user = get_object_or_404(CustomUser, id=target_user_id)

        token, created = UserFoodToken.objects.get_or_create(
            hackathon=food_coupon.hackathon,
            food_coupon=food_coupon,
            user=target_user,
            defaults={'total_coupons': food_coupon.default_coupons_per_person, 'is_extra': True, 'notes': notes}
        )

        if not created:
            token.total_coupons += extra_count
            token.is_extra = True
            if notes:
                token.notes = notes
            token.save()

        Notification.objects.create(
            user=target_user,
            title="Extra Meal Coupon Awarded!",
            message=f"You have been awarded +{extra_count} extra coupon(s) for '{food_coupon.name}'!"
        )

        return Response({
            "detail": f"Successfully awarded extra coupon(s) to {target_user.username}!",
            "token": UserFoodTokenSerializer(token).data
        }, status=status.HTTP_200_OK)


class UserFoodTokenViewSet(viewsets.ModelViewSet):
    queryset = UserFoodToken.objects.all().order_by('-issued_at')
    serializer_class = UserFoodTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return UserFoodToken.objects.none()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        
        # Staff can see tokens for hackathon
        is_staff = user.is_superuser or (hackathon_id and HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=user,
            role__in=['Organizer', 'Volunteer'],
            invitation_status='Accepted'
        ).exists())

        if is_staff:
            return UserFoodToken.objects.filter(hackathon_id=hackathon_id)

        if hackathon_id:
            return UserFoodToken.objects.filter(hackathon_id=hackathon_id, user=user)

        return UserFoodToken.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_passes(self, request):
        user = request.user
        hackathon_id = request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        
        if not hackathon_id:
            return Response({"detail": "hackathon_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        tokens = UserFoodToken.objects.filter(hackathon_id=hackathon_id, user=user)
        serializer = self.get_serializer(tokens, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def scan_redeem(self, request):
        user = request.user
        hackathon_id = request.data.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        
        # Verify Scanner permission (Organizer, Volunteer, Platform Owner)
        is_scanner = user.is_superuser or (hackathon_id and HackathonMember.objects.filter(
            hackathon_id=hackathon_id,
            user=user,
            role__in=['Organizer', 'Volunteer'],
            invitation_status='Accepted'
        ).exists())

        if not is_scanner:
            return Response({"detail": "Only Organizers and Volunteers can scan and redeem food coupons."}, status=status.HTTP_403_FORBIDDEN)

        token_code = request.data.get('token_code') or request.data.get('qr_payload')
        user_id = request.data.get('user_id')
        food_coupon_id = request.data.get('food_coupon_id')

        token = None
        if token_code:
            token = UserFoodToken.objects.filter(token_code=token_code).first()
        elif user_id and food_coupon_id:
            token = UserFoodToken.objects.filter(user_id=user_id, food_coupon_id=food_coupon_id).first()

        if not token:
            return Response({"detail": "Invalid food QR code or token not found."}, status=status.HTTP_404_NOT_FOUND)

        remaining = token.total_coupons - token.used_coupons
        if remaining <= 0:
            return Response({
                "detail": f"All {token.total_coupons} coupon(s) for '{token.food_coupon.name}' have ALREADY been redeemed!",
                "user_name": f"{token.user.first_name} {token.user.last_name}".strip() or token.user.username,
                "meal_name": token.food_coupon.name,
                "used": token.used_coupons,
                "total": token.total_coupons
            }, status=status.HTTP_400_BAD_REQUEST)

        token.used_coupons += 1
        token.last_scanned_at = timezone.now()
        token.save()

        # Log redemption
        FoodRedemptionLog.objects.create(
            token=token,
            scanned_by=user,
            status='Success'
        )

        user_display = f"{token.user.first_name} {token.user.last_name}".strip() or token.user.username
        
        log_activity(
            user,
            f"Redeemed food coupon for {user_display}",
            hackathon=token.hackathon,
            details=f"Redeemed meal '{token.food_coupon.name}' for user {user_display}"
        )

        return Response({
            "detail": f"Successfully redeemed meal '{token.food_coupon.name}' for {user_display}!",
            "user_name": user_display,
            "meal_name": token.food_coupon.name,
            "remaining": token.total_coupons - token.used_coupons,
            "token": self.get_serializer(token).data
        }, status=status.HTTP_200_OK)


