/**
 * PeakScore — Sistema de temporadas
 *
 * Reglas:
 * - Una temporada dura 60 días.
 * - La EXP histórica nunca se reinicia.
 * - La EXP de temporada sí se reinicia.
 * - Las cuentas nuevas comienzan como Aprendiz.
 * - Los usuarios veteranos comienzan una nueva temporada como Renacer.
 * - Aprendiz es exclusivo del primer ciclo de una cuenta.
 *
 * IMPORTANTE:
 * Este archivo contiene lógica pura.
 * No accede a Supabase ni modifica datos.
 */

import type { RankId } from "./ranks";

/* -------------------------------------------------------------------------- */
/* CONFIGURACIÓN                                                              */
/* -------------------------------------------------------------------------- */

export const SEASON_DURATION_DAYS = 60;

/**
 * Duración aproximada de una temporada en milisegundos.
 *
 * Se utiliza únicamente para cálculos de fechas.
 */
export const SEASON_DURATION_MS =
  SEASON_DURATION_DAYS *
  24 *
  60 *
  60 *
  1000;

/* -------------------------------------------------------------------------- */
/* TIPOS                                                                      */
/* -------------------------------------------------------------------------- */

export type SeasonStatus =
  | "upcoming"
  | "active"
  | "finished";

export type SeasonProgress = {
  elapsedDays: number;
  remainingDays: number;
  progressPercent: number;
};

export type SeasonSnapshot = {
  seasonNumber: number;
  startedAt: Date;
  endsAt: Date;
  status: SeasonStatus;
};

export type SeasonResetResult = {
  seasonXp: number;
  startingRank: RankId;
};

/* -------------------------------------------------------------------------- */
/* FECHAS                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Calcula la fecha de finalización de una temporada.
 */
export function getSeasonEndDate(
  startedAt: Date,
): Date {
  return new Date(
    startedAt.getTime() +
      SEASON_DURATION_MS,
  );
}

/**
 * Comprueba si una fecha es válida.
 */
function isValidDate(date: Date): boolean {
  return (
    date instanceof Date &&
    !Number.isNaN(date.getTime())
  );
}

/* -------------------------------------------------------------------------- */
/* ESTADO DE TEMPORADA                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Determina el estado actual de una temporada.
 */
export function getSeasonStatus(
  startedAt: Date,
  endsAt: Date,
  now: Date = new Date(),
): SeasonStatus {
  if (
    !isValidDate(startedAt) ||
    !isValidDate(endsAt) ||
    !isValidDate(now)
  ) {
    return "finished";
  }

  if (now.getTime() < startedAt.getTime()) {
    return "upcoming";
  }

  if (now.getTime() >= endsAt.getTime()) {
    return "finished";
  }

  return "active";
}

/**
 * Comprueba si la temporada terminó.
 */
export function isSeasonFinished(
  endsAt: Date,
  now: Date = new Date(),
): boolean {
  if (
    !isValidDate(endsAt) ||
    !isValidDate(now)
  ) {
    return true;
  }

  return now.getTime() >= endsAt.getTime();
}

/* -------------------------------------------------------------------------- */
/* PROGRESO                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Calcula el progreso de una temporada de 0 a 100%.
 */
export function getSeasonProgress(
  startedAt: Date,
  endsAt: Date,
  now: Date = new Date(),
): SeasonProgress {
  if (
    !isValidDate(startedAt) ||
    !isValidDate(endsAt) ||
    !isValidDate(now)
  ) {
    return {
      elapsedDays: 0,
      remainingDays: 0,
      progressPercent: 0,
    };
  }

  const totalDuration =
    endsAt.getTime() -
    startedAt.getTime();

  if (totalDuration <= 0) {
    return {
      elapsedDays: 0,
      remainingDays: 0,
      progressPercent: 100,
    };
  }

  const elapsed =
    now.getTime() -
    startedAt.getTime();

  const clampedElapsed = Math.max(
    0,
    Math.min(elapsed, totalDuration),
  );

  const elapsedDays =
    Math.floor(
      clampedElapsed /
        (24 * 60 * 60 * 1000),
    );

  const remainingDays =
    Math.max(
      0,
      Math.ceil(
        (totalDuration -
          clampedElapsed) /
          (24 * 60 * 60 * 1000),
      ),
    );

  const progressPercent =
    (clampedElapsed /
      totalDuration) *
    100;

  return {
    elapsedDays,
    remainingDays,
    progressPercent: Math.max(
      0,
      Math.min(100, progressPercent),
    ),
  };
}

/**
 * Obtiene los días restantes de una temporada.
 */
export function getRemainingSeasonDays(
  endsAt: Date,
  now: Date = new Date(),
): number {
  if (
    !isValidDate(endsAt) ||
    !isValidDate(now)
  ) {
    return 0;
  }

  const difference =
    endsAt.getTime() -
    now.getTime();

  if (difference <= 0) {
    return 0;
  }

  return Math.ceil(
    difference /
      (24 * 60 * 60 * 1000),
  );
}

/* -------------------------------------------------------------------------- */
/* TEMPORADA                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Crea una representación de temporada.
 */
export function createSeason(
  seasonNumber: number,
  startedAt: Date,
): SeasonSnapshot {
  const safeSeasonNumber =
    Number.isFinite(seasonNumber) &&
    seasonNumber > 0
      ? Math.floor(seasonNumber)
      : 1;

  const safeStartedAt =
    isValidDate(startedAt)
      ? new Date(startedAt)
      : new Date();

  const endsAt =
    getSeasonEndDate(safeStartedAt);

  return {
    seasonNumber: safeSeasonNumber,
    startedAt: safeStartedAt,
    endsAt,
    status: getSeasonStatus(
      safeStartedAt,
      endsAt,
    ),
  };
}

/**
 * Obtiene el número de la siguiente temporada.
 */
export function getNextSeasonNumber(
  currentSeasonNumber: number,
): number {
  if (
    !Number.isFinite(
      currentSeasonNumber,
    ) ||
    currentSeasonNumber < 1
  ) {
    return 1;
  }

  return (
    Math.floor(currentSeasonNumber) + 1
  );
}

/* -------------------------------------------------------------------------- */
/* RESET                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Determina el estado inicial de una cuenta al comenzar
 * una nueva temporada.
 *
 * Cuenta nueva:
 *   Aprendiz
 *
 * Usuario veterano:
 *   Renacer
 *
 * La EXP de temporada comienza nuevamente en 0.
 *
 * La EXP histórica NO se modifica aquí.
 */
export function getSeasonResetResult(
  hasParticipatedBefore: boolean,
): SeasonResetResult {
  if (!hasParticipatedBefore) {
    return {
      seasonXp: 0,
      startingRank: "aprendiz",
    };
  }

  return {
    seasonXp: 0,
    startingRank: "renacer",
  };
}

/**
 * Determina si una cuenta debe considerarse veterana
 * para efectos del sistema de temporadas.
 */
export function isVeteranAccount(
  hasParticipatedBefore: boolean,
): boolean {
  return hasParticipatedBefore;
}

/* -------------------------------------------------------------------------- */
/* EXP HISTÓRICA VS EXP DE TEMPORADA                                          */
/* -------------------------------------------------------------------------- */

/**
 * Representa las dos bolsas de EXP de PeakScore.
 *
 * historicalXp:
 *   Progreso acumulado de toda la trayectoria.
 *
 * seasonXp:
 *   EXP utilizada para determinar el rango de la temporada actual.
 */
export type XpState = {
  historicalXp: number;
  seasonXp: number;
};

/**
 * Normaliza el estado de EXP.
 */
export function normalizeXpState(
  state: XpState,
): XpState {
  return {
    historicalXp: normalizeValue(
      state.historicalXp,
    ),
    seasonXp: normalizeValue(
      state.seasonXp,
    ),
  };
}

/**
 * Reinicia únicamente la EXP de temporada.
 *
 * La EXP histórica permanece intacta.
 */
export function resetSeasonXp(
  state: XpState,
): XpState {
  return {
    historicalXp: normalizeValue(
      state.historicalXp,
    ),
    seasonXp: 0,
  };
}

/**
 * Añade EXP tanto al historial como a la temporada.
 *
 * La recompensa debe haber sido validada previamente
 * por el servidor.
 */
export function applyXpReward(
  state: XpState,
  earnedXp: number,
): XpState {
  const safeState =
    normalizeXpState(state);

  const safeReward =
    normalizeValue(earnedXp);

  return {
    historicalXp:
      safeState.historicalXp +
      safeReward,

    seasonXp:
      safeState.seasonXp +
      safeReward,
  };
}

/* -------------------------------------------------------------------------- */
/* UTILIDADES                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Evita valores negativos, NaN e Infinity.
 */
function normalizeValue(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(value),
  );
}