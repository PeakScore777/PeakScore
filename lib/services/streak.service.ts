import { supabase } from "@/lib/supabase/browser";

/**
 * Actualiza la racha del usuario autenticado.
 *
 * La fecha se calcula en el servidor usando America/Bogota.
 * La función RPC valida auth.uid() y actualiza únicamente
 * el perfil del usuario autenticado.
 */
export async function updateUserStreak(
  _userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc(
    "update_user_streak"
  );

  if (error) {
    console.error(
      "[PeakScore] Error actualizando racha.",
      {
        errorCode: error.code ?? "UNKNOWN",
      }
    );

    return 0;
  }

  return Number(data ?? 0);
}
