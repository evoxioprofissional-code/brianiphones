"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Loader2, Megaphone, Palette, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { saveStorefront, useDB } from "@/lib/store";
import { DEFAULT_STOREFRONT } from "@/lib/defaults";
import { CATEGORY_LABEL } from "@/lib/site";
import { resolveShelf } from "@/lib/storefront";
import { money, uid } from "@/lib/format";
import type { Category, CategoryTile, Condition, HeroSlide, Perk, Product, ShelfConfig, Storefront } from "@/lib/types";
import {
  AButton,
  ALink,
  Badge,
  Checkbox,
  ColorInput,
  FormField,
  Modal,
  PageBody,
  PageHeader,
  Panel,
  Segmented,
  SelectInput,
  Switch,
  TextInput,
} from "@/components/admin/kit";
import { ProductMedia } from "@/components/site/ProductMedia";
import { DeviceArt } from "@/components/site/DeviceArt";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image";
import { hasSupabase, uploadImage } from "@/lib/supabase";

type Tab = "banner" | "vitrines" | "categorias" | "vantagens" | "aviso" | "cores";

export default function VitrinePage() {
  const db = useDB();
  if (!db) return null;
  return <VitrineEditor initial={db.storefront} products={db.products} />;
}

function VitrineEditor({ initial, products }: { initial: Storefront; products: Product[] }) {
  const [sf, setSf] = useState<Storefront>(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<Tab>("banner");
  const [flash, setFlash] = useState(false);
  const dirty = JSON.stringify(sf) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = () => {
    saveStorefront(sf);
    setSaved(sf);
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
  };

  return (
    <>
      <PageHeader
        title="Vitrine do site"
        subtitle="Banner, vitrines, categorias, avisos e cores da loja"
        actions={
          <>
            <AButton
              onClick={() => {
                if (confirm("Voltar a vitrine para o padrão? Suas alterações aqui serão perdidas.")) setSf(JSON.parse(JSON.stringify(DEFAULT_STOREFRONT)));
              }}
            >
              <RotateCcw size={15} /> Restaurar padrão
            </AButton>
            <ALink href="/" target="_blank">
              <ExternalLink size={15} /> Ver site
            </ALink>
            <AButton variant="accent" onClick={save} disabled={!dirty}>
              Publicar alterações
            </AButton>
          </>
        }
      />
      <PageBody className="space-y-5 pb-32">
        <Segmented
          items={[
            { value: "banner", label: "Banner principal", count: sf.heroSlides.filter((s) => s.active).length },
            { value: "vitrines", label: "Vitrines", count: sf.shelves.filter((s) => s.active).length },
            { value: "categorias", label: "Categorias" },
            { value: "vantagens", label: "Faixa de vantagens" },
            { value: "aviso", label: "Aviso no topo" },
            { value: "cores", label: "Cores e estilo" },
          ]}
          value={tab}
          onChange={setTab}
          className="bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
        />

        {tab === "banner" && <BannerTab sf={sf} setSf={setSf} products={products} />}
        {tab === "vitrines" && <ShelvesTab sf={sf} setSf={setSf} products={products} />}
        {tab === "categorias" && <CategoriesTab sf={sf} setSf={setSf} />}
        {tab === "vantagens" && <PerksTab sf={sf} setSf={setSf} />}
        {tab === "aviso" && <AnnouncementTab sf={sf} setSf={setSf} />}
        {tab === "cores" && <ThemeTab sf={sf} setSf={setSf} />}
      </PageBody>

      <div
        className={cn(
          "fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 transition-[transform,opacity] duration-300 lg:pl-[256px]",
          dirty || flash ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <div className="flex items-center gap-3 rounded-full bg-[#1d1d1f] p-1.5 pl-5 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
          {flash && !dirty ? (
            <span className="py-2 pr-3 text-[13.5px]">✓ Publicado no site</span>
          ) : (
            <>
              <span className="text-[13.5px]">Alterações não publicadas</span>
              <button onClick={() => setSf(saved)} className="h-9 rounded-full px-3.5 text-[13px] text-white/75 hover:bg-white/10">
                Descartar
              </button>
              <button onClick={save} className="h-9 rounded-full bg-[#0071e3] px-4 text-[13px] font-medium hover:bg-[#0077ed]">
                Publicar
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

type TabProps = { sf: Storefront; setSf: (fn: (s: Storefront) => Storefront) => void };

/* ---------- utilitários de lista ---------- */
function moveIn<T>(arr: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

function OrderBtns({ onUp, onDown, onDelete, onEdit }: { onUp: () => void; onDown: () => void; onDelete?: () => void; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <button onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink" aria-label="Editar">
          <Pencil size={15} />
        </button>
      )}
      <button onClick={onUp} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink" aria-label="Subir">
        <ArrowUp size={15} />
      </button>
      <button onClick={onDown} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink" aria-label="Descer">
        <ArrowDown size={15} />
      </button>
      {onDelete && (
        <button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#fff5f5] hover:text-[#d70015]" aria-label="Remover">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

/* ---------- Banner ---------- */
function BannerTab({ sf, setSf, products }: TabProps & { products: Product[] }) {
  const [edit, setEdit] = useState<HeroSlide | null>(null);
  const upd = (slides: HeroSlide[]) => setSf((s) => ({ ...s, heroSlides: slides }));
  return (
    <>
      <Panel
        title="Slides do banner"
        subtitle="O banner grande do início do site. Passa sozinho a cada 7 segundos, na ordem abaixo."
        actions={
          <AButton
            size="sm"
            variant="primary"
            onClick={() =>
              setEdit({ id: uid(), active: true, eyebrow: "Novo", title: "", subtitle: "", ctaLabel: "Comprar agora", ctaHref: "", glow: "#0071e3", eyebrowColor: "#bf4800" })
            }
          >
            <Plus size={14} /> Novo slide
          </AButton>
        }
      >
        <ul className="space-y-3">
          {sf.heroSlides.map((s, i) => {
            const p = products.find((x) => x.id === s.productId);
            return (
              <li key={s.id} className={cn("flex items-center gap-4 rounded-2xl bg-[#f5f5f7] p-3 pr-2", !s.active && "opacity-50")}>
                <SlideThumb slide={s} product={p} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold" style={{ color: s.eyebrowColor }}>
                    {s.eyebrow}
                  </p>
                  <p className="truncate text-[15px] font-semibold">{s.title || p?.name || "Sem título"}</p>
                  <p className="truncate text-[12.5px] text-muted">{s.subtitle}</p>
                  {p ? <p className="mt-0.5 text-[12px] text-muted">Produto: {p.name} {p.storage} · {money(p.price)}{!p.active || p.stock === 0 ? " · indisponível (slide não aparece)" : ""}</p> : null}
                </div>
                <Switch checked={s.active} onChange={(v) => upd(sf.heroSlides.map((x) => (x.id === s.id ? { ...x, active: v } : x)))} />
                <OrderBtns
                  onEdit={() => setEdit(s)}
                  onUp={() => upd(moveIn(sf.heroSlides, i, -1))}
                  onDown={() => upd(moveIn(sf.heroSlides, i, 1))}
                  onDelete={() => confirm("Remover este slide?") && upd(sf.heroSlides.filter((x) => x.id !== s.id))}
                />
              </li>
            );
          })}
        </ul>
      </Panel>
      {edit && (
        <SlideModal
          slide={edit}
          products={products}
          onClose={() => setEdit(null)}
          onSave={(s) => {
            upd(sf.heroSlides.some((x) => x.id === s.id) ? sf.heroSlides.map((x) => (x.id === s.id ? s : x)) : [...sf.heroSlides, s]);
            setEdit(null);
          }}
        />
      )}
    </>
  );
}

function SlideThumb({ slide, product }: { slide: HeroSlide; product?: Product }) {
  if (slide.imageMode === "banner" && slide.image) {
    return (
      <span className="relative h-[72px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-[#ececf0]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className="relative grid h-[72px] w-[120px] shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-b from-white to-[#ececf0]">
      <span className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-40 blur-xl" style={{ background: slide.glow }} />
      {slide.imageMode === "lado" && slide.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.image} alt="" className="relative h-[85%] w-[70%] object-contain" />
      ) : (
        <span className="relative h-[85%] w-[50%] rotate-[14deg]">{product ? <ProductMedia p={product} /> : null}</span>
      )}
    </span>
  );
}

type SlideKind = "texto" | "banner" | "lado";

function SlideModal({ slide, products, onClose, onSave }: { slide: HeroSlide; products: Product[]; onClose: () => void; onSave: (s: HeroSlide) => void }) {
  const [s, setS] = useState(slide);
  const set = <K extends keyof HeroSlide>(k: K, v: HeroSlide[K]) => setS((x) => ({ ...x, [k]: v }));
  const p = products.find((x) => x.id === s.productId);
  const kind: SlideKind = s.imageMode ?? "texto";
  const setKind = (k: SlideKind) => setS((x) => ({ ...x, imageMode: k === "texto" ? undefined : k }));
  const missingPhoto = kind !== "texto" && !s.image;
  return (
    <Modal
      open
      width={640}
      onClose={onClose}
      title="Slide do banner"
      footer={
        <>
          <AButton onClick={onClose}>Cancelar</AButton>
          <AButton variant="accent" disabled={missingPhoto} onClick={() => onSave(s)}>
            Aplicar
          </AButton>
        </>
      }
    >
      <Segmented
        items={[
          { value: "texto", label: "Texto e produto" },
          { value: "banner", label: "Banner com foto" },
          { value: "lado", label: "Foto e texto" },
        ]}
        value={kind}
        onChange={setKind}
        className="mb-4"
      />

      {/* prévia */}
      {kind === "banner" ? (
        <div className="mb-5 overflow-hidden rounded-2xl bg-[#f2f2f5]">
          {s.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.image} alt="" className="aspect-[2.9/1] w-full object-cover" />
          ) : (
            <div className="grid aspect-[2.9/1] place-items-center px-6 text-center text-[13px] text-muted">A prévia aparece aqui quando você enviar a foto</div>
          )}
        </div>
      ) : (
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-b from-[#fbfbfd] to-[#f2f2f5] p-6">
          <span className="absolute -right-10 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl" style={{ background: s.glow }} />
          <div className="relative grid grid-cols-[1fr_120px] items-center gap-4">
            <div>
              <p className="text-[14px] font-semibold" style={{ color: s.eyebrowColor }}>
                {s.eyebrow}
              </p>
              <p className="text-[26px] font-bold leading-tight tracking-[-0.03em]">{s.title || p?.name || "Título"}</p>
              <p className="mt-1 text-[15px] font-medium text-muted">{s.subtitle || "Frase do slide"}</p>
              <span className="mt-3 inline-flex h-9 items-center rounded-full bg-[#1d1d1f] px-4 text-[13px] text-white">{s.ctaLabel || "Comprar agora"}</span>
            </div>
            {kind === "lado" ? (
              s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="h-[130px] w-full object-contain" />
              ) : (
                <span className="grid h-[130px] place-items-center rounded-xl border border-dashed border-black/15 text-center text-[11.5px] text-muted">sua foto</span>
              )
            ) : (
              <span className="h-[130px] rotate-[14deg]">{p ? <ProductMedia p={p} /> : null}</span>
            )}
          </div>
        </div>
      )}

      {kind !== "texto" && (
        <div className="mb-5 grid gap-3 sm:grid-cols-[1.6fr_1fr]">
          <PhotoSlot
            label="Foto para computador"
            hint={kind === "banner" ? "ideal 2400 × 830 px" : "PNG sem fundo fica melhor"}
            aspect={kind === "banner" ? "aspect-[2.9/1]" : "aspect-[4/3]"}
            max={kind === "banner" ? 2400 : 1600}
            value={s.image}
            onChange={(v) => set("image", v)}
          />
          <PhotoSlot
            label="Foto para celular"
            hint={kind === "banner" ? "opcional · 1080 × 1350 px" : "opcional"}
            aspect={kind === "banner" ? "aspect-[4/5]" : "aspect-[4/3]"}
            max={1400}
            value={s.imageMobile}
            onChange={(v) => set("imageMobile", v)}
          />
        </div>
      )}

      {kind === "banner" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Link ao clicar" hint="vazio = loja">
            <TextInput value={s.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/loja?c=iphone" />
          </FormField>
          <FormField label="Descrição da foto" hint="leitores de tela e Google">
            <TextInput value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Black Friday Brian iPhones" />
          </FormField>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Produto do slide" hint={kind === "lado" ? "preço" : "foto e preço"} className="sm:col-span-2">
            <SelectInput
              value={s.productId ?? ""}
              onChange={(e) => {
                const np = products.find((x) => x.id === e.target.value);
                setS((x) => ({ ...x, productId: e.target.value || undefined, title: x.title || np?.name || "", glow: np ? np.colorHex : x.glow }));
              }}
            >
              <option value="">Sem produto</option>
              {products.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.storage} · {x.color} {!x.active || x.stock === 0 ? "(indisponível)" : ""}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Selo acima do título">
            <TextInput value={s.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="Novo, Seminovo, Oferta…" />
          </FormField>
          <FormField label="Cor do selo">
            <ColorInput value={s.eyebrowColor} onChange={(v) => set("eyebrowColor", v)} presets={["#bf4800", "#0071e3", "#1f8a3e", "#d70015", "#1d1d1f"]} />
          </FormField>
          <FormField label="Título" className="sm:col-span-2">
            <TextInput value={s.title} onChange={(e) => set("title", e.target.value)} placeholder={p?.name ?? "Ex.: iPhone 17 Pro Max"} />
          </FormField>
          <FormField label="Frase" className="sm:col-span-2">
            <TextInput value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Potência, câmera e design em outro nível." />
          </FormField>
          <FormField label="Texto do botão">
            <TextInput value={s.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
          </FormField>
          <FormField label="Link do botão" hint={p ? "vazio = página do produto" : ""}>
            <TextInput value={s.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/loja?c=iphone" />
          </FormField>
          <FormField label="Cor do brilho de fundo" className="sm:col-span-2">
            <ColorInput value={s.glow} onChange={(v) => set("glow", v)} presets={["#c8662f", "#2d3a52", "#c9d7e6", "#bfa48a", "#5b6fd6", "#b7c2a6", "#e9cfd2", "#0071e3"]} />
          </FormField>
        </div>
      )}
    </Modal>
  );
}

/** Caixa de foto: clica ou arrasta, comprime e envia pro Storage */
function PhotoSlot({
  label,
  hint,
  aspect,
  max,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  aspect: string;
  max: number;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const send = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    setError("");
    try {
      const data = await compressImage(file, max, 0.86);
      onChange(hasSupabase ? await uploadImage(data, "banners") : data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar a foto");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-[#424245]">{label}</span>
        <span className="truncate text-[11.5px] text-faint">{hint}</span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          send(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-dashed bg-[#f5f5f7] transition-colors",
          aspect,
          over ? "border-[#0071e3] bg-[#0071e3]/5" : "border-black/15",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-medium transition-opacity",
            value ? "bg-black/45 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100" : "text-muted hover:text-ink",
            busy && "opacity-100",
          )}
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {busy ? "Enviando…" : value ? "Trocar foto" : "Escolher foto"}
        </button>
        {value && !busy ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label="Remover foto"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-[12px] text-[#d70015]">{error}</p> : null}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          send(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ---------- Vitrines ---------- */
function ShelvesTab({ sf, setSf, products }: TabProps & { products: Product[] }) {
  const [edit, setEdit] = useState<ShelfConfig | null>(null);
  const upd = (shelves: ShelfConfig[]) => setSf((s) => ({ ...s, shelves }));
  const count = (sh: ShelfConfig) => resolveShelf(sh, products).length;
  return (
    <>
      <Panel
        title="Vitrines da página inicial"
        subtitle="Fileiras de produtos que aparecem no início do site, na ordem abaixo."
        actions={
          <AButton
            size="sm"
            variant="primary"
            onClick={() => setEdit({ id: uid(), active: true, title: "", subtitle: "", href: "/loja", mode: "auto", category: "", condition: "", onlyFeatured: false, productIds: [], limit: 10 })}
          >
            <Plus size={14} /> Nova vitrine
          </AButton>
        }
      >
        <ul className="space-y-3">
          {sf.shelves.map((sh, i) => (
            <li key={sh.id} className={cn("flex items-center gap-4 rounded-2xl bg-[#f5f5f7] p-4 pr-2", !sh.active && "opacity-50")}>
              <div className="flex -space-x-3">
                {resolveShelf(sh, products)
                  .slice(0, 4)
                  .map((p) => (
                    <span key={p.id} className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white p-1.5 ring-2 ring-[#f5f5f7]">
                      <ProductMedia p={p} />
                    </span>
                  ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">
                  {sh.title} <span className="font-normal text-faint">{sh.subtitle}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] text-muted">
                  {sh.mode === "manual" ? "Escolha manual" : describeAuto(sh)} · {count(sh)} produto(s) agora
                </p>
              </div>
              <Switch checked={sh.active} onChange={(v) => upd(sf.shelves.map((x) => (x.id === sh.id ? { ...x, active: v } : x)))} />
              <OrderBtns
                onEdit={() => setEdit(sh)}
                onUp={() => upd(moveIn(sf.shelves, i, -1))}
                onDown={() => upd(moveIn(sf.shelves, i, 1))}
                onDelete={() => confirm("Remover esta vitrine?") && upd(sf.shelves.filter((x) => x.id !== sh.id))}
              />
            </li>
          ))}
        </ul>
      </Panel>
      {edit && (
        <ShelfModal
          shelf={edit}
          products={products}
          onClose={() => setEdit(null)}
          onSave={(s) => {
            upd(sf.shelves.some((x) => x.id === s.id) ? sf.shelves.map((x) => (x.id === s.id ? s : x)) : [...sf.shelves, s]);
            setEdit(null);
          }}
        />
      )}
    </>
  );
}

function describeAuto(sh: ShelfConfig) {
  const parts = [sh.category ? CATEGORY_LABEL[sh.category] : "Todas as categorias", sh.condition === "novo" ? "lacrados" : sh.condition === "seminovo" ? "seminovos" : sh.condition === "vitrine" ? "vitrine" : "", sh.onlyFeatured ? "só destaques" : ""];
  return "Automática: " + parts.filter(Boolean).join(", ");
}

function ShelfModal({ shelf, products, onClose, onSave }: { shelf: ShelfConfig; products: Product[]; onClose: () => void; onSave: (s: ShelfConfig) => void }) {
  const [s, setS] = useState(shelf);
  const set = <K extends keyof ShelfConfig>(k: K, v: ShelfConfig[K]) => setS((x) => ({ ...x, [k]: v }));
  const toggle = (id: string) => set("productIds", s.productIds.includes(id) ? s.productIds.filter((x) => x !== id) : [...s.productIds, id]);
  const preview = resolveShelf(s, products);
  return (
    <Modal
      open
      width={720}
      onClose={onClose}
      title="Vitrine"
      footer={
        <>
          <AButton onClick={onClose}>Cancelar</AButton>
          <AButton variant="accent" disabled={!s.title.trim()} onClick={() => onSave(s)}>
            Aplicar
          </AButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Título" hint="em preto">
          <TextInput value={s.title} onChange={(e) => set("title", e.target.value)} placeholder="Os mais procurados." />
        </FormField>
        <FormField label="Complemento" hint="em cinza">
          <TextInput value={s.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="O que mais sai essa semana." />
        </FormField>
        <FormField label="Link do “Ver tudo”">
          <TextInput value={s.href} onChange={(e) => set("href", e.target.value)} />
        </FormField>
        <FormField label="Máximo de produtos">
          <TextInput type="number" min={1} max={20} value={s.limit} onChange={(e) => set("limit", Math.max(1, Number(e.target.value)))} />
        </FormField>
      </div>

      <p className="mt-5 text-[13px] font-medium text-[#424245]">Como escolher os produtos</p>
      <Segmented
        className="mt-2"
        items={[
          { value: "auto", label: "Automático, por filtro" },
          { value: "manual", label: "Escolher à mão" },
        ]}
        value={s.mode}
        onChange={(v) => set("mode", v)}
      />

      {s.mode === "auto" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <FormField label="Categoria">
            <SelectInput value={s.category ?? ""} onChange={(e) => set("category", e.target.value as Category | "")}>
              <option value="">Todas</option>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Estado">
            <SelectInput value={s.condition ?? ""} onChange={(e) => set("condition", e.target.value as Condition | "")}>
              <option value="">Todos</option>
              <option value="novo">Lacrados</option>
              <option value="seminovo">Seminovos e vitrine</option>
            </SelectInput>
          </FormField>
          <FormField label="Destaques">
            <div className="flex h-10 items-center">
              <Switch checked={!!s.onlyFeatured} onChange={(v) => set("onlyFeatured", v)} label="Só em destaque" />
            </div>
          </FormField>
        </div>
      ) : (
        <ul className="mt-4 max-h-[300px] divide-y divide-black/[0.05] overflow-y-auto rounded-2xl ring-1 ring-black/[0.06]">
          {products.map((p) => {
            const on = s.productIds.includes(p.id);
            return (
              <li key={p.id}>
                <button onClick={() => toggle(p.id)} className={cn("flex w-full items-center gap-3 px-3 py-2 text-left", on && "bg-[#f2f7fe]")}>
                  <Checkbox checked={on} onChange={() => toggle(p.id)} />
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f5f5f7] p-1">
                    <ProductMedia p={p} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">
                    {p.name} {p.storage} · {p.color}
                  </span>
                  {on ? <Badge tone="blue">{s.productIds.indexOf(p.id) + 1}º</Badge> : null}
                  {!p.active || p.stock === 0 ? <Badge tone="red">indisponível</Badge> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-5 text-[12.5px] text-muted">Prévia: {preview.length} produto(s)</p>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {preview.map((p) => (
          <span key={p.id} className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#f5f5f7] p-2">
            <ProductMedia p={p} />
          </span>
        ))}
      </div>
    </Modal>
  );
}

/* ---------- Categorias ---------- */
function CategoriesTab({ sf, setSf }: TabProps) {
  const upd = (categories: CategoryTile[]) => setSf((s) => ({ ...s, categories }));
  const set = (id: string, patch: Partial<CategoryTile>) => upd(sf.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  return (
    <Panel
      title="Compre por categoria"
      subtitle="Os blocos de categoria da página inicial"
      actions={
        <AButton size="sm" variant="primary" onClick={() => upd([...sf.categories, { id: uid(), active: true, label: "Nova categoria", href: "/loja", art: "iphone", color: "#4a4f5c" }])}>
          <Plus size={14} /> Adicionar
        </AButton>
      }
    >
      <ul className="grid gap-3 lg:grid-cols-2">
        {sf.categories.map((c, i) => (
          <li key={c.id} className={cn("rounded-2xl bg-[#f5f5f7] p-4", !c.active && "opacity-50")}>
            <div className="flex items-start gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-white p-3">
                {c.art === "magsafe" ? <span className="h-12 w-12 rounded-full bg-gradient-to-br from-white to-[#d2d2d7] ring-1 ring-black/10" /> : <DeviceArt id={`adm-${c.id}`} category={c.art} name={c.label} color={c.color} className="h-full w-full" />}
              </span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <TextInput value={c.label} onChange={(e) => set(c.id, { label: e.target.value })} className="bg-white" />
                <TextInput value={c.href} onChange={(e) => set(c.id, { href: e.target.value })} className="bg-white" />
                <SelectInput value={c.art} onChange={(e) => set(c.id, { art: e.target.value as CategoryTile["art"] })} className="bg-white">
                  <option value="iphone">Desenho: iPhone</option>
                  <option value="macbook">Desenho: MacBook</option>
                  <option value="ipad">Desenho: iPad</option>
                  <option value="watch">Desenho: Watch</option>
                  <option value="acessorio">Desenho: AirPods</option>
                  <option value="magsafe">Desenho: carregador</option>
                </SelectInput>
                <div className="flex items-center gap-2">
                  <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-black/10" style={{ background: c.color }}>
                    <input type="color" value={c.color} onChange={(e) => set(c.id, { color: e.target.value })} className="absolute inset-0 opacity-0" />
                  </label>
                  <Switch checked={c.active} onChange={(v) => set(c.id, { active: v })} />
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <OrderBtns onUp={() => upd(moveIn(sf.categories, i, -1))} onDown={() => upd(moveIn(sf.categories, i, 1))} onDelete={() => upd(sf.categories.filter((x) => x.id !== c.id))} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- Vantagens ---------- */
const PERK_ICONS: { value: Perk["icon"]; label: string }[] = [
  { value: "truck", label: "Caminhão" },
  { value: "bag", label: "Sacola" },
  { value: "card", label: "Cartão" },
  { value: "shield", label: "Escudo" },
  { value: "store", label: "Loja" },
  { value: "swap", label: "Troca" },
];

function PerksTab({ sf, setSf }: TabProps) {
  const upd = (perks: Perk[]) => setSf((s) => ({ ...s, perks }));
  const set = (id: string, patch: Partial<Perk>) => upd(sf.perks.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  return (
    <Panel title="Faixa de vantagens" subtitle="Aparece no topo do site (faixa cinza) e logo abaixo do banner. Use até 4.">
      <ul className="grid gap-3 lg:grid-cols-2">
        {sf.perks.map((p, i) => (
          <li key={p.id} className="space-y-2 rounded-2xl bg-[#f5f5f7] p-4">
            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <SelectInput value={p.icon} onChange={(e) => set(p.id, { icon: e.target.value as Perk["icon"] })} className="bg-white">
                {PERK_ICONS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </SelectInput>
              <TextInput value={p.title} onChange={(e) => set(p.id, { title: e.target.value })} className="bg-white font-medium" />
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
              <TextInput value={p.text} onChange={(e) => set(p.id, { text: e.target.value })} className="bg-white" />
              <TextInput value={p.href} onChange={(e) => set(p.id, { href: e.target.value })} className="bg-white" />
            </div>
            <div className="flex justify-end">
              <OrderBtns onUp={() => upd(moveIn(sf.perks, i, -1))} onDown={() => upd(moveIn(sf.perks, i, 1))} onDelete={() => upd(sf.perks.filter((x) => x.id !== p.id))} />
            </div>
          </li>
        ))}
      </ul>
      {sf.perks.length < 4 && (
        <AButton size="sm" className="mt-3" onClick={() => upd([...sf.perks, { id: uid(), icon: "shield", title: "Nova vantagem", text: "Descrição curta", href: "/" }])}>
          <Plus size={14} /> Adicionar vantagem
        </AButton>
      )}
    </Panel>
  );
}

/* ---------- Aviso ---------- */
function AnnouncementTab({ sf, setSf }: TabProps) {
  const a = sf.announcement;
  const set = (patch: Partial<Storefront["announcement"]>) => setSf((s) => ({ ...s, announcement: { ...s.announcement, ...patch } }));
  return (
    <Panel title="Aviso no topo do site" subtitle="Uma faixa acima de tudo, pra promoção, feriado ou recado rápido." actions={<Switch checked={a.active} onChange={(v) => set({ active: v })} label={a.active ? "Ligado" : "Desligado"} />}>
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
        <div className="flex h-10 items-center justify-center gap-2 px-4 text-[13px] font-medium" style={{ background: a.bg, color: a.fg }}>
          <Megaphone size={15} /> {a.text || "Texto do aviso"}
        </div>
        <div className="h-16 bg-white" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField label="Texto" className="sm:col-span-2">
          <TextInput value={a.text} onChange={(e) => set({ text: e.target.value })} />
        </FormField>
        <FormField label="Link" className="sm:col-span-2">
          <TextInput value={a.href} onChange={(e) => set({ href: e.target.value })} />
        </FormField>
        <FormField label="Cor de fundo">
          <ColorInput value={a.bg} onChange={(v) => set({ bg: v })} presets={["#1d1d1f", "#0071e3", "#bf4800", "#d70015", "#1f8a3e", "#f5f5f7"]} />
        </FormField>
        <FormField label="Cor do texto">
          <ColorInput value={a.fg} onChange={(v) => set({ fg: v })} presets={["#ffffff", "#1d1d1f"]} />
        </FormField>
      </div>
    </Panel>
  );
}

/* ---------- Cores ---------- */
function ThemeTab({ sf, setSf }: TabProps) {
  const t = sf.theme;
  const set = (patch: Partial<Storefront["theme"]>) => setSf((s) => ({ ...s, theme: { ...s.theme, ...patch } }));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <Panel title="Cores e estilo" subtitle="Vale para o site inteiro">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Cor de destaque" hint="botões azuis e links">
            <ColorInput value={t.accent} onChange={(v) => set({ accent: v })} presets={["#0071e3", "#2f6fd0", "#5856d6", "#1f8a3e", "#bf4800", "#d70015", "#1d1d1f"]} />
          </FormField>
          <FormField label="Cor do selo “Novo”" hint="selos e descontos">
            <ColorInput value={t.highlight} onChange={(v) => set({ highlight: v })} presets={["#bf4800", "#d70015", "#0071e3", "#1f8a3e", "#8e54e9"]} />
          </FormField>
          <FormField label="Botão principal" hint="“Comprar agora”">
            <ColorInput value={t.primary} onChange={(v) => set({ primary: v })} presets={["#1d1d1f", "#0071e3", "#122b45", "#3a3a3c"]} />
          </FormField>
          <FormField label="Fundo dos blocos" hint="cinza das categorias">
            <ColorInput value={t.surface} onChange={(v) => set({ surface: v })} presets={["#f5f5f7", "#f2f4f8", "#f7f4ef", "#eef3f2", "#ffffff"]} />
          </FormField>
          <FormField label="Arredondamento dos cards" hint={`${t.radius}px`} className="sm:col-span-2">
            <input type="range" min={4} max={32} value={t.radius} onChange={(e) => set({ radius: Number(e.target.value) })} className="h-2 w-full cursor-pointer accent-[#0071e3]" />
          </FormField>
        </div>
      </Panel>

      <Panel title="Prévia" subtitle="Assim os elementos ficam no site" actions={<Palette size={16} className="text-faint" />}>
        <div className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06]">
          <p className="text-[13px] font-semibold" style={{ color: t.highlight }}>
            Novo
          </p>
          <p className="-mt-3 text-[24px] font-bold tracking-[-0.03em]">iPhone 17 Pro</p>
          <div className="flex gap-2">
            <span className="inline-flex h-10 items-center rounded-full px-5 text-[14px] font-medium text-white" style={{ background: t.primary }}>
              Comprar agora
            </span>
            <span className="inline-flex h-10 items-center rounded-full px-5 text-[14px] font-medium text-white" style={{ background: t.accent }}>
              Comprar
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["iPhone", "MacBook"].map((x) => (
              <div key={x} className="p-4" style={{ background: t.surface, borderRadius: t.radius }}>
                <p className="text-[14px] font-medium">{x}</p>
                <p className="text-[12px]" style={{ color: t.accent }}>
                  Ver tudo ›
                </p>
              </div>
            ))}
          </div>
          <p className="text-[13px]" style={{ color: t.accent }}>
            Link de exemplo ›
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">
          {[t.accent, t.highlight, t.primary, t.surface].map((c, i) => (
            <span key={i} className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
          ))}
          <span className="ml-1">Paleta atual</span>
          {JSON.stringify(t) !== JSON.stringify(DEFAULT_STOREFRONT.theme) && (
            <button onClick={() => set(DEFAULT_STOREFRONT.theme)} className="ml-auto text-[#0071e3] hover:underline">
              Voltar ao padrão
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}
