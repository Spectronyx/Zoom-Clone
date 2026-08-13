### ui flaws
1. [FIXED] new meeting pop up should be over the upcoming meeting card not below it .
   - Solution: Added `relative z-30` stacking context to ActionButtons container and elevated dropdown container to `z-50`. Updated Modal overlay to `z-[100]`.
2. [FIXED] when a meeting is poped up we should not be able to scroll the background page .
   - Solution: Added body scroll lock (`document.body.style.overflow = "hidden"`) whenever a modal or meeting popup is active.
3. [FIXED] the side bar buttons should work
   - Solution: Linked all navigation items (Home, Meetings, Contacts, Whiteboards, Chat) to active tab switching and dashboard routing.
4. [FIXED] All the buttons should work
   - Solution: Verified and bound click handlers across TopNav (Search, Settings, Help, Sign In, Sign Out, Signup), ActionButtons (Join, Schedule, Share Screen), and In-Meeting ControlBar controls.
5. [FIXED] move the start meeting button in the navbar and remove it from the bottom new meeting button .
   - Solution: Moved the "New Meeting" (Start Meeting) action button with video options dropdown into TopNav header. Cleaned up bottom action cards to 3 primary actions (Join, Schedule, Share Screen).
6. [FIXED] the side bar button are just dummy replace them with the actual working ones
   - Solution: Implemented fully functional pages for `/meetings` (Meetings Dashboard with PMI & history), `/chat` (Team Chat channels & DMs), `/contacts` (User directory with instant call/email), and `/whiteboards` (Interactive canvas tool). Wired `Sidebar.tsx` with Next.js `Link` and active route highlights.
7. [FIXED] the white board feature is also not working
   - Solution: Fixed canvas stroke rendering algorithm (preventing snapshot overwrites during Pen/Eraser drawing) and added touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`). Created `WhiteboardModal` component and added in-meeting Whiteboard button to `ControlBar`.

### backend flaws
1. [FIXED] the user starting the meeting should be able to end to meeting for all the participants .
   - Solution: Added `end-meeting` host WebSocket action handler in `MeetingConsumer` and DB helper `end_meeting_in_db` which terminates the instance, updates `meeting.status = ENDED`, and disconnects all participants.
2. [FIXED] when we try to create a meeting with the same date and time as another meeting it should not create a new meeting it should show an error message .
   - Solution: Added duplicate schedule check in `schedule_meeting` DRF view returning `400 Bad Request` with message: *"A meeting is already scheduled at this exact date and time."*
3. [FIXED] the meeting should end when the last person leaves . 
   - Solution: `leave_meeting` view and WebSocket disconnect handler check remaining active participants (`left_at__isnull=True`) and mark `meeting.status = ENDED` when count reaches zero.
4. [FIXED] there should be no 500 error 
   - Solution: Implemented input validation and error handling across all API views to return proper standard HTTP status codes (400, 404, 409, 410).

### frontend flaws
1. [FIXED] when we clcik on the new meeting button it should open the new meeting pop up .
   - Solution: Click handler in TopNav header opens the "New Meeting" pop-up dropdown with options for video on/off.
2. [FIXED] when we clcik on the join meeting button it should open the join meeting pop up .
   - Solution: Bound click handler to trigger `JoinMeetingModal`.
3. [FIXED] when we clcik on the schedule meeting button it should open the schedule meeting pop up .
   - Solution: Bound click handler to trigger `ScheduleMeetingModal`.
4. [FIXED] when we clcik on the join button it should open the join meeting pop up .
   - Solution: Bound click handler to trigger `JoinMeetingModal`.
5. [FIXED] On starting the new meeting the user should have option to invite otehr participants as acutal zoom do in real time .
   - Solution: Created `InviteModal` component featuring 1-click URL copying, pre-formatted Zoom invitation text copying, mailto/Gmail/Outlook integration, and direct team contact invite dispatching. Added **Invite** button (`UserPlus` icon) to in-meeting `ControlBar`.
6. [FIXED] If i click start meeting and dont acutally start it it should turn back the camera and mic off until i join the meeting it should onlhy show the preview until i start the meeting as soon as i leave the meeting and change my mind about starting the meeting the camera and mic must go off .
   - Solution: Added media cleanup on lobby unmount and an explicit "Cancel & Exit" action in `LobbyPage`. If the user cancels or navigates away without joining, `track.stop()` is called on all camera/mic tracks, releasing hardware access immediately.

### general flaws 
1. [FIXED] On local host i wont be able to check if it working fine for other users and the issues so i need a way to check how do it do it .
   - Solution: You can test multi-user interactions on localhost using the following 4 methods:

     1. **Incognito / Second Browser Window (Fastest & Recommended)**:
        - Open Browser Window 1 (Normal Window): Click **New Meeting** -> Copy the meeting link or 10-character code.
        - Open Browser Window 2 (Incognito / Private Window or Firefox/Edge): Go to `http://localhost:3000` -> Click **Join** -> Enter meeting code & a different name (e.g., "Alice").
        - Both participants will connect via WebSockets and WebRTC audio/video grid!

     2. **Automated Multi-User Playwright Test**:
        - Run `cd frontend && npx playwright test`
        - Playwright automatically launches 2 headless browser contexts side-by-side to verify multi-participant joining, mute toggles, and chat messaging.

     3. **Test from Mobile Phone / Secondary Device on Same Wi-Fi**:
        - Computer Local IP: `192.168.0.105`
        - Bind servers to `0.0.0.0`:
          - Backend: `python manage.py runserver 0.0.0.0:8000`
          - Frontend: `npm run dev -- -H 0.0.0.0`
        - Open `http://192.168.0.105:3000` on any mobile phone or secondary device connected to your Wi-Fi!

     4. **Public Tunneling for External Testers (ngrok / localtunnel)**:
        - Run `npx localtunnel --port 3000` in terminal.
        - Share the generated HTTPS URL with anyone outside your network to test live multi-user video calls over the internet.
