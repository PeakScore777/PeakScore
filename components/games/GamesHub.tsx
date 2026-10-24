"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileSearch,
  FlaskConical,
  Microscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function GamesHub() {
  return (
    <main className="games-hub relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#050817] text-white">
      {/* El letrero JUEGOS está integrado en el arte del fondo. */}
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/backgrounds/games-arcade-bg.png')" }} />
      <div className="absolute inset-0 -z-10 bg-[#050817]/[.26]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#050817]/15 via-[#050817]/5 to-[#050817]/70" />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-10">
        <section className="ml-auto max-w-[1050px]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-7">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#e8b96b]"><Sparkles className="h-4 w-4"/> PEAKSCORE · ARCADE DE APRENDIZAJE</p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">Elige tu próxima misión</h1>
              <p className="mt-2 max-w-lg text-xs leading-5 text-[#d0d8e5] sm:text-sm">Juega para dominar conceptos de Saber 11. Cada reto entrena una forma diferente de pensar.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 border border-[#7f9b95]/50 bg-[#0a171b]/90 px-3 py-2 text-[10px] font-bold text-[#b6e2d8]"><ShieldCheck className="h-3.5 w-3.5"/> SABER 11</span>
              <span className="inline-flex items-center gap-1.5 border border-[#9e7747]/55 bg-[#21180f]/90 px-3 py-2 text-[10px] font-bold text-[#f1c988]"><BrainCircuit className="h-3.5 w-3.5"/> IA PARA APRENDER</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Link href="/aprender/juegos/que-es-esa-vaina" className="group flex min-w-0 flex-col overflow-hidden border-[3px] border-[#537e83] bg-[#070d1a]/[.97] shadow-[5px_5px_0_rgba(2,5,13,.85),0_18px_42px_rgba(0,0,0,.35)] transition duration-200 hover:-translate-y-1 hover:border-[#83cbc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8e7df]">
              <div className="relative aspect-[16/8.5] overflow-hidden border-b-2 border-[#426b72] bg-[#0e1728]">
                <Image src="/images/games/backgrounds/que-es-esa-vaina-bg.png" alt="Biblioteca misteriosa de ¿Qué es esa vaina?" fill sizes="(max-width: 768px) 100vw, 520px" className="object-cover transition duration-500 group-hover:scale-[1.035]"/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#060b17] via-[#060b17]/10 to-transparent"/>
                <span className="absolute left-4 top-4 border border-[#72b9bb] bg-[#07151b]/95 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#b7eeeb]">MINIJUEGO · 01</span>
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 border border-[#467d80] bg-[#081721]/95 px-3 py-2 text-[10px] font-black text-[#c9f3eb]"><Sparkles className="h-4 w-4"/> DESCIFRA LAS PISTAS</span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-lg font-black uppercase leading-tight tracking-wide text-white sm:text-xl">¿Qué es esa vaina?</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#c1ccdb] sm:text-sm">Descubre conceptos por pistas, decide bajo presión y aprende de las respuestas que falles.</p></div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#467d80] bg-[#10262a] text-[#9be1d9]"><BrainCircuit className="h-5 w-5"/></span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#263941] pt-3 text-[10px] font-bold text-[#c6d3df]">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#83d3d0]"/> 1–5 min</span>
                  <span className="inline-flex items-center gap-1.5 text-[#f0c87d]"><Image src="/peaky/homepage/xp.webp" alt="" width={20} height={20} className="h-5 w-5 object-contain"/> XP por partida</span>
                  <span className="inline-flex items-center gap-1.5 text-[#9de0d5]">JUGAR <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></span>
                </div>
              </div>
            </Link>

            <Link href="/aprender/juegos/caso-cero" className="group flex min-w-0 flex-col overflow-hidden border-[3px] border-[#946b38] bg-[#090e17]/[.98] shadow-[5px_5px_0_rgba(2,5,13,.85),0_18px_42px_rgba(0,0,0,.4)] transition duration-200 hover:-translate-y-1 hover:border-[#e6b866] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffdda1]">
              <div className="relative aspect-[16/8.5] overflow-hidden border-b-2 border-[#6f5230] bg-[radial-gradient(ellipse_at_50%_25%,rgba(190,132,61,.22),transparent_48%),linear-gradient(135deg,#1d2528,#0b101a_58%,#20160d)]">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(190,155,97,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(190,155,97,.18) 1px,transparent 1px)", backgroundSize: "26px 26px" }}/>
                <span className="absolute left-4 top-4 border border-[#a57b42] bg-[#19140e]/95 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#f3ce8d]">MINIJUEGO · 02</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative grid h-40 w-40 place-items-center sm:h-48 sm:w-48">
                    <div className="absolute inset-2 rotate-6 border border-[#b58c4b]/65"/>
                    <div className="absolute inset-5 -rotate-3 border border-[#6aa89b]/60"/>
                    <div className="absolute inset-8 border border-[#b58c4b]/50"/>
                    <div className="relative grid h-24 w-24 place-items-center border-2 border-[#d5ac69] bg-[#20241f] shadow-[5px_5px_0_#05070b] sm:h-28 sm:w-28"><Microscope className="h-12 w-12 text-[#f0ca83] sm:h-14 sm:w-14"/></div>
                    <span className="absolute right-0 top-5 inline-flex items-center gap-1 border border-[#4b8880] bg-[#102521] px-2 py-1 text-[8px] font-black text-[#b7e5d6]"><CheckCircle2 className="h-3 w-3"/> DATOS</span>
                    <span className="absolute bottom-4 left-0 inline-flex items-center gap-1 border border-[#98703b] bg-[#2b1d10] px-2 py-1 text-[8px] font-black text-[#f2c983]"><FileSearch className="h-3 w-3"/> EVIDENCIAS</span>
                    <span className="absolute left-1 top-1/2 border border-[#4c7773] bg-[#0c1c1c] px-2 py-1 text-[8px] font-black text-[#b7e5d6]">¿POR QUÉ?</span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#080d16] to-transparent"/>
                <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 border border-[#966b35] bg-[#1a140e]/95 px-3 py-2 text-[10px] font-black text-[#f5d49b]"><FlaskConical className="h-4 w-4"/> INVESTIGA EL CASO</span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-lg font-black uppercase leading-tight tracking-wide text-white sm:text-xl">Caso Cero: Archivo de evidencias</h2><p className="mt-2 max-w-sm text-xs leading-5 text-[#c1ccdb] sm:text-sm">Analiza experimentos, compara datos y detecta qué conclusiones tienen fundamento científico.</p></div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#9b703a] bg-[#2b1e12] text-[#f1c67c]"><Microscope className="h-5 w-5"/></span>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#403324] pt-3 text-[10px] font-bold text-[#c6d3df]">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-[#e6b866]"/> 5–8 min</span>
                  <span className="inline-flex items-center gap-1.5 text-[#f0c87d]"><Microscope className="h-4 w-4"/> Razonamiento científico</span>
                  <span className="inline-flex items-center gap-1.5 text-[#f0c87d]">INVESTIGAR <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></span>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 border border-[#45515f] bg-[#080d18]/90 p-3"><FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#e4b968]"/><div><p className="text-xs font-extrabold text-white">Razonamiento, no memoria</p><p className="mt-1 text-[10px] leading-4 text-[#aebdcd]">Interpreta situaciones, tablas y evidencia.</p></div></div>
            <div className="flex items-start gap-3 border border-[#45515f] bg-[#080d18]/90 p-3"><FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[#a7d8ca]"/><div><p className="text-xs font-extrabold text-white">Materias de Saber 11</p><p className="mt-1 text-[10px] leading-4 text-[#aebdcd]">Ciencias y conceptos en contextos nuevos.</p></div></div>
            <div className="flex items-start gap-3 border border-[#45515f] bg-[#080d18]/90 p-3"><BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-[#e5bb72]"/><div><p className="text-xs font-extrabold text-white">Aprende de tus errores</p><p className="mt-1 text-[10px] leading-4 text-[#aebdcd]">Usa a Orby para entender el razonamiento.</p></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
