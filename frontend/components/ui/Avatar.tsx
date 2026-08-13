"use client";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ name, color = "#2D8CFF", size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`
        rounded-full flex items-center justify-center font-bold text-white
        select-none flex-shrink-0
        ${sizeClasses[size]}
        ${className}
      `}
      style={{ backgroundColor: color }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
