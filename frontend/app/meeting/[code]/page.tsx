"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Shield, Copy, Check, Lock } from "lucide-react";
import VideoTile from "@/components/meeting/VideoTile";
import ControlBar from "@/components/meeting/ControlBar";
import ParticipantsPanel from "@/components/meeting/ParticipantsPanel";
import ChatPanel from "@/components/meeting/ChatPanel";
import WhiteboardModal from "@/components/meeting/WhiteboardModal";
import InviteModal from "@/components/modals/InviteModal";
import { useMeetingStore } from "@/store/meetingStore";
import { useMediaStore } from "@/store/mediaStore";
import { SignalingSocket } from "@/lib/socket";
import { WebRTCManager } from "@/lib/webrtc";
import { api } from "@/lib/api";
import { JoinMeetingResponse } from "@/types";

export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const {
    currentMeeting, instanceId, participantId, displayName, isHost, isLocked, meetingCode,
    participants, chatMessages, pinnedParticipantId, reactions,
    showParticipants, showChat,
    elapsedSeconds,
    setMeetingSession, setIsHost, setIsLocked, addParticipant, removeParticipant,
    updateParticipantMuteState, updateParticipantStream,
    setPinnedParticipant, setParticipantReaction,
    addChatMessage, toggleParticipants, toggleChat,
    setElapsed, reset: resetMeeting,
  } = useMeetingStore();

  const {
    localStream, isMuted, isVideoOff, isScreenSharing,
    toggleMute, toggleVideo, setScreenSharing, setLocalStream,
    reset: resetMedia,
  } = useMediaStore();

  const socketRef = useRef<SignalingSocket | null>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [postMeeting, setPostMeeting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [admissionQueue, setAdmissionQueue] = useState<Array<{ participant_id: string; display_name: string }>>([]);

  // ─── Lock body scrolling in meeting room ──────────────────────────────
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  // ─── Restore media stream if null ─────────────────────────────────────────
  useEffect(() => {
    if (!localStream && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        .then((stream) => setLocalStream(stream))
        .catch(() => {
          navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => setLocalStream(stream))
            .catch(() => {
              navigator.mediaDevices
                ?.getUserMedia({ video: false, audio: true })
                .then((stream) => setLocalStream(stream))
                .catch(() => console.warn("No camera/mic permission"));
            });
        });
    }
  }, [localStream, setLocalStream]);

  // ─── Initialize session from sessionStorage ──────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("meetingSession");
    if (stored) {
      const session = JSON.parse(stored) as JoinMeetingResponse & { meetingCode: string };
      setMeetingSession(session);
      sessionStorage.removeItem("meetingSession");
    } else if (!instanceId) {
      router.push(`/meeting/${code}/lobby`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ─── Connect WebSocket + WebRTC ──────────────────────────────────────────
  useEffect(() => {
    if (!instanceId || !participantId) return;

    const socket = new SignalingSocket(instanceId);
    socketRef.current = socket;

    const rtcManager = new WebRTCManager(
      socket,
      (remoteParticipantId, stream) => {
        updateParticipantStream(remoteParticipantId, stream);
      },
      (remoteParticipantId) => {
        removeParticipant(remoteParticipantId);
      },
    );
    rtcRef.current = rtcManager;

    if (localStream) {
      rtcManager.setLocalStream(localStream);
    }

    async function connect() {
      try {
        await socket.connect();

        socket.send({
          type: "join-room",
          participant_id: participantId,
          display_name: displayName || currentMeeting?.host?.name || "User",
          is_host: isHost,
        });

        socket.on("mute-state", (msg) => {
          updateParticipantMuteState(
            msg.participant_id as string,
            msg.mute_type as "audio" | "video",
            msg.muted as boolean,
          );
        });

        socket.on("chat-message", (msg) => {
          addChatMessage({
            participant_id: msg.participant_id as string,
            display_name: msg.display_name as string,
            message: msg.message as string,
            sent_at: msg.sent_at as string,
          });
          useMeetingStore.getState().openChat();
        });

        socket.on("screen-share-state", (msg) => {
          const pid = msg.participant_id as string;
          const sharing = msg.sharing as boolean;
          if (sharing) {
            setPinnedParticipant(pid);
          } else {
            setPinnedParticipant(null);
          }
        });

        socket.on("reaction", (msg) => {
          const pid = msg.participant_id as string;
          const emoji = msg.emoji as string;
          setParticipantReaction(pid, emoji);
          setTimeout(() => {
            setParticipantReaction(pid, "");
          }, 2500);
        });

        socket.on("host-changed", (msg) => {
          const newHostId = msg.new_host_participant_id as string;
          if (newHostId === participantId) {
            setIsHost(true);
          }
        });

        socket.on("admission_request", (msg) => {
          setAdmissionQueue((prev) => [
            ...prev.filter((p) => p.participant_id !== msg.participant_id),
            {
              participant_id: msg.participant_id as string,
              display_name: msg.display_name as string,
            },
          ]);
        });

  socket.on("participant-joined", (msg) => {
          if (msg.participant_id !== participantId) {
            addParticipant({
              id: msg.participant_id as string,
              channel_name: msg.channel_name as string,
              participant_id: msg.participant_id as string,
              display_name: msg.display_name as string,
              is_host: msg.is_host as boolean,
              is_muted: false,
              is_video_off: false,
            });
          }
        });

        socket.on("existing-participants", (msg) => {
          const existing = msg.participants as Array<{
            channel_name: string;
            participant_id: string;
            display_name: string;
            is_host: boolean;
          }>;
          existing.forEach((p) => {
            if (p.participant_id !== participantId) {
              addParticipant({
                id: p.participant_id,
                channel_name: p.channel_name,
                participant_id: p.participant_id,
                display_name: p.display_name,
                is_host: p.is_host,
                is_muted: false,
                is_video_off: false,
              });
            }
          });
        });

        socket.on("participant-left", (msg) => {
          removeParticipant(msg.participant_id as string);
        });

        socket.on("host-action", (msg) => {
          const action = msg.action as string;
          if (action === "mute-all" || action === "mute") {
            const mediaStore = useMediaStore.getState();
            if (!mediaStore.isMuted) {
              mediaStore.setMuted(true);
              socketRef.current?.send({
                type: "mute-state",
                mute_type: "audio",
                muted: true,
              });
            }
          } else if (action === "remove" || action === "end-meeting") {
            handleLeave();
          }
        });

      } catch (err) {
        console.error("Failed to connect signaling socket:", err);
      }
    }

    connect();

    return () => {
      rtcManager.destroy();
      socket.disconnect();
      useMediaStore.getState().reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, participantId]);

  // ─── Elapsed timer ────────────────────────────────────────────────────────
  const timerStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (!instanceId) return;
    if (!timerStartRef.current) {
      timerStartRef.current = Date.now() - elapsedSeconds * 1000;
    }
    const startMs = timerStartRef.current;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  // ─── Auto-hide controls ──────────────────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = () => {
      setControlsVisible(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
    };

    window.addEventListener("mousemove", handleMouseMove);
    handleMouseMove();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleToggleMute = useCallback(() => {
    toggleMute();
    socketRef.current?.send({
      type: "mute-state",
      mute_type: "audio",
      muted: !isMuted,
    });
  }, [isMuted, toggleMute]);

  const handleToggleVideo = useCallback(() => {
    toggleVideo();
    socketRef.current?.send({
      type: "mute-state",
      mute_type: "video",
      muted: !isVideoOff,
    });
  }, [isVideoOff, toggleVideo]);

  const handleToggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      const mediaStore = useMediaStore.getState();
      if (mediaStore.screenStream) {
        mediaStore.screenStream.getTracks().forEach((t) => t.stop());
      }
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack && rtcRef.current) {
          await rtcRef.current.replaceVideoTrack(videoTrack);
        }
      }
      setScreenSharing(false);
      setPinnedParticipant(null);
      socketRef.current?.send({ type: "screen-share-state", sharing: false });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        useMediaStore.getState().setScreenStream(screenStream);

        const screenTrack = screenStream.getVideoTracks()[0];
        if (rtcRef.current) {
          await rtcRef.current.replaceVideoTrack(screenTrack);
        }

        screenTrack.onended = async () => {
          if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack && rtcRef.current) {
              await rtcRef.current.replaceVideoTrack(videoTrack);
            }
          }
          setScreenSharing(false);
          setPinnedParticipant(null);
          socketRef.current?.send({ type: "screen-share-state", sharing: false });
        };

        setScreenSharing(true);
        if (participantId) setPinnedParticipant(participantId);
        socketRef.current?.send({ type: "screen-share-state", sharing: true });
      } catch {
        // User cancelled picker
      }
    }
  }, [isScreenSharing, localStream, setScreenSharing]);

  const handleSendReaction = useCallback((emoji: string) => {
    socketRef.current?.send({ type: "reaction", emoji });
    if (participantId) {
      setParticipantReaction(participantId, emoji);
      setTimeout(() => {
        setParticipantReaction(participantId, "");
      }, 2500);
    }
  }, [participantId, setParticipantReaction]);

  const handleLeave = useCallback(async () => {
    if (meetingCode && participantId) {
      try {
        await api.leaveMeeting(meetingCode, participantId);
      } catch {
        // Best effort
      }
    }
    rtcRef.current?.destroy();
    socketRef.current?.disconnect();
    useMediaStore.getState().reset();
    setPostMeeting(true);
  }, [meetingCode, participantId]);

  const handleSendChat = useCallback((message: string) => {
    socketRef.current?.send({ type: "chat-message", message });
    addChatMessage({
      participant_id: participantId || "",
      display_name: displayName || "You",
      message,
      sent_at: new Date().toISOString(),
    });
  }, [participantId, displayName, addChatMessage]);

  const handleMuteAll = useCallback(() => {
    socketRef.current?.send({ type: "host-action", action: "mute-all" });
    const store = useMeetingStore.getState();
    store.participants.forEach((p) => {
      store.updateParticipantMuteState(p.participant_id, "audio", true);
    });
  }, []);

  const handleMakeHost = useCallback((pid: string) => {
    socketRef.current?.send({
      type: "host-action",
      action: "make-host",
      target_participant_id: pid,
    });
  }, []);

  const handleToggleLockMeeting = useCallback(async () => {
    if (!meetingCode) return;
    try {
      const res = await api.lockMeeting(meetingCode);
      setIsLocked(res.is_locked);
    } catch (e) {
      console.error("Failed to toggle lock meeting:", e);
    }
  }, [meetingCode, setIsLocked]);

  const handleMuteParticipant = useCallback((pid: string) => {
    socketRef.current?.send({
      type: "host-action",
      action: "mute-participant",
      target_participant_id: pid,
    });
    useMeetingStore.getState().updateParticipantMuteState(pid, "audio", true);
  }, []);

  const handleRemoveParticipant = useCallback((pid: string) => {
    socketRef.current?.send({
      type: "host-action",
      action: "remove-participant",
      target_participant_id: pid,
    });
    removeParticipant(pid);
  }, [removeParticipant]);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/meeting/${code}/lobby`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEndMeetingForAll = useCallback(() => {
    socketRef.current?.send({
      type: "host-action",
      action: "end-meeting",
    });
    handleLeave();
  }, [handleLeave]);

  // ─── Post-meeting screen ─────────────────────────────────────────────────
  if (postMeeting) {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return (
      <div className="min-h-screen bg-zoom-dark flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-zoom-dark-panel rounded-full flex items-center justify-center">
            <Shield size={28} className="text-zoom-blue" />
          </div>
          <h1 className="text-white text-2xl font-bold mb-2">You left the meeting</h1>
          <p className="text-gray-400 text-sm mb-1">
            {currentMeeting?.topic || "Meeting"}
          </p>
          <p className="text-gray-500 text-xs mb-8">
            Duration: {mins}m {secs}s
          </p>
          <button
            onClick={() => {
              useMediaStore.getState().reset();
              resetMeeting();
              router.push("/");
            }}
            className="px-6 py-2.5 bg-zoom-blue text-white rounded-md font-semibold
              hover:bg-zoom-blueHover transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const remoteParticipants = participants.filter((p) => p.participant_id !== participantId);
  const totalParticipants = remoteParticipants.length + 1;

  const hours = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const timerStr = hours > 0
    ? `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  // Check if a tile is pinned
  const pinnedTileId = pinnedParticipantId;

  // Grid layout classes for Real Zoom Gallery View
  let gridClass = "grid-cols-1 grid-rows-1";
  if (!pinnedTileId) {
    if (totalParticipants === 2) gridClass = "grid-cols-1 md:grid-cols-2 grid-rows-1 md:grid-rows-1";
    else if (totalParticipants >= 3 && totalParticipants <= 4) gridClass = "grid-cols-2 grid-rows-2";
    else if (totalParticipants >= 5 && totalParticipants <= 6) gridClass = "grid-cols-3 grid-rows-2";
    else if (totalParticipants >= 7 && totalParticipants <= 9) gridClass = "grid-cols-3 grid-rows-3";
    else if (totalParticipants >= 10) gridClass = "grid-cols-4 grid-rows-3";
  }

  return (
    <div className="fixed inset-0 h-screen h-[100dvh] w-screen bg-zoom-dark flex flex-col overflow-hidden select-none z-30">
      {/* Real-Time Admission Request Banner for Host */}
      {isHost && admissionQueue.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-zoom-blue shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-5 animate-bounce-short text-white backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zoom-blue/20 flex items-center justify-center text-zoom-blue font-bold">
              {admissionQueue[0].display_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold">{admissionQueue[0].display_name}</p>
              <p className="text-xs text-gray-400">wants to join this meeting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const pid = admissionQueue[0].participant_id;
                socketRef.current?.send({
                  type: "admit_participant",
                  target_participant_id: pid,
                });
                setAdmissionQueue((prev) => prev.filter((p) => p.participant_id !== pid));
              }}
              className="px-4 py-1.5 bg-zoom-blue hover:bg-zoom-blue-hover text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
            >
              Admit
            </button>
            <button
              onClick={() => {
                const pid = admissionQueue[0].participant_id;
                socketRef.current?.send({
                  type: "deny_participant",
                  target_participant_id: pid,
                });
                setAdmissionQueue((prev) => prev.filter((p) => p.participant_id !== pid));
              }}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Deny
            </button>
          </div>
        </div>
      )}
      {/* Top Header Bar */}
      <div className="h-12 bg-zoom-dark-panel/90 backdrop-blur flex items-center justify-between px-4 z-30
        border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-zoom-green rounded-full animate-pulse" />
          <span className="text-white text-sm font-semibold truncate max-w-[200px] sm:max-w-[280px]">
            {currentMeeting?.topic || "Meeting"}
          </span>
          {isLocked && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-700/50">
              <Lock size={10} /> Locked
            </span>
          )}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs text-zoom-blue hover:text-blue-400 transition-colors ml-1 cursor-pointer"
            title="Copy Invite Link"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copiedLink ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-xs font-mono bg-black/40 px-2 py-1 rounded">
            {timerStr}
          </span>
        </div>
      </div>

      {/* Main Grid & Side Panels */}
      <div className="flex-1 flex overflow-hidden relative min-h-0 min-w-0">
        <div className="flex-1 p-3 pb-20 overflow-hidden flex items-center justify-center min-h-0 min-w-0">
          {pinnedTileId ? (
            /* Spotlight Mode Layout */
            <div className="flex-1 h-full w-full flex flex-col md:flex-row gap-3 overflow-hidden min-h-0 min-w-0">
              {/* Primary Pinned Spotlight View */}
              <div className="flex-1 h-full min-h-0 min-w-0">
                {pinnedTileId === participantId ? (
                  <VideoTile
                    participantId={participantId || "local"}
                    stream={localStream}
                    displayName={displayName || "You"}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isLocal={true}
                    isPinned={true}
                    reactionEmoji={reactions[participantId || "local"] || null}
                    onTogglePin={() => setPinnedParticipant(null)}
                    className="h-full w-full min-h-0 min-w-0"
                  />
                ) : (
                  (() => {
                    const pinnedParticipant = remoteParticipants.find(p => p.participant_id === pinnedTileId);
                    return pinnedParticipant ? (
                      <VideoTile
                        participantId={pinnedParticipant.participant_id}
                        stream={pinnedParticipant.stream || null}
                        displayName={pinnedParticipant.display_name}
                        isMuted={pinnedParticipant.is_muted}
                        isVideoOff={pinnedParticipant.is_video_off}
                        isPinned={true}
                        reactionEmoji={reactions[pinnedParticipant.participant_id] || null}
                        onTogglePin={() => setPinnedParticipant(null)}
                        className="h-full w-full min-h-0 min-w-0"
                      />
                    ) : null;
                  })()
                )}
              </div>

              {/* Side Gallery Carousel */}
              <div className="w-full md:w-64 h-32 md:h-full flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto shrink-0 min-h-0 min-w-0">
                {pinnedTileId !== participantId && (
                  <VideoTile
                    participantId={participantId || "local"}
                    stream={localStream}
                    displayName={displayName || "You"}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    isLocal={true}
                    reactionEmoji={reactions[participantId || "local"] || null}
                    onTogglePin={() => setPinnedParticipant(participantId)}
                    className="h-full md:h-36 w-44 md:w-full shrink-0 min-h-0 min-w-0"
                  />
                )}
                {remoteParticipants.filter(p => p.participant_id !== pinnedTileId).map(p => (
                  <VideoTile
                    key={p.participant_id}
                    participantId={p.participant_id}
                    stream={p.stream || null}
                    displayName={p.display_name}
                    isMuted={p.is_muted}
                    isVideoOff={p.is_video_off}
                    reactionEmoji={reactions[p.participant_id] || null}
                    onTogglePin={() => setPinnedParticipant(p.participant_id)}
                    className="h-full md:h-36 w-44 md:w-full shrink-0 min-h-0 min-w-0"
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Standard Grid Layout */
            <div className={`grid ${gridClass} gap-3 h-full w-full min-h-0 min-w-0`}>
              <VideoTile
                participantId={participantId || "local"}
                stream={localStream}
                displayName={displayName || "You"}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isLocal={true}
                reactionEmoji={reactions[participantId || "local"] || null}
                onTogglePin={() => setPinnedParticipant(participantId)}
                className="h-full w-full min-h-0 min-w-0"
              />

              {remoteParticipants.map((p) => (
                <VideoTile
                  key={p.participant_id}
                  participantId={p.participant_id}
                  stream={p.stream || null}
                  displayName={p.display_name}
                  isMuted={p.is_muted}
                  isVideoOff={p.is_video_off}
                  reactionEmoji={reactions[p.participant_id] || null}
                  onTogglePin={() => setPinnedParticipant(p.participant_id)}
                  className="h-full w-full min-h-0 min-w-0"
                />
              ))}
            </div>
          )}
        </div>

        {/* Side Panels */}
        {showParticipants && (
          <ParticipantsPanel
            participants={remoteParticipants}
            localDisplayName={displayName || "You"}
            isHost={isHost}
            isLocked={isLocked}
            onMuteAll={handleMuteAll}
            onMuteParticipant={handleMuteParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onMakeHost={handleMakeHost}
            onToggleLockMeeting={handleToggleLockMeeting}
            onClose={toggleParticipants}
          />
        )}

        {showChat && (
          <ChatPanel
            messages={chatMessages}
            localParticipantId={participantId || ""}
            onSendMessage={handleSendChat}
            onClose={toggleChat}
          />
        )}
      </div>

      {/* Control Bar */}
      <ControlBar
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onSendReaction={handleSendReaction}
        onLeave={handleLeave}
        onEndMeetingForAll={handleEndMeetingForAll}
        onToggleWhiteboard={() => setShowWhiteboard(true)}
        onToggleInvite={() => setShowInviteModal(true)}
        isHost={isHost}
        participantCount={totalParticipants}
        visible={controlsVisible}
      />

      {/* In-Meeting Whiteboard Modal */}
      <WhiteboardModal isOpen={showWhiteboard} onClose={() => setShowWhiteboard(false)} />

      {/* Invite Participants Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingCode={code}
        topic={currentMeeting?.topic}
        hostName={currentMeeting?.host_name}
      />
    </div>
  );
}
