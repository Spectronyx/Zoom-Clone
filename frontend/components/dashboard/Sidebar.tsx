"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, MessageSquare, Calendar, Users, Pen,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Calendar, label: "Meetings", href: "/meetings" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Pen, label: "Whiteboards", href: "/whiteboards" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        className={`
          hidden md:flex fixed left-0 top-0 h-full bg-white border-r border-zoom-border
          flex-col z-30 transition-all duration-200 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[240px]"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-zoom-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zoom-blue rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
              </svg>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-zoom-text-primary tracking-tight">
                MeetClone
              </span>
            )}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5
                  transition-colors cursor-pointer text-sm
                  ${isActive
                    ? "bg-zoom-sidebar-active text-zoom-blue font-semibold shadow-2xs"
                    : "text-zoom-text-secondary hover:bg-zoom-sidebar-hover hover:text-zoom-text-primary"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-zoom-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md
              text-zoom-text-secondary hover:bg-zoom-sidebar-hover transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-zoom-border flex items-center justify-around z-40 px-2 shadow-lg">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg text-xs font-medium cursor-pointer ${
                isActive ? "text-zoom-blue font-bold" : "text-zoom-text-secondary"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
