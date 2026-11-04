"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDB } from "@/lib/store";
import { cartItems, onCartOpen, removeFromCart, setQty, useCart } from "@/lib/cart";
import { installment, money } from "@/lib/format";
import { ProductMedia } from "./ProductMedia";
import { Bag, Close, Minus, Plus, Trash } from "@/components/ui/Icons";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const db = useDB();
  const lines = useCart();
  const items = cartItems(lines, db);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  useEffect(() => onCartOpen(setOpen), []);
  // fecha ao trocar de página
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
      <aside
        role="dialog"
        aria-label="Carrinho"
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[var(--ease-out-quint)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex h-16 items-center justify-between border-b border-line px-5">
          <p className="text-[16px] font-semibold">
            Carrinho <span className="font-normal text-muted tabular">({items.reduce((s, i) => s + i.qty, 0)})</span>
          </p>
          <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-card" aria-label="Fechar carrinho">
            <Close />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-card">
              <Bag size={26} />
            </span>
            <p className="mt-5 text-[18px] font-semibold">Seu carrinho está vazio</p>
            <p className="mt-2 text-[14px] text-muted">Dá uma olhada no que chegou essa semana.</p>
            <Link href="/loja" className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-4 py-5">
                  <Link href={`/loja/${p.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[6px] bg-paper-2">
                    <div className={`absolute inset-0 ${p.images.length ? "" : "p-2.5"}`}>
                      <ProductMedia p={p} />
                    </div>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/loja/${p.slug}`} className="block truncate text-[15px] font-semibold">
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-[13px] text-muted">
                          {p.storage} · {p.color}
                        </p>
                      </div>
                      <button onClick={() => removeFromCart(p.id)} className="text-muted hover:text-bad" aria-label={`Remover ${p.name}`}>
                        <Trash />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <Qty value={qty} max={p.stock} onChange={(n) => setQty(p.id, n)} />
                      <p className="text-[15px] font-semibold tabular">{money(p.price * qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-line bg-card p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-muted">Subtotal</span>
                <span className="text-[22px] font-bold tracking-[-0.02em] tabular">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-right text-[12px] text-muted tabular">ou 12x de {installment(subtotal)} · frete no próximo passo</p>
              <Link
                href="/checkout"
                className="btn-accent mt-5 flex h-[52px] items-center justify-center rounded-full text-[15px] font-semibold"
              >
                Finalizar compra
              </Link>
              <button onClick={() => setOpen(false)} className="mt-2 h-11 w-full text-[14px] font-medium text-graphite hover:text-ink">
                Continuar comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

export function Qty({ value, max, onChange, size = "sm" }: { value: number; max: number; onChange: (n: number) => void; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-12" : "h-9";
  const w = size === "md" ? "w-11" : "w-9";
  return (
    <div className={`inline-flex ${h} items-center rounded-full border border-line bg-card`}>
      <button onClick={() => onChange(value - 1)} className={`grid ${h} ${w} place-items-center rounded-full hover:bg-paper`} aria-label="Diminuir">
        <Minus size={14} />
      </button>
      <span className="min-w-6 text-center text-[14px] font-medium tabular">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`grid ${h} ${w} place-items-center rounded-full hover:bg-paper disabled:opacity-30`}
        aria-label="Aumentar"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
