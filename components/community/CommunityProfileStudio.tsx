"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft, BadgeCheck, Camera, Check, ChevronRight, Eye,
  Frame, ImagePlus, LoaderCircle, Monitor, Palette, Save, ShieldCheck,
  Smartphone, Trash2, UserRound,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type AvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type AccentColor = "blue" | "violet" | "pink" | "coral" | "gold" | "mint";
type EditorSection = "profile" | "banner" | "avatar" | "frames" | "plate" | "accent";

type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  plateStyle?: PlateStyle;
  accentColor?: string;
  avatarFrame?: AvatarFrame;
  memberNumber?: number | null;
  pronouns?: string;
  statusText: string;
  about: string;
  joinedAt: string;
  roles: { roleKey: string; label: string; badgeColor: string }[];
  isOwnProfile: boolean;
  appearanceReady?: boolean;
};

type Props = {
  userId: string;
  initialProfile: CommunityIdentity;
  onClose: () => void;
  onSaved: () => void;
};

const NAV: {
  id: EditorSection;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  { id: "profile", label: "Perfil", description: "Nombre y biografía", icon: UserRound },
  { id: "banner", label: "Banner", description: "Portada de tu perfil", icon: ImagePlus },
  { id: "avatar", label: "Avatar", description: "Tu imagen de perfil", icon: Camera },
  { id: "frames", label: "Marcos", description: "Bordes para tu avatar", icon: Frame },
  { id: "plate", label: "Placa de miembro", description: "Cómo aparece tu nombre", icon: BadgeCheck },
  { id: "accent", label: "Color de acento", description: "Tu tono de identidad", icon: Palette },
];

const ACCENTS: { id: AccentColor; name: string; value: string }[] = [
  { id: "blue", name: "Azul eléctrico", value: "#3987FF" },
  { id: "violet", name: "Violeta", value: "#9A72F5" },
  { id: "pink", name: "Rosa", value: "#E75DA6" },
  { id: "coral", name: "Coral", value: "#F16E65" },
  { id: "gold", name: "Dorado", value: "#E5B64C" },
  { id: "mint", name: "Menta", value: "#52C7A4" },
];

const FRAMES: { id: AvatarFrame; label: string; description: string }[] = [
  { id: "none", label: "Ninguno", description: "Avatar limpio" },
  { id: "solar", label: "Solar", description: "Borde cálido" },
  { id: "violet", label: "Prisma", description: "Violeta sutil" },
  { id: "cyan", label: "Pulse", description: "Azul frío" },
  { id: "ember", label: "Ember", description: "Rojo intenso" },
];

const PLATES: { id: PlateStyle; label: string; description: string }[] = [
  { id: "classic", label: "Clásica", description: "Limpia y discreta" },
  { id: "grid", label: "Pixel Grid", description: "Retícula GameCode" },
  { id: "arcade", label: "Arcade", description: "Acento verde lima" },
  { id: "signal", label: "Signal", description: "Línea técnica" },
];

const DEFAULT_ACCENT = "#3987FF";
const DEFAULT_FRAME: AvatarFrame = "none";
const DEFAULT_CARD = "#20242D";

function safeColor(value?: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_CARD;
}
function safeAccent(value?: string) {
  return ACCENTS.some((item) => item.value.toLowerCase() === value?.toLowerCase())
    ? ACCENTS.find((item) => item.value.toLowerCase() === value?.toLowerCase())!.value
    : DEFAULT_ACCENT;
}
function safeFrame(value?: string): AvatarFrame {
  return FRAMES.some((item) => item.id === value) ? value as AvatarFrame : DEFAULT_FRAME;
}
function safePlate(value?: string): PlateStyle {
  return value === "grid" || value === "arcade" || value === "signal" ? value : "classic";
}
function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "P").slice(0, 2)).toUpperCase();
}
function memberTag(value?: number | null) {
  return Number.isFinite(value) && Number(value) > 0 ? "#" + String(value).padStart(4, "0") : "ID pendiente";
}

export default function CommunityProfileStudio({ userId, initialProfile, onClose, onSaved }: Props) {
  const [portalReady, setPortalReady] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [savedSnapshot, setSavedSnapshot] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
  const [pronouns, setPronouns] = useState(initialProfile.pronouns ?? "");
  const [status, setStatus] = useState(initialProfile.statusText ?? "");
  const [about, setAbout] = useState(initialProfile.about ?? "");
  const [cardColor, setCardColor] = useState(safeColor(initialProfile.cardColor));
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [accentColor, setAccentColor] = useState(safeAccent(initialProfile.accentColor));
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [activeSection, setActiveSection] = useState<EditorSection>("profile");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [appearancePicker, setAppearancePicker] = useState<"frame" | "plate" | null>(null);
  const [draftFrame, setDraftFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [draftPlate, setDraftPlate] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [deleting, setDeleting] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Partial<Record<EditorSection, HTMLElement | null>>>({});

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Wait for hydration before mounting the full-screen studio into document.body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalReady(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && appearancePicker) {
        setAppearancePicker(null);
        return;
      }
      if (event.key === "Escape" && !busy && !uploading && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, busy, uploading, deleting, appearancePicker]);

  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const selectedAccent = ACCENTS.find((item) => item.value.toLowerCase() === accentColor.toLowerCase()) ?? ACCENTS[0];
  const canSave = profile.isOwnProfile && displayName.trim().length >= 2 && !busy && !uploading && !deleting;
  const previewStyle = {
    "--editor-accent": accentColor,
    "--editor-card": safeColor(cardColor),
  } as CSSProperties;

  function openAppearancePicker(kind: "frame" | "plate", selected?: AvatarFrame | PlateStyle) {
    if (kind === "frame") {
      const nextFrame = FRAMES.some((frame) => frame.id === selected) ? selected as AvatarFrame : avatarFrame;
      setDraftFrame(nextFrame);
    } else {
      const nextPlate = PLATES.some((plate) => plate.id === selected) ? selected as PlateStyle : plateStyle;
      setDraftPlate(nextPlate);
    }
    setAppearancePicker(kind);
    setError("");
    setNotice("");
  }

  function applyAppearancePicker() {
    if (appearancePicker === "frame") setAvatarFrame(draftFrame);
    if (appearancePicker === "plate") setPlateStyle(draftPlate);
    setAppearancePicker(null);
  }

  function scrollToSection(section: EditorSection) {
    setActiveSection(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function discardChanges() {
    setDisplayName(savedSnapshot.displayName ?? "");
    setPronouns(savedSnapshot.pronouns ?? "");
    setStatus(savedSnapshot.statusText ?? "");
    setAbout(savedSnapshot.about ?? "");
    setCardColor(safeColor(savedSnapshot.cardColor));
    setPlateStyle(safePlate(savedSnapshot.plateStyle));
    setAccentColor(safeAccent(savedSnapshot.accentColor));
    setAvatarFrame(safeFrame(savedSnapshot.avatarFrame));
    setProfile(savedSnapshot);
    setError("");
    setNotice("Cambios locales descartados.");
  }

  async function saveProfile() {
    if (!canSave) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/community/profile/" + userId, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          pronouns: pronouns.trim(),
          statusText: status.trim(),
          about: about.trim(),
          cardColor,
          plateStyle,
          accentColor,
          avatarFrame,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        error?: string;
        appearanceSaved?: boolean;
        profile?: Partial<CommunityIdentity>;
      } | null;

      if (!response.ok || !payload?.profile) {
        throw new Error(payload?.error ?? "No se pudieron guardar los cambios.");
      }

      const updated: CommunityIdentity = {
        ...profile,
        ...payload.profile,
        displayName: payload.profile.displayName ?? displayName.trim(),
        pronouns: payload.profile.pronouns ?? pronouns.trim(),
        statusText: payload.profile.statusText ?? status.trim(),
        about: payload.profile.about ?? about.trim(),
        cardColor: payload.appearanceSaved === false ? cardColor : payload.profile.cardColor ?? cardColor,
        plateStyle: payload.appearanceSaved === false ? plateStyle : safePlate(payload.profile.plateStyle ?? plateStyle),
        accentColor: payload.appearanceSaved === false ? accentColor : safeAccent(payload.profile.accentColor ?? accentColor),
        avatarFrame: payload.appearanceSaved === false ? avatarFrame : safeFrame(payload.profile.avatarFrame ?? avatarFrame),
      };
      setProfile(updated);
      setSavedSnapshot(updated);
      setCardColor(updated.cardColor ?? cardColor);
      setPlateStyle(safePlate(updated.plateStyle));
      setAccentColor(safeAccent(updated.accentColor));
      setAvatarFrame(safeFrame(updated.avatarFrame));

      if (payload.appearanceSaved === false) {
        setNotice("El perfil básico se guardó. Los controles visuales quedarán persistidos al aplicar la migración de esta rama.");
      } else {
        setNotice("Perfil actualizado correctamente.");
        onSaved();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAsset(kind: "avatar" | "banner", file: File | null) {
    if (!file || !profile.isOwnProfile || busy || deleting) return;
    const maxBytes = kind === "avatar" ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size <= 0 || file.size > maxBytes) {
      setError(kind === "avatar"
        ? "Selecciona una imagen PNG, JPG o WebP de máximo 5 MB."
        : "Selecciona una imagen PNG, JPG o WebP de máximo 8 MB.");
      const input = kind === "avatar" ? avatarInput.current : bannerInput.current;
      if (input) input.value = "";
      return;
    }

    setUploading(kind);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const response = await fetch("/api/community/profile/" + userId, {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json().catch(() => null) as {
        error?: string;
        avatarUrl?: string;
        bannerUrl?: string;
      } | null;
      const nextUrl = kind === "avatar" ? payload?.avatarUrl : payload?.bannerUrl;
      if (!response.ok || !nextUrl) throw new Error(payload?.error ?? "No se pudo actualizar la imagen.");

      setProfile((current) => ({
        ...current,
        ...(kind === "avatar" ? { avatarUrl: nextUrl } : { bannerUrl: nextUrl }),
      }));
      setSavedSnapshot((current) => ({
        ...current,
        ...(kind === "avatar" ? { avatarUrl: nextUrl } : { bannerUrl: nextUrl }),
      }));
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

  async function removeAsset(kind: "avatar" | "banner") {
    if (!profile.isOwnProfile || busy || uploading || deleting) return;
    setDeleting(kind);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/community/profile/" + userId, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "No se pudo retirar la imagen.");
      setProfile((current) => ({
        ...current,
        ...(kind === "avatar" ? { avatarUrl: null } : { bannerUrl: null }),
      }));
      setSavedSnapshot((current) => ({
        ...current,
        ...(kind === "avatar" ? { avatarUrl: null } : { bannerUrl: null }),
      }));
      setNotice(kind === "avatar" ? "Avatar retirado." : "Banner retirado.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo retirar la imagen.");
    } finally {
      setDeleting(null);
    }
  }

  if (!portalReady) return null;

  return createPortal(
    <div className="ps-community-editor-v2" style={previewStyle}>
      <section className="ps-community-editor-rail" aria-label="Navegación de edición">
        <button type="button" className="ps-community-editor-rail-logo" onClick={onClose} aria-label="Volver a la comunidad">
          PS
        </button>
        <div className="ps-community-editor-rail-divider"/>
        <div className="ps-community-editor-rail-status"><span/></div>
        <button type="button" className="ps-community-editor-rail-back" onClick={onClose} aria-label="Volver a la comunidad">
          <ArrowLeft size={17}/>
        </button>
      </section>

      <aside className="ps-community-editor-sidebar">
        <div className="ps-community-editor-sidebar-top">
          <span>COMMUNITY / IDENTITY</span>
          <strong>Personalización</strong>
        </div>
        <div className="ps-community-editor-account">
          <div className={"ps-community-editor-account-avatar frame-" + avatarFrame}>
            {profile.avatarUrl
              ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="48px"/>
              : <span>{initials(displayName || "PeakScore")}</span>}
          </div>
          <div className="ps-community-editor-account-copy">
            <strong>{displayName || "Miembro"}</strong>
            <small>Perfil de comunidad</small>
          </div>
        </div>

        <nav className="ps-community-editor-nav" aria-label="Ajustes del perfil">
          <span className="ps-community-editor-nav-label">IDENTIDAD</span>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={"ps-community-editor-nav-item" + (activeSection === item.id ? " is-active" : "")}
                onClick={() => scrollToSection(item.id)}
                aria-current={activeSection === item.id ? "page" : undefined}
              >
                <span className="ps-community-editor-nav-icon"><Icon size={17}/></span>
                <span className="ps-community-editor-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <ChevronRight size={15} className="ps-community-editor-nav-chevron"/>
              </button>
            );
          })}
        </nav>

        <div className="ps-community-editor-sidebar-foot">
          <ShieldCheck size={14}/>
          <span>Tu identidad social es independiente de tu progreso académico y de PeakStyle.</span>
        </div>
      </aside>

      <main className="ps-community-editor-main">
        <header className="ps-community-editor-header">
          <div>
            <div className="ps-community-editor-eyebrow">PEAKSCORE / COMMUNITY IDENTITY</div>
            <h1>Editar perfil</h1>
            <p>Personaliza cómo te ve la comunidad.</p>
          </div>
          <div className="ps-community-editor-header-actions">
            <button type="button" className="ps-community-editor-button is-quiet" onClick={discardChanges} disabled={busy || Boolean(uploading) || Boolean(deleting)}>
              Descartar
            </button>
            <button type="button" className="ps-community-editor-button is-primary" onClick={() => void saveProfile()} disabled={!canSave}>
              {busy ? <LoaderCircle size={16} className="ps-community-editor-spin"/> : <Save size={16}/>}
              {busy ? "Guardando" : "Guardar cambios"}
            </button>
          </div>
        </header>

        {(error || notice || !profile.appearanceReady) && (
          <div className="ps-community-editor-feedback-stack">
            {error && <div className="ps-community-editor-feedback is-error" role="alert">{error}</div>}
            {notice && <div className="ps-community-editor-feedback is-success" role="status">{notice}</div>}
            {!profile.appearanceReady && (
              <div className="ps-community-editor-feedback is-pending" role="status">
                El editor ya está preparado. La persistencia completa de marcos, color y placas requiere aplicar la migración de apariencia comunitaria de esta rama en Supabase.
              </div>
            )}
          </div>
        )}

        <div className="ps-community-editor-workspace">
          <div className="ps-community-editor-controls">
            <section className="ps-community-editor-panel ps-community-editor-banner-panel" ref={(node) => { sectionRefs.current.banner = node; }}>
              <div className="ps-community-editor-panel-heading">
                <div><span>01 / PORTADA</span><h2>Banner</h2><p>Una imagen panorámica que representa tu espacio.</p></div>
                <span className="ps-community-editor-panel-meta">1920 × 540 recomendado · 8 MB máx.</span>
              </div>
              <div className="ps-community-editor-banner-stage">
                {profile.bannerUrl
                  ? <Image src={profile.bannerUrl} alt="Banner actual de tu perfil" fill unoptimized sizes="(max-width: 1100px) 100vw, 760px"/>
                  : <div className="ps-community-editor-banner-fallback"><div/><span>PEAK<span>SCORE</span></span><small>COMMUNITY MEMBER</small></div>}
                <div className="ps-community-editor-banner-overlay"/>
                <div className="ps-community-editor-banner-actions">
                  <button type="button" onClick={() => bannerInput.current?.click()} disabled={Boolean(uploading) || busy}>
                    {uploading === "banner" ? <LoaderCircle size={15} className="ps-community-editor-spin"/> : <ImagePlus size={15}/>}
                    {uploading === "banner" ? "Subiendo…" : profile.bannerUrl ? "Cambiar banner" : "Subir banner"}
                  </button>
                  {profile.bannerUrl && (
                    <button type="button" className="is-danger" onClick={() => void removeAsset("banner")} disabled={Boolean(deleting) || busy}>
                      {deleting === "banner" ? <LoaderCircle size={15} className="ps-community-editor-spin"/> : <Trash2 size={15}/>}
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
              <input ref={bannerInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAsset("banner", event.target.files?.[0] ?? null)}/>
            </section>

            <div className="ps-community-editor-split">
              <section className="ps-community-editor-panel ps-community-editor-avatar-panel" ref={(node) => { sectionRefs.current.avatar = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>02 / IMAGEN</span><h2>Avatar</h2><p>Tu imagen de perfil.</p></div>
                </div>
                <div className="ps-community-editor-avatar-upload">
                  <div className={"ps-community-editor-avatar-large frame-" + avatarFrame} style={{ "--editor-accent": accentColor } as CSSProperties}>
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="Avatar actual" fill unoptimized sizes="90px"/>
                      : <span>{initials(displayName || "PeakScore")}</span>}
                    <span className="ps-community-editor-avatar-online"/>
                  </div>
                  <div className="ps-community-editor-upload-details">
                    <strong>{displayName || "Miembro"}</strong>
                    <small>PNG, JPG o WebP · Máx. 5 MB</small>
                    <div className="ps-community-editor-inline-actions">
                      <button type="button" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading) || busy}>
                        <Camera size={14}/>{uploading === "avatar" ? "Subiendo…" : "Cambiar"}
                      </button>
                      {profile.avatarUrl && <button type="button" className="is-muted" onClick={() => void removeAsset("avatar")} disabled={Boolean(deleting) || busy}><Trash2 size={13}/>Retirar</button>}
                    </div>
                  </div>
                </div>
                <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadAsset("avatar", event.target.files?.[0] ?? null)}/>
              </section>

              <section className="ps-community-editor-panel ps-community-editor-frames-panel" ref={(node) => { sectionRefs.current.frames = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>03 / DETALLE</span><h2>Marcos</h2><p>Un borde sutil para destacar tu avatar.</p></div>
                </div>
                <div className="ps-community-editor-choice-row">
                  <span className={"ps-community-editor-choice-frame frame-" + avatarFrame}><Frame size={19}/></span>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{FRAMES.find((frame) => frame.id === avatarFrame)?.label}</strong>
                    <small>{FRAMES.find((frame) => frame.id === avatarFrame)?.description}</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("frame")}>
                    Cambiar <ChevronRight size={14}/>
                  </button>
                </div>
              </section>
            </div>

            <div className="ps-community-editor-split">
              <section className="ps-community-editor-panel" ref={(node) => { sectionRefs.current.plate = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>04 / NOMBRE</span><h2>Placa de miembro</h2><p>Cómo se muestra tu nombre en la comunidad.</p></div>
                </div>
                <div className="ps-community-editor-choice-row">
                  <span className={"ps-community-editor-plate-current is-plate-" + plateStyle}>{displayName || "Tu nombre"}</span>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{PLATES.find((plate) => plate.id === plateStyle)?.label}</strong>
                    <small>{PLATES.find((plate) => plate.id === plateStyle)?.description}</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("plate")}>
                    Cambiar <ChevronRight size={14}/>
                  </button>
                </div>
              </section>

              <section className="ps-community-editor-panel" ref={(node) => { sectionRefs.current.accent = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>05 / COLOR</span><h2>Color de acento</h2><p>El detalle de color de tu identidad.</p></div>
                </div>
                <div className="ps-community-editor-accent-options">
                  {ACCENTS.map((accent) => (
                    <button key={accent.id} type="button"
                      className={accentColor === accent.value ? "is-selected" : ""}
                      style={{ "--swatch": accent.value } as CSSProperties}
                      onClick={() => setAccentColor(accent.value)}
                      aria-label={accent.name}
                      aria-pressed={accentColor === accent.value}
                      title={accent.name}>
                      {accentColor === accent.value && <Check size={15}/>}
                    </button>
                  ))}
                </div>
                <div className="ps-community-editor-accent-caption"><span>{selectedAccent.name}</span><code>{accentColor.toUpperCase()}</code></div>
              </section>
            </div>

            <section className="ps-community-editor-panel ps-community-editor-profile-fields" ref={(node) => { sectionRefs.current.profile = node; }}>
              <div className="ps-community-editor-panel-heading compact">
                <div><span>06 / INFORMACIÓN</span><h2>Tu identidad</h2><p>Datos públicos de tu perfil comunitario.</p></div>
              </div>
              <div className="ps-community-editor-fields-grid">
                <label className="ps-community-editor-field">
                  <span>Nombre público</span>
                  <div className="ps-community-editor-input-wrap">
                    <input value={displayName} maxLength={32} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tu nombre" autoComplete="nickname"/>
                    <small>{displayName.length}/32</small>
                  </div>
                </label>
                <label className="ps-community-editor-field">
                  <span>Identificador</span>
                  <div className="ps-community-editor-input-wrap is-readonly">
                    <input value={memberTag(profile.memberNumber)} readOnly aria-label="Identificador público de miembro"/>
                    <span className="ps-community-editor-id-mark">ID</span>
                  </div>
                </label>
                <label className="ps-community-editor-field">
                  <span>Pronombres <small>Opcional</small></span>
                  <input value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Opcional"/>
                </label>
                <label className="ps-community-editor-field">
                  <span>Estado personalizado</span>
                  <input value={status} maxLength={80} onChange={(event) => setStatus(event.target.value)} placeholder="¿Qué estás haciendo?"/>
                  <small className="ps-community-editor-counter">{status.length}/80</small>
                </label>
                <label className="ps-community-editor-field is-full">
                  <span>Sobre mí</span>
                  <div className="ps-community-editor-input-wrap is-textarea">
                    <textarea value={about} maxLength={280} rows={4} onChange={(event) => setAbout(event.target.value)} placeholder="Cuéntale algo a la comunidad…"/>
                    <small>{about.length}/280</small>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="ps-community-editor-preview-column">
            <div className="ps-community-editor-preview-heading">
              <div><span>PREVIEW / LIVE</span><h2>Vista previa</h2></div>
              <div className="ps-community-editor-preview-mode">
                <button type="button" className={previewMode === "desktop" ? "is-active" : ""} onClick={() => setPreviewMode("desktop")} aria-label="Vista de escritorio"><Monitor size={15}/></button>
                <button type="button" className={previewMode === "mobile" ? "is-active" : ""} onClick={() => setPreviewMode("mobile")} aria-label="Vista móvil"><Smartphone size={15}/></button>
              </div>
            </div>

            <div className={"ps-community-editor-preview-frame" + (previewMode === "mobile" ? " is-mobile" : "")}>
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle} style={{ "--editor-accent": accentColor, "--editor-card": cardColor } as CSSProperties}>
                <div className="ps-community-editor-preview-banner">
                  {profile.bannerUrl
                    ? <Image src={profile.bannerUrl} alt="" fill unoptimized sizes="(max-width: 900px) 100vw, 360px"/>
                    : <div className="ps-community-editor-preview-banner-empty"><span>PEAK<span>SCORE</span></span><small>COMMUNITY MEMBER</small></div>}
                  <div className="ps-community-editor-preview-banner-shade"/>
                </div>
                <div className="ps-community-editor-preview-body">
                  <div className="ps-community-editor-preview-avatar-row">
                    <div className={"ps-community-editor-preview-avatar frame-" + avatarFrame}>
                      {profile.avatarUrl
                        ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="96px"/>
                        : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <div className="ps-community-editor-preview-member-state">VISTA PREVIA</div>
                  </div>
                  <h3 className={"ps-community-editor-preview-name is-plate-" + plateStyle}>{displayName || "Tu nombre"}</h3>
                  <div className="ps-community-editor-preview-tag">{memberTag(profile.memberNumber)}</div>
                  <div className="ps-community-editor-preview-role-row">
                    {profile.roles.slice(0, 3).map((role) => (
                      <span key={role.roleKey} style={{
                        "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : accentColor,
                      } as CSSProperties}>{role.label}</span>
                    ))}
                  </div>
                  {status && <div className="ps-community-editor-preview-status">{status}</div>}
                  <div className="ps-community-editor-preview-divider"/>
                  <section className="ps-community-editor-preview-about">
                    <span>SOBRE MÍ</span>
                    <p>{about || "Tu historia en PeakScore comienza aquí."}</p>
                  </section>
                  <section className="ps-community-editor-preview-meta">
                    <span>MIEMBRO DESDE</span>
                    <strong>{joinedLabel}</strong>
                  </section>

                </div>
              </article>
            </div>

            <div className="ps-community-editor-preview-note"><Eye size={14}/> La vista previa refleja tus cambios antes de guardarlos.</div>
          </aside>
        </div>
      </main>

      {appearancePicker && (
        <div className="ps-community-picker-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAppearancePicker(null);
        }}>
          <section className="ps-community-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-picker-title">
            <header className="ps-community-picker-header">
              <div>
                <span>PEAKSCORE / IDENTIDAD</span>
                <h2 id="ps-community-picker-title">{appearancePicker === "frame" ? "Cambiar marco de avatar" : "Cambiar placa de miembro"}</h2>
                <p>{appearancePicker === "frame" ? "Elige el acabado que acompaña tu avatar en la comunidad." : "Elige cómo se presenta tu nombre en mensajes y perfiles."}</p>
              </div>
              <button type="button" onClick={() => setAppearancePicker(null)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>

            <div className="ps-community-picker-layout">
              <div className="ps-community-picker-collection">
                <div className="ps-community-picker-collection-heading">
                  <strong>{appearancePicker === "frame" ? "Tus marcos" : "Tus placas"}</strong>
                  <span>{appearancePicker === "frame" ? FRAMES.length : PLATES.length} diseños</span>
                </div>

                {appearancePicker === "frame" ? (
                  <div className="ps-community-picker-items is-frames">
                    {FRAMES.map((frame) => (
                      <button
                        key={frame.id}
                        type="button"
                        className={"ps-community-picker-item" + (draftFrame === frame.id ? " is-selected" : "")}
                        onClick={() => setDraftFrame(frame.id)}
                        aria-pressed={draftFrame === frame.id}
                      >
                        <span className={"ps-community-picker-avatar frame-" + frame.id}>
                          {profile.avatarUrl
                            ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="58px"/>
                            : initials(displayName || "PeakScore")}
                        </span>
                        <strong>{frame.label}</strong>
                        <small>{frame.description}</small>
                        {draftFrame === frame.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ps-community-picker-items is-plates">
                    {PLATES.map((plate) => (
                      <button
                        key={plate.id}
                        type="button"
                        className={"ps-community-picker-item is-plate-item" + (draftPlate === plate.id ? " is-selected" : "")}
                        onClick={() => setDraftPlate(plate.id)}
                        aria-pressed={draftPlate === plate.id}
                      >
                        <span className={"ps-community-picker-name-sample is-plate-" + plate.id}>{displayName || "Tu nombre"}</span>
                        <strong>{plate.label}</strong>
                        <small>{plate.description}</small>
                        {draftPlate === plate.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="ps-community-picker-preview">
                <span className="ps-community-picker-preview-eyebrow">VISTA PREVIA</span>
                {appearancePicker === "frame" ? (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large frame-" + draftFrame}>
                      {profile.avatarUrl
                        ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/>
                        : <span>{initials(displayName || "PeakScore")}</span>}
                      <i/>
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong>
                    <small>{memberTag(profile.memberNumber)}</small>
                  </div>
                ) : (
                  <div className="ps-community-picker-plate-stage">
                    <div className="ps-community-picker-plate-cover"/>
                    <div className={"ps-community-picker-plate-name is-plate-" + draftPlate}>{displayName || "Tu nombre"}</div>
                    <span>IDENTIDAD DE COMUNIDAD</span>
                  </div>
                )}

                <div className="ps-community-picker-selection">
                  <span>SELECCIÓN ACTUAL</span>
                  <strong>{appearancePicker === "frame"
                    ? FRAMES.find((frame) => frame.id === draftFrame)?.label
                    : PLATES.find((plate) => plate.id === draftPlate)?.label}</strong>
                  <p>{appearancePicker === "frame"
                    ? FRAMES.find((frame) => frame.id === draftFrame)?.description
                    : PLATES.find((plate) => plate.id === draftPlate)?.description}</p>
                </div>
              </aside>
            </div>

            <footer className="ps-community-picker-footer">
              <button type="button" className="is-quiet" onClick={() => setAppearancePicker(null)}>Cancelar</button>
              <button type="button" className="is-primary" onClick={applyAppearancePicker}>Aplicar</button>
            </footer>
          </section>
        </div>
      )}
    </div>,
    document.body,
  );
}
