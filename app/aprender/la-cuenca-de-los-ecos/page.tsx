"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";

const chapters = [
  { id: "01", title: "El Bosque que Dejó de Cantar", description: "Reconstruye el ecosistema: organismos, factores ambientales, hábitats y nichos.", available: true, href: "/aprender/la-cuenca-de-los-ecos/leccion/1", tags: ["Ecosistemas", "Hábitat", "Poblaciones"] },
  { id: "02", title: "Las Alianzas Invisibles", description: "Descubre cómo interactúan las especies y qué ocurre cuando cambia una relación ecológica.", available: false, href: "", tags: ["Mutualismo", "Competencia", "Parasitismo"] },
  { id: "03", title: "La Cadena Rota", description: "Sigue el flujo de materia y energía a través de cadenas y redes tróficas.", available: false, href: "", tags: ["Redes tróficas", "Energía", "Materia"] },
  { id: "04", title: "El Guardián del Equilibrio", description: "Desafío final: explica cambios en el ecosistema usando evidencias y modelos.", available: false, href: "", tags: ["Indagación", "Evidencia", "Jefe de ruta"] },
];

export default function LaCuencaDeLosEcosPage() {
  return (
    <main className="pixel-font min-h-[calc(100vh-72px)] overflow-hidden bg-[#050b09] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/aprender" className="group inline-flex items-center gap-2 px-1 py-2 text-sm text-slate-300/80 transition hover:text-white"><ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" /> Volver a las rutas</Link>

        <section className="relative mt-3 overflow-hidden rounded-[22px] border border-emerald-100/15 bg-[#081611] shadow-[0_22px_70px_rgba(0,0,0,.3)]">
          <div className="absolute inset-0">
            <Image src="/images/aprender/cuenca-de-los-ecos/header.svg" alt="Río que atraviesa un bosque de la Cuenca de los Ecos" fill priority sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#06120ff2_0%,rgba(6,18,15,.91)_27%,rgba(6,18,15,.54)_54%,rgba(6,18,15,.05)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06100c] via-transparent to-black/10" />
          </div>
          <div className="relative grid min-h-[350px] items-end px-5 pb-8 pt-8 sm:min-h-[390px] sm:px-8 sm:pb-9 lg:min-h-[420px] lg:px-10">
            <div className="max-w-[660px]">
              <div className="inline-flex items-center gap-2 border-2 border-emerald-300/50 bg-[#071710]/90 px-3 py-2 text-[9px] uppercase tracking-[.08em] text-emerald-100 [box-shadow:3px_3px_0_#163b2c]">Ruta 02 <span className="text-white/30">·</span> Ciencias Naturales</div>
              <h1 className="mt-5 text-[clamp(1.2rem,2.5vw,2.5rem)] leading-[1.65] text-[#f0f8ef]">La Cuenca<br />de los <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">Ecos</span></h1>
              <p className="mt-4 max-w-[560px] text-[9px] leading-[2.2] text-emerald-50/85 sm:text-[10px]">Sigue las pistas que dejó el cristal, investiga el silencio del bosque y descubre cómo se relacionan los seres vivos con su entorno.</p>
              <div className="mt-5 flex flex-wrap gap-3"><span className="border border-emerald-200/35 bg-[#06100c]/90 px-3 py-2 text-[8px] leading-5 text-emerald-100 [box-shadow:3px_3px_0_#163b2c]">BIOLOGÍA · ECOLOGÍA</span><span className="border border-cyan-200/35 bg-[#06100c]/90 px-3 py-2 text-[8px] leading-5 text-cyan-100 [box-shadow:3px_3px_0_#163447]">01 / 04 CAPÍTULOS</span></div>
            </div>
            <span className="absolute right-5 top-5 border-2 border-emerald-300/45 bg-[#06271d]/95 px-3 py-2 text-[8px] uppercase text-emerald-100 [box-shadow:3px_3px_0_#12453c] sm:right-8 sm:top-7">Expedición ecológica</span>
          </div>
          <div className="relative border-t border-white/10 bg-[#07130feF] px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-4 text-sm"><span className="font-medium text-slate-200">Avance del capítulo</span><span className="font-bold tabular-nums text-white/90">0%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-300" /></div><p className="mt-2 text-xs text-slate-400">Observa, registra y compara antes de proponer una explicación.</p></div>
              <Link href="/aprender/la-cuenca-de-los-ecos/leccion/1" className="group inline-flex min-h-[54px] items-center justify-center gap-3 border-2 border-emerald-200 bg-[#103024] px-6 py-3 text-[9px] uppercase tracking-[.04em] text-emerald-50 [box-shadow:5px_5px_0_#03120d] transition-[transform,box-shadow,background-color] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#164333] hover:shadow-[3px_3px_0_#03120d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"><span className="inline-block h-2.5 w-2.5 bg-emerald-200 [clip-path:polygon(0_0,100%_50%,0_100%)]" /> Iniciar capítulo 01 <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </section>

        <section className="mt-9 sm:mt-11">
          <p className="text-[9px] uppercase tracking-[.12em] text-emerald-200">Tu recorrido</p>
          <h2 className="mt-2 text-[clamp(1rem,1.7vw,1.5rem)] leading-[1.8] text-[#f0f8ef]">Capítulos de la cuenca</h2>
          <p className="mt-2 mb-5 max-w-3xl text-[9px] leading-[2.1] text-slate-300/75">Cada capítulo añade una pieza a la investigación. Por ahora, el primero está disponible; los siguientes se habilitarán cuando sus desafíos estén listos.</p>
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {chapters.map((chapter) => {
              const content = (
                <>
                  <div className="relative h-36 overflow-hidden bg-[#0a1913]">
                    <Image src="/images/aprender/cuenca-de-los-ecos/header.svg" alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className={"object-cover transition duration-500 " + (chapter.available ? "group-hover:scale-105" : "grayscale opacity-35")} />
                    <div className={"absolute inset-0 " + (chapter.available ? "bg-gradient-to-t from-[#06100c] via-[#06100c]/15 to-transparent" : "bg-[#050b09]/65")} />
                    <span className={"absolute left-3 top-3 border px-2 py-1 text-[7px] " + (chapter.available ? "border-emerald-200/35 bg-[#082318]/90 text-emerald-100" : "border-white/15 bg-black/60 text-white/50")}>{chapter.id}</span>
                    {!chapter.available && <LockKeyhole className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/60" />}
                    {chapter.available && <span className="absolute bottom-3 left-3 border border-emerald-200/35 bg-[#082318]/90 px-2 py-1 text-[7px] text-emerald-100">DISPONIBLE</span>}
                  </div>
                  <div className="p-4"><p className="text-[7px] uppercase tracking-[.1em] text-emerald-200/70">Ciencias Naturales · Biología</p><h3 className={"mt-3 text-[9px] leading-[1.9] " + (chapter.available ? "text-white" : "text-white/50")}>{chapter.title}</h3><p className={"mt-3 text-[8px] leading-[2] " + (chapter.available ? "text-slate-300/80" : "text-slate-400/45")}>{chapter.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{chapter.tags.map((tag) => <span key={tag} className="border border-white/[.08] bg-white/[.025] px-2 py-1 text-[7px] text-slate-300/65">{tag}</span>)}</div><div className={"mt-4 flex min-h-9 items-center justify-center gap-2 border px-3 py-2 text-[7px] " + (chapter.available ? "border-emerald-200/30 bg-[#173a2a] text-emerald-100 transition group-hover:bg-[#1e4b36]" : "border-white/[.07] bg-white/[.025] text-white/30")}>{chapter.available ? <>Explorar capítulo <ArrowRight className="h-3.5 w-3.5" /></> : <>Próximamente <LockKeyhole className="h-3.5 w-3.5" /></>}</div></div>
                </>
              );
              return chapter.available ? <Link key={chapter.id} href={chapter.href} className="group block overflow-hidden rounded-xl border border-emerald-100/15 bg-[linear-gradient(145deg,rgba(12,32,23,.97),rgba(5,13,10,.98))] shadow-[0_8px_25px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-emerald-200/45">{content}</Link> : <article key={chapter.id} aria-disabled="true" className="overflow-hidden rounded-xl border border-white/[.07] bg-[#07100c]/80 opacity-70">{content}</article>;
            })}
          </div>
        </section>
        <div className="mt-6 border border-emerald-200/15 bg-[#08130e] p-4 text-[8px] leading-[2.2] text-slate-300/70 [box-shadow:4px_4px_0_#102319]"><p>La historia presenta un caso ficticio para estudiar situaciones ecológicas. Los registros de los desafíos son datos didácticos y deben interpretarse sin afirmar causas que la evidencia no permita demostrar.</p></div>
      </div>
      <style jsx global>{`
        .pixel-font, .pixel-font * { font-family: var(--font-press-start), "Press Start 2P", monospace; }
        @media (prefers-reduced-motion: reduce) { .group, .group * { transition-duration: 0ms !important; } }
      `}</style>
    </main>
  );
}
