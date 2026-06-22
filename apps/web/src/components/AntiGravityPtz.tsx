"use client";

import { ArrowRight, Maximize2, Move3D, RadioTower, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";

export default function AntiGravityPtz() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft dark:border-blue-400/20 dark:bg-[#081020]">
      <div className="absolute inset-0 hidden bg-[linear-gradient(135deg,#081020_0%,#0b1730_45%,#060912_100%)] dark:block" />
      <div className="absolute inset-0 hidden tech-grid opacity-10 dark:block" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.18),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(217,93,85,0.14),transparent_40%)] dark:block" />

      <div className="relative">
        {/* Header badge */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/10">
          <p className="inline-flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-black uppercase text-coral dark:bg-coral/15 dark:text-red-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Flyer destacado
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-black uppercase text-blue-600 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200">
            <Star className="h-3.5 w-3.5 fill-blue-500 text-blue-500 dark:fill-blue-300 dark:text-blue-300" aria-hidden />
            Nuevo modelo 2024
          </p>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500 dark:bg-green-400" />
            Seguimiento activo
          </span>
        </div>

        {/* Top: image + info */}
        <div className="grid lg:grid-cols-[1fr_1fr]">
          {/* Left: camera image */}
          <div className="flex items-center justify-center bg-gray-50 p-4 lg:p-6 dark:bg-[#060e1e]">
            <img
              src="/images/ptz_dahua.png"
              alt="Dahua PTZ X-Spans"
              className="h-44 w-auto object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105 md:h-56 lg:h-64"
              draggable={false}
            />
          </div>

          {/* Right: info */}
          <div className="flex flex-col justify-between border-t border-gray-100 p-4 lg:border-l lg:border-t-0 lg:p-6 dark:border-white/10">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-500 dark:text-blue-300">Dahua X-Spans Series</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-gray-900 md:text-3xl dark:text-white">
                PTZ Dual-Canal<br />
                <span className="text-coral">para Exterior</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-blue-100/70">
                Imagen panorámica 180° + canal PTZ de detalle en una sola unidad. Seguimiento automático inteligente con zoom óptico 25x y protección IP66.
              </p>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                {[
                  "Canal panorámico IPC + canal PTZ integrado",
                  "Seguimiento vinculado y retransmisión automática",
                  "Reduce costos vs. instalar 2 cámaras por separado",
                  "1 IP, 1 cable, 1 bracket — instalación simple",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-gray-600 dark:text-blue-100/75">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Specs */}
            <div className="mt-5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "360°", detail: "Pan/Tilt", icon: Move3D },
                  { label: "25x", detail: "Zoom óptico", icon: Maximize2 },
                  { label: "IP66", detail: "Exterior", icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center dark:border-white/10 dark:bg-white/[0.06]">
                      <Icon className="mx-auto h-4 w-4 text-coral" aria-hidden />
                      <p className="mt-1 text-xl font-black text-gray-900 dark:text-white">{item.label}</p>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-blue-100/60">{item.detail}</p>
                    </div>
                  );
                })}
              </div>

              <a
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-coral font-black text-white transition-opacity hover:opacity-90"
                href="/catalogo"
              >
                Cotizar PTZ
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom: full-width video */}
        <div className="relative overflow-hidden border-t border-white/10">
          <video
            src="/videos/1693379978_aa6da218-43d4-174f-c.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full object-cover"
            style={{ maxHeight: "min(260px, 40vw)" }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-sm font-black uppercase tracking-wide text-white/90">
              <RadioTower className="mr-1.5 inline h-4 w-4 text-blue-300" />
              Modo de enlace — Seguimiento inteligente en vivo
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
