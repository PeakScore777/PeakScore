"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Clock3,
  MessageCircle,
} from "lucide-react";

type Course = {
  title: string;
  area: string;
  description: string;
  image: string;
  video?: string;
  href: string;
  duration: string;
};

const courses: Course[] = [
  {
    title: "El Santuario de la Materia",
    area: "Ciencias Naturales",
    description:
      "Explora materiales, reconoce sus propiedades y resuelve retos a partir de evidencia.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    href: "/aprender/santuario-de-la-materia",
    duration: "10–15 min",
  },
  {
    title: "La Cuenca de los Ecos",
    area: "Biología · Ecología",
    description:
      "Descubre cómo se relacionan los seres vivos y cómo fluye la energía en un ecosistema.",
    image: "/images/aprender/cuenca-de-los-ecos/header.svg",
    video: "/video/aprender/cuenca-de-los-ecos.mp4",
    href: "/aprender/la-cuenca-de-los-ecos",
    duration: "10–15 min",
  },
];

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={course.href}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#dfe8df] bg-white shadow-[0_4px_0_#e6eee6] transition duration-200 hover:-translate-y-1 hover:shadow-[0_7px_0_#d7e8d8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#58cc02]/25 motion-reduce:transform-none"
    >
      <div className="relative h-44 overflow-hidden bg-[#e9f6e8] sm:h-48">
        <Image
          src={course.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 group-hover:scale-[1.035] motion-reduce:transform-none"
        />
        {course.video && (
          <video
            aria-hidden="true"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={course.image}
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          >
            <source src={course.video} type="video/mp4" />
          </video>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-[#376b31] shadow-sm">
          {course.area}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#777f77]">
          <Clock3 className="h-3.5 w-3.5" />
          {course.duration}
        </div>
        <h3 className="mt-2 text-lg font-extrabold tracking-tight text-[#263329]">
          {course.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-[#627064]">
          {course.description}
        </p>
        <span className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#e6f8dd] px-4 text-xs font-extrabold text-[#35752a] transition group-hover:bg-[#d8f3cb]">
          Explorar ruta
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export default function LearningCatalog() {
  return (
    <main className="min-h-[calc(100dvh-72px)] overflow-x-clip bg-[#f7fbf5] text-[#263329]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-7 sm:px-7 sm:pt-10 lg:px-8">
        <header className="relative overflow-hidden rounded-[28px] border border-[#dcebd8] bg-[#e8f8df] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[26px] border-white/35 sm:-right-4 sm:-top-28 sm:h-80 sm:w-80" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-[-5rem] right-[20%] h-40 w-40 rounded-full bg-[#c5edb7]/55 blur-2xl" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cde7c2] bg-white/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#3c7c31]">
              <BookOpen className="h-3.5 w-3.5" />
              PeakScore · aprende haciendo
            </div>
            <h1 className="mt-4 text-[2rem] font-black leading-[1.08] tracking-[-.045em] text-[#23452b] sm:text-[2.7rem] lg:text-5xl">
              ¿Qué quieres aprender hoy?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4d6d50] sm:text-base sm:leading-7">
              Escoge cómo quieres estudiar. Puedes tomar una clase con OmegaX,
              practicar inglés o explorar una ruta interactiva.
            </p>
          </div>
        </header>

        <section className="mt-7" aria-labelledby="study-options-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#68816a]">
                Empieza por aquí
              </p>
              <h2 id="study-options-title" className="mt-1 text-xl font-black tracking-tight text-[#263329] sm:text-2xl">
                Tu forma de estudiar
              </h2>
            </div>
            <p className="text-[11px] font-medium text-[#718174]">Dos espacios, objetivos distintos</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Link
              href="/orby"
              className="group relative flex min-h-[250px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border border-[#b8e4c3] bg-[#dff6e6] p-5 shadow-[0_5px_0_#c9ead2] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#b9e3c5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#38a95a]/25 sm:p-7"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-9 -top-10 h-48 w-48 rounded-full bg-[#b9e9c7]/75 transition duration-300 group-hover:scale-110 sm:h-56 sm:w-56" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/80 bg-white text-[#21934b] shadow-sm">
                    <MessageCircle className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-[#c2edce] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#26733d]">
                    Tutor general · Saber 11
                  </span>
                </div>
                <h3 className="mt-5 max-w-lg text-[1.55rem] font-black leading-tight tracking-[-.035em] text-[#1f5833] sm:text-3xl">
                  Entiende los temas, no te quedes memorizando.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#416b4c]">
                  Escribe qué necesitas aprender y toma una clase paso a paso.
                  Pregunta, interrumpe y revisa la explicación en la pizarra.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/70 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold text-[#39734a]">Clase conversacional</span>
                  <span className="rounded-lg border border-white/70 bg-white/70 px-2.5 py-1.5 text-[10px] font-bold text-[#39734a]">Pizarra y apuntes</span>
                </div>
              </div>
              <span className="relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#249b50] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#18763b] transition group-hover:bg-[#1d8c46]">
                Abrir tutor OmegaX
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/orby?view=english"
              className="group relative flex min-h-[250px] min-w-0 flex-col justify-between overflow-hidden rounded-[24px] border border-[#b8dff4] bg-[#e1f3ff] p-5 shadow-[0_5px_0_#cbe8f7] transition duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#b8dcf1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1cb0f6]/25 sm:p-7"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-[#c8eaff]/90 transition duration-300 group-hover:scale-110 sm:h-60 sm:w-60" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/90 bg-white text-[#138ac6] shadow-sm">
                    <AudioLines className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-[#c8eaff] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#176f9f]">
                    Inglés · MCER + Saber 11
                  </span>
                </div>
                <h3 className="mt-5 max-w-lg text-[1.55rem] font-black leading-tight tracking-[-.035em] text-[#174e70] sm:text-3xl">
                  Habla, escucha, lee y escribe en inglés.
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#466c83]">
                  Practica las cinco destrezas con ejercicios guiados, feedback
                  y oportunidades para volver a intentarlo.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/80 bg-white/75 px-2.5 py-1.5 text-[10px] font-bold text-[#286e95]">Speaking y pronunciación</span>
                  <span className="rounded-lg border border-white/80 bg-white/75 px-2.5 py-1.5 text-[10px] font-bold text-[#286e95]">Ruta Saber 11</span>
                </div>
              </div>
              <span className="relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#1598d0] px-5 text-sm font-extrabold text-white shadow-[0_3px_0_#0e70a0] transition group-hover:bg-[#087fb7]">
                Entrar a English Studio
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-11" aria-labelledby="routes-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#68816a]">
                Explora y aprende
              </p>
              <h2 id="routes-title" className="mt-1 text-xl font-black tracking-tight text-[#263329] sm:text-2xl">
                Rutas interactivas
              </h2>
              <p className="mt-1 text-sm text-[#718174]">
                Lecciones con contenido, ejemplos y retos para practicar.
              </p>
            </div>
            <span className="rounded-full border border-[#dce8dc] bg-white px-3 py-1.5 text-[11px] font-bold text-[#607364]">
              {courses.length} rutas disponibles
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => <CourseCard key={course.href} course={course} />)}
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e0eadf] pt-4 text-[10px] font-semibold text-[#819183]">
          <span>PEAKSCORE · CADA TEMA SE PUEDE APRENDER PASO A PASO.</span>
          <Link href="/orby" className="text-[#267d46] transition hover:text-[#155d31] hover:underline">
            Volver al tutor OmegaX
          </Link>
        </footer>
      </div>
    </main>
  );
}
