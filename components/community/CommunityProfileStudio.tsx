"use client";

import Image from "next/image";
import { displayNameColorForEffect } from "@/components/community/display-name-color";
import { normalizeFuzzyTextSettings, type FuzzyTextSettings } from "@/components/community/fuzzy-text-settings";
import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  Camera, Check, Copy, Film, ImagePlus, Pencil, Pipette,
  LoaderCircle, Plus, PlusCircle, Save, Smile, Trash2, Type, X,
} from "lucide-react";

type PlateStyle = "classic" | "grid" | "arcade" | "signal";
type DisplayNameStyle = "classic" | "tempo" | "sakura" | "jellybean" | "modern" | "medieval" | "8bit" | "vampyre" | "monkey-bars" | "mainframe" | "headbang" | "journal" | "display" | "editorial" | "elegant" | "geometric" | "retro" | "handwritten" | "signature" | "techno" | "rounded" | "stencil" | "discord-display" | "creator-sans" | "stream-mono" | "street-block" | "action-condensed" | "cyber-racer" | "epic-rpg";
type DisplayNameFontCategory = "core" | "editorial" | "gaming" | "artistic";
type DisplayNameEffect = "plain" | "gradient" | "gradient-flow" | "neon" | "toon" | "pop" | "gummy" | "prism" | "chromaflow";
type DisplayNameAnimation = "decrypt" | "shuffle-blur" | "shuffle-flip" | "shuffle" | "inkline" | "halo-signal" | "domino-flow" | "mistfall" | "depth-lift";
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
  accountName?: string | null;
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
  { id: "discord-display", label: "Archivo Display", sample: "Aa", description: "Sans contemporánea de alto impacto, basada en Archivo" },
  { id: "creator-sans", label: "Creator Sans", sample: "Aa", description: "DM Sans · alternativa geométrica al estilo Roobert" },
  { id: "stream-mono", label: "Stream Mono", sample: "Aa", description: "IBM Plex Mono · precisión para perfiles gamer y tech" },
  { id: "street-block", label: "Street Block", sample: "Aa", description: "Bungee · rótulo urbano contundente para una estética open-world, sin copiar logotipos de videojuegos" },
  { id: "action-condensed", label: "Action Condensed", sample: "Aa", description: "Teko · display condensada de alto impacto para una estética de acción y carreras" },
  { id: "cyber-racer", label: "Cyber Racer", sample: "Aa", description: "Oxanium · geometría angular inspirada en HUD, ciencia ficción y videojuegos futuristas" },
  { id: "epic-rpg", label: "Epic RPG", sample: "Aa", description: "Cinzel · inscripción épica para nombres de fantasía, aventura y RPG" },

];

const DISPLAY_NAME_FONT_CATEGORIES: { id: DisplayNameFontCategory; label: string; fonts: DisplayNameStyle[] }[] = [
  { id: "core", label: "Esenciales", fonts: ["classic", "modern", "geometric", "rounded", "creator-sans", "discord-display", "stream-mono"] },
  { id: "editorial", label: "Editoriales", fonts: ["tempo", "editorial", "elegant", "journal", "signature", "handwritten", "monkey-bars"] },
  { id: "gaming", label: "Gaming", fonts: ["8bit", "mainframe", "headbang", "retro", "techno", "display", "stencil", "street-block", "action-condensed", "cyber-racer", "epic-rpg"] },
  { id: "artistic", label: "Artísticas", fonts: ["sakura", "jellybean", "medieval", "vampyre"] },
];

const DISPLAY_NAME_EFFECTS: { id: DisplayNameEffect; label: string; description: string }[] = [
  { id: "plain", label: "Tinta", description: "Acabado editorial limpio, con contraste y peso tipográfico" },
  { id: "gradient", label: "Aurora", description: "Luz cromática que atraviesa el nombre en un ciclo continuo" },
  { id: "gradient-flow", label: "Gradient Flow", description: "Espectro cromático fluido que recorre el nombre continuamente" },
  { id: "neon", label: "Neón", description: "Halo de luz con respiración y núcleo brillante" },
  { id: "toon", label: "Cromo", description: "Letras con volumen, borde pulido y reflejo móvil" },
  { id: "pop", label: "Rebote", description: "Movimiento elástico muy sutil con sombra dimensional" },
  { id: "gummy", label: "Gloss", description: "Superficie translúcida con brillo líquido en movimiento" },
  { id: "prism", label: "Prisma", description: "Iridescencia multicolor con refracción lenta" },
  { id: "chromaflow", label: "Chromaflow", description: "Degradado espectral multicolor que fluye continuamente de izquierda a derecha" },
];

type DisplayNameColorMode = "single" | "gradient" | "spectrum" | "automatic";
const DISPLAY_NAME_EFFECT_COLOR_MODE: Record<DisplayNameEffect, DisplayNameColorMode> = {
  plain: "single",
  gradient: "gradient",
  neon: "single",
  toon: "automatic",
  pop: "single",
  gummy: "spectrum",
  prism: "spectrum",
  chromaflow: "automatic",
  "gradient-flow": "automatic",
};
const DISPLAY_NAME_ANIMATIONS: { id: DisplayNameAnimation; label: string; description: string; hint: string }[] = [
  { id: "decrypt", label: "Hacking Decode", description: "Glifos hexadecimales cambian mientras el nombre se descifra carácter por carácter", hint: "Descifrado hexadecimal" },
  { id: "inkline", label: "Inkline", description: "El contorno dibuja cada letra y después el relleno aparece con un barrido limpio", hint: "Trazo dibujado · relleno progresivo" },
  { id: "halo-signal", label: "Halo Signal", description: "Letras que se encienden en orden variable con brillo violeta y destellos controlados", hint: "Destello violeta · secuencia aleatoria" },
  { id: "domino-flow", label: "Domino Flow", description: "Las letras caen en cadena como fichas de dominó y se reconstruyen en su posición", hint: "Caída escalonada · reconstrucción" },
  { id: "mistfall", label: "Mistfall", description: "El nombre se descompone en partículas luminosas y vuelve a condensarse", hint: "Dispersión de partículas · condensación" },
  { id: "depth-lift", label: "Depth Lift", description: "Volumen 3D con sombra profunda que se extiende al pasar el cursor", hint: "Profundidad 3D · hover" },
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
function contrastRatio(first: string, second: string) {
  const a = themeLuminance(first);
  const b = themeLuminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
function readableThemeText(hex: string, secondHex = hex) {
  // Pick one shared foreground that maximizes the worst contrast across the
  // entire two-colour profile gradient, rather than choosing per colour stop.
  const samples = Array.from({ length: 9 }, (_, index) =>
    blendThemeColors(hex, secondHex, index / 8)
  );
  const lightInk = "#F7F8FA";
  const darkInk = "#17191F";
  const lightWorst = Math.min(...samples.map((sample) => contrastRatio(lightInk, sample)));
  const darkWorst = Math.min(...samples.map((sample) => contrastRatio(darkInk, sample)));
  return lightWorst >= darkWorst ? lightInk : darkInk;
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

type DisplayNameCustomColorPickerProps = {
  value: string;
  selected: boolean;
  onApply: (color: string) => void;
  onReset?: () => void;
};

function DisplayNameCustomColorPicker({ value, selected, onApply, onReset }: DisplayNameCustomColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hue, setHue] = useState(hexToHsv(value).h);
  const [hexDraft, setHexDraft] = useState(value.slice(1));
  const [recent, setRecent] = useState<string[]>([]);

  function setLocalColor(color: string) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    const normalized = color.toUpperCase();
    setDraft(normalized);
    setHexDraft(normalized.slice(1));
  }

  function apply(color = draft) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    const normalized = color.toUpperCase();
    onApply(normalized);
    setRecent((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 6));
  }

  function updateFromPlane(event: ReactPointerEvent<HTMLDivElement>): string | null {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const saturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const brightness = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    const nextColor = hsvToHex(hue, saturation, brightness);
    setLocalColor(nextColor);
    return nextColor;
  }

  function updateFromHue(nextHue: number) {
    setHue(nextHue);
    const hsv = hexToHsv(draft);
    setLocalColor(hsvToHex(nextHue, hsv.s, hsv.v));
  }

  return (
    <div className="ps-community-name-custom-picker-root ps-community-name-color-picker">
      <button type="button"
        className={"ps-community-name-custom-color" + (selected || open ? " is-selected" : "")}
        title="Elegir un color personalizado"
        aria-label="Elegir un color personalizado"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) { setOpen(false); return; }
          setLocalColor(value);
          setHexDraft(value.slice(1));
          setHue(hexToHsv(value).h);
          setOpen(true);
        }}
        style={{ "--name-color-swatch": value } as CSSProperties}
      >
        <span className="ps-community-name-custom-color-mark"><Pipette size={15}/></span>
        <span className="ps-community-name-custom-color-copy">
          <strong>Personalizar</strong>
          <small>{value.toUpperCase()}</small>
        </span>
      </button>
      {open && (
        <div className="ps-community-color-picker ps-community-editor-sidebar-color-picker ps-community-name-custom-picker" role="dialog" aria-label="Elegir color personalizado">
          <div
            className="ps-community-color-picker-plane"
            style={{ backgroundColor: "hsl(" + hue + " 100% 50%)" }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateFromPlane(event);
            }}
            onPointerMove={(event) => { if (event.buttons === 1) updateFromPlane(event); }}
            onPointerUp={(event) => {
              const nextColor = updateFromPlane(event);
              if (nextColor) requestAnimationFrame(() => apply(nextColor));
            }}
          >
            <span className="ps-community-color-picker-cursor" style={{
              left: (hexToHsv(draft).s * 100) + "%",
              top: ((1 - hexToHsv(draft).v) * 100) + "%",
            }}/>
          </div>
          <label className="ps-community-color-picker-hue-wrap" aria-label="Espectro de colores">
            <input className="ps-community-color-picker-hue" aria-label="Tono" type="range" min="0" max="360" value={hue}
              onChange={(event) => updateFromHue(Number(event.target.value))}
              onPointerUp={() => apply()}
              onKeyUp={() => apply()}/>
          </label>
          <label className="ps-community-color-picker-hex">
            <span>#</span>
            <input value={hexDraft} maxLength={6} aria-label="Código hexadecimal" inputMode="text"
              onChange={(event) => {
                const next = event.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase();
                setHexDraft(next);
                if (next.length === 6) setLocalColor("#" + next);
              }}
              onBlur={() => { if (/^[0-9a-f]{6}$/i.test(hexDraft)) apply("#" + hexDraft); else setHexDraft(draft.slice(1)); }}
              onKeyDown={(event) => { if (event.key === "Enter" && /^[0-9a-f]{6}$/i.test(hexDraft)) apply("#" + hexDraft); }}/>
            <button type="button" aria-label="Copiar color" onClick={() => void navigator.clipboard.writeText(draft)}>
              <Copy size={14}/>
            </button>
          </label>
          <div className="ps-community-color-picker-recent" aria-label="Colores recientes">
            {recent.length > 0 ? recent.map((color) => (
              <button key={color} type="button" style={{ background: color }} aria-label={"Usar " + color} onClick={() => apply(color)}/>
            )) : ["#F6C7D0", "#F4D7B5", "#C8DDF2", "#CDE8D5", "#D9CFF2", "#F5E7A8"].map((color) => (
              <button key={color} type="button" style={{ background: color }} aria-label={"Usar " + color} onClick={() => apply(color)}/>
            ))}
          </div>
          <div className="ps-community-color-picker-actions">
            <button type="button" onClick={() => { onReset?.(); setLocalColor(value); setOpen(false); }}>Restablecer</button>
            <button type="button" onClick={() => { apply(); setOpen(false); }}>Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? "P").slice(0, 2)).toUpperCase();
}
function accountTag(value?: string | null) {
  const clean = typeof value === "string" ? value.trim().replace(/^@+/, "") : "";
  return clean ? "@" + clean : "";
}

function DisplayNameMotionPreview({ value, animation, className = "", style, tag = "span" }: {
  value: string;
  animation: DisplayNameAnimation;
  className?: string;
  style?: CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
}) {
  const Tag = tag;
  // Retain the legacy prop shape for stored profiles, but render the name statically.
  void animation;
  return <Tag className={className} style={style}>{value}</Tag>;
}

export default function CommunityProfileStudio({ userId, initialProfile, onClose, onSaved, isOnline }: Props) {
  const [portalReady, setPortalReady] = useState(false);
  const [closeConfirmationOpen, setCloseConfirmationOpen] = useState(false);
  const closeDirtyRef = useRef(false);
  const [profile, setProfile] = useState(initialProfile);
  const [savedSnapshot, setSavedSnapshot] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
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
  const draftDisplayNameColorMode = DISPLAY_NAME_EFFECT_COLOR_MODE[draftDisplayNameEffect];
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
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [posterCollectionOpen, setPosterCollectionOpen] = useState(false);
  const [posterCollectionTarget, setPosterCollectionTarget] = useState<"avatar" | "banner" | null>(null);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropUrl, setAvatarCropUrl] = useState<string | null>(null);
  const [avatarCropZoom, setAvatarCropZoom] = useState(1);
  const [avatarCropX, setAvatarCropX] = useState(50);
  const [avatarCropY, setAvatarCropY] = useState(50);
  const avatarCropDragRef = useRef<{ pointerId: number; startX: number; startY: number; cropX: number; cropY: number } | null>(null);
  const [appearancePicker, setAppearancePicker] = useState<PickerKind | null>(null);
  const [draftAvatarFrame, setDraftAvatarFrame] = useState<AvatarFrame>(safeFrame(initialProfile.avatarFrame));
  const [draftDecorationId, setDraftDecorationId] = useState<AvatarDecorationId>(initialProfile.avatarDecorationId ?? "none");
  const [draftProfileFrameId, setDraftProfileFrameId] = useState<ProfileFrameId>(initialProfile.profileFrameId ?? "none");
  const [draftProfileEffectId, setDraftProfileEffectId] = useState<ProfileEffectId>(initialProfile.profileEffectId ?? "none");
  const [draftPlate, setDraftPlate] = useState<PlateStyle>(safePlate(initialProfile.plateStyle));
  const [draftDisplayNameStyle, setDraftDisplayNameStyle] = useState<DisplayNameStyle>(safeDisplayNameStyle(initialProfile.displayNameStyle));
  const [draftDisplayNameFontCategory, setDraftDisplayNameFontCategory] = useState<DisplayNameFontCategory>(
    DISPLAY_NAME_FONT_CATEGORIES.find((category) => category.fonts.includes(safeDisplayNameStyle(initialProfile.displayNameStyle)))?.id ?? "core"
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [deleting, setDeleting] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerImageInput = useRef<HTMLInputElement>(null);
  const aboutTextareaRef = useRef<HTMLTextAreaElement>(null);
  const pronounsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const cardColorControlRef = useRef<HTMLDivElement>(null);
  const settingsSidebarRef = useRef<HTMLElement>(null);
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
      if (closeConfirmationOpen) { setCloseConfirmationOpen(false); return; }
      if (posterCollectionOpen) { setPosterCollectionOpen(false); setPosterCollectionTarget(null); return; }
      if (bannerPickerOpen) { setBannerPickerOpen(false); return; }
      if (avatarPickerOpen) { setAvatarPickerOpen(false); return; }
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
      if (!busy && !uploading && !deleting) {
        if (closeDirtyRef.current) setCloseConfirmationOpen(true);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, busy, uploading, deleting, closeConfirmationOpen, appearancePicker, statusEditorOpen, avatarCropUrl, avatarPickerOpen, bannerPickerOpen, posterCollectionOpen, colorPickerOpen, avatarMenuOpen]);

  useEffect(() => {
    if (!appearancePicker) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousOverscrollBehavior = root.style.overscrollBehavior;
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    return () => {
      root.style.overflow = previousOverflow;
      root.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [appearancePicker]);

  useEffect(() => {
    if (!colorPickerOpen && !avatarMenuOpen && !statusEditorOpen && !appearancePicker && !avatarCropUrl) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      // Capture phase makes dismissal reliable even when a child control stops bubbling.
      const eventPath = event.composedPath();
      const colorPickerAnchor = cardColorControlRef.current;
      const pointerIsInsideColorPicker = Boolean(colorPickerAnchor && (colorPickerAnchor.contains(target) || eventPath.includes(colorPickerAnchor)));
      const sidebarBounds = settingsSidebarRef.current?.getBoundingClientRect();
      const pointerIsOnSidebarScrollbar = Boolean(
        sidebarBounds
        && event.clientX >= sidebarBounds.right - 16
        && event.clientX <= sidebarBounds.right
        && event.clientY >= sidebarBounds.top
        && event.clientY <= sidebarBounds.bottom
      );
      if (colorPickerOpen && !pointerIsInsideColorPicker && !pointerIsOnSidebarScrollbar) setColorPickerOpen(false);
      if (avatarMenuOpen && !avatarMenuAnchorRef.current?.contains(target)) setAvatarMenuOpen(false);
      if (statusEditorOpen && !statusModalRef.current?.contains(target)) setStatusEditorOpen(false);
      if (statusEmojiOpen && !statusEmojiFieldRef.current?.contains(target)) setStatusEmojiOpen(false);
      if (statusDurationOpen && !statusDurationRef.current?.contains(target)) setStatusDurationOpen(false);
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
  const hasUnsavedChanges = displayName !== (savedSnapshot.displayName ?? "")
    || pronouns !== (savedSnapshot.pronouns ?? "")
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
  const hasPendingCloseChanges = hasUnsavedChanges || hasPickerChanges;
  useLayoutEffect(() => {
    // Sync after commit so Escape always reads the latest draft without mutating refs during render.
    closeDirtyRef.current = hasPendingCloseChanges;
  }, [hasPendingCloseChanges]);
  function requestEditorClose() {
    if (busy || uploading || deleting) return;
    if (hasPendingCloseChanges) setCloseConfirmationOpen(true);
    else onClose();
  }

  const profileThemeInk = readableThemeText(cardColor, themeColorSecondary);
  const previewStyle = {
    "--editor-accent": accentColor,
    "--editor-card": safeColor(cardColor),
    "--editor-theme-text": profileThemeInk,
    "--editor-theme-body-text": profileThemeInk,
    "--editor-theme-bottom-text": profileThemeInk,
        "--status-theme-text": profileThemeInk,
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
      setAvatarPickerOpen(false);
      void uploadAsset("avatar", file);
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Selecciona PNG, JPG, WebP o GIF.");
      return;
    }
    setAvatarPickerOpen(false);
    setAvatarCropFile(file);
    setAvatarCropZoom(1);
    setAvatarCropX(50);
    setAvatarCropY(50);
    setAvatarCropUrl(URL.createObjectURL(file));
  }

  function handleBannerFileSelection(file: File | null) {
    if (!file) return;
    void uploadAsset("banner", file);
  }

  function handleAvatarCropPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    avatarCropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cropX: avatarCropX,
      cropY: avatarCropY,
    };
  }

  function handleAvatarCropPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = avatarCropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const deltaX = ((event.clientX - drag.startX) / bounds.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / bounds.height) * 100;
    setAvatarCropX(Math.max(0, Math.min(100, drag.cropX - deltaX)));
    setAvatarCropY(Math.max(0, Math.min(100, drag.cropY - deltaY)));
  }

  function handleAvatarCropPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (avatarCropDragRef.current?.pointerId === event.pointerId) avatarCropDragRef.current = null;
  }

  function closeAvatarCrop() {
    avatarCropDragRef.current = null;
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
        void uploadAsset("avatar", cropped).then((saved) => { if (saved) closeAvatarCrop(); });
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
    setDisplayName(savedSnapshot.displayName ?? "");
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
  }

  async function saveProfile() {
    if (!canSave) return;
    setBusy(true);
    setError("");
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
      setDisplayName(updated.displayName);
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

      if (payload.appearanceSaved !== false) {
        onSaved();
        if (closeConfirmationOpen) onClose();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAsset(kind: "avatar" | "banner", file: File | null): Promise<boolean> {
    if (!file || !profile.isOwnProfile || busy || uploading || deleting) return false;
    const maxBytes = kind === "avatar" ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    const allowedType = ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type);
    if (!allowedType || file.size <= 0 || file.size > maxBytes) {
      setError(kind === "avatar"
        ? "Selecciona una imagen PNG, JPG, WebP o GIF de máximo 5 MB."
        : "Selecciona una imagen o GIF de máximo 8 MB.");
      clearAssetInputs(kind);
      return false;
    }

    setUploading(kind);
    setError("");
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
        error?: string; avatarUrl?: string; bannerUrl?: string; animated?: boolean;
      } | null;
      const nextUrl = kind === "avatar" ? payload?.avatarUrl : payload?.bannerUrl;
      if (!response.ok || !nextUrl) throw new Error(payload?.error ?? "No se pudo actualizar la imagen.");

      setProfile((current) => kind === "avatar"
        ? { ...current, avatarUrl: nextUrl }
        : { ...current, bannerUrl: nextUrl });
      setSavedSnapshot((current) => kind === "avatar"
        ? { ...current, avatarUrl: nextUrl }
        : { ...current, bannerUrl: nextUrl });
      setAvatarPickerOpen(false);
      setBannerPickerOpen(false);
      onSaved();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la imagen.");
      return false;
    } finally {
      setUploading(null);
      clearAssetInputs(kind);
    }
  }

  function clearAssetInputs(kind: "avatar" | "banner") {
    if (kind === "avatar") {
      if (avatarInput.current) avatarInput.current.value = "";
    } else {
      if (bannerImageInput.current) bannerImageInput.current.value = "";
    }
  }

  async function removeAsset(kind: "avatar" | "banner") {
    if (!profile.isOwnProfile || busy || uploading || deleting) return;
    setDeleting(kind);
    setError("");
    try {
      const response = await fetch("/api/community/profile/" + userId, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "No se pudo retirar la imagen.");
      setProfile((current) => kind === "avatar"
        ? { ...current, avatarUrl: null }
        : { ...current, bannerUrl: null });
      setSavedSnapshot((current) => kind === "avatar"
        ? { ...current, avatarUrl: null }
        : { ...current, bannerUrl: null });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo retirar la imagen.");
    } finally {
      setDeleting(null);
    }
  }

  const handlePickerScrollbarPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const nearScrollbarEdge = bounds.right - event.clientX <= 18 && event.clientX >= bounds.left;
    const nextVisibility = nearScrollbarEdge ? "true" : "false";
    if (event.currentTarget.dataset.scrollbarVisible !== nextVisibility) {
      event.currentTarget.dataset.scrollbarVisible = nextVisibility;
    }
  };

  if (!portalReady) return null;

  return createPortal(
    <div
      className="ps-community-editor-overlay"
      data-close-confirming={closeConfirmationOpen ? "true" : undefined}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestEditorClose();
      }}
    >
    <div
      className="ps-community-editor-v2"
      data-close-confirming={closeConfirmationOpen ? "true" : undefined}
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
            <button type="button" className="ps-community-editor-close" onClick={requestEditorClose} aria-label="Cerrar editor">
              <X size={19}/>
            </button>
          </div>
        </header>

        {(error || !profile.appearanceReady) && (
          <div className="ps-community-editor-feedback-stack">
            {error && <div className="ps-community-editor-feedback is-error" role="alert">{error}</div>}
            {!profile.appearanceReady && (
              <div className="ps-community-editor-feedback is-pending" role="status">
                Para guardar la apariencia, la placa y el estilo de nombre, aplica las migraciones de identidad comunitaria de esta rama en Supabase.
              </div>
            )}
          </div>
        )}

        <div className="ps-community-editor-workspace ps-community-editor-workspace-discord">
          <aside ref={settingsSidebarRef} className="ps-community-editor-settings-sidebar" aria-label="Ajustes del perfil">

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
                  <small>{accountTag(profile.accountName)}</small>
                </span>
                <PlusCircle size={20}/>
              </button>
            </section>

            <section className="ps-community-editor-settings-section">
              <div className="ps-community-editor-settings-section-title">Avatar</div>
              <div className="ps-community-editor-avatar-tiles is-avatar-only">
                <button type="button" className="ps-community-editor-avatar-tile" onClick={() => setAvatarPickerOpen(true)} aria-label="Cambiar avatar">
                  <span className="ps-community-editor-avatar-tile-image">
                    {profile.avatarUrl
                      ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="70px"/>
                      : initials(displayName || "PeakScore")}
                  </span>
                  <small>Avatar</small>
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

            <section className="ps-community-editor-settings-section ps-community-editor-banner-decoration-section">
              <div className="ps-community-editor-settings-section-title">Decorar cartel de perfil</div>
              <div className="ps-community-editor-banner-tools">
                <button
                  type="button"
                  className="ps-community-editor-banner-current ps-community-editor-banner-current-is-preview"
                  onClick={() => setBannerPickerOpen(true)}
                  disabled={Boolean(uploading) || busy}
                  aria-label="Abrir opciones del cartel de perfil"
                >
                  <span
                    className="ps-community-editor-banner-current-preview"
                    style={profile.bannerUrl
                      ? { backgroundImage: "url(" + profile.bannerUrl + ")", backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: "linear-gradient(120deg,#142831,#173f37 58%,#1c272e)" }}
                  />
                </button>
              </div>
            </section>

            <section className="ps-community-editor-settings-section ps-community-editor-name-style-section">
              <div className="ps-community-editor-settings-section-title">Estilo de nombre de visualización</div>
              <span className="ps-community-editor-new-label">NUEVO</span>
              <button type="button" className={"ps-community-editor-name-style-preview is-plate-" + plateStyle + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColorForEffect(displayNameEffect, displayNameColor)} onClick={() => openAppearancePicker("nameStyle")} aria-label="Cambiar estilo del nombre">
                <strong>{displayName || "Tu nombre"}</strong><Type size={15}/>
              </button>
              <small className="ps-community-editor-settings-hint">Tipografías seleccionadas y acabados visuales en tiempo real.</small>
            </section>

            <input ref={avatarInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { handleAvatarFileSelection(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}/>
            <input ref={bannerImageInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { handleBannerFileSelection(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}/>

          </aside>

          <section className="ps-community-editor-preview-column" aria-label="Vista previa del perfil">
            <div className="ps-community-editor-preview-frame">
              <article className={"ps-community-editor-preview-card is-plate-" + plateStyle} style={{ "--editor-accent": accentColor, "--editor-card": cardColor, "--editor-theme-gradient": "linear-gradient(180deg, " + cardColor + ", " + themeColorSecondary + ")", "--editor-banner-background": "#20242D", "--editor-theme-text": profileThemeInk, "--editor-theme-body-text": profileThemeInk, "--editor-theme-bottom-text": profileThemeInk, } as CSSProperties}>
                <div className="ps-community-editor-banner-anchor">
                  <div className={"ps-community-editor-preview-banner" + (profile.bannerUrl ? " has-user-banner" : " is-peakscore-banner")} style={profile.bannerUrl ? { backgroundImage: "url(" + profile.bannerUrl + ")", backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: "#20242D" }}>
                    <div className="ps-community-editor-preview-banner-shade" aria-hidden="true"/>
                    <div className="ps-community-editor-preview-banner-empty" aria-hidden="true"/>
                  </div>
                </div>
                <div className="ps-community-editor-preview-body">
                  <div className="ps-community-editor-preview-avatar-row">
                    <div className="ps-community-editor-preview-avatar-anchor" ref={avatarMenuAnchorRef}>
                      <button type="button" className="ps-community-editor-preview-avatar-trigger" onClick={() => setAvatarMenuOpen((open) => !open)} aria-expanded={avatarMenuOpen} aria-label="Cambiar avatar">
                        <span className={"ps-community-editor-preview-avatar frame-" + avatarFrame}>
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
                          <button type="button" role="menuitem" onClick={() => { setAvatarMenuOpen(false); setAvatarPickerOpen(true); }}>
                            <Camera size={15}/> Cambiar avatar
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
                  <input
                    id="ps-community-display-name-inline"
                    className={"ps-community-editor-preview-name-input ps-community-profile-name is-plate-" + plateStyle + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColorForEffect(displayNameEffect, displayNameColor)}
                    value={displayName}
                    size={Math.max(8, Math.min(32, displayName.length + 1))}
                    maxLength={32}
                    minLength={2}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setDisplayName(event.target.value.slice(0, 32))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
                      if (event.key === "Escape") { setDisplayName(savedSnapshot.displayName ?? ""); event.currentTarget.blur(); }
                    }}
                    placeholder="Tu nombre"
                    aria-label="Nombre en la comunidad"
                    style={{
                      "--name-gradient-start": displayNameGradientStart,
                      "--name-gradient-end": displayNameGradientEnd,
                      "--name-prism-gradient": "linear-gradient(90deg," + displayNamePrismColors.join(",") + ")",
                      "--name-solid-color": displayNameColor === "custom-gradient" ? displayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === displayNameColor)?.value ?? profileThemeInk,
                    } as CSSProperties}
                  />                  <div className="ps-community-editor-preview-identity-line">
                    <span className="ps-community-editor-preview-tag">{accountTag(profile.accountName)}</span>
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

        {closeConfirmationOpen ? (
          <div className="ps-community-editor-close-confirm" role="alertdialog" aria-live="assertive" aria-label="Cambios sin guardar">
            <div className="ps-community-editor-close-confirm-copy">
              <strong>¡Tienes cambios sin guardar!</strong>
              <span>¿Quieres seguir editando o salir sin guardar?</span>
            </div>
            <div className="ps-community-editor-close-confirm-actions">
              <button type="button" className="is-keep" onClick={() => setCloseConfirmationOpen(false)}>
                Seguir editando
              </button>
              <button type="button" className="is-discard" onClick={() => { discardChanges(); setCloseConfirmationOpen(false); onClose(); }}>
                Descartar
              </button>
              {hasUnsavedChanges && (
                <button type="button" className="is-save" onClick={() => void saveProfile()} disabled={!canSave}>
                  {busy ? <LoaderCircle size={15} className="ps-community-editor-spin"/> : <Save size={15}/>}
                  {busy ? "Guardando…" : "Guardar y salir"}
                </button>
              )}
            </div>
          </div>
        ) : hasUnsavedChanges && (
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
        <div className="ps-community-picker-overlay">
          <section ref={appearanceModalRef} id={appearancePicker === "nameStyle" ? "ps-community-name-style-picker" : undefined} className={"ps-community-picker-modal" + (appearancePicker === "nameStyle" ? " is-name-style-modal" : "")} role="dialog" aria-modal="true" aria-labelledby="ps-community-picker-title">
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
              <div
                className="ps-community-picker-collection"
                tabIndex={0}
                aria-label="Opciones de estilo y color"
                onPointerMove={handlePickerScrollbarPointerMove}
                onPointerLeave={(event) => { event.currentTarget.dataset.scrollbarVisible = "false"; }}
              >
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
                      <div className="ps-community-name-style-heading">Tipografías <span>{DISPLAY_NAME_STYLES.length} ESTILOS</span></div>
                      <div className="ps-community-name-font-categories" role="group" aria-label="Familias tipográficas">
                        {DISPLAY_NAME_FONT_CATEGORIES.map((category) => (
                          <button key={category.id} type="button"
                            className={"ps-community-name-font-category" + (draftDisplayNameFontCategory === category.id ? " is-selected" : "")}
                            onClick={() => setDraftDisplayNameFontCategory(category.id)}
                            aria-pressed={draftDisplayNameFontCategory === category.id}>
                            <span>{category.label}</span>
                            <small>{category.fonts.length}</small>
                          </button>
                        ))}
                      </div>
                      <div className="ps-community-name-font-grid">
                        {DISPLAY_NAME_STYLES.filter((item) => DISPLAY_NAME_FONT_CATEGORIES.find((category) => category.id === draftDisplayNameFontCategory)?.fonts.includes(item.id)).map((item) => (
                          <button key={item.id} type="button"
                            className={"ps-community-name-font-option is-name-style-" + item.id + (draftDisplayNameStyle === item.id ? " is-selected" : "")}
                            title={item.label + " · " + item.description}
                            aria-label={item.label + ". " + item.description}
                            onClick={() => setDraftDisplayNameStyle(item.id)} aria-pressed={draftDisplayNameStyle === item.id}>
                            <span>{item.sample}</span>
                            <small className="ps-community-name-font-label">{item.label}</small>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="ps-community-name-style-group ps-community-name-color-style-group">
                      <div className="ps-community-name-style-heading">
                        Color de letra
                        <span>{draftDisplayNameColorMode === "single" ? "TONO" : draftDisplayNameColorMode === "gradient" ? "DEGRADADO" : draftDisplayNameColorMode === "spectrum" ? "ESPECTRO" : "AUTOMÁTICO"}</span>
                      </div>
                      {draftDisplayNameColorMode === "single" && (
                        <>
                          <div className="ps-community-name-colors-row">
                            <DisplayNameCustomColorPicker
                              value={draftDisplayNameGradientStart}
                              selected={draftDisplayNameColor === "custom-gradient"}
                              onApply={(color) => {
                                setDraftDisplayNameGradientStart(color);
                                setDraftDisplayNameColor("custom-gradient");
                              }}
                              onReset={() => setDraftDisplayNameColor("default")}
                            />
                            <div className="ps-community-name-preset-grid ps-community-name-color-grid" role="group" aria-label="Colores de letra">
                              {DISPLAY_NAME_COLORS.filter((item) => !["default", "custom-gradient"].includes(item.id)).map((item) => (
                                <button key={item.id} type="button"
                                  className={"ps-community-name-preset-swatch" + (draftDisplayNameColor === item.id ? " is-selected" : "")}
                                  style={{ background: item.value }}
                                  aria-label={item.label} aria-pressed={draftDisplayNameColor === item.id} title={item.label}
                                  onClick={() => setDraftDisplayNameColor(item.id)}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {draftDisplayNameColorMode === "gradient" && (
                        <>
                          <div className="ps-community-name-preset-grid" role="group" aria-label="Degradados de letra">
                            {DISPLAY_NAME_GRADIENT_PRESETS.map((preset) => {
                              const selected = draftDisplayNameGradientStart.toUpperCase() === preset.start && draftDisplayNameGradientEnd.toUpperCase() === preset.end;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  className={"ps-community-name-preset-swatch" + (selected ? " is-selected" : "")}
                                  style={{ background: "linear-gradient(110deg," + preset.start + "," + preset.end + ")" }}
                                  aria-label={preset.label}
                                  aria-pressed={selected}
                                  title={preset.label}
                                  onClick={() => {
                                    setDraftDisplayNameColor("custom-gradient");
                                    setDraftDisplayNameGradientStart(preset.start);
                                    setDraftDisplayNameGradientEnd(preset.end);
                                  }}
                                />
                              );
                            })}
                          </div>
                          <div className="ps-community-name-custom-gradient-stops">
                            <div className="ps-community-name-gradient-stop"><span>Color inicial</span><DisplayNameCustomColorPicker
                              value={draftDisplayNameGradientStart}
                              selected={true}
                              onApply={(color) => {
                                setDraftDisplayNameColor("custom-gradient");
                                setDraftDisplayNameGradientStart(color);
                              }}
                            /></div>
                            <div className="ps-community-name-gradient-stop"><span>Color final</span><DisplayNameCustomColorPicker
                              value={draftDisplayNameGradientEnd}
                              selected={true}
                              onApply={(color) => {
                                setDraftDisplayNameColor("custom-gradient");
                                setDraftDisplayNameGradientEnd(color);
                              }}
                            /></div>
                          </div>
                        </>
                      )}
                      {draftDisplayNameColorMode === "spectrum" && (
                        <div className="ps-community-name-spectrum-presets ps-community-name-prism-editor" role="group" aria-label="Paletas de letra">
                          {DISPLAY_NAME_SPECTRUM_PRESETS.map((preset) => {
                            const selected = JSON.stringify(draftDisplayNamePrismColors) === JSON.stringify(preset.colors);
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                className={"ps-community-name-spectrum-swatch" + (selected ? " is-selected" : "")}
                                style={{ background: "linear-gradient(90deg," + preset.colors.join(",") + ")" }}
                                aria-label={preset.label}
                                aria-pressed={selected}
                                title={preset.label}
                                onClick={() => setDraftDisplayNamePrismColors(preset.colors.slice())}
                              />
                            );
                          })}
                        </div>
                      )}
                      {draftDisplayNameColorMode === "automatic" && (
                        <p className="ps-community-name-color-auto-note">Este acabado administra su propia paleta para mantener el reflejo y los colores sincronizados.</p>
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
                            <strong className={"ps-community-picker-member-name is-plate-" + item.id + " is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColorForEffect(displayNameEffect, displayNameColor)}>{displayName || "Tu nombre"}</strong>
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

              <aside
                className="ps-community-picker-preview"
                tabIndex={0}
                aria-label="Vistas previas del nombre"
                onPointerMove={handlePickerScrollbarPointerMove}
                onPointerLeave={(event) => { event.currentTarget.dataset.scrollbarVisible = "false"; }}
              >
                {appearancePicker !== "nameStyle" && <span className="ps-community-picker-preview-eyebrow">VISTA PREVIA</span>}
                {appearancePicker === "avatarFrame" && (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large frame-" + draftAvatarFrame}>
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong><small>{accountTag(profile.accountName)}</small>
                  </div>
                )}
                {appearancePicker === "avatarDecoration" && (
                  <div className="ps-community-picker-frame-stage">
                    <div className={"ps-community-picker-avatar-large is-decoration-" + draftDecorationId}>
                      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="128px"/> : <span>{initials(displayName || "PeakScore")}</span>}
                    </div>
                    <strong>{displayName || "Tu nombre"}</strong><small>{accountTag(profile.accountName)}</small>
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
                      <small>{accountTag(profile.accountName)}</small>
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
                      <small>{accountTag(profile.accountName)}</small>
                      <span>VISTA PREVIA DEL EFECTO</span>
                    </div>
                    <span className="ps-community-picker-card-preview-art" aria-hidden="true">
                      <Image src="/profile-cosmetics/effects/starfall.svg" alt="" fill unoptimized sizes="320px"/>
                      <Image src="/profile-cosmetics/effects/pixel-burst.svg" alt="" fill unoptimized sizes="320px"/>
                    </span>
                  </article>
                )}
                {appearancePicker === "nameStyle" && (
                  <div className="ps-community-name-preview-stage" style={{ "--status-theme-text": profileThemeInk, "--editor-theme-text": profileThemeInk, } as CSSProperties}>
                    <section className="ps-community-name-preview-profile-view">
                      <div className="ps-community-name-context-label">PERFIL</div>
                      <article className="ps-community-name-style-profile-preview"
                        aria-live="polite"
                        style={{
                          "--status-theme": cardColor,
                          "--status-theme-secondary": themeColorSecondary,
                          "--status-theme-text": profileThemeInk,
                                                    "--status-banner-image": profile.bannerUrl ? "url(" + profile.bannerUrl + ")" : "none",
                          "--name-gradient-start": draftDisplayNameGradientStart,
                          "--name-gradient-end": draftDisplayNameGradientEnd,
                          "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")",
                          "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? profileThemeInk,
                        } as CSSProperties}>
                        <div className={"ps-community-status-preview-avatar ps-community-editor-preview-avatar frame-" + avatarFrame}>
                          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="104px"/> : initials(displayName || "PeakScore")}
                          <i className={"ps-community-editor-presence-dot " + (isOnline ? "is-online" : "is-offline")}/>
                        </div>
                        <div className="ps-community-name-style-profile-copy">
                          <DisplayNameMotionPreview
                            tag="strong"
                            value={displayName || "Tu nombre"}
                            animation={draftDisplayNameAnimation}
                            className={"ps-community-name-render ps-community-profile-name is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + displayNameColorForEffect(draftDisplayNameEffect, draftDisplayNameColor)}
                            style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? profileThemeInk } as CSSProperties}
                          />
                          <small className="ps-community-name-style-profile-handle">{accountTag(profile.accountName)}</small>
                        </div>
                      </article>
                    </section>
                    <section className="ps-community-name-preview-members-view">
                      <div className="ps-community-name-context-label">MIEMBROS DE LA COMUNIDAD</div>
                      <div className="ps-community-name-community-shell">
                        <div className="ps-community-name-community-channel"><span className="ps-community-name-channel-hash">#</span> general</div>
                        <div className="ps-community-name-members-title">MIEMBROS — 1</div>
                        <div className="ps-community-name-member-row">
                          <span className={"ps-community-name-member-avatar frame-" + avatarFrame}>
                            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="40px"/> : initials(displayName || "PeakScore")}
                          </span>
                          <div className="ps-community-name-member-copy">
                            <DisplayNameMotionPreview
                              tag="strong"
                              value={displayName || "Tu nombre"}
                              animation={draftDisplayNameAnimation}
                              className={"ps-community-name-render community-member-nameplate is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + displayNameColorForEffect(draftDisplayNameEffect, draftDisplayNameColor)}
                              style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? profileThemeInk } as CSSProperties}
                            />
                          </div>
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
                            <DisplayNameMotionPreview
                              tag="strong"
                              value={displayName || "Tu nombre"}
                              animation={draftDisplayNameAnimation}
                              className={"ps-community-name-render community-chat-author is-name-style-" + draftDisplayNameStyle + " effect-" + draftDisplayNameEffect + " color-" + displayNameColorForEffect(draftDisplayNameEffect, draftDisplayNameColor)}
                              style={{ "--name-gradient-start": draftDisplayNameGradientStart, "--name-gradient-end": draftDisplayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + draftDisplayNamePrismColors.join(",") + ")", "--name-solid-color": draftDisplayNameColor === "custom-gradient" ? draftDisplayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === draftDisplayNameColor)?.value ?? profileThemeInk } as CSSProperties}
                            />
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

      {avatarPickerOpen && (
        <div className="ps-community-avatar-picker-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setAvatarPickerOpen(false);
        }}>
          <section className="ps-community-avatar-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-avatar-picker-title">
            <header>
              <div><h2 id="ps-community-avatar-picker-title">Cambiar avatar</h2><p>Elige una imagen o explora tu colección de carteles.</p></div>
              <button type="button" onClick={() => setAvatarPickerOpen(false)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>
            <div className="ps-community-avatar-picker-options">
              <button type="button" className="is-image-choice" onClick={() => avatarInput.current?.click()} disabled={Boolean(uploading)}>
                <span className="ps-community-avatar-choice-art">{profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="76px"/> : <ImagePlus size={28}/>}</span>
                <span className="ps-community-avatar-choice-copy"><strong>Elegir imagen</strong><small>PNG, JPG o WebP</small></span>
              </button>
              <button type="button" className="is-collection-choice" onClick={() => { setAvatarPickerOpen(false); setPosterCollectionTarget("avatar"); setPosterCollectionOpen(true); }} disabled={Boolean(uploading)}>
                <span className="ps-community-avatar-choice-art is-collection-art"><Film size={28}/></span>
                <span className="ps-community-avatar-choice-copy"><strong>Ver colección de carteles</strong><small>Explora tus carteles guardados</small></span>
              </button>
            </div>
            {uploading === "avatar" && <div className="ps-community-avatar-picker-progress"><LoaderCircle size={15}/> Actualizando avatar…</div>}
            <footer><button type="button" onClick={() => setAvatarPickerOpen(false)}>Cancelar</button></footer>
          </section>
        </div>
      )}
      {bannerPickerOpen && (
        <div className="ps-community-avatar-picker-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) setBannerPickerOpen(false);
        }}>
          <section className="ps-community-avatar-picker-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-banner-picker-title">
            <header>
              <div><h2 id="ps-community-banner-picker-title">Decorar cartel de perfil</h2><p>Sube una imagen o consulta tu colección de carteles.</p></div>
              <button type="button" onClick={() => setBannerPickerOpen(false)} aria-label="Cerrar selector"><X size={19}/></button>
            </header>
            <div className="ps-community-avatar-picker-options">
              <button type="button" className="is-image-choice" onClick={() => bannerImageInput.current?.click()} disabled={Boolean(uploading)}>
                <span className="ps-community-avatar-choice-art">{profile.bannerUrl ? <span className="ps-community-banner-choice-thumbnail" style={{ backgroundImage: "url(" + profile.bannerUrl + ")" }}/> : <ImagePlus size={28}/>}</span>
                <span className="ps-community-avatar-choice-copy"><strong>Subir imagen</strong><small>PNG, JPG o WebP</small></span>
              </button>
              <button type="button" className="is-collection-choice" onClick={() => { setBannerPickerOpen(false); setPosterCollectionTarget("banner"); setPosterCollectionOpen(true); }} disabled={Boolean(uploading)}>
                <span className="ps-community-avatar-choice-art is-collection-art"><Film size={28}/></span>
                <span className="ps-community-avatar-choice-copy"><strong>Ver colección de carteles</strong><small>Explora tus carteles guardados</small></span>
              </button>
            </div>
            {uploading === "banner" && <div className="ps-community-avatar-picker-progress"><LoaderCircle size={15}/> Actualizando cartel…</div>}
            <footer><button type="button" onClick={() => setBannerPickerOpen(false)}>Cancelar</button></footer>
          </section>
        </div>
      )}
      {posterCollectionOpen && (
        <div className="ps-community-avatar-picker-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) { setPosterCollectionOpen(false); setPosterCollectionTarget(null); }
        }}>
          <section className="ps-community-avatar-picker-modal ps-community-poster-collection-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-poster-collection-title">
            <header>
              <div><h2 id="ps-community-poster-collection-title">Colección de carteles</h2><p>Tu espacio para guardar y elegir carteles de perfil.</p></div>
              <button type="button" onClick={() => { setPosterCollectionOpen(false); setPosterCollectionTarget(null); }} aria-label="Cerrar colección"><X size={19}/></button>
            </header>
            <div className="ps-community-poster-collection-empty" role="status">
              <Film size={30}/>
              <strong>Tu colección está vacía</strong>
              <p>Todavía no hay carteles disponibles. Aquí aparecerán cuando agreguemos contenido a la colección.</p>
            </div>
            <footer><button type="button" onClick={() => {
              const target = posterCollectionTarget;
              setPosterCollectionOpen(false); setPosterCollectionTarget(null);
              if (target === "avatar") setAvatarPickerOpen(true);
              if (target === "banner") setBannerPickerOpen(true);
            }}>Volver</button></footer>
          </section>
        </div>
      )}
      {avatarCropUrl && (
        <div className="ps-community-avatar-crop-overlay" onPointerDown={(event) => {
          if (event.target === event.currentTarget) closeAvatarCrop();
        }}>
          <section ref={avatarCropModalRef} className="ps-community-avatar-crop-modal" role="dialog" aria-modal="true" aria-labelledby="ps-community-avatar-crop-title">
            <header>
              <div><h2 id="ps-community-avatar-crop-title">Ajustar avatar</h2><p>Arrastra la imagen para encuadrarla.</p></div>
              <button type="button" onClick={closeAvatarCrop} aria-label="Cerrar recorte"><X size={18}/></button>
            </header>
            <div
              className="ps-community-avatar-crop-stage"
              onPointerDown={handleAvatarCropPointerDown}
              onPointerMove={handleAvatarCropPointerMove}
              onPointerUp={handleAvatarCropPointerUp}
              onPointerCancel={handleAvatarCropPointerUp}
            >
              <Image src={avatarCropUrl} alt="Vista previa del recorte" fill unoptimized sizes="320px" draggable={false} style={{
                transform: "scale(" + avatarCropZoom + ")",
                transformOrigin: avatarCropX + "% " + avatarCropY + "%",
              }}/>
              <span/>
            </div>
            <div className="ps-community-avatar-crop-controls">
              <label><span>Zoom</span><input type="range" min="1" max="3" step="0.05" value={avatarCropZoom} onChange={(event) => setAvatarCropZoom(Number(event.target.value))}/></label>
            </div>
            <footer>
              <button type="button" onClick={closeAvatarCrop}>Cancelar</button>
              <button type="button" className="is-primary" onClick={confirmAvatarCrop}>Aplicar</button>
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

            <div className="ps-community-status-profile-preview" aria-live="polite" style={{ "--status-theme": cardColor, "--status-theme-secondary": themeColorSecondary, "--status-theme-text": profileThemeInk, "--status-banner-image": profile.bannerUrl ? "url(" + profile.bannerUrl + ")" : "none", "--name-gradient-start": displayNameGradientStart, "--name-gradient-end": displayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + displayNamePrismColors.join(",") + ")" } as CSSProperties}>
              <div className={"ps-community-status-preview-avatar ps-community-editor-preview-avatar frame-" + avatarFrame}>
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" fill unoptimized sizes="64px"/> : initials(displayName || "PeakScore")}
                <i className={"ps-community-editor-presence-dot " + (isOnline ? "is-online" : "is-offline")}/>
              </div>
              <div className="ps-community-status-preview-bubble-wrap">
                
                <div className="ps-community-status-bubble">
                  {statusDraft.trim() || <span className="ps-community-status-placeholder">¿Qué ganas de...</span>}
                </div>
              </div>
              <div className="ps-community-status-profile-copy" style={{ color: "var(--status-theme-text)" }}>
                <DisplayNameMotionPreview
                  tag="strong"
                  value={displayName || "Tu perfil"}
                  animation={displayNameAnimation}
                  className={"ps-community-name-render ps-community-profile-name is-name-style-" + displayNameStyle + " effect-" + displayNameEffect + " color-" + displayNameColorForEffect(displayNameEffect, displayNameColor)}
                  style={{ "--name-gradient-start": displayNameGradientStart, "--name-gradient-end": displayNameGradientEnd, "--name-prism-gradient": "linear-gradient(90deg," + displayNamePrismColors.join(",") + ")", "--name-solid-color": displayNameColor === "custom-gradient" ? displayNameGradientStart : DISPLAY_NAME_COLORS.find((item) => item.id === displayNameColor)?.value ?? profileThemeInk } as CSSProperties}
                />
                <small>{accountTag(profile.accountName)}</small>
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

<style jsx global>{`
/* PeakScore final pass: editable identity, shared theme ink and consistent presence. */
.ps-community-editor-preview-name-edit-trigger{display:inline-flex!important;align-items:center!important;gap:7px!important;max-width:100%!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;color:var(--editor-theme-text,#f2f3f5)!important;text-align:left!important;cursor:text!important}
.ps-community-editor-preview-name-edit-trigger>svg{flex:0 0 auto!important;opacity:0!important;color:var(--editor-theme-text,#f2f3f5)!important;transition:opacity .12s ease!important}
.ps-community-editor-preview-name-edit-trigger:hover>svg,.ps-community-editor-preview-name-edit-trigger:focus-visible>svg{opacity:.72!important}
.ps-community-editor-preview-name-inline-input{display:block!important;width:min(100%,420px)!important;max-width:100%!important;min-height:34px!important;margin:0!important;padding:0 2px!important;border:0!important;border-bottom:1px solid color-mix(in srgb,var(--editor-theme-text,#fff) 55%,transparent)!important;border-radius:0!important;background:transparent!important;color:var(--editor-theme-text,#f2f3f5)!important;-webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;caret-color:var(--editor-theme-text,#f2f3f5)!important;font:inherit!important;font-size:inherit!important;font-weight:850!important;outline:none!important;box-shadow:none!important}
.ps-community-editor-preview-card .ps-community-editor-preview-name-static.color-default{color:var(--editor-theme-text,#f2f3f5)!important;-webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important}
.ps-community-editor-preview-card .ps-community-editor-preview-tag{color:var(--editor-theme-text,#f2f3f5)!important;-webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;background:color-mix(in srgb,var(--editor-theme-text,#f2f3f5) 12%,transparent)!important;border-color:color-mix(in srgb,var(--editor-theme-text,#f2f3f5) 24%,transparent)!important;text-shadow:none!important}
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns{color:var(--editor-theme-text,#f2f3f5)!important;-webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;caret-color:var(--editor-theme-text,#f2f3f5)!important}
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,.ps-community-editor-preview-card .ps-community-editor-preview-meta,.ps-community-editor-preview-card .ps-community-editor-bio-display{color:var(--editor-theme-body-text,var(--editor-theme-text,#f2f3f5))!important}
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading small,.ps-community-editor-preview-card .ps-community-editor-preview-meta strong{color:var(--editor-theme-body-text,var(--editor-theme-text,#f2f3f5))!important}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot,.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot{position:absolute!important;right:-4px!important;bottom:0!important;width:18px!important;height:18px!important;box-sizing:border-box!important;border:4px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot.is-offline,.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline{background:#747b86!important}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot::before,.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot::after,.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::before,.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::after,.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::before,.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::after{display:none!important;content:none!important;box-shadow:none!important}
.ps-community-avatar-picker-modal>header{border-bottom:0!important}
.ps-community-avatar-picker-modal>footer{border-top:0!important}
.ps-community-avatar-choice-art.is-collection-art{background:linear-gradient(145deg,#202932,#252b35)!important;color:#bdc8e0!important}
.ps-community-avatar-choice-art .ps-community-banner-choice-thumbnail{position:absolute;inset:0;background-size:cover;background-position:center}
.ps-community-editor-banner-current-row{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
.ps-community-editor-banner-current.is-action{flex:1 1 auto!important;width:100%!important;text-align:left!important;cursor:pointer!important}
.ps-community-editor-banner-current.is-action>svg{margin-left:auto!important;flex:0 0 auto!important;color:#bdc8e0!important}
.ps-community-editor-banner-current.is-action:hover{border-color:#687cf2!important;background:#2b2e38!important}
.ps-community-editor-banner-remove{display:grid!important;flex:0 0 32px!important;width:32px!important;height:32px!important;place-items:center!important;border:1px solid #444850!important;border-radius:8px!important;background:#292b31!important;color:#ed777d!important}
.ps-community-poster-collection-modal{min-height:320px!important}
.ps-community-poster-collection-empty{display:flex!important;min-height:205px!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:10px!important;padding:26px!important;text-align:center!important;color:#aeb7c8!important}
.ps-community-poster-collection-empty>svg{color:#9eabc1!important;opacity:.8!important}
.ps-community-poster-collection-empty>strong{color:#eef1f6!important;font-size:14px!important}
.ps-community-poster-collection-empty>p{max-width:320px!important;margin:0!important;color:#9ea8b9!important;font-size:11px!important;line-height:1.55!important}

/* Discord-like inline biography: no inner scrollbar, natural height and readable input surface. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar {
  border-color: var(--editor-card, #B7D7C3) !important;
  box-shadow: 0 0 0 2px var(--editor-card, #B7D7C3), 0 7px 18px #0006 !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot {
  border: 4px solid var(--editor-card, #B7D7C3) !important;
  background: #23a55a !important;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 12%) !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot.is-online::before,
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot.is-online::after {
  display:none !important; content:none !important; animation:none !important; box-shadow:none !important;
}

/* Discord-style presence: green center with a theme-colored outer ring. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar {
  border-color: var(--editor-card, #B7D7C3) !important;
  box-shadow: 0 0 0 2px var(--editor-card, #B7D7C3), 0 7px 18px #0006 !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot,
.ps-community-name-style-profile-preview .ps-community-editor-presence-dot,
.ps-community-status-profile-preview .ps-community-editor-presence-dot {
  width: 18px !important;
  height: 18px !important;
  border: 4px solid var(--editor-card, var(--status-theme, #B7D7C3)) !important;
  outline: 0 !important;
  background: #23a55a !important;
  box-shadow: none !important;
}
.ps-community-name-style-profile-preview > .ps-community-status-preview-avatar {
  border-color: var(--status-theme, #B7D7C3) !important;
  box-shadow: 0 0 0 2px var(--status-theme, #B7D7C3), 0 6px 18px #0006 !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot.is-offline,
.ps-community-name-style-profile-preview .ps-community-editor-presence-dot.is-offline,
.ps-community-status-profile-preview .ps-community-editor-presence-dot.is-offline {
  background: #747b86 !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot::before,
.ps-community-editor-preview-card .ps-community-editor-preview-avatar > .ps-community-editor-presence-dot::after,
.ps-community-name-style-profile-preview .ps-community-editor-presence-dot::before,
.ps-community-name-style-profile-preview .ps-community-editor-presence-dot::after,
.ps-community-status-profile-preview .ps-community-editor-presence-dot::before,
.ps-community-status-profile-preview .ps-community-editor-presence-dot::after {
  display: none !important;
  content: none !important;
  box-shadow: none !important;
}
/* Theme-aware identity ink: the name and account handle follow the card contrast. */
.ps-community-editor-preview-card .ps-community-editor-preview-name-static.color-default {
  color: var(--editor-theme-text, #f2f3f5) !important;
  -webkit-text-fill-color: var(--editor-theme-text, #f2f3f5) !important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-tag {
  color: var(--editor-theme-text, #f2f3f5) !important;
}
.ps-community-name-style-profile-preview .ps-community-name-style-profile-copy {
  color: var(--status-theme-text, #202126) !important;
}
.ps-community-name-style-profile-preview .ps-community-name-style-profile-copy > strong.color-default {
  color: var(--status-theme-text, #202126) !important;
  -webkit-text-fill-color: var(--status-theme-text, #202126) !important;
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
}

/* Compact avatar chooser and first-party banner asset controls. */
.ps-community-avatar-picker-overlay{position:fixed!important;inset:0!important;z-index:10090!important;display:grid!important;place-items:center!important;padding:20px!important;background:rgb(0 0 0 / 72%)!important;backdrop-filter:blur(9px)!important}
.ps-community-avatar-picker-modal{width:min(430px,calc(100vw - 32px))!important;overflow:hidden!important;border:1px solid #3b3e46!important;border-radius:14px!important;background:#202127!important;color:#f2f3f5!important;box-shadow:0 24px 80px #0009!important}
.ps-community-avatar-picker-modal>header{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:14px!important;padding:20px 20px 17px!important;border-bottom:1px solid #34363d!important}
.ps-community-avatar-picker-modal>header span{display:block!important;margin-bottom:6px!important;color:#969daa!important;font:750 8px/1.2 var(--font-silkscreen),monospace!important;letter-spacing:.12em!important}
.ps-community-avatar-picker-modal>header h2{margin:0!important;color:#f2f3f5!important;font-size:19px!important;font-weight:750!important}
.ps-community-avatar-picker-modal>header p{margin:5px 0 0!important;color:#aeb4bf!important;font-size:12px!important}
.ps-community-avatar-picker-modal>header>button{display:grid!important;width:32px!important;height:32px!important;place-items:center!important;border:1px solid #3b3e46!important;border-radius:8px!important;background:#2b2d31!important;color:#c7ccd4!important}
.ps-community-avatar-picker-options{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;padding:18px 20px 20px!important}
.ps-community-avatar-picker-options>button{display:grid!important;min-height:144px!important;align-content:center!important;justify-items:center!important;gap:8px!important;padding:16px 12px!important;border:1px solid #3b3e46!important;border-radius:11px!important;background:linear-gradient(180deg,#2b2d34,#25272d)!important;color:#e5e7eb!important;transition:border-color 120ms ease,background 120ms ease,transform 120ms ease!important}
.ps-community-avatar-picker-options>button:hover{transform:translateY(-2px)!important;border-color:#7884a0!important;background:#31343c!important}
.ps-community-avatar-picker-options>button>span{display:grid!important;width:44px!important;height:44px!important;place-items:center!important;border:1px solid #4d5360!important;border-radius:12px!important;background:#1e2026!important;color:#c6d1ff!important}
.ps-community-avatar-picker-options strong{font-size:13px!important;font-weight:750!important}
.ps-community-avatar-picker-options small{color:#9ca3af!important;font-size:10px!important}
.ps-community-avatar-picker-modal>footer{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:12px 20px!important;border-top:1px solid #34363d!important;color:#9299a5!important;font-size:10px!important}
.ps-community-avatar-picker-modal>footer button{padding:7px 12px!important;border:1px solid #454954!important;border-radius:7px!important;background:#2b2d31!important;color:#e4e6eb!important}
.ps-community-editor-banner-tools{display:grid!important;gap:9px!important}
.ps-community-editor-banner-current{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;padding:8px!important;border:1px solid #373940!important;border-radius:9px!important;background:#25272d!important}
.ps-community-editor-banner-current-preview{flex:0 0 72px!important;width:72px!important;height:40px!important;border-radius:6px!important;background:#182a2e!important;background-size:cover!important;background-position:center!important}
.ps-community-editor-banner-current>span:nth-child(2){display:grid!important;min-width:0!important;gap:3px!important}
.ps-community-editor-banner-current strong{color:#e4e6eb!important;font-size:11px!important}
.ps-community-editor-banner-current small{color:#9da4b0!important;font-size:9px!important}
.ps-community-editor-banner-current>button{margin-left:auto!important;display:grid!important;width:29px!important;height:29px!important;place-items:center!important;border:1px solid #444850!important;border-radius:7px!important;background:#292b31!important;color:#ed777d!important}
.ps-community-editor-banner-upload-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
.ps-community-editor-banner-upload-button{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-height:36px!important;padding:7px!important;border:1px solid #424650!important;border-radius:8px!important;background:#2b2d31!important;color:#e4e6eb!important;font-size:10px!important;font-weight:700!important;transition:background 100ms ease,border-color 100ms ease!important}
.ps-community-editor-banner-upload-button:hover{background:#363941!important;border-color:#707987!important}
.ps-community-editor-banner-upload-button:disabled{opacity:.55!important;cursor:wait!important}

/* Thin, hover-only scrollbar on the left settings rail. */
.ps-community-editor-settings-sidebar{overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:none!important;scrollbar-color:transparent transparent!important}
.ps-community-editor-settings-sidebar:hover{scrollbar-width:thin!important;scrollbar-color:#59616d transparent!important}
.ps-community-editor-settings-sidebar::-webkit-scrollbar{width:5px!important;background:transparent!important}
.ps-community-editor-settings-sidebar::-webkit-scrollbar-thumb{border-radius:8px!important;background:transparent!important}
.ps-community-editor-settings-sidebar:hover::-webkit-scrollbar-thumb{background:#59616d!important}
.ps-community-editor-settings-sidebar::-webkit-scrollbar-track{background:transparent!important}

/* Professional, compact avatar cropper. */
.ps-community-avatar-crop-modal{width:min(480px,calc(100vw - 28px))!important;padding:0!important;overflow:hidden!important;border:1px solid #3d414a!important;border-radius:15px!important;background:#202127!important;box-shadow:0 24px 80px #0009!important}
.ps-community-avatar-crop-modal>header{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:17px 19px!important;border-bottom:1px solid #34363d!important}
.ps-community-avatar-crop-modal>header span{display:block!important;margin-bottom:5px!important;color:#969daa!important;font:750 8px/1.2 var(--font-silkscreen),monospace!important;letter-spacing:.12em!important}
.ps-community-avatar-crop-modal>header h2{margin:0!important;color:#f2f3f5!important;font-size:18px!important;font-weight:750!important}
.ps-community-avatar-crop-stage{position:relative!important;width:min(320px,calc(100vw - 78px))!important;height:min(320px,calc(100vw - 78px))!important;margin:20px auto 16px!important;overflow:hidden!important;border:1px solid #454954!important;border-radius:12px!important;background:radial-gradient(circle,#2d3038,#17191f)!important;box-shadow:inset 0 0 0 1px #ffffff08!important}
.ps-community-avatar-crop-stage>img{width:100%!important;height:100%!important;object-fit:contain!important}
.ps-community-avatar-crop-stage>span{position:absolute!important;inset:0!important;border:1px solid rgb(255 255 255 / 12%)!important;border-radius:50%!important;box-shadow:0 0 0 999px rgb(0 0 0 / 23%),inset 0 0 0 1px rgb(255 255 255 / 15%)!important;pointer-events:none!important}
.ps-community-avatar-crop-controls{display:grid!important;gap:12px!important;padding:0 22px 18px!important}
.ps-community-avatar-crop-controls label{display:grid!important;grid-template-columns:116px minmax(0,1fr)!important;align-items:center!important;gap:12px!important;color:#b8bec8!important;font-size:11px!important}
.ps-community-avatar-crop-controls input[type=range]{width:100%!important;accent-color:#7b8cff!important}
.ps-community-avatar-crop-modal>p{margin:0!important;padding:0 22px 15px!important;color:#9299a5!important;font-size:10px!important}
.ps-community-avatar-crop-modal>footer{display:flex!important;justify-content:flex-end!important;gap:8px!important;padding:13px 18px!important;border-top:1px solid #34363d!important;background:#1c1e23!important}
.ps-community-avatar-crop-modal>footer button{min-height:34px!important;padding:7px 13px!important;border:1px solid #424650!important;border-radius:8px!important;background:#2b2d31!important;color:#e4e6eb!important;font-size:11px!important;font-weight:700!important}
.ps-community-avatar-crop-modal>footer button.is-primary{border-color:#6476f1!important;background:#5668df!important;color:white!important}
@media(max-width:560px){.ps-community-avatar-picker-options{grid-template-columns:1fr!important}.ps-community-avatar-picker-options>button{min-height:100px!important}.ps-community-avatar-crop-controls label{grid-template-columns:92px minmax(0,1fr)!important}}
/* The Name Atelier custom colour panel is placed in the grid below the swatches,
   never floated above the typography controls. */
.ps-community-name-custom-picker-root{position:relative!important;display:flex!important;flex:1 1 auto!important;min-width:0!important}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker-root>.ps-community-name-custom-color{width:100%!important;min-width:0!important}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker{position:static!important;z-index:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;max-width:none!important;grid-column:1/-1!important;grid-row:2!important;margin:0!important;}

/* Refined avatar chooser and cropper: compact, media-led and keyboard-friendly. */
.ps-community-editor-display-name-input{display:block!important;width:100%!important;min-height:40px!important;padding:0 12px!important;border:1px solid #3a3d45!important;border-radius:9px!important;background:#1b1d22!important;color:#f2f3f5!important;font-size:13px!important;font-weight:600!important;outline:none!important;transition:border-color .14s ease,box-shadow .14s ease!important}
.ps-community-editor-display-name-input:focus{border-color:#697cf1!important;box-shadow:0 0 0 3px rgb(88 101 242 / 17%)!important}
.ps-community-avatar-picker-modal{width:min(500px,calc(100vw - 32px))!important;border-radius:16px!important;background:#202127!important}
.ps-community-avatar-picker-modal>header{align-items:center!important;padding:20px 22px!important}
.ps-community-avatar-picker-modal>header h2{font-size:19px!important;letter-spacing:-.02em!important}
.ps-community-avatar-picker-modal>header p{margin-top:5px!important;font-size:12px!important}
.ps-community-avatar-picker-options{grid-template-columns:1fr 1fr!important;gap:12px!important;padding:18px 20px 20px!important}
.ps-community-avatar-picker-options>button{position:relative!important;display:grid!important;grid-template-columns:76px minmax(0,1fr) 30px!important;align-items:center!important;justify-items:stretch!important;gap:12px!important;min-height:104px!important;padding:12px!important;border:1px solid #3a3d46!important;border-radius:12px!important;background:#272930!important;text-align:left!important}
.ps-community-avatar-picker-options>button:hover{transform:none!important;border-color:#687cf2!important;background:#2b2e38!important}
.ps-community-avatar-choice-art{position:relative!important;display:grid!important;width:76px!important;height:76px!important;place-items:center!important;overflow:hidden!important;border:1px solid #454a55!important;border-radius:10px!important;background:#1a1c21!important;color:#c9d0dd!important}
.ps-community-avatar-choice-art>img{width:100%!important;height:100%!important;object-fit:cover!important}
.ps-community-avatar-choice-art.is-gif-art{background:linear-gradient(140deg,#353849,#242631)!important;color:#e2e6f7!important}
.ps-community-avatar-choice-art.is-gif-art i{position:absolute!important;right:5px!important;bottom:5px!important;padding:2px 5px!important;border-radius:4px!important;background:#5865f2!important;color:#fff!important;font-size:9px!important;font-style:normal!important;font-weight:800!important;letter-spacing:.04em!important}
.ps-community-avatar-choice-copy{display:grid!important;gap:5px!important;min-width:0!important}
.ps-community-avatar-choice-copy strong{color:#f2f3f5!important;font-size:13px!important;font-weight:750!important}
.ps-community-avatar-choice-copy small{color:#9da4b1!important;font-size:10px!important;line-height:1.3!important}
.ps-community-avatar-choice-arrow{display:grid!important;width:28px!important;height:28px!important;place-items:center!important;border:1px solid #414652!important;border-radius:50%!important;background:#202229!important;color:#bfc6d4!important}
.ps-community-avatar-picker-progress{display:flex!important;align-items:center!important;gap:8px!important;padding:0 22px 12px!important;color:#c4c9d3!important;font-size:11px!important}
.ps-community-avatar-picker-progress svg{animation:ps-community-avatar-spin .9s linear infinite!important}
@keyframes ps-community-avatar-spin{to{transform:rotate(360deg)}}
.ps-community-avatar-picker-modal>footer{justify-content:flex-end!important}
.ps-community-avatar-picker-modal>footer button{min-width:84px!important;min-height:34px!important;border-radius:8px!important}
.ps-community-avatar-crop-modal{width:min(540px,calc(100vw - 28px))!important;border-radius:16px!important}
.ps-community-avatar-crop-modal>header{align-items:center!important;padding:18px 21px!important}
.ps-community-avatar-crop-modal>header h2{font-size:19px!important;letter-spacing:-.02em!important}
.ps-community-avatar-crop-modal>header p{margin:4px 0 0!important;color:#969eab!important;font-size:11px!important}
.ps-community-avatar-crop-stage{width:min(340px,calc(100vw - 84px))!important;height:min(340px,calc(100vw - 84px))!important;margin:22px auto 18px!important;border:1px solid #4b5260!important;border-radius:50%!important;background:#121419!important;touch-action:none!important;cursor:grab!important;user-select:none!important}
.ps-community-avatar-crop-stage:active{cursor:grabbing!important}
.ps-community-avatar-crop-stage>img{width:100%!important;height:100%!important;object-fit:cover!important;pointer-events:none!important;user-select:none!important}
.ps-community-avatar-crop-stage>span{border:2px solid rgb(255 255 255 / 85%)!important;border-radius:50%!important;box-shadow:0 0 0 999px rgb(0 0 0 / 48%),inset 0 0 0 1px rgb(0 0 0 / 20%)!important}
.ps-community-avatar-crop-controls{padding:0 26px 20px!important}
.ps-community-avatar-crop-controls label{grid-template-columns:54px minmax(0,1fr)!important;font-size:12px!important}
.ps-community-avatar-crop-controls input[type=range]{accent-color:#5865f2!important;cursor:pointer!important;touch-action:pan-y!important}
.ps-community-avatar-crop-modal>footer{padding:15px 20px!important}
.ps-community-avatar-crop-modal>footer button{min-height:38px!important;padding-inline:16px!important;border-radius:9px!important}
.ps-community-avatar-crop-modal>footer button.is-primary{border-color:#5865f2!important;background:#5865f2!important}
@media(max-width:560px){
 .ps-community-avatar-picker-options{grid-template-columns:1fr!important}
 .ps-community-avatar-picker-options>button{min-height:92px!important}
 .ps-community-avatar-choice-art{width:64px!important;height:64px!important}
 .ps-community-avatar-picker-options>button{grid-template-columns:64px minmax(0,1fr) 28px!important}
 .ps-community-avatar-crop-stage{width:min(300px,calc(100vw - 72px))!important;height:min(300px,calc(100vw - 72px))!important}
}

/* Banner media actions use the same compact image-led treatment as the avatar chooser. */
.ps-community-editor-banner-upload-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}
.ps-community-editor-banner-upload-button{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;min-height:54px!important;padding:8px 10px!important;border:1px solid #3b3f49!important;border-radius:10px!important;background:#252830!important;color:#e6e8ed!important;font-size:11px!important;font-weight:700!important;text-align:left!important}
.ps-community-editor-banner-upload-button:hover{border-color:#687cf2!important;background:#2b2e38!important}
.ps-community-editor-banner-upload-button>svg{flex:0 0 32px!important;width:32px!important;height:32px!important;padding:8px!important;border:1px solid #454b59!important;border-radius:8px!important;background:#1c1f26!important;color:#c6ceea!important}
.ps-community-editor-banner-upload-button:disabled{opacity:.55!important;cursor:wait!important}
@media(max-width:560px){.ps-community-editor-banner-upload-actions{grid-template-columns:1fr!important}}

/* Name Atelier: compact color and motion controls with a synchronized live preview. */
.ps-community-name-color-style-group{display:grid!important;gap:10px!important;padding-bottom:16px!important;border-bottom:1px solid #343740!important}
.ps-community-name-style-heading{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;color:#e7e9ef!important;font-size:12px!important;font-weight:750!important}
.ps-community-name-style-heading>span{color:#8e97a8!important;font-size:9px!important;font-weight:750!important;letter-spacing:.08em!important}
.ps-community-name-preset-grid{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:9px!important}
.ps-community-name-preset-swatch{height:34px!important;min-height:34px!important;border-radius:8px!important}
.ps-community-name-preset-swatch:hover,.ps-community-name-spectrum-swatch:hover{transform:translateY(-1px)!important}
.ps-community-name-custom-picker-root{width:100%!important}
.ps-community-name-custom-picker-root>.ps-community-name-custom-color{width:100%!important;min-height:39px!important;grid-template-columns:30px minmax(0,1fr)!important;justify-items:start!important;gap:9px!important;padding:0 10px!important;border-radius:9px!important}
.ps-community-name-custom-gradient-stops{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important}
.ps-community-name-color-auto-note{margin:0!important;color:#9ca4b2!important;font-size:10px!important;line-height:1.5!important}
.ps-community-name-style-group>.ps-community-name-animation-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important}
.ps-community-name-style-group>.ps-community-name-animation-grid>.ps-community-name-animation-option{min-height:108px!important}
.ps-community-name-style-group>.ps-community-name-animation-grid>.ps-community-name-animation-option>.ps-community-name-animation-stage{display:flex!important;align-items:center!important;justify-content:center!important;min-width:0!important;min-height:48px!important;max-width:100%!important;overflow:hidden!important}
.ps-community-name-animation-sample{display:inline-block!important;width:max-content!important;max-width:100%!important;font-size:17px!important;line-height:1.1!important;white-space:nowrap!important}
@media(max-width:560px){
 .ps-community-name-preset-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
 .ps-community-name-style-group>.ps-community-name-animation-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
 .ps-community-name-custom-gradient-stops{grid-template-columns:1fr!important}
}

/* Refined profile controls: compact Discord-like choices with no trailing camera/plus affordances. */
.ps-community-avatar-picker-modal { width:min(640px,calc(100vw - 32px))!important; }
.ps-community-avatar-picker-options {
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:14px!important;padding:18px 24px 20px!important;min-width:0!important;
}
.ps-community-avatar-picker-options>button {
  display:grid!important;grid-template-columns:64px minmax(0,1fr)!important;
  align-items:center!important;justify-items:stretch!important;gap:14px!important;
  min-width:0!important;min-height:112px!important;height:auto!important;
  padding:14px!important;overflow:hidden!important;text-align:left!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-art {
  width:64px!important;height:64px!important;flex:0 0 64px!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy {
  display:flex!important;flex-direction:column!important;align-items:flex-start!important;
  justify-content:center!important;gap:6px!important;width:100%!important;min-width:0!important;
  overflow:visible!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy strong {
  display:block!important;width:100%!important;max-width:100%!important;
  color:#f3f5f8!important;font-size:14px!important;font-weight:750!important;
  line-height:1.25!important;white-space:normal!important;overflow-wrap:normal!important;
  word-break:normal!important;text-overflow:clip!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy small {
  display:block!important;width:100%!important;max-width:100%!important;
  color:#aeb7c5!important;font-size:11px!important;line-height:1.35!important;
  white-space:normal!important;overflow-wrap:break-word!important;word-break:normal!important;
}
.ps-community-avatar-choice-art.is-collection-art {color:#c3cde0!important}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-arrow {display:none!important}
.ps-community-avatar-picker-modal>footer {justify-content:flex-end!important;padding:12px 24px 18px!important}
.ps-community-avatar-picker-modal>footer button {min-width:92px!important}
@media(max-width:620px) {
  .ps-community-avatar-picker-options {grid-template-columns:1fr!important;padding-inline:16px!important}
  .ps-community-avatar-picker-options>button {min-height:88px!important}
}

/* Poster decoration shows only the actual banner preview. Clicking it opens
   the image / collection choices; no generic title, plus or description sits beside it. */
.ps-community-editor-banner-current-is-preview {
  position:relative!important;display:block!important;width:100%!important;height:112px!important;
  min-height:112px!important;margin:0!important;padding:0!important;overflow:hidden!important;
  border:1px solid #3c424d!important;border-radius:11px!important;background:#18282b!important;
  cursor:pointer!important;
}
.ps-community-editor-banner-current-is-preview:hover {border-color:#687cf2!important;filter:brightness(1.06)!important}
.ps-community-editor-banner-current-is-preview .ps-community-editor-banner-current-preview {
  position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;
  min-height:0!important;border:0!important;border-radius:0!important;background-size:cover!important;background-position:center!important;
}
.ps-community-editor-banner-current-is-preview:focus-visible {outline:2px solid #7888ff!important;outline-offset:2px!important}

/* Name is an always-present inline field: focusing it cannot change the layout
   or push the pronoun row down. Its visual language matches the pronoun input. */
.ps-community-editor-preview-name-input {
  display:block!important;box-sizing:border-box!important;width:max-content!important;max-width:100%!important;
  min-width:8ch!important;min-height:34px!important;height:34px!important;margin:0 0 4px!important;
  padding:2px 4px!important;border:1px solid transparent!important;border-radius:6px!important;
  outline:none!important;background:transparent!important;box-shadow:none!important;
  color:var(--editor-theme-text,#f2f3f5)!important;
  -webkit-text-fill-color:currentColor!important;
  caret-color:var(--name-solid-color,var(--editor-theme-text,#f2f3f5))!important;
  font-size:27px!important;font-weight:850!important;
  line-height:1.15!important;letter-spacing:-.025em!important;text-align:left!important;
  transition:border-color .12s ease,background .12s ease!important;
}
.ps-community-editor-preview-name-input::placeholder {color:var(--editor-theme-text,#f2f3f5)!important;opacity:.68!important}
.ps-community-editor-preview-name-input:hover {border-color:color-mix(in srgb,var(--editor-theme-text,#fff) 25%,transparent)!important}
.ps-community-editor-preview-name-input:focus {
  border-color:color-mix(in srgb,var(--editor-theme-text,#fff) 42%,transparent)!important;
  background-color:transparent!important;
  outline:none!important;box-shadow:none!important;
}

/* Theme contrast is one decision for both ends of the gradient and every text
   block on the card, never white above and black below. */
.ps-community-editor-preview-card {
  --editor-theme-body-text:var(--editor-theme-text,#f2f3f5)!important;
  --editor-theme-bottom-text:var(--editor-theme-text,#f2f3f5)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns,

.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,
.ps-community-editor-preview-card .ps-community-editor-preview-meta,
.ps-community-editor-preview-card .ps-community-editor-preview-meta *,
.ps-community-editor-preview-card .ps-community-editor-bio-display,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row *,
.ps-community-editor-preview-card .ps-community-editor-preview-identity-line {
  color:var(--editor-theme-text,#f2f3f5)!important;
  -webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading small,
.ps-community-editor-preview-card .ps-community-editor-preview-meta strong {
  color:var(--editor-theme-text,#f2f3f5)!important;
}

/* Larger Discord-like online dot in the large profile previews. Its ring uses
   exactly the avatar border colour, with no black outline or shadow. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  right:-6px!important;bottom:-2px!important;width:24px!important;height:24px!important;
  box-sizing:border-box!important;border:5px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;
  border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important;
}
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  right:3px!important;bottom:3px!important;width:20px!important;height:20px!important;
  box-sizing:border-box!important;border:4px solid var(--status-theme,#B7D7C3)!important;
  border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important;
}
.ps-community-name-member-avatar {position:relative!important;overflow:visible!important}
.ps-community-name-member-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:-2px!important;bottom:-1px!important;width:13px!important;height:13px!important;
  border:3px solid #2b2d34!important;border-radius:50%!important;background:#23a55a!important;box-shadow:none!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-name-member-avatar>.ps-community-editor-presence-dot.is-offline {background:#747b86!important}

/* Name Atelier: same left-aligned identity placement in member list and chat. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-row {
  display:flex!important;align-items:center!important;justify-content:flex-start!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy {
  display:flex!important;flex:1 1 auto!important;align-items:center!important;
  justify-content:flex-start!important;min-width:0!important;margin:0!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy>strong.community-member-nameplate {
  display:block!important;width:max-content!important;max-width:100%!important;
  margin:0!important;text-align:left!important;
  color:var(--status-theme-text,#f2f3f5)!important;
  -webkit-text-fill-color:var(--status-theme-text,#f2f3f5)!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-chat-meta>strong.community-chat-author.color-default {
  color:var(--status-theme-text,#f2f3f5)!important;
  -webkit-text-fill-color:var(--status-theme-text,#f2f3f5)!important;
}

/* Eight equal swatches in one row: pipette + seven colours, no squeezed vertical bars. */
.ps-community-name-color-style-group .ps-community-name-colors-row {
  display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;
  align-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-custom-picker-root {
  display:block!important;width:auto!important;min-width:0!important;max-width:none!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-custom-picker-root>.ps-community-name-custom-color {
  display:grid!important;grid-template-columns:1fr!important;place-items:center!important;
  width:100%!important;height:42px!important;min-height:42px!important;margin:0!important;
  padding:0!important;border:1px solid #48505e!important;border-radius:9px!important;
  background:#252a34!important;box-shadow:none!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-copy {display:none!important}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-mark {
  display:grid!important;place-items:center!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-preset-grid {
  display:contents!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-preset-swatch {
  display:block!important;width:100%!important;height:42px!important;min-height:42px!important;
  min-width:0!important;margin:0!important;padding:0!important;border-radius:9px!important;
}
@media(max-width:620px) {
  .ps-community-name-color-style-group .ps-community-name-colors-row {gap:5px!important}
}

/* Last cascade layer: consistent theme contrast and clean Name Atelier cards. */
.ps-community-editor-preview-card .ps-community-editor-preview-name-edit-trigger,
.ps-community-editor-preview-card .ps-community-editor-preview-name-edit-trigger .ps-community-editor-preview-name-static.color-default,
.ps-community-editor-preview-card .ps-community-editor-preview-name-inline-input,
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,
.ps-community-editor-preview-card .ps-community-editor-preview-meta,
.ps-community-editor-preview-card .ps-community-editor-bio-display {
  color:var(--editor-theme-text,#f2f3f5)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-name-edit-trigger .ps-community-editor-preview-name-static.color-default,
.ps-community-editor-preview-card .ps-community-editor-preview-name-inline-input,
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns {
  -webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-meta strong,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading small {
  color:var(--editor-theme-body-text,var(--editor-theme-text,#f2f3f5))!important;
}
/* Shared 18px Discord-style presence marker for all large profile previews. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:-4px!important;bottom:0!important;
  width:18px!important;height:18px!important;box-sizing:border-box!important;
  border:4px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;
  border-radius:50%!important;background:#23a55a!important;box-shadow:none!important;outline:0!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline {background:#747b86!important}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot::before,
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot::after,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::before,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::after,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::before,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot::after {display:none!important;content:none!important;box-shadow:none!important}
/* Remove the two dividers from the image/collection chooser. */
.ps-community-avatar-picker-modal>header {border-bottom:0!important}
.ps-community-avatar-picker-modal>footer {border-top:0!important}
/* Keep the collection as an explicit empty state until real posters are added. */
.ps-community-poster-collection-empty {min-height:205px!important}
.ps-community-editor-banner-current.is-action {cursor:pointer!important}
/* The animation preview is one open stage, not a second framed card inside a card. */
.ps-community-name-style-group>.ps-community-name-animation-grid>.ps-community-name-animation-option>.ps-community-name-animation-stage {
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:48px!important;min-height:48px!important;margin:0!important;
  padding:0!important;border:0!important;border-radius:0!important;outline:0!important;
  background:transparent!important;box-shadow:none!important;overflow:visible!important;
}
.ps-community-name-style-group>.ps-community-name-animation-grid>.ps-community-name-animation-option>.ps-community-name-animation-stage::before,
.ps-community-name-style-group>.ps-community-name-animation-grid>.ps-community-name-animation-option>.ps-community-name-animation-stage::after {
  display:none!important;content:none!important;border:0!important;background:transparent!important;box-shadow:none!important;
}
.ps-community-name-style-group .ps-community-name-animation-option .ps-community-name-preview-live {
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  min-width:0!important;min-height:28px!important;height:auto!important;max-height:none!important;
  margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
  outline:0!important;background:transparent!important;box-shadow:none!important;overflow:visible!important;
}
.ps-community-name-style-group .ps-community-name-animation-option .ps-decrypted-name {color:var(--name-solid-color,#F2F3F5)!important}
.ps-community-name-style-group .ps-community-name-animation-option .ps-decrypted-cell.is-encrypted,
.ps-community-name-style-group .ps-community-name-animation-option .ps-decrypted-glyph {color:var(--name-solid-color,#F2F3F5)!important;-webkit-text-fill-color:currentColor!important}
.ps-community-name-style-group .ps-community-name-animation-option.effect-plain .ps-decrypted-cell.is-revealed::after {
  color:var(--name-solid-color,#F2F3F5)!important;-webkit-text-fill-color:currentColor!important;
}
.ps-community-name-colors-row {display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
.ps-community-name-colors-row>.ps-community-name-custom-picker-root {flex:0 0 44px!important;width:44px!important;min-width:44px!important}
.ps-community-name-colors-row>.ps-community-name-custom-picker-root>.ps-community-name-custom-color {
  width:44px!important;height:42px!important;min-height:42px!important;
  display:grid!important;grid-template-columns:1fr!important;place-items:center!important;
  padding:0!important;border-radius:9px!important;background:#252a34!important;
}
.ps-community-name-colors-row .ps-community-name-custom-color-copy {display:none!important}
.ps-community-name-colors-row .ps-community-name-custom-color-mark {display:grid!important;place-items:center!important}
.ps-community-name-colors-row>.ps-community-name-preset-grid {
  display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;
  flex:1 1 auto!important;min-width:0!important;gap:7px!important;
}
.ps-community-name-colors-row .ps-community-name-preset-swatch {height:42px!important;min-height:42px!important;border-radius:9px!important}


/* Final scale pass for the Discord-style presence ring on all large avatar previews. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:-6px!important;bottom:-2px!important;
  width:24px!important;height:24px!important;box-sizing:border-box!important;
  border:5px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;
  border-radius:50%!important;background:#23a55a!important;
  outline:0!important;box-shadow:none!important;
}
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:-6px!important;bottom:-2px!important;
  width:24px!important;height:24px!important;box-sizing:border-box!important;
  border:5px solid var(--status-theme,#B7D7C3)!important;
  border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline {background:#747b86!important}
.ps-community-name-member-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:-2px!important;bottom:-1px!important;
  width:15px!important;height:15px!important;border:3px solid #2b2d34!important;
  border-radius:50%!important;background:#23a55a!important;box-shadow:none!important;
}

/* The live name input behaves like the pronoun field: fixed line box, text-sized
   width, no layout jump when focused, and an understated focus treatment. */
.ps-community-editor-preview-name-input {
  width:auto!important;min-width:8ch!important;max-width:100%!important;
  height:34px!important;min-height:34px!important;margin:0 0 4px!important;
  padding:3px 4px!important;border:1px solid transparent!important;border-radius:6px!important;
  background:transparent!important;outline:none!important;box-shadow:none!important;
  font-size:27px!important;font-weight:850!important;line-height:1.15!important;
}
.ps-community-editor-preview-name-input:hover {
  border-color:color-mix(in srgb,var(--editor-theme-text,#fff) 25%,transparent)!important;
}
.ps-community-editor-preview-name-input:focus {
  border-color:color-mix(in srgb,var(--editor-theme-text,#fff) 42%,transparent)!important;
  background:color-mix(in srgb,var(--editor-theme-text,#fff) 5%,transparent)!important;
  outline:none!important;box-shadow:none!important;
}

/* Apply theme-selected ink to the whole profile card, including the lower
   member-since block; do not independently choose white/black per gradient stop. */
.ps-community-editor-preview-card .ps-community-editor-preview-name-input,
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,
.ps-community-editor-preview-card .ps-community-editor-preview-meta,
.ps-community-editor-preview-card .ps-community-editor-preview-meta *,
.ps-community-editor-preview-card .ps-community-editor-bio-display,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row *,
.ps-community-editor-preview-card .ps-community-editor-preview-identity-line {
  color:var(--editor-theme-text,#f2f3f5)!important;
  -webkit-text-fill-color:var(--editor-theme-text,#f2f3f5)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-tag {
  background:color-mix(in srgb,var(--editor-theme-text,#fff) 12%,transparent)!important;
  border-color:color-mix(in srgb,var(--editor-theme-text,#fff) 24%,transparent)!important;
  text-shadow:none!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-meta strong,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading small {
  color:var(--editor-theme-text,#f2f3f5)!important;
}
/* A hairline opposite-colour glyph edge preserves legibility on mixed light/dark gradients. */
.ps-community-editor-preview-card .ps-community-editor-preview-name-input,
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,
.ps-community-editor-preview-card .ps-community-editor-preview-meta,
.ps-community-editor-preview-card .ps-community-editor-preview-meta *,
.ps-community-editor-preview-card .ps-community-editor-bio-display,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row * {
  -webkit-text-stroke:0 transparent!important;text-shadow:none!important;
}

/* One aligned, left-anchored member name row, using the same text treatment as chat. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-row {
  display:flex!important;align-items:center!important;justify-content:flex-start!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy {
  display:flex!important;flex:1 1 auto!important;align-items:center!important;
  justify-content:flex-start!important;min-width:0!important;margin:0!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy>.community-member-nameplate {
  display:inline-block!important;width:max-content!important;max-width:100%!important;
  margin:0!important;text-align:left!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-style-profile-copy>.ps-community-name-preview-live.color-default.effect-plain,
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy>.community-member-nameplate.color-default.effect-plain,
.ps-community-picker-modal.is-name-style-modal .ps-community-name-chat-meta>.community-chat-author.color-default.effect-plain {
  color:var(--status-theme-text,#202126)!important;
  -webkit-text-fill-color:var(--status-theme-text,#202126)!important;
}


/* Stable editor geometry: the settings pane owns its scroll area. */
.ps-community-editor-overlay {
  position:fixed!important;inset:0!important;display:grid!important;place-items:center!important;
  padding:16px!important;overflow:hidden!important;overscroll-behavior:contain!important;
}
.ps-community-editor-v2 {
  display:flex!important;flex-direction:column!important;
  width:min(1150px,calc(100vw - 32px))!important;
  height:min(980px,calc(100dvh - 32px))!important;
  max-height:calc(100dvh - 32px)!important;min-width:0!important;min-height:0!important;
  overflow:hidden!important;overscroll-behavior:contain!important;
}
.ps-community-editor-main {
  display:flex!important;flex:1 1 auto!important;flex-direction:column!important;
  width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;
  overflow:hidden!important;
}
.ps-community-editor-workspace-discord {
  display:grid!important;grid-template-columns:minmax(248px,275px) minmax(0,1fr)!important;
  flex:1 1 auto!important;width:100%!important;min-width:0!important;min-height:0!important;
  overflow:hidden!important;
}
.ps-community-editor-settings-sidebar {
  position:relative!important;align-self:stretch!important;
  width:100%!important;height:100%!important;max-height:100%!important;min-height:0!important;
  min-width:0!important;overflow-x:hidden!important;overflow-y:auto!important;
  overscroll-behavior-y:contain!important;scrollbar-gutter:stable!important;
  scrollbar-width:thin!important;scrollbar-color:transparent transparent!important;
  -webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;
  pointer-events:auto!important;
}
.ps-community-editor-settings-sidebar::-webkit-scrollbar {width:9px!important}
.ps-community-editor-settings-sidebar::-webkit-scrollbar-track {background:transparent!important}
.ps-community-editor-settings-sidebar::-webkit-scrollbar-thumb {
  min-height:36px!important;border:2px solid transparent!important;border-radius:999px!important;
  background:transparent!important;background-clip:padding-box!important;
  transition:background-color 140ms ease!important;
}
.ps-community-editor-settings-sidebar:hover,
.ps-community-editor-settings-sidebar:focus-within {
  scrollbar-color:#59616d transparent!important;
}
.ps-community-editor-settings-sidebar:hover::-webkit-scrollbar-thumb,
.ps-community-editor-settings-sidebar:focus-within::-webkit-scrollbar-thumb,
.ps-community-editor-settings-sidebar::-webkit-scrollbar-thumb:active {
  background:#59616d!important;
}
.ps-community-editor-preview-column {
  min-width:0!important;min-height:0!important;height:100%!important;
  overflow:auto!important;overscroll-behavior:contain!important;
}
.ps-community-editor-theme-picker-anchor {position:relative!important;z-index:12!important;min-width:0!important}
.ps-community-editor-sidebar-color-picker {
  box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;
}
.ps-community-color-picker-plane {
  width:100%!important;min-width:0!important;height:142px!important;min-height:142px!important;
  box-sizing:border-box!important;border-radius:9px!important;touch-action:none!important;
}
.ps-community-color-picker-hue-wrap,
.ps-community-color-picker-hex {width:100%!important;min-width:0!important;box-sizing:border-box!important}

/* Two proper theme swatches: no wrapped "Color 1 / Color 2" labels. */
.ps-community-editor-theme-stop-list {
  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
  gap:9px!important;width:100%!important;min-width:0!important;
}
.ps-community-editor-theme-stop {
  display:grid!important;grid-template-columns:36px minmax(0,1fr)!important;
  grid-template-rows:auto auto!important;align-items:center!important;
  gap:3px 9px!important;width:100%!important;min-width:0!important;min-height:62px!important;
  padding:9px!important;box-sizing:border-box!important;text-align:left!important;
}
.ps-community-editor-theme-stop>span:first-child {
  grid-column:1!important;grid-row:1 / 3!important;width:36px!important;height:36px!important;
  min-width:36px!important;border-radius:9px!important;
}
.ps-community-editor-theme-stop>span:nth-child(2) {
  grid-column:2!important;grid-row:1!important;min-width:0!important;
  font-size:11px!important;line-height:1.2!important;white-space:nowrap!important;
}
.ps-community-editor-theme-stop>small {
  grid-column:2!important;grid-row:2!important;min-width:0!important;
  font-size:9px!important;line-height:1.2!important;white-space:nowrap!important;
}

/* Letter-colour palette: eight equal square controls; the pipette is icon-only. */
.ps-community-name-color-style-group .ps-community-name-colors-row {
  display:grid!important;grid-template-columns:repeat(8,minmax(0,1fr))!important;
  align-items:stretch!important;gap:8px!important;width:100%!important;min-width:0!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-custom-picker-root {
  display:block!important;flex:none!important;width:auto!important;height:54px!important;
  min-width:0!important;max-width:none!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-custom-picker-root>.ps-community-name-custom-color {
  display:grid!important;grid-template-columns:1fr!important;place-items:center!important;
  width:100%!important;height:54px!important;min-height:54px!important;margin:0!important;
  padding:0!important;border:1px solid #48505e!important;border-radius:10px!important;
  background:#252a34!important;box-shadow:none!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-copy {display:none!important}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-mark {
  display:grid!important;place-items:center!important;margin:0!important;
}
.ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-preset-grid {display:contents!important}
.ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-preset-swatch {
  display:block!important;width:100%!important;height:54px!important;min-height:54px!important;
  min-width:0!important;margin:0!important;padding:0!important;border-radius:10px!important;
}

/* The chooser keeps its outer option cards; the copy area is plain text, not
   another bordered card nested inside each option. */
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy {
  display:flex!important;flex-direction:column!important;align-items:flex-start!important;
  justify-content:center!important;gap:6px!important;min-width:0!important;width:100%!important;
  padding:0!important;border:0!important;border-radius:0!important;outline:0!important;
  background:transparent!important;box-shadow:none!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy::before,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy::after,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy strong::before,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy strong::after,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy small::before,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy small::after {
  display:none!important;content:none!important;border:0!important;background:transparent!important;box-shadow:none!important;
}
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy strong,
.ps-community-avatar-picker-options>button .ps-community-avatar-choice-copy small {
  display:block!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;
  border:0!important;border-radius:0!important;outline:0!important;background:transparent!important;
  box-shadow:none!important;white-space:normal!important;overflow-wrap:break-word!important;
}

/* Move the editable name a few pixels below the avatar edge in both previews. */
.ps-community-editor-preview-name-input {margin:7px 0 4px!important}
.ps-community-name-style-profile-preview .ps-community-name-style-profile-copy {margin-top:8px!important}
.ps-community-profile-live-readonly-body>.ps-community-editor-preview-name-static {margin-top:7px!important}

/* Same foreground for every information field on the profile card. Do not add
   a dark/white outline: choose one contrast colour for the complete gradient. */
.ps-community-editor-preview-card .ps-community-editor-preview-tag,
.ps-community-editor-preview-card .ps-community-editor-preview-pronouns,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading *,
.ps-community-editor-preview-card .ps-community-editor-preview-meta,
.ps-community-editor-preview-card .ps-community-editor-preview-meta *,
.ps-community-editor-preview-card .ps-community-editor-bio-display,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row,
.ps-community-editor-preview-card .ps-community-editor-preview-role-row * {
  color:var(--editor-theme-text,#17191f)!important;
  -webkit-text-fill-color:var(--editor-theme-text,#17191f)!important;
  -webkit-text-stroke:0 transparent!important;text-shadow:none!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-tag {
  background:color-mix(in srgb,var(--editor-theme-text,#17191f) 10%,transparent)!important;
  border-color:color-mix(in srgb,var(--editor-theme-text,#17191f) 22%,transparent)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-role-row>span {
  color:var(--editor-theme-text,#17191f)!important;
  -webkit-text-fill-color:var(--editor-theme-text,#17191f)!important;
  border-color:color-mix(in srgb,var(--editor-theme-text,#17191f) 30%,transparent)!important;
  background:color-mix(in srgb,var(--editor-theme-text,#17191f) 9%,transparent)!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-meta strong,
.ps-community-editor-preview-card .ps-community-editor-preview-meta span,
.ps-community-editor-preview-card .ps-community-editor-preview-about-heading small {
  color:var(--editor-theme-text,#17191f)!important;
  -webkit-text-fill-color:var(--editor-theme-text,#17191f)!important;
}

/* Discord-style presence marker sits slightly inside the avatar, not outside it. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  right:3px!important;bottom:3px!important;width:24px!important;height:24px!important;
  box-sizing:border-box!important;border:5px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;
  border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important;
}
.ps-community-name-member-avatar>.ps-community-editor-presence-dot {right:0!important;bottom:1px!important}

/* Inset internal scrolling: dragging the sidebar scrollbar no longer closes
   the active colour picker and cannot hand scrolling to the page behind it. */
@media(max-width:760px) {
  .ps-community-editor-overlay {padding:8px!important}
  .ps-community-editor-v2 {width:calc(100vw - 16px)!important;height:calc(100dvh - 16px)!important;max-height:calc(100dvh - 16px)!important}
  .ps-community-editor-workspace-discord {grid-template-columns:minmax(220px,42%) minmax(0,1fr)!important}
  .ps-community-editor-theme-stop-list {grid-template-columns:1fr!important}
  .ps-community-name-color-style-group .ps-community-name-colors-row {gap:5px!important}
  .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color,
  .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-preset-swatch {height:46px!important;min-height:46px!important}
}


/* In the name-style picker, the custom swatch is one of the eight equal
   colour controls — never a padded card nested inside the swatch row. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker {
  display:block!important;position:relative!important;align-self:stretch!important;
  width:100%!important;height:54px!important;min-width:0!important;min-height:54px!important;
  max-width:none!important;margin:0!important;padding:0!important;gap:0!important;
  border:0!important;border-radius:0!important;background:transparent!important;
  box-shadow:none!important;overflow:visible!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker>.ps-community-name-custom-color {
  position:relative!important;display:grid!important;grid-template-columns:1fr!important;
  place-items:center!important;align-items:center!important;justify-content:center!important;
  gap:0!important;width:100%!important;height:54px!important;min-width:0!important;
  min-height:54px!important;margin:0!important;padding:0!important;overflow:hidden!important;
  border:1px solid #48505e!important;border-radius:10px!important;
  background:#252a34!important;box-shadow:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker>.ps-community-name-custom-color::before {
  display:none!important;content:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-mark {
  display:grid!important;position:static!important;flex:0 0 auto!important;
  place-items:center!important;width:auto!important;height:auto!important;
  min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;
  border:0!important;border-radius:0!important;background:transparent!important;
  color:#d9deed!important;box-shadow:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-copy {
  display:none!important;
}

/* The member-list specimen mirrors chat: avatar followed immediately by name.
   The dot is deliberately absent here; the full profile keeps its presence dot. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-row {
  display:flex!important;flex-direction:row!important;align-items:center!important;
  justify-content:flex-start!important;gap:10px!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-avatar {
  display:grid!important;position:relative!important;flex:0 0 40px!important;
  width:40px!important;height:40px!important;margin:0!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-avatar>.ps-community-editor-presence-dot {
  display:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy {
  display:flex!important;flex:0 1 auto!important;flex-direction:row!important;
  align-items:center!important;justify-content:flex-start!important;
  width:auto!important;max-width:calc(100% - 50px)!important;min-width:0!important;
  margin:0!important;padding:0!important;text-align:left!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-member-copy>strong.community-member-nameplate {
  display:inline-block!important;align-self:center!important;justify-self:start!important;
  flex:0 1 auto!important;width:max-content!important;max-width:100%!important;min-width:0!important;
  margin:0!important;margin-left:0!important;margin-right:0!important;padding:0!important;
  text-align:left!important;
}

/* Both the profile settings rail and the style-picker columns reveal their
   native scrollbar only while the pointer is over the scroll area. */
@media (min-width:781px) and (hover:hover) and (pointer:fine) {
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview {
    scrollbar-width:thin!important;scrollbar-color:transparent transparent!important;
  }
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection::-webkit-scrollbar,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview::-webkit-scrollbar {
    display:block!important;width:8px!important;
  }
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection::-webkit-scrollbar-track,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview::-webkit-scrollbar-track {
    background:transparent!important;
  }
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection::-webkit-scrollbar-thumb,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview::-webkit-scrollbar-thumb {
    background:transparent!important;border:2px solid transparent!important;
    border-radius:12px!important;background-clip:padding-box!important;
    transition:background-color 140ms ease!important;
  }
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection:hover,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview:hover {
    scrollbar-color:#65708a transparent!important;
  }
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection:hover::-webkit-scrollbar-thumb,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview:hover::-webkit-scrollbar-thumb,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-collection[data-scrollbar-visible="true"]::-webkit-scrollbar-thumb,
  .ps-community-picker-modal.is-name-style-modal .ps-community-picker-preview[data-scrollbar-visible="true"]::-webkit-scrollbar-thumb {
    background:#65708a!important;
  }
}


/* Single-colour custom picker: first row holds all eight swatches; opening the
   pipette adds a full-width second row below them, like the profile-theme picker. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row {
  display:grid!important;
  grid-template-columns:repeat(8,minmax(0,1fr))!important;
  grid-template-rows:54px auto!important;
  align-items:stretch!important;
  column-gap:8px!important;
  row-gap:10px!important;
  width:100%!important;
  min-width:0!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker {
  display:contents!important;
  width:auto!important;height:auto!important;min-width:0!important;max-width:none!important;
  margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;overflow:visible!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker>.ps-community-name-custom-color {
  display:grid!important;
  grid-column:1!important;grid-row:1!important;
  place-items:center!important;
  width:100%!important;height:54px!important;min-height:54px!important;min-width:0!important;
  margin:0!important;padding:0!important;gap:0!important;
  border:1px solid #48505e!important;border-radius:10px!important;
  background:#252a34!important;box-shadow:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker>.ps-community-name-custom-color::before {
  display:none!important;content:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-mark {
  display:grid!important;position:static!important;place-items:center!important;
  width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;
  margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
  background:transparent!important;box-shadow:none!important;color:#d9deed!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row .ps-community-name-custom-color-copy {
  display:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-color-picker>.ps-community-name-custom-picker {
  display:grid!important;position:relative!important;z-index:1!important;
  grid-column:1/-1!important;grid-row:2!important;
  width:100%!important;max-width:none!important;min-width:0!important;
  height:auto!important;min-height:0!important;margin:0!important;
  padding:14px!important;gap:13px!important;
  border:1px solid #353944!important;border-radius:12px!important;
  background:linear-gradient(145deg,#24262e 0%,#1e2027 100%)!important;
  box-shadow:inset 0 1px 0 rgb(255 255 255 / 3%),0 8px 20px rgb(0 0 0 / 13%)!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-preset-grid {
  display:contents!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-color-style-group .ps-community-name-colors-row>.ps-community-name-preset-grid>.ps-community-name-preset-swatch {
  grid-row:1!important;align-self:stretch!important;
  display:block!important;width:100%!important;height:54px!important;min-height:54px!important;
  min-width:0!important;margin:0!important;padding:0!important;border-radius:10px!important;
}
/* The panel behaves like the profile-theme selector and stays fully in document flow. */
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-plane {
  display:block!important;width:100%!important;height:142px!important;min-height:142px!important;
  border-radius:9px!important;touch-action:none!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-hex {
  display:flex!important;align-items:center!important;gap:8px!important;
  width:100%!important;min-width:0!important;min-height:42px!important;
  padding:0 9px!important;border:1px solid #3d424d!important;border-radius:8px!important;
  background:#17191e!important;box-sizing:border-box!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-hex input {
  flex:1 1 auto!important;min-width:0!important;height:36px!important;
  border:0!important;outline:0!important;background:transparent!important;color:#f2f3f5!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-hex button {
  display:grid!important;place-items:center!important;flex:0 0 28px!important;
  width:28px!important;height:28px!important;border:0!important;background:transparent!important;color:#b9c1d1!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-recent {
  display:flex!important;flex-wrap:wrap!important;gap:8px!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-recent button {
  display:block!important;width:26px!important;height:26px!important;flex:0 0 26px!important;
  border:1px solid rgb(255 255 255 / 28%)!important;border-radius:7px!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-actions {
  display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;
  padding-top:10px!important;border-top:1px solid #343740!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-actions button {
  min-height:36px!important;padding:0 14px!important;border:1px solid #3d424d!important;
  border-radius:8px!important;background:#2b2e36!important;color:#dce0e8!important;font-size:11px!important;font-weight:700!important;
}
.ps-community-picker-modal.is-name-style-modal .ps-community-name-custom-picker .ps-community-color-picker-actions button:last-child {
  border-color:#5865f2!important;background:#5865f2!important;color:#fff!important;
}

/* A consistent, slightly larger 26px presence marker in all large avatar previews. */
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot {
  position:absolute!important;right:2px!important;bottom:2px!important;
  width:26px!important;height:26px!important;box-sizing:border-box!important;
  border:5px solid var(--editor-card,var(--status-theme,#B7D7C3))!important;
  border-radius:50%!important;background:#23a55a!important;outline:0!important;box-shadow:none!important;
}
.ps-community-editor-preview-card .ps-community-editor-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-name-style-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline,
.ps-community-status-profile-preview>.ps-community-status-preview-avatar>.ps-community-editor-presence-dot.is-offline {
  background:#747b86!important;
}

/* Name color belongs to the selected name style; profile contrast belongs to
   descriptive fields. Keep the text input from inheriting a theme override. */
.ps-community-editor-preview-name-input {
  color:var(--name-solid-color,var(--editor-theme-text,#f2f3f5))!important;
  -webkit-text-fill-color:currentColor!important;
  background-color:transparent!important;
  transition:border-color .12s ease!important;
}
.ps-community-editor-preview-name-input:focus {
  background-color:transparent!important;
  box-shadow:none!important;
}
.ps-community-editor-preview-name-input.is-name-style-8bit {
  font-size:35px!important;
  line-height:1.25!important;
  letter-spacing:-.015em!important;
  min-height:42px!important;
  height:42px!important;
}
.ps-community-name-style-profile-preview .ps-community-name-style-profile-copy>strong.is-name-style-8bit,
.ps-community-status-profile-copy>strong.is-name-style-8bit,
.ps-community-profile-live-readonly-body>.ps-community-editor-preview-name-static.is-name-style-8bit {
  font-size:clamp(29px,2.5vw,34px)!important;
  line-height:1.3!important;
  letter-spacing:-.015em!important;
}
.ps-community-name-style-profile-preview .ps-community-name-style-profile-copy>small,
.ps-community-status-profile-preview .ps-community-status-profile-copy>small {
  color:var(--status-theme-text,#202126)!important;
  -webkit-text-fill-color:var(--status-theme-text,#202126)!important;
  opacity:.86!important;
}
/* Discord-like discard prompt: the studio shifts aside while a red decision
   bar enters from below, without closing or resetting the draft prematurely. */
.ps-community-editor-v2 {
  position:relative!important;
  transition:transform .26s cubic-bezier(.2,.8,.2,1),box-shadow .26s ease!important;
}
.ps-community-editor-v2[data-close-confirming="true"] {
  transform:translateX(-28px) scale(.992)!important;
  box-shadow:0 0 0 1px rgb(239 68 68 / 22%),0 22px 70px rgb(0 0 0 / 42%)!important;
}
.ps-community-editor-main {position:relative!important}
.ps-community-editor-close-confirm {
  position:absolute!important;z-index:40!important;left:50%!important;bottom:14px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;
  width:min(760px,calc(100% - 32px))!important;min-height:76px!important;box-sizing:border-box!important;
  padding:13px 16px!important;border:1px solid rgb(255 153 153 / 42%)!important;border-radius:13px!important;
  background:linear-gradient(115deg,#9f3039 0%,#76272f 100%)!important;
  box-shadow:0 18px 48px rgb(0 0 0 / 42%),0 5px 16px rgb(0 0 0 / 22%)!important;
  color:#fff!important;transform:translate(-50%,28px)!important;
  animation:ps-community-close-confirm-enter .26s cubic-bezier(.2,.8,.2,1) forwards!important;
}
.ps-community-editor-close-confirm-copy {
  display:flex!important;flex-direction:column!important;gap:4px!important;min-width:180px!important;
}
.ps-community-editor-close-confirm-copy strong {color:#fff!important;font-size:13px!important;font-weight:850!important}
.ps-community-editor-close-confirm-copy span {color:rgb(255 255 255 / 82%)!important;font-size:11px!important;line-height:1.35!important}
.ps-community-editor-close-confirm-actions {
  display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:7px!important;
}
.ps-community-editor-close-confirm-actions button {
  display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;
  min-height:36px!important;padding:0 12px!important;border:1px solid rgb(255 255 255 / 24%)!important;
  border-radius:8px!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important;
}
.ps-community-editor-close-confirm-actions .is-keep {background:rgb(38 28 31 / 42%)!important;color:#fff!important}
.ps-community-editor-close-confirm-actions .is-discard {background:rgb(255 255 255 / 12%)!important;color:#fff!important}
.ps-community-editor-close-confirm-actions .is-save {background:#fff!important;color:#8e2932!important;border-color:#fff!important}
.ps-community-editor-close-confirm-actions button:disabled {opacity:.55!important;cursor:not-allowed!important}
@keyframes ps-community-close-confirm-enter {
  from {opacity:0;transform:translate(-50%,34px)}
  to {opacity:1;transform:translate(-50%,0)}
}
@media(max-width:760px) {
  .ps-community-editor-v2[data-close-confirming="true"] {transform:translateX(0) scale(.995)!important}
  .ps-community-editor-close-confirm {
    bottom:8px!important;flex-direction:column!important;align-items:stretch!important;
    gap:10px!important;width:calc(100% - 16px)!important;padding:12px!important;
  }
  .ps-community-editor-close-confirm-actions {justify-content:stretch!important}
  .ps-community-editor-close-confirm-actions button {flex:1 1 auto!important}
}


/* Keep the editable input completely stable while it has focus. Display-name
   motion effects belong to rendered names, never to the text-editing control. */
#ps-community-display-name-inline,
#ps-community-display-name-inline:focus,
#ps-community-display-name-inline:focus-visible,
#ps-community-display-name-inline:active {
  appearance:none!important;
  -webkit-appearance:none!important;
  color:var(--name-solid-color,var(--editor-theme-text,#f2f3f5))!important;
  -webkit-text-fill-color:currentColor!important;
  background:transparent!important;
  background-color:transparent!important;
  outline:0!important;
  box-shadow:none!important;
  filter:none!important;
  transform:none!important;
  animation:none!important;
  transition:border-color .12s ease!important;
}
.ps-community-editor-preview-name-input.is-name-style-8bit {
  font-size:35px!important;
  line-height:1.25!important;
  letter-spacing:0!important;
}
.ps-community-status-profile-preview .ps-community-status-profile-copy>strong.is-name-style-8bit {
  font-size:clamp(29px,2.5vw,34px)!important;
  line-height:1.3!important;
  letter-spacing:0!important;
}
.ps-community-status-profile-preview .ps-community-status-profile-copy>small:empty {
  display:none!important;
}



`}</style>
    </div>
    </div>,
    document.body,
  );
}
