"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Gamepad2, LockKeyhole, Sparkles, Trophy } from "lucide-react";

export default function GamesHub() {
  return (
    <main className="games-hub relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#07091a] text-white">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/backgrounds/games-arcade-bg.png')" }} />
      <div className="absolute inset-0 -z-10 bg-[#050817]/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#050817]/35 via-transparent to-[#050817]/75" />

      <div className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-7 sm:pt-9 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#080d25]/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">
              <Gamepad2 className="h-4 w-4" /> Zona de minijuegos
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_3px_15px_rgba(107,66,255,.65)] sm:text-5xl">
              JUEGOS
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/85 sm:text-base">
              Aprende jugando, resuelve desafíos y gana recompensas mientras refuerzas lo que sabes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[290px]">
            <div className="rounded-xl border border-white/10 bg-[#080d25]/85 p-3 backdrop-blur">
              <Sparkles className="mb-2 h-5 w-5 text-fuchsia-300" />
              <p className="text-xs font-black">Retos de conocimiento</p>
              <p className="mt-1 text-[11px] text-white/55">Preguntas originales</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#080d25]/85 p-3 backdrop-blur">
              <Trophy className="mb-2 h-5 w-5 text-amber-300" />
              <p className="text-xs font-black">Progreso por rondas</p>
              <p className="mt-1 text-[11px] text-white/55">Avanza a tu ritmo</p>
            </div>
          </div>
        </header>

        <section className="mt-7 sm:mt-9" aria-labelledby="available-games">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/80">Primera aventura</p>
              <h2 id="available-games" className="mt-2 text-xl font-black sm:text-2xl">Elige tu desafío</h2>
            </div>
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">1 juego disponible</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Link href="/aprender/juegos/que-es-esa-vaina" className="group overflow-hidden rounded-2xl border border-violet-300/30 bg-[#080d25]/95 shadow-[0_18px_55px_rgba(0,0,0,.38)] transition duration-200 hover:-translate-y-1 hover:border-cyan-200/60 hover:shadow-[0_20px_65px_rgba(74,46,255,.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#100d38]">
                <Image src="/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png" alt="Libro misterioso con un signo de interrogación brillante" fill priority sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 420px" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07091a]/95 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/30 bg-[#071b19]/90 px-2.5 py-1 text-[10px] font-black text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> DISPONIBLE</span>
                <span className="absolute bottom-3 right-3 rounded-lg border border-amber-200/25 bg-[#160e2a]/90 px-2.5 py-1.5 text-[10px] font-black text-amber-200">XP · COFRE</span>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-200">Adivina el concepto</p>
                    <h3 className="mt-2 text-lg font-black leading-tight sm:text-xl">¿Qué es esa vaina?</h3>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-300/10 text-violet-100"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/65">Lee pistas, identifica conceptos de los temarios y abre el cofre a medida que demuestras lo que sabes.</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-[11px] text-white/65">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-cyan-200" /> 5–8 min</span>
                  <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-200" /> Pistas + explicación</span>
                </div>
                <div className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-center text-xs font-black tracking-wide shadow-lg shadow-violet-950/40 transition group-hover:from-violet-500 group-hover:to-indigo-500">ENTRAR AL JUEGO</div>
              </div>
            </Link>

            <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080d25]/75 p-5 opacity-75 sm:p-6">
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[.025]"><LockKeyhole className="h-10 w-10 text-white/25" /></div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[.16em] text-white/35">En preparación</p>
              <h3 className="mt-2 text-lg font-black text-white/60">Más minijuegos</h3>
              <p className="mt-2 text-sm leading-6 text-white/40">Nuevos desafíos se activarán cuando estén listos. Por ahora, solo puedes entrar al primer juego.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-white/35"><LockKeyhole className="h-3.5 w-3.5" /> Próximamente</div>
            </article>
          </div>
        </section>
        <p className="mt-8 text-center text-[10px] leading-5 text-white/40">El objetivo es aprender: cada respuesta incluye una explicación para que entiendas el porqué.</p>
      </div>
    </main>
  );
}
