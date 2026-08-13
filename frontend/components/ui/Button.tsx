"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<string, string> = {
  primary: "bg-zoom-blue text-white hover:bg-zoom-blue-hover shadow-sm",
  secondary: "bg-zoom-surface text-zoom-text-primary border border-zoom-border hover:bg-gray-100",
  outline: "bg-white text-zoom-text-primary border border-zoom-border hover:bg-gray-50",
  danger: "bg-zoom-red text-white hover:bg-zoom-red-hover",
  success: "bg-zoom-green text-white hover:bg-zoom-green-hover",
  ghost: "bg-transparent text-zoom-text-primary hover:bg-gray-100",
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold
          rounded-md transition-all duration-150 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-zoom-blue/30
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
