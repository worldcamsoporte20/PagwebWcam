"use client";

import { useEffect, useRef, useState } from "react";
import {
  RiTv2Line,
  RiShieldLine,
  RiFireLine,
  RiNetworkLine,
  RiPlugLine,
  RiBatteryChargeLine,
  RiVolumeUpLine,
  RiHardDriveLine,
  RiHomeWifiLine,
  RiLightbulbLine,
  RiVideoAddLine,
  RiLock2Line,
  RiMicLine,
  RiBatterySaverLine,
  RiCheckboxMultipleBlankLine,
  RiAlarmWarningLine,
} from "react-icons/ri";

const menuSections = [
  {
    title: "Videovigilancia",
    icon: RiTv2Line,
    groups: [
      {
        title: "Camaras analogicas (CCTV)",
        icon: RiVideoAddLine,
        items: ["Camara Bala", "Camara Domo", "Camara PTZ", "Camara Oculta / Pinhole"],
      },
      {
        title: "Camaras IP",
        icon: RiNetworkLine,
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
        icon: RiHardDriveLine,
        items: ["DVR / XVR", "NVR", "Grabadores moviles"],
      },
      {
        title: "Kits",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Kits 4 camaras", "Kits 8 camaras", "Kits IP"],
      },
      {
        title: "Accesorios CCTV",
        icon: RiPlugLine,
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
        icon: RiHardDriveLine,
        items: ["Discos duros", "Memorias microSD", "NAS / Servidores"],
      },
    ],
  },
  {
    title: "Control de acceso",
    icon: RiShieldLine,
    groups: [
      {
        title: "Control de personal",
        icon: RiShieldLine,
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
        icon: RiLock2Line,
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
        icon: RiNetworkLine,
        items: ["Barreras vehiculares", "Motores para porton", "Lectores UHF", "Bolardos"],
      },
      {
        title: "Torniquetes",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Tripode", "Opticos", "Puertas de cortesia"],
      },
      {
        title: "Videoporteros e interfones",
        icon: RiMicLine,
        items: ["Kits", "Monitores", "Frentes de calle", "Interfonos"],
      },
    ],
  },
  {
    title: "Alarmas e incendio",
    icon: RiFireLine,
    groups: [
      {
        title: "Paneles de alarma",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Paneles conexion", "Paneles hibridos", "Paneles inalambricos"],
      },
      {
        title: "Sensores",
        icon: RiAlarmWarningLine,
        items: ["Sensores movimiento", "Sensores puerta/ventana", "Sensores inundacion", "Sensores humo"],
      },
      {
        title: "Avisadores",
        icon: RiAlarmWarningLine,
        items: ["Sirenas internas", "Sirenas externas", "Avisadores luminosos"],
      },
      {
        title: "Accesorios alarma",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Teclados", "Fuentes de poder", "Baterias", "Conectores"],
      },
    ],
  },
  {
    title: "Redes",
    icon: RiNetworkLine,
    groups: [
      {
        title: "Switches",
        icon: RiNetworkLine,
        items: ["Switch gigabit", "Switch PoE", "Switch administrable"],
      },
      {
        title: "Routers",
        icon: RiNetworkLine,
        items: ["Routers WiFi", "Routers 5G", "Routers industrial"],
      },
      {
        title: "Access Points",
        icon: RiHomeWifiLine,
        items: ["WiFi 5", "WiFi 6", "WiFi 6E"],
      },
      {
        title: "Modems",
        icon: RiNetworkLine,
        items: ["Modem cable", "Modem fibra", "Modem 4G"],
      },
    ],
  },
  {
    title: "Cableado e infraestructura",
    icon: RiPlugLine,
    groups: [
      {
        title: "Cables UTP",
        icon: RiPlugLine,
        items: ["Cat5e", "Cat6", "Cat6a", "Cat7"],
      },
      {
        title: "Cables coaxiales",
        icon: RiPlugLine,
        items: ["RG59", "RG6", "RG11"],
      },
      {
        title: "Accesorios red",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Conectores", "Patch panels", "Keystones", "Bandejas"],
      },
      {
        title: "Canaletas y tuberías",
        icon: RiPlugLine,
        items: ["Canaletas PVC", "Tuberías metálicas", "Accesorios"],
      },
    ],
  },
  {
    title: "Energía y respaldo",
    icon: RiBatteryChargeLine,
    groups: [
      {
        title: "UPS",
        icon: RiBatteryChargeLine,
        items: ["UPS online", "UPS interactiva", "UPS industrial"],
      },
      {
        title: "Baterías",
        icon: RiBatteryChargeLine,
        items: ["Baterías ácido", "Baterías litio", "Baterías LiFePO4"],
      },
      {
        title: "Fuentes de poder",
        icon: RiBatterySaverLine,
        items: ["12V DC", "24V DC", "48V DC"],
      },
      {
        title: "Generadores",
        icon: RiBatterySaverLine,
        items: ["Generadores diesel", "Generadores gasolina", "Generadores solar"],
      },
    ],
  },
  {
    title: "Audio y video",
    icon: RiVolumeUpLine,
    groups: [
      {
        title: "Amplificadores",
        icon: RiVolumeUpLine,
        items: ["Amplificadores potencia", "Preamplificadores", "Amplificadores mezcladores"],
      },
      {
        title: "Microfonos y altavoces",
        icon: RiMicLine,
        items: ["Microfonos dinamicos", "Microfonos condensador", "Altavoces"],
      },
      {
        title: "Sistemas radiofonia",
        icon: RiNetworkLine,
        items: ["Radios portatiles", "Repetidores", "Antenas"],
      },
      {
        title: "Consolas y mezcladores",
        icon: RiVolumeUpLine,
        items: ["Consolas analógicas", "Mezcladores digitales", "Interfaces audio"],
      },
    ],
  },
  {
    title: "Almacenamiento",
    icon: RiHardDriveLine,
    groups: [
      {
        title: "Discos duros",
        icon: RiHardDriveLine,
        items: ["HDD 3.5 pulgadas", "HDD 2.5 pulgadas", "HDD SSD"],
      },
      {
        title: "Memoria flash",
        icon: RiHardDriveLine,
        items: ["Memorias microSD", "Memorias USB", "Memorias SD"],
      },
      {
        title: "NAS / Servidores",
        icon: RiCheckboxMultipleBlankLine,
        items: ["NAS 2 bahías", "NAS 4 bahías", "NAS 8 bahías"],
      },
      {
        title: "Gabinetes almacenamiento",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Gabinetes rack", "Gabinetes de escritorio"],
      },
    ],
  },
  {
    title: "Automatización e IoT",
    icon: RiHomeWifiLine,
    groups: [
      {
        title: "Sensores IoT",
        icon: RiAlarmWarningLine,
        items: ["Sensores temperatura", "Sensores humedad", "Sensores movimiento"],
      },
      {
        title: "Controladores",
        icon: RiHomeWifiLine,
        items: ["PLC", "Microcontroladores", "Controladores inteligentes"],
      },
      {
        title: "Dispositivos IoT",
        icon: RiHomeWifiLine,
        items: ["Tomacorrientes inteligentes", "Switches inteligentes", "Sensores inteligentes"],
      },
      {
        title: "Plataformas IoT",
        icon: RiNetworkLine,
        items: ["Arduino", "Raspberry Pi", "ESP32"],
      },
    ],
  },
  {
    title: "Tecnología LED",
    icon: RiLightbulbLine,
    groups: [
      {
        title: "Luminarias LED",
        icon: RiLightbulbLine,
        items: ["Focos LED", "Tubos LED", "Paneles LED"],
      },
      {
        title: "Controladores LED",
        icon: RiBatterySaverLine,
        items: ["Controladores RGB", "Controladores PWM", "Drivers LED"],
      },
      {
        title: "Tiras LED",
        icon: RiLightbulbLine,
        items: ["Tiras monocromáticas", "Tiras RGB", "Tiras RGBW"],
      },
      {
        title: "Accesorios LED",
        icon: RiCheckboxMultipleBlankLine,
        items: ["Disipadores", "Conectores", "Fuentes LED"],
      },
    ],
  },
];

export function SideMegaMenuButtonV2() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(menuSections[0]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
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
    <div 
      ref={containerRef}
      className="relative z-40 w-full max-w-72"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-[#F00922] px-4 text-sm font-black text-white shadow-sm transition-all duration-300 before:absolute before:inset-y-0 before:-left-10 before:w-8 before:skew-x-[-20deg] before:bg-white/35 before:opacity-0 before:transition-all before:duration-500 hover:-translate-y-1 hover:bg-gradient-to-r hover:from-[#022C96] hover:via-[#1E49A2] hover:to-[#2D70CF] hover:shadow-[0_14px_30px_rgba(2,44,150,0.26),0_0_0_4px_rgba(45,112,207,0.14)] hover:before:left-[115%] hover:before:opacity-100"
        aria-expanded={isOpen}
        aria-controls="side-mega-menu-button-v2"
      >
        <span className="relative flex h-6 w-6 flex-col items-center justify-center gap-1 transition-transform duration-300 group-hover:scale-110">
          <span className="h-[2px] w-full rounded-full bg-white" />
          <span className="h-[2px] w-full rounded-full bg-white" />
          <span className="h-[2px] w-full rounded-full bg-white" />
        </span>
        <span className="relative">Todas las categorias</span>
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          id="side-mega-menu-button-v2"
          className="absolute top-full left-0 mt-2 z-[9999] flex w-[max(1300px,100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <nav className="w-56 shrink-0 border-r border-slate-100 bg-white overflow-y-auto max-h-[600px]">
            {menuSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.title}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  onMouseEnter={() => setActiveSection(section)}
                  onFocus={() => setActiveSection(section)}
                  className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-200 ${
                    activeSection.title === section.title
                      ? "border-l-4 border-l-[#1E49A2] bg-blue-50 text-[#012477] shadow-[inset_18px_0_28px_rgba(45,112,207,0.08)]"
                      : "border-l-4 border-l-transparent text-slate-600 hover:border-l-[#2D70CF] hover:bg-[#2D70CF]/10 hover:text-[#012477]"
                  }`}
                >
                  <SectionIcon className="h-5 w-5 shrink-0 text-[#1E49A2] opacity-70 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100" />
                  <span className="text-sm font-medium flex-1">{section.title}</span>
                  <span className="text-slate-400 text-lg transition-all duration-200 group-hover:translate-x-1 group-hover:text-[#1E49A2]">&gt;</span>
                </button>
              );
            })}
          </nav>

          <div className="max-h-[600px] flex-1 overflow-y-auto p-8 bg-white">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">{activeSection.title}</h2>
            <div className="grid gap-8 grid-cols-3">
              {activeSection.groups.map((group) => {
                return (
                  <div key={group.title} className="space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">{group.title}</h3>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item}>
                          <a
                            href="#"
                            className="block rounded-md px-2 py-1 text-sm text-slate-600 font-medium transition-all duration-200 hover:translate-x-1 hover:bg-[#2D70CF]/10 hover:text-[#012477]"
                          >
                            {item}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SideMegaMenuButtonV2;
