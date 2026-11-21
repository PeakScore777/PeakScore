import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, BookOpen, Clock3,
  FileText, GraduationCap, ShieldCheck, Video,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ProfessorApplicationForm from "./ProfessorApplicationForm";

type ProfessorApplication = {
  id: string;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  submitted_at: string;
  reviewed_at: string | null;
  review_note: string | null;
};

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function BecomePeakScoreProfessorPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/comunidad/ser-profesor");
  }

  const [{ data: roles, error: roleError }, { data: applications, error: applicationError }] = await Promise.all([
    supabaseAdmin
      .from("community_member_roles")
      .select("role_key,assigned_at")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("community_professor_applications")
      .select("id,status,submitted_at,reviewed_at,review_note")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  const isProfessor = (roles ?? []).some((role) => role.role_key === "profesor");
  const latest = ((applications ?? [])[0] ?? null) as ProfessorApplication | null;
  const readError = Boolean(roleError || applicationError);

  return (
    <main className="community-page min-h-[calc(100vh-72px)] px-4 py-7 text-[#eef2ff] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/comunidad" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-white">
          <ArrowLeft size={14}/> Volver a Comunidad
        </Link>

        <header className="mt-6 overflow-hidden rounded-xl border border-[#2b3b5a] bg-[#101a30]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="p-6 sm:p-8">
              <p className="community-kicker">PEAKSCORE COMMUNITY / CREADORES</p>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Enseña en PeakScore</h1>
              <p className="mt-3 max-w-xl text-xs leading-6 text-slate-400">
                Buscamos profesores y especialistas que creen videos, cursos, explicaciones y materiales para preparar a estudiantes para el Saber 11.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300/20 bg-emerald-300/[0.06] px-2.5 py-1.5 text-[10px] text-emerald-100"><Video size={12}/> Publicar contenido educativo</span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] px-2.5 py-1.5 text-[10px] text-cyan-100"><BookOpen size={12}/> Crear recursos y cursos</span>
              </div>
            </div>
            <div className="hidden items-center justify-center border-l border-[#2b3b5a] bg-[#0c1528] lg:flex">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.04] text-emerald-200">
                <div className="absolute inset-3 rounded-full border border-emerald-300/10"/>
                <GraduationCap size={46} strokeWidth={1.25}/>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6">
          {readError ? (
            <div className="rounded-lg border border-red-300/20 bg-red-300/[0.05] p-5 text-xs text-red-200">
              No se pudo consultar el estado de tu solicitud. Recarga la página o inténtalo más tarde.
            </div>
          ) : isProfessor ? (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-100"><BadgeCheck size={22}/></div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">CREADOR VERIFICADO</p>
                  <h2 className="mt-1 text-lg font-extrabold text-white">Ya eres Profesor PeakScore</h2>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-400">
                Tu rol de creador está activo. Desde la comunidad podrás acceder al espacio de profesores y participar en las herramientas de contenido que se habiliten para tu cuenta.
              </p>
              <Link href="/comunidad?channel=sala-de-profesores" className="mt-5 inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-2 text-[11px] font-bold text-emerald-100 hover:bg-emerald-300/[0.13]">
                Entrar a la sala de profesores <ArrowLeft className="rotate-180" size={13}/>
              </Link>
            </div>
          ) : latest?.status === "pending" ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-300/[0.08] text-amber-100"><Clock3 size={21}/></div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-200/70">SOLICITUD EN REVISIÓN</p>
                  <h2 className="mt-1 text-lg font-extrabold text-white">Estamos revisando tu perfil</h2>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-slate-400">Recibimos tu solicitud el {dateLabel(latest.submitted_at)}. El equipo revisará tu experiencia y las áreas en las que deseas crear contenido.</p>
              <p className="mt-3 text-[10px] text-slate-600">No es necesario que vuelvas a enviarla. El rol se habilitará solo después de la aprobación.</p>
            </div>
          ) : (
            <>
              {latest && (
                <div className={"mb-5 rounded-lg border p-4 " + (latest.status === "rejected" ? "border-red-300/20 bg-red-300/[0.04]" : "border-amber-300/20 bg-amber-300/[0.04]")}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                    {latest.status === "rejected" ? "SOLICITUD ANTERIOR RECHAZADA" : "SE NECESITAN AJUSTES"}
                  </p>
                  {latest.review_note && <p className="mt-2 text-xs leading-5 text-slate-300">{latest.review_note}</p>}
                  {latest.reviewed_at && <p className="mt-2 text-[9px] text-slate-600">Revisada el {dateLabel(latest.reviewed_at)}</p>}
                  <p className="mt-2 text-[10px] text-slate-500">Puedes enviar una nueva solicitud con la información actualizada.</p>
                </div>
              )}
              <ProfessorApplicationForm/>
            </>
          )}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#0d1628] p-4">
            <ShieldCheck size={17} className="text-cyan-200"/>
            <h3 className="mt-3 text-xs font-bold text-white">Revisión humana</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">El rol se concede después de verificar el perfil.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0d1628] p-4">
            <BookOpen size={17} className="text-cyan-200"/>
            <h3 className="mt-3 text-xs font-bold text-white">Contenido educativo</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">El propósito es crear materiales centrados en el Saber 11.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0d1628] p-4">
            <FileText size={17} className="text-cyan-200"/>
            <h3 className="mt-3 text-xs font-bold text-white">Datos protegidos</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">La información de la solicitud no se expone en consultas públicas.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
