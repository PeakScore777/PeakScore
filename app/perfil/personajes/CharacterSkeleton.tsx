
const CHARACTERS = [
  { id: "nova", color: "#45FF88" },
  { id: "nox", color: "#BE83FF" },
  { id: "zyra", color: "#FFAC42" },
  { id: "orby", color: "#45DDFF" },
];

export function PersonajesHeaderSkeleton() {
  return (
    <header
      aria-hidden="true"
      className="
        relative isolate flex min-h-[170px] items-center
        overflow-hidden rounded-2xl border border-white/10
        bg-[#0a1020] sm:min-h-[205px]
      "
    >
      {/* Fondo provisional */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#10162a] via-[#11172e] to-[#0b1722]" />

      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080b19]/50 via-transparent to-[#101a23]/30" />

      {/* Título y descripción */}
      <div className="relative z-10 w-full max-w-[760px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="h-9 w-[min(70vw,410px)] animate-pulse rounded-lg bg-white/[0.09] sm:h-11 lg:h-12" />

        <div className="mt-5 max-w-xl space-y-3">
          <div className="h-3.5 w-full max-w-[550px] animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3.5 w-[72%] animate-pulse rounded bg-white/[0.06]" />
        </div>
      </div>

      {/* Silueta provisional donde aparece Peaky */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] sm:block">
        <div className="absolute right-[13%] top-[12%] size-[150px] animate-pulse rounded-[35%] border border-emerald-300/[0.08] bg-emerald-300/[0.05] lg:size-[175px]" />

        <div className="absolute bottom-[8%] right-[20%] h-[45%] w-[30%] animate-pulse rounded-t-[45%] rounded-b-xl bg-emerald-300/[0.06]" />

        <div className="absolute bottom-[8%] right-[14%] h-3 w-[12%] rounded bg-emerald-300/[0.05]" />
      </div>
    </header>
  );
}

export function CharacterSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando tu colección de personajes"
      aria-busy="true"
      className="space-y-6"
    >
      {/* Contador de personajes */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-3 w-36 animate-pulse rounded bg-white/[0.06]" />
      </div>

      {/* Cuatro tarjetas */}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
        {CHARACTERS.map((character) => (
          <article
            key={character.id}
            className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-[#0b0915]"
            style={{ borderColor: `${character.color}35` }}
          >
            {/* Ilustración provisional */}
            <div
              className="relative isolate h-[165px] overflow-hidden sm:h-[220px] lg:h-[245px]"
              style={{
                background: `radial-gradient(ellipse at 50% 43%, ${character.color}22, transparent 62%), linear-gradient(180deg, #111020, #080711)`,
              }}
            >
              <div
                className="absolute inset-3 rounded-xl border"
                style={{ borderColor: `${character.color}18` }}
              />

              <div
                className="absolute left-1/2 top-[18%] size-[66px] -translate-x-1/2 animate-pulse rounded-full border border-white/[0.04] sm:size-[86px]"
                style={{
                  background: `linear-gradient(145deg, ${character.color}17, #ffffff04)`,
                }}
              />

              <div
                className="absolute bottom-[7%] left-1/2 h-[46%] w-[48%] -translate-x-1/2 animate-pulse rounded-t-[45%] rounded-b-xl border border-white/[0.035]"
                style={{
                  background: `linear-gradient(180deg, ${character.color}12, #ffffff04)`,
                }}
              />

              <div className="absolute bottom-[5%] left-[24%] h-3 w-[22%] rounded-md bg-white/[0.045]" />
              <div className="absolute bottom-[5%] right-[24%] h-3 w-[22%] rounded-md bg-white/[0.045]" />

              {/* Rareza y estado */}
              <div className="absolute left-3 top-3 h-6 w-[76px] animate-pulse rounded-md border border-white/[0.06] bg-black/40" />
              <div className="absolute right-3 top-3 size-7 animate-pulse rounded-lg border border-white/[0.06] bg-black/35" />

              <div
                className="absolute inset-x-0 bottom-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${character.color}40, transparent)`,
                }}
              />
            </div>

            {/* Información de la tarjeta */}
            <div className="flex flex-1 flex-col gap-4 border-t border-white/[0.04] bg-[#0a0812] p-3 sm:p-4">
              <div className="space-y-3">
                <div
                  className="h-4 w-3/4 animate-pulse rounded"
                  style={{ backgroundColor: `${character.color}18` }}
                />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.055]" />
              </div>

              {/* Descripción */}
              <div className="space-y-2 pt-1">
                <div className="h-2.5 w-full animate-pulse rounded bg-white/[0.055]" />
                <div className="h-2.5 w-[88%] animate-pulse rounded bg-white/[0.045]" />
                <div className="h-2.5 w-[68%] animate-pulse rounded bg-white/[0.04]" />
              </div>

              {/* Habilidad */}
              <div className="mt-auto rounded-xl border border-white/[0.055] bg-white/[0.02] p-3">
                <div className="mb-3 h-2 w-24 animate-pulse rounded bg-white/[0.055]" />
                <div className="space-y-2">
                  <div className="h-3 w-[90%] animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-[65%] animate-pulse rounded bg-white/[0.045]" />
                </div>
              </div>

              {/* Botones provisionales */}
              <div className="h-10 animate-pulse rounded-lg border border-white/[0.06] bg-white/[0.035]" />

              <div
                className="h-10 animate-pulse rounded-lg border"
                style={{
                  borderColor: `${character.color}18`,
                  backgroundColor: `${character.color}09`,
                }}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Panel de PeakCoin */}
      <section className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-[#0c0a19] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-violet-600/[0.06] blur-3xl" />

        <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="space-y-4">
            <div className="h-4 w-28 animate-pulse rounded bg-violet-300/[0.09]" />
            <div className="h-3 w-full max-w-md animate-pulse rounded bg-white/[0.055]" />
            <div className="h-3 w-4/5 max-w-sm animate-pulse rounded bg-white/[0.045]" />
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.07] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div className="size-11 shrink-0 animate-pulse rounded-full border border-cyan-300/10 bg-cyan-300/[0.07]" />

            <div className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-white/[0.05]" />
              <div className="h-6 w-24 animate-pulse rounded bg-white/[0.08]" />
            </div>
          </div>
        </div>
      </section>

      <span className="sr-only">Preparando los personajes...</span>
    </div>
  );
}

export function PersonajesLoadingScreen() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#05030b] px-3 pb-28 pt-5 text-white sm:px-5 sm:pt-7 lg:px-8 lg:pb-12">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <PersonajesHeaderSkeleton />
        <CharacterSkeleton />
      </div>
    </main>
  );
}
