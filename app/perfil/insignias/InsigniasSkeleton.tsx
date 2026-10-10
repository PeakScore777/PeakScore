
import Image from "next/image";

const BADGE_IMAGES = [
  "/badges/aprendizaje-1.png",
  "/badges/aprendizaje-2.png",
  "/badges/aprendizaje-3.png",
  "/badges/constante-1.png",
  "/badges/racha-1.png",
  "/badges/racha-2.png",
  "/badges/racha-3.png",
];

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-slate-400/20 ${className}`}
    />
  );
}

function BadgeSkeletonCard({ image }: { image: string }) {
  return (
    <div
      aria-hidden="true"
      className="insignias-badge-card relative flex min-w-0 animate-pulse flex-col items-center overflow-hidden rounded-xl border border-white/10 p-3 sm:p-4"
    >
      <div className="relative flex h-[145px] w-full items-center justify-center sm:h-[160px]">
        <span className="absolute inset-[12%] animate-pulse border border-slate-400/15 bg-slate-400/[0.06] [clip-path:polygon(50%_0%,88%_14%,100%_50%,88%_86%,50%_100%,12%_86%,0%_50%,12%_14%)]" />
        <Image
          src={image}
          alt=""
          width={180}
          height={180}
          sizes="(max-width: 639px) 125px, 150px"
          className="relative z-10 h-[112px] w-[112px] object-contain opacity-40 grayscale sm:h-[132px] sm:w-[132px]"
        />
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
        <header className="badge-header relative isolate flex min-h-[230px] animate-pulse items-center overflow-hidden rounded-2xl border border-white/10 bg-[#081321] sm:min-h-[250px] lg:min-h-[275px]">
          <Image
            src="/images/profile/insignias-header-peaky-nova.png"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1500px"
            className="object-cover object-center"
          />

          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-black/10 via-[#031020]/60 to-black/10"
          />

          <div className="badge-header-copy relative z-10 ml-[19%] w-[48%] max-w-[650px] space-y-4 py-8">
            <SkeletonLine className="h-3 w-3/4 bg-white/20" />
            <SkeletonLine className="h-7 w-3/5 bg-white/20 sm:h-9" />
            <SkeletonLine className="h-3 w-full max-w-[430px] bg-white/20" />
            <SkeletonLine className="h-3 w-4/5 max-w-[360px] bg-white/20" />
            <SkeletonLine className="mt-2 h-2 w-2/5 bg-white/20" />
          </div>
        </header>

        <section className="flex justify-end">
          <div className="insignias-panel flex min-w-[210px] items-center gap-3 rounded-xl border border-white/10 p-3">
            <Image
              src="/dashboard/premio-pixel.webp"
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain opacity-50"
            />
            <div className="flex flex-1 flex-col gap-2">
              <SkeletonLine className="h-2 w-20" />
              <SkeletonLine className="h-3 w-10" />
            </div>
          </div>
        </section>

        <section className="insignias-panel rounded-xl border border-white/10 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-3 w-16" />
          </div>

          <div className="flex min-h-[155px] flex-col items-center justify-center gap-4">
            <Image
              src="/dashboard/premio-pixel.webp"
              alt=""
              aria-hidden="true"
              width={55}
              height={55}
              className="h-12 w-12 object-contain opacity-35"
            />
            <SkeletonLine className="h-4 w-48 max-w-full" />
            <SkeletonLine className="h-3 w-64 max-w-full" />
          </div>
        </section>

        <section className="insignias-panel rounded-xl border border-white/10 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="h-3 w-16" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {BADGE_IMAGES.map((image) => (
              <BadgeSkeletonCard key={image} image={image} />
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
