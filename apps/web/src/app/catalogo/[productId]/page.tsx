"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Box,
  Copy,
  Layers3,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Warehouse,
} from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../../../components/SiteHeader";
import { addCartItem } from "../../../lib/cart";

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
  internalNotesHtml?: string;
};

type WarehouseAvailability = {
  id: "wcam" | "tvc" | "syscom";
  label: string;
  stock: number | null;
  status: "active" | "pending" | "unconfigured" | "error";
  message?: string;
};

type CatalogPageResponse = {
  products: CatalogProduct[];
  total: number;
};

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

function productKey(product: CatalogProduct) {
  return String(product.variantId ?? product.id ?? product.sku);
}

function compactName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function productDisplayTitle(product: CatalogProduct) {
  const name = compactName(product.name);
  const code = compactName(product.clave || product.sku || "");
  const brand = compactName(product.brand || "");

  if (code) {
    const brandedCode = brand && !code.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${code}` : code;
    if (name.length > 70) return brandedCode;
  }

  if (name.length <= 70) return name;
  return `${name.slice(0, 67).trim()}...`;
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
    .filter((token) => token.length > 2 && !["para", "con", "sin", "the", "and", "una", "uno", "los", "las"].includes(token));
}

function money(value: number) {
  return currency.format(value);
}

function productText(product: CatalogProduct) {
  return normalizeSearch([product.name, product.description, product.brand, product.category, product.sku, product.clave].filter(Boolean).join(" "));
}

function pickProductHighlights(product: CatalogProduct) {
  const text = productText(product);
  const highlights = [
    { label: "IP / red", match: /\b(ip|ipc|poe|network|red)\b/.test(text) },
    { label: "Domo", match: /\b(domo|dome|turret)\b/.test(text) },
    { label: "Bullet", match: /\b(bullet|bala)\b/.test(text) },
    { label: "PTZ", match: /\b(ptz|zoom)\b/.test(text) },
    { label: "Audio", match: /\b(audio|microfono|mic)\b/.test(text) },
    { label: "Exterior", match: /\b(exterior|ip66|ip67|intemperie)\b/.test(text) },
    { label: "Vision nocturna", match: /\b(ir|nocturna|night)\b/.test(text) },
    { label: "PoE", match: /\bpoe\b/.test(text) },
    { label: "H.265", match: /\bh265|h 265|h\.265\b/.test(text) },
  ];

  return highlights.filter((item) => item.match).slice(0, 6);
}

function buildRelatedSearch(product: CatalogProduct) {
  const category = normalizeSearch(product.category);
  if (category.includes("camara") || category.includes("videovigilancia")) {
    return `${product.brand || ""} camara`.trim();
  }
  return `${product.brand || ""} ${product.category || product.name}`.trim();
}

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = decodeURIComponent(String(params.productId ?? ""));
  const [relatedProducts, setRelatedProducts] = useState<CatalogProduct[]>([]);
  const [productDetail, setProductDetail] = useState<CatalogProduct | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseAvailability[]>([]);
  const [source, setSource] = useState<"loading" | "odoo" | "error">("loading");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

    async function loadProducts() {
      setSource("loading");
      setProductDetail(null);
      setRelatedProducts([]);
      setWarehouses([]);

      try {
        const [detailResponse, warehousesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/catalog/products/${encodeURIComponent(productId)}`, {
            signal: controller.signal,
          }),
          fetch(`${apiBaseUrl}/api/catalog/products/${encodeURIComponent(productId)}/warehouses`, {
            signal: controller.signal,
          }),
        ]);

        if (!detailResponse.ok) throw new Error(`Product request failed: ${detailResponse.status}`);

        const detail = (await detailResponse.json()) as CatalogProduct | null;
        const nextProduct = detail && typeof detail === "object" ? detail : null;
        setProductDetail(nextProduct);

        if (warehousesResponse.ok) {
          const warehouseRows = (await warehousesResponse.json()) as WarehouseAvailability[];
          setWarehouses(Array.isArray(warehouseRows) ? warehouseRows : []);
        }

        if (nextProduct) {
          const relatedParams = new URLSearchParams({
            search: buildRelatedSearch(nextProduct),
            limit: "8",
            offset: "0",
          });
          const relatedResponse = await fetch(`${apiBaseUrl}/api/catalog/products-page?${relatedParams}`, {
            signal: controller.signal,
          });
          if (relatedResponse.ok) {
            const relatedPage = (await relatedResponse.json()) as CatalogPageResponse;
            setRelatedProducts(
              Array.isArray(relatedPage.products)
                ? relatedPage.products.filter((item) => productKey(item) !== productKey(nextProduct)).slice(0, 8)
                : [],
            );
          }
        }

        setSource("odoo");
      } catch {
        if (!controller.signal.aborted) {
          setRelatedProducts([]);
          setProductDetail(null);
          setWarehouses([]);
          setSource("error");
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [productId]);

  const product = productDetail;

  const highlights = useMemo(() => (product ? pickProductHighlights(product) : []), [product]);
  const relatedSearch = product ? buildRelatedSearch(product) : "";

  function handleAddToCart(item: CatalogProduct) {
    addCartItem({
      id: productKey(item),
      productId: item.id,
      variantId: item.variantId,
      sku: item.sku,
      clave: item.clave,
      brand: item.brand || "Worldcam",
      category: item.category || "Sin categoria",
      name: item.name,
      price: item.price,
      image: item.image,
    });
    setAddedId(productKey(item));
    window.setTimeout(() => setAddedId((current) => (current === productKey(item) ? null : current)), 1300);
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteHeader active="catalogo" />

      <section className="border-b border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a className="inline-flex h-10 items-center gap-2 rounded-lg border border-coral/30 bg-white px-3 text-sm font-black text-coral shadow-sm transition hover:bg-coral/10" href="/catalogo">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al catalogo
            </a>
            {product ? (
              <a
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-coral px-4 text-sm font-black text-white shadow-sm transition hover:bg-coral/90"
                href={`/catalogo?buscar=${encodeURIComponent(relatedSearch)}`}
              >
                <Search className="h-4 w-4" aria-hidden />
                Buscar relacionados
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {source === "loading" ? (
        <section className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(360px,0.85fr)_1.15fr]">
            <div className="h-[620px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            <div className="h-[620px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          </div>
        </section>
      ) : !product ? (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
          <PackageSearch className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
          <h1 className="mt-4 text-3xl font-black">Producto no encontrado</h1>
          <p className="mt-3 text-slate-500">
            {source === "error" ? "No se pudo conectar con la API de productos." : "El producto ya no aparece en el catalogo actual de Odoo."}
          </p>
          <a className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-coral px-5 font-black text-white transition hover:bg-coral/90" href="/catalogo">
            Regresar al catalogo
          </a>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 lg:grid-cols-[minmax(360px,0.85fr)_1.15fr] lg:px-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex min-h-[520px] items-center justify-center bg-gradient-to-b from-white to-slate-50 p-6">
                {product.image ? (
                  <img className="max-h-[620px] w-full object-contain" src={product.image} alt={product.name} />
                ) : (
                  <div className="flex h-[520px] w-full flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                    <PackageSearch className="h-20 w-20" aria-hidden />
                    <span className="mt-4 text-sm font-black uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase text-blue-700">
                  {product.brand || "Worldcam"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-black uppercase text-slate-600">
                  {product.category || "Sin categoria"}
                </span>
                <span className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {product.stock > 0 ? "Disponible" : "Sin existencia"}
                </span>
              </div>

              <h1 className="mt-5 max-w-5xl text-2xl font-black leading-tight text-slate-950 md:text-4xl">{compactName(product.name)}</h1>

              {product.internalNotesHtml ? (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-slate-600">
                  {product.category || "Producto"} sincronizado desde Odoo. SKU {product.sku || product.clave}.
                </p>
              ) : product.description ? (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-slate-600">
                  {product.description}
                </p>
              ) : (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-slate-500">
                  Ficha sincronizada desde Odoo. Usa clave, categoria y stock para confirmar compatibilidad antes de comprar.
                </p>
              )}

              {highlights.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <span key={item.label} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-black uppercase text-blue-700">
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Precio de venta</p>
                  <p className="mt-2 text-4xl font-black text-coral">{money(product.price)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-black uppercase text-blue-700">
                    <Tag className="h-3 w-3" aria-hidden />
                    Precio Odoo
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoTile label="SKU" value={product.sku} />
                  <InfoTile label="Clave / Codigo" value={product.clave || product.sku} />
                  <InfoTile label="Existencia" value={`${product.stock} unidades`} />
                  <InfoTile label="ID variante Odoo" value={String(product.variantId ?? "N/D")} />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="flex h-12 items-center justify-center gap-2 rounded-lg bg-coral px-5 text-base font-black text-white transition hover:bg-coral/90"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                  {addedId === productKey(product) ? "Agregado" : "Agregar al carrito"}
                </button>
                <a className="flex h-12 items-center justify-center rounded-lg border border-coral/40 bg-white px-5 text-base font-black text-coral transition hover:bg-coral/10" href="/carrito">
                  Ir al carrito
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-5 lg:grid-cols-3 lg:px-6">
            <InfoPanel
              icon={<BadgeCheck className="h-7 w-7 text-emerald-600" aria-hidden />}
              title="Informacion de Odoo"
              text="Descripcion, notas internas, precio, existencia, SKU y foto vienen sincronizados del ERP."
            />
            <InventoryPanel wcamStock={product.stock} warehouses={warehouses} />
            <InfoPanel
              icon={<ShieldCheck className="h-7 w-7 text-coral" aria-hidden />}
              title="Venta segura"
              text="Agrega al carrito y conserva la clave del producto para cotizacion o validacion."
            />
          </section>

          {product.internalNotesHtml ? (
            <section className="mx-auto max-w-[1500px] px-4 pb-8 lg:px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Notas internas</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Descripcion tecnica de Odoo</h2>
                  </div>
                  <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-black uppercase text-blue-700">
                    Ficha sincronizada
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <div
                    className="space-y-4 p-4 text-sm font-medium leading-7 text-slate-700 md:p-6 [&_*]:max-w-full [&_a]:text-blue-700 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-slate-950 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-slate-900 [&_hr]:my-4 [&_hr]:border-slate-200 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_li]:text-slate-700 [&_p]:my-2 [&_p]:text-slate-700 [&_strong]:font-black [&_strong]:text-slate-950 [&_table]:w-full [&_td]:align-top [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: product.internalNotesHtml }}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mx-auto max-w-[1500px] px-4 pb-8 lg:px-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Productos relacionados</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Sigue buscando opciones parecidas</h2>
              </div>
              <a className="inline-flex h-10 items-center gap-2 rounded-lg border border-coral/40 bg-white px-3 text-sm font-black text-coral transition hover:bg-coral/10" href={`/catalogo?buscar=${encodeURIComponent(relatedSearch)}`}>
                Ver mas
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <RelatedProductCard
                  key={productKey(item)}
                  product={item}
                  added={addedId === productKey(item)}
                  onAdd={() => handleAddToCart(item)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 break-words text-sm font-black text-slate-900">
        <Box className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
        {value}
        {value !== "N/D" ? <Copy className="h-3 w-3 shrink-0 text-slate-300" aria-hidden /> : null}
      </p>
    </div>
  );
}

function InfoPanel({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {icon}
      <h2 className="mt-3 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}

function InventoryPanel({ wcamStock, warehouses }: { wcamStock: number; warehouses: WarehouseAvailability[] }) {
  const fallbackRows: WarehouseAvailability[] = [
    {
      id: "wcam",
      label: "Almacen Wcam",
      stock: wcamStock,
      status: "active",
      message: `${wcamStock} unidades disponibles de este producto.`,
    },
    {
      id: "tvc",
      label: "Almacen TVC",
      stock: null,
      status: "pending",
      message: "Pendiente por conectar.",
    },
    {
      id: "syscom",
      label: "Almacen Syscom",
      stock: null,
      status: "pending",
      message: "Pendiente por conectar.",
    },
  ];
  const rows =
    warehouses.length > 0
      ? warehouses
      : fallbackRows;
  const total = rows.reduce((sum, row) => sum + (typeof row.stock === "number" ? row.stock : 0), 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Warehouse className="h-7 w-7 text-blue-600" aria-hidden />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-black text-slate-950">Inventario</h2>
        <span className="rounded bg-blue-50 px-2 py-1 text-xs font-black uppercase text-blue-700">
          Total {total} unidades
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <InventoryRow key={row.id} row={row} />
        ))}
      </div>
    </article>
  );
}

function inventoryValue(row: WarehouseAvailability) {
  if (typeof row.stock === "number") return `${row.stock} unidades`;
  if (row.status === "unconfigured") return "Sin conectar";
  if (row.status === "error") return "Error";
  return "Pendiente";
}

function InventoryRow({ row }: { row: WarehouseAvailability }) {
  const active = row.status === "active";
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div>
        <span className="text-sm font-black text-slate-900">{row.label}</span>
        {row.message ? <p className="mt-0.5 text-xs font-semibold text-slate-500">{row.message}</p> : null}
      </div>
      <span className={`shrink-0 text-sm font-black ${active ? "text-emerald-700" : row.status === "error" ? "text-coral" : "text-slate-400"}`}>
        {inventoryValue(row)}
      </span>
    </div>
  );
}

function RelatedProductCard({ product, added, onAdd }: { product: CatalogProduct; added: boolean; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
      <a href={`/catalogo/${encodeURIComponent(productKey(product))}`} className="flex aspect-square items-center justify-center bg-white p-3">
        {product.image ? (
          <img className="h-full w-full object-contain transition group-hover:scale-[1.02]" src={product.image} alt={product.name} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded bg-slate-100 text-slate-300">
            <Layers3 className="h-12 w-12" aria-hidden />
            <span className="mt-2 text-xs font-black uppercase">Sin imagen</span>
          </div>
        )}
      </a>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-black uppercase text-blue-700">{product.brand || "Worldcam"}</p>
          <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {product.stock > 0 ? "Disponible" : "Sin stock"}
          </span>
        </div>
        <a href={`/catalogo/${encodeURIComponent(productKey(product))}`} className="mt-2 line-clamp-3 min-h-[66px] text-sm font-black leading-snug text-slate-800 hover:text-blue-700">
          {productDisplayTitle(product)}
        </a>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-slate-950">{money(product.price)}</p>
            <p className="text-[11px] font-bold text-slate-400">SKU {product.sku || product.clave}</p>
          </div>
          <button className="h-9 rounded-lg bg-coral px-3 text-xs font-black text-white transition hover:bg-coral/90" onClick={onAdd}>
            {added ? "Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}
