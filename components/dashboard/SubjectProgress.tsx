interface SubjectProps {
  subject: string;
  percentage: number;
}

export default function SubjectProgress({
  subject,
  percentage,
}: SubjectProps) {
  return (
    <div className="space-y-2">

      <div className="flex justify-between">

        <span className="font-medium text-slate-700">
          {subject}
        </span>

        <span className="font-semibold text-blue-600">
          {percentage}%
        </span>

      </div>

      <div className="h-3 w-full rounded-full bg-slate-200">

        <div
          className="h-3 rounded-full bg-blue-600 transition-all duration-500"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}