"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Box, Check, Clock, Copy, ExternalLink, MapPin, PackageCheck, Printer, Send, Store, Tag, Truck } from "lucide-react";
import { setOrderStatus, setTracking, useDB } from "@/lib/store";
import { dateTime, money, relative } from "@/lib/format";
import { hoursSince, nextAction, SHIP_LABEL, trackingUrl } from "@/lib/admin";
import type { Order, OrderStatus } from "@/lib/types";
import {
  AButton,
  ALink,
  Badge,
  EmptyState,
  FormField,
  Kpi,
  Modal,
  ORDER_LABEL,
  ORDER_TONE,
  PageBody,
  PageHeader,
  Panel,
  Segmented,
  SelectInput,
  Table,
  Td,
  TextInput,
  Th,
  TONE_HEX,
} from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const COLUMNS: { status: OrderStatus; title: string; hint: string }[] = [
  { status: "pago", title: "A separar", hint: "Pagos, esperando separação" },
  { status: "separando", title: "Separando", hint: "Conferir aparelho e acessórios" },
  { status: "embalado", title: "Pronto para envio", hint: "Embalado, aguardando postagem/retirada" },
  { status: "enviado", title: "Em trânsito", hint: "Postados ou em rota" },
  { status: "entregue", title: "Entregues", hint: "Últimos 7 dias" },
];

type View = "quadro" | "rastreios" | "retiradas";

export default function LogisticaPage() {
  const db = useDB();
  const [view, setView] = useState<View>("quadro");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<OrderStatus | null>(null);
  const [track, setTrack] = useState<Order | null>(null);
  const [copied, setCopied] = useState("");

  const cols = useMemo(() => {
    if (!db) return {} as Record<OrderStatus, Order[]>;
    const out = {} as Record<OrderStatus, Order[]>;
    COLUMNS.forEach((c) => {
      out[c.status] = db.orders
        .filter((o) => o.status === c.status && (c.status !== "entregue" || hoursSince(lastEvent(o)) < 24 * 7))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
    return out;
  }, [db]);

  if (!db) return null;
  const ship = db.settings.shipping;
  const handling = (ship?.handlingDays ?? 1) * 24;
  const late = db.orders.filter((o) => (o.status === "pago" || o.status === "separando") && hoursSince(o.createdAt) > handling);
  const pickups = db.orders.filter((o) => o.shipping.method === "retirada" && ["pago", "separando", "embalado"].includes(o.status));
  const shipped = db.orders.filter((o) => o.tracking?.code);

  const move = (o: Order, to: OrderStatus) => {
    if (o.status === to) return;
    if (to === "enviado" && o.shipping.method !== "local" && o.shipping.method !== "retirada" && !o.tracking?.code) {
      setTrack(o);
      return;
    }
    setOrderStatus(o.id, to);
  };

  const copy = (t: string) => {
    navigator.clipboard?.writeText(t);
    setCopied(t);
    setTimeout(() => setCopied(""), 1400);
  };

  const readyIds = (cols.embalado ?? []).filter((o) => o.shipping.method !== "retirada").map((o) => o.id);

  return (
    <>
      <PageHeader
        title="Logística"
        subtitle="Separação, embalagem, envio e retirada"
        actions={
          <>
            <ALink href={`/admin/imprimir/pedidos?ids=${[...(cols.pago ?? []), ...(cols.separando ?? [])].map((o) => o.id).join(",")}`}>
              <Printer size={16} /> Lista de separação
            </ALink>
            <ALink href={`/admin/imprimir/etiquetas?ids=${readyIds.join(",")}`} variant="primary">
              <Tag size={16} /> Etiquetas dos prontos ({readyIds.length})
            </ALink>
          </>
        }
      />
      <PageBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <Kpi label="A separar" value={cols.pago?.length ?? 0} icon={<Box size={18} />} tone="blue" hint="pagos" />
          <Kpi label="Em separação" value={cols.separando?.length ?? 0} icon={<PackageCheck size={18} />} tone="purple" hint="na bancada" />
          <Kpi label="Prontos" value={cols.embalado?.length ?? 0} icon={<Tag size={18} />} tone="indigo" hint="aguardando saída" />
          <Kpi label="Em trânsito" value={cols.enviado?.length ?? 0} icon={<Truck size={18} />} tone="teal" hint="com rastreio" />
          <Kpi label="Fora do prazo de postagem" value={late.length} icon={<Clock size={18} />} tone={late.length ? "red" : "green"} hint={`prazo: ${ship?.handlingDays ?? 1} dia(s) útil(eis)`} />
        </div>

        <Segmented
          items={[
            { value: "quadro", label: "Quadro de envios" },
            { value: "rastreios", label: "Rastreios", count: shipped.length },
            { value: "retiradas", label: "Retiradas na loja", count: pickups.length },
          ]}
          value={view}
          onChange={setView}
          className="bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
        />

        {view === "quadro" && (
          <>
            <p className="text-[12.5px] text-muted">Arraste o card para a próxima coluna, ou use o botão do card.</p>
            <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-4 md:-mx-8 md:px-8">
              {COLUMNS.map((c) => {
                const list = cols[c.status] ?? [];
                return (
                  <div
                    key={c.status}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOver(c.status);
                    }}
                    onDragLeave={() => setOver(null)}
                    onDrop={() => {
                      const o = db.orders.find((x) => x.id === drag);
                      if (o) move(o, c.status);
                      setDrag(null);
                      setOver(null);
                    }}
                    className={cn("flex w-[290px] shrink-0 flex-col rounded-3xl bg-[#ebebef] p-2.5 transition-colors", over === c.status && "bg-[#dfe9f7] ring-2 ring-[#0071e3]/40")}
                  >
                    <div className="flex items-center gap-2 px-2 pb-2.5 pt-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: TONE_HEX[ORDER_TONE[c.status]] }} />
                      <p className="text-[14px] font-semibold">{c.title}</p>
                      <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[12px] font-medium tabular">{list.length}</span>
                    </div>
                    <p className="-mt-1.5 px-2 pb-2.5 text-[11.5px] text-muted">{c.hint}</p>
                    <div className="flex min-h-[120px] flex-col gap-2">
                      {list.map((o) => (
                        <OrderCard
                          key={o.id}
                          o={o}
                          late={(o.status === "pago" || o.status === "separando") && hoursSince(o.createdAt) > handling}
                          dragging={drag === o.id}
                          onDragStart={() => setDrag(o.id)}
                          onDragEnd={() => (setDrag(null), setOver(null))}
                          onNext={() => {
                            const n = nextAction(o);
                            if (n) move(o, n.status);
                          }}
                        />
                      ))}
                      {list.length === 0 && <p className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-black/10 py-8 text-[12.5px] text-faint">Vazio</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "rastreios" && (
          <Panel padded={false}>
            {shipped.length === 0 ? (
              <EmptyState icon={<Truck size={24} />} title="Nenhum envio com rastreio" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Pedido</Th>
                    <Th>Cliente / destino</Th>
                    <Th>Transportadora</Th>
                    <Th>Código</Th>
                    <Th>Enviado</Th>
                    <Th>Situação</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {shipped.map((o) => {
                    const sentAt = o.timeline?.find((e) => e.status === "enviado")?.at;
                    return (
                      <tr key={o.id} className="group hover:bg-[#fafafa]">
                        <Td>
                          <Link href={`/admin/pedidos/${o.id}`} className="font-semibold hover:text-[#0071e3]">
                            #{o.number}
                          </Link>
                        </Td>
                        <Td>
                          <p className="font-medium">{o.customer.name}</p>
                          <p className="text-[12px] text-muted">
                            {o.shipping.address?.city}/{o.shipping.address?.uf}
                          </p>
                        </Td>
                        <Td>{o.tracking?.carrier}</Td>
                        <Td>
                          <button onClick={() => copy(o.tracking!.code)} className="inline-flex items-center gap-1.5 font-mono text-[13px] hover:text-[#0071e3]">
                            {o.tracking?.code} {copied === o.tracking?.code ? <Check size={13} /> : <Copy size={13} className="text-faint" />}
                          </button>
                        </Td>
                        <Td className="text-muted">{sentAt ? relative(sentAt) : "—"}</Td>
                        <Td>
                          <Badge tone={ORDER_TONE[o.status]} dot>
                            {ORDER_LABEL[o.status]}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <a href={trackingUrl(o.tracking!.code)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[#0071e3] hover:bg-[#e8f2fd]">
                            Rastrear <ExternalLink size={13} />
                          </a>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Panel>
        )}

        {view === "retiradas" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pickups.length === 0 && (
              <Panel className="md:col-span-2 xl:col-span-3">
                <EmptyState icon={<Store size={24} />} title="Nenhuma retirada pendente" />
              </Panel>
            )}
            {pickups.map((o) => (
              <Panel key={o.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/admin/pedidos/${o.id}`} className="text-[15px] font-semibold hover:text-[#0071e3]">
                      #{o.number} · {o.customer.name}
                    </Link>
                    <p className="text-[12.5px] text-muted">{o.customer.phone}</p>
                  </div>
                  <Badge tone={ORDER_TONE[o.status]} dot>
                    {o.status === "embalado" ? "Pronto p/ retirar" : ORDER_LABEL[o.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-[13px] text-[#424245]">{o.items.map((i) => `${i.qty}x ${i.name} ${i.detail}`).join(", ")}</p>
                <div className="mt-4 flex gap-2">
                  {o.status === "embalado" ? (
                    <AButton size="sm" variant="accent" onClick={() => setOrderStatus(o.id, "entregue", "Cliente retirou na loja")}>
                      <Check size={14} /> Cliente retirou
                    </AButton>
                  ) : (
                    <AButton size="sm" variant="primary" onClick={() => setOrderStatus(o.id, o.status === "pago" ? "separando" : "embalado")}>
                      {o.status === "pago" ? "Iniciar separação" : "Pronto para retirada"}
                    </AButton>
                  )}
                  <ALink size="sm" href={`/admin/imprimir/pedidos?ids=${o.id}`}>
                    <Printer size={14} /> Pedido
                  </ALink>
                </div>
              </Panel>
            ))}
          </div>
        )}

        <Panel title="Origem dos envios" subtitle="Usado na etiqueta e no cálculo de frete" actions={<ALink size="sm" variant="ghost" href="/admin/configuracoes?tab=envio">Editar</ALink>}>
          <div className="flex flex-wrap items-start gap-x-10 gap-y-3 text-[13.5px]">
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-muted" />
              <span>
                {ship?.senderName}
                <br />
                {ship?.originStreet}, {ship?.originNumber} · {ship?.originDistrict}
                <br />
                {ship?.originCity}/{ship?.originUf} · CEP {ship?.originCep}
              </span>
            </p>
            <p className="text-muted">
              Entrega em Itatiba: <strong className="text-ink">{money(ship?.localFee ?? 0)}</strong>, grátis acima de {money(ship?.localFreeAbove ?? 0)}
              <br />
              Transportadoras: {ship?.carriers.join(", ")}
            </p>
          </div>
        </Panel>
      </PageBody>

      {track && (
        <TrackingModal
          order={track}
          carriers={ship?.carriers ?? ["Correios SEDEX"]}
          onClose={() => setTrack(null)}
          onSave={(carrier, code) => {
            setTracking(track.id, carrier, code);
            setTrack(null);
          }}
        />
      )}
    </>
  );
}

function lastEvent(o: Order) {
  return o.timeline?.[o.timeline.length - 1]?.at ?? o.createdAt;
}

function OrderCard({
  o,
  late,
  dragging,
  onDragStart,
  onDragEnd,
  onNext,
}: {
  o: Order;
  late: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onNext: () => void;
}) {
  const next = nextAction(o);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab rounded-2xl bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-[box-shadow,opacity,transform] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.25)] active:cursor-grabbing",
        dragging && "rotate-[1.5deg] opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link href={`/admin/pedidos/${o.id}`} className="text-[14px] font-semibold hover:text-[#0071e3]">
          #{o.number}
        </Link>
        <span className="flex items-center gap-1.5">
          {late && <Badge tone="red">Atrasado</Badge>}
          {o.printed?.label && <Tag size={13} className="text-faint" aria-label="Etiqueta impressa" />}
        </span>
      </div>
      <p className="mt-1 truncate text-[13px] font-medium">{o.customer.name}</p>
      <p className="truncate text-[12px] text-muted">{o.items.map((i) => i.name).join(", ")}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone={o.shipping.method === "retirada" ? "purple" : o.shipping.method === "local" ? "teal" : "gray"}>{SHIP_LABEL[o.shipping.method]}</Badge>
        {o.shipping.address ? <span className="text-[11.5px] text-muted">{o.shipping.address.city}</span> : null}
        <span className="ml-auto text-[11.5px] text-faint">{relative(o.createdAt)}</span>
      </div>
      {o.tracking?.code ? <p className="mt-2 font-mono text-[11.5px] text-muted">{o.tracking.code}</p> : null}
      {next ? (
        <button onClick={onNext} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#f5f5f7] text-[12.5px] font-medium text-[#0071e3] transition-colors hover:bg-[#e8f2fd]">
          {next.status === "enviado" ? <Send size={13} /> : <Check size={13} />} {next.label}
        </button>
      ) : null}
      <p className="sr-only">Criado em {dateTime(o.createdAt)}</p>
    </div>
  );
}

function TrackingModal({ order, carriers, onClose, onSave }: { order: Order; carriers: string[]; onClose: () => void; onSave: (c: string, code: string) => void }) {
  const [carrier, setCarrier] = useState((order.shipping.method === "pac" ? carriers.find((c) => /pac/i.test(c)) : carriers.find((c) => /sedex/i.test(c))) ?? carriers[0]);
  const [code, setCode] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title={`Enviar pedido #${order.number}`}
      footer={
        <>
          <AButton onClick={onClose}>Cancelar</AButton>
          <AButton variant="accent" disabled={!code.trim()} onClick={() => onSave(carrier, code.trim().toUpperCase())}>
            <Send size={15} /> Marcar como enviado
          </AButton>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Transportadora">
          <SelectInput value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {carriers.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Código de rastreio">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="QB123456789BR" className="font-mono uppercase" autoFocus />
        </FormField>
      </div>
    </Modal>
  );
}
