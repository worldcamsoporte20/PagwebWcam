import {
  ShieldCheck,
  ClipboardCheck,
  PackageSearch,
  FileText,
  Clock3,
  Building2,
  ChevronDown,
  TriangleAlert,
  BadgeCheck,
} from "lucide-react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function GarantiasPage() {
  return ( 
    <>
      <SiteHeader active="home" />
      <main className="garantia-container">

      {/*================ HERO ===============*/}
    <section className="garantia-hero">

    <div className="hero-glow"></div>

      <span className="hero-badge">
          WORLDCAM DE MEXICO SA DE CV
      </span>

        <h1>Garantías y Devoluciones</h1>

        <p>
          Conoce las políticas, requisitos y el procedimiento para ingresar un
          producto a garantía. Nuestro objetivo es brindarte un proceso claro,
          transparente y eficiente.
        </p>

        {/* Barra de indicadores */}

        <div className="hero-stats">

          <div className="stat-card">

            <FileText size={30} />

            <h4><strong>Factura</strong></h4>

            <span>Requerida</span>

          </div>

          <div className="stat-card">

            <Clock3 size={30} />

            <h4><strong>Revisión</strong></h4>

            <span>Según fabricante</span>

          </div>

          <div className="stat-card">

            <Building2 size={30} />

            <h4><strong>Fabricantes</strong></h4>

            <span>Políticas propias</span>

          </div>

        </div>

      </section>

      {/*================ CONTENIDO PRINCIPAL =================*/}

      <section className="garantia-content">

        <div className="garantia-grid">

          {/* Requisitos */}

          <div className="large-card">

            <div className="card-header">

              <ClipboardCheck size={34} />

              <h2>Requisitos para Garantía</h2>

            </div>

            <ul className="check-list">

              <li>
                <BadgeCheck size={18}/>
                Presentar factura o comprobante de compra.
              </li>

              <li>
                <BadgeCheck size={18}/>
                Entregar el formato RMA correctamente llenado.
              </li>

              <li>
                <BadgeCheck size={18}/>
                Describir claramente la falla del equipo.
              </li>

              <li>
                <BadgeCheck size={18}/>
                Entregar el producto con sus accesorios cuando aplique.
              </li>

              <li>
                <BadgeCheck size={18}/>
                Empacar correctamente el equipo para evitar daños.
              </li>

            </ul>

          </div>

          {/* Proceso */}

          <div className="large-card">

            <div className="card-header">

              <PackageSearch size={34} />

              <h2>Proceso de Garantía</h2>

            </div>

            <div className="vertical-process">

              <div className="process-item">
                <span>1</span>
                <p>Recepción del equipo</p>
              </div>

              <div className="line"></div>

              <div className="process-item">
                <span>2</span>
                <p>Revisión técnica</p>
              </div>

              <div className="line"></div>

              <div className="process-item">
                <span>3</span>
                <p>Diagnóstico</p>
              </div>

              <div className="line"></div>

              <div className="process-item">
                <span>4</span>
                <p>Reparación o reemplazo</p>
              </div>

              <div className="line"></div>

              <div className="process-item">
                <span>5</span>
                <p>Entrega al cliente</p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/*================ AVISO =================*/}

      <section className="important-card">

        <TriangleAlert size={48} />

        <div>

          <h2>Información Importante</h2>

          <p>
            Para iniciar cualquier proceso de garantía es indispensable presentar
            la factura de compra y el formato RMA. Los equipos con daños físicos,
            manipulación indebida o alteraciones podrán quedar fuera de garantía.
          </p>

        </div>

      </section>
            {/*================ POLÍTICAS =================*/}

      <section className="garantia-section">

        <h2>Políticas de Garantía</h2>

        <p className="subtitle">
          Consulta las condiciones generales antes de ingresar un equipo a garantía.
        </p>

        <div className="policy-grid">

          {/* Restricciones */}

          <div className="policy-card">

            <div className="policy-icon">
              <TriangleAlert size={34}/>
            </div>

            <h3>Restricciones</h3>

            <p>
              La garantía podrá ser rechazada cuando el equipo presente golpes,
              humedad, alteraciones, sellos violados, modificaciones o daños
              ocasionados por un uso incorrecto.
            </p>

          </div>

          {/* Tiempo */}

          <div className="policy-card">

            <div className="policy-icon">
              <Clock3 size={34}/>
            </div>

            <h3>Tiempo de Resolución</h3>

            <p>
              El tiempo de respuesta dependerá del diagnóstico técnico y de las
              políticas establecidas por el fabricante del producto.
            </p>

          </div>

          {/* Fabricante */}

          <div className="policy-card">

            <div className="policy-icon">
              <Building2 size={34}/>
            </div>

            <h3>Políticas del Fabricante</h3>

            <p>
              Algunos fabricantes cuentan con procesos específicos para la
              validación de garantías. Dichas políticas prevalecerán sobre
              cualquier procedimiento interno.
            </p>

          </div>

        </div>

      </section>

      {/*================ COMPROMISO =================*/}

      <section className="commitment-section">

        <div className="commitment-icon">

          <ShieldCheck size={60}/>

        </div>

        <h2>Comprometidos con la Calidad</h2>

        <p>

          En <strong>Worldcam</strong> trabajamos para brindarte un proceso de
          garantía transparente, eficiente y confiable.

        </p>

        <p>

          Nuestro objetivo es ofrecer soluciones oportunas para que puedas
          continuar utilizando tus productos con la mayor tranquilidad posible.

        </p>

      </section>

      {/*================ FAQ =================*/}

      <section className="garantia-section">

        <h2>Preguntas Frecuentes</h2>

        <p className="subtitle">

          Resolvemos las dudas más comunes sobre el proceso de garantía.

        </p>

        <div className="faq-grid">

          <details>

            <summary>

              ¿Necesito presentar la factura?

              <ChevronDown size={18}/>

            </summary>

            <p>

              Sí. Es indispensable presentar el comprobante de compra para
              validar la garantía.

            </p>

          </details>

          <details>

            <summary>

              ¿Cuánto tarda una garantía?

              <ChevronDown size={18}/>

            </summary>

            <p>

              El tiempo dependerá del diagnóstico técnico y de la respuesta del
              fabricante.

            </p>

          </details>

          <details>

            <summary>

              ¿Puedo enviar el equipo por paquetería?

              <ChevronDown size={18}/>

            </summary>

            <p>

              Sí, siempre que el producto viaje correctamente protegido y con la
              documentación requerida.

            </p>

          </details>

          <details>

            <summary>

              ¿Qué sucede si el producto ya no tiene garantía?

              <ChevronDown size={18}/>

            </summary>

            <p>

              Nuestro equipo podrá orientarte sobre las alternativas disponibles
              para reparación o servicio técnico.

            </p>

          </details>

        </div>

      </section>

    </main>
    <SiteFooter />
    </>
  );

}