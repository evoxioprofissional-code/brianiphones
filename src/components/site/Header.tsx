"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Header as Header2, type HeaderLink } from "@/components/ui/header-2";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useSettings } from "./useSettings";
import { waLink } from "@/lib/whatsapp";
import { ArrowRight, Bag, CardIcon, Close, Search, Shield, Store, Swap, Truck, User, WhatsApp } from "@/components/ui/Icons";
import { useDB } from "@/lib/store";
import type { Perk } from "@/lib/types";
import { cartCount, openCart, useCart } from "@/lib/cart";

const NAV: HeaderLink[] = [
  { href: "/loja?c=iphone", label: "iPhone" },
  { href: "/loja?c=macbook", label: "Mac" },
  { href: "/loja?c=ipad", label: "iPad" },
  { href: "/loja?c=watch", label: "Apple Watch" },
  { href: "/loja?q=AirPods", label: "AirPods" },
  { href: "/loja?c=acessorio", label: "Acessórios" },
];

const MORE = [
  { href: "/loja?e=seminovo", label: "Seminovos" },
  { href: "/troca", label: "Troca na entrada" },
  { href: "/reparo", label: "Reparo e suporte" },
  { href: "/conta", label: "Meus pedidos" },
  { href: "/#loja-fisica", label: "A loja em Itatiba" },
];

const PERKS = [
  { t: "Envio para todo o Brasil", icon: Truck, href: "/#loja-fisica" },
  { t: "Retire grátis na loja em Itatiba", icon: Store, href: "/#loja-fisica" },
  { t: "Até 12x no cartão", icon: CardIcon, href: "/loja" },
  { t: "Seu iPhone vale entrada", icon: Shield, href: "/troca" },
];

const QUICK = ["iPhone 17 Pro", "iPhone seminovo", "MacBook Air", "Apple Watch", "AirPods"];

const PERK_ICONS: Record<Perk["icon"], typeof Truck> = { truck: Truck, bag: Bag, card: CardIcon, shield: Shield, store: Store, swap: Swap };

export function Header() {
  const db = useDB();
  const perks = db
    ? db.storefront.perks.map((p) => ({ t: p.title, icon: PERK_ICONS[p.icon], href: p.href || "/" }))
    : PERKS;
  return (
    <>
      {/* Faixa de vantagens */}
      <div className="bg-mist">
        <ul className="mx-auto flex h-10 max-w-[1320px] items-center justify-center px-5 text-[12.5px] text-ink md:h-11 md:text-[13px]">
          {perks.map(({ t, icon: Icon, href }, i) => (
            <li key={t} className={`items-center ${i === 0 ? "flex" : "hidden md:flex"}`}>
              {i > 0 && <span className="mx-5 hidden h-4 w-px bg-ink/15 md:block lg:mx-7" />}
              <Link href={href} className="flex items-center gap-2 transition-colors hover:text-accent">
                <Icon size={17} className="text-graphite" />
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* No servidor (e até ler a URL) o header sai igual, só sem o item ativo marcado */}
      <Suspense fallback={<SiteHeader activeHref={null} query="" />}>
        <SiteHeaderWithParams />
      </Suspense>
    </>
  );
}

function SiteHeaderWithParams() {
  const path = usePathname();
  const params = useSearchParams();
  const active =
    path === "/loja"
      ? (NAV.find((n) => {
          const [k, v] = n.href.split("?")[1].split("=");
          return params.get(k) === v;
        })?.href ?? null)
      : null;
  return <SiteHeader activeHref={active} query={path === "/loja" ? (params.get("q") ?? "") : ""} closeKey={`${path}?${params}`} />;
}

function SiteHeader({ activeHref, query, closeKey }: { activeHref: string | null; query: string; closeKey?: string }) {
  const settings = useSettings();
  const lines = useCart();
  const count = cartCount(lines);
  const [search, setSearch] = useState(false);

  const [lastKey, setLastKey] = useState(closeKey);
  if (closeKey !== lastKey) {
    setLastKey(closeKey);
    setSearch(false);
  }

  useEffect(() => {
    if (!search) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setSearch(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [search]);

  const links = NAV.map((n) => ({ ...n, active: n.href === activeHref }));

  const bagBadge = (
    <span
      className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-semibold tabular ${
        count ? "bg-accent text-white" : "bg-white/20 text-current"
      }`}
    >
      {count}
    </span>
  );

  return (
    <>
      <Header2
        closeKey={closeKey}
        brand={
          <Link href="/" aria-label="Brian iPhones, início">
            <Logo compact />
          </Link>
        }
        links={links}
        renderLink={(l, className, onClick) => (
          <Link key={l.href} href={l.href} className={className} onClick={onClick}>
            {l.label}
          </Link>
        )}
        actions={
          <>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Buscar" onClick={() => setSearch((v) => !v)}>
              <Search size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Meus pedidos" asChild>
              <Link href="/conta">
                <User size={19} />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full px-4 font-normal" asChild>
              <Link href="/reparo">Suporte</Link>
            </Button>
            <Button size="sm" className="rounded-full pl-3.5 pr-2.5" onClick={openCart} aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}>
              <Bag size={17} /> Sacola {bagBadge}
            </Button>
          </>
        }
        mobileActions={
          <>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Buscar" onClick={() => setSearch((v) => !v)}>
              <Search size={19} />
            </Button>
            <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Sacola, ${count} itens`} onClick={openCart}>
              <Bag size={21} />
              {count > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9.5px] font-semibold text-white tabular">
                  {count}
                </span>
              )}
            </Button>
          </>
        }
        mobileExtra={
          <div className="mt-4 border-t border-border pt-4">
            <p className="px-4 text-[12px] text-muted">Mais</p>
            <div className="mt-1 grid">
              {MORE.map((m) => (
                <Link key={m.href} href={m.href} className="rounded-xl px-4 py-2.5 text-[16px] font-medium hover:bg-mist">
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        }
        mobileFooter={
          <>
            <Button variant="outline" className="h-12 w-full rounded-full text-[15px]" asChild>
              <a href={waLink(settings.whatsapp, "Olá, Brian! Vim pelo site.")} target="_blank" rel="noreferrer">
                <WhatsApp size={18} /> Falar no WhatsApp
              </a>
            </Button>
            <Button className="h-12 w-full rounded-full text-[15px]" onClick={openCart}>
              <Bag size={18} /> Ver sacola {count ? `(${count})` : ""}
            </Button>
          </>
        }
      >
        {/* Painel de busca */}
        <div
          className={`absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-border bg-white/95 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-[max-height,opacity] duration-500 ease-[var(--ease-out-quint)] md:mx-0 ${
            search ? "max-h-[360px] opacity-100" : "pointer-events-none max-h-0 border-transparent opacity-0"
          }`}
        >
          <SearchPanel open={search} query={query} onClose={() => setSearch(false)} />
        </div>
      </Header2>
      {search && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setSearch(false)} />}
    </>
  );
}

function SearchPanel({ open, query, onClose }: { open: boolean; query: string; onClose: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => ref.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open]);
  const go = (q: string) => {
    onClose();
    router.push(q ? `/loja?q=${encodeURIComponent(q)}` : "/loja");
  };
  return (
    <div className="px-5 pb-6 pt-5 md:px-7">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(String(new FormData(e.currentTarget).get("q") ?? "").trim());
        }}
        className="flex items-center gap-3 border-b border-line pb-3"
      >
        <Search size={22} className="shrink-0 text-muted" />
        <input
          key={query}
          ref={ref}
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Buscar na Brian iPhones"
          className="h-11 w-full bg-transparent text-[20px] font-semibold tracking-[-0.02em] outline-none placeholder:text-faint md:text-[24px]"
        />
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-muted" aria-label="Fechar busca">
          <Close size={16} />
        </button>
      </form>
      <p className="mt-4 text-[12px] text-muted">Mais buscados</p>
      <ul className="mt-1.5">
        {QUICK.map((q) => (
          <li key={q}>
            <button onClick={() => go(q)} className="group flex items-center gap-3 py-1.5 text-[15px] font-medium text-ink/85 hover:text-accent">
              <ArrowRight size={15} className="text-faint group-hover:text-accent" />
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
