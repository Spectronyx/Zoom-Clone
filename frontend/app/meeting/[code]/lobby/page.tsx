"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, ArrowLeft, Loader2, UserCheck, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { useMediaStore } from "@/store/mediaStore";
import { SignalingSocket } from "@/lib/socket";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const code = params.code as string;
  const nameFromUrl = searchParams.get("name");

  const videoRef = useRef<HTMLVideoElement>(null);
  const isJoiningRef = useRef(false);
  const socketRef = useRef<SignalingSocket | null>(null);

  const [displayName, setDisplayName] = useState(() => {
    if (nameFromUrl) return nameFromUrl;
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("meetclone_user");
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.name) return u.name;
        } catch {}
      }
    }
    return "";
  });

  const [meetingTopic, setMeetingTopic] = useState("");
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(true);
  const [status, setStatus] = useState<"idle" | "joining" | "waiting" | "denied">("idle");
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
        const validation = await api.validateMeeting(code);
        if (!validation.valid) {
          setError(validation.reason || "Invalid meeting");
          return;
        }
        if (validation.meeting) {
          setMeetingTopic(validation.meeting.topic);
          setIsWaitingRoomEnabled(validation.meeting.waiting_room_enabled ?? true);
        }
      } catch {
        setError("Could not validate meeting");
        return;
      }

      // Media preview
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch {
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
      if (!isJoiningRef.current) {
        const currentStream = useMediaStore.getState().localStream;
        if (currentStream) {
          currentStream.getTracks().forEach((t) => t.stop());
        }
        useMediaStore.getState().setLocalStream(null);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
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
    if (!displayName.trim()) return;

    setStatus("joining");
    try {
      const user = await api.getCurrentUser();
      const result = await api.joinMeeting(code, {
        display_name: displayName.trim(),
        user_id: user.id,
      });

      // If user is host or waiting room is disabled, enter directly!
      if (result.is_host || !isWaitingRoomEnabled) {
        isJoiningRef.current = true;
        sessionStorage.setItem("meetingSession", JSON.stringify({
          ...result,
          meetingCode: code,
        }));
        router.push(`/meeting/${code}`);
        return;
      }

      // Otherwise, enter Waiting Room mode & ask host for admission
      setStatus("waiting");
      const socket = new SignalingSocket(result.instance_id);
      socketRef.current = socket;

      await socket.connect();

      socket.on("admission_result", (msg) => {
        const targetId = (msg.target_participant_id || msg.participant_id) as string;
        if (!targetId || targetId === result.participant_id) {
          if (msg.approved) {
            isJoiningRef.current = true;
            sessionStorage.setItem("meetingSession", JSON.stringify({
              ...result,
              meetingCode: code,
            }));
            socket.disconnect();
            router.push(`/meeting/${code}`);
          } else {
            setStatus("denied");
            socket.disconnect();
          }
        }
      });

      socket.send({
        type: "request_admission",
        participant_id: result.participant_id,
        display_name: displayName.trim(),
      });
    } catch (err) {
      console.error("Failed to join:", err);
      setError("Failed to join meeting");
      setStatus("idle");
    }
  }, [code, displayName, isWaitingRoomEnabled, router]);

  const handleCancel = () => {
    resetMedia();
    if (socketRef.current) socketRef.current.disconnect();
    router.push("/");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
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

  // Denied screen
  if (status === "denied") {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-zoom-dark-panel p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <ShieldAlert size={32} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Entry Declined</h2>
          <p className="text-gray-400 text-sm mb-6">
            The host declined your request to join this meeting.
          </p>
          <Button variant="primary" className="w-full" onClick={handleCancel}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Waiting Room screen
  if (status === "waiting") {
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-zoom-dark-panel p-8 rounded-2xl border border-zoom-blue/30 shadow-2xl animate-fade-in flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-zoom-blue/20 animate-ping" />
            <div className="w-16 h-16 rounded-full bg-zoom-blue/10 border border-zoom-blue/40 flex items-center justify-center">
              <UserCheck size={32} className="text-zoom-blue" />
            </div>
          </div>
          <h2 className="text-white text-xl font-bold mb-1">Asking to join...</h2>
          <p className="text-gray-300 text-sm font-medium mb-4">
            You&apos;ll join the meeting when someone lets you in.
          </p>
          <div className="bg-slate-900/60 rounded-xl px-4 py-3 w-full border border-gray-700/60 mb-6">
            <p className="text-xs text-gray-400">Joining as</p>
            <p className="text-white font-semibold text-sm">{displayName}</p>
            <p className="text-xs text-zoom-blue mt-1 font-medium">{meetingTopic}</p>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleCancel}>
            Cancel Request
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
          <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase">Ready to join?</p>
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
              <Avatar name={displayName || "Guest"} color="#2D8CFF" size="xl" />
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
        <div className="flex flex-col items-center gap-3 w-full max-w-[340px]">
          <div className="w-full text-left">
            <label className="block text-xs font-semibold text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What's your name?"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-zoom-dark-panel border border-gray-600
                text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-zoom-blue/40
                focus:border-zoom-blue text-center font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full mt-1">
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
              className="w-2/3 flex items-center justify-center gap-2"
              onClick={handleJoin}
              disabled={status === "joining" || !displayName.trim()}
            >
              {status === "joining" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connecting...
                </>
              ) : isWaitingRoomEnabled ? (
                "Ask to Join"
              ) : (
                "Join Meeting"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
