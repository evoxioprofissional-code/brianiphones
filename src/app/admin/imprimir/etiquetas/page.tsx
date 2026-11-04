"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { markPrinted, useDB } from "@/lib/store";
import { addressLines, SHIP_LABEL } from "@/lib/admin";
import type { Order, Product, ShippingSettings } from "@/lib/types";
import { Logo } from "@/components/site/Logo";
import { Barcode } from "@/components/admin/Barcode";
import { PrintToolbar } from "@/components/admin/PrintToolbar";
import { cn } from "@/lib/utils";

type Format = "10x15" | "a4";

export default function PrintEtiquetasPage() {
  return (
    <Suspense fallback={null}>
      <PrintEtiquetas />
    </Suspense>
  );
}

function PrintEtiquetas() {
  const db = useDB();
  const ids = (useSearchParams().get("ids") ?? "").split(",").filter(Boolean);
  const [format, setFormat] = useState<Format>("10x15");
  if (!db) return null;
  const orders = ids.map((id) => db.orders.find((o) => o.id === id)).filter((o): o is Order => !!o);
  const skipped = orders.filter((o) => o.shipping.method === "retirada");
  const labels = orders.filter((o) => o.shipping.method !== "retirada");
  const ship = db.settings.shipping;

  return (
    <div className="min-h-dvh bg-[#e8e8ed] print:bg-white">
      <style>
        {format === "10x15"
          ? `@page { size: 100mm 150mm; margin: 0; } @media print { .label { box-shadow: none !important; margin: 0 !important; } }`
          : `@page { size: A4; margin: 8mm; } @media print { .label { box-shadow: none !important; } }`}
      </style>
      <PrintToolbar
        title="Etiquetas de envio"
        count={labels.length}
        onPrint={() => {
          markPrinted(
            labels.map((o) => o.id),
            "label",
          );
          window.print();
        }}
      >
        <div className="inline-flex rounded-full bg-[#f5f5f7] p-1">
          {(
            [
              ["10x15", "Térmica 10×15"],
              ["a4", "A4 (4 por folha)"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} onClick={() => setFormat(v)} className={cn("h-8 rounded-full px-3.5 text-[13px]", format === v ? "bg-white font-medium shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted")}>
              {l}
            </button>
          ))}
        </div>
      </PrintToolbar>

      {skipped.length > 0 && (
        <p className="mx-auto mt-5 max-w-[640px] rounded-2xl bg-white px-5 py-3 text-center text-[13px] text-muted print:hidden">
          {skipped.length} pedido(s) de retirada na loja ficaram de fora (não precisam de etiqueta).
        </p>
      )}
      {labels.length === 0 && <p className="py-20 text-center text-[14px] text-muted print:hidden">Nenhuma etiqueta para imprimir.</p>}

      {format === "10x15" ? (
        <div className="flex flex-col items-center gap-6 py-8 print:block print:gap-0 print:py-0">
          {labels.map((o) => (
            <Label key={o.id} order={o} ship={ship} products={db.products} className="h-[150mm] w-[100mm] break-after-page last:break-after-auto" />
          ))}
        </div>
      ) : (
        <div className="mx-auto grid w-[194mm] grid-cols-2 gap-[4mm] py-8 print:py-0">
          {labels.map((o, i) => (
            <Label key={o.id} order={o} ship={ship} products={db.products} className={cn("h-[138mm] w-[95mm]", i % 4 === 3 && "break-after-page")} />
          ))}
        </div>
      )}
    </div>
  );
}

function Label({ order: o, ship, products, className }: { order: Order; ship?: ShippingSettings; products: Product[]; className?: string }) {
  const weight = o.items.reduce((a, it) => a + (products.find((p) => p.id === it.productId)?.weightGrams ?? ship?.defaultWeightGrams ?? 600) * it.qty, 0);
  const a = o.shipping.address;
  const service = o.shipping.method === "local" ? "ENTREGA LOCAL" : SHIP_LABEL[o.shipping.method].toUpperCase();
  return (
    <section className={cn("label flex flex-col overflow-hidden border-2 border-black bg-white p-[5mm] text-[10.5px] leading-[1.35] text-black shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)]", className)}>
      {/* topo */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-[3mm]">
        <Logo compact />
        <div className="text-right">
          <p className="text-[18px] font-black leading-none tracking-tight">{service}</p>
          <p className="mt-0.5 text-[10px]">Pedido #{o.number}</p>
        </div>
      </div>

      {/* código */}
      <div className="border-b-2 border-black py-[3mm] text-center">
        <Barcode value={o.tracking?.code || o.number} className="mx-auto h-[16mm] w-full" />
        <p className="mt-1 font-mono text-[12px] font-bold tracking-[0.12em]">{o.tracking?.code || `PEDIDO ${o.number}`}</p>
      </div>

      {/* destinatário */}
      <div className="flex-1 py-[3mm]">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em]">Destinatário</p>
        <p className="mt-1 text-[15px] font-bold leading-tight">{o.customer.name}</p>
        {a ? (
          <>
            <p className="mt-1 text-[12.5px] font-medium">
              {a.street}, {a.number}
            </p>
            {a.complement ? <p className="text-[12px]">{a.complement}</p> : null}
            <p className="text-[12px]">{a.district}</p>
            <p className="text-[13px] font-bold">
              {a.city} / {a.uf}
            </p>
            <p className="mt-1 text-[16px] font-black tracking-wide">CEP {a.cep}</p>
          </>
        ) : (
          addressLines(o).map((l) => <p key={l}>{l}</p>)
        )}
        <p className="mt-1">Tel. {o.customer.phone}</p>
      </div>

      {/* remetente */}
      <div className="border-t-2 border-black pt-[3mm] text-[9.5px]">
        <p className="text-[8.5px] font-bold uppercase tracking-[0.14em]">Remetente</p>
        <p className="font-semibold">{ship?.senderName}</p>
        <p>
          {ship?.originStreet}, {ship?.originNumber} · {ship?.originDistrict}
        </p>
        <p>
          {ship?.originCity}/{ship?.originUf} · CEP {ship?.originCep}
        </p>
        <div className="mt-[2mm] flex justify-between border-t border-black/40 pt-[1.5mm] text-[9px]">
          <span>Peso aprox. {(weight / 1000).toFixed(2).replace(".", ",")} kg</span>
          <span>
            {o.items.reduce((s, i) => s + i.qty, 0)} volume(s) · {new Date(o.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
    </section>
  );
}
