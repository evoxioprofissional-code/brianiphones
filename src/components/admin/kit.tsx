"use client";

/*
 * Kit visual do painel: tudo que se repete nas telas do admin mora aqui,
 * pra todas as páginas terem a mesma cara.
 */

import Link from "next/link";
import { forwardRef, useEffect, useId } from "react";
import { ArrowLeft, Check, ChevronDown, Search, TrendingDown, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

/* ---------------- Estrutura ---------------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
  eyebrow,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 pt-6 md:px-8 md:pt-8">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
            <ArrowLeft size={15} /> {back.label}
          </Link>
        ) : null}
        {eyebrow ? <div className="mb-1.5 text-[13px] text-muted">{eyebrow}</div> : null}
        <h1 className="truncate text-[26px] font-semibold tracking-[-0.025em] md:text-[30px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[14px] text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-16 md:px-8", className)}>{children}</div>;
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)]", className)}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-1 pt-4 md:px-6">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn(padded && "p-5 md:p-6", padded && title && "pt-3 md:pt-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ---------------- Indicadores ---------------- */

export function Kpi({
  label,
  value,
  delta,
  hint,
  icon,
  tone = "blue",
  spark,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number | null;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  spark?: number[];
}) {
  const up = typeof delta === "number" && delta >= 0;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-muted">{label}</p>
        {icon ? <span className={cn("grid h-9 w-9 place-items-center rounded-xl", TONE_SOFT[tone])}>{icon}</span> : null}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular">{value}</p>
      <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
        {typeof delta === "number" && isFinite(delta) ? (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium tabular", up ? "bg-[#e8f6ec] text-[#1f8a3e]" : "bg-[#fdecec] text-[#d70015]")}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
        <span className="relative z-10 max-w-[62%] truncate">{hint}</span>
      </div>
      {spark && spark.length > 1 ? <Sparkline values={spark} className="absolute bottom-0 right-0 h-10 w-[36%] opacity-70" color={TONE_HEX[tone]} /> : null}
    </div>
  );
}

export function Sparkline({ values, className, color = "#0071e3" }: { values: number[]; className?: string; color?: string }) {
  const id = useId();
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 36 - ((v - min) / (max - min || 1)) * 30]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L100,40 L0,40 Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------------- Selos ---------------- */

export type Tone = "gray" | "blue" | "green" | "orange" | "red" | "purple" | "teal" | "indigo";

export const TONE_SOFT: Record<Tone, string> = {
  gray: "bg-[#f2f2f4] text-[#58585e]",
  blue: "bg-[#e8f2fd] text-[#0066cc]",
  green: "bg-[#e8f6ec] text-[#1f7a39]",
  orange: "bg-[#fff2e5] text-[#b25e09]",
  red: "bg-[#fdecec] text-[#c40014]",
  purple: "bg-[#f3eefc] text-[#7a3fd1]",
  teal: "bg-[#e5f6f4] text-[#0f7a6e]",
  indigo: "bg-[#ecedfd] text-[#4045c9]",
};
const TONE_DOT: Record<Tone, string> = {
  gray: "bg-[#8e8e93]",
  blue: "bg-[#0071e3]",
  green: "bg-[#2fae58]",
  orange: "bg-[#f08c1b]",
  red: "bg-[#e3203a]",
  purple: "bg-[#8e54e9]",
  teal: "bg-[#14a394]",
  indigo: "bg-[#5856d6]",
};
export const TONE_HEX: Record<Tone, string> = {
  gray: "#8e8e93",
  blue: "#0071e3",
  green: "#2fae58",
  orange: "#f08c1b",
  red: "#e3203a",
  purple: "#8e54e9",
  teal: "#14a394",
  indigo: "#5856d6",
};

export function Badge({ tone = "gray", dot, children, className }: { tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium leading-none", TONE_SOFT[tone], className)}>
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} /> : null}
      {children}
    </span>
  );
}

export const ORDER_TONE: Record<OrderStatus, Tone> = {
  aguardando_pagamento: "orange",
  pago: "blue",
  separando: "purple",
  embalado: "indigo",
  enviado: "teal",
  entregue: "green",
  cancelado: "red",
};

export const ORDER_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  embalado: "Pronto para envio",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_TONE[status]} dot>
      {ORDER_LABEL[status]}
    </Badge>
  );
}

/* ---------------- Botões ---------------- */

type BtnVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-[#1d1d1f] text-white hover:bg-black",
  accent: "bg-[#0071e3] text-white hover:bg-[#0077ed]",
  secondary: "bg-white text-ink shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:bg-[#fafafa]",
  ghost: "text-ink hover:bg-black/[0.05]",
  danger: "bg-white text-[#d70015] shadow-[0_0_0_1px_rgba(215,0,21,0.25)] hover:bg-[#fff5f5]",
};

export const AButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "icon" }
>(function AButton({ variant = "secondary", size = "md", className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background,box-shadow,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "md" && "h-10 px-4 text-[14px]",
        size === "icon" && "h-9 w-9 text-[14px]",
        BTN[variant],
        className,
      )}
      {...props}
    />
  );
});

export function ALink({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  target,
}: {
  href: string;
  variant?: BtnVariant;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background,box-shadow]",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
        BTN[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ---------------- Formulário ---------------- */

const fieldCls =
  "w-full rounded-xl border-0 bg-[#f5f5f7] px-3.5 text-[14px] text-ink outline-none ring-1 ring-transparent transition-[box-shadow,background] placeholder:text-[#a1a1a6] hover:bg-[#efeff2] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/60";

export function FormField({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-[#424245]">{label}</span>
        {hint ? <span className="text-[12px] text-faint">{hint}</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-[12px] text-bad">{error}</span> : null}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string }>(
  function TextInput({ className, prefix, suffix, ...props }, ref) {
    if (prefix || suffix) {
      return (
        <span className="relative block">
          {prefix ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted">{prefix}</span> : null}
          <input ref={ref} className={cn(fieldCls, "h-10", prefix && "pl-10", suffix && "pr-12", className)} {...props} />
          {suffix ? <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-muted">{suffix}</span> : null}
        </span>
      );
    }
    return <input ref={ref} className={cn(fieldCls, "h-10", className)} {...props} />;
  },
);

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldCls, "min-h-[96px] py-2.5 leading-[1.55]", className)} {...props} />;
}

export function SelectInput({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(fieldCls, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[14px] disabled:opacity-40"
    >
      <span className={cn("relative h-[22px] w-[38px] rounded-full transition-colors duration-300", checked ? "bg-[#34c759]" : "bg-[#e5e5ea]")}>
        <span
          className={cn(
            "absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            checked ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function Checkbox({ checked, onChange, indeterminate, label }: { checked: boolean; onChange: (v: boolean) => void; indeterminate?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] transition-colors",
        checked || indeterminate ? "bg-[#0071e3] text-white" : "bg-white shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_0_0_1.5px_rgba(0,113,227,0.6)]",
      )}
    >
      {indeterminate ? <span className="h-[2px] w-2 rounded bg-white" /> : checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  );
}

export function ColorInput({ value, onChange, presets }: { value: string; onChange: (v: string) => void; presets?: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-black/10" style={{ background: value }}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} className="font-mono uppercase" />
      </div>
      {presets ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn("h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110", value.toLowerCase() === c.toLowerCase() && "ring-2 ring-[#0071e3] ring-offset-2")}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- Navegação dentro da tela ---------------- */

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: T; label: React.ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[#e8e8ed]/70 p-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-all",
            value === it.value ? "bg-white font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-[#424245] hover:text-ink",
          )}
        >
          {it.label}
          {typeof it.count === "number" ? <span className={cn("text-[11.5px] tabular", value === it.value ? "text-muted" : "text-faint")}>{it.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Buscar"}
        className={cn(fieldCls, "h-10 bg-white pl-9 pr-8 shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-white")}
      />
      {value ? (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-black/5" aria-label="Limpar busca">
          <X size={14} />
        </button>
      ) : null}
    </label>
  );
}

/* ---------------- Vazio / Modal ---------------- */

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon ? <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f5f5f7] text-muted">{icon}</span> : null}
      <p className="mt-4 text-[16px] font-semibold">{title}</p>
      {text ? <p className="mt-1 max-w-[360px] text-[14px] text-muted">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <div className={cn("fixed inset-0 z-[80] grid place-items-center p-4", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ maxWidth: width }}
        className={cn(
          "relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
      >
        <header className="flex items-center justify-between gap-4 px-6 pb-2 pt-5">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-[#f5f5f7] text-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-4">{open ? children : null}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] px-6 py-4">{footer}</footer> : null}
      </div>
    </div>
  );
}

/* ---------------- Tabela ---------------- */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[13.5px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("sticky top-0 border-b border-black/[0.06] bg-white px-4 py-3 text-[12px] font-medium text-muted first:pl-5 last:pr-5", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-black/[0.05] px-4 py-3.5 align-middle first:pl-5 last:pr-5 group-last:border-b-0", className)}>{children}</td>;
}
