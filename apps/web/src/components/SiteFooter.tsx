"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function WarrantyBar() {
  return (
    <section className="warranty-bar">

      <div className="warranty-content">

        <p className="warranty-text">
          ¿Necesitas realizar una devolución o solicitar una garantía?
        </p>

        <Link href="/poli_garantia" className="warranty-btn">
          <RotateCcw size={20} />
          Ver políticas de Garantías y Devoluciones
        </Link>

      </div>

    </section>
  );
}