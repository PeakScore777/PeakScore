"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SimulacroCompletoPage() {
  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col items-center justify-center gap-6">

        {/* IMAGEN */}
        <div className="w-full overflow-hidden rounded-[32px] border border-white/10 shadow-2xl shadow-blue-950/30">
          <img
            src="/images/simulacros-proximamente.png"
            alt="Simulacros próximamente disponibles"
            className="block h-auto w-full"
          />
        </div>

        {/* BOTÓN */}
        <Link
          href="/dashboard/simulacros"
          className="group inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100"
        >
          <ArrowLeft
            size={18}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />

          Volver a simulacros
        </Link>

      </div>
    </main>
  );
}