import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, BadgeCheck, BriefcaseBusiness, ExternalLink, GraduationCap,
  Mail, MapPin, ShieldCheck, Video,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ProfessorApplicationActions from "./ProfessorApplicationActions";

type Application = {
  id: string;
  user_id: string;
  professional_title: string;
  subject_areas: string[];
  teaching_experience_years: number;
  biography: string;
  portfolio_url: string | null;
  intro_video_url: string | null;
  status: string;
  submitted_at: string;
  applicant: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function CommunityProfessorApplicationsPage() {
  await requireAdmin();

  const [
    { data: rows, error },
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabaseAdmin
      .from("community_professor_applications")
      .select("id,user_id,professional_title,subject_areas,teaching_experience_years,biography,portfolio_url,intro_video_url,status,submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(100),
    supabaseAdmin.from("community_professor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabaseAdmin.from("community_professor_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabaseAdmin.from("community_professor_applications").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);

  const userIds = Array.from(new Set((rows ?? []).map((item) => item.user_id)));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from("profiles").select("id,full_name,email,avatar_url").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const applications: Application[] = (rows ?? []).map((item) => ({
    ...item,
    subject_areas: item.subject_areas ?? [],
    applicant: profileMap.get(item.user_id) ?? null,
  }));

  return (
    <main className="min-h-screen bg-[#060B18] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-cyan-200">
          <ArrowLeft size={15}/> Volver a administración
        </Link>

        <header className="mt-6 flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">PEAKSCORE COMMUNITY / CREADORES</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300">
                <GraduationCap size={24}/>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Profesores PeakScore</h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Verifica a los creadores que publicarán videos, cursos y materiales educativos para la comunidad.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[95px] rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-200/70">Pendientes</p>
              <p className="mt-1 text-xl font-black tabular-nums">{pendingCount ?? 0}</p>
            </div>
            <div className="min-w-[95px] rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-200/70">Aprobados</p>
              <p className="mt-1 text-xl font-black tabular-nums">{approvedCount ?? 0}</p>
            </div>
            <div className="min-w-[95px] rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-red-200/70">Rechazados</p>
              <p className="mt-1 text-xl font-black tabular-nums">{rejectedCount ?? 0}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[10px] font-bold text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300"/> Solicitudes por revisar
          </span>
          <span className="text-[10px] text-slate-600">Los roles de docentes institucionales no se gestionan desde esta pantalla.</span>
        </div>

        {error ? (
          <section className="mt-7 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-6 text-sm text-red-200">
            No fue posible cargar las solicitudes de profesores.
          </section>
        ) : applications.length === 0 ? (
          <section className="mt-7 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-200">
              <BadgeCheck size={26}/>
            </div>
            <h2 className="mt-5 text-base font-extrabold">No hay solicitudes pendientes</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">Cuando una persona envíe su solicitud para convertirse en Profesor PeakScore, aparecerá aquí para su revisión.</p>
          </section>
        ) : (
          <section className="mt-7 grid gap-4">
            {applications.map((application) => (
              <article key={application.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1628]">
                <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#17243b] text-sm font-black text-cyan-100">
                      {application.applicant?.avatar_url
                        ? <Image src={application.applicant.avatar_url} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover"/>
                        : (application.applicant?.full_name ?? "P").split(/\s+/).slice(0,2).map((part) => part[0]?.toUpperCase()).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white">{application.applicant?.full_name ?? "Solicitante"}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><Mail size={11}/>{application.applicant?.email ?? "Correo no disponible"}</p>
                      <p className="mt-2 text-[10px] text-slate-600">Enviada el {dateLabel(application.submitted_at)}</p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
                    <ShieldCheck size={12}/> Pendiente de verificación
                  </span>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_270px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-100">
                        <BriefcaseBusiness size={12}/>{application.professional_title}
                      </span>
                      <span className="text-[10px] text-slate-500">{application.teaching_experience_years} años de experiencia</span>
                    </div>
                    <div className="mt-4">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">Áreas de enseñanza</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {application.subject_areas.map((subject) => (
                          <span key={subject} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-slate-300">{subject}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">Presentación profesional</p>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-300">{application.biography}</p>
                    </div>
                  </div>

                  <aside className="flex flex-col gap-2 border-t border-white/[0.07] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">Material de referencia</p>
                    {application.portfolio_url ? (
                      <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100">
                        <MapPin size={13}/> Abrir portafolio <ExternalLink size={11}/>
                      </a>
                    ) : <p className="rounded-md bg-white/[0.025] px-3 py-2.5 text-[10px] text-slate-600">Sin portafolio adjunto</p>}
                    {application.intro_video_url ? (
                      <a href={application.intro_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100">
                        <Video size={13}/> Ver video introductorio <ExternalLink size={11}/>
                      </a>
                    ) : <p className="rounded-md bg-white/[0.025] px-3 py-2.5 text-[10px] text-slate-600">Sin video introductorio</p>}
                    <p className="mt-auto pt-4 text-[9px] leading-4 text-slate-600">ID de solicitud: {application.id}</p>
                  </aside>

                  <div className="lg:col-span-2">
                    <ProfessorApplicationActions applicationId={application.id}/>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
