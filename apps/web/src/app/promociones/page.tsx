"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgePercent,
  Bot,
  ExternalLink,
  Loader2,
  MessageCircle,
  Send,
  ShoppingCart,
  Sparkles,
  Video,
} from "lucide-react";
import SiteHeader from "../../components/SiteHeader";

type AdvisorProduct = {
  name: string;
  sku: string;
  model: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
};

type ChatMessage = {
  role: "bot" | "user";
  text: string;
  products?: AdvisorProduct[];
  handoff?: boolean;
};

type CatalogProduct = AdvisorProduct & {
  clave?: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const whatsappUrl =
  "https://wa.me/522216531107?text=Hola%20Worldcam%2C%20quiero%20hablar%20con%20un%20asesor%20para%20una%20cotizacion%20o%20proyecto.";
const advisorSuggestions = [
  "Quiero camaras",
  "Quiero una cotizacion",
  "Necesito una visita tecnica",
  "Tengo una farmacia de 8 x 20 metros",
  "Tengo $10,000 para camaras",
  "Quiero instalar 20 camaras",
  "Quiero alimentar camaras con panel solar",
  "Necesito monitorear varias sucursales",
];
const tiktokChannelUrl = process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/search?q=WorldCam%20de%20Mexico";
const tiktokVideoUrls = [
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_1,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_2,
  process.env.NEXT_PUBLIC_TIKTOK_VIDEO_3,
].filter((url): url is string => Boolean(url));

export default function PromocionesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Hola, soy el asesor técnico de Worldcam. Puedo ayudarte con cámaras, DVR/NVR, discos, switches, routers, cableado, paneles solares y accesorios del catálogo.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [ptzProducts, setPtzProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let active = true;

    async function loadPtzProducts() {
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
            const text = `${product.name} ${product.model} ${product.sku} ${product.brand} ${product.category}`.toLowerCase();
            return text.includes("ptz") || text.includes("zoom optico") || text.includes("varifocal");
          })
          .sort((a: CatalogProduct, b: CatalogProduct) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || b.stock - a.stock)
          .slice(0, 3);

        setPtzProducts(products);
      } catch {
        setPtzProducts([]);
      }
    }

    loadPtzProducts();
    return () => {
      active = false;
    };
  }, []);

  async function askAdvisor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendAdvisorQuestion(question);
  }

  async function sendAdvisorQuestion(rawQuestion: string) {
    const cleanQuestion = rawQuestion.trim();
    if (!cleanQuestion || asking) return;

    setQuestion("");
    const lastBotWithProducts = [...messages].reverse().find((message) => message.role === "bot" && message.products?.length);

    if (isWhyFollowUp(cleanQuestion) && lastBotWithProducts?.products?.length) {
      const explanation = buildWhyAnswer(lastBotWithProducts.products);
      setMessages((current) => [...current, { role: "user", text: cleanQuestion }, explanation]);
      return;
    }

    setAsking(true);
    setMessages((current) => [...current, { role: "user", text: cleanQuestion }]);
    try {
      const response = await fetch(`${apiBaseUrl}/api/catalog/advisor-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanQuestion,
          contextProducts: lastBotWithProducts?.products?.slice(0, 5) ?? [],
        }),
      });
      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: data.answer ?? "No tengo ese dato confirmado en catálogo. Te recomiendo hablar con un asesor.",
          products: Array.isArray(data.products) ? data.products : [],
          handoff: Boolean(data.handoff),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "No pude consultar el catálogo en este momento. Te recomiendo hablar con un asesor.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080d19] text-white">
      <SiteHeader active="promociones" />

      <section className="relative overflow-hidden border-b border-white/10 bg-[#0b1020] text-white">
        <div className="absolute inset-0 opacity-25 tech-grid" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-mint">Worldcam de Mexico</p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-black uppercase text-ink">
            <BadgePercent className="h-5 w-5" aria-hidden />
            Promociones activas
          </div>
          <h2 className="mt-4 max-w-4xl text-2xl font-black leading-tight md:text-4xl lg:text-5xl">
            Descuentos en camaras de seguridad, kits CCTV y soluciones completas.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/72 md:text-lg md:leading-8">
            Ofertas pensadas para instalar, renovar o ampliar sistemas de videovigilancia profesional.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/55">Productos reales del catalogo</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">Camaras PTZ y zoom para proyectos</h2>
          </div>
          <a href="/catalogo?buscar=ptz" className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-50">
            Ver mas PTZ
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ptzProducts.map((product, index) => (
          <article key={`${product.sku}-${product.model}`} className="overflow-hidden rounded-lg border border-white/10 bg-[#0d1526] shadow-soft transition hover:border-blue-400/50">
            <div className="relative flex h-64 items-center justify-center bg-white p-5">
              {product.image ? (
                <img className="h-full w-full object-contain" src={product.image} alt={product.name} />
              ) : (
                <div className="text-sm font-black uppercase tracking-widest text-ink/40">Sin imagen</div>
              )}
              <span className="absolute left-4 top-4 rounded bg-coral px-3 py-2 text-sm font-black uppercase text-white">
                {index === 0 ? "PTZ destacada" : product.stock > 0 ? "Disponible" : "PTZ"}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">{product.brand || "Worldcam"}</p>
              <h3 className="mt-2 min-h-24 text-xl font-black leading-7 text-white">{product.name}</h3>
              <p className="mt-3 text-sm text-blue-100/65">
                Modelo <strong className="text-white">{product.model || "Sin modelo"}</strong> · SKU <strong className="text-white">{product.sku}</strong>
              </p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-mint">{money(product.price)}</p>
                  <p className="text-xs font-bold text-blue-100/55">Stock: {product.stock}</p>
                </div>
                <button
                  type="button"
                  onClick={() => sendAdvisorQuestion(`Quiero cotizar el modelo ${product.model || product.sku}`)}
                  className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-black text-white"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Cotizar
                </button>
              </div>
            </div>
          </article>
        ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-8">
        <div className="rounded-xl border border-cyan-300/15 bg-[#0b1221] p-5 shadow-soft md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/55">Redes sociales</p>
              <h2 className="mt-2 text-2xl font-black md:text-3xl">Videos de WorldCam de Mexico</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/60">
                Este bloque esta preparado para reproducir videos de TikTok con URLs reales del canal o de cada publicacion.
              </p>
            </div>
            <a href={tiktokChannelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-black text-white">
              Abrir TikTok
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
          {tiktokVideoUrls.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {tiktokVideoUrls.map((url) => (
                <iframe
                  key={url}
                  className="h-[620px] w-full rounded-lg border border-white/10 bg-black"
                  src={getTikTokEmbedUrl(url)}
                  title="Video de TikTok WorldCam"
                  allow="encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["PTZ y zoom optico", "Videos para explicar alcance, seguimiento y usos en estacionamientos."],
                ["Kits para casa y negocio", "Contenido corto para vender soluciones completas con camaras y grabador."],
                ["Soporte tecnico", "Tips para DVR/NVR, vision nocturna, cableado, red y almacenamiento."],
              ].map(([title, text]) => (
                <a
                  key={title}
                  href={tiktokChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-52 flex-col justify-between rounded-lg border border-white/10 bg-[#101a2e] p-5 transition hover:border-cyan-300/40"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-100">
                      <Video className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-blue-100/62">{text}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-100">
                    Conectar video
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="cotizacion" className="mx-auto grid max-w-7xl scroll-mt-40 gap-6 px-4 pb-12 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-cyan-300/20 bg-[#0d1526] p-6 shadow-soft">
          <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-100">
            <Sparkles className="h-4 w-4" aria-hidden />
            Asesor conectado al catálogo
          </div>
          <h2 className="mt-5 text-3xl font-black">Chat técnico para elegir la solución correcta</h2>
          <p className="mt-3 leading-7 text-blue-100/65">
            Pregunta por cámaras con audio, kits para casa o negocio, DVR/NVR, discos duros, switches, routers, cableado,
            paneles solares y accesorios. El asesor consulta productos reales y no inventa precio ni stock.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-blue-100/70">
            {["No responde temas fuera de productos Worldcam", "Usa SKU, modelo, precio y stock del catálogo", "Si no encuentra información confirmada, te manda con un asesor"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1221] shadow-soft">
          <div className="flex items-center gap-3 border-b border-white/10 bg-[#111b2e] px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-100">
              <Bot className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h3 className="font-black">Asesor Worldcam</h3>
              <p className="text-sm text-blue-100/55">Conectado al catálogo de productos</p>
            </div>
          </div>

          <div className="max-h-[520px] min-h-[360px] space-y-4 overflow-y-auto p-5">
            <div className="flex flex-wrap gap-2">
              {advisorSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendAdvisorQuestion(suggestion)}
                  className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[82%]" : "mr-auto max-w-[92%]"}>
                <div className={`rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-blue-700 text-white" : "bg-white/[0.06] text-blue-50"}`}>
                  {formatAdvisorAnswer(message).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {message.handoff ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-black text-ink shadow-soft transition hover:bg-mint/90"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Hablar con un asesor
                  </a>
                ) : null}
                {message.products?.length ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {message.products.slice(0, 4).map((product) => (
                      <div
                        key={`${product.sku}-${product.model}`}
                        className="group rounded-lg border border-white/10 bg-[#101a2e] p-4 text-sm shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition hover:border-cyan-300/45"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <p className="min-w-0 text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">{product.brand || "Worldcam"}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${product.stock > 0 ? "bg-mint/15 text-mint" : "bg-white/10 text-blue-100/60"}`}>
                            {product.stock > 0 ? "Disponible" : "Stock por confirmar"}
                          </span>
                        </div>
                        {product.image ? (
                          <div className="mb-4 flex justify-center rounded-lg border border-white/10 bg-white p-3">
                            <img className="h-32 w-full object-contain" src={product.image} alt={product.name} />
                          </div>
                        ) : null}
                        <p className="font-black leading-6 text-white">{product.name}</p>
                        <div className="mt-4 grid gap-2 text-blue-100/68">
                          <p>
                            Modelo <strong className="select-text text-white">{product.model || "Sin modelo"}</strong>
                          </p>
                          <p>
                            SKU <strong className="select-text text-white">{product.sku || "Sin SKU"}</strong>
                          </p>
                        </div>
                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/10 pt-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.12em] text-blue-100/45">Precio catalogo</p>
                            <p className="text-lg font-black text-mint">{money(product.price)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuestion(`Dame mas detalles del modelo ${product.model || product.sku}`)}
                            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-cyan-400/20"
                          >
                            Consultar
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="rounded-lg border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-xs leading-5 text-cyan-50/80 md:col-span-2">
                      Antes de cerrar la compra conviene validar compatibilidad, capacidad de grabacion, cableado y disponibilidad real con un asesor.
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
            {asking ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-3 text-sm text-blue-100/70">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Consultando catálogo...
              </div>
            ) : null}
          </div>

          <form onSubmit={askAdvisor} className="flex gap-3 border-t border-white/10 bg-[#111b2e] p-4">
            <input
              className="min-w-0 flex-1 rounded-lg border border-cyan-300/20 bg-[#08111f] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/35"
              placeholder="Ej. ¿Qué cámara me sirve para exterior con audio?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button disabled={asking || !question.trim()} className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              <Send className="h-4 w-4" aria-hidden />
              Enviar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function money(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function getTikTokEmbedUrl(value: string) {
  const match = value.match(/video\/(\d+)/);
  return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : value;
}

function formatAdvisorAnswer(message: ChatMessage) {
  const lines = message.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (message.role === "user" || !message.products?.length) {
    return lines;
  }

  const firstLine = (lines[0] ?? "").toLowerCase();
  const hasRawProductList = lines.some((line) => /^\d+\./.test(line));

  if (!hasRawProductList) {
    return lines;
  }

  if (firstLine.includes("paquete") || firstLine.includes("base recomendada")) {
    return [
      "Si. Te puedo armar una base con estas piezas del catalogo.",
      "La idea es combinar grabador, camaras, almacenamiento y accesorios compatibles segun el lugar donde se va a instalar.",
    ];
  }

  if (firstLine.includes("ficha") || firstLine.includes("detalles") || firstLine.includes("modelo")) {
    return ["Claro. Te dejo la ficha que encontre para ese modelo:"];
  }

  if (firstLine.includes("recomiendo") || firstLine.includes("opciones")) {
    return ["Si. Estas opciones son las que mejor encajan con lo que buscas:"];
  }

  if (firstLine.includes("precio") || firstLine.includes("precios")) {
    return ["Claro. Estos son precios reales que encontre en el catalogo de Worldcam:"];
  }

  return ["Encontre estas opciones del catalogo que pueden servirte:"];
}

function isWhyFollowUp(value: string) {
  const normalized = normalizeChatText(value);
  return ["porque", "por que", "por que?", "porque?", "por que me recomiendas", "por que ese", "por que esa"].some((phrase) =>
    normalized.includes(phrase),
  );
}

function buildWhyAnswer(products: AdvisorProduct[]): ChatMessage {
  const main = products[0];
  const alternatives = products.slice(1, 3);
  const reasons = [
    `${main.name} es la primera opcion porque fue la coincidencia mas fuerte con lo que pediste.`,
    main.stock > 0
      ? `Tiene stock registrado (${main.stock} unidades), por eso conviene revisarla antes que opciones sin disponibilidad confirmada.`
      : "El catalogo no confirma stock disponible; aun asi coincide por modelo, uso o categoria, asi que conviene validarla con ventas.",
    `La puedes ubicar rapido con modelo ${main.model || "sin modelo"} y SKU ${main.sku || "sin SKU"}.`,
  ];

  if (alternatives.length) {
    reasons.push(`Tambien te deje ${alternatives.length} alternativa(s) para comparar precio, marca y caracteristicas antes de decidir.`);
  }

  return {
    role: "bot",
    text: reasons.join("\n"),
    products: products.slice(0, 3),
  };
}

function normalizeChatText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
