"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ShieldCheck, LockKeyhole,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Heart, Share2, MoreHorizontal, Layers3,
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
  id: string; full_name: string; avatar_url: string | null; level: number; xp: number;
  roles?: CommunityRole[];
};
type CommunityMessageMetrics = {
  message_id: string;
  reaction_count: number;
  comment_count: number;
  viewer_liked: boolean;
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
  channel: Channel | null; reaction_count: number; viewer_liked: boolean; comment_count: number;
};
type Comment = {
  id: string; message_id: string; parent_comment_id: string | null;
  author_id: string; body: string; created_at: string; author: PublicProfile | null;
};

const COMMENT_PAGE_SIZE = 100;
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
function commentTree(comments: Comment[]) {
  return comments.filter((comment) => !comment.parent_comment_id).map((root) => ({
    ...root,
    replies: comments.filter((comment) => comment.parent_comment_id === root.id),
  }));
}

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [commentCursor, setCommentCursor] = useState<{ created_at: string; id: string } | null>(null);
  const [loadingOlderComments, setLoadingOlderComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const groupedChannels = useMemo(() => CATEGORIES.map((category) => ({
    category,
    channels: channels.filter((channel) => channel.category === category)
      .sort((a, b) => a.position - b.position),
  })).filter((group) => group.channels.length), [channels]);

  const refreshStats = useCallback(async () => {
    const { count: members } = await supabase
      .from("community_public_profiles")
      .select("id", { count: "exact", head: true });
    setMemberCount(members ?? 0);
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    const { data, error: queryError } = await supabase
      .from("community_messages")
      .select("id,channel_id,author_id,body,created_at,edited_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (queryError) {
      setError("No pudimos cargar las publicaciones. Vuelve a intentarlo.");
      return;
    }

    const rows = (data ?? []) as Omit<Message, "author" | "channel" | "reaction_count" | "viewer_liked" | "comment_count">[];
    if (!rows.length) {
      setMessages([]);
      setError("");
      return;
    }
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const messageIds = rows.map((row) => row.id);
    const [
      { data: authors, error: authorsError },
      { data: publicRoleBadges, error: badgeError },
      { data: metrics, error: metricsError },
    ] = await Promise.all([
      supabase.from("community_public_profiles")
        .select("id,full_name,avatar_url,level,xp")
        .in("id", authorIds),
      supabase.from("community_public_role_badges")
        .select("user_id,role_key,label,badge_color")
        .in("user_id", authorIds),
      supabase.rpc("get_community_message_metrics", { p_message_ids: messageIds }),
    ]);

    // Message delivery must not depend on optional schema additions. The public
    // badge projection and aggregate-metrics RPC are deployed separately; until
    // both exist, keep the chat readable and simply omit those enhancements.
    if (authorsError || badgeError || metricsError) {
      console.warn("[PeakScore Community] Optional profile/badge/metrics data is unavailable.", {
        profiles: authorsError?.code ?? null,
        publicBadges: badgeError?.code ?? null,
        metrics: metricsError?.code ?? null,
      });
    }

    const authorMap = new Map<string, PublicProfile>(
      ((authors ?? []) as PublicProfile[]).map((author) => [author.id, author]),
    );
    // Public badges come from a minimal read-only projection. Never enumerate
    // other users through the private community_member_roles assignment table.
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

    setMessages(rows.slice().reverse().map((row) => {
      const itemMetrics = metricsByMessage.get(row.id);
      return {
        ...row,
        author: authorMap.has(row.author_id)
          ? { ...authorMap.get(row.author_id)!, roles: roleMap.get(row.author_id) ?? [] }
          : null,
        channel: channels.find((channel) => channel.id === row.channel_id) ?? null,
        reaction_count: itemMetrics?.reaction_count ?? 0,
        viewer_liked: itemMetrics?.viewer_liked ?? false,
        comment_count: itemMetrics?.comment_count ?? 0,
      };
    }));
    setError("");
  }, [channels]);

  const loadComments = useCallback(async (
    messageId: string,
    before?: { created_at: string; id: string } | null,
    append = false,
  ) => {
    let query = supabase.from("community_message_comments")
      .select("id,message_id,parent_comment_id,author_id,body,created_at")
      .eq("message_id", messageId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(COMMENT_PAGE_SIZE);

    if (before) {
      query = query.or(
        "created_at.lt." + before.created_at
        + ",and(created_at.eq." + before.created_at + ",id.lt." + before.id + ")",
      );
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError("No pudimos cargar los comentarios.");
      return;
    }

    const pageRows = (data ?? []) as Omit<Comment, "author">[];
    setCommentHasMore(pageRows.length === COMMENT_PAGE_SIZE);
    const oldestRow = pageRows[pageRows.length - 1];
    setCommentCursor(oldestRow ? { created_at: oldestRow.created_at, id: oldestRow.id } : before ?? null);

    // Include any root comments referenced by replies in this page. Without this,
    // keyset pagination could render orphan replies when their root is older.
    const pageIds = new Set(pageRows.map((row) => row.id));
    const missingRootIds = Array.from(new Set(
      pageRows
        .map((row) => row.parent_comment_id)
        .filter((id): id is string => id !== null && !pageIds.has(id)),
    ));
    const { data: parentRows, error: parentError } = missingRootIds.length
      ? await supabase.from("community_message_comments")
          .select("id,message_id,parent_comment_id,author_id,body,created_at")
          .eq("message_id", messageId)
          .is("parent_comment_id", null)
          .in("id", missingRootIds)
      : { data: [] as Omit<Comment, "author">[], error: null };

    if (parentError) {
      setError("No se pudieron recuperar los comentarios principales de este hilo.");
      return;
    }

    const rows = [...pageRows, ...((parentRows ?? []) as Omit<Comment, "author">[])]
      .filter((row, index, all) => all.findIndex((item) => item.id === row.id) === index);
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const { data: authors, error: authorsError } = authorIds.length
      ? await supabase.from("community_public_profiles")
          .select("id,full_name,avatar_url,level,xp").in("id", authorIds)
      : { data: [] as PublicProfile[], error: null };

    if (authorsError) {
      setError("No se pudieron cargar los perfiles de los comentarios.");
      return;
    }

    const authorMap = new Map<string, PublicProfile>(
      ((authors ?? []) as PublicProfile[]).map((author) => [author.id, author]),
    );
    const hydrated = rows.map((row) => ({
      ...row,
      author: authorMap.get(row.author_id) ?? null,
    })).sort((a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );

    setComments((current) => {
      const merged = append ? [...current, ...hydrated] : hydrated;
      const unique = new Map(merged.map((comment) => [comment.id, comment]));
      return Array.from(unique.values()).sort((a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
      );
    });
    setError("");
  }, []);

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
        supabase.from("community_public_profiles")
          .select("id,full_name,avatar_url,level,xp").eq("id", user.id).maybeSingle(),
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
      setProfile(currentProfile ? { ...(currentProfile as PublicProfile), roles: currentRoles } : null);
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
      setOnlineUsers(Object.keys(presence.presenceState()).length);
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
    setCommentsFor(null);
    setReplyTo(null);
    window.history.replaceState(null, "", "/comunidad?channel=" + channel.slug);
  }

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || !activeChannel || !userId || sending || activeChannel.is_read_only) return;
    if (body.length > 2000) {
      setError("La publicación no puede superar los 2.000 caracteres.");
      return;
    }
    setSending(true);
    setError("");
    const { error: insertError } = await supabase.from("community_messages")
      .insert({ channel_id: activeChannel.id, author_id: userId, body });
    if (insertError) {
      setError(insertError.message.includes("row-level security")
        ? "Este canal no permite publicar con tu cuenta."
        : "No se pudo publicar. Inténtalo de nuevo.");
    } else {
      setDraft("");
      shouldStickToBottomRef.current = true;
      await loadMessages(activeChannel.id);
      await refreshStats();
    }
    setSending(false);
  }

  async function toggleReaction(message: Message) {
    if (!userId) return;
    if (message.viewer_liked) {
      const { error: removeError } = await supabase.from("community_reactions")
        .delete()
        .eq("message_id", message.id)
        .eq("user_id", userId)
        .eq("reaction", "like");
      if (removeError) setError("No se pudo quitar la reacción.");
    } else {
      const { error: addError } = await supabase.from("community_reactions")
        .insert({ message_id: message.id, user_id: userId, reaction: "like" });
      if (addError && !addError.message.toLowerCase().includes("duplicate")) {
        setError("No se pudo registrar la reacción.");
      }
    }
    await loadMessages(message.channel_id);
  }

  async function openComments(messageId: string) {
    if (commentsFor === messageId) {
      setCommentsFor(null);
      setComments([]);
      setCommentHasMore(false);
      setCommentCursor(null);
      setReplyTo(null);
      return;
    }
    setCommentsFor(messageId);
    setComments([]);
    setCommentHasMore(false);
    setCommentCursor(null);
    setReplyTo(null);
    await loadComments(messageId);
  }

  async function loadOlderComments(messageId: string) {
    if (!commentHasMore || !commentCursor || loadingOlderComments) return;
    setLoadingOlderComments(true);
    await loadComments(messageId, commentCursor, true);
    setLoadingOlderComments(false);
  }

  async function sendComment(event: FormEvent<HTMLFormElement>, messageId: string) {
    event.preventDefault();
    const body = commentDraft.trim();
    if (!body || !userId || commentSending) return;
    if (body.length > 1200) {
      setError("El comentario no puede superar los 1.200 caracteres.");
      return;
    }
    setCommentSending(true);
    const { error: insertError } = await supabase.from("community_message_comments").insert({
      message_id: messageId, parent_comment_id: replyTo, author_id: userId, body,
    });
    if (insertError) {
      setError("No se pudo publicar el comentario.");
    } else {
      setCommentDraft("");
      setReplyTo(null);
      await loadComments(messageId);
      if (activeChannelId) await loadMessages(activeChannelId);
    }
    setCommentSending(false);
  }

  async function deleteMessage(message: Message) {
    if (message.author_id !== userId) return;
    const { error: deleteError } = await supabase.from("community_messages").delete().eq("id", message.id);
    if (deleteError) setError("No se pudo eliminar la publicación.");
    else {
      await loadMessages(message.channel_id);
      await refreshStats();
    }
  }

  async function deleteComment(comment: Comment) {
    if (comment.author_id !== userId) return;
    const { error: deleteError } = await supabase.from("community_message_comments").delete().eq("id", comment.id);
    if (deleteError) setError("No se pudo eliminar el comentario.");
    else if (commentsFor) {
      await loadComments(commentsFor);
      if (activeChannelId) await loadMessages(activeChannelId);
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

        <aside className={"community-sidebar " + (mobileChannelsOpen ? "community-sidebar-open" : "")}>
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

          <div className="community-user-panel">
            <div className="community-avatar community-user-avatar">
              {profile?.avatar_url
                ? <Image src={profile.avatar_url} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover"/>
                : initials(profile?.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{profile?.full_name || "Estudiante PeakScore"}</p>
              <p className="community-user-presence"><span/>Nivel {profile?.level ?? 1}</p>
            </div>
            {profile?.roles?.some((role) => role.display_as_badge) && (
              <ShieldCheck size={16} className="community-user-role" aria-label="Miembro verificado"/>
            )}
          </div>
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
                onClick={() => setMobileChannelsOpen(true)} aria-label="Abrir canales"><Menu size={20}/></button>
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
                  const myLike = message.viewer_liked;
                  const commentsOpen = commentsFor === message.id;
                  const roots = commentTree(comments.filter((comment) => comment.message_id === message.id));
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
                            <div className="community-avatar community-chat-avatar">
                              {message.author?.avatar_url
                                ? <Image src={message.author.avatar_url} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover"/>
                                : initials(message.author?.full_name)}
                            </div>
                          )}
                        </div>
                        <div className="community-chat-message-content">
                          {!groupedWithPrevious && (
                            <div className="community-chat-message-meta">
                              <span className="community-chat-author">{message.author?.full_name ?? "Estudiante"}</span>
                              {message.author?.roles?.filter((role) => role.display_as_badge).map((role) => (
                                <span key={role.role_key} className="community-role-badge"
                                  style={{ color: role.badge_color, borderColor: role.badge_color + "70" }}>{role.label}</span>
                              ))}
                              {message.author?.level && <span className="community-chat-level">NV {message.author.level}</span>}
                              <time dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
                            </div>
                          )}
                          <p className="community-chat-message-body">{message.body}</p>

                          <div className="community-chat-message-actions">
                            <button type="button" onClick={() => void toggleReaction(message)}
                              className={"community-chat-action " + (myLike ? "community-chat-action-active" : "")}
                              aria-pressed={myLike} aria-label={myLike ? "Quitar reacción" : "Reaccionar"}>
                              <Heart size={15} fill={myLike ? "currentColor" : "none"}/><span>{message.reaction_count}</span>
                            </button>
                            <button type="button" onClick={() => void openComments(message.id)}
                              className={"community-chat-action " + (commentsOpen ? "community-chat-action-active" : "")}>
                              <MessageCircle size={15}/><span>{message.comment_count} respuestas</span>
                            </button>
                            <button type="button" onClick={() => void shareMessage(message)} className="community-chat-action">
                              <Share2 size={15}/><span>{copiedMessageId === message.id ? "Copiado" : "Compartir"}</span>
                            </button>
                            {message.author_id === userId && (
                              <button type="button" onClick={() => void deleteMessage(message)}
                                className="community-chat-action community-chat-delete" aria-label="Eliminar mensaje"
                                title="Eliminar mensaje"><MoreHorizontal size={17}/></button>
                            )}
                          </div>

                          {commentsOpen && (
                            <div className="community-chat-thread">
                              <div className="community-chat-thread-heading">
                                <span>Respuestas</span>
                                <button type="button" onClick={() => setCommentsFor(null)} aria-label="Cerrar respuestas"><X size={14}/></button>
                              </div>
                              <div className="community-chat-thread-list">
                                {roots.map((comment) => (
                                  <div key={comment.id} className="community-chat-comment">
                                    <div className="community-avatar community-chat-comment-avatar">
                                      {comment.author?.avatar_url
                                        ? <Image src={comment.author.avatar_url} alt="" width={30} height={30} unoptimized className="h-full w-full object-cover"/>
                                        : initials(comment.author?.full_name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="community-chat-message-meta">
                                        <span className="community-chat-author">{comment.author?.full_name ?? "Estudiante"}</span>
                                        <time>{timeLabel(comment.created_at)}</time>
                                      </div>
                                      <p className="community-chat-message-body">{comment.body}</p>
                                      <div className="community-chat-comment-actions">
                                        <button type="button" onClick={() => setReplyTo(comment.id)}>Responder</button>
                                        {comment.author_id === userId && (
                                          <button type="button" onClick={() => void deleteComment(comment)}>Eliminar</button>
                                        )}
                                      </div>
                                      {comment.replies.length > 0 && (
                                        <div className="community-chat-replies">
                                          {comment.replies.map((reply) => (
                                            <div key={reply.id} className="community-chat-comment">
                                              <div className="community-avatar community-chat-comment-avatar">
                                                {reply.author?.avatar_url
                                                  ? <Image src={reply.author.avatar_url} alt="" width={30} height={30} unoptimized className="h-full w-full object-cover"/>
                                                  : initials(reply.author?.full_name)}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="community-chat-message-meta">
                                                  <span className="community-chat-author">{reply.author?.full_name ?? "Estudiante"}</span>
                                                  <time>{timeLabel(reply.created_at)}</time>
                                                </div>
                                                <p className="community-chat-message-body">{reply.body}</p>
                                                {reply.author_id === userId && (
                                                  <button type="button" className="community-chat-comment-delete"
                                                    onClick={() => void deleteComment(reply)}>Eliminar</button>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {roots.length === 0 && (
                                  <p className="community-chat-empty-thread">Todavía no hay respuestas. Inicia la conversación.</p>
                                )}
                              </div>
                              {commentHasMore && (
                                <button type="button" disabled={loadingOlderComments}
                                  onClick={() => void loadOlderComments(message.id)}
                                  className="community-chat-load-more">
                                  {loadingOlderComments ? "Cargando..." : "Cargar respuestas anteriores"}
                                </button>
                              )}
                              <form onSubmit={(event) => void sendComment(event, message.id)} className="community-chat-reply-form">
                                {replyTo && (
                                  <div className="community-chat-replying">
                                    <span>Respondiendo a un comentario</span>
                                    <button type="button" onClick={() => setReplyTo(null)}>Cancelar</button>
                                  </div>
                                )}
                                <textarea value={commentDraft}
                                  onChange={(event) => setCommentDraft(event.target.value.slice(0, 1200))}
                                  rows={2} placeholder="Escribe una respuesta..." className="community-composer-input"/>
                                <button type="submit" disabled={!commentDraft.trim() || commentSending}
                                  className="community-chat-send-small" aria-label="Enviar respuesta"><Send size={15}/></button>
                              </form>
                            </div>
                          )}
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
            <form onSubmit={(event) => void sendMessage(event)} className="community-chat-composer">
              <button type="button" className="community-chat-add" aria-label="Añadir contenido" disabled>
                <span>+</span>
              </button>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if (draft.trim() && !sending) void sendMessage();
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
                disabled={!draft.trim() || sending || activeChannel?.is_read_only}
                aria-label="Enviar mensaje"><Send size={17}/></button>
            </form>
            <p className="community-chat-hint">Enter para enviar · Shift + Enter para nueva línea</p>
          </div>
        </section>
      </div>
    </main>
  );
}
