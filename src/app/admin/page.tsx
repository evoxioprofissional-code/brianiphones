"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import { compactMoney, dayKey, money, number, relative } from "@/lib/format";
import { dailySeries, pct, summarize, weekly } from "@/lib/metrics";
import { Card, PageHead, RangeFilter, Stat } from "@/components/admin/AdminShell";
import { AreaLine, HBars, Legend, SERIES, StackedBars } from "@/components/admin/Charts";
import { LeadTypeTag, StatusTag } from "@/components/admin/Tags";
import { ArrowRight } from "@/components/ui/Icons";

const PATH_LABEL: Record<string, string> = {
  "/": "Início",
  "/loja": "Loja",
  "/loja/produto": "Página de produto",
  "/troca": "Troca na entrada",
  "/reparo": "Reparo",
};

export default function Dashboard() {
  const db = useDB();
  const [days, setDays] = useState(30);

  const data = useMemo(() => {
    if (!db) return null;
    const cur = summarize(db, days);
    const prev = summarize(db, days, days);
    const series = dailySeries(db, days);
    const bars =
      days > 30
        ? weekly(series, ["vendas", "reparos"])
        : series.map((s) => ({ label: s.label, values: [s.vendas, s.reparos] }));
    const byType = (["orcamento", "troca", "reparo"] as const).map((t) => ({
      label: { orcamento: "Orçamento de produto", troca: "Troca na entrada", reparo: "Reparo" }[t],
      value: cur.leads.filter((l) => l.type === t).length,
    }));
    const paths: Record<string, number> = {};
    series.forEach((s) => {
      const v = db.visits[dayKey(s.date)];
      if (v) Object.entries(v.paths).forEach(([p, n]) => (paths[p] = (paths[p] ?? 0) + n));
    });
    const topPaths = Object.entries(paths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([p, n]) => ({ label: PATH_LABEL[p] ?? p, value: n }));
    const lowStock = db.products.filter((p) => p.active && p.stock <= 1).slice(0, 6);
    return { cur, prev, series, bars, byType, topPaths, lowStock };
  }, [db, days]);

  if (!db || !data) return null;
  const { cur, prev } = data;

  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting()}, Brian.`}
        actions={<RangeFilter value={days} onChange={setDays} />}
      />

      <div className="space-y-5 px-5 py-8 md:px-10">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat label="Faturamento" value={compactMoney(cur.revenue)} delta={pct(cur.revenue, prev.revenue)} hint={`vs. ${days} dias anteriores`} />
          <Stat label="Lucro bruto" value={compactMoney(cur.gross)} delta={pct(cur.gross, prev.gross)} hint={`margem ${cur.revenue ? ((cur.gross / cur.revenue) * 100).toFixed(0) : 0}%`} />
          <Stat label="Contatos pelo site" value={number(cur.leads.length)} delta={pct(cur.leads.length, prev.leads.length)} hint={`${cur.conversion.toFixed(1)}% dos visitantes`} />
          <Stat label="Visitantes" value={number(cur.visitors)} delta={pct(cur.visitors, prev.visitors)} hint={`${number(cur.views)} páginas vistas`} />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title={days > 30 ? "Faturamento por semana" : "Faturamento por dia"}
            aside={
              <Legend
                items={[
                  { color: SERIES[0], label: "Aparelhos" },
                  { color: SERIES[1], label: "Reparos" },
                ]}
              />
            }
          >
            <StackedBars
              data={data.bars}
              series={[
                { label: "Aparelhos", color: SERIES[0] },
                { label: "Reparos", color: SERIES[1] },
              ]}
              format={(v) => (v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : String(Math.round(v)))}
            />
          </Card>

          <Card title="De onde vêm os contatos">
            <HBars data={data.byType} format={number} />
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] bg-line">
              <div className="bg-card p-4">
                <p className="label text-[10px] text-muted">Aparelhos vendidos</p>
                <p className="mt-2 text-[22px] font-bold tabular">{cur.units}</p>
              </div>
              <div className="bg-card p-4">
                <p className="label text-[10px] text-muted">Ticket médio</p>
                <p className="mt-2 text-[22px] font-bold tabular">{compactMoney(cur.ticket)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Visitantes no site">
            <AreaLine
              data={data.series.map((s) => ({ label: s.label, value: s.visitors }))}
              label="Visitantes"
              format={(v) => number(Math.round(v))}
            />
          </Card>
          <Card title="Páginas mais vistas">
            <HBars data={data.topPaths} format={number} color="#8a99c4" />
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="Últimos contatos"
            aside={
              <Link href="/admin/contatos" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
                Ver todos <ArrowRight size={14} />
              </Link>
            }
          >
            <ul className="-my-2 divide-y divide-line">
              {db.leads.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-4 py-3">
                  <LeadTypeTag type={l.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">
                      {l.name ?? "Visitante"} {l.city ? <span className="font-normal text-muted">· {l.city}</span> : null}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {l.quote?.productName ??
                        (l.trade ? `${l.trade.model} → ${l.trade.desired}` : l.repair ? `${l.repair.model} · ${l.repair.issues.join(", ")}` : "")}
                    </p>
                  </div>
                  <StatusTag status={l.status} />
                  <span className="hidden w-20 text-right text-[12px] text-muted sm:block">{relative(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Estoque acabando"
            aside={
              <Link href="/admin/produtos" className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
                Produtos <ArrowRight size={14} />
              </Link>
            }
          >
            {data.lowStock.length === 0 ? (
              <p className="text-[14px] text-muted">Tudo com estoque.</p>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {data.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">{p.name}</p>
                      <p className="text-[12px] text-muted">
                        {p.storage} · {p.color}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tabular">{money(p.price)}</p>
                      <p className={`text-[12px] ${p.stock === 0 ? "text-bad" : "text-warn"}`}>{p.stock === 0 ? "Esgotado" : "1 unidade"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <DemoNotice />
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function DemoNotice() {
  return (
    <p className="pt-4 text-[12px] leading-[1.6] text-faint">
      Os números acima são de demonstração e ficam salvos só neste navegador até o banco de dados ser conectado. Em Configurações
      dá pra zerar tudo.
    </p>
  );
}
