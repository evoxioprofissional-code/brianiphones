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
  /** "Sobre este aparelho" — texto livre que aparece no anúncio */
  notes?: string;
  images: string[];
  createdAt: string;

  /* ----- Ficha completa (todos opcionais, preenchidos no editor do admin) ----- */
  /** código interno */
  sku?: string;
  /** frase curta abaixo do nome */
  subtitle?: string;
  /** descrição longa do anúncio */
  description?: string;
  /** pontos fortes em tópicos */
  highlights?: string[];
  /** ficha técnica: rótulo + valor */
  specs?: ProductSpec[];
  /** o que vem na caixa */
  inBox?: string[];
  /** selo de destaque no card (ex.: "Mais vendido", "Oferta") */
  badge?: string;
  badgeColor?: string;
  tags?: string[];
  /** peso em gramas, já com embalagem (frete) */
  weightGrams?: number;
  /** anotação interna: IMEI, origem, peça trocada... (não aparece no site) */
  internalNotes?: string;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: string;
};

export type ProductSpec = { label: string; value: string };

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
  shipping?: ShippingSettings;
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
export type OrderStatus = "aguardando_pagamento" | "pago" | "separando" | "embalado" | "enviado" | "entregue" | "cancelado";

export type OrderEvent = { at: string; status?: OrderStatus; text: string };

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
  /** desconto aplicado (cupom ou negociação) */
  discount?: number;
  total: number;
  /** rastreio do envio */
  tracking?: { carrier: string; code: string };
  /** histórico do pedido */
  timeline?: OrderEvent[];
  /** observação interna */
  notes?: string;
  /** já impresso: etiqueta / pedido */
  printed?: { label?: string; slip?: string };
};

/* ---------- Clientes (dados extras; a base vem dos pedidos) ---------- */
export type CustomerMeta = { notes?: string; tags?: string[]; vip?: boolean };

/* ---------- Vitrine do site (editável no admin) ---------- */
export type HeroSlide = {
  id: string;
  active: boolean;
  /** se tiver produto, usa a foto/ilustração e o preço dele */
  productId?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** cor do brilho de fundo */
  glow: string;
  /** cor do selo acima do título */
  eyebrowColor: string;
};

export type ShelfConfig = {
  id: string;
  active: boolean;
  title: string;
  subtitle: string;
  href: string;
  mode: "auto" | "manual";
  /** filtros do modo automático */
  category?: Category | "";
  condition?: Condition | "";
  onlyFeatured?: boolean;
  /** produtos escolhidos à mão, na ordem */
  productIds: string[];
  limit: number;
};

export type CategoryTile = {
  id: string;
  active: boolean;
  label: string;
  href: string;
  art: Category | "magsafe";
  color: string;
};

export type Perk = { id: string; icon: "truck" | "store" | "card" | "shield" | "swap" | "bag"; title: string; text: string; href: string };

export type Storefront = {
  heroSlides: HeroSlide[];
  shelves: ShelfConfig[];
  categories: CategoryTile[];
  perks: Perk[];
  /** faixa no topo do site */
  announcement: { active: boolean; text: string; href: string; bg: string; fg: string };
  theme: {
    /** botões azuis, links */
    accent: string;
    /** selo "Novo" e destaques */
    highlight: string;
    /** botão principal (preto) */
    primary: string;
    /** fundo dos blocos cinza */
    surface: string;
    /** raio dos cards, em px */
    radius: number;
  };
};

/* ---------- Envio / logística ---------- */
export type ShippingSettings = {
  senderName: string;
  senderDoc: string;
  senderPhone: string;
  originCep: string;
  originStreet: string;
  originNumber: string;
  originDistrict: string;
  originCity: string;
  originUf: string;
  localFee: number;
  localFreeAbove: number;
  pickupEnabled: boolean;
  pickupText: string;
  carriers: string[];
  defaultWeightGrams: number;
  /** dias úteis pra postar depois do pagamento */
  handlingDays: number;
};

export type DB = {
  version: number;
  products: Product[];
  leads: Lead[];
  orders: Order[];
  customers: Record<string, CustomerMeta>;
  storefront: Storefront;
  sales: Sale[];
  expenses: Expense[];
  visits: Record<string, VisitDay>;
  settings: Settings;
};
