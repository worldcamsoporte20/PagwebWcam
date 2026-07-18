"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const brands = [
  { name: "Dahua", logo: "/images/marcas/dahua.png" },
  { name: "IMOU", logo: "/images/marcas/IMOU.png" },
  { name: "Tiandy", logo: "/images/marcas/TIANDY.png" },
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
  const trackRef = useRef<HTMLUListElement | null>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const [maxIndex, setMaxIndex] = useState(brands.length - 1);
  const [slideOffset, setSlideOffset] = useState(0);

  const moveToIndex = useCallback((index: number, max = maxIndex) => {
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-brand-card]");
    if (!track || !firstCard) return;

    const nextIndex = Math.min(Math.max(index, 0), max);
    const cardWidth = firstCard.getBoundingClientRect().width;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "10");

    indexRef.current = nextIndex;
    setSlideOffset(nextIndex * (cardWidth + gap));
  }, [maxIndex]);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstCard = track?.querySelector<HTMLElement>("[data-brand-card]");
    if (!viewport || !track || !firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || "10");
    const visible = Math.max(1, Math.floor((viewport.clientWidth + gap) / (cardWidth + gap)));
    const nextMax = Math.max(0, brands.length - visible);

    setMaxIndex(nextMax);
    moveToIndex(Math.min(indexRef.current, nextMax), nextMax);
  }, [moveToIndex]);

  useEffect(() => {
    measure();
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (maxIndex === 0) return;
    const timer = window.setInterval(() => {
      if (!pausedRef.current) moveToIndex((indexRef.current + 1) % (maxIndex + 1));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [maxIndex, moveToIndex]);

  const previous = () => moveToIndex(indexRef.current === 0 ? maxIndex : indexRef.current - 1);
  const next = () => moveToIndex((indexRef.current + 1) % (maxIndex + 1));

  return (
    <section className="bg-[#f7f9fc] px-3 pb-6 pt-1 dark:bg-[#080d19] sm:px-6 lg:px-8" aria-labelledby="marcas-destacadas-titulo">
      <div className="mx-auto max-w-7xl">
        <header className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-600 dark:text-blue-300">Distribuidores autorizados</p>
            <h2 id="marcas-destacadas-titulo" className="mt-1 text-lg font-black text-[#071b50] dark:text-white sm:text-xl">Marcas destacadas</h2>
          </div>
          <a href="/catalogo" className="hidden items-center gap-1 text-xs font-extrabold text-blue-700 hover:text-blue-500 dark:text-blue-200 sm:inline-flex">Ver todas las marcas <ChevronRight className="h-3.5 w-3.5" /></a>
        </header>

        <div
          className="relative"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
          onFocusCapture={() => { pausedRef.current = true; }}
          onBlurCapture={() => { pausedRef.current = false; }}
        >
          <button type="button" onClick={previous} className="absolute -left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-blue-300 hover:text-blue-700 dark:border-white/15 dark:bg-[#101727] dark:text-white sm:-left-4" aria-label="Ver marcas anteriores"><ChevronLeft className="h-4 w-4" /></button>

          <div ref={viewportRef} className="overflow-hidden px-1" role="region" aria-label="Carrusel de marcas líderes">
            <ul ref={trackRef} className="flex gap-2.5 transition-transform duration-500 ease-out" style={{ transform: `translateX(-${slideOffset}px)` }} role="list">
              {brands.map((brand, index) => (
                <li key={brand.name} data-brand-card className="group flex h-[72px] w-[128px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-white/10 dark:bg-[#101727] sm:h-[78px] sm:w-[142px]">
                  <Image src={brand.logo} alt={`Logotipo de ${brand.name}, marca distribuida por WorldCam México`} width={120} height={54} sizes="142px" className="max-h-11 w-auto max-w-full object-contain" priority={index < 7} />
                  <span className="sr-only">{brand.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <button type="button" onClick={next} className="absolute -right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:border-blue-300 hover:text-blue-700 dark:border-white/15 dark:bg-[#101727] dark:text-white sm:-right-4" aria-label="Ver más marcas"><ChevronRight className="h-4 w-4" /></button>
        </div>

        <a href="/catalogo" className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-blue-700 dark:text-blue-200 sm:hidden">Ver todas las marcas <ChevronRight className="h-3.5 w-3.5" /></a>
      </div>
    </section>
  );
}
