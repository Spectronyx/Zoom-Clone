"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Calendar as CalIcon, Plus, Play, Trash2, Clock, Video, Copy, Check, Search } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { User, UpcomingMeetingGroup, RecentMeeting } from "@/types";

export default function MeetingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingMeetingGroup[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPmi, setCopiedPmi] = useState(false);

  const loadData = async () => {
    try {
      const [userData, upcomingData, recentData] = await Promise.all([
        api.getCurrentUser(),
        api.getUpcomingMeetings(),
        api.getRecentMeetings(),
      ]);
      setUser(userData);
      setUpcoming(upcomingData);
      setRecent(recentData);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNewMeeting = async () => {
    try {
      const meeting = await api.createInstantMeeting();
      const code = meeting.meeting_code.replace(/\s/g, "");
      router.push(`/meeting/${code}/lobby`);
    } catch (err) {
      console.error("Failed to create meeting:", err);
    }
  };

  const handleStartMeeting = (meetingCode: string) => {
    const code = meetingCode.replace(/\s/g, "");
    router.push(`/meeting/${code}/lobby`);
  };

  const handleCancelMeeting = async (meetingCode: string) => {
    if (!confirm("Are you sure you want to cancel this meeting?")) return;
    try {
      await api.cancelMeeting(meetingCode);
      await loadData();
    } catch (err) {
      console.error("Failed to cancel meeting:", err);
    }
  };

  const handleCopyPmi = () => {
    const pmiLink = `http://localhost:3000/meeting/${user?.id || "pmi"}`;
    navigator.clipboard.writeText(pmiLink);
    setCopiedPmi(true);
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  const allUpcomingMeetings = upcoming.flatMap((g) => g.meetings);
  const filteredUpcoming = allUpcomingMeetings.filter((m) =>
    m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecent = recent.filter((m) =>
    m.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.meeting_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zoom-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-zoom-blue/30 border-t-zoom-blue rounded-full animate-spin" />
          <p className="text-sm text-zoom-text-secondary">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zoom-surface">
      <Sidebar />
      <div className="ml-[68px]">
        <TopNav user={user} onNewMeeting={handleNewMeeting} />

        <main className="max-w-[960px] mx-auto px-6 py-8">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zoom-text-primary flex items-center gap-2">
                <CalIcon className="text-zoom-blue" size={28} />
                Meetings Dashboard
              </h1>
              <p className="text-sm text-zoom-text-secondary mt-0.5">
                Manage your scheduled video conferences and past meeting history
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setScheduleModalOpen(true)}
              className="flex items-center gap-2 self-start sm:self-auto"
            >
              <Plus size={16} /> Schedule Meeting
            </Button>
          </div>

          {/* Personal Meeting ID Card */}
          <div className="bg-white rounded-xl border border-zoom-border p-5 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zoom-blue/10 text-zoom-blue rounded-xl flex items-center justify-center">
                  <Video size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zoom-text-primary">Personal Meeting ID (PMI)</h2>
                    <span className="text-[10px] font-bold bg-zoom-blue/10 text-zoom-blue px-2 py-0.5 rounded-full">
                      Always Available
                    </span>
                  </div>
                  <p className="text-xs text-zoom-text-secondary mt-0.5 font-mono">
                    ID: {user?.id?.slice(0, 8) || "849-204-1102"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyPmi} className="flex items-center gap-1.5">
                  {copiedPmi ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedPmi ? "Copied Link" : "Copy Invite"}</span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleNewMeeting} className="flex items-center gap-1.5">
                  <Play size={14} /> Start PMI Meeting
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zoom-border pb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "upcoming"
                    ? "border-zoom-blue text-zoom-blue"
                    : "border-transparent text-zoom-text-secondary hover:text-zoom-text-primary"
                }`}
              >
                Upcoming Meetings ({allUpcomingMeetings.length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === "past"
                    ? "border-zoom-blue text-zoom-blue"
                    : "border-transparent text-zoom-text-secondary hover:text-zoom-text-primary"
                }`}
              >
                Past Meetings ({recent.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zoom-text-secondary" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zoom-border bg-white text-zoom-text-primary focus:outline-none focus:ring-1 focus:ring-zoom-blue"
              />
            </div>
          </div>

          {/* Upcoming Meetings View */}
          {activeTab === "upcoming" && (
            <div className="space-y-3">
              {filteredUpcoming.length === 0 ? (
                <div className="bg-white rounded-xl border border-zoom-border p-12 text-center">
                  <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-zoom-text-primary">No upcoming meetings scheduled</p>
                  <p className="text-xs text-zoom-text-secondary mt-1">Schedule a meeting to invite colleagues and participants.</p>
                  <Button variant="primary" size="sm" onClick={() => setScheduleModalOpen(true)} className="mt-4">
                    Schedule Now
                  </Button>
                </div>
              ) : (
                filteredUpcoming.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-zoom-border p-4 flex items-center justify-between hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-12 bg-zoom-blue rounded-full" />
                      <div>
                        <h3 className="text-sm font-bold text-zoom-text-primary">{m.topic}</h3>
                        <div className="flex items-center gap-3 text-xs text-zoom-text-secondary mt-1">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {m.meeting_code}
                          </span>
                          <span>
                            {m.scheduled_start_at ? dayjs(m.scheduled_start_at).format("MMM D, YYYY · h:mm A") : "TBD"}
                          </span>
                          <span>{m.duration_minutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleCancelMeeting(m.meeting_code)}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => handleStartMeeting(m.meeting_code)} className="flex items-center gap-1">
                        <Play size={14} /> Start
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Past Meetings View */}
          {activeTab === "past" && (
            <div className="space-y-3">
              {filteredRecent.length === 0 ? (
                <div className="bg-white rounded-xl border border-zoom-border p-12 text-center">
                  <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-zoom-text-primary">No past meeting history</p>
                  <p className="text-xs text-zoom-text-secondary mt-1">Completed meeting sessions will appear here.</p>
                </div>
              ) : (
                filteredRecent.map((m) => (
                  <div
                    key={m.instance_id}
                    className="bg-white rounded-xl border border-zoom-border p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-zoom-text-primary">{m.topic}</h3>
                      <div className="flex items-center gap-3 text-xs text-zoom-text-secondary mt-1">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {m.meeting_code}
                        </span>
                        <span>Ended {dayjs(m.ended_at).format("MMM D, YYYY · h:mm A")}</span>
                        <span>{Math.ceil((m.duration_seconds || 0) / 60)} mins duration</span>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleStartMeeting(m.meeting_code)}>
                      Rejoin
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <ScheduleMeetingModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onScheduled={loadData}
      />
    </div>
  );
}
