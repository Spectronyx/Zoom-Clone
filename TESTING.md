# 🧪 MeetClone — Automated Testing Suite Documentation

This document provides a comprehensive overview of the automated testing suite for **MeetClone**, covering unit, component, integration, WebSocket signaling, and End-to-End (E2E) testing.

---

## 📐 Architecture & Test Organization

```
Zoom-Clone/
├── backend/
│   ├── pytest.ini               # Backend test runner configuration
│   └── tests/
│       ├── conftest.py          # Pytest fixtures (APIClient, ORM DB isolation)
│       ├── test_meetings.py     # REST API endpoint tests (CRUD, validation, lifecycle)
│       └── test_websocket.py    # Django Channels WebSocket signaling & host control tests
├── frontend/
│   ├── jest.config.js           # Jest configuration with Next.js App Router mapping
│   ├── jest.setup.ts            # WebRTC & browser API mocks (getUserMedia, RTCPeerConnection)
│   ├── playwright.config.ts     # Playwright E2E configuration with fake media flags
│   ├── __tests__/               # React component & unit tests
│   │   ├── ScheduleMeetingModal.test.tsx
│   │   ├── JoinMeetingModal.test.tsx
│   │   ├── ControlBar.test.tsx
│   │   ├── VideoTile.test.tsx
│   │   └── ParticipantsPanel.test.tsx
│   └── e2e/                     # End-to-End Playwright user journey tests
│       ├── instant-meeting.spec.ts
│       ├── schedule-meeting.spec.ts
│       ├── mute-propagation.spec.ts
│       └── chat-flow.spec.ts
└── .github/
    └── workflows/
        └── test.yml             # GitHub Actions CI pipeline
```

---

## 🛠️ How to Run Tests Locally

### 1. Backend Tests (Pytest)

Ensure your backend virtual environment is activated:

```bash
cd backend
source venv/bin/activate
pytest --cov=meetings --cov-report=term-missing
```

**Key Coverage Areas**:
- `POST /api/meetings/instant`: Instant meeting generation.
- `POST /api/meetings/scheduled`: Schedule validation (prevents past dates).
- `GET /api/meetings/upcoming` & `/recent`: Filtering and sorting.
- `GET /api/meetings/{code}/validate`: Code validation & error handling.
- `POST /api/meetings/{code}/join` & `/leave`: Participant lifecycle and duration calculation.
- `DELETE /api/meetings/{code}`: Scheduled meeting cancellation & 409 conflict on live meetings.
- `WebSocket /ws/meeting/{instance_id}`: Join, WebRTC offer/answer relay, mute state broadcast, chat DB persistence, host authorization enforcement, and disconnect cleanup.

---

### 2. Frontend Unit & Component Tests (Jest + React Testing Library)

Navigate to the `frontend/` directory and execute:

```bash
cd frontend
npm test
```

**Key Verification Scenarios**:
- **ScheduleMeetingModal**: Empty topic button disablement, payload construction with local ISO start time.
- **JoinMeetingModal**: Validation failure handling, seamless navigation to `/meeting/[code]/lobby`.
- **ControlBar**: Icon toggles and single click handler execution.
- **VideoTile**: Fallback avatar rendering on camera off, mute badge, active-speaker ring style.
- **ParticipantsPanel**: Host-only action button rendering ("Mute All", "Lock Meeting").

---

### 3. End-to-End Tests (Playwright)

Make sure the backend server (`http://localhost:8000`) and Next.js frontend (`http://localhost:3000`) are running, or let Playwright auto-start the dev server:

```bash
cd frontend
npx playwright test
```

To run E2E tests interactively with UI mode:

```bash
npx playwright test --ui
```

---

## 🎥 WebRTC & Media Stream Mocking Strategy

To enable reproducible headless testing without hardware dependencies:

1. **Jest Environment (`jest.setup.ts`)**:
   - `navigator.mediaDevices.getUserMedia` and `getDisplayMedia` are stubbed with mock `MediaStream` and track objects.
   - `RTCPeerConnection` is mocked to generate fake SDP offers/answers without needing ICE candidates or TURN servers.
2. **Playwright E2E (`playwright.config.ts`)**:
   - Launch options include `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream` flags. Chromium generates synthetic test video/audio streams automatically.

---

## ⚙️ CI/CD Integration (`.github/workflows/test.yml`)

The automated CI workflow executes automatically on every push or pull request to `main` and `master`:
- **Backend Job**: Executes `pytest` with coverage enforcement (`--cov-fail-under=60`).
- **Frontend Job**: Executes `npm test` (Jest) followed by headless `playwright test`. Playwright HTML reports are saved as workflow artifacts upon test runs.
