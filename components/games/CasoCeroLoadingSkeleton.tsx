import Image from "next/image";

type Props = {
  overlay?: boolean;
};

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "relative block overflow-hidden bg-[#13202a]",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[caso-cero-shimmer_1.7s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-[#b8d8df]/[0.10] before:to-transparent",
        className,
      ].join(" ")}
    />
  );
}

/**
 * Premium loading state for Caso Cero. It intentionally uses only CSS and a
 * tiny existing avatar asset; the large cinematic files are allowed to load
 * behind it, so the loading state itself stays lightweight.
 */
export default function CasoCeroLoadingSkeleton({ overlay = false }: Props) {
  return (
    <main
      role="status"
      aria-label="Cargando Caso Cero"
      aria-live="polite"
      className={[
        "caso-cero-loading relative isolate overflow-hidden bg-[#030609] text-white",
        overlay ? "absolute inset-0 z-40 h-full w-full" : "min-h-[calc(100svh-72px)] w-full",
      ].join(" ")}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_24%,rgba(35,87,93,.25),transparent_42%),linear-gradient(180deg,#08131a,#030609_75%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(151,195,201,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(151,195,201,.06)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className={["relative mx-auto flex w-full max-w-[1672px] flex-col p-3 sm:p-5 lg:p-7", overlay ? "h-full" : "min-h-[calc(100svh-72px)]"].join(" ")}>
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Shimmer className="h-10 w-10 shrink-0 border border-[#8a704b]/50 sm:h-12 sm:w-12" />
            <div className="min-w-0 space-y-2">
              <Shimmer className="h-2 w-28 sm:w-36" />
              <Shimmer className="h-2 w-20 sm:w-24" />
            </div>
          </div>
          <Shimmer className="h-10 w-10 shrink-0 border border-[#8a704b]/35 sm:w-36" />
        </header>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 lg:mt-5">
          <div className="relative min-h-[260px] flex-1 overflow-hidden border-[5px] border-[#302519] bg-[#081116] shadow-[inset_0_0_0_2px_rgba(172,129,74,.22),0_18px_52px_rgba(0,0,0,.42)] sm:min-h-[320px] lg:min-h-[390px]">
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,13,18,.25),rgba(3,7,11,.74))]" />

            <div className="absolute inset-x-[8%] top-[8%] grid grid-cols-4 gap-[2%]">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Shimmer className="aspect-[1.1/1] border border-[#9b8055]/20" />
                  <Shimmer className="h-1.5 w-2/3" />
                </div>
              ))}
            </div>

            <div className="absolute inset-x-[8%] top-[45%] grid grid-cols-4 gap-[2%]">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <Shimmer className="aspect-[1.65/1] border border-[#9b8055]/20" />
                  <Shimmer className="h-1.5 w-1/2" />
                </div>
              ))}
            </div>

            <div className="absolute bottom-[9%] left-[7%] flex items-end gap-2 opacity-60">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#72c8b5]" />
              <span className="h-1.5 w-20 bg-[#72c8b5]/30 sm:w-32" />
            </div>

            <div className="absolute inset-x-0 bottom-0 h-[17%] bg-gradient-to-t from-[#020507]/75 to-transparent" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <section className="w-full max-w-[430px] border border-[#9a7847]/45 bg-[#071117]/95 p-4 shadow-[0_12px_34px_rgba(0,0,0,.28)] sm:p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-[#9a7847]/45 bg-[#101b22]">
                  <Image src="/avatars/photo_perfil/orbyp.png" alt="" aria-hidden="true" fill sizes="44px" className="object-contain opacity-60 grayscale" />
                </div>
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-2 w-28" />
                  <Shimmer className="h-2 w-20" />
                </div>
              </div>
              <Shimmer className="mt-4 h-2 w-full" />
              <Shimmer className="mt-2 h-2 w-11/12" />
              <Shimmer className="mt-2 h-2 w-3/4" />
              <Shimmer className="mt-5 h-11 w-full border-2 border-[#d7ad67]/30" />
            </section>

            <div className="flex min-w-0 items-center gap-3 border border-[#5c6c70]/40 bg-[#071117]/85 px-4 py-3 sm:max-w-[260px]">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#68c7b7]/50" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#68c7b7]" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black tracking-[.22em] text-[#a9d8d0]">PREPARANDO EXPEDIENTE</p>
                <p className="mt-1 truncate text-[10px] text-[#91a3ad]">Cargando escena, datos y ambiente…</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes caso-cero-shimmer {
          100% { transform: translateX(100%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .caso-cero-loading :global(*) {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
