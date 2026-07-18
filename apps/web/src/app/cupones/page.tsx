"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Clock3, Copy, ShieldCheck, ShoppingCart, Sparkles, TicketPercent } from "lucide-react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import "./cupones.css";

type Cupon = {
  codigo: string;
  descuento: string;
  titulo: string;
  descripcion: string;
  minimo: string;
  vence: string;
  destacado?: boolean;
};

const cupones: Cupon[] = [
  { codigo: "DAHUA10", descuento: "10% OFF", titulo: "Cámaras Dahua", descripcion: "Válido en productos seleccionados de videovigilancia.", minimo: "Compra mínima de $1,500", vence: "30 de julio", destacado: true },
  { codigo: "KIT15", descuento: "15% OFF", titulo: "Kits de videovigilancia", descripcion: "Ahorra en kits seleccionados de 4 y 8 cámaras.", minimo: "Compra mínima de $3,999", vence: "30 de julio", destacado: true },
  { codigo: "CAT620", descuento: "20% OFF", titulo: "Cable UTP Cat6", descripcion: "Descuento aplicable en compras por bobina.", minimo: "Compra mínima de $2,000", vence: "30 de julio" },
  { codigo: "GRABA10", descuento: "10% OFF", titulo: "DVR y NVR", descripcion: "Equipa tu sistema con modelos seleccionados.", minimo: "Compra mínima de $2,500", vence: "30 de julio" },
  { codigo: "ACCESO15", descuento: "15% OFF", titulo: "Canaletas y accesorios", descripcion: "Todo lo necesario para una instalación limpia.", minimo: "Compra mínima de $800", vence: "30 de julio" },
  { codigo: "AHORRA300", descuento: "$300 OFF", titulo: "Descuento directo", descripcion: "Recibe $300 de descuento en el total de tu compra.", minimo: "Compra mínima de $5,000", vence: "30 de julio" },
];

const storageKey = "worldcam-cupones-reclamados";

export default function Cupones() {
  const [codigo, setCodigo] = useState("");
  const [reclamados, setReclamados] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    try {
      const guardados = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(guardados)) setReclamados(guardados);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, []);

  const cuponesReclamados = useMemo(
    () => cupones.filter((cupon) => reclamados.includes(cupon.codigo)),
    [reclamados],
  );

  const guardarReclamados = (nuevos: string[]) => {
    setReclamados(nuevos);
    localStorage.setItem(storageKey, JSON.stringify(nuevos));
  };

  const copiarCodigo = async (valor: string) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(valor);
      window.setTimeout(() => setCopiado(""), 1800);
    } catch {
      setCopiado("");
    }
  };

  const reclamar = (cupon: Cupon) => {
    if (!reclamados.includes(cupon.codigo)) guardarReclamados([...reclamados, cupon.codigo]);
    void copiarCodigo(cupon.codigo);
    setError("");
    setMensaje(`¡Listo! El cupón ${cupon.codigo} se guardó y está listo para usar.`);
  };

  const agregarPorCodigo = () => {
    const valor = codigo.trim().toUpperCase();
    const cupon = cupones.find((item) => item.codigo === valor);
    if (!valor) {
      setMensaje("");
      setError("Escribe un código para poder validarlo.");
      return;
    }
    if (!cupon) {
      setMensaje("");
      setError("Ese código no está disponible. Revisa que esté escrito correctamente.");
      return;
    }
    reclamar(cupon);
    setCodigo("");
  };

  return (
    <>
      <SiteHeader active="home" />
      <main className="cupones-page">
        <section className="cupones-hero">
          <div className="cupones-hero-content">
            <span className="cupones-eyebrow"><Sparkles size={16} /> Ofertas exclusivas</span>
            <h1>Reclama tu cupón y ahorra en tu próxima compra</h1>
            <p>Elige una promoción, reclama el código y úsalo al finalizar tu compra. Es rápido, gratuito y queda guardado en este dispositivo.</p>
            <div className="cupon-input" role="group" aria-label="Agregar cupón por código">
              <TicketPercent size={20} />
              <input
                type="text"
                value={codigo}
                onChange={(event) => { setCodigo(event.target.value.toUpperCase()); setError(""); }}
                onKeyDown={(event) => event.key === "Enter" && agregarPorCodigo()}
                placeholder="Ingresa tu código"
                aria-label="Código de cupón"
              />
              <button type="button" onClick={agregarPorCodigo}>Validar código</button>
            </div>
            {mensaje && <div className="cupon-alert cupon-alert-success" role="status"><CheckCircle2 size={20} /> {mensaje}</div>}
            {error && <div className="cupon-alert cupon-alert-error" role="alert">{error}</div>}
          </div>
          <div className="cupones-hero-ticket" aria-hidden="true">
            <Image src="/images/logo/logo.png" alt="" width={64} height={64} />
            <span>HASTA</span><strong>20%</strong><p>DE DESCUENTO</p><small>Solo por tiempo limitado</small>
          </div>
        </section>

        <section className="cupones-content" aria-labelledby="cupones-disponibles">
          <div className="cupones-section-heading">
            <div><span>Promociones disponibles</span><h2 id="cupones-disponibles">Elige el cupón ideal para ti</h2></div>
            <p>{cupones.length} cupones disponibles</p>
          </div>
          <div className="cupones-grid">
            {cupones.map((cupon) => {
              const reclamado = reclamados.includes(cupon.codigo);
              return (
                <article className={`cupon-card${reclamado ? " cupon-card-claimed" : ""}`} key={cupon.codigo}>
                  {cupon.destacado && <span className="cupon-popular">Más popular</span>}
                  <div className="cupon-card-top">
                    <div className="cupon-icon"><TicketPercent size={30} /></div>
                    <div className="cupon-info">
                      <strong className="cupon-discount">{cupon.descuento}</strong>
                      <h3>{cupon.titulo}</h3><p>{cupon.descripcion}</p>
                    </div>
                  </div>
                  <ul className="cupon-details">
                    <li><ShoppingCart size={16} /> {cupon.minimo}</li>
                    <li><Clock3 size={16} /> Válido hasta el {cupon.vence}</li>
                  </ul>
                  <div className="ticket-line" />
                  <div className="cupon-code-row">
                    <div>
                      <small>CÓDIGO</small>
                      <button className="cupon-code" type="button" onClick={() => void copiarCodigo(cupon.codigo)} aria-label={`Copiar código ${cupon.codigo}`}>
                        {cupon.codigo}{copiado === cupon.codigo ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <button className={`btn-reclamar${reclamado ? " is-claimed" : ""}`} type="button" onClick={() => reclamar(cupon)}>
                      {reclamado ? <><Check size={18} /> Reclamado</> : "Reclamar cupón"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cupones-how">
          <div><span><ShieldCheck size={24} /></span><div><strong>1. Elige</strong><p>Encuentra la promoción que más te conviene.</p></div></div>
          <div><span><TicketPercent size={24} /></span><div><strong>2. Reclama</strong><p>Guarda y copia el código con un solo clic.</p></div></div>
          <div><span><ShoppingCart size={24} /></span><div><strong>3. Compra</strong><p>Pega el código al finalizar tu compra.</p></div></div>
        </section>

        {cuponesReclamados.length > 0 && (
          <section className="cupones-wallet" aria-label="Mis cupones reclamados">
            <div><span><CheckCircle2 size={20} /> Mis cupones</span><strong>{cuponesReclamados.length} {cuponesReclamados.length === 1 ? "cupón guardado" : "cupones guardados"}</strong></div>
            <Link href="/productos">Ver productos <ShoppingCart size={17} /></Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
