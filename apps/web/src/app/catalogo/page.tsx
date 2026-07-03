"use client";

import {
  Box,
  Camera,
  ChevronDown,
  Copy,
  FileText,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { addCartItem } from "../../lib/cart";
import { SALES_DRAFT_UPDATED_EVENT, addProductToSalesDraft, readSalesDraftItems, updateSalesDraftItemQty } from "../../lib/salesDraft";


type CatalogProduct = {
  id?: number;
  variantId?: number;
  sku: string;
  clave: string;
  brand: string;
  category: string;
  name: string;
  stock: number;
  price: number;
  oldPrice?: number;
  discount?: string;
  image?: string;
  description?: string;
};

type AuthState = { email: string; role: string } | null;

type SortMode = "price-asc" | "price-desc" | "name-asc" | "stock-desc";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const categoryIcons: Record<string, typeof Camera> = {
  videovigilancia: Camera,
  camara: Camera,
  cctv: Camera,
};

function productKey(product: CatalogProduct) {
  return String(product.variantId ?? product.id ?? product.sku);
}

function compactName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function searchTokens(value: string) {
  return normalizeSearch(value)
    .split(" ")
    .map(normalizeSearchToken)
    .filter((token) => token.length > 1);
}

function normalizeSearchToken(token: string) {
  const aliases: Record<string, string> = {
    cam: "camara",
    cams: "camara",
    camera: "camara",
    cameras: "camara",
    camar: "camara",
    camaras: "camara",
    hik: "hikvision",
    hikvison: "hikvision",
    hikvision: "hikvision",
    hicvision: "hikvision",
    hickvision: "hikvision",
    hkv: "hikvision",
    hilook: "hilook",
    dahu: "dahua",
    dehua: "dahua",
  };
  return aliases[token] ?? token;
}

function expandSearchToken(token: string) {
  const synonyms: Record<string, string[]> = {
    camara: ["camara", "camera", "camaras", "ipc", "ptz", "bullet", "domo", "dome", "turret", "cctv", "videovigilancia"],
    fuente: ["fuente", "power", "adaptador", "cargador"],
    hikvision: ["hikvision", "hik", "hik connect", "hikconnect", "hilook"],
    nvr: ["nvr", "grabador", "recorder"],
    dvr: ["dvr", "grabador", "recorder"],
  };
  return synonyms[token] ?? [token];
}

function hasSearchWord(text: string, word: string) {
  return new RegExp(`\\b${word}\\b`).test(text);
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const replaceCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + replaceCost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function fuzzyIncludes(text: string, token: string) {
  if (text.includes(token)) return true;
  if (token.length < 4) return false;

  const words = text.split(" ").filter(Boolean);
  const maxDistance = token.length <= 6 ? 1 : 2;
  return words.some((word) => {
    if (Math.abs(word.length - token.length) > maxDistance) return false;
    return levenshteinDistance(word, token) <= maxDistance;
  });
}

function matchesCandidate(text: string, candidate: string) {
  return candidate.includes(" ")
    ? text.includes(candidate)
    : hasSearchWord(text, candidate) || fuzzyIncludes(text, candidate);
}

function productSearchScore(product: CatalogProduct, query: string) {
  const tokens = searchTokens(query);
  if (!tokens.length) return 1;

  const name = normalizeSearch(product.name);
  const category = normalizeSearch(product.category);
  const brand = normalizeSearch(product.brand);
  const sku = normalizeSearch(product.sku);
  const clave = normalizeSearch(product.clave);
  const fullText = `${name} ${category} ${brand} ${sku} ${clave}`;
  const wantsCamera = tokens.some((token) => token === "camara");
  const accessoryProduct = /\b(fuente|power|adaptador|cargador|cable|conector|divisor|switch|bracket|soporte)\b/.test(name);
  const cameraName = /^(camara|camera|camaras)\b/.test(name);
  const cameraFormFactor = /\b(ipc|ptz|bullet|domo|dome|turret|cctv)\b/.test(name);
  const cameraCategory = /\b(videovigilancia|cctv|camara|camaras)\b/.test(category);
  const cameraDevice = cameraName || cameraFormFactor || (cameraCategory && !accessoryProduct);
  let score = 0;
  let matchedTokens = 0;
  let missedTokens = 0;

  if (wantsCamera && !cameraDevice) {
    return -1;
  }

  for (const token of tokens) {
    const candidates = expandSearchToken(token);
    const isCameraIntent = wantsCamera && token === "camara";
    const matched = isCameraIntent
      ? cameraDevice
      : candidates.some((candidate) => matchesCandidate(fullText, candidate));
    if (!matched) {
      if (isCameraIntent || tokens.length <= 2) return -1;
      missedTokens += 1;
      continue;
    }
    matchedTokens += 1;

    for (const candidate of candidates) {
      if (sku === candidate || clave === candidate) score += 120;
      else if (sku.includes(candidate) || clave.includes(candidate)) score += 80;
      if (name.startsWith(candidate)) score += 70;
      else if (matchesCandidate(name, candidate)) score += 45;
      if (matchesCandidate(category, candidate)) score += 28;
      if (matchesCandidate(brand, candidate)) score += 24;
    }
  }

  if (tokens.length > 1 && matchedTokens < 2) return -1;
  score -= missedTokens * 35;

  if (wantsCamera) {
    if (cameraName) score += 180;
    else if (cameraFormFactor) score += 140;
    else if (cameraCategory) score += 80;
  }

  if (product.stock > 0) score += 4;
  return score;
}

function getIconForCategory(category: string) {
  const normalized = normalizeSearch(category);
  const match = Object.keys(categoryIcons).find((key) => normalized.includes(key));
  return match ? categoryIcons[match] : Box;
}

export default function CatalogoPage() {
  const [query, setQuery] = useState("camara");
  const [brand, setBrand] = useState("Todas");
  const [category, setCategory] = useState("Todas");
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [onlyStock, setOnlyStock] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [source, setSource] = useState<"loading" | "odoo" | "odoo-error" | "error">("loading");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>(null);
  const [salesDraftQtyByVariant, setSalesDraftQtyByVariant] = useState<Record<number, number>>({});
  const isStaff = auth?.role === "employee" || auth?.role === "admin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("buscar");
    if (search) {
      setQuery(search);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

    async function loadProducts() {
      setSource("loading");

      try {
        const response = await fetch(`${apiBaseUrl}/api/catalog/products`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Catalog request failed: ${response.status}`);
        }

        const odooProducts = (await response.json()) as CatalogProduct[];
        setProducts(Array.isArray(odooProducts) ? odooProducts : []);
        setSource(response.headers.get("X-Catalog-Status") === "unavailable" ? "odoo-error" : "odoo");
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
          setSource("error");
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("wc_access_token");
    if (!token) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    fetch(`${apiBaseUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((user: AuthState) => setAuth(user?.email ? user : null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isStaff) return;

    const syncDraft = () => {
      const qtyByVariant: Record<number, number> = {};
      for (const item of readSalesDraftItems()) {
        qtyByVariant[item.variantId] = (qtyByVariant[item.variantId] ?? 0) + item.qty;
      }
      setSalesDraftQtyByVariant(qtyByVariant);
    };

    syncDraft();
    window.addEventListener(SALES_DRAFT_UPDATED_EVENT, syncDraft);
    window.addEventListener("storage", syncDraft);
    return () => {
      window.removeEventListener(SALES_DRAFT_UPDATED_EVENT, syncDraft);
      window.removeEventListener("storage", syncDraft);
    };
  }, [isStaff]);

  const brands = useMemo(() => {
    return ["Todas", ...Array.from(new Set(products.map((product) => product.brand || "Worldcam"))).sort()];
  }, [products]);

  const categories = useMemo(() => {
    return ["Todas", ...Array.from(new Set(products.map((product) => product.category || "Sin categoria"))).sort()];
  }, [products]);

  const activeFilterCount = [
    brand !== "Todas",
    category !== "Todas",
    onlyStock,
  ].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const hasQuery = searchTokens(query).length > 0;

    const result = products.flatMap((product) => {
      const matchesBrand = brand === "Todas" || product.brand === brand;
      const matchesCategory = category === "Todas" || product.category === category;
      const matchesStock = !onlyStock || product.stock > 0;
      if (!matchesBrand || !matchesCategory || !matchesStock) return [];

      const searchScore = productSearchScore(product, query);
      return !hasQuery || searchScore > 0 ? [{ product, searchScore }] : [];
    });

    return [...result]
      .sort((a, b) => {
        if (hasQuery && b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
        if (sortMode === "price-desc") return b.product.price - a.product.price;
        if (sortMode === "name-asc") return a.product.name.localeCompare(b.product.name);
        if (sortMode === "stock-desc") return b.product.stock - a.product.stock;
        return a.product.price - b.product.price;
      })
      .map((item) => item.product);
  }, [brand, category, onlyStock, products, query, sortMode]);

  function clearFilters() {
    setBrand("Todas");
    setCategory("Todas");
    setOnlyStock(false);
  }

  function handleAddToCart(product: CatalogProduct) {
    const id = productKey(product);
    const variantId = Number(product.variantId ?? product.id);

    if ((auth?.role === "employee" || auth?.role === "admin") && Number.isFinite(variantId)) {
      addProductToSalesDraft({
        id: Number(product.id ?? variantId),
        variantId,
        sku: product.sku || product.clave || String(variantId),
        clave: product.clave || product.sku || String(variantId),
        brand: product.brand || "Worldcam",
        category: product.category || "Sin categoria",
        name: product.name,
        price: product.price,
        stock: product.stock,
        image: product.image,
      });
      setLastAddedId(id);
      window.setTimeout(() => setLastAddedId((current) => (current === id ? null : current)), 1300);
      return;
    }

    addCartItem({
      id,
      productId: product.id,
      variantId: product.variantId,
      sku: product.sku,
      clave: product.clave,
      brand: product.brand || "Worldcam",
      category: product.category || "Sin categoria",
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setLastAddedId(id);
    window.setTimeout(() => setLastAddedId((current) => (current === id ? null : current)), 1300);
  }

  function updateOrderQty(product: CatalogProduct, qty: number) {
    const variantId = Number(product.variantId ?? product.id);
    if (!Number.isFinite(variantId)) return;

    updateSalesDraftItemQty(variantId, qty);
    setSalesDraftQtyByVariant((current) => {
      const next = { ...current };
      if (qty > 0) {
        next[variantId] = qty;
      } else {
        delete next[variantId];
      }
      return next;
    });
  }

  const salesDraftTotalQty = Object.values(salesDraftQtyByVariant).reduce((sum, qty) => sum + qty, 0);

  return (
    <>
      <SiteHeader active="catalogo" />
      <main className="min-h-screen bg-[#080d19] text-white">

      <section className="border-b border-white/10 bg-[#0b1020]">
        <div className="mx-auto max-w-[1800px] px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam / Productos</p>
              <h1 className="mt-1 text-2xl font-black leading-tight md:text-4xl">Catalogo conectado a Odoo</h1>
              <p className="mt-1 max-w-3xl text-sm text-blue-100/65 md:text-base">
                Lista de productos real para venta, cotizacion y consulta rapida por clave, existencia o categoria.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-2xl font-black">{filteredProducts.length}</p>
                <p className="text-xs font-black uppercase text-white/55">Resultados</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-2xl font-black">{activeFilterCount}</p>
                <p className="text-xs font-black uppercase text-white/55">Filtros</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                <PackageSearch className="h-5 w-5 text-mint" aria-hidden />
                <p className="mt-1 text-xs font-black uppercase text-white/55">
                  {source === "loading" ? "Conectando" : source === "error" ? "Sin API" : source === "odoo-error" ? "Odoo sin conexion" : "Odoo activo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`mx-auto grid max-w-[1800px] gap-4 px-4 py-4 lg:px-6 ${filtersOpen ? "lg:grid-cols-[300px_1fr]" : "lg:grid-cols-1"}`}>
        {filtersOpen ? (
        <aside className="space-y-5 rounded-lg border border-white/10 bg-[#0d1324] p-5 lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-3 text-blue-100">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-300" aria-hidden />
                <h2 className="text-lg font-black uppercase">Filtros</h2>
              </span>
              <div className="flex gap-2">
                <button
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-black text-blue-100/70 transition hover:bg-white/[0.06] hover:text-white"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Limpiar
                </button>
                <button
                  className="flex h-9 items-center rounded-lg border border-blue-400/30 px-2.5 text-xs font-black text-blue-100 transition hover:bg-blue-500/15"
                  onClick={() => setFiltersOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="relative mt-4">
              <select
                className="h-12 w-full appearance-none rounded-lg border border-blue-400/25 bg-[#090f1f] px-4 pr-10 font-semibold text-white outline-none focus:border-blue-400"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
                <option value="stock-desc">Mayor existencia</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/60" aria-hidden />
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <h3 className="text-sm font-black uppercase text-blue-100">Promociones</h3>
            <label className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-blue-100/80">
              <span className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-mint" aria-hidden />
                En existencia
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-white/20 bg-white/10 accent-blue-600"
                checked={onlyStock}
                onChange={(event) => setOnlyStock(event.target.checked)}
              />
            </label>
          </div>

          <div className="border-t border-white/10 pt-5">
            <h3 className="text-sm font-black uppercase text-blue-100">Categorias</h3>
            <div className="mt-4 space-y-2">
              {categories.slice(0, 14).map((item) => {
                const Icon = getIconForCategory(item);

                return (
                  <button
                    key={item}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      category === item
                        ? "border border-blue-400/50 bg-blue-700/25 text-blue-100"
                        : "text-blue-100/70 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    onClick={() => setCategory(item)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="line-clamp-2">{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 pt-5">
            <h3 className="text-sm font-black uppercase text-blue-100">Marcas</h3>
            <div className="mt-4 space-y-2">
              {brands.slice(0, 16).map((item) => (
                <button
                  key={item}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    brand === item ? "bg-blue-700 text-white" : "text-blue-100/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                  onClick={() => setBrand(item)}
                >
                  <span className={`h-4 w-4 rounded border ${brand === item ? "border-blue-300 bg-blue-500" : "border-blue-100/40"}`} />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
        ) : null}

        <div>
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-blue-300/15 bg-[#0d1324] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-mint">{filteredProducts.length} productos</p>
              <p className="truncate text-sm font-semibold text-blue-100/65">
                {query.trim() ? `Busqueda: ${query.trim()}` : "Catalogo disponible"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isStaff ? (
                <a
                  href="/ventas"
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-coral px-3 text-sm font-black text-white transition hover:bg-coral/90"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Ventas
                  {salesDraftTotalQty > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-coral">
                      {salesDraftTotalQty}
                    </span>
                  ) : null}
                </a>
              ) : null}
              <button
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-blue-400/35 bg-blue-700/20 px-3 text-sm font-black text-blue-100 transition hover:bg-blue-700/35"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {filtersOpen ? "Ocultar" : "Filtros"}
                {activeFilterCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-mint px-1 text-[11px] text-ink">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {source === "loading" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-[360px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-10 text-center">
              <PackageSearch className="mx-auto h-10 w-10 text-blue-100/45" aria-hidden />
              <h2 className="mt-4 text-2xl font-black">No hay productos para mostrar</h2>
              <p className="mt-2 text-blue-100/60">
                {source === "error"
                  ? "La API no respondio. Revisa que el backend este encendido."
                  : source === "odoo-error"
                    ? "Odoo rechazo la autenticacion. Revisa las credenciales del backend."
                  : "Prueba con otra busqueda o limpia los filtros."}
              </p>
            </div>
          ) : (
            <div className={`grid gap-3 sm:grid-cols-2 ${filtersOpen ? "xl:grid-cols-3 2xl:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}`}>
              {filteredProducts.map((product) => (
                (() => {
                  const variantId = Number(product.variantId ?? product.id);
                  const draftQty = Number.isFinite(variantId) ? salesDraftQtyByVariant[variantId] ?? 0 : 0;

                  return (
                <article
                  key={productKey(product)}
                  className="group flex overflow-hidden rounded-lg border border-blue-300/20 bg-[#151b2a] shadow-soft transition hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-[#1a2233] focus-within:border-blue-300/70 max-sm:min-h-[240px] max-sm:flex-row sm:min-h-[520px] sm:flex-col"
                >
                  <a
                    href={`/catalogo/${encodeURIComponent(productKey(product))}`}
                    className="relative flex shrink-0 items-center justify-center bg-white p-2 outline-none transition max-sm:w-[38%] sm:aspect-square sm:w-full sm:p-3"
                    aria-label={`Ver detalle de ${product.name}`}
                  >
                    {product.image ? (
                      <img className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.02]" src={product.image} alt={product.name} />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center rounded bg-white/[0.03] text-blue-100/30">
                        <PackageSearch className="h-14 w-14" aria-hidden />
                        <span className="mt-3 text-xs font-black uppercase tracking-widest">Sin imagen</span>
                      </div>
                    )}
                    {product.stock > 0 ? (
                      <span className="absolute right-2 top-2 rounded-md bg-mint px-1.5 py-1 text-[10px] font-black text-ink sm:right-3 sm:top-3 sm:px-2 sm:text-xs">
                        Disponible
                      </span>
                    ) : null}
                    {isStaff && draftQty > 0 ? (
                      <span className="absolute left-2 top-2 rounded-md bg-coral px-1.5 py-1 text-[10px] font-black text-white shadow-lg shadow-coral/20 sm:left-3 sm:top-3 sm:px-2 sm:text-xs">
                        En orden: {draftQty} pza.
                      </span>
                    ) : null}
                  </a>

                  <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black uppercase text-mint">{product.brand || "Worldcam"}</p>
                      {product.discount ? (
                        <span className="rounded bg-coral px-2 py-1 text-[11px] font-black uppercase text-white">{product.discount}</span>
                      ) : null}
                    </div>

                    <a
                      href={`/catalogo/${encodeURIComponent(productKey(product))}`}
                      className="mt-2 line-clamp-3 min-h-0 text-sm font-bold leading-5 text-blue-100 outline-none transition hover:text-white focus:text-white sm:mt-3 sm:line-clamp-4 sm:min-h-[96px] sm:text-base sm:leading-snug"
                    >
                      {compactName(product.name)}
                    </a>

                    {product.description ? (
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-blue-100/55 sm:text-sm">
                        {compactName(product.description)}
                      </p>
                    ) : (
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-blue-100/45 sm:text-sm">
                        Ficha de Odoo con precio, clave y existencia disponible.
                      </p>
                    )}

                    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.025] px-2 py-1.5 text-xs sm:mt-3 sm:p-3 sm:text-sm">
                      <p className="flex items-center justify-between gap-2 text-blue-100/55">
                        <span className="shrink-0">Clave</span>
                        <span className="flex min-w-0 items-center gap-1 font-black text-white">
                          <span className="truncate">{product.clave || product.sku}</span>
                          <Copy className="h-3.5 w-3.5 text-blue-100/45" aria-hidden />
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-2 text-blue-100/55">
                        <span>Existencia</span>
                        <span className={product.stock > 0 ? "font-black text-mint" : "font-black text-coral"}>{product.stock}</span>
                      </p>
                    </div>

                    <div className="mt-auto pt-2 sm:pt-4">
                      <p className="text-xl font-black text-white sm:text-2xl">{currency.format(product.price)}</p>
                      <p className="mt-1 inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-1 text-[10px] font-black uppercase text-blue-200 sm:text-xs">
                        <Tag className="h-3 w-3" aria-hidden />
                        Precio Odoo
                      </p>
                    </div>

                    <div className="-mx-3 mt-3 grid grid-cols-2 border-t border-white/10 sm:-mx-4 sm:mt-4">
                      {isStaff && draftQty > 0 ? (
                        <div className="grid h-10 grid-cols-[40px_1fr_40px] bg-blue-700 text-sm font-black text-white sm:h-12">
                          <button
                            className="flex items-center justify-center bg-blue-900/35 transition hover:bg-blue-900/55"
                            onClick={() => updateOrderQty(product, draftQty - 1)}
                            aria-label="Restar de la orden"
                          >
                            <Minus className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            className="flex items-center justify-center transition hover:bg-blue-600"
                            onClick={() => handleAddToCart(product)}
                          >
                            {draftQty} en orden
                          </button>
                          <button
                            className="flex items-center justify-center bg-blue-900/35 transition hover:bg-blue-900/55"
                            onClick={() => handleAddToCart(product)}
                            aria-label="Sumar a la orden"
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="flex h-10 items-center justify-center bg-blue-700 text-sm font-black text-white transition hover:bg-blue-600 active:bg-blue-800 sm:h-12"
                          onClick={() => handleAddToCart(product)}
                        >
                          {lastAddedId === productKey(product)
                            ? isStaff
                              ? "En orden"
                              : "Agregado"
                            : isStaff
                              ? "A orden"
                              : "Agregar"}
                        </button>
                      )}
                      <a
                        className="flex h-10 items-center justify-center bg-slate-600/70 text-sm font-black text-white transition hover:bg-slate-500 sm:h-12"
                        href={`/catalogo/${encodeURIComponent(productKey(product))}`}
                      >
                        Detalle
                      </a>
                    </div>
                  </div>
                </article>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </section>

      {isStaff ? (
        <a
          href="/ventas"
          className="fixed bottom-4 right-4 z-50 flex h-12 items-center gap-2 rounded-full bg-coral px-4 text-sm font-black text-white shadow-2xl shadow-coral/25 transition hover:bg-coral/90 sm:hidden"
          aria-label="Ir a ventas"
        >
          <FileText className="h-5 w-5" aria-hidden />
          Ventas
          {salesDraftTotalQty > 0 ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs text-coral">
              {salesDraftTotalQty}
            </span>
          ) : null}
        </a>
      ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
