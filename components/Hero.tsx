"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Press_Start_2P } from "next/font/google";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Hero() {
  return (
    <section
      id="inicio"
      className="hero-home relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#f5f7f2] text-slate-950 dark:bg-[#06100b] dark:text-white"
    >
      {/* ============================================================
          BACKGROUNDS
          Desktop and mobile have separate compositions.
          Light/dark versions switch automatically with the .dark theme.
          ============================================================ */}
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        {/* LIGHT */}
        <div className="hero-bg hero-bg-light absolute inset-0 opacity-100 transition-opacity duration-500 dark:opacity-0">
          <Image
            src="/peaky/homepage/heroclaro.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-center md:block"
          />
          <Image
            src="/peaky/homepage/heromobileclaro.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center md:hidden"
          />
        </div>

        {/* DARK */}
        <div className="hero-bg hero-bg-dark absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100">
          <Image
            src="/peaky/homepage/herooscuro.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-center md:block"
          />
          <Image
            src="/peaky/homepage/heromobileoscuro.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center md:hidden"
          />
        </div>

        {/* Readability layer. It is intentionally subtle so the artwork stays visible. */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/65 to-white/10 dark:from-[#06100b]/95 dark:via-[#06100b]/55 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 dark:from-black/35 dark:to-transparent" />
      </div>

      {/* ============================================================
          CONTENT
          ============================================================ */}
      <div className="mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[1440px] items-center px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4">
          {/* COPY */}
          <div className="relative z-20 max-w-[680px] pt-4 text-center lg:pt-0 lg:text-left">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-emerald-600/25 bg-white/75 px-4 py-2 shadow-sm backdrop-blur-md dark:border-emerald-400/25 dark:bg-black/20">
              <span className="h-2 w-2 rounded-full bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.8)]" />
              <span className="font-sans text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                Preparación ICFES
              </span>
            </div>

            <h1
              className={`${pixelFont.className} mx-auto max-w-[680px] text-[30px] leading-[1.55] tracking-[-0.025em] text-slate-950 sm:text-[38px] md:text-[44px] lg:mx-0 lg:text-[48px] xl:text-[56px] dark:text-white`}
            >
              Prepárate.
              <br />
              <span className="text-emerald-600 dark:text-lime-400">Mejora.</span>
              <br />
              <span>Alcanza tu meta.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-[560px] font-sans text-[15px] font-medium leading-7 text-slate-700 sm:text-[16px] lg:mx-0 dark:text-white/70">
              Simulacros tipo ICFES, práctica inteligente y seguimiento de tu
              progreso en un solo lugar.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/register"
                className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-3 font-sans text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(5,150,105,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-lime-500 dark:text-[#08110a] dark:hover:bg-lime-400"
              >
                Comenzar preparación
                <ArrowRight
                  size={17}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#features"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white/65 px-6 py-3 font-sans text-sm font-bold text-slate-800 backdrop-blur-md transition duration-200 hover:bg-white dark:border-white/15 dark:bg-black/20 dark:text-white/85 dark:hover:bg-white/10"
              >
                <Play size={15} fill="currentColor" />
                Conoce PeakScore
              </Link>
            </div>

            <p className="mt-5 font-sans text-[11px] font-medium text-slate-500 dark:text-white/45">
              Diseñado para acompañarte desde la práctica hasta el examen.
            </p>
          </div>

          {/* PEAKY */}
          <div className="relative z-10 flex min-h-[360px] items-end justify-center sm:min-h-[450px] lg:min-h-[620px] lg:justify-end xl:min-h-[680px]">
            <div className="peaky-home relative h-[380px] w-[310px] sm:h-[470px] sm:w-[390px] md:h-[520px] md:w-[430px] lg:h-[610px] lg:w-[500px] xl:h-[680px] xl:w-[555px]">
              {/* LIGHT PEAKY */}
              <Image
                src="/peaky/homepage/heropeakyclaro.png"
                alt="Peaky, mascota de PeakScore"
                fill
                priority
                sizes="(max-width: 640px) 310px, (max-width: 1024px) 500px, 555px"
                className="peaky-theme-light object-contain object-bottom drop-shadow-[0_28px_38px_rgba(20,50,25,0.24)] dark:opacity-0"
              />

              {/* DARK PEAKY */}
              <Image
                src="/peaky/homepage/heropeakyoscuro.png"
                alt=""
                fill
                sizes="(max-width: 640px) 310px, (max-width: 1024px) 500px, 555px"
                className="peaky-theme-dark absolute inset-0 object-contain object-bottom opacity-0 drop-shadow-[0_28px_45px_rgba(0,0,0,0.5)] dark:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Small scroll cue on larger screens only. */}
      <div className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500/70 lg:flex dark:text-white/35">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-lime-400" />
        Explora PeakScore
      </div>

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
