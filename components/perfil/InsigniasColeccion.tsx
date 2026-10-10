"use client";

import Image from "next/image";
import { LockKeyhole, Medal, Sparkles } from "lucide-react";

type Badge = {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_target: number;
  icon: string | null;
  unlockedAt: string | null;
};

function number(value: number) {
  return Math.max(0, Number(value) || 0).toLocaleString("es-CO");
}

function requirementLabel(type: string, target: number) {
  const names: Record<string, string> = {
    xp: "EXP acumulada",
    total_xp: "EXP acumulada",
    season_xp: "EXP de temporada",
    simulations: "simulacros completados",
    simulation: "simulacros completados",
    streak: "días de racha",
    coins: "Peak Coins",
    level: "nivel alcanzado",
    rank: "rango",
    badges: "insignias desbloqueadas",
  };
  const normalized = type.trim().toLowerCase();
  return `${names[normalized] ?? normalized.replace(/[_-]+/g, " ")}: ${number(target)}`;
}

function BadgeArtwork({ icon, name, unlocked }: { icon: string | null; name: string; unlocked: boolean }) {
  if (icon && icon.startsWith("/") && !icon.startsWith("//")) {
    return (
      <div className="relative size-16 sm:size-20">
        <Image src={icon} alt={name} fill sizes="80px" className={`object-contain ${unlocked ? "" : "grayscale opacity-40"}`} />
      </div>
    );
  }

  if (icon && icon.length <= 8) {
    return <span aria-hidden="true" className={`text-4xl ${unlocked ? "" : "grayscale opacity-45"}`}>{icon}</span>;
  }

  return unlocked ? <Medal size={42} strokeWidth={1.5} className="text-violet-200" /> : <LockKeyhole size={34} className="text-white/25" />;
}

export default function InsigniasColeccion({
  badges,
  error,
}: {
  badges: Badge[];
  error?: string | null;
}) {
  const unlockedCount = badges.filter((badge) => Boolean(badge.unlockedAt)).length;
  const total = badges.length;
  const progress = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#070510] px-3 pb-28 pt-5 text-white sm:px-6 sm:pt-7 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-violet-300/15 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,.18),transparent_62%),#100d1d] p-5 sm:p-7">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-violet-300 sm:text-[10px]">
            COLECCIÓN DE PEAKSCORE
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">Insignias</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Cada insignia representa un hito del camino. Revisa cuáles has conseguido y descubre los requisitos de las demás.
              </p>
            </div>
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:flex">
              <Medal size={28} />
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-white/75">Colección desbloqueada</span>
              <span className="font-black tabular-nums text-violet-200">{unlockedCount} / {total}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-right text-[10px] text-white/40">{progress}% de la colección</p>
          </div>
        </header>

        {error && (
          <div role="status" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100/80">
            {error}
          </div>
        )}

        {badges.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-[#100d1d] p-8 text-center">
            <Sparkles className="mx-auto text-violet-200" size={32} />
            <h2 className="mt-3 font-bold">La colección todavía no está disponible</h2>
            <p className="mt-2 text-sm text-white/50">Cuando las insignias estén publicadas en PeakScore, aparecerán aquí.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => {
              const unlocked = Boolean(badge.unlockedAt);
              return (
                <article key={badge.id} className={`relative flex min-h-[186px] gap-4 overflow-hidden rounded-2xl border p-4 transition-colors ${unlocked ? "border-violet-300/25 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,.14),transparent_60%),#100d1d]" : "border-white/10 bg-[#0b0915]"}`}>
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                    <BadgeArtwork icon={badge.icon} name={badge.name} unlocked={unlocked} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`font-extrabold ${unlocked ? "text-white" : "text-white/65"}`}>{badge.name}</h2>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${unlocked ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-white/40"}`}>
                        {unlocked ? "Desbloqueada" : "Bloqueada"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/55">{badge.description || "Insignia de la colección PeakScore."}</p>
                    <p className="mt-3 text-[10px] font-bold leading-5 text-violet-200/80">
                      Requisito: {requirementLabel(badge.requirement_type, badge.requirement_target)}
                    </p>
                    {unlocked && badge.unlockedAt && (
                      <p className="mt-1 text-[10px] text-white/35">
                        Conseguida: {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(badge.unlockedAt))}
                      </p>
                    )}
                  </div>
                  {!unlocked && <LockKeyhole size={15} className="absolute right-3 top-3 text-white/25" />}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
