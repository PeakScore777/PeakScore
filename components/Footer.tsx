"use client";

import {
  ArrowUpRight,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-[#020617] text-white">

      {/* Ambiente visual sutil */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.06] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">

        {/* =====================================================
            CONTENIDO PRINCIPAL
        ====================================================== */}

        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* =================================================
              MARCA
          ================================================== */}

          <div className="max-w-sm">

            <h2 className="text-2xl font-bold tracking-tight text-white">
              PeakScore
            </h2>

            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-400">
              Preparación ICFES enfocada en práctica,
              análisis y progreso.
            </p>

            <div className="mt-7 flex items-center gap-2 text-xs text-slate-500">

              <ShieldCheck className="h-4 w-4 text-blue-400" />

              <span>
                Plataforma de preparación académica
              </span>

            </div>

          </div>

          {/* =================================================
              PRODUCTO
          ================================================== */}

          <FooterColumn
            title="Producto"
            items={[
              "Características",
              "Simulacros",
              "Banco de preguntas",
              "Estadísticas",
              "Precios",
            ]}
          />

          {/* =================================================
              RECURSOS
          ================================================== */}

          <FooterColumn
            title="Recursos"
            items={[
              "Cómo funciona",
              "Preguntas frecuentes",
              "Centro de ayuda",
            ]}
          />

          {/* =================================================
              EMPRESA
          ================================================== */}

          <FooterColumn
            title="Empresa"
            items={[
              "Nosotros",
              "Contacto",
            ]}
          />

        </div>

        {/* =====================================================
            CONTACTO / ESTADO
        ====================================================== */}

        <div className="flex flex-col gap-4 border-t border-slate-800 py-6 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <Mail className="h-4 w-4" />

            <span>
              ¿Necesitas ayuda? Contáctanos.
            </span>

          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Contactar
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

        </div>

        {/* =====================================================
            LEGAL
        ====================================================== */}

        <div className="flex flex-col gap-4 border-t border-slate-800 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            © 2026 PeakScore. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-5">

            <span className="cursor-default transition hover:text-slate-300">
              Privacidad
            </span>

            <span className="cursor-default transition hover:text-slate-300">
              Términos
            </span>

          </div>

        </div>

      </div>
    </footer>
  );
}

/* =========================================================
   COLUMNA DEL FOOTER
========================================================= */

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>

      <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h3>

      <ul className="space-y-3">

        {items.map((item) => (
          <li
            key={item}
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            {item}
          </li>
        ))}

      </ul>

    </div>
  );
}