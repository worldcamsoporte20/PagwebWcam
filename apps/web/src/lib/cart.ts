export type EcommerceCartItem = {
  id: string;
  productId?: number;
  variantId?: number;
  sku: string;
  clave: string;
  brand: string;
  category: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
};

export const CART_STORAGE_KEY = "worldcam_ecommerce_cart";
export const CART_UPDATED_EVENT = "worldcam-cart-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCart(): EcommerceCartItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EcommerceCartItem[];
    return Array.isArray(parsed) ? parsed.filter((item) => item.qty > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: EcommerceCartItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.filter((item) => item.qty > 0)));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function addCartItem(item: Omit<EcommerceCartItem, "qty">, qty = 1) {
  const current = readCart();
  const index = current.findIndex((cartItem) => cartItem.id === item.id);

  if (index >= 0) {
    current[index] = { ...current[index], qty: current[index].qty + qty };
  } else {
    current.push({ ...item, qty });
  }

  writeCart(current);
  return current;
}

export function updateCartItemQty(id: string, qty: number) {
  const next = readCart()
    .map((item) => (item.id === id ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  writeCart(next);
  return next;
}

export function removeCartItem(id: string) {
  const next = readCart().filter((item) => item.id !== id);
  writeCart(next);
  return next;
}

export function clearCart() {
  writeCart([]);
}

export function getCartTotals(items: EcommerceCartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.16;
  return {
    subtotal,
    tax,
    total: subtotal + tax,
    qty: items.reduce((sum, item) => sum + item.qty, 0),
  };
}
