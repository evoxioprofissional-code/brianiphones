import type { Product, RepairPayload, TradeInPayload } from "./types";
import { money } from "./format";
import { CONDITION_LABEL, DEVICE_CONDITIONS } from "./site";

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export function quoteMessage(p: Product, name?: string) {
  const lines = [
    `Olá, Brian! ${name ? `Aqui é ${name}. ` : ""}Vi no site e quero um orçamento:`,
    "",
    `*${p.name}*`,
    `${p.storage} · ${p.color} · ${CONDITION_LABEL[p.condition]}`,
    p.battery ? `Bateria: ${p.battery}%` : null,
    `Valor no site: ${money(p.price)}`,
    "",
    "Ainda está disponível?",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export function tradeMessage(t: TradeInPayload, name: string, city: string) {
  const cond = DEVICE_CONDITIONS.find((c) => c.id === t.condition)?.label ?? t.condition;
  const lines = [
    `Olá, Brian! Aqui é ${name}${city ? `, de ${city}` : ""}.`,
    "Quero dar meu aparelho como entrada.",
    "",
    "*MEU APARELHO*",
    `Modelo: ${t.model}`,
    `Armazenamento: ${t.storage}`,
    `Cor: ${t.color || "—"}`,
    `Saúde da bateria: ${t.battery === null ? "não sei" : `${t.battery}%`}`,
    `Peças trocadas: ${t.replacedParts.length ? t.replacedParts.join(", ") : "nenhuma"}`,
    `Estado: ${cond}`,
    t.photos.length ? `Fotos: ${t.photos.length} (envio aqui na conversa)` : "Fotos: envio aqui na conversa",
    "",
    "*QUERO PEGAR*",
    t.desired,
    "",
    "Pode me passar uma avaliação?",
  ];
  return lines.join("\n");
}

export function repairMessage(r: RepairPayload, name: string) {
  const lines = [
    `Olá, Brian! Aqui é ${name}.`,
    "Preciso de um orçamento de reparo:",
    "",
    `Aparelho: ${r.model}`,
    `Problema: ${r.issues.join(", ") || "—"}`,
    r.description ? `Detalhes: ${r.description}` : null,
  ];
  return lines.filter((l) => l !== null).join("\n");
}
