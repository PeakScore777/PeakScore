"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ShieldCheck, BadgeCheck, LockKeyhole,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Share2, MoreHorizontal, Layers3, SmilePlus, Reply, FileImage, Pencil, Check, AtSign, Copy, ArrowUpRight,
  PanelRight, Palette, Headphones, Mic, Settings2, ChevronDown, Settings, Plus, FolderPlus, Trash2, Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import communityTheme from "./peakscore-community-theme.module.css";
import CommunityFounderStudio from "@/components/community/CommunityFounderStudio";
import "../community-profile-status-preview.css";
import "../community-member-profile-ui.css";
import "../community-name-style.css";
import "../community-name-effects.css";
import CommunityProfileStudio from "@/components/community/CommunityProfileStudio";
import DecryptedDisplayName from "@/components/community/DecryptedDisplayName";
import ShuffleDisplayName from "@/components/community/ShuffleDisplayName";
import InklineDisplayName from "@/components/community/InklineDisplayName";
import HaloSignalDisplayName from "@/components/community/HaloSignalDisplayName";
import DominoFlowDisplayName from "@/components/community/DominoFlowDisplayName";
import MistfallDisplayName from "@/components/community/MistfallDisplayName";
import DepthLiftDisplayName from "@/components/community/DepthLiftDisplayName";

import { DEFAULT_FUZZY_TEXT_SETTINGS, normalizeFuzzyTextSettings, type FuzzyTextSettings } from "@/components/community/fuzzy-text-settings";
import { displayNameColorForEffect, displayNameInklineStrokeColor, displayNameSolidColor } from "@/components/community/display-name-color";

type CommunitySpace = {
  id: string;
  slug: string;
  name: string;
  space_type: "global" | "preicfes";
  visibility: "public" | "private";
  verification_status?: "unverified" | "pending" | "verified" | "rejected";
  icon_key: string;
  accent_color: string;
  background_color?: string;
  icon_path?: string | null;
  banner_path?: string | null;
  icon_url?: string | null;
  banner_url?: string | null;
};
type Channel = {
  id: string; slug: string; name: string; description: string;
  category: string; position: number; is_read_only: boolean; is_private: boolean;
  channel_type?: "text" | "announcement"; icon_key?: string; accent_color?: string;
};
type CommunityChannelCategory = { id: string; name: string; position: number };
type CommunityRole = {
  role_key: string; label: string; badge_color: string; display_as_badge: boolean;
  position?: number; mentionable?: boolean; hoist?: boolean;
};
type CommunityPlateStyle = "classic" | "grid" | "arcade" | "signal";
type CommunityDisplayNameStyle = "classic" | "tempo" | "sakura" | "jellybean" | "modern" | "medieval" | "8bit" | "vampyre" | "monkey-bars" | "mainframe" | "headbang" | "journal" | "display" | "editorial" | "elegant" | "geometric" | "retro" | "handwritten" | "signature" | "techno" | "rounded" | "stencil" | "discord-display" | "creator-sans" | "stream-mono" | "street-block" | "action-condensed" | "cyber-racer" | "epic-rpg";
type CommunityDisplayNameEffect = "plain" | "gradient" | "gradient-flow" | "neon" | "toon" | "pop" | "gummy" | "prism" | "chromaflow";
type CommunityDisplayNameAnimation = "decrypt" | "shuffle-blur" | "shuffle-flip" | "shuffle" | "inkline" | "halo-signal" | "domino-flow" | "mistfall" | "depth-lift";

const COMMUNITY_NAME_ANIMATIONS = new Set<CommunityDisplayNameAnimation>([
  "decrypt", "shuffle-blur", "shuffle-flip", "shuffle", "inkline",
  "halo-signal", "domino-flow", "mistfall", "depth-lift",
]);

function communityNameAnimation(value?: string | null): CommunityDisplayNameAnimation {
  return COMMUNITY_NAME_ANIMATIONS.has(value as CommunityDisplayNameAnimation)
    ? value as CommunityDisplayNameAnimation
    : "decrypt";
}
type CommunityDisplayNameColor = "default" | "pink" | "green" | "blue" | "purple" | "magenta" | "red" | "gold" | "custom-gradient";
type CommunityAvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type CommunityAvatarDecoration = "none" | "bloom" | "electric" | "glitch";
type CommunityProfileFrame = "none" | "obsidian" | "lunar" | "crimson" | "aurora";
type CommunityProfileEffect = "none" | "aurora" | "embers" | "starlight" | "scanline";
type CommunityMemberSummary = {
  id: string;
  member_number?: number | null;
  full_name: string;
  avatar_url: string | null;
  status_text: string;
  roles?: CommunityRole[];
  about?: string;
  joined_at?: string;
  banner_url?: string | null;
  card_color?: string;
  theme_color_secondary?: string;
  plate_style?: CommunityPlateStyle;
  display_name_style?: CommunityDisplayNameStyle;
  display_name_effect?: CommunityDisplayNameEffect;
  display_name_animation?: CommunityDisplayNameAnimation;
  display_name_fuzzy_settings?: FuzzyTextSettings | null;
  display_name_color?: CommunityDisplayNameColor;
  display_name_gradient_start?: string;
  display_name_gradient_end?: string;
  display_name_prism_colors?: string[];
  accent_color?: string;
  avatar_frame?: CommunityAvatarFrame;
  avatar_decoration_id?: CommunityAvatarDecoration;
  profile_frame_id?: CommunityProfileFrame;
  profile_effect_id?: CommunityProfileEffect;
  status_expires_at?: string | null;
};
type CommunityMemberProfile = {
  userId: string;
  memberNumber?: number | null;
  accountName?: string | null;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  themeColorSecondary?: string;
  plateStyle?: "classic" | "grid" | "arcade" | "signal";
  displayNameStyle?: CommunityDisplayNameStyle;
  displayNameEffect?: CommunityDisplayNameEffect;
  displayNameAnimation?: CommunityDisplayNameAnimation;
  displayNameFuzzySettings?: FuzzyTextSettings;
  displayNameColor?: CommunityDisplayNameColor;
  displayNameGradientStart?: string;
  displayNameGradientEnd?: string;
  displayNamePrismColors?: string[];
  accentColor?: string;
  avatarFrame?: "none" | "solar" | "violet" | "cyan" | "ember";
  avatarDecorationId?: CommunityAvatarDecoration;
  profileFrameId?: CommunityProfileFrame;
  profileEffectId?: CommunityProfileEffect;
  statusExpiresAt?: string | null;
  pronouns?: string;
  appearanceReady?: boolean;
  statusText: string;
  about: string;
  joinedAt: string;
  roles: { roleKey: string; label: string; badgeColor: string }[];
  isOwnProfile: boolean;
};
type CommunityMessageMetrics = {
  message_id: string;
  reaction_count?: number;
  reply_count?: number;
  reaction_counts?: Record<string, number>;
  viewer_reactions?: string[];
  // Compatibility with the older metrics RPC while its migration is pending.
  comment_count?: number;
  viewer_liked?: boolean;
};
type PublicRoleBadge = {
  user_id: string;
  role_key: string;
  label: string;
  badge_color: string;
  position?: number | null;
  mentionable?: boolean | null;
  hoist?: boolean | null;
};
type Message = {
  id: string; channel_id: string; author_id: string; body: string;
  created_at: string; edited_at: string | null; author: CommunityMemberSummary | null;
  channel: Channel | null;
  reply_to_message_id: string | null;
  attachment_path: string | null;
  attachment_alt: string | null;
  attachment_url: string | null;
  reaction_count: number;
  reaction_counts: Record<string, number>;
  viewer_reactions: string[];
  reply_count: number;
  pending?: boolean;
};
type MentionMember = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  status_text: string;
};

const CHAT_REACTIONS = ["👍", "❤️", "😂", "😮", "🙏", "🔥", "🎉", "💯", "😭", "👀", "🧠", "🚀", "👏", "🤝", "💡"];
const CATEGORIES = ["COMUNIDAD", "MATERIAS", "PROFESORES", "AULAS Y EVENTOS"];
const GLOBAL_COMMUNITY_SPACE_ID = "00000000-0000-4000-8000-000000000001";
const CATEGORY_LABELS: Record<string, string> = {
  COMUNIDAD: "Canales",
  MATERIAS: "Áreas ICFES",
  PROFESORES: "Profesores",
  "AULAS Y EVENTOS": "Aulas y eventos",
};
const CHANNEL_ICONS: Record<string, typeof Hash> = {
  general: MessageCircle, memes: Layers3, noticias: Megaphone,
  logros: Trophy, matematicas: Hash, "lectura-critica": BookOpen,
  sociales: BookOpen, "ciencias-naturales": GraduationCap, ingles: GraduationCap,
  "sala-de-profesores": Users, "anuncios-de-clases": Megaphone, eventos: Radio,
};

const CHANNEL_ICON_KEYS: Record<string, typeof Hash> = {
  hash: Hash,
  megaphone: Megaphone,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  "message-circle": MessageCircle,
  radio: Radio,
};


function getVisibleCommunityStatus(statusText?: string | null, expiresAt?: string | null) {
  if (!statusText) return "";
  if (!expiresAt) return statusText;
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry <= Date.now() ? "" : statusText;
}

function initials(name?: string | null) {
  return (name?.trim() || "P").split(/\s+/).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("");
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

function renderMessageBody(body: string, viewerId: string | null, mentionNames: Record<string, string>): ReactNode {
  const mentionPattern = /@\{([0-9a-f-]{36})\|([^{}|\n]{1,80})\}/gi;
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of body.matchAll(mentionPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(body.slice(cursor, index));
    const mentionedUserId = match[1];
    const displayName = mentionNames[mentionedUserId];
    if (displayName) {
      parts.push(
        <span
          key={"mention-" + index}
          className={"community-chat-mention " + (mentionedUserId === viewerId ? "community-chat-mention-self" : "")}
          title={"Mención a " + displayName}
        >
          @{displayName}
        </span>,
      );
    } else {
      // Unknown IDs are ordinary text, never styled as an authenticated mention.
      parts.push("@" + match[2]);
    }
    cursor = index + match[0].length;
  }

  if (cursor < body.length) parts.push(body.slice(cursor));
  return parts.length ? parts : body;
}

function communityThemeLuminance(hex: string) {
  const clean = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'B7D7C3';
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function communityThemeText(hex: string) {
  return communityThemeLuminance(hex) > 0.179 ? '#202126' : '#F7F8FA';
}
function communityThemeMidpoint(first: string, second: string) {
  const a = /^#[0-9a-f]{6}$/i.test(first) ? first.slice(1) : 'B7D7C3';
  const b = /^#[0-9a-f]{6}$/i.test(second) ? second.slice(1) : '8FB9A6';
  const values = [0, 2, 4].map((index) => Math.round((parseInt(a.slice(index,index+2),16) + parseInt(b.slice(index,index+2),16)) / 2).toString(16).padStart(2,'0'));
  return '#' + values.join('');
}
function communityNameCharacters(value: string) {
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

function communityNameCharacterDelay(index: number, count: number, animation: CommunityDisplayNameAnimation) {
  if (count <= 1) return "0ms";
  const window = animation === "decrypt" ? 300 : 460;
  const step = Math.min(56, window / Math.max(1, count - 1));
  return Math.round(index * step) + "ms";
}

function CommunityStaticName({ value, className, style, tag = "span" }: {
  value: string;
  className: string;
  style?: React.CSSProperties;
  tag?: "span" | "strong" | "h2" | "h3";
}) {
  const Tag = tag;
  const characters = communityNameCharacters(value);
  const fitScale = Math.max(0.72, 1 - Math.max(0, characters.length - 18) * 0.008);
  const tagScale = tag === "h2" ? 1.5 : tag === "h3" ? 1.17 : 1;
  const chromaScale = Math.max(2.6, characters.length);
  const safeStyle = {
    ...style,
    ...(tag === "span" ? {} : { fontSize: (fitScale * tagScale).toFixed(3) + "em" }),
    "--ps-chroma-char-count": Math.max(1, characters.length),
    "--ps-chroma-background-size": chromaScale * 100 + "%",
    "--ps-chroma-shift-end": (chromaScale / (chromaScale - 1) * 100) + "%",
    maxWidth: "100%",
  } as React.CSSProperties;
  return <Tag className={className + " ps-community-name-static"} style={safeStyle}>{value}</Tag>;
}

function CommunityAnimatedName({ value, animation, className, style, tag = "strong", id, previewMode = false }: {
  value: string;
  animation: CommunityDisplayNameAnimation;
  className: string;
  style?: React.CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  id?: string;
  previewMode?: boolean;
}) {
  const Tag = tag;
  const renderedClassName = className;
  const characters = communityNameCharacters(value);
  const chromaScale = Math.max(2.6, characters.length);
  const fitScale = Math.max(0.72, 1 - Math.max(0, characters.length - 18) * 0.008);
  const tagScale = tag === "h2" ? 1.5 : tag === "h3" ? 1.17 : 1;
  const safeStyle = {
    ...style,
    fontSize: (fitScale * tagScale).toFixed(3) + "em",
    "--ps-chroma-char-count": Math.max(1, characters.length),
    "--ps-chroma-background-size": chromaScale * 100 + "%",
    "--ps-chroma-shift-end": (chromaScale / (chromaScale - 1) * 100) + "%",
    maxWidth: "100%",
  } as React.CSSProperties;
  if (animation === "inkline") {
    const effectName = className.split(/\s+/).find((token) => token.startsWith("effect-"))?.slice(7) ?? "plain";
    const strokeColor = displayNameInklineStrokeColor(effectName, style as Record<string, unknown> | undefined);
    return <InklineDisplayName text={value} strokeColor={strokeColor} fillColor="currentColor" strokeWidth={1.4} fontWeight="inherit" className={"ps-community-name-render " + renderedClassName} style={safeStyle} tag={tag}/>;
  }
  if (animation === "halo-signal") {
    return <HaloSignalDisplayName text={value} className={"ps-community-name-render " + renderedClassName} style={safeStyle} tag={tag} previewMode={previewMode}/>;
  }
  if (animation === "domino-flow") {
    return <DominoFlowDisplayName text={value} className={"ps-community-name-render " + renderedClassName} style={safeStyle} tag={tag} previewMode={previewMode}/>;
  }
  if (animation === "mistfall") {
    return <MistfallDisplayName text={value} className={"ps-community-name-render " + renderedClassName} style={safeStyle} tag={tag} previewMode={previewMode}/>;
  }
  if (animation === "depth-lift") {
    return <DepthLiftDisplayName text={value} className={"ps-community-name-render " + renderedClassName} style={safeStyle} tag={tag}/>;
  }
  if (animation === "shuffle-blur") {
    return <ShuffleDisplayName
      text={value}
      effect="blur"
      shuffleDirection="up"
      duration={2.75}
      animationMode="sequence"
      shuffleTimes={14}
      scrambleCharset="0123456789#%&*+-=?"
      ease="expo.out"
      stagger={0.06}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={renderedClassName}
      style={safeStyle}
    />;
  }
  if (animation === "shuffle-flip") {
    return <ShuffleDisplayName
      text={value}
      effect="flip"
      shuffleDirection="down"
      duration={2.4}
      animationMode="sequence"
      shuffleTimes={7}
      ease="power2.out"
      stagger={0.07}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={renderedClassName}
      style={safeStyle}
    />;
  }
  if (animation === "shuffle") {
    return <ShuffleDisplayName
      text={value}
      effect="slide"
      shuffleDirection="right"
      duration={1.3}
      animationMode="evenodd"
      shuffleTimes={1}
      ease="power3.out"
      stagger={0.05}
      threshold={0.1}
      respectReducedMotion
      tag={tag}
      className={renderedClassName}
      style={safeStyle}
    />;
  }
  if (animation === "decrypt") {
    return <DecryptedDisplayName
      id={id}
      text={value}
      tag={tag}
      className={renderedClassName}
      style={safeStyle}
      speed={40}
      maxIterations={10}
      durationMs={2400}
      sequential
      revealDirection="random"
      characters="0123456789ABCDEF"
      scrambleColor="#2bb673"
      animateOn="view"
      loop={false}
    />;
  }
  return <Tag id={id} className={renderedClassName + " name-enter-" + animation} style={safeStyle} aria-label={value}>
    <span className="ps-name-animation-text" aria-hidden="true">{characters.map((character, index) => (
      <span className="ps-name-animation-char" data-glyph={character === " " ? "\u00A0" : character} style={{
        "--char-index": index,
        "--char-delay": communityNameCharacterDelay(index, characters.length, animation),
        "--char-direction": index % 2 === 0 ? "-1" : "1",
        "--char-rotation": (index % 2 === 0 ? -1 : 1) * (animation === "orbit" ? 34 : animation === "wave" ? 8 : 7) + "deg",
        "--ps-chroma-position": (characters.length <= 1 ? 50 : (index / (characters.length - 1)) * 100) + "%",
      } as React.CSSProperties} key={index}>{character === " " ? "\u00A0" : character}</span>
    ))}</span>
  </Tag>;
}

type CommunityReadMarker = { channel_id: string; last_read_at: string };
type CommunityReadClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        in(column: string, values: string[]): PromiseLike<{
          data: CommunityReadMarker[] | null;
          error: { code?: string } | null;
        }>;
      };
    };
    upsert(
      values: { user_id: string; channel_id: string; last_read_at: string },
      options: { onConflict: string },
    ): PromiseLike<{ error: { code?: string } | null }>;
  };
};

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isFounder, setIsFounder] = useState(false);
  const [founderStudioOpen, setFounderStudioOpen] = useState(false);
  const [founderStudioTab, setFounderStudioTab] = useState<"branding" | "channels">("branding");
  const [founderStudioAction, setFounderStudioAction] = useState<"create-channel" | "create-category" | null>(null);
  const [founderStudioChannelId, setFounderStudioChannelId] = useState<string | null>(null);
  const [communityServerMenuOpen, setCommunityServerMenuOpen] = useState(false);
  const communityServerMenuRef = useRef<HTMLDivElement | null>(null);
  const [profile, setProfile] = useState<CommunityMemberSummary | null>(null);
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState<CommunityMemberProfile | null>(null);
  const [hoverCommunityProfile, setHoverCommunityProfile] = useState<CommunityMemberProfile | null>(null);
  const [memberProfileMenuOpen, setMemberProfileMenuOpen] = useState(false);
  const [hoverProfilePosition, setHoverProfilePosition] = useState({ left: 0, top: 0 });
  const hoverProfileCloseTimerRef = useRef<number | null>(null);
  const memberPopoutRef = useRef<HTMLDivElement | null>(null);
  const profileFromUrlRef = useRef<string | null>(null);
  const openCommunityProfileRef = useRef<(memberId: string) => Promise<void>>(async () => {});
  const communityProfileRequestRef = useRef(0);
  const communityProfileCloseRef = useRef<HTMLButtonElement | null>(null);
  const [communityProfileLoading, setCommunityProfileLoading] = useState(false);
  const communityProfileCacheRef = useRef(new Map<string, CommunityMemberProfile>());
  const [communityProfileStudioOpen, setCommunityProfileStudioOpen] = useState(false);
  const [communityProfileError, setCommunityProfileError] = useState("");
  const [copiedCommunityProfileId, setCopiedCommunityProfileId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [communityChannelCategories, setCommunityChannelCategories] = useState<CommunityChannelCategory[]>([]);
  const [communitySpaces, setCommunitySpaces] = useState<CommunitySpace[]>([]);
  const [activeSpace, setActiveSpace] = useState<CommunitySpace | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionDisplayNames, setMentionDisplayNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [messageMenuFor, setMessageMenuFor] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string | null>(null);
  const [mentionAnchorIndex, setMentionAnchorIndex] = useState<number | null>(null);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionMember[]>([]);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [onlineMemberIds, setOnlineMemberIds] = useState<string[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberSummary[]>([]);
  const [memberListOpen, setMemberListOpen] = useState(true);
  const [collapsedMemberGroups, setCollapsedMemberGroups] = useState<Record<string, boolean>>({});
  const openFounderStudio = useCallback((
    tab: "branding" | "channels",
    action: "create-channel" | "create-category" | null = null,
    channelId: string | null = null,
  ) => {
    setFounderStudioTab(tab);
    setFounderStudioAction(action);
    setFounderStudioChannelId(channelId);
    setCommunityServerMenuOpen(false);
    setFounderStudioOpen(true);
  }, []);
  useEffect(() => {
    if (!communityServerMenuOpen) return;
    function closeServerMenuOutside(event: PointerEvent) {
      if (event.target instanceof Node && !communityServerMenuRef.current?.contains(event.target)) {
        setCommunityServerMenuOpen(false);
      }
    }
    function closeServerMenuEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCommunityServerMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeServerMenuOutside);
    document.addEventListener("keydown", closeServerMenuEscape);
    return () => {
      document.removeEventListener("pointerdown", closeServerMenuOutside);
      document.removeEventListener("keydown", closeServerMenuEscape);
    };
  }, [communityServerMenuOpen]);
  useEffect(() => {
    if (!hoverCommunityProfile) return;
    function handleOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !memberPopoutRef.current?.contains(event.target)) {
        setHoverCommunityProfile(null);
        setMemberProfileMenuOpen(false);
      }
    }
    function handleProfileCardKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHoverCommunityProfile(null);
        setMemberProfileMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleProfileCardKey);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleProfileCardKey);
    };
  }, [hoverCommunityProfile]);
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [appearanceMode, setAppearanceMode] = useState<"server" | "black" | "gray" | "white" | "custom">("server");
  const [appearanceCustomColor, setAppearanceCustomColor] = useState("#252a32");
  const [chromaEnabled, setChromaEnabled] = useState(true);
  const [appearanceLoadedKey, setAppearanceLoadedKey] = useState<string | null>(null);
  const [audioPanelMode, setAudioPanelMode] = useState<"input" | "output" | null>(null);
  const [audioLoadedKey, setAudioLoadedKey] = useState<string | null>(null);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDeviceId, setAudioInputDeviceId] = useState("");
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState("");
  const [audioFeedback, setAudioFeedback] = useState("");
  const [verificationFeedback, setVerificationFeedback] = useState("");
  const [verificationRequestBusy, setVerificationRequestBusy] = useState(false);
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const editComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const messageLoadRequestRef = useRef(0);
  const activeChannelIdRef = useRef<string | null>(null);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const pendingReactionKeysRef = useRef<Set<string>>(new Set());
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const activeSpaceOnlineUsers = activeSpace?.space_type === "preicfes"
    ? communityMembers.filter((member) => onlineMemberIds.includes(member.id)).length
    : onlineUsers;
  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  function openMemberHoverPreview(member: CommunityMemberSummary, event: { clientX: number; clientY: number }) {
    if (hoverProfileCloseTimerRef.current !== null) window.clearTimeout(hoverProfileCloseTimerRef.current);
    setMemberProfileMenuOpen(false);
    const cached = communityProfileCacheRef.current.get(member.id);
    const preview: CommunityMemberProfile = cached ?? {
      userId: member.id,
      displayName: member.full_name,
      avatarUrl: member.avatar_url,
      bannerUrl: member.banner_url ?? null,
      cardColor: member.card_color ?? "#B7D7C3",
      themeColorSecondary: member.theme_color_secondary ?? "#8FB9A6",
      plateStyle: member.plate_style ?? "classic",
      displayNameStyle: member.display_name_style ?? "classic",
      displayNameAnimation: communityNameAnimation(member.display_name_animation),
      displayNameFuzzySettings: normalizeFuzzyTextSettings(member.display_name_fuzzy_settings),
      accentColor: member.accent_color ?? "#3987FF",
      avatarFrame: member.avatar_frame ?? "none",
      avatarDecorationId: member.avatar_decoration_id ?? "none",
      profileFrameId: member.profile_frame_id ?? "none",
      profileEffectId: member.profile_effect_id ?? "none",
      statusExpiresAt: member.status_expires_at ?? null,
      pronouns: "",
      appearanceReady: false,
      statusText: getVisibleCommunityStatus(member.status_text, member.status_expires_at),
      about: member.about ?? "",
      joinedAt: member.joined_at ?? "",
      roles: (member.roles ?? []).map((role) => ({
        roleKey: role.role_key, label: role.label, badgeColor: role.badge_color,
      })),
      isOwnProfile: member.id === userId,
    };
    setHoverProfilePosition({
      left: Math.max(12, Math.min(event.clientX - 360, window.innerWidth - 365)),
      top: Math.max(12, Math.min(event.clientY - 80, window.innerHeight - 470)),
    });
    setHoverCommunityProfile(preview);
    if (cached) return;
    void fetch("/api/community/profile/" + member.id, {
      method: "GET", credentials: "same-origin", cache: "no-store",
    }).then((response) => response.ok ? response.json() : null)
      .then((payload: { profile?: CommunityMemberProfile } | null) => {
        if (!payload?.profile) return;
        communityProfileCacheRef.current.set(member.id, payload.profile);
        setHoverCommunityProfile((current) => current?.userId === member.id ? payload.profile! : current);
      }).catch(() => undefined);
  }

  function scheduleCloseMemberHoverPreview() {
    if (hoverProfileCloseTimerRef.current !== null) window.clearTimeout(hoverProfileCloseTimerRef.current);
    hoverProfileCloseTimerRef.current = window.setTimeout(() => {
      setHoverCommunityProfile(null);
      setMemberProfileMenuOpen(false);
    }, 180);
  }

  function keepMemberHoverPreviewOpen() {
    if (hoverProfileCloseTimerRef.current !== null) window.clearTimeout(hoverProfileCloseTimerRef.current);
    hoverProfileCloseTimerRef.current = null;
  }

  async function openCommunityProfile(memberId: string) {
    const requestId = ++communityProfileRequestRef.current;
    setHoverCommunityProfile(null);
    setMemberProfileMenuOpen(false);
    const member = communityMembers.find((item) => item.id === memberId);
    const cached = communityProfileCacheRef.current.get(memberId);
    const instantProfile: CommunityMemberProfile = cached ?? {
      userId: memberId,
      displayName: member?.full_name ?? messages.find((item) => item.author?.id === memberId)?.author?.full_name ?? (memberId === userId ? profile?.full_name : null) ?? "Miembro",
      avatarUrl: member?.avatar_url ?? (memberId === userId ? profile?.avatar_url : null) ?? null,
      memberNumber: member?.member_number ?? null,
      bannerUrl: member?.banner_url ?? null,
      cardColor: member?.card_color ?? "#B7D7C3",
      themeColorSecondary: member?.theme_color_secondary ?? "#8FB9A6",
      plateStyle: member?.plate_style ?? "classic",
      displayNameStyle: member?.display_name_style ?? "classic",
      displayNameAnimation: communityNameAnimation(member?.display_name_animation),
      displayNameFuzzySettings: normalizeFuzzyTextSettings(member?.display_name_fuzzy_settings),
      displayNamePrismColors: member?.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
      accentColor: member?.accent_color ?? "#3987FF",
      avatarFrame: member?.avatar_frame ?? "none",
      avatarDecorationId: member?.avatar_decoration_id ?? "none",
      profileFrameId: member?.profile_frame_id ?? "none",
      profileEffectId: member?.profile_effect_id ?? "none",
      statusExpiresAt: member?.status_expires_at ?? null,
      pronouns: "",
      appearanceReady: false,
      statusText: getVisibleCommunityStatus(member?.status_text, member?.status_expires_at),
      about: member?.about ?? "",
      joinedAt: member?.joined_at ?? "",
      roles: (member?.roles ?? []).map((role) => ({
        roleKey: role.role_key, label: role.label, badgeColor: role.badge_color,
      })),
      isOwnProfile: memberId === userId,
    };

    // Open the complete profile shell immediately from the member list/chat snapshot.
    // The detail request enriches it in the background without a blocking spinner.
    setCommunityProfileLoading(true);
    setCommunityProfileError("");
    setCopiedCommunityProfileId(null);
    setSelectedCommunityProfile(instantProfile);

    try {
      const response = await fetch("/api/community/profile/" + memberId, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { profile?: CommunityMemberProfile; error?: string } | null;
      if (requestId !== communityProfileRequestRef.current) return;
      if (!response.ok || !payload?.profile) {
        setCommunityProfileLoading(false);
        if (response.status !== 404) {
          setCommunityProfileError(payload?.error ?? "No se pudieron actualizar todos los detalles.");
        } else {
          communityProfileCacheRef.current.set(memberId, instantProfile);
          setCommunityProfileError("");
        }
        return;
      }
      communityProfileCacheRef.current.set(memberId, payload.profile);
      setCommunityMembers((current) => current.map((item) => item.id === memberId ? {
        ...item,
        full_name: payload.profile!.displayName,
        member_number: payload.profile!.memberNumber,
        avatar_url: payload.profile!.avatarUrl,
        status_text: payload.profile!.statusText,
        about: payload.profile!.about,
        joined_at: payload.profile!.joinedAt,
        banner_url: payload.profile!.bannerUrl,
        card_color: payload.profile!.cardColor,
         theme_color_secondary: payload.profile!.themeColorSecondary,
        plate_style: payload.profile!.plateStyle,
        display_name_style: payload.profile!.displayNameStyle ?? "classic",
        display_name_effect: payload.profile!.displayNameEffect ?? "plain",
        display_name_animation: payload.profile!.displayNameAnimation ?? "decrypt",
        display_name_fuzzy_settings: payload.profile!.displayNameFuzzySettings ?? DEFAULT_FUZZY_TEXT_SETTINGS,
        display_name_color: payload.profile!.displayNameColor ?? "default",
        accent_color: payload.profile!.accentColor,
        avatar_frame: payload.profile!.avatarFrame,
        avatar_decoration_id: payload.profile!.avatarDecorationId,
        profile_frame_id: payload.profile!.profileFrameId,
        profile_effect_id: payload.profile!.profileEffectId,
        display_name_prism_colors: payload.profile!.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
        display_name_gradient_start: payload.profile!.displayNameGradientStart,
        display_name_gradient_end: payload.profile!.displayNameGradientEnd,
        status_expires_at: payload.profile!.statusExpiresAt,
      } : item));
      setSelectedCommunityProfile((current) => current?.userId === memberId ? payload.profile! : current);
      setCommunityProfileLoading(false);
      setCommunityProfileError("");
    } catch {
      if (requestId === communityProfileRequestRef.current) {
        setCommunityProfileLoading(false);
        setCommunityProfileError("No se pudieron actualizar todos los detalles. Se mantiene la información disponible.");
      }
    }
  }

  openCommunityProfileRef.current = openCommunityProfile;

  function communityMemberProfileUrl(memberId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("member", memberId);
    return url.toString();
  }

  const clearCommunityMemberProfileUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("member");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    profileFromUrlRef.current = null;
  }, []);

  async function shareCommunityMemberProfile(memberId: string, displayName: string) {
    const url = communityMemberProfileUrl(memberId);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Perfil de " + displayName + " · PeakScore",
          text: "Mira el perfil de " + displayName + " en PeakScore Community.",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedCommunityProfileId(memberId);
      }
      setMemberProfileMenuOpen(false);
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name !== "AbortError") {
        setCommunityProfileError("No se pudo compartir el perfil.");
      }
    }
  }

  useEffect(() => {
    if (!userId || !activeSpace?.id) return;
    const memberId = new URLSearchParams(window.location.search).get("member");
    if (!memberId || profileFromUrlRef.current === memberId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberId)) return;
    profileFromUrlRef.current = memberId;
    void openCommunityProfileRef.current(memberId);
  }, [userId, activeSpace?.id]);

  useEffect(() => {
    if (!mentionSearchQuery || !activeChannelId || !userId) return;
    let active = true;
    const timeout = window.setTimeout(async () => {
      const { data, error: mentionError } = await supabase.rpc("search_community_member_profiles", {
        p_channel_id: activeChannelId,
        p_query: mentionSearchQuery,
        p_limit: 8,
      });
      if (!active) return;
      setMentionSuggestions(mentionError ? [] : (data ?? []) as MentionMember[]);
      setMentionActiveIndex(0);
    }, 160);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [activeChannelId, mentionSearchQuery, userId]);

  useEffect(() => {
    if (!mobileChannelsOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleDrawerKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileChannelsOpen(false);
    }

    window.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleDrawerKeyDown);
    };
  }, [mobileChannelsOpen]);

  useEffect(() => {
    if (!selectedCommunityProfile && !communityProfileLoading && !communityProfileError) return;
    function handleProfileKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        communityProfileRequestRef.current += 1;
        setSelectedCommunityProfile(null);
        setCommunityProfileLoading(false);
        setCommunityProfileError("");
        setCopiedCommunityProfileId(null);
        clearCommunityMemberProfileUrl();
      }
    }
    window.addEventListener("keydown", handleProfileKeyDown);
    return () => window.removeEventListener("keydown", handleProfileKeyDown);
  }, [selectedCommunityProfile, communityProfileLoading, communityProfileError, clearCommunityMemberProfileUrl]);

  useEffect(() => {
    const openProfileUserId = selectedCommunityProfile?.userId;
    if (!openProfileUserId || communityProfileStudioOpen) return;
    communityProfileCloseRef.current?.focus();
  }, [selectedCommunityProfile?.userId, communityProfileStudioOpen]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadCommunityMembers() {
      type MemberRow = {
        user_id: string; member_number: number | null; display_name: string; avatar_path: string | null;
        status_text: string | null; about: string | null; created_at: string; status_expires_at: string | null;
      };
      let memberData: MemberRow[] = [];
      if (activeSpace?.space_type === "preicfes") {
        const { data: memberships, error: membershipError } = await supabase
          .from("community_space_members")
          .select("user_id")
          .eq("space_id", activeSpace.id);
        if (!active || membershipError) return;
        const memberIds = (memberships ?? []).map((membership) => membership.user_id);
        if (memberIds.length) {
          const { data: spaceProfiles, error: spaceProfilesError } = await supabase
            .from("community_member_profiles")
            .select("user_id,member_number,display_name,avatar_path,status_text,about,created_at,status_expires_at")
            .in("user_id", memberIds)
            .order("display_name", { ascending: true });
          if (!active || spaceProfilesError) return;
          memberData = (spaceProfiles ?? []) as MemberRow[];
        }
      } else {
        const { data: globalProfiles, error: memberError } = await supabase
          .from("community_member_profiles")
          .select("user_id,member_number,display_name,avatar_path,status_text,about,created_at,status_expires_at")
          .order("display_name", { ascending: true })
          .limit(100);
        if (!active || memberError) return;
        memberData = (globalProfiles ?? []) as MemberRow[];
        // Keep the signed-in Founder visible even when the alphabetical 100-member
        // window would otherwise omit their profile from the right-hand roster.
        if (!memberData.some((member) => member.user_id === userId)) {
          const { data: ownProfile } = await supabase.from("community_member_profiles")
            .select("user_id,member_number,display_name,avatar_path,status_text,about,created_at,status_expires_at")
            .eq("user_id", userId)
            .maybeSingle();
          if (active && ownProfile) memberData.push(ownProfile as MemberRow);
        }
      }
      const ids = memberData.map((member) => member.user_id);
      let roleRows: Array<{
        user_id: string; role_key: string; label: string; badge_color: string;
        position?: number; mentionable?: boolean; hoist?: boolean;
      }> = [];
      if (ids.length && activeSpace?.space_type === "preicfes") {
        const { data: assignments, error: assignmentError } = await supabase
          .from("community_space_member_roles")
          .select("user_id,role_key")
          .eq("space_id", activeSpace.id)
          .in("user_id", ids);
        if (!assignmentError && (assignments ?? []).length) {
          const roleKeys = [...new Set((assignments ?? []).map((assignment) => assignment.role_key))];
          const { data: catalog } = await supabase.from("community_role_catalog")
            .select("role_key,label,badge_color,position,mentionable,hoist")
            .in("role_key", roleKeys);
          const byKey = new Map((catalog ?? []).map((role) => [role.role_key, role]));
          roleRows = (assignments ?? []).flatMap((assignment) => {
            const role = byKey.get(assignment.role_key);
            return role ? [{
              user_id: assignment.user_id,
              role_key: assignment.role_key,
              label: role.label,
              badge_color: role.badge_color,
              position: role.position ?? undefined,
              mentionable: role.mentionable ?? false,
              hoist: role.hoist ?? false,
            }] : [];
          }).sort((a, b) => (a.position ?? 100) - (b.position ?? 100));
        }
      } else if (ids.length) {
        const extendedRoles = await supabase.from("community_public_role_badges")
          .select("user_id,role_key,label,badge_color,position,mentionable,hoist")
          .in("user_id", ids)
          .order("position", { ascending: true });
        if (!extendedRoles.error) {
          roleRows = extendedRoles.data ?? [];
        } else {
          // The UI remains compatible while the role-hierarchy migration is pending.
          const legacyRoles = await supabase.from("community_public_role_badges")
            .select("user_id,role_key,label,badge_color")
            .in("user_id", ids);
          roleRows = (legacyRoles.data ?? []) as typeof roleRows;
        }
      }
      if (isFounder && activeSpace?.space_type !== "preicfes" && ids.includes(userId)) {
        // Founder is a reserved platform role and must always be hoisted above
        // configurable community roles in the Discord-style member list.
        roleRows = roleRows.filter((role) => !(role.user_id === userId && role.role_key === "fundador"));
        roleRows.push({
          user_id: userId,
          role_key: "fundador",
          label: "Founder",
          badge_color: "#8B5CF6",
          position: -100,
          mentionable: false,
          hoist: true,
        });
      }
      let appearanceRows: Array<{ user_id: string; banner_path: string | null; card_color: string | null; theme_color_secondary: string | null; plate_style: CommunityPlateStyle | null; display_name_style: CommunityDisplayNameStyle | null; display_name_effect: CommunityDisplayNameEffect | null; display_name_animation: CommunityDisplayNameAnimation | null; display_name_fuzzy_settings: FuzzyTextSettings | null; display_name_gradient_start: string | null; display_name_gradient_end: string | null; display_name_color: CommunityDisplayNameColor | null; display_name_prism_colors: string[] | null; accent_color: string | null; avatar_frame: CommunityAvatarFrame | null; avatar_decoration_id: CommunityAvatarDecoration | null; profile_frame_id: CommunityProfileFrame | null; profile_effect_id: CommunityProfileEffect | null }> = [];
      if (ids.length) {
        const { data: appearanceData, error: appearanceError } = await supabase
          .from("community_member_profiles")
          .select("user_id,banner_path,card_color,theme_color_secondary,plate_style,display_name_style,display_name_effect,display_name_animation,display_name_fuzzy_settings,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors,accent_color,avatar_frame,avatar_decoration_id,profile_frame_id,profile_effect_id")
          .in("user_id", ids);
        if (appearanceError) {
          console.warn("[Community] Optional member appearance unavailable.", { code: appearanceError.code });
        } else {
          appearanceRows = (appearanceData ?? []) as typeof appearanceRows;
        }
      }
      if (!active) return;
      const appearanceByMember = new Map(appearanceRows.map((item) => [item.user_id, item]));
      const rolesByMember = new Map<string, CommunityRole[]>();
      (roleRows ?? []).forEach((role) => {
        const list = rolesByMember.get(role.user_id) ?? [];
        list.push({
          role_key: role.role_key,
          label: role.label,
          badge_color: role.badge_color,
          display_as_badge: true,
          position: role.position,
          mentionable: role.mentionable,
          hoist: role.hoist,
        });
        rolesByMember.set(role.user_id, list);
      });
      const memberRows = memberData.map((member) => ({
        id: member.user_id,
        member_number: member.member_number,
        full_name: member.display_name,
        avatar_url: member.avatar_path
          ? supabase.storage.from("community-profile-avatars").getPublicUrl(member.avatar_path).data.publicUrl
          : null,
        status_text: getVisibleCommunityStatus(member.status_text, member.status_expires_at),
        about: member.about ?? "",
        joined_at: member.created_at,
        banner_url: appearanceByMember.get(member.user_id)?.banner_path
          ? supabase.storage.from("community-profile-banners").getPublicUrl(appearanceByMember.get(member.user_id)!.banner_path!).data.publicUrl
          : null,
        card_color: appearanceByMember.get(member.user_id)?.card_color ?? "#B7D7C3",
         theme_color_secondary: appearanceByMember.get(member.user_id)?.theme_color_secondary ?? "#8FB9A6",
        plate_style: appearanceByMember.get(member.user_id)?.plate_style ?? "classic",
        display_name_style: appearanceByMember.get(member.user_id)?.display_name_style ?? "classic",
        display_name_effect: appearanceByMember.get(member.user_id)?.display_name_effect ?? "plain",
        display_name_animation: communityNameAnimation(appearanceByMember.get(member.user_id)?.display_name_animation),
        display_name_fuzzy_settings: appearanceByMember.get(member.user_id)?.display_name_fuzzy_settings ?? DEFAULT_FUZZY_TEXT_SETTINGS,
        display_name_color: appearanceByMember.get(member.user_id)?.display_name_color ?? "default",
        display_name_gradient_start: appearanceByMember.get(member.user_id)?.display_name_gradient_start ?? "#B86BFF",
        display_name_gradient_end: appearanceByMember.get(member.user_id)?.display_name_gradient_end ?? "#4E9BFF",
        display_name_prism_colors: appearanceByMember.get(member.user_id)?.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
        accent_color: appearanceByMember.get(member.user_id)?.accent_color ?? "#3987FF",
        avatar_frame: appearanceByMember.get(member.user_id)?.avatar_frame ?? "none",
        avatar_decoration_id: appearanceByMember.get(member.user_id)?.avatar_decoration_id ?? "none",
        profile_frame_id: appearanceByMember.get(member.user_id)?.profile_frame_id ?? "none",
        profile_effect_id: appearanceByMember.get(member.user_id)?.profile_effect_id ?? "none",
        status_expires_at: member.status_expires_at ?? null,
        roles: rolesByMember.get(member.user_id) ?? [],
      }));
      setCommunityMembers(memberRows);

    }
    void loadCommunityMembers();
    return () => { active = false; };
  }, [userId, activeSpace?.id, activeSpace?.space_type]);

  const communityMemberGroups = useMemo(() => {
    const priority: Record<string, number> = {
      fundador: 0, administrador: 1, moderador: 2, profesor: 3, estudiante: 4,
    };
    const groups = new Map<string, { key: string; label: string; color: string; priority: number; members: CommunityMemberSummary[] }>();
    for (const member of communityMembers) {
      const role = [...(member.roles ?? [])]
        .filter((candidate) => candidate.hoist ?? (priority[candidate.role_key] ?? 99) <= 3)
        .sort((a, b) => (a.position ?? priority[a.role_key] ?? 99) - (b.position ?? priority[b.role_key] ?? 99))[0];
      const key = role?.role_key ?? "members";
      const label = role?.label ?? "Miembros";
      const group = groups.get(key) ?? {
        key, label, color: role?.badge_color ?? "#9297a1",
        priority: role?.position ?? priority[key] ?? 99, members: [],
      };
      group.members.push(member);
      groups.set(key, group);
    }
    return [...groups.values()]
      .map((group) => ({
        ...group,
        members: group.members.sort((a, b) =>
          Number(onlineMemberIds.includes(b.id)) - Number(onlineMemberIds.includes(a.id))
          || a.full_name.localeCompare(b.full_name, "es"),
        ),
      }))
      .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label, "es"));
  }, [communityMembers, onlineMemberIds]);

  const groupedChannels = useMemo(() => {
    const baseCategories: CommunityChannelCategory[] = communityChannelCategories.length
      ? communityChannelCategories
      : CATEGORIES.map((name, index) => ({ id: name, name, position: (index + 1) * 10 }));
    const knownNames = new Set(baseCategories.map((category) => category.name.toLocaleLowerCase("es")));
    const extraCategories = Array.from(new Set(channels.map((channel) => channel.category)))
      .filter((name) => !knownNames.has(name.toLocaleLowerCase("es")))
      .map((name, index) => ({ id: "channel-category:" + name, name, position: 1000 + index }));
    return [...baseCategories, ...extraCategories]
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "es"))
      .map((category) => ({
        category: category.name,
        channels: channels.filter((channel) => channel.category.toLocaleLowerCase("es") === category.name.toLocaleLowerCase("es"))
          .sort((a, b) => a.position - b.position),
      }));
  }, [channels, communityChannelCategories]);

  const refreshStats = useCallback(async (spaceId?: string) => {
    if (spaceId && spaceId !== GLOBAL_COMMUNITY_SPACE_ID) {
      const { count, error: countError } = await supabase
        .from("community_space_members")
        .select("user_id", { count: "exact", head: true })
        .eq("space_id", spaceId);
      if (!countError) setMemberCount(count ?? 0);
      return;
    }
    const { count, error: countError } = await supabase
      .from("community_member_profiles")
      .select("user_id", { count: "exact", head: true });
    if (!countError) setMemberCount(count ?? 0);
  }, []);

  const activeSpaceId = activeSpace?.id ?? null;
  const activeSpaceType = activeSpace?.space_type ?? null;
  const appearanceStorageKey = userId && activeSpaceId
    ? "peakscore:community:appearance:" + userId + ":" + activeSpaceId
    : null;
  const audioStorageKey = userId ? "peakscore:community:audio:" + userId : null;
  const canUseMicrophone = isFounder || Boolean(profile?.roles?.some((role) =>
    ["administrador", "moderador", "profesor", "docente"].includes(role.role_key),
  ));
  const markChannelRead = useCallback((
    channelId: string,
    readerId: string | null,
    markerSpaceId: string | null,
  ) => {
    setUnreadCounts((current) => ({ ...current, [channelId]: 0 }));
    if (!readerId || !markerSpaceId) return;
    const readAt = new Date().toISOString();
    try {
      const key = "peakscore:community:read:" + readerId + ":" + markerSpaceId;
      const current = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, string>;
      current[channelId] = readAt;
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      // The database marker still persists when local storage is blocked.
    }
    const readClient = supabase as unknown as CommunityReadClient;
    void readClient.from("community_channel_reads")
      .upsert({ user_id: readerId, channel_id: channelId, last_read_at: readAt }, { onConflict: "user_id,channel_id" })
      .then(({ error: markerError }) => {
        if (markerError && markerError.code !== "42P01" && markerError.code !== "PGRST205") {
          console.warn("[PeakScore Community] Channel read marker was not saved.", { code: markerError.code });
        }
      });
  }, []);

  const canvasBackground = appearanceMode === "server"
    ? (activeSpace?.background_color ?? "#171c24")
    : appearanceMode === "white"
      ? "#f1f3f5"
      : appearanceMode === "gray"
        ? "#353a43"
        : appearanceMode === "custom"
          ? appearanceCustomColor
          : "#0b0d11";
  const canvasLuminance = (() => {
    const normalized = canvasBackground.replace("#", "");
    const rgb = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16) / 255);
    const linear = rgb.map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
  })();
  const communityCanvasStyle = {
    "--community-canvas-bg": canvasBackground,
    "--community-canvas-text": canvasLuminance > .42 ? "#171a1f" : "#e8ebef",
    "--community-canvas-muted": canvasLuminance > .42 ? "#4d5560" : "#9aa2ad",
    "--community-chroma-opacity": chromaEnabled ? ".72" : "0",
  } as CSSProperties;

  useEffect(() => {
    if (!appearanceStorageKey) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let saved: { mode?: string; customColor?: string; chroma?: boolean } = {};
      try {
        saved = JSON.parse(window.localStorage.getItem(appearanceStorageKey) || "{}");
      } catch {
        saved = {};
      }
      setAppearanceMode(
        saved.mode === "server" || saved.mode === "black" || saved.mode === "gray" || saved.mode === "white" || saved.mode === "custom"
          ? saved.mode
          : "server",
      );
      if (typeof saved.customColor === "string" && /^#[0-9a-f]{6}$/i.test(saved.customColor)) {
        setAppearanceCustomColor(saved.customColor);
      }
      setChromaEnabled(saved.chroma !== false);
      setAppearanceLoadedKey(appearanceStorageKey);
    });
    return () => { cancelled = true; };
  }, [appearanceStorageKey]);

  useEffect(() => {
    if (!appearanceStorageKey || appearanceLoadedKey !== appearanceStorageKey) return;
    try {
      window.localStorage.setItem(appearanceStorageKey, JSON.stringify({
        mode: appearanceMode,
        customColor: appearanceCustomColor,
        chroma: chromaEnabled,
      }));
    } catch {
      // Appearance still applies in memory if local storage is unavailable.
    }
  }, [appearanceStorageKey, appearanceLoadedKey, appearanceMode, appearanceCustomColor, chromaEnabled]);

  useEffect(() => {
    if (!audioStorageKey) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let saved: { input?: string; output?: string } = {};
      try {
        saved = JSON.parse(window.localStorage.getItem(audioStorageKey) || "{}");
      } catch {
        saved = {};
      }
      setAudioInputDeviceId(typeof saved.input === "string" ? saved.input : "");
      setAudioOutputDeviceId(typeof saved.output === "string" ? saved.output : "");
      setAudioLoadedKey(audioStorageKey);
    });
    return () => { cancelled = true; };
  }, [audioStorageKey]);

  useEffect(() => {
    if (!audioStorageKey || audioLoadedKey !== audioStorageKey) return;
    try {
      window.localStorage.setItem(audioStorageKey, JSON.stringify({
        input: audioInputDeviceId,
        output: audioOutputDeviceId,
      }));
    } catch {
      // Audio device choices remain selected for the current page session.
    }
  }, [audioStorageKey, audioLoadedKey, audioInputDeviceId, audioOutputDeviceId]);

  const refreshAudioDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setAudioFeedback("Este navegador no permite consultar dispositivos de audio.");
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter((device) => device.kind === "audioinput"));
      setAudioOutputDevices(devices.filter((device) => device.kind === "audiooutput"));
      setAudioFeedback(devices.length ? "" : "No se encontraron dispositivos de audio.");
    } catch {
      setAudioFeedback("No se pudieron consultar los dispositivos de audio.");
    }
  }, []);

  useEffect(() => {
    if (!audioOutputDeviceId) return;
    type SinkCapableMediaElement = HTMLMediaElement & {
      setSinkId?: (deviceId: string) => Promise<void>;
    };
    const applyOutput = (root: ParentNode) => {
      root.querySelectorAll("audio,video").forEach((element) => {
        const media = element as SinkCapableMediaElement;
        if (typeof media.setSinkId !== "function") return;
        void media.setSinkId(audioOutputDeviceId).catch(() => {
          setAudioFeedback("El navegador no permitió aplicar esa salida a un reproductor.");
        });
      });
    };
    applyOutput(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("audio,video")) {
              const media = node as SinkCapableMediaElement;
              if (typeof media.setSinkId === "function") {
                void media.setSinkId(audioOutputDeviceId).catch(() => {
                  setAudioFeedback("El navegador no permitió aplicar esa salida a un reproductor.");
                });
              }
            }
            applyOutput(node);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [audioOutputDeviceId]);

  function openAudioPanel(mode: "input" | "output") {
    const nextMode = audioPanelMode === mode ? null : mode;
    setAudioPanelMode(nextMode);
    if (nextMode) void refreshAudioDevices();
  }

  useEffect(() => {
    if (!audioPanelMode) return;
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.addEventListener) return;
    const handleDeviceChange = () => void refreshAudioDevices();
    mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [audioPanelMode, refreshAudioDevices]);

  async function requestCommunityVerification() {
    if (!activeSpace || activeSpace.space_type !== "preicfes" || verificationRequestBusy) return;
    setVerificationRequestBusy(true);
    setVerificationFeedback("");
    const { error: requestError } = await supabase.rpc("request_community_space_verification", {
      p_space_id: activeSpace.id,
    });
    if (requestError) {
      setVerificationFeedback(requestError.code === "42501"
        ? "Debes formar parte de esta comunidad para solicitar su verificación."
        : "No se pudo enviar la solicitud. Comprueba que la verificación esté habilitada.");
    } else {
      setCommunitySpaces((current) => current.map((space) => space.id === activeSpace.id
        ? { ...space, verification_status: "pending" }
        : space));
      setActiveSpace((current) => current?.id === activeSpace.id
        ? { ...current, verification_status: "pending" }
        : current);
      setVerificationFeedback("Solicitud enviada a revisión de PeakScore.");
    }
    setVerificationRequestBusy(false);
  }

  async function verifyMicrophoneDevice() {
    if (!canUseMicrophone) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setAudioFeedback("Este navegador no permite comprobar el micrófono.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioInputDeviceId ? { deviceId: { exact: audioInputDeviceId } } : true,
      });
      const track = stream.getAudioTracks()[0];
      const label = track?.label || "Micrófono disponible";
      stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      setAudioFeedback("Permiso correcto · " + label);
      await refreshAudioDevices();
    } catch {
      setAudioFeedback("No se pudo acceder al micrófono. Revisa los permisos del navegador.");
    }
  }

  const loadMessages = useCallback(async (channelId: string) => {
    const requestId = ++messageLoadRequestRef.current;
    if (activeChannelIdRef.current !== channelId) return;
    const extendedColumns = "id,channel_id,author_id,body,created_at,edited_at,reply_to_message_id,attachment_path,attachment_alt";
    const legacyColumns = "id,channel_id,author_id,body,created_at,edited_at";

    const extendedResult = await supabase
      .from("community_messages")
      .select(extendedColumns)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(60);

    let rowsData: Array<{
      id: string; channel_id: string; author_id: string; body: string;
      created_at: string; edited_at: string | null;
      reply_to_message_id?: string | null;
      attachment_path?: string | null;
      attachment_alt?: string | null;
    }> | null = extendedResult.data as Array<{
      id: string; channel_id: string; author_id: string; body: string;
      created_at: string; edited_at: string | null;
      reply_to_message_id?: string | null;
      attachment_path?: string | null;
      attachment_alt?: string | null;
    }> | null;
    let queryError = extendedResult.error;
    let hasExtendedSchema = !queryError;
    if (queryError && ["42703", "PGRST204", "PGRST200"].includes(queryError.code ?? "")) {
      // The app remains readable until the companion chat migration is applied.
      const legacyResult = await supabase
        .from("community_messages")
        .select(legacyColumns)
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(60);
      rowsData = legacyResult.data as Array<{
        id: string; channel_id: string; author_id: string; body: string;
        created_at: string; edited_at: string | null;
      }> | null;
      queryError = legacyResult.error;
      hasExtendedSchema = false;
    }

    if (requestId !== messageLoadRequestRef.current || activeChannelIdRef.current !== channelId) return;
    if (queryError) {
      setError("No pudimos cargar los mensajes. Vuelve a intentarlo.");
      return;
    }

    const rows = rowsData ?? [];
    if (!rows.length) {
      setMessages([]);
      setMentionDisplayNames({});
      setError("");
      return;
    }

    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const messageIds = rows.map((row) => row.id);
    const mentionIds = Array.from(new Set(rows.flatMap((row) =>
      Array.from(row.body.matchAll(/@\{([0-9a-f-]{36})\|[^{}|\n]{1,80}\}/gi), (match) => match[1]),
    ))).slice(0, 80);
    const attachmentPaths = Array.from(new Set(
      rows.map((row) => row.attachment_path).filter((value): value is string => Boolean(value)),
    ));

    const [
      { data: authors, error: authorsError },
      { data: publicRoleBadges, error: badgeError },
      { data: metrics, error: metricsError },
      signedImagesResult,
      mentionProfilesResult,
    ] = await Promise.all([
      supabase.from("community_member_profiles")
        .select("user_id,display_name,avatar_path,status_text,display_name_style,display_name_effect,display_name_animation,display_name_fuzzy_settings,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors")
        .in("user_id", authorIds),
      supabase.from("community_public_role_badges")
        .select("user_id,role_key,label,badge_color,position,mentionable,hoist")
        .in("user_id", authorIds)
        .order("position", { ascending: true }),
      supabase.rpc("get_community_message_metrics", { p_message_ids: messageIds }),
      attachmentPaths.length
        ? supabase.storage.from("community-attachments").createSignedUrls(attachmentPaths, 3600)
        : Promise.resolve({ data: [], error: null }),
      mentionIds.length
        ? supabase.rpc("resolve_community_mention_members", {
            p_channel_id: channelId,
            p_user_ids: mentionIds,
          })
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Message delivery must not depend on optional schema additions. Role hierarchy
    // is read from a scope-safe projection. Space members see space roles here,
    // never the global staff roles unless assigned in that space as well.
    let compatiblePublicRoleBadges = (publicRoleBadges ?? []) as PublicRoleBadge[];
    if (activeSpaceType === "preicfes" && activeSpaceId && authorIds.length) {
      const { data: spaceAssignments, error: spaceRolesError } = await supabase
        .from("community_space_member_roles")
        .select("user_id,role_key")
        .eq("space_id", activeSpaceId)
        .in("user_id", authorIds);
      if (!spaceRolesError && (spaceAssignments ?? []).length) {
        const roleKeys = [...new Set((spaceAssignments ?? []).map((assignment) => assignment.role_key))];
        const { data: catalog } = await supabase.from("community_role_catalog")
          .select("role_key,label,badge_color,position,mentionable,hoist")
          .in("role_key", roleKeys);
        const byKey = new Map((catalog ?? []).map((role) => [role.role_key, role]));
        compatiblePublicRoleBadges = (spaceAssignments ?? []).flatMap((assignment) => {
          const role = byKey.get(assignment.role_key);
          return role ? [{
            user_id: assignment.user_id,
            role_key: assignment.role_key,
            label: role.label,
            badge_color: role.badge_color,
            position: role.position ?? null,
            mentionable: role.mentionable ?? false,
            hoist: role.hoist ?? false,
          }] : [];
        });
      } else {
        compatiblePublicRoleBadges = [];
      }
    }
    if (activeSpaceType === "global" && badgeError && authorIds.length) {
      const legacyBadges = await supabase.from("community_public_role_badges")
        .select("user_id,role_key,label,badge_color")
        .in("user_id", authorIds);
      compatiblePublicRoleBadges = (legacyBadges.data ?? []) as PublicRoleBadge[];
    }
    if (authorsError || badgeError || metricsError || signedImagesResult.error || mentionProfilesResult.error) {
      console.warn("[PeakScore Community] Optional profile/badge/metrics/attachment/mention data is unavailable.", {
        profiles: authorsError?.code ?? null,
        publicBadges: badgeError?.code ?? null,
        metrics: metricsError?.code ?? null,
        attachmentSigning: signedImagesResult.error?.name ?? null,
        mentionResolution: mentionProfilesResult.error?.code ?? null,
      });
    }

    if (requestId !== messageLoadRequestRef.current || activeChannelIdRef.current !== channelId) return;

    const canonicalMentionNames = Object.fromEntries(
      ((mentionProfilesResult.error ? [] : mentionProfilesResult.data ?? []) as Array<{ user_id: string; full_name: string }>)
        .map((mention) => [mention.user_id, mention.full_name]),
    ) as Record<string, string>;
    setMentionDisplayNames(canonicalMentionNames);

    const authorRows = (authors ?? []) as Array<{
      user_id: string; display_name: string; avatar_path: string | null; status_text: string | null;
      display_name_style?: CommunityDisplayNameStyle | null; display_name_effect?: CommunityDisplayNameEffect | null;
      display_name_animation?: CommunityDisplayNameAnimation | null; display_name_fuzzy_settings?: FuzzyTextSettings | null;
      display_name_color?: CommunityDisplayNameColor | null; display_name_gradient_start?: string | null; display_name_gradient_end?: string | null; display_name_prism_colors?: string[] | null;
    }>;
    const authorMap = new Map<string, CommunityMemberSummary>(
      authorRows.map((author) => [author.user_id, {
        id: author.user_id,
        full_name: author.display_name,
        avatar_url: author.avatar_path
          ? supabase.storage.from("community-profile-avatars").getPublicUrl(author.avatar_path).data.publicUrl
          : null,
        status_text: author.status_text ?? "",
        display_name_style: author.display_name_style ?? "classic",
        display_name_effect: author.display_name_effect ?? "plain",
        display_name_animation: communityNameAnimation(author.display_name_animation),
        display_name_fuzzy_settings: author.display_name_fuzzy_settings ?? DEFAULT_FUZZY_TEXT_SETTINGS,
        display_name_color: author.display_name_color ?? "default",
        display_name_gradient_start: author.display_name_gradient_start ?? "#B86BFF",
        display_name_gradient_end: author.display_name_gradient_end ?? "#4E9BFF",
        display_name_prism_colors: author.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
      }]),
    );
    const roleMap = new Map<string, CommunityRole[]>();
    compatiblePublicRoleBadges.forEach((badge) => {
      const current = roleMap.get(badge.user_id) ?? [];
      current.push({
        role_key: badge.role_key,
        label: badge.label,
        badge_color: badge.badge_color,
        display_as_badge: true,
        position: badge.position ?? undefined,
        mentionable: badge.mentionable ?? false,
        hoist: badge.hoist ?? false,
      });
      roleMap.set(badge.user_id, current);
    });

    const metricsByMessage = new Map<string, CommunityMessageMetrics>(
      ((metricsError ? [] : metrics ?? []) as CommunityMessageMetrics[]).map((item) => [item.message_id, item]),
    );
    const signedUrlByPath = new Map<string, string>(
      ((signedImagesResult.error ? [] : signedImagesResult.data ?? []) as Array<{ path: string | null; signedUrl: string | null }>)
        .filter((item): item is { path: string; signedUrl: string } => Boolean(item.path && item.signedUrl))
        .map((item) => [item.path, item.signedUrl]),
    );

    const hydratedMessages = rows.slice().reverse().map((row) => {
      const itemMetrics = metricsByMessage.get(row.id);
      const legacyReactionCount = itemMetrics?.reaction_count ?? 0;
      return {
        ...row,
        reply_to_message_id: hasExtendedSchema ? row.reply_to_message_id ?? null : null,
        attachment_path: hasExtendedSchema ? row.attachment_path ?? null : null,
        attachment_alt: hasExtendedSchema ? row.attachment_alt ?? null : null,
        attachment_url: row.attachment_path ? signedUrlByPath.get(row.attachment_path) ?? null : null,
        author: authorMap.has(row.author_id)
          ? { ...authorMap.get(row.author_id)!, roles: roleMap.get(row.author_id) ?? [] }
          : null,
        channel: channels.find((channel) => channel.id === row.channel_id) ?? null,
        reaction_count: legacyReactionCount,
        reaction_counts: itemMetrics?.reaction_counts ?? (legacyReactionCount > 0 ? { "👍": legacyReactionCount } : {}),
        viewer_reactions: itemMetrics?.viewer_reactions ?? (itemMetrics?.viewer_liked ? ["👍"] : []),
        reply_count: itemMetrics?.reply_count ?? itemMetrics?.comment_count ?? 0,
      };
    });
    // A remote INSERT can refresh the canonical history while this user is
    // uploading or sending. Keep pending local rows until their own request
    // resolves, instead of making them disappear during hydration.
    setMessages((current) => [
      ...hydratedMessages,
      ...current.filter((item) => item.pending && item.channel_id === channelId),
    ]);
    setError("");
  }, [channels, activeSpaceId, activeSpaceType]);

  useEffect(() => {
    let alive = true;
    async function initialize() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        router.replace("/login?next=/comunidad");
        return;
      }
      setUserId(user.id);

      const spaceResult = await supabase.from("community_spaces")
        .select("id,slug,name,space_type,visibility,verification_status,icon_key,accent_color,background_color,icon_path,banner_path")
        .eq("is_enabled", true)
        .order("created_at", { ascending: false });
      const fallbackGlobalSpace: CommunitySpace = {
        id: GLOBAL_COMMUNITY_SPACE_ID,
        slug: "peakscore",
        name: "PeakScore Community",
        space_type: "global",
        visibility: "public",
        verification_status: "verified",
        icon_key: "users",
        accent_color: "#7FE05C",
        background_color: "#171C24",
        icon_path: null, banner_path: null, icon_url: null, banner_url: null,
      };
      let spacesRows = (spaceResult.data ?? []) as CommunitySpace[];
      let spacesQueryError = spaceResult.error;
      if (spacesQueryError && ["42703", "PGRST204", "PGRST205"].includes(spacesQueryError.code ?? "")) {
        const legacySpaces = await supabase.from("community_spaces")
          .select("id,slug,name,space_type,visibility,icon_key,accent_color,icon_path,banner_path")
          .eq("is_enabled", true)
          .order("created_at", { ascending: false });
        spacesQueryError = legacySpaces.error;
        spacesRows = ((legacySpaces.data ?? []) as Omit<CommunitySpace, "verification_status">[])
          .map((space) => ({ ...space, verification_status: space.space_type === "global" ? "verified" : "unverified" }));
      }
      const spacesAvailable = !spacesQueryError;
      const accessibleSpaces = spacesAvailable
        ? spacesRows.map((space) => ({
            ...space,
            verification_status: space.verification_status ?? (space.space_type === "global" ? "verified" : "unverified"),
            icon_url: space.icon_path ? supabase.storage.from("community-profile-avatars").getPublicUrl(space.icon_path).data.publicUrl : null,
            banner_url: space.banner_path ? supabase.storage.from("community-profile-avatars").getPublicUrl(space.banner_path).data.publicUrl : null,
          }))
        : [fallbackGlobalSpace];
      if (spacesAvailable && !accessibleSpaces.some((space) => space.space_type === "global")) {
        accessibleSpaces.unshift(fallbackGlobalSpace);
      }
      const requestedSpaceSlug = new URLSearchParams(window.location.search).get("space");
      const requestedSpace = requestedSpaceSlug
        ? accessibleSpaces.find((space) => space.slug === requestedSpaceSlug)
        : null;
      if (requestedSpaceSlug && spacesAvailable && !requestedSpace) {
        // RLS did not return this private space for the signed-in member.
        router.replace("/comunidad");
      }
      const resolvedSpace = requestedSpace ?? accessibleSpaces.find((space) => space.space_type === "global") ?? fallbackGlobalSpace;
      setCommunitySpaces(accessibleSpaces);
      setActiveSpace(resolvedSpace);

      if (resolvedSpace.space_type === "preicfes" && resolvedSpace.visibility === "public") {
        const { error: joinError } = await supabase.rpc("join_community_space", {
          p_space_id: resolvedSpace.id,
        });
        if (joinError) {
          console.warn("[PeakScore Community] Could not register public PreICFES membership.", { code: joinError.code });
        }
      }

      const [
        { data: currentProfile },
        { data: channelData },
        { data: roleData },
        { data: roleAssignments },
        { data: platformProfile },
        { data: categoryData, error: categoryError },
      ] = await Promise.all([
        supabase.from("community_member_profiles")
          .select("user_id,display_name,avatar_path,status_text,status_expires_at,display_name_style,display_name_effect,display_name_animation,display_name_fuzzy_settings,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors").eq("user_id", user.id).maybeSingle(),
        supabase.from("community_channels")
          .select("id,slug,name,description,category,position,is_read_only,is_private,channel_type,icon_key,accent_color")
          .eq("space_id", resolvedSpace.id)
          .order("position"),
        supabase.from("community_role_catalog")
          .select("role_key,label,badge_color,display_as_badge,position,hoist"),
        supabase.from("community_member_roles")
          .select("user_id,role_key").eq("user_id", user.id),
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("community_channel_categories")
          .select("id,name,position")
          .eq("space_id", resolvedSpace.id)
          .eq("is_archived", false)
          .order("position", { ascending: true })
          .order("name", { ascending: true }),
      ]);
      let compatibleChannels: Channel[] | null = channelData as unknown as Channel[] | null;
      let compatibleRoles: CommunityRole[] | null = roleData as unknown as CommunityRole[] | null;
      if (!channelData) {
        if (resolvedSpace.space_type === "global") {
          // Preserve the legacy global chat until its space_id migration is applied.
          const legacyChannels = await supabase.from("community_channels")
            .select("id,slug,name,description,category,position,is_read_only,is_private")
            .order("position");
          compatibleChannels = (legacyChannels.data ?? []).map((channel) => ({
            ...channel, channel_type: "text", icon_key: "hash", accent_color: "#01C8EF",
          })) as Channel[];
        } else {
          // Never fall back to global channels from inside a private PreICFES route.
          compatibleChannels = [];
          setError("La separación de esta comunidad todavía está pendiente de migración. No se cargaron canales globales como alternativa.");
        }
      }
      if (!roleData) {
        const legacyRoles = await supabase.from("community_role_catalog")
          .select("role_key,label,badge_color,display_as_badge");
        compatibleRoles = (legacyRoles.data ?? []).map((role) => ({
          ...role, position: null, hoist: null,
        })) as unknown as CommunityRole[];
      }
      if (!alive) return;
      setIsFounder(platformProfile?.role === "admin");
      const catalog = (compatibleRoles ?? []) as CommunityRole[];
      const currentRoles = ((roleAssignments ?? []) as { user_id: string; role_key: string }[])
        .map((assignment) => catalog.find((role) => role.role_key === assignment.role_key))
        .filter((role): role is CommunityRole => Boolean(role));
      const ownAvatarUrl = currentProfile?.avatar_path
        ? supabase.storage.from("community-profile-avatars").getPublicUrl(currentProfile.avatar_path).data.publicUrl
        : null;
      setProfile(currentProfile ? {
        id: currentProfile.user_id,
        full_name: currentProfile.display_name,
        avatar_url: ownAvatarUrl,
        status_text: getVisibleCommunityStatus(currentProfile.status_text, currentProfile.status_expires_at),
        display_name_style: currentProfile.display_name_style ?? "classic",
        display_name_effect: currentProfile.display_name_effect ?? "plain",
        display_name_animation: communityNameAnimation(currentProfile.display_name_animation),
        display_name_fuzzy_settings: currentProfile.display_name_fuzzy_settings ?? DEFAULT_FUZZY_TEXT_SETTINGS,
        display_name_color: currentProfile.display_name_color ?? "default",
        display_name_gradient_start: currentProfile.display_name_gradient_start ?? "#B86BFF",
        display_name_gradient_end: currentProfile.display_name_gradient_end ?? "#4E9BFF",
        display_name_prism_colors: currentProfile.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
        roles: currentRoles,
      } : null);
      const list = (compatibleChannels ?? []) as Channel[];
      setChannels(list);
      if (!categoryError) {
        setCommunityChannelCategories((categoryData ?? []).map((category) => ({
          id: String(category.id),
          name: String(category.name),
          position: Number(category.position ?? 100),
        })));
      } else {
        const fallbackCategoryNames = Array.from(new Set(list.map((channel) => channel.category)));
        setCommunityChannelCategories(fallbackCategoryNames.map((name, index) => ({
          id: "channel-category:" + name,
          name,
          position: (index + 1) * 10,
        })));
      }

      // Restore cross-device read markers; local storage remains a backward-compatible fallback.
      const readStorageKey = "peakscore:community:read:" + user.id + ":" + resolvedSpace.id;
      let seenAt: Record<string, string> = {};
      try {
        seenAt = JSON.parse(window.localStorage.getItem(readStorageKey) || "{}") as Record<string, string>;
      } catch {
        seenAt = {};
      }
      const readClient = supabase as unknown as CommunityReadClient;
      const remoteReads = await readClient.from("community_channel_reads")
        .select("channel_id,last_read_at")
        .eq("user_id", user.id)
        .in("channel_id", list.map((channel) => channel.id));
      if (!remoteReads.error) {
        for (const marker of remoteReads.data ?? []) {
          const previous = Date.parse(seenAt[marker.channel_id] ?? "");
          const remote = Date.parse(marker.last_read_at);
          if (Number.isFinite(remote) && (!Number.isFinite(previous) || remote > previous)) {
            seenAt[marker.channel_id] = marker.last_read_at;
          }
        }
      }
      const trackedChannels = list.filter((channel) => typeof seenAt[channel.id] === "string");
      const unread: Record<string, number> = {};
      if (trackedChannels.length) {
        const remoteReadByChannel = new Map((remoteReads.data ?? []).map((marker) => [
          marker.channel_id,
          Date.parse(marker.last_read_at),
        ]));
        const localMarkersAreSynced = !remoteReads.error && trackedChannels.every((channel) =>
          (remoteReadByChannel.get(channel.id) ?? Number.NEGATIVE_INFINITY) >= Date.parse(seenAt[channel.id]),
        );
        const unreadRpc = localMarkersAreSynced
          ? await supabase.rpc("get_community_unread_counts", {
              p_channel_ids: trackedChannels.map((channel) => channel.id),
            })
          : { data: null, error: { code: "LOCAL_MARKER_NEWER" } };
        if (!unreadRpc.error) {
          for (const row of (unreadRpc.data ?? []) as Array<{ channel_id: string; unread_count: number | string }>) {
            unread[row.channel_id] = Math.min(99, Number(row.unread_count) || 0);
          }
        } else {
          // Compatibility path while the aggregated unread RPC has not been deployed.
          const oldestSeen = trackedChannels
            .map((channel) => Date.parse(seenAt[channel.id]))
            .filter(Number.isFinite)
            .reduce((oldest, value) => Math.min(oldest, value), Date.now());
          if (Number.isFinite(oldestSeen) && oldestSeen < Date.now()) {
            const unreadResult = await supabase.from("community_messages")
              .select("channel_id,author_id,created_at")
              .in("channel_id", trackedChannels.map((channel) => channel.id))
              .gt("created_at", new Date(oldestSeen).toISOString())
              .neq("author_id", user.id)
              .order("created_at", { ascending: true })
              .limit(1000);
            if (!unreadResult.error) {
              for (const row of (unreadResult.data ?? []) as Array<{ channel_id: string; author_id: string; created_at: string }>) {
                if (Date.parse(row.created_at) > Date.parse(seenAt[row.channel_id] ?? "")) {
                  unread[row.channel_id] = Math.min(99, (unread[row.channel_id] ?? 0) + 1);
                }
              }
            }
          }
        }
      }
      const initialNow = new Date().toISOString();
      for (const channel of list) {
        if (typeof seenAt[channel.id] !== "string") seenAt[channel.id] = initialNow;
      }
      setUnreadCounts(unread);
      try { window.localStorage.setItem(readStorageKey, JSON.stringify(seenAt)); } catch {
        // A blocked storage API disables cross-session unread restoration only.
      }

      await refreshStats(resolvedSpace.space_type === "preicfes" ? resolvedSpace.id : undefined);
      if (!alive) return;
      const requested = new URLSearchParams(window.location.search).get("channel");
      const selected = list.find((item) => item.slug === requested)
        ?? list.find((item) => item.slug === "general") ?? list[0];
      if (selected) {
        markChannelRead(selected.id, user.id, resolvedSpace.id);
        activeChannelIdRef.current = selected.id;
        setActiveChannelId(selected.id);
      }
      setLoading(false);
    }
    void initialize();
    return () => { alive = false; };
  }, [router, refreshStats, markChannelRead]);

  useEffect(() => {
    if (!activeChannelId || !userId) return;
    const channelId = activeChannelId;
    // Coalesce bursts of incoming messages: one history hydration per short
    // burst instead of a full profile/metrics/media refetch for every INSERT.
    void Promise.resolve().then(() => loadMessages(channelId));
    const messageSubscription = supabase.channel("community-messages-" + channelId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_messages",
        filter: "channel_id=eq." + channelId,
      }, (payload) => {
        // The current tab already reconciles its own optimistic send from the
        // INSERT response. Avoid re-downloading the whole timeline for it.
        if (payload.new && "author_id" in payload.new && payload.new.author_id === userId) return;
        if (realtimeRefreshTimeoutRef.current !== null) {
          window.clearTimeout(realtimeRefreshTimeoutRef.current);
        }
        realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
          realtimeRefreshTimeoutRef.current = null;
          void loadMessages(channelId);
        }, 120);
      })
      .subscribe();
    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
      void supabase.removeChannel(messageSubscription);
    };
  }, [activeChannelId, userId, loadMessages]);

  // Listen for inserts across the channels the member can currently see.
  // The local last-read timestamp is only advanced when a channel is opened.
  useEffect(() => {
    if (!userId || !activeSpaceId || channels.length === 0) return;
    const allowedChannelIds = new Set(channels.map((channel) => channel.id));
    const notificationChannel = supabase.channel("community-unread-" + activeSpaceId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
      }, (payload) => {
        const row = payload.new as { channel_id?: string; author_id?: string };
        const channelId = row.channel_id;
        if (!channelId || !allowedChannelIds.has(channelId) || row.author_id === userId) return;
        if (activeChannelIdRef.current === channelId && document.visibilityState === "visible") {
          markChannelRead(channelId, userId, activeSpaceId);
          return;
        }
        setUnreadCounts((current) => ({
          ...current,
          [channelId]: Math.min(99, (current[channelId] ?? 0) + 1),
        }));
      })
      .subscribe();
    return () => { void supabase.removeChannel(notificationChannel); };
  }, [userId, activeSpaceId, channels, markChannelRead]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && activeChannelIdRef.current) {
        markChannelRead(activeChannelIdRef.current, userId, activeSpaceId);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [markChannelRead, userId, activeSpaceId]);

  // Presence is global to the community, not to an individual channel.
  // Keep this socket stable while the user navigates between channels.
  useEffect(() => {
    if (!userId) return;
    const presence = supabase.channel("community-presence", {
      config: { presence: { key: userId } },
    });
    presence.on("presence", { event: "sync" }, () => {
      const memberIds = Object.keys(presence.presenceState());
      setOnlineMemberIds(memberIds);
      setOnlineUsers(memberIds.length);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presence.track({ online_at: new Date().toISOString() });
      }
    });
    return () => {
      void supabase.removeChannel(presence);
    };
  }, [userId]);

  const visibleMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) =>
      message.body.toLowerCase().includes(term)
      || (message.author?.full_name ?? "").toLowerCase().includes(term));
  }, [messages, search]);

  const handleFeedScroll = useCallback(() => {
    const element = feedScrollRef.current;
    if (!element) return;
    shouldStickToBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  }, []);

  useEffect(() => {
    const element = feedScrollRef.current;
    if (!element || !shouldStickToBottomRef.current) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
  }, [messages]);

  async function selectChannel(channel: Channel) {
    shouldStickToBottomRef.current = true;
    markChannelRead(channel.id, userId, activeSpaceId);
    activeChannelIdRef.current = channel.id;
    messageLoadRequestRef.current += 1;
    setMessages([]);
    setActiveChannelId(channel.id);
    setMobileChannelsOpen(false);
    setSearch("");
    setAttachmentFile(null);
    setReplyingTo(null);
    setReactionPickerFor(null);
    setEditingMessageId(null);
    setMentionSearchQuery(null);
    setMentionSuggestions([]);
    setMentionDisplayNames({});
    const spaceParam = activeSpace && activeSpace.space_type === "preicfes"
      ? "&space=" + encodeURIComponent(activeSpace.slug)
      : "";
    window.history.replaceState(null, "", "/comunidad?channel=" + encodeURIComponent(channel.slug) + spaceParam);
  }

  function updateComposerDraft(value: string, cursor: number) {
    setDraft(value.slice(0, 2000));
    const prefix = value.slice(0, cursor);
    const atIndex = prefix.lastIndexOf("@");
    if (atIndex >= 0 && (atIndex === 0 || /\s/.test(prefix[atIndex - 1]))) {
      const query = prefix.slice(atIndex + 1);
      const normalizedQuery = query.trim();
      if (normalizedQuery.length >= 1 && normalizedQuery.length <= 32 && !query.includes("@") && !query.includes("\n")) {
        setMentionAnchorIndex(atIndex);
        setMentionSuggestions([]);
        setMentionActiveIndex(0);
        setMentionSearchQuery(normalizedQuery);
        return;
      }
    }
    setMentionSearchQuery(null);
    setMentionAnchorIndex(null);
    setMentionSuggestions([]);
    setMentionActiveIndex(0);
  }

  function insertMention(member: MentionMember) {
    const textarea = composerRef.current;
    const cursor = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? cursor;
    const start = mentionAnchorIndex ?? Math.max(0, cursor - (mentionSearchQuery?.length ?? 0) - 1);
    const safeName = member.full_name.replace(/[{}|<>\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    const token = "@{" + member.user_id + "|" + safeName + "}";
    const nextDraft = (draft.slice(0, start) + token + " " + draft.slice(end)).slice(0, 2000);
    const nextCursor = Math.min(nextDraft.length, start + token.length + 1);

    setDraft(nextDraft);
    setMentionSearchQuery(null);
    setMentionAnchorIndex(null);
    setMentionSuggestions([]);
    window.setTimeout(() => {
      composerRef.current?.focus();
      composerRef.current?.setSelectionRange(nextCursor, nextCursor);
    }, 0);
  }

  function beginEdit(message: Message) {
    if (message.author_id !== userId) return;
    setEditingMessageId(message.id);
    setEditingDraft(message.body);
    setReactionPickerFor(null);
    window.setTimeout(() => {
      editComposerRef.current?.focus();
      editComposerRef.current?.setSelectionRange(message.body.length, message.body.length);
    }, 0);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditingDraft("");
    setSavingEdit(false);
  }

  async function saveMessageEdit(message: Message) {
    const body = editingDraft.trim();
    if (message.author_id !== userId || !body || body.length > 2000 || savingEdit) return;
    if (body === message.body) {
      cancelEdit();
      return;
    }

    setSavingEdit(true);
    setError("");
    const { error: editError } = await supabase.rpc("edit_community_message", {
      p_message_id: message.id,
      p_body: body,
    });
    if (editError) {
      setError(["42883", "PGRST202", "PGRST204"].includes(editError.code ?? "")
        ? "La edición estará disponible cuando se aplique la migración de chat."
        : editError.code === "42501"
          ? "No tienes permiso para editar este mensaje."
          : "No se pudo guardar la edición. Inténtalo de nuevo.");
      setSavingEdit(false);
      return;
    }

    cancelEdit();
    setMessages((current) => current.map((item) => item.id === message.id
      ? { ...item, body, edited_at: new Date().toISOString() }
      : item));
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    const submittedFile = attachmentFile;
    const submittedReply = replyingTo;
    const channel = activeChannel;
    if ((!body && !submittedFile) || !channel || !userId || sending || uploadingAttachment || channel.is_read_only) return;
    if (body.length > 2000) {
      setError("El mensaje no puede superar los 2.000 caracteres.");
      return;
    }

    const pendingId = "pending-" + crypto.randomUUID();
    const pendingMessage: Message = {
      id: pendingId,
      channel_id: channel.id,
      author_id: userId,
      body,
      created_at: new Date().toISOString(),
      edited_at: null,
      author: profile,
      channel,
      reply_to_message_id: submittedReply?.id ?? null,
      attachment_path: null,
      attachment_alt: submittedFile?.name.slice(0, 240) ?? null,
      attachment_url: null,
      reaction_count: 0,
      reaction_counts: {},
      viewer_reactions: [],
      reply_count: 0,
      pending: true,
    };

    shouldStickToBottomRef.current = true;
    setMessages((current) => [...current.filter((item) => item.id !== pendingId), pendingMessage]);
    setDraft("");
    setAttachmentFile(null);
    setReplyingTo(null);
    setReactionPickerFor(null);
    setSending(true);
    setUploadingAttachment(Boolean(submittedFile));
    setError("");

    try {
      let savedMessage: Message;
      if (submittedFile) {
        const form = new FormData();
        form.set("channel_id", channel.id);
        form.set("body", body);
        form.set("file", submittedFile);
        form.set("attachment_alt", submittedFile.name.slice(0, 240));
        if (submittedReply) form.set("reply_to_message_id", submittedReply.id);

        const response = await fetch("/api/community/attachments", {
          method: "POST",
          body: form,
          credentials: "same-origin",
        });
        const payload = await response.json().catch(() => null) as {
          error?: string;
          message?: {
            id: string; channel_id: string; author_id: string; body: string;
            created_at: string; edited_at: string | null;
            reply_to_message_id: string | null; attachment_path: string | null;
            attachment_alt: string | null;
          };
        } | null;
        if (!response.ok || !payload?.message) {
          throw new Error(payload?.error ?? "No se pudo enviar la imagen.");
        }

        const row = payload.message;
        let attachmentUrl: string | null = null;
        if (row.attachment_path) {
          const { data: signedImage } = await supabase.storage
            .from("community-attachments")
            .createSignedUrl(row.attachment_path, 3600);
          attachmentUrl = signedImage?.signedUrl ?? null;
        }
        savedMessage = {
          ...row,
          channel,
          author: profile,
          attachment_url: attachmentUrl,
          reaction_count: 0,
          reaction_counts: {},
          viewer_reactions: [],
          reply_count: 0,
        };
      } else {
        const insertPayload: {
          channel_id: string; author_id: string; body: string; reply_to_message_id?: string;
        } = { channel_id: channel.id, author_id: userId, body };
        if (submittedReply) insertPayload.reply_to_message_id = submittedReply.id;

        const { data: row, error: insertError } = await supabase
          .from("community_messages")
          .insert(insertPayload)
          .select("id,channel_id,author_id,body,created_at,edited_at")
          .single();
        if (insertError || !row) {
          const databaseMessage = insertError?.message ?? "";
          const phoneVerificationRequired = /tel[eé]fono|phone verification|verify your phone/i.test(databaseMessage);
          throw new Error(submittedReply && ["42703", "PGRST204"].includes(insertError?.code ?? "")
            ? "Las respuestas directas estarán disponibles cuando se aplique la migración de chat."
            : phoneVerificationRequired
              ? "Debes verificar tu identidad por teléfono antes de poder enviar mensajes en este servidor."
              : insertError?.code === "42501" || /row-level security/i.test(databaseMessage)
                ? "No tienes permiso para publicar en este canal. Comprueba los requisitos de acceso del servidor."
                : "No se pudo enviar el mensaje. Inténtalo de nuevo.");
        }
        savedMessage = {
          ...row,
          reply_to_message_id: submittedReply?.id ?? null,
          attachment_path: null,
          attachment_alt: null,
          attachment_url: null,
          author: profile,
          channel,
          reaction_count: 0,
          reaction_counts: {},
          viewer_reactions: [],
          reply_count: 0,
        };
      }

      // The API response already contains the canonical row. Replace the local
      // pending item without reloading 60 messages and their related metadata.
      if (activeChannelIdRef.current === channel.id) {
        setMessages((current) => [
          ...current.filter((item) => item.id !== pendingId && item.id !== savedMessage.id),
          savedMessage,
        ]);
      } else {
        setMessages((current) => current.filter((item) => item.id !== pendingId));
      }
    } catch (sendError) {
      setMessages((current) => current.filter((item) => item.id !== pendingId));
      if (activeChannelIdRef.current === channel.id) {
        setDraft((current) => current || body);
        if (submittedFile) setAttachmentFile((current) => current ?? submittedFile);
        if (submittedReply) setReplyingTo((current) => current ?? submittedReply);
      }
      setError(sendError instanceof Error
        ? sendError.message
        : "No se pudo completar el envío. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  }

  function applyLocalReaction(messageId: string, reaction: string, selected: boolean) {
    setMessages((current) => current.map((item) => {
      if (item.id !== messageId) return item;
      const alreadySelected = item.viewer_reactions.includes(reaction);
      if (alreadySelected === selected) return item;

      const viewerReactions = selected
        ? [...item.viewer_reactions, reaction]
        : item.viewer_reactions.filter((value) => value !== reaction);
      const nextCount = Math.max(0, (item.reaction_counts[reaction] ?? 0) + (selected ? 1 : -1));
      const reactionCounts = { ...item.reaction_counts };
      if (nextCount > 0) reactionCounts[reaction] = nextCount;
      else delete reactionCounts[reaction];

      return {
        ...item,
        viewer_reactions: viewerReactions,
        reaction_counts: reactionCounts,
        reaction_count: Math.max(0, item.reaction_count + (selected ? 1 : -1)),
      };
    }));
  }

  async function toggleReaction(message: Message, reaction: string) {
    if (!userId || !CHAT_REACTIONS.includes(reaction)) return;
    const lockKey = message.id + ":" + reaction;
    if (pendingReactionKeysRef.current.has(lockKey)) return;

    const currentMessage = messages.find((item) => item.id === message.id) ?? message;
    const alreadyReacted = currentMessage.viewer_reactions.includes(reaction);
    pendingReactionKeysRef.current.add(lockKey);
    setReactionPickerFor(null);

    // Make the chip respond immediately; revert only if the database rejects it.
    applyLocalReaction(message.id, reaction, !alreadyReacted);
    setError("");

    try {
      if (alreadyReacted) {
        const { error: removeError } = await supabase.from("community_reactions")
          .delete()
          .eq("message_id", message.id)
          .eq("user_id", userId)
          .eq("reaction", reaction);
        if (removeError) {
          applyLocalReaction(message.id, reaction, true);
          setError("No se pudo quitar la reacción.");
        }
      } else {
        const { error: addError } = await supabase.from("community_reactions")
          .insert({ message_id: message.id, user_id: userId, reaction });
        const duplicate = addError?.code === "23505"
          || Boolean(addError?.message.toLowerCase().includes("duplicate"));
        if (addError && !duplicate) {
          applyLocalReaction(message.id, reaction, false);
          setError(["23514", "22P02"].includes(addError.code ?? "")
            ? "Las reacciones nuevas estarán disponibles cuando se aplique la migración de chat."
            : "No se pudo registrar la reacción.");
        } else if (duplicate) {
          // Reconcile a stale local snapshot using aggregate-only data for one row.
          const { data: metricRows } = await supabase.rpc("get_community_message_metrics", {
            p_message_ids: [message.id],
          });
          const metric = (metricRows ?? [])[0] as CommunityMessageMetrics | undefined;
          if (metric) {
            setMessages((current) => current.map((item) => item.id === message.id ? {
              ...item,
              reaction_count: metric.reaction_count ?? Object.values(metric.reaction_counts ?? {}).reduce((sum, count) => sum + count, 0),
              reaction_counts: metric.reaction_counts ?? {},
              viewer_reactions: metric.viewer_reactions ?? [],
              reply_count: metric.reply_count ?? item.reply_count,
            } : item));
          }
        }
      }
    } catch {
      applyLocalReaction(message.id, reaction, alreadyReacted);
      setError("No se pudo sincronizar la reacción. Comprueba tu conexión.");
    } finally {
      pendingReactionKeysRef.current.delete(lockKey);
    }
  }

  function beginReply(message: Message) {
    setReplyingTo(message);
    setReactionPickerFor(null);
    composerRef.current?.focus();
  }

  async function deleteMessage(message: Message) {
    if (message.author_id !== userId) return;
    try {
      const response = await fetch("/api/community/messages?message_id=" + encodeURIComponent(message.id), {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => null) as { error?: string; attachmentCleanup?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "No se pudo eliminar el mensaje.");
        return;
      }
      if (payload?.attachmentCleanup === "pending") {
        console.warn("[PeakScore Community] Message deleted but its private attachment needs cleanup.");
      }
      setMessages((current) => current.filter((item) => item.id !== message.id));
    } catch {
      setError("No se pudo completar la eliminación. Inténtalo de nuevo.");
    }
  }

  async function shareMessage(message: Message) {
    const spaceParam = activeSpace && activeSpace.space_type === "preicfes"
      ? "&space=" + encodeURIComponent(activeSpace.slug)
      : "";
    const url = window.location.origin + "/comunidad?channel="
      + encodeURIComponent(message.channel?.slug ?? "general") + spaceParam + "#post-" + message.id;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1600);
    } catch {
      setError("El navegador no permitió copiar el enlace.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-[#0B1020] p-6 text-white">
        <div className="mx-auto mt-24 max-w-xl text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#01C8EF]" />
          <p className="mt-4 text-sm text-[#8B93B5]">Cargando comunidad...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={"community-page " + communityTheme.root} style={communityCanvasStyle}>
      <div className="community-layout">
        <nav className="community-server-rail" aria-label="Servidores">

          <button type="button"
            className={"community-server-icon " + (activeSpace?.space_type === "global" ? "community-server-icon-active" : "")}
            onClick={() => router.push("/comunidad")}
            aria-label="PeakScore Community"
            aria-current={activeSpace?.space_type === "global" ? "page" : undefined}>
            {activeSpace?.icon_url
              ? <Image src={activeSpace.icon_url} alt="" width={38} height={38} unoptimized className="h-full w-full rounded-[inherit] object-cover"/>
              : <Image src="/peakscore/peakscore-community-mark.svg" alt="PeakScore" width={38} height={38} unoptimized className="h-[38px] w-[38px] object-contain"/>}
          </button>
          {communitySpaces.filter((space) => space.space_type === "preicfes").map((space) => (
            <button key={space.id} type="button"
              className={"community-server-icon " + (activeSpace?.id === space.id ? "community-server-icon-active" : "")}
              title={space.name}
              aria-label={"Entrar a " + space.name}
              aria-current={activeSpace?.id === space.id ? "page" : undefined}
              onClick={() => router.push("/comunidad?space=" + encodeURIComponent(space.slug))}>
              {space.icon_url ? <Image src={space.icon_url} alt="" width={36} height={36} unoptimized className="h-full w-full rounded-[inherit] object-cover"/> : <GraduationCap size={19}/>}
            </button>
          ))}
          <Link href={activeSpace?.space_type === "preicfes" ? "/comunidad/en-vivo?space=" + encodeURIComponent(activeSpace.slug) : "/comunidad/en-vivo"} className="community-server-icon" aria-label="Sesiones en vivo">
            <Radio size={20}/>
          </Link>
        </nav>

        <aside id="community-channel-drawer" className={"community-sidebar " + (mobileChannelsOpen ? "community-sidebar-open" : "")}>
          <div className="community-server-header relative isolate flex min-h-[78px] items-center overflow-visible border-b border-[#28313d] px-3 py-2">
            {activeSpace?.banner_url && (
              <Image
                src={activeSpace.banner_url}
                alt=""
                fill
                unoptimized
                sizes="360px"
                className="community-server-banner-image"
              />
            )}
            <div className="community-server-banner-shade pointer-events-none absolute inset-0" aria-hidden="true"/>
            <div className="relative z-20 min-w-0 flex-1">
              {isFounder ? (
                <div className="community-server-menu-wrap relative min-w-0" ref={communityServerMenuRef}>
                  <div className="community-server-menu-trigger">
                    {activeSpace?.verification_status === "verified" && (
                      <span className="community-verified-dot" tabIndex={0} aria-label="Comunidad verificada" aria-describedby="community-verified-tooltip">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 1.2c1.8 0 3 2.1 4.7 2.5 1.8.4 4.1-.4 5.1 1.2 1 1.6-.1 3.7.5 5.4.6 1.7 2.7 3.1 2.2 4.9-.5 1.8-2.9 2.3-4 3.8-1.1 1.5-.9 4-2.6 4.9-1.7.9-3.7-.5-5.5-.5s-3.8 1.4-5.5.5c-1.7-.9-1.5-3.4-2.6-4.9-1.1-1.5-3.5-2-4-3.8-.5-1.8 1.6-3.2 2.2-4.9.6-1.7-.5-3.8.5-5.4 1-1.6 3.3-.8 5.1-1.2C9 3.3 10.2 1.2 12 1.2Z" fill="currentColor"/>
    <path d="m6.9 12.2 3.3 3.3 7-7" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  <span className="community-verified-tooltip" role="tooltip">
    <span className="community-verified-tooltip-head">
      <span className="community-verified-tooltip-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 1.2c1.8 0 3 2.1 4.7 2.5 1.8.4 4.1-.4 5.1 1.2 1 1.6-.1 3.7.5 5.4.6 1.7 2.7 3.1 2.2 4.9-.5 1.8-2.9 2.3-4 3.8-1.1 1.5-.9 4-2.6 4.9-1.7.9-3.7-.5-5.5-.5s-3.8 1.4-5.5.5c-1.7-.9-1.5-3.4-2.6-4.9-1.1-1.5-3.5-2-4-3.8-.5-1.8 1.6-3.2 2.2-4.9.6-1.7-.5-3.8.5-5.4 1-1.6 3.3-.8 5.1-1.2C9 3.3 10.2 1.2 12 1.2Z" fill="currentColor"/><path d="m6.9 12.2 3.3 3.3 7-7" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span className="community-verified-tooltip-copy">
        <strong>Comunidad verificada</strong>
        <span>Esta comunidad ha sido verificada por PeakScore.</span>
      </span>
    </span>
    <span className="community-verified-tooltip-divider"/>
    <span className="community-verified-tooltip-item"><ShieldCheck size={18}/>Autenticidad confirmada</span>
    <span className="community-verified-tooltip-item"><Star size={18}/>Comunidad oficial</span>
    <span className="community-verified-tooltip-item"><Users size={18}/>Entorno seguro y confiable</span>
  </span>
</span>
                    )}
                    <span className="community-server-name">{activeSpace?.name ?? "PeakScore Community"}</span>
                    <button type="button" className="community-server-chevron-button"
                      onClick={() => setCommunityServerMenuOpen((open) => !open)}
                      aria-haspopup="menu" aria-expanded={communityServerMenuOpen}
                      aria-label={isFounder ? "Abrir control central de founder" : "Abrir ajustes de la comunidad"} title="Ajustes del servidor">
                      <ChevronDown size={15} className={"community-server-menu-chevron" + (communityServerMenuOpen ? " is-open" : "")}/>
                    </button>
                  </div>
                  {communityServerMenuOpen && (
                    <div className="community-server-menu" role="menu" aria-label="Administración del servidor">
                      <div className="community-server-menu-heading">
                        <span>ADMINISTRAR COMUNIDAD</span>
                        <span className="community-server-menu-founder">FOUNDER</span>
                      </div>
                      <button type="button" role="menuitem" onClick={() => openFounderStudio("branding")}>
                        <Settings size={16}/><span><strong>Ajustes del servidor</strong><small>Identidad, icono, portada y apariencia</small></span>
                      </button>
                      <div className="community-server-menu-divider"/>
                      <button type="button" role="menuitem" onClick={() => openFounderStudio("channels", "create-channel")}>
                        <Plus size={16}/><span><strong>Crear canal</strong><small>Añadir un canal de texto</small></span>
                      </button>
                      <button type="button" role="menuitem" onClick={() => openFounderStudio("channels", "create-category")}>
                        <FolderPlus size={16}/><span><strong>Crear categoría</strong><small>Organizar los canales del servidor</small></span>
                      </button>
                      <div className="community-server-menu-divider"/>
                      <button type="button" role="menuitem" onClick={() => openFounderStudio("branding")}>
                        <Palette size={16}/><span><strong>Fondo e identidad</strong><small>Banner, colores y distintivo</small></span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="community-server-member-heading">
                  {activeSpace?.verification_status === "verified" && (
                    <span className="community-verified-dot" tabIndex={0} aria-label="Comunidad verificada" aria-describedby="community-verified-tooltip">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 1.2c1.8 0 3 2.1 4.7 2.5 1.8.4 4.1-.4 5.1 1.2 1 1.6-.1 3.7.5 5.4.6 1.7 2.7 3.1 2.2 4.9-.5 1.8-2.9 2.3-4 3.8-1.1 1.5-.9 4-2.6 4.9-1.7.9-3.7-.5-5.5-.5s-3.8 1.4-5.5.5c-1.7-.9-1.5-3.4-2.6-4.9-1.1-1.5-3.5-2-4-3.8-.5-1.8 1.6-3.2 2.2-4.9.6-1.7-.5-3.8.5-5.4 1-1.6 3.3-.8 5.1-1.2C9 3.3 10.2 1.2 12 1.2Z" fill="currentColor"/>
    <path d="m6.9 12.2 3.3 3.3 7-7" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  <span className="community-verified-tooltip" role="tooltip">
    <span className="community-verified-tooltip-head">
      <span className="community-verified-tooltip-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 1.2c1.8 0 3 2.1 4.7 2.5 1.8.4 4.1-.4 5.1 1.2 1 1.6-.1 3.7.5 5.4.6 1.7 2.7 3.1 2.2 4.9-.5 1.8-2.9 2.3-4 3.8-1.1 1.5-.9 4-2.6 4.9-1.7.9-3.7-.5-5.5-.5s-3.8 1.4-5.5.5c-1.7-.9-1.5-3.4-2.6-4.9-1.1-1.5-3.5-2-4-3.8-.5-1.8 1.6-3.2 2.2-4.9.6-1.7-.5-3.8.5-5.4 1-1.6 3.3-.8 5.1-1.2C9 3.3 10.2 1.2 12 1.2Z" fill="currentColor"/><path d="m6.9 12.2 3.3 3.3 7-7" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span className="community-verified-tooltip-copy">
        <strong>Comunidad verificada</strong>
        <span>Esta comunidad ha sido verificada por PeakScore.</span>
      </span>
    </span>
    <span className="community-verified-tooltip-divider"/>
    <span className="community-verified-tooltip-item"><ShieldCheck size={18}/>Autenticidad confirmada</span>
    <span className="community-verified-tooltip-item"><Star size={18}/>Comunidad oficial</span>
    <span className="community-verified-tooltip-item"><Users size={18}/>Entorno seguro y confiable</span>
  </span>
</span>
                  )}
                  <span className="community-server-name">{activeSpace?.name ?? "PeakScore Community"}</span>
                </div>
              )}
              {activeSpace?.space_type === "preicfes" && activeSpace.verification_status !== "verified" && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {activeSpace.verification_status === "pending" ? (
                    <span className="community-verification-pending"><ShieldCheck size={12}/> Solicitud en revisión</span>
                  ) : (
                    <button type="button" disabled={verificationRequestBusy}
                      onClick={() => void requestCommunityVerification()}
                      className="community-verification-request">
                      <ShieldCheck size={12}/> {verificationRequestBusy ? "Enviando…" : "Solicitar verificación"}
                    </button>
                  )}
                  {verificationFeedback && <span role="status" className="community-verification-feedback">{verificationFeedback}</span>}
                </div>
              )}
            </div>
          </div>

          <nav className="community-channel-list" aria-label="Canales de PeakScore">
            <div className="community-nav-section">
              <p className="community-nav-heading">COMUNIDAD</p>
              <Link href={activeSpace?.space_type === "preicfes" ? "/comunidad/en-vivo?space=" + encodeURIComponent(activeSpace.slug) : "/comunidad/en-vivo"} className="community-nav-item">
                <Radio size={17}/><span>En vivo</span><span className="community-live-nav-pill">LIVE</span>
              </Link>
              <Link href="/comunidad/ser-profesor" className="community-nav-item">
                <GraduationCap size={17}/><span>Ser profesor</span>
              </Link>
            </div>

            {groupedChannels.map((group) => (
              <section key={group.category} className="community-nav-section">
                <div className="community-nav-heading-row">
                  <h2 className="community-nav-heading">{CATEGORY_LABELS[group.category] ?? group.category}</h2>
                  <span className="community-nav-count">{group.channels.length}</span>
                </div>
                {group.channels.map((channel) => {
                  const Icon = CHANNEL_ICON_KEYS[channel.icon_key ?? ""] ?? CHANNEL_ICONS[channel.slug] ?? Hash;
                  const active = channel.id === activeChannelId;
                  return (
                    <div className="community-channel-row" key={channel.id}>
                      <button type="button" onClick={() => void selectChannel(channel)}
                        aria-current={active ? "page" : undefined}
                        className={"community-nav-item community-channel-link " + (active ? "community-nav-active" : "")}>
                        {channel.is_private ? (
                          <span className="community-private-channel-glyph" aria-label="Canal privado">
                            <Hash size={17}/><LockKeyhole size={9}/>
                          </span>
                        ) : <Icon size={17} className="community-channel-glyph"/>}
                        <span className="community-channel-name min-w-0 flex-1 truncate">{channel.name}</span>
                        {channel.is_read_only && <ShieldCheck size={13} className="community-channel-readonly" aria-label="Solo lectura"/>}
                        {(unreadCounts[channel.id] ?? 0) > 0 && (
                          <span className="community-unread-count" aria-label={unreadCounts[channel.id] + " mensajes sin leer"}>
                            {unreadCounts[channel.id] > 99 ? "99+" : unreadCounts[channel.id]}
                          </span>
                        )}
                      </button>
                      {isFounder && (
                        <button type="button" className="community-channel-settings-button"
                          aria-label={"Ajustes del canal " + channel.name} title={"Ajustes del canal " + channel.name}
                          onClick={() => openFounderStudio("channels", null, channel.id)}>
                          <Settings2 size={14}/>
                        </button>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </nav>

          
          {audioPanelMode && (
            <div className="community-audio-popover" role="dialog" aria-label="Preferencias de audio">
              <div className="community-audio-popover-header">
                <span>{audioPanelMode === "output" ? "Audífonos y salida" : "Micrófono"}</span>
                <button type="button" onClick={() => setAudioPanelMode(null)} aria-label="Cerrar audio"><X size={15}/></button>
              </div>
              {audioPanelMode === "output" ? (
                <label className="community-audio-field">
                  <span>Dispositivo de salida</span>
                  <select value={audioOutputDeviceId} onChange={(event) => setAudioOutputDeviceId(event.target.value)}>
                    <option value="">Predeterminado del sistema</option>
                    {audioOutputDevices.map((device, index) => (
                      <option key={device.deviceId || index} value={device.deviceId}>
                        {device.label || "Salida de audio " + (index + 1)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="community-audio-field">
                    <span>Dispositivo de entrada</span>
                    <select value={audioInputDeviceId} onChange={(event) => setAudioInputDeviceId(event.target.value)}>
                      <option value="">Predeterminado del sistema</option>
                      {audioInputDevices.map((device, index) => (
                        <option key={device.deviceId || index} value={device.deviceId}>
                          {device.label || "Micrófono " + (index + 1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="community-audio-check" onClick={() => void verifyMicrophoneDevice()}>
                    <Mic size={15}/> Comprobar micrófono
                  </button>
                </>
              )}
              <button type="button" className="community-audio-refresh" onClick={() => void refreshAudioDevices()}>
                <Settings2 size={14}/> Actualizar dispositivos
              </button>
              {audioFeedback && <p role="status" className="community-audio-feedback">{audioFeedback}</p>}
              <p className="community-audio-note">Preferencias guardadas en este dispositivo. La salida seleccionada se aplica a reproductores compatibles del navegador.</p>
            </div>
          )}
        </aside>

        <div className="community-user-panel-shell community-user-panel-dock">

            <button type="button" className="community-user-panel community-user-panel-button"
              onClick={() => userId && void openCommunityProfile(userId)}
              aria-label="Abrir mi perfil de comunidad">
              <span className="community-avatar community-user-avatar">
                {profile?.avatar_url
                  ? <Image src={profile.avatar_url} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover"/>
                  : initials(profile?.full_name)}
              </span>
              <span className="community-user-copy">
                <span className="community-user-name">{profile?.full_name || "Mi perfil social"}</span>
                <span className="community-user-presence"><span/>En línea</span>
              </span>
            </button>

            <div className="community-user-audio-controls" aria-label="Controles de audio">
              {canUseMicrophone && (
                <div className="community-user-control-group community-user-mic-group">
                  <button type="button" onClick={() => openAudioPanel("input")}
                    className={audioPanelMode === "input" ? "is-active" : ""}
                    aria-label="Configurar micrófono" title="Micrófono">
                    <Mic size={17}/>
                  </button>
                  <button type="button" onClick={() => openAudioPanel("input")}
                    className="community-user-control-chevron" aria-label="Opciones de micrófono"
                    aria-expanded={audioPanelMode === "input"}><ChevronDown size={13}/></button>
                </div>
              )}
              <div className="community-user-control-group community-user-output-group">
                <button type="button" onClick={() => openAudioPanel("output")}
                  className={audioPanelMode === "output" ? "is-active" : ""}
                  aria-label="Configurar audífonos y salida de audio" title="Audífonos y salida de audio">
                  <Headphones size={18}/>
                </button>
                <button type="button" onClick={() => openAudioPanel("output")}
                  className="community-user-control-chevron" aria-label="Opciones de salida de audio"
                  aria-expanded={audioPanelMode === "output"}><ChevronDown size={13}/></button>
              </div>
            </div>
        </div>

        {mobileChannelsOpen && (
          <button type="button" aria-label="Cerrar menú de canales"
            className="community-mobile-scrim lg:hidden"
            onClick={() => setMobileChannelsOpen(false)}/>
        )}

        <section className="community-chat-column">
          <header className="community-chat-header">
            <div className="community-chat-title">
              <button
                type="button"
                className="community-mobile-menu lg:hidden"
                onClick={() => setMobileChannelsOpen(true)}
                aria-label="Abrir canales"
                aria-controls="community-channel-drawer"
                aria-expanded={mobileChannelsOpen}
                title="Abrir canales"
              >
                <Menu size={18}/>
              </button>
              <Hash size={21} className="community-chat-hash"/>
              <h1>{activeChannel?.name ?? "Comunidad"}</h1>
              {activeChannel?.is_private && <LockKeyhole size={14} className="community-channel-lock"/>}
              {activeChannel?.is_read_only && <ShieldCheck size={14} className="community-channel-readonly"/>}
            </div>
            <div className="community-chat-header-actions">
              {searchOpen && (
                <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar en este canal" className="community-search-input"/>
              )}
              <button type="button" onClick={() => { setSearchOpen((value) => !value); setSearch(""); }}
                className={"community-chat-tool " + (searchOpen ? "community-chat-tool-active" : "")}
                aria-label="Buscar mensajes"><Search size={19}/></button>
              <button type="button"
                className={"community-chat-tool community-member-toggle " + (memberListOpen ? "community-chat-tool-active" : "")}
                onClick={() => setMemberListOpen((value) => !value)}
                aria-label={memberListOpen ? "Ocultar lista de miembros" : "Mostrar lista de miembros"}
                aria-pressed={memberListOpen} title="Miembros">
                <PanelRight size={18}/>
              </button>
            </div>
          </header>

          {appearanceOpen && (
            <div className="community-appearance-popover" role="dialog" aria-label="Apariencia de la comunidad">
              <div className="community-appearance-title">
                <span>Fondo de la comunidad</span>
                <button type="button" onClick={() => setAppearanceOpen(false)} aria-label="Cerrar apariencia"><X size={15}/></button>
              </div>
              <div className="community-appearance-presets" role="group" aria-label="Colores predeterminados">
                {([
                  { id: "server", label: "Servidor", color: activeSpace?.background_color ?? "#171c24" },
                  { id: "black", label: "Negro", color: "#0b0d11" },
                  { id: "gray", label: "Gris", color: "#353a43" },
                  { id: "white", label: "Blanco", color: "#f1f3f5" },
                ] as const).map((option) => (
                  <button key={option.id} type="button"
                    className={"community-appearance-swatch" + (appearanceMode === option.id ? " is-selected" : "")}
                    onClick={() => setAppearanceMode(option.id)}
                    aria-label={option.label} aria-pressed={appearanceMode === option.id}
                    title={option.label}>
                    <i style={{ background: option.color }}/>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <label className="community-appearance-custom">
                <span>Color personalizado</span>
                <input type="color" value={appearanceCustomColor}
                  onChange={(event) => { setAppearanceCustomColor(event.target.value); setAppearanceMode("custom"); }}/>
              </label>
              <button type="button" className={"community-appearance-chroma" + (chromaEnabled ? " is-enabled" : "")}
                onClick={() => setChromaEnabled((enabled) => !enabled)} aria-pressed={chromaEnabled}>
                <span><i/> Fondo Chroma</span>
                <strong>{chromaEnabled ? "Activado" : "Desactivado"}</strong>
              </button>
              <p>Tu apariencia se guarda en este dispositivo y solo cambia tu vista.</p>
            </div>
          )}

          <div ref={feedScrollRef} onScroll={handleFeedScroll} className="community-chat-scroll">
            <div className="community-chat-messages">
              {error && <p role="alert" className="community-chat-error">{error}</p>}

              {visibleMessages.length === 0 ? (
                <div className="community-chat-welcome">
                  <div className="community-chat-welcome-icon"><Hash size={30}/></div>
                  <h2>{search ? "No se encontraron mensajes" : "¡Bienvenido a #" + (activeChannel?.name ?? "comunidad") + "!"}</h2>
                  <p>{search
                    ? "Prueba con otra búsqueda."
                    : "Este es el comienzo del canal. Comparte una pregunta, una idea o ayuda a otro estudiante."}</p>
                </div>
              ) : (
                visibleMessages.map((message, index) => {
                  const repliedMessage = message.reply_to_message_id
                    ? messageById.get(message.reply_to_message_id) ?? null
                    : null;
                  const currentDate = new Date(message.created_at);
                  const currentDay = currentDate.toDateString();
                  const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
                  const previousDay = previousMessage
                    ? new Date(previousMessage.created_at).toDateString()
                    : null;
                  const groupedWithPrevious = Boolean(
                    previousMessage
                    && previousMessage.author_id === message.author_id
                    && previousDay === currentDay
                    && currentDate.getTime() - new Date(previousMessage.created_at).getTime() <= 5 * 60 * 1000,
                  );
                  return (
                    <div key={message.id}>
                      {(index === 0 || currentDay !== previousDay) && (
                        <div className="community-date-divider"><span>{dayLabel(message.created_at)}</span></div>
                      )}
                      <article id={"post-" + message.id}
                        onMouseEnter={() => setMessageMenuFor((current) => current && current !== message.id ? null : current)}
                        className={"community-chat-message group " + (groupedWithPrevious ? "community-chat-message-grouped" : "") + (message.pending ? " community-chat-message-pending" : "") + (userId && message.body.includes("@{" + userId + "|") ? " community-chat-message-mentioned" : "")}>
                        <div className="community-chat-avatar-column">
                          {groupedWithPrevious ? null : (
                            <div className="community-chat-avatar-wrap">
                              <button type="button" className="community-chat-avatar-trigger"
                                disabled={!message.author}
                                onClick={() => message.author && void openCommunityProfile(message.author.id)}
                                aria-label={message.author ? "Abrir perfil de " + message.author.full_name : "Perfil de miembro"}>
                                <span className="community-avatar community-chat-avatar">
                                  {message.author?.avatar_url
                                    ? <Image src={message.author.avatar_url} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover"/>
                                    : initials(message.author?.full_name)}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="community-chat-message-content">
                          {!groupedWithPrevious && (
                            <div className="community-chat-message-meta">
                              {message.author ? (
                                <>
                                  <button type="button"
                                    onClick={() => void openCommunityProfile(message.author!.id)}
                                    className="community-chat-author-link"
                                    style={{
                                      "--name-gradient-start": message.author.display_name_gradient_start ?? "#B86BFF",
                                      "--name-gradient-end": message.author.display_name_gradient_end ?? "#4E9BFF",
                                      "--name-prism-gradient": "linear-gradient(90deg," + (message.author.display_name_prism_colors ?? ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"]).join(",") + ")",
                                      "--name-solid-color": message.author.display_name_color === "custom-gradient" ? message.author.display_name_gradient_start ?? "#B86BFF" : message.author.display_name_color === "pink" ? "#F72585" : message.author.display_name_color === "green" ? "#25E66B" : message.author.display_name_color === "blue" ? "#269EE5" : message.author.display_name_color === "purple" ? "#A72CF0" : message.author.display_name_color === "magenta" ? "#E60063" : message.author.display_name_color === "red" ? "#F2382E" : message.author.display_name_color === "gold" ? "#D1B11B" : "currentColor",
                                    } as React.CSSProperties}>
                                    <CommunityStaticName
                                      tag="span"
                                      value={message.author.full_name}
                                      className={"ps-community-name-render community-chat-author community-chat-name-render is-name-style-" + (message.author.display_name_style ?? "classic") + " effect-" + (message.author.display_name_effect ?? "plain") + " color-" + displayNameColorForEffect(message.author.display_name_effect, message.author.display_name_color)}
                                      style={{
                                        "--name-gradient-start": message.author.display_name_gradient_start ?? "#B86BFF",
                                        "--name-gradient-end": message.author.display_name_gradient_end ?? "#4E9BFF",
                                        "--name-prism-gradient": "linear-gradient(90deg," + (message.author.display_name_prism_colors ?? ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"]).join(",") + ")",
                                        "--name-solid-color": displayNameSolidColor(message.author.display_name_color, message.author.display_name_gradient_start),
                                      } as React.CSSProperties}
                                    />
                                  </button>
                                </>
                              ) : <span className="community-chat-author">Estudiante</span>}
                              {message.author?.roles?.filter((role) => role.display_as_badge).map((role) => (
                                <span key={role.role_key} className="community-role-badge"
                                  style={{ color: role.badge_color, borderColor: role.badge_color + "70" }}>{role.label}</span>
                              ))}
                              <time dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
                              {message.edited_at && <span className="community-chat-edited-label">(editado)</span>}
                            </div>
                          )}
                          {message.reply_to_message_id && (
                            <button type="button"
                              onClick={() => {
                                if (repliedMessage) document.getElementById("post-" + repliedMessage.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="community-chat-reply-reference">
                              <Reply size={13}/>
                              <span>Respuesta a <strong>{repliedMessage?.author?.full_name ?? "un mensaje anterior"}</strong>: {(repliedMessage?.body || "Ver mensaje citado").slice(0, 110)}</span>
                            </button>
                          )}
                          {editingMessageId === message.id ? (
                            <form onSubmit={(event) => { event.preventDefault(); void saveMessageEdit(message); }}
                              className="community-chat-edit-form">
                              <textarea
                                ref={editComposerRef}
                                value={editingDraft}
                                onChange={(event) => setEditingDraft(event.target.value.slice(0, 2000))}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") {
                                    event.preventDefault();
                                    cancelEdit();
                                  } else if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                                    event.preventDefault();
                                    void saveMessageEdit(message);
                                  }
                                }}
                                maxLength={2000}
                                rows={Math.min(6, Math.max(2, editingDraft.split("\n").length))}
                                aria-label="Editar mensaje"
                                className="community-chat-edit-input"
                              />
                              <div className="community-chat-edit-footer">
                                <span>Esc para cancelar · Enter para guardar</span>
                                <button type="button" onClick={cancelEdit} disabled={savingEdit}>Cancelar</button>
                                <button type="submit" disabled={!editingDraft.trim() || savingEdit}
                                  className="community-chat-edit-save">
                                  {savingEdit ? "Guardando..." : <><Check size={14}/> Guardar</>}
                                </button>
                              </div>
                            </form>
                          ) : (
                            message.body && <p className="community-chat-message-body">{renderMessageBody(message.body, userId, mentionDisplayNames)}</p>
                          )}
                          {message.attachment_url && (
                            <a href={message.attachment_url} target="_blank" rel="noopener noreferrer"
                              className="community-chat-attachment-link">
                              <Image src={message.attachment_url} alt={message.attachment_alt ?? "Imagen adjunta al mensaje"}
                                width={720} height={540} unoptimized className="community-chat-attachment-image"/>
                            </a>
                          )}

                          <div className="community-chat-reactions">
                            {Object.entries(message.reaction_counts).map(([emoji, count]) => (
                              <button type="button" key={emoji}
                                onClick={() => void toggleReaction(message, emoji)}
                                className={"community-chat-reaction-chip " + (message.viewer_reactions.includes(emoji) ? "community-chat-reaction-chip-active" : "")}
                                aria-pressed={message.viewer_reactions.includes(emoji)}
                                aria-label={emoji + " " + count + " reacciones"}>
                                <span>{emoji}</span><span>{count}</span>
                              </button>
                            ))}
                            <div className="community-chat-reaction-picker-anchor">
                              <button type="button"
                                onClick={() => setReactionPickerFor((current) => current === message.id ? null : message.id)}
                                className="community-chat-action" aria-label="Añadir reacción"><SmilePlus size={15}/></button>
                              {reactionPickerFor === message.id && (
                                <div className="community-chat-reaction-picker">
                                  {CHAT_REACTIONS.map((emoji) => (
                                    <button type="button" key={emoji} onClick={() => void toggleReaction(message, emoji)}
                                      aria-label={"Reaccionar con " + emoji}>{emoji}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="community-chat-message-actions">
                            <button type="button" onClick={() => beginReply(message)} className="community-chat-action">
                              <Reply size={15}/><span>Responder{message.reply_count > 0 ? " · " + message.reply_count : ""}</span>
                            </button>
                            <div className="community-message-more-wrap">
                              <button type="button"
                                onClick={() => setMessageMenuFor((current) => current === message.id ? null : message.id)}
                                className={"community-chat-action community-message-more-trigger" + (messageMenuFor === message.id ? " is-open" : "")}
                                aria-label="Más opciones del mensaje" aria-haspopup="menu"
                                aria-expanded={messageMenuFor === message.id} title="Más opciones">
                                <MoreHorizontal size={18}/>
                              </button>
                              {messageMenuFor === message.id && (
                                <div className="community-message-context-menu" role="menu" aria-label="Opciones del mensaje">
                                  <button type="button" role="menuitem" onClick={() => { beginReply(message); setMessageMenuFor(null); }}>
                                    <Reply size={16}/>Responder
                                  </button>
                                  <button type="button" role="menuitem" onClick={() => {
                                    void navigator.clipboard.writeText(message.body);
                                    setMessageMenuFor(null);
                                  }}>
                                    <Copy size={16}/>Copiar texto
                                  </button>
                                  {message.author_id === userId && (
                                    <>
                                      <div className="community-message-menu-divider"/>
                                      <button type="button" role="menuitem" onClick={() => { beginEdit(message); setMessageMenuFor(null); }}>
                                        <Pencil size={16}/>Editar mensaje
                                      </button>
                                      <button type="button" role="menuitem" className="is-danger" onClick={() => {
                                        setMessageMenuFor(null);
                                        if (window.confirm("¿Eliminar este mensaje? Esta acción no se puede deshacer.")) void deleteMessage(message);
                                      }}>
                                        <Trash2 size={16}/>Eliminar mensaje
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })
              )}
              <div className="community-chat-scroll-anchor" aria-hidden="true"/>
            </div>
          </div>

          <div className="community-chat-composer-wrap">
            {activeChannel?.is_read_only && (
              <p className="community-chat-readonly-note">Este canal es de solo lectura.</p>
            )}
            {replyingTo && (
              <div className="community-chat-composer-replying">
                <div className="min-w-0">
                  <span>Respondiendo a <strong>{replyingTo.author?.full_name ?? "Estudiante"}</strong></span>
                  <p>{replyingTo.body.slice(0, 140) || "Imagen adjunta"}</p>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancelar respuesta"><X size={16}/></button>
              </div>
            )}
            {mentionSearchQuery && mentionSuggestions.length > 0 && (
              <div className="community-chat-mention-suggestions" role="listbox" aria-label="Personas para mencionar">
                <div className="community-chat-mention-heading"><AtSign size={13}/> Personas en este canal</div>
                {mentionSuggestions.map((member, index) => (
                  <button type="button" key={member.user_id}
                    role="option" aria-selected={index === mentionActiveIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setMentionActiveIndex(index)}
                    onClick={() => insertMention(member)}
                    className={"community-chat-mention-option " + (index === mentionActiveIndex ? "community-chat-mention-option-active" : "")}>
                    <span className="community-chat-mention-avatar">
                      {member.avatar_url
                        ? <Image src={member.avatar_url} alt="" width={28} height={28} unoptimized className="h-full w-full object-cover"/>
                        : initials(member.full_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong>{member.full_name}</strong>
                      <small>{member.status_text || "Miembro de la comunidad"}</small>
                    </span>
                    <span className="community-chat-mention-insert">@</span>
                  </button>
                ))}
                <p className="community-chat-mention-help">↑ ↓ para elegir · Tab o Enter para mencionar</p>
              </div>
            )}
            {attachmentFile && (
              <div className="community-chat-file-pending">
                <FileImage size={17}/>
                <span>{attachmentFile.name}</span>
                <small>{(attachmentFile.size / (1024 * 1024)).toFixed(2)} MB</small>
                <button type="button" onClick={() => setAttachmentFile(null)} aria-label="Quitar imagen"><X size={15}/></button>
              </div>
            )}
            <form onSubmit={(event) => void sendMessage(event)} className="community-chat-composer"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const dropped = event.dataTransfer.files?.[0];
                if (dropped && !["image/png", "image/jpeg", "image/webp"].includes(dropped.type)) setError("Adjunta una imagen PNG, JPG o WebP.");
                else if (dropped && dropped.size > 8 * 1024 * 1024) setError("La imagen debe pesar máximo 8 MB.");
                else if (dropped) { setAttachmentFile(dropped); setError(""); }
              }}>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                className="sr-only" aria-label="Seleccionar imagen"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file && file.size > 8 * 1024 * 1024) setError("La imagen debe pesar máximo 8 MB.");
                  else if (file) { setAttachmentFile(file); setError(""); }
                  event.target.value = "";
                }}/>
              <button type="button" className="community-chat-add"
                aria-label="Adjuntar imagen" title="Adjuntar imagen"
                disabled={activeChannel?.is_read_only || sending}
                onClick={() => fileInputRef.current?.click()}>
                <span>+</span>
              </button>
              <textarea ref={composerRef}
                value={draft}
                onChange={(event) => updateComposerDraft(event.target.value, event.currentTarget.selectionStart)}
                onKeyDown={(event) => {
                  if (mentionSearchQuery && mentionSuggestions.length > 0) {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setMentionActiveIndex((current) => (current + 1) % mentionSuggestions.length);
                      return;
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setMentionActiveIndex((current) => (current - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                      return;
                    }
                    if ((event.key === "Tab" || event.key === "Enter") && !event.shiftKey && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      const selected = mentionSuggestions[mentionActiveIndex];
                      if (selected) insertMention(selected);
                      return;
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setMentionSearchQuery(null);
                      setMentionSuggestions([]);
                      return;
                    }
                  }
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if ((draft.trim() || attachmentFile) && !sending) void sendMessage();
                  }
                }}
                rows={1}
                maxLength={2000}
                disabled={activeChannel?.is_read_only || sending}
                placeholder={activeChannel?.is_read_only
                  ? "Este canal es de solo lectura"
                  : "Mensaje #" + (activeChannel?.name ?? "comunidad")}
                className="community-chat-input"
              />
              <span className="community-chat-char-count">{draft.length > 0 ? draft.length + "/2000" : ""}</span>
              <button type="submit" className="community-chat-send"
                disabled={(!draft.trim() && !attachmentFile) || sending || uploadingAttachment || activeChannel?.is_read_only}
                aria-label="Enviar mensaje">{uploadingAttachment ? <span className="community-chat-spinner"/> : <Send size={17}/>}</button>
            </form>
          </div>
        </section>

        {memberListOpen && (
          <aside className="community-member-sidebar" aria-label="Miembros de PeakScore Community">
            <div className="community-member-sidebar-scroll">
              {communityMemberGroups.map((group) => {
                const collapsed = Boolean(collapsedMemberGroups[group.key]);
                return (
                  <section key={group.key} className="community-member-group">
                    <button
                      type="button"
                      className="community-member-group-toggle"
                      style={{ "--member-role-color": group.color } as CSSProperties}
                      onClick={() => setCollapsedMemberGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                      aria-expanded={!collapsed}
                    >
                      <ChevronDown size={13} className="community-member-group-chevron" aria-hidden="true"/>
                      <i aria-hidden="true"/>
                      <span className="community-member-group-label">{group.label}</span>
                      <span className="community-member-group-count">{group.members.length}</span>
                    </button>
                    {!collapsed && (
                      <div className="community-member-group-list">
                        {group.members.map((member) => {
                          const isOnline = onlineMemberIds.includes(member.id);
                          return (
                            <button type="button" key={member.id} className={"community-member-row" + (isOnline ? "" : " community-member-offline")}
                              onClick={(event) => {
                                const rect = event.currentTarget.getBoundingClientRect();
                                openMemberHoverPreview(member, {
                                  clientX: rect.left + Math.min(rect.width, 220),
                                  clientY: rect.top + Math.min(rect.height, 28),
                                });
                              }}>
                              <span className={"community-member-avatar frame-" + (member.avatar_frame ?? "none")}>
                                {member.avatar_url
                                  ? <Image src={member.avatar_url} alt="" width={30} height={30} unoptimized className="h-full w-full object-cover"/>
                                  : initials(member.full_name)}
                                <i className={isOnline ? "is-online" : "is-offline"}/>
                              </span>
                              <span className="community-member-copy">
                                <CommunityStaticName
                                  tag="span"
                                  value={member.full_name}
                                  className={"ps-community-name-render community-member-nameplate community-member-name-render is-plate-" + (member.plate_style ?? "classic") + " is-name-style-" + (member.display_name_style ?? "classic") + " effect-" + (member.display_name_effect ?? "plain") + " color-" + displayNameColorForEffect(member.display_name_effect, member.display_name_color)}
                                  style={{
                                    "--name-gradient-start": member.display_name_gradient_start ?? "#B86BFF",
                                    "--name-gradient-end": member.display_name_gradient_end ?? "#4E9BFF",
                                    "--name-prism-gradient": "linear-gradient(90deg," + (member.display_name_prism_colors ?? ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"]).join(",") + ")",
                                    "--name-solid-color": displayNameSolidColor(member.display_name_color, member.display_name_gradient_start),
                                  } as React.CSSProperties}
                                />
                                {member.id === userId && isFounder && (
                                  <span className="community-member-verified-dot" title="Founder verificado" aria-label="Founder verificado"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path d="M12 1.2c1.8 0 3 2.1 4.7 2.5 1.8.4 4.1-.4 5.1 1.2 1 1.6-.1 3.7.5 5.4.6 1.7 2.7 3.1 2.2 4.9-.5 1.8-2.9 2.3-4 3.8-1.1 1.5-.9 4-2.6 4.9-1.7.9-3.7-.5-5.5-.5s-3.8 1.4-5.5.5c-1.7-.9-1.5-3.4-2.6-4.9-1.1-1.5-3.5-2-4-3.8-.5-1.8 1.6-3.2 2.2-4.9.6-1.7-.5-3.8.5-5.4 1-1.6 3.3-.8 5.1-1.2C9 3.3 10.2 1.2 12 1.2Z" fill="currentColor"/>
                          <path d="m6.9 12.2 3.3 3.3 7-7" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg></span>
                                )}
                                {member.status_text && <small>{member.status_text}</small>}
                                {member.roles && member.roles.filter((role) => role.display_as_badge).slice(0, 2).length > 0 && (
                                  <span className="community-member-role-badges" aria-label="Roles">
                                    {member.roles.filter((role) => role.display_as_badge).slice(0, 2).map((role) => (
                                      <span key={role.role_key} style={{ "--member-role-color": /^#[0-9a-f]{6}$/i.test(role.badge_color) ? role.badge_color : "#929aa6" } as CSSProperties}>
                                        {role.label}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </aside>
        )}

        {founderStudioOpen && isFounder && (
          <CommunityFounderStudio
            key={founderStudioTab + ":" + (founderStudioAction ?? "")}
            initialTab={founderStudioTab}
            initialAction={founderStudioAction}
            initialChannelId={founderStudioChannelId}
            onAssetUpdated={(assetType, path, url) => setActiveSpace((current) => current ? ({
              ...current,
              icon_path: assetType === "icon" ? path : current.icon_path,
              icon_url: assetType === "icon" ? url : current.icon_url,
              banner_path: assetType === "banner" ? path : current.banner_path,
              banner_url: assetType === "banner" ? url : current.banner_url,
            }) : current)}
            onClose={() => setFounderStudioOpen(false)}
          />
        )}

        {communityProfileStudioOpen && selectedCommunityProfile?.isOwnProfile && (
          <CommunityProfileStudio
            userId={selectedCommunityProfile.userId}
            initialProfile={selectedCommunityProfile}
            isOnline={onlineMemberIds.includes(selectedCommunityProfile.userId)}
            onClose={() => setCommunityProfileStudioOpen(false)}
            onSaved={() => {
              const memberId = selectedCommunityProfile.userId;
              void openCommunityProfile(memberId);
            }}
          />
        )}

        {hoverCommunityProfile && (
          <div
            ref={memberPopoutRef}
            className="ps-community-member-popout"
            style={{ left: hoverProfilePosition.left, top: hoverProfilePosition.top }}
            onMouseEnter={keepMemberHoverPreviewOpen}
            onMouseLeave={scheduleCloseMemberHoverPreview}
          >
            <article
              className="ps-community-member-popout__card"
              style={{ "--community-accent": hoverCommunityProfile.accentColor ?? "#3987FF", "--community-card-color": hoverCommunityProfile.cardColor ?? "#B7D7C3", "--community-theme-gradient": "linear-gradient(180deg, " + (hoverCommunityProfile.cardColor ?? "#B7D7C3") + ", " + (hoverCommunityProfile.themeColorSecondary ?? "#8FB9A6") + ")", "--community-theme-text": communityThemeText(hoverCommunityProfile.cardColor ?? "#B7D7C3"), "--community-theme-body-text": communityThemeText(communityThemeMidpoint(hoverCommunityProfile.cardColor ?? "#B7D7C3", hoverCommunityProfile.themeColorSecondary ?? "#8FB9A6")) } as CSSProperties}
            >
              <div className="ps-community-member-popout__banner" style={{ backgroundColor: "#20242D" }}>
                {hoverCommunityProfile.bannerUrl ? (
                  <Image src={hoverCommunityProfile.bannerUrl} alt="" fill unoptimized className="ps-community-member-popout__banner-image"/>
                ) : (
                  <div className="ps-community-member-popout__banner-fallback">
                    <span>PEAK<span>SCORE</span></span>
                  </div>
                )}
              </div>
              <div className="ps-community-member-popout__body">
                <div className="ps-community-member-popout__top">
                  <div className={"ps-community-member-popout__avatar frame-" + (hoverCommunityProfile.avatarFrame ?? "none")}>
                    {hoverCommunityProfile.avatarUrl
                      ? <Image src={hoverCommunityProfile.avatarUrl} alt="" width={88} height={88} unoptimized/>
                      : <span>{initials(hoverCommunityProfile.displayName)}</span>}
                    <i className={onlineMemberIds.includes(hoverCommunityProfile.userId) ? "is-online" : ""}/>
                  </div>
                  {hoverCommunityProfile.statusText && (
                    <div className="ps-community-member-popout__status-bubble">{hoverCommunityProfile.statusText}</div>
                  )}
                  <div className="ps-community-member-popout__actions">
                    <div className="ps-community-member-popout__menu-anchor">
                      <button
                        type="button"
                        onClick={() => setMemberProfileMenuOpen((open) => !open)}
                        aria-label="Más opciones del miembro"
                        title="Más opciones"
                        aria-haspopup="menu"
                        aria-expanded={memberProfileMenuOpen}
                      >
                        <MoreHorizontal size={17}/>
                      </button>
                      {memberProfileMenuOpen && (
                        <div className="ps-community-member-popout__menu" role="menu" aria-label="Opciones del perfil">
                          <button type="button" role="menuitem" onClick={() => void openCommunityProfile(hoverCommunityProfile.userId)}>
                            <ArrowUpRight size={15}/> Ver perfil completo
                          </button>
                          <button type="button" role="menuitem" onClick={() => {
                            insertMention({ user_id: hoverCommunityProfile.userId, full_name: hoverCommunityProfile.displayName, avatar_url: hoverCommunityProfile.avatarUrl, status_text: hoverCommunityProfile.statusText });
                            setHoverCommunityProfile(null);
                            setMemberProfileMenuOpen(false);
                          }}>
                            <AtSign size={15}/> Mencionar
                          </button>
                          <button type="button" role="menuitem" onClick={() => void shareCommunityMemberProfile(hoverCommunityProfile.userId, hoverCommunityProfile.displayName)}>
                            <Share2 size={15}/> Compartir perfil
                          </button>
                          <button type="button" role="menuitem" onClick={() => {
                            void navigator.clipboard.writeText(communityMemberProfileUrl(hoverCommunityProfile.userId))
                              .then(() => setMemberProfileMenuOpen(false))
                              .catch(() => setCommunityProfileError("No se pudo copiar el enlace."));
                          }}>
                            <Copy size={15}/> Copiar enlace
                          </button>
                          <button type="button" role="menuitem" onClick={() => {
                            void navigator.clipboard.writeText(hoverCommunityProfile.displayName)
                              .then(() => setMemberProfileMenuOpen(false))
                              .catch(() => setCommunityProfileError("No se pudo copiar el nombre."));
                          }}>
                            <Copy size={15}/> Copiar nombre
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        insertMention({ user_id: hoverCommunityProfile.userId, full_name: hoverCommunityProfile.displayName, avatar_url: hoverCommunityProfile.avatarUrl, status_text: hoverCommunityProfile.statusText });
                        setHoverCommunityProfile(null);
                      }}
                      aria-label="Mencionar miembro"
                      title="Mencionar"
                    >
                      <AtSign size={16}/>
                    </button>
                  </div>
                </div>

                <div className="ps-community-member-popout__identity">
                  <CommunityStaticName key={hoverCommunityProfile.userId} tag="h3" value={hoverCommunityProfile.displayName} className={"ps-community-name-render is-plate-" + (hoverCommunityProfile.plateStyle ?? "classic") + " is-name-style-" + (hoverCommunityProfile.displayNameStyle ?? "classic") + " effect-" + (hoverCommunityProfile.displayNameEffect ?? "plain") + " color-" + displayNameColorForEffect(hoverCommunityProfile.displayNameEffect, hoverCommunityProfile.displayNameColor)} style={{ "--name-gradient-start": hoverCommunityProfile.displayNameGradientStart ?? "#B86BFF", "--name-gradient-end": hoverCommunityProfile.displayNameGradientEnd ?? "#4E9BFF", "--name-prism-gradient": "linear-gradient(90deg," + (hoverCommunityProfile.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"]).join(",") + ")", "--name-solid-color": displayNameSolidColor(hoverCommunityProfile.displayNameColor, hoverCommunityProfile.displayNameGradientStart) } as React.CSSProperties}/>
                  <span>{hoverCommunityProfile.memberNumber ? "Miembro " + String(hoverCommunityProfile.memberNumber).padStart(4, "0") : "Miembro nuevo"}</span>
                </div>

                {hoverCommunityProfile.roles.length > 0 && (
                  <div className="ps-community-member-popout__roles" aria-label="Roles de comunidad">
                    {hoverCommunityProfile.roles.slice(0, 5).map((role) => (
                      <span key={role.roleKey} style={{
                        "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#8c95a3",
                      } as CSSProperties}>{role.label}</span>
                    ))}
                  </div>
                )}

                {hoverCommunityProfile.about && (
                  <p className="ps-community-member-popout__about">{hoverCommunityProfile.about}</p>
                )}

                <footer className="ps-community-member-popout__footer">
                  <span>MIEMBRO DESDE</span>
                  <strong>{hoverCommunityProfile.joinedAt ? new Date(hoverCommunityProfile.joinedAt).toLocaleDateString("es-CO", { month: "short", year: "numeric" }) : "Fecha no disponible"}</strong>
                </footer>
              </div>
            </article>
          </div>
        )}

        {!communityProfileStudioOpen && selectedCommunityProfile && (
          <div className="ps-community-profile-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              communityProfileRequestRef.current += 1;
              setSelectedCommunityProfile(null);
              setCommunityProfileLoading(false);
              setCommunityProfileError("");
              setCopiedCommunityProfileId(null);
              clearCommunityMemberProfileUrl();
            }
          }}>
            <section className={"ps-community-profile-dialog ps-community-profile-live-card ps-community-editor-preview-card is-plate-" + (selectedCommunityProfile.plateStyle ?? "classic")} role="dialog" aria-modal="true" aria-labelledby="ps-community-profile-title"
              style={{
                "--editor-accent": selectedCommunityProfile.accentColor ?? "#3987FF",
                "--editor-card": selectedCommunityProfile.cardColor ?? "#B7D7C3",
                "--editor-theme-gradient": "linear-gradient(180deg, " + (selectedCommunityProfile.cardColor ?? "#B7D7C3") + ", " + (selectedCommunityProfile.themeColorSecondary ?? "#8FB9A6") + ")",
                "--editor-banner-background": "#20242D",
                "--editor-theme-text": communityThemeText(selectedCommunityProfile.cardColor ?? "#B7D7C3"),
                "--editor-theme-body-text": communityThemeText(communityThemeMidpoint(selectedCommunityProfile.cardColor ?? "#B7D7C3", selectedCommunityProfile.themeColorSecondary ?? "#8FB9A6")),
                "--editor-theme-bottom-text": communityThemeText(selectedCommunityProfile.themeColorSecondary ?? "#8FB9A6"),
                "--name-gradient-start": selectedCommunityProfile.displayNameGradientStart ?? "#B86BFF",
                "--name-gradient-end": selectedCommunityProfile.displayNameGradientEnd ?? "#4E9BFF",
                "--name-prism-gradient": "linear-gradient(90deg," + (selectedCommunityProfile.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"]).join(",") + ")",
                "--name-solid-color": displayNameSolidColor(selectedCommunityProfile.displayNameColor, selectedCommunityProfile.displayNameGradientStart),
              } as CSSProperties}>
              <div className="ps-community-editor-banner-anchor">
                <div className={"ps-community-editor-preview-banner" + (selectedCommunityProfile.bannerUrl ? " has-user-banner" : " is-peakscore-banner")}
                  style={selectedCommunityProfile.bannerUrl
                    ? { backgroundImage: "url(" + selectedCommunityProfile.bannerUrl + ")", backgroundSize: "cover", backgroundPosition: "center" }
                    : { backgroundColor: "#20242D" }}>
                  <div className="ps-community-editor-preview-banner-shade" aria-hidden="true"/>
                  <div className="ps-community-editor-preview-banner-empty" aria-hidden="true"/>
                </div>
              </div>

              <button type="button" className="ps-community-profile-close" ref={communityProfileCloseRef}
                onClick={() => {
                  communityProfileRequestRef.current += 1;
                  setSelectedCommunityProfile(null);
                  setCommunityProfileLoading(false);
                  setCommunityProfileError("");
                  setCopiedCommunityProfileId(null);
                  clearCommunityMemberProfileUrl();
                }} aria-label="Cerrar perfil"><X size={19}/></button>

              <div className="ps-community-editor-preview-body ps-community-profile-live-readonly-body">
                <div className="ps-community-editor-preview-avatar-row">
                  <div className="ps-community-editor-preview-avatar-anchor">
                    <span className="ps-community-editor-preview-avatar-trigger" aria-hidden="true">
                      <span className={"ps-community-editor-preview-avatar frame-" + (selectedCommunityProfile.avatarFrame ?? "none")}>
                        {selectedCommunityProfile.avatarUrl
                          ? <Image src={selectedCommunityProfile.avatarUrl} alt="" fill unoptimized sizes="96px"/>
                          : <span>{initials(selectedCommunityProfile.displayName || "PeakScore")}</span>}
                        <i className={"ps-community-editor-presence-dot " + (onlineMemberIds.includes(selectedCommunityProfile.userId) ? "is-online" : "is-offline")} role="img" aria-label={onlineMemberIds.includes(selectedCommunityProfile.userId) ? "En línea" : "Desconectado"}/>
                      </span>
                    </span>
                  </div>
                  <span className={"ps-community-note-bubble" + (selectedCommunityProfile.statusText ? " has-status" : " is-empty")} aria-label="Estado personalizado">
                    {!selectedCommunityProfile.statusText && <Plus size={13} aria-hidden="true"/>}
                    <span className="ps-community-note-bubble-text">{selectedCommunityProfile.statusText || "Añadir estado"}</span>
                    <Pencil size={11} className="ps-community-note-bubble-edit" aria-hidden="true"/>
                  </span>
                </div>

                <CommunityAnimatedName key={selectedCommunityProfile.userId} tag="h2" id="ps-community-profile-title"
                  value={selectedCommunityProfile.displayName || "Tu nombre"}
                  animation={selectedCommunityProfile.displayNameAnimation ?? "decrypt"}
                  previewMode={true}
                  className={"ps-community-editor-preview-name-static is-plate-" + (selectedCommunityProfile.plateStyle ?? "classic") + " is-name-style-" + (selectedCommunityProfile.displayNameStyle ?? "classic") + " effect-" + (selectedCommunityProfile.displayNameEffect ?? "plain") + " color-" + displayNameColorForEffect(selectedCommunityProfile.displayNameEffect, selectedCommunityProfile.displayNameColor)}
                  style={{
                    "--name-gradient-start": selectedCommunityProfile.displayNameGradientStart ?? "#B86BFF",
                    "--name-gradient-end": selectedCommunityProfile.displayNameGradientEnd ?? "#4E9BFF",
                    "--name-prism-gradient": "linear-gradient(90deg," + (selectedCommunityProfile.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"]).join(",") + ")",
                    "--name-solid-color": displayNameSolidColor(selectedCommunityProfile.displayNameColor, selectedCommunityProfile.displayNameGradientStart),
                  } as CSSProperties}/>

                <div className="ps-community-editor-preview-identity-line">
                  <span className="ps-community-editor-preview-tag">{"@" + (selectedCommunityProfile.accountName?.trim().replace(/^@+/, "") || "usuario")}</span>
                  <span className={"ps-community-editor-preview-pronouns ps-community-profile-readonly-pronouns" + (!selectedCommunityProfile.pronouns ? " is-empty" : "")} aria-label="Pronombres">{selectedCommunityProfile.pronouns || "Añadir pronombres"}</span>
                </div>

                <div className="ps-community-editor-preview-role-row">
                  {selectedCommunityProfile.roles.slice(0, 3).map((role) => (
                    <span key={role.roleKey} style={{ "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : (selectedCommunityProfile.accentColor ?? "#3987FF") } as CSSProperties}>{role.label}</span>
                  ))}
                </div>

                <section className="ps-community-editor-preview-about">
                  <div className="ps-community-editor-preview-about-heading"><span>Biografía</span><small>{selectedCommunityProfile.about.length}/256</small></div>
                  <div className="ps-community-editor-bio-display ps-community-profile-bio-readonly">{selectedCommunityProfile.about || "Cuéntanos un poco sobre ti…"}</div>
                </section>

                <section className="ps-community-editor-preview-meta">
                  <span>MIEMBRO DESDE</span>
                  <strong>{selectedCommunityProfile.joinedAt ? new Date(selectedCommunityProfile.joinedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "Fecha no disponible"}</strong>
                  {selectedCommunityProfile.isOwnProfile && (
                    <button type="button" className="ps-community-profile-editor-button" onClick={() => setCommunityProfileStudioOpen(true)}>
                      <Pencil size={15}/> Abrir editor de perfil
                    </button>
                  )}
                </section>

                {communityProfileLoading && <p className="ps-community-profile-sync" role="status">Actualizando perfil…</p>}
                {communityProfileError && (
                  <div className="ps-community-profile-retry" role="status">
                    <span>No se pudieron actualizar algunos datos. Se conserva la información disponible.</span>
                    <button type="button" onClick={() => void openCommunityProfile(selectedCommunityProfile.userId)}>Reintentar</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
