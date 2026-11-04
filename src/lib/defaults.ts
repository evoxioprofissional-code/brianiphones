import type { Product, ProductSpec, ShippingSettings, Storefront } from "./types";

/* ---------- Envio ---------- */
export const DEFAULT_SHIPPING: ShippingSettings = {
  senderName: "Brian iPhones",
  senderDoc: "",
  senderPhone: "(11) 99693-8263",
  originCep: "13250-000",
  originStreet: "Endereço da loja",
  originNumber: "s/n",
  originDistrict: "Centro",
  originCity: "Itatiba",
  originUf: "SP",
  localFee: 15,
  localFreeAbove: 1500,
  pickupEnabled: true,
  pickupText: "Pronto em até 2 horas no horário da loja",
  carriers: ["Correios SEDEX", "Correios PAC", "Motoboy Itatiba", "Jadlog", "Loggi"],
  defaultWeightGrams: 600,
  handlingDays: 1,
};

/* ---------- Vitrine ---------- */
export const DEFAULT_STOREFRONT: Storefront = {
  heroSlides: [
    {
      id: "s1",
      active: true,
      productId: "p1",
      eyebrow: "Novo",
      title: "iPhone 17 Pro Max",
      subtitle: "Potência, câmera e design em outro nível.",
      ctaLabel: "Comprar agora",
      ctaHref: "",
      glow: "#c8662f",
      eyebrowColor: "#bf4800",
    },
    {
      id: "s2",
      active: true,
      productId: "p2",
      eyebrow: "Novo",
      title: "iPhone 17 Pro",
      subtitle: "O Pro no tamanho que cabe na mão.",
      ctaLabel: "Comprar agora",
      ctaHref: "",
      glow: "#2d3a52",
      eyebrowColor: "#bf4800",
    },
    {
      id: "s3",
      active: true,
      productId: "p3",
      eyebrow: "Seminovo",
      title: "iPhone Air",
      subtitle: "Revisado, com bateria medida e garantia da loja.",
      ctaLabel: "Comprar agora",
      ctaHref: "",
      glow: "#c9d7e6",
      eyebrowColor: "#bf4800",
    },
    {
      id: "s4",
      active: true,
      productId: "p5",
      eyebrow: "Seminovo",
      title: "iPhone 16 Pro Max",
      subtitle: "Revisado, com bateria medida e garantia da loja.",
      ctaLabel: "Comprar agora",
      ctaHref: "",
      glow: "#bfa48a",
      eyebrowColor: "#bf4800",
    },
  ],
  shelves: [
    { id: "sh1", active: true, title: "Os mais procurados.", subtitle: "O que mais sai na loja essa semana.", href: "/loja", mode: "auto", onlyFeatured: true, category: "", condition: "", productIds: [], limit: 10 },
    { id: "sh2", active: true, title: "iPhone seminovo.", subtitle: "Revisado, com bateria medida e garantia.", href: "/loja?c=iphone&e=seminovo", mode: "auto", category: "iphone", condition: "seminovo", productIds: [], limit: 10 },
    { id: "sh3", active: true, title: "Lacrados.", subtitle: "Novos, na caixa.", href: "/loja?e=novo", mode: "auto", category: "", condition: "novo", productIds: [], limit: 10 },
    { id: "sh4", active: true, title: "Mac, iPad, Watch e AirPods.", subtitle: "Pra completar o seu kit.", href: "/loja", mode: "manual", productIds: ["p13", "p14", "p15", "p16", "p17", "p18", "p19"], limit: 10 },
  ],
  categories: [
    { id: "c1", active: true, label: "iPhone", href: "/loja?c=iphone", art: "iphone", color: "#4a4f5c" },
    { id: "c2", active: true, label: "MacBook", href: "/loja?c=macbook", art: "macbook", color: "#c9ccd3" },
    { id: "c3", active: true, label: "iPad", href: "/loja?c=ipad", art: "ipad", color: "#b9a9d9" },
    { id: "c4", active: true, label: "Apple Watch", href: "/loja?c=watch", art: "watch", color: "#2e2f33" },
    { id: "c5", active: true, label: "AirPods", href: "/loja?q=AirPods", art: "acessorio", color: "#f4f4f4" },
    { id: "c6", active: true, label: "Acessórios", href: "/loja?c=acessorio", art: "magsafe", color: "#e8e8ed" },
  ],
  perks: [
    { id: "k1", icon: "truck", title: "Envio para todo o Brasil", text: "Com seguro e rastreio", href: "/#loja-fisica" },
    { id: "k2", icon: "bag", title: "Retire na loja", text: "Grátis, em Itatiba", href: "/#loja-fisica" },
    { id: "k3", icon: "card", title: "Até 12x no cartão", text: "Pagamento pelo Mercado Pago", href: "/loja" },
    { id: "k4", icon: "shield", title: "Garantia da loja", text: "Seminovo revisado um por um", href: "/troca" },
  ],
  announcement: { active: false, text: "Semana do seminovo: até 10% off no Pix", href: "/loja?e=seminovo", bg: "#1d1d1f", fg: "#ffffff" },
  theme: {
    accent: "#0071e3",
    highlight: "#bf4800",
    primary: "#1d1d1f",
    surface: "#f5f5f7",
    radius: 18,
  },
};

/* ---------- Ficha padrão por categoria (seed e "preencher com modelo" no editor) ---------- */
export function productTemplate(p: Pick<Product, "category" | "condition" | "name" | "storage" | "color" | "battery">): {
  subtitle: string;
  description: string;
  highlights: string[];
  specs: ProductSpec[];
  inBox: string[];
} {
  const used = p.condition !== "novo";
  const box = used ? ["Aparelho revisado", "Cabo USB-C", "Nota da loja com garantia"] : ["Aparelho lacrado de fábrica", "Cabo USB-C", "Documentação"];
  const base: ProductSpec[] = [
    { label: "Modelo", value: p.name },
    { label: p.category === "watch" ? "Conexão" : "Armazenamento", value: p.storage },
    { label: "Cor", value: p.color },
    { label: "Estado", value: used ? "Seminovo revisado" : "Novo, lacrado" },
  ];
  if (used && p.battery) base.push({ label: "Saúde da bateria", value: `${p.battery}%` });

  switch (p.category) {
    case "iphone":
      return {
        subtitle: used ? "Revisado pela loja, com bateria medida." : "Lacrado, com garantia Apple e da loja.",
        description: used
          ? `${p.name} ${p.storage} na cor ${p.color}, revisado peça por peça na loja. Testamos Face ID, câmeras, tela, som, microfone e carregamento. IMEI consultado e iCloud desvinculado, pronto pra você ativar com a sua conta.`
          : `${p.name} ${p.storage} na cor ${p.color}, novo e lacrado. Você recebe com a garantia da Apple a partir da ativação e a garantia da loja.`,
        highlights: used
          ? ["Bateria medida e informada", "Face ID e câmeras testados", "IMEI consultado, sem bloqueio", "Garantia da loja"]
          : ["Lacrado de fábrica", "Garantia Apple + garantia da loja", "Pronto pra retirar em Itatiba", "Envio com seguro"],
        specs: [...base, { label: "Chip", value: "Apple" }, { label: "Conector", value: "USB-C" }],
        inBox: box,
      };
    case "macbook":
      return {
        subtitle: "Leve, rápido e com bateria pro dia todo.",
        description: `${p.name} com ${p.storage} na cor ${p.color}. Ideal pra trabalhar, estudar e editar, com bateria que dura o dia todo.`,
        highlights: ["Chip Apple da série M", "Tela Liquid Retina", "Bateria pro dia todo", "macOS atualizado"],
        specs: [...base, { label: "Teclado", value: "Português (ABNT2) ou internacional, confirme na loja" }],
        inBox: used ? ["MacBook revisado", "Carregador USB-C", "Nota da loja com garantia"] : ["MacBook lacrado", "Carregador USB-C", "Cabo"],
      };
    case "ipad":
      return {
        subtitle: "Tela grande pra criar, estudar e assistir.",
        description: `${p.name} ${p.storage} na cor ${p.color}. Compatível com Apple Pencil e teclado.`,
        highlights: ["Tela Liquid Retina", "Compatível com Apple Pencil", "Bateria pro dia todo"],
        specs: base,
        inBox: ["iPad", "Cabo USB-C", "Documentação"],
      };
    case "watch":
      return {
        subtitle: "Saúde, treino e avisos direto no pulso.",
        description: `${p.name} (${p.storage}) na cor ${p.color}. Acompanha treinos, sono e notificações do iPhone.`,
        highlights: ["Tela sempre ativa", "Resistente à água", "Monitoramento de saúde"],
        specs: base,
        inBox: ["Relógio", "Pulseira", "Cabo de carregamento"],
      };
    default:
      return {
        subtitle: "Som e conforto pra acompanhar o seu iPhone.",
        description: `${p.name} na cor ${p.color}. Pareamento rápido com o seu iPhone.`,
        highlights: ["Pareamento instantâneo", "Estojo com carregamento"],
        specs: base,
        inBox: ["Produto", "Cabo", "Documentação"],
      };
  }
}
