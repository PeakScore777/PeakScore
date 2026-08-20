"use client";

import { Target } from "lucide-react";

interface GoalCardProps {
  currentScore?: number;
  targetScore?: number;
}

export default function GoalCard({
  currentScore = 378,
  targetScore = 500,
}: GoalCardProps) {
  const percentage = Math.min(
    (currentScore / targetScore) * 100,
    100
  );

  const remaining = Math.max(
    targetScore - currentScore,
    0
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">

      <div className="mb-6 flex items-center gap-3">

        <div className="rounded-2xl bg-blue-100 p-3">
          <Target className="text-blue-600" size={28} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Objetivo ICFES
          </h2>

          <p className="text-sm text-slate-500">
            Sigue avanzando hacia tu meta.
          </p>
        </div>

      </div>

      <div className="space-y-6">

        <div className="flex justify-between">
          <span className="text-slate-500">
            Puntaje actual
          </span>

          <span className="font-bold text-blue-600">
            {currentScore}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            Meta
          </span>

          <span className="font-bold text-green-600">
            {targetScore}
          </span>
        </div>

        <div className="h-4 rounded-full bg-slate-200">

          <div
            className="h-4 rounded-full bg-blue-600 transition-all duration-700"
            style={{
              width: `${percentage}%`,
            }}
          />

        </div>

        <div className="flex justify-between text-sm">

          <span className="text-slate-500">
            Te faltan
          </span>

          <span className="font-semibold text-slate-800">
            {remaining} puntos
          </span>

        </div>

      </div>

    </div>
  );
}