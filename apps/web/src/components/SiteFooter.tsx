"use client";

import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";

const sitemapSections = [
  {
    title: "Comprar",
    links: [
      { label: "Catálogo", href: "/catalogo" },
      { label: "Promociones", href: "/promociones" },
      { label: "Cupones", href: "/cupones" },
      { label: "Carrito", href: "/carrito" },
    ],
  },
  {
    title: "WorldCam",
    links: [
      { label: "Sucursales", href: "/sucursales" },
      { label: "Distribuidores", href: "/distribuidor" },
      { label: "Contacto", href: "/contacto" },
      { label: "Facturación", href: "/facturacion" },
    ],
  },
  {
    title: "Ayuda y legal",
    links: [
      { label: "Mi cuenta", href: "/cuenta" },
      { label: "Política de garantía", href: "/poli_garantia" },
      { label: "Aviso de privacidad", href: "/avisosprivacidad" },
      { label: "Unete al equipo", href: "/unete-al-equipo" },
    ],
  },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/WorldCamMexico/",
    icon: <FaFacebookF aria-hidden="true" />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/worldcamdemexico/?hl=es",
    icon: <FaInstagram aria-hidden="true" />,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@worldcamdemexico",
    icon: <FaTiktok aria-hidden="true" />,
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/" className="footer-logo" aria-label="WorldCam, inicio">
              <img
                src="/images/logo/logo_redondo.png"
                alt="WorldCam"
                width={283}
                height={80}
                className="footer-logo-image"
              />
            </Link>
            <p>Soluciones de seguridad y tecnología para proteger lo que más importa.</p>
            <div className="footer-contact">
              <a href="tel:+522228201289">
                <FaPhoneAlt aria-hidden="true" />
                <span>(222) 820 1289</span>
              </a>
              <a
                href="https://wa.me/522228201289"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-whatsapp"
              >
                <FaWhatsapp aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </div>
            <div className="footer-socials" aria-label="Redes sociales">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visitar WorldCam en ${social.label}`}
                  title={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <nav className="footer-sitemap" aria-label="Mapa del sitio">
            {sitemapSections.map((section) => (
              <div className="footer-links" key={section.title}>
                <h2>{section.title}</h2>
                <ul>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} WorldCam de México. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
