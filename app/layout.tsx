import type { Metadata } from "next";
import { ReactNode } from "react";
import { Press_Start_2P } from "next/font/google";

import GlobalNavbar from "@/components/layout/GlobalNavbar";
import { createClient } from "@/lib/supabase/server";
import { isCanonicalAdmin } from "@/lib/auth/admin";

import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
});

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
        "id, full_name, email, avatar_url, streak, coins, selected_character, role",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      initialProfile = {
        id: profile.id,
        fullName: profile.full_name ?? null,
        email: user.email ?? profile.email ?? null,
        avatarUrl: profile.avatar_url ?? null,
        streak: Number(profile.streak ?? 0),
        coins: Number(profile.coins ?? 0),
        selectedCharacter:
          profile.selected_character ?? null,
        isAdmin: isCanonicalAdmin(user.id, profile.role),
      };
    }
  }

  return (
    <html lang="es">
      <body className={pixelFont.variable}>
        <GlobalNavbar initialProfile={initialProfile} />
        {children}
      </body>
    </html>
  );
}