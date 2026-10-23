"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, Sparkles, ArrowUpRight } from "lucide-react";

export default function GamesHub() {
  return (
    <main className="games-hub relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#050817] text-white">
      {/* El cartel JUEGOS ya viene dibujado dentro del arte: no duplicarlo con HTML. */}
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/backgrounds/games-arcade-bg.png')" }} />
      <div className="absolute inset-0 -z-10 bg-[#050817]/[.16]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#050817]/10 via-transparent to-[#050817]/45" />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10">
        <section className="ml-auto max-w-5xl">
          <div className="mb-5 flex items-center justify-end gap-3 sm:mb-6">
            <div className="max-w-[330px] rounded-xl border border-violet-300/25 bg-[#070d24]/90 p-3 shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-sm sm:p-4">
              <p className="flex items-center gap-2 text-xs font-semibold leading-5 text-slate-100 sm:text-sm"><Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300" /> Minijuegos educativos para reforzar conceptos y seguir subiendo de rango.</p>
            </div>
            <div className="hidden items-center gap-4 rounded-xl border border-violet-300/20 bg-[#070d24]/90 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,.35)] sm:flex">
              <div className="flex min-w-[58px] flex-col items-center gap-1 text-center">
                <Image src="/peaky/homepage/xp.webp" alt="XP" width={34} height={34} className="h-8 w-8 object-contain" />
                <span className="text-[10px] font-bold text-violet-100">Gana XP</span>
              </div>
              <div className="flex min-w-[64px] flex-col items-center gap-1 text-center">
                <Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={34} height={34} className="h-8 w-8 object-contain" />
                <span className="text-[10px] font-bold text-cyan-100">Peak Coins</span>
              </div>
              <div className="flex min-w-[66px] flex-col items-center gap-1 text-center">
                <span className="text-2xl leading-8">✦</span>
                <span className="text-[10px] font-bold text-fuchsia-100">Completa retos</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link href="/aprender/juegos/que-es-esa-vaina" className="group overflow-hidden rounded-2xl border-2 border-slate-400/55 bg-[#050b20]/95 shadow-[0_12px_0_rgba(7,12,34,.8),0_20px_55px_rgba(0,0,0,.55)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/80 hover:shadow-[0_12px_0_rgba(7,12,34,.8),0_22px_60px_rgba(52,90,255,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
              <div className="relative aspect-[16/9] overflow-hidden bg-[#100d38]">
                <Image src="/images/games/backgrounds/que-es-esa-vaina-bg.png" alt="Arte del minijuego ¿Qué es esa vaina?" fill priority sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 380px" className="object-cover transition duration-500 group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05091b]/90 via-transparent to-transparent" />
              </div>
              <div className="p-4 pt-3 sm:p-5 sm:pt-3">
                <h2 className="text-center text-lg font-black uppercase leading-tight tracking-wide text-white sm:text-xl">¿Qué es esa vaina?</h2>
                <p className="mx-auto mt-2 max-w-[250px] text-center text-xs leading-4 text-slate-200/90 sm:text-sm">Descubre el concepto con pistas y demuestra lo que sabes.</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-semibold text-slate-200 sm:text-xs">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-cyan-300" /> 1–5 min</span>
                  <span className="inline-flex items-center gap-1.5 text-amber-200"><Image src="/peaky/homepage/xp.webp" alt="" width={22} height={22} className="h-5 w-5 object-contain" /> +XP</span>
                  <ArrowUpRight className="h-4 w-4 text-cyan-200 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
