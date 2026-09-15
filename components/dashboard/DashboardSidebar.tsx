"use client";

import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Medal,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import SidebarItem from "./SidebarItem";

import { supabase } from "@/lib/supabase/browser";
import { getProfile } from "@/lib/services/profile.service";

export default function DashboardSidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const profile = await getProfile(user.id);

        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error(
          "Error obteniendo el perfil:",
          error
        );
      }
    }

    loadProfile();
  }, []);

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      
      {/* LOGO */}
      <div className="border-b border-slate-200 p-6">
        <h1 className="text-3xl font-extrabold text-blue-600">
          PeakScore
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Prepárate para el ICFES
        </p>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 space-y-2 p-4">

        <SidebarItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          active
        />

        <SidebarItem
          href="/dashboard/simulations"
          icon={BookOpen}
          label="Simulacros"
        />

        <SidebarItem
          href="/dashboard/question-bank"
          icon={BookOpen}
          label="Banco de preguntas"
        />

        <SidebarItem
          href="/dashboard/ranking"
          icon={Trophy}
          label="Ranking"
        />

        <SidebarItem
          href="/dashboard/profile"
          icon={User}
          label="Perfil"
        />

        <SidebarItem
          href="/dashboard/achievements"
          icon={Medal}
          label="Logros"
        />

        <SidebarItem
          href="/dashboard/settings"
          icon={Settings}
          label="Configuración"
        />

        {/* ===================================
            ADMINISTRACIÓN
            SOLO VISIBLE PARA ADMIN
        =================================== */}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-slate-200" />

            <SidebarItem
              href="/dashboard/admin"
              icon={ShieldCheck}
              label="Administración"
            />
          </>
        )}

      </nav>

      {/* CERRAR SESIÓN */}
      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  );
}