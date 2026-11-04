"use client";

/**
 * Carrinho no navegador (localStorage). Guarda só id + quantidade;
 * preço e nome sempre vêm do produto atual.
 */

import { useSyncExternalStore } from "react";
import type { DB, Product } from "./types";

const KEY = "brian-iphones:cart:v1";

export type CartLine = { productId: string; qty: number };

let cache: CartLine[] | null = null;
const listeners = new Set<() => void>();
const openListeners = new Set<(open: boolean) => void>();

function load(): CartLine[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
  } catch {
    cache = [];
  }
  return cache;
}

function commit(next: CartLine[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** `null` no servidor / antes de hidratar */
export function useCart(): CartLine[] | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

export function addToCart(p: Product, qty = 1, open = true) {
  const lines = load();
  const cur = lines.find((l) => l.productId === p.id);
  const nextQty = Math.min(p.stock, (cur?.qty ?? 0) + qty);
  commit(cur ? lines.map((l) => (l.productId === p.id ? { ...l, qty: nextQty } : l)) : [...lines, { productId: p.id, qty: nextQty }]);
  if (open) openCart();
}

export function setQty(productId: string, qty: number) {
  const lines = load();
  commit(qty <= 0 ? lines.filter((l) => l.productId !== productId) : lines.map((l) => (l.productId === productId ? { ...l, qty } : l)));
}

export function removeFromCart(productId: string) {
  commit(load().filter((l) => l.productId !== productId));
}

export function clearCart() {
  commit([]);
}

/* gaveta do carrinho */
export function openCart() {
  openListeners.forEach((l) => l(true));
}
export function onCartOpen(cb: (open: boolean) => void) {
  openListeners.add(cb);
  return () => {
    openListeners.delete(cb);
  };
}

/** Junta as linhas com os produtos atuais, ignorando o que saiu de estoque */
export function cartItems(lines: CartLine[] | null, db: DB | null) {
  if (!lines || !db) return [];
  return lines
    .map((l) => {
      const p = db.products.find((x) => x.id === l.productId && x.active);
      return p ? { product: p, qty: Math.min(l.qty, p.stock) } : null;
    })
    .filter((x): x is { product: Product; qty: number } => !!x && x.qty > 0);
}

export const cartCount = (lines: CartLine[] | null) => (lines ?? []).reduce((s, l) => s + l.qty, 0);
