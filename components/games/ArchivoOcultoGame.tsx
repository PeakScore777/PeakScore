"use client";

import { FlipBook, Page } from "@openpageflip/react";
import type { Book } from "@openpageflip/core";
import {
  ArrowLeft, ArrowRight, CheckCircle2,
  Lightbulb, RotateCcw, X, XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchivoContentBlock, ArchivoQuestion, ArchivoReading } from "@/lib/games/archivo-oculto-bank";

const ArchivoOcultoLibrary3D = dynamic(() => import("./ArchivoOcultoLibrary3D"), { ssr: false });

type SuspectProfile = { id: string; name: string; role: string; description: string; motive: string; alibi: string; imageUrl: string | null };
type LibraryStory = { id: string; title: string; completed?: boolean; questions: PublicQuestion[]; suspects?: SuspectProfile[] };

type PublicQuestion = Omit<ArchivoQuestion, "answer" | "explanation">;

type DossierEvidence = {
  code: string;
  title: string;
  detail: string;
  source: string;
  scope: string;
};

// Estos registros resumen únicamente hechos y declaraciones ya incluidos en
// "El último testigo". Se distinguen fuente, dato y alcance para no convertir
// una coincidencia en una atribución de responsabilidad.
const EL_ULTIMO_TESTIGO_EVIDENCE: Record<string, DossierEvidence[]> = {
  "Inés Salcedo": [
    { code: "N-01", title: "Custodia del archivador", detail: "Su función en Planeación le daba acceso habitual al mueble donde se conservaba la carpeta de la audiencia.", source: "Descripción del cargo y relato de custodia", scope: "Acredita acceso funcional; no identifica quién abrió el segundo cajón durante el intervalo crítico." },
    { code: "N-02", title: "Revisión de la carpeta", detail: "Declaró haber terminado a las 18:10 y haber dejado el informe completo en el segundo cajón.", source: "Versión aportada por Inés Salcedo", scope: "El contenido que quedó en el cajón no tiene una comprobación independiente en el registro disponible." },
    { code: "N-03", title: "Salida del edificio", detail: "Una compañera la sitúa saliendo aproximadamente a las 18:18.", source: "Testimonio de una compañera", scope: "Sitúa una hora aproximada; no describe qué documentos llevaba consigo." }
  ],
  "Mateo Rincón": [
    { code: "N-01", title: "Apertura de la puerta lateral", detail: "El libro de novedades registra una apertura a las 18:32, durante el turno de vigilancia de Rincón.", source: "Libro de novedades de vigilancia", scope: "Registra la apertura de la puerta; no demuestra por sí sola un ingreso al archivo." },
    { code: "N-02", title: "Interrupción de cámara", detail: "La cámara del pasillo dejó de grabar entre las 18:28 y las 18:53.", source: "Registro del sistema de videovigilancia", scope: "Deja un intervalo sin corroboración visual del recorrido por el pasillo." },
    { code: "N-03", title: "Copia de la llave", detail: "El inventario indica que una copia del archivador fue entregada a vigilancia tres meses antes. Rincón afirmó que la devolvió, pero no presentó comprobante.", source: "Inventario de seguridad y declaración", scope: "La devolución material de la copia sigue sin documentarse." }
  ],
  "Vera Pardo": [
    { code: "N-01", title: "Registro de visitantes", detail: "El registro sitúa su ingreso a Planeación a las 17:20 y su salida a las 17:58.", source: "Registro de visitantes", scope: "Documenta una visita dentro de ese intervalo; no registra un segundo ingreso." },
    { code: "N-02", title: "Fotografía de la tabla", detail: "A las 19:12 remitió a la emisora un correo con una fotografía de una tabla de mediciones.", source: "Correo remitido a la emisora comunitaria", scope: "Confirma el envío de la imagen, no quién obtuvo o imprimió originalmente la hoja." },
    { code: "N-03", title: "Procedencia de la imagen", detail: "Declaró haber recibido la fotografía de una fuente anónima alrededor de las 18:05, después de salir de Planeación.", source: "Declaración de Vera Pardo", scope: "La identidad de la fuente y la ruta de entrega permanecen sin verificar." },
    { code: "N-04", title: "Fragmento PL-02", detail: "La fotografía coincide con un fragmento hallado en la papelera del equipo PL-02.", source: "Fragmento recuperado del equipo PL-02", scope: "La coincidencia vincula el contenido; no identifica quién imprimió la hoja ni quién retiró el original." }
  ],
  "Tomás Leal": [
    { code: "N-01", title: "Entrega del informe firmado", detail: "Leal afirmó haber entregado el informe firmado a las 16:40.", source: "Declaración de Tomás Leal", scope: "La hora de entrega declarada requiere contraste con el registro de recepción." },
    { code: "N-02", title: "Copia digital «tabla_final»", detail: "Conservaba una copia digital de trabajo vinculada al mismo conjunto de mediciones.", source: "Archivo digital referido en la declaración", scope: "La existencia de una copia explica acceso a los datos, pero no acredita la sustracción del informe físico." },
    { code: "N-03", title: "Marca temporal 18:47", detail: "El archivo «tabla_final» figura modificado a las 18:47; Leal atribuyó la hora a una posible sincronización automática.", source: "Marca temporal del archivo y versión aportada", scope: "La causa de la modificación no está determinada y necesita verificación técnica." },
    { code: "N-04", title: "Fotografía en reunión vecinal", detail: "Una fotografía lo muestra en una reunión de otro barrio a las 18:25.", source: "Fotografía de la reunión vecinal", scope: "No permite establecer cuánto tiempo permaneció allí ni quién tomó la imagen." }
  ]
};

function getDossierEvidenceEntries(suspect: SuspectProfile | null, storyTitle: string): DossierEvidence[] {
  if (!suspect || storyTitle.trim().toLowerCase() !== "el último testigo".toLowerCase()) return [];
  return EL_ULTIMO_TESTIGO_EVIDENCE[suspect.name] ?? [];
}

type DossierTimelineEntry = {
  time: string;
  event: string;
  source: string;
  record: "Registro" | "Declaración" | "Testimonio" | "Hallazgo";
};

type DossierNarrative = {
  relation: string;
  statement: string;
  analysis: string;
  pending: string[];
};

const EL_ULTIMO_TESTIGO_TIMELINE: Record<string, DossierTimelineEntry[]> = {
  "Inés Salcedo": [
    { time: "18:10", event: "Afirma haber terminado la revisión y haber dejado el informe completo en el segundo cajón.", source: "Versión de Inés Salcedo", record: "Declaración" },
    { time: "18:18", event: "Una compañera la sitúa saliendo del edificio; no pudo confirmar si llevaba la carpeta habitual.", source: "Testimonio de una compañera", record: "Testimonio" },
    { time: "D+1 · 06:50", event: "A la mañana siguiente se encuentra la carpeta, pero falta el informe firmado y las páginas de medición.", source: "Relato del hallazgo en la crónica", record: "Hallazgo" }
  ],
  "Mateo Rincón": [
    { time: "3 meses antes", event: "El inventario documenta la entrega de una copia de la llave del archivador a vigilancia.", source: "Inventario de seguridad", record: "Registro" },
    { time: "18:28", event: "Comienza el intervalo sin grabación de la cámara del pasillo por una falla de alimentación.", source: "Informe de mantenimiento", record: "Registro" },
    { time: "18:32", event: "Se registra la apertura de la puerta lateral durante su turno.", source: "Libro de novedades", record: "Registro" },
    { time: "18:53", event: "Finaliza el intervalo de interrupción de la cámara.", source: "Registro del sistema de videovigilancia", record: "Registro" }
  ],
  "Vera Pardo": [
    { time: "17:20", event: "Ingreso a las instalaciones de Planeación.", source: "Registro de visitantes", record: "Registro" },
    { time: "17:58", event: "Salida de las instalaciones; no aparece un segundo ingreso en el registro consultado.", source: "Registro de visitantes", record: "Registro" },
    { time: "18:05", event: "Afirma haber recibido de una fuente anónima la fotografía de la tabla.", source: "Declaración de Vera Pardo", record: "Declaración" },
    { time: "19:12", event: "Envía a la emisora un correo con la fotografía de las mediciones.", source: "Correo remitido a la emisora", record: "Registro" }
  ],
  "Tomás Leal": [
    { time: "16:40", event: "Afirma haber entregado el informe firmado.", source: "Declaración de Tomás Leal", record: "Declaración" },
    { time: "17:05", event: "Afirma haberse marchado del edificio.", source: "Declaración de Tomás Leal", record: "Declaración" },
    { time: "18:25", event: "Una fotografía lo muestra en una reunión vecinal de otro barrio; no establece cuánto tiempo permaneció allí.", source: "Fotografía de la reunión vecinal", record: "Registro" },
    { time: "18:47", event: "El archivo de trabajo «tabla_final» figura como modificado.", source: "Metadatos del archivo", record: "Registro" }
  ]
};

const EL_ULTIMO_TESTIGO_NARRATIVE: Record<string, DossierNarrative> = {
  "Inés Salcedo": {
    relation: "Como archivista de Planeación, tenía acceso habitual al mueble y organizó la carpeta que debía llegar a la audiencia. Su versión sitúa la última revisión a las 18:10 y afirma que el informe quedó completo en el segundo cajón. La compañera que la vio salir a las 18:18 no pudo precisar si transportaba la carpeta. El expediente acredita una función de custodia; no contiene un registro individual que demuestre quién abrió el cajón durante el intervalo investigado.",
    statement: "Salcedo sostiene que su discusión con el autor del estudio se refería a la inclusión de nombres de familias. Explicó que buscaba proteger datos personales y mantuvo que dejó el informe completo. La salida del edificio tiene un testimonio aproximado; el contenido de lo que llevaba no quedó establecido.",
    analysis: "La cuestión verificable no es si tenía acceso —su cargo lo explica—, sino si el informe permaneció en el cajón después de su última revisión. La discrepancia entre su versión y el hallazgo de la mañana siguiente requiere una fuente independiente. El desacuerdo sobre datos personales no demuestra intención de retirar resultados.",
    pending: ["Solicitar el registro de entrega, préstamo y devolución de llaves del archivador.", "Comprobar si existe constancia de apertura o movimiento del segundo cajón.", "Precisar, mediante una fuente independiente, qué objetos llevaba al salir a las 18:18."]
  },
  "Mateo Rincón": {
    relation: "Rincón cubría la vigilancia de la tarde. El libro de novedades le atribuye la apertura de la puerta lateral a las 18:32, dentro del intervalo en que la cámara del pasillo dejó de grabar. La crónica relaciona ese acceso con la espera de un técnico de alarmas, cuya llegada él niega. El registro documenta la puerta abierta; no documenta un ingreso al archivo ni la manipulación del archivador.",
    statement: "El vigilante afirma que abrió la puerta para revisar el sensor desde el pasillo y que el técnico nunca llegó. También sostuvo que la copia de la llave del archivador había sido devuelta. No presentó el comprobante de devolución mencionado en su versión.",
    analysis: "La coincidencia horaria entre la apertura de la puerta y el corte de cámara delimita un intervalo que merece revisión, pero no reconstruye el recorrido de Rincón. La pregunta pendiente es la custodia efectiva de la copia de la llave y la finalidad de la apertura registrada, no una atribución automática basada en el turno.",
    pending: ["Cotejar el libro de novedades con el informe técnico del corte eléctrico.", "Verificar la entrega y devolución de la copia de la llave mediante inventario o recibo.", "Determinar si existe otra fuente que permita reconstruir el recorrido durante el intervalo sin video."]
  },
  "Vera Pardo": {
    relation: "Pardo había solicitado el informe durante las dos semanas anteriores y publicó una nota crítica sobre la transparencia de la audiencia. El registro de visitantes sitúa su permanencia en Planeación entre las 17:20 y las 17:58. Más tarde, la emisora recibió un correo suyo con una fotografía de una tabla de mediciones. La publicación acredita circulación de información; no establece quién obtuvo la hoja ni cómo llegó a sus manos.",
    statement: "La periodista reconoce que la tabla podía darle una primicia. Asegura que recibió la fotografía de una fuente anónima alrededor de las 18:05, después de abandonar Planeación, y niega haber retirado páginas del archivador. La fuente no está identificada en el material disponible.",
    analysis: "La secuencia entre la salida registrada, la hora de recepción declarada y el envío posterior puede contrastarse con el mensaje original y sus metadatos. El interés periodístico explica por qué buscaba la información, pero no demuestra que hubiera accedido al archivador ni que sustrajera el documento.",
    pending: ["Conservar y revisar el correo original, incluidos sus metadatos y adjuntos.", "Establecer la ruta de recepción de la fotografía sin asumir la identidad de la fuente.", "Comparar la tabla publicada con el fragmento recuperado del equipo PL-02."]
  },
  "Tomás Leal": {
    relation: "Leal participó en el estudio hídrico y advirtió que las mediciones de la quebrada La Honda no coincidían con las cifras resumidas en la presentación del proyecto. Afirmó que pidió corregirlas antes de la audiencia y que entregó el informe firmado a las 16:40. En su computador se encontró una copia de trabajo llamada «tabla_final», vinculada al mismo conjunto de mediciones.",
    statement: "El ingeniero sostiene que salió a las 17:05 y que la modificación registrada a las 18:47 pudo producirse por una actualización automática de la carpeta sincronizada. Una fotografía lo ubica en una reunión vecinal a las 18:25, pero no permite establecer cuánto tiempo permaneció allí.",
    analysis: "Su intervención técnica y la existencia de una copia digital explican que conociera las cifras. La marca temporal no equivale necesariamente a una apertura manual ni demuestra que el archivo se utilizara para retirar páginas. La verificación debe separar la hora registrada por el sistema de la actividad de una persona.",
    pending: ["Obtener el historial de versiones y sincronización de «tabla_final».", "Cotejar la entrega declarada del informe con el registro de recepción.", "Verificar el contexto y la hora de la fotografía de la reunión vecinal."]
  }
};

function getDossierNarrative(suspect: SuspectProfile | null, storyTitle: string): DossierNarrative | null {
  if (!suspect || storyTitle.trim().toLowerCase() !== "el último testigo".toLowerCase()) return null;
  return EL_ULTIMO_TESTIGO_NARRATIVE[suspect.name] ?? null;
}

function getDossierTimeline(suspect: SuspectProfile | null, storyTitle: string): DossierTimelineEntry[] {
  if (!suspect || storyTitle.trim().toLowerCase() !== "el último testigo".toLowerCase()) return [];
  return EL_ULTIMO_TESTIGO_TIMELINE[suspect.name] ?? [];
}
type Phase = "loading" | "cover" | "playing" | "suspects" | "finished";
type AnswerFeedback = {
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};
type ContentSource = "database";

function BookPaper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"archivo-paper relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f4e8d0] text-[#302313] " + className}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(110,76,38,.15) 0, rgba(110,76,38,.15) 1px, transparent 1px, transparent 5px), radial-gradient(ellipse at 15% 8%, rgba(255,255,255,.9), transparent 45%)",
      }} />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <span className="archivo-page-label font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#956e3e]">{children}</span>;
}

function InteractiveEvidencePhoto({ block }: { block: Extract<ArchivoContentBlock, { type: "image" }> }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [lens, setLens] = useState<{ x: number; y: number; u: number; v: number; width: number; height: number; src: string } | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const lensSize = 112;
  const zoomFactor = 3.15;

  useEffect(() => () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    pendingPointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (pointerFrameRef.current !== null) return;

    pointerFrameRef.current = window.requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      const point = pendingPointerRef.current;
      const frame = frameRef.current;
      const image = imageRef.current;
      if (!point || !frame || !image) return;

      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const naturalWidth = image.naturalWidth || 1;
      const naturalHeight = image.naturalHeight || 1;
      const imageRatio = naturalWidth / naturalHeight;
      const boxRatio = imageRect.width / Math.max(1, imageRect.height);
      const displayedWidth = boxRatio > imageRatio ? imageRect.height * imageRatio : imageRect.width;
      const displayedHeight = boxRatio > imageRatio ? imageRect.height : imageRect.width / imageRatio;
      const imageLeft = imageRect.left + (imageRect.width - displayedWidth) / 2;
      const imageTop = imageRect.top + (imageRect.height - displayedHeight) / 2;
      const u = (point.clientX - imageLeft) / Math.max(1, displayedWidth);
      const v = (point.clientY - imageTop) / Math.max(1, displayedHeight);

      if (u < 0 || u > 1 || v < 0 || v > 1) {
        setLens(null);
        return;
      }

      setLens({
        x: point.clientX - frameRect.left,
        y: point.clientY - frameRect.top,
        u,
        v,
        width: displayedWidth,
        height: displayedHeight,
        src: image.currentSrc || image.src,
      });
    });
  };

  const handlePointerLeave = () => {
    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
      pointerFrameRef.current = null;
    }
    pendingPointerRef.current = null;
    setLens(null);
  };

  return (
    <figure
      data-opf-no-flip
      data-layout={block.layout === "wide" ? "wide" : "float"}
      className={"archivo-evidence-photo " + (block.layout === "wide"
        ? "my-5 clear-both w-full"
        : "float-right mb-3 ml-4 mt-1 w-[46%] max-w-[230px]") + " relative"}
    >
      <div
        ref={frameRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        data-opf-no-flip
        className="relative overflow-hidden border-[5px] border-[#a88756] bg-[#e7d4ae] p-1.5 shadow-[0_5px_12px_rgba(50,29,11,.24)]"
      >
        <div className="relative overflow-hidden border border-[#6b4c2b] bg-[#21170f]">
          <Image
            ref={imageRef}
            src={block.url}
            alt={block.alt || "Imagen del expediente"}
            width={900}
            height={620}
            draggable={false}
            className="archivo-evidence-image block h-auto w-full select-none object-contain"
            sizes="(max-width: 767px) 88vw, (max-width: 1199px) 42vw, 520px"
            loading="lazy"
          />
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-2 border-t-2 border-[#f7e8c8]/80" />
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-2 border-r-2 border-[#f7e8c8]/80" />

        {lens && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-20 h-0 w-0"
            style={{ left: lens.x, top: lens.y }}
          >
            <div
              className="absolute left-[39px] top-[40px] z-0 h-[23px] w-[132px] origin-[12px_11px] rotate-[43deg] rounded-[8px] border border-[#24170e] shadow-[2px_5px_8px_rgba(0,0,0,.56)]"
              style={{ background: "linear-gradient(180deg,#b8793c 0%,#4a2817 18%,#21130c 48%,#6a3c21 78%,#c58a4a 100%)" }}
            />
            <div
              className="absolute left-[44px] top-[44px] z-[1] h-[13px] w-[116px] origin-[7px_6px] rotate-[43deg] rounded-[5px] border border-[#d4a66a]/50"
              style={{ background: "linear-gradient(180deg,#b47a47,#4c2b19 45%,#2b190f)" }}
            />
            <div
              className="absolute left-[29px] top-[30px] z-[2] h-[30px] w-[34px] origin-[16px_15px] rotate-[43deg] rounded-[7px] border border-[#4a2b16] shadow-sm"
              style={{ background: "linear-gradient(135deg,#f2d39c 0%,#986432 28%,#3d2515 54%,#dfb779 82%,#6c441f 100%)" }}
            />
            <div className="absolute -left-[65px] -top-[65px] z-[3] h-[130px] w-[130px] rounded-full border-[5px] border-[#392718] shadow-[0_5px_12px_rgba(0,0,0,.55),inset_0_1px_2px_rgba(255,255,255,.7)]" style={{ background: "linear-gradient(135deg,#f2d39c 0%,#a06a31 20%,#392415 43%,#1d120b 62%,#d9ad6d 86%,#4b2d18 100%)" }} />
            <div
              className="absolute -left-[56px] -top-[56px] z-[4] overflow-hidden rounded-full border border-[#dfc58d]/90 shadow-[inset_0_2px_8px_rgba(255,255,255,.3)]"
              style={{ width: lensSize, height: lensSize, background: "rgba(225,205,158,.16)" }}
            >
              <div className="absolute inset-0" style={{
                backgroundImage: "url('" + lens.src + "')",
                backgroundRepeat: "no-repeat",
                backgroundSize: lens.width * zoomFactor + "px " + lens.height * zoomFactor + "px",
                backgroundPosition: (lensSize / 2 - lens.u * lens.width * zoomFactor) + "px " + (lensSize / 2 - lens.v * lens.height * zoomFactor) + "px",
                filter: "contrast(1.08) sepia(.08)",
              }} />
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at 24% 15%,rgba(255,255,255,.55),transparent 28%),linear-gradient(135deg,rgba(255,255,255,.12),transparent 54%,rgba(30,14,4,.2))" }} />
            </div>
          </div>
        )}
      </div>
      <figcaption className="mt-1 border-x border-b border-[#c6a878] bg-[#ead9b8] px-2 py-1.5 text-center">
        <span className="block font-mono text-[7px] font-black uppercase tracking-[.16em] text-[#9b3025]">Evidencia del expediente · Examina con la lupa</span>
        {block.caption && <span className="mt-0.5 block font-serif text-[9px] italic leading-tight text-[#684b2e]">{block.caption}</span>}
      </figcaption>
    </figure>
  );
}

function splitParagraphAtSentenceRatio(text: string, ratio: number): [string, string] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜ¿¡])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    const targetLength = text.length * ratio;
    let bestIndex = 1;
    let bestDistance = Number.POSITIVE_INFINITY;
    let currentLength = 0;

    for (let index = 1; index < sentences.length; index += 1) {
      currentLength += sentences[index - 1].length + 1;
      const distance = Math.abs(currentLength - targetLength);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    return [
      sentences.slice(0, bestIndex).join(" "),
      sentences.slice(bestIndex).join(" "),
    ];
  }

  const words = text.trim().split(/\s+/);
  const target = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));
  return [words.slice(0, target).join(" "), words.slice(target).join(" ")];
}

function splitReadingIntoPages(reading: ArchivoReading | null, pageCount: number): ArchivoContentBlock[][] {
  const blocks: ArchivoContentBlock[] = reading?.contentBlocks?.length
    ? reading.contentBlocks
    : (reading?.paragraphs ?? []).map((text) => ({ type: "paragraph" as const, text }));
  const safePageCount = Math.max(1, pageCount);
  const sections: ArchivoContentBlock[][] = [];

  // Keep each documentary image attached to the paragraph that introduces it.
  // Editorial subheadings belong to the following paragraph, not the previous one.
  let pendingSubheadings: ArchivoContentBlock[] = [];
  for (const block of blocks) {
    if (block.type === "subheading") {
      pendingSubheadings.push(block);
      continue;
    }

    if (block.type === "paragraph" || sections.length === 0) {
      sections.push([...pendingSubheadings, block]);
      pendingSubheadings = [];
    } else {
      sections[sections.length - 1].push(block);
    }
  }

  if (pendingSubheadings.length && sections.length) {
    sections[sections.length - 1].push(...pendingSubheadings);
  }

  // For the six-part structure of "El caso de las 9:17", keep the chronology:
  // opening/photo, testimony + register, photo limitations + signed statement,
  // source-evaluation theory, and the final applied synthesis.
  if (safePageCount === 5 && sections.length === 7) {
    return [
      sections[0],
      sections[1],
      [...sections[2], ...sections[3]],
      [...sections[4], ...sections[5]],
      sections[6],
    ];
  }

  if (safePageCount === 5 && sections.length === 6) {
    return [
      sections[0],
      sections[1],
      sections[2],
      [...sections[3], ...sections[4]],
      sections[5],
    ];
  }

  const sectionWeight = (section: ArchivoContentBlock[]) =>
    section.reduce((total, block) => total + (block.type === "paragraph" ? block.text.length : 0), 0);
  const sectionHasImage = (section: ArchivoContentBlock[]) =>
    section.some((block) => block.type === "image");

  // If there are fewer content sections than question pages, split the longest
  // paragraph at a sentence boundary. Any image stays with the final fragment.
  while (sections.length < safePageCount) {
    const candidates = sections
      .map((section, index) => ({ section, index, weight: sectionWeight(section), hasImage: sectionHasImage(section) }))
      .filter(({ weight }) => weight >= 180)
      .sort((a, b) => {
        if (a.hasImage !== b.hasImage) return Number(a.hasImage) - Number(b.hasImage);
        return b.weight - a.weight;
      });

    const candidate = candidates[0];
    if (!candidate) break;

    const paragraphIndex = candidate.section.findIndex((block) => block.type === "paragraph");
    if (paragraphIndex < 0) break;
    const paragraph = candidate.section[paragraphIndex];
    if (paragraph.type !== "paragraph") break;

    const [firstHalf, secondHalf] = splitParagraphAtSentenceRatio(paragraph.text, 0.5);
    if (!firstHalf || !secondHalf || firstHalf === paragraph.text || secondHalf === paragraph.text) break;

    const trailingBlocks = candidate.section.slice(paragraphIndex + 1);
    sections.splice(
      candidate.index,
      1,
      [{ type: "paragraph", text: firstHalf }],
      [{ type: "paragraph", text: secondHalf }, ...trailingBlocks],
    );
  }

  // When there are more sections than pages, group neighbouring sections in
  // reading order by text weight. This keeps all content and evidence in sequence.
  const pages: ArchivoContentBlock[][] = [];
  let cursor = 0;

  for (let pageIndex = 0; pageIndex < safePageCount; pageIndex += 1) {
    const pagesRemaining = safePageCount - pageIndex;
    const sectionsRemaining = sections.length - cursor;
    if (sectionsRemaining <= 0) {
      pages.push([]);
      continue;
    }

    const remainingWeight = sections
      .slice(cursor)
      .reduce((total, section) => total + sectionWeight(section), 0);
    const targetWeight = remainingWeight / pagesRemaining;
    const pageSections = [sections[cursor++]];
    let pageWeight = sectionWeight(pageSections[0]);

    while (cursor < sections.length && sections.length - cursor >= pagesRemaining - 1) {
      const nextWeight = sectionWeight(sections[cursor]);
      if (pageWeight >= targetWeight || (pageSections.length > 0 && pageWeight + nextWeight > targetWeight * 1.18)) {
        break;
      }
      pageSections.push(sections[cursor++]);
      pageWeight += nextWeight;
    }

    pages.push(pageSections.flat());
  }

  return pages;
}

function ReadingContent({ blocks }: { blocks: ArchivoContentBlock[] }) {
  const textLength = blocks.reduce((total, block) => total + (block.type === "paragraph" ? block.text.length : 0), 0);
  const readingFontSize = textLength > 1400 ? "12px" : "13.5px";
  const readingLineHeight = 1.52;

  return (
    <div
      className="archivo-reading-body reading-content min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 text-justify text-[#493822]"
      style={{ fontSize: readingFontSize, lineHeight: readingLineHeight }}
    >
      {blocks.map((block, index) => {
        if (block.type === "image") {
          return <InteractiveEvidencePhoto key={"evidence-" + index} block={block} />;
        }

        if (block.type === "subheading") {
          return (
            <h3 key={"subheading-" + index} className="archivo-reading-subheading mb-2 mt-3 border-b border-[#b89561] pb-1 font-serif text-[13px] font-bold uppercase tracking-[.08em] text-[#7c4e20]">
              {block.text}
            </h3>
          );
        }

        return (
          <p key={"paragraph-" + index} className="archivo-reading-paragraph mb-4 text-justify indent-4 last:mb-0">
            {block.text}
          </p>
        );
      })}
      <div aria-hidden="true" className="clear-both" />
    </div>
  );
}

export default function ArchivoOcultoGame() {
  const bookRef = useRef<Book>(null);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [readings, setReadings] = useState<ArchivoReading[]>([]);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [activeSuspects, setActiveSuspects] = useState<SuspectProfile[]>([]);
  const [activeStoryTitle, setActiveStoryTitle] = useState("");
  const [selectedSuspect, setSelectedSuspect] = useState<SuspectProfile | null>(null);
  const [suspectTransitionDirection, setSuspectTransitionDirection] = useState(1);
  const [inspectionSettled, setInspectionSettled] = useState(false);
  const [libraryMount, setLibraryMount] = useState(0);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [returnBookToShelfToken, setReturnBookToShelfToken] = useState(0);
  const [source, setSource] = useState<ContentSource>("database");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bookPage, setBookPage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, AnswerFeedback>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handheld, setHandheld] = useState(false);

  const handleInspectionSettled = useCallback(() => {
    setInspectionSettled(true);
  }, []);

  useEffect(() => {
    // Freesound: SpaceJoe, "Quiet Page Turn - 8" (CC0).
    // Preview MP3 is used so the sound can be fetched without a Freesound login.
    const audio = new Audio("/audio/archivo-oculto/page-turn.mp3");
    audio.preload = "none";
    audio.volume = 0.38;
    pageTurnAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.currentTime = 0;
      pageTurnAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px), (pointer: coarse) and (max-width: 1024px)");
    const update = () => setHandheld(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/games/archivo-oculto/questions", {
      credentials: "same-origin",
      cache: "no-store",
    }).then(async (contentResponse) => {
      const content = await contentResponse.json().catch(() => ({}));
      if (!contentResponse.ok) throw new Error(content.error ?? "No se pudieron cargar las historias.");
      if (!Array.isArray(content.stories)) throw new Error("La biblioteca no recibió historias publicadas.");
      if (!active) return;
      setStories(content.stories as LibraryStory[]);
      setSource("database");
      setPhase("cover");
    }).catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : "No se pudieron cargar las historias.");
        setStories([]);
        setPhase("cover");
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onHelpKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyH" || event.repeat || (phase !== "playing" && phase !== "suspects")) return;
      event.preventDefault();
      setControlsOpen((open) => !open);
    };
    window.addEventListener("keydown", onHelpKey);
    return () => window.removeEventListener("keydown", onHelpKey);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "suspects") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || savingAnswer || finishing) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        event.preventDefault();
        document.exitPointerLock?.();
        setSelectedSuspect(null);
        setReturnBookToShelfToken((value) => value + 1);
        setPhase("cover");
        return;
      }
      if (phase === "suspects" && selectedSuspect && (event.code === "ArrowLeft" || event.code === "ArrowRight")) {
        event.preventDefault();
        const currentIndex = activeSuspects.findIndex((person) => person.id === selectedSuspect.id);
        const direction = event.code === "ArrowRight" ? 1 : -1;
        const nextIndex = currentIndex + direction;
        if (nextIndex >= 0 && nextIndex < activeSuspects.length) {
          setSuspectTransitionDirection(direction);
          setSelectedSuspect(activeSuspects[nextIndex]);
        }
        return;
      }
      if (event.code !== "KeyF") return;
      event.preventDefault();
      setSelectedSuspect(null);
      if (phase === "playing") {
        // Reset the camera-settled flag in the same input event that opens inspection.
        setInspectionSettled(false);
        // F opens suspect inspection. The reader already has a visible cursor;
        // make sure the browser does not keep a captured mouse from the library.
        document.exitPointerLock?.();
        setPhase("suspects");
      } else {
        // F returns to the open book, NOT to first-person exploration.
        // Keep the pointer visible and leave Pointer Lock released.
        document.exitPointerLock?.();
        setPhase("playing");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSuspects, finishing, phase, savingAnswer, selectedSuspect]);

  const selectedSuspectIndex = selectedSuspect ? activeSuspects.findIndex((suspect) => suspect.id === selectedSuspect.id) : -1;
  const activeCaseCode = activeStoryTitle.trim().toLowerCase() === "el último testigo" ? "002" : "S/C";
  const suspectEvidenceEntries = getDossierEvidenceEntries(selectedSuspect, activeStoryTitle);
  const suspectNarrative = getDossierNarrative(selectedSuspect, activeStoryTitle);
  const suspectTimeline = getDossierTimeline(selectedSuspect, activeStoryTitle);
  const currentQuestion = questions[questionIndex] ?? null;
  const feedback = currentQuestion ? feedbackById[currentQuestion.id] ?? null : null;
  const correctCount = Object.values(feedbackById).filter((answer) => answer.isCorrect).length;
  const answeredCount = Object.keys(feedbackById).length;
  const score = questions.length ? Math.round((correctCount * 1000) / questions.length) : 0;
  const investigatorRank = score === 1000
    ? "Maestro de evidencias"
    : score >= 700
      ? "Analista del expediente"
      : score >= 400
        ? "Investigador en formación"
        : "Expediente por revisar";
  const readingPagesByQuestionId = useMemo(() => {
    const pagesByQuestion = new Map<string, { reading: ArchivoReading; blocks: ArchivoContentBlock[] }>();

    for (const reading of readings) {
      const relatedQuestions = questions.filter((question) => question.readingId === reading.id);
      const pages = splitReadingIntoPages(reading, relatedQuestions.length);
      relatedQuestions.forEach((question, index) => {
        pagesByQuestion.set(question.id, {
          reading,
          blocks: pages[index] ?? [],
        });
      });
    }

    return pagesByQuestion;
  }, [questions, readings]);

  useEffect(() => {
    if (phase !== "cover") return;
    const frame = window.requestAnimationFrame(() => {
      bookRef.current?.flipTo(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const lastAudioFlipRef = useRef<string | null>(null);

  const handleFlipProgress = useCallback((event: { from: number; to: number; progress: number }) => {
    const lastPage = (bookRef.current?.pageCount ?? 0) - 1;
    const isCoverTurn =
      event.from === 0 || event.to === 0 ||
      event.from === lastPage || event.to === lastPage;

    // Only soft interior pages should make a paper sound. Hard front/back covers stay silent.
    if (isCoverTurn) {
      lastAudioFlipRef.current = null;
      return;
    }

    if (event.progress <= 0 || event.progress >= 1) {
      lastAudioFlipRef.current = null;
      return;
    }

    const flipKey = `${event.from}->${event.to}`;
    if (lastAudioFlipRef.current === flipKey) return;
    lastAudioFlipRef.current = flipKey;

    const pageTurnAudio = pageTurnAudioRef.current;
    if (!pageTurnAudio) return;
    pageTurnAudio.currentTime = 0;
    void pageTurnAudio.play().catch(() => {
      // Browsers may block playback until the first direct user interaction.
    });
  }, []);

  const handleFlip = useCallback((event: { page: number }) => {
    setBookPage(event.page);
    if (event.page > 0 && questions.length) {
      const index = Math.min(questions.length - 1, Math.max(0, Math.floor((event.page - 1) / 2)));
      setQuestionIndex(index);
      setSelectedOption(feedbackById[questions[index]?.id]?.selectedOption ?? null);
    }
  }, [feedbackById, questions]);

  const startBook = useCallback(async (story: LibraryStory) => {
    if (starting || story.questions.length !== 5) return;
    setStarting(true);
    setError(null);
    document.exitPointerLock?.();
    try {
      const response = await fetch("/api/games/archivo-oculto/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, questionIds: story.questions.map((question) => question.id) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.sessionId !== "string"
        || !Array.isArray(payload.questions) || !Array.isArray(payload.readings)) {
        throw new Error(payload.error ?? "No se pudo iniciar la historia.");
      }
      setSessionId(payload.sessionId);
      setQuestions(payload.questions as PublicQuestion[]);
      setReadings(payload.readings as ArchivoReading[]);
      setActiveSuspects(story.suspects ?? []);
      setActiveStoryTitle(story.title);
      setSelectedSuspect(null);
      setPhase("playing");
      setQuestionIndex(0);
      setSelectedOption(null);
      setFeedbackById({});
      setBookPage(1);
      window.requestAnimationFrame(() => bookRef.current?.flipTo(1));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir la historia.");
    } finally {
      setStarting(false);
    }
  }, [source, starting]);

  const submitAnswer = useCallback(async () => {
    if (!sessionId || !currentQuestion || selectedOption === null || savingAnswer || feedback) return;
    setSavingAnswer(true);
    setError(null);
    try {
      const response = await fetch("/api/games/archivo-oculto/answer", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, selectedOption }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Number.isInteger(payload.correctOption) || typeof payload.explanation !== "string") {
        throw new Error(payload.error ?? "No se pudo validar tu respuesta.");
      }
      setFeedbackById((previous) => ({
        ...previous,
        [currentQuestion.id]: {
          selectedOption,
          correctOption: Number(payload.correctOption),
          isCorrect: Boolean(payload.isCorrect),
          explanation: payload.explanation,
        },
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar tu respuesta.");
    } finally {
      setSavingAnswer(false);
    }
  }, [currentQuestion, feedback, savingAnswer, selectedOption, sessionId]);

  const finishBook = useCallback(async () => {
    if (!sessionId || answeredCount !== questions.length || finishing) {
      setError("Responde las " + questions.length + " preguntas antes de cerrar el expediente.");
      return;
    }
    setFinishing(true);
    setError(null);
    try {
      const completionResponse = await fetch("/api/games/archivo-oculto/complete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const completed = await completionResponse.json().catch(() => ({}));
      if (!completionResponse.ok || !completed.completion?.progress) {
        throw new Error(completed.error ?? "No se pudo registrar el cierre de la lectura.");
      }

      setCompletionMessage("Tu resultado quedó guardado. Este libro ya forma parte de tu archivo completado.");
      setStories((previous) => previous.map((story) =>
        story.questions.every((question) => questions.some((item) => item.id === question.id))
          ? { ...story, completed: true }
          : story,
      ));
      setPhase("finished");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el resultado.");
    } finally {
      setFinishing(false);
    }
  }, [answeredCount, finishing, questions, sessionId]);

  const restartBook = useCallback(() => {
    setQuestionIndex(0);
    setSelectedOption(null);
    setFeedbackById({});
    setSessionId(null);
    setError(null);
    setCompletionMessage(null);
    setBookPage(0);
    setLibraryMount((value) => value + 1);
    setPhase("cover");
  }, []);

  if (handheld) {
    return (
      <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#17110c] px-5 text-center text-[#f3e4c5]">
        <section className="max-w-md border border-[#80613a] bg-[#21170e]/95 p-7 shadow-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#d6b47e]">El Archivo Oculto</p>
          <h1 className="mt-3 font-serif text-2xl font-bold">Disponible solo en computador</h1>
          <p className="mt-3 text-sm leading-6 text-[#d7c5a4]">Esta experiencia está diseñada para jugarse desde un computador, con el libro abierto en pantalla completa y sus herramientas de investigación.</p>
          <Link href="/aprender/juegos" className="mt-6 inline-flex min-h-11 items-center justify-center border border-[#c6a46b] bg-[#392916] px-5 py-3 text-xs font-black text-[#f7e8c5] hover:bg-[#4c351b]">Volver a los juegos</Link>
        </section>
      </main>
    );
  }

  if (phase === "loading") {
    return (
      <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#17110c] px-5 text-[#f3e4c5]">
        <div className="flex items-center gap-3 border border-[#6e512d] bg-[#21170e] px-5 py-4 text-sm">
          <span className="h-2 w-2 animate-pulse bg-[#d5a34e]" /> Preparando el libro…
        </div>
      </main>
    );
  }

  if (phase === "finished") {
    return (
      <main className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#17110c] px-4 py-7 text-[#f4e6ca] sm:px-7 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/aprender/juegos" aria-label="Salir del juego" title="Salir del juego" className="archivo-exit-arrow" >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Salir del juego</span>
          </Link>
          <section className="mt-7 border-[5px] border-double border-[#9e7944] bg-[#21180f] p-6 shadow-[8px_8px_0_#090705] sm:p-10">
            <div className="archivo-finish-monogram mx-auto grid h-16 w-16 place-items-center" aria-hidden="true"><span>001</span></div>
            <SmallLabel>Expediente 001 · Informe de lectura</SmallLabel>
            <h1 className="mt-3 text-center font-serif text-3xl font-bold sm:text-4xl">Lectura concluida</h1>
            <p className="mt-3 text-center text-sm text-[#d0bd9c]">Has terminado {readings.length === 1 ? "la lectura y sus cinco preguntas." : "las dos lecturas y sus diez preguntas."}</p>
            <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#e5c58f]">
              Rango obtenido · {investigatorRank}
            </p>
            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4">
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Aciertos</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{correctCount}<span className="text-sm text-[#bda67e]">/{questions.length}</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Puntaje</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{score}<span className="text-sm text-[#bda67e]">/1000</span></p></div>
              <div className="border border-[#6b5231] bg-[#17120d] p-3 text-center"><p className="text-[9px] uppercase tracking-widest text-[#bda67e]">Respondidas</p><p className="mt-2 text-3xl font-black text-[#f4d48f]">{answeredCount}<span className="text-sm text-[#bda67e]">/{questions.length}</span></p></div>
            </div>
            {completionMessage && <p className="mt-6 border border-[#927342] bg-[#302315] p-4 text-center text-sm font-semibold text-[#f0d59c]">{completionMessage}</p>}
            {error && <p role="alert" className="mt-4 border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
            <div className="mt-7">
              <h2 className="font-serif text-xl font-bold">Repasa tus respuestas</h2>
              <div className="mt-4 space-y-3">
                {questions.map((question, index) => {
                  const answer = feedbackById[question.id];
                  return (
                    <article key={question.id} className="border border-[#6a5233] bg-[#17120d] p-4">
                      <div className="flex items-start gap-2">
                        {answer?.isCorrect ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#e9d6b1]">{index + 1}. {question.prompt}</p>
                          <p className="mt-2 text-xs leading-5 text-[#bba987]">{answer?.explanation ?? "Sin respuesta registrada."}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={restartBook} className="inline-flex min-h-11 items-center gap-2 border border-[#c6a46b] bg-[#392916] px-5 py-3 text-xs font-black text-[#f7e8c5] hover:bg-[#4c351b]"><RotateCcw className="h-4 w-4" /> Volver a practicar</button>
              <Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 border border-[#a78655] px-5 py-3 text-xs font-bold text-[#d9c7a6] hover:bg-white/5">Salir del archivo <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="archivo-oculto relative min-h-[calc(100svh-72px)] w-full overflow-hidden p-0 text-[#f2e3c5]"
      style={{ background: "#130c08" }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_48%,transparent_22%,rgba(8,5,3,.32)_100%)]" />
      <div className="relative flex min-h-[calc(100svh-72px)] w-full max-w-none flex-col">
        <header className="relative z-30 flex min-h-10 items-center justify-between gap-3 px-5 pt-3">
          <Link href="/aprender/juegos" aria-label="Salir del juego" title="Salir del juego" className="archivo-exit-arrow shrink-0">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Salir del juego</span>
          </Link>

        </header>
        {error && <p role="alert" className="mx-auto mt-3 max-w-xl border border-rose-300/40 bg-[#310f0e]/90 px-4 py-3 text-center text-xs text-rose-100 shadow-xl">{error}</p>}
        {(phase === "cover" || phase === "playing" || phase === "suspects" || phase === "finished") && (
          <section className="archivo-entry-layout archivo-world-stage absolute inset-0 z-0 overflow-hidden">
            <ArchivoOcultoLibrary3D
              key={libraryMount}
              stories={stories}
              suspectCards={activeSuspects}
              suspectFolderTitle={activeStoryTitle}
              suspectFolderCode={activeCaseCode}
              onSelectSuspect={(suspect) => setSelectedSuspect(suspect)}
              showSuspects={phase === "playing" || phase === "suspects"}
              inspectionMode={phase === "suspects"}
              readingMode={phase === "playing"}
              onInspectionSettled={handleInspectionSettled}
              pauseRender={phase === "suspects" && inspectionSettled}
              returnBookToShelfToken={returnBookToShelfToken}
              onSelect={(selectedStory) => {
                const story = stories.find((item) => item.id === selectedStory.id);
                if (story) void startBook(story);
              }}
              disabled={starting || phase === "finished" || stories.length === 0}
            />
          </section>
        )}
        {(phase === "playing" || phase === "suspects") && controlsOpen && (
          <section className="fixed right-5 top-24 z-[90] w-[min(360px,calc(100vw-40px))] border border-[#b18a56]/80 bg-[#17130e]/[.98] p-4 text-[#f0dfc1] shadow-[0_20px_60px_rgba(0,0,0,.78)]">
            <div className="mb-3 flex items-center justify-between border-b border-[#a98453]/50 pb-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#c59d67]">Manual operativo · Expediente 002</p>
                <h3 className="mt-1 font-serif text-lg font-bold">Controles de investigación</h3>
              </div>
              <button type="button" onClick={() => setControlsOpen(false)} aria-label="Cerrar controles" className="border border-[#a98453]/55 px-2 py-1 text-xs hover:bg-white/10">×</button>
            </div>
            <div className="space-y-2 text-[11px]">
              {(phase === "playing" ? [
                ["F", "Abrir la mesa de fotografías; la lectura queda abierta."],
                ["SHIFT", "Cerrar el libro y devolverlo a su estante."],
                ["H", "Mostrar u ocultar este manual."],
                ["R / C / E", "Se usan en la habitación, no durante la lectura."],
                ["CLIC", "Elegir una respuesta o avanzar por los controles del libro."]
              ] : [
                ["CLIC EN FOTO", "Abrir el dossier individual de esa persona."],
                ["F", "Volver a la misma página del libro; el cursor permanece visible."],
                ["SHIFT", "Cerrar la lectura y devolver el libro al estante."],
                ["H", "Mostrar u ocultar este manual."]
              ]).map(([key, description]) => (
                <div key={key} className="grid grid-cols-[104px_1fr] items-center gap-2 border-b border-[#947348]/20 pb-1.5 last:border-0">
                  <kbd className="inline-flex w-fit border border-[#a98453]/60 bg-[#3a2a19] px-2 py-1 font-mono text-[9px] font-bold text-[#f4dfb7]">{key}</kbd>
                  <span className="leading-relaxed text-[#d4c2a1]">{description}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {phase === "suspects" && (
          <section className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
            <div className="rounded border border-[#c9a875]/35 bg-[#160d08]/70 px-4 py-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#e4c995] shadow-lg backdrop-blur-sm">
              EXPEDIENTE · INSPECCIÓN DE PERSONAS
            </div>
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded border border-[#c9a875]/45 bg-[#160d08]/85 px-3 py-2 font-mono text-[9px] tracking-wide text-[#f1dfbd] shadow-lg">
              F · VOLVER AL LIBRO &nbsp; / &nbsp; SHIFT · DEVOLVER AL ESTANTE
            </div>
            <button type="button" onClick={() => setControlsOpen((open) => !open)} aria-expanded={controlsOpen} className="pointer-events-auto absolute right-5 top-0 rounded border border-[#c9a875]/45 bg-[#160d08]/85 px-3 py-2 font-mono text-[9px] text-[#f1dfbd] shadow-lg hover:border-[#e8cc98]">
              H · CONTROLES
            </button>
          </section>
        )}
        {phase === "suspects" && selectedSuspect && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#090806]/90 px-2 py-2 sm:px-4"
            onClick={() => setSelectedSuspect(null)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={selectedSuspect.id}
                initial={{ opacity: 0, x: suspectTransitionDirection * 34, scale: .995 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: suspectTransitionDirection * -28, scale: .995 }}
                transition={{ duration: .24, ease: [0.22, 1, 0.36, 1] }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="archivo-suspect-name"
                onClick={(event) => event.stopPropagation()}
                className="archivo-individual-file relative grid h-[min(900px,94svh)] max-h-[94svh] w-full max-w-[1100px] grid-rows-[42px_auto_minmax(0,1fr)] overflow-hidden border-[5px] border-[#6b5738] bg-[#e9d9b8] font-sans text-[#30271d] shadow-[0_30px_90px_rgba(0,0,0,.84)] md:grid-rows-[42px_minmax(0,1fr)] md:grid-cols-[225px_minmax(0,1fr)]"
                style={{
                  backgroundColor: "#e9d9b8",
                  backgroundImage: "url('/archivo-oculto/textures/case-paper.svg')",
                  backgroundSize: "cover",
                }}
              >
                <header className="col-span-full flex min-w-0 items-center justify-between gap-2 border-b border-[#aa9066] bg-[#e9d9b8]/95 px-3 sm:px-5">
                  <p className="truncate font-mono text-[8px] font-bold uppercase tracking-[.14em] text-[#6e5738] sm:text-[9px]">
                    ARCHIVO DE PERSONAS VINCULADAS
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="border-y border-[#b49a70] px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-[.12em] text-[#644d31] sm:text-[9px]">
                      FICHA {String(selectedSuspectIndex + 1).padStart(2, "0")} / {String(activeSuspects.length).padStart(2, "0")}
                    </span>
                    <motion.button
                      type="button"
                      aria-label="Cerrar expediente"
                      onClick={() => setSelectedSuspect(null)}
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: .9 }}
                      transition={{ duration: .18, ease: "easeOut" }}
                      className="ml-1 grid h-7 w-7 place-items-center bg-transparent text-[#6f593d] hover:text-[#a13e32] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#a13e32]"
                    >
                      <X className="h-[18px] w-[18px]" strokeWidth={1.7}/>
                    </motion.button>
                  </div>
                </header>

                <aside className="archivo-dossier-scroll relative flex max-h-[36svh] min-h-0 flex-col overflow-y-auto border-b border-[#b39a70] bg-[#e4d3b0]/88 px-3 py-3 md:max-h-none md:overflow-hidden md:border-b-0 md:border-r md:px-4 md:py-4">
                  <div className="mb-2 flex items-center justify-between border-b border-[#b39a70] pb-1.5">
                    <span className="font-mono text-[8px] font-bold uppercase tracking-[.14em] text-[#705a3c]">Archivo fotográfico</span>
                    
                  </div>

                  <figure className="relative mx-auto aspect-square w-[min(170px,58vw)] shrink-0 rotate-[-.35deg] border-[8px] border-[#f5ecd8] bg-[#f5ecd8] shadow-[0_5px_14px_rgba(53,37,19,.26),0_1px_2px_rgba(53,37,19,.38)]">
                    <span className="pointer-events-none absolute -inset-[4px] border border-[#aa9168]/75"/>
                    {selectedSuspect.imageUrl ? (
                      <Image
                        src={selectedSuspect.imageUrl}
                        alt={"Retrato ficticio de " + selectedSuspect.name}
                        fill
                        unoptimized
                        priority
                        sizes="170px"
                        className="object-cover object-[50%_27%]"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[#d1bf9d] font-serif text-7xl text-[#59452f]">
                        {selectedSuspect.name.slice(0, 1)}
                      </div>
                    )}
                    <Image
                      src="/archivo-oculto/stamps/paperclip.svg"
                      alt=""
                      aria-hidden="true"
                      width={110}
                      height={190}
                      unoptimized
                      draggable={false}
                      className="pointer-events-none absolute -top-[25px] left-1/2 z-30 w-[34px] -translate-x-1/2 rotate-[-5deg] drop-shadow-[0_2px_2px_rgba(0,0,0,.55)]"
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-[#211d17]/78 px-1 py-1 text-center font-mono text-[8px] font-bold uppercase tracking-[.12em] text-[#f2e5c8]">
                      PS-{activeCaseCode}-{String(selectedSuspectIndex + 1).padStart(2, "0")}
                    </figcaption>
                  </figure>

                  <div className="mt-3 border-b border-[#b49a70] pb-2 text-center">
                    <h3 id="archivo-suspect-name" className="font-serif text-[1.7rem] font-bold leading-[1.04] tracking-[-.025em] text-[#30271b]">
                      {selectedSuspect.name}
                    </h3>
                    <p className="mt-1.5 font-sans text-[10px] font-semibold uppercase leading-relaxed tracking-[.09em] text-[#715a3a]">
                      {selectedSuspect.role}
                    </p>
                  </div>

                  <section className="mt-3">
                    <h4 className="mb-1.5 font-serif text-[15px] font-bold text-[#443523]">Descripción</h4>
                    <p className="font-sans text-[11px] leading-[1.62] text-[#3d3224]">
                      {suspectNarrative?.relation ?? selectedSuspect.description}
                    </p>
                  </section>


                  <div className="pointer-events-none mt-auto flex items-end justify-between gap-2 border-t border-dashed border-[#b69b6c] pt-2.5">
                    <span className="font-mono text-[7px] font-bold uppercase tracking-[.12em] text-[#8a714d]">Registro de persona · uso de consulta</span>
                    <Image src="/archivo-oculto/stamps/huella.svg" alt="" aria-hidden="true" width={180} height={220} unoptimized className="w-[28px] opacity-45"/>
                  </div>

                </aside>

                <main className="archivo-dossier-scroll relative min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4" tabIndex={0} aria-label="Contenido del expediente">
                  <div className="relative">
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#6e6047] pb-2.5">
                      <div>
                        <p className="font-mono text-[8px] font-bold uppercase tracking-[.14em] text-[#806b4b]">REGISTROS DEL EXPEDIENTE</p>
                        <h4 className="mt-1 font-serif text-[1.5rem] font-bold leading-tight text-[#30271d] sm:text-[1.7rem]">Cronología y evidencias</h4>
                      </div>
                      <div className="mb-1 flex items-center gap-2">
                        <Image src="/archivo-oculto/stamps/revision-evidencia.svg" alt="Revisión de evidencia" width={240} height={240} unoptimized className="w-[54px] opacity-80"/>
                        <Image src="/archivo-oculto/stamps/confidencial.svg" alt="Confidencial" width={700} height={160} unoptimized className="w-[154px]"/>
                      </div>
                    </div>

                    <section className="archivo-dossier-section mb-3">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 border-b border-[#a58e67] pb-1.5">
                        <h5 className="font-sans text-[10px] font-bold uppercase tracking-[.11em] text-[#555b43]">Cronología de hechos</h5>
                        <span className="font-mono text-[8px] uppercase text-[#896f48]">{suspectTimeline.length} registros</span>
                      </div>
                      <div className="border-y border-[#b19a70] bg-[#f0e5ce]/72">
                        {suspectTimeline.length ? suspectTimeline.map((entry,index)=>(
                          <div key={entry.time+entry.event} className={"grid grid-cols-[72px_minmax(0,1fr)] gap-2.5 px-2.5 py-2.5 "+(index<suspectTimeline.length-1?"border-b border-dashed border-[#c7b48e]":"")}>
                            <span className="border-r border-[#a34b3d]/75 pr-2 font-mono text-[9px] font-bold leading-[1.5] text-[#894536]">{entry.time}</span>
                            <div className="min-w-0">
                              <p className="font-sans text-[11px] leading-[1.5] text-[#3b3226]">{entry.event}</p>
                              <p className="mt-1 font-sans text-[9px] leading-[1.4] text-[#806b4a]">{entry.source} · <span className="font-bold uppercase text-[#94483b]">{entry.record}</span></p>
                            </div>
                          </div>
                        )):(
                          <p className="px-3 py-3 font-sans text-[10px] italic text-[#786343]">No hay secuencia temporal individual documentada.</p>
                        )}
                      </div>
                    </section>

                    <section className="mb-3">
                      <div className="mb-1.5 border-b border-[#a58e67] pb-1.5">
                        <h5 className="font-sans text-[10px] font-bold uppercase tracking-[.11em] text-[#555b43]">Declaración aportada</h5>
                      </div>
                      <div className="border-l-[3px] border-[#9b4a3b] bg-[#efe2c8]/82 px-3 py-2.5">
                        <p className="font-serif text-[12px] italic leading-[1.62] text-[#3b3021]">
                          “{suspectNarrative?.statement ?? selectedSuspect.alibi}”
                        </p>
                        <div className="mt-2 border-t border-[#c0ac84] pt-2">
                          <h5 className="font-sans text-[9px] font-bold uppercase tracking-[.1em] text-[#8d4437]">Análisis de contraste</h5>
                          <p className="mt-1 font-sans text-[11px] leading-[1.55] text-[#493c2a]">
                            {suspectNarrative?.analysis ?? selectedSuspect.motive}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="mb-3">
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#a58e67] pb-1.5">
                        <h5 className="font-sans text-[10px] font-bold uppercase tracking-[.11em] text-[#555b43]">Indicios y documentos relacionados</h5>
                        <span className="font-mono text-[8px] uppercase text-[#896f48]">{suspectEvidenceEntries.length} referencias</span>
                      </div>
                      <div className="overflow-x-auto border border-[#b39b6e] bg-[#f0e5ce]/78">
                        <table className="w-full min-w-[520px] border-collapse text-left">
                          <thead>
                            <tr className="bg-[#d7c5a2]/85 font-sans text-[9px] font-bold uppercase tracking-[.08em] text-[#594b35]">
                              <th className="w-[52px] border-b border-r border-[#b6a078] px-2 py-2">Ref.</th>
                              <th className="w-[155px] border-b border-r border-[#b6a078] px-2 py-2">Elemento</th>
                              <th className="w-[135px] border-b border-r border-[#b6a078] px-2 py-2">Procedencia</th>
                              <th className="border-b border-[#b6a078] px-2 py-2">Alcance / límite</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suspectEvidenceEntries.length?suspectEvidenceEntries.map(entry=>(
                              <tr key={entry.code} className="align-top odd:bg-[#f3e8d2]/75 even:bg-[#e5d7bb]/65">
                                <td className="border-b border-r border-[#c5b38d] px-2 py-2 font-mono text-[9px] font-bold text-[#94483b]">{entry.code}</td>
                                <td className="border-b border-r border-[#c5b38d] px-2 py-2 font-serif text-[11px] font-bold text-[#392e20]">{entry.title}<p className="mt-1 font-sans text-[10px] font-normal leading-[1.5] text-[#66563e]">{entry.detail}</p></td>
                                <td className="border-b border-r border-[#c5b38d] px-2 py-2 font-sans text-[10px] leading-[1.5] text-[#766345]">{entry.source}</td>
                                <td className="border-b border-[#c5b38d] px-2 py-2 font-sans text-[10px] leading-[1.55] text-[#604d34]">{entry.scope}</td>
                              </tr>
                            )):(
                              <tr><td colSpan={4} className="px-3 py-3 font-sans text-[10px] italic text-[#786343]">No hay documentos relacionados registrados.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    <section className="archivo-dossier-section border-t border-[#a58e67] pt-2.5">
                      <h5 className="mb-1.5 font-sans text-[10px] font-bold uppercase tracking-[.11em] text-[#555b43]">Verificaciones pendientes</h5>
                      <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {(suspectNarrative?.pending ?? ["Contrastar la versión con fuentes primarias.", "Documentar discrepancias antes de formular una conclusión."]).map((action)=>(
                          <li key={action} className="flex gap-2 font-sans text-[10px] leading-[1.5] text-[#443927]">
                            <span aria-hidden="true" className="shrink-0 text-[#94483c]">□</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </main>
              </motion.article>
            </AnimatePresence>
            <motion.button
              type="button"
              aria-label="Expediente anterior"
              disabled={selectedSuspectIndex <= 0}
              onClick={() => {
                setSuspectTransitionDirection(-1);
                setSelectedSuspect(activeSuspects[selectedSuspectIndex - 1]);
              }}
              whileHover={{ x: -3, scale: 1.04 }}
              whileTap={{ scale: .94 }}
              className="absolute top-1/2 z-[60] grid h-[76px] w-[52px] -translate-y-1/2 place-items-center border-y border-[#b99762]/60 bg-[#110d08]/70 text-[#ddc79f] shadow-[0_8px_24px_rgba(0,0,0,.35)] transition-colors hover:bg-[#2a2116]/90 hover:text-[#fff0d0] disabled:pointer-events-none disabled:opacity-15 sm:h-[88px] sm:w-[58px]" style={{ left: "max(12px, calc((100% - 1100px) / 2 - 215px))" }}
            >
              <ArrowLeft className="h-9 w-9" strokeWidth={1.4}/>
            </motion.button>
            <motion.button
              type="button"
              aria-label="Expediente siguiente"
              disabled={selectedSuspectIndex >= activeSuspects.length - 1}
              onClick={() => {
                setSuspectTransitionDirection(1);
                setSelectedSuspect(activeSuspects[selectedSuspectIndex + 1]);
              }}
              whileHover={{ x: 3, scale: 1.04 }}
              whileTap={{ scale: .94 }}
              className="absolute right-3 top-1/2 z-[60] grid h-[76px] w-[52px] -translate-y-1/2 place-items-center border-y border-[#b99762]/60 bg-[#110d08]/70 text-[#ddc79f] shadow-[0_8px_24px_rgba(0,0,0,.35)] transition-colors hover:bg-[#2a2116]/90 hover:text-[#fff0d0] disabled:pointer-events-none disabled:opacity-15 sm:h-[88px] sm:w-[58px]" style={{ right: "max(12px, calc((100% - 1100px) / 2 - 215px))" }}
            >
              <ArrowRight className="h-9 w-9" strokeWidth={1.4}/>
            </motion.button>
          </div>
        )}
        {phase === "playing" && (
          <section className="archivo-reader-layout archivo-reader-overlay absolute inset-0 z-10 flex flex-col justify-center">
            <div className="archivo-reader-topbar mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#e6d2ac]">Expediente en mesa · {answeredCount}/{questions.length} respuestas</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="rounded border border-[#d9bd8d]/45 bg-[#170e09]/85 px-3 py-1.5 font-mono text-[9px] text-[#f1dfbd]"><kbd className="mr-1 border border-[#c9ad7e]/60 px-1.5 py-0.5">F</kbd> VER SOSPECHOSOS</span>
                <span className="rounded border border-[#d9bd8d]/45 bg-[#170e09]/85 px-3 py-1.5 font-mono text-[9px] text-[#f1dfbd]"><kbd className="mr-1 border border-[#c9ad7e]/60 px-1.5 py-0.5">SHIFT</kbd> DEVOLVER LIBRO</span>
                <button type="button" onClick={() => setControlsOpen((open) => !open)} aria-expanded={controlsOpen} className="rounded border border-[#d9bd8d]/45 bg-[#170e09]/85 px-3 py-1.5 font-mono text-[9px] text-[#f1dfbd] hover:border-[#e8cc98]"><kbd className="mr-1 border border-[#c9ad7e]/60 px-1.5 py-0.5">H</kbd> CONTROLES</button>
              </div>
            </div>
            <div className="archivo-reader-stage relative mx-auto w-full max-w-[1360px] flex-1 min-h-0">
              <FlipBook ref={bookRef} className="archivo-book mx-auto" width={530} height={700} size="stretch" minWidth={300} maxWidth={650} cover layout="auto" binding="left" flipDuration={760} easing={(progress) => progress * progress * (3 - 2 * progress)} shadows={false} shadowOpacity={0.16} hover={false} page={bookPage} onFlip={handleFlip} onFlipProgress={handleFlipProgress}>
                <Page density="hard" className="archivo-cover archivo-cover-front">
                  <div className="archivo-flip-cover archivo-flip-cover-front" aria-label="Portada roja lisa" />
                </Page>
                {questions.flatMap((question,index)=>{
                  const readingPage=readingPagesByQuestionId.get(question.id);
                  const reading=readingPage?.reading;
                  const readingPartBlocks=readingPage?.blocks ?? [];
                  const pageHasEvidence=readingPartBlocks.some(block=>block.type==="image");
                  const answer=feedbackById[question.id];
                  return [
                    <Page key={question.id+"-text"} className="archivo-page archivo-page-left">
                      <BookPaper className="archivo-page-inner p-6 sm:p-7">
                        <div className="archivo-page-running-head flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>El Archivo Oculto · Lectura {reading?String(readings.indexOf(reading)+1).padStart(2,"0"):"01"}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">PÁG. {index*2+1}</span></div>
                        <h2 className="archivo-reading-title mt-4 font-serif text-[25px] font-bold leading-tight text-[#382816]">{reading?.title}</h2>
                        <div className="archivo-reading-byline mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#92764c]"><span>{reading?.typeLabel}</span><span>·</span><span>{reading?.authorLabel}</span></div>
                        <div className="archivo-reading-flow mt-4 flex min-h-0 flex-1 flex-col border-t border-[#ddcaa8] pt-3"><ReadingContent blocks={readingPartBlocks}/></div>
                        <div className="mt-2 flex items-center justify-center gap-3 font-mono text-[8px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+1}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>,
                    <Page key={question.id+"-question"} className="archivo-page archivo-page-right">
                      <BookPaper className="archivo-page-inner p-6 sm:p-7">
                        <div className="flex items-center justify-between border-b border-[#bda47b] pb-3"><SmallLabel>Pregunta {String(index+1).padStart(2,"0")}</SmallLabel><span className="font-mono text-[9px] text-[#9a8057]">LECTURA CRÍTICA</span></div>
                        <div className="archivo-question-content mt-3 min-h-0 flex-1 overflow-y-auto" aria-label="Contenido de la pregunta" tabIndex={0}>
                        {pageHasEvidence && (
                          <div className="mt-2 flex items-start gap-3 border border-[#bd9f70] bg-[#f0dfbf] px-3 py-2 shadow-sm">
                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-[#9b3025] bg-[#8f211c] font-serif text-sm font-black text-[#fff0d3]">!</span>
                            <div>
                              <p className="font-mono text-[8px] font-black uppercase tracking-[.16em] text-[#9b3025]">Cruce de fuentes</p>
                              <p className="mt-1 font-serif text-[11px] leading-[1.5] text-[#513a23]">Vuelve a las evidencias del expediente. Contrasta sus datos con el texto antes de elegir tu respuesta.</p>
                            </div>
                          </div>
                        )}
                                                <div className="archivo-question-card mt-3 border-l-[3px] border-[#a9824d] bg-[#ead9b7] p-5"><p className="archivo-question-competency text-[10px] font-bold uppercase tracking-[.14em] text-[#8b6b3f]">{question.competencyShort}</p><h2 className="archivo-question-prompt mt-2 font-serif text-[21px] font-bold leading-snug text-[#382816]">{question.prompt}</h2></div>
                        <div className="archivo-option-list mt-4">
                          {question.options.map((option,optionIndex)=>{
                            const isSelected=(answer?.selectedOption??(questionIndex===index?selectedOption:null))===optionIndex;
                            const isCorrect=answer&&answer.correctOption===optionIndex;
                            const isWrong=answer&&isSelected&&!answer.isCorrect;
                            return <button key={optionIndex} type="button" data-opf-no-flip data-state={isCorrect?"correct":isWrong?"wrong":isSelected?"selected":"idle"} disabled={Boolean(answer)||phase!=="playing"||questionIndex!==index} onClick={()=>setSelectedOption(optionIndex)} className={"archivo-option flex min-h-[64px] w-full items-start gap-3 border px-4 py-4 text-left text-[12px] leading-[1.5] transition "+(isCorrect?"border-emerald-700 bg-[#e2ead8]":isWrong?"border-rose-700 bg-[#f1dfd5]":isSelected?"border-[#a77b3f] bg-[#ead6ad]":"border-[#d0b98d] bg-[#f8eedb] hover:border-[#947044]")+" disabled:cursor-default"}>
                              <span className={"archivo-option-key grid h-8 w-8 shrink-0 place-items-center border font-serif text-[13px] font-bold "+(isCorrect?"border-emerald-700 bg-emerald-800 text-white":isWrong?"border-rose-700 bg-rose-800 text-white":"border-[#b39a6d] bg-[#f0dfbc] text-[#604522]")}>{String.fromCharCode(65+optionIndex)}</span>
                              <span className="archivo-option-copy flex-1 pt-0.5 text-[#42311d]">{option}</span>{isCorrect&&<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-800"/>}{isWrong&&<XCircle className="h-5 w-5 shrink-0 text-rose-800"/>}
                            </button>;
                          })}
                        </div>
                        {answer?<div aria-live="polite" className={"archivo-feedback mt-4 border p-4 shadow-sm "+(answer.isCorrect?"border-[#9aaa72] bg-[#edf0dd]":"border-[#c18a71] bg-[#f2e3d5]")}><div className="flex items-center gap-2"><Lightbulb className={"h-5 w-5 shrink-0 "+(answer.isCorrect?"text-[#61733e]":"text-[#9a6041]")}/><p className={"font-serif text-[14px] font-bold "+(answer.isCorrect?"text-[#354b27]":"text-[#75442e]")}>{answer.isCorrect?"Comprende la respuesta":"Aprende de esta respuesta"}</p></div><p className="archivo-answer-explanation mt-2 text-[12px] leading-[1.65] text-[#51402b]">{answer.explanation}</p></div>:<div className="archivo-question-hint mt-4 flex items-center gap-2 border border-dashed border-[#cdb58c] bg-[#f3e7cf]/70 px-4 py-3 text-[11px] text-[#8b704c]"><span className="archivo-hint-rule" aria-hidden="true" />Lee el texto y elige la opción que mejor sustenta tu respuesta.</div>}
                        </div>
                        <div className="archivo-question-actions mt-2 border-t border-[#bda47b] pt-3">
                          {!answer&&questionIndex===index&&<button type="button" data-opf-no-flip onClick={()=>void submitAnswer()} disabled={selectedOption===null||savingAnswer} className="archivo-submit-answer inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-5 py-3 text-[11px] font-black uppercase tracking-[.14em] text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] transition hover:-translate-y-0.5 hover:bg-[#8c6839] disabled:cursor-not-allowed disabled:opacity-45">{savingAnswer?"Comprobando…":"Comprobar respuesta"}<ArrowRight className="h-4 w-4"/></button>}
                          {answer&&questionIndex===index&&index===questions.length-1&&<button type="button" data-opf-no-flip onClick={()=>void finishBook()} disabled={finishing} className="archivo-submit-answer inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#735329] bg-[#77552c] px-5 py-3 text-[11px] font-black uppercase tracking-[.14em] text-[#fff1d2] shadow-[2px_2px_0_#d1b37b] transition hover:-translate-y-0.5 hover:bg-[#8c6839] disabled:opacity-50">{finishing?"Cerrando expediente…":"Cerrar expediente"}<ArrowRight className="h-4 w-4"/></button>}
                        </div>
                        <div className="archivo-page-folio mt-3 flex items-center justify-center gap-3 font-mono text-[9px] text-[#aa9068]"><span className="h-px w-12 bg-[#b99a6b]"/>{index*2+2}<span className="h-px w-12 bg-[#b99a6b]"/></div>
                      </BookPaper>
                    </Page>
                  ];
                })}
                <Page density="hard" className="archivo-cover archivo-cover-back">
                  <div className="archivo-flip-cover archivo-flip-cover-back" aria-label="Contraportada roja lisa" />
                </Page>
              </FlipBook>
            </div>
            <div className="pointer-events-none mx-auto pb-3 text-center font-mono text-[9px] uppercase tracking-[.14em] text-[#ddc49a]/85">F · Ver sospechosos &nbsp; · &nbsp; Shift · Devolver el libro al estante</div>
          </section>
        )}
      </div>
    </main>
  );
}