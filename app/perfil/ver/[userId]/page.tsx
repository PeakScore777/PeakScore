"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Crown, Gamepad2, ShieldCheck, Sparkles, Trophy, UserRound } from "lucide-react";

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
                  <i aria-label="Miembro de PeakScore"/>
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

            <section className="peak-public-panel peak-public-journey">
              <div className="peak-public-section-heading"><span>CAMINO DEL JUGADOR</span><i>YOUR JOURNEY</i></div>
              <div className="peak-public-journey-row">
                <div className="peak-public-journey-icon"><BookOpen size={18}/></div>
                <div><strong>Preparación Saber 11</strong><p>Aprender, practicar y avanzar a tu ritmo.</p></div>
                <span>PEAKSCORE</span>
              </div>
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
              <strong>Tu progreso habla por ti.</strong>
              <p>Cada partida, cada práctica y cada logro construyen tu camino.</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
