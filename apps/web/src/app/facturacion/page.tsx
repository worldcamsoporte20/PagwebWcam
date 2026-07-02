import {
    FileText,
    User,
    BadgeCheck,
    Receipt,
    CalendarDays,
    CircleDollarSign,
    TriangleAlert,
    Phone,
    Clock3,
    HeartHandshake,
} from "lucide-react";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function Facturacion() {
    return (
        <>
            <SiteHeader active="home" />
            <main className="facturacion-container">

            {/* Hero */}
            <section className="facturacion-hero">
                <div className="hero-content">
                    <span className="hero-badge">FACTURACIÓN</span>

                    <h1>Información de Facturación</h1>

                    <p>
                        Conoce los requisitos necesarios para solicitar tu factura de
                        manera rápida y sencilla.
                    </p>
                </div>

                <div className="hero-icon">
                    <FileText size={110} />
                </div>
            </section>

            {/* Requisitos */}

            <section className="facturacion-section">

                <h2>Datos necesarios para la emisión de factura</h2>

                <div className="cards-grid">

                    <div className="info-card">
                        <div className="icon">
                            <User size={48} />
                        </div>
                        <h3>Nombre o razón social</h3>
                        <p>Nombre registrado ante el SAT.</p>
                    </div>

                    <div className="info-card">
                        <div className="icon">
                            <BadgeCheck size={48} />
                        </div>
                        <h3>RFC</h3>
                        <p>Registro Federal de Contribuyentes.</p>
                    </div>

                    <div className="info-card">
                        <div className="icon">
                            <Receipt size={48} />
                        </div>
                        <h3>Número de pedido</h3>
                        <p>Pedido, nota o ticket de compra.</p>
                    </div>

                    <div className="info-card">
                        <div className="icon">
                            <CircleDollarSign size={48} />
                        </div>
                        <h3>Importe</h3>
                        <p>Total pagado en la compra.</p>
                    </div>

                    <div className="info-card center-card">
                        <div className="icon">
                            <CalendarDays size={48} />
                        </div>

                        <h3>Fecha de compra</h3>

                        <p>Fecha indicada en el ticket de compra.</p>
                    </div>
                </div>



            </section>

            {/* Aviso Importante */}

            <section className="warning-box">

                <div className="warning-icon">
                    <TriangleAlert size={45} />
                </div>

                <div>

                    <h2>Importante</h2>

                    <p>
                        Las facturas deben solicitarse <strong>al momento de realizar la compra.</strong>
                    </p>

                    <p>
                        Una vez emitida la factura, <strong>no será posible modificar los datos fiscales.</strong>
                    </p>

                </div>

            </section>

            {/* Proceso */}

            <section className="facturacion-section">

                <h2>¿Cómo solicitar tu factura?</h2>

                <div className="timeline">

                    <div className="step-card">
                        <span>1</span>
                        <h3>Realiza tu compra</h3>
                    </div>

                    <div className="arrow">➜</div>

                    <div className="step-card">
                        <span>2</span>
                        <h3>Conserva tu ticket</h3>
                    </div>

                    <div className="arrow">➜</div>

                    <div className="step-card">
                        <span>3</span>
                        <h3>Reúne tus datos fiscales</h3>
                    </div>

                    <div className="arrow">➜</div>

                    <div className="step-card">
                        <span>4</span>
                        <h3>Contacta al área de facturación</h3>
                    </div>

                    <div className="arrow">➜</div>

                    <div className="step-card">
                        <span>5</span>
                        <h3>Recibe tu CFDI</h3>
                    </div>

                </div>

            </section>

            {/* Contacto */}

            <section className="facturacion-section">

                <h2>¿Necesitas ayuda?</h2>

                <div className="contact-grid">

                    <div className="contact-card">

                        <div className="contact-icon">
                            <Phone size={48} />
                        </div>

                        <h3>Atención al Cliente</h3>

                        <p>Comunícate con nuestro departamento de facturación.</p>

                        <a href="tel:2221770615">
                            222 177 0615
                        </a>

                    </div>

                    <div className="contact-card">

                        <div className="contact-icon">
                            <Clock3 size={48} />
                        </div>

                        <h3>Horario de Atención</h3>

                        <p>Lunes a Viernes</p>

                        <strong>09:00 - 19:00</strong>

                        <p style={{ marginTop: "15px" }}>Sábado</p>

                        <strong>09:00 - 16:30</strong>

                    </div>

                </div>

            </section>
            <section className="thanks-section">

                <div className="thanks-icon">
                    <HeartHandshake size={55} />
                </div>

                <h2>Gracias por confiar en Worldcam</h2>

                <p>
                    Agradecemos tu preferencia y confianza en <strong>Worldcam</strong>.
                    Nuestro equipo está comprometido en brindarte un servicio rápido,
                    seguro y eficiente para la emisión de tu factura.
                </p>

                <p>
                    Si tienes alguna duda durante el proceso, no dudes en comunicarte con
                    nosotros. Estaremos encantados de ayudarte.
                </p>

            </section>

            {/* Preguntas frecuentes */}

            <section className="facturacion-section">

                <h2>Preguntas Frecuentes</h2>

                <div className="faq">

                    <details>

                        <summary>¿Cuándo debo solicitar mi factura?</summary>

                        <p>
                            Las facturas deben solicitarse al momento de realizar la compra.
                        </p>

                    </details>

                    <details>

                        <summary>¿Puedo modificar mi RFC después?</summary>

                        <p>
                            No. Una vez emitida la factura no será posible modificar los datos fiscales.
                        </p>

                    </details>

                    <details>

                        <summary>¿Qué datos necesito?</summary>

                        <p>
                            RFC, razón social, número de pedido o ticket, importe y fecha de compra.
                        </p>

                    </details>

                    <details>

                        <summary>¿Cuál es el horario de atención?</summary>

                        <p>
                            Lunes a Viernes de 09:00 a 19:00 hrs.
                            Sábados de 09:00 a 16:30 hrs.
                        </p>

                    </details>

                </div>

            </section>

        </main>
            <SiteFooter />
        </>
    );
}