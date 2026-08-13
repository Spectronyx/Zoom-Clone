"""REST API views for meeting and auth endpoints.

Supports optional JWT auth while preserving default-user fallback for anonymous visitors.
"""

import random
import secrets
from datetime import datetime, timezone, timedelta
import jwt
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import User, Meeting, MeetingInstance, Participant, MeetingType, MeetingStatus
from .serializers import (
    UserSerializer, MeetingSerializer, MeetingValidationSerializer,
    ScheduleMeetingSerializer, JoinMeetingSerializer, JoinMeetingResponseSerializer,
    LeaveMeetingSerializer, RecentMeetingSerializer, UpcomingMeetingGroupSerializer,
    SignupSerializer, LoginSerializer,
)

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'meetclone-jwt-secret-key-2026')


# ─── Helpers ────────────────────────────────────────────────────────────────────

def generate_meeting_code() -> str:
    """Generate a Zoom-style meeting code like '832 1049 5721'."""
    p1 = str(random.randint(100, 999))
    p2 = str(random.randint(1000, 9999))
    p3 = str(random.randint(1000, 9999))
    return f"{p1} {p2} {p3}"


def get_default_user() -> User:
    """Get the seeded default user (Rajneesh Sharma) — simulates authentication baseline."""
    user = User.objects.filter(email="rajneesh@meetclone.dev").first()
    if not user:
        user = User.objects.order_by('created_at').first()
    if not user:
        # Auto create default user if missing
        user = User.objects.create(
            name="Rajneesh Sharma",
            email="rajneesh@meetclone.dev",
            avatar_color="#2D8CFF"
        )
    return user


def get_request_user(request) -> User:
    """Retrieve user from JWT Authorization header, or fallback to default user."""
    auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = payload.get('user_id')
            user = User.objects.filter(id=user_id).first()
            if user:
                return user
        except Exception:
            pass
    return get_default_user()


def generate_jwt_token(user: User) -> str:
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'name': user.name,
        'exp': datetime.now(timezone.utc) + timedelta(days=1),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def find_meeting_by_code(meeting_code: str):
    """Look up a meeting by its human-readable code (with or without spaces)."""
    meeting = Meeting.objects.filter(meeting_code=meeting_code).first()
    if meeting:
        return meeting

    cleaned = meeting_code.replace(" ", "").replace("-", "")

    if len(cleaned) == 11:
        formatted = f"{cleaned[:3]} {cleaned[3:7]} {cleaned[7:]}"
        meeting = Meeting.objects.filter(meeting_code=formatted).first()
        if meeting:
            return meeting

    return Meeting.objects.filter(meeting_code__icontains=cleaned).first()


# ─── Auth Endpoints ─────────────────────────────────────────────────────────────

@api_view(['POST'])
def signup_view(request):
    """Sign up a new user."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if User.objects.filter(email=data['email']).exists():
        return Response(
            {"detail": "Email already registered"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create(
        name=data['name'],
        email=data['email'],
        password_hash=make_password(data['password']),
        avatar_color="#2D8CFF",
    )
    token = generate_jwt_token(user)
    return Response({
        "token": token,
        "user": UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    """Authenticate existing user with email and password."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = User.objects.filter(email=data['email']).first()
    if not user or not user.password_hash or not check_password(data['password'], user.password_hash):
        return Response(
            {"detail": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token = generate_jwt_token(user)
    return Response({
        "token": token,
        "user": UserSerializer(user).data,
    })


@api_view(['GET'])
def auth_me_view(request):
    """Return currently authenticated user from JWT token (or default user)."""
    user = get_request_user(request)
    return Response(UserSerializer(user).data)


# ─── Meeting Endpoints ──────────────────────────────────────────────────────────

@api_view(['GET'])
def get_current_user(request):
    """Get the active user (JWT or default fallback)."""
    user = get_request_user(request)
    return Response(UserSerializer(user).data)


@api_view(['POST'])
def instant_meeting(request):
    """Create and start an instant meeting."""
    user = get_request_user(request)
    code = generate_meeting_code()
    link = f"http://localhost:3000/meeting/{code.replace(' ', '')}"

    meeting = Meeting.objects.create(
        meeting_code=code,
        host=user,
        topic=f"{user.name}'s Meeting",
        meeting_type=MeetingType.INSTANT,
        invite_link=link,
        status=MeetingStatus.LIVE,
    )

    return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def schedule_meeting(request):
    """Schedule a meeting for a future date/time."""
    serializer = ScheduleMeetingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = get_request_user(request)
    start_at = data['scheduled_start_at']

    # Check if a meeting with the exact same host and start date/time already exists
    existing = Meeting.objects.filter(
        host=user,
        scheduled_start_at=start_at,
        status=MeetingStatus.SCHEDULED,
    ).first()

    if existing:
        return Response(
            {"detail": "A meeting is already scheduled at this exact date and time."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    code = generate_meeting_code()
    link = f"http://localhost:3000/meeting/{code.replace(' ', '')}"

    meeting = Meeting.objects.create(
        meeting_code=code,
        host=user,
        topic=data.get('topic') or f"{user.name}'s Meeting",
        description=data.get('description'),
        meeting_type=MeetingType.SCHEDULED,
        scheduled_start_at=data['scheduled_start_at'],
        duration_minutes=data.get('duration_minutes', 60),
        invite_link=link,
        passcode=str(random.randint(100000, 999999)),
        status=MeetingStatus.SCHEDULED,
    )

    return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def upcoming_meetings(request):
    """List scheduled meetings, grouped by date."""
    now = datetime.now(timezone.utc)
    user = get_request_user(request)

    queryset = Meeting.objects.filter(
        host=user,
        meeting_type=MeetingType.SCHEDULED,
        status=MeetingStatus.SCHEDULED,
        scheduled_start_at__gte=now,
    ).order_by('scheduled_start_at')

    today_str = now.strftime('%Y-%m-%d')
    tomorrow_str = (now + timedelta(days=1)).strftime('%Y-%m-%d')

    groups_map = {}
    for meeting in queryset:
        if not meeting.scheduled_start_at:
            continue
        date_str = meeting.scheduled_start_at.strftime('%Y-%m-%d')
        if date_str == today_str:
            label = "Today"
        elif date_str == tomorrow_str:
            label = "Tomorrow"
        else:
            label = meeting.scheduled_start_at.strftime('%A, %b %d')

        if date_str not in groups_map:
            groups_map[date_str] = {"date": date_str, "label": label, "meetings": []}
        groups_map[date_str]["meetings"].append(meeting)

    result = list(groups_map.values())
    return Response(UpcomingMeetingGroupSerializer(result, many=True).data)


@api_view(['GET'])
def recent_meetings(request):
    """List past meeting instances."""
    instances = MeetingInstance.objects.filter(
        ended_at__isnull=False
    ).select_related('meeting').order_by('-ended_at')[:10]

    result = []
    for inst in instances:
        m = inst.meeting
        result.append({
            'instance_id': str(inst.id),
            'meeting_id': str(m.id),
            'meeting_code': m.meeting_code,
            'topic': m.topic,
            'started_at': inst.started_at,
            'ended_at': inst.ended_at,
            'duration_seconds': inst.duration_seconds,
            'participant_count': inst.participants.count(),
        })

    return Response(RecentMeetingSerializer(result, many=True).data)


@api_view(['GET', 'DELETE'])
def meeting_details(request, meeting_code):
    """Get full details or cancel a meeting by its code."""
    meeting = find_meeting_by_code(meeting_code)
    if not meeting:
        return Response(
            {"detail": "Meeting not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'DELETE':
        if meeting.status in [MeetingStatus.LIVE, MeetingStatus.ENDED, MeetingStatus.CANCELLED]:
            return Response(
                {"detail": "Cannot cancel a meeting in progress, already ended, or cancelled"},
                status=status.HTTP_409_CONFLICT,
            )
        meeting.status = MeetingStatus.CANCELLED
        meeting.save(update_fields=['status'])
        return Response({"success": True, "message": "Meeting cancelled successfully"})

    return Response(MeetingSerializer(meeting).data)


@api_view(['GET'])
def validate_meeting(request, meeting_code):
    """Validate whether a meeting code is valid and joinable."""
    meeting = find_meeting_by_code(meeting_code)

    if not meeting:
        return Response(MeetingValidationSerializer({
            "valid": False,
            "reason": "Invalid meeting ID or the meeting has ended",
            "meeting": None,
        }).data)

    if meeting.is_locked:
        return Response(MeetingValidationSerializer({
            "valid": False,
            "reason": "This meeting has been locked by the host",
            "meeting": None,
        }).data)

    if meeting.status == MeetingStatus.CANCELLED:
        return Response(MeetingValidationSerializer({
            "valid": False,
            "reason": "This meeting has been cancelled",
            "meeting": None,
        }).data)

    if meeting.status == MeetingStatus.ENDED:
        return Response(MeetingValidationSerializer({
            "valid": False,
            "reason": "This meeting has already ended",
            "meeting": None,
        }).data)

    return Response(MeetingValidationSerializer({
        "valid": True,
        "reason": None,
        "meeting": meeting,
    }).data)


@api_view(['POST'])
def join_meeting(request, meeting_code):
    """Join a meeting — creates instance if needed, adds participant."""
    serializer = JoinMeetingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    meeting = find_meeting_by_code(meeting_code)
    if not meeting:
        return Response(
            {"detail": "Invalid meeting ID or the meeting has ended"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if meeting.is_locked:
        return Response(
            {"detail": "This meeting is locked by the host"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if meeting.status in [MeetingStatus.ENDED, MeetingStatus.CANCELLED]:
        return Response(
            {"detail": "This meeting has already ended or been cancelled"},
            status=status.HTTP_410_GONE,
        )

    # Find or create active instance
    instance = meeting.instances.filter(ended_at__isnull=True).first()
    if not instance:
        instance = MeetingInstance.objects.create(meeting=meeting)
        meeting.status = MeetingStatus.LIVE
        meeting.save(update_fields=['status'])

    user = None
    if data.get('user_id'):
        user = User.objects.filter(id=data['user_id']).first()
    if not user:
        user = get_request_user(request)

    is_host = (meeting.host_id == user.id) if user else False

    participant = Participant.objects.create(
        meeting_instance=instance,
        user=user,
        display_name=data['display_name'],
        is_host=is_host,
    )

    return Response(JoinMeetingResponseSerializer({
        "participant_id": participant.id,
        "instance_id": instance.id,
        "meeting": meeting,
        "is_host": is_host,
    }).data)


@api_view(['POST'])
def lock_meeting(request, meeting_code):
    """Toggle lock state of a meeting."""
    meeting = find_meeting_by_code(meeting_code)
    if not meeting:
        return Response({"detail": "Meeting not found"}, status=status.HTTP_404_NOT_FOUND)

    meeting.is_locked = not meeting.is_locked
    meeting.save(update_fields=['is_locked'])

    return Response({
        "success": True,
        "is_locked": meeting.is_locked,
        "message": "Meeting locked" if meeting.is_locked else "Meeting unlocked"
    })


@api_view(['POST'])
def leave_meeting(request, meeting_code):
    """Leave a meeting — marks participant left, ends instance if empty."""
    serializer = LeaveMeetingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    participant_id = serializer.validated_data['participant_id']

    meeting = find_meeting_by_code(meeting_code)
    if not meeting:
        return Response(
            {"detail": "Meeting not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        participant = Participant.objects.get(id=participant_id)
    except Participant.DoesNotExist:
        return Response(
            {"detail": "Participant not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = datetime.now(timezone.utc)
    participant.left_at = now
    participant.save(update_fields=['left_at'])

    instance = participant.meeting_instance
    remaining = instance.participants.filter(left_at__isnull=True).count()

    if remaining == 0:
        instance.ended_at = now
        instance.duration_seconds = int((now - instance.started_at).total_seconds())
        instance.save(update_fields=['ended_at', 'duration_seconds'])

        meeting.status = MeetingStatus.ENDED
        meeting.save(update_fields=['status'])

    return Response({"success": True, "message": "Left the meeting"})


@api_view(['DELETE'])
def cancel_meeting(request, meeting_code):
    """Cancel a scheduled meeting."""
    meeting = find_meeting_by_code(meeting_code)
    if not meeting:
        return Response(
            {"detail": "Meeting not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if meeting.status in [MeetingStatus.LIVE, MeetingStatus.ENDED, MeetingStatus.CANCELLED]:
        return Response(
            {"detail": "Cannot cancel a meeting in progress, already ended, or cancelled"},
            status=status.HTTP_409_CONFLICT,
        )

    meeting.status = MeetingStatus.CANCELLED
    meeting.save(update_fields=['status'])
    return Response({"success": True, "message": "Meeting cancelled successfully"})
