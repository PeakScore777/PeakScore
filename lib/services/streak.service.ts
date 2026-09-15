import { supabase } from "@/lib/supabase/browser";

/**
 * Obtiene la fecha actual en Colombia.
 *
 * Usamos America/Bogota para evitar problemas con UTC.
 */
function getTodayColombia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Devuelve la fecha anterior a una fecha determinada.
 */
function getPreviousDay(dateString: string): string {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() - 1);

  return date
    .toISOString()
    .slice(0, 10);
}

/**
 * Actualiza la racha del usuario al iniciar sesión.
 *
 * Reglas:
 * - Primer inicio registrado → racha 1
 * - Mismo día → no cambia
 * - Día siguiente → +1
 * - Después de saltarse un día → vuelve a 1
 */
export async function updateUserStreak(
  userId: string
): Promise<number> {
  const today = getTodayColombia();

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("streak, last_login_date")
      .eq("id", userId)
      .maybeSingle();

  if (profileError) {
    console.error(
      "[PeakScore] Error obteniendo racha:",
      profileError
    );

    return 0;
  }

  if (!profile) {
    console.error(
      "[PeakScore] No se encontró el perfil del usuario."
    );

    return 0;
  }

  const currentStreak = profile.streak ?? 0;
  const lastLoginDate = profile.last_login_date;

  /*
   * ==========================================================
   * PRIMER INICIO DE SESIÓN
   * ==========================================================
   */

  if (!lastLoginDate) {
    const newStreak = 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        streak: newStreak,
        last_login_date: today,
      })
      .eq("id", userId);

    if (error) {
      console.error(
        "[PeakScore] Error creando racha:",
        error
      );

      return currentStreak;
    }

    return newStreak;
  }

  /*
   * ==========================================================
   * YA INICIÓ SESIÓN HOY
   * ==========================================================
   */

  if (lastLoginDate === today) {
    return currentStreak;
  }

  /*
   * ==========================================================
   * INICIÓ SESIÓN AYER
   * ==========================================================
   */

  const yesterday = getPreviousDay(today);

  if (lastLoginDate === yesterday) {
    const newStreak = currentStreak + 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        streak: newStreak,
        last_login_date: today,
      })
      .eq("id", userId);

    if (error) {
      console.error(
        "[PeakScore] Error aumentando racha:",
        error
      );

      return currentStreak;
    }

    return newStreak;
  }

  /*
   * ==========================================================
   * SE ROMPIÓ LA RACHA
   * ==========================================================
   */

  const newStreak = 1;

  const { error } = await supabase
    .from("profiles")
    .update({
      streak: newStreak,
      last_login_date: today,
    })
    .eq("id", userId);

  if (error) {
    console.error(
      "[PeakScore] Error reiniciando racha:",
      error
    );

    return currentStreak;
  }

  return newStreak;
}