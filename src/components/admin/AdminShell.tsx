"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isLogged, logout } from "@/lib/auth";
import { useDB } from "@/lib/store";
import { Logo } from "@/components/site/Logo";
import { ArrowUpRight } from "@/components/ui/Icons";

const NAV = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/contatos", label: "Contatos" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

const noopSubscribe = () => () => {};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const db = useDB();
  const logged = useSyncExternalStore(
    noopSubscribe,
    () => isLogged(),
    () => null,
  );
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (!isLogin && logged === false) router.replace("/admin/login");
  }, [isLogin, logged, router]);

  if (isLogin) return <>{children}</>;
  if (!logged) return <div className="min-h-dvh bg-paper" />;

  const newLeads = db?.leads.filter((l) => l.status === "novo").length ?? 0;

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-ink text-paper lg:h-dvh lg:border-b-0">
        <div className="flex h-14 items-center justify-between px-5 lg:h-20">
          <Link href="/admin">
            <Logo tone="paper" compact />
          </Link>
          <span className="label rounded-full border border-paper/20 px-2 py-1 text-[9px] text-paper/60 lg:hidden">Admin</span>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center justify-between rounded-[6px] px-3 py-2.5 text-[14px] transition-colors ${
                  active ? "bg-paper/10 text-paper" : "text-paper/55 hover:bg-paper/5 hover:text-paper"
                }`}
              >
                {n.label}
                {n.href === "/admin/contatos" && newLeads > 0 && (
                  <span className="ml-3 rounded-full bg-paper px-1.5 text-[11px] font-semibold text-ink tabular">{newLeads}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-4 hidden space-y-1 lg:block">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-[6px] px-3 py-2.5 text-[13px] text-paper/55 hover:bg-paper/5 hover:text-paper"
          >
            Ver site <ArrowUpRight size={14} />
          </Link>
          <button
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
            className="w-full rounded-[6px] px-3 py-2.5 text-left text-[13px] text-paper/55 hover:bg-paper/5 hover:text-paper"
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line px-5 pb-6 pt-8 md:px-10 md:pt-12">
      <div>
        <p className="label text-muted">{eyebrow}</p>
        <h1 className="display mt-3 text-[34px] md:text-[44px]">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[8px] border border-line bg-card ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[14px] font-semibold tracking-[-0.005em]">{title}</h2>
          {aside}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function RangeFilter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-card p-1">
      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`h-8 rounded-full px-3.5 text-[13px] transition-colors ${value === d ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          {d} dias
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, delta, hint }: { label: string; value: string; delta?: number | null; hint?: string }) {
  return (
    <div className="rounded-[8px] border border-line bg-card p-5">
      <p className="label text-[10px] text-muted">{label}</p>
      <p className="mt-4 text-[30px] font-bold leading-none tracking-[-0.03em] tabular">{value}</p>
      <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
        {typeof delta === "number" && isFinite(delta) ? (
          <span className={`font-medium tabular ${delta >= 0 ? "text-ok" : "text-bad"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
        {hint}
      </p>
    </div>
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-graphite"
      : variant === "danger"
        ? "border border-bad/30 text-bad hover:bg-bad/5"
        : "border border-line bg-card hover:border-ink/40";
  return (
    <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors disabled:opacity-40 ${v} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/30 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div
        className={`absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[var(--ease-out-quint)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button onClick={onClose} className="h-9 rounded-full border border-line px-3 text-[13px]">
            Fechar
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{open ? children : null}</div>
      </div>
    </div>
  );
}
