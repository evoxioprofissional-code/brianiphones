"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  ChevronRight,
  Clock,
  CreditCard,
  MessageCircle,
  Package,
  PackageCheck,
  Printer,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { useDB, usingDatabase } from "@/lib/store";
import { compactMoney, dayKey, money, number, relative } from "@/lib/format";
import { lastDays, pct } from "@/lib/metrics";
import { hoursSince, isPaid, ordersInRange, PAY_LABEL, SHIP_LABEL } from "@/lib/admin";
import { AreaLine, HBars } from "@/components/admin/Charts";
import { ALink, Badge, Kpi, ORDER_LABEL, ORDER_TONE, OrderBadge, PageBody, PageHeader, Panel, Segmented, TONE_HEX } from "@/components/admin/kit";
import { ProductMedia } from "@/components/site/ProductMedia";
import type { OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["aguardando_pagamento", "pago", "separando", "embalado", "enviado", "entregue"];

export default function Dashboard() {
  const db = useDB();
  const [days, setDays] = useState(30);

  const data = useMemo(() => {
    if (!db) return null;
    const cur = ordersInRange(db, days);
    const prev = ordersInRange(db, days, days);
    const paid = cur.filter(isPaid);
    const prevPaid = prev.filter(isPaid);
    const revenue = paid.reduce((a, o) => a + o.total, 0);
    const prevRevenue = prevPaid.reduce((a, o) => a + o.total, 0);
    const series = lastDays(days).map((d) => {
      const k = dayKey(d);
      const os = paid.filter((o) => dayKey(new Date(o.createdAt)) === k);
      return {
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: os.reduce((a, o) => a + o.total, 0),
        count: os.length,
        visitors: db.visits[k]?.visitors ?? 0,
      };
    });
    const visitors = series.reduce((a, s) => a + s.visitors, 0);
    const prevVisitors = lastDays(days, days).reduce((a, d) => a + (db.visits[dayKey(d)]?.visitors ?? 0), 0);

    // produtos mais vendidos no período
    const units = new Map<string, { name: string; qty: number; value: number; id: string }>();
    paid.forEach((o) =>
      o.items.forEach((it) => {
        const u = units.get(it.productId) ?? { name: `${it.name} · ${it.detail.split(" · ")[0]}`, qty: 0, value: 0, id: it.productId };
        u.qty += it.qty;
        u.value += it.price * it.qty;
        units.set(it.productId, u);
      }),
    );
    const top = [...units.values()].sort((a, b) => b.value - a.value).slice(0, 5);

    const byShip = Object.entries(SHIP_LABEL).map(([k, label]) => ({ label, value: paid.filter((o) => o.shipping.method === k).length }));
    const byPay = Object.entries(PAY_LABEL).map(([k, label]) => ({ label, value: paid.filter((o) => o.payment === k).reduce((a, o) => a + o.total, 0) }));

    const pipeline = FLOW.map((s) => ({ status: s, count: db.orders.filter((o) => o.status === s).length }));

    return {
      revenue,
      revenueDelta: pct(revenue, prevRevenue),
      orders: paid.length,
      ordersDelta: pct(paid.length, prevPaid.length),
      ticket: paid.length ? revenue / paid.length : 0,
      ticketDelta: pct(paid.length ? revenue / paid.length : 0, prevPaid.length ? prevRevenue / prevPaid.length : 0),
      visitors,
      visitorsDelta: pct(visitors, prevVisitors),
      conversion: visitors ? (paid.length / visitors) * 100 : 0,
      series,
      top,
      byShip,
      byPay,
      pipeline,
    };
  }, [db, days]);

  if (!db || !data) return null;

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const toPick = db.orders.filter((o) => o.status === "pago");
  const picking = db.orders.filter((o) => o.status === "separando");
  const noLabel = db.orders.filter((o) => o.status === "embalado" && o.shipping.method !== "retirada" && !o.printed?.label);
  const lateUnpaid = db.orders.filter((o) => o.status === "aguardando_pagamento" && hoursSince(o.createdAt) > 24);
  const outOfStock = db.products.filter((p) => p.active && p.stock === 0);
  const lowStock = db.products.filter((p) => p.active && p.stock > 0 && p.stock <= 1);
  const newLeads = db.leads.filter((l) => l.status === "novo");

  const todos = [
    { n: toPick.length, icon: <PackageCheck size={18} />, tone: "blue" as const, title: "pedidos pagos para separar", href: "/admin/logistica", cta: "Separar" },
    { n: picking.length, icon: <Box size={18} />, tone: "purple" as const, title: "em separação", href: "/admin/logistica", cta: "Abrir" },
    { n: noLabel.length, icon: <Printer size={18} />, tone: "indigo" as const, title: "prontos sem etiqueta impressa", href: `/admin/imprimir/etiquetas?ids=${noLabel.map((o) => o.id).join(",")}`, cta: "Imprimir" },
    { n: lateUnpaid.length, icon: <Clock size={18} />, tone: "orange" as const, title: "aguardando pagamento há mais de 24h", href: "/admin/pedidos?status=aguardando_pagamento", cta: "Ver" },
    { n: outOfStock.length, icon: <AlertTriangle size={18} />, tone: "red" as const, title: "produtos ativos sem estoque", href: "/admin/produtos?f=sem-estoque", cta: "Repor" },
    { n: newLeads.length, icon: <MessageCircle size={18} />, tone: "teal" as const, title: "contatos novos pelo site", href: "/admin/contatos", cta: "Responder" },
  ].filter((t) => t.n > 0);

  const maxPipe = Math.max(...data.pipeline.map((p) => p.count), 1);

  return (
    <>
      <PageHeader
        eyebrow={<span className="inline-block first-letter:uppercase">{today}</span>}
        title={`${hello}, Brian.`}
        subtitle="Aqui está o resumo da loja online."
        actions={
          <Segmented
            items={[7, 30, 90].map((d) => ({ value: String(d), label: `${d} dias` }))}
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            className="bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
          />
        }
      />
      <PageBody className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi
            label="Faturamento online"
            value={compactMoney(data.revenue)}
            delta={data.revenueDelta}
            hint={`vs. ${days} dias anteriores`}
            icon={<CreditCard size={18} />}
            tone="blue"
            spark={data.series.map((s) => s.value)}
          />
          <Kpi label="Pedidos pagos" value={number(data.orders)} delta={data.ordersDelta} hint="no período" icon={<ShoppingBag size={18} />} tone="green" spark={data.series.map((s) => s.count)} />
          <Kpi label="Ticket médio" value={money(data.ticket)} delta={data.ticketDelta} hint="por pedido" icon={<Package size={18} />} tone="purple" />
          <Kpi
            label="Visitantes"
            value={number(data.visitors)}
            delta={data.visitorsDelta}
            hint={`${data.conversion.toFixed(1)}% viraram pedido`}
            icon={<Users size={18} />}
            tone="orange"
            spark={data.series.map((s) => s.visitors)}
          />
        </div>

        {/* Para fazer agora + Funil */}
        <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
          <Panel title="Para fazer agora" subtitle={todos.length ? "O que precisa da sua atenção hoje" : "Nada pendente. Tudo em dia."}>
            {todos.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {todos.map((t) => (
                  <li key={t.title}>
                    <Link href={t.href} className="group flex items-center gap-3 rounded-2xl bg-[#f5f5f7] p-3.5 transition-colors hover:bg-[#ececf0]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: TONE_HEX[t.tone] }}>
                        {t.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[20px] font-semibold leading-none tabular">{t.n}</span>
                        <span className="mt-1 block text-[12.5px] leading-tight text-muted">{t.title}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[12.5px] font-medium text-[#0071e3] opacity-0 transition-opacity group-hover:opacity-100">
                        {t.cta} <ChevronRight size={14} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid place-items-center rounded-2xl bg-[#f5f5f7] py-10 text-[14px] text-muted">✓ Sem pendências</div>
            )}
          </Panel>

          <Panel title="Funil de pedidos" subtitle="Onde estão os pedidos agora" actions={<ALink href="/admin/pedidos" size="sm" variant="ghost">Ver todos <ArrowUpRight size={14} /></ALink>}>
            <ul className="space-y-2.5">
              {data.pipeline.map((p) => (
                <li key={p.status}>
                  <Link href={`/admin/pedidos?status=${p.status}`} className="group grid grid-cols-[150px_1fr_32px] items-center gap-3">
                    <span className="truncate text-[13px] text-[#424245] group-hover:text-ink">{ORDER_LABEL[p.status]}</span>
                    <span className="h-7 overflow-hidden rounded-lg bg-[#f5f5f7]">
                      <span
                        className="block h-full rounded-lg transition-[width] duration-700"
                        style={{ width: `${Math.max(p.count ? 6 : 0, (p.count / maxPipe) * 100)}%`, background: TONE_HEX[ORDER_TONE[p.status]] }}
                      />
                    </span>
                    <span className="text-right text-[14px] font-semibold tabular">{p.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Gráfico */}
        <Panel title="Faturamento por dia" subtitle="Pedidos pagos na loja online">
          <AreaLine data={data.series.map((s) => ({ label: s.label, value: s.value }))} label="Faturamento" format={compactMoney} height={240} />
        </Panel>

        {/* Últimos pedidos + mais vendidos */}
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Panel title="Últimos pedidos" actions={<ALink href="/admin/pedidos" size="sm" variant="ghost">Ver todos <ArrowUpRight size={14} /></ALink>} padded={false}>
            <ul className="divide-y divide-black/[0.05] pb-2">
              {db.orders.slice(0, 7).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#fafafa] md:px-6">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f5f5f7] text-[13px] font-semibold text-[#424245]">
                      {o.customer.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">
                        #{o.number} · {o.customer.name}
                      </span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {o.items.map((i) => i.name).join(", ")} · {relative(o.createdAt)}
                      </span>
                    </span>
                    <span className="hidden sm:block">
                      <OrderBadge status={o.status} />
                    </span>
                    <span className="w-24 text-right text-[14px] font-semibold tabular">{money(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Mais vendidos" subtitle={`Últimos ${days} dias`}>
            {data.top.length ? (
              <ul className="space-y-3">
                {data.top.map((t, i) => {
                  const p = db.products.find((x) => x.id === t.id);
                  return (
                    <li key={t.id} className="flex items-center gap-3">
                      <span className="w-4 text-[12px] font-semibold text-faint tabular">{i + 1}</span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5f5f7] p-1.5">{p ? <ProductMedia p={p} /> : null}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">{t.name}</span>
                        <span className="block text-[12px] text-muted tabular">{t.qty} vendidos</span>
                      </span>
                      <span className="text-[13.5px] font-semibold tabular">{compactMoney(t.value)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-8 text-center text-[13px] text-muted">Sem vendas no período.</p>
            )}
          </Panel>
        </div>

        {/* Canais */}
        <div className="grid gap-5 md:grid-cols-3">
          <Panel title="Forma de entrega" subtitle="Pedidos pagos">
            <HBars data={data.byShip} format={number} />
          </Panel>
          <Panel title="Forma de pagamento" subtitle="Valor recebido">
            <HBars data={data.byPay} format={compactMoney} color={TONE_HEX.green} />
          </Panel>
          <Panel title="Estoque" subtitle="Itens ativos na loja">
            <div className="grid grid-cols-2 gap-2.5">
              <MiniStat label="Produtos ativos" value={db.products.filter((p) => p.active).length} />
              <MiniStat label="Unidades" value={db.products.filter((p) => p.active).reduce((a, p) => a + p.stock, 0)} />
              <MiniStat label="Última unidade" value={lowStock.length} tone="orange" />
              <MiniStat label="Sem estoque" value={outOfStock.length} tone="red" />
            </div>
            <p className="mt-4 text-[12.5px] text-muted">
              Valor em estoque:{" "}
              <strong className="font-semibold text-ink tabular">{money(db.products.filter((p) => p.active).reduce((a, p) => a + p.price * p.stock, 0))}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {lowStock.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/admin/produtos/${p.id}`}>
                  <Badge tone="orange">
                    {p.name} {p.storage}
                  </Badge>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <p className="flex items-center gap-2 text-[12px] text-faint">
          <Truck size={14} /> {usingDatabase ? "Números em tempo real, direto do banco de dados." : "Modo demonstração: dados gravados só neste navegador."}
        </p>
      </PageBody>
    </>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "orange" | "red" }) {
  return (
    <div className="rounded-xl bg-[#f5f5f7] p-3">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`mt-1 text-[20px] font-semibold tabular ${tone === "orange" ? "text-[#b25e09]" : tone === "red" ? "text-[#c40014]" : ""}`}>{value}</p>
    </div>
  );
}
