import type { Metadata } from "next";
import { OrderLookup } from "@/components/site/OrderLookup";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };

export default function ContaPage() {
  return (
    <section className="mx-auto max-w-[560px] px-6 pb-20 pt-14 md:pt-20">
      <h1 className="display text-[36px] md:text-[44px]">Meus pedidos.</h1>
      <p className="mt-3 text-[17px] text-muted">Digite o número do pedido e o e-mail usado na compra para ver a situação.</p>
      <OrderLookup />
    </section>
  );
}
