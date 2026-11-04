"use client";

/**
 * Camada de dados local (localStorage).
 * Toda leitura/escrita do site passa por aqui — quando o banco de dados
 * for conectado, só este arquivo precisa ser trocado.
 */

import { useSyncExternalStore } from "react";
import type { DB, Expense, Lead, LeadStatus, Product, Sale, Settings } from "./types";
import { createSeed } from "./seed";
import { dayKey, uid } from "./format";

const KEY = "brian-iphones:db:v1";
const VISITOR_KEY = "brian-iphones:visitor";

let cache: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DB;
      return cache;
    }
  } catch {
    /* ignora JSON inválido */
  }
  cache = createSeed();
  persist();
  return cache;
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
  const exists = db.products.some((x) => x.id === p.id);
  commit({
    ...db,
    products: exists ? db.products.map((x) => (x.id === p.id ? p : x)) : [p, ...db.products],
  });
}

export function deleteProduct(id: string) {
  const db = load();
  commit({ ...db, products: db.products.filter((p) => p.id !== id) });
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
  commit({ ...seed, leads: [], sales: [], expenses: [], visits: {} });
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
