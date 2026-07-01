"use client";

import { useEffect, useRef, useState } from "react";

const menuSections = [
  {
    title: "Videovigilancia",
    groups: [
      {
        title: "Camaras analogicas (CCTV)",
        items: ["Camara Bala", "Camara Domo", "Camara PTZ", "Camara Oculta / Pinhole"],
      },
      {
        title: "Camaras IP",
        items: [
          "Camara Bala IP",
          "Camara Domo IP",
          "Camara PTZ IP",
          "Camara Cubo IP",
          "Camara WiFi",
          "Camara Fisheye",
        ],
      },
      {
        title: "Grabadores",
        items: ["DVR / XVR", "NVR", "Grabadores moviles"],
      },
      {
        title: "Kits",
        items: ["Kits 4 camaras", "Kits 8 camaras", "Kits IP"],
      },
      {
        title: "Accesorios CCTV",
        items: [
          "Fuentes de poder",
          "Balunes / transceptores",
          "Microfonos",
          "Soportes",
          "Gabinetes",
          "Cables y conectores",
        ],
      },
      {
        title: "Almacenamiento",
        items: ["Discos duros", "Memorias microSD", "NAS / Servidores"],
      },
    ],
  },
  {
    title: "Control de acceso",
    groups: [
      {
        title: "Control de personal",
        items: [
          "Biometricos",
          "Reconocimiento facial",
          "Lectores",
          "Controladores",
          "Terminales autonomas",
        ],
      },
      {
        title: "Cerraduras",
        items: [
          "Cerraduras electricas",
          "Cerraduras magneticas",
          "Chapas inteligentes",
          "Botones de salida",
          "Cierrapuertas",
        ],
      },
      {
        title: "Acceso vehicular",
        items: ["Barreras vehiculares", "Motores para porton", "Lectores UHF", "Bolardos"],
      },
      {
        title: "Torniquetes",
        items: ["Tripode", "Opticos", "Puertas de cortesia"],
      },
      {
        title: "Videoporteros e interfones",
        items: ["Kits", "Monitores", "Frentes de calle", "Interfonos"],
      },
    ],
  },
];

export function SideMegaMenuButtonV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(menuSections[0]);
  const [position, setPosition] = useState({ left: 16, top: 72 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({ left: Math.max(16, rect.left), top: rect.bottom + 8 });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative z-40 w-full max-w-72">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg bg-blue-700 px-4 py-3 text-left text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
        aria-expanded={isOpen}
        aria-controls="side-mega-menu-button-v2"
      >
        <span>Todas las categorias</span>
        <span className={`transition ${isOpen ? "rotate-90" : ""}`}>&gt;</span>
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id="side-mega-menu-button-v2"
          className="fixed z-[9999] flex w-[min(1040px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          style={{ left: position.left, top: position.top }}
        >
          <nav className="w-72 shrink-0 border-r border-slate-200 bg-white">
            {menuSections.map((section) => (
              <button
                key={section.title}
                type="button"
                onMouseEnter={() => setActiveSection(section)}
                onFocus={() => setActiveSection(section)}
                className={`flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold transition ${
                  activeSection.title === section.title
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-800 hover:bg-slate-50 hover:text-blue-700"
                }`}
              >
                <span>{section.title}</span>
                <span className="text-slate-400">&gt;</span>
              </button>
            ))}
          </nav>

          <div className="max-h-[min(560px,calc(100vh-7rem))] min-h-96 flex-1 overflow-y-auto p-5">
            <h3 className="mb-4 text-base font-bold text-slate-900">{activeSection.title}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeSection.groups.map((group) => (
                <section key={group.title}>
                  <h4 className="mb-2 text-sm font-semibold text-blue-700">{group.title}</h4>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="block rounded px-2 py-1.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SideMegaMenuButtonV2;
