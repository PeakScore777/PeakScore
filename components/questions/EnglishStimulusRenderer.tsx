"use client";

interface EnglishStimulusRendererProps {
  content: string;
  activePosition?: number | null;
  className?: string;
}

export default function EnglishStimulusRenderer({
  content,
  activePosition = null,
  className = "",
}: EnglishStimulusRendererProps) {
  const segments = content.split(/(\[\[\d+\]\])/g);

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        const marker = segment.match(/^\[\[(\d+)\]\]$/);

        if (!marker) {
          return <span key={index}>{segment}</span>;
        }

        const position = Number(marker[1]);
        const active = activePosition === position;

        return (
          <span
            key={index}
            aria-label={`Espacio ${position}${active ? ", pregunta actual" : ""}`}
            className={
              active
                ? "mx-1 inline-flex min-w-24 items-center justify-center rounded-lg border border-blue-400 bg-blue-100 px-2 py-1 font-extrabold text-blue-900 ring-2 ring-blue-200"
                : "mx-1 inline-flex min-w-20 items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-600"
            }
          >
            {position}. ______
          </span>
        );
      })}
    </div>
  );
}
