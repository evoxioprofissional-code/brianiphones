import type { Product, ShelfConfig } from "./types";

/** Produtos de uma vitrine (só os que estão à venda e com estoque) */
export function resolveShelf(sh: ShelfConfig, products: Product[]) {
  const ok = (p: Product) => p.active && p.stock > 0;
  if (sh.mode === "manual") {
    return sh.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p && ok(p))
      .slice(0, sh.limit);
  }
  return products
    .filter(
      (p) =>
        ok(p) &&
        (!sh.category || p.category === sh.category) &&
        (!sh.condition || (sh.condition === "seminovo" ? p.condition !== "novo" : p.condition === sh.condition)) &&
        (!sh.onlyFeatured || p.featured),
    )
    .slice(0, sh.limit);
}
