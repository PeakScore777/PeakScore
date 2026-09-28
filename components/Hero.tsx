"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Press_Start_2P } from "next/font/google";

import type { LandingTheme } from "@/components/Navbar";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type HeroProps = {
  theme: LandingTheme;
};

export default function Hero({ theme }: HeroProps) {
  const isDark = theme === "dark";

  return (
    <section
      id="inicio"
      className={`
        hero-home
        relative
        isolate
        min-h-[calc(100svh-78px)]
        overflow-hidden
        ${
          isDark
            ? "bg-[#06100b] text-white"
            : "bg-[#f5f7f2] text-slate-950"
        }
      `}
    >
      {/* ============================================================
          BACKGROUNDS
      ============================================================ */}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 overflow-hidden"
      >
        {/* ==========================================================
            DESKTOP
        ========================================================== */}

        <div className="absolute inset-0 hidden md:block">
          {/* OSCURO */}

          <Image
            src="/peaky/homepage/herooscuro.webp"
            alt=""
            fill
            priority
            sizes="100%"
            className={`
              object-cover
              object-center
              transition-opacity
              duration-300
              ease-out
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          />

          {/* CLARO */}

          <Image
            src="/peaky/homepage/heroclaro.webp"
            alt=""
            fill
            priority
            sizes="100%"
            className={`
              object-cover
              object-center
              transition-opacity
              duration-300
              ease-out
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          />
        </div>

        {/* ==========================================================
            MOBILE
        ========================================================== */}

        <div className="absolute inset-0 md:hidden">
          {/* OSCURO */}

          <Image
            src="/peaky/homepage/heromobileoscuro.webp"
            alt=""
            fill
            priority
            sizes="100%"
            className={`
              object-cover
              object-center
              transition-opacity
              duration-300
              ease-out
              ${
                isDark
                  ? "opacity-100"
                  : "opacity-0"
              }
            `}
          />

          {/* CLARO */}

          <Image
            src="/peaky/homepage/heromobileclaro.webp"
            alt=""
            fill
            priority
            sizes="100%"
            className={`
              object-cover
              object-center
              transition-opacity
              duration-300
              ease-out
              ${
                isDark
                  ? "opacity-0"
                  : "opacity-100"
              }
            `}
          />
        </div>

        {/* ========================================================
            CAPA DE LEGIBILIDAD
        ======================================================== */}

        <div
          className={`
            absolute
            inset-0
            transition-opacity
            duration-300
            ease-out
            ${
              isDark
                ? "bg-gradient-to-r from-[#06100b]/95 via-[#06100b]/55 to-transparent"
                : "bg-gradient-to-r from-white/95 via-white/65 to-white/10"
            }
          `}
        />

        <div
          className={`
            absolute
            inset-0
            transition-opacity
            duration-300
            ease-out
            ${
              isDark
                ? "bg-gradient-to-t from-black/35 via-transparent to-transparent"
                : "bg-gradient-to-t from-black/10 via-transparent to-white/10"
            }
          `}
        />
      </div>

      {/* ============================================================
          CONTENT
      ============================================================ */}

      <div className="mx-auto flex min-h-[calc(100svh-78px)] w-full max-w-[1440px] items-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">

          {/* ======================================================
              COPY
          ====================================================== */}

          <div className="relative z-20 max-w-[680px] pt-4 text-center lg:pt-0 lg:text-left">

            {/* BADGE */}

            <div
              className={`
                mb-6
                inline-flex
                items-center
                gap-3
                rounded-full
                border
                px-4
                py-2
                shadow-sm
                backdrop-blur-md
                transition-colors
                duration-300
                ${
                  isDark
                    ? "border-emerald-400/25 bg-black/20"
                    : "border-emerald-600/25 bg-white/75"
                }
              `}
            >
              <span
                className={`
                  h-2
                  w-2
                  rounded-full
                  shadow-[0_0_12px_rgba(132,204,22,0.8)]
                  ${
                    isDark
                      ? "bg-lime-400"
                      : "bg-lime-500"
                  }
                `}
              />

              <span
                className={`
                  font-sans
                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.22em]
                  ${
                    isDark
                      ? "text-emerald-300"
                      : "text-emerald-800"
                  }
                `}
              >
                Preparación ICFES
              </span>
            </div>

            {/* ==================================================
                TITLE
            ================================================== */}

            <h1
              className={`
                ${pixelFont.className}
                mx-auto
                max-w-[680px]
                text-[30px]
                leading-[1.55]
                tracking-[-0.025em]
                transition-colors
                duration-300
                sm:text-[38px]
                md:text-[44px]
                lg:mx-0
                lg:text-[48px]
                xl:text-[56px]
                ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }
              `}
            >
              Prepárate.
              <br />

              <span
                className={
                  isDark
                    ? "text-lime-400"
                    : "text-emerald-600"
                }
              >
                Mejora.
              </span>

              <br />

              <span>
                Alcanza tu meta.
              </span>
            </h1>

            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <p
              className={`
                mx-auto
                mt-6
                max-w-[560px]
                font-sans
                text-[15px]
                font-medium
                leading-7
                transition-colors
                duration-300
                sm:text-[16px]
                lg:mx-0
                ${
                  isDark
                    ? "text-white/70"
                    : "text-slate-700"
                }
              `}
            >
              Simulacros tipo ICFES, práctica inteligente y
              seguimiento de tu progreso en un solo lugar.
            </p>

            {/* ==================================================
                BUTTONS
            ================================================== */}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">

              {/* PRIMARY */}

              <Link
                href="/register"
                className={`
                  group
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  gap-3
                  rounded-xl
                  px-6
                  py-3
                  font-sans
                  text-sm
                  font-extrabold
                  shadow-[0_12px_30px_rgba(5,150,105,0.22)]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  ${
                    isDark
                      ? "bg-lime-500 text-[#08110a] hover:bg-lime-400"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }
                `}
              >
                Comenzar preparación

                <ArrowRight
                  size={17}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              {/* SECONDARY */}

              <Link
                href="#features"
                className={`
                  inline-flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  px-6
                  py-3
                  font-sans
                  text-sm
                  font-bold
                  backdrop-blur-md
                  transition-all
                  duration-200
                  ${
                    isDark
                      ? "border-white/15 bg-black/20 text-white/85 hover:bg-white/10"
                      : "border-slate-300/80 bg-white/65 text-slate-800 hover:bg-white"
                  }
                `}
              >
                <Play
                  size={15}
                  fill="currentColor"
                />

                Conoce PeakScore
              </Link>
            </div>

            {/* FOOTNOTE */}

            <p
              className={`
                mt-5
                font-sans
                text-[11px]
                font-medium
                transition-colors
                duration-300
                ${
                  isDark
                    ? "text-white/45"
                    : "text-slate-500"
                }
              `}
            >
              Diseñado para acompañarte desde la práctica
              hasta el examen.
            </p>
          </div>

          {/* ======================================================
              PEAKY
          ====================================================== */}

          <div className="relative z-10 flex min-h-[360px] items-end justify-center sm:min-h-[450px] lg:min-h-[620px] lg:justify-end xl:min-h-[680px]">

            <div className="peaky-home relative h-[380px] w-[310px] sm:h-[470px] sm:w-[390px] md:h-[520px] md:w-[430px] lg:h-[610px] lg:w-[500px] xl:h-[680px] xl:w-[555px]">

              {/* ==================================================
                  PEAKY OSCURO
              ================================================== */}

              <Image
                src="/peaky/homepage/heropeakyoscuro.webp"
                alt="Peaky, mascota de PeakScore"
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 310px, (max-width: 1024px) 500px, 555px"
                className={`
                  absolute
                  inset-0
                  object-contain
                  object-bottom
                  transition-opacity
                  duration-300
                  ease-out
                  ${
                    isDark
                      ? "opacity-100"
                      : "opacity-0"
                  }
                  ${
                    isDark
                      ? "drop-shadow-[0_28px_45px_rgba(0,0,0,0.5)]"
                      : ""
                  }
                `}
              />

              {/* ==================================================
                  PEAKY CLARO
              ================================================== */}

              <Image
                src="/peaky/homepage/heropeakyclaro.webp"
                alt=""
                fill
                priority
                unoptimized
                aria-hidden="true"
                sizes="(max-width: 640px) 310px, (max-width: 1024px) 500px, 555px"
                className={`
                  absolute
                  inset-0
                  object-contain
                  object-bottom
                  transition-opacity
                  duration-300
                  ease-out
                  ${
                    isDark
                      ? "opacity-0"
                      : "opacity-100"
                  }
                  ${
                    !isDark
                      ? "drop-shadow-[0_28px_38px_rgba(20,50,25,0.24)]"
                      : ""
                  }
                `}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          SCROLL CUE
      ============================================================ */}

      <div
        className={`
          absolute
          bottom-5
          left-1/2
          hidden
          -translate-x-1/2
          items-center
          gap-2
          font-sans
          text-[9px]
          font-bold
          uppercase
          tracking-[0.2em]
          lg:flex
          ${
            isDark
              ? "text-white/35"
              : "text-slate-500/70"
          }
        `}
      >
        <span
          className={`
            h-1.5
            w-1.5
            rounded-full
            ${
              isDark
                ? "bg-lime-400"
                : "bg-emerald-500"
            }
          `}
        />

        Explora PeakScore
      </div>

      {/* ============================================================
          ANIMATIONS
      ============================================================ */}

      <style jsx>{`
        .hero-home {
          isolation: isolate;
        }

        .peaky-home {
          animation: peakyFloat 5.5s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes peakyFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -8px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .peaky-home {
            animation: none;
          }
        }

        @media (max-width: 639px) {
          .hero-home {
            min-height: calc(100svh - 64px);
          }

          .peaky-home {
            margin-bottom: -8px;
          }
        }
      `}</style>
    </section>
  );
}