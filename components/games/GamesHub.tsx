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

export default function GamesHub() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  return (
    <main className="games-hub min-h-[calc(100svh-72px)] bg-[#0b0e14] text-[#eef1f5]">
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-14 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pt-10">
        <section aria-label="Juegos disponibles">
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {games.map((game, index) => {
              const actionClass =
                "inline-flex min-h-10 items-center gap-2 rounded-md border border-[#39465a] bg-[#192231] px-4 text-[13px] font-semibold text-[#eef3fb] transition-colors duration-150 hover:border-[#7895bd] hover:bg-[#202d40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bb7df] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111722] active:bg-[#24344a]";

              return (
                <article
                  key={game.number}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#28313f] bg-[#121822] transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#46566d] hover:bg-[#151d29]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#171e29]">
                    <Image
                      src={game.image}
                      alt={`Portada de ${game.title}`}
                      fill
                      priority={index < 3}
                      sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 410px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
                    <span className="absolute left-3 top-3 rounded-md border border-white/15 bg-[#0b1019]/85 px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.08em] text-white/90 backdrop-blur-[2px]">
                      {game.number}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-5 sm:pb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#91a0b4]">
                      {game.area}
                    </p>
                    <h2 className="mt-2 text-[19px] font-bold leading-7 tracking-[-0.025em] text-[#f3f5f8] sm:text-xl">
                      {game.title}
                    </h2>
                    <p className="mt-2 min-h-[44px] max-w-[52ch] text-[13px] leading-[1.65] text-[#aeb8c6]">
                      {game.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#293342] pt-4">
                      <span className="text-[11px] font-medium tracking-wide text-[#718097]">
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
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
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
