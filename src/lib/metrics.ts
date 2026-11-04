import type { DB } from "./types";
import { dayKey } from "./format";

export function lastDays(n: number, offset = 0) {
  const out: Date[] = [];
  const now = new Date();
  for (let i = n - 1 + offset; i >= offset; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    out.push(d);
  }
  return out;
}

export function inRange(iso: string, days: number, offset = 0) {
  const d = new Date(iso).getTime();
  const end = new Date();
  end.setDate(end.getDate() - offset);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  return d >= start.getTime() && d <= end.getTime();
}

export const pct = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100);

export function summarize(db: DB, days: number, offset = 0) {
  const sales = db.sales.filter((s) => inRange(s.date, days, offset));
  const expenses = db.expenses.filter((e) => inRange(e.date, days, offset));
  const leads = db.leads.filter((l) => inRange(l.createdAt, days, offset));
  const revenue = sales.reduce((a, s) => a + s.price, 0);
  const cost = sales.reduce((a, s) => a + s.cost, 0);
  const exp = expenses.reduce((a, e) => a + e.value, 0);
  const deviceSales = sales.filter((s) => s.kind === "venda");
  let visitors = 0,
    views = 0;
  lastDays(days, offset).forEach((d) => {
    const v = db.visits[dayKey(d)];
    if (v) {
      visitors += v.visitors;
      views += v.views;
    }
  });
  return {
    sales,
    expenses,
    leads,
    revenue,
    cost,
    gross: revenue - cost,
    expensesTotal: exp,
    net: revenue - cost - exp,
    units: deviceSales.length,
    ticket: deviceSales.length ? deviceSales.reduce((a, s) => a + s.price, 0) / deviceSales.length : 0,
    visitors,
    views,
    conversion: visitors ? (leads.length / visitors) * 100 : 0,
  };
}

export function dailySeries(db: DB, days: number) {
  return lastDays(days).map((d) => {
    const key = dayKey(d);
    const s = db.sales.filter((x) => dayKey(new Date(x.date)) === key);
    return {
      date: d,
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      vendas: s.filter((x) => x.kind === "venda").reduce((a, x) => a + x.price, 0),
      reparos: s.filter((x) => x.kind === "reparo").reduce((a, x) => a + x.price, 0),
      visitors: db.visits[key]?.visitors ?? 0,
      views: db.visits[key]?.views ?? 0,
    };
  });
}

/** Agrupa em semanas quando o período é longo, pra barra não virar fiapo */
export function weekly<T extends { date: Date; label: string }>(rows: T[], keys: (keyof T)[]) {
  const out: { label: string; values: number[] }[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    out.push({
      label: chunk[0].label,
      values: keys.map((k) => chunk.reduce((a, r) => a + Number(r[k]), 0)),
    });
  }
  return out;
}
