"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useDB } from "@/lib/store";

/** Aplica as cores escolhidas em Admin > Vitrine > Cores no site inteiro */
export function StorefrontTheme() {
  const db = useDB();
  const t = db?.storefront.theme;
  useEffect(() => {
    if (!t) return;
    const root = document.documentElement.style;
    root.setProperty("--color-accent", t.accent);
    root.setProperty("--color-highlight", t.highlight);
    root.setProperty("--color-primary", t.primary);
    root.setProperty("--color-mist", t.surface);
    root.setProperty("--radius-card", `${t.radius}px`);
    return () => {
      ["--color-accent", "--color-highlight", "--color-primary", "--color-mist", "--radius-card"].forEach((k) => root.removeProperty(k));
    };
  }, [t]);
  return null;
}

/** Faixa de aviso no topo do site (Admin > Vitrine > Aviso) */
export function AnnouncementBar() {
  const db = useDB();
  const a = db?.storefront.announcement;
  if (!a?.active || !a.text) return null;
  return (
    <Link href={a.href || "/"} className="block text-center text-[13px] font-medium transition-[filter] hover:brightness-110" style={{ background: a.bg, color: a.fg }}>
      <span className="mx-auto block max-w-[1320px] px-5 py-2.5">{a.text} ›</span>
    </Link>
  );
}
