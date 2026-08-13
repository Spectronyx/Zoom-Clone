"""Management command to seed the database with initial development data.

Creates:
- 1 default user (Rajneesh Sharma)
- 4 guest users
- 3 upcoming scheduled meetings (future dates)
- 4 past meeting instances with participants and chat messages

Usage: python manage.py seed
"""

import random
import secrets
from datetime import datetime, timezone, timedelta

from django.core.management.base import BaseCommand
from meetings.models import (
    User, Meeting, MeetingInstance, Participant, ChatMessage,
    MeetingType, MeetingStatus,
)


def generate_meeting_code() -> str:
    p1 = str(random.randint(100, 999))
    p2 = str(random.randint(1000, 9999))
    p3 = str(random.randint(1000, 9999))
    return f"{p1} {p2} {p3}"


class Command(BaseCommand):
    help = 'Seed the database with demo data for development'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('Database already seeded. Skipping.'))
            return

        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # ─── Default User ──────────────────────────────────────────────
        default_user = User.objects.create(
            name="Rajneesh Sharma",
            email="rajneesh@meetclone.dev",
            avatar_color="#2D8CFF",
        )

        # ─── Guest Users ───────────────────────────────────────────────
        guests = [
            User.objects.create(name="Ananya Patel", email="ananya@example.com", avatar_color="#F9634A"),
            User.objects.create(name="Marcus Chen", email="marcus@example.com", avatar_color="#00A85F"),
            User.objects.create(name="Sarah Johnson", email="sarah@example.com", avatar_color="#9B59B6"),
            User.objects.create(name="Dev Kumar", email="dev@example.com", avatar_color="#E67E22"),
        ]

        # ─── Upcoming Scheduled Meetings ───────────────────────────────
        upcoming_data = [
            {
                "topic": "Sprint Planning - Week 33",
                "description": "Review sprint backlog and assign stories for the upcoming week.",
                "offset": timedelta(hours=20),
                "duration": 60,
            },
            {
                "topic": "Design Review: Dashboard Redesign",
                "description": "Walk through the new dashboard mockups with the design team.",
                "offset": timedelta(days=1, hours=14, minutes=30),
                "duration": 45,
            },
            {
                "topic": "1:1 with Dev Kumar",
                "description": "Weekly sync to discuss project progress and blockers.",
                "offset": timedelta(days=2, hours=10),
                "duration": 30,
            },
        ]

        for item in upcoming_data:
            code = generate_meeting_code()
            Meeting.objects.create(
                meeting_code=code,
                host=default_user,
                topic=item["topic"],
                description=item["description"],
                meeting_type=MeetingType.SCHEDULED,
                scheduled_start_at=today + item["offset"],
                duration_minutes=item["duration"],
                invite_link=f"http://localhost:3000/meeting/{code.replace(' ', '')}",
                passcode=secrets.token_hex(3).upper()[:6],
                status=MeetingStatus.SCHEDULED,
            )

        # ─── Past Meetings ─────────────────────────────────────────────
        past_data = [
            {
                "topic": "Team Standup",
                "hours_ago": 72,
                "duration_secs": 1800,
                "participants": [default_user, guests[0], guests[1]],
                "messages": [
                    (0, "Good morning team!"),
                    (1, "Morning! Quick update - PR is ready for review."),
                    (2, "I'll take a look after standup."),
                ],
            },
            {
                "topic": "Product Roadmap Discussion",
                "hours_ago": 48,
                "duration_secs": 3600,
                "participants": [default_user, guests[0], guests[2], guests[3]],
                "messages": [
                    (0, "Let's start with Q3 priorities."),
                    (2, "I have the analytics data ready to share."),
                    (3, "Can we discuss the API redesign first?"),
                    (0, "Sure, let's bump that up."),
                ],
            },
            {
                "topic": "Code Review Session",
                "hours_ago": 24,
                "duration_secs": 2700,
                "participants": [default_user, guests[1]],
                "messages": [
                    (1, "Line 42 has a potential memory leak."),
                    (0, "Good catch, I'll fix that."),
                ],
            },
            {
                "topic": "Client Demo - MeetClone MVP",
                "hours_ago": 5,
                "duration_secs": 4500,
                "participants": [default_user, guests[0], guests[2], guests[3]],
                "messages": [
                    (0, "Welcome everyone! Let me share my screen."),
                    (2, "The UI looks great!"),
                    (3, "Can we see the WebRTC implementation?"),
                    (0, "Absolutely, switching to the meeting room now."),
                    (2, "Impressive latency numbers!"),
                ],
            },
        ]

        for item in past_data:
            code = generate_meeting_code()
            meeting = Meeting.objects.create(
                meeting_code=code,
                host=default_user,
                topic=item["topic"],
                meeting_type=MeetingType.INSTANT,
                invite_link=f"http://localhost:3000/meeting/{code.replace(' ', '')}",
                status=MeetingStatus.ENDED,
            )

            started = now - timedelta(hours=item["hours_ago"])
            ended = started + timedelta(seconds=item["duration_secs"])

            instance = MeetingInstance.objects.create(
                meeting=meeting,
                started_at=started,
                ended_at=ended,
                duration_seconds=item["duration_secs"],
            )
            # Fix auto_now_add by doing raw update
            MeetingInstance.objects.filter(pk=instance.pk).update(started_at=started)

            participant_records = []
            for i, user in enumerate(item["participants"]):
                p = Participant.objects.create(
                    meeting_instance=instance,
                    user=user,
                    display_name=user.name,
                    is_host=(i == 0),
                    was_muted=random.choice([True, False]),
                )
                # Set realistic join/leave times
                Participant.objects.filter(pk=p.pk).update(
                    joined_at=started + timedelta(seconds=random.randint(0, 60)),
                    left_at=ended - timedelta(seconds=random.randint(0, 30)),
                )
                participant_records.append(p)

            for sender_idx, msg_text in item["messages"]:
                cm = ChatMessage.objects.create(
                    meeting_instance=instance,
                    sender_participant=participant_records[sender_idx],
                    message=msg_text,
                )
                ChatMessage.objects.filter(pk=cm.pk).update(
                    sent_at=started + timedelta(
                        seconds=random.randint(60, item["duration_secs"] - 60)
                    )
                )

        self.stdout.write(self.style.SUCCESS(
            f'✅ Database seeded successfully!\n'
            f'   Default user: {default_user.name} (ID: {default_user.id})\n'
            f'   {len(upcoming_data)} upcoming meetings\n'
            f'   {len(past_data)} past meeting instances'
        ))
