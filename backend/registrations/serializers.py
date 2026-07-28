from rest_framework import serializers
from django.utils import timezone
from users.models import CustomUser
from hackathons.models import Hackathon
from registrations.models import Registration
from memberships.serializers import UserMinSerializer, HackathonMinSerializer

class RegistrationSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)
    hackathon_details = HackathonMinSerializer(source='hackathon', read_only=True)

    class Meta:
        model = Registration
        fields = (
            'id', 'hackathon', 'hackathon_details', 'user', 'user_details', 
            'status', 'registered_at', 'checked_in', 'checked_in_at', 'qr_code_uuid'
        )
        read_only_fields = ('id', 'user', 'status', 'registered_at', 'checked_in', 'checked_in_at', 'qr_code_uuid')

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
