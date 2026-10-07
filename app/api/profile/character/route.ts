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
        const rpcMessage =
          typeof error.message === "string"
            ? error.message
            : "";

        let reason:
          | "INSUFFICIENT_COINS"
          | "CHARACTER_ALREADY_OWNED"
          | "CHARACTER_NOT_FOUND"
          | "PROFILE_NOT_FOUND"
          | "UNAUTHENTICATED"
          | "INVALID_CHARACTER"
          | "UNKNOWN" = "UNKNOWN";

        if (rpcMessage.includes("INSUFFICIENT_COINS")) {
          reason = "INSUFFICIENT_COINS";
        } else if (
          rpcMessage.includes("CHARACTER_ALREADY_OWNED")
        ) {
          reason = "CHARACTER_ALREADY_OWNED";
        } else if (
          rpcMessage.includes("CHARACTER_NOT_FOUND")
        ) {
          reason = "CHARACTER_NOT_FOUND";
        } else if (
          rpcMessage.includes("PROFILE_NOT_FOUND")
        ) {
          reason = "PROFILE_NOT_FOUND";
        } else if (
          rpcMessage.includes("UNAUTHENTICATED")
        ) {
          reason = "UNAUTHENTICATED";
        } else if (
          rpcMessage.includes("INVALID_CHARACTER")
        ) {
          reason = "INVALID_CHARACTER";
        }

        if (reason !== "UNKNOWN") {
          console.warn(
            "purchase_character rejected:",
            reason,
          );
        } else {
          console.error(
            "purchase_character error:",
            error,
          );
        }

        const errorMessage =
          reason === "INSUFFICIENT_COINS"
            ? "No tienes suficientes monedas."
            : reason === "CHARACTER_ALREADY_OWNED"
              ? "Ya tienes este personaje."
              : "No se pudo comprar el personaje.";

        return NextResponse.json(
          {
            error: errorMessage,
            reason,
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