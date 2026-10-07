import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    // ============================================================
    // 2. PERFIL
    // ============================================================

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          target_score,
          average_score,
          streak,
          simulations,
          xp,
          coins,
          level,
          selected_character
        `)
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      console.error("Profile query error:", profileError);

      return NextResponse.json(
        { error: "No se pudo obtener el perfil" },
        { status: 500 },
      );
    }

    // ============================================================
    // 3. PERSONAJES DESBLOQUEADOS DEL USUARIO
    // ============================================================

    const {
      data: userCharacters,
      error: userCharactersError,
    } = await supabase
      .from("user_characters")
      .select(`
        character_id,
        unlocked_at
      `)
      .eq("user_id", user.id);

    if (userCharactersError) {
      console.error(
        "User characters query error:",
        userCharactersError,
      );

      return NextResponse.json(
        { error: "No se pudieron obtener los personajes" },
        { status: 500 },
      );
    }

    const characterIds =
      userCharacters?.map(
        (character) => character.character_id,
      ) ?? [];

    // ============================================================
    // 4. DATOS DE LOS PERSONAJES
    // ============================================================

    let characters: Array<{
      id: string;
      name: string;
      description: string;
      price_coins: number;
      xp_bonus_percent: number;
      coin_bonus_percent: number;
      is_active: boolean;
    }> = [];

    const {
      data: characterRows,
      error: charactersError,
    } = await supabase
      .from("characters")
      .select(`
        id,
        name,
        description,
        price_coins,
        xp_bonus_percent,
        coin_bonus_percent,
        is_active
      `)
      .eq("is_active", true);

    if (charactersError) {
      console.error(
        "Characters query error:",
        charactersError,
      );

      return NextResponse.json(
        { error: "No se pudieron obtener los personajes" },
        { status: 500 },
      );
    }

    characters = characterRows ?? [];

    // ============================================================
    // 5. INSIGNIAS DESBLOQUEADAS
    // ============================================================

    const {
      data: userBadges,
      error: userBadgesError,
    } = await supabase
      .from("user_badges")
      .select(`
        badge_id,
        unlocked_at
      `)
      .eq("user_id", user.id);

    if (userBadgesError) {
      console.error(
        "User badges query error:",
        userBadgesError,
      );

      return NextResponse.json(
        { error: "No se pudieron obtener las insignias" },
        { status: 500 },
      );
    }

    const badgeIds =
      userBadges?.map(
        (badge) => badge.badge_id,
      ) ?? [];

    // ============================================================
    // 6. DATOS DE LAS INSIGNIAS
    // ============================================================

    let badges: Array<{
      id: string;
      name: string;
      description: string;
      requirement_type: string;
      requirement_target: number;
      icon: string | null;
    }> = [];

    if (badgeIds.length > 0) {
      const {
        data: badgeRows,
        error: badgesError,
      } = await supabase
        .from("badges")
        .select(`
          id,
          name,
          description,
          requirement_type,
          requirement_target,
          icon
        `)
        .in("id", badgeIds);

      if (badgesError) {
        console.error(
          "Badges query error:",
          badgesError,
        );

        return NextResponse.json(
          { error: "No se pudieron obtener las insignias" },
          { status: 500 },
        );
      }

      badges = badgeRows ?? [];
    }

    // ============================================================
    // 7. RESPUESTA
    // ============================================================

    return NextResponse.json({
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        avatarUrl: profile.avatar_url,
        targetScore: profile.target_score,
        averageScore: profile.average_score,
        streak: profile.streak,
        simulations: profile.simulations,
        xp: profile.xp,
        coins: profile.coins,
        level: profile.level,
        selectedCharacter: profile.selected_character,
      },

      // TODOS los personajes disponibles
      characters,

      // SOLO los personajes que el usuario posee
      unlockedCharacterIds: characterIds,

      // SOLO las insignias que el usuario ha desbloqueado
      unlockedBadgeIds: badgeIds,
    });
  } catch (error) {
    console.error("Profile API unexpected error:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}