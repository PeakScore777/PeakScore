import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AdminProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  target_score: number | null;
  average_score: number | null;
  streak: number | null;
  simulations: number | null;
  xp: number | null;
  coins: number | null;
  level: number | null;
  selected_character: string | null;
};

const PROFILE_FIELDS =
  "id, full_name, email, target_score, average_score, streak, simulations, xp, coins, level, selected_character";

async function authorizeAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      response: NextResponse.json(
        { error: "No autenticado." },
        { status: 401 },
      ),
      user: null,
    };
  }

  const { data: currentProfile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (roleError) {
    return {
      response: NextResponse.json(
        { error: "No se pudieron comprobar los permisos." },
        { status: 500 },
      ),
      user: null,
    };
  }

  if (currentProfile?.role !== "admin") {
    return {
      response: NextResponse.json(
        { error: "No tienes permiso para usar esta herramienta." },
        { status: 403 },
      ),
      user: null,
    };
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    return {
      response: NextResponse.json(
        { error: "No se pudo comprobar el nivel de seguridad de la sesión." },
        { status: 503 },
      ),
      user: null,
    };
  }

  if (
    assurance.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    return {
      response: NextResponse.json(
        { error: "Completa la autenticación en dos pasos.", mfaRequired: true },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { response: null, user };
}

function presentProfile(row: AdminProfileRow, seasonXp: number | null) {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    targetScore: Number(row.target_score ?? 0),
    averageScore: Number(row.average_score ?? 0),
    streak: Number(row.streak ?? 0),
    simulations: Number(row.simulations ?? 0),
    historicalXp: Number(row.xp ?? 0),
    seasonXp,
    coins: Number(row.coins ?? 0),
    level: Number(row.level ?? 1),
    selectedCharacter: row.selected_character ?? "",
  };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (query.length < 2 || query.length > 80) {
      return NextResponse.json(
        { error: "Escribe al menos 2 caracteres para buscar." },
        { status: 400 },
      );
    }

    // Consultas separadas evitan construir un filtro OR a partir de texto del usuario.
    const pattern = `%${query.replace(/[%_]/g, "")}%`;
    const [emailResult, nameResult] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .ilike("email", pattern)
        .limit(10),
      supabaseAdmin
        .from("profiles")
        .select(PROFILE_FIELDS)
        .ilike("full_name", pattern)
        .limit(10),
    ]);

    if (emailResult.error || nameResult.error) {
      console.error("[AdminProfiles] Error de búsqueda.", {
        emailCode: emailResult.error?.code ?? null,
        nameCode: nameResult.error?.code ?? null,
      });
      return NextResponse.json(
        { error: "No se pudieron buscar los perfiles." },
        { status: 500 },
      );
    }

    const merged = new Map<string, AdminProfileRow>();
    for (const row of [...(emailResult.data ?? []), ...(nameResult.data ?? [])]) {
      merged.set(row.id, row as AdminProfileRow);
    }
    const rows = [...merged.values()].slice(0, 15);

    let activeSeasonId: string | null = null;
    const { data: season, error: seasonError } = await supabaseAdmin
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .order("season_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (seasonError) {
      console.error("[AdminProfiles] No se pudo consultar la temporada activa.", {
        code: seasonError.code ?? "UNKNOWN",
      });
    } else {
      activeSeasonId = season?.id ?? null;
    }

    const seasonXpByUser = new Map<string, number>();
    if (activeSeasonId && rows.length > 0) {
      const { data: participations, error: participationError } = await supabaseAdmin
        .from("user_seasons")
        .select("user_id, season_xp")
        .eq("season_id", activeSeasonId)
        .in("user_id", rows.map((row) => row.id));

      if (participationError) {
        console.error("[AdminProfiles] No se pudo consultar EXP de temporada.", {
          code: participationError.code ?? "UNKNOWN",
        });
      } else {
        for (const participation of participations ?? []) {
          seasonXpByUser.set(
            participation.user_id,
            Number(participation.season_xp ?? 0),
          );
        }
      }
    }

    return NextResponse.json({
      profiles: rows.map((row) =>
        presentProfile(row, seasonXpByUser.get(row.id) ?? null),
      ),
    });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al buscar perfiles." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authorizeAdmin();
    if (auth.response) return auth.response;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "La solicitud no tiene un formato válido." },
        { status: 400 },
      );
    }

    const targetUserId = body.userId;
    if (
      typeof targetUserId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)
    ) {
      return NextResponse.json(
        { error: "El identificador del usuario no es válido." },
        { status: 400 },
      );
    }

    const { data: original, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json(
        { error: "No se pudo cargar el perfil que quieres editar." },
        { status: 500 },
      );
    }
    if (!original) {
      return NextResponse.json(
        { error: "No se encontró ese perfil." },
        { status: 404 },
      );
    }

    const updates: Record<string, string | number | null> = {};
    const numberRules = [
      ["targetScore", "target_score", 0, 500, false],
      ["averageScore", "average_score", 0, 500, false],
      ["streak", "streak", 0, 1000000, true],
      ["simulations", "simulations", 0, 10000000, true],
      ["historicalXp", "xp", 0, 1000000000, true],
      ["coins", "coins", 0, 1000000000, true],
      ["level", "level", 1, 100000, true],
    ] as const;

    for (const [inputKey, column, min, max, integer] of numberRules) {
      if (!(inputKey in body)) continue;
      const value = body[inputKey];
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        (integer && !Number.isSafeInteger(value))
      ) {
        return NextResponse.json(
          { error: `El valor de ${inputKey} está fuera del rango permitido.` },
          { status: 400 },
        );
      }
      updates[column] = value;
    }

    if ("fullName" in body) {
      if (typeof body.fullName !== "string") {
        return NextResponse.json(
          { error: "El nombre no es válido." },
          { status: 400 },
        );
      }
      const fullName = body.fullName.trim();
      if (fullName.length < 2 || fullName.length > 70) {
        return NextResponse.json(
          { error: "El nombre debe tener entre 2 y 70 caracteres." },
          { status: 400 },
        );
      }
      updates.full_name = fullName;
    }

    if ("selectedCharacter" in body) {
      const value = body.selectedCharacter;
      if (
        value !== null &&
        value !== "" &&
        value !== "nova" &&
        value !== "nox" &&
        value !== "zyra" &&
        value !== "orby"
      ) {
        return NextResponse.json(
          { error: "El personaje seleccionado no es válido." },
          { status: 400 },
        );
      }
      updates.selected_character = value === "" ? null : value;
    }

    const updateSeasonXp = "seasonXp" in body;
    let seasonId: string | null = null;
    let previousSeasonXp: number | null = null;

    if (updateSeasonXp) {
      const value = body.seasonXp;
      if (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0 ||
        value > 1000000000
      ) {
        return NextResponse.json(
          { error: "La EXP de temporada debe ser un entero válido." },
          { status: 400 },
        );
      }

      const { data: season, error: seasonError } = await supabaseAdmin
        .from("seasons")
        .select("id")
        .eq("status", "active")
        .order("season_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (seasonError || !season) {
        return NextResponse.json(
          { error: "No existe una temporada activa para editar esa EXP." },
          { status: 409 },
        );
      }
      seasonId = season.id;

      const { data: participation, error: participationError } = await supabaseAdmin
        .from("user_seasons")
        .select("id, season_xp")
        .eq("user_id", targetUserId)
        .eq("season_id", seasonId)
        .maybeSingle();

      if (participationError || !participation) {
        return NextResponse.json(
          { error: "Ese usuario todavía no tiene participación en la temporada activa. No se cambió ningún dato." },
          { status: 409 },
        );
      }

      previousSeasonXp = Number(participation.season_xp ?? 0);
    }

    if (Object.keys(updates).length === 0 && !updateSeasonXp) {
      return NextResponse.json(
        { error: "No hay cambios para guardar." },
        { status: 400 },
      );
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", targetUserId);

      if (updateError) {
        console.error("[AdminProfiles] Error al actualizar perfil.", {
          code: updateError.code ?? "UNKNOWN",
        });
        return NextResponse.json(
          { error: "No se pudieron guardar los cambios del perfil." },
          { status: 500 },
        );
      }
    }

    if (updateSeasonXp && seasonId) {
      const { error: seasonUpdateError } = await supabaseAdmin
        .from("user_seasons")
        .update({ season_xp: body.seasonXp })
        .eq("user_id", targetUserId)
        .eq("season_id", seasonId);

      if (seasonUpdateError) {
        // Compensación para no dejar el perfil parcialmente actualizado.
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin
            .from("profiles")
            .update({
              full_name: original.full_name,
              target_score: original.target_score,
              average_score: original.average_score,
              streak: original.streak,
              simulations: original.simulations,
              xp: original.xp,
              coins: original.coins,
              level: original.level,
              selected_character: original.selected_character,
            })
            .eq("id", targetUserId);
        }
        console.error("[AdminProfiles] Error al actualizar EXP de temporada.", {
          code: seasonUpdateError.code ?? "UNKNOWN",
        });
        return NextResponse.json(
          { error: "No se pudo guardar la EXP de temporada. Se intentó restaurar los demás valores." },
          { status: 500 },
        );
      }
    }

    console.info("[AdminProfiles] Stats updated", {
      adminUserId: auth.user?.id,
      targetUserId,
      profileFields: Object.keys(updates),
      updatedSeasonXp: updateSeasonXp,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al guardar los cambios." },
      { status: 500 },
    );
  }
}
