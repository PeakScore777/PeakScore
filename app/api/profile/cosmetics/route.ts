import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOriginMutation, readBodyWithinLimit } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_SAFE_COSMETIC_ID = /^[a-z][a-z0-9_-]{1,63}$/;
const SLOTS = ["avatar_frame", "profile_banner", "profile_effect", "nameplate", "profile_theme"] as const;
type Slot = typeof SLOTS[number];

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Debes iniciar sesión.", 401);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,profile_banner_url,profile_bio,profile_pronouns,level,xp,selected_character")
      .eq("id", user.id)
      .single();

    if (error || !profile) return fail("No se pudo cargar tu perfil.", 503);

    return NextResponse.json({
      profile: {
        id: profile.id,
        displayName: profile.full_name ?? "",
        avatarUrl: profile.avatar_url,
        bannerUrl: profile.profile_banner_url,
        bio: profile.profile_bio ?? "",
        pronouns: profile.profile_pronouns ?? "",
        level: Number(profile.level ?? 1),
        xp: Number(profile.xp ?? 0),
        selectedCharacter: profile.selected_character ?? null,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[PeakStyle] Failed to load profile editor.", error);
    return fail("No se pudo cargar tu perfil.", 503);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const raw = await readBodyWithinLimit(request, 4_096);
  if (raw === null) return fail("La solicitud supera el tamaño permitido o no es válida.", 413);

  let payload: { action?: unknown; cosmeticId?: unknown; slot?: unknown };
  try {
    payload = JSON.parse(raw);
  } catch {
    return fail("El formato de la solicitud no es válido.", 400);
  }

  const action = payload.action;
  const cosmeticId = typeof payload.cosmeticId === "string" ? payload.cosmeticId : "";
  if (action !== "updateProfile" && !UUID_SAFE_COSMETIC_ID.test(cosmeticId)) return fail("El objeto no es válido.", 400);

  if (action === "updateProfile") {
    const rawPayload = payload as typeof payload & { displayName?: unknown; bio?: unknown; pronouns?: unknown };
    const name = typeof rawPayload.displayName === "string" ? rawPayload.displayName.trim() : "";
    const bio = typeof rawPayload.bio === "string" ? rawPayload.bio.trim() : "";
    const pronouns = typeof rawPayload.pronouns === "string" ? rawPayload.pronouns.trim() : "";
    if (name.length < 2 || name.length > 32 || bio.length > 160 || pronouns.length > 32) {
      return fail("Revisa los límites del nombre, descripción y pronombres.", 400);
    }
    if (/[<>]/.test(name + bio + pronouns)) return fail("No se permite HTML en el perfil.", 400);

    const { data, error } = await supabase.rpc("update_my_peakstyle_profile", {
      p_display_name: name,
      p_bio: bio,
      p_pronouns: pronouns,
    });
    if (error) {
      if (error.code === "22023") return fail("Los datos del perfil no son válidos.", 400);
      console.error("[PeakStyle] Profile update failed.", { code: error.code });
      return fail("No se pudo guardar el perfil.", 503);
    }
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      success: true,
      profile: {
        displayName: result?.display_name ?? name,
        bio: result?.profile_bio ?? bio,
        pronouns: result?.profile_pronouns ?? pronouns,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  }

  if (action === "purchase") {
    const { data, error } = await supabase.rpc("purchase_profile_cosmetic", { p_cosmetic_id: cosmeticId });
    if (error) {
      if (error.code === "P0001") return fail("No tienes suficientes PeakCoins.", 409);
      if (error.code === "P0002") return fail("Este objeto ya no está disponible.", 404);
      if (error.code === "42501") return fail("No se pudo autorizar la compra.", 403);
      console.error("[PeakStyle] Cosmetic purchase failed.", { code: error.code });
      return fail("No se pudo completar la compra.", 503);
    }
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      success: true,
      alreadyOwned: result?.success === false,
      coins: result?.new_balance,
      cosmeticId: result?.owned_cosmetic_id,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  if (action === "equip") {
    const slot = payload.slot;
    if (typeof slot !== "string" || !SLOTS.includes(slot as Slot)) return fail("La ranura no es válida.", 400);
    const { data, error } = await supabase.rpc("equip_profile_cosmetic", {
      p_cosmetic_id: cosmeticId,
      p_slot: slot,
    });
    if (error) {
      if (error.code === "42501") return fail("Primero debes desbloquear este objeto.", 403);
      if (error.code === "22023") return fail("Este objeto no corresponde a esa ranura.", 400);
      if (error.code === "P0002") return fail("Este objeto ya no está disponible.", 404);
      console.error("[PeakStyle] Cosmetic equip failed.", { code: error.code });
      return fail("No se pudo equipar el objeto.", 503);
    }
    if (data !== true) return fail("No se pudo equipar el objeto.", 503);
    return NextResponse.json({ success: true, slot, cosmeticId }, { headers: { "Cache-Control": "no-store" } });
  }

  if (action === "unequip") {
    const slot = payload.slot;
    if (typeof slot !== "string" || !SLOTS.includes(slot as Slot)) return fail("La ranura no es válida.", 400);
    const { data, error } = await supabase.rpc("unequip_profile_cosmetic", { p_slot: slot });
    if (error || data !== true) return fail("No se pudo retirar el objeto.", 503);
    return NextResponse.json({ success: true, slot }, { headers: { "Cache-Control": "no-store" } });
  }

  return fail("La acción no está permitida.", 400);
}
