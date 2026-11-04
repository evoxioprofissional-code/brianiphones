"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { addLead, useDB } from "@/lib/store";
import { installment, money } from "@/lib/format";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/lib/site";
import { quoteMessage, waLink } from "@/lib/whatsapp";
import { ProductMedia } from "./ProductMedia";
import { ProductCard } from "./ProductCard";
import { ArrowRight, WhatsApp } from "@/components/ui/Icons";

export function ProductView() {
  const { slug } = useParams<{ slug: string }>();
  const db = useDB();
  const [img, setImg] = useState(0);
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
      <section className="mx-auto max-w-[1320px] px-5 pb-32 pt-40 text-center md:px-8">
        <p className="label text-muted">404</p>
        <h1 className="display mt-4 text-[48px]">Esse aparelho já foi vendido.</h1>
        <Link href="/loja" className="mt-8 inline-flex items-center gap-2 border-b border-ink pb-1 text-[14px]">
          Ver o que tem na loja <ArrowRight size={15} />
        </Link>
      </section>
    );
  }

  const settings = db.settings;
  const specs: [string, string][] = [
    ["Categoria", CATEGORY_LABEL[p.category]],
    ["Modelo", p.name],
    [p.category === "watch" ? "Conexão" : "Armazenamento", p.storage],
    ["Cor", p.color],
    ["Estado", CONDITION_LABEL[p.condition]],
    ...(p.battery ? ([["Saúde da bateria", `${p.battery}%`]] as [string, string][]) : []),
    ["Garantia da loja", `${p.warrantyMonths} ${p.warrantyMonths === 1 ? "mês" : "meses"}`],
    ["Disponível", p.stock === 1 ? "1 unidade" : `${p.stock} unidades`],
  ];

  const onQuote = () => {
    addLead({ type: "orcamento", quote: { productId: p.id, productName: `${p.name} ${p.storage}`, price: p.price } });
  };

  const views = Math.max(1, p.images.length);

  return (
    <>
      <section className="mx-auto max-w-[1320px] px-5 pb-24 pt-24 md:px-8 md:pt-32">
        <nav className="label flex gap-2 text-muted">
          <Link href="/loja" className="hover:text-ink">Loja</Link>
          <span>/</span>
          <Link href={`/loja?c=${p.category}`} className="hover:text-ink">{CATEGORY_LABEL[p.category]}</Link>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Galeria */}
          <div className="lg:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-[6px] bg-paper-2 md:aspect-[5/4]">
              <div className={`absolute inset-0 ${p.images.length ? "" : "flex items-center justify-center p-[14%]"}`}>
                <ProductMedia p={p} index={img} />
              </div>
              {p.images.length === 0 && (
                <p className="label absolute bottom-4 left-4 text-[10px] text-faint">Ilustração · foto real no WhatsApp</p>
              )}
            </div>
            {views > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {p.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImg(i)}
                    className={`aspect-square overflow-hidden rounded-[4px] bg-paper-2 ring-offset-2 ring-offset-paper ${img === i ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100"}`}
                  >
                    <ProductMedia p={p} index={i} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="flex flex-wrap gap-2">
                <span className="label rounded-full border border-line px-3 py-1.5 text-[10px]">{CONDITION_LABEL[p.condition]}</span>
                {p.stock === 1 && <span className="label rounded-full bg-ink px-3 py-1.5 text-[10px] text-paper">Última unidade</span>}
              </div>
              <h1 className="display mt-5 text-[44px] md:text-[60px]">{p.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-[15px] text-muted">
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.colorHex }} />
                {p.storage} · {p.color}
              </p>

              <div className="mt-8 border-t border-line pt-6">
                {p.priceFrom ? <p className="text-[14px] text-faint line-through tabular">{money(p.priceFrom)}</p> : null}
                <p className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular">{money(p.price)}</p>
                <p className="mt-2 text-[14px] text-muted tabular">ou 12x de {installment(p.price)} no cartão</p>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={waLink(settings.whatsapp, quoteMessage(p))}
                  onClick={onQuote}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-ink text-[15px] font-medium text-paper transition-colors hover:bg-graphite"
                >
                  <WhatsApp size={18} /> Pedir orçamento no WhatsApp
                </a>
                <Link
                  href={`/troca?quero=${encodeURIComponent(`${p.name} ${p.storage} ${p.color}`)}`}
                  className="flex h-14 items-center justify-center rounded-full border border-ink/20 text-[15px] font-medium transition-colors hover:border-ink"
                >
                  Dar meu iPhone como entrada
                </Link>
              </div>

              <dl className="mt-10 font-mono text-[12px]">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 border-t border-line py-3">
                    <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>

              {p.notes ? (
                <p className="mt-6 rounded-[6px] bg-card p-5 text-[14px] leading-[1.6] text-graphite">{p.notes}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line bg-card">
          <div className="mx-auto max-w-[1320px] px-5 py-20 md:px-8">
            <h2 className="display text-[32px] md:text-[44px]">Também na loja</h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-5 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.id} p={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
