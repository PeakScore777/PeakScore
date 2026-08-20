type ExamResultsProps = {
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  onRetry: () => void;
};

export default function ExamResults({
  correctAnswers,
  incorrectAnswers,
  percentage,
  onRetry,
}: ExamResultsProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-8">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-900">
          🎉 Simulacro finalizado
        </h1>

        <p className="mt-2 text-slate-600">
          Estos son tus resultados.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex justify-between rounded-xl bg-slate-100 p-4">
            <span>✅ Correctas</span>
            <span className="font-bold">{correctAnswers}</span>
          </div>

          <div className="flex justify-between rounded-xl bg-slate-100 p-4">
            <span>❌ Incorrectas</span>
            <span className="font-bold">{incorrectAnswers}</span>
          </div>

          <div className="flex justify-between rounded-xl bg-blue-100 p-4">
            <span>📊 Puntaje</span>
            <span className="font-bold text-blue-700">
              {percentage}%
            </span>
          </div>
        </div>

        <button
          onClick={onRetry}
          className="mt-8 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Reintentar simulacro
        </button>
      </div>
    </main>
  );
}