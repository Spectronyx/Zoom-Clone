"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  Users, MessageSquare, LogOut, ChevronUp, Smile, Pen, UserPlus,
} from "lucide-react";
import { useMeetingStore } from "@/store/meetingStore";
import { useMediaStore } from "@/store/mediaStore";

interface ControlBarProps {
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onSendReaction?: (emoji: string) => void;
  onLeave: () => void;
  onEndMeetingForAll?: () => void;
  onToggleWhiteboard?: () => void;
  onToggleInvite?: () => void;
  isHost?: boolean;
  participantCount: number;
  visible: boolean;
}

const EMOJIS = ["👍", "👏", "❤️", "🎉", "😂", "😮"];

export default function ControlBar({
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onSendReaction,
  onLeave,
  onEndMeetingForAll,
  onToggleWhiteboard,
  onToggleInvite,
  isHost = false,
  participantCount,
  visible,
}: ControlBarProps) {
  const { showParticipants, showChat, toggleParticipants, toggleChat } = useMeetingStore();
  const { isMuted, isVideoOff, isScreenSharing } = useMediaStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showLeaveMenu, setShowLeaveMenu] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);
  const leaveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
      if (leaveRef.current && !leaveRef.current.contains(e.target as Node)) {
        setShowLeaveMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        control-bar-transition
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      <div className="flex items-center justify-between md:justify-center gap-1 px-3 md:px-4 py-2.5 md:py-3
        bg-zoom-dark-panel/95 backdrop-blur-md border-t border-gray-800">

        {/* Left section - Audio/Video */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
            className={`
              flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg
              transition-colors cursor-pointer group
              ${isMuted ? "bg-zoom-red/20 hover:bg-zoom-red/30" : "hover:bg-white/10"}
            `}
          >
            <div className="relative">
              {isMuted ? (
                <MicOff size={20} className="text-zoom-red" />
              ) : (
                <Mic size={20} className="text-white" />
              )}
            </div>
            <span className={`text-[10px] hidden sm:block ${isMuted ? "text-zoom-red" : "text-white/70"}`}>
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          <button
            onClick={onToggleVideo}
            className={`
              flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg
              transition-colors cursor-pointer
              ${isVideoOff ? "bg-zoom-red/20 hover:bg-zoom-red/30" : "hover:bg-white/10"}
            `}
          >
            {isVideoOff ? (
              <VideoOff size={20} className="text-zoom-red" />
            ) : (
              <Video size={20} className="text-white" />
            )}
            <span className={`text-[10px] hidden sm:block ${isVideoOff ? "text-zoom-red" : "text-white/70"}`}>
              {isVideoOff ? "Start Video" : "Stop Video"}
            </span>
          </button>
        </div>

        {/* Center section */}
        <div className="flex items-center gap-1 md:mx-4">
          <button
            onClick={toggleParticipants}
            className={`
              flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg
              transition-colors cursor-pointer relative
              ${showParticipants ? "bg-white/15" : "hover:bg-white/10"}
            `}
          >
            <Users size={20} className="text-white" />
            <span className="text-[10px] text-white/70 hidden sm:block">Participants</span>
            <span className="absolute -top-0.5 -right-0.5 bg-zoom-blue text-white text-[9px]
              font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {participantCount}
            </span>
          </button>

          {onToggleInvite && (
            <button
              onClick={onToggleInvite}
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <UserPlus size={20} className="text-white" />
              <span className="text-[10px] text-white/70 hidden sm:block">Invite</span>
            </button>
          )}

          <button
            onClick={toggleChat}
            aria-label="Chat"
            title="Chat"
            className={`
              flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg
              transition-colors cursor-pointer
              ${showChat ? "bg-white/15" : "hover:bg-white/10"}
            `}
          >
            <MessageSquare size={20} className="text-white" />
            <span className="text-[10px] text-white/70 hidden sm:block">Chat</span>
          </button>

          {onToggleWhiteboard && (
            <button
              onClick={onToggleWhiteboard}
              className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Pen size={20} className="text-white" />
              <span className="text-[10px] text-white/70 hidden sm:block">Whiteboard</span>
            </button>
          )}

          {/* Reactions Popover */}
          <div className="relative" ref={reactionRef}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`
                flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg
                transition-colors cursor-pointer
                ${showReactions ? "bg-white/15" : "hover:bg-white/10"}
              `}
            >
              <Smile size={20} className="text-white" />
              <span className="text-[10px] text-white/70 hidden sm:block">Reactions</span>
            </button>

            {showReactions && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-zoom-dark-panel border border-slate-700/60 shadow-2xl rounded-2xl p-2 flex items-center gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSendReaction?.(emoji);
                      setShowReactions(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/15 transition-transform active:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onToggleScreenShare}
            className={`
              flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-3.5 py-1.5 rounded-lg
              transition-colors cursor-pointer
              ${isScreenSharing
                ? "bg-zoom-green hover:bg-zoom-green-hover"
                : "bg-zoom-green/80 hover:bg-zoom-green"
              }
            `}
          >
            {isScreenSharing ? (
              <MonitorOff size={20} className="text-white" />
            ) : (
              <Monitor size={20} className="text-white" />
            )}
            <span className="text-[10px] text-white hidden sm:block font-medium">
              {isScreenSharing ? "Stop Share" : "Share Screen"}
            </span>
          </button>
        </div>

        {/* Right section - Leave / End */}
        <div className="relative" ref={leaveRef}>
          <button
            onClick={() => {
              if (isHost && onEndMeetingForAll) {
                setShowLeaveMenu(!showLeaveMenu);
              } else {
                onLeave();
              }
            }}
            aria-label={isHost ? "End" : "Leave"}
            title={isHost ? "End" : "Leave"}
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg
              bg-zoom-red hover:bg-zoom-red-hover transition-colors cursor-pointer"
          >
            <LogOut size={18} className="text-white" />
            <span className="text-white text-xs sm:text-sm font-semibold">
              {isHost ? "End" : "Leave"}
            </span>
            <ChevronUp size={14} className="text-white/60 hidden sm:block" />
          </button>

          {isHost && showLeaveMenu && (
            <div className="absolute bottom-full right-0 mb-3 w-56 bg-zoom-dark-panel border border-slate-700/60 shadow-2xl rounded-xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => {
                  setShowLeaveMenu(false);
                  onEndMeetingForAll?.();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
              >
                End Meeting for All
              </button>
              <button
                onClick={() => {
                  setShowLeaveMenu(false);
                  onLeave();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Leave Meeting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
