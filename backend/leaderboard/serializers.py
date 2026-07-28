from rest_framework import serializers
from leaderboard.models import Score
from memberships.models import HackathonMember

class ScoreSerializer(serializers.ModelSerializer):
    judge_username = serializers.ReadOnlyField(source='judge.username')
    team_name = serializers.ReadOnlyField(source='team.name')
    total_score = serializers.ReadOnlyField()

    class Meta:
        model = Score
        fields = (
            'id', 'hackathon', 'team', 'team_name', 'judge', 'judge_username',
            'design_score', 'execution_score', 'innovation_score', 'presentation_score',
            'feedback', 'submitted_at', 'total_score'
        )
        read_only_fields = ('id', 'judge', 'submitted_at', 'total_score')

    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request else None
        hackathon = data.get('hackathon')
        team = data.get('team')

        if not user:
            return data

        # Check if judge role exists in this hackathon
        is_judge = HackathonMember.objects.filter(
            hackathon=hackathon,
            user=user,
            role='Judge',
            invitation_status='Accepted'
        ).exists()
        if not is_judge and not user.is_superuser:
            raise serializers.ValidationError({"detail": "Only active Judges can submit scores for this hackathon."})

        # Check if team belongs to the hackathon
        if team.hackathon != hackathon:
            raise serializers.ValidationError({"team": "This team is not registered in this hackathon."})

        # Validate range (e.g. 0-100 or 0-10. Let's enforce 0 to 10 for each criteria)
        for field in ['design_score', 'execution_score', 'innovation_score', 'presentation_score']:
            val = data.get(field, 0)
            if val < 0 or val > 10:
                raise serializers.ValidationError({field: "Score must be between 0 and 10."})

        # Check if score already submitted by this judge for this team
        if Score.objects.filter(team=team, judge=user).exists() and not self.instance:
            raise serializers.ValidationError({"detail": "You have already submitted a score for this team. Update the existing score instead."})

        return data
