import type { Metadata } from "next";
import { REPAIR_SERVICES } from "@/lib/site";
import { RepairForm } from "@/components/site/RepairForm";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Reparo",
  description: "Troca de tela, bateria, vidro traseiro, conector e câmeras. Orçamento antes de mexer.",
};

export default function ReparoPage() {
  return (
    <>
      <section className="mx-auto max-w-[1320px] px-5 pt-28 md:px-8 md:pt-36">
        <div className="grid gap-6 border-b border-line pb-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="label text-muted">Reparo</p>
            <h1 className="display mt-4 text-[48px] md:text-[88px]">
              Conserto com
              <br />
              orçamento antes.
            </h1>
          </div>
          <p className="max-w-[380px] text-[15px] leading-[1.6] text-muted md:col-span-4 md:justify-self-end">
            Você sabe o valor antes da gente abrir o aparelho. Nada é feito sem o seu ok.
          </p>
        </div>

        <div className="grid border-l border-line sm:grid-cols-2 lg:grid-cols-3">
          {REPAIR_SERVICES.map((s, i) => (
            <Reveal key={s.code} delay={(i % 3) * 70} className="border-b border-r border-line p-6 md:p-8">
              <p className="label text-faint">{s.code}</p>
              <p className="display mt-10 text-[30px] md:text-[36px]">{s.title}</p>
              <p className="mt-3 max-w-[320px] text-[14px] leading-[1.6] text-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-muted">Orçamento</p>
            <h2 className="display mt-4 text-[40px] md:text-[52px]">Me conta o que aconteceu</h2>
            <ol className="mt-10 space-y-5 text-[14px] text-muted">
              {["Você descreve o problema aqui", "A gente responde com o orçamento no WhatsApp", "Você traz o aparelho e acompanha o serviço"].map(
                (x, i) => (
                  <li key={x} className="flex gap-4">
                    <span className="label pt-0.5 text-faint">0{i + 1}</span>
                    {x}
                  </li>
                ),
              )}
            </ol>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <RepairForm />
          </div>
        </div>
      </section>
    </>
  );
}
