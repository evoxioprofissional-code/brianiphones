"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Close, Menu, WhatsApp } from "@/components/ui/Icons";
import { useSettings } from "./useSettings";
import { waLink } from "@/lib/whatsapp";

const NAV = [
  { href: "/loja", label: "Loja" },
  { href: "/troca", label: "Troca na entrada" },
  { href: "/reparo", label: "Reparo" },
  { href: "/#loja-fisica", label: "A loja" },
];

export function Header() {
  const path = usePathname();
  const settings = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color] duration-300 border-b ${
          scrolled || open ? "bg-paper/92 backdrop-blur-md border-line" : "bg-transparent border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-[72px] md:px-8">
          <Link href="/" onClick={() => setOpen(false)} className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((n) => {
              const active = path === n.href || (n.href !== "/" && path.startsWith(n.href) && !n.href.includes("#"));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative text-[14px] tracking-[-0.005em] transition-colors ${active ? "text-ink" : "text-graphite hover:text-ink"}`}
                >
                  {n.label}
                  {active && <span className="absolute -bottom-[25px] left-0 right-0 h-px bg-ink" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={waLink(settings.whatsapp, "Olá, Brian! Vim pelo site.")}
              target="_blank"
              rel="noreferrer"
              className="hidden h-10 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-graphite sm:inline-flex"
            >
              <WhatsApp size={16} />
              Falar com o Brian
            </a>
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-paper pt-16 transition-[opacity,visibility] duration-300 md:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex flex-col px-5 pt-6">
          {NAV.map((n, i) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="flex items-baseline justify-between border-b border-line py-5"
            >
              <span className="display text-[34px]">{n.label}</span>
              <span className="label text-muted">0{i + 1}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-5 bottom-8">
          <a
            href={waLink(settings.whatsapp, "Olá, Brian! Vim pelo site.")}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-paper"
          >
            <WhatsApp size={18} /> Falar no WhatsApp
          </a>
          <p className="label mt-4 text-center text-muted">{settings.city}</p>
        </div>
      </div>
    </>
  );
}
