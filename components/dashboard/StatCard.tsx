import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number | undefined;
  icon: ReactNode;
  color: "blue" | "green" | "orange" | "red";
}

const colors = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-500",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-500",
  },
};

export default function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className={`mt-4 text-5xl font-bold ${colors[color].text}`}>
            {value}
          </h2>

        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors[color].bg}`}
        >
          <div className={colors[color].text}>
            {icon}
          </div>
        </div>

      </div>

    </div>
  );
}