"use client";

import { Clock3, CheckCircle2 } from "lucide-react";

const simulations = [
  {
    date: "03 Ago 2026",
    score: 412,
    duration: "1h 42m",
    status: "Completado",
  },
  {
    date: "01 Ago 2026",
    score: 398,
    duration: "1h 55m",
    status: "Completado",
  },
  {
    date: "29 Jul 2026",
    score: 385,
    duration: "2h 03m",
    status: "Completado",
  },
  {
    date: "27 Jul 2026",
    score: 360,
    duration: "1h 58m",
    status: "Completado",
  },
];

export default function RecentSimulations() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            📄 Últimos simulacros
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Historial reciente de tus simulacros.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">

          <thead>
            <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
              <th className="pb-4">Fecha</th>
              <th className="pb-4">Puntaje</th>
              <th className="pb-4">Tiempo</th>
              <th className="pb-4">Estado</th>
            </tr>
          </thead>

          <tbody>
            {simulations.map((simulation) => (
              <tr
                key={simulation.date}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="py-5 font-medium text-slate-700">
                  {simulation.date}
                </td>

                <td className="py-5 font-bold text-blue-600">
                  {simulation.score}
                </td>

                <td className="py-5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock3 size={18} />
                    {simulation.duration}
                  </div>
                </td>

                <td className="py-5">
                  <div className="flex items-center gap-2 font-medium text-green-600">
                    <CheckCircle2 size={18} />
                    {simulation.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}