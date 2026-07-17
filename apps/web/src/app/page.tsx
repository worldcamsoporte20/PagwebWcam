"use client";

import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  PackageSearch,
  Phone,
  ShieldCheck,
  Star,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { PointerEvent, useEffect, useRef, useState } from "react";
import AntiGravityPtz from "../components/AntiGravityPtz";
import BrandCarousel from "../components/BrandCarousel";
import SiteHeader from "../components/SiteHeader";
import TikTokVideos from "@/components/TikTokVideos";
import SiteFooter from "@/components/SiteFooter";
import SupportAdvisors from "@/components/SupportAdvisors";
import { addCartItem } from "../lib/cart";

type CatalogProduct = {
  id?: number;
  variantId?: number;
  name: string;
  sku: string;
  clave?: string;
  model?: string;
  brand?: string;
  category?: string;
  price: number;
  stock: number;
  image?: string;
};

type Banner = {
  title: string;
  image: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const defaultPromoSlides: Banner[] = [
  {
    title: "Camaras solares 4G",
    image: "/images/promos/camaras-solares-4g.png",
  },
  {
    title: "Discos duros para videovigilancia",
    image: "/images/promos/discos-duros-videovigilancia.png",
  },
  {
    title: "Switches de alto rendimiento",
    image: "/images/promos/switches-alto-rendimiento.png",
  },
];

const quickCategories = ["Videovigilancia", "Acceso", "Alarmas", "Redes", "Cableado UTP", "Cerraduras"];

const productRows = [
  {
    key: "cameras",
    eyebrow: "Videovigilancia",
    title: "Camaras mas vendidas",
    description: "Camaras IP, HDCVI, domos, bullets y PTZ listas para tus instalaciones.",
    search: "camara",
    icon: Camera,
    matches: ["camara", "camera", "ipc", "bullet", "domo", "dome", "turret", "ptz"],
  },
  {
    key: "kits",
    eyebrow: "Soluciones completas",
    title: "Kits recomendados",
    description: "Combos de videovigilancia para instalar con todos los componentes esenciales.",
    search: "kit",
    icon: PackageSearch,
    matches: ["kit", "combo", "paquete"],
  },
  {
    key: "networks",
    eyebrow: "Conectividad",
    title: "Redes y conectividad",
    description: "Switches PoE, routers, cableado y accesorios para una red estable.",
    search: "redes",
    icon: Wifi,
    matches: ["switch", "poe", "router", "access point", "utp", "ethernet", "redes", "network"],
  },
] as const;

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function productKey(product: CatalogProduct) {
  return String(product.variantId ?? product.id ?? product.sku);
}

export default function Homeicon() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [promoSlides, setPromoSlides] = useState<Banner[]>(defaultPromoSlides);
  const [catalogRows, setCatalogRows] = useState<Record<string, CatalogProduct[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const didSwipe = useRef(false);

  const catalogHighlights = Object.values(catalogRows).flat().slice(0, 8);

  const slide = promoSlides[activeSlide];

  const goToPrevious = () => {
    if (promoSlides.length === 0) return;
    setActiveSlide((current) => (current === 0 ? promoSlides.length - 1 : current - 1));
  };

  const goToNext = () => {
    if (promoSlides.length === 0) return;
    setActiveSlide((current) => (current === promoSlides.length - 1 ? 0 : current + 1));
  };

  const moveProductCarousel = (rowKey: string, direction: -1 | 1) => {
    carouselRefs.current[rowKey]?.scrollBy({ left: direction * 720, behavior: "smooth" });
  };

  const handleAddToCart = (product: CatalogProduct) => {
    const id = productKey(product);
    addCartItem({
      id,
      productId: product.id,
      variantId: product.variantId,
      sku: product.sku,
      clave: product.clave || product.sku,
      brand: product.brand || "Worldcam",
      category: product.category || "Sin categoria",
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setLastAddedId(id);
    window.setTimeout(() => setLastAddedId((current) => (current === id ? null : current)), 1400);
  };

  useEffect(() => {
    if (promoSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current === promoSlides.length - 1 ? 0 : current + 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [promoSlides.length]);

  useEffect(() => {
    let active = true;

    async function loadBanners() {
      try {
        const response = await fetch(
          `${apiBaseUrl || "http://localhost:3000"}/api/banner`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error("No se pudieron cargar los banners.");

        const data: Banner[] = await response.json();
        if (!active || !Array.isArray(data) || data.length === 0) return;

        const version = Date.now();
        setPromoSlides(data.map((banner) => ({
          ...banner,
          image: `${banner.image}${banner.image.includes("?") ? "&" : "?"}v=${version}`,
        })));
        setActiveSlide(0);
      } catch (error) {
        console.error("Error al cargar banners:", error);
      }
    }

    loadBanners();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeSlide >= promoSlides.length) setActiveSlide(0);
  }, [activeSlide, promoSlides.length]);

  useEffect(() => {
    let active = true;

    async function loadCatalogHighlights() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/catalog/products`);
        const data = await response.json();
        if (!active || !Array.isArray(data)) return;

        const products = data
          .map((product: CatalogProduct) => ({
            ...product,
            model: product.model || product.clave || "",
          }));

        const rows = Object.fromEntries(
          productRows.map((row) => {
            const matches = products
              .filter((product: CatalogProduct) => {
                const text = `${product.name} ${product.brand} ${product.category} ${product.model} ${product.sku}`.toLowerCase();
                return row.matches.some((term) => text.includes(term));
              })
              .sort((a: CatalogProduct, b: CatalogProduct) => {
                const aScore = Number(a.stock > 0) * 100 + Math.min(Math.max(a.stock, 0), 50) + Number(a.price > 0) * 10;
                const bScore = Number(b.stock > 0) * 100 + Math.min(Math.max(b.stock, 0), 50) + Number(b.price > 0) * 10;
                return bScore - aScore;
              })
              .slice(0, 8);

            return [row.key, matches];
          }),
        );

        setCatalogRows(rows);
      } catch {
        setCatalogRows({});
      } finally {
        if (active) setCatalogLoading(false);
      }
    }

    loadCatalogHighlights();
    return () => {
      active = false;
    };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragStartX.current = event.clientX;
    dragDeltaX.current = 0;
    didSwipe.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStartX.current === null) {
      return;
    }

    dragDeltaX.current = event.clientX - dragStartX.current;

    if (dragDeltaX.current > 40) {
      didSwipe.current = true;
      dragStartX.current = null;
      dragDeltaX.current = 0;
      goToPrevious();
    }

    if (dragDeltaX.current < -40) {
      didSwipe.current = true;
      dragStartX.current = null;
      dragDeltaX.current = 0;
      goToNext();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    dragStartX.current = null;
    dragDeltaX.current = 0;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleBannerClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }

    window.location.href = "/catalogo";
  };

  return (
    <main className="home-page min-h-screen bg-white text-black dark:bg-[#080d19] dark:text-white">
      <SiteHeader active="home" />

      <section className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow-soft">
            <div className="relative select-none overflow-hidden bg-white">
              <div className="relative w-full min-h-[280px] md:min-h-[320px] lg:min-h-[360px]" style={{ aspectRatio: "1774/484" }}>
                <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-500">
                  <Image
                    className="h-full w-full object-contain"
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="100vw"
                    draggable={false}
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.src = "/images/dahua-ptz-3d-flyer.png";
                    }}
                  />
                </div>
              </div>

              <button type="button" className="absolute inset-0 z-10 cursor-grab touch-pan-y active:cursor-grabbing" onClick={handleBannerClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} aria-label={`${slide.title}. Presiona para ver productos o desliza para cambiar promocion.`} />

              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1.5 shadow-soft backdrop-blur md:bottom-5 md:right-5 md:gap-2 md:px-3 md:py-2">
                {promoSlides.map((item, index) => (
                  <button key={item.title} className={`h-2 rounded-full transition-all ${activeSlide === index ? "w-8 bg-blue-700" : "w-2 bg-slate-400"}`} onClick={() => setActiveSlide(index)} aria-label={`Ver promocion ${index + 1}`} />
                ))}
                <button className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink" onClick={goToPrevious} aria-label="Promocion anterior">
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink" onClick={goToNext} aria-label="Siguiente promocion">
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandCarousel />

      <section id="eventos" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam Academy</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">Cursos y capacitaciones</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-blue-100/65">
              Agenda tecnica para instaladores, integradores y equipos de venta.
            </p>
          </div>
          <a
            href="/catalogo?buscar=ptz"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
          >
            Ver productos PTZ
          </a>
        </div>

        <AntiGravityPtz />
      </section>

      <TikTokVideos />

      <section className="border-y border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-[#0b1020]">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-5 lg:px-8">
          {quickCategories.map((category) => (
            <a key={category} className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-black text-gray-700 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-100 dark:hover:border-blue-400/60" href="/catalogo">
              <ShieldCheck className="h-4 w-4 text-coral" aria-hidden />
              {category}
            </a>
          ))}
        </div>
      </section>

      <section id="para-ti" className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-9">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-coral">Home / Para ti</p>
            <h2 className="mt-2 text-2xl font-black md:text-4xl">Productos Dahua del catalogo</h2>
            <p className="mt-2 text-gray-600 dark:text-blue-100/65">Seleccionados desde tu inventario para instaladores, negocios y proyectos de seguridad.</p>
          </div>
          <a className="flex h-11 items-center gap-2 rounded-lg border border-blue-300 px-4 font-black text-blue-600 dark:border-blue-400/40 dark:text-blue-100" href="/catalogo">
            Ver catalogo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {catalogHighlights.map((product, index) => (
            <article key={`${product.sku}-${product.model}`} className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-[#121827]">
              <div className="relative flex h-56 items-center justify-center bg-white p-5">
                {product.image ? (
                  <div className="relative h-44 w-full overflow-hidden rounded-xl bg-slate-50">
                    <Image
                      className="object-cover"
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm font-black uppercase tracking-widest text-gray-400">Sin imagen</div>
                )}
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded bg-blue-700 px-3 py-1 text-xs font-black uppercase">
                  <Star className="h-3.5 w-3.5 fill-white" aria-hidden />
                  Top {index + 1}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase text-green-600 dark:text-green-300">{product.brand || "Dahua"}</p>
                  <span className="rounded bg-coral px-2 py-1 text-xs font-black">{product.stock > 0 ? "Disponible" : "Por confirmar"}</span>
                </div>
                <h3 className="mt-3 min-h-20 text-lg font-black leading-tight text-gray-800 dark:text-blue-100">{product.name}</h3>
                <p className="mt-3 text-sm text-gray-500 dark:text-blue-100/60">{product.category || "Catalogo Worldcam"}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/70">
                  Modelo <strong>{product.model || "Sin modelo"}</strong>
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/70">
                  SKU <strong>{product.sku}</strong>
                </p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-xl font-black text-mint">{money(product.price)}</p>
                  <p className="text-xs font-bold text-gray-500 dark:text-blue-100/55">Stock: {product.stock}</p>
                </div>
                <a
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 text-sm font-black uppercase text-white"
                  href={`/catalogo?buscar=${encodeURIComponent(product.model || product.sku || product.name)}`}
                >
                  Ver producto
                  <PackageSearch className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </article>
          ))}
          {catalogHighlights.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-semibold text-gray-600 dark:border-white/10 dark:bg-[#121827] dark:text-blue-100/65 md:col-span-2 xl:col-span-4">
              {catalogLoading ? "Cargando productos destacados del catalogo..." : "No hay productos destacados por el momento."}
            </div>
          ) : null}
        </div>
      </section>

      <section id="nuevos" className="scroll-mt-40 border-t border-gray-200 bg-slate-50 dark:border-white/10 dark:bg-[#080d19]">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-coral">Nuevos en Worldcam</p>
              <h2 className="mt-2 text-3xl font-black text-gray-900 dark:text-white">Categorias destacadas</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-blue-100/65">
                Accesos rapidos para encontrar productos nuevos, camaras, redes y control de acceso.
              </p>
            </div>
            <a className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-600" href="/catalogo">
              Ver catalogo completo
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <Camera className="h-8 w-8 text-coral" aria-hidden />
              <h3 className="mt-4 text-xl font-black text-gray-900 dark:text-white">CCTV Dahua</h3>
              <p className="mt-2 text-gray-600 dark:text-blue-100/65">Camaras IP, HDCVI, PTZ, NVR, DVR y accesorios.</p>
            </article>
            <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <Wifi className="h-8 w-8 text-blue-500 dark:text-blue-300" aria-hidden />
              <h3 className="mt-4 text-xl font-black text-gray-900 dark:text-white">Redes para camaras</h3>
              <p className="mt-2 text-gray-600 dark:text-blue-100/65">Switches PoE, cableado UTP, routers y conectividad.</p>
            </article>
            <article className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <LockKeyhole className="h-8 w-8 text-coral" aria-hidden />
              <h3 className="mt-4 text-xl font-black text-gray-900 dark:text-white">Acceso y alarmas</h3>
              <p className="mt-2 text-gray-600 dark:text-blue-100/65">Cerraduras, sirenas, fuentes y control de acceso.</p>
            </article>
          </div>
        </div>
      </section>

      <SupportAdvisors />
      <SiteFooter />
      <a className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-soft" href="tel:2216531107" aria-label="Llamar a Worldcam">
        <Phone className="h-6 w-6" aria-hidden />
      </a>
    </main>
  );
}