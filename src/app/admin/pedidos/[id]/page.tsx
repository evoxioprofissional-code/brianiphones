"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  PackageOpen,
  Phone,
  Send,
  StickyNote,
  Tag,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { addOrderEvent, ORDER_FLOW, setOrderStatus, setTracking, updateOrder, useDB } from "@/lib/store";
import { dateTime, money, moneyCents } from "@/lib/format";
import { addressLines, nextAction, PAY_LABEL, trackingUrl } from "@/lib/admin";
import { waLink } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/lib/types";
import { AButton, ALink, Badge, EmptyState, FormField, Modal, ORDER_LABEL, OrderBadge, PageBody, PageHeader, Panel, SelectInput, TextArea, TextInput } from "@/components/admin/kit";
import { ProductMedia } from "@/components/site/ProductMedia";
import { cn } from "@/lib/utils";

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const router = useRouter();
  const [trackOpen, setTrackOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState("");

  if (!db) return null;
  const o = db.orders.find((x) => x.id === id);
  if (!o) {
    return (
      <PageBody className="pt-10">
        <EmptyState icon={<PackageOpen size={24} />} title="Pedido não encontrado" action={<ALink href="/admin/pedidos">Voltar aos pedidos</ALink>} />
      </PageBody>
    );
  }

  const next = nextAction(o);
  const phone = o.customer.phone.replace(/\D/g, "");
  const ship = db.settings.shipping;
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };
  const doNext = () => {
    if (!next) return;
    if (next.status === "enviado") setTrackOpen(true);
    else setOrderStatus(o.id, next.status);
  };

  const flowIdx = o.status === "cancelado" ? -1 : ORDER_FLOW.indexOf(o.status);
  const steps = ORDER_FLOW.filter((s) => !(o.shipping.method === "retirada" || o.shipping.method === "local") || s !== "enviado");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/pedidos", label: "Pedidos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Pedido #{o.number} <OrderBadge status={o.status} />
          </span>
        }
        subtitle={`Feito em ${dateTime(o.createdAt)} · ${o.items.reduce((a, i) => a + i.qty, 0)} ${o.items.length > 1 ? "itens" : "item"} · ${money(o.total)}`}
        actions={
          <>
            <ALink href={`/admin/imprimir/pedidos?ids=${o.id}`}>
              <FileText size={16} /> Imprimir pedido
            </ALink>
            {o.shipping.method !== "retirada" ? (
              <ALink href={`/admin/imprimir/etiquetas?ids=${o.id}`}>
                <Tag size={16} /> Etiqueta
              </ALink>
            ) : null}
            <div className="relative">
              <AButton size="icon" onClick={() => setMore((v) => !v)} aria-label="Mais ações">
                <MoreHorizontal size={17} />
              </AButton>
              {more && (
                <div className="absolute right-0 top-11 z-30 w-[240px] rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)]">
                  <p className="px-3 pb-1 pt-2 text-[11.5px] font-medium text-faint">Mudar situação para</p>
                  {(["aguardando_pagamento", ...ORDER_FLOW.slice(1)] as OrderStatus[]).map((s) => (
                    <button
                      key={s}
                      disabled={s === o.status}
                      onClick={() => {
                        setMore(false);
                        if (s === "enviado" && !o.tracking?.code) setTrackOpen(true);
                        else setOrderStatus(o.id, s);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-[#f5f5f7] disabled:opacity-40"
                    >
                      {ORDER_LABEL[s]}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-black/[0.06]" />
                  <button
                    disabled={o.status === "cancelado"}
                    onClick={() => {
                      setMore(false);
                      if (confirm("Cancelar o pedido? Os produtos voltam para o estoque.")) setOrderStatus(o.id, "cancelado");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] text-[#d70015] hover:bg-[#fff5f5] disabled:opacity-40"
                  >
                    <XCircle size={15} /> Cancelar pedido
                  </button>
                </div>
              )}
            </div>
            {next ? (
              <AButton variant="accent" onClick={doNext}>
                {next.status === "enviado" ? <Send size={16} /> : <Check size={16} />} {next.label}
              </AButton>
            ) : null}
          </>
        }
      />

      <PageBody className="space-y-5">
        {/* Andamento */}
        <Panel>
          {o.status === "cancelado" ? (
            <div className="flex items-center gap-3 text-[#c40014]">
              <XCircle size={20} />
              <p className="text-[14px] font-medium">Pedido cancelado. Os produtos voltaram para o estoque.</p>
            </div>
          ) : (
            <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
              {steps.map((s) => {
                const i = ORDER_FLOW.indexOf(s);
                const done = i <= flowIdx;
                const current = i === flowIdx;
                const ev = [...(o.timeline ?? [])].reverse().find((e) => e.status === s);
                return (
                  <li key={s} className="min-w-0">
                    <div className={cn("h-1.5 rounded-full", done ? "bg-[#0071e3]" : "bg-[#e8e8ed]")} />
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-white", done ? "bg-[#0071e3]" : "bg-[#d2d2d7]")}>
                        {done ? <Check size={12} strokeWidth={3} /> : null}
                      </span>
                      <span className={cn("truncate text-[13px]", current ? "font-semibold" : done ? "text-ink" : "text-muted")}>{ORDER_LABEL[s]}</span>
                    </div>
                    <p className="mt-0.5 hidden truncate pl-[26px] text-[11.5px] text-faint md:block">{ev ? dateTime(ev.at) : " "}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            {/* Itens */}
            <Panel title="Itens do pedido" padded={false}>
              <ul className="divide-y divide-black/[0.05]">
                {o.items.map((it) => {
                  const p = db.products.find((x) => x.id === it.productId);
                  return (
                    <li key={it.productId} className="flex items-center gap-4 px-5 py-4 md:px-6">
                      <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f5f5f7] p-2">{p ? <ProductMedia p={p} /> : null}</span>
                      <div className="min-w-0 flex-1">
                        {p ? (
                          <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:text-[#0071e3]">
                            {it.name}
                          </Link>
                        ) : (
                          <p className="font-medium">{it.name}</p>
                        )}
                        <p className="text-[13px] text-muted">{it.detail}</p>
                        {p?.sku ? <p className="mt-0.5 font-mono text-[11.5px] text-faint">SKU {p.sku}</p> : null}
                      </div>
                      <p className="text-[13.5px] text-muted tabular">
                        {it.qty} × {money(it.price)}
                      </p>
                      <p className="w-24 text-right font-semibold tabular">{money(it.price * it.qty)}</p>
                    </li>
                  );
                })}
              </ul>
              <dl className="space-y-2 border-t border-black/[0.05] px-5 py-4 text-[14px] md:px-6">
                <Row k="Subtotal" v={money(o.subtotal)} />
                {o.discount ? <Row k="Desconto" v={`− ${money(o.discount)}`} /> : null}
                <Row k={`Frete · ${o.shipping.label}`} v={o.shipping.price ? money(o.shipping.price) : "Grátis"} />
                <div className="flex items-baseline justify-between border-t border-black/[0.05] pt-3">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-[20px] font-semibold tabular">{money(o.total)}</dd>
                </div>
              </dl>
            </Panel>

            {/* Linha do tempo */}
            <Panel title="Histórico" subtitle="Tudo que aconteceu com o pedido">
              <form
                className="mb-5 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  addOrderEvent(o.id, note.trim());
                  setNote("");
                }}
              >
                <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicionar anotação ao histórico (ex.: cliente pediu pra entregar à tarde)" />
                <AButton variant="primary" type="submit" disabled={!note.trim()}>
                  Adicionar
                </AButton>
              </form>
              <ol className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-black/[0.08]">
                {[...(o.timeline ?? [])].reverse().map((e, i) => (
                  <li key={i} className="relative">
                    <span
                      className={cn(
                        "absolute -left-6 top-1 h-[15px] w-[15px] rounded-full border-[3px] border-white",
                        i === 0 ? "bg-[#0071e3] shadow-[0_0_0_3px_rgba(0,113,227,0.18)]" : e.status ? "bg-[#86868b]" : "bg-[#d2d2d7]",
                      )}
                    />
                    <p className="text-[14px] font-medium">{e.text}</p>
                    <p className="text-[12.5px] text-muted">
                      {dateTime(e.at)}
                      {e.status ? ` · ${ORDER_LABEL[e.status]}` : " · anotação"}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          <div className="space-y-5">
            {/* Cliente */}
            <Panel
              title="Cliente"
              actions={
                <ALink href={`/admin/clientes?c=${encodeURIComponent(o.customer.email)}`} size="sm" variant="ghost">
                  Ver perfil
                </ALink>
              }
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#e8f2fd] to-[#d6e8fc] text-[15px] font-semibold text-[#0066cc]">
                  {o.customer.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{o.customer.name}</p>
                  <p className="text-[12.5px] text-muted">
                    {db.orders.filter((x) => x.customer.email === o.customer.email).length} pedido(s) na loja
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-[13.5px]">
                <Info icon={<Mail size={15} />} text={o.customer.email} onCopy={() => copy("email", o.customer.email)} copied={copied === "email"} />
                <Info icon={<Phone size={15} />} text={o.customer.phone} onCopy={() => copy("phone", o.customer.phone)} copied={copied === "phone"} />
                <Info icon={<User size={15} />} text={`CPF ${o.customer.cpf}`} onCopy={() => copy("cpf", o.customer.cpf)} copied={copied === "cpf"} />
              </ul>
              {phone.length >= 10 ? (
                <a
                  href={waLink(`55${phone}`, `Olá, ${o.customer.name.split(" ")[0]}! Aqui é da Brian iPhones, sobre o seu pedido #${o.number}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-[#25d366] text-[14px] font-medium text-white hover:brightness-105"
                >
                  <MessageCircle size={16} /> Chamar no WhatsApp
                </a>
              ) : null}
            </Panel>

            {/* Entrega */}
            <Panel title="Entrega" actions={<Badge tone="gray">{o.shipping.label}</Badge>}>
              <div className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1 text-[13.5px] leading-[1.55]">
                  {o.shipping.address ? (
                    <>
                      {addressLines(o).map((l) => (
                        <p key={l}>{l}</p>
                      ))}
                      <button onClick={() => copy("addr", addressLines(o).join(" - "))} className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] text-[#0071e3] hover:underline">
                        {copied === "addr" ? <Check size={13} /> : <Copy size={13} />} {copied === "addr" ? "Copiado" : "Copiar endereço"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Retirada na loja</p>
                      <p className="text-muted">{db.settings.address}</p>
                      <p className="text-muted">{ship?.pickupText}</p>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 flex items-center gap-3 text-[13px] text-muted">
                <Truck size={16} className="shrink-0" /> Prazo informado ao cliente: {o.shipping.days}
              </p>

              {o.shipping.method !== "retirada" && o.shipping.method !== "local" ? (
                <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4">
                  <p className="text-[12px] text-muted">Rastreio</p>
                  {o.tracking?.code ? (
                    <>
                      <p className="mt-1 font-mono text-[15px] font-semibold">{o.tracking.code}</p>
                      <p className="text-[12.5px] text-muted">{o.tracking.carrier}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a href={trackingUrl(o.tracking.code)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
                          <ExternalLink size={13} /> Rastrear
                        </a>
                        <button onClick={() => setTrackOpen(true)} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-medium text-[#0071e3] hover:bg-white">
                          Editar
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => setTrackOpen(true)} className="mt-1 text-[13.5px] font-medium text-[#0071e3] hover:underline">
                      + Adicionar código de rastreio
                    </button>
                  )}
                </div>
              ) : null}
            </Panel>

            {/* Pagamento */}
            <Panel title="Pagamento" actions={<Badge tone={o.status === "aguardando_pagamento" ? "orange" : o.status === "cancelado" ? "red" : "green"} dot>{o.status === "aguardando_pagamento" ? "Pendente" : o.status === "cancelado" ? "Cancelado" : "Aprovado"}</Badge>}>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f5f5f7] text-muted">
                  <CreditCard size={18} />
                </span>
                <div className="text-[13.5px]">
                  <p className="font-medium">{PAY_LABEL[o.payment]} · Mercado Pago</p>
                  <p className="text-muted tabular">
                    {o.installments > 1 ? `${o.installments}x de ${moneyCents(Math.ceil((o.total / o.installments) * 100) / 100)}` : "À vista"}
                  </p>
                </div>
              </div>
            </Panel>

            {/* Observação interna */}
            <InternalNote order={o} />

            <Panel title="Impressões">
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center justify-between">
                  <span className="text-muted">Pedido / separação</span>
                  <span>{o.printed?.slip ? dateTime(o.printed.slip) : "Não impresso"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted">Etiqueta de envio</span>
                  <span>{o.printed?.label ? dateTime(o.printed.label) : "Não impressa"}</span>
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      </PageBody>

      <TrackingModal
        open={trackOpen}
        onClose={() => setTrackOpen(false)}
        order={o}
        carriers={ship?.carriers ?? ["Correios SEDEX", "Correios PAC"]}
        onSave={(carrier, code) => {
          setTracking(o.id, carrier, code);
          setTrackOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>
  );
}

function Info({ icon, text, onCopy, copied }: { icon: React.ReactNode; text: string; onCopy: () => void; copied: boolean }) {
  return (
    <li className="group flex items-center gap-3">
      <span className="text-muted">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <button onClick={onCopy} className="grid h-7 w-7 place-items-center rounded-full text-muted opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100" aria-label="Copiar">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </li>
  );
}

function InternalNote({ order }: { order: Order }) {
  const [text, setText] = useState(order.notes ?? "");
  const [saved, setSaved] = useState(false);
  const dirty = text !== (order.notes ?? "");
  return (
    <Panel title="Observação interna" subtitle="Só a equipe vê" actions={<StickyNote size={16} className="text-faint" />}>
      <TextArea value={text} onChange={(e) => (setText(e.target.value), setSaved(false))} placeholder="Ex.: embalar com película extra, cliente vai buscar sábado…" />
      <div className="mt-2 flex items-center justify-end gap-3">
        {saved && <span className="text-[12.5px] text-[#1f8a3e]">Salvo</span>}
        <AButton size="sm" variant="primary" disabled={!dirty} onClick={() => (updateOrder(order.id, { notes: text }), setSaved(true))}>
          Salvar
        </AButton>
      </div>
    </Panel>
  );
}

function TrackingModal({
  open,
  onClose,
  order,
  carriers,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
  carriers: string[];
  onSave: (carrier: string, code: string) => void;
}) {
  const [carrier, setCarrier] = useState(order.tracking?.carrier ?? (order.shipping.method === "pac" ? carriers.find((c) => /pac/i.test(c)) : carriers.find((c) => /sedex/i.test(c))) ?? carriers[0] ?? "");
  const [code, setCode] = useState(order.tracking?.code ?? "");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Informar envio"
      footer={
        <>
          <AButton onClick={onClose}>Cancelar</AButton>
          <AButton variant="accent" disabled={!code.trim()} onClick={() => onSave(carrier, code.trim().toUpperCase())}>
            <Send size={15} /> Salvar e marcar como enviado
          </AButton>
        </>
      }
    >
      <p className="text-[14px] text-muted">O pedido #{order.number} passa para “Enviado” e o código fica salvo no histórico.</p>
      <div className="mt-5 space-y-4">
        <FormField label="Transportadora">
          <SelectInput value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {carriers.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectInput>
        </FormField>
        <FormField label="Código de rastreio" hint="Ex.: QB123456789BR">
          <TextInput value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase" autoFocus />
        </FormField>
      </div>
    </Modal>
  );
}
