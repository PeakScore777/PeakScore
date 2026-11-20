"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Hash, Menu, MessageCircle, Send, Users, X, ChevronDown,
  ShieldCheck, Sparkles, Radio, Search, Smile, MoreHorizontal,
  GraduationCap, Megaphone, Trophy, BookOpen,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";

type Channel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  position: number;
  is_read_only: boolean;
};
type Message = {
  id: string;
  channel_id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  author: { full_name: string | null; avatar_url: string | null } | null;
};

const CATEGORY_ORDER = ["COMUNIDAD", "MATERIAS", "PROFESORES", "AULAS Y EVENTOS"];
const CATEGORY_LABELS: Record<string, string> = {
  COMUNIDAD: "Comunidad",
  MATERIAS: "Materias",
  PROFESORES: "Profesores",
  "AULAS Y EVENTOS": "Aulas y eventos",
};
const ICONS: Record<string, typeof Hash> = {
  general: MessageCircle,
  memes: Smile,
  noticias: Megaphone,
  "logros-y-rankings": Trophy,
  matematicas: Hash,
  "lectura-critica": BookOpen,
  sociales: BookOpen,
  "ciencias-naturales": Sparkles,
  ingles: GraduationCap,
  "sala-de-profesores": Users,
  "anuncios-de-clases": Megaphone,
  eventos: Radio,
};

function initials(name: string | null | undefined) {
  return (name?.trim() || "P").split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function CommunityPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const groupedChannels = useMemo(() => CATEGORY_ORDER.map((category) => ({
    category,
    channels: channels.filter((channel) => channel.category === category).sort((a, b) => a.position - b.position),
  })).filter((group) => group.channels.length), [channels]);

  const loadMessages = useCallback(async (channelId: string) => {
    const { data, error: queryError } = await supabase
      .from("community_messages")
      .select("id,channel_id,author_id,body,created_at,edited_at,author:profiles!community_messages_author_id_fkey(full_name,avatar_url)")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(60);
    if (queryError) {
      setError("No pudimos cargar los mensajes. Comprueba tu conexión e inténtalo de nuevo.");
      return;
    }
    setMessages((data ?? []) as unknown as Message[]);
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
      const [{ data: userProfile }, { data: channelData }, { count }] = await Promise.all([
        supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("community_channels").select("id,slug,name,description,category,position,is_read_only").order("category").order("position"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (!alive) return;
      setProfile(userProfile);
      setMemberCount(count ?? 0);
      const list = (channelData ?? []) as Channel[];
      setChannels(list);
      const first = list.find((item) => item.slug === "general") ?? list[0];
      if (first) setActiveChannelId(first.id);
      setLoading(false);
    }
    void initialize();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!activeChannelId || !userId) return;
    const initialChannelId = activeChannelId;
    void loadMessages(initialChannelId);

    const messageSubscription = supabase
      .channel(`community-messages:${initialChannelId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
        filter: `channel_id=eq.${initialChannelId}`,
      }, async (payload) => {
        const row = payload.new as Omit<Message, "author">;
        const { data: author } = await supabase.from("profiles").select("full_name,avatar_url").eq("id", row.author_id).maybeSingle();
        setMessages((current) => current.some((item) => item.id === row.id) ? current : [...current, { ...row, author }]);
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "community_messages",
        filter: `channel_id=eq.${activeChannelId}`,
      }, (payload) => {
        const old = payload.old as { id?: string };
        if (old.id) setMessages((current) => current.filter((item) => item.id !== old.id));
      })
      .subscribe();

    const presence = supabase.channel("community-presence", { config: { presence: { key: userId } } });
    presence
      .on("presence", { event: "sync" }, () => setOnlineUsers(Object.keys(presence.presenceState()).length))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presence.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      void supabase.removeChannel(messageSubscription);
      void supabase.removeChannel(presence);
    };
  }, [activeChannelId, userId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeChannel || !userId || sending || activeChannel.is_read_only) return;
    if (body.length > 2000) {
      setError("El mensaje no puede superar los 2.000 caracteres.");
      return;
    }
    setSending(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("community_messages")
      .insert({ channel_id: activeChannel.id, author_id: userId, body })
      .select("id,channel_id,author_id,body,created_at,edited_at")
      .single();
    if (insertError) {
      setError(insertError.message.includes("row-level security")
        ? "No tienes permiso para publicar en este canal."
        : "No se pudo enviar el mensaje. Inténtalo de nuevo.");
    } else if (data) {
      setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, { ...data, author: profile }]);
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
    setSending(false);
  }

  async function deleteMessage(message: Message) {
    if (message.author_id !== userId) return;
    const { error: deleteError } = await supabase.from("community_messages").delete().eq("id", message.id);
    if (deleteError) setError("No se pudo eliminar el mensaje.");
    else setMessages((current) => current.filter((item) => item.id !== message.id));
  }

  const filteredMessages = search.trim()
    ? messages.filter((message) => message.body.toLowerCase().includes(search.toLowerCase()))
    : messages;

  if (loading) {
    return <main className="min-h-[calc(100vh-72px)] bg-[#090d18] p-6 text-white"><div className="mx-auto mt-24 max-w-xl text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-cyan-400" /><p className="mt-4 text-sm text-white/55">Preparando la comunidad...</p></div></main>;
  }

  return (
    <main className="community-shell min-h-[calc(100vh-72px)] bg-[#0b1024] text-[#eef3ff]">
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[1720px]">
        <aside className={`community-sidebar fixed inset-y-0 left-0 z-[120] mt-[72px] flex w-[248px] shrink-0 flex-col border-r border-[#283657] bg-[#0e1630] transition-transform duration-200 lg:sticky lg:top-[72px] lg:z-10 lg:mt-0 lg:h-[calc(100vh-72px)] lg:translate-x-0 ${mobileChannelsOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[68px] items-center justify-between border-b border-white/[0.07] px-5">
            <Link href="/comunidad" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/40 bg-[#152448] text-cyan-300"><Users size={19}/></span>
              <span><span className="pixel-font block text-[10px] leading-5 tracking-tight text-white">PEAKSCORE</span><span className="block text-[10px] text-cyan-200/60">Comunidad global</span></span>
            </Link>
            <button className="rounded-lg p-2 text-white/50 hover:bg-white/5 lg:hidden" onClick={() => setMobileChannelsOpen(false)} aria-label="Cerrar canales"><X size={18}/></button>
          </div>
          <div className="border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center justify-between rounded-lg border border-[#2c3b60] bg-[#172342] px-3 py-2.5">
              <div><p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Comunidad</p><p className="mt-1 text-xs font-bold">PeakScore Community</p></div>
              <ChevronDown size={15} className="text-white/35"/>
            </div>
          </div>
          <nav className="community-channel-list flex-1 overflow-y-auto px-3 py-4">
            {groupedChannels.map((group) => (
              <section key={group.category} className="mb-6">
                <div className="mb-2 flex items-center justify-between px-2">
                  <h2 className="pixel-font text-[8px] font-normal uppercase tracking-[0.08em] text-[#8798bf]">{CATEGORY_LABELS[group.category] ?? group.category}</h2>
                  <span className="text-[10px] text-white/25">{group.channels.length}</span>
                </div>
                {group.channels.map((channel) => {
                  const Icon = ICONS[channel.slug] ?? Hash;
                  const active = channel.id === activeChannelId;
                  return <button key={channel.id} onClick={() => { setMessages([]); setActiveChannelId(channel.id); setMobileChannelsOpen(false); }} className={`group mb-1 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition ${active ? "border-cyan-300/50 bg-[#1c2b50] text-white shadow-[inset_3px_0_0_#19d5e5]" : "border-transparent text-[#b6c2df] hover:border-[#2c3b60] hover:bg-[#172342] hover:text-white"}`}>
                    <Icon size={15} className={active ? "text-cyan-300" : "text-white/35"}/>
                    <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                    {channel.is_read_only && <ShieldCheck size={12} className="text-white/25"/>}
                  </button>;
                })}
              </section>
            ))}
          </nav>
          <div className="border-t border-white/[0.07] p-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-[#2c3b60] bg-[#172342] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-emerald-400 text-xs font-black text-[#07111d]">{initials(profile?.full_name)}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{profile?.full_name || "Estudiante PeakScore"}</p><p className="mt-0.5 text-[10px] text-emerald-300">Conectado</p></div>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"/>
            </div>
          </div>
        </aside>

        {mobileChannelsOpen && <button aria-label="Cerrar menú de canales" className="fixed inset-0 z-[110] mt-[72px] bg-black/65 lg:hidden" onClick={() => setMobileChannelsOpen(false)}/>}

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#283657] bg-[#0d1530] px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-lg p-2 text-white/65 hover:bg-white/5 lg:hidden" onClick={() => setMobileChannelsOpen(true)} aria-label="Abrir canales"><Menu size={19}/></button>
              <Hash size={22} className="shrink-0 text-cyan-300"/>
              <div className="min-w-0"><h1 className="pixel-font truncate text-[11px] leading-6 text-white sm:text-[13px]">{activeChannel?.name ?? "Comunidad"}</h1><p className="hidden truncate text-[11px] text-white/40 sm:block">{activeChannel?.description}</p></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {searchOpen && <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar en este canal" className="w-36 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-cyan-400/50 sm:w-52"/>}
              <button onClick={() => { setSearchOpen((value) => !value); setSearch(""); }} className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white" aria-label="Buscar"><Search size={17}/></button>
              <div className="hidden items-center gap-1.5 text-[11px] text-white/40 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400"/>{onlineUsers} en línea</div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col bg-[#0b1024]">
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
                <div className="mx-auto max-w-[980px]">
                  <div className="mb-5 rounded-xl border border-dashed border-[#34476e] bg-[#111b37] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/30 bg-[#17294d] text-cyan-200"><Megaphone size={19}/></div>
                      <div><p className="pixel-font text-[9px] leading-5 text-cyan-200">ANUNCIO DE LA COMUNIDAD</p><p className="mt-1 text-xs leading-5 text-[#b9c6e4]">Un espacio para aprender, compartir tus logros y conectar con estudiantes y profesores.</p></div>
                    </div>
                  </div>

                  {filteredMessages.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-white/35"><MessageCircle size={24}/></div>
                      <h2 className="mt-4 text-sm font-bold">{search ? "No encontramos mensajes" : "Este canal está esperando su primera conversación"}</h2>
                      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/40">{search ? "Prueba con otra palabra." : "Rompe el hielo, comparte una duda o saluda a la comunidad."}</p>
                    </div>
                  )}

                  {filteredMessages.map((message, index) => {
                    const previous = filteredMessages[index - 1];
                    const compact = previous && previous.author_id === message.author_id && sameDay(previous.created_at, message.created_at) && new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < 5 * 60 * 1000;
                    return <article key={message.id} className={`group relative mb-3 flex gap-3 rounded-xl border border-[#2c3d65] bg-[#141e3a] px-3 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition hover:border-[#3f5b8b] sm:px-4 ${compact ? "pt-2" : "mt-3"}`}>
                      {compact ? <div className="w-9 shrink-0 pt-1 text-center text-[9px] text-white/0 group-hover:text-white/30">{formatTime(message.created_at)}</div> : <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-cyan-300/80 to-emerald-400/80 text-[11px] font-black text-[#08111c]">{message.author?.avatar_url ? <Image src={message.author.avatar_url} alt="" width={36} height={36} unoptimized className="h-full w-full object-cover"/> : initials(message.author?.full_name)}</div>}
                      <div className="min-w-0 flex-1">
                        {!compact && <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><span className="text-[13px] font-extrabold text-white">{message.author?.full_name || "Estudiante"}</span><span className="text-[10px] text-white/30">{formatTime(message.created_at)}</span></div>}
                        <p className="whitespace-pre-wrap break-words text-[13px] leading-[1.7] text-[#c6d1eb]">{message.body}</p>
                      </div>
                      {message.author_id === userId && <button onClick={() => void deleteMessage(message)} title="Eliminar mensaje" className="absolute right-2 top-1 hidden rounded-md bg-[#151e30] p-1.5 text-white/40 hover:text-red-300 group-hover:block"><MoreHorizontal size={15}/></button>}
                    </article>;
                  })}
                  <div ref={bottomRef}/>
                </div>
              </div>

              <div className="shrink-0 px-4 pb-4 sm:px-7 sm:pb-6">
                <div className="mx-auto max-w-[980px]">
                  {error && <p role="alert" className="mb-2 rounded-lg border border-red-400/15 bg-red-400/5 px-3 py-2 text-xs text-red-200">{error}</p>}
                  <form onSubmit={sendMessage} className="rounded-xl border border-[#34476e] bg-[#141e3a] shadow-[0_10px_35px_rgba(0,0,0,0.22)] transition focus-within:border-cyan-300/60">
                    {activeChannel?.is_read_only ? <p className="px-4 py-4 text-center text-xs text-white/40">Este canal es de solo lectura.</p> : <div className="flex items-end gap-2 p-2 sm:p-3">
                      <textarea ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} onInput={(event) => { event.currentTarget.style.height = "auto"; event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 140)}px`; }} rows={1} placeholder={`Escribe en #${activeChannel?.name ?? "canal"}...`} className="max-h-[140px] min-h-[42px] flex-1 resize-none bg-transparent px-2 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-white/30" />
                      <div className="flex items-center gap-1 pb-1"><span className="hidden pr-2 text-[10px] text-white/25 sm:block">{draft.length}/2000</span><button type="submit" disabled={!draft.trim() || sending} className="flex h-9 w-9 items-center justify-center rounded-lg border-b-[3px] border-[#3a8e39] bg-[#79e34d] text-[#0c2410] transition hover:bg-[#91f365] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Enviar mensaje">{sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#06111c]/25 border-t-[#06111c]"/> : <Send size={16}/>}</button></div>
                    </div>}
                  </form>
                  <p className="mt-2 px-1 text-[10px] text-white/25">Enter para enviar · Shift + Enter para nueva línea</p>
                </div>
              </div>
            </div>

            <aside className="hidden w-[280px] shrink-0 border-l border-[#283657] bg-[#0d1530] px-4 py-6 xl:block">
              <div className="mb-6"><p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/35">Comunidad</p><div className="rounded-xl border border-[#34476e] bg-[#141e3a] p-4"><div className="flex items-center justify-between"><span className="text-xs text-white/55">Miembros</span><Users size={14} className="text-white/30"/></div><p className="mt-1 text-2xl font-black tabular-nums">{memberCount.toLocaleString("es-CO")}</p><p className="mt-1 text-[10px] text-white/35">Cuentas registradas</p><div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-xs text-white/55">En línea ahora</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>{onlineUsers}</span></div></div></div>
              <div><p className="pixel-font mb-3 text-[8px] font-normal uppercase tracking-[0.08em] text-[#8798bf]">Normas de la comunidad</p><div className="overflow-hidden rounded-xl border border-[#34476e] bg-[#141e3a]"><div className="border-b border-[#34476e] px-3 py-3"><p className="pixel-font text-[8px] text-cyan-200">NORMAS DE LA COMUNIDAD</p></div><div className="space-y-3 p-4 text-xs leading-5 text-[#c6d1eb]"><div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-400 text-[10px] font-black text-[#081324]">1</span>Respeta a todos los miembros.</div><div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-400 text-[10px] font-black text-[#081324]">2</span>No publiques spam ni publicidad externa.</div><div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-400 text-[10px] font-black text-[#081324]">3</span>Comparte contenido académico y relevante.</div><div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-400 text-[10px] font-black text-[#081324]">4</span>Mantén un trato respetuoso.</div></div></div></div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
