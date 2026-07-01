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

function relatedScore(current: CatalogProduct, candidate: CatalogProduct) {
  if (productKey(current) === productKey(candidate)) return -1;

  const currentTokens = new Set(searchTokens(`${current.name} ${current.description ?? ""} ${current.category} ${current.brand}`));
  const candidateText = productText(candidate);
  let score = 0;

  if (current.brand && candidate.brand === current.brand) score += 40;
  if (current.category && candidate.category === current.category) score += 55;
  if (candidate.stock > 0) score += 8;
  if (candidate.image) score += 5;

  for (const token of currentTokens) {
    if (candidateText.includes(token)) score += token.length > 4 ? 10 : 4;
  }

  return score;
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
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [source, setSource] = useState<"loading" | "odoo" | "error">("loading");
  const [addedId, setAddedId] = useState<string | null>(null);

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
        setSource("odoo");
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

  const product = useMemo(() => {
    return products.find((item) => {
      return productKey(item) === productId || String(item.id) === productId || item.sku === productId || item.clave === productId;
    });
  }, [productId, products]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .map((item) => ({ product: item, score: relatedScore(product, item) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock)
      .slice(0, 8)
      .map((item) => item.product);
  }, [product, products]);

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
    <main className="min-h-screen bg-[#080d19] text-white">
      <SiteHeader active="catalogo" />

      <section className="border-b border-white/10 bg-[#0b1020]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-black text-blue-100/75 hover:bg-white/[0.04] hover:text-white" href="/catalogo">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al catalogo
            </a>
            {product ? (
              <a
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-600/15 px-3 text-sm font-black text-blue-100 hover:bg-blue-600/25"
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
            <div className="h-[620px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
            <div className="h-[620px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
          </div>
        </section>
      ) : !product ? (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
          <PackageSearch className="mx-auto h-12 w-12 text-blue-100/40" aria-hidden />
          <h1 className="mt-4 text-3xl font-black">Producto no encontrado</h1>
          <p className="mt-3 text-blue-100/60">
            {source === "error" ? "No se pudo conectar con la API de productos." : "El producto ya no aparece en el catalogo actual de Odoo."}
          </p>
          <a className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-blue-700 px-5 font-black text-white" href="/catalogo">
            Regresar al catalogo
          </a>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 lg:grid-cols-[minmax(360px,0.85fr)_1.15fr] lg:px-6">
            <div className="overflow-hidden rounded-lg border border-blue-300/20 bg-[#151b2a]">
              <div className="flex min-h-[520px] items-center justify-center bg-white p-4">
                {product.image ? (
                  <img className="max-h-[620px] w-full object-contain" src={product.image} alt={product.name} />
                ) : (
                  <div className="flex h-[520px] w-full flex-col items-center justify-center rounded bg-[#202331] text-blue-100/30">
                    <PackageSearch className="h-20 w-20" aria-hidden />
                    <span className="mt-4 text-sm font-black uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-blue-300/20 bg-[#0d1324] p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-mint/15 px-2.5 py-1 text-[11px] font-black uppercase text-mint">
                  {product.brand || "Worldcam"}
                </span>
                <span className="rounded bg-blue-500/15 px-2.5 py-1 text-[11px] font-black uppercase text-blue-200">
                  {product.category || "Sin categoria"}
                </span>
                <span className={`rounded px-2.5 py-1 text-[11px] font-black uppercase ${product.stock > 0 ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}>
                  {product.stock > 0 ? "Disponible" : "Sin existencia"}
                </span>
              </div>

              <h1 className="mt-4 max-w-5xl text-2xl font-black leading-tight md:text-4xl">{compactName(product.name)}</h1>

              {product.internalNotesHtml ? (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-blue-100/70">
                  {product.category || "Producto"} sincronizado desde Odoo. SKU {product.sku || product.clave}.
                </p>
              ) : product.description ? (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-blue-100/75">
                  {product.description}
                </p>
              ) : (
                <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-blue-100/60">
                  Ficha sincronizada desde Odoo. Usa clave, categoria y stock para confirmar compatibilidad antes de comprar.
                </p>
              )}

              {highlights.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <span key={item.label} className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-black uppercase text-cyan-100">
                      {item.label}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-black uppercase text-blue-100/55">Precio de venta</p>
                  <p className="mt-2 text-4xl font-black text-coral">{money(product.price)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-1 text-xs font-black uppercase text-blue-200">
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
                <a className="flex h-12 items-center justify-center rounded-lg border border-blue-400/30 px-5 text-base font-black text-blue-100 hover:bg-white/[0.04]" href="/carrito">
                  Ir al carrito
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-[1500px] gap-4 px-4 pb-5 lg:grid-cols-3 lg:px-6">
            <InfoPanel
              icon={<BadgeCheck className="h-7 w-7 text-mint" aria-hidden />}
              title="Informacion de Odoo"
              text="Descripcion, notas internas, precio, existencia, SKU y foto vienen sincronizados del ERP."
            />
            <InventoryPanel wcamStock={product.stock} />
            <InfoPanel
              icon={<ShieldCheck className="h-7 w-7 text-coral" aria-hidden />}
              title="Venta segura"
              text="Agrega al carrito y conserva la clave del producto para cotizacion o validacion."
            />
          </section>

          {product.internalNotesHtml ? (
            <section className="mx-auto max-w-[1500px] px-4 pb-8 lg:px-6">
              <div className="rounded-lg border border-blue-300/20 bg-[#0d1324] p-4 md:p-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-mint">Notas internas</p>
                    <h2 className="mt-1 text-2xl font-black">Descripcion tecnica de Odoo</h2>
                  </div>
                  <span className="rounded bg-blue-500/15 px-2.5 py-1 text-xs font-black uppercase text-blue-200">
                    Ficha sincronizada
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-white/10 bg-[#050914]">
                  <div
                    className="space-y-4 p-4 text-sm font-medium leading-7 text-blue-100 md:p-6 [&_*]:max-w-full [&_a]:text-cyan-200 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-white [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-white [&_hr]:my-4 [&_hr]:border-white/15 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_li]:text-blue-100 [&_p]:my-2 [&_p]:text-blue-100 [&_strong]:font-black [&_strong]:text-white [&_table]:w-full [&_td]:align-top [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: product.internalNotesHtml }}
                  />
                </div>
              </div>
            </section>
          ) : null}

          <section className="mx-auto max-w-[1500px] px-4 pb-8 lg:px-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-mint">Productos relacionados</p>
                <h2 className="mt-1 text-2xl font-black">Sigue buscando opciones parecidas</h2>
              </div>
              <a className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-400/30 px-3 text-sm font-black text-blue-100 hover:bg-white/[0.04]" href={`/catalogo?buscar=${encodeURIComponent(relatedSearch)}`}>
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
    <div className="rounded-lg border border-white/10 bg-[#080d19] p-3">
      <p className="text-[10px] font-black uppercase text-blue-100/45">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 break-words text-sm font-black text-white">
        <Box className="h-3.5 w-3.5 shrink-0 text-blue-300" aria-hidden />
        {value}
        {value !== "N/D" ? <Copy className="h-3 w-3 shrink-0 text-blue-100/35" aria-hidden /> : null}
      </p>
    </div>
  );
}

function InfoPanel({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      {icon}
      <h2 className="mt-3 text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-blue-100/65">{text}</p>
    </article>
  );
}

function InventoryPanel({ wcamStock }: { wcamStock: number }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <Warehouse className="h-7 w-7 text-blue-300" aria-hidden />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-black">Inventario</h2>
        <span className="rounded bg-blue-500/15 px-2 py-1 text-xs font-black uppercase text-blue-200">
          Total {wcamStock} unidades
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        <InventoryRow label="Almacen Wcam" value={`${wcamStock} unidades`} active />
        <InventoryRow label="Almacen TVC" value="Pendiente" />
        <InventoryRow label="Almacen Syscom" value="Pendiente" />
      </div>
    </article>
  );
}

function InventoryRow({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#080d19] px-3 py-2">
      <span className="text-sm font-black text-blue-100">{label}</span>
      <span className={`text-sm font-black ${active ? "text-white" : "text-blue-100/45"}`}>{value}</span>
    </div>
  );
}

function RelatedProductCard({ product, added, onAdd }: { product: CatalogProduct; added: boolean; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-blue-300/20 bg-[#151b2a] transition hover:-translate-y-0.5 hover:border-blue-400/60">
      <a href={`/catalogo/${encodeURIComponent(productKey(product))}`} className="flex aspect-square items-center justify-center bg-white p-3">
        {product.image ? (
          <img className="h-full w-full object-contain transition group-hover:scale-[1.02]" src={product.image} alt={product.name} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded bg-[#202331] text-blue-100/30">
            <Layers3 className="h-12 w-12" aria-hidden />
            <span className="mt-2 text-xs font-black uppercase">Sin imagen</span>
          </div>
        )}
      </a>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-black uppercase text-mint">{product.brand || "Worldcam"}</p>
          <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase ${product.stock > 0 ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}>
            {product.stock > 0 ? "Disponible" : "Sin stock"}
          </span>
        </div>
        <a href={`/catalogo/${encodeURIComponent(productKey(product))}`} className="mt-2 line-clamp-3 min-h-[66px] text-sm font-black leading-snug text-blue-100 hover:text-white">
          {productDisplayTitle(product)}
        </a>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-white">{money(product.price)}</p>
            <p className="text-[11px] font-bold text-blue-100/45">SKU {product.sku || product.clave}</p>
          </div>
          <button className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-black text-white hover:bg-blue-600" onClick={onAdd}>
            {added ? "Agregado" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}
