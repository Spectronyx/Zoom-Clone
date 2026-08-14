# MeetClone — Backend API & WebSocket Routes Documentation

This document describes all REST API endpoints and WebSocket signaling routes implemented in the MeetClone Django backend framework.

---

## 🛰️ Base URLs

- **REST API Base URL**: `http://localhost:8000/api/`
- **WebSocket Base URL**: `ws://localhost:8000/ws/`

---

## 🏥 Health Check Route

### `GET /health`
- **Description**: Returns the operational status of the Daphne ASGI backend service.
- **Auth Required**: No
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "meetclone-backend"
}
```

---

## 🔐 Authentication Endpoints

### 1. `POST /api/auth/signup`
- **Description**: Registers a new user account in the system database.
- **Request Body**:
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "securepassword123"
}
```
- **Response `201 Created`**:
```json
{
  "token": "e9b2a1c...",
  "user": {
    "id": "u-12345",
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "avatar_color": "#2D8CFF"
  }
}
```

---

### 2. `POST /api/auth/login`
- **Description**: Authenticates an existing user and returns session credentials.
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "securepassword123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "e9b2a1c...",
  "user": {
    "id": "u-12345",
    "name": "Alex Johnson",
    "email": "alex@example.com"
  }
}
```

---

### 3. `GET /api/auth/me`
- **Description**: Retrieves the profile information of the currently authenticated user session.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "id": "u-12345",
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "avatar_color": "#2D8CFF"
}
```

---

## 📹 Meeting Management Endpoints

### 4. `GET /api/meetings/me`
- **Description**: Returns the default host user details or automatically seeds the initial default user (`Rajneesh Sharma`) if database is empty.
- **Response `200 OK`**:
```json
{
  "id": "f8a9b2...",
  "name": "Rajneesh Sharma",
  "email": "rajneesh@meetclone.dev"
}
```

---

### 5. `POST /api/meetings/instant`
- **Description**: Instantly creates a new live meeting definition, generates a unique 10-digit meeting code and shareable invite URL.
- **Request Body**: *(Optional)*
```json
{
  "topic": "Quick Sync",
  "host_id": "f8a9b2..."
}
```
- **Response `201 Created`**:
```json
{
  "id": "m-99123",
  "meeting_code": "969-9678-7021",
  "topic": "Quick Sync",
  "meeting_type": "instant",
  "invite_link": "http://localhost:3000/meeting/96996787021/lobby",
  "status": "scheduled"
}
```

---

### 6. `POST /api/meetings/scheduled`
- **Description**: Schedules a meeting for a future date and time with configurable duration and description.
- **Request Body**:
```json
{
  "topic": "Product Architecture Review",
  "description": "Discussing WebRTC mesh vs SFU scaling options",
  "scheduled_start_at": "2026-08-15T14:00:00Z",
  "duration_minutes": 45
}
```
- **Response `201 Created`**:
```json
{
  "id": "m-88210",
  "meeting_code": "412-5896-1024",
  "topic": "Product Architecture Review",
  "description": "Discussing WebRTC mesh vs SFU scaling options",
  "meeting_type": "scheduled",
  "scheduled_start_at": "2026-08-15T14:00:00Z",
  "duration_minutes": 45,
  "invite_link": "http://localhost:3000/meeting/41258961024/lobby",
  "status": "scheduled"
}
```

---

### 7. `GET /api/meetings/upcoming`
- **Description**: Lists all future scheduled meetings that have not yet ended, ordered chronologically by scheduled start time.
- **Response `200 OK`**:
```json
[
  {
    "id": "m-88210",
    "meeting_code": "412-5896-1024",
    "topic": "Product Architecture Review",
    "scheduled_start_at": "2026-08-15T14:00:00Z",
    "duration_minutes": 45,
    "invite_link": "http://localhost:3000/meeting/41258961024/lobby"
  }
]
```

---

### 8. `GET /api/meetings/recent`
- **Description**: Retrieves history of completed meeting occurrences with calculated meeting durations and participant counts.
- **Response `200 OK`**:
```json
[
  {
    "instance_id": "inst-1002",
    "meeting_code": "969-9678-7021",
    "topic": "Weekly Design Sprint",
    "started_at": "2026-08-13T10:00:00Z",
    "ended_at": "2026-08-13T10:45:12Z",
    "duration_seconds": 2712,
    "participant_count": 4
  }
]
```

---

### 9. `GET /api/meetings/<meeting_code>`
- **Description**: Returns detailed configuration metadata for a specific meeting code.
- **Response `200 OK`**:
```json
{
  "id": "m-99123",
  "meeting_code": "969-9678-7021",
  "topic": "Quick Sync",
  "meeting_type": "instant",
  "is_locked": false,
  "waiting_room_enabled": true,
  "host_name": "Rajneesh Sharma"
}
```

---

### 10. `POST /api/meetings/<meeting_code>/validate`
- **Description**: Validates whether a meeting ID exists and checks if joining is permitted (e.g. checks if meeting is locked or ended).
- **Request Body**: *(Optional)*
- **Response `200 OK`**:
```json
{
  "valid": true,
  "meeting": {
    "meeting_code": "969-9678-7021",
    "topic": "Quick Sync",
    "is_locked": false
  }
}
```
- **Response `404 Not Found`**:
```json
{
  "valid": false,
  "reason": "Meeting not found"
}
```

---

### 11. `POST /api/meetings/<meeting_code>/join`
- **Description**: Joins a meeting room occurrence by creating or reusing a `MeetingInstance` and registering a `Participant` record in the database.
- **Request Body**:
```json
{
  "display_name": "Sarah Connor",
  "user_id": "u-12345"
}
```
- **Response `200 OK`**:
```json
{
  "instance_id": "inst-1002",
  "participant_id": "p-5501",
  "display_name": "Sarah Connor",
  "is_host": false,
  "meeting": {
    "meeting_code": "969-9678-7021",
    "topic": "Quick Sync"
  }
}
```

---

### 12. `POST /api/meetings/<meeting_code>/leave`
- **Description**: Marks a participant's `left_at` timestamp in the database and updates `MeetingInstance` `ended_at` and `duration_seconds` when all participants exit.
- **Request Body**:
```json
{
  "participant_id": "p-5501"
}
```
- **Response `200 OK`**:
```json
{
  "status": "left",
  "participant_id": "p-5501"
}
```

---

### 13. `POST /api/meetings/<meeting_code>/lock`
- **Description**: Toggles the meeting room lock state. When locked, new participants cannot join.
- **Response `200 OK`**:
```json
{
  "meeting_code": "969-9678-7021",
  "is_locked": true
}
```

---

### 14. `POST /api/meetings/<meeting_code>/cancel`
- **Description**: Cancels a scheduled meeting definition in the database.
- **Response `200 OK`**:
```json
{
  "status": "cancelled",
  "meeting_code": "412-5896-1024"
}
```

---

## ⚡ WebSocket Real-Time Signaling Route

### `WS /ws/meeting/<instance_id>/`
- **Description**: Bi-directional ASGI WebSocket channel for WebRTC signaling mesh, real-time in-meeting chat, host action broadcasts, and admission queue events.

#### Signaling & Event Message Types:
| Message Type | Direction | Payload Parameters | Purpose |
|---|---|---|---|
| `join-room` | Client → Server | `participant_id`, `display_name`, `is_host` | Registers client in room group & fetches existing participants list |
| `existing-participants` | Server → Client | `participants: [...]` | Delivers list of all active peer channels to new participant |
| `participant-joined` | Broadcast | `participant_id`, `display_name`, `is_host` | Notifies active room peers that a new user entered |
| `offer` | Client → Peer | `target_channel`, `offer` (SDP) | Relays WebRTC offer to target peer connection |
| `answer` | Client → Peer | `target_channel`, `answer` (SDP) | Relays WebRTC answer back to initiating peer |
| `ice-candidate` | Client → Peer | `target_channel`, `candidate` | Relays ICE candidate for NAT traversal |
| `mute-state` | Broadcast | `mute_type` (`audio`\|`video`), `muted` | Syncs mic/camera toggle state across participant video tiles |
| `chat-message` | Broadcast | `message` | Broadcasts & persists text chat messages to database |
| `reaction` | Broadcast | `emoji` | Displays floating reaction emoji badge on participant tile |
| `host-action` | Host → Client | `action` (`mute-all`\|`mute-participant`\|`remove-participant`\|`end-meeting`) | Host control command execution |
| `screen-share-state` | Broadcast | `sharing` (`true`\|`false`) | Notifies peers of screen share track activation/deactivation |
| `request_admission` | Client → Host | `participant_id`, `display_name` | Places participant in waiting room admission queue |
| `admit_participant` | Host → Client | `target_participant_id` | Host approves waiting room participant to join |
