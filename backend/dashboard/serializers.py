from rest_framework import serializers
from dashboard.models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    hackathon_title = serializers.ReadOnlyField(source='hackathon.title')

    class Meta:
        model = ActivityLog
        fields = ('id', 'user', 'user_username', 'action', 'hackathon', 'hackathon_title', 'details', 'timestamp')
        read_only_fields = ('id', 'timestamp')
