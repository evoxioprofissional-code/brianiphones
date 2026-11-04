import type { LeadStatus, LeadType } from "@/lib/types";

export const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  orcamento: "Orçamento",
  troca: "Troca",
  reparo: "Reparo",
  contato: "Contato",
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  fechado: "Fechado",
  perdido: "Perdido",
};

export function LeadTypeTag({ type }: { type: LeadType }) {
  return (
    <span className="label inline-flex w-[84px] shrink-0 justify-center rounded-full border border-line py-1 text-[9px] text-graphite">
      {LEAD_TYPE_LABEL[type]}
    </span>
  );
}

const STATUS_STYLE: Record<LeadStatus, { dot: string; text: string }> = {
  novo: { dot: "bg-steel", text: "text-steel" },
  em_conversa: { dot: "bg-warn", text: "text-warn" },
  fechado: { dot: "bg-ok", text: "text-ok" },
  perdido: { dot: "bg-faint", text: "text-muted" },
};

export function StatusTag({ status }: { status: LeadStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
