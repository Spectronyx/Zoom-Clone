"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send, Hash, User as UserIcon, Video, PhoneCall, Search, Smile } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { User } from "@/types";

interface ChatChannel {
  id: string;
  name: string;
  isChannel: boolean;
  unreadCount?: number;
  avatarColor?: string;
}

const SAMPLE_CHANNELS: ChatChannel[] = [
  { id: "c1", name: "general", isChannel: true, unreadCount: 2 },
  { id: "c2", name: "engineering", isChannel: true },
  { id: "c3", name: "announcements", isChannel: true },
  { id: "u1", name: "Sarah Jenkins (Design Lead)", isChannel: false, avatarColor: "#0E72ED" },
  { id: "u2", name: "Alex Rivera (DevOps)", isChannel: false, avatarColor: "#2D8CFF" },
  { id: "u3", name: "Emily Watson (Product)", isChannel: false, avatarColor: "#10B981" },
];

interface ChatMsg {
  id: string;
  sender: string;
  avatarColor?: string;
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<ChatChannel>(SAMPLE_CHANNELS[0]);
  const [messages, setMessages] = useState<Record<string, ChatMsg[]>>({
    c1: [
      { id: "m1", sender: "Sarah Jenkins", avatarColor: "#0E72ED", text: "Hey team, welcome to the new MeetClone Team Chat!", timestamp: "10:14 AM" },
      { id: "m2", sender: "Alex Rivera", avatarColor: "#2D8CFF", text: "Awesome! The video integration looks seamless.", timestamp: "10:15 AM" },
    ],
    c2: [
      { id: "m3", sender: "Alex Rivera", avatarColor: "#2D8CFF", text: "Django ASGI Channels signaling server is running at 100% test coverage.", timestamp: "09:30 AM" },
    ],
  });
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    api.getCurrentUser().then(setUser).catch(console.error);
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMsg = {
      id: Date.now().toString(),
      sender: user?.name || "You",
      avatarColor: user?.avatar_color || "#0E72ED",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
    }));

    setInputText("");
  };

  const currentMessages = messages[activeChat.id] || [];

  return (
    <div className="min-h-screen bg-zoom-surface flex flex-col">
      <Sidebar />
      <div className="ml-[68px] flex-1 flex flex-col h-screen overflow-hidden">
        <TopNav user={user} onNewMeeting={handleNewMeeting} />

        <div className="flex-1 flex overflow-hidden">
          {/* Channels & Contacts Sidebar */}
          <div className="w-64 bg-white border-r border-zoom-border flex flex-col shrink-0">
            <div className="p-4 border-b border-zoom-border">
              <h2 className="text-base font-bold text-zoom-text-primary flex items-center gap-2">
                <MessageSquare className="text-zoom-blue" size={20} />
                Team Chat
              </h2>
              <div className="relative mt-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zoom-text-secondary" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zoom-border bg-zoom-surface"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {/* Channels */}
              <div>
                <h3 className="px-2 text-[11px] font-bold text-zoom-text-secondary uppercase tracking-wider mb-1">
                  Channels
                </h3>
                {SAMPLE_CHANNELS.filter((c) => c.isChannel).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChat(c)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      activeChat.id === c.id
                        ? "bg-zoom-blue/10 text-zoom-blue"
                        : "text-zoom-text-primary hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash size={16} className={activeChat.id === c.id ? "text-zoom-blue" : "text-zoom-text-secondary"} />
                      <span>{c.name}</span>
                    </div>
                    {c.unreadCount && (
                      <span className="bg-zoom-blue text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Direct Messages */}
              <div>
                <h3 className="px-2 text-[11px] font-bold text-zoom-text-secondary uppercase tracking-wider mb-1">
                  Direct Messages
                </h3>
                {SAMPLE_CHANNELS.filter((c) => !c.isChannel).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChat(c)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      activeChat.id === c.id
                        ? "bg-zoom-blue/10 text-zoom-blue font-semibold"
                        : "text-zoom-text-primary hover:bg-gray-100"
                    }`}
                  >
                    <Avatar name={c.name} color={c.avatarColor} size="sm" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Conversation Area */}
          <div className="flex-1 bg-white flex flex-col min-w-0">
            {/* Active Header */}
            <div className="h-14 border-b border-zoom-border px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activeChat.isChannel ? (
                  <Hash className="text-zoom-blue" size={20} />
                ) : (
                  <Avatar name={activeChat.name} color={activeChat.avatarColor} size="sm" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-zoom-text-primary">{activeChat.name}</h3>
                  <p className="text-[11px] text-zoom-text-secondary">
                    {activeChat.isChannel ? "Public Channel" : "Direct Message"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleNewMeeting} className="flex items-center gap-1.5">
                  <Video size={14} className="text-zoom-blue" />
                  <span>Start Call</span>
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zoom-surface/40">
              {currentMessages.length === 0 ? (
                <div className="text-center py-16 text-zoom-text-secondary">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-zoom-text-secondary/60">Start the conversation below.</p>
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar name={msg.sender} color={msg.avatarColor} size="md" />
                    <div className="flex-1 bg-white p-3.5 rounded-xl border border-zoom-border shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zoom-text-primary">{msg.sender}</span>
                        <span className="text-[10px] text-zoom-text-secondary">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs text-zoom-text-primary leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zoom-border bg-white flex items-center gap-3">
              <input
                type="text"
                placeholder={`Message #${activeChat.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-zoom-border bg-zoom-surface focus:outline-none focus:ring-1 focus:ring-zoom-blue"
              />
              <Button variant="primary" type="submit" size="sm" className="px-4 py-2.5 flex items-center gap-1">
                <Send size={14} /> Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
