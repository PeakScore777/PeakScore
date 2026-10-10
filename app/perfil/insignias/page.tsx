
"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

type BadgeItem = {
  id: string;
  name: string;
  image: string;
  activityImage: string;
  color: string;
  category: string;
  description: string;
  requirement: string;
  target: number;
  progress: number;
  unlocked: boolean;
};

type BadgeStyle = CSSProperties & {
  "--badge-color"?: string;
};

const ASSETS = {
  header: "/images/profile/insignias-header-peaky-nova.png",
  lightBackground: "/images/profile/insignias-fondo-claro.png",
  darkBackground: "/images/profile/insignias-fondo-oscuro.png",
  lock: "/images/ranks/ui/rank-lock.webp",
  reward: "/dashboard/premio-pixel.webp",
  streak: "/dashboard/racha-pixel.webp",
  practice: "/peaky/homepage/practica.png",
  simulations: "/peaky/homepage/statslibro.png",
} as const;

/*
 * Diseño inicial. Los valores de progreso se conectarán a la API segura.
 * No se concede ninguna insignia desde el navegador.
 * Los requisitos acordados son:
 * - Aprendizaje I: 5 simulacros simples.
 * - Aprendizaje II: 15 simulacros simples.
 * - Aprendizaje III: 30 simulacros simples.
 * - Constante I: 3 simulacros completos.
 * - Racha I, II y III: 6, 20 y 50 días consecutivos.
 */
const BADGES: BadgeItem[] = [
  {
    id: "aprendizaje-1",
    name: "Aprendizaje I",
    image: "/badges/aprendizaje-1.png",
    activityImage: ASSETS.simulations,
    color: "#62D9FF",
    category: "COLECCIÓN ACADÉMICA",
    description:
      "Toda gran aventura comienza con una decisión. Esta insignia representa tus primeros pasos en PeakScore: enfrentarte a las preguntas, comprobar lo que sabes y convertir la práctica en el comienzo de algo más grande.",
    requirement: "Completa 5 simulacros simples.",
    target: 5,
    progress: 0,
    unlocked: false,
  },
  {
    id: "aprendizaje-2",
    name: "Aprendizaje II",
    image: "/badges/aprendizaje-2.png",
    activityImage: ASSETS.simulations,
    color: "#C09AFF",
    category: "COLECCIÓN ACADÉMICA",
    description:
      "El conocimiento se construye intento a intento. Cada simulacro te permite reconocer tus fortalezas, detectar qué debes mejorar y prepararte para desafíos académicos cada vez mayores.",
    requirement: "Completa 15 simulacros simples.",
    target: 15,
    progress: 0,
    unlocked: false,
  },
  {
    id: "aprendizaje-3",
    name: "Aprendizaje III",
    image: "/badges/aprendizaje-3.png",
    activityImage: ASSETS.simulations,
    color: "#70EDBE",
    category: "COLECCIÓN ACADÉMICA",
    description:
      "Has alcanzado una meta que exige perseverancia. Esta insignia reconoce el camino recorrido a través de la práctica y el compromiso con tu preparación.",
    requirement: "Completa 30 simulacros simples.",
    target: 30,
    progress: 0,
    unlocked: false,
  },
  {
    id: "constante-1",
    name: "Constante I",
    image: "/badges/constante-1.png",
    activityImage: ASSETS.simulations,
    color: "#FF9B51",
    category: "MAESTRÍA EN SIMULACROS",
    description:
      "Los simulacros completos ponen a prueba tu preparación de principio a fin. Esta insignia representa la disciplina de asumir un desafío completo y terminarlo correctamente.",
    requirement: "Completa 3 simulacros completos.",
    target: 3,
    progress: 0,
    unlocked: false,
  },
  {
    id: "racha-1",
    name: "Racha I",
    image: "/badges/racha-1.png",
    activityImage: ASSETS.streak,
    color: "#B3F36B",
    category: "DISCIPLINA Y CONSTANCIA",
    description:
      "La constancia comienza cuando vuelves a estudiar incluso después de un día difícil. Construye una rutina y demuestra que puedes mantener tu compromiso con el aprendizaje.",
    requirement: "Mantén una racha de 6 días consecutivos.",
    target: 6,
    progress: 0,
    unlocked: false,
  },
  {
    id: "racha-2",
    name: "Racha II",
    image: "/badges/racha-2.png",
    activityImage: ASSETS.streak,
    color: "#54CFFF",
    category: "DISCIPLINA Y CONSTANCIA",
    description:
      "Veinte días de constancia son veinte oportunidades de elegir tu crecimiento. Mantén tu hábito, continúa avanzando y convierte el estudio en una parte de tu progreso.",
    requirement: "Mantén una racha de 20 días consecutivos.",
    target: 20,
    progress: 0,
    unlocked: false,
  },
  {
    id: "racha-3",
    name: "Racha III",
    image: "/badges/racha-3.png",
    activityImage: ASSETS.streak,
    color: "#E3A0FF",
    category: "DISCIPLINA Y CONSTANCIA",
    description:
      "Cincuenta días representan un compromiso extraordinario. Esta insignia simboliza la paciencia, la continuidad y las decisiones diarias que te acercan a tus objetivos.",
    requirement: "Mantén una racha de 50 días consecutivos.",
    target: 50,
    progress: 0,
    unlocked: false,
  },
];

function getProgress(badge: BadgeItem) {
  if (badge.target <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (badge.progress / badge.target) * 100),
  );
}

function BadgeCard({
  badge,
  index,
  onClick,
}: {
  badge: BadgeItem;
  index: number;
  onClick: () => void;
}) {
  const progress = getProgress(badge);

  const badgeStyle: BadgeStyle = {
    "--badge-color": badge.color,
    borderColor: badge.unlocked ? `${badge.color}65` : undefined,
    animationDelay: `${Math.min(index * 55, 350)}ms`,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalles de ${badge.name}`}
      className={`badge-card insignias-badge-card badge-card-${badge.id} group relative flex min-w-0 flex-col items-center overflow-hidden rounded-xl border p-3 text-center transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:p-4 ${
        badge.unlocked
          ? "border-white/15 bg-[#0A1A2B]"
          : "border-white/[0.09] bg-[#080F1B]"
      }`}
      style={badgeStyle}
    >
      <span aria-hidden="true" className="badge-card-corners" />
      <span aria-hidden="true" className="badge-card-shine" />

      <div className="relative flex h-[145px] w-full items-center justify-center sm:h-[160px]">
        <span aria-hidden="true" className="badge-card-backplate" />

        <Image
          src={badge.image}
          alt={`Insignia ${badge.name}`}
          width={180}
          height={180}
          sizes="(max-width: 639px) 125px, 150px"
          className={`badge-image relative z-10 h-[120px] w-[120px] object-contain transition duration-300 group-hover:scale-[1.045] sm:h-[145px] sm:w-[145px] ${
            badge.unlocked ? "badge-image-earned" : "badge-image-locked"
          }`}
        />

        {!badge.unlocked && (
          <span className="rank-lock-corner absolute bottom-0 right-0 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#080612]/95 shadow-xl sm:bottom-1 sm:right-1 sm:h-10 sm:w-10">
            <Image
              src={ASSETS.lock}
              alt="Insignia bloqueada"
              width={36}
              height={36}
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
            />
          </span>
        )}
      </div>

      <div className="relative z-10 mt-2 flex min-h-[73px] w-full flex-col items-center">
        <h3 className="text-sm font-extrabold leading-5 text-white sm:text-base">
          {badge.name}
        </h3>

        <p
          className="mt-2 text-[9px] font-bold uppercase tracking-[0.09em]"
          style={{ color: badge.unlocked ? badge.color : "#8795A8" }}
        >
          {badge.unlocked ? "Insignia obtenida" : "Por conseguir"}
        </p>
      </div>

      <div className="relative z-10 mt-3 w-full">
        <div className="h-2 overflow-hidden rounded-full bg-[#223047]">
          <div
            className="badge-progress-fill h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: badge.color,
            }}
          />
        </div>

        <p
          className="pixel-font mt-3 text-[8px]"
          style={{ color: badge.color }}
        >
          {badge.progress}/{badge.target}
        </p>
      </div>

      <span className="relative z-10 mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 transition group-hover:text-white">
        Ver detalles
        <span aria-hidden="true" className="badge-chevron">
          ›
        </span>
      </span>
    </button>
  );
}

function BadgeDetails({
  badge,
  onClose,
}: {
  badge: BadgeItem;
  onClose: () => void;
}) {
  const progress = getProgress(badge);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const badgeStyle: BadgeStyle = {
    "--badge-color": badge.color,
    borderColor: `${badge.color}55`,
    boxShadow: `0 0 60px ${badge.color}12, 0 24px 90px #000A`,
  };

  return createPortal(
    <div
      className="badge-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center overflow-x-hidden overflow-y-auto overscroll-y-contain bg-black/85 p-3 backdrop-blur-lg sm:p-6"
      style={{ WebkitOverflowScrolling: "touch" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-detail-title"
        className={`badge-detail-panel badge-detail-${badge.id} relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl border text-white sm:rounded-3xl ${
          badge.id.startsWith("racha")
            ? "bg-[#080D18]"
            : "bg-[#081321]"
        }`}
        style={badgeStyle}
      >
        <span aria-hidden="true" className="badge-detail-topline" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles"
          className="absolute right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/60 text-2xl text-white transition hover:rotate-90 hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          ×
        </button>

        <div className="relative z-10 grid items-stretch gap-0 md:grid-cols-[0.92fr_1.08fr]">
          <div className="badge-detail-art relative flex min-h-[315px] flex-col items-center justify-center overflow-hidden border-b p-5 sm:min-h-[420px] sm:p-8 md:min-h-[580px] md:border-b-0 md:border-r">
            <span aria-hidden="true" className="badge-art-grid" />
            <span aria-hidden="true" className="badge-art-lines" />
            <span aria-hidden="true" className="badge-art-frame" />
            <span aria-hidden="true" className="badge-art-scan" />

            <p
              className="relative z-10 text-center text-[8px] uppercase tracking-[0.17em] sm:text-[9px]"
              style={{ color: badge.color }}
            >
              PEAKSCORE · ARCHIVO DE LOGRO
            </p>

            <div className="relative z-10 mt-8 flex w-full items-center justify-center">
              <Image
                src={badge.image}
                alt={`Insignia ${badge.name}`}
                width={320}
                height={320}
                sizes="(max-width: 767px) 74vw, 330px"
                className={`badge-detail-emblem h-[210px] w-[210px] object-contain sm:h-[265px] sm:w-[265px] ${
                  badge.unlocked ? "badge-image-earned" : "badge-image-locked"
                }`}
              />
            </div>

            {!badge.unlocked && (
              <div className="rank-lock-corner absolute bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-black/75 shadow-xl sm:bottom-7 sm:right-7">
                <Image
                  src={ASSETS.lock}
                  alt="Insignia bloqueada"
                  width={42}
                  height={42}
                  className="h-10 w-10 object-contain"
                />
              </div>
            )}

            <div
              className="relative z-10 mt-8 flex items-center gap-3 border-y px-5 py-3"
              style={{
                borderColor: `${badge.color}45`,
                backgroundColor: "#050A14AA",
              }}
            >
              <Image
                src={badge.activityImage}
                alt=""
                aria-hidden="true"
                width={46}
                height={46}
                className="h-10 w-10 shrink-0 object-contain"
              />

              <div>
                <p
                  className="pixel-font text-[8px] uppercase leading-4 tracking-wide"
                  style={{ color: badge.color }}
                >
                  {badge.category}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Colección de PeakScore
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-8 lg:p-9">
            <p
              className="text-[8px] uppercase tracking-[0.18em] sm:text-[9px]"
              style={{ color: badge.color }}
            >
              PEAKSCORE / INSIGNIAS
            </p>

            <h2
              id="badge-detail-title"
              className="mt-5 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl"
            >
              {badge.name}
            </h2>

            <p
              className="mt-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: badge.color }}
            >
              {badge.category}
            </p>

            <div
              aria-hidden="true"
              className="badge-detail-divider mt-5 h-[2px] w-full"
              style={{
                background: `linear-gradient(90deg, ${badge.color}, ${badge.color}35, transparent)`,
              }}
            />

            <p className="mt-6 text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              {badge.description}
            </p>

            <div
              className="badge-objective-panel relative mt-7 overflow-hidden rounded-xl border bg-black/20"
              style={{ borderColor: `${badge.color}35` }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: badge.color }}
              />

              <div className="p-4 sm:p-5">
                <p
                  className="pixel-font text-[8px] uppercase tracking-[0.17em] sm:text-[9px]"
                  style={{ color: badge.color }}
                >
                  TU OBJETIVO
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <Image
                    src={ASSETS.practice}
                    alt=""
                    aria-hidden="true"
                    width={66}
                    height={66}
                    className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
                  />

                  <p className="text-sm font-bold leading-6 text-white sm:text-base">
                    {badge.requirement}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-300">
                  Progreso del objetivo
                </p>

                <p
                  className="pixel-font text-[8px]"
                  style={{ color: badge.color }}
                >
                  {badge.progress}/{badge.target}
                </p>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#223047]">
                <div
                  className="badge-progress-fill h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: badge.color,
                  }}
                />
              </div>

              <p className="mt-3 text-[10px] leading-5 text-slate-500">
                El progreso real se mostrará cuando se conecte la verificación
                segura del servidor.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.035] p-4 sm:p-5">
              <Image
                src={ASSETS.reward}
                alt="Recompensa de PeakScore"
                width={62}
                height={62}
                className="h-14 w-14 shrink-0 object-contain"
              />

              <div>
                <p className="pixel-font text-[8px] uppercase tracking-[0.13em] text-amber-200 sm:text-[9px]">
                  RECOMPENSA
                </p>

                <p className="mt-2 text-sm font-bold text-white">
                  Insignia para tu colección
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Se incorporará a tu colección cuando el servidor confirme
                  que cumples todos los requisitos.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <Image
                src={badge.unlocked ? badge.image : ASSETS.lock}
                alt=""
                aria-hidden="true"
                width={38}
                height={38}
                className="h-9 w-9 shrink-0 object-contain"
              />

              <div>
                <p className="text-sm font-extrabold text-white">
                  {badge.unlocked ? "Logro conseguido" : "Desafío pendiente"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Los intentos abandonados o no válidos no deben contar para
                  desbloquear este logro.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl border border-white/15 bg-white/[0.035] px-5 py-3.5 text-sm font-extrabold text-white transition hover:border-white/30 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Volver a las insignias
            </button>
          </div>
        </div>

        <span aria-hidden="true" className="badge-detail-bottomline" />
      </section>
    </div>,
    document.body,
  );
}

export default function InsigniasPage() {
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const closeDetails = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  const unlockedBadges = BADGES.filter((badge) => badge.unlocked);
  const lockedBadges = BADGES.filter((badge) => !badge.unlocked);

  return (
    <main className="insignias-page min-h-screen overflow-x-clip px-3 py-5 text-white transition-colors duration-300 sm:px-5 sm:py-6 lg:px-7 lg:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* ENCABEZADO PROPIO DE INSIGNIAS */}
        <header className="badge-header relative isolate flex min-h-[230px] items-center overflow-hidden rounded-2xl border border-white/10 bg-[#0A1020] sm:min-h-[250px] lg:min-h-[275px]">
          <Image
            src={ASSETS.header}
            alt="Mundo de Peaky Nova y medalla de PeakScore"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1500px"
            className="badge-header-image object-cover object-center"
          />

          <span aria-hidden="true" className="badge-header-overlay" />
          <span aria-hidden="true" className="badge-header-focus" />

          <div className="badge-header-copy relative z-10 ml-[19%] w-[48%] max-w-[650px] py-7 sm:py-9 lg:py-10">
            <p
              className="text-[8px] font-bold uppercase tracking-[0.13em] text-cyan-100 sm:text-[10px] lg:text-xs"
              style={{
                fontFamily: "var(--font-press-start), monospace",
                textShadow: "0 2px 5px #001020, 0 0 15px #001020",
              }}
            >
              PEAKSCORE · COLECCIÓN DE LOGROS
            </p>

            <h1
              className="mt-4 text-xs leading-[1.9] text-[#FFE38A] sm:text-lg sm:leading-[1.8] lg:text-2xl"
              style={{
                fontFamily: "var(--font-press-start), monospace",
                textShadow:
                  "2px 3px 0 #452300, 0 0 18px #F3B83270, 0 3px 10px #000",
              }}
            >
              INSIGNIAS
            </h1>

            <p
              className="mt-4 max-w-[510px] text-[10px] font-semibold leading-5 text-white sm:text-xs sm:leading-6 lg:text-sm"
              style={{ textShadow: "0 2px 5px #000, 0 0 12px #000" }}
            >
              Cada desafío cuenta. Supera tus metas, demuestra lo que sabes
              y construye tu propia historia en PeakScore.
            </p>

            <p
              className="mt-3 text-[9px] font-semibold leading-5 text-cyan-50 sm:text-[10px]"
              style={{ textShadow: "0 2px 5px #000" }}
            >
              Cada logro te acerca a tu mejor versión.
            </p>
          </div>
        </header>

        {/* RESUMEN DE COLECCIÓN */}
        <section className="flex justify-end">
          <div className="insignias-panel flex min-w-[210px] items-center gap-3 rounded-xl border border-amber-300/20 bg-[#101724] p-3">
            <Image
              src={ASSETS.reward}
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
            />

            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Mi colección
              </p>

              <p
                className="mt-2 text-[10px] text-amber-200 sm:text-xs"
                style={{ fontFamily: "var(--font-press-start), monospace" }}
              >
                {unlockedBadges.length}/{BADGES.length}
              </p>
            </div>
          </div>
        </section>

        {/* OBTENIDAS */}
        <section className="insignias-panel rounded-xl border border-emerald-300/15 bg-[#081321]/95 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              className="text-[9px] leading-6 text-emerald-300 sm:text-[10px]"
              style={{ fontFamily: "var(--font-press-start), monospace" }}
            >
              OBTENIDAS
            </h2>

            <span className="text-[10px] text-slate-400 sm:text-xs">
              {unlockedBadges.length} insignias
            </span>
          </div>

          {unlockedBadges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {unlockedBadges.map((badge, index) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  index={index}
                  onClick={() => setSelectedBadge(badge)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-40 flex-col items-center justify-center py-8 text-center">
              <Image
                src={ASSETS.reward}
                alt=""
                aria-hidden="true"
                width={62}
                height={62}
                className="h-14 w-14 object-contain opacity-80"
              />

              <p className="mt-4 text-sm font-extrabold text-slate-200">
                Tu primera insignia te espera
              </p>

              <p className="mt-2 max-w-sm text-xs leading-6 text-slate-500">
                Completa tus desafíos y empieza a construir tu colección.
              </p>
            </div>
          )}
        </section>

        {/* POR CONSEGUIR */}
        <section className="insignias-panel rounded-xl border border-white/10 bg-[#08111E]/95 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2
              className="text-[9px] leading-6 text-sky-300 sm:text-[10px]"
              style={{ fontFamily: "var(--font-press-start), monospace" }}
            >
              POR CONSEGUIR
            </h2>

            <span className="text-[10px] text-slate-400 sm:text-xs">
              {lockedBadges.length} insignias
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {lockedBadges.map((badge, index) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                index={index}
                onClick={() => setSelectedBadge(badge)}
              />
            ))}
          </div>
        </section>

        <p className="px-2 pb-2 text-center text-[9px] leading-5 text-slate-500">
          Los logros se concederán después de verificar su cumplimiento.
        </p>
      </div>

      {selectedBadge && (
        <BadgeDetails
          key={selectedBadge.id}
          badge={selectedBadge}
          onClose={closeDetails}
        />
      )}

      <style jsx>{`
        .badge-header-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            rgba(3, 10, 22, 0.05) 0%,
            rgba(3, 10, 22, 0.32) 20%,
            rgba(3, 10, 22, 0.6) 39%,
            rgba(3, 10, 22, 0.37) 61%,
            rgba(3, 10, 22, 0.04) 81%
          );
        }

        .badge-header-focus {
          position: absolute;
          top: -15%;
          bottom: -15%;
          left: 17%;
          right: 29%;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(3, 10, 22, 0.38) 0%,
            rgba(3, 10, 22, 0.2) 52%,
            transparent 78%
          );
          filter: blur(8px);
        }

        .badge-header-copy {
          text-wrap: pretty;
        }

        .badge-card {
          animation: badge-card-enter 380ms ease-out both;
        }

        .badge-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 14px 35px rgba(0, 0, 0, 0.23),
            0 0 22px color-mix(in srgb, var(--badge-color) 8%, transparent);
        }

        .badge-card-corners {
          position: absolute;
          inset: 7px;
          pointer-events: none;
          opacity: 0.28;
          background:
            linear-gradient(var(--badge-color), var(--badge-color)) top left / 17px 1px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) top left / 1px 17px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) top right / 17px 1px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) top right / 1px 17px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) bottom left / 17px 1px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) bottom left / 1px 17px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) bottom right / 17px 1px no-repeat,
            linear-gradient(var(--badge-color), var(--badge-color)) bottom right / 1px 17px no-repeat;
          transition: opacity 250ms ease;
        }

        .badge-card:hover .badge-card-corners {
          opacity: 0.85;
        }

        .badge-card-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          background: linear-gradient(
            115deg,
            transparent 25%,
            rgba(255, 255, 255, 0.07) 48%,
            transparent 68%
          );
          background-size: 230% 100%;
          transition: opacity 250ms ease;
        }

        .badge-card-backplate {
          position: absolute;
          inset: 12%;
          pointer-events: none;
          clip-path: polygon(
            50% 0%,
            88% 14%,
            100% 50%,
            88% 86%,
            50% 100%,
            12% 86%,
            0% 50%,
            12% 14%
          );
          border: 1px solid color-mix(in srgb, var(--badge-color) 30%, transparent);
          background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--badge-color) 12%, transparent),
            transparent 74%
          );
        }

        .badge-image {
          filter: drop-shadow(0 9px 12px rgba(0, 0, 0, 0.32));
        }

        .badge-image-earned {
          filter: drop-shadow(
            0 0 10px color-mix(in srgb, var(--badge-color) 32%, transparent)
          );
        }

        .badge-image-locked {
          filter: grayscale(1) brightness(0.53) contrast(0.94);
        }

        .badge-card:hover .badge-card-shine {
          opacity: 1;
          animation: badge-card-shimmer 900ms ease-out;
        }

        .badge-chevron {
          font-size: 22px;
          line-height: 10px;
          transition: transform 180ms ease;
        }

        .badge-card:hover .badge-chevron {
          transform: translateX(3px);
        }

        .badge-progress-fill {
          box-shadow: 0 0 12px
            color-mix(in srgb, var(--badge-color) 28%, transparent);
        }

        .rank-lock-corner {
          animation: rank-lock-settle 450ms ease-out both;
        }

        .badge-modal-backdrop {
          animation: badge-backdrop-enter 180ms ease-out both;
        }

        .badge-detail-panel {
          animation: badge-panel-enter 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .badge-detail-topline,
        .badge-detail-bottomline {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            var(--badge-color),
            transparent
          );
          opacity: 0.9;
        }

        .badge-detail-topline {
          top: 0;
        }

        .badge-detail-bottomline {
          bottom: 0;
        }

        .badge-detail-art {
          isolation: isolate;
          background: linear-gradient(
            145deg,
            #080e1a,
            #0b1827 50%,
            #050a14
          );
        }

        .badge-art-grid {
          position: absolute;
          inset: 0;
          z-index: -3;
          opacity: 0.19;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(180deg, black, transparent 95%);
        }

        .badge-art-lines {
          position: absolute;
          inset: -30%;
          z-index: -2;
          pointer-events: none;
          opacity: 0.5;
          background: repeating-linear-gradient(
            135deg,
            transparent 0 42px,
            color-mix(in srgb, var(--badge-color) 10%, transparent) 43px 44px,
            transparent 45px 86px
          );
          animation: badge-lines-drift 24s linear infinite;
        }

        .badge-art-frame {
          position: absolute;
          inset: 17px;
          pointer-events: none;
          border: 1px solid
            color-mix(in srgb, var(--badge-color) 20%, transparent);
          clip-path: polygon(
            0 0,
            26% 0,
            26% 2px,
            74% 2px,
            74% 0,
            100% 0,
            100% 26%,
            calc(100% - 2px) 26%,
            calc(100% - 2px) 74%,
            100% 74%,
            100% 100%,
            74% 100%,
            74% calc(100% - 2px),
            26% calc(100% - 2px),
            26% 100%,
            0 100%,
            0 74%,
            2px 74%,
            2px 26%,
            0 26%
          );
        }

        .badge-art-scan {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          opacity: 0.3;
          background: linear-gradient(
            180deg,
            transparent 0%,
            color-mix(in srgb, var(--badge-color) 13%, transparent) 50%,
            transparent 100%
          );
          background-size: 100% 34%;
          background-repeat: no-repeat;
          animation: badge-scan 7s linear infinite;
        }

        .badge-detail-emblem {
          filter: drop-shadow(0 16px 18px rgba(0, 0, 0, 0.4));
          animation: badge-emblem-enter 750ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .badge-objective-panel {
          box-shadow: inset 0 0 25px
            color-mix(in srgb, var(--badge-color) 4%, transparent);
        }

        .badge-detail-divider {
          background-size: 200% 100%;
          animation: badge-divider-flow 6s linear infinite;
        }

        .badge-detail-aprendizaje-1 .badge-art-lines {
          background: repeating-linear-gradient(
            135deg,
            transparent 0 46px,
            rgba(98, 217, 255, 0.16) 47px 48px,
            transparent 49px 92px
          );
          opacity: 0.7;
        }

        .badge-detail-aprendizaje-2 .badge-art-lines {
          background: repeating-linear-gradient(
            45deg,
            transparent 0 32px,
            rgba(192, 154, 255, 0.15) 33px 34px,
            transparent 35px 70px
          );
        }

        .badge-detail-aprendizaje-3 .badge-art-lines {
          background: repeating-linear-gradient(
            -45deg,
            transparent 0 38px,
            rgba(112, 237, 190, 0.16) 39px 40px,
            transparent 41px 78px
          );
        }

        .badge-detail-constante-1 .badge-art-lines {
          background: repeating-linear-gradient(
            120deg,
            transparent 0 26px,
            rgba(255, 155, 81, 0.16) 27px 28px,
            transparent 29px 56px
          );
          opacity: 0.72;
        }

        .badge-detail-racha-1 .badge-art-lines,
        .badge-detail-racha-2 .badge-art-lines,
        .badge-detail-racha-3 .badge-art-lines {
          background: repeating-linear-gradient(
            90deg,
            transparent 0 34px,
            color-mix(in srgb, var(--badge-color) 16%, transparent) 35px 36px,
            transparent 37px 72px
          );
        }

        .badge-detail-racha-2 .badge-art-frame {
          inset: 25px;
          border-width: 2px;
          transform: skewY(-2deg);
        }

        .badge-detail-racha-3 .badge-art-frame {
          inset: 30px 14px;
          border-width: 2px;
          transform: skewY(2deg);
          box-shadow: inset 0 0 20px
            color-mix(in srgb, var(--badge-color) 10%, transparent);
        }

        @keyframes badge-card-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes badge-card-shimmer {
          from {
            background-position: 100% 0;
          }
          to {
            background-position: -130% 0;
          }
        }

        @keyframes rank-lock-settle {
          from {
            opacity: 0;
            transform: scale(0.75) rotate(-12deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes badge-backdrop-enter {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes badge-panel-enter {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.975);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes badge-emblem-enter {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(7px);
          }
          70% {
            opacity: 1;
            transform: scale(1.045) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes badge-lines-drift {
          from {
            transform: translate3d(-3%, -2%, 0);
          }
          to {
            transform: translate3d(3%, 2%, 0);
          }
        }

        @keyframes badge-scan {
          0% {
            background-position: 0 -35%;
          }
          100% {
            background-position: 0 135%;
          }
        }

        @keyframes badge-divider-flow {
          from {
            background-position: 100% 0;
          }
          to {
            background-position: -100% 0;
          }
        }

        @media (max-width: 639px) {
          .badge-header {
            min-height: 285px;
            align-items: flex-end;
          }

          .badge-header-image {
            object-position: center;
          }

          .badge-header-overlay {
            background: linear-gradient(
              180deg,
              rgba(3, 10, 22, 0.02) 0%,
              rgba(3, 10, 22, 0.04) 25%,
              rgba(3, 10, 22, 0.65) 64%,
              rgba(3, 10, 22, 0.88) 100%
            );
          }

          .badge-header-focus {
            inset: 35% 0 0;
            background: linear-gradient(
              180deg,
              transparent,
              rgba(3, 10, 22, 0.5)
            );
            filter: none;
          }

          .badge-header-copy {
            width: 100%;
            max-width: none;
            margin-left: 0;
            padding: 75px 16px 17px;
          }

          .badge-header-copy h1 {
            margin-top: 8px;
          }

          .badge-header-copy p {
            max-width: 430px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .badge-card,
          .badge-card-shine,
          .badge-art-lines,
          .badge-art-scan,
          .rank-lock-corner,
          .badge-modal-backdrop,
          .badge-detail-panel,
          .badge-detail-emblem,
          .badge-detail-divider {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
