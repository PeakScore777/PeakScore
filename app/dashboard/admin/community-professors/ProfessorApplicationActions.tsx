"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquareText, LoaderCircle } from "lucide-react";

type ReviewAction = "approve" | "reject" | "request_changes";

export default function ProfessorApplicationActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>, nextAction: ReviewAction) {
    event.preventDefault();
    if (sending) return;
    const cleanNote = note.trim();

    if (nextAction !== "approve" && cleanNote.length < 10) {
      setError("Escribe un motivo de al menos 10 caracteres.");
      return;
    }
    if (cleanNote.length > 1000) {
      setError("El motivo no puede superar los 1.000 caracteres.");
      return;
    }

    setSending(true);
    setAction(nextAction);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/community/professor-applications/" + applicationId + "/review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: nextAction, note: cleanNote }),
        },
      );
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "No se pudo completar la revisión.");
        return;
      }

      setSuccess(
        nextAction === "approve"
          ? "Profesor aprobado y rol asignado."
          : nextAction === "reject"
            ? "Solicitud rechazada."
            : "Se solicitaron ajustes al aspirante.",
      );
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setSending(false);
      setAction(null);
    }
  }

  return (
    <form className="mt-5 border-t border-white/10 pt-4" onSubmit={(event) => event.preventDefault()}>
      <label className="block">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
          Nota para el aspirante
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 1000))}
          rows={2}
          placeholder="Explica qué se debe corregir o por qué no se aprueba..."
          className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#080f1e] px-3 py-2.5 text-xs leading-5 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
        />
        <span className="mt-1 block text-right text-[9px] text-slate-600">{note.length}/1000</span>
      </label>

      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
      {success && <p role="status" className="mt-2 text-xs text-emerald-300">{success}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={sending}
          onClick={(event) => void submit(event as unknown as FormEvent<HTMLFormElement>, "approve")}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-50"
        >
          {sending && action === "approve" ? <LoaderCircle size={13} className="animate-spin"/> : <Check size={13}/>}
          Aprobar profesor
        </button>
        <button
          type="button"
          disabled={sending || note.trim().length < 10}
          onClick={(event) => void submit(event as unknown as FormEvent<HTMLFormElement>, "request_changes")}
          className="inline-flex items-center gap-2 rounded-md border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-40"
        >
          {sending && action === "request_changes" ? <LoaderCircle size={13} className="animate-spin"/> : <MessageSquareText size={13}/>}
          Solicitar cambios
        </button>
        <button
          type="button"
          disabled={sending || note.trim().length < 10}
          onClick={(event) => void submit(event as unknown as FormEvent<HTMLFormElement>, "reject")}
          className="inline-flex items-center gap-2 rounded-md border border-red-400/25 bg-red-400/[0.06] px-3 py-2 text-[11px] font-bold text-red-200 transition hover:bg-red-400/10 disabled:opacity-40"
        >
          {sending && action === "reject" ? <LoaderCircle size={13} className="animate-spin"/> : <X size={13}/>}
          Rechazar
        </button>
      </div>
    </form>
  );
}
