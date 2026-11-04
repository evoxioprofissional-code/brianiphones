import type { DB, Order, OrderStatus } from "./types";
import { inRange } from "./metrics";

/* ---------- Pedidos ---------- */

/** pedidos que contam como venda (pagos em diante) */
export const isPaid = (o: Order) => o.status !== "aguardando_pagamento" && o.status !== "cancelado";

export function ordersInRange(db: DB, days: number, offset = 0) {
  return db.orders.filter((o) => inRange(o.createdAt, days, offset));
}

export function addressLines(o: Order): string[] {
  const a = o.shipping.address;
  if (!a) return ["Retirada na loja"];
  return [`${a.street}, ${a.number}${a.complement ? ` · ${a.complement}` : ""}`, `${a.district} · ${a.city}/${a.uf}`, `CEP ${a.cep}`];
}

export const SHIP_LABEL: Record<string, string> = { retirada: "Retirada", local: "Entrega local", sedex: "SEDEX", pac: "PAC" };

export const PAY_LABEL: Record<string, string> = { pix: "Pix", cartao: "Cartão", boleto: "Boleto" };

/** próxima ação natural de um pedido */
export function nextAction(o: Order): { status: OrderStatus; label: string } | null {
  switch (o.status) {
    case "aguardando_pagamento":
      return { status: "pago", label: "Confirmar pagamento" };
    case "pago":
      return { status: "separando", label: "Iniciar separação" };
    case "separando":
      return { status: "embalado", label: o.shipping.method === "retirada" ? "Pronto para retirada" : "Marcar como embalado" };
    case "embalado":
      return o.shipping.method === "retirada" || o.shipping.method === "local"
        ? { status: "entregue", label: o.shipping.method === "retirada" ? "Cliente retirou" : "Marcar como entregue" }
        : { status: "enviado", label: "Informar envio" };
    case "enviado":
      return { status: "entregue", label: "Marcar como entregue" };
    default:
      return null;
  }
}

/** milissegundos de "agora menos N dias" (fica fora do componente por causa da regra de pureza do React) */
export function sinceDays(n: number) {
  return Date.now() - n * 864e5;
}

export function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

export function trackingUrl(code: string) {
  return `https://rastreamento.correios.com.br/app/index.php?objetos=${encodeURIComponent(code)}`;
}

/* ---------- Clientes (montados a partir dos pedidos) ---------- */

export type CustomerRow = {
  email: string;
  name: string;
  phone: string;
  cpf: string;
  city: string;
  uf: string;
  orders: Order[];
  paidOrders: number;
  spent: number;
  first: string;
  last: string;
  vip: boolean;
  tags: string[];
  notes: string;
};

export function buildCustomers(db: DB): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  // pedidos vêm do mais novo pro mais antigo
  for (const o of db.orders) {
    const key = o.customer.email.toLowerCase();
    let c = map.get(key);
    if (!c) {
      const meta = db.customers[key] ?? {};
      c = {
        email: key,
        name: o.customer.name,
        phone: o.customer.phone,
        cpf: o.customer.cpf,
        city: o.shipping.address?.city ?? "Itatiba",
        uf: o.shipping.address?.uf ?? "SP",
        orders: [],
        paidOrders: 0,
        spent: 0,
        first: o.createdAt,
        last: o.createdAt,
        vip: !!meta.vip,
        tags: meta.tags ?? [],
        notes: meta.notes ?? "",
      };
      map.set(key, c);
    }
    c.orders.push(o);
    if (isPaid(o)) {
      c.paidOrders += 1;
      c.spent += o.total;
    }
    if (o.createdAt < c.first) c.first = o.createdAt;
    if (o.createdAt > c.last) c.last = o.createdAt;
  }
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
}

/* ---------- Exportar CSV ---------- */

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Código de barras Code 128 (B) ---------- */

const C128 = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

/** Larguras alternadas (barra, espaço, barra...) do código, com zona de silêncio */
export function code128(text: string): number[] {
  const values = [...text].map((ch) => Math.min(94, Math.max(0, ch.charCodeAt(0) - 32)));
  let sum = 104;
  values.forEach((v, i) => (sum += v * (i + 1)));
  const codes = [104, ...values, sum % 103, 106];
  return codes.flatMap((c) => [...C128[c]].map(Number));
}
