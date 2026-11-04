"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  GripVertical,
  ImagePlus,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { deleteProduct, duplicateProduct, saveProduct, useDB } from "@/lib/store";
import { installment, money, slugify, uid } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { productTemplate } from "@/lib/defaults";
import { CATEGORY_LABEL, IPHONE_MODELS, STORAGE_OPTIONS } from "@/lib/site";
import type { Category, Condition, Product, ProductSpec } from "@/lib/types";
import {
  AButton,
  ALink,
  Badge,
  ColorInput,
  EmptyState,
  FormField,
  PageBody,
  PageHeader,
  Panel,
  SelectInput,
  Switch,
  TextArea,
  TextInput,
} from "@/components/admin/kit";
import { ProductCard } from "@/components/site/ProductCard";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = ["#1d1d1f", "#f5f5f0", "#2d3a52", "#c8662f", "#bfa48a", "#b9b3a8", "#c9d7e6", "#b7c2a6", "#5b6fd6", "#e9cfd2", "#c3b8d6", "#e6c88f", "#d70015"];
const BADGE_PRESETS = ["#1d1d1f", "#0071e3", "#bf4800", "#d70015", "#1f8a3e", "#8e54e9"];

function blank(): Product {
  return {
    id: uid(),
    slug: "",
    name: "",
    category: "iphone",
    condition: "seminovo",
    storage: "128 GB",
    color: "",
    colorHex: "#1d1d1f",
    battery: 100,
    price: 0,
    stock: 1,
    featured: false,
    active: true,
    warrantyMonths: 3,
    images: [],
    createdAt: new Date().toISOString(),
    highlights: [],
    specs: [],
    inBox: [],
    tags: [],
  };
}

export default function ProductEditorPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  if (!db) return null;
  const isNew = id === "novo";
  const found = db.products.find((p) => p.id === id);
  if (!isNew && !found) {
    return (
      <PageBody className="pt-10">
        <EmptyState title="Produto não encontrado" action={<ALink href="/admin/produtos">Voltar aos produtos</ALink>} />
      </PageBody>
    );
  }
  return <Editor key={id} initial={found ?? blank()} isNew={isNew} />;
}

function Editor({ initial, isNew }: { initial: Product; isNew: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<Product>(initial);
  const [saved, setSaved] = useState<Product>(initial);
  const [tried, setTried] = useState(false);
  const [flash, setFlash] = useState(false);
  const dirty = JSON.stringify(p) !== JSON.stringify(saved);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  // avisa ao sair com alterações não salvas
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const errors = { name: !p.name.trim(), price: !(p.price > 0), color: !p.color.trim() };
  const valid = !Object.values(errors).some(Boolean);

  const save = () => {
    setTried(true);
    if (!valid) {
      document.querySelector("[data-err=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const final: Product = { ...p, slug: p.slug || slugify(`${p.name}-${p.storage}-${p.color}`) };
    saveProduct(final);
    setP(final);
    setSaved(final);
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
    if (isNew) router.replace(`/admin/produtos/${final.id}`);
  };

  // Ctrl+S salva
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const margin = p.cost && p.price ? ((p.price - p.cost) / p.price) * 100 : null;
  const off = p.priceFrom && p.priceFrom > p.price ? Math.round((1 - p.price / p.priceFrom) * 100) : 0;
  const used = p.condition !== "novo";

  const fillTemplate = () => {
    const t = productTemplate(p);
    setP((x) => ({
      ...x,
      subtitle: x.subtitle || t.subtitle,
      description: x.description || t.description,
      highlights: x.highlights?.length ? x.highlights : t.highlights,
      specs: x.specs?.length ? x.specs : t.specs,
      inBox: x.inBox?.length ? x.inBox : t.inBox,
    }));
  };

  return (
    <>
      <PageHeader
        back={{ href: "/admin/produtos", label: "Produtos" }}
        title={isNew ? "Novo produto" : `${p.name || "Sem nome"} ${p.storage}`}
        subtitle={isNew ? "Preencha as informações e salve." : `${CATEGORY_LABEL[p.category]} · ${p.sku ?? "sem SKU"}`}
        actions={
          <>
            {!isNew && (
              <>
                <ALink href={`/loja/${saved.slug}`} target="_blank">
                  <ExternalLink size={15} /> Ver na loja
                </ALink>
                <AButton
                  onClick={() => {
                    const c = duplicateProduct(p.id);
                    if (c) router.push(`/admin/produtos/${c.id}`);
                  }}
                >
                  <Copy size={15} /> Duplicar
                </AButton>
                <AButton
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Excluir ${p.name}? Não dá pra desfazer.`)) {
                      deleteProduct(p.id);
                      router.replace("/admin/produtos");
                    }
                  }}
                >
                  <Trash2 size={15} />
                </AButton>
              </>
            )}
            <AButton variant="accent" onClick={save} disabled={!dirty && !isNew}>
              {isNew ? "Cadastrar produto" : "Salvar"}
            </AButton>
          </>
        }
      />

      <PageBody className="pb-32">
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          {/* Coluna principal */}
          <div className="space-y-5">
            <Panel title="Fotos" subtitle="A primeira é a capa. Arraste ou use as setas para ordenar. PNG com fundo transparente fica melhor.">
              <ImageManager images={p.images} onChange={(imgs) => set("images", imgs)} />
            </Panel>

            <Panel title="Informações básicas">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Nome do produto" error={tried && errors.name ? "Obrigatório" : ""} className="sm:col-span-2">
                  <span data-err={tried && errors.name}>
                    <TextInput value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: iPhone 16 Pro Max" list="modelos" />
                  </span>
                  <datalist id="modelos">
                    {IPHONE_MODELS.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </FormField>
                <FormField label="Frase de destaque" hint="aparece abaixo do nome" className="sm:col-span-2">
                  <TextInput value={p.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Ex.: Revisado, com bateria medida e garantia da loja." />
                </FormField>
                <FormField label="Categoria">
                  <SelectInput value={p.category} onChange={(e) => set("category", e.target.value as Category)}>
                    {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Estado">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#f5f5f7] p-1">
                    {(
                      [
                        ["novo", "Lacrado"],
                        ["seminovo", "Seminovo"],
                        ["vitrine", "Vitrine"],
                      ] as [Condition, string][]
                    ).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set("condition", v)}
                        className={cn("h-8 rounded-lg text-[13px]", p.condition === v ? "bg-white font-medium shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-[#424245]")}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </FormField>
                <FormField label={p.category === "watch" ? "Conexão / tamanho" : "Armazenamento"}>
                  <TextInput value={p.storage} onChange={(e) => set("storage", e.target.value)} list="storages" />
                  <datalist id="storages">
                    {STORAGE_OPTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </FormField>
                <FormField label="Garantia da loja" hint="meses">
                  <TextInput type="number" min={0} value={p.warrantyMonths} onChange={(e) => set("warrantyMonths", Number(e.target.value))} suffix="meses" />
                </FormField>
                <FormField label="Nome da cor" error={tried && errors.color ? "Obrigatório" : ""}>
                  <span data-err={tried && errors.color}>
                    <TextInput value={p.color} onChange={(e) => set("color", e.target.value)} placeholder="Ex.: Titânio natural" />
                  </span>
                </FormField>
                <FormField label="Cor (bolinha e ilustração)">
                  <ColorInput value={p.colorHex} onChange={(v) => set("colorHex", v)} presets={COLOR_PRESETS} />
                </FormField>
                {used ? (
                  <FormField label="Saúde da bateria" hint={`${p.battery ?? 0}%`} className="sm:col-span-2">
                    <input
                      type="range"
                      min={70}
                      max={100}
                      value={p.battery ?? 100}
                      onChange={(e) => set("battery", Number(e.target.value))}
                      className="h-2 w-full cursor-pointer accent-[#0071e3]"
                    />
                  </FormField>
                ) : null}
              </div>
            </Panel>

            <Panel
              title="Descrição do anúncio"
              subtitle="O texto que o cliente lê na página do produto"
              actions={
                <AButton size="sm" onClick={fillTemplate}>
                  <Wand2 size={14} /> Preencher com modelo
                </AButton>
              }
            >
              <div className="space-y-4">
                <FormField label="Descrição" hint={`${(p.description ?? "").length} caracteres`}>
                  <TextArea rows={5} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Conte o estado do aparelho, o que foi revisado, pra quem ele é ideal…" />
                </FormField>
                <FormField label="Sobre este aparelho" hint="detalhe específico desta unidade">
                  <TextArea rows={3} value={p.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Ex.: pequeno risco na lateral, quase imperceptível. Tela sem marcas." />
                </FormField>
                <ListEditor label="Pontos fortes" hint="aparecem em tópicos" items={p.highlights ?? []} onChange={(v) => set("highlights", v)} placeholder="Ex.: Bateria 94%" />
              </div>
            </Panel>

            <Panel title="Ficha técnica" subtitle="Rótulo e valor, na ordem que aparecem">
              <SpecsEditor specs={p.specs ?? []} onChange={(v) => set("specs", v)} />
            </Panel>

            <Panel title="O que vem na caixa">
              <ListEditor items={p.inBox ?? []} onChange={(v) => set("inBox", v)} placeholder="Ex.: Cabo USB-C" />
            </Panel>

            <Panel title="Aparência no Google" subtitle="Opcional. Se ficar vazio, usamos o nome e a descrição.">
              <div className="space-y-4">
                <FormField label="Título" hint={`${(p.seoTitle ?? "").length}/60`}>
                  <TextInput value={p.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} placeholder={`${p.name} ${p.storage} ${p.color} | Brian iPhones`} />
                </FormField>
                <FormField label="Descrição" hint={`${(p.seoDescription ?? "").length}/155`}>
                  <TextArea rows={2} value={p.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} placeholder={p.subtitle || p.description?.slice(0, 150)} />
                </FormField>
                <div className="rounded-2xl bg-[#f5f5f7] p-4">
                  <p className="text-[12px] text-muted">Prévia</p>
                  <p className="mt-1 text-[12.5px] text-[#1e8e3e]">brianiphones.com.br › loja › {p.slug || slugify(`${p.name}-${p.storage}-${p.color}`) || "produto"}</p>
                  <p className="truncate text-[17px] text-[#1a0dab]">{p.seoTitle || `${p.name} ${p.storage} ${p.color} | Brian iPhones`}</p>
                  <p className="line-clamp-2 text-[13px] text-[#4d5156]">{p.seoDescription || p.subtitle || p.description || "Descrição do produto."}</p>
                </div>
              </div>
            </Panel>
          </div>

          {/* Lateral */}
          <div className="space-y-5 xl:sticky xl:top-20 xl:self-start">
            <Panel title="Publicação">
              <div className="space-y-3.5">
                <Row label="À venda no site" hint={p.active ? "Visível na loja" : "Oculto"}>
                  <Switch checked={p.active} onChange={(v) => set("active", v)} />
                </Row>
                <Row label="Destaque" hint="Aparece em “Mais procurados”">
                  <Switch checked={p.featured} onChange={(v) => set("featured", v)} />
                </Row>
              </div>
              <div className="mt-5 border-t border-black/[0.06] pt-4">
                <FormField label="Selo no card" hint="opcional">
                  <TextInput value={p.badge ?? ""} onChange={(e) => set("badge", e.target.value || undefined)} placeholder="Ex.: Oferta, Mais vendido" />
                </FormField>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {["Oferta", "Mais vendido", "Lançamento", "Último"].map((b) => (
                    <button key={b} onClick={() => set("badge", b)} className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[12px] hover:bg-[#ececf0]">
                      {b}
                    </button>
                  ))}
                </div>
                {p.badge ? (
                  <div className="mt-3">
                    <ColorInput value={p.badgeColor ?? "#1d1d1f"} onChange={(v) => set("badgeColor", v)} presets={BADGE_PRESETS} />
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel title="Preço">
              <div className="space-y-4">
                <FormField label="Preço à vista (Pix)" error={tried && errors.price ? "Informe o preço" : ""}>
                  <span data-err={tried && errors.price}>
                    <TextInput type="number" min={0} value={p.price || ""} onChange={(e) => set("price", Number(e.target.value))} prefix="R$" className="text-[16px] font-semibold" />
                  </span>
                </FormField>
                <FormField label="Preço “de”" hint="riscado, opcional">
                  <TextInput type="number" min={0} value={p.priceFrom ?? ""} onChange={(e) => set("priceFrom", e.target.value ? Number(e.target.value) : undefined)} prefix="R$" />
                </FormField>
                <FormField label="Custo" hint="só aparece no admin">
                  <TextInput type="number" min={0} value={p.cost ?? ""} onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : undefined)} prefix="R$" />
                </FormField>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f5f7] p-3 text-[12.5px]">
                  <div>
                    <p className="text-muted">Lucro</p>
                    <p className={cn("text-[15px] font-semibold tabular", margin !== null && margin < 8 && "text-[#c40014]")}>{p.cost ? money(p.price - p.cost) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">Margem</p>
                    <p className="text-[15px] font-semibold tabular">{margin !== null ? `${margin.toFixed(0)}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">Em 12x</p>
                    <p className="font-medium tabular">{p.price ? installment(p.price) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted">Desconto</p>
                    <p className="font-medium tabular">{off ? `${off}%` : "—"}</p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Estoque e envio">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Quantidade">
                  <TextInput type="number" min={0} value={p.stock} onChange={(e) => set("stock", Math.max(0, Number(e.target.value)))} />
                </FormField>
                <FormField label="SKU">
                  <TextInput value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value || undefined)} placeholder="BI-0001" className="font-mono" />
                </FormField>
                <FormField label="Peso com caixa" className="col-span-2">
                  <TextInput type="number" min={0} value={p.weightGrams ?? ""} onChange={(e) => set("weightGrams", e.target.value ? Number(e.target.value) : undefined)} suffix="gramas" />
                </FormField>
              </div>
            </Panel>

            <Panel title="Organização">
              <ListEditor label="Etiquetas" hint="busca e filtros" items={p.tags ?? []} onChange={(v) => set("tags", v)} placeholder="Ex.: 5G, Dual SIM" inline />
              <FormField label="Anotação interna" hint="IMEI, origem, peça trocada…" className="mt-4">
                <TextArea rows={3} value={p.internalNotes ?? ""} onChange={(e) => set("internalNotes", e.target.value)} placeholder="Não aparece no site" />
              </FormField>
            </Panel>

            <Panel title="Prévia do card" subtitle="Como aparece na loja">
              <div className="mx-auto max-w-[260px]">
                <ProductCard p={{ ...p, name: p.name || "Nome do produto", color: p.color || "Cor", slug: p.slug || "preview" }} />
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>

      {/* Barra de salvar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[256px]",
          dirty || flash ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <div className="flex items-center gap-3 rounded-full bg-[#1d1d1f] p-1.5 pl-5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          {flash && !dirty ? (
            <span className="flex items-center gap-2 py-2 pr-3 text-[13.5px]">
              <Sparkles size={15} className="text-[#5ac8fa]" /> Produto salvo
            </span>
          ) : (
            <>
              <span className="text-[13.5px]">Alterações não salvas</span>
              <button onClick={() => setP(saved)} className="h-9 rounded-full px-3.5 text-[13px] text-white/75 hover:bg-white/10">
                Descartar
              </button>
              <button onClick={save} className="h-9 rounded-full bg-[#0071e3] px-4 text-[13px] font-medium hover:bg-[#0077ed]">
                Salvar <span className="text-white/60">Ctrl S</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        {hint ? <p className="text-[12px] text-muted">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

/* ---------------- Fotos ---------------- */

function ImageManager({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);

  const add = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/")).slice(0, 12 - images.length);
    if (!list.length) return;
    setBusy(true);
    try {
      const out = await Promise.all(list.map((f) => compressImage(f, 1200, 0.82)));
      onChange([...images, ...out]);
    } finally {
      setBusy(false);
    }
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            className={cn("group relative aspect-square overflow-hidden rounded-2xl bg-[#f5f5f7] ring-1 ring-black/[0.06]", i === 0 && "ring-2 ring-[#0071e3]", drag === i && "opacity-40")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-contain" />
            {i === 0 ? <Badge tone="blue" className="absolute left-2 top-2">Capa</Badge> : null}
            <span className="absolute left-2 top-2 hidden cursor-grab text-white drop-shadow group-hover:block">{i ? <GripVertical size={16} /> : null}</span>
            <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {i > 0 && (
                <IconBtn label="Usar como capa" onClick={() => move(i, 0)}>
                  <Star size={14} />
                </IconBtn>
              )}
              <IconBtn label="Mover para trás" onClick={() => move(i, i - 1)}>
                <ArrowUp size={14} className="-rotate-90" />
              </IconBtn>
              <IconBtn label="Mover para frente" onClick={() => move(i, i + 1)}>
                <ArrowDown size={14} className="-rotate-90" />
              </IconBtn>
              <IconBtn label="Remover" danger onClick={() => onChange(images.filter((_, k) => k !== i))}>
                <Trash2 size={14} />
              </IconBtn>
            </div>
          </div>
        ))}

        {images.length < 12 && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              if (e.dataTransfer.files.length) add(e.dataTransfer.files);
            }}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors",
              over ? "border-[#0071e3] bg-[#e8f2fd]" : "border-black/15 hover:border-[#0071e3]/60 hover:bg-[#f5f9ff]",
              images.length === 0 && "col-span-2 aspect-auto py-12 sm:col-span-3 lg:col-span-4",
            )}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f2fd] text-[#0071e3]">{busy ? <Upload size={18} className="animate-pulse" /> : <ImagePlus size={19} />}</span>
            <span className="text-[13.5px] font-medium">{busy ? "Enviando…" : "Adicionar fotos"}</span>
            <span className="px-3 text-[12px] text-muted">Arraste aqui ou clique · até 12 fotos</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
      {images.length === 0 && <p className="mt-3 text-[12.5px] text-muted">Sem foto, a loja mostra uma ilustração do aparelho na cor escolhida.</p>}
    </div>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn("grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,0.2)] backdrop-blur", danger ? "text-[#d70015]" : "text-ink")}
    >
      {children}
    </button>
  );
}

/* ---------------- Listas e ficha técnica ---------------- */

function ListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
  inline,
}: {
  label?: string;
  hint?: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  inline?: boolean;
}) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (!t) return;
    onChange([...items, t]);
    setV("");
  };
  return (
    <div>
      {label ? (
        <p className="flex items-baseline justify-between text-[13px] font-medium text-[#424245]">
          {label} {hint ? <span className="text-[12px] font-normal text-faint">{hint}</span> : null}
        </p>
      ) : null}
      {inline ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((t, i) => (
            <Badge key={i} tone="blue">
              {t}
              <button onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remover ${t}`}>
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((t, i) => (
            <li key={i} className="group flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0071e3]" />
              <TextInput value={t} onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))} className="h-9" />
              <button onClick={() => onChange(items.filter((_, k) => k !== i))} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-[#d70015]" aria-label="Remover">
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <TextInput
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-9"
        />
        <AButton size="sm" onClick={add} disabled={!v.trim()} className="h-9">
          <Plus size={14} /> Adicionar
        </AButton>
      </div>
    </div>
  );
}

function SpecsEditor({ specs, onChange }: { specs: ProductSpec[]; onChange: (v: ProductSpec[]) => void }) {
  const upd = (i: number, k: keyof ProductSpec, v: string) => onChange(specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= specs.length) return;
    const n = [...specs];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  const common = useMemo(() => ["Modelo", "Armazenamento", "Cor", "Estado", "Saúde da bateria", "Tela", "Chip", "Câmera", "Conector", "Resistência à água", "Garantia"], []);
  return (
    <div>
      {specs.length > 0 && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
          {specs.map((s, i) => (
            <div key={i} className="group grid grid-cols-[1fr_1.4fr_auto] items-center gap-2 border-b border-black/[0.05] bg-white p-2 last:border-b-0 odd:bg-[#fafafa]">
              <TextInput value={s.label} onChange={(e) => upd(i, "label", e.target.value)} placeholder="Rótulo" className="h-9 bg-transparent font-medium" list="spec-labels" />
              <TextInput value={s.value} onChange={(e) => upd(i, "value", e.target.value)} placeholder="Valor" className="h-9 bg-transparent" />
              <div className="flex opacity-50 transition-opacity group-hover:opacity-100">
                <button onClick={() => move(i, -1)} className="grid h-8 w-7 place-items-center rounded-full text-muted hover:bg-black/5" aria-label="Subir">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(i, 1)} className="grid h-8 w-7 place-items-center rounded-full text-muted hover:bg-black/5" aria-label="Descer">
                  <ArrowDown size={14} />
                </button>
                <button onClick={() => onChange(specs.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-[#d70015]" aria-label="Remover">
                  <X size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <datalist id="spec-labels">
        {common.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <AButton size="sm" className="mt-3" onClick={() => onChange([...specs, { label: "", value: "" }])}>
        <Plus size={14} /> Adicionar linha
      </AButton>
      {specs.length === 0 && <p className="mt-2 text-[12.5px] text-muted">Dica: use “Preencher com modelo” na descrição pra começar com uma ficha pronta.</p>}
    </div>
  );
}
