"use client";

import type { Product } from "@/lib/types";
import { Shelf } from "./HomeSections";

const featured = (p: Product) => p.featured;
const used = (p: Product) => p.condition !== "novo" && p.category === "iphone";
const sealed = (p: Product) => p.condition === "novo";
const others = (p: Product) => p.category !== "iphone";

export function HomeShelves({ trade }: { trade: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-[1320px] space-y-12 px-6 pt-14 md:space-y-16 md:px-8 md:pt-20">
        <Shelf title="Os mais procurados." subtitle="O que mais sai na loja essa semana." href="/loja" filter={featured} />
        <Shelf title="iPhone seminovo." subtitle="Revisado, com bateria medida e garantia." href="/loja?c=iphone&e=seminovo" filter={used} />
      </div>
      <div className="pt-10 md:pt-14">{trade}</div>
      <div className="mx-auto max-w-[1320px] space-y-12 px-6 pt-14 md:space-y-16 md:px-8 md:pt-20">
        <Shelf title="Lacrados." subtitle="Novos, na caixa." href="/loja?e=novo" filter={sealed} />
        <Shelf title="Mac, iPad, Watch e AirPods." subtitle="Pra completar o seu kit." href="/loja" filter={others} />
      </div>
    </>
  );
}
