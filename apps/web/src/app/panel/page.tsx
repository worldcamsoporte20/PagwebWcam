"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Upload,
  ShoppingCart,
  Tags,
  Filter,
  Users,
  UserCog,
  LayoutGrid,
  Images,
  ImagePlus,
  Package,
  Boxes,
  FolderTree,
  SlidersHorizontal,
  Eye,
  Megaphone,
  FileText,
  BarChart3,
  Newspaper,
  Wrench,
  GraduationCap,
} from "lucide-react";

const modulos = [
  {
    nombre: "Subir ZIP",
    icono: <Upload size={38} />,
    ruta: "#",
  },
  {
    nombre: "Ventas",
    icono: <ShoppingCart size={38} />,
    ruta: "#",
  },
  {
    nombre: "Etiquetas",
    icono: <Tags size={38} />,
    ruta: "#",
  },
  {
    nombre: "Filtros",
    icono: <Filter size={38} />,
    ruta: "#",
  },
  {
    nombre: "Clientes / Vendedores",
    icono: <Users size={38} />,
    ruta: "#",
  },
  {
    nombre: "Vendedores / Bodega",
    icono: <UserCog size={38} />,
    ruta: "#",
  },
  {
    nombre: "Secciones",
    icono: <LayoutGrid size={38} />,
    ruta: "#",
  },
  {
    nombre: "Galería de Imágenes",
    icono: <Images size={38} />,
    ruta: "#",
  },
  {
    nombre: "Ingredientes",
    icono: <Boxes size={38} />,
    ruta: "#",
  },
  {
    nombre: "Fotos de Productos",
    icono: <Images size={38} />,
    ruta: "#",
  },
  {
    nombre: "Productos",
    icono: <Package size={38} />,
    ruta: "#",
  },
  {
    nombre: "Marcas",
    icono: <Boxes size={38} />,
    ruta: "#",
  },
  {
    nombre: "Categorías",
    icono: <FolderTree size={38} />,
    ruta: "#",
  },
  {
    nombre: "Variables",
    icono: <SlidersHorizontal size={38} />,
    ruta: "#",
  },
  {
    nombre: "Visitas",
    icono: <Eye size={38} />,
    ruta: "#",
  },
  {
    nombre: "Promociones",
    icono: <Megaphone size={38} />,
    ruta: "#",
  },

  /* NUEVO MÓDULO */

  {
    nombre: "Cambiar Imagen de Inicio",
    icono: <ImagePlus size={38} />,
    ruta: "/cambiarImgdeInicio",
  },

  {
    nombre: "Artículos PDF",
    icono: <FileText size={38} />,
    ruta: "#",
  },
  {
    nombre: "Estadísticas",
    icono: <BarChart3 size={38} />,
    ruta: "#",
  },
  {
    nombre: "Publicidad Hot Sale",
    icono: <Newspaper size={38} />,
    ruta: "#",
  },
  {
    nombre: "Utilidades",
    icono: <Wrench size={38} />,
    ruta: "#",
  },
  {
    nombre: "Venta Profesional",
    icono: <ShoppingCart size={38} />,
    ruta: "#",
  },
  {
  nombre: "Cursos",
  icono: <GraduationCap size={38} />,
  ruta: "/cursos_panel",
},
];

export default function PanelAdministrador() {
  return (
    <main className="panelAdminContenedor">

      <header className="panelAdminEncabezado">

        <div className="panelAdminLogo">
          <Image
            src="/images/logo/logo.png"
            alt="WorldCam"
            width={170}
            height={70}
            priority
          />
        </div>

        <div className="panelAdminTitulo">
          <h1>Panel Administrativo</h1>
          <p>Sistema de administración WorldCam de México</p>
        </div>

        <div className="panelAdminUsuario">
          <span>Administrador</span>
        </div>

      </header>

      <section className="panelAdminContenido">

        <div className="panelAdminGrid">

          {modulos.map((modulo) => (
            <Link
              key={modulo.nombre}
              href={modulo.ruta}
              className="panelAdminTarjeta"
            >
              <div className="panelAdminIcono">
                {modulo.icono}
              </div>

              <h3 className="panelAdminNombre">
                {modulo.nombre}
              </h3>
            </Link>
          ))}

        </div>

      </section>

    </main>
  );
}