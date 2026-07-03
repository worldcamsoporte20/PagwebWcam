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
  Sparkles,
  Star,
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

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default function Homeicon() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [catalogHighlights, setCatalogHighlights] = useState<CatalogProduct[]>([]);
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
          }))
          .filter((product: CatalogProduct) => {
            const text = `${product.name} ${product.brand} ${product.category} ${product.model} ${product.sku}`.toLowerCase();
            return text.includes("dahua") || text.includes("dh-") || text.includes("dhi-");
          })
          .sort((a: CatalogProduct, b: CatalogProduct) => {
            const aScore = Number(Boolean(a.image)) * 20 + Number(a.stock > 0) * 10 + Math.min(a.stock, 20);
            const bScore = Number(Boolean(b.image)) * 20 + Number(b.stock > 0) * 10 + Math.min(b.stock, 20);
            return bScore - aScore;
          })
          .slice(0, 4);

        setCatalogHighlights(products);
      } catch {
        setCatalogHighlights([]);
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
              Cargando productos destacados del catalogo...
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
