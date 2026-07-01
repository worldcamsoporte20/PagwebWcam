"use client";

import React from "react";
import Image from "next/image";

const cupones = [
  {
    titulo: "10% OFF en cámaras Dahua",
    descripcion: "En productos seleccionados",
    minimo: "Compra mínima $1,500",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "15% OFF en kits de videovigilancia",
    descripcion: "En kits de 4 y 8 cámaras",
    minimo: "Compra mínima $3,999",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "20% OFF en cable UTP Cat6",
    descripcion: "En compras por bobina",
    minimo: "Compra mínima $2,000",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "10% OFF en DVR y NVR",
    descripcion: "En modelos seleccionados",
    minimo: "Compra mínima $2,500",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "15% OFF en canaletas y accesorios",
    descripcion: "Compra mínima $800",
    minimo: "",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "$300 OFF",
    descripcion: "En compras mayores a $5,000",
    minimo: "",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "$500 OFF",
    descripcion: "En compras mayores a $8,000",
    minimo: "",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "10% OFF en iluminación LED",
    descripcion: "En productos seleccionados",
    minimo: "",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "15% OFF en fuentes profesionales",
    descripcion: "En productos seleccionados",
    minimo: "",
    vence: "Vence 30 de julio",
  },
  {
    titulo: "20% OFF en instalación completa",
    descripcion: "Servicio profesional",
    minimo: "",
    vence: "Vence 30 de julio",
  },
];

export default function Cupones() {
  return (
    <>
      {/* Barra Superior */}
      <div className="topbar">
        <div className="topbar-content">
          <Image
            src="/images/logo/logo.png"
            alt="WorldCam"
            width={42}
            height={42}
            className="topbar-logo"
          />

          <span>WorldCam</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="cupones-page">
        <div className="cupones-header">
          <h1>Cupones WorldCam</h1>

          <div className="cupon-input">
            <input
              type="text"
              placeholder="Ingresar código de cupón"
            />

            <button>Agregar cupón</button>
          </div>
        </div>

        <div className="cupones-grid">
          {cupones.map((cupon, index) => (
            <div className="cupon-card" key={index}>
              <div className="cupon-card-top">
                <div className="cupon-icon">
                  <Image
                    src="/images/logo/logo.png"
                    alt="WorldCam"
                    width={55}
                    height={55}
                    className="logo-cupon"
                  />
                </div>

                <div className="cupon-info">
                  <h2>{cupon.titulo}</h2>

                  <p>{cupon.descripcion}</p>

                  {cupon.minimo && (
                    <span>{cupon.minimo}</span>
                  )}
                </div>
              </div>

              <div className="ticket-line"></div>

              <div className="cupon-footer">
                <small>🕒 {cupon.vence}</small>

                <button className="btn-aplicar">
                  Aplicar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}