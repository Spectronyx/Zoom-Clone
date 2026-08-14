"use client";

import { useState } from "react";
import { Mic, MicOff, Video, VideoOff, Crown, X, Lock, Unlock, ShieldAlert, UserCheck } from "lucide-react";
import { Participant } from "@/types";
import Avatar from "@/components/ui/Avatar";
import { useMeetingStore } from "@/store/meetingStore";

interface ParticipantsPanelProps {
  participants: Participant[];
  localDisplayName: string;
  isHost: boolean;
  isLocked: boolean;
  onMuteAll: () => void;
  onMuteParticipant: (participantId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
  onMakeHost?: (participantId: string) => void;
  onToggleLockMeeting?: () => void;
  onClose: () => void;
}

export default function ParticipantsPanel({
  participants,
  localDisplayName,
  isHost,
  isLocked,
  onMuteAll,
  onMuteParticipant,
  onRemoveParticipant,
  onMakeHost,
  onToggleLockMeeting,
  onClose,
}: ParticipantsPanelProps) {
  return (
    <div className="fixed md:relative inset-0 md:inset-auto z-50 w-full md:w-[320px] h-full bg-white border-l border-zoom-border flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zoom-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-zoom-text-primary">
            Participants ({participants.length + 1})
          </h3>
          {isLocked && (
            <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-zoom-text-secondary transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Host Controls Section */}
      {isHost && (
        <div className="px-4 py-2.5 bg-slate-50 border-b border-zoom-border flex items-center justify-between gap-2">
          <button
            onClick={onMuteAll}
            className="px-3 py-1.5 bg-zoom-blue hover:bg-zoom-blueHover text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <MicOff size={13} /> Mute All
          </button>

          {onToggleLockMeeting && (
            <button
              onClick={onToggleLockMeeting}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isLocked
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock size={12} /> Unlock
                </>
              ) : (
                <>
                  <Lock size={12} /> Lock Meeting
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Local user */}
        <div className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={localDisplayName} size="sm" />
            <div>
              <span className="text-sm text-zoom-text-primary font-medium">
                {localDisplayName}
              </span>
              <span className="text-xs text-zoom-text-secondary ml-1">(You)</span>
              {isHost && (
                <Crown size={12} className="text-amber-500 inline ml-1.5" />
              )}
            </div>
          </div>
        </div>

        {/* Remote participants */}
        {participants.map((p) => (
          <div
            key={p.participant_id}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
          >
            <div className="flex items-center gap-3 truncate pr-2 min-w-0">
              <Avatar name={p.display_name} size="sm" />
              <div className="truncate">
                <span className="text-sm text-zoom-text-primary font-medium truncate block">
                  {p.display_name}
                </span>
                {p.is_host && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                    <Crown size={10} /> Host
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {p.is_muted ? (
                <MicOff size={14} className="text-zoom-red" />
              ) : (
                <Mic size={14} className="text-zoom-text-secondary" />
              )}
              {p.is_video_off ? (
                <VideoOff size={14} className="text-zoom-red" />
              ) : (
                <Video size={14} className="text-zoom-text-secondary" />
              )}

              {/* Host actions: explicit Mute and Remove buttons */}
              {isHost && (
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    onClick={() => onMuteParticipant(p.participant_id)}
                    disabled={p.is_muted}
                    className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                      p.is_muted
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                    }`}
                    title={p.is_muted ? "Already muted" : "Mute participant"}
                  >
                    {p.is_muted ? "Muted" : "Mute"}
                  </button>
                  {onMakeHost && !p.is_host && (
                    <button
                      onClick={() => onMakeHost(p.participant_id)}
                      className="p-1 rounded hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                      title="Make Host"
                    >
                      <UserCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveParticipant(p.participant_id)}
                    className="p-1 rounded hover:bg-red-100 text-zoom-red transition-colors cursor-pointer"
                    title="Remove participant"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
