"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, Globe, ChevronDown, X, Sparkles, Video, Calendar,
  MessageSquare, Phone, Shield, ArrowRight, ChevronLeft, ChevronRight,
  ExternalLink, User, Lock, Play, CheckCircle2, Award, FileText, LayoutGrid
} from "lucide-react";
import JoinMeetingModal from "@/components/modals/JoinMeetingModal";
import ScheduleMeetingModal from "@/components/modals/ScheduleMeetingModal";
import AuthenticatedDashboard from "@/components/dashboard/AuthenticatedDashboard";
import { api } from "@/lib/api";
import { User as UserType } from "@/types";

// ─── CAROUSEL CARDS DATA ──────────────────────────────────────────────────
const CAROUSEL_CARDS = [
  {
    id: "workvivo",
    badge: "workvivo",
    badgeBg: "bg-indigo-600",
    title: "Employee Engagement Platform",
    desc: "Streamline internal communications, social feeds, and company culture in one central hub.",
    color: "from-blue-600 to-indigo-700",
    type: "social",
  },
  {
    id: "meetings",
    badge: "📹 Meetings",
    badgeBg: "bg-blue-600",
    title: "AI-Powered Video Meetings",
    desc: "HD video, crystal clear audio, background blur, real-time closed captions, and smart recordings.",
    color: "from-blue-600 to-blue-800",
    type: "video",
  },
  {
    id: "notes",
    badge: "📌 My Notes",
    badgeBg: "bg-blue-500",
    title: "Your New AI Note Taker",
    desc: "Automated meeting transcripts, key highlights, and task summaries powered by AI Companion.",
    color: "from-sky-600 to-blue-700",
    type: "notes",
  },
  {
    id: "zoommate",
    badge: "✨ ZoomMate",
    badgeBg: "bg-indigo-500",
    title: "AI Work Assistant",
    desc: "Draft emails, build presentation decks, synthesize chats, and prepare for upcoming meetings.",
    color: "from-purple-600 to-indigo-800",
    type: "ai",
  },
  {
    id: "productivity",
    badge: "📱 AI Productivity Suite",
    badgeBg: "bg-teal-600",
    title: "Creative Design & Docs",
    desc: "Seamless collaborative documents, whiteboard brainstorming, and automated workflow triggers.",
    color: "from-teal-600 to-cyan-700",
    type: "docs",
  },
  {
    id: "phone",
    badge: "📞 Phone",
    badgeBg: "bg-[#0B5CFF]",
    title: "Global Enterprise Voice",
    desc: "Cloud VoIP phone system with intelligent call routing, voicemail transcripts, and mobile sync.",
    color: "from-blue-700 to-slate-800",
    type: "phone",
  },
];

// ─── TAB SOLUTIONS DATA ──────────────────────────────────────────────────
const SOLUTIONS_TABS = [
  { id: "collab", label: "Collaboration" },
  { id: "support", label: "Customer Support" },
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales" },
  { id: "engagement", label: "Employee Engagement" },
];

export default function ZoomHomePage() {
  const router = useRouter();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("collab");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [activeNavDropdown, setActiveNavDropdown] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {
        // Not logged in or guest
      }
    }
    checkAuth();
  }, []);

  if (currentUser) {
    return <AuthenticatedDashboard initialUser={currentUser} />;
  }

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % CAROUSEL_CARDS.length);
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + CAROUSEL_CARDS.length) % CAROUSEL_CARDS.length);
  };

  const handleNewInstantMeeting = async () => {
    try {
      const meeting = await api.createInstantMeeting();
      const code = meeting.meeting_code.replace(/\s/g, "");
      router.push(`/meeting/${code}/lobby`);
    } catch (err) {
      console.error("Error creating instant meeting:", err);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans select-none overflow-x-hidden">
      {/* ─── ANNOUNCEMENT BAR ────────────────────────────────────────── */}
      {showAnnouncement && (
        <div className="bg-[#121929] text-white px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm border-b border-slate-800 transition-all duration-300">
          <div className="flex-1 flex items-center justify-center gap-2 text-center">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-400">
              <Sparkles size={14} className="text-pink-400 animate-pulse" />
              AI Note Taking
            </span>
            <span className="hidden sm:inline text-slate-300">
              across platforms that's secure, personalized, and under your control.
            </span>
            <button
              onClick={() => router.push("/meetings")}
              className="ml-2 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition-all shadow-sm cursor-pointer"
            >
              Explore My Notes
            </button>
          </div>
          <button
            onClick={() => setShowAnnouncement(false)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── MAIN TOP HEADER NAV ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-1 text-[#0B5CFF] font-black text-2xl tracking-tighter">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B5CFF]">zoom</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
              <div className="relative group" onMouseEnter={() => setActiveNavDropdown("products")} onMouseLeave={() => setActiveNavDropdown(null)}>
                <button className="flex items-center gap-1 hover:text-[#0B5CFF] py-5 transition-colors cursor-pointer">
                  Products <ChevronDown size={14} />
                </button>
                {activeNavDropdown === "products" && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link href="/meetings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-slate-800">
                      <Video size={18} className="text-[#0B5CFF]" />
                      <div>
                        <p className="text-xs font-bold">Meetings & Webcasts</p>
                        <p className="text-[10px] text-slate-500">HD Video conferencing</p>
                      </div>
                    </Link>
                    <Link href="/chat" className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-slate-800">
                      <MessageSquare size={18} className="text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold">Team Chat</p>
                        <p className="text-[10px] text-slate-500">Instant messaging</p>
                      </div>
                    </Link>
                    <Link href="/whiteboards" className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 text-slate-800">
                      <FileText size={18} className="text-purple-600" />
                      <div>
                        <p className="text-xs font-bold">Whiteboards</p>
                        <p className="text-[10px] text-slate-500">Visual collaboration</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <div className="relative group">
                <button className="flex items-center gap-1 text-[#0B5CFF] hover:opacity-80 py-5 transition-colors cursor-pointer font-bold">
                  <Sparkles size={14} className="text-blue-500" /> AI <ChevronDown size={14} />
                </button>
              </div>

              <button className="flex items-center gap-1 hover:text-[#0B5CFF] py-5 transition-colors cursor-pointer">
                Solutions <ChevronDown size={14} />
              </button>

              <button className="hover:text-[#0B5CFF] py-5 transition-colors cursor-pointer">
                Pricing
              </button>
            </nav>
          </div>

          {/* Right Header Utilities & Auth CTAs */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="p-2 text-slate-600 hover:text-[#0B5CFF] rounded-lg transition-colors cursor-pointer">
              <Search size={18} />
            </button>
            <button className="hidden md:flex p-2 text-slate-600 hover:text-[#0B5CFF] rounded-lg transition-colors cursor-pointer">
              <Globe size={18} />
            </button>

            {/* Meet Quick Dropdown */}
            <div className="relative group hidden sm:block" onMouseEnter={() => setActiveNavDropdown("meet")} onMouseLeave={() => setActiveNavDropdown(null)}>
              <button className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-[#0B5CFF] px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                Meet <ChevronDown size={12} />
              </button>
              {activeNavDropdown === "meet" && (
                <div className="absolute top-full right-0 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 z-50">
                  <button onClick={() => setJoinModalOpen(true)} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 rounded-lg">
                    Join a Meeting
                  </button>
                  <button onClick={handleNewInstantMeeting} className="w-full text-left px-3 py-2 text-xs font-semibold text-[#0B5CFF] hover:bg-blue-50 rounded-lg">
                    Host an Instant Meeting
                  </button>
                  <button onClick={() => setScheduleModalOpen(true)} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 rounded-lg">
                    Schedule a Meeting
                  </button>
                </div>
              )}
            </div>

            {/* User Auth Buttons */}
            {currentUser ? (
              <Link
                href="/meetings"
                className="px-4 py-2 text-xs font-bold text-white bg-[#0B5CFF] hover:bg-blue-700 rounded-full transition-all shadow-md flex items-center gap-1.5"
              >
                <User size={14} /> My Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-700 hover:text-[#0B5CFF] px-2 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="hidden md:inline-block px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
                >
                  Contact Sales
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0B5CFF] hover:bg-blue-700 rounded-full transition-all shadow-md shadow-blue-500/20 active:scale-95"
                >
                  Sign Up Free
                </Link>
              </>
            )}

            <button className="p-2 text-slate-600 hover:text-[#0B5CFF] lg:hidden">
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (DARK DEEP BLUE GRADIENT) ────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#0B152C] via-[#0E1C3D] to-[#162A5A] text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow ambient circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/20 blur-[140px] pointer-events-none rounded-full" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Find out what's possible when work connects
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Bridge the gap between talking and doing with the AI-first work platform built for you.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleNewInstantMeeting}
              className="px-7 py-3.5 rounded-full bg-[#051336] hover:bg-[#071946] text-white font-bold text-sm border border-blue-400/30 transition-all shadow-xl hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <Video size={18} className="text-blue-400" /> Explore products
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="px-7 py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#0E1C3D] font-bold text-sm transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              Find your plan
            </button>
          </div>
        </div>

        {/* ─── CAROUSEL CARDS STRIP ────────────────────────────────────────── */}
        <div className="mt-16 max-w-7xl mx-auto relative z-20">
          <div className="flex items-center justify-between mb-4 px-4">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Featured Products</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevCarousel}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextCarousel}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-6 px-4 snap-x snap-mandatory transition-all duration-300"
          >
            {CAROUSEL_CARDS.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => router.push("/meetings")}
                className={`
                  min-w-[280px] sm:min-w-[320px] max-w-[320px] rounded-2xl p-5 bg-gradient-to-b ${card.color}
                  border border-white/15 shadow-2xl flex flex-col justify-between shrink-0 snap-start cursor-pointer
                  hover:translate-y-1 hover:border-white/40 transition-all group
                  ${idx === carouselIndex ? "ring-2 ring-blue-400" : "opacity-90"}
                `}
              >
                <div>
                  <span className={`inline-block text-[11px] font-bold text-white px-2.5 py-1 rounded-md mb-3 ${card.badgeBg}`}>
                    {card.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-white">
                  <span>Learn more</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {CAROUSEL_CARDS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === carouselIndex ? "w-6 bg-blue-400" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: MY NOTES SPOTLIGHT ────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Sparkles size={24} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              <span className="text-[#0B5CFF]">My Notes</span> — Your new AI note taker
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Never miss an important action item or meeting sync. Zoom AI Companion automatically generates structured summaries, captures transcripts, and assigns next steps directly to team members.
            </p>
            <button
              onClick={() => router.push("/meetings")}
              className="px-6 py-3 rounded-full bg-[#0B5CFF] hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Explore My Notes <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white group">
            <Image
              src="/images/zoom_workplace_ai_notes.png"
              alt="Zoom Workplace AI Notes Mockup"
              width={650}
              height={500}
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: GARTNER & INDUSTRY RECOGNITION CARDS ──────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-b from-[#0E1C3D] to-[#162A5A] text-white rounded-2xl p-8 flex flex-col justify-between shadow-xl border border-blue-900/40">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-amber-300 flex items-center justify-center mb-6">
                  <Award size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-3 leading-snug">
                  See why Zoom is a Leader in the 2026 Gartner® Magic Quadrant™ for UCaaS
                </h3>
                <p className="text-xs text-slate-300 font-normal leading-relaxed">
                  Recognized for 7 consecutive years for completeness of vision and ability to execute.
                </p>
              </div>
              <button
                onClick={() => router.push("/signup")}
                className="mt-8 px-5 py-2.5 rounded-full bg-[#0B5CFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md self-start cursor-pointer"
              >
                Read the report
              </button>
            </div>

            {/* Card 2 */}
            <div className="relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between group">
              <Image
                src="/images/zoom_workplace_ai_notes.png"
                alt="Zoom CCaaS Support"
                width={400}
                height={400}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 p-8 flex flex-col justify-between h-full bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent">
                <div>
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-md mb-4 inline-block">
                    Customer Experience
                  </span>
                  <h3 className="text-xl font-bold mb-2">
                    Zoom recognized in the 2026 Gartner Voice of the Customer for CCaaS
                  </h3>
                </div>
                <button
                  onClick={() => router.push("/signup")}
                  className="mt-8 px-5 py-2.5 rounded-full bg-[#0B5CFF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md self-start cursor-pointer"
                >
                  Explore the report
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-400/40 shadow-xl flex flex-col justify-between text-slate-900">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0B5CFF] flex items-center justify-center mb-6">
                  <FileText size={24} />
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block mb-1">
                  FROST RADAR™
                </span>
                <h3 className="text-xl font-bold mb-3 text-slate-900">
                  Visionary Leaders in Global UCaaS Platform Innovation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Ranked top for market expansion, AI integration, and user satisfaction.
                </p>
              </div>
              <button
                onClick={() => router.push("/signup")}
                className="mt-8 px-5 py-2.5 rounded-full bg-[#0B5CFF] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md self-start cursor-pointer"
              >
                Read the report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: ONE PLATFORM & TABBED SOLUTIONS ──────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 text-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              One platform. Endless ways to work together.
            </h2>
          </div>

          {/* Solution Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-none pb-4 mb-10 border-b border-slate-200">
            {SOLUTIONS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#0B5CFF] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-5">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#0B5CFF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Support hybrid and remote work:</span> Keep global teams engaged with reliable video, chat, documents, and more.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#0B5CFF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Seamless communication:</span> Save time and cut costs with Meetings, Phone, Chat, and more in one UCaaS platform.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#0B5CFF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Keep workflows moving:</span> From brainstorms to documents, Zoom helps teams cut friction and avoid stalls.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#0B5CFF] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Do more with AI:</span> Built-in AI summarizes meetings and automates next steps, while ZoomMate generates quality decks & docs.
                  </div>
                </li>
              </ul>

              <button
                onClick={handleNewInstantMeeting}
                className="px-6 py-3 rounded-full bg-[#0B5CFF] hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer inline-flex items-center gap-2 mt-4"
              >
                Explore products <ArrowRight size={14} />
              </button>
            </div>

            <div className="flex-1 w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
              <Image
                src="/images/zoom_mate_ai_assistant.png"
                alt="ZoomMate Workspace Graphic"
                width={600}
                height={450}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: TRUSTED CLIENT LOGOS ────────────────────────────── */}
      <section className="py-12 bg-white border-b border-slate-200 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          Trusted by millions. Built for you.
        </p>
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-70 font-serif text-lg font-bold text-slate-700">
          <span>ExxonMobil</span>
          <span>CapitalOne</span>
          <span>The New York Times</span>
          <span>Walmart</span>
          <span>WERNER</span>
          <span>MOFFITT</span>
        </div>
      </section>

      {/* ─── MODERN DARK NAVY FOOTER ────────────────────────────────────────── */}
      <footer className="bg-[#080E1E] text-slate-300 pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-16">
          {/* Left Column - Download & Selectors */}
          <div className="md:col-span-1 space-y-6">
            <span className="text-3xl font-black text-[#0B5CFF] tracking-tight block">zoom</span>
            
            <div className="bg-[#0E172E] border border-slate-800 p-3.5 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <Video size={14} className="text-blue-400" /> Download Center
              </p>
              <p className="text-[10px] text-slate-400">Get the most out of Zoom on desktop & mobile</p>
            </div>

            <div className="space-y-2">
              <select className="w-full bg-[#0E172E] border border-slate-800 text-xs text-slate-200 rounded-lg p-2 focus:outline-none">
                <option>English</option>
                <option>Español</option>
                <option>Deutsch</option>
              </select>
              <select className="w-full bg-[#0E172E] border border-slate-800 text-xs text-slate-200 rounded-lg p-2 focus:outline-none">
                <option>US Dollar $</option>
                <option>EUR €</option>
              </select>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400">Get in touch</p>
              <p className="text-sm font-bold text-white mt-0.5">+1.888.799.9666</p>
            </div>
          </div>

          {/* Navigation Links Columns */}
          <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* About */}
            <div className="space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">About</p>
              {["Zoom Blog", "Customers", "Our Team", "Careers", "Integrations", "Partners", "Investors", "Press", "Sustainability & ESG", "Zoom Cares", "AI Research"].map((item) => (
                <p key={item} className="hover:text-blue-400 transition-colors cursor-pointer">{item}</p>
              ))}
            </div>

            {/* Download */}
            <div className="space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Download</p>
              {["Zoom Workplace App", "Zoom Rooms App", "Zoom Rooms Controller", "Browser Extension", "Outlook Plug-in", "iPhone/iPad App", "Android App", "Virtual Backgrounds"].map((item) => (
                <p key={item} className="hover:text-blue-400 transition-colors cursor-pointer">{item}</p>
              ))}
            </div>

            {/* Sales */}
            <div className="space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Sales</p>
              {["+1.888.799.9666", "Contact Sales", "Plans & Pricing", "Request a Demo", "Webinars and Events", "Zoom Experience Center", "Zoom for Startups"].map((item) => (
                <p key={item} className="hover:text-blue-400 transition-colors cursor-pointer">{item}</p>
              ))}
            </div>

            {/* Support */}
            <div className="space-y-2.5">
              <p className="font-bold text-white text-xs uppercase tracking-wider mb-3">Support</p>
              {["Test Zoom", "Account", "Support Center", "Learning Center", "Zoom Community", "Technical Content Library", "Feedback", "Developer Support", "Privacy & Security"].map((item) => (
                <p key={item} className="hover:text-blue-400 transition-colors cursor-pointer">{item}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Legal & Cookie Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>©2026 Zoom Communications, Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span className="hover:text-slate-200 cursor-pointer">Terms</span>
            <span className="hover:text-slate-200 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-200 cursor-pointer">Trust Center</span>
            <span className="hover:text-slate-200 cursor-pointer">Acceptable Use</span>
            <span className="hover:text-slate-200 cursor-pointer flex items-center gap-1">
              <Shield size={12} className="text-blue-400" /> Your Privacy Choices
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget Button */}
      <button
        onClick={handleNewInstantMeeting}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full bg-[#0B5CFF] hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        <MessageSquare size={22} />
      </button>

      {/* Modals */}
      <JoinMeetingModal isOpen={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <ScheduleMeetingModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} onScheduled={() => {}} />
    </div>
  );
}
