"use client";

import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Home as HomeIcon,

  LayoutGrid,
  LockKeyhole,
  MapPin,
  PackageSearch,
  Phone,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { PointerEvent, useEffect, useRef, useState } from "react";
import Script from "next/script";
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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const promoSlides = [
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

const courses = [
  {
    date: "22 mayo",
    title: "Certificacion Dahua WizSense",
    type: "Curso online",
    time: "10:00 AM",
    place: "Worldcam Academy",
  },
  {
    date: "28 mayo",
    title: "Diseno de proyectos CCTV IP",
    type: "Taller practico",
    time: "4:00 PM",
    place: "Puebla",
  },
  {
    date: "04 junio",
    title: "Configuracion de NVR y analiticos IA",
    type: "Demo tecnica",
    time: "12:00 PM",
    place: "En vivo",
  },
  {
    date: "11 junio",
    title: "Redes PoE para videovigilancia",
    type: "Integradores",
    time: "5:00 PM",
    place: "Online",
  },
];

const navItems = [
  { label: "Inicio", href: "/", icon: HomeIcon, key: "home" },
  { label: "Productos", href: "/catalogo", icon: LayoutGrid, key: "catalogo" },
  { label: "Nuevos", href: "/#nuevos", icon: Flame, key: "nuevos" },
  { label: "Para ti", href: "/#para-ti", icon: Sparkles, key: "para-ti" },
  { label: "Cursos", href: "/#eventos", icon: GraduationCap, key: "cursos" },
  { label: "Promociones", href: "/promociones", icon: Tag, key: "promociones" },
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
  const [catalogRows, setCatalogRows] = useState<Record<string, CatalogProduct[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const didSwipe = useRef(false);

  const slide = promoSlides[activeSlide];

  const goToPrevious = () => {
    setActiveSlide((current) => (current === 0 ? promoSlides.length - 1 : current - 1));
  };

  const goToNext = () => {
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
    const timer = window.setInterval(goToNext, 7000);
    return () => window.clearInterval(timer);
  }, []);

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

              <button
                type="button"
                className="absolute inset-0 z-10 cursor-grab touch-pan-y active:cursor-grabbing"
                onClick={handleBannerClick}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                aria-label={`${slide.title}. Presiona para ver productos o desliza para cambiar promocion.`}
              />

              <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1.5 shadow-soft backdrop-blur md:bottom-5 md:right-5 md:gap-2 md:px-3 md:py-2">
                {promoSlides.map((item, index) => (
                  <button
                    key={item.title}
                    className={`h-2 rounded-full transition-all ${activeSlide === index ? "w-8 bg-blue-700" : "w-2 bg-slate-400"}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Ver promocion ${index + 1}`}
                  />
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

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-3 sm:px-4 lg:px-8 lg:pb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[#1E49A2] bg-[#FCFCFD] px-3 text-sm font-black text-[#12141A] transition hover:bg-[#CBC9D4]/50 sm:h-11 sm:px-4"
              href={item.href}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </a>
          );
        })}
      </nav>

      <section id="para-ti" className="scroll-mt-40 border-y border-slate-200 bg-slate-50/80 py-8 dark:border-white/10 dark:bg-[#0b1020] lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-coral">Lo mejor de Worldcam</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">Encuentra lo mas vendido por categoria</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-blue-100/65 md:text-base">
                Productos seleccionados del inventario actual, organizados para que encuentres rapido lo que necesita cada proyecto.
              </p>
            </div>
            <a className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-600" href="/catalogo">
              Ver catalogo completo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div className="mt-8 space-y-10">
            {productRows.map((row) => {
              const Icon = row.icon;
              const products = catalogRows[row.key] ?? [];

              return (
                <div key={row.key}>
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">{row.eyebrow}</p>
                        <h3 className="mt-0.5 text-xl font-black text-slate-950 dark:text-white md:text-2xl">{row.title}</h3>
                        <p className="mt-1 hidden text-sm text-slate-500 dark:text-blue-100/55 sm:block">{row.description}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-white/15 dark:bg-white/[0.05] dark:text-white dark:hover:bg-blue-500/15 sm:flex"
                        onClick={() => moveProductCarousel(row.key, -1)}
                        aria-label={`Ver productos anteriores de ${row.title}`}
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-white/15 dark:bg-white/[0.05] dark:text-white dark:hover:bg-blue-500/15 sm:flex"
                        onClick={() => moveProductCarousel(row.key, 1)}
                        aria-label={`Ver mas productos de ${row.title}`}
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </button>
                      <a className="ml-1 hidden shrink-0 items-center gap-1 text-sm font-black text-blue-700 hover:text-blue-500 dark:text-blue-200 md:flex" href={`/catalogo?buscar=${encodeURIComponent(row.search)}`}>
                        Ver todos
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </a>
                    </div>
                  </div>

                  <div
                    ref={(element) => { carouselRefs.current[row.key] = element; }}
                    className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {products.map((product, index) => (
                      <article key={`${row.key}-${product.id ?? product.sku}`} className="group flex w-[290px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-white/10 dark:bg-[#121827] dark:hover:border-blue-400/50 sm:w-[330px] lg:w-[350px]">
                        <a href={product.id ? `/catalogo/${product.id}` : `/catalogo?buscar=${encodeURIComponent(product.sku)}`} className="block">
                          <div className="relative flex h-60 items-center justify-center bg-gradient-to-b from-white to-slate-50 p-6 sm:h-64">
                            {product.image ? (
                              <div className="relative h-full w-full">
                                <PackageSearch className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-slate-200" aria-hidden />
                                <Image
                                  className="z-10 object-contain transition duration-300 group-hover:scale-105"
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="350px"
                                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                                />
                              </div>
                            ) : (
                              <PackageSearch className="h-20 w-20 text-slate-300" aria-hidden />
                            )}
                            {index < 3 ? (
                              <span className="absolute left-4 top-4 rounded-full bg-coral px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">Top {index + 1}</span>
                            ) : null}
                          </div>
                          <div className="border-t border-slate-100 px-5 pb-3 pt-5 dark:border-white/10">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">{product.brand || "Worldcam"}</span>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${product.stock > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"}`}>
                                {product.stock > 0 ? "Disponible" : "Consultar"}
                              </span>
                            </div>
                            <h4 className="mt-3 line-clamp-2 min-h-12 text-base font-black leading-6 text-slate-900 dark:text-white">{product.name}</h4>
                            <p className="mt-2 truncate text-sm font-semibold text-slate-400">Modelo: {product.model || product.sku}</p>
                            <div className="mt-4 flex items-end justify-between gap-3">
                              <p className="text-2xl font-black text-slate-950 dark:text-white">{product.price > 0 ? money(product.price) : "Cotizar"}</p>
                              <span className="text-xs font-bold text-slate-400">Stock {product.stock}</span>
                            </div>
                          </div>
                        </a>
                        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 px-5 pb-5">
                          <button
                            type="button"
                            className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition ${lastAddedId === productKey(product) ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"}`}
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-5 w-5" aria-hidden />
                            {lastAddedId === productKey(product) ? "Agregado" : "Agregar al carrito"}
                          </button>
                          <a
                            href={product.id ? `/catalogo/${product.id}` : `/catalogo?buscar=${encodeURIComponent(product.sku)}`}
                            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white"
                            aria-label={`Ver detalle de ${product.name}`}
                          >
                            <ArrowRight className="h-5 w-5" aria-hidden />
                          </a>
                        </div>
                      </article>
                    ))}

                    {catalogLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={`${row.key}-loading-${index}`} className="h-[470px] w-[290px] shrink-0 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] sm:w-[330px] lg:w-[350px]" />
                      ))
                    ) : null}

                    {!catalogLoading && products.length === 0 ? (
                      <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm font-semibold text-slate-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-blue-100/60">
                        No encontramos productos para esta categoria por el momento.
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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

        <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <AntiGravityPtz />

          <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
          {/* Header */}
          <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-5 dark:border-white/10 dark:from-blue-900/40 dark:to-[#0d1526]">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <GraduationCap className="h-24 w-24 text-blue-400 dark:text-blue-300" aria-hidden />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Worldcam Academy</p>
            <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">Agenda Técnica</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-blue-200/60">Capacitación profesional para instaladores e integradores</p>
          </div>

          {/* Course list */}
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {courses.map((course, index) => {
              const typeColors: Record<string, string> = {
                "Curso online": "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
                "Taller practico": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
                "Demo tecnica": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
                "Integradores": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
              };
              const badgeClass = typeColors[course.type] ?? "bg-red-50 text-red-600 border-red-200 dark:bg-coral/20 dark:text-red-300 dark:border-coral/30";
              return (
                <article key={course.title} className="group flex gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  {/* Date block */}
                  <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 py-2 text-center dark:border-blue-400/20 dark:bg-blue-900/20">
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {course.date.split(" ")[1]}
                    </p>
                    <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">
                      {course.date.split(" ")[0]}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase ${badgeClass}`}>
                        {course.type}
                      </span>
                      {index === 0 && (
                        <span className="flex items-center gap-1 rounded-md border border-coral/30 bg-coral/10 px-2 py-0.5 text-[10px] font-black uppercase text-coral">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
                          Próximo
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-black leading-snug text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-200">
                      {course.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-blue-100/55">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        {course.time}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-blue-100/55">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {course.place}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex shrink-0 items-center">
                    <ArrowRight className="h-4 w-4 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-coral dark:text-white/20" aria-hidden />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="border-t border-gray-100 px-5 py-4 dark:border-white/10">
            <a
              href="#eventos"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 text-sm font-black text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              Ver todos los cursos
            </a>
          </div>
          </aside>
        </div>
      </section>
      <BrandCarousel />
      <TikTokVideos />

      <section className="border-y border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-[#0b1020]">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-5 lg:px-8">
          {quickCategories.map((category) => (
            <a
              key={category}
              className="flex h-12 shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-black text-gray-700 hover:border-blue-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-100 dark:hover:border-blue-400/60"
              href="/catalogo"
            >
              <ShieldCheck className="h-4 w-4 text-coral" aria-hidden />
              {category}
            </a>
          ))}
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
            <a
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-600"
              href="/catalogo"
            >
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
      <SiteFooter/>
      <a
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-soft"
        href="tel:2216531107"
        aria-label="Llamar a Worldcam"
      >
        <Phone className="h-6 w-6" aria-hidden />
      </a>
    </main>
  );
}
