"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex cursor-pointer items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
            P
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              PeakScore
            </h1>

            <p className="-mt-1 text-xs text-slate-500">
              PreICFES Platform
            </p>
          </div>

        </Link>

        {/* Menú */}
        <div className="hidden items-center gap-10 md:flex">

          <a
            href="#features"
            className="font-medium text-slate-600 transition duration-300 hover:text-blue-600"
          >
            Características
          </a>

          <a
            href="#how-it-works"
            className="font-medium text-slate-600 transition duration-300 hover:text-blue-600"
          >
            Cómo funciona
          </a>

          <a
            href="#pricing"
            className="font-medium text-slate-600 transition duration-300 hover:text-blue-600"
          >
            Precios
          </a>

          <a
            href="#contact"
            className="font-medium text-slate-600 transition duration-300 hover:text-blue-600"
          >
            Contacto
          </a>

        </div>

        {/* Botones */}
        <div className="hidden items-center gap-4 md:flex">

          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 transition duration-300 hover:bg-slate-100"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Empieza gratis
          </Link>

        </div>

      </div>
    </nav>
  );
}