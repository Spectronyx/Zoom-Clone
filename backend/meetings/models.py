"""Django ORM models for the MeetClone application.

Schema design rationale:
─────────────────────────
• `User` — Auth-ready user table. Even without a login flow, we track host identity
  so meetings have ownership and the schema is ready for JWT auth later.

• `Meeting` — The *definition* of a meeting: its topic, code, schedule, etc.
  This is the reusable identity of a room that can be started multiple times.

• `MeetingInstance` — An actual *occurrence* of a meeting being run. Separating this
  from `Meeting` lets us cleanly derive "upcoming" (scheduled meetings with no instance)
  vs "recent" (past instances with duration) without hacking a single flat table.

• `Participant` — Who joined which instance, when they joined/left, and their role.
  Supports both registered users (`user` FK) and guests (`display_name` only).

• `ChatMessage` — Persisted per-instance chat, linked to the sending participant.
"""

import uuid
from django.db import models


class MeetingType(models.TextChoices):
    INSTANT = 'instant', 'Instant'
    SCHEDULED = 'scheduled', 'Scheduled'


class MeetingStatus(models.TextChoices):
    SCHEDULED = 'scheduled', 'Scheduled'
    LIVE = 'live', 'Live'
    ENDED = 'ended', 'Ended'
    CANCELLED = 'cancelled', 'Cancelled'


class User(models.Model):
    """Application user (supports guest & registered auth)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, null=True, blank=True)
    password_hash = models.CharField(max_length=255, null=True, blank=True)
    avatar_color = models.CharField(max_length=7, default='#2D8CFF')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.name


class Meeting(models.Model):
    """The definition / identity of a meeting room."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting_code = models.CharField(max_length=14, unique=True, db_index=True)
    host = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='hosted_meetings'
    )
    topic = models.CharField(max_length=500, default="Rajneesh Sharma's Meeting")
    description = models.TextField(null=True, blank=True)
    meeting_type = models.CharField(
        max_length=10, choices=MeetingType.choices, default=MeetingType.INSTANT
    )
    scheduled_start_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    invite_link = models.CharField(max_length=500, unique=True)
    passcode = models.CharField(max_length=10, null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    status = models.CharField(
        max_length=10, choices=MeetingStatus.choices, default=MeetingStatus.SCHEDULED,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'meetings'
        indexes = [
            models.Index(fields=['host']),
        ]

    def __str__(self):
        return f"{self.topic} ({self.meeting_code})"


class MeetingInstance(models.Model):
    """An actual occurrence / session of a meeting being run."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.ForeignKey(
        Meeting, on_delete=models.CASCADE, related_name='instances'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'meeting_instances'
        ordering = ['-started_at']

    def __str__(self):
        return f"Instance of {self.meeting.topic} ({self.started_at})"


class Participant(models.Model):
    """A user who joined a specific meeting instance."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting_instance = models.ForeignKey(
        MeetingInstance, on_delete=models.CASCADE, related_name='participants'
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='participations'
    )
    display_name = models.CharField(max_length=255)
    is_host = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    was_muted = models.BooleanField(default=True)

    class Meta:
        db_table = 'participants'

    def __str__(self):
        return f"{self.display_name} in {self.meeting_instance}"


class ChatMessage(models.Model):
    """A chat message sent during a meeting instance."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting_instance = models.ForeignKey(
        MeetingInstance, on_delete=models.CASCADE, related_name='chat_messages'
    )
    sender_participant = models.ForeignKey(
        Participant, on_delete=models.CASCADE, related_name='sent_messages'
    )
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['sent_at']

    def __str__(self):
        return f"{self.sender_participant.display_name}: {self.message[:50]}"
