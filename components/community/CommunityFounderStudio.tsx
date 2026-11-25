"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, ShieldCheck, X, UserRound, Check, Plus, Minus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

type Member = {
  user_id: string;
  display_name: string;
  avatar_path: string | null;
  member_number: number | null;
  role_keys: string[];
};

type Role = {
  role_key: string;
  label: string;
  description: string;
  badge_color: string;
};

type Props = {
  onClose: () => void;
};

const PROTECTED_ROLE = "fundador";

export default function CommunityFounderStudio({ onClose }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("administrador");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [{ data: memberRows, error: memberError }, { data: roleRows, error: roleError }, { data: assignmentRows, error: assignmentError }] = await Promise.all([
      supabase.from("community_member_profiles")
        .select("user_id,display_name,avatar_path,member_number")
        .order("display_name", { ascending: true })
        .limit(200),
      supabase.from("community_role_catalog")
        .select("role_key,label,description,badge_color")
        .order("label", { ascending: true }),
      supabase.from("community_member_roles").select("user_id,role_key").limit(1000),
    ]);

    if (memberError || roleError || assignmentError) {
      setError("No se pudo cargar el directorio. Comprueba las políticas de lectura de la comunidad.");
      setLoading(false);
      return;
    }

    const assignments = new Map<string, string[]>();
    (assignmentRows ?? []).forEach((row: { user_id: string; role_key: string }) => {
      const list = assignments.get(row.user_id) ?? [];
      list.push(row.role_key);
      assignments.set(row.user_id, list);
    });
    setMembers((memberRows ?? []).map((row) => ({
      ...row,
      role_keys: assignments.get(row.user_id) ?? [],
    })) as Member[]);
    setRoles(((roleRows ?? []) as Role[]).filter((role) => role.role_key !== PROTECTED_ROLE));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleMembers = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return members;
    return members.filter((member) =>
      member.display_name.toLocaleLowerCase("es").includes(needle)
      || String(member.member_number ?? "").includes(needle)
      || member.role_keys.some((key) => key.toLocaleLowerCase("es").includes(needle)),
    );
  }, [members, query]);

  async function changeRole(member: Member, roleKey: string, action: "grant" | "revoke") {
    const key = member.user_id + ":" + roleKey;
    if (pendingKey) return;
    setPendingKey(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/community/roles", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: member.user_id,
          role_key: roleKey,
          action,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? "No se pudo actualizar el rol.");
        return;
      }
      setNotice(action === "grant"
        ? "Rol asignado a " + member.display_name + "."
        : "Rol retirado de " + member.display_name + ".");
      await load();
    } catch {
      setError("No se pudo completar la solicitud. Inténtalo de nuevo.");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#05080dcc] p-3 backdrop-blur-[5px]"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="ps-founder-title"
        className="flex max-h-[min(790px,94dvh)] w-full max-w-[980px] flex-col overflow-hidden rounded-[10px] border border-[#2b3c4a] bg-[#101720] text-[#e8eef3] shadow-[0_28px_100px_rgba(0,0,0,.55)]">
        <header className="flex min-h-[74px] items-center justify-between border-b border-[#263744] bg-[#0b121b] px-5 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] border border-[#547f42] bg-[#7fe05c] text-[#09140b] shadow-[0_3px_0_#315d28]">
              <ShieldCheck size={19}/>
            </span>
            <div className="min-w-0">
              <p className="font-[var(--font-silkscreen)] text-[7px] tracking-[.12em] text-[#8ca4b5]">PEAKSCORE / CONTROL CENTRAL</p>
              <h2 id="ps-founder-title" className="mt-1 truncate text-[16px] font-bold text-white">Gestión de miembros y roles</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar panel"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] border border-[#2a3b48] text-[#a7b7c3] transition hover:border-[#01c8ef] hover:bg-[#142833] hover:text-white">
            <X size={18}/>
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-[#263744] bg-[#0c141e] md:border-r md:border-b-0">
            <div className="border-b border-[#253644] p-4">
              <p className="font-[var(--font-silkscreen)] text-[6px] tracking-[.12em] text-[#8198a9]">DIRECTORIO</p>
              <div className="mt-3 flex h-10 items-center gap-2 rounded-[6px] border border-[#2b414f] bg-[#111d28] px-3 focus-within:border-[#01c8ef]">
                <Search size={15} className="shrink-0 text-[#8098a9]"/>
                <input value={query} onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar miembro..." aria-label="Buscar miembros"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[#687f90]"/>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-[#8095a5]">
                <span>{members.length} miembros cargados</span>
                <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 hover:text-[#01c8ef]">
                  <RefreshCw size={12}/> Actualizar
                </button>
              </div>
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

          <div className="flex min-h-0 flex-col">
            <div className="border-b border-[#263744] px-5 py-5 sm:px-7">
              <p className="font-[var(--font-silkscreen)] text-[6px] tracking-[.12em] text-[#8198a9]">ASIGNACIÓN DE AUTORIDAD</p>
              <h3 className="mt-2 text-[18px] font-bold text-white">Roles de PeakScore</h3>
              <p className="mt-2 max-w-[570px] text-[12px] leading-6 text-[#9aaebb]">
                Solo el founder puede conceder o retirar roles. La identidad del founder y cada cambio se validan y registran en el servidor.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button key={role.role_key} type="button" onClick={() => setSelectedRole(role.role_key)}
                    className={"rounded-[5px] border px-3 py-2 text-left transition " + (selectedRole === role.role_key
                      ? "border-[#01c8ef] bg-[#112b36] text-white"
                      : "border-[#2a3b48] bg-[#121d27] text-[#9aafbd] hover:border-[#46616f]")}>
                    <span className="block text-[10px] font-semibold">{role.label}</span>
                    <span className="mt-1 block max-w-[155px] text-[9px] leading-4 text-[#738a99]">{role.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p role="alert" className="mx-5 mt-4 rounded-[5px] border border-[#71363b] bg-[#301b20] px-3 py-2 text-[11px] text-[#ffb9bd] sm:mx-7">{error}</p>}
            {notice && <p role="status" className="mx-5 mt-4 rounded-[5px] border border-[#3f643b] bg-[#17281b] px-3 py-2 text-[11px] text-[#b8e9aa] sm:mx-7">{notice}</p>}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
              <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[#293a47] pb-2 font-[var(--font-silkscreen)] text-[6px] tracking-[.1em] text-[#7891a2]">
                <span>MIEMBRO</span><span>ACCESO AL ROL</span>
              </div>
              {visibleMembers.map((member) => {
                const role = roles.find((item) => item.role_key === selectedRole);
                const assigned = member.role_keys.includes(selectedRole);
                const key = member.user_id + ":" + selectedRole;
                return (
                  <div key={member.user_id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#202f3b] py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[#e2ebf0]">{member.display_name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {member.role_keys.map((roleKey) => {
                          const current = roles.find((item) => item.role_key === roleKey);
                          return current ? <span key={roleKey} className="rounded-[3px] border px-1.5 py-0.5 text-[8px]"
                            style={{ color: current.badge_color, borderColor: current.badge_color + "66", backgroundColor: current.badge_color + "10" }}>{current.label}</span> : null;
                        })}
                      </div>
                    </div>
                    <button type="button" disabled={!role || pendingKey !== null || member.role_keys.includes(PROTECTED_ROLE)}
                      onClick={() => void changeRole(member, selectedRole, assigned ? "revoke" : "grant")}
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
            <footer className="flex min-h-[45px] items-center justify-between border-t border-[#263744] bg-[#0c141d] px-5 text-[9px] text-[#728897] sm:px-7">
              <span>La autoridad de founder no se puede delegar.</span>
              <span className="inline-flex items-center gap-1.5 text-[#8ea7b5]"><Check size={12} className="text-[#7fe05c]"/> CAMBIOS AUDITADOS</span>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}
