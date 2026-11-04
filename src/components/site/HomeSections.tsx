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
import { waLink } from "@/lib/whatsapp";
import { TiltCard } from "@/components/ui/tilt-card";

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

const FALLBACK_SLIDE: HeroSlide = {
  id: "padrao",
  active: true,
  eyebrow: "Brian iPhones",
  title: "iPhone bom é iPhone com nome.",
  subtitle: "Novos e seminovos revisados, com garantia da loja em Itatiba.",
  ctaLabel: "Ver aparelhos",
  ctaHref: "/loja",
  glow: "#c8662f",
  eyebrowColor: "#bf4800",
};

export function HeroBanner() {
  const db = useDB();
  const slides = useMemo<ResolvedSlide[]>(() => {
    if (!db) return [];
    const ok = db.storefront.heroSlides
      .filter((s) => s.active)
      .map((s) => ({ slide: s, product: db.products.find((x) => x.id === s.productId) }))
      // slide de produto só aparece se o produto estiver à venda
      .filter((x) => !x.slide.productId || (x.product && x.product.active && x.product.stock > 0));
    if (ok.length) return ok;
    // nenhum slide disponível (produtos vendidos, banner desligado…): mostra o destaque mais recente,
    // ou um slide padrão da loja. O banner nunca fica vazio.
    const p = db.products.find((x) => x.active && x.stock > 0 && x.featured) ?? db.products.find((x) => x.active && x.stock > 0);
    return [{ slide: p ? { ...FALLBACK_SLIDE, id: `auto-${p.id}`, productId: p.id, title: "", subtitle: "", glow: p.colorHex } : FALLBACK_SLIDE, product: p }];
  }, [db]);
  const settings = useSettings();
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
              ) : (
                <a
                  href={waLink(settings.whatsapp, "Olá, Brian! Vim pelo site.")}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline inline-flex h-11 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-4 text-[15px] font-medium sm:h-12 sm:flex-none sm:px-6 sm:text-[16px]"
                >
                  Falar no WhatsApp <ChevronRight size={16} />
                </a>
              )}
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
          {s && !p && (
            <div key={`art-${s.id}`} className="absolute inset-0 flex items-center justify-center">
              <div className="h-[108%] translate-y-[14%] md:h-[118%] md:translate-y-[12%]">
                <div className="device-in h-full drop-shadow-[0_50px_60px_rgba(0,0,0,0.22)]">
                  <DeviceArt id={`hero-${s.id}`} category="iphone" name="iPhone" color={s.glow || "#c8662f"} className="h-full w-auto" />
                </div>
              </div>
            </div>
          )}
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
    <ul className="mx-auto flex min-h-[44px] max-w-[1320px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-3 sm:px-6 md:gap-x-10 md:py-4">
      {items.map((it) => (
        <li key={it.id}>
          <Link href={it.href || "/"} className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink md:text-[13px]">
            <span className="shrink-0 opacity-70 [&>svg]:h-4 [&>svg]:w-4">{PERK_ICON[it.icon](16)}</span>
            <span className="whitespace-nowrap">{it.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Categorias ---------------- */

export function CategoryTiles() {
  const db = useDB();
  const cats = (db?.storefront.categories ?? []).filter((c) => c.active);
  return (
    <div className="no-scrollbar -mx-5 flex min-h-[120px] snap-x gap-2.5 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:gap-3 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
      {cats.map((c) => (
        <TiltCard key={c.id} max={14} glareOpacity={0.1} className="group w-[31%] shrink-0 snap-start rounded-[var(--radius-card,18px)] bg-mist sm:w-[24%] md:w-auto">
          <Link href={c.href} className="flex h-full flex-col px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5">
            <div className="flex h-[64px] items-center justify-center sm:h-[96px] md:h-[110px]">
              <div className="h-full w-[78%] transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-[1.06]">
                {c.art === "magsafe" ? <MagsafeArt /> : <DeviceArt id={`cat-${c.id}`} category={c.art} name={c.label} color={c.color} className="h-full w-full" />}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-1 sm:mt-4 sm:gap-2">
              <span className="truncate text-[13px] font-medium sm:text-[15px]">{c.label}</span>
              <ChevronRight size={15} className="hidden shrink-0 text-ink/70 transition-transform group-hover:translate-x-0.5 sm:block" />
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

const SHELF_ITEM = "w-[calc((100%-24px)/2.2)] shrink-0 snap-start sm:w-[calc((100%-32px)/3.2)] md:w-[calc((100%-60px)/4)] xl:w-[calc((100%-80px)/5)]";

export function Shelf({ title, subtitle, href, list, loading }: { title: string; subtitle?: string; href: string; list: Product[]; loading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const [swiped, setSwiped] = useState(false);

  /* Dica de "arraste pro lado" no celular: a fileira dá um empurrãozinho
     quando aparece na tela, e a pílula some assim que a pessoa arrasta. */
  useEffect(() => {
    const el = ref.current;
    if (!el || loading) return;
    const touch = window.matchMedia("(hover: none), (max-width: 767px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!touch) return;
    let auto = false;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const onScroll = () => {
      if (!auto && el.scrollLeft > 8) setSwiped(true);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    let done = false;
    // dispara quando a fileira entra no meio da tela (pela posição, funciona em qualquer navegador)
    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top > vh * 0.7 || r.bottom < vh * 0.3) return;
      done = true;
      window.removeEventListener("scroll", check);
      if (reduce || el.scrollLeft > 8 || el.scrollWidth <= el.clientWidth + 4) return;
      auto = true;
      // o "imã" dos cards atrapalharia o empurrãozinho: desliga só durante a dica
      el.style.scrollSnapType = "none";
      // animação própria (quadro a quadro): vai 64px pro lado e volta
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const slide = (from: number, to: number, ms: number, then?: () => void) => {
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / ms);
          el.scrollLeft = from + (to - from) * ease(t);
          if (t < 1) raf = requestAnimationFrame(step);
          else then?.();
        };
        raf = requestAnimationFrame(step);
      };
      timers.push(
        setTimeout(
          () =>
            slide(0, 64, 520, () =>
              timers.push(
                setTimeout(
                  () =>
                    slide(64, 0, 620, () => {
                      el.style.scrollSnapType = "";
                      auto = false;
                    }),
                  220,
                ),
              ),
            ),
          350,
        ),
      );
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", check);
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      el.style.scrollSnapType = "";
      timers.forEach(clearTimeout);
    };
  }, [loading, list.length]);

  if (!loading && list.length === 0) return null;

  return (
    <Reveal as="section">
      <div className="flex items-end justify-between gap-3">
        <h2 className="min-w-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[24px] md:text-[32px]">
          {title}
          {subtitle ? <span className="hidden text-faint sm:inline"> {subtitle}</span> : null}
        </h2>
        <Link href={href} className="relative z-10 -mr-2 flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-1.5 text-[14px] text-accent hover:underline sm:text-[15px]">
          Ver tudo <ChevronRight size={15} />
        </Link>
      </div>
      <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-5 mt-0 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto overscroll-x-contain px-5 pb-6 pt-3 sm:-mx-6 sm:scroll-px-6 sm:gap-4 sm:px-6 md:-mx-8 md:scroll-px-8 md:px-8 md:gap-5">
        {!loading
          ? list.map((p) => <ProductCard key={p.id} p={p} className={SHELF_ITEM} />)
          : Array.from({ length: 5 }).map((_, k) => (
              <div key={k} className={SHELF_ITEM}>
                <ProductCardSkeleton />
              </div>
            ))}
      </div>
      {!loading && list.length > 2 ? (
        <div
          aria-hidden
          className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-500 md:hidden ${swiped ? "opacity-0" : "opacity-100"}`}
        >
          <span className="glass flex items-center gap-1 rounded-full py-1.5 pl-3 pr-2 text-[12px] font-medium text-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]">
            Arraste
            <span className="swipe-hint flex text-accent">
              <ChevronRight size={14} />
              <ChevronRight size={14} className="-ml-2.5 opacity-60" />
            </span>
          </span>
        </div>
      ) : null}
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
  const steps = [
    ["Conte sobre o aparelho", "Modelo, cor, armazenamento, bateria e peças trocadas."],
    ["Mande as fotos", "Frente, verso e laterais."],
    ["Receba a avaliação", "Pelo WhatsApp. O valor vira desconto no novo."],
  ];
  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#eef3fb_0%,#f7f4f9_50%,#fbf1e8_100%)] px-3 py-3 sm:rounded-[32px] sm:px-8 sm:py-14 md:py-16">
      {/* luzes atrás do vidro */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[8%] top-[-30%] h-[420px] w-[420px] rounded-full bg-[#5ac8fa]/45 blur-[90px]" />
        <div className="absolute bottom-[-35%] right-[-6%] h-[460px] w-[460px] rounded-full bg-[#ff9f0a]/35 blur-[100px]" />
        <div className="absolute left-[45%] top-[30%] h-[300px] w-[300px] rounded-full bg-[#bf5af2]/20 blur-[90px]" />
      </div>

      <div className="glass mx-auto max-w-[980px] rounded-[24px] px-5 py-9 text-center sm:rounded-[28px] sm:px-12 sm:py-12 md:py-14">
        <p className="text-[13px] font-semibold text-highlight sm:text-[15px]">Troca na entrada</p>
        <h2 className="display mx-auto mt-1.5 max-w-[640px] text-[28px] sm:mt-2 sm:text-[48px] md:text-[56px]">Seu iPhone vale entrada.</h2>
        <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-[1.5] text-graphite/80 sm:mt-4 sm:text-[17px] md:text-[19px]">
          Avaliamos o seu aparelho sem você sair de casa. O valor entra como parte do pagamento.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-7 sm:gap-x-6 sm:gap-y-3">
          <Link href="/troca" className="btn-accent inline-flex h-11 items-center rounded-full px-6 text-[15px] font-medium">
            Avaliar meu aparelho
          </Link>
          <Link href="/troca" className="inline-flex items-center gap-0.5 text-[15px] text-accent hover:underline">
            Como funciona <ChevronRight size={15} />
          </Link>
        </div>

        <ol className="mt-8 grid gap-2 text-left sm:mt-12 sm:grid-cols-3 sm:gap-3">
          {steps.map(([t, d], k) => (
            <li key={t} className="glass-soft flex gap-3 rounded-[18px] p-4 sm:block sm:rounded-[20px] sm:p-5">
              <p className="pt-0.5 text-[12px] font-semibold text-faint tabular sm:pt-0 sm:text-[13px]">0{k + 1}</p>
              <div>
                <p className="text-[15px] font-semibold tracking-[-0.015em] sm:mt-2 sm:text-[16.5px]">{t}</p>
                <p className="mt-0.5 text-[13px] leading-[1.45] text-muted sm:mt-1 sm:text-[14px]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
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
    <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:gap-4 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
      {items.map(([t, d], k) => (
        <TiltCard key={t} max={12} glareOpacity={0.1} className="w-[68%] shrink-0 snap-start rounded-[18px] bg-mist p-5 sm:w-auto sm:p-7">
          <span className="text-[13px] font-semibold text-accent tabular">0{k + 1}</span>
          <p className="mt-2 text-[17px] font-semibold tracking-[-0.02em] sm:mt-3 sm:text-[21px]">{t}</p>
          <p className="mt-1.5 text-[13.5px] leading-[1.5] text-muted sm:mt-2 sm:text-[15px]">{d}</p>
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
      <div className="mx-auto grid max-w-[1320px] gap-3 px-4 sm:gap-4 sm:px-6 md:grid-cols-[1.1fr_1fr] md:px-8">
        <TiltCard max={6} glareColor="#ffffff" glareOpacity={0.12} className="flex min-h-[220px] flex-col justify-between rounded-[24px] bg-black p-6 text-white sm:min-h-[300px] sm:rounded-[28px] sm:p-8 md:min-h-[440px] md:p-12">
          {/* Troque por uma foto real da fachada/balcão */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[#2997ff]/20 blur-[90px]" />
          <Pin size={26} className="relative text-[#a1a1a6]" />
          <div className="relative">
            <p className="text-[17px] font-semibold text-[#2997ff]">Loja física · desde 2020</p>
            <p className="display mt-1 text-[44px] sm:mt-2 sm:text-[56px] md:text-[88px]">Itatiba.</p>
            <p className="mt-2 text-[17px] text-[#a1a1a6]">Seis anos atendendo olho no olho.</p>
          </div>
        </TiltCard>
        <TiltCard max={6} glareOpacity={0.08} className="flex flex-col justify-between gap-6 rounded-[24px] bg-mist p-6 sm:gap-8 sm:rounded-[28px] sm:p-8 md:p-12">
          <div>
            <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.025em] sm:text-[28px] md:text-[34px]">
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
      {eyebrow ? <p className="text-[13px] text-muted sm:text-[15px] md:text-[17px]">{eyebrow}</p> : null}
      <h2 className="mt-0.5 text-[22px] font-semibold tracking-[-0.03em] sm:mt-1 sm:text-[28px] md:text-[36px]">{title}</h2>
    </div>
  );
}

