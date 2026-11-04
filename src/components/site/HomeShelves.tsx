"use client";

import { useDB } from "@/lib/store";
import { resolveShelf } from "@/lib/storefront";
import { Shelf } from "./HomeSections";

/** Vitrines da home, na ordem configurada em Admin > Vitrine. O banner de troca entra depois da 2ª. */
export function HomeShelves({ trade }: { trade: React.ReactNode }) {
  const db = useDB();
  if (!db) {
    return (
      <div className="mx-auto max-w-[1320px] px-6 pt-14 md:px-8 md:pt-20">
        <Shelf title="" href="/loja" list={[]} loading />
      </div>
    );
  }
  const shelves = db.storefront.shelves.filter((s) => s.active).map((s) => ({ s, list: resolveShelf(s, db.products) })).filter((x) => x.list.length);
  const first = shelves.slice(0, 2);
  const rest = shelves.slice(2);
  return (
    <>
      <div className="mx-auto max-w-[1320px] space-y-12 px-6 pt-14 md:space-y-16 md:px-8 md:pt-20">
        {first.map(({ s, list }) => (
          <Shelf key={s.id} title={s.title} subtitle={s.subtitle} href={s.href} list={list} />
        ))}
      </div>
      <div className="pt-10 md:pt-14">{trade}</div>
      {rest.length ? (
        <div className="mx-auto max-w-[1320px] space-y-12 px-6 pt-14 md:space-y-16 md:px-8 md:pt-20">
          {rest.map(({ s, list }) => (
            <Shelf key={s.id} title={s.title} subtitle={s.subtitle} href={s.href} list={list} />
          ))}
        </div>
      ) : null}
    </>
  );
}
