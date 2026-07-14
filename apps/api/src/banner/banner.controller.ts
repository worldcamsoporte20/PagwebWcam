import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import {
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";

import { BannerService } from "./banner.service";

@Controller("banner")
export class BannerController {
  constructor(
    private readonly bannerService: BannerService
  ) {}

  // ==========================
  // OBTENER TODOS LOS BANNERS
  // ==========================

  @Get()
  obtenerBanners() {
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
      return [];
    }

    const archivos = readdirSync(carpeta);

    return archivos
      .filter((archivo) =>
        /^banner-\d+\.(jpg|jpeg|png|webp)$/i.test(archivo)
      )
      .sort((a, b) => {
        const numA = Number(
          a.match(/banner-(\d+)/i)?.[1] || 0
        );

        const numB = Number(
          b.match(/banner-(\d+)/i)?.[1] || 0
        );

        return numA - numB;
      })
      .map((archivo) => ({
        title: archivo.replace(/\.[^.]+$/, ""),
        image: `/images/banner/${archivo}`,
        filename: archivo,
      }));
  }

  // ==========================
  // ELIMINAR TODOS LOS BANNERS
  // ==========================

  @Delete()
  eliminarTodosLosBanners() {
    return this.bannerService.eliminarBanners();
  }

  // ==========================
  // ELIMINAR UN SOLO BANNER
  // ==========================

  @Delete(":nombre")
  eliminarBanner(
    @Param("nombre") nombre: string
  ) {
    return this.bannerService.eliminarBanner(nombre);
  }

  // ==========================
  // SUBIR NUEVO BANNER
  // ==========================

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("imagen", {
      storage: diskStorage({
        destination: (
          req,
          file,
          callback
        ) => {
          const ruta = join(
            __dirname,
            "..",
            "..",
            "..",
            "web",
            "public",
            "images",
            "banner"
          );

          try {
            mkdirSync(ruta, {
              recursive: true,
            });

            console.log(
              "Guardando banner en:",
              ruta
            );

            callback(null, ruta);
          } catch (error) {
            console.error(
              "Error al crear la carpeta del banner:",
              error
            );

            callback(
              new Error(
                "No se pudo crear la carpeta del banner."
              ),
              ruta
            );
          }
        },

        filename: (
          req,
          file,
          callback
        ) => {
          const extension = extname(
            file.originalname
          ).toLowerCase();

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

          try {
            mkdirSync(carpeta, {
              recursive: true,
            });

            let numero = 1;

            const archivos = readdirSync(carpeta);

            const numeros = archivos
              .filter((archivo) =>
                /^banner-\d+\.(jpg|jpeg|png|webp)$/i.test(
                  archivo
                )
              )
              .map((archivo) =>
                Number(
                  archivo.match(
                    /banner-(\d+)/i
                  )?.[1] || 0
                )
              );

            if (numeros.length > 0) {
              numero =
                Math.max(...numeros) + 1;
            }

            const nombre =
              `banner-${numero}${extension}`;

            console.log(
              "Nombre generado:",
              nombre
            );

            callback(null, nombre);
          } catch (error) {
            console.error(
              "Error al generar el nombre del banner:",
              error
            );

            callback(
              new Error(
                "No se pudo generar el nombre del banner."
              ),
              ""
            );
          }
        },
      }),

      fileFilter: (
        req,
        file,
        callback
      ) => {
        const extension = extname(
          file.originalname
        ).toLowerCase();

        const extensionesPermitidas = [
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
        ];

        if (
          !extensionesPermitidas.includes(
            extension
          )
        ) {
          return callback(
            new BadRequestException(
              "Solo se permiten imágenes JPG, JPEG, PNG o WEBP."
            ),
            false
          );
        }

        callback(null, true);
      },

      limits: {
        fileSize: 8 * 1024 * 1024,
      },
    })
  )
  subirBanner(
    @UploadedFile()
    archivo: Express.Multer.File
  ) {
    if (!archivo) {
      throw new BadRequestException(
        "No se recibió ninguna imagen."
      );
    }

    console.log(
      "Banner guardado correctamente:",
      archivo.filename
    );

    return this.bannerService.bannerActualizado(
      archivo.filename
    );
  }
}