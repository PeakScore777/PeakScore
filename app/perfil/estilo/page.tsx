"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, ImagePlus, Save, ShieldCheck, UserRound, Copy, ExternalLink, Check, Sparkles, Trophy, Gamepad2 } from "lucide-react";
import { CHARACTER_LORE, type PeakScoreCharacterId } from "@/lib/characters/lore";

const CHARACTER_IMAGES: Record<PeakScoreCharacterId, string> = {
  nova: "/characters/peaky-nova/nova-pixel.webp",
  nox: "/characters/peaky-nox/nox-pixel.webp",
  zyra: "/characters/zyra/zyra-pixel.webp",
  orby: "/characters/orby/orby-pixel.webp",
};

function resolveCharacterId(value: string | null): PeakScoreCharacterId | null {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("nova")) return "nova";
  if (normalized.includes("nox")) return "nox";
  if (normalized.includes("zyra")) return "zyra";
  if (normalized.includes("orby")) return "orby";
  return null;
}

type ProfileData = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  pronouns: string;
  level: number;
  xp: number;
  selectedCharacter: string | null;
};

export default function PeakStyleProfileEditor() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [copiedProfile, setCopiedProfile] = useState(false);
  const publicProfileUrl = typeof window !== "undefined" && profile?.id ? window.location.origin + "/perfil/ver/" + profile.id : "";
  const profileSteps = [
    { label: "Nombre visible", done: displayName.trim().length >= 2 },
    { label: "Foto de perfil", done: Boolean(profile?.avatarUrl) },
    { label: "Banner", done: Boolean(profile?.bannerUrl) },
    { label: "Descripción", done: bio.trim().length >= 8 },
    { label: "Personaje", done: Boolean(profile?.selectedCharacter) },
  ];
  const profileCompletion = Math.round((profileSteps.filter((step) => step.done).length / profileSteps.length) * 100);
  const previewCharacterId = resolveCharacterId(profile?.selectedCharacter ?? null);
  const previewCharacter = previewCharacterId ? CHARACTER_LORE[previewCharacterId] : null;

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/cosmetics", { cache: "no-store" });
      const result = await response.json().catch(() => null) as { profile?: ProfileData; error?: string } | null;
      if (!response.ok || !result?.profile) throw new Error(result?.error ?? "No se pudo cargar tu perfil.");
      setProfile(result.profile);
      setDisplayName(result.profile.displayName);
      setBio(result.profile.bio);
      setPronouns(result.profile.pronouns);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar tu perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadProfile());
    return () => window.cancelAnimationFrame(frame);
  }, [loadProfile]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/profile/cosmetics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", displayName, bio, pronouns }),
      });
      const result = await response.json().catch(() => null) as {
        error?: string;
        profile?: { displayName: string; bio: string; pronouns: string };
      } | null;
      if (!response.ok || !result?.profile) throw new Error(result?.error ?? "No se pudo guardar tu perfil.");
      setDisplayName(result.profile.displayName);
      setBio(result.profile.bio);
      setPronouns(result.profile.pronouns);
      setProfile((current) => current ? {
        ...current,
        displayName: result.profile!.displayName,
        bio: result.profile!.bio,
        pronouns: result.profile!.pronouns,
      } : current);
      setNotice("Cambios guardados. Tu perfil ya está actualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(kind: "avatar" | "banner", file: File | null) {
    if (!file) return;
    setError("");
    setNotice("");
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      setError("La imagen debe pesar máximo 8 MB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Usa una imagen PNG, JPG o WebP.");
      return;
    }

    setUploading(kind);
    try {
      const form = new FormData();
      form.set("asset_type", kind);
      form.set("file", file);
      const response = await fetch("/api/profile/assets", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const result = await response.json().catch(() => null) as { assetUrl?: string; error?: string } | null;
      if (!response.ok || !result?.assetUrl) throw new Error(result?.error ?? "No se pudo subir la imagen.");
      setProfile((current) => current
        ? { ...current, [kind === "avatar" ? "avatarUrl" : "bannerUrl"]: result.assetUrl! }
        : current);
      setNotice(kind === "avatar" ? "Foto de perfil actualizada." : "Banner actualizado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(null);
      if (kind === "avatar" && avatarInput.current) avatarInput.current.value = "";
      if (kind === "banner" && bannerInput.current) bannerInput.current.value = "";
    }
  }

  return (
    <main className="peak-profile-editor">
      <div className="peak-profile-editor-shell">
        <header className="peak-profile-editor-header">
          <div className="peak-profile-header-actions"><Link href="/perfil/personajes" className="peak-profile-back"><ArrowLeft size={16}/> Volver al perfil</Link>{profile?.id && <Link href={"/perfil/ver/" + profile.id} className="peak-profile-view-link">Ver perfil público</Link>}</div>
          <div className="peak-profile-wordmark"><span>PEAK</span><b>SCORE</b><i> / IDENTITY</i></div>
        </header>

        <div className="peak-profile-title">
          <div>
            <p className="peak-profile-eyebrow">PEAKSCORE / PLAYER IDENTITY</p>
            <h1>Tu perfil. Tu historia.</h1>
            <p>Construye una identidad que represente tu camino dentro de la comunidad.</p>
          </div>
          <div className="peak-profile-title-index"><span>PLAYER</span><strong>IDENTITY</strong><i>PS — 001</i></div>
        </div>

        {error && <p className="peak-profile-feedback is-error" role="alert">{error}</p>}
        {notice && <p className="peak-profile-feedback is-success" role="status">{notice}</p>}

        <div className="peak-profile-editor-grid">
          <section className="peak-profile-preview-column">
            <div className="peak-profile-section-label"><span>VISTA EN VIVO</span><i>PERFIL PÚBLICO</i></div>
            <article className="peak-profile-card">
              <div className="peak-profile-card-banner" style={profile?.bannerUrl ? { backgroundImage: "linear-gradient(180deg,transparent 45%,rgba(7,12,26,.55)),url(" + JSON.stringify(profile.bannerUrl) + ")" } : undefined}>
                {!profile?.bannerUrl && <div className="peak-profile-banner-art"><span>PEAKSCORE</span><small>YOUR JOURNEY. YOUR LEGACY.</small></div>}
                <span className="peak-profile-banner-corner">PEAKSCORE / PLAYER ID</span>
                <div className="peak-profile-banner-watermark" aria-hidden="true">PS<span> / 11</span></div>
              </div>
              <div className="peak-profile-card-content">
                <div className="peak-profile-card-identity">
                  <div className="peak-profile-avatar">
                    {profile?.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="112px" className="object-cover"/>
                      : <span>{(displayName || "P").slice(0,1).toUpperCase()}</span>}
                  </div>
                  <div className="peak-profile-card-name">
                    <span className="peak-profile-level">LEVEL {profile?.level ?? 1}</span>
                    <h2>{displayName || "Tu nombre"}</h2>
                    {pronouns && <small>{pronouns}</small>}
                  </div>
                  <span className="peak-profile-member-tag"><i/> MIEMBRO PEAKSCORE</span>
                </div>
                <p className="peak-profile-card-bio">{bio || "Tu descripción será el primer vistazo que tendrá la comunidad sobre ti."}</p>
                <div className="peak-profile-card-accent-line"><span>PLAYER SUMMARY</span><span>ICFES / COMMUNITY</span></div>
                <div className="peak-profile-card-divider"/>
                <div className="peak-profile-card-stats">
                  <div><span>EXPERIENCIA</span><strong>{Number(profile?.xp ?? 0).toLocaleString("es-CO")} XP</strong></div>
                  <div><span>NIVEL</span><strong>{profile?.level ?? 1}</strong></div>
                  <div><span>PERSONAJE</span><strong>{previewCharacter?.name ?? "Por elegir"}</strong></div>
                </div>
                {previewCharacter && previewCharacterId && (
                  <div className="peak-profile-companion-preview">
                    <Image src={CHARACTER_IMAGES[previewCharacterId]} alt={previewCharacter.name} width={58} height={58} unoptimized/>
                    <div><span>COMPAÑERO EQUIPADO</span><strong>{previewCharacter.name}</strong><small>{previewCharacter.title}</small></div>
                  </div>
                )}
                <div className="peak-profile-profile-id"><span>PLAYER ID</span><strong>{profile?.id ? profile.id.slice(0, 8).toUpperCase() : "—"}</strong><span>VERIFICADO POR PEAKSCORE</span></div>
              </div>
            </article>
            <div className="peak-profile-preview-note"><ShieldCheck size={15}/> Tu perfil público solo muestra información de juego y los datos que decides compartir.</div>
          </section>

          <div className="peak-profile-side-stack">
            <section className="peak-profile-quick-panel">
              <div className="peak-profile-section-label"><span>TU IDENTIDAD</span><i>PROFILE TOOLS</i></div>
              <div className="peak-profile-quick-row"><div className="peak-profile-quick-icon"><Sparkles size={16}/></div><div><strong>Vista pública</strong><p>Revisa cómo aparece tu perfil a los demás.</p></div><Link href={profile?.id ? "/perfil/ver/" + profile.id : "/perfil/personajes"} aria-label="Abrir vista pública"><ExternalLink size={15}/></Link></div>
              <div className="peak-profile-quick-row"><div className="peak-profile-quick-icon"><Trophy size={16}/></div><div><strong>Tu progreso</strong><p>Nivel {profile?.level ?? 1} · {Number(profile?.xp ?? 0).toLocaleString("es-CO")} XP acumulada.</p></div></div>
              <div className="peak-profile-quick-row"><div className="peak-profile-quick-icon"><Gamepad2 size={16}/></div><div><strong>Personaje</strong><p>{profile?.selectedCharacter || "Todavía no has elegido uno."}</p></div><Link href="/perfil/personajes" aria-label="Cambiar personaje"><ExternalLink size={15}/></Link></div>
              <button type="button" className="peak-profile-copy-link" disabled={!profile?.id} onClick={() => {
                if (!publicProfileUrl) return;
                if (!navigator.clipboard?.writeText) {
                  setError("Tu navegador no permite copiar el enlace desde esta página.");
                  return;
                }
                void navigator.clipboard.writeText(publicProfileUrl).then(() => {
                  setCopiedProfile(true);
                  window.setTimeout(() => setCopiedProfile(false), 1800);
                }).catch(() => setError("No se pudo copiar el enlace del perfil."));
              }}>{copiedProfile ? <Check size={14}/> : <Copy size={14}/>} {copiedProfile ? "ENLACE COPIADO" : "COPIAR ENLACE DEL PERFIL"}</button>
            </section>
            <section className="peak-profile-completion">
              <div className="peak-profile-completion-top"><div><span>PERFIL</span><strong>LISTO PARA LA COMUNIDAD</strong></div><b>{profileCompletion}%</b></div>
              <div className="peak-profile-completion-track" role="progressbar" aria-label="Completitud del perfil" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion}><i style={{ width: profileCompletion + "%" }}/></div>
              <div className="peak-profile-completion-list">
                {profileSteps.map((step) => <div key={step.label} className={step.done ? "is-done" : ""}><span>{step.done ? <Check size={11}/> : <i/>}</span>{step.label}</div>)}
              </div>
            </section>
            <section className="peak-profile-design-note"><span>PEAKSCORE IDENTITY SYSTEM</span><strong>Una identidad que evoluciona contigo.</strong><p>Tu nivel y tu personaje muestran tu recorrido. Tu descripción cuenta el resto.</p></section>
          </div>

          <section className="peak-profile-form-panel">
            <div className="peak-profile-form-heading">
              <div><p className="peak-profile-eyebrow">EDIT PROFILE</p><h2>Tu identidad</h2></div>
              <UserRound size={20}/>
            </div>

            <div className="peak-profile-image-edit">
              <div className="peak-profile-image-row">
                <div className="peak-profile-avatar-small">
                  {profile?.avatarUrl
                    ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="68px" className="object-cover"/>
                    : <span>{(displayName || "P").slice(0,1).toUpperCase()}</span>}
                </div>
                <div><strong>Foto de perfil</strong><p>Tu avatar en la comunidad, mensajes y perfil.</p></div>
                <button type="button" onClick={() => avatarInput.current?.click()} disabled={uploading !== null}>
                  <Camera size={14}/>{uploading === "avatar" ? "Subiendo..." : "Cambiar"}
                </button>
              </div>
              <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void uploadAsset("avatar", event.target.files?.[0] ?? null)}/>
              <div className="peak-profile-banner-edit">
                <div className="peak-profile-banner-thumb" style={profile?.bannerUrl ? { backgroundImage: "url(" + JSON.stringify(profile.bannerUrl) + ")" } : undefined}><ImagePlus size={18}/></div>
                <div><strong>Banner del perfil</strong><p>La imagen que encabeza tu tarjeta.</p></div>
                <button type="button" onClick={() => bannerInput.current?.click()} disabled={uploading !== null}>
                  <ImagePlus size={14}/>{uploading === "banner" ? "Subiendo..." : "Cambiar"}
                </button>
              </div>
              <input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => void uploadAsset("banner", event.target.files?.[0] ?? null)}/>
              <small className="peak-profile-image-rules">PNG, JPG o WebP · Máximo 8 MB · Se eliminan metadatos EXIF y GPS.</small>
            </div>

            <label className="peak-profile-field">
              <span>Nombre visible <small>{displayName.length}/32</small></span>
              <input value={displayName} maxLength={32} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tu nombre en PeakScore" autoComplete="nickname"/>
            </label>
            <label className="peak-profile-field">
              <span>Sobre mí <small>{bio.length}/160</small></span>
              <textarea value={bio} maxLength={160} rows={4} onChange={(event) => setBio(event.target.value)} placeholder="Tus intereses, tus juegos, tus metas..."/>
            </label>
            <label className="peak-profile-field">
              <span>Pronombres <small>Opcional</small></span>
              <input value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Ej. él / ella / elle"/>
            </label>
            <button type="button" className="peak-profile-save" onClick={() => void saveProfile()} disabled={saving || loading || !displayName.trim()}>
              <Save size={16}/>{saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <p className="peak-profile-form-footnote">Los cambios se guardan en tu cuenta y se reflejan en tu perfil público.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
