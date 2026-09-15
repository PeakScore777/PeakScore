"use client";

import { Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Gratis",
    eyebrow: "PARA EMPEZAR",
    price: "$0",
    description:
      "Conoce PeakScore, practica y empieza a entender cómo estás preparando el Saber 11°.",
    features: [
      "Acceso a la plataforma",
      "Práctica con preguntas seleccionadas",
      "Simulacros de introducción",
      "Resultados y estadísticas esenciales",
      "Seguimiento básico de tu progreso",
    ],
    highlighted: false,
    button: "Empezar gratis",
  },
  {
    name: "Premium",
    eyebrow: "PREPARACIÓN COMPLETA",
    price: "$180.000",
    description:
      "La experiencia completa de PeakScore para entrenar, medir tu rendimiento y avanzar con estrategia.",
    features: [
      "Simulacros completos de las 5 áreas",
      "Banco de preguntas ampliado",
      "Estadísticas avanzadas por área",
      "Cuadernillos de preparación",
      "Seguimiento detallado del progreso",
      "Herramientas inteligentes de preparación",
    ],
    highlighted: true,
    button: "Elegir Premium",
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#f7f9fc] py-28"
    >
      {/* Fondo */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">

        {/* Encabezado */}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
          }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-blue-600">
            PLANES PEAKSCORE
          </p>

          <h2 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Elige cómo quieres{" "}
            <span className="text-blue-600">prepararte.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 md:text-base">
            Empieza con lo esencial y, cuando estés listo, lleva tu
            preparación al siguiente nivel.
          </p>
        </motion.div>

        {/* Planes */}

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.name}
              initial={{
                opacity: 0,
                y: 18,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.45,
                delay: index * 0.07,
                ease: "easeOut",
              }}
              className={`group relative overflow-hidden rounded-[28px] border p-8 transition-[transform,box-shadow,border-color] duration-150 ease-out ${
                plan.highlighted
                  ? "border-blue-500 bg-blue-600 text-white shadow-[0_24px_60px_rgba(37,99,235,0.20)] hover:-translate-y-[1px] hover:shadow-[0_28px_65px_rgba(37,99,235,0.26)]"
                  : "border-slate-200 bg-white text-slate-950 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              }`}
            >
              {/* Línea superior */}

              <div
                className={`absolute left-0 right-0 top-0 h-[3px] ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300"
                    : "bg-slate-200"
                }`}
              />

              {/* Indicador Premium */}

              {plan.highlighted && (
                <div className="absolute right-6 top-5">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-cyan-300/30 blur-md" />

                    <div className="relative flex items-center gap-2 rounded-full border border-white/30 bg-white px-3.5 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.14)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-700">
                        Más elegido
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cabecera */}

              <div className="pr-28">
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                    plan.highlighted
                      ? "text-blue-100"
                      : "text-blue-600"
                  }`}
                >
                  {plan.eyebrow}
                </p>

                <h3
                  className={`mt-3 text-3xl font-black tracking-tight ${
                    plan.highlighted
                      ? "text-white"
                      : "text-slate-950"
                  }`}
                >
                  {plan.name}
                </h3>
              </div>

              {/* Precio */}

              <div className="mt-9">
                <span
                  className={`text-5xl font-black tracking-[-0.045em] md:text-6xl ${
                    plan.highlighted
                      ? "text-white"
                      : "text-slate-950"
                  }`}
                >
                  {plan.price}
                </span>

                <p
                  className={`mt-2 text-xs ${
                    plan.highlighted
                      ? "text-blue-100"
                      : "text-slate-400"
                  }`}
                >
                  {plan.highlighted
                    ? "Acceso a la experiencia Premium"
                    : "Sin costo"}
                </p>
              </div>

              {/* Descripción */}

              <p
                className={`mt-7 min-h-[72px] max-w-md text-sm leading-6 ${
                  plan.highlighted
                    ? "text-blue-50"
                    : "text-slate-500"
                }`}
              >
                {plan.description}
              </p>

              {/* Separador */}

              <div
                className={`my-7 h-px ${
                  plan.highlighted
                    ? "bg-white/15"
                    : "bg-slate-100"
                }`}
              />

              {/* Beneficios */}

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        plan.highlighted
                          ? "bg-white/15"
                          : "bg-blue-50"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${
                          plan.highlighted
                            ? "text-white"
                            : "text-blue-600"
                        }`}
                        strokeWidth={2.5}
                      />
                    </span>

                    <span
                      className={`text-sm leading-5 ${
                        plan.highlighted
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón */}

              <button
                type="button"
                className={`mt-10 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.99] ${
                  plan.highlighted
                    ? "bg-white text-blue-600 shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:bg-blue-50 hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)]"
                    : "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] hover:bg-blue-700 hover:shadow-[0_10px_24px_rgba(37,99,235,0.24)]"
                }`}
              >
                {plan.button}

                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Pie */}

              <p
                className={`mt-4 text-center text-[9px] ${
                  plan.highlighted
                    ? "text-blue-100"
                    : "text-slate-400"
                }`}
              >
                {plan.highlighted
                  ? "Más herramientas. Más control. Más preparación."
                  : "Empieza a tu ritmo."}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Cierre */}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.4,
            delay: 0.2,
          }}
          className="mt-10 text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Preparación enfocada en Saber 11°
          </p>
        </motion.div>

      </div>
    </section>
  );
}