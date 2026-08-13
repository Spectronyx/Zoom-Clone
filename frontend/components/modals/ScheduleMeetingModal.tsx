"use client";

import { useState } from "react";
import dayjs from "dayjs";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import { Copy, Check } from "lucide-react";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ScheduleMeetingModal({ isOpen, onClose, onScheduled }: ScheduleMeetingModalProps) {
  const [topic, setTopic] = useState("Rajneesh Sharma's Meeting");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(dayjs().add(1, "day").format("YYYY-MM-DD"));
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const scheduledAt = dayjs(`${date}T${time}`).toISOString();
      const meeting = await api.scheduleMeeting({
        topic,
        description: description || undefined,
        scheduled_start_at: scheduledAt,
        duration_minutes: duration,
      });
      setCreated(meeting);
      onScheduled();
    } catch (err) {
      console.error("Failed to schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!created) return;
    const inviteText = `Join MeetClone Meeting\n\nTopic: ${created.topic}\nTime: ${dayjs(created.scheduled_start_at).format("MMM D, YYYY h:mm A")}\n\nMeeting ID: ${created.meeting_code}\nPasscode: ${created.passcode}\n\nJoin Link: ${created.invite_link}`;
    await navigator.clipboard.writeText(inviteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCreated(null);
    setCopied(false);
    setTopic("Rajneesh Sharma's Meeting");
    setDescription("");
    setDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
    setTime("10:00");
    setDuration(60);
    onClose();
  };

  // Show confirmation if just created
  if (created) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Meeting Scheduled">
        <div className="space-y-4">
          <div className="bg-zoom-surface rounded-lg p-4 space-y-2">
            <p className="text-sm font-bold text-zoom-text-primary">{created.topic}</p>
            <p className="text-xs text-zoom-text-secondary">
              {dayjs(created.scheduled_start_at).format("dddd, MMMM D, YYYY")}
            </p>
            <p className="text-xs text-zoom-text-secondary">
              {dayjs(created.scheduled_start_at).format("h:mm A")} · {created.duration_minutes} min
            </p>
            <div className="pt-2 border-t border-zoom-border mt-2">
              <p className="text-xs text-zoom-text-secondary">
                Meeting ID: <span className="font-mono font-bold">{created.meeting_code}</span>
              </p>
              <p className="text-xs text-zoom-text-secondary">
                Passcode: <span className="font-mono font-bold">{created.passcode}</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCopyInvite}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Invitation"}
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Schedule Meeting" maxWidth="max-w-lg">
      <div className="space-y-4">
        <Input
          label="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div>
          <label className="block text-sm font-semibold text-zoom-text-primary mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-zoom-border
              bg-white text-zoom-text-primary placeholder:text-zoom-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-zoom-blue/30 focus:border-zoom-blue
              resize-none h-20"
            placeholder="Add a description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Start Time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zoom-text-primary mb-1.5">
            Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm rounded-md border border-zoom-border
              bg-white text-zoom-text-primary
              focus:outline-none focus:ring-2 focus:ring-zoom-blue/30 focus:border-zoom-blue"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>

        <div className="bg-zoom-surface rounded-lg p-3">
          <p className="text-xs text-zoom-text-secondary">
            Meeting ID will be generated automatically
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading || !topic.trim()}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
