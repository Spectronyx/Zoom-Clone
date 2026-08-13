"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, HelpCircle, Settings, LogOut, LogIn, UserPlus, Video, ChevronDown } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { User } from "@/types";
import { useAuthStore } from "@/store/authStore";

interface TopNavProps {
  user: User | null;
  onNewMeeting?: () => void;
}

export default function TopNav({ user: propUser, onNewMeeting }: TopNavProps) {
  const { user: authUser, token, logout } = useAuthStore();
  const currentUser = authUser || propUser;
  const isAuthenticated = !!token;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newMeetingDropdownOpen, setNewMeetingDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const newMeetingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (newMeetingRef.current && !newMeetingRef.current.contains(event.target as Node)) {
        setNewMeetingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-zoom-border flex items-center justify-between px-4 md:px-6 relative z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-md mr-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zoom-text-secondary"
          />
          <input
            type="text"
            placeholder="Search meetings, contacts..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zoom-border
              bg-zoom-surface text-zoom-text-primary placeholder:text-zoom-text-secondary/60
              focus:outline-none focus:ring-2 focus:ring-zoom-blue/20 focus:border-zoom-blue
              transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Start / New Meeting Button in Navbar */}
        {onNewMeeting && (
          <div className="relative" ref={newMeetingRef}>
            <div className="flex items-center rounded-lg bg-zoom-orange hover:bg-zoom-orange-hover text-white shadow-sm transition-all overflow-hidden">
              <button
                onClick={onNewMeeting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold cursor-pointer border-r border-white/20 hover:bg-black/10 transition-colors"
              >
                <Video size={16} />
                <span>New Meeting</span>
              </button>
              <button
                onClick={() => setNewMeetingDropdownOpen(!newMeetingDropdownOpen)}
                className="px-2 py-1.5 text-white/80 hover:text-white hover:bg-black/10 transition-colors cursor-pointer"
                title="Options"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {newMeetingDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    onNewMeeting();
                    setNewMeetingDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-left hover:bg-zoom-surface text-zoom-text-primary transition-colors cursor-pointer font-medium"
                >
                  Start with video on
                </button>
                <button
                  onClick={() => {
                    onNewMeeting();
                    setNewMeetingDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-left hover:bg-zoom-surface text-zoom-text-primary transition-colors cursor-pointer font-medium"
                >
                  Start with video off
                </button>
              </div>
            )}
          </div>
        )}

        <button className="p-2 rounded-full hover:bg-gray-100 text-zoom-text-secondary transition-colors cursor-pointer">
          <HelpCircle size={20} />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 text-zoom-text-secondary transition-colors cursor-pointer">
          <Settings size={20} />
        </button>

        {/* User Dropdown */}
        <div className={`relative ${dropdownOpen ? "z-50" : "z-10"}`} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zoom-blue/30 transition-all cursor-pointer"
          >
            {currentUser ? (
              <Avatar name={currentUser.name} color={currentUser.avatar_color} size="md" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                ?
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              {currentUser && (
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.email || 'Guest Mode (Default User)'}
                  </p>
                  {!isAuthenticated && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800 rounded-full">
                      Anonymous Guest
                    </span>
                  )}
                </div>
              )}

              <div className="py-1">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <LogIn size={16} className="text-zoom-blue" />
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <UserPlus size={16} className="text-zoom-blue" />
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
