import type { CustomerMeta, DB, Expense, Lead, LeadStatus, Order, OrderStatus, Product, Sale, Storefront, VisitDay } from "./types";
import { DEFAULT_SETTINGS } from "./site";
import { DEFAULT_SHIPPING, DEFAULT_STOREFRONT, productTemplate } from "./defaults";
import { dayKey, slugify } from "./format";

type P = Omit<Product, "id" | "slug" | "createdAt" | "images" | "active"> & { active?: boolean };

const base: P[] = [
  { name: "iPhone 17 Pro Max", category: "iphone", condition: "novo", storage: "256 GB", color: "Laranja cósmico", colorHex: "#c8662f", price: 10499, cost: 9300, stock: 2, featured: true, warrantyMonths: 12 },
  { name: "iPhone 17 Pro", category: "iphone", condition: "novo", storage: "256 GB", color: "Azul profundo", colorHex: "#2d3a52", price: 9299, cost: 8250, stock: 3, featured: true, warrantyMonths: 12 },
  { name: "iPhone Air", category: "iphone", condition: "seminovo", storage: "256 GB", color: "Azul céu", colorHex: "#c9d7e6", battery: 100, price: 6890, cost: 5900, stock: 1, featured: true, warrantyMonths: 6 },
  { name: "iPhone 17", category: "iphone", condition: "novo", storage: "256 GB", color: "Sálvia", colorHex: "#b7c2a6", price: 6999, cost: 6150, stock: 4, featured: false, warrantyMonths: 12 },
  { name: "iPhone 16 Pro Max", category: "iphone", condition: "seminovo", storage: "256 GB", color: "Titânio deserto", colorHex: "#bfa48a", battery: 94, price: 6790, priceFrom: 7190, cost: 5700, stock: 2, featured: true, warrantyMonths: 6 },
  { name: "iPhone 16 Pro", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Titânio natural", colorHex: "#b9b3a8", battery: 96, price: 5690, cost: 4750, stock: 1, featured: false, warrantyMonths: 6 },
  { name: "iPhone 16", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Ultramarino", colorHex: "#5b6fd6", battery: 98, price: 4390, cost: 3600, stock: 2, featured: false, warrantyMonths: 6 },
  { name: "iPhone 15 Pro Max", category: "iphone", condition: "seminovo", storage: "256 GB", color: "Titânio azul", colorHex: "#3f4a5c", battery: 89, price: 5190, cost: 4300, stock: 1, featured: true, warrantyMonths: 3 },
  { name: "iPhone 15 Pro", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Titânio preto", colorHex: "#2f2f31", battery: 88, price: 4290, cost: 3500, stock: 2, featured: false, warrantyMonths: 3 },
  { name: "iPhone 15", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Rosa", colorHex: "#e9cfd2", battery: 91, price: 3490, cost: 2850, stock: 3, featured: false, warrantyMonths: 3 },
  { name: "iPhone 14", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Meia-noite", colorHex: "#232831", battery: 86, price: 2790, cost: 2200, stock: 2, featured: false, warrantyMonths: 3 },
  { name: "iPhone 13", category: "iphone", condition: "seminovo", storage: "128 GB", color: "Estelar", colorHex: "#ece6dc", battery: 85, price: 2290, cost: 1750, stock: 3, featured: false, warrantyMonths: 3 },
  { name: "MacBook Air M4 13\"", category: "macbook", condition: "novo", storage: "256 GB", color: "Azul céu", colorHex: "#bfcbd8", price: 9490, cost: 8400, stock: 1, featured: true, warrantyMonths: 12 },
  { name: "MacBook Pro M4 14\"", category: "macbook", condition: "seminovo", storage: "512 GB", color: "Preto espacial", colorHex: "#2b2b2e", battery: 97, price: 12900, cost: 11000, stock: 1, featured: false, warrantyMonths: 6 },
  { name: "iPad Air M3 11\"", category: "ipad", condition: "novo", storage: "128 GB", color: "Roxo", colorHex: "#c3b8d6", price: 5490, cost: 4800, stock: 2, featured: false, warrantyMonths: 12 },
  { name: "iPad 11ª geração", category: "ipad", condition: "novo", storage: "128 GB", color: "Prateado", colorHex: "#dcdcdc", price: 3290, cost: 2800, stock: 2, featured: false, warrantyMonths: 12 },
  { name: "Apple Watch Series 11 46mm", category: "watch", condition: "novo", storage: "GPS", color: "Cinza espacial", colorHex: "#3b3c40", price: 3990, cost: 3400, stock: 2, featured: false, warrantyMonths: 12 },
  { name: "Apple Watch Ultra 3", category: "watch", condition: "seminovo", storage: "GPS + Cel", color: "Titânio natural", colorHex: "#b8b2a6", battery: 99, price: 6290, cost: 5300, stock: 1, featured: false, warrantyMonths: 6 },
  { name: "AirPods Pro 3", category: "acessorio", condition: "novo", storage: "USB-C", color: "Branco", colorHex: "#f2f2f2", price: 2290, cost: 1850, stock: 5, featured: false, warrantyMonths: 12 },
];

/** PRNG determinístico pra demo não mudar a cada reload */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function createSeed(): DB {
  const r = rng(42);
  const now = new Date();
  const daysAgo = (n: number, h = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(h, Math.floor(r() * 60), 0, 0);
    return d;
  };

  const products: Product[] = base.map((p, i) => ({
    ...p,
    active: p.active ?? true,
    id: `p${i + 1}`,
    slug: slugify(`${p.name}-${p.storage}-${p.color}`),
    images: [],
    createdAt: daysAgo(60 - i).toISOString(),
    sku: `BI-${String(i + 1).padStart(4, "0")}`,
    weightGrams: p.category === "macbook" ? 2200 : p.category === "ipad" ? 900 : 600,
    badge: i === 0 ? "Lançamento" : i === 4 ? "Oferta" : i === 7 ? "Mais vendido" : undefined,
    badgeColor: i === 4 ? "#d70015" : i === 7 ? "#1f8a3e" : undefined,
    ...productTemplate(p),
  }));

  // Visitas — 90 dias, com fim de semana mais forte e leve tendência de alta
  const visits: Record<string, VisitDay> = {};
  const pages = ["/", "/loja", "/troca", "/reparo"];
  for (let i = 89; i >= 0; i--) {
    const d = daysAgo(i);
    const dow = d.getDay();
    const weekend = dow === 6 || dow === 0 ? 1.35 : 1;
    const trend = 1 + (89 - i) / 140;
    const visitors = Math.round((38 + r() * 26) * weekend * trend);
    const views = Math.round(visitors * (2.1 + r() * 0.8));
    const paths: Record<string, number> = {};
    let left = views;
    pages.forEach((p, idx) => {
      const share = idx === pages.length - 1 ? left : Math.round(views * [0.42, 0.33, 0.14][idx]);
      paths[p] = share;
      left -= share;
    });
    visits[dayKey(d)] = { views, visitors, paths };
  }

  // Contatos
  const names = ["Lucas M.", "Fernanda R.", "Gabriel S.", "Juliana P.", "Rafael T.", "Camila O.", "Bruno A.", "Larissa C.", "Thiago B.", "Mariana L.", "Pedro H.", "Ana Clara V."];
  const cities = ["Itatiba", "Itatiba", "Itatiba", "Jundiaí", "Bragança Paulista", "Morungaba", "Louveira", "Campinas"];
  const statuses: LeadStatus[] = ["novo", "em_conversa", "fechado", "fechado", "perdido", "em_conversa"];
  const leads: Lead[] = [];
  for (let i = 0; i < 46; i++) {
    const t = r();
    const created = daysAgo(Math.floor(r() * 30), 9 + Math.floor(r() * 10)).toISOString();
    const name = names[Math.floor(r() * names.length)];
    const city = cities[Math.floor(r() * cities.length)];
    const status = i < 5 ? "novo" : statuses[Math.floor(r() * statuses.length)];
    const prod = products[Math.floor(r() * 12)];
    if (t < 0.5) {
      leads.push({ id: `l${i}`, type: "orcamento", createdAt: created, name, city, status, quote: { productId: prod.id, productName: `${prod.name} ${prod.storage}`, price: prod.price } });
    } else if (t < 0.8) {
      const from = ["iPhone 13", "iPhone 14", "iPhone 12", "iPhone 15", "iPhone 13 Pro"][Math.floor(r() * 5)];
      leads.push({
        id: `l${i}`,
        type: "troca",
        createdAt: created,
        name,
        city,
        status,
        trade: {
          model: from,
          storage: "128 GB",
          color: ["Meia-noite", "Azul", "Estelar", "Preto"][Math.floor(r() * 4)],
          battery: 78 + Math.floor(r() * 18),
          replacedParts: r() < 0.3 ? ["Bateria"] : [],
          condition: ["impecavel", "leves", "visiveis"][Math.floor(r() * 3)],
          photos: [],
          desired: `${prod.name} ${prod.storage}`,
        },
      });
    } else {
      leads.push({
        id: `l${i}`,
        type: "reparo",
        createdAt: created,
        name,
        city,
        status,
        repair: {
          model: ["iPhone 12", "iPhone 13", "iPhone 14 Pro", "iPhone 11"][Math.floor(r() * 4)],
          issues: [["Tela quebrada"], ["Bateria fraca"], ["Não carrega"], ["Vidro traseiro"]][Math.floor(r() * 4)],
          description: "",
        },
      });
    }
  }
  leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Vendas — 90 dias
  const sales: Sale[] = [];
  const payments = ["pix", "pix", "credito", "credito", "debito", "misto"] as const;
  for (let i = 89; i >= 0; i--) {
    const n = r() < 0.35 ? 0 : r() < 0.7 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const p = products[Math.floor(r() * products.length)];
      const disc = Math.round(p.price * (r() * 0.04));
      const trade = r() < 0.3 ? 1200 + Math.round(r() * 1800) : undefined;
      sales.push({
        id: `s${i}-${k}`,
        date: daysAgo(i, 10 + k * 3).toISOString(),
        description: `${p.name} ${p.storage}`,
        kind: "venda",
        price: p.price - disc,
        cost: p.cost ?? Math.round(p.price * 0.85),
        tradeInValue: trade,
        payment: payments[Math.floor(r() * payments.length)],
        customer: names[Math.floor(r() * names.length)],
      });
    }
    if (r() < 0.45) {
      const svc = [
        ["Troca de tela iPhone 13", 1290, 720],
        ["Bateria iPhone 12", 450, 180],
        ["Vidro traseiro iPhone 14 Pro", 690, 260],
        ["Conector de carga iPhone 11", 320, 90],
      ][Math.floor(r() * 4)] as [string, number, number];
      sales.push({ id: `r${i}`, date: daysAgo(i, 15).toISOString(), description: svc[0], kind: "reparo", price: svc[1], cost: svc[2], payment: "pix" });
    }
  }
  sales.sort((a, b) => b.date.localeCompare(a.date));

  const expenses: Expense[] = [];
  for (let m = 0; m < 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 5, 10);
    expenses.push(
      { id: `e${m}a`, date: d.toISOString(), description: "Aluguel da loja", category: "aluguel", value: 3800 },
      { id: `e${m}b`, date: new Date(d.getTime() + 864e5 * 3).toISOString(), description: "Anúncios Instagram", category: "marketing", value: 900 + Math.round(r() * 400) },
      { id: `e${m}c`, date: new Date(d.getTime() + 864e5 * 10).toISOString(), description: "Peças — fornecedor", category: "pecas", value: 2100 + Math.round(r() * 1200) },
    );
  }
  const pastExpenses = expenses.filter((e) => new Date(e.date) <= now);
  pastExpenses.sort((a, b) => b.date.localeCompare(a.date));

  // Pedidos da loja online — 21 dias, com histórico, rastreio e endereço
  const orders: Order[] = [];
  const people = [
    { name: "Lucas Moreira", city: "Itatiba", uf: "SP", cep: "13250-410", street: "Rua Coronel Camilo Pires", district: "Centro" },
    { name: "Fernanda Ribeiro", city: "Jundiaí", uf: "SP", cep: "13201-005", street: "Av. Jundiaí", district: "Anhangabaú" },
    { name: "Gabriel Souza", city: "Campinas", uf: "SP", cep: "13024-000", street: "Av. Norte-Sul", district: "Cambuí" },
    { name: "Juliana Prado", city: "São Paulo", uf: "SP", cep: "01310-100", street: "Av. Paulista", district: "Bela Vista" },
    { name: "Rafael Teixeira", city: "Bragança Paulista", uf: "SP", cep: "12900-000", street: "Rua Coronel Teófilo Leme", district: "Centro" },
    { name: "Camila Oliveira", city: "Belo Horizonte", uf: "MG", cep: "30130-010", street: "Av. Afonso Pena", district: "Centro" },
    { name: "Bruno Almeida", city: "Itatiba", uf: "SP", cep: "13252-000", street: "Av. Barão de Itapema", district: "Jardim Ipê" },
    { name: "Larissa Costa", city: "Rio de Janeiro", uf: "RJ", cep: "22071-000", street: "Av. Atlântica", district: "Copacabana" },
    { name: "Thiago Barbosa", city: "Louveira", uf: "SP", cep: "13290-000", street: "Rua Armando Steck", district: "Centro" },
    { name: "Mariana Lopes", city: "Curitiba", uf: "PR", cep: "80010-000", street: "Rua XV de Novembro", district: "Centro" },
    { name: "Pedro Henrique Lima", city: "Morungaba", uf: "SP", cep: "13260-000", street: "Rua Bento Lopes", district: "Centro" },
    { name: "Ana Clara Vieira", city: "Itatiba", uf: "SP", cep: "13253-200", street: "Rua Prudente de Moraes", district: "Vila Brasileira" },
  ];
  const flow: OrderStatus[] = ["aguardando_pagamento", "pago", "separando", "embalado", "enviado", "entregue"];
  const finalOf = [5, 5, 5, 4, 4, 3, 2, 1, 5, 4, 5, -1, 5, 3, 5, 4, 2, 5, 5, 1, 0, 0, 5, 4];
  const step = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 36e5).toISOString();
  for (let i = 0; i < 24; i++) {
    const who = people[i % people.length];
    const local = who.city === "Itatiba";
    const pickup = local && i % 3 === 0;
    const p = products[(i * 5) % 12];
    const p2 = i % 6 === 2 ? products[18] : null;
    const ago = Math.floor((i / 24) * 21);
    const createdAt = daysAgo(ago, 9 + Math.floor(r() * 11)).toISOString();
    const ship: Order["shipping"] = pickup
      ? { method: "retirada", label: "Retirar na loja", price: 0, days: "Pronto em até 2 horas" }
      : local
        ? { method: "local", label: "Entrega em Itatiba", price: 0, days: "No mesmo dia" }
        : i % 2
          ? { method: "sedex", label: "SEDEX", price: 52 + (i % 5) * 4, days: "2 a 4 dias úteis" }
          : { method: "pac", label: "PAC", price: 34 + (i % 4) * 3, days: "5 a 9 dias úteis" };
    if (!pickup) {
      ship.address = { cep: who.cep, street: who.street, number: String(100 + ((i * 37) % 900)), complement: i % 4 === 0 ? "Apto 42" : "", district: who.district, city: who.city, uf: who.uf };
    }
    const pay = (["pix", "cartao", "cartao", "boleto"] as const)[i % 4];
    const fi = finalOf[i];
    const status: OrderStatus = fi === -1 ? "cancelado" : flow[ago <= 0 ? Math.min(fi, 1) : fi];
    const items = [{ productId: p.id, name: p.name, detail: `${p.storage} · ${p.color}`, price: p.price, qty: 1 }];
    if (p2) items.push({ productId: p2.id, name: p2.name, detail: `${p2.storage} · ${p2.color}`, price: p2.price, qty: 1 });
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    const timeline: Order["timeline"] = [{ at: createdAt, status: "aguardando_pagamento", text: "Pedido feito no site" }];
    const reached = status === "cancelado" ? 0 : flow.indexOf(status);
    const texts = ["", "Pagamento aprovado pelo Mercado Pago", "Pedido em separação", ship.method === "retirada" ? "Pronto para retirada na loja" : "Embalado e etiquetado", "Postado / saiu para entrega", "Entregue ao cliente"];
    for (let k = 1; k <= reached; k++) timeline.push({ at: step(createdAt, k * (k < 4 ? 2 : 20)), status: flow[k], text: texts[k] });
    if (status === "cancelado") timeline.push({ at: step(createdAt, 30), status: "cancelado", text: "Pagamento não aprovado, pedido cancelado" });
    const sent = reached >= 4 && (ship.method === "sedex" || ship.method === "pac");
    orders.push({
      id: `o${i}`,
      number: String(1024 - i),
      createdAt,
      status,
      customer: {
        name: who.name,
        email: who.name.toLowerCase().normalize("NFD").replace(/[^a-z ]/g, "").split(" ").slice(0, 2).join(".") + "@email.com",
        phone: `(11) 9${String(8000 + ((i * 731) % 1999)).padStart(4, "0")}-${String(1000 + ((i * 457) % 8999)).padStart(4, "0")}`,
        cpf: `${String(100 + i).padStart(3, "0")}.${String(200 + i * 3).slice(0, 3)}.${String(300 + i * 7).slice(0, 3)}-${String(10 + i).slice(-2)}`,
      },
      shipping: ship,
      payment: pay,
      installments: pay === "cartao" ? [1, 6, 10, 12][i % 4] : 1,
      items,
      subtotal,
      total: subtotal + ship.price,
      tracking: sent ? { carrier: ship.method === "sedex" ? "Correios SEDEX" : "Correios PAC", code: `QB${String(482019310 + i * 7919).slice(0, 9)}BR` } : undefined,
      timeline,
      printed: reached >= 3 ? { label: step(createdAt, 7), slip: step(createdAt, 6) } : undefined,
    });
  }

  const storefront: Storefront = JSON.parse(JSON.stringify(DEFAULT_STOREFRONT));
  const customers: Record<string, CustomerMeta> = {
    "lucas.moreira@email.com": { vip: true, tags: ["Cliente fiel"], notes: "Sempre compra na troca. Prefere retirar na loja." },
    "juliana.prado@email.com": { tags: ["São Paulo"] },
  };

  return { version: 2, customers, storefront, products, leads, orders, sales, expenses: pastExpenses, visits, settings: { ...DEFAULT_SETTINGS, shipping: { ...DEFAULT_SHIPPING } } };
}
