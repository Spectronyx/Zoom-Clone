"use client";

import { Plus, Calendar as CalIcon, Monitor } from "lucide-react";

interface ActionButtonsProps {
  onJoin: () => void;
  onSchedule: () => void;
}

export default function ActionButtons({ onJoin, onSchedule }: ActionButtonsProps) {
  const buttons = [
    {
      icon: Plus,
      label: "Join",
      primary: true,
      onClick: onJoin,
    },
    {
      icon: CalIcon,
      label: "Schedule",
      primary: false,
      onClick: onSchedule,
    },
    {
      icon: Monitor,
      label: "Share Screen",
      primary: false,
      onClick: onJoin,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto justify-center relative z-30">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`
            w-full flex flex-col items-center gap-2 px-4 py-4 rounded-xl
            transition-all duration-150 cursor-pointer group
            ${btn.primary
              ? "bg-zoom-blue text-white hover:bg-zoom-blueHover shadow-md hover:shadow-lg"
              : "bg-white text-zoom-text-primary border border-zoom-border hover:bg-gray-50 hover:border-gray-300"
            }
          `}
        >
          <div className="flex items-center gap-1">
            <btn.icon size={24} className={btn.primary ? "text-white" : "text-zoom-blue"} />
          </div>
          <span className="text-xs font-semibold">{btn.label}</span>
        </button>
      ))}
    </div>
  );
}
