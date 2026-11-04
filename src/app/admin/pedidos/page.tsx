"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ChevronDown, Download, FileText, Inbox, Printer, Tag, X } from "lucide-react";
import { bulkSetOrderStatus, useDB } from "@/lib/store";
import { dateTime, money, relative } from "@/lib/format";
import { downloadCsv, PAY_LABEL, SHIP_LABEL, sinceDays } from "@/lib/admin";
import type { Order, OrderStatus } from "@/lib/types";
import {
  AButton,
  Checkbox,
  EmptyState,
  ORDER_LABEL,
  OrderBadge,
  PageBody,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  SelectInput,
  Table,
  Td,
  Th,
} from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const TABS: (OrderStatus | "todos")[] = ["todos", "aguardando_pagamento", "pago", "separando", "embalado", "enviado", "entregue", "cancelado"];
const SHORT: Record<string, string> = {
  todos: "Todos",
  aguardando_pagamento: "Aguardando",
  pago: "Pagos",
  separando: "Separando",
  embalado: "Prontos",
  enviado: "Enviados",
  entregue: "Entregues",
  cancelado: "Cancelados",
};

export default function PedidosPage() {
  return (
    <Suspense fallback={null}>
      <Pedidos />
    </Suspense>
  );
}

function Pedidos() {
  const db = useDB();
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<OrderStatus | "todos">((params.get("status") as OrderStatus) || "todos");
  const [q, setQ] = useState("");
  const [ship, setShip] = useState("");
  const [pay, setPay] = useState("");
  const [period, setPeriod] = useState("0");
  const [sel, setSel] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);

  const list = useMemo(() => {
    let l = db?.orders ?? [];
    if (status !== "todos") l = l.filter((o) => o.status === status);
    if (ship) l = l.filter((o) => o.shipping.method === ship);
    if (pay) l = l.filter((o) => o.payment === pay);
    if (period !== "0") {
      const since = sinceDays(Number(period));
      l = l.filter((o) => new Date(o.createdAt).getTime() >= since);
    }
    const t = q.trim().toLowerCase().replace(/^#/, "");
    if (t) l = l.filter((o) => `${o.number} ${o.customer.name} ${o.customer.email} ${o.customer.cpf} ${o.tracking?.code ?? ""} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(t));
    return l;
  }, [db, status, ship, pay, period, q]);

  if (!db) return null;

  const count = (s: OrderStatus | "todos") => (s === "todos" ? db.orders.length : db.orders.filter((o) => o.status === s).length);
  const allSel = list.length > 0 && list.every((o) => sel.includes(o.id));
  const someSel = sel.length > 0 && !allSel;
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const exportCsv = (orders: Order[]) =>
    downloadCsv(`pedidos-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Pedido", "Data", "Situação", "Cliente", "E-mail", "Telefone", "CPF", "Itens", "Entrega", "Rastreio", "Pagamento", "Parcelas", "Subtotal", "Frete", "Total", "Endereço"],
      ...orders.map((o) => [
        o.number,
        dateTime(o.createdAt),
        ORDER_LABEL[o.status],
        o.customer.name,
        o.customer.email,
        o.customer.phone,
        o.customer.cpf,
        o.items.map((i) => `${i.qty}x ${i.name} ${i.detail}`).join(" | "),
        o.shipping.label,
        o.tracking?.code ?? "",
        PAY_LABEL[o.payment],
        o.installments,
        o.subtotal,
        o.shipping.price,
        o.total,
        o.shipping.address ? `${o.shipping.address.street}, ${o.shipping.address.number} ${o.shipping.address.complement} - ${o.shipping.address.district} - ${o.shipping.address.city}/${o.shipping.address.uf} - ${o.shipping.address.cep}` : "Retirada",
      ]),
    ]);

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle={`${db.orders.length} pedidos na loja online`}
        actions={
          <>
            <AButton onClick={() => exportCsv(list)}>
              <Download size={16} /> Exportar
            </AButton>
            <AButton variant="primary" onClick={() => router.push(`/admin/imprimir/pedidos?ids=${list.filter((o) => o.status === "pago" || o.status === "separando").map((o) => o.id).join(",")}`)}>
              <Printer size={16} /> Imprimir lista de separação
            </AButton>
          </>
        }
      />
      <PageBody className="space-y-4">
        <Segmented items={TABS.map((t) => ({ value: t, label: SHORT[t], count: count(t) }))} value={status} onChange={(v) => (setStatus(v), setSel([]))} />

        <Panel padded={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.05] p-3 md:p-4">
            <SearchInput value={q} onChange={setQ} placeholder="Nº do pedido, cliente, CPF, rastreio, produto…" className="min-w-[240px] flex-1" />
            <SelectInput value={ship} onChange={(e) => setShip(e.target.value)} className="w-[150px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="">Toda entrega</option>
              {Object.entries(SHIP_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectInput>
            <SelectInput value={pay} onChange={(e) => setPay(e.target.value)} className="w-[150px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="">Todo pagamento</option>
              {Object.entries(PAY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectInput>
            <SelectInput value={period} onChange={(e) => setPeriod(e.target.value)} className="w-[150px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="0">Qualquer data</option>
              <option value="1">Hoje</option>
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
            </SelectInput>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<Inbox size={24} />} title="Nenhum pedido aqui" text="Tente outro filtro ou limpe a busca." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-10">
                    <Checkbox checked={allSel} indeterminate={someSel} onChange={() => setSel(allSel ? [] : list.map((o) => o.id))} label="Selecionar todos" />
                  </Th>
                  <Th>Pedido</Th>
                  <Th>Cliente</Th>
                  <Th className="hidden xl:table-cell">Itens</Th>
                  <Th>Entrega</Th>
                  <Th className="hidden lg:table-cell">Pagamento</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Situação</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/admin/pedidos/${o.id}`)}
                    className={cn("group cursor-pointer transition-colors hover:bg-[#fafafa]", sel.includes(o.id) && "bg-[#f2f7fe] hover:bg-[#eaf2fd]")}
                  >
                    <Td>
                      <Checkbox checked={sel.includes(o.id)} onChange={() => toggle(o.id)} label={`Selecionar pedido ${o.number}`} />
                    </Td>
                    <Td>
                      <p className="font-semibold tabular">#{o.number}</p>
                      <p className="text-[12px] text-muted">{relative(o.createdAt)}</p>
                    </Td>
                    <Td>
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-[12px] text-muted">{o.shipping.address ? `${o.shipping.address.city}/${o.shipping.address.uf}` : "Retira na loja"}</p>
                    </Td>
                    <Td className="hidden max-w-[240px] xl:table-cell">
                      <p className="truncate text-[#424245]">{o.items.map((i) => `${i.qty > 1 ? `${i.qty}x ` : ""}${i.name}`).join(", ")}</p>
                    </Td>
                    <Td>
                      <p className="text-[#424245]">{SHIP_LABEL[o.shipping.method]}</p>
                      {o.tracking?.code ? <p className="font-mono text-[11.5px] text-muted">{o.tracking.code}</p> : null}
                    </Td>
                    <Td className="hidden lg:table-cell">
                      <p className="text-[#424245]">{PAY_LABEL[o.payment]}</p>
                      {o.installments > 1 ? <p className="text-[12px] text-muted">{o.installments}x</p> : null}
                    </Td>
                    <Td className="text-right font-semibold tabular">{money(o.total)}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <OrderBadge status={o.status} />
                        {o.printed?.label ? (
                          <span title="Etiqueta impressa" className="text-faint">
                            <Tag size={13} />
                          </span>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </PageBody>

      {/* Barra de ações em lote */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[256px]",
          sel.length ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-[#1d1d1f] p-1.5 pl-5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          <span className="mr-2 text-[13.5px] font-medium tabular">{sel.length} selecionado{sel.length > 1 ? "s" : ""}</span>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] hover:bg-white/20">
              Mudar situação <ChevronDown size={14} />
            </button>
            {menu && (
              <div className="absolute bottom-11 left-0 w-[220px] rounded-2xl bg-white p-1.5 text-ink shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]">
                {TABS.filter((t) => t !== "todos").map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      bulkSetOrderStatus(sel, t as OrderStatus);
                      setMenu(false);
                      setSel([]);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-[#f5f5f7]"
                  >
                    <OrderBadge status={t as OrderStatus} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => router.push(`/admin/imprimir/etiquetas?ids=${sel.join(",")}`)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] hover:bg-white/20">
            <Tag size={14} /> Etiquetas
          </button>
          <button onClick={() => router.push(`/admin/imprimir/pedidos?ids=${sel.join(",")}`)} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] hover:bg-white/20">
            <FileText size={14} /> Pedidos
          </button>
          <button onClick={() => exportCsv(db.orders.filter((o) => sel.includes(o.id)))} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] hover:bg-white/20">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => setSel([])} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Limpar seleção">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
