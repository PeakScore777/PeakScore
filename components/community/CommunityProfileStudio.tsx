"use client";

import Image from "next/image";
import DecryptedDisplayName from "@/components/community/DecryptedDisplayName";
import SignalBreakDisplayName from "@/components/community/SignalBreakDisplayName";
import FuzzyText from "@/components/community/FuzzyText";
import ShuffleDisplayName from "@/components/community/ShuffleDisplayName";
import { DEFAULT_FUZZY_TEXT_SETTINGS, normalizeFuzzyTextSettings, resolveFuzzyTextAppearance, type FuzzyTextSettings } from "@/components/community/fuzzy-text-settings";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  Camera, Check, Copy, ImagePlus, Pencil, Pipette,
  LoaderCircle, Plus, PlusCircle, Save, Smile, Trash2, Type, X,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type DisplayNameStyle = "classic" | "tempo" | "sakura" | "jellybean" | "modern" | "medieval" | "8bit" | "vampyre" | "monkey-bars" | "mainframe" | "headbang" | "journal" | "display" | "editorial" | "elegant" | "geometric" | "retro" | "handwritten" | "signature" | "techno" | "rounded" | "stencil";
type DisplayNameEffect = "plain" | "gradient" | "neon" | "toon" | "pop" | "gummy" | "prism";
type DisplayNameAnimation = "decrypt" | "signal-break" | "fuzzy-text" | "shuffle-blur" | "shuffle-flip" | "shuffle";
type DisplayNameColor = "default" | "pink" | "green" | "blue" | "purple" | "magenta" | "red" | "gold" | "custom-gradient";
type AvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type PickerKind = "avatarFrame" | "avatarDecoration" | "profileFrame" | "profileEffect" | "plate" | "nameStyle";
type AvatarDecorationId = "none" | "bloom" | "electric" | "glitch";
type ProfileFrameId = "none" | "obsidian" | "lunar" | "crimson" | "aurora";
type ProfileEffectId = "none" | "aurora" | "embers" | "starlight" | "scanline";
type StatusDuration = "30m" | "1h" | "4h" | "1d" | "1w" | "never";

type CommunityIdentity = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  themeColorSecondary?: string;
  plateStyle?: PlateStyle;
  displayNameStyle?: DisplayNameStyle;
  displayNameEffect?: DisplayNameEffect;
  displayNameAnimation?: DisplayNameAnimation;
  displayNameFuzzySettings?: FuzzyTextSettings;
  displayNameColor?: DisplayNameColor;
  displayNameGradientStart?: string;
  displayNameGradientEnd?: string;
  displayNamePrismColors?: string[];
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

const STATUS_EMOJI_CATEGORIES = ["Todos", "Frecuentes", "Caritas", "Gestos", "Naturaleza", "Objetos", "Símbolos"] as const;
const STATUS_EMOJI_ITEMS: { emoji: string; name: string; category: typeof STATUS_EMOJI_CATEGORIES[number] }[] = [
  { emoji: "😀", name: "cara feliz sonrisa", category: "Caritas" }, { emoji: "😃", name: "cara sonrisa", category: "Caritas" },
  { emoji: "😄", name: "risa feliz", category: "Caritas" }, { emoji: "😁", name: "sonrisa dientes", category: "Caritas" },
  { emoji: "😆", name: "reir", category: "Caritas" }, { emoji: "😅", name: "sudor risa", category: "Caritas" },
  { emoji: "😂", name: "llorar risa", category: "Frecuentes" }, { emoji: "🤣", name: "rodar risa", category: "Caritas" },
  { emoji: "🥹", name: "emocionado lagrimas", category: "Caritas" }, { emoji: "😊", name: "sonrojado", category: "Caritas" },
  { emoji: "😍", name: "enamorado ojos corazon", category: "Frecuentes" }, { emoji: "🥰", name: "amor corazones", category: "Caritas" },
  { emoji: "😘", name: "beso", category: "Caritas" }, { emoji: "😎", name: "genial gafas", category: "Frecuentes" },
  { emoji: "🤔", name: "pensando", category: "Frecuentes" }, { emoji: "🙄", name: "ojos arriba", category: "Caritas" },
  { emoji: "🥳", name: "fiesta celebracion", category: "Frecuentes" }, { emoji: "😭", name: "llorar", category: "Frecuentes" },
  { emoji: "😴", name: "dormido sueño", category: "Caritas" }, { emoji: "😡", name: "enojado", category: "Caritas" },
  { emoji: "💀", name: "calavera", category: "Frecuentes" }, { emoji: "🤯", name: "explosion cabeza", category: "Caritas" },
  { emoji: "🥶", name: "frio", category: "Caritas" }, { emoji: "🤩", name: "estrellas", category: "Caritas" },
  { emoji: "👋", name: "saludo mano", category: "Gestos" }, { emoji: "🙌", name: "celebrar manos", category: "Frecuentes" },
  { emoji: "👏", name: "aplausos", category: "Gestos" }, { emoji: "👍", name: "pulgar arriba", category: "Gestos" },
  { emoji: "👎", name: "pulgar abajo", category: "Gestos" }, { emoji: "🤝", name: "acuerdo manos", category: "Gestos" },
  { emoji: "🙏", name: "gracias por favor", category: "Gestos" }, { emoji: "💪", name: "fuerza", category: "Gestos" },
  { emoji: "🫡", name: "saludo militar", category: "Gestos" }, { emoji: "🫶", name: "corazon manos", category: "Gestos" },
  { emoji: "❤️", name: "corazon rojo amor", category: "Frecuentes" }, { emoji: "💚", name: "corazon verde", category: "Gestos" },
  { emoji: "💙", name: "corazon azul", category: "Gestos" }, { emoji: "💜", name: "corazon morado", category: "Gestos" },
  { emoji: "🔥", name: "fuego caliente", category: "Frecuentes" }, { emoji: "✨", name: "brillos estrellas", category: "Frecuentes" },
  { emoji: "⭐", name: "estrella", category: "Símbolos" }, { emoji: "⚡", name: "rayo energia", category: "Frecuentes" },
  { emoji: "🌈", name: "arcoiris", category: "Naturaleza" }, { emoji: "☀️", name: "sol", category: "Naturaleza" },
  { emoji: "🌙", name: "luna noche", category: "Frecuentes" }, { emoji: "🌧️", name: "lluvia", category: "Naturaleza" },
  { emoji: "🌸", name: "flor cerezo", category: "Naturaleza" }, { emoji: "🌻", name: "girasol", category: "Naturaleza" },
  { emoji: "🍀", name: "trébol suerte", category: "Naturaleza" }, { emoji: "🌊", name: "ola mar", category: "Naturaleza" },
  { emoji: "☕", name: "cafe", category: "Frecuentes" }, { emoji: "🍕", name: "pizza", category: "Objetos" },
  { emoji: "🍔", name: "hamburguesa", category: "Objetos" }, { emoji: "🎂", name: "cumpleaños pastel", category: "Objetos" },
  { emoji: "🎮", name: "videojuego mando", category: "Frecuentes" }, { emoji: "🎧", name: "audifonos musica", category: "Frecuentes" },
  { emoji: "🎵", name: "nota musica", category: "Objetos" }, { emoji: "🎬", name: "cine pelicula", category: "Objetos" },
  { emoji: "📚", name: "libros estudiar", category: "Objetos" }, { emoji: "💻", name: "computador", category: "Objetos" },
  { emoji: "📱", name: "telefono", category: "Objetos" }, { emoji: "🚀", name: "cohete espacio", category: "Frecuentes" },
  { emoji: "🏆", name: "trofeo premio", category: "Objetos" }, { emoji: "🎯", name: "objetivo diana", category: "Objetos" },
  { emoji: "👀", name: "ojos mirar", category: "Frecuentes" }, { emoji: "💯", name: "cien perfecto", category: "Frecuentes" },
  { emoji: "💤", name: "dormir", category: "Símbolos" }, { emoji: "❗", name: "exclamacion", category: "Símbolos" },
  { emoji: "❓", name: "pregunta", category: "Símbolos" }, { emoji: "✅", name: "correcto check", category: "Símbolos" },
  { emoji: "❌", name: "incorrecto equis", category: "Símbolos" }, { emoji: "🔔", name: "campana", category: "Objetos" },
  { emoji: "🎉", name: "fiesta confeti", category: "Objetos" }, { emoji: "💎", name: "diamante", category: "Objetos" },
];

const DISPLAY_NAME_STYLES: { id: DisplayNameStyle; label: string; sample: string; description: string }[] = [
  { id: "classic", label: "gg sans", sample: "Aa", description: "Sans limpia y equilibrada" },
  { id: "tempo", label: "Tempo", sample: "Aa", description: "Serif contemporánea con carácter" },
  { id: "sakura", label: "Sakura", sample: "Aa", description: "Display expresiva y juguetona" },
  { id: "jellybean", label: "Jellybean", sample: "Aa", description: "Redondeada y contundente" },
  { id: "modern", label: "Modern", sample: "Aa", description: "Geométrica y contemporánea" },
  { id: "medieval", label: "Medieval", sample: "Aa", description: "Blackletter ornamental" },
  { id: "8bit", label: "8Bit", sample: "Aa", description: "Pixel art de videojuego" },
  { id: "vampyre", label: "Vampyre", sample: "Aa", description: "Horror tipográfico" },
  { id: "monkey-bars", label: "Monkey Bars", sample: "Aa", description: "Manuscrita espontánea" },
  { id: "mainframe", label: "Mainframe", sample: "Aa", description: "Tecnológica y monoespaciada" },
  { id: "headbang", label: "Headbang", sample: "Aa", description: "Rock pesado y angular" },
  { id: "journal", label: "Journal", sample: "Aa", description: "Caligrafía cercana" },
  { id: "display", label: "Display", sample: "Aa", description: "Condensada de alto impacto" },
  { id: "editorial", label: "Editorial", sample: "Aa", description: "Serif de revista" },
  { id: "elegant", label: "Elegante", sample: "Aa", description: "Contraste fino y sofisticado" },
  { id: "geometric", label: "Geométrica", sample: "Aa", description: "Minimalista y precisa" },
  { id: "retro", label: "Retro", sample: "Aa", description: "Volumen arcade vintage" },
  { id: "handwritten", label: "Marker", sample: "Aa", description: "Trazo manual con energía" },
  { id: "signature", label: "Firma", sample: "Aa", description: "Cursiva fluida" },
  { id: "techno", label: "Techno", sample: "Aa", description: "Futurista de formas circulares" },
  { id: "rounded", label: "Rounded", sample: "Aa", description: "Display redondeada y sólida" },
  { id: "stencil", label: "Stencil", sample: "Aa", description: "Corte industrial" },
];
const DISPLAY_NAME_EFFECTS: { id: DisplayNameEffect; label: string; description: string }[] = [
  { id: "plain", label: "Tinta", description: "Acabado editorial limpio, con contraste y peso tipográfico" },
  { id: "gradient", label: "Aurora", description: "Luz cromática que atraviesa el nombre en un ciclo continuo" },
  { id: "neon", label: "Neón", description: "Halo de luz con respiración y núcleo brillante" },
  { id: "toon", label: "Cromo", description: "Letras con volumen, borde pulido y reflejo móvil" },
  { id: "pop", label: "Rebote", description: "Movimiento elástico muy sutil con sombra dimensional" },
  { id: "gummy", label: "Gloss", description: "Superficie translúcida con brillo líquido en movimiento" },
  { id: "prism", label: "Prisma", description: "Iridescencia multicolor con refracción lenta" },
];
const DISPLAY_NAME_ANIMATIONS: { id: DisplayNameAnimation; label: string; description: string; hint: string }[] = [
  { id: "decrypt", label: "Hacking Decode", description: "Glifos hexadecimales cambian mientras el nombre se descifra carácter por carácter", hint: "Descifrado hexadecimal" },
  { id: "signal-break", label: "Signal Break", description: "Interferencias cromáticas breves que atraviesan el nombre con precisión", hint: "Interferencia cromática" },
  { id: "fuzzy-text", label: "Noise Reveal", description: "Ruido orgánico animado que revela el nombre con una textura digital controlada", hint: "Ruido digital en movimiento" },
  { id: "shuffle-blur", label: "Blur Cascade", description: "Caracteres que ascienden entre dígitos y símbolos con desenfoque progresivo", hint: "Blur · vertical · 1,5 s" },
  { id: "shuffle-flip", label: "Flip Roll", description: "Caracteres alfabéticos que giran en cascada hacia abajo", hint: "Flip · vertical · 1,1 s" },
  { id: "shuffle", label: "Classic Slide", description: "Deslizamiento horizontal alternado, limpio y preciso", hint: "Slide · derecha · 0,35 s" },
];
const DISPLAY_NAME_COLORS: { id: DisplayNameColor; label: string; value: string }[] = [
  { id: "default", label: "Automático", value: "currentColor" },
  { id: "pink", label: "Rosa", value: "#F06AA8" },
  { id: "green", label: "Jade", value: "#55CFA3" },
  { id: "blue", label: "Zafiro", value: "#63A9F5" },
  { id: "purple", label: "Amatista", value: "#A88AF2" },
  { id: "magenta", label: "Fucsia", value: "#D96BCB" },
  { id: "red", label: "Granate", value: "#E46E79" },
  { id: "gold", label: "Champán", value: "#D8B875" },
  { id: "custom-gradient", label: "Personalizado", value: "linear-gradient(90deg,#B86BFF,#4E9BFF)" },
];
const DEFAULT_DISPLAY_NAME_PRISM_COLORS = ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"];
const DISPLAY_NAME_GRADIENT_PRESETS = [
  { id: "sunset", label: "Atardecer", start: "#FF8058", end: "#F44791" },
  { id: "ocean", label: "Océano", start: "#32D6D0", end: "#4476F5" },
  { id: "cosmic", label: "Cósmico", start: "#A65CFF", end: "#F06BCA" },
  { id: "citrus", label: "Cítrico", start: "#F5D64E", end: "#4DD99A" },
  { id: "ember", label: "Brasas", start: "#FFB347", end: "#ED3E61" },
  { id: "ice", label: "Glaciar", start: "#8DE7F2", end: "#727BFF" },
  { id: "rose", label: "Rosa", start: "#FF8DBA", end: "#A775F5" },
];
const DISPLAY_NAME_SPECTRUM_PRESETS = [
  { id: "candy", label: "Caramelo", colors: ["#FF9CCB", "#FFD0A7", "#FFF0A6", "#9DE8D3", "#9FC8FF"] },
  { id: "electric", label: "Eléctrico", colors: ["#FF8D38", "#FFE34D", "#55E58B", "#39B8F4", "#B15CFF"] },
  { id: "berry", label: "Frutos rojos", colors: ["#F66CA9", "#B56BFF", "#6B83FF", "#F08ACB", "#FFB6D8"] },
  { id: "pastel", label: "Pastel", colors: ["#FFC8DE", "#F5C8FF", "#D3C9FF", "#B9E7FF", "#BFF4DC"] },
  { id: "tropical", label: "Tropical", colors: ["#FFAB53", "#F7E55A", "#55DF9A", "#42CBE0", "#A77BFA"] },
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
const DEFAULT_CARD = "#B7D7C3";
const DEFAULT_THEME_SECONDARY = "#8FB9A6";

function safeColor(value?: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_CARD;
}
function themeLuminance(hex: string) {
  const clean = safeColor(hex).slice(1);
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function readableThemeText(hex: string) {
  return themeLuminance(hex) > 0.179 ? '#202126' : '#F7F8FA';
}
function blendThemeColors(first: string, second: string, amount = 0.5) {
  const a = safeColor(first).slice(1);
  const b = safeColor(second).slice(1);
  const channels = [0, 2, 4].map((index) => {
    const av = parseInt(a.slice(index, index + 2), 16);
    const bv = parseInt(b.slice(index, index + 2), 16);
    return Math.round(av * (1 - amount) + bv * amount).toString(16).padStart(2, '0');
  });
  return '#' + channels.join('');
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
  return DISPLAY_NAME_STYLES.some((item) => item.id === value) ? value as DisplayNameStyle : "classic";
}
function safeDisplayNameEffect(value?: string): DisplayNameEffect {
  return DISPLAY_NAME_EFFECTS.some((item) => item.id === value) ? value as DisplayNameEffect : "plain";
}
function safeDisplayNameAnimation(value?: string): DisplayNameAnimation {
  return DISPLAY_NAME_ANIMATIONS.some((item) => item.id === value) ? value as DisplayNameAnimation : "decrypt";
}
function safeDisplayNameColor(value?: string): DisplayNameColor {
  return DISPLAY_NAME_COLORS.some((item) => item.id === value) ? value as DisplayNameColor : "default";
}
function safeDisplayNamePrismColors(value?: string[] | null): string[] {
  return Array.isArray(value) && value.length === 5 && value.every((color) => /^#[0-9a-f]{6}$/i.test(color))
    ? value.map((color) => color.toUpperCase())
    : [...DEFAULT_DISPLAY_NAME_PRISM_COLORS];
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

function displayNameCharacters(value: string) {
  const IntlWithSegmenter = Intl as unknown as {
    Segmenter?: new (locale?: string, options?: { granularity: "grapheme" }) => {
      segment: (input: string) => Iterable<{ segment: string }>;
    };
  };
  if (IntlWithSegmenter.Segmenter) {
    return Array.from(new IntlWithSegmenter.Segmenter(undefined, { granularity: "grapheme" }).segment(value), (part) => part.segment);
  }
  return Array.from(value);
}

function displayNameCharacterDelay(index: number, count: number, animation: DisplayNameAnimation) {
  if (count <= 1) return "0ms";
  const staggerWindow = animation === "decrypt" ? 300 : 460;
  const stepCap = 56;
  const step = Math.min(stepCap, staggerWindow / Math.max(1, count - 1));
  return Math.round(index * step) + "ms";
}

function AnimatedDisplayName({ value, animation, fuzzySettings = DEFAULT_FUZZY_TEXT_SETTINGS, className = "", style, tag = "strong", previewMode = false }: {
  value: string;
  animation: DisplayNameAnimation;
  fuzzySettings?: FuzzyTextSettings;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  previewMode?: boolean;
}) {
  const Tag = tag;
  const characters = displayNameCharacters(value);
  const fitScale = Math.max(0.72, 1 - Math.max(0, characters.length - 18) * 0.008);
  const tagFontSize = tag === "h2" ? (fitScale * 1.5).toFixed(3) + "em"
    : tag === "h3" ? (fitScale * 1.17).toFixed(3) + "em"
    : tag === "span" ? undefined : (fitScale * 1).toFixed(3) + "em";
  const safeStyle = { ...style, ...(tagFontSize ? { fontSize: tagFontSize } : {}), maxWidth: "100%" } as CSSProperties;
  const fuzzyAppearance = resolveFuzzyTextAppearance(className, style as Record<string, unknown> | undefined);
  if (animation === "shuffle-blur") {
    return <ShuffleDisplayName
      text={value}
      effect="blur"
      shuffleDirection="up"
      duration={1.65}
      animationMode="sequence"
      shuffleTimes={14}
      scrambleCharset="0123456789#%&*+-=?"
      ease="expo.out"
      stagger={0.06}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={className}
      style={safeStyle}
    />;
  }
  if (animation === "shuffle-flip") {
    return <ShuffleDisplayName
      text={value}
      effect="flip"
      shuffleDirection="down"
      duration={1.2}
      animationMode="sequence"
      shuffleTimes={7}
      ease="power2.out"
      stagger={0.07}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={className}
      style={safeStyle}
    />;
  }
  if (animation === "shuffle") {
    return <ShuffleDisplayName
      text={value}
      effect="slide"
      shuffleDirection="right"
      duration={0.6}
      animationMode="evenodd"
      shuffleTimes={1}
      ease="power3.out"
      stagger={0.05}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={className}
      style={safeStyle}
    />;
  }
  if (animation === "decrypt") {
    const isGalleryDemo = className.includes("ps-name-motion-demo");
    return <DecryptedDisplayName
      text={value}
      tag={tag}
      className={className}
      style={safeStyle}
      speed={previewMode ? 50 : 40}
      maxIterations={10}
      durationMs={previewMode ? 1800 : 2400}
      sequential
      revealDirection="random"
      characters="0123456789ABCDEF"
      scrambleColor="#2bb673"
      animateOn={isGalleryDemo ? "mount" : "view"}
      loop={isGalleryDemo}
      loopDelay={1700}
    />;
  }
  if (animation === "fuzzy-text") {
    return (
      <Tag className={className + ' ps-fuzzy-text-wrap'} style={safeStyle}>
        <span className="ps-fuzzy-text-layout" aria-hidden="true">{value}</span>
        <FuzzyText
          colorSplit={fuzzySettings.colorSplit}
          trigger="always"
          direction={fuzzySettings.direction}
          fontSize="1em"
          fontWeight="inherit"
          fontFamily="inherit"
          color={fuzzyAppearance.color}
          gradient={fuzzyAppearance.gradient}
          baseIntensity={fuzzySettings.baseIntensity}
          hoverIntensity={fuzzySettings.hoverIntensity}
          fuzzRange={fuzzySettings.fuzzRange}
          sliceSize={fuzzySettings.sliceSize}
          fps={fuzzySettings.fps}
          transitionDuration={fuzzySettings.transitionDuration}
          intro={fuzzySettings.intro}
          introDuration={fuzzySettings.introDuration}
          letterSpacing={fuzzySettings.letterSpacing}
          enableHover={fuzzySettings.enableHover}
          clickEffect={fuzzySettings.clickEffect}
          glitchMode={fuzzySettings.glitchMode}
          glitchInterval={fuzzySettings.glitchInterval}
          glitchDuration={fuzzySettings.glitchDuration}
          performanceMode={previewMode ? "preview" : "full"}
          className="ps-fuzzy-text-canvas"
        >
          {value}
        </FuzzyText>
      </Tag>
    );
  }
  if (animation === "signal-break") {
    return <SignalBreakDisplayName
      text={value}
      tag={tag}
      className={className}
      style={safeStyle}
      mode="slices"
      speed={0.72}
      fontWeight={900}
      enableShadows
      offset={4}
      shadowColors={["#ff5368", "#43d9ee"]}
      intensity={0.22}
      skew={0.18}
      flicker={false}
      trigger="always"
      burstDuration={0.34}
      frameRate={previewMode ? 24 : 30}
    />;
  }
    if (animation === "none") return <Tag className={className} style={safeStyle}>{value}</Tag>;
  return <Tag className={className + " name-enter-" + animation} style={safeStyle} aria-label={value}>
    <span className="ps-name-animation-text" aria-hidden="true">{characters.map((character, index) => (
      <span className="ps-name-animation-char" style={{
        "--char-index": index,
        "--char-delay": displayNameCharacterDelay(index, characters.length, animation),
        "--char-direction": index % 2 === 0 ? "-1" : "1",
        "--char-rotation": (index % 2 === 0 ? -1 : 1) * (animation === "orbit" ? 34 : animation === "wave" ? 8 : 7) + "deg",
      } as CSSProperties} key={index}>{character === " " ? "\u00A0" : character}</span>
    ))}</span>
  </Tag>;
}

export default function CommunityProfileStudio({ userId, initialProfile, onClose, onSaved, isOnline }: Props) {
  const [portalReady, setPortalReady] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [savedSnapshot, setSavedSnapshot] = useState(initialProfile);
  const displayName = profile.displayName ?? initialProfile.displayName ?? "";
  const [pronouns, setPronouns] = useState(initialProfile.pronouns ?? "");
  const [status, setStatus] = useState(initialProfile.statusText ?? "");
  const [about, setAbout] = useState(initialProfile.about ?? "");
  const [aboutEditing, setAboutEditing] = useState(false);
  const [cardColor, setCardColor] = useState(safeColor(initialProfile.cardColor));
  const [themeColorSecondary, setThemeColorSecondary] = useState(safeColor(initialProfile.themeColorSecondary ?? DEFAULT_THEME_SECONDARY));
  const [cardColorDraft, setCardColorDraft] = useState(safeColor(initialProfile.cardColor).slice(1));
  const [cardHue, setCardHue] = useState(hexToHsv(safeColor(initialProfile.cardColor)).h);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [activeThemeStop, setActiveThemeStop] = useState<"top" | "bottom">("top");
  const activeThemeColor = activeThemeStop === "top" ? cardColor : themeColorSecondary;
  const [recentCardColors, setRecentCardColors] = useState<string[]>(["#F6C7D0", "#F4D7B5", "#C8DDF2", "#CDE8D5", "#D9CFF2", "#F5E7A8"]);
  const [plateStyle, setPlateStyle] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [displayNameStyle, setDisplayNameStyle] = useState<DisplayNameStyle>(safeDisplayNameStyle(initialProfile.displayNameStyle));
  const [displayNameEffect, setDisplayNameEffect] = useState<DisplayNameEffect>(safeDisplayNameEffect(initialProfile.displayNameEffect));
  const [displayNameAnimation, setDisplayNameAnimation] = useState<DisplayNameAnimation>(safeDisplayNameAnimation(initialProfile.displayNameAnimation));
  const [displayNameColor, setDisplayNameColor] = useState<DisplayNameColor>(safeDisplayNameColor(initialProfile.displayNameColor));
  const [displayNameGradientStart, setDisplayNameGradientStart] = useState(initialProfile.displayNameGradientStart ?? "#B86BFF");
  const [displayNameGradientEnd, setDisplayNameGradientEnd] = useState(initialProfile.displayNameGradientEnd ?? "#4E9BFF");
  const [draftDisplayNameGradientStart, setDraftDisplayNameGradientStart] = useState(initialProfile.displayNameGradientStart ?? "#B86BFF");
  const [draftDisplayNameGradientEnd, setDraftDisplayNameGradientEnd] = useState(initialProfile.displayNameGradientEnd ?? "#4E9BFF");
  const [displayNamePrismColors, setDisplayNamePrismColors] = useState<string[]>(safeDisplayNamePrismColors(initialProfile.displayNamePrismColors));
  const [draftDisplayNamePrismColors, setDraftDisplayNamePrismColors] = useState<string[]>(safeDisplayNamePrismColors(initialProfile.displayNamePrismColors));
  const [draftDisplayNameEffect, setDraftDisplayNameEffect] = useState<DisplayNameEffect>(safeDisplayNameEffect(initialProfile.displayNameEffect));
  const [draftDisplayNameAnimation, setDraftDisplayNameAnimation] = useState<DisplayNameAnimation>(safeDisplayNameAnimation(initialProfile.displayNameAnimation));
  const [displayNameFuzzySettings, setDisplayNameFuzzySettings] = useState<FuzzyTextSettings>(normalizeFuzzyTextSettings(initialProfile.displayNameFuzzySettings));
  const [draftDisplayNameFuzzySettings, setDraftDisplayNameFuzzySettings] = useState<FuzzyTextSettings>(normalizeFuzzyTextSettings(initialProfile.displayNameFuzzySettings));
  const [draftDisplayNameColor, setDraftDisplayNameColor] = useState<DisplayNameColor>(safeDisplayNameColor(initialProfile.displayNameColor));
  const accentColor = DEFAULT_ACCENT;
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [avatarDecorationId, setAvatarDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [profileFrameId, setProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [profileEffectId, setProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [statusExpiresAt, setStatusExpiresAt] = useState<string | null>(initialProfile.statusExpiresAt ?? null);
  const [statusDuration, setStatusDuration] = useState<StatusDuration>("never");
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState(initialProfile.statusText ?? "");
  const [statusEmojiOpen, setStatusEmojiOpen] = useState(false);
  const [statusEmojiSearch, setStatusEmojiSearch] = useState("");
  const [statusEmojiCategory, setStatusEmojiCategory] = useState<(typeof STATUS_EMOJI_CATEGORIES)[number]>("Todos");
  const [statusDurationOpen, setStatusDurationOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropUrl, setAvatarCropUrl] = useState<string | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropX, setAvatarCropX] = useState(50);
  const [avatarCropY, setAvatarCropY] = useState(50);
  const [appearancePicker, setAppearancePicker] = useState<PickerKind | null>(null);
  const [draftAvatarFrame, setDraftAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [draftDecorationId, setDraftDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [draftProfileFrameId, setDraftProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [draftProfileEffectId, setDraftProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [draftPlate, setDraftPlate] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [draftDisplayNameStyle, setDraftDisplayNameStyle] = useState<DisplayNameStyle>(safeDisplayNameStyle(initialProfile.displayNameStyle));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | null>(null);
  const [deleting, setDeleting] = useState<"avatar" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const aboutTextareaRef = useRef<HTMLTextAreaElement>(null);
  const pronounsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const cardColorControlRef = useRef<HTMLDivElement>(null);
  const avatarMenuAnchorRef = useRef<HTMLDivElement>(null);
  const appearanceModalRef = useRef<HTMLElement>(null);
  const statusModalRef = useRef<HTMLElement>(null);
  const statusEmojiFieldRef = useRef<HTMLLabelElement>(null);
  const statusDurationRef = useRef<HTMLDivElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const avatarCropModalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return () => {
      if (avatarCropUrl) URL.revokeObjectURL(avatarCropUrl);
    };
  }, [avatarCropUrl]);

  useLayoutEffect(() => {
    if (!aboutEditing) return;
    const field = aboutTextareaRef.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = Math.max(field.scrollHeight, 36) + "px";
  }, [aboutEditing, about]);

  useLayoutEffect(() => {
    const field = pronounsTextareaRef.current;
    if (!field) return;
    field.style.height = "0px";
    field.style.height = Math.max(field.scrollHeight, 26) + "px";
  }, [pronouns]);

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
      if (statusEmojiOpen && !statusEmojiFieldRef.current?.contains(target)) setStatusEmojiOpen(false);
      if (statusDurationOpen && !statusDurationRef.current?.contains(target)) setStatusDurationOpen(false);
      if (appearancePicker && !appearanceModalRef.current?.contains(target)) setAppearancePicker(null);
      if (avatarCropUrl && !avatarCropModalRef.current?.contains(target)) closeAvatarCrop();
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
  }, [colorPickerOpen, avatarMenuOpen, statusEditorOpen, statusEmojiOpen, statusDurationOpen, appearancePicker, avatarCropUrl]);

  const joinedAt = new Date(profile.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Fecha no disponible"
    : joinedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  const canSave = profile.isOwnProfile && !busy && !uploading && !deleting;
  const hasPickerChanges = appearancePicker === "avatarFrame" ? draftAvatarFrame !== avatarFrame
    : appearancePicker === "avatarDecoration" ? draftDecorationId !== avatarDecorationId
    : appearancePicker === "profileFrame" ? draftProfileFrameId !== profileFrameId
    : appearancePicker === "profileEffect" ? draftProfileEffectId !== profileEffectId
    : appearancePicker === "plate" ? draftPlate !== plateStyle
    : appearancePicker === "nameStyle" ? draftDisplayNameStyle !== displayNameStyle || draftDisplayNameEffect !== displayNameEffect || draftDisplayNameAnimation !== displayNameAnimation || JSON.stringify(draftDisplayNameFuzzySettings) !== JSON.stringify(displayNameFuzzySettings) || draftDisplayNameColor !== displayNameColor || draftDisplayNameGradientStart !== displayNameGradientStart || draftDisplayNameGradientEnd !== displayNameGradientEnd || JSON.stringify(draftDisplayNamePrismColors) !== JSON.stringify(displayNamePrismColors) : false;
  const hasUnsavedChanges = pronouns !== (savedSnapshot.pronouns ?? "")
    || status !== (savedSnapshot.statusText ?? "")
    || about !== (savedSnapshot.about ?? "")
    || cardColor !== safeColor(savedSnapshot.cardColor)
    || themeColorSecondary !== safeColor(savedSnapshot.themeColorSecondary ?? DEFAULT_THEME_SECONDARY)
    || plateStyle !== safePlate(savedSnapshot.plateStyle)
    || displayNameStyle !== safeDisplayNameStyle(savedSnapshot.displayNameStyle)
    || displayNameEffect !== safeDisplayNameEffect(savedSnapshot.displayNameEffect)
    || displayNameAnimation !== safeDisplayNameAnimation(savedSnapshot.displayNameAnimation)
    || JSON.stringify(displayNameFuzzySettings) !== JSON.stringify(normalizeFuzzyTextSettings(savedSnapshot.displayNameFuzzySettings))
    || displayNameColor !== safeDisplayNameColor(savedSnapshot.displayNameColor)
    || displayNameGradientStart !== (savedSnapshot.displayNameGradientStart ?? "#B86BFF")
    || displayNameGradientEnd !== (savedSnapshot.displayNameGradientEnd ?? "#4E9BFF")
    || JSON.stringify(displayNamePrismColors) !== JSON.stringify(safeDisplayNamePrismColors(savedSnapshot.displayNamePrismColors))
    || avatarFrame !== safeFrame(savedSnapshot.avatarFrame)
    || avatarDecorationId !== (savedSnapshot.avatarDecorationId ?? "none")
    || profileFrameId !== (savedSnapshot.profileFrameId ?? "none")
    || profileEffectId !== (savedSnapshot.profileEffectId ?? "none")
    || statusExpiresAt !== (savedSnapshot.statusExpiresAt ?? null);
  const previewStyle = {
    "--editor-accent": accentColor,
    "--editor-card": safeColor(cardColor),
    "--editor-theme-text": readableThemeText(cardColor),
    "--editor-theme-body-text": readableThemeText(blendThemeColors(cardColor, themeColorSecondary, 0.55)),
    "--editor-theme-bottom-text": readableThemeText(themeColorSecondary),
  } as CSSProperties;

  function updateCardColor(nextColor: string) {
    if (!/^#[0-9a-f]{6}$/i.test(nextColor)) return;
    const normalized = nextColor.toUpperCase();
    setCardColor(normalized);
    setCardColorDraft(normalized.slice(1));
    setCardHue(hexToHsv(normalized).h);
    setRecentCardColors((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 6));
  }

  function updateActiveThemeColor(nextColor: string) {
    if (!/^#[0-9a-f]{6}$/i.test(nextColor)) return;
    const normalized = nextColor.toUpperCase();
    if (activeThemeStop === "top") {
      updateCardColor(normalized);
      return;
    }
    setThemeColorSecondary(normalized);
    setCardColorDraft(normalized.slice(1));
    setCardHue(hexToHsv(normalized).h);
    setRecentCardColors((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 6));
  }

  function updateCardColorFromPlane(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const value = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    updateActiveThemeColor(hsvToHex(cardHue, saturation, value));
  }

  function updateCardHue(nextHue: number) {
    const hsv = hexToHsv(activeThemeColor);
    setCardHue(nextHue);
    updateActiveThemeColor(hsvToHex(nextHue, hsv.s, hsv.v));
  }

  function openThemeColorPicker(stop: "top" | "bottom") {
    setActiveThemeStop(stop);
    const color = stop === "top" ? cardColor : themeColorSecondary;
    setCardHue(hexToHsv(color).h);
    setCardColorDraft(color.slice(1));
    setColorPickerOpen(true);
  }

  function updateProfileHoverPreview(
    target: HTMLButtonElement,
    kind: "frame" | "effect",
    id: ProfileFrameId | ProfileEffectId,
    isHovering: boolean,
  ) {
    const preview = target
      .closest(".ps-community-picker-modal")
      ?.querySelector<HTMLElement>(".ps-community-picker-card-preview");
    if (!preview) return;
    const selectedId = kind === "frame" ? draftProfileFrameId : draftProfileEffectId;
    const previewId = isHovering ? id : selectedId;
    preview.className = "ps-community-picker-card-preview is-profile-" + kind + "-" + previewId + (isHovering ? " is-hover-preview" : "");
  }

  function openAppearancePicker(kind: PickerKind) {
    setDraftAvatarFrame(avatarFrame);
    setDraftDecorationId(avatarDecorationId);
    setDraftProfileFrameId(profileFrameId);
    setDraftProfileEffectId(profileEffectId);
    setDraftPlate(plateStyle);
    setDraftDisplayNameStyle(displayNameStyle);
    setDraftDisplayNameEffect(displayNameEffect);
    setDraftDisplayNameAnimation(displayNameAnimation);
    setDraftDisplayNameFuzzySettings(normalizeFuzzyTextSettings(displayNameFuzzySettings));
    setDraftDisplayNameColor(displayNameColor);
    setDraftDisplayNameGradientStart(displayNameGradientStart);
    setDraftDisplayNameGradientEnd(displayNameGradientEnd);
    setDraftDisplayNamePrismColors(displayNamePrismColors.slice());
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
    if (appearancePicker === "nameStyle") { setDisplayNameStyle(draftDisplayNameStyle); setDisplayNameEffect(draftDisplayNameEffect); setDisplayNameAnimation(draftDisplayNameAnimation); setDisplayNameFuzzySettings(draftDisplayNameFuzzySettings); setDisplayNameColor(draftDisplayNameColor); setDisplayNameGradientStart(draftDisplayNameGradientStart); setDisplayNameGradientEnd(draftDisplayNameGradientEnd); setDisplayNamePrismColors(draftDisplayNamePrismColors); }
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
    else if (remaining <= 30 * 60 * 60 * 1000) setStatusDuration("1d");
    else if (remaining <= 8 * 24 * 60 * 60 * 1000) setStatusDuration("1w");
    else setStatusDuration("never");
    setStatusEmojiOpen(false);
    setStatusDurationOpen(false);
    setStatusEditorOpen(true);
  }

  function applyStatusDraft() {
    setStatus(statusDraft.trim());
    const now = new Date();
    if (statusDuration === "30m") now.setMinutes(now.getMinutes() + 30);
    else if (statusDuration === "1h") now.setHours(now.getHours() + 1);
    else if (statusDuration === "4h") now.setHours(now.getHours() + 4);
    else if (statusDuration === "1d") now.setDate(now.getDate() + 1);
    else if (statusDuration === "1w") now.setDate(now.getDate() + 7);
    setStatusExpiresAt(statusDuration === "never" || !statusDraft.trim() ? null : now.toISOString());
    setStatusEmojiOpen(false);
    setStatusDurationOpen(false);
    setStatusEditorOpen(false);
  }

  function insertStatusEmoji(emoji: string) {
    const input = statusInputRef.current;
    const start = input?.selectionStart ?? statusDraft.length;
    const end = input?.selectionEnd ?? statusDraft.length;
    const next = (statusDraft.slice(0, start) + emoji + statusDraft.slice(end)).slice(0, 128);
    setStatusDraft(next);
    setStatusEmojiOpen(false);
    requestAnimationFrame(() => {
      const field = statusInputRef.current;
      if (!field) return;
      const cursor = Math.min(start + emoji.length, next.length);
      field.focus();
      field.setSelectionRange(cursor, cursor);
    });
  }

  function statusExpiryLabel(duration: StatusDuration, option = false) {
    const target = new Date();
    const clock = (date: Date) => date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false });
    if (duration === "30m") target.setMinutes(target.getMinutes() + 30);
    else if (duration === "1h") target.setHours(target.getHours() + 1);
    else if (duration === "4h") target.setHours(target.getHours() + 4);
    else if (duration === "1d") target.setDate(target.getDate() + 1);
    else if (duration === "1w") target.setDate(target.getDate() + 7);
    if (duration === "never") return option ? "No borrar" : "No borrar estado";
    const time = clock(target);
    if (duration === "30m") return option ? `30 minutos (${time})` : "Borrar en 30 minutos";
    if (duration === "1h") return option ? `1 hora (${time})` : "Borrar en 1 hora";
    if (duration === "4h") return option ? `4 horas (${time})` : "Borrar en 4 horas";
    if (duration === "1d") return option ? `24 horas (mañana a la(s) ${time})` : `Borrar mañana a la(s) ${time}`;
    return option ? `1 semana (${target.toLocaleDateString("es-CO", { day: "numeric", month: "short" })})` : "Borrar en 1 semana";
  }

  function discardChanges() {
    setPronouns(savedSnapshot.pronouns ?? "");
    setStatus(savedSnapshot.statusText ?? "");
    setStatusDraft(savedSnapshot.statusText ?? "");
    setStatusExpiresAt(savedSnapshot.statusExpiresAt ?? null);
    setAbout(savedSnapshot.about ?? "");
    setAboutEditing(false);
    updateCardColor(safeColor(savedSnapshot.cardColor));
    setThemeColorSecondary(safeColor(savedSnapshot.themeColorSecondary ?? DEFAULT_THEME_SECONDARY));
    setPlateStyle(safePlate(savedSnapshot.plateStyle));
    setDisplayNameStyle(safeDisplayNameStyle(savedSnapshot.displayNameStyle));
    setDisplayNameEffect(safeDisplayNameEffect(savedSnapshot.displayNameEffect));
    setDisplayNameAnimation(safeDisplayNameAnimation(savedSnapshot.displayNameAnimation));
    setDisplayNameFuzzySettings(normalizeFuzzyTextSettings(savedSnapshot.displayNameFuzzySettings));
    setDisplayNameColor(safeDisplayNameColor(savedSnapshot.displayNameColor));
    setDisplayNameGradientStart(savedSnapshot.displayNameGradientStart ?? "#B86BFF");
    setDisplayNameGradientEnd(savedSnapshot.displayNameGradientEnd ?? "#4E9BFF");
    setDisplayNamePrismColors(safeDisplayNamePrismColors(savedSnapshot.displayNamePrismColors));
    setAvatarFrame(safeFrame(savedSnapshot.avatarFrame));
    setAvatarDecorationId(savedSnapshot.avatarDecorationId ?? "none");
    setProfileFrameId(savedSnapshot.profileFrameId ?? "none");
    setProfileEffectId(savedSnapshot.profileEffectId ?? "none");
    setProfile(savedSnapshot);
    setError("");
    setNotice("");
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
          pronouns: pronouns.trim(),
          statusText: status.trim(),
          about: about.trim(),
          cardColor,
          themeColorSecondary,
          plateStyle,
          displayNameStyle,
          displayNameEffect,
          displayNameAnimation,
          displayNameFuzzySettings,
          displayNameColor,
          displayNameGradientStart,
          displayNameGradientEnd,
          displayNamePrismColors,
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
        themeColorSecondary: payload.profile.themeColorSecondary ?? themeColorSecondary,
        plateStyle: payload.appearanceSaved === false ? plateStyle : safePlate(payload.profile.plateStyle ?? plateStyle),
        displayNameStyle: payload.profile.displayNameStyle ? safeDisplayNameStyle(payload.profile.displayNameStyle) : displayNameStyle,
        displayNameEffect: payload.profile.displayNameEffect ? safeDisplayNameEffect(payload.profile.displayNameEffect) : displayNameEffect,
        displayNameAnimation: payload.profile.displayNameAnimation ? safeDisplayNameAnimation(payload.profile.displayNameAnimation) : displayNameAnimation,
        displayNameFuzzySettings: normalizeFuzzyTextSettings(payload.profile.displayNameFuzzySettings ?? displayNameFuzzySettings),
        displayNameColor: payload.profile.displayNameColor ? safeDisplayNameColor(payload.profile.displayNameColor) : displayNameColor,
        displayNameGradientStart: payload.profile.displayNameGradientStart ?? displayNameGradientStart,
        displayNameGradientEnd: payload.profile.displayNameGradientEnd ?? displayNameGradientEnd,
        displayNamePrismColors: safeDisplayNamePrismColors(payload.profile.displayNamePrismColors ?? displayNamePrismColors),
        accentColor: payload.appearanceSaved === false ? accentColor : safeAccent(payload.profile.accentColor ?? accentColor),
        avatarFrame: payload.appearanceSaved === false ? avatarFrame : safeFrame(payload.profile.avatarFrame ?? avatarFrame),
      };
      setProfile(updated);
      setSavedSnapshot(updated);
      updateCardColor(updated.cardColor ?? cardColor);
      setPlateStyle(safePlate(updated.plateStyle));
      setDisplayNameStyle(safeDisplayNameStyle(updated.displayNameStyle));
      setDisplayNameEffect(safeDisplayNameEffect(updated.displayNameEffect));
      setDisplayNameAnimation(safeDisplayNameAnimation(updated.displayNameAnimation));
      setDraftDisplayNameAnimation(safeDisplayNameAnimation(updated.displayNameAnimation));
      setDisplayNameFuzzySettings(normalizeFuzzyTextSettings(updated.displayNameFuzzySettings));
      setDraftDisplayNameFuzzySettings(normalizeFuzzyTextSettings(updated.displayNameFuzzySettings));
      setDisplayNameColor(safeDisplayNameColor(updated.displayNameColor));
      setDisplayNameGradientStart(updated.displayNameGradientStart ?? "#B86BFF");
      setDisplayNameGradientEnd(updated.displayNameGradientEnd ?? "#4E9BFF");
      setDisplayNamePrismColors(safeDisplayNamePrismColors(updated.displayNamePrismColors));
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
                Para guardar la apariencia, la placa y el estilo de nombre, aplica las migraciones de identidad comunitaria de esta rama en Supabase.
              </div>
            )}
          </div>
        )}

        <div className="ps-community-editor-workspace ps-community-editor-workspace-discord">
          <aside className="ps-community-editor-settings-sidebar" aria-label="Ajustes del perfil">

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
            </section>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Tema de perfil</div>
              <div ref={cardColorControlRef} className="ps-community-editor-theme-picker-anchor">
<div className="ps-community-editor-theme-stop-list">
                <button type="button" className={"ps-community-editor-theme-stop" + (activeThemeStop === "top" ? " is-active" : "")} onClick={() => openThemeColorPicker("top")} aria-label="Editar primer color del tema" aria-pressed={activeThemeStop === "top"}>
                  <span style={{ backgroundColor: cardColor }}/><span>Color 1</span><small>{cardColor.toUpperCase()}</small>
                </button>
                <button type="button" className={"ps-community-editor-theme-stop" + (activeThemeStop === "bottom" ? " is-active" : "")} onClick={() => openThemeColorPicker("bottom")} aria-label="Editar segundo color del tema" aria-pressed={activeThemeStop === "bottom"}>
                  <span style={{ backgroundColor: themeColorSecondary }}/><span>Color 2</span><small>{themeColorSecondary.toUpperCase()}</small>
                </button>
              </div>
              {colorPickerOpen && (
                <div className="ps-community-color-picker ps-community-editor-sidebar-color-picker" role="dialog" aria-label={"Editar " + (activeThemeStop === "top" ? "primer" : "segundo") + " color del tema"}>
                  <div className="ps-community-color-picker-plane" style={{ backgroundColor: "hsl(" + cardHue + " 100% 50%)" }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateCardColorFromPlane(event); }} onPointerMove={(event) => { if (event.buttons === 1) updateCardColorFromPlane(event); }}>
                    <span className="ps-community-color-picker-cursor" style={{ left: (hexToHsv(activeThemeColor).s * 100) + "%", top: ((1 - hexToHsv(activeThemeColor).v) * 100) + "%" }}/>
                  </div>
                  <label className="ps-community-color-picker-hue-wrap" aria-label="Espectro de colores"><input className="ps-community-color-picker-hue" aria-label="Tono" type="range" min="0" max="360" value={cardHue} onChange={(event) => updateCardHue(Number(event.target.value))}/></label>
                  <label className="ps-community-color-picker-hex"><span>#</span><input value={cardColorDraft} maxLength={6} aria-label="Código hexadecimal" inputMode="text" onChange={(event) => { const next = event.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase(); setCardColorDraft(next); if (next.length === 6) updateActiveThemeColor("#" + next); }} onBlur={() => setCardColorDraft(activeThemeColor.slice(1))}/><button type="button" aria-label="Copiar color" onClick={() => void navigator.clipboard.writeText(activeThemeColor.toUpperCase())}><Copy size={14}/></button></label>
                  <div className="ps-community-color-picker-recent">{recentCardColors.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => updateActiveThemeColor(color)} aria-label="Usar muestra de color"/>)}</div>
                  <div className="ps-community-color-picker-actions"><button type="button" onClick={() => { updateCardColor(DEFAULT_CARD); setThemeColorSecondary(DEFAULT_THEME_SECONDARY); setCardColorDraft((activeThemeStop === "top" ? DEFAULT_CARD : DEFAULT_THEME_SECONDARY).slice(1)); setCardHue(hexToHsv(activeThemeStop === "top" ? DEFAULT_CARD : DEFAULT_THEME_SECONDARY).h); }}>Restablecer</button><button type="button" onClick={() => setColorPickerOpen(false)}>Listo</button></div>
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
                <button type="button" className="ps-community-editor-cosmetic-tile" onClick={() => openAppearancePicker("profileEffect")} aria-label="Añadir animación al banner">
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
                  <small>Animación</small>
                </button>
              </div>
            </section>

            <section className="ps-community-editor-settings-section ps-community-editor-banner-decoration-section">
              <div className="ps-community-editor-settings-section-title">Decorar cartel de perfil</div>
              <button type="button" className="ps-community-editor-banner-decoration-tile" onClick={() => setNotice("El catálogo de decoraciones del cartel estará disponible próximamente.")}>
                <span className="ps-community-editor-banner-decoration-art" aria-hidden="true"><i/><i/><i/></span>
                <span><strong>Personalizar cartel</strong><small>Estilos, marcos y efectos visuales</small></span>
                <Plus size={16}/>
              </button>
            </section>

            <section className="ps-community-editor-settings-section ps-community-editor-name-style-section">
              <div className="ps-community-editor-settings-section-title">Estilo de nombre de visualización</div>
              <span className="ps-community-editor-new-label">NUEVO</span>
              <button type="button" className={"ps-community-editor-name-style-preview is-plate-" + plateStyle + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColor} onClick={() => openAppearancePicker("nameStyle")} aria-label="Cambiar estilo del nombre">
                <strong>{displayName || "Tu nombre"}</strong><Type size={15}/>
              </button>
              <small className="ps-community-editor-settings-hint">Tipografías seleccionadas y acabados animados en tiempo real.</small>
            </section>

            <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { handleAvatarFileSelection(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}/>
          </aside>

          <section className="ps-community-editor-preview-column" aria-label="Vista previa del perfil">
            <div className="ps-community-editor-preview-frame">
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle + " is-profile-frame-" + profileFrameId + " is-profile-effect-" + profileEffectId} style={{ "--editor-accent": accentColor, "--editor-card": cardColor, "--editor-theme-gradient": "linear-gradient(180deg, " + cardColor + ", " + themeColorSecondary + ")", "--editor-banner-background": "#20242D", "--editor-theme-text": readableThemeText(cardColor), "--editor-theme-body-text": readableThemeText(blendThemeColors(cardColor, themeColorSecondary, 0.55)), "--editor-theme-bottom-text": readableThemeText(themeColorSecondary) } as CSSProperties}>
                <div className="ps-community-editor-banner-anchor">
                  <div className={"ps-community-editor-preview-banner is-banner-effect-" + profileEffectId} style={profile.bannerUrl ? { backgroundImage: "url(" + profile.bannerUrl + ")", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#20242D" }}>
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
                  <AnimatedDisplayName value={displayName || "Tu nombre"} animation={displayNameAnimation} fuzzySettings={displayNameFuzzySettings} className={"ps-community-editor-preview-name-static is-plate-" + plateStyle + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColor} style={{ "--name-gradient-start": displayNameGradientStart, "--name-gradient-end": displayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + displayNamePrismColors.join(",") + ")", "--name-solid-color": displayNameColor === "custom-gradient" ? displayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === displayNameColor)?.value ?? "currentColor" } as CSSProperties}/>
                  <div className="ps-community-editor-preview-identity-line">
                    <span className="ps-community-editor-preview-tag">{memberTag(profile.memberNumber)}</span>
                    <textarea
                      ref={pronounsTextareaRef}
                      className="ps-community-editor-preview-pronouns"
                      value={pronouns}
                      maxLength={24}
                      rows={1}
                      wrap="soft"
                      spellCheck={false}
                      onChange={(event) => setPronouns(event.target.value)}
                      placeholder="Añadir pronombres"
                      aria-label="Editar pronombres"
                    />
                  </div>
                  <div className="ps-community-editor-preview-role-row">
                    {profile.roles.slice(0, 3).map((role) => (
                      <span key={role.roleKey} style={{
                        "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : accentColor,
                      } as CSSProperties}>{role.label}</span>
                    ))}
                  </div>
                  <section className="ps-community-editor-preview-about">
                    <div className="ps-community-editor-preview-about-heading"><span>Biografía</span><small>{about.length}/256</small></div>
                    {aboutEditing ? (
                      <textarea
                        ref={aboutTextareaRef}
                        className="ps-community-editor-bio-inline is-editing"
                        value={about}
                        maxLength={256}
                        rows={1}
                        autoFocus
                        onChange={(event) => setAbout(event.target.value)}
                        onBlur={() => setAboutEditing(false)}
                        placeholder="Cuéntanos un poco sobre ti…"
                        aria-label="Biografía del perfil"
                      />
                    ) : (
                      <button
                        type="button"
                        className="ps-community-editor-bio-display"
                        onClick={() => setAboutEditing(true)}
                        aria-label="Editar biografía"
                      >
                        {about || <span>Cuéntanos un poco sobre ti…</span>}
                      </button>
                    )}
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
          <section ref={appearanceModalRef} className={"ps-community-picker-modal" + (appearancePicker === "nameStyle" ? " is-name-style-modal" : "")} role="dialog" aria-modal="true" aria-labelledby="ps-community-picker-title">
            <header className="ps-community-picker-header">
              <div>
                {appearancePicker !== "nameStyle" && <span>PEAKSCORE / COSMÉTICOS DE COMUNIDAD</span>}
                <h2 id="ps-community-picker-title">
                  {appearancePicker === "avatarFrame" ? "Cambiar marco de avatar"
                    : appearancePicker === "avatarDecoration" ? "Cambiar decoración de avatar"
                    : appearancePicker === "profileFrame" ? "Cambiar marco de perfil"
                    : appearancePicker === "profileEffect" ? "Cambiar efecto de perfil"
                    : appearancePicker === "nameStyle" ? "Estilo de nombre de visualización"
                    : "Cambiar placa de identificación"}
                </h2>
                <p className={appearancePicker === "nameStyle" ? "is-empty" : ""}>
                  {appearancePicker === "avatarFrame" ? "Elige el contorno que rodea tu imagen de perfil."
                    : appearancePicker === "avatarDecoration" ? "Elige el detalle animado que acompaña tu avatar."
                    : appearancePicker === "profileFrame" ? "Elige el contorno que rodea la tarjeta completa."
                    : appearancePicker === "profileEffect" ? "Elige el ambiente animado que se reproduce en el perfil."
                    : appearancePicker === "nameStyle" ? ""
                    : "Elige la placa que acompaña tu nombre en la comunidad."}
                </p>
              </div>
              <button type="button" onClick={() => setAppearancePicker(null)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>

            <div className="ps-community-picker-layout">
              <div className="ps-community-picker-collection">
                {appearancePicker !== "nameStyle" && <div className="ps-community-picker-collection-heading">
                  <strong>
                    {appearancePicker === "avatarFrame" ? "Marcos de avatar"
                      : appearancePicker === "avatarDecoration" ? "Decoraciones de avatar"
                      : appearancePicker === "profileFrame" ? "Marcos de perfil"
                      : appearancePicker === "profileEffect" ? "Efectos animados"
                      : "Placas de identificación"}
                  </strong>
                  <span>Opciones disponibles</span>
                </div>}

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
                        onMouseEnter={(event) => updateProfileHoverPreview(event.currentTarget, "frame", item.id, true)}
                        onMouseLeave={(event) => updateProfileHoverPreview(event.currentTarget, "frame", item.id, false)}
                        onFocus={(event) => updateProfileHoverPreview(event.currentTarget, "frame", item.id, true)}
                        onBlur={(event) => updateProfileHoverPreview(event.currentTarget, "frame", item.id, false)}
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
                        onMouseEnter={(event) => updateProfileHoverPreview(event.currentTarget, "effect", item.id, true)}
                        onMouseLeave={(event) => updateProfileHoverPreview(event.currentTarget, "effect", item.id, false)}
                        onFocus={(event) => updateProfileHoverPreview(event.currentTarget, "effect", item.id, true)}
                        onBlur={(event) => updateProfileHoverPreview(event.currentTarget, "effect", item.id, false)}
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
                  <div className="ps-community-name-style-controls">
                    <section className="ps-community-name-style-group">
                      <div className="ps-community-name-style-heading">Elige una fuente</div>
                      <div className="ps-community-name-font-grid">
                        {DISPLAY_NAME_STYLES.map((item) => (
                          <button key={item.id} type="button"
                            className={"ps-community-name-font-option is-name-style-" + item.id + (draftDisplayNameStyle === item.id ? " is-selected" : "")}
                            title={item.label} aria-label={item.label}
                            onClick={() => setDraftDisplayNameStyle(item.id)} aria-pressed={draftDisplayNameStyle === item.id}>
                            <span>{displayName || item.sample}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="ps-community-name-style-group">
                      <div className="ps-community-name-style-heading">Elige un efecto</div>
                      <div className="ps-community-name-effect-grid">
                        {DISPLAY_NAME_EFFECTS.map((item) => (
                          <button key={item.id} type="button"
                            className={"ps-community-name-effect-option effect-" + item.id + (draftDisplayNameEffect === item.id ? " is-selected" : "")}
                            onClick={() => {
                              setDraftDisplayNameEffect(item.id);
                              if (item.id === "gradient") setDraftDisplayNameColor("custom-gradient");
                            }}
                            aria-pressed={draftDisplayNameEffect === item.id}
                            title={item.description}>
                            <span className={"ps-community-name-effect-sample is-name-style-" + draftDisplayNameStyle + " effect-" + item.id}
                              style={{
                                "--name-gradient-start": draftDisplayNameGradientStart,
                                "--name-gradient-end": draftDisplayNameGradientEnd,
                                "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")",
                                "--name-solid-color": draftDisplayNameColor === "custom-gradient"
                                  ? draftDisplayNameGradientStart
                                  : DISPLAY_NAME_COLORS.find((color) => color.id === draftDisplayNameColor)?.value ?? "currentColor",
                              } as CSSProperties}>{displayName || "Aa"}</span>
                            <strong>{item.label}</strong>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="ps-community-name-style-group">
                      <div className="ps-community-name-style-heading">Animación continua <span>SIEMPRE ACTIVA</span></div>
                      <div className="ps-community-name-animation-grid">
                        {DISPLAY_NAME_ANIMATIONS.map((item) => (
                          <button key={item.id} type="button"
                            className={"ps-community-name-animation-option" + (draftDisplayNameAnimation === item.id ? " is-selected" : "")}
                            data-animation={item.id}
                            onClick={() => setDraftDisplayNameAnimation(item.id)}
                            aria-pressed={draftDisplayNameAnimation === item.id}
                            title={item.description}>
                            <span className="ps-community-name-animation-stage" data-animation={item.id}>
                              <AnimatedDisplayName
                                value={displayName || "OMEGA"}
                                animation={item.id}
                                fuzzySettings={DEFAULT_FUZZY_TEXT_SETTINGS}
                                tag="span"
                                previewMode
                                className={"ps-community-name-animation-sample ps-community-name-render ps-name-motion-demo is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + draftDisplayNameColor}
                                style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((color) => color.id === draftDisplayNameColor)?.value ?? "currentColor" } as CSSProperties}
                              />
                            </span>
                            <strong>{item.label}</strong>
                            <small>{item.hint}</small>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="ps-community-name-style-group">
                      <div className="ps-community-name-style-heading">Elige un color</div>

                      {draftDisplayNameEffect === "gradient" && (
                        <>
                          <div className="ps-community-name-preset-grid" aria-label="Degradados predefinidos">
                            {DISPLAY_NAME_GRADIENT_PRESETS.map((preset) => (
                              <button key={preset.id} type="button"
                                className={"ps-community-name-preset-swatch" + (draftDisplayNameGradientStart === preset.start && draftDisplayNameGradientEnd === preset.end ? " is-selected" : "")}
                                style={{ background: "linear-gradient(105deg," + preset.start + "," + preset.end + ")" }}
                                title={preset.label} aria-label={preset.label}
                                onClick={() => {
                                  setDraftDisplayNameGradientStart(preset.start);
                                  setDraftDisplayNameGradientEnd(preset.end);
                                  setDraftDisplayNameColor("custom-gradient");
                                }}/>
                            ))}
                          </div>
                          <div className="ps-community-name-gradient-editor">
                            <label>
                              <span>Color inicial</span>
                              <span className="ps-community-name-gradient-color">
                                <input type="color" value={draftDisplayNameGradientStart} onChange={(event) => { setDraftDisplayNameGradientStart(event.target.value.toUpperCase()); setDraftDisplayNameColor("custom-gradient"); }}/>
                                <code>{draftDisplayNameGradientStart.toUpperCase()}</code>
                              </span>
                            </label>
                            <span className="ps-community-name-gradient-connector" aria-hidden="true"/>
                            <label>
                              <span>Color final</span>
                              <span className="ps-community-name-gradient-color">
                                <input type="color" value={draftDisplayNameGradientEnd} onChange={(event) => { setDraftDisplayNameGradientEnd(event.target.value.toUpperCase()); setDraftDisplayNameColor("custom-gradient"); }}/>
                                <code>{draftDisplayNameGradientEnd.toUpperCase()}</code>
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      {(draftDisplayNameEffect === "prism" || draftDisplayNameEffect === "gummy") && (
                        <>
                          <div className="ps-community-name-spectrum-presets" aria-label="Paletas multicolor">
                            {DISPLAY_NAME_SPECTRUM_PRESETS.map((preset) => (
                              <button key={preset.id} type="button"
                                className={"ps-community-name-spectrum-swatch" + (JSON.stringify(draftDisplayNamePrismColors) === JSON.stringify(preset.colors) ? " is-selected" : "")}
                                style={{ background: "linear-gradient(90deg," + preset.colors.join(",") + ")" }}
                                title={preset.label} aria-label={preset.label}
                                onClick={() => setDraftDisplayNamePrismColors(preset.colors.slice())}/>
                            ))}
                          </div>
                          <div className="ps-community-name-prism-editor" aria-label="Personaliza los cinco colores">
                            {draftDisplayNamePrismColors.map((color, index) => (
                              <label key={index} title={"Color " + (index + 1)}>
                                <span>{index + 1}</span>
                                <input type="color" aria-label={"Color " + (index + 1)} value={color}
                                  onChange={(event) => setDraftDisplayNamePrismColors((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value.toUpperCase() : item))}/>
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      {draftDisplayNameEffect !== "gradient" && draftDisplayNameEffect !== "prism" && draftDisplayNameEffect !== "gummy" && (
                        <div className="ps-community-name-color-grid">
                          <label className={"ps-community-name-custom-color" + (draftDisplayNameColor === "custom-gradient" ? " is-selected" : "")}
                            title="Elegir color personalizado" aria-label="Elegir color personalizado">
                            <Pipette size={17}/>
                            <input type="color" value={draftDisplayNameGradientStart}
                              onChange={(event) => {
                                const value = event.target.value.toUpperCase();
                                setDraftDisplayNameGradientStart(value);
                                setDraftDisplayNameGradientEnd(value);
                                setDraftDisplayNameColor("custom-gradient");
                              }}/>
                          </label>
                          {DISPLAY_NAME_COLORS.filter((item) => item.id !== "custom-gradient" && item.id !== "default").map((item) => (
                            <button key={item.id} type="button" title={item.label} aria-label={item.label}
                              className={"ps-community-name-color-option color-" + item.id + (draftDisplayNameColor === item.id ? " is-selected" : "")}
                              onClick={() => setDraftDisplayNameColor(item.id)} aria-pressed={draftDisplayNameColor === item.id}
                              style={{ "--name-color-swatch": item.value } as CSSProperties}/>
                          ))}
                          <button type="button" title="Color automático" aria-label="Color automático"
                            className={"ps-community-name-color-option color-default" + (draftDisplayNameColor === "default" ? " is-selected" : "")}
                            onClick={() => setDraftDisplayNameColor("default")} aria-pressed={draftDisplayNameColor === "default"}/>
                        </div>
                      )}
                    </section>
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
                            <strong className={"ps-community-picker-member-name is-plate-" + item.id + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColor}>{displayName || "Tu nombre"}</strong>
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
                {appearancePicker !== "nameStyle" && <span className="ps-community-picker-preview-eyebrow">VISTA PREVIA</span>}
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
                  <article className={"ps-community-picker-card-preview is-profile-effect-" + draftProfileEffectId}>
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
                  <div className="ps-community-name-preview-stage">
                    <section className="ps-community-name-preview-profile-view">
                      <div className="ps-community-name-context-label">PERFIL</div>
                      <article className="ps-community-status-profile-preview ps-community-name-style-profile-preview"
                        aria-live="polite"
                        style={{
                          "--status-theme": cardColor,
                          "--status-theme-secondary": themeColorSecondary,
                          "--status-theme-text": readableThemeText(cardColor),
                          "--status-banner-image": profile.bannerUrl ? "url(" + profile.bannerUrl + ")" : "none",
                          "--name-gradient-start": draftDisplayNameGradientStart,
                          "--name-gradient-end": draftDisplayNameGradientEnd,
                          "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")",
                          "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? "currentColor",
                        } as CSSProperties}>
                        <div className={"ps-community-status-preview-avatar ps-community-editor-preview-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="104px"/> : initials(displayName || "PeakScore")}
                          <i className={"ps-community-editor-presence-dot " + (isOnline ? "is-online" : "is-offline")}/>
                        </div>
                        <div className="ps-community-status-profile-copy ps-community-name-style-profile-copy">
                          <AnimatedDisplayName value={displayName || "Tu nombre"} animation={draftDisplayNameAnimation} fuzzySettings={draftDisplayNameFuzzySettings} className={"is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + draftDisplayNameColor} style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? "currentColor" } as CSSProperties}/>
                        </div>
                      </article>
                    </section>
                    <section className="ps-community-name-preview-members-view">
                      <div className="ps-community-name-context-label">MIEMBROS DE LA COMUNIDAD</div>
                      <div className="ps-community-name-community-shell">
                        <div className="ps-community-name-community-channel"><span className="ps-community-name-channel-hash">#</span> general</div>
                        <div className="ps-community-name-members-title">MIEMBROS — 1</div>
                        <div className="ps-community-name-member-row">
                          <span className={"ps-community-name-member-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="40px"/> : initials(displayName || "PeakScore")}
                            <i className={isOnline ? "is-online" : "is-offline"}/>
                          </span>
                          <span className="ps-community-name-member-copy">
                            <AnimatedDisplayName value={displayName || "Tu nombre"} animation={draftDisplayNameAnimation} fuzzySettings={draftDisplayNameFuzzySettings} className={"ps-community-name-render is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + draftDisplayNameColor + " name-enter-" + draftDisplayNameAnimation} style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? "currentColor" } as CSSProperties}/>
                          </span>
                          <span className="ps-community-name-member-presence">{isOnline ? "En línea" : "Desconectado"}</span>
                        </div>
                      </div>
                    </section>
                    <section className="ps-community-name-preview-chat-view">
                      <div className="ps-community-name-context-label">CHAT</div>
                      <div className="ps-community-name-chat-message">
                        <span className="ps-community-name-chat-avatar">
                          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="42px"/> : initials(displayName || "PeakScore")}
                        </span>
                        <div className="ps-community-name-chat-content">
                          <div className="ps-community-name-chat-meta">
                            <AnimatedDisplayName value={displayName || "Tu nombre"} animation={draftDisplayNameAnimation} fuzzySettings={draftDisplayNameFuzzySettings} className={"ps-community-name-render is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + draftDisplayNameColor} style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? "currentColor" } as CSSProperties}/>
                            <time>ahora</time>
                          </div>
                          <p>Así se verá tu nombre al participar en la conversación.</p>
                        </div>
                      </div>
                    </section>
                    
                  </div>
                )}
                {appearancePicker !== "nameStyle" && <div className="ps-community-picker-selection">
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
                </div>}
              </aside>
            </div>

            <footer className={"ps-community-picker-footer" + (appearancePicker === "nameStyle" ? " is-name-style-footer" : "")}>
              <button type="button" className="is-quiet" onClick={() => setAppearancePicker(null)}>Cancelar</button>
              <button type="button" className="is-primary" onClick={applyAppearancePicker} disabled={!hasPickerChanges}>
                {hasPickerChanges ? "Aplicar" : "Ya equipado"}
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
              <button type="button" onClick={() => setStatusEditorOpen(false)} aria-label="Cerrar"><X size={20}/></button>
            </header>

            <div className="ps-community-status-profile-preview" aria-live="polite" style={{ "--status-theme": cardColor, "--status-theme-secondary": themeColorSecondary, "--status-theme-text": readableThemeText(cardColor), "--status-banner-image": profile.bannerUrl ? "url(" + profile.bannerUrl + ")" : "none", "--name-gradient-start": displayNameGradientStart, "--name-gradient-end": displayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + displayNamePrismColors.join(",") + ")" } as CSSProperties}>
              <div className={"ps-community-status-preview-avatar ps-community-editor-preview-avatar frame-" + avatarFrame + " is-decoration-" + avatarDecorationId}>
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="64px"/> : initials(displayName || "PeakScore")}
                <i className={"ps-community-editor-presence-dot " + (isOnline ? "is-online" : "is-offline")}/>
              </div>
              <div className="ps-community-status-preview-bubble-wrap">
                
                <div className="ps-community-status-bubble">
                  {statusDraft.trim() || <span className="ps-community-status-placeholder">¿Qué ganas de...</span>}
                </div>
              </div>
              <div className="ps-community-status-profile-copy" style={{ color: "var(--status-theme-text)" }}>
                <strong className={"is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColor} style={{ "--name-gradient-start": displayNameGradientStart, "--name-gradient-end": displayNameGradientEnd } as CSSProperties}>{displayName || "Tu perfil"}</strong>
                <small>{memberTag(profile.memberNumber)}</small>
                {pronouns && <small>{pronouns}</small>}
              </div>
            </div>

            <label ref={statusEmojiFieldRef} className="ps-community-status-field">
              <span>Estado</span>
              <div className="ps-community-status-input-wrap">
                <button type="button" className="ps-community-status-emoji-trigger" aria-label="Añadir emoji" aria-expanded={statusEmojiOpen} onClick={() => setStatusEmojiOpen((value) => !value)}><Smile size={20}/></button>
                <input ref={statusInputRef} autoFocus value={statusDraft} maxLength={128} onChange={(event) => setStatusDraft(event.target.value)} onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    applyStatusDraft();
                  }
                  if (event.key === "Escape") setStatusEmojiOpen(false);
                }} placeholder="¿Qué ganas de..."/>
                {statusDraft && <button type="button" className="ps-community-status-clear-input" aria-label="Borrar texto" onClick={() => { setStatusDraft(""); statusInputRef.current?.focus(); }}><X size={15}/></button>}
              </div>
              {statusEmojiOpen && (
                <div className="ps-community-status-emoji-picker" role="group" aria-label="Selector de emojis" onPointerDown={(event) => event.stopPropagation()}>
                  <div className="ps-community-status-emoji-search">
                    <Smile size={16}/>
                    <input value={statusEmojiSearch} onChange={(event) => setStatusEmojiSearch(event.target.value)} placeholder="Encuentra el emoji perfecto" aria-label="Buscar emojis"/>
                    {statusEmojiSearch && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setStatusEmojiSearch("")}><X size={13}/></button>}
                  </div>
                  <div className="ps-community-status-emoji-categories">
                    {STATUS_EMOJI_CATEGORIES.map((category) => (
                      <button type="button" key={category} className={statusEmojiCategory === category ? "is-active" : ""} onClick={() => setStatusEmojiCategory(category)}>{category}</button>
                    ))}
                  </div>
                  <div className="ps-community-status-emoji-picker-heading">{statusEmojiSearch ? "Resultados" : statusEmojiCategory === "Todos" ? "Todos los emojis" : statusEmojiCategory === "Frecuentes" ? "Usados frecuentemente" : statusEmojiCategory}</div>
                  <div className="ps-community-status-emoji-grid">
                    {STATUS_EMOJI_ITEMS.filter((item) => (statusEmojiCategory === "Todos" || item.category === statusEmojiCategory || (statusEmojiCategory === "Frecuentes" && item.category === "Frecuentes")) && (!statusEmojiSearch || (item.name + " " + item.emoji).toLowerCase().includes(statusEmojiSearch.toLowerCase()))).map((item) => (
                      <button type="button" key={item.emoji} onClick={() => insertStatusEmoji(item.emoji)} aria-label={`Insertar ${item.name}`} title={item.name}>{item.emoji}</button>
                    ))}
                  </div>
                </div>
              )}
            </label>

            <div ref={statusDurationRef} className="ps-community-status-expiry">
              <button type="button" className="ps-community-status-expiry-trigger" aria-expanded={statusDurationOpen} onClick={() => { setStatusDurationOpen((value) => !value); setStatusEmojiOpen(false); }}>
                <span>{statusExpiryLabel(statusDuration)}</span>
                <span className={"ps-community-status-chevron" + (statusDurationOpen ? " is-open" : "")}>⌄</span>
              </button>
              {statusDurationOpen && (
                <div className="ps-community-status-expiry-menu" role="listbox" aria-label="Borrar estado después de">
                  <div className="ps-community-status-expiry-heading">Borrar después de</div>
                  {(["1d","4h","1h","30m","1w","never"] as StatusDuration[]).map((duration) => (
                    <button type="button" role="option" aria-selected={statusDuration === duration} className={statusDuration === duration ? "is-selected" : ""} key={duration} onClick={() => { setStatusDuration(duration); setStatusDurationOpen(false); }}>
                      <span>{statusExpiryLabel(duration, true)}</span>
                      {statusDuration === duration && <Check size={16}/>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <footer>
              {(status || statusDraft) ? (
                <button type="button" className="is-clear" onClick={() => { setStatusDraft(""); setStatus(""); setStatusExpiresAt(null); setStatusEmojiOpen(false); setStatusDurationOpen(false); setStatusEditorOpen(false); }}>Borrar estado</button>
              ) : <span className="ps-community-status-footer-spacer"/>}
              <button type="button" className="is-save" onClick={applyStatusDraft} disabled={busy}>Guardar</button>
            </footer>
          </section>
        </div>
      )}

<style jsx global>{`/* Discord-like inline biography: no inner scrollbar, natural height and readable input surface. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar {
  border-color: var(--editor-card, #B7D7C3) !important;
  box-shadow: 0 0 0 2px #232428, 0 7px 18px #0006 !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot {
  border: 4px solid #232428 !important;
  background: #23a55a !important;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 12%) !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot.is-online::before,
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot.is-online::after {
  display:none !important; content:none !important; animation:none !important; box-shadow:none !important;
}
/* Pronouns behave like a compact, theme-integrated multiline identity field. */
.ps-community-editor-preview-identity-line {
  display: flex !important;
  align-items: flex-start !important;
  flex-wrap: nowrap !important;
  gap: 7px !important;
  min-width: 0 !important;
}
.ps-community-editor-preview-tag {
  flex: 0 0 auto !important;
  align-self: flex-start !important;
}
.ps-community-editor-preview-pronouns {
  display: block !important;
  flex: 0 1 170px !important;
  width: 170px !important;
  min-width: 76px !important;
  max-width: min(190px, calc(100% - 110px)) !important;
  min-height: 26px !important;
  /* Height is set from scrollHeight so wrapped pronouns expand downward. */
  max-height: none !important;
  margin: 0 !important;
  padding: 3px 4px !important;
  resize: none !important;
  overflow: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  box-sizing: border-box !important;
  border: 1px solid transparent !important;
  border-radius: 5px !important;
  background: transparent !important;
  color: var(--editor-theme-text, #f2f3f5) !important;
  -webkit-text-fill-color: var(--editor-theme-text, #f2f3f5) !important;
  caret-color: var(--editor-theme-text, #fff) !important;
  font: inherit !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  text-align: left !important;
  white-space: pre-wrap !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}
.ps-community-editor-preview-pronouns::-webkit-scrollbar { display:none !important; }
.ps-community-editor-preview-pronouns::placeholder {
  color: var(--editor-theme-text, #f2f3f5) !important;
  opacity: .62 !important;
  font-style: italic !important;
}
.ps-community-editor-preview-pronouns:hover {
  border-color: transparent !important;
  background: transparent !important;
}
.ps-community-editor-preview-pronouns:focus {
  color: var(--editor-theme-text, #fff) !important;
  background: transparent !important;
  border-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
}
.ps-community-editor-preview-tag {
  color:#f2f3f5 !important; background:rgb(30 31 34 / 78%) !important;
  border-color:rgb(255 255 255 / 22%) !important; text-shadow:0 1px 2px #0006 !important;
}
.ps-community-editor-preview-about > textarea.ps-community-editor-bio-inline {
  display:block !important; width:100% !important; min-height:36px !important;
  max-height:none !important; padding:8px 10px !important;
  margin:5px 0 0 !important; resize:none !important; overflow:hidden !important;
  scrollbar-width:none !important; -ms-overflow-style:none !important;
  box-sizing:border-box !important; border:1px solid rgb(255 255 255 / 18%) !important;
  border-radius:7px !important; background:rgb(30 31 34 / 88%) !important;
  color:#f2f3f5 !important; -webkit-text-fill-color:#f2f3f5 !important;
  caret-color:#fff !important; line-height:1.45 !important; white-space:pre-wrap !important;
}
.ps-community-editor-preview-about > textarea.ps-community-editor-bio-inline::-webkit-scrollbar { display:none !important; }
.ps-community-editor-preview-about > textarea.ps-community-editor-bio-inline::placeholder { color:#b5bac1 !important; }
.ps-community-editor-preview-about > textarea.ps-community-editor-bio-inline:focus {
  border-color:#5865f2 !important; background:rgb(30 31 34 / 92%) !important;
  outline:none !important; box-shadow:0 0 0 2px rgb(88 101 242 / 18%) !important;
}`}</style>
    </div>
    </div>,
    document.body,
  );
}
