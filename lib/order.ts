import type { MenuCategory } from "./content";

/** A dish in the basket is addressed by "category:index" in the menu. */
export const dishKey = (categoryId: string, index: number) => `${categoryId}:${index}`;

/** "16" → 16 €; "65/kg" → priced at the table (weighed). */
export function priceOf(price: string): { amount: number | null; perKg: boolean } {
  const perKg = /kg/i.test(price);
  const n = Number(price.replace(/[^\d.,]/g, "").replace(",", "."));
  return { amount: perKg || !Number.isFinite(n) ? null : n, perKg };
}

export function findDish(menu: MenuCategory[], key: string) {
  const [cat, idx] = key.split(":");
  const c = menu.find((m) => m.id === cat);
  const item = c?.items[Number(idx)];
  return item ? { category: c!, item } : null;
}

export type OrderLine = { key: string; name_hr: string; name_en: string; name_de: string; price: string; qty: number; note: string };
export type OrderStatus = "new" | "preparing" | "served" | "cancelled";
