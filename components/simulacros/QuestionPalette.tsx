type QuestionPaletteProps = {
  totalQuestions: number;
  currentQuestion: number;
  answers: Record<number, number>;
  onSelectQuestion: (index: number) => void;
};

export default function QuestionPalette({
  totalQuestions,
  currentQuestion,
  answers,
  onSelectQuestion,
}: QuestionPaletteProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-bold text-slate-800">
        Preguntas
      </h2>

      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: totalQuestions }).map((_, index) => {
          const isCurrent = currentQuestion === index;
          const isAnswered = answers[index] !== undefined;

          let styles =
            "h-11 w-11 rounded-lg font-semibold transition";

          if (isCurrent) {
            styles += " bg-blue-600 text-white";
          } else if (isAnswered) {
            styles += " bg-green-500 text-white";
          } else {
            styles += " bg-slate-200 text-slate-700 hover:bg-slate-300";
          }

          return (
            <button
              key={index}
              onClick={() => onSelectQuestion(index)}
              className={styles}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}