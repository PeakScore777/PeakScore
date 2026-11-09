"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LessonAITutor from "@/components/aprender/LessonAITutor";

export default function OrbyWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view") === "english" ? "english" : "chat";

  return (
    <main className="flex h-[calc(100dvh-80px)] min-h-0 w-full flex-col overflow-hidden bg-[#fffdfa] p-0">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-none border-0 bg-[#fffdfa] shadow-none">
        <LessonAITutor
          subject="Preparación Saber 11"
          topic="Estudio y aprendizaje"
          stage="theory"
          context="El estudiante está en el espacio de estudio de OmegaX. Ayúdalo a comprender temas de Saber 11, organizar recursos, crear apuntes y practicar con herramientas de estudio."
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) router.push("/dashboard");
          }}
          accent="orby"
          workspace
          assistantName="OmegaX"
          initialView={initialView}
        />
      </div>
    </main>
  );
}
