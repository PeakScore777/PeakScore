"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PerfilPage() {
  return (
    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#050A18]
        text-white
      "
    >
      {/* =====================================================
          FONDO PEAKSCORE
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Glow azul */}

        <div
          className="
            absolute
            -left-[180px]
            -top-[180px]
            h-[500px]
            w-[500px]
            rounded-full
            bg-cyan-500/[0.06]
            blur-[130px]
          "
        />

        {/* Glow violeta */}

        <div
          className="
            absolute
            -bottom-[220px]
            -right-[180px]
            h-[560px]
            w-[560px]
            rounded-full
            bg-violet-600/[0.08]
            blur-[140px]
          "
        />

        {/* Glow rosa */}

        <div
          className="
            absolute
            left-[45%]
            top-[30%]
            h-[260px]
            w-[260px]
            rounded-full
            bg-fuchsia-500/[0.035]
            blur-[110px]
          "
        />

        {/* Estrellas */}

        <span
          className="
            absolute
            left-[12%]
            top-[18%]
            h-[3px]
            w-[3px]
            rounded-full
            bg-white
            shadow-[0_0_12px_white]
          "
        />

        <span
          className="
            absolute
            left-[25%]
            top-[11%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-cyan-200
            shadow-[0_0_10px_rgba(103,232,249,1)]
          "
        />

        <span
          className="
            absolute
            right-[19%]
            top-[22%]
            h-[3px]
            w-[3px]
            rounded-full
            bg-fuchsia-300
            shadow-[0_0_12px_rgba(244,114,182,1)]
          "
        />

        <span
          className="
            absolute
            right-[11%]
            bottom-[24%]
            h-[3px]
            w-[3px]
            rounded-full
            bg-yellow-200
            shadow-[0_0_12px_rgba(253,224,71,1)]
          "
        />

        <span
          className="
            absolute
            left-[17%]
            bottom-[19%]
            h-[2px]
            w-[2px]
            rounded-full
            bg-violet-200
            shadow-[0_0_10px_rgba(196,181,253,1)]
          "
        />

      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div
        className="
          relative
          z-10
          min-h-screen
          px-5
          py-6
          sm:px-8
          sm:py-8
        "
      >

        {/* ===================================================
            VOLVER AL DASHBOARD
        =================================================== */}

        <Link
          href="/dashboard"
          className="
            group
            inline-flex
            items-center
            gap-2
            rounded-lg
            px-2
            py-1
            text-sm
            font-medium
            text-slate-500
            transition-all
            duration-300
            hover:text-cyan-300
          "
        >
          <ArrowLeft
            size={17}
            strokeWidth={1.8}
            className="
              transition-transform
              duration-300
              group-hover:-translate-x-1
            "
          />

          <span>
            Volver al Dashboard
          </span>
        </Link>

        {/* ===================================================
            IMAGEN DE MANTENIMIENTO
        =================================================== */}

        <section
          className="
            mx-auto
            mt-5
            flex
            w-full
            max-w-[1500px]
            justify-center
          "
        >
          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[26px]
            "
          >

            {/* Glow detrás de la imagen */}

            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                h-[55%]
                w-[65%]
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                bg-blue-500/[0.05]
                blur-[100px]
              "
            />

            {/* Imagen */}

            <Image
              src="/perfil/mantenimiento2.png"
              alt="Perfil de PeakScore próximamente disponible"
              width={1536}
              height={1024}
              priority
              quality={100}
              sizes="
                (max-width: 768px) 100vw,
                (max-width: 1280px) 100vw,
                1500px
              "
              className="
                relative
                z-10
                block
                h-auto
                w-full
                object-contain
              "
            />

          </div>
        </section>

      </div>
    </main>
  );
}