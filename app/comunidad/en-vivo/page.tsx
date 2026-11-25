"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Clock3, Radio, Users, ShieldCheck,
  Plus, X, CalendarClock, MonitorPlay, LockKeyhole,
  GraduationCap, Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type LiveSpace = {
  id: string;
  slug: string;
  name: string;
  space_type: "global" | "preicfes";
  visibility: "public" | "private";
};
type LiveSession = {
  id: string;
  space_id?: string;
  host_id: string;
  title: string;
  description: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  max_participants: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
};
type CommunityMemberSummary = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

const SUBJECTS = [
  "Matemáticas",
  "Lectura crítica",
  "Sociales",
  "Ciencias naturales",
  "Inglés",
  "Preparación ICFES",
  "General",
];

function dateInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(value));
}
function formatHour(value: string) {
  return new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "long" }).format(new Date(value));
}

export default function CommunityLivePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeSpace, setActiveSpace] = useState<LiveSpace | null>(null);
  const [canSchedule, setCanSchedule] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [hosts, setHosts] = useState<Record<string, CommunityMemberSummary>>({});
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Preparación ICFES");
  const [minimumScheduledAt] = useState(() =>
    dateInputValue(new Date(Date.now() + 10 * 60 * 1000))
  );
  const [scheduledAt, setScheduledAt] = useState(() => dateInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [duration, setDuration] = useState("60");
  const [capacity, setCapacity] = useState("30");

  const loadSessions = useCallback(async (spaceId: string) => {
    const scopedResult = await supabase
      .from("community_live_sessions")
      .select("id,space_id,host_id,title,description,subject,scheduled_at,duration_minutes,max_participants,status")
      .eq("space_id", spaceId)
      .in("status", ["scheduled", "live"])
      .order("scheduled_at", { ascending: true })
      .limit(50);

    let sessionData = scopedResult.data;
    let queryError = scopedResult.error;
    if (queryError && spaceId === "00000000-0000-4000-8000-000000000001"
      && ["42703","PGRST204","PGRST200"].includes(queryError.code ?? "")) {
      // Keep the existing global schedule readable until space_id is migrated.
      const legacyResult = await supabase
        .from("community_live_sessions")
        .select("id,host_id,title,description,subject,scheduled_at,duration_minutes,max_participants,status")
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true })
        .limit(50);
      sessionData = legacyResult.data;
      queryError = legacyResult.error;
    }

    if (queryError) {
      setError("No se pudo cargar la agenda de directos.");
      return;
    }

    const rows = (sessionData ?? []) as LiveSession[];
    setSessions(rows);
    const hostIds = Array.from(new Set(rows.map((row) => row.host_id)));
    if (hostIds.length) {
      const { data: hostRows } = await supabase
        .from("community_member_profiles")
        .select("user_id,display_name,avatar_path")
        .in("user_id", hostIds);
      const map: Record<string, CommunityMemberSummary> = {};
      ((hostRows ?? []) as Array<{ user_id: string; display_name: string; avatar_path: string | null }>)
        .forEach((host) => {
          map[host.user_id] = {
            id: host.user_id,
            full_name: host.display_name,
            avatar_url: host.avatar_path
              ? supabase.storage.from("community-profile-avatars").getPublicUrl(host.avatar_path).data.publicUrl
              : null,
          };
        });
      setHosts(map);
    } else {
      setHosts({});
    }
    setError("");
  }, []);

  useEffect(() => {
    if (!activeSpace?.id) return;
    const spaceId = activeSpace.id;
    const subscription = supabase
      .channel("community-live-session-schedule-" + spaceId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "community_live_sessions",
      }, () => {
        void loadSessions(spaceId);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "community_live_sessions",
        filter: "space_id=eq." + spaceId,
      }, () => {
        void loadSessions(spaceId);
      })
      .subscribe();

    return () => { void supabase.removeChannel(subscription); };
  }, [activeSpace?.id, loadSessions]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace("/login?next=/comunidad/en-vivo");
        return;
      }
      setUserId(user.id);

      const { data: spaces, error: spacesError } = await supabase
        .from("community_spaces")
        .select("id,slug,name,space_type,visibility")
        .eq("is_enabled", true);
      if (!active) return;
      const globalSpaceId = "00000000-0000-4000-8000-000000000001";
      const fallback: LiveSpace = {
        id: globalSpaceId, slug: "peakscore", name: "PeakScore Community",
        space_type: "global", visibility: "public",
      };
      const availableSpaces = spacesError ? [fallback] : ((spaces ?? []) as LiveSpace[]);
      const requestedSlug = new URLSearchParams(window.location.search).get("space");
      const requestedSpace = requestedSlug ? availableSpaces.find((space) => space.slug === requestedSlug) : null;
      if (requestedSlug && !requestedSpace && !spacesError) router.replace("/comunidad/en-vivo");
      const resolvedSpace = requestedSpace
        ?? availableSpaces.find((space) => space.space_type === "global")
        ?? fallback;
      setActiveSpace(resolvedSpace);

      if (resolvedSpace.space_type === "preicfes" && resolvedSpace.visibility === "public") {
        await supabase.rpc("join_community_space", { p_space_id: resolvedSpace.id });
      }

      const { data: ownProfile } = await supabase.from("profiles")
        .select("role").eq("id", user.id).maybeSingle();
      const isFounder = ownProfile?.role === "admin";
      if (resolvedSpace.space_type === "global") {
        const { data: roles } = await supabase.from("community_member_roles")
          .select("role_key").eq("user_id", user.id);
        if (!active) return;
        setCanSchedule(isFounder || (roles ?? []).some((role: { role_key: string }) => role.role_key === "profesor"));
      } else {
        const { data: roles } = await supabase.from("community_space_member_roles")
          .select("role_key").eq("space_id", resolvedSpace.id).eq("user_id", user.id);
        if (!active) return;
        setCanSchedule(isFounder || (roles ?? []).some((role: { role_key: string }) => ["docente","profesor"].includes(role.role_key)));
      }

      await loadSessions(resolvedSpace.id);
      if (active) setLoading(false);
    }
    void initialize();
    return () => { active = false; };
  }, [router, loadSessions]);

  const visibleSessions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesText = !needle
        || session.title.toLowerCase().includes(needle)
        || session.subject.toLowerCase().includes(needle)
        || (hosts[session.host_id]?.full_name ?? "").toLowerCase().includes(needle);
      const matchesFilter = filter === "all"
        || (filter === "live" && session.status === "live")
        || (filter === "upcoming" && session.status === "scheduled");
      return matchesText && matchesFilter;
    });
  }, [sessions, hosts, filter, search]);

  async function scheduleSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !canSchedule || !activeSpace || saving) return;

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const start = new Date(scheduledAt);
    if (cleanTitle.length < 5 || cleanTitle.length > 100) {
      setError("El título debe tener entre 5 y 100 caracteres.");
      return;
    }
    if (cleanDescription.length > 600) {
      setError("La descripción no puede superar los 600 caracteres.");
      return;
    }
    if (Number.isNaN(start.getTime()) || start.getTime() < Date.now() + 10 * 60 * 1000) {
      setError("Programa el encuentro al menos con 10 minutos de anticipación.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    const scopedInsert = await supabase
      .from("community_live_sessions")
      .insert({
        space_id: activeSpace.id,
        host_id: userId,
        title: cleanTitle,
        description: cleanDescription,
        subject,
        scheduled_at: start.toISOString(),
        duration_minutes: Number(duration),
        max_participants: Number(capacity),
        visibility: "community",
      });

    let insertError = scopedInsert.error;
    if (insertError && activeSpace.space_type === "global"
      && ["42703","PGRST204","PGRST200"].includes(insertError.code ?? "")) {
      // Before space_id is deployed, keep the original global scheduling path working.
      const legacyInsert = await supabase.from("community_live_sessions").insert({
        host_id: userId,
        title: cleanTitle,
        description: cleanDescription,
        subject,
        scheduled_at: start.toISOString(),
        duration_minutes: Number(duration),
        max_participants: Number(capacity),
        visibility: "community",
      });
      insertError = legacyInsert.error;
    }

    if (insertError) {
      setError(insertError.message.includes("row-level security")
        ? "Tu rol no tiene permiso para programar sesiones en este espacio."
        : "No se pudo programar la sesión. Comprueba los datos e inténtalo de nuevo.");
    } else {
      setTitle("");
      setDescription("");
      setScheduling(false);
      setSuccess("La sesión quedó programada y ya aparece en la agenda.");
      await loadSessions(activeSpace.id);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="community-page min-h-[calc(100vh-72px)] p-6 text-white">
        <div className="mx-auto mt-24 max-w-xl text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#01C8EF]"/>
          <p className="mt-4 text-sm text-[#8B93B5]">Cargando agenda de directos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="community-page min-h-[calc(100vh-72px)] text-[#eef2ff]">
      <div className="community-live-layout mx-auto min-h-[calc(100vh-72px)] max-w-[1500px]">
        <aside className="community-sidebar community-live-sidebar">
          <div className="border-b border-[#232836] px-5 py-5">
            <Link href={activeSpace?.space_type === "preicfes" ? "/comunidad?space=" + encodeURIComponent(activeSpace.slug) : "/comunidad"} className="flex items-center gap-2 text-xs text-[#8B93B5] hover:text-white">
              <ArrowLeft size={14}/> Volver a Comunidad
            </Link>
            <div className="mt-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center border border-[#01C8EF]/40 bg-[#0B1024] text-[#01C8EF]"><Radio size={18}/></div>
              <div>
                <p className="pixel-font text-[8px] leading-5 text-white">PEAKSCORE</p>
                <p className="text-[10px] text-[#8B93B5]">{activeSpace?.name ?? "Transmisiones"}</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="community-kicker mb-2 px-2">COMUNIDAD</p>
            <Link href={activeSpace?.space_type === "preicfes" ? "/comunidad?space=" + encodeURIComponent(activeSpace.slug) : "/comunidad"} className="community-nav-item mb-1"><Users size={15}/> Inicio</Link>
            <div className="community-nav-item community-nav-active"><Radio size={15}/> En vivo</div>
            <Link href={"/comunidad?channel=eventos" + (activeSpace?.space_type === "preicfes" ? "&space=" + encodeURIComponent(activeSpace.slug) : "")} className="community-nav-item mt-1"><CalendarDays size={15}/> Eventos</Link>
          </div>
          <div className="mt-auto border-t border-[#232836] p-4">
            <div className="rounded-lg border border-[#293956] bg-[#111a30] p-3">
              <p className="community-kicker">TRANSMISIONES</p>
              <p className="mt-2 text-xs leading-5 text-[#c0cbe0]">Clases, repasos y sesiones abiertas dirigidas por profesores verificados de PeakScore.</p>
            </div>
          </div>
        </aside>

        <section className="community-live-main">
          <header className="community-channel-header flex h-[70px] items-center justify-between border-b border-[#232836] px-5 sm:px-7">
            <div>
              <p className="community-kicker">COMUNIDAD / EN VIVO</p>
              <h1 className="mt-1 text-sm font-extrabold tracking-tight text-white">Agenda de transmisiones · {activeSpace?.name ?? "PeakScore Community"}</h1>
            </div>
            {canSchedule && (
              <button type="button" onClick={() => setScheduling((value) => !value)} className="community-green-button">
                {scheduling ? <X size={14}/> : <Plus size={14}/>}
                {scheduling ? "Cerrar" : "Programar sesión"}
              </button>
            )}
          </header>

          <div className="community-live-scroll">
            <div className="mx-auto max-w-[1040px] px-4 py-6 sm:px-7">
              <section className="community-live-hero">
                <div className="community-live-hero-copy">
                  <p className="community-kicker">APRENDER EN DIRECTO</p>
                  <h2>Las buenas preguntas merecen una clase en vivo.</h2>
                  <p>Repasos, resolución de preguntas ICFES y encuentros con profesores de PeakScore. Entra a aprender y participa desde la comunidad.</p>
                  <div className="community-live-hero-stats">
                    <span><strong>{sessions.filter((session) => session.status === "live").length}</strong> en curso</span>
                    <span><strong>{sessions.filter((session) => session.status === "scheduled").length}</strong> programadas</span>
                  </div>
                </div>
                <div className="community-live-hero-art" aria-hidden="true">
                  <div className="community-live-screen">
                    <div className="community-live-screen-top"><span/><span/><span/></div>
                    <div className="community-live-screen-center"><Radio size={34}/><b>PEAKSCORE LIVE</b><small>CLASES Y EVENTOS</small></div>
                    <div className="community-live-screen-footer"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
                  </div>
                  <div className="community-live-wave community-live-wave-one"/>
                  <div className="community-live-wave community-live-wave-two"/>
                </div>
              </section>

              {success && <div className="community-live-success" role="status">{success}</div>}
              {error && <div className="community-live-error" role="alert">{error}</div>}

              {scheduling && canSchedule && (
                <form onSubmit={scheduleSession} className="community-live-form">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="community-kicker">HERRAMIENTAS DEL PROFESOR</p>
                      <h2 className="mt-2 text-lg font-extrabold text-white">Programar nueva sesión</h2>
                      <p className="mt-1 text-xs text-[#8B98b8]">La sesión aparecerá en la agenda de la comunidad.</p>
                    </div>
                    <button type="button" onClick={() => setScheduling(false)} className="community-icon-button" aria-label="Cerrar formulario"><X size={16}/></button>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="community-live-field sm:col-span-2">
                      <span>Título de la sesión</span>
                      <input required minLength={5} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Cómo resolver problemas de proporcionalidad" />
                    </label>
                    <label className="community-live-field sm:col-span-2">
                      <span>Descripción</span>
                      <textarea maxLength={600} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Qué aprenderán los estudiantes en esta sesión..." />
                    </label>
                    <label className="community-live-field">
                      <span>Área</span>
                      <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                        {SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </label>
                    <label className="community-live-field">
                      <span>Fecha y hora</span>
                      <input type="datetime-local" required min={minimumScheduledAt} value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                    </label>
                    <label className="community-live-field">
                      <span>Duración</span>
                      <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                        <option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option><option value="120">120 minutos</option>
                      </select>
                    </label>
                    <label className="community-live-field">
                      <span>Aforo máximo del piloto</span>
                      <select value={capacity} onChange={(event) => setCapacity(event.target.value)}>
                        <option value="10">10 estudiantes</option><option value="15">15 estudiantes</option><option value="20">20 estudiantes</option><option value="30">30 estudiantes</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#293956] pt-4 sm:flex-row sm:items-center">
                    <p className="max-w-[520px] text-[11px] leading-5 text-[#8B98B8]">La programación ya está habilitada. La emisión de cámara, micrófono y pantalla se activará cuando se conecte LiveKit de forma segura en el servidor.</p>
                    <button type="submit" disabled={saving || title.trim().length < 5} className="community-green-button disabled:opacity-40">
                      <CalendarClock size={14}/>{saving ? "Guardando..." : "Publicar en agenda"}
                    </button>
                  </div>
                </form>
              )}

              <div className="community-live-toolbar">
                <div>
                  <p className="community-kicker">PROGRAMACIÓN</p>
                  <h2>Próximas sesiones</h2>
                </div>
                <div className="community-live-filters">
                  {(["all", "live", "upcoming"] as const).map((value) => (
                    <button key={value} type="button" onClick={() => setFilter(value)} className={filter === value ? "active" : ""}>
                      {value === "all" ? "Todas" : value === "live" ? "En vivo" : "Programadas"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <Search size={15} className="text-[#7182aa]"/>
                <input className="community-live-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tema, profesor o clase..." />
              </div>

              {visibleSessions.length === 0 ? (
                <div className="community-live-empty">
                  <div className="community-live-empty-icon"><MonitorPlay size={24}/></div>
                  <h3>{filter === "live" ? "No hay transmisiones activas" : "Todavía no hay sesiones programadas"}</h3>
                  <p>{canSchedule ? "Programa tu primera clase para que los estudiantes puedan encontrarla aquí." : "Cuando los profesores publiquen sus clases y eventos, aparecerán en esta agenda."}</p>
                  {canSchedule && <button type="button" onClick={() => setScheduling(true)} className="community-green-button"><Plus size={14}/> Programar sesión</button>}
                </div>
              ) : (
                <div className="community-live-session-list">
                  {visibleSessions.map((session) => {
                    const host = hosts[session.host_id];
                    const live = session.status === "live";
                    return (
                      <article key={session.id} className="community-live-session-card">
                        <div className="community-live-date">
                          <strong>{formatDay(session.scheduled_at).split(" ")[0]}</strong>
                          <span>{formatDay(session.scheduled_at).split(" ").slice(1).join(" ")}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="community-live-subject">{session.subject}</span>
                            {live && <span className="community-live-badge"><i/> EN CURSO</span>}
                          </div>
                          <h3>{session.title}</h3>
                          <p>{session.description || "Sesión educativa de PeakScore."}</p>
                          <div className="community-live-meta">
                            <span><GraduationCap size={13}/>{host?.full_name ?? "Profesor PeakScore"}</span>
                            <span><Clock3 size={13}/>{formatHour(session.scheduled_at)} · {session.duration_minutes} min</span>
                            <span><Users size={13}/>{session.max_participants} cupos</span>
                          </div>
                        </div>
                        <div className="community-live-session-action">
                          <span className={live ? "community-live-status-now" : "community-live-status-next"}>{live ? "Evento en curso" : formatWeekday(session.scheduled_at)}</span>
                          <span className="community-live-session-notice">{live ? "Sala multimedia pendiente" : "Sesión en agenda"}</span>
                          <button type="button" className="community-live-details-button" onClick={() => setSelectedSession(session)}>Ver detalles</button>
                        </div>
                        <button type="button" className="community-live-mobile-details" onClick={() => setSelectedSession(session)}>Ver detalles</button>
                      </article>
                    );
                  })}
                </div>
              )}

              {selectedSession && (
                <div className="community-live-detail-overlay" role="presentation" onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setSelectedSession(null);
                }}>
                  <section className="community-live-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="community-live-detail-title">
                    <header>
                      <div><p className="community-kicker">PEAKSCORE LIVE / DETALLES</p><h2 id="community-live-detail-title">{selectedSession.title}</h2></div>
                      <button type="button" onClick={() => setSelectedSession(null)} aria-label="Cerrar detalles"><X size={18}/></button>
                    </header>
                    <div className="community-live-detail-tags"><span>{selectedSession.subject}</span><span>{selectedSession.status === "live" ? "EVENTO EN CURSO" : "PROGRAMADA"}</span></div>
                    <p className="community-live-detail-description">{selectedSession.description || "Encuentro educativo de la comunidad PeakScore."}</p>
                    <div className="community-live-detail-facts">
                      <div><span>PROFESOR</span><strong>{hosts[selectedSession.host_id]?.full_name ?? "Profesor PeakScore"}</strong></div>
                      <div><span>FECHA</span><strong>{new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date(selectedSession.scheduled_at))}</strong></div>
                      <div><span>HORA</span><strong>{formatHour(selectedSession.scheduled_at)}</strong></div>
                      <div><span>DURACIÓN</span><strong>{selectedSession.duration_minutes} minutos</strong></div>
                      <div><span>AFORO</span><strong>Hasta {selectedSession.max_participants} estudiantes</strong></div>
                    </div>
                    <div className="community-live-detail-notice"><LockKeyhole size={17}/><div><strong>Sala multimedia todavía no habilitada</strong><p>La agenda y los permisos de sesión ya funcionan. La conexión de cámara, micrófono y pantalla se habilitará cuando el servidor multimedia esté configurado. No necesitas conceder permisos del dispositivo todavía.</p></div></div>
                    <footer><button type="button" onClick={() => setSelectedSession(null)}>Entendido</button></footer>
                  </section>
                </div>
              )}

              <section className="community-live-security-note">
                <ShieldCheck size={17}/>
                <div><strong>Clases protegidas</strong><p>Solo profesores verificados pueden programar sesiones. Las futuras salas emitirán tokens de acceso de corta duración desde el servidor; las claves de transmisión nunca se enviarán al navegador.</p></div>
                <LockKeyhole size={16} className="ml-auto hidden shrink-0 text-[#7FE05C] sm:block"/>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
