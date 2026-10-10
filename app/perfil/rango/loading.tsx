
export default function LoadingRango() {
  return (
    <main
      aria-label="Cargando tu rango"
      className="min-h-screen animate-pulse space-y-6 p-4 sm:p-6 lg:p-8"
    >
      <div className="h-4 w-40 rounded bg-[var(--app-surface-secondary)]" />
      <div className="h-8 w-64 max-w-full rounded bg-[var(--app-surface-secondary)]" />
      <div className="h-4 w-full max-w-lg rounded bg-[var(--app-surface-secondary)]" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
          <div className="h-4 w-40 rounded bg-[var(--app-surface-secondary)]" />
          <div className="h-5 rounded-full bg-[var(--app-surface-secondary)]" />
          <div className="h-24 rounded-xl bg-[var(--app-surface-secondary)]" />
        </div>
        <div className="h-[320px] rounded-2xl bg-[var(--app-surface-secondary)] sm:h-[420px]" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="h-40 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
          />
        ))}
      </div>
    </main>
  );
}
