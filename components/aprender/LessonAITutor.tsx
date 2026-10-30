"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AudioLines, Camera, Check, ChevronDown, FileText, LoaderCircle, Maximize2, MessageSquare, Mic, Paperclip, Plus, ScanText, Send, Square, Trash2, Volume2, X } from "lucide-react";
import { createWorker } from "tesseract.js";

type Message = { id?: string; role: "user" | "assistant"; content: string; checkQuestion?: string; attachmentName?: string; attachmentPreview?: string; attachmentKind?: "image" | "audio"; createdAt?: string };
type Conversation = { id: string; title: string; subject: string; topic: string; created_at: string; updated_at: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string; isFinal: boolean }>> }) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type ReviewQuestion = {
  id: string;
  number: number;
  subject: string;
  topic: string;
  prompt: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
};

type Props = {
  reviewQuestions?: ReviewQuestion[];
  subject: string;
  topic: string;
  stage?: "theory" | "practice";
  question?: string;
  context?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPrompt?: string;
  accent?: "default" | "orby";
  workspace?: boolean;
};


function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index} className="font-bold text-slate-950">{part.slice(2, -2)}</strong>
      : <span key={index}>{part}</span>
  );
}

function renderTutorContent(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  return (
    <div className="space-y-2.5">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" aria-hidden="true" />;
        // Hide a bullet glyph emitted alone by the model instead of rendering it as content.
        if (/^(?:\*\*)?[•·](?:\*\*)?$/.test(line)) return null;
        const heading = line.match(/^\*\*(.+?)\*\*:?$/);
        if (heading) {
          return <h4 key={index} className="pt-1 text-sm font-extrabold tracking-tight text-slate-950">{heading[1].replace(/:$/, "")}</h4>;
        }
        const bullet = line.match(/^(?:[-•])\s+(.+)$/);
        if (bullet) {
          return <div key={index} className="flex gap-2 pl-1"><span className="mt-[2px] font-bold text-sky-600">•</span><p className="min-w-0 flex-1">{renderInline(bullet[1])}</p></div>;
        }
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          return <div key={index} className="flex gap-2 pl-1"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-50 text-[11px] font-extrabold text-sky-700">{numbered[1]}</span><p className="min-w-0 flex-1">{renderInline(numbered[2])}</p></div>;
        }
        return <p key={index}>{renderInline(line.replace(/^\*\*(.+?)\*\*$/, "$1"))}</p>;
      })}
    </div>
  );
}

const starters = [
  "Explícame la diferencia entre masa y densidad",
  "¿Cómo analizo una tabla de datos?",
  "Dame un ejemplo similar para practicar",
  "No entiendo por qué una opción es incorrecta",
];

export default function LessonAITutor({ subject, topic, stage = "theory", question = "", context = "", open, onOpenChange, initialPrompt, accent = "default", reviewQuestions = [], workspace = false }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const orbyAccent = accent === "orby";
  const [notebookOpen, setNotebookOpen] = useState(false);
  const activeReviewRef = useRef<ReviewQuestion | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(workspace);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordedAudioPreviewUrl, setRecordedAudioPreviewUrl] = useState("");
  const [audioSource, setAudioSource] = useState<"recording" | "upload">("recording");
  const [audioTranscribing, setAudioTranscribing] = useState(false);
  const [pendingAttachmentMeta, setPendingAttachmentMeta] = useState<{ kind: "image" | "audio"; label: string } | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"chat" | "voice">("chat");
  const voiceModeRef = useRef(false);
  const waitingForVoiceReplyRef = useRef(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropX, setCropX] = useState(5);
  const [cropY, setCropY] = useState(5);
  const [cropW, setCropW] = useState(90);
  const [cropH, setCropH] = useState(90);
  const [imageContrast, setImageContrast] = useState(115);
  const [imageBrightness, setImageBrightness] = useState(105);
  const [paperCorners, setPaperCorners] = useState([
    { x: 5, y: 5 }, { x: 95, y: 5 }, { x: 95, y: 95 }, { x: 5, y: 95 },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageRef = useRef<(text: string, includeAttachment?: boolean, voiceInteraction?: boolean, attachmentMeta?: { kind: "image" | "audio"; label: string }) => Promise<void>>(async () => {});
  const lastInitialPromptRef = useRef<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const stopAudioRecordingRef = useRef<(discard?: boolean) => void>(() => {});
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let permissionStatus: PermissionStatus | null = null;

    const readPermission = async () => {
      if (!navigator.permissions?.query) {
        if (active) setMicrophonePermission("unknown");
        return;
      }
      try {
        permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (!active) return;
        setMicrophonePermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          if (active && permissionStatus) setMicrophonePermission(permissionStatus.state);
        };
      } catch {
        if (active) setMicrophonePermission("unknown");
      }
    };

    void readPermission();
    return () => {
      active = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !workspace) return;
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/orby/conversations", { credentials: "same-origin", cache: "no-store" });
        if (!cancelled) setConversationError("");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar el historial.");
        const items = Array.isArray(payload.conversations) ? payload.conversations as Conversation[] : [];
        if (cancelled) return;
        setConversations(items);
        const first = items[0];
        if (first) {
          activeConversationRef.current = first.id;
          setConversationId(first.id);
          const messagesResponse = await fetch(`/api/orby/conversations/${first.id}/messages`, { credentials: "same-origin", cache: "no-store" });
          const messagesPayload = await messagesResponse.json().catch(() => ({}));
          if (!messagesResponse.ok) throw new Error(messagesPayload.error || "No se pudieron cargar los mensajes.");
          if (cancelled) return;
          setMessages(Array.isArray(messagesPayload.messages) ? messagesPayload.messages.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            role: item.role === "assistant" ? "assistant" : "user",
            content: typeof item.content === "string" ? item.content : "",
            checkQuestion: typeof item.check_question === "string" ? item.check_question : "",
            attachmentKind: item.attachment_kind === "audio" || item.attachment_kind === "image" ? item.attachment_kind : undefined,
            attachmentName: typeof item.attachment_label === "string" ? item.attachment_label : undefined,
            createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
          })) : []);
        } else {
          activeConversationRef.current = null;
          setConversationId(null);
          setMessages([]);
        }
      } catch (caught) {
        if (!cancelled) setConversationError(caught instanceof Error ? caught.message : "No se pudo cargar el historial.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    void loadHistory();
    return () => { cancelled = true; };
  }, [open, workspace]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const currentPreview = attachmentPreview;
    return () => {
      if (currentPreview.startsWith("blob:")) URL.revokeObjectURL(currentPreview);
    };
  }, [attachmentPreview]);

  useEffect(() => {
    const currentPreview = recordedAudioPreviewUrl;
    return () => {
      if (currentPreview.startsWith("blob:")) URL.revokeObjectURL(currentPreview);
    };
  }, [recordedAudioPreviewUrl]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }
      mediaRecorderRef.current = null;
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      audioChunksRef.current = [];
      if (recordingTimeoutRef.current) window.clearTimeout(recordingTimeoutRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function handleAttachment(file?: File) {
    setAttachmentError("");
    if (!file) return;
    setPendingAttachmentMeta(null);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError("Solo se permiten imágenes JPG, PNG o WebP. Los PDF no están permitidos.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setAttachmentError("La imagen debe pesar máximo 1 MB.");
      return;
    }
    setAttachment(file);
    setOcrText("");
    setCropMode(false);
    setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    setAttachmentPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
  }

  function clearAttachment() {
    if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
    setAttachment(null);
    setAttachmentPreview("");
    setAttachmentError("");
    setOcrText("");
    setCropMode(false);
    setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function detectPaperBounds() {
    if (!attachmentPreview) return;
    try {
      const image = new window.Image(); image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo analizar la fotografía.")); });
      const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No se pudo analizar la fotografía.");
      ctx.drawImage(image, 0, 0, width, height);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const candidates: Array<{x:number;y:number;sum:number;diff:number}> = [];
      const step = Math.max(1, Math.floor(Math.max(width,height)/700));
      for(let y=0;y<height;y+=step) for(let x=0;x<width;x+=step){
        const i=(y*width+x)*4, red=pixels[i], green=pixels[i+1], blue=pixels[i+2];
        const brightness=(red+green+blue)/3, spread=Math.max(red,green,blue)-Math.min(red,green,blue);
        if(brightness>165 && spread<75) candidates.push({x,y,sum:x+y,diff:x-y});
      }
      if(candidates.length < width*height/(step*step)*0.08) throw new Error("No encuentro suficiente superficie de papel clara. Prueba con más luz y un fondo contrastado.");
      const pick=(key:"sum"|"diff",mode:"min"|"max")=>candidates.reduce((best,p)=>mode==="min"?(p[key]<best[key]?p:best):(p[key]>best[key]?p:best));
      const corners=[pick("sum","min"),pick("diff","min"),pick("sum","max"),pick("diff","max")];
      const normalized=corners.map(p=>({x:Math.max(0,Math.min(100,Math.round(p.x/width*100))),y:Math.max(0,Math.min(100,Math.round(p.y/height*100)))}));
      const [tl,tr,br,bl]=normalized;
      const area=Math.abs(tl.x*tr.y+tr.x*br.y+br.x*bl.y+bl.x*tl.y-tr.x*tl.y-br.x*tr.y-bl.x*br.y-tl.x*bl.y)/2;
      if(area<8 || Math.hypot(tr.x-tl.x,tr.y-tl.y)<15 || Math.hypot(bl.x-tl.x,bl.y-tl.y)<15) throw new Error("La detección no encontró una hoja completa. Ajusta las esquinas manualmente.");
      setPaperCorners(normalized); setCropMode(true);
      setAttachmentError("Detecté cuatro esquinas aproximadas. Revisa el contorno y ajusta los puntos antes de enderezar.");
    } catch(error) { setAttachmentError(error instanceof Error?error.message:"No se pudieron detectar las esquinas."); }
  }
  function updatePaperCorner(index: number, axis: "x" | "y", value: number) {
    setPaperCorners((current) => current.map((point, i) => i === index ? { ...point, [axis]: value } : point));
  }

  async function straightenPaper() {
    if (!attachmentPreview) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo abrir la fotografía.")); });
      const points = paperCorners.map((point) => ({ x: point.x / 100 * image.naturalWidth, y: point.y / 100 * image.naturalHeight }));
      const [tl, tr, br, bl] = points;
      const width = Math.max(300, Math.round((Math.hypot(tr.x - tl.x, tr.y - tl.y) + Math.hypot(br.x - bl.x, br.y - bl.y)) / 2));
      const height = Math.max(300, Math.round((Math.hypot(bl.x - tl.x, bl.y - tl.y) + Math.hypot(br.x - tr.x, br.y - tr.y)) / 2));
      const canvas = document.createElement("canvas"); canvas.width = Math.min(2400, width); canvas.height = Math.min(3200, height);
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo preparar la corrección de perspectiva.");
      const cols = 24, rows = 32;
      const mapPoint = (u: number, v: number) => ({
        x: (1-u)*(1-v)*tl.x + u*(1-v)*tr.x + u*v*br.x + (1-u)*v*bl.x,
        y: (1-u)*(1-v)*tl.y + u*(1-v)*tr.y + u*v*br.y + (1-u)*v*bl.y,
      });
      const drawTriangle = (src: Array<{x:number;y:number}>, dst: Array<{x:number;y:number}>) => {
        const [a,b,c] = src, [A,B,C] = dst;
        const denom = a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);
        if (Math.abs(denom) < 0.0001) return;
        const m11=(A.x*(b.y-c.y)+B.x*(c.y-a.y)+C.x*(a.y-b.y))/denom;
        const m12=(A.y*(b.y-c.y)+B.y*(c.y-a.y)+C.y*(a.y-b.y))/denom;
        const m21=(A.x*(c.x-b.x)+B.x*(a.x-c.x)+C.x*(b.x-a.x))/denom;
        const m22=(A.y*(c.x-b.x)+B.y*(a.x-c.x)+C.y*(b.x-a.x))/denom;
        const dx=A.x-m11*a.x-m21*a.y, dy=A.y-m12*a.x-m22*a.y;
        ctx.save(); ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.lineTo(C.x,C.y); ctx.closePath(); ctx.clip();
        ctx.transform(m11,m12,m21,m22,dx,dy); ctx.drawImage(image,0,0); ctx.restore();
      };
      for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
        const u0=x/cols,u1=(x+1)/cols,v0=y/rows,v1=(y+1)/rows;
        const p00=mapPoint(u0,v0),p10=mapPoint(u1,v0),p11=mapPoint(u1,v1),p01=mapPoint(u0,v1);
        const d00={x:u0*canvas.width,y:v0*canvas.height},d10={x:u1*canvas.width,y:v0*canvas.height},d11={x:u1*canvas.width,y:v1*canvas.height},d01={x:u0*canvas.width,y:v1*canvas.height};
        drawTriangle([p00,p10,p11],[d00,d10,d11]); drawTriangle([p00,p11,p01],[d00,d11,d01]);
      }
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob((value)=>value?resolve(value):reject(new Error("No se pudo generar la hoja enderezada.")),"image/jpeg",0.92));
      const corrected=new File([blob],"orby-hoja-enderezada.jpg",{type:"image/jpeg"});
      if(attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
      setAttachment(corrected); setAttachmentPreview(URL.createObjectURL(corrected)); setOcrText(""); setCropMode(false);
      setPaperCorners([{x:5,y:5},{x:95,y:5},{x:95,y:95},{x:5,y:95}]); setAttachmentError("Hoja enderezada en este dispositivo. Revisa el resultado antes de enviarlo.");
    } catch(error) { setAttachmentError(error instanceof Error?error.message:"No se pudo enderezar la hoja."); }
  }
  async function enhanceImage() {
    if (!attachment || !attachmentPreview) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo abrir la imagen para mejorarla."));
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar la mejora de imagen.");
      ctx.filter = `contrast(${imageContrast}%) brightness(${imageBrightness}%) grayscale(100%)`;
      ctx.drawImage(image, 0, 0);
      ctx.filter = "none";
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar la imagen mejorada.")), "image/jpeg", 0.92));
      const enhanced = new File([blob], "orby-hoja-mejorada.jpg", { type: "image/jpeg" });
      if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
      setAttachment(enhanced);
      setAttachmentPreview(URL.createObjectURL(enhanced));
      setOcrText("");
      setAttachmentError("");
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo mejorar la imagen.");
    }
  }

  async function applyImageCrop() {
    if (!attachment || !attachmentPreview || cropW < 10 || cropH < 10) return;
    try {
      const image = new window.Image();
      image.src = attachmentPreview;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo abrir la imagen para recortarla."));
      });
      const sx = Math.round((cropX / 100) * image.naturalWidth);
      const sy = Math.round((cropY / 100) * image.naturalHeight);
      const sw = Math.max(1, Math.round((cropW / 100) * image.naturalWidth));
      const sh = Math.max(1, Math.round((cropH / 100) * image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar el recorte.");
      ctx.drawImage(image, sx, sy, Math.min(sw, image.naturalWidth - sx), Math.min(sh, image.naturalHeight - sy), 0, 0, sw, sh);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar el recorte.")), "image/jpeg", 0.9));
      const cropped = new File([blob], "orby-pregunta-recortada.jpg", { type: "image/jpeg" });
      if (attachmentPreview.startsWith("blob:")) URL.revokeObjectURL(attachmentPreview);
      setAttachment(cropped);
      setAttachmentPreview(URL.createObjectURL(cropped));
      setOcrText("");
      setCropMode(false);
      setAttachmentError("");
      setCropX(5); setCropY(5); setCropW(90); setCropH(90);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "No se pudo recortar la imagen.");
    }
  }

  async function readImageText() {
    if (!attachment || ocrLoading) return;
    setOcrLoading(true);
    setAttachmentError("");
    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
    try {
      worker = await createWorker("spa");
      const result = await worker.recognize(attachment);
      const extracted = result.data.text.trim();
      if (!extracted) {
        setAttachmentError("No pude detectar texto legible. Intenta tomar la foto con mejor luz y enfoque.");
        return;
      }
      setOcrText(extracted.slice(0, 6000));
    } catch (error) {
      console.error("[Orby OCR] Local recognition failed.", error);
      setAttachmentError("No se pudo leer la imagen en este dispositivo. Puedes enviarla directamente a Orby.");
    } finally {
      if (worker) await worker.terminate();
      setOcrLoading(false);
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") return reject(new Error("No se pudo leer la imagen adjunta."));
        const comma = result.indexOf(",");
        if (comma < 0) return reject(new Error("La imagen adjunta no tiene un formato válido."));
        resolve(result.slice(comma + 1));
      };
      reader.onerror = () => reject(new Error("No se pudo leer la imagen adjunta."));
      reader.readAsDataURL(file);
    });
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  }

  function speakText(text: string, index: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoiceError("Tu navegador no tiene lectura de voz disponible.");
      return;
    }
    stopSpeaking();
    const clean = text.replace(/\*\*/g, "").replace(/`/g, "").replace(/^[-•]\s*/gm, "").replace(/^\d+[.)]\s*/gm, "").slice(0, 5000);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "es-CO";
    utterance.rate = 1.22;
    utterance.pitch = 1.02;
    utterance.volume = 1;
    const spanishVoices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("es"));
    const preferredVoice = spanishVoices.find((voice) => /es[-_]co/i.test(voice.lang) && /natural|online|google/i.test(voice.name))
      ?? spanishVoices.find((voice) => /es[-_]co/i.test(voice.lang))
      ?? spanishVoices.find((voice) => /natural|online|google/i.test(voice.name))
      ?? spanishVoices.find((voice) => /es[-_]mx|es[-_]us/i.test(voice.lang))
      ?? spanishVoices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => {
      setSpeakingIndex(null);
      if (voiceModeRef.current) {
        waitingForVoiceReplyRef.current = false;
        window.setTimeout(() => {
          if (voiceModeRef.current) toggleVoiceInput();
        }, 350);
      }
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
      waitingForVoiceReplyRef.current = false;
      if (voiceModeRef.current) {
        voiceModeRef.current = false;
        setVoiceMode(false);
        setVoiceError("La lectura de voz se interrumpió. Puedes volver a iniciar la conversación.");
      }
    };
    setSpeakingIndex(index); window.speechSynthesis.speak(utterance);
  }

  function toggleVoiceMode() {
    const next = !voiceModeRef.current;
    if (next) {
      const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (!Recognition || !("speechSynthesis" in window)) {
        setVoiceError("El chat de voz beta requiere Chrome o Edge actualizado con permisos de micrófono y voz.");
        return;
      }
      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        setVoiceError("El micrófono requiere una conexión segura (HTTPS).");
        return;
      }
    }
    voiceModeRef.current = next;
    waitingForVoiceReplyRef.current = false;
    setVoiceMode(next);
    setWorkspaceMode(next ? "voice" : "chat");
    setVoiceError("");
    if (next) {
      stopSpeaking();
      // Invoke the browser permission prompt from the user's click, not a timer.
      toggleVoiceInput();
      return;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopSpeaking();
  }

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (recognitionRef.current) return;
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setVoiceError("El micrófono requiere una conexión segura (HTTPS).");
      return;
    }
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("Este navegador no admite dictado por voz. Prueba con Chrome o Edge, o escribe tu pregunta.");
      return;
    }
    setVoiceError("");
    const recognition = new Recognition();
    recognition.lang = "es-CO";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const interim = results.filter((result) => !result[0]?.isFinal).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      const finalTranscript = results.filter((result) => result[0]?.isFinal).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      if (interim) setInput(interim.slice(0, 1200));
      if (finalTranscript) {
        const safeTranscript = finalTranscript.slice(0, 1200);
        setInput(safeTranscript);
        setIsListening(false);
        recognitionRef.current = null;
        if (voiceModeRef.current) waitingForVoiceReplyRef.current = true;
        void sendMessageRef.current(safeTranscript, false, true);
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      const permissionDenied = event?.error === "not-allowed" || event?.error === "service-not-allowed";
      const message = permissionDenied
        ? "No hay permiso para usar el micrófono. Autorízalo en el navegador e inténtalo de nuevo."
        : event?.error === "no-speech"
          ? "No detecté voz. Vuelve a intentarlo acercándote al micrófono."
          : "No pude reconocer tu voz. Revisa el micrófono e inténtalo otra vez.";
      setVoiceError(message);
      if (permissionDenied && voiceModeRef.current) {
        voiceModeRef.current = false;
        waitingForVoiceReplyRef.current = false;
        setVoiceMode(false);
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current === recognition) recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
      setVoiceError("No se pudo activar el micrófono. Inténtalo de nuevo.");
    }
  }
  async function sendMessage(text: string, includeAttachment = false, voiceInteraction = false, attachmentMeta?: { kind: "image" | "audio"; label: string }) {
    const message = text.trim();
    const isVoiceInteraction = voiceInteraction || voiceModeRef.current;
    const selectedFile = includeAttachment ? attachment : null;
    if ((!message && !selectedFile) || loading || sendingRef.current || message.length > 1200) return;
    sendingRef.current = true;

    let targetConversationId = conversationId;
    if (workspace && !targetConversationId) {
      try {
        const createResponse = await fetch("/api/orby/conversations", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, topic }),
        });
        const createPayload = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok || !createPayload.conversation?.id) {
          throw new Error(createPayload.error || "No se pudo crear el chat.");
        }
        targetConversationId = String(createPayload.conversation.id);
        activeConversationRef.current = targetConversationId;
        setConversationId(targetConversationId);
        setConversations((current) => [createPayload.conversation as Conversation, ...current]);
      } catch (caught) {
        setConversationError(caught instanceof Error ? caught.message : "No se pudo crear el chat.");
        sendingRef.current = false;
        return;
      }
    }

    let imagePayload: { mimeType: string; base64: string } | undefined;
    try {
      if (selectedFile) imagePayload = { mimeType: selectedFile.type, base64: await fileToBase64(selectedFile) };
    } catch (caught) {
      setAttachmentError(caught instanceof Error ? caught.message : "No se pudo leer la imagen.");
      sendingRef.current = false;
      return;
    }
    const nextMessages: Message[] = [...messages, {
      role: "user",
      content: message || "Analiza la imagen adjunta.",
      ...(selectedFile && imagePayload ? { attachmentName: selectedFile.name, attachmentPreview: selectedFile.type.startsWith("image/") ? `data:${selectedFile.type};base64,${imagePayload.base64}` : "", attachmentKind: "image" as const } : {}),
      ...(attachmentMeta ? { attachmentName: attachmentMeta.label, attachmentKind: attachmentMeta.kind } : {}),
    }];
    setMessages(nextMessages);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "48px";
    if (selectedFile) clearAttachment();
    setError("");
    setLoading(true);
    try {
      const activeReview = activeReviewRef.current;
      const reviewContext = activeReview ? [
        `Pregunta seleccionada: ${activeReview.prompt}`,
        `Opciones: ${activeReview.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join("\n")}`,
        `Respuesta del estudiante: ${activeReview.userAnswer}`,
        `Respuesta correcta: ${activeReview.correctAnswer}`,
        `Explicación base: ${activeReview.explanation}`,
      ].join("\\n") : context;
      const response = await fetch("/api/lesson-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          subject: activeReview?.subject ?? subject,
          topic: activeReview?.topic ?? topic,
          stage,
          question: activeReview?.prompt ?? question,
          context: [reviewContext, ocrText ? `Texto OCR extraído localmente de la imagen (puede contener errores):\n${ocrText}` : ""].filter(Boolean).join("\n\n").slice(0, 10000),
          message,
          conversationId: targetConversationId,
          attachmentKind: attachmentMeta?.kind ?? (selectedFile ? "image" : null),
          attachmentLabel: attachmentMeta?.label ?? (selectedFile ? "Imagen adjunta" : null),
          voiceMode: isVoiceInteraction,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
          ...(imagePayload ? { image: imagePayload } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Orby no está disponible por ahora.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta llegó incompleta. Inténtalo de nuevo.");
      const assistantIndex = nextMessages.length;
      setMessages((current) => [...current, { role: "assistant", content: data.reply, checkQuestion: typeof data.checkQuestion === "string" ? data.checkQuestion : "" }]);
      if (isVoiceInteraction && voiceModeRef.current && "speechSynthesis" in window) {
        window.setTimeout(() => speakText(data.reply, assistantIndex), 120);
      }
      if (workspace) {
        void refreshConversations().catch((caught: unknown) => {
          setConversationError(caught instanceof Error ? caught.message : "No se pudo actualizar el historial.");
        });
      }
      setPendingAttachmentMeta(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocurrió un error. Inténtalo otra vez.");
      if (isVoiceInteraction) {
        waitingForVoiceReplyRef.current = false;
        voiceModeRef.current = false;
        setVoiceMode(false);
      }
    } finally {
      sendingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
    stopAudioRecordingRef.current = stopAudioRecording;
  });

  useEffect(() => {
    if (!open) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      stopAudioRecordingRef.current(true);
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      voiceModeRef.current = false;
      waitingForVoiceReplyRef.current = false;
      lastInitialPromptRef.current = null;
      activeReviewRef.current = null;
      return;
    }
    const prompt = initialPrompt?.trim();
    if (!prompt || lastInitialPromptRef.current === prompt) return;
    lastInitialPromptRef.current = prompt;
    void sendMessageRef.current(prompt);
  }, [open, initialPrompt]);

  function explainReviewQuestion(item: ReviewQuestion) {
    activeReviewRef.current = item;
    setNotebookOpen(false);
    const prompt = `Explícame paso a paso la pregunta ${item.number}. Quiero entender por qué mi respuesta fue incorrecta o por qué se agotó el tiempo, cómo se llega a la respuesta correcta y qué idea clave debo recordar para resolver una pregunta parecida. Distingue claramente mi respuesta de la correcta, usa la explicación base como referencia y no inventes datos.`;
    void sendMessageRef.current(prompt);
  }

  function handleCloseTutor() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopAudioRecording(true);
    clearRecordedAudio();
    clearAttachment();
    setAttachmentError("");
    setOcrText("");
    setPendingAttachmentMeta(null);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    voiceModeRef.current = false;
    waitingForVoiceReplyRef.current = false;
    setVoiceMode(false);
    setNotebookOpen(false);
    onOpenChange(false);
  }

  async function refreshConversations() {
    if (!workspace) return;
    const response = await fetch("/api/orby/conversations", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el historial.");
    setConversations(Array.isArray(payload.conversations) ? payload.conversations as Conversation[] : []);
  }

  function startNewConversation() {
    stopAudioRecording(true);
    activeConversationRef.current = null;
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setConversationError("");
    setPendingDeleteConversation(null);
    setAttachmentError("");
    clearAttachment();
    clearRecordedAudio();
    setPendingAttachmentMeta(null);
    voiceModeRef.current = false;
    setVoiceMode(false);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    stopSpeaking();
    inputRef.current?.focus();
  }

  async function selectConversation(id: string) {
    if (loading || id === activeConversationRef.current) return;
    setHistoryLoading(true);
    setConversationError("");
    try {
      const response = await fetch(`/api/orby/conversations/${id}/messages`, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo abrir la conversación.");
      activeConversationRef.current = id;
      setConversationId(id);
      setMessages(Array.isArray(payload.messages) ? payload.messages.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        role: item.role === "assistant" ? "assistant" : "user",
        content: typeof item.content === "string" ? item.content : "",
        checkQuestion: typeof item.check_question === "string" ? item.check_question : "",
        attachmentKind: item.attachment_kind === "audio" || item.attachment_kind === "image" ? item.attachment_kind : undefined,
        attachmentName: typeof item.attachment_label === "string" ? item.attachment_label : undefined,
        createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
      })) : []);
      setError("");
      setInput("");
      setPendingDeleteConversation(null);
      if (window.matchMedia("(max-width: 767px)").matches) setHistoryOpen(false);
    } catch (caught) {
      setConversationError(caught instanceof Error ? caught.message : "No se pudo abrir la conversación.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function deleteConversation(id: string) {
    setConversationError("");
    try {
      const response = await fetch(`/api/orby/conversations/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar el chat.");
      setConversations((current) => current.filter((item) => item.id !== id));
      setPendingDeleteConversation(null);
      if (activeConversationRef.current === id) startNewConversation();
    } catch (caught) {
      setConversationError(caught instanceof Error ? caught.message : "No se pudo eliminar el chat.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input, true, false, pendingAttachmentMeta ?? undefined);
  }

  function clearRecordedAudio() {
    setRecordedAudio(null);
    setRecordedAudioPreviewUrl("");
    setAudioSource("recording");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAudioAttachment(file?: File) {
    if (!file || isRecording || audioTranscribing) return;
    const allowedTypes = new Set([
      "audio/webm", "audio/ogg", "audio/wav", "audio/wave", "audio/x-wav",
      "audio/mpeg", "audio/mp3", "audio/aac", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/opus",
    ]);
    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    const extensionMime: Record<string, string> = {
      webm: "audio/webm", ogg: "audio/ogg", opus: "audio/opus",
      wav: "audio/wav", mp3: "audio/mpeg", mpeg: "audio/mpeg",
      aac: "audio/aac", mp4: "audio/mp4", m4a: "audio/m4a",
    };
    const declaredMime = file.type.split(";")[0].trim().toLowerCase();
    const mimeType = allowedTypes.has(declaredMime) ? declaredMime : extensionMime[extension];
    if (!mimeType || !allowedTypes.has(mimeType)) {
      setVoiceError("Formato no compatible. Adjunta audio MP3, WAV, WebM, OGG, AAC o M4A.");
      return;
    }
    if (file.size < 1_024 || file.size > 8 * 1024 * 1024) {
      setVoiceError("El audio debe pesar entre 1 KB y 8 MB.");
      return;
    }
    clearRecordedAudio();
    const normalizedFile = file.type.split(";")[0].trim().toLowerCase() === mimeType
      ? file
      : new File([file], file.name, { type: mimeType, lastModified: file.lastModified });
    setRecordedAudio(normalizedFile);
    setRecordedAudioPreviewUrl(URL.createObjectURL(normalizedFile));
    setAudioSource("upload");
    setVoiceError("");
    void transcribeRecordedAudio(normalizedFile, "upload");
  }

  function handleComposerAttachment(file?: File) {
    if (!file) return;
    if (file.type.toLowerCase().startsWith("audio/")) {
      handleAudioAttachment(file);
      return;
    }
    handleAttachment(file);
  }

  function stopAudioRecording(discard = false) {
    if (discard) discardRecordingRef.current = true;
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  async function requestMicrophonePermission() {
    // getUserMedia in startAudioRecording triggers the browser's native permission prompt.
    await startAudioRecording();
  }

  async function startAudioRecording() {
    if (isRecording) return;
    if (microphonePermission === "denied") {
      setVoiceError("Chrome ya tiene bloqueado el micrófono para este sitio. Abre los controles del sitio a la izquierda de localhost:3000, entra en Micrófono y selecciona «Permitir». Después actualiza la página y vuelve a grabar.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("Este navegador no permite grabar audio aquí. Prueba con Chrome o Edge actualizado.");
      return;
    }
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setVoiceError("La grabación requiere una conexión segura (HTTPS).");
      return;
    }

    const supportedType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!supportedType) {
      setVoiceError("Este navegador no ofrece un formato de grabación compatible. Puedes usar el chat de voz del navegador.");
      return;
    }

    try {
      setVoiceError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      discardRecordingRef.current = false;
      const recorder = new MediaRecorder(stream, { mimeType: supportedType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setVoiceError("La grabación se interrumpió. Inténtalo de nuevo.");
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        if (audioStreamRef.current === stream) audioStreamRef.current = null;
      };
      recorder.onstop = () => {
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          audioChunksRef.current = [];
          stream.getTracks().forEach((track) => track.stop());
          if (audioStreamRef.current === stream) audioStreamRef.current = null;
          if (mediaRecorderRef.current === recorder) mediaRecorderRef.current = null;
          setIsRecording(false);
          return;
        }
        const type = supportedType.startsWith("audio/mp4") ? "audio/mp4" : supportedType.split(";")[0];
        const extension = type === "audio/mp4" ? "m4a" : type === "audio/ogg" ? "ogg" : "webm";
        const blob = new Blob(audioChunksRef.current, { type });
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        if (audioStreamRef.current === stream) audioStreamRef.current = null;
        if (mediaRecorderRef.current === recorder) mediaRecorderRef.current = null;
        setIsRecording(false);
        if (blob.size < 1_024 || blob.size > 8 * 1024 * 1024) {
          setVoiceError("La nota de voz debe pesar entre 1 KB y 8 MB. Graba un audio más corto.");
          return;
        }
        const audioFile = new File([blob], `orby-nota-de-voz.${extension}`, { type });
        setRecordedAudio(audioFile);
        setRecordedAudioPreviewUrl(URL.createObjectURL(audioFile));
        setAudioSource("recording");
        void transcribeRecordedAudio(audioFile, "recording");
      };

      recorder.start(250);
      setIsRecording(true);
        recordingTimeoutRef.current = window.setTimeout(() => {
        setVoiceError("Llegaste al límite de 60 segundos. Revisa la nota de voz antes de enviarla.");
        stopAudioRecording();
      }, 60_000);
    } catch (caught) {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setIsRecording(false);
      const errorName = caught instanceof Error ? caught.name : "UnknownError";
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        setMicrophonePermission("denied");
        setVoiceError("Chrome no concedió el acceso al micrófono. Abre los controles del sitio junto a la dirección web, selecciona Micrófono → Permitir y vuelve a intentarlo.");
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setVoiceError("No se encontró un micrófono conectado. Conecta uno y vuelve a intentarlo.");
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        setVoiceError("El micrófono está ocupado o bloqueado por otra aplicación. Cierra esa aplicación y vuelve a intentarlo.");
      } else {
        setVoiceError("No se pudo acceder al micrófono. Comprueba los permisos del navegador y que el dispositivo esté conectado.");
      }
    }
  }

  async function transcribeRecordedAudio(audioOverride?: File, sourceOverride?: "recording" | "upload") {
    const audioToTranscribe = audioOverride ?? recordedAudio;
    const audioOrigin = sourceOverride ?? audioSource;
    if (!audioToTranscribe || audioTranscribing) return;
    if (attachment) {
      setVoiceError("Envía o quita la imagen adjunta antes de preparar una nota de voz.");
      return;
    }
    setAudioTranscribing(true);
    setVoiceError("");
    try {
      const form = new FormData();
      form.set("audio", audioToTranscribe);
      const response = await fetch("/api/orby/audio/transcribe", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || typeof payload.transcript !== "string" || !payload.transcript.trim()) {
        throw new Error(payload.error || "No se pudo transcribir la nota de voz.");
      }
      setInput(payload.transcript.slice(0, 1200));
      setPendingAttachmentMeta({ kind: "audio", label: audioOrigin === "upload" ? "Audio adjunto transcrito" : "Nota de voz transcrita" });
      if (audioOverride) {
        setRecordedAudio(null);
        setRecordedAudioPreviewUrl("");
        setAudioSource("recording");
      } else {
        clearRecordedAudio();
      }
      setError("");
      inputRef.current?.focus();
    } catch (caught) {
      setVoiceError(caught instanceof Error ? caught.message : "No se pudo transcribir el audio.");
    } finally {
      setAudioTranscribing(false);
    }
  }

  if (!open) return null;

  return (
    <aside id="orby-tutor-panel" aria-label="Tutor de inteligencia artificial Orby" className={workspace
      ? "relative z-[80] flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.5)]"
      : "fixed inset-x-3 bottom-[76px] z-[60] flex max-h-[min(720px,calc(100dvh-100px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.5)] sm:inset-x-auto sm:right-5 sm:top-[88px] sm:bottom-[82px] sm:w-[390px] lg:right-7 lg:w-[410px]"}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${orbyAccent ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,.14)]" : "border-sky-300 shadow-[0_0_0_3px_rgba(14,165,233,.12)]"}`}>
            <Image src="/avatars/photo_perfil/orbyp.png" width={1200} height={800} alt="Avatar de Orby" className="h-full w-full object-contain object-center" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-950">Orby <span className={orbyAccent ? "text-orange-500" : "text-sky-600"}>●</span></p>
            <p className="truncate text-xs text-slate-500">{workspace ? "Tutor inteligente · PeakScore" : "Tutor de ciencias · Saber 11"}</p>
          </div>
        </div>
        {workspace && <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Modo de conversación">
          <button type="button" role="tab" aria-selected={workspaceMode === "chat"} onClick={() => { if (voiceModeRef.current) toggleVoiceMode(); else setWorkspaceMode("chat"); }} className={workspaceMode === "chat" ? "inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-sm" : "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900"}><MessageSquare className="h-3.5 w-3.5" />Chat</button>
          <button type="button" role="tab" aria-selected={workspaceMode === "voice"} onClick={() => { if (!voiceModeRef.current) toggleVoiceMode(); }} title="Iniciar conversación por voz" className={workspaceMode === "voice" ? "inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-sm" : "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900"}><Mic className="h-3.5 w-3.5" />Voz</button>
        </div>}
        <div className="flex items-center gap-1">
          {workspace && <>
            <button type="button" onClick={() => setHistoryOpen((value) => !value)} aria-label={historyOpen ? "Ocultar historial" : "Mostrar historial"} title="Historial de chats" className="rounded-lg p-2 md:hidden text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><ChevronDown className={historyOpen ? "h-4 w-4 rotate-90" : "h-4 w-4"} /></button>
            {pathname !== "/orby" && <button type="button" onClick={() => router.push("/orby")} aria-label="Abrir espacio completo de Orby" title="Abrir espacio completo" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><Maximize2 className="h-4 w-4" /></button>}
            <button type="button" onClick={startNewConversation} aria-label="Crear nueva conversación" title="Nuevo chat" className="rounded-lg p-2 text-orange-700 transition hover:bg-orange-50"><Plus className="h-5 w-5" /></button>
          </>}
          <button type="button" onClick={handleCloseTutor} aria-label="Cerrar tutor Orby" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
      </header>

      <div className={workspace ? "flex min-h-0 flex-1 bg-[#f5f7fb]" : "contents"}>
        {workspace && <aside className={historyOpen ? "absolute bottom-0 left-0 top-[64px] z-30 flex w-[min(82%,290px)] flex-col border-r border-slate-800 bg-[#101827] text-white shadow-xl md:relative md:top-auto md:z-auto md:w-[252px] md:shrink-0 md:shadow-none" : "hidden md:relative md:flex md:w-[252px] md:shrink-0 md:flex-col border-r border-slate-800 bg-[#101827] text-white"} aria-label="Historial de conversaciones">
          <div className="border-b border-white/10 p-4">
            <button type="button" onClick={startNewConversation} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 text-sm font-bold text-white transition hover:bg-orange-700"><Plus className="h-4 w-4" /> Nuevo chat</button>
            <p className="mt-4 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Tus conversaciones</p>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {historyLoading && <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Cargando historial…</div>}
            {!historyLoading && conversations.length === 0 && <p className="px-3 py-5 text-xs leading-5 text-slate-500">Aún no tienes chats guardados. Inicia uno para conservar tus preguntas y explicaciones.</p>}
            {conversations.map((item) => <div key={item.id} className={conversationId === item.id ? "group rounded-xl border border-orange-400/40 bg-orange-500/10 px-2 py-2" : "group rounded-xl border border-transparent px-2 py-2 transition hover:border-white/10 hover:bg-white/5"}>
              <div className="flex items-start gap-1">
                <button type="button" onClick={() => void selectConversation(item.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-xs font-bold text-slate-100">{item.title}</span>
                  <span className="mt-1 block truncate text-[10px] text-slate-400">{item.topic || item.subject}</span>
                  <span className="mt-1 block text-[9px] text-slate-400">{new Date(item.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                </button>
                <button type="button" onClick={() => setPendingDeleteConversation((current) => current === item.id ? null : item.id)} aria-label={"Eliminar chat " + item.title} title="Eliminar conversación" className="rounded-md p-1.5 text-slate-400 opacity-70 transition hover:bg-rose-50 hover:text-rose-600 md:opacity-0 md:group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {pendingDeleteConversation === item.id && <div className="mt-2 rounded-lg border border-rose-200 bg-white p-2">
                <p className="text-[10px] leading-4 text-slate-600">¿Eliminar este chat y todos sus mensajes?</p>
                <div className="mt-2 flex gap-2"><button type="button" onClick={() => void deleteConversation(item.id)} className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-700">Eliminar</button><button type="button" onClick={() => setPendingDeleteConversation(null)} className="rounded-md px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button></div>
              </div>}
            </div>)}
          </div>
          <div className="border-t border-white/10 px-3 py-3 text-[10px] leading-4 text-slate-400">Los chats son privados de tu cuenta. Puedes eliminarlos cuando quieras.</div>
        </aside>}
        <div className={workspace ? "flex min-h-0 min-w-0 flex-1 flex-col" : "contents"}>
      {reviewQuestions.length > 0 && <div className="shrink-0 border-b border-[#d9c5ae] bg-[#fff9f0] px-3 py-2">
        <button type="button" onClick={() => setNotebookOpen((value) => !value)} aria-expanded={notebookOpen} className={`flex min-h-10 w-full items-center justify-between gap-3 border px-3 py-2 text-left text-xs font-extrabold transition ${notebookOpen ? "border-orange-500 bg-orange-100 text-orange-950" : "border-orange-200 bg-white text-slate-800 hover:border-orange-400 hover:bg-orange-50"}`}>
          <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-orange-600"/> Cuaderno de preguntas falladas <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] text-white">{reviewQuestions.length}</span></span>
          <span className="text-[10px] text-orange-700">{notebookOpen ? "Cerrar −" : "Ver preguntas +"}</span>
        </button>
        {notebookOpen && <section aria-label="Cuaderno de preguntas falladas" className="mt-2 max-h-64 overflow-y-auto border border-orange-200 bg-[#fffdf9] p-2">
          <p className="px-2 py-1 text-[10px] leading-4 text-slate-600">Elige una pregunta para enviársela a Orby. La explicación aparecerá en este chat.</p>
          <div className="mt-1 grid gap-2">
            {reviewQuestions.map((item) => <button key={item.id} type="button" onClick={() => explainReviewQuestion(item)} className="w-full border border-[#e7c6a5] bg-white px-3 py-2 text-left transition hover:border-orange-500 hover:bg-orange-50">
              <span className="block text-[9px] font-black uppercase tracking-wider text-orange-700">Pregunta {item.number} · {item.subject}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">{item.prompt}</span>
              <span className="mt-1 block text-[10px] leading-4 text-slate-600">Tu respuesta: {item.userAnswer}</span>
              <span className="mt-1 block text-[10px] leading-4 text-emerald-800">Respuesta correcta: {item.correctAnswer}</span>
            </button>)}
          </div>
        </section>}
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={scrollRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center">
            <Image src="/avatars/photo_perfil/orbyp.png" width={1200} height={800} alt="Orby, tutor de PeakScore" className={`mb-2 h-28 w-28 rounded-full border-2 bg-white object-contain object-center ${orbyAccent ? "border-orange-300 shadow-[0_4px_18px_rgba(249,115,22,.18)]" : "border-sky-200 shadow-[0_4px_18px_rgba(14,165,233,.16)]"}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/avatars/orby.webp"; }} />
            <div className="w-full rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-base font-extrabold text-slate-950">¡Hola! Soy Orby 👋</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Te ayudo a comprender la teoría, analizar los datos y razonar tu respuesta. ¿Qué parte revisamos juntos?</p>
            </div>
            <div className="mt-4 grid w-full gap-2">
              {starters.map((starter) => (
                <button key={starter} type="button" disabled={loading} onClick={() => void sendMessage(starter)} className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition disabled:opacity-50 ${orbyAccent ? "hover:border-orange-300 hover:bg-orange-50" : "hover:border-sky-300 hover:bg-sky-50"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${orbyAccent ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600"}`}>✦</span>{starter}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <article key={index} className={message.role === "user" ? `ml-auto max-w-[92%] rounded-2xl rounded-br-sm px-3 py-3 text-white ${orbyAccent ? "bg-orange-600" : "bg-sky-600"}` : "mr-auto max-w-[96%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm"}>
                <p className={message.role === "user" ? "mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-100" : `mb-1 text-[10px] font-bold uppercase tracking-wider ${orbyAccent ? "text-orange-700" : "text-sky-700"}`}>{message.role === "user" ? "Tú" : "Orby · Tutor PeakScore"}</p>
                <div className="break-words text-[13px] leading-[1.75] sm:text-sm">{renderTutorContent(message.content)}</div>
                {message.role === "assistant" && <button type="button" onClick={() => speakingIndex === index ? stopSpeaking() : speakText(message.content, index)} className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
                  <Volume2 className="h-3.5 w-3.5" /> {speakingIndex === index ? "Detener audio" : "Escuchar respuesta"}
                </button>}
                {message.attachmentName && <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/25 p-2">{message.attachmentPreview ? <Image src={message.attachmentPreview} width={1200} height={800} unoptimized alt={"Adjunto: " + message.attachmentName} className="max-h-28 max-w-full rounded-md object-contain" /> : message.attachmentKind === "audio" ? <AudioLines className="h-6 w-6 shrink-0" /> : <FileText className="h-6 w-6 shrink-0" />}<p className="min-w-0 break-all text-[10px] opacity-80">{message.attachmentName}</p></div>}
                {message.checkQuestion && <div className="mt-3 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"><strong>Comprueba lo aprendido:</strong> {message.checkQuestion}</div>}
              </article>
            ))}
            {loading && <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Orby está preparando una explicación…</div>}
          </div>
        )}
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>

      {attachment && <div className="shrink-0 border-t border-slate-100 bg-white px-3 pt-3">
        <div className={`flex items-center gap-3 rounded-xl border p-2 ${orbyAccent ? "border-orange-200 bg-orange-50" : "border-sky-200 bg-sky-50"}`}>
          {attachmentPreview ? <Image src={attachmentPreview} width={1200} height={800} unoptimized alt="Vista previa de la imagen adjunta" className={`h-12 w-12 shrink-0 rounded-lg border bg-white object-cover ${orbyAccent ? "border-orange-100" : "border-sky-100"}`} /> : <FileText className={`ml-2 h-8 w-8 shrink-0 ${orbyAccent ? "text-orange-700" : "text-sky-700"}`} />}
          <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">{attachment.name}</p><p className="text-[11px] text-slate-500">Listo para analizar · {(attachment.size / 1024).toFixed(0)} KB</p><p className="text-[10px] text-slate-500">La imagen solo se envía a Orby cuando pulses enviar. Puedes quitarla antes.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
              <label className="text-[10px] font-semibold text-slate-600">Contraste {imageContrast}%<input type="range" min="80" max="180" value={imageContrast} onChange={(event) => setImageContrast(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Brillo {imageBrightness}%<input type="range" min="70" max="150" value={imageBrightness} onChange={(event) => setImageBrightness(Number(event.target.value))} className="block w-full" /></label>
              <button type="button" onClick={enhanceImage} className="col-span-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 hover:bg-orange-100">Mejorar contraste y brillo</button>
            </div>
            <div className="mt-2 rounded-lg border border-orange-100 bg-white p-2">
              <p className="mb-2 text-[10px] font-bold text-slate-700">Contorno detectado · ajusta los cuatro vértices</p>
              <svg viewBox="0 0 100 100" className="mb-3 h-44 w-full rounded-lg bg-slate-100" role="img" aria-label="Vista esquemática de las cuatro esquinas detectadas">
                <polygon points={paperCorners.map((point) => `${point.x},${point.y}`).join(" ")} fill="rgba(249,115,22,0.14)" stroke="#ea580c" strokeWidth="1.5" />
                {paperCorners.map((point,index)=><g key={index}><circle cx={point.x} cy={point.y} r="3.5" fill="#ea580c" stroke="white" strokeWidth="1.2"/><text x={Math.min(91,point.x+2)} y={Math.max(8,point.y-3)} fontSize="5" fill="#9a3412">{index+1}</text></g>)}
              </svg>
              <p className="mb-2 text-[10px] font-bold text-slate-700">Ajustar las cuatro esquinas (porcentaje de la imagen)</p>
              {paperCorners.map((point, index) => <div key={index} className="mb-2 grid grid-cols-[1fr_1fr] gap-2">
                <label className="text-[10px] text-slate-600">Esquina {index + 1} · X {point.x}%<input type="range" min="0" max="100" value={point.x} onChange={(event) => updatePaperCorner(index, "x", Number(event.target.value))} className="block w-full" /></label>
                <label className="text-[10px] text-slate-600">Y {point.y}%<input type="range" min="0" max="100" value={point.y} onChange={(event) => updatePaperCorner(index, "y", Number(event.target.value))} className="block w-full" /></label>
              </div>)}
              <button type="button" onClick={straightenPaper} className="w-full rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700">Enderezar hoja con estas esquinas</button>
            </div>
            <button type="button" onClick={detectPaperBounds} className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-800 hover:bg-orange-100">Detectar bordes de la hoja</button>
            <button type="button" onClick={() => setCropMode((value) => !value)} className="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">{cropMode ? "Cerrar recorte" : "Recortar pregunta"}</button>
            {cropMode && <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-white p-2">
              <label className="text-[10px] font-semibold text-slate-600">Izquierda {cropX}%<input type="range" min="0" max={Math.max(0, 100 - cropW)} value={cropX} onChange={(event) => setCropX(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Arriba {cropY}%<input type="range" min="0" max={Math.max(0, 100 - cropH)} value={cropY} onChange={(event) => setCropY(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Ancho {cropW}%<input type="range" min="10" max={100 - cropX} value={cropW} onChange={(event) => setCropW(Number(event.target.value))} className="block w-full" /></label>
              <label className="text-[10px] font-semibold text-slate-600">Alto {cropH}%<input type="range" min="10" max={100 - cropY} value={cropH} onChange={(event) => setCropH(Number(event.target.value))} className="block w-full" /></label>
              <button type="button" onClick={applyImageCrop} className="col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-700">Aplicar recorte</button>
            </div>}
            <button type="button" onClick={readImageText} disabled={ocrLoading || !attachment || !attachment.type.startsWith("image/")} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-orange-800 transition hover:bg-orange-50 disabled:opacity-50">
              {ocrLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5" />}
              {ocrLoading ? "Leyendo en este dispositivo…" : ocrText ? "Volver a leer texto" : "Leer texto de la hoja"}
            </button>
            {ocrText && <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[10px] leading-relaxed text-slate-600">{ocrText}</p>}
</div>
          <button type="button" onClick={clearAttachment} aria-label="Quitar imagen adjunta" className="rounded-full p-2 text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
        </div>
      </div>}
      {attachmentError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{attachmentError}</p>}
      {voiceError && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{voiceError}</p>}
      {isListening && !(workspace && workspaceMode === "voice") && <p role="status" className="shrink-0 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">Te escucho… {voiceMode ? "Habla con Orby. Te responderé en voz y volveré a escucharte." : "Al terminar, enviaré tu pregunta a Orby."}</p>}
      {isRecording && <div role="status" className="flex shrink-0 items-center justify-between border-t border-rose-100 bg-rose-50 px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-bold text-rose-700"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-600" /> Grabando tu voz · máximo 60 segundos</span>
        <button type="button" onClick={() => stopAudioRecording()} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"><Square className="h-3 w-3 fill-current" /> Detener</button>
      </div>}
      {workspace && workspaceMode === "voice" && <div className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2 sm:mx-6" role="status" aria-live="polite">
        <span className={isListening ? "h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-orange-600" : speakingIndex !== null ? "h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" : "h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400"} />
        <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700">{speakingIndex !== null ? "Orby está hablando…" : isListening ? "Escuchando… habla con naturalidad" : loading ? "Preparando respuesta…" : "Modo de voz activo"}</span>
        <div className="flex h-6 items-center gap-[3px]" aria-hidden="true">{Array.from({length: 18}, (_, index) => <span key={index} className="w-[3px] rounded-full bg-orange-500 transition-all" style={{height: 5 + ((index * 7) % 17), opacity: isListening || speakingIndex !== null ? 1 : 0.35}} />)}</div>
        {speakingIndex !== null && <button type="button" onClick={() => { stopSpeaking(); toggleVoiceInput(); }} className="shrink-0 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-[11px] font-bold text-orange-700 transition hover:bg-orange-100">Interrumpir</button>}
        <button type="button" onClick={toggleVoiceMode} className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-700">Finalizar</button>
      </div>}
      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp3,audio/aac,audio/mp4,audio/m4a,audio/opus" className="hidden" aria-label="Adjuntar imagen o audio" onChange={(event) => { handleComposerAttachment(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
        <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label="Tomar foto de una pregunta" onChange={(event) => handleAttachment(event.currentTarget.files?.[0])} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || isRecording || audioTranscribing} aria-label="Adjuntar foto o archivo de audio" title="Adjuntar imagen JPG/PNG/WebP o nota de voz MP3/WAV/OGG/WebM/M4A" className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition disabled:opacity-40 ${orbyAccent ? "hover:border-orange-300 hover:bg-orange-50" : "hover:border-sky-300 hover:bg-sky-50"}`}><Paperclip className="h-5 w-5" /></button>
        <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading || isRecording || audioTranscribing} aria-label="Abrir cámara para escanear una pregunta" title="Tomar foto con la cámara" className={`flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}><Camera className="h-5 w-5" /></button>
        <button type="button" onClick={() => void requestMicrophonePermission()} disabled={loading || isRecording || audioTranscribing} aria-label="Solicitar permiso del micrófono y grabar una nota de voz" title="Permitir micrófono y grabar nota de voz" className="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 text-orange-700 transition hover:bg-orange-50 disabled:opacity-40"><Mic className="h-5 w-5" /></button>
        <button type="button" onClick={toggleVoiceMode} disabled={loading} aria-label={voiceMode ? "Finalizar conversación por voz" : "Iniciar conversación por voz"} title={voiceMode ? "Finalizar conversación por voz" : "Iniciar conversación por voz"} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${voiceMode ? "border-orange-500 bg-orange-600 text-white shadow-[0_4px_14px_rgba(234,88,12,.25)]" : "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100"}`}><AudioLines className="h-5 w-5" /></button>
        <label className="sr-only" htmlFor="orby-tutor-message">Pregunta a Orby</label>
        <textarea ref={inputRef} id="orby-tutor-message" value={input} onPaste={(event) => {
          const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
          if (!imageItem) return;
          const pastedImage = imageItem.getAsFile();
          if (!pastedImage) return;
          event.preventDefault();
          const extension = pastedImage.type === "image/jpeg" ? "jpg" : pastedImage.type === "image/webp" ? "webp" : "png";
          handleAttachment(new File([pastedImage], "captura-" + Date.now() + "." + extension, { type: pastedImage.type }));
        }} onChange={(event) => { setInput(event.target.value); const element = event.currentTarget; element.style.height = "48px"; element.style.height = `${Math.min(element.scrollHeight, 112)}px`; }} maxLength={1200} rows={1} placeholder="Escribe tu pregunta o pega una imagen con Ctrl + V…" style={{ scrollbarWidth: "none" }} className={`min-h-12 max-h-28 flex-1 overflow-y-auto resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-5 text-slate-900 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden placeholder:text-slate-400 ${orbyAccent ? "focus:border-orange-400 focus:ring-2 focus:ring-orange-100" : "focus:border-sky-400 focus:ring-2 focus:ring-sky-100"}`} />
        <button type="submit" disabled={(!input.trim() && !attachment) || loading || isRecording || audioTranscribing} aria-label="Enviar mensaje a Orby" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${orbyAccent ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}><Send className="h-5 w-5" /></button>
      </form>
      {conversationError && workspace && <p role="alert" className="shrink-0 border-t border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">{conversationError}</p>}
      <p className="shrink-0 bg-white px-4 pb-3 text-[10px] leading-4 text-slate-400">Orby es un apoyo de estudio; verifica siempre los datos y procedimientos de la lección.</p>
        </div>
      </div>
    </aside>
  );
}

