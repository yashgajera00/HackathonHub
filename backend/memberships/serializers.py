from rest_framework import serializers
from users.models import CustomUser
from hackathons.models import Hackathon
from memberships.models import HackathonMember

class UserMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar')

class HackathonMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hackathon
        fields = ('id', 'title', 'slug', 'status', 'start_date', 'end_date', 'venue', 'logo')

class HackathonMemberSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)
    hackathon_details = HackathonMinSerializer(source='hackathon', read_only=True)
    invited_by_username = serializers.ReadOnlyField(source='invited_by.username')
    email = serializers.EmailField(write_only=True, required=False)
    user = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), required=False, default=None)

    class Meta:
        model = HackathonMember
        fields = (
            'id', 'hackathon', 'hackathon_details', 'user', 'user_details', 'email',
            'role', 'joined_at', 'invited_by', 'invited_by_username', 'invitation_status'
        )
        read_only_fields = ('id', 'joined_at', 'invited_by', 'invitation_status')

    def validate(self, data):
        email = data.pop('email', None)
        user = data.get('user')
        hackathon = data.get('hackathon')

        if email:
            try:
                user_obj = CustomUser.objects.get(email=email)
                data['user'] = user_obj
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({"email": "No user found with this email address."})
        elif not user:
            raise serializers.ValidationError({"user": "Either user ID or email is required."})

        # Check if already a member
        user = data.get('user')
        if HackathonMember.objects.filter(hackathon=hackathon, user=user).exists():
            raise serializers.ValidationError({"email": "This user is already a member of this hackathon."})
            
        return data

