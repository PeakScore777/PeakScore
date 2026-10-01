"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050d24] text-white">
      {/* ============================================================
          FONDO DESKTOP
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat lg:block"
        style={{
          backgroundImage: "url('/images/register/register_bg.webp')",
        }}
      />

      {/* ============================================================
          FONDO MOBILE
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat lg:hidden"
        style={{
          backgroundImage:
            "url('/images/register/register_bg-mobile.webp')",
        }}
      />

      {/* ============================================================
          OVERLAY GENERAL
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#020817]/10"
      />

      {/* ============================================================
          OVERLAY MOBILE
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#020817]/20 lg:hidden"
      />

      {/* ============================================================
          DEGRADADO INFERIOR
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-[#020617]/70 via-[#020617]/10 to-transparent"
      />

      {/* ============================================================
          CONTENIDO
      ============================================================ */}

      <div className="relative z-10 min-h-screen">
        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-[1500px]
            items-center
            px-5
            py-8
            sm:px-8
            lg:px-12
            xl:px-16
          "
        >
          <div
            className="
              grid
              w-full
              items-center
              gap-10
              lg:grid-cols-[1.05fr_0.75fr]
              xl:gap-20
            "
          >
            {/* ======================================================
                PRESENTACIÓN
            ====================================================== */}

            <section
              className="
                max-w-2xl
                -translate-y-8
                sm:-translate-y-12
                lg:-translate-y-[145px]
                lg:pt-0
              "
            >
              {/* ====================================================
                  TITULAR
              ==================================================== */}

              <h1
                className="
                  max-w-[680px]
                  font-mono
                  text-4xl
                  font-black
                  uppercase
                  leading-[0.9]
                  tracking-[-0.065em]
                  text-white
                  drop-shadow-[0_6px_0_rgba(15,23,42,0.95)]
                  sm:text-5xl
                  md:text-6xl
                  xl:text-7xl
                "
              >
                Una cuenta.

                <span className="block text-cyan-300 drop-shadow-[0_0_24px_rgba(34,211,238,0.55)]">
                  Un nuevo
                </span>

                <span className="block">comienzo.</span>
              </h1>

              {/* ====================================================
                  DESCRIPCIÓN
              ==================================================== */}

              <p
                className="
                  mt-6
                  max-w-xl
                  font-sans
                  text-sm
                  font-semibold
                  leading-6
                  text-white
                  drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]
                  sm:text-base
                  sm:leading-7
                "
              >
                Elige cómo quieres formar parte de PeakScore y comienza tu
                aventura hacia un mejor resultado en el ICFES.
              </p>

              {/* ====================================================
                  FRASE
              ==================================================== */}

              <div
                className="
                  mt-7
                  flex
                  items-center
                  gap-3
                  font-mono
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.14em]
                  text-white
                  drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]
                  sm:text-xs
                  sm:tracking-[0.16em]
                "
              >
                <span className="h-px w-8 bg-cyan-300 sm:w-10" />

                TU PROGRESO COMIENZA AQUÍ

                <span className="h-px w-8 bg-cyan-300 sm:w-10" />
              </div>
            </section>

            {/* ======================================================
                SELECTOR DE CUENTA
            ====================================================== */}

            <section
              className="
                mx-auto
                w-full
                max-w-[560px]
                pb-6
                lg:translate-y-[5px]
                lg:pb-0
              "
            >
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-cyan-300/35
                  bg-[#06122f]/90
                  p-4
                  shadow-[0_25px_90px_rgba(0,0,0,0.55),0_0_45px_rgba(34,211,238,0.08)]
                  backdrop-blur-xl
                  sm:p-6
                "
              >
                {/* ==================================================
                    PIXELES DECORATIVOS
                ================================================== */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    right-0
                    top-0
                    grid
                    grid-cols-4
                    gap-1
                    p-4
                    opacity-60
                  "
                >
                  <span className="h-2 w-2 bg-cyan-400" />
                  <span className="h-2 w-2 bg-blue-500" />
                  <span className="h-2 w-2 bg-purple-500" />
                  <span className="h-2 w-2 bg-transparent" />

                  <span className="h-2 w-2 bg-blue-500" />
                  <span className="h-2 w-2 bg-cyan-400" />
                  <span className="h-2 w-2 bg-transparent" />
                  <span className="h-2 w-2 bg-purple-500" />

                  <span className="h-2 w-2 bg-purple-500" />
                  <span className="h-2 w-2 bg-transparent" />
                  <span className="h-2 w-2 bg-blue-500" />
                  <span className="h-2 w-2 bg-cyan-400" />
                </div>

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="relative">
                  <h2
                    className="
                      font-mono
                      text-2xl
                      font-black
                      uppercase
                      tracking-[-0.045em]
                      text-white
                      sm:text-3xl
                    "
                  >
                    Crea tu cuenta
                  </h2>

                  <p
                    className="
                      mt-2
                      max-w-md
                      font-sans
                      text-xs
                      font-medium
                      leading-5
                      text-slate-200
                      sm:text-sm
                      sm:leading-6
                    "
                  >
                    Selecciona tu camino para comenzar.
                  </p>
                </div>

                {/* ==================================================
                    TARJETA PERSONAL
                ================================================== */}

                <div className="relative mt-5 sm:mt-6">
                  <Link
                    href="/register/user"
                    className="
                      group
                      relative
                      block
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-cyan-400/70
                      bg-[#071b43]
                      shadow-[0_0_25px_rgba(34,211,238,0.10)]
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-cyan-300
                      hover:shadow-[0_15px_45px_rgba(34,211,238,0.25)]
                    "
                  >
                    {/* IMAGEN */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-cover
                        bg-center
                        bg-no-repeat
                        transition-transform
                        duration-500
                        group-hover:scale-[1.025]
                      "
                      style={{
                        backgroundImage:
                          "url('/images/register/register_personal_bg.webp')",
                      }}
                    />

                    {/* OSCURECER LADO IZQUIERDO */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-[#031331]/95
                        via-[#031331]/75
                        via-[45%]
                        to-transparent
                      "
                    />

                    {/* GLOW */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-cyan-400/10
                        via-transparent
                        to-transparent
                        opacity-0
                        transition-opacity
                        duration-300
                        group-hover:opacity-100
                      "
                    />

                    {/* CONTENIDO */}

                    <div
                      className="
                        relative
                        flex
                        min-h-[150px]
                        items-center
                        px-5
                        py-5
                        sm:min-h-[165px]
                        sm:px-6
                      "
                    >
                      <div className="max-w-[52%] sm:max-w-[54%]">
                        {/* BADGE */}

                        <div
                          className="
                            inline-flex
                            items-center
                            rounded-md
                            border
                            border-cyan-300/60
                            bg-cyan-400/10
                            px-2.5
                            py-1
                            font-mono
                            text-[8px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-cyan-300
                            shadow-[0_0_12px_rgba(34,211,238,0.12)]
                            sm:text-[9px]
                          "
                        >
                          PLAYER
                        </div>

                        {/* TÍTULO */}

                        <h3
                          className="
                            mt-3
                            font-mono
                            text-xl
                            font-black
                            uppercase
                            leading-[0.9]
                            tracking-[-0.04em]
                            text-white
                            drop-shadow-[0_3px_0_rgba(15,23,42,0.95)]
                            sm:text-2xl
                          "
                        >
                          CUENTA
                          <span className="block">PERSONAL</span>
                        </h3>

                        {/* DESCRIPCIÓN */}

                        <p
                          className="
                            mt-3
                            font-sans
                            text-[10px]
                            font-semibold
                            leading-[1.45]
                            text-white
                            drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]
                            sm:text-xs
                            sm:leading-5
                          "
                        >
                          Juega. Practica. Supera.
                          <br />
                          Entrena para el ICFES y
                          <br />
                          construye tu progreso.
                        </p>
                      </div>

                      {/* FLECHA */}

                      <div
                        className="
                          absolute
                          right-4
                          top-1/2
                          flex
                          h-10
                          w-10
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-cyan-300/50
                          bg-[#06183a]/80
                          text-cyan-300
                          shadow-[0_0_20px_rgba(34,211,238,0.12)]
                          transition-all
                          duration-300
                          group-hover:translate-x-1
                          group-hover:border-cyan-200
                          group-hover:bg-cyan-400/15
                          sm:right-5
                          sm:h-11
                          sm:w-11
                        "
                      >
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* ==================================================
                    TARJETA INSTITUCIONAL
                ================================================== */}

                <div className="relative mt-4 sm:mt-5">
                  <Link
                    href="/register/institution"
                    className="
                      group
                      relative
                      block
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-purple-400/70
                      bg-[#120d35]
                      shadow-[0_0_25px_rgba(168,85,247,0.10)]
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:border-purple-300
                      hover:shadow-[0_15px_45px_rgba(168,85,247,0.25)]
                    "
                  >
                    {/* IMAGEN */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-cover
                        bg-center
                        bg-no-repeat
                        transition-transform
                        duration-500
                        group-hover:scale-[1.025]
                      "
                      style={{
                        backgroundImage:
                          "url('/images/register/register_institution_bg.webp')",
                      }}
                    />

                    {/* OSCURECER LADO IZQUIERDO */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-[#100b32]/95
                        via-[#100b32]/75
                        via-[45%]
                        to-transparent
                      "
                    />

                    {/* GLOW */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute
                        inset-0
                        bg-gradient-to-r
                        from-purple-400/10
                        via-transparent
                        to-transparent
                        opacity-0
                        transition-opacity
                        duration-300
                        group-hover:opacity-100
                      "
                    />

                    {/* CONTENIDO */}

                    <div
                      className="
                        relative
                        flex
                        min-h-[150px]
                        items-center
                        px-5
                        py-5
                        sm:min-h-[165px]
                        sm:px-6
                      "
                    >
                      <div className="max-w-[52%] sm:max-w-[54%]">
                        {/* BADGE */}

                        <div
                          className="
                            inline-flex
                            items-center
                            rounded-md
                            border
                            border-purple-300/60
                            bg-purple-400/10
                            px-2.5
                            py-1
                            font-mono
                            text-[8px]
                            font-black
                            uppercase
                            tracking-[0.12em]
                            text-purple-200
                            shadow-[0_0_12px_rgba(168,85,247,0.12)]
                            sm:text-[9px]
                          "
                        >
                          SCHOOL
                        </div>

                        {/* TÍTULO */}

                        <h3
                          className="
                            mt-3
                            font-mono
                            text-xl
                            font-black
                            uppercase
                            leading-[0.9]
                            tracking-[-0.04em]
                            text-white
                            drop-shadow-[0_3px_0_rgba(15,23,42,0.95)]
                            sm:text-2xl
                          "
                        >
                          CUENTA
                          <span className="block">INSTITUCIONAL</span>
                        </h3>

                        {/* DESCRIPCIÓN */}

                        <p
                          className="
                            mt-3
                            font-sans
                            text-[10px]
                            font-semibold
                            leading-[1.45]
                            text-white
                            drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]
                            sm:text-xs
                            sm:leading-5
                          "
                        >
                          Impulsa tu institución.
                          <br />
                          Organiza tu comunidad educativa
                          <br />
                          y potencia el aprendizaje.
                        </p>
                      </div>

                      {/* FLECHA */}

                      <div
                        className="
                          absolute
                          right-4
                          top-1/2
                          flex
                          h-10
                          w-10
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-lg
                          border
                          border-purple-300/50
                          bg-[#170d3e]/80
                          text-purple-200
                          shadow-[0_0_20px_rgba(168,85,247,0.12)]
                          transition-all
                          duration-300
                          group-hover:translate-x-1
                          group-hover:border-purple-200
                          group-hover:bg-purple-400/15
                          sm:right-5
                          sm:h-11
                          sm:w-11
                        "
                      >
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                </div>

                {/* ==================================================
                    SEPARADOR
                ================================================== */}

                <div className="my-5 flex items-center gap-3 sm:my-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

                  <span
                    className="
                      whitespace-nowrap
                      font-mono
                      text-[8px]
                      font-black
                      uppercase
                      tracking-[0.14em]
                      text-slate-300
                      sm:text-[9px]
                    "
                  >
                    ¿YA TIENES UNA CUENTA?
                  </span>

                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                </div>

                {/* ==================================================
                    LOGIN
                ================================================== */}

                <Link
                  href="/login"
                  className="
                    group
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-lg
                    border
                    border-cyan-400/40
                    bg-cyan-400/10
                    font-mono
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-cyan-200
                    shadow-[0_0_18px_rgba(34,211,238,0.05)]
                    transition-all
                    duration-200
                    hover:border-cyan-300
                    hover:bg-cyan-400/15
                    hover:text-white
                    hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]
                    sm:h-12
                    sm:text-xs
                  "
                >
                  INICIAR SESIÓN

                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <p
                  className="
                    mt-4
                    text-center
                    font-mono
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-slate-500
                    sm:mt-5
                    sm:text-[9px]
                  "
                >
                  TU AVENTURA · TU PROGRESO · TU PEAK
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}