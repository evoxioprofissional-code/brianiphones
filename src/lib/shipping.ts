import type { ShippingMethod } from "./types";

/**
 * Cálculo de frete PROVISÓRIO.
 * Os valores são estimativas por região do CEP, só para o layout funcionar.
 * Quando a logística for conectada (Mercado Envios / Correios / Melhor Envio),
 * troque só a função `quoteShipping`.
 */

export type ShippingOption = {
  method: ShippingMethod;
  label: string;
  price: number;
  days: string;
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");
export const formatCep = (s: string) => {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

/** Itatiba: 13250-000 a 13259-999 */
const isItatiba = (cep: string) => {
  const n = Number(cep.slice(0, 5));
  return n >= 13250 && n <= 13259;
};

export function quoteShipping(cepRaw: string, subtotal: number): ShippingOption[] | null {
  const cep = onlyDigits(cepRaw);
  if (cep.length !== 8) return null;

  const opts: ShippingOption[] = [{ method: "retirada", label: "Retirar na loja", price: 0, days: "Pronto em até 2 horas" }];

  if (isItatiba(cep)) {
    opts.push({ method: "local", label: "Entrega em Itatiba", price: subtotal >= 1500 ? 0 : 15, days: "No mesmo dia" });
    return opts;
  }

  // 1º dígito do CEP = região. SP fica mais perto.
  const region = Number(cep[0]);
  const far = region >= 5; // Nordeste, Centro-Oeste, Norte e Sul ficam mais longe
  const sp = region <= 1;
  const insurance = Math.round(subtotal * 0.004); // seguro do valor declarado
  opts.push(
    { method: "sedex", label: "SEDEX", price: (sp ? 38 : far ? 79 : 56) + insurance, days: sp ? "1 a 2 dias úteis" : far ? "4 a 8 dias úteis" : "2 a 4 dias úteis" },
    { method: "pac", label: "PAC", price: (sp ? 24 : far ? 52 : 36) + insurance, days: sp ? "3 a 5 dias úteis" : far ? "8 a 14 dias úteis" : "5 a 9 dias úteis" },
  );
  return opts;
}
