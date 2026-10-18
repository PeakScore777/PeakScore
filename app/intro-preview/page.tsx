import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function IntroPreviewPage() {
  return (
    <main className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[#070611] px-4 py-12 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 25%, rgba(34,211,238,.13), transparent 30%), radial-gradient(circle at 80% 70%, rgba(139,92,246,.18), transparent 35%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
          backgroundSize: "auto, auto, 24px 24px, 24px 24px",
        }}
      />
      <section className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-[#10101d]/95 p-6 shadow-2xl shadow-violet-950/30 sm:p-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-cyan-200">
          <Sparkles className="h-4 w-4" />
          Vista previa de introducción
        </div>
        <p className="pixel-font mb-4 text-[10px] leading-6 text-violet-300">
          PEAKSCORE · NUEVA AVENTURA
        </p>
        <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          Tu recorrido empieza con una primera decisión.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
          Esta ruta sirve para comprobar el acceso a la experiencia de bienvenida.
          La introducción real conserva sus preguntas y su guardado autenticado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/intro"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
          >
            Abrir introducción real <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/aprender"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/5"
          >
            Ver niveles
          </Link>
        </div>
      </section>
    </main>
  );
}
