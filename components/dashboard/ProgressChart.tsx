"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { name: "Sim 1", score: 280 },
  { name: "Sim 2", score: 315 },
  { name: "Sim 3", score: 340 },
  { name: "Sim 4", score: 375 },
  { name: "Sim 5", score: 410 },
  { name: "Sim 6", score: 445 },
];

export default function ProgressChart() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg border border-slate-200">

      <div className="mb-8 flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Evolución del puntaje
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Últimos simulacros realizados
          </p>
        </div>

        <div className="rounded-xl bg-green-100 px-4 py-2">
          <span className="font-semibold text-green-700">
            +165 pts
          </span>
        </div>

      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={data}>

            <defs>

              <linearGradient
                id="colorScore"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>

            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis dataKey="name" />

            <YAxis domain={[200, 500]} />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#2563EB"
              strokeWidth={4}
              fill="url(#colorScore)"
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}