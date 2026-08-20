"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      alert(error.message);
      return;
    }

  router.push("/dashboard");
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">

        {/* Logo */}
        <div className="mb-10 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-bold text-white shadow-lg">
            P
          </div>

          <h1 className="mt-5 text-4xl font-extrabold text-slate-900">
            PeakScore
          </h1>

          <p className="mt-2 text-slate-500">
            Inicia sesión para continuar.
          </p>

        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>

            <label className="mb-2 block font-medium text-slate-700">
              Correo electrónico
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 px-4">

              <Mail className="h-5 w-5 text-slate-400" />

              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent px-3 py-4 outline-none"
              />

            </div>

          </div>

          <div>

            <label className="mb-2 block font-medium text-slate-700">
              Contraseña
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 px-4">

              <Lock className="h-5 w-5 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent px-3 py-4 outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 cursor-pointer text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 cursor-pointer text-slate-400" />
                )}
              </button>
            </div>

          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:shadow-xl"
          >
            Iniciar sesión
          </button>

        </form>

        <div className="mt-8 text-center">

          <p className="text-slate-500">
            ¿No tienes una cuenta?
          </p>

          <Link
            href="/register"
            className="mt-2 inline-block font-semibold text-blue-600 hover:underline"
          >
            Crear cuenta
          </Link>

        </div>

      </div>

    </main>
  );
}