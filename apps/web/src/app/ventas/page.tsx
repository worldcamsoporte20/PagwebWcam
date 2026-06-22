"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FilePlus2,
  LayoutList,
  Loader2,
  Mail,
  PackageSearch,
  Printer,
  Plus,
  Save,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import { SALES_DRAFT_STORAGE_KEY } from "../../lib/salesDraft";

type User = { email: string; role: string };
type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  vat?: string;
  fiscalRegime?: string;
  pricelistId?: number;
  pricelistName?: string;
};
type Product = { id: number; variantId: number; name: string; sku: string; clave: string; barcode?: string; price: number; stock: number; brand?: string; category?: string; image?: string };
type Pricelist = { id: number; name: string; currency: string };
type QuotationTemplateLine = { id: number; productId: number; name: string; qty: number; priceUnit: number };
type QuotationTemplate = { id: number; name: string; lines?: QuotationTemplateLine[] };
type QuoteLine = { id: string; productId: number; productName: string; sku: string; qty: number; priceUnit: number; amountUntaxed: number; taxAmount: number; amountTotal: number };
type Quote = {
  id: string;
  number: string;
  status: "draft" | "sent" | "sale" | "cancel";
  partnerId: number;
  partnerName: string;
  partnerEmail?: string;
  partnerPhone?: string;
  pricelistId?: number;
  pricelistName?: string;
  paymentTerm?: string;
  paymentMethod?: string;
  quotationTemplate?: string;
  fiscalUse?: string;
  dueDate?: string;
  notes?: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  odooOrderId?: number;
  odooOrderName?: string;
  createdByEmail: string;
  createdAt: string;
  lines: QuoteLine[];
};
type DraftItem = Product & { qty: number };

type FormTab = "lines" | "optional" | "other" | "advance" | "pos";
type DraftStatus = "idle" | "saved";
type SalesView = "ordenes" | "plantillas";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const salesDraftStorageKey = SALES_DRAFT_STORAGE_KEY;

const stateLabels: Record<Quote["status"], string> = {
  draft: "Cotizacion",
  sent: "Cotizacion enviada",
  sale: "Orden de venta",
  cancel: "Cancelado",
};

const paymentMethods = ["Efectivo", "Cheque nominativo", "Transferencia electronica de fondos", "Tarjeta de Credito", "Monedero Electronico", "Dinero Electronico", "Vales de despensa", "Dacion en pago"];
const fiscalUses = ["Gastos en general", "Adquisicion de mercancias", "Devoluciones, descuentos o bonificaciones", "Construcciones", "Mobiliario y equipo de oficina por inversiones", "Equipo de transporte", "Equipo de computo y accesorios", "Comunicaciones telefonicas", "Comunicaciones satelitales", "Otra maquinaria y equipo"];
const paymentTerms = ["Inmediato", "15 dias", "21 dias", "30 dias", "45 dias", "Fin del siguiente mes", "10 dias despues del fin del siguiente mes", "30% ahora, el resto en 60 dias"];

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function dateInputValue(daysFromToday = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wc_access_token") ?? "";
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandSearchToken(tokenValue: string) {
  const token = normalizeSearch(tokenValue);
  const expansions: Record<string, string[]> = {
    camara: ["camara", "camera", "camaras", "cam", "ip"],
    camaras: ["camara", "camera", "camaras", "cam", "ip"],
    camera: ["camara", "camera", "camaras", "cam", "ip"],
    dahua: ["dahua"],
    hikvision: ["hikvision", "hik"],
    hilook: ["hilook"],
    tiandy: ["tiandy"],
    nvr: ["nvr", "network video recorder", "grabador"],
    dvr: ["dvr", "grabador"],
    canales: ["canal", "canales", "ch"],
    canal: ["canal", "canales", "ch"],
    exterior: ["exterior", "intemperie", "outdoor"],
    interior: ["interior", "indoor"],
    ptz: ["ptz", "zoom"],
    poe: ["poe"],
    wifi: ["wifi", "wi fi", "inalambrico"],
    solar: ["solar"],
    colorvu: ["colorvu", "color"],
    fullcolor: ["full color", "fullcolor", "color"],
  };

  if (/^\d+m$/.test(token)) {
    const value = token.replace("m", "");
    return [token, `${value}mp`, `${value} mp`, `${value} megapixel`, `${value} megapixeles`, `${value} megapixels`];
  }

  if (/^\d+mp$/.test(token)) {
    const value = token.replace("mp", "");
    return [token, `${value}m`, `${value} mp`, `${value} megapixel`, `${value} megapixeles`, `${value} megapixels`];
  }

  if (/^\d+$/.test(token)) {
    return [token, `${token}ch`, `${token} canales`, `${token} canal`];
  }

  return expansions[token] ?? [token];
}

function productSearchText(product: Product) {
  const raw = [
    product.name,
    product.sku,
    product.clave,
    product.barcode,
    product.brand,
    product.category,
    product.stock > 0 ? "disponible existencia stock" : "",
  ].join(" ");

  const normalized = normalizeSearch(raw);
  return `${normalized} ${normalized.replace(/\b(\d+)\s*megapixeles?\b/g, "$1mp $1 m $1 megapixeles")} ${normalized.replace(/\b(\d+)\s*canales?\b/g, "$1ch $1 canales")}`;
}

function productMatchesSmartSearch(product: Product, query: string) {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  const searchable = productSearchText(product);
  return terms.every((term) => expandSearchToken(term).some((candidate) => searchable.includes(normalizeSearch(candidate))));
}

function customerAddress(customer?: Customer) {
  if (!customer) return "";
  return [customer.street, customer.street2, customer.city, customer.state, customer.country].filter(Boolean).join(", ");
}

function fiscalRegimeText(value?: string) {
  const regimes: Record<string, string> = {
    "601": "601 - General de Ley Personas Morales",
    "603": "603 - Personas Morales con Fines no Lucrativos",
    "605": "605 - Sueldos y Salarios",
    "606": "606 - Arrendamiento",
    "607": "607 - Regimen de Enajenacion o Adquisicion de Bienes",
    "612": "612 - Personas Fisicas con Actividades Empresariales",
    "616": "616 - Sin obligaciones fiscales",
    "621": "621 - Incorporacion Fiscal",
    "626": "626 - Regimen Simplificado de Confianza",
  };
  if (!value) return "";
  return regimes[value] ?? value;
}

export default function SalesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pricelists, setPricelists] = useState<Pricelist[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<QuotationTemplate[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [selectedPricelistId, setSelectedPricelistId] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("Inmediato");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [quotationTemplate, setQuotationTemplate] = useState("Estandar Worldcam");
  const [fiscalUse, setFiscalUse] = useState("Gastos en general");
  const [dueDate, setDueDate] = useState(() => dateInputValue(1));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [activeTab, setActiveTab] = useState<FormTab>("lines");
  const [mode, setMode] = useState<"list" | "new">("list");
  const [salesView, setSalesView] = useState<SalesView>("ordenes");
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  const draftRestored = useRef(false);

  const isEmployee = user?.role === "employee" || user?.role === "admin";
  const selectedCustomer = customers.find((customer) => customer.id === Number(selectedCustomerId));
  const selectedPricelist = pricelists.find((pricelist) => pricelist.id === Number(selectedPricelistId));
  const selectedQuote = quotes.find((quote) => quote.id === selectedQuoteId);
  const currentViewTitle = salesView === "plantillas" ? "Plantillas de cotizacion" : "Cotizaciones";
  const currentViewSubtitle = salesView === "plantillas" ? "Paquetes reutilizables cargados desde Odoo" : "Gestion comercial conectada a Odoo";
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.qty, 0), [items]);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];

    return products
      .filter((product) => productMatchesSmartSearch(product, productSearch))
      .sort((a, b) => {
        const q = normalizeSearch(productSearch);
        if (!q) return b.stock - a.stock;
        const aName = normalizeSearch(a.name);
        const bName = normalizeSearch(b.name);
        const aStarts = aName.startsWith(q) ? 1 : 0;
        const bStarts = bName.startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;
        return b.stock - a.stock;
      })
      .slice(0, 18);
  }, [productSearch, products]);
  const filteredQuotes = useMemo(() => {
    const query = normalizeSearch(salesSearch);
    if (!query) return quotes;

    return quotes.filter((quote) => {
      const text = normalizeSearch([
        quote.number,
        quote.odooOrderName,
        quote.partnerName,
        quote.partnerEmail,
        quote.partnerPhone,
        quote.pricelistName,
        quote.createdByEmail,
        stateLabels[quote.status],
        quote.amountTotal.toFixed(2),
      ].join(" "));
      return query.split(" ").every((term) => text.includes(term));
    });
  }, [quotes, salesSearch]);
  const filteredTemplates = useMemo(() => {
    const query = normalizeSearch(salesSearch);
    if (!query) return quotationTemplates;

    return quotationTemplates.filter((template) => {
      const estimatedTotal = template.lines?.reduce((sum, line) => sum + Number(line.priceUnit ?? 0) * Number(line.qty ?? 1), 0) ?? 0;
      const text = normalizeSearch([
        template.name,
        template.lines?.length ?? 0,
        estimatedTotal.toFixed(2),
        ...(template.lines ?? []).map((line) => `${line.name} ${line.productId}`),
      ].join(" "));
      return query.split(" ").every((term) => text.includes(term));
    });
  }, [quotationTemplates, salesSearch]);

  useEffect(() => {
    const accessToken = token();
    if (!accessToken) {
      setAuthReady(true);
      setLoading(false);
      return;
    }

    fetch(`${apiBaseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: User | null) => setUser(data))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authReady || !isEmployee) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [authReady, isEmployee]);

  useEffect(() => {
    if (!authReady || !isEmployee) return;
    const timeout = window.setTimeout(() => {
      fetch(`${apiBaseUrl}/api/pos/customers?search=${encodeURIComponent(customerSearch)}`)
        .then((r) => r.json())
        .then((customerData) => {
          if (Array.isArray(customerData)) {
            setCustomers(customerData);
          }
        })
        .catch(() => undefined);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [authReady, customerSearch, isEmployee]);

  useEffect(() => {
    if (typeof window === "undefined" || draftRestored.current) return;
    const salesView = new URLSearchParams(window.location.search).get("vista");
    const requestedView: SalesView = salesView === "plantillas" ? "plantillas" : "ordenes";
    const forceListView = salesView === "ordenes" || salesView === "plantillas";
    setSalesView(requestedView);

    try {
      const rawDraft = localStorage.getItem(salesDraftStorageKey);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as Partial<{
          customerSearch: string;
          selectedCustomerId: string;
          selectedPricelistId: string;
          paymentTerm: string;
          paymentMethod: string;
          quotationTemplate: string;
          fiscalUse: string;
          dueDate: string;
          notes: string;
          items: DraftItem[];
          activeTab: FormTab;
          mode: "list" | "new";
        }>;

        setCustomerSearch(draft.customerSearch ?? "");
        setSelectedCustomerId(draft.selectedCustomerId ?? "");
        setSelectedPricelistId(draft.selectedPricelistId ?? "");
        setPaymentTerm(draft.paymentTerm ?? "Inmediato");
        setPaymentMethod(draft.paymentMethod ?? "Efectivo");
        setQuotationTemplate(draft.quotationTemplate ?? "Estandar Worldcam");
        setFiscalUse(draft.fiscalUse ?? "Gastos en general");
        setDueDate(draft.dueDate ?? dateInputValue(1));
        setNotes(draft.notes ?? "");
        setItems(Array.isArray(draft.items) ? draft.items : []);
        setActiveTab(draft.activeTab ?? "lines");
        if (forceListView) {
          setMode("list");
          setSelectedQuoteId(null);
          setEditingQuoteId(null);
        } else if (draft.mode === "new") {
          setMode("new");
        }
        setDraftStatus("saved");
      }
    } catch {
      localStorage.removeItem(salesDraftStorageKey);
    } finally {
      if (forceListView) {
        setMode("list");
      }
      draftRestored.current = true;
    }
  }, []);

  useEffect(() => {
    if (!draftRestored.current || !isEmployee || typeof window === "undefined") return;

    const timeout = window.setTimeout(() => {
      localStorage.setItem(
        salesDraftStorageKey,
        JSON.stringify({
          customerSearch,
          selectedCustomerId,
          selectedPricelistId,
          paymentTerm,
          paymentMethod,
          quotationTemplate,
          fiscalUse,
          dueDate,
          notes,
          items,
          activeTab,
          mode,
        }),
      );
      setDraftStatus("saved");
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [activeTab, customerSearch, dueDate, fiscalUse, isEmployee, items, mode, notes, paymentMethod, paymentTerm, quotationTemplate, selectedCustomerId, selectedPricelistId]);

  useEffect(() => {
    if (!quotationTemplate || items.length > 0 || products.length === 0 || quotationTemplates.length === 0) return;

    const selectedTemplate = quotationTemplates.find((item) => item.name === quotationTemplate);
    if (selectedTemplate?.lines?.length) {
      applyQuotationTemplate(quotationTemplate);
    }
  }, [items.length, products, quotationTemplate, quotationTemplates]);

  async function loadAll() {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token()}` };
    const [quoteData, customerData, productData, pricelistData, templateData] = await Promise.all([
      fetch(`${apiBaseUrl}/api/sales/orders`, { headers }).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/pos/customers?search=${encodeURIComponent(customerSearch)}`).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/catalog/products`).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/pos/pricelists`).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/sales/quotation-templates`, { headers }).then((r) => r.json()),
    ]);
    setQuotes(Array.isArray(quoteData) ? quoteData : []);
    setCustomers(Array.isArray(customerData) ? customerData : []);
    setProducts(Array.isArray(productData) ? productData : []);
    setPricelists(Array.isArray(pricelistData) ? pricelistData : []);
    setQuotationTemplates(Array.isArray(templateData) ? templateData : []);
    setLoading(false);
  }

  function addProduct(product: Product) {
    setItems((current) => {
      const existing = current.find((item) => item.variantId === product.variantId);
      if (existing) {
        return current.map((item) => (item.variantId === product.variantId ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...current, { ...product, qty: 1 }];
    });
  }

  function applyQuotationTemplate(templateName: string) {
    setQuotationTemplate(templateName);
    const template = quotationTemplates.find((item) => item.name === templateName);
    if (!template?.lines?.length) return;

    const templateItems = template.lines.map((line) => {
      const product = products.find((item) => item.variantId === line.productId || item.id === line.productId);
      if (product) {
        return { ...product, qty: line.qty > 0 ? line.qty : 1 };
      }

      return {
        id: line.productId,
        variantId: line.productId,
        name: line.name,
        sku: String(line.productId),
        clave: String(line.productId),
        price: Number(line.priceUnit ?? 0),
        stock: 0,
        brand: "Odoo",
        category: "Plantilla",
        qty: line.qty > 0 ? line.qty : 1,
      };
    });

    setItems(templateItems);
    setActiveTab("lines");
    setProductSearch("");
  }

  function quoteLineToDraftItem(line: QuoteLine): DraftItem {
    const product = products.find((item) => item.variantId === line.productId || item.id === line.productId);
    if (product) {
      return { ...product, qty: line.qty };
    }

    return {
      id: line.productId,
      variantId: line.productId,
      name: line.productName,
      sku: line.sku,
      clave: line.sku,
      price: line.priceUnit,
      stock: 0,
      brand: "Worldcam",
      category: "Cotizacion",
      qty: line.qty,
    };
  }

  function openQuoteForEditing(quote: Quote) {
    setSelectedQuoteId(quote.id);
    setEditingQuoteId(quote.id);
    setMode("new");
    setMessage(null);
    setCustomerPickerOpen(false);
    setSelectedCustomerId(String(quote.partnerId));
    setCustomerSearch(quote.partnerName);
    setSelectedPricelistId(quote.pricelistId ? String(quote.pricelistId) : "");
    setPaymentTerm(quote.paymentTerm ?? "Inmediato");
    setPaymentMethod(quote.paymentMethod ?? "Efectivo");
    setQuotationTemplate(quote.quotationTemplate ?? "");
    setFiscalUse(quote.fiscalUse ?? "Gastos en general");
    setDueDate(quote.dueDate ? quote.dueDate.slice(0, 10) : dateInputValue(1));
    setNotes(quote.notes ?? "");
    setItems(quote.lines.map(quoteLineToDraftItem));
    setActiveTab("lines");

    setCustomers((current) => {
      if (current.some((customer) => customer.id === quote.partnerId)) return current;
      return [
        {
          id: quote.partnerId,
          name: quote.partnerName,
          email: quote.partnerEmail,
          phone: quote.partnerPhone,
          pricelistId: quote.pricelistId,
          pricelistName: quote.pricelistName,
        },
        ...current,
      ];
    });
  }

  function resetForm() {
    setItems([]);
    setEditingQuoteId(null);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setCustomerPickerOpen(false);
    setSelectedPricelistId("");
    setPaymentTerm("Inmediato");
    setPaymentMethod("Efectivo");
    setQuotationTemplate("Estandar Worldcam");
    setFiscalUse("Gastos en general");
    setDueDate(dateInputValue(1));
    setNotes("");
    setMessage(null);
    setDraftStatus("idle");
    if (typeof window !== "undefined") {
      localStorage.removeItem(salesDraftStorageKey);
    }
  }

  async function saveQuotationDraft(): Promise<Quote | null> {
    setMessage(null);

    const response = await fetch(editingQuoteId ? `${apiBaseUrl}/api/sales/quotations/${editingQuoteId}` : `${apiBaseUrl}/api/sales/quotations`, {
      method: editingQuoteId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        partnerId: Number(selectedCustomerId),
        paymentTerm,
        paymentMethod,
        quotationTemplate,
        fiscalUse,
        dueDate,
        notes,
        items: items.map((item) => ({ productId: item.variantId, qty: item.qty })),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "No se pudo guardar la cotizacion");
      return null;
    }
    setQuotes((current) => editingQuoteId ? current.map((quote) => (quote.id === data.id ? data : quote)) : [data, ...current]);
    setSelectedQuoteId(data.id);
    setEditingQuoteId(data.id);
    return data as Quote;
  }

  async function createQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const saved = await saveQuotationDraft();
      if (!saved) return;
      setMode("list");
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function confirmQuotationFromForm() {
    setSaving(true);

    try {
      const saved = await saveQuotationDraft();
      if (!saved) return;
      const confirmed = await quoteAction(saved.id, "confirm");
      if (!confirmed) return;
      setMode("list");
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function quoteAction(id: string, action: "send" | "confirm") {
    setMessage(null);
    const response = await fetch(`${apiBaseUrl}/api/sales/quotations/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message ?? "No se pudo actualizar la cotizacion");
      return false;
    }
    setQuotes((current) => current.map((quote) => (quote.id === id ? data : quote)));
    setSelectedQuoteId(data.id);
    return true;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#0a1220_0%,#08111f_42%,#060b14_100%)] text-white">
      <SiteHeader active="ventas" />

      {!authReady || loading ? (
        <section className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" aria-hidden />
        </section>
      ) : !user ? (
        <AccessPanel title="Inicia sesion" text="Necesitas entrar con una cuenta autorizada para ver ventas." href="/login" />
      ) : !isEmployee ? (
        <AccessPanel title="Acceso de empleado requerido" text="Ventas solo se muestra para empleados autorizados." href="/" />
      ) : (
        <>
          <SalesModuleBar activeView={salesView} quoteCount={quotes.length} templateCount={quotationTemplates.length} />
          <section className="border-b border-white/10 bg-[#0b1424]/95">
            <div className="mx-auto grid max-w-[1800px] gap-3 px-3 py-4 sm:px-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <button onClick={() => { resetForm(); setSalesView("ordenes"); setMode("new"); setSelectedQuoteId(null); }} className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-coral px-4 text-sm font-black text-white shadow-lg shadow-coral/15 transition hover:bg-coral/90">
                  <Plus className="h-4 w-4" aria-hidden />
                  Nuevo
                </button>
                <div className="min-w-0 border-l border-white/10 pl-4">
                  <h1 className="truncate text-lg font-black tracking-wide">{currentViewTitle}</h1>
                  <p className="text-xs text-blue-100/45">{currentViewSubtitle}</p>
                </div>
              </div>
              <div className="flex h-10 w-full min-w-0 items-center rounded-lg border border-blue-300/20 bg-[#101b30] shadow-inner shadow-black/20">
                <Search className="ml-3 h-4 w-4 text-blue-100/60" aria-hidden />
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-blue-100/45"
                  placeholder={salesView === "plantillas" ? "Buscar plantilla, producto o estimado..." : "Buscar numero, cliente, vendedor, estado..."}
                  value={salesSearch}
                  onChange={(event) => setSalesSearch(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-blue-100 lg:justify-end">
                <span>
                  {salesView === "plantillas"
                    ? `${filteredTemplates.length} / ${quotationTemplates.length}`
                    : `${filteredQuotes.length} / ${quotes.length}`}
                </span>
                <button className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 p-2 text-cyan-100"><LayoutList className="h-4 w-4" aria-hidden /></button>
              </div>
            </div>
          </section>

          {mode === "new" ? (
            <QuotationForm
              title={editingQuoteId ? `Editar ${quotes.find((quote) => quote.id === editingQuoteId)?.odooOrderName ?? quotes.find((quote) => quote.id === editingQuoteId)?.number ?? "cotizacion"}` : "Nueva cotizacion"}
              isEditing={Boolean(editingQuoteId)}
              customers={customers}
              filteredProducts={filteredProducts}
              selectedCustomer={selectedCustomer}
              selectedCustomerId={selectedCustomerId}
              setSelectedCustomerId={setSelectedCustomerId}
              customerPickerOpen={customerPickerOpen}
              setCustomerPickerOpen={setCustomerPickerOpen}
              pricelists={pricelists}
              quotationTemplates={quotationTemplates}
              selectedPricelist={selectedPricelist}
              selectedPricelistId={selectedPricelistId}
              setSelectedPricelistId={setSelectedPricelistId}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              paymentTerm={paymentTerm}
              setPaymentTerm={setPaymentTerm}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              quotationTemplate={quotationTemplate}
              setQuotationTemplate={applyQuotationTemplate}
              fiscalUse={fiscalUse}
              setFiscalUse={setFiscalUse}
              dueDate={dueDate}
              setDueDate={setDueDate}
              notes={notes}
              setNotes={setNotes}
              items={items}
              setItems={setItems}
              addProduct={addProduct}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              subtotal={subtotal}
              tax={tax}
              total={total}
              saving={saving}
              draftStatus={draftStatus}
              message={message}
              onSubmit={createQuotation}
              onConfirm={confirmQuotationFromForm}
              onCancel={() => {
                resetForm();
                setMode("list");
              }}
            />
          ) : salesView === "plantillas" ? (
            <QuotationTemplatesView
              templates={filteredTemplates}
              onUseTemplate={(templateName) => {
                resetForm();
                setSalesView("ordenes");
                setMode("new");
                setQuotationTemplate(templateName);
                window.setTimeout(() => applyQuotationTemplate(templateName), 0);
              }}
            />
          ) : (
            <section className="mx-auto grid max-w-[1800px] gap-4 px-3 py-4 sm:px-4 sm:py-5 xl:grid-cols-[1fr_400px]">
              <div className="overflow-hidden rounded-xl border border-blue-200/10 bg-[#0d1728] shadow-2xl shadow-black/20">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#121f35] px-5 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-cyan-200/70">Mesa de cotizaciones</p>
                    <h2 className="text-2xl font-black text-white">Pipeline de ventas</h2>
                  </div>
                  <div className="grid w-full grid-cols-1 gap-2 text-right text-xs sm:w-auto sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-[#0b1324] px-3 py-2">
                      <p className="text-blue-100/50">Cotizaciones</p>
                      <p className="text-lg font-black">{quotes.length}</p>
                    </div>
                    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
                      <p className="text-blue-100/50">Abiertas</p>
                      <p className="text-lg font-black">{quotes.filter((quote) => quote.status !== "sale" && quote.status !== "cancel").length}</p>
                    </div>
                    <div className="rounded-lg border border-[#e75d5c]/20 bg-[#e75d5c]/10 px-3 py-2">
                      <p className="text-blue-100/50">Vendido</p>
                      <p className="text-lg font-black">{money(quotes.filter((quote) => quote.status === "sale").reduce((sum, quote) => sum + quote.amountTotal, 0))}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs font-bold uppercase tracking-wide text-blue-100/55">
                    <tr>
                      <th className="w-8 px-3 py-3"><input type="checkbox" /></th>
                      <th className="px-3 py-3">Numero</th>
                      <th className="px-3 py-3">Fecha de creacion</th>
                      <th className="px-3 py-3">Cliente</th>
                      <th className="px-3 py-3">Nivel Cliente</th>
                      <th className="px-3 py-3">Vendedor</th>
                      <th className="px-3 py-3">Actividades</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="w-8 px-3 py-3"><SlidersHorizontal className="h-4 w-4" aria-hidden /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map((quote) => (
                      <tr key={quote.id} onClick={() => openQuoteForEditing(quote)} className={`cursor-pointer border-t border-white/10 transition hover:bg-cyan-400/10 ${selectedQuoteId === quote.id ? "bg-cyan-400/15" : ""}`}>
                        <td className="px-3 py-2"><input type="checkbox" /></td>
                        <td className="px-3 py-2 font-semibold text-blue-200">{quote.odooOrderName ?? quote.number}</td>
                        <td className="px-3 py-2">{new Date(quote.createdAt).toLocaleString("es-MX")}</td>
                        <td className="px-3 py-2 text-white">{quote.partnerName}</td>
                        <td className="px-3 py-2">{quote.pricelistName ?? "Nuevo"}</td>
                        <td className="px-3 py-2"><span className="mr-2 rounded bg-green-600 px-2 py-1 text-xs font-black text-white">{quote.createdByEmail[0]?.toUpperCase()}</span>{quote.createdByEmail}</td>
                        <td className="px-3 py-2 text-blue-100/60">{quote.status === "sent" ? <Mail className="h-4 w-4 text-cyan-300" aria-hidden /> : <Clock3 className="h-4 w-4" aria-hidden />}</td>
                        <td className="px-3 py-2 text-right font-bold">{money(quote.amountTotal)}</td>
                        <td className="px-3 py-2"><StatusBadge status={quote.status} /></td>
                        <td className="px-3 py-2" />
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredQuotes.length === 0 ? (
                  <div className="border-t border-white/10 px-5 py-10 text-center text-blue-100/55">
                    <Search className="mx-auto h-8 w-8" aria-hidden />
                    <p className="mt-3 font-black">No encontramos cotizaciones</p>
                    <p className="mt-1 text-sm">Prueba con otro numero, cliente, vendedor o estado.</p>
                  </div>
                ) : null}
                </div>
              </div>

              <aside className="rounded-xl border border-blue-200/10 bg-[#0d1728] p-4 shadow-2xl shadow-black/20">
                {selectedQuote ? (
                  <QuoteDetail quote={selectedQuote} onSend={() => quoteAction(selectedQuote.id, "send")} onConfirm={() => quoteAction(selectedQuote.id, "confirm")} message={message} />
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-blue-100/50">
                    <FilePlus2 className="h-10 w-10" aria-hidden />
                    <p className="mt-3 font-bold">Selecciona una cotizacion</p>
                  </div>
                )}
              </aside>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SalesModuleBar({ activeView, quoteCount, templateCount }: { activeView: SalesView; quoteCount: number; templateCount: number }) {
  const moduleItems = [
    { label: "Ordenes", href: "/ventas?vista=ordenes", icon: LayoutList, active: activeView === "ordenes", badge: quoteCount },
    { label: "Plantillas", href: "/ventas?vista=plantillas", icon: FilePlus2, active: activeView === "plantillas", badge: templateCount },
    { label: "Productos", href: "/catalogo", icon: PackageSearch, active: false, badge: null },
  ];

  return (
    <section className="border-b border-white/10 bg-[#0e1728]/95 text-white shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3 px-3 py-4 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-coral ring-1 ring-coral/25">
            <LayoutList className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/65">Modulo interno</p>
            <h2 className="truncate text-2xl font-black">Ventas</h2>
          </div>
        </div>
        <nav className="flex w-full gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#08111f]/70 p-1 lg:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {moduleItems.map((item) => {
          const Icon = item.icon;
          return (
          <a
            key={item.label}
            href={item.href}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-black transition ${
              item.active ? "bg-blue-700 text-white shadow-lg shadow-blue-950/30" : "text-blue-100/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
            {typeof item.badge === "number" ? (
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${item.active ? "bg-white/15 text-white" : "bg-white/10 text-blue-100/70"}`}>
                {item.badge}
              </span>
            ) : null}
          </a>
          );
        })}
        </nav>
      </div>
    </section>
  );
}

function QuotationTemplatesView({ templates, onUseTemplate }: { templates: QuotationTemplate[]; onUseTemplate: (templateName: string) => void }) {
  return (
    <section className="mx-auto max-w-[1800px] px-3 py-4 sm:px-4 sm:py-5">
      <div className="overflow-hidden rounded-xl border border-blue-200/10 bg-[#0d1728] shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#121f35] px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-200/70">Plantillas de cotizacion</p>
            <h2 className="text-2xl font-black text-white">Paquetes comerciales</h2>
            <p className="mt-1 text-sm text-blue-100/55">Usa una plantilla para iniciar una cotizacion con productos predefinidos.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0b1324] px-4 py-3 text-right">
            <p className="text-xs text-blue-100/50">Plantillas</p>
            <p className="text-2xl font-black">{templates.length}</p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center text-blue-100/55">
            <FilePlus2 className="h-10 w-10" aria-hidden />
            <p className="mt-3 font-bold">No hay plantillas disponibles</p>
            <p className="mt-1 text-sm">Revisa que Odoo tenga plantillas de cotizacion activas.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-3 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const lineCount = template.lines?.length ?? 0;
              const estimatedTotal = template.lines?.reduce((sum, line) => sum + Number(line.priceUnit ?? 0) * Number(line.qty ?? 1), 0) ?? 0;

              return (
                <article key={template.id} className="rounded-xl border border-white/10 bg-[#111b2e] p-4 shadow-lg shadow-black/15 transition hover:border-cyan-400/50 hover:bg-[#14213a]">
                  <p className="text-xs font-black uppercase text-cyan-200/70">Plantilla</p>
                  <h3 className="mt-2 line-clamp-2 min-h-[56px] text-xl font-black text-white">{template.name}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <p className="text-blue-100/50">Lineas</p>
                      <p className="text-lg font-black">{lineCount}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <p className="text-blue-100/50">Estimado</p>
                      <p className="text-lg font-black">{money(estimatedTotal)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUseTemplate(template.name)}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coral text-sm font-black text-white transition hover:bg-coral/90"
                  >
                    Usar plantilla
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function QuotationForm(props: {
  title: string;
  isEditing: boolean;
  customers: Customer[];
  filteredProducts: Product[];
  selectedCustomer?: Customer;
  selectedCustomerId: string;
  setSelectedCustomerId: (value: string) => void;
  customerPickerOpen: boolean;
  setCustomerPickerOpen: (value: boolean) => void;
  pricelists: Pricelist[];
  quotationTemplates: QuotationTemplate[];
  selectedPricelist?: Pricelist;
  selectedPricelistId: string;
  setSelectedPricelistId: (value: string) => void;
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  paymentTerm: string;
  setPaymentTerm: (value: string) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  quotationTemplate: string;
  setQuotationTemplate: (value: string) => void;
  fiscalUse: string;
  setFiscalUse: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  items: DraftItem[];
  setItems: Dispatch<SetStateAction<DraftItem[]>>;
  addProduct: (product: Product) => void;
  activeTab: FormTab;
  setActiveTab: (tab: FormTab) => void;
  subtotal: number;
  tax: number;
  total: number;
  saving: boolean;
  draftStatus: DraftStatus;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={props.onSubmit} className="mx-auto max-w-[1800px] px-3 py-4 sm:px-4 sm:py-5">
      <div className="mb-3 flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-[#0f1a2d] px-3 py-3 shadow-2xl shadow-black/15 sm:px-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={props.saving || !props.selectedCustomerId || props.items.length === 0} className="h-10 rounded-lg bg-coral px-4 text-sm font-black text-white shadow-lg shadow-coral/15 transition hover:bg-coral/90 disabled:opacity-50">
            <span className="inline-flex items-center gap-2">{props.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}{props.saving ? "Guardando..." : props.isEditing ? "Guardar cambios" : "Guardar cotizacion"}</span>
          </button>
          <button type="button" onClick={props.onCancel} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10">Descartar</button>
        </div>
        <div className="grid w-full grid-cols-3 overflow-hidden rounded-lg border border-white/10 text-xs font-bold sm:text-sm md:w-auto md:min-w-[420px]">
          <span className="bg-cyan-400/15 px-5 py-2 text-center text-cyan-100 ring-1 ring-inset ring-cyan-400/50">Cotizacion</span>
          <span className="border-l border-white/10 bg-white/[0.04] px-5 py-2 text-center text-blue-100/55">Enviada</span>
          <span className="border-l border-white/10 bg-white/[0.04] px-5 py-2 text-center text-blue-100/55">Orden</span>
        </div>
      </div>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-cyan-400/10 bg-[#121f35] px-3 py-3 text-white lg:flex-row lg:items-center">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button type="button" className="h-9 rounded-lg bg-[#714b67] px-4 text-sm font-bold transition hover:bg-[#865a7a]">Enviar</button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-4 text-sm font-bold transition hover:bg-white/10"><Printer className="h-4 w-4" aria-hidden />Imprimir</button>
          <button
            type="button"
            disabled={props.saving || !props.selectedCustomerId || props.items.length === 0}
            onClick={props.onConfirm}
            className="h-9 rounded-lg border border-green-400/30 bg-green-500/15 px-4 text-sm font-black text-green-100 transition hover:bg-green-500/25 disabled:opacity-50"
            title="Crea la cotizacion en Odoo y la confirma como orden"
          >
            Confirmar
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button type="button" className="h-9 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10">Vista previa</button>
          <button type="button" className="h-9 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10">Shipped Qty</button>
          <button type="button" onClick={props.onCancel} className="h-9 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-bold text-blue-100 transition hover:bg-white/10">Cancelar</button>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-200/10 bg-[#0d1728] p-3 text-white shadow-2xl shadow-black/25 sm:p-5">
        <div className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-[#121f35] p-4 sm:p-5 lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-200/70">{props.isEditing ? "Cotizacion existente" : "Nueva oportunidad"}</p>
            <h2 className="mt-1 text-3xl font-black sm:text-4xl">{props.title}</h2>
            <p className="mt-2 text-sm text-blue-100/55">Prepara, ajusta y confirma una propuesta comercial sin salir del flujo de ventas.</p>
          </div>
          <div className="rounded-xl border border-cyan-300/20 bg-[#08111f] px-4 py-3 text-sm shadow-inner shadow-black/30">
            <p className="flex justify-between text-blue-100/60"><span>Subtotal</span><strong className="text-white">{money(props.subtotal)}</strong></p>
            <p className="mt-1 flex justify-between text-blue-100/60"><span>Impuestos</span><strong className="text-white">{money(props.tax)}</strong></p>
            <p className="mt-2 flex justify-between border-t border-white/10 pt-2 text-lg font-black"><span>Total</span><strong>{money(props.total)}</strong></p>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <h3 className="text-sm font-black uppercase text-blue-100">Cliente y plantilla</h3>
            <Field label="Cliente">
              <div className="relative">
                <div className="flex rounded-lg border border-cyan-400/20 bg-[#08111f] px-3">
                  <input
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-blue-100/35"
                    placeholder="Comience a escribir para encontrar a un cliente..."
                    value={props.customerSearch}
                    onFocus={() => props.setCustomerPickerOpen(true)}
                    onChange={(e) => {
                      props.setCustomerSearch(e.target.value);
                      props.setCustomerPickerOpen(true);
                      props.setSelectedCustomerId("");
                    }}
                  />
                  <button type="button" className="px-2 text-cyan-300" onClick={() => props.setCustomerPickerOpen(!props.customerPickerOpen)}>
                    v
                  </button>
                </div>
                {props.customerPickerOpen ? (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-white/10 bg-[#333744] py-2 text-sm shadow-2xl">
                    {props.customers.length === 0 ? (
                      <p className="px-4 py-3 text-blue-100/60">Sin resultados</p>
                    ) : (
                      props.customers.slice(0, 12).map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="grid w-full grid-cols-[1fr_auto] gap-4 px-4 py-2 text-left text-white hover:bg-white/10"
                          onClick={() => {
                            props.setSelectedCustomerId(String(customer.id));
                            props.setCustomerSearch(customer.name);
                            props.setCustomerPickerOpen(false);
                          }}
                        >
                          <span className="font-semibold">{customer.name}</span>
                          <span className="text-blue-100/50">{customer.email || customer.phone || ""}</span>
                        </button>
                      ))
                    )}
                    {props.customerSearch.trim() ? (
                      <div className="border-t border-white/10 px-4 py-2 text-cyan-300">Buscar mas...</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Direccion de factura">
              <div className="space-y-1 text-sm text-slate-300">
                <p>{customerAddress(props.selectedCustomer) || "Se tomara del cliente de Odoo"}</p>
                {props.selectedCustomer?.email ? <p className="text-blue-100/55">{props.selectedCustomer.email}</p> : null}
                {props.selectedCustomer?.phone ? <p className="text-blue-100/55">{props.selectedCustomer.phone}</p> : null}
              </div>
            </Field>
            <Field label="Datos fiscales">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-cyan-400/15 bg-[#08111f] px-3 py-2">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-blue-100/45">RFC</span>
                  <strong className="mt-1 block text-white">{props.selectedCustomer?.vat || "Sin RFC"}</strong>
                </div>
                <div className="rounded-lg border border-cyan-400/15 bg-[#08111f] px-3 py-2">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-blue-100/45">Regimen fiscal</span>
                  <strong className="mt-1 block text-white">{fiscalRegimeText(props.selectedCustomer?.fiscalRegime) || "No registrado"}</strong>
                </div>
              </div>
            </Field>
            <Field label="Plantilla de cotizacion">
              <div className="flex items-end gap-2">
                <select className="min-w-0 flex-1 rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" value={props.quotationTemplate} onChange={(e) => props.setQuotationTemplate(e.target.value)}>
                  <option value="">Seleccionar plantilla</option>
                  {props.quotationTemplates.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => props.setQuotationTemplate(props.quotationTemplate)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                  title="Aplicar plantilla"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </Field>
          </div>
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <h3 className="text-sm font-black uppercase text-blue-100">Condiciones comerciales</h3>
            <Field label="Vencimiento"><input type="date" value={props.dueDate} onChange={(event) => props.setDueDate(event.target.value)} className="w-full rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" /></Field>
            <Field label="CFDI para publico en general"><input type="checkbox" className="h-4 w-4 accent-cyan-500" defaultChecked /></Field>
            <Field label="Fecha de cotizacion"><span className="text-sm">{new Date().toLocaleString("es-MX")}</span></Field>
            <Field label="Lista de precios">
              <select className="w-full rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" value={props.selectedPricelistId || String(props.selectedCustomer?.pricelistId ?? "")} onChange={(e) => props.setSelectedPricelistId(e.target.value)}>
                <option value="">{props.selectedCustomer?.pricelistName ?? "Precio Publico (MXN)"}</option>
                {props.pricelists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Forma de pago">
              <select className="w-full rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" value={props.paymentMethod} onChange={(e) => props.setPaymentMethod(e.target.value)}>
                {paymentMethods.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Uso">
              <select className="w-full rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" value={props.fiscalUse} onChange={(e) => props.setFiscalUse(e.target.value)}>
                {fiscalUses.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Terminos de pago">
              <select className="w-full rounded-lg border border-cyan-400/20 bg-[#08111f] px-3 py-2 text-sm text-white outline-none" value={props.paymentTerm} onChange={(e) => props.setPaymentTerm(e.target.value)}>
                {paymentTerms.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-7 overflow-x-auto rounded-xl border border-blue-200/10 bg-[#091323] shadow-inner shadow-black/20">
          <div className="flex flex-wrap border-b border-white/10 bg-[#121f35] text-sm">
            {[
              ["lines", "Lineas de la orden"],
              ["optional", "Productos opcionales"],
              ["other", "Otra informacion"],
              ["advance", "Advance Payment"],
              ["pos", "POS Payment"],
            ].map(([key, label]) => (
              <button type="button" key={key} onClick={() => props.setActiveTab(key as FormTab)} className={`border-r border-white/10 px-5 py-3 font-bold ${props.activeTab === key ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-400/40" : "text-blue-100/70 hover:bg-white/[0.06] hover:text-white"}`}>{label}</button>
            ))}
          </div>
          {props.activeTab === "other" ? (
            <OtherInformation paymentMethod={props.paymentMethod} />
          ) : props.activeTab === "advance" || props.activeTab === "pos" ? (
            <EmptyTab title={props.activeTab === "advance" ? "Advance Payment" : "POS Payment"} />
          ) : (
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-[#0f1a2d] text-left text-xs uppercase tracking-wide text-blue-100/70">
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Unidad</th>
                <th className="px-4 py-2">Cantidad dis...</th>
                <th className="px-4 py-2">Precio unitario</th>
                <th className="px-4 py-2">Margen (%)</th>
                <th className="px-4 py-2">Impuestos</th>
                <th className="px-4 py-2 text-right">Importe</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {props.items.map((item) => (
                <tr key={item.variantId} className="border-b border-white/10 bg-[#111827] transition hover:bg-white/[0.035]">
                  <td className="px-4 py-3"><p className="font-bold text-white">{item.name}</p><p className="text-xs text-blue-100/35">{item.sku}</p></td>
                  <td className="px-4 py-3"><input type="number" min={1} className="w-20 rounded-md border border-cyan-400/25 bg-[#08111f] px-2 py-1 text-right text-white outline-none" value={item.qty} onChange={(e) => props.setItems((current) => current.map((row) => row.variantId === item.variantId ? { ...row, qty: Number(e.target.value) } : row))} /></td>
                  <td className="px-4 py-2">Unidades</td>
                  <td className="px-4 py-2">{item.stock}</td>
                  <td className="px-4 py-2">{money(item.price)}</td>
                  <td className="px-4 py-2">0.00</td>
                  <td className="px-4 py-2">IVA 16%</td>
                  <td className="px-4 py-2 text-right font-bold">{money(item.price * item.qty)}</td>
                  <td><button type="button" className="rounded-md p-2 transition hover:bg-red-400/10" onClick={() => props.setItems((current) => current.filter((row) => row.variantId !== item.variantId))}><Trash2 className="h-4 w-4 text-red-200/60" aria-hidden /></button></td>
                </tr>
              ))}
              <tr>
                <td colSpan={9} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <div>
                      <span className="font-black text-cyan-200">Agregar producto</span>
                      <p className="text-xs text-blue-100/45">Busca por clave, marca, categoria o descripcion.</p>
                    </div>
                    <input className="w-full rounded-lg border border-cyan-400/25 bg-[#08111f] px-3 py-2 text-sm text-white outline-none placeholder:text-blue-100/35 sm:min-w-[280px]" placeholder="Catalogo / buscar producto" value={props.productSearch} onChange={(e) => props.setProductSearch(e.target.value)} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {props.filteredProducts.map((product) => (
                      <article
                        key={product.variantId}
                        className="relative min-h-[300px] select-text rounded-xl border border-blue-200/10 bg-[#111b2e] p-4 text-left text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-[#14213a]"
                      >
                        {product.image ? (
                          <img className="absolute right-4 top-4 h-16 w-16 rounded-lg border border-white/10 bg-white object-contain p-1" src={product.image} alt="" />
                        ) : (
                          <div className="absolute right-4 top-4 flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-[#0b1324] text-xs text-blue-100/35">IMG</div>
                        )}
                        <div className="pr-20">
                          <p className="text-xs font-black uppercase text-cyan-200/75">{product.brand || "Worldcam"}</p>
                          <p className="mt-1 text-base font-black leading-snug">{product.name}</p>
                        </div>
                        <div className="mt-5 space-y-2 text-sm">
                          <p>
                            <span className="text-blue-100/50">Modelo: </span>
                            <span className="font-black">{product.clave || "Sin modelo"}</span>
                          </p>
                          <p>
                            <span className="text-blue-100/50">SKU: </span>
                            <span className="font-black">{product.sku || "Sin SKU"}</span>
                          </p>
                          <p>
                            <span className="text-blue-100/50">Precio: </span>
                            <span className="font-black">{money(product.price)}</span>
                          </p>
                          <p>
                            <span className="text-blue-100/50">A la mano: </span>
                            <span className="font-black">{product.stock.toLocaleString("es-MX")}</span>
                            <span className="ml-1">Unidades</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => props.addProduct(product)}
                          className="absolute bottom-4 right-4 rounded-lg bg-coral px-3 py-2 text-sm font-black text-white transition hover:bg-coral/90"
                        >
                          Agregar
                        </button>
                      </article>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
          <textarea className="min-h-24 w-full rounded-xl border border-blue-200/10 bg-[#08111f] p-3 text-sm text-white outline-none placeholder:text-blue-100/35" placeholder="Terminos y condiciones..." value={props.notes} onChange={(e) => props.setNotes(e.target.value)} />
          <div className="w-full space-y-2 rounded-xl border border-white/10 bg-[#08111f] p-4 text-sm">
            <p className="flex justify-between"><span>Subtotal:</span><strong>{money(props.subtotal)}</strong></p>
            <p className="flex justify-between"><span>Impuestos:</span><strong>{money(props.tax)}</strong></p>
            <p className="flex justify-between border-t border-white/10 pt-3 text-xl"><span>Total:</span><strong>{money(props.total)}</strong></p>
          </div>
        </div>
        {props.message ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{props.message}</p> : null}
      </section>
    </form>
  );
}

function OtherInformation({ paymentMethod }: { paymentMethod: string }) {
  return (
    <div className="grid min-h-[420px] gap-8 p-6 text-sm lg:grid-cols-2">
      <div className="space-y-8">
        <InfoBlock title="VENTAS" rows={[
          ["Vendedor", "Administrador"],
          ["Equipo de ventas", "Ventas"],
          ["Firma en linea", "Si"],
          ["Pago en linea", "No"],
          ["Referencia del cliente", ""],
          ["Etiquetas", ""],
        ]} />
        <InfoBlock title="ENTREGA" rows={[
          ["Almacen", "My Company"],
          ["Incoterm", ""],
          ["Ubicacion del incoterm", ""],
          ["Politica de envio", "Lo antes posible"],
          ["Peso de envio", "0.00"],
          ["Fecha de entrega", ""],
        ]} />
      </div>
      <div className="space-y-8">
        <InfoBlock title="FACTURACION" rows={[
          ["Posicion fiscal", "Foreign Trade"],
          ["Metodo de pago", paymentMethod],
        ]} />
        <InfoBlock title="SEGUIMIENTO" rows={[
          ["Documento origen", ""],
          ["Oportunidad", ""],
          ["Campana", ""],
          ["Medio", ""],
          ["Origen", ""],
        ]} />
      </div>
    </div>
  );
}

function InfoBlock({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <h3 className="border-b border-slate-600 pb-2 text-sm font-black">{title}</h3>
      <div className="mt-4 space-y-4">
        {rows.map(([label, value]) => (
          <p key={label} className="grid gap-1 sm:grid-cols-[170px_1fr] sm:gap-4">
            <span className="font-bold">{label}</span>
            <span className={value ? "text-white" : "text-slate-500"}>{value || "-"}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function EmptyTab({ title }: { title: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center text-slate-400">
      {title} listo para conectar reglas avanzadas de Odoo.
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm sm:grid-cols-[155px_1fr] sm:items-start sm:gap-4"><span className="text-xs font-black uppercase tracking-wide text-blue-100/60 sm:pt-2">{label}</span>{children}</label>;
}

function QuoteDetail({ quote, onSend, onConfirm, message }: { quote: Quote; onSend: () => void; onConfirm: () => void; message: string | null }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button disabled={quote.status !== "draft"} onClick={onSend} className="flex h-9 items-center gap-2 rounded-lg bg-[#714b67] px-3 text-sm font-bold text-white transition hover:bg-[#865a7a] disabled:opacity-40"><Mail className="h-4 w-4" aria-hidden />Enviar</button>
        <button disabled={quote.status === "sale"} onClick={onConfirm} className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 text-sm font-bold text-ink transition hover:bg-blue-50 disabled:opacity-40"><Check className="h-4 w-4" aria-hidden />Confirmar</button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-black uppercase text-blue-100/50">Cotizacion seleccionada</p>
        <h2 className="mt-1 text-3xl font-black">{quote.odooOrderName ?? quote.number}</h2>
        <p className="mt-1 text-sm text-blue-100/60">{quote.partnerName}</p>
      </div>
      <div className="my-4"><StatusBadge status={quote.status} /></div>
      <div className="space-y-2 rounded-xl border border-white/10 bg-[#08111f] p-4 text-sm">
        <p className="flex justify-between"><span>Lista de precios</span><strong>{quote.pricelistName ?? "Sin lista"}</strong></p>
        <p className="flex justify-between"><span>Terminos de pago</span><strong>{quote.paymentTerm ?? "Inmediato"}</strong></p>
        <p className="flex justify-between"><span>Uso</span><strong>{quote.fiscalUse ?? "Gastos en general"}</strong></p>
      </div>
      <div className="mt-4 space-y-2">
        {quote.lines.map((line) => (
          <div key={line.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm">
            <p className="font-bold">{line.productName}</p>
            <p className="text-slate-500">{line.qty} x {money(line.priceUnit)} · {line.sku}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm">
        <p className="flex justify-between"><span>Subtotal</span><strong>{money(quote.amountUntaxed)}</strong></p>
        <p className="flex justify-between"><span>Impuestos</span><strong>{money(quote.amountTax)}</strong></p>
        <p className="flex justify-between border-t border-white/10 pt-3 text-xl"><span>Total</span><strong>{money(quote.amountTotal)}</strong></p>
      </div>
      {message ? <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: Quote["status"] }) {
  const classes = status === "sale" ? "bg-green-600 text-white" : status === "sent" ? "bg-cyan-600 text-white" : status === "cancel" ? "bg-slate-300 text-slate-800" : "bg-cyan-100 text-cyan-800";
  const Icon = status === "sale" ? CheckCircle2 : status === "cancel" ? X : Clock3;
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${classes}`}><Icon className="h-3.5 w-3.5" aria-hidden />{stateLabels[status]}</span>;
}

function AccessPanel({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-xl items-center px-4">
      <div className="w-full rounded-lg border border-slate-200 bg-white p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#714b67]" aria-hidden />
        <h1 className="mt-4 text-3xl font-black">{title}</h1>
        <p className="mt-3 text-slate-600">{text}</p>
        <a href={href} className="mt-6 inline-flex h-11 items-center gap-2 rounded bg-blue-700 px-5 font-black text-white">
          <UserRound className="h-5 w-5" aria-hidden />
          Continuar
        </a>
      </div>
    </section>
  );
}
