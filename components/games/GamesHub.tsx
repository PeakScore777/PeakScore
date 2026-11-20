"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
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

const runners = [
  { src: "/avatars/photo_perfil/peaky-nova.png", name: "Peaky Nova", delay: "0s" },
  { src: "/avatars/photo_perfil/peaky-nox.png", name: "Peaky Nox", delay: "-1.4s" },
  { src: "/avatars/photo_perfil/zyrap.png", name: "Zyra", delay: "-2.8s" },
  { src: "/avatars/photo_perfil/orbyp.png", name: "Orby", delay: "-4.2s" },
];

export default function GamesHub() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <main className="games-hub min-h-[calc(100svh-72px)] bg-[#0b0e14] text-[#eef1f5]">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-5 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <section aria-label="Juegos disponibles">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c9aaf]">
                PEAKSCORE / ARCADE
              </p>
              <h1 className="text-[25px] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[30px]">
                Elige tu próximo desafío
              </h1>
              <p className="mt-2 max-w-[58ch] text-[13px] leading-6 text-[#9da9b8]">
                Seis formas de poner a prueba lo que sabes. Entra, juega y mejora en cada intento.
              </p>
            </div>
            <span className="hidden shrink-0 pb-1 font-mono text-[11px] tracking-[0.12em] text-[#68778c] sm:block">
              06 EXPERIENCIAS
            </span>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {games.map((game, index) => {
              const actionClass =
                "group/action inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.13] bg-white/[0.045] px-4 text-[12px] font-semibold text-[#edf2f8] transition-[background-color,border-color,color] duration-200 hover:border-[#9fb4d0]/55 hover:bg-[#dce8f7]/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8bfdc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#10151e] active:bg-white/[0.12]";

              return (
                <article
                  key={game.number}
                  className="game-arcade-card group relative flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#2a3442] bg-[#111720] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#62758f]/75 hover:shadow-[0_18px_42px_rgba(0,0,0,.28)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#171e29]">
                    <Image
                      src={game.image}
                      alt={`Portada de ${game.title}`}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 410px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080c12]/75 via-[#080c12]/5 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-md border border-white/20 bg-[#080d14]/75 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-white/90 backdrop-blur-sm">
                      {game.number}
                    </span>
                    <span className="absolute bottom-4 left-4 text-[10px] font-semibold uppercase tracking-[0.19em] text-white/75 drop-shadow">
                      {game.area}
                    </span>
                    <span className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 bg-[#c6d5e8] transition-[width] duration-500 ease-out group-hover:w-full" />
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-[18px] sm:px-[22px]">
                    <h2 className="text-[19px] font-bold leading-7 tracking-[-0.035em] text-[#f3f5f8] sm:text-[20px]">
                      {game.title}
                    </h2>
                    <p className="mt-2 min-h-[44px] max-w-[52ch] text-[13px] leading-[1.7] text-[#aab5c4]">
                      {game.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.085] pt-4">
                      <span className="font-mono text-[9px] font-semibold tracking-[0.18em] text-[#6f7e92]">
                        PEAKSCORE
                      </span>
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
                          Jugar
                          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" aria-hidden="true" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setComingSoon(game.title)}
                          className={actionClass}
                        >
                          Próximamente
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="games-character-runway mt-10" aria-label="Personajes de PeakScore">
          <div className="games-runway-track" aria-hidden="true">
            <div className="games-runner-lane">
              {runners.map((runner) => (
                <div
                  key={runner.name}
                  className="games-runner"
                  style={{ animationDelay: runner.delay }}
                >
                  <Image
                    src={runner.src}
                    alt=""
                    width={58}
                    height={58}
                    sizes="58px"
                    className="games-runner-avatar"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="font-mono text-[9px] tracking-[0.16em] text-[#66758a]">
              PEAKSCORE CREW
            </span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-[#536176]">
              KEEP MOVING
            </span>
          </div>
        </section>
      </div>

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
