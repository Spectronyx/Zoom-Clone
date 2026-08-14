"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Video, Calendar, Plus, Copy, Check, ExternalLink,
  ChevronDown, ChevronRight, MessageSquare, Shield, HelpCircle,
  FileText, Clock, Trash2, Play, User as UserIcon, Sparkles, Mic
} from "lucide-react";
import JoinMeetingModal from "@/components/modals/JoinMeetingModal";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import Toast from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { User, UpcomingMeetingGroup, RecentMeeting } from "@/types";

interface AuthenticatedDashboardProps {
  initialUser?: User | null;
}

export default function AuthenticatedDashboard({ initialUser }: AuthenticatedDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [upcoming, setUpcoming] = useState<UpcomingMeetingGroup[]>([]);
  const [recent, setRecent] = useState<RecentMeeting[]>([]);
  const [loading, setLoading] = useState(!initialUser);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [copiedPmi, setCopiedPmi] = useState(false);
  const [hostDropdownOpen, setHostDropdownOpen] = useState(false);
  const [webAppDropdownOpen, setWebAppDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState("home");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showComingSoon = (featureName: string) => {
    setToastMessage(`✨ ${featureName} is coming soon!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartInstantMeeting = async () => {
    try {
      const meeting = await api.createInstantMeeting();
      const code = meeting.meeting_code.replace(/\s/g, "");
      router.push(`/meeting/${code}/lobby`);
    } catch (err) {
      console.error("Failed to start instant meeting:", err);
    }
  };

  const handleStartMeetingByCode = (code: string) => {
    const cleanCode = code.replace(/\s/g, "");
    router.push(`/meeting/${cleanCode}/lobby`);
  };

  const handleCopyPmi = () => {
    const pmiCode = user?.id?.slice(0, 10).replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3") || "269 316 4104";
    navigator.clipboard.writeText(pmiCode);
    setCopiedPmi(true);
    setTimeout(() => setCopiedPmi(false), 2000);
  };

  const allUpcomingMeetings = upcoming.flatMap((g) => g.meetings);
  const pmiDisplay = user?.id ? `269 ${user.id.slice(0, 3)} ${user.id.slice(3, 7)}` : "269 316 4104";

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 font-sans select-none flex flex-col">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* ─── 1. TOP BLACK UTILITY HEADER ────────────────────────────────────── */}
      <div className="bg-[#0B1220] text-slate-300 text-[11px] px-6 py-1.5 flex items-center justify-end gap-6 font-medium">
        <button
          onClick={() => showComingSoon("Global Search")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <Search size={12} /> Search
        </button>
        <button
          onClick={() => showComingSoon("Support Center")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Support
        </button>
        <span className="text-slate-400">1.888.799.9666</span>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => showComingSoon("Contact Sales")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Contact Sales
        </button>
        <button
          onClick={() => showComingSoon("Request a Demo")}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Request a Demo
        </button>
      </div>

      {/* ─── 2. MAIN WHITE NAVIGATION BAR ─────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left Branding & Links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[#0B5CFF] font-black text-2xl tracking-tighter">
            zoom
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <div className="relative">
              <button
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                className="hover:text-[#0B5CFF] cursor-pointer flex items-center gap-1"
              >
                Products <ChevronDown size={12} />
              </button>
              {productsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 animate-in fade-in">
                  <button
                    onClick={() => {
                      setProductsDropdownOpen(false);
                      router.push("/meetings");
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium flex items-center justify-between"
                  >
                    Meetings <Video size={12} className="text-blue-500" />
                  </button>
                  <button
                    onClick={() => {
                      setProductsDropdownOpen(false);
                      router.push("/chat");
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium flex items-center justify-between"
                  >
                    Team Chat <MessageSquare size={12} className="text-indigo-500" />
                  </button>
                  <button
                    onClick={() => {
                      setProductsDropdownOpen(false);
                      router.push("/whiteboards");
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium flex items-center justify-between"
                  >
                    Whiteboards <FileText size={12} className="text-purple-500" />
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => showComingSoon("Solutions Catalog")} className="hover:text-[#0B5CFF] cursor-pointer">
              Solutions
            </button>
            <button onClick={() => showComingSoon("Resources & Documentation")} className="hover:text-[#0B5CFF] cursor-pointer">
              Resources
            </button>
            <button onClick={() => showComingSoon("Plans & Pricing")} className="hover:text-[#0B5CFF] cursor-pointer">
              Plans & Pricing
            </button>
          </nav>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="hover:text-[#0B5CFF] transition-colors cursor-pointer"
          >
            Schedule
          </button>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="hover:text-[#0B5CFF] transition-colors cursor-pointer"
          >
            Join
          </button>

          {/* Host Dropdown */}
          <div className="relative">
            <button
              onClick={() => setHostDropdownOpen(!hostDropdownOpen)}
              className="flex items-center gap-1 hover:text-[#0B5CFF] cursor-pointer"
            >
              Host <ChevronDown size={12} />
            </button>
            {hostDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 animate-in fade-in">
                <button
                  onClick={() => {
                    setHostDropdownOpen(false);
                    handleStartInstantMeeting();
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium"
                >
                  With Video On
                </button>
                <button
                  onClick={() => {
                    setHostDropdownOpen(false);
                    handleStartInstantMeeting();
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium"
                >
                  With Video Off
                </button>
                <button
                  onClick={() => {
                    setHostDropdownOpen(false);
                    handleStartInstantMeeting();
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium"
                >
                  Screen Share Only
                </button>
              </div>
            )}
          </div>

          {/* Web App Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWebAppDropdownOpen(!webAppDropdownOpen)}
              className="flex items-center gap-1 hover:text-[#0B5CFF] cursor-pointer"
            >
              Web App <ChevronDown size={12} />
            </button>
            {webAppDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl p-1 z-50 animate-in fade-in">
                <button
                  onClick={() => {
                    setWebAppDropdownOpen(false);
                    router.push("/meetings");
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium"
                >
                  Launch Meetings Dashboard
                </button>
                <button
                  onClick={() => {
                    setWebAppDropdownOpen(false);
                    showComingSoon("Desktop Client Sync");
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg text-slate-800 font-medium"
                >
                  Download Desktop App
                </button>
              </div>
            )}
          </div>

          {/* User Profile Avatar Icon */}
          <div
            onClick={() => showComingSoon("Account Settings & Profile")}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer border border-amber-300"
            title="Profile Settings"
          >
            {user?.name?.[0]?.toUpperCase() || "R"}
          </div>
        </div>
      </header>

      {/* ─── 3. DASHBOARD MAIN BODY (SIDEBAR + CONTENT) ─────────────────────── */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto">
        {/* LEFT SIDEBAR MENU */}
        <aside className="w-56 bg-white border-r border-slate-200 p-4 shrink-0 hidden md:block">
          <button
            onClick={() => {
              setActiveSidebarItem("home");
              router.push("/");
            }}
            className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 mb-4 cursor-pointer ${
              activeSidebarItem === "home" ? "bg-blue-50 text-[#0B5CFF]" : "hover:bg-slate-100 text-slate-700"
            }`}
          >
            Home
          </button>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            My Products
          </p>

          <div className="space-y-0.5 text-xs text-slate-700 font-medium">
            <button
              onClick={() => showComingSoon("Zoom AI Companion")}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <span>AI</span>
              <span className="text-[9px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-1 rounded">
                New ↗
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSidebarItem("meetings");
                router.push("/meetings");
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between ${
                activeSidebarItem === "meetings" ? "font-bold text-[#0B5CFF] bg-slate-100" : ""
              }`}
            >
              <span>Meetings</span>
            </button>

            {["Recordings", "Summaries"].map((item) => (
              <button
                key={item}
                onClick={() => showComingSoon(item)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {item}
              </button>
            ))}

            <button
              onClick={() => showComingSoon("Zoom Hub")}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <span>Hub</span>
              <span className="text-[9px] font-bold text-blue-600 border border-blue-200 bg-blue-50 px-1 rounded">
                New ↗
              </span>
            </button>

            <button
              onClick={() => router.push("/whiteboards")}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <span>Whiteboards</span>
              <ExternalLink size={10} className="text-slate-400" />
            </button>

            {["Notes", "Clips", "Canvas", "Paper", "Sheets", "Slides", "Tasks", "Scheduler"].map((item) => (
              <button
                key={item}
                onClick={() => showComingSoon(item)}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <span>{item}</span>
                <ExternalLink size={10} className="text-slate-400" />
              </button>
            ))}

            <button
              onClick={() => showComingSoon("Product Catalog")}
              className="w-full text-left pt-2 text-slate-500 hover:text-slate-800 px-3 py-1.5 cursor-pointer font-normal text-[11px]"
            >
              Discover More Products
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 space-y-1 text-xs text-slate-600 font-medium">
            <button onClick={() => showComingSoon("My Account")} className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <ChevronRight size={12} /> My Account
            </button>
            <button onClick={() => showComingSoon("Admin Console")} className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <ChevronRight size={12} /> Admin
            </button>
            <button onClick={() => showComingSoon("Support & Docs")} className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
              <ChevronRight size={12} /> Support
            </button>
          </div>
        </aside>

        {/* WORKSPACE CONTENT GRID */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT 2 COLUMNS STACK */}
            <div className="lg:col-span-2 space-y-6">
              {/* USER PROFILE HEADER CARD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xl border-2 border-amber-200 shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || "R"}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{user?.name || "Rajneesh Sharma"}</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Plan: <span className="font-semibold text-slate-700">Workplace Basic</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => showComingSoon("Plan Management")}
                    className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Manage Plan
                  </button>
                  <button
                    onClick={() => showComingSoon("Plan Details")}
                    className="text-xs font-semibold text-[#0B5CFF] hover:underline cursor-pointer"
                  >
                    View Plan Details
                  </button>
                </div>
              </div>

              {/* WORKPLACE PRO PROMO BANNER */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B5CFF]">
                    <span className="bg-[#0B5CFF] text-white px-1.5 py-0.5 rounded text-[10px] font-black tracking-tighter">
                      zoom
                    </span>
                    Workplace Pro
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Back-to-school savings are on!
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Get 15% off Workplace Pro annual for longer meetings, My Notes, and more!
                  </p>
                  <p className="text-[10px] text-slate-400">Terms apply.</p>
                  <button
                    onClick={() => showComingSoon("Offer Redemption")}
                    className="mt-2 px-5 py-2 rounded-full bg-[#0B5CFF] hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Redeem offer
                  </button>
                </div>

                <div className="w-52 h-36 rounded-xl overflow-hidden relative shadow-md shrink-0 bg-blue-900">
                  <Image
                    src="/images/zoom_workplace_ai_notes.png"
                    alt="Zoom Workplace Pro Promo"
                    width={220}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* RECENT ACTIVITY SECTION */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900">Recent activity</h2>

                {recent.length === 0 ? (
                  <div
                    onClick={() => router.push("/whiteboards")}
                    className="border border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#0B5CFF]">
                          {user?.name || "Rajneesh Sharma"} Meeting Note - {new Date().toLocaleDateString()}
                        </h3>
                        <span className="text-[10px] text-slate-400">...</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        modified on {new Date().toLocaleDateString()} by {user?.name || "Rajneesh Sharma"}
                      </p>
                      <span className="inline-block mt-3 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Whiteboard
                      </span>
                    </div>
                  </div>
                ) : (
                  recent.map((item) => (
                    <div
                      key={item.instance_id}
                      className="border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0B5CFF] flex items-center justify-center">
                          <Video size={18} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">{item.topic}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Meeting ID: {item.meeting_code} · {Math.ceil((item.duration_seconds || 0) / 60)} mins
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartMeetingByCode(item.meeting_code)}
                        className="px-3 py-1 text-xs font-bold text-[#0B5CFF] bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        Rejoin
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN STACK (MEETING LAUNCHERS & WIDGETS) */}
            <div className="space-y-6">
              {/* QUICK LAUNCH ACTION BUTTONS CARD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-center space-y-6">
                <div className="flex items-center justify-center gap-6">
                  {/* Schedule */}
                  <button
                    onClick={() => setScheduleModalOpen(true)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#0B5CFF] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                      <Calendar size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Schedule</span>
                  </button>

                  {/* Join */}
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#0B5CFF] hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                      <Plus size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Join</span>
                  </button>

                  {/* Host */}
                  <button
                    onClick={handleStartInstantMeeting}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-13 h-13 rounded-2xl bg-[#F26D21] hover:bg-orange-600 text-white flex items-center justify-center shadow-md transition-all group-hover:scale-105">
                      <Video size={22} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Host</span>
                  </button>
                </div>

                {/* PERSONAL MEETING ID */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Personal Meeting ID</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-sm font-mono font-bold text-slate-700 tracking-wide">
                      {pmiDisplay}
                    </span>
                    <button
                      onClick={handleCopyPmi}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Copy PMI"
                    >
                      {copiedPmi ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* MEETINGS WIDGET CARD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Meetings</h2>
                  <button
                    onClick={() => router.push("/meetings")}
                    className="text-xs font-bold text-[#0B5CFF] hover:underline cursor-pointer"
                  >
                    Visit Meetings
                  </button>
                </div>

                {allUpcomingMeetings.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-3">
                    <p className="text-xs font-bold text-slate-700">No Upcoming Meetings</p>
                    <button
                      onClick={() => showComingSoon("Audio & Video Hardware Test Room")}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
                    >
                      Test Audio and Video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allUpcomingMeetings.map((m) => (
                      <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{m.topic}</p>
                          <p className="text-[10px] text-slate-500">{m.meeting_code}</p>
                        </div>
                        <button
                          onClick={() => handleStartMeetingByCode(m.meeting_code)}
                          className="px-2.5 py-1 bg-[#0B5CFF] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Start
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ─── 4. AUTHENTICATED DASHBOARD DARK FOOTER ────────────────────────── */}
      <footer className="bg-[#161D2F] text-slate-300 pt-12 pb-8 px-6 text-xs border-t border-slate-800 mt-auto">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          <div>
            <p className="font-bold text-white text-xs mb-3">About</p>
            {["Zoom Blog", "Customers", "Our Team", "Careers", "Integrations", "Partners", "Investors", "Press", "Sustainability & ESG", "Zoom Cares", "Media Kit", "How To Videos", "Developer Platform", "Zoom Ventures", "Zoom Merchandise Store"].map(
              (item) => (
                <p key={item} onClick={() => showComingSoon(item)} className="text-[11px] text-slate-400 hover:text-white py-0.5 cursor-pointer">{item}</p>
              )
            )}
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Download</p>
            {["Zoom Workplace App", "Zoom Rooms Client", "Browser Extension", "Outlook Plug-in", "Zoom Plugin for HCL Notes", "Zoom Plugin Admin Tool for HCL Notes", "Notes", "Android App", "Zoom Virtual Backgrounds"].map(
              (item) => (
                <p key={item} onClick={() => showComingSoon(item)} className="text-[11px] text-slate-400 hover:text-white py-0.5 cursor-pointer">{item}</p>
              )
            )}
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Sales</p>
            {["1.888.799.9666", "Contact Sales", "Plans & Pricing", "Request a Demo", "Webinars and Events", "Zoom Experience Center"].map(
              (item) => (
                <p key={item} onClick={() => showComingSoon(item)} className="text-[11px] text-slate-400 hover:text-white py-0.5 cursor-pointer">{item}</p>
              )
            )}
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3">Support</p>
            {["Test Zoom", "Account", "Support Center", "Learning Center", "Zoom Community", "Feedback", "Contact Us", "Accessibility", "Developer Support", "Privacy, Security, Legal Policies"].map(
              (item) => (
                <p key={item} onClick={() => showComingSoon(item)} className="text-[11px] text-slate-400 hover:text-white py-0.5 cursor-pointer">{item}</p>
              )
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <p className="font-bold text-white text-xs mb-1.5">Language</p>
              <select onChange={() => showComingSoon("Language Selector")} className="bg-[#0B1220] border border-slate-700 text-xs text-slate-200 rounded-lg p-2 w-48">
                <option>English</option>
              </select>
            </div>

            <div>
              <p className="font-bold text-white text-xs mb-1.5">Currency</p>
              <select onChange={() => showComingSoon("Currency Selector")} className="bg-[#0B1220] border border-slate-700 text-xs text-slate-200 rounded-lg p-2 w-48">
                <option>Indian Rupee ₹</option>
                <option>US Dollar $</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2 text-slate-400">
              {["🌐", "in", "X", "YT", "f", "IG"].map((icon, i) => (
                <span key={i} onClick={() => showComingSoon("Social Channel")} className="w-7 h-7 rounded-full bg-[#0B1220] flex items-center justify-center text-xs font-bold hover:text-white cursor-pointer border border-slate-800">
                  {icon}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>Copyright ©2026 Zoom Communications, Inc. All rights reserved.</p>
          <div className="flex items-center gap-3 text-slate-400 flex-wrap">
            {["Terms", "Privacy", "Trust Center", "Acceptable Use Guidelines", "Legal & Compliance", "Your Privacy Choices", "Cookie Preferences"].map((item) => (
              <span key={item} onClick={() => showComingSoon(item)} className="hover:text-white cursor-pointer">{item}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <button
        onClick={() => router.push("/chat")}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#0B5CFF] text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
        title="Team Chat"
      >
        <MessageSquare size={20} />
      </button>

      {/* Modals */}
      <JoinMeetingModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <ScheduleMeetingModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} onScheduled={loadData} />
    </div>
  );
}
