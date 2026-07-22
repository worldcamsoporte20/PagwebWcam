"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  MapPin,
  Search,
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

const TODAS_LAS_AREAS = "Todas las áreas";

export default function UneteAlEquipo() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [areaSeleccionada, setAreaSeleccionada] =
    useState(TODAS_LAS_AREAS);
  const [datosCargados, setDatosCargados] = useState(false);
  const [paginaMontada, setPaginaMontada] = useState(false);

useEffect(() => {
  setPaginaMontada(true);
}, []);

  useEffect(() => {
    try {
      const vacantesGuardadas = localStorage.getItem(
        "worldcam-vacantes"
      );

      if (vacantesGuardadas) {
        const datos = JSON.parse(vacantesGuardadas);

        if (Array.isArray(datos)) {
          setVacantes(datos);
        }
      }
    } catch (error) {
      console.error(
        "No se pudieron recuperar las vacantes:",
        error
      );
    } finally {
      setDatosCargados(true);
    }
  }, []);

  const vacantesActivas = useMemo(() => {
    return vacantes.filter((vacante) => vacante.activa);
  }, [vacantes]);

  const areasDisponibles = useMemo(() => {
    const areas = Array.from(
      new Set(
        vacantesActivas
          .map((vacante) => vacante.area)
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "es"));

    return [TODAS_LAS_AREAS, ...areas];
  }, [vacantesActivas]);

  const vacantesFiltradas = useMemo(() => {
    const textoBusqueda = busqueda
      .trim()
      .toLocaleLowerCase("es");

    return vacantesActivas.filter((vacante) => {
      const coincideArea =
        areaSeleccionada === TODAS_LAS_AREAS ||
        vacante.area === areaSeleccionada;

      const coincideBusqueda =
        textoBusqueda === "" ||
        vacante.titulo
          .toLocaleLowerCase("es")
          .includes(textoBusqueda) ||
        vacante.area
          .toLocaleLowerCase("es")
          .includes(textoBusqueda) ||
        vacante.ubicacion
          .toLocaleLowerCase("es")
          .includes(textoBusqueda) ||
        vacante.descripcion
          .toLocaleLowerCase("es")
          .includes(textoBusqueda);

      return coincideArea && coincideBusqueda;
    });
  }, [vacantesActivas, busqueda, areaSeleccionada]);

  if (!paginaMontada) {
  return null;
}

  return (
    <main className="vacantesPublicasPagina">
      <section className="vacantesPublicasHero">
        <div className="vacantesPublicasHeroContenido">
          <div className="vacantesPublicasHeroTexto">
            <span className="vacantesPublicasEtiqueta">
              <UsersRound size={17} />
              Trabaja con nosotros
            </span>

            <h1>Únete al equipo de WorldCam</h1>

            <p>
              Conoce nuestras vacantes disponibles, encuentra el
              área que se adapte a tu perfil y forma parte de
              nuestro equipo.
            </p>

            <a
              href="#vacantes-disponibles"
              className="vacantesPublicasHeroBoton"
            >
              Ver vacantes
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="vacantesPublicasHeroIcono">
            <BriefcaseBusiness size={84} />
          </div>
        </div>
      </section>

      <section
        id="vacantes-disponibles"
        className="vacantesPublicasContenido"
      >
        <header className="vacantesPublicasEncabezado">
          <div>
            <span>Oportunidades laborales</span>

            <h2>Vacantes disponibles</h2>

            <p>
              Selecciona un área o busca el puesto que te
              interesa.
            </p>
          </div>

          <div className="vacantesPublicasContador">
            <strong>{vacantesActivas.length}</strong>
            <span>
              {vacantesActivas.length === 1
                ? "vacante activa"
                : "vacantes activas"}
            </span>
          </div>
        </header>

        <div className="vacantesPublicasFiltros">
          <div className="vacantesPublicasBuscador">
            <Search size={19} />

            <input
              type="search"
              placeholder="Buscar por puesto, área o ubicación"
              value={busqueda}
              onChange={(evento) =>
                setBusqueda(evento.target.value)
              }
            />
          </div>

          <div className="vacantesPublicasAreas">
            {areasDisponibles.map((area) => (
              <button
                type="button"
                key={area}
                className={
                  areaSeleccionada === area
                    ? "vacantesPublicasAreaBoton vacantesPublicasAreaActiva"
                    : "vacantesPublicasAreaBoton"
                }
                onClick={() => setAreaSeleccionada(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {!datosCargados ? (
          <div className="vacantesPublicasEstado">
            <BriefcaseBusiness size={42} />

            <h3>Cargando vacantes</h3>

            <p>
              Estamos consultando las oportunidades disponibles.
            </p>
          </div>
        ) : vacantesFiltradas.length === 0 ? (
          <div className="vacantesPublicasEstado">
            <BriefcaseBusiness size={42} />

            <h3>No hay vacantes disponibles</h3>

            <p>
              No encontramos vacantes que coincidan con tu
              búsqueda o con el área seleccionada.
            </p>

            {(busqueda ||
              areaSeleccionada !== TODAS_LAS_AREAS) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setAreaSeleccionada(TODAS_LAS_AREAS);
                }}
              >
                Mostrar todas
              </button>
            )}
          </div>
        ) : (
          <div className="vacantesPublicasLista">
            {vacantesFiltradas.map((vacante) => (
              <article
                className="vacantesPublicasTarjeta"
                key={vacante.id}
              >
                <div className="vacantesPublicasTarjetaIcono">
                  <Building2 size={25} />
                </div>

                <div className="vacantesPublicasTarjetaContenido">
                  <div className="vacantesPublicasTituloArea">
                    <span>{vacante.area}</span>

                    <h3>{vacante.titulo}</h3>
                  </div>

                  <p className="vacantesPublicasDescripcion">
                    {vacante.descripcion}
                  </p>

                  <div className="vacantesPublicasDatos">
                    <span>
                      <MapPin size={16} />
                      {vacante.ubicacion}
                    </span>

                    <span>
                      <BriefcaseBusiness size={16} />
                      {vacante.modalidad}
                    </span>

                    <span>
                      <Clock3 size={16} />
                      {vacante.tipoEmpleo}
                    </span>
                  </div>

                  {vacante.sueldo && (
                    <p className="vacantesPublicasSueldo">
                      {vacante.sueldo}
                    </p>
                  )}

                  <div className="vacantesPublicasTarjetaPie">
                    <small>
                      Publicada el {vacante.fechaPublicacion}
                    </small>

                    <Link
                      href={`/unete-al-equipo/${vacante.id}`}
                      className="vacantesPublicasBotonVer"
                    >
                      Ver vacante
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}