"use client";

import {
    ShieldCheck,
    User,
    MapPin,
    Phone,
    Mail,
    FileText,
    Cookie,
    Lock,
    Scale,
    CheckCircle,
    RefreshCw
} from "lucide-react";

import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export default function PoliticasPrivacidad() {

    return (
      <>
      <SiteHeader active="home" />
        <main className="privacidad-container">

            {/* HERO */}

            <section className="privacidad-hero">

                <div className="hero-content">

                    <span className="hero-badge">
                        WORLDCAM DE MEXICO SA DE CV
                    </span>

                    <h1>Aviso de Privacidad</h1>

                    <p>
                        En <strong>Worldcam de México</strong> protegemos la información
                        personal de nuestros clientes y nos comprometemos a tratar sus datos
                        con responsabilidad, transparencia y conforme a la legislación vigente.
                    </p>

                </div>

                <div className="hero-icon">
                    <ShieldCheck size={120} />
                </div>

            </section>


            {/* DATOS PERSONALES */}

            <section className="privacidad-section">

                <h2>Datos personales que recopilamos</h2>

                <p className="subtitle">
                    Para brindarte un mejor servicio podremos solicitar la siguiente información.
                </p>

                <div className="cards-grid">

                    <div className="info-card">
                        <User className="icon" />
                        <h3>Nombre completo</h3>
                    </div>

                    <div className="info-card">
                        <FileText className="icon" />
                        <h3>RFC</h3>
                    </div>

                    <div className="info-card">
                        <MapPin className="icon" />
                        <h3>Dirección de Facturación</h3>
                    </div>

                    <div className="info-card">
                        <MapPin className="icon" />
                        <h3>Dirección de Envío</h3>
                    </div>

                    <div className="info-card">
                        <Phone className="icon" />
                        <h3>Teléfono</h3>
                    </div>

                    <div className="info-card">
                        <Mail className="icon" />
                        <h3>Correo Electrónico</h3>
                    </div>

                </div>

                <div className="warning-box">

                    <div className="warning-icon">
                        !
                    </div>

                    <div>

                        <h2>Importante</h2>

                        <p>
                            <strong>Worldcam de México no solicita datos personales sensibles</strong> mediante este sitio web.
                        </p>

                    </div>

                </div>

            </section>


            {/* COOKIES */}

            <section className="privacidad-section">

                <h2>Uso de Cookies</h2>

                <div className="cookies-card">

                    <Cookie size={65} />

                    <p>

                        Utilizamos cookies para mejorar tu experiencia de navegación,
                        recordar tus preferencias, analizar el tráfico del sitio y
                        ofrecerte un servicio más personalizado.

                    </p>

                    <p>

                        Puedes administrar o desactivar las cookies desde la configuración
                        de tu navegador en cualquier momento.

                    </p>

                </div>

            </section>


            {/* USO */}

            <section className="privacidad-section">

                <h2>¿Para qué utilizamos tu información?</h2>

                <div className="cards-grid">

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Procesar compras</h3>
                    </div>

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Facturación</h3>
                    </div>

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Envío de productos</h3>
                    </div>

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Atención al cliente</h3>
                    </div>

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Nuevos productos</h3>
                    </div>

                    <div className="info-card">
                        <CheckCircle className="icon" />
                        <h3>Mejorar nuestros servicios</h3>
                    </div>

                </div>

            </section>


            {/* SEGURIDAD */}

            <section className="security-box">

                <Lock size={70} />

                <div>

                    <h2>Protección de tu información</h2>

                    <p>

                        La información enviada durante el proceso de compra se protege
                        mediante conexiones seguras (SSL) y plataformas confiables para
                        garantizar la confidencialidad de tus datos.

                    </p>

                </div>

            </section>


            {/* ARCO */}

            <section className="privacidad-section">

                <h2>Derechos ARCO</h2>

                <p className="subtitle">
                    Puedes ejercer tus derechos en cualquier momento.
                </p>

                <div className="cards-grid">

                    <div className="info-card">
                        <Scale className="icon" />
                        <h3>Acceso</h3>
                        <p>Consultar los datos personales registrados.</p>
                    </div>

                    <div className="info-card">
                        <Scale className="icon" />
                        <h3>Rectificación</h3>
                        <p>Corregir información incorrecta o incompleta.</p>
                    </div>

                    <div className="info-card">
                        <Scale className="icon" />
                        <h3>Cancelación u Oposición</h3>
                        <p>Solicitar la eliminación o limitar el uso de tus datos.</p>
                    </div>

                </div>

            </section>


            {/* CONTACTO */}

            <section className="privacidad-thanks">

                <div className="thanks-icon">
                    <Mail size={55} />
                </div>

                <h2>Contacto para privacidad</h2>

                <p>

                    Si deseas ejercer tus derechos ARCO o tienes dudas sobre el
                    tratamiento de tus datos personales, puedes comunicarte con nosotros.

                </p>

                <strong>
                    privacidad@worldcamdemexico.com
                </strong>

                <strong>
                    Tel. 232-1958 Ext. 101
                </strong>

            </section>


            {/* ACTUALIZACIÓN */}

            <section className="update-card">

                <RefreshCw size={45} />

                <h3>Última actualización</h3>

                <p>
                    31 de mayo de 2020
                </p>

            </section>

        </main>
        <SiteFooter/>
      </>
    );

}
