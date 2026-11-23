"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ShieldCheck, LockKeyhole,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Share2, MoreHorizontal, Layers3, SmilePlus, Reply, FileImage, Pencil, Check, AtSign, Copy, ArrowUpRight,
  PanelRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import CommunityProfileStudio from "@/components/community/CommunityProfileStudio";
import DecryptedDisplayName from "@/components/community/DecryptedDisplayName";
import GlitchDisplayName from "@/components/community/GlitchDisplayName";

type Channel = {
  id: string; slug: string; name: string; description: string;
  category: string; position: number; is_read_only: boolean; is_private: boolean;
};
type CommunityRole = {
  role_key: string; label: string; badge_color: string; display_as_badge: boolean;
};
type CommunityPlateStyle = "classic" | "grid" | "arcade" | "signal";
type CommunityDisplayNameStyle = "classic" | "tempo" | "sakura" | "jellybean" | "modern" | "medieval" | "8bit" | "vampyre" | "monkey-bars" | "mainframe" | "headbang" | "journal" | "display" | "editorial" | "elegant" | "geometric" | "retro" | "handwritten" | "signature" | "techno" | "rounded" | "stencil";
type CommunityDisplayNameEffect = "plain" | "gradient" | "neon" | "toon" | "pop" | "gummy" | "prism";
type CommunityDisplayNameAnimation = "none" | "typewriter" | "cascade" | "cinematic" | "orbit" | "magnetic" | "spotlight" | "wave" | "bounce" | "fold" | "decrypt" | "glitch";
type CommunityDisplayNameColor = "default" | "pink" | "green" | "blue" | "purple" | "magenta" | "red" | "gold" | "custom-gradient";
type CommunityAvatarFrame = "none" | "solar" | "violet" | "cyan" | "ember";
type CommunityAvatarDecoration = "none" | "bloom" | "electric" | "glitch";
type CommunityProfileFrame = "none" | "lunar" | "crimson" | "aurora";
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
  displayName: string;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  cardColor?: string;
  themeColorSecondary?: string;
  plateStyle?: "classic" | "grid" | "arcade" | "signal";
  displayNameStyle?: CommunityDisplayNameStyle;
  displayNameEffect?: CommunityDisplayNameEffect;
  displayNameAnimation?: CommunityDisplayNameAnimation;
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
  const window = animation === "typewriter" ? 620 : animation === "decrypt" ? 300 : 460;
  const step = Math.min(animation === "typewriter" ? 72 : 56, window / Math.max(1, count - 1));
  return Math.round(index * step) + "ms";
}

function CommunityAnimatedName({ value, animation, className, style, tag = "strong", id }: {
  value: string;
  animation: CommunityDisplayNameAnimation;
  className: string;
  style?: React.CSSProperties;
  tag?: "strong" | "span" | "h2" | "h3";
  id?: string;
}) {
  const Tag = tag;
  const characters = communityNameCharacters(value);
  const fitScale = Math.max(0.72, 1 - Math.max(0, characters.length - 18) * 0.008);
  const tagScale = tag === "h2" ? 1.5 : tag === "h3" ? 1.17 : 1;
  const safeStyle = { ...style, fontSize: (fitScale * tagScale).toFixed(3) + "em", maxWidth: "100%" } as React.CSSProperties;
  if (animation === "decrypt") {
    return <DecryptedDisplayName
      id={id}
      text={value}
      tag={tag}
      className={className}
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
  if (animation === "glitch") {
    return <GlitchDisplayName
      text={value}
      tag={tag}
      className={className}
      style={safeStyle}
      mode="slices"
      speed={0.5}
      enableShadows
      offset={10}
      shadowColors={["#ff273a", "#00eaff"]}
      intensity={0.52}
      skew={0}
      flicker={false}
      trigger="always"
      burstDuration={0.72}
    />;
  }
    if (animation === "none") return <Tag id={id} className={className} style={safeStyle}>{value}</Tag>;
  return <Tag id={id} className={className + " name-enter-" + animation} style={safeStyle} aria-label={value}>
    <span className="ps-name-animation-text" aria-hidden="true">{characters.map((character, index) => (
      <span className="ps-name-animation-char" style={{
        "--char-index": index,
        "--char-delay": communityNameCharacterDelay(index, characters.length, animation),
        "--char-direction": index % 2 === 0 ? "-1" : "1",
        "--char-rotation": (index % 2 === 0 ? -1 : 1) * (animation === "orbit" ? 34 : animation === "wave" ? 8 : 7) + "deg",
      } as React.CSSProperties} key={index}>{character === " " ? "\u00A0" : character}</span>
    ))}</span>
  </Tag>;
}

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CommunityMemberSummary | null>(null);
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState<CommunityMemberProfile | null>(null);
  const [hoverCommunityProfile, setHoverCommunityProfile] = useState<CommunityMemberProfile | null>(null);
  const [hoverProfilePosition, setHoverProfilePosition] = useState({ left: 0, top: 0 });
  const hoverProfileCloseTimerRef = useRef<number | null>(null);
  const communityProfileRequestRef = useRef(0);
  const communityProfileCloseRef = useRef<HTMLButtonElement | null>(null);
  const [communityProfileLoading, setCommunityProfileLoading] = useState(false);
  const communityProfileCacheRef = useRef(new Map<string, CommunityMemberProfile>());
  const [communityProfileStudioOpen, setCommunityProfileStudioOpen] = useState(false);
  const [communityProfileError, setCommunityProfileError] = useState("");
  const [copiedCommunityProfileId, setCopiedCommunityProfileId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionDisplayNames, setMentionDisplayNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
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
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
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
  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  function openMemberHoverPreview(member: CommunityMemberSummary, event: { clientX: number; clientY: number }) {
    if (hoverProfileCloseTimerRef.current !== null) window.clearTimeout(hoverProfileCloseTimerRef.current);
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
      displayNameAnimation: member.display_name_animation ?? "none",
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
    hoverProfileCloseTimerRef.current = window.setTimeout(() => setHoverCommunityProfile(null), 180);
  }

  function keepMemberHoverPreviewOpen() {
    if (hoverProfileCloseTimerRef.current !== null) window.clearTimeout(hoverProfileCloseTimerRef.current);
    hoverProfileCloseTimerRef.current = null;
  }

  async function openCommunityProfile(memberId: string) {
    const requestId = ++communityProfileRequestRef.current;
    setHoverCommunityProfile(null);
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
      displayNameAnimation: member?.display_name_animation ?? "none",
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
        display_name_animation: payload.profile!.displayNameAnimation ?? "none",
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
      }
    }
    window.addEventListener("keydown", handleProfileKeyDown);
    return () => window.removeEventListener("keydown", handleProfileKeyDown);
  }, [selectedCommunityProfile, communityProfileLoading, communityProfileError]);

  useEffect(() => {
    const openProfileUserId = selectedCommunityProfile?.userId;
    if (!openProfileUserId || communityProfileStudioOpen) return;
    communityProfileCloseRef.current?.focus();
  }, [selectedCommunityProfile?.userId, communityProfileStudioOpen]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadCommunityMembers() {
      const { data, error: memberError } = await supabase
        .from("community_member_profiles")
        .select("user_id,member_number,display_name,avatar_path,status_text,about,created_at,status_expires_at")
        .order("display_name", { ascending: true })
        .limit(100);
      if (!active || memberError) return;
      const ids = (data ?? []).map((member) => member.user_id);
      const { data: roleRows } = ids.length
        ? await supabase.from("community_public_role_badges")
            .select("user_id,role_key,label,badge_color")
            .in("user_id", ids)
        : { data: [] };
      let appearanceRows: Array<{ user_id: string; banner_path: string | null; card_color: string | null; theme_color_secondary: string | null; plate_style: CommunityPlateStyle | null; display_name_style: CommunityDisplayNameStyle | null; display_name_effect: CommunityDisplayNameEffect | null; display_name_animation: CommunityDisplayNameAnimation | null; display_name_color: CommunityDisplayNameColor | null; display_name_prism_colors: string[] | null; accent_color: string | null; avatar_frame: CommunityAvatarFrame | null; avatar_decoration_id: CommunityAvatarDecoration | null; profile_frame_id: CommunityProfileFrame | null; profile_effect_id: CommunityProfileEffect | null }> = [];
      if (ids.length) {
        const { data: appearanceData, error: appearanceError } = await supabase
          .from("community_member_profiles")
          .select("user_id,banner_path,card_color,theme_color_secondary,plate_style,display_name_style,display_name_effect,display_name_animation,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors,accent_color,avatar_frame,avatar_decoration_id,profile_frame_id,profile_effect_id")
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
        });
        rolesByMember.set(role.user_id, list);
      });
      const memberRows = (data ?? []).map((member) => ({
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
        display_name_animation: appearanceByMember.get(member.user_id)?.display_name_animation ?? "none",
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
  }, [userId]);

  const communityMemberGroups = useMemo(() => {
    const priority: Record<string, number> = {
      fundador: 0, administrador: 1, moderador: 2, profesor: 3, estudiante: 4,
    };
    const groups = new Map<string, { key: string; label: string; color: string; priority: number; members: CommunityMemberSummary[] }>();
    for (const member of communityMembers) {
      const role = [...(member.roles ?? [])].sort(
        (a, b) => (priority[a.role_key] ?? 99) - (priority[b.role_key] ?? 99),
      )[0];
      const key = role?.role_key ?? "members";
      const label = role?.label ?? "Miembros";
      const group = groups.get(key) ?? {
        key, label, color: role?.badge_color ?? "#9297a1",
        priority: priority[key] ?? 99, members: [],
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

  const groupedChannels = useMemo(() => CATEGORIES.map((category) => ({
    category,
    channels: channels.filter((channel) => channel.category === category)
      .sort((a, b) => a.position - b.position),
  })).filter((group) => group.channels.length), [channels]);

  const refreshStats = useCallback(async () => {
    const { count: members } = await supabase
      .from("community_member_profiles")
      .select("user_id", { count: "exact", head: true });
    setMemberCount(members ?? 0);
  }, []);

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
        .select("user_id,display_name,avatar_path,status_text,display_name_style,display_name_effect,display_name_animation,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors")
        .in("user_id", authorIds),
      supabase.from("community_public_role_badges")
        .select("user_id,role_key,label,badge_color")
        .in("user_id", authorIds),
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

    // Message delivery must not depend on optional schema additions. The public
    // badge projection, aggregate metrics and attachment bucket may be deployed
    // separately; omit enhancements until their migration is present.
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
        display_name_animation: author.display_name_animation ?? "none",
        display_name_color: author.display_name_color ?? "default",
        display_name_gradient_start: author.display_name_gradient_start ?? "#B86BFF",
        display_name_gradient_end: author.display_name_gradient_end ?? "#4E9BFF",
        display_name_prism_colors: author.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
      }]),
    );
    const roleMap = new Map<string, CommunityRole[]>();
    ((badgeError ? [] : publicRoleBadges ?? []) as PublicRoleBadge[]).forEach((badge) => {
      const current = roleMap.get(badge.user_id) ?? [];
      current.push({
        role_key: badge.role_key,
        label: badge.label,
        badge_color: badge.badge_color,
        display_as_badge: true,
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
  }, [channels]);

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
      const [
        { data: currentProfile },
        { data: channelData },
        { data: roleData },
        { data: roleAssignments },
      ] = await Promise.all([
        supabase.from("community_member_profiles")
          .select("user_id,display_name,avatar_path,status_text,status_expires_at,display_name_style,display_name_effect,display_name_color,display_name_gradient_start,display_name_gradient_end,display_name_prism_colors").eq("user_id", user.id).maybeSingle(),
        supabase.from("community_channels")
          .select("id,slug,name,description,category,position,is_read_only,is_private").order("position"),
        supabase.from("community_role_catalog")
          .select("role_key,label,badge_color,display_as_badge"),
        supabase.from("community_member_roles")
          .select("user_id,role_key").eq("user_id", user.id),
      ]);
      if (!alive) return;
      const catalog = (roleData ?? []) as CommunityRole[];
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
        display_name_animation: currentProfile.display_name_animation ?? "none",
        display_name_color: currentProfile.display_name_color ?? "default",
        display_name_gradient_start: currentProfile.display_name_gradient_start ?? "#B86BFF",
        display_name_gradient_end: currentProfile.display_name_gradient_end ?? "#4E9BFF",
        display_name_prism_colors: currentProfile.display_name_prism_colors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"],
        roles: currentRoles,
      } : null);
      const list = (channelData ?? []) as Channel[];
      setChannels(list);
      await refreshStats();
      if (!alive) return;
      const requested = new URLSearchParams(window.location.search).get("channel");
      const selected = list.find((item) => item.slug === requested)
        ?? list.find((item) => item.slug === "general") ?? list[0];
      if (selected) {
        activeChannelIdRef.current = selected.id;
        setActiveChannelId(selected.id);
      }
      setLoading(false);
    }
    void initialize();
    return () => { alive = false; };
  }, [router, refreshStats]);

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
    window.history.replaceState(null, "", "/comunidad?channel=" + channel.slug);
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
          throw new Error(submittedReply && ["42703", "PGRST204"].includes(insertError?.code ?? "")
            ? "Las respuestas directas estarán disponibles cuando se aplique la migración de chat."
            : insertError?.message.includes("row-level security")
              ? "Este canal no permite publicar con tu cuenta."
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
    const url = window.location.origin + "/comunidad?channel="
      + (message.channel?.slug ?? "general") + "#post-" + message.id;
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
    <main className="community-page">
      <div className="community-layout">
        <nav className="community-server-rail" aria-label="Servidores">
          <Link href="/" className="community-server-home" aria-label="Volver a PeakScore">
            <span className="community-server-mark">P</span>
          </Link>
          <span className="community-server-divider"/>
          <Link href="/comunidad" className="community-server-icon community-server-icon-active" aria-label="PeakScore Community">
            <Users size={22}/>
          </Link>
          <Link href="/comunidad/en-vivo" className="community-server-icon" aria-label="Sesiones en vivo">
            <Radio size={20}/>
          </Link>
        </nav>

        <aside id="community-channel-drawer" className={"community-sidebar " + (mobileChannelsOpen ? "community-sidebar-open" : "")}>
          <div className="community-server-header">
            <div className="min-w-0">
              <p className="community-server-eyebrow">COMUNIDAD</p>
              <p className="community-server-name">PeakScore Community</p>
            </div>
            <button type="button" className="community-sidebar-close lg:hidden"
              onClick={() => setMobileChannelsOpen(false)} aria-label="Cerrar canales"><X size={17}/></button>
          </div>

          <nav className="community-channel-list" aria-label="Canales de PeakScore">
            <div className="community-nav-section">
              <p className="community-nav-heading">COMUNIDAD</p>
              <Link href="/comunidad/en-vivo" className="community-nav-item">
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
                  const Icon = CHANNEL_ICONS[channel.slug] ?? Hash;
                  const active = channel.id === activeChannelId;
                  return (
                    <button type="button" key={channel.id} onClick={() => void selectChannel(channel)}
                      aria-current={active ? "page" : undefined}
                      className={"community-nav-item community-channel-link " + (active ? "community-nav-active" : "")}>
                      <Icon size={17}/>
                      <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                      {channel.is_private && <LockKeyhole size={13} className="community-channel-lock" aria-label="Canal privado"/>}
                      {channel.is_read_only && <ShieldCheck size={13} className="community-channel-readonly" aria-label="Solo lectura"/>}
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>

          <button type="button" className="community-user-panel community-user-panel-button"
            onClick={() => userId && void openCommunityProfile(userId)}
            aria-label="Abrir mi perfil de comunidad">
            <span className="community-avatar community-user-avatar">
              {profile?.avatar_url
                ? <Image src={profile.avatar_url} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover"/>
                : initials(profile?.full_name)}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-semibold text-white">{profile?.full_name || "Mi perfil social"}</span>
              <span className="community-user-presence"><span/>{profile?.status_text || "Editar perfil comunitario"}</span>
            </span>
            <Pencil size={14} className="community-user-role" aria-hidden="true"/>
          </button>
        </aside>

        {mobileChannelsOpen && (
          <button type="button" aria-label="Cerrar menú de canales"
            className="community-mobile-scrim lg:hidden"
            onClick={() => setMobileChannelsOpen(false)}/>
        )}

        <section className="community-chat-column">
          <header className="community-chat-header">
            <div className="community-chat-title">
              <button type="button" className="community-mobile-menu lg:hidden"
                onClick={() => setMobileChannelsOpen(true)} aria-label="Abrir canales" aria-expanded={mobileChannelsOpen} aria-controls="community-channel-drawer"><Menu size={20}/></button>
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
              <span className="community-chat-header-divider"/>
              <span className="community-chat-member-count" title="Miembros registrados">
                <Users size={17}/>{memberCount.toLocaleString("es-CO")}
              </span>
              <span className="community-chat-online" title="Personas conectadas">
                <i/>{onlineUsers} en línea
              </span>
              <button type="button"
                className={"community-chat-tool community-member-toggle " + (memberListOpen ? "community-chat-tool-active" : "")}
                onClick={() => setMemberListOpen((value) => !value)}
                aria-label={memberListOpen ? "Ocultar lista de miembros" : "Mostrar lista de miembros"}
                aria-pressed={memberListOpen} title="Miembros">
                <PanelRight size={18}/>
              </button>
            </div>
          </header>

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
                        className={"community-chat-message group " + (groupedWithPrevious ? "community-chat-message-grouped" : "") + (message.pending ? " community-chat-message-pending" : "")}>
                        <div className="community-chat-avatar-column">
                          {groupedWithPrevious ? (
                            <time className="community-chat-hover-time" dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
                          ) : (
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
                          {message.pending && <span className="community-chat-pending-label">ENVIANDO</span>}
                          {!groupedWithPrevious && (
                            <div className="community-chat-message-meta">
                              {message.author ? (
                                <>
                                  <button type="button"
                                    onClick={() => void openCommunityProfile(message.author!.id)}
                                    className={"community-chat-author community-chat-author-link is-name-style-" + (message.author.display_name_style ?? "classic") + " effect-" + (message.author.display_name_effect ?? "plain") + " color-" + (message.author.display_name_color ?? "default")}
                                    style={{
                                      "--name-gradient-start": message.author.display_name_gradient_start ?? "#B86BFF",
                                      "--name-gradient-end": message.author.display_name_gradient_end ?? "#4E9BFF",
                                      "--name-prism-gradient": "linear-gradient(90deg," + (message.author.display_name_prism_colors ?? ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"]).join(",") + ")",
                                      "--name-solid-color": message.author.display_name_color === "custom-gradient" ? message.author.display_name_gradient_start ?? "#B86BFF" : message.author.display_name_color === "pink" ? "#F72585" : message.author.display_name_color === "green" ? "#25E66B" : message.author.display_name_color === "blue" ? "#269EE5" : message.author.display_name_color === "purple" ? "#A72CF0" : message.author.display_name_color === "magenta" ? "#E60063" : message.author.display_name_color === "red" ? "#F2382E" : message.author.display_name_color === "gold" ? "#D1B11B" : "currentColor",
                                    } as React.CSSProperties}>
                                    {message.author.full_name}
                                  </button>
                                </>
                              ) : <span className="community-chat-author">Estudiante</span>}
                              {message.author?.roles?.filter((role) => role.display_as_badge).map((role) => (
                                <span key={role.role_key} className="community-role-badge"
                                  style={{ color: role.badge_color, borderColor: role.badge_color + "70" }}>{role.label}</span>
                              ))}
                              {message.author?.status_text && <span className="community-chat-level">{message.author.status_text}</span>}
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
                            <button type="button" onClick={() => void shareMessage(message)} className="community-chat-action">
                              <Share2 size={15}/><span>{copiedMessageId === message.id ? "Copiado" : "Compartir"}</span>
                            </button>
                            {message.author_id === userId && (
                              <>
                                <button type="button" onClick={() => beginEdit(message)}
                                  className="community-chat-action" aria-label="Editar mensaje"
                                  title="Editar mensaje"><Pencil size={14}/></button>
                                <button type="button" onClick={() => void deleteMessage(message)}
                                  className="community-chat-action community-chat-delete" aria-label="Eliminar mensaje"
                                  title="Eliminar mensaje"><MoreHorizontal size={17}/></button>
                              </>
                            )}
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
            <p className="community-chat-hint">Enter para enviar · Shift + Enter para nueva línea</p>
          </div>
        </section>

        {memberListOpen && (
          <aside className="community-member-sidebar" aria-label="Miembros de PeakScore Community">
            <div className="community-member-sidebar-header">
              <span>MIEMBROS</span>
              <strong>{memberCount}</strong>
            </div>
            <div className="community-member-sidebar-scroll">
              {communityMemberGroups.map((group) => (
                <section key={group.key} className="community-member-group">
                  <h2 style={{ "--member-role-color": group.color } as CSSProperties}>
                    <i/>{group.label.toLocaleUpperCase("es")} — {group.members.length}
                  </h2>
                  {group.members.map((member) => {
                    const isOnline = onlineMemberIds.includes(member.id);
                    return (
                      <button type="button" key={member.id} className={"community-member-row" + (isOnline ? "" : " community-member-offline")}
                        onMouseEnter={(event) => openMemberHoverPreview(member, event)}
                        onMouseLeave={scheduleCloseMemberHoverPreview}
                        onFocus={(event) => openMemberHoverPreview(member, { clientX: event.currentTarget.getBoundingClientRect().left, clientY: event.currentTarget.getBoundingClientRect().top })}
                        onBlur={scheduleCloseMemberHoverPreview}
                        onClick={() => void openCommunityProfile(member.id)}>
                        <span className={"community-member-avatar frame-" + (member.avatar_frame ?? "none") + " is-decoration-" + (member.avatar_decoration_id ?? "none")}>
                          {member.avatar_url
                            ? <Image src={member.avatar_url} alt="" width={30} height={30} unoptimized className="h-full w-full object-cover"/>
                            : initials(member.full_name)}
                          <i className={isOnline ? "is-online" : "is-offline"}/>
                        </span>
                        <span className="community-member-copy">
                          <strong className={"community-member-nameplate is-plate-" + (member.plate_style ?? "classic") + " is-name-style-" + (member.display_name_style ?? "classic") + " effect-" + (member.display_name_effect ?? "plain") + " color-" + (member.display_name_color ?? "default")} style={{
                            "--name-gradient-start": member.display_name_gradient_start ?? "#B86BFF",
                            "--name-gradient-end": member.display_name_gradient_end ?? "#4E9BFF",
                            "--name-prism-gradient": "linear-gradient(90deg," + (member.display_name_prism_colors ?? ["#FF9C45", "#36E58C", "#FFE05D", "#E84ABF", "#686BFF"]).join(",") + ")",
                            "--name-solid-color": member.display_name_color === "custom-gradient" ? member.display_name_gradient_start ?? "#B86BFF" : member.display_name_color === "pink" ? "#F72585" : member.display_name_color === "green" ? "#25E66B" : member.display_name_color === "blue" ? "#269EE5" : member.display_name_color === "purple" ? "#A72CF0" : member.display_name_color === "magenta" ? "#E60063" : member.display_name_color === "red" ? "#F2382E" : member.display_name_color === "gold" ? "#D1B11B" : "currentColor",
                          } as React.CSSProperties}>
                            <span>{member.full_name}</span>
                          </strong>
                          {member.status_text && <small>{member.status_text}</small>}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}
            </div>
            <div className="community-member-sidebar-footer">
              <Users size={13}/>{onlineUsers} conectados de {memberCount} miembros
            </div>
          </aside>
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
            className="ps-community-member-popout"
            style={{ left: hoverProfilePosition.left, top: hoverProfilePosition.top }}
            onMouseEnter={keepMemberHoverPreviewOpen}
            onMouseLeave={scheduleCloseMemberHoverPreview}
          >
            <article
              className={"ps-community-member-popout__card is-profile-frame-" + (hoverCommunityProfile.profileFrameId ?? "none") + " is-profile-effect-" + (hoverCommunityProfile.profileEffectId ?? "none")}
              style={{ "--community-accent": hoverCommunityProfile.accentColor ?? "#3987FF", "--community-card-color": hoverCommunityProfile.cardColor ?? "#B7D7C3", "--community-theme-gradient": "linear-gradient(180deg, " + (hoverCommunityProfile.cardColor ?? "#B7D7C3") + ", " + (hoverCommunityProfile.themeColorSecondary ?? "#8FB9A6") + ")", "--community-theme-text": communityThemeText(hoverCommunityProfile.cardColor ?? "#B7D7C3"), "--community-theme-body-text": communityThemeText(communityThemeMidpoint(hoverCommunityProfile.cardColor ?? "#B7D7C3", hoverCommunityProfile.themeColorSecondary ?? "#8FB9A6")) } as CSSProperties}
            >
              <div className="ps-community-member-popout__banner" style={{ backgroundColor: "#20242D" }}>
                <div className="ps-community-member-popout__banner-fallback">
                  <span>PEAK<span>SCORE</span></span>
                </div>
              </div>
              <div className="ps-community-member-popout__body">
                <div className="ps-community-member-popout__top">
                  <div className={"ps-community-member-popout__avatar frame-" + (hoverCommunityProfile.avatarFrame ?? "none") + " is-decoration-" + (hoverCommunityProfile.avatarDecorationId ?? "none")}>
                    {hoverCommunityProfile.avatarUrl
                      ? <Image src={hoverCommunityProfile.avatarUrl} alt="" width={88} height={88} unoptimized/>
                      : <span>{initials(hoverCommunityProfile.displayName)}</span>}
                    <i className={onlineMemberIds.includes(hoverCommunityProfile.userId) ? "is-online" : ""}/>
                  </div>
                  {hoverCommunityProfile.statusText && (
                    <div className="ps-community-member-popout__status-bubble">{hoverCommunityProfile.statusText}</div>
                  )}
                  <div className="ps-community-member-popout__actions">
                    <button type="button" onClick={() => void openCommunityProfile(hoverCommunityProfile.userId)} aria-label="Abrir perfil" title="Abrir perfil">
                      <ArrowUpRight size={16}/>
                    </button>
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
                  <CommunityAnimatedName key={hoverCommunityProfile.userId} tag="h3" value={hoverCommunityProfile.displayName} animation={hoverCommunityProfile.displayNameAnimation ?? "none"} className={"is-plate-" + (hoverCommunityProfile.plateStyle ?? "classic") + " is-name-style-" + (hoverCommunityProfile.displayNameStyle ?? "classic") + " effect-" + (hoverCommunityProfile.displayNameEffect ?? "plain") + " color-" + (hoverCommunityProfile.displayNameColor ?? "default")} style={{ "--name-gradient-start": hoverCommunityProfile.displayNameGradientStart ?? "#B86BFF", "--name-gradient-end": hoverCommunityProfile.displayNameGradientEnd ?? "#4E9BFF", "--name-prism-gradient": "linear-gradient(90deg," + (hoverCommunityProfile.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"]).join(",") + ")" } as React.CSSProperties}/>
                  <span>{hoverCommunityProfile.memberNumber ? "Miembro " + String(hoverCommunityProfile.memberNumber).padStart(4, "0") : "Miembro nuevo"}</span>
                </div>

                <div className="ps-community-member-popout__presence">
                  <i className={onlineMemberIds.includes(hoverCommunityProfile.userId) ? "is-online" : ""}/>
                  {onlineMemberIds.includes(hoverCommunityProfile.userId) ? "En línea" : "Desconectado"}
                  {hoverCommunityProfile.statusText && <span>· {hoverCommunityProfile.statusText}</span>}
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
            }
          }}>
            <section className={"ps-community-profile-dialog is-profile-frame-" + (selectedCommunityProfile.profileFrameId ?? "none") + " is-profile-effect-" + (selectedCommunityProfile.profileEffectId ?? "none")} role="dialog" aria-modal="true" aria-labelledby="ps-community-profile-title">
              <div className="ps-community-profile-banner" style={{ backgroundColor: "#20242D" }}>
                <div className="ps-community-profile-banner__fallback">
                  <span className="ps-community-brand-wordmark">PeakScore</span>
                </div>
                <div className="ps-community-profile-banner-meta" aria-hidden="true">
                  <span>PEAKSCORE <i/> COMMUNITY</span>
                  <span>MEMBER PROFILE</span>
                </div>
              </div>

              <button
                type="button"
                className="ps-community-profile-close"
                ref={communityProfileCloseRef}
                onClick={() => {
                  communityProfileRequestRef.current += 1;
                  setSelectedCommunityProfile(null);
                  setCommunityProfileLoading(false);
                  setCommunityProfileError("");
                  setCopiedCommunityProfileId(null);
                }}
                aria-label="Cerrar perfil"
              ><X size={19}/></button>

              <div
                className="ps-community-profile-body"
                style={{
                  "--community-card-color": selectedCommunityProfile.cardColor ?? "#B7D7C3",
                  "--community-theme-gradient": "linear-gradient(180deg, " + (selectedCommunityProfile.cardColor ?? "#B7D7C3") + ", " + (selectedCommunityProfile.themeColorSecondary ?? "#8FB9A6") + ")",
                  "--community-theme-text": communityThemeText(selectedCommunityProfile.cardColor ?? "#B7D7C3"),
                  "--community-theme-body-text": communityThemeText(communityThemeMidpoint(selectedCommunityProfile.cardColor ?? "#B7D7C3", selectedCommunityProfile.themeColorSecondary ?? "#8FB9A6")),
                  "--community-accent": selectedCommunityProfile.accentColor ?? "#3987FF",
                } as CSSProperties}
              >
                <div className="ps-community-profile-head">
                  <div className={"ps-community-profile-avatar frame-" + (selectedCommunityProfile.avatarFrame ?? "none") + " is-decoration-" + (selectedCommunityProfile.avatarDecorationId ?? "none")}>
                    {selectedCommunityProfile.avatarUrl
                      ? <Image src={selectedCommunityProfile.avatarUrl} alt="" width={116} height={116} unoptimized/>
                      : <span>{initials(selectedCommunityProfile.displayName)}</span>}
                    <i className={onlineMemberIds.includes(selectedCommunityProfile.userId) ? "is-online" : ""}/>
                  </div>
                  {selectedCommunityProfile.statusText && (
                    <div className="ps-community-profile-status-bubble">{selectedCommunityProfile.statusText}</div>
                  )}

                  <div className="ps-community-profile-actions">
                    {selectedCommunityProfile.isOwnProfile ? (
                      <button type="button" className="is-primary" onClick={() => setCommunityProfileStudioOpen(true)}>
                        <Pencil size={15}/> Editar perfil
                      </button>
                    ) : (
                      <button type="button" className="is-primary" onClick={() => {
                        insertMention({ user_id: selectedCommunityProfile.userId, full_name: selectedCommunityProfile.displayName, avatar_url: selectedCommunityProfile.avatarUrl, status_text: selectedCommunityProfile.statusText });
                        communityProfileRequestRef.current += 1;
                        setSelectedCommunityProfile(null);
                        setCommunityProfileLoading(false);
                        setCommunityProfileError("");
                        setCopiedCommunityProfileId(null);
                      }}>
                        <AtSign size={15}/> Mencionar
                      </button>
                    )}
                    <button
                      type="button"
                      className="ps-community-profile-copy"
                      disabled={!selectedCommunityProfile.memberNumber}
                      onClick={() => {
                        if (!selectedCommunityProfile.memberNumber) return;
                        void navigator.clipboard.writeText(String(selectedCommunityProfile.memberNumber).padStart(4, "0"))
                          .then(() => setCopiedCommunityProfileId(selectedCommunityProfile.userId))
                          .catch(() => setCopiedCommunityProfileId(null));
                      }}
                      aria-label="Copiar identificador"
                      title="Copiar identificador"
                    >
                      {copiedCommunityProfileId === selectedCommunityProfile.userId ? <Check size={15}/> : <Copy size={15}/>}
                    </button>
                  </div>
                </div>

                <div className="ps-community-profile-identity">
                  <div className="ps-community-profile-name-row">
                    <CommunityAnimatedName key={selectedCommunityProfile.userId} tag="h2" id="ps-community-profile-title" value={selectedCommunityProfile.displayName} animation={selectedCommunityProfile.displayNameAnimation ?? "none"} className={"ps-community-profile-name is-plate-" + (selectedCommunityProfile.plateStyle ?? "classic") + " is-name-style-" + (selectedCommunityProfile.displayNameStyle ?? "classic") + " effect-" + (selectedCommunityProfile.displayNameEffect ?? "plain") + " color-" + (selectedCommunityProfile.displayNameColor ?? "default")} style={{ "--name-gradient-start": selectedCommunityProfile.displayNameGradientStart ?? "#B86BFF", "--name-gradient-end": selectedCommunityProfile.displayNameGradientEnd ?? "#4E9BFF", "--name-prism-gradient": "linear-gradient(90deg," + (selectedCommunityProfile.displayNamePrismColors ?? ["#FFBD62", "#FFF27D", "#71E7C0", "#79BAFF", "#D19AFF"]).join(",") + ")" } as React.CSSProperties}/>
                    <span className="ps-community-profile-tag">{selectedCommunityProfile.memberNumber ? "Miembro " + String(selectedCommunityProfile.memberNumber).padStart(4, "0") : "Miembro nuevo"}</span>
                  </div>

                  <div className="ps-community-profile-presence">
                    <i className={onlineMemberIds.includes(selectedCommunityProfile.userId) ? "is-online" : ""}/>
                    {onlineMemberIds.includes(selectedCommunityProfile.userId) ? "En línea" : "Desconectado"}
                    {selectedCommunityProfile.pronouns && <span>· {selectedCommunityProfile.pronouns}</span>}
                  </div>

                  {selectedCommunityProfile.statusText && (
                    <div className="ps-community-profile-status">{selectedCommunityProfile.statusText}</div>
                  )}
                </div>

                {selectedCommunityProfile.roles.length > 0 && (
                  <section className="ps-community-profile-roles-section" aria-label="Roles de comunidad">
                    <span>ROLES DE COMUNIDAD</span>
                    <div className="ps-community-profile-roles">
                    {selectedCommunityProfile.roles.map((role) => (
                      <span key={role.roleKey} style={{
                        "--role-color": /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#aeb5c0",
                      } as CSSProperties}>{role.label}</span>
                    ))}
                    </div>
                  </section>
                )}

                <div className="ps-community-profile-divider"/>

                <div className="ps-community-profile-details">
                  <section className="ps-community-profile-about">
                    <span>SOBRE MÍ</span>
                    <p>{selectedCommunityProfile.about || "Este perfil todavía no tiene una biografía."}</p>
                  </section>

                  <aside className="ps-community-profile-facts">
                    <div>
                      <span>MIEMBRO DESDE</span>
                      <strong>{selectedCommunityProfile.joinedAt ? new Date(selectedCommunityProfile.joinedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "Fecha no disponible"}</strong>
                    </div>
                    <div>
                      <span>IDENTIFICADOR</span>
                      <strong>{selectedCommunityProfile.memberNumber ? "Miembro " + String(selectedCommunityProfile.memberNumber).padStart(4, "0") : "No asignado"}</strong>
                    </div>
                    <div>
                      <span>PRESENCIA</span>
                      <strong>{onlineMemberIds.includes(selectedCommunityProfile.userId) ? "En línea" : "Desconectado"}</strong>
                    </div>
                  </aside>
                </div>

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
