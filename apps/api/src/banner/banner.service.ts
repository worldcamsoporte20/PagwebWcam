import { Injectable } from "@nestjs/common";
import { existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

@Injectable()
export class BannerService {
  bannerActualizado(nombreArchivo: string) {
    return {
      ok: true,
      mensaje: "Banner actualizado correctamente.",
      archivo: nombreArchivo,
      ruta: `/images/banner/${nombreArchivo}`,
    };
  }

  eliminarBanners() {
    const carpeta = join(
      __dirname,
      "..",
      "..",
      "..",
      "web",
      "public",
      "images",
      "banner"
    );

    if (!existsSync(carpeta)) {
      return {
        ok: true,
        mensaje: "No existen banners para eliminar.",
      };
    }

    const archivos = readdirSync(carpeta);

    archivos
      .filter((archivo) => archivo.startsWith("banner-"))
      .forEach((archivo) => {
        unlinkSync(join(carpeta, archivo));
      });

    return {
      ok: true,
      mensaje: "Todos los banners fueron eliminados.",
    };
  }
  eliminarBanner(nombreArchivo: string) {
  const carpeta = join(
    __dirname,
    "..",
    "..",
    "..",
    "web",
    "public",
    "images",
    "banner"
  );

  const rutaArchivo = join(carpeta, nombreArchivo);

  if (!existsSync(rutaArchivo)) {
    return {
      ok: false,
      mensaje: "El banner no existe.",
    };
  }

  unlinkSync(rutaArchivo);

  return {
    ok: true,
    mensaje: "Banner eliminado correctamente.",
  };
}
}