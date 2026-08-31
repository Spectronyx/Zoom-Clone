function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // In dev, backend always runs plain HTTP on port 8000
    // (even when frontend uses HTTPS for mobile WebRTC)
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
}

const API_BASE = getApiBase();

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('meetclone_jwt') : null;
  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  signup: (data: { name: string; email: string; password: string }) =>
    fetchAPI<{ token: string; user: import('@/types').User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchAPI<{ token: string; user: import('@/types').User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchAPI<import('@/types').User>('/api/auth/me'),

  // User
  getCurrentUser: () => fetchAPI<import('@/types').User>('/api/meetings/me'),

  // Meetings
  createInstantMeeting: () =>
    fetchAPI<import('@/types').Meeting>('/api/meetings/instant', { method: 'POST' }),

  scheduleMeeting: (data: {
    topic: string;
    description?: string;
    scheduled_start_at: string;
    duration_minutes: number;
  }) =>
    fetchAPI<import('@/types').Meeting>('/api/meetings/scheduled', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUpcomingMeetings: () =>
    fetchAPI<import('@/types').UpcomingMeetingGroup[]>('/api/meetings/upcoming'),

  getRecentMeetings: () =>
    fetchAPI<import('@/types').RecentMeeting[]>('/api/meetings/recent'),

  getMeetingDetails: (code: string) =>
    fetchAPI<import('@/types').Meeting>(`/api/meetings/${code}`),

  validateMeeting: (code: string) =>
    fetchAPI<import('@/types').MeetingValidation>(`/api/meetings/${code}/validate`),

  joinMeeting: (code: string, data: import('@/types').JoinMeetingRequest) =>
    fetchAPI<import('@/types').JoinMeetingResponse>(`/api/meetings/${code}/join`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  leaveMeeting: (code: string, participantId: string) =>
    fetchAPI<{ success: boolean }>(`/api/meetings/${code}/leave`, {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId }),
    }),

  lockMeeting: (code: string) =>
    fetchAPI<{ success: boolean; is_locked: boolean; message: string }>(`/api/meetings/${code}/lock`, {
      method: 'POST',
    }),

  cancelMeeting: (code: string) =>
    fetchAPI<{ success: boolean }>(`/api/meetings/${code}/cancel`, {
      method: 'DELETE',
    }),
};
