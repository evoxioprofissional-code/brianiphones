export type Category = "iphone" | "macbook" | "ipad" | "watch" | "acessorio";
export type Condition = "novo" | "seminovo" | "vitrine";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  condition: Condition;
  storage: string;
  color: string;
  colorHex: string;
  battery?: number;
  price: number;
  /** Preço "de" riscado, opcional */
  priceFrom?: number;
  /** Custo de aquisição — só aparece no admin */
  cost?: number;
  stock: number;
  featured: boolean;
  active: boolean;
  warrantyMonths: number;
  notes?: string;
  images: string[];
  createdAt: string;
};

export type LeadType = "orcamento" | "troca" | "reparo" | "contato";
export type LeadStatus = "novo" | "em_conversa" | "fechado" | "perdido";

export type TradeInPayload = {
  model: string;
  storage: string;
  color: string;
  battery: number | null;
  replacedParts: string[];
  condition: string;
  photos: string[];
  desired: string;
};

export type RepairPayload = {
  model: string;
  issues: string[];
  description: string;
};

export type QuotePayload = {
  productId: string;
  productName: string;
  price: number;
};

export type Lead = {
  id: string;
  type: LeadType;
  createdAt: string;
  name?: string;
  city?: string;
  status: LeadStatus;
  trade?: TradeInPayload;
  repair?: RepairPayload;
  quote?: QuotePayload;
};

export type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro" | "misto";

export type Sale = {
  id: string;
  date: string;
  description: string;
  kind: "venda" | "reparo";
  price: number;
  cost: number;
  tradeInValue?: number;
  payment: PaymentMethod;
  customer?: string;
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: "aluguel" | "pecas" | "marketing" | "pessoal" | "outros";
  value: number;
};

/** visitas por dia (yyyy-mm-dd) */
export type VisitDay = { views: number; visitors: number; paths: Record<string, number> };

export type Settings = {
  whatsapp: string;
  instagram: string;
  address: string;
  city: string;
  hours: string;
  mapsUrl: string;
};

/* ---------- Pedidos (loja online) ---------- */
export type ShippingMethod = "retirada" | "local" | "pac" | "sedex";
export type OrderPayment = "pix" | "cartao" | "boleto";
export type OrderStatus = "aguardando_pagamento" | "pago" | "separando" | "enviado" | "entregue" | "cancelado";

export type OrderItem = {
  productId: string;
  name: string;
  detail: string;
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  /** número curto pra falar com o cliente */
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string; cpf: string };
  shipping: {
    method: ShippingMethod;
    label: string;
    price: number;
    days: string;
    address?: { cep: string; street: string; number: string; complement: string; district: string; city: string; uf: string };
  };
  payment: OrderPayment;
  installments: number;
  items: OrderItem[];
  subtotal: number;
  total: number;
};

export type DB = {
  version: number;
  products: Product[];
  leads: Lead[];
  orders: Order[];
  sales: Sale[];
  expenses: Expense[];
  visits: Record<string, VisitDay>;
  settings: Settings;
};
