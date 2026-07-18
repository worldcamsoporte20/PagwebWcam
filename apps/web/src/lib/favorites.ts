export type FavoriteProduct = {
  id?: number;
  variantId?: number;
  sku: string;
  clave?: string;
  brand?: string;
  category?: string;
  name: string;
  stock?: number;
  price: number;
  image?: string;
};

const IDS_STORAGE_KEY = "wc-favorites";
const PRODUCTS_STORAGE_KEY = "wc-favorite-products";
export const FAVORITES_UPDATED_EVENT = "wc-favorites-updated";

export function favoriteProductKey(product: FavoriteProduct) {
  return String(product.variantId ?? product.id ?? product.sku);
}

export function readFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(IDS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function readFavoriteProducts(): FavoriteProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PRODUCTS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as FavoriteProduct[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[], products: FavoriteProduct[]) {
  window.localStorage.setItem(IDS_STORAGE_KEY, JSON.stringify(ids));
  window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}

export function toggleFavoriteProduct(product: FavoriteProduct) {
  const id = favoriteProductKey(product);
  const ids = new Set(readFavoriteIds());
  const products = readFavoriteProducts().filter((item) => favoriteProductKey(item) !== id);
  const isFavorite = !ids.has(id);

  if (isFavorite) {
    ids.add(id);
    products.push(product);
  } else {
    ids.delete(id);
  }

  const nextIds = Array.from(ids);
  saveFavorites(nextIds, products);
  return { ids: nextIds, isFavorite };
}

export function removeFavoriteProduct(id: string) {
  const ids = readFavoriteIds().filter((item) => item !== id);
  const products = readFavoriteProducts().filter((item) => favoriteProductKey(item) !== id);
  saveFavorites(ids, products);
  return ids;
}

export function syncFavoriteProducts(products: FavoriteProduct[]) {
  if (typeof window === "undefined") return;
  const ids = new Set(readFavoriteIds());
  if (ids.size === 0) return;

  const saved = new Map(readFavoriteProducts().map((product) => [favoriteProductKey(product), product]));
  products.forEach((product) => {
    const id = favoriteProductKey(product);
    if (ids.has(id)) saved.set(id, product);
  });

  saveFavorites(Array.from(ids), Array.from(saved.values()).filter((product) => ids.has(favoriteProductKey(product))));
}
