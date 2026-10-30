"use client";

import { useRouter } from "next/navigation";
import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function OrbyWorkspacePage() {
  const router = useRouter();

  return (
    <main className="flex h-[calc(100dvh-72px)] min-h-0 w-full flex-col overflow-hidden bg-slate-950 p-0">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-none border-0 bg-white shadow-none">
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
