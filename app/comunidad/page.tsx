"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Hash, Menu, Search, Send, Users, X, ChevronDown, ShieldCheck,
  Megaphone, Trophy, BookOpen, GraduationCap, Radio, MessageCircle,
  Heart, Share2, MoreHorizontal, Grid2X2, List, Plus, MessageSquareText,
  Layers3,
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
type Reaction = { id: string; message_id: string; user_id: string; reaction: string };
type Message = {
  id: string; channel_id: string; author_id: string; body: string;
  created_at: string; edited_at: string | null; author: PublicProfile | null;
  channel: Channel | null; reactions: Reaction[]; comment_count: number;
};
type Comment = {
  id: string; message_id: string; parent_comment_id: string | null;
  author_id: string; body: string; created_at: string; author: PublicProfile | null;
};

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
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
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
  const [roleCatalog, setRoleCatalog] = useState<CommunityRole[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
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
  const [postCount, setPostCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const groupedChannels = useMemo(() => CATEGORIES.map((category) => ({
    category,
    channels: channels.filter((channel) => channel.category === category)
      .sort((a, b) => a.position - b.position),
  })).filter((group) => group.channels.length), [channels]);

  const refreshStats = useCallback(async () => {
    const [{ count: members }, { count: posts }] = await Promise.all([
      supabase.from("community_public_profiles").select("id", { count: "exact", head: true }),
      supabase.from("community_messages").select("id", { count: "exact", head: true }),
    ]);
    setMemberCount(members ?? 0);
    setPostCount(posts ?? 0);
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

    const rows = (data ?? []) as Omit<Message, "author" | "channel" | "reactions" | "comment_count">[];
    if (!rows.length) {
      setMessages([]);
      setError("");
      return;
    }
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const messageIds = rows.map((row) => row.id);
    const [{ data: authors }, { data: reactions }, { data: commentRows }, { data: roleAssignments }] = await Promise.all([
      supabase.from("community_public_profiles").select("id,full_name,avatar_url,level,xp").in("id", authorIds),
      supabase.from("community_reactions").select("id,message_id,user_id,reaction").in("message_id", messageIds),
      supabase.from("community_message_comments").select("id,message_id").in("message_id", messageIds),
      supabase.from("community_member_roles").select("user_id,role_key").in("user_id", authorIds),
    ]);
    const authorMap = new Map<string, PublicProfile>(
      ((authors ?? []) as PublicProfile[]).map((author) => [author.id, author]),
    );
    const roleMap = new Map<string, CommunityRole[]>();
    ((roleAssignments ?? []) as { user_id: string; role_key: string }[]).forEach((assignment) => {
      const role = roleCatalog.find((item) => item.role_key === assignment.role_key);
      if (!role) return;
      const current = roleMap.get(assignment.user_id) ?? [];
      current.push(role);
      roleMap.set(assignment.user_id, current);
    });
    const reactionRows = (reactions ?? []) as Reaction[];
    const commentCounts = new Map<string, number>();
    (commentRows ?? []).forEach((comment: { message_id: string }) => {
      commentCounts.set(comment.message_id, (commentCounts.get(comment.message_id) ?? 0) + 1);
    });

    setMessages(rows.map((row) => ({
      ...row,
      author: authorMap.has(row.author_id)
        ? { ...authorMap.get(row.author_id)!, roles: roleMap.get(row.author_id) ?? [] }
        : null,
      channel: channels.find((channel) => channel.id === row.channel_id) ?? null,
      reactions: reactionRows.filter((reaction) => reaction.message_id === row.id),
      comment_count: commentCounts.get(row.id) ?? 0,
    })));
    setError("");
  }, [channels, roleCatalog]);

  const loadComments = useCallback(async (messageId: string) => {
    const { data, error: queryError } = await supabase
      .from("community_message_comments")
      .select("id,message_id,parent_comment_id,author_id,body,created_at")
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });
    if (queryError) {
      setError("No pudimos cargar los comentarios.");
      return;
    }
    const rows = (data ?? []) as Omit<Comment, "author">[];
    const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
    const { data: authors } = authorIds.length
      ? await supabase.from("community_public_profiles")
          .select("id,full_name,avatar_url,level,xp").in("id", authorIds)
      : { data: [] as PublicProfile[] };
    const authorMap = new Map<string, PublicProfile>(
      ((authors ?? []) as PublicProfile[]).map((author) => [author.id, author]),
    );
    setComments(rows.map((row) => ({ ...row, author: authorMap.get(row.author_id) ?? null })));
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
      setRoleCatalog(catalog);
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
    void loadMessages(channelId);
    const messageSubscription = supabase.channel("community-messages-" + channelId)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "community_messages",
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
    const filtered = search.trim()
      ? messages.filter((message) =>
          message.body.toLowerCase().includes(search.toLowerCase())
          || (message.author?.full_name ?? "").toLowerCase().includes(search.toLowerCase()))
      : [...messages];
    if (sortBy === "top") return filtered.sort((a, b) => b.reactions.length - a.reactions.length);
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [messages, search, sortBy]);

  async function selectChannel(channel: Channel) {
    setMessages([]);
    setActiveChannelId(channel.id);
    setMobileChannelsOpen(false);
    setComposerOpen(false);
    setSearch("");
    setCommentsFor(null);
    setReplyTo(null);
    window.history.replaceState(null, "", "/comunidad?channel=" + channel.slug);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setComposerOpen(false);
      await loadMessages(activeChannel.id);
      await refreshStats();
    }
    setSending(false);
  }

  async function toggleReaction(message: Message) {
    if (!userId) return;
    const existing = message.reactions.find((reaction) =>
      reaction.user_id === userId && reaction.reaction === "like");
    if (existing) {
      const { error: removeError } = await supabase.from("community_reactions").delete().eq("id", existing.id);
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
      setReplyTo(null);
      return;
    }
    setCommentsFor(messageId);
    setReplyTo(null);
    await loadComments(messageId);
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
    <main className="community-page min-h-[calc(100vh-72px)] bg-[#0B1020] text-[#eef2ff]">
      <div className="community-layout mx-auto flex min-h-[calc(100vh-72px)] max-w-[1500px]">
        <aside className={"community-sidebar fixed inset-y-0 left-0 z-[120] mt-[72px] flex w-[250px] shrink-0 flex-col border-r border-[#232836] bg-[#080d1c] transition-transform duration-200 lg:sticky lg:top-[72px] lg:z-10 lg:mt-0 lg:h-[calc(100vh-72px)] lg:translate-x-0 " + (mobileChannelsOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-[64px] items-center justify-between border-b border-[#232836] px-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center border border-[#01C8EF]/40 bg-[#0B1024] text-[#01C8EF]"><Users size={17}/></span>
              <span>
                <span className="pixel-font block text-[9px] leading-5 tracking-tight text-white">PEAKSCORE</span>
                <span className="block text-[10px] text-[#8B93B5]">Comunidad</span>
              </span>
            </div>
            <button type="button" className="rounded p-2 text-[#8B93B5] hover:bg-white/5 lg:hidden"
              onClick={() => setMobileChannelsOpen(false)} aria-label="Cerrar canales"><X size={18}/></button>
          </div>
          <div className="border-b border-[#232836] px-4 py-3">
            <div className="flex items-center justify-between bg-[#0B1024] px-3 py-2.5">
              <div><p className="community-kicker">COMUNIDAD</p><p className="mt-1 text-xs font-bold text-white">PeakScore Community</p></div>
              <ChevronDown size={14} className="text-[#68769c]"/>
            </div>
          </div>
          <nav className="community-channel-list flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-5">
              <p className="community-kicker mb-2 px-2">COMUNIDAD</p>
              <div className="community-nav-item community-nav-active"><MessageCircle size={15}/> Inicio</div>
            </div>
            {groupedChannels.map((group) => (
              <section key={group.category} className="mb-5">
                <div className="mb-2 flex items-center justify-between px-2">
                  <h2 className="community-kicker">{CATEGORY_LABELS[group.category] ?? group.category}</h2>
                  <span className="text-[10px] text-[#5A6390]">{group.channels.length}</span>
                </div>
                {group.channels.map((channel) => {
                  const Icon = CHANNEL_ICONS[channel.slug] ?? Hash;
                  const active = channel.id === activeChannelId;
                  return (
                    <button type="button" key={channel.id} onClick={() => void selectChannel(channel)}
                      className={"community-nav-item mb-0.5 w-full text-left " + (active ? "community-nav-active" : "")}>
                      <Icon size={14}/><span className="min-w-0 flex-1 truncate">{channel.name}</span>
                      {channel.is_private && <ShieldCheck size={11} className="text-[#7FE05C]" aria-label="Canal privado"/>}
                      {channel.is_read_only && <ShieldCheck size={11} className="text-[#5A6390]" aria-label="Solo lectura"/>}
                    </button>
                  );
                })}
              </section>
            ))}
          </nav>
          <div className="border-t border-[#232836] p-3">
            <div className="flex items-center gap-2.5 bg-[#10182d] p-3">
              <div className="community-avatar community-avatar-small">
                {profile?.avatar_url
                  ? <Image src={profile.avatar_url} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover"/>
                  : initials(profile?.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{profile?.full_name || "Estudiante PeakScore"}</p>
                <p className="mt-0.5 text-[10px] text-[#7FE05C]">Nivel {profile?.level ?? 1}</p>
                {profile?.roles?.filter((role) => role.display_as_badge).map((role) => (
                  <span key={role.role_key} className="community-role-badge mt-1">{role.label}</span>
                ))}
              </div>
              <span className="h-2 w-2 rounded-full bg-[#7FE05C]"/>
            </div>
          </div>
        </aside>

        {mobileChannelsOpen && <button type="button" aria-label="Cerrar menú de canales"
          className="fixed inset-0 z-[110] mt-[72px] bg-black/65 lg:hidden" onClick={() => setMobileChannelsOpen(false)}/>}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="community-channel-header flex h-[70px] shrink-0 items-center justify-between border-b border-[#232836] px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" className="rounded p-2 text-[#8B93B5] hover:bg-white/5 lg:hidden"
                onClick={() => setMobileChannelsOpen(true)} aria-label="Abrir canales"><Menu size={18}/></button>
              <Hash size={20} className="shrink-0 text-[#01C8EF]"/>
              <div className="min-w-0">
                <h1 className="pixel-font truncate text-[10px] leading-6 text-white sm:text-[11px]">{activeChannel?.name ?? "Comunidad"}</h1>
                <p className="hidden truncate text-[11px] text-[#8B93B5] sm:block">{activeChannel?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {searchOpen && <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar publicaciones" className="community-search-input w-36 sm:w-52"/>}
              <button type="button" onClick={() => { setSearchOpen((value) => !value); setSearch(""); }}
                className="rounded p-2 text-[#8B93B5] hover:bg-white/5 hover:text-white" aria-label="Buscar"><Search size={17}/></button>
              <div className="hidden items-center gap-4 text-[11px] sm:flex">
                <span className="flex items-center gap-1.5 text-[#8B93B5]"><Users size={14}/> {memberCount.toLocaleString("es-CO")}</span>
                <span className="flex items-center gap-1.5 text-[#7FE05C]"><span className="h-1.5 w-1.5 rounded-full bg-[#7FE05C]"/>{onlineUsers} en línea</span>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="community-feed-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-[880px]">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#232836] pb-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setSortBy("newest")}
                        className={"community-tab " + (sortBy === "newest" ? "community-tab-active" : "")}>Más recientes</button>
                      <button type="button" onClick={() => setSortBy("top")}
                        className={"community-tab " + (sortBy === "top" ? "community-tab-active" : "")}>Mejores publicaciones</button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setLayout("list")}
                        className={"community-icon-button " + (layout === "list" ? "community-icon-active" : "")}
                        aria-label="Vista de lista"><List size={16}/></button>
                      <button type="button" onClick={() => setLayout("grid")}
                        className={"community-icon-button " + (layout === "grid" ? "community-icon-active" : "")}
                        aria-label="Vista en cuadrícula"><Grid2X2 size={16}/></button>
                    </div>
                  </div>

                  {error && <p role="alert" className="mb-3 border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-200">{error}</p>}
                  <button type="button" onClick={() => setComposerOpen((value) => !value)}
                    className="community-create-prompt mb-4 flex w-full items-center justify-between gap-3 border border-dashed border-[#34405f] bg-[#0d1428] px-4 py-3 text-left">
                    <span className="text-xs text-[#c0c9df]">Comparte una duda, un logro o algo interesante con la comunidad.</span>
                    <span className="community-green-button shrink-0"><Plus size={14}/> Publicar</span>
                  </button>

                  {composerOpen && (
                    <form onSubmit={sendMessage} className="community-composer mb-4 border border-[#293652] bg-[#111a30] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold text-white">Nueva publicación en #{activeChannel?.name}</p>
                        <button type="button" onClick={() => setComposerOpen(false)} className="text-[#8B93B5] hover:text-white" aria-label="Cerrar"><X size={16}/></button>
                      </div>
                      {activeChannel?.is_read_only ? <p className="text-xs text-[#8B93B5]">Este canal es de solo lectura.</p> : (
                        <>
                          <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                            rows={4} placeholder="Escribe tu publicación..." className="community-composer-input w-full resize-y" autoFocus/>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] text-[#68769c]">{draft.length}/2000</span>
                            <button type="submit" disabled={!draft.trim() || sending} className="community-green-button disabled:opacity-40">
                              <Send size={14}/> {sending ? "Publicando..." : "Publicar"}
                            </button>
                          </div>
                        </>
                      )}
                    </form>
                  )}

                  {visibleMessages.length === 0 && (
                    <div className="community-empty-state py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#293652] bg-[#101a31] text-[#01C8EF]"><MessageSquareText size={22}/></div>
                      <h2 className="pixel-font mt-4 text-[9px] leading-6 text-white">{search ? "SIN RESULTADOS" : "AUN NO HAY PUBLICACIONES"}</h2>
                      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#8B93B5]">
                        {search ? "Prueba con otras palabras." : "Abre la conversación con una pregunta o comparte algo que hayas aprendido."}
                      </p>
                    </div>
                  )}

                  <div className={layout === "grid" ? "community-post-grid" : "space-y-3"}>
                    {visibleMessages.map((message) => {
                      const myLike = message.reactions.some((reaction) => reaction.user_id === userId && reaction.reaction === "like");
                      const commentsOpen = commentsFor === message.id;
                      const roots = commentTree(comments.filter((comment) => comment.message_id === message.id));
                      return (
                        <article id={"post-" + message.id} key={message.id} className="community-post-card">
                          <div className="flex items-start gap-2.5">
                            <div className="community-avatar">
                              {message.author?.avatar_url
                                ? <Image src={message.author.avatar_url} alt="" width={38} height={38} unoptimized className="h-full w-full object-cover"/>
                                : initials(message.author?.full_name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[13px] font-extrabold text-white">{message.author?.full_name ?? "Estudiante"}</span>
                                {message.author?.roles?.filter((role) => role.display_as_badge).map((role) => (
                                  <span key={role.role_key} className="community-role-badge" style={{ color: role.badge_color, borderColor: role.badge_color + "70" }}>{role.label}</span>
                                ))}
                                <span className="community-level-badge">NV {message.author?.level ?? 1}</span>
                                {message.channel && <span className="community-channel-badge">{message.channel.name}</span>}
                                <time className="text-[10px] text-[#68769c]" dateTime={message.created_at}>{timeLabel(message.created_at)}</time>
                              </div>
                              <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-[1.7] text-[#c4cde2]">{message.body}</p>
                            </div>
                            {message.author_id === userId && (
                              <button type="button" onClick={() => void deleteMessage(message)} title="Eliminar publicación"
                                className="community-icon-button opacity-0 transition group-hover:opacity-100" aria-label="Eliminar publicación"><MoreHorizontal size={16}/></button>
                            )}
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#232d45] pt-3">
                            <button type="button" onClick={() => void toggleReaction(message)}
                              className={"community-post-action " + (myLike ? "community-post-action-active" : "")}
                              aria-pressed={myLike}>
                              <Heart size={14} fill={myLike ? "currentColor" : "none"}/> {message.reactions.length}
                            </button>
                            <button type="button" onClick={() => {
                              void openComments(message.id);
                            }} className="community-post-action">
                              <MessageCircle size={14}/> {message.comment_count} comentarios
                            </button>
                            <button type="button" onClick={() => void shareMessage(message)} className="community-post-action">
                              <Share2 size={14}/> {copiedMessageId === message.id ? "Copiado" : "Compartir"}
                            </button>
                          </div>
                          {commentsOpen && (
                            <div className="community-comments mt-3 border-t border-[#232d45] pt-3">
                              <div className="mb-3 flex items-center justify-between">
                                <p className="community-kicker">COMENTARIOS</p>
                                <button type="button" onClick={() => setCommentsFor(null)} className="text-[10px] text-[#8B93B5] hover:text-white">Cerrar</button>
                              </div>
                              <div className="space-y-3">
                                {roots.map((comment) => (
                                  <div key={comment.id} className="border-l border-[#34405f] pl-3">
                                    <div className="flex items-start gap-2">
                                      <div className="community-avatar community-avatar-small">
                                        {comment.author?.avatar_url
                                          ? <Image src={comment.author.avatar_url} alt="" width={28} height={28} unoptimized className="h-full w-full object-cover"/>
                                          : initials(comment.author?.full_name)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs font-bold text-white">{comment.author?.full_name ?? "Estudiante"}</span>
                                          <span className="community-level-badge">NV {comment.author?.level ?? 1}</span>
                                          <time className="text-[10px] text-[#68769c]">{timeLabel(comment.created_at)}</time>
                                        </div>
                                        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#bdc7dd]">{comment.body}</p>
                                        <div className="mt-1 flex items-center gap-3">
                                          <button type="button" onClick={() => setReplyTo(comment.id)} className="text-[10px] text-[#01C8EF] hover:text-white">Responder</button>
                                          {comment.author_id === userId && <button type="button" onClick={() => void deleteComment(comment)} className="text-[10px] text-[#68769c] hover:text-red-300">Eliminar</button>}
                                        </div>
                                      </div>
                                    </div>
                                    {comment.replies.length > 0 && (
                                      <div className="ml-5 mt-3 space-y-3">
                                        {comment.replies.map((reply) => (
                                          <div key={reply.id} className="flex items-start gap-2">
                                            <div className="community-avatar community-avatar-small">
                                              {reply.author?.avatar_url
                                                ? <Image src={reply.author.avatar_url} alt="" width={28} height={28} unoptimized className="h-full w-full object-cover"/>
                                                : initials(reply.author?.full_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-bold text-white">{reply.author?.full_name ?? "Estudiante"}</span>
                                                <span className="community-level-badge">NV {reply.author?.level ?? 1}</span>
                                                <time className="text-[10px] text-[#68769c]">{timeLabel(reply.created_at)}</time>
                                              </div>
                                              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-[#bdc7dd]">{reply.body}</p>
                                              {reply.author_id === userId && <button type="button" onClick={() => void deleteComment(reply)} className="mt-1 text-[10px] text-[#68769c] hover:text-red-300">Eliminar</button>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {roots.length === 0 && <p className="py-3 text-xs text-[#68769c]">Todavía no hay comentarios. Inicia la conversación.</p>}
                              </div>
                              <form onSubmit={(event) => void sendComment(event, message.id)} className="mt-4">
                                {replyTo && (
                                  <div className="mb-2 flex items-center justify-between text-[10px] text-[#01C8EF]">
                                    <span>Respondiendo a un comentario</span>
                                    <button type="button" onClick={() => setReplyTo(null)} className="text-[#8B93B5]">Cancelar</button>
                                  </div>
                                )}
                                <div className="flex items-end gap-2">
                                  <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value.slice(0, 1200))}
                                    rows={2} placeholder="Escribe un comentario..." className="community-composer-input min-h-[54px] flex-1 resize-y"/>
                                  <button type="submit" disabled={!commentDraft.trim() || commentSending}
                                    className="community-green-icon-button" aria-label="Enviar comentario"><Send size={15}/></button>
                                </div>
                              </form>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <aside className="community-right-rail hidden w-[260px] shrink-0 border-l border-[#232836] bg-[#080d1c] px-4 py-5 xl:block">
              <div className="community-side-card mb-4">
                <div className="community-side-card-header"><Megaphone size={13}/> DEL EQUIPO PEAKSCORE</div>
                <div className="p-4">
                  <h2 className="pixel-font text-[9px] leading-5 text-white">La comunidad de PeakScore</h2>
                  <p className="mt-3 text-xs leading-5 text-[#b8c3dc]">Un espacio para compartir dudas, avances y recursos de preparación para el Saber 11.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="bg-[#0a1122] p-3">
                      <p className="text-lg font-extrabold tabular-nums text-white">{memberCount.toLocaleString("es-CO")}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-wider text-[#68769c]">Miembros</p>
                    </div>
                    <div className="bg-[#0a1122] p-3">
                      <p className="text-lg font-extrabold tabular-nums text-white">{postCount.toLocaleString("es-CO")}</p>
                      <p className="mt-1 text-[9px] uppercase tracking-wider text-[#68769c]">Publicaciones</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-[#8B93B5]">En línea ahora</span>
                    <span className="flex items-center gap-1.5 font-bold text-[#7FE05C]"><span className="h-1.5 w-1.5 rounded-full bg-[#7FE05C]"/>{onlineUsers}</span>
                  </div>
                </div>
              </div>
              <div className="community-side-card">
                <div className="community-side-card-header"><ShieldCheck size={14}/> NORMAS DE LA COMUNIDAD</div>
                <div className="space-y-3 p-4 text-xs leading-5 text-[#c4cde2]">
                  <div className="flex gap-2"><span className="community-rule-number">1</span>Respeta a los demás miembros.</div>
                  <div className="flex gap-2"><span className="community-rule-number">2</span>Evita el spam y la publicidad no solicitada.</div>
                  <div className="flex gap-2"><span className="community-rule-number">3</span>Comparte contenido relacionado con el aprendizaje.</div>
                  <div className="flex gap-2"><span className="community-rule-number">4</span>No publiques datos personales tuyos ni de terceros.</div>
                </div>
                <div className="border-t border-[#232836] px-4 py-3 text-[11px] font-bold text-[#01C8EF]">Convivencia y respeto en PeakScore</div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
