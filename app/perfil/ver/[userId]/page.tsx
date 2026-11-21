"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Gamepad2, ShieldCheck, Sparkles, Trophy, UserRound } from "lucide-react";
import { CHARACTER_LORE, type PeakScoreCharacterId } from "@/lib/characters/lore";

const CHARACTER_IMAGES: Record<PeakScoreCharacterId, string> = {
  nova: "/characters/peaky-nova/nova-pixel.webp",
  nox: "/characters/peaky-nox/nox-pixel.webp",
  zyra: "/characters/zyra/zyra-pixel.webp",
  orby: "/characters/orby/orby-pixel.webp",
};

function resolveCharacterId(value: string | null): PeakScoreCharacterId | null {
  const normalized = (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("nova")) return "nova";
  if (normalized.includes("nox")) return "nox";
  if (normalized.includes("zyra")) return "zyra";
  if (normalized.includes("orby")) return "orby";
  return null;
}

type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  pronouns: string;
  level: number;
  xp: number;
  selectedCharacter: string | null;
  equippedCosmetics: unknown[];
};

export default function PublicPeakStyleProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      void (async () => {
        try {
          const response = await fetch("/api/profile/public/" + encodeURIComponent(params.userId), { cache: "no-store" });
          const result = await response.json().catch(() => null) as { profile?: PublicProfile; error?: string } | null;
          if (!response.ok || !result?.profile) throw new Error(result?.error ?? "No se pudo cargar este perfil.");
          if (active) setProfile(result.profile);
        } catch (caught) {
          if (active) setError(caught instanceof Error ? caught.message : "No se pudo cargar este perfil.");
        } finally {
          if (active) setLoading(false);
        }
      })();
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
    };
  }, [params.userId]);

  if (loading) {
    return <main className="peak-public-profile"><div className="peak-public-loading"><div/><div/><div/></div></main>;
  }

  if (error || !profile) {
    return (
      <main className="peak-public-profile">
        <div className="peak-public-error">
          <ShieldCheck size={30}/>
          <h1>Perfil no disponible</h1>
          <p>{error || "No encontramos este perfil."}</p>
          <Link href="/comunidad"><ArrowLeft size={14}/> Volver a la comunidad</Link>
        </div>
      </main>
    );
  }

  const initials = profile.displayName.trim().slice(0, 1).toUpperCase() || "P";
  const selectedCharacterId = resolveCharacterId(profile.selectedCharacter);
  const selectedCharacter = selectedCharacterId ? CHARACTER_LORE[selectedCharacterId] : null;

  return (
    <main className="peak-public-profile">
      <div className="peak-public-shell">
        <header className="peak-public-topbar">
          <Link href="/comunidad"><ArrowLeft size={15}/> Comunidad</Link>
          <div className="peak-public-brand"><span>GAME</span><b>CODE</b><i> × PEAKSCORE</i></div>
        </header>

        <section className="peak-public-layout">
          <div className="peak-public-main-column">
            <article className="peak-public-identity-card">
              <div className="peak-public-banner" style={profile.bannerUrl ? { backgroundImage: "linear-gradient(180deg,rgba(8,12,25,.03),rgba(8,12,25,.48)),url(" + JSON.stringify(profile.bannerUrl) + ")" } : undefined}>
                {!profile.bannerUrl && <div className="peak-public-banner-default"><span>PEAKSCORE</span><small>PLAYER PROFILE</small></div>}
                <span className="peak-public-banner-label">COMMUNITY / PLAYER ID</span>
              </div>
              <div className="peak-public-identity-body">
                <div className="peak-public-avatar">
                  {profile.avatarUrl
                    ? <Image src={profile.avatarUrl} alt={"Avatar de " + profile.displayName} fill unoptimized sizes="128px" className="object-cover"/>
                    : <span>{initials}</span>}
                  <span className="peak-public-avatar-mark" aria-label="Perfil de miembro">PS</span>
                </div>
                <div className="peak-public-identity-info">
                  <div className="peak-public-member-label"><span>PEAKSCORE MEMBER</span><i/> COMUNIDAD</div>
                  <h1>{profile.displayName}</h1>
                  {profile.pronouns && <p className="peak-public-pronouns">{profile.pronouns}</p>}
                  <div className="peak-public-identity-badges">
                    <span><ShieldCheck size={12}/> Miembro</span>
                    <span><Trophy size={12}/> Nivel {profile.level}</span>
                  </div>
                </div>
              </div>
              <div className="peak-public-about">
                <div className="peak-public-section-heading"><span>SOBRE MÍ</span><i>ABOUT</i></div>
                <p>{profile.bio || "Este jugador todavía no ha añadido una descripción."}</p>
              </div>
            </article>

            <section className="peak-public-panel">
              <div className="peak-public-section-heading"><span>PROGRESO EN PEAKSCORE</span><i>PLAYER STATS</i></div>
              <div className="peak-public-stat-grid">
                <div className="peak-public-stat">
                  <div className="peak-public-stat-icon"><Trophy size={17}/></div>
                  <span>NIVEL</span>
                  <strong>{profile.level}</strong>
                  <small>Tu nivel actual</small>
                </div>
                <div className="peak-public-stat">
                  <div className="peak-public-stat-icon"><Sparkles size={17}/></div>
                  <span>EXPERIENCIA</span>
                  <strong>{Number(profile.xp || 0).toLocaleString("es-CO")}</strong>
                  <small>XP acumulada</small>
                </div>
                <div className="peak-public-stat">
                  <div className="peak-public-stat-icon"><Gamepad2 size={17}/></div>
                  <span>PERSONAJE</span>
                  <strong className="peak-public-character">{profile.selectedCharacter || "—"}</strong>
                  <small>{profile.selectedCharacter ? "Compañero elegido" : "Aún sin elegir"}</small>
                </div>
              </div>
            </section>

            <section className="peak-public-character-panel">
              <div className="peak-public-section-heading"><span>PERSONAJE EQUIPADO</span><i>YOUR COMPANION</i></div>
              {selectedCharacter && selectedCharacterId ? (
                <div className={"peak-public-character-showcase character-" + selectedCharacterId}>
                  <div className="peak-public-character-art">
                    <Image src={CHARACTER_IMAGES[selectedCharacterId]} alt={selectedCharacter.name} width={176} height={176} unoptimized/>
                  </div>
                  <div className="peak-public-character-copy">
                    <span>PEAKSCORE / COMPANION</span>
                    <h2>{selectedCharacter.name}</h2>
                    <strong>{selectedCharacter.title}</strong>
                    <p>{selectedCharacter.epithet}</p>
                    <small>{selectedCharacter.biome}</small>
                  </div>
                </div>
              ) : (
                <div className="peak-public-no-character">
                  <div><UserRound size={20}/></div>
                  <strong>Aún no ha elegido un personaje</strong>
                  <p>Su aventura en PeakScore está esperando compañero.</p>
                </div>
              )}
            </section>
          </div>

          <aside className="peak-public-side-column">
            <section className="peak-public-side-card">
              <div className="peak-public-section-heading"><span>IDENTIDAD</span><i>PROFILE</i></div>
              <div className="peak-public-side-row"><UserRound size={15}/><span>Jugador de PeakScore</span></div>
              <div className="peak-public-side-row"><ShieldCheck size={15}/><span>Perfil de comunidad</span></div>
            </section>
            <section className="peak-public-side-card peak-public-side-quote">
              <span>PEAKSCORE / COMMUNITY</span>
              <strong>Un perfil. Una aventura.</strong>
              <p>Identidad, nivel y personaje: lo que este jugador ha decidido mostrar a la comunidad.</p>
              <Link href="/comunidad"><ArrowLeft size={13}/> Volver a Comunidad</Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
