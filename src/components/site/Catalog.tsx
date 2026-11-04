"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/site";
import type { Category, Condition, Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { Close, Sliders } from "@/components/ui/Icons";
import { useSettings } from "./useSettings";
import { waLink } from "@/lib/whatsapp";

const CATS: Category[] = ["iphone", "macbook", "ipad", "watch", "acessorio"];
const CONDS: { id: Condition; label: string }[] = [
  { id: "novo", label: "Lacrado" },
  { id: "seminovo", label: "Seminovo" },
  { id: "vitrine", label: "Vitrine" },
];
const PRICES = [
  { id: "0-2000", label: "Até R$ 2.000", min: 0, max: 2000 },
  { id: "2000-5000", label: "R$ 2.000 a R$ 5.000", min: 2000, max: 5000 },
  { id: "5000-8000", label: "R$ 5.000 a R$ 8.000", min: 5000, max: 8000 },
  { id: "8000+", label: "Acima de R$ 8.000", min: 8000, max: Infinity },
];
type Sort = "relevancia" | "menor" | "maior" | "recentes";

export function Catalog() {
  const db = useDB();
  const settings = useSettings();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cat = params.get("c") as Category | null;
  const cond = params.get("e") as Condition | null;
  const q = params.get("q") ?? "";
  const [storage, setStorage] = useState<string[]>([]);
  const [price, setPrice] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("relevancia");
  const [sheet, setSheet] = useState(false);

  const setParam = (k: string, v: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (v === null) sp.delete(k);
    else sp.set(k, v);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const base = useMemo(() => {
    let l = (db?.products ?? []).filter((p) => p.active && p.stock > 0);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      l = l.filter((p) => `${p.name} ${p.storage} ${p.color} ${CATEGORY_LABEL[p.category]}`.toLowerCase().includes(t));
    }
    return l;
  }, [db, q]);

  const list = useMemo(() => {
    let l = base;
    if (cat) l = l.filter((p) => p.category === cat);
    if (cond) l = l.filter((p) => p.condition === cond);
    if (storage.length) l = l.filter((p) => storage.includes(p.storage));
    const pr = PRICES.find((x) => x.id === price);
    if (pr) l = l.filter((p) => p.price >= pr.min && p.price < pr.max);
    if (sort === "menor") l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === "maior") l = [...l].sort((a, b) => b.price - a.price);
    else if (sort === "recentes") l = [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else l = [...l].sort((a, b) => Number(b.featured) - Number(a.featured));
    return l;
  }, [base, cat, cond, storage, price, sort]);

  const storages = useMemo(() => {
    const set = new Set((cat ? base.filter((p) => p.category === cat) : base).map((p) => p.storage));
    return [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [base, cat]);

  const count = (f: (p: Product) => boolean) => base.filter(f).length;

  const title = q ? `Resultados para “${q}”` : cat ? CATEGORY_LABEL[cat] : cond === "novo" ? "Lacrados" : cond === "seminovo" ? "Seminovos" : "Todos os produtos";

  const chips: { label: string; clear: () => void }[] = [
    ...(q ? [{ label: `“${q}”`, clear: () => setParam("q", null) }] : []),
    ...(cat ? [{ label: CATEGORY_LABEL[cat], clear: () => setParam("c", null) }] : []),
    ...(cond ? [{ label: CONDS.find((c) => c.id === cond)?.label ?? cond, clear: () => setParam("e", null) }] : []),
    ...storage.map((s) => ({ label: s, clear: () => setStorage((x) => x.filter((y) => y !== s)) })),
    ...(price ? [{ label: PRICES.find((p) => p.id === price)!.label, clear: () => setPrice(null) }] : []),
  ];
  const clearAll = () => {
    setStorage([]);
    setPrice(null);
    router.replace(pathname, { scroll: false });
  };

  const filters = (
    <div className="space-y-7">
      <Group title="Categoria">
        <Radio active={!cat} onClick={() => setParam("c", null)} label="Todas" n={db ? base.length : undefined} />
        {CATS.map((c) => (
          <Radio key={c} active={cat === c} onClick={() => setParam("c", c)} label={CATEGORY_LABEL[c]} n={db ? count((p) => p.category === c) : undefined} />
        ))}
      </Group>
      <Group title="Estado">
        <Radio active={!cond} onClick={() => setParam("e", null)} label="Todos" />
        {CONDS.map((c) => (
          <Radio key={c.id} active={cond === c.id} onClick={() => setParam("e", c.id)} label={c.label} n={db ? count((p) => p.condition === c.id && (!cat || p.category === cat)) : undefined} />
        ))}
      </Group>
      {storages.length > 1 && (
        <Group title="Armazenamento">
          <div className="flex flex-wrap gap-1.5">
            {storages.map((s) => {
              const on = storage.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => setStorage((x) => (on ? x.filter((y) => y !== s) : [...x, s]))}
                  className={`h-8 rounded-full px-3 text-[12.5px] transition-colors ${on ? "btn-accent" : "border border-line bg-white hover:border-accent/40"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Group>
      )}
      <Group title="Preço">
        <Radio active={!price} onClick={() => setPrice(null)} label="Qualquer valor" />
        {PRICES.map((p) => (
          <Radio key={p.id} active={price === p.id} onClick={() => setPrice(p.id)} label={p.label} />
        ))}
      </Group>
      <div className="surface rounded-[16px] p-4">
        <p className="text-[14px] font-semibold">Não achou o modelo?</p>
        <p className="mt-1 text-[13px] leading-[1.5] text-muted">Chega aparelho toda semana. Fala com a loja que a gente procura pra você.</p>
        <a
          href={waLink(settings.whatsapp, "Olá, Brian! Estou procurando um aparelho que não achei no site.")}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-[13px] font-medium underline underline-offset-4"
        >
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  );

  return (
    <>
      <nav className="flex gap-2 text-[13px] text-muted">
        <Link href="/" className="hover:text-ink">Início</Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-ink">Loja</Link>
        {cat ? (
          <>
            <span>/</span>
            <span className="text-ink">{CATEGORY_LABEL[cat]}</span>
          </>
        ) : null}
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.03em] sm:text-[30px] md:text-[38px]">{title}</h1>
          <p className="mt-1 text-[14px] text-muted tabular">
            {db ? `${list.length} ${list.length === 1 ? "produto" : "produtos"}` : "Carregando…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheet(true)}
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-[13px] font-medium lg:hidden"
          >
            <Sliders size={16} /> Filtros{chips.length ? ` (${chips.length})` : ""}
          </button>
          <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-card pl-4 pr-2 text-[13px]">
            <span className="hidden text-muted sm:inline">Ordenar:</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-full bg-transparent pr-1 font-medium outline-none" aria-label="Ordenar">
              <option value="relevancia">Mais relevantes</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="recentes">Mais recentes</option>
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="flex h-8 items-center gap-1.5 rounded-full bg-accent-soft pl-3 pr-2 text-[12.5px] font-medium text-accent ring-1 ring-accent/20">
              {c.label} <Close size={13} />
            </button>
          ))}
          <button onClick={clearAll} className="ml-1 text-[13px] font-medium underline underline-offset-4">
            Limpar tudo
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[132px]">{filters}</div>
        </aside>

        <div>
          {db && list.length === 0 ? (
            <div className="surface rounded-[20px] px-6 py-20 text-center">
              <p className="text-[22px] font-bold tracking-[-0.02em]">Nada encontrado com esses filtros</p>
              <p className="mt-2 text-[14px] text-muted">Tente tirar algum filtro, ou pergunta no WhatsApp se está procurando algo específico.</p>
              <button onClick={clearAll} className="mt-6 h-11 rounded-full bg-ink px-6 text-[14px] font-medium text-paper">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {db ? list.map((p) => <ProductCard key={p.id} p={p} />) : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Filtros no celular */}
      <div className={`fixed inset-0 z-[70] lg:hidden ${sheet ? "" : "pointer-events-none"}`} aria-hidden={!sheet}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${sheet ? "opacity-100" : "opacity-0"}`} onClick={() => setSheet(false)} />
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[18px] bg-paper transition-transform duration-500 ease-[var(--ease-out-quint)] ${
            sheet ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-line px-5">
            <p className="text-[16px] font-semibold">Filtros</p>
            <button onClick={() => setSheet(false)} className="grid h-10 w-10 place-items-center" aria-label="Fechar filtros">
              <Close />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">{filters}</div>
          <div className="flex gap-2 border-t border-line p-4">
            <button onClick={clearAll} className="h-12 flex-1 rounded-full border border-line text-[14px] font-medium">
              Limpar
            </button>
            <button onClick={() => setSheet(false)} className="h-12 flex-[2] rounded-full bg-ink text-[14px] font-medium text-paper tabular">
              Ver {list.length} {list.length === 1 ? "produto" : "produtos"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">{title}</p>
      <div className="mt-3 space-y-0.5">{children}</div>
    </div>
  );
}

function Radio({ active, onClick, label, n }: { active: boolean; onClick: () => void; label: string; n?: number }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[6px] py-1.5 text-left text-[14px]">
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${active ? "border-accent" : "border-ink/30"}`}>
        {active && <span className="h-2 w-2 rounded-full bg-accent" />}
      </span>
      <span className={active ? "font-semibold" : "text-graphite"}>{label}</span>
      {typeof n === "number" && <span className="ml-auto text-[12px] text-muted tabular">{n}</span>}
    </button>
  );
}

