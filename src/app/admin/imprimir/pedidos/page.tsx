"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { markPrinted, useDB } from "@/lib/store";
import { dateTime, money, moneyCents } from "@/lib/format";
import { addressLines, PAY_LABEL } from "@/lib/admin";
import { Logo } from "@/components/site/Logo";
import { Barcode } from "@/components/admin/Barcode";
import { PrintToolbar } from "@/components/admin/PrintToolbar";
import { ORDER_LABEL } from "@/components/admin/kit";

export default function PrintPedidosPage() {
  return (
    <Suspense fallback={null}>
      <PrintPedidos />
    </Suspense>
  );
}

function PrintPedidos() {
  const db = useDB();
  const ids = (useSearchParams().get("ids") ?? "").split(",").filter(Boolean);
  if (!db) return null;
  const orders = ids.map((id) => db.orders.find((o) => o.id === id)).filter((o) => !!o);
  const s = db.settings;
  const ship = s.shipping;

  return (
    <div className="min-h-dvh bg-[#e8e8ed] print:bg-white">
      <style>{`@page { size: A4; margin: 12mm; } @media print { .sheet { box-shadow: none !important; margin: 0 !important; width: auto !important; min-height: 0 !important; padding: 0 !important; } }`}</style>
      <PrintToolbar
        title="Pedidos e lista de separação"
        count={orders.length}
        onPrint={() => {
          markPrinted(
            orders.map((o) => o.id),
            "slip",
          );
          window.print();
        }}
      />
      {orders.length === 0 && <p className="py-20 text-center text-[14px] text-muted print:hidden">Nenhum pedido selecionado.</p>}

      <div className="mx-auto max-w-[210mm] space-y-6 py-8 print:space-y-0 print:py-0">
        {orders.map((o) => (
          <section key={o.id} className="sheet mx-auto min-h-[297mm] w-[210mm] break-after-page bg-white p-[14mm] text-[12px] text-black shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)] last:break-after-auto">
            {/* Cabeçalho */}
            <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
              <div>
                <Logo />
                <p className="mt-3 leading-[1.5] text-[#424245]">
                  {ship?.senderName}
                  {ship?.senderDoc ? ` · ${ship.senderDoc}` : ""}
                  <br />
                  {s.address} · {s.city}
                  <br />
                  WhatsApp {ship?.senderPhone} · @{s.instagram}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#6e6e73]">Pedido</p>
                <p className="text-[28px] font-bold leading-none tabular">#{o.number}</p>
                <Barcode value={o.number} className="ml-auto mt-2 h-10 w-[150px]" />
                <p className="mt-1 text-[11px] text-[#6e6e73]">{dateTime(o.createdAt)}</p>
              </div>
            </header>

            {/* Cliente e entrega */}
            <div className="grid grid-cols-2 gap-6 border-b border-black/20 py-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Cliente</p>
                <p className="text-[14px] font-semibold">{o.customer.name}</p>
                <p>CPF {o.customer.cpf}</p>
                <p>{o.customer.phone}</p>
                <p>{o.customer.email}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Entrega · {o.shipping.label}</p>
                {addressLines(o).map((l) => (
                  <p key={l} className={l === addressLines(o)[0] ? "text-[13px] font-medium" : ""}>
                    {l}
                  </p>
                ))}
                <p className="mt-1 text-[#6e6e73]">Prazo: {o.shipping.days}</p>
                {o.tracking?.code ? <p className="mt-1 font-mono font-semibold">Rastreio: {o.tracking.code}</p> : null}
              </div>
            </div>

            {/* Itens */}
            <table className="mt-4 w-full border-collapse">
              <thead>
                <tr className="border-b border-black text-left text-[10px] uppercase tracking-[0.1em] text-[#6e6e73]">
                  <th className="w-[44px] py-2">Conf.</th>
                  <th className="py-2">Produto</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-center">Qtd.</th>
                  <th className="py-2 text-right">Unitário</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((it) => {
                  const p = db.products.find((x) => x.id === it.productId);
                  return (
                    <tr key={it.productId} className="border-b border-black/15 align-top">
                      <td className="py-3">
                        <span className="block h-[16px] w-[16px] border-[1.5px] border-black" />
                      </td>
                      <td className="py-3">
                        <p className="text-[13px] font-semibold">{it.name}</p>
                        <p className="text-[#424245]">{it.detail}</p>
                        {p?.battery && p.condition !== "novo" ? <p className="text-[#6e6e73]">Bateria {p.battery}% · garantia {p.warrantyMonths} meses</p> : null}
                        {p?.internalNotes ? <p className="mt-1 text-[#6e6e73]">Obs.: {p.internalNotes}</p> : null}
                      </td>
                      <td className="py-3 font-mono">{p?.sku ?? "—"}</td>
                      <td className="py-3 text-center text-[14px] font-semibold">{it.qty}</td>
                      <td className="py-3 text-right tabular">{money(it.price)}</td>
                      <td className="py-3 text-right font-semibold tabular">{money(it.price * it.qty)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totais e pagamento */}
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Pagamento</p>
                <p>
                  {PAY_LABEL[o.payment]} via Mercado Pago
                  {o.installments > 1 ? ` · ${o.installments}x de ${moneyCents(Math.ceil((o.total / o.installments) * 100) / 100)}` : " · à vista"}
                </p>
                <p className="text-[#6e6e73]">Situação: {ORDER_LABEL[o.status]}</p>
                {o.notes ? (
                  <div className="mt-3 border border-black/30 p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">Observação</p>
                    <p>{o.notes}</p>
                  </div>
                ) : null}
              </div>
              <dl className="space-y-1 text-[12.5px]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular">{money(o.subtotal)}</dd>
                </div>
                {o.discount ? (
                  <div className="flex justify-between">
                    <dt>Desconto</dt>
                    <dd className="tabular">− {money(o.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt>Frete</dt>
                  <dd className="tabular">{o.shipping.price ? money(o.shipping.price) : "Grátis"}</dd>
                </div>
                <div className="flex justify-between border-t-2 border-black pt-1.5 text-[15px] font-bold">
                  <dt>Total</dt>
                  <dd className="tabular">{money(o.total)}</dd>
                </div>
              </dl>
            </div>

            {/* Assinaturas */}
            <div className="mt-12 grid grid-cols-3 gap-6 text-center text-[11px] text-[#6e6e73]">
              {["Separado por", "Conferido por", o.shipping.method === "retirada" ? "Retirado por (cliente)" : "Embalado por"].map((t) => (
                <div key={t}>
                  <div className="mb-1.5 h-8 border-b border-black" />
                  {t}
                </div>
              ))}
            </div>

            <p className="mt-10 border-t border-black/15 pt-3 text-center text-[10.5px] text-[#6e6e73]">
              Obrigado por comprar na Brian iPhones. Garantia da loja conforme informado em cada produto. Dúvidas: WhatsApp {ship?.senderPhone}.
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
