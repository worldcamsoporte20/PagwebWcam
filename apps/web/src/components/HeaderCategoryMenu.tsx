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

export function HeaderCategoryMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(menuSections[0]);
  const [position, setPosition] = useState({ left: 16, top: 120 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 1040 - 16)),
        top: rect.bottom + 8,
      });
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

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-[#F00922] px-3 text-sm font-black text-[#FCFCFD] shadow-sm transition hover:bg-[#D41020]"
        aria-expanded={isOpen}
        aria-controls="header-category-mega-menu"
      >
        <span className="flex h-6 w-6 flex-col items-center justify-center gap-1">
          <span className="h-[2px] w-full rounded-full bg-[#FCFCFD]" />
          <span className="h-[2px] w-full rounded-full bg-[#FCFCFD]" />
          <span className="h-[2px] w-full rounded-full bg-[#FCFCFD]" />
        </span>
        Todas las categorias
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id="header-category-mega-menu"
          className="fixed z-[9999] flex w-[min(1040px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#CBC9D4] bg-[#FCFCFD] text-[#12141A] shadow-2xl"
          style={{ left: position.left, top: position.top }}
        >
          <nav className="w-72 shrink-0 border-r border-[#CBC9D4] bg-white">
            {menuSections.map((section) => (
              <button
                key={section.title}
                type="button"
                onMouseEnter={() => setActiveSection(section)}
                onFocus={() => setActiveSection(section)}
                className={`flex w-full items-center justify-between border-b border-[#CBC9D4]/70 px-4 py-3 text-left text-sm font-black transition ${
                  activeSection.title === section.title
                    ? "bg-[#2D70CF]/10 text-[#012477]"
                    : "text-[#12141A] hover:bg-[#CBC9D4]/30 hover:text-[#012477]"
                }`}
              >
                <span>{section.title}</span>
                <span className="text-[#1E49A2]">&gt;</span>
              </button>
            ))}
          </nav>

          <div className="max-h-[min(560px,calc(100vh-8rem))] min-h-96 flex-1 overflow-y-auto p-5">
            <h3 className="mb-4 text-base font-black text-[#012477]">{activeSection.title}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeSection.groups.map((group) => (
                <section key={group.title}>
                  <h4 className="mb-2 text-sm font-black text-[#1E49A2]">{group.title}</h4>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item}>
                        <a
                          href={`/catalogo?buscar=${encodeURIComponent(item)}`}
                          className="block rounded px-2 py-1.5 text-sm font-semibold text-[#12141A] transition hover:bg-[#2D70CF]/10 hover:text-[#012477]"
                          onClick={() => setIsOpen(false)}
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
    </>
  );
}

export default HeaderCategoryMenu;
