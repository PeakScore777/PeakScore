"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Press_Start_2P } from "next/font/google";

/* ================================================================
   PEAKSCORE
   HERO — PIXEL / GAMING / ICFES

   VERSION:
   - Pixel typography
   - Pixel cards
   - Pixel statistics
   - Pixel treasure chest
   - Pixel books
   - Pixel plant
   - Pixel crystal
   - No streak
   - No diamonds
   - No level card
   ================================================================ */

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/* ================================================================
   HERO
   ================================================================ */

export default function Hero() {
  return (
    <section
      id="inicio"
      className={`${pixelFont.className} peak-hero relative min-h-[calc(100vh-82px)] overflow-hidden bg-[#020817] text-white`}
    >
      {/* ============================================================
          BACKGROUND
          ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* ----------------------------------------------------------
            BASE
            ---------------------------------------------------------- */}

        <div className="absolute inset-0 bg-[#020817]" />

        {/* ----------------------------------------------------------
            ATMOSPHERE
            ---------------------------------------------------------- */}

        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                ellipse 48% 65% at 68% 55%,
                rgba(10, 70, 220, 0.26) 0%,
                rgba(4, 31, 92, 0.15) 34%,
                transparent 72%
              ),
              radial-gradient(
                ellipse 55% 55% at 27% 88%,
                rgba(0, 66, 210, 0.20) 0%,
                transparent 72%
              ),
              linear-gradient(
                180deg,
                #020617 0%,
                #020817 48%,
                #03112d 100%
              )
            `,
          }}
        />

        {/* ----------------------------------------------------------
            LARGE GRID
            ---------------------------------------------------------- */}

        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(34, 91, 190, 0.42) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(34, 91, 190, 0.42) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "64px 64px",
          }}
        />

        {/* ----------------------------------------------------------
            SMALL GRID
            ---------------------------------------------------------- */}

        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(86, 135, 220, 0.75) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(86, 135, 220, 0.75) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "16px 16px",
          }}
        />

        {/* ----------------------------------------------------------
            BLUE LIGHT
            ---------------------------------------------------------- */}

        <div
          className="absolute left-[45%] top-[12%] h-[700px] w-[700px] rounded-full blur-[160px]"
          style={{
            background:
              "radial-gradient(circle, rgba(16,85,255,0.23) 0%, rgba(16,85,255,0.08) 42%, transparent 73%)",
          }}
        />

        <div
          className="absolute bottom-[-320px] left-[4%] h-[700px] w-[1050px] rounded-full blur-[140px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,73,255,0.27) 0%, rgba(0,55,180,0.08) 45%, transparent 75%)",
          }}
        />

        {/* ----------------------------------------------------------
            PIXEL STARS
            ---------------------------------------------------------- */}

        <PixelStar left="5%" top="17%" size={4} />
        <PixelStar left="18%" top="11%" size={5} />
        <PixelStar left="31%" top="8%" size={4} />
        <PixelStar left="43%" top="18%" size={5} />
        <PixelStar left="57%" top="10%" size={4} />
        <PixelStar left="68%" top="17%" size={5} />
        <PixelStar left="81%" top="9%" size={4} />
        <PixelStar left="94%" top="22%" size={5} />

        <PixelStar left="7%" top="66%" size={4} />
        <PixelStar left="21%" top="75%" size={5} />
        <PixelStar left="38%" top="69%" size={4} />
        <PixelStar left="56%" top="74%" size={5} />
        <PixelStar left="77%" top="71%" size={4} />
        <PixelStar left="91%" top="67%" size={5} />

        {/* ----------------------------------------------------------
            PIXEL PLUS
            ---------------------------------------------------------- */}

        <PixelPlus left="27%" top="20%" />
        <PixelPlus left="39%" top="34%" small />
        <PixelPlus left="56%" top="24%" small />
        <PixelPlus left="73%" top="43%" />
        <PixelPlus left="6%" top="56%" small />
        <PixelPlus left="83%" top="77%" small />

        {/* ----------------------------------------------------------
            TOP LINE
            ---------------------------------------------------------- */}

        <div className="absolute left-0 right-0 top-0 h-px bg-white/[0.07]" />

        {/* ----------------------------------------------------------
            HORIZON
            ---------------------------------------------------------- */}

        <div
          className="absolute bottom-[14%] left-0 right-0 h-[180px]"
          style={{
            background:
              "linear-gradient(to top, rgba(16,76,220,0.17), transparent)",
          }}
        />
      </div>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}

      <div className="relative z-10 mx-auto min-h-[calc(100vh-82px)] max-w-[1600px] px-6 lg:px-8 xl:px-12">
        <div className="grid min-h-[calc(100vh-82px)] grid-cols-1 items-center lg:grid-cols-[0.82fr_1.18fr]">
          {/* ========================================================
              LEFT SIDE
              ======================================================== */}

          <div className="relative z-[70] pt-12 pb-40 lg:pt-0 lg:pb-36 xl:pb-40">
            {/* ------------------------------------------------------
                EYEBROW
                ------------------------------------------------------ */}

            <div className="mb-8 flex items-center gap-4">
              <span className="h-[2px] w-12 bg-[#2675ff] shadow-[0_0_10px_rgba(38,117,255,0.55)]" />

              <span className="font-sans text-[10x] font-bold uppercase tracking-[0.28em] text-[#4b82ff]">
                Preparación ICFES
              </span>

              <span className="hidden font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25 sm:block">
                Colombia / 2026
              </span>
            </div>

            {/* ------------------------------------------------------
                PIXEL TITLE
                ------------------------------------------------------ */}

            <h1 className="pixel-title select-none text-[42px] leading-[1.35] tracking-[-0.035em] sm:text-[52px] md:text-[62px] lg:text-[58px] xl:text-[70px] 2xl:text-[78px]">
              <span className="block text-white">
                Estudia.
              </span>

              <span className="block text-[#2675ff]">
                Entrena.
              </span>

              <span className="block text-white">
                Mejora.
              </span>

              <span className="block text-white">
                Aprende.
              </span>
            </h1>

            {/* ------------------------------------------------------
                DESCRIPTION
                ------------------------------------------------------ */}

            <div className="mt-8 flex max-w-[530px] gap-4">
              <div className="h-[66px] w-[2px] shrink-0 bg-gradient-to-b from-[#2675ff] via-[#2675ff]/70 to-transparent" />

              <p className="font-sans text-[14px] leading-7 text-white/65 sm:text-[15px]">
                Prepárate con simulacros inteligentes, analiza tu
                rendimiento y convierte cada intento en progreso real.
              </p>
            </div>

            {/* ------------------------------------------------------
                BUTTONS
                ------------------------------------------------------ */}

            <div className="mt-9 flex flex-wrap items-center gap-5">
              {/* Primary */}

              <a
                href="/register"
                className="pixel-primary group relative inline-flex h-[58px] items-center gap-5 bg-[#1769ff] px-8 font-sans text-[14px] font-bold text-white shadow-[0_14px_40px_rgba(23,105,255,0.25)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#2778ff]"
              >
                <span>Comenzar preparación</span>

                <ArrowRight
                  size={18}
                  strokeWidth={2.5}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />

                <PixelCorner position="tl" />
                <PixelCorner position="tr" />
                <PixelCorner position="bl" />
                <PixelCorner position="br" />
              </a>

              {/* Secondary */}

              <a
                href="#features"
                className="group relative inline-flex h-[58px] items-center gap-4 border border-[#2675ff]/55 px-7 font-sans text-[14px] font-medium text-white/80 transition-all duration-200 hover:border-[#3983ff] hover:bg-[#2675ff]/5 hover:text-white"
              >
                <span>Ver plataforma</span>

                <ArrowRight
                  size={17}
                  strokeWidth={2}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />

                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#2675ff] transition-all duration-300 group-hover:w-full" />
              </a>
            </div>
          </div>

          {/* ========================================================
              RIGHT SCENE
              ======================================================== */}

          <div className="relative flex min-h-[710px] items-center justify-center lg:min-h-[820px]">
            <div
              className="hero-scene relative h-[720px] w-full max-w-[900px]"
              aria-hidden="true"
            >
              {/* ====================================================
                  BACK GRID
                  ==================================================== */}

              <div
                className="absolute left-[7%] top-[9%] h-[475px] w-[760px] rotate-[-6deg] border border-[#2675ff]/20"
                style={{
                  backgroundImage: `
                    linear-gradient(
                      rgba(38,117,255,0.13) 1px,
                      transparent 1px
                    ),
                    linear-gradient(
                      90deg,
                      rgba(38,117,255,0.13) 1px,
                      transparent 1px
                    )
                  `,
                  backgroundSize: "34px 34px",
                }}
              />

              <div
                className="absolute left-[10%] top-[17%] h-[390px] w-[690px] rotate-[-6deg] opacity-50"
                style={{
                  backgroundImage: `
                    linear-gradient(
                      rgba(38,117,255,0.08) 1px,
                      transparent 1px
                    ),
                    linear-gradient(
                      90deg,
                      rgba(38,117,255,0.08) 1px,
                      transparent 1px
                    )
                  `,
                  backgroundSize: "68px 68px",
                }}
              />

              {/* ====================================================
                  ORBITS
                  ==================================================== */}

              <div className="absolute left-[3%] top-[39%] h-[285px] w-[805px] rotate-[-13deg] rounded-[50%] border border-[#3983ff]/30" />

              <div className="absolute left-[9%] top-[44%] h-[210px] w-[705px] rotate-[-13deg] rounded-[50%] border border-[#2675ff]/15" />

              {/* ====================================================
                  DECORATIVE PIXELS
                  ==================================================== */}

              <PixelDiamond
                className="absolute left-[15%] top-[43%] z-20"
              />

              <PixelDiamond
                className="absolute left-[48%] top-[28%] z-20 scale-75 opacity-75"
              />

              <PixelSquare
                className="absolute left-[9%] top-[56%] z-20"
              />

              <PixelSquare
                className="absolute right-[14%] top-[34%] z-20 scale-75 opacity-70"
              />

              {/* ====================================================
                  PEAKY
                  ==================================================== */}

              <div className="peaky-main absolute left-[11%] top-[8%] z-30 h-[635px] w-[505px]">
                <Image
                  src="/peaky/homepage/heropeaky2.png"
                  alt="Peaky, mascota de PeakScore"
                  fill
                  priority
                  sizes="(max-width: 1024px) 430px, 500px"
                  className="object-contain drop-shadow-[0_30px_65px_rgba(0,0,0,0.78)]"
                />
              </div>

              {/* ====================================================
                  SCORE CARD
                  ==================================================== */}

              <PixelCard className="score-main absolute left-[70%] top-[3%] z-50 w-[330px]">
                <div className="relative p-6">
                  {/* top blue line */}

                  <div className="absolute left-5 right-5 top-0 h-[2px] bg-[#2675ff] shadow-[0_0_12px_rgba(38,117,255,0.75)]" />

                  {/* header */}

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#3983ff]">
                        Puntaje actual
                      </p>

                      <p className="mt-2 font-sans text-[10px] text-white/55">
                        Último simulacro
                      </p>
                    </div>

                    <p className="font-sans text-[10px] font-bold text-[#35d399]">
                      +12
                    </p>
                  </div>

                  {/* score */}

                  <div className="mt-7 flex items-end gap-2 font-sans">
                    <span className="text-[70px] font-black leading-none tracking-[-0.07em] text-white">
                      473
                    </span>

                    <span className="mb-2 text-[11px] text-white/35">
                      / 500
                    </span>
                  </div>

                  {/* progress */}

                  <div className="mt-7">
                    <div className="mb-2 flex items-center justify-between font-sans">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Progreso
                      </span>

                      <span className="text-[9px] font-bold text-white/70">
                        94.6%
                      </span>
                    </div>

                    <div className="h-[5px] overflow-hidden bg-white/[0.08]">
                      <div className="h-full w-[94.6%] bg-gradient-to-r from-[#1769ff] to-[#39c8ff] shadow-[0_0_12px_rgba(38,117,255,0.65)]" />
                    </div>
                  </div>
                </div>
              </PixelCard>

              {/* ====================================================
                  PERFORMANCE CARD
                  ==================================================== */}

              <PixelCard className="performance-main absolute left-[70%] top-[3%] z-50 w-[330px]">
                <div className="relative p-6">
                  {/* top line */}

                  <div className="absolute left-5 right-5 top-0 h-[2px] bg-[#2675ff] shadow-[0_0_10px_rgba(38,117,255,0.45)]" />

                  {/* header */}

                  <div className="flex items-center justify-between font-sans">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3983ff]">
                      Rendimiento por área
                    </p>

                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                      03
                    </span>
                  </div>

                  {/* bars */}

                  <div className="mt-5 space-y-4 font-sans">
                    <PerformanceBar
                      label="Matemáticas"
                      value="91%"
                      width="91%"
                    />

                    <PerformanceBar
                      label="Lectura crítica"
                      value="86%"
                      width="86%"
                    />

                    <PerformanceBar
                      label="Ciencias naturales"
                      value="81%"
                      width="81%"
                    />

                    <PerformanceBar
                      label="Sociales y ciudadanas"
                      value="74%"
                      width="74%"
                    />
                  </div>
                </div>
              </PixelCard>

              {/* ====================================================
                  PIXEL MOUNTAINS
                  ==================================================== */}

              <PixelMountain
                left="0%"
                bottom="10%"
                scale="1"
              />

              <PixelMountain
                left="17%"
                bottom="7%"
                scale="1.2"
              />

              <PixelMountain
                left="34%"
                bottom="9%"
                scale="0.9"
              />

              <PixelMountain
                left="54%"
                bottom="8%"
                scale="1.25"
              />

              <PixelMountain
                left="74%"
                bottom="9%"
                scale="1"
              />

              <PixelMountain
                left="88%"
                bottom="8%"
                scale="0.8"
              />

              {/* ====================================================
                  TREASURE CHEST
                  ==================================================== */}

              <PixelTreasureChest className="absolute bottom-[7%] right-[8%] z-40" />

              {/* ====================================================
                  BOOKS
                  ==================================================== */}

              <PixelBookStack className="absolute bottom-[6%] right-[-1%] z-30" />

              {/* ====================================================
                  PLANT
                  ==================================================== */}

              <PixelPlant className="absolute bottom-[9%] left-[3%] z-30" />

              {/* ====================================================
                  CRYSTAL
                  ==================================================== */}

              <PixelCrystal
                className="absolute bottom-[9%] left-[17%] z-30"
              />

              {/* ====================================================
                  PEDESTAL
                  ==================================================== */}

              <div className="absolute bottom-[7%] left-[20%] z-20 h-[85px] w-[470px]">
                {/* glow */}

                <div className="absolute left-1/2 top-1/2 h-[80px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1769ff]/20 blur-2xl" />

                {/* outer */}

                <div className="absolute bottom-0 left-1/2 h-[35px] w-[470px] -translate-x-1/2 rounded-[50%] border border-[#3983ff]/60 bg-gradient-to-b from-[#152b4b] to-[#030b18] shadow-[0_20px_45px_rgba(0,0,0,0.75)]" />

                {/* inner */}

                <div className="absolute bottom-[9px] left-1/2 h-[17px] w-[390px] -translate-x-1/2 rounded-[50%] border border-[#2675ff]/75" />

                {/* light */}

                <div className="absolute bottom-[14px] left-1/2 h-[3px] w-[260px] -translate-x-1/2 bg-[#2675ff] shadow-[0_0_22px_rgba(38,117,255,1)]" />
              </div>

              {/* ====================================================
                  FLOOR GRID
                  ==================================================== */}

              <div
                className="absolute bottom-[-3%] left-[-2%] h-[235px] w-[850px] opacity-90"
                style={{
                  backgroundImage: `
                    linear-gradient(
                      rgba(38,117,255,0.35) 1px,
                      transparent 1px
                    ),
                    linear-gradient(
                      90deg,
                      rgba(38,117,255,0.35) 1px,
                      transparent 1px
                    )
                  `,
                  backgroundSize: "34px 34px",
                  transform:
                    "perspective(500px) rotateX(63deg)",
                  transformOrigin: "bottom center",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 55%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 55%, transparent 100%)",
                }}
              />

              {/* horizon */}

              <div className="absolute bottom-[12%] left-0 right-0 h-px bg-[#2675ff]/35 shadow-[0_0_15px_rgba(38,117,255,0.5)]" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BOTTOM METRICS
          ============================================================ */}

      <div className="absolute bottom-1 left-1/2 z-[70] hidden w-[calc(100%-120px)] max-w-[1280px] -translate-x-1/2 lg:block">
        <div className="pixel-metrics relative">
          <PixelCorner position="tl" />
          <PixelCorner position="tr" />
          <PixelCorner position="bl" />
          <PixelCorner position="br" />

          <div className="grid grid-cols-4">
            <BottomMetric
              number="01"
              value="1000+"
              label={
                <>
                  ESTUDIANTES
                  <br />
                  ACTIVOS
                </>
              }
              icon="users"
            />

            <BottomMetric
              number="02"
              value="98.6%"
              label={
                <>
                  SIMULACROS
                  <br />
                  COMPLETADOS
                </>
              }
              icon="check"
            />

            <BottomMetric
              number="03"
              value="92%"
              label={
                <>
                  PRECISIÓN
                  <br />
                  PROMEDIO
                </>
              }
              icon="target"
            />

            <BottomMetric
              number="04"
              value="+18"
              label={
                <>
                  PUNTOS DE
                  <br />
                  MEJORA
                </>
              }
              icon="arrow"
            />
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE METRICS
          ============================================================ */}

      <div className="relative z-50 mx-6 pb-8 lg:hidden">
        <div className="pixel-metrics grid grid-cols-2">
          <BottomMetric
            number="01"
            value="1000+"
            label={
              <>
                ESTUDIANTES
                <br />
                ACTIVOS
              </>
            }
            icon="users"
          />

          <BottomMetric
            number="02"
            value="98.6%"
            label={
              <>
                SIMULACROS
                <br />
                COMPLETADOS
              </>
            }
            icon="check"
          />

          <BottomMetric
            number="03"
            value="92%"
            label={
              <>
                PRECISIÓN
                <br />
                PROMEDIO
              </>
            }
            icon="target"
          />

          <BottomMetric
            number="04"
            value="+18"
            label={
              <>
                PUNTOS DE
                <br />
                MEJORA
              </>
            }
            icon="arrow"
          />
        </div>
      </div>

      {/* ============================================================
          SCROLL
          ============================================================ */}

      <div className="absolute bottom-5 left-1/2 z-[80] hidden -translate-x-1/2 lg:block">
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 pt-2">
          <span className="h-1.5 w-1 rounded-full bg-[#2675ff] shadow-[0_0_8px_#2675ff]" />
        </div>
      </div>

      {/* ============================================================
          CSS
          ============================================================ */}

      <style jsx>{`
        .peak-hero {
          isolation: isolate;
        }

        /* ----------------------------------------------------------
           PIXEL TITLE
           ---------------------------------------------------------- */

        .pixel-title {
          font-family:
            "Press Start 2P",
            monospace;
          font-weight: 400;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }

        /* ----------------------------------------------------------
           PEAKY
           ---------------------------------------------------------- */

        .peaky-main {
          animation: peakyFloat 5.5s ease-in-out infinite;
          will-change: transform;
        }

        /* ----------------------------------------------------------
           CARDS
           ---------------------------------------------------------- */

        .score-main {
          animation: scoreFloat 7s ease-in-out infinite;
          will-change: transform;
        }

        .performance-main {
          animation: performanceFloat 8s ease-in-out infinite;
          will-change: transform;
        }

        /* ----------------------------------------------------------
           METRICS
           ---------------------------------------------------------- */

        .pixel-metrics {
          overflow: hidden;
          border: 1px solid rgba(38, 117, 255, 0.68);
          background:
            linear-gradient(
              180deg,
              rgba(3, 12, 30, 0.98),
              rgba(2, 8, 23, 0.98)
            );
          box-shadow:
            0 -10px 50px rgba(0, 40, 140, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(16px);
          position: relative;
        }

        .pixel-metrics::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            #2675ff 18%,
            #39c8ff 50%,
            #2675ff 82%,
            transparent
          );
          box-shadow: 0 0 18px rgba(38, 117, 255, 0.55);
          pointer-events: none;
        }

        /* ----------------------------------------------------------
           PRIMARY BUTTON
           ---------------------------------------------------------- */

        .pixel-primary {
          position: relative;
          isolation: isolate;
        }

        .pixel-primary::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: -4px;
          height: 3px;
          background: #3983ff;
          opacity: 0.85;
        }

        .pixel-primary::after {
          content: "";
          position: absolute;
          right: -4px;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #0d4fe0;
        }

        /* ----------------------------------------------------------
           ANIMATIONS
           ---------------------------------------------------------- */

        @keyframes peakyFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -8px, 0);
          }
        }

        @keyframes scoreFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -7px, 0);
          }
        }

        @keyframes performanceFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(0, -8px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .peaky-main,
          .score-main,
          .performance-main {
            animation: none !important;
          }
        }

        /* ----------------------------------------------------------
           RESPONSIVE
           ---------------------------------------------------------- */

        @media (max-width: 1280px) {
          .hero-scene {
            transform: scale(0.84);
            transform-origin: center center;
          }

          .score-main {
            right: 68%;
          }

          .performance-main {
            right: 68%;
          }
        }

        @media (max-width: 1100px) {
          .hero-scene {
            transform: scale(0.74);
            transform-origin: top center;
            margin-bottom: -120px;
          }

          .score-main {
            right: 68%;
            width: 320px;
          }

          .performance-main {
            right: 68%;
            width: 320px;
          }
        }

        @media (max-width: 1024px) {
          .hero-scene {
            transform: scale(0.72);
            transform-origin: top center;
            margin-bottom: -140px;
          }
        }

        @media (max-width: 768px) {
          .hero-scene {
            transform: scale(0.59);
            transform-origin: top center;
            margin-bottom: -220px;
          }

          .pixel-title {
            font-size: 42px;
          }

          .pixel-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .hero-scene {
            transform: scale(0.48);
            transform-origin: top center;
            margin-bottom: -290px;
          }

          .pixel-title {
            font-size: 34px;
          }
        }
      `}</style>
    </section>
  );
}

/* =================================================================
   PIXEL CARD
   ================================================================= */

function PixelCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pixel-card relative border border-[#2675ff]/65 bg-[#2675ff]/80 shadow-[0_30px_80px_rgba(0,0,0,0.72)] ${className}`}
    >
      <div className="absolute inset-[2px] bg-[#030a18]" />

      <PixelCorner position="tl" />
      <PixelCorner position="tr" />
      <PixelCorner position="bl" />
      <PixelCorner position="br" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/* =================================================================
   BOTTOM METRIC
   ================================================================= */

function BottomMetric({
  number,
  value,
  label,
  icon,
}: {
  number: string;
  value: string;
  label: ReactNode;
  icon: "users" | "check" | "target" | "arrow";
}) {
  return (
    <div className="relative min-h-[142px] border-r border-[#2675ff]/25 px-7 py-5 last:border-r-0">
      {/* Número de sección */}

      <div className="flex items-center gap-3">
        <span
          className={`${pixelFont.className} text-[8px] leading-none tracking-[0.12em] text-[#3983ff]`}
          style={{
            WebkitFontSmoothing: "none",
            textRendering: "geometricPrecision",
          }}
        >
          {number}
        </span>

        <span className="h-px w-8 bg-[#2675ff]/25" />
      </div>

      {/* Contenido */}

      <div className="mt-6 flex items-center gap-5">
        <MetricIcon type={icon} />

        <div className="min-w-0">
          {/* Número principal PIXEL */}

          <div
            className={`${pixelFont.className} whitespace-nowrap text-[28px] leading-none tracking-[-0.045em] text-white sm:text-[30px]`}
            style={{
              WebkitFontSmoothing: "none",
              textRendering: "geometricPrecision",
              imageRendering: "pixelated",
            }}
          >
            {value}
          </div>

          {/* Etiqueta NORMAL */}

          <div
            className="mt-3 whitespace-nowrap text-[10px] font-bold uppercase leading-[1.35] tracking-[0.055em] text-white/60 sm:text-[11px]"
            style={{
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              WebkitFontSmoothing: "antialiased",
              textRendering: "optimizeLegibility",
            }}
          >
            {label}
          </div>
        </div>
      </div>

      {/* Línea inferior */}

      <div className="absolute bottom-4 left-7 right-7 h-px bg-white/[0.05]">
        <div className="h-full w-[38%] bg-[#2675ff] shadow-[0_0_8px_rgba(38,117,255,0.5)]" />
      </div>
    </div>
  );
}

/* =================================================================
   METRIC ICONS
   ================================================================= */

function MetricIcon({
  type,
}: {
  type: "users" | "check" | "target" | "arrow";
}) {
  /* ================================================================
     PIXEL ICON SYSTEM
     - 01 usa el PNG pixel de Peaky.
     - 02/03/04 usan iconos pixel-art más definidos.
     - Tamaño, posición y estructura de BottomMetric permanecen iguales.
     ================================================================ */

  if (type === "users") {
    return (
      <div className="relative h-[58px] w-[58px] shrink-0" aria-hidden="true">
        <Image
          src="/peaky/homepage/heropeakypixel.png"
          alt=""
          fill
          sizes="58px"
          className="object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    );
  }

  if (type === "check") {
    return (
      <div className="relative h-[58px] w-[58px] shrink-0" aria-hidden="true">
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full"
          shapeRendering="crispEdges"
        >
          <defs>
            <linearGradient id="metricCheckBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#39c8ff" />
              <stop offset="0.5" stopColor="#2675ff" />
              <stop offset="1" stopColor="#0d4fe0" />
            </linearGradient>
          </defs>

          {/* glow */}
          <rect
            x="9"
            y="8"
            width="46"
            height="48"
            fill="#2675ff"
            opacity="0.08"
          />

          {/* clipboard exterior */}
          <rect x="13" y="11" width="38" height="44" fill="#0d4fe0" />
          <rect x="9" y="16" width="5" height="34" fill="#1769ff" />
          <rect x="50" y="16" width="5" height="34" fill="#1769ff" />
          <rect x="16" y="52" width="32" height="5" fill="#1769ff" />

          {/* document */}
          <rect x="17" y="15" width="30" height="36" fill="#061b40" />
          <rect x="20" y="18" width="24" height="4" fill="#2675ff" />
          <rect x="20" y="24" width="15" height="3" fill="#3983ff" opacity="0.72" />
          <rect x="38" y="24" width="6" height="3" fill="#2675ff" opacity="0.4" />

          {/* top clip */}
          <rect x="20" y="7" width="24" height="8" fill="#2675ff" />
          <rect x="24" y="3" width="16" height="6" fill="#39c8ff" />
          <rect x="27" y="4" width="10" height="3" fill="#9af3ff" />
          <rect x="18" y="10" width="28" height="4" fill="#1769ff" />

          {/* large pixel check */}
          <rect x="18" y="34" width="7" height="7" fill="#1769ff" />
          <rect x="22" y="38" width="9" height="8" fill="url(#metricCheckBlue)" />
          <rect x="28" y="42" width="10" height="7" fill="#39c8ff" />
          <rect x="35" y="35" width="9" height="10" fill="#39c8ff" />
          <rect x="42" y="27" width="6" height="10" fill="#39bfff" />

          {/* check highlights */}
          <rect x="23" y="39" width="6" height="3" fill="#7eeeff" />
          <rect x="29" y="43" width="7" height="3" fill="#7eeeff" />
          <rect x="36" y="36" width="6" height="3" fill="#b5f6ff" />
          <rect x="43" y="28" width="4" height="4" fill="#d9fbff" />

          {/* pixel details */}
          <rect x="6" y="21" width="4" height="8" fill="#2675ff" />
          <rect x="54" y="21" width="4" height="8" fill="#2675ff" />
          <rect x="17" y="55" width="9" height="3" fill="#3983ff" />
          <rect x="38" y="55" width="9" height="3" fill="#3983ff" />
        </svg>
      </div>
    );
  }

  if (type === "target") {
    return (
      <div className="relative h-[58px] w-[58px] shrink-0" aria-hidden="true">
        <svg
          viewBox="0 0 64 64"
          className="h-full w-full"
          shapeRendering="crispEdges"
        >
          {/* glow */}
          <rect
            x="12"
            y="12"
            width="40"
            height="40"
            fill="#39d5ff"
            opacity="0.07"
          />

          {/* outer targeting cross */}
          <rect x="28" y="0" width="8" height="11" fill="#39d5ff" />
          <rect x="28" y="53" width="8" height="11" fill="#39d5ff" />
          <rect x="0" y="28" width="11" height="8" fill="#39d5ff" />
          <rect x="53" y="28" width="11" height="8" fill="#39d5ff" />

          {/* cross steps */}
          <rect x="23" y="7" width="7" height="6" fill="#2675ff" />
          <rect x="34" y="7" width="7" height="6" fill="#2675ff" />
          <rect x="23" y="51" width="7" height="6" fill="#2675ff" />
          <rect x="34" y="51" width="7" height="6" fill="#2675ff" />
          <rect x="7" y="23" width="6" height="7" fill="#2675ff" />
          <rect x="7" y="34" width="6" height="7" fill="#2675ff" />
          <rect x="51" y="23" width="6" height="7" fill="#2675ff" />
          <rect x="51" y="34" width="6" height="7" fill="#2675ff" />

          {/* outer pixel ring */}
          <rect x="18" y="10" width="28" height="4" fill="#39d5ff" />
          <rect x="14" y="14" width="4" height="7" fill="#39d5ff" />
          <rect x="46" y="14" width="4" height="7" fill="#39d5ff" />
          <rect x="10" y="18" width="4" height="28" fill="#39d5ff" />
          <rect x="50" y="18" width="4" height="28" fill="#39d5ff" />
          <rect x="14" y="46" width="4" height="7" fill="#39d5ff" />
          <rect x="46" y="46" width="4" height="7" fill="#39d5ff" />
          <rect x="18" y="50" width="28" height="4" fill="#39d5ff" />

          {/* ring cutouts */}
          <rect x="18" y="14" width="5" height="4" fill="#020817" />
          <rect x="41" y="14" width="5" height="4" fill="#020817" />
          <rect x="18" y="46" width="5" height="4" fill="#020817" />
          <rect x="41" y="46" width="5" height="4" fill="#020817" />

          {/* inner ring */}
          <rect x="22" y="18" width="20" height="3" fill="#2675ff" />
          <rect x="19" y="21" width="3" height="22" fill="#2675ff" />
          <rect x="42" y="21" width="3" height="22" fill="#2675ff" />
          <rect x="22" y="43" width="20" height="3" fill="#2675ff" />

          {/* cyan reflection */}
          <rect x="23" y="21" width="8" height="3" fill="#9af3ff" />
          <rect
            x="22"
            y="24"
            width="3"
            height="8"
            fill="#39d5ff"
            opacity="0.8"
          />

          {/* center */}
          <rect x="26" y="26" width="12" height="12" fill="#7c3aed" />
          <rect x="29" y="23" width="6" height="3" fill="#c084fc" />
          <rect x="38" y="29" width="3" height="6" fill="#a855f7" />
          <rect x="29" y="29" width="6" height="6" fill="#e9d5ff" />
          <rect x="32" y="26" width="3" height="3" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-[58px] w-[58px] shrink-0" aria-hidden="true">
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        shapeRendering="crispEdges"
      >
        <defs>
          <linearGradient id="metricArrowGreen" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#08734f" />
            <stop offset="0.5" stopColor="#16bd7d" />
            <stop offset="1" stopColor="#62f2b5" />
          </linearGradient>
        </defs>

        {/* ==========================================================
            PEAKSCORE — DEFINITIVE IMPROVEMENT ARROW
            4px pixel grid · broad silhouette · clean 45° rise
            ========================================================== */}

        {/* subtle pixel backdrop */}
        <rect
          x="7"
          y="7"
          width="50"
          height="50"
          fill="#35d399"
          opacity="0.045"
        />

        {/* ----------------------------------------------------------
            MAIN SILHOUETTE
            Thick stepped shaft. The important part is that the
            diagonal remains visually solid at this small size.
            ---------------------------------------------------------- */}
        <path
          d="
            M 7 47
            H 15
            V 43
            H 19
            V 39
            H 23
            V 35
            H 27
            V 31
            H 31
            V 27
            H 35
            V 23
            H 39
            V 19
            H 43
            V 15
            H 47
            V 11
            H 51
            V 7
            H 59
            V 23
            H 55
            V 27
            H 51
            V 31
            H 47
            V 35
            H 43
            V 39
            H 39
            V 43
            H 35
            V 47
            H 31
            V 51
            H 27
            V 55
            H 23
            V 59
            H 7
            Z
          "
          fill="#075b41"
        />

        {/* ----------------------------------------------------------
            INNER BODY
            Keeps the shaft thick and readable instead of becoming
            a thin pixel staircase.
            ---------------------------------------------------------- */}
        <path
          d="
            M 11 47
            H 17
            V 43
            H 21
            V 39
            H 25
            V 35
            H 29
            V 31
            H 33
            V 27
            H 37
            V 23
            H 41
            V 19
            H 45
            V 15
            H 49
            V 11
            H 55
            V 19
            H 51
            V 23
            H 47
            V 27
            H 43
            V 31
            H 39
            V 35
            H 35
            V 39
            H 31
            V 43
            H 27
            V 47
            H 23
            V 51
            H 19
            V 55
            H 11
            Z
          "
          fill="url(#metricArrowGreen)"
        />

        {/* ----------------------------------------------------------
            ARROW HEAD
            Deliberately broad, geometric and unmistakable.
            ---------------------------------------------------------- */}
        <path
          d="
            M 43 7
            H 59
            V 23
            H 51
            V 19
            H 47
            V 15
            H 43
            Z
          "
          fill="#32d99a"
        />

        {/* bright top/left face */}
        <path
          d="
            M 12 45
            H 18
            V 41
            H 22
            V 37
            H 26
            V 33
            H 30
            V 29
            H 34
            V 25
            H 38
            V 21
            H 42
            V 17
            H 46
            V 13
            H 50
            V 9
            H 56
            V 12
            H 52
            V 16
            H 48
            V 20
            H 44
            V 24
            H 40
            V 28
            H 36
            V 32
            H 32
            V 36
            H 28
            V 40
            H 24
            V 44
            H 20
            V 48
            H 16
            V 52
            H 12
            Z
          "
          fill="#4de5aa"
        />

        {/* darker bottom/right face */}
        <path
          d="
            M 11 48
            H 18
            V 44
            H 22
            V 40
            H 26
            V 36
            H 30
            V 32
            H 34
            V 28
            H 38
            V 24
            H 42
            V 20
            H 46
            V 16
            H 50
            V 12
            H 54
            V 20
            H 50
            V 24
            H 46
            V 28
            H 42
            V 32
            H 38
            V 36
            H 34
            V 40
            H 30
            V 44
            H 26
            V 48
            H 22
            V 52
            H 18
            V 56
            H 11
            Z
          "
          fill="#0b9864"
          opacity="0.72"
        />

        {/* clean pixel highlights */}
        <rect x="13" y="44" width="7" height="3" fill="#7af5bf" />
        <rect x="21" y="36" width="7" height="3" fill="#72f2ba" />
        <rect x="29" y="28" width="7" height="3" fill="#79f5bd" />
        <rect x="37" y="20" width="7" height="3" fill="#82f8c3" />
        <rect x="46" y="10" width="9" height="3" fill="#8cfac8" />

        {/* tiny dark separation under the arrow head */}
        <rect x="47" y="19" width="4" height="4" fill="#08734f" />
      </svg>
    </div>
  );
}

/* =================================================================
   PERFORMANCE BAR
   ================================================================= */

function PerformanceBar({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[10px] font-medium text-white/70">
          {label}
        </span>

        <span className="shrink-0 text-[9px] font-bold text-white/65">
          {value}
        </span>
      </div>

      <div className="relative h-[6px] overflow-hidden bg-white/[0.08]">
        <div
          className="h-full bg-gradient-to-r from-[#1769ff] via-[#2675ff] to-[#39bfff] shadow-[0_0_10px_rgba(38,117,255,0.5)]"
          style={{ width }}
        />
      </div>
    </div>
  );
}

/* =================================================================
   PIXEL CORNER
   ================================================================= */

function PixelCorner({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const positions = {
    tl: "left-[-1px] top-[-1px]",
    tr: "right-[-1px] top-[-1px]",
    bl: "bottom-[-1px] left-[-1px]",
    br: "bottom-[-1px] right-[-1px]",
  };

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${positions[position]} z-[30] h-[9px] w-[9px] bg-[#2675ff]`}
    />
  );
}

/* =================================================================
   PIXEL STAR
   ================================================================= */

function PixelStar({
  left,
  top,
  size,
}: {
  left: string;
  top: string;
  size: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="absolute bg-[#2675ff] shadow-[0_0_12px_rgba(38,117,255,0.75)]"
      style={{
        left,
        top,
        width: size,
        height: size,
      }}
    />
  );
}

/* =================================================================
   PIXEL PLUS
   ================================================================= */

function PixelPlus({
  left,
  top,
  small = false,
}: {
  left: string;
  top: string;
  small?: boolean;
}) {
  const size = small ? 15 : 24;

  return (
    <span
      aria-hidden="true"
      className="absolute"
      style={{
        left,
        top,
        width: size,
        height: size,
      }}
    >
      <span
        className="absolute left-1/2 top-0 -translate-x-1/2 bg-[#2675ff] shadow-[0_0_12px_rgba(38,117,255,0.7)]"
        style={{
          width: small ? 4 : 6,
          height: size,
        }}
      />

      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-[#2675ff] shadow-[0_0_12px_rgba(38,117,255,0.7)]"
        style={{
          width: size,
          height: small ? 4 : 6,
        }}
      />
    </span>
  );
}

/* =================================================================
   PIXEL DIAMOND DECORATION
   ================================================================= */

function PixelDiamond({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[30px] w-[30px] ${className}`}
    >
      <div className="absolute left-[5px] top-[5px] h-[20px] w-[20px] rotate-45 border-[2px] border-[#39d5ff] bg-[#0878d8]/20 shadow-[0_0_18px_rgba(39,196,255,0.3)]" />

      <div className="absolute left-[12px] top-[12px] h-[6px] w-[6px] rotate-45 bg-[#7eeeff]/80" />
    </div>
  );
}

/* =================================================================
   PIXEL SQUARE
   ================================================================= */

function PixelSquare({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[28px] w-[28px] border-2 border-[#2675ff]/60 bg-[#1769ff]/10 ${className}`}
    >
      <span className="absolute left-[4px] top-[4px] h-[5px] w-[5px] bg-[#2675ff]" />

      <span className="absolute bottom-[4px] right-[4px] h-[5px] w-[5px] bg-[#3983ff]" />
    </div>
  );
}

/* =================================================================
   PIXEL MOUNTAIN
   ================================================================= */

function PixelMountain({
  left,
  bottom,
  scale,
}: {
  left: string;
  bottom: string;
  scale: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute h-[85px] w-[150px] opacity-90"
      style={{
        left,
        bottom,
        transform: `scale(${scale})`,
        transformOrigin: "bottom left",
      }}
    >
      {/* base */}

      <div className="absolute bottom-0 left-0 h-[30px] w-[150px] bg-[#07142b]" />

      {/* left blocks */}

      <div className="absolute bottom-[25px] left-[10px] h-[25px] w-[30px] bg-[#0a1c3d]" />

      <div className="absolute bottom-[40px] left-[35px] h-[30px] w-[35px] rotate-45 bg-[#0a1c3d]" />

      {/* center */}

      <div className="absolute bottom-[25px] left-[65px] h-[42px] w-[42px] rotate-45 bg-[#0b1e43]" />

      {/* right */}

      <div className="absolute bottom-[22px] right-[18px] h-[28px] w-[35px] rotate-45 bg-[#0a1c3d]" />

      {/* blue pixel details */}

      <div className="absolute bottom-[48px] left-[47px] h-[5px] w-[16px] bg-[#2675ff]/50" />

      <div className="absolute bottom-[36px] left-[86px] h-[4px] w-[12px] bg-[#2675ff]/40" />

      <div className="absolute bottom-[19px] left-[25px] h-[5px] w-[10px] bg-[#123b83]/60" />
    </div>
  );
}

/* =================================================================
   PIXEL TREASURE CHEST
   ================================================================= */

function PixelTreasureChest({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[82px] w-[112px] ${className}`}
    >
      {/* glow */}

      <div className="absolute bottom-0 left-1/2 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-[#1769ff]/20 blur-xl" />

      {/* ------------------------------------------------------------
          LID BACK
          ------------------------------------------------------------ */}

      <div className="absolute left-[10px] top-[8px] h-[12px] w-[92px] border-2 border-[#7e461b] bg-[#5b2b16]" />

      {/* ------------------------------------------------------------
          LID TOP PIXELS
          ------------------------------------------------------------ */}

      <div className="absolute left-[15px] top-[3px] h-[8px] w-[82px] bg-[#b66a1d]" />

      <div className="absolute left-[20px] top-0 h-[5px] w-[72px] bg-[#e29a2b]" />

      {/* gold stripe */}

      <div className="absolute left-[16px] top-[10px] h-[8px] w-[80px] bg-[#e59b29]" />

      {/* dark stripe */}

      <div className="absolute left-[26px] top-[10px] h-[8px] w-[8px] bg-[#6e3218]" />

      <div className="absolute left-[78px] top-[10px] h-[8px] w-[8px] bg-[#6e3218]" />

      {/* ------------------------------------------------------------
          MAIN BODY
          ------------------------------------------------------------ */}

      <div className="absolute bottom-[5px] left-[9px] h-[48px] w-[94px] border-[4px] border-[#a85e1b] bg-[#4b2116]" />

      {/* wood pixels */}

      <div className="absolute bottom-[11px] left-[16px] h-[7px] w-[80px] bg-[#6c3018]" />

      <div className="absolute bottom-[21px] left-[16px] h-[7px] w-[80px] bg-[#5c2817]" />

      <div className="absolute bottom-[31px] left-[16px] h-[7px] w-[80px] bg-[#6d3018]" />

      {/* ------------------------------------------------------------
          GOLD BANDS
          ------------------------------------------------------------ */}

      <div className="absolute bottom-[5px] left-[23px] h-[48px] w-[9px] bg-[#d88922]" />

      <div className="absolute bottom-[5px] right-[23px] h-[48px] w-[9px] bg-[#d88922]" />

      {/* highlights */}

      <div className="absolute bottom-[12px] left-[25px] h-[35px] w-[3px] bg-[#f4ad32]" />

      <div className="absolute bottom-[12px] right-[25px] h-[35px] w-[3px] bg-[#f4ad32]" />

      {/* ------------------------------------------------------------
          LOCK
          ------------------------------------------------------------ */}

      <div className="absolute left-1/2 top-[36px] h-[20px] w-[18px] -translate-x-1/2 border-[3px] border-[#ffd24a] bg-[#7d4318]" />

      <div className="absolute left-1/2 top-[31px] h-[9px] w-[11px] -translate-x-1/2 border-[3px] border-[#ffd24a] border-b-0" />

      <div className="absolute left-1/2 top-[43px] h-[5px] w-[4px] -translate-x-1/2 bg-[#ffdd65]" />

      {/* ------------------------------------------------------------
          PIXEL CORNERS
          ------------------------------------------------------------ */}

      <span className="absolute left-[5px] top-[17px] h-[7px] w-[5px] bg-[#f0a12d]" />

      <span className="absolute right-[5px] top-[17px] h-[7px] w-[5px] bg-[#f0a12d]" />

      <span className="absolute bottom-[1px] left-[13px] h-[5px] w-[12px] bg-[#d27a20]" />

      <span className="absolute bottom-[1px] right-[13px] h-[5px] w-[12px] bg-[#d27a20]" />
    </div>
  );
}

/* =================================================================
   PIXEL BOOK STACK
   ================================================================= */

function PixelBookStack({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[105px] w-[112px] ${className}`}
    >
      {/* bottom book */}

      <div className="absolute bottom-0 left-[8px] h-[20px] w-[96px] border-2 border-[#31327f] bg-[#20235f]" />

      <div className="absolute bottom-[4px] left-[17px] h-[5px] w-[77px] bg-[#30318b]" />

      {/* second */}

      <div className="absolute bottom-[19px] left-[14px] h-[21px] w-[88px] border-2 border-[#573bc2] bg-[#34247f]" />

      <div className="absolute bottom-[23px] left-[23px] h-[5px] w-[68px] bg-[#4935b5]" />

      {/* third */}

      <div className="absolute bottom-[39px] left-[7px] h-[20px] w-[96px] border-2 border-[#2675ff] bg-[#113b91]" />

      <div className="absolute bottom-[44px] left-[17px] h-[5px] w-[74px] bg-[#1b59bd]" />

      {/* top */}

      <div className="absolute bottom-[58px] left-[20px] h-[19px] w-[76px] border-2 border-[#5363df] bg-[#252f96]" />

      <div className="absolute bottom-[63px] left-[29px] h-[4px] w-[57px] bg-[#4658c7]" />

      {/* page pixels */}

      <div className="absolute bottom-[2px] right-[14px] h-[4px] w-[12px] bg-[#686bd2]/70" />

      <div className="absolute bottom-[42px] right-[12px] h-[4px] w-[15px] bg-[#5f70e9]/70" />

      <div className="absolute bottom-[63px] right-[27px] h-[4px] w-[12px] bg-[#7a82ee]/60" />
    </div>
  );
}

/* =================================================================
   PIXEL PLANT
   ================================================================= */

function PixelPlant({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[108px] w-[78px] ${className}`}
    >
      {/* leaves */}

      <span className="absolute left-[26px] top-[4px] h-[25px] w-[12px] -rotate-[30deg] bg-[#2675ff]" />

      <span className="absolute left-[39px] top-[8px] h-[26px] w-[12px] rotate-[35deg] bg-[#3983ff]" />

      <span className="absolute left-[14px] top-[21px] h-[23px] w-[11px] -rotate-[55deg] bg-[#1b66d8]" />

      <span className="absolute left-[43px] top-[22px] h-[20px] w-[10px] rotate-[58deg] bg-[#0d5fd3]" />

      {/* stem */}

      <div className="absolute left-[35px] top-[28px] h-[38px] w-[6px] bg-[#3983ff]" />

      {/* pot rim */}

      <div className="absolute bottom-[39px] left-[9px] h-[8px] w-[57px] bg-[#7c3aed]" />

      {/* pot */}

      <div className="absolute bottom-[5px] left-[13px] h-[37px] w-[49px] border-4 border-[#5b2ad4] bg-[#2d1685]" />

      {/* pot highlight */}

      <div className="absolute bottom-[9px] left-[20px] h-[25px] w-[5px] bg-[#4221ad]" />
    </div>
  );
}

/* =================================================================
   PIXEL CRYSTAL
   ================================================================= */

function PixelCrystal({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative h-[72px] w-[58px] ${className}`}
    >
      <div className="absolute bottom-[8px] left-[17px] h-[38px] w-[25px] rotate-45 border-2 border-[#39d5ff] bg-[#0878d8]/55 shadow-[0_0_25px_rgba(39,196,255,0.45)]" />

      <div className="absolute bottom-[18px] left-[24px] h-[15px] w-[10px] rotate-45 bg-[#7eeeff]/75" />

      <div className="absolute bottom-[11px] left-[11px] h-[5px] w-[5px] bg-[#39d5ff]" />

      <div className="absolute bottom-[3px] right-[10px] h-[4px] w-[4px] bg-[#2675ff]" />
    </div>
  );
}