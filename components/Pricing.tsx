import { Check } from "lucide-react";

const plans = [
  {
    name: "Gratis",
    price: "$0",
    description: "Empieza sin costo.",
    features: [
      "1 simulacro",
      "Estadísticas básicas",
      "Banco limitado",
    ],
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$180.000",
    description: "Todo lo que necesitas para el ICFES.",
    features: [
      "Simulacros ilimitados",
      "Banco completo",
      "Estadísticas avanzadas",
      "Cuadernillos",
      "Seguimiento de progreso",
    ],
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">

        <div className="text-center">
          <h2 className="text-4xl font-bold">
            Elige el plan ideal
          </h2>

          <p className="mt-4 text-gray-600">
            Comienza gratis o desbloquea todo el potencial de PeakScore.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl border p-10 shadow-lg ${
                plan.highlighted
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "bg-white"
              }`}
            >
              <h3 className="text-3xl font-bold">
                {plan.name}
              </h3>

              <p className="mt-4 text-5xl font-extrabold">
                {plan.price}
              </p>

              <p className="mt-3 opacity-80">
                {plan.description}
              </p>

              <div className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3"
                  >
                    <Check className="h-5 w-5" />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className={`mt-10 w-full rounded-xl py-4 font-semibold ${
                  plan.highlighted
                    ? "bg-white text-blue-600"
                    : "bg-blue-600 text-white"
                }`}
              >
                Elegir plan
              </button>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}