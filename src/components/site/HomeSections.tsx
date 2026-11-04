"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import { installment, money } from "@/lib/format";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/lib/site";
import type { Category } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ProductMedia } from "./ProductMedia";
import { DeviceArt } from "./DeviceArt";
import { Reveal } from "./Reveal";
import { ArrowRight, ArrowUpRight, Pin } from "@/components/ui/Icons";
import { useSettings } from "./useSettings";

export function HeroTag() {
  const db = useDB();
  const p = useMemo(
    () => db?.products.find((x) => x.active && x.featured && x.category === "iphone" && x.stock > 0),
    [db],
  );

  if (!p) {
    return <div className="aspect-[4/5] w-full rounded-[6px] bg-paper-2" />;
  }

  const rows: [string, string][] = [
    ["Modelo", p.name],
    ["Armaz.", p.storage],
    ["Cor", p.color],
    ["Estado", CONDITION_LABEL[p.condition]],
    ...(p.battery ? ([["Bateria", `${p.battery}%`]] as [string, string][]) : []),
    ["Garantia", `${p.warrantyMonths} meses`],
  ];

  return (
    <Link href={`/loja/${p.slug}`} className="group relative block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-paper-2">
        <div
          className={`absolute inset-0 ${p.images.length ? "" : "flex items-start justify-end p-[10%] pr-[12%]"}`}
        >
          <div className={p.images.length ? "h-full w-full" : "h-[88%] rotate-[8deg] transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:rotate-[5deg]"}>
            <ProductMedia p={p} />
          </div>
        </div>
        <p className="label absolute right-4 top-4 text-[10px] text-muted">Em destaque</p>
      </div>

      {/* Etiqueta */}
      <div className="absolute -bottom-6 left-4 w-[240px] rotate-[-2.5deg] rounded-[4px] border border-line bg-card p-4 shadow-[0_18px_40px_-20px_rgba(15,15,16,0.35)] transition-transform duration-500 group-hover:rotate-[-1deg] sm:left-6 sm:w-[260px]">
        <div className="mb-3 flex items-center justify-between">
          <span className="h-2.5 w-2.5 rounded-full border border-line bg-paper" />
          <span className="label text-[9px] text-muted">Brian iPhones</span>
        </div>
        <dl className="font-mono text-[11px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-dashed border-line py-1.5">
              <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
              <dd className="truncate text-right text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="label text-[9px] text-muted">À vista</p>
            <p className="text-[24px] font-bold tracking-[-0.02em] tabular">{money(p.price)}</p>
          </div>
          <p className="pb-1 font-mono text-[10px] text-muted tabular">12x {installment(p.price)}</p>
        </div>
      </div>
    </Link>
  );
}

const CATS: { id: Category; blurb: string; color: string; name: string }[] = [
  { id: "iphone", blurb: "Do 13 ao 17 Pro Max. Novos e seminovos.", color: "#2d3a52", name: "iPhone 17 Pro" },
  { id: "macbook", blurb: "Air e Pro, chip M. Pra trabalhar e estudar.", color: "#bfcbd8", name: "MacBook Air" },
  { id: "ipad", blurb: "Do básico ao Air, com e sem celular.", color: "#c3b8d6", name: "iPad Air" },
  { id: "watch", blurb: "Series e Ultra, GPS e celular.", color: "#3b3c40", name: "Apple Watch" },
  { id: "acessorio", blurb: "AirPods, carregadores, capas e películas.", color: "#f2f2f2", name: "AirPods" },
];

export function CategoryIndex() {
  const db = useDB();
  const [hover, setHover] = useState<Category>("iphone");
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    db?.products.filter((p) => p.active && p.stock > 0).forEach((p) => (c[p.category] = (c[p.category] ?? 0) + 1));
    return c;
  }, [db]);
  const current = CATS.find((c) => c.id === hover)!;

  return (
    <div className="mt-14 grid gap-10 md:grid-cols-12">
      <ul className="md:col-span-8">
        {CATS.map((c, i) => (
          <li key={c.id} onMouseEnter={() => setHover(c.id)}>
            <Link
              href={`/loja?c=${c.id}`}
              className="group grid grid-cols-[40px_1fr_auto] items-baseline gap-4 border-t border-line py-6 last:border-b md:grid-cols-[64px_1fr_auto] md:py-7"
            >
              <span className="label text-faint tabular">0{i + 1}</span>
              <div>
                <span
                  className={`display block text-[34px] transition-colors md:text-[52px] ${
                    hover === c.id ? "text-ink" : "text-ink/35 md:text-ink/30"
                  } max-md:text-ink`}
                >
                  {CATEGORY_LABEL[c.id]}
                </span>
                <span className="mt-2 block text-[14px] text-muted">{c.blurb}</span>
              </div>
              <span className="flex items-center gap-3 text-[13px] text-muted tabular">
                <span className="hidden sm:inline">{counts[c.id] ?? 0} disponíveis</span>
                <ArrowUpRight size={18} className="text-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:col-span-4 md:block">
        <div className="sticky top-28 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[6px] bg-paper-2 p-12">
          <div key={current.id} className="h-full w-full">
            <DeviceArt id={`cat-${current.id}`} category={current.id} name={current.name} color={current.color} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturedGrid() {
  const db = useDB();
  const list = useMemo(
    () => (db?.products ?? []).filter((p) => p.active && p.featured && p.stock > 0).slice(0, 8),
    [db],
  );

  if (!db) {
    return (
      <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-[6px] bg-paper-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-5 lg:grid-cols-4">
      {list.map((p, i) => (
        <Reveal key={p.id} delay={(i % 4) * 70}>
          <ProductCard p={p} index={i} />
        </Reveal>
      ))}
    </div>
  );
}

export function StoreBlock() {
  const s = useSettings();
  return (
    <section id="loja-fisica" className="scroll-mt-20 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1320px] md:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden border-b border-paper/10 md:min-h-[620px] md:border-b-0 md:border-r">
          {/* Troque por uma foto real da fachada/balcão: /public/loja.jpg */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_20%,#2a2a2d_0%,#0f0f10_70%)]" />
          <div className="absolute inset-x-8 bottom-8 md:inset-x-12 md:bottom-12">
            <p
              className="font-sans font-extrabold leading-[0.85] text-paper"
              style={{ fontVariationSettings: '"wdth" 125', fontSize: "clamp(64px, 9vw, 132px)", letterSpacing: "-0.03em" }}
            >
              ITATIBA
            </p>
            <p className="label mt-4 text-faint">Loja física · desde 2020</p>
          </div>
          <div className="absolute left-8 top-8 md:left-12 md:top-12">
            <Pin size={22} className="text-paper/60" />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-12 px-5 py-16 md:px-12 md:py-20">
          <Reveal>
            <p className="label text-faint">A loja</p>
            <h2 className="display mt-4 text-[40px] md:text-[56px]">
              Seis anos atendendo
              <br />
              <span className="text-faint">olho no olho.</span>
            </h2>
            <p className="mt-8 max-w-[440px] text-[16px] leading-[1.65] text-paper/70">
              Mais de 6 mil clientes passaram pelo balcão. Você pode comprar pelo WhatsApp e retirar na loja, ou vir testar o
              aparelho antes de fechar.
            </p>
          </Reveal>

          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-[6px] bg-paper/10 sm:grid-cols-2">
            {[
              ["Endereço", s.address],
              ["Cidade", s.city],
              ["Horário", s.hours],
              ["Instagram", `@${s.instagram}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink p-5">
                <dt className="label text-[10px] text-faint">{k}</dt>
                <dd className="mt-2 text-[15px] text-paper">{v}</dd>
              </div>
            ))}
          </dl>

          <a
            href={s.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex w-fit items-center gap-3 rounded-full border border-paper/25 px-6 py-3.5 text-[14px] transition-colors hover:border-paper"
          >
            Como chegar <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
