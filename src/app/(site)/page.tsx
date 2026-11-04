import { CategoryTiles, HeroBanner, Perks, SectionTitle, StoreBlock, TradeBanner, TrustGrid } from "@/components/site/HomeSections";
import { HomeShelves } from "@/components/site/HomeShelves";
import { Faq } from "@/components/site/Faq";
import { Reveal } from "@/components/site/Reveal";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <Perks />

      <section className="mx-auto max-w-[1320px] px-5 pt-8 sm:px-6 sm:pt-12 md:px-8 md:pt-16">
        <SectionTitle eyebrow="Explore a linha Apple" title="Compre por categoria" />
        <div className="mt-4 sm:mt-6">
          <CategoryTiles />
        </div>
      </section>

      <HomeShelves
        trade={
          <div className="mx-auto max-w-[1320px] px-3 sm:px-4 md:px-8">
            <TradeBanner />
          </div>
        }
      />

      <section className="mx-auto max-w-[1320px] px-5 pt-10 sm:px-6 sm:pt-16 md:px-8 md:pt-24">
        <Reveal>
          <h2 className="text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[24px] md:text-[32px]">
            Por que comprar aqui. <span className="text-faint">Seminovo de verdade, revisado um por um.</span>
          </h2>
        </Reveal>
        <div className="mt-4 sm:mt-6">
          <TrustGrid />
        </div>
      </section>

      <div className="pt-10 sm:pt-16 md:pt-24">
        <StoreBlock />
      </div>

      <section className="mx-auto max-w-[980px] px-5 py-12 sm:px-6 sm:py-16 md:px-8 md:py-24">
        <Reveal>
          <SectionTitle eyebrow="Pagamento, entrega, garantia e troca" title="Dúvidas frequentes" />
        </Reveal>
        <div className="mt-5 sm:mt-8">
          <Faq />
        </div>
      </section>
    </>
  );
}
