"""DRF serializers for all API request/response payloads."""

from datetime import datetime, timezone
from rest_framework import serializers
from .models import User, Meeting, MeetingInstance, Participant, ChatMessage


# ─── Auth ────────────────────────────────────────────────────────────────────────

class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


# ─── User ────────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'avatar_color', 'created_at']


# ─── Meeting ─────────────────────────────────────────────────────────────────────

class MeetingSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'meeting_code', 'host_id', 'topic', 'description',
            'meeting_type', 'scheduled_start_at', 'duration_minutes',
            'invite_link', 'passcode', 'is_locked', 'waiting_room_enabled', 'status', 'created_at', 'host',
        ]


class ScheduleMeetingSerializer(serializers.Serializer):
    topic = serializers.CharField(max_length=500, default="Rajneesh Sharma's Meeting")
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    scheduled_start_at = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField(default=60, min_value=15, max_value=480)

    def validate_scheduled_start_at(self, value):
        if value < datetime.now(timezone.utc):
            raise serializers.ValidationError("scheduled_start_at must be in the future")
        return value


# ─── Meeting Validation ─────────────────────────────────────────────────────────

class MeetingValidationSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    reason = serializers.CharField(allow_null=True, required=False)
    meeting = MeetingSerializer(allow_null=True, required=False)


# ─── Meeting Instance ────────────────────────────────────────────────────────────

class MeetingInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingInstance
        fields = ['id', 'meeting_id', 'started_at', 'ended_at', 'duration_seconds']


# ─── Join / Leave / Actions ──────────────────────────────────────────────────────

class JoinMeetingSerializer(serializers.Serializer):
    display_name = serializers.CharField(max_length=255)
    user_id = serializers.UUIDField(required=False, allow_null=True)


class JoinMeetingResponseSerializer(serializers.Serializer):
    participant_id = serializers.CharField()
    instance_id = serializers.CharField()
    meeting = MeetingSerializer()
    is_host = serializers.BooleanField()


class LeaveMeetingSerializer(serializers.Serializer):
    participant_id = serializers.CharField()


class RecentMeetingSerializer(serializers.Serializer):
    instance_id = serializers.CharField()
    meeting_id = serializers.CharField()
    meeting_code = serializers.CharField()
    topic = serializers.CharField()
    started_at = serializers.DateTimeField()
    ended_at = serializers.DateTimeField(allow_null=True)
    duration_seconds = serializers.IntegerField(allow_null=True)
    participant_count = serializers.IntegerField()


class UpcomingMeetingGroupSerializer(serializers.Serializer):
    date = serializers.CharField()
    label = serializers.CharField()
    meetings = MeetingSerializer(many=True)
