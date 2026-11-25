"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Archive, GraduationCap, Hash, Lock, Megaphone, Plus, Save, Trash2, Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Space = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  icon_key: string;
  accent_color: string;
};
type Candidate = { user_id: string; display_name: string; member_number: number | null };
type SpaceMember = Candidate & { role_keys: string[] };
type SpaceChannel = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  position: number;
  is_private: boolean;
  is_read_only: boolean;
  channel_type: "text" | "announcement";
  icon_key: string;
  accent_color: string;
};
type RoleOption = { role_key: string; label: string };

const ROLE_PROTECTED = new Set(["fundador", "administrador", "moderador", "profesor"]);
const EMPTY_SPACE = {
  slug: "",
  name: "",
  description: "",
  visibility: "private" as const,
  icon_key: "graduation-cap",
  accent_color: "#E4B65C",
};
const EMPTY_CHANNEL = {
  slug: "",
  name: "",
  description: "",
  category: "COMUNIDAD",
  position: 10,
  is_private: false,
  is_read_only: false,
  channel_type: "text" as const,
  icon_key: "hash",
  accent_color: "#01C8EF",
};
const FIELD = "mt-1.5 h-10 w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 text-[11px] text-[#e8eef3] outline-none transition placeholder:text-[#647a89] focus:border-[#01c8ef] focus:ring-2 focus:ring-[#01c8ef]/10";
const LABEL = "block text-[10px] font-semibold tracking-wide text-[#a4b5c0]";

export default function CommunitySpacesStudio() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [spaceMembers, setSpaceMembers] = useState<SpaceMember[]>([]);
  const [spaceChannels, setSpaceChannels] = useState<SpaceChannel[]>([]);
  const [schemaReady, setSchemaReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"settings" | "members" | "channels">("settings");
  const [spaceForm, setSpaceForm] = useState(EMPTY_SPACE);
  const [channelForm, setChannelForm] = useState(EMPTY_CHANNEL);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRoleKey, setSelectedRoleKey] = useState("colaborador");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [moderationTarget, setModerationTarget] = useState<SpaceMember | null>(null);
  const [moderationAction, setModerationAction] = useState<"kick" | "timeout" | "restore">("timeout");
  const [moderationReason, setModerationReason] = useState("");
  const [moderationDuration, setModerationDuration] = useState(60);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedChannel = spaceChannels.find((channel) => channel.id === selectedChannelId) ?? null;

  const loadSpaces = useCallback(async () => {
    setLoading(true);
    setError("");
    const [spaceResult, candidateResult, roleResult] = await Promise.all([
      supabase.from("community_spaces")
        .select("id,slug,name,description,visibility,icon_key,accent_color")
        .eq("space_type", "preicfes")
        .eq("is_enabled", true)
        .order("created_at", { ascending: false }),
      supabase.from("community_member_profiles")
        .select("user_id,display_name,member_number")
        .order("display_name", { ascending: true })
        .limit(300),
      supabase.from("community_role_catalog")
        .select("role_key,label")
        .order("position", { ascending: true }),
    ]);

    if (spaceResult.error) {
      setSchemaReady(false);
      setSpaces([]);
      setError("El esquema de comunidades PreICFES todavía no está disponible. La migración está preparada en GitHub, pero no se ha aplicado al proyecto activo.");
      setLoading(false);
      return;
    }

    const nextSpaces = (spaceResult.data ?? []) as Space[];
    setSpaces(nextSpaces);
    setCandidates((candidateResult.data ?? []) as Candidate[]);
    setRoles(((roleResult.data ?? []) as RoleOption[]).filter((role) => !ROLE_PROTECTED.has(role.role_key)));
    setSchemaReady(true);
    setSelectedSpaceId((current) => current && nextSpaces.some((space) => space.id === current)
      ? current
      : nextSpaces[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { void loadSpaces(); }, [loadSpaces]);

  useEffect(() => {
    if (!selectedSpaceId || !schemaReady) {
      setSpaceMembers([]);
      setSpaceChannels([]);
      return;
    }
    let active = true;
    async function loadSpaceDetail() {
      const [membershipResult, roleResult, channelResult] = await Promise.all([
        supabase.from("community_space_members")
          .select("user_id")
          .eq("space_id", selectedSpaceId),
        supabase.from("community_space_member_roles")
          .select("user_id,role_key")
          .eq("space_id", selectedSpaceId),
        supabase.from("community_channels")
          .select("id,slug,name,description,category,position,is_private,is_read_only,channel_type,icon_key,accent_color")
          .eq("space_id", selectedSpaceId)
          .eq("is_archived", false)
          .order("category", { ascending: true })
          .order("position", { ascending: true }),
      ]);
      if (!active) return;
      if (membershipResult.error || roleResult.error || channelResult.error) {
        setError("No se pudieron cargar los miembros o canales de este espacio.");
        return;
      }
      const userIds = [...new Set((membershipResult.data ?? []).map((row) => row.user_id))];
      const profileResult = userIds.length
        ? await supabase.from("community_member_profiles")
            .select("user_id,display_name,member_number")
            .in("user_id", userIds)
        : { data: [], error: null };
      if (!active) return;
      const roleMap = new Map<string, string[]>();
      (roleResult.data ?? []).forEach((row) => {
        const current = roleMap.get(row.user_id) ?? [];
        current.push(row.role_key);
        roleMap.set(row.user_id, current);
      });
      setSpaceMembers((profileResult.data ?? []).map((profile) => ({
        ...profile,
        role_keys: roleMap.get(profile.user_id) ?? [],
      })) as SpaceMember[]);
      setSpaceChannels((channelResult.data ?? []) as SpaceChannel[]);
    }
    void loadSpaceDetail();
    return () => { active = false; };
  }, [selectedSpaceId, schemaReady, detailRefresh]);

  useEffect(() => {
    if (creatingSpace) return;
    setSpaceForm(selectedSpace ? {
      slug: selectedSpace.slug,
      name: selectedSpace.name,
      description: selectedSpace.description,
      visibility: selectedSpace.visibility,
      icon_key: selectedSpace.icon_key,
      accent_color: selectedSpace.accent_color,
    } : EMPTY_SPACE);
  }, [selectedSpace, creatingSpace]);

  useEffect(() => {
    if (creatingChannel) return;
    setChannelForm(selectedChannel ? {
      slug: selectedChannel.slug,
      name: selectedChannel.name,
      description: selectedChannel.description,
      category: selectedChannel.category,
      position: selectedChannel.position,
      is_private: selectedChannel.is_private,
      is_read_only: selectedChannel.is_read_only,
      channel_type: selectedChannel.channel_type,
      icon_key: selectedChannel.icon_key,
      accent_color: selectedChannel.accent_color,
    } : EMPTY_CHANNEL);
  }, [selectedChannel, creatingChannel]);

  const roleOptions = useMemo(() => roles.length ? roles : [
    { role_key: "colaborador", label: "Colaborador PreICFES" },
    { role_key: "estudiante", label: "Estudiante" },
    { role_key: "docente", label: "Docente" },
  ], [roles]);

  async function post(url: string, payload: Record<string, unknown>, key: string) {
    if (pending) return false;
    setPending(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "No se pudo completar la solicitud.");
        return false;
      }
      setNotice("Cambios guardados correctamente.");
      setDetailRefresh((current) => current + 1);
      await loadSpaces();
      return true;
    } catch {
      setError("No se pudo completar la solicitud. Inténtalo de nuevo.");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function saveSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await post("/api/community/spaces", {
      action: creatingSpace ? "create" : "update",
      space_id: selectedSpace?.id ?? null,
      ...spaceForm,
    }, "space-save");
    if (ok) {
      setCreatingSpace(false);
      setSelectedTab("settings");
    }
  }

  async function archiveSpace() {
    if (!selectedSpace) return;
    const ok = await post("/api/community/spaces", {
      action: "archive",
      space_id: selectedSpace.id,
    }, "space-archive");
    if (ok) {
      setCreatingSpace(false);
      setSelectedTab("settings");
    }
  }

  async function assignSpaceRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSpace || !selectedMemberId) return;
    const ok = await post("/api/community/spaces/members", {
      action: "grant_role",
      space_id: selectedSpace.id,
      user_id: selectedMemberId,
      role_key: selectedRoleKey,
    }, "space-member-role");
    if (ok) {
      setSelectedMemberId("");
      const memberName = candidates.find((member) => member.user_id === selectedMemberId)?.display_name ?? "miembro";
      setNotice("Acceso y rol asignados a " + memberName + ".");
    }
  }

  async function removeSpaceRole(member: SpaceMember, roleKey: string) {
    if (!selectedSpace) return;
    const ok = await post("/api/community/spaces/members", {
      action: "revoke_role",
      space_id: selectedSpace.id,
      user_id: member.user_id,
      role_key: roleKey,
    }, "space-role-revoke");
    if (ok) setNotice("Rol retirado de " + member.display_name + ".");
  }

  async function removeSpaceMember(member: SpaceMember) {
    if (!selectedSpace) return;
    const ok = await post("/api/community/spaces/members", {
      action: "remove",
      space_id: selectedSpace.id,
      user_id: member.user_id,
    }, "space-member-remove");
    if (ok) setNotice(member.display_name + " ya no tiene acceso a este espacio.");
  }

  async function submitSpaceModeration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSpace || !moderationTarget) return;
    const payload: Record<string, unknown> = {
      space_id: selectedSpace.id,
      user_id: moderationTarget.user_id,
      action: moderationAction,
      reason: moderationReason.trim(),
    };
    if (moderationAction === "timeout") payload.duration_minutes = moderationDuration;

    const ok = await post("/api/community/spaces/moderation", payload, "space-moderation");
    if (ok) {
      setNotice(
        moderationAction === "kick" ? moderationTarget.display_name + " fue expulsado de este espacio." :
        moderationAction === "restore" ? "Se restauró el acceso de " + moderationTarget.display_name + "." :
          "Se aplicó un silencio temporal a " + moderationTarget.display_name + ".",
      );
      setModerationTarget(null);
      setModerationReason("");
    }
  }

  async function saveSpaceChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSpace) return;
    const ok = await post("/api/community/channels", {
      action: creatingChannel ? "create" : "update",
      channel_id: selectedChannel?.id ?? null,
      space_id: selectedSpace.id,
      ...channelForm,
    }, "space-channel-save");
    if (ok) {
      setCreatingChannel(false);
      setSelectedChannelId(null);
      setSelectedTab("channels");
    }
  }

  async function archiveSpaceChannel(channel: SpaceChannel) {
    if (!selectedSpace) return;
    const ok = await post("/api/community/channels", {
      action: "archive",
      channel_id: channel.id,
      space_id: selectedSpace.id,
    }, "space-channel-archive");
    if (ok) {
      setCreatingChannel(false);
      setSelectedChannelId(null);
    }
  }

  const subTab = (value: "settings" | "members" | "channels", label: string) => (
    <button type="button" onClick={() => { setSelectedTab(value); setError(""); setNotice(""); }}
      className={"border-b-2 px-3 py-3 text-[10px] font-semibold transition " +
        (selectedTab === value ? "border-[#01c8ef] text-white" : "border-transparent text-[#8095a5] hover:text-[#dce7ed]")}>{label}</button>
  );

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-[#263744] bg-[#0c141e] md:border-r md:border-b-0">
        <div className="flex min-h-[58px] items-center justify-between border-b border-[#253644] px-4">
          <span className="font-[var(--font-silkscreen)] text-[6px] tracking-[.1em] text-[#8198a9]">COMUNIDADES PREICFES</span>
          <button type="button" disabled={!schemaReady} onClick={() => { setCreatingSpace(true); setSpaceForm(EMPTY_SPACE); setSelectedSpaceId(null); }}
            className="grid h-8 w-8 place-items-center rounded-[5px] border border-[#3c6334] bg-[#1b2b1c] text-[#a9e794] hover:border-[#7fe05c] disabled:opacity-40" aria-label="Crear comunidad PreICFES">
            <Plus size={15}/>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? <p className="p-4 text-[11px] text-[#8095a5]">Cargando espacios…</p>
            : spaces.length === 0 ? <p className="p-4 text-[10px] leading-5 text-[#8095a5]">Todavía no hay comunidades PreICFES. Crea una para separar a los estudiantes y colaboradores por grupo.</p>
            : spaces.map((space) => (
              <button key={space.id} type="button" onClick={() => { setSelectedSpaceId(space.id); setCreatingSpace(false); }}
                className={"mb-1 flex w-full items-center gap-2 rounded-[6px] border px-2.5 py-2.5 text-left transition " + (!creatingSpace && selectedSpaceId === space.id
                  ? "border-[#2b5665] bg-[#142a35]" : "border-transparent hover:border-[#253b49] hover:bg-[#13212c]")}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border border-[#364d56] bg-[#15252c]" style={{ color: space.accent_color }}>
                  <GraduationCap size={16}/>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-[#dce7ed]">{space.name}</span>
                  <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-[#718b9b]">{space.visibility === "private" ? "Privada" : "Pública"}</span>
                </span>
                {space.visibility === "private" && <Lock size={12} className="text-[#d5af67]"/>}
              </button>
            ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden">
        {error && <p role="alert" className="mx-4 mt-3 rounded-[5px] border border-[#71363b] bg-[#301b20] px-3 py-2 text-[10px] text-[#ffb9bd]">{error}</p>}
        {notice && <p role="status" className="mx-4 mt-3 rounded-[5px] border border-[#3f643b] bg-[#17281b] px-3 py-2 text-[10px] text-[#b8e9aa]">{notice}</p>}
        {!schemaReady ? (
          <div className="m-5 rounded-[8px] border border-[#6b542e] bg-[#2c2417] p-4">
            <p className="text-[12px] font-semibold text-[#f0d59c]">Aislamiento PreICFES pendiente de migración</p>
            <p className="mt-2 text-[10px] leading-5 text-[#c7ab77]">La base activa aún no contiene el modelo de espacios. La migración está versionada en GitHub, pero no se ha ejecutado contra producción. No se pueden crear espacios hasta validar el historial y las políticas RLS.</p>
          </div>
        ) : (creatingSpace || selectedSpace) ? (
          <>
            <div className="border-b border-[#263744] px-5 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-[var(--font-silkscreen)] text-[6px] tracking-[.12em] text-[#8198a9]">ESPACIO INDEPENDIENTE</p>
                  <h3 className="mt-1.5 text-[16px] font-bold text-white">{creatingSpace ? "Crear comunidad PreICFES" : selectedSpace?.name}</h3>
                </div>
                {selectedSpace && <span className="rounded-[4px] border border-[#3c5361] bg-[#15232d] px-2 py-1 text-[8px] text-[#9fb5c1]">ID AISLADO</span>}
              </div>
              <div className="mt-3 flex gap-1">
                {subTab("settings", "Configuración")}
                {subTab("members", "Miembros y roles")}
                {subTab("channels", "Canales")}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {selectedTab === "settings" && (
                <form onSubmit={(event) => void saveSpace(event)} className="max-w-[720px] space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={LABEL}>Nombre de la comunidad
                      <input className={FIELD} required maxLength={60} value={spaceForm.name} onChange={(event) => setSpaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="PreICFES · Grupo Norte"/>
                    </label>
                    <label className={LABEL}>Identificador URL
                      <input className={FIELD} required maxLength={49} pattern="[a-z0-9][a-z0-9-]{1,48}" disabled={!creatingSpace} value={spaceForm.slug} onChange={(event) => setSpaceForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="preicfes-grupo-norte"/>
                    </label>
                  </div>
                  <label className={LABEL}>Descripción
                    <textarea className="mt-1.5 min-h-[72px] w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 py-2 text-[11px] text-[#e8eef3] outline-none focus:border-[#01c8ef]" maxLength={500} value={spaceForm.description} onChange={(event) => setSpaceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Comunidad de estudio y acompañamiento para este grupo PreICFES."/>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className={LABEL}>Visibilidad
                      <select className={FIELD} value={spaceForm.visibility} onChange={(event) => setSpaceForm((current) => ({ ...current, visibility: event.target.value as "public" | "private" }))}>
                        <option value="private">Privada · por invitación</option>
                        <option value="public">Pública · visible a estudiantes</option>
                      </select>
                    </label>
                    <label className={LABEL}>Icono
                      <select className={FIELD} value={spaceForm.icon_key} onChange={(event) => setSpaceForm((current) => ({ ...current, icon_key: event.target.value }))}>
                        <option value="graduation-cap">Graduación</option><option value="book-open">Libro</option><option value="users">Grupo</option>
                      </select>
                    </label>
                    <label className={LABEL}>Acento visual
                      <div className="mt-1.5 flex h-10 items-center gap-2 rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-2">
                        <input type="color" value={spaceForm.accent_color} onChange={(event) => setSpaceForm((current) => ({ ...current, accent_color: event.target.value }))} className="h-7 w-8 cursor-pointer bg-transparent"/>
                        <span className="text-[10px] text-[#a2b4c0]">{spaceForm.accent_color.toUpperCase()}</span>
                      </div>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#293a47] pt-4">
                    {selectedSpace && <button type="button" onClick={() => void archiveSpace()} disabled={pending !== null}
                      className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#624044] px-3 py-2 text-[10px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40"><Archive size={12}/> Archivar espacio</button>}
                    <button type="submit" disabled={pending !== null || !spaceForm.name.trim() || !spaceForm.slug.trim()}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-4 py-2 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] hover:bg-[#91ed6b] disabled:opacity-40"><Save size={12}/> {creatingSpace ? "Crear espacio" : "Guardar cambios"}</button>
                  </div>
                </form>
              )}

              {selectedTab === "members" && selectedSpace && (
                <div className="max-w-[760px] space-y-4">
                  <div className="rounded-[7px] border border-[#2b414f] bg-[#0d1721] p-4">
                    <div className="mb-3 flex items-center gap-2"><Users size={15} className="text-[#01c8ef}"/><h4 className="text-[11px] font-bold text-[#e2ebf0]">Invitar y asignar rol del espacio</h4></div>
                    <form onSubmit={(event) => void assignSpaceRole(event)} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
                      <select className={FIELD + " mt-0"} required value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
                        <option value="">Selecciona un miembro…</option>
                        {candidates.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
                      </select>
                      <select className={FIELD + " mt-0"} value={selectedRoleKey} onChange={(event) => setSelectedRoleKey(event.target.value)}>
                        {roleOptions.map((role) => <option key={role.role_key} value={role.role_key}>{role.label}</option>)}
                      </select>
                      <button type="submit" disabled={!selectedMemberId || pending !== null}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-3 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] disabled:opacity-40"><Plus size={12}/> Asignar</button>
                    </form>
                    <p className="mt-2 text-[9px] leading-5 text-[#758b9b]">El rol Colaborador PreICFES solo permite moderar esta comunidad. No otorga permisos de administrador global.</p>
                  </div>
                  <div className="rounded-[7px] border border-[#273a48]">
                    <div className="flex items-center justify-between border-b border-[#273a48] px-4 py-3">
                      <h4 className="text-[11px] font-bold text-[#e2ebf0]">Miembros del espacio</h4>
                      <span className="text-[9px] tabular-nums text-[#8298a7]">{spaceMembers.length} miembros</span>
                    </div>
                    {spaceMembers.map((member) => (
                      <div key={member.user_id} className="flex flex-wrap items-center gap-3 border-b border-[#202f3b] px-4 py-3 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-[#e2ebf0]">{member.display_name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {member.role_keys.map((roleKey) => <span key={roleKey} className={"rounded-[3px] border px-1.5 py-0.5 text-[8px] " + (roleKey === "colaborador" ? "border-[#80673b] bg-[#342a18] text-[#e5c27d]" : "border-[#36505f] bg-[#14232d] text-[#9bb5c2]")}>{roleOptions.find((role) => role.role_key === roleKey)?.label ?? roleKey}</span>)}
                            {!member.role_keys.length && <span className="text-[8px] text-[#748a99]">Miembro</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {member.role_keys.includes("colaborador") && <button type="button" onClick={() => void removeSpaceRole(member,"colaborador")} disabled={pending !== null}
                            className="rounded-[4px] border border-[#624d32] px-2 py-1.5 text-[9px] text-[#dfbf84] hover:bg-[#302719] disabled:opacity-40">Retirar colaborador</button>}
                          <button type="button" onClick={() => { setModerationTarget(member); setModerationAction("timeout"); setModerationReason(""); }} disabled={pending !== null}
                            className="rounded-[4px] border border-[#5f583a] px-2 py-1.5 text-[9px] text-[#e4ca88] hover:bg-[#302a1c] disabled:opacity-40">Silenciar</button>
                          <button type="button" onClick={() => { setModerationTarget(member); setModerationAction("kick"); setModerationReason(""); }} disabled={pending !== null}
                            className="rounded-[4px] border border-[#624044] px-2 py-1.5 text-[9px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40">Expulsar</button>
                          <button type="button" onClick={() => { setModerationTarget(member); setModerationAction("restore"); setModerationReason(""); }} disabled={pending !== null}
                            className="rounded-[4px] border border-[#385d3a] px-2 py-1.5 text-[9px] text-[#b8e9aa] hover:bg-[#1a2b1c] disabled:opacity-40">Restaurar</button>
                          <button type="button" onClick={() => void removeSpaceMember(member)} disabled={pending !== null}
                            className="rounded-[4px] border border-[#624044] px-2 py-1.5 text-[9px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40">Quitar acceso</button>
                        </div>
                      </div>
                    ))}
                    {spaceMembers.length === 0 && <p className="p-4 text-[10px] text-[#8095a5]">Todavía no hay miembros invitados.</p>}
                  </div>
                </div>
              )}

              {selectedTab === "channels" && selectedSpace && (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                  <aside className="rounded-[7px] border border-[#273a48] bg-[#0d1721] p-2">
                    <div className="flex items-center justify-between px-2 py-2">
                      <span className="font-[var(--font-silkscreen)] text-[6px] tracking-[.1em] text-[#8198a9]">CANALES</span>
                      <button type="button" onClick={() => { setCreatingChannel(true); setChannelForm(EMPTY_CHANNEL); setSelectedChannelId(null); }}
                        className="grid h-7 w-7 place-items-center rounded-[5px] border border-[#3c6334] bg-[#1b2b1c] text-[#a9e794]"><Plus size={13}/></button>
                    </div>
                    {spaceChannels.map((channel) => (
                      <button key={channel.id} type="button" onClick={() => { setSelectedChannelId(channel.id); setCreatingChannel(false); }}
                        className={"mb-1 flex w-full items-center gap-2 rounded-[5px] border px-2 py-2 text-left " + (!creatingChannel && selectedChannelId === channel.id ? "border-[#2b5665] bg-[#142a35]" : "border-transparent hover:bg-[#13212c]")}>
                        {channel.channel_type === "announcement" ? <Megaphone size={13} style={{ color: channel.accent_color }}/> : <Hash size={13} style={{ color: channel.accent_color }}/>}
                        <span className="min-w-0 flex-1 truncate text-[10px] text-[#dce7ed]">{channel.name}</span>
                      </button>
                    ))}
                    {spaceChannels.length === 0 && <p className="px-2 py-3 text-[9px] text-[#788f9d]">Este espacio todavía no tiene canales.</p>}
                  </aside>
                  <section>
                    {(creatingChannel || selectedChannel) && (
                      <form onSubmit={(event) => void saveSpaceChannel(event)} className="space-y-3 rounded-[7px] border border-[#273a48] bg-[#0d1721] p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-bold text-[#e2ebf0]">{creatingChannel ? "Crear canal del espacio" : selectedChannel?.name}</h4>
                          {selectedChannel && !creatingChannel && <button type="button" onClick={() => void archiveSpaceChannel(selectedChannel)} disabled={pending !== null}
                            className="inline-flex items-center gap-1 rounded-[4px] border border-[#624044] px-2 py-1.5 text-[9px] text-[#efb1b2]"><Trash2 size={11}/> Archivar</button>}
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <label className={LABEL}>Nombre
                            <input className={FIELD} value={channelForm.name} maxLength={60} required onChange={(event) => setChannelForm((current) => ({ ...current, name: event.target.value }))}/>
                          </label>
                          <label className={LABEL}>Slug
                            <input className={FIELD} value={channelForm.slug} maxLength={49} required disabled={!creatingChannel} onChange={(event) => setChannelForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}/>
                          </label>
                        </div>
                        <label className={LABEL}>Descripción
                          <textarea className="mt-1.5 min-h-[56px] w-full rounded-[6px] border border-[#2b414f] bg-[#101b26] px-3 py-2 text-[10px] text-[#e8eef3]" value={channelForm.description} maxLength={240} onChange={(event) => setChannelForm((current) => ({ ...current, description: event.target.value }))}/>
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label className={LABEL}>Categoría
                            <input className={FIELD} value={channelForm.category} maxLength={40} onChange={(event) => setChannelForm((current) => ({ ...current, category: event.target.value }))}/>
                          </label>
                          <label className={LABEL}>Orden
                            <input className={FIELD} type="number" min={0} max={1000} value={channelForm.position} onChange={(event) => setChannelForm((current) => ({ ...current, position: Number(event.target.value) }))}/>
                          </label>
                          <label className={LABEL}>Tipo
                            <select className={FIELD} value={channelForm.channel_type} onChange={(event) => setChannelForm((current) => ({ ...current, channel_type: event.target.value as "text" | "announcement" }))}>
                              <option value="text">Texto</option><option value="announcement">Anuncios</option>
                            </select>
                          </label>
                          <label className={LABEL}>Icono
                            <select className={FIELD} value={channelForm.icon_key} onChange={(event) => setChannelForm((current) => ({ ...current, icon_key: event.target.value }))}>
                              <option value="hash">Hash</option><option value="megaphone">Megáfono</option><option value="book-open">Libro</option><option value="graduation-cap">Graduación</option>
                            </select>
                          </label>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 border-t border-[#293a47] pt-3">
                          <label className="inline-flex items-center gap-2 text-[9px] text-[#9cafbb]"><input type="checkbox" checked={channelForm.is_private} onChange={(event) => setChannelForm((current) => ({ ...current, is_private: event.target.checked }))}/> Solo colaboradores</label>
                          <label className="inline-flex items-center gap-2 text-[9px] text-[#9cafbb]"><input type="checkbox" checked={channelForm.is_read_only} onChange={(event) => setChannelForm((current) => ({ ...current, is_read_only: event.target.checked }))}/> Solo lectura</label>
                          <label className="ml-auto inline-flex items-center gap-2 text-[9px] text-[#9cafbb]">Acento
                            <input type="color" value={channelForm.accent_color} onChange={(event) => setChannelForm((current) => ({ ...current, accent_color: event.target.value }))} className="h-7 w-8 cursor-pointer bg-transparent"/>
                          </label>
                          <button type="submit" disabled={pending !== null || !channelForm.name.trim() || !channelForm.slug.trim()}
                            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-3 py-2 text-[10px] font-bold text-[#0b160c]"><Save size={11}/> Guardar canal</button>
                        </div>
                      </form>
                    )}
                    {!creatingChannel && !selectedChannel && <p className="rounded-[7px] border border-dashed border-[#334a58] p-7 text-center text-[10px] text-[#748a99]">Selecciona un canal o crea uno nuevo para esta comunidad.</p>}
                  </section>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="m-auto max-w-[440px] p-8 text-center">
            <GraduationCap size={28} className="mx-auto text-[#8299a7]"/>
            <h3 className="mt-3 text-[14px] font-bold text-white">Tus comunidades PreICFES</h3>
            <p className="mt-2 text-[10px] leading-5 text-[#8298a7]">Crea un espacio independiente, separa a sus miembros y asigna colaboradores con permisos limitados a esa comunidad.</p>
          </div>
        )}
      </section>

      {moderationTarget && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-[#05080dcc] p-3 backdrop-blur-[4px]"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setModerationTarget(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="space-moderation-title"
            className="w-full max-w-[470px] overflow-hidden rounded-[9px] border border-[#354856] bg-[#101a23] text-[#e8eef3] shadow-[0_25px_80px_rgba(0,0,0,.55)]">
            <header className="flex items-center justify-between border-b border-[#293b48] bg-[#0b131b] px-5 py-4">
              <div>
                <p className="font-[var(--font-silkscreen)] text-[6px] tracking-[.1em] text-[#8198a9]">MODERACIÓN DEL ESPACIO</p>
                <h3 id="space-moderation-title" className="mt-1 text-[14px] font-bold text-white">{moderationAction === "kick" ? "Expulsar miembro" : moderationAction === "restore" ? "Restaurar acceso" : "Silenciar temporalmente"}</h3>
              </div>
              <button type="button" onClick={() => setModerationTarget(null)} className="grid h-8 w-8 place-items-center rounded-[5px] text-[#a7b7c3] hover:bg-[#1b2a35]" aria-label="Cerrar"><span>×</span></button>
            </header>
            <form onSubmit={(event) => void submitSpaceModeration(event)} className="space-y-4 p-5">
              <p className="text-[11px] text-[#a9bbc5]">Miembro: <strong className="text-white">{moderationTarget.display_name}</strong></p>
              <label className={LABEL}>Motivo de la medida
                <textarea required minLength={3} maxLength={500} value={moderationReason} onChange={(event) => setModerationReason(event.target.value)}
                  className="mt-1.5 min-h-[90px] w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 py-2 text-[11px] text-[#e8eef3] outline-none focus:border-[#01c8ef]"
                  placeholder="Describe la infracción o el motivo de restauración."/>
              </label>
              {moderationAction === "timeout" && (
                <label className={LABEL}>Duración
                  <select className={FIELD} value={moderationDuration} onChange={(event) => setModerationDuration(Number(event.target.value))}>
                    <option value={10}>10 minutos</option><option value={60}>1 hora</option><option value={360}>6 horas</option><option value={1440}>24 horas</option><option value={10080}>7 días</option>
                  </select>
                </label>
              )}
              <div className="flex justify-end gap-2 border-t border-[#293a47] pt-4">
                <button type="button" onClick={() => setModerationTarget(null)} className="rounded-[5px] border border-[#334a58] px-3 py-2 text-[10px] text-[#a7bac6] hover:bg-[#182630]">Cancelar</button>
                <button type="submit" disabled={pending !== null || moderationReason.trim().length < 3}
                  className="rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-4 py-2 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] disabled:opacity-40">
                  {pending === "space-moderation" ? "Aplicando…" : "Confirmar medida"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
