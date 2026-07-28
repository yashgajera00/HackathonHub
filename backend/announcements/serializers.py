from rest_framework import serializers
from announcements.models import Announcement, Rule, ScheduleItem

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = Announcement
        fields = ('id', 'hackathon', 'title', 'content', 'created_by', 'created_by_username', 'created_at')
        read_only_fields = ('id', 'created_by', 'created_at')

class RuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rule
        fields = ('id', 'hackathon', 'title', 'content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class ScheduleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleItem
        fields = ('id', 'hackathon', 'title', 'description', 'start_time', 'end_time', 'venue')
        read_only_fields = ('id',)
