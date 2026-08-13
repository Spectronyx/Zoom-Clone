"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageSquare } from "lucide-react";
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
    <div className="fixed md:relative inset-0 md:inset-auto z-50 w-full md:w-[340px] h-full bg-white border-l border-zoom-border flex flex-col animate-slide-in-right shadow-2xl md:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zoom-border bg-slate-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-zoom-blue" />
          <h3 className="text-sm font-bold text-zoom-text-primary">Meeting Chat</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-zoom-text-secondary transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Recipient Indicator */}
      <div className="px-4 py-2 bg-slate-100/70 border-b border-zoom-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zoom-text-secondary">
          <span>To:</span>
          <span className="font-semibold text-zoom-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Everyone
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <MessageSquare size={20} className="text-slate-400" />
            </div>
            <p className="text-xs font-medium text-slate-500">No messages yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Messages sent here can be seen by everyone</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isLocal = msg.participant_id === localParticipantId;
            return (
              <div key={i} className="animate-fade-in flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isLocal ? "text-zoom-blue" : "text-slate-800"}`}>
                    {isLocal ? "You" : msg.display_name}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(to Everyone)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dayjs(msg.sent_at).format("h:mm A")}
                  </span>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-xs leading-relaxed break-words shadow-sm ${
                    isLocal
                      ? "bg-zoom-blue text-white rounded-tr-none self-end max-w-[90%]"
                      : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60 max-w-[90%]"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-3 border-t border-zoom-border bg-slate-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type message here..."
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300
              bg-white text-zoom-text-primary placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-zoom-blue/30 focus:border-zoom-blue transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-zoom-blue text-white hover:bg-zoom-blueHover
              transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-sm active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
