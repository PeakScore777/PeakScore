"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  Activity, Camera, Check, ChevronRight, Copy, IdCard, MessageCircle, Orbit, Pencil, Frame,
  LoaderCircle, Palette, PanelsTopLeft, Plus, Save, Trash2, UserRound, X,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type AvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type EditorSection = "profile" | "banner" | "avatar" | "frames" | "effects" | "plate";
type PickerKind = "avatarFrame" | "avatarDecoration" | "profileFrame" | "profileEffect" | "plate";
type AvatarDecorationId = "none" | "orbit" | "bloom" | "electric" | "glitch";
type ProfileFrameId = "none" | "obsidian" | "lunar" | "crimson" | "aurora";
type ProfileEffectId = "none" | "aurora" | "embers" | "starlight" | "scanline";
type StatusDuration = "30m" | "1h" | "4h" | "today" | "never";

type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
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
  { id: "banner", label: "Color de cartel", description: "Fondo de tu tarjeta", icon: Palette },
  { id: "avatar", label: "Avatar y decoración", description: "Foto y elementos animados", icon: Camera },
  { id: "frames", label: "Marco de perfil", description: "Borde de tu tarjeta", icon: PanelsTopLeft },
  { id: "effects", label: "Efectos de perfil", description: "Animaciones de tu tarjeta", icon: Activity },
  { id: "plate", label: "Diseño de nombre", description: "Fondo visual detrás de tu nombre", icon: IdCard },
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
  const [cardColorDraft, setCardColorDraft] = useState(safeColor(initialProfile.cardColor).slice(1));
  const [cardHue, setCardHue] = useState(hexToHsv(safeColor(initialProfile.cardColor)).h);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [recentCardColors, setRecentCardColors] = useState<string[]>(["#1E1F22", "#111214", "#2B2D31", "#3A3D46", "#3B443A"]);
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
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
  const [bannerMenuOpen, setBannerMenuOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropUrl, setAvatarCropUrl] = useState<string | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropX, setAvatarCropX] = useState(50);
  const [avatarCropY, setAvatarCropY] = useState(50);
  const [activeSection, setActiveSection] = useState<EditorSection>("profile");
  const [controlsOpen, setControlsOpen] = useState(true);
  const [appearancePicker, setAppearancePicker] = useState<PickerKind | null>(null);
  const [draftAvatarFrame, setDraftAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [draftDecorationId, setDraftDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [draftProfileFrameId, setDraftProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [draftProfileEffectId, setDraftProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [draftPlate, setDraftPlate] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | null>(null);
  const [deleting, setDeleting] = useState<"avatar" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const cardColorControlRef = useRef<HTMLDivElement>(null);
  const avatarMenuAnchorRef = useRef<HTMLDivElement>(null);
  const bannerMenuAnchorRef = useRef<HTMLDivElement>(null);
  const appearanceModalRef = useRef<HTMLElement>(null);
  const statusModalRef = useRef<HTMLElement>(null);
  const avatarCropModalRef = useRef<HTMLElement>(null);
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
      if (bannerMenuOpen) {
        setBannerMenuOpen(false);
        return;
      }
      if (!busy && !uploading && !deleting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, busy, uploading, deleting, appearancePicker, statusEditorOpen, avatarCropUrl, colorPickerOpen, avatarMenuOpen, bannerMenuOpen]);

  useEffect(() => {
    if (!colorPickerOpen && !avatarMenuOpen && !bannerMenuOpen && !statusEditorOpen && !appearancePicker && !avatarCropUrl) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      // Capture phase makes dismissal reliable even when a child control stops bubbling.
      if (colorPickerOpen && !cardColorControlRef.current?.contains(target)) setColorPickerOpen(false);
      if (avatarMenuOpen && !avatarMenuAnchorRef.current?.contains(target)) setAvatarMenuOpen(false);
      if (bannerMenuOpen && !bannerMenuAnchorRef.current?.contains(target)) setBannerMenuOpen(false);
      if (statusEditorOpen && !statusModalRef.current?.contains(target)) setStatusEditorOpen(false);
      if (appearancePicker && !appearanceModalRef.current?.contains(target)) setAppearancePicker(null);
      if (avatarCropUrl && !avatarCropModalRef.current?.contains(target)) closeAvatarCrop();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [colorPickerOpen, avatarMenuOpen, bannerMenuOpen, statusEditorOpen, appearancePicker, avatarCropUrl]);

  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const canSave = profile.isOwnProfile && displayName.trim().length >= 2 && !busy && !uploading && !deleting;
  const hasPickerChanges = appearancePicker === "avatarFrame" ? draftAvatarFrame !== avatarFrame
    : appearancePicker === "avatarDecoration" ? draftDecorationId !== avatarDecorationId
    : appearancePicker === "profileFrame" ? draftProfileFrameId !== profileFrameId
    : appearancePicker === "profileEffect" ? draftProfileEffectId !== profileEffectId
    : appearancePicker === "plate" ? draftPlate !== plateStyle : false;
  const hasUnsavedChanges = displayName !== (savedSnapshot.displayName ?? "")
    || pronouns !== (savedSnapshot.pronouns ?? "")
    || status !== (savedSnapshot.statusText ?? "")
    || about !== (savedSnapshot.about ?? "")
    || cardColor !== safeColor(savedSnapshot.cardColor)
    || plateStyle !== safePlate(savedSnapshot.plateStyle)
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
    setDraftPlate(plateStyle);
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

  function scrollToSection(section: EditorSection) {
    setActiveSection(section);
    setControlsOpen(true);
    setAvatarMenuOpen(false);
    setBannerMenuOpen(false);
    setColorPickerOpen(false);
    setAppearancePicker(null);
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
      className="ps-community-editor-v2"
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
                El editor ya está preparado. La persistencia completa de marcos, color y placas requiere aplicar la migración de apariencia comunitaria de esta rama en Supabase.
              </div>
            )}
          </div>
        )}

        <div className="ps-community-editor-workspace">
          <div className={"ps-community-editor-controls" + (controlsOpen ? " is-open" : "")} data-active-section={activeSection}>
            <div className="ps-community-editor-controls-heading">
              <div><span>PERFIL PRINCIPAL</span><strong>{NAV.find((item) => item.id === activeSection)?.label ?? "Personalización"}</strong></div>
              <button type="button" onClick={() => setControlsOpen(false)} aria-label="Cerrar opciones"><X size={17}/></button>
            </div>
            <nav className="ps-community-editor-nav ps-community-editor-nav-inline" aria-label="Opciones de personalización">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={"ps-community-editor-nav-item" + (activeSection === item.id ? " is-active" : "")}
                    onClick={() => scrollToSection(item.id)}
                    aria-current={activeSection === item.id ? "page" : undefined}
                    aria-pressed={activeSection === item.id}
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
            <section className="ps-community-editor-identification" aria-label="Placa de identificación">
              <div className="ps-community-editor-identification-title">Identificador de miembro</div>
              <div className="ps-community-editor-identification-row">
                <span className="ps-community-editor-identification-mark"><IdCard size={18}/></span>
                <span className="ps-community-editor-identification-value">{memberTag(profile.memberNumber)}</span>
                <button type="button" aria-label="Copiar identificador" title="Copiar identificador" onClick={() => void navigator.clipboard?.writeText(memberTag(profile.memberNumber))}>
                  <Plus size={17}/>
                </button>
              </div>
            </section>
            <section className="ps-community-editor-panel ps-community-editor-banner-panel" data-section="banner" ref={(node) => { sectionRefs.current.banner = node; }}>
              <div className="ps-community-editor-panel-heading">
                <div><span>PORTADA</span><h2>Color de cartel</h2><p>Personaliza el color del fondo de tu perfil.</p></div>
              </div>
              <div className="ps-community-editor-banner-color-preview" style={{ backgroundColor: cardColor }}>
                
              </div>
              <div className="ps-community-card-color-control" ref={cardColorControlRef}>
                <button type="button" className="ps-community-card-color-trigger" style={{ "--selected-card-color": cardColor } as CSSProperties}
                  onClick={() => setColorPickerOpen((open) => !open)} aria-expanded={colorPickerOpen} aria-label="Cambiar color del cartel">
                  <span/><strong>{cardColor.toUpperCase()}</strong><ChevronRight size={15}/>
                </button>
                {colorPickerOpen && (
                  <div className="ps-community-color-picker" role="dialog" aria-label="Selector de color del cartel">
                    <div className="ps-community-color-picker-plane" style={{ backgroundColor: "hsl(" + cardHue + " 100% 50%)" }}
                      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateCardColorFromPlane(event); }}
                      onPointerMove={(event) => { if (event.buttons === 1) updateCardColorFromPlane(event); }}>
                      <span className="ps-community-color-picker-cursor" style={{ left: (hexToHsv(cardColor).s * 100) + "%", top: ((1 - hexToHsv(cardColor).v) * 100) + "%" }}/>
                    </div>
                    <label className="ps-community-color-picker-hue-wrap" aria-label="Espectro de tonos">
                      <input className="ps-community-color-picker-hue" aria-label="Tono de color" type="range" min="0" max="360" value={cardHue} onChange={(event) => updateCardHue(Number(event.target.value))}/>
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
              <div className="ps-community-editor-accent-caption"><span>Color de cartel</span><code>{cardColor.toUpperCase()}</code></div>
            </section>

            <div className="ps-community-editor-split" data-section-group="avatar-cosmetics">
              <section data-section="avatar" className="ps-community-editor-panel ps-community-editor-avatar-panel" ref={(node) => { sectionRefs.current.avatar = node; }}>
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
                    <small>Sube tu foto · PNG, JPG, WebP o GIF · Máx. 5 MB</small>
                    <div className="ps-community-editor-upload-actions">
                      <button type="button" onClick={() => avatarInput.current?.click()}>
                        <Camera size={14}/> Cambiar avatar
                      </button>
                      <button type="button" onClick={() => openAppearancePicker("avatarDecoration")}>
                        <Orbit size={14}/> Decoración
                      </button>
                      {profile.avatarUrl && (
                        <button type="button" className="is-danger" onClick={() => void removeAsset("avatar")} disabled={Boolean(deleting) || busy}>
                          <Trash2 size={14}/> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ps-community-editor-avatar-decoration-row">
                  <span className={"ps-community-editor-choice-frame frame-" + avatarFrame}><Frame size={18}/></span>
                  <div className="ps-community-editor-choice-copy">
                    <strong>{FRAMES.find((item) => item.id === avatarFrame)?.label ?? "Ninguno"}</strong>
                    <small>Marco que rodea únicamente tu avatar</small>
                  </div>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("avatarFrame")}>
                    Marco <ChevronRight size={14}/>
                  </button>
                </div>
                <div className="ps-community-editor-avatar-decoration-row">
                  <div className={"ps-community-editor-avatar-decoration-sample is-decoration-" + avatarDecorationId}>
                    <span className="ps-community-editor-decoration-avatar">
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="40px"/> : initials(displayName || "PeakScore")}
                    </span>
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

              <section data-section="frames" className="ps-community-editor-panel ps-community-editor-frames-panel" ref={(node) => { sectionRefs.current.frames = node; }}>
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

              <section data-section="effects" className="ps-community-editor-panel" ref={(node) => { sectionRefs.current.effects = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>04 / ANIMACIÓN</span><h2>Efectos de perfil</h2><p>Movimiento sutil detrás de tu identidad.</p></div>
                </div>
                <div className={"ps-community-editor-choice-row is-profile-effect-" + profileEffectId}>
                  <span className={"ps-community-editor-profile-effect-sample is-profile-effect-" + profileEffectId}><Activity size={19}/></span>
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

            <div className="ps-community-editor-split" data-section-group="member-plate">
              <section data-section="plate" className="ps-community-editor-panel" ref={(node) => { sectionRefs.current.plate = node; }}>
                <div className="ps-community-editor-panel-heading compact">
                  <div><span>04 / IDENTIDAD</span><h2>Diseño de nombre</h2><p>Fondo visual detrás de tu nombre en la comunidad.</p></div>
                </div>
                <div className="ps-community-editor-member-row-preview">
                  <span className="ps-community-editor-member-row-avatar">
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="38px"/>
                      : initials(displayName || "PeakScore")}
                  </span>
                  <span className="ps-community-editor-member-row-copy">
                    <strong className={"ps-community-editor-member-row-name is-plate-" + plateStyle}>{displayName || "Tu nombre"}</strong>
                    <small>{profile.roles[0]?.label ?? "Miembro"} · {PLATES.find((plate) => plate.id === plateStyle)?.label}</small>
                  </span>
                  <button type="button" className="ps-community-editor-choice-action" onClick={() => openAppearancePicker("plate")}>
                    Cambiar <ChevronRight size={14}/>
                  </button>
                </div>
              </section>

              
            </div>

            <section data-section="profile" className="ps-community-editor-panel ps-community-editor-profile-fields" ref={(node) => { sectionRefs.current.profile = node; }}>
              <div className="ps-community-editor-panel-heading compact">
                <div><span>PERFIL / INFORMACIÓN</span><h2>Información del perfil</h2><p>Nombre, estado y descripción que verá la comunidad.</p></div>
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
                  <button type="button" className="ps-community-editor-status-trigger" onClick={openStatusEditor}>
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
            <div className="ps-community-editor-preview-frame">
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle + " is-profile-frame-" + profileFrameId + " is-profile-effect-" + profileEffectId} style={{ "--editor-accent": accentColor, "--editor-card": cardColor } as CSSProperties}>
                <div className="ps-community-editor-banner-anchor" ref={bannerMenuAnchorRef}>
                  <div className="ps-community-editor-preview-banner" ref={(node) => { sectionRefs.current.banner = node; }} style={{ backgroundColor: cardColor }}>
                    <div className="ps-community-editor-preview-banner-shade" aria-hidden="true"/>
                    <div className="ps-community-editor-preview-banner-empty" aria-hidden="true"/>
                    <div className="ps-community-editor-live-banner-actions">
                      <button type="button" onClick={() => setBannerMenuOpen((open) => !open)} aria-expanded={bannerMenuOpen} aria-label="Opciones del cartel">
                        <Pencil size={16}/>
                      </button>
                    </div>
                  </div>
                  {bannerMenuOpen && (
                    <div className="ps-community-editor-banner-menu" role="menu" aria-label="Opciones del perfil">
                      <button type="button" role="menuitem" onClick={() => { setBannerMenuOpen(false); openAppearancePicker("profileEffect"); }}>
                        <Activity size={15}/> Cambiar efecto de perfil
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setBannerMenuOpen(false); openAppearancePicker("profileFrame"); }}>
                        <PanelsTopLeft size={15}/> Cambiar marco de perfil
                      </button>
                    </div>
                  )}
                </div>
                <div className="ps-community-editor-preview-body">
                  <div className="ps-community-editor-preview-avatar-row">
                    <div className="ps-community-editor-preview-avatar-anchor" ref={avatarMenuAnchorRef}>
                      <button type="button" className="ps-community-editor-preview-avatar-trigger" onClick={() => setAvatarMenuOpen((open) => !open)} aria-expanded={avatarMenuOpen} aria-label="Cambiar avatar o decoración">
                        <span className={"ps-community-editor-preview-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                          {profile.avatarUrl
                            ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="96px"/>
                            : <span>{initials(displayName || "PeakScore")}</span>}
                        </span>
                      </button>
                      {avatarMenuOpen && (
                        <div className="ps-community-editor-avatar-menu ps-community-editor-avatar-menu-preview" role="menu" aria-label="Opciones del avatar">
                          <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); avatarInput.current?.click(); }}>
                            <Camera size={15}/> Cambiar avatar
                          </button>
                          <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); openAppearancePicker("avatarDecoration"); }}>
                            <Orbit size={15}/> Cambiar decoración de avatar
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
                      <span className="ps-community-note-bubble-text">{status || "Añadir estado"}</span>
                      <Pencil size={11} className="ps-community-note-bubble-edit" aria-hidden="true"/>
                    </button>
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

          </aside>

          <aside className="ps-community-editor-community-column" aria-label="Información pública del perfil">
            <section className="ps-community-editor-social-overview" aria-label="Resumen público">
              <div className="ps-community-editor-social-overview-heading">
                <span>PEAKSCORE / COMUNIDAD</span>
                <h2>Tu identidad en la comunidad</h2>
                <p>Así se presenta tu perfil a las demás personas de PeakScore.</p>
              </div>
              <article className="ps-community-editor-social-identity">
                <div className="ps-community-editor-social-avatar">
                  {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="52px"/> : initials(displayName || "PeakScore")}
                </div>
                <div>
                  <strong>{displayName || "Tu nombre"}</strong>
                  <small>{pronouns || "Pronombres sin configurar"}</small>
                  <span>{memberTag(profile.memberNumber)}</span>
                </div>
              </article>
              <article className="ps-community-editor-social-card">
                <div className="ps-community-editor-social-card-heading"><strong>Estado</strong><span>{status ? "VISIBLE" : "SIN ESTADO"}</span></div>
                <p>{status || "Añade un estado desde la burbuja junto a tu avatar para contar qué estás haciendo."}</p>
              </article>
              <article className="ps-community-editor-social-card">
                <div className="ps-community-editor-social-card-heading"><strong>Sobre mí</strong><span>{about.length}/280</span></div>
                <p>{about || "Tu descripción aparecerá aquí cuando la completes."}</p>
              </article>
              <article className="ps-community-editor-social-card">
                <div className="ps-community-editor-social-card-heading"><strong>Roles de comunidad</strong><span>{profile.roles.length}</span></div>
                {profile.roles.length ? (
                  <div className="ps-community-editor-social-roles">
                    {profile.roles.map((role) => (
                      <span key={role.roleKey} style={{ "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : accentColor } as CSSProperties}>{role.label}</span>
                    ))}
                  </div>
                ) : <p>Aún no tienes roles públicos asignados.</p>}
              </article>
              <article className="ps-community-editor-social-card ps-community-editor-social-meta">
                <div><span>MIEMBRO DESDE</span><strong>{joinedLabel}</strong></div>
                <div><span>IDENTIFICADOR</span><strong>{memberTag(profile.memberNumber)}</strong></div>
              </article>
              <div className="ps-community-editor-social-footnote">
                <span>PERSONALIZACIÓN</span>
                <p>Avatar, marcos, efectos y diseño de nombre se configuran desde las secciones de la izquierda. Cada pieza visual tendrá su propio selector y vista previa.</p>
              </div>
            </section>
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
                    : "Cambiar diseño de nombre"}
                </h2>
                <p>
                  {appearancePicker === "avatarFrame" ? "Elige el contorno que rodea tu imagen de perfil."
                    : appearancePicker === "avatarDecoration" ? "Elige el detalle animado que acompaña tu avatar."
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
                    {appearancePicker === "avatarFrame" ? "Marcos de avatar"
                      : appearancePicker === "avatarDecoration" ? "Decoraciones de avatar"
                      : appearancePicker === "profileFrame" ? "Marcos de perfil"
                      : appearancePicker === "profileEffect" ? "Efectos animados"
                      : "Diseños de nombre"}
                  </strong>
                  <span>Prototipos visuales · arte final pendiente</span>
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
                        onClick={() => setDraftProfileFrameId(item.id)} aria-pressed={draftProfileFrameId === item.id}>
                        <span className={"ps-community-picker-profile-frame is-profile-frame-" + item.id} aria-hidden="true"><i/><i/><i/></span>
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
                        onClick={() => setDraftProfileEffectId(item.id)} aria-pressed={draftProfileEffectId === item.id}>
                        <span className={"ps-community-picker-profile-effect is-profile-effect-" + item.id} aria-hidden="true"><i/><i/><i/></span>
                        <strong>{item.label}</strong><small>{item.description}</small>
                        {draftProfileEffectId === item.id && <i><Check size={12}/></i>}
                        <em>{profileEffectId === item.id ? "EQUIPADO" : draftProfileEffectId === item.id ? "SELECCIONADO" : ""}</em>
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
                            <strong className={"ps-community-picker-member-name is-plate-" + item.id}>{displayName || "Tu nombre"}</strong>
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
                        <strong className={"ps-community-picker-member-name is-plate-" + draftPlate}>{displayName || "Tu nombre"}</strong>
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
                      : PLATES.find((item) => item.id === draftPlate)?.label}
                  </strong>
                  <p>
                    {appearancePicker === "avatarFrame" ? FRAMES.find((item) => item.id === draftAvatarFrame)?.description
                      : appearancePicker === "avatarDecoration" ? AVATAR_DECORATIONS.find((item) => item.id === draftDecorationId)?.description
                      : appearancePicker === "profileFrame" ? PROFILE_FRAMES.find((item) => item.id === draftProfileFrameId)?.description
                      : appearancePicker === "profileEffect" ? PROFILE_EFFECTS.find((item) => item.id === draftProfileEffectId)?.description
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
