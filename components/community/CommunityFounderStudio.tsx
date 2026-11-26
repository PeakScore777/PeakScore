"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import {
  Search, ShieldCheck, X, UserRound, Check, Plus, Minus, RefreshCw,
  Trash2, Hash, Megaphone, Lock, Eye, EyeOff, MessageSquare, Paperclip,
  Smile, Archive, Save, SlidersHorizontal, GraduationCap, Palette, ImagePlus, FolderPlus, Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser";
import CommunitySpacesStudio from "@/components/community/CommunitySpacesStudio";

const GLOBAL_COMMUNITY_SPACE_ID = "00000000-0000-4000-8000-000000000001";

type Member = {
  user_id: string;
  display_name: string;
  avatar_path: string | null;
  member_number: number | null;
  role_keys: string[];
};

type PermissionKey = "view_channels" | "send_messages" | "attach_files" | "add_reactions";
type RolePermissions = Record<PermissionKey, boolean>;
type Role = {
  role_key: string;
  label: string;
  description: string;
  badge_color: string;
  display_as_badge: boolean;
  position: number;
  mentionable: boolean;
  hoist: boolean;
  is_system: boolean;
  permissions: RolePermissions;
};

type Channel = {
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

type ChannelForm = Omit<Channel, "id">;
type Category = { id: string; name: string; position: number; is_archived: boolean };
type CategoryForm = { name: string; position: number };

type Tab = "branding" | "members" | "roles" | "channels" | "spaces";
type GlobalBrandingForm = {
  name: string; description: string; icon_key: string; accent_color: string; background_color: string;
  icon_path: string | null; banner_path: string | null; icon_url: string | null; banner_url: string | null;
};
const EMPTY_GLOBAL_BRANDING: GlobalBrandingForm = {
  name: "PeakScore Community", description: "Comunidad global de PeakScore.", icon_key: "users",
  accent_color: "#7FE05C", background_color: "#171C24",
  icon_path: null, banner_path: null, icon_url: null, banner_url: null,
};
type Props = {
  onClose: () => void;
  initialTab?: Tab;
  initialAction?: "create-channel" | "create-category" | null;
  initialChannelId?: string | null;
  onAssetUpdated?: (assetType: "icon" | "banner", path: string, url: string) => void;
};

const PROTECTED_ROLE = "fundador";
const DEFAULT_PERMISSIONS: RolePermissions = {
  view_channels: true,
  send_messages: true,
  attach_files: true,
  add_reactions: true,
};
const PERMISSION_LABELS: Array<{ key: PermissionKey; label: string; description: string; icon: typeof Eye }> = [
  { key: "view_channels", label: "Ver canales", description: "Leer los canales a los que el miembro tenga acceso.", icon: Eye },
  { key: "send_messages", label: "Enviar mensajes", description: "Publicar mensajes y responder en canales habilitados.", icon: MessageSquare },
  { key: "attach_files", label: "Adjuntar archivos", description: "Subir imágenes permitidas en el chat.", icon: Paperclip },
  { key: "add_reactions", label: "Añadir reacciones", description: "Reaccionar a los mensajes de otros miembros.", icon: Smile },
];
const CATEGORIES = [
  { value: "COMUNIDAD", label: "Comunidad" },
  { value: "MATERIAS", label: "Materias" },
  { value: "PROFESORES", label: "Profesores" },
  { value: "AULAS Y EVENTOS", label: "Aulas y eventos" },
];

const emptyRole = () => ({
  role_key: "",
  label: "",
  description: "",
  badge_color: "#01C8EF",
  display_as_badge: true,
  position: 100,
  mentionable: false,
  hoist: false,
  permissions: { ...DEFAULT_PERMISSIONS },
});

const emptyChannel = (): ChannelForm => ({
  slug: "",
  name: "",
  description: "",
  category: "COMUNIDAD",
  position: 10,
  is_private: false,
  is_read_only: false,
  channel_type: "text",
  icon_key: "hash",
  accent_color: "#01C8EF",
});

function normalizePermissions(value: unknown): RolePermissions {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    view_channels: source.view_channels === true,
    send_messages: source.send_messages === true,
    attach_files: source.attach_files === true,
    add_reactions: source.add_reactions === true,
  };
}

function toRoleForm(role: Role | null) {
  return role ? {
    role_key: role.role_key,
    label: role.label,
    description: role.description,
    badge_color: role.badge_color,
    display_as_badge: role.display_as_badge,
    position: role.position,
    mentionable: role.mentionable,
    hoist: role.hoist,
    permissions: { ...role.permissions },
  } : emptyRole();
}

function toChannelForm(channel: Channel | null): ChannelForm {
  return channel ? {
    slug: channel.slug,
    name: channel.name,
    description: channel.description,
    category: channel.category,
    position: channel.position,
    is_private: channel.is_private,
    is_read_only: channel.is_read_only,
    channel_type: channel.channel_type,
    icon_key: channel.icon_key,
    accent_color: channel.accent_color,
  } : emptyChannel();
}

export default function CommunityFounderStudio({
  onClose,
  initialTab = "branding",
  initialAction = null,
  initialChannelId = null,
  onAssetUpdated,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [globalBranding, setGlobalBranding] = useState<GlobalBrandingForm>({ ...EMPTY_GLOBAL_BRANDING });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingAssetPending, setBrandingAssetPending] = useState<"icon" | "banner" | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesReady, setCategoriesReady] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ name: "", position: 100 });
  const [isCreatingCategory, setIsCreatingCategory] = useState(initialAction === "create-category");
  const [query, setQuery] = useState("");
  const [selectedRoleKey, setSelectedRoleKey] = useState("administrador");
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(initialChannelId);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [channelForm, setChannelForm] = useState<ChannelForm>(() => emptyChannel());
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(initialAction === "create-channel");
  const [loading, setLoading] = useState(true);
  const [catalogReady, setCatalogReady] = useState(false);
  const [channelsReady, setChannelsReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const [memberResult, assignmentResult, roleExtended, channelExtended, globalBrandingExtended, categoryExtended] = await Promise.all([
      supabase.from("community_member_profiles")
        .select("user_id,display_name,avatar_path,member_number")
        .order("display_name", { ascending: true })
        .limit(300),
      supabase.from("community_member_roles")
        .select("user_id,role_key")
        .limit(2_000),
      supabase.from("community_role_catalog")
        .select("role_key,label,description,badge_color,display_as_badge,position,mentionable,hoist,is_system,permissions")
        .order("position", { ascending: true }),
      supabase.from("community_channels")
        .select("id,slug,name,description,category,position,is_private,is_read_only,channel_type,icon_key,accent_color")
        .eq("space_id", GLOBAL_COMMUNITY_SPACE_ID)
        .eq("is_archived", false)
        .order("category", { ascending: true })
        .order("position", { ascending: true }),
      supabase.from("community_spaces")
        .select("id,name,description,icon_key,accent_color,background_color,icon_path,banner_path")
        .eq("id", GLOBAL_COMMUNITY_SPACE_ID)
        .eq("space_type", "global")
        .eq("is_enabled", true)
        .maybeSingle(),
      supabase.from("community_channel_categories")
        .select("id,name,position,is_archived")
        .eq("space_id", GLOBAL_COMMUNITY_SPACE_ID)
        .eq("is_archived", false)
        .order("position", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    let globalBrandingRow = globalBrandingExtended.data;
    if (globalBrandingExtended.error && ["42703", "PGRST204", "PGRST205"].includes(globalBrandingExtended.error.code ?? "")) {
      const legacyBranding = await supabase.from("community_spaces")
        .select("id,name,description,icon_key,accent_color")
        .eq("id", GLOBAL_COMMUNITY_SPACE_ID)
        .eq("space_type", "global")
        .eq("is_enabled", true)
        .maybeSingle();
      globalBrandingRow = legacyBranding.data
        ? { ...legacyBranding.data, background_color: EMPTY_GLOBAL_BRANDING.background_color, icon_path: null, banner_path: null }
        : null;
    }
    if (globalBrandingRow) {
      setGlobalBranding({
        name: globalBrandingRow.name ?? EMPTY_GLOBAL_BRANDING.name,
        description: globalBrandingRow.description ?? "",
        icon_key: globalBrandingRow.icon_key ?? "users",
        accent_color: globalBrandingRow.accent_color ?? "#7FE05C",
        background_color: globalBrandingRow.background_color ?? EMPTY_GLOBAL_BRANDING.background_color,
        icon_path: globalBrandingRow.icon_path ?? null,
        banner_path: globalBrandingRow.banner_path ?? null,
        icon_url: globalBrandingRow.icon_path
          ? supabase.storage.from("community-profile-avatars").getPublicUrl(globalBrandingRow.icon_path).data.publicUrl
          : null,
        banner_url: globalBrandingRow.banner_path
          ? supabase.storage.from("community-profile-avatars").getPublicUrl(globalBrandingRow.banner_path).data.publicUrl
          : null,
      });
    }

    if (memberResult.error || assignmentResult.error) {
      setError("No se pudo cargar el directorio de miembros. Verifica las políticas de la comunidad.");
      setLoading(false);
      return;
    }

    let roleRows = roleExtended.data;
    let roleIsReady = !roleExtended.error;
    if (roleExtended.error) {
      const legacy = await supabase.from("community_role_catalog")
        .select("role_key,label,description,badge_color,display_as_badge")
        .order("label", { ascending: true });
      roleRows = (legacy.data ?? []).map((role) => ({
        ...role,
        position: 100,
        mentionable: false,
        hoist: false,
        is_system: ["fundador", "administrador", "moderador", "profesor", "docente", "estudiante"].includes(role.role_key),
        permissions: { ...DEFAULT_PERMISSIONS },
      }));
      roleIsReady = false;
    }

    let channelRows = channelExtended.data;
    let channelsAreReady = !channelExtended.error;
    if (channelExtended.error) {
      const legacy = await supabase.from("community_channels")
        .select("id,slug,name,description,category,position,is_private,is_read_only")
        .eq("is_archived", false)
        .order("position", { ascending: true });
      channelRows = (legacy.data ?? []).map((channel) => ({
        ...channel,
        channel_type: "text" as const,
        icon_key: "hash",
        accent_color: "#01C8EF",
      }));
      channelsAreReady = false;
    }

    const assignmentMap = new Map<string, string[]>();
    (assignmentResult.data ?? []).forEach((row: { user_id: string; role_key: string }) => {
      const current = assignmentMap.get(row.user_id) ?? [];
      current.push(row.role_key);
      assignmentMap.set(row.user_id, current);
    });

    setMembers((memberResult.data ?? []).map((member) => ({
      ...member,
      role_keys: assignmentMap.get(member.user_id) ?? [],
    })) as Member[]);
    const nextRoles = ((roleRows ?? []) as Array<Record<string, unknown>>).map((role) => ({
      role_key: String(role.role_key),
      label: String(role.label),
      description: String(role.description ?? ""),
      badge_color: String(role.badge_color ?? "#01C8EF"),
      display_as_badge: Boolean(role.display_as_badge),
      position: Number(role.position ?? 100),
      mentionable: Boolean(role.mentionable),
      hoist: Boolean(role.hoist),
      is_system: Boolean(role.is_system),
      permissions: normalizePermissions(role.permissions),
    })).sort((a, b) => a.position - b.position || a.label.localeCompare(b.label, "es")) as Role[];
    const defaultRole = nextRoles.find((role) => role.role_key === "administrador") ?? nextRoles[0] ?? null;
    setRoles(nextRoles);
    setSelectedRoleKey((current) => nextRoles.some((role) => role.role_key === current)
      ? current
      : defaultRole?.role_key ?? "administrador");
    setRoleForm((current) => current.role_key ? current : toRoleForm(defaultRole));
    setChannels((channelRows ?? []) as Channel[]);
    const categoryRows = categoryExtended.data ?? [];
    setCategories(categoryRows.map((category) => ({
      id: String(category.id),
      name: String(category.name),
      position: Number(category.position ?? 100),
      is_archived: Boolean(category.is_archived),
    })));
    setCategoriesReady(!categoryExtended.error);
    setCatalogReady(roleIsReady);
    setChannelsReady(channelsAreReady);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (active) await load();
    })();
    return () => { active = false; };
  }, [load]);

  useEffect(() => {
    if (!initialChannelId || channels.length === 0) return;
    const target = channels.find((channel) => channel.id === initialChannelId);
    if (!target) return;
    setTab("channels");
    setIsCreatingCategory(false);
    setIsCreatingChannel(false);
    setSelectedCategoryId(null);
    setSelectedChannelId(target.id);
    setChannelForm(toChannelForm(target));
  }, [channels, initialChannelId]);

  const visibleMembers = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return members;
    return members.filter((member) =>
      member.display_name.toLocaleLowerCase("es").includes(needle)
      || String(member.member_number ?? "").includes(needle)
      || member.role_keys.some((key) => key.toLocaleLowerCase("es").includes(needle)),
    );
  }, [members, query]);

  const selectedRole = roles.find((role) => role.role_key === selectedRoleKey) ?? null;
  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const categoryOptions = categoriesReady && categories.length > 0
    ? categories.map((category) => category.name)
    : CATEGORIES.map((category) => category.value);

  async function postJson(url: string, payload: Record<string, unknown>, key: string) {
    if (pendingKey) return false;
    setPendingKey(key);
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
        setError(data?.error ?? "No se pudo completar la operación.");
        return false;
      }
      setNotice("Cambios guardados correctamente.");
      await load();
      return true;
    } catch {
      setError("No se pudo completar la solicitud. Inténtalo de nuevo.");
      return false;
    } finally {
      setPendingKey(null);
    }
  }

  async function saveGlobalBranding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (brandingSaving) return;
    setBrandingSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/community/branding", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: globalBranding.name,
          description: globalBranding.description,
          icon_key: globalBranding.icon_key,
          accent_color: globalBranding.accent_color,
          background_color: globalBranding.background_color,
        }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "No se pudo guardar la identidad global. Comprueba que la migración esté aplicada.");
        return;
      }
      setNotice("Identidad global guardada. Actualizando la comunidad…");
      window.location.reload();
    } catch {
      setError("No se pudo guardar la identidad de la comunidad.");
    } finally {
      setBrandingSaving(false);
    }
  }

  async function uploadGlobalBrandingAsset(assetType: "icon" | "banner", file: File) {
    if (brandingAssetPending) return;
    setBrandingAssetPending(assetType);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("space_id", GLOBAL_COMMUNITY_SPACE_ID);
      form.set("asset_type", assetType);
      form.set("file", file);
      const response = await fetch("/api/community/spaces/assets", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const data = await response.json().catch(() => null) as {
        error?: string; assetPath?: string; assetUrl?: string;
      } | null;
      if (!response.ok || !data?.assetPath || !data.assetUrl) {
        setError(data?.error ?? "No se pudo subir la imagen de la comunidad.");
        return;
      }
      setGlobalBranding((current) => ({
        ...current,
        [assetType === "icon" ? "icon_path" : "banner_path"]: data.assetPath!,
        [assetType === "icon" ? "icon_url" : "banner_url"]: data.assetUrl!,
      }));
      onAssetUpdated?.(assetType, data.assetPath, data.assetUrl);
      setNotice(assetType === "icon"
        ? "Icono actualizado y publicado en la comunidad."
        : "Portada actualizada y publicada en la comunidad.");
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setBrandingAssetPending(null);
    }
  }

  async function changeMemberRole(member: Member, roleKey: string, action: "grant" | "revoke") {
    const ok = await postJson("/api/community/roles", {
      target_user_id: member.user_id,
      role_key: roleKey,
      action,
    }, member.user_id + ":" + roleKey);
    if (ok) setNotice(action === "grant"
      ? "Rol asignado a " + member.display_name + "."
      : "Rol retirado de " + member.display_name + ".");
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalogReady) {
      setError("Primero debe aplicarse la migración de roles y permisos en un entorno validado.");
      return;
    }
    const payload = {
      action: isCreatingRole ? "create" : "update",
      role_key: roleForm.role_key,
      label: roleForm.label,
      description: roleForm.description,
      badge_color: roleForm.badge_color,
      display_as_badge: roleForm.display_as_badge,
      position: roleForm.position,
      mentionable: roleForm.mentionable,
      hoist: roleForm.hoist,
      permissions: roleForm.permissions,
    };
    const ok = await postJson("/api/community/roles/catalog", payload, "role-save");
    if (ok) {
      setIsCreatingRole(false);
      setSelectedRoleKey(roleForm.role_key);
    }
  }

  async function deleteRole() {
    if (!selectedRole || selectedRole.is_system) return;
    const ok = await postJson("/api/community/roles/catalog", {
      action: "delete",
      role_key: selectedRole.role_key,
    }, "role-delete");
    if (ok) {
      const fallbackRole = roles.find((role) => role.role_key === "administrador") ?? null;
      setSelectedRoleKey(fallbackRole?.role_key ?? "administrador");
      setRoleForm(toRoleForm(fallbackRole));
      setIsCreatingRole(false);
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoriesReady || !categoryForm.name.trim()) {
      setError("No se pudo cargar la administración de categorías.");
      return;
    }
    const ok = await postJson("/api/community/categories", {
      action: isCreatingCategory ? "create" : "update",
      category_id: selectedCategory?.id ?? null,
      name: categoryForm.name.trim(),
      position: categoryForm.position,
    }, "category-save");
    if (ok) {
      setIsCreatingCategory(false);
      setSelectedCategoryId(null);
      setSelectedChannelId(null);
    }
  }

  async function archiveCategory(category: Category) {
    const ok = await postJson("/api/community/categories", {
      action: "archive",
      category_id: category.id,
    }, "category-archive");
    if (ok) {
      setSelectedCategoryId(null);
      setIsCreatingCategory(false);
      setIsCreatingChannel(false);
    }
  }

  async function saveChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!channelsReady) {
      setError("Primero debe aplicarse la migración de canales en un entorno validado.");
      return;
    }
    const ok = await postJson("/api/community/channels", {
      action: isCreatingChannel ? "create" : "update",
      channel_id: selectedChannel?.id ?? null,
      ...channelForm,
    }, "channel-save");
    if (ok) {
      setIsCreatingChannel(false);
      setSelectedChannelId(null);
    }
  }

  async function archiveChannel(channel: Channel) {
    const ok = await postJson("/api/community/channels", {
      action: "archive",
      channel_id: channel.id,
    }, "channel-archive");
    if (ok) {
      setSelectedChannelId(null);
      setIsCreatingChannel(false);
    }
  }

  const tabButton = (value: Tab, label: string, count?: number, description?: string) => {
    const Icon = value === "branding" ? Palette : value === "members" ? UserRound : value === "roles" ? ShieldCheck : value === "channels" ? Hash : GraduationCap;
    return <button type="button" onClick={() => { setTab(value); setError(""); setNotice(""); }}
      aria-current={tab === value ? "page" : undefined}
      className={"group flex w-full items-center gap-3 rounded-[7px] border px-3 py-2.5 text-left transition " +
        (tab === value ? "border-[#405a42] bg-[#19281c] text-white shadow-[inset_3px_0_0_#7fe05c]" : "border-transparent text-[#9aa9b8] hover:border-[#2b3b49] hover:bg-[#17212c] hover:text-white")}>
      <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border " +
        (tab === value ? "border-[#53764a] bg-[#223a24] text-[#a7e98e]" : "border-[#2a3b49] bg-[#121c26] text-[#91a4b4] group-hover:text-[#d8e4ec]")}><Icon size={15}/></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-[11px] font-semibold">{label}
        {count !== undefined && <span className="rounded-[4px] bg-[#1b2934] px-1.5 py-0.5 text-[9px] tabular-nums text-[#9bb3c1]">{count}</span>}</span>
        {description && <span className="mt-0.5 block truncate text-[9px] text-[#718494]">{description}</span>}</span>
    </button>;
  };

  const fieldClass = "mt-1.5 h-10 w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 text-[11px] text-[#e8eef3] outline-none transition placeholder:text-[#647a89] focus:border-[#01c8ef] focus:ring-2 focus:ring-[#01c8ef]/10";
  const labelClass = "block text-[10px] font-semibold tracking-wide text-[#a4b5c0]";

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#05080dcc] p-3 backdrop-blur-[5px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="ps-founder-title"
        className="flex h-[min(900px,94dvh)] max-h-[94dvh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[10px] border border-[#2b3c4a] bg-[#101720] text-[#e8eef3] shadow-[0_28px_100px_rgba(0,0,0,.55)]">
        <header className="flex min-h-[76px] items-center justify-between border-b border-[#27333e] bg-[#0e151d] px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] border border-[#547f42] bg-[#7fe05c] text-[#09140b] shadow-[0_3px_0_#315d28]"><ShieldCheck size={19}/></span>
            <div className="min-w-0"><p className="font-sans text-[10px] tracking-[.12em] text-[#8ca4b5]">PEAKSCORE COMMUNITY / CONFIGURACIÓN</p>
              <h2 id="ps-founder-title" className="mt-1 truncate text-[16px] font-bold text-white">Ajustes del servidor</h2></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar ajustes" className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] border border-[#2a3b48] text-[#a7b7c3] transition hover:border-[#71828f] hover:bg-[#1a2631] hover:text-white"><X size={18}/></button>
        </header>

        {(error || notice) && (
          <div className="px-5 pt-3 sm:px-7">
            {error && <p role="alert" className="rounded-[5px] border border-[#71363b] bg-[#301b20] px-3 py-2 text-[11px] text-[#ffb9bd]">{error}</p>}
            {notice && <p role="status" className="rounded-[5px] border border-[#3f643b] bg-[#17281b] px-3 py-2 text-[11px] text-[#b8e9aa]">{notice}</p>}
          </div>
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[236px] shrink-0 flex-col border-r border-[#273642] bg-[#0d151e] max-md:hidden">
            <div className="border-b border-[#263541] px-4 py-4"><p className="font-sans text-[9px] tracking-[.13em] text-[#7e94a4]">PEAKSCORE COMMUNITY</p>
              <div className="mt-3 flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#3b6240] bg-[#17281b] text-[#9eea86]"><ShieldCheck size={17}/></span>
                <span className="min-w-0"><span className="block truncate text-[11px] font-bold text-[#e8eff4]">Servidor PeakScore</span><span className="mt-0.5 block text-[9px] text-[#718594]">Panel del founder</span></span></div>
            </div>
            <div className="space-y-1.5 p-3"><p className="mb-2 px-2 font-sans text-[9px] tracking-[.12em] text-[#708696]">GESTIÓN DEL SERVIDOR</p>
              {tabButton("branding", "Identidad", undefined, "Nombre, icono y banner")}
              {tabButton("members", "Miembros", members.length, "Buscar y administrar personas")}
              {tabButton("roles", "Roles", roles.length, "Jerarquía y permisos")}
              {tabButton("channels", "Canales", channels.length, "Categorías y acceso")}
              {tabButton("spaces", "PreICFES", undefined, "Espacios y comunidades")}
            </div>
            <div className="mt-auto border-t border-[#263541] px-4 py-3"><div className="flex items-center gap-2 text-[9px] text-[#8b9ca8]"><span className="h-1.5 w-1.5 rounded-full bg-[#7fe05c] shadow-[0_0_8px_#7fe05c66]"/> Solo founder</div>
              <p className="mt-1.5 text-[9px] leading-4 text-[#617687]">Tus cambios de administración quedan protegidos y auditados.</p></div>
          </aside>
          <div className="min-w-0 flex-1 overflow-hidden bg-[#111a23]"><div className="hidden h-11 items-center gap-2 border-b border-[#263744] bg-[#101a24] px-5 max-md:flex">
              {tabButton("branding", "Identidad")}{tabButton("members", "Miembros", members.length)}{tabButton("roles", "Roles", roles.length)}{tabButton("channels", "Canales", channels.length)}{tabButton("spaces", "PreICFES")}
            </div><div className="h-full min-h-0 overflow-hidden">
          {tab === "branding" && (
            <div className="h-full min-h-0 overflow-y-auto p-5 sm:p-7">
              <form onSubmit={(event) => void saveGlobalBranding(event)} className="mx-auto max-w-[900px] space-y-5">
                <div>
                  <p className="text-[10px] font-bold tracking-[.16em] text-[#8ea0ad]">IDENTIDAD DEL SERVIDOR</p>
                  <h3 className="mt-1 text-[20px] font-bold text-white">Vista previa del servidor</h3>
                  <p className="mt-1 max-w-[650px] text-[11px] leading-5 text-[#99a6b4]">Personaliza el nombre, el icono y la portada que aparecen en la navegación y en la cabecera de la comunidad.</p>
                </div>
                <section className="grid gap-4 rounded-[12px] border border-[#303b46] bg-[#0d131a] p-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="flex flex-col items-center gap-3 rounded-[9px] border border-[#2c3742] bg-[#090d12] p-4">
                    <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[25px] border border-[#3b4651] bg-black shadow-[0_8px_28px_rgba(0,0,0,.35)]">
                      {globalBranding.icon_url
                        ? <Image src={globalBranding.icon_url} alt="Icono de la comunidad" width={96} height={96} unoptimized className="h-full w-full object-cover"/>
                        : <Image src="/peakscore/peakscore-community-mark.svg" alt="PeakScore" width={86} height={86} unoptimized className="h-[86px] w-[86px] object-contain"/>}
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[7px] border border-[#3b4c5a] bg-[#1a222b] px-3 py-2 text-[10px] font-semibold text-[#e2e7ed] hover:border-[#8bea45]">
                      <ImagePlus size={14}/>{brandingAssetPending === "icon" ? "Subiendo…" : "Cambiar icono"}
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={brandingAssetPending !== null}
                        onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadGlobalBrandingAsset("icon", file); event.currentTarget.value = ""; }}/>
                    </label>
                    <p className="text-center text-[9px] leading-4 text-[#788591]">PNG, JPG o WebP · máximo 5 MB</p>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="relative flex h-[150px] items-center overflow-hidden rounded-[9px] border border-[#333d49] bg-[#101720]" style={{ backgroundColor: globalBranding.background_color }}>
                      {globalBranding.banner_url
                        ? <Image src={globalBranding.banner_url} alt="Portada de la comunidad" fill unoptimized className="object-cover"/>
                        : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_15%_30%,rgba(0,213,232,.24),transparent_40%),radial-gradient(ellipse_at_90%_80%,rgba(139,234,69,.20),transparent_38%),linear-gradient(110deg,#080b10,#1a2028)]"/>}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/15 to-black/30"/>
                      <div className="relative z-10 flex flex-col items-start gap-2 px-5">
                        <p className="text-[21px] font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.7)]">{globalBranding.name || "PeakScore Community"}</p>
                        <span className="ps-community-preview-verified" title="Comunidad verificada" aria-label="Comunidad verificada">
                          <Check size={10} strokeWidth={3.2}/>
                        </span>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[7px] border border-[#3b4c5a] bg-[#1a222b] px-3 py-2 text-[10px] font-semibold text-[#e2e7ed] hover:border-[#8bea45]">
                      <ImagePlus size={14}/>{brandingAssetPending === "banner" ? "Subiendo…" : "Cambiar portada"}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={brandingAssetPending !== null}
                        onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadGlobalBrandingAsset("banner", file); event.currentTarget.value = ""; }}/>
                    </label>
                    <p className="text-[9px] leading-4 text-[#788591]">Portada panorámica: PNG, JPG, WebP o GIF animado · máximo 5 MB · hasta 60 fotogramas y 30 segundos. Solo el Founder puede cambiarla.</p>
                  </div>
                </section>
                <section className="grid gap-4 rounded-[12px] border border-[#303b46] bg-[#0d131a] p-4 sm:grid-cols-2">
                  <label className={labelClass}>Nombre visible
                    <input className={fieldClass} value={globalBranding.name} required minLength={2} maxLength={60}
                      onChange={(event) => setGlobalBranding((current) => ({ ...current, name: event.target.value }))}/>
                  </label>
                  <label className={labelClass}>Color de acento
                    <div className="mt-1.5 flex h-10 items-center gap-3 rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3">
                      <input type="color" value={globalBranding.accent_color}
                        onChange={(event) => setGlobalBranding((current) => ({ ...current, accent_color: event.target.value }))}
                        className="h-7 w-9 cursor-pointer bg-transparent"/>
                      <span className="text-[10px] font-mono text-[#c6d0d9]">{globalBranding.accent_color.toUpperCase()}</span>
                    </div>
                  </label>
                  <label className={labelClass}>Fondo predeterminado del servidor
                    <div className="mt-1.5 flex h-10 items-center gap-3 rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3">
                      <input type="color" value={globalBranding.background_color}
                        onChange={(event) => setGlobalBranding((current) => ({ ...current, background_color: event.target.value }))}
                        className="h-7 w-9 cursor-pointer bg-transparent"/>
                      <span className="text-[10px] font-mono text-[#c6d0d9]">{globalBranding.background_color.toUpperCase()}</span>
                    </div>
                    <span className="mt-1 block text-[9px] font-normal text-[#718796]">Se usa como apariencia inicial para quienes eligen “Servidor”.</span>
                  </label>
                  <label className={labelClass}>Identificador del icono
                    <select className={fieldClass} value={globalBranding.icon_key}
                      onChange={(event) => setGlobalBranding((current) => ({ ...current, icon_key: event.target.value }))}>
                      <option value="users">Comunidad</option><option value="graduation-cap">Graduación</option>
                      <option value="book-open">Libro</option><option value="mountain">PeakScore</option>
                    </select>
                  </label>
                  <label className={labelClass}>Descripción
                    <textarea className="mt-1.5 min-h-[80px] w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 py-2 text-[11px] text-[#e8eef3] outline-none focus:border-[#01c8ef]"
                      value={globalBranding.description} maxLength={500}
                      onChange={(event) => setGlobalBranding((current) => ({ ...current, description: event.target.value }))}/>
                  </label>
                </section>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#293642] pt-4">
                  <p className="max-w-[470px] text-[9px] leading-4 text-[#798693]">Los cambios de identidad se aplican al servidor global y se registran en la auditoría del Founder.</p>
                  <button type="submit" disabled={brandingSaving || brandingAssetPending !== null || globalBranding.name.trim().length < 2}
                    className="inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[#5eaa45] bg-[#8bea45] px-4 text-[11px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] hover:bg-[#a4f56b] disabled:opacity-50">
                    <Save size={14}/>{brandingSaving ? "Guardando…" : "Guardar identidad"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "members" && (
            <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-[#263744] bg-[#0c141e] md:border-r md:border-b-0">
                <div className="border-b border-[#253644] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">DIRECTORIO</p>
                    <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 text-[9px] text-[#8095a5] hover:text-[#01c8ef]">
                      <RefreshCw size={11}/> Actualizar
                    </button>
                  </div>
                  <div className="mt-3 flex h-10 items-center gap-2 rounded-[6px] border border-[#2b414f] bg-[#111d28] px-3 focus-within:border-[#01c8ef]">
                    <Search size={15} className="shrink-0 text-[#8098a9]"/>
                    <input value={query} onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar miembro..." aria-label="Buscar miembros"
                      className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[#687f90]"/>
                  </div>
                  <p className="mt-2 text-[9px] text-[#708797]">{members.length} miembros cargados · máximo 300 por vista</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {loading ? <div className="p-5 text-center text-[12px] text-[#8095a5]">Cargando directorio…</div>
                    : visibleMembers.length === 0 ? <div className="p-5 text-center text-[12px] text-[#8095a5]">No hay miembros que coincidan.</div>
                    : visibleMembers.map((member) => (
                      <article key={member.user_id} className="mb-1 flex items-center gap-2.5 rounded-[6px] border border-transparent px-2.5 py-2 hover:border-[#263d4b] hover:bg-[#14232d]">
                        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[#314956] bg-[#172a35] text-[10px] font-bold text-[#01c8ef]">
                          {member.avatar_path
                            ? <Image src={supabase.storage.from("community-profile-avatars").getPublicUrl(member.avatar_path).data.publicUrl} alt="" width={32} height={32} unoptimized className="h-full w-full object-cover"/>
                            : <UserRound size={15}/>}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-[#e2ebf0]">{member.display_name}</p>
                          <p className="text-[9px] text-[#708797]">{member.member_number ? "MIEMBRO " + String(member.member_number).padStart(4, "0") : "MIEMBRO"}</p>
                        </div>
                        <span className="text-[9px] tabular-nums text-[#718b9b]">{member.role_keys.length ? member.role_keys.length + " roles" : "—"}</span>
                      </article>
                    ))}
                </div>
              </aside>
              <section className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
                <p className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">ASIGNACIÓN DE AUTORIDAD</p>
                <h3 className="mt-2 text-[18px] font-bold text-white">Roles de PeakScore</h3>
                <p className="mt-2 max-w-[640px] text-[12px] leading-6 text-[#9aaebb]">
                  Asigna varios roles a cada miembro. Founder es único e intransferible; las asignaciones se validan en PostgreSQL y quedan auditadas.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {roles.filter((role) => role.role_key !== PROTECTED_ROLE).map((role) => (
                    <button key={role.role_key} type="button" onClick={() => setSelectedRoleKey(role.role_key)}
                      className={"rounded-[5px] border px-3 py-2 text-left transition " + (selectedRoleKey === role.role_key
                        ? "border-[#01c8ef] bg-[#112b36] text-white"
                        : "border-[#2a3b48] bg-[#121d27] text-[#9aafbd] hover:border-[#46616f]")}>
                      <span className="block text-[10px] font-semibold">{role.label}</span>
                      <span className="mt-1 block max-w-[155px] text-[9px] leading-4 text-[#738a99]">{role.description}</span>
                    </button>
                  ))}
                </div>
                {!catalogReady && <p className="mt-4 rounded-[5px] border border-[#6b542e] bg-[#2c2417] px-3 py-2 text-[10px] leading-5 text-[#edcb8d]">El editor avanzado de roles requiere la migración de catálogo y permisos. Las asignaciones existentes siguen visibles, pero las nuevas acciones no se activarán hasta validar la migración.</p>}
                <div className="mt-5 border-t border-[#263744] pt-3">
                  <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3 font-sans text-[9px] tracking-[.1em] text-[#7891a2]">
                    <span>MIEMBRO</span><span>ACCESO AL ROL</span>
                  </div>
                  {visibleMembers.map((member) => {
                    const role = roles.find((item) => item.role_key === selectedRoleKey);
                    const assigned = member.role_keys.includes(selectedRoleKey);
                    const key = member.user_id + ":" + selectedRoleKey;
                    return (
                      <div key={member.user_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#202f3b] py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-[#e2ebf0]">{member.display_name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {member.role_keys.map((roleKey) => {
                              const current = roles.find((item) => item.role_key === roleKey);
                              return current ? <span key={roleKey} className="rounded-[3px] border px-1.5 py-0.5 text-[9px]"
                                style={{ color: current.badge_color, borderColor: current.badge_color + "66", backgroundColor: current.badge_color + "10" }}>{current.label}</span> : null;
                            })}
                          </div>
                        </div>
                        <button type="button" disabled={!role || !catalogReady || pendingKey !== null || member.role_keys.includes(PROTECTED_ROLE)}
                          onClick={() => void changeMemberRole(member, selectedRoleKey, assigned ? "revoke" : "grant")}
                          className={"inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-[5px] border px-2.5 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 " + (assigned
                            ? "border-[#5d4545] bg-[#2b1e22] text-[#f2abab] hover:bg-[#392428]"
                            : "border-[#456d39] bg-[#1b2a1c] text-[#a9e794] hover:border-[#7fe05c] hover:bg-[#223824]")}>
                          {pendingKey === key ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"/>
                            : assigned ? <><Minus size={12}/> Retirar</> : <><Plus size={12}/> Asignar</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {tab === "roles" && (
            <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-[#263744] bg-[#0c141e] md:border-r md:border-b-0">
                <div className="flex items-center justify-between border-b border-[#253644] p-4">
                  <span className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">CATÁLOGO DE ROLES</span>
                  <button type="button" onClick={() => { setIsCreatingRole(true); setRoleForm(emptyRole()); }}
                    disabled={!catalogReady} className="grid h-8 w-8 place-items-center rounded-[5px] border border-[#3c6334] bg-[#1b2b1c] text-[#a9e794] hover:border-[#7fe05c] disabled:opacity-40" aria-label="Crear rol">
                    <Plus size={15}/>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {roles.map((role) => (
                    <button key={role.role_key} type="button"
                      onClick={() => { setIsCreatingRole(false); setSelectedRoleKey(role.role_key); setRoleForm(toRoleForm(role)); }}
                      className={"mb-1 flex w-full items-center gap-2 rounded-[6px] border px-2.5 py-2 text-left transition " + (!isCreatingRole && selectedRoleKey === role.role_key
                        ? "border-[#2b5665] bg-[#142a35]"
                        : "border-transparent hover:border-[#253b49] hover:bg-[#13212c]")}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: role.badge_color }}/>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#dce7ed]">{role.label}</span>
                      {role.is_system && <span className="text-[10px] font-semibold tracking-wide text-[#718b9b]">SISTEMA</span>}
                    </button>
                  ))}
                </div>
              </aside>
              <section className="min-h-0 overflow-y-auto p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">{isCreatingRole ? "NUEVA DEFINICIÓN" : "CONFIGURACIÓN DEL ROL"}</p>
                    <h3 className="mt-2 text-[18px] font-bold text-white">{isCreatingRole ? "Crear rol personalizado" : selectedRole?.label ?? "Selecciona un rol"}</h3>
                    <p className="mt-1 text-[11px] text-[#849aa9]">Jerarquía, identidad visual y capacidades de participación.</p>
                  </div>
                  {selectedRole?.is_system && !isCreatingRole && <span className="rounded-[4px] border border-[#3a4d5b] bg-[#17232d] px-2 py-1 text-[9px] font-semibold tracking-wide text-[#a7bac6]">ROL PROTEGIDO</span>}
                </div>

                {!catalogReady && <p className="mt-4 rounded-[5px] border border-[#6b542e] bg-[#2c2417] px-3 py-2 text-[10px] leading-5 text-[#edcb8d]">La migración del catálogo aún no está aplicada. El editor queda en modo lectura hasta que se valide el esquema.</p>}

                {(isCreatingRole || selectedRole) && (
                  <form onSubmit={(event) => void saveRole(event)} className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={labelClass}>Nombre visible
                        <input className={fieldClass} value={roleForm.label} maxLength={40} required disabled={!isCreatingRole && selectedRole?.is_system && !catalogReady}
                          onChange={(event) => setRoleForm((current) => ({ ...current, label: event.target.value }))} placeholder="Ej. Colaborador"/>
                      </label>
                      <label className={labelClass}>Clave del rol
                        <input className={fieldClass} value={roleForm.role_key} maxLength={32} required pattern="[a-z][a-z0-9_]{1,31}" disabled={!isCreatingRole}
                          onChange={(event) => setRoleForm((current) => ({ ...current, role_key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))} placeholder="colaborador"/>
                      </label>
                    </div>
                    <label className={labelClass}>Descripción
                      <textarea className="mt-1.5 min-h-[66px] w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 py-2 text-[11px] text-[#e8eef3] outline-none focus:border-[#01c8ef]" value={roleForm.description} maxLength={240} disabled={!catalogReady}
                        onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))} placeholder="Para qué existe este rol y qué puede hacer."/>
                    </label>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <label className={labelClass}>Color de insignia
                        <div className="mt-1.5 flex h-10 items-center gap-2 rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-2">
                          <input type="color" value={roleForm.badge_color} disabled={!catalogReady} onChange={(event) => setRoleForm((current) => ({ ...current, badge_color: event.target.value }))} className="h-7 w-8 cursor-pointer bg-transparent"/>
                          <span className="text-[10px] text-[#a2b4c0]">{roleForm.badge_color.toUpperCase()}</span>
                        </div>
                      </label>
                      <label className={labelClass}>Posición
                        <input className={fieldClass} type="number" min={0} max={1000} value={roleForm.position} disabled={!catalogReady}
                          onChange={(event) => setRoleForm((current) => ({ ...current, position: Number(event.target.value) }))}/>
                      </label>
                      <label className="flex items-center gap-2 self-end rounded-[6px] border border-[#2b414f] bg-[#0d1721] p-2.5 text-[10px] text-[#9cafbb]">
                        <input type="checkbox" checked={roleForm.display_as_badge} disabled={!catalogReady} onChange={(event) => setRoleForm((current) => ({ ...current, display_as_badge: event.target.checked }))}/> Insignia
                      </label>
                      <label className="flex items-center gap-2 self-end rounded-[6px] border border-[#2b414f] bg-[#0d1721] p-2.5 text-[10px] text-[#9cafbb]">
                        <input type="checkbox" checked={roleForm.hoist} disabled={!catalogReady} onChange={(event) => setRoleForm((current) => ({ ...current, hoist: event.target.checked }))}/> Separar lista
                      </label>
                    </div>

                    <div className="rounded-[8px] border border-[#293c49] bg-[#0d161f] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <SlidersHorizontal size={15} className="text-[#01c8ef}"/>
                        <h4 className="text-[11px] font-bold text-[#e2ebf0]">Permisos de participación</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {PERMISSION_LABELS.map(({ key, label, description, icon: Icon }) => (
                          <label key={key} className="flex cursor-pointer items-start gap-2.5 rounded-[6px] border border-[#253845] bg-[#111d27] p-3 transition hover:border-[#3c5868]">
                            <input type="checkbox" className="mt-0.5 accent-[#7fe05c]" checked={roleForm.permissions[key]} disabled={!catalogReady || Boolean(selectedRole?.is_system && !isCreatingRole)}
                              onChange={(event) => setRoleForm((current) => ({ ...current, permissions: { ...current.permissions, [key]: event.target.checked } }))}/>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#d8e3e9]"><Icon size={12} className="text-[#8ea7b5]"/>{label}</span>
                              <span className="mt-1 block text-[9px] leading-4 text-[#718796]">{description}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {selectedRole?.is_system && !isCreatingRole && <p className="mt-3 text-[9px] text-[#8299a8]">Las capacidades de los roles de sistema no se pueden cambiar desde el editor.</p>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#293a47] pt-4">
                      <div className="flex items-center gap-2">
                        {selectedRole && !selectedRole.is_system && !isCreatingRole && <button type="button" onClick={() => void deleteRole()} disabled={!catalogReady || pendingKey !== null}
                          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#624044] px-3 py-2 text-[10px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40"><Trash2 size={12}/> Eliminar</button>}
                        <button type="submit" disabled={!catalogReady || pendingKey !== null || !roleForm.label.trim() || !roleForm.role_key.trim()}
                          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-4 py-2 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] hover:bg-[#91ed6b] disabled:opacity-40"><Save size={12}/> {pendingKey === "role-save" ? "Guardando…" : isCreatingRole ? "Crear rol" : "Guardar cambios"}</button>
                      </div>
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}

          {tab === "channels" && (
            <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-[#263744] bg-[#0c141e] md:border-r md:border-b-0">
                <div className="flex items-center justify-between border-b border-[#253644] p-4">
                  <span className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">CANALES Y CATEGORÍAS</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button"
                      onClick={() => { setIsCreatingCategory(true); setIsCreatingChannel(false); setSelectedCategoryId(null); setSelectedChannelId(null); setCategoryForm({ name: "", position: 100 }); }}
                      disabled={!categoriesReady || pendingKey !== null}
                      className="grid h-8 w-8 place-items-center rounded-[5px] border border-[#3c6334] bg-[#1b2b1c] text-[#a9e794] hover:border-[#7fe05c] disabled:opacity-40"
                      aria-label="Crear categoría" title="Crear categoría"><FolderPlus size={15}/></button>
                    <button type="button"
                      onClick={() => { setIsCreatingChannel(true); setIsCreatingCategory(false); setSelectedCategoryId(null); setChannelForm(emptyChannel()); setSelectedChannelId(null); }}
                      disabled={!channelsReady || pendingKey !== null}
                      className="grid h-8 w-8 place-items-center rounded-[5px] border border-[#3c6334] bg-[#1b2b1c] text-[#a9e794] hover:border-[#7fe05c] disabled:opacity-40"
                      aria-label="Crear canal" title="Crear canal"><Plus size={15}/></button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {(categories.length ? categories : CATEGORIES.map((item, index) => ({
                    id: item.value, name: item.value, position: (index + 1) * 10, is_archived: false,
                  }))).map((category) => {
                    const group = channels.filter((channel) => channel.category.toLowerCase() === category.name.toLowerCase());
                    return <section key={category.id} className="mb-4">
                      <div className="mb-1 flex items-center gap-1 rounded-[5px] px-1 py-1">
                        <button type="button"
                          onClick={() => {
                            setIsCreatingCategory(false);
                            setIsCreatingChannel(false);
                            setSelectedChannelId(null);
                            setSelectedCategoryId(category.id);
                            setCategoryForm({ name: category.name, position: category.position });
                          }}
                          className={"min-w-0 flex-1 truncate text-left font-sans text-[9px] font-bold tracking-[.1em] transition hover:text-white " + (selectedCategoryId === category.id ? "text-[#b6ed9a]" : "text-[#8298a8]")}>
                          {category.name.toUpperCase()}
                        </button>
                        <span className="text-[9px] tabular-nums text-[#62798a]">{group.length}</span>
                        <button type="button" onClick={() => {
                          setIsCreatingCategory(false);
                          setIsCreatingChannel(false);
                          setSelectedChannelId(null);
                          setSelectedCategoryId(category.id);
                          setCategoryForm({ name: category.name, position: category.position });
                        }} aria-label={"Editar categoría " + category.name} title="Editar categoría"
                          className="grid h-6 w-6 place-items-center rounded text-[#71899a] hover:bg-[#1a2a36] hover:text-white"><Pencil size={11}/></button>
                      </div>
                      {group.map((channel) => (
                        <button key={channel.id} type="button" onClick={() => {
                          setIsCreatingCategory(false);
                          setSelectedCategoryId(null);
                          setSelectedChannelId(channel.id);
                          setChannelForm(toChannelForm(channel));
                          setIsCreatingChannel(false);
                        }}
                          className={"mb-1 flex w-full items-center gap-2 rounded-[5px] border px-2.5 py-2 text-left " + (!isCreatingCategory && !isCreatingChannel && selectedChannelId === channel.id
                            ? "border-[#2b5665] bg-[#142a35]" : "border-transparent hover:border-[#253b49] hover:bg-[#13212c]")}>
                          {channel.channel_type === "announcement" ? <Megaphone size={14} style={{ color: channel.accent_color }}/> : <Hash size={14} style={{ color: channel.accent_color }}/>}
                          <span className="min-w-0 flex-1 truncate text-[10px] text-[#cbd9e0]">{channel.name}</span>
                          {channel.is_private && <Lock size={11} className="text-[#d5af67}"/>}
                          {channel.is_read_only && <EyeOff size={11} className="text-[#8298a7}"/>}
                        </button>
                      ))}
                    </section>;
                  })}
                  {channels.length === 0 && categories.length === 0 && <p className="p-3 text-[11px] text-[#8095a5]">No hay categorías ni canales todavía.</p>}
                </div>
              </aside>
              {(isCreatingCategory || selectedCategory) ? (
                <section className="min-h-0 overflow-y-auto p-5 sm:p-7">
                  <div className="max-w-[650px]">
                    <p className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">{isCreatingCategory ? "NUEVA CATEGORÍA" : "CONFIGURACIÓN DE CATEGORÍA"}</p>
                    <h3 className="mt-2 text-[18px] font-bold text-white">{isCreatingCategory ? "Crear categoría" : selectedCategory?.name}</h3>
                    <p className="mt-1 text-[11px] leading-5 text-[#849aa9]">Las categorías vacías también se guardan y aparecen en la lista del servidor.</p>
                    {!categoriesReady && <p className="mt-4 rounded-[5px] border border-[#6b542e] bg-[#2c2417] px-3 py-2 text-[10px] text-[#edcb8d]">La administración de categorías todavía no está disponible.</p>}
                    <form onSubmit={(event) => void saveCategory(event)} className="mt-5 space-y-4">
                      <label className={labelClass}>Nombre de la categoría
                        <input className={fieldClass} required minLength={2} maxLength={40} value={categoryForm.name} disabled={!categoriesReady}
                          onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Comunidad"/>
                      </label>
                      <label className={labelClass}>Orden en la lista
                        <input className={fieldClass} type="number" min={0} max={1000} value={categoryForm.position} disabled={!categoriesReady}
                          onChange={(event) => setCategoryForm((current) => ({ ...current, position: Number(event.target.value) }))}/>
                      </label>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#293a47] pt-4">
                        {selectedCategory && !isCreatingCategory ? (
                          <button type="button" onClick={() => void archiveCategory(selectedCategory)} disabled={!categoriesReady || pendingKey !== null}
                            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#624044] px-3 py-2 text-[10px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40">
                            <Archive size={12}/> Archivar categoría
                          </button>
                        ) : <span className="text-[9px] text-[#718796]">Solo el Founder puede crear categorías.</span>}
                        <button type="submit" disabled={!categoriesReady || pendingKey !== null || categoryForm.name.trim().length < 2}
                          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-4 py-2 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] hover:bg-[#91ed6b] disabled:opacity-40">
                          <Save size={12}/> {pendingKey === "category-save" ? "Guardando…" : isCreatingCategory ? "Crear categoría" : "Guardar cambios"}
                        </button>
                      </div>
                    </form>
                  </div>
                </section>
              ) : (
              <section className="min-h-0 overflow-y-auto p-5 sm:p-7">
                <div>
                  <p className="font-sans text-[9px] tracking-[.12em] text-[#8198a9]">{isCreatingChannel ? "NUEVO ESPACIO" : "CONFIGURACIÓN DEL CANAL"}</p>
                  <h3 className="mt-2 text-[18px] font-bold text-white">{isCreatingChannel ? "Crear canal" : selectedChannel?.name ?? "Selecciona un canal"}</h3>
                  <p className="mt-1 text-[11px] leading-5 text-[#849aa9]">Orden, categoría, acceso, tipo y acento de cada canal.</p>
                </div>
                {!channelsReady && <p className="mt-4 rounded-[5px] border border-[#6b542e] bg-[#2c2417] px-3 py-2 text-[10px] leading-5 text-[#edcb8d]">La migración de configuración de canales aún no está aplicada. El listado sigue disponible en modo lectura.</p>}
                {(isCreatingChannel || selectedChannel) && (
                  <form onSubmit={(event) => void saveChannel(event)} className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={labelClass}>Nombre del canal
                        <input className={fieldClass} required maxLength={60} value={channelForm.name} disabled={!channelsReady}
                          onChange={(event) => setChannelForm((current) => ({ ...current, name: event.target.value }))} placeholder="general"/>
                      </label>
                      <label className={labelClass}>Identificador URL
                        <input className={fieldClass} required maxLength={49} pattern="[a-z0-9][a-z0-9-]{1,48}" value={channelForm.slug} disabled={!isCreatingChannel || !channelsReady}
                          onChange={(event) => setChannelForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="general"/>
                      </label>
                    </div>
                    <label className={labelClass}>Descripción
                      <textarea className="mt-1.5 min-h-[62px] w-full rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-3 py-2 text-[11px] text-[#e8eef3] outline-none focus:border-[#01c8ef]" maxLength={240} value={channelForm.description} disabled={!channelsReady}
                        onChange={(event) => setChannelForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe qué se publica aquí."/>
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <label className={labelClass}>Categoría
                        <select className={fieldClass} value={channelForm.category} disabled={!channelsReady} onChange={(event) => setChannelForm((current) => ({ ...current, category: event.target.value }))}>
                          {categoryOptions.map((category) => <option key={category} value={category}>{CATEGORIES.find((item) => item.value === category)?.label ?? category}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>Orden
                        <input className={fieldClass} type="number" min={0} max={1000} value={channelForm.position} disabled={!channelsReady}
                          onChange={(event) => setChannelForm((current) => ({ ...current, position: Number(event.target.value) }))}/>
                      </label>
                      <label className={labelClass}>Tipo
                        <select className={fieldClass} value={channelForm.channel_type} disabled={!channelsReady}
                          onChange={(event) => setChannelForm((current) => ({ ...current, channel_type: event.target.value as "text" | "announcement" }))}>
                          <option value="text">Texto</option><option value="announcement">Anuncios</option>
                        </select>
                      </label>
                      <label className={labelClass}>Icono
                        <select className={fieldClass} value={channelForm.icon_key} disabled={!channelsReady} onChange={(event) => setChannelForm((current) => ({ ...current, icon_key: event.target.value }))}>
                          <option value="hash">Hash</option><option value="megaphone">Megáfono</option><option value="book-open">Libro</option><option value="graduation-cap">Graduación</option><option value="calendar">Calendario</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr]">
                      <label className={labelClass}>Color de acento
                        <div className="mt-1.5 flex h-10 items-center gap-2 rounded-[6px] border border-[#2b414f] bg-[#0d1721] px-2">
                          <input type="color" value={channelForm.accent_color} disabled={!channelsReady} onChange={(event) => setChannelForm((current) => ({ ...current, accent_color: event.target.value }))} className="h-7 w-8 cursor-pointer bg-transparent"/>
                          <span className="text-[10px] text-[#a2b4c0]">{channelForm.accent_color.toUpperCase()}</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 self-end rounded-[6px] border border-[#2b414f] bg-[#0d1721] p-2.5 text-[10px] text-[#9cafbb]">
                        <input type="checkbox" checked={channelForm.is_private} disabled={!channelsReady} onChange={(event) => setChannelForm((current) => ({ ...current, is_private: event.target.checked }))}/> Privado
                      </label>
                      <label className="flex items-center gap-2 self-end rounded-[6px] border border-[#2b414f] bg-[#0d1721] p-2.5 text-[10px] text-[#9cafbb]">
                        <input type="checkbox" checked={channelForm.is_read_only} disabled={!channelsReady} onChange={(event) => setChannelForm((current) => ({ ...current, is_read_only: event.target.checked }))}/> Solo lectura
                      </label>
                    </div>
                    {selectedChannel && !isCreatingChannel && <div className="flex flex-wrap justify-between gap-3 border-t border-[#293a47] pt-4">
                      <p className="text-[9px] leading-5 text-[#708797]">Archivar oculta el canal a los miembros; no elimina mensajes ni archivos.</p>
                      <button type="button" onClick={() => void archiveChannel(selectedChannel)} disabled={!channelsReady || pendingKey !== null}
                        className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#624044] px-3 py-2 text-[10px] text-[#efb1b2] hover:bg-[#321f24] disabled:opacity-40"><Archive size={12}/> Archivar canal</button>
                    </div>}
                    <div className="flex justify-end border-t border-[#293a47] pt-4">
                      <button type="submit" disabled={!channelsReady || pendingKey !== null || !channelForm.name.trim() || !channelForm.slug.trim()}
                        className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#5eaa45] bg-[#7fe05c] px-4 py-2 text-[10px] font-bold text-[#0b160c] shadow-[0_2px_0_#3c762e] hover:bg-[#91ed6b] disabled:opacity-40"><Save size={12}/> {pendingKey === "channel-save" ? "Guardando…" : isCreatingChannel ? "Crear canal" : "Guardar cambios"}</button>
                    </div>
                  </form>
                )}
              </section>
              )}
            </div>
          )}

          {tab === "spaces" && (
            <div className="h-full min-h-0 overflow-hidden">
              <CommunitySpacesStudio/>
            </div>
          )}
            </div></div>
        </div>

        <footer className="flex min-h-[42px] items-center justify-between border-t border-[#263744] bg-[#0c141d] px-5 text-[9px] text-[#728897] sm:px-7">
          <span>Founder conserva el control global. Las sanciones y cambios quedan auditados.</span>
          <span className="inline-flex items-center gap-1.5 text-[#8ea7b5]"><Check size={12} className="text-[#7fe05c]"/> PROTECCIÓN ACTIVA</span>
        </footer>
      </section>
    </div>
  );
}
