"use client";

import { ArrowLeft, BadgeCheck, Box, Copy, PackageSearch, ShieldCheck, ShoppingCart, Tag, Warehouse } from "lucide-react";
import { useParams } from "next/navigation";
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

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = decodeURIComponent(String(params.productId ?? ""));
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [source, setSource] = useState<"loading" | "odoo" | "error">("loading");
  const [added, setAdded] = useState(false);

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

  function handleAddToCart() {
    if (!product) return;

    addCartItem({
      id: productKey(product),
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
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <main className="min-h-screen bg-[#080d19] text-white">
      <SiteHeader active="catalogo" />

      <section className="border-b border-white/10 bg-[#0b1020]">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <a className="inline-flex items-center gap-2 text-sm font-black text-blue-100/70 hover:text-white" href="/catalogo">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al catalogo
          </a>
        </div>
      </section>

      {source === "loading" ? (
        <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="h-[520px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
            <div className="h-[520px] animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
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
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-[#151b2a]">
              <div className="flex min-h-[420px] items-center justify-center bg-[#202331] p-5">
                {product.image ? (
                  <img className="max-h-[520px] w-full object-contain" src={product.image} alt={product.name} />
                ) : (
                  <div className="flex h-[420px] w-full flex-col items-center justify-center rounded bg-white/[0.03] text-blue-100/30">
                    <PackageSearch className="h-20 w-20" aria-hidden />
                    <span className="mt-4 text-sm font-black uppercase tracking-widest">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0d1324] p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-mint/15 px-3 py-1 text-xs font-black uppercase text-mint">
                  {product.brand || "Worldcam"}
                </span>
                <span className="rounded bg-blue-500/15 px-3 py-1 text-xs font-black uppercase text-blue-200">
                  {product.category || "Sin categoria"}
                </span>
                <span className={`rounded px-3 py-1 text-xs font-black uppercase ${product.stock > 0 ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"}`}>
                  {product.stock > 0 ? "Disponible" : "Sin existencia"}
                </span>
              </div>

              <h1 className="mt-5 text-2xl font-black leading-tight md:text-4xl">{compactName(product.name)}</h1>

              <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm font-black uppercase text-blue-100/55">Precio de venta</p>
                <p className="mt-2 text-4xl font-black text-coral">{currency.format(product.price)}</p>
                <p className="mt-2 inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-1 text-xs font-black uppercase text-blue-200">
                  <Tag className="h-3 w-3" aria-hidden />
                  Precio Odoo
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoTile label="SKU" value={product.sku} />
                <InfoTile label="Clave / Codigo" value={product.clave || product.sku} />
                <InfoTile label="ID plantilla Odoo" value={String(product.id ?? "N/D")} />
                <InfoTile label="ID variante Odoo" value={String(product.variantId ?? "N/D")} />
                <InfoTile label="Existencia" value={`${product.stock} unidades`} />
                <InfoTile label="Categoria" value={product.category || "Sin categoria"} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  className="flex h-13 items-center justify-center gap-2 rounded-lg bg-coral px-5 py-4 text-lg font-black text-white transition hover:bg-coral/90"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                  {added ? "Agregado" : "Agregar al carrito"}
                </button>
                <a className="flex h-13 items-center justify-center rounded-lg border border-blue-400/30 px-5 py-4 text-lg font-black text-blue-100 hover:bg-white/[0.04]" href="/carrito">
                  Ir al carrito
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 lg:grid-cols-3 lg:px-8">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <BadgeCheck className="h-8 w-8 text-mint" aria-hidden />
              <h2 className="mt-4 text-xl font-black">Informacion general</h2>
              <p className="mt-2 leading-7 text-blue-100/65">
                Producto sincronizado desde Odoo para consulta, cotizacion y compra en linea. La informacion visible depende de los campos disponibles en el ERP.
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Warehouse className="h-8 w-8 text-blue-300" aria-hidden />
              <h2 className="mt-4 text-xl font-black">Inventario</h2>
              <p className="mt-2 leading-7 text-blue-100/65">
                Existencia actual reportada por Odoo: <span className="font-black text-white">{product.stock}</span> unidades.
              </p>
            </article>
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <ShieldCheck className="h-8 w-8 text-coral" aria-hidden />
              <h2 className="mt-4 text-xl font-black">Venta segura</h2>
              <p className="mt-2 leading-7 text-blue-100/65">
                Puedes agregarlo al carrito e-commerce y continuar con una compra en linea clara y segura.
              </p>
            </article>
          </section>
        </>
      )}
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#080d19] p-4">
      <p className="text-xs font-black uppercase text-blue-100/45">{label}</p>
      <p className="mt-2 flex items-center gap-2 break-words font-black text-white">
        <Box className="h-4 w-4 shrink-0 text-blue-300" aria-hidden />
        {value}
        {value !== "N/D" ? <Copy className="h-3.5 w-3.5 shrink-0 text-blue-100/35" aria-hidden /> : null}
      </p>
    </div>
  );
}
