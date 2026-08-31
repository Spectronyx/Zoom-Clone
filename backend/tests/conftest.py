import pytest
from rest_framework.test import APIClient
from meetings.models import User, Meeting, MeetingType, MeetingStatus

@pytest.fixture
def client():
    """Returns DRF APIClient for endpoint testing."""
    return APIClient()

@pytest.fixture
def db_session(db):
    """Enables django database access for tests."""
    return db

@pytest.fixture
def seeded_user(db):
    """Factory fixture for a seeded user directly via ORM."""
    user, _ = User.objects.get_or_create(
        email="rajneesh@meetclone.dev",
        defaults={
            "name": "Rajneesh Sharma",
            "avatar_color": "#2D8CFF"
        }
    )
    return user

@pytest.fixture
def seeded_meeting(seeded_user):
    """Factory fixture for a seeded meeting directly via ORM."""
    return Meeting.objects.create(
        meeting_code="123 4567 8901",
        host=seeded_user,
        topic="Test Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.LIVE,
        invite_link="http://localhost:3000/meeting/12345678901"
    )
