"use client";

import { Handshake } from "lucide-react";

import { useState } from "react";

const VOLUMEN_OPCIONES = [
  "0 a $49,999.00",
  "$50,000.00 a $200,000.00",
  "Más de $200,000.00",
];

const CATEGORIAS_VOLUMEN = [
  { key: "seguridad", label: "Seguridad Electrónica", noLabel: "No compro productos de seguridad" },
  { key: "redes", label: "Productos de Redes", noLabel: "No compro productos de redes" },
  { key: "voip", label: "VoIP", noLabel: "No compro productos de VoIP" },
  { key: "computo", label: "Cómputo", noLabel: "No compro productos de cómputo" },
  { key: "iluminacion", label: "Iluminación LED", noLabel: "No compro productos de iluminación" },
  { key: "accesorios", label: "Accesorios", noLabel: "No compro productos de accesorios" },
];

const USO_CFDI = [
  "G01 – Adquisición de mercancias",
  "G03 – Gastos en general",
  "I01 – Construcciones",
  "P01 – Por definir",
];

const REGIMEN_FISCAL = [
  "601 – General de Ley Personas Morales",
  "612 – Personas Físicas con Actividades Empresariales",
  "616 – Sin obligaciones fiscales",
  "626 – Simplificado de Confianza",
];

// SVG Icons (sin cambios)
// SVG Icons
const IconUser = () => (
  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconChart = () => (
  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconBriefcase = () => (
  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const IconFile = () => (
  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);

const IconUpload = () => (
  <svg width="24" height="24" fill="none" stroke="#6b7280" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconSend = () => (
  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
export default function DistribuidorPage() {
  const [personalidad, setPersonalidad] = useState<"moral" | "fisica">("moral");
  const [volumen, setVolumen] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  const handleVolumen = (cat: string, val: string) =>
    setVolumen((prev) => ({ ...prev, [cat]: val }));

  const handleFile = (key: string, file: File | undefined) => {
    if (file) setUploadedFiles((prev) => ({ ...prev, [key]: file.name }));
  };

  return (
    <div className="dist-page">
      {/* HERO */}
      <div className="dist-hero">
  <div className="dist-hero-decor-left" />

  <div className="dist-hero-decor-right">
  <Handshake size={100} color="white" strokeWidth={1.2}  />
</div>

  <div className="dist-hero-badge">Red de Distribuidores WorldCam</div>
  <h1 className="dist-hero-title">
    Únete a nuestra red<br />
    <span className="dist-hero-title-accent">y crece con nosotros</span>
  </h1>
  <p className="dist-hero-subtitle">
    Completa el formulario y da el primer paso para representar soluciones
    de seguridad, redes y tecnología de alta calidad.
  </p>
</div>

      {/* FORM */}
      <div className="dist-container">
        <div className="dist-form-wrapper">
          <p className="dist-required-note">
            <span style={{ color: "#e30613", fontWeight: 700 }}>*</span>
            Los campos marcados con asterisco son obligatorios.
          </p>

          {/* SECCIÓN 1 */}
          <div className="dist-section">
            <div className="dist-section-header">
              <div className="dist-section-icon"><IconUser /></div>
              <h2 className="dist-section-title">Datos del Representante y Empresa</h2>
            </div>
            <div className="dist-section-divider" />

            <div className="dist-grid-3 dist-mb">
              <div className="dist-field-group">
                <label className="dist-label">Nombre <span className="dist-required">*</span></label>
                <input className="dist-input" placeholder="Ej. Juan" />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Apellido Paterno <span className="dist-required">*</span></label>
                <input className="dist-input" placeholder="Ej. García" />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Apellido Materno <span className="dist-required">*</span></label>
                <input className="dist-input" placeholder="Ej. López" />
              </div>
            </div>

            <div className="dist-grid-2 dist-mb">
              <div className="dist-field-group">
                <label className="dist-label">Correo Electrónico <span className="dist-required">*</span></label>
                <input className="dist-input" type="email" placeholder="correo@empresa.com" />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Teléfono Principal <span className="dist-required">*</span></label>
                <input className="dist-input" type="tel" placeholder="222 000 0000" />
              </div>
            </div>

            <div className="dist-grid-2 dist-mb">
              <div className="dist-field-group">
                <label className="dist-label">RFC</label>
                <input className="dist-input" placeholder="XAXX010101000" />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Razón Social</label>
                <input className="dist-input" placeholder="Nombre de la empresa" />
              </div>
            </div>

            <div className="dist-grid-2 dist-mb">
              <div className="dist-field-group">
                <label className="dist-label">Código Postal <span className="dist-required">*</span></label>
                <input className="dist-input" placeholder="72000" maxLength={5} />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Personalidad Jurídica <span className="dist-required">*</span></label>
                <div className="dist-radio-card">
                  {(["moral", "fisica"] as const).map((opt) => (
                    <label
                      key={opt}
                      className={`dist-radio-option${personalidad === opt ? " active" : ""}`}
                      onClick={() => setPersonalidad(opt)}
                    >
                      <input
                        type="radio"
                        name="personalidad"
                        value={opt}
                        checked={personalidad === opt}
                        onChange={() => setPersonalidad(opt)}
                        className="dist-radio-input"
                      />
                      {opt === "moral" ? "Persona Moral" : "Persona Física"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="dist-grid-2">
              <div className="dist-field-group">
                <label className="dist-label">Uso de CFDI <span className="dist-required">*</span></label>
                <select className="dist-select">
                  <option value="">Seleccionar...</option>
                  {USO_CFDI.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="dist-field-group">
                <label className="dist-label">Régimen Fiscal <span className="dist-required">*</span></label>
                <select className="dist-select">
                  <option value="">Seleccionar...</option>
                  {REGIMEN_FISCAL.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <hr className="dist-hr" />

          {/* SECCIÓN 2 */}
          <div className="dist-section">
            <div className="dist-section-header">
              <div className="dist-section-icon"><IconChart /></div>
              <h2 className="dist-section-title">Volumen de Compra Mensual</h2>
            </div>
            <div className="dist-section-divider" />

            <div className="dist-volumen-grid">
              {CATEGORIAS_VOLUMEN.map((cat) => (
                <div key={cat.key} className="dist-volumen-card">
                  <div className="dist-volumen-card-title">
                    {cat.label} <span className="dist-required">*</span>
                  </div>
                  <div className="dist-volumen-options">
                    {[...VOLUMEN_OPCIONES, cat.noLabel].map((op) => (
                      <label key={op} className="dist-volumen-option">
                        <input
                          type="radio"
                          name={`vol_${cat.key}`}
                          value={op}
                          checked={volumen[cat.key] === op}
                          onChange={() => handleVolumen(cat.key, op)}
                          style={{ accentColor: "#022C96", width: 15, height: 15, flexShrink: 0 }}                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="dist-hr" />

          {/* SECCIÓN 3 */}
          <div className="dist-section">
            <div className="dist-section-header">
              <div className="dist-section-icon"><IconBriefcase /></div>
              <h2 className="dist-section-title">Referencias Comerciales</h2>
            </div>
            <div className="dist-section-divider" />

            <div className="dist-refs-stack">
              <div className="dist-field-group">
                <label className="dist-label">
                  Mayoristas principales <span className="dist-required">*</span>
                </label>
                <textarea
                  className="dist-textarea"
                  placeholder="Mayoristas con los que hoy tengas relación (Por lo menos 1). Si no tienes, escribe NINGUNO."
                />
              </div>
              <div className="dist-field-group">
                <label className="dist-label">
                  Contacto del mayorista <span className="dist-required">*</span>
                </label>
                <textarea
                  className="dist-textarea"
                  placeholder="Nombre, correo y teléfono del contacto del mayorista"
                />
              </div>
            </div>
          </div>

          <hr className="dist-hr" />

          {/* SECCIÓN 4 */}
          <div className="dist-section">
            <div className="dist-section-header">
              <div className="dist-section-icon"><IconFile /></div>
              <h2 className="dist-section-title">Documentación Requerida</h2>
            </div>
            <div className="dist-section-divider" />

            <div className="dist-docs-stack">
              {[
  { key: "situacion", label: "Constancia de Situación Fiscal" },
  { key: "domicilio", label: "Comprobante de Domicilio" },
  { key: "identificacion", label: "Identificación Oficial del Apoderado" },
].map((doc) => (
  <div key={doc.key} className="dist-field-group">
    {/* Este span ya NO es un <label> clickeable, solo texto */}
    <span className="dist-label">
      {doc.label} <span className="dist-optional">(Opcional)</span>
    </span>

    {/* Este label SÍ envuelve solo el upload box */}
    <label htmlFor={`file_${doc.key}`} className="dist-upload-box">
      <IconUpload />
      {uploadedFiles[doc.key] ? (
        <span className="dist-upload-label-success">✓ {uploadedFiles[doc.key]}</span>
      ) : (
        <>
          <span className="dist-upload-label">Haz clic para adjuntar archivo</span>
          <span className="dist-upload-hint">Solo se aceptan archivos PDF</span>
        </>
      )}
      <input
        id={`file_${doc.key}`}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(doc.key, e.target.files?.[0])}
      />
    </label>
  </div>
))}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="dist-submit-wrapper">
            <p className="dist-submit-note">
              Envíanos tu información y te contactaremos en breve
            </p>
            <button className="dist-submit-btn" type="button">
              <IconSend />
              Enviar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}