"use client";

import Image from "next/image";

export default function LoginAdministrador() {
  return (
    <main className="loginAdminContenedor">
      <div className="loginAdminTarjeta">

        <div className="loginAdminLadoLogo">

          <Image
  src="/images/logo/logo.png"
  alt="Logo WorldCam"
  width={380}
  height={380}
  className="loginAdminImagenLogo"
  unoptimized
  priority
/>

<h2 className="loginAdminTituloEmpresa">
  Panel Administrativo
</h2>

<p className="loginAdminDescripcionEmpresa">
  Bienvenido al sistema administrativo de WorldCam.
</p>

        </div>

        <div className="loginAdminLadoFormulario">

          <h1 className="loginAdminTitulo">
            Iniciar Sesión
          </h1>

          <p className="loginAdminSubtitulo">
            Accede con tu cuenta de administrador.
          </p>

          <form className="loginAdminFormulario">

            <div className="loginAdminGrupoCampo">

              <label className="loginAdminEtiqueta">
                Correo electrónico
              </label>

              <input
                type="email"
                placeholder="correo@worldcamdemexico.com"
                className="loginAdminCampoTexto"
              />

            </div>

            <div className="loginAdminGrupoCampo">

              <label className="loginAdminEtiqueta">
                Contraseña
              </label>

              <input
                type="password"
                placeholder="********"
                className="loginAdminCampoTexto"
              />

            </div>

            <button
              type="submit"
              className="loginAdminBoton"
            >
              Ingresar
            </button>

          </form>

          <a href="#" className="loginAdminOlvido">
            ¿Olvidaste tu contraseña?
          </a>

        </div>

      </div>
    </main>
  );
}