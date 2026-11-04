"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { installment, money } from "@/lib/format";
import { addToCart } from "@/lib/cart";
import { ProductMedia } from "./ProductMedia";
import { TiltCard } from "@/components/ui/be-ui-tilt-card";

const COND = { novo: "Novo", seminovo: "Seminovo", vitrine: "Vitrine" } as const;

export function ProductCard({ p, className = "" }: { p: Product; className?: string }) {
  const hasPhoto = p.images.length > 0;
  const off = p.priceFrom && p.priceFrom > p.price ? Math.round((1 - p.price / p.priceFrom) * 100) : 0;

  return (
    <TiltCard
      max={10}
      glareOpacity={0.08}
      className={`group @container flex flex-col rounded-[var(--radius-card,18px)] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] sm:p-5 ${className}`}
    >
      <Link href={`/loja/${p.slug}`} className="flex flex-1 flex-col">
        <p className="flex min-h-[18px] items-center gap-2 text-[12px] font-semibold @min-[220px]:text-[13px]">
          <span className={p.condition === "novo" ? "text-highlight" : "text-muted"}>{COND[p.condition]}</span>
          {p.battery && p.condition !== "novo" ? <span className="font-normal text-muted tabular">· bateria {p.battery}%</span> : null}
          {off > 0 ? <span className="ml-auto text-highlight tabular">-{off}%</span> : null}
        </p>
        {p.badge ? (
          <span className="mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: p.badgeColor || "var(--color-primary)" }}>
            {p.badge}
          </span>
        ) : null}

        <div className="relative mt-3 aspect-square">
          <div
            className={`absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04] ${
              hasPhoto ? "overflow-hidden rounded-[12px]" : "flex items-center justify-center p-[10%]"
            }`}
          >
            <ProductMedia p={p} />
          </div>
        </div>

        <div className="mt-3 flex justify-center">
          <span className="h-3 w-3 rounded-full ring-1 ring-black/10 ring-offset-2" style={{ background: p.colorHex }} title={p.color} />
        </div>

        <h3 className="mt-4 line-clamp-2 text-[15px] font-semibold leading-[1.25] tracking-[-0.015em] @min-[220px]:text-[17px]">
          {p.name} {p.storage}
        </h3>
        <p className="mt-1 truncate text-[12.5px] text-muted @min-[220px]:text-[14px]">{p.color}</p>

        <div className="mt-auto pt-4">
          {p.priceFrom ? <p className="text-[12px] text-faint line-through tabular">{money(p.priceFrom)}</p> : null}
          <p className="text-[15px] font-semibold tabular @min-[220px]:text-[17px]">{money(p.price)}</p>
          <p className="mt-0.5 text-[11.5px] text-muted tabular @min-[220px]:text-[12.5px]">ou 12x de {installment(p.price)}</p>
        </div>
      </Link>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          onClick={() => addToCart(p)}
          className="btn-accent h-8 rounded-full px-4 text-[13px] font-medium @min-[220px]:h-9 @min-[220px]:text-[14px]"
        >
          Comprar
        </button>
        {p.stock === 1 && <span className="text-right text-[11.5px] font-medium leading-tight text-highlight">Última unidade</span>}
      </div>
    </TiltCard>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[18px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="h-3 w-16 rounded bg-mist" />
      <div className="mt-4 aspect-square animate-pulse rounded-[12px] bg-mist" />
      <div className="mt-5 h-4 w-3/4 rounded bg-mist" />
      <div className="mt-2 h-3 w-1/2 rounded bg-mist" />
      <div className="mt-6 h-4 w-1/3 rounded bg-mist" />
      <div className="mt-5 h-9 w-24 rounded-full bg-mist" />
    </div>
  );
}
