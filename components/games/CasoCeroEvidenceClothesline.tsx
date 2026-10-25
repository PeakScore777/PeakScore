"use client";

import { useEffect, useState } from "react";
import { PhotoClothesline, type PhotoClotheslineItem } from "@cos-design/photo-clothesline";
import { X } from "lucide-react";

type EvidencePhoto = PhotoClotheslineItem & {
  tag: string;
  competence: string;
};

const CASE_EVIDENCE: EvidencePhoto[] = [
  {
    src: "https://images.pexels.com/videos/5157996/pexels-photo-5157996.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Corriente de un río durante una tormenta, con agua golpeando las rocas",
    title: "01 · EL RÍO",
    description: "Punto de muestreo",
    tag: "OBSERVACIÓN",
    competence: "Interpretar una situación y distinguir observaciones de conclusiones.",
  },
  {
    src: "https://images.pexels.com/photos/20806050/pexels-photo-20806050.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Técnico de campo recolectando una muestra de agua para análisis",
    title: "02 · MUESTRAS",
    description: "Trabajo de campo",
    tag: "INDAGACIÓN",
    competence: "Comprobar si las muestras se obtuvieron bajo condiciones comparables.",
  },
  {
    src: "https://images.pexels.com/photos/8850985/pexels-photo-8850985.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Material de laboratorio para analizar una muestra líquida",
    title: "03 · LABORATORIO",
    description: "Análisis de datos",
    tag: "EVIDENCIA",
    competence: "Relacionar mediciones y unidades para decidir qué conclusión respaldan los datos.",
  },
];

export default function CasoCeroEvidenceClothesline() {
  const [layoutMode, setLayoutMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [activeEvidence, setActiveEvidence] = useState<number | null>(null);
  const active = activeEvidence === null ? null : CASE_EVIDENCE[activeEvidence];

  useEffect(() => {
    // Scale the physical photos for each device class. This keeps the line wide
    // while avoiding the tiny desktop thumbnails from the previous layout.
    const mobileQuery = window.matchMedia("(max-width: 640px)");
    const tabletQuery = window.matchMedia("(max-width: 1599px)");
    const update = () => {
      setLayoutMode(mobileQuery.matches ? "mobile" : tabletQuery.matches ? "tablet" : "desktop");
    };
    update();
    mobileQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
    };
  }, []);

  const dimensions = layoutMode === "mobile"
    ? { photoWidth: 96, photoHeight: 132, photoGap: 10, ropeTop: 22, ropeSag: 12, bandLength: 15, bandWidth: 4, maxPull: 14, tilt: 3 }
    : layoutMode === "tablet"
      ? { photoWidth: 230, photoHeight: 285, photoGap: 170, ropeTop: 42, ropeSag: 28, bandLength: 22, bandWidth: 6, maxPull: 18, tilt: 3.5 }
      : { photoWidth: 350, photoHeight: 380, photoGap: 260, ropeTop: 48, ropeSag: 32, bandLength: 28, bandWidth: 8, maxPull: 22, tilt: 3.5 };

  return (
    <div
      className={[
        "caso-cero-evidence-clothesline pointer-events-none absolute left-1/2 top-[1%] z-20",
        "-translate-x-1/2",
        "h-[210px] w-[98vw] sm:h-[405px] lg:h-[530px]",
      ].join(" ")}
      aria-label="Fotografías de evidencia de Caso Cero"
    >
      <div className="pointer-events-auto h-full w-full">
        <PhotoClothesline
          photos={CASE_EVIDENCE}
          width="100%"
          height="100%"
          photoWidth={dimensions.photoWidth}
          photoHeight={dimensions.photoHeight}
          photoGap={dimensions.photoGap}
          ropeTop={dimensions.ropeTop}
          ropeSag={dimensions.ropeSag}
          bandLength={dimensions.bandLength}
          bandWidth={dimensions.bandWidth}
          maxPull={dimensions.maxPull}
          stiffness={0.9}
          damping={0.42}
          tension={0.28}
          tilt={dimensions.tilt}
          ropeColor="#4a3024"
          bandColor="#795538"
          pinColor="#bc8746"
          frameColor="#e8ddc7"
          background="transparent"
          objectFit="cover"
          showCaption
          initialIndex={1}
          ariaLabel="Tendedero de fotografías con evidencias científicas"
          className="caso-cero-clothesline"
          onPhotoClick={(index) => setActiveEvidence(index)}
        />
      </div>

      {active && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="caso-cero-evidence-title"
          className="pointer-events-auto absolute left-1/2 top-[calc(100%-18px)] z-30 w-[min(360px,92vw)] -translate-x-1/2 border border-[#9c7949]/70 bg-[#061016]/95 p-3 text-[#eee3ce] shadow-[0_14px_38px_rgba(0,0,0,.65)] backdrop-blur-md sm:top-[calc(100%-22px)] sm:p-4"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black tracking-[.2em] text-[#a6d2c8]">
                PISTA {String((activeEvidence ?? 0) + 1).padStart(2, "0")} · {active.tag}
              </p>
              <h2 id="caso-cero-evidence-title" className="mt-1 text-sm font-black sm:text-base">
                {active.title?.replace(/^\d+ · /, "") ?? "Evidencia científica"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveEvidence(null)}
              aria-label="Cerrar pista"
              className="grid h-7 w-7 shrink-0 place-items-center border border-[#62513b] text-[#d8c8ad] transition hover:border-[#e4bc76] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#cad3d4] sm:text-xs">
            {active.competence}
          </p>
          <p className="mt-2 border-t border-[#5a4932]/70 pt-2 text-[9px] leading-4 text-[#d9b878]">
            Observa la pista y contrástala con las demás antes de formular una conclusión.
          </p>
        </aside>
      )}
    </div>
  );
}
