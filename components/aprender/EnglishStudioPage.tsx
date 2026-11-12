"use client";

import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function EnglishStudioPage() {
  return (
    <main className="fixed inset-0 z-[2147483647] flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#ffffff]">
      <LessonAITutor
        subject="Inglés"
        topic="English Studio"
        stage="theory"
        context="English Studio de PeakScore. Practica speaking, pronunciation, listening, reading y writing mediante objetivos MCER. Mantén esta experiencia separada del aula de preparación Saber 11 de Orby."
        open
        onOpenChange={(nextOpen) => { if (!nextOpen) window.location.assign("/dashboard"); }}
        accent="orby"
        workspace
        assistantName="OmegaX"
        initialView="english"
      />
    </main>
  );
}
