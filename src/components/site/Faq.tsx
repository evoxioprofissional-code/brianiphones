"use client";

import { useState } from "react";
import { Plus } from "@/components/ui/Icons";

const ITEMS = [
  [
    "Como funciona a compra?",
    "Você coloca o aparelho no carrinho, escolhe a entrega e paga pelo Mercado Pago, no Pix, cartão ou boleto. Assim que o pagamento é aprovado, a gente separa e envia, ou deixa pronto pra retirar na loja.",
  ],
  [
    "O pagamento é seguro?",
    "É. O pagamento é feito na tela do Mercado Pago, e a loja não vê os dados do seu cartão. Dá pra parcelar em até 12x.",
  ],
  [
    "Vocês entregam para todo o Brasil?",
    "Sim, com seguro e código de rastreio. Em Itatiba tem entrega no mesmo dia, e você também pode retirar na loja sem pagar frete. O valor e o prazo aparecem quando você digita o CEP.",
  ],
  [
    "Posso dar meu iPhone como parte do pagamento?",
    "Pode. Preenche a avaliação na página de troca, com as fotos do aparelho, e a gente responde com o valor de entrada pelo WhatsApp.",
  ],
  [
    "Os seminovos têm garantia?",
    "Sim. O prazo de cada aparelho aparece na página dele. Qualquer problema, é só falar com a loja.",
  ],
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="border-b border-line">
      {ITEMS.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <li key={q} className="border-t border-line">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-[18px] font-semibold tracking-[-0.01em] md:text-[20px]">{q}</span>
              <Plus size={20} className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out-quint)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="max-w-[620px] pb-7 text-[15px] leading-[1.65] text-muted">{a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
