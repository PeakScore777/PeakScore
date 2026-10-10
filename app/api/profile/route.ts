import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCanonicalAdmin } from "@/lib/auth/admin";

import {
  getCurrentSeasonContext,
} from "@/lib/gamification/season-service";

import {
  getRankBySeasonXp,
  getRankProgress,
  getXpToNextRank,
} from "@/lib/gamification/ranks";

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

    const {
      data: profile,
      error: profileError,
    } = await supabase
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
        season_xp,
        coins,
        level,
        selected_character,
        role
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "Profile query error:",
        profileError,
      );

      return NextResponse.json(
        {
          error:
            "No se pudo obtener el perfil",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 3. TEMPORADA ACTUAL
    // ============================================================

    const {
      season,
      participation,
    } =
      await getCurrentSeasonContext(user.id);

    /**
     * `startingRank` nos permite saber si el usuario
     * comenzó su primera temporada como Aprendiz o si
     * entró como veterano mediante Renacer.
     *
     * Esto NO determina directamente el rango actual.
     * El rango actual se calcula con seasonXp.
     */
    const isNewAccount =
      participation.startingRank ===
      "aprendiz";

    // ============================================================
    // 4. RANGO ACTUAL
    // ============================================================

    const currentRank =
      getRankBySeasonXp(
        participation.seasonXp,
        isNewAccount,
      );

    const rankProgress =
      getRankProgress(
        participation.seasonXp,
        currentRank,
      );

    const xpToNextRank =
      getXpToNextRank(
        participation.seasonXp,
        currentRank,
      );

    // ============================================================
    // 5. PERSONAJES DESBLOQUEADOS
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
        {
          error:
            "No se pudieron obtener los personajes",
        },
        { status: 500 },
      );
    }

    const characterIds =
      userCharacters?.map(
        (character) =>
          character.character_id,
      ) ?? [];

    // ============================================================
    // 6. DATOS DE LOS PERSONAJES
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
        {
          error:
            "No se pudieron obtener los personajes",
        },
        { status: 500 },
      );
    }

    characters = characterRows ?? [];

    // ============================================================
    // 7. INSIGNIAS DESBLOQUEADAS
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
        {
          error:
            "No se pudieron obtener las insignias",
        },
        { status: 500 },
      );
    }

    const badgeIds =
      userBadges?.map(
        (badge) => badge.badge_id,
      ) ?? [];

    // ============================================================
    // 8. DATOS DE LAS INSIGNIAS
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
          {
            error:
              "No se pudieron obtener las insignias",
          },
          { status: 500 },
        );
      }

      badges = badgeRows ?? [];
    }

    // ============================================================
    // 9. RESPUESTA
    // ============================================================

    return NextResponse.json({
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: user.email ?? profile.email,
        avatarUrl: profile.avatar_url,

        targetScore:
          profile.target_score,

        averageScore:
          profile.average_score,

        streak:
          profile.streak,

        simulations:
          profile.simulations,

        /**
         * EXP histórica.
         *
         * Esta EXP no determina el rango competitivo.
         */
        xp: profile.xp,

        historicalXp:
          profile.xp,

        /**
         * EXP actual de temporada.
         *
         * Fuente de verdad:
         * user_seasons.season_xp
         */
        seasonXp:
          participation.seasonXp,

        coins:
          profile.coins,

        level:
          profile.level,

        selectedCharacter:
          profile.selected_character,

        isAdmin: isCanonicalAdmin(user.id, profile.role),
      },

      // ========================================================
      // TEMPORADA
      // ========================================================

      season: {
        id: season.id,
        number: season.seasonNumber,
        name: season.name,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        status: season.status,
      },

      // ========================================================
      // RANGO
      // ========================================================

      rank: {
        id: currentRank.id,
        name: currentRank.name,
        identity: currentRank.identity,
        minSeasonXp:
          currentRank.minSeasonXp,
        maxSeasonXp:
          currentRank.maxSeasonXp,
        progress:
          rankProgress,
        xpToNextRank,
          isNewAccount,
      },

      // ========================================================
      // PERSONAJES
      // ========================================================

      characters,

      unlockedCharacterIds:
        characterIds,

      // ========================================================
      // INSIGNIAS
      // ========================================================

      unlockedBadgeIds:
        badgeIds,

      badges,
    });
  } catch (error) {
    console.error(
      "Profile API unexpected error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor",
      },
      { status: 500 },
    );
  }
}