"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDB } from "@/lib/store";
import { installment, money } from "@/lib/format";
import type { HeroSlide, Perk, Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { ProductMedia } from "./ProductMedia";
import { DeviceArt } from "./DeviceArt";
import { Reveal } from "./Reveal";
import { ArrowRight, Bag, CardIcon, ChevronLeft, ChevronRight, Pin, Shield, Store, Swap, Truck } from "@/components/ui/Icons";
import { useSettings } from "./useSettings";
import { TiltCard } from "@/components/ui/be-ui-tilt-card";

/* Frase padrão quando o slide não tem frase */
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

/* ---------------- Banner principal (editável em Admin > Vitrine) ---------------- */

type ResolvedSlide = { slide: HeroSlide; product?: Product };

export function HeroBanner() {
  const db = useDB();
  const slides = useMemo<ResolvedSlide[]>(() => {
    if (!db) return [];
    return db.storefront.heroSlides
      .filter((s) => s.active)
      .map((s) => ({ slide: s, product: db.products.find((x) => x.id === s.productId) }))
      // slide de produto só aparece se o produto estiver à venda
      .filter((x) => !x.slide.productId || (x.product && x.product.active && x.product.stock > 0));
  }, [db]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), 7000);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const cur = slides[i % Math.max(1, n)];
  const s = cur?.slide;
  const p = cur?.product;
  const href = s ? s.ctaHref || (p ? `/loja/${p.slug}` : "/loja") : "/loja";

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#f2f2f5_100%)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* luz na cor do slide + arco de fundo */}
      {s && (
        <div
          key={`glow-${s.id}`}
          className="slide-in pointer-events-none absolute bottom-[-25%] left-[5%] h-[55%] w-[90%] rounded-full opacity-[0.2] blur-[80px] md:bottom-auto md:left-auto md:right-[-10%] md:top-[-20%] md:h-[140%] md:w-[70%] md:opacity-[0.22] md:blur-[90px]"
          style={{ background: s.glow }}
        />
      )}
      <div className="pointer-events-none absolute -right-[18%] top-[-30%] hidden aspect-square w-[78%] rounded-full border border-white bg-white/40 shadow-[inset_0_0_80px_rgba(255,255,255,0.9)] md:block" />

      <div className="relative mx-auto grid max-w-[1320px] grid-rows-[auto_auto] px-5 sm:px-6 md:min-h-[460px] md:grid-cols-[1.05fr_1fr] md:grid-rows-1 md:px-8 lg:min-h-[500px]">
        {s ? (
          <div key={s.id} className="slide-in relative z-10 flex flex-col justify-center pt-7 sm:pt-10 md:py-16 md:pl-6 lg:pl-12">
            {s.eyebrow ? (
              <p className="text-[15px] font-semibold sm:text-[17px] md:text-[19px]" style={{ color: s.eyebrowColor }}>
                {s.eyebrow}
              </p>
            ) : null}
            <h1 className="display mt-1 text-[34px] min-[400px]:text-[40px] sm:text-[52px] lg:text-[64px]">{s.title || p?.name}</h1>
            <p className="mt-2 max-w-[440px] text-[17px] font-medium leading-[1.3] tracking-[-0.02em] text-muted sm:mt-3 sm:text-[24px] lg:text-[28px]">
              {s.subtitle || (p ? tagline(p) : "")}
            </p>
            {p ? (
              <p className="mt-3 text-[14px] text-ink tabular sm:mt-4 sm:text-[15px]">
                <span className="font-semibold">{money(p.price)}</span>
                <span className="text-muted"> à vista ou 12x de {installment(p.price)}</span>
              </p>
            ) : null}
            <div className="mt-5 flex gap-2.5 sm:mt-6 sm:flex-wrap sm:gap-3">
              <Link href={href} className="btn-ink inline-flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-full px-5 text-[15px] font-medium sm:h-12 sm:flex-none sm:px-7 sm:text-[16px]">
                {s.ctaLabel || "Comprar agora"}
              </Link>
              {p ? (
                <Link href={`/loja/${p.slug}`} className="btn-outline inline-flex h-11 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-4 text-[15px] font-medium sm:h-12 sm:flex-none sm:px-6 sm:text-[16px]">
                  Saiba mais <ChevronRight size={16} />
                </Link>
              ) : null}
            </div>
            {n > 1 && (
              <div className="mt-5 flex items-center gap-2 sm:mt-9">
                {slides.map((x, k) => (
                  <button
                    key={x.slide.id}
                    onClick={() => setI(k)}
                    aria-label={`Destaque ${k + 1}`}
                    className={`h-2 rounded-full transition-all duration-500 ${k === i % n ? "w-6 bg-ink" : "w-2 bg-ink/20 hover:bg-ink/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        <div className="pointer-events-none relative h-[230px] min-[400px]:h-[260px] sm:h-[320px] md:h-auto md:min-h-0">
          {p && s && (
            <div key={`art-${s.id}`} className="absolute inset-0 flex items-center justify-center">
              {p.images.length ? (
                <div className="slide-in h-[86%] w-[86%]">
                  <ProductMedia p={p} className="!object-contain" />
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

export const PERK_ICON: Record<Perk["icon"], (size: number) => React.ReactNode> = {
  truck: (z) => <Truck size={z} />,
  bag: (z) => <Bag size={z} />,
  card: (z) => <CardIcon size={z} />,
  shield: (z) => <Shield size={z} />,
  store: (z) => <Store size={z} />,
  swap: (z) => <Swap size={z} />,
};

export function Perks() {
  const db = useDB();
  const items = db?.storefront.perks ?? [];
  return (
    <div className="border-b border-line bg-white shadow-[0_10px_30px_-24px_rgba(0,0,0,0.25)]">
      <ul className="no-scrollbar mx-auto flex min-h-[84px] max-w-[1320px] snap-x gap-8 overflow-x-auto px-6 py-5 md:grid md:grid-cols-4 md:gap-4 md:px-8 md:py-6">
        {items.map((it) => (
          <li key={it.id} className="shrink-0 snap-start md:flex md:justify-center">
            <Link href={it.href || "/"} className="flex items-center gap-3.5 transition-colors hover:text-accent">
              <span className="text-ink">{PERK_ICON[it.icon](30)}</span>
              <span>
                <span className="block whitespace-nowrap text-[14.5px] font-semibold">{it.title}</span>
                <span className="block whitespace-nowrap text-[13px] text-muted">{it.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Categorias ---------------- */

export function CategoryTiles() {
  const db = useDB();
  const cats = (db?.storefront.categories ?? []).filter((c) => c.active);
  return (
    <div className="no-scrollbar -mx-6 flex min-h-[170px] snap-x gap-3 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
      {cats.map((c) => (
        <TiltCard key={c.id} max={14} glareOpacity={0.1} className="group w-[40%] shrink-0 snap-start rounded-[var(--radius-card,18px)] bg-mist sm:w-[28%] md:w-auto">
          <Link href={c.href} className="flex h-full flex-col px-4 pb-4 pt-5">
            <div className="flex h-[96px] items-center justify-center md:h-[110px]">
              <div className="h-full w-[78%] transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.06]">
                {c.art === "magsafe" ? <MagsafeArt /> : <DeviceArt id={`cat-${c.id}`} category={c.art} name={c.label} color={c.color} className="h-full w-full" />}
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

export function Shelf({ title, subtitle, href, list, loading }: { title: string; subtitle?: string; href: string; list: Product[]; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  if (!loading && list.length === 0) return null;

  return (
    <Reveal as="section">
      <div className="flex items-end justify-between gap-3">
        <h2 className="min-w-0 text-[22px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[24px] md:text-[32px]">
          {title}
          {subtitle ? <span className="text-faint"> {subtitle}</span> : null}
        </h2>
        <Link href={href} className="relative z-10 -mr-2 flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-2 text-[15px] text-accent hover:underline">
          Ver tudo <ChevronRight size={15} />
        </Link>
      </div>
      <div ref={ref} className="no-scrollbar -mx-5 mt-1 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-8 pt-4 sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 md:-mx-8 md:scroll-px-8 md:px-8 md:gap-5">
        {!loading
          ? list.map((p) => <ProductCard key={p.id} p={p} className={SHELF_ITEM} />)
          : Array.from({ length: 5 }).map((_, k) => (
              <div key={k} className={SHELF_ITEM}>
                <ProductCardSkeleton />
              </div>
            ))}
      </div>
      <div className="-mt-2 hidden justify-end md:flex">
        <div className="flex gap-3">
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

