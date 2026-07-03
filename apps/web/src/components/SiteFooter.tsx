"use client";

import Link from "next/link";
import { RotateCcw, FileLock } from "lucide-react";

export default function WarrantyBar() {
  return (
    <section className="warranty-bar">

      <div className="warranty-content">

        <p className="warranty-text">
          ¿Necesitas ayuda con una garantía, devolución o privacidad?
        </p>

        <div className="warranty-buttons">

          <Link href="/poli_garantia" className="warranty-btn">
            <RotateCcw size={18} />
            <span>Garantías</span>
          </Link>

          <Link href="/avisosprivacidad" className="warranty-btn">
            <FileLock size={18} />
            <span>Privacidad</span>
          </Link>

        </div>

      </div>

    </section>
  );
}