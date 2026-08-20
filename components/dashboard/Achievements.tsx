"use client";

import {
  Trophy,
  Flame,
  Target,
  Medal,
  CheckCircle,
} from "lucide-react";

const achievements = [
  {
    title: "Primer simulacro",
    description: "Completa tu primer simulacro.",
    icon: Trophy,
    completed: false,
  },
  {
    title: "Racha de 7 días",
    description: "Estudia durante 7 días seguidos.",
    icon: Flame,
    completed: false,
  },
  {
    title: "Meta 500",
    description: "Alcanza un puntaje de 500.",
    icon: Target,
    completed: false,
  },
  {
    title: "50 preguntas",
    description: "Responde 50 preguntas.",
    icon: CheckCircle,
    completed: false,
  },
  {
    title: "Nivel Intermedio",
    description: "Obtén un promedio de 350 puntos.",
    icon: Medal,
    completed: false,
  },
];

export default function Achievements() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <h2 className="mb-2 text-2xl font-bold text-slate-800">
        🏆 Logros
      </h2>

      <p className="mb-8 text-sm text-slate-500">
        Desbloquea logros mientras avanzas en tu preparación.
      </p>

      <div className="space-y-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;

          return (
            <div
              key={achievement.title}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition-all hover:scale-[1.02] hover:shadow-md"
            >
              <div className="rounded-xl bg-blue-100 p-3">
                <Icon
                  size={24}
                  className="text-blue-600"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  {achievement.title}
                </h3>

                <p className="text-sm text-slate-500">
                  {achievement.description}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                Pendiente
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}