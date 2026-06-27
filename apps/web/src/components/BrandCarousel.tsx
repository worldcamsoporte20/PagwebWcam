"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const brands = [
  { name: "Dahua", logo: "/images/brands/dahua.svg" },
  { name: "Imou", logo: "/images/brands/imou.svg" },
  { name: "Hikvision", logo: "/images/brands/hikvision.svg" },
  { name: "Steren", logo: "/images/brands/steren.svg" },
  { name: "Tyandy", logo: "/images/brands/tyandy.svg" },
  { name: "Manhattan", logo: "/images/brands/manhattan.svg" },
  { name: "Ezviz", logo: "/images/brands/ezviz.svg" },
];

export default function BrandCarousel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const cardWidth = container.firstElementChild?.clientWidth ?? 280;
      indexRef.current = (indexRef.current + 1) % brands.length;
      const scrollLeft = indexRef.current * (cardWidth + 16);
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-coral">Marcas Destacadas</p>
            <h2 className="mt-2 text-3xl font-black text-gray-900">Nuestras marcas líderes</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Descubre los principales fabricantes que distribuimos para soluciones de seguridad y redes.
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-500">Carrusel automático</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 scrollbar-none"
      >
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="snap-start min-w-[220px] flex-shrink-0 rounded-3xl border border-gray-200 bg-white px-5 py-6 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-3xl bg-slate-950 p-3">
              <Image src={brand.logo} alt={`${brand.name} logo`} width={96} height={96} className="object-contain" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Marca</p>
            <h3 className="mt-3 text-lg font-black text-slate-900">{brand.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
