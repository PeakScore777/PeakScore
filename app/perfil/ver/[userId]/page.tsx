"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Crown, ShieldCheck, Sparkles, Trophy, UserRound } from "lucide-react";

type EquippedCosmetic = {
  slot: string;
  id: string;
  name: string;
  assetPath: string | null;
  metadata: Record<string, unknown>;
};
function safeHex(value: unknown, fallback: string) {\n  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;\n}\n\ntype PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  pronouns: string;
  level: number;
  xp: number;
  selectedCharacter: string | null;
  equippedCosmetics: EquippedCosmetic[];
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

  const cosmetic = (slot: string) => profile?.equippedCosmetics.find((item) => item.slot === slot) ?? null;
  const banner = cosmetic("profile_banner");
  const frameItem = cosmetic("avatar_frame");
  const effect = cosmetic("profile_effect");
  const nameplate = cosmetic("nameplate");
  const theme = cosmetic("profile_theme");
  const themeMetadata = theme?.metadata ?? {};
  const themeStyle = useMemo(() => ({
    "--peakstyle-primary": safeHex(themeMetadata.primary, "#0B1020"),
    "--peakstyle-surface": safeHex(themeMetadata.surface, "#141D36"),
    "--peakstyle-accent": safeHex(themeMetadata.accent, "#39D6F0"),
    "--peakstyle-highlight": safeHex(themeMetadata.highlight, "#7FE05C"),
  } as CSSProperties), [themeMetadata]);

  if (loading) {
    return <main className="peakstyle-public-page"><div className="peakstyle-public-loading"/></main>;
  }

  if (error || !profile) {
    return <main className="peakstyle-public-page"><div className="peakstyle-public-error"><ShieldCheck size={28}/><h1>Perfil no disponible</h1><p>{error || "No encontramos este perfil."}</p><Link href="/comunidad"><ArrowLeft size={14}/> Volver a la comunidad</Link></div></main>;
  }

  return (
    <main className="peakstyle-public-page" style={themeStyle}>
      <div className="peakstyle-public-shell">
        <div className="peakstyle-public-topbar">
          <Link href="/comunidad"><ArrowLeft size={15}/> Comunidad</Link>
          <span><Sparkles size={14}/> PEAKSTYLE IDENTITY</span>
        </div>

        <article className="peakstyle-public-card">
          <div className={"peakstyle-public-banner " + (banner?.id ?? "")} style={(banner?.assetPath || profile.bannerUrl) ? { backgroundImage: "linear-gradient(180deg,rgba(5,8,20,.08),rgba(5,8,20,.72)),url(" + JSON.stringify(banner?.assetPath ?? profile.bannerUrl) + ")" } : undefined}>
            {!banner?.assetPath && !profile.bannerUrl && <div className="peakstyle-public-banner-mark"><span>PEAKSCORE</span><strong>PLAYER IDENTITY</strong></div>}
            {effect?.id === "effect-starfall" && <div className="peakstyle-effect peakstyle-effect-starfall" aria-hidden="true"/>}
            {effect?.id === "effect-pixel-burst" && <div className="peakstyle-effect peakstyle-effect-burst" aria-hidden="true"/>}
            <span className="peakstyle-public-banner-code">PS / COMMUNITY PROFILE</span>
          </div>
          <div className="peakstyle-public-body">
            <div className="peakstyle-public-main">
              <div className="peakstyle-public-avatar">
                <div className="peakstyle-public-avatar-image">
                  {profile.avatarUrl
                    ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="140px" className="object-cover"/>
                    : <span>{profile.displayName.slice(0,1).toUpperCase()}</span>}
                </div>
                {frameItem?.assetPath && <Image src={frameItem.assetPath} alt="" fill unoptimized className={"peakstyle-public-frame peakstyle-avatar-frame-" + frameItem.id}/>}
              </div>
              <div className="peakstyle-public-identity">
                <span className="peakstyle-public-level">LEVEL {profile.level} · PEAKSCORE</span>
                <h1>{profile.displayName}</h1>
                {profile.pronouns && <p>{profile.pronouns}</p>}
                {nameplate?.assetPath && <Image src={nameplate.assetPath} alt="" width={290} height={56} unoptimized className="peakstyle-public-nameplate"/>}
              </div>
              <span className="peakstyle-public-online"><i/> MEMBER</span>
            </div>
            <p className="peakstyle-public-bio">{profile.bio || "Este jugador aún no ha escrito una descripción."}</p>
            <div className="peakstyle-public-divider"/>
            <div className="peakstyle-public-stat-grid">
              <div><Trophy size={16}/><span>NIVEL</span><strong>{profile.level}</strong></div>
              <div><Sparkles size={16}/><span>EXP TOTAL</span><strong>{Number(profile.xp || 0).toLocaleString("es-CO")}</strong></div>
              <div><Crown size={16}/><span>PERSONAJE</span><strong>{profile.selectedCharacter || "Sin elegir"}</strong></div>
            </div>
          </div>
        </article>

        <section className="peakstyle-public-collection">
          <div><p className="peakstyle-kicker">PLAYER INVENTORY</p><h2>Estilo equipado</h2></div>
          <div className="peakstyle-public-collection-grid">
            {profile.equippedCosmetics.length === 0 ? (
              <p>Este jugador todavía no ha equipado cosméticos.</p>
            ) : profile.equippedCosmetics.map((item) => (
              <div className="peakstyle-public-collection-item" key={item.slot}>
                {item.assetPath ? <Image src={item.assetPath} alt="" width={72} height={54} unoptimized/> : <UserRound size={26}/>}
                <span>{item.name}</span>
                <small>{item.slot.replaceAll("_", " ")}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
