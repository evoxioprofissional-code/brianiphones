/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { deleteLead, setLeadStatus, useDB } from "@/lib/store";
import { dateTime, money, relative } from "@/lib/format";
import { DEVICE_CONDITIONS } from "@/lib/site";
import type { Lead, LeadStatus, LeadType } from "@/lib/types";
import { Btn, Drawer, PageHead } from "@/components/admin/AdminShell";
import { LEAD_TYPE_LABEL, LeadTypeTag, STATUS_LABEL, StatusTag } from "@/components/admin/Tags";

const STATUSES: LeadStatus[] = ["novo", "em_conversa", "fechado", "perdido"];

export default function ContatosPage() {
  const db = useDB();
  const [type, setType] = useState<LeadType | "todos">("todos");
  const [status, setStatus] = useState<LeadStatus | "todos">("todos");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    let l = db?.leads ?? [];
    if (type !== "todos") l = l.filter((x) => x.type === type);
    if (status !== "todos") l = l.filter((x) => x.status === status);
    return l;
  }, [db, type, status]);

  if (!db) return null;
  const open = db.leads.find((l) => l.id === openId) ?? null;
  const counts = STATUSES.map((s) => db.leads.filter((l) => l.status === s).length);

  return (
    <>
      <PageHead eyebrow="Tudo que chegou pelo site" title="Contatos" />

      <div className="px-5 py-6 md:px-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STATUSES.map((s, i) => (
            <button
              key={s}
              onClick={() => setStatus(status === s ? "todos" : s)}
              className={`rounded-[8px] border p-4 text-left transition-colors ${status === s ? "border-ink bg-card" : "border-line bg-card hover:border-ink/30"}`}
            >
              <StatusTag status={s} />
              <p className="mt-3 text-[26px] font-bold leading-none tabular">{counts[i]}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {(["todos", "orcamento", "troca", "reparo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`h-9 rounded-full px-4 text-[13px] ${type === t ? "bg-ink text-paper" : "border border-line bg-card text-graphite"}`}
            >
              {t === "todos" ? "Todos" : LEAD_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[8px] border border-line bg-card">
          {list.map((l) => (
            <li key={l.id}>
              <button onClick={() => setOpenId(l.id)} className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-paper/60">
                <LeadTypeTag type={l.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">
                    {l.name ?? "Visitante do site"} {l.city ? <span className="font-normal text-muted">· {l.city}</span> : null}
                  </p>
                  <p className="truncate text-[13px] text-muted">{summary(l)}</p>
                </div>
                {l.trade?.photos.length ? (
                  <span className="hidden gap-1 md:flex">
                    {l.trade.photos.slice(0, 3).map((p, i) => (
                      <img key={i} src={p} alt="" className="h-9 w-9 rounded-[4px] object-cover" />
                    ))}
                  </span>
                ) : null}
                <StatusTag status={l.status} />
                <span className="hidden w-24 text-right text-[12px] text-muted sm:block">{relative(l.createdAt)}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="p-10 text-center text-muted">Nenhum contato nesse filtro.</li>}
        </ul>
        <p className="mt-4 text-[12px] leading-[1.6] text-faint">
          Cada vez que alguém clica pra enviar orçamento, troca ou reparo pelo WhatsApp, o pedido aparece aqui. A conversa em si
          continua no WhatsApp.
        </p>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `${LEAD_TYPE_LABEL[open.type]} · ${open.name ?? "Visitante"}` : ""}>
        {open && <LeadDetail lead={open} onDelete={() => (deleteLead(open.id), setOpenId(null))} />}
      </Drawer>
    </>
  );
}

function summary(l: Lead) {
  if (l.quote) return `${l.quote.productName} · ${money(l.quote.price)}`;
  if (l.trade) return `${l.trade.model} ${l.trade.storage} → ${l.trade.desired}`;
  if (l.repair) return `${l.repair.model} · ${l.repair.issues.join(", ")}`;
  return "";
}

function LeadDetail({ lead, onDelete }: { lead: Lead; onDelete: () => void }) {
  const rows: [string, string][] = [["Recebido em", dateTime(lead.createdAt)]];
  if (lead.city) rows.push(["Cidade", lead.city]);
  if (lead.quote) {
    rows.push(["Produto", lead.quote.productName], ["Valor no site", money(lead.quote.price)]);
  }
  if (lead.trade) {
    const t = lead.trade;
    rows.push(
      ["Aparelho do cliente", `${t.model} · ${t.storage}`],
      ["Cor", t.color || "—"],
      ["Bateria", t.battery === null ? "Não sabe" : `${t.battery}%`],
      ["Peças trocadas", t.replacedParts.length ? t.replacedParts.join(", ") : "Nenhuma"],
      ["Estado", DEVICE_CONDITIONS.find((c) => c.id === t.condition)?.label ?? t.condition],
      ["Quer levar", t.desired],
    );
  }
  if (lead.repair) {
    rows.push(["Aparelho", lead.repair.model], ["Problema", lead.repair.issues.join(", ")]);
    if (lead.repair.description) rows.push(["Detalhes", lead.repair.description]);
  }

  return (
    <div className="space-y-8 p-6">
      <dl className="font-mono text-[12px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6 border-b border-dashed border-line py-3">
            <dt className="uppercase tracking-[0.08em] text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {lead.trade?.photos.length ? (
        <div>
          <p className="text-[13px] font-medium text-graphite">Fotos enviadas</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {lead.trade.photos.map((p, i) => (
              <a key={i} href={p} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-[4px] bg-paper-2">
                <img src={p} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[13px] font-medium text-graphite">Situação</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setLeadStatus(lead.id, s)}
              className={`rounded-[6px] border px-4 py-3 text-left text-[14px] ${lead.status === s ? "border-ink bg-card" : "border-line hover:border-ink/30"}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-6">
        <Btn variant="danger" onClick={() => confirm("Excluir esse contato?") && onDelete()}>
          Excluir contato
        </Btn>
      </div>
    </div>
  );
}
