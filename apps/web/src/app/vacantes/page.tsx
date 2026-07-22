"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  Plus,
  Power,
  Trash2,
  UserRound,
  UsersRound,
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
  titulo: "",
  area: "",
  ubicacion: "",
  modalidad: "Presencial",
  tipoEmpleo: "Tiempo completo",
  horario: "",
  sueldo: "",
  descripcion: "",
  requisitos: "",
  funciones: "",
};

export default function PanelVacantes() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [datosCargados, setDatosCargados] = useState(false);
  const [paginaMontada, setPaginaMontada] = useState(false);



  const [vacanteAbierta, setVacanteAbierta] =
    useState<number | null>(null);

    useEffect(() => {
  setPaginaMontada(true);
}, []);

  useEffect(() => {
    try {
      const vacantesGuardadas = localStorage.getItem(
        "worldcam-vacantes"
      );

      const postulacionesGuardadas = localStorage.getItem(
        "worldcam-postulaciones"
      );

      if (vacantesGuardadas) {
        const datosVacantes = JSON.parse(vacantesGuardadas);

        if (Array.isArray(datosVacantes)) {
          setVacantes(datosVacantes);
        }
      }

      if (postulacionesGuardadas) {
        const datosPostulaciones = JSON.parse(
          postulacionesGuardadas
        );

        if (Array.isArray(datosPostulaciones)) {
          setPostulaciones(datosPostulaciones);
        }
      }
    } catch (error) {
      console.error(
        "No se pudo recuperar la información:",
        error
      );
    }

    setDatosCargados(true);
  }, []);

  useEffect(() => {
    if (!datosCargados) return;

    localStorage.setItem(
      "worldcam-vacantes",
      JSON.stringify(vacantes)
    );
  }, [vacantes, datosCargados]);

  useEffect(() => {
    if (!datosCargados) return;

    localStorage.setItem(
      "worldcam-postulaciones",
      JSON.stringify(postulaciones)
    );
  }, [postulaciones, datosCargados]);

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

    setMensaje("");
  }

  function publicarVacante(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (
      !formulario.titulo.trim() ||
      !formulario.area.trim() ||
      !formulario.ubicacion.trim() ||
      !formulario.descripcion.trim() ||
      !formulario.requisitos.trim()
    ) {
      setMensaje(
        "Completa los campos obligatorios antes de publicar."
      );

      return;
    }

    const nuevaVacante: Vacante = {
      id: Date.now(),
      ...formulario,
      activa: true,
      fechaPublicacion: new Date().toLocaleDateString(
        "es-MX"
      ),
    };

    setVacantes((vacantesAnteriores) => [
      nuevaVacante,
      ...vacantesAnteriores,
    ]);

    setFormulario(formularioInicial);

    setMensaje("Vacante publicada correctamente.");
  }

  function cambiarEstadoVacante(id: number) {
    setVacantes((vacantesAnteriores) =>
      vacantesAnteriores.map((vacante) =>
        vacante.id === id
          ? {
              ...vacante,
              activa: !vacante.activa,
            }
          : vacante
      )
    );
  }

  function eliminarVacante(id: number) {
    const confirmar = window.confirm(
      "¿Deseas eliminar esta vacante? También se eliminarán sus postulaciones."
    );

    if (!confirmar) return;

    setVacantes((vacantesAnteriores) =>
      vacantesAnteriores.filter(
        (vacante) => vacante.id !== id
      )
    );

    setPostulaciones((postulacionesAnteriores) =>
      postulacionesAnteriores.filter(
        (postulacion) => postulacion.vacanteId !== id
      )
    );

    if (vacanteAbierta === id) {
      setVacanteAbierta(null);
    }

    setMensaje("Vacante eliminada correctamente.");
  }

  function eliminarPostulacion(id: number) {
    const confirmar = window.confirm(
      "¿Deseas eliminar esta postulación?"
    );

    if (!confirmar) return;

    setPostulaciones((postulacionesAnteriores) =>
      postulacionesAnteriores.filter(
        (postulacion) => postulacion.id !== id
      )
    );
  }

  function obtenerPostulaciones(vacanteId: number) {
    return postulaciones.filter(
      (postulacion) =>
        postulacion.vacanteId === vacanteId
    );
  }

  function alternarPostulantes(vacanteId: number) {
    setVacanteAbierta((vacanteAnterior) =>
      vacanteAnterior === vacanteId
        ? null
        : vacanteId
    );
  }

  if (!paginaMontada) {
  return null;
}

  return (
    <main className="vacantesPanelPagina">
      <section className="vacantesPanelContenido">
        <Link
          href="/panel"
          className="vacantesPanelVolver"
        >
          <ArrowLeft size={17} />
          Volver al panel
        </Link>

        <header className="vacantesPanelEncabezado">
          <div className="vacantesPanelEncabezadoIcono">
            <BriefcaseBusiness size={28} />
          </div>

          <div>
            <h1>Administrar vacantes</h1>

            <p>
              Publica puestos disponibles y consulta las
              personas que se han postulado.
            </p>
          </div>
        </header>

        <form
          className="vacantesPanelFormulario"
          onSubmit={publicarVacante}
        >
          <div className="vacantesPanelFormularioTitulo">
            <Plus size={20} />

            <div>
              <h2>Publicar nueva vacante</h2>

              <p>
                Completa la información que aparecerá en la
                página pública.
              </p>
            </div>
          </div>

          <div className="vacantesPanelCuadricula">
            <div className="vacantesPanelCampo">
              <label htmlFor="titulo">
                Nombre de la vacante <span>*</span>
              </label>

              <input
                id="titulo"
                name="titulo"
                type="text"
                placeholder="Ej. Desarrollador web"
                value={formulario.titulo}
                onChange={actualizarCampo}
              />
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="area">
                Área <span>*</span>
              </label>

              <select
                id="area"
                name="area"
                value={formulario.area}
                onChange={actualizarCampo}
              >
                <option value="">
                  Selecciona un área
                </option>
                <option value="Sistemas y desarrollo">
                  Sistemas y desarrollo
                </option>
                <option value="Recursos humanos">
                  Recursos humanos
                </option>
                <option value="Ventas">Ventas</option>
                <option value="Marketing">Marketing</option>
                <option value="Soporte técnico">
                  Soporte técnico
                </option>
                <option value="Almacén y logística">
                  Almacén y logística
                </option>
                <option value="Administración">
                  Administración
                </option>
                <option value="Instalaciones">
                  Instalaciones
                </option>
              </select>
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="ubicacion">
                Ubicación <span>*</span>
              </label>

              <div className="vacantesPanelInputIcono">
                <MapPin size={17} />

                <input
                  id="ubicacion"
                  name="ubicacion"
                  type="text"
                  placeholder="Ej. Puebla, Puebla"
                  value={formulario.ubicacion}
                  onChange={actualizarCampo}
                />
              </div>
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="modalidad">
                Modalidad
              </label>

              <select
                id="modalidad"
                name="modalidad"
                value={formulario.modalidad}
                onChange={actualizarCampo}
              >
                <option value="Presencial">
                  Presencial
                </option>
                <option value="Híbrida">Híbrida</option>
                <option value="Remota">Remota</option>
              </select>
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="tipoEmpleo">
                Tipo de empleo
              </label>

              <select
                id="tipoEmpleo"
                name="tipoEmpleo"
                value={formulario.tipoEmpleo}
                onChange={actualizarCampo}
              >
                <option value="Tiempo completo">
                  Tiempo completo
                </option>
                <option value="Medio tiempo">
                  Medio tiempo
                </option>
                <option value="Temporal">Temporal</option>
                <option value="Prácticas profesionales">
                  Prácticas profesionales
                </option>
                <option value="Estadía profesional">
                  Estadía profesional
                </option>
              </select>
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="horario">Horario</label>

              <input
                id="horario"
                name="horario"
                type="text"
                placeholder="Ej. Lunes a viernes de 9:00 a 18:00"
                value={formulario.horario}
                onChange={actualizarCampo}
              />
            </div>

            <div className="vacantesPanelCampo">
              <label htmlFor="sueldo">
                Sueldo o rango salarial
              </label>

              <input
                id="sueldo"
                name="sueldo"
                type="text"
                placeholder="Ej. $10,000 a $14,000 mensuales"
                value={formulario.sueldo}
                onChange={actualizarCampo}
              />
            </div>

            <div className="vacantesPanelCampo vacantesPanelCampoCompleto">
              <label htmlFor="descripcion">
                Descripción del puesto <span>*</span>
              </label>

              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                placeholder="Describe brevemente el puesto y su objetivo."
                value={formulario.descripcion}
                onChange={actualizarCampo}
              />
            </div>

            <div className="vacantesPanelCampo vacantesPanelCampoCompleto">
              <label htmlFor="requisitos">
                Requisitos <span>*</span>
              </label>

              <textarea
                id="requisitos"
                name="requisitos"
                rows={4}
                placeholder="Ej. Escolaridad, experiencia, conocimientos y habilidades."
                value={formulario.requisitos}
                onChange={actualizarCampo}
              />
            </div>

            <div className="vacantesPanelCampo vacantesPanelCampoCompleto">
              <label htmlFor="funciones">
                Funciones principales
              </label>

              <textarea
                id="funciones"
                name="funciones"
                rows={4}
                placeholder="Describe las actividades principales del puesto."
                value={formulario.funciones}
                onChange={actualizarCampo}
              />
            </div>
          </div>

          <button
            type="submit"
            className="vacantesPanelBotonPublicar"
          >
            <Plus size={18} />
            Publicar vacante
          </button>

          {mensaje && (
            <p className="vacantesPanelMensaje">
              {mensaje}
            </p>
          )}
        </form>

        <section className="vacantesPanelPublicadas">
          <div className="vacantesPanelSeccionTitulo">
            <BriefcaseBusiness size={20} />

            <h2>
              Vacantes publicadas ({vacantes.length})
            </h2>
          </div>

          {vacantes.length === 0 ? (
            <div className="vacantesPanelVacio">
              <BriefcaseBusiness size={42} />

              <h3>No hay vacantes publicadas</h3>

              <p>
                Las nuevas vacantes aparecerán en esta
                sección.
              </p>
            </div>
          ) : (
            <div className="vacantesPanelLista">
              {vacantes.map((vacante) => {
                const postulantesVacante =
                  obtenerPostulaciones(vacante.id);

                const estaAbierta =
                  vacanteAbierta === vacante.id;

                return (
                  <article
                    className="vacantesPanelTarjeta"
                    key={vacante.id}
                  >
                    <div className="vacantesPanelTarjetaPrincipal">
                      <div className="vacantesPanelTarjetaIcono">
                        <Building2 size={23} />
                      </div>

                      <div className="vacantesPanelTarjetaDatos">
                        <div className="vacantesPanelTituloEstado">
                          <h3>{vacante.titulo}</h3>

                          <span
                            className={
                              vacante.activa
                                ? "vacantesPanelEstado vacantesPanelEstadoActivo"
                                : "vacantesPanelEstado vacantesPanelEstadoInactivo"
                            }
                          >
                            {vacante.activa
                              ? "Activa"
                              : "Inactiva"}
                          </span>
                        </div>

                        <p>
                          {vacante.area} ·{" "}
                          {vacante.ubicacion} ·{" "}
                          {vacante.modalidad}
                        </p>

                        <div className="vacantesPanelMetadatos">
                          <span>
                            {vacante.tipoEmpleo}
                          </span>

                          {vacante.horario && (
                            <span>{vacante.horario}</span>
                          )}

                          <span>
                            Publicada:{" "}
                            {vacante.fechaPublicacion}
                          </span>
                        </div>
                      </div>

                      <div className="vacantesPanelAcciones">
                        <Link
                          href={`/unete-al-equipo/${vacante.id}`}
                          className="vacantesPanelBotonVer"
                          title="Ver vacante pública"
                        >
                          <Eye size={18} />
                        </Link>

                        <button
                          type="button"
                          className="vacantesPanelBotonEstado"
                          onClick={() =>
                            cambiarEstadoVacante(vacante.id)
                          }
                          title={
                            vacante.activa
                              ? "Desactivar vacante"
                              : "Activar vacante"
                          }
                        >
                          <Power size={18} />
                        </button>

                        <button
                          type="button"
                          className="vacantesPanelBotonEliminar"
                          onClick={() =>
                            eliminarVacante(vacante.id)
                          }
                          title="Eliminar vacante"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="vacantesPanelBotonPostulantes"
                      onClick={() =>
                        alternarPostulantes(vacante.id)
                      }
                    >
                      <span>
                        <UsersRound size={18} />

                        Postulantes (
                        {postulantesVacante.length})
                      </span>

                      {estaAbierta ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>

                    {estaAbierta && (
                      <div className="vacantesPanelPostulantes">
                        {postulantesVacante.length === 0 ? (
                          <div className="vacantesPanelSinPostulantes">
                            <UserRound size={31} />

                            <p>
                              Todavía no hay personas
                              postuladas para esta vacante.
                            </p>
                          </div>
                        ) : (
                          postulantesVacante.map(
                            (postulacion) => (
                              <div
                                className="vacantesPanelPostulante"
                                key={postulacion.id}
                              >
                                <div className="vacantesPanelPostulanteAvatar">
                                  {postulacion.nombre
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div className="vacantesPanelPostulanteDatos">
                                  <h4>
                                    {postulacion.nombre}{" "}
                                    {postulacion.apellidos}
                                  </h4>

                                  <p>
                                    {postulacion.correo} ·{" "}
                                    {postulacion.telefono}
                                  </p>

                                  <div className="vacantesPanelPostulanteEtiquetas">
                                    {postulacion.ciudad && (
                                      <span>
                                        {postulacion.ciudad}
                                      </span>
                                    )}

                                    {postulacion.escolaridad && (
                                      <span>
                                        {
                                          postulacion.escolaridad
                                        }
                                      </span>
                                    )}

                                    {postulacion.experiencia && (
                                      <span>
                                        Experiencia:{" "}
                                        {
                                          postulacion.experiencia
                                        }
                                      </span>
                                    )}
                                  </div>

                                  {postulacion.mensaje && (
                                    <p className="vacantesPanelPostulanteMensaje">
                                      {postulacion.mensaje}
                                    </p>
                                  )}

                                  <small>
                                    Postulación:{" "}
                                    {
                                      postulacion.fechaPostulacion
                                    }
                                  </small>
                                </div>

                                <button
                                  type="button"
                                  className="vacantesPanelEliminarPostulante"
                                  onClick={() =>
                                    eliminarPostulacion(
                                      postulacion.id
                                    )
                                  }
                                  title="Eliminar postulación"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            )
                          )
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}