"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { ChatMessage } from "@/types";
import dayjs from "dayjs";

interface ChatPanelProps {
  messages: ChatMessage[];
  localParticipantId: string;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export default function ChatPanel({
  messages,
  localParticipantId,
  onSendMessage,
  onClose,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="fixed md:relative inset-0 md:inset-auto z-50 w-full md:w-[320px] h-full bg-white border-l border-zoom-border flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zoom-border">
        <h3 className="text-sm font-bold text-zoom-text-primary">Meeting Chat</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 text-zoom-text-secondary transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Recipient */}
      <div className="px-4 py-2 bg-slate-50 border-b border-zoom-border">
        <span className="text-xs text-zoom-text-secondary">To: </span>
        <span className="text-xs font-semibold text-zoom-text-primary">Everyone</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-zoom-text-secondary">No messages yet</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isLocal = msg.participant_id === localParticipantId;
          return (
            <div key={i} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold ${isLocal ? "text-zoom-blue" : "text-zoom-text-primary"}`}>
                  {isLocal ? "You" : msg.display_name}
                </span>
                <span className="text-[10px] text-zoom-text-secondary">
                  {dayjs(msg.sent_at).format("h:mm A")}
                </span>
              </div>
              <p className="text-sm text-zoom-text-primary pl-0 leading-relaxed">
                {msg.message}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zoom-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type message here..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-zoom-border
              bg-zoom-surface text-zoom-text-primary placeholder:text-zoom-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-zoom-blue/20 focus:border-zoom-blue"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-zoom-blue text-white hover:bg-zoom-blueHover
              transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
