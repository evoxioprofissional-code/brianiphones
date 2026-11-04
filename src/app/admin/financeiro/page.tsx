"use client";

import { useMemo, useState } from "react";
import { addExpense, addSale, deleteExpense, deleteSale, useDB } from "@/lib/store";
import { compactMoney, money, shortDate } from "@/lib/format";
import { dailySeries, pct, summarize, weekly } from "@/lib/metrics";
import type { Expense, PaymentMethod, Sale } from "@/lib/types";
import { Btn, Card, Drawer, PageHead, RangeFilter, Stat } from "@/components/admin/AdminShell";
import { HBars, Legend, SERIES, StackedBars } from "@/components/admin/Charts";
import { Field, Input, Select } from "@/components/ui/Form";
import { Plus, Trash } from "@/components/ui/Icons";

const PAY_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
  misto: "Misto",
};
const EXP_LABEL: Record<Expense["category"], string> = {
  aluguel: "Aluguel",
  pecas: "Peças",
  marketing: "Marketing",
  pessoal: "Pessoal",
  outros: "Outros",
};

export default function FinanceiroPage() {
  const db = useDB();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"vendas" | "despesas">("vendas");
  const [form, setForm] = useState<"venda" | "despesa" | null>(null);

  const data = useMemo(() => {
    if (!db) return null;
    const cur = summarize(db, days);
    const prev = summarize(db, days, days);
    const series = dailySeries(db, days);
    const bars = days > 30 ? weekly(series, ["vendas", "reparos"]) : series.map((s) => ({ label: s.label, values: [s.vendas, s.reparos] }));
    const pay: Record<string, number> = {};
    cur.sales.forEach((s) => (pay[s.payment] = (pay[s.payment] ?? 0) + s.price));
    const payments = Object.entries(pay)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ label: PAY_LABEL[k as PaymentMethod], value: v, sub: `${((v / (cur.revenue || 1)) * 100).toFixed(0)}%` }));
    const tradeIns = cur.sales.filter((s) => s.tradeInValue).length;
    return { cur, prev, bars, payments, tradeIns };
  }, [db, days]);

  if (!db || !data) return null;
  const { cur, prev } = data;
  const fmtAxis = (v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : String(Math.round(v)));

  return (
    <>
      <PageHead
        eyebrow="Vendas, reparos e despesas"
        title="Financeiro"
        actions={
          <>
            <RangeFilter value={days} onChange={setDays} />
            <Btn variant="ghost" onClick={() => setForm("despesa")}>
              <Plus size={15} /> Despesa
            </Btn>
            <Btn onClick={() => setForm("venda")}>
              <Plus size={15} /> Venda
            </Btn>
          </>
        }
      />

      <div className="space-y-5 px-5 py-8 md:px-10">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Stat label="Faturamento" value={compactMoney(cur.revenue)} delta={pct(cur.revenue, prev.revenue)} hint={`${cur.sales.length} lançamentos`} />
          <Stat label="Lucro bruto" value={compactMoney(cur.gross)} delta={pct(cur.gross, prev.gross)} hint="faturamento − custo" />
          <Stat label="Despesas" value={compactMoney(cur.expensesTotal)} hint={`${cur.expenses.length} lançamentos`} />
          <Stat label="Resultado" value={compactMoney(cur.net)} delta={pct(cur.net, prev.net)} hint="lucro − despesas" />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card
            className="xl:col-span-2"
            title="Entradas"
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
              format={fmtAxis}
              height={260}
            />
          </Card>
          <Card title="Formas de pagamento">
            <HBars data={data.payments} format={compactMoney} />
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] bg-line">
              <div className="bg-card p-4">
                <p className="label text-[10px] text-muted">Ticket médio</p>
                <p className="mt-2 text-[20px] font-bold tabular">{compactMoney(cur.ticket)}</p>
              </div>
              <div className="bg-card p-4">
                <p className="label text-[10px] text-muted">Com troca</p>
                <p className="mt-2 text-[20px] font-bold tabular">{data.tradeIns}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="rounded-[8px] border border-line bg-card">
          <div className="flex gap-1 border-b border-line p-2">
            {(["vendas", "despesas"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`h-9 rounded-full px-4 text-[13px] ${tab === t ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
              >
                {t === "vendas" ? `Vendas e reparos (${cur.sales.length})` : `Despesas (${cur.expenses.length})`}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            {tab === "vendas" ? (
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    {["Data", "Descrição", "Pagamento", "Valor", "Custo", "Lucro", ""].map((h) => (
                      <th key={h} className="label px-4 py-3 text-[10px] font-normal text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cur.sales.map((s) => (
                    <tr key={s.id} className="group hover:bg-paper/60">
                      <td className="px-4 py-3 text-muted tabular">{shortDate(s.date)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{s.description}</span>
                        <span className="ml-2 text-muted">{s.kind === "reparo" ? "· reparo" : s.customer ? `· ${s.customer}` : ""}</span>
                        {s.tradeInValue ? <span className="label ml-2 text-[9px] text-steel">troca {compactMoney(s.tradeInValue)}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-graphite">{PAY_LABEL[s.payment]}</td>
                      <td className="px-4 py-3 font-medium tabular">{money(s.price)}</td>
                      <td className="px-4 py-3 text-muted tabular">{money(s.cost)}</td>
                      <td className="px-4 py-3 tabular">{money(s.price - s.cost)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => confirm("Excluir lançamento?") && deleteSale(s.id)} className="text-faint opacity-0 hover:text-bad group-hover:opacity-100" aria-label="Excluir">
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line">
                    {["Data", "Descrição", "Categoria", "Valor", ""].map((h) => (
                      <th key={h} className="label px-4 py-3 text-[10px] font-normal text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cur.expenses.map((e) => (
                    <tr key={e.id} className="group hover:bg-paper/60">
                      <td className="px-4 py-3 text-muted tabular">{shortDate(e.date)}</td>
                      <td className="px-4 py-3 font-medium">{e.description}</td>
                      <td className="px-4 py-3 text-graphite">{EXP_LABEL[e.category]}</td>
                      <td className="px-4 py-3 font-medium tabular">{money(e.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => confirm("Excluir despesa?") && deleteExpense(e.id)} className="text-faint opacity-0 hover:text-bad group-hover:opacity-100" aria-label="Excluir">
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {(tab === "vendas" ? cur.sales : cur.expenses).length === 0 && <p className="p-10 text-center text-muted">Nada lançado nesse período.</p>}
          </div>
        </div>
      </div>

      <Drawer open={form !== null} onClose={() => setForm(null)} title={form === "venda" ? "Lançar venda ou reparo" : "Lançar despesa"}>
        {form === "venda" && <SaleForm onDone={() => setForm(null)} />}
        {form === "despesa" && <ExpenseForm onDone={() => setForm(null)} />}
      </Drawer>
    </>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function SaleForm({ onDone }: { onDone: () => void }) {
  const db = useDB();
  const [s, setS] = useState<Omit<Sale, "id">>({
    date: today(),
    description: "",
    kind: "venda",
    price: 0,
    cost: 0,
    payment: "pix",
    customer: "",
  });
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((x) => ({ ...x, [k]: v }));

  const pick = (id: string) => {
    const p = db?.products.find((x) => x.id === id);
    if (p) setS((x) => ({ ...x, description: `${p.name} ${p.storage}`, price: p.price, cost: p.cost ?? 0 }));
  };

  const save = () => {
    if (!s.description || !s.price) return;
    addSale({ ...s, date: new Date(`${s.date}T12:00:00`).toISOString() });
    onDone();
  };

  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-2 gap-2">
        {(["venda", "reparo"] as const).map((k) => (
          <button key={k} onClick={() => set("kind", k)} className={`h-11 rounded-[6px] border text-[14px] ${s.kind === k ? "border-ink bg-card" : "border-line"}`}>
            {k === "venda" ? "Venda de aparelho" : "Reparo"}
          </button>
        ))}
      </div>
      {s.kind === "venda" && (
        <Field label="Puxar do estoque" hint="opcional">
          <Select defaultValue="" onChange={(e) => pick(e.target.value)}>
            <option value="">Selecione um produto</option>
            {db?.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.storage} · {p.color}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Descrição">
        <Input value={s.description} onChange={(e) => set("description", e.target.value)} placeholder={s.kind === "venda" ? "iPhone 15 128 GB" : "Troca de tela iPhone 13"} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor recebido (R$)">
          <Input type="number" value={s.price || ""} onChange={(e) => set("price", Number(e.target.value))} />
        </Field>
        <Field label="Custo (R$)">
          <Input type="number" value={s.cost || ""} onChange={(e) => set("cost", Number(e.target.value))} />
        </Field>
        <Field label="Pagamento">
          <Select value={s.payment} onChange={(e) => set("payment", e.target.value as PaymentMethod)}>
            {Object.entries(PAY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" value={s.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        {s.kind === "venda" && (
          <Field label="Aparelho na troca (R$)" hint="opcional">
            <Input type="number" value={s.tradeInValue ?? ""} onChange={(e) => set("tradeInValue", e.target.value ? Number(e.target.value) : undefined)} />
          </Field>
        )}
        <Field label="Cliente" hint="opcional">
          <Input value={s.customer} onChange={(e) => set("customer", e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-6">
        <Btn variant="ghost" onClick={onDone}>Cancelar</Btn>
        <Btn onClick={save} disabled={!s.description || !s.price}>Salvar</Btn>
      </div>
    </div>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const [e, setE] = useState<Omit<Expense, "id">>({ date: today(), description: "", category: "outros", value: 0 });
  const save = () => {
    if (!e.description || !e.value) return;
    addExpense({ ...e, date: new Date(`${e.date}T12:00:00`).toISOString() });
    onDone();
  };
  return (
    <div className="space-y-5 p-6">
      <Field label="Descrição">
        <Input value={e.description} onChange={(ev) => setE({ ...e, description: ev.target.value })} placeholder="Ex.: Conta de luz" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Valor (R$)">
          <Input type="number" value={e.value || ""} onChange={(ev) => setE({ ...e, value: Number(ev.target.value) })} />
        </Field>
        <Field label="Categoria">
          <Select value={e.category} onChange={(ev) => setE({ ...e, category: ev.target.value as Expense["category"] })}>
            {Object.entries(EXP_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-6">
        <Btn variant="ghost" onClick={onDone}>Cancelar</Btn>
        <Btn onClick={save} disabled={!e.description || !e.value}>Salvar</Btn>
      </div>
    </div>
  );
}
