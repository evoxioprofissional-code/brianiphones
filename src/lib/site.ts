import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  whatsapp: "5511996938263",
  instagram: "brian.iphone_",
  address: "Endereço da loja (editar no admin)",
  city: "Itatiba — SP",
  hours: "Seg a Sex 9h–18h · Sáb 9h–13h",
  mapsUrl: "https://maps.google.com/?q=Itatiba+SP",
};

export const IPHONE_MODELS = [
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "iPhone Air",
  "iPhone 17",
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 16e",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",
  "Outro modelo",
];

export const STORAGE_OPTIONS = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"];

export const REPLACED_PARTS = [
  "Tela",
  "Bateria",
  "Câmera traseira",
  "Câmera frontal",
  "Tampa traseira",
  "Conector de carga",
  "Alto-falante",
];

export const DEVICE_CONDITIONS = [
  { id: "impecavel", label: "Impecável", hint: "Sem marcas visíveis" },
  { id: "leves", label: "Marcas leves", hint: "Riscos só sob a luz" },
  { id: "visiveis", label: "Marcas visíveis", hint: "Riscos ou amassados aparentes" },
  { id: "danificado", label: "Com dano", hint: "Trincado, quebrado ou com defeito" },
];

export const REPAIR_ISSUES = [
  "Tela quebrada",
  "Bateria fraca",
  "Não carrega",
  "Câmera",
  "Vidro traseiro",
  "Face ID",
  "Som / microfone",
  "Molhou",
  "Não liga",
  "Software / travando",
];

export const REPAIR_SERVICES = [
  {
    code: "01",
    title: "Tela",
    body: "Troca de display com teste de touch, True Tone e brilho antes da entrega.",
  },
  {
    code: "02",
    title: "Bateria",
    body: "Bateria nova com saúde em 100% e calibração. Você sai com o número na tela.",
  },
  {
    code: "03",
    title: "Vidro traseiro",
    body: "Remoção a laser do vidro trincado, sem mexer no resto do aparelho.",
  },
  {
    code: "04",
    title: "Conector e áudio",
    body: "Carga, alto-falante e microfone. Limpeza ou troca, depende do diagnóstico.",
  },
  {
    code: "05",
    title: "Câmeras",
    body: "Lente trincada, foco travado ou mancha na imagem. Traseira e frontal.",
  },
  {
    code: "06",
    title: "Diagnóstico",
    body: "Não sabe o que é? A gente abre, testa e te passa o orçamento antes de fazer.",
  },
];

export const CATEGORY_LABEL: Record<string, string> = {
  iphone: "iPhone",
  macbook: "MacBook",
  ipad: "iPad",
  watch: "Apple Watch",
  acessorio: "Acessórios",
};

export const CONDITION_LABEL: Record<string, string> = {
  novo: "Novo · lacrado",
  seminovo: "Seminovo",
  vitrine: "Vitrine",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  boleto: "Boleto",
};
