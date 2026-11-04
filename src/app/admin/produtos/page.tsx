"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Eye, EyeOff, LayoutGrid, List, MoreHorizontal, Package, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { deleteProduct, deleteProducts, duplicateProduct, patchProducts, saveProduct, useDB } from "@/lib/store";
import { compactMoney, money } from "@/lib/format";
import { downloadCsv } from "@/lib/admin";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/lib/site";
import type { Category, Product } from "@/lib/types";
import {
  AButton,
  ALink,
  Badge,
  Checkbox,
  EmptyState,
  Kpi,
  PageBody,
  PageHeader,
  Panel,
  SearchInput,
  Segmented,
  SelectInput,
  Switch,
  Table,
  Td,
  Th,
} from "@/components/admin/kit";
import { ProductMedia } from "@/components/site/ProductMedia";
import { cn } from "@/lib/utils";

const CATS: (Category | "todos")[] = ["todos", "iphone", "macbook", "ipad", "watch", "acessorio"];
type Status = "todos" | "ativos" | "inativos" | "sem-estoque" | "destaque";
type Sort = "recentes" | "nome" | "preco-desc" | "preco-asc" | "estoque";

export default function ProdutosPage() {
  return (
    <Suspense fallback={null}>
      <Produtos />
    </Suspense>
  );
}

function Produtos() {
  const db = useDB();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "todos">("todos");
  const [status, setStatus] = useState<Status>((params.get("f") as Status) || "todos");
  const [cond, setCond] = useState("");
  const [sort, setSort] = useState<Sort>("recentes");
  const [view, setView] = useState<"lista" | "grade">("lista");
  const [sel, setSel] = useState<string[]>([]);

  const list = useMemo(() => {
    let l = db?.products ?? [];
    if (cat !== "todos") l = l.filter((p) => p.category === cat);
    if (cond) l = l.filter((p) => p.condition === cond);
    if (status === "ativos") l = l.filter((p) => p.active);
    if (status === "inativos") l = l.filter((p) => !p.active);
    if (status === "sem-estoque") l = l.filter((p) => p.stock === 0);
    if (status === "destaque") l = l.filter((p) => p.featured);
    const t = q.trim().toLowerCase();
    if (t) l = l.filter((p) => `${p.name} ${p.storage} ${p.color} ${p.sku ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase().includes(t));
    const s = [...l];
    if (sort === "nome") s.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "preco-desc") s.sort((a, b) => b.price - a.price);
    if (sort === "preco-asc") s.sort((a, b) => a.price - b.price);
    if (sort === "estoque") s.sort((a, b) => a.stock - b.stock);
    if (sort === "recentes") s.sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
    return s;
  }, [db, cat, cond, status, q, sort]);

  if (!db) return null;
  const P = db.products;
  const active = P.filter((p) => p.active);
  const stockValue = active.reduce((a, p) => a + p.price * p.stock, 0);
  const withCost = active.filter((p) => p.cost);
  const margin = withCost.length ? withCost.reduce((a, p) => a + (p.price - (p.cost ?? 0)) / p.price, 0) / withCost.length : 0;

  const allSel = list.length > 0 && list.every((p) => sel.includes(p.id));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={`${P.length} cadastrados · ${active.length} à venda`}
        actions={
          <>
            <AButton
              onClick={() =>
                downloadCsv("produtos.csv", [
                  ["SKU", "Nome", "Categoria", "Estado", "Armazenamento", "Cor", "Preço", "Preço de", "Custo", "Estoque", "Ativo", "Destaque"],
                  ...list.map((p) => [p.sku ?? "", p.name, CATEGORY_LABEL[p.category], CONDITION_LABEL[p.condition], p.storage, p.color, p.price, p.priceFrom ?? "", p.cost ?? "", p.stock, p.active ? "sim" : "não", p.featured ? "sim" : "não"]),
                ])
              }
            >
              <Download size={16} /> Exportar
            </AButton>
            <ALink href="/admin/produtos/novo" variant="primary">
              <Plus size={16} /> Novo produto
            </ALink>
          </>
        }
      />
      <PageBody className="space-y-5">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Kpi label="À venda" value={active.length} icon={<Package size={18} />} tone="blue" hint={`${active.reduce((a, p) => a + p.stock, 0)} unidades`} />
          <Kpi label="Valor em estoque" value={compactMoney(stockValue)} tone="green" hint="preço de venda" />
          <Kpi label="Margem média" value={`${(margin * 100).toFixed(0)}%`} tone="purple" hint="sobre o custo cadastrado" />
          <Kpi label="Sem estoque" value={P.filter((p) => p.active && p.stock === 0).length} tone="red" hint="ativos zerados" />
        </div>

        <Segmented items={CATS.map((c) => ({ value: c, label: c === "todos" ? "Todos" : CATEGORY_LABEL[c], count: c === "todos" ? P.length : P.filter((p) => p.category === c).length }))} value={cat} onChange={setCat} />

        <Panel padded={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.05] p-3 md:p-4">
            <SearchInput value={q} onChange={setQ} placeholder="Nome, cor, SKU, etiqueta…" className="min-w-[220px] flex-1" />
            <SelectInput value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-[150px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="todos">Todos</option>
              <option value="ativos">À venda</option>
              <option value="inativos">Ocultos</option>
              <option value="sem-estoque">Sem estoque</option>
              <option value="destaque">Em destaque</option>
            </SelectInput>
            <SelectInput value={cond} onChange={(e) => setCond(e.target.value)} className="w-[140px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="">Todo estado</option>
              <option value="novo">Lacrado</option>
              <option value="seminovo">Seminovo</option>
              <option value="vitrine">Vitrine</option>
            </SelectInput>
            <SelectInput value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-[170px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
              <option value="recentes">Editados recentemente</option>
              <option value="nome">Nome (A–Z)</option>
              <option value="preco-desc">Maior preço</option>
              <option value="preco-asc">Menor preço</option>
              <option value="estoque">Menor estoque</option>
            </SelectInput>
            <div className="inline-flex rounded-full bg-[#f5f5f7] p-1">
              {(
                [
                  ["lista", <List key="l" size={15} />],
                  ["grade", <LayoutGrid key="g" size={15} />],
                ] as const
              ).map(([v, icon]) => (
                <button key={v} onClick={() => setView(v)} className={cn("grid h-8 w-9 place-items-center rounded-full", view === v ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-muted")} aria-label={v}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={<Package size={24} />} title="Nenhum produto" text="Mude os filtros ou cadastre um produto novo." action={<ALink href="/admin/produtos/novo" variant="primary">Novo produto</ALink>} />
          ) : view === "lista" ? (
            <Table>
              <thead>
                <tr>
                  <Th className="w-10">
                    <Checkbox checked={allSel} indeterminate={sel.length > 0 && !allSel} onChange={() => setSel(allSel ? [] : list.map((p) => p.id))} />
                  </Th>
                  <Th>Produto</Th>
                  <Th>Estado</Th>
                  <Th className="text-right">Preço</Th>
                  <Th className="text-right">Margem</Th>
                  <Th className="text-center">Estoque</Th>
                  <Th>À venda</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} onClick={() => router.push(`/admin/produtos/${p.id}`)} className={cn("group cursor-pointer hover:bg-[#fafafa]", sel.includes(p.id) && "bg-[#f2f7fe]")}>
                    <Td>
                      <Checkbox checked={sel.includes(p.id)} onChange={() => toggle(p.id)} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f5f5f7] p-1.5">
                          <ProductMedia p={p} />
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            <span className="truncate">
                              {p.name} {p.storage}
                            </span>
                            {p.featured ? <Star size={13} className="shrink-0 fill-[#f5b301] text-[#f5b301]" /> : null}
                          </p>
                          <p className="flex items-center gap-1.5 text-[12px] text-muted">
                            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: p.colorHex }} />
                            {p.color} · {CATEGORY_LABEL[p.category]}
                            {p.sku ? <span className="font-mono text-faint">· {p.sku}</span> : null}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={p.condition === "novo" ? "blue" : p.condition === "vitrine" ? "orange" : "gray"}>
                        {p.condition === "novo" ? "Lacrado" : CONDITION_LABEL[p.condition]}
                        {p.battery && p.condition !== "novo" ? ` · ${p.battery}%` : ""}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <p className="font-semibold tabular">{money(p.price)}</p>
                      {p.priceFrom ? <p className="text-[12px] text-faint line-through tabular">{money(p.priceFrom)}</p> : null}
                    </Td>
                    <Td className="text-right tabular text-muted">{p.cost ? `${Math.round(((p.price - p.cost) / p.price) * 100)}%` : "—"}</Td>
                    <Td className="text-center">
                      <StockPill n={p.stock} />
                    </Td>
                    <Td>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Switch checked={p.active} onChange={(v) => saveProduct({ ...p, active: v })} />
                      </span>
                    </Td>
                    <Td>
                      <RowMenu p={p} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:p-4 xl:grid-cols-5">
              {list.map((p) => (
                <Link key={p.id} href={`/admin/produtos/${p.id}`} className={cn("group relative rounded-2xl bg-[#f5f5f7] p-3 transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]", !p.active && "opacity-55")}>
                  <span className="relative block aspect-square overflow-hidden rounded-xl bg-white p-4">
                    <ProductMedia p={p} />
                    {p.featured ? <Star size={15} className="absolute right-2 top-2 fill-[#f5b301] text-[#f5b301]" /> : null}
                  </span>
                  <p className="mt-2.5 truncate text-[13.5px] font-medium">
                    {p.name} {p.storage}
                  </p>
                  <p className="text-[12px] text-muted">{p.color}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold tabular">{money(p.price)}</span>
                    <StockPill n={p.stock} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </PageBody>

      {/* Ações em lote */}
      <div className={cn("fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-[transform,opacity] duration-300 lg:pl-[256px]", sel.length ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0")}>
        <div className="flex flex-wrap items-center gap-2 rounded-full bg-[#1d1d1f] p-1.5 pl-5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          <span className="mr-2 text-[13.5px] font-medium tabular">{sel.length} selecionado(s)</span>
          {[
            [<Eye key="a" size={14} />, "Pôr à venda", () => patchProducts(sel, { active: true })],
            [<EyeOff key="b" size={14} />, "Ocultar", () => patchProducts(sel, { active: false })],
            [<Star key="c" size={14} />, "Destacar", () => patchProducts(sel, { featured: true })],
          ].map(([icon, label, fn]) => (
            <button key={label as string} onClick={() => ((fn as () => void)(), setSel([]))} className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13px] hover:bg-white/20">
              {icon as React.ReactNode} {label as string}
            </button>
          ))}
          <button
            onClick={() => {
              if (confirm(`Excluir ${sel.length} produto(s)? Não dá pra desfazer.`)) {
                deleteProducts(sel);
                setSel([]);
              }
            }}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#ff3b30]/90 px-3.5 text-[13px] hover:bg-[#ff3b30]"
          >
            <Trash2 size={14} /> Excluir
          </button>
          <button onClick={() => setSel([])} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Limpar seleção">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function StockPill({ n }: { n: number }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[34px] justify-center rounded-full px-2 py-0.5 text-[12.5px] font-semibold tabular",
        n === 0 ? "bg-[#fdecec] text-[#c40014]" : n === 1 ? "bg-[#fff2e5] text-[#b25e09]" : "bg-[#e8f6ec] text-[#1f7a39]",
      )}
    >
      {n}
    </span>
  );
}

function RowMenu({ p }: { p: Product }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", k);
    return () => window.removeEventListener("mousedown", k);
  }, [open]);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((v) => !v)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink" aria-label="Ações">
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-[200px] rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(0,0,0,0.06)]">
          <MenuItem icon={<Pencil size={15} />} label="Editar" onClick={() => router.push(`/admin/produtos/${p.id}`)} />
          <MenuItem
            icon={<Copy size={15} />}
            label="Duplicar"
            onClick={() => {
              const c = duplicateProduct(p.id);
              if (c) router.push(`/admin/produtos/${c.id}`);
            }}
          />
          <MenuItem icon={<Star size={15} />} label={p.featured ? "Tirar do destaque" : "Destacar"} onClick={() => (saveProduct({ ...p, featured: !p.featured }), setOpen(false))} />
          <MenuItem icon={<Eye size={15} />} label="Ver na loja" onClick={() => window.open(`/loja/${p.slug}`, "_blank")} />
          <div className="my-1 h-px bg-black/[0.06]" />
          <MenuItem icon={<Trash2 size={15} />} label="Excluir" danger onClick={() => confirm(`Excluir ${p.name}?`) && deleteProduct(p.id)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px]", danger ? "text-[#d70015] hover:bg-[#fff5f5]" : "hover:bg-[#f5f5f7]")}>
      <span className={danger ? "" : "text-muted"}>{icon}</span>
      {label}
    </button>
  );
}
