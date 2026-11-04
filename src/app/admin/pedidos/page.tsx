"use client";

import { useMemo, useState } from "react";
import { setOrderStatus, useDB } from "@/lib/store";
import { dateTime, money, moneyCents, relative } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/site";
import type { Order, OrderStatus } from "@/lib/types";
import { Drawer, PageHead } from "@/components/admin/AdminShell";
import { waLink } from "@/lib/whatsapp";
import { WhatsApp } from "@/components/ui/Icons";

const STATUSES: OrderStatus[] = ["aguardando_pagamento", "pago", "separando", "enviado", "entregue", "cancelado"];

const TONE: Record<OrderStatus, string> = {
  aguardando_pagamento: "bg-warn/10 text-warn",
  pago: "bg-steel/12 text-steel",
  separando: "bg-steel/12 text-steel",
  enviado: "bg-ink/8 text-ink",
  entregue: "bg-ok/10 text-ok",
  cancelado: "bg-bad/10 text-bad",
};

function OrderStatusTag({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${TONE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export default function PedidosPage() {
  const db = useDB();
  const [status, setStatus] = useState<OrderStatus | "todos">("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const l = db?.orders ?? [];
    return status === "todos" ? l : l.filter((o) => o.status === status);
  }, [db, status]);

  if (!db) return null;
  const open = db.orders.find((o) => o.id === openId) ?? null;
  const toShip = db.orders.filter((o) => o.status === "pago" || o.status === "separando").length;
  const paidTotal = db.orders.filter((o) => !["aguardando_pagamento", "cancelado"].includes(o.status)).reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHead eyebrow="Vendas pela loja online" title="Pedidos" />

      <div className="px-5 py-6 md:px-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Pedidos" value={String(db.orders.length)} />
          <Kpi label="Aguardando pagamento" value={String(db.orders.filter((o) => o.status === "aguardando_pagamento").length)} />
          <Kpi label="Pra separar / enviar" value={String(toShip)} />
          <Kpi label="Vendido (pagos)" value={money(paidTotal)} />
        </div>

        <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto">
          {(["todos", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 shrink-0 rounded-full px-4 text-[13px] ${status === s ? "bg-ink text-paper" : "border border-line bg-card text-graphite"}`}
            >
              {s === "todos" ? "Todos" : ORDER_STATUS_LABEL[s]}
              <span className="ml-1.5 opacity-60 tabular">{s === "todos" ? db.orders.length : db.orders.filter((o) => o.status === s).length}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-[8px] border border-line bg-card">
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Pedido</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Itens</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Entrega</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-paper/60">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold tabular">#{o.number}</p>
                    <p className="text-[12px] text-muted">{relative(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3.5">{o.customer.name}</td>
                  <td className="hidden max-w-[260px] truncate px-4 py-3.5 text-muted md:table-cell">
                    {o.items.map((i) => `${i.qty > 1 ? `${i.qty}x ` : ""}${i.name}`).join(", ")}
                  </td>
                  <td className="hidden px-4 py-3.5 text-muted lg:table-cell">{o.shipping.label}</td>
                  <td className="px-4 py-3.5 text-right font-medium tabular">{money(o.total)}</td>
                  <td className="px-4 py-3.5">
                    <OrderStatusTag status={o.status} />
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-muted">
                    Nenhum pedido nesse filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[12px] leading-[1.6] text-faint">
          Quando o Mercado Pago estiver conectado, o pedido passa pra “Pago” sozinho assim que o pagamento for aprovado. Cancelar um pedido devolve os
          aparelhos ao estoque.
        </p>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Pedido #${open.number}` : ""}>
        {open && <OrderDetail o={open} whatsapp={db.settings.whatsapp} />}
      </Drawer>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-line bg-card p-4">
      <p className="label text-[10px] text-muted">{label}</p>
      <p className="mt-3 text-[24px] font-bold leading-none tracking-[-0.02em] tabular">{value}</p>
    </div>
  );
}

function OrderDetail({ o }: { o: Order; whatsapp: string }) {
  const phone = o.customer.phone.replace(/\D/g, "");
  const rows: [string, string][] = [
    ["Feito em", dateTime(o.createdAt)],
    ["Cliente", o.customer.name],
    ["E-mail", o.customer.email],
    ["Celular", o.customer.phone],
    ["CPF", o.customer.cpf],
    ["Pagamento", `${PAYMENT_LABEL[o.payment]}${o.installments > 1 ? ` · ${o.installments}x de ${moneyCents(Math.ceil((o.total / o.installments) * 100) / 100)}` : ""}`],
    ["Entrega", `${o.shipping.label} · ${o.shipping.days}`],
  ];
  if (o.shipping.address) {
    const a = o.shipping.address;
    rows.push(["Endereço", `${a.street}, ${a.number}${a.complement ? ` (${a.complement})` : ""} · ${a.district} · ${a.city}/${a.uf} · ${a.cep}`]);
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-[13px] font-medium text-graphite">Itens</p>
        <ul className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-card text-[14px]">
          {o.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-medium">
                  {i.qty}x {i.name}
                </span>
                <span className="text-[12.5px] text-muted">{i.detail}</span>
              </span>
              <span className="tabular">{money(i.price * i.qty)}</span>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3 text-muted">
            <span>Frete</span>
            <span className="tabular">{o.shipping.price ? money(o.shipping.price) : "Grátis"}</span>
          </li>
          <li className="flex justify-between px-4 py-3 font-semibold">
            <span>Total</span>
            <span className="tabular">{money(o.total)}</span>
          </li>
        </ul>
      </div>

      <dl className="font-mono text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 border-b border-dashed border-line py-3">
            <dt className="shrink-0 uppercase tracking-[0.08em] text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="text-[13px] font-medium text-graphite">Situação</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => (s !== "cancelado" || confirm("Cancelar o pedido? Os aparelhos voltam pro estoque.")) && setOrderStatus(o.id, s)}
              className={`rounded-[6px] border px-4 py-3 text-left text-[14px] ${o.status === s ? "border-ink bg-card font-medium" : "border-line hover:border-ink/30"}`}
            >
              {ORDER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {phone.length >= 10 && (
        <a
          href={waLink(`55${phone}`, `Olá, ${o.customer.name.split(" ")[0]}! Aqui é da Brian iPhones, sobre o seu pedido #${o.number}.`)}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-paper"
        >
          <WhatsApp size={17} /> Chamar o cliente no WhatsApp
        </a>
      )}
    </div>
  );
}
