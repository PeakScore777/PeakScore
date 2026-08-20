"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase/client";


export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: name,
        email,
        target_score: 500,
        average_score: 0,
        streak: 0,
        simulations: 0,
      });

    if (profileError) {
      console.error(profileError);
    }
 }

  alert("Cuenta creada. Revisa tu correo para confirmar tu cuenta.");
  console.log(data);
};

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-6">

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl">

        {/* Logo */}
        <div className="mb-10 text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-bold text-white shadow-lg">
            P
          </div>

          <h1 className="mt-5 text-4xl font-extrabold text-slate-900">
            Crear cuenta
          </h1>

          <p className="mt-2 text-slate-500">
            Únete a PeakScore y empieza tu preparación.
          </p>

        </div>

        <form onSubmit={handleRegister} className="space-y-6">

          <div>
            <label className="mb-2 block font-medium text-slate-700">
              Nombre completo
            </label>

            <div className="flex items-center rounded-xl border border-slate-300 px-4">
              <User className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent px-3 py-4 outline-none"
            />
            </div>
          </div>

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
    className="text-slate-400 hover:text-slate-700"
  >
    {showPassword ? (
      <EyeOff className="h-5 w-5" />
    ) : (
      <Eye className="h-5 w-5" />
    )}
  </button>
</div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700"
          >
            Crear cuenta
          </button>

        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500">
            ¿Ya tienes una cuenta?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block font-semibold text-blue-600 hover:underline"
          >
            Iniciar sesión
          </Link>
        </div>

      </div>

    </main>
  );
}