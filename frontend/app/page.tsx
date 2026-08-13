"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import ActionButtons from "@/components/dashboard/ActionButtons";
import UpcomingList from "@/components/dashboard/UpcomingList";
import RecentList from "@/components/dashboard/RecentList";
import JoinMeetingModal from "@/components/modals/JoinMeetingModal";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import { api } from "@/lib/api";
import { User, UpcomingMeetingGroup, RecentMeeting } from "@/types";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingMeetingGroup[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    async function load() {
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
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
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

  const refreshData = async () => {
    const [upcomingData, recentData] = await Promise.all([
      api.getUpcomingMeetings(),
      api.getRecentMeetings(),
    ]);
    setUpcoming(upcomingData);
    setRecent(recentData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zoom-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-zoom-blue/30 border-t-zoom-blue rounded-full animate-spin" />
          <p className="text-sm text-zoom-text-secondary">Loading...</p>
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
          {/* Greeting */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-zoom-text-primary">
              {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-zoom-text-secondary mt-1">
              {currentTime.format("dddd, MMMM D, YYYY")}
              <span className="mx-2">|</span>
              {currentTime.format("h:mm:ss A")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <ActionButtons
              onJoin={() => setJoinModalOpen(true)}
              onSchedule={() => setScheduleModalOpen(true)}
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {/* Upcoming Meetings */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-zoom-border p-5">
                <h2 className="text-base font-bold text-zoom-text-primary mb-4">
                  Upcoming Meetings
                </h2>
                <UpcomingList groups={upcoming} onStartMeeting={handleStartMeeting} />
              </div>
            </div>

            {/* Recent Meetings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-zoom-border p-5">
                <h2 className="text-base font-bold text-zoom-text-primary mb-4">
                  Recent Meetings
                </h2>
                <RecentList meetings={recent} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <JoinMeetingModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <ScheduleMeetingModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onScheduled={refreshData}
      />
    </div>
  );
}
