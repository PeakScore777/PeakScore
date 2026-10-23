"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronRight,
  LockKeyhole,
} from "lucide-react";

type Lesson = {
  id: string;
  number?: string;
  title: string;
  available?: boolean;
  href?: string;
};

type Chapter = {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
  available?: boolean;
};

const chapters: Chapter[] = [
  {
    id: "01",
    title: "El misterio de los cristales",
    description: "Aprende a observar la materia, medir propiedades y justificar conclusiones con evidencia.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    available: true,
    lessons: [
      { id: "historia", number: "1", title: "Los cristales misteriosos", available: true, href: "/aprender/santuario-de-la-materia/leccion/1" },
      { id: "materia-intro", number: "2", title: "¿Qué es la materia?", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#materia-intro" },
      { id: "estados-materia", number: "3", title: "Estados de la materia", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#estados-materia" },
      { id: "propiedades-generales", number: "4", title: "Propiedades generales y cantidad de materia", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#propiedades-generales" },
      { id: "propiedades-especificas", number: "5", title: "Propiedades específicas y densidad", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#propiedades-especificas" },
      { id: "clasificacion-materia", number: "6", title: "Sustancias puras y mezclas", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#clasificacion-materia" },
      { id: "ejemplos", number: "7", title: "Ejemplos resueltos", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#ejemplos" },
      { id: "desafio", number: "8", title: "Desafío: el primer cristal", available: true, href: "/aprender/santuario-de-la-materia/leccion/1#desafio" },
    ],
  },
  {
    id: "02",
    title: "Cuando la materia cambia",
    description: "Explica los estados, los cambios físicos y la energía a partir del modelo de partículas.",
    image: "/images/aprender/santuario/cuando-la-materia-cambia.png",
    available: true,
    lessons: [
      { id: "modelos-particulas", number: "1", title: "El modelo de partículas", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#modelos-particulas" },
      { id: "estado-general", number: "2", title: "Estados de la materia", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#estado-general" },
      { id: "solidos", number: "3", title: "Sólidos: estructura y estabilidad", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#solidos" },
      { id: "liquidos", number: "4", title: "Líquidos: proximidad y movilidad", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#liquidos" },
      { id: "gases", number: "5", title: "Gases: movimiento y compresibilidad", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#gases" },
      { id: "comparacion-estados", number: "6", title: "Comparación de los tres estados", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#comparacion-estados" },
      { id: "energia-cambios", number: "7", title: "Temperatura, energía y cambios de estado", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#energia-cambios" },
      { id: "evidencia-cientifica", number: "8", title: "Del modelo a la evidencia", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#evidencia-cientifica" },
      { id: "ejemplos", number: "9", title: "Ejemplos resueltos", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#ejemplos" },
      { id: "desafio", number: "10", title: "Desafío: la energía de las transformaciones", available: true, href: "/aprender/santuario-de-la-materia/leccion/2#desafio" },
    ],
  },
  {
    id: "03",
    title: "El laboratorio de las mezclas",
    description: "Clasifica muestras, elige técnicas de separación y calcula concentración con datos.",
    image: "/images/aprender/santuario/laboratorio-mezclas.png",
    available: true,
    lessons: [
      { id: "sustancias-mezclas", number: "1", title: "Sustancias puras y mezclas", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#sustancias-mezclas" },
      { id: "tipos-mezcla", number: "2", title: "Mezclas homogéneas y heterogéneas", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#tipos-mezcla" },
      { id: "disoluciones", number: "3", title: "Disoluciones: soluto y disolvente", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#disoluciones" },
      { id: "metodos-separacion", number: "4", title: "Métodos de separación", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#metodos-separacion" },
      { id: "elegir-metodo", number: "5", title: "Secuencias para separar muestras", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#elegir-metodo" },
      { id: "concentracion", number: "6", title: "Concentración y solubilidad", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#concentracion" },
      { id: "evidencia", number: "7", title: "Del procedimiento a la evidencia", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#evidencia" },
      { id: "ejemplos", number: "8", title: "Ejemplos resueltos", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#ejemplos" },
      { id: "desafio", number: "9", title: "Desafío: separa la muestra", available: true, href: "/aprender/santuario-de-la-materia/leccion/3#desafio" },
    ],
  },
  {
    id: "04",
    title: "El código del átomo",
    description: "Relaciona la estructura atómica, la configuración electrónica y las propiedades periódicas.",
    image: "/images/aprender/santuario/codigo-atomo.png",
    available: true,
    lessons: [
      { id: "atomo-intro", number: "1", title: "¿Qué es un átomo?", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#atomo-intro" },
      { id: "modelos-atomicos", number: "2", title: "Modelos del átomo y evidencia", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#modelos-atomicos" },
      { id: "particulas-atomicas", number: "3", title: "Protones, neutrones y electrones", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#particulas-atomicas" },
      { id: "tamano-masa", number: "4", title: "Tamaño y masa del átomo", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#tamano-masa" },
      { id: "numero-isotopos-iones", number: "5", title: "Número atómico, isótopos e iones", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#numero-isotopos-iones" },
      { id: "configuracion-electronica", number: "6", title: "Configuración electrónica", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#configuracion-electronica" },
      { id: "valencia-periodicidad", number: "7", title: "Electrones de valencia y tendencias periódicas", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#valencia-periodicidad" },
      { id: "estrategia-icfes", number: "8", title: "Método para preguntas Saber 11", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#estrategia-icfes" },
      { id: "ejemplos", number: "9", title: "Ejemplos resueltos", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#ejemplos" },
      { id: "desafio", number: "10", title: "Desafío: las pistas de los elementos", available: true, href: "/aprender/santuario-de-la-materia/leccion/4#desafio" },
    ],
  },
  {
    id: "05",
    title: "El guardián de los elementos",
    description: "Comprende cómo se enlazan los átomos y cómo la estructura explica las propiedades.",
    image: "/images/aprender/santuario/guardian-elementos.png",
    available: true,
    lessons: [
      { id: "enlaces-quimicos", number: "1", title: "¿Por qué se unen los átomos?", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#enlaces-quimicos" },
      { id: "enlace-ionico", number: "2", title: "Enlace iónico: atracción entre iones", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#enlace-ionico" },
      { id: "enlace-covalente", number: "3", title: "Enlace covalente: compartir electrones", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#enlace-covalente" },
      { id: "enlace-metalico", number: "4", title: "Enlace metálico: electrones deslocalizados", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#enlace-metalico" },
      { id: "estructuras-lewis", number: "5", title: "Estructuras de Lewis y valencia", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#estructuras-lewis" },
      { id: "formulas-quimicas", number: "6", title: "Fórmulas químicas y neutralidad de carga", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#formulas-quimicas" },
      { id: "polaridad-propiedades", number: "7", title: "Polaridad, fuerzas y propiedades", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#polaridad-propiedades" },
      { id: "evidencia-enlaces", number: "8", title: "Del modelo a la evidencia", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#evidencia-enlaces" },
      { id: "ejemplos", number: "9", title: "Ejemplos resueltos", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#ejemplos" },
      { id: "puntos-clave", number: "10", title: "Puntos clave", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#puntos-clave" },
      { id: "desafio", number: "11", title: "Desafío: el juramento de los elementos", available: true, href: "/aprender/santuario-de-la-materia/leccion/5#desafio" },
    ],
  },
  {
    id: "06",
    title: "La forja de las reacciones",
    description: "Próxima aventura: ecuaciones químicas, conservación de la materia y transformaciones.",
    image: "/images/aprender/santuario/laboratorio-mezclas.png",
    available: false,
    lessons: [
      { id: "reacciones", number: "1", title: "Evidencias de una reacción química", available: false },
      { id: "conservacion", number: "2", title: "Conservación de la materia", available: false },
      { id: "ecuaciones", number: "3", title: "Leer ecuaciones químicas", available: false },
      { id: "balanceo", number: "4", title: "Balanceo de ecuaciones", available: false },
      { id: "tipos-reaccion", number: "5", title: "Tipos de reacción", available: false },
      { id: "energia-reaccion", number: "6", title: "Energía en las reacciones", available: false },
      { id: "calculos-reaccion", number: "7", title: "Relaciones cuantitativas básicas", available: false },
      { id: "evidencia-reaccion", number: "8", title: "Evidencia y desafío de reacción", available: false },
    ],
  },
  {
    id: "07",
    title: "El equilibrio del santuario",
    description: "Próxima aventura: ácidos, bases, pH, indicadores y neutralización.",
    image: "/images/aprender/santuario/codigo-atomo.png",
    available: false,
    lessons: [
      { id: "acidos-bases", number: "1", title: "Ácidos y bases", available: false },
      { id: "escala-ph", number: "2", title: "Escala de pH e interpretación", available: false },
      { id: "indicadores", number: "3", title: "Indicadores ácido-base", available: false },
      { id: "neutralizacion", number: "4", title: "Neutralización", available: false },
      { id: "concentracion-ph", number: "5", title: "Concentración y pH", available: false },
      { id: "variables-ph", number: "6", title: "Diseñar una prueba de laboratorio", available: false },
      { id: "aplicaciones-ph", number: "7", title: "Ácidos y bases en contextos reales", available: false },
      { id: "desafio-ph", number: "8", title: "Desafío: estabilizar la muestra", available: false },
    ],
  },
  {
    id: "08",
    title: "El desafío del Santuario",
    description: "Jefe final planificado: integra conceptos, gráficas, tablas y evidencia de toda la ruta.",
    image: "/images/aprender/santuario/guardian-elementos.png",
    available: false,
    lessons: [
      { id: "desafio-final", number: "1", title: "Desafío integrador de Ciencias Naturales", available: false },
    ],
  },
];
const totalLessons = chapters.filter((chapter) => chapter.available).reduce((sum, chapter) => sum + chapter.lessons.length, 0);

export default function SantuarioDeLaMateriaPage() {
  const [expanded, setExpanded] = useState<string[]>(["01"]);

  const toggle = (id: string) => {
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <main className="pixel-font min-h-[calc(100vh-72px)] overflow-hidden bg-[#050914] px-4 pb-16 pt-5 text-white sm:px-7 sm:pt-7">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/aprender"
          className="group inline-flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
          Volver a las rutas
        </Link>

        <section className="relative mt-3 overflow-hidden rounded-[22px] border border-cyan-100/10 bg-[#091322] shadow-[0_22px_70px_rgba(0,0,0,.28)]">
          <div className="absolute inset-0">
            <Image
              src="/images/aprender/santuario/santuario-encabezado.png"
              alt="Nova frente al portal del Santuario de la Materia"
              fill
              priority
              quality={100}
              sizes="(max-width: 768px) 100vw, 1440px"
              className="object-cover object-[center_52%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#06101ff5_0%,rgba(6,16,31,.96)_24%,rgba(6,16,31,.72)_47%,rgba(6,16,31,.16)_76%,rgba(6,16,31,.1)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101d] via-transparent to-black/10" />
          </div>

          <div className="relative grid min-h-[350px] items-end px-5 pb-8 pt-8 sm:min-h-[390px] sm:px-8 sm:pb-9 lg:min-h-[420px] lg:px-10">
            <div className="max-w-[610px]">
              <div className="inline-flex items-center gap-2 border-2 border-cyan-300/50 bg-[#07131f]/90 px-3 py-2 text-[9px] font-normal uppercase tracking-[.08em] text-cyan-200 [box-shadow:3px_3px_0_#12364a]">
                Ruta 01 <span className="text-white/30">·</span> Ciencias Naturales
              </div>
              <h1 className="mt-5 pixel-font text-[clamp(1.25rem,2.5vw,2.5rem)] font-normal leading-[1.55] tracking-normal">
                El Santuario
                <br />
                de la <span className="bg-gradient-to-r from-cyan-200 via-teal-300 to-emerald-300 bg-clip-text text-transparent">Materia</span>
              </h1>
              <p className="mt-4 max-w-[530px] text-[9px] leading-[2.2] text-slate-100/80 sm:text-[10px]">
                Nova ha encontrado unos cristales extraños dentro de un santuario antiguo. Observa sus propiedades, reúne evidencias y descubre qué nos cuenta la materia sobre el mundo.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="border border-cyan-200/35 bg-[#06101d]/90 px-3 py-2 text-[8px] leading-5 text-cyan-100 [box-shadow:3px_3px_0_#12364a]">{totalLessons} LECCIONES</span>
                <span className="border border-amber-200/35 bg-[#06101d]/90 px-3 py-2 text-[8px] leading-5 text-amber-100 [box-shadow:3px_3px_0_#493716]">EXP POR COMPLETAR</span>
              </div>
            </div>
            <span className="absolute right-5 top-5 border-2 border-emerald-300/50 bg-[#062b29]/95 px-3 py-2 text-[8px] font-normal uppercase tracking-normal text-emerald-200 [box-shadow:3px_3px_0_#12453c] sm:right-8 sm:top-7">
              Nivel básico
            </span>
          </div>

          <div className="relative border-t border-white/10 bg-[#07101eeF] px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-200">Progreso de la ruta</span>
                  <span className="font-bold tabular-nums text-white/90">0%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-300" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Tu avance aparecerá aquí a medida que completes las lecciones.</p>
              </div>
              <Link
                href="/aprender/santuario-de-la-materia/leccion/1"
                className="group inline-flex min-h-[54px] items-center justify-center gap-3 border-2 border-cyan-200 bg-[#0b2936] px-6 py-3 text-[9px] font-normal uppercase tracking-[.04em] text-cyan-100 [box-shadow:5px_5px_0_#03121d] transition-[transform,box-shadow,background-color] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#104153] hover:shadow-[3px_3px_0_#03121d] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                <span className="inline-block h-2.5 w-2.5 bg-cyan-200 [clip-path:polygon(0_0,100%_50%,0_100%)]" /> INICIAR RUTA
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-9 sm:mt-11">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-normal uppercase tracking-[.12em] text-violet-200">Tu recorrido</p>
              <h2 className="mt-2 text-[clamp(1rem,1.7vw,1.5rem)] font-normal leading-[1.8] tracking-normal">Capítulos y lecciones</h2>
              <p className="mt-2 max-w-3xl text-[9px] leading-[2.1] text-slate-300/75">Avanza paso a paso: primero observa, luego comprende y finalmente demuestra lo que aprendiste con retos de razonamiento tipo ICFES.</p>
            </div>
          </div>

          <div className="space-y-3">
            {chapters.filter((chapter) => chapter.available).map((chapter) => {
              const isOpen = expanded.includes(chapter.id);
              const isAvailable = Boolean(chapter.available);
              return (
                <section key={chapter.id} className="overflow-hidden rounded-[17px] border border-[#23334a] bg-[linear-gradient(115deg,rgba(12,25,43,.96),rgba(7,15,28,.98))] shadow-[0_8px_25px_rgba(0,0,0,.12)] transition-colors hover:border-[#31465f]">
                  <button
                    type="button"
                    onClick={() => toggle(chapter.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[.025] sm:gap-4 sm:px-5 sm:py-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-violet-400/15 text-sm font-black text-white shadow-inner sm:h-11 sm:w-11">{chapter.id}</span>
                    <span className="min-w-0 flex-1 py-1">
                      <span className="block text-sm font-extrabold leading-5 text-white sm:text-base">{chapter.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-300/80">{chapter.description}</span>
                    </span>
                    <span className="hidden shrink-0 sm:inline-flex">
                      {isAvailable ? (
                        <span className="rounded-lg border border-emerald-300/30 bg-emerald-300/[.08] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-200">Disponible</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.025] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Bloqueado</span>
                      )}
                    </span>
                    {isOpen ? <ChevronDown className="h-5 w-5 shrink-0 text-violet-200" /> : <ChevronRight className="h-5 w-5 shrink-0 text-violet-200" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/[.07] bg-[#050b15]/45 p-2 sm:p-3">
                      <div className="grid gap-3">
                        <div className="min-w-0 overflow-hidden rounded-xl border border-white/[.07]">
                          {chapter.lessons.map((lesson, lessonIndex) => {
                            const available = Boolean(lesson.available);
                            const row = (
                              <div className={`group flex min-h-[51px] items-center gap-3 px-3 py-2.5 transition sm:px-4 ${available ? "hover:bg-cyan-200/[.045]" : "opacity-60"}`}>
                                {!available && <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" aria-label="Bloqueado" />}
                                <span className="min-w-0 flex-1 text-sm">
                                  <span className={`block leading-5 ${available ? "font-bold text-white" : "font-medium text-slate-300"}`}>{lesson.number ?? lessonIndex + 1}. {lesson.title}</span>
                                </span>
                              </div>
                            );
                            // Las secciones del capítulo 1 forman parte de una única lección integrada.
                            // Hasta que tengan páginas independientes, todas abren la teoría existente.
                            return available ? (
                              <Link key={lesson.id} href={lesson.href ?? `/aprender/santuario-de-la-materia/leccion/${lesson.id}`} className="block border-b border-white/[.06] last:border-b-0">{row}</Link>
                            ) : (
                              <div key={lesson.id} aria-disabled="true" className="border-b border-white/[.06] last:border-b-0">{row}</div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </section>

        <div className="mt-6 border border-violet-300/25 bg-[#090d1b] p-4 text-[8px] leading-[2.2] text-slate-300/75 [box-shadow:4px_4px_0_#17152e]">
          <p>La ruta combina observación, explicación de fenómenos e investigación científica. Los capítulos se desbloquearán a medida que construyamos sus lecciones y retos originales de preparación para el ICFES.</p>
        </div>
      </div>
    </main>
  );
}
