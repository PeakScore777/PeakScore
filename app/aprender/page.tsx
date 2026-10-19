import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSeasonContext } from "@/lib/gamification/season-service";
import { getRankBySeasonXp } from "@/lib/gamification/ranks";

export const metadata = {
  title: "Niveles | PeakScore",
  description: "Avanza por los desafíos de PeakScore.",
};

function safeNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

const LOCKED_LEVELS = [
  { number: "02", title: "El Laboratorio de las Mezclas", subject: "CIENCIAS NATURALES", detail: "Sustancias y mezclas" },
  { number: "03", title: "El Código del Átomo", subject: "CIENCIAS NATURALES", detail: "Partículas y estructura atómica" },
  { number: "04", title: "El Guardián de los Elementos", subject: "JEFE DE RUTA", detail: "Demuestra lo que aprendiste" },
];

export default async function AprenderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, coins")
    .eq("id", user.id)
    .maybeSingle();

  let seasonXp = 0;
  let rankName = "Aprendiz";
  let seasonName = "TEMPORADA ACTUAL";

  try {
    const { season, participation } = await getCurrentSeasonContext(user.id);
    seasonXp = safeNumber(participation.seasonXp);
    seasonName = season.name.toLocaleUpperCase("es-CO");
    rankName = getRankBySeasonXp(
      seasonXp,
      participation.startingRank === "aprendiz",
    ).name;
  } catch (error) {
    console.error("[Niveles] No se pudo cargar el contexto de temporada:", error);
  }

  const coins = safeNumber(profile?.coins);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "EXPLORADOR";

  return (
    <main className="levels-page relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#080b12] text-white">
      <div aria-hidden="true" className="levels-backdrop" />
      <div aria-hidden="true" className="levels-shade" />

      <div className="levels-content relative z-10 mx-auto w-full max-w-[1600px] px-5 pb-14 pt-7 sm:px-9 sm:pt-9">
        <header className="levels-header flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="pixel-font text-[8px] leading-6 tracking-[.08em] text-[#a8c5ad] sm:text-[10px]">
              {seasonName}
            </p>
            <h1 className="pixel-font mt-3 text-[17px] leading-[1.9] text-[#f4f1df] sm:text-[22px]">
              Continuar mi progreso
            </h1>
            <p className="pixel-font mt-2 text-[8px] leading-6 text-white/65 sm:text-[10px]">
              HOLA, {firstName.toLocaleUpperCase("es-CO")} · TU SIGUIENTE DESAFÍO TE ESPERA
            </p>
          </div>

          <div className="levels-stats flex flex-wrap items-center gap-2">
            <div className="levels-stat">
              <span className="pixel-font text-[8px] text-white/55">EXP TEMPORADA</span>
              <span className="pixel-font text-[10px] text-[#e6e9db]">{seasonXp.toLocaleString("es-CO")}</span>
            </div>
            <div className="levels-stat">
              <Image src="/images/currency/peakcoin.webp" alt="PeakCoin" width={30} height={30} className="h-7 w-7 object-contain" />
              <span className="pixel-font text-[10px] text-[#e9d99d]">{coins.toLocaleString("es-CO")}</span>
            </div>
            <div className="levels-stat levels-rank-stat">
              <Image
                src={rankImageFor(rankName)}
                alt={`Rango ${rankName}`}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="pixel-font text-[8px] leading-5 text-white/70">{rankName.toLocaleUpperCase("es-CO")}</span>
            </div>
          </div>
        </header>

        <section className="mt-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="pixel-font text-[9px] leading-6 text-[#b6c5a5]">RUTA 01 · CIENCIAS NATURALES</p>
              <h2 className="pixel-font mt-2 text-[13px] leading-[1.9] text-[#f2edda] sm:text-[16px]">
                El Santuario de la Materia
              </h2>
              <p className="pixel-font mt-2 max-w-2xl text-[9px] leading-[2] text-white/60">
                Explora la materia, resuelve sus misterios y descubre de qué está hecho el mundo.
              </p>
            </div>
            <div className="pixel-font rounded border border-[#c9d5b4]/20 bg-[#0b1020]/75 px-3 py-2 text-[8px] leading-6 text-white/65">
              01 / 04 DESAFÍOS
            </div>
          </div>

          <div className="levels-grid">
            <Link
              href="/aprender/archivo-de-los-enigmas"
              className="level-card level-card-open group"
              aria-label="Abrir desafío 1: El Santuario de la Materia"
            >
              <div className="level-art relative">
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/images/challenges/levels-background.png"
                  aria-label="Escena animada de Nova frente al portal"
                >
                  <source src="/challenges/archivo-enigmas/portal-nova.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d17]/95 via-transparent to-black/15" />
                <div className="absolute left-2 top-1 flex gap-1.5">
                  <span className="pixel-font rounded-sm border border-[#a8e69c]/40 bg-[#13291b]/90 px-2 py-1 text-[6px] text-[#a8e69c]">DISPONIBLE</span>
                  <span className="pixel-font rounded-sm bg-black/65 px-2 py-1 text-[6px] text-white/80">01</span>
                </div>
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                  <span className="pixel-font text-[6px] text-white/75">PROGRESO</span>
                  <span className="pixel-font text-[7px] text-white">0%</span>
                </div>
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/15">
                  <div className="h-full w-0 bg-[#b5e49b]" />
                </div>
              </div>

              <div className="level-card-body">
                <p className="pixel-font text-[6px] leading-4 tracking-[.14em] text-[#8fa7b9]">CIENCIAS NATURALES · HISTORIA INTERACTIVA</p>
                <h3 className="pixel-font mt-2 text-[9px] leading-[1.9] text-white">El Santuario de la Materia</h3>
                <p className="pixel-font mt-2 text-[7px] leading-[2] text-white/60">
                  Investiga cristales misteriosos y aprende a reconocer las propiedades de la materia junto a Nova y Orby.
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="pixel-font rounded-full border border-[#9ecb8a]/15 bg-[#263b2c] px-2.5 py-1.5 text-[6px] text-[#c4ef9d]">
                    NIVEL INICIAL
                  </span>
                  <span className="pixel-font text-[6px] text-white/40">10–15 MIN</span>
                </div>

                <div className="level-reward mt-3 flex items-center gap-2 border-t border-white/[.08] pt-3">
                  <span className="pixel-font flex h-7 w-7 items-center justify-center border border-[#d4bd72]/25 bg-[#4a3a20] text-[7px] text-[#f0d68a]">XP</span>
                  <span className="pixel-font text-[7px] leading-5 text-[#f0d68a]">+25 EXP</span>
                  <span className="pixel-font ml-auto text-[6px] text-white/40">PRIMER DESCUBRIMIENTO</span>
                </div>
                <div className="level-card-cta mt-3 flex items-center justify-center border border-[#a6d18f]/30 bg-[#293e2d] px-3 py-2.5 transition group-hover:bg-[#354f38]">
                  <span className="pixel-font text-[7px] text-[#d7f3c7]">EXPLORAR EL SANTUARIO</span>
                </div>
              </div>
            </Link>

            {LOCKED_LEVELS.map((level) => (
              <article key={level.number} className="level-card level-card-locked" aria-label={`Desafío ${level.number} bloqueado`}>
                <div className="level-art level-art-locked relative">
                  <div className="absolute inset-0 bg-[#111a28]/45" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d17]/95 via-[#090d17]/25 to-[#090d17]/25" />
                  <div className="absolute left-2 top-2">
                    <span className="pixel-font rounded-sm border border-white/15 bg-black/60 px-2 py-1 text-[6px] text-white/55">{level.number}</span>
                  </div>
                  <Image
                    src="/images/ranks/ui/rank-lock.webp"
                    alt="Desafío bloqueado"
                    width={64}
                    height={64}
                    className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 object-contain opacity-90"
                  />
                  <span className="pixel-font absolute inset-x-2 bottom-2 text-center text-[6px] text-white/65">BLOQUEADO</span>
                </div>
                <div className="level-card-body">
                  <p className="pixel-font text-[6px] leading-4 tracking-[.12em] text-white/35">{level.subject}</p>
                  <h3 className="pixel-font mt-2 text-[8px] leading-[2] text-white/65">{level.title}</h3>
                  <p className="pixel-font mt-2 text-[7px] leading-[2] text-white/35">{level.detail}</p>
                  <div className="mt-3 flex items-center gap-2 border-t border-white/[.07] pt-3">
                    <Image src="/images/ranks/ui/rank-lock.webp" alt="" width={17} height={17} className="h-[17px] w-[17px] object-contain opacity-60" />
                    <span className="pixel-font text-[6px] text-white/35">PRÓXIMAMENTE</span>
                  </div>
                  <div className="level-card-locked-cta mt-3 flex items-center justify-center border border-white/[.07] bg-white/[.025] px-3 py-2.5">
                    <span className="pixel-font text-[6px] text-white/30">SUPERA EL ANTERIOR</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="levels-bottom mt-8 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="pixel-font text-[6px] leading-[2.2] text-white/35">
            LAS RECOMPENSAS SE OTORGAN UNA SOLA VEZ POR DESAFÍO COMPLETADO.
          </p>
          <div className="flex items-center gap-2">
            <Image src="/characters/peaky-nova/nova-pixel.webp" alt="Nova" width={34} height={34} className="h-[34px] w-[34px] object-contain" />
            <p className="pixel-font text-[6px] leading-[2] text-white/50">SIGUE AVANZANDO. TU PRÓXIMA VICTORIA TE ESPERA.</p>
          </div>
        </section>
      </div>

      <style>{`
        .levels-page { isolation: isolate; }
        .levels-backdrop {
          position: absolute; inset: 0 0 auto; height: 155px;
          background-image: linear-gradient(180deg, rgba(7,12,22,.08) 0%, rgba(7,12,22,.12) 40%, rgba(8,11,18,.7) 78%, #080b12 100%), url("/images/challenges/levels-background.png");
          background-size: cover; background-position: center 44%; background-repeat: no-repeat;
          opacity: .94; pointer-events: none;
        }
        .levels-shade {
          position: absolute; inset: 0 0 auto; height: 155px; pointer-events: none;
          background: linear-gradient(180deg, rgba(5,8,16,.05) 0%, rgba(5,8,16,.06) 42%, rgba(8,11,18,.55) 78%, #080b12 100%);
        }
        .levels-page, .levels-page * { font-family: var(--font-press-start), monospace; }
        .levels-content { font-size: 10px; }
        .levels-stats { justify-content: flex-end; }
        .levels-stat {
          display: flex; min-height: 50px; align-items: center; gap: 9px;
          border: 1px solid rgba(255,255,255,.12); background: rgba(8,13,24,.78);
          padding: 9px 12px; border-radius: 4px;
        }
        .levels-stat:first-child { flex-direction: column; align-items: flex-start; justify-content: center; gap: 5px; }
        .levels-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 310px));
          align-items: start; gap: 20px;
        }
        .level-card {
          display: block; width: 100%; overflow: hidden; border-radius: 9px;
          border: 1px solid rgba(199,216,198,.16); background: rgba(9,15,29,.97);
          box-shadow: 0 8px 22px rgba(0,0,0,.2); text-decoration: none;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }
        .level-card-open:hover { transform: translateY(-3px); border-color: rgba(177,218,154,.52); box-shadow: 0 12px 28px rgba(0,0,0,.3); }
        .level-art { height: 210px; overflow: hidden; background: #101521; }
        .level-art video { object-fit: cover; object-position: center center; background: #101521; }
        .level-art-locked {
          background-image: linear-gradient(rgba(7,12,22,.45), rgba(7,12,22,.8)), url("/images/challenges/levels-background.png");
          background-size: cover; background-position: center;
          filter: saturate(.58);
        }
        .level-card-body { padding: 15px; }
        .level-card-locked { opacity: .82; }
        .level-card-locked-cta { min-height: 31px; border-radius: 3px; }
        .level-card-cta { min-height: 34px; border-radius: 3px; }
        @media (max-width: 540px) {
          .levels-content { padding-top: 18px; }
          .levels-header h1 { font-size: 11px; }
          .levels-stats { justify-content: flex-start; }
          .levels-stat { padding: 7px; }
          .levels-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .level-art { height: auto; aspect-ratio: 16 / 10; min-height: 108px; }
          .level-art video { object-fit: contain; }
          .level-card-body { padding: 11px; }
          .level-card-body h3 { font-size: 9px; }
          .level-card-body p { overflow-wrap: anywhere; }
          .level-reward { gap: 5px; }
          .level-reward > span:last-child { font-size: 6px; }
          .level-card-cta { min-height: 38px; padding-inline: 6px; }
          .level-card-cta span { font-size: 6px; line-height: 1.9; text-align: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .level-card { transition: none; }
          .level-card-open:hover { transform: none; }
          .level-card video { display: none; }
        }
      `}</style>
    </main>
  );
}

function rankImageFor(rankName: string) {
  const normalized = rankName
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  const aliases: Record<string, string> = {
    "granmaestro": "granmaestro",
    "granmaestrо": "granmaestro",
  };
  const file = aliases[normalized] ?? normalized;
  const valid = [
    "renacer", "aprendiz", "explorador", "competidor", "avanzado",
    "elite", "maestro", "granmaestro", "leyenda", "peak",
  ];
  return valid.includes(file) ? `/images/ranks/${file}.webp` : "/images/ranks/aprendiz.webp";
}
