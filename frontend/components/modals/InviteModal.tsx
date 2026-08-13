"use client";

import { useState } from "react";
import { Copy, Check, Mail, UserPlus, Link as LinkIcon, Send, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingCode: string;
  topic?: string;
  hostName?: string;
}

const SAMPLE_CONTACTS = [
  { id: "1", name: "Sarah Jenkins", email: "sarah.j@company.com", role: "Design Lead", color: "#0E72ED" },
  { id: "2", name: "Alex Rivera", email: "alex.r@company.com", role: "DevOps Engineer", color: "#2D8CFF" },
  { id: "3", name: "Emily Watson", email: "emily.w@company.com", role: "Product Manager", color: "#10B981" },
  { id: "4", name: "Michael Chen", email: "michael.c@company.com", role: "Senior Backend Eng", color: "#F59E0B" },
];

export default function InviteModal({
  isOpen,
  onClose,
  meetingCode,
  topic = "MeetClone Video Meeting",
  hostName = "Host",
}: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<"link" | "email" | "contacts">("link");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [invitedContacts, setInvitedContacts] = useState<Record<string, boolean>>({});

  const cleanCode = meetingCode.replace(/\s/g, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://zoom-clone-spectronyx.vercel.app";
  const inviteLink = `${origin}/meeting/${cleanCode}/lobby`;

  const fullInvitation = `${hostName} is inviting you to a live MeetClone video meeting.

Topic: ${topic}
Meeting ID: ${cleanCode}
Join Meeting: ${inviteLink}

No login required. Click the link above to join!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullInvitation);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleSendEmail = (type: "default" | "gmail" | "outlook") => {
    const subject = encodeURIComponent(`Invitation to Zoom Meeting: ${topic}`);
    const body = encodeURIComponent(fullInvitation);

    if (type === "gmail") {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
    } else if (type === "outlook") {
      window.open(`https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`, "_blank");
    } else {
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleInviteContact = (id: string) => {
    setInvitedContacts((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setInvitedContacts((prev) => ({ ...prev, [id]: false }));
    }, 4000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Participants to Meeting" size="lg">
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zoom-border">
          <button
            onClick={() => setActiveTab("link")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "link"
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-zoom-text-secondary hover:text-zoom-text-primary"
            }`}
          >
            <LinkIcon size={14} /> Copy Link & Invite
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "email"
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-zoom-text-secondary hover:text-zoom-text-primary"
            }`}
          >
            <Mail size={14} /> Email Invite
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "contacts"
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-zoom-text-secondary hover:text-zoom-text-primary"
            }`}
          >
            <Users size={14} /> Invite Contacts
          </button>
        </div>

        {/* Tab 1: Copy Link */}
        {activeTab === "link" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zoom-text-primary block mb-1.5">Meeting URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zoom-border bg-slate-50 text-slate-800"
                />
                <Button variant="primary" size="sm" onClick={handleCopyLink} className="flex items-center gap-1.5">
                  {copiedLink ? <Check size={14} className="text-white" /> : <Copy size={14} />}
                  <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zoom-text-primary block mb-1.5">Full Invitation Details</label>
              <textarea
                readOnly
                rows={5}
                value={fullInvitation}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zoom-border bg-slate-50 text-slate-700 resize-none"
              />
              <div className="mt-2 flex justify-end">
                <Button variant="secondary" size="sm" onClick={handleCopyText} className="flex items-center gap-1.5">
                  {copiedText ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedText ? "Copied Invitation Text" : "Copy Full Invitation"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Email Invite */}
        {activeTab === "email" && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-zoom-text-secondary">
              Select your preferred email provider to generate a pre-formatted meeting invite message:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleSendEmail("default")}
                className="p-4 rounded-xl border border-zoom-border hover:border-zoom-blue hover:bg-blue-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-zoom-blue/10 text-zoom-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <span className="text-xs font-bold text-zoom-text-primary">Default Email App</span>
              </button>

              <button
                onClick={() => handleSendEmail("gmail")}
                className="p-4 rounded-xl border border-zoom-border hover:border-red-500 hover:bg-red-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <span className="text-xs font-bold text-zoom-text-primary">Gmail</span>
              </button>

              <button
                onClick={() => handleSendEmail("outlook")}
                className="p-4 rounded-xl border border-zoom-border hover:border-blue-600 hover:bg-blue-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <span className="text-xs font-bold text-zoom-text-primary">Outlook</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Invite Contacts */}
        {activeTab === "contacts" && (
          <div className="space-y-3">
            <p className="text-xs text-zoom-text-secondary">Send instant meeting invite links to team members:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {SAMPLE_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zoom-border bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: contact.color }}
                    >
                      {contact.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zoom-text-primary">{contact.name}</h4>
                      <p className="text-[11px] text-zoom-text-secondary">{contact.role}</p>
                    </div>
                  </div>

                  <Button
                    variant={invitedContacts[contact.id] ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleInviteContact(contact.id)}
                    className="flex items-center gap-1 text-xs"
                  >
                    {invitedContacts[contact.id] ? (
                      <>
                        <Check size={12} className="text-green-600" /> Invited
                      </>
                    ) : (
                      <>
                        <Send size={12} /> Send Invite
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zoom-border">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
