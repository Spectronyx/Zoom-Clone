"""Django Channels WebSocket consumer for WebRTC signaling and real-time features.

Handles:
- Room join/leave broadcast
- WebRTC offer/answer/ICE candidate relay
- Mute state broadcast
- Chat message broadcast (persisted & relayed)
- Host actions (mute-all, mute-participant, remove-participant, make-host, lock-meeting)
- Host auto-promotion on disconnect
- Disconnect handling with participant left_at DB persistence
"""

import json
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Participant, ChatMessage, MeetingInstance


# Global mapping: channel_name -> participant info
CONNECTED_USERS: dict[str, dict] = {}


@database_sync_to_async
def update_participant_host_in_db(participant_id, is_host):
    try:
        Participant.objects.filter(id=participant_id).update(is_host=is_host)
    except Exception:
        pass


@database_sync_to_async
def mark_participant_left_in_db(participant_id):
    try:
        now = datetime.now(timezone.utc)
        p = Participant.objects.filter(id=participant_id).first()
        if p:
            p.left_at = now
            p.save(update_fields=['left_at'])
            inst = p.meeting_instance
            remaining = inst.participants.filter(left_at__isnull=True).count()
            if remaining == 0:
                inst.ended_at = now
                inst.duration_seconds = int((now - inst.started_at).total_seconds())
                inst.save(update_fields=['ended_at', 'duration_seconds'])
                meeting = inst.meeting
                meeting.status = 'ended'
                meeting.save(update_fields=['status'])
    except Exception as e:
        print("[Consumer] Exception updating left_at on disconnect:", e)


@database_sync_to_async
def end_meeting_in_db(instance_id):
    try:
        now = datetime.now(timezone.utc)
        inst = MeetingInstance.objects.filter(id=instance_id).first()
        if inst:
            inst.ended_at = now
            if inst.started_at:
                inst.duration_seconds = int((now - inst.started_at).total_seconds())
            inst.save(update_fields=['ended_at', 'duration_seconds'])
            meeting = inst.meeting
            meeting.status = MeetingStatus.ENDED
            meeting.save(update_fields=['status'])
            inst.participants.filter(left_at__isnull=True).update(left_at=now)
    except Exception as e:
        print("[Consumer] Exception ending meeting in DB:", e)


@database_sync_to_async
def save_chat_message_in_db(instance_id, participant_id, display_name, message):
    try:
        inst = MeetingInstance.objects.filter(id=instance_id).first()
        participant = Participant.objects.filter(id=participant_id).first()
        if inst and participant:
            ChatMessage.objects.create(
                meeting_instance=inst,
                sender_participant=participant,
                message=message,
            )
    except Exception as e:
        print("[Consumer] Exception saving chat message:", e)


class MeetingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for a single meeting instance room."""

    async def connect(self):
        self.instance_id = self.scope['url_route']['kwargs']['instance_id']
        self.room_group = f"meeting_{self.instance_id}"
        self.participant_info = None
        await self.accept()

    async def disconnect(self, close_code):
        if self.participant_info:
            was_host = self.participant_info.get("is_host", False)
            leaving_pid = self.participant_info["participant_id"]

            CONNECTED_USERS.pop(self.channel_name, None)

            # Persist left_at timestamp in database
            await mark_participant_left_in_db(leaving_pid)

            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "participant_left",
                    "participant_id": leaving_pid,
                    "display_name": self.participant_info["display_name"],
                    "sender_channel": self.channel_name,
                }
            )

            # Auto-promote next participant to host if host leaves
            if was_host:
                remaining = [
                    (ch, info) for ch, info in CONNECTED_USERS.items()
                    if info.get("instance_id") == self.instance_id
                ]
                if remaining:
                    new_host_channel, new_host_info = remaining[0]
                    new_host_info["is_host"] = True
                    CONNECTED_USERS[new_host_channel] = new_host_info

                    await update_participant_host_in_db(new_host_info["participant_id"], True)

                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            "type": "broadcast_host_changed",
                            "new_host_participant_id": new_host_info["participant_id"],
                            "new_host_display_name": new_host_info["display_name"],
                        }
                    )

        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        """Parse JSON and route to the appropriate handler."""
        try:
            content = json.loads(text_data)
            msg_type = content.get("type", "")
            handler_name = f"handle_{msg_type.replace('-', '_')}"
            handler = getattr(self, handler_name, None)
            if handler:
                await handler(content)
        except Exception as e:
            print("[Consumer] Exception parsing message:", e)

    async def send_json(self, data):
        """Helper to send JSON-serialized data."""
        await self.send(text_data=json.dumps(data))

    # ─── Incoming message handlers ──────────────────────────────────────────

    async def handle_join_room(self, data):
        self.participant_info = {
            "participant_id": data["participant_id"],
            "display_name": data["display_name"],
            "is_host": data.get("is_host", False),
            "user_id": data.get("user_id"),
            "instance_id": self.instance_id,
            "channel_name": self.channel_name,
        }
        CONNECTED_USERS[self.channel_name] = self.participant_info

        await self.channel_layer.group_add(self.room_group, self.channel_name)

        existing = []
        for ch_name, info in CONNECTED_USERS.items():
            if (ch_name != self.channel_name and
                    info.get("instance_id") == self.instance_id):
                existing.append({
                    "channel_name": ch_name,
                    "participant_id": info["participant_id"],
                    "display_name": info["display_name"],
                    "is_host": info.get("is_host", False),
                })

        await self.send_json({
            "type": "existing-participants",
            "participants": existing,
        })

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "participant_joined",
                "channel_name": self.channel_name,
                "participant_id": self.participant_info["participant_id"],
                "display_name": self.participant_info["display_name"],
                "is_host": self.participant_info.get("is_host", False),
                "sender_channel": self.channel_name,
            }
        )

    async def handle_offer(self, data):
        target_channel = data.get("target_channel")
        if not target_channel or not self.participant_info:
            return
        await self.channel_layer.send(
            target_channel,
            {
                "type": "webrtc_offer",
                "sender_channel": self.channel_name,
                "offer": data["offer"],
                "participant_id": self.participant_info["participant_id"],
                "display_name": self.participant_info["display_name"],
                "is_host": self.participant_info.get("is_host", False),
            }
        )

    async def handle_answer(self, data):
        target_channel = data.get("target_channel")
        if not target_channel or not self.participant_info:
            return
        await self.channel_layer.send(
            target_channel,
            {
                "type": "webrtc_answer",
                "sender_channel": self.channel_name,
                "answer": data["answer"],
                "participant_id": self.participant_info["participant_id"],
                "display_name": self.participant_info["display_name"],
            }
        )

    async def handle_ice_candidate(self, data):
        target_channel = data.get("target_channel")
        if not target_channel:
            return
        await self.channel_layer.send(
            target_channel,
            {
                "type": "webrtc_ice_candidate",
                "sender_channel": self.channel_name,
                "candidate": data["candidate"],
            }
        )

    async def handle_mute_state(self, data):
        if not self.participant_info:
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_mute_state",
                "participant_id": self.participant_info["participant_id"],
                "mute_type": data["mute_type"],
                "muted": data["muted"],
                "sender_channel": self.channel_name,
            }
        )

    async def handle_chat_message(self, data):
        if not self.participant_info:
            return

        # Save to DB
        await save_chat_message_in_db(
            self.instance_id,
            self.participant_info["participant_id"],
            self.participant_info["display_name"],
            data["message"]
        )

        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_chat_message",
                "participant_id": self.participant_info["participant_id"],
                "display_name": self.participant_info["display_name"],
                "message": data["message"],
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "sender_channel": self.channel_name,
            }
        )

    async def handle_reaction(self, data):
        if not self.participant_info:
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_reaction",
                "participant_id": self.participant_info["participant_id"],
                "emoji": data.get("emoji", "👍"),
                "sender_channel": self.channel_name,
            }
        )

    async def handle_host_action(self, data):
        if not self.participant_info or not self.participant_info.get("is_host"):
            return

        action = data.get("action")

        if action == "mute-all":
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "broadcast_host_action",
                    "action": "mute-all",
                    "by": self.participant_info["display_name"],
                    "sender_channel": self.channel_name,
                }
            )
        elif action == "make-host":
            target_pid = data.get("target_participant_id")
            for ch_name, info in CONNECTED_USERS.items():
                if info.get("participant_id") == target_pid:
                    info["is_host"] = True
                    await update_participant_host_in_db(target_pid, True)
                    self.participant_info["is_host"] = False
                    await update_participant_host_in_db(self.participant_info["participant_id"], False)

                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            "type": "broadcast_host_changed",
                            "new_host_participant_id": target_pid,
                            "new_host_display_name": info["display_name"],
                        }
                    )
                    break
        elif action == "mute-participant":
            target_pid = data.get("target_participant_id")
            for ch_name, info in CONNECTED_USERS.items():
                if info.get("participant_id") == target_pid:
                    await self.channel_layer.send(
                        ch_name,
                        {
                            "type": "broadcast_host_action",
                            "action": "mute",
                            "by": self.participant_info["display_name"],
                            "sender_channel": self.channel_name,
                        }
                    )
                    break
        elif action == "remove-participant":
            target_pid = data.get("target_participant_id")
            for ch_name, info in CONNECTED_USERS.items():
                if info.get("participant_id") == target_pid:
                    await self.channel_layer.send(
                        ch_name,
                        {
                            "type": "broadcast_host_action",
                            "action": "remove",
                            "by": self.participant_info["display_name"],
                            "sender_channel": self.channel_name,
                        }
                    )
                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            "type": "broadcast_participant_removed",
                            "participant_id": target_pid,
                            "display_name": info["display_name"],
                            "sender_channel": self.channel_name,
                        }
                    )
                    break
        elif action == "end-meeting":
            await end_meeting_in_db(self.instance_id)
            await self.channel_layer.group_send(
                self.room_group,
                {
                    "type": "broadcast_host_action",
                    "action": "end-meeting",
                    "by": self.participant_info["display_name"],
                    "sender_channel": self.channel_name,
                }
            )

    async def handle_screen_share_state(self, data):
        if not self.participant_info:
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_screen_share",
                "participant_id": self.participant_info["participant_id"],
                "display_name": self.participant_info["display_name"],
                "sharing": data["sharing"],
                "sender_channel": self.channel_name,
            }
        )

    async def handle_request_admission(self, data):
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_admission_request",
                "participant_id": data["participant_id"],
                "display_name": data["display_name"],
                "sender_channel": self.channel_name,
            }
        )

    async def handle_admit_participant(self, data):
        if not self.participant_info or not self.participant_info.get("is_host"):
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_admission_result",
                "target_participant_id": data["target_participant_id"],
                "approved": True,
            }
        )

    async def handle_deny_participant(self, data):
        if not self.participant_info or not self.participant_info.get("is_host"):
            return
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "broadcast_admission_result",
                "target_participant_id": data["target_participant_id"],
                "approved": False,
            }
        )

    # ─── Outgoing message handlers ──────────────────────────────────────────

    async def participant_joined(self, event):
        if event.get("sender_channel") == self.channel_name or not self.participant_info:
            return
        await self.send_json({
            "type": "participant-joined",
            "channel_name": event["channel_name"],
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
            "is_host": event.get("is_host", False),
        })

    async def participant_left(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "participant-left",
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
        })

    async def webrtc_offer(self, event):
        await self.send_json({
            "type": "offer",
            "sender_channel": event["sender_channel"],
            "offer": event["offer"],
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
            "is_host": event.get("is_host", False),
        })

    async def webrtc_answer(self, event):
        await self.send_json({
            "type": "answer",
            "sender_channel": event["sender_channel"],
            "answer": event["answer"],
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
        })

    async def webrtc_ice_candidate(self, event):
        await self.send_json({
            "type": "ice-candidate",
            "sender_channel": event["sender_channel"],
            "candidate": event["candidate"],
        })

    async def broadcast_mute_state(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "mute-state",
            "participant_id": event["participant_id"],
            "mute_type": event["mute_type"],
            "muted": event["muted"],
        })

    async def broadcast_chat_message(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "chat-message",
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
            "message": event["message"],
            "sent_at": event["sent_at"],
        })

    async def broadcast_reaction(self, event):
        await self.send_json({
            "type": "reaction",
            "participant_id": event["participant_id"],
            "emoji": event["emoji"],
        })

    async def broadcast_host_changed(self, event):
        await self.send_json({
            "type": "host-changed",
            "new_host_participant_id": event["new_host_participant_id"],
            "new_host_display_name": event["new_host_display_name"],
        })

    async def broadcast_host_action(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "host-action",
            "action": event["action"],
            "by": event.get("by"),
        })

    async def broadcast_participant_removed(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "participant-removed",
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
        })

    async def broadcast_screen_share(self, event):
        if event.get("sender_channel") == self.channel_name:
            return
        await self.send_json({
            "type": "screen-share-state",
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
            "sharing": event["sharing"],
        })

    async def broadcast_admission_request(self, event):
        await self.send_json({
            "type": "admission_request",
            "participant_id": event["participant_id"],
            "display_name": event["display_name"],
        })

    async def broadcast_admission_result(self, event):
        await self.send_json({
            "type": "admission_result",
            "target_participant_id": event["target_participant_id"],
            "approved": event["approved"],
        })
