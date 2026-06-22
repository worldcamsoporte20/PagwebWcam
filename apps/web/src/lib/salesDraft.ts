export const SALES_DRAFT_STORAGE_KEY = "worldcam_sales_quotation_draft_v1";
export const SALES_DRAFT_UPDATED_EVENT = "worldcam-sales-draft-updated";

export type SalesDraftProduct = {
  id: number;
  variantId: number;
  name: string;
  sku: string;
  clave: string;
  barcode?: string;
  price: number;
  stock: number;
  brand?: string;
  category?: string;
  image?: string;
  qty: number;
};

type SalesDraft = {
  customerSearch?: string;
  selectedCustomerId?: string;
  selectedPricelistId?: string;
  paymentTerm?: string;
  paymentMethod?: string;
  quotationTemplate?: string;
  fiscalUse?: string;
  dueDate?: string;
  notes?: string;
  items?: SalesDraftProduct[];
  activeTab?: string;
  mode?: "list" | "new";
};

function dateInputValue(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addProductToSalesDraft(product: Omit<SalesDraftProduct, "qty">, qty = 1) {
  if (typeof window === "undefined") return [];

  let draft: SalesDraft = {};
  try {
    const rawDraft = window.localStorage.getItem(SALES_DRAFT_STORAGE_KEY);
    draft = rawDraft ? (JSON.parse(rawDraft) as SalesDraft) : {};
  } catch {
    draft = {};
  }

  const currentItems = Array.isArray(draft.items) ? draft.items : [];
  const existing = currentItems.find((item) => item.variantId === product.variantId);
  const items = existing
    ? currentItems.map((item) => (item.variantId === product.variantId ? { ...item, qty: item.qty + qty } : item))
    : [...currentItems, { ...product, qty }];

  const nextDraft: SalesDraft = {
    customerSearch: draft.customerSearch ?? "",
    selectedCustomerId: draft.selectedCustomerId ?? "",
    selectedPricelistId: draft.selectedPricelistId ?? "",
    paymentTerm: draft.paymentTerm ?? "Inmediato",
    paymentMethod: draft.paymentMethod ?? "Efectivo",
    quotationTemplate: draft.quotationTemplate ?? "Estandar Worldcam",
    fiscalUse: draft.fiscalUse ?? "Gastos en general",
    dueDate: draft.dueDate ?? dateInputValue(1),
    notes: draft.notes ?? "",
    activeTab: "lines",
    mode: "new",
    items,
  };

  window.localStorage.setItem(SALES_DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
  window.dispatchEvent(new CustomEvent(SALES_DRAFT_UPDATED_EVENT));
  return items;
}

export function readSalesDraftItems(): SalesDraftProduct[] {
  if (typeof window === "undefined") return [];

  try {
    const rawDraft = window.localStorage.getItem(SALES_DRAFT_STORAGE_KEY);
    if (!rawDraft) return [];
    const draft = JSON.parse(rawDraft) as SalesDraft;
    return Array.isArray(draft.items) ? draft.items.filter((item) => item.qty > 0) : [];
  } catch {
    return [];
  }
}

export function updateSalesDraftItemQty(variantId: number, qty: number) {
  if (typeof window === "undefined") return [];

  let draft: SalesDraft = {};
  try {
    const rawDraft = window.localStorage.getItem(SALES_DRAFT_STORAGE_KEY);
    draft = rawDraft ? (JSON.parse(rawDraft) as SalesDraft) : {};
  } catch {
    draft = {};
  }

  const items = (Array.isArray(draft.items) ? draft.items : [])
    .map((item) => (item.variantId === variantId ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);

  window.localStorage.setItem(SALES_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, items, mode: "new", activeTab: "lines" }));
  window.dispatchEvent(new CustomEvent(SALES_DRAFT_UPDATED_EVENT));
  return items;
}
