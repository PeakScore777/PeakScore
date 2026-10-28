"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock3 } from "lucide-react";

type Tab = "routes" | "courses";

type Level = {
  id: "materia" | "ecos";
  title: string;
  area: string;
  description: string;
  image: string;
  href: string;
  duration: string;
};

type LearningCatalogProps = {
  firstName: string;
  seasonName: string;
  seasonXp: number;
  coins: number;
  rankName: string;
};

const levels: Level[] = [
  {
    id: "materia",
    title: "El Santuario de la Materia",
    area: "Ciencias Naturales",
    description: "Observa los materiales, comprende sus propiedades y resuelve misterios usando evidencia.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    href: "/aprender/santuario-de-la-materia",
    duration: "10–15 MIN",
  },
  {
    id: "ecos",
    title: "La Cuenca de los Ecos",
    area: "Biología · Ecología",
    description: "Investiga el silencio del bosque y descubre cómo se conectan los seres vivos con su entorno.",
    image: "/images/aprender/cuenca-de-los-ecos/header.svg",
    href: "/aprender/la-cuenca-de-los-ecos",
    duration: "10–15 MIN",
  },
];

function LevelCard({ level, number }: { level: Level; number: number }) {
  return (
    <Link
      href={level.href}
      className="group relative block w-[300px] max-w-full shrink-0 snap-start overflow-visible rounded-xl border border-[#252d40] bg-[#0b1020] transition duration-200 hover:-translate-y-1 hover:border-[#39445d] max-sm:w-full"
    >
      <div className="relative h-[174px] overflow-hidden rounded-t-xl bg-[#111827]">
        <Image
          src={level.image}
          alt=""
          fill
          sizes="300px"
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d18]/35 via-transparent to-transparent" />
      </div>
      <span className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#ffd05b] text-[12px] font-extrabold text-[#17130a] shadow-sm">
        {number}
      </span>
      <div className="p-4 max-sm:p-[13px]">
        <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[.13em] text-[#8394b2]">
          <span className="truncate">{level.area}</span>
          <span className="flex shrink-0 items-center gap-1.5 tracking-[.08em]">
            <Clock3 className="h-3 w-3" />
            {level.duration}
          </span>
        </div>
        <h3 className="mt-3 min-h-[42px] text-[14px] font-extrabold leading-5 text-white">
          {level.title}
        </h3>
        <p className="mt-2 min-h-[58px] text-[12px] leading-[1.65] text-[#abb3c3]">
          {level.description}
        </p>
        <div className="mt-3">
          <span className="inline-flex min-h-7 items-center gap-2 rounded-full border border-[#1f2c4e] bg-[#182344] px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#74ed66]">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-1 rounded-[1px] bg-[#74ed66]" />
              <span className="h-2 w-1 rounded-[1px] bg-[#74ed66] opacity-70" />
            </span>
            INICIAL
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function LearningCatalog(_props: LearningCatalogProps) {
  const [tab, setTab] = useState<Tab>("routes");
  const isRoutes = tab === "routes";

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-[#0e111a] text-white">
      <div className="mx-auto w-full max-w-[1072px] px-4 pb-14 pt-9 sm:px-7 sm:pt-11">
        <header className="flex items-start justify-between gap-5">
          <div>
            <h1 className="pixel-font text-[22px] leading-[1.8] text-[#f5f1e8] sm:text-[27px]">
              Niveles
            </h1>
            <p className="mt-1 text-[13px] text-[#aab2c2]">
              {isRoutes ? "2 niveles disponibles" : "2 cursos disponibles"}
            </p>
          </div>
          <div className="mt-1 inline-flex shrink-0 gap-1 rounded-full border border-[#272d3a] bg-transparent p-1" role="tablist" aria-label="Catálogo de aprendizaje">
            <button
              type="button"
              role="tab"
              aria-selected={isRoutes}
              onClick={() => setTab("routes")}
              className={"min-h-[34px] rounded-full border px-4 text-xs transition " + (isRoutes ? "border-[#29c3d5] bg-[#26bdcf]/[.12] font-extrabold text-[#55ddeb]" : "border-transparent font-semibold text-[#9ba5ba] hover:text-white")}
            >
              Rutas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isRoutes}
              onClick={() => setTab("courses")}
              className={"min-h-[34px] rounded-full border px-4 text-xs transition " + (!isRoutes ? "border-[#29c3d5] bg-[#26bdcf]/[.12] font-extrabold text-[#55ddeb]" : "border-transparent font-semibold text-[#9ba5ba] hover:text-white")}
            >
              Cursos
            </button>
          </div>
        </header>

        <section className="mt-8 sm:mt-9" aria-live="polite">
          <h2 className="pixel-font max-w-4xl text-[11px] leading-[2.1] text-[#f5f1e8] sm:text-[13px]">
            {isRoutes ? "Tu camino hacia Saber 11 empieza aquí" : "Cursos interactivos disponibles"}
          </h2>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[#aab2c2]">
            {isRoutes
              ? "Avanza por los niveles disponibles, aprende los conceptos y resuelve desafíos con enfoque ICFES."
              : "Explora las dos experiencias de aprendizaje que ya están disponibles en PeakScore."}
          </p>

          <div className="mt-8 flex flex-wrap items-start gap-4">
            {levels.map((level, index) => (
              <LevelCard key={level.id} level={level} number={index + 1} />
            ))}
          </div>
        </section>

        <footer className="mt-8 border-t border-white/[.08] pt-4">
          <p className="text-[10px] leading-5 text-[#748098]">
            PEAKSCORE · APRENDE A TU RITMO, PREPÁRATE PARA SABER 11.
          </p>
        </footer>
      </div>
    </main>
  );
}
