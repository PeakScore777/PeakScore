/**
 * PeakScore — Servicio de temporadas
 *
 * Responsabilidades:
 * - Obtener la temporada activa.
 * - Obtener la participación actual del usuario.
 * - Determinar el contexto de temporada.
 * - Delegar la creación segura de la participación
 *   a PostgreSQL mediante una función RPC.
 *
 * IMPORTANTE:
 * - Este archivo se ejecuta únicamente en servidor.
 * - No debe importarse desde componentes cliente.
 * - La base de datos es la fuente de verdad para la
 *   participación y el rango inicial.
 */

import { createClient } from "@/lib/supabase/server";
import type { RankId } from "./ranks";

/* -------------------------------------------------------------------------- */
/* TIPOS                                                                      */
/* -------------------------------------------------------------------------- */

export type ActiveSeason = {
  id: string;
  seasonNumber: number;
  name: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "active" | "finished";
};

export type UserSeasonParticipation = {
  id: string;
  userId: string;
  seasonId: string;
  seasonXp: number;
  startingRank: RankId;
  participatedAt: string;
  completedAt: string | null;
};

/* -------------------------------------------------------------------------- */
/* TEMPORADA ACTIVA                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la temporada activa actual de PeakScore.
 */
export async function getActiveSeason(): Promise<ActiveSeason | null> {
  const supabase = await createClient();

  const {
    data: season,
    error,
  } = await supabase
    .from("seasons")
    .select(`
      id,
      season_number,
      name,
      starts_at,
      ends_at,
      status
    `)
    .eq("status", "active")
    .order("season_number", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Active season query error:",
      error,
    );

    throw new Error(
      "No se pudo obtener la temporada activa.",
    );
  }

  if (!season) {
    return null;
  }

  return {
    id: season.id,
    seasonNumber: season.season_number,
    name: season.name,
    startsAt: season.starts_at,
    endsAt: season.ends_at,
    status: season.status,
  };
}

/* -------------------------------------------------------------------------- */
/* PARTICIPACIÓN DEL USUARIO                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la participación de un usuario en una temporada concreta.
 */
export async function getUserSeasonParticipation(
  userId: string,
  seasonId: string,
): Promise<UserSeasonParticipation | null> {
  const supabase = await createClient();

  const {
    data: participation,
    error,
  } = await supabase
    .from("user_seasons")
    .select(`
      id,
      user_id,
      season_id,
      season_xp,
      starting_rank,
      participated_at,
      completed_at
    `)
    .eq("user_id", userId)
    .eq("season_id", seasonId)
    .maybeSingle();

  if (error) {
    console.error(
      "User season query error:",
      error,
    );

    throw new Error(
      "No se pudo obtener la participación del usuario.",
    );
  }

  if (!participation) {
    return null;
  }

  return {
    id: participation.id,
    userId: participation.user_id,
    seasonId: participation.season_id,
    seasonXp: participation.season_xp,
    startingRank:
      participation.starting_rank as RankId,
    participatedAt:
      participation.participated_at,
    completedAt:
      participation.completed_at,
  };
}

/* -------------------------------------------------------------------------- */
/* HISTORIAL DEL USUARIO                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Determina si el usuario ya participó anteriormente
 * en alguna temporada.
 *
 * Esta función solamente consulta.
 * No modifica datos.
 */
export async function hasUserParticipatedBefore(
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: previousSeason,
    error,
  } = await supabase
    .from("user_seasons")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Previous season query error:",
      error,
    );

    throw new Error(
      "No se pudo comprobar el historial de temporadas.",
    );
  }

  return Boolean(previousSeason);
}

/* -------------------------------------------------------------------------- */
/* RANGO INICIAL                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Determina el rango inicial de una temporada.
 *
 * Cuenta nueva:
 *   Aprendiz
 *
 * Usuario veterano:
 *   Renacer
 *
 * La función SQL también aplica esta regla.
 * Esta función queda como representación de la regla
 * dentro de la capa de aplicación.
 */
export function getStartingRank(
  hasParticipatedBeforeValue: boolean,
): RankId {
  return hasParticipatedBeforeValue
    ? "renacer"
    : "aprendiz";
}

/* -------------------------------------------------------------------------- */
/* PARTICIPACIÓN ACTUAL                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Garantiza que el usuario tenga una participación
 * en la temporada activa.
 *
 * La creación real se delega a:
 *
 * public.ensure_current_user_season()
 *
 * Esto evita confiar en valores enviados por el cliente.
 */
export async function ensureCurrentSeasonParticipation(
  userId: string,
): Promise<{
  season: ActiveSeason;
  participation: UserSeasonParticipation;
}> {
  const supabase = await createClient();

  const season = await getActiveSeason();

  if (!season) {
    throw new Error(
      "No existe una temporada activa.",
    );
  }

  /**
   * Primero comprobamos si ya existe la participación.
   *
   * Esto evita ejecutar la función SQL innecesariamente
   * en la mayoría de las solicitudes.
   */
  const existingParticipation =
    await getUserSeasonParticipation(
      userId,
      season.id,
    );

  if (existingParticipation) {
    return {
      season,
      participation: existingParticipation,
    };
  }

  /**
   * La función SQL obtiene auth.uid() directamente.
   *
   * Por seguridad, verificamos que el usuario solicitado
   * coincida con la sesión autenticada.
   */
  const {
    data: {
      user: authenticatedUser,
    },
  } = await supabase.auth.getUser();

  if (
    !authenticatedUser ||
    authenticatedUser.id !== userId
  ) {
    throw new Error(
      "No autorizado para acceder a esta participación.",
    );
  }

  /**
   * PostgreSQL determina:
   *
   * - si el usuario es nuevo;
   * - si ya participó anteriormente;
   * - su rango inicial;
   * - la temporada correspondiente;
   * - y crea el registro de forma segura.
   */
  const {
    data: createdParticipation,
    error: rpcError,
  } = await supabase.rpc(
    "ensure_current_user_season",
  );

  if (rpcError) {
    console.error(
      "Ensure current season RPC error:",
      rpcError,
    );

    throw new Error(
      "No se pudo registrar al usuario en la temporada.",
    );
  }

  if (!createdParticipation) {
    throw new Error(
      "La participación de temporada no fue creada.",
    );
  }

  return {
    season,
    participation: {
      id: createdParticipation.id,
      userId: createdParticipation.user_id,
      seasonId: createdParticipation.season_id,
      seasonXp: createdParticipation.season_xp,
      startingRank:
        createdParticipation.starting_rank as RankId,
      participatedAt:
        createdParticipation.participated_at,
      completedAt:
        createdParticipation.completed_at,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* CONTEXTO ACTUAL                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la temporada activa y la participación actual
 * del usuario.
 *
 * Esta será la función principal utilizada posteriormente
 * por las APIs de PeakScore.
 */
export async function getCurrentSeasonContext(
  userId: string,
): Promise<{
  season: ActiveSeason;
  participation: UserSeasonParticipation;
}> {
  return ensureCurrentSeasonParticipation(
    userId,
  );
}