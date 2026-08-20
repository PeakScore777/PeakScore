"use client";

interface QuestionOptionsProps {
  options: string[];
  selectedOption: number | null;
  onSelect: (index: number) => void;
}

export default function QuestionOptions({
  options,
  selectedOption,
  onSelect,
}: QuestionOptionsProps) {
  return (
    <div className="mt-8 space-y-4">
      {options.map((option, index) => {
        const selected = selectedOption === index;

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
              selected
                ? "border-blue-600 bg-blue-50 shadow-md"
                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </div>

              <span className="text-slate-700">
                {option}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}