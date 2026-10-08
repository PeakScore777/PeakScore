/**
 * PeakScore — Economía central de EXP
 *
 * IMPORTANTE:
 * - Este archivo define los valores base de EXP.
 * - La EXP debe validarse SIEMPRE en servidor.
 * - El cliente nunca debe poder otorgarse EXP directamente.
 * - La idempotencia y prevención de farming se manejarán
 *   en la capa de servicios/API mediante reward_events.
 *
 * Los valores actuales corresponden a la propuesta inicial
 * del plan de gamificación y podrán reajustarse después
 * de la simulación de una temporada de 60 días.
 */

/* -------------------------------------------------------------------------- */
/* TIPOS                                                                      */
/* -------------------------------------------------------------------------- */

export type SimpleSimulationQuestions = 5 | 10 | 20 | 50;

export type BattleDifficulty =
  | "normal"
  | "advanced"
  | "epic"
  | "world";

export type BadgeDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "epic"
  | "legendary";

/* -------------------------------------------------------------------------- */
/* RECOMPENSAS BASE                                                           */
/* -------------------------------------------------------------------------- */

/**
 * EXP obtenida al completar por primera vez un nivel de aprendizaje.
 */
export const LEARN_LEVEL_XP = 25;

/**
 * EXP de batallas/bosses según dificultad.
 *
 * Estas recompensas son valores base.
 * La capa de recompensas deberá decidir si una actividad
 * ya fue recompensada para evitar farming.
 */
export const BATTLE_XP: Readonly<
  Record<BattleDifficulty, number>
> = {
  normal: 20,
  advanced: 40,
  epic: 75,
  world: 150,
};

/**
 * EXP de simulacros simples según cantidad de preguntas.
 */
export const SIMPLE_SIMULATION_XP: Readonly<
  Record<SimpleSimulationQuestions, number>
> = {
  5: 3,
  10: 6,
  20: 12,
  50: 30,
};

/**
 * EXP base de un simulacro completo.
 */
export const FULL_SIMULATION_XP = 150;

/**
 * EXP de la misión diaria de mini-lección.
 */
export const DAILY_MINI_LESSON_XP = 2;

/* -------------------------------------------------------------------------- */
/* RACHA                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Recompensas por alcanzar determinados hitos de racha.
 *
 * No existe EXP por simplemente abrir la aplicación.
 */
export const STREAK_MILESTONES: readonly {
  days: number;
  xp: number;
}[] = [
  {
    days: 3,
    xp: 6,
  },
  {
    days: 6,
    xp: 12,
  },
  {
    days: 12,
    xp: 25,
  },
  {
    days: 20,
    xp: 40,
  },
  {
    days: 30,
    xp: 75,
  },
  {
    days: 60,
    xp: 150,
  },
  {
    days: 100,
    xp: 300,
  },
] as const;

/* -------------------------------------------------------------------------- */
/* INSIGNIAS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * EXP de las insignias según dificultad.
 *
 * Cada insignia debe entregar su recompensa una sola vez.
 */
export const BADGE_XP: Readonly<
  Record<BadgeDifficulty, number>
> = {
  easy: 10,
  medium: 25,
  hard: 50,
  epic: 100,
  legendary: 250,
};

/* -------------------------------------------------------------------------- */
/* MUNDOS                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Recompensa inicial por completar un mundo.
 */
export const WORLD_COMPLETION_XP = 100;

/* -------------------------------------------------------------------------- */
/* FUNCIONES DE RECOMPENSA                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la EXP correspondiente a un simulacro simple.
 */
export function getSimpleSimulationXp(
  questions: SimpleSimulationQuestions,
): number {
  return SIMPLE_SIMULATION_XP[questions];
}

/**
 * Obtiene la EXP correspondiente a una batalla/boss.
 */
export function getBattleXp(
  difficulty: BattleDifficulty,
): number {
  return BATTLE_XP[difficulty];
}

/**
 * Obtiene la EXP correspondiente a una insignia.
 */
export function getBadgeXp(
  difficulty: BadgeDifficulty,
): number {
  return BADGE_XP[difficulty];
}

/**
 * Obtiene la EXP correspondiente al hito de racha.
 *
 * Si el número de días no coincide exactamente con un hito,
 * devuelve 0.
 *
 * La capa de recompensas puede comparar la racha anterior
 * y la nueva para determinar si se alcanzó un hito.
 */
export function getStreakMilestoneXp(
  days: number,
): number {
  if (!Number.isFinite(days) || days < 0) {
    return 0;
  }

  const milestone = STREAK_MILESTONES.find(
    (item) => item.days === days,
  );

  return milestone?.xp ?? 0;
}

/**
 * Obtiene la EXP de un nivel de aprendizaje.
 *
 * Los niveles repetidos no deberían volver a entregar EXP.
 * Esa validación pertenece al servidor.
 */
export function getLearnLevelXp(): number {
  return LEARN_LEVEL_XP;
}

/**
 * Obtiene la EXP de un simulacro completo.
 *
 * La API debe verificar que el simulacro realmente fue completado
 * y que la recompensa no fue reclamada anteriormente.
 */
export function getFullSimulationXp(): number {
  return FULL_SIMULATION_XP;
}

/**
 * Obtiene la EXP de la misión diaria de mini-lección.
 */
export function getDailyMiniLessonXp(): number {
  return DAILY_MINI_LESSON_XP;
}

/**
 * Obtiene la EXP por completar un mundo.
 *
 * La validación de completado y la prevención de recompensas
 * duplicadas deben realizarse en servidor.
 */
export function getWorldCompletionXp(): number {
  return WORLD_COMPLETION_XP;
}

/* -------------------------------------------------------------------------- */
/* UTILIDADES                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Normaliza una cantidad de EXP.
 *
 * Nunca permite valores negativos o no numéricos.
 */
export function normalizeXp(xp: number): number {
  if (!Number.isFinite(xp)) {
    return 0;
  }

  return Math.max(0, Math.floor(xp));
}

/**
 * Suma EXP de forma segura.
 *
 * Esta función solamente realiza el cálculo.
 * No otorga EXP ni modifica la base de datos.
 */
export function addXp(
  currentXp: number,
  earnedXp: number,
): number {
  return normalizeXp(currentXp) + normalizeXp(earnedXp);
}

/**
 * Calcula la EXP total de varias recompensas.
 *
 * Útil para servicios del servidor que necesiten construir
 * una recompensa compuesta antes de registrarla.
 */
export function sumXp(
  rewards: readonly number[],
): number {
  return rewards.reduce(
    (total, reward) => total + normalizeXp(reward),
    0,
  );
}