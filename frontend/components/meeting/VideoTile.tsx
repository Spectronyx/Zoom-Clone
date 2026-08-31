"use client";

import { useEffect, useRef } from "react";
import { MicOff, Pin, PinOff } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface VideoTileProps {
  participantId?: string;
  stream: MediaStream | null;
  displayName: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isLocal?: boolean;
  isActiveSpeaker?: boolean;
  isPinned?: boolean;
  reactionEmoji?: string | null;
  avatarColor?: string;
  onTogglePin?: () => void;
  className?: string;
}

export default function VideoTile({
  participantId,
  stream,
  displayName,
  isMuted = false,
  isVideoOff = false,
  isLocal = false,
  isActiveSpeaker = false,
  isPinned = false,
  reactionEmoji = null,
  avatarColor = "#2D8CFF",
  onTogglePin,
  className = "",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideoTracks = Boolean(
    stream &&
    stream.getVideoTracks().length > 0 &&
    stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live")
  );

  const shouldShowVideo = hasVideoTracks && !isVideoOff;

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("[VideoTile] Autoplay prevented or delayed:", err);
          });
        }
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, shouldShowVideo]);

  // Click handler to manually resume video/audio if desktop browser blocked autoplay
  const handleTileClick = () => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      onClick={handleTileClick}
      className={`
        group relative bg-zoom-dark-tile rounded-xl overflow-hidden flex items-center justify-center transition-all duration-200 min-h-0 min-w-0 max-h-full max-w-full
        ${isPinned ? "ring-2 ring-amber-400 shadow-lg" : isActiveSpeaker ? "ring-2 ring-zoom-blue" : ""}
        ${className}
      `}
    >
      {/* Video Element - Keep mounted in layout so audio decoding stays active */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${isLocal ? "video-mirror" : ""} ${
          shouldShowVideo ? "block" : "opacity-0 pointer-events-none absolute inset-0"
        }`}
      />

      {/* Avatar Fallback Overlay when Video is Off */}
      {!shouldShowVideo && (
        <div className="w-full h-full flex items-center justify-center bg-zoom-dark-tile">
          <Avatar name={displayName} color={avatarColor} size="xl" />
        </div>
      )}

      {/* Floating Reaction Overlay */}
      {reactionEmoji && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <span className="text-6xl animate-bounce drop-shadow-lg scale-125 transition-transform">
            {reactionEmoji}
          </span>
        </div>
      )}

      {/* Hover Pin Action */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          title={isPinned ? "Unpin tile" : "Pin tile"}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
        >
          {isPinned ? <PinOff size={14} className="text-amber-400" /> : <Pin size={14} />}
        </button>
      )}

      {/* Name label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md
        bg-black/60 backdrop-blur-sm z-10">
        {isMuted && <MicOff size={12} className="text-zoom-red" />}
        {isPinned && <Pin size={10} className="text-amber-400" />}
        <span className="text-white text-xs font-medium truncate max-w-[140px]">
          {displayName} {isLocal && "(You)"}
        </span>
      </div>
    </div>
  );
}
