"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Crown, Download, Mail, MessageCircle, Repeat, ShoppingBag, Star, Users, X } from "lucide-react";
import { saveCustomerMeta, useDB } from "@/lib/store";
import { compactMoney, money, relative, shortDate } from "@/lib/format";
import { buildCustomers, downloadCsv, sinceDays, type CustomerRow } from "@/lib/admin";
import { waLink } from "@/lib/whatsapp";
import { AButton, Badge, EmptyState, Kpi, OrderBadge, PageBody, PageHeader, Panel, SearchInput, Segmented, Switch, Table, Td, TextArea, TextInput, Th } from "@/components/admin/kit";
import { Drawer } from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

type Seg = "todos" | "recorrentes" | "vip" | "novos";

export default function ClientesPage() {
  return (
    <Suspense fallback={null}>
      <Clientes />
    </Suspense>
  );
}

function Clientes() {
  const db = useDB();
  const router = useRouter();
  const params = useSearchParams();
  const openEmail = params.get("c");
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState<Seg>("todos");

  const all = useMemo(() => (db ? buildCustomers(db) : []), [db]);
  const list = useMemo(() => {
    let l = all;
    if (seg === "recorrentes") l = l.filter((c) => c.paidOrders >= 2);
    if (seg === "vip") l = l.filter((c) => c.vip);
    if (seg === "novos") {
      const since = sinceDays(30);
      l = l.filter((c) => new Date(c.first).getTime() >= since);
    }
    const t = q.trim().toLowerCase();
    if (t) l = l.filter((c) => `${c.name} ${c.email} ${c.phone} ${c.cpf} ${c.city} ${c.tags.join(" ")}`.toLowerCase().includes(t));
    return l;
  }, [all, seg, q]);

  if (!db) return null;
  const open = all.find((c) => c.email === openEmail?.toLowerCase()) ?? null;
  const setOpen = (email: string | null) => router.replace(email ? `/admin/clientes?c=${encodeURIComponent(email)}` : "/admin/clientes", { scroll: false });

  const buyers = all.filter((c) => c.paidOrders > 0);
  const repeat = all.filter((c) => c.paidOrders >= 2).length;
  const ltv = buyers.length ? buyers.reduce((a, c) => a + c.spent, 0) / buyers.length : 0;

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Quem comprou pela loja online"
        actions={
          <AButton
            onClick={() =>
              downloadCsv("clientes.csv", [
                ["Nome", "E-mail", "Telefone", "CPF", "Cidade", "UF", "Pedidos pagos", "Total gasto", "Primeira compra", "Última compra", "VIP", "Tags"],
                ...list.map((c) => [c.name, c.email, c.phone, c.cpf, c.city, c.uf, c.paidOrders, c.spent, shortDate(c.first), shortDate(c.last), c.vip ? "sim" : "", c.tags.join(", ")]),
              ])
            }
          >
            <Download size={16} /> Exportar
          </AButton>
        }
      />
      <PageBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="Clientes" value={all.length} icon={<Users size={18} />} tone="blue" hint="com pedido na loja" />
          <Kpi label="Compraram de novo" value={repeat} icon={<Repeat size={18} />} tone="green" hint={`${all.length ? Math.round((repeat / all.length) * 100) : 0}% da base`} />
          <Kpi label="Gasto médio por cliente" value={compactMoney(ltv)} icon={<ShoppingBag size={18} />} tone="purple" hint="pedidos pagos" />
          <Kpi label="VIP" value={all.filter((c) => c.vip).length} icon={<Crown size={18} />} tone="orange" hint="marcados por você" />
        </div>

        <Panel padded={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.05] p-3 md:p-4">
            <Segmented
              items={[
                { value: "todos", label: "Todos", count: all.length },
                { value: "recorrentes", label: "Recorrentes", count: repeat },
                { value: "vip", label: "VIP", count: all.filter((c) => c.vip).length },
                { value: "novos", label: "Novos (30 dias)" },
              ]}
              value={seg}
              onChange={setSeg}
            />
            <SearchInput value={q} onChange={setQ} placeholder="Nome, e-mail, telefone, CPF, cidade…" className="min-w-[220px] flex-1" />
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="Nenhum cliente encontrado" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Contato</Th>
                  <Th>Cidade</Th>
                  <Th className="text-center">Pedidos</Th>
                  <Th className="text-right">Total gasto</Th>
                  <Th>Última compra</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.email} onClick={() => setOpen(c.email)} className="group cursor-pointer hover:bg-[#fafafa]">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} vip={c.vip} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            {c.name} {c.vip ? <Crown size={13} className="text-[#f08c1b]" /> : null}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {c.tags.slice(0, 2).map((t) => (
                              <Badge key={t} tone="blue" className="px-2 py-0.5 text-[11px]">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <p>{c.email}</p>
                      <p className="text-[12px] text-muted">{c.phone}</p>
                    </Td>
                    <Td className="text-[#424245]">
                      {c.city}/{c.uf}
                    </Td>
                    <Td className="text-center font-medium tabular">{c.orders.length}</Td>
                    <Td className="text-right font-semibold tabular">{money(c.spent)}</Td>
                    <Td className="text-muted">{relative(c.last)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </PageBody>

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Cliente" width={520}>
        {open ? <CustomerDetail key={open.email} c={open} /> : null}
      </Drawer>
    </>
  );
}

function Avatar({ name, vip, big }: { name: string; vip?: boolean; big?: boolean }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        big ? "h-14 w-14 text-[18px]" : "h-9 w-9 text-[13px]",
        vip ? "bg-gradient-to-br from-[#ffd56b] to-[#f08c1b] text-white" : "bg-gradient-to-br from-[#e8f2fd] to-[#d6e8fc] text-[#0066cc]",
      )}
    >
      {initials}
    </span>
  );
}

function CustomerDetail({ c }: { c: CustomerRow }) {
  const [notes, setNotes] = useState(c.notes);
  const [tags, setTags] = useState(c.tags);
  const [tag, setTag] = useState("");
  const [vip, setVip] = useState(c.vip);
  const save = (patch: Partial<{ notes: string; tags: string[]; vip: boolean }>) =>
    saveCustomerMeta(c.email, { notes: patch.notes ?? notes, tags: patch.tags ?? tags, vip: patch.vip ?? vip });
  const phone = c.phone.replace(/\D/g, "");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar name={c.name} vip={vip} big />
        <div className="min-w-0">
          <p className="truncate text-[19px] font-semibold tracking-[-0.01em]">{c.name}</p>
          <p className="text-[13px] text-muted">
            Cliente desde {shortDate(c.first)} · {c.city}/{c.uf}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Pedidos", String(c.orders.length)],
          ["Total gasto", compactMoney(c.spent)],
          ["Ticket médio", c.paidOrders ? compactMoney(c.spent / c.paidOrders) : "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-[#f5f5f7] p-3">
            <p className="text-[11.5px] text-muted">{k}</p>
            <p className="mt-1 text-[17px] font-semibold tabular">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {phone.length >= 10 ? (
          <a href={waLink(`55${phone}`, `Olá, ${c.name.split(" ")[0]}! Aqui é da Brian iPhones.`)} target="_blank" rel="noreferrer" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#25d366] text-[14px] font-medium text-white">
            <MessageCircle size={16} /> WhatsApp
          </a>
        ) : null}
        <a href={`mailto:${c.email}`} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-medium shadow-[0_0_0_1px_rgba(0,0,0,0.1)]">
          <Mail size={16} /> E-mail
        </a>
      </div>

      <dl className="space-y-2 rounded-2xl bg-[#f5f5f7] p-4 text-[13.5px]">
        {[
          ["E-mail", c.email],
          ["Telefone", c.phone],
          ["CPF", c.cpf],
          ["Última compra", relative(c.last)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between rounded-2xl bg-[#fff8ec] p-4">
        <span className="flex items-center gap-2 text-[14px] font-medium">
          <Star size={16} className="text-[#f08c1b]" /> Cliente VIP
        </span>
        <Switch checked={vip} onChange={(v) => (setVip(v), save({ vip: v }))} />
      </div>

      <div>
        <p className="text-[13px] font-medium text-[#424245]">Etiquetas</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <Badge key={t} tone="blue">
              {t}
              <button
                onClick={() => {
                  const next = tags.filter((x) => x !== t);
                  setTags(next);
                  save({ tags: next });
                }}
                aria-label={`Remover ${t}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = tag.trim();
              if (!t || tags.includes(t)) return;
              const next = [...tags, t];
              setTags(next);
              setTag("");
              save({ tags: next });
            }}
          >
            <TextInput value={tag} onChange={(e) => setTag(e.target.value)} placeholder="+ etiqueta" className="h-8 w-32 text-[12.5px]" />
          </form>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-medium text-[#424245]">Anotações</p>
        <TextArea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => save({ notes })} placeholder="Preferências, troca em andamento, aparelho que quer…" />
        <p className="mt-1 text-[11.5px] text-faint">Salva automaticamente ao sair do campo.</p>
      </div>

      <div>
        <p className="text-[13px] font-medium text-[#424245]">Pedidos</p>
        <ul className="mt-2 divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
          {c.orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#fafafa]">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium">#{o.number}</span>
                  <span className="block truncate text-[12px] text-muted">
                    {shortDate(o.createdAt)} · {o.items.map((i) => i.name).join(", ")}
                  </span>
                </span>
                <OrderBadge status={o.status} />
                <span className="w-20 text-right text-[13.5px] font-semibold tabular">{money(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
