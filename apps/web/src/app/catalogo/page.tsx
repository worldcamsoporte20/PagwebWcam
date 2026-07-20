"use client";

import {
  ArrowRight,
  Box,
  Camera,
  ChevronDown,
  Copy,
  FileText,
  Heart,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { addCartItem } from "../../lib/cart";
import { readFavoriteIds, syncFavoriteProducts, toggleFavoriteProduct } from "../../lib/favorites";
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
  source?: "odoo" | "syscom" | "merged";
  syscomStock?: number;
  wcamStock?: number;
};

type AuthState = { email: string; role: string } | null;

type SortMode = "price-asc" | "price-desc" | "name-asc" | "stock-desc";

type CatalogPageResponse = {
  products: CatalogProduct[];
  total: number;
  brands: string[];
  categories: string[];
  status: "odoo" | "unavailable";
  message?: string;
};

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

const DISPLAY_STEP = 60;
const cameraResolutions = ["Todas", "2", "4", "6", "8"] as const;
const cameraTypes = [
  { value: "Todos", label: "Todos" },
  { value: "domo", label: "Domo" },
  { value: "bala", label: "Bala" },
  { value: "ptz", label: "PTZ" },
  { value: "fullcolor", label: "Full Color" },
] as const;
const preferredCameraBrands = ["Dahua", "Tiandy", "IMOU", "Hikvision", "HiLook", "Epcom"];

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

function cameraPriority(product: CatalogProduct) {
  const name = normalizeSearch(product.name);
  const category = normalizeSearch(product.category);
  const nonCameraProduct =
    /\b(gps|localizador|rastreador|dvr|nvr|xvr|servidor|server|switch|fuente|power|adaptador|cargador|cable|conector|conectores|conexion|conexiones|jack|divisor|bracket|soporte|montaje|base|brazo|caja|cajas|compatible|disco|hdd|ssd|monitor|teclado|mouse|microfono|sirena|sensor|control|ups|gabinete|rack)\b/.test(name);
  if (nonCameraProduct) return 0;

  const cameraName = /^(camara|camera|camaras)\b/.test(name);
  const cameraModel = /\b(dh[- ]?ipc|ipc|ez[- ]?ipc|ds[- ]?2c|ds[- ]?2d|ptz|bullet|domo|dome|turret|eyeball)\b/.test(name);
  const cameraFormFactor = /\b(lente|mp|megapixel|wizcolor|colorvu|acuface|acusense|ir)\b/.test(name);
  const cameraCategory = /\b(videovigilancia|cctv|camara|camaras)\b/.test(category);

  if (cameraName && cameraModel) return 5;
  if (cameraName) return 4;
  if (cameraModel) return 3;
  if (cameraCategory && cameraFormFactor) return 2;
  return 0;
}

function ProductImage({ product }: { product: CatalogProduct }) {
  const [failed, setFailed] = useState(false);

  if (!product.image || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded bg-slate-50 text-slate-300 dark:bg-white/[0.03] dark:text-blue-100/30">
        <PackageSearch className="h-14 w-14" aria-hidden />
        <span className="mt-3 text-xs font-black uppercase tracking-widest">Sin imagen</span>
      </div>
    );
  }

  return (
    <img
      className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.02]"
      src={product.image}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function CatalogoPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [brand, setBrand] = useState("Todas");
  const [category, setCategory] = useState("Todas");
  const [cameraResolution, setCameraResolution] = useState("Todas");
  const [cameraType, setCameraType] = useState("Todos");
  const [sortMode, setSortMode] = useState<SortMode>("price-asc");
  const [onlyStock, setOnlyStock] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [brands, setBrands] = useState(["Todas"]);
  const [categories, setCategories] = useState(["Todas"]);
  const [source, setSource] = useState<"loading" | "odoo" | "odoo-error" | "error">("loading");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [auth, setAuth] = useState<AuthState>(null);
  const [salesDraftQtyByVariant, setSalesDraftQtyByVariant] = useState<Record<number, number>>({});
  const isStaff = auth?.role === "employee" || auth?.role === "admin";
  const isCameraSearch = searchTokens(query).includes("camara");
  const displayedBrands = useMemo(() => {
    const available = isCameraSearch
      ? Array.from(new Set(["Todas", ...preferredCameraBrands, ...brands]))
      : brands;
    return available.sort((left, right) => {
      if (left === "Todas") return -1;
      if (right === "Todas") return 1;
      const leftPriority = preferredCameraBrands.indexOf(left);
      const rightPriority = preferredCameraBrands.indexOf(right);
      if (leftPriority >= 0 || rightPriority >= 0) {
        if (leftPriority < 0) return 1;
        if (rightPriority < 0) return -1;
        return leftPriority - rightPriority;
      }
      return left.localeCompare(right);
    });
  }, [brands, isCameraSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("buscar");
    if (search) {
      setQuery(search);
      setDebouncedQuery(search);
      if (searchTokens(search).includes("camara")) setFiltersOpen(true);
    }
  }, []);

  useEffect(() => {
    setFavoriteIds(new Set(readFavoriteIds()));
  }, []);

  useEffect(() => {
    syncFavoriteProducts(products);
  }, [products]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

    async function loadProducts() {
      setSource("loading");

      try {
        const params = new URLSearchParams({
          search: debouncedQuery.trim(),
          brand,
          category,
          cameraResolution,
          cameraType,
          onlyStock: String(onlyStock),
          sort: sortMode,
          limit: String(DISPLAY_STEP),
          offset: "0",
        });
        const response = await fetch(`${apiBaseUrl}/api/catalog/products-page?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Catalog request failed: ${response.status}`);
        }

        const catalogPage = (await response.json()) as CatalogPageResponse;
        setProducts(Array.isArray(catalogPage.products) ? catalogPage.products : []);
        setTotalProducts(Number(catalogPage.total ?? 0));
        setBrands(Array.isArray(catalogPage.brands) ? catalogPage.brands : ["Todas"]);
        setCategories(Array.isArray(catalogPage.categories) ? catalogPage.categories : ["Todas"]);
        setSource(response.headers.get("X-Catalog-Status") === "unavailable" ? "odoo-error" : "odoo");
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
          setTotalProducts(0);
          setSource("error");
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [brand, cameraResolution, cameraType, category, debouncedQuery, onlyStock, sortMode]);

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

  const activeFilterCount = [
    brand !== "Todas",
    category !== "Todas",
    cameraResolution !== "Todas",
    cameraType !== "Todos",
    onlyStock,
  ].filter(Boolean).length;

  const visibleProducts = products;

  function clearFilters() {
    setBrand("Todas");
    setCategory("Todas");
    setCameraResolution("Todas");
    setCameraType("Todos");
    setOnlyStock(false);
  }

  async function loadMoreProducts() {
    if (isLoadingMore || products.length >= totalProducts) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const params = new URLSearchParams({
      search: debouncedQuery.trim(),
      brand,
      category,
      cameraResolution,
      cameraType,
      onlyStock: String(onlyStock),
      sort: sortMode,
      limit: String(DISPLAY_STEP),
      offset: String(products.length),
    });

    setIsLoadingMore(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/catalog/products-page?${params}`);
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const catalogPage = (await response.json()) as CatalogPageResponse;
      setProducts((current) => [...current, ...(Array.isArray(catalogPage.products) ? catalogPage.products : [])]);
      setTotalProducts(Number(catalogPage.total ?? totalProducts));
      setSource(response.headers.get("X-Catalog-Status") === "unavailable" ? "odoo-error" : "odoo");
    } catch {
      setSource("error");
    } finally {
      setIsLoadingMore(false);
    }
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

  function toggleFavorite(product: CatalogProduct) {
    const result = toggleFavoriteProduct(product);
    setFavoriteIds(new Set(result.ids));
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
      <main className="min-h-screen bg-[#F6F8FC] text-slate-950 dark:bg-[#080d19] dark:text-white">

      <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1020]">
        <div className="mx-auto max-w-[1800px] px-4 py-3 lg:px-6 lg:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600 dark:text-mint">Worldcam / Productos</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">Catalogo conectado a Odoo</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-blue-100/65 md:text-base">
                Lista de productos real para venta, cotizacion y consulta rapida por clave, existencia o categoria.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 bg-[#F8FAFF] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-2xl font-black text-[#022C96] dark:text-white">{totalProducts}</p>
                <p className="text-xs font-black uppercase text-slate-500 dark:text-white/55">Resultados</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[#F8FAFF] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-2xl font-black text-[#022C96] dark:text-white">{activeFilterCount}</p>
                <p className="text-xs font-black uppercase text-slate-500 dark:text-white/55">Filtros</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[#F8FAFF] px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                <PackageSearch className="h-5 w-5 text-emerald-600 dark:text-mint" aria-hidden />
                <p className="mt-1 text-xs font-black uppercase text-slate-500 dark:text-white/55">
                  {source === "loading" ? "Conectando" : source === "error" ? "Sin API" : source === "odoo-error" ? "Odoo sin conexion" : "Odoo activo"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`mx-auto grid max-w-[1800px] gap-4 px-4 py-4 lg:px-6 ${filtersOpen ? "lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]" : "lg:grid-cols-1"}`}>
        {filtersOpen ? (
        <aside className="self-start space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,42,91,.06)] dark:border-white/10 dark:bg-[#101727]">
          <div>
            <div className="flex items-center justify-between gap-3 text-[#071b50] dark:text-white">
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                </span>
                <h2 className="text-base font-black">Filtrar productos</h2>
              </span>
              <div className="flex gap-2">
                <button
                  className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-black text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:text-blue-100/70 dark:hover:bg-blue-500/10"
                  onClick={clearFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Limpiar
                </button>
                <button
                  className="flex h-8 items-center rounded-lg border border-blue-200 px-2 text-[11px] font-black text-blue-700 transition hover:bg-blue-50 dark:border-blue-400/30 dark:text-blue-100 dark:hover:bg-blue-500/15"
                  onClick={() => setFiltersOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="relative mt-3">
              <select
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name-asc">Nombre A-Z</option>
                <option value="stock-desc">Mayor existencia</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-blue-100/60" aria-hidden />
            </div>
          </div>

          {isCameraSearch ? (
            <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-white/10">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600 dark:text-blue-300">Resolución</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-blue-100/55">Megapíxeles de la cámara</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {cameraResolutions.map((resolution) => (
                    <button
                      key={resolution}
                      type="button"
                      className={`h-9 rounded-lg border text-[11px] font-black transition ${
                        cameraResolution === resolution
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100/70"
                      }`}
                      onClick={() => setCameraResolution(resolution)}
                    >
                      {resolution === "Todas" ? "Todas" : `${resolution} MP`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600 dark:text-blue-300">Tipo de cámara</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cameraTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                        cameraType === type.value
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-blue-100/70"
                      }`}
                      onClick={() => setCameraType(type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!isCameraSearch ? (
          <div className="border-t border-slate-200 pt-5 dark:border-white/10">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-blue-100">Categorias</h3>
            <div className="mt-4 space-y-2">
              {categories.slice(0, 14).map((item) => {
                const Icon = getIconForCategory(item);

                return (
                  <button
                    key={item}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      category === item
                        ? "border border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-400/50 dark:bg-blue-700/25 dark:text-blue-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700 dark:text-blue-100/70 dark:hover:bg-white/[0.06] dark:hover:text-white"
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
          ) : null}

          <div className="border-t border-slate-100 pt-4 dark:border-white/10">
            <h3 className="text-[11px] font-black uppercase tracking-[.14em] text-blue-600 dark:text-blue-300">Marcas</h3>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {displayedBrands.slice(0, 18).map((item) => (
                <button
                  key={item}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold transition ${
                    brand === item ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-blue-700 dark:text-blue-100/70 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  }`}
                  onClick={() => setBrand(item)}
                >
                  <span className={`h-4 w-4 rounded border ${brand === item ? "border-blue-300 bg-blue-500" : "border-slate-300 dark:border-blue-100/40"}`} />
                  <span className="truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
        ) : null}

        <div>
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-blue-300/15 dark:bg-[#0d1324] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-blue-600 dark:text-mint">{totalProducts} productos</p>
              <p className="truncate text-sm font-semibold text-slate-600 dark:text-blue-100/65">
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
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/35 dark:bg-blue-700/20 dark:text-blue-100 dark:hover:bg-blue-700/35"
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
                <div key={index} className="h-[360px] animate-pulse rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]" />
              ))}
            </div>
          ) : totalProducts === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
              <PackageSearch className="mx-auto h-10 w-10 text-slate-400 dark:text-blue-100/45" aria-hidden />
              <h2 className="mt-4 text-2xl font-black text-slate-950 dark:text-white">No hay productos para mostrar</h2>
              <p className="mt-2 text-slate-600 dark:text-blue-100/60">
                {source === "error"
                  ? "La API no respondio. Revisa que el backend este encendido."
                  : source === "odoo-error"
                    ? "Odoo rechazo la autenticacion. Revisa las credenciales del backend."
                  : "Prueba con otra busqueda o limpia los filtros."}
              </p>
            </div>
          ) : (
            <>
            <div className={`grid gap-3 sm:grid-cols-2 ${filtersOpen ? "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}`}>
              {visibleProducts.map((product, index) => (
                (() => {
                  const variantId = Number(product.variantId ?? product.id);
                  const draftQty = Number.isFinite(variantId) ? salesDraftQtyByVariant[variantId] ?? 0 : 0;

                  return (
                <article
                  key={productKey(product)}
                  className="group relative flex min-h-[430px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-within:border-blue-400 dark:border-white/10 dark:bg-[#121827] dark:hover:border-blue-400/40"
                >
                  <button
                    type="button"
                    className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-md backdrop-blur transition hover:scale-105 ${favoriteIds.has(productKey(product)) ? "border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500"}`}
                    onClick={() => toggleFavorite(product)}
                    aria-label={`${favoriteIds.has(productKey(product)) ? "Quitar de" : "Agregar a"} favoritos: ${product.name}`}
                    aria-pressed={favoriteIds.has(productKey(product))}
                  >
                    <Heart className={`h-4.5 w-4.5 ${favoriteIds.has(productKey(product)) ? "fill-current" : ""}`} aria-hidden />
                  </button>
                  <a
                    href={`/catalogo/${encodeURIComponent(productKey(product))}`}
                    className="block outline-none"
                    aria-label={`Ver detalle de ${product.name}`}
                  >
                    <div className="relative flex h-48 items-center justify-center bg-white p-4 sm:h-52 dark:bg-[#121827]">
                      <ProductImage product={product} />
                      {product.discount ? (
                        <span className="absolute left-3 top-3 rounded-md bg-coral px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">{product.discount}</span>
                      ) : index < 3 ? (
                        <span className="absolute left-3 top-3 rounded-md bg-coral px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">Top {index + 1}</span>
                      ) : null}
                      {isStaff && draftQty > 0 ? (
                        <span className="absolute bottom-3 left-3 rounded-md bg-coral px-2.5 py-1 text-[10px] font-black text-white shadow-sm">En orden: {draftQty}</span>
                      ) : null}
                    </div>

                    <div className="border-t border-slate-100 px-4 pb-3 pt-4 dark:border-white/10">
                      <div className="flex items-center justify-between gap-2">
                        <span className="max-w-[62%] truncate rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">{product.brand || "Worldcam"}</span>
                        <span className={`shrink-0 text-[10px] font-black ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                          {product.stock > 0 ? "Disponible" : "Consultar"}
                        </span>
                      </div>
                      <h2 className="mt-2 line-clamp-2 min-h-11 text-sm font-bold leading-[1.35rem] text-slate-800 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                        {compactName(product.name)}
                      </h2>
                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11px] dark:border-white/10">
                        <p className="flex items-center gap-1 truncate text-slate-500 dark:text-blue-100/55">
                          SKU: <span className="truncate font-bold text-slate-700 dark:text-blue-100">{product.sku || product.clave || "Sin SKU"}</span>
                          <Copy className="h-3 w-3 shrink-0" aria-hidden />
                        </p>
                        <p className="truncate text-slate-500 dark:text-blue-100/55">
                          Modelo: <span className="font-semibold text-slate-700 dark:text-blue-100">{product.clave || product.sku || "N/D"}</span>
                        </p>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-2">
                        <p className="text-[1.7rem] font-black leading-none tracking-tight text-slate-950 dark:text-white">{product.price > 0 ? currency.format(product.price) : "Cotizar"}</p>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">Stock: {product.stock}</span>
                      </div>
                      <p className={`mt-2 text-xs font-bold ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>{product.stock > 0 ? "Disponible para entrega" : "Disponibilidad por confirmar"}</p>
                    </div>
                  </a>

                  <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 px-4 pb-4 pt-1">
                    {isStaff && draftQty > 0 ? (
                        <div className="grid h-10 grid-cols-[34px_1fr_34px] overflow-hidden rounded-md bg-blue-700 text-xs font-black text-white">
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
                        type="button"
                        className={`flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-black text-white transition ${lastAddedId === productKey(product) ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"}`}
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                        {lastAddedId === productKey(product) ? "Agregado" : isStaff ? "Agregar a la orden" : "Agregar"}
                      </button>
                    )}
                    <a
                      href={`/catalogo/${encodeURIComponent(productKey(product))}`}
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white"
                      aria-label={`Ver detalle de ${product.name}`}
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </article>
                  );
                })()
              ))}
            </div>
            {visibleProducts.length < totalProducts ? (
              <div className="mt-6 flex justify-center">
                <button
                  className="h-12 rounded-lg border border-blue-300 bg-blue-50 px-5 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/35 dark:bg-blue-700/20 dark:text-blue-100 dark:hover:bg-blue-700/35"
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Cargando..." : `Ver mas productos (${totalProducts - visibleProducts.length} restantes)`}
                </button>
              </div>
            ) : null}
            </>
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
