"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addLead, useDB } from "@/lib/store";
import { addToCart } from "@/lib/cart";
import { installment, money } from "@/lib/format";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/lib/site";
import { quoteMessage, waLink } from "@/lib/whatsapp";
import { formatCep, quoteShipping, type ShippingOption } from "@/lib/shipping";
import type { Product } from "@/lib/types";
import { ProductMedia } from "./ProductMedia";
import { ProductCard } from "./ProductCard";
import { Qty } from "./CartDrawer";
import { ArrowRight, Bag, CardIcon, Shield, Store, Swap, Truck, WhatsApp } from "@/components/ui/Icons";

export function ProductView() {
  const { slug } = useParams<{ slug: string }>();
  const db = useDB();
  const p = db?.products.find((x) => x.slug === slug);

  const related = useMemo(
    () =>
      (db?.products ?? [])
        .filter((x) => x.active && x.stock > 0 && x.id !== p?.id && x.category === p?.category)
        .slice(0, 4),
    [db, p],
  );

  if (!db) return <div className="h-screen" />;

  if (!p || !p.active) {
    return (
      <section className="mx-auto max-w-[1320px] px-5 pb-32 pt-24 text-center md:px-8">
        <p className="label text-muted">Produto indisponível</p>
        <h1 className="display mt-4 text-[44px]">Esse aparelho já foi vendido.</h1>
        <Link href="/loja" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
          Ver o que tem na loja <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-4 pb-10 pt-4 sm:px-5 md:px-8 md:pb-16 md:pt-8">
        <nav className="flex flex-wrap gap-2 text-[12.5px] text-muted sm:text-[13px]">
          <Link href="/" className="hover:text-ink">Início</Link>
          <span>/</span>
          <Link href={`/loja?c=${p.category}`} className="hover:text-ink">{CATEGORY_LABEL[p.category]}</Link>
          <span>/</span>
          <span className="text-ink">{p.name}</span>
        </nav>

        <div className="mt-3 grid gap-3 sm:mt-5 sm:gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">
          <Gallery p={p} />
          <BuyBox p={p} whatsapp={db.settings.whatsapp} />
        </div>

        <Details p={p} />
      </section>

      <MobileBuyBar p={p} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1320px] px-4 pb-28 sm:px-5 md:px-8 md:pb-20">
          <h2 className="text-[21px] font-bold tracking-[-0.025em] sm:text-[24px] md:text-[28px]">Quem viu este, viu também</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Gallery({ p }: { p: Product }) {
  const [img, setImg] = useState(0);
  const n = p.images.length;
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {n > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {p.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setImg(i)}
              className={`aspect-square w-16 shrink-0 overflow-hidden rounded-[8px] border bg-card md:w-full ${
                img === i ? "border-ink" : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              <ProductMedia p={p} index={i} />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-[4/3.4] flex-1 overflow-hidden surface rounded-[20px] sm:aspect-square lg:aspect-auto lg:min-h-[560px]">
        <div className={`absolute inset-0 ${n ? "" : "flex items-center justify-center p-[16%]"}`}>
          <ProductMedia p={p} index={img} />
        </div>
        {n === 0 && <p className="absolute bottom-4 left-4 text-[12px] text-muted">Ilustração · peça as fotos reais no WhatsApp</p>}
      </div>
    </div>
  );
}

function BuyBox({ p, whatsapp }: { p: Product; whatsapp: string }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const off = p.priceFrom && p.priceFrom > p.price ? Math.round((1 - p.price / p.priceFrom) * 100) : 0;

  const onQuote = () => {
    addLead({ type: "orcamento", quote: { productId: p.id, productName: `${p.name} ${p.storage}`, price: p.price } });
  };

  return (
    <div className="lg:sticky lg:top-[132px] lg:self-start">
      <div className="surface rounded-[20px] p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="rounded-full bg-white px-2.5 py-1 font-medium">{CONDITION_LABEL[p.condition]}</span>
          {p.battery && p.condition !== "novo" ? <span className="rounded-full bg-white px-2.5 py-1 font-medium tabular">Bateria {p.battery}%</span> : null}
          {p.stock === 1 && <span className="rounded-full bg-ink px-2.5 py-1 font-medium text-paper">Última unidade</span>}
        </div>

        <h1 className="mt-4 text-[28px] font-bold leading-[1.1] tracking-[-0.03em] md:text-[32px]">
          {p.name} {p.storage}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-[14px] text-muted">
          <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.colorHex }} />
          {p.color}
        </p>

        <div className="mt-6 border-t border-line pt-5">
          {p.priceFrom ? (
            <p className="flex items-center gap-2 text-[14px] text-muted tabular">
              <span className="line-through">{money(p.priceFrom)}</span>
              {off > 0 && <span className="text-[13px] font-semibold text-[#bf4800]">-{off}%</span>}
            </p>
          ) : null}
          <p className="mt-1 text-[38px] font-bold leading-none tracking-[-0.035em] tabular">{money(p.price)}</p>
          <p className="mt-1.5 text-[13.5px] text-muted">à vista no Pix</p>
          <p className="mt-2 flex items-center gap-2 text-[14px] tabular">
            <CardIcon size={17} className="text-muted" />
            ou <strong className="font-semibold">12x de {installment(p.price)}</strong> no cartão
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-[13.5px] text-muted">{p.stock > 1 ? `${p.stock} disponíveis` : "1 disponível"}</span>
          {p.stock > 1 && <Qty value={qty} max={p.stock} onChange={(n) => setQty(Math.max(1, n))} />}
        </div>

        <div className="mt-4 grid gap-2.5">
          <button
            onClick={() => {
              addToCart(p, qty, false);
              router.push("/checkout");
            }}
            className="btn-accent flex h-[52px] items-center justify-center rounded-full text-[15px] font-semibold"
          >
            Comprar agora
          </button>
          <button
            onClick={() => addToCart(p, qty)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-ink/20 bg-paper/60 text-[15px] font-medium transition-colors hover:border-ink"
          >
            <Bag size={18} /> Adicionar ao carrinho
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-2">
          <Link
            href={`/troca?quero=${encodeURIComponent(`${p.name} ${p.storage} ${p.color}`)}`}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-mist px-2 py-2.5 text-[12.5px] font-medium text-graphite hover:text-accent sm:text-[13px]"
          >
            <Swap size={16} /> Dar o meu na troca
          </Link>
          <a
            href={waLink(whatsapp, quoteMessage(p))}
            onClick={onQuote}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-mist px-2 py-2.5 text-[12.5px] font-medium text-graphite hover:text-accent sm:text-[13px]"
          >
            <WhatsApp size={16} /> Tirar dúvida
          </a>
        </div>
      </div>

      <ShippingCalc subtotal={p.price * qty} />

      <ul className="mt-3 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line text-[13px]">
        {[
          [<Shield key="s" size={18} />, `Garantia da loja de ${p.warrantyMonths} ${p.warrantyMonths === 1 ? "mês" : "meses"}`],
          [<CardIcon key="c" size={18} />, "Pagamento seguro pelo Mercado Pago"],
          [<Store key="l" size={18} />, "Retire grátis na loja em Itatiba"],
        ].map(([icon, t], k) => (
          <li key={k} className="flex items-center gap-3 bg-card px-4 py-3">
            <span className="text-muted">{icon}</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShippingCalc({ subtotal }: { subtotal: number }) {
  const [cep, setCep] = useState("");
  const [opts, setOpts] = useState<ShippingOption[] | null>(null);
  const [err, setErr] = useState(false);
  const calc = () => {
    const r = quoteShipping(cep, subtotal);
    setErr(!r);
    setOpts(r);
  };
  return (
    <div className="mt-3 surface rounded-[20px] p-5">
      <p className="flex items-center gap-2 text-[14px] font-semibold">
        <Truck size={18} /> Calcular frete e prazo
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          calc();
        }}
      >
        <input
          inputMode="numeric"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          placeholder="Seu CEP"
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-paper/60 px-4 text-[14px] outline-none placeholder:text-faint focus:border-ink/50 tabular"
        />
        <button className="h-11 rounded-full bg-ink px-5 text-[13px] font-medium text-paper">Calcular</button>
      </form>
      <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-muted underline underline-offset-2">
        Não sei meu CEP
      </a>
      {err && <p className="mt-2 text-[13px] text-bad">CEP inválido. Confere os 8 números.</p>}
      {opts && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {opts.map((o) => (
            <li key={o.method} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
              <span>
                <span className="block font-medium">{o.label}</span>
                <span className="text-[12.5px] text-muted">{o.days}</span>
              </span>
              <span className="font-semibold tabular">{o.price === 0 ? "Grátis" : money(o.price)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Details({ p }: { p: Product }) {
  const specs: [string, string][] = [
    ["Categoria", CATEGORY_LABEL[p.category]],
    ["Modelo", p.name],
    [p.category === "watch" ? "Conexão" : "Armazenamento", p.storage],
    ["Cor", p.color],
    ["Estado", CONDITION_LABEL[p.condition]],
    ...(p.battery ? ([["Saúde da bateria", `${p.battery}%`]] as [string, string][]) : []),
    ["Garantia da loja", `${p.warrantyMonths} ${p.warrantyMonths === 1 ? "mês" : "meses"}`],
  ];
  return (
    <div className="mt-6 grid gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-[1fr_420px] lg:gap-8">
      <div className="surface rounded-[20px] p-5 md:p-7">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">Ficha técnica</h2>
        <dl className="mt-4 text-[14px]">
          {specs.map(([k, v], i) => (
            <div key={k} className={`grid grid-cols-[130px_1fr] gap-3 rounded-[6px] px-3 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4 ${i % 2 ? "" : "bg-paper/50"}`}>
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {p.notes ? (
          <>
            <h3 className="mt-8 text-[16px] font-semibold">Sobre este aparelho</h3>
            <p className="mt-2 text-[14.5px] leading-[1.65] text-graphite">{p.notes}</p>
          </>
        ) : null}
      </div>
      <div className="surface rounded-[20px] p-5 md:p-7">
        <h2 className="text-[20px] font-bold tracking-[-0.02em]">{p.condition === "novo" ? "Lacrado na caixa" : "Revisado antes de vender"}</h2>
        <ul className="mt-4 space-y-3 text-[14px] leading-[1.5] text-graphite">
          {(p.condition === "novo"
            ? ["Produto novo, lacrado de fábrica.", "Nota e caixa originais.", "Garantia Apple a partir da ativação, mais a garantia da loja."]
            : [
                "Bateria medida e informada no anúncio.",
                "Face ID, câmeras, tela, som e carregamento testados.",
                "IMEI consultado e iCloud desvinculado.",
                "Se alguma peça foi trocada, está escrito aqui.",
              ]
          ).map((t) => (
            <li key={t} className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Barra fixa no rodapé do celular, sempre com o preço e o botão de compra à mão */
function MobileBuyBar({ p }: { p: Product }) {
  const router = useRouter();
  return (
    <div className="mobile-buybar fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/90 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-12px_30px_-14px_rgba(47,111,208,0.45)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-[640px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold leading-none tracking-[-0.025em] tabular">{money(p.price)}</p>
          <p className="mt-1 truncate text-[11.5px] text-muted tabular">
            ou <strong className="font-semibold text-accent">12x {installment(p.price)}</strong>
          </p>
        </div>
        <button
          onClick={() => addToCart(p)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"
          aria-label="Adicionar ao carrinho"
        >
          <Bag size={20} />
        </button>
        <button
          onClick={() => {
            addToCart(p, 1, false);
            router.push("/checkout");
          }}
          className="btn-accent h-12 shrink-0 rounded-full px-6 text-[14.5px] font-semibold"
        >
          Comprar
        </button>
      </div>
    </div>
  );
}
