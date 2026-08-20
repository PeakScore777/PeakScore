import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Laura Gómez",
    score: "465 → 498",
    text: "PeakScore me ayudó a identificar mis errores y mejorar mi puntaje en pocas semanas.",
  },
  {
    name: "Juan Pérez",
    score: "410 → 470",
    text: "Los simulacros son muy parecidos al ICFES real. Llegué mucho más preparado.",
  },
  {
    name: "Sara Martínez",
    score: "430 → 495",
    text: "La plataforma es muy fácil de usar y las estadísticas son increíbles.",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            Lo que dicen nuestros estudiantes
          </h2>

          <p className="mt-4 text-gray-600">
            Miles de estudiantes ya preparan su ICFES con PeakScore.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">

          {testimonials.map((item, index) => (
            <div
              key={index}
              className="rounded-3xl border border-gray-200 p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-600 italic">
                "{item.text}"
              </p>

              <div className="mt-6">
                <h3 className="font-bold">
                  {item.name}
                </h3>

                <p className="text-blue-600 font-semibold">
                  {item.score}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}