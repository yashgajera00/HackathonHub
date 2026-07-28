from rest_framework import serializers
from django.conf import settings
from users.models import CustomUser
from hackathons.models import Hackathon
from teams.models import Team, TeamMember, TeamInvitation
from memberships.serializers import UserMinSerializer

class TeamMemberSerializer(serializers.ModelSerializer):
    user_details = UserMinSerializer(source='user', read_only=True)

    class Meta:
        model = TeamMember
        fields = ('id', 'team', 'user', 'user_details', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')

class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    is_leader = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = (
            'id', 'hackathon', 'name', 'project_title', 'project_description', 
            'project_submission_link', 'created_by', 'created_by_username', 
            'created_at', 'updated_at', 'members', 'is_leader'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at', 'members', 'is_leader')

    def get_is_leader(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.created_by == request.user
        return False

    def validate(self, data):
        hackathon = data.get('hackathon')
        request = self.context.get('request')
        user = request.user if request else None

        if not user:
            return data

        # Check if user is already in a team for this hackathon
        if TeamMember.objects.filter(hackathon=hackathon, user=user).exists():
            raise serializers.ValidationError({"detail": "You are already a member of a team in this hackathon."})

        # Check if team name is unique in this hackathon
        name = data.get('name')
        if Team.objects.filter(hackathon=hackathon, name__iexact=name).exists():
            raise serializers.ValidationError({"name": "A team with this name already exists in this hackathon."})

        return data

class TeamInvitationSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')
    invitee_details = UserMinSerializer(source='invitee', read_only=True)
    invitee_username = serializers.CharField(write_only=True, required=False)
    invitee = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), required=False)

    class Meta:
        model = TeamInvitation
        fields = ('id', 'team', 'team_name', 'invitee', 'invitee_username', 'invitee_details', 'status', 'invited_at')
        read_only_fields = ('id', 'status', 'invited_at')

    def validate(self, data):
        team = data.get('team')
        invitee_username = data.pop('invitee_username', None)
        invitee = data.get('invitee')

        if invitee_username:
            try:
                invitee_obj = CustomUser.objects.get(username=invitee_username)
                data['invitee'] = invitee_obj
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({"invitee_username": "User with this username does not exist."})
        elif not invitee:
            raise serializers.ValidationError({"invitee": "Either invitee ID or username is required."})

        invitee = data.get('invitee')
        # Check if invitee is already in a team in this hackathon
        if TeamMember.objects.filter(hackathon=team.hackathon, user=invitee).exists():
            raise serializers.ValidationError({"invitee_username": "This user is already in a team for this hackathon."})

        # Check if already invited
        if TeamInvitation.objects.filter(team=team, invitee=invitee, status='Pending').exists():
            raise serializers.ValidationError({"invitee_username": "An invitation to this user is already pending."})

        return data

