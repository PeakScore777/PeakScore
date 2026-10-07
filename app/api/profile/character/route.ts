import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CharacterAction = "purchase" | "equip";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ============================================================
    // 1. USUARIO AUTENTICADO
    // ============================================================

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "No autenticado",
        },
        {
          status: 401,
        },
      );
    }

    // ============================================================
    // 2. BODY
    // ============================================================

    let body: {
      action?: CharacterAction;
      characterId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "JSON inválido",
        },
        {
          status: 400,
        },
      );
    }

    const action = body.action;
    const characterId = body.characterId;

    // ============================================================
    // 3. VALIDACIÓN
    // ============================================================

    if (
      action !== "purchase" &&
      action !== "equip"
    ) {
      return NextResponse.json(
        {
          error: "Acción inválida",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof characterId !== "string" ||
      characterId.trim().length === 0 ||
      characterId.length > 100
    ) {
      return NextResponse.json(
        {
          error: "Personaje inválido",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedCharacterId = characterId.trim();

    // ============================================================
    // 4. EJECUTAR OPERACIÓN SEGURA EN SUPABASE
    // ============================================================

    if (action === "purchase") {
      const { data, error } = await supabase.rpc(
        "purchase_character",
        {
          p_character_id: normalizedCharacterId,
        },
      );

      if (error) {
        console.error(
          "purchase_character error:",
          error,
        );

        return NextResponse.json(
          {
            error: "No se pudo comprar el personaje",
            code: error.code ?? null,
          },
          {
            status: 400,
          },
        );
      }

      // ==========================================================
      // 5. PERFIL ACTUALIZADO
      // ==========================================================

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(`
            xp,
            coins,
            level,
            selected_character,
            simulations
          `)
          .eq("id", user.id)
          .single();

      if (profileError || !profile) {
        console.error(
          "Updated profile query error:",
          profileError,
        );

        return NextResponse.json(
          {
            success: true,
            action: "purchase",
            result: data,
          },
          {
            status: 200,
          },
        );
      }

      return NextResponse.json({
        success: true,
        action: "purchase",
        result: data,
        profile: {
          xp: profile.xp,
          coins: profile.coins,
          level: profile.level,
          selectedCharacter:
            profile.selected_character,
          simulations: profile.simulations,
        },
      });
    }

    // ============================================================
    // 6. EQUIPAR PERSONAJE
    // ============================================================

    const { data, error } = await supabase.rpc(
      "equip_character",
      {
        p_character_id: normalizedCharacterId,
      },
    );

    if (error) {
      console.error(
        "equip_character error:",
        error,
      );

      return NextResponse.json(
        {
          error: "No se pudo equipar el personaje",
          code: error.code ?? null,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      success: true,
      action: "equip",
      result: data,
      profile: {
        selectedCharacter:
          normalizedCharacterId,
      },
    });
  } catch (error) {
    console.error(
      "Character API unexpected error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      {
        status: 500,
      },
    );
  }
}