"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { X, Camera, ImagePlus, Palette, Save, UserRound, BadgeCheck, ShieldCheck, Check, UploadCloud } from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type Section = "profile" | "avatar" | "banner" | "color" | "plate";
type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  plateStyle?: PlateStyle;
  pronouns?: string;
  statusText: string;
  about: string;
  joinedAt: string;
  roles: { roleKey: string; label: string; badgeColor: string }[];
  isOwnProfile: boolean;
  appearanceReady?: boolean;
};
type Props = { userId: string; initialProfile: CommunityIdentity; onClose: () => void; onSaved: () => void };

const NAV: { id: Section; label: string; description: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "Perfil principal", description: "Nombre, estado y sobre mí", icon: UserRound },
  { id: "avatar", label: "Avatar", description: "Tu imagen de comunidad", icon: Camera },
  { id: "banner", label: "Banner", description: "La portada de tu perfil", icon: ImagePlus },
  { id: "color", label: "Color de tarjeta", description: "El tono de tu identidad", icon: Palette },
  { id: "plate", label: "Placa de miembro", description: "Cómo aparece tu nombre", icon: BadgeCheck },
];
const COLORS = [
  { name: "Carbón", value: "#24252A" }, { name: "Medianoche", value: "#0B1020" },
  { name: "Pizarra", value: "#303943" }, { name: "Bosque", value: "#20382F" },
  { name: "Óxido", value: "#493127" }, { name: "Azul tinta", value: "#1B3045" },
  { name: "Grafito", value: "#191C22" }, { name: "Piedra", value: "#353A40" },
];
const PLATES: { id: PlateStyle; label: string; description: string }[] = [
  { id: "classic", label: "Clásica", description: "Limpia y discreta" },
  { id: "grid", label: "Pixel Grid", description: "Retícula GameCode" },
  { id: "arcade", label: "Arcade", description: "Acento verde lima" },
  { id: "signal", label: "Signal", description: "Línea cian técnica" },
];
const safeColor = (value?: string) => value && /^#[0-9a-f]{6}$/i.test(value) ? value : "#24252A";
const safePlate = (value?: string): PlateStyle => value === "grid" || value === "arcade" || value === "signal" ? value : "classic";
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
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function saveProfile() {
    if (!profile.isOwnProfile || busy || uploading) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/community/profile/" + userId, {
        method: "PATCH", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, pronouns, statusText: status, about, cardColor, plateStyle }),
      });
      const payload = await response.json().catch(() => null) as {
        error?: string; appearanceSaved?: boolean; profile?: Partial<CommunityIdentity>;
      } | null;
      if (!response.ok || !payload?.profile) throw new Error(payload?.error ?? "No se pudieron guardar los cambios.");
      const updated = {
        ...profile, ...payload.profile,
        displayName: payload.profile.displayName ?? displayName,
        pronouns: payload.profile.pronouns ?? pronouns,
        statusText: payload.profile.statusText ?? status,
        about: payload.profile.about ?? about,
        cardColor: payload.profile.cardColor ?? cardColor,
        plateStyle: safePlate(payload.profile.plateStyle ?? plateStyle),
      };
      setProfile(updated); setCardColor(updated.cardColor); setPlateStyle(updated.plateStyle);
      setNotice(payload.appearanceSaved === false
        ? "Los datos básicos se guardaron. Banner, color y placa quedarán activos al aplicar la migración de apariencia comunitaria."
        : "Cambios guardados en tu perfil de comunidad.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios.");
    } finally { setBusy(false); }
  }

  async function uploadAsset(kind: "avatar" | "banner", file: File | null) {
    if (!file || !profile.isOwnProfile) return;
    const maxBytes = kind === "avatar" ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size <= 0 || file.size > maxBytes) {
      setError(kind === "avatar"
        ? "Selecciona una imagen PNG, JPG o WebP de máximo 5 MB."
        : "Selecciona una imagen PNG, JPG o WebP de máximo 8 MB.");
      const input = kind === "avatar" ? avatarInput.current : bannerInput.current;
      if (input) input.value = "";
      return;
    }
    setUploading(kind); setError(""); setNotice("");
    try {
      const form = new FormData(); form.set("kind", kind); form.set("file", file);
      const response = await fetch("/api/community/profile/" + userId, {
        method: "POST", credentials: "same-origin", body: form,
      });
      const payload = await response.json().catch(() => null) as {
        error?: string; avatarUrl?: string; bannerUrl?: string;
      } | null;
      const nextUrl = kind === "avatar" ? payload?.avatarUrl : payload?.bannerUrl;
      if (!response.ok || !nextUrl) throw new Error(payload?.error ?? "No se pudo actualizar la imagen.");
      setProfile((current) => ({ ...current, ...(kind === "avatar" ? { avatarUrl: nextUrl } : { bannerUrl: nextUrl }) }));
      setNotice(kind === "avatar" ? "Avatar actualizado." : "Banner actualizado.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la imagen.");
    } finally {
      setUploading(null);
      const input = kind === "avatar" ? avatarInput.current : bannerInput.current;
      if (input) input.value = "";
    }
  }

  const activeNav = NAV.find((item) => item.id === section)!;
  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime()) ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="ps-community-studio-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="ps-community-studio" role="dialog" aria-modal="true" aria-label="Editar perfil de la comunidad">
        <header className="ps-community-studio-header">
          <div className="ps-community-studio-header-copy"><span>PEAKSCORE / COMMUNITY IDENTITY</span><strong>{profile.displayName || "Miembro"}</strong></div>
          <button type="button" className="ps-community-studio-close" onClick={onClose} aria-label="Cerrar editor"><X size={20}/></button>
        </header>
        <div className="ps-community-studio-layout">
          <aside className="ps-community-studio-sidebar">
            <div className="ps-community-studio-sidebar-label">TU IDENTIDAD</div>
            <div className="ps-community-studio-mini-account">
              <div className="ps-community-studio-mini-avatar">
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="52px"/> : <span>{initials(displayName || "PeakScore")}</span>}
              </div>
              <div><strong>{displayName || "Miembro"}</strong><small>Perfil de comunidad</small></div>
            </div>
            <nav className="ps-community-studio-nav" aria-label="Secciones de identidad">
              {NAV.map((item) => {
                const Icon = item.icon;
                return <button type="button" key={item.id}
                  className={"ps-community-studio-nav-item" + (section === item.id ? " is-active" : "")}
                  onClick={() => { setSection(item.id); setError(""); setNotice(""); }}
                  aria-current={section === item.id ? "page" : undefined}>
                  <span className="ps-community-studio-nav-icon"><Icon size={17}/></span>
                  <span className="ps-community-studio-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                  <span className="ps-community-studio-nav-chevron">›</span>
                </button>;
              })}
            </nav>
            <div className="ps-community-studio-sidebar-foot">
              <span>IDENTIDAD INDEPENDIENTE</span>
              <p>Tu perfil social no modifica tu progreso académico, nivel, XP ni personajes.</p>
            </div>
          </aside>
          <main className="ps-community-studio-main">
            <div className="ps-community-studio-heading">
              <div><span>{activeNav.label.toUpperCase()}</span>
                <h1>{section === "profile" ? "Tu identidad, a tu manera." : activeNav.label}</h1>
                <p>{activeNav.description}.</p></div>
              <div className="ps-community-studio-heading-mark">PS <i>COMMUNITY</i></div>
            </div>
            {(error || notice) && <div className={"ps-community-studio-feedback" + (error ? " is-error" : "")}
              role={error ? "alert" : "status"}>{error || notice}</div>}
            {!profile.appearanceReady && <div className="ps-community-studio-feedback is-pending" role="status">
              La base conectada todavía no tiene activados los campos de banner, color y placa. El editor básico sigue disponible; la apariencia se persistirá al aplicar la migración de esta rama.
            </div>}
            <div className="ps-community-studio-content">
              <section className="ps-community-studio-preview-column">
                <div className="ps-community-studio-section-kicker"><span>VISTA PREVIA EN VIVO</span><i>ASÍ TE VE LA COMUNIDAD</i></div>
                <article className={"ps-community-studio-preview-card community-plate-" + plateStyle}
                  style={{ backgroundColor: safeColor(cardColor) }}>
                  <div className="ps-community-studio-preview-cover" style={profile.bannerUrl ? {
                    backgroundImage: "linear-gradient(180deg,transparent 38%,rgba(5,10,20,.62)),url(" + JSON.stringify(profile.bannerUrl) + ")",
                    backgroundPosition: "center", backgroundSize: "cover",
                  } : undefined}>
                    {!profile.bannerUrl && <><div className="ps-community-studio-cover-grid"/><div className="ps-community-studio-cover-glow"/>
                      <span className="ps-community-studio-cover-mark">PEAK<span>SCORE</span></span><small>COMMUNITY MEMBER</small></>}
                  </div>
                  <div className="ps-community-studio-preview-body">
                    <div className="ps-community-studio-preview-top">
                      <div className="ps-community-studio-avatar">
                        {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="108px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                      </div>
                      <span className="ps-community-studio-preview-role">MIEMBRO</span>
                    </div>
                    <h2 className={"ps-community-studio-preview-name is-plate-" + plateStyle}>{displayName || "Tu nombre"}</h2>
                    <div className="ps-community-studio-preview-subline">{pronouns || "Miembro de PeakScore"}</div>
                    {status && <div className="ps-community-studio-preview-status">{status}</div>}
                    {profile.roles.length > 0 && <div className="ps-community-studio-preview-roles">
                      {profile.roles.slice(0, 5).map((role) => <span key={role.roleKey} style={{
                        borderColor: (/^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#8B93B5") + "88",
                        color: /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#C8D0DC",
                      }}>{role.label}</span>)}
                    </div>}
                    <div className="ps-community-studio-preview-divider"/>
                    <div className="ps-community-studio-preview-about"><span>SOBRE MÍ</span><p>{about || "Tu historia en PeakScore comienza aquí."}</p></div>
                    <div className="ps-community-studio-preview-joined"><span>MIEMBRO DESDE</span><strong>{joinedLabel}</strong></div>
                  </div>
                </article>
                <div className="ps-community-studio-preview-note"><ShieldCheck size={14}/> Solo se publica la información de tu identidad comunitaria.</div>
              </section>

              <section className="ps-community-studio-controls">
                {section === "profile" && <div className="ps-community-studio-form">
                  <div className="ps-community-studio-form-title"><span>IDENTIDAD BÁSICA</span><small>Datos visibles en tu perfil de comunidad.</small></div>
                  <label>Nombre visible<input value={displayName} maxLength={32} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tu nombre" autoComplete="nickname"/><small>{displayName.length}/32</small></label>
                  <label>Pronombres<input value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Opcional"/></label>
                  <label>Estado personalizado<input value={status} maxLength={80} onChange={(event) => setStatus(event.target.value)} placeholder="¿Qué estás haciendo?"/></label>
                  <label>Sobre mí<textarea value={about} maxLength={280} rows={5} onChange={(event) => setAbout(event.target.value)} placeholder="Cuéntale algo a la comunidad…"/><small>{about.length}/280</small></label>
                  <button type="button" className="ps-community-studio-save" onClick={() => void saveProfile()} disabled={busy || Boolean(uploading) || displayName.trim().length < 2}>
                    {busy ? <span className="ps-community-studio-button-spinner"/> : <Save size={16}/>}
                    {busy ? "Guardando cambios…" : "Guardar cambios"}
                  </button>
                </div>}

                {section === "avatar" && <div className="ps-community-studio-settings">
                  <div className="ps-community-studio-form-title"><span>AVATAR DE COMUNIDAD</span><small>Se muestra en tus mensajes y en la lista de miembros.</small></div>
                  <div className="ps-community-studio-avatar-editor">
                    <div className="ps-community-studio-avatar-large">
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="116px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <div><strong>{displayName || "Miembro"}</strong><p>PNG, JPG o WebP estático. Máximo 5 MB. Se procesa en el servidor y se eliminan sus metadatos.</p>
                      <button type="button" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading) || busy}>{uploading === "avatar" ? "Subiendo avatar…" : "Cambiar avatar"}</button>
                      <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAsset("avatar", event.target.files?.[0] ?? null)}/>
                    </div>
                  </div>
                </div>}

                {section === "banner" && <div className="ps-community-studio-settings">
                  <div className="ps-community-studio-form-title"><span>BANNER DEL PERFIL</span><small>Portada propia de tu ficha social, separada del perfil académico.</small></div>
                  <div className="ps-community-studio-banner-preview" style={profile.bannerUrl ? {
                    backgroundImage: "linear-gradient(180deg,transparent 42%,rgba(5,10,20,.65)),url(" + JSON.stringify(profile.bannerUrl) + ")",
                  } : undefined}>
                    {!profile.bannerUrl && <><span>PEAK<span>SCORE</span></span><small>COMMUNITY IDENTITY</small></>}
                  </div>
                  <div className="ps-community-studio-upload-copy"><strong>{profile.bannerUrl ? "Banner personalizado" : "Crea tu portada"}</strong>
                    <p>PNG, JPG o WebP estático, máximo 8 MB. El archivo se sanea antes de guardarse.</p>
                    <button type="button" onClick={() => bannerInput.current?.click()} disabled={Boolean(uploading) || busy}><UploadCloud size={16}/>{uploading === "banner" ? "Subiendo banner…" : "Subir banner"}</button>
                    <input ref={bannerInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAsset("banner", event.target.files?.[0] ?? null)}/>
                  </div>
                </div>}

                {section === "color" && <div className="ps-community-studio-settings">
                  <div className="ps-community-studio-form-title"><span>COLOR DE TARJETA</span><small>Elige el tono de fondo de tu ficha comunitaria.</small></div>
                  <div className="ps-community-studio-colors">{COLORS.map((color) => <button type="button" key={color.value}
                    className={cardColor === color.value ? "is-selected" : ""} style={{ backgroundColor: color.value }}
                    onClick={() => { setCardColor(color.value); setNotice("Vista previa actualizada. Guarda para aplicar el color."); setError(""); }}
                    aria-label={color.name} title={color.name}>{cardColor === color.value && <Check size={17}/>}</button>)}</div>
                  <div className="ps-community-studio-color-value"><span>{COLORS.find((color) => color.value === cardColor)?.name ?? "Personalizado"}</span><code>{cardColor.toUpperCase()}</code></div>
                  <button type="button" className="ps-community-studio-save" onClick={() => void saveProfile()} disabled={busy || Boolean(uploading) || displayName.trim().length < 2}>{busy ? "Guardando…" : <><Save size={16}/> Guardar apariencia</>}</button>
                </div>}

                {section === "plate" && <div className="ps-community-studio-settings">
                  <div className="ps-community-studio-form-title"><span>PLACA DE MIEMBRO</span><small>El estilo aparece junto a tu nombre en el chat y la lista de miembros.</small></div>
                  <div className="ps-community-studio-plate-options">{PLATES.map((plate) => <button type="button" key={plate.id}
                    className={"ps-community-studio-plate-option is-plate-" + plate.id + (plateStyle === plate.id ? " is-selected" : "")}
                    onClick={() => { setPlateStyle(plate.id); setNotice("Vista previa de la placa actualizada. Guarda para aplicarla."); setError(""); }}
                    aria-pressed={plateStyle === plate.id}>
                    <span className="ps-community-studio-plate-sample">{displayName || "Tu nombre"}</span>
                    <strong>{plate.label}</strong><small>{plate.description}</small>{plateStyle === plate.id && <Check size={15}/>}
                  </button>)}</div>
                  <button type="button" className="ps-community-studio-save" onClick={() => void saveProfile()} disabled={busy || Boolean(uploading) || displayName.trim().length < 2}>{busy ? "Guardando…" : <><Save size={16}/> Guardar placa</>}</button>
                </div>}
              </section>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
