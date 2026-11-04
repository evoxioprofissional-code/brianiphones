import type { DB, Expense, Lead, LeadStatus, Product, Sale, VisitDay } from "./types";
import { DEFAULT_SETTINGS } from "./site";
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

  return { version: 1, products, leads, sales, expenses: pastExpenses, visits, settings: DEFAULT_SETTINGS };
}
