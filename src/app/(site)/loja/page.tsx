import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/site/Catalog";

export const metadata: Metadata = { title: "Loja" };

export default function LojaPage() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-28 pt-28 md:px-8 md:pt-36">
      <div className="grid gap-6 border-b border-line pb-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="label text-muted">Loja</p>
          <h1 className="display mt-4 text-[52px] md:text-[96px]">Aparelhos</h1>
        </div>
        <p className="max-w-[380px] text-[15px] leading-[1.6] text-muted md:col-span-4 md:justify-self-end">
          Estoque atualizado pela loja. Gostou de algum? Pede o orçamento que a conversa já abre no WhatsApp.
        </p>
      </div>
      <Suspense fallback={<div className="h-[60vh]" />}>
        <Catalog />
      </Suspense>
    </section>
  );
}
