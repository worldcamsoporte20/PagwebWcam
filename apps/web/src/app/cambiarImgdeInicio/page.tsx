"use client";

import Image from "next/image";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Banner = {
  title: string;
  image: string;
  filename: string;
};

type RespuestaApi = {
  ok?: boolean;
  mensaje?: string;
  message?: string | string[];
};

export default function CambiarImagenInicio() {
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [banners, setBanners] = useState<Banner[]>([]);
  const [cargandoBanners, setCargandoBanners] = useState(true);

  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoTodos, setEliminandoTodos] = useState(false);
  const [eliminandoNombre, setEliminandoNombre] = useState("");

  const [mensaje, setMensaje] = useState("");

  const inputArchivoRef = useRef<HTMLInputElement>(null);

  function obtenerMensajeError(
    datos: unknown,
    mensajePredeterminado: string
  ) {
    if (typeof datos === "string" && datos.trim()) {
      return datos;
    }

    if (
      typeof datos === "object" &&
      datos !== null &&
      "message" in datos
    ) {
      const respuestaError = datos as RespuestaApi;

      if (Array.isArray(respuestaError.message)) {
        return respuestaError.message.join(", ");
      }

      if (respuestaError.message) {
        return respuestaError.message;
      }
    }

    return mensajePredeterminado;
  }

  async function cargarBanners() {
    try {
      setCargandoBanners(true);

      const respuesta = await fetch(
        `${API_URL}/api/banner?t=${Date.now()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los banners.");
      }

      const datos: Banner[] = await respuesta.json();

      if (!Array.isArray(datos)) {
        setBanners([]);
        return;
      }

      const version = Date.now();

      const bannersActualizados = datos.map((banner) => ({
        ...banner,
        image: `${banner.image}?v=${version}`,
      }));

      setBanners(bannersActualizados);
    } catch (error) {
      console.error("Error al cargar los banners:", error);
      setBanners([]);
    } finally {
      setCargandoBanners(false);
    }
  }

  useEffect(() => {
    cargarBanners();
  }, []);

  function seleccionarImagen(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const archivo = evento.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setImagen(null);
      setPreview("");
      setMensaje(
        "❌ El archivo seleccionado no es una imagen."
      );
      return;
    }

    const limiteBytes = 8 * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      setImagen(null);
      setPreview("");
      setMensaje(
        "❌ La imagen no puede pesar más de 8 MB."
      );
      return;
    }

    setImagen(archivo);
    setPreview(URL.createObjectURL(archivo));
    setMensaje("");
  }

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function limpiarSeleccion() {
    setImagen(null);
    setPreview("");

    if (inputArchivoRef.current) {
      inputArchivoRef.current.value = "";
    }
  }

  async function subirImagen() {
    if (!imagen) {
      setMensaje("❌ Selecciona una imagen.");
      return;
    }

    const controlador = new AbortController();

    const temporizador = window.setTimeout(() => {
      controlador.abort();
    }, 30000);

    try {
      setSubiendo(true);
      setMensaje("");

      const formData = new FormData();
      formData.append("imagen", imagen);

      const respuesta = await fetch(
        `${API_URL}/api/banner/upload`,
        {
          method: "POST",
          body: formData,
          signal: controlador.signal,
        }
      );

      const tipoContenido =
        respuesta.headers.get("content-type");

      let datos: unknown;

      if (tipoContenido?.includes("application/json")) {
        datos = await respuesta.json();
      } else {
        datos = await respuesta.text();
      }

      if (!respuesta.ok) {
        throw new Error(
          obtenerMensajeError(
            datos,
            "No se pudo subir la imagen."
          )
        );
      }

      limpiarSeleccion();
      await cargarBanners();

      setMensaje(
        "✅ Imagen agregada correctamente al carrusel."
      );
    } catch (error: unknown) {
      console.error("Error al subir el banner:", error);

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        setMensaje(
          "❌ La petición tardó demasiado. Revisa que la API esté encendida."
        );
      } else if (error instanceof TypeError) {
        setMensaje(
          "❌ No se pudo conectar con el servidor en el puerto 4000."
        );
      } else if (error instanceof Error) {
        setMensaje(`❌ ${error.message}`);
      } else {
        setMensaje(
          "❌ Ocurrió un error desconocido al subir la imagen."
        );
      }
    } finally {
      window.clearTimeout(temporizador);
      setSubiendo(false);
    }
  }

  async function eliminarBanner(banner: Banner) {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar ${banner.title}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setEliminandoNombre(banner.filename);
      setMensaje("");

      const respuesta = await fetch(
        `${API_URL}/api/banner/${encodeURIComponent(
          banner.filename
        )}`,
        {
          method: "DELETE",
        }
      );

      const datos: RespuestaApi = await respuesta.json();

      if (!respuesta.ok || datos.ok === false) {
        throw new Error(
          datos.mensaje ??
            obtenerMensajeError(
              datos,
              "No se pudo eliminar el banner."
            )
        );
      }

      await cargarBanners();

      setMensaje(
        `✅ ${
          datos.mensaje ?? "Banner eliminado correctamente."
        }`
      );
    } catch (error: unknown) {
      console.error(
        "Error al eliminar el banner:",
        error
      );

      if (error instanceof TypeError) {
        setMensaje(
          "❌ No se pudo conectar con el servidor en el puerto 4000."
        );
      } else if (error instanceof Error) {
        setMensaje(`❌ ${error.message}`);
      } else {
        setMensaje(
          "❌ Ocurrió un error al eliminar el banner."
        );
      }
    } finally {
      setEliminandoNombre("");
    }
  }

  async function eliminarTodosLosBanners() {
    if (banners.length === 0) {
      setMensaje("❌ No existen banners para eliminar.");
      return;
    }

    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar todos los banners? Esta acción no se puede deshacer."
    );

    if (!confirmar) {
      return;
    }

    try {
      setEliminandoTodos(true);
      setMensaje("");

      const respuesta = await fetch(
        `${API_URL}/api/banner`,
        {
          method: "DELETE",
        }
      );

      const datos: RespuestaApi = await respuesta.json();

      if (!respuesta.ok || datos.ok === false) {
        throw new Error(
          datos.mensaje ??
            obtenerMensajeError(
              datos,
              "No se pudieron eliminar los banners."
            )
        );
      }

      setBanners([]);
      limpiarSeleccion();

      setMensaje(
        `✅ ${
          datos.mensaje ??
          "Todos los banners fueron eliminados."
        }`
      );
    } catch (error: unknown) {
      console.error(
        "Error al eliminar los banners:",
        error
      );

      if (error instanceof TypeError) {
        setMensaje(
          "❌ No se pudo conectar con el servidor en el puerto 4000."
        );
      } else if (error instanceof Error) {
        setMensaje(`❌ ${error.message}`);
      } else {
        setMensaje(
          "❌ Ocurrió un error al eliminar los banners."
        );
      }
    } finally {
      setEliminandoTodos(false);
    }
  }

  const procesando =
    subiendo ||
    eliminandoTodos ||
    eliminandoNombre !== "";

  return (
    <main className="cambiarBannerContenedor">
      <div className="cambiarBannerTarjeta">
        <h1 className="cambiarBannerTitulo">
          Administrar banners
        </h1>

        <p className="cambiarBannerTexto">
          Agrega nuevas imágenes al carrusel o elimina
          únicamente los banners que ya no deseas mostrar.
        </p>

        <section className="cambiarBannerSeccion">
          <h2 className="cambiarBannerSubtitulo">
            Agregar nuevo banner
          </h2>

          <div className="cambiarBannerPreview">
            {preview ? (
              <Image
                src={preview}
                alt="Vista previa del banner seleccionado"
                fill
                sizes="700px"
                className="cambiarBannerImagen"
                unoptimized
              />
            ) : (
              <span>No hay imagen seleccionada</span>
            )}
          </div>

          <input
            ref={inputArchivoRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={seleccionarImagen}
            className="cambiarBannerInput"
            disabled={procesando}
          />

          <button
            type="button"
            onClick={subirImagen}
            disabled={procesando || !imagen}
            className="cambiarBannerBoton"
          >
            {subiendo
              ? "Subiendo imagen..."
              : "Agregar imagen"}
          </button>
        </section>

        <section className="cambiarBannerSeccion">
          <div className="cambiarBannerEncabezadoLista">
            <div>
              <h2 className="cambiarBannerSubtitulo">
                Banners actuales
              </h2>

              <p className="cambiarBannerCantidad">
                {banners.length} banner
                {banners.length === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={eliminarTodosLosBanners}
              disabled={
                procesando ||
                cargandoBanners ||
                banners.length === 0
              }
              className="cambiarBannerBotonEliminarTodos"
            >
              {eliminandoTodos
                ? "Eliminando..."
                : "Eliminar todos"}
            </button>
          </div>

          {cargandoBanners ? (
            <p className="cambiarBannerEstadoLista">
              Cargando banners...
            </p>
          ) : banners.length === 0 ? (
            <p className="cambiarBannerEstadoLista">
              No existen banners guardados.
            </p>
          ) : (
            <div className="cambiarBannerGaleria">
              {banners.map((banner) => (
                <article
                  key={banner.filename}
                  className="cambiarBannerElemento"
                >
                  <div className="cambiarBannerMiniatura">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 350px"
                      className="cambiarBannerMiniaturaImagen"
                      unoptimized
                    />
                  </div>

                  <div className="cambiarBannerElementoInfo">
                    <p className="cambiarBannerNombre">
                      {banner.title}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarBanner(banner)
                      }
                      disabled={procesando}
                      className="cambiarBannerBotonEliminar"
                    >
                      {eliminandoNombre === banner.filename
                        ? "Eliminando..."
                        : "Eliminar este banner"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {mensaje && (
          <p
            className="cambiarBannerMensaje"
            role="status"
          >
            {mensaje}
          </p>
        )}
      </div>
    </main>
  );
}