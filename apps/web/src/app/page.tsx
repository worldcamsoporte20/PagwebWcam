"use client";

import {
  ArrowRight,
  BadgePercent,
  Binoculars,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  GraduationCap,
  Headphones,
  Heart,
  MapPin,
  Monitor,
  PackageSearch,
  Phone,
  PlugZap,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { Fragment, PointerEvent, useEffect, useRef, useState } from "react";
import Script from "next/script";
import AntiGravityPtz from "../components/AntiGravityPtz";
import BrandCarousel from "../components/BrandCarousel";
import SiteHeader from "../components/SiteHeader";
import TikTokVideos from "@/components/TikTokVideos";
import SiteFooter from "@/components/SiteFooter";
import SupportAdvisors from "@/components/SupportAdvisors";
import { addCartItem } from "../lib/cart";
import { readFavoriteIds, syncFavoriteProducts, toggleFavoriteProduct } from "../lib/favorites";

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

const featuredBanner: Banner = {
  title: "Tecnología que protege lo que más importa",
  image: "/images/banner/baner1.png",
};

const defaultPromoSlides: Banner[] = [featuredBanner];

const serviceBenefits = [
  {
    title: "Envíos a todo México",
    description: "Rápidos y seguros",
    icon: Truck,
  },
  {
    title: "Distribuidores oficiales",
    description: "Marcas líderes en seguridad",
    icon: ShieldCheck,
  },
  {
    title: "Asesoría especializada",
    description: "Soporte antes y después de tu compra",
    icon: Headphones,
  },
  {
    title: "Pagos seguros",
    description: "Múltiples métodos de pago",
    icon: CreditCard,
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

const productRows = [
  {
    key: "cameras",
    label: "Cámaras",
    eyebrow: "Videovigilancia",
    title: "Camaras mas vendidas",
    description: "Camaras IP, HDCVI, domos, bullets y PTZ listas para tus instalaciones.",
    search: "camara",
    icon: Camera,
    matches: ["camara", "camera", "ipc", "bullet", "domo", "dome", "turret", "ptz"],
  },
  {
    key: "kits",
    label: "Kits de videovigilancia",
    eyebrow: "Soluciones completas",
    title: "Kits recomendados",
    description: "Combos de videovigilancia para instalar con todos los componentes esenciales.",
    search: "kit",
    icon: PackageSearch,
    matches: ["kit", "combo", "paquete"],
  },
  {
    key: "networks",
    label: "Redes",
    eyebrow: "Conectividad",
    title: "Redes y conectividad",
    description: "Switches PoE, routers, cableado y accesorios para una red estable.",
    search: "redes",
    icon: Wifi,
    matches: ["switch", "poe", "router", "access point", "utp", "ethernet", "redes", "network"],
  },
  {
    key: "computing",
    label: "Computación",
    eyebrow: "Tecnología",
    title: "Computación y almacenamiento",
    description: "Equipos, almacenamiento y accesorios para tu operación diaria.",
    search: "computacion",
    icon: Monitor,
    matches: ["computadora", "computacion", "laptop", "monitor", "disco duro", "hard drive", "ssd", "memoria", "teclado", "mouse", "ups"],
  },
] as const;

const cameraPromotions = [
  {
    discount: "10% OFF",
    title: "Binoculares BAK4 Dahua",
    detail: "Visión nítida 20×50",
    search: "binoculares",
    icon: Binoculars,
  },
  {
    discount: "15% OFF",
    title: "Kit cableado de videovigilancia",
    detail: "Video balun 4K",
    search: "kit videovigilancia",
    icon: Camera,
  },
  {
    discount: "5% OFF",
    title: "Kit de fuente de poder",
    detail: "12 V para CCTV",
    search: "fuente de poder",
    icon: PlugZap,
  },
] as const;

function CameraPromotionsStrip() {
  return (
    <aside
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,42,91,.06)] dark:border-white/10 dark:bg-[#101727]"
      aria-label="Promociones para cámaras"
    >
      <div className="flex min-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a
          href="/promociones"
          className="flex min-h-[104px] min-w-[210px] items-center gap-3 bg-[#e71934] px-5 text-white transition hover:bg-[#cb1029] lg:min-w-[230px]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
            <BadgePercent className="h-6 w-6" aria-hidden />
          </span>
          <span>
            <strong className="block text-sm font-black leading-tight">Promociones</strong>
            <span className="mt-1 block text-[11px] font-semibold leading-tight text-white/85">por tiempo limitado</span>
          </span>
        </a>

        {cameraPromotions.map((promotion) => {
          const Icon = promotion.icon;
          return (
            <a
              key={promotion.title}
              href={`/catalogo?buscar=${encodeURIComponent(promotion.search)}`}
              className="group flex min-h-[104px] min-w-[265px] flex-1 items-center gap-4 border-r border-slate-200 px-5 transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
            >
              <span className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:text-blue-700 dark:bg-white/[0.05] dark:text-blue-200">
                <Icon className="h-10 w-10" strokeWidth={1.45} aria-hidden />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm font-black text-[#e71934]">{promotion.discount}</strong>
                <span className="mt-1 block text-xs font-extrabold leading-tight text-slate-900 dark:text-white">{promotion.title}</span>
                <span className="mt-1 block text-[10px] font-semibold text-slate-500 dark:text-blue-100/55">{promotion.detail}</span>
              </span>
            </a>
          );
        })}

        <a
          href="/promociones"
          className="flex min-h-[104px] min-w-[200px] items-center justify-center px-5"
        >
          <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e71934]/30 px-4 text-xs font-black text-[#e71934] transition hover:border-[#e71934] hover:bg-red-50 dark:hover:bg-red-500/10">
            Ver todas las promociones
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </a>
      </div>
    </aside>
  );
}

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function productKey(product: CatalogProduct) {
  return String(product.variantId ?? product.id ?? product.sku);
}

export default function Homeicon() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [promoSlides] = useState<Banner[]>(defaultPromoSlides);
  const [catalogRows, setCatalogRows] = useState<Record<string, CatalogProduct[]>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeProductRow, setActiveProductRow] = useState<(typeof productRows)[number]["key"]>("cameras");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pausedCarousels = useRef<Record<string, boolean>>({});
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const didSwipe = useRef(false);

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
    const carousel = carouselRefs.current[rowKey];
    if (!carousel) return;

    const firstCard = carousel.firstElementChild as HTMLElement | null;
    const step = (firstCard?.offsetWidth ?? 280) + 16;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    const reachedEnd = carousel.scrollLeft >= maxScroll - step / 2;
    const reachedStart = carousel.scrollLeft <= step / 2;

    if (direction === 1 && reachedEnd) {
      carousel.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (direction === -1 && reachedStart) {
      carousel.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }

    carousel.scrollBy({ left: direction * step, behavior: "smooth" });
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

  const toggleFavorite = (product: CatalogProduct) => {
    const result = toggleFavoriteProduct(product);
    setFavoriteIds(new Set(result.ids));
  };

  useEffect(() => {
    setFavoriteIds(new Set(readFavoriteIds()));
  }, []);

  useEffect(() => {
    syncFavoriteProducts(Object.values(catalogRows).flat());
  }, [catalogRows]);

  useEffect(() => {
    if (promoSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current === promoSlides.length - 1 ? 0 : current + 1));
    }, 7000);
    return () => window.clearInterval(timer);
  }, [promoSlides.length]);

  useEffect(() => {
    if (catalogLoading) return;

    const timer = window.setInterval(() => {
      productRows.forEach((row) => {
        if (!pausedCarousels.current[row.key]) {
          moveProductCarousel(row.key, 1);
        }
      });
    }, 4500);

    return () => window.clearInterval(timer);
  }, [catalogLoading]);

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

  const activeProductCategory = productRows.find((row) => row.key === activeProductRow) ?? productRows[0];
  const featuredProducts = catalogRows[activeProductCategory.key] ?? [];

  return (
    <main className="home-page min-h-screen bg-white text-black dark:bg-[#080d19] dark:text-white">
      <SiteHeader active="home" />

      <section className="w-full overflow-hidden bg-white" aria-labelledby="home-hero-title">
        <h1 id="home-hero-title" className="sr-only">Tecnología que protege lo que más importa</h1>
        <div className="w-full">
          <div className="w-full overflow-hidden bg-white">
            <div className="relative select-none overflow-hidden bg-white">
              <div className="relative w-full min-h-[180px] sm:min-h-0" style={{ aspectRatio: "1920/540" }}>
                <div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-500">
                  <Image
                    className="h-full w-full object-cover"
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="100vw"
                    quality={90}
                    priority
                    fetchPriority="high"
                    draggable={false}
                    onError={(event) => {
                      const target = event.target as HTMLImageElement;
                      target.src = "/images/banner/baner1.png";
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
                aria-label={`${slide.title}. Ver catálogo completo.`}
              />

            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1020]" aria-labelledby="beneficios-worldcam">
        <h2 id="beneficios-worldcam" className="sr-only">Beneficios de comprar en WorldCam México</h2>
        <ul className="mx-auto grid max-w-7xl grid-cols-1 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8" role="list">
          {serviceBenefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <li
                key={benefit.title}
                className={`border-slate-200 dark:border-white/10 ${index < 3 ? "border-b lg:border-b-0" : ""} ${index % 2 === 0 ? "sm:border-r lg:border-r" : ""} ${index === 1 ? "lg:border-r" : ""} ${index === 2 ? "sm:border-b-0" : ""}`}
              >
                <article className="flex min-h-[76px] items-center gap-3 px-3 py-3 sm:min-h-[82px] sm:px-5 lg:justify-center lg:px-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f5ff] text-[#0757d8] ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20">
                    <Icon className="h-[19px] w-[19px]" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[12px] font-extrabold leading-tight text-[#071b50] dark:text-white sm:text-[13px]">{benefit.title}</h3>
                    <p className="mt-1 text-[10px] leading-tight text-slate-500 dark:text-blue-100/60 sm:text-[11px]">{benefit.description}</p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-[#f7f9fc] px-3 pb-1 pt-5 dark:bg-[#080d19] sm:px-6 lg:px-8" aria-labelledby="categorias-productos-titulo">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-600 dark:text-blue-300">Compra por categoría</p>
              <h2 id="categorias-productos-titulo" className="mt-1 text-lg font-black text-[#071b50] dark:text-white sm:text-xl">Encuentra lo que necesitas</h2>
            </div>
            <a href="/catalogo" className="hidden items-center gap-1 text-xs font-extrabold text-blue-700 hover:text-blue-500 dark:text-blue-200 sm:inline-flex">Ver todas las categorías <ArrowRight className="h-3.5 w-3.5" /></a>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" role="list">
            {productRows.map((row) => {
              const Icon = row.icon;
              const selected = activeProductRow === row.key;
              return (
                <li key={`category-${row.key}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProductRow(row.key);
                      window.setTimeout(() => document.getElementById(`productos-${row.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                    }}
                    className={`group flex min-h-[92px] w-full items-center gap-3 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:bg-[#101727] sm:min-h-[104px] sm:p-4 ${selected ? "border-blue-500 ring-2 ring-blue-100 dark:border-blue-400 dark:ring-blue-500/15" : "border-slate-200 dark:border-white/10"}`}
                    aria-pressed={selected}
                  >
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition sm:h-12 sm:w-12 ${selected ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700 group-hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300"}`}><Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs font-black leading-tight text-[#071b50] dark:text-white sm:text-sm">{row.label}</strong>
                      <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-slate-500 dark:text-blue-100/55 sm:text-[11px]">{row.description}</span>
                    </span>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-blue-600 sm:block" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {false && (<section id="productos-destacados" className="scroll-mt-32 bg-[#f7f9fc] px-3 py-5 dark:bg-[#080d19] sm:px-6 lg:px-8" aria-labelledby="productos-destacados-titulo">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,42,91,.07)] dark:border-white/10 dark:bg-[#101727]">
          <header className="flex flex-col border-b border-slate-200 px-4 pt-4 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between lg:px-5 lg:pt-0">
            <div className="flex min-w-0 flex-1 flex-col lg:flex-row lg:items-end lg:gap-8">
              <div className="shrink-0 pb-3 lg:py-4">
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-600 dark:text-blue-300">Selección WorldCam</p>
                <h2 id="productos-destacados-titulo" className="mt-1 text-xl font-black text-[#071b50] dark:text-white sm:text-2xl">Productos destacados</h2>
              </div>
              <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Categorías de productos destacados">
                {productRows.map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setActiveProductRow(row.key)}
                    className={`relative h-11 shrink-0 px-3 text-xs font-extrabold transition sm:px-4 ${activeProductRow === row.key ? "text-blue-700 dark:text-blue-300" : "text-slate-500 hover:text-blue-700 dark:text-blue-100/55"}`}
                    aria-pressed={activeProductRow === row.key}
                  >
                    {row.title}
                    {activeProductRow === row.key ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-700 dark:bg-blue-300" /> : null}
                  </button>
                ))}
              </nav>
            </div>
            <div className="hidden items-center gap-2 pb-3 lg:flex">
              <button type="button" onClick={() => moveProductCarousel(activeProductCategory.key, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white" aria-label="Productos anteriores"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => moveProductCarousel(activeProductCategory.key, 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white" aria-label="Más productos"><ChevronRight className="h-4 w-4" /></button>
              <a href="/catalogo" className="ml-2 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 hover:text-blue-500 dark:text-blue-200">Ver catálogo completo <ArrowRight className="h-3.5 w-3.5" /></a>
            </div>
          </header>

          <div
            ref={(element) => { carouselRefs.current[activeProductCategory.key] = element; }}
            onPointerEnter={() => { pausedCarousels.current[activeProductCategory.key] = true; }}
            onPointerLeave={() => { pausedCarousels.current[activeProductCategory.key] = false; }}
            className="grid snap-x snap-mandatory auto-cols-[minmax(220px,82%)] grid-flow-col overflow-x-auto [scrollbar-width:none] sm:auto-cols-[calc((100%_-_1px)/2)] lg:auto-cols-[calc((100%_-_2px)/3)] xl:auto-cols-[calc((100%_-_4px)/5)] [&::-webkit-scrollbar]:hidden"
            aria-label={`Productos destacados: ${activeProductCategory.title}`}
          >
            {featuredProducts.map((product, index) => {
              const favorite = favoriteIds.has(productKey(product));
              const productHref = product.id ? `/catalogo/${product.id}` : `/catalogo?buscar=${encodeURIComponent(product.sku)}`;
              return (
                <article key={`${activeProductCategory.key}-${product.id ?? product.sku}`} className="group relative flex min-h-[420px] snap-start flex-col border-r border-slate-200 bg-white p-3.5 transition hover:z-10 hover:shadow-xl dark:border-white/10 dark:bg-[#101727]">
                  {index < 3 ? <span className="absolute left-3 top-3 z-20 rounded bg-[#ef233c] px-2 py-1 text-[9px] font-black uppercase text-white">Top {index + 1}</span> : null}
                  <a href={productHref} className="block">
                    <div className="relative flex h-44 items-center justify-center bg-white p-3 dark:bg-[#101727] sm:h-48">
                      {product.image ? (
                        <Image src={product.image} alt={`${product.name}${product.model ? ` modelo ${product.model}` : ""}`} fill sizes="(max-width: 640px) 75vw, (max-width: 1280px) 33vw, 240px" className="object-contain transition duration-300 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                      ) : <PackageSearch className="h-20 w-20 text-slate-200" aria-hidden />}
                    </div>
                    <div className="pt-2">
                      <p className="text-[9px] font-black uppercase tracking-[.1em] text-blue-600 dark:text-blue-300">{product.brand || "WorldCam"}</p>
                      <h3 className="mt-1 line-clamp-2 min-h-10 text-[13px] font-bold leading-5 text-slate-800 group-hover:text-blue-700 dark:text-white">{product.name}</h3>
                      <p className="mt-1 truncate text-[10px] font-semibold text-slate-500 dark:text-blue-100/55">Modelo: <span className="text-slate-700 dark:text-blue-100">{product.model || product.clave || product.sku}</span></p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-blue-100/45">SKU: {product.sku || product.clave || "N/D"}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.category ? <span className="max-w-full truncate rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/60">{product.category}</span> : null}
                        {product.stock > 0 ? <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">En existencia</span> : null}
                      </div>
                    </div>
                  </a>
                  <div className="mt-auto pt-3">
                    <p className="text-xl font-black tracking-tight text-[#071b50] dark:text-white">{product.price > 0 ? money(product.price) : "Cotizar"}</p>
                    <p className={`mt-1 text-[10px] font-bold ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>{product.stock > 0 ? "✓ Disponible" : "Disponibilidad por confirmar"}</p>
                    <div className="mt-2 grid grid-cols-[1fr_36px] gap-2">
                      <button type="button" onClick={() => handleAddToCart(product)} className={`flex h-9 items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-extrabold text-white transition ${lastAddedId === productKey(product) ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"}`} aria-label={`Agregar ${product.name} al carrito`}><ShoppingCart className="h-4 w-4" />{lastAddedId === productKey(product) ? "Agregado" : "Agregar al carrito"}</button>
                      <button type="button" onClick={() => toggleFavorite(product)} className={`flex h-9 w-9 items-center justify-center rounded-md border transition ${favorite ? "border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500 dark:border-white/15"}`} aria-label={`${favorite ? "Quitar de" : "Agregar a"} favoritos: ${product.name}`} aria-pressed={favorite}><Heart className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} /></button>
                    </div>
                  </div>
                </article>
              );
            })}
            {catalogLoading ? Array.from({ length: 5 }).map((_, index) => <div key={`featured-loading-${index}`} className="h-[420px] animate-pulse border-r border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/5" />) : null}
            {!catalogLoading && featuredProducts.length === 0 ? <div className="col-span-full flex h-60 items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">No encontramos productos destacados en esta categoría.</div> : null}
          </div>
          <div className="border-t border-slate-200 p-3 text-center dark:border-white/10 lg:hidden"><a href="/catalogo" className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 dark:text-blue-200">Ver catálogo completo <ArrowRight className="h-3.5 w-3.5" /></a></div>
        </div>
      </section>)}

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
                <Fragment key={row.key}>
                <div id={`productos-${row.key}`} className="scroll-mt-32 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,42,91,.06)] dark:border-white/10 dark:bg-[#101727] sm:p-5">
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
                    onPointerEnter={() => { pausedCarousels.current[row.key] = true; }}
                    onPointerLeave={() => { pausedCarousels.current[row.key] = false; }}
                    onFocusCapture={() => { pausedCarousels.current[row.key] = true; }}
                    onBlurCapture={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        pausedCarousels.current[row.key] = false;
                      }
                    }}
                    aria-label={`${row.title}. Carrusel automatico de productos.`}
                    className="grid snap-x snap-mandatory auto-cols-[minmax(260px,82%)] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:auto-cols-[calc((100%_-_1rem)/2)] lg:auto-cols-[calc((100%_-_3rem)/4)] xl:auto-cols-[calc((100%_-_4rem)/5)] [&::-webkit-scrollbar]:hidden"
                  >
                    {products.map((product, index) => (
                      <article key={`${row.key}-${product.id ?? product.sku}`} className="group relative flex w-full snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-white/10 dark:bg-[#121827] dark:hover:border-blue-400/40">
                        <button
                          type="button"
                          className={`absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-md backdrop-blur transition hover:scale-105 ${favoriteIds.has(productKey(product)) ? "border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500"}`}
                          onClick={() => toggleFavorite(product)}
                          aria-label={`${favoriteIds.has(productKey(product)) ? "Quitar de" : "Agregar a"} favoritos: ${product.name}`}
                          aria-pressed={favoriteIds.has(productKey(product))}
                        >
                          <Heart className={`h-5 w-5 ${favoriteIds.has(productKey(product)) ? "fill-current" : ""}`} aria-hidden />
                        </button>
                        <a href={product.id ? `/catalogo/${product.id}` : `/catalogo?buscar=${encodeURIComponent(product.sku)}`} className="block">
                          <div className="relative flex h-52 items-center justify-center bg-white p-5 sm:h-56 dark:bg-[#121827]">
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
                              <span className="absolute left-3 top-3 rounded-md bg-coral px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">Top {index + 1}</span>
                            ) : null}
                          </div>
                          <div className="border-t border-slate-100 px-4 pb-3 pt-4 dark:border-white/10">
                            <p className="inline-flex max-w-full rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                              <span className="truncate">{product.brand || "Worldcam"}</span>
                            </p>
                            <h4 className="mt-2 line-clamp-2 min-h-11 text-sm font-semibold leading-[1.35rem] text-slate-800 transition group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">{product.name}</h4>

                            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-[11px] dark:border-white/10">
                              <p className="truncate text-slate-500 dark:text-blue-100/55">
                                SKU: <span className="select-text font-bold text-slate-700 dark:text-blue-100">{product.sku || product.clave || "Sin SKU"}</span>
                              </p>
                              <p className="truncate text-slate-500 dark:text-blue-100/55">
                                Modelo: <span className="font-semibold text-slate-700 dark:text-blue-100">{product.model || product.clave || product.sku || "N/D"}</span>
                              </p>
                            </div>

                            <p className="mt-4 text-[1.75rem] font-black leading-none tracking-tight text-slate-950 dark:text-white">{product.price > 0 ? money(product.price) : "Cotizar"}</p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className={`text-xs font-bold ${product.stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-300"}`}>
                                {product.stock > 0 ? "Disponible para entrega" : "Disponibilidad por confirmar"}
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold text-slate-400">Stock: {product.stock}</span>
                            </div>
                          </div>
                        </a>
                        <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 px-4 pb-4 pt-1">
                          <button
                            type="button"
                            className={`flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-black text-white transition ${lastAddedId === productKey(product) ? "bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"}`}
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" aria-hidden />
                            {lastAddedId === productKey(product) ? "Agregado" : "Agregar"}
                          </button>
                          <a
                            href={product.id ? `/catalogo/${product.id}` : `/catalogo?buscar=${encodeURIComponent(product.sku)}`}
                            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-white/15 dark:text-white"
                            aria-label={`Ver detalle de ${product.name}`}
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </a>
                        </div>
                      </article>
                    ))}

                    {catalogLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={`${row.key}-loading-${index}`} className="h-[450px] w-[260px] shrink-0 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]" />
                      ))
                    ) : null}

                    {!catalogLoading && products.length === 0 ? (
                      <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm font-semibold text-slate-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-blue-100/60">
                        No encontramos productos para esta categoria por el momento.
                      </div>
                    ) : null}
                  </div>
                </div>
                {row.key === "cameras" ? <CameraPromotionsStrip /> : null}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      <BrandCarousel />

      <section id="flyer-destacado" className="mx-auto max-w-7xl scroll-mt-40 px-4 py-6 lg:px-8 lg:py-8">
        {false && (<div>
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
        </div>)}

        <div>
          <AntiGravityPtz />

          {false && (<aside>
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
          </aside>)}
        </div>
      </section>
      <TikTokVideos />

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
