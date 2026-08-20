"use client";

import Image from "next/image";
import { Trophy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-100">
      {/* Fondo decorativo */}
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"></div>

      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-200/20 blur-3xl"></div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row">

        {/* Texto */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            <Trophy className="h-4 w-4" />
            Alcanza tu mejor puntaje
          </div>

          <h1 className="text-5xl font-extrabold leading-tight text-gray-900 lg:text-7xl">
            Prepárate para obtener un
            <span className="text-blue-600"> 500/500 </span>
            en el ICFES.
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-8 text-gray-600">
            Simulacros tipo ICFES, banco de preguntas, cuadernillos,
            estadísticas inteligentes y seguimiento de tu progreso
            en una sola plataforma.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40">
              Empieza gratis
            </button>

            <button className="rounded-xl border border-gray-300 bg-white px-8 py-4 font-semibold shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-gray-100 hover:shadow-lg">
              Ver planes
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Simulacros tipo ICFES
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Banco de preguntas
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Cuadernillos organizados
            </div>
          </div>
        </motion.div>

        {/* Imagen */}
        <motion.div
          className="relative flex h-[700px] flex-1 items-center justify-center"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Halo azul */}
          <div className="absolute h-[520px] w-[520px] rounded-full bg-blue-500/15 blur-3xl"></div>

          {/* Tarjeta: Objetivo */}
          <div className="absolute left-12 top-36 z-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <p className="text-sm font-medium text-gray-500">
              🎯 Tu objetivo
            </p>

            <h3 className="mt-2 text-5xl font-bold text-blue-600">
              500
              <span className="text-2xl text-gray-400"> /500</span>
            </h3>
          </div>

          {/* Tarjeta: Racha */}
          <div className="absolute right-0 top-40 z-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <p className="text-sm text-gray-500">
              🔥 Racha
            </p>

            <h3 className="mt-1 text-2xl font-bold text-orange-500">
              120 días
            </h3>

            <p className="text-xs text-gray-400">
              ¡Sigue estudiando!
            </p>
          </div>

          {/* Tarjeta: Progreso */}
          <div className="absolute -right-6 bottom-28 z-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <p className="text-sm text-gray-500">
              📈 Tu progreso
            </p>

            <h3 className="mt-1 text-2xl font-bold text-blue-600">
              78%
            </h3>

            <p className="text-xs text-gray-400">
              Vas por buen camino
            </p>
          </div>

          {/* Tarjeta: Contenido */}
          <div className="absolute left-16 bottom-28 z-20 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl">
            <p className="text-sm text-gray-500">
              📚 Contenido
            </p>

            <h3 className="mt-1 text-2xl font-bold text-green-600">
              Actualizado
            </h3>

            <p className="text-xs text-gray-400">
              Nuevos recursos constantemente
            </p>
          </div>

          <Image
            src="/images/hero/student-v2.png"
            alt="Estudiante preparando el ICFES"
            width={820}
            height={820}
            priority
            className="relative z-10 mt-16"
          />
        </motion.div>
      </div>
    </section>
  );
}