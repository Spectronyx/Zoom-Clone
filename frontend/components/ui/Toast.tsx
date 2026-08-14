"use client";

import React from "react";
import { Sparkles, X } from "lucide-react";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0E172E] text-white px-5 py-3 rounded-full shadow-2xl border border-blue-500/30 flex items-center gap-3 text-xs font-semibold">
        <Sparkles size={16} className="text-blue-400 animate-pulse" />
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white p-0.5 rounded-full transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
