"use client";

/**
 * Camada de dados local (localStorage).
 * Toda leitura/escrita do site passa por aqui — quando o banco de dados
 * for conectado, só este arquivo precisa ser trocado.
 */

import { useSyncExternalStore } from "react";
import type { CustomerMeta, DB, Expense, Lead, LeadStatus, Order, OrderStatus, Product, Sale, Settings, ShippingSettings, Storefront } from "./types";
import { DEFAULT_SHIPPING, DEFAULT_STOREFRONT } from "./defaults";
import { createSeed } from "./seed";
import { dayKey, uid } from "./format";

const KEY = "brian-iphones:db:v3";
const VISITOR_KEY = "brian-iphones:visitor";

let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = normalize(JSON.parse(raw) as DB);
      return cache;
    }
  } catch {
    /* ignora JSON inválido */
  }
  cache = createSeed();
  persist();
  return cache;
}

/** Completa campos que não existiam em versões antigas dos dados */
function normalize(db: DB): DB {
  const sf = db.storefront ?? DEFAULT_STOREFRONT;
  return {
    ...db,
    orders: db.orders ?? [],
    customers: db.customers ?? {},
    storefront: {
      ...DEFAULT_STOREFRONT,
      ...sf,
      theme: { ...DEFAULT_STOREFRONT.theme, ...(sf.theme ?? {}) },
      announcement: { ...DEFAULT_STOREFRONT.announcement, ...(sf.announcement ?? {}) },
    },
    settings: { ...db.settings, shipping: { ...DEFAULT_SHIPPING, ...(db.settings.shipping ?? {}) } },
  };
}

function persist() {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Não foi possível salvar (armazenamento cheio?)", e);
  }
}

function commit(next: DB) {
  cache = next;
  persist();
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

/** Hook: retorna `null` no servidor / antes de hidratar */
export function useDB(): DB | null {
  return useSyncExternalStore(
    subscribe,
    () => load(),
    () => null,
  );
}

export function getDB() {
  return load();
}

/* ---------- Produtos ---------- */
export function saveProduct(p: Product) {
  const db = load();
  const next = { ...p, updatedAt: new Date().toISOString() };
  const exists = db.products.some((x) => x.id === p.id);
  commit({
    ...db,
    products: exists ? db.products.map((x) => (x.id === p.id ? next : x)) : [next, ...db.products],
  });
}

export function deleteProduct(id: string) {
  const db = load();
  commit({ ...db, products: db.products.filter((p) => p.id !== id) });
}

export function deleteProducts(ids: string[]) {
  const db = load();
  commit({ ...db, products: db.products.filter((p) => !ids.includes(p.id)) });
}

export function duplicateProduct(id: string) {
  const db = load();
  const p = db.products.find((x) => x.id === id);
  if (!p) return null;
  const copy: Product = {
    ...p,
    id: uid(),
    name: `${p.name} (cópia)`,
    slug: `${p.slug}-copia-${uid().slice(0, 4)}`,
    active: false,
    createdAt: new Date().toISOString(),
    sku: p.sku ? `${p.sku}-C` : undefined,
  };
  commit({ ...db, products: [copy, ...db.products] });
  return copy;
}

export function patchProducts(ids: string[], patch: Partial<Product>) {
  const db = load();
  commit({ ...db, products: db.products.map((p) => (ids.includes(p.id) ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)) });
}

/* ---------- Contatos ---------- */
export function addLead(lead: Omit<Lead, "id" | "createdAt" | "status">) {
  const db = load();
  const full: Lead = { ...lead, id: uid(), createdAt: new Date().toISOString(), status: "novo" };
  commit({ ...db, leads: [full, ...db.leads] });
  return full;
}

export function setLeadStatus(id: string, status: LeadStatus) {
  const db = load();
  commit({ ...db, leads: db.leads.map((l) => (l.id === id ? { ...l, status } : l)) });
}

export function deleteLead(id: string) {
  const db = load();
  commit({ ...db, leads: db.leads.filter((l) => l.id !== id) });
}

/* ---------- Pedidos ---------- */
const nowIso = () => new Date().toISOString();

export const ORDER_FLOW: OrderStatus[] = ["aguardando_pagamento", "pago", "separando", "embalado", "enviado", "entregue"];

export function addOrder(o: Omit<Order, "id" | "number" | "createdAt" | "status">) {
  const db = load();
  const seq = Math.max(1000, ...db.orders.map((x) => Number(x.number) || 0)) + 1;
  const createdAt = nowIso();
  const full: Order = {
    ...o,
    id: uid(),
    number: String(seq),
    createdAt,
    status: "aguardando_pagamento",
    timeline: [{ at: createdAt, status: "aguardando_pagamento", text: "Pedido feito no site" }],
  };
  // reserva o estoque
  const products = db.products.map((p) => {
    const it = o.items.find((i) => i.productId === p.id);
    return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
  });
  commit({ ...db, products, orders: [full, ...db.orders] });
  return full;
}

const STATUS_TEXT: Record<OrderStatus, string> = {
  aguardando_pagamento: "Voltou para aguardando pagamento",
  pago: "Pagamento confirmado",
  separando: "Pedido em separação",
  embalado: "Embalado e pronto para envio",
  enviado: "Pedido enviado",
  entregue: "Pedido entregue",
  cancelado: "Pedido cancelado",
};

function applyStatus(db: DB, ids: string[], status: OrderStatus, note?: string): DB {
  let products = db.products;
  const orders = db.orders.map((o) => {
    if (!ids.includes(o.id) || o.status === status) return o;
    // cancelou: devolve ao estoque; reabriu um cancelado: reserva de novo
    if (status === "cancelado" || o.status === "cancelado") {
      const sign = status === "cancelado" ? 1 : -1;
      products = products.map((p) => {
        const it = o.items.find((i) => i.productId === p.id);
        return it ? { ...p, stock: Math.max(0, p.stock + sign * it.qty) } : p;
      });
    }
    return { ...o, status, timeline: [...(o.timeline ?? []), { at: nowIso(), status, text: note || STATUS_TEXT[status] }] };
  });
  return { ...db, products, orders };
}

export function setOrderStatus(id: string, status: OrderStatus, note?: string) {
  commit(applyStatus(load(), [id], status, note));
}

export function bulkSetOrderStatus(ids: string[], status: OrderStatus) {
  commit(applyStatus(load(), ids, status));
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const db = load();
  commit({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
}

export function addOrderEvent(id: string, text: string) {
  const db = load();
  commit({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, timeline: [...(o.timeline ?? []), { at: nowIso(), text }] } : o)) });
}

/** Salva o rastreio e, se o pedido ainda não saiu, marca como enviado */
export function setTracking(id: string, carrier: string, code: string) {
  let db = load();
  db = { ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, tracking: { carrier, code } } : o)) };
  const o = db.orders.find((x) => x.id === id);
  if (o && code && o.status !== "cancelado" && ORDER_FLOW.indexOf(o.status) < ORDER_FLOW.indexOf("enviado")) {
    db = applyStatus(db, [id], "enviado", `Enviado por ${carrier} · rastreio ${code}`);
  } else if (o) {
    db = {
      ...db,
      orders: db.orders.map((x) => (x.id === id ? { ...x, timeline: [...(x.timeline ?? []), { at: nowIso(), text: `Rastreio atualizado: ${carrier} · ${code}` }] } : x)),
    };
  }
  commit(db);
}

export function markPrinted(ids: string[], kind: "label" | "slip") {
  const db = load();
  commit({
    ...db,
    orders: db.orders.map((o) => (ids.includes(o.id) ? { ...o, printed: { ...(o.printed ?? {}), [kind]: nowIso() } } : o)),
  });
}

/* ---------- Clientes ---------- */
export function saveCustomerMeta(email: string, meta: CustomerMeta) {
  const db = load();
  commit({ ...db, customers: { ...db.customers, [email.toLowerCase()]: meta } });
}

/* ---------- Vitrine e envio ---------- */
export function saveStorefront(sf: Storefront) {
  const db = load();
  commit({ ...db, storefront: sf });
}

export function saveShipping(ss: ShippingSettings) {
  const db = load();
  commit({ ...db, settings: { ...db.settings, shipping: ss } });
}

/* ---------- Financeiro ---------- */
export function addSale(s: Omit<Sale, "id">) {
  const db = load();
  commit({ ...db, sales: [{ ...s, id: uid() }, ...db.sales].sort((a, b) => b.date.localeCompare(a.date)) });
}
export function deleteSale(id: string) {
  const db = load();
  commit({ ...db, sales: db.sales.filter((s) => s.id !== id) });
}
export function addExpense(e: Omit<Expense, "id">) {
  const db = load();
  commit({ ...db, expenses: [{ ...e, id: uid() }, ...db.expenses].sort((a, b) => b.date.localeCompare(a.date)) });
}
export function deleteExpense(id: string) {
  const db = load();
  commit({ ...db, expenses: db.expenses.filter((s) => s.id !== id) });
}

/* ---------- Configurações ---------- */
export function saveSettings(s: Settings) {
  const db = load();
  commit({ ...db, settings: s });
}

export function resetDemo() {
  commit(createSeed());
}

export function clearAll() {
  const seed = createSeed();
  commit({ ...seed, leads: [], orders: [], customers: {}, sales: [], expenses: [], visits: {} });
}

/* ---------- Visitas ---------- */
export function trackVisit(path: string) {
  const db = load();
  const key = dayKey();
  const day = db.visits[key] ?? { views: 0, visitors: 0, paths: {} };
  let isNewToday = false;
  try {
    const last = localStorage.getItem(VISITOR_KEY);
    if (last !== key) {
      localStorage.setItem(VISITOR_KEY, key);
      isNewToday = true;
    }
  } catch {
    /* noop */
  }
  const next = {
    views: day.views + 1,
    visitors: day.visitors + (isNewToday ? 1 : 0),
    paths: { ...day.paths, [path]: (day.paths[path] ?? 0) + 1 },
  };
  commit({ ...db, visits: { ...db.visits, [key]: next } });
}
