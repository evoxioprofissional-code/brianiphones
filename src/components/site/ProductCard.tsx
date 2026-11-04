import Link from "next/link";
import type { Product } from "@/lib/types";
import { installment, money } from "@/lib/format";
import { ProductMedia } from "./ProductMedia";

export function ProductCard({ p, index }: { p: Product; index?: number }) {
  const hasPhoto = p.images.length > 0;
  return (
    <Link href={`/loja/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-paper-2">
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.035] ${
            hasPhoto ? "" : "flex items-center justify-center p-[16%]"
          }`}
        >
          <ProductMedia p={p} />
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="label rounded-full bg-card/90 px-2.5 py-1 text-[10px] text-ink">
            {p.condition === "novo" ? "Lacrado" : p.condition === "vitrine" ? "Vitrine" : "Seminovo"}
          </span>
          {p.battery && p.condition !== "novo" ? (
            <span className="label rounded-full bg-card/90 px-2.5 py-1 text-[10px] text-ink tabular">{p.battery}% bat.</span>
          ) : null}
        </div>
        {typeof index === "number" && (
          <span className="label absolute right-3 top-3 text-[10px] text-muted tabular">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {p.stock === 1 && (
          <span className="label absolute bottom-3 left-3 text-[10px] text-warn">Última unidade</span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold tracking-[-0.01em]">{p.name}</h3>
          <p className="mt-1 flex items-center gap-2 text-[13px] text-muted">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: p.colorHex }} />
            {p.storage} · {p.color}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {p.priceFrom ? <p className="text-[12px] text-faint line-through tabular">{money(p.priceFrom)}</p> : null}
          <p className="text-[16px] font-semibold tabular">{money(p.price)}</p>
          <p className="mt-0.5 text-[11px] text-muted tabular">12x {installment(p.price)}</p>
        </div>
      </div>
    </Link>
  );
}
