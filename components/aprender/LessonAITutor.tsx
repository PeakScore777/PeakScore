"use client";

import Image from "next/image";
import OrbyBoard from "@/components/aprender/OrbyBoard";
import { sanitizeOrbyBoard, type OrbyBoard as OrbyBoardData } from "@/lib/ai/orby-board";
import { applyOrbyBoardAction, createOrbyBoardActionSequenceState, evaluateOrbyBoardActionSequence, sanitizeOrbyBoardAction } from "@/lib/ai/orby-board-actions";

import { FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { FunctionResponseScheduling, Session } from "@google/genai";
import { AudioLines, Bookmark, BookOpen, Camera, Captions, FileText, ImagePlus, Images, LoaderCircle, MessageSquare, Mic, MicOff, Paperclip, Plus, ScanText, Search, Send, Square, Trash2, Volume2, X } from "lucide-react";
import { containsCookingInstruction, dedupeAdjacentAssistantMessages, containsExplicitNonIcfesTopic, containsExternalPreIcfesPromotion, containsPlatformMarketingClaim, ORBY_PLATFORM_NEUTRALITY_REPLY, getOrbyGreetingFollowUpReply, isOrbyGreetingRequest, containsProgrammingInstruction, containsUnsupportedSpanishLanguage, hasFalseOrbyCreatorAttribution, isGenericIcfesEnglishRequest, isLikelyEnglishOnlyOrbyReply, isOrbyUnclearInput, isOrbyStudyGuidanceRequest, isLowQualityOrbyReply, ORBY_STUDY_GUIDANCE_REPLY, ORBY_INCOMPLETE_REPLY_FALLBACK, normalizeOrbySpanishOutput, getOrbySubjectSelectionLabel, composeOrbySpeechText, ORBY_EXTERNAL_PREICFES_REPLY, ORBY_COOKING_REPLY, ORBY_SAFETY_REPLY, ORBY_ICFES_ENGLISH_INTRO_REPLY, ORBY_SPANISH_ONLY_REPLY, ORBY_SPANISH_OUTPUT_FALLBACK, preflightOrbyRequest } from "@/lib/ai/orby-request-filter";
import { ORBY_LIVE_KNOWLEDGE_TOOLS } from "@/lib/ai/orby-live-tools";
import { isLikelyVoicePlaybackEcho as detectVoicePlaybackEcho, isStrongVoiceBargeIn, isDuplicateVoiceTranscriptInActivity } from "@/lib/ai/orby-voice-echo";
import { splitOrbySpeechIntoChunks } from "@/lib/ai/orby-speech-chunks";
import { countOrbySubtitleWords, getOrbyKaraokeWordIndex, splitOrbySubtitleSegments } from "@/lib/ai/orby-subtitle-timing";
import { reconcileOrbyPublicCitations } from "@/lib/ai/orby-web-research";
import { classifyGeminiProviderFailure } from "@/lib/ai/orby-tts-errors";
import { beginOrbyVoiceToolTurn, completeOrbyVoiceToolGeneration, createOrbyVoiceToolTurnState, markOrbyVoiceToolFollowupOutput, markOrbyVoiceToolResponseSent, MAX_ORBY_VOICE_TOOL_CALLS_PER_TURN, resetOrbyVoiceToolTurn } from "@/lib/ai/orby-voice-tool-turn";

const MAX_VOICE_RECORDING_MS = 5 * 60_000;
const MAX_VOICE_TRANSCRIPT_CHARS = 8_000;
const MAX_ORBY_LIVE_BOARD_UPDATES_PER_TURN = 8;

type OrbyPublicSource = { title: string; url: string; publisher: string; publishedAt: string | null; kind: "encyclopedia" | "research"; citationNumber: number };
type Message = { id?: string; role: "user" | "assistant"; content: string; board?: OrbyBoardData; boardPersistenceWarning?: string; checkQuestion?: string; sources?: OrbyPublicSource[]; attachmentName?: string; attachmentPreview?: string; attachmentKind?: "image" | "audio"; generatedImage?: string; createdAt?: string };
type Conversation = { id: string; title: string; subject: string; topic: string; created_at: string; updated_at: string };
type LearningItem = { id: string; kind: "note" | "topic"; title: string; content: string; created_at: string };
type LearningSignal = { id: string; subject: string; topic: string; concept: string; learning_state: "understands" | "needs_review" | "misconception" | "struggling"; misconception: string | null; teaching_hint: string | null; confidence: number; created_at: string };
type StoredImage = { name: string; path: string; signedUrl: string; createdAt: string; size: number };
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


async function ensureVoiceAudioContextRunning(context: AudioContext): Promise<void> {
  if (context.state === "suspended") await context.resume();
  if (context.state !== "running") {
    throw new Error("El audio del navegador no está activo. Revisa los permisos de sonido y vuelve a iniciar la llamada.");
  }
}

function normalizeVoiceComparison(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO").replace(/[^a-z0-9\s]+/gi, "");
}

function ambiguousShortProgrammingTranscript(value: string): boolean {
  const normalized = normalizeVoiceComparison(value).replace(/\s+/g, " ").trim();
  // Whisper can turn a short Spanish word into a programming keyword. A lone
  // token has too little context to justify rejecting a student's ICFES turn.
  const words = normalized.split(" ").filter(Boolean);
  return words.length <= 4
    && /\b(?:programar|programacion|programando|programa|codigo|codigos|python|javascript|typescript|java|html|css|sql)\b/.test(normalized)
    && !/\b(?:quiero aprender|ensename|ayudame a|explicame como|como puedo|tutorial|desde cero|clase de)\b/.test(normalized);
}

function isLikelyVoicePlaybackEcho(transcript: string, assistantSpeech: string | readonly string[]): boolean {
  return detectVoicePlaybackEcho(transcript, assistantSpeech);
}


function mergeLiveTranscript(previous: string, incoming: string): string {
  const incomingTrimmed = incoming.trim();
  const previousTrimmed = previous.trim();
  if (!incomingTrimmed) return previous;
  if (!previousTrimmed) return incomingTrimmed;
  if (
    incomingTrimmed === previousTrimmed
    || previousTrimmed.includes(incomingTrimmed)
    || previousTrimmed.startsWith(incomingTrimmed)
  ) return previous;
  if (incomingTrimmed.startsWith(previousTrimmed)) return incomingTrimmed;

  let overlap = Math.min(previousTrimmed.length, incomingTrimmed.length);
  while (overlap > 0 && previousTrimmed.slice(-overlap) !== incomingTrimmed.slice(0, overlap)) {
    overlap -= 1;
  }

  const suffix = incomingTrimmed.slice(overlap);
  if (!suffix) return previous;
  const left = previous.trimEnd();
  const right = suffix.trimStart();
  const hasBoundarySpace = /\s$/.test(previous) || /^\s/.test(suffix);
  // Live transcription chunks may end in punctuation or begin with a capital
  // letter. Separate every independent word chunk, not only alphanumeric pairs.
  const startsWithPunctuation = /^[,.;:!?)}\]]/.test(right);
  const endsWithOpeningPunctuation = /[([{¿¡]$/.test(left);
  const needsSeparator = !hasBoundarySpace && !startsWithPunctuation && !endsWithOpeningPunctuation;
  return left + (needsSeparator ? " " : "") + suffix;
}

function normalizeVoicePunctuation(value: string): string {
  return value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:!?])(?=[A-Za-z])/gu, "$1 ")
    .replace(/([.!?])(?=[A-Z])/gu, "$1 ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|\[(\d{1,2})\]\((https:\/\/[^)\s]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++} className="font-bold text-slate-950">{token.slice(2, -2)}</strong>);
    } else {
      const citationNumber = match[2];
      const rawUrl = match[3];
      let safeUrl = "";
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === "https:" && ["es.wikipedia.org", "doi.org", "openalex.org"].includes(parsed.hostname.toLowerCase())) {
          safeUrl = parsed.toString();
        }
      } catch {
        safeUrl = "";
      }
      parts.push(safeUrl
        ? <a key={key++} href={safeUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900">[{citationNumber}]</a>
        : <span key={key++}>{token}</span>);
    }
    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  return parts;
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
  const orbyAccent = accent === "orby";
  const activeSubjectRef = useRef(subject);
  useEffect(() => {
    activeSubjectRef.current = subject;
  }, [subject]);
  const [globalTheme, setGlobalTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const readTheme = () => { try { setGlobalTheme(window.localStorage.getItem("peakscore-theme") === "light" ? "light" : "dark"); } catch { setGlobalTheme("dark"); } };
    const handleThemeEvent = (event: Event) => { const next = (event as CustomEvent<"light" | "dark">).detail; if (next === "light" || next === "dark") setGlobalTheme(next); };
    readTheme();
    window.addEventListener("peakscore-theme-change", handleThemeEvent);
    window.addEventListener("storage", readTheme);
    return () => { window.removeEventListener("peakscore-theme-change", handleThemeEvent); window.removeEventListener("storage", readTheme); };
  }, []);

  const [notebookOpen, setNotebookOpen] = useState(false);
  const activeReviewRef = useRef<ReviewQuestion | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  // Gemini Live callbacks outlive the render that opened the socket. Keep a
  // current conversation snapshot so every turn and reconnection sees new turns.
  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const restoreActiveSubjectFromStoredConversation = useCallback((savedSubject: unknown, savedMessages: unknown) => {
    const storedLabel = typeof savedSubject === "string"
      ? getOrbySubjectSelectionLabel(savedSubject)
      : null;
    if (storedLabel) {
      activeSubjectRef.current = storedLabel;
      return;
    }
    if (Array.isArray(savedMessages)) {
      for (let index = savedMessages.length - 1; index >= 0; index -= 1) {
        const item = savedMessages[index] as { role?: unknown; content?: unknown } | null;
        if (item?.role !== "user" || typeof item.content !== "string") continue;
        const selectedLabel = getOrbySubjectSelectionLabel(item.content);
        if (selectedLabel) {
          activeSubjectRef.current = selectedLabel;
          return;
        }
      }
    }
    activeSubjectRef.current = subject;
  }, [subject]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [queuedMessageCount, setQueuedMessageCount] = useState(0);
  const [imageGenerationLoading, setImageGenerationLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [microphonePermission, setMicrophonePermission] = useState<"unknown" | "prompt" | "granted" | "denied">("unknown");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(workspace);
  const isHistoryLoading = Boolean(open && workspace && historyLoading);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState("");
  const [failedVoiceTurn, setFailedVoiceTurn] = useState<{
    conversationId: string;
    turnId: string;
    userContent: string;
    assistantContent: string;
    board?: OrbyBoardData;
  } | null>(null);
  const [retryingVoiceTurn, setRetryingVoiceTurn] = useState(false);
  // Keep the same idempotency key if a completed turn is retried after a timeout.
  const pendingVoicePersistenceRef = useRef<{ conversationId: string; turnId: string; userContent: string; assistantContent: string; board?: OrbyBoardData } | null>(null);
  const [learningView, setLearningView] = useState<"chat" | "notes" | "topics" | "progress" | "storage">("chat");
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [learningSignals, setLearningSignals] = useState<LearningSignal[]>([]);
  const [learningSearch, setLearningSearch] = useState("");
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState("");
  const [imageAssets, setImageAssets] = useState<StoredImage[]>([]);
  const [imageAssetsLoading, setImageAssetsLoading] = useState(false);
  const [imageStorageError, setImageStorageError] = useState("");
  const [showAssistantSubtitles, setShowAssistantSubtitles] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordedAudioPreviewUrl, setRecordedAudioPreviewUrl] = useState("");
  const [audioSource, setAudioSource] = useState<"recording" | "upload">("recording");
  const [audioTranscribing, setAudioTranscribing] = useState(false);
  const [pendingAttachmentMeta, setPendingAttachmentMeta] = useState<{ kind: "image" | "audio"; label: string } | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceFallbackMode, setVoiceFallbackMode] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"chat" | "voice">("chat");
  const [voiceStatus, setVoiceStatus] = useState("Preparando conexión…");
  const [voiceBoardDrawingActive, setVoiceBoardDrawingActive] = useState(true);
  const [voiceSubtitlePlaybackActive, setVoiceSubtitlePlaybackActive] = useState(false);
  const [voiceSubtitleWordIndex, setVoiceSubtitleWordIndex] = useState(-1);
  const [liveTranscript, setLiveTranscript] = useState("");
  const voiceModeRef = useRef(false);
  const voiceFallbackModeRef = useRef(false);
  const voiceStartupAbortRef = useRef<AbortController | null>(null);
  const voiceSessionGenerationRef = useRef(0);
  const voiceSessionResumeHandleRef = useRef<string | null>(null);
  const voiceSessionResumeConversationRef = useRef<string | null>(null);
  const voiceSessionResumeUpdatedAtRef = useRef(0);
  const voiceResponseWatchdogRef = useRef<number | null>(null);
  const voiceResponseSlowNoticeRef = useRef<number | null>(null);
  const voiceAnalyserRef = useRef<AnalyserNode | null>(null);
  const voiceAnimationFrameRef = useRef<number | null>(null);
  const voiceVisualLevelRef = useRef(0);
  const voiceStageOrbRef = useRef<HTMLDivElement | null>(null);
  const voiceMiniOrbRef = useRef<HTMLSpanElement | null>(null);
  const voiceChannelRef = useRef<Session | null>(null);
  const voiceSdkRef = useRef<typeof import("@google/genai") | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceAudioContextRef = useRef<AudioContext | null>(null);
  const voiceMicSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const voiceWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const voiceMuteGainRef = useRef<GainNode | null>(null);
  const voiceAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const voiceNextPlaybackTimeRef = useRef(0);
  const voiceSubtitlePlaybackStartRef = useRef(0);
  const voiceSubtitlePlaybackEndRef = useRef(0);
  const voiceSubtitleWordIndexRef = useRef(-1);
  const voiceUserTextRef = useRef("");
  const voiceUserMessageIdRef = useRef<string | null>(null);
  const voiceActivityGenerationRef = useRef(0);
  const voiceKnowledgeRequestsRef = useRef<Map<string, AbortController>>(new Map());
  const voiceKnowledgeToolTurnRef = useRef(createOrbyVoiceToolTurnState());
  const voiceLastCommittedActivityGenerationRef = useRef(-1);
  const voicePendingStudentTurnRef = useRef(false);
  const voiceUnsupportedInputDetectedRef = useRef(false);
  const voiceAssistantTextRef = useRef("");
  const voiceAssistantMessageIdRef = useRef<string | null>(null);
  const voiceTeachingBoardRef = useRef<OrbyBoardData | null>(null);
  const voicePendingBoardSnapshotsRef = useRef<Array<{
    board: OrbyBoardData;
    sessionGeneration: number;
    activityGeneration: number;
    createdAt: number;
  }>>([]);
  const voiceBoardSnapshotFlushRef = useRef<number | null>(null);
  const voiceAwaitingInputTranscriptionRef = useRef(false);
  const voiceInputPreflightAcceptedRef = useRef(false);
  const voiceInputActivityStartedAtRef = useRef(0);
  const voicePublicSourcesRef = useRef<OrbyPublicSource[]>([]);
  const voiceUserMessageVisibleRef = useRef(false);
  const voiceResponseDoneRef = useRef(false);
  const voiceTurnPersistedRef = useRef(false);
  const voiceTurnRetryInFlightRef = useRef(false);
  const voiceTurnPersistenceChainRef = useRef<Promise<void>>(Promise.resolve());
  const voicePendingAudioChunksRef = useRef<Array<{ data: string; mimeType?: string }>>([]);
  const voicePendingAudioEncodedCharsRef = useRef(0);
  const voiceRealtimeAudioChunkCountRef = useRef(0);
  const voiceOutputAudioBlockedRef = useRef(false);
  const voiceOutputTranscriptValidatedRef = useRef(false);
  const voiceInputPolicyRef = useRef<"identity" | "programming" | "outside" | null>(null);
  const voiceForcedReplyRef = useRef<string | null>(null);
  const voiceLocalReplyInFlightRef = useRef(false);
  const voiceBargeInPendingRef = useRef(false);
  const voiceDiscardStaleLiveOutputRef = useRef(false);
  const voicePreflightReplyRef = useRef<string | null>(null);
  const voiceLastCommittedInputRef = useRef("");
  const voiceLastCommittedInputAtRef = useRef(0);
  // Per-turn monotonic timestamps measure Live latency without storing student text.
  const voiceTurnAcceptedAtRef = useRef(0);
  const voiceFirstOutputTextLoggedRef = useRef(false);
  const voiceFirstAudioLoggedRef = useRef(false);
  const voiceFirstAudioChunkReceivedRef = useRef(false);
  const voiceListeningReadyLoggedRef = useRef(false);
  const voiceBoardUpdateCountRef = useRef(0);
  const voiceBoardActionSequenceRef = useRef(createOrbyBoardActionSequenceState());
  const voiceLastAssistantOutputRef = useRef("");
  const voiceLastAssistantOutputAtRef = useRef(0);
  const voiceRecentAssistantOutputsRef = useRef<Array<{ text: string; at: number }>>([]);
  const voiceLastAssistantPlaybackUntilRef = useRef(0);
  const voiceBrowserSpeechActiveRef = useRef(false);
  const voiceSpeechCancelRef = useRef<(() => void) | null>(null);
  const voiceSpeechPlaybackGenerationRef = useRef(0);
  const voiceTtsQuotaExhaustedRef = useRef(false);
  const voicePlaybackOwnerRef = useRef<"none" | "live" | "tts">("none");
  const waitingForVoiceReplyRef = useRef(false);
  useEffect(() => {
    if (!voiceSubtitlePlaybackActive || !voiceModeRef.current || voiceFallbackModeRef.current) return;
    let frameId = 0;

    const updateKaraokeHighlight = () => {
      const audioContext = voiceAudioContextRef.current;
      const startAt = voiceSubtitlePlaybackStartRef.current;
      const endAt = voiceSubtitlePlaybackEndRef.current;
      const wordCount = countOrbySubtitleWords(voiceAssistantTextRef.current);
      if (audioContext && startAt > 0 && endAt >= startAt && wordCount > 0) {
        const elapsed = Math.max(0, audioContext.currentTime - startAt);
        const duration = Math.max(0.08, endAt - startAt);
        const nextWordIndex = getOrbyKaraokeWordIndex(
          elapsed,
          duration,
          wordCount,
          voiceSubtitleWordIndexRef.current,
        );
        if (nextWordIndex !== voiceSubtitleWordIndexRef.current) {
          voiceSubtitleWordIndexRef.current = nextWordIndex;
          setVoiceSubtitleWordIndex(nextWordIndex);
        }
        const audioStillScheduled = voiceAudioSourcesRef.current.size > 0
          || audioContext.currentTime < voiceNextPlaybackTimeRef.current;
        if (!audioStillScheduled && elapsed >= duration) {
          setVoiceSubtitlePlaybackActive(false);
          return;
        }
      }

      frameId = window.requestAnimationFrame(updateKaraokeHighlight);
    };

    frameId = window.requestAnimationFrame(updateKaraokeHighlight);
    return () => window.cancelAnimationFrame(frameId);
  }, [voiceSubtitlePlaybackActive, messages]);

  function rememberVoiceAssistantOutput(value: string) {
    const text = value.trim().slice(0, 5_000);
    if (!text) return;
    const now = Date.now();
    const retained = voiceRecentAssistantOutputsRef.current
      .filter((item) => now - item.at <= 30_000 && item.text !== text)
      .slice(-5);
    retained.push({ text, at: now });
    voiceRecentAssistantOutputsRef.current = retained.slice(-6);
  }

  function getRecentVoiceAssistantOutputs(includeCurrent = true): string[] {
    const now = Date.now();
    const retained = voiceRecentAssistantOutputsRef.current
      .filter((item) => now - item.at <= 30_000)
      .map((item) => item.text);
    voiceRecentAssistantOutputsRef.current = voiceRecentAssistantOutputsRef.current
      .filter((item) => now - item.at <= 30_000);
    if (includeCurrent) {
      const current = voiceAssistantTextRef.current || voiceLastAssistantOutputRef.current;
      if (current.trim()) retained.push(current);
    }
    return retained.slice(-7);
  }

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
  const sendMessageRef = useRef<(text: string, includeAttachment?: boolean, voiceInteraction?: boolean, attachmentMeta?: { kind: "image" | "audio"; label: string }, appendUserMessage?: boolean) => Promise<void>>(async () => {});
  const stopRealtimeVoiceRef = useRef<(updateState?: boolean) => void>(() => {});
  const lastInitialPromptRef = useRef<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const historyHydratingRef = useRef(workspace);
  const historyHydrationGenerationRef = useRef(0);
  const sendingRef = useRef(false);
  // Invalidate in-flight replies when the student opens or selects another chat.
  const chatViewGenerationRef = useRef(0);
  const textRequestGenerationRef = useRef(0);
  const activeTextRequestRef = useRef<AbortController | null>(null);
  const lastSubmittedMessageRef = useRef<{ key: string; at: number } | null>(null);
  const pendingMessagesRef = useRef<Array<{ text: string; attachmentMeta?: { kind: "image" | "audio"; label: string } }>>([]);
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
    if (!open || !workspace) {
      historyHydratingRef.current = false;
      return;
    }
    let cancelled = false;
    const generation = ++historyHydrationGenerationRef.current;
    historyHydratingRef.current = true;
    const isCurrent = () => !cancelled && generation === historyHydrationGenerationRef.current;
    // Defer the initial visual state update outside the synchronous effect body.
    queueMicrotask(() => {
      if (!isCurrent()) return;
      setHistoryLoading(true);
      setConversationError("");
    });
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/orby/conversations", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(12_000),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "No se pudo cargar el historial.");
        const items = Array.isArray(payload.conversations) ? payload.conversations as Conversation[] : [];
        if (!isCurrent()) return;

        setConversations(items);
        // The sidebar history is ready as soon as the conversation list arrives.
        // Keep message hydration in the background so a slow message query does not
        // leave the whole workspace stuck on “Cargando chats…”. Typed turns remain
        // queued by historyHydratingRef until the active conversation is restored.
        setHistoryLoading(false);
        const first = items[0];
        if (first) {
          const messagesResponse = await fetch(`/api/orby/conversations/${first.id}/messages`, {
            credentials: "same-origin",
            cache: "no-store",
            signal: AbortSignal.timeout(8_000),
          });
          const messagesPayload = await messagesResponse.json().catch(() => ({}));
          if (!messagesResponse.ok && messagesResponse.status === 404) {
            if (!isCurrent()) return;
            // The current deployment may lag behind the branch route manifest.
            // Keep the saved conversation in the sidebar, but do not pin the
            // composer to an unreadable conversation ID or block a new chat.
            activeConversationRef.current = null;
            activeSubjectRef.current = subject;
            setConversationId(null);
            setMessages([]);
            setConversationError("Esta versión del sitio todavía no puede abrir los mensajes guardados. Tus conversaciones siguen conservadas; puedes iniciar un chat nuevo mientras se actualiza el historial.");
            return;
          }
          if (!messagesResponse.ok) throw new Error(messagesPayload.error || "No se pudieron cargar los mensajes.");
          if (!isCurrent()) return;

          // Do not overwrite a conversation created or selected while this
          // initial hydration request was in flight.
          if (activeConversationRef.current && activeConversationRef.current !== first.id) return;
          activeConversationRef.current = first.id;
          restoreActiveSubjectFromStoredConversation(first.subject, messagesPayload.messages);
          setConversationId(first.id);
          setMessages(dedupeAdjacentAssistantMessages(Array.isArray(messagesPayload.messages) ? messagesPayload.messages.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            role: item.role === "assistant" ? "assistant" : "user",
            content: typeof item.content === "string" ? item.content : "",
            checkQuestion: typeof item.check_question === "string" ? item.check_question : "",
            ...(item.teaching_board && typeof item.teaching_board === "object" ? { board: item.teaching_board as OrbyBoardData } : {}),
            attachmentKind: item.attachment_kind === "audio" || item.attachment_kind === "image" ? item.attachment_kind : undefined,
            attachmentName: typeof item.attachment_label === "string" ? item.attachment_label : undefined,
            createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
          })) : []));
        } else {
          // A stale empty result must never clear a chat that the student has
          // already started during hydration.
          if (activeConversationRef.current) return;
          activeSubjectRef.current = subject;
          setConversationId(null);
          setMessages([]);
        }
        setConversationError("");
      } catch (caught) {
        if (isCurrent()) setConversationError(caught instanceof Error ? caught.message : "No se pudo cargar el historial.");
      } finally {
        if (isCurrent()) {
          historyHydratingRef.current = false;
          setHistoryLoading(false);
          drainPendingMessageQueue();
        }
      }
    };
    void loadHistory();
    return () => {
      cancelled = true;
      // React runs this cleanup before the next setup for the same effect.
      // A new workspace hydration can safely set the flag back to true.
      historyHydratingRef.current = false;
    };
  }, [open, workspace, subject, restoreActiveSubjectFromStoredConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open || !workspace) return;
    let cancelled = false;
    const loadWorkspaceData = async () => {
      setImageAssetsLoading(true);
      setLearningLoading(true);
      try {
        const [imagesResponse, learningResponse] = await Promise.all([
          fetch("/api/orby/images", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/orby/learning", { credentials: "same-origin", cache: "no-store" }),
        ]);
        const [imagesPayload, learningPayload] = await Promise.all([
          imagesResponse.json().catch(() => ({})),
          learningResponse.json().catch(() => ({})),
        ]);
        if (!imagesResponse.ok) throw new Error(imagesPayload.error || "No se pudo cargar el almacenamiento.");
        if (!learningResponse.ok) throw new Error(learningPayload.error || "No se pudo cargar tu aprendizaje.");
        if (cancelled) return;
        setImageAssets(Array.isArray(imagesPayload.images) ? imagesPayload.images : []);
        setLearningItems(Array.isArray(learningPayload.items) ? learningPayload.items : []);
        setLearningSignals(Array.isArray(learningPayload.signals) ? learningPayload.signals : []);
        setImageStorageError("");
        setLearningError("");
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : "No se pudo cargar tu espacio de aprendizaje.";
          setImageStorageError(message);
          setLearningError(message);
        }
      } finally {
        if (!cancelled) { setImageAssetsLoading(false); setLearningLoading(false); }
      }
    };
    void loadWorkspaceData();
    return () => { cancelled = true; };
  }, [open, workspace]);

  async function refreshImageAssets() {
    const response = await fetch("/api/orby/images", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el almacenamiento.");
    setImageAssets(Array.isArray(payload.images) ? payload.images : []);
  }

  async function saveLearningItem(kind: "note" | "topic", title: string, content: string) {
    try {
      setLearningError("");
      const response = await fetch("/api/orby/learning", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo guardar.");
      setLearningItems((current) => [payload.item as LearningItem, ...current]);
      setLearningView(kind === "note" ? "notes" : "topics");
    } catch (caught) {
      setLearningError(caught instanceof Error ? caught.message : "No se pudo guardar.");
    }
  }

  async function deleteLearningItem(id: string) {
    try {
      const response = await fetch("/api/orby/learning", {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar.");
      setLearningItems((current) => current.filter((item) => item.id !== id));
    } catch (caught) {
      setLearningError(caught instanceof Error ? caught.message : "No se pudo eliminar.");
    }
  }

  async function deleteStoredImage(path: string) {
    try {
      setImageStorageError("");
      const response = await fetch("/api/orby/images", {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "No se pudo eliminar la imagen.");
      setImageAssets((current) => current.filter((item) => item.path !== path));
    } catch (caught) {
      setImageStorageError(caught instanceof Error ? caught.message : "No se pudo eliminar la imagen.");
    }
  }

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
    if (workspace && imageAssets.length >= 20) {
      setAttachmentError("Tu almacenamiento está lleno (20 de 20 imágenes). Elimina alguna imagen para poder enviar otra.");
      setLearningView("chat");
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
    let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null;
    try {
      // OCR es una función opcional: cargar Tesseract solo cuando el usuario
      // lo solicita evita incluir su motor en la carga inicial del chat/voz.
      const { createWorker } = await import("tesseract.js");
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
    const cancelActiveSpeech = voiceSpeechCancelRef.current;
    voiceSpeechCancelRef.current = null;
    cancelActiveSpeech?.();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (voicePlaybackOwnerRef.current === "tts") voicePlaybackOwnerRef.current = "none";
    voiceBrowserSpeechActiveRef.current = false;
    setSpeakingIndex(null);
  }

  function cancelPendingOrbyKnowledgeRequests(ids?: string[]) {
    const pending = voiceKnowledgeRequestsRef.current;
    const targets = ids?.length ? ids : [...pending.keys()];
    for (const id of targets) {
      const controller = pending.get(id);
      if (!controller) continue;
      pending.delete(id);
      controller.abort();
    }
  }

  // Cancel only the current response, keeping the Live session and mic alive.
  // A new user turn always takes priority over audio that is still playing.
  function interruptCurrentVoiceOutput() {
    setVoiceBoardDrawingActive(false);
    clearPendingOrbyTeachingBoard();
    cancelPendingOrbyKnowledgeRequests();
    // Remember that the next Live "interrupted" event belongs to this
    // student's new turn, not to a completed assistant response.
    const assistantAudioStillPlaying = voiceBrowserSpeechActiveRef.current
      || voiceAudioSourcesRef.current.size > 0
      || (voiceAudioContextRef.current?.currentTime ?? 0) < voiceNextPlaybackTimeRef.current;
    voiceBargeInPendingRef.current = Boolean(voiceChannelRef.current)
      && waitingForVoiceReplyRef.current
      && (!voiceResponseDoneRef.current || assistantAudioStillPlaying);
    const interruptedAssistantId = voiceAssistantMessageIdRef.current;
    const hadIncompleteAssistantReply = !voiceResponseDoneRef.current && Boolean(interruptedAssistantId);
    if (voiceResponseDoneRef.current) void persistRealtimeTurnIfReady();
    if (hadIncompleteAssistantReply && interruptedAssistantId) {
      setMessages((current) => current.filter((item) => item.id !== interruptedAssistantId));
    }
    clearVoiceResponseWatchdog();
    voiceLocalReplyInFlightRef.current = false;
    voiceBrowserSpeechActiveRef.current = false;
    const cancelSpeech = voiceSpeechCancelRef.current;
    voiceSpeechCancelRef.current = null;
    cancelSpeech?.();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    stopVoicePlayback();
    // The previous output has been stopped; do not let its old scheduled
    // playback horizon suppress the student's next voice activity/end event.
    voiceLastAssistantPlaybackUntilRef.current = Date.now() - 1;
    clearPendingGeminiAudioQueue();
    voiceRealtimeAudioChunkCountRef.current = 0;
    voiceOutputTranscriptValidatedRef.current = false;
    voiceOutputAudioBlockedRef.current = false;
    voiceForcedReplyRef.current = null;
    voicePreflightReplyRef.current = null;
    voiceInputPolicyRef.current = null;
    voiceAssistantTextRef.current = "";
    // A final ASR transcript can be the first signal of a barge-in. Clear the
    // previous student's text here so the new transcript cannot be merged into
    // the old question and overwrite the visible turn.
    voiceUserTextRef.current = "";
    voiceAssistantMessageIdRef.current = null;
    voiceTeachingBoardRef.current = null;
        voicePublicSourcesRef.current = [];
    voiceResponseDoneRef.current = false;
    voiceTurnPersistedRef.current = false;
    waitingForVoiceReplyRef.current = false;
    voicePendingStudentTurnRef.current = false;
    voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
    voiceActivityGenerationRef.current += 1;
    voiceLastCommittedActivityGenerationRef.current = -1;
    voiceUserMessageIdRef.current = null;
    voiceLastCommittedInputRef.current = "";
    setLiveTranscript("");
    setVoiceError("");
    setSpeakingIndex(null);
    setVoiceStatus("Te escucho…");
    setIsListening(true);
  }


  async function speakText(text: string, index: number, checkQuestion = ""): Promise<void> {
    const clean = composeOrbySpeechText(text, checkQuestion);
    if (!clean) return;

    // Gemini Live is primary. For text-only turns, use Gemini 3.8 Flash TTS
    // The endpoint returns Gemini's valid WAV bytes and never falls through to paid speech.
    await speakWithVerifiedFreeTts(clean, index);
  }


  function speakWithVerifiedFreeTts(text: string, index: number): Promise<void> {
    return new Promise((resolve) => {
      const isLocalVoiceTurn = voiceModeRef.current && waitingForVoiceReplyRef.current;
      const localVoiceMessageId = isLocalVoiceTurn ? voiceAssistantMessageIdRef.current : null;
      if (voiceTtsQuotaExhaustedRef.current) {
        if (isLocalVoiceTurn) {
          setVoiceStatus("Respuesta lista · cuota gratuita de lectura agotada");
          finishLocalVoiceReply(localVoiceMessageId);
        } else {
          setVoiceError("La cuota gratuita de lectura está agotada. La respuesta sigue disponible por escrito.");
        }
        resolve();
        return;
      }
      if (typeof window === "undefined") {
        if (isLocalVoiceTurn) finishLocalVoiceReply(localVoiceMessageId);
        resolve();
        return;
      }

      const clean = text
        .replace(/\*\*/g, "")
        .replace(/\`/g, "")
        .replace(/^[-•]\s*/gm, "")
        .replace(/^\d+[.)]\s*/gm, "")
        .replace(/\s+/g, " ")
        .trim();
      // Use near-maximum endpoint chunks to reduce free-tier requests without truncating content.
      const chunks = splitOrbySpeechIntoChunks(clean, 880);
      if (!chunks.length) {
        if (isLocalVoiceTurn) finishLocalVoiceReply(localVoiceMessageId);
        resolve();
        return;
      }

      const previousCancel = voiceSpeechCancelRef.current;
      voiceSpeechCancelRef.current = null;
      previousCancel?.();
      if (isLocalVoiceTurn && voicePlaybackOwnerRef.current === "live") {
        if (voiceAudioSourcesRef.current.size > 0) {
          // Live still owns an audible response. Let its onended path finish
          // the turn; never start a second speaker over it.
          resolve();
          return;
        }
        // A completed Live turn must release ownership so a validated
        // text-only fallback can be displayed instead of being silently skipped.
        voicePlaybackOwnerRef.current = "none";
      }
      voicePlaybackOwnerRef.current = "tts";

      let finished = false;
      let didPlaybackStart = false;
      let chunkIndex = 0;
      let chunkRetryCount = 0;
      let rateLimitWaitCount = 0;
      let safetyTimer: number | null = null;
      let prefetchTimer: number | null = null;
      let requestController: AbortController | null = null;
      let prefetchedAudio: { index: number; controller: AbortController; request: Promise<Response | null> } | null = null;
      let audioElement: HTMLAudioElement | null = null;
      let audioBufferSource: AudioBufferSourceNode | null = null;
      let audioObjectUrl: string | null = null;
      const playbackGeneration = voiceSpeechPlaybackGenerationRef.current;

      const clearAudioElement = () => {
        if (audioElement) {
          audioElement.onended = null;
          audioElement.onerror = null;
          audioElement.onloadedmetadata = null;
          audioElement.onplay = null;
          audioElement.pause();
          audioElement.removeAttribute("src");
          audioElement.load();
          audioElement = null;
        }
        if (audioBufferSource) {
          const source = audioBufferSource;
          audioBufferSource = null;
          source.onended = null;
          try { source.stop(); } catch { /* The decoded chunk may already have ended. */ }
          source.disconnect();
          source.buffer = null;
          voiceAudioSourcesRef.current.delete(source);
        }
        if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
          audioObjectUrl = null;
        }
      };

      const finish = (cancelled = false) => {
        if (finished) return;
        finished = true;
        if (safetyTimer !== null) window.clearTimeout(safetyTimer);
        if (prefetchTimer !== null) window.clearTimeout(prefetchTimer);
        prefetchTimer = null;
        requestController?.abort();
        requestController = null;
        prefetchedAudio?.controller.abort();
        prefetchedAudio = null;
        clearAudioElement();
        if (voicePlaybackOwnerRef.current === "tts") voicePlaybackOwnerRef.current = "none";
        if (voiceSpeechCancelRef.current === cancelSpeech) voiceSpeechCancelRef.current = null;
        setSpeakingIndex(null);
        if (isLocalVoiceTurn) {
          voiceBrowserSpeechActiveRef.current = false;
          if (!cancelled) {
            if (!didPlaybackStart) {
              // Text-only responses must not be remembered as microphone echo.
              voiceLastAssistantPlaybackUntilRef.current = 0;
              voiceLastAssistantOutputRef.current = "";
              voiceLastAssistantOutputAtRef.current = 0;
              voiceBrowserSpeechActiveRef.current = false;
            } else {
              voiceLastAssistantPlaybackUntilRef.current = Math.max(
                voiceLastAssistantPlaybackUntilRef.current,
                Date.now() + 1_800,
              );
            }
            finishLocalVoiceReply(localVoiceMessageId);
          }
        }
        resolve();
      };

      const cancelSpeech = () => finish(true);
      voiceSpeechCancelRef.current = cancelSpeech;

      if (isLocalVoiceTurn) {
        // Do not expose this text as spoken audio until playback really starts.
        // A metered/disabled TTS response must never create a phantom echo.
        setVoiceStatus("Orby está preparando la respuesta escrita…");
        setIsListening(false);
      }

      // If optional TTS is unavailable, keep the validated answer visible without speaking it.
      const finishWithoutGenericVoice = (notice = "No se pudo completar la lectura en voz alta. La respuesta completa sigue disponible por escrito.") => {
        if (finished) return;
        // Finish first because finishLocalVoiceReply updates the ready/listening
        // status. The final status below must describe the actual interruption.
        finish(false);
        setVoiceError(notice);
        setVoiceStatus("Lectura pausada · la respuesta completa sigue visible");
        if (!isLocalVoiceTurn) setError(notice);
      };

      function recoverCurrentTtsChunk() {
        if (finished) return;
        clearAudioElement();
        requestController = null;
        if (chunkRetryCount < 4) {
          chunkRetryCount += 1;
          // Retry the same segment several times. Never skip a sentence and
          // continue as if the whole explanation had been read.
          window.setTimeout(() => void playFreeTtsChunk(), 700);
          return;
        }
        finishWithoutGenericVoice(
          "La lectura se pausó en una frase que no pudo reproducirse después de varios intentos. No voy a saltarme esa parte. La respuesta completa sigue visible; toca «Escuchar respuesta» para reiniciar desde el principio.",
        );
      }

      const prefetchNextTtsChunk = () => {
        const nextIndex = chunkIndex + 1;
        if (finished || nextIndex >= chunks.length || prefetchedAudio?.index === nextIndex) return;
        // Generate the next audio segment while the current segment is playing.
        // Keep at most one request ahead and abort it on interruption/turn change.
        prefetchedAudio?.controller.abort();
        const controller = new AbortController();
        const request = fetch("/api/orby/voice-speech", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]),
          body: JSON.stringify({ text: chunks[nextIndex] }),
        }).catch(() => {
          if (prefetchedAudio?.controller === controller) prefetchedAudio = null;
          // Resolve failures instead of leaving a rejected promise unobserved
          // while the current audio segment is still playing. The consumer
          // retries this exact chunk through the normal guarded path.
          return null;
        });
        prefetchedAudio = { index: nextIndex, controller, request };
      };

      const schedulePrefetchNextTtsChunk = (durationSeconds: number) => {
        if (finished || chunkIndex + 1 >= chunks.length || prefetchedAudio) return;
        // Gemini documents that aborting a client request does not cancel an
        // accepted service operation or its quota usage. Delay speculation until
        // the current segment is mostly heard, and skip short segments entirely.
        if (!Number.isFinite(durationSeconds) || durationSeconds < 1.5) return;
        if (prefetchTimer !== null) window.clearTimeout(prefetchTimer);
        const delayMs = Math.max(350, Math.floor(durationSeconds * 0.65 * 1000));
        prefetchTimer = window.setTimeout(() => {
          prefetchTimer = null;
          prefetchNextTtsChunk();
        }, delayMs);
      };

      const playFreeTtsChunk = async () => {
        if (finished) return;
        if (playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) {
          finish(true);
          return;
        }
        if (chunkIndex >= chunks.length) {
          finish(false);
          return;
        }

        const prefetched = prefetchedAudio?.index === chunkIndex ? prefetchedAudio : null;
        if (prefetched) prefetchedAudio = null;
        const controller = prefetched?.controller ?? new AbortController();
        requestController = controller;
        try {
          const response = prefetched
            ? await prefetched.request
            : await fetch("/api/orby/voice-speech", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]),
                body: JSON.stringify({ text: chunks[chunkIndex] }),
              });
          if (!response) throw new Error("TTS_PREFETCH_FAILED");
          if (!response.ok) {
            const payload = await response.json().catch(() => ({})) as { error?: unknown; code?: unknown };
            const unavailableCodes = new Set([
              "FREE_TIER_TTS_NOT_AVAILABLE",
              "FREE_TIER_TTS_QUOTA_EXCEEDED",
              "TTS_PRIVACY_NOT_APPROVED",
              "TTS_NOT_CONFIGURED",
              "RATE_LIMIT_UNAVAILABLE",
            ]);
            if (typeof payload.code === "string" && unavailableCodes.has(payload.code)) {
              if (payload.code === "FREE_TIER_TTS_QUOTA_EXCEEDED") {
                // The provider quota is exhausted for this browser session.
                // Do not send another doomed request for every later tutor turn.
                voiceTtsQuotaExhaustedRef.current = true;
              }
              // A privacy gate, exhausted free quota or missing key is not an
              // audio decoding failure. Keep the answer and the listening UI
              // usable; never retry a request the server has already refused.
              setVoiceError("");
              if (!isLocalVoiceTurn) setError("");
              setVoiceStatus("Respuesta lista · puedes continuar hablando o escribir");
              voiceBrowserSpeechActiveRef.current = false;
              voiceLastAssistantOutputRef.current = "";
              voiceLastAssistantOutputAtRef.current = 0;
              voiceLastAssistantPlaybackUntilRef.current = 0;
              finishWithoutGenericVoice(
                payload.code === "FREE_TIER_TTS_QUOTA_EXCEEDED"
                  ? "Se agotó la cuota gratuita de voz. La lectura se pausó, pero la respuesta completa sigue visible; no se activará ningún servicio de pago."
                  : "La voz gratuita no está disponible en este momento. La respuesta completa sigue visible y puedes intentarlo de nuevo más tarde.",
              );
              return;
            }
            if (payload.code === "RATE_LIMITED") {
              // A rolling-window throttle is not a daily quota. Never stack minute-long
              // retries on the student's speaking turn: allow one tiny recovery only.
              const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
              if (Number.isFinite(retryAfter) && retryAfter >= 0
                && retryAfter <= 2 && rateLimitWaitCount < 1) {
                rateLimitWaitCount += 1;
                requestController = null;
                setVoiceStatus("Recuperando la voz…");
                window.setTimeout(() => void playFreeTtsChunk(), Math.max(250, retryAfter * 1000));
                return;
              }
              finishWithoutGenericVoice(
                "La voz está temporalmente limitada. La explicación completa sigue escrita y puedes continuar preguntando; no voy a dejarte esperando varios minutos ni activar un servicio de pago.",
              );
              return;
            }
            throw new Error(typeof payload.error === "string" ? payload.error : "FREE_TIER_TTS_UNAVAILABLE");
          }

          const audioBlob = await response.blob();
          if (audioBlob.size < 256 || audioBlob.size > 4 * 1024 * 1024) {
            throw new Error("CLOUDFLARE_TTS_INVALID_AUDIO");
          }
          if (finished || controller.signal.aborted
            || playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) return;

          const voiceAudioContext = isLocalVoiceTurn ? voiceAudioContextRef.current : null;
          if (voiceAudioContext && voiceAudioContext.state !== "closed") {
            // In voice mode, decode the verified WAV into the already-unlocked
            // microphone AudioContext. This avoids HTMLMediaElement autoplay
            // and decoder failures after asynchronous TTS network requests.
            await ensureVoiceAudioContextRunning(voiceAudioContext);
            const decodedAudio = await voiceAudioContext.decodeAudioData(await audioBlob.arrayBuffer());
            if (finished || controller.signal.aborted
              || playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) return;
            const source = voiceAudioContext.createBufferSource();
            source.buffer = decodedAudio;
            source.connect(voiceAudioContext.destination);
            if (voiceAnalyserRef.current) source.connect(voiceAnalyserRef.current);
            audioBufferSource = source;
            const scheduledAt = Math.max(voiceAudioContext.currentTime + 0.02, voiceNextPlaybackTimeRef.current);
            source.onended = () => {
              if (finished || playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) return;
              source.onended = null;
              voiceAudioSourcesRef.current.delete(source);
              source.disconnect();
              source.buffer = null;
              if (audioBufferSource === source) audioBufferSource = null;
              requestController = null;
              chunkRetryCount = 0;
              rateLimitWaitCount = 0;
              if (prefetchTimer !== null) window.clearTimeout(prefetchTimer);
              prefetchTimer = null;
              chunkIndex += 1;
              void playFreeTtsChunk();
            };
            source.start(scheduledAt);
            didPlaybackStart = true;
            voiceAudioSourcesRef.current.add(source);
            schedulePrefetchNextTtsChunk(decodedAudio.duration);
            voicePlaybackOwnerRef.current = "tts";
            voiceNextPlaybackTimeRef.current = scheduledAt + decodedAudio.duration;
            setSpeakingIndex(index);
            setVoiceStatus("Orby está leyendo la respuesta…");
            voiceBrowserSpeechActiveRef.current = true;
            voiceLastAssistantOutputRef.current = clean;
            voiceLastAssistantOutputAtRef.current = Date.now();
            rememberVoiceAssistantOutput(clean);
            voiceLastAssistantPlaybackUntilRef.current = Date.now()
              + Math.max(0, voiceNextPlaybackTimeRef.current - voiceAudioContext.currentTime) * 1000
              + 1_800;
          } else {
            audioObjectUrl = URL.createObjectURL(audioBlob);
            audioElement = new Audio(audioObjectUrl);
            audioElement.preload = "auto";
            audioElement.onplay = () => {
              didPlaybackStart = true;
              schedulePrefetchNextTtsChunk(audioElement?.duration ?? 0);
              setSpeakingIndex(index);
              setVoiceStatus("Orby está leyendo la respuesta…");
              if (isLocalVoiceTurn) {
                voiceBrowserSpeechActiveRef.current = true;
                voiceLastAssistantOutputRef.current = clean;
                voiceLastAssistantOutputAtRef.current = Date.now();
                rememberVoiceAssistantOutput(clean);
                const duration = Number.isFinite(audioElement?.duration) ? audioElement?.duration ?? 0 : 0;
                voiceLastAssistantPlaybackUntilRef.current = Date.now()
                  + (duration > 0 ? duration * 1000 : clean.length * 58)
                  + 1_800;
              }
            };
            audioElement.onended = () => {
              if (finished || playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) return;
              clearAudioElement();
              requestController = null;
              chunkRetryCount = 0;
              rateLimitWaitCount = 0;
              chunkIndex += 1;
              void playFreeTtsChunk();
            };
            audioElement.onerror = () => {
              if (finished) return;
              recoverCurrentTtsChunk();
            };

            await audioElement.play();
            requestController = null;
          }
        } catch (error) {
          if (finished) return;
          if (controller.signal.aborted || playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) {
            finish(true);
            return;
          }
          console.warn("[Orby Voice] TTS chunk failed; retrying without dropping the remaining answer.", {
            chunk: chunkIndex + 1,
            totalChunks: chunks.length,
            retry: chunkRetryCount + 1,
            name: error instanceof Error ? error.name : "UnknownError",
          });
          recoverCurrentTtsChunk();
        }
      };

      // The full answer is read sequentially in endpoint-safe chunks.
      // If the overall deadline is reached, pause honestly instead of
      // implying that an incomplete reading finished.
      safetyTimer = window.setTimeout(() => {
        if (finished) return;
        finish(false);
        setVoiceError("La lectura superó el tiempo máximo de seguridad. No se ha recortado el texto: la respuesta completa sigue visible y puedes reiniciar la lectura.");
        setVoiceStatus("Lectura pausada · puedes reiniciarla desde el principio");
      }, Math.min(900_000, Math.max(30_000, clean.length * 110)));

      void playFreeTtsChunk();
    });
  }

  async function ensureVoiceConversation(startupSignal?: AbortSignal): Promise<string> {
    const existing = activeConversationRef.current ?? conversationId;
    if (existing) return existing;
    const response = await fetch("/api/orby/conversations", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      signal: startupSignal
        ? AbortSignal.any([startupSignal, AbortSignal.timeout(12_000)])
        : AbortSignal.timeout(12_000),
      body: JSON.stringify({ subject: activeSubjectRef.current, topic }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.conversation?.id) {
      throw new Error(payload.error || "No se pudo crear el chat de voz.");
    }
    const created = payload.conversation as Conversation;
    activeConversationRef.current = created.id;
    setConversationId(created.id);
    setConversations((current) => [created, ...current]);
    return created.id;
  }

  function stopVoicePlayback() {
    // Invalidate onended callbacks from chunks belonging to an interrupted turn.
    voiceSpeechPlaybackGenerationRef.current += 1;
    for (const source of voiceAudioSourcesRef.current) {
      source.onended = null;
      try { source.stop(); } catch { /* Audio chunk may already have ended. */ }
      source.disconnect();
      source.buffer = null;
    }
    voiceAudioSourcesRef.current.clear();
    if (voicePlaybackOwnerRef.current === "live") voicePlaybackOwnerRef.current = "none";
    const audioContext = voiceAudioContextRef.current;
    voiceNextPlaybackTimeRef.current = audioContext?.currentTime ?? 0;
    voiceSubtitlePlaybackStartRef.current = 0;
    voiceSubtitlePlaybackEndRef.current = 0;
    voiceSubtitleWordIndexRef.current = -1;
    setVoiceSubtitleWordIndex(-1);
    setVoiceSubtitlePlaybackActive(false);
  }

  function clearVoiceResponseWatchdog() {
    if (voiceResponseWatchdogRef.current !== null) {
      window.clearTimeout(voiceResponseWatchdogRef.current);
      voiceResponseWatchdogRef.current = null;
    }
    if (voiceResponseSlowNoticeRef.current !== null) {
      window.clearTimeout(voiceResponseSlowNoticeRef.current);
      voiceResponseSlowNoticeRef.current = null;
    }
  }

  function fallbackVoiceTurnToText(reason: string) {
    clearPendingOrbyTeachingBoard();
    clearVoiceResponseWatchdog();
    const pendingUserText = voiceUserTextRef.current.trim();
    const forcedPolicyReply = voiceForcedReplyRef.current ?? voicePreflightReplyRef.current;
    const shouldFallback = voiceModeRef.current && Boolean(pendingUserText) && !voiceResponseDoneRef.current;
    const appendUserMessage = !voiceUserMessageVisibleRef.current;

    if (!pendingUserText && voiceUnsupportedInputDetectedRef.current && voiceModeRef.current) {
      activateTurnBasedVoiceFallback(
        "Gemini Live no pudo reconocer el español. Cambié al modo de voz por turnos: vuelve a tocar el micrófono, habla y detén la grabación.",
      );
      setVoiceError("No pude reconocer la frase anterior. Puedes repetirla en español.");
      voiceUnsupportedInputDetectedRef.current = false;
      return;
    }

    if (forcedPolicyReply && shouldFallback) {
      voiceForcedReplyRef.current = null;
      voicePreflightReplyRef.current = null;
      voiceUnsupportedInputDetectedRef.current = false;
      activateTurnBasedVoiceFallback(
        "La sesión Live se interrumpió. Continúo con el tutor gratuito por turnos; la respuesta alternativa quedará escrita.",
      );
      respondToVoiceLocally(pendingUserText, forcedPolicyReply, appendUserMessage, true, false);
      return;
    }

    if (shouldFallback) {
      activateTurnBasedVoiceFallback(
        "La conexión en tiempo real se interrumpió. Continúo esta misma pregunta por turnos sin perder tu conversación.",
        pendingUserText,
        appendUserMessage,
      );
      return;
    }

    activateTurnBasedVoiceFallback(
      reason || "La voz en tiempo real no está disponible ahora. Puedes continuar por turnos sin perder tu conversación.",
    );
  }

  function armVoiceResponseWatchdog() {
    clearVoiceResponseWatchdog();
    // Report a slow turn early, then recover automatically if Live stops making
    // progress. Every transcript/audio/tool event rearms this inactivity timer.
    voiceResponseSlowNoticeRef.current = window.setTimeout(() => {
      voiceResponseSlowNoticeRef.current = null;
      if (voiceModeRef.current && waitingForVoiceReplyRef.current && !voiceResponseDoneRef.current) {
        setVoiceStatus("Orby está tardando más de lo normal. Sigo esperando tu respuesta…");
      }
    }, 5_000);
    voiceResponseWatchdogRef.current = window.setTimeout(() => {
      voiceResponseWatchdogRef.current = null;
      voiceResponseSlowNoticeRef.current = null;
      if (!voiceModeRef.current || !waitingForVoiceReplyRef.current || voiceResponseDoneRef.current) return;
      fallbackVoiceTurnToText(voiceChannelRef.current
        ? "Gemini Live dejó de enviar avances. Conservé tu pregunta y continuaré con el tutor gratuito por turnos."
        : "La conexión de voz se interrumpió. Conservé tu pregunta y continuaré con el tutor gratuito por turnos.");
    }, 15_000);
  }

  function stopRealtimeVoice(updateState = true, preserveAudioContext = false) {
    cancelPendingOrbyKnowledgeRequests();
    voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
    clearVoiceResponseWatchdog();
    voiceSessionGenerationRef.current += 1;
    voiceStartupAbortRef.current?.abort();
    voiceStartupAbortRef.current = null;
    voiceModeRef.current = false;
    setVoiceBoardDrawingActive(false);
    clearPendingOrbyTeachingBoard();
    voiceTeachingBoardRef.current = null;
    voiceBargeInPendingRef.current = false;
    voiceFallbackModeRef.current = false;
    setVoiceFallbackMode(false);
    voiceSpeechPlaybackGenerationRef.current += 1;
    voiceBrowserSpeechActiveRef.current = false;
    const cancelSpeech = voiceSpeechCancelRef.current;
    voiceSpeechCancelRef.current = null;
    cancelSpeech?.();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const liveSession = voiceChannelRef.current;
    voiceChannelRef.current = null;
    liveSession?.close();

    stopVoicePlayback();
    voiceWorkletNodeRef.current?.port.close();
    voiceWorkletNodeRef.current?.disconnect();
    voiceWorkletNodeRef.current = null;
    voiceMicSourceRef.current?.disconnect();
    voiceMicSourceRef.current = null;
    voiceAnalyserRef.current?.disconnect();
    voiceAnalyserRef.current = null;
    if (voiceAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(voiceAnimationFrameRef.current);
      voiceAnimationFrameRef.current = null;
    }
    voiceVisualLevelRef.current = 0;
    [voiceStageOrbRef.current, voiceMiniOrbRef.current].forEach((orb) => {
      if (!orb) return;
      orb.style.transform = "";
      orb.style.filter = "";
      orb.style.setProperty("--voice-level", "0");
    });
    voiceMuteGainRef.current?.disconnect();
    voiceMuteGainRef.current = null;

    const microphoneStream = voiceStreamRef.current;
    microphoneStream?.getTracks().forEach((track) => {
      // Detach callbacks before stopping tracks so a late device event cannot
      // mutate UI state after voice mode has already been torn down.
      track.onended = null;
      track.onmute = null;
      track.onunmute = null;
      track.stop();
    });
    voiceStreamRef.current = null;

    const audioContext = voiceAudioContextRef.current;
    if (!preserveAudioContext) {
      voiceAudioContextRef.current = null;
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close().catch(() => undefined);
      }
    }

    waitingForVoiceReplyRef.current = false;
    voicePendingStudentTurnRef.current = false;
    voiceUserMessageIdRef.current = null;
    voiceLocalReplyInFlightRef.current = false;
    if (updateState) {
      setVoiceMode(false);
      setVoiceMuted(false);
      setIsListening(false);
      setLiveTranscript("");
      setVoiceStatus("Conversación finalizada");
    }
  }

  function finishLocalVoiceReply(expectedMessageId?: string | null) {
    if (expectedMessageId && voiceAssistantMessageIdRef.current !== expectedMessageId) return;
    clearVoiceResponseWatchdog();
    voiceLocalReplyInFlightRef.current = false;
    voiceOutputAudioBlockedRef.current = false;
    waitingForVoiceReplyRef.current = false;
    voicePendingStudentTurnRef.current = false;
    voiceUserMessageIdRef.current = null;
    setVoiceStatus(voiceFallbackModeRef.current
      ? "Modo por turnos listo · toca el micrófono para hablar"
      : "Te escucho…");
    setIsListening(!voiceFallbackModeRef.current);
    void persistRealtimeTurnIfReady();
    drainPendingMessageQueue();
  }

  function requestLivePolicyReply(userText: string, reply: string, appendUserMessage: boolean, replaceAssistantMessage = false) {
    const cleanUserText = userText.trim().slice(0, MAX_VOICE_TRANSCRIPT_CHARS);
    const cleanReply = reply.trim();
    const channel = voiceChannelRef.current;
    if (!cleanUserText || !cleanReply || !voiceModeRef.current || !channel) {
      respondToVoiceLocally(userText, reply, appendUserMessage, replaceAssistantMessage);
      return;
    }

    clearVoiceResponseWatchdog();
    stopSpeaking();
    stopVoicePlayback();
    clearPendingGeminiAudioQueue();
    voiceRealtimeAudioChunkCountRef.current = 0;
    voiceOutputTranscriptValidatedRef.current = false;
    voiceOutputAudioBlockedRef.current = false;
    voiceLocalReplyInFlightRef.current = false;
    waitingForVoiceReplyRef.current = true;
    voicePendingStudentTurnRef.current = true;
    voiceUserTextRef.current = cleanUserText;
    voiceAssistantTextRef.current = "";
    const previousAssistantId = replaceAssistantMessage ? voiceAssistantMessageIdRef.current : null;
    const assistantId = previousAssistantId ?? ("voice-policy-" + Date.now());
    voiceAssistantMessageIdRef.current = assistantId;
    voiceForcedReplyRef.current = cleanReply;
    voicePreflightReplyRef.current = null;
    voiceInputPolicyRef.current = null;
    voiceResponseDoneRef.current = false;
    voiceTurnPersistedRef.current = false;
    voiceUserMessageVisibleRef.current = true;
    voiceLastCommittedInputRef.current = normalizeVoiceComparison(cleanUserText);
    voiceLastCommittedInputAtRef.current = Date.now();
    voiceLastCommittedActivityGenerationRef.current = voiceActivityGenerationRef.current;

    setMessages((current) => {
      const next = [
        ...current,
        ...(appendUserMessage ? [{
          id: "voice-user-" + Date.now(),
          role: "user" as const,
          content: cleanUserText,
        }] : []),
      ];
      const exists = next.some((message) => message.id === assistantId);
      return exists
        ? next.map((message) => message.id === assistantId
          ? { ...message, role: "assistant" as const, content: cleanReply }
          : message)
        : [...next, { id: assistantId, role: "assistant" as const, content: cleanReply }];
    });
    setInput("");
    setLiveTranscript("");
    setIsListening(false);
    setVoiceError("");
    setVoiceStatus("Orby está preparando la respuesta hablada…");
    armVoiceResponseWatchdog();

    // Ask the already-open Live session to speak only this trusted, deterministic
    // refusal. Its transcript must match this exact answer prefix before audio
    // is released; divergent or unsafe speech remains blocked by the normal gate.
    try {
      channel.sendClientContent({
        turns: [{
          role: "user",
          parts: [{
            text: [
              "El estudiante hizo una solicitud que está fuera del alcance educativo de PeakScore.",
              "No desarrolles, expliques ni ejecutes esa solicitud.",
              "Pronuncia en voz alta únicamente la siguiente respuesta autorizada, sin añadir introducciones ni comentarios:",
              cleanReply,
            ].join("\n"),
          }],
        }],
        turnComplete: true,
      });
    } catch (error) {
      voiceForcedReplyRef.current = null;
      console.warn("[Orby Voice] Could not request the validated Live policy reply.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      respondToVoiceLocally(cleanUserText, cleanReply, false, true);
    }
  }

  function respondToVoiceLocally(userText: string, reply: string, appendUserMessage: boolean, replaceAssistantMessage = false, speak = true) {
    const cleanUserText = userText.trim().slice(0, 1200);
    const cleanReply = reply.trim();
    if (!cleanUserText || !cleanReply || !voiceModeRef.current) return;

    clearVoiceResponseWatchdog();
    stopSpeaking();
    stopVoicePlayback();
    clearPendingGeminiAudioQueue();
    voiceRealtimeAudioChunkCountRef.current = 0;
    voiceOutputTranscriptValidatedRef.current = false;
    voiceOutputAudioBlockedRef.current = true;
    voiceLocalReplyInFlightRef.current = true;
    waitingForVoiceReplyRef.current = true;
    voicePendingStudentTurnRef.current = true;
    voiceUserTextRef.current = cleanUserText;
    voiceAssistantTextRef.current = cleanReply;
    const previousAssistantId = replaceAssistantMessage ? voiceAssistantMessageIdRef.current : null;
    const assistantId = previousAssistantId ?? ("voice-local-" + Date.now());
    voiceAssistantMessageIdRef.current = assistantId;
    const previousAssistantIndex = previousAssistantId
      ? messages.findIndex((message) => message.id === previousAssistantId)
      : -1;
    const assistantIndex = previousAssistantIndex >= 0
      ? previousAssistantIndex
      : messages.length + (appendUserMessage ? 1 : 0);
    voiceUserMessageVisibleRef.current = true;
    voiceResponseDoneRef.current = true;
    voiceTurnPersistedRef.current = false;
    voiceInputPolicyRef.current = null;
    voicePreflightReplyRef.current = null;
    voiceForcedReplyRef.current = null;
    voiceUnsupportedInputDetectedRef.current = false;
    voiceLastCommittedInputRef.current = normalizeVoiceComparison(cleanUserText);
    voiceLastCommittedInputAtRef.current = Date.now();
    voiceLastCommittedActivityGenerationRef.current = voiceActivityGenerationRef.current;

    setMessages((current) => {
      const hasExistingAssistant = Boolean(previousAssistantId)
        && current.some((message) => message.id === previousAssistantId);
      const next = [
        ...current,
        ...(appendUserMessage ? [{
          id: "voice-user-" + Date.now(),
          role: "user" as const,
          content: cleanUserText,
        }] : []),
      ];
      if (hasExistingAssistant && previousAssistantId) {
        return next.map((message) => message.id === previousAssistantId
          ? { ...message, role: "assistant" as const, content: cleanReply }
          : message);
      }
      return [...next, { id: assistantId, role: "assistant" as const, content: cleanReply }];
    });
    setInput("");
    setLiveTranscript("");
    setIsListening(false);
    setVoiceStatus("Orby está respondiendo…");

    // Interrupt an in-flight Live answer and append the exact local exchange
    // without requesting a new model response.
    try {
      voiceChannelRef.current?.sendClientContent({
        turns: [
          ...(appendUserMessage ? [{ role: "user" as const, parts: [{ text: cleanUserText }] }] : []),
          { role: "model", parts: [{ text: cleanReply }] },
        ],
        turnComplete: false,
      });
    } catch (error) {
      console.warn("[Orby Voice] Could not sync local reply to Live context.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }

    setVoiceError("");
    if (speak) {
      void speakText(cleanReply, assistantIndex);
    } else {
      // Live already failed to speak this trusted refusal. Keep it visible and
      // return to listening without spending another provider request.
      finishLocalVoiceReply(assistantId);
    }
  }

  function persistRealtimeTurnIfReady(): Promise<void> {
    const userContent = voiceUserTextRef.current.trim();
    const assistantContent = voiceAssistantTextRef.current.trim();
    const id = activeConversationRef.current;
    const assistantMessageId = voiceAssistantMessageIdRef.current;
    if (!voiceResponseDoneRef.current || !userContent || !assistantContent || !id || voiceTurnPersistedRef.current) {
      return Promise.resolve();
    }

    // Capture immutable turn data before the next voice turn resets its refs.
    const previousTurn = pendingVoicePersistenceRef.current;
    const turn = previousTurn
      && previousTurn.conversationId === id
      && previousTurn.userContent === userContent
      && previousTurn.assistantContent === assistantContent
      ? previousTurn
      : {
        conversationId: id,
        turnId: crypto.randomUUID(),
        userContent,
        assistantContent,
        ...(voiceTeachingBoardRef.current ? { board: voiceTeachingBoardRef.current } : {}),
      };
    pendingVoicePersistenceRef.current = turn;
    voiceTurnPersistedRef.current = true;
    const saveTask = voiceTurnPersistenceChainRef.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/orby/realtime-turn", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(12_000),
          body: JSON.stringify(turn),
        });
        const payload = await response.json().catch(() => ({})) as { error?: unknown; boardPersisted?: unknown; boardPersistenceWarning?: unknown };
        if (!response.ok) {
          throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo guardar el turno de voz.");
        }
        if (turn.board && payload.boardPersisted === false && assistantMessageId) {
          setMessages((current) => current.map((item) => item.id === assistantMessageId
            ? { ...item, boardPersistenceWarning: typeof payload.boardPersistenceWarning === "string"
              ? payload.boardPersistenceWarning
              : "La pizarra se muestra en esta sesión, pero todavía no puede guardarse en el historial. Falta aplicar la migración correspondiente de Supabase." }
            : item));
        }
      });
    voiceTurnPersistenceChainRef.current = saveTask
      .then(() => {
        setFailedVoiceTurn((current) => current?.conversationId === turn.conversationId
          && current.userContent === turn.userContent
          && current.assistantContent === turn.assistantContent
          ? null
          : current);
        if (pendingVoicePersistenceRef.current?.turnId === turn.turnId) {
          pendingVoicePersistenceRef.current = null;
        }
        setConversationError("");
        void refreshConversations().catch((caught: unknown) => {
          setConversationError(caught instanceof Error ? caught.message : "No se pudo actualizar el historial.");
        });
      })
      .catch((caught: unknown) => {
        // Release the persisted guard so the student can retry this immutable
        // exchange instead of permanently losing it after one transient failure.
        voiceTurnPersistedRef.current = false;
        setFailedVoiceTurn(turn);
        setConversationError(caught instanceof Error
          ? caught.message
          : "La respuesta se escuchó, pero no se pudo guardar el turno en el historial.");
      });
    return voiceTurnPersistenceChainRef.current;
  }

  async function retryFailedVoiceTurn() {
    const turn = failedVoiceTurn;
    if (!turn || voiceTurnRetryInFlightRef.current) return;
    voiceTurnRetryInFlightRef.current = true;
    setRetryingVoiceTurn(true);
    setConversationError("Reintentando guardar la conversación…");
    try {
      const response = await fetch("/api/orby/realtime-turn", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(12_000),
        body: JSON.stringify(turn),
      });
      const payload = await response.json().catch(() => ({})) as { error?: unknown };
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "No se pudo guardar el turno de voz.");
      }
      setFailedVoiceTurn((current) => current === turn ? null : current);
      if (pendingVoicePersistenceRef.current?.turnId === turn.turnId) {
        pendingVoicePersistenceRef.current = null;
      }
      setConversationError("");
      if (voiceUserTextRef.current.trim() === turn.userContent
        && voiceAssistantTextRef.current.trim() === turn.assistantContent) {
        voiceTurnPersistedRef.current = true;
      }
      await refreshConversations();
    } catch (caught) {
      setConversationError(caught instanceof Error
        ? caught.message
        : "No se pudo guardar el turno. La respuesta sigue disponible en pantalla.");
    } finally {
      voiceTurnRetryInFlightRef.current = false;
      setRetryingVoiceTurn(false);
    }
  }

  function pcmBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return window.btoa(binary);
  }

  function startVoiceVisualizer(analyser: AnalyserNode) {
    if (voiceAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(voiceAnimationFrameRef.current);
    }
    const samples = new Uint8Array(analyser.fftSize);
    const renderLevel = () => {
      if (!voiceModeRef.current || voiceAudioContextRef.current?.state === "closed") {
        voiceAnimationFrameRef.current = null;
        return;
      }
      analyser.getByteTimeDomainData(samples);
      let total = 0;
      for (let index = 0; index < samples.length; index += 1) {
        const amplitude = (samples[index] - 128) / 128;
        total += amplitude * amplitude;
      }
      const rms = Math.sqrt(total / samples.length);
      const target = Math.min(1, Math.max(0, (rms - 0.004) * 7.2));
      const previous = voiceVisualLevelRef.current;
      const smoothed = previous + (target - previous) * (target > previous ? 0.42 : 0.14);
      voiceVisualLevelRef.current = smoothed;

      [voiceStageOrbRef.current, voiceMiniOrbRef.current].forEach((orb) => {
        if (!orb) return;
        orb.style.setProperty("--voice-level", smoothed.toFixed(3));
        orb.style.transform = `scale(${1 + smoothed * 0.16})`;
        orb.style.filter = `brightness(${1 + smoothed * 0.34}) saturate(${1 + smoothed * 0.2})`;
      });
      voiceAnimationFrameRef.current = window.requestAnimationFrame(renderLevel);
    };
    renderLevel();
  }

  function finishRealtimeVoicePlayback() {
    if (!voiceResponseDoneRef.current || !waitingForVoiceReplyRef.current) return;
    if (voiceAudioSourcesRef.current.size > 0) {
      setVoiceStatus("Orby está hablando…");
      setIsListening(false);
      return;
    }
    if (voicePlaybackOwnerRef.current === "live") voicePlaybackOwnerRef.current = "none";
    setVoiceSubtitlePlaybackActive(false);
    waitingForVoiceReplyRef.current = false;
    voicePendingStudentTurnRef.current = false;
    if (!voiceListeningReadyLoggedRef.current && voiceTurnAcceptedAtRef.current > 0) {
      voiceListeningReadyLoggedRef.current = true;
      console.info("[Orby Voice] Ready for next student turn.", {
        fullConversationCycleMs: Math.round(performance.now() - voiceTurnAcceptedAtRef.current),
      });
    }
    setVoiceStatus("Te escucho…");
    setIsListening(true);
    void persistRealtimeTurnIfReady();
    drainPendingMessageQueue();
  }

  function clearPendingGeminiAudioQueue() {
    voicePendingAudioChunksRef.current = [];
    voicePendingAudioEncodedCharsRef.current = 0;
  }

  function flushPendingGeminiAudio() {
    if (voiceOutputAudioBlockedRef.current) {
      clearPendingGeminiAudioQueue();
      return;
    }
    if (!voiceOutputTranscriptValidatedRef.current) return;
    const pending = voicePendingAudioChunksRef.current;
    clearPendingGeminiAudioQueue();
    for (const chunk of pending) playGeminiAudio(chunk.data, chunk.mimeType);
  }

  function playGeminiAudio(base64Audio: string, mimeType?: string) {
    if (voicePlaybackOwnerRef.current === "tts") return;
    const audioContext = voiceAudioContextRef.current;
    if (!audioContext || audioContext.state === "closed") return;
    const playbackGeneration = voiceSpeechPlaybackGenerationRef.current;

    try {
      const binary = window.atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      if (bytes.byteLength % Int16Array.BYTES_PER_ELEMENT !== 0) {
        throw new Error("Invalid PCM16 audio chunk alignment.");
      }
      // Browsers may suspend Web Audio after tab backgrounding or device changes.
      if (audioContext.state === "suspended") void audioContext.resume().catch(() => undefined);
      const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Int16Array.BYTES_PER_ELEMENT);
      if (pcm.length === 0) return;

      const sampleRate = Number(mimeType?.match(/rate=([0-9]+)/i)?.[1]) || 24000;
      const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm.length; i += 1) channelData[i] = pcm[i] / 32768;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      if (voiceAnalyserRef.current) source.connect(voiceAnalyserRef.current);
      const scheduledAt = Math.max(audioContext.currentTime + 0.015, voiceNextPlaybackTimeRef.current);
      if (voiceRealtimeAudioChunkCountRef.current === 0) {
        voiceSubtitlePlaybackStartRef.current = scheduledAt;
        voiceSubtitleWordIndexRef.current = -1;
        setVoiceSubtitleWordIndex(-1);
      }
      source.start(scheduledAt);
      if (voiceRealtimeAudioChunkCountRef.current === 0) {
        if (!voiceFirstAudioLoggedRef.current && voiceTurnAcceptedAtRef.current > 0) {
          voiceFirstAudioLoggedRef.current = true;
          console.info("[Orby Voice] First audible response timing.", {
            firstAudioMs: Math.round(performance.now() - voiceTurnAcceptedAtRef.current),
          });
        }
        const spokenTranscript = voiceAssistantTextRef.current.trim();
        if (spokenTranscript) {
          voiceLastAssistantOutputRef.current = spokenTranscript;
          voiceLastAssistantOutputAtRef.current = Date.now();
          rememberVoiceAssistantOutput(spokenTranscript);
        }
      }
      voicePlaybackOwnerRef.current = "live";
      voiceNextPlaybackTimeRef.current = scheduledAt + audioBuffer.duration;
      voiceSubtitlePlaybackEndRef.current = voiceNextPlaybackTimeRef.current;
      setVoiceSubtitlePlaybackActive(true);
      voiceLastAssistantPlaybackUntilRef.current = Date.now()
        + Math.max(0, voiceNextPlaybackTimeRef.current - audioContext.currentTime) * 1000
        + 1_800;
      voiceAudioSourcesRef.current.add(source);
      voiceRealtimeAudioChunkCountRef.current += 1;
      source.onended = () => {
        voiceAudioSourcesRef.current.delete(source);
        source.onended = null;
        source.disconnect();
        source.buffer = null;
        // A stopped chunk from an older response must not finish or persist a
        // newer turn after a barge-in, fallback, or playback reset.
        if (playbackGeneration !== voiceSpeechPlaybackGenerationRef.current) return;
        if (voiceAudioSourcesRef.current.size === 0 && voicePlaybackOwnerRef.current === "live") {
          voicePlaybackOwnerRef.current = "none";
        }
        finishRealtimeVoicePlayback();
      };
    } catch {
      setVoiceError("No se pudo reproducir una parte de la respuesta de voz.");
    }
  }

  function clearPendingOrbyTeachingBoard() {
    if (voiceBoardSnapshotFlushRef.current !== null) {
      window.clearTimeout(voiceBoardSnapshotFlushRef.current);
      voiceBoardSnapshotFlushRef.current = null;
    }
    voicePendingBoardSnapshotsRef.current = [];
    voiceAwaitingInputTranscriptionRef.current = false;
    voiceInputPreflightAcceptedRef.current = false;
    voiceInputActivityStartedAtRef.current = 0;
  }

  function publishOrbyTeachingBoardSnapshot(board: OrbyBoardData) {
    setVoiceBoardDrawingActive(true);
    voiceTeachingBoardRef.current = board;
    const assistantId = voiceAssistantMessageIdRef.current ?? ("voice-" + Date.now());
    voiceAssistantMessageIdRef.current = assistantId;
    setMessages((current) => {
      const exists = current.some((message) => message.id === assistantId);
      return exists
        ? current.map((message) => message.id === assistantId ? { ...message, board } : message)
        : [...current, { id: assistantId, role: "assistant", content: voiceAssistantTextRef.current.trim(), board }];
    });
  }

  function flushPendingOrbyTeachingBoard() {
    const pendingSnapshots = voicePendingBoardSnapshotsRef.current;
    voicePendingBoardSnapshotsRef.current = [];
    voiceAwaitingInputTranscriptionRef.current = false;
    voiceInputActivityStartedAtRef.current = 0;
    if (voiceBoardSnapshotFlushRef.current !== null) {
      window.clearTimeout(voiceBoardSnapshotFlushRef.current);
      voiceBoardSnapshotFlushRef.current = null;
    }
    if (!pendingSnapshots.length) return;

    const isCurrentAcademicTurn = (pending: typeof pendingSnapshots[number]) =>
      Date.now() - pending.createdAt <= 15_000
      && pending.sessionGeneration === voiceSessionGenerationRef.current
      && pending.activityGeneration === voiceActivityGenerationRef.current
      && voiceInputPreflightAcceptedRef.current
      && voicePendingStudentTurnRef.current
      && Boolean(voiceUserTextRef.current.trim())
      && voiceInputPolicyRef.current === null
      && !voicePreflightReplyRef.current
      && !isOrbyGreetingRequest(voiceUserTextRef.current)
      && !getOrbySubjectSelectionLabel(voiceUserTextRef.current)
      && !voiceDiscardStaleLiveOutputRef.current
      && !voiceBargeInPendingRef.current;

    let nextIndex = 0;
    const publishNextSnapshot = () => {
      voiceBoardSnapshotFlushRef.current = null;
      const pending = pendingSnapshots[nextIndex];
      if (!pending) return;
      if (!isCurrentAcademicTurn(pending)) {
        nextIndex += 1;
        if (nextIndex < pendingSnapshots.length) {
          voiceBoardSnapshotFlushRef.current = window.setTimeout(publishNextSnapshot, 90);
        }
        return;
      }
      nextIndex += 1;
      publishOrbyTeachingBoardSnapshot(pending.board);
      if (nextIndex < pendingSnapshots.length) {
        // Let React paint each cumulative snapshot before the next one arrives.
        // The SVG pen timeline then animates only the newly added strokes.
        voiceBoardSnapshotFlushRef.current = window.setTimeout(publishNextSnapshot, 90);
      }
    };
    publishNextSnapshot();
  }

  function handleOrbyLiveTeachingBoardTool(toolCall: unknown) {
    const session = voiceChannelRef.current;
    if (!session || !toolCall || typeof toolCall !== "object") return;
    const sessionGeneration = voiceSessionGenerationRef.current;
    const activityGeneration = voiceActivityGenerationRef.current;
    const isCurrent = () => voiceChannelRef.current === session
      && voiceSessionGenerationRef.current === sessionGeneration
      && voiceActivityGenerationRef.current === activityGeneration;
    const calls = (toolCall as { functionCalls?: unknown }).functionCalls;
    if (!Array.isArray(calls)) return;
    const responses: Array<{ id: string; name: string; response: Record<string, unknown>; scheduling: FunctionResponseScheduling }> = [];
    let acceptedSnapshotInEvent = false;

    // One cumulative snapshot per Live event keeps the teacher-like drawing stages visible.
    for (const raw of calls.slice(0, 3)) {
      if (!raw || typeof raw !== "object") continue;
      const call = raw as { id?: unknown; name?: unknown; args?: unknown };
      if (call.name !== "render_orby_teaching_board" || typeof call.id !== "string" || !call.id) continue;
      let args: unknown = call.args;
      if (typeof args === "string") {
        try { args = JSON.parse(args); } catch { args = null; }
      }
      const snapshot = sanitizeOrbyBoard(args);
      if (!isCurrent()) return;
      const boardLimitReached = voiceBoardUpdateCountRef.current >= MAX_ORBY_LIVE_BOARD_UPDATES_PER_TURN;
      const activeAcademicTurn = voicePendingStudentTurnRef.current
        && Boolean(voiceUserTextRef.current.trim())
        && voiceInputPreflightAcceptedRef.current
        && voiceInputPolicyRef.current === null
        && !voicePreflightReplyRef.current
        && !isOrbyGreetingRequest(voiceUserTextRef.current)
        && !getOrbySubjectSelectionLabel(voiceUserTextRef.current)
        && !voiceResponseDoneRef.current
        && !voiceDiscardStaleLiveOutputRef.current
        && !voiceBargeInPendingRef.current;
      const canStageBeforeFinalTranscript = voiceAwaitingInputTranscriptionRef.current
        && voiceInputActivityStartedAtRef.current > 0
        && Date.now() - voiceInputActivityStartedAtRef.current <= 15_000
        && !voiceResponseDoneRef.current
        && !voiceDiscardStaleLiveOutputRef.current
        && !voiceBargeInPendingRef.current;

      if (!snapshot || boardLimitReached || acceptedSnapshotInEvent
        || (!activeAcademicTurn && !canStageBeforeFinalTranscript)) {
        const reason = !snapshot
          ? "El esquema no pasó la validación visual."
          : boardLimitReached
            ? "Se alcanzó el límite de ocho actualizaciones visuales de este turno."
            : acceptedSnapshotInEvent
              ? "Envía una sola actualización de pizarra por evento."
              : "No hay una pregunta académica validada para esta pizarra.";
        responses.push({
          id: call.id,
          name: "render_orby_teaching_board",
          response: { accepted: false, status: "rejected", retryable: true, reason },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT,
        });
        continue;
      }

      acceptedSnapshotInEvent = true;
      voiceBoardUpdateCountRef.current += 1;
      if (activeAcademicTurn) {
        // Render accepted snapshots immediately. Audio transcript matching is
        // intentionally not part of the drawing path: it is lossy, delayed and
        // can arrive after the complete spoken turn.
        publishOrbyTeachingBoardSnapshot(snapshot);
        responses.push({
          id: call.id,
          name: "render_orby_teaching_board",
          response: {
            accepted: true,
            status: "rendered",
            retryable: false,
            turnGeneration: activityGeneration,
            guidance: "Pizarra visible y actualizada. Usa exactamente este turnGeneration en cada acción append del turno. Continúa hablando con naturalidad; añade la siguiente etapa acumulativa cuando cambie la idea."
          },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT,
        });
      } else {
        voicePendingBoardSnapshotsRef.current.push({
          board: snapshot,
          sessionGeneration,
          activityGeneration,
          createdAt: Date.now(),
        });
        responses.push({
          id: call.id,
          name: "render_orby_teaching_board",
          response: {
            accepted: true,
            status: "queued_for_input_validation",
            retryable: false,
            turnGeneration: activityGeneration,
            guidance: "Instantánea recibida. Usa exactamente este turnGeneration para las acciones append de este turno. Continúa la explicación oral; no repitas el dibujo. Se mostrará al validar la pregunta.",
          },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT,
        });
      }

      console.info("[Orby Voice] Teaching board update timing.", {
        updateNumber: voiceBoardUpdateCountRef.current,
        boardUpdateMs: voiceTurnAcceptedAtRef.current > 0
          ? Math.round(performance.now() - voiceTurnAcceptedAtRef.current)
          : null,
        audioChunksScheduled: voiceRealtimeAudioChunkCountRef.current,
      });
    }
    if (!isCurrent() || !responses.length) return;
    try {
      (session as unknown as { sendToolResponse: (payload: { functionResponses: typeof responses }) => void })
        .sendToolResponse({ functionResponses: responses });
    } catch (error) {
      console.error("[Orby Voice] Teaching board tool response failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  function handleOrbyLiveBoardActionTool(toolCall: unknown) {
    const session = voiceChannelRef.current;
    if (!session || !toolCall || typeof toolCall !== "object") return;
    const sessionGeneration = voiceSessionGenerationRef.current;
    const activityGeneration = voiceActivityGenerationRef.current;
    const isCurrent = () => voiceChannelRef.current === session
      && voiceSessionGenerationRef.current === sessionGeneration
      && voiceActivityGenerationRef.current === activityGeneration;
    const calls = (toolCall as { functionCalls?: unknown }).functionCalls;
    if (!Array.isArray(calls)) return;
    const responses: Array<{ id: string; name: string; response: Record<string, unknown>; scheduling: FunctionResponseScheduling }> = [];
    let acceptedActionInEvent = false;
    for (const raw of calls.slice(0, 3)) {
      if (!raw || typeof raw !== "object") continue;
      const call = raw as { id?: unknown; name?: unknown; args?: unknown };
      if (call.name !== "apply_orby_board_action" || typeof call.id !== "string" || !call.id) continue;
      let args: unknown = call.args;
      if (typeof args === "string") {
        try { args = JSON.parse(args); } catch { args = null; }
      }
      const action = sanitizeOrbyBoardAction(args);
      const sequenceCheck = action
        ? evaluateOrbyBoardActionSequence(voiceBoardActionSequenceRef.current, action, activityGeneration)
        : null;
      const pendingBoardSnapshot = voicePendingBoardSnapshotsRef.current.at(-1) ?? null;
      const currentBoard = voiceTeachingBoardRef.current ?? pendingBoardSnapshot?.board ?? null;
      const activeAcademicTurn = voicePendingStudentTurnRef.current
        && Boolean(voiceUserTextRef.current.trim())
        && voiceInputPreflightAcceptedRef.current
        && voiceInputPolicyRef.current === null
        && !voicePreflightReplyRef.current
        && !isOrbyGreetingRequest(voiceUserTextRef.current)
        && !getOrbySubjectSelectionLabel(voiceUserTextRef.current)
        && !voiceResponseDoneRef.current
        && !voiceDiscardStaleLiveOutputRef.current
        && !voiceBargeInPendingRef.current;
      const canStageBeforeFinalTranscript = voiceAwaitingInputTranscriptionRef.current
        && pendingBoardSnapshot !== null
        && pendingBoardSnapshot.sessionGeneration === sessionGeneration
        && pendingBoardSnapshot.activityGeneration === activityGeneration
        && Date.now() - pendingBoardSnapshot.createdAt <= 15_000
        && voiceInputActivityStartedAtRef.current > 0
        && Date.now() - voiceInputActivityStartedAtRef.current <= 15_000
        && !voiceResponseDoneRef.current
        && !voiceDiscardStaleLiveOutputRef.current
        && !voiceBargeInPendingRef.current;
      const allowedTurn = activeAcademicTurn || (canStageBeforeFinalTranscript && Boolean(pendingBoardSnapshot));
      if (!action || !sequenceCheck || !sequenceCheck.accepted || !currentBoard || !allowedTurn
        || acceptedActionInEvent
        || voiceBoardUpdateCountRef.current >= MAX_ORBY_LIVE_BOARD_UPDATES_PER_TURN) {
        const reason = !action || !sequenceCheck ? "La operación de pizarra no pasó la validación."
          : !sequenceCheck.accepted
            ? sequenceCheck.reason === "wrong_generation" ? "La acción pertenece a una clase anterior; crea una acción nueva para el turno activo."
              : sequenceCheck.reason === "duplicate" ? "La acción ya fue aplicada; no la repitas."
                : sequenceCheck.reason === "dependency_not_applied" ? "Primero envía la acción de la que depende este paso."
                  : "La secuencia debe ser creciente dentro de la clase activa."
            : !currentBoard ? "Todavía no existe una pizarra activa."
              : !allowedTurn ? "No hay una pregunta académica activa ni una pizarra provisional válida para modificar."
                : acceptedActionInEvent ? "Envía una sola operación por evento."
                  : "Se alcanzó el límite de ocho operaciones visuales de este turno.";
        responses.push({ id: call.id, name: "apply_orby_board_action",
          response: { accepted: false, status: "rejected", retryable: false, reason },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT });
        continue;
      }
      const updatedBoard = applyOrbyBoardAction(currentBoard, action);
      if (!updatedBoard) {
        responses.push({ id: call.id, name: "apply_orby_board_action",
          response: { accepted: false, status: "rejected", retryable: false, reason: "El ID indicado no existe en la tinta visible." },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT });
        continue;
      }
      if (!isCurrent()) return;
      acceptedActionInEvent = true;
      voiceBoardActionSequenceRef.current = sequenceCheck.nextState;
      voiceBoardUpdateCountRef.current += 1;
      if (activeAcademicTurn) {
        publishOrbyTeachingBoardSnapshot(updatedBoard);
      } else if (pendingBoardSnapshot && canStageBeforeFinalTranscript
        && pendingBoardSnapshot.sessionGeneration === sessionGeneration
        && pendingBoardSnapshot.activityGeneration === activityGeneration
        && Date.now() - pendingBoardSnapshot.createdAt <= 15_000) {
        // Keep early actions attached to the provisional board. The complete
        // composition is published only after the student's input passes preflight.
        const pendingSnapshots = voicePendingBoardSnapshotsRef.current;
        if (pendingSnapshots.length) {
          pendingSnapshots[pendingSnapshots.length - 1] = { ...pendingBoardSnapshot, board: updatedBoard };
        }
      } else {
        return;
      }
      responses.push({ id: call.id, name: "apply_orby_board_action",
        response: { accepted: true, status: "applied", retryable: false,
          guidance: action.operation === "focus" ? "Elemento señalado. Continúa explicándolo sin redibujarlo."
            : action.operation === "erase" ? "Trazos seleccionados eliminados. Continúa la explicación."
              : action.operation === "replace" ? "Trazo corregido conservando su ID. Continúa la explicación."
                : action.operation === "append-block" ? "Texto escrito en la pizarra. Continúa explicándolo mientras aparece."
                  : "Trazos nuevos añadidos al dibujo existente. Continúa la explicación." },
        scheduling: voiceSdkRef.current!.FunctionResponseScheduling.SILENT });
    }
    if (!isCurrent() || !responses.length) return;
    try {
      (session as unknown as { sendToolResponse: (payload: { functionResponses: typeof responses }) => void })
        .sendToolResponse({ functionResponses: responses });
    } catch (error) {
      console.error("[Orby Voice] Board action response failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  async function handleOrbyLiveKnowledgeTool(toolCall: unknown) {
    const session = voiceChannelRef.current;
    if (!session || !toolCall || typeof toolCall !== "object") return;
    // A knowledge lookup belongs only to the Live session and student turn
    // that requested it. Barge-in, a new student activity, or reconnection
    // invalidates the result so old material cannot leak into a newer answer.
    const sessionGeneration = voiceSessionGenerationRef.current;
    const activityGeneration = voiceActivityGenerationRef.current;
    const isCurrentToolTurn = () =>
      voiceChannelRef.current === session
      && voiceSessionGenerationRef.current === sessionGeneration
      && voiceActivityGenerationRef.current === activityGeneration;

    const calls = (toolCall as { functionCalls?: unknown }).functionCalls;
    if (!Array.isArray(calls) || calls.length === 0) return;
    const validCalls = calls.slice(0, 3).filter((rawCall) => {
      if (!rawCall || typeof rawCall !== "object") return false;
      const call = rawCall as { id?: unknown; name?: unknown };
      return typeof call.id === "string" && Boolean(call.id) && typeof call.name === "string" && Boolean(call.name);
    }) as Array<{ id: string; name: string; args?: unknown }>;
    if (!validCalls.length) return;
    const currentToolTurn = voiceKnowledgeToolTurnRef.current;
    const remainingToolCalls = Math.max(0, MAX_ORBY_VOICE_TOOL_CALLS_PER_TURN - currentToolTurn.toolCallsStarted);
    const acceptedToolCalls = Math.min(validCalls.length, remainingToolCalls);
    if (acceptedToolCalls > 0) {
      voiceKnowledgeToolTurnRef.current = beginOrbyVoiceToolTurn(currentToolTurn, acceptedToolCalls);
    }

    // Register every accepted request before the first await. Gemini can cancel
    // sibling calls while the first fetch is still pending; registering lazily
    // inside the sequential loop leaves later siblings invisible to cancellation.
    const requestControllersById = new Map<string, AbortController>();
    for (const call of validCalls.slice(0, acceptedToolCalls)) {
      if (call.name !== "search_orby_learning_knowledge") continue;
      const controller = new AbortController();
      cancelPendingOrbyKnowledgeRequests([call.id]);
      requestControllersById.set(call.id, controller);
      voiceKnowledgeRequestsRef.current.set(call.id, controller);
    }
    const cleanupToolRequestControllers = () => {
      for (const [pendingId, pendingController] of requestControllersById) {
        if (voiceKnowledgeRequestsRef.current.get(pendingId) === pendingController) {
          voiceKnowledgeRequestsRef.current.delete(pendingId);
        }
        if (!pendingController.signal.aborted) pendingController.abort();
      }
    };

    setVoiceStatus("Orby está consultando conocimiento académico…");
    const responses: Array<{ id: string; name: string; response: Record<string, unknown>; scheduling: FunctionResponseScheduling }> = [];

    for (const [callIndex, call] of validCalls.entries()) {
      const { id, name } = call;
      if (callIndex >= acceptedToolCalls) {
        responses.push({
          id,
          name,
          response: {
            found: false,
            guidance: "Ya se alcanzó el límite de consultas de conocimiento para esta pregunta. Continúa con la explicación usando la evidencia disponible; no repitas la búsqueda.",
          },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE,
        });
        continue;
      }

      if (name !== "search_orby_learning_knowledge") {
        responses.push({ id, name, response: { error: "Herramienta no disponible." }, scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE });
        continue;
      }

      let args: Record<string, unknown> = {};
      if (call.args && typeof call.args === "object" && !Array.isArray(call.args)) {
        args = call.args as Record<string, unknown>;
      } else if (typeof call.args === "string") {
        try {
          const parsed = JSON.parse(call.args);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) args = parsed as Record<string, unknown>;
        } catch {
          args = {};
        }
      }

      const toolQuery = typeof args.query === "string" ? args.query.trim().slice(0, 1600) : "";
      if (toolQuery.length < 3) {
        const unusedController = requestControllersById.get(id);
        if (unusedController) {
          if (voiceKnowledgeRequestsRef.current.get(id) === unusedController) voiceKnowledgeRequestsRef.current.delete(id);
          unusedController.abort();
        }
        responses.push({ id, name, response: { found: false, error: "No se recibió un tema académico claro." }, scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE });
        continue;
      }

      // The model is instructed to send the complete current question.
      // Never append voiceUserTextRef here: it can still contain a previous
      // interim/final transcript during tool hand-off and contaminate retrieval
      // with an unrelated topic or a subject the student has already left.
      const query = toolQuery.slice(0, 2000);
      const requestedSubject = typeof args.subject === "string" ? args.subject.slice(0, 80) : activeSubjectRef.current;
      const requestController = requestControllersById.get(id);
      if (!requestController) continue;

      try {
        const response = await fetch("/api/orby/knowledge-search", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.any([requestController.signal, AbortSignal.timeout(12_000)]),
          body: JSON.stringify({ query, subject: requestedSubject }),
        });
        const result = await response.json().catch(() => ({}));
        if (!isCurrentToolTurn()) {
          cleanupToolRequestControllers();
          return;
        }
        // A cancelled sibling lookup must not discard other still-valid calls
        // from the same Live tool batch. Skip only this result and continue.
        if (requestController.signal.aborted) continue;
        if (!response.ok) {
          // Retrieval is optional: provider credentials, empty Lab content or
          // temporary search failures must never leak infrastructure details
          // into the student's lesson or hold the Live teaching turn hostage.
          console.warn("[Orby Voice] Optional knowledge lookup unavailable.", {
            status: response.status,
            code: typeof result.code === "string" ? result.code.slice(0, 64) : undefined,
          });
          responses.push({
            id,
            name,
            response: {
              found: false,
              guidance: "La biblioteca de apoyo no está disponible en este momento. Continúa la explicación directamente con conocimiento académico fiable, sin mencionar errores técnicos ni afirmar que consultaste material.",
            },
            scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE,
          });
          continue;
        }

        const publicSourceCandidates = Array.isArray(result.public_sources) ? result.public_sources.slice(0, 4) : [];
        const safePublicSources: OrbyPublicSource[] = [];
        for (const candidate of publicSourceCandidates) {
          if (!candidate || typeof candidate !== "object") continue;
          const source = candidate as Record<string, unknown>;
          if (typeof source.title !== "string" || typeof source.url !== "string"
            || typeof source.publisher !== "string"
            || (source.publishedAt !== null && typeof source.publishedAt !== "string")
            || (source.kind !== "encyclopedia" && source.kind !== "research")) continue;
          try {
            const parsedUrl = new URL(source.url);
            if (parsedUrl.protocol !== "https:"
              || !["es.wikipedia.org", "doi.org", "openalex.org"].includes(parsedUrl.hostname.toLowerCase())) continue;
            safePublicSources.push({
              title: source.title.slice(0, 220),
              url: parsedUrl.toString(),
              publisher: source.publisher.slice(0, 140),
              publishedAt: source.publishedAt as string | null,
              kind: source.kind,
              citationNumber: safePublicSources.length + 1,
            });
          } catch {
            // Ignore malformed public URLs; only safe HTTPS references reach the transcript UI.
          }
        }
        if (safePublicSources.length) {
          const mergedSources = new Map<string, OrbyPublicSource>();
          for (const source of [...voicePublicSourcesRef.current, ...safePublicSources]) {
            mergedSources.set(source.url, source);
          }
          voicePublicSourcesRef.current = [...mergedSources.values()]
            .slice(0, 4)
            .map((source, index) => ({ ...source, citationNumber: index + 1 }));
        }

        responses.push({
          id,
          name,
          response: {
            found: result.found === true,
            subject: typeof result.subject === "string" ? result.subject : requestedSubject,
            excerpts: Array.isArray(result.excerpts) ? result.excerpts.slice(0, 6) : [],
            concepts: Array.isArray(result.concepts) ? result.concepts.slice(0, 24) : [],
            profiles: Array.isArray(result.profiles) ? result.profiles.slice(0, 4) : [],
            related: Array.isArray(result.related) ? result.related.slice(0, 3) : [],
            public_sources: voicePublicSourcesRef.current,
            public_research_found: result.public_research_found === true,
            guidance: typeof result.guidance === "string" ? result.guidance.slice(0, 700) : "",
          },
          scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE,
        });
      } catch {
        if (!requestController.signal.aborted && isCurrentToolTurn()) {
          responses.push({
            id,
            name,
            response: { found: false, guidance: "La búsqueda no estuvo disponible en este turno. Continúa con una explicación académica segura y no inventes que consultaste fuentes." },
            scheduling: voiceSdkRef.current!.FunctionResponseScheduling.WHEN_IDLE,
          });
        }
      } finally {
        if (voiceKnowledgeRequestsRef.current.get(id) === requestController) {
          voiceKnowledgeRequestsRef.current.delete(id);
        }
      }
    }

    try {
      // Recheck immediately before delivery: an older async lookup must never
      // answer a newer turn or send tool output into a replaced socket.
      if (!isCurrentToolTurn()) {
        cleanupToolRequestControllers();
        return;
      }
      const toolSession = session as unknown as {
        sendToolResponse: (payload: {
          functionResponses: Array<{ id: string; name: string; response: Record<string, unknown>; scheduling: FunctionResponseScheduling }>;
        }) => void;
      };
      if (responses.length) {
        // The non-blocking result is queued for the moment Live becomes idle.
        // Keep the current student turn open until the follow-up output arrives.
        voiceKnowledgeToolTurnRef.current = markOrbyVoiceToolResponseSent(voiceKnowledgeToolTurnRef.current);
        toolSession.sendToolResponse({ functionResponses: responses });
      }
      setVoiceStatus("Orby está incorporando el material a tu explicación…");
    } catch (error) {
      console.error("[Orby Voice] Tool response could not be sent.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
      if (isCurrentToolTurn()) {
        fallbackVoiceTurnToText("No pude incorporar el material del Lab en esta respuesta. Conservo tu pregunta y continúo con el tutor gratuito.");
      } else {
        setVoiceError("Orby no pudo incorporar el material en este turno. Puedes repetir la pregunta.");
        setVoiceStatus("Consulta académica interrumpida");
      }
    }
  }

  function upsertVoiceUserMessage(value: string) {
    const content = value.trim().slice(0, MAX_VOICE_TRANSCRIPT_CHARS);
    if (!content) return;
    const id = voiceUserMessageIdRef.current ?? ("voice-user-" + Date.now());
    voiceUserMessageIdRef.current = id;
    voiceUserMessageVisibleRef.current = true;
    setMessages((current) => {
      const existingIndex = current.findIndex((item) => item.id === id);
      if (existingIndex >= 0) {
        return current.map((item) => item.id === id
          ? { ...item, role: "user" as const, content }
          : item);
      }
      const assistantId = voiceAssistantMessageIdRef.current;
      const assistantIndex = assistantId
        ? current.findIndex((item) => item.id === assistantId)
        : -1;
      const userMessage: Message = { id, role: "user", content };
      if (assistantIndex < 0) return [...current, userMessage];
      const next = [...current];
      next.splice(assistantIndex, 0, userMessage);
      return next;
    });
  }

  function handleGeminiLiveEvent(event: Record<string, unknown>) {
    if (event.setupComplete) {
      setVoiceStatus("Te escucho…");
      setIsListening(true);
      return;
    }

    const voiceActivity = event.voiceActivity && typeof event.voiceActivity === "object"
      ? event.voiceActivity as { type?: unknown }
      : null;
    if (voiceActivity?.type === "ACTIVITY_START") {
      const assistantAudioInFlight = voiceBrowserSpeechActiveRef.current
        || voiceAudioSourcesRef.current.size > 0
        || (voiceAudioContextRef.current?.currentTime ?? 0) < voiceNextPlaybackTimeRef.current;
      if (assistantAudioInFlight) {
        // Speaker echo must not start a fresh student turn or cancel the
        // response watchdog while Orby is still speaking.
        setVoiceStatus("Orby está hablando…");
      } else {
        setVoiceBoardDrawingActive(false);
        cancelPendingOrbyKnowledgeRequests();
        clearVoiceResponseWatchdog();
        // A new microphone activity can arrive before Live has produced its
        // first validated sentence/audio. In that window the old partial
        // transcript may already be visible even though playback is not active.
        // Remove only that unfinished bubble before resetting its refs; otherwise
        // it survives as an orphaned, truncated assistant message in the chat.
        const hasUnfinishedLiveGeneration = !voiceResponseDoneRef.current
          && Boolean(voiceAssistantMessageIdRef.current || voiceAssistantTextRef.current.trim());
        const unfinishedAssistantId = hasUnfinishedLiveGeneration
          ? voiceAssistantMessageIdRef.current
          : null;
        if (unfinishedAssistantId) {
          setMessages((current) => current.filter((message) => message.id !== unfinishedAssistantId));
        }
        // Live may deliver the previous generation's final transcript after
        // mic ACTIVITY_START but before its interruption event. Keep a one-
        // generation discard guard so late output cannot answer the next question.
        if (hasUnfinishedLiveGeneration && voiceChannelRef.current) {
          voiceDiscardStaleLiveOutputRef.current = true;
          voiceBargeInPendingRef.current = true;
        }
        if (voiceResponseDoneRef.current) void persistRealtimeTurnIfReady();
        voiceActivityGenerationRef.current += 1;
        voiceBoardActionSequenceRef.current = createOrbyBoardActionSequenceState(voiceActivityGenerationRef.current);
        clearPendingOrbyTeachingBoard();
        voiceAwaitingInputTranscriptionRef.current = true;
        voiceInputPreflightAcceptedRef.current = false;
        voiceInputActivityStartedAtRef.current = Date.now();
        voiceBoardUpdateCountRef.current = 0;
        voiceLastCommittedActivityGenerationRef.current = -1;
        voiceLastCommittedInputRef.current = "";
        voiceLastCommittedInputAtRef.current = 0;
        voiceUserMessageIdRef.current = null;
        voicePendingStudentTurnRef.current = false;
        voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
        voiceLocalReplyInFlightRef.current = false;
        voiceUserTextRef.current = "";
        voiceUnsupportedInputDetectedRef.current = false;
        voiceUserMessageVisibleRef.current = false;
        voiceAssistantTextRef.current = "";
        voiceAssistantMessageIdRef.current = null;
        voiceTeachingBoardRef.current = null;
        voicePublicSourcesRef.current = [];
        voiceResponseDoneRef.current = false;
        voiceTurnPersistedRef.current = false;
        voiceInputPolicyRef.current = null;
        voiceForcedReplyRef.current = null;
        voicePreflightReplyRef.current = null;
        stopVoicePlayback();
        voiceSpeechPlaybackGenerationRef.current += 1;
        voiceBrowserSpeechActiveRef.current = false;
        const cancelSpeech = voiceSpeechCancelRef.current;
        voiceSpeechCancelRef.current = null;
        cancelSpeech?.();
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        clearPendingGeminiAudioQueue();
        voiceRealtimeAudioChunkCountRef.current = 0;
        voiceOutputTranscriptValidatedRef.current = false;
        voiceOutputAudioBlockedRef.current = false;
        setIsListening(true);
        setVoiceStatus("Te escucho…");
      }
    } else if (voiceActivity?.type === "ACTIVITY_END") {
      // While local TTS is active, this is usually the mic hearing Orby's
      // speaker output. A real barge-in is handled by a non-echo interim.
      if (!voiceBrowserSpeechActiveRef.current
        && voiceAudioSourcesRef.current.size === 0) {
        waitingForVoiceReplyRef.current = true;
        setIsListening(false);
        setVoiceStatus("Procesando lo que dijiste…");
        armVoiceResponseWatchdog();
      }
    }

    const serverContent = event.serverContent && typeof event.serverContent === "object"
      ? event.serverContent as Record<string, unknown>
      : {};
    // A typed barge-in can be followed by late output from the previous Live
    // generation before the server delivers its `interrupted` event. Suppress
    // that output immediately; the interrupted event then clears the guard.
    let discardInterruptedGenerationOutput = voiceDiscardStaleLiveOutputRef.current
      || Boolean(voiceBargeInPendingRef.current && voicePendingStudentTurnRef.current);

    const interimInput = serverContent.interimInputTranscription && typeof serverContent.interimInputTranscription === "object"
      ? serverContent.interimInputTranscription as { text?: unknown }
      : null;
    if (typeof interimInput?.text === "string") {
      const interimText = interimInput.text.slice(0, MAX_VOICE_TRANSCRIPT_CHARS);
      const unsupportedInterimScript = containsUnsupportedSpanishLanguage(interimText);
      voiceUnsupportedInputDetectedRef.current = unsupportedInterimScript;
      setLiveTranscript(unsupportedInterimScript ? "" : interimText);
      const assistantAudioInFlight = voiceBrowserSpeechActiveRef.current
        || voiceAudioSourcesRef.current.size > 0
        || (voiceAudioContextRef.current?.currentTime ?? 0) < voiceNextPlaybackTimeRef.current;
      const assistantPlaybackTail = Date.now() <= voiceLastAssistantPlaybackUntilRef.current;
      const recentAssistantOutput = Date.now() - voiceLastAssistantOutputAtRef.current < 3_000;
      const assistantSpeech = getRecentVoiceAssistantOutputs();
      const interimLength = normalizeVoiceComparison(interimText).length;
      const interimIsEcho = (assistantAudioInFlight || (assistantPlaybackTail && interimLength >= 8)
        || (recentAssistantOutput && interimLength >= 18))
        && isLikelyVoicePlaybackEcho(interimText, assistantSpeech);
      if (!unsupportedInterimScript && interimIsEcho) {
        // Ignore playback feedback and only a very short acoustic tail.
        setLiveTranscript("");
      } else if (!unsupportedInterimScript && assistantAudioInFlight) {
        if (isStrongVoiceBargeIn(interimText, assistantSpeech)) {
          interruptCurrentVoiceOutput();
          voiceAwaitingInputTranscriptionRef.current = true;
          voiceInputPreflightAcceptedRef.current = false;
          voiceInputActivityStartedAtRef.current = Date.now();
          voicePendingStudentTurnRef.current = true;
          voiceUserTextRef.current = interimText;
          upsertVoiceUserMessage(interimText);
          setLiveTranscript(interimText);
          setVoiceStatus("Te escucho…");
        } else {
          // Weak fragments while the speaker is active are usually echo/VAD noise.
          setLiveTranscript("");
          setVoiceStatus("Orby está hablando…");
        }
      } else if (!unsupportedInterimScript) {
        // Once playback ends, accept short confirmations and follow-ups normally.
        const previousInterim = voiceUserTextRef.current.trim();
        voiceUserTextRef.current = mergeLiveTranscript(previousInterim, interimText);
        if (voiceUserTextRef.current.trim()) {
          if (!voiceAwaitingInputTranscriptionRef.current) {
            voiceAwaitingInputTranscriptionRef.current = true;
            voiceInputPreflightAcceptedRef.current = false;
            voiceInputActivityStartedAtRef.current = Date.now();
          }
          voicePendingStudentTurnRef.current = true;
          upsertVoiceUserMessage(voiceUserTextRef.current);
        }
        setVoiceStatus("Te escucho…");
      } else {
        setVoiceStatus("Verificando el audio en español…");
      }
    }

    const inputTranscript = serverContent.inputTranscription && typeof serverContent.inputTranscription === "object"
      ? serverContent.inputTranscription as { text?: unknown }
      : null;
    const rawTranscript = typeof inputTranscript?.text === "string" ? inputTranscript.text.trim().slice(0, MAX_VOICE_TRANSCRIPT_CHARS) : "";
    const unsupportedInputScript = Boolean(rawTranscript && containsUnsupportedSpanishLanguage(rawTranscript));
    const unclearInput = Boolean(rawTranscript && isOrbyUnclearInput(rawTranscript));
    if (rawTranscript) voiceUnsupportedInputDetectedRef.current = unsupportedInputScript && !unclearInput;
    if (unclearInput) {
      setLiveTranscript("");
      setVoiceError("");
      setVoiceStatus("No alcancé a entenderte. Repítelo en español y te escucho…");
      setIsListening(true);
    }
    // Punctuation-only ASR is noise, not a new student request.
    const transcript = unclearInput
      ? ""
      : unsupportedInputScript
        ? "No se reconoció la frase en español."
        : rawTranscript;
    const normalizedFinal = transcript ? normalizeVoiceComparison(transcript) : "";
    const isDuplicateFinalTranscript = isDuplicateVoiceTranscriptInActivity(
      normalizedFinal,
      voiceLastCommittedInputRef.current,
      voiceActivityGenerationRef.current,
      voiceLastCommittedActivityGenerationRef.current,
      voiceLastCommittedInputAtRef.current,
    );
    const recentAssistantTexts = getRecentVoiceAssistantOutputs(false);
    const recentAssistantText = normalizeVoiceComparison(voiceLastAssistantOutputRef.current);
    const assistantAudioInFlight = voiceBrowserSpeechActiveRef.current
      || voiceAudioSourcesRef.current.size > 0
      || (voiceAudioContextRef.current?.currentTime ?? 0) < voiceNextPlaybackTimeRef.current;
    const assistantPlaybackTail = Date.now() <= voiceLastAssistantPlaybackUntilRef.current;
    // ASR can deliver the microphone echo after the audio element has ended.
    // Keep a short transcript-based guard so Orby never answers its own greeting.
    const recentAssistantOutput = Date.now() - voiceLastAssistantOutputAtRef.current < 3_000;
    const assistantSpeechCandidates = [...recentAssistantTexts, recentAssistantText];
    const isRecentAcousticEcho = (assistantAudioInFlight || (assistantPlaybackTail && normalizedFinal.length >= 8)
      || (recentAssistantOutput && normalizedFinal.length >= 18))
      && isLikelyVoicePlaybackEcho(normalizedFinal, assistantSpeechCandidates);
    const isMeaningfulBargeIn = assistantAudioInFlight
      && isStrongVoiceBargeIn(normalizedFinal, assistantSpeechCandidates);
    if (isRecentAcousticEcho) {
      console.warn("[Orby Voice] Ignored a microphone transcript matching the recent assistant playback.");
    } else if (assistantAudioInFlight && !isMeaningfulBargeIn) {
      console.info("[Orby Voice] Ignored a low-confidence transcript during assistant playback.");
    } else if (transcript && (voiceBrowserSpeechActiveRef.current || assistantAudioInFlight)) {
      // If final ASR arrives without a usable interim, treat it as a real
      // interruption and stop the current local utterance before handling it.
      interruptCurrentVoiceOutput();
    }

    // A final transcript received while Orby is speaking is not
    // automatically a valid interruption. Interim ASR already applies this
    // confidence gate; the final ASR path must enforce the same rule or weak
    // echo/VAD fragments are accidentally submitted despite the warning above.
    const acceptFinalTranscript = Boolean(
      transcript
      && !isDuplicateFinalTranscript
      && !isRecentAcousticEcho
      && (!assistantAudioInFlight || isMeaningfulBargeIn),
    );

    // Never return from the whole event handler for a duplicate transcript:
    // the same server event can also carry output audio or turnComplete.
    if (acceptFinalTranscript) {
      waitingForVoiceReplyRef.current = true;
      voiceTurnAcceptedAtRef.current = performance.now();
      voiceFirstOutputTextLoggedRef.current = false;
      voiceFirstAudioLoggedRef.current = false;
      voiceFirstAudioChunkReceivedRef.current = false;
      voiceListeningReadyLoggedRef.current = false;
      if (voicePendingBoardSnapshotsRef.current.length === 0) {
        voiceBoardUpdateCountRef.current = 0;
        voiceBoardActionSequenceRef.current = createOrbyBoardActionSequenceState(voiceActivityGenerationRef.current);
      }
      voiceAwaitingInputTranscriptionRef.current = false;
      voiceInputActivityStartedAtRef.current = 0;
      voiceInputPreflightAcceptedRef.current = false;
      // The prior assistant message keeps its own board in messages/history;
      // never carry that board into the next student turn or persist it twice.
      voiceTeachingBoardRef.current = null;
      voiceLastCommittedInputRef.current = normalizedFinal;
      voiceLastCommittedInputAtRef.current = Date.now();
      voiceLastCommittedActivityGenerationRef.current = voiceActivityGenerationRef.current;
      voicePendingStudentTurnRef.current = true;
      if (voiceTurnPersistedRef.current) {
        voiceUserTextRef.current = "";
        voiceAssistantTextRef.current = "";
        voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
        voiceResponseDoneRef.current = false;
        voiceTurnPersistedRef.current = false;
      }
      const previousTranscript = voiceUserTextRef.current.trim();
      voiceUserTextRef.current = mergeLiveTranscript(previousTranscript, transcript).slice(-MAX_VOICE_TRANSCRIPT_CHARS);
      const previousVoiceSubject = activeSubjectRef.current;
      const selectedVoiceSubject = getOrbySubjectSelectionLabel(voiceUserTextRef.current);
      if (!voiceUserMessageIdRef.current) voiceUserMessageIdRef.current = "voice-user-" + Date.now();
      const normalizedTranscript = voiceUserTextRef.current.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO").replace(/\s+/g, " ").trim();
      const falseCreatorClaim = /(?:asistente|tutor|modelo|herramienta|chatbot|ia|inteligencia\s*artificial).{0,140}cread[oa]\s*por\s*(?!peak\s*score\b)[a-z0-9]/i.test(normalizedTranscript)
        || /\bcliente\s*creo\b/i.test(normalizedTranscript);
      const asksIdentity = /\b(quien|qn)\b.{0,64}\b(te\s+)?(creo|crearon|hizo|hicieron|desarrollo|programo|creador|creadora|entreno|entren[oó])\b|\b(quien|qn)\s+eres\b|\btu\s+creador\b/.test(normalizedTranscript)
        || falseCreatorClaim;
      voiceUserMessageVisibleRef.current = true;
      const voiceScopeContext = [
        ...messagesRef.current.slice(-8).map(({ role, content }) => role + ": " + content),
        voiceLastAssistantOutputRef.current,
        "Área de estudio: " + previousVoiceSubject,
        "Tema de estudio: " + topic,
        question,
        context,
      ].filter(Boolean).join("\n").slice(-5_000);
      const preflight = preflightOrbyRequest(voiceUserTextRef.current, voiceScopeContext);
      voiceInputPolicyRef.current = asksIdentity
        ? "identity"
        : !preflight.allowed && preflight.category === "programming"
          ? "programming"
          : !preflight.allowed
            ? "outside"
            : null;
      // Benign conversation, greetings, subject selection and study guidance
      // must stay on Gemini Live so the native audio channel speaks them.
      // Only deterministic safety/language refusals may use the metered TTS fallback.
      const studyGuidanceReply = isOrbyStudyGuidanceRequest(voiceUserTextRef.current, voiceScopeContext)
        ? ORBY_STUDY_GUIDANCE_REPLY
        : null;
      voicePreflightReplyRef.current = asksIdentity
        ? null
        : unsupportedInputScript
          ? ORBY_SPANISH_ONLY_REPLY
          : studyGuidanceReply ?? (preflight.allowed ? null : preflight.reply);
      if (selectedVoiceSubject && preflight.allowed) activeSubjectRef.current = selectedVoiceSubject;
      clearPendingGeminiAudioQueue();
      voiceRealtimeAudioChunkCountRef.current = 0;
      voiceOutputTranscriptValidatedRef.current = false;
      voiceOutputAudioBlockedRef.current = Boolean(voicePreflightReplyRef.current);
      if (voicePreflightReplyRef.current) stopVoicePlayback();
      setLiveTranscript("");
      upsertVoiceUserMessage(voiceUserTextRef.current);
      if (voicePreflightReplyRef.current) {
        clearPendingOrbyTeachingBoard();
        requestLivePolicyReply(voiceUserTextRef.current, voicePreflightReplyRef.current, false);
        return;
      }
      if (isOrbyGreetingRequest(voiceUserTextRef.current)) {
        clearPendingOrbyTeachingBoard();
        // Greetings are deterministic conversational turns. Keep them out of
        // academic retrieval and avoid another generic introduction in Live.
        const greetingContext = messagesRef.current
          .filter((message) => !(message.role === "user" && isOrbyGreetingRequest(message.content)))
          .slice(-8)
          .map((message) => message.role + ": " + message.content)
          .join("\n");
        const greetingReply = getOrbyGreetingFollowUpReply(greetingContext, activeSubjectRef.current);
        requestLivePolicyReply(voiceUserTextRef.current, greetingReply, false);
        return;
      }
      voiceInputPreflightAcceptedRef.current = voiceInputPolicyRef.current === null
        && !voicePreflightReplyRef.current
        && !selectedVoiceSubject;
      if (voiceInputPreflightAcceptedRef.current) flushPendingOrbyTeachingBoard();
      else clearPendingOrbyTeachingBoard();
      void persistRealtimeTurnIfReady();
      armVoiceResponseWatchdog();
      setVoiceStatus("Orby está pensando…");
      setIsListening(false);
    }
    if (serverContent.interrupted === true && !voiceLocalReplyInFlightRef.current) {
      const studentBargeInPending = voiceBargeInPendingRef.current
        && voicePendingStudentTurnRef.current
        && Boolean(voiceUserTextRef.current.trim());
      voiceBargeInPendingRef.current = false;
      // This event closes the assistant's previous generation. When a new
      // student turn is already pending, discard all remaining output from
      // that generation while preserving the new input and its watchdog.
      clearVoiceResponseWatchdog();
      stopVoicePlayback();
      clearPendingGeminiAudioQueue();
      voiceRealtimeAudioChunkCountRef.current = 0;
      voiceOutputTranscriptValidatedRef.current = false;
      if (studentBargeInPending) {
        discardInterruptedGenerationOutput = true;
        voiceResponseDoneRef.current = false;
        waitingForVoiceReplyRef.current = true;
        setVoiceStatus("Procesando lo que dijiste…");
        setIsListening(false);
        armVoiceResponseWatchdog();
      } else {
        clearPendingOrbyTeachingBoard();
        voiceBargeInPendingRef.current = false;
        voiceResponseDoneRef.current = true;
        waitingForVoiceReplyRef.current = false;
        void persistRealtimeTurnIfReady();
        setVoiceStatus("Te escucho…");
        setIsListening(true);
      }
      // The interrupted event is the boundary between the old and new Live
      // generations. The current event remains discarded via the local guard;
      // subsequent events belong to the new generation and must be accepted.
      voiceDiscardStaleLiveOutputRef.current = false;
    }

    const outputTranscript = serverContent.outputTranscription && typeof serverContent.outputTranscription === "object"
      ? serverContent.outputTranscription as { text?: unknown }
      : null;
    const hasPendingStudentTurn = voicePendingStudentTurnRef.current && Boolean(voiceUserTextRef.current.trim());
    if (discardInterruptedGenerationOutput && typeof outputTranscript?.text === "string" && outputTranscript.text.trim()) {
      console.info("[Orby Voice] Ignored trailing assistant transcript from the interrupted generation.");
    } else if (!hasPendingStudentTurn && typeof outputTranscript?.text === "string" && outputTranscript.text.trim()) {
      console.warn("[Orby Voice] Ignored unsolicited Live output without a pending student turn.");
    } else if (hasPendingStudentTurn && !voiceLocalReplyInFlightRef.current
      && typeof outputTranscript?.text === "string" && outputTranscript.text.trim()) {
      if (!voiceFirstOutputTextLoggedRef.current && voiceTurnAcceptedAtRef.current > 0) {
        voiceFirstOutputTextLoggedRef.current = true;
        console.info("[Orby Voice] First response transcript timing.", {
          firstTranscriptMs: Math.round(performance.now() - voiceTurnAcceptedAtRef.current),
        });
      }
      voiceAssistantTextRef.current = mergeLiveTranscript(voiceAssistantTextRef.current, outputTranscript.text);
      voiceKnowledgeToolTurnRef.current = markOrbyVoiceToolFollowupOutput(voiceKnowledgeToolTurnRef.current);
      armVoiceResponseWatchdog();
      const partialReply = voiceAssistantTextRef.current.trim();
      // A transcript is eligible for acoustic echo suppression only after
      // Live audio has actually been scheduled; text arriving before playback
      // must never be mistaken for something the microphone could have heard.
      if (voiceRealtimeAudioChunkCountRef.current > 0 || voiceAudioSourcesRef.current.size > 0) {
        voiceLastAssistantOutputRef.current = partialReply;
        voiceLastAssistantOutputAtRef.current = Date.now();
      }
      voiceAssistantMessageIdRef.current = voiceAssistantMessageIdRef.current ?? ("voice-" + Date.now());
      const partialNormalized = normalizeVoiceComparison(partialReply);
      const partialExposesProvider = /\b(?:google|gemini|openai|anthropic|groq|llm7|microsoft copilot|meta ai)\b/.test(partialNormalized)
        && /\b(?:creado|creada|desarrollado|desarrollada|entrenado|entrenada|hecho|hecha|soy|fui)\b/.test(partialNormalized);
      const forcedExpected = voiceForcedReplyRef.current?.trim() ?? "";
      const normalizedForcedExpected = normalizeVoiceComparison(forcedExpected);
      const forcedSpeechMismatch = Boolean(
        forcedExpected
        && partialNormalized.length >= 8
        && !(
          normalizedForcedExpected.startsWith(partialNormalized)
          || partialNormalized === normalizedForcedExpected
        ),
      );
      const voiceScopeContext = [
        ...messagesRef.current.slice(-8).map(({ role, content }) => role + ": " + content),
        voiceUserTextRef.current,
        voiceLastAssistantOutputRef.current,
        "Área de estudio: " + activeSubjectRef.current,
        "Tema de estudio: " + topic,
        question,
        context,
      ].filter(Boolean).join("\n").slice(-5_000);
      const matchesTrustedPolicyReply = Boolean(
        forcedExpected && normalizedForcedExpected.startsWith(partialNormalized),
      );
      // The trusted refusal is itself expected to mention the blocked subject
      // (for example, programming). Validate it against the exact approved
      // response prefix rather than treating its subject word as unsafe advice.
      // Any deviation or extra continuation still goes through every safety gate.
      const partialUnsafe = !matchesTrustedPolicyReply && (
        voiceOutputAudioBlockedRef.current
        || forcedSpeechMismatch
        || containsUnsupportedSpanishLanguage(partialReply)
        || containsProgrammingInstruction(partialReply, voiceScopeContext)
        || containsCookingInstruction(partialReply, voiceScopeContext)
        || containsExplicitNonIcfesTopic(partialReply, voiceScopeContext)
        || containsPlatformMarketingClaim(partialReply)
        || containsExternalPreIcfesPromotion(partialReply)
        || isLikelyEnglishOnlyOrbyReply(partialReply)
        || hasFalseOrbyCreatorAttribution(partialReply)
        || partialExposesProvider
      );

      if (partialUnsafe) {
        voiceOutputTranscriptValidatedRef.current = false;
        voiceOutputAudioBlockedRef.current = true;
        clearPendingGeminiAudioQueue();
        stopVoicePlayback();
      } else {
        // Start natural Live audio as soon as one complete sentence has
        // passed validation. Waiting for the whole response made speech feel
        // delayed; later unsafe continuations still stop playback immediately.
        const hasCompleteSafeSentence = partialReply.length >= 18
          && /[.!?;]["'”’)}\]]*\s*$/.test(partialReply);
        voiceOutputTranscriptValidatedRef.current = hasCompleteSafeSentence;
        if (hasCompleteSafeSentence) {
          flushPendingGeminiAudio();
        }
        const visibleReply = forcedExpected || partialReply;
        const assistantId = voiceAssistantMessageIdRef.current;
        setMessages((current) => {
          const exists = current.some((message) => message.id === assistantId);
          return exists
            ? current.map((message) => message.id === assistantId ? { ...message, content: visibleReply } : message)
            : [...current, { id: assistantId, role: "assistant", content: visibleReply }];
        });
        // Keep every Live audio chunk buffered until the complete transcript passes
        // final validation. Early playback followed by a filtered/TTS replacement
        // was the main source of repeated phrases and apparent double voices.
      }
      setVoiceStatus("Orby está hablando…");
    }

    const modelTurn = serverContent.modelTurn && typeof serverContent.modelTurn === "object"
      ? serverContent.modelTurn as { parts?: Array<Record<string, unknown>> }
      : null;
    for (const part of modelTurn?.parts ?? []) {
      const inlineData = part.inlineData && typeof part.inlineData === "object"
        ? part.inlineData as { data?: unknown; mimeType?: unknown }
        : null;
      if (discardInterruptedGenerationOutput
        || typeof inlineData?.data !== "string" || !voicePendingStudentTurnRef.current
        || !voiceUserTextRef.current.trim() || voiceLocalReplyInFlightRef.current
        || voiceOutputAudioBlockedRef.current || voiceResponseDoneRef.current) continue;

      // Live audio is the preferred natural voice. If its first chunk arrives
      // after optional speech playback already began, stop that playback before
      // playing Live audio; never let the two speakers overlap.
      if (voiceBrowserSpeechActiveRef.current || voiceSpeechCancelRef.current) {
        stopSpeaking();
      }
      armVoiceResponseWatchdog();
      if (!voiceFirstAudioChunkReceivedRef.current && voiceTurnAcceptedAtRef.current > 0) {
        voiceFirstAudioChunkReceivedRef.current = true;
        console.info("[Orby Voice] First audio chunk received timing.", {
          firstAudioChunkReceivedMs: Math.round(performance.now() - voiceTurnAcceptedAtRef.current),
        });
      }
      const chunk = {
        data: inlineData.data,
        mimeType: typeof inlineData.mimeType === "string" ? inlineData.mimeType : undefined,
      };
      if (voiceOutputTranscriptValidatedRef.current) {
        // The first complete sentence already passed validation, so keep the
        // Live stream flowing instead of buffering every later audio chunk.
        playGeminiAudio(chunk.data, chunk.mimeType);
      } else {
        // Bound both object count and encoded payload size. A chunk-count-only
        // cap can still retain excessive memory when the provider sends large
        // PCM payloads before the transcript is validated.
        const pendingEncodedChars = voicePendingAudioEncodedCharsRef.current + chunk.data.length;
        const withinChunkLimit = voicePendingAudioChunksRef.current.length < 512;
        const withinMemoryBudget = pendingEncodedChars <= 8 * 1024 * 1024;
        if (withinChunkLimit && withinMemoryBudget) {
          voicePendingAudioChunksRef.current.push(chunk);
          voicePendingAudioEncodedCharsRef.current = pendingEncodedChars;
        } else {
          const pendingChunkCount = voicePendingAudioChunksRef.current.length;
          voiceOutputAudioBlockedRef.current = true;
          clearPendingGeminiAudioQueue();
          console.warn("[Orby Voice] Audio buffer budget reached; switching this turn to validated text speech.", {
            pendingChunks: pendingChunkCount,
            encodedChars: pendingEncodedChars,
          });
        }
      }
    }

    if (discardInterruptedGenerationOutput
      && (serverContent.turnComplete === true || serverContent.generationComplete === true)) {
      // This completion belongs to the stale generation. Release the guard
      // only after discarding its final event; the next Live generation is valid.
      voiceDiscardStaleLiveOutputRef.current = false;
      voiceBargeInPendingRef.current = false;
    }

    if (!discardInterruptedGenerationOutput
      && (serverContent.turnComplete === true || serverContent.generationComplete === true)
      && voiceAwaitingInputTranscriptionRef.current
      && Date.now() - voiceInputActivityStartedAtRef.current > 15_000) {
      clearPendingOrbyTeachingBoard();
    }

    if (!discardInterruptedGenerationOutput
      && (serverContent.turnComplete === true || serverContent.generationComplete === true)
      && !voiceResponseDoneRef.current) {
      const toolCompletion = completeOrbyVoiceToolGeneration(voiceKnowledgeToolTurnRef.current);
      voiceKnowledgeToolTurnRef.current = toolCompletion.state;
      if (!toolCompletion.shouldFinalize) {
        setVoiceStatus(toolCompletion.state.responseSent
          ? "Orby está completando la explicación con el material del Lab…"
          : "Orby terminó su primera explicación y está esperando el resultado del Lab…");
        return;
      }
      clearVoiceResponseWatchdog();
      if (!voicePendingStudentTurnRef.current || !voiceUserTextRef.current.trim()) {
        // A model greeting or unsolicited continuation is not a student turn.
        stopVoicePlayback();
        clearPendingGeminiAudioQueue();
        voiceAssistantTextRef.current = "";
        voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
        voiceBargeInPendingRef.current = false;
        voiceResponseDoneRef.current = true;
        voiceTurnPersistedRef.current = true;
        waitingForVoiceReplyRef.current = false;
        voicePendingStudentTurnRef.current = false;
        setLiveTranscript("");
        setIsListening(true);
        setVoiceStatus("Te escucho…");
        return;
      }
      const forcedLiveReply = voiceForcedReplyRef.current;
      const rawReply = normalizeOrbySpanishOutput(forcedLiveReply ?? normalizeVoicePunctuation(voiceAssistantTextRef.current));
      voiceForcedReplyRef.current = null;
      const normalizedReply = rawReply.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CO");
      const exposesProvider = (
        /\b(?:google|gemini|openai|anthropic|groq|llm7|microsoft copilot|meta ai|ticescool|ticeschool)\b/.test(normalizedReply)
        && /\b(?:creado|creada|desarrollado|desarrollada|entrenado|entrenada|trained|hecho|hecha|soy|fui)\b/.test(normalizedReply)
      ) || /(?:cread[oa]|entrenad[oa]|desarrollad[oa]|hech[oa])\s*(?:por|by)\s*(?!peak[-_]?score\b)[a-z0-9]/i.test(normalizedReply);
      const voiceScopeContext = [
        voiceUserTextRef.current,
        voiceLastAssistantOutputRef.current,
        "Área de estudio: " + activeSubjectRef.current,
        "Tema de estudio: " + topic,
        question,
        context,
      ].filter(Boolean).join("\n").slice(0, 1800);
      const unsafeGeneratedContent = containsProgrammingInstruction(rawReply, voiceScopeContext)
        || hasFalseOrbyCreatorAttribution(rawReply);
      const policyReply = forcedLiveReply
        ? null
        : voicePreflightReplyRef.current
          ?? (isLowQualityOrbyReply(rawReply, voiceUserTextRef.current)
            ? ORBY_INCOMPLETE_REPLY_FALLBACK
            : containsUnsupportedSpanishLanguage(rawReply)
            ? ORBY_SPANISH_OUTPUT_FALLBACK
            : voiceInputPolicyRef.current === "identity" || exposesProvider || (hasFalseOrbyCreatorAttribution(rawReply) && !rawReply.toLowerCase().includes("peakscore"))
            ? "Soy Orby, el asistente educativo creado por PeakScore para acompañarte en tu preparación para las pruebas Saber 11."
            : containsCookingInstruction(rawReply, voiceScopeContext)
              ? ORBY_COOKING_REPLY
              : containsExplicitNonIcfesTopic(rawReply, voiceScopeContext)
                ? ORBY_SAFETY_REPLY
                : containsPlatformMarketingClaim(rawReply)
                ? ORBY_PLATFORM_NEUTRALITY_REPLY
                : containsExternalPreIcfesPromotion(rawReply)
                ? ORBY_EXTERNAL_PREICFES_REPLY
              : isLikelyEnglishOnlyOrbyReply(rawReply)
                ? isGenericIcfesEnglishRequest(voiceUserTextRef.current) ? ORBY_ICFES_ENGLISH_INTRO_REPLY : "Soy Orby, tu tutor de PeakScore especializado en Saber 11. Te responderé en español colombiano y puedo ayudarte con las cinco áreas del examen."
                : voiceInputPolicyRef.current === "programming" || unsafeGeneratedContent
                  ? preflightOrbyRequest("programar").reply
                  : voiceInputPolicyRef.current === "outside"
                    ? preflightOrbyRequest("cocinar").reply
                    : null);
      voicePreflightReplyRef.current = null;

      // Deterministic safety replies are inserted directly as validated text.
      // Never synthesize them with an unverified or metered voice provider.
      if (policyReply) {
        // Never ask Live to read a deterministic filter response. Replace the
        // partial unsafe bubble and speak the trusted local answer immediately.
        requestLivePolicyReply(voiceUserTextRef.current, policyReply, false, true);
        return;
      }

      if (rawReply) {
        // turnComplete is the final validation boundary. If the response was
        // safe but never emitted punctuation during streaming, release its
        // buffered Live audio now; unsupported audio is never sent to a browser voice.
        voiceOutputTranscriptValidatedRef.current = true;
        const citationResult = reconcileOrbyPublicCitations(rawReply, voicePublicSourcesRef.current);
        const sourcesForVoiceReply = citationResult.sources;
        voicePublicSourcesRef.current = [];
        // Persist only sources that the Live transcript explicitly cited.
        // Audio playback and echo detection continue using rawReply without URLs.
        const replyWithSourceLinks = citationResult.reply || rawReply;
        voiceAssistantTextRef.current = replyWithSourceLinks;
        const id = voiceAssistantMessageIdRef.current ?? ("voice-" + Date.now());
        voiceAssistantMessageIdRef.current = id;
        setMessages((current) => {
          const exists = current.some((message) => message.id === id);
          return exists
            ? current.map((message) => message.id === id
              ? { ...message, content: replyWithSourceLinks, ...(sourcesForVoiceReply.length ? { sources: sourcesForVoiceReply } : {}) }
              : message)
            : [...current, {
                id,
                role: "assistant",
                content: replyWithSourceLinks,
                ...(sourcesForVoiceReply.length ? { sources: sourcesForVoiceReply } : {}),
              }];
        });
        if (!voiceOutputAudioBlockedRef.current && voiceOutputTranscriptValidatedRef.current) {
          flushPendingGeminiAudio();
        } else {
          // Do not trust untranscribed or unsupported-language audio.
          // Invalid audio chunks are discarded; with no verified free TTS
          // provider, preserve the validated answer in text only.
          clearPendingGeminiAudioQueue();
        }
        const hasAudibleLiveOutput = voiceRealtimeAudioChunkCountRef.current > 0
          || voiceAudioSourcesRef.current.size > 0;
        if (hasAudibleLiveOutput) {
          // Store the final transcript only after Live audio was actually
          // scheduled. This also protects the short acoustic tail after the
          // final audio chunk has ended.
          voiceLastAssistantOutputRef.current = rawReply;
          voiceLastAssistantOutputAtRef.current = Date.now();
          rememberVoiceAssistantOutput(rawReply);
          const playbackContext = voiceAudioContextRef.current;
          const remainingPlaybackMs = playbackContext
            ? Math.max(0, voiceNextPlaybackTimeRef.current - playbackContext.currentTime) * 1000
            : 0;
          voiceLastAssistantPlaybackUntilRef.current = Date.now() + remainingPlaybackMs + 1_800;
        } else {
          // A text-only Live completion was not heard by the microphone.
          voiceLastAssistantOutputRef.current = "";
          voiceLastAssistantOutputAtRef.current = 0;
          voiceLastAssistantPlaybackUntilRef.current = 0;
        }
      }

      const needsSpeechFallback = voiceOutputAudioBlockedRef.current
        || !voiceOutputTranscriptValidatedRef.current
        || voiceRealtimeAudioChunkCountRef.current === 0;

      clearPendingGeminiAudioQueue();
      voiceInputPolicyRef.current = null;
      voicePreflightReplyRef.current = null;
      voiceForcedReplyRef.current = null;
      voiceBargeInPendingRef.current = false;
      voiceResponseDoneRef.current = true;
      voiceOutputAudioBlockedRef.current = false;
      voiceOutputTranscriptValidatedRef.current = false;

      if (!rawReply.trim() && voiceUserTextRef.current.trim()) {
        // Live occasionally completes without usable text. Ask the existing
        // filtered tutor route to recover this same turn instead of silently
        // releasing the listening state with no answer.
        voiceResponseDoneRef.current = false;
        fallbackVoiceTurnToText("Gemini Live finalizó sin entregar una transcripción utilizable. Continuaré esta misma pregunta con el motor de respaldo.");
        return;
      }

      // Live is primary. If its audio is missing or blocked, keep the validated
      // transcript and use Gemini TTS only when the server verifies free-tier access.
      if (needsSpeechFallback && rawReply.trim()) {
        if (forcedLiveReply) {
          // A deterministic safety reply was requested from native Live. If
          // Live did not produce validated audio, keep the safe text and return
          // to listening; do not spend TTS quota on a policy response.
          setVoiceError("La respuesta de seguridad quedó visible, pero Live no pudo reproducirla. Puedes continuar hablando.");
          finishRealtimeVoicePlayback();
          return;
        }
        const id = voiceAssistantMessageIdRef.current;
        const messageIndex = messages.findIndex((message) => message.id === id);
        void speakText(rawReply, messageIndex >= 0 ? messageIndex : messages.length);
        return;
      }
      finishRealtimeVoicePlayback();
    }

    if (event.error && typeof event.error === "object") {
      const detail = event.error as { message?: unknown };
      fallbackVoiceTurnToText(typeof detail.message === "string"
        ? "La voz tuvo un problema. Continué esta misma pregunta por el chat."
        : "La voz tuvo un problema. Continué esta misma pregunta por el chat.");
    }
  }

  async function startRealtimeVoice(startupSignal: AbortSignal) {
    const startupStartedAt = performance.now();
    const voiceSdkStartedAt = performance.now();
    const startupTimings = {
      microphonePermissionMs: 0,
      conversationAndTokenMs: 0,
      sdkLoadMs: 0,
      liveConnectMs: 0,
      liveSetupMs: 0,
      workletLoadMs: 0,
    };
    // Descargar el SDK pesado en paralelo con el permiso del micrófono; el chat
    // escrito no necesita incluirlo en su bundle inicial.
    const voiceSdkPromise = import("@google/genai");
    const sessionGeneration = ++voiceSessionGenerationRef.current;
    if (!navigator.mediaDevices?.getUserMedia || !("WebSocket" in window) || !("AudioWorkletNode" in window)) {
      throw new Error("Este navegador no admite conversación de voz en tiempo real. Prueba Chrome o Edge actualizado.");
    }
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      throw new Error("El micrófono requiere HTTPS.");
    }

    setVoiceError("");
    setVoiceStatus("Solicitando permiso del micrófono…");
    // Unlock the output AudioContext synchronously in the original click
    // gesture. Waiting for the browser's microphone permission prompt first
    // can consume transient user activation; Chrome then leaves the context
    // suspended and every later TTS play() is rejected as autoplay.
    const audioContext = voiceAudioContextRef.current && voiceAudioContextRef.current.state !== "closed"
      ? voiceAudioContextRef.current
      : new AudioContext();
    voiceAudioContextRef.current = audioContext;
    const audioContextReady = audioContext.state === "suspended"
      ? audioContext.resume().then(() => null, (error: unknown) => error)
      : Promise.resolve(null);

    const permissionRequest = navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    let permissionTimedOut = false;
    let permissionTimeoutId: number | null = null;
    let abortPermission: (() => void) | null = null;
    void permissionRequest.then((lateStream) => {
      if (permissionTimedOut || startupSignal.aborted || !voiceModeRef.current) {
        lateStream.getTracks().forEach((track) => track.stop());
      }
    }).catch(() => undefined);
    const permissionAbort = new Promise<never>((_, reject) => {
      abortPermission = () => reject(new DOMException("La conexión de voz fue cancelada.", "AbortError"));
      if (startupSignal.aborted) abortPermission();
      else startupSignal.addEventListener("abort", abortPermission, { once: true });
    });
    let stream: MediaStream;
    try {
      stream = await Promise.race([
        permissionRequest,
        permissionAbort,
        new Promise<never>((_, reject) => {
          permissionTimeoutId = window.setTimeout(() => {
            permissionTimedOut = true;
            reject(new Error("El permiso del micrófono tardó demasiado. Puedes continuar escribiendo en el chat."));
          }, 12_000);
        }),
      ]);
      startupTimings.microphonePermissionMs = performance.now() - startupStartedAt;
      const audioResumeError = await audioContextReady;
      if (audioResumeError) {
        permissionTimedOut = true;
        throw audioResumeError;
      }
      await ensureVoiceAudioContextRunning(audioContext);
    } finally {
      if (permissionTimeoutId !== null) window.clearTimeout(permissionTimeoutId);
      if (abortPermission) startupSignal.removeEventListener("abort", abortPermission);
    }
    if (startupSignal.aborted || !voiceModeRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      throw new DOMException("La conexión de voz fue cancelada.", "AbortError");
    }
    voiceStreamRef.current = stream;
    stream.getAudioTracks().forEach((track) => {
      track.onended = () => {
        // Ignore late ended events from a stream that has already been replaced.
        if (!voiceModeRef.current || sessionGeneration !== voiceSessionGenerationRef.current
          || voiceStreamRef.current !== stream) return;
        fallbackVoiceTurnToText(
          "El micrófono se desconectó. Conservé la pregunta pendiente y cambié al modo de voz por turnos; revisa el dispositivo y vuelve a tocar el micrófono para reconectarlo.",
        );
      };
      track.onmute = () => {
        // A replaced microphone track must never overwrite the status of the
        // current session with a delayed mute event from an older stream.
        if (!voiceModeRef.current || sessionGeneration !== voiceSessionGenerationRef.current
          || voiceStreamRef.current !== stream) return;
        setVoiceStatus("El navegador pausó el micrófono; comprueba el permiso del sitio.");
      };
      track.onunmute = () => {
        if (!voiceModeRef.current || sessionGeneration !== voiceSessionGenerationRef.current
          || voiceStreamRef.current !== stream) return;
        setVoiceError("");
        setVoiceStatus("Te escucho…");
      };
    });

    try {
      // The AudioContext was created and resumed from the original user
      // gesture above, before the permission dialog could consume activation.
      // Keep it available if Live must fall back to turn-based Gemini TTS.

      // Conversation creation and ephemeral-token issuance are independent.
      // Run them together so voice startup does not pay both network round trips.
      const conversationAndTokenStartedAt = performance.now();
      const [activeId, tokenResponse] = await Promise.all([
        ensureVoiceConversation(startupSignal),
        fetch("/api/orby/realtime-session", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.any([startupSignal, AbortSignal.timeout(15_000)]),
          body: JSON.stringify({
            subject: activeSubjectRef.current,
            topic,
            context,
            conversationId: activeConversationRef.current ?? conversationId,
            history: messagesRef.current.slice(-12).map(({ role, content }) => ({ role, content })),
          }),
        }),
      ]);
      // Publish the conversation identity before Live can emit a resumption
      // handle. Otherwise the first handle may be recorded against null while
      // the microphone/worklet is still being prepared.
      startupTimings.conversationAndTokenMs = performance.now() - conversationAndTokenStartedAt;
      activeConversationRef.current = activeId;
      const tokenPayload = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || typeof tokenPayload.ephemeralToken !== "string") {
        throw new Error(tokenPayload.error || "No se pudo iniciar la sesión de voz.");
      }

      setVoiceStatus("Conectando con Orby…");
      const configuredModel = typeof tokenPayload.model === "string" ? tokenPayload.model : "gemini-3.8-live";
      const model = configuredModel.startsWith("models/")
        ? configuredModel.slice("models/".length)
        : configuredModel;
      const systemInstruction = typeof tokenPayload.systemInstruction === "string"
        ? tokenPayload.systemInstruction
        : "Eres Orby, el tutor de PeakScore. Responde exclusivamente en español colombiano y alfabeto latino. Nunca cambies a hindi ni a otro idioma. Si no entiendes, pide repetir en español. Ayuda únicamente con Saber 11.";
      const configuredVoiceName = typeof tokenPayload.voiceName === "string"
        && /^[A-Za-z]{3,24}$/.test(tokenPayload.voiceName)
        ? tokenPayload.voiceName
        : "Despina";

      setVoiceStatus("Conectando con Orby…");
      const voiceSdk = await voiceSdkPromise;
      startupTimings.sdkLoadMs = performance.now() - voiceSdkStartedAt;
      voiceSdkRef.current = voiceSdk;
      let googleAI = new voiceSdk.GoogleGenAI({
        apiKey: tokenPayload.ephemeralToken,
        httpOptions: { apiVersion: "v1beta" },
      });

      let rejectSetup: ((error: Error) => void) | null = null;
      let resolveSetupComplete: (() => void) | null = null;
      let liveSessionEstablished = false;
      let lastLiveSocketError = "";
      let connectionSequence = 0;
      let reconnectInFlight = false;
      let reconnectLiveSession: (() => Promise<void>) | null = null;
      let resolveResumeSetup: (() => void) | null = null;
      let rejectResumeSetup: ((error: Error) => void) | null = null;
      let resumeSetupComplete = false;
      const setupFailure = new Promise<never>((_, reject) => {
        rejectSetup = reject;
      });
      const setupComplete = new Promise<void>((resolve) => {
        resolveSetupComplete = resolve;
      });

      const buildLiveConfig = (resumeHandle?: string) => ({
        abortSignal: startupSignal,
        responseModalities: [voiceSdk.Modality.AUDIO],
        // Reduce the default silence endpointing delay while retaining enough
        // pause tolerance for natural speech and mid-sentence breathing.
        realtimeInputConfig: {
          automaticActivityDetection: {
            endOfSpeechSensitivity: voiceSdk.EndSensitivity.END_SENSITIVITY_HIGH,
            prefixPaddingMs: 40,
            silenceDurationMs: 400,
          },
        },
        contextWindowCompression: { slidingWindow: {} },
        sessionResumption: resumeHandle ? { handle: resumeHandle } : {},
        tools: ORBY_LIVE_KNOWLEDGE_TOOLS,
        inputAudioTranscription: {
          // The student may read an English ICFES item aloud inside a Spanish
          // conversation. Automatic multilingual recognition preserves both
          // languages; output transcription and spoken answers stay Spanish.
          languageCodes: [],
          customVocabulary: [
            "Orby", "Oye Orby", "Hey Orby", "Orby AI", "PeakScore",
            "Saber 11", "ICFES", "Matemáticas", "Lectura Crítica",
            "Sociales y Ciudadanas", "Ciencias Naturales",
            "however", "although", "unless", "despite", "therefore", "because",
            "instead", "purpose", "main idea", "according to", "advertisement",
            "announcement", "notice", "discount", "schedule", "vacancy",
            "application", "instructions", "conversation", "dialogue", "paragraph",
            "passage", "statement", "true or false", "fill in the blank",
            "present simple", "past simple", "present perfect", "phrasal verb",
            "preposition", "pronoun", "conjunction", "adjective", "adverb",
          ],
        },
        outputAudioTranscription: { languageCodes: ["es-US"] },
        speechConfig: {
          languageCode: "es-US",
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: configuredVoiceName },
          },
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      });

      const handleLiveSocketMessage = (message: unknown) => {
        const payload = message as Record<string, unknown>;
        if (payload.sessionResumptionUpdate && typeof payload.sessionResumptionUpdate === "object") {
          const update = payload.sessionResumptionUpdate as { resumable?: unknown; newHandle?: unknown };
          if (update.resumable === true && typeof update.newHandle === "string"
            && update.newHandle.length > 20 && update.newHandle.length <= 8192) {
            voiceSessionResumeHandleRef.current = update.newHandle;
            voiceSessionResumeConversationRef.current = activeConversationRef.current;
            voiceSessionResumeUpdatedAtRef.current = Date.now();
          }
        }

        if (payload.goAway && typeof payload.goAway === "object") {
          const notice = payload.goAway as { timeLeft?: unknown };
          console.info("[Orby Voice] Live connection is approaching its provider limit.", {
            timeLeft: typeof notice.timeLeft === "string" || typeof notice.timeLeft === "number"
              ? notice.timeLeft
              : undefined,
            resumable: Boolean(voiceSessionResumeHandleRef.current),
          });
          setVoiceStatus("Renovando la conexión de voz sin cerrar tu conversación…");
        }

        if (payload.error && typeof payload.error === "object") {
          const detail = payload.error as { message?: unknown; status?: unknown; code?: unknown };
          const providerDetail = [
            typeof detail.code === "string" ? detail.code : "",
            typeof detail.status === "string" || typeof detail.status === "number" ? String(detail.status) : "",
            typeof detail.message === "string" ? detail.message : "",
          ].filter(Boolean).join(" ");
          const liveFailure = classifyGeminiProviderFailure({
            status: detail.status,
            code: detail.code,
            message: providerDetail,
          });
          const quotaReached = liveFailure === "quota_exhausted";
          const rateLimited = liveFailure === "rate_limited";
          console.warn("[Orby Voice] Realtime service rejected the connection.", {
            status: detail.status,
            code: detail.code,
            quotaReached,
            reconnecting: reconnectInFlight,
          });

          const quotaMessage = "GEMINI_FREE_QUOTA_EXCEEDED: Gemini Live agotó su cuota gratuita. Continúo con Whisper, Cloudflare y lectura local; no se usará un servicio de pago.";
          const rateLimitMessage = "Gemini Live está limitando temporalmente las solicitudes. Conservé tu conversación y continuaré por el respaldo gratuito; no significa que se haya agotado tu cuota.";
          if (reconnectInFlight && !resumeSetupComplete) {
            rejectResumeSetup?.(new Error(
              quotaReached ? quotaMessage : rateLimited ? rateLimitMessage : "No se pudo reanudar la conexión de voz.",
            ));
          } else if (liveSessionEstablished && voiceModeRef.current) {
            if (quotaReached) {
              fallbackVoiceTurnToText("Gemini Live agotó su cuota gratuita. Continúo esta conversación con Whisper y Cloudflare, sin usar servicios de pago.");
            } else if (rateLimited) {
              fallbackVoiceTurnToText(rateLimitMessage);
            } else if (reconnectLiveSession) {
              void reconnectLiveSession();
            } else {
              fallbackVoiceTurnToText("La conexión de voz se interrumpió. Continúo esta misma pregunta con Whisper y el tutor gratuito de Cloudflare; la respuesta quedará escrita.");
            }
          } else {
            rejectSetup?.(new Error(quotaReached
              ? quotaMessage
              : rateLimited
                ? rateLimitMessage
                : "No se pudo establecer la conexión de voz de Orby. Inténtalo de nuevo."));
          }
          return;
        }

        if (payload.setupComplete) {
          resolveSetupComplete?.();
          if (reconnectInFlight) {
            resumeSetupComplete = true;
            resolveResumeSetup?.();
          }
        }
        if (payload.toolCallCancellation && typeof payload.toolCallCancellation === "object") {
          const cancellation = payload.toolCallCancellation as { ids?: unknown };
          const cancelledIds = Array.isArray(cancellation.ids)
            ? cancellation.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
            : [];
          if (cancelledIds.length) {
            cancelPendingOrbyKnowledgeRequests(cancelledIds);
            if (voiceKnowledgeRequestsRef.current.size === 0) {
              const cancelledToolTurn = voiceKnowledgeToolTurnRef.current;
              voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
              if (cancelledToolTurn.pending && cancelledToolTurn.initialGenerationCompleted
                && voiceModeRef.current && voicePendingStudentTurnRef.current
                && !voiceResponseDoneRef.current) {
                fallbackVoiceTurnToText("La consulta del Lab se canceló antes de incorporarse. Conservo tu pregunta y termino la explicación con el tutor gratuito.");
              }
            }
          }
          // A cancellation is a control message, not student-facing content.
          // Do not send function responses for calls Gemini explicitly cancelled.
          if (!payload.toolCall) return;
        }
        if (payload.toolCall && typeof payload.toolCall === "object") {
          const sameEventServerContent = payload.serverContent && typeof payload.serverContent === "object"
            ? payload.serverContent as Record<string, unknown>
            : null;
          const inputTranscription = sameEventServerContent?.inputTranscription;
          const interimInputTranscription = sameEventServerContent?.interimInputTranscription;
          const hasSameEventInput = Boolean(inputTranscription || interimInputTranscription);
          const sameEventTranscript = sameEventServerContent?.outputTranscription
            && typeof sameEventServerContent.outputTranscription === "object"
            ? (sameEventServerContent.outputTranscription as { text?: unknown }).text
            : null;
          if (typeof sameEventTranscript === "string" && sameEventTranscript.trim()) {
            voiceKnowledgeToolTurnRef.current = markOrbyVoiceToolFollowupOutput(voiceKnowledgeToolTurnRef.current);
          }

          // Gemini Live does not guarantee ordering between input transcription
          // and tool calls. Process VAD/student input first so preflight and the
          // current activity generation are established before a board arrives.
          if (payload.voiceActivity || hasSameEventInput) {
            const inputOnly: Record<string, unknown> = {};
            if (inputTranscription) inputOnly.inputTranscription = inputTranscription;
            if (interimInputTranscription) inputOnly.interimInputTranscription = interimInputTranscription;
            handleGeminiLiveEvent({
              ...payload,
              toolCall: undefined,
              serverContent: Object.keys(inputOnly).length ? inputOnly : undefined,
            });
          }

          const liveCalls = (payload.toolCall as { functionCalls?: unknown }).functionCalls;
          if (Array.isArray(liveCalls)) {
            const cancelledIds = payload.toolCallCancellation && typeof payload.toolCallCancellation === "object"
              && Array.isArray((payload.toolCallCancellation as { ids?: unknown }).ids)
              ? (payload.toolCallCancellation as { ids: unknown[] }).ids.filter((id): id is string => typeof id === "string")
              : [];
            const activeCalls = liveCalls.filter((call) => !!call && typeof call === "object"
              && !cancelledIds.includes((call as { id?: unknown }).id as string));
            const boardCalls = activeCalls.filter((call) => (call as { name?: unknown }).name === "render_orby_teaching_board");
            const boardActionCalls = activeCalls.filter((call) => (call as { name?: unknown }).name === "apply_orby_board_action");
            const knowledgeCalls = activeCalls.filter((call) => !["render_orby_teaching_board", "apply_orby_board_action"].includes(String((call as { name?: unknown }).name)));
            if (boardCalls.length) void handleOrbyLiveTeachingBoardTool({ functionCalls: boardCalls });
            if (boardActionCalls.length) void handleOrbyLiveBoardActionTool({ functionCalls: boardActionCalls });
            if (knowledgeCalls.length) void handleOrbyLiveKnowledgeTool({ functionCalls: knowledgeCalls });
          }

          // Process generated speech/output once, without replaying input or VAD.
          if (sameEventServerContent) {
            const outputOnly = { ...sameEventServerContent };
            delete outputOnly.inputTranscription;
            delete outputOnly.interimInputTranscription;
            if (Object.keys(outputOnly).length > 0) {
              handleGeminiLiveEvent({
                ...payload,
                voiceActivity: undefined,
                toolCall: undefined,
                serverContent: outputOnly,
              });
            }
          }
          return;
        }
        handleGeminiLiveEvent(payload);
      };

      const resumeHandleIsFresh = Date.now() - voiceSessionResumeUpdatedAtRef.current < 90 * 60 * 1000;
      if (!resumeHandleIsFresh) {
        voiceSessionResumeHandleRef.current = null;
        voiceSessionResumeConversationRef.current = null;
        voiceSessionResumeUpdatedAtRef.current = 0;
      }
      const initialResumeHandle = resumeHandleIsFresh
        && voiceSessionResumeConversationRef.current === activeConversationRef.current
        ? voiceSessionResumeHandleRef.current ?? undefined
        : undefined;
      const initialConnectionId = ++connectionSequence;
      const sessionPromise = googleAI.live.connect({
        model,
        config: buildLiveConfig(initialResumeHandle),
        callbacks: {
          onopen: () => {
            if (sessionGeneration !== voiceSessionGenerationRef.current || startupSignal.aborted
              || initialConnectionId !== connectionSequence) return;
            setVoiceStatus("Conectado; esperando confirmación de Orby…");
          },
          onmessage: (message) => {
            if (sessionGeneration !== voiceSessionGenerationRef.current || startupSignal.aborted
              || initialConnectionId !== connectionSequence) return;
            handleLiveSocketMessage(message);
          },
          onerror: (event) => {
            if (sessionGeneration !== voiceSessionGenerationRef.current || startupSignal.aborted
              || initialConnectionId !== connectionSequence) return;
            const rawError = event.error instanceof Error
              ? event.error.message
              : typeof event.message === "string" && event.message.trim()
                ? event.message.trim()
                : "WebSocket notificó un error sin detalle.";
            lastLiveSocketError = rawError.slice(0, 180);
            console.warn("[Orby Voice] WebSocket error event.", {
              message: lastLiveSocketError,
              eventType: event.type,
            });
            setVoiceStatus("Recuperando conexión de voz…");
          },
          onclose: (event) => {
            if (sessionGeneration !== voiceSessionGenerationRef.current || startupSignal.aborted
              || initialConnectionId !== connectionSequence) return;
            const reason = event.reason?.trim();
            const detail = [
              "código " + event.code,
              reason ? "razón: " + reason.slice(0, 180) : "",
              lastLiveSocketError ? "evento previo: " + lastLiveSocketError : "",
              event.wasClean ? "cierre limpio" : "cierre no limpio",
            ].filter(Boolean).join(" · ");
            if (!liveSessionEstablished) {
              console.warn("[Orby Voice] Connection closed before setup completed.", { detail });
              rejectSetup?.(new Error("No se pudo iniciar la conversación de voz de Orby. " + detail));
              return;
            }
            if (voiceModeRef.current) {
              console.info("[Orby Voice] Resuming the existing conversation after connection close.", { detail });
              if (reconnectLiveSession) void reconnectLiveSession();
              else fallbackVoiceTurnToText("La conexión de voz se interrumpió. Continúo esta misma pregunta con Whisper y Cloudflare.");
            }
          },
        },
      });

      let liveSession: Session;
      const liveConnectStartedAt = performance.now();
      let connectTimeoutId: number | null = null;
      let acknowledgementTimeoutId: number | null = null;
      try {
        liveSession = await Promise.race([
          sessionPromise,
          setupFailure,
          new Promise<never>((_, reject) => {
            connectTimeoutId = window.setTimeout(() => {
              const previousError = lastLiveSocketError
                ? " Último evento de red: " + lastLiveSocketError
                : "";
              console.warn("[Orby Voice] WebSocket setup timeout.", { previousError });
              reject(new Error("La conexión de voz está tardando demasiado. Puedes seguir estudiando por texto."));
            }, 15_000);
          }),
        ]);
        startupTimings.liveConnectMs = performance.now() - liveConnectStartedAt;
        const liveSetupStartedAt = performance.now();
        if (startupSignal.aborted) throw new DOMException("La conexión de voz fue cancelada.", "AbortError");
        await Promise.race([
          setupComplete,
          setupFailure,
          new Promise<never>((_, reject) => {
            acknowledgementTimeoutId = window.setTimeout(
              () => reject(new Error(
                "Orby no confirmó la conexión de voz. Continúa por el chat de texto."
                + (lastLiveSocketError ? " Último evento de red: " + lastLiveSocketError : ""),
              )),
              8_000,
            );
          }),
        ]);
        startupTimings.liveSetupMs = performance.now() - liveSetupStartedAt;
      } finally {
        if (connectTimeoutId !== null) window.clearTimeout(connectTimeoutId);
        if (acknowledgementTimeoutId !== null) window.clearTimeout(acknowledgementTimeoutId);
      }
      rejectSetup = null;
      liveSessionEstablished = true;
      voiceChannelRef.current = liveSession;
      setVoiceStatus("Te escucho…");
      setIsListening(true);
      console.info("[Orby Voice] Startup stage timings.", {
        ...Object.fromEntries(Object.entries(startupTimings).map(([stage, duration]) => [stage, Math.round(duration)])),
        totalMs: Math.round(performance.now() - startupStartedAt),
      });

      // Gemini closes an individual Live WebSocket after roughly ten minutes.
      // Resume the same server-side session with its latest handle instead of
      // dropping the student into push-to-talk mode at every connection reset.
      reconnectLiveSession = async () => {
        if (reconnectInFlight || !voiceModeRef.current || startupSignal.aborted) return;
        if (voiceKnowledgeToolTurnRef.current.pending) {
          // A pending function response belongs to the old socket. Do not send
          // it into a resumed channel with a stale tool-call id; recover the
          // same student question through the free turn-based tutor instead.
          cancelPendingOrbyKnowledgeRequests();
          voiceKnowledgeToolTurnRef.current = resetOrbyVoiceToolTurn();
          fallbackVoiceTurnToText("La conexión se renovó mientras Orby consultaba el Lab. Conservo tu pregunta y termino la explicación con el tutor gratuito.");
          return;
        }
        const resumeHandle = voiceSessionResumeConversationRef.current === activeConversationRef.current
          ? voiceSessionResumeHandleRef.current
          : null;
        if (!resumeHandle) {
          fallbackVoiceTurnToText("La conexión de voz necesita renovarse. No llegó un identificador seguro de reanudación; continúo con el modo alternativo sin perder tu conversación.");
          return;
        }

        reconnectInFlight = true;
        voiceChannelRef.current = null;
        setIsListening(false);
        setVoiceStatus("Renovando la conexión de voz sin cerrar tu conversación…");
        let lastReconnectError = "No se pudo reanudar la conexión.";

        try {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            if (!voiceModeRef.current || startupSignal.aborted
              || sessionGeneration !== voiceSessionGenerationRef.current) return;
            const resumedConnectionId = ++connectionSequence;
            resumeSetupComplete = false;
            let connectionClosed = false;
            let setupTimeoutId: number | null = null;
            const resumedSetup = new Promise<void>((resolve, reject) => {
              resolveResumeSetup = () => {
                resumeSetupComplete = true;
                resolve();
              };
              rejectResumeSetup = reject;
            });

            try {
              // Ephemeral Live tokens are single-use. Obtain a fresh token for
              // every resumption attempt; reusing the original token silently
              // turns a healthy resumption handle into an authentication failure.
              const resumeTokenResponse = await fetch("/api/orby/realtime-session", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                signal: AbortSignal.any([startupSignal, AbortSignal.timeout(15_000)]),
                body: JSON.stringify({
                  subject: activeSubjectRef.current,
                  topic,
                  context,
                  conversationId: activeConversationRef.current ?? conversationId,
                  history: messagesRef.current.slice(-12).map(({ role, content }) => ({ role, content })),
                }),
              });
              const resumeTokenPayload = await resumeTokenResponse.json().catch(() => ({}));
              if (!resumeTokenResponse.ok || typeof resumeTokenPayload.ephemeralToken !== "string") {
                const resumeError = typeof resumeTokenPayload.error === "string"
                  ? resumeTokenPayload.error
                  : "No se pudo renovar el acceso seguro a la voz.";
                throw new Error(resumeError);
              }
              googleAI = new voiceSdk.GoogleGenAI({
                apiKey: resumeTokenPayload.ephemeralToken,
                httpOptions: { apiVersion: "v1beta" },
              });
              const resumedSession = await googleAI.live.connect({
                model,
                config: buildLiveConfig(resumeHandle),
                callbacks: {
                  onopen: () => {
                    if (resumedConnectionId !== connectionSequence || startupSignal.aborted) return;
                    setVoiceStatus("Restaurando el contexto de Orby…");
                  },
                  onmessage: (message) => {
                    if (resumedConnectionId !== connectionSequence || startupSignal.aborted
                      || sessionGeneration !== voiceSessionGenerationRef.current) return;
                    handleLiveSocketMessage(message);
                  },
                  onerror: (event) => {
                    if (resumedConnectionId !== connectionSequence || startupSignal.aborted) return;
                    const rawError = event.error instanceof Error
                      ? event.error.message
                      : typeof event.message === "string" ? event.message : "Error de transporte.";
                    lastLiveSocketError = rawError.slice(0, 180);
                    console.warn("[Orby Voice] Resumed WebSocket error.", { message: lastLiveSocketError });
                  },
                  onclose: () => {
                    if (resumedConnectionId !== connectionSequence || startupSignal.aborted) return;
                    connectionClosed = true;
                    if (!resumeSetupComplete) {
                      rejectResumeSetup?.(new Error("La conexión se cerró antes de restaurar el contexto."));
                    } else if (voiceModeRef.current) {
                      window.setTimeout(() => {
                        if (voiceModeRef.current && !startupSignal.aborted) void reconnectLiveSession?.();
                      }, 300);
                    }
                  },
                },
              });

              await Promise.race([
                resumedSetup,
                new Promise<never>((_, reject) => {
                  setupTimeoutId = window.setTimeout(
                    () => reject(new Error("Orby tardó demasiado en restaurar el contexto de voz.")),
                    10_000,
                  );
                }),
              ]);
              if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
              if (connectionClosed) throw new Error("La conexión se cerró durante la reanudación.");
              if (!voiceModeRef.current || startupSignal.aborted
                || sessionGeneration !== voiceSessionGenerationRef.current) {
                resumedSession.close();
                return;
              }

              liveSession = resumedSession;
              voiceChannelRef.current = resumedSession;
              setVoiceError("");
              setVoiceStatus("Te escucho…");
              setIsListening(true);
              console.info("[Orby Voice] Existing Live conversation resumed.", {
                attempt: attempt + 1,
                conversationRestored: true,
              });
              return;
            } catch (error) {
              if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
              lastReconnectError = error instanceof Error ? error.message : "Error de reanudación.";
              if (/GEMINI_FREE_QUOTA_EXCEEDED|quota exceeded|RESOURCE_EXHAUSTED/i.test(lastReconnectError)) break;
              console.warn("[Orby Voice] Session resumption attempt failed.", {
                attempt: attempt + 1,
                name: error instanceof Error ? error.name : "UnknownError",
              });
              if (attempt < 2) {
                await new Promise<void>((resolve) => window.setTimeout(resolve, 450 * (attempt + 1)));
              }
            } finally {
              resolveResumeSetup = null;
              rejectResumeSetup = null;
            }
          }

          if (voiceModeRef.current && !startupSignal.aborted) {
            fallbackVoiceTurnToText("No se pudo renovar la conexión Live después de varios intentos. Continúo esta misma conversación con el modo alternativo gratuito.");
          }
          console.warn("[Orby Voice] Live session resumption exhausted.", {
            reason: lastReconnectError.slice(0, 160),
          });
        } finally {
          reconnectInFlight = false;
        }
      };

      if (startupSignal.aborted) throw new DOMException("La conexión de voz fue cancelada.", "AbortError");
      let workletTimeoutId: number | null = null;
      let abortWorkletSetup: (() => void) | null = null;
      const workletAbort = new Promise<never>((_, reject) => {
        abortWorkletSetup = () => reject(new DOMException("La conexión de voz fue cancelada.", "AbortError"));
        if (startupSignal.aborted) abortWorkletSetup();
        else startupSignal.addEventListener("abort", abortWorkletSetup, { once: true });
      });
      const workletLoadStartedAt = performance.now();
      try {
        await Promise.race([
          audioContext.audioWorklet.addModule("/audio/orby-audio-capture.worklet.js"),
          workletAbort,
          new Promise<never>((_, reject) => {
            workletTimeoutId = window.setTimeout(
              () => reject(new Error("El micrófono tardó demasiado en prepararse. Puedes continuar por texto.")),
              8_000,
            );
          }),
        ]);
      } finally {
        if (workletTimeoutId !== null) window.clearTimeout(workletTimeoutId);
        if (abortWorkletSetup) startupSignal.removeEventListener("abort", abortWorkletSetup);
      }
      startupTimings.workletLoadMs = performance.now() - workletLoadStartedAt;
      if (startupSignal.aborted) throw new DOMException("La conexión de voz fue cancelada.", "AbortError");
      await ensureVoiceAudioContextRunning(audioContext);

      const microphoneSource = audioContext.createMediaStreamSource(stream);
      voiceMicSourceRef.current = microphoneSource;
      const voiceAnalyser = audioContext.createAnalyser();
      voiceAnalyser.fftSize = 1024;
      voiceAnalyser.smoothingTimeConstant = 0.72;
      voiceAnalyserRef.current = voiceAnalyser;
      microphoneSource.connect(voiceAnalyser);
      startVoiceVisualizer(voiceAnalyser);
      const worklet = new AudioWorkletNode(audioContext, "orby-audio-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });
      voiceWorkletNodeRef.current = worklet;
      const muteGain = audioContext.createGain();
      muteGain.gain.value = 0;
      voiceMuteGainRef.current = muteGain;
      worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (sessionGeneration !== voiceSessionGenerationRef.current || startupSignal.aborted) return;
        const activeSession = voiceChannelRef.current;
        if (!activeSession || !(event.data instanceof ArrayBuffer)) return;
        try {
          activeSession.sendRealtimeInput({
            audio: {
              data: pcmBufferToBase64(event.data),
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch (error) {
          console.error("[Orby Voice] Failed to send microphone audio.", {
            name: error instanceof Error ? error.name : "UnknownError",
          });
          fallbackVoiceTurnToText("No se pudo enviar el audio. Continué esta misma pregunta por el chat.");
        }
      };
      microphoneSource.connect(worklet);
      worklet.connect(muteGain);
      muteGain.connect(audioContext.destination);

      activeConversationRef.current = activeId;
      setConversationError("");
      setVoiceStatus("Te escucho…");
      setIsListening(true);
    } catch (error) {
      throw error;
    }
  }

  function toggleVoiceMute() {
    const nextMuted = !voiceMuted;
    voiceStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setVoiceMuted(nextMuted);
    setVoiceStatus(nextMuted ? "Micrófono silenciado" : "Te escucho…");
  }

  function activateTurnBasedVoiceFallback(reason: string, pendingUserText = "", appendUserMessage = true) {
    clearPendingOrbyTeachingBoard();
    const cleanPendingText = pendingUserText.trim().slice(0, MAX_VOICE_TRANSCRIPT_CHARS);
    const staleAssistantId = voiceAssistantMessageIdRef.current;
    if (staleAssistantId && !voiceResponseDoneRef.current) {
      setMessages((current) => current.filter((message) => message.id !== staleAssistantId));
      voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
    }
    // Release the Live socket and microphone graph, but preserve the
    // already-unlocked AudioContext so the free Gemini TTS fallback can play
    // through Web Audio instead of a browser autoplay-blocked <audio> element.
    stopRealtimeVoice(false, true);
    voiceModeRef.current = true;
    voiceFallbackModeRef.current = true;
    setVoiceMode(true);
    setVoiceFallbackMode(true);
    setVoiceMuted(false);
    setWorkspaceMode("voice");
    setIsListening(false);
    setLiveTranscript("");
    setVoiceError("");
    setVoiceStatus(cleanPendingText ? "Continuando tu pregunta por turnos…" : "Modo por turnos listo · toca el micrófono para hablar");
    console.info("[Orby Voice] Switched to turn-based mode.", { reason });

    if (!cleanPendingText) {
      voiceUserTextRef.current = "";
      voiceUserMessageVisibleRef.current = false;
      voiceAssistantTextRef.current = "";
      voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
      waitingForVoiceReplyRef.current = false;
      voiceResponseDoneRef.current = false;
      voiceTurnPersistedRef.current = false;
      voicePendingStudentTurnRef.current = false;
      voiceUserMessageIdRef.current = null;
      return;
    }

    voicePendingStudentTurnRef.current = true;
    voiceUserTextRef.current = cleanPendingText;
    voiceAssistantTextRef.current = "";
    voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
    voiceUserMessageVisibleRef.current = !appendUserMessage;
    voiceLastCommittedInputRef.current = normalizeVoiceComparison(cleanPendingText);
    voiceLastCommittedInputAtRef.current = Date.now();
    voiceLastCommittedActivityGenerationRef.current = voiceActivityGenerationRef.current;
    voiceResponseDoneRef.current = false;
    voiceTurnPersistedRef.current = false;
    waitingForVoiceReplyRef.current = true;
    voicePendingStudentTurnRef.current = true;
    voiceLocalReplyInFlightRef.current = false;
    voiceOutputAudioBlockedRef.current = false;
    clearPendingGeminiAudioQueue();
    void sendMessageRef.current(cleanPendingText, false, true, undefined, appendUserMessage);
  }

  function finishVoiceCall() {
    stopAudioRecording(true);
    stopRealtimeVoice();
    setWorkspaceMode("chat");
    drainPendingMessageQueue();
  }

  async function toggleVoiceMode() {
    if (voiceModeRef.current) {
      finishVoiceCall();
      return;
    }
    // A text-chat TTS utterance must never overlap the newly opened Live channel.
    stopSpeaking();
    stopVoicePlayback();
    const startupController = new AbortController();
    voiceStartupAbortRef.current = startupController;
    voiceModeRef.current = true;
    voicePendingStudentTurnRef.current = false;
    voiceUserMessageIdRef.current = null;
    setVoiceMode(true);
    setWorkspaceMode("voice");
    setLiveTranscript("");
    setVoiceError("");
    voiceUserTextRef.current = "";
    voiceUnsupportedInputDetectedRef.current = false;
    voiceUserMessageVisibleRef.current = false;
    voiceAssistantTextRef.current = "";
    voiceResponseDoneRef.current = false;
    voiceTurnPersistedRef.current = false;
    try {
      await startRealtimeVoice(startupController.signal);
    } catch (error) {
      const wasCancelled = startupController.signal.aborted;
      const ownsStartup = voiceStartupAbortRef.current === startupController;
      const typed = error as { code?: unknown; message?: unknown };
      const errorMessage = typeof typed.message === "string" ? typed.message : "";
      const geminiQuotaReached = typed.code === "GEMINI_FREE_QUOTA_EXCEEDED"
        || /GEMINI_FREE_QUOTA_EXCEEDED|l[ií]mite gratuito de Gemini Live|resource_exhausted|quota exceeded/i.test(errorMessage);
      const authenticationFailure = /inicia sesión|sesion expirada|no autorizado|unauthorized|\b401\b|\b403\b/i.test(errorMessage);
      if (ownsStartup && !wasCancelled) {
        console.warn("[Orby Voice] Live startup failed; activating the free turn-based path.", {
          name: error instanceof Error ? error.name : "UnknownError",
          code: typeof typed.code === "string" ? typed.code : undefined,
          message: errorMessage.slice(0, 220),
          audioContextState: voiceAudioContextRef.current?.state,
        });
      }
      // A late failure from an old, cancelled startup must never tear down a
      // newer voice session. Every recoverable Live failure (quota, privacy
      // gate, network or timeout) keeps the student in voice-turn mode.
      if (ownsStartup) {
        if (!wasCancelled && !authenticationFailure) {
          activateTurnBasedVoiceFallback(
            geminiQuotaReached
              ? "La conexión en tiempo real se interrumpió. Continúo por turnos sin perder tu conversación."
              : "La voz en tiempo real no está disponible ahora. Continúo por turnos sin perder tu conversación.",
          );
        } else if (!wasCancelled) {
          stopRealtimeVoice();
          setWorkspaceMode("chat");
          setVoiceStatus("Voz no disponible");
          setVoiceError(errorMessage || "No se pudo autenticar la sesión de voz. Inicia sesión e inténtalo de nuevo.");
        }
      }
    } finally {
      if (voiceStartupAbortRef.current === startupController) voiceStartupAbortRef.current = null;
    }
  }

  function drainPendingMessageQueue() {
    const nextQueuedMessage = pendingMessagesRef.current.shift();
    setQueuedMessageCount(pendingMessagesRef.current.length);
    if (!nextQueuedMessage) return;
    window.setTimeout(() => {
      void sendMessageRef.current(nextQueuedMessage.text, false, false, nextQueuedMessage.attachmentMeta);
    }, 0);
  }

  async function sendMessage(text: string, includeAttachment = false, voiceInteraction = false, attachmentMeta?: { kind: "image" | "audio"; label: string }, appendUserMessage = true) {
    const message = text.trim();
    const previousActiveSubject = activeSubjectRef.current;
    const selectedSubject = getOrbySubjectSelectionLabel(message);
    let isVoiceInteraction = voiceInteraction || voiceModeRef.current;
    const selectedFile = includeAttachment ? attachment : null;
    if ((!message && !selectedFile) || message.length > 1200) return;

    // Do not let a newer message overtake a voice turn whose persistence
    // failed. The pending pair must remain the latest exchange so Retry can
    // prove whether the previous commit succeeded without confusing it with
    // a later, identical question. Other conversations remain available.
    if (failedVoiceTurn && failedVoiceTurn.conversationId === activeConversationRef.current) {
      setConversationError("Hay un turno de voz pendiente de guardar. Reintenta el guardado antes de enviar otra pregunta en esta conversación.");
      return;
    }

    // Ignore accidental double-submit events (Enter + click, touch double tap,
    // or a repeated browser submit) before they enter the serial message queue.
    const submissionKey = message.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("es-CO").replace(/\s+/g, " ").trim();
    const submittedAt = Date.now();
    const previousSubmission = lastSubmittedMessageRef.current;
    if (submissionKey && previousSubmission?.key === submissionKey
      && submittedAt - previousSubmission.at < 1_800) return;
    lastSubmittedMessageRef.current = submissionKey
      ? { key: submissionKey, at: submittedAt }
      : null;

    // The first history request and the first student message can otherwise
    // race: a stale empty history response clears the newly-created chat.
    // Hold text turns until hydration settles, then release them in order.
    if (workspace && historyHydratingRef.current && !isVoiceInteraction) {
      if (selectedFile) {
        setError("Espera a que termine de cargar el historial antes de adjuntar una imagen.");
        return;
      }
      if (pendingMessagesRef.current.length >= 4) {
        setError("La cola de Orby está llena. Espera a que termine de cargar el historial.");
        return;
      }
      pendingMessagesRef.current.push({ text: message, attachmentMeta });
      setQueuedMessageCount(pendingMessagesRef.current.length);
      setInput("");
      setError("");
      return;
    }

    // Voice startup must never lock the text composer. Cancel an unfinished
    // microphone/WebSocket attempt and continue with the fast text pipeline.
    if (voiceModeRef.current && !voiceChannelRef.current && !voiceFallbackModeRef.current) {
      stopRealtimeVoice();
      setWorkspaceMode("chat");
      setVoiceError("");
      setVoiceStatus("Seguimos por chat de texto");
      isVoiceInteraction = false;
    }
    if (voiceFallbackModeRef.current && message && voiceBrowserSpeechActiveRef.current) {
      // Typed text interrupts the local voice without waiting for the utterance to end.
      interruptCurrentVoiceOutput();
    }
    if ((loading || sendingRef.current) && !isVoiceInteraction) {
      if (!message || selectedFile) {
        setError("Termina la solicitud actual antes de adjuntar otro archivo.");
        return;
      }
      if (pendingMessagesRef.current.length >= 4) {
        setError("La cola de Orby está llena. Espera a que responda antes de enviar otra pregunta.");
        return;
      }
      pendingMessagesRef.current.push({ text: message, attachmentMeta });
      setQueuedMessageCount(pendingMessagesRef.current.length);
      setInput("");
      setError("");
      return;
    }
    if (workspace && selectedFile?.type.startsWith("image/") && imageAssets.length >= 20) {
      setAttachmentError("Tu almacenamiento llegó al límite de 20 imágenes. Elimina una desde «Administrar almacenamiento» para poder enviar otra.");
      setImageStorageError("Almacenamiento completo · 20 de 20 imágenes. Libera espacio para continuar.");
      return;
    }
    if (voiceModeRef.current && voiceChannelRef.current && message && !selectedFile) {
      // Typed text is an explicit barge-in: stop the previous answer now,
      // discard stale audio chunks, and process the new turn immediately.
      interruptCurrentVoiceOutput();
      pendingMessagesRef.current = [];
      setQueuedMessageCount(0);
      const typedVoiceContext = [
        ...messagesRef.current.slice(-8).map(({ role, content }) => role + ": " + content),
        voiceLastAssistantOutputRef.current,
        "Área de estudio: " + previousActiveSubject,
        "Tema de estudio: " + topic,
        question,
        context,
      ].filter(Boolean).join("\n").slice(-5_000);
      const typedPreflight = preflightOrbyRequest(message, typedVoiceContext);
      // Keep ordinary allowed messages (including English selection, subject changes,
      // follow-ups and study guidance) on Gemini Live. Local text-only shortcuts
      // forced every such turn through quota-limited Gemini TTS.
      const localReply = !typedPreflight.allowed ? typedPreflight.reply : null;
      if (localReply) {
        requestLivePolicyReply(message, localReply, true);
        return;
      }
      if (selectedSubject && typedPreflight.allowed) activeSubjectRef.current = selectedSubject;
      waitingForVoiceReplyRef.current = true;
      voiceRealtimeAudioChunkCountRef.current = 0;
      voiceOutputTranscriptValidatedRef.current = false;
      voiceOutputAudioBlockedRef.current = false;
      clearPendingGeminiAudioQueue();
      voiceAssistantTextRef.current = "";
      voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
      voiceUserTextRef.current = message;
      voiceUnsupportedInputDetectedRef.current = false;
      voiceInputPolicyRef.current = typedPreflight.allowed
        ? null
        : typedPreflight.category === "programming" ? "programming" : "outside";
      voicePreflightReplyRef.current = typedPreflight.allowed ? null : typedPreflight.reply;
      // Typed text is a new voice turn and is already visible below.
      // Mark its transcript as committed so Live ASR cannot append a duplicate.
      voiceActivityGenerationRef.current += 1;
      voiceLastCommittedInputRef.current = normalizeVoiceComparison(message);
      voiceLastCommittedInputAtRef.current = Date.now();
      voiceLastCommittedActivityGenerationRef.current = voiceActivityGenerationRef.current;
      voicePendingStudentTurnRef.current = true;
      voiceUserMessageIdRef.current = "voice-user-" + Date.now();
      voiceResponseDoneRef.current = false;
      voiceTurnPersistedRef.current = false;
      voiceUserMessageVisibleRef.current = true;
      setMessages((current) => [...current, { id: voiceUserMessageIdRef.current ?? ("voice-user-" + Date.now()), role: "user", content: message }]);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "48px";
      try {
        // Typed messages are complete user turns, not microphone fragments.
        // Use explicit turnComplete so Live never waits for audio VAD to close them.
        voiceChannelRef.current.sendClientContent({
          turns: [{ role: "user", parts: [{ text: message }] }],
          turnComplete: true,
        });
      } catch {
        waitingForVoiceReplyRef.current = false;
        setVoiceError("No se pudo enviar el mensaje al canal de voz. Vuelve a intentarlo.");
        setVoiceStatus("Te escucho…");
        setIsListening(true);
        return;
      }
      setVoiceStatus("Orby está pensando…");
      armVoiceResponseWatchdog();
      return;
    }
    sendingRef.current = true;
    const requestGeneration = ++textRequestGenerationRef.current;
    const chatGeneration = chatViewGenerationRef.current;
    const requestController = new AbortController();
    activeTextRequestRef.current = requestController;
    const isCurrentRequest = () => requestGeneration === textRequestGenerationRef.current
      && chatGeneration === chatViewGenerationRef.current
      && !requestController.signal.aborted;

    let targetConversationId = conversationId;
    if (workspace && !targetConversationId) {
      try {
        const createResponse = await fetch("/api/orby/conversations", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.any([requestController.signal, AbortSignal.timeout(12_000)]),
          body: JSON.stringify({ subject: activeSubjectRef.current, topic }),
        });
        const createPayload = await createResponse.json().catch(() => ({}));
        if (!isCurrentRequest()) return;
        if (!createResponse.ok || !createPayload.conversation?.id) {
          throw new Error(createPayload.error || "No se pudo crear el chat.");
        }
        targetConversationId = String(createPayload.conversation.id);
        activeConversationRef.current = targetConversationId;
        setConversationId(targetConversationId);
        setConversations((current) => [createPayload.conversation as Conversation, ...current]);
      } catch (caught) {
        if (!isCurrentRequest()) return;
        setConversationError(caught instanceof Error ? caught.message : "No se pudo crear el chat.");
        activeTextRequestRef.current = null;
        sendingRef.current = false;
        drainPendingMessageQueue();
        return;
      }
    }

    let imagePayload: { mimeType: string; base64: string } | undefined;
    try {
      if (selectedFile) imagePayload = { mimeType: selectedFile.type, base64: await fileToBase64(selectedFile) };
    } catch (caught) {
      setAttachmentError(caught instanceof Error ? caught.message : "No se pudo leer la imagen.");
      sendingRef.current = false;
      drainPendingMessageQueue();
      return;
    }
    if (!isCurrentRequest()) return;
    const previousMessages = messagesRef.current;
    const nextMessages: Message[] = appendUserMessage ? [...previousMessages, {
      id: "user-" + crypto.randomUUID(),
      role: "user",
      content: message || "Analiza la imagen adjunta.",
      ...(selectedFile && imagePayload ? { attachmentName: selectedFile.name, attachmentPreview: selectedFile.type.startsWith("image/") ? `data:${selectedFile.type};base64,${imagePayload.base64}` : "", attachmentKind: "image" as const } : {}),
      ...(attachmentMeta ? { attachmentName: attachmentMeta.label, attachmentKind: attachmentMeta.kind } : {}),
    }] : previousMessages;
    if (appendUserMessage) {
      messagesRef.current = nextMessages;
      setMessages(nextMessages);
    }
    if (isVoiceInteraction && voiceFallbackModeRef.current) {
      voiceUserTextRef.current = message;
      voiceUserMessageVisibleRef.current = appendUserMessage || voiceUserMessageVisibleRef.current;
      voiceResponseDoneRef.current = false;
      voiceTurnPersistedRef.current = false;
    }
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
        signal: AbortSignal.any([requestController.signal, AbortSignal.timeout(60_000)]),
        body: JSON.stringify({
          subject: activeReview?.subject ?? activeSubjectRef.current,
          topic: activeReview?.topic ?? topic,
          stage,
          question: activeReview?.prompt ?? question,
          context: [reviewContext, ocrText ? `Texto OCR extraído localmente de la imagen (puede contener errores):\n${ocrText}` : ""].filter(Boolean).join("\n\n").slice(0, 10000),
          message,
          conversationId: targetConversationId,
          attachmentKind: attachmentMeta?.kind ?? (selectedFile ? "image" : null),
          attachmentLabel: attachmentMeta?.label ?? (selectedFile ? "Imagen adjunta" : null),
          voiceMode: isVoiceInteraction,
          workspace,
          history: messagesRef.current.slice(-8).map(({ role, content }) => ({ role, content })),
          ...(imagePayload ? { image: imagePayload } : {}),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!isCurrentRequest()) return;
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Orby no está disponible por ahora.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("La respuesta llegó incompleta. Inténtalo de nuevo.");
      if (selectedSubject) activeSubjectRef.current = selectedSubject;
      const fallbackAssistantId = isVoiceInteraction && voiceFallbackModeRef.current
        ? "voice-fallback-assistant-" + Date.now()
        : undefined;
      const assistantMessage: Message = {
        id: fallbackAssistantId ?? ("assistant-" + crypto.randomUUID()),
        role: "assistant",
        content: data.reply,
        ...(data.board && typeof data.board === "object" ? { board: data.board as OrbyBoardData } : {}),
        ...(typeof data.boardPersistenceWarning === "string" ? { boardPersistenceWarning: data.boardPersistenceWarning } : {}),
        checkQuestion: typeof data.checkQuestion === "string" ? data.checkQuestion : "",
        sources: Array.isArray(data.sources) ? data.sources.filter((source: unknown): source is OrbyPublicSource => {
          if (!source || typeof source !== "object") return false;
          const item = source as Record<string, unknown>;
          return typeof item.title === "string" && typeof item.url === "string"
            && /^https:\/\/(?:es\.wikipedia\.org\/wiki\/|openalex\.org\/W\d+|doi\.org\/)/i.test(item.url)
            && typeof item.publisher === "string"
            && (item.publishedAt === null || typeof item.publishedAt === "string")
            && Number.isInteger(item.citationNumber) && Number(item.citationNumber) >= 1
            && (item.kind === "encyclopedia" || item.kind === "research");
        }).slice(0, 4) : [],
      };
      setMessages((current) => dedupeAdjacentAssistantMessages([...current, assistantMessage]));
      if (workspace && selectedFile && selectedFile.type.startsWith("image/")) {
        // Persist the optional gallery copy after the answer is visible. Storage
        // maintenance must not hold the send lock or delay the next study turn.
        void (async () => {
          try {
            const imageForm = new FormData();
            imageForm.set("image", selectedFile);
            const imageResponse = await fetch("/api/orby/images", {
              method: "POST",
              credentials: "same-origin",
              signal: AbortSignal.timeout(12_000),
              body: imageForm,
            });
            const imagePayload = await imageResponse.json().catch(() => ({}));
            if (!imageResponse.ok) throw new Error(imagePayload.error || "La imagen se envió al chat, pero no pudo guardarse en tu almacenamiento.");
            await refreshImageAssets();
            setImageStorageError("");
          } catch (caught) {
            setImageStorageError(caught instanceof Error ? caught.message : "No se pudo guardar la imagen.");
          }
        })();
      }
      if (isVoiceInteraction && voiceFallbackModeRef.current) {
        voiceAssistantTextRef.current = data.reply;
        voiceAssistantMessageIdRef.current = fallbackAssistantId ?? ("voice-fallback-assistant-" + Date.now());
        voiceResponseDoneRef.current = true;
        voiceTurnPersistedRef.current = false;
        waitingForVoiceReplyRef.current = true;
        voiceInputPolicyRef.current = null;
        voicePreflightReplyRef.current = null;
        setVoiceError("");
        setVoiceStatus("Orby está preparando la respuesta hablada…");
        void speakText(data.reply, nextMessages.length, typeof data.checkQuestion === "string" ? data.checkQuestion : "");
      } else if (isVoiceInteraction) {
        setVoiceError("La voz en tiempo real se interrumpió. La respuesta quedó disponible por escrito.");
      }
      if (workspace) {
        void refreshConversations().catch((caught: unknown) => {
          setConversationError(caught instanceof Error ? caught.message : "No se pudo actualizar el historial.");
        });
      }
      setPendingAttachmentMeta(null);
    } catch (caught) {
      if (!isCurrentRequest()) return;
      setError(caught instanceof Error ? caught.message : "Ocurrió un error. Inténtalo otra vez.");
      if (isVoiceInteraction && voiceFallbackModeRef.current) {
        waitingForVoiceReplyRef.current = false;
        voiceResponseDoneRef.current = false;
        voiceTurnPersistedRef.current = false;
        setVoiceStatus("Voz alternativa en espera");
        setVoiceError(caught instanceof Error
          ? caught.message
          : "Cloudflare no pudo procesar la pregunta. No se activará ningún servicio de pago; puedes intentar de nuevo o escribirla.");
        setIsListening(false);
      } else if (isVoiceInteraction) {
        waitingForVoiceReplyRef.current = false;
        voiceModeRef.current = false;
        setVoiceMode(false);
      }
    } finally {
      // An older aborted request must not unlock or drain the queue of a newer chat.
      if (requestGeneration === textRequestGenerationRef.current
        && chatGeneration === chatViewGenerationRef.current) {
        if (activeTextRequestRef.current === requestController) activeTextRequestRef.current = null;
        sendingRef.current = false;
        setLoading(false);
        drainPendingMessageQueue();
      }
    }
  }

  useEffect(() => {
    sendMessageRef.current = sendMessage;
    stopAudioRecordingRef.current = stopAudioRecording;
    stopRealtimeVoiceRef.current = stopRealtimeVoice;
  });

  useEffect(() => {
    if (!open) {
      stopAudioRecordingRef.current(true);
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      stopRealtimeVoiceRef.current(false);
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
    setIsListening(false);
    stopAudioRecording(true);
    clearRecordedAudio();
    clearAttachment();
    setAttachmentError("");
    setOcrText("");
    setPendingAttachmentMeta(null);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    stopRealtimeVoice();
    waitingForVoiceReplyRef.current = false;
    setNotebookOpen(false);
    onOpenChange(false);
  }

  async function generateVisualAid() {
    const visualPrompt = input.trim();
    if (visualPrompt.length < 5 || loading || imageGenerationLoading || sendingRef.current) {
      if (visualPrompt.length < 5) setError("Escribe el concepto o tema que quieres convertir en una imagen educativa.");
      return;
    }

    setImageGenerationLoading(true);
    setError("");
    setAttachmentError("");
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "48px";
    const userContent = "Crear una imagen educativa: " + visualPrompt;
    setMessages((current) => [...current, { id: "user-" + crypto.randomUUID(), role: "user", content: userContent }]);

    let targetId = conversationId;
    try {
      if (workspace && !targetId) {
        const createResponse = await fetch("/api/orby/conversations", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: activeSubjectRef.current, topic }),
        });
        const createPayload = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok || !createPayload.conversation?.id) {
          throw new Error(createPayload.error || "No se pudo iniciar la conversación.");
        }
        targetId = String(createPayload.conversation.id);
        activeConversationRef.current = targetId;
        setConversationId(targetId);
        setConversations((current) => [createPayload.conversation as Conversation, ...current]);
      }

      const previousExplanation = messages
        .filter((item) => item.role === "assistant")
        .slice(-2)
        .map((item) => item.content)
        .join("\\n")
        .slice(0, 1600);
      const response = await fetch("/api/orby/generate-image", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: visualPrompt,
          subject: activeSubjectRef.current,
          topic,
          context: [context, previousExplanation].filter(Boolean).join("\\n\\n").slice(0, 1800),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) setError(payload.error || "Alcanzaste el límite diario de imágenes educativas.");
        else throw new Error(payload.error || "No se pudo generar la imagen educativa.");
        return;
      }
      if (typeof payload.imageDataUrl !== "string" || !payload.imageDataUrl.startsWith("data:image/")) {
        throw new Error("Orby no devolvió una imagen válida. Inténtalo de nuevo.");
      }

      const caption = typeof payload.caption === "string"
        ? payload.caption
        : "Aquí tienes un apoyo visual para estudiar este concepto.";
      setMessages((current) => [...current, {
        id: "assistant-" + crypto.randomUUID(),
        role: "assistant",
        content: caption,
        generatedImage: payload.imageDataUrl,
      }]);

      if (workspace && targetId) {
        const persistResponse = await fetch("/api/orby/realtime-turn", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: targetId, userContent, assistantContent: caption }),
        });
        if (persistResponse.ok) {
          void refreshConversations().catch(() => setConversationError("La imagen se generó, pero no se pudo actualizar el historial."));
        } else {
          setConversationError("La imagen se generó, pero no se pudo guardar su referencia en el historial. Descárgala para conservarla.");
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo generar la imagen educativa.");
    } finally {
      setImageGenerationLoading(false);
    }
  }

  async function refreshConversations() {
    if (!workspace) return;
    const response = await fetch("/api/orby/conversations", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el historial.");
    setConversations(Array.isArray(payload.conversations) ? payload.conversations as Conversation[] : []);
  }

  function startNewConversation() {
    clearPendingOrbyTeachingBoard();
    chatViewGenerationRef.current += 1;
    textRequestGenerationRef.current += 1;
    activeTextRequestRef.current?.abort();
    activeTextRequestRef.current = null;
    sendingRef.current = false;
    setLoading(false);
    activeSubjectRef.current = subject;
    voiceRecentAssistantOutputsRef.current = [];
    voiceLastAssistantOutputRef.current = "";
    voiceLastAssistantOutputAtRef.current = 0;
    voiceLastAssistantPlaybackUntilRef.current = 0;
    pendingMessagesRef.current = [];
    setQueuedMessageCount(0);
    voiceSessionResumeHandleRef.current = null;
    voiceSessionResumeConversationRef.current = null;
    voiceSessionResumeUpdatedAtRef.current = 0;
    stopAudioRecording(true);
    activeConversationRef.current = null;
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setConversationError("");
    setPendingDeleteConversation(null);
    setLearningView("chat");
    setWorkspaceMode("chat");
    setAttachmentError("");
    clearAttachment();
    clearRecordedAudio();
    setPendingAttachmentMeta(null);
    stopRealtimeVoice();
    setIsListening(false);
    stopSpeaking();
    inputRef.current?.focus();
  }

  async function selectConversation(id: string) {
    clearPendingOrbyTeachingBoard();
    if (id === activeConversationRef.current) {
      setLearningView("chat");
      setWorkspaceMode("chat");
      setConversationError("");
      if (window.matchMedia("(max-width: 767px)").matches) setHistoryOpen(false);
      return;
    }
    chatViewGenerationRef.current += 1;
    textRequestGenerationRef.current += 1;
    activeTextRequestRef.current?.abort();
    activeTextRequestRef.current = null;
    sendingRef.current = false;
    setLoading(false);
    pendingMessagesRef.current = [];
    setQueuedMessageCount(0);
    const selectedConversation = conversations.find((item) => item.id === id);
    if (voiceModeRef.current) stopRealtimeVoice();
    voiceRecentAssistantOutputsRef.current = [];
    voiceLastAssistantOutputRef.current = "";
    voiceLastAssistantOutputAtRef.current = 0;
    voiceLastAssistantPlaybackUntilRef.current = 0;
    voiceSessionResumeHandleRef.current = null;
    voiceSessionResumeConversationRef.current = null;
    voiceSessionResumeUpdatedAtRef.current = 0;
    setWorkspaceMode("chat");
    setLearningView("chat");
    setHistoryLoading(true);
    setConversationError("");
    try {
      const response = await fetch(`/api/orby/conversations/${id}/messages`, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok && response.status === 404) {
        activeConversationRef.current = null;
        activeSubjectRef.current = subject;
        setConversationId(null);
        setMessages([]);
        setConversationError("Esta versión del sitio todavía no puede abrir los mensajes guardados. Tu historial sigue conservado; puedes continuar en un chat nuevo.");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "No se pudo abrir la conversación.");
      pendingMessagesRef.current = [];
      setQueuedMessageCount(0);
      activeConversationRef.current = id;
      restoreActiveSubjectFromStoredConversation(selectedConversation?.subject, payload.messages);
      setConversationId(id);
      setMessages(dedupeAdjacentAssistantMessages(Array.isArray(payload.messages) ? payload.messages.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        role: item.role === "assistant" ? "assistant" : "user",
        content: typeof item.content === "string" ? item.content : "",
        checkQuestion: typeof item.check_question === "string" ? item.check_question : "",
        ...(item.teaching_board && typeof item.teaching_board === "object" ? { board: item.teaching_board as OrbyBoardData } : {}),
        attachmentKind: item.attachment_kind === "audio" || item.attachment_kind === "image" ? item.attachment_kind : undefined,
        attachmentName: typeof item.attachment_label === "string" ? item.attachment_label : undefined,
        createdAt: typeof item.created_at === "string" ? item.created_at : undefined,
      })) : []));
      setError("");
      setInput("");
      setPendingDeleteConversation(null);
      setLearningView("chat");
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
    // In turn-based fallback mode, a new recording is the next user turn.
    // Stop the local voice first so the microphone never captures Orby's reply.
    if (voiceFallbackModeRef.current && voiceBrowserSpeechActiveRef.current) {
      interruptCurrentVoiceOutput();
    }
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
        setVoiceError("Llegaste al límite de 5 minutos. Revisa la nota de voz antes de enviarla.");
        stopAudioRecording();
      }, MAX_VOICE_RECORDING_MS);
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
      // Validate the actual captured speech before asking an AI to transcribe it.
      // Short utterances such as "ok" must never become long hallucinated sentences.
      const decoder = new AudioContext();
      let activeSpeechSeconds = 0;
      try {
        const decoded = await decoder.decodeAudioData(await audioToTranscribe.arrayBuffer());
        const channel = decoded.getChannelData(0);
        const windowSize = Math.max(1, Math.floor(decoded.sampleRate * 0.02));
        for (let offset = 0; offset < channel.length; offset += windowSize) {
          const end = Math.min(channel.length, offset + windowSize);
          let energy = 0;
          for (let index = offset; index < end; index += 1) energy += channel[index] * channel[index];
          const rms = Math.sqrt(energy / Math.max(1, end - offset));
          if (rms > 0.012) activeSpeechSeconds += (end - offset) / decoded.sampleRate;
        }
      } finally {
        await decoder.close().catch(() => undefined);
      }
      if (activeSpeechSeconds < 0.12) {
        throw new Error("No detecté voz clara. No voy a inventar una transcripción; vuelve a grabar hablando cerca del micrófono.");
      }
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
      const transcript = payload.transcript.trim().slice(0, MAX_VOICE_TRANSCRIPT_CHARS);
      // In turn-based Whisper mode, ignore a speaker echo only while TTS is
      // actually playing or during the short acoustic tail after its final chunk.
      // A 25-second window swallowed valid "sí/no/¿por qué?" student turns.
      const recentAssistantSpeech = voiceBrowserSpeechActiveRef.current
        || Date.now() <= voiceLastAssistantPlaybackUntilRef.current + 1_000;
      if (voiceFallbackModeRef.current && recentAssistantSpeech
        && isLikelyVoicePlaybackEcho(transcript, getRecentVoiceAssistantOutputs())) {
        // Turn-based Whisper can capture the laptop speaker after Orby finishes.
        // Discard a near-verbatim match instead of treating Orby's greeting as a student question.
        setLiveTranscript("");
        setVoiceError("Ignoré el audio de Orby captado por el micrófono. Espera a que termine de hablar y graba tu pregunta.");
        return;
      }
      if (ambiguousShortProgrammingTranscript(transcript)) {
        const clarification = "Creo que la transcripción pudo confundir una palabra. ¿Dijiste «lectura» o te referías a otra área de Saber 11? Repítela brevemente para no bloquear una pregunta válida.";
        if (voiceFallbackModeRef.current && voiceModeRef.current) {
          voiceUserTextRef.current = transcript;
          voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
          voiceUserMessageVisibleRef.current = false;
          voiceResponseDoneRef.current = true;
          waitingForVoiceReplyRef.current = true;
          setLiveTranscript(transcript);
          respondToVoiceLocally(transcript, clarification, true);
        } else {
          setInput("");
          setVoiceError(clarification);
        }
        return;
      }
      const plausibleCharacterLimit = Math.max(32, Math.ceil(activeSpeechSeconds * 34 + 18));
      if (transcript.length > plausibleCharacterLimit) {
        throw new Error("La transcripción no coincide con la duración de tu voz. La descarté para evitar texto inventado; graba de nuevo.");
      }

      if (audioOverride) {
        setRecordedAudio(null);
        setRecordedAudioPreviewUrl("");
        setAudioSource("recording");
      } else {
        clearRecordedAudio();
      }

      // Gemini quota recovery: transcribe with Cloudflare Whisper, send the
      // text through the Cloudflare tutor, and read the answer locally.
      // The user speaks one turn at a time; no Gemini call is made here.
      if (voiceFallbackModeRef.current && voiceModeRef.current && audioOrigin === "recording") {
        voiceUserTextRef.current = transcript;
        voiceAssistantTextRef.current = "";
        voiceAssistantMessageIdRef.current = null;
        voicePublicSourcesRef.current = [];
        voiceUserMessageVisibleRef.current = false;
        voiceLastCommittedInputRef.current = normalizeVoiceComparison(transcript);
        voiceLastCommittedInputAtRef.current = Date.now();
        voiceResponseDoneRef.current = false;
        voiceTurnPersistedRef.current = false;
        waitingForVoiceReplyRef.current = true;
        setLiveTranscript(transcript);
        setVoiceStatus("Orby está procesando tu pregunta…");
        setVoiceError("");
        void sendMessageRef.current(transcript, false, true, {
          kind: "audio",
          label: "Pregunta de voz transcrita",
        });
        return;
      }

      setInput(transcript);
      setPendingAttachmentMeta({ kind: "audio", label: audioOrigin === "upload" ? "Audio adjunto transcrito" : "Nota de voz transcrita" });
      setError("");
      inputRef.current?.focus();
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : "No se pudo transcribir el audio.";
      setVoiceError(errorMessage);
      if (voiceFallbackModeRef.current) {
        setVoiceStatus(errorMessage.toLowerCase().includes("cuota gratuita")
          ? "Cuota gratuita de transcripción agotada"
          : "Voz alternativa en espera");
        setIsListening(false);
      }
    } finally {
      setAudioTranscribing(false);
    }
  }

  if (!open) return null;
  const activeVoiceAssistantMessage = voiceAssistantMessageIdRef.current
    ? messages.find((message) => message.id === voiceAssistantMessageIdRef.current && message.role === "assistant")
    : undefined;
  const assistantVoiceSubtitle = activeVoiceAssistantMessage?.content?.trim() || voiceAssistantTextRef.current.trim();
  let subtitleWordIndex = 0;
  const assistantSubtitleContent = assistantVoiceSubtitle
    ? assistantVoiceSubtitle.split(/(\\s+)/u).map((part, index) => {
        if (/^\\s+$/u.test(part)) return <span key={`subtitle-space-${index}`}>{part}</span>;
        const wordIndex = subtitleWordIndex;
        subtitleWordIndex += 1;
        const active = voiceSubtitlePlaybackActive && wordIndex === voiceSubtitleWordIndex;
        return <span
          key={`subtitle-word-${wordIndex}`}
          data-orby-subtitle-word={wordIndex}
          aria-current={active ? "true" : undefined}
          className={active
            ? "rounded bg-amber-300/20 px-0.5 font-bold text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-4 transition-colors duration-100"
            : "text-slate-100"}
        >{part}</span>;
      })
    : null;

  function saveCurrentBoardAsNote() {
    const board = activeVoiceAssistantMessage?.board;
    if (!board) return;
    const sections = [
      "# " + (board.title || "Apuntes de clase"),
      ...board.blocks.map((block) => {
        if (block.type === "heading") return "\n## " + block.text;
        if (block.type === "step") return "**" + block.label + ":** " + block.text;
        if (block.type === "formula") return "`" + block.text + "`";
        if (block.type === "callout") return "> " + block.text;
        return block.text;
      }),
      ...(board.visuals ?? []).map((visual) => {
        const detail = visual.type === "sketch"
          ? visual.strokes.map((stroke) => stroke.label).filter(Boolean).join(", ")
          : visual.type === "diagram"
            ? visual.nodes.map((node) => node.label).join(" → ")
            : visual.type === "table"
              ? [visual.headers.join(" | "), ...visual.rows.map((row) => row.join(" | "))].join("\n")
              : "";
        return "**Apoyo visual — " + (visual.title || visual.type) + ":** " + (detail || "Se conserva la descripción estructurada de este recurso.");
      }),
    ].filter(Boolean);
    const visualData = JSON.stringify(board.visuals ?? []).slice(0, 2600);
    const content = (sections.join("\n\n") + "\n\n## Datos de los apoyos visuales\n```json\n" + visualData + "\n```").slice(0, 7900);
    void saveLearningItem("note", board.title || "Apuntes de clase", content);
  }

  return (
    <>
    <aside id="orby-tutor-panel" data-orby-theme={globalTheme} data-orby-workspace={workspace ? "true" : "false"} aria-label="Tutor de inteligencia artificial Orby" className={workspace
      ? "relative z-[80] flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border-0 bg-white text-slate-900 shadow-none"
      : "fixed inset-x-3 bottom-[76px] z-[60] flex max-h-[min(720px,calc(100dvh-100px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_90px_rgba(0,0,0,.5)] sm:inset-x-auto sm:right-5 sm:top-[88px] sm:bottom-[82px] sm:w-[390px] lg:right-7 lg:w-[410px]"}>
      <header className="flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[#25282d] bg-[#0b0d10] px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/10 text-orange-400"><AudioLines className="h-5 w-5" /></div>
          <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="text-[15px] font-semibold tracking-tight text-white">Orby AI</h1><span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-300">Tutor ICFES</span></div><p className="mt-0.5 text-[11px] text-[#858b95]">Tu espacio de estudio</p></div>
        </div>
        <div className="flex items-center gap-1.5">
          {workspace && <button type="button" onClick={() => setHistoryOpen((value) => !value)} aria-label={historyOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"} title="Panel lateral" className="rounded-lg p-2 text-[#a3a8b0] transition hover:bg-white/5 hover:text-white md:hidden"><Search className="h-4 w-4" /></button>}
          {workspace && <button type="button" onClick={handleCloseTutor} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-300 transition duration-200 hover:border-rose-400 hover:bg-rose-600 hover:text-white hover:shadow-[0_5px_22px_rgba(225,29,72,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">Salir <X className="h-3.5 w-3.5" /></button>}
          {!workspace && <button type="button" onClick={handleCloseTutor} aria-label="Cerrar tutor Orby" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>}
        </div>
      </header>

      <div className={workspace ? "flex min-h-0 flex-1 bg-[#0b0d10]" : "contents"}>
        {workspace && <aside className={historyOpen ? "absolute bottom-0 left-0 top-[68px] z-30 flex w-[min(86%,310px)] flex-col border-r border-[#25282d] bg-[#0d0f12] text-white shadow-2xl md:relative md:top-auto md:z-auto md:w-[286px] md:shrink-0 md:shadow-none" : "hidden md:relative md:flex md:w-[286px] md:shrink-0 md:flex-col border-r border-[#25282d] bg-[#0d0f12] text-white"} aria-label="Herramientas de Orby">
          <div className="border-b border-white/[0.07] p-4">
            <button type="button" onClick={startNewConversation} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#f28a18] px-3 text-[13px] font-semibold text-[#17120c] transition hover:bg-[#ffa12f]"><Plus className="h-4 w-4" /> Nuevo chat</button>
            <div className="mt-5 flex items-center justify-between px-1"><p className="orby-pixel-label font-semibold uppercase tracking-[0.14em] text-[#777e88]">Historial</p><span className="text-[10px] tabular-nums text-[#777e88]">{conversations.length}/50</span></div>
            <label className="mt-2 flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5"><Search className="h-3.5 w-3.5 shrink-0 text-[#777e88]"/><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Buscar conversación…" aria-label="Buscar conversación" className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-[#737a84]"/></label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:thin] [scrollbar-color:#34383e_transparent]">
            {isHistoryLoading && <div className="flex items-center gap-2 px-2 py-3 text-xs text-[#858b95]"><LoaderCircle className="h-4 w-4 animate-spin" /> Cargando chats…</div>}
            {!isHistoryLoading && conversations.length === 0 && <p className="px-3 py-4 text-xs leading-5 text-[#858b95]">Tus conversaciones aparecerán aquí.</p>}
            {conversations.filter((item) => `${item.title} ${item.subject} ${item.topic}`.toLocaleLowerCase("es-CO").includes(historyQuery.trim().toLocaleLowerCase("es-CO"))).map((item) => <div key={item.id} className={conversationId === item.id ? "group rounded-lg border border-orange-400/20 bg-orange-500/[0.08] px-2 py-2" : "group rounded-lg border border-transparent px-2 py-2 transition hover:bg-white/[0.04]"}>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void selectConversation(item.id)} className="min-w-0 flex-1 rounded-md py-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-orange-400">
                  <span className="block truncate text-[12px] font-medium text-[#e7e9ed]">{item.title}</span>
                  <span className="mt-1 block truncate text-[10px] text-[#777e88]">{item.topic || item.subject} · {new Date(item.updated_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                </button>
                <button type="button" onClick={() => setPendingDeleteConversation((current) => current === item.id ? null : item.id)} aria-label={"Eliminar chat " + item.title} title="Eliminar conversación" className="rounded-md p-1.5 text-[#777e88] opacity-100 transition hover:bg-rose-500/10 hover:text-rose-300 md:opacity-0 md:group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {pendingDeleteConversation === item.id && <div className="mt-2 rounded-md border border-rose-500/20 bg-[#17191d] p-2"><p className="text-[10px] text-[#b9bec6]">¿Eliminar este chat y sus mensajes?</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => void deleteConversation(item.id)} className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white">Eliminar</button><button type="button" onClick={() => setPendingDeleteConversation(null)} className="rounded-md px-2 py-1 text-[10px] text-[#a6acb5] hover:bg-white/5">Cancelar</button></div></div>}
            </div>)}
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <p className="px-2 pb-2 orby-pixel-label font-semibold uppercase tracking-[0.14em] text-[#777e88]">Aprendizaje</p>
              <button type="button" onClick={() => setLearningView("notes")} className={learningView === "notes" ? "flex w-full items-center gap-2.5 rounded-lg bg-white/[0.07] px-3 py-2.5 text-left text-[12px] font-medium text-white" : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] text-[#a8aeb7] transition hover:bg-white/[0.04] hover:text-white"}>Mis apuntes <span className="ml-auto text-[10px] tabular-nums text-[#777e88]">{learningItems.filter((item) => item.kind === "note").length}</span></button>
              <button type="button" onClick={() => setLearningView("topics")} className={learningView === "topics" ? "flex w-full items-center gap-2.5 rounded-lg bg-white/[0.07] px-3 py-2.5 text-left text-[12px] font-medium text-white" : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] text-[#a8aeb7] transition hover:bg-white/[0.04] hover:text-white"}>Temas guardados <span className="ml-auto text-[10px] tabular-nums text-[#777e88]">{learningItems.filter((item) => item.kind === "topic").length}</span></button>
              <button type="button" onClick={() => setLearningView("progress")} className={learningView === "progress" ? "flex w-full items-center gap-2.5 rounded-lg bg-white/[0.07] px-3 py-2.5 text-left text-[12px] font-medium text-white" : "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] text-[#a8aeb7] transition hover:bg-white/[0.04] hover:text-white"}>Progreso de aprendizaje</button>
            </div>
            <div className="mt-5 border-t border-white/[0.07] pt-4">
              <div className="flex items-center justify-between px-2"><p className="orby-pixel-label font-semibold uppercase tracking-[0.14em] text-[#777e88]">Almacenamiento</p><span className="text-[10px] tabular-nums text-[#a8aeb7]">{imageAssets.length}/20</span></div>
              <div className="mx-2 mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-[#f28a18] transition-all" style={{ width: Math.min(100, imageAssets.length / 20 * 100) + "%" }} /></div>
              <div className="mt-3 grid grid-cols-4 gap-1.5 px-2">
                {imageAssets.slice(0, 8).map((asset) => <div key={asset.path} className="group/image relative aspect-square overflow-hidden rounded-md border border-white/10 bg-[#17191d]"><Image src={asset.signedUrl} alt={asset.name} fill unoptimized className="object-cover" /><button type="button" onClick={() => void deleteStoredImage(asset.path)} aria-label={"Eliminar " + asset.name} title="Eliminar imagen" className="absolute inset-0 flex items-center justify-center bg-black/65 text-white opacity-0 transition group-hover/image:opacity-100 focus:opacity-100"><Trash2 className="h-4 w-4" /></button></div>)}
                {imageAssets.length === 0 && <p className="col-span-4 py-2 text-[10px] leading-4 text-[#777e88]">{imageAssetsLoading ? "Cargando imágenes…" : "Las imágenes que envíes aparecerán aquí."}</p>}
              </div>
              <button type="button" onClick={() => setLearningView("storage")} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-medium text-[#b4bac3] transition hover:border-orange-500/30 hover:text-white"><Images className="h-3.5 w-3.5" /> Administrar almacenamiento</button>
              {imageStorageError && <p role="alert" className="px-2 pt-2 text-[10px] leading-4 text-rose-300">{imageStorageError}</p>}
            </div>
          </div>
          <div className="border-t border-white/[0.07] px-4 py-3 text-[10px] leading-4 text-[#777e88]">Tus chats y archivos son privados de tu cuenta.</div>
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

      <div className={workspace && workspaceMode === "voice" ? "hidden" : `min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${workspace && voiceMode && workspaceMode === "chat" ? "pb-44" : ""}`} ref={scrollRef} aria-live="polite">
        {workspace && learningView !== "chat" ? (
          <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
              <div>
                <p className="orby-pixel-label text-[8px] font-semibold uppercase tracking-[0.18em] text-orange-400">PEAKSCORE · LEARNING ARCHIVE</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-[2.4rem]">{learningView === "notes" ? "Tu biblioteca de apuntes" : learningView === "topics" ? "Temas que estás dominando" : learningView === "storage" ? "Tus imágenes" : "Tu actividad de aprendizaje"}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9299a3]">{learningView === "notes" ? "Tus mejores explicaciones, guardadas para volver a ellas cuando las necesites." : learningView === "topics" ? "Una colección personal de conceptos que quieres repasar." : learningView === "storage" ? "Administra tus imágenes de estudio sin perderlas entre conversaciones." : "Una vista clara de los recursos que has creado con Orby."}</p>
              </div>
              <div className="flex items-center gap-2">
                {learningView === "topics" && <button type="button" onClick={() => void saveLearningItem("topic", topic || "Preparación Saber 11", subject || "Tema de estudio")} className="inline-flex items-center gap-2 rounded-lg bg-[#f28a18] px-3.5 py-2.5 text-xs font-semibold text-[#17120c] transition hover:bg-[#ffa12f]"><Bookmark className="h-4 w-4" /> Guardar tema actual</button>}
                <button type="button" onClick={() => setLearningView("chat")} className="rounded-lg border border-white/10 px-3.5 py-2.5 text-xs font-medium text-[#c2c7ce] transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white">Volver al chat</button>
              </div>
            </div>

            {learningError && <p role="alert" className="mb-5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{learningError}</p>}

            {learningLoading || (learningView === "storage" && imageAssetsLoading) ? (
              <div className="flex items-center gap-3 py-12 text-sm text-[#9299a3]"><LoaderCircle className="h-4 w-4 animate-spin text-orange-400" /> Preparando tu biblioteca…</div>
            ) : learningView === "storage" ? (
              <div>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-sm font-semibold text-white">{imageAssets.length} <span className="font-normal text-[#9299a3]">de 20 imágenes utilizadas</span></p><p className="mt-1 text-xs text-[#777e88]">Cada imagen admite hasta 1 MB.</p></div>
                  <span className="orby-pixel-label text-[8px] text-orange-300">{Math.round(imageAssets.length / 20 * 100)}% USED</span>
                </div>
                <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-[#c96a0c] via-[#f28a18] to-[#ffbd6e] transition-all" style={{width: Math.min(100,imageAssets.length/20*100)+"%"}} /></div>
                {imageStorageError && <p role="alert" className="mb-4 text-xs text-rose-300">{imageStorageError}</p>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {imageAssets.map((asset,index)=><article key={asset.path} className="group overflow-hidden rounded-xl border border-white/[0.09] bg-[#121519] transition hover:-translate-y-0.5 hover:border-orange-500/30">
                    <div className="relative aspect-[5/4] overflow-hidden bg-[#090b0e]"><Image src={asset.signedUrl} alt={asset.name} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.035]" /><span className="absolute left-2 top-2 rounded bg-black/65 px-1.5 py-1 text-[9px] font-medium text-white/80">IMG {String(index+1).padStart(2,"0")}</span></div>
                    <div className="flex items-center justify-between gap-2 p-3"><div className="min-w-0"><p className="truncate text-[11px] font-medium text-white">{asset.name}</p><p className="mt-1 text-[10px] text-[#858c96]">{(asset.size/1024).toFixed(0)} KB · {new Date(asset.createdAt).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</p></div><button type="button" onClick={()=>void deleteStoredImage(asset.path)} aria-label={"Eliminar "+asset.name} className="rounded-md p-2 text-[#9ba2ad] transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
                  </article>)}
                </div>
                {imageAssets.length===0 && <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07] text-orange-300"><Images className="h-5 w-5"/></div><p className="mt-4 text-sm font-semibold text-white">Tu biblioteca está vacía</p><p className="mt-1 text-xs text-[#8f96a0]">Cuando envíes una imagen a Orby, podrás encontrarla aquí.</p></div>}
              </div>
            ) : learningView === "progress" ? (
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[{label:"Conversaciones",value:conversations.length,detail:"En tu historial"},{label:"Apuntes",value:learningItems.filter((item)=>item.kind==="note").length,detail:"Explicaciones guardadas"},{label:"Temas guardados",value:learningItems.filter((item)=>item.kind==="topic").length,detail:"Para volver a estudiar"},{label:"Imágenes",value:imageAssets.length+" / 20",detail:"Espacio de almacenamiento"}].map((stat,index)=><div key={stat.label} className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#121519] p-5"><span className="orby-pixel-label text-[7px] text-[#737b86]">0{index+1} / LEARNING</span><p className="mt-5 text-3xl font-semibold tracking-tight text-white">{stat.value}</p><p className="mt-1 text-xs font-medium text-[#c4c9d1]">{stat.label}</p><p className="mt-1 text-[10px] text-[#777e88]">{stat.detail}</p><span className="pointer-events-none absolute -bottom-8 -right-5 h-24 w-24 rounded-full bg-orange-500/[0.05] blur-2xl"/></div>)}
                </div>
                <section className="rounded-xl border border-white/[0.08] bg-[#101317] p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="orby-pixel-label text-[8px] text-orange-300">ADAPTIVE LEARNING</p><h3 className="mt-3 text-lg font-semibold text-white">Lo que Orby ha observado en tu aprendizaje</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9299a3]">Señales tentativas a partir de tus conversaciones. No son notas ni diagnósticos; sirven para elegir una explicación o práctica más útil.</p></div>
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-[#9299a3]">{learningSignals.length} señales recientes</span>
                  </div>
                  {learningSignals.length > 0 ? <div className="mt-5 space-y-2.5">
                    {learningSignals.slice(0, 8).map((signal) => {
                      const stateLabel = signal.learning_state === "understands" ? "En comprensión"
                        : signal.learning_state === "needs_review" ? "Conviene repasar"
                        : signal.learning_state === "misconception" ? "Revisar una confusión"
                        : "Probar otra explicación";
                      const stateClass = signal.learning_state === "understands" ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                        : "border-orange-500/20 bg-orange-500/[0.06] text-orange-200";
                      return <article key={signal.id} className="rounded-lg border border-white/[0.07] bg-[#15191e] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-white">{signal.subject} <span className="font-normal text-[#7f8792]">· {signal.topic}</span></p><span className={"rounded-full border px-2.5 py-1 text-[9px] font-semibold " + stateClass}>{stateLabel}</span></div>
                        <p className="mt-3 text-sm text-[#d8dce2]">{signal.concept}</p>
                        {signal.misconception && <p className="mt-2 text-xs leading-5 text-[#a7adb6]">Confusión observada: {signal.misconception}</p>}
                        {signal.teaching_hint && <p className="mt-1 text-xs leading-5 text-[#a7adb6]">Próxima estrategia: {signal.teaching_hint}</p>}
                        <p className="mt-3 text-[9px] text-[#6f7782]">{new Date(signal.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})} · confianza {Math.round(signal.confidence * 100)}%</p>
                      </article>;
                    })}
                  </div> : <div className="mt-5 rounded-lg border border-dashed border-white/10 px-5 py-10 text-center"><p className="text-sm font-semibold text-white">Aún no hay observaciones suficientes</p><p className="mt-2 text-xs leading-5 text-[#9299a3]">Cuando Orby identifique una dificultad o una comprensión clara en una conversación, aparecerá aquí una sugerencia para adaptar el siguiente ejercicio.</p></div>}
                </section>
                <div className="rounded-xl border border-white/[0.08] bg-[#101317] p-5 sm:p-6"><p className="orby-pixel-label text-[8px] text-orange-300">RECENT ACTIVITY</p><h3 className="mt-3 text-lg font-semibold text-white">Continúa construyendo tu biblioteca</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9299a3]">Guarda las explicaciones que te ayuden a comprender un concepto y los temas que quieras reforzar. Orby los mantendrá organizados en tu cuenta.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>setLearningView("notes")} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#d1d5db] hover:border-orange-500/30">Ver mis apuntes</button><button type="button" onClick={()=>setLearningView("topics")} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#d1d5db] hover:border-orange-500/30">Ver temas guardados</button><button type="button" onClick={()=>setLearningView("storage")} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#d1d5db] hover:border-orange-500/30">Administrar imágenes</button></div></div>
              </div>
            ) : (
              <div>
                <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <label className="flex h-11 max-w-xl items-center gap-2.5 rounded-lg border border-white/[0.09] bg-[#111519] px-3.5 focus-within:border-orange-500/40"><Search className="h-4 w-4 shrink-0 text-[#7d8692]"/><input value={learningSearch} onChange={(event)=>setLearningSearch(event.target.value)} placeholder={learningView === "notes" ? "Buscar en tus apuntes…" : "Buscar temas guardados…"} aria-label="Buscar en tu biblioteca" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#737b86]"/><span className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-[#777e88] sm:inline">SEARCH</span></label>
                  <div className="flex items-center gap-3 text-[11px] text-[#858c96]"><span>{learningItems.filter((item)=>item.kind===(learningView==="notes"?"note":"topic")).length} elementos</span><span className="h-1 w-1 rounded-full bg-orange-500"/><span>Sincronizado con tu cuenta</span></div>
                </div>
                {learningView === "notes" && <div className="mb-5 flex flex-wrap items-center gap-2"><span className="orby-pixel-label mr-2 text-[7px] text-[#737b86]">MY LIBRARY</span><span className="rounded-full border border-orange-500/30 bg-orange-500/[0.08] px-3 py-1.5 text-[10px] font-semibold text-orange-200">Todos los apuntes</span><span className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[10px] text-[#9299a3]">Guardados desde Orby</span></div>}
                <div className="grid gap-3 md:grid-cols-2">
                  {learningItems.filter((item) => item.kind === (learningView === "notes" ? "note" : "topic")).filter((item)=>`${item.title} ${item.content}`.toLocaleLowerCase("es-CO").includes(learningSearch.trim().toLocaleLowerCase("es-CO"))).map((item,index) => <article key={item.id} className="orby-notes-card group relative overflow-hidden rounded-xl p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="orby-pixel-label flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.08] text-[8px] text-orange-300">{String(index+1).padStart(2,"0")}</span><div className="min-w-0"><p className="orby-pixel-label text-[7px] text-orange-300">{learningView === "notes" ? "STUDY NOTE" : "SAVED TOPIC"}</p><p className="mt-1 text-[10px] text-[#7f8792]">{new Date(item.created_at).toLocaleDateString("es-CO",{day:"numeric",month:"long",year:"numeric"})}</p></div></div><button type="button" onClick={() => void deleteLearningItem(item.id)} aria-label="Eliminar elemento guardado" className="rounded-lg p-2 text-[#818995] transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
                    <h3 className="mt-5 text-base font-semibold leading-6 tracking-tight text-white">{item.title}</h3>
                    <div className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap border-l border-orange-500/40 pl-3 text-[13px] leading-6 text-[#bfc5ce]">{item.content}</div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3"><span className="text-[10px] text-[#737b86]">{learningView === "notes" ? "Explicación guardada" : "Tema para repasar"}</span><span className="text-[10px] font-semibold text-orange-300">PEAKSCORE / ORBY</span></div>
                  </article>)}
                </div>
                {learningItems.filter((item) => item.kind === (learningView === "notes" ? "note" : "topic")).filter((item)=>`${item.title} ${item.content}`.toLocaleLowerCase("es-CO").includes(learningSearch.trim().toLocaleLowerCase("es-CO"))).length === 0 && <div className="rounded-xl border border-dashed border-white/10 px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/[0.07] text-orange-300">{learningView === "notes" ? <BookOpen className="h-5 w-5"/> : <Bookmark className="h-5 w-5"/>}</div><p className="mt-4 text-sm font-semibold text-white">{learningSearch.trim() ? "No encontramos coincidencias" : learningView === "notes" ? "Todavía no tienes apuntes" : "Todavía no has guardado temas"}</p><p className="mt-1 text-xs text-[#8f96a0]">{learningSearch.trim() ? "Prueba con otro término." : learningView === "notes" ? "Guarda una explicación de Orby y aparecerá en esta biblioteca." : "Guarda un tema de estudio para tenerlo presente en tu próxima sesión."}</p></div>}
              </div>
            )}
          </section>
        ) : messages.length === 0 ? (

          <div className="flex min-h-full flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-400">PeakScore · Tutor ICFES</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">¿En qué podemos trabajar hoy?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9299a3]">Pregunta, practica y comprende los temas que necesitas dominar para Saber 11.</p>
            <div className="mt-9 grid w-full max-w-3xl gap-2 sm:grid-cols-2">
              {starters.slice(0,4).map((starter) => <button key={starter} type="button" disabled={loading} onClick={() => void sendMessage(starter)} className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111419] px-4 py-3 text-left text-[13px] text-[#c9cdd3] transition hover:border-orange-500/40 hover:bg-[#17191d] disabled:opacity-50"><span>{starter}</span><span className="text-[#777e88] transition group-hover:translate-x-0.5 group-hover:text-orange-400">↗</span></button>)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <article key={message.id ?? `${message.role}-${index}`} className={`orby-message ${message.role === "user" ? `ml-auto w-fit max-w-[min(88%,760px)] rounded-2xl rounded-br-sm px-4 py-3 text-white ${orbyAccent ? "bg-orange-600" : "bg-sky-600"}` : "mr-auto w-fit max-w-[min(94%,900px)] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm"}`}>
                <div className="mb-1 flex items-center gap-2">
                  <p className={message.role === "user" ? "text-[10px] font-bold uppercase tracking-wider text-orange-100" : `text-[10px] font-bold uppercase tracking-wider ${orbyAccent ? "text-orange-700" : "text-sky-700"}`}>{message.role === "user" ? "Tú" : "Orby · Tutor PeakScore"}</p>
                  {message.role === "assistant" && voiceMode && message.id === voiceAssistantMessageIdRef.current && !voiceResponseDoneRef.current && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"/> EN VIVO</span>}
                </div>
                <div className="break-words text-[15px] leading-7 sm:text-base" aria-live={message.role === "assistant" && voiceMode && message.id === voiceAssistantMessageIdRef.current ? "polite" : undefined} aria-atomic="false">{renderTutorContent(message.content)}</div>
                {message.board && <OrbyBoard board={message.board} drawingActive={message.id === voiceAssistantMessageIdRef.current && voiceBoardDrawingActive} />}
                {message.boardPersistenceWarning && <p role="status" className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{message.boardPersistenceWarning}</p>}
                {message.sources && message.sources.length > 0 && <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700" aria-label="Fuentes públicas consultadas">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Fuentes públicas de apoyo</p>
                  <ul className="space-y-2">
                    {message.sources.map((source, sourceIndex) => <li key={source.url} className="flex items-start gap-2 text-xs leading-5">
                      <span className="shrink-0 font-semibold text-orange-700">[{source.citationNumber ?? sourceIndex + 1}]</span>
                      <span className="min-w-0">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900">{source.title}</a>
                        <span className="ml-1 text-slate-500">· {source.publisher}{source.publishedAt ? ` · ${source.publishedAt}` : ""}</span>
                      </span>
                    </li>)}
                  </ul>
                </section>}
                {message.generatedImage && <figure className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <Image src={message.generatedImage} width={1600} height={900} unoptimized alt="Imagen educativa generada por Orby" className="h-auto max-h-[560px] w-full object-contain" />
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-[10px] text-[#8f96a0]">
                    <span>Apoyo visual generado · revísalo junto con la explicación</span>
                    <a href={message.generatedImage} download="orby-apoyo-visual.png" className="font-semibold text-orange-400 transition hover:text-orange-300">Descargar imagen</a>
                  </figcaption>
                </figure>}
                {workspace && message.role === "assistant" && <button type="button" onClick={() => void saveLearningItem("note", message.content.trim().split("\n").find((line) => line.trim())?.replace(/\*\*/g,"").slice(0,72) || "Apunte de Orby", message.content)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-[#aeb4bd] transition hover:border-orange-500/30 hover:text-orange-300"><Bookmark className="h-3.5 w-3.5"/> Guardar apunte</button>}
                {message.role === "assistant" && !voiceMode && <button type="button" onClick={() => speakingIndex === index ? stopSpeaking() : speakText(message.content, index, message.checkQuestion ?? "")} className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${orbyAccent ? "border-orange-200 text-orange-700 hover:bg-orange-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}>
                  <Volume2 className="h-3.5 w-3.5" /> {speakingIndex === index ? "Detener audio" : "Escuchar respuesta"}
                </button>}
                {message.attachmentName && <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/25 p-2">{message.attachmentPreview ? <Image src={message.attachmentPreview} width={1200} height={800} unoptimized alt={"Adjunto: " + message.attachmentName} className="max-h-28 max-w-full rounded-md object-contain" /> : message.attachmentKind === "audio" ? <AudioLines className="h-6 w-6 shrink-0" /> : <FileText className="h-6 w-6 shrink-0" />}<p className="min-w-0 break-all text-[10px] opacity-80">{message.attachmentName}</p></div>}
                {message.checkQuestion && <div className="mt-3 rounded-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"><strong>Comprueba lo aprendido:</strong> {message.checkQuestion}</div>}
              </article>
            ))}
            {loading && <div role="status" className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Orby está preparando una explicación…</div>}
          </div>
        )}
        {voiceMode && liveTranscript && <div className="mt-3 flex justify-end">
          <article className="w-fit max-w-[min(88%,760px)] rounded-2xl rounded-br-sm bg-orange-600 px-4 py-3 text-white shadow-sm">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-orange-100">Tú · transcribiendo</p>
            <p className="break-words text-[15px] leading-7 sm:text-base">{liveTranscript}</p>
          </article>
        </div>}
        {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      </div>

      {workspace && workspaceMode === "voice" && <section className="orby-voice-stage relative flex min-h-0 flex-1 flex-col overflow-hidden px-2 py-2 sm:px-4 sm:py-3" aria-label="Clase en vivo con Orby">
        <div className="orby-class-topbar flex shrink-0 items-center justify-between gap-3 rounded-t-xl border border-b-0 border-slate-200/80 bg-white/95 px-4 py-2 text-slate-800 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="orby-live-indicator h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold tracking-tight">Hoja de clase</p>
              <p className="truncate text-[10px] text-slate-500">{voiceMuted ? "Micrófono silenciado" : isListening ? "Te está escuchando" : voiceStatus}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {activeVoiceAssistantMessage?.board && <button type="button" onClick={saveCurrentBoardAsNote} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-orange-700 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400" aria-label="Guardar apuntes de esta clase" title="Guardar apuntes"><Bookmark className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Guardar apuntes</span></button>}
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex">CLASE EN VIVO</span>
            <button type="button" onClick={() => setShowAssistantSubtitles((value) => !value)} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${showAssistantSubtitles ? "border-orange-200 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-500"}`} aria-pressed={showAssistantSubtitles}>
              <Captions className="mr-1 inline h-3.5 w-3.5" /> Subtítulos {showAssistantSubtitles ? "activados" : "desactivados"}
            </button>
          </div>
        </div>
        <div className="orby-class-paper-shell relative flex min-h-0 flex-1 flex-col overflow-hidden border-x border-transparent bg-white">
          <div className="orby-class-paper relative min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
            {activeVoiceAssistantMessage?.board
              ? <div className="orby-class-board mx-auto min-h-full w-full max-w-[1600px]">
                  <OrbyBoard board={activeVoiceAssistantMessage.board} drawingActive={voiceBoardDrawingActive} />
                </div>
              : <div className="orby-class-empty mx-auto flex min-h-[280px] h-full max-w-5xl flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 px-6 text-center text-slate-500">
                  <BookOpen className="mb-3 h-8 w-8 text-orange-500/70" />
                  <p className="text-sm font-bold text-slate-700">{voiceMode ? "Preparando la pizarra de la clase…" : "Tu clase con Orby"}</p>
                  <p className="mt-1 max-w-md text-xs leading-5">Los apuntes, esquemas y dibujos aparecerán aquí mientras Orby explica.</p>
                </div>}
            {voiceError && <p role="alert" className="mx-auto mt-3 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{voiceError}</p>}
            {voiceFallbackMode && <p role="status" className="mx-auto mt-3 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs leading-5 text-amber-900"><strong>Modo por turnos:</strong> pulsa el micrófono para grabar tu pregunta. La respuesta puede tardar más que en la llamada en vivo y respetará las cuotas gratuitas disponibles.</p>}
          </div>
          {showAssistantSubtitles && <section className="orby-live-captions shrink-0 px-3 pb-3 pt-1 sm:px-6 sm:pb-4" aria-label="Subtítulos en vivo de Orby" aria-live="polite" aria-atomic="false">
            <div className="mx-auto max-w-5xl rounded-lg border border-slate-700 bg-[#10151d]/95 px-3 py-2 text-slate-100 shadow-lg backdrop-blur-sm sm:px-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-300">Explicación en vivo · palabra activa</p>
              </div>
              <p className="max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 sm:text-base" aria-label="Subtítulos de la explicación de Orby">{assistantSubtitleContent || (voiceMode ? "Aquí aparecerá lo que Orby vaya explicando…" : "Conecta con Orby para comenzar la clase.")}</p>
            </div>
          </section>}
        </div>
        <footer className="orby-class-controls flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-b-xl border border-t-0 border-slate-700/80 bg-[#10151d] px-3 py-2.5 text-white sm:px-5">
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="flex h-2.5 w-2.5 items-center justify-center"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" /></span>
            <div className="min-w-0"><p className="text-[11px] font-bold">Orby está en clase</p><p className="truncate text-[10px] text-slate-400">{topic || subject}</p></div>
          </div>
          <div className="mx-auto flex items-center justify-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setWorkspaceMode("chat")} className="orby-call-control" aria-label="Abrir chat de Orby" title="Chat"><MessageSquare className="h-5 w-5" /></button>
            <button type="button" onClick={() => void (voiceFallbackMode ? (isRecording ? stopAudioRecording() : requestMicrophonePermission()) : toggleVoiceMute())} disabled={!voiceMode || loading || (voiceFallbackMode && audioTranscribing)} className={`orby-call-control ${voiceMuted ? "orby-call-control-active" : ""}`} aria-label={voiceFallbackMode ? (isRecording ? "Detener grabación" : "Grabar pregunta") : voiceMuted ? "Activar micrófono" : "Silenciar micrófono"} title={voiceFallbackMode ? (isRecording ? "Detener grabación" : "Grabar pregunta") : voiceMuted ? "Activar micrófono" : "Silenciar micrófono"}>{voiceFallbackMode ? (isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5" />) : voiceMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
            <button type="button" onClick={() => setShowAssistantSubtitles((value) => !value)} className={`orby-call-control ${showAssistantSubtitles ? "orby-call-control-active" : ""}`} aria-label={showAssistantSubtitles ? "Ocultar subtítulos" : "Mostrar subtítulos"} title="Subtítulos"><Captions className="h-5 w-5" /></button>
            <button type="button" onClick={finishVoiceCall} className="orby-call-end flex h-11 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300" aria-label="Salir de la clase"><X className="h-4 w-4" /> <span>Salir</span></button>
          </div>
        </footer>
      </section>}
      {workspace && voiceMode && workspaceMode === "chat" && <button type="button" onClick={() => setWorkspaceMode("voice")} aria-label="Volver a la clase en vivo con Orby" className="orby-mini-voice fixed bottom-24 right-6 z-[95] flex h-12 items-center gap-2 rounded-full border border-orange-400/30 bg-[#111820] px-4 text-xs font-bold text-white shadow-xl transition hover:border-orange-300 hover:bg-[#1b2632] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">
        <span ref={voiceMiniOrbRef} className="orby-mini-voice-wave flex h-5 items-center gap-0.5" aria-hidden="true"><i/><i/><i/><i/><i/></span>
        Volver a clase
      </button>}
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
      {voiceError && !(workspace && workspaceMode === "voice") && <p role="alert" className="shrink-0 bg-white px-3 pt-2 text-xs text-rose-600">{voiceError}</p>}
      {isListening && !(workspace && voiceMode) && <p role="status" className="shrink-0 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">Te escucho… Al terminar, enviaré tu pregunta a Orby.</p>}
      {isRecording && <div role="status" className="flex shrink-0 items-center justify-between border-t border-rose-100 bg-rose-50 px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-bold text-rose-700"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-600" /> Grabando tu voz · máximo 5 minutos</span>
        <button type="button" onClick={() => stopAudioRecording()} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"><Square className="h-3 w-3 fill-current" /> Detener</button>
      </div>}
      {false && workspace && workspaceMode === "voice" && <div className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-2 sm:mx-6" role="status" aria-live="polite">
        <span className={isListening ? "h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-orange-600" : "h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500"} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-700">{voiceStatus}</p>

        </div>
        <div className="flex h-6 items-center gap-[3px]" aria-hidden="true">{Array.from({length: 18}, (_, index) => <span key={index} className="w-[3px] rounded-full bg-orange-500 transition-all" style={{height: 5 + ((index * 7) % 17), opacity: isListening ? 1 : 0.4}} />)}</div>
        <button type="button" onClick={toggleVoiceMode} className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-700">Finalizar</button>
      </div>}
      {workspace && workspaceMode === "chat" && learningView === "chat" && imageAssets.length >= 20 && <div role="status" className="flex shrink-0 items-start gap-3 border-t border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-left">
        <Images className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-amber-100">Almacenamiento de imágenes completo · 20/20</p><p className="mt-0.5 text-[11px] leading-5 text-amber-100/65">Para enviar otra imagen, elimina una de tu biblioteca en «Administrar almacenamiento».</p></div>
        <button type="button" onClick={() => setLearningView("storage")} className="shrink-0 rounded-md border border-amber-300/25 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100 transition hover:border-amber-200 hover:bg-amber-300/10">Liberar espacio</button>
      </div>}
      <form onSubmit={onSubmit} className={workspace && (workspaceMode === "voice" || learningView !== "chat") ? "hidden" : "flex shrink-0 items-end gap-2 border-t border-[#25282d] bg-[#0b0d10] p-3 sm:px-5 sm:py-4"}>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp3,audio/aac,audio/mp4,audio/m4a,audio/opus" className="hidden" aria-label="Adjuntar imagen o audio" onChange={(event) => { handleComposerAttachment(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
        <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label="Tomar foto de una pregunta" onChange={(event) => handleAttachment(event.currentTarget.files?.[0])} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={loading || isRecording || audioTranscribing || (workspace && imageAssets.length >= 20)} aria-label="Adjuntar imagen o audio" title={workspace && imageAssets.length >= 20 ? "Almacenamiento lleno: elimina una imagen para continuar" : "Adjuntar imagen o nota de voz"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#aeb4bd] transition hover:border-orange-500/40 hover:bg-white/[0.04] hover:text-white disabled:opacity-35"><Paperclip className="h-[18px] w-[18px]" /></button>
        <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading || isRecording || audioTranscribing || (workspace && imageAssets.length >= 20)} aria-label="Tomar foto" title="Tomar foto de una pregunta" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#aeb4bd] transition hover:border-orange-500/40 hover:bg-white/[0.04] hover:text-white disabled:opacity-35"><Camera className="h-[18px] w-[18px]" /></button>
        <button type="button" onClick={() => void generateVisualAid()} disabled={loading || imageGenerationLoading || isRecording || audioTranscribing || input.trim().length < 5} aria-label="Generar una imagen educativa" title={imageGenerationLoading ? "Orby está creando tu imagen…" : "Crear un apoyo visual con el tema escrito"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-500/25 bg-orange-500/[0.07] text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15 disabled:opacity-35"><ImagePlus className={imageGenerationLoading ? "h-[18px] w-[18px] animate-pulse" : "h-[18px] w-[18px]"} /></button>
        <button type="button" onClick={() => void requestMicrophonePermission()} disabled={loading || isRecording || audioTranscribing} aria-label={voiceFallbackMode ? "Grabar pregunta para Orby" : "Grabar nota de voz"} title={voiceFallbackMode ? "Habla y vuelve a pulsar para detener; Orby responderá por voz sin Gemini Live" : "Grabar una nota de voz para transcribir"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#aeb4bd] transition hover:border-orange-500/40 hover:bg-white/[0.04] hover:text-white disabled:opacity-35"><Mic className="h-[18px] w-[18px]" /></button>
        <button type="button" onClick={toggleVoiceMode} disabled={loading} aria-label={voiceMode ? "Finalizar conversación por voz" : "Iniciar conversación por voz"} title={voiceMode ? "Finalizar conversación por voz" : "Iniciar conversación por voz"} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-40 ${voiceMode ? "border-orange-500 bg-orange-500 text-[#17120c]" : "border-orange-500/30 bg-orange-500/10 text-orange-300 hover:border-orange-400 hover:bg-orange-500/20"}`}><AudioLines className="h-[18px] w-[18px]" /></button>
        <label className="sr-only" htmlFor="orby-tutor-message">Pregunta a Orby</label>
        <textarea ref={inputRef} id="orby-tutor-message" value={input} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }} onPaste={(event) => {
          const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
          if (!imageItem) return;
          const pastedImage = imageItem.getAsFile();
          if (!pastedImage) return;
          event.preventDefault();
          const extension = pastedImage.type === "image/jpeg" ? "jpg" : pastedImage.type === "image/webp" ? "webp" : "png";
          handleAttachment(new File([pastedImage], "captura-" + Date.now() + "." + extension, { type: pastedImage.type }));
        }} onChange={(event) => { setInput(event.target.value); const element = event.currentTarget; element.style.height = "48px"; element.style.height = `${Math.min(element.scrollHeight, 112)}px`; }} maxLength={1200} rows={1} placeholder="Escribe tu pregunta o pega una imagen con Ctrl + V…" style={{ scrollbarWidth: "none" }} className="orby-composer-input min-h-10 max-h-28 flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-[#15181d] px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-[#747b85] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20" />
        <button type="submit" disabled={(!input.trim() && !attachment) || isRecording || audioTranscribing} aria-label="Enviar mensaje a Orby" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f28a18] text-[#17120c] transition hover:bg-[#ffa12f] disabled:cursor-not-allowed disabled:opacity-35"><Send className="h-5 w-5" /></button>
      </form>
      {queuedMessageCount > 0 && <p className="shrink-0 border-t border-orange-500/15 bg-orange-500/[0.06] px-4 py-1.5 text-[11px] text-orange-200" role="status">{queuedMessageCount} pregunta{queuedMessageCount === 1 ? "" : "s"} en cola; Orby las responderá en orden.</p>}
      {conversationError && workspace && <div role="alert" className="shrink-0 border-t border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{conversationError}</span>
          {failedVoiceTurn && <button type="button" disabled={retryingVoiceTurn} onClick={() => void retryFailedVoiceTurn()} className="shrink-0 rounded-md border border-rose-200 bg-white px-2.5 py-1 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60">{retryingVoiceTurn ? "Guardando…" : "Reintentar guardado"}</button>}
        </div>
      </div>}
      <p className="shrink-0 border-t border-[#25282d] bg-[#0b0d10] px-4 pb-3 pt-1 text-center text-[10px] leading-4 text-[#707782]">Orby puede cometer errores. Comprueba los datos importantes antes de usarlos.</p>
        </div>
      </div>
    </aside>
      <style jsx global>{`
        /* Orby workspace uses a readable pixel typeface for controls and interface chrome.
           Conversation bubbles and the composer deliberately keep the standard reading font. */
        #orby-tutor-panel[data-orby-workspace="true"] {
          font-family: var(--font-silkscreen), Arial, sans-serif;
          letter-spacing: -0.012em;
        }
        #orby-tutor-panel[data-orby-workspace="true"] .orby-message,
        #orby-tutor-panel[data-orby-workspace="true"] .orby-message *,
        #orby-tutor-panel[data-orby-workspace="true"] .orby-composer-input {
          font-family: Arial, Helvetica, sans-serif !important;
          letter-spacing: normal;
        }
        #orby-tutor-panel[data-orby-workspace="true"] button {
          transition: color .18s ease, background-color .18s ease, border-color .18s ease,
            box-shadow .18s ease, transform .18s ease, opacity .18s ease, filter .18s ease;
        }
        #orby-tutor-panel[data-orby-workspace="true"] button:not(:disabled):hover {
          filter: brightness(1.09);
        }
        #orby-tutor-panel[data-orby-workspace="true"] button:not(:disabled):active {
          transform: translateY(1px) scale(.985);
        }
        #orby-tutor-panel[data-orby-workspace="true"] button:focus-visible,
        #orby-tutor-panel[data-orby-workspace="true"] input:focus-visible,
        #orby-tutor-panel[data-orby-workspace="true"] textarea:focus-visible {
          outline: 2px solid rgba(255,166,73,.72);
          outline-offset: 2px;
        }
        #orby-tutor-panel .orby-voice-orb,
        #orby-tutor-panel .orby-mini-voice-core {
          --voice-level: 0;
          box-shadow:
            0 0 calc(42px + var(--voice-level) * 76px) rgba(242,138,24,calc(.18 + var(--voice-level) * .35)),
            0 0 calc(100px + var(--voice-level) * 115px) rgba(242,138,24,calc(.05 + var(--voice-level) * .17)),
            inset -18px -26px 45px rgba(31,13,3,.58),
            inset 10px 9px 24px rgba(255,239,210,.36);
          will-change: transform, filter, box-shadow;
        }
        #orby-tutor-panel .orby-voice-orb-active {
          animation: none;
        }
        #orby-tutor-panel .orby-mini-voice-core:before {
          animation-duration: calc(2.3s - var(--voice-level) * .8s);
          opacity: calc(.25 + var(--voice-level) * .5);
        }
        @media (prefers-reduced-motion: reduce) {
          #orby-tutor-panel[data-orby-workspace="true"] button,
          #orby-tutor-panel .orby-mini-voice-core:before {
            transition: none !important;
            animation: none !important;
          }
        }

        #orby-tutor-panel[data-orby-theme="dark"] { background:#080b10!important; color:#f8fafc!important; border-color:#29313b!important; }
        #orby-tutor-panel[data-orby-theme="dark"] > header { background:#0b1017!important; border-color:#27313d!important; color:#f8fafc!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="bg-white"] { background-color:#0d131b!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-950"], #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-900"] { color:#f3f4f6!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-800"], #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-700"] { color:#d5dbe4!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-600"], #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-500"] { color:#9aa6b5!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="border-slate-200"], #orby-tutor-panel[data-orby-theme="dark"] [class~="border-slate-100"] { border-color:#28323f!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="bg-slate-100"], #orby-tutor-panel[data-orby-theme="dark"] [class~="bg-slate-50"] { background-color:#151d28!important; }
        #orby-tutor-panel[data-orby-theme="dark"] .orby-voice-stage { background:radial-gradient(ellipse at 50% 35%,#2a160c 0%,#11151c 45%,#090c11 100%); color:#f8fafc; }
        #orby-tutor-panel[data-orby-theme="light"] .orby-voice-stage { background:radial-gradient(ellipse at 50% 35%,#fff2e8 0%,#fff 55%,#f7f8fb 100%); color:#111827; }

        /* Live lesson: the whiteboard is the classroom, not a decorative chat attachment. */
        #orby-tutor-panel .orby-voice-stage { background:#11151d!important; color:#f8fafc; }
        #orby-tutor-panel .orby-class-topbar { min-height:52px; }
        /* Reference-video classroom: one continuous plain-white sheet. */
        #orby-tutor-panel .orby-class-paper,
        #orby-tutor-panel .orby-class-paper-shell { background:#fff!important; background-image:none!important; }
        #orby-tutor-panel .orby-class-board .orby-board { margin:0 auto!important; max-width:100%; min-height:100%; border:0!important; border-radius:0!important; background-color:transparent!important; background-image:none!important; box-shadow:none!important; }
        #orby-tutor-panel .orby-class-board .orby-board-canvas { border:0!important; border-radius:0!important; box-shadow:none!important; background:#fff!important; background-image:none!important; }
        #orby-tutor-panel .orby-class-board .orby-board > header { position:sticky;top:0;z-index:2;background:#fff!important;backdrop-filter:none; }
        #orby-tutor-panel .orby-class-board .orby-board > div { display:block;align-items:initial;gap:0;padding:0!important; }
        #orby-tutor-panel .orby-class-board .orby-board > div > * { min-width:0; }
        #orby-tutor-panel .orby-class-board .orby-board section { background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important; }
        #orby-tutor-panel .orby-class-board .orby-board,
        #orby-tutor-panel .orby-class-board .orby-board * { color:#172033; }
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-950"],
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-900"],
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-800"],
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-700"] { color:#172033!important; }
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-600"],
        #orby-tutor-panel .orby-class-board .orby-board [class~="text-slate-500"] { color:#536174!important; }
        #orby-tutor-panel .orby-class-board .orby-board [class~="bg-white"] { background-color:rgba(255,255,255,.94)!important; }

        #orby-tutor-panel .orby-live-captions { background:linear-gradient(180deg,rgba(255,254,250,0),rgba(255,254,250,.98) 24%); }
        #orby-tutor-panel .orby-call-control { display:flex;height:44px;width:44px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);border-radius:9999px;background:rgba(255,255,255,.07);color:#f8fafc;transition:background .18s,border-color .18s,transform .18s; }
        #orby-tutor-panel .orby-call-control:hover:not(:disabled) { background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.32); }
        #orby-tutor-panel .orby-call-control:disabled { opacity:.4;cursor:not-allowed; }
        #orby-tutor-panel .orby-call-control-active { background:rgba(249,115,22,.2);border-color:rgba(251,146,60,.75);color:#fdba74; }
        #orby-tutor-panel .orby-mini-voice-wave i { display:block;width:3px;height:8px;border-radius:4px;background:#fb923c;animation:orby-wave 650ms ease-in-out infinite alternate; }
        #orby-tutor-panel .orby-mini-voice-wave i:nth-child(2),#orby-tutor-panel .orby-mini-voice-wave i:nth-child(4) { animation-delay:160ms;height:14px; }
        #orby-tutor-panel .orby-mini-voice-wave i:nth-child(3) { animation-delay:300ms;height:19px; }
        #orby-tutor-panel[data-orby-theme="light"] .orby-voice-stage { background:#11151d!important; }
        @media(max-width:767px) {
          #orby-tutor-panel .orby-voice-stage { padding:8px!important; }
          #orby-tutor-panel .orby-class-topbar { padding:8px 10px; }
          #orby-tutor-panel .orby-class-paper { min-height:0; }
          #orby-tutor-panel .orby-class-board .orby-board > div { grid-template-columns:1fr; }
          #orby-tutor-panel .orby-call-control { height:40px;width:40px; }
          #orby-tutor-panel .orby-class-controls { padding:9px; }
        }
        @media(prefers-reduced-motion:reduce) { #orby-tutor-panel .orby-mini-voice-wave i { animation:none!important; } }

        #orby-tutor-panel .orby-wave-bar { animation:orby-wave 900ms ease-in-out infinite alternate; transform-origin:center; }
        #orby-tutor-panel .orby-voice-orb { position:relative;width:100%;height:100%;border-radius:9999px;border:1px solid rgba(255,183,112,.7);background:radial-gradient(circle at 34% 25%,#ffe7bd 0%,#ffc36f 13%,#ff9c2e 28%,#df7417 46%,#8c3b0d 68%,#23130a 86%);box-shadow:0 0 48px rgba(242,138,24,.28),0 0 110px rgba(242,138,24,.11),inset -18px -26px 45px rgba(31,13,3,.6),inset 10px 9px 24px rgba(255,239,210,.34);transition:filter .35s,transform .35s; }
        #orby-tutor-panel .orby-voice-orb:before { content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse at 31% 22%,rgba(255,255,255,.72),rgba(255,232,196,.2) 17%,transparent 43%);filter:blur(1px); }
        #orby-tutor-panel .orby-voice-orb-active { filter:brightness(1.12) saturate(1.08);transform:scale(1.035);box-shadow:0 0 70px rgba(242,138,24,.4),0 0 130px rgba(242,138,24,.14),inset -18px -26px 45px rgba(31,13,3,.55),inset 10px 9px 24px rgba(255,239,210,.38);animation:orby-orb-breathe 2.4s ease-in-out infinite alternate; }
        #orby-tutor-panel .orby-voice-orb-muted { filter:grayscale(.5) brightness(.68);box-shadow:0 0 18px rgba(242,138,24,.08);animation:none; }
        #orby-tutor-panel .orby-mini-voice-core { position:relative;display:block;width:100%;height:100%;border-radius:9999px;background:radial-gradient(circle at 34% 25%,#ffe6bd 0%,#ffc36f 13%,#ff9c2e 28%,#df7417 46%,#8c3b0d 68%,#23130a 86%);box-shadow:inset -8px -11px 17px rgba(31,13,3,.58),inset 5px 5px 12px rgba(255,239,210,.32),0 0 24px rgba(242,138,24,.28); }
        #orby-tutor-panel .orby-mini-voice-core:after { content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse at 31% 22%,rgba(255,255,255,.72),rgba(255,232,196,.18) 18%,transparent 43%); }
        #orby-tutor-panel .orby-mini-voice-core:before { content:"";position:absolute;inset:-7px;border:1px solid rgba(255,166,73,.35);border-radius:inherit;animation:orby-mini-pulse 2.2s ease-out infinite; }
        #orby-tutor-panel .orby-mini-voice-muted { filter:grayscale(.6) brightness(.65); }
        #orby-tutor-panel .orby-mini-voice-muted:before { animation:none;opacity:.25; }
        @keyframes orby-orb-breathe { from {transform:scale(1)} to {transform:scale(1.035)} }
        #orby-tutor-panel .orby-mini-voice-core { position:relative;display:flex;width:100%;height:100%;align-items:center;justify-content:center;border-radius:9999px;background:radial-gradient(circle at 34% 27%,#ffd18a 0%,#fb9b2e 22%,#a34b0d 56%,#22130a 82%);box-shadow:inset 0 0 20px rgba(255,220,177,.22),0 0 24px rgba(242,138,24,.28); }
        #orby-tutor-panel .orby-mini-voice-core:before { content:"";position:absolute;inset:-6px;border:1px solid rgba(255,166,73,.35);border-radius:inherit;animation:orby-mini-pulse 2.2s ease-out infinite; }
        #orby-tutor-panel .orby-mini-voice-muted { filter:grayscale(.6) brightness(.65); }
        #orby-tutor-panel .orby-mini-voice-muted:before { animation:none;opacity:.25; }
        #orby-tutor-panel .orby-pixel-label { font-family:var(--font-press-start),monospace;font-size:8px;letter-spacing:.06em;line-height:1.8; }
        #orby-tutor-panel .orby-notes-card { background:linear-gradient(145deg,rgba(25,27,31,.98),rgba(15,17,20,.98));border:1px solid rgba(255,255,255,.09);box-shadow:0 14px 34px rgba(0,0,0,.16);transition:border-color .2s,transform .2s,box-shadow .2s; }
        #orby-tutor-panel .orby-notes-card:hover { border-color:rgba(242,138,24,.35);transform:translateY(-2px);box-shadow:0 18px 40px rgba(0,0,0,.24); }
        #orby-tutor-panel .orby-notes-card:before { content:"";position:absolute;inset:0 0 auto;height:2px;background:linear-gradient(90deg,#f28a18,rgba(242,138,24,0)); }
        @keyframes orby-mini-pulse { 0%{transform:scale(.92);opacity:.8} 75%,100%{transform:scale(1.35);opacity:0} }
        @media (prefers-reduced-motion: reduce) { #orby-tutor-panel .orby-mini-voice-core:before,#orby-tutor-panel .orby-voice-orb-active { animation:none!important; } }
        #orby-tutor-panel .orby-voice-orbit { animation:orby-orbit 7s linear infinite; }
        #orby-tutor-panel .orby-voice-orbit-delay { animation-direction:reverse; animation-duration:10s; }
        @keyframes orby-wave { from { transform:scaleY(.35); } to { transform:scaleY(1); } }
        @keyframes orby-orbit { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }
        #orby-tutor-panel[data-orby-theme="dark"] { background:#0b0d10!important;color:#f5f6f8!important;border-color:#25282d!important; }
        #orby-tutor-panel[data-orby-theme="dark"] > header { background:#0b0d10!important;border-color:#25282d!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="bg-white"] { background-color:#111419!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-950"],#orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-900"],#orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-800"],#orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-700"] { color:#e5e7eb!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-600"],#orby-tutor-panel[data-orby-theme="dark"] [class~="text-slate-500"] { color:#9aa1ab!important; }
        #orby-tutor-panel[data-orby-theme="dark"] [class~="border-slate-200"],#orby-tutor-panel[data-orby-theme="dark"] [class~="border-slate-100"] { border-color:#282c32!important; }
        #orby-tutor-panel[data-orby-theme="dark"] .orby-voice-stage { background:radial-gradient(ellipse at 50% 38%,#2a190d 0%,#101216 45%,#0b0d10 100%);color:#f8fafc; }
        @media (max-width: 767px) {
          #orby-tutor-panel[data-orby-theme] { border-radius:0!important; }
          #orby-tutor-panel .orby-voice-stage img { max-height:32vh; }
        }
        /* Accessible light workspace: remove the dark hard-coded surfaces without
           changing the orange brand bubbles or the dark theme. */
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] {
          background:#f4f6fa!important;
          color:#17212f!important;
          border-color:#dbe2ea!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] > header {
          background:#ffffff!important;
          border-color:#dbe2ea!important;
          color:#17212f!important;
          box-shadow:0 1px 3px rgba(15,23,42,.04);
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] > header h1 { color:#111827!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] > header p { color:#64748b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] > div { background:#f4f6fa!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] {
          background:#ffffff!important;color:#263445!important;border-color:#dbe2ea!important;
          box-shadow:2px 0 12px rgba(15,23,42,.035);
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] .border-white\/\[0\.07\],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] .border-white\/10 { border-color:#e2e8f0!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class*="text-[#777"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class*="text-[#858"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class*="text-[#a8"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class*="text-[#b4"] { color:#64748b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class*="text-[#e7"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] [class~="text-white"] { color:#17212f!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] input {
          color:#17212f!important;background:#f8fafc!important;border-color:#dbe2ea!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] input::placeholder { color:#94a3b8!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message[role="article"] { box-shadow:0 2px 9px rgba(15,23,42,.045)!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message:not(.bg-orange-600) {
          background:#ffffff!important;color:#1e293b!important;border-color:#dbe2ea!important;
          box-shadow:0 3px 12px rgba(15,23,42,.055)!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message:not(.bg-orange-600) [class*="text-[#"] { color:#64748b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message:not(.bg-orange-600) .text-slate-800 { color:#1e293b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message:not(.bg-orange-600) .border-white\/10 { border-color:#e2e8f0!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] form {
          background:#ffffff!important;border-color:#dbe2ea!important;
          box-shadow:0 -3px 14px rgba(15,23,42,.035);
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-composer-input {
          color:#17212f!important;background:#f8fafc!important;border-color:#d5dde7!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-composer-input::placeholder { color:#94a3b8!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] > div > div > p:last-child {
          border-color:#e2e8f0!important;background:#ffffff!important;color:#64748b!important;
        }
        /* Light mode also restyles learning archive cards, not only chat bubbles. */
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#0b"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#0d"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#10"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#11"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#12"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#15"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="bg-[#17"] {
          background-color:#ffffff!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="border-white"] { border-color:#e2e8f0!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class~="text-white"] { color:#1e293b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="text-[#7"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="text-[#8"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="text-[#9"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="text-[#a"],
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [class*="text-[#b"] { color:#64748b!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message.bg-orange-600,
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message.bg-orange-600 * { color:#ffffff!important; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-message:not(.bg-orange-600) {
          background:#ffffff!important;border-color:#dbe2ea!important;color:#1e293b!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-notes-card {
          background:linear-gradient(145deg,#ffffff,#f8fafc)!important;
          border-color:#dbe2ea!important;box-shadow:0 8px 24px rgba(15,23,42,.055)!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-notes-card h3,
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-notes-card p,
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-notes-card div { color:#334155; }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] [aria-label="Herramientas de Orby"] {
          background:#ffffff!important;color:#263445!important;border-color:#dbe2ea!important;
        }
        #orby-tutor-panel[data-orby-theme="light"][data-orby-workspace="true"] .orby-composer-input {
          background:#f8fafc!important;color:#17212f!important;border-color:#d5dde7!important;
        }
        @media (prefers-reduced-motion: reduce) { #orby-tutor-panel .orby-wave-bar, #orby-tutor-panel .orby-voice-orbit { animation:none!important; } }
        /* Compact orb preview: centered over the conversation, with soft volumetric amber mist. */
        #orby-tutor-panel .orby-mini-voice {
          width: 76px !important; height: 76px !important;
          left: calc(50% + 143px) !important; top: auto !important; bottom: 98px !important;
          border: 0 !important; overflow: visible !important; isolation: isolate;
          box-shadow: none !important; background: transparent !important;
        }
        #orby-tutor-panel .orby-mini-voice::before,
        #orby-tutor-panel .orby-mini-voice::after {
          content: ""; position: absolute; z-index: -1; pointer-events: none; border-radius: 50%;
          filter: blur(13px); mix-blend-mode: screen;
        }
        #orby-tutor-panel .orby-mini-voice::before {
          inset: -35px;
          background: radial-gradient(ellipse at 48% 50%, rgba(255,159,55,.25) 0%, rgba(231,117,26,.13) 34%, transparent 70%),
            radial-gradient(ellipse at 25% 42%, rgba(255,207,151,.15) 0%, transparent 43%),
            radial-gradient(ellipse at 76% 60%, rgba(186,100,43,.19) 0%, transparent 48%);
          animation: orby-mist-drift 6.8s ease-in-out infinite alternate;
        }
        #orby-tutor-panel .orby-mini-voice::after {
          inset: -22px;
          background: radial-gradient(ellipse at 50% 50%, rgba(255,185,103,.24) 0%, rgba(242,138,24,.11) 38%, transparent 72%);
          filter: blur(20px); animation: orby-mist-breathe 4.2s ease-in-out infinite;
        }
        #orby-tutor-panel .orby-mini-voice-core {
          width: 100% !important; height: 100% !important; border: 1px solid rgba(255,194,128,.48);
          box-shadow: inset -8px -12px 18px rgba(31,13,3,.55), inset 5px 5px 14px rgba(255,239,210,.35),
            0 0 22px rgba(242,138,24,.24), 0 0 48px rgba(242,138,24,.13) !important;
          animation: orby-orb-float 5s ease-in-out infinite;
        }
        /* Humo interno procedural: capas de ruido suave que se desplazan dentro del volumen. */
        #orby-tutor-panel .orby-mini-voice-core::before {
          content: "" !important; inset: 3px !important; border: 0 !important;
          border-radius: inherit; overflow: hidden; pointer-events: none;
          background:
            radial-gradient(ellipse at 28% 62%, rgba(255,242,222,.82) 0%, rgba(255,198,139,.34) 19%, transparent 48%),
            radial-gradient(ellipse at 72% 35%, rgba(255,248,232,.78) 0%, rgba(255,177,100,.25) 24%, transparent 54%),
            radial-gradient(ellipse at 54% 78%, rgba(255,216,176,.58) 0%, rgba(255,151,77,.16) 32%, transparent 57%),
            radial-gradient(ellipse at 42% 20%, rgba(255,255,255,.52) 0%, rgba(255,235,207,.14) 24%, transparent 44%),
            radial-gradient(ellipse at 82% 78%, rgba(255,126,43,.3) 0%, transparent 45%);
          background-size: 175% 165%, 185% 175%, 165% 185%, 190% 180%, 170% 165%;
          background-position: 0% 55%, 100% 35%, 40% 100%, 55% 0%, 90% 80%;
          filter: url(#orby-smoke-filter) blur(5px) saturate(1.12);
          mix-blend-mode: screen; opacity: .82;
          animation: orby-core-smoke 8s ease-in-out infinite alternate !important;
        }
        #orby-tutor-panel .orby-mini-voice-core::after {
          content: ""; position: absolute; inset: -3px; border-radius: inherit; pointer-events: none;
          background: radial-gradient(ellipse at 29% 23%, rgba(255,255,255,.72), rgba(255,235,208,.16) 22%, transparent 48%);
          filter: blur(1px);
        }
        @keyframes orby-core-smoke {
          0% { transform: scale(1.02) rotate(-9deg); background-position: 0% 55%, 100% 35%, 40% 100%, 55% 0%, 90% 80%; opacity: .66; }
          35% { transform: scale(1.09) rotate(4deg); background-position: 38% 20%, 58% 72%, 12% 44%, 88% 38%, 18% 24%; opacity: .96; }
          70% { transform: scale(1.04) rotate(11deg); background-position: 82% 70%, 12% 18%, 78% 12%, 25% 90%, 72% 55%; opacity: .8; }
          100% { transform: scale(1.12) rotate(18deg); background-position: 100% 35%, 0% 80%, 55% 65%, 0% 40%, 42% 100%; opacity: .9; }
        }
        @media (max-width: 768px) {
          #orby-tutor-panel .orby-mini-voice { left: 50% !important; }
        }
        @keyframes orby-mist-drift {
          0% { transform: translate3d(-5px,3px,0) scale(.94) rotate(-5deg); opacity: .62; }
          50% { transform: translate3d(5px,-5px,0) scale(1.06) rotate(4deg); opacity: .95; }
          100% { transform: translate3d(-2px,4px,0) scale(1) rotate(1deg); opacity: .72; }
        }
        @keyframes orby-mist-breathe {
          0%,100% { transform: scale(.9); opacity: .42; }
          50% { transform: scale(1.12); opacity: .82; }
        }
        @keyframes orby-orb-float {
          0%,100% { translate: 0 0; }
          50% { translate: 0 -3px; }
        }
        @media (prefers-reduced-motion: reduce) {
          #orby-tutor-panel .orby-mini-voice::before, #orby-tutor-panel .orby-mini-voice::after,
          #orby-tutor-panel .orby-mini-voice-core { animation: none !important; }
        }
      `}</style>
    </>
  );
}

