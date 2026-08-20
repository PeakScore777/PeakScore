import {
  BarChart3,
  FileText,
  Target,
  BookOpen,
  TrendingUp,
  Award,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Estadísticas inteligentes",
    description:
      "Analiza tus resultados por áreas y descubre qué debes mejorar.",
  },
  {
    icon: FileText,
    title: "Simulacros tipo ICFES",
    description:
      "Practica con exámenes similares al formato oficial.",
  },
  {
    icon: Target,
    title: "Metas personalizadas",
    description:
      "Define el puntaje que deseas alcanzar y sigue tu progreso.",
  },
  {
    icon: BookOpen,
    title: "Cuadernillos organizados",
    description:
      "Todo el material clasificado por materias y niveles.",
  },
  {
    icon: TrendingUp,
    title: "Seguimiento del progreso",
    description:
      "Visualiza cómo mejoras con estadísticas claras.",
  },
  {
    icon: Award,
    title: "Motivación constante",
    description:
      "Mantén tu racha de estudio y alcanza nuevos logros.",
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            Todo lo que necesitas para alcanzar tu mejor puntaje
          </h2>

          <p className="mt-5 text-lg text-slate-600">
            PeakScore reúne todas las herramientas necesarias para preparar el
            ICFES de forma inteligente.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                  <Icon className="h-7 w-7 text-blue-600" />
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}