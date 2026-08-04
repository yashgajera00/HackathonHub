from rest_framework import serializers
from django.utils import timezone
from users.models import CustomUser
from hackathons.models import Hackathon
from registrations.models import Registration, FoodCoupon, UserFoodToken, FoodRedemptionLog
from memberships.serializers import UserMinSerializer, HackathonMinSerializer

class RegistrationSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)
    hackathon_details = HackathonMinSerializer(source='hackathon', read_only=True)

    team_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Registration
        fields = (
            'id', 'hackathon', 'hackathon_details', 'user', 'user_details', 
            'status', 'registered_at', 'checked_in', 'checked_in_at', 'qr_code_uuid',
            'team_name'
        )
        read_only_fields = ('id', 'user', 'status', 'registered_at', 'checked_in', 'checked_in_at', 'qr_code_uuid')

    def get_team_name(self, obj):
        from teams.models import TeamMember
        member = TeamMember.objects.filter(hackathon=obj.hackathon, user=obj.user).first()
        if member:
            return member.team.name
        return None

    def validate(self, data):
        hackathon = data.get('hackathon')
        request = self.context.get('request')
        user = request.user if request else None

        if not user:
            return data

        # Check if user already registered
        if Registration.objects.filter(hackathon=hackathon, user=user).exists():
            raise serializers.ValidationError({"detail": "You have already registered for this hackathon."})

        # Check if registration is open
        now = timezone.now()
        if hackathon.registration_start and now < hackathon.registration_start:
            raise serializers.ValidationError({"detail": "Registration has not started yet."})
        if hackathon.registration_end and now > hackathon.registration_end:
            raise serializers.ValidationError({"detail": "Registration has closed."})

        # Check status of hackathon (must be 'Registration Open' or 'Published')
        if hackathon.status not in ['Published', 'Registration Open']:
            raise serializers.ValidationError({"detail": "Registration is not open for this hackathon status."})

        return data


class FoodCouponSerializer(serializers.ModelSerializer):
    total_issued = serializers.SerializerMethodField(read_only=True)
    total_redeemed = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FoodCoupon
        fields = '__all__'

    def get_total_issued(self, obj):
        return sum(token.total_coupons for token in obj.user_tokens.all())

    def get_total_redeemed(self, obj):
        return sum(token.used_coupons for token in obj.user_tokens.all())


class FoodRedemptionLogSerializer(serializers.ModelSerializer):
    scanned_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FoodRedemptionLog
        fields = '__all__'

    def get_scanned_by_name(self, obj):
        if obj.scanned_by:
            name = f"{obj.scanned_by.first_name} {obj.scanned_by.last_name}".strip()
            return name or obj.scanned_by.username
        return "System"


class UserFoodTokenSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)
    food_coupon_details = FoodCouponSerializer(source='food_coupon', read_only=True)
    redemption_logs = FoodRedemptionLogSerializer(many=True, read_only=True)
    remaining_coupons = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserFoodToken
        fields = '__all__'

    def get_remaining_coupons(self, obj):
        return max(0, obj.total_coupons - obj.used_coupons)

