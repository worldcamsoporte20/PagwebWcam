"use client";

import {
  AlertCircle,
  Banknote,
  Barcode,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutGrid,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number; variantId: number; sku: string; clave: string;
  name: string; stock: number; price: number; category: string; brand: string; image?: string;
};
type OrderLine = {
  id: number; product_id: [number, string] | false;
  product_uom_qty: number; price_unit: number; price_subtotal: number; name: string;
};
type SaleOrder = {
  id: number; name: string; partner_id: [number, string] | false;
  amount_total: number; amount_tax: number; amount_untaxed: number;
  state: string; invoice_status: string; date_order: string; lines: OrderLine[];
};
type CartItem = {
  productId: number; variantId: number; sku: string; name: string;
  price: number; qty: number; image?: string;
};
type PaymentMethod = "cash" | "card" | "account";
type Customer = {
  id: number; name: string; email: string; phone: string;
  pricelistId?: number; pricelistName?: string;
};
type QuickSaleResult = {
  success: boolean; saleOrderId?: number; saleOrderName?: string; partnerName?: string;
  amountUntaxed?: number; amountTax?: number; amountTotal?: number; error?: string;
};
type PricePreviewResult = {
  pricelistId?: number; pricelistName?: string;
  items: { productId: number; price: number }[];
  amountUntaxed: number; amountTax: number; amountTotal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CajaPage() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "";

  // core
  const [products, setProducts] = useState<Product[]>([]);
  const [quotes, setQuotes] = useState<SaleOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loadedOrder, setLoadedOrder] = useState<{ id: number; name: string; partnerName?: string } | null>(null);
  const [orderTaxOverride, setOrderTaxOverride] = useState<number | null>(null);

  // ui
  const [productSearch, setProductSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [rightPanel, setRightPanel] = useState<"cart" | "orders">("cart");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeStatus, setBarcodeStatus] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [bumpId, setBumpId] = useState<number | null>(null);

  // payment
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [processingOdoo, setProcessingOdoo] = useState(false);
  const [odooError, setOdooError] = useState<string | null>(null);

  // quick-sale customer
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [activePricelistName, setActivePricelistName] = useState("");

  // receipt
  const [receiptData, setReceiptData] = useState<{
    cart: CartItem[]; subtotal: number; tax: number; total: number; method: string;
    change: number; orderName?: string; partnerName?: string; odooSynced: boolean;
  } | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // ── derived ──────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = orderTaxOverride !== null ? orderTaxOverride : subtotal * 0.16;
  const total = subtotal + tax;
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));
  const priceKey = cart.map((i) => `${i.variantId}:${i.qty}`).join("|");

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category))).sort()];
  const filtered = products.filter((p) => {
    const s = productSearch.toLowerCase();
    return (
      (!s || `${p.name} ${p.sku} ${p.brand} ${p.clave}`.toLowerCase().includes(s)) &&
      (category === "all" || p.category === category)
    );
  });

  // ── data loading ─────────────────────────────────────────────────────────────
  function loadProducts() {
    if (products.length > 0) return;
    setLoadingProducts(true);
    fetch(`${api}/api/catalog/products`)
      .then((r) => r.json()).then((d) => setProducts(d as Product[]))
      .catch(() => {}).finally(() => setLoadingProducts(false));
  }
  function loadQuotes() {
    setLoadingQuotes(true);
    fetch(`${api}/api/pos/quotes`)
      .then((r) => r.json()).then((d) => setQuotes(d as SaleOrder[]))
      .catch(() => {}).finally(() => setLoadingQuotes(false));
  }
  function loadCustomers(q = customerSearch) {
    setLoadingCustomers(true);
    fetch(`${api}/api/pos/customers?search=${encodeURIComponent(q)}`)
      .then((r) => r.json()).then((d) => setCustomers(d as Customer[]))
      .catch(() => {}).finally(() => setLoadingCustomers(false));
  }

  useEffect(() => { loadProducts(); loadQuotes(); }, []);

  useEffect(() => {
    if (scanMode) barcodeRef.current?.focus();
  }, [scanMode]);

  useEffect(() => {
    if (!paymentOpen || loadedOrder) return;
    loadCustomers("");
  }, [paymentOpen, loadedOrder]);

  useEffect(() => {
    if (!paymentOpen || loadedOrder || !selectedCustomerId || cart.length === 0) return;
    setLoadingPrices(true);
    fetch(`${api}/api/pos/price-preview`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: Number(selectedCustomerId), items: cart.map((i) => ({ productId: i.variantId, qty: i.qty })) }),
    })
      .then((r) => r.json())
      .then((p: PricePreviewResult) => {
        setActivePricelistName(p.pricelistName ?? "");
        setOrderTaxOverride(p.amountTax);
        setCart((prev) => prev.map((item) => {
          const priced = p.items.find((x) => x.productId === item.variantId);
          return priced ? { ...item, price: priced.price } : item;
        }));
      })
      .catch(() => setOdooError("No se pudieron recalcular precios"))
      .finally(() => setLoadingPrices(false));
  }, [paymentOpen, loadedOrder, selectedCustomerId, priceKey]);

  // ── cart ops ─────────────────────────────────────────────────────────────────
  function addProduct(product: Product) {
    setOrderTaxOverride(null);
    setLoadedOrder(null);
    setLastAdded(product.id);
    setBumpId(product.id);
    setTimeout(() => setLastAdded(null), 600);
    setTimeout(() => setBumpId(null), 400);
    setRightPanel("cart");
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === product.id);
      if (ex) return prev.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product.id, variantId: product.variantId, sku: product.sku, name: product.name, price: product.price, qty: 1, image: product.image }];
    });
  }

  function addFromQuote(order: SaleOrder) {
    setCart(order.lines.map((l) => ({
      productId: l.id, variantId: Array.isArray(l.product_id) ? l.product_id[0] : l.id,
      sku: "-", name: Array.isArray(l.product_id) ? l.product_id[1] : l.name,
      price: l.price_unit, qty: l.product_uom_qty,
    })));
    setOrderTaxOverride(order.amount_tax);
    setLoadedOrder({ id: order.id, name: order.name, partnerName: Array.isArray(order.partner_id) ? order.partner_id[1] : undefined });
    setOdooError(null);
    setRightPanel("cart");
  }

  function setQty(id: number, qty: number) {
    if (qty <= 0) setCart((p) => p.filter((i) => i.productId !== id));
    else setCart((p) => p.map((i) => i.productId === id ? { ...i, qty } : i));
  }

  function clearCart() {
    setCart([]); setOrderTaxOverride(null); setLoadedOrder(null); setOdooError(null);
  }

  // ── barcode ───────────────────────────────────────────────────────────────────
  async function handleBarcode(code: string) {
    if (!code.trim()) return;
    setBarcodeStatus("loading");
    try {
      const res = await fetch(`${api}/api/pos/barcode/${encodeURIComponent(code.trim())}`);
      const product = res.ok ? (await res.json() as Product | null) : null;
      if (!product) { setBarcodeStatus("notfound"); return; }
      addProduct(product);
      setBarcodeStatus("found");
      setBarcodeInput("");
      setTimeout(() => { setBarcodeStatus("idle"); setScanMode(false); }, 1500);
    } catch { setBarcodeStatus("notfound"); }
  }

  // ── payment ───────────────────────────────────────────────────────────────────
  async function confirmPayment() {
    setOdooError(null); setProcessingOdoo(true);
    let rSub = subtotal, rTax = tax, rTotal = total;
    let rName = loadedOrder?.name, rPartner = loadedOrder?.partnerName;
    let synced = false;
    try {
      if (loadedOrder) {
        if (paymentMethod !== "account") {
          const res = await fetch(`${api}/api/pos/process-payment`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: loadedOrder.id, paymentMethod, amount: total, orderName: loadedOrder.name }),
          });
          const r = await res.json() as { success: boolean; error?: string };
          if (!r.success) { setOdooError(r.error ?? "Error al registrar en Odoo"); setProcessingOdoo(false); return; }
        }
        synced = true;
      } else {
        const pid = Number(selectedCustomerId);
        if (!pid) { setOdooError("Seleccione el cliente antes de cobrar"); setProcessingOdoo(false); return; }
        const res = await fetch(`${api}/api/pos/quick-sale`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId: pid, paymentMethod, items: cart.map((i) => ({ productId: i.variantId, qty: i.qty })) }),
        });
        const r = await res.json() as QuickSaleResult;
        if (!r.success) { setOdooError(r.error ?? "Error al registrar en Odoo"); setProcessingOdoo(false); return; }
        rSub = r.amountUntaxed ?? subtotal; rTax = r.amountTax ?? tax; rTotal = r.amountTotal ?? total;
        rName = r.saleOrderName; rPartner = r.partnerName ?? customers.find((c) => c.id === pid)?.name;
        synced = true;
      }
    } catch { setOdooError("No se pudo conectar con el servidor"); setProcessingOdoo(false); return; }

    setProcessingOdoo(false);
    const change = paymentMethod === "cash" ? (parseFloat(cashReceived) || 0) - rTotal : 0;
    setReceiptData({ cart: [...cart], subtotal: rSub, tax: rTax, total: rTotal, method: paymentMethod === "cash" ? "Efectivo" : paymentMethod === "card" ? "Tarjeta" : "Cuenta cliente", change, orderName: rName, partnerName: rPartner, odooSynced: synced });
    setPaymentOpen(false);
    clearCart(); setCashReceived(""); setSelectedCustomerId(""); setActivePricelistName("");
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#0c1117] text-white">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#080d14] px-4">
        <a href="/cuenta" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-black text-white/35 transition-colors hover:bg-white/5 hover:text-white/70">
          ← Salir
        </a>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/20">
            <ReceiptText className="h-3.5 w-3.5 text-blue-400" aria-hidden />
          </div>
          <span className="text-[13px] font-black tracking-wider text-white/80">WORLDCAM POS</span>
        </div>

        {loadedOrder && (
          <div className="ml-1 flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/8 px-2.5 py-1">
            <span className="text-[11px] font-black text-blue-300">{loadedOrder.name}</span>
            {loadedOrder.partnerName && (
              <span className="hidden text-[11px] text-white/35 sm:inline">· {loadedOrder.partnerName}</span>
            )}
            <button onClick={clearCart} className="ml-0.5 text-white/25 hover:text-white/60">
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {products.length > 0 && (
            <span className="hidden text-xs text-white/25 sm:block">{products.length} productos</span>
          )}
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-black text-emerald-400">EN LÍNEA</span>
          </div>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Catalog ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#0a0e18] px-3 py-2">
            <div className={`flex h-9 flex-1 items-center overflow-hidden rounded-xl border transition-colors ${
              scanMode ? "border-blue-500/50 bg-blue-500/8" : "border-white/[0.08] bg-[#0c1117] focus-within:border-blue-500/40"
            }`}>
              {scanMode ? (
                <>
                  <Barcode className="ml-3 h-4 w-4 shrink-0 text-blue-400" aria-hidden />
                  <input
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcode(barcodeInput)}
                    placeholder="Escanea o escribe código y Enter..."
                    className="h-full flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-white/20"
                    autoFocus
                  />
                  {barcodeStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-400" aria-hidden />}
                  {barcodeStatus === "found" && <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" aria-hidden />}
                  {barcodeStatus === "notfound" && <AlertCircle className="mr-2 h-4 w-4 text-red-400" aria-hidden />}
                  <button onClick={() => { setScanMode(false); setBarcodeStatus("idle"); }} className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-white/8 text-white/40 hover:text-white/70">
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </>
              ) : (
                <>
                  <Search className="ml-3 h-4 w-4 shrink-0 text-white/25" aria-hidden />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto, SKU, marca..."
                    className="h-full flex-1 bg-transparent px-2.5 text-[13px] outline-none placeholder:text-white/20"
                  />
                  {productSearch && (
                    <button onClick={() => setProductSearch("")} className="mr-2 text-white/25 hover:text-white/50">
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => { setScanMode((v) => !v); setBarcodeInput(""); setBarcodeStatus("idle"); }}
              title="Escanear código de barras"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                scanMode ? "border-blue-500/50 bg-blue-600 text-white" : "border-white/[0.08] bg-[#0c1117] text-white/40 hover:border-white/15 hover:text-white/70"
              }`}
            >
              <Barcode className="h-4 w-4" aria-hidden />
            </button>

            {loadingProducts && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/25" aria-hidden />}
          </div>

          {/* Category chips */}
          {categories.length > 2 && (
            <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/[0.05] bg-[#0a0e18] px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-lg px-3 py-1 text-[11px] font-black transition-colors ${
                    category === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white/[0.05] text-white/35 hover:bg-white/[0.09] hover:text-white/65"
                  }`}
                >
                  {cat === "all" ? "Todos" : cat}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-600/20" />
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500/50" aria-hidden />
                </div>
                <p className="text-sm text-white/25">Cargando catálogo desde Odoo...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-white/15">
                <PackageSearch className="h-16 w-16" aria-hidden />
                <p className="font-black">Sin resultados</p>
                {productSearch && <button onClick={() => setProductSearch("")} className="text-sm text-blue-400/60 hover:text-blue-400">Limpiar búsqueda</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((product) => {
                  const inCart = cart.find((i) => i.productId === product.id);
                  const flash = lastAdded === product.id;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all duration-150 active:scale-[0.96] ${
                        inCart
                          ? "border-blue-500/45 bg-[#0f1d35] shadow-md shadow-blue-600/10"
                          : "border-white/[0.07] bg-[#111827] hover:border-blue-500/30 hover:bg-[#131e30] hover:shadow-lg hover:shadow-blue-600/5"
                      } ${flash ? "scale-[0.96]" : ""}`}
                    >
                      {/* Image zone */}
                      <div className="relative h-32 overflow-hidden bg-[#0c1520]">
                        {product.image ? (
                          <img
                            src={product.image} alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <PackageSearch className="h-10 w-10 text-white/[0.05]" aria-hidden />
                          </div>
                        )}

                        {/* In-cart overlay */}
                        {inCart && (
                          <div className="absolute inset-0 bg-blue-600/10 ring-2 ring-inset ring-blue-500/40" />
                        )}

                        {/* Qty badge */}
                        {inCart && (
                          <div className={`absolute right-2 top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-black text-white shadow-lg shadow-blue-600/50 transition-transform duration-150 ${bumpId === product.id ? "scale-125" : "scale-100"}`}>
                            {inCart.qty}
                          </div>
                        )}

                        {/* Hover add overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 shadow-xl shadow-blue-600/40 backdrop-blur-sm">
                            <Plus className="h-5 w-5 text-white" aria-hidden />
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-1 flex-col justify-between p-2.5">
                        <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-white/80">{product.name}</p>
                        <div className="mt-2 flex items-end justify-between gap-1">
                          <span className="text-[14px] font-black text-emerald-400">{mxn.format(product.price)}</span>
                          <span className={`text-[10px] font-semibold ${
                            product.stock > 5 ? "text-white/25" : product.stock > 0 ? "text-amber-400/60" : "text-red-400/50"
                          }`}>
                            {product.stock > 0 ? `${product.stock} ud` : "Agotado"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart / Orders panel ─────────────────────────────────── */}
        <aside className="hidden w-[300px] shrink-0 flex-col border-l border-white/[0.06] bg-[#080d14] lg:flex xl:w-[340px]">

          {/* Panel header with tabs */}
          <div className="flex shrink-0 items-center gap-0.5 border-b border-white/[0.06] p-2">
            <button
              onClick={() => setRightPanel("cart")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-black transition-colors ${
                rightPanel === "cart" ? "bg-blue-600 text-white" : "text-white/35 hover:bg-white/5 hover:text-white/65"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
              Carrito
              {cart.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${rightPanel === "cart" ? "bg-white/20 text-white" : "bg-blue-600 text-white"}`}>
                  {totalQty}
                </span>
              )}
            </button>
            <button
              onClick={() => { setRightPanel("orders"); if (quotes.length === 0) loadQuotes(); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-black transition-colors ${
                rightPanel === "orders" ? "bg-blue-600 text-white" : "text-white/35 hover:bg-white/5 hover:text-white/65"
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Órdenes Odoo
              {quotes.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${rightPanel === "orders" ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
                  {quotes.length}
                </span>
              )}
            </button>
          </div>

          {/* ── CART VIEW ── */}
          {rightPanel === "cart" && (
            <>
              {/* Loaded order context */}
              {loadedOrder && (
                <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.05] bg-blue-500/5 px-3 py-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="flex-1 truncate text-[11px] font-black text-blue-300">{loadedOrder.name}</span>
                  {loadedOrder.partnerName && <span className="truncate text-[11px] text-white/35">{loadedOrder.partnerName}</span>}
                </div>
              )}

              {/* Items */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]">
                      <ShoppingCart className="h-8 w-8 text-white/15" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white/30">Carrito vacío</p>
                      <p className="text-xs text-white/15">Toca un producto del catálogo o carga una orden de Odoo</p>
                    </div>
                    <button
                      onClick={() => { setRightPanel("orders"); if (quotes.length === 0) loadQuotes(); }}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-black text-white/40 hover:border-white/15 hover:text-white/70"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      Ver órdenes de Odoo →
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.05] px-2 py-1">
                    {cart.map((item) => (
                      <li key={item.productId} className="group flex items-start gap-2.5 py-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                          {item.image
                            ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                            : <div className="flex h-full items-center justify-center"><PackageSearch className="h-4 w-4 text-white/10" /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold leading-tight text-white/80">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-white/30">{mxn.format(item.price)} c/u</p>
                          <div className="mt-2 flex items-center gap-1">
                            <button
                              onClick={() => setQty(item.productId, item.qty - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-white/45 transition-colors hover:bg-white/12 hover:text-white"
                            >
                              <Minus className="h-2.5 w-2.5" aria-hidden />
                            </button>
                            <span className="w-7 text-center text-[13px] font-black">{item.qty}</span>
                            <button
                              onClick={() => setQty(item.productId, item.qty + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-white/45 transition-colors hover:bg-white/12 hover:text-white"
                            >
                              <Plus className="h-2.5 w-2.5" aria-hidden />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 pt-0.5">
                          <span className="text-[13px] font-black text-emerald-400">{mxn.format(item.price * item.qty)}</span>
                          <button
                            onClick={() => setQty(item.productId, 0)}
                            className="text-white/[0.12] transition-colors hover:text-red-400/80"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Totals + Pay */}
              <div className="shrink-0 space-y-3 border-t border-white/[0.06] p-3">
                <div className="rounded-xl bg-white/[0.03] p-3 space-y-1.5">
                  <div className="flex justify-between text-[12px] text-white/40">
                    <span>Subtotal</span><span>{mxn.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] text-white/40">
                    <span>IVA 16%</span><span>{mxn.format(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/[0.06] pt-2">
                    <span className="font-black text-white/80">Total</span>
                    <span className="text-[18px] font-black text-emerald-400">{mxn.format(total)}</span>
                  </div>
                </div>

                <button
                  disabled={cart.length === 0}
                  onClick={() => setPaymentOpen(true)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e5533d] text-[13px] font-black uppercase tracking-wide text-white transition-all hover:bg-[#d44530] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-20"
                >
                  <Banknote className="h-4 w-4" aria-hidden />
                  {cart.length > 0 ? `Cobrar ${mxn.format(total)}` : "Cobrar"}
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="w-full rounded-xl border border-white/[0.07] py-2 text-[11px] font-black text-white/25 transition-colors hover:border-white/12 hover:text-white/50"
                  >
                    Cancelar orden
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── ORDERS VIEW ── */}
          {rightPanel === "orders" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.05] px-3 py-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-white/30">Órdenes confirmadas</span>
                <button
                  onClick={loadQuotes}
                  className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-[11px] font-black text-white/35 hover:bg-white/8 hover:text-white/65"
                >
                  <Search className="h-3 w-3" aria-hidden />
                  Actualizar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingQuotes ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-500/40" aria-hidden />
                  </div>
                ) : quotes.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-white/15">
                    <FileText className="h-12 w-12" aria-hidden />
                    <p className="text-sm font-black">Sin órdenes pendientes</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.04] px-2 py-1">
                    {quotes.map((order) => (
                      <li key={order.id} className="group py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[13px] font-black text-blue-300">{order.name}</span>
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                order.invoice_status === "to invoice" ? "bg-amber-400/10 text-amber-400" : "bg-white/[0.06] text-white/35"
                              }`}>
                                {order.invoice_status === "to invoice" ? "Por cobrar" : order.invoice_status}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-white/40">
                              {Array.isArray(order.partner_id) ? order.partner_id[1] : "Sin cliente"}
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {order.lines.slice(0, 2).map((l) => (
                                <li key={l.id} className="flex items-center justify-between text-[10px] text-white/30">
                                  <span className="truncate mr-2">{l.product_uom_qty}× {Array.isArray(l.product_id) ? l.product_id[1] : l.name}</span>
                                  <span className="shrink-0">{mxn.format(l.price_subtotal)}</span>
                                </li>
                              ))}
                              {order.lines.length > 2 && (
                                <li className="text-[10px] text-white/20">+{order.lines.length - 2} más</li>
                              )}
                            </ul>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[14px] font-black text-emerald-400">{mxn.format(order.amount_total)}</p>
                            <button
                              onClick={() => addFromQuote(order)}
                              className="mt-2 flex items-center gap-1 rounded-lg bg-[#e5533d] px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-[#d44530]"
                            >
                              <ShoppingCart className="h-3 w-3" aria-hidden />
                              Cargar
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ══ MOBILE FLOATING CART ════════════════════════════════════════════ */}
      {cart.length > 0 && !mobileCartOpen && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-2xl bg-[#e5533d] px-4 py-3 font-black shadow-2xl shadow-[#e5533d]/30 lg:hidden"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden />
          <span>{totalQty} artículo{totalQty !== 1 ? "s" : ""}</span>
          <span className="opacity-50">·</span>
          <span>{mxn.format(total)}</span>
        </button>
      )}

      {/* ══ MOBILE CART SHEET ═══════════════════════════════════════════════ */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#080d14] lg:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-400" aria-hidden />
              <span className="font-black">Carrito ({totalQty})</span>
            </div>
            <button onClick={() => setMobileCartOpen(false)} className="text-white/35 hover:text-white">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-white/[0.05] px-3 py-2">
              {cart.map((item) => (
                <li key={item.productId} className="flex items-start gap-3 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                    {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><PackageSearch className="h-4 w-4 text-white/10" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-white/35">{mxn.format(item.price)} c/u</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => setQty(item.productId, item.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07]"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center font-black">{item.qty}</span>
                      <button onClick={() => setQty(item.productId, item.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07]"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-black text-emerald-400">{mxn.format(item.price * item.qty)}</span>
                    <button onClick={() => setQty(item.productId, 0)} className="text-white/15 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 space-y-3 border-t border-white/[0.07] p-4">
            <div className="flex justify-between text-sm text-white/40"><span>Subtotal</span><span>{mxn.format(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-white/40"><span>IVA 16%</span><span>{mxn.format(tax)}</span></div>
            <div className="flex justify-between border-t border-white/[0.07] pt-2 text-lg font-black"><span>Total</span><span className="text-emerald-400">{mxn.format(total)}</span></div>
            <button
              onClick={() => { setMobileCartOpen(false); setPaymentOpen(true); }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#e5533d] text-lg font-black uppercase text-white hover:bg-[#d44530]"
            >
              <Banknote className="h-5 w-5" aria-hidden />
              Cobrar {mxn.format(total)}
            </button>
          </div>
        </div>
      )}

      {/* ══ PAYMENT MODAL ═══════════════════════════════════════════════════ */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d1420] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
              <div>
                <h2 className="text-xl font-black">Cobrar {mxn.format(total)}</h2>
                {loadedOrder && (
                  <p className="mt-0.5 text-sm text-white/40">
                    <span className="font-black text-blue-300">{loadedOrder.name}</span>
                    {loadedOrder.partnerName && <span> · {loadedOrder.partnerName}</span>}
                  </p>
                )}
              </div>
              <button onClick={() => setPaymentOpen(false)} className="text-white/30 hover:text-white">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="max-h-[80vh] space-y-4 overflow-y-auto p-6">

              {/* Customer selector for quick sales */}
              {!loadedOrder && (
                <section className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide text-white/35">Cliente y lista de precios</p>
                    {(loadingCustomers || loadingPrices) && <Loader2 className="h-4 w-4 animate-spin text-blue-400/60" aria-hidden />}
                  </div>
                  <div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-[#080d14] focus-within:border-blue-500/40">
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadCustomers(customerSearch)}
                      placeholder="Buscar cliente por nombre, correo o teléfono"
                      className="h-11 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-white/20"
                    />
                    <button onClick={() => loadCustomers(customerSearch)} className="flex h-11 w-11 items-center justify-center bg-blue-600 hover:opacity-90">
                      <Search className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => { setSelectedCustomerId(e.target.value); setActivePricelistName(""); }}
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#080d14] px-3 text-sm text-white outline-none focus:border-blue-500/40"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>
                    ))}
                  </select>
                  <div className="rounded-xl border border-blue-400/10 bg-blue-400/[0.04] px-3 py-2">
                    <p className="text-[10px] font-black uppercase text-white/25">Lista de precios aplicada</p>
                    <p className="mt-0.5 text-sm font-black text-blue-200/70">
                      {activePricelistName || selectedCustomer?.pricelistName || "Precio público (sin pricelist específica)"}
                    </p>
                    {loadingPrices && <p className="mt-1 text-xs text-blue-200/40">Actualizando precios del carrito...</p>}
                  </div>
                </section>
              )}

              {/* Payment method */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wide text-white/35">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "cash" as const, icon: Banknote, label: "Efectivo" },
                    { id: "card" as const, icon: CreditCard, label: "Tarjeta" },
                    { id: "account" as const, icon: ReceiptText, label: "Cta. Cliente" },
                  ]).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-4 text-sm font-black transition-colors ${
                        paymentMethod === id
                          ? "border-blue-500/50 bg-blue-600/15 text-white"
                          : "border-white/[0.07] bg-white/[0.03] text-white/40 hover:border-white/12 hover:text-white/65"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash received */}
              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wide text-white/35">Efectivo recibido</p>
                  <div className="flex overflow-hidden rounded-xl border border-white/[0.1] focus-within:border-blue-500/40">
                    <span className="flex items-center border-r border-white/[0.07] px-4 text-xl font-black text-white/25">$</span>
                    <input
                      type="number" min={0}
                      placeholder={String(Math.ceil(total))}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="h-14 flex-1 bg-transparent px-4 text-2xl font-black outline-none"
                    />
                  </div>
                  {parseFloat(cashReceived) >= total && (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3">
                      <span className="font-black text-emerald-400">Cambio</span>
                      <span className="text-2xl font-black text-emerald-400">{mxn.format(parseFloat(cashReceived) - total)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from(new Set([Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, 500, 1000]))
                      .filter((a) => a > 0)
                      .map((a) => (
                        <button
                          key={a}
                          onClick={() => setCashReceived(String(a))}
                          className="rounded-lg border border-white/[0.07] bg-white/[0.03] py-2 text-xs font-black text-white/40 hover:bg-white/8 hover:text-white/70"
                        >
                          ${a}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {odooError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-red-400">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                  <p className="text-sm font-semibold">{odooError}</p>
                </div>
              )}

              {/* Confirm */}
              <button
                onClick={confirmPayment}
                disabled={
                  processingOdoo || loadingPrices ||
                  (!loadedOrder && !selectedCustomerId) ||
                  (paymentMethod === "cash" && (parseFloat(cashReceived) || 0) < total)
                }
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#e5533d] text-lg font-black uppercase tracking-wide text-white transition-all hover:bg-[#d44530] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-20"
              >
                {(processingOdoo || loadingPrices) ? (
                  <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />{loadingPrices ? "Actualizando precios..." : "Registrando en Odoo..."}</>
                ) : (
                  <><Banknote className="h-5 w-5" aria-hidden />Confirmar pago</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RECEIPT MODAL ═══════════════════════════════════════════════════ */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm print:relative print:inset-auto print:bg-white">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl print:shadow-none">
            <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">WORLDCAM DE MEXICO</p>
              <p className="mt-1 text-sm text-gray-400">{new Date().toLocaleString("es-MX")}</p>
              {receiptData.partnerName && <p className="mt-1.5 font-semibold text-gray-700">{receiptData.partnerName}</p>}
              {receiptData.orderName && <p className="mt-0.5 text-xs font-black text-blue-600">{receiptData.orderName}</p>}
            </div>

            <div className="p-5">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {receiptData.cart.map((item) => (
                    <tr key={item.productId}>
                      <td className="py-2">
                        <p className="font-semibold leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.qty} × {mxn.format(item.price)}</p>
                      </td>
                      <td className="py-2 text-right font-black">{mxn.format(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{mxn.format(receiptData.subtotal)}</span></div>
                <div className="flex justify-between text-gray-400"><span>IVA 16%</span><span>{mxn.format(receiptData.tax)}</span></div>
                <div className="flex justify-between pt-1 text-xl font-black"><span>Total</span><span>{mxn.format(receiptData.total)}</span></div>
                <div className="flex justify-between text-gray-400"><span>{receiptData.method}</span></div>
                {receiptData.change > 0 && (
                  <div className="flex justify-between font-black text-emerald-600"><span>Cambio</span><span>{mxn.format(receiptData.change)}</span></div>
                )}
              </div>

              {receiptData.odooSynced && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Pago registrado en Odoo
                </div>
              )}

              <p className="mt-4 text-center text-xs text-gray-300">¡Gracias por su compra!</p>
            </div>

            <div className="flex gap-3 border-t border-gray-100 p-4">
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-black text-gray-600 hover:bg-gray-50 print:hidden"
              >
                <Printer className="h-4 w-4" aria-hidden />
                Imprimir
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="flex flex-1 items-center justify-center rounded-xl bg-blue-700 py-3 text-sm font-black text-white hover:bg-blue-600 print:hidden"
              >
                Nueva orden
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
