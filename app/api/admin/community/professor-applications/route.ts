import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "No se pudo verificar el rol administrativo." }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No tienes permisos para consultar estas solicitudes." }, { status: 403 });
  }

  const requestedStatus = request.nextUrl.searchParams.get("status");
  const allowedStatuses = ["pending", "approved", "rejected", "changes_requested"];
  const status = requestedStatus && allowedStatuses.includes(requestedStatus)
    ? requestedStatus
    : "pending";

  const { data: applications, error } = await supabaseAdmin
    .from("community_professor_applications")
    .select("id,user_id,professional_title,subject_areas,teaching_experience_years,biography,portfolio_url,intro_video_url,status,submitted_at,reviewed_at,review_note")
    .eq("status", status)
    .order("submitted_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Community professor application list failed.", { adminId: user.id, errorCode: error.code });
    return NextResponse.json({ error: "No se pudieron cargar las solicitudes." }, { status: 500 });
  }

  const userIds = Array.from(new Set((applications ?? []).map((item) => item.user_id)));
  const { data: profiles, error: usersError } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id,full_name,email,avatar_url")
        .in("id", userIds)
    : { data: [], error: null };

  if (usersError) {
    return NextResponse.json({ error: "No se pudieron cargar los perfiles de los solicitantes." }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((item) => [item.id, item]));
  return NextResponse.json({
    applications: (applications ?? []).map((item) => ({
      ...item,
      applicant: profileMap.get(item.user_id) ?? null,
    })),
  });
}
