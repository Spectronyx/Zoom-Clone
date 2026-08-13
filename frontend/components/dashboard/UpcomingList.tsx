"use client";

import dayjs from "dayjs";
import { Clock, Play } from "lucide-react";
import { UpcomingMeetingGroup } from "@/types";
import Button from "@/components/ui/Button";

interface UpcomingListProps {
  groups: UpcomingMeetingGroup[];
  onStartMeeting: (meetingCode: string) => void;
}

export default function UpcomingList({ groups, onStartMeeting }: UpcomingListProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-zoom-surface rounded-full flex items-center justify-center">
          <Clock size={32} className="text-zoom-text-secondary/40" />
        </div>
        <p className="text-zoom-text-secondary text-sm">No upcoming meetings</p>
        <p className="text-zoom-text-secondary/60 text-xs mt-1">
          Schedule a meeting to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date Header */}
          <h3 className="text-xs font-bold text-zoom-text-secondary uppercase tracking-wider mb-3">
            {group.label}
          </h3>

          {/* Meeting Cards */}
          <div className="space-y-2">
            {group.meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-zoom-border
                  hover:border-zoom-blue/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1 h-10 bg-zoom-blue rounded-full flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zoom-text-primary truncate">
                      {meeting.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={12} className="text-zoom-text-secondary" />
                      <span className="text-xs text-zoom-text-secondary">
                        {meeting.scheduled_start_at
                          ? dayjs(meeting.scheduled_start_at).format("h:mm A")
                          : "TBD"}
                        {meeting.duration_minutes && (
                          <> · {meeting.duration_minutes} min</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onStartMeeting(meeting.meeting_code)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play size={14} /> Start
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
