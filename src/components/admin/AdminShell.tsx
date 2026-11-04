"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Bell,
  ChevronRight,
  Command,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { isLogged, logout } from "@/lib/auth";
import { useDB } from "@/lib/store";
import { money, relative } from "@/lib/format";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import { AButton, Badge, OrderBadge, Kpi, Panel, Segmented } from "./kit";

type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number; exact?: boolean };

const noopSubscribe = () => () => {};

/** Telas que aparecem sem a moldura do painel */
const BARE = ["/admin/login", "/admin/imprimir"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const db = useDB();
  const logged = useSyncExternalStore(noopSubscribe, () => isLogged(), () => null);
  const bare = BARE.some((b) => path.startsWith(b));
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    if (path !== "/admin/login" && logged === false) router.replace("/admin/login");
  }, [path, logged, router]);

  // fecha o menu do celular ao navegar
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setMobileNav(false);
  }

  // Ctrl/⌘ + K abre a busca rápida
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  if (path === "/admin/login") return <>{children}</>;
  if (!logged) return <div className="min-h-dvh bg-[#f5f5f7]" />;
  if (bare) return <>{children}</>;

  const newLeads = db?.leads.filter((l) => l.status === "novo").length ?? 0;
  const toHandle = db?.orders.filter((o) => o.status === "pago" || o.status === "separando").length ?? 0;
  const toShip = db?.orders.filter((o) => o.status === "embalado").length ?? 0;

  const groups: { title: string; items: NavItem[] }[] = [
    { title: "", items: [{ href: "/admin", label: "Painel", icon: <LayoutDashboard size={18} />, exact: true }] },
    {
      title: "Vendas",
      items: [
        { href: "/admin/pedidos", label: "Pedidos", icon: <ShoppingBag size={18} />, badge: toHandle },
        { href: "/admin/logistica", label: "Logística", icon: <Truck size={18} />, badge: toShip },
        { href: "/admin/clientes", label: "Clientes", icon: <Users size={18} /> },
      ],
    },
    {
      title: "Catálogo",
      items: [
        { href: "/admin/produtos", label: "Produtos", icon: <Package size={18} /> },
        { href: "/admin/vitrine", label: "Vitrine do site", icon: <Palette size={18} /> },
      ],
    },
    {
      title: "Gestão",
      items: [
        { href: "/admin/contatos", label: "Contatos", icon: <MessageCircle size={18} />, badge: newLeads },
        { href: "/admin/financeiro", label: "Financeiro", icon: <Wallet size={18} /> },
        { href: "/admin/configuracoes", label: "Configurações", icon: <Settings size={18} /> },
      ],
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo compact />
          <span className="rounded-md bg-[#1d1d1f] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">ADMIN</span>
        </Link>
        <button onClick={() => setMobileNav(false)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 lg:hidden" aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      <button
        onClick={() => setPalette(true)}
        className="mx-3 mb-2 flex h-9 items-center gap-2 rounded-xl bg-[#f5f5f7] px-3 text-[13px] text-muted transition-colors hover:bg-[#ececf0]"
      >
        <Search size={15} />
        Buscar
        <span className="ml-auto flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[11px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
          <Command size={11} />K
        </span>
      </button>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.title || "main"} className="mt-3">
            {g.title ? <p className="px-3 pb-1.5 text-[11.5px] font-medium text-faint">{g.title}</p> : null}
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const active = n.exact ? path === n.href : path.startsWith(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className={cn(
                        "group flex h-9 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
                        active ? "bg-[#f0f0f3] font-medium text-ink" : "text-[#424245] hover:bg-[#f5f5f7] hover:text-ink",
                      )}
                    >
                      <span className={cn("transition-colors", active ? "text-[#0071e3]" : "text-[#86868b] group-hover:text-ink")}>{n.icon}</span>
                      {n.label}
                      {n.badge ? (
                        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#0071e3] px-1.5 text-[11px] font-semibold text-white tabular">{n.badge}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-black/[0.06] p-3">
        <Link href="/" target="_blank" className="flex h-9 items-center gap-3 rounded-xl px-3 text-[13.5px] text-[#424245] hover:bg-[#f5f5f7]">
          <ExternalLink size={16} className="text-[#86868b]" /> Ver loja
        </Link>
        <div className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#0071e3] to-[#5ac8fa] text-[13px] font-semibold text-white">B</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13.5px] font-medium">Brian</span>
            <span className="block text-[12px] text-muted">Administrador</span>
          </span>
          <button
            onClick={() => {
              logout();
              router.replace("/admin/login");
            }}
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f5f5f7] lg:grid lg:grid-cols-[256px_1fr]">
      {/* Lateral fixa no desktop */}
      <aside className="sticky top-0 hidden h-dvh border-r border-black/[0.06] bg-white lg:block">{sidebar}</aside>

      {/* Lateral no celular */}
      <div className={cn("fixed inset-0 z-[70] lg:hidden", mobileNav ? "" : "pointer-events-none")}>
        <div className={cn("absolute inset-0 bg-black/30 transition-opacity", mobileNav ? "opacity-100" : "opacity-0")} onClick={() => setMobileNav(false)} />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            mobileNav ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebar}
        </aside>
      </div>

      <div className="min-w-0">
        <TopBar onMenu={() => setMobileNav(true)} onSearch={() => setPalette(true)} />
        {children}
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

/* ---------------- Barra superior ---------------- */

function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const k = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", k);
    return () => window.removeEventListener("mousedown", k);
  }, [open]);

  const notes = useMemo(() => {
    if (!db) return [];
    const list: { id: string; href: string; title: string; text: string; at: string; tone: "blue" | "orange" | "green" }[] = [];
    db.orders
      .filter((o) => o.status === "pago" || o.status === "aguardando_pagamento")
      .slice(0, 6)
      .forEach((o) =>
        list.push({
          id: o.id,
          href: `/admin/pedidos/${o.id}`,
          title: o.status === "pago" ? `Pedido #${o.number} pago` : `Pedido #${o.number} aguardando pagamento`,
          text: `${o.customer.name} · ${money(o.total)}`,
          at: o.createdAt,
          tone: o.status === "pago" ? "green" : "orange",
        }),
      );
    db.leads
      .filter((l) => l.status === "novo")
      .slice(0, 4)
      .forEach((l) => list.push({ id: l.id, href: "/admin/contatos", title: "Novo contato pelo site", text: l.name ?? "Visitante", at: l.createdAt, tone: "blue" }));
    db.products
      .filter((p) => p.active && p.stock === 0)
      .slice(0, 3)
      .forEach((p) => list.push({ id: p.id, href: `/admin/produtos/${p.id}`, title: "Produto sem estoque", text: `${p.name} ${p.storage}`, at: p.updatedAt ?? p.createdAt, tone: "orange" }));
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [db]);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-black/[0.06] bg-[#f5f5f7]/80 px-4 backdrop-blur-xl md:px-8">
      <button onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 lg:hidden" aria-label="Abrir menu">
        <Menu size={19} />
      </button>
      <button
        onClick={onSearch}
        className="hidden h-9 w-[320px] items-center gap-2 rounded-full bg-white px-3.5 text-[13px] text-muted shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] md:flex"
      >
        <Search size={15} /> Buscar pedido, produto ou cliente…
        <span className="ml-auto text-[11px] text-faint">Ctrl K</span>
      </button>
      <button onClick={onSearch} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5 md:hidden" aria-label="Buscar">
        <Search size={18} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)] hover:bg-[#fafafa]"
            aria-label="Notificações"
          >
            <Bell size={17} />
            {notes.length ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ff3b30] ring-2 ring-white" /> : null}
          </button>
          <div
            className={cn(
              "absolute right-0 top-11 w-[340px] max-w-[calc(100vw-32px)] origin-top-right rounded-2xl bg-white p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-200",
              open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
            )}
          >
            <p className="px-3 pb-1 pt-2 text-[13px] font-semibold">Notificações</p>
            <ul className="max-h-[380px] overflow-y-auto">
              {notes.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">Tudo em dia.</li>}
              {notes.map((n) => (
                <li key={n.id + n.title}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f5f5f7]">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.tone === "green" ? "bg-[#2fae58]" : n.tone === "orange" ? "bg-[#f08c1b]" : "bg-[#0071e3]")} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium">{n.title}</span>
                      <span className="block truncate text-[12.5px] text-muted">{n.text}</span>
                    </span>
                    <span className="shrink-0 text-[11.5px] text-faint">{relative(n.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link href="/admin/produtos/novo" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 text-[13.5px] font-medium text-white hover:bg-black">
          <Plus size={16} /> <span className="hidden sm:inline">Novo produto</span>
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Busca rápida (Ctrl K) ---------------- */

const PAGES = [
  ["Painel", "/admin"],
  ["Pedidos", "/admin/pedidos"],
  ["Logística", "/admin/logistica"],
  ["Clientes", "/admin/clientes"],
  ["Produtos", "/admin/produtos"],
  ["Novo produto", "/admin/produtos/novo"],
  ["Vitrine do site", "/admin/vitrine"],
  ["Contatos", "/admin/contatos"],
  ["Financeiro", "/admin/financeiro"],
  ["Configurações", "/admin/configuracoes"],
].map(([label, href]) => ({ group: "Ir para", label, sub: "", href }));

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDB();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    if (!db) return [];
    const t = q.trim().toLowerCase().replace(/^#/, "");
    if (!t) return PAGES;
    const orders = db.orders
      .filter((o) => `${o.number} ${o.customer.name} ${o.customer.email} ${o.tracking?.code ?? ""}`.toLowerCase().includes(t))
      .slice(0, 6)
      .map((o) => ({ group: "Pedidos", label: `#${o.number} · ${o.customer.name}`, sub: money(o.total), href: `/admin/pedidos/${o.id}` }));
    const products = db.products
      .filter((p) => `${p.name} ${p.storage} ${p.color} ${p.sku ?? ""}`.toLowerCase().includes(t))
      .slice(0, 6)
      .map((p) => ({ group: "Produtos", label: `${p.name} ${p.storage}`, sub: `${p.color} · ${money(p.price)}`, href: `/admin/produtos/${p.id}` }));
    const seen = new Set<string>();
    const customers: typeof PAGES = [];
    for (const o of db.orders) {
      if (seen.has(o.customer.email)) continue;
      seen.add(o.customer.email);
      if (`${o.customer.name} ${o.customer.email} ${o.customer.phone}`.toLowerCase().includes(t)) {
        customers.push({ group: "Clientes", label: o.customer.name, sub: o.customer.email, href: `/admin/clientes?c=${encodeURIComponent(o.customer.email)}` });
      }
      if (customers.length >= 5) break;
    }
    return [...orders, ...products, ...customers, ...PAGES.filter((p) => p.label.toLowerCase().includes(t))];
  }, [db, q]);

  const go = (href: string) => {
    onClose();
    setQ("");
    router.push(href);
  };

  const safeSel = Math.min(sel, Math.max(0, results.length - 1));

  return (
    <div className={cn("fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-[600px] overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-200",
          open ? "scale-100 opacity-100" : "scale-[0.97] opacity-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5">
          <Search size={18} className="text-muted" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((v) => Math.min(v + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((v) => Math.max(v - 1, 0));
              }
              if (e.key === "Enter" && results[safeSel]) go(results[safeSel].href);
            }}
            placeholder="Buscar pedido (#1024), cliente, produto, SKU…"
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
          />
          <span className="rounded-md bg-[#f5f5f7] px-1.5 py-0.5 text-[11px] text-muted">Esc</span>
        </div>
        <ul className="max-h-[56vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-4 py-8 text-center text-[14px] text-muted">Nada encontrado.</li>}
          {results.map((r, i) => (
            <li key={r.group + r.href + r.label}>
              {i === 0 || results[i - 1].group !== r.group ? <p className="px-3 pb-1 pt-3 text-[11.5px] font-medium text-faint">{r.group}</p> : null}
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => go(r.href)}
                className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === safeSel ? "bg-[#0071e3] text-white" : "hover:bg-[#f5f5f7]")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{r.label}</span>
                  {r.sub ? <span className={cn("block truncate text-[12.5px]", i === safeSel ? "text-white/75" : "text-muted")}>{r.sub}</span> : null}
                </span>
                <ChevronRight size={16} className={i === safeSel ? "text-white/80" : "text-faint"} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Compatibilidade com telas antigas (financeiro, contatos) ---------------- */

export function PageHead({ eyebrow, title, actions }: { eyebrow: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-5 pb-5 pt-6 md:px-8 md:pt-8">
      <div>
        <p className="mb-1.5 text-[13px] text-muted">{eyebrow}</p>
        <h1 className="text-[26px] font-semibold tracking-[-0.025em] md:text-[30px]">{title}</h1>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, aside, children, className = "" }: { title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Panel title={title} actions={aside} className={className}>
      {children}
    </Panel>
  );
}

export function RangeFilter({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Segmented
      items={[7, 30, 90].map((d) => ({ value: String(d), label: `${d} dias` }))}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
      className="bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
    />
  );
}

export function Stat({ label, value, delta, hint }: { label: string; value: string; delta?: number | null; hint?: string }) {
  return <Kpi label={label} value={value} delta={delta} hint={hint} />;
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <AButton variant={variant === "primary" ? "primary" : variant === "danger" ? "danger" : "secondary"} className={className} {...props}>
      {children}
    </AButton>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <div className={cn("fixed inset-0 z-[75]", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div className={cn("absolute inset-0 bg-black/25 backdrop-blur-[1px] transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div
        style={{ maxWidth: width }}
        className={cn(
          "absolute inset-y-2 right-2 flex w-[calc(100%-16px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "translate-x-0" : "translate-x-[110%]",
        )}
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-[#f5f5f7] text-muted hover:text-ink" aria-label="Fechar">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{open ? children : null}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-black/[0.06] px-6 py-4">{footer}</footer> : null}
      </div>
    </div>
  );
}

export { Badge, OrderBadge };
