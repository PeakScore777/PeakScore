interface SubjectProps {
  subject: string;
  percentage: number;
}

export default function SubjectProgress({
  subject,
  percentage,
}: SubjectProps) {
  const safePercentage = Math.min(
    Math.max(percentage, 0),
    100
  );

  return (
    <div className="group">

      {/* INFORMACIÓN */}

      <div className="mb-2.5 flex items-center justify-between">

        <span className="text-[13px] font-semibold tracking-[-0.01em] text-slate-700">
          {subject}
        </span>

        <span className="text-[12px] font-bold tabular-nums text-slate-500">
          {safePercentage}%
        </span>

      </div>

      {/* BARRA */}

      <div className="relative h-[7px] w-full overflow-hidden rounded-full bg-slate-100">

        <div
          className="
            absolute
            inset-y-0
            left-0
            rounded-full
            bg-gradient-to-r
            from-blue-600
            to-blue-500
            shadow-[0_0_10px_rgba(37,99,235,0.18)]
            transition-all
            duration-700
            ease-out
          "
          style={{
            width: `${safePercentage}%`,
          }}
        />

      </div>

      {/* LÍNEA INFERIOR SUTIL */}

      <div className="mt-2 flex items-center justify-between">

        <span className="text-[10px] font-medium text-slate-400">
          Progreso
        </span>

        <span className="h-1 w-1 rounded-full bg-slate-200" />

      </div>

    </div>
  );
}