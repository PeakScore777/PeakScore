"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import PeakScoreLogo from "@/components/PeakScoreLogo";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * ============================================================
   * SEGURIDAD DE CONTRASEÑA
   * ============================================================
   */

  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 8
        ? 1
        : password.length < 12
          ? 2
          : 3;

  /*
   * ============================================================
   * REGISTRO
   * ============================================================
   */

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    /*
     * VALIDACIÓN BÁSICA
     */

    if (!name.trim() || !email.trim() || !password) {
      setError(
        "Completa todos los campos para continuar."
      );

      return;
    }

    /*
     * CONTRASEÑA MÍNIMA
     */

    if (password.length < 12) {
      setError(
        "La contraseña debe tener al menos 12 caracteres."
      );

      return;
    }

    setLoading(true);

    /*
     * ==========================================================
     * CREAR USUARIO EN SUPABASE AUTH
     * ==========================================================
     *
     * IMPORTANTE:
     *
     * El perfil NO se crea desde aquí.
     *
     * PostgreSQL lo crea automáticamente mediante el trigger
     * que acabamos de configurar sobre auth.users.
     */

    const {
      data,
      error: registerError,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    /*
     * ERROR DE REGISTRO
     */

    if (registerError) {
      console.error(
        "[PeakScore] Error creando cuenta:",
        registerError
      );

      setLoading(false);

      setError(registerError.message);

      return;
    }

    /*
     * ==========================================================
     * CUENTA CREADA
     * ==========================================================
     *
     * En este punto:
     *
     * auth.users -> creado
     * profiles   -> creado por el trigger
     *
     * Si la confirmación por correo está activada,
     * Supabase normalmente no inicia sesión todavía.
     */

    if (data.user) {
      console.log(
        "[PeakScore] Usuario creado correctamente:",
        data.user.id
      );
    }

    setLoading(false);

    /*
     * AVISO AL USUARIO
     */

    alert(
      "Cuenta creada correctamente. Revisa tu correo para confirmar tu cuenta."
    );

    /*
     * Limpiamos el formulario
     */

    setName("");
    setEmail("");
    setPassword("");
  };

  /*
   * ============================================================
   * INTERFAZ
   * ============================================================
   */

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">

      {/* ======================================================
          FONDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/[0.07] blur-[120px]" />

        <div className="absolute -right-40 top-[20%] h-[500px] w-[500px] rounded-full bg-cyan-400/[0.06] blur-[130px]" />

        <div className="absolute bottom-[-250px] left-[40%] h-[550px] w-[550px] rounded-full bg-blue-600/[0.05] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="absolute left-[8%] top-[18%] text-[120px] font-black text-blue-600/[0.025]">
          P
        </div>

        <div className="absolute bottom-[8%] right-[8%] text-[150px] font-black text-blue-600/[0.02]">
          500
        </div>

      </div>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 sm:px-8">

        <div className="grid w-full items-center gap-14 lg:grid-cols-[1fr_0.9fr]">

          {/* ==================================================
              PRESENTACIÓN
          ================================================== */}

          <section className="hidden lg:block">

            <Link
              href="/"
              aria-label="PeakScore inicio"
              className="inline-flex"
            >
              <PeakScoreLogo
                variant="dark"
                showTagline={true}
                compact={false}
              />
            </Link>

            <div className="mt-14 max-w-xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Preparación ICFES
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.03] tracking-[-0.045em] text-slate-950 xl:text-6xl">
                Empieza a construir

                <span className="block text-blue-600">
                  tu mejor puntaje.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
                Crea tu cuenta y empieza a prepararte con
                herramientas diseñadas para medir, practicar
                y mejorar tu desempeño.
              </p>

              <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">

                {[
                  "Simulacros tipo ICFES",
                  "Banco de preguntas",
                  "Seguimiento de progreso",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur"
                  >

                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Check className="h-4 w-4" />
                    </div>

                    <p className="text-xs font-semibold leading-5 text-slate-700">
                      {item}
                    </p>

                  </div>
                ))}

              </div>

              <div className="mt-10 flex items-center gap-4">

                <div className="flex -space-x-2">
                  <span className="h-9 w-9 rounded-full border-2 border-white bg-slate-200" />
                  <span className="h-9 w-9 rounded-full border-2 border-white bg-blue-100" />
                  <span className="h-9 w-9 rounded-full border-2 border-white bg-slate-300" />
                </div>

                <p className="text-sm text-slate-500">
                  Tu preparación empieza con una decisión.
                </p>

              </div>

            </div>

          </section>

          {/* ==================================================
              REGISTRO
          ================================================== */}

          <section className="mx-auto w-full max-w-[480px]">

            <div className="rounded-[30px] border border-slate-200/80 bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-9">

              {/* LOGO MÓVIL */}

              <div className="mb-8 lg:hidden">

                <Link
                  href="/"
                  aria-label="PeakScore inicio"
                  className="inline-flex"
                >
                  <PeakScoreLogo
                    variant="dark"
                    showTagline={true}
                    compact={true}
                  />
                </Link>

              </div>

              {/* ==================================================
                  CABECERA
              ================================================== */}

              <div>

                <p className="text-sm font-bold text-blue-600">
                  PEAKSCORE
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                  Crea tu cuenta
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Empieza tu preparación y lleva tu progreso
                  contigo.
                </p>

              </div>

              {/* ==================================================
                  FORMULARIO
              ================================================== */}

              <form
                onSubmit={handleRegister}
                className="mt-8 space-y-5"
              >

                {/* NOMBRE */}

                <div>

                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Nombre completo
                  </label>

                  <div className="relative">

                    <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                  </div>

                </div>

                {/* CORREO */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Correo electrónico
                  </label>

                  <div className="relative">

                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                  </div>

                </div>

                {/* CONTRASEÑA */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Contraseña
                    </label>

                    <span className="text-[11px] text-slate-400">
                      Mínimo 12 caracteres
                    </span>

                  </div>

                  <div className="relative">

                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Crea una contraseña segura"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value
                        )
                      }
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>

                  </div>

                  {/* FUERZA */}

                  {password.length > 0 && (
                    <div className="mt-3">

                      <div className="flex gap-1.5">

                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              passwordStrength >= level
                                ? "bg-blue-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}

                      </div>

                      <p className="mt-1.5 text-[11px] text-slate-400">

                        {passwordStrength === 1 &&
                          "Añade más caracteres."}

                        {passwordStrength === 2 &&
                          "Ya casi. Hazla más segura."}

                        {passwordStrength === 3 &&
                          "Contraseña fuerte."}

                      </p>

                    </div>
                  )}

                </div>

                {/* ERROR */}

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                    {error}
                  </div>
                )}

                {/* ==================================================
                    BOTÓN
                ================================================== */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_32px_rgba(37,99,235,0.27)] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear mi cuenta

                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}

                </button>

              </form>

              {/* ==================================================
                  LOGIN
              ================================================== */}

              <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                <p className="text-sm text-slate-500">
                  ¿Ya tienes una cuenta?
                </p>

                <Link
                  href="/login"
                  className="mt-1 inline-block text-sm font-bold text-blue-600 transition hover:text-blue-700"
                >
                  Iniciar sesión
                </Link>

              </div>

            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              Al crear tu cuenta comienzas tu preparación en
              PeakScore.
            </p>

          </section>

        </div>

      </div>

    </main>
  );
}