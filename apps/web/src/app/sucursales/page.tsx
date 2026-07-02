"use client";

import { MapPin, Phone, Clock, Building2, Share2 } from "lucide-react";
import SiteHeader from "../../components/SiteHeader";

const SUCURSALES = [
  {
    key: "2506",
    nombre: "Sucursal 2506",
    responsable: "Mario Rojas",
    whatsapp: "+522227069398",
    whatsappLabel: "+52 222.706.9398",
    direccion: "C. 9 Sur 2506, Col Chulavista, 72420\nEntre 25 y 27 pte\nHeroica Puebla de Zaragoza, Pue.",
    horarios: [
      { dia: "LUNES A VIERNES", hora: "09:00 - 19:00 hrs." },
      { dia: "SÁBADO", hora: "09:00 - 16:30 hrs." },
    ],
    quejas: "222.820.1289",
    mapSrc: "https://maps.google.com/maps?q=C.+9+Sur+2506,+Chulavista,+Puebla&output=embed",
    mapLink: "https://maps.google.com/?q=C.+9+Sur+2506,+Chulavista,+Puebla",
    img: "/images/sucursal/sucursal2506.png",
  },
  {
    key: "iluminacion",
    nombre: "WorldCam Iluminación",
    responsable: null,
    whatsapp: null,
    whatsappLabel: null,
    direccion: "C. 9 Sur 2506, Col Chulavista, 72420\nEntre 25 y 27 pte\nHeroica Puebla de Zaragoza, Pue.",
    horarios: [
      { dia: "LUNES A VIERNES", hora: "09:00 - 19:00 hrs." },
      { dia: "SÁBADO", hora: "09:00 - 16:30 hrs." },
    ],
    quejas: "222.820.1289",
    mapSrc: "https://maps.google.com/maps?q=C.+9+Sur+2506,+Chulavista,+Puebla&output=embed",
    mapLink: "https://maps.google.com/?q=C.+9+Sur+2506,+Chulavista,+Puebla",
    img: "/images/sucursal/sucursalIluminacion.png",
  },
  {
    key: "2502",
    nombre: "Sucursal 2502",
    responsable: "Viridiana Dolores",
    whatsapp: "+522228201170",
    whatsappLabel: "+52 222.820.1170",
    direccion: "Calle 9 Sur No. 2502, Local A,\nChulavista, 72420 Sobre 25pte\nHeroica Puebla de Zaragoza, Pue.",
    horarios: [
      { dia: "LUNES A VIERNES", hora: "09:00 - 19:00 hrs." },
      { dia: "SÁBADO", hora: "09:00 - 16:30 hrs." },
    ],
    quejas: "222.820.1289",
    mapSrc: "https://maps.google.com/maps?q=Calle+9+Sur+2502,+Chulavista,+Puebla&output=embed",
    mapLink: "https://maps.google.com/?q=Calle+9+Sur+2502,+Chulavista,+Puebla",
    img: "/images/sucursal/sucursal2502.png",
  },
  {
    key: "yankon",
    nombre: "Iluminación Yankon",
    responsable: "Monica Diaz",
    whatsapp: "+522228201170",
    whatsappLabel: "+52 222.820.1170",
    direccion: "Calle 9 Sur No. 2502, Local B,\nChulavista, 72420 Sobre 25pte\nHeroica Puebla de Zaragoza, Pue.",
    horarios: [
      { dia: "LUNES A VIERNES", hora: "09:00 - 19:00 hrs." },
      { dia: "SÁBADO", hora: "09:00 - 16:30 hrs." },
    ],
    quejas: "222.820.1289",
    mapSrc: "https://maps.google.com/maps?q=Calle+9+Sur+2502,+Chulavista,+Puebla&output=embed",
    mapLink: "https://maps.google.com/?q=Calle+9+Sur+2502,+Chulavista,+Puebla",
    img: "/images/sucursal/sucursalYan.png",
  },
  {
    key: "6pte",
    nombre: "Sucursal 6Pte",
    responsable: "Pablo Santiago",
    whatsapp: "+522227068872",
    whatsappLabel: "+52 222.706.8872",
    direccion: "Av 6 Pte 705A, San Pablo de los Frailes,\n72000 Heroica Puebla de Zaragoza, Pue.",
    horarios: [
      { dia: "LUNES A VIERNES", hora: "09:00 - 19:00 hrs." },
      { dia: "SÁBADO", hora: "09:00 - 16:30 hrs." },
    ],
    quejas: "222.820.1289",
    mapSrc: "https://maps.google.com/maps?q=Av+6+Pte+705A,+Puebla&output=embed",
    mapLink: "https://maps.google.com/?q=Av+6+Pte+705A,+Puebla",
    img: "/images/sucursal/sucursal6Pte.png",
  },
];

// Íconos redes sociales SVG
const IconFacebook = () => (
  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconTiktok = () => (
  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);
const IconWhatsapp = () => (
  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.858L.073 23.927l6.255-1.439A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.001-1.371l-.36-.214-3.714.854.936-3.613-.235-.372A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1" fill="white"/>
  </svg>
);

export default function SucursalesPage() {
  return (
    <>
      <SiteHeader />
      <div className="suc-page">

      {/* HERO */}
      <div className="suc-container">
        <div className="suc-hero">
          <div className="suc-hero-badge">WorldCam</div>
          <h1 className="suc-hero-title">
            Nuestras <span className="suc-hero-title-accent">Sucursales</span>
          </h1>
          <p className="suc-hero-subtitle">
            ¡Visítanos en cualquiera de nuestras sucursales y encuentra
            soluciones de tecnología cerca de ti!
          </p>
          <div className="suc-hero-icon">
            <Building2 size={140} color="white" strokeWidth={1} />
          </div>
        </div>

        {/* HORARIOS GENERALES + REDES */}
        <div className="suc-horarios-banner">
          <div>
            <div className="suc-horarios-title">
              <Clock size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              Horarios de atención
            </div>
            <div className="suc-horarios-table">
              <div className="suc-horario-row">
                <span className="suc-horario-dia">LUNES A VIERNES</span>
                <span className="suc-horario-hora">09:00 - 19:00 hrs.</span>
              </div>
              <div className="suc-horario-row">
                <span className="suc-horario-dia">SÁBADO</span>
                <span className="suc-horario-hora">09:00 - 16:30 hrs.</span>
              </div>
              <div className="suc-horario-row">
                <span className="suc-horario-dia">DOMINGO</span>
                <span className="suc-horario-cerrado">CERRADO.</span>
              </div>
            </div>
          </div>

          <div className="suc-redes">
            <p className="suc-redes-text">
              Síguenos en redes sociales para estar al tanto de nuestras actualizaciones.
            </p>
            <div className="suc-redes-icons">
                <a href="https://www.facebook.com/WorldCamMexico/" target="_blank" rel="noopener noreferrer" className="suc-red-icon" style={{ background: "#1877F2" }}><IconFacebook /></a>
                <a href="https://www.tiktok.com/@worldcamdemexico" target="_blank" rel="noopener noreferrer" className="suc-red-icon" style={{ background: "#000000" }}><IconTiktok /></a>
                <a href="https://web.whatsapp.com/send?phone=5212228201289&text=Hola%20Worldcam" target="_blank" rel="noopener noreferrer" className="suc-red-icon" style={{ background: "#25D366" }}><IconWhatsapp /></a>
                <a href="https://www.instagram.com/worldcamdemexico/?hl=es" target="_blank" rel="noopener noreferrer" className="suc-red-icon" style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}><IconInstagram /></a>
            </div>
          </div>
        </div>

        {/* LISTA DE SUCURSALES */}
        <div className="suc-section-divider">
          <MapPin size={18} color="#022C96" />
          <span style={{ fontSize: 16, fontWeight: 700, color: "#022C96" }}>Ubicaciones</span>
          <div className="suc-section-line" />
        </div>

        {SUCURSALES.map((suc, i) => (
          <div key={suc.key}>
            <div className="suc-card">
              {/* INFO */}
              <div className="suc-card-info">
                <h2 className="suc-card-name">{suc.nombre}</h2>

                {suc.responsable && suc.whatsapp && (
                  <div className="suc-card-contact">
                    <a
                      href={`https://wa.me/${suc.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="suc-whatsapp-btn"
                    >
                      <IconWhatsapp />
                      Respons. {suc.responsable} · {suc.whatsappLabel}
                    </a>
                  </div>
                )}

                <p className="suc-card-address">
                  {suc.direccion.split("\n").map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </p>

                <div className="suc-card-horarios">
                  {suc.horarios.map((h) => (
                    <div key={h.dia} className="suc-card-horario-row">
                      <span className="suc-card-dia">{h.dia}</span>
                      <span className="suc-card-hora">{h.hora}</span>
                    </div>
                  ))}
                </div>

                {suc.quejas && (
                  <p className="suc-card-quejas">
                    <span>Para quejas y sugerencias:</span> {suc.quejas}
                  </p>
                )}
              </div>

              {/* FOTO */}
              <img
                src={suc.img}
                alt={suc.nombre}
                className="suc-card-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />

              {/* MAPA */}
              <div className="suc-card-map">
                <iframe
                  src={suc.mapSrc}
                  title={`Mapa ${suc.nombre}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={suc.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="suc-map-link"
                >
                  <MapPin size={10} />
                  Abrir en Maps
                </a>
              </div>
            </div>

            {i < SUCURSALES.length - 1 && <hr className="suc-hr" />}
          </div>
        ))}
      </div>
      </div>
    </>
  );
}