/* TypeScript types matching the backend API schemas. */

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_color: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  meeting_code: string;
  host_id: string;
  topic: string;
  description: string | null;
  meeting_type: 'instant' | 'scheduled';
  scheduled_start_at: string | null;
  duration_minutes: number | null;
  invite_link: string;
  passcode: string | null;
  is_locked?: boolean;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  created_at: string;
  host: User | null;
}

export interface MeetingValidation {
  valid: boolean;
  reason: string | null;
  meeting: Meeting | null;
}

export interface UpcomingMeetingGroup {
  date: string;
  label: string;
  meetings: Meeting[];
}

export interface RecentMeeting {
  instance_id: string;
  meeting_id: string;
  meeting_code: string;
  topic: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  participant_count: number;
}

export interface JoinMeetingRequest {
  display_name: string;
  user_id?: string;
}

export interface JoinMeetingResponse {
  participant_id: string;
  instance_id: string;
  meeting: Meeting;
  is_host: boolean;
}

export interface Participant {
  id: string;
  channel_name?: string;
  participant_id: string;
  display_name: string;
  is_host: boolean;
  is_muted?: boolean;
  is_video_off?: boolean;
  is_screen_sharing?: boolean;
  stream?: MediaStream;
}

export interface ChatMessage {
  participant_id: string;
  display_name: string;
  message: string;
  sent_at: string;
}
