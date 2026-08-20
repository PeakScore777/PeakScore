"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase/browser";

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("institution_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error verificando rol:", error);
        return;
      }

      setIsAdmin(!!data);
    }

    checkAdminRole();
  }, []);

  return (
    <aside className="w-72 min-h-screen bg-slate-900 text-white p-6">
      {/* Logo */}
      <h1 className="text-3xl font-bold mb-10">
        PeakScore
      </h1>

      {/* Menú */}
      <nav className="space-y-3">
        <Link
          href="/dashboard"
          className="block rounded-xl px-4 py-3 hover:bg-slate-800"
        >
          📊 Dashboard
        </Link>

        <Link
          href="/simulacros"
          className="block rounded-xl px-4 py-3 hover:bg-slate-800"
        >
          📝 Simulacros
        </Link>

        {isAdmin && (
          <Link
            href="/dashboard/question-bank"
            className="block rounded-xl px-4 py-3 hover:bg-slate-800"
          >
            📚 Banco de preguntas
          </Link>
        )}

        <Link
          href="/estadisticas"
          className="block rounded-xl px-4 py-3 hover:bg-slate-800"
        >
          📈 Estadísticas
        </Link>

        <Link
          href="/perfil"
          className="block rounded-xl px-4 py-3 hover:bg-slate-800"
        >
          👤 Perfil
        </Link>
      </nav>
    </aside>
  );
}