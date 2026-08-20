export default function SimulacrosPage() {
  const simulacros = [
    {
      id: 1,
      title: "Simulacro Diagnóstico",
      description: "Evalúa tu nivel antes de comenzar.",
      questions: 50,
      duration: "2 horas",
      difficulty: "Inicial",
    },
    {
      id: 2,
      title: "Simulacro General #1",
      description: "Examen completo tipo ICFES.",
      questions: 100,
      duration: "4 horas",
      difficulty: "Intermedio",
    },
    {
      id: 3,
      title: "Matemáticas",
      description: "Práctica enfocada en matemáticas.",
      questions: 25,
      duration: "60 min",
      difficulty: "Medio",
    },
    {
      id: 4,
      title: "Lectura Crítica",
      description: "Fortalece tu comprensión lectora.",
      questions: 25,
      duration: "60 min",
      difficulty: "Medio",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-8">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-800">
            Simulacros
          </h1>

          <p className="mt-2 text-slate-500">
            Selecciona un simulacro para comenzar tu práctica.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {simulacros.map((simulacro) => (
            <div
              key={simulacro.id}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow transition hover:-translate-y-1 hover:shadow-xl"
            >
              <h2 className="text-2xl font-bold text-slate-800">
                {simulacro.title}
              </h2>

              <p className="mt-2 text-slate-500">
                {simulacro.description}
              </p>

              <div className="mt-6 space-y-2 text-sm text-slate-600">
                <p>📝 {simulacro.questions} preguntas</p>
                <p>⏱️ {simulacro.duration}</p>
                <p>📊 {simulacro.difficulty}</p>
              </div>

              <button className="mt-8 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700">
                Comenzar
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}