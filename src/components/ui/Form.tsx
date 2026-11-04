"use client";

import { forwardRef } from "react";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-graphite">{label}</span>
        {hint ? <span className="text-[12px] text-faint">{hint}</span> : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-[6px] border border-line bg-card px-4 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-ink/60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref,
) {
  return <input ref={ref} className={`${inputCls} ${className}`} {...props} />;
});

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputCls} h-auto min-h-[110px] py-3 leading-[1.5] ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={`${inputCls} appearance-none pr-10 ${className}`} {...props}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="m3 4.5 3 3 3-3" />
      </svg>
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2.5 text-[13px] transition-colors ${
        active ? "bg-ink text-paper" : "border border-line bg-card text-graphite hover:border-ink/40"
      } ${className}`}
    >
      {children}
    </button>
  );
}
