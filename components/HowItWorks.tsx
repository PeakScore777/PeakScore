import {
  ClipboardList,
  PenTool,
  BarChart3,
  Trophy,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Elige un simulacro",
    description:
      "Selecciona el examen que deseas presentar según tu nivel.",
  },
  {
    icon: PenTool,
    title: "Responde las preguntas",
    description:
      "Practica con preguntas similares al examen oficial.",
  },
  {
    icon: BarChart3,
    title: "Analiza tus resultados",
    description:
      "Descubre tus fortalezas y los temas que debes mejorar.",
  },
  {
    icon: Trophy,
    title: "Mejora tu puntaje",
    description:
      "Estudia estratégicamente hasta alcanzar tu meta.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900">
            ¿Cómo funciona PeakScore?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Cuatro pasos para preparar el ICFES de forma inteligente.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="rounded-3xl bg-white p-8 shadow-md transition hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                  <Icon className="h-7 w-7 text-blue-600" />
                </div>

                <h3 className="text-xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-4 text-gray-600">
                  {step.description}
                </p>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}