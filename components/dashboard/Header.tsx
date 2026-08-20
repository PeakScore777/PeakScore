"use client";

import { Search, Bell } from "lucide-react";

interface HeaderProps {
  userName: string;
  onLogout: () => void;
}

export default function Header({
  userName,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-5 shadow-sm">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          ¡Hola, {userName}! 👋
        </h1>

        <p className="mt-1 text-slate-500">
          Bienvenido nuevamente a PeakScore.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-xl border bg-slate-50 px-4 py-2">
          <Search size={18} className="text-slate-400" />

          <input
            className="ml-2 bg-transparent outline-none"
            placeholder="Buscar..."
          />
        </div>

        <button className="rounded-xl bg-slate-100 p-3 hover:bg-slate-200">
          <Bell size={20} />
        </button>

        <button
          onClick={onLogout}
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
        >
          Cerrar sesión
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}