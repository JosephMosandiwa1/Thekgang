"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface LabelProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldLabel({ label, hint, error, required, children }: LabelProps) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </div>
      {children}
      {hint && !error && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </label>
  );
}

const INPUT_CLASS =
  "w-full px-3 py-2 border border-gray-300 bg-white text-sm text-black focus:outline-none focus:border-black transition-colors disabled:bg-gray-100 disabled:text-gray-500";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...rest },
  ref
) {
  return <input ref={ref} className={cn(INPUT_CLASS, className)} {...rest} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, rows = 4, ...rest },
  ref
) {
  return <textarea ref={ref} rows={rows} className={cn(INPUT_CLASS, "resize-y min-h-[80px]", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={cn(INPUT_CLASS, className)} {...rest}>
      {children}
    </select>
  );
});
