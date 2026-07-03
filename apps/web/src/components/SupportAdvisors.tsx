"use client";

import { Mail, MessageCircle, UserRound } from "lucide-react";

type Advisor = {
  name: string;
  role: string;
  phone: string;
  email: string;
  hours: string;
  photo?: string;
};

const advisors: Advisor[] = [
  {
    name: "Aracely",
    role: "VENTAS MAYOREO",
    phone: "2227066379",
    email: "aracely.hernandez@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/aracely.png.png",
  },
  {
    name: "Benjamin",
    role: "SUCURSAL 9 SUR",
    phone: "2214243427",
    email: "benjamin.hernandez@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/benjamin.jpeg",
  },
  {
    name: "Geovani",
    role: "VENTAS SUC. 9 SUR",
    phone: "2214243427",
    email: "geovani.lopez@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/geovani.png.png",
  },
  {
    name: "Monica Diaz",
    role: "TIENDA YANKON",
    phone: "2214243427",
    email: "yankon@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/monica.png.png",
  },
  {
    name: "Viridiana",
    role: "PROYECTOS ESPECIALIZADOS",
    phone: "2228201170",
    email: "viridiana.dolores@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/viridiana.png",
  },
  {
    name: "Mario",
    role: "VENTAS SUC. 9 Sur",
    phone: "2227069398",
    email: "mario.rojas@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/mario.png.png",
  },
  {
    name: "Yolanda",
    role: "VENTAS SUC. 9 Sur",
    phone: "2227065159",
    email: "yolanda.ramirez@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/yolanda.png.png",
  },
  {
    name: "Arturo Flores",
    role: "DISTRIBUIDORES",
    phone: "2216531136",
    email: "distribuidores@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/arturo.png.png",
  },
  {
    name: "Alberto",
    role: "VENTAS SUC. 25 PTE",
    phone: "2216531227",
    email: "alberto.espinoza@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/alberto.png.png",
  },
  {
    name: "Juan Pablo",
    role: "VENTAS DE ILUMINACION",
    phone: "2227068872",
    email: "jpablo.jimenez@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/juanpablo.png.png",
  },
  {
    name: "Rachel",
    role: "VENTAS SUC. 25 PTE",
    phone: "2227062166",
    email: "rachel.rivera@worldcamdemexico.com",
    hours: "Atencion de 9am a 7pm L-V",
    photo: "/images/asesores/rachel.jpeg",
  },
];

const scrollingAdvisors = [...advisors, ...advisors];

function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/52${digits}`;
}

export default function SupportAdvisors() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft dark:border-white/10 dark:bg-[#0d1526]">
        <div className="grid gap-8 p-6 md:grid-cols-[0.85fr_1.4fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-coral">Soporte Worldcam</p>
            <h2 className="mt-2 text-3xl font-black text-[#022C96] dark:text-blue-200 md:text-4xl">
              Necesitas ayuda?
            </h2>
            <p className="mt-4 text-base text-gray-700 dark:text-blue-100/70">
              Contacta con uno de nuestros asesores. En Worldcam encontramos soluciones para ti.
            </p>
          </div>

          <div className="relative min-w-0 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent dark:from-[#0d1526]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent dark:from-[#0d1526]" />

            <div className="support-advisors-viewport overflow-hidden px-1 pb-2">
              <div className="support-advisors-track flex w-max gap-4">
                {scrollingAdvisors.map((advisor, index) => (
                  <div
                    key={`${advisor.name}-${index}`}
                    className="w-[220px] flex-shrink-0 text-center sm:w-[230px]"
                  >
                    <div className="relative mx-auto mb-3 h-32 w-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-white/5">
                      {advisor.photo ? (
                        <img
                          src={advisor.photo}
                          alt={`Foto de ${advisor.name}`}
                          className="absolute inset-0 z-10 h-full w-full object-cover"
                          onError={(event) => {
                            (event.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-white/30">
                        <UserRound className="h-12 w-12" aria-hidden />
                      </div>
                    </div>

                    <h3 className="text-base font-black uppercase tracking-wide text-gray-900 dark:text-white">
                      {advisor.name}
                    </h3>
                    <p className="text-sm font-bold text-gray-600 dark:text-blue-100/70">{advisor.role}</p>

                    <a
                      href={whatsappLink(advisor.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center gap-1.5 text-sm font-bold text-gray-800 hover:text-green-600 dark:text-white dark:hover:text-green-400"
                    >
                      {formatPhoneDisplay(advisor.phone)}
                      <MessageCircle className="h-4 w-4 text-green-500" aria-hidden />
                    </a>

                    <a
                      href={`mailto:${advisor.email}`}
                      className="mt-1 flex items-center justify-center gap-1 truncate text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{advisor.email}</span>
                    </a>

                    <p className="mt-1 text-xs text-gray-500 dark:text-blue-100/50">{advisor.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .support-advisors-track {
          animation: support-advisors-scroll 42s linear infinite;
        }

        .support-advisors-viewport:hover .support-advisors-track,
        .support-advisors-viewport:focus-within .support-advisors-track {
          animation-play-state: paused;
        }

        @keyframes support-advisors-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .support-advisors-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
