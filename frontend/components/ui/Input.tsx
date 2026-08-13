"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-zoom-text-primary mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm rounded-md border transition-colors
            bg-white text-zoom-text-primary placeholder:text-zoom-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-zoom-blue/30 focus:border-zoom-blue
            ${error ? "border-zoom-red" : "border-zoom-border"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-zoom-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
