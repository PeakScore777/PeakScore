/**
 * PeakScore — Constantes globales de gamificación
 *
 * Este archivo centraliza valores generales utilizados por
 * el sistema de progresión, recompensas y economía.
 *
 * IMPORTANTE:
 * - No contiene lógica de negocio.
 * - No accede a Supabase.
 * - No otorga recompensas.
 * - Los valores sensibles/recompensas siempre deben validarse
 *   en servidor.
 */

/* -------------------------------------------------------------------------- */
/* TEMPORADAS                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Duración oficial de una temporada de PeakScore.
 */
export const PEAKSCORE_SEASON_DAYS = 60;

/**
 * Identificador de la versión actual de la economía.
 *
 * Útil para poder reajustar posteriormente la economía sin
 * perder trazabilidad sobre qué configuración recibió cada usuario.
 */
export const GAMIFICATION_ECONOMY_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* PEAK COINS                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Nombre oficial de la moneda virtual.
 */
export const PEAK_COIN_NAME = "Peak Coins";

/**
 * Símbolo textual de Peak Coins.
 *
 * La representación visual oficial será definida posteriormente
 * por el componente de UI.
 */
export const PEAK_COIN_SYMBOL = "P";

/* -------------------------------------------------------------------------- */
/* PROGRESIÓN                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * EXP inicial de temporada.
 */
export const INITIAL_SEASON_XP = 0;

/**
 * EXP histórica inicial.
 */
export const INITIAL_HISTORICAL_XP = 0;

/**
 * Nivel inicial del usuario.
 *
 * IMPORTANTE:
 * Nivel y rango son sistemas independientes.
 */
export const INITIAL_LEVEL = 1;

/* -------------------------------------------------------------------------- */
/* CUENTA NUEVA                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Una cuenta nueva comienza como Aprendiz.
 */
export const NEW_ACCOUNT_RANK = "aprendiz" as const;

/**
 * Un usuario veterano que comienza una nueva temporada
 * comienza como Renacer.
 */
export const VETERAN_SEASON_START_RANK =
  "renacer" as const;

/* -------------------------------------------------------------------------- */
/* RECOMPENSAS                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Valor máximo de una recompensa individual de EXP
 * permitida por la capa normal de gamificación.
 *
 * Las recompensas extraordinarias deberán tener su propia
 * validación explícita en el servidor.
 */
export const MAX_STANDARD_XP_REWARD = 300;

/**
 * Valor mínimo válido de una recompensa.
 */
export const MIN_XP_REWARD = 0;

/**
 * Recompensa máxima estándar de Peak Coins.
 *
 * Este valor no significa que todas las recompensas puedan
 * entregar esta cantidad; solamente establece un límite de
 * seguridad para la economía estándar.
 */
export const MAX_STANDARD_COIN_REWARD = 1000;

/* -------------------------------------------------------------------------- */
/* SEGURIDAD / IDEMPOTENCIA                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Nombre conceptual del sistema de eventos de recompensas.
 *
 * Los eventos reales se almacenarán posteriormente en
 * `reward_events`.
 */
export const REWARD_EVENT_SYSTEM = "reward_events";

/**
 * Una recompensa debe poder identificarse de manera única
 * para evitar que una misma actividad entregue EXP o Coins
 * múltiples veces.
 */
export const REWARD_EVENT_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* ACTIVIDADES                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Identificadores oficiales de actividades que pueden generar
 * recompensas.
 */
export const GAMIFICATION_ACTIVITY_TYPES = {
  LEARN_LEVEL: "learn_level",
  BATTLE: "battle",
  BOSS: "boss",
  SIMPLE_SIMULATION: "simple_simulation",
  FULL_SIMULATION: "full_simulation",
  DAILY_MISSION: "daily_mission",
  STREAK_MILESTONE: "streak_milestone",
  BADGE: "badge",
  WORLD_COMPLETION: "world_completion",
} as const;

export type GamificationActivityType =
  (typeof GAMIFICATION_ACTIVITY_TYPES)[keyof typeof GAMIFICATION_ACTIVITY_TYPES];

/* -------------------------------------------------------------------------- */
/* REGLAS GENERALES                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Abrir la aplicación NO entrega EXP.
 */
export const XP_FOR_APP_OPEN = 0;

/**
 * Abrir el perfil NO entrega EXP.
 */
export const XP_FOR_PROFILE_OPEN = 0;

/**
 * Repetir una actividad ya recompensada NO entrega EXP
 * mediante el mismo evento de recompensa.
 */
export const XP_FOR_DUPLICATE_REWARD = 0;

/**
 * La EXP no puede ser negativa.
 */
export const ALLOW_NEGATIVE_XP = false;

/**
 * Los usuarios no pueden modificar directamente su EXP
 * desde el cliente.
 */
export const CLIENT_CAN_GRANT_XP = false;

/**
 * Los usuarios no pueden modificar directamente sus Peak Coins
 * desde el cliente.
 */
export const CLIENT_CAN_GRANT_COINS = false;