"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinMeetingModal({ isOpen, onClose }: JoinMeetingModalProps) {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState("");
  const [displayName, setDisplayName] = useState("Rajneesh Sharma");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!meetingId.trim()) {
      setError("Please enter a meeting ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validation = await api.validateMeeting(meetingId.replace(/\s/g, ""));
      if (!validation.valid) {
        setError(validation.reason || "Invalid meeting ID");
        setLoading(false);
        return;
      }

      // Navigate to lobby
      const code = meetingId.replace(/\s/g, "");
      router.push(`/meeting/${code}/lobby?name=${encodeURIComponent(displayName)}`);
      onClose();
    } catch {
      setError("Invalid meeting ID or the meeting has ended");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Join Meeting">
      <div className="space-y-4">
        <Input
          label="Meeting ID or link"
          placeholder="Enter meeting ID"
          value={meetingId}
          onChange={(e) => {
            setMeetingId(e.target.value);
            setError(null);
          }}
          error={error || undefined}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
        />

        <Input
          label="Your Name"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <input type="checkbox" id="remember-name" defaultChecked className="accent-zoom-blue" />
          <label htmlFor="remember-name" className="text-xs text-zoom-text-secondary">
            Remember my name for future meetings
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleJoin}
            disabled={loading || !meetingId.trim()}
          >
            {loading ? "Validating..." : "Join"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
