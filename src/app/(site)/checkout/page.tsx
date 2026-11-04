import type { Metadata } from "next";
import { Checkout } from "@/components/site/Checkout";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="bg-[#f5f5f7]">
      <section className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-5 md:px-8 md:pb-24 md:pt-10">
        <h1 className="mb-5 text-[28px] font-semibold tracking-[-0.035em] sm:mb-7 sm:text-[34px] md:text-[40px]">Finalizar compra</h1>
        <Checkout />
      </section>
    </div>
  );
}
