
const BADGE_PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6] as const;

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-slate-400/20 motion-reduce:animate-none ${className}`}
    />
  );
}

function BadgeSkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="insignias-badge-card relative flex min-w-0 flex-col items-center overflow-hidden rounded-xl border border-white/10 p-3 sm:p-4"
    >
      <div className="relative flex h-[145px] w-full items-center justify-center sm:h-[160px]">
        <span className="absolute inset-[12%] animate-pulse border border-slate-400/15 bg-slate-400/[0.06] [clip-path:polygon(50%_0%,88%_14%,100%_50%,88%_86%,50%_100%,12%_86%,0%_50%,12%_14%)] motion-reduce:animate-none" />

        <span className="absolute h-[76px] w-[76px] animate-pulse rounded-full border border-slate-400/15 bg-slate-400/[0.07] motion-reduce:animate-none" />

        <span className="absolute h-[50px] w-[50px] animate-pulse rounded-lg border border-slate-400/15 bg-slate-400/[0.08] motion-reduce:animate-none" />
      </div>

      <div className="mt-3 flex min-h-[73px] w-full flex-col items-center gap-3">
        <SkeletonLine className="h-4 w-3/4" />
        <SkeletonLine className="h-2 w-2/5" />
      </div>

      <div className="mt-3 w-full">
        <SkeletonLine className="h-2 w-full rounded-full" />
        <SkeletonLine className="mx-auto mt-3 h-2 w-8" />
      </div>

      <SkeletonLine className="mt-5 h-3 w-20" />
    </div>
  );
}

export default function InsigniasSkeleton() {
  return (
    <main
      className="insignias-page min-h-screen overflow-x-clip px-3 py-5 text-white sm:px-5 sm:py-6 lg:px-7 lg:py-8"
      aria-busy="true"
      aria-label="Cargando colección de insignias"
    >
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Encabezado */}
        <header className="badge-header relative isolate flex min-h-[230px] animate-pulse items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0A1020] motion-reduce:animate-none sm:min-h-[250px] lg:min-h-[275px]">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/10 via-[#031020]/60 to-black/10"
          />

          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-[17%] right-[29%] bg-slate-400/[0.04] blur-xl"
          />

          <div className="badge-header-copy relative z-10 ml-[19%] w-[48%] max-w-[650px] space-y-4 py-8 max-sm:ml-0 max-sm:w-full max-sm:max-w-none max-sm:self-end max-sm:px-4 max-sm:pb-4 sm:py-9 lg:py-10">
            <SkeletonLine className="h-3 w-3/4 bg-white/20" />
            <SkeletonLine className="h-7 w-3/5 bg-white/20 sm:h-9" />
            <SkeletonLine className="h-3 w-full max-w-[430px] bg-white/20" />
            <SkeletonLine className="h-3 w-4/5 max-w-[360px] bg-white/20" />
            <SkeletonLine className="mt-2 h-2 w-2/5 bg-white/20" />
          </div>
        </header>

        {/* Resumen de colección */}
        <section className="flex justify-end">
          <div className="insignias-panel flex min-w-[210px] items-center gap-3 rounded-xl border border-white/10 p-3">
            <SkeletonLine className="h-10 w-10 shrink-0 rounded-xl" />

            <div className="flex flex-1 flex-col gap-2">
              <SkeletonLine className="h-2 w-20" />
              <SkeletonLine className="h-3 w-10" />
            </div>
          </div>
        </section>

        {/* Insignias obtenidas */}
        <section className="insignias-panel rounded-xl border border-white/10 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-3 w-16" />
          </div>

          <div className="flex min-h-[155px] flex-col items-center justify-center gap-4">
            <SkeletonLine className="h-12 w-12 rounded-xl" />
            <SkeletonLine className="h-4 w-48 max-w-full" />
            <SkeletonLine className="h-3 w-64 max-w-full" />
          </div>
        </section>

        {/* Insignias por conseguir */}
        <section className="insignias-panel rounded-xl border border-white/10 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="h-3 w-16" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {BADGE_PLACEHOLDERS.map((placeholder) => (
              <BadgeSkeletonCard key={placeholder} />
            ))}
          </div>
        </section>

        <div className="flex justify-center pb-2">
          <SkeletonLine className="h-2 w-64 max-w-full" />
        </div>
      </div>
    </main>
  );
}
