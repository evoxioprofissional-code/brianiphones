/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useRef, useState } from "react";
import { deleteProduct, saveProduct, useDB } from "@/lib/store";
import { money, slugify, uid } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { CATEGORY_LABEL, CONDITION_LABEL, STORAGE_OPTIONS } from "@/lib/site";
import type { Category, Condition, Product } from "@/lib/types";
import { Btn, Drawer, PageHead } from "@/components/admin/AdminShell";
import { ProductMedia } from "@/components/site/ProductMedia";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Camera, Close, Edit, Plus, Search } from "@/components/ui/Icons";

const empty = (): Product => ({
  id: uid(),
  slug: "",
  name: "",
  category: "iphone",
  condition: "seminovo",
  storage: "128 GB",
  color: "",
  colorHex: "#2f2f31",
  battery: 90,
  price: 0,
  cost: 0,
  stock: 1,
  featured: false,
  active: true,
  warrantyMonths: 3,
  notes: "",
  images: [],
  createdAt: new Date().toISOString(),
});

export default function ProdutosPage() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "todos">("todos");
  const [editing, setEditing] = useState<Product | null>(null);

  const list = useMemo(() => {
    let l = db?.products ?? [];
    if (cat !== "todos") l = l.filter((p) => p.category === cat);
    if (q.trim()) l = l.filter((p) => `${p.name} ${p.color} ${p.storage}`.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [db, q, cat]);

  if (!db) return null;
  const stockValue = db.products.filter((p) => p.active).reduce((a, p) => a + p.price * p.stock, 0);
  const units = db.products.filter((p) => p.active).reduce((a, p) => a + p.stock, 0);

  return (
    <>
      <PageHead
        eyebrow={`${units} unidades · ${money(stockValue)} em estoque`}
        title="Produtos"
        actions={
          <Btn onClick={() => setEditing(empty())}>
            <Plus size={16} /> Novo produto
          </Btn>
        }
      />

      <div className="px-5 py-6 md:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar"
              className="h-10 w-full rounded-full border border-line bg-card pl-9 pr-3 text-[13px] outline-none focus:border-ink/50"
            />
          </label>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {(["todos", "iphone", "macbook", "ipad", "watch", "acessorio"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-10 shrink-0 rounded-full px-4 text-[13px] ${cat === c ? "bg-ink text-paper" : "border border-line bg-card text-graphite"}`}
              >
                {c === "todos" ? "Todos" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[8px] border border-line bg-card">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line">
                {["Produto", "Estado", "Preço", "Margem", "Estoque", "No site", ""].map((h) => (
                  <th key={h} className="label px-4 py-3 text-[10px] font-normal text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => {
                const margin = p.cost ? ((p.price - p.cost) / p.price) * 100 : null;
                return (
                  <tr key={p.id} className={`group hover:bg-paper/60 ${p.active ? "" : "opacity-50"}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditing(p)} className="flex items-center gap-3 text-left">
                        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[4px] bg-paper-2 p-1.5">
                          <ProductMedia p={p} />
                        </span>
                        <span>
                          <span className="block font-medium">
                            {p.name} {p.featured && <span className="label ml-1 text-[9px] text-steel">Destaque</span>}
                          </span>
                          <span className="text-muted">
                            {p.storage} · {p.color}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-graphite">
                      {CONDITION_LABEL[p.condition]}
                      {p.battery && p.condition !== "novo" ? <span className="text-muted"> · {p.battery}%</span> : null}
                    </td>
                    <td className="px-4 py-3 font-medium tabular">{money(p.price)}</td>
                    <td className="px-4 py-3 tabular text-muted">{margin === null ? "—" : `${margin.toFixed(0)}%`}</td>
                    <td className="px-4 py-3">
                      <span className={`tabular ${p.stock === 0 ? "text-bad" : p.stock === 1 ? "text-warn" : ""}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Toggle checked={p.active} onChange={(v) => saveProduct({ ...p, active: v })} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditing(p)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line hover:border-ink/40" aria-label="Editar">
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-10 text-center text-muted">Nenhum produto encontrado.</p>}
        </div>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing && db.products.some((p) => p.id === editing.id) ? "Editar produto" : "Novo produto"}>
        {editing && <ProductForm key={editing.id} initial={editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 rounded-full transition-colors ${checked ? "bg-ink" : "bg-line"}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-card transition-[left] ${checked ? "left-5" : "left-1"}`} />
    </button>
  );
}

function ProductForm({ initial, onDone }: { initial: Product; onDone: () => void }) {
  const db = useDB();
  const [p, setP] = useState<Product>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const exists = db?.products.some((x) => x.id === p.id);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((s) => ({ ...s, [k]: v }));

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    const imgs = await Promise.all(Array.from(files).slice(0, 5 - p.images.length).map((f) => compressImage(f, 1100, 0.8)));
    setP((s) => ({ ...s, images: [...s.images, ...imgs] }));
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = () => {
    if (!p.name.trim() || !p.price) {
      setErr("Preencha pelo menos o nome e o preço.");
      return;
    }
    const slugBase = slugify(`${p.name}-${p.storage}-${p.color}`);
    const taken = db?.products.some((x) => x.slug === slugBase && x.id !== p.id);
    saveProduct({ ...p, slug: taken ? `${slugBase}-${p.id.slice(0, 4)}` : slugBase });
    onDone();
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <p className="text-[13px] font-medium text-graphite">Fotos</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {p.images.map((img, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-[4px] bg-paper-2">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => set("images", p.images.filter((_, k) => k !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-paper"
                aria-label="Remover"
              >
                <Close size={12} />
              </button>
              {i === 0 && <span className="label absolute bottom-1 left-1 rounded-full bg-card px-1.5 text-[8px]">Capa</span>}
            </div>
          ))}
          {p.images.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[4px] border border-dashed border-ink/30 text-muted hover:text-ink"
            >
              <Camera size={18} />
              <span className="text-[10px]">{busy ? "…" : "Adicionar"}</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <p className="mt-2 text-[12px] text-faint">Sem foto, o site mostra uma ilustração na cor do aparelho.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <Input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="iPhone 16 Pro" />
        </Field>
        <Field label="Categoria">
          <Select value={p.category} onChange={(e) => set("category", e.target.value as Category)}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={p.condition} onChange={(e) => set("condition", e.target.value as Condition)}>
            {Object.entries(CONDITION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Armazenamento / versão">
          <Input list="storage-opts" value={p.storage} onChange={(e) => set("storage", e.target.value)} />
          <datalist id="storage-opts">
            {STORAGE_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Saúde da bateria (%)" hint={p.condition === "novo" ? "não aparece em lacrado" : undefined}>
          <Input type="number" min={0} max={100} value={p.battery ?? ""} onChange={(e) => set("battery", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Cor">
          <Input value={p.color} onChange={(e) => set("color", e.target.value)} placeholder="Titânio natural" />
        </Field>
        <Field label="Tom da cor" hint="pra ilustração">
          <span className="flex h-12 items-center gap-3 rounded-[6px] border border-line bg-card px-3">
            <input type="color" value={p.colorHex} onChange={(e) => set("colorHex", e.target.value)} className="h-7 w-10 cursor-pointer border-0 bg-transparent" />
            <span className="font-mono text-[13px] text-muted">{p.colorHex}</span>
          </span>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Preço à vista (R$)">
          <Input type="number" value={p.price || ""} onChange={(e) => set("price", Number(e.target.value))} />
        </Field>
        <Field label="Preço “de” (opcional)">
          <Input type="number" value={p.priceFrom ?? ""} onChange={(e) => set("priceFrom", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Custo (R$)" hint="só aparece aqui">
          <Input type="number" value={p.cost ?? ""} onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
        <Field label="Estoque">
          <Input type="number" min={0} value={p.stock} onChange={(e) => set("stock", Number(e.target.value))} />
        </Field>
        <Field label="Garantia (meses)">
          <Input type="number" min={0} value={p.warrantyMonths} onChange={(e) => set("warrantyMonths", Number(e.target.value))} />
        </Field>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} className="accent-ink" /> Destaque na página inicial
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={p.active} onChange={(e) => set("active", e.target.checked)} className="accent-ink" /> Visível no site
          </label>
        </div>
      </div>

      <Field label="Observações" hint="aparece na página do produto">
        <Textarea value={p.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Ex.: acompanha caixa e cabo. Pequena marca na lateral." />
      </Field>

      {err && <p className="text-[13px] text-bad">{err}</p>}

      <div className="flex items-center justify-between border-t border-line pt-6">
        {exists ? (
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm(`Excluir ${p.name}?`)) {
                deleteProduct(p.id);
                onDone();
              }
            }}
          >
            Excluir
          </Btn>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={onDone}>
            Cancelar
          </Btn>
          <Btn onClick={save}>Salvar</Btn>
        </div>
      </div>
    </div>
  );
}
