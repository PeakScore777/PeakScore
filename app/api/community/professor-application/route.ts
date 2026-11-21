import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_SUBJECTS = [
  "Matemáticas",
  "Lectura crítica",
  "Sociales",
  "Ciencias naturales",
  "Inglés",
  "Preparación ICFES",
] as const;

type AllowedSubject = (typeof ALLOWED_SUBJECTS)[number];

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function validHttpsUrl(value: unknown, allowVideoHosts = false) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 500) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return undefined;
    if (allowVideoHosts) {
      const host = parsed.hostname.toLowerCase();
      const allowed = [
        "youtube.com", "www.youtube.com", "youtu.be",
        "vimeo.com", "www.vimeo.com", "player.vimeo.com",
      ];
      if (!allowed.includes(host)) return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const [{ data: roles, error: roleError }, { data: applications, error: applicationError }] = await Promise.all([
    supabaseAdmin
      .from("community_member_roles")
      .select("role_key,assigned_at")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("community_professor_applications")
      .select("id,professional_title,subject_areas,teaching_experience_years,biography,portfolio_url,intro_video_url,status,submitted_at,reviewed_at,review_note")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  if (roleError || applicationError) {
    return NextResponse.json({ error: "No se pudo consultar el estado de tu solicitud." }, { status: 500 });
  }

  return NextResponse.json({
    isProfessor: (roles ?? []).some((role) => role.role_key === "profesor"),
    applications: applications ?? [],
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 12_000) {
    return NextResponse.json({ error: "La solicitud supera el tamaño permitido." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El formulario contiene datos inválidos." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Completa los datos de la solicitud." }, { status: 400 });
  }

  const value = body as Record<string, unknown>;
  const professionalTitle = cleanText(value.professionalTitle, 80);
  const biography = typeof value.biography === "string"
    ? value.biography.normalize("NFC").trim()
    : "";
  const experience = Number(value.teachingExperienceYears);
  const subjects = Array.isArray(value.subjectAreas)
    ? Array.from(new Set(value.subjectAreas.filter(
        (item): item is string => typeof item === "string" && (ALLOWED_SUBJECTS as readonly string[]).includes(item),
      )))
    : [];
  const portfolioUrl = validHttpsUrl(value.portfolioUrl);
  const introVideoUrl = validHttpsUrl(value.introVideoUrl, true);

  if (professionalTitle.length < 3 || professionalTitle.length > 80) {
    return NextResponse.json({ error: "El perfil profesional debe tener entre 3 y 80 caracteres." }, { status: 400 });
  }
  if (biography.length < 80 || biography.length > 1200) {
    return NextResponse.json({ error: "La presentación debe tener entre 80 y 1.200 caracteres." }, { status: 400 });
  }
  if (!Number.isInteger(experience) || experience < 0 || experience > 50) {
    return NextResponse.json({ error: "Indica una experiencia entre 0 y 50 años." }, { status: 400 });
  }
  if (subjects.length < 1 || subjects.length > 6) {
    return NextResponse.json({ error: "Selecciona al menos un área de enseñanza." }, { status: 400 });
  }
  if (portfolioUrl === undefined) {
    return NextResponse.json({ error: "El enlace del portafolio debe ser una URL HTTPS válida." }, { status: 400 });
  }
  if (introVideoUrl === undefined) {
    return NextResponse.json({ error: "El video introductorio debe usar un enlace HTTPS de YouTube o Vimeo." }, { status: 400 });
  }

  const { data: limitAllowed, error: limitError } = await supabase.rpc("consume_api_rate_limit", {
    p_bucket: "community-professor-application",
    p_limit: 2,
    p_window_seconds: 3600,
  });

  if (limitError) {
    return NextResponse.json({ error: "No fue posible validar el límite de solicitudes." }, { status: 500 });
  }
  if (!limitAllowed) {
    return NextResponse.json(
      { error: "Has alcanzado el límite de dos solicitudes por hora. Inténtalo más tarde." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from("community_member_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role_key", "profesor")
    .maybeSingle();

  if (roleError) {
    return NextResponse.json({ error: "No se pudo comprobar tu rol de comunidad." }, { status: 500 });
  }
  if (role) {
    return NextResponse.json({ error: "Tu cuenta ya tiene el rol Profesor PeakScore." }, { status: 409 });
  }

  const { data: activeApplication, error: activeError } = await supabaseAdmin
    .from("community_professor_applications")
    .select("id,status")
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (activeError) {
    return NextResponse.json({ error: "No se pudo comprobar si ya tienes una solicitud activa." }, { status: 500 });
  }
  if (activeApplication) {
    return NextResponse.json({ error: "Ya tienes una solicitud pendiente o aprobada." }, { status: 409 });
  }

  const { data: application, error: insertError } = await supabaseAdmin
    .from("community_professor_applications")
    .insert({
      user_id: user.id,
      professional_title: professionalTitle,
      subject_areas: subjects as AllowedSubject[],
      teaching_experience_years: experience,
      biography,
      portfolio_url: portfolioUrl,
      intro_video_url: introVideoUrl,
    })
    .select("id,status,submitted_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Ya existe una solicitud activa para tu cuenta." }, { status: 409 });
    }
    console.error("Community professor application failed.", { userId: user.id, errorCode: insertError.code });
    return NextResponse.json({ error: "No se pudo enviar la solicitud. Inténtalo de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ success: true, application }, { status: 201 });
}
