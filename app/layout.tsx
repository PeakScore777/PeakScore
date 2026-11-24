import type { Metadata } from "next";
import { ReactNode } from "react";
import { Inter, Kalam, Press_Start_2P, Silkscreen } from "next/font/google";
import {
  Archivo, Audiowide, Bebas_Neue, Black_Ops_One, Bodoni_Moda, Bungee_Shade, DM_Sans,
  Cherry_Bomb_One, Chicle, Creepster, Dancing_Script, DM_Serif_Display,
  IBM_Plex_Mono, MuseoModerno, New_Rocker, Orbitron, Permanent_Marker, Pixelify_Sans,
  Bungee, Cinzel, Oxanium, Playpen_Sans, Righteous, Space_Grotesk, Teko, UnifrakturMaguntia, Zilla_Slab,
} from "next/font/google";

import GlobalNavbar from "@/components/layout/GlobalNavbar";
import GlobalOrbyClassroomLauncher from "@/components/layout/GlobalOrbyClassroomLauncher";
import { createClient } from "@/lib/supabase/server";

import "./globals.css";
import "./community-profile-status-preview.css";
import "./community-name-style.css";
import "react-inner-image-zoom/lib/styles.min.css";
import "yet-another-react-lightbox/styles.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
  preload: false,
});

const silkscreenFont = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-silkscreen",
  preload: false,
});

const nameFont_classic = Inter({ subsets: ["latin"], display: "swap", variable: "--font-name-classic", preload: false });
const nameFont_tempo = Zilla_Slab({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-tempo", preload: false });
const nameFont_sakura = Cherry_Bomb_One({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-sakura", preload: false });
const nameFont_jellybean = Chicle({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-jellybean", preload: false });
const nameFont_modern = MuseoModerno({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-modern", preload: false });
const nameFont_medieval = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-medieval", preload: false });
const nameFont_pixel = Pixelify_Sans({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-pixel", preload: false });
const nameFont_vampyre = Creepster({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-vampyre", preload: false });
const nameFont_monkey = Playpen_Sans({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-monkey", preload: false });
const nameFont_mainframe = Orbitron({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-mainframe", preload: false });
const nameFont_headbang = New_Rocker({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-headbang", preload: false });
const nameFont_display = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-display", preload: false });
const nameFont_editorial = DM_Serif_Display({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-editorial", preload: false });
const nameFont_elegant = Bodoni_Moda({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-elegant", preload: false });
const nameFont_geometric = Space_Grotesk({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-geometric", preload: false });
const nameFont_retro = Bungee_Shade({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-retro", preload: false });
const nameFont_handwritten = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-handwritten", preload: false });
const nameFont_signature = Dancing_Script({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-signature", preload: false });
const nameFont_techno = Audiowide({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-techno", preload: false });
const nameFont_rounded = Righteous({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-rounded", preload: false });
const nameFont_stencil = Black_Ops_One({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-stencil", preload: false });

const nameFont_discordDisplay = Archivo({ weight: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], display: "swap", variable: "--font-name-discord-display", preload: false });
const nameFont_creatorSans = DM_Sans({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], display: "swap", variable: "--font-name-creator-sans", preload: false });
const nameFont_streamMono = IBM_Plex_Mono({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap", variable: "--font-name-stream-mono", preload: false });
const nameFont_streetBlock = Bungee({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-name-street-block", preload: false });
const nameFont_actionCondensed = Teko({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap", variable: "--font-name-action-condensed", preload: false });
const nameFont_cyberRacer = Oxanium({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], display: "swap", variable: "--font-name-cyber-racer", preload: false });
const nameFont_epicRpg = Cinzel({ weight: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"], display: "swap", variable: "--font-name-epic-rpg", preload: false });


const handwritingFont = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-handwriting",
  preload: false,
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
        isAdmin:
          (user.email ?? "").trim().toLowerCase() ===
          "aragonyostynsena07@gmail.com",
      };
    }
  }

  return (
    <html lang="es">
      <body className={`${pixelFont.variable} ${silkscreenFont.variable} ${handwritingFont.variable} ${nameFont_classic.variable} ${nameFont_tempo.variable} ${nameFont_sakura.variable} ${nameFont_jellybean.variable} ${nameFont_modern.variable} ${nameFont_medieval.variable} ${nameFont_pixel.variable} ${nameFont_vampyre.variable} ${nameFont_monkey.variable} ${nameFont_mainframe.variable} ${nameFont_headbang.variable} ${nameFont_display.variable} ${nameFont_editorial.variable} ${nameFont_elegant.variable} ${nameFont_geometric.variable} ${nameFont_retro.variable} ${nameFont_handwritten.variable} ${nameFont_signature.variable} ${nameFont_techno.variable} ${nameFont_rounded.variable} ${nameFont_stencil.variable} ${nameFont_discordDisplay.variable} ${nameFont_creatorSans.variable} ${nameFont_streamMono.variable} ${nameFont_streetBlock.variable} ${nameFont_actionCondensed.variable} ${nameFont_cyberRacer.variable} ${nameFont_epicRpg.variable}`}>
        <GlobalNavbar initialProfile={initialProfile} />
        {children}
        <GlobalOrbyClassroomLauncher
          isAuthenticated={Boolean(user)}
          studentName={initialProfile?.fullName ?? null}
        />
      </body>
    </html>
  );
}