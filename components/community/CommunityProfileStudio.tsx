"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  Aperture, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, ImagePlus, Pencil, Frame,
  LoaderCircle, Palette, Plus, PlusCircle, Save, Trash2, Type, X,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type DisplayNameStyle = "classic" | "gta" | "pixel";
type AvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type PickerKind = "avatarFrame" | "avatarDecoration" | "profileFrame" | "profileEffect" | "plate" | "nameStyle";
type AvatarDecorationId = "none" | "bloom" | "electric" | "glitch";
type ProfileFrameId = "none" | "obsidian" | "lunar" | "crimson" | "aurora";
type ProfileEffectId = "none" | "aurora" | "embers" | "starlight" | "scanline";
type StatusDuration = "30m" | "1h" | "4h" | "today" | "never";

type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  cardColor?: string;
  plateStyle?: PlateStyle;
  displayNameStyle?: DisplayNameStyle;
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
  isOnline: boolean;
};

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

const DISPLAY_NAME_STYLES: { id: DisplayNameStyle; label: string; description: string }[] = [
  { id: "classic", label: "Clásico", description: "Tipografía limpia y equilibrada" },
  { id: "gta", label: "Grand Theft Auto", description: "Estilo condensado de alto impacto" },
  { id: "pixel", label: "Pixel", description: "Tipografía de inspiración arcade" },
];
const AVATAR_DECORATIONS: { id: AvatarDecorationId; label: string; description: string }[] = [
  { id: "none", label: "Ninguna", description: "Avatar sin decoración" },
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
  return value && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : DEFAULT_ACCENT;
}
function safeFrame(value?: string): AvatarFrame {
  return FRAMES.some((item) => item.id === value) ? value as AvatarFrame : DEFAULT_FRAME;
}
function safePlate(value?: string): PlateStyle {
  return value === "grid" || value === "arcade" || value === "signal" ? value : "classic";
}
function safeDisplayNameStyle(value?: string): DisplayNameStyle {
  return value === "gta" || value === "pixel" ? value : "classic";
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
  return Number.isFinite(value) && Number(value) > 0
    ? "Miembro " + String(value).padStart(4, "0")
    : "Miembro nuevo";
}

export default function CommunityProfileStudio({ userId, initialProfile, onClose, onSaved, isOnline }: Props) {
  const [portalReady, setPortalReady] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [savedSnapshot, setSavedSnapshot] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
  const [pronouns, setPronouns] = useState(initialProfile.pronouns ?? "");
  const [status, setStatus] = useState(initialProfile.statusText ?? "");
  const [about, setAbout] = useState(initialProfile.about ?? "");
  const [cardColor, setCardColor] = useState(safeColor(initialProfile.cardColor));
  const [cardColorDraft, setCardColorDraft] = useState(safeColor(initialProfile.cardColor).slice(1));
  const [cardHue, setCardHue] = useState(hexToHsv(safeColor(initialProfile.cardColor)).h);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [recentCardColors, setRecentCardColors] = useState<string[]>(["#1E1F22", "#111214", "#2B2D31", "#3A3D46", "#3B443A"]);
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [displayNameStyle, setDisplayNameStyle] = useState<DisplayNameStyle>(safeDisplayNameStyle(initialProfile.displayNameStyle));
  const accentColor = DEFAULT_ACCENT;
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
  const [appearancePicker, setAppearancePicker] = useState<PickerKind | null>(null);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [draftAvatarFrame, setDraftAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [draftDecorationId, setDraftDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [draftProfileFrameId, setDraftProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [draftProfileEffectId, setDraftProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [hoveredProfileFrameId, setHoveredProfileFrameId] = useState<ProfileFrameId | null>(null);
  const [hoveredProfileEffectId, setHoveredProfileEffectId] = useState<ProfileEffectId | null>(null);
  const [draftPlate, setDraftPlate] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [draftDisplayNameStyle, setDraftDisplayNameStyle] = useState<DisplayNameStyle>(safeDisplayNameStyle(initialProfile.displayNameStyle));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | null>(null);
  const [deleting, setDeleting] = useState<"avatar" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const cardColorControlRef = useRef<HTMLDivElement>(null);
  const avatarMenuAnchorRef = useRef<HTMLDivElement>(null);
  const appearanceModalRef = useRef<HTMLElement>(null);
  const statusModalRef = useRef<HTMLElement>(null);
  const avatarCropModalRef = useRef<HTMLElement>(null);

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
      if (event.key !== "Escape") return;
      if (avatarCropUrl) {
        closeAvatarCrop();
        return;
      }
      if (statusEditorOpen) {
        setStatusEditorOpen(false);
        return;
      }
      if (appearancePicker) {
        setAppearancePicker(null);
        return;
      }
      if (colorPickerOpen) {
        setColorPickerOpen(false);
        return;
      }
      if (avatarMenuOpen) {
        setAvatarMenuOpen(false);
        return;
      }
      if (!busy && !uploading && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, busy, uploading, deleting, appearancePicker, statusEditorOpen, avatarCropUrl, colorPickerOpen, avatarMenuOpen]);

  useEffect(() => {
    if (!colorPickerOpen && !avatarMenuOpen && !statusEditorOpen && !appearancePicker && !avatarCropUrl) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      // Capture phase makes dismissal reliable even when a child control stops bubbling.
      if (colorPickerOpen && !cardColorControlRef.current?.contains(target)) setColorPickerOpen(false);
      if (avatarMenuOpen && !avatarMenuAnchorRef.current?.contains(target)) setAvatarMenuOpen(false);
      if (statusEditorOpen && !statusModalRef.current?.contains(target)) setStatusEditorOpen(false);
      if (appearancePicker && !appearanceModalRef.current?.contains(target)) setAppearancePicker(null);
      if (avatarCropUrl && !avatarCropModalRef.current?.contains(target)) closeAvatarCrop();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [colorPickerOpen, avatarMenuOpen, statusEditorOpen, appearancePicker, avatarCropUrl]);

  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const canSave = profile.isOwnProfile && displayName.trim().length >= 2 && !busy && !uploading && !deleting;
  const hasPickerChanges = appearancePicker === "avatarFrame" ? draftAvatarFrame !== avatarFrame
    : appearancePicker === "avatarDecoration" ? draftDecorationId !== avatarDecorationId
    : appearancePicker === "profileFrame" ? draftProfileFrameId !== profileFrameId
    : appearancePicker === "profileEffect" ? draftProfileEffectId !== profileEffectId
    : appearancePicker === "plate" ? draftPlate !== plateStyle
    : appearancePicker === "nameStyle" ? draftDisplayNameStyle !== displayNameStyle : false;
  const hasUnsavedChanges = displayName !== (savedSnapshot.displayName ?? "")
    || pronouns !== (savedSnapshot.pronouns ?? "")
    || status !== (savedSnapshot.statusText ?? "")
    || about !== (savedSnapshot.about ?? "")
    || cardColor !== safeColor(savedSnapshot.cardColor)
    || plateStyle !== safePlate(savedSnapshot.plateStyle)
    || displayNameStyle !== safeDisplayNameStyle(savedSnapshot.displayNameStyle)
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
    setCardColorDraft(normalized.slice(1));
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
    setDraftAvatarFrame(avatarFrame);
    setDraftDecorationId(avatarDecorationId);
    setDraftProfileFrameId(profileFrameId);
    setDraftProfileEffectId(profileEffectId);
    setHoveredProfileFrameId(null);
    setHoveredProfileEffectId(null);
    setDraftPlate(plateStyle);
    setDraftDisplayNameStyle(displayNameStyle);
    setAppearancePicker(kind);
    setAvatarMenuOpen(false);
    setError("");
    setNotice("");
  }

  function applyAppearancePicker() {
    if (appearancePicker === "avatarFrame") setAvatarFrame(draftAvatarFrame);
    if (appearancePicker === "avatarDecoration") setAvatarDecorationId(draftDecorationId);
    if (appearancePicker === "profileFrame") setProfileFrameId(draftProfileFrameId);
    if (appearancePicker === "profileEffect") setProfileEffectId(draftProfileEffectId);
    if (appearancePicker === "plate") setPlateStyle(draftPlate);
    if (appearancePicker === "nameStyle") setDisplayNameStyle(draftDisplayNameStyle);
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

  function openStatusEditor() {
    setStatusDraft(status);
    const expiration = statusExpiresAt ? new Date(statusExpiresAt).getTime() : 0;
    const remaining = expiration - Date.now();
    if (!expiration || remaining <= 0) setStatusDuration("never");
    else if (remaining <= 45 * 60 * 1000) setStatusDuration("30m");
    else if (remaining <= 2 * 60 * 60 * 1000) setStatusDuration("1h");
    else if (remaining <= 5 * 60 * 60 * 1000) setStatusDuration("4h");
    else setStatusDuration("today");
    setStatusEditorOpen(true);
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

  function discardChanges() {
    setDisplayName(savedSnapshot.displayName ?? "");
    setPronouns(savedSnapshot.pronouns ?? "");
    setStatus(savedSnapshot.statusText ?? "");
    setStatusDraft(savedSnapshot.statusText ?? "");
    setStatusExpiresAt(savedSnapshot.statusExpiresAt ?? null);
    setAbout(savedSnapshot.about ?? "");
    updateCardColor(safeColor(savedSnapshot.cardColor));
    setPlateStyle(safePlate(savedSnapshot.plateStyle));
    setDisplayNameStyle(safeDisplayNameStyle(savedSnapshot.displayNameStyle));
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
          displayNameStyle,
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
        displayNameStyle: payload.profile.displayNameStyle ? safeDisplayNameStyle(payload.profile.displayNameStyle) : displayNameStyle,
        accentColor: payload.appearanceSaved === false ? accentColor : safeAccent(payload.profile.accentColor ?? accentColor),
        avatarFrame: payload.appearanceSaved === false ? avatarFrame : safeFrame(payload.profile.avatarFrame ?? avatarFrame),
      };
      setProfile(updated);
      setSavedSnapshot(updated);
      updateCardColor(updated.cardColor ?? cardColor);
      setPlateStyle(safePlate(updated.plateStyle));
      setDisplayNameStyle(safeDisplayNameStyle(updated.displayNameStyle));
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

  async function uploadAsset(kind: "avatar", file: File | null) {
    if (!file || !profile.isOwnProfile || busy || deleting) return;
    const maxBytes = 5 * 1024 * 1024;
    const allowedType = ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type);
    if (!allowedType || file.size <= 0 || file.size > maxBytes) {
      setError("Selecciona una imagen PNG, JPG, WebP o GIF de máximo 5 MB.");
      if (avatarInput.current) avatarInput.current.value = "";
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
      const payload = await response.json().catch(() => null) as { error?: string; avatarUrl?: string } | null;
      const nextUrl = payload?.avatarUrl;
      if (!response.ok || !nextUrl) throw new Error(payload?.error ?? "No se pudo actualizar la imagen.");

      setProfile((current) => ({ ...current, avatarUrl: nextUrl }));
      setSavedSnapshot((current) => ({ ...current, avatarUrl: nextUrl }));
      setNotice("Avatar actualizado.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la imagen.");
    } finally {
      setUploading(null);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function removeAsset(kind: "avatar") {
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
      setProfile((current) => ({ ...current, avatarUrl: null }));
      setSavedSnapshot((current) => ({ ...current, avatarUrl: null }));
      setNotice("Avatar retirado.");
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo retirar la imagen.");
    } finally {
      setDeleting(null);
    }
  }

  if (!portalReady) return null;

  return createPortal(
    <div
      className="ps-community-editor-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy && !uploading && !deleting) onClose();
      }}
    >
    <div
      className={"ps-community-editor-v2" + (settingsCollapsed ? " is-sidebar-collapsed" : "")}
      style={previewStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ps-community-editor-title"
    >
      <main className="ps-community-editor-main">
        <header className="ps-community-editor-header">
          <div>
            <div className="ps-community-editor-eyebrow">PEAKSCORE / COMMUNITY IDENTITY</div>
            <h1 id="ps-community-editor-title">Editar perfil</h1>
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
                Para guardar la apariencia, la placa y el estilo de nombre, aplica las migraciones de identidad comunitaria de esta rama en Supabase.
              </div>
            )}
          </div>
        )}

        <div className={"ps-community-editor-workspace ps-community-editor-workspace-discord" + (settingsCollapsed ? " is-sidebar-collapsed" : "")}>
          <button
            type="button"
            className={"ps-community-editor-sidebar-toggle" + (settingsCollapsed ? " is-collapsed" : "")}
            onClick={() => setSettingsCollapsed((collapsed) => !collapsed)}
            aria-label={settingsCollapsed ? "Mostrar ajustes del perfil" : "Ocultar ajustes del perfil"}
            aria-expanded={!settingsCollapsed}
            title={settingsCollapsed ? "Mostrar estilos" : "Ocultar estilos"}
          >
            {settingsCollapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}
          </button>
          <aside className={"ps-community-editor-settings-sidebar" + (settingsCollapsed ? " is-collapsed" : "")} aria-label="Ajustes del perfil" aria-hidden={settingsCollapsed}>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Placa de identificación</div>
              <button
                type="button"
                className={"ps-community-editor-nameplate-tile is-plate-" + plateStyle}
                onClick={() => openAppearancePicker("plate")}
                aria-label="Cambiar placa de identificación"
              >
                <span className="ps-community-editor-nameplate-avatar">
                  {profile.avatarUrl
                    ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="30px"/>
                    : initials(displayName || "PeakScore")}
                </span>
                <span className="ps-community-editor-nameplate-copy">
                  <strong className={"is-name-style-" + displayNameStyle}>{displayName || "Tu nombre"}</strong>
                  <small>{memberTag(profile.memberNumber)}</small>
                </span>
                <PlusCircle size={20}/>
              </button>
            </section>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Avatar y decoración</div>
              <div className="ps-community-editor-avatar-tiles">
                <button type="button" className="ps-community-editor-avatar-tile" onClick={() => avatarInput.current?.click()} aria-label="Cambiar avatar">
                  <span className={"ps-community-editor-avatar-tile-image is-decoration-" + avatarDecorationId}>
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="70px"/>
                      : initials(displayName || "PeakScore")}
                  </span>
                  <small>Avatar</small>
                </button>
                <button type="button" className="ps-community-editor-decoration-tile" onClick={() => openAppearancePicker("avatarDecoration")} aria-label="Cambiar decoración de avatar">
                  <span className={"ps-community-editor-decoration-tile-preview is-decoration-" + avatarDecorationId}>
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="61px"/>
                      : initials(displayName || "PeakScore")}
                    <i><Plus size={12}/></i>
                  </span>
                  <small>Decoración</small>
                </button>
              </div>
              <button type="button" className="ps-community-editor-subtle-link" onClick={() => { setAvatarMenuOpen(false); openAppearancePicker("avatarFrame"); }}>
                <Frame size={13}/> Marco de avatar
              </button>
            </section>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Color de cartel</div>
              <div className="ps-community-editor-sidebar-color-anchor" ref={cardColorControlRef}>
                <button
                  type="button"
                  className="ps-community-editor-sidebar-color-swatch"
                  style={{ "--profile-banner-color": cardColor } as CSSProperties}
                  onClick={() => setColorPickerOpen((open) => !open)}
                  aria-expanded={colorPickerOpen}
                  aria-label={"Cambiar color del cartel. Color actual " + cardColor}
                >
                  <span>{cardColor}</span><Palette size={15}/>
                </button>
                {colorPickerOpen && (
                  <div className="ps-community-color-picker ps-community-editor-sidebar-color-picker" role="dialog" aria-label="Selector de color del banner">
                    <div className="ps-community-color-picker-plane" style={{ backgroundColor: "hsl(" + cardHue + " 100% 50%)" }}
                      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateCardColorFromPlane(event); }}
                      onPointerMove={(event) => { if (event.buttons === 1) updateCardColorFromPlane(event); }}>
                      <span className="ps-community-color-picker-cursor" style={{ left: (hexToHsv(cardColor).s * 100) + "%", top: ((1 - hexToHsv(cardColor).v) * 100) + "%" }}/>
                    </div>
                    <label className="ps-community-color-picker-hue-wrap" aria-label="Espectro de colores">
                      <input className="ps-community-color-picker-hue" aria-label="Tono" type="range" min="0" max="360" value={cardHue} onChange={(event) => updateCardHue(Number(event.target.value))}/>
                    </label>
                    <label className="ps-community-color-picker-hex"><span>#</span>
                      <input value={cardColorDraft} maxLength={6} aria-label="Código hexadecimal" inputMode="text" onChange={(event) => { const next = event.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase(); setCardColorDraft(next); if (next.length === 6) updateCardColor("#" + next); }} onBlur={() => { if (cardColorDraft.length === 6) updateCardColor("#" + cardColorDraft); else setCardColorDraft(cardColor.slice(1)); }}/>
                      <button type="button" aria-label="Copiar color" onClick={() => void navigator.clipboard.writeText(cardColor.toUpperCase())}><Copy size={14}/></button>
                    </label>
                    <div className="ps-community-color-picker-recent">{recentCardColors.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => updateCardColor(color)} aria-label={"Usar color " + color}/>)}</div>
                    <div className="ps-community-color-picker-actions"><button type="button" onClick={() => updateCardColor(DEFAULT_CARD)}>Restablecer</button><button type="button" onClick={() => setColorPickerOpen(false)}>Listo</button></div>
                  </div>
                )}
              </div>
            </section>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Marcos y efectos de perfil</div>
              <div className="ps-community-editor-cosmetic-tiles">
                <button type="button" className="ps-community-editor-cosmetic-tile" onClick={() => openAppearancePicker("profileFrame")} aria-label="Cambiar marco de perfil">
                  <span className={"ps-community-editor-cosmetic-live-preview is-frame is-profile-frame-" + profileFrameId} aria-hidden="true">
                    <span className="ps-community-editor-cosmetic-preview-banner" style={{ backgroundColor: cardColor }}/>
                    <span className="ps-community-editor-cosmetic-preview-avatar">
                      {profile.avatarUrl
                        ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="28px"/>
                        : initials(displayName || "PeakScore")}
                    </span>
                    <span className="ps-community-editor-cosmetic-preview-lines"><i/><i/></span>
                    <span className="ps-community-editor-cosmetic-preview-sweep"/>
                  </span>
                  <small>Marco</small>
                </button>
                <button type="button" className="ps-community-editor-cosmetic-tile" onClick={() => openAppearancePicker("profileEffect")} aria-label="Cambiar efecto de perfil">
                  <span className={"ps-community-editor-cosmetic-live-preview is-effect is-profile-effect-" + profileEffectId} aria-hidden="true">
                    <span className="ps-community-editor-cosmetic-preview-banner" style={{ backgroundColor: cardColor }}/>
                    <span className="ps-community-editor-cosmetic-preview-avatar">
                      {profile.avatarUrl
                        ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="28px"/>
                        : initials(displayName || "PeakScore")}
                    </span>
                    <span className="ps-community-editor-cosmetic-preview-lines"><i/><i/></span>
                    <span className="ps-community-editor-cosmetic-preview-art">
                      <Image src="/profile-cosmetics/effects/starfall.svg" alt="" fill unoptimized sizes="100px"/>
                      <Image src="/profile-cosmetics/effects/pixel-burst.svg" alt="" fill unoptimized sizes="100px"/>
                    </span>
                    <span className="ps-community-editor-cosmetic-preview-sweep"/>
                  </span>
                  <small>Efecto</small>
                </button>
              </div>
            </section>

            <section className="ps-community-editor-settings-section ps-community-editor-name-style-section">
              <div className="ps-community-editor-settings-section-title">Estilo de nombre de visualización</div>
              <span className="ps-community-editor-new-label">NUEVO</span>
              <button type="button" className={"ps-community-editor-name-style-preview is-plate-" + plateStyle + " is-name-style-" + displayNameStyle} onClick={() => openAppearancePicker("nameStyle")} aria-label="Cambiar estilo del nombre">
                <strong>{displayName || "Tu nombre"}</strong><Type size={15}/>
              </button>
              <small className="ps-community-editor-settings-hint">Prueba la fuente de Grand Theft Auto.</small>
            </section>

            <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { handleAvatarFileSelection(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}/>
          </aside>

          <section className="ps-community-editor-preview-column" aria-label="Vista previa del perfil">
            <div className="ps-community-editor-preview-frame">
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle + " is-profile-frame-" + profileFrameId + " is-profile-effect-" + profileEffectId} style={{ "--editor-accent": accentColor, "--editor-card": cardColor } as CSSProperties}>
                <div className="ps-community-editor-banner-anchor">
                  <div className="ps-community-editor-preview-banner" style={{ backgroundColor: cardColor }}>
                    <div className="ps-community-editor-preview-banner-shade" aria-hidden="true"/>
                    <div className="ps-community-editor-preview-banner-empty" aria-hidden="true"/>
                  </div>
                </div>
                <div className="ps-community-editor-preview-body">
                  <div className="ps-community-editor-preview-avatar-row">
                    <div className="ps-community-editor-preview-avatar-anchor" ref={avatarMenuAnchorRef}>
                      <button type="button" className="ps-community-editor-preview-avatar-trigger" onClick={() => setAvatarMenuOpen((open) => !open)} aria-expanded={avatarMenuOpen} aria-label="Cambiar avatar o decoración">
                        <span className={"ps-community-editor-preview-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                          {profile.avatarUrl
                            ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="96px"/>
                            : <span>{initials(displayName || "PeakScore")}</span>}
                          <i
                            className={"ps-community-editor-presence-dot " + (isOnline ? "is-online" : "is-offline")}
                            role="img"
                            aria-label={isOnline ? "En línea" : "Desconectado"}
                          />
                        </span>
                      </button>
                      {avatarMenuOpen && (
                        <div className="ps-community-editor-avatar-menu ps-community-editor-avatar-menu-preview" role="menu" aria-label="Opciones del avatar">
                          <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); avatarInput.current?.click(); }}>
                            <Camera size={15}/> Cambiar avatar
                          </button>
                          <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); openAppearancePicker("avatarDecoration"); }}>
                            <ImagePlus size={15}/> Cambiar decoración de avatar
                          </button>
                          {profile.avatarUrl && (
                            <button type="button" role="menuitem" className="is-danger" onClick={() => { setAvatarMenuOpen(false); void removeAsset("avatar"); }} disabled={Boolean(deleting) || busy}>
                              <Trash2 size={15}/> Eliminar avatar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button type="button" className={"ps-community-note-bubble" + (status ? " has-status" : " is-empty")} onClick={openStatusEditor} aria-label={status ? "Editar estado personalizado" : "Añadir estado personalizado"}>
                      {!status && <Plus size={13} aria-hidden="true"/>}
                      <span className="ps-community-note-bubble-text">{status || "Añadir estado"}</span>
                      <Pencil size={11} className="ps-community-note-bubble-edit" aria-hidden="true"/>
                    </button>
                  </div>
                  <strong className={"ps-community-editor-preview-name-static is-plate-" + plateStyle + " is-name-style-" + displayNameStyle}>
                    {displayName || "Tu nombre"}
                  </strong>
                  <div className="ps-community-editor-preview-identity-line">
                    <span className="ps-community-editor-preview-tag">{memberTag(profile.memberNumber)}</span>
                    <input className="ps-community-editor-preview-pronouns" value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Añadir pronombres" aria-label="Editar pronombres"/>
                  </div>
                  <div className="ps-community-editor-preview-role-row">
                    {profile.roles.slice(0, 3).map((role) => (
                      <span key={role.roleKey} style={{
                        "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : accentColor,
                      } as CSSProperties}>{role.label}</span>
                    ))}
                  </div>
                  <div className="ps-community-editor-preview-divider"/>
                  <section className="ps-community-editor-preview-about">
                    <div className="ps-community-editor-preview-about-heading"><span>Biografía</span><small>{about.length}/280</small></div>
                    <textarea value={about} maxLength={280} rows={4} onChange={(event) => setAbout(event.target.value)} placeholder="Descríbete aquí…"/>
                  </section>
                  <section className="ps-community-editor-preview-meta">
                    <span>MIEMBRO DESDE</span>
                    <strong>{joinedLabel}</strong>
                  </section>
                </div>
              </article>
            </div>
          </section>
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
        <div className="ps-community-picker-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setAppearancePicker(null);
        }}>
          <section ref={appearanceModalRef} className="ps-community-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-picker-title">
            <header className="ps-community-picker-header">
              <div>
                <span>PEAKSCORE / COSMÉTICOS DE COMUNIDAD</span>
                <h2 id="ps-community-picker-title">
                  {appearancePicker === "avatarFrame" ? "Cambiar marco de avatar"
                    : appearancePicker === "avatarDecoration" ? "Cambiar decoración de avatar"
                    : appearancePicker === "profileFrame" ? "Cambiar marco de perfil"
                    : appearancePicker === "profileEffect" ? "Cambiar efecto de perfil"
                    : appearancePicker === "nameStyle" ? "Estilo de nombre de visualización"
                    : "Cambiar placa de identificación"}
                </h2>
                <p>
                  {appearancePicker === "avatarFrame" ? "Elige el contorno que rodea tu imagen de perfil."
                    : appearancePicker === "avatarDecoration" ? "Elige el detalle animado que acompaña tu avatar."
                    : appearancePicker === "profileFrame" ? "Elige el contorno que rodea la tarjeta completa."
                    : appearancePicker === "profileEffect" ? "Elige el ambiente animado que se reproduce en el perfil."
                    : appearancePicker === "nameStyle" ? "Elige la tipografía que se muestra junto a tu identidad."
                    : "Elige la placa que acompaña tu nombre en la comunidad."}
                </p>
              </div>
              <button type="button" onClick={() => setAppearancePicker(null)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>

            <div className="ps-community-picker-layout">
              <div className="ps-community-picker-collection">
                <div className="ps-community-picker-collection-heading">
                  <strong>
                    {appearancePicker === "avatarFrame" ? "Marcos de avatar"
                      : appearancePicker === "avatarDecoration" ? "Decoraciones de avatar"
                      : appearancePicker === "profileFrame" ? "Marcos de perfil"
                      : appearancePicker === "profileEffect" ? "Efectos animados"
                      : appearancePicker === "nameStyle" ? "Estilos de nombre"
                      : "Placas de identificación"}
                  </strong>
                  <span>Opciones disponibles</span>
                </div>

                {appearancePicker === "avatarFrame" && (
                  <div className="ps-community-picker-items is-frames">
                    {FRAMES.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftAvatarFrame === item.id ? " is-selected" : "")}
                        onClick={() => setDraftAvatarFrame(item.id)} aria-pressed={draftAvatarFrame === item.id}>
                        <span className={"ps-community-picker-avatar-large ps-community-picker-avatar-small frame-" + item.id}>
                          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="56px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                        </span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftAvatarFrame === item.id && <i><Check size={12}/></i>}
                        <em>{avatarFrame === item.id ? "EQUIPADO" : draftAvatarFrame === item.id ? "SELECCIONADO" : ""}</em>
                      </button>
                    ))}
                  </div>
                )}

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
                        <em>{avatarDecorationId === item.id ? "EQUIPADO" : draftDecorationId === item.id ? "SELECCIONADO" : ""}</em>
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "profileFrame" && (
                  <div className="ps-community-picker-items is-frames">
                    {PROFILE_FRAMES.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftProfileFrameId === item.id ? " is-selected" : "")}
                        onClick={() => setDraftProfileFrameId(item.id)}
                        onMouseEnter={() => setHoveredProfileFrameId(item.id)}
                        onMouseLeave={() => setHoveredProfileFrameId(null)}
                        onFocus={() => setHoveredProfileFrameId(item.id)}
                        onBlur={() => setHoveredProfileFrameId(null)}
                        aria-pressed={draftProfileFrameId === item.id}>
                        <span className={"ps-community-picker-mini-profile is-profile-frame-" + item.id} aria-hidden="true">
                          <span className="ps-community-picker-mini-banner" style={{ backgroundColor: cardColor }}/>
                          <span className="ps-community-picker-mini-avatar">
                            {profile.avatarUrl
                              ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="28px"/>
                              : initials(displayName || "PeakScore")}
                          </span>
                          <span className="ps-community-picker-mini-name">{displayName || "Tu nombre"}</span>
                          <span className="ps-community-picker-mini-border"/>
                        </span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftProfileFrameId === item.id && <i><Check size={12}/></i>}
                        <em>{profileFrameId === item.id ? "EQUIPADO" : draftProfileFrameId === item.id ? "SELECCIONADO" : ""}</em>
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "profileEffect" && (
                  <div className="ps-community-picker-items is-frames">
                    {PROFILE_EFFECTS.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item" + (draftProfileEffectId === item.id ? " is-selected" : "")}
                        onClick={() => setDraftProfileEffectId(item.id)}
                        onMouseEnter={() => setHoveredProfileEffectId(item.id)}
                        onMouseLeave={() => setHoveredProfileEffectId(null)}
                        onFocus={() => setHoveredProfileEffectId(item.id)}
                        onBlur={() => setHoveredProfileEffectId(null)}
                        aria-pressed={draftProfileEffectId === item.id}>
                        <span className={"ps-community-picker-mini-profile is-effect is-profile-effect-" + item.id} aria-hidden="true">
                          <span className="ps-community-picker-mini-banner" style={{ backgroundColor: cardColor }}/>
                          <span className="ps-community-picker-mini-avatar">
                            {profile.avatarUrl
                              ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="28px"/>
                              : initials(displayName || "PeakScore")}
                          </span>
                          <span className="ps-community-picker-mini-name">{displayName || "Tu nombre"}</span>
                          <span className="ps-community-picker-mini-art">
                            <Image src="/profile-cosmetics/effects/starfall.svg" alt="" fill unoptimized sizes="95px"/>
                            <Image src="/profile-cosmetics/effects/pixel-burst.svg" alt="" fill unoptimized sizes="95px"/>
                          </span>
                        </span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftProfileEffectId === item.id && <i><Check size={12}/></i>}
                        <em>{profileEffectId === item.id ? "EQUIPADO" : draftProfileEffectId === item.id ? "SELECCIONADO" : ""}</em>
                      </button>
                    ))}
                  </div>
                )}

                {appearancePicker === "nameStyle" && (
                  <div className="ps-community-picker-items is-frames">
                    {DISPLAY_NAME_STYLES.map((item) => (
                      <button key={item.id} type="button"
                        className={"ps-community-picker-item is-name-style-choice" + (draftDisplayNameStyle === item.id ? " is-selected" : "")}
                        onClick={() => setDraftDisplayNameStyle(item.id)} aria-pressed={draftDisplayNameStyle === item.id}>
                        <span className={"ps-community-picker-name-style-sample is-name-style-" + item.id}>{displayName || "Tu nombre"}</span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftDisplayNameStyle === item.id && <i><Check size={12}/></i>}
                        <em>{displayNameStyle === item.id ? "EQUIPADO" : draftDisplayNameStyle === item.id ? "SELECCIONADO" : ""}</em>
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
                        <span className={"ps-community-picker-member-option is-plate-" + item.id}>
                          <span className="ps-community-picker-member-avatar">
                            {profile.avatarUrl
                              ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="34px"/>
                              : initials(displayName || "PeakScore")}
                          </span>
                          <span className="ps-community-picker-member-copy">
                            <strong className={"ps-community-picker-member-name is-plate-" + item.id + " is-name-style-" + displayNameStyle}>{displayName || "Tu nombre"}</strong>
                            <small>{profile.roles[0]?.label ?? "Miembro"}</small>
                          </span>
                        </span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftPlate === item.id && <i><Check size={12}/></i>}
                        <em>{plateStyle === item.id ? "EQUIPADO" : draftPlate === item.id ? "SELECCIONADO" : ""}</em>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <aside className="ps-community-picker-preview">
                <span className="ps-community-picker-preview-eyebrow">VISTA PREVIA</span>
                {appearancePicker === "avatarFrame" && (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large frame-" + draftAvatarFrame}>
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong><small>{memberTag(profile.memberNumber)}</small>
                  </div>
                )}
                {appearancePicker === "avatarDecoration" && (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large is-decoration-" + draftDecorationId}>
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong><small>{memberTag(profile.memberNumber)}</small>
                  </div>
                )}
                {appearancePicker === "profileFrame" && (
                  <article className={"ps-community-picker-card-preview is-profile-frame-" + (hoveredProfileFrameId ?? draftProfileFrameId) + (hoveredProfileFrameId ? " is-hover-preview" : "")}>
                    <div className="ps-community-picker-card-preview-banner" style={{ backgroundColor: cardColor }}/>
                    <div className="ps-community-picker-card-preview-body">
                      <span className="ps-community-picker-card-preview-avatar">
                        {profile.avatarUrl
                          ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="64px"/>
                          : initials(displayName || "PeakScore")}
                      </span>
                      <strong>{displayName || "Tu nombre"}</strong>
                      <small>{memberTag(profile.memberNumber)}</small>
                      <span>PERFIL DE COMUNIDAD</span>
                    </div>
                  </article>
                )}
                {appearancePicker === "profileEffect" && (
                  <article className={"ps-community-picker-card-preview is-profile-effect-" + (hoveredProfileEffectId ?? draftProfileEffectId) + (hoveredProfileEffectId ? " is-hover-preview" : "")}>
                    <div className="ps-community-picker-card-preview-banner" style={{ backgroundColor: cardColor }}/>
                    <div className="ps-community-picker-card-preview-body">
                      <span className="ps-community-picker-card-preview-avatar">
                        {profile.avatarUrl
                          ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="64px"/>
                          : initials(displayName || "PeakScore")}
                      </span>
                      <strong>{displayName || "Tu nombre"}</strong>
                      <small>{memberTag(profile.memberNumber)}</small>
                      <span>VISTA PREVIA DEL EFECTO</span>
                    </div>
                    <span className="ps-community-picker-card-preview-art" aria-hidden="true">
                      <Image src="/profile-cosmetics/effects/starfall.svg" alt="" fill unoptimized sizes="320px"/>
                      <Image src="/profile-cosmetics/effects/pixel-burst.svg" alt="" fill unoptimized sizes="320px"/>
                    </span>
                  </article>
                )}
                {appearancePicker === "nameStyle" && (
                  <div className="ps-community-picker-name-style-stage">
                    <span>VISTA DEL NOMBRE</span>
                    <strong className={"is-name-style-" + draftDisplayNameStyle}>{displayName || "Tu nombre"}</strong>
                    <small>{memberTag(profile.memberNumber)}</small>
                  </div>
                )}
                {appearancePicker === "plate" && (
                  <div className="ps-community-picker-plate-stage">
                    <div className="ps-community-picker-member-list-heading">
                      <span>MIEMBROS</span>
                      <small>VISTA DEL CANAL</small>
                    </div>
                    <div className="ps-community-picker-member-row">
                      <span className="ps-community-picker-member-avatar is-large">
                        {profile.avatarUrl
                          ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="42px"/>
                          : initials(displayName || "PeakScore")}
                      </span>
                      <span className="ps-community-picker-member-copy">
                        <strong className={"ps-community-picker-member-name is-plate-" + draftPlate + " is-name-style-" + displayNameStyle}>{displayName || "Tu nombre"}</strong>
                        <small>{profile.roles[0]?.label ?? "Miembro"}</small>
                      </span>
                      {profile.roles[0] && (
                        <span className="ps-community-picker-member-role" style={{ "--member-role-color": /^#[0-9a-f]{6}$/i.test(profile.roles[0].badgeColor) ? profile.roles[0].badgeColor : "#949ba4" } as CSSProperties}>
                          {profile.roles[0].label}
                        </span>
                      )}
                    </div>
                    <div className="ps-community-picker-member-list-footer">Así aparecerás en la lista de miembros del canal.</div>
                  </div>
                )}
                <div className="ps-community-picker-selection">
                  <span>SELECCIÓN ACTUAL</span>
                  <strong>
                    {appearancePicker === "avatarFrame" ? FRAMES.find((item) => item.id === draftAvatarFrame)?.label
                      : appearancePicker === "avatarDecoration" ? AVATAR_DECORATIONS.find((item) => item.id === draftDecorationId)?.label
                      : appearancePicker === "profileFrame" ? PROFILE_FRAMES.find((item) => item.id === draftProfileFrameId)?.label
                      : appearancePicker === "profileEffect" ? PROFILE_EFFECTS.find((item) => item.id === draftProfileEffectId)?.label
                      : appearancePicker === "nameStyle" ? DISPLAY_NAME_STYLES.find((item) => item.id === draftDisplayNameStyle)?.label
                      : PLATES.find((item) => item.id === draftPlate)?.label}
                  </strong>
                  <p>
                    {appearancePicker === "avatarFrame" ? FRAMES.find((item) => item.id === draftAvatarFrame)?.description
                      : appearancePicker === "avatarDecoration" ? AVATAR_DECORATIONS.find((item) => item.id === draftDecorationId)?.description
                      : appearancePicker === "profileFrame" ? PROFILE_FRAMES.find((item) => item.id === draftProfileFrameId)?.description
                      : appearancePicker === "profileEffect" ? PROFILE_EFFECTS.find((item) => item.id === draftProfileEffectId)?.description
                      : appearancePicker === "nameStyle" ? DISPLAY_NAME_STYLES.find((item) => item.id === draftDisplayNameStyle)?.description
                      : PLATES.find((item) => item.id === draftPlate)?.description}
                  </p>
                </div>
              </aside>
            </div>

            <footer className="ps-community-picker-footer">
              <button type="button" className="is-quiet" onClick={() => setAppearancePicker(null)}>Cancelar</button>
              <button type="button" className="is-primary" onClick={applyAppearancePicker} disabled={!hasPickerChanges}>
                {hasPickerChanges ? "Aplicar selección" : "Ya equipado"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {avatarCropUrl && (
        <div className="ps-community-avatar-crop-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) closeAvatarCrop();
        }}>
          <section ref={avatarCropModalRef} className="ps-community-avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-avatar-crop-title">
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
        <div className="ps-community-status-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setStatusEditorOpen(false);
        }}>
          <section ref={statusModalRef} className="ps-community-status-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-status-title">
            <header>
              <h2 id="ps-community-status-title">Establecer estado</h2>
              <button type="button" onClick={() => setStatusEditorOpen(false)} aria-label="Cerrar"><X size={18}/></button>
            </header>
            <div className="ps-community-status-profile-head">
              <div className="ps-community-status-preview-avatar">
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="48px"/> : initials(displayName || "PeakScore")}
              </div>
              <div className="ps-community-status-profile-copy">
                <strong>{displayName || "Tu perfil"}</strong>
                <small>ESTADO PERSONALIZADO</small>
              </div>
            </div>
            <div className="ps-community-status-preview" aria-live="polite">
              {statusDraft.trim()
                ? <div className="ps-community-status-bubble">{statusDraft}</div>
                : <span className="ps-community-status-placeholder">Así aparecerá tu estado junto al avatar.</span>}
            </div>
            <label className="ps-community-status-field">
              <span>¿Qué estás pensando?</span>
              <div className="ps-community-status-input-wrap">
                <input autoFocus value={statusDraft} maxLength={80} onChange={(event) => setStatusDraft(event.target.value)} onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    applyStatusDraft();
                  }
                }} placeholder="¿Qué tienes en mente?"/>
                <small>{statusDraft.length}/80</small>
              </div>
            </label>
            <label className="ps-community-status-field">
              <span>Borrar estado después de</span>
              <select value={statusDuration} onChange={(event) => setStatusDuration(event.target.value as StatusDuration)}>
                <option value="30m">30 minutos</option>
                <option value="1h">1 hora</option>
                <option value="4h">4 horas</option>
                <option value="today">Hoy</option>
                <option value="never">Nunca</option>
              </select>
            </label>
            <footer>
              {(status || statusDraft) ? (
                <button type="button" className="is-clear" onClick={() => { setStatusDraft(""); setStatus(""); setStatusExpiresAt(null); setStatusEditorOpen(false); }}>Borrar estado</button>
              ) : (
                <button type="button" className="is-clear" onClick={() => setStatusEditorOpen(false)}>Cancelar</button>
              )}
              <button type="button" className="is-save" onClick={applyStatusDraft} disabled={busy}>Guardar</button>
            </footer>
          </section>
        </div>
      )}
    </div>
    </div>,
    document.body,
  );
}
