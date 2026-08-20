export default function CTA() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">

        <h2 className="text-5xl font-extrabold text-white">
          ¿Listo para alcanzar un 500/500?
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-xl text-blue-100">
          Únete a miles de estudiantes que ya están mejorando su rendimiento
          con PeakScore.
        </p>

        <button className="mt-10 rounded-2xl bg-white px-10 py-4 text-lg font-bold text-blue-600 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
          Empieza gratis
        </button>

      </div>
    </section>
  );
}