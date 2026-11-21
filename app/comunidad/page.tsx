"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ShieldCheck, LockKeyhole,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Share2, MoreHorizontal, Layers3, SmilePlus, Reply, FileImage, Pencil, Check, AtSign,
  UserRound, CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Channel = {
  id: string; slug: string; name: string; description: string;
  category: string; position: number; is_read_only: boolean; is_private: boolean;
};
type CommunityRole = {
  role_key: string; label: string; badge_color: string; display_as_badge: boolean;
};
type PublicProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  status_text: string;
  roles?: CommunityRole[];
};
type CommunityMemberProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  pronouns: string;
  statusText: string;
  about: string;
  joinedAt: string;
  roles: { roleKey: string; label: string; badgeColor: string }[];
  isOwnProfile: boolean;
  isOnline?: boolean;
};
type CommunityProfileDraft = {
  displayName: string;
  pronouns: string;
  statusText: string;
  about: string;
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
  created_at: string; edited_at: string | null; author: PublicProfile | null;
  channel: Channel | null;
  reply_to_message_id: string | null;
  attachment_path: string | null;
  attachment_alt: string | null;
  attachment_url: string | null;
  reaction_count: number;
  reaction_counts: Record<string, number>;
  viewer_reactions: string[];
  reply_count: number;
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

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [selectedCommunityProfile, setSelectedCommunityProfile] = useState<CommunityMemberProfile | null>(null);
  const [communityProfileLoading, setCommunityProfileLoading] = useState(false);
  const [communityProfileEditing, setCommunityProfileEditing] = useState(false);
  const [communityProfileSaving, setCommunityProfileSaving] = useState(false);
  const [communityProfileError, setCommunityProfileError] = useState("");
  const [communityProfileDraft, setCommunityProfileDraft] = useState<CommunityProfileDraft>({
    displayName: "", pronouns: "", statusText: "", about: "",
  });
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
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const editComposerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const communityAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

  async function openCommunityProfile(memberId: string) {
    setCommunityProfileLoading(true);
    setCommunityProfileError("");
    setCommunityProfileEditing(false);
    setSelectedCommunityProfile(null);
    try {
      const response = await fetch("/api/community/profile/" + memberId, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { profile?: CommunityMemberProfile; error?: string } | null;
      if (!response.ok || !payload?.profile) {
        setCommunityProfileError(payload?.error ?? "No se pudo abrir este perfil.");
        return;
      }
      setSelectedCommunityProfile({
        ...payload.profile,
        isOnline: onlineMemberIds.includes(payload.profile.userId),
      });
      setCommunityProfileDraft({
        displayName: payload.profile.displayName,
        pronouns: payload.profile.pronouns,
        statusText: payload.profile.statusText,
        about: payload.profile.about,
      });
    } catch {
      setCommunityProfileError("No se pudo conectar con el perfil comunitario.");
    } finally {
      setCommunityProfileLoading(false);
    }
  }

  useEffect(() => {
    setSelectedCommunityProfile((current) => current
      ? { ...current, isOnline: onlineMemberIds.includes(current.userId) }
      : current);
  }, [onlineMemberIds]);

  function startCommunityProfileEdit() {
    if (!selectedCommunityProfile?.isOwnProfile) return;
    setCommunityProfileDraft({
      displayName: selectedCommunityProfile.displayName,
      pronouns: selectedCommunityProfile.pronouns,
      statusText: selectedCommunityProfile.statusText,
      about: selectedCommunityProfile.about,
    });
    setCommunityProfileError("");
    setCommunityProfileEditing(true);
  }

  async function saveCommunityProfile() {
    if (!selectedCommunityProfile?.isOwnProfile || communityProfileSaving) return;
    setCommunityProfileSaving(true);
    setCommunityProfileError("");
    try {
      const response = await fetch("/api/community/profile/" + selectedCommunityProfile.userId, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(communityProfileDraft),
      });
      const payload = await response.json().catch(() => null) as { profile?: Partial<CommunityMemberProfile>; error?: string } | null;
      if (!response.ok || !payload?.profile) {
        setCommunityProfileError(payload?.error ?? "No se pudo guardar el perfil.");
        return;
      }
      const updated = { ...selectedCommunityProfile, ...payload.profile };
      setSelectedCommunityProfile(updated);
      setCommunityProfileEditing(false);
      if (userId === updated.userId) {
        setProfile((current) => current ? {
          ...current,
          full_name: updated.displayName,
          status_text: updated.statusText,
        } : current);
        await loadMessages(activeChannelId ?? "");
      }
    } catch {
      setCommunityProfileError("No se pudo guardar el perfil. Inténtalo de nuevo.");
    } finally {
      setCommunityProfileSaving(false);
    }
  }

  async function uploadCommunityAvatar(file: File) {
    if (!selectedCommunityProfile?.isOwnProfile) return;
    if (file.size > 5 * 1024 * 1024) {
      setCommunityProfileError("La imagen debe pesar máximo 5 MB.");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    setCommunityProfileError("");
    try {
      const response = await fetch("/api/community/profile/" + selectedCommunityProfile.userId, {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json().catch(() => null) as { avatarUrl?: string | null; error?: string } | null;
      if (!response.ok) {
        setCommunityProfileError(payload?.error ?? "No se pudo actualizar el avatar.");
        return;
      }
      setSelectedCommunityProfile((current) => current ? { ...current, avatarUrl: payload?.avatarUrl ?? null } : current);
      setProfile((current) => current ? { ...current, avatar_url: payload?.avatarUrl ?? null } : current);
      await loadMessages(activeChannelId ?? "");
    } catch {
      setCommunityProfileError("No se pudo subir la imagen.");
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
        setSelectedCommunityProfile(null);
        setCommunityProfileEditing(false);
        setCommunityProfileError("");
      }
    }
    window.addEventListener("keydown", handleProfileKeyDown);
    return () => window.removeEventListener("keydown", handleProfileKeyDown);
  }, [selectedCommunityProfile, communityProfileLoading, communityProfileError]);

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
        .select("user_id,display_name,avatar_path,status_text")
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

    const canonicalMentionNames = Object.fromEntries(
      ((mentionProfilesResult.error ? [] : mentionProfilesResult.data ?? []) as Array<{ user_id: string; full_name: string }>)
        .map((mention) => [mention.user_id, mention.full_name]),
    ) as Record<string, string>;
    setMentionDisplayNames(canonicalMentionNames);

    const authorRows = (authors ?? []) as Array<{
      user_id: string; display_name: string; avatar_path: string | null; status_text: string | null;
    }>;
    const authorMap = new Map<string, PublicProfile>(
      authorRows.map((author) => [author.user_id, {
        id: author.user_id,
        full_name: author.display_name,
        avatar_url: author.avatar_path
          ? supabase.storage.from("community-profile-avatars").getPublicUrl(author.avatar_path).data.publicUrl
          : null,
        status_text: author.status_text ?? "",
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

    setMessages(rows.slice().reverse().map((row) => {
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
    }));
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
          .select("user_id,display_name,avatar_path,status_text").eq("user_id", user.id).maybeSingle(),
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
        status_text: currentProfile.status_text ?? "",
        roles: currentRoles,
      } : null);
      const list = (channelData ?? []) as Channel[];
      setChannels(list);
      await refreshStats();
      if (!alive) return;
      const requested = new URLSearchParams(window.location.search).get("channel");
      const selected = list.find((item) => item.slug === requested)
        ?? list.find((item) => item.slug === "general") ?? list[0];
      if (selected) setActiveChannelId(selected.id);
      setLoading(false);
    }
    void initialize();
    return () => { alive = false; };
  }, [router, refreshStats]);

  useEffect(() => {
    if (!activeChannelId || !userId) return;
    const channelId = activeChannelId;
    // Defer the fetch out of the effect body: loadMessages updates React state
    // after the Supabase request resolves, rather than synchronously in effect setup.
    void Promise.resolve().then(() => loadMessages(channelId));
    const messageSubscription = supabase.channel("community-messages-" + channelId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_messages",
        filter: "channel_id=eq." + channelId,
      }, () => {
        void loadMessages(channelId);
        void refreshStats();
      })
      .subscribe();
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
      void supabase.removeChannel(messageSubscription);
      void supabase.removeChannel(presence);
    };
  }, [activeChannelId, userId, loadMessages, refreshStats]);

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
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function selectChannel(channel: Channel) {
    shouldStickToBottomRef.current = true;
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
    await loadMessages(message.channel_id);
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if ((!body && !attachmentFile) || !activeChannel || !userId || sending || uploadingAttachment || activeChannel.is_read_only) return;
    if (body.length > 2000) {
      setError("El mensaje no puede superar los 2.000 caracteres.");
      return;
    }

    setSending(true);
    setUploadingAttachment(Boolean(attachmentFile));
    setError("");

    try {
      if (attachmentFile) {
        const form = new FormData();
        form.set("channel_id", activeChannel.id);
        form.set("body", body);
        form.set("file", attachmentFile);
        form.set("attachment_alt", attachmentFile.name.slice(0, 240));
        if (replyingTo) form.set("reply_to_message_id", replyingTo.id);

        const response = await fetch("/api/community/attachments", {
          method: "POST",
          body: form,
          credentials: "same-origin",
        });
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) {
          setError(payload?.error ?? "No se pudo enviar la imagen.");
          return;
        }
      } else {
        const insertPayload: {
          channel_id: string; author_id: string; body: string; reply_to_message_id?: string;
        } = { channel_id: activeChannel.id, author_id: userId, body };
        if (replyingTo) insertPayload.reply_to_message_id = replyingTo.id;

        const { error: insertError } = await supabase.from("community_messages").insert(insertPayload);
        if (insertError) {
          setError(replyingTo && ["42703", "PGRST204"].includes(insertError.code ?? "")
            ? "Las respuestas directas estarán disponibles cuando se aplique la migración de chat."
            : insertError.message.includes("row-level security")
              ? "Este canal no permite publicar con tu cuenta."
              : "No se pudo enviar el mensaje. Inténtalo de nuevo.");
          return;
        }
      }

      setDraft("");
      setAttachmentFile(null);
      setReplyingTo(null);
      setReactionPickerFor(null);
      shouldStickToBottomRef.current = true;
      await loadMessages(activeChannel.id);
      await refreshStats();
    } catch {
      setError("No se pudo completar el envío. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  }

  async function toggleReaction(message: Message, reaction: string) {
    if (!userId || !CHAT_REACTIONS.includes(reaction)) return;
    const alreadyReacted = message.viewer_reactions.includes(reaction);
    if (alreadyReacted) {
      const { error: removeError } = await supabase.from("community_reactions")
        .delete()
        .eq("message_id", message.id)
        .eq("user_id", userId)
        .eq("reaction", reaction);
      if (removeError) setError("No se pudo quitar la reacción.");
    } else {
      const { error: addError } = await supabase.from("community_reactions")
        .insert({ message_id: message.id, user_id: userId, reaction });
      if (addError && !addError.message.toLowerCase().includes("duplicate")) {
        setError(["23514", "22P02"].includes(addError.code ?? "")
          ? "Las reacciones nuevas estarán disponibles cuando se aplique la migración de chat."
          : "No se pudo registrar la reacción.");
      }
    }
    setReactionPickerFor(null);
    await loadMessages(message.channel_id);
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
      await loadMessages(message.channel_id);
      await refreshStats();
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
                        className={"community-chat-message group " + (groupedWithPrevious ? "community-chat-message-grouped" : "")}>
                        <div className="community-chat-avatar-column">
                          {groupedWithPrevious ? (
                            <time className="community-chat-hover-time" dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
                          ) : (
                            <div className="community-chat-avatar-frame-wrap">
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
                                    className="community-chat-author community-chat-author-link">
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

        {(selectedCommunityProfile || communityProfileLoading || communityProfileError) && (
          <div className="community-profile-overlay" onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCommunityProfile(null);
              setCommunityProfileEditing(false);
              setCommunityProfileError("");
            }
          }}>
            <section className="community-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="community-profile-title">
              <header className="community-profile-dialog-header">
                <div><span>PEAKSCORE COMMUNITY</span><strong>MEMBER PROFILE</strong></div>
                <button type="button" onClick={() => {
                  setSelectedCommunityProfile(null);
                  setCommunityProfileEditing(false);
                  setCommunityProfileError("");
                }} aria-label="Cerrar perfil"><X size={18}/></button>
              </header>
              {communityProfileLoading ? (
                <div className="community-profile-loading"><span className="community-profile-spinner"/><p>Cargando perfil comunitario...</p></div>
              ) : selectedCommunityProfile ? (
                <>
                  <div className="community-profile-cover">
                    <span>COMMUNITY / MEMBER CARD</span>
                    <strong>PS<span>—</span>01</strong>
                  </div>
                  <div className="community-profile-main">
                    <div className="community-profile-avatar-row">
                      <div className="community-profile-avatar">
                        {selectedCommunityProfile.avatarUrl
                          ? <Image src={selectedCommunityProfile.avatarUrl} alt="" width={88} height={88} unoptimized className="h-full w-full object-cover"/>
                          : <span>{initials(selectedCommunityProfile.displayName)}</span>}
                      </div>
                      {selectedCommunityProfile.isOwnProfile && (
                        <>
                          <input ref={communityAvatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                            aria-label="Cambiar foto de perfil comunitario"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void uploadCommunityAvatar(file);
                              event.target.value = "";
                            }}/>
                          <button type="button" className="community-profile-avatar-edit"
                            onClick={() => communityAvatarInputRef.current?.click()}>
                            <Pencil size={13}/> Cambiar foto
                          </button>
                        </>
                      )}
                    </div>
                    {communityProfileEditing ? (
                      <div className="community-profile-edit-form">
                        <label>Nombre visible<input maxLength={32} value={communityProfileDraft.displayName}
                          onChange={(event) => setCommunityProfileDraft((draft) => ({ ...draft, displayName: event.target.value }))}/></label>
                        <label>Pronombres<input maxLength={32} value={communityProfileDraft.pronouns}
                          onChange={(event) => setCommunityProfileDraft((draft) => ({ ...draft, pronouns: event.target.value }))} placeholder="Opcional"/></label>
                        <label>Estado<input maxLength={80} value={communityProfileDraft.statusText}
                          onChange={(event) => setCommunityProfileDraft((draft) => ({ ...draft, statusText: event.target.value }))} placeholder="¿Qué estás haciendo?"/></label>
                        <label>Sobre mí<textarea maxLength={280} rows={4} value={communityProfileDraft.about}
                          onChange={(event) => setCommunityProfileDraft((draft) => ({ ...draft, about: event.target.value }))} placeholder="Cuéntale algo a la comunidad..."/></label>
                        <div className="community-profile-char-count">{communityProfileDraft.about.length}/280</div>
                      </div>
                    ) : (
                      <>
                        <div className="community-profile-name-row">
                          <div><h2 id="community-profile-title">{selectedCommunityProfile.displayName}</h2>
                            {selectedCommunityProfile.pronouns && <span>{selectedCommunityProfile.pronouns}</span>}
                          </div>
                          {selectedCommunityProfile.isOwnProfile && (
                            <button type="button" className="community-profile-edit-button" onClick={startCommunityProfileEdit}>
                              <Pencil size={13}/> Editar perfil
                            </button>
                          )}
                        </div>
                        <div className={"community-profile-presence" + (selectedCommunityProfile.isOnline ? " is-online" : "")}>
                          <i/>{selectedCommunityProfile.isOnline ? "En línea" : "Desconectado"}
                        </div>
                        {selectedCommunityProfile.roles.length > 0 && (
                          <div className="community-profile-roles">
                            {selectedCommunityProfile.roles.map((role) => (
                              <span key={role.roleKey} style={{
                                color: /^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#39d6f0",
                                borderColor: (/^#[0-9a-f]{6}$/i.test(role.badgeColor) ? role.badgeColor : "#39d6f0") + "70",
                              }}>{role.label}</span>
                            ))}
                          </div>
                        )}
                        {selectedCommunityProfile.statusText && (
                          <div className={"community-profile-status" + (selectedCommunityProfile.isOnline ? " is-online" : "")}><i/>{selectedCommunityProfile.statusText}</div>
                        )}
                        <div className="community-profile-about">
                          <span>SOBRE MÍ</span>
                          <p>{selectedCommunityProfile.about || "Este miembro todavía no ha añadido una descripción."}</p>
                        </div>
                        <div className="community-profile-joined">
                          <CalendarDays size={14}/> Miembro desde {new Date(selectedCommunityProfile.joinedAt).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
                        </div>
                      </>
                    )}
                    {communityProfileError && <p className="community-profile-error" role="alert">{communityProfileError}</p>}
                    {communityProfileEditing && (
                      <div className="community-profile-edit-actions">
                        <button type="button" onClick={() => setCommunityProfileEditing(false)} disabled={communityProfileSaving}>Cancelar</button>
                        <button type="button" onClick={() => void saveCommunityProfile()} disabled={communityProfileSaving || communityProfileDraft.displayName.trim().length < 2}>
                          {communityProfileSaving ? "Guardando..." : <><Check size={14}/> Guardar cambios</>}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="community-profile-error" role="alert">{communityProfileError || "No se pudo cargar este perfil."}</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
