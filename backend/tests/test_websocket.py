import pytest
from channels.testing import WebsocketCommunicator
from meetclone.asgi import application
from meetings.models import User, Meeting, MeetingInstance, Participant, ChatMessage, MeetingType, MeetingStatus

@pytest.mark.asyncio
@pytest.mark.django_db
async def test_websocket_join_offer_mute_chat_host_actions():
    # 1. Create user, meeting, and instance
    user = await User.objects.acreate(
        name="WS Host",
        email="ws_host@meetclone.dev",
        avatar_color="#2D8CFF"
    )
    meeting = await Meeting.objects.acreate(
        meeting_code="999 8888 7777",
        host=user,
        topic="WS Test Meeting",
        meeting_type=MeetingType.INSTANT,
        status=MeetingStatus.LIVE,
        invite_link="http://localhost:3000/meeting/99988887777"
    )
    instance = await MeetingInstance.objects.acreate(meeting=meeting)
    instance_id = str(instance.id)

    p1 = await Participant.objects.acreate(
        meeting_instance=instance,
        display_name="Client A",
        is_host=True
    )
    p2 = await Participant.objects.acreate(
        meeting_instance=instance,
        display_name="Client B",
        is_host=False
    )

    # 2. Connect Client A & Client B
    comm_a = WebsocketCommunicator(application, f"/ws/meeting/{instance_id}")
    connected_a, _ = await comm_a.connect()
    assert connected_a

    comm_b = WebsocketCommunicator(application, f"/ws/meeting/{instance_id}")
    connected_b, _ = await comm_b.connect()
    assert connected_b

    # Client A joins room
    await comm_a.send_json_to({
        "type": "join-room",
        "participant_id": str(p1.id),
        "display_name": "Client A",
        "is_host": True
    })

    # Client A receives existing-participants
    res_a1 = await comm_a.receive_json_from()
    assert res_a1["type"] == "existing-participants"

    # Client B joins room
    await comm_b.send_json_to({
        "type": "join-room",
        "participant_id": str(p2.id),
        "display_name": "Client B",
        "is_host": False
    })

    res_b1 = await comm_b.receive_json_from()
    assert res_b1["type"] == "existing-participants"

    # Client A receives participant-joined for B
    res_a2 = await comm_a.receive_json_from()
    assert res_a2["type"] == "participant-joined"
    assert res_a2["participant_id"] == str(p2.id)

    ch_b = res_a2["channel_name"]

    # 3. Targeted WebRTC Offer from A to B
    await comm_a.send_json_to({
        "type": "offer",
        "target_channel": ch_b,
        "offer": {"type": "offer", "sdp": "fake_sdp"}
    })

    res_b2 = await comm_b.receive_json_from()
    assert res_b2["type"] == "offer"
    assert res_b2["offer"]["sdp"] == "fake_sdp"

    # 4. Mute-state from A (broadcasts to B, not echoed back to A)
    await comm_a.send_json_to({
        "type": "mute-state",
        "mute_type": "audio",
        "muted": True
    })

    res_b3 = await comm_b.receive_json_from()
    assert res_b3["type"] == "mute-state"
    assert res_b3["muted"] is True

    # 5. Chat message from B (broadcasts to A and persists to DB)
    await comm_b.send_json_to({
        "type": "chat-message",
        "message": "Hello from B!"
    })

    res_a3 = await comm_a.receive_json_from()
    assert res_a3["type"] == "chat-message"
    assert res_a3["message"] == "Hello from B!"

    # Verify DB chat persistence
    msg_in_db = await ChatMessage.objects.filter(message="Hello from B!").afirst()
    assert msg_in_db is not None

    # 6. Host action authorization test:
    # Client B (non-host) sends mute-all -> should be rejected/ignored
    await comm_b.send_json_to({
        "type": "host-action",
        "action": "mute-all"
    })
    # Client A should receive nothing from B's unauthorized request
    assert await comm_a.receive_nothing()

    # 7. Abrupt disconnect of B -> left_at updated in DB
    await comm_b.disconnect()

    res_a4 = await comm_a.receive_json_from()
    assert res_a4["type"] == "participant-left"
    assert res_a4["participant_id"] == str(p2.id)

    p2_updated = await Participant.objects.aget(id=p2.id)
    assert p2_updated.left_at is not None

    await comm_a.disconnect()
