"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ShieldCheck, LockKeyhole,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Share2, MoreHorizontal, Layers3, SmilePlus, Reply, FileImage,
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
export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [error, setError] = useState("");
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const feedScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );
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
    const extendedColumns = "id,channel_id,author_id,body,created_at,edited_at,reply_to_message_id,attachment_path,attachment_alt";
    const legacyColumns = "id,channel_id,author_id,body,created_at,edited_at";

    let { data, error: queryError } = await supabase
      .from("community_messages")
      .select(extendedColumns)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(60);

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
      data = legacyResult.data;
      queryError = legacyResult.error;
      hasExtendedSchema = false;
    }

    if (queryError) {
      setError("No pudimos cargar los mensajes. Vuelve a intentarlo.");
      return;
    }

    const rows = (data ?? []) as Array<{
      id: string; channel_id: string; author_id: string; body: string;
      created_at: string; edited_at: string | null;
      reply_to_message_id?: string | null;
      attachment_path?: string | null;
      attachment_alt?: string | null;
    }>;
    if (!rows.length) {
      setMessages([]);
      setError("");
      return;
    }

    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const messageIds = rows.map((row) => row.id);
    const attachmentPaths = Array.from(new Set(
      rows.map((row) => row.attachment_path).filter((value): value is string => Boolean(value)),
    ));

    const [
      { data: authors, error: authorsError },
      { data: publicRoleBadges, error: badgeError },
      { data: metrics, error: metricsError },
      signedImagesResult,
    ] = await Promise.all([
      supabase.from("community_public_profiles")
        .select("id,full_name,avatar_url,level,xp")
        .in("id", authorIds),
      supabase.from("community_public_role_badges")
        .select("user_id,role_key,label,badge_color")
        .in("user_id", authorIds),
      supabase.rpc("get_community_message_metrics", { p_message_ids: messageIds }),
      attachmentPaths.length
        ? supabase.storage.from("community-attachments").createSignedUrls(attachmentPaths, 300)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Message delivery must not depend on optional schema additions. The public
    // badge projection, aggregate metrics and attachment bucket may be deployed
    // separately; omit enhancements until their migration is present.
    if (authorsError || badgeError || metricsError || signedImagesResult.error) {
      console.warn("[PeakScore Community] Optional profile/badge/metrics/attachment data is unavailable.", {
        profiles: authorsError?.code ?? null,
        publicBadges: badgeError?.code ?? null,
        metrics: metricsError?.code ?? null,
        attachmentSigning: signedImagesResult.error?.name ?? null,
      });
    }

    const authorMap = new Map<string, PublicProfile>(
      ((authors ?? []) as PublicProfile[]).map((author) => [author.id, author]),
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
    setReplyingTo(null);
    setReactionPickerFor(null);
    window.history.replaceState(null, "", "/comunidad?channel=" + channel.slug);
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
    const { error: deleteError } = await supabase.from("community_messages").delete().eq("id", message.id);
    if (deleteError) setError("No se pudo eliminar la publicación.");
    else {
      await loadMessages(message.channel_id);
      await refreshStats();
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
                          {repliedMessage && (
                            <button type="button" onClick={() => document.getElementById("post-" + repliedMessage.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                              className="community-chat-reply-reference">
                              <Reply size={13}/>
                              <span>Respuesta a <strong>{repliedMessage.author?.full_name ?? "un mensaje"}</strong>: {repliedMessage.body.slice(0, 110)}</span>
                            </button>
                          )}
                          {message.body && <p className="community-chat-message-body">{message.body}</p>}
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
                              <Reply size={15}/><span>Responder</span>
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
                if (dropped && ["image/png", "image/jpeg", "image/webp"].includes(dropped.type)) setAttachmentFile(dropped);
                else if (dropped) setError("Adjunta una imagen PNG, JPG o WebP.");
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
                onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                onKeyDown={(event) => {
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
      </div>
    </main>
  );
}
