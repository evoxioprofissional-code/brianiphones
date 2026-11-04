"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDB } from "@/lib/store";
import { installment, money } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { ProductMedia } from "./ProductMedia";
import { DeviceArt } from "./DeviceArt";
import { Reveal } from "./Reveal";
import { ArrowRight, Bag, CardIcon, ChevronLeft, ChevronRight, Pin, Shield, Truck } from "@/components/ui/Icons";
import { useSettings } from "./useSettings";
import { TiltCard } from "@/components/ui/be-ui-tilt-card";

/* Frase curta de cada linha, no tom das páginas de produto */
const TAGLINE: Record<string, string> = {
  "iphone-novo": "Potência, câmera e design em outro nível.",
  "iphone-seminovo": "Revisado, com bateria medida e garantia da loja.",
  macbook: "Leve, rápido e com bateria pro dia todo.",
  ipad: "Tela grande pra criar, estudar e assistir.",
  watch: "Saúde, treino e avisos direto no pulso.",
  acessorio: "Som e conforto pra acompanhar o seu iPhone.",
};
const tagline = (p: Product) =>
  p.category === "iphone" ? TAGLINE[p.condition === "novo" ? "iphone-novo" : "iphone-seminovo"] : TAGLINE[p.category];

/* ---------------- Banner principal ---------------- */

export function HeroBanner() {
  const db = useDB();
  const slides = useMemo(
    () => (db?.products ?? []).filter((x) => x.active && x.featured && x.stock > 0).slice(0, 4),
    [db],
  );
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), 7000);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const p = slides[i % Math.max(1, n)];

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#f2f2f5_100%)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* luz na cor do aparelho + arco de fundo */}
      {p && (
        <div
          key={`glow-${p.id}`}
          className="slide-in pointer-events-none absolute bottom-[-25%] left-[5%] h-[55%] w-[90%] rounded-full opacity-[0.2] blur-[80px] md:bottom-auto md:left-auto md:right-[-10%] md:top-[-20%] md:h-[140%] md:w-[70%] md:opacity-[0.22] md:blur-[90px]"
          style={{ background: p.colorHex }}
        />
      )}
      <div className="pointer-events-none absolute -right-[18%] top-[-30%] hidden aspect-square w-[78%] rounded-full border border-white bg-white/40 shadow-[inset_0_0_80px_rgba(255,255,255,0.9)] md:block" />

      <div className="relative mx-auto grid min-h-[600px] max-w-[1320px] grid-rows-[auto_1fr] px-6 md:min-h-[460px] md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:px-8 lg:min-h-[500px]">
        {p ? (
          <div key={p.id} className="slide-in relative z-10 flex flex-col justify-center pt-10 md:py-16 md:pl-6 lg:pl-12">
            <p className="text-[17px] font-semibold text-[#bf4800] md:text-[19px]">{p.condition === "novo" ? "Novo" : p.condition === "vitrine" ? "Vitrine" : "Seminovo"}</p>
            <h1 className="display mt-1.5 text-[40px] sm:text-[52px] lg:text-[64px]">{p.name}</h1>
            <p className="mt-3 max-w-[440px] text-[20px] font-medium leading-[1.25] tracking-[-0.02em] text-muted sm:text-[24px] lg:text-[28px]">
              {tagline(p)}
            </p>
            <p className="mt-4 text-[15px] text-ink tabular">
              <span className="font-semibold">{money(p.price)}</span>
              <span className="text-muted"> à vista ou 12x de {installment(p.price)}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/loja/${p.slug}`} className="btn-ink inline-flex h-12 items-center rounded-full px-7 text-[16px] font-medium">
                Comprar agora
              </Link>
              <Link href={`/loja/${p.slug}`} className="btn-outline inline-flex h-12 items-center gap-1 rounded-full px-6 text-[16px] font-medium">
                Saiba mais <ChevronRight size={16} />
              </Link>
            </div>
            {n > 1 && (
              <div className="mt-9 flex items-center gap-2">
                {slides.map((s, k) => (
                  <button
                    key={s.id}
                    onClick={() => setI(k)}
                    aria-label={`Destaque ${k + 1}`}
                    className={`h-2 rounded-full transition-all duration-500 ${k === i ? "w-6 bg-ink" : "w-2 bg-ink/20 hover:bg-ink/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="pointer-events-none relative min-h-[300px] md:min-h-0">
          {p && (
            <div key={`art-${p.id}`} className="absolute inset-0 flex items-center justify-center">
              {p.images.length ? (
                <div className="slide-in h-[86%] w-[86%] overflow-hidden rounded-[24px]">
                  <ProductMedia p={p} />
                </div>
              ) : (
                <div className="h-[108%] translate-y-[14%] md:h-[118%] md:translate-y-[12%]">
                  <div className="device-in h-full drop-shadow-[0_50px_60px_rgba(0,0,0,0.22)]">
                    <ProductMedia p={p} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Vantagens ---------------- */

export function Perks() {
  const items = [
    { icon: <Truck size={30} />, t: "Envio para todo o Brasil", d: "Com seguro e rastreio" },
    { icon: <Bag size={30} />, t: "Retire na loja", d: "Grátis, em Itatiba" },
    { icon: <CardIcon size={30} />, t: "Até 12x no cartão", d: "Pagamento pelo Mercado Pago" },
    { icon: <Shield size={30} />, t: "Garantia da loja", d: "Seminovo revisado um por um" },
  ];
  return (
    <div className="border-b border-line bg-white shadow-[0_10px_30px_-24px_rgba(0,0,0,0.25)]">
      <ul className="no-scrollbar mx-auto flex max-w-[1320px] snap-x gap-8 overflow-x-auto px-6 py-5 md:grid md:grid-cols-4 md:gap-4 md:px-8 md:py-6">
        {items.map((it) => (
          <li key={it.t} className="flex shrink-0 snap-start items-center gap-3.5 md:justify-center">
            <span className="text-ink">{it.icon}</span>
            <span>
              <span className="block whitespace-nowrap text-[14.5px] font-semibold">{it.t}</span>
              <span className="block whitespace-nowrap text-[13px] text-muted">{it.d}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Categorias ---------------- */

const CATS: { key: string; href: string; label: string; art: Category | "magsafe"; color: string; name: string }[] = [
  { key: "iphone", href: "/loja?c=iphone", label: "iPhone", art: "iphone", color: "#4a4f5c", name: "iPhone" },
  { key: "mac", href: "/loja?c=macbook", label: "MacBook", art: "macbook", color: "#c9ccd3", name: "MacBook" },
  { key: "ipad", href: "/loja?c=ipad", label: "iPad", art: "ipad", color: "#b9a9d9", name: "iPad" },
  { key: "watch", href: "/loja?c=watch", label: "Apple Watch", art: "watch", color: "#2e2f33", name: "Apple Watch" },
  { key: "airpods", href: "/loja?q=AirPods", label: "AirPods", art: "acessorio", color: "#f4f4f4", name: "AirPods" },
  { key: "acc", href: "/loja?c=acessorio", label: "Acessórios", art: "magsafe", color: "#e8e8ed", name: "Carregador" },
];

export function CategoryTiles() {
  return (
    <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
      {CATS.map((c) => (
        <TiltCard
          key={c.key}
          max={14}
          glareOpacity={0.1}
          className="group w-[40%] shrink-0 snap-start rounded-[18px] bg-mist sm:w-[28%] md:w-auto"
        >
        <Link href={c.href} className="flex h-full flex-col px-4 pb-4 pt-5">
          <div className="flex h-[96px] items-center justify-center md:h-[110px]">
            <div className="h-full w-[78%] transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.06]">
              {c.art === "magsafe" ? (
                <MagsafeArt />
              ) : (
                <DeviceArt id={`cat-${c.key}`} category={c.art} name={c.name} color={c.color} className="h-full w-full" />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="text-[15px] font-medium">{c.label}</span>
            <ChevronRight size={16} className="shrink-0 text-ink/70 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
        </TiltCard>
      ))}
    </div>
  );
}

function MagsafeArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Carregador">
      <defs>
        <radialGradient id="ms-g" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d2d2d7" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="88" r="62" fill="url(#ms-g)" stroke="#c7c7cc" strokeWidth="2" />
      <circle cx="100" cy="88" r="44" fill="none" stroke="#e5e5ea" strokeWidth="2" />
      <path d="M100 150 C100 172 120 180 150 182" fill="none" stroke="#d2d2d7" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Vitrine (prateleira) ---------------- */

const SHELF_ITEM = "w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)]";

export function Shelf({
  title,
  subtitle,
  href,
  filter,
}: {
  title: string;
  subtitle?: string;
  href: string;
  filter: (p: Product) => boolean;
}) {
  const db = useDB();
  const list = useMemo(() => (db?.products ?? []).filter((p) => p.active && p.stock > 0 && filter(p)).slice(0, 10), [db, filter]);
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  if (db && list.length === 0) return null;

  return (
    <Reveal as="section">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[32px]">
          {title}
          {subtitle ? <span className="text-faint"> {subtitle}</span> : null}
        </h2>
        <Link href={href} className="hidden shrink-0 items-center gap-0.5 pb-1 text-[15px] text-accent hover:underline sm:flex">
          Ver tudo <ChevronRight size={15} />
        </Link>
      </div>
      <div ref={ref} className="no-scrollbar -mx-6 mt-2 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-14 pt-5 md:-mx-8 md:scroll-px-8 md:px-8 md:gap-5">
        {db
          ? list.map((p) => <ProductCard key={p.id} p={p} className={SHELF_ITEM} />)
          : Array.from({ length: 5 }).map((_, k) => (
              <div key={k} className={SHELF_ITEM}>
                <ProductCardSkeleton />
              </div>
            ))}
      </div>
      <div className="-mt-9 flex items-center justify-between">
        <Link href={href} className="flex items-center gap-0.5 text-[15px] text-accent hover:underline sm:hidden">
          Ver tudo <ChevronRight size={15} />
        </Link>
        <div className="ml-auto hidden gap-3 md:flex">
          <button onClick={() => scroll(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-mist text-ink/70 transition-colors hover:bg-[#e8e8ed]" aria-label="Voltar">
            <ChevronLeft size={17} />
          </button>
          <button onClick={() => scroll(1)} className="grid h-9 w-9 place-items-center rounded-full bg-mist text-ink/70 transition-colors hover:bg-[#e8e8ed]" aria-label="Avançar">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- Banner de troca ---------------- */

export function TradeBanner() {
  return (
    <div className="relative grid overflow-hidden rounded-[28px] bg-black text-white md:grid-cols-[1.15fr_1fr]">
      <div className="pointer-events-none absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-[#2997ff]/25 blur-[100px]" />
      <div className="relative px-7 py-12 md:px-14 md:py-16">
        <p className="text-[17px] font-semibold text-[#2997ff]">Troca na entrada</p>
        <h2 className="display mt-2 text-[40px] md:text-[56px]">Seu iPhone vale entrada.</h2>
        <p className="mt-4 max-w-[420px] text-[17px] leading-[1.45] text-[#a1a1a6] md:text-[19px]">
          Conta como está o seu aparelho, manda as fotos e escolhe o que quer levar. A avaliação volta pelo WhatsApp.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="/troca" className="btn-accent inline-flex h-12 items-center rounded-full px-7 text-[16px] font-medium">
            Avaliar meu aparelho
          </Link>
          <Link href="/troca" className="inline-flex items-center gap-0.5 text-[16px] text-[#2997ff] hover:underline">
            Como funciona <ChevronRight size={16} />
          </Link>
        </div>
      </div>
      <ol className="relative grid content-center gap-3 px-7 pb-12 md:py-16 md:pl-0 md:pr-14">
        {[
          ["Seu aparelho", "Modelo, cor, GB, bateria e peças trocadas."],
          ["Fotos", "Frente, verso e laterais."],
          ["O que você quer", "A diferença no Pix, cartão ou parcelado."],
        ].map(([t, d], k) => (
          <li key={t}>
            <TiltCard max={10} glareColor="#ffffff" glareOpacity={0.12} className="flex items-start gap-4 rounded-[18px] bg-white/[0.07] p-5 backdrop-blur">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[13px] font-semibold text-black">{k + 1}</span>
              <span>
                <span className="block text-[17px] font-semibold">{t}</span>
                <span className="mt-0.5 block text-[14.5px] text-[#a1a1a6]">{d}</span>
              </span>
            </TiltCard>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- Por que comprar aqui ---------------- */

export function TrustGrid() {
  const items = [
    ["Bateria medida", "A saúde da bateria está no anúncio. Abaixo de 80%, a gente troca antes de vender."],
    ["Procedência", "IMEI consultado e iCloud desvinculado. Sem bloqueio, sem surpresa."],
    ["Tudo testado", "Face ID, câmeras, tela, som e carregamento conferidos na revisão."],
    ["Loja de verdade", "Seis anos em Itatiba e mais de 6 mil clientes. Dá pra passar e conhecer."],
  ];
  return (
    <div className="no-scrollbar -mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
      {items.map(([t, d], k) => (
        <TiltCard key={t} max={12} glareOpacity={0.1} className="w-[78%] shrink-0 snap-start rounded-[18px] bg-mist p-7 sm:w-auto">
          <span className="text-[13px] font-semibold text-accent tabular">0{k + 1}</span>
          <p className="mt-3 text-[21px] font-semibold tracking-[-0.02em]">{t}</p>
          <p className="mt-2 text-[15px] leading-[1.5] text-muted">{d}</p>
        </TiltCard>
      ))}
    </div>
  );
}

/* ---------------- Loja física ---------------- */

export function StoreBlock() {
  const s = useSettings();
  return (
    <section id="loja-fisica" className="scroll-mt-24">
      <div className="mx-auto grid max-w-[1320px] gap-4 px-6 md:grid-cols-[1.1fr_1fr] md:px-8">
        <TiltCard max={6} glareColor="#ffffff" glareOpacity={0.12} className="flex min-h-[300px] flex-col justify-between rounded-[28px] bg-black p-8 text-white md:min-h-[440px] md:p-12">
          {/* Troque por uma foto real da fachada/balcão */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[#2997ff]/20 blur-[90px]" />
          <Pin size={26} className="relative text-[#a1a1a6]" />
          <div className="relative">
            <p className="text-[17px] font-semibold text-[#2997ff]">Loja física · desde 2020</p>
            <p className="display mt-2 text-[56px] md:text-[88px]">Itatiba.</p>
            <p className="mt-2 text-[17px] text-[#a1a1a6]">Seis anos atendendo olho no olho.</p>
          </div>
        </TiltCard>
        <TiltCard max={6} glareOpacity={0.08} className="flex flex-col justify-between gap-8 rounded-[28px] bg-mist p-8 md:p-12">
          <div>
            <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[34px]">
              Passa aqui na loja. <span className="text-faint">Mais de 6 mil clientes já passaram.</span>
            </h2>
            <p className="mt-4 max-w-[440px] text-[16px] leading-[1.55] text-muted">
              Compre pelo site e retire na loja, ou venha testar o aparelho antes de fechar.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              ["Endereço", s.address],
              ["Cidade", s.city],
              ["Horário", s.hours],
              ["Instagram", `@${s.instagram}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12px] text-muted">{k}</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="btn-ink inline-flex h-12 w-fit items-center gap-2 rounded-full px-7 text-[16px] font-medium">
            Como chegar <ArrowRight size={16} />
          </a>
        </TiltCard>
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, className = "" }: { eyebrow?: string; title: string; className?: string }) {
  return (
    <div className={className}>
      {eyebrow ? <p className="text-[15px] text-muted md:text-[17px]">{eyebrow}</p> : null}
      <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] md:text-[36px]">{title}</h2>
    </div>
  );
}

