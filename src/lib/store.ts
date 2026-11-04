"use client";

/**
 * Camada de dados do site e do painel.
 *
 * Com Supabase configurado (.env.local): os dados vêm do banco ao abrir a
 * página e cada alteração feita no painel é gravada lá (só o que mudou).
 * Ações de visitante (pedido, contato, visita) usam funções do banco que
 * validam tudo no servidor.
 *
 * Sem Supabase: funciona como antes, salvo no navegador (modo demonstração).
 */

import { useSyncExternalStore } from "react";
import type { CustomerMeta, DB, Expense, Lead, LeadStatus, Order, OrderStatus, Product, Sale, Settings, ShippingSettings, Storefront } from "./types";
import { DEFAULT_SHIPPING, DEFAULT_STOREFRONT } from "./defaults";
import { DEFAULT_SETTINGS } from "./site";
import { createSeed } from "./seed";
import { dayKey, uid } from "./format";
import { hasSupabase, sb } from "./supabase";

const KEY = "brian-iphones:db:v3";
const VISITOR_KEY = "brian-iphones:visitor";

let cache: DB | null = null;
let loading = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* =====================================================================
 * Leitura
 * ===================================================================== */

function load(): DB | null {
  if (cache) return cache;
  if (typeof window === "undefined") return null;
  if (hasSupabase) {
    if (!loading) void hydrate();
    return null;
  }
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
  persistLocal();
  return cache;
}

/** Garante o banco carregado (para as funções de escrita) */
function current(): DB {
  const db = load();
  if (!db) throw new Error("Dados ainda carregando");
  return db;
}

/** Completa campos que não existiam em versões antigas dos dados */
function normalize(db: DB): DB {
  const sf = db.storefront ?? DEFAULT_STOREFRONT;
  const settings = db.settings ?? DEFAULT_SETTINGS;
  return {
    ...db,
    products: db.products ?? [],
    orders: db.orders ?? [],
    leads: db.leads ?? [],
    sales: db.sales ?? [],
    expenses: db.expenses ?? [],
    visits: db.visits ?? {},
    customers: db.customers ?? {},
    storefront: {
      ...DEFAULT_STOREFRONT,
      ...sf,
      theme: { ...DEFAULT_STOREFRONT.theme, ...(sf.theme ?? {}) },
      announcement: { ...DEFAULT_STOREFRONT.announcement, ...(sf.announcement ?? {}) },
    },
    settings: { ...DEFAULT_SETTINGS, ...settings, shipping: { ...DEFAULT_SHIPPING, ...(settings.shipping ?? {}) } },
  };
}

/** Busca tudo no Supabase. Visitante recebe só o que é público (as regras do banco garantem). */
async function hydrate() {
  loading = true;
  try {
    const c = sb();
    const { data: session } = await c.auth.getSession();
    const admin = !!session.session;
    const all = async <T,>(q: PromiseLike<{ data: T[] | null; error: unknown }>) => {
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    };
    const [products, config] = await Promise.all([
      all(c.from("products").select("data").order("created_at", { ascending: false })),
      all(c.from("site_config").select("key,data")),
    ]);
    const cfg = Object.fromEntries((config as { key: string; data: unknown }[]).map((r) => [r.key, r.data]));
    let rest = { orders: [] as Order[], leads: [] as Lead[], sales: [] as Sale[], expenses: [] as Expense[], customers: {} as DB["customers"], visits: {} as DB["visits"] };
    if (admin) {
      const [orders, leads, sales, expenses, customers, visits] = await Promise.all([
        all(c.from("orders").select("data").order("created_at", { ascending: false })),
        all(c.from("leads").select("data").order("created_at", { ascending: false })),
        all(c.from("sales").select("data").order("date", { ascending: false })),
        all(c.from("expenses").select("data").order("date", { ascending: false })),
        all(c.from("customers").select("email,data")),
        all(c.from("visits").select("day,views,visitors,paths")),
      ]);
      rest = {
        orders: (orders as { data: Order }[]).map((r) => r.data),
        leads: (leads as { data: Lead }[]).map((r) => r.data),
        sales: (sales as { data: Sale }[]).map((r) => r.data),
        expenses: (expenses as { data: Expense }[]).map((r) => r.data),
        customers: Object.fromEntries((customers as { email: string; data: CustomerMeta }[]).map((r) => [r.email, r.data])),
        visits: Object.fromEntries(
          (visits as { day: string; views: number; visitors: number; paths: Record<string, number> }[]).map((v) => [v.day, { views: v.views, visitors: v.visitors, paths: v.paths }]),
        ),
      };
    }
    cache = normalize({
      version: 3,
      products: (products as { data: Product }[]).map((r) => r.data),
      settings: (cfg.settings as Settings) ?? DEFAULT_SETTINGS,
      storefront: (cfg.storefront as Storefront) ?? DEFAULT_STOREFRONT,
      ...rest,
    });
    setStatus("ok");
  } catch (e) {
    console.error("Erro ao carregar dados do Supabase", e);
    setStatus("error", "Não foi possível carregar os dados");
    // mostra o site com o padrão em vez de travar em branco
    cache = normalize({ version: 3, products: [], orders: [], leads: [], sales: [], expenses: [], customers: {}, visits: {}, settings: DEFAULT_SETTINGS, storefront: DEFAULT_STOREFRONT });
  } finally {
    loading = false;
    emit();
  }
}

/** Recarrega do banco (ex.: depois do login/logout do admin) */
export function reloadData() {
  if (!hasSupabase) return;
  cache = null;
  emit();
  void hydrate();
}

function persistLocal() {
  if (!cache || hasSupabase) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Não foi possível salvar (armazenamento cheio?)", e);
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY && !hasSupabase) {
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

/** Hook: `null` no servidor e enquanto os dados carregam */
export function useDB(): DB | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

/* =====================================================================
 * Status de gravação (mostrado no painel)
 * ===================================================================== */

type SyncStatus = { state: "ok" | "saving" | "error"; message?: string };
let status: SyncStatus = { state: "ok" };
const statusListeners = new Set<() => void>();
function setStatus(state: SyncStatus["state"], message?: string) {
  status = { state, message };
  statusListeners.forEach((l) => l());
}
export function useSyncStatus() {
  return useSyncExternalStore(
    (cb) => (statusListeners.add(cb), () => statusListeners.delete(cb)),
    () => status,
    () => status,
  );
}

/* =====================================================================
 * Escrita: atualiza na hora na tela e grava no banco o que mudou
 * ===================================================================== */

let queue: Promise<void> = Promise.resolve();

function commit(next: DB) {
  const prev = cache;
  cache = next;
  emit();
  if (!hasSupabase) return persistLocal();
  if (!prev) return;
  setStatus("saving");
  queue = queue
    .then(() => syncDiff(prev, next))
    .then(() => setStatus("ok"))
    .catch((e) => {
      console.error("Erro ao salvar no Supabase", e);
      setStatus("error", e?.message ?? "Erro ao salvar");
    });
}

type Row = Record<string, unknown>;

async function syncTable<T>(table: string, keyCol: string, prev: T[], next: T[], key: (x: T) => string, row: (x: T) => Row) {
  const before = new Map(prev.map((x) => [key(x), JSON.stringify(x)]));
  const after = new Set(next.map(key));
  const upserts = next.filter((x) => before.get(key(x)) !== JSON.stringify(x)).map(row);
  const deletes = [...before.keys()].filter((k) => !after.has(k));
  const c = sb();
  for (let i = 0; i < upserts.length; i += 200) {
    const { error } = await c.from(table).upsert(upserts.slice(i, i + 200), { onConflict: keyCol });
    if (error) throw error;
  }
  if (deletes.length) {
    const { error } = await c.from(table).delete().in(keyCol, deletes);
    if (error) throw error;
  }
}

async function syncDiff(prev: DB, next: DB) {
  if (prev.products !== next.products)
    await syncTable("products", "id", prev.products, next.products, (p) => p.id, (p) => ({
      id: p.id,
      slug: p.slug,
      active: p.active,
      stock: p.stock,
      price: p.price,
      data: p,
      created_at: p.createdAt,
      updated_at: p.updatedAt ?? new Date().toISOString(),
    }));
  if (prev.orders !== next.orders)
    await syncTable("orders", "id", prev.orders, next.orders, (o) => o.id, (o) => ({
      id: o.id,
      number: Number(o.number),
      status: o.status,
      customer_email: o.customer.email.toLowerCase(),
      total: o.total,
      data: o,
      created_at: o.createdAt,
    }));
  if (prev.leads !== next.leads)
    await syncTable("leads", "id", prev.leads, next.leads, (l) => l.id, (l) => ({ id: l.id, status: l.status, data: l, created_at: l.createdAt }));
  if (prev.sales !== next.sales) await syncTable("sales", "id", prev.sales, next.sales, (s) => s.id, (s) => ({ id: s.id, date: s.date, data: s }));
  if (prev.expenses !== next.expenses) await syncTable("expenses", "id", prev.expenses, next.expenses, (e) => e.id, (e) => ({ id: e.id, date: e.date, data: e }));
  if (prev.customers !== next.customers)
    await syncTable("customers", "email", Object.entries(prev.customers), Object.entries(next.customers), ([k]) => k, ([email, data]) => ({ email, data }));
  if (prev.visits !== next.visits)
    await syncTable("visits", "day", Object.entries(prev.visits), Object.entries(next.visits), ([k]) => k, ([day, v]) => ({ day, views: v.views, visitors: v.visitors, paths: v.paths }));
  const cfg: Row[] = [];
  if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings)) cfg.push({ key: "settings", data: next.settings, updated_at: new Date().toISOString() });
  if (JSON.stringify(prev.storefront) !== JSON.stringify(next.storefront)) cfg.push({ key: "storefront", data: next.storefront, updated_at: new Date().toISOString() });
  if (cfg.length) {
    const { error } = await sb().from("site_config").upsert(cfg, { onConflict: "key" });
    if (error) throw error;
  }
}

/* =====================================================================
 * Produtos
 * ===================================================================== */
export function saveProduct(p: Product) {
  const db = current();
  const next = { ...p, updatedAt: new Date().toISOString() };
  const exists = db.products.some((x) => x.id === p.id);
  commit({
    ...db,
    products: exists ? db.products.map((x) => (x.id === p.id ? next : x)) : [next, ...db.products],
  });
}

export function deleteProduct(id: string) {
  const db = current();
  commit({ ...db, products: db.products.filter((p) => p.id !== id) });
}

export function deleteProducts(ids: string[]) {
  const db = current();
  commit({ ...db, products: db.products.filter((p) => !ids.includes(p.id)) });
}

export function duplicateProduct(id: string) {
  const db = current();
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
  const db = current();
  commit({ ...db, products: db.products.map((p) => (ids.includes(p.id) ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)) });
}

/* =====================================================================
 * Contatos
 * ===================================================================== */
export function addLead(lead: Omit<Lead, "id" | "createdAt" | "status">) {
  if (hasSupabase) {
    // visitante não lê a tabela de contatos: grava pela função do banco
    void sb()
      .rpc("add_lead", { payload: lead })
      .then(({ data, error }) => {
        if (error) return console.error("Erro ao registrar contato", error);
        if (cache && data) {
          cache = { ...cache, leads: [data as Lead, ...cache.leads] };
          emit();
        }
      });
    return { ...lead, id: "", createdAt: new Date().toISOString(), status: "novo" } as Lead;
  }
  const db = current();
  const full: Lead = { ...lead, id: uid(), createdAt: new Date().toISOString(), status: "novo" };
  commit({ ...db, leads: [full, ...db.leads] });
  return full;
}

export function setLeadStatus(id: string, status: LeadStatus) {
  const db = current();
  commit({ ...db, leads: db.leads.map((l) => (l.id === id ? { ...l, status } : l)) });
}

export function deleteLead(id: string) {
  const db = current();
  commit({ ...db, leads: db.leads.filter((l) => l.id !== id) });
}

/* =====================================================================
 * Pedidos
 * ===================================================================== */
const nowIso = () => new Date().toISOString();

export const ORDER_FLOW: OrderStatus[] = ["aguardando_pagamento", "pago", "separando", "embalado", "enviado", "entregue"];

/** Cria o pedido. No Supabase, preço e estoque são conferidos no servidor. */
export async function addOrder(o: Omit<Order, "id" | "number" | "createdAt" | "status">): Promise<Order> {
  if (hasSupabase) {
    const { data, error } = await sb().rpc("place_order", {
      payload: {
        customer: o.customer,
        shipping: o.shipping,
        payment: o.payment,
        installments: o.installments,
        items: o.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      },
    });
    if (error) throw new Error(error.message);
    const order = data as Order;
    if (cache) {
      cache = {
        ...cache,
        products: cache.products.map((p) => {
          const it = o.items.find((i) => i.productId === p.id);
          return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
        }),
        orders: [order, ...cache.orders],
      };
      emit();
    }
    return order;
  }
  const db = current();
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
  const products = db.products.map((p) => {
    const it = o.items.find((i) => i.productId === p.id);
    return it ? { ...p, stock: Math.max(0, p.stock - it.qty) } : p;
  });
  commit({ ...db, products, orders: [full, ...db.orders] });
  return full;
}

/** Pedido para a página de confirmação (visitante não lê a tabela de pedidos) */
export async function fetchOrder(id: string): Promise<Order | null> {
  const local = cache?.orders.find((o) => o.id === id);
  if (local || !hasSupabase) return local ?? null;
  const { data, error } = await sb().rpc("get_order", { order_id: id });
  if (error) throw error;
  return (data as Order) ?? null;
}

/** "Meus pedidos": número + e-mail */
export async function lookupOrder(number: string, email: string): Promise<Order | null> {
  if (!hasSupabase) {
    const n = number.replace(/\D/g, "");
    return current().orders.find((o) => o.number === n && o.customer.email.trim().toLowerCase() === email.trim().toLowerCase()) ?? null;
  }
  const { data, error } = await sb().rpc("lookup_order", { order_number: number, email });
  if (error) throw error;
  return (data as Order) ?? null;
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
  commit(applyStatus(current(), [id], status, note));
}

export function bulkSetOrderStatus(ids: string[], status: OrderStatus) {
  commit(applyStatus(current(), ids, status));
}

export function updateOrder(id: string, patch: Partial<Order>) {
  const db = current();
  commit({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
}

export function addOrderEvent(id: string, text: string) {
  const db = current();
  commit({ ...db, orders: db.orders.map((o) => (o.id === id ? { ...o, timeline: [...(o.timeline ?? []), { at: nowIso(), text }] } : o)) });
}

/** Salva o rastreio e, se o pedido ainda não saiu, marca como enviado */
export function setTracking(id: string, carrier: string, code: string) {
  let db = current();
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
  const db = current();
  commit({
    ...db,
    orders: db.orders.map((o) => (ids.includes(o.id) ? { ...o, printed: { ...(o.printed ?? {}), [kind]: nowIso() } } : o)),
  });
}

/* =====================================================================
 * Clientes, vitrine, envio
 * ===================================================================== */
export function saveCustomerMeta(email: string, meta: CustomerMeta) {
  const db = current();
  commit({ ...db, customers: { ...db.customers, [email.toLowerCase()]: meta } });
}

export function saveStorefront(sf: Storefront) {
  const db = current();
  commit({ ...db, storefront: sf });
}

export function saveShipping(ss: ShippingSettings) {
  const db = current();
  commit({ ...db, settings: { ...db.settings, shipping: ss } });
}

/* =====================================================================
 * Financeiro
 * ===================================================================== */
export function addSale(s: Omit<Sale, "id">) {
  const db = current();
  commit({ ...db, sales: [{ ...s, id: uid() }, ...db.sales].sort((a, b) => b.date.localeCompare(a.date)) });
}
export function deleteSale(id: string) {
  const db = current();
  commit({ ...db, sales: db.sales.filter((s) => s.id !== id) });
}
export function addExpense(e: Omit<Expense, "id">) {
  const db = current();
  commit({ ...db, expenses: [{ ...e, id: uid() }, ...db.expenses].sort((a, b) => b.date.localeCompare(a.date)) });
}
export function deleteExpense(id: string) {
  const db = current();
  commit({ ...db, expenses: db.expenses.filter((s) => s.id !== id) });
}

/* =====================================================================
 * Configurações e manutenção
 * ===================================================================== */
export function saveSettings(s: Settings) {
  const db = current();
  commit({ ...db, settings: s });
}

export function resetDemo() {
  commit(normalize(createSeed()));
}

export function clearAll() {
  const seed = createSeed();
  commit(normalize({ ...seed, leads: [], orders: [], customers: {}, sales: [], expenses: [], visits: {} }));
}

/* =====================================================================
 * Visitas
 * ===================================================================== */
export function trackVisit(path: string) {
  const key = dayKey();
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
  if (hasSupabase) {
    void sb()
      .rpc("track_visit", { day_key: key, path, new_visitor: isNewToday })
      .then(({ error }) => error && console.error("Erro ao contar visita", error));
    return;
  }
  const db = current();
  const day = db.visits[key] ?? { views: 0, visitors: 0, paths: {} };
  const next = {
    views: day.views + 1,
    visitors: day.visitors + (isNewToday ? 1 : 0),
    paths: { ...day.paths, [path]: (day.paths[path] ?? 0) + 1 },
  };
  commit({ ...db, visits: { ...db.visits, [key]: next } });
}
