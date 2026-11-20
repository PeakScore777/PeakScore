"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { prepareCasoCeroAmbientAudio } from "@/lib/games/caso-cero-audio";

type GameCard = {
  number: string;
  area: string;
  title: string;
  description: string;
  image: string;
  href?: string;
};

const games: GameCard[] = [
  {
    number: "01",
    area: "Matemáticas",
    title: "Operación Rescate",
    description: "Resuelve desafíos matemáticos y usa los datos para sacar adelante cada misión.",
    image: "/images/games/covers/01-matematicas.png",
  },
  {
    number: "02",
    area: "Ciencias naturales",
    title: "Caso Cero",
    description: "Investiga fenómenos, analiza experimentos y decide qué conclusiones respaldan los datos.",
    image: "/images/games/covers/02-ciencias-naturales.png",
    href: "/aprender/juegos/caso-cero",
  },
  {
    number: "03",
    area: "Lectura crítica",
    title: "El Archivo Oculto",
    description: "Lee documentos, encuentra pistas y resuelve preguntas de comprensión lectora.",
    image: "/images/games/covers/03-lectura-critica.png",
    href: "/aprender/juegos/archivo-oculto",
  },
  {
    number: "04",
    area: "Sociales y ciudadanas",
    title: "Mapa de Decisiones",
    description: "Analiza conflictos históricos y sociales antes de tomar una decisión fundamentada.",
    image: "/images/games/covers/04-sociales-ciudadanas.png",
  },
  {
    number: "05",
    area: "Inglés",
    title: "Misión Global",
    description: "Interpreta avisos, conversaciones y situaciones cotidianas en inglés.",
    image: "/images/games/covers/05-ingles.png",
  },
  {
    number: "06",
    area: "Mixto",
    title: "¿Qué es esa vaina?",
    description: "Descifra conceptos con pistas, razona y aprende de tus errores.",
    image: "/images/games/backgrounds/que-es-esa-vaina-bg.png",
    href: "/aprender/juegos/que-es-esa-vaina",
  },
];

export default function GamesHub() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <main className="games-hub min-h-[calc(100svh-72px)] overflow-x-clip bg-[#0a0d13] text-[#eef1f5]">
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-12 pt-4 sm:px-5 sm:pt-5 lg:px-6">
        <section aria-label="Juegos disponibles">
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
            {games.map((game, index) => {
              const available = Boolean(game.href);
              const actionClass = available
                ? "games-enter-button relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-[9px] border border-[#91f47a] bg-[#76df58] px-6 text-[12px] font-extrabold normal-case tracking-[0.035em] text-[#10210f] shadow-[0_4px_0_#378f38,0_8px_18px_rgba(62,183,66,.18)] before:absolute before:left-4 before:top-[5px] before:h-[2px] before:w-16 before:rounded-full before:bg-white/35 before:content-[''] transition-[transform,background-color,box-shadow,filter] duration-150 hover:-translate-y-[2px] hover:border-[#b4ffa3] hover:bg-[#87ed69] hover:shadow-[0_6px_0_#378f38,0_11px_23px_rgba(62,183,66,.25)] active:translate-y-[2px] active:shadow-[0_1px_0_#378f38,0_3px_8px_rgba(62,183,66,.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5f58e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151d]"
                : "inline-flex min-h-9 items-center justify-center rounded-[8px] border border-[#354052] bg-[#1b2330] px-4 text-[10px] font-bold uppercase tracking-[0.09em] text-[#a9b4c3] transition-colors duration-150 hover:border-[#64748b] hover:bg-[#222d3c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bb7df]";

              const cardBody = (
                <>
                  <div className="game-card-art relative aspect-[16/8.4] overflow-hidden bg-[#171e29]">
                    <Image
                      src={game.image}
                      alt={`Portada de ${game.title}`}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 410px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080b10]/90 via-transparent to-[#080b10]/20" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-3 pt-9">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#e4c99e] drop-shadow-[0_1px_5px_rgba(0,0,0,.9)]">
                        {game.area}
                      </span>
                    </div>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c6a16a]/70 to-transparent" />
                  </div>

                  <div className="relative flex flex-1 flex-col px-[17px] pb-[17px] pt-[14px] sm:px-[18px]">
                    <h2 className="max-w-[85%] text-[19px] font-extrabold leading-6 tracking-[-0.035em] text-[#f4f1eb] sm:text-[20px]">
                      {game.title}
                    </h2>
                    <p className="mt-[7px] min-h-[40px] max-w-[54ch] text-[12px] leading-[1.6] text-[#aeb8c7]">
                      {game.description}
                    </p>

                    <div className="mt-4 flex items-center justify-end gap-3 border-t border-[#303948] pt-3">
                      {game.href ? (
                        <Link
                          href={game.href}
                          onClick={(event) => {
                            if (
                              game.href === "/aprender/juegos/caso-cero" &&
                              event.button === 0 &&
                              !event.metaKey &&
                              !event.ctrlKey &&
                              !event.shiftKey &&
                              !event.altKey
                            ) {
                              void prepareCasoCeroAmbientAudio();
                            }
                          }}
                          className={actionClass}
                        >
                          <span className="relative z-10">Entrar</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setComingSoon(game.title)}
                          className={actionClass}
                        >
                          Próximamente
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );

              return (
                <article
                  key={game.number}
                  className="game-arcade-card group relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[#303a49] bg-[#111720] shadow-[0_6px_18px_rgba(0,0,0,.15)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#64758d] hover:shadow-[0_15px_30px_rgba(0,0,0,.27)]"
                >
                  <span className="pointer-events-none absolute left-3 top-0 z-10 h-[2px] w-12 bg-[#b99a6b] opacity-80" />
                  {cardBody}
                </article>
              );
            })}
          </div>
        </section>


      </div>

      <section
        className="games-guardian-runway relative mt-4 h-[88px] w-full max-w-full overflow-hidden"
        aria-label="Personaje recorriendo la biblioteca"
      >
        <div className="games-guardian-runner" aria-hidden="true" />
      </section>

      {comingSoon && (
        <div
          className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded-lg border border-[#39465a] bg-[#151d29] p-4 shadow-[0_14px_40px_rgba(0,0,0,.38)]"
          role="status"
          aria-live="polite"
        >
          <p className="flex-1 text-sm leading-5 text-[#d8e0eb]">
            <strong className="font-semibold text-white">{comingSoon}</strong> todavía está en desarrollo.
          </p>
          <button
            type="button"
            onClick={() => setComingSoon(null)}
            aria-label="Cerrar mensaje"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#9eacbf] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bb7df]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
  );
}
