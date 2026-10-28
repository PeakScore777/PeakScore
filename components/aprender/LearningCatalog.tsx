"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

type Tab = "routes" | "courses";

type CatalogItem = {
  id: string;
  title: string;
  area: string;
  description: string;
  image: string;
  href: string;
  badge: string;
  duration: string;
  level: string;
  locked?: boolean;
};

type LearningCatalogProps = {
  firstName: string;
  seasonName: string;
  seasonXp: number;
  coins: number;
  rankName: string;
};

const routes: CatalogItem[] = [
  {
    id: "materia",
    title: "El Santuario de la Materia",
    area: "Ciencias Naturales",
    description: "Observa los materiales, comprende sus propiedades y resuelve misterios usando evidencia.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    href: "/aprender/santuario-de-la-materia",
    badge: "CIENCIAS NATURALES",
    duration: "10–15 MIN",
    level: "INICIAL",
  },
  {
    id: "ecos",
    title: "La Cuenca de los Ecos",
    area: "Biología · Ecología",
    description: "Investiga el silencio del bosque y descubre cómo se conectan los seres vivos con su entorno.",
    image: "/images/aprender/cuenca-de-los-ecos/header.svg",
    href: "/aprender/la-cuenca-de-los-ecos",
    badge: "BIOLOGÍA",
    duration: "10–15 MIN",
    level: "INICIAL",
  },
  {
    id: "simulacros",
    title: "Simulacros Saber 11",
    area: "Práctica por competencias",
    description: "Entrena con preguntas, revisa resultados y reconoce qué temas necesitas reforzar.",
    image: "/images/games/covers/02-ciencias-naturales.png",
    href: "/simulacros",
    badge: "PRACTICA",
    duration: "A TU RITMO",
    level: "TODOS LOS NIVELES",
  },
  {
    id: "juegos",
    title: "Juegos de aprendizaje",
    area: "Retos y razonamiento",
    description: "Pon a prueba tus conocimientos con desafíos interactivos y actividades gamificadas.",
    image: "/images/games/backgrounds/games-arcade-bg.png",
    href: "/aprender/juegos",
    badge: "MINIJUEGOS",
    duration: "5–10 MIN",
    level: "TODOS LOS NIVELES",
  },
];

const subjects: CatalogItem[] = [
  {
    id: "matematicas",
    title: "Matemáticas",
    area: "Interpretación y resolución de problemas",
    description: "Practica razonamiento cuantitativo, patrones, gráficas y solución de situaciones.",
    image: "/images/games/covers/01-matematicas.png",
    href: "/simulacros/nuevo",
    badge: "ÁREA ICFES",
    duration: "PREGUNTAS TIPO SABER 11",
    level: "PRÁCTICA",
  },
  {
    id: "naturales",
    title: "Ciencias Naturales",
    area: "Biología · Física · Química",
    description: "Explica fenómenos, interpreta evidencias y relaciona los conceptos científicos.",
    image: "/images/games/covers/02-ciencias-naturales.png",
    href: "/simulacros/nuevo",
    badge: "ÁREA ICFES",
    duration: "PREGUNTAS TIPO SABER 11",
    level: "2 RUTAS INTERACTIVAS",
  },
  {
    id: "lectura",
    title: "Lectura Crítica",
    area: "Comprensión y argumentación",
    description: "Analiza textos, identifica ideas principales y evalúa argumentos e inferencias.",
    image: "/images/games/covers/03-lectura-critica.png",
    href: "/simulacros/nuevo",
    badge: "ÁREA ICFES",
    duration: "PREGUNTAS TIPO SABER 11",
    level: "PRÁCTICA",
  },
  {
    id: "sociales",
    title: "Sociales y Ciudadanas",
    area: "Contextos sociales e históricos",
    description: "Interpreta fuentes, compara perspectivas y analiza situaciones ciudadanas.",
    image: "/images/games/covers/04-sociales-ciudadanas.png",
    href: "/simulacros/nuevo",
    badge: "ÁREA ICFES",
    duration: "PREGUNTAS TIPO SABER 11",
    level: "PRÁCTICA",
  },
  {
    id: "ingles",
    title: "Inglés",
    area: "Comprensión de lectura y uso de la lengua",
    description: "Fortalece tu lectura en inglés y practica con ejercicios por partes.",
    image: "/images/games/covers/05-ingles.png",
    href: "/simulacros/nuevo",
    badge: "ÁREA ICFES",
    duration: "PREGUNTAS TIPO SABER 11",
    level: "PRÁCTICA",
  },
];

function rankImageFor(rankName: string) {
  const normalized = rankName
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  const valid = [
    "renacer", "aprendiz", "explorador", "competidor", "avanzado",
    "elite", "maestro", "granmaestro", "leyenda", "peak",
  ];
  return valid.includes(normalized)
    ? "/images/ranks/" + normalized + ".webp"
    : "/images/ranks/aprendiz.webp";
}

function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      href={item.href}
      className="catalog-card group block w-[252px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/[.09] bg-[#0d1321] transition duration-200 hover:-translate-y-1 hover:border-cyan-200/40 hover:shadow-[0_14px_30px_rgba(0,0,0,.28)] sm:w-[260px]"
    >
      <div className="catalog-card-image relative h-[144px] overflow-hidden bg-[#111b2a] sm:h-[151px]">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="260px"
          className="object-cover transition duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08101d]/90 via-[#08101d]/10 to-black/10" />
        <span className="pixel-font absolute left-3 top-3 border border-cyan-100/20 bg-[#06111ee8] px-2 py-1.5 text-[7px] text-cyan-100">
          {item.badge}
        </span>
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 transition group-hover:border-cyan-100/50 group-hover:bg-cyan-300/15">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
      <div className="catalog-card-body p-4">
        <div className="flex items-center justify-between gap-2 text-[9px] uppercase tracking-[.14em] text-cyan-100/65">
          <span className="truncate">{item.area}</span>
          <span className="flex shrink-0 items-center gap-1 text-white/45"><Clock3 className="h-3 w-3" /> {item.duration}</span>
        </div>
        <h3 className="mt-3 min-h-[42px] text-sm font-extrabold leading-5 text-white">{item.title}</h3>
        <p className="mt-2 min-h-[58px] text-xs leading-[1.65] text-slate-300/75">{item.description}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/10 bg-emerald-300/[.08] px-2.5 py-1.5 text-[9px] font-extrabold tracking-wide text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {item.level}
          </span>
          <span className="text-[10px] font-bold text-cyan-100/70 transition group-hover:text-cyan-100">Explorar</span>
        </div>
      </div>
    </Link>
  );
}

function CourseRail({
  title,
  subtitle,
  items,
  id,
}: {
  title: string;
  subtitle: string;
  items: CatalogItem[];
  id: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const move = (direction: number) => {
    railRef.current?.scrollBy({ left: direction * 540, behavior: "smooth" });
  };

  return (
    <section className="mt-8 min-w-0">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="pixel-font text-[10px] leading-[2] text-[#f4f1df] sm:text-[11px]">{title}</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[10px] text-slate-500 sm:inline">{items.length} {items.length === 1 ? "curso" : "opciones"}</span>
          <button type="button" aria-label={"Desplazar " + title + " a la izquierda"} onClick={() => move(-1)} className="catalog-arrow"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label={"Desplazar " + title + " a la derecha"} onClick={() => move(1)} className="catalog-arrow"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div id={id} ref={railRef} className="catalog-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pr-1">
        {items.map((item) => <CatalogCard item={item} key={item.id} />)}
      </div>
    </section>
  );
}

export default function LearningCatalog({
  firstName,
  seasonName,
  seasonXp,
  coins,
  rankName,
}: LearningCatalogProps) {
  const [tab, setTab] = useState<Tab>("routes");

  return (
    <main className="learning-catalog min-h-[calc(100vh-72px)] overflow-hidden bg-[#090d17] text-white">
      <div className="catalog-shell relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-14 pt-6 sm:px-7 sm:pt-8">
        <header className="border-b border-white/[.08] pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="pixel-font text-[20px] leading-[1.65] text-[#f4f1df] sm:text-[25px]">Cursos</h1>
              <p className="mt-1 text-xs leading-5 text-slate-300/75">
                {tab === "routes" ? "4 opciones de aprendizaje" : "5 áreas de evaluación"}
              </p>
            </div>
            <div className="catalog-tabs" role="tablist" aria-label="Tipo de catálogo">
              <button type="button" role="tab" aria-selected={tab === "routes"} onClick={() => setTab("routes")} className={"catalog-tab " + (tab === "routes" ? "catalog-tab-active" : "")}>Rutas</button>
              <button type="button" role="tab" aria-selected={tab === "courses"} onClick={() => setTab("courses")} className={"catalog-tab " + (tab === "courses" ? "catalog-tab-active" : "")}>Cursos</button>
            </div>
          </div>
          <div className="catalog-account-line mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500">
            <span>Hola, {firstName}</span>
            <span>{seasonName}</span>
            <span>XP temporada <strong className="ml-1 tabular-nums text-slate-300">{seasonXp.toLocaleString("es-CO")}</strong></span>
            <span className="inline-flex items-center gap-1.5"><Image src="/images/currency/peakcoin.webp" alt="PeakCoin" width={17} height={17} className="h-[17px] w-[17px] object-contain" /> <strong className="tabular-nums text-amber-100">{coins.toLocaleString("es-CO")}</strong></span>
            <span className="inline-flex items-center gap-1.5"><Image src={rankImageFor(rankName)} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" /> <strong className="text-slate-300">{rankName.toLocaleUpperCase("es-CO")}</strong></span>
          </div>
        </header>

        {tab === "routes" ? (
          <>
            <section className="catalog-intro mt-5">
              <h2 className="pixel-font text-[11px] leading-[2] text-[#f4f1df] sm:text-[13px]">Si no sabes por dónde empezar, este es tu camino</h2>
              <p className="mt-2 text-xs leading-6 text-slate-400">Empieza con una ruta interactiva, practica con simulacros y refuerza las áreas de Saber 11 que necesites.</p>
            </section>

            <CourseRail
              id="featured-routes"
              title="Rutas y práctica"
              subtitle="Las experiencias disponibles para empezar a prepararte."
              items={routes}
            />

            <CourseRail
              id="exam-areas"
              title="Áreas del ICFES"
              subtitle="Escoge el componente que quieres practicar para el Saber 11."
              items={subjects}
            />

            <section className="mt-7 flex flex-col gap-3 border-t border-white/[.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] leading-5 text-slate-500">Los cursos interactivos disponibles se amplían a medida que se publican nuevos capítulos.</p>
              <Link href="/simulacros" className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyan-100/25 bg-cyan-300/[.07] px-4 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/[.13]">
                Ver simulacros Saber 11 <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </>
        ) : (
          <>
            <section className="catalog-course-intro mt-5 flex flex-col gap-3 rounded-xl border border-white/[.08] bg-[#0d1422] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="pixel-font text-[8px] leading-5 text-emerald-200">CATÁLOGO DE APRENDIZAJE</p>
                <h2 className="mt-2 text-base font-extrabold text-white">Elige qué quieres reforzar</h2>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300/75">Entra a una ruta interactiva disponible o crea un simulacro en el área que necesitas practicar.</p>
              </div>
              <Link href="/simulacros/nuevo" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-emerald-200/25 bg-emerald-300/[.08] px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/[.14]">
                Crear simulacro <ArrowRight className="h-4 w-4" />
              </Link>
            </section>

            <CourseRail
              id="interactive-courses"
              title="Cursos interactivos"
              subtitle="Lecciones con historia, teoría, ejemplos y desafíos."
              items={routes.filter((item) => item.id === "materia" || item.id === "ecos")}
            />

            <CourseRail
              id="practice-courses"
              title="Practica por área"
              subtitle="Cinco componentes de evaluación para organizar tu preparación."
              items={subjects}
            />

            <CourseRail
              id="extra-practice"
              title="Practica de otra manera"
              subtitle="Mide lo que sabes con simulacros y desafíos gamificados."
              items={routes.filter((item) => item.id === "simulacros" || item.id === "juegos")}
            />
          </>
        )}

        <footer className="mt-9 flex flex-col gap-3 border-t border-white/[.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] leading-5 text-slate-500">PEAKSCORE · APRENDE A TU RITMO, PREPÁRATE CON EVIDENCIA.</p>
          <Link href="/aprender/juegos" className="inline-flex items-center gap-2 text-[10px] font-bold text-cyan-100/75 transition hover:text-cyan-100">
            Explorar juegos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>

      <style jsx global>{`
        .learning-catalog { position: relative; isolation: isolate; }
        .learning-catalog .pixel-font { font-family: var(--font-press-start), "Press Start 2P", monospace; }
        .catalog-tabs { display: inline-flex; align-self: flex-start; flex-shrink: 0; gap: 4px; border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 4px; background: rgba(7,13,24,.88); }
        .catalog-tab {
          display: inline-flex; min-height: 34px; align-items: center; justify-content: center; gap: 7px;
          border: 1px solid transparent; border-radius: 999px; padding: 0 15px; color: #9aa8c4;
          font-size: 11px; font-weight: 750; transition: background .16s ease, color .16s ease, border-color .16s ease;
        }
        .catalog-tab-active { border-color: rgba(81,219,232,.65); background: rgba(43,193,211,.13); color: #65e4ef; }
        .catalog-arrow {
          display: inline-flex; height: 32px; width: 32px; align-items: center; justify-content: center; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.13); border-radius: 50%; background: #111827; color: #e7edf5;
          transition: border-color .16s ease, background .16s ease;
        }
        .catalog-arrow:hover { border-color: rgba(91,222,235,.6); background: #172335; }
        .catalog-rail { scrollbar-width: thin; scrollbar-color: rgba(164,183,208,.48) rgba(255,255,255,.04); overscroll-behavior-x: contain; }
        .catalog-card { min-height: 326px; }
        .catalog-card-image img { image-rendering: auto; }
        @media (max-width: 640px) {
          .catalog-shell { padding-top: 17px; }
          .catalog-tab { padding: 0 12px; }
          .catalog-account-line { gap: 8px 12px; }
          .catalog-card { min-height: 320px; }
          .catalog-card-image { height: 130px; }
          .catalog-card-body { padding: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .catalog-card, .catalog-card *, .catalog-arrow, .catalog-tab { transition: none !important; }
          .catalog-card:hover { transform: none; }
        }
      `}</style>
    </main>
  );
}
