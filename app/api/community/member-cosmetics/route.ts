import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const params = new URL(request.url).searchParams;
  const rawIds = params.get("userIds") ?? "";
  const userIds = [...new Set(rawIds.split(",").filter((id) => UUID.test(id)))].slice(0, 100);
  if (!userIds.length) {
    return NextResponse.json({ nameplates: [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { data: equipment, error: equipmentError } = await supabaseAdmin
    .from("user_profile_cosmetic_equipment")
    .select("user_id,cosmetic_id")
    .in("user_id", userIds)
    .eq("slot", "nameplate");

  if (equipmentError || !equipment?.length) {
    if (equipmentError) console.error("[Community] Nameplate lookup failed.", { code: equipmentError.code });
    return NextResponse.json({ nameplates: [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const cosmeticIds = [...new Set(equipment.map((row) => row.cosmetic_id))];
  const { data: cosmetics, error: cosmeticsError } = await supabaseAdmin
    .from("community_profile_cosmetics")
    .select("id,name,asset_path,preview_path")
    .in("id", cosmeticIds)
    .eq("category", "nameplate")
    .eq("is_active", true);

  if (cosmeticsError) {
    console.error("[Community] Public nameplate metadata lookup failed.", { code: cosmeticsError.code });
    return NextResponse.json({ nameplates: [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const byId = new Map((cosmetics ?? []).map((item) => [item.id, item]));
  const nameplates = equipment.flatMap((row) => {
    const item = byId.get(row.cosmetic_id);
    if (!item) return [];
    return [{
      userId: row.user_id,
      cosmeticId: item.id,
      name: item.name,
      imageUrl: item.preview_path ?? item.asset_path,
    }];
  });

  return NextResponse.json({ nameplates }, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
