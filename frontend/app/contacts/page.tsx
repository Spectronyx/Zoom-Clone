"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Video, MessageSquare, Mail, Search, Check, Copy } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { User } from "@/types";

interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "available" | "busy" | "offline";
  color: string;
}

const SAMPLE_CONTACTS: Contact[] = [
  { id: "1", name: "Sarah Jenkins", email: "sarah.j@company.com", role: "Design Lead", status: "available", color: "#0E72ED" },
  { id: "2", name: "Alex Rivera", email: "alex.r@company.com", role: "DevOps Engineer", status: "available", color: "#2D8CFF" },
  { id: "3", name: "Emily Watson", email: "emily.w@company.com", role: "Product Manager", status: "busy", color: "#10B981" },
  { id: "4", name: "Michael Chen", email: "michael.c@company.com", role: "Senior Backend Eng", status: "offline", color: "#F59E0B" },
  { id: "5", name: "Jessica Taylor", email: "jessica.t@company.com", role: "QA Engineer", status: "available", color: "#8B5CF6" },
];

export default function ContactsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyEmail = (id: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredContacts = SAMPLE_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zoom-surface">
      <Sidebar />
      <div className="ml-[68px]">
        <TopNav user={user} onNewMeeting={handleNewMeeting} />

        <main className="max-w-[960px] mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zoom-text-primary flex items-center gap-2">
                <Users className="text-zoom-blue" size={28} />
                Contacts Directory
              </h1>
              <p className="text-sm text-zoom-text-secondary mt-0.5">
                Connect with team members, check availability, and start instant video calls
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zoom-text-secondary" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zoom-border bg-white focus:outline-none focus:ring-1 focus:ring-zoom-blue"
              />
            </div>
          </div>

          {/* Contacts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-zoom-border p-5 flex items-center justify-between hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={contact.name} color={contact.color} size="lg" />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        contact.status === "available"
                          ? "bg-green-500"
                          : contact.status === "busy"
                          ? "bg-red-500"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zoom-text-primary">{contact.name}</h3>
                    <p className="text-xs text-zoom-text-secondary">{contact.role}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail size={10} /> {contact.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyEmail(contact.id, contact.email)}
                    title="Copy Email"
                  >
                    {copiedId === contact.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push("/chat")}
                    title="Chat"
                  >
                    <MessageSquare size={14} className="text-zoom-blue" />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNewMeeting}
                    className="flex items-center gap-1"
                  >
                    <Video size={14} /> Meet
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
