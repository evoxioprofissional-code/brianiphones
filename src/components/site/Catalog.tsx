"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/site";
import type { Category, Condition } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Search } from "@/components/ui/Icons";

const CATS: (Category | "todos")[] = ["todos", "iphone", "macbook", "ipad", "watch", "acessorio"];
type Sort = "destaque" | "menor" | "maior";

export function Catalog() {
  const db = useDB();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cat = (params.get("c") as Category | null) ?? "todos";
  const [cond, setCond] = useState<Condition | "todos">("todos");
  const [sort, setSort] = useState<Sort>("destaque");
  const [q, setQ] = useState("");

  const setCat = (c: string) => {
    const sp = new URLSearchParams(params.toString());
    if (c === "todos") sp.delete("c");
    else sp.set("c", c);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    let l = (db?.products ?? []).filter((p) => p.active && p.stock > 0);
    if (cat !== "todos") l = l.filter((p) => p.category === cat);
    if (cond !== "todos") l = l.filter((p) => p.condition === cond);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      l = l.filter((p) => `${p.name} ${p.storage} ${p.color}`.toLowerCase().includes(t));
    }
    if (sort === "menor") l = [...l].sort((a, b) => a.price - b.price);
    else if (sort === "maior") l = [...l].sort((a, b) => b.price - a.price);
    else l = [...l].sort((a, b) => Number(b.featured) - Number(a.featured));
    return l;
  }, [db, cat, cond, sort, q]);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 border-b border-line bg-paper/92 px-5 backdrop-blur-md md:top-[72px] md:-mx-8 md:px-8">
        <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] transition-colors ${
                  cat === c ? "bg-ink text-paper" : "border border-line text-graphite hover:border-ink/40"
                }`}
              >
                {c === "todos" ? "Todos" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="relative flex-1 lg:w-56 lg:flex-none">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar modelo"
                className="h-9 w-full rounded-full border border-line bg-transparent pl-9 pr-3 text-[13px] outline-none placeholder:text-faint focus:border-ink/50"
              />
            </label>
            <select
              value={cond}
              onChange={(e) => setCond(e.target.value as Condition | "todos")}
              className="h-9 rounded-full border border-line bg-transparent px-3 text-[13px] outline-none"
              aria-label="Estado"
            >
              <option value="todos">Todos os estados</option>
              <option value="novo">Lacrados</option>
              <option value="seminovo">Seminovos</option>
              <option value="vitrine">Vitrine</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-9 rounded-full border border-line bg-transparent px-3 text-[13px] outline-none"
              aria-label="Ordenar"
            >
              <option value="destaque">Destaques</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
          </div>
        </div>
      </div>

      <p className="label mt-8 text-muted tabular">
        {db ? `${list.length} ${list.length === 1 ? "aparelho" : "aparelhos"}` : "Carregando"}
      </p>

      {db && list.length === 0 ? (
        <div className="py-32 text-center">
          <p className="display text-[32px]">Nada por aqui agora.</p>
          <p className="mt-3 text-muted">Chega aparelho toda semana. Pergunta no WhatsApp se está procurando algo específico.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4">
          {(db ? list : []).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
          {!db &&
            Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-[6px] bg-paper-2" />)}
        </div>
      )}
    </>
  );
}
