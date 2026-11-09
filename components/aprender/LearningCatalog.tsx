"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AudioLines, BookOpen, Clock3, GraduationCap, MessageCircle, Sparkles } from "lucide-react";

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
    description: "Explora materiales, reconoce sus propiedades y resuelve retos a partir de evidencia.",
    image: "/images/aprender/santuario/misterio-cristales.png",
    href: "/aprender/santuario-de-la-materia",
    duration: "10–15 min",
  },
  {
    title: "La Cuenca de los Ecos",
    area: "Biología · Ecología",
    description: "Descubre cómo se relacionan los seres vivos y cómo fluye la energía en un ecosistema.",
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
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ebe6df] bg-white transition hover:-translate-y-0.5 hover:border-[#e7c4ad] hover:shadow-[0_14px_36px_rgba(38,31,22,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d65a27]/30 motion-reduce:transform-none"
    >
      <div className="relative h-44 overflow-hidden bg-[#f2eee8]">
        <Image src={course.image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" />
        {course.video && (
          <video aria-hidden="true" autoPlay muted loop playsInline preload="metadata" poster={course.image} className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden">
            <source src={course.video} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[#988f84]">
          <span className="truncate">{course.area}</span>
          <span className="inline-flex shrink-0 items-center gap-1"><Clock3 className="h-3 w-3" /> {course.duration}</span>
        </div>
        <h3 className="mt-3 text-base font-semibold tracking-tight text-[#27231f]">{course.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-[#777168]">{course.description}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#bd5427]">Explorar ruta <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export default function LearningCatalog() {
  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#fffdfa] text-[#26231e]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-7 sm:pt-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#bd5427]">PeakScore · Aprender</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-[42px]">¿Qué quieres aprender hoy?</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777168]">Elige una experiencia. Cada espacio tiene un objetivo claro y te guía paso a paso, sin llenar la pantalla de opciones.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#eee8df] bg-white px-3 py-2 text-[11px] font-medium text-[#746d63]"><Sparkles className="h-3.5 w-3.5 text-[#c65a2c]" /> Tu espacio de estudio</div>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Experiencias de estudio">
          <Link href="/orby" className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[24px] border border-[#eadfd3] bg-[linear-gradient(135deg,#fff5ea_0%,#fffdfa_58%,#f8f0e7_100%)] p-6 transition hover:-translate-y-0.5 hover:border-[#dfb89e] hover:shadow-[0_15px_40px_rgba(46,34,22,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d65a27]/30 sm:p-7">
            <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border border-[#e9cbb7]/70 transition group-hover:scale-110" />
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eed8c7] bg-white/80 text-[#c75a2b]"><MessageCircle className="h-5 w-5" /></span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#b6532a]">Tutor de estudio · cinco áreas</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Una clase en vivo, contigo.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#716a60]">Habla con OmegaX, interrúmpela cuando tengas una duda y sigue la explicación en una pizarra que conserva el hilo de la clase.</p>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b84f25]">Abrir tutor de estudio <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>

          <Link href="/orby?view=english" className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[24px] border border-[#e9e3db] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#e3bda5] hover:shadow-[0_15px_40px_rgba(46,34,22,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d65a27]/30 sm:p-7">
            <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full bg-[#fff4e8] transition group-hover:scale-110" />
            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f0e0d2] bg-[#fff9f3] text-[#c75a2b]"><AudioLines className="h-5 w-5" /></span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#b6532a]">English Studio · A1–C2 + Saber 11</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">Habla. Recibe feedback. Repite.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#716a60]">Practica speaking y pronunciación con OmegaX, o prepara las siete partes de Inglés Saber 11 con ejercicios guiados.</p>
            </div>
            <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#b84f25]">Entrar a English Studio <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eee8df] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#a49b8e]">Aprendizaje interactivo</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Explora tus rutas</h2>
              <p className="mt-1 text-sm text-[#827b70]">Experiencias por tema para aprender haciendo.</p>
            </div>
            <span className="text-xs text-[#9a9287]">{courses.length} rutas disponibles</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => <CourseCard key={course.href} course={course} />)}
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8df] pt-4 text-[10px] text-[#9b9388]">
          <span>PEAKSCORE · APRENDE A TU RITMO, PREPÁRATE PARA SABER 11.</span>
          <Link href="/orby" className="font-semibold text-[#af4d26] hover:underline">Volver al espacio de estudio</Link>
        </footer>
      </div>
    </main>
  );
}
