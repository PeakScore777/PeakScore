"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft, BadgeCheck, Camera, Check, ChevronRight, Copy, Eye, Sparkles, MessageCircle,
  Frame, ImagePlus, LoaderCircle, Monitor, Palette, Save, ShieldCheck,
  Smartphone, Trash2, UserRound, X,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type AvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type AccentColor = "blue" | "violet" | "pink" | "coral" | "gold" | "mint";
type EditorSection = "profile" | "banner" | "avatar" | "frames" | "effects" | "plate" | "accent";
type PickerKind = "avatarDecoration" | "profileFrame" | "profileEffect" | "plate";
type AvatarDecorationId = "none" | "orbit" | "bloom" | "electric" | "glitch";
type ProfileFrameId = "none" | "obsidian" | "lunar" | "crimson" | "aurora";
type ProfileEffectId = "none" | "aurora" | "embers" | "starlight" | "scanline";
type StatusDuration = "30m" | "1h" | "4h" | "today" | "never";

type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  plateStyle?: PlateStyle;
  accentColor?: string;
  avatarFrame?: AvatarFrame;
  avatarDecorationId?: AvatarDecorationId;
  profileFrameId?: ProfileFrameId;
  profileEffectId?: ProfileEffectId;
  statusExpiresAt?: string | null;
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
  { id: "frames", label: "Marco de perfil", description: "Borde de tu tarjeta", icon: Frame },
  { id: "effects", label: "Efectos de perfil", description: "Animaciones de tu tarjeta", icon: Sparkles },
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

const AVATAR_DECORATIONS: { id: AvatarDecorationId; label: string; description: string }[] = [
  { id: "none", label: "Ninguna", description: "Avatar sin decoración" },
  { id: "orbit", label: "Órbita", description: "Anillos orbitales animados" },
  { id: "bloom", label: "Bloom", description: "Destellos suaves alrededor del avatar" },
  { id: "electric", label: "Electric", description: "Trazos eléctricos animados" },
  { id: "glitch", label: "Glitch", description: "Desplazamiento digital sutil" },
];
const PROFILE_FRAMES: { id: ProfileFrameId; label: string; description: string }[] = [
  { id: "none", label: "Ninguno", description: "Tarjeta limpia" },
  { id: "obsidian", label: "Obsidiana", description: "Contorno oscuro de precisión" },
  { id: "lunar", label: "Lunar", description: "Marco plateado" },
  { id: "crimson", label: "Crimson", description: "Acento rojo profundo" },
  { id: "aurora", label: "Aurora", description: "Borde iridiscente" },
];
const PROFILE_EFFECTS: { id: ProfileEffectId; label: string; description: string }[] = [
  { id: "none", label: "Ninguno", description: "Sin animación de fondo" },
  { id: "aurora", label: "Aurora", description: "Luz en movimiento" },
  { id: "embers", label: "Brasas", description: "Partículas cálidas flotantes" },
  { id: "starlight", label: "Starlight", description: "Destellos estelares" },
  { id: "scanline", label: "Scanline", description: "Barrido digital" },
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
function hexToHsv(hex: string) {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex(h: number, s: number, v: number) {
  const chroma = v * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const rgb = section < 1 ? [chroma, x, 0]
    : section < 2 ? [x, chroma, 0]
    : section < 3 ? [0, chroma, x]
    : section < 4 ? [0, x, chroma]
    : section < 5 ? [x, 0, chroma] : [chroma, 0, x];
  const m = v - chroma;
  return "#" + rgb.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
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
  const [cardHue, setCardHue] = useState(hexToHsv(safeColor(initialProfile.cardColor)).h);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [recentCardColors, setRecentCardColors] = useState<string[]>(["#1E1F22", "#111214", "#2B2D31", "#5865F2", "#3B82F6"]);
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [accentColor, setAccentColor] = useState(safeAccent(initialProfile.accentColor));
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [avatarDecorationId, setAvatarDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [profileFrameId, setProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [profileEffectId, setProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [statusExpiresAt, setStatusExpiresAt] = useState<string | null>(initialProfile.statusExpiresAt ?? null);
  const [statusDuration, setStatusDuration] = useState<StatusDuration>("never");
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(initialProfile.statusText ?? "");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropUrl, setAvatarCropUrl] = useState<string | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropX, setAvatarCropX] = useState(50);
  const [avatarCropY, setAvatarCropY] = useState(50);
  const [activeSection, setActiveSection] = useState<EditorSection>("profile");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [appearancePicker, setAppearancePicker] = useState<PickerKind | null>(null);
  const [draftDecorationId, setDraftDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [draftProfileFrameId, setDraftProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [draftProfileEffectId, setDraftProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
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
    return () => {
      if (avatarCropUrl) URL.revokeObjectURL(avatarCropUrl);
    };
  }, [avatarCropUrl]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Wait for hydration before mounting the full-screen studio into document.body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPortalReady(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && statusEditorOpen) {
        setStatusEditorOpen(false);
        return;
      }
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
  }, [onClose, busy, uploading, deleting, appearancePicker, statusEditorOpen]);

  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const selectedAccent = ACCENTS.find((item) => item.value.toLowerCase() === accentColor.toLowerCase()) ?? ACCENTS[0];
  const canSave = profile.isOwnProfile && displayName.trim().length >= 2 && !busy && !uploading && !deleting;
  const hasUnsavedChanges = displayName !== (savedSnapshot.displayName ?? "")
    || pronouns !== (savedSnapshot.pronouns ?? "")
    || status !== (savedSnapshot.statusText ?? "")
    || about !== (savedSnapshot.about ?? "")
    || cardColor !== safeColor(savedSnapshot.cardColor)
    || plateStyle !== safePlate(savedSnapshot.plateStyle)
    || accentColor !== safeAccent(savedSnapshot.accentColor)
    || avatarFrame !== safeFrame(savedSnapshot.avatarFrame)
    || avatarDecorationId !== (savedSnapshot.avatarDecorationId ?? "none")
    || profileFrameId !== (savedSnapshot.profileFrameId ?? "none")
    || profileEffectId !== (savedSnapshot.profileEffectId ?? "none")
    || statusExpiresAt !== (savedSnapshot.statusExpiresAt ?? null);
  const previewStyle = {
    "--editor-accent": accentColor,
    "--editor-card": safeColor(cardColor),
  } as CSSProperties;

  function updateCardColor(nextColor: string) {
    if (!/^#[0-9a-f]{6}$/i.test(nextColor)) return;
    const normalized = nextColor.toUpperCase();
    setCardColor(normalized);
    setCardHue(hexToHsv(normalized).h);
    setRecentCardColors((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 6));
  }

  function updateCardColorFromPlane(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const value = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    updateCardColor(hsvToHex(cardHue, saturation, value));
  }

  function updateCardHue(nextHue: number) {
    const hsv = hexToHsv(cardColor);
    setCardHue(nextHue);
    updateCardColor(hsvToHex(nextHue, hsv.s, hsv.v));
  }

  function openAppearancePicker(kind: PickerKind) {
    setDraftDecorationId(avatarDecorationId);
    setDraftProfileFrameId(profileFrameId);
    setDraftProfileEffectId(profileEffectId);
    setDraftPlate(plateStyle);
    setAppearancePicker(kind);
    setAvatarMenuOpen(false);
    setError("");
    setNotice("");
  }

  function applyAppearancePicker() {
    if (appearancePicker === "avatarDecoration") setAvatarDecorationId(draftDecorationId);
    if (appearancePicker === "profileFrame") setProfileFrameId(draftProfileFrameId);
    if (appearancePicker === "profileEffect") setProfileEffectId(draftProfileEffectId);
    if (appearancePicker === "plate") setPlateStyle(draftPlate);
    setAppearancePicker(null);
  }

  function handleAvatarFileSelection(file: File | null) {
    if (!file) return;
    if (file.type === "image/gif") {
      void uploadAsset("avatar", file);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Selecciona PNG, JPG, WebP o GIF.");
      return;
    }
    setAvatarCropFile(file);
    setAvatarCropZoom(1);
    setAvatarCropX(50);
    setAvatarCropY(50);
    setAvatarCropUrl(URL.createObjectURL(file));
  }

  function closeAvatarCrop() {
    setAvatarCropFile(null);
    setAvatarCropUrl(null);
    setAvatarCropZoom(1);
    setAvatarCropX(50);
    setAvatarCropY(50);
  }

  function confirmAvatarCrop() {
    if (!avatarCropUrl || !avatarCropFile) return;
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) {
        setError("No se pudo preparar el recorte del avatar.");
        return;
      }
      const scale = Math.max(512 / image.naturalWidth, 512 / image.naturalHeight) * avatarCropZoom;
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      const left = -(drawnWidth - 512) * (avatarCropX / 100);
      const top = -(drawnHeight - 512) * (avatarCropY / 100);
      context.drawImage(image, left, top, drawnWidth, drawnHeight);
      canvas.toBlob((blob) => {
        if (!blob) {
          setError("No se pudo preparar el recorte del avatar.");
          return;
        }
        const cropped = new File([blob], "peakscore-avatar.png", { type: "image/png", lastModified: Date.now() });
        closeAvatarCrop();
        void uploadAsset("avatar", cropped);
      }, "image/png");
    };
    image.onerror = () => setError("No se pudo abrir la imagen para recortarla.");
    image.src = avatarCropUrl;
  }

  function applyStatusDraft() {
    setStatus(statusDraft.trim());
    const now = new Date();
    if (statusDuration === "30m") now.setMinutes(now.getMinutes() + 30);
    else if (statusDuration === "1h") now.setHours(now.getHours() + 1);
    else if (statusDuration === "4h") now.setHours(now.getHours() + 4);
    else if (statusDuration === "today") now.setHours(23, 59, 59, 999);
    setStatusExpiresAt(statusDuration === "never" || !statusDraft.trim() ? null : now.toISOString());
    setStatusEditorOpen(false);
  }

  function scrollToSection(section: EditorSection) {
    setActiveSection(section);
    sectionRefs.current[section]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function discardChanges() {
    setDisplayName(savedSnapshot.displayName ?? "");
    setPronouns(savedSnapshot.pronouns ?? "");
    setStatus(savedSnapshot.statusText ?? "");
    setStatusDraft(savedSnapshot.statusText ?? "");
    setStatusExpiresAt(savedSnapshot.statusExpiresAt ?? null);
    setStatusDraft(savedSnapshot.statusText ?? "");
    setStatusExpiresAt(savedSnapshot.statusExpiresAt ?? null);
    setAbout(savedSnapshot.about ?? "");
    updateCardColor(safeColor(savedSnapshot.cardColor));
    setPlateStyle(safePlate(savedSnapshot.plateStyle));
    setAccentColor(safeAccent(savedSnapshot.accentColor));
    setAvatarFrame(safeFrame(savedSnapshot.avatarFrame));
    setAvatarDecorationId(savedSnapshot.avatarDecorationId ?? "none");
    setProfileFrameId(savedSnapshot.profileFrameId ?? "none");
    setProfileEffectId(savedSnapshot.profileEffectId ?? "none");
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
          avatarDecorationId,
          profileFrameId,
          profileEffectId,
          statusExpiresAt: status.trim() ? statusExpiresAt : null,
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
      updateCardColor(updated.cardColor ?? cardColor);
      setPlateStyle(safePlate(updated.plateStyle));
      setAccentColor(safeAccent(updated.accentColor));
      setAvatarFrame(safeFrame(updated.avatarFrame));
      setAvatarDecorationId(updated.avatarDecorationId ?? "none");
      setProfileFrameId(updated.profileFrameId ?? "none");
      setProfileEffectId(updated.profileEffectId ?? "none");
      setStatusExpiresAt(updated.statusExpiresAt ?? null);

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
    const allowedType = ["image/png", "image/jpeg", "image/webp"].includes(file.type) || (kind === "avatar" && file.type === "image/gif");
    if (!allowedType || file.size <= 0 || file.size > maxBytes) {
      setError(kind === "avatar"
        ? "Selecciona una imagen PNG, JPG, WebP o GIF de máximo 5 MB."
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
            <button type="button" className="ps-community-editor-close" onClick={onClose} aria-label="Cerrar editor">
              <X size={19}/>
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
              <div className="ps-community-editor-banner-stage" tabIndex={0} aria-label="Banner del perfil. Pasa el cursor para cambiarlo.">
                {profile.bannerUrl
                  ? <Image src={profile.bannerUrl} alt="Banner actual de tu perfil" fill unoptimized sizes="(max-width: 1100px) 100vw, 760px"/>
                  : <div className="ps-community-editor-banner-fallback"><div/><span className="ps-community-brand-wordmark">PeakScore</span></div>}
                <div className="ps-community-editor-banner-overlay"/>
                <span className="ps-community-editor-banner-hint">EDITAR PORTADA</span>
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
                  <div><span>02 / IMAGEN</span><h2>Avatar</h2><p>Tu imagen, GIF y decoración independiente.</p></div>
                </div>
                <div className="ps-community-editor-avatar-upload">
                  <div className={"ps-community-editor-avatar-large frame-" + avatarFrame + " is-decoration-" + avatarDecorationId} style={{ "--editor-accent": accentColor } as CSSProperties}>
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="Avatar actual" fill unoptimized sizes="90px"/>
                      : <span>{initials(displayName || "PeakScore")}</span>}
                  </div>
                  <div className="ps-community-editor-upload-details">
                    <strong>{displayName || "Miembro"}</strong>
                    <small>PNG, JPG, WebP o GIF · Máx. 5 MB</small>
                    <button type="button" className="ps-community-editor-avatar-menu-trigger" onClick={() => setAvatarMenuOpen((open) => !open)} aria-expanded={avatarMenuOpen}>
                      <Camera size={14}/> Administrar avatar <ChevronRight size={14}/>
                    </button>
                    {avatarMenuOpen && (
                      <div className="ps-community-editor-avatar-menu">
                        <button type="button" onClick={() => { setAvatarMenuOpen(false); avatarInput.current?.click(); }}>
                          <Camera size={15}/> Cambiar avatar
                        </button>
                        <button type="button" onClick={() => openAppearancePicker("avatarDecoration")}>
                          <Sparkles size={15}/> Cambiar decoración de avatar
                        </button>
                        {profile.avatarUrl && (
                          <button type="button" className="is-danger" onClick={() => void removeAsset("avatar")} disabled={Boolean(deleting) || busy}>
                            <Trash2 size={15}/> Eliminar avatar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ps-community-editor-avatar-decoration-row">
                  <div className={"ps-community-editor-avatar-decoration-sample is-decoration-" + avatarDecorationId}>
                    <Sparkles size={17}/>
                  </div>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{AVATAR_DECORATIONS.find((item) => item.id === avatarDecorationId)?.label}</strong>
                    <small>{AVATAR_DECORATIONS.find((item) => item.id === avatarDecorationId)?.description}</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("avatarDecoration")}>
                    Decorar <ChevronRight size={14}/>
                  </button>
                </div>
                <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { handleAvatarFileSelection(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}/>
              </section>

              <section className="ps-community-editor-panel ps-community-editor-frames-panel" ref={(node) => { sectionRefs.current.frames = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>03 / MARCO</span><h2>Marco de perfil</h2><p>Enmarca la tarjeta completa, no el avatar.</p></div>
                </div>
                <div className={"ps-community-editor-choice-row is-profile-frame-" + profileFrameId}>
                  <span className={"ps-community-editor-profile-frame-sample is-profile-frame-" + profileFrameId}><Frame size={19}/></span>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{PROFILE_FRAMES.find((item) => item.id === profileFrameId)?.label}</strong>
                    <small>{PROFILE_FRAMES.find((item) => item.id === profileFrameId)?.description}</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("profileFrame")}>
                    Cambiar <ChevronRight size={14}/>
                  </button>
                </div>
              </section>

              <section className="ps-community-editor-panel" ref={(node) => { sectionRefs.current.effects = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>04 / ANIMACIÓN</span><h2>Efectos de perfil</h2><p>Movimiento sutil detrás de tu identidad.</p></div>
                </div>
                <div className={"ps-community-editor-choice-row is-profile-effect-" + profileEffectId}>
                  <span className={"ps-community-editor-profile-effect-sample is-profile-effect-" + profileEffectId}><Sparkles size={19}/></span>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{PROFILE_EFFECTS.find((item) => item.id === profileEffectId)?.label}</strong>
                    <small>{PROFILE_EFFECTS.find((item) => item.id === profileEffectId)?.description}</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("profileEffect")}>
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
                  <div><span>05 / COLOR</span><h2>Color de perfil</h2><p>Elige el tono exacto de tu tarjeta.</p></div>
                </div>
                <div className="ps-community-card-color-control">
                  <button
                    type="button"
                    className="ps-community-card-color-trigger"
                    style={{ "--selected-card-color": cardColor } as CSSProperties}
                    onClick={() => setColorPickerOpen((open) => !open)}
                    aria-expanded={colorPickerOpen}
                    aria-label="Cambiar color de la tarjeta"
                  >
                    <span/>
                    <strong>{cardColor.toUpperCase()}</strong>
                    <ChevronRight size={15}/>
                  </button>
                  {colorPickerOpen && (
                    <div className="ps-community-color-picker" role="dialog" aria-label="Selector de color de tarjeta">
                      <div
                        className="ps-community-color-picker-plane"
                        style={{ backgroundColor: "hsl(" + cardHue + " 100% 50%)" }}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          updateCardColorFromPlane(event);
                        }}
                        onPointerMove={(event) => {
                          if (event.buttons === 1) updateCardColorFromPlane(event);
                        }}
                      >
                        <span
                          className="ps-community-color-picker-cursor"
                          style={{
                            left: (hexToHsv(cardColor).s * 100) + "%",
                            top: ((1 - hexToHsv(cardColor).v) * 100) + "%",
                          }}
                        />
                      </div>
                      <input
                        className="ps-community-color-picker-hue"
                        aria-label="Tono de color"
                        type="range"
                        min="0"
                        max="360"
                        value={cardHue}
                        onChange={(event) => updateCardHue(Number(event.target.value))}
                      />
                      <label className="ps-community-color-picker-hex">
                        <span>#</span>
                        <input
                          value={cardColor.replace("#", "").toUpperCase()}
                          maxLength={6}
                          aria-label="Código hexadecimal"
                          onChange={(event) => {
                            const next = event.target.value.replace(/[^0-9a-f]/gi, "");
                            if (next.length === 6) updateCardColor("#" + next);
                          }}
                        />
                        <button type="button" aria-label="Copiar color" onClick={() => void navigator.clipboard.writeText(cardColor.toUpperCase())}>
                          <Copy size={14}/>
                        </button>
                      </label>
                      <div className="ps-community-color-picker-recent">
                        {recentCardColors.map((color) => (
                          <button key={color} type="button" style={{ background: color }} onClick={() => updateCardColor(color)} aria-label={"Usar color " + color}/>
                        ))}
                      </div>
                      <div className="ps-community-color-picker-actions">
                        <button type="button" onClick={() => updateCardColor(DEFAULT_CARD)}>Restablecer</button>
                        <button type="button" onClick={() => setColorPickerOpen(false)}>Listo</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="ps-community-editor-accent-caption"><span>Fondo de tarjeta</span><code>{cardColor.toUpperCase()}</code></div>
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
                <div className="ps-community-editor-field">
                  <span>Estado personalizado</span>
                  <button type="button" className="ps-community-editor-status-trigger" onClick={() => {
                    setStatusDraft(status);
                    setStatusEditorOpen(true);
                  }}>
                    <MessageCircle size={15}/>
                    <span>{status || "Establecer estado…"}</span>
                    <ChevronRight size={14}/>
                  </button>
                  <small className="ps-community-editor-counter">{status.length}/80{statusExpiresAt ? " · " + new Date(statusExpiresAt).toLocaleString("es-CO", { hour: "2-digit", minute: "2-digit" }) : " · Sin caducidad"}</small>
                </div>
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
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle + " is-profile-frame-" + profileFrameId + " is-profile-effect-" + profileEffectId} style={{ "--editor-accent": accentColor, "--editor-card": cardColor } as CSSProperties}>
                <div className="ps-community-editor-preview-banner">
                  {profile.bannerUrl
                    ? <Image src={profile.bannerUrl} alt="" fill unoptimized sizes="(max-width: 900px) 100vw, 360px"/>
                    : <div className="ps-community-editor-preview-banner-empty"><span className="ps-community-brand-wordmark">PeakScore</span></div>}
                  <div className="ps-community-editor-preview-banner-shade"/>
                </div>
                <div className="ps-community-editor-preview-body">
                  <div className="ps-community-editor-preview-avatar-row">
                    <div className={"ps-community-editor-preview-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                      {profile.avatarUrl
                        ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="96px"/>
                        : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    {status ? <div className="ps-community-note-bubble">{status}</div> : <div className="ps-community-editor-preview-member-state">VISTA PREVIA</div>}
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

        {hasUnsavedChanges && (
          <div className="ps-community-editor-savebar" role="status" aria-live="polite">
            <span>¡No te olvides de guardar los cambios!</span>
            <div>
              <button type="button" className="is-secondary" onClick={discardChanges} disabled={busy || Boolean(uploading) || Boolean(deleting)}>
                Restablecer
              </button>
              <button type="button" className="is-primary" onClick={() => void saveProfile()} disabled={!canSave || !hasUnsavedChanges} aria-label="Guardar cambios">
                {busy ? <LoaderCircle size={15} className="ps-community-editor-spin"/> : <Save size={15}/>}
                {busy ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </main>

      {appearancePicker && (
        <div className="ps-community-picker-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAppearancePicker(null);
        }}>
          <section className="ps-community-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-picker-title">
            <header className="ps-community-picker-header">
              <div>
                <span>PEAKSCORE / COSMÉTICOS DE COMUNIDAD</span>
                <h2 id="ps-community-picker-title">
                  {appearancePicker === "avatarDecoration" ? "Cambiar decoración de avatar"
                    : appearancePicker === "profileFrame" ? "Cambiar marco de perfil"
                    : appearancePicker === "profileEffect" ? "Cambiar efecto de perfil"
                    : "Cambiar placa de miembro"}
                </h2>
                <p>
                  {appearancePicker === "avatarDecoration" ? "Elige el detalle animado que acompaña tu avatar."
                    : appearancePicker === "profileFrame" ? "Elige el contorno que rodea la tarjeta completa."
                    : appearancePicker === "profileEffect" ? "Elige el ambiente animado que se reproduce en el perfil."
                    : "Elige cómo aparece tu nombre en los canales y la lista de miembros."}
                </p>
              </div>
              <button type="button" onClick={() => setAppearancePicker(null)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>

            <div className="ps-community-picker-layout">
              <div className="ps-community-picker-collection">
                <div className="ps-community-picker-collection-heading">
                  <strong>
                    {appearancePicker === "avatarDecoration" ? "Decoraciones de avatar"
                      : appearancePicker === "profileFrame" ? "Marcos de perfil"
                      : appearancePicker === "profileEffect" ? "Efectos animados"
                      : "Placas de miembro"}
                  </strong>
                  <span>Presets comunitarios</span>
                </div>

                {appearancePicker === "avatarDecoration" && (
                  <div className="ps-community-picker-items is-frames">
                    {AVATAR_DECORATIONS.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftDecorationId === item.id ? " is-selected" : "")}
                        onClick={() => setDraftDecorationId(item.id)} aria-pressed={draftDecorationId === item.id}>
                        <span className={"ps-community-picker-avatar-decoration is-decoration-" + item.id}>
                          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="58px"/> : initials(displayName || "PeakScore")}
                        </span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftDecorationId === item.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "profileFrame" && (
                  <div className="ps-community-picker-items is-frames">
                    {PROFILE_FRAMES.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftProfileFrameId === item.id ? " is-selected" : "")}
                        onClick={() => setDraftProfileFrameId(item.id)} aria-pressed={draftProfileFrameId === item.id}>
                        <span className={"ps-community-picker-profile-frame is-profile-frame-" + item.id}><Frame size={22}/></span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftProfileFrameId === item.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "profileEffect" && (
                  <div className="ps-community-picker-items is-frames">
                    {PROFILE_EFFECTS.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftProfileEffectId === item.id ? " is-selected" : "")}
                        onClick={() => setDraftProfileEffectId(item.id)} aria-pressed={draftProfileEffectId === item.id}>
                        <span className={"ps-community-picker-profile-effect is-profile-effect-" + item.id}><Sparkles size={22}/></span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftProfileEffectId === item.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "plate" && (
                  <div className="ps-community-picker-items is-plates">
                    {PLATES.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item is-plate-item" + (draftPlate === item.id ? " is-selected" : "")}
                        onClick={() => setDraftPlate(item.id)} aria-pressed={draftPlate === item.id}>
                        <span className={"ps-community-picker-name-sample is-plate-" + item.id}>{displayName || "Tu nombre"}</span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftPlate === item.id && <i><Check size={12}/></i>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="ps-community-picker-preview">
                <span className="ps-community-picker-preview-eyebrow">VISTA PREVIA</span>
                {appearancePicker === "avatarDecoration" && (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large is-decoration-" + draftDecorationId}>
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong><small>{memberTag(profile.memberNumber)}</small>
                  </div>
                )}
                {appearancePicker === "profileFrame" && (
                  <article className={"ps-community-picker-card-preview is-profile-frame-" + draftProfileFrameId}>
                    <div className="ps-community-picker-card-preview-banner"/>
                    <div className="ps-community-picker-card-preview-body">
                      <strong>{displayName || "Tu nombre"}</strong>
                      <small>{memberTag(profile.memberNumber)}</small>
                      <span>PERFIL DE COMUNIDAD</span>
                    </div>
                  </article>
                )}
                {appearancePicker === "profileEffect" && (
                  <article className={"ps-community-picker-card-preview is-profile-effect-" + draftProfileEffectId}>
                    <div className="ps-community-picker-card-preview-banner"/>
                    <div className="ps-community-picker-card-preview-body">
                      <strong>{displayName || "Tu nombre"}</strong>
                      <small>{memberTag(profile.memberNumber)}</small>
                      <span>VISTA PREVIA DEL EFECTO</span>
                    </div>
                  </article>
                )}
                {appearancePicker === "plate" && (
                  <div className="ps-community-picker-plate-stage">
                    <div className="ps-community-picker-plate-cover"/>
                    <div className={"ps-community-picker-plate-name is-plate-" + draftPlate}>{displayName || "Tu nombre"}</div>
                    <span>LISTA DE MIEMBROS / CANALES</span>
                  </div>
                )}
                <div className="ps-community-picker-selection">
                  <span>SELECCIÓN ACTUAL</span>
                  <strong>
                    {appearancePicker === "avatarDecoration" ? AVATAR_DECORATIONS.find((item) => item.id === draftDecorationId)?.label
                      : appearancePicker === "profileFrame" ? PROFILE_FRAMES.find((item) => item.id === draftProfileFrameId)?.label
                      : appearancePicker === "profileEffect" ? PROFILE_EFFECTS.find((item) => item.id === draftProfileEffectId)?.label
                      : PLATES.find((item) => item.id === draftPlate)?.label}
                  </strong>
                  <p>
                    {appearancePicker === "avatarDecoration" ? AVATAR_DECORATIONS.find((item) => item.id === draftDecorationId)?.description
                      : appearancePicker === "profileFrame" ? PROFILE_FRAMES.find((item) => item.id === draftProfileFrameId)?.description
                      : appearancePicker === "profileEffect" ? PROFILE_EFFECTS.find((item) => item.id === draftProfileEffectId)?.description
                      : PLATES.find((item) => item.id === draftPlate)?.description}
                  </p>
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

      {avatarCropUrl && (
        <div className="ps-community-avatar-crop-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAvatarCrop();
        }}>
          <section className="ps-community-avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-avatar-crop-title">
            <header>
              <div><span>PEAKSCORE / AVATAR</span><h2 id="ps-community-avatar-crop-title">Ajustar imagen</h2></div>
              <button type="button" onClick={closeAvatarCrop} aria-label="Cerrar recorte"><X size={18}/></button>
            </header>
            <div className="ps-community-avatar-crop-stage">
              <Image src={avatarCropUrl} alt="Vista previa del recorte" fill unoptimized sizes="252px" style={{
                transform: "scale(" + avatarCropZoom + ")",
                transformOrigin: avatarCropX + "% " + avatarCropY + "%",
              }}/>
              <span/>
            </div>
            <div className="ps-community-avatar-crop-controls">
              <label><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={avatarCropZoom} onChange={(event) => setAvatarCropZoom(Number(event.target.value))}/></label>
              <label><span>Ajuste horizontal</span><input type="range" min="0" max="100" value={avatarCropX} onChange={(event) => setAvatarCropX(Number(event.target.value))}/></label>
              <label><span>Ajuste vertical</span><input type="range" min="0" max="100" value={avatarCropY} onChange={(event) => setAvatarCropY(Number(event.target.value))}/></label>
            </div>
            <p>Los GIF mantienen su animación y se cargan sin este recorte estático.</p>
            <footer>
              <button type="button" onClick={closeAvatarCrop}>Cancelar</button>
              <button type="button" className="is-primary" onClick={confirmAvatarCrop}>Aplicar recorte</button>
            </footer>
          </section>
        </div>
      )}

      {statusEditorOpen && (
        <div className="ps-community-status-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setStatusEditorOpen(false);
        }}>
          <section className="ps-community-status-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-status-title">
            <header>
              <h2 id="ps-community-status-title">Establecer estado</h2>
              <button type="button" onClick={() => setStatusEditorOpen(false)} aria-label="Cerrar"><X size={18}/></button>
            </header>
            <div className="ps-community-status-preview">
              <div className="ps-community-status-preview-avatar">
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="64px"/> : initials(displayName || "PeakScore")}
              </div>
              <div className="ps-community-status-bubble">{statusDraft || "¿En qué estás pensando?"}</div>
            </div>
            <label>
              <span>Estado</span>
              <input value={statusDraft} maxLength={80} onChange={(event) => setStatusDraft(event.target.value)} placeholder="¿En qué estás pensando?"/>
            </label>
            <label>
              <span>Eliminar estado</span>
              <select value={statusDuration} onChange={(event) => setStatusDuration(event.target.value as StatusDuration)}>
                <option value="30m">En 30 minutos</option>
                <option value="1h">En 1 hora</option>
                <option value="4h">En 4 horas</option>
                <option value="today">Hoy</option>
                <option value="never">Nunca</option>
              </select>
            </label>
            <footer>
              <button type="button" className="is-clear" onClick={() => { setStatusDraft(""); setStatus(""); setStatusExpiresAt(null); setStatusEditorOpen(false); }}>Borrar estado</button>
              <button type="button" className="is-save" onClick={applyStatusDraft}>Guardar</button>
            </footer>
          </section>
        </div>
      )}
    </div>,
    document.body,
  );
}
