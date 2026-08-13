"use client";

import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  size?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md", size }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const effectiveMaxWidth = size === "lg" ? "max-w-lg" : size === "xl" ? "max-w-xl" : maxWidth;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`
          bg-white rounded-lg shadow-xl w-full ${effectiveMaxWidth} mx-4
          animate-scale-in
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zoom-border">
          <h2 className="text-lg font-bold text-zoom-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-zoom-text-secondary transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
