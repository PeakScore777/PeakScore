import type { Metadata } from "next";
import { ReactNode } from "react";

import GlobalNavbar from "@/components/layout/GlobalNavbar";
import { createClient } from "@/lib/supabase/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "PeakScore",
  description: "Preparación ICFES",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, avatar_url, streak, coins, selected_character",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      initialProfile = {
        id: profile.id,
        fullName: profile.full_name ?? null,
        email: profile.email ?? user.email ?? null,
        avatarUrl: profile.avatar_url ?? null,
        streak: Number(profile.streak ?? 0),
        coins: Number(profile.coins ?? 0),
        selectedCharacter:
          profile.selected_character ?? null,
      };
    }
  }

  return (
    <html lang="es">
      <body>
        <GlobalNavbar initialProfile={initialProfile} />
        {children}
      </body>
    </html>
  );
}
