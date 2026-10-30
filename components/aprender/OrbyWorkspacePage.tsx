"use client";

import { useRouter } from "next/navigation";
import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function OrbyWorkspacePage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-72px)] w-full max-w-[1600px] flex-col bg-slate-950 p-2 sm:p-4 lg:p-6">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:rounded-3xl">
        <LessonAITutor
          subject="Preparación Saber 11"
          topic="Estudio y aprendizaje"
          stage="theory"
          context="El estudiante está en el espacio principal de estudio con Orby. Ayúdalo con explicaciones, preguntas, notas de voz, imágenes y organización de su aprendizaje."
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) router.push("/dashboard");
          }}
          accent="orby"
          workspace
        />
      </div>
    </main>
  );
}
