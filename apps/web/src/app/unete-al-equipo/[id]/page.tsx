"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
  UserRound,
  WalletCards,
} from "lucide-react";

type Vacante = {
  id: number;
  titulo: string;
  area: string;
  ubicacion: string;
  modalidad: string;
  tipoEmpleo: string;
  horario: string;
  sueldo: string;
  descripcion: string;
  requisitos: string;
  funciones: string;
  activa: boolean;
  fechaPublicacion: string;
};

type Postulacion = {
  id: number;
  vacanteId: number;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string;
  ciudad: string;
  escolaridad: string;
  experiencia: string;
  mensaje: string;
  fechaPostulacion: string;
};

const formularioInicial = {
  nombre: "",
  apellidos: "",
  correo: "",
  telefono: "",
  ciudad: "",
  escolaridad: "",
  experiencia: "",
  mensaje: "",
};

export default function DetalleVacante() {
  const parametros = useParams();

  const idParametro = Array.isArray(parametros.id)
    ? parametros.id[0]
    : parametros.id;

  const idVacante = Number(idParametro);

  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [datosCargados, setDatosCargados] = useState(false);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [mensajeEstado, setMensajeEstado] = useState("");
  const [postulacionEnviada, setPostulacionEnviada] =
    useState(false);

  useEffect(() => {
    try {
      const vacantesGuardadas = localStorage.getItem(
        "worldcam-vacantes"
      );

      if (!vacantesGuardadas) {
        setDatosCargados(true);
        return;
      }

      const datos: Vacante[] = JSON.parse(vacantesGuardadas);

      if (!Array.isArray(datos)) {
        setDatosCargados(true);
        return;
      }

      const vacanteEncontrada = datos.find(
        (elemento) => elemento.id === idVacante
      );

      if (vacanteEncontrada && vacanteEncontrada.activa) {
        setVacante(vacanteEncontrada);
      }
    } catch (error) {
      console.error(
        "No se pudo recuperar la vacante:",
        error
      );
    } finally {
      setDatosCargados(true);
    }
  }, [idVacante]);

  function actualizarCampo(
    evento: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >
  ) {
    const { name, value } = evento.target;

    setFormulario((datosAnteriores) => ({
      ...datosAnteriores,
      [name]: value,
    }));

    setMensajeEstado("");
  }

  function enviarPostulacion(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!vacante) return;

    if (
      !formulario.nombre.trim() ||
      !formulario.apellidos.trim() ||
      !formulario.correo.trim() ||
      !formulario.telefono.trim() ||
      !formulario.escolaridad.trim() ||
      !formulario.experiencia.trim()
    ) {
      setMensajeEstado(
        "Completa todos los campos obligatorios."
      );

      return;
    }

    try {
      const postulacionesGuardadas = localStorage.getItem(
        "worldcam-postulaciones"
      );

      let postulaciones: Postulacion[] = [];

      if (postulacionesGuardadas) {
        const datos = JSON.parse(postulacionesGuardadas);

        if (Array.isArray(datos)) {
          postulaciones = datos;
        }
      }

      const yaSePostulo = postulaciones.some(
        (postulacion) =>
          postulacion.vacanteId === vacante.id &&
          postulacion.correo
            .trim()
            .toLowerCase() ===
            formulario.correo.trim().toLowerCase()
      );

      if (yaSePostulo) {
        setMensajeEstado(
          "Este correo ya fue registrado en esta vacante."
        );

        return;
      }

      const nuevaPostulacion: Postulacion = {
        id: Date.now(),
        vacanteId: vacante.id,
        nombre: formulario.nombre.trim(),
        apellidos: formulario.apellidos.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim(),
        ciudad: formulario.ciudad.trim(),
        escolaridad: formulario.escolaridad,
        experiencia: formulario.experiencia.trim(),
        mensaje: formulario.mensaje.trim(),
        fechaPostulacion: new Date().toLocaleDateString(
          "es-MX"
        ),
      };

      const postulacionesActualizadas = [
        nuevaPostulacion,
        ...postulaciones,
      ];

      localStorage.setItem(
        "worldcam-postulaciones",
        JSON.stringify(postulacionesActualizadas)
      );

      setFormulario(formularioInicial);
      setMensajeEstado("");
      setPostulacionEnviada(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "No se pudo guardar la postulación:",
        error
      );

      setMensajeEstado(
        "No se pudo enviar la postulación. Inténtalo nuevamente."
      );
    }
  }

  if (!datosCargados) {
    return (
      <main className="detalleVacantePagina">
        <section className="detalleVacanteEstado">
          <BriefcaseBusiness size={45} />

          <h1>Cargando vacante</h1>

          <p>
            Estamos consultando la información del puesto.
          </p>
        </section>
      </main>
    );
  }

  if (!vacante) {
    return (
      <main className="detalleVacantePagina">
        <section className="detalleVacanteEstado">
          <BriefcaseBusiness size={45} />

          <h1>Vacante no disponible</h1>

          <p>
            Esta vacante no existe, fue eliminada o ya no se
            encuentra activa.
          </p>

          <Link
            href="/unete-al-equipo"
            className="detalleVacanteEstadoBoton"
          >
            <ArrowLeft size={17} />
            Ver vacantes disponibles
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="detalleVacantePagina">
      <section className="detalleVacanteHero">
        <div className="detalleVacanteHeroContenido">
          <Link
            href="/unete-al-equipo"
            className="detalleVacanteVolver"
          >
            <ArrowLeft size={17} />
            Volver a las vacantes
          </Link>

          <div className="detalleVacanteHeroInformacion">
            <div className="detalleVacanteHeroIcono">
              <Building2 size={35} />
            </div>

            <div>
              <span className="detalleVacanteArea">
                {vacante.area}
              </span>

              <h1>{vacante.titulo}</h1>

              <div className="detalleVacanteHeroDatos">
                <span>
                  <MapPin size={17} />
                  {vacante.ubicacion}
                </span>

                <span>
                  <BriefcaseBusiness size={17} />
                  {vacante.modalidad}
                </span>

                <span>
                  <Clock3 size={17} />
                  {vacante.tipoEmpleo}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {postulacionEnviada && (
        <section className="detalleVacanteConfirmacion">
          <div className="detalleVacanteConfirmacionIcono">
            <CheckCircle2 size={46} />
          </div>

          <div>
            <h2>Postulación enviada correctamente</h2>

            <p>
              Tus datos fueron registrados para la vacante de{" "}
              <strong>{vacante.titulo}</strong>. El área de
              Recursos Humanos podrá consultar tu información.
            </p>

            <Link href="/unete-al-equipo">
              Consultar otras vacantes
            </Link>
          </div>
        </section>
      )}

      <section className="detalleVacanteContenido">
        <div className="detalleVacantePrincipal">
          <article className="detalleVacanteInformacion">
            <section className="detalleVacanteBloque">
              <h2>Descripción del puesto</h2>

              <p className="detalleVacanteTexto">
                {vacante.descripcion}
              </p>
            </section>

            <section className="detalleVacanteBloque">
              <h2>Requisitos</h2>

              <p className="detalleVacanteTexto detalleVacanteTextoLineas">
                {vacante.requisitos}
              </p>
            </section>

            {vacante.funciones && (
              <section className="detalleVacanteBloque">
                <h2>Funciones principales</h2>

                <p className="detalleVacanteTexto detalleVacanteTextoLineas">
                  {vacante.funciones}
                </p>
              </section>
            )}

            <section className="detalleVacanteResumen">
              <h2>Información de la vacante</h2>

              <div className="detalleVacanteResumenCuadricula">
                <div className="detalleVacanteResumenDato">
                  <Building2 size={20} />

                  <div>
                    <span>Área</span>
                    <strong>{vacante.area}</strong>
                  </div>
                </div>

                <div className="detalleVacanteResumenDato">
                  <MapPin size={20} />

                  <div>
                    <span>Ubicación</span>
                    <strong>{vacante.ubicacion}</strong>
                  </div>
                </div>

                <div className="detalleVacanteResumenDato">
                  <BriefcaseBusiness size={20} />

                  <div>
                    <span>Modalidad</span>
                    <strong>{vacante.modalidad}</strong>
                  </div>
                </div>

                <div className="detalleVacanteResumenDato">
                  <Clock3 size={20} />

                  <div>
                    <span>Tipo de empleo</span>
                    <strong>{vacante.tipoEmpleo}</strong>
                  </div>
                </div>

                {vacante.horario && (
                  <div className="detalleVacanteResumenDato">
                    <CalendarDays size={20} />

                    <div>
                      <span>Horario</span>
                      <strong>{vacante.horario}</strong>
                    </div>
                  </div>
                )}

                {vacante.sueldo && (
                  <div className="detalleVacanteResumenDato">
                    <WalletCards size={20} />

                    <div>
                      <span>Sueldo</span>
                      <strong>{vacante.sueldo}</strong>
                    </div>
                  </div>
                )}
              </div>

              <p className="detalleVacanteFecha">
                Publicada el {vacante.fechaPublicacion}
              </p>
            </section>
          </article>

          <aside
            id="formulario-postulacion"
            className="detalleVacanteFormularioContenedor"
          >
            <div className="detalleVacanteFormularioEncabezado">
              <div className="detalleVacanteFormularioIcono">
                <UserRound size={24} />
              </div>

              <div>
                <h2>Postúlate a esta vacante</h2>

                <p>
                  Completa tus datos para que Recursos Humanos
                  pueda contactarte.
                </p>
              </div>
            </div>

            <form
              className="detalleVacanteFormulario"
              onSubmit={enviarPostulacion}
            >
              <div className="detalleVacanteCampo">
                <label htmlFor="nombre">
                  Nombre <span>*</span>
                </label>

                <div className="detalleVacanteInputIcono">
                  <UserRound size={16} />

                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Ej. Carlos"
                    value={formulario.nombre}
                    onChange={actualizarCampo}
                  />
                </div>
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="apellidos">
                  Apellidos <span>*</span>
                </label>

                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  placeholder="Ej. Hernández López"
                  value={formulario.apellidos}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="correo">
                  Correo electrónico <span>*</span>
                </label>

                <div className="detalleVacanteInputIcono">
                  <Mail size={16} />

                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    placeholder="Ej. candidato@email.com"
                    value={formulario.correo}
                    onChange={actualizarCampo}
                  />
                </div>
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="telefono">
                  Teléfono <span>*</span>
                </label>

                <div className="detalleVacanteInputIcono">
                  <Phone size={16} />

                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    placeholder="Ej. 222 123 4567"
                    value={formulario.telefono}
                    onChange={actualizarCampo}
                  />
                </div>
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="ciudad">
                  Ciudad o residencia
                </label>

                <div className="detalleVacanteInputIcono">
                  <MapPin size={16} />

                  <input
                    id="ciudad"
                    name="ciudad"
                    type="text"
                    placeholder="Ej. Puebla, Puebla"
                    value={formulario.ciudad}
                    onChange={actualizarCampo}
                  />
                </div>
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="escolaridad">
                  Escolaridad <span>*</span>
                </label>

                <div className="detalleVacanteSelectIcono">
                  <GraduationCap size={16} />

                  <select
                    id="escolaridad"
                    name="escolaridad"
                    value={formulario.escolaridad}
                    onChange={actualizarCampo}
                  >
                    <option value="">
                      Selecciona una opción
                    </option>

                    <option value="Secundaria">
                      Secundaria
                    </option>

                    <option value="Bachillerato">
                      Bachillerato
                    </option>

                    <option value="Carrera técnica">
                      Carrera técnica
                    </option>

                    <option value="TSU">TSU</option>

                    <option value="Licenciatura">
                      Licenciatura
                    </option>

                    <option value="Ingeniería">
                      Ingeniería
                    </option>

                    <option value="Posgrado">
                      Posgrado
                    </option>
                  </select>
                </div>
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="experiencia">
                  Experiencia <span>*</span>
                </label>

                <input
                  id="experiencia"
                  name="experiencia"
                  type="text"
                  placeholder="Ej. 2 años en soporte técnico"
                  value={formulario.experiencia}
                  onChange={actualizarCampo}
                />
              </div>

              <div className="detalleVacanteCampo">
                <label htmlFor="mensaje">
                  Mensaje o información adicional
                </label>

                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={5}
                  placeholder="Describe brevemente tus conocimientos, habilidades o interés en la vacante."
                  value={formulario.mensaje}
                  onChange={actualizarCampo}
                />
              </div>

              <button
                type="submit"
                className="detalleVacanteBotonEnviar"
              >
                <Send size={18} />
                Enviar postulación
              </button>

              {mensajeEstado && (
                <p className="detalleVacanteMensaje">
                  {mensajeEstado}
                </p>
              )}
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}