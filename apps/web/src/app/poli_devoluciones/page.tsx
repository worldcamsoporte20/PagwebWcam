import Link from "next/link";
import { Clock3, FileCheck2, PackageCheck, ReceiptText } from "lucide-react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

export default function PoliticaDeDevolucionesPage() {
  return (
    <>
      <SiteHeader active="home" />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-14 text-slate-800 dark:text-slate-100">
        <section className="rounded-3xl bg-[#0b2f78] px-6 py-12 text-white shadow-xl md:px-12">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">WorldCam de México</span>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Política de devoluciones</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-100">
            Consulta los requisitos generales para solicitar la devolución de un producto adquirido con nosotros.
          </p>
        </section>

        <section className="grid gap-5 py-10 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <Clock3 className="text-blue-700 dark:text-blue-300" />
            <h2 className="mt-4 text-xl font-bold">Solicita a tiempo</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">Comunícate con nuestro equipo lo antes posible después de recibir tu pedido.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <PackageCheck className="text-blue-700 dark:text-blue-300" />
            <h2 className="mt-4 text-xl font-bold">Conserva el producto</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">Mantén el producto, accesorios, manuales y empaque en las condiciones en que fueron entregados.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <ReceiptText className="text-blue-700 dark:text-blue-300" />
            <h2 className="mt-4 text-xl font-bold">Presenta tu compra</h2>
            <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">Ten a la mano tu factura, número de pedido y evidencia del estado del producto.</p>
          </article>
        </section>

        <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-blue-100 bg-blue-50 p-7 md:flex-row md:items-center dark:border-blue-900 dark:bg-blue-950/40">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><FileCheck2 size={22} /> Revisión de la solicitud</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Cada solicitud está sujeta a revisión. Nuestro equipo te indicará los pasos y condiciones aplicables.</p>
          </div>
          <Link href="/contacto" className="shrink-0 rounded-xl bg-[#123b8e] px-5 py-3 font-bold text-white transition hover:bg-[#0b2a6c]">Contactar a WorldCam</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
