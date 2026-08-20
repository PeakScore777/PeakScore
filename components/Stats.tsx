import { Users, FileText, Target, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    number: "5.000+",
    label: "Estudiantes activos",
  },
  {
    icon: FileText,
    number: "10.000+",
    label: "Preguntas disponibles",
  },
  {
    icon: Target,
    number: "98%",
    label: "Precisión en simulacros",
  },
  {
    icon: Award,
    number: "500",
    label: "Puntaje máximo",
  },
];

export default function Stats() {
  return (
    <section className="bg-blue-600 py-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-4">

        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="rounded-3xl bg-white/10 p-8 text-center text-white backdrop-blur-md"
            >
              <Icon className="mx-auto mb-5 h-10 w-10" />

              <h3 className="text-5xl font-extrabold">
                {stat.number}
              </h3>

              <p className="mt-3 text-blue-100">
                {stat.label}
              </p>
            </div>
          );
        })}

      </div>
    </section>
  );
}