import type { Metadata, Viewport } from "next";
// Suppress missing type declarations for side-effect CSS import
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "WorldCam México | Cámaras de seguridad y videovigilancia",
  description: "Compra cámaras de seguridad, CCTV, NVR, alarmas, redes y control de acceso con envíos a todo México, asesoría especializada y pagos seguros.",
  keywords: [
    "cámaras de seguridad",
    "videovigilancia",
    "CCTV",
    "Dahua México",
    "NVR",
    "alarmas",
    "control de acceso",
    "WorldCam México",
  ],
  openGraph: {
    title: "WorldCam México | Tecnología que protege",
    description: "Soluciones de videovigilancia, redes y conectividad para proyectos de todos los tamaños.",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldCam México | Cámaras de seguridad",
    description: "Videovigilancia, redes y conectividad con envíos a todo México.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
