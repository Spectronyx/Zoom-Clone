"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Video, Users as UsersIcon } from "lucide-react";
import { RecentMeeting } from "@/types";

dayjs.extend(relativeTime);

interface RecentListProps {
  meetings: RecentMeeting[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

export default function RecentList({ meetings }: RecentListProps) {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zoom-text-secondary text-sm">No recent meetings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {meetings.map((meeting) => (
        <div
          key={meeting.instance_id}
          className="flex items-center justify-between p-3 rounded-lg
            hover:bg-white hover:shadow-sm border border-transparent
            hover:border-zoom-border transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-zoom-surface rounded-lg flex items-center justify-center flex-shrink-0">
              <Video size={16} className="text-zoom-text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zoom-text-primary truncate">
                {meeting.topic}
              </p>
              <p className="text-xs text-zoom-text-secondary mt-0.5">
                {dayjs(meeting.started_at).fromNow()}
                <span className="mx-1">·</span>
                {formatDuration(meeting.duration_seconds)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-zoom-text-secondary flex-shrink-0">
            <UsersIcon size={12} />
            <span>{meeting.participant_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
