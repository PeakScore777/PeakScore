"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  X, Camera, ImagePlus, Palette, Frame, Layers3, Save, UserRound,
  AtSign, Sparkles, ShieldCheck, Store, Check, Ban,
} from "lucide-react";

type Section = "profile" | "avatar" | "nameplate" | "banner" | "effects" | "color" | "nameStyle";
type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  statusText: string;
  pronouns?: string;
  about: string;
  joinedAt: string;
  cardColor?: string;
  roles: { roleKey: string; label: string; badgeColor: string }[];
  isOwnProfile: boolean;
};
type Props = {
  userId: string;
  initialProfile: CommunityIdentity;
  onClose: () => void;
  onSaved: () => void;
};

const NAV: { id: Section; label: string; description: string; icon: typeof UserRound; shop?: boolean }[] = [
  { id: "profile", label: "Perfil principal", description: "Nombre, estado y sobre mí", icon: UserRound },
  { id: "nameplate", label: "Placa de identificación", description: "Cómo apareces en miembros", icon: Layers3 },
  { id: "avatar", label: "Avatar y decoración", description: "Foto de perfil y marco", icon: Frame },
  { id: "banner", label: "Banner de perfil", description: "La portada de tu tarjeta", icon: ImagePlus, shop: true },
  { id: "effects", label: "Efectos de perfil", description: "Detalles visuales y animaciones", icon: Sparkles, shop: true },
  { id: "color", label: "Color de tarjeta", description: "El tono de tu perfil", icon: Palette },
  { id: "nameStyle", label: "Estilo de nombre", description: "Tipografía y placa", icon: AtSign, shop: true },
];

const COLORS = [
  { name: "Carbón", value: "#24252a" },
  { name: "Medianoche", value: "#20283a" },
  { name: "Pizarra", value: "#30343b" },
  { name: "Bosque", value: "#20352d" },
  { name: "Ciruela", value: "#342536" },
  { name: "Óxido", value: "#3a2d27" },
  { name: "Azul tinta", value: "#202e43" },
  { name: "Grafito", value: "#191a1e" },
];

function safeColor(value: string | undefined) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#24252a";
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "P").slice(0, 2)).toUpperCase();
}

export default function CommunityProfileStudio({ userId, initialProfile, onClose, onSaved }: Props) {
  const [section, setSection] = useState<Section>("profile");
  const [profile, setProfile] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
  const [pronouns, setPronouns] = useState(initialProfile.pronouns ?? "");
  const [status, setStatus] = useState(initialProfile.statusText ?? "");
  const [about, setAbout] = useState(initialProfile.about ?? "");
  const [cardColor, setCardColor] = useState(safeColor(initialProfile.cardColor));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function saveProfile() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/community/profile/" + userId, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, pronouns, statusText: status, about, cardColor }),
      });
      const payload = await response.json().catch(() => null) as {
        error?: string; cardColorSaved?: boolean;
        profile?: Partial<CommunityIdentity>;
      } | null;
      if (!response.ok || !payload?.profile) throw new Error(payload?.error ?? "No se pudieron guardar los cambios.");

      const updated: CommunityIdentity = {
        ...profile,
        ...payload.profile,
        displayName: payload.profile.displayName ?? displayName,
        pronouns: payload.profile.pronouns ?? pronouns,
        statusText: payload.profile.statusText ?? status,
        about: payload.profile.about ?? about,
        cardColor: payload.profile.cardColor ?? cardColor,
      };
      setProfile(updated);
      if (payload.cardColorSaved === false) {
        setNotice("Tu identidad se guardó. El color personalizado estará disponible al actualizar la base de datos.");
      } else {
        setNotice("Cambios guardados.");
      }
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setError("Selecciona una imagen PNG, JPG o WebP de máximo 5 MB.");
      if (avatarInput.current) avatarInput.current.value = "";
      return;
    }
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("kind", "avatar");
      form.set("file", file);
      const response = await fetch("/api/community/profile/" + userId, {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json().catch(() => null) as { error?: string; avatarUrl?: string } | null;
      if (!response.ok || !payload?.avatarUrl) throw new Error(payload?.error ?? "No se pudo actualizar la foto.");
      setProfile((current) => ({ ...current, avatarUrl: payload.avatarUrl ?? null }));
      setNotice("Foto de perfil actualizada.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la foto.");
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  const activeNav = NAV.find((item) => item.id === section)!;
  const joinedLabel = new Date(profile.joinedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="ps-community-studio-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="ps-community-studio" role="dialog" aria-modal="true" aria-label="Editar perfil de la comunidad">
        <header className="ps-community-studio-header">
          <div className="ps-community-studio-header-copy">
            <span>EDITAR PERFIL</span>
            <strong>{profile.displayName || "Miembro"}</strong>
          </div>
          <button type="button" className="ps-community-studio-close" onClick={onClose} aria-label="Cerrar editor"><X size={20}/></button>
        </header>

        <div className="ps-community-studio-layout">
          <aside className="ps-community-studio-sidebar">
            <div className="ps-community-studio-sidebar-label">TU PERFIL</div>
            <div className="ps-community-studio-mini-account">
              <div className="ps-community-studio-mini-avatar">
                {profile.avatarUrl
                  ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="52px"/>
                  : <span>{initials(displayName || "PeakScore")}</span>}
              </div>
              <div><strong>{displayName || "Miembro"}</strong><small>Identidad de comunidad</small></div>
            </div>
            <nav className="ps-community-studio-nav" aria-label="Personalización del perfil">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={"ps-community-studio-nav-item" + (section === item.id ? " is-active" : "") + (item.shop ? " is-shop-locked" : "")}
                    onClick={() => { if (!item.shop) { setSection(item.id); setError(""); setNotice(""); } }}
                    aria-current={section === item.id ? "page" : undefined}
                    aria-disabled={item.shop || undefined}
                    title={item.shop ? "Disponible cuando se habilite la tienda" : item.label}
                  >
                    <span className="ps-community-studio-nav-icon"><Icon size={17}/></span>
                    <span className="ps-community-studio-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                    {item.shop ? <span className="ps-community-studio-shop-tag">TIENDA</span> : <span className="ps-community-studio-nav-chevron">›</span>}
                  </button>
                );
              })}
            </nav>
            <div className="ps-community-studio-sidebar-foot">
              <span>PEAKSCORE COMMUNITY</span>
              <p>Tu identidad dentro de la comunidad. Separada de tu perfil académico y de juego.</p>
            </div>
          </aside>

          <main className="ps-community-studio-main">
            <div className="ps-community-studio-heading">
              <div><span>{activeNav.label.toUpperCase()}</span><h1>{section === "profile" ? "Tu identidad, a tu manera." : activeNav.label}</h1><p>{activeNav.description}.</p></div>
              <div className="ps-community-studio-heading-mark">PS <i>COMMUNITY</i></div>
            </div>

            {(error || notice) && <div className={"ps-community-studio-feedback" + (error ? " is-error" : "")} role={error ? "alert" : "status"}>{error || notice}</div>}

            <div className="ps-community-studio-content">
              <section className="ps-community-studio-preview-column">
                <div className="ps-community-studio-section-kicker"><span>VISTA PREVIA</span><i>ASÍ TE VEN LOS DEMÁS</i></div>
                <article className="ps-community-studio-preview-card" style={{ backgroundColor: safeColor(cardColor) }}>
                  <div className="ps-community-studio-preview-cover">
                    <div className="ps-community-studio-cover-grid"/>
                    <div className="ps-community-studio-cover-glow"/>
                    <span className="ps-community-studio-cover-mark">PEAK<span>SCORE</span></span>
                    <small>COMMUNITY MEMBER</small>
                  </div>
                  <div className="ps-community-studio-preview-body">
                    <div className="ps-community-studio-preview-top">
                      <div className="ps-community-studio-avatar">
                        {profile.avatarUrl
                          ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="108px"/>
                          : <span>{initials(displayName || "PeakScore")}</span>}
                      </div>
                      <span className="ps-community-studio-preview-role">MIEMBRO</span>
                    </div>
                    <h2>{displayName || "Tu nombre"}</h2>
                    <div className="ps-community-studio-preview-subline">{pronouns || "Miembro de PeakScore"}</div>
                    {status && <div className="ps-community-studio-preview-status">{status}</div>}
                    {profile.roles.length > 0 && <div className="ps-community-studio-preview-roles">{profile.roles.slice(0, 5).map((role) => <span key={role.roleKey} style={{ borderColor: role.badgeColor + "88", color: role.badgeColor }}>{role.label}</span>)}</div>}
                    <div className="ps-community-studio-preview-divider"/>
                    <div className="ps-community-studio-preview-about"><span>SOBRE MÍ</span><p>{about || "Tu historia en PeakScore comienza aquí."}</p></div>
                    <div className="ps-community-studio-preview-joined"><span>MIEMBRO DESDE</span><strong>{joinedLabel}</strong></div>
                  </div>
                </article>
                <div className="ps-community-studio-preview-note"><ShieldCheck size={14}/> Solo se muestra la información que compartes con la comunidad.</div>
              </section>

              <section className="ps-community-studio-controls">
                {section === "profile" && (
                  <div className="ps-community-studio-form">
                    <div className="ps-community-studio-form-title"><span>IDENTIDAD BÁSICA</span><small>Los cambios se guardan en tu perfil comunitario.</small></div>
                    <label>Nombre visible<input value={displayName} maxLength={32} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tu nombre" autoComplete="nickname"/><small>{displayName.length}/32</small></label>
                    <label>Pronombres<input value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Opcional"/></label>
                    <label>Estado personalizado<input value={status} maxLength={80} onChange={(event) => setStatus(event.target.value)} placeholder="¿Qué estás haciendo?"/></label>
                    <label>Sobre mí<textarea value={about} maxLength={280} rows={5} onChange={(event) => setAbout(event.target.value)} placeholder="Cuéntale algo a la comunidad…"/><small>{about.length}/280</small></label>
                    <button type="button" className="ps-community-studio-save" onClick={() => void saveProfile()} disabled={busy || uploading || displayName.trim().length < 2}>
                      {busy ? <span className="ps-community-studio-button-spinner"/> : <Save size={16}/>}
                      {busy ? "Guardando cambios…" : "Guardar cambios"}
                    </button>
                  </div>
                )}

                {section === "avatar" && (
                  <div className="ps-community-studio-settings">
                    <div className="ps-community-studio-form-title"><span>FOTO DE PERFIL</span><small>Tu imagen se muestra en el chat y en la lista de miembros.</small></div>
                    <div className="ps-community-studio-avatar-editor">
                      <div className="ps-community-studio-avatar-large">
                        {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="116px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                      </div>
                      <div><strong>{displayName || "Miembro"}</strong><p>PNG, JPG o WebP. Máximo 5 MB. La imagen se procesa en el servidor para eliminar metadatos.</p>
                        <button type="button" onClick={() => avatarInput.current?.click()} disabled={uploading || busy}>{uploading ? "Subiendo foto…" : "Cambiar foto"}</button>
                        <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0] ?? null)}/>
                      </div>
                    </div>
                    <div className="ps-community-studio-shop-placeholder"><Frame size={18}/><div><strong>Marcos y decoraciones</strong><p>La colección se habilitará desde la tienda. Aquí aparecerán tus artículos disponibles y la previsualización antes de equiparlos.</p></div><span>TIENDA</span></div>
                  </div>
                )}

                {section === "nameplate" && (
                  <div className="ps-community-studio-settings">
                    <div className="ps-community-studio-form-title"><span>PLACA DE IDENTIFICACIÓN</span><small>Así aparece tu nombre cuando alguien te ve en la lista de miembros.</small></div>
                    <div className="ps-community-studio-nameplate-preview"><strong>{displayName || "Tu nombre"}</strong><span>MIEMBRO DE PEAKSCORE</span></div>
                    <div className="ps-community-studio-shop-placeholder"><Layers3 size={18}/><div><strong>Estilos de placa</strong><p>El selector de placas y sus diseños se conectará a la tienda de la comunidad. Tu nombre seguirá visible con el estilo predeterminado.</p></div><span>TIENDA</span></div>
                  </div>
                )}

                {section === "color" && (
                  <div className="ps-community-studio-settings">
                    <div className="ps-community-studio-form-title"><span>COLOR DE TARJETA</span><small>Elige un tono para la superficie de tu ficha comunitaria.</small></div>
                    <div className="ps-community-studio-colors">{COLORS.map((color) => <button type="button" key={color.value} className={cardColor === color.value ? "is-selected" : ""} style={{ backgroundColor: color.value }} onClick={() => { setCardColor(color.value); setNotice("Vista previa actualizada. Guarda para aplicar el color."); setError(""); }} aria-label={color.name} title={color.name}>{cardColor === color.value && <Check size={17}/>}</button>)}</div>
                    <div className="ps-community-studio-color-value"><span>{COLORS.find((color) => color.value === cardColor)?.name ?? "Personalizado"}</span><code>{cardColor.toUpperCase()}</code></div>
                    <button type="button" className="ps-community-studio-save" onClick={() => void saveProfile()} disabled={busy || uploading || displayName.trim().length < 2}>{busy ? "Guardando…" : <><Save size={16}/> Guardar color y perfil</>}</button>
                  </div>
                )}

                {(section === "banner" || section === "effects" || section === "nameStyle") && (
                  <div className="ps-community-studio-settings">
                    <div className="ps-community-studio-shop-hero"><Store size={24}/><span>PRÓXIMAMENTE EN LA TIENDA</span><h2>{activeNav.label}</h2><p>Esta personalización se desbloqueará desde la tienda de PeakScore. No se aplicará ningún artículo inexistente ni se descontarán PeakCoins hasta que la tienda esté disponible.</p></div>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
