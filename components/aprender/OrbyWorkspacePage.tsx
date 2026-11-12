"use client";

import { useSearchParams } from "next/navigation";
import EnglishStudioPage from "@/components/aprender/EnglishStudioPage";
import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function OrbyWorkspacePage() {
  const searchParams = useSearchParams();
  if (searchParams.get("view") === "english") return <EnglishStudioPage />;

  return (
    <main className="fixed inset-0 z-[2147483647] flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-white">
      <LessonAITutor
        subject="Preparación Saber 11"
        topic="Clase en vivo"
        context="Aula visual de PeakScore para enseñar las cinco áreas de Saber 11. Imparte una clase conversada, explica el razonamiento, construye y corrige la pizarra en tiempo real, pregunta al estudiante y espera su intervención. Mantén la experiencia como una clase con Gemini Live, no como un chatbot. Usa exclusivamente el motor nativo Gemini Live y sus herramientas de pizarra."
        open
        onOpenChange={(nextOpen) => { if (!nextOpen) window.location.assign("/dashboard"); }}
        accent="orby"
        workspace
        assistantName="Orby"
        initialView="chat"
        classLauncher
      />
    </main>
  );
}
