"use client";

import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function OrbyWorkspacePage() {
  return (
    <main className="flex h-[calc(100dvh-80px)] min-h-0 w-full flex-col overflow-hidden bg-white p-0">
      <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <LessonAITutor
          subject="Preparación Saber 11"
          topic="Estudio y aprendizaje"
          stage="theory"
          context="Orby es el profesor particular de PeakScore. Enseña exclusivamente contenidos y competencias de Saber 11/ICFES, con explicaciones originales en español colombiano. La hoja digital es el centro de la clase: explica y construye la pizarra progresivamente mientras habla. No enseñes programación ni promociones otros preICFES."
          open
          onOpenChange={(nextOpen) => { if (!nextOpen) window.location.assign("/dashboard"); }}
          accent="orby"
          workspace
          assistantName="Orby"
          classLauncher
        />
      </div>
    </main>
  );
}
