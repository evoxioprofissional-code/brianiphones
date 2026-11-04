import type { Metadata } from "next";
import { Checkout } from "@/components/site/Checkout";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-[1320px] px-4 pb-16 pt-4 sm:px-5 md:px-8 md:pb-24 md:pt-8">
      <h1 className="mb-4 text-[26px] sm:mb-6 sm:text-[30px] font-bold tracking-[-0.03em] md:text-[36px]">Finalizar compra</h1>
      <Checkout />
    </section>
  );
}
