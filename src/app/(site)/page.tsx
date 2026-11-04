import { CategoryTiles, HeroBanner, Perks, SectionTitle, StoreBlock, TradeBanner, TrustGrid } from "@/components/site/HomeSections";
import { HomeShelves } from "@/components/site/HomeShelves";
import { Faq } from "@/components/site/Faq";
import { Reveal } from "@/components/site/Reveal";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <Perks />

      <section className="mx-auto max-w-[1320px] px-6 pt-12 md:px-8 md:pt-16">
        <SectionTitle eyebrow="Explore a linha Apple" title="Compre por categoria" />
        <div className="mt-6">
          <CategoryTiles />
        </div>
      </section>

      <HomeShelves
        trade={
          <div className="mx-auto max-w-[1320px] px-4 md:px-8">
            <TradeBanner />
          </div>
        }
      />

      <section className="mx-auto max-w-[1320px] px-6 pt-16 md:px-8 md:pt-24">
        <Reveal>
          <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] md:text-[32px]">
            Por que comprar aqui. <span className="text-faint">Seminovo de verdade, revisado um por um.</span>
          </h2>
        </Reveal>
        <div className="mt-6">
          <TrustGrid />
        </div>
      </section>

      <div className="pt-16 md:pt-24">
        <StoreBlock />
      </div>

      <section className="mx-auto max-w-[980px] px-6 py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionTitle eyebrow="Pagamento, entrega, garantia e troca" title="Dúvidas frequentes" />
        </Reveal>
        <div className="mt-8">
          <Faq />
        </div>
      </section>
    </>
  );
}
