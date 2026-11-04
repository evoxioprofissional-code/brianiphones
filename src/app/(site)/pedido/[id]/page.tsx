import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderView } from "@/components/site/OrderView";

export const metadata: Metadata = { title: "Pedido", robots: { index: false } };

export default function PedidoPage() {
  return (
    <section className="mx-auto max-w-[1320px] px-5 pb-24 pt-8 md:px-8 md:pt-12">
      <Suspense fallback={<div className="h-[70vh]" />}>
        <OrderView />
      </Suspense>
    </section>
  );
}
