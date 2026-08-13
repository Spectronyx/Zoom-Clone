"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { useMediaStore } from "@/store/mediaStore";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const nameFromUrl = searchParams.get("name");

  const videoRef = useRef<HTMLVideoElement>(null);
  const isJoiningRef = useRef(false);

  const [displayName, setDisplayName] = useState(nameFromUrl || "Rajneesh Sharma");
  const [meetingTopic, setMeetingTopic] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    localStream, setLocalStream,
    isMuted, isVideoOff,
    toggleMute, toggleVideo,
    setCameraError, cameraError,
    reset: resetMedia,
  } = useMediaStore();

  // Validate meeting + get media on mount
  useEffect(() => {
    async function init() {
      try {
        // Validate meeting exists
        const validation = await api.validateMeeting(code);
        if (!validation.valid) {
          setError(validation.reason || "Invalid meeting");
          return;
        }
        if (validation.meeting) {
          setMeetingTopic(validation.meeting.topic);
        }
      } catch {
        setError("Could not validate meeting");
        return;
      }

      // Get media preview
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (err) {
        setCameraError("Camera/microphone permission denied");
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setLocalStream(audioStream);
        } catch {
          setCameraError("No media access available");
        }
      }
    }
    init();

    return () => {
      // If user navigates away without joining, stop camera and mic tracks immediately!
      if (!isJoiningRef.current) {
        const currentStream = useMediaStore.getState().localStream;
        if (currentStream) {
          currentStream.getTracks().forEach((t) => t.stop());
        }
        useMediaStore.getState().setLocalStream(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    isJoiningRef.current = true;
    try {
      const user = await api.getCurrentUser();
      const result = await api.joinMeeting(code, {
        display_name: displayName,
        user_id: user.id,
      });

      // Store join info in sessionStorage for the meeting room
      sessionStorage.setItem("meetingSession", JSON.stringify({
        ...result,
        meetingCode: code,
      }));

      router.push(`/meeting/${code}`);
    } catch (err) {
      console.error("Failed to join:", err);
      setError("Failed to join meeting");
      setJoining(false);
      isJoiningRef.current = false;
    }
  }, [code, displayName, router]);

  const handleCancel = () => {
    resetMedia();
    router.push("/");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-zoom-dark-panel rounded-full flex items-center justify-center">
            <VideoOff size={28} className="text-zoom-red" />
          </div>
          <p className="text-white text-lg font-semibold mb-2">Cannot join meeting</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Button variant="primary" onClick={handleCancel}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zoom-dark flex flex-col items-center justify-center p-4">
      {/* Top Back / Cancel Bar */}
      <div className="absolute top-6 left-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} /> Cancel & Exit
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 animate-fade-in max-w-lg w-full">
        {/* Meeting Topic */}
        <div className="text-center">
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Pre-meeting Preview</p>
          <h1 className="text-white text-xl font-bold mt-1">{meetingTopic || "Meeting"}</h1>
        </div>

        {/* Video Preview */}
        <div className="relative w-full max-w-[480px] aspect-video bg-zoom-dark-panel rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
          {!isVideoOff && localStream?.getVideoTracks().length ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover video-mirror"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
              <Avatar name={displayName} color="#2D8CFF" size="xl" />
              <p className="text-xs text-gray-400 mt-2">Camera is turned off</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute bottom-3 left-3 right-3 bg-zoom-red/90 text-white text-xs rounded-md px-3 py-2">
              {cameraError}
            </div>
          )}
        </div>

        {/* Media Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              transition-all cursor-pointer shadow-md
              ${isMuted
                ? "bg-zoom-red hover:bg-zoom-red-hover"
                : "bg-zoom-dark-panel border border-gray-600 hover:bg-gray-700 text-white"
              }
            `}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? (
              <MicOff size={20} className="text-white" />
            ) : (
              <Mic size={20} className="text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center
              transition-all cursor-pointer shadow-md
              ${isVideoOff
                ? "bg-zoom-red hover:bg-zoom-red-hover"
                : "bg-zoom-dark-panel border border-gray-600 hover:bg-gray-700 text-white"
              }
            `}
            title={isVideoOff ? "Start Camera" : "Stop Camera"}
          >
            {isVideoOff ? (
              <VideoOff size={20} className="text-white" />
            ) : (
              <Video size={20} className="text-white" />
            )}
          </button>
        </div>

        {/* Name Input + Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[320px]">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-zoom-dark-panel border border-gray-600
              text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zoom-blue/40
              focus:border-zoom-blue text-center font-medium"
          />

          <div className="flex items-center gap-2 w-full">
            <Button
              variant="secondary"
              size="lg"
              className="w-1/3"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="w-2/3"
              onClick={handleJoin}
              disabled={joining || !displayName.trim()}
            >
              {joining ? "Joining..." : "Join Meeting"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
