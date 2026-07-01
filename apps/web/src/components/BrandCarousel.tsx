"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const brands = [
  { name: "Dahua", logo: "/images/marcas/dahua.png" },
  { name: "IMOU", logo: "/images/marcas/IMOU.png" },
  { name: "TIANDY", logo: "/images/marcas/TIANDY.png" },
  { name: "EZVIZ", logo: "/images/marcas/ezviz.png" },
  { name: "AccessPRO", logo: "/images/marcas/accesspro.png" },
  { name: "EPCOM", logo: "/images/marcas/epcom.png" },
  { name: "Steren", logo: "/images/marcas/steren.png" },
  { name: "Manhattan", logo: "/images/marcas/manhattan.png" },
  { name: "Saxxon", logo: "/images/marcas/saxxon.png" },
  { name: "ADATA", logo: "/images/marcas/adata.png" },
  { name: "Western Digital", logo: "/images/marcas/wester digital.png" },
  { name: "3M", logo: "/images/marcas/3M.png" },
  { name: "QOP", logo: "/images/marcas/qop.png" },
  { name: "X-Case", logo: "/images/marcas/xcase.png" },
];

export default function BrandCarousel() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(brands.length - 1);
  const [slideOffset, setSlideOffset] = useState(0);

  const moveToIndex = useCallback((index: number, max = maxIndex) => {
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-brand-card]");
    if (!track || !firstCard) return;

    const nextIndex = Math.min(Math.max(index, 0), max);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "16");

    indexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    setSlideOffset(nextIndex * (cardWidth + gap));
  }, [maxIndex]);

  const measureCarousel = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-brand-card]");
    if (!viewport || !track || !firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "16");
    const visibleCards = Math.max(1, Math.floor((viewport.clientWidth + gap) / (cardWidth + gap)));
    const nextMaxIndex = Math.max(0, brands.length - visibleCards);

    setMaxIndex(nextMaxIndex);
    moveToIndex(Math.min(indexRef.current, nextMaxIndex), nextMaxIndex);
  }, [moveToIndex]);

  useEffect(() => {
    measureCarousel();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const resizeObserver = new ResizeObserver(measureCarousel);
    resizeObserver.observe(viewport);
    window.addEventListener("resize", measureCarousel);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureCarousel);
    };
  }, [measureCarousel]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (pausedRef.current) return;
      moveToIndex((indexRef.current + 1) % (maxIndex + 1));
    }, 3200);

    return () => window.clearInterval(interval);
  }, [maxIndex, moveToIndex]);

  const prev = () => moveToIndex(indexRef.current === 0 ? maxIndex : indexRef.current - 1);
  const next = () => moveToIndex((indexRef.current + 1) % (maxIndex + 1));

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-soft sm:px-6">
        <div className="max-w-3xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-coral">Marcas destacadas</p>
            <h2 className="mt-1 text-3xl font-black text-gray-900">Nuestras marcas l&iacute;deres</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Descubre los principales fabricantes que distribuimos para soluciones de seguridad y redes.
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onFocus={() => (pausedRef.current = true)}
        onBlur={() => (pausedRef.current = false)}
      >
        <div ref={viewportRef} className="overflow-hidden px-1 pb-3">
          <div
            ref={trackRef}
            className="flex gap-4 transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${slideOffset}px)` }}
          >
            {brands.map((brand, index) => (
              <div
                key={brand.name}
                data-brand-card
                className="group w-[210px] flex-shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft sm:w-[240px]"
              >
                <div className="mx-auto mb-3 flex h-28 w-full items-center justify-center rounded-lg border border-gray-100 bg-gray-50 px-5 py-4 transition group-hover:bg-white">
                  <Image
                    src={brand.logo}
                    alt={`Logo de ${brand.name}`}
                    width={180}
                    height={96}
                    sizes="180px"
                    className="max-h-20 w-auto object-contain"
                    priority={index < 4}
                  />
                </div>
                <h3 className="min-h-7 text-base font-black text-slate-900">{brand.name}</h3>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-slate-800 shadow-soft backdrop-blur transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-slate-800 shadow-soft backdrop-blur transition hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <span
            key={`brand-indicator-${index}`}
            className={`h-1.5 rounded-full transition-all ${activeIndex === index ? "w-8 bg-coral" : "w-1.5 bg-gray-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
