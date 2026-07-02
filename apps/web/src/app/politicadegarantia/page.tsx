"use client";

import Image from "next/image";

export default function Garantias() {
  return (
    <div className="wc-politicas-page">

      <section className="wc-politicas-banner">

        <div className="wc-politicas-info">

          <span className="wc-politicas-etiqueta">
            SERVICIO AL CLIENTE
          </span>

          <h1>
            Políticas de Garantía y Devoluciones
          </h1>

          <p>
            Conoce los requisitos, restricciones y tiempos para realizar un
            trámite de garantía en WorldCam de México.
          </p>

        </div>

        <div className="wc-politicas-logo-contenedor">
          <Image
            src="/images/logo/logo.png"
            alt="WorldCam"
            width={250}
            height={90}
            className="wc-politicas-logo"
          />
        </div>

      </section>

      <section className="wc-politicas-tarjeta">

        <p>
          En WorldCam de México SA de CV, todos los equipos cuentan con
          Garantía por defectos de fabricación, el periodo depende de las
          políticas de nuestros proveedores y fabricantes, a excepción de que
          se indique lo contrario en la factura y de las restricciones por
          fabricante.
        </p>

      </section>

      <section className="wc-politicas-tarjeta">
        <h2>REQUISITOS</h2>

        <ul>

          <li>Para el trámite de cualquier garantía, es indispensable entregar el equipo en nuestras oficinas con el personal correspondiente a la recepción de equipos.</li>

          <li>Es indispensable en primer plano mostrar la factura impresa con la que se generó la compra del producto ya que sin ella no se procederá a la revisión del producto hasta que está sea presentada.</li>

          <li>Se indicara la descripción clara del problema. No se aceptara equipo a reparación y/o garantía con descripciones tales como (NO FUNCIONA, NO SIRVE, NO SE VEN LAS CAMARAS, NO GRABA, ETC.)</li>

          <li>El cliente tiene que asegurar que una vez recibido el equipo se le entregue un formato RMA (Autorización de Retorno de Mercancía).</li>

          <li>Garantías que sean solicitadas por compras realizadas en e-commerce, tendrán que ser valoradas y no estar dentro de las restricciones.</li>

        </ul>

      </section>

      <section className="wc-politicas-tarjeta">
        <h2>RESTRICCIONES PARA RECEPCIÓN DE EQUIPO</h2>

        <ul>

          <li>El equipo no debe presentar en condiciones distintas a las anormales (descargas eléctricas).</li>

          <li>Equipo no debe haber sido intervenido por personas no autorizadas.</li>

          <li>El equipo no debe estar mutilado en cables accesorios o cualquiera de sus partes.</li>

          <li>Daños en el proceso de transportación.</li>

          <li>Golpes ocasionados por caídas o mal manejo.</li>

          <li>Daños por uso de herramientas inadecuadas.</li>

        </ul>

      </section>

      <section className="wc-politicas-tarjeta">
        <h2>PERIODO DE RESOLUCIÓN</h2>

        <ul>

          <li>Después de una valoración que se hará en un periodo de 24 hrs.</li>

          <li>En caso de garantía válida se realizará reemplazo o nota de crédito.</li>

          <li>Si está fuera del periodo de garantía se generará Orden de Servicio.</li>

        </ul>

      </section>

      <section className="wc-politicas-tarjeta">

        <h2>NOTIFICACIÓN</h2>

        <ul>

          <li>Una vez notificado que su equipo está listo para su entrega, el equipo quedará en resguardo por 30 días.</li>

          <li>Sólo se entregará el equipo con la hoja RMA.</li>

        </ul>

      </section>

      <section className="wc-politicas-tarjeta">

        <h2>RESTRICCIÓN DE PRODUCTOS POR FABRICANTE</h2>

        <ul>

          <li>De acuerdo a los fabricantes hay pólizas de garantías que solo se resolverán por medio de ellos.</li>

        </ul>

      </section>

    </div>
  );
}