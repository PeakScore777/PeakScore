"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, LoaderCircle, Send } from "lucide-react";

const SUBJECTS = [
  "Matemáticas",
  "Lectura crítica",
  "Sociales",
  "Ciencias naturales",
  "Inglés",
  "Preparación ICFES",
];

export default function ProfessorApplicationForm() {
  const router = useRouter();
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [subjectAreas, setSubjectAreas] = useState<string[]>([]);
  const [experience, setExperience] = useState("0");
  const [biography, setBiography] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function toggleSubject(subject: string) {
    setSubjectAreas((current) => current.includes(subject)
      ? current.filter((item) => item !== subject)
      : [...current, subject]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    if (subjectAreas.length === 0) {
      setError("Selecciona al menos un área en la que puedas enseñar.");
      return;
    }
    if (biography.trim().length < 80) {
      setError("Cuéntanos un poco más: la presentación debe tener al menos 80 caracteres.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/community/professor-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalTitle,
          subjectAreas,
          teachingExperienceYears: Number(experience),
          biography,
          portfolioUrl: portfolioUrl.trim() || null,
          introVideoUrl: introVideoUrl.trim() || null,
        }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo enviar la solicitud.");
        return;
      }

      setSent(true);
      router.refresh();
    } catch {
      setError("No se pudo conectar con PeakScore. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <section className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-200">
          <BadgeCheck size={27}/>
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-white">Solicitud enviada</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">
          El equipo de PeakScore revisará tu perfil. Te mostraremos el estado de la solicitud aquí mismo.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-[#0d1628] p-5 sm:p-7">
      <div className="flex items-start gap-3 border-b border-white/[0.07] pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200">
          <BriefcaseBusiness size={18}/>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/70">SOLICITUD DE CREADOR</p>
          <h2 className="mt-1 text-base font-extrabold text-white">Cuéntanos qué puedes enseñar</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">La revisión es manual. Enviar el formulario no concede el rol automáticamente.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="community-live-field sm:col-span-2">
          <span>Profesión o perfil profesional</span>
          <input
            required minLength={3} maxLength={80}
            value={professionalTitle}
            onChange={(event) => setProfessionalTitle(event.target.value)}
            placeholder="Ej. Licenciado en Matemáticas"
          />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[10px] font-bold text-slate-300">Áreas en las que puedes enseñar</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SUBJECTS.map((subject) => {
              const checked = subjectAreas.includes(subject);
              return (
                <label key={subject} className={"flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-[11px] transition " + (checked ? "border-cyan-300/35 bg-cyan-300/[0.07] text-cyan-100" : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20")}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(subject)}
                    className="h-3.5 w-3.5 accent-cyan-300"
                  />
                  {subject}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="community-live-field">
          <span>Años de experiencia enseñando</span>
          <select value={experience} onChange={(event) => setExperience(event.target.value)}>
            {Array.from({ length: 31 }, (_, index) => String(index)).map((value) => (
              <option key={value} value={value}>{value} {value === "1" ? "año" : "años"}</option>
            ))}
            <option value="35">35 años</option>
            <option value="40">40 años</option>
            <option value="45">45 años</option>
            <option value="50">50 años</option>
          </select>
        </label>

        <label className="community-live-field">
          <span>Portafolio o perfil profesional (opcional)</span>
          <input
            type="url" maxLength={500}
            value={portfolioUrl}
            onChange={(event) => setPortfolioUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="community-live-field sm:col-span-2">
          <span>Presentación profesional</span>
          <textarea
            required minLength={80} maxLength={1200} rows={5}
            value={biography}
            onChange={(event) => setBiography(event.target.value.slice(0, 1200))}
            placeholder="Cuéntanos tu formación, experiencia, metodología y cómo ayudarías a los estudiantes a prepararse para el Saber 11..."
          />
          <span className="text-right text-[9px] text-slate-600">{biography.length}/1200</span>
        </label>

        <label className="community-live-field sm:col-span-2">
          <span>Video introductorio (opcional, YouTube o Vimeo)</span>
          <input
            type="url" maxLength={500}
            value={introVideoUrl}
            onChange={(event) => setIntroVideoUrl(event.target.value)}
            placeholder="https://youtu.be/..."
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md border border-red-300/20 bg-red-300/[0.05] px-3 py-2.5 text-xs text-red-200">{error}</p>}

      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center">
        <p className="max-w-lg text-[10px] leading-5 text-slate-600">
          Tus datos de contacto y documentos de solicitud solo serán visibles para administradores autorizados.
        </p>
        <button type="submit" disabled={sending || professionalTitle.trim().length < 3 || biography.trim().length < 80 || subjectAreas.length === 0} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-xs font-extrabold text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-40">
          {sending ? <LoaderCircle size={14} className="animate-spin"/> : <Send size={14}/>}
          {sending ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
