import type { Metadata } from "next";
import { Suspense } from "react";
import { TradeInForm } from "@/components/site/TradeInForm";

export const metadata: Metadata = {
  title: "Troca na entrada",
  description: "Avalie seu iPhone e use como entrada no aparelho novo.",
};

export default function TrocaPage() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
      <div className="grid gap-6 border-b border-line pb-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="label text-muted">Troca na entrada</p>
          <h1 className="display mt-4 text-[48px] md:text-[88px]">
            Quanto vale
            <br />o seu iPhone?
          </h1>
        </div>
        <p className="max-w-[380px] text-[15px] leading-[1.6] text-muted md:col-span-4 md:justify-self-end">
          Três passos, uns dois minutos. A avaliação chega pelo WhatsApp e o valor entra como parte do pagamento.
        </p>
      </div>
      <Suspense fallback={<div className="h-[70vh]" />}>
        <TradeInForm />
      </Suspense>
    </section>
  );
}
