from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, F
from leaderboard.models import Score
from leaderboard.serializers import ScoreSerializer
from teams.models import Team
from common.permissions import IsHackathonJudge, IsHackathonOrganizer
from memberships.models import HackathonMember
from dashboard.models import log_activity

class ScoreViewSet(viewsets.ModelViewSet):
    queryset = Score.objects.all().order_by('-submitted_at')
    serializer_class = ScoreSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHackathonJudge()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Score.objects.none()

        hackathon_id = self.request.query_params.get('hackathon_id') or self.request.headers.get('X-Hackathon-Id')
        if hackathon_id:
            # Organizers/Volunteers see all scores for this hackathon
            is_staff = HackathonMember.objects.filter(
                hackathon_id=hackathon_id,
                user=user,
                role__in=['Organizer', 'Volunteer'],
                invitation_status='Accepted'
            ).exists()
            if is_staff or user.is_superuser:
                return Score.objects.filter(hackathon_id=hackathon_id)

            # Judges see their own submitted scores for this hackathon
            return Score.objects.filter(hackathon_id=hackathon_id, judge=user)

        # By default, list judge's own scores
        return Score.objects.filter(judge=user)

    def perform_create(self, serializer):
        score = serializer.save(judge=self.request.user)
        log_activity(
            self.request.user,
            f"Submitted score for team {score.team.name}",
            hackathon=score.hackathon,
            details=f"Judge submitted score (Total: {score.total_score}) for team {score.team.name}"
        )


class LeaderboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """
        GET ranked list of teams for a specific hackathon.
        Ex: /api/leaderboard/?hackathon_id=1
        """
        hackathon_id = request.query_params.get('hackathon_id') or request.headers.get('X-Hackathon-Id')
        if not hackathon_id:
            return Response({"detail": "hackathon_id is required in query params or headers."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch teams in hackathon, aggregate scores
        # We aggregate average design, execution, innovation, presentation scores
        teams = Team.objects.filter(hackathon_id=hackathon_id).annotate(
            avg_design=Avg('scores__design_score'),
            avg_execution=Avg('scores__execution_score'),
            avg_innovation=Avg('scores__innovation_score'),
            avg_presentation=Avg('scores__presentation_score')
        )

        leaderboard_data = []
        for team in teams:
            # Overall score is sum of averages (or average of sums, they are equivalent under weighting)
            # Let's compute average total score
            scores_list = team.scores.all()
            total_count = scores_list.count()
            
            if total_count > 0:
                avg_total = sum(s.total_score for s in scores_list) / total_count
            else:
                avg_total = 0.0

            # Get member usernames
            member_names = [m.user.username for m in team.members.all()]

            leaderboard_data.append({
                'team_id': team.id,
                'team_name': team.name,
                'project_title': team.project_title or 'No submission yet',
                'project_link': team.project_submission_link,
                'members': member_names,
                'avg_design': round(team.avg_design or 0.0, 2),
                'avg_execution': round(team.avg_execution or 0.0, 2),
                'avg_innovation': round(team.avg_innovation or 0.0, 2),
                'avg_presentation': round(team.avg_presentation or 0.0, 2),
                'avg_total': round(avg_total, 2),
                'scores_submitted': total_count
            })

        # Sort by total average descending
        leaderboard_data = sorted(leaderboard_data, key=lambda x: x['avg_total'], reverse=True)

        # Add ranks
        for index, entry in enumerate(leaderboard_data):
            entry['rank'] = index + 1

        return Response(leaderboard_data)

