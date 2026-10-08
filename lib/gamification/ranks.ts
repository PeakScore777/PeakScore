/**
 * PeakScore — Sistema central de rangos
 *
 * IMPORTANTE:
 * - El rango competitivo utiliza EXP DE TEMPORADA.
 * - La EXP histórica no determina el rango actual.
 * - Aprendiz es exclusivo para cuentas nuevas.
 * - Renacer es el estado inicial de una nueva temporada
 *   para usuarios que ya participaron anteriormente.
 *
 * Los valores de EXP son la propuesta inicial del plan
 * y podrán modificarse después de la simulación de 60 días.
 */

export type RankId =
  | "renacer"
  | "aprendiz"
  | "explorador"
  | "competidor"
  | "avanzado"
  | "elite"
  | "maestro"
  | "gran-maestro"
  | "leyenda"
  | "peak";

export type RankDefinition = {
  id: RankId;
  name: string;
  minSeasonXp: number;
  maxSeasonXp: number | null;
  identity: string;
  isNewAccountOnly?: boolean;
};

/**
 * Rangos oficiales de PeakScore.
 *
 * Aprendiz no forma parte de la progresión normal de un
 * usuario veterano. Es el rango inicial especial de una
 * cuenta nueva.
 */
export const PEAKSCORE_RANKS: readonly RankDefinition[] = [
  {
    id: "renacer",
    name: "Renacer",
    minSeasonXp: 0,
    maxSeasonXp: 299,
    identity: "El comienzo de un nuevo ascenso.",
  },

  {
    id: "aprendiz",
    name: "Aprendiz",
    minSeasonXp: 0,
    maxSeasonXp: 299,
    identity: "Construyendo las bases del conocimiento.",
    isNewAccountOnly: true,
  },

  {
    id: "explorador",
    name: "Explorador",
    minSeasonXp: 300,
    maxSeasonXp: 649,
    identity: "Descubriendo nuevas habilidades.",
  },

  {
    id: "competidor",
    name: "Competidor",
    minSeasonXp: 650,
    maxSeasonXp: 1099,
    identity: "Demostrando constancia y rendimiento.",
  },

  {
    id: "avanzado",
    name: "Avanzado",
    minSeasonXp: 1100,
    maxSeasonXp: 1599,
    identity: "Alcanzando un nivel superior.",
  },

  {
    id: "elite",
    name: "Élite",
    minSeasonXp: 1600,
    maxSeasonXp: 2149,
    identity: "Entre los estudiantes de mayor rendimiento.",
  },

  {
    id: "maestro",
    name: "Maestro",
    minSeasonXp: 2150,
    maxSeasonXp: 2699,
    identity: "Dominio excepcional del aprendizaje.",
  },

  {
    id: "gran-maestro",
    name: "Gran Maestro",
    minSeasonXp: 2700,
    maxSeasonXp: 3299,
    identity: "Un nivel sobresaliente de progreso.",
  },

  {
    id: "leyenda",
    name: "Leyenda",
    minSeasonXp: 3300,
    maxSeasonXp: 3999,
    identity: "Una trayectoria extraordinaria.",
  },

  {
    id: "peak",
    name: "Peak",
    minSeasonXp: 4000,
    maxSeasonXp: null,
    identity: "El máximo rango de PeakScore.",
  },
] as const;

/**
 * Obtiene el rango competitivo de un usuario.
 *
 * Cuenta nueva:
 * - 0–299 EXP → Aprendiz.
 * - 300+ EXP → entra en la progresión competitiva.
 *
 * Usuario veterano:
 * - 0–299 EXP → Renacer.
 * - 300+ EXP → progresión competitiva normal.
 */
export function getRankBySeasonXp(
  seasonXp: number,
  isNewAccount: boolean,
): RankDefinition {
  const safeXp = Math.max(
    0,
    Number.isFinite(seasonXp) ? seasonXp : 0,
  );

  /**
   * Aprendiz es solamente el rango inicial de una cuenta nueva.
   *
   * Al alcanzar Explorador, la cuenta deja de utilizar
   * Aprendiz como rango.
   */
  if (
    isNewAccount &&
    safeXp < 300
  ) {
    return PEAKSCORE_RANKS.find(
      (rank) => rank.id === "aprendiz",
    )!;
  }

  const competitiveRanks = PEAKSCORE_RANKS.filter(
    (rank) => !rank.isNewAccountOnly,
  );

  return (
    [...competitiveRanks]
      .reverse()
      .find(
        (rank) =>
          safeXp >= rank.minSeasonXp,
      ) ??
    competitiveRanks[0]
  );
}

/**
 * Obtiene el siguiente rango competitivo.
 *
 * Aprendiz → Explorador
 * Renacer → Explorador
 * Explorador → Competidor
 * Competidor → Avanzado
 * Avanzado → Élite
 * Élite → Maestro
 * Maestro → Gran Maestro
 * Gran Maestro → Leyenda
 * Leyenda → Peak
 * Peak → null
 */
export function getNextRank(
  currentRankId: RankId,
): RankDefinition | null {
  const nextRankMap: Partial<
    Record<RankId, RankId>
  > = {
    renacer: "explorador",
    aprendiz: "explorador",
    explorador: "competidor",
    competidor: "avanzado",
    avanzado: "elite",
    elite: "maestro",
    maestro: "gran-maestro",
    "gran-maestro": "leyenda",
    leyenda: "peak",
  };

  const nextId =
    nextRankMap[currentRankId];

  if (!nextId) {
    return null;
  }

  return (
    PEAKSCORE_RANKS.find(
      (rank) => rank.id === nextId,
    ) ?? null
  );
}

/**
 * Calcula el porcentaje de progreso hacia el siguiente rango.
 */
export function getRankProgress(
  seasonXp: number,
  currentRank: RankDefinition,
): number {
  const nextRank = getNextRank(
    currentRank.id,
  );

  if (!nextRank) {
    return 100;
  }

  const safeXp = Math.max(
    0,
    Number.isFinite(seasonXp) ? seasonXp : 0,
  );

  const requiredXp =
    nextRank.minSeasonXp -
    currentRank.minSeasonXp;

  if (requiredXp <= 0) {
    return 100;
  }

  const progress =
    ((safeXp - currentRank.minSeasonXp) /
      requiredXp) *
    100;

  return Math.max(
    0,
    Math.min(100, progress),
  );
}

/**
 * Devuelve cuánto falta para alcanzar el siguiente rango.
 */
export function getXpToNextRank(
  seasonXp: number,
  currentRank: RankDefinition,
): number {
  const nextRank = getNextRank(
    currentRank.id,
  );

  if (!nextRank) {
    return 0;
  }

  const safeXp = Math.max(
    0,
    Number.isFinite(seasonXp) ? seasonXp : 0,
  );

  return Math.max(
    0,
    nextRank.minSeasonXp - safeXp,
  );
}