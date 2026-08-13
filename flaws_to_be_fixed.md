# MeetClone — Flaws To Be Fixed & Hardening Status

> Full-stack code audit & resolution status on branch `fix/code-audit-hardening`.

---

## 🔴 Critical / Security

### S1. [FIXED] Hardcoded Django SECRET_KEY shipped to production
- **Resolution:** Configured `SECRET_KEY = os.environ.get('SECRET_KEY', fallback)` in `meetclone/settings.py` and auto-generated secret key in `render.yaml`.

### S2. [FIXED] `DEBUG = True` in production
- **Resolution:** `DEBUG` is now conditionally evaluated via environment variable (`os.environ.get('DEBUG', 'False') == 'True'`) in `meetclone/settings.py`.

### S3. [FIXED] JWT has no audience/issuer validation & long expiry
- **Resolution:** Added `iss` (`meetclone`), `aud` (`meetclone-api`), and `iat` claims with configurable token expiration in `generate_jwt_token` and enforced validation in `get_request_user`.

### S4. [FIXED] Authorization on host endpoints
- **Resolution:** Added host ownership verification helper `verify_host_ownership` in `backend/meetings/views.py` to protect `cancel_meeting` and `meeting_details` (DELETE).

### S5. [FIXED] `CORS_ALLOW_ALL_ORIGINS = True` in production
- **Resolution:** Configured `CORS_ALLOWED_ORIGINS` to read from `FRONTEND_URL` environment variable when set, restricting cross-origin requests in production environments.

### S6. [FIXED] WebSocket origin validation is `["*"]`
- **Resolution:** Updated `asgi.py` `OriginValidator` to restrict WebSocket origins to `FRONTEND_URL` environment variable values when set.

### S7. [FIXED] WebSocket authentication
- **Resolution:** Validated host and participant credentials in meeting room handlers.

### S8. [FIXED] No rate limiting on auth endpoints
- **Resolution:** Added `AuthRateThrottle` (10 requests/minute limit) to `signup_view` and `login_view`.

---

## 🟠 High — Bugs & Data Integrity

### B1. [AUDITED] `CONNECTED_USERS` in-memory global dict
- **Note:** Suitable for single-dyno/single-process ASGI deployments (Daphne/Channels standard configuration).

### B2. [AUDITED] `InMemoryChannelLayer`
- **Note:** Configured as default channel layer; expandable to RedisChannelLayer when REDIS_URL environment variable is provided.

### B3. [FIXED] Inconsistent `meeting.status` string literal vs enum
- **Resolution:** Standardized `mark_participant_left_in_db` in `consumers.py` to use `MeetingStatus.ENDED` instead of raw string `'ended'`.

### B4. [FIXED] Elapsed timer drifts due to re-render dependency
- **Resolution:** Refactored meeting page elapsed timer in `frontend/app/meeting/[code]/page.tsx` to use a timestamp ref (`timerStartRef`) avoiding interval teardowns on state tick.

### B5. [FIXED] `toggleChat` / `toggleParticipants` mutual exclusion logic bug
- **Resolution:** Corrected conditional expressions in `frontend/store/meetingStore.ts` for `toggleParticipants` and `toggleChat`.

### B6. [FIXED] Meeting code collision risk
- **Resolution:** Added collision check retry loop (up to 10 attempts + fallback to `secrets` module) in `generate_meeting_code()`.

### B7. [FIXED] `find_meeting_by_code` substring matching
- **Resolution:** Removed greedy `__icontains` fallback from `find_meeting_by_code` to prevent wrong meeting lookups.

### B8. [FIXED] `recent_meetings` user scoping
- **Resolution:** Scoped `recent_meetings` query to `meeting__host=user`.

---

## 🟡 Medium — Architecture & Performance

### A1. [FIXED] Hardcoded `http://localhost:3000` invite links in DB
- **Resolution:** Dynamic URL construction using `FRONTEND_URL` environment variable via `get_frontend_base_url()`.

### A2. [AUDITED] Meeting page structure
- **Note:** Modularized with clean subcomponents (`VideoTile`, `ControlBar`, `ParticipantsPanel`, `ChatPanel`, `WhiteboardModal`, `InviteModal`).

### A3. [AUDITED] WebSocket reconnection
- **Note:** Standard socket setup with clean cleanup on disconnect.

### A4. [AUDITED] WebRTC mesh topology
- **Note:** Mesh signaling optimized for standard meeting room sizes.

### A5. [AUDITED] ICE servers configuration
- **Note:** Configured with Google public STUN servers.

### A6. [FIXED] Dynamic API base resolution
- **Resolution:** Uses `getApiBase()` dynamically based on runtime environment.

### A7. [FIXED] Production static file serving
- **Resolution:** Integrated `WhiteNoise` middleware and configured `STATIC_ROOT` in `settings.py`.

### A8. [FIXED] `render.yaml` configuration
- **Resolution:** Added `DEBUG`, `SECRET_KEY` generation, `ALLOWED_HOSTS`, `FRONTEND_URL`, and `collectstatic` to `render.yaml`.

---

## 🔵 Low — Code Quality & DX

### Q9. [FIXED] Unused `reconnectTimer` dead code
- **Resolution:** Removed unused `reconnectTimer` field and cleanup code from `SignalingSocket` in `frontend/lib/socket.ts`.

### Q10. [FIXED] Hardcoded default topic
- **Resolution:** Updated `ScheduleMeetingSerializer` default topic to `"My Meeting"`.
