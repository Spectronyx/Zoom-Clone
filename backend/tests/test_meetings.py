from datetime import datetime, timezone, timedelta
import pytest
from meetings.models import Meeting, MeetingInstance, Participant, MeetingType, MeetingStatus

@pytest.mark.django_db
def test_create_instant_meeting(client, seeded_user):
    res = client.post('/api/meetings/instant')
    assert res.status_code == 201
    data = res.json()
    assert 'meeting_code' in data
    assert 'invite_link' in data
    assert data['status'] == 'live'

@pytest.mark.django_db
def test_create_scheduled_meeting_valid(client, seeded_user):
    future_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    payload = {
        "topic": "Future Sync",
        "scheduled_start_at": future_time,
        "duration_minutes": 45
    }
    res = client.post('/api/meetings/scheduled', data=payload, format='json')
    assert res.status_code == 201
    data = res.json()
    assert data['topic'] == "Future Sync"
    assert data['meeting_type'] == "scheduled"

@pytest.mark.django_db
def test_create_scheduled_meeting_past_date(client, seeded_user):
    past_time = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    payload = {
        "topic": "Past Sync",
        "scheduled_start_at": past_time,
        "duration_minutes": 30
    }
    res = client.post('/api/meetings/scheduled', data=payload, format='json')
    assert res.status_code == 400
    assert "scheduled_start_at" in res.json()

@pytest.mark.django_db
def test_upcoming_meetings(client, seeded_user):
    now = datetime.now(timezone.utc)
    # Future meeting
    m1 = Meeting.objects.create(
        meeting_code="111 2222 3333",
        host=seeded_user,
        topic="Future 1",
        meeting_type=MeetingType.SCHEDULED,
        status=MeetingStatus.SCHEDULED,
        scheduled_start_at=now + timedelta(hours=5),
        invite_link="http://localhost:3000/meeting/11122223333"
    )
    # Past meeting (should not be included)
    m2 = Meeting.objects.create(
        meeting_code="444 5555 6666",
        host=seeded_user,
        topic="Past 1",
        meeting_type=MeetingType.SCHEDULED,
        status=MeetingStatus.SCHEDULED,
        scheduled_start_at=now - timedelta(hours=5),
        invite_link="http://localhost:3000/meeting/44455556666"
    )

    res = client.get('/api/meetings/upcoming')
    assert res.status_code == 200
    groups = res.json()
    all_meeting_ids = [m['id'] for group in groups for m in group['meetings']]
    assert str(m1.id) in all_meeting_ids
    assert str(m2.id) not in all_meeting_ids

@pytest.mark.django_db
def test_recent_meetings(client, seeded_user):
    m = Meeting.objects.create(
        meeting_code="777 8888 9999",
        host=seeded_user,
        topic="Ended Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.ENDED,
        invite_link="http://localhost:3000/meeting/77788889999"
    )
    now = datetime.now(timezone.utc)
    # Completed instance (non-null ended_at)
    inst1 = MeetingInstance.objects.create(
        meeting=m,
        started_at=now - timedelta(minutes=30),
        ended_at=now,
        duration_seconds=1800
    )
    # Ongoing instance (null ended_at)
    inst2 = MeetingInstance.objects.create(
        meeting=m,
        started_at=now
    )

    res = client.get('/api/meetings/recent')
    assert res.status_code == 200
    recent_instances = res.json()
    inst_ids = [item['instance_id'] for item in recent_instances]
    assert str(inst1.id) in inst_ids
    assert str(inst2.id) not in inst_ids

@pytest.mark.django_db
def test_validate_meeting(client, seeded_user):
    # Valid live meeting
    m = Meeting.objects.create(
        meeting_code="100 2000 3000",
        host=seeded_user,
        topic="Live Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.LIVE,
        invite_link="http://localhost:3000/meeting/10020003000"
    )
    res = client.get(f'/api/meetings/{m.meeting_code}/validate')
    assert res.status_code == 200
    assert res.json()['valid'] is True

    # Nonexistent meeting code
    res = client.get('/api/meetings/99999999999/validate')
    assert res.status_code == 200
    assert res.json()['valid'] is False

    # Cancelled meeting
    m.status = MeetingStatus.CANCELLED
    m.save()
    res = client.get(f'/api/meetings/{m.meeting_code}/validate')
    assert res.status_code == 200
    assert res.json()['valid'] is False
    assert res.json()['reason'] is not None

@pytest.mark.django_db
def test_join_meeting_first_and_second_joiner(client, seeded_meeting):
    clean_code = seeded_meeting.meeting_code.replace(" ", "")

    # First joiner (host)
    res1 = client.post(f'/api/meetings/{clean_code}/join', data={"display_name": "Alice Host"}, format='json')
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1['is_host'] is True
    instance_id = data1['instance_id']

    # Second joiner (guest)
    from meetings.models import User
    guest = User.objects.create(name="Bob Guest", email="bob@guest.dev", avatar_color="#00FF00")
    res2 = client.post(f'/api/meetings/{clean_code}/join', data={"display_name": "Bob Guest", "user_id": str(guest.id)}, format='json')
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2['is_host'] is False
    assert data2['instance_id'] == instance_id

@pytest.mark.django_db
def test_join_nonexistent_meeting(client):
    res = client.post('/api/meetings/00000000000/join', data={"display_name": "Charlie"}, format='json')
    assert res.status_code == 404

@pytest.mark.django_db
def test_leave_meeting_lifecycle(client, seeded_meeting):
    clean_code = seeded_meeting.meeting_code.replace(" ", "")

    # Join 2 participants
    res1 = client.post(f'/api/meetings/{clean_code}/join', data={"display_name": "Alice"}, format='json')
    res2 = client.post(f'/api/meetings/{clean_code}/join', data={"display_name": "Bob"}, format='json')

    p1_id = res1.json()['participant_id']
    p2_id = res2.json()['participant_id']
    instance_id = res1.json()['instance_id']

    # Participant 1 leaves (Participant 2 remains)
    client.post(f'/api/meetings/{clean_code}/leave', data={"participant_id": p1_id}, format='json')

    inst = MeetingInstance.objects.get(id=instance_id)
    assert inst.ended_at is None  # Instance stays open

    # Participant 2 leaves (Last participant)
    client.post(f'/api/meetings/{clean_code}/leave', data={"participant_id": p2_id}, format='json')

    inst.refresh_from_db()
    assert inst.ended_at is not None
    assert inst.duration_seconds is not None
    assert inst.duration_seconds >= 0

@pytest.mark.django_db
def test_delete_meeting_cancellation(client, seeded_user):
    now = datetime.now(timezone.utc)
    # Scheduled meeting -> can cancel
    scheduled = Meeting.objects.create(
        meeting_code="500 6000 7000",
        host=seeded_user,
        topic="Scheduled",
        meeting_type=MeetingType.SCHEDULED,
        status=MeetingStatus.SCHEDULED,
        scheduled_start_at=now + timedelta(days=1),
        invite_link="http://localhost:3000/meeting/50060007000"
    )
    res = client.delete(f'/api/meetings/{scheduled.meeting_code}')
    assert res.status_code == 200
    scheduled.refresh_from_db()
    assert scheduled.status == MeetingStatus.CANCELLED

    # Live meeting -> reject with 409
    live = Meeting.objects.create(
        meeting_code="800 9000 1000",
        host=seeded_user,
        topic="Live Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.LIVE,
        invite_link="http://localhost:3000/meeting/80090001000"
    )
    res2 = client.delete(f'/api/meetings/{live.meeting_code}')
    assert res2.status_code == 409
