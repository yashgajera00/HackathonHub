from rest_framework import serializers
from django.utils.text import slugify
from hackathons.models import Hackathon

class HackathonSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    role = serializers.SerializerMethodField(read_only=True) # User's role in this hackathon
    active_team_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Hackathon
        fields = (
            'id', 'title', 'slug', 'description', 'banner', 'logo',
            'start_date', 'end_date', 'registration_start', 'registration_end',
            'venue', 'city', 'state', 'country', 'max_team_size', 'min_team_size',
            'status', 'created_by', 'created_by_username', 'created_at', 'updated_at', 'role',
            'active_team_status'
        )
        read_only_fields = ('id', 'slug', 'created_by', 'created_at', 'updated_at', 'role', 'active_team_status')

    def get_role(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user.is_superuser:
                return 'Organizer' # Platform owner acts as Organizer/Owner
            member = obj.memberships.filter(user=request.user, invitation_status='Accepted').first()
            if member:
                return member.role
        return None

    def get_active_team_status(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            from teams.models import TeamMember
            team_member = TeamMember.objects.filter(hackathon=obj, user=request.user).first()
            if team_member:
                return team_member.team.status
        return None

    def validate(self, data):
        start_date = data.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = data.get('end_date') or (self.instance.end_date if self.instance else None)
        reg_start = data.get('registration_start') or (self.instance.registration_start if self.instance else None)
        reg_end = data.get('registration_end') or (self.instance.registration_end if self.instance else None)

        if reg_start and reg_end and reg_start >= reg_end:
            raise serializers.ValidationError({"registration_start": "Registration start date must be before registration end date."})

        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({"start_date": "Hackathon start date must be before end date."})

        if reg_end and start_date and reg_end > start_date:
            raise serializers.ValidationError({"registration_end": "Registration end date must not be after hackathon start date."})

        return data

    def create(self, validated_data):
        if 'slug' not in validated_data or not validated_data['slug']:
            title = validated_data.get('title', '')
            slug = slugify(title)
            # Ensure unique slug
            unique_slug = slug
            num = 1
            while Hackathon.objects.filter(slug=unique_slug).exists():
                unique_slug = f"{slug}-{num}"
                num += 1
            validated_data['slug'] = unique_slug
        return super().create(validated_data)
