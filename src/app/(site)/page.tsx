import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { HeroTag, FeaturedGrid, CategoryIndex, StoreBlock } from "@/components/site/HomeSections";
import { Faq } from "@/components/site/Faq";
import { ArrowRight } from "@/components/ui/Icons";

const CHECKS = [
  ["Bateria", "Saúde medida e informada no anúncio. Abaixo de 80%, a gente troca antes."],
  ["Face ID e Touch ID", "Cadastro e desbloqueio testados na hora."],
  ["Tela", "Touch, True Tone, manchas e pixels mortos."],
  ["Câmeras", "Foco, estabilização e todas as lentes, frente e verso."],
  ["Procedência", "IMEI consultado e iCloud desvinculado. Sem bloqueio, sem surpresa."],
  ["Peças", "Se alguma peça foi trocada, está escrito no anúncio."],
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-16 md:pt-[72px]">
        <div className="mx-auto max-w-[1320px] px-5 md:px-8">
          <div className="flex items-center justify-between border-b border-line py-4">
            <p className="label text-muted">Itatiba — SP · Loja física</p>
            <p className="label hidden text-muted sm:block">6 anos · +6.000 clientes</p>
          </div>

          <div className="grid gap-12 pb-16 pt-12 md:grid-cols-12 md:gap-8 md:pb-24 md:pt-16">
            <div className="md:col-span-7 md:pt-6">
              <h1 className="display text-[52px] sm:text-[76px] lg:text-[104px]">
                iPhone bom
                <br />
                é iPhone
                <br />
                <span className="text-muted">com nome.</span>
              </h1>
              <p className="mt-8 max-w-[460px] text-[17px] leading-[1.55] text-graphite">
                Novos lacrados e seminovos revisados um por um. Seu aparelho entra como parte do pagamento. E se precisar
                de qualquer coisa depois, a loja continua no mesmo lugar.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/loja"
                  className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-5 text-[14px] font-medium text-paper transition-colors hover:bg-graphite"
                >
                  Ver aparelhos
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/troca"
                  className="inline-flex h-12 items-center rounded-full border border-ink/20 px-6 text-[14px] font-medium transition-colors hover:border-ink"
                >
                  Avaliar meu iPhone
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <HeroTag />
            </div>
          </div>
        </div>

        {/* Faixa */}
        <div className="overflow-hidden border-y border-line bg-card">
          <div className="marquee-track flex w-max">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
                {["iPhone", "MacBook", "iPad", "Apple Watch", "AirPods", "Troca na entrada", "Reparo", "Retirada na loja"].map((t) => (
                  <span key={t} className="flex items-center">
                    <span className="display px-8 py-5 text-[22px] md:text-[28px]">{t}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
        <Reveal className="flex items-end justify-between gap-6">
          <div>
            <p className="label text-muted">Catálogo</p>
            <h2 className="display mt-4 text-[40px] md:text-[60px]">O que tem na loja</h2>
          </div>
        </Reveal>
        <CategoryIndex />
      </section>

      {/* DESTAQUES */}
      <section className="border-t border-line bg-card">
        <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-muted">Na vitrine agora</p>
              <h2 className="display mt-4 text-[40px] md:text-[60px]">Destaques da semana</h2>
            </div>
            <Link href="/loja" className="group inline-flex items-center gap-2 border-b border-ink pb-1 text-[14px] font-medium">
              Ver todos <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
          <FeaturedGrid />
        </div>
      </section>

      {/* TROCA */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1320px] gap-16 px-5 py-24 md:grid-cols-12 md:px-8 md:py-32">
          <Reveal className="md:col-span-6">
            <p className="label text-faint">Troca na entrada</p>
            <h2 className="display mt-4 text-[44px] md:text-[72px]">
              Seu iPhone
              <br />
              vale entrada.
            </h2>
            <p className="mt-8 max-w-[440px] text-[17px] leading-[1.6] text-paper/70">
              Conta pra gente como está o seu aparelho, manda umas fotos e escolhe o que quer levar. A avaliação volta pelo
              WhatsApp, sem você sair de casa.
            </p>
            <Link
              href="/troca"
              className="group mt-10 inline-flex h-12 items-center gap-3 rounded-full bg-paper pl-6 pr-5 text-[14px] font-medium text-ink transition-colors hover:bg-white"
            >
              Avaliar meu aparelho
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <div className="md:col-span-6">
            <ol className="border-t border-paper/15">
              {[
                ["Seu aparelho", "Modelo, cor, armazenamento, saúde da bateria e se já trocou alguma peça."],
                ["Fotos", "Frente, verso e laterais. Com a foto, a avaliação sai mais certeira."],
                ["O que você quer", "Escolhe o aparelho novo. A diferença você paga no Pix, cartão ou parcelado."],
              ].map(([t, d], i) => (
                <Reveal as="li" key={t} delay={i * 80} className="grid grid-cols-[56px_1fr] gap-4 border-b border-paper/15 py-8">
                  <span className="label pt-1.5 text-faint">0{i + 1}</span>
                  <div>
                    <p className="text-[22px] font-semibold tracking-[-0.015em]">{t}</p>
                    <p className="mt-2 text-[15px] leading-[1.6] text-paper/60">{d}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="label text-muted">Seminovo de verdade</p>
            <h2 className="display mt-4 text-[40px] md:text-[52px]">
              O que a gente confere antes de vender
            </h2>
            <p className="mt-6 max-w-[340px] text-[15px] leading-[1.6] text-muted">
              Todo seminovo passa pela mesma revisão. O que aparece no anúncio é o que você recebe.
            </p>
          </Reveal>
          <div className="grid gap-x-10 sm:grid-cols-2 md:col-span-8">
            {CHECKS.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 2) * 80} className="border-t border-line py-7">
                <div className="flex items-baseline gap-4">
                  <span className="label text-faint tabular">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[18px] font-semibold tracking-[-0.01em]">{t}</p>
                    <p className="mt-2 text-[14px] leading-[1.6] text-muted">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* REPARO */}
      <section className="border-y border-line bg-paper-2">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 md:grid-cols-12 md:items-end md:px-8 md:py-24">
          <Reveal className="md:col-span-7">
            <p className="label text-muted">Reparo</p>
            <h2 className="display mt-4 text-[40px] md:text-[64px]">
              Quebrou? Traz que
              <br />a gente resolve.
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5" delay={100}>
            <p className="text-[16px] leading-[1.6] text-graphite">
              Tela, bateria, vidro traseiro, conector, câmera. Orçamento antes de mexer e teste completo na entrega.
            </p>
            <Link href="/reparo" className="group mt-6 inline-flex items-center gap-2 border-b border-ink pb-1 text-[14px] font-medium">
              Pedir orçamento de reparo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* LOJA FÍSICA */}
      <StoreBlock />

      {/* FAQ */}
      <section className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="label text-muted">Dúvidas</p>
            <h2 className="display mt-4 text-[40px] md:text-[52px]">Antes de você perguntar</h2>
          </Reveal>
          <div className="md:col-span-8">
            <Faq />
          </div>
        </div>
      </section>
    </>
  );
}
