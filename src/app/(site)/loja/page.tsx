import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalog } from "@/components/site/Catalog";

export const metadata: Metadata = { title: "Loja" };

export default function LojaPage() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-24 pt-6 md:px-8 md:pt-8">
      <Suspense fallback={<div className="h-[70vh]" />}>
        <Catalog />
      </Suspense>
    </section>
  );
}
