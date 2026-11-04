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
      className={`group @container flex flex-col rounded-[var(--radius-card,18px)] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.08)] sm:p-5 ${className}`}
    >
      <Link href={`/loja/${p.slug}`} className="flex flex-1 flex-col">
        <p className="flex min-h-[16px] items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] font-semibold @min-[220px]:text-[13px]">
          <span className={p.condition === "novo" ? "text-highlight" : "text-muted"}>{COND[p.condition]}</span>
          {p.battery && p.condition !== "novo" ? <span className="truncate font-normal text-muted tabular">· bateria {p.battery}%</span> : null}
          {off > 0 ? <span className="ml-auto text-highlight tabular">-{off}%</span> : null}
        </p>

        {/* etiquetas numa linha própria (reservada em todos os cards), sem cobrir a foto */}
        <div className="mt-1.5 flex h-[20px] items-center gap-1 overflow-hidden @min-[220px]:mt-2 @min-[220px]:h-[22px]">
          {p.badge ? (
            <span
              className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold leading-[1.4] text-white @min-[220px]:text-[11px]"
              style={{ background: p.badgeColor || "var(--color-primary)" }}
            >
              {p.badge}
            </span>
          ) : null}
          {p.stock === 1 ? (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-highlight/10 px-2 py-0.5 text-[10px] font-semibold leading-[1.4] text-highlight @min-[220px]:text-[11px]">
              Última unidade
            </span>
          ) : null}
        </div>

        <div className="relative mt-1.5 aspect-square @min-[220px]:mt-2">
          <div
            className={`absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04] ${
              hasPhoto ? "overflow-hidden rounded-[12px]" : "flex items-center justify-center p-[12%]"
            }`}
          >
            <ProductMedia p={p} />
          </div>
        </div>

        <h3 className="mt-2.5 line-clamp-2 min-h-[2.5em] text-[13.5px] font-semibold leading-[1.25] tracking-[-0.015em] @min-[220px]:mt-4 @min-[220px]:text-[17px]">
          {p.name} {p.storage}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted @min-[220px]:mt-1 @min-[220px]:text-[14px]">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: p.colorHex }} />
          <span className="truncate">{p.color}</span>
        </p>

        <div className="mt-auto pt-2.5 @min-[220px]:pt-4">
          {p.priceFrom ? <p className="text-[11px] text-faint line-through tabular @min-[220px]:text-[12px]">{money(p.priceFrom)}</p> : null}
          <p className="text-[15px] font-semibold tabular @min-[220px]:text-[17px]">{money(p.price)}</p>
          <p className="mt-0.5 text-[11px] text-muted tabular @min-[220px]:text-[12.5px]">12x de {installment(p.price)}</p>
        </div>
      </Link>

      <button
        onClick={() => addToCart(p)}
        className="btn-accent mt-3 h-8 w-full rounded-full text-[13px] font-medium @min-[220px]:mt-4 @min-[220px]:h-9 @min-[220px]:w-fit @min-[220px]:px-5 @min-[220px]:text-[14px]"
      >
        Comprar
      </button>
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
