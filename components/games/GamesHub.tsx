"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import { startCasoCeroAmbientAudio } from "@/lib/games/caso-cero-audio";

type GameTone = "yellow" | "teal" | "red" | "orange" | "blue" | "purple";
type GameCard = {
  number: string;
  area: string;
  title: string;
  description: string;
  image: string;
  href?: string;
  tone: GameTone;
};

const games: GameCard[] = [
  {
    number: "01",
    area: "Matemáticas",
    title: "Operación Rescate",
    description: "Resuelve desafíos matemáticos y usa los datos para sacar adelante cada misión.",
    image: "/images/games/covers/01-matematicas.png",
    tone: "yellow",
  },
  {
    number: "02",
    area: "Ciencias Naturales",
    title: "Caso Cero: Archivo de evidencias",
    description: "Investiga fenómenos, analiza experimentos y decide qué conclusiones respaldan los datos.",
    image: "/images/games/covers/02-ciencias-naturales.png",
    href: "/aprender/juegos/caso-cero",
    tone: "teal",
  },
  {
    number: "03",
    area: "Lectura Crítica",
    title: "El Archivo Oculto",
    description: "Descubre ideas clave, conecta evidencias y detecta argumentos engañosos.",
    image: "/images/games/covers/03-lectura-critica.png",
    tone: "red",
  },
  {
    number: "04",
    area: "Sociales y Ciudadanas",
    title: "Mapa de Decisiones",
    description: "Investiga conflictos históricos y sociales antes de decidir qué postura tiene fundamento.",
    image: "/images/games/covers/04-sociales-ciudadanas.png",
    tone: "orange",
  },
  {
    number: "05",
    area: "Inglés",
    title: "Misión Global",
    description: "Resuelve situaciones cotidianas interpretando avisos, conversaciones y textos en inglés.",
    image: "/images/games/covers/05-ingles.png",
    tone: "blue",
  },
  {
    number: "06",
    area: "Mixto",
    title: "¿Qué es esa vaina?",
    description: "Descifra conceptos con pistas, toma decisiones y aprende de tus errores.",
    image: "/images/games/backgrounds/que-es-esa-vaina-bg.png",
    href: "/aprender/juegos/que-es-esa-vaina",
    tone: "purple",
  },
];

const palette: Record<GameTone, { frame: string; divider: string; number: string; label: string; title: string; button: string; focus: string }> = {
  yellow: {
    frame: "border-[#f4cc2f] hover:border-[#ffe778]",
    divider: "border-[#c2a42b]",
    number: "bg-[#f4cc2f] text-[#171309]",
    label: "border-[#d5b52d] bg-[#151306]/95 text-[#ffe778]",
    title: "text-[#ffdf58]",
    button: "border-[#ffe778] bg-[#f4cc2f] text-[#171309] hover:bg-[#ffdf58]",
    focus: "focus-visible:ring-[#ffe778]",
  },
  teal: {
    frame: "border-[#27d7bb] hover:border-[#8affdf]",
    divider: "border-[#188e7d]",
    number: "bg-[#27d7bb] text-[#06201d]",
    label: "border-[#25bca6] bg-[#061a1a]/95 text-[#9af8e0]",
    title: "text-[#61f0d2]",
    button: "border-[#7fffe3] bg-[#27d7bb] text-[#05201b] hover:bg-[#66f5d7]",
    focus: "focus-visible:ring-[#7fffe3]",
  },
  red: {
    frame: "border-[#ff596b] hover:border-[#ff9ba5]",
    divider: "border-[#b9384d]",
    number: "bg-[#ff596b] text-[#26080d]",
    label: "border-[#d34b5f] bg-[#210b12]/95 text-[#ffb2ba]",
    title: "text-[#ff7887]",
    button: "border-[#ff9ba5] bg-[#ff596b] text-[#26080d] hover:bg-[#ff8190]",
    focus: "focus-visible:ring-[#ff9ba5]",
  },
  orange: {
    frame: "border-[#ff7a23] hover:border-[#ffb36e]",
    divider: "border-[#b54a18]",
    number: "bg-[#ff7a23] text-[#261006]",
    label: "border-[#d65f22] bg-[#211007]/95 text-[#ffc18b]",
    title: "text-[#ff9a47]",
    button: "border-[#ffb36e] bg-[#ff7a23] text-[#261006] hover:bg-[#ff9848]",
    focus: "focus-visible:ring-[#ffb36e]",
  },
  blue: {
    frame: "border-[#36c2ff] hover:border-[#8ce2ff]",
    divider: "border-[#147da8]",
    number: "bg-[#36c2ff] text-[#062033]",
    label: "border-[#2699ce] bg-[#061725]/95 text-[#a5e8ff]",
    title: "text-[#63d2ff]",
    button: "border-[#8ce2ff] bg-[#36c2ff] text-[#062033] hover:bg-[#75d9ff]",
    focus: "focus-visible:ring-[#8ce2ff]",
  },
  purple: {
    frame: "border-[#ca42ff] hover:border-[#ed9bff]",
    divider: "border-[#8732b0]",
    number: "bg-[#ca42ff] text-[#21082b]",
    label: "border-[#aa43d3] bg-[#1b0923]/95 text-[#f0b0ff]",
    title: "text-[#df80ff]",
    button: "border-[#ed9bff] bg-[#ca42ff] text-[#21082b] hover:bg-[#dc77ff]",
    focus: "focus-visible:ring-[#ed9bff]",
  },
};

export default function GamesHub() {
  const [tutorOpen, setTutorOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <main className="games-hub relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#050817] text-white">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/fondo-juegos-pixelart.png')" }} />
      <div className="absolute inset-0 -z-10 bg-[#050817]/[.28]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#050817]/15 via-[#050817]/20 to-[#050817]/75" />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-7 sm:pt-7 lg:px-8">
        <section className="mx-auto max-w-[1160px]">
          <header className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-7">
            <Image src="/images/games/gamepad-pixelart.png" alt="" aria-hidden="true" width={72} height={56} className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(25,216,255,.85)] sm:h-12" priority/>
            <div className="min-w-0">
              <h1 className="pixel-font text-xl leading-[1.7] text-white drop-shadow-[0_0_10px_rgba(190,70,255,.85)] sm:text-2xl xl:text-3xl">JUEGOS EDUCATIVOS</h1>
              <p className="pixel-font mx-auto mt-2 max-w-2xl text-[8px] leading-6 text-[#e1eaf8] drop-shadow-[0_1px_2px_#020617] sm:text-[9px]">Practica, razona y domina los temas del ICFES con minijuegos únicos.</p>
              <div aria-hidden="true" className="mx-auto mt-4 flex h-[3px] w-56 items-center justify-center bg-gradient-to-r from-[#19d8ff] via-[#b44bff] to-[#19d8ff]"><span className="h-3 w-3 rotate-45 border-2 border-[#ffc34a] bg-[#ff8a2a] shadow-[0_0_12px_#ff8a2a]"/></div>
            </div>
            <button
              type="button"
              onClick={() => setTutorOpen(true)}
              className="group inline-flex min-h-9 items-center gap-2 border-2 border-[#ff9a47] bg-[#2a1308]/95 px-3 py-2 text-left shadow-[3px_3px_0_#020714] transition hover:border-[#ffc18b] hover:bg-[#3b1c0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb36e]"
              aria-label="Abrir el chat de Orby, tutor con inteligencia artificial"
            >
              <Image src="/avatars/photo_perfil/orbyp.png" alt="" width={32} height={32} className="h-8 w-8 object-contain"/>
              <span className="pixel-font text-[8px] text-[#ffad63] sm:text-[9px]">PREGÚNTALE A ORBY</span>
            </button>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
            {games.map((game) => {
              const colors = palette[game.tone];
              return (
                <article
                  key={game.number}
                  className={["group flex min-w-0 flex-col overflow-hidden border-[3px] bg-[#050b18]/[.97] shadow-[5px_5px_0_rgba(2,5,13,.9),0_14px_30px_rgba(0,0,0,.34)] transition duration-200 hover:-translate-y-1", colors.frame].join(" ")}
                >
                  <div className={["relative aspect-[2.18/1] overflow-hidden border-b-2 bg-[#0b1020]", colors.divider].join(" ")}>
                    <Image src={game.image} alt={"Portada de " + game.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 420px" className="object-cover transition duration-500 group-hover:scale-[1.035]"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#040914]/70 via-transparent to-[#040914]/10"/>
                    <span className={["absolute left-3 top-3 grid h-9 min-w-9 place-items-center px-2 text-sm font-black shadow-[2px_2px_0_rgba(0,0,0,.7)]", colors.number].join(" ")}>{game.number}</span>
                    <span className={["absolute left-[60px] top-3 border px-2.5 py-2 text-[9px] font-black uppercase tracking-wide shadow-[2px_2px_0_rgba(0,0,0,.65)]", colors.label].join(" ")}>{game.area}</span>
                  </div>

                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <h2 className={["pixel-font text-[9px] leading-[1.9] sm:text-[10px]", colors.title].join(" ")}>{game.title.toUpperCase()}</h2>
                    <p className="mt-2 min-h-[44px] text-xs leading-5 text-[#e0e8f4] sm:text-[13px] sm:leading-5">{game.description}</p>

                    <div className="mt-4 border-t border-white/10 pt-3">
                      {game.href ? (
                        <Link
                          href={game.href}
                          onClick={(event) => {
                            // Start audio in the same trusted click that opens Caso Cero,
                            // so the intro does not ask for another click to enable sound.
                            if (
                              game.href === "/aprender/juegos/caso-cero" &&
                              event.button === 0 &&
                              !event.metaKey &&
                              !event.ctrlKey &&
                              !event.shiftKey &&
                              !event.altKey
                            ) {
                              void startCasoCeroAmbientAudio();
                            }
                          }}
                          className={["inline-flex min-h-10 w-full items-center justify-center gap-3 border-2 px-4 py-2.5 text-xs font-black transition active:translate-y-px", colors.button, colors.focus].join(" ")}
                        >
                          <span className="pixel-font text-[9px] tracking-wide">JUGAR</span>
                        </Link>
                      ) : (
                        <button type="button" onClick={() => setComingSoon(game.title)} className={["inline-flex min-h-10 w-full items-center justify-center gap-3 border-2 px-4 py-2.5 text-xs font-black transition active:translate-y-px", colors.button, colors.focus].join(" ")}>
                          <span className="pixel-font text-[9px] tracking-wide">JUGAR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {comingSoon && (
        <div className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 border-2 border-[#dba85a] bg-[#10131d] p-4 shadow-[4px_4px_0_#02050a]" role="status" aria-live="polite">
          <Sparkles className="h-5 w-5 shrink-0 text-[#ffc978]"/>
          <p className="flex-1 text-sm leading-5 text-[#f4ead8]"><strong>{comingSoon}</strong> está en desarrollo. Pronto podrás jugar esta misión.</p>
          <button type="button" onClick={() => setComingSoon(null)} aria-label="Cerrar mensaje" className="grid h-8 w-8 shrink-0 place-items-center border border-[#5a5b64] text-[#e9eaf0] hover:bg-[#282a34]"><X className="h-4 w-4"/></button>
        </div>
      )}

      <LessonAITutor
        open={tutorOpen}
        onOpenChange={setTutorOpen}
        accent="orby"
        stage="practice"
        subject="Saber 11"
        topic="Juegos educativos PeakScore"
        question=""
        context=""
      />
    </main>
  );
}
