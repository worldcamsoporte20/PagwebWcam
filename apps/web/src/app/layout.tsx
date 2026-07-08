import type { Metadata, Viewport } from "next";
// Suppress missing type declarations for side-effect CSS import
// @ts-ignore
import "./globals.css";

export const metadata: Metadata = {
  title: "Worldcam | Camaras de seguridad",
  description: "Promociones en camaras de seguridad, CCTV, NVR, alarmas y control de acceso.",
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
