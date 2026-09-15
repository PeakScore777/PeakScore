"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

import PeakScoreLogo from "@/components/PeakScoreLogo";

const navLinks = [
  {
    number: "01",
    label: "Plataforma",
    href: "#features",
  },
  {
    number: "02",
    label: "Preparación",
    href: "#how-it-works",
  },
  {
    number: "03",
    label: "Progreso",
    href: "#progress",
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 w-full overflow-hidden bg-[#160c32]">
      {/* =====================================================
          FONDO DEL ATARDECER
      ====================================================== */}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#4a1d70_0%,#8d2d83_28%,#d94388_50%,#ff765f_72%,#ffad62_100%)]" />

      {/* =====================================================
          TEXTURA PIXEL DEL CIELO
      ====================================================== */}

      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(255,255,255,0.10) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.05) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "8px 8px",
        }}
      />

      {/* =====================================================
          ESTRELLAS / PIXELES
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[9%] top-[34%] h-1 w-1 bg-[#ffd7a1]" />
        <span className="absolute left-[19%] top-[22%] h-1 w-1 bg-[#ffb4d8]" />
        <span className="absolute left-[31%] top-[39%] h-1 w-1 bg-[#ffc27b]" />
        <span className="absolute left-[43%] top-[27%] h-1 w-1 bg-[#ff9ecb]" />
        <span className="absolute left-[57%] top-[35%] h-1 w-1 bg-[#ffd18a]" />
        <span className="absolute left-[68%] top-[21%] h-1 w-1 bg-[#ffb2dc]" />
        <span className="absolute left-[79%] top-[38%] h-1 w-1 bg-[#ffd28d]" />
        <span className="absolute left-[91%] top-[28%] h-1 w-1 bg-[#ff9fcb]" />

        <span className="absolute left-[13%] top-[52%] h-1 w-2 bg-[#ffbc76]" />
        <span className="absolute left-[26%] top-[47%] h-1 w-1 bg-[#ffdb9b]" />
        <span className="absolute left-[72%] top-[49%] h-1 w-1 bg-[#ffc47e]" />
        <span className="absolute left-[86%] top-[44%] h-1 w-2 bg-[#ffb0d0]" />
      </div>

      {/* =====================================================
          SOL ÚNICO
      ====================================================== */}

      <div className="pointer-events-none absolute bottom-[34px] left-1/2 z-[1] -translate-x-1/2">
        <div className="relative h-[150px] w-[150px]">
          <div className="absolute inset-0 bg-[#ffe873] [clip-path:polygon(20%_0,80%_0,100%_20%,100%_80%,80%_100%,20%_100%,0_80%,0_20%)]" />

          {/* Pixel glow */}
          <div className="absolute -inset-3 -z-10 bg-[#ffd85c]/30 blur-md" />
        </div>
      </div>

      {/* =====================================================
          MONTAÑAS PIXELADAS
      ====================================================== */}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[115px]">
        {/* Montaña lejana */}

        <div
          className="absolute bottom-0 left-0 h-[100px] w-full bg-[#3b216c]"
          style={{
            clipPath:
              "polygon(0 82%, 5% 70%, 9% 78%, 14% 54%, 18% 73%, 22% 46%, 26% 70%, 31% 58%, 36% 78%, 41% 48%, 46% 72%, 50% 59%, 55% 75%, 61% 42%, 66% 70%, 71% 53%, 76% 74%, 82% 45%, 87% 68%, 92% 50%, 97% 72%, 100% 62%, 100% 100%, 0 100%)",
          }}
        />

        {/* Montaña frontal */}

        <div
          className="absolute bottom-0 left-0 h-[78px] w-full bg-[#21164e]"
          style={{
            clipPath:
              "polygon(0 74%, 6% 63%, 11% 77%, 17% 57%, 22% 74%, 28% 50%, 34% 72%, 40% 61%, 46% 77%, 52% 48%, 58% 72%, 63% 56%, 68% 78%, 74% 48%, 80% 70%, 86% 55%, 92% 75%, 96% 63%, 100% 70%, 100% 100%, 0 100%)",
          }}
        />

        {/* Línea pixelada inferior */}

        <div className="absolute bottom-0 left-0 h-3 w-full bg-[#120d34]" />

        <div className="absolute bottom-3 left-0 h-1 w-full bg-[#27144f]" />
      </div>

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="relative z-20 mx-auto flex h-[82px] w-full max-w-[1440px] items-center justify-between border-b border-white/15 px-8 lg:px-12">
        {/* ===================================================
            LOGO
        ==================================================== */}

        <Link
          href="/"
          aria-label="PeakScore inicio"
          onClick={() => setMobileOpen(false)}
          className="group relative z-30 flex shrink-0 items-center"
        >
          <div className="rounded-sm bg-[#130c2b]/40 px-2 py-1 backdrop-blur-[2px]">
            <PeakScoreLogo
              compact={true}
              variant="light"
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </div>
        </Link>

        {/* ===================================================
            NAVEGACIÓN DESKTOP
        ==================================================== */}

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white/90 transition-all duration-200 hover:text-[#ffe86b]"
            >
              <span className="text-[8px] font-bold text-[#ffb0d1] transition-colors duration-200 group-hover:text-[#ffe86b]">
                {link.number}
              </span>

              <span className="whitespace-nowrap">
                {link.label}
              </span>
            </a>
          ))}
        </div>

        {/* ===================================================
            ACCIONES
        ==================================================== */}

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/login"
            className="font-mono text-[10px] font-bold uppercase tracking-[0.05em] text-white/90 transition-colors duration-200 hover:text-[#ffe86b]"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            className="group relative flex h-[36px] items-center gap-2 border-2 border-[#ff9ed1] bg-[#171033]/80 px-5 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-white shadow-[3px_3px_0_#37175b] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ffe86b] hover:text-[#ffe86b] hover:shadow-[4px_4px_0_#37175b]"
          >
            <span>Comenzar</span>

            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* ===================================================
            BOTÓN MOBILE
        ==================================================== */}

        <button
          type="button"
          onClick={() => setMobileOpen((previous) => !previous)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          className="relative z-30 flex h-10 w-10 items-center justify-center border border-white/40 bg-[#171033]/70 text-white backdrop-blur-sm transition-colors hover:border-[#ffe86b] hover:text-[#ffe86b] md:hidden"
        >
          {mobileOpen ? (
            <X className="h-[17px] w-[17px]" />
          ) : (
            <Menu className="h-[17px] w-[17px]" />
          )}
        </button>
      </nav>

      {/* =====================================================
          MENÚ MOBILE
      ====================================================== */}

      {mobileOpen && (
        <div className="relative z-30 border-t border-white/15 bg-[#171033]/95 backdrop-blur-md md:hidden">
          <div className="mx-auto max-w-[1400px] px-6 pb-7 pt-2">
            {/* Links */}

            <div>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center justify-between border-b border-white/10 py-5"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-[#ff9dcc]">
                      {link.number}
                    </span>

                    <span className="font-mono text-sm font-bold uppercase tracking-[0.04em] text-white transition-colors group-hover:text-[#ffe86b]">
                      {link.label}
                    </span>
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-[#ff9dcc] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#ffe86b]" />
                </a>
              ))}
            </div>

            {/* Acciones */}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 items-center justify-center border border-white/20 bg-white/5 font-mono text-xs font-bold uppercase text-white transition-colors hover:border-[#ffe86b] hover:text-[#ffe86b]"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 items-center justify-center border-2 border-[#ff9ed1] bg-[#171033] font-mono text-xs font-bold uppercase text-white shadow-[3px_3px_0_#37175b] transition-all hover:border-[#ffe86b] hover:text-[#ffe86b]"
              >
                Comenzar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}