/* Zustand store for meeting session state management. */

import { create } from 'zustand';
import { Meeting, Participant, ChatMessage, JoinMeetingResponse } from '@/types';

interface MeetingState {
  // Session info
  currentMeeting: Meeting | null;
  instanceId: string | null;
  participantId: string | null;
  isHost: boolean;
  isLocked: boolean;
  meetingCode: string | null;

  // Participants & Pinning
  participants: Participant[];
  localParticipant: Participant | null;
  pinnedParticipantId: string | null;

  // Reactions map (participant_id -> emoji)
  reactions: Record<string, string>;

  // Chat
  chatMessages: ChatMessage[];

  // UI
  showParticipants: boolean;
  showChat: boolean;
  elapsedSeconds: number;

  // Actions
  setMeetingSession: (data: JoinMeetingResponse & { meetingCode: string }) => void;
  setIsHost: (isHost: boolean) => void;
  setIsLocked: (isLocked: boolean) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantMuteState: (participantId: string, type: 'audio' | 'video', muted: boolean) => void;
  updateParticipantStream: (participantId: string, stream: MediaStream) => void;
  setPinnedParticipant: (participantId: string | null) => void;
  setParticipantReaction: (participantId: string, emoji: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleParticipants: () => void;
  toggleChat: () => void;
  setElapsed: (s: number) => void;
  reset: () => void;
}

const initialState = {
  currentMeeting: null,
  instanceId: null,
  participantId: null,
  isHost: false,
  isLocked: false,
  meetingCode: null,
  participants: [],
  localParticipant: null,
  pinnedParticipantId: null,
  reactions: {},
  chatMessages: [],
  showParticipants: false,
  showChat: false,
  elapsedSeconds: 0,
};

export const useMeetingStore = create<MeetingState>((set) => ({
  ...initialState,

  setMeetingSession: (data) =>
    set({
      currentMeeting: data.meeting,
      instanceId: data.instance_id,
      participantId: data.participant_id,
      isHost: data.is_host,
      isLocked: data.meeting.is_locked || false,
      meetingCode: data.meetingCode,
    }),

  setIsHost: (isHost: boolean) => set({ isHost }),
  setIsLocked: (isLocked: boolean) => set({ isLocked }),

  addParticipant: (p) =>
    set((state) => {
      const existingIndex = state.participants.findIndex(
        (x) => x.participant_id === p.participant_id
      );

      if (existingIndex >= 0) {
        const updated = [...state.participants];
        const existing = updated[existingIndex];
        updated[existingIndex] = {
          ...existing,
          ...p,
          stream: p.stream || existing.stream,
        };
        return { participants: updated };
      }

      return { participants: [...state.participants, p] };
    }),

  removeParticipant: (participantId) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.participant_id !== participantId),
      pinnedParticipantId: state.pinnedParticipantId === participantId ? null : state.pinnedParticipantId,
    })),

  updateParticipantMuteState: (participantId, type, muted) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.participant_id === participantId
          ? { ...p, [type === 'audio' ? 'is_muted' : 'is_video_off']: muted }
          : p
      ),
    })),

  updateParticipantStream: (participantId, stream) =>
    set((state) => {
      const existing = state.participants.find((p) => p.participant_id === participantId);
      if (existing) {
        return {
          participants: state.participants.map((p) =>
            p.participant_id === participantId ? { ...p, stream } : p
          ),
        };
      } else {
        return {
          participants: [
            ...state.participants,
            {
              id: participantId,
              participant_id: participantId,
              display_name: 'Participant',
              is_host: false,
              stream,
            },
          ],
        };
      }
    }),

  setPinnedParticipant: (participantId) =>
    set((state) => ({
      pinnedParticipantId: state.pinnedParticipantId === participantId ? null : participantId,
    })),

  setParticipantReaction: (participantId, emoji) =>
    set((state) => ({
      reactions: { ...state.reactions, [participantId]: emoji },
    })),

  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  toggleParticipants: () =>
    set((state) => ({
      showParticipants: !state.showParticipants,
      showChat: state.showParticipants ? state.showChat : false,
    })),

  toggleChat: () =>
    set((state) => ({
      showChat: !state.showChat,
      showParticipants: state.showChat ? state.showChat : false,
    })),

  setElapsed: (s) => set({ elapsedSeconds: s }),

  reset: () => set(initialState),
}));
