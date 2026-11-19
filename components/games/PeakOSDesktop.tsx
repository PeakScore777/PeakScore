"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Bell, ChevronRight, Clock3, FileText, Folder, Mail, MessageSquare, Minus, Monitor, Search, ShieldAlert, X, Power } from "lucide-react";

type AppId = "files" | "mail" | "messages" | "case" | "timeline";
type WindowState = { id: AppId; title: string; x: number; y: number; width: number; height: number; minimized: boolean; maximized: boolean; restore?: { x: number; y: number; width: number; height: number } };
export type CaseEvidence = { id?: string; code: string; title: string; detail: string; source: string; scope: string; suspect: string; imageUrl?: string | null };
type CaseEvidenceAsset = { id: string; title: string; description: string; image_url: string; tag: string };
export type CaseTimelineEntry = { time: string; event: string; source: string; record: "Registro" | "Declaración" | "Testimonio" | "Hallazgo"; suspect: string };
type CaseRecord = { id: string; record_type: "timeline" | "email" | "message"; occurred_at: string; title: string; body: string; source: string; sender: string; recipient: string; subject: string; suspect_id: string | null; suspect_name: string; evidence_asset_id: string | null; evidence_code: string; evidence_title: string; evidence_description: string; evidence_url: string; document_reference: string; page_number: string; seal: string; signature_note: string; classification: string; display_order: number };
type DesktopSearchResult = { id: string; kind: string; title: string; detail: string; app: AppId; query: string; folder?: string; evidence?: CaseEvidence; record?: CaseRecord };


const APP_META: Record<AppId, { title: string; icon: typeof Folder }> = {
  files: { title: "Explorador", icon: Folder },
  mail: { title: "Correo", icon: Mail },
  messages: { title: "Mensajería", icon: MessageSquare },
  case: { title: "Centro de seguridad", icon: ShieldAlert },
  timeline: { title: "Cronología forense", icon: Clock3 },
};

export default function PeakOSDesktop({ caseTitle, passageId, evidence = [], timeline = [], onClose, embedded = false, investigationProgress = 0, visible = true, desktopWallpaper = null }: { caseTitle: string; passageId: string; evidence?: CaseEvidence[]; timeline?: CaseTimelineEntry[]; onClose: () => void; embedded?: boolean; investigationProgress?: number; visible?: boolean; desktopWallpaper?: string | null }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [active, setActive] = useState<AppId | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [windowMenuOpen, setWindowMenuOpen] = useState<"Archivo" | "Edición" | "Ver" | "Herramientas" | "Ayuda" | null>(null);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [desktopQuery, setDesktopQuery] = useState("");
  const [selectedDesktopShortcut, setSelectedDesktopShortcut] = useState<AppId | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [desktopToast, setDesktopToast] = useState<CaseRecord | null>(null);
  const lastNotificationId = useRef<string | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [fileFolder, setFileFolder] = useState("Todos");
  const [fileSort, setFileSort] = useState<"name" | "person" | "code">("name");
  const [fileView, setFileView] = useState<"list" | "grid">("list");
  const [fileHistory, setFileHistory] = useState<string[]>(["Todos"]);
  const [fileHistoryIndex, setFileHistoryIndex] = useState(0);
  const [timelineQuery, setTimelineQuery] = useState("");
  const [timelinePerson, setTimelinePerson] = useState("Todos");
  const [caseRecords, setCaseRecords] = useState<CaseRecord[]>([]);
  const [evidenceAssets, setEvidenceAssets] = useState<CaseEvidenceAsset[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<CaseRecord | null>(null);
  const [mailQuery, setMailQuery] = useState("");
  const [mailFilter, setMailFilter] = useState<"all" | "linked" | "referenced">("all");
  const [messageQuery, setMessageQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [linkedEvidencePreview, setLinkedEvidencePreview] = useState<CaseRecord | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<CaseEvidence | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<CaseEvidence | null>(null);
  const openRef = useRef<((id: AppId) => void) | null>(null);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const updateClock = () => setClock(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 30_000);
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // Cerrar primero la capa superior; no minimizar ni cerrar la ventana que está debajo.
        if (linkedEvidencePreview) { setLinkedEvidencePreview(null); return; }
        if (helpOpen) { setHelpOpen(false); return; }
        if (previewEvidence) { setPreviewEvidence(null); return; }
        if (windowMenuOpen) { setWindowMenuOpen(null); return; }
        if (startMenuOpen) { setStartMenuOpen(false); return; }
        if (notificationCenterOpen) { setNotificationCenterOpen(false); return; }
        if (active) {
          setWindows(current => current.map(item => item.id === active ? { ...item, minimized: true } : item));
          setActive(null);
          return;
        }
        onClose();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.key === "Tab") {
        const target = event.target as HTMLElement | null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
        event.preventDefault();
        const available = windows.filter(item => !item.minimized);
        if (available.length > 1) {
          const currentIndex = available.findIndex(item => item.id === active);
          const direction = event.shiftKey ? -1 : 1;
          const nextIndex = (currentIndex + direction + available.length) % available.length;
          setActive(available[nextIndex].id);
        } else if (available.length === 1) {
          setActive(available[0].id);
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.altKey && active) {
        const viewportWidth = embedded ? (desktopRef.current?.clientWidth || 920) : window.innerWidth;
        const viewportHeight = embedded ? (desktopRef.current?.clientHeight || 600) : window.innerHeight;
        const halfWidth = Math.floor((viewportWidth - 24) / 2);
        const usableHeight = Math.max(240, viewportHeight - (embedded ? 68 : 108));
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const left = event.key === "ArrowLeft";
          setWindows(current => current.map(item => item.id === active ? {
            ...item, maximized: false, x: left ? 8 : halfWidth + 16, y: embedded ? 8 : 50,
            width: halfWidth, height: usableHeight, minimized: false
          } : item));
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setWindows(current => current.map(item => item.id === active ? (item.maximized ? { ...item, minimized: false } : { ...item, maximized: true, minimized: false, restore: { x: item.x, y: item.y, width: item.width, height: item.height } }) : item));
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setWindows(current => current.map(item => item.id === active ? { ...item, maximized: false, minimized: true, ...(item.restore || {}), restore: undefined } : item));
          setActive(null);
          return;
        }
      }
      if (!(event.ctrlKey || event.metaKey)) return;
      const shortcuts: Record<string, AppId> = { e: "files", m: "mail", t: "timeline" };
      const target = event.key.toLowerCase() === "m" && event.shiftKey ? "messages" : shortcuts[event.key.toLowerCase()];
      if (target) { event.preventDefault(); setStartMenuOpen(false); openRef.current?.(target); }
    };
    if (visible) window.addEventListener("keydown", keyboard);
    return () => { window.clearInterval(interval); window.removeEventListener("keydown", keyboard); };
  }, [onClose, embedded, startMenuOpen, notificationCenterOpen, windowMenuOpen, helpOpen, active, linkedEvidencePreview, previewEvidence, windows, visible]);
  const indexedEvidence = useMemo<CaseEvidence[]>(() => {
    const linkedIds = new Set(evidence.map(item => item.id).filter(Boolean));
    const attachments = evidenceAssets
      .filter(asset => !linkedIds.has(asset.id))
      .map((asset, index) => ({
        id: asset.id,
        code: asset.tag?.trim() || "IMG-" + String(index + 1).padStart(2, "0"),
        title: asset.title,
        detail: asset.description,
        source: asset.tag?.trim() || "Material documental del libro",
        scope: "Adjunto incorporado al expediente de esta historia.",
        suspect: "Expediente",
        imageUrl: asset.image_url,
      }));
    return [...evidence, ...attachments];
  }, [evidence, evidenceAssets]);
  const files = useMemo(() => indexedEvidence.map(item => ({
    name: item.code + "_" + item.title.replace(/[^a-z0-9]+/gi, "_") + ".pdf",
    type: item.imageUrl ? "Evidencia adjunta" : "Ficha de evidencia",
    size: "Expediente",
    item,
  })), [indexedEvidence]);
  const suspectFolders = useMemo(() => ["Todos", ...Array.from(new Set(files.map(file => file.item.suspect))).sort((a,b)=>a.localeCompare(b,"es"))], [files]);
  const navigateFiles = (folder: string) => {
    setFileFolder(folder);
    setFileHistory(current => [...current.slice(0, fileHistoryIndex + 1), folder]);
    setFileHistoryIndex(index => index + 1);
    setSelectedEvidence(null);
    setPreviewEvidence(null);
  };
  const moveFileHistory = (direction: -1 | 1) => {
    const next = fileHistoryIndex + direction;
    if (next < 0 || next >= fileHistory.length) return;
    setFileHistoryIndex(next);
    setFileFolder(fileHistory[next]);
    setSelectedEvidence(null);
    setPreviewEvidence(null);
  };
  const handleExplorerKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && ["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName)) return;
    if (event.key === "Backspace") { event.preventDefault(); moveFileHistory(-1); return; }
    if (event.key === "Escape" && previewEvidence) { event.preventDefault(); setPreviewEvidence(null); return; }
    if (event.key === "Enter" && selectedEvidence) { event.preventDefault(); setPreviewEvidence(selectedEvidence); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const current = filteredFiles.findIndex(file => file.item.code === selectedEvidence?.code && file.item.suspect === selectedEvidence?.suspect);
      const next = event.key === "ArrowDown" ? Math.min(filteredFiles.length - 1, current < 0 ? 0 : current + 1) : Math.max(0, current < 0 ? 0 : current - 1);
      if (filteredFiles[next]) setSelectedEvidence(filteredFiles[next].item);
    }
  };
  const filteredFiles = files
    .filter(file => {
      const query = fileQuery.trim().toLocaleLowerCase("es");
      const matchesFolder = fileFolder === "Todos" || file.item.suspect === fileFolder;
      const matchesQuery = !query || [file.name, file.item.suspect, file.item.code, file.item.title, file.item.source, file.item.detail]
        .some(value => value.toLocaleLowerCase("es").includes(query));
      return matchesFolder && matchesQuery;
    })
    .sort((a, b) => fileSort === "person"
      ? a.item.suspect.localeCompare(b.item.suspect, "es")
      : fileSort === "code"
        ? a.item.code.localeCompare(b.item.code, "es")
        : a.item.title.localeCompare(b.item.title, "es"));
  useEffect(() => {
    if (!passageId) {
      const frame = window.requestAnimationFrame(() => {
        setCaseRecords([]);
        setEvidenceAssets([]);
        setRecordsError("");
        setRecordsLoading(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    let active = true;
    let initialLoad = true;
    let controller: AbortController | null = null;

    const loadRecords = async () => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;

      if (initialLoad) {
        setRecordsLoading(true);
        setRecordsError("");
      }

      try {
        const response = await fetch(
          "/api/games/archivo-oculto/records?passageId=" + encodeURIComponent(passageId),
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: requestController.signal,
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error ?? "No se pudieron cargar los registros.");
        }
        if (!active || requestController.signal.aborted) return;
        setCaseRecords(Array.isArray(data.records) ? data.records as CaseRecord[] : []);
        setEvidenceAssets(Array.isArray(data.evidenceAssets) ? data.evidenceAssets as CaseEvidenceAsset[] : []);
        setRecordsError("");
      } catch (error) {
        if (
          active &&
          requestController.signal.aborted === false &&
          error instanceof Error &&
          error.name !== "AbortError"
        ) {
          setRecordsError(error.message || "Error de carga.");
        }
      } finally {
        if (active && initialLoad && !requestController.signal.aborted) {
          initialLoad = false;
          setRecordsLoading(false);
        }
      }
    };

    // The player cannot change case records while PEAK OS is open. Load once
    // on entry and use the visible refresh action instead of polling Supabase.
    const frame = window.requestAnimationFrame(() => { void loadRecords(); });
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      controller?.abort();
    };
  }, [passageId, manualRefreshKey]);
  const storedTimeline = useMemo(() => caseRecords.filter(record => record.record_type === "timeline"), [caseRecords]);
  const storedEmails = useMemo(() => caseRecords.filter(record => record.record_type === "email"), [caseRecords]);
  const filteredEmails = useMemo(() => {
    const query = mailQuery.trim().toLocaleLowerCase("es");
    return storedEmails.filter(record => {
      const matchesFilter = mailFilter === "all" || (mailFilter === "linked" ? Boolean(record.evidence_asset_id || record.evidence_code) : Boolean(record.document_reference));
      const matchesQuery = !query || [record.subject, record.title, record.sender, record.recipient, record.body, record.evidence_code].some(value => (value || "").toLocaleLowerCase("es").includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [storedEmails, mailQuery, mailFilter]);
  const allStoredMessages = useMemo(() => caseRecords.filter(record => record.record_type === "message"), [caseRecords]);
  const storedMessages = useMemo(
    () => allStoredMessages.filter(record => record.display_order <= Math.max(0, investigationProgress)),
    [allStoredMessages, investigationProgress],
  );
  const lockedMessages = allStoredMessages.length - storedMessages.length;
  const latestUnlockedMessage = useMemo(() => {
    if (!storedMessages.length) return null;
    return [...storedMessages].sort((a, b) =>
      a.display_order - b.display_order || a.occurred_at.localeCompare(b.occurred_at, "es"),
    )[storedMessages.length - 1];
  }, [storedMessages]);
  const recentNotifications = useMemo(() => [
    ...storedMessages.map(record => ({
      id: record.id, kind: "message" as const, title: record.title || "Mensaje nuevo",
      body: record.body, sender: record.sender, occurred_at: record.occurred_at,
      evidence_code: record.evidence_code,
    })),
    ...storedEmails.map(record => ({
      id: record.id, kind: "email" as const, title: record.subject || record.title || "Correo nuevo",
      body: record.body, sender: record.sender, occurred_at: record.occurred_at,
      evidence_code: record.evidence_code,
    })),
  ].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at, "es")).slice(0, 6), [storedEmails, storedMessages]);
  // New clue alerts follow the authored unlock order, not lexical date sorting.
  // That keeps a later clue visible even when its human-readable timestamp is not ISO-sortable.
  const latestUnlockedCommunication = latestUnlockedMessage;
  const unreadNotifications = recentNotifications.filter(item => !readNotificationIds.includes(item.id));
  const desktopSearchMatches = (Object.keys(APP_META) as AppId[]).filter(id => {
    const query = desktopQuery.trim().toLocaleLowerCase("es");
    return !query || APP_META[id].title.toLocaleLowerCase("es").includes(query) || id.includes(query);
  });
  const desktopRecordMatches = useMemo<DesktopSearchResult[]>(() => {
    const query = desktopQuery.trim().toLocaleLowerCase("es");
    if (!query) return [];
    const documents: DesktopSearchResult[] = files
      .filter(file => [file.item.title, file.item.code, file.item.suspect, file.item.source, file.item.detail].some(value => (value || "").toLocaleLowerCase("es").includes(query)))
      .map(file => ({ id: "doc:" + file.item.code + ":" + file.item.suspect, kind: "Documento", title: file.item.title, detail: file.item.code + " · " + file.item.suspect, app: "files" as const, query: file.item.title, folder: file.item.suspect, evidence: file.item }));
    const emails: DesktopSearchResult[] = storedEmails
      .filter(record => [record.subject, record.title, record.sender, record.recipient, record.body, record.evidence_code, record.document_reference].some(value => (value || "").toLocaleLowerCase("es").includes(query)))
      .map(record => ({ id: "mail:" + record.id, kind: "Correo", title: record.subject || record.title, detail: (record.sender || "Remitente no registrado") + " · " + record.occurred_at, app: "mail" as const, query: record.subject || record.title, record }));
    const messages: DesktopSearchResult[] = storedMessages
      .filter(record => [record.title, record.sender, record.recipient, record.body, record.evidence_code, record.document_reference].some(value => (value || "").toLocaleLowerCase("es").includes(query)))
      .map(record => ({ id: "message:" + record.id, kind: "Mensajería", title: record.title, detail: (record.sender || "Remitente no registrado") + " · " + record.occurred_at, app: "messages" as const, query: record.title, record }));
    return [...documents, ...emails, ...messages].slice(0, 8);
  }, [desktopQuery, files, storedEmails, storedMessages]);
  useEffect(() => {
    if (!latestUnlockedCommunication) return;
    if (lastNotificationId.current === null) {
      lastNotificationId.current = latestUnlockedCommunication.id;
      return;
    }
    if (lastNotificationId.current === latestUnlockedCommunication.id) return;
    lastNotificationId.current = latestUnlockedCommunication.id;
    setDesktopToast(latestUnlockedCommunication);
    const timer = window.setTimeout(() => {
      setDesktopToast(current => current?.id === latestUnlockedCommunication.id ? null : current);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [latestUnlockedCommunication]);
  const filteredMessages = useMemo(() => {
    const query = messageQuery.trim().toLocaleLowerCase("es");
    return storedMessages.filter(record => !query || [record.title, record.sender, record.recipient, record.body, record.evidence_code, record.document_reference].some(value => (value || "").toLocaleLowerCase("es").includes(query)));
  }, [storedMessages, messageQuery]);
  const messageThreads = useMemo(() => {
    const groups = new Map<string, CaseRecord[]>();
    for (const record of filteredMessages) {
      const key = [record.sender || "Remitente desconocido", record.recipient || "Destinatario desconocido"].sort((a,b)=>a.localeCompare(b,"es")).join(" ↔ ");
      const list = groups.get(key) || [];
      list.push(record);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).map(([key, records]) => ({ key, records: records.sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at,"es")), latest: records[records.length-1] })).sort((a,b)=>b.latest.occurred_at.localeCompare(a.latest.occurred_at,"es"));
  }, [filteredMessages]);
  const allTimeline = useMemo(() => {
    const merged = [
      ...timeline.map(item => ({ id: item.suspect + item.time + item.event, time: item.time, event: item.event, source: item.source, record: item.record, suspect: item.suspect, evidenceCode: "", evidenceTitle: "", evidenceDescription: "", evidenceUrl: "", priority: 0 })),
      ...storedTimeline.map(item => ({ id: item.id, time: item.occurred_at, event: item.body, source: item.source, record: "Registro" as const, suspect: item.suspect_name || "Expediente", evidenceCode: item.evidence_code, evidenceTitle: item.evidence_title, evidenceDescription: item.evidence_description, evidenceUrl: item.evidence_url, priority: 1 }))
    ];
    const unique = new Map<string, typeof merged[number]>();
    for (const item of merged) {
      const key = [item.suspect.trim().toLocaleLowerCase("es"), item.time.trim().toLocaleLowerCase("es")].join("|");
      const previous = unique.get(key);
      if (!previous || item.priority > previous.priority) unique.set(key, item);
    }
    return Array.from(unique.values()).sort((a,b)=>a.time.localeCompare(b.time,"es"));
  }, [timeline, storedTimeline]);
  const timelinePeople = useMemo(() => ["Todos", ...Array.from(new Set(allTimeline.map(item=>item.suspect))).sort((a,b)=>a.localeCompare(b,"es"))], [allTimeline]);
  const filteredTimeline = useMemo(() => {
    const query = timelineQuery.trim().toLocaleLowerCase("es");
    return allTimeline.filter(item => (timelinePerson === "Todos" || item.suspect === timelinePerson)
      && [item.time,item.event,item.source,item.record,item.suspect].join(" ").toLocaleLowerCase("es").includes(query));
  }, [allTimeline, timelineQuery, timelinePerson]);

  const open = useCallback((id: AppId) => {
    setStartMenuOpen(false);
    setNotificationCenterOpen(false);
    setWindowMenuOpen(null);
    setDesktopToast(null);
    setWindows(current => {
      const found = current.find(w => w.id === id);
      if (found) return current.map(w => w.id === id ? { ...w, minimized: false } : w);
      const viewportWidth = embedded ? (desktopRef.current?.clientWidth || 920) : window.innerWidth;
      const viewportHeight = embedded ? (desktopRef.current?.clientHeight || 600) : window.innerHeight;
      const minWidth = Math.min(320, Math.max(240, viewportWidth - 16));
      const minHeight = embedded ? Math.min(260, Math.max(220, viewportHeight - 72)) : Math.min(280, Math.max(180, viewportHeight - 110));
      const width = Math.min(embedded ? 820 : 860, Math.max(minWidth, viewportWidth - 48));
      const height = Math.min(embedded ? 500 : 640, Math.max(minHeight, viewportHeight - (embedded ? 72 : 112)));
      const offset = (current.length % 5) * 18;
      return [...current, {
        id, title: APP_META[id].title,
        x: Math.max(8, Math.round((viewportWidth - width) / 2) + offset),
        y: Math.max(8, Math.round((viewportHeight - height) / 2) + offset),
        width, height, minimized: false, maximized: embedded,
      }];
    });
    setActive(id);
    setSelectedDesktopShortcut(id);
    if (id === "messages" || id === "mail") {
      const visibleRecords = id === "messages" ? storedMessages : storedEmails;
      const kinds = visibleRecords.map(record => record.id);
      setReadNotificationIds(current => [...new Set([...current, ...kinds])]);
    }
  }, [embedded, storedMessages, storedEmails]);
  const openDesktopSearchResult = useCallback((result: DesktopSearchResult) => {
    if (result.app === "files") {
      setFileQuery(result.query);
      setFileFolder(result.folder || "Todos");
      setSelectedEvidence(result.evidence || null);
    } else if (result.app === "mail") {
      setMailQuery(result.query);
      setSelectedRecord(result.record || null);
    } else {
      setMessageQuery(result.query);
      setSelectedRecord(result.record || null);
      if (result.record) {
        setSelectedConversation([result.record.sender || "Remitente desconocido", result.record.recipient || "Destinatario desconocido"].sort((a, b) => a.localeCompare(b, "es")).join(" ↔ "));
      }
    }
    open(result.app);
  }, [open]);
  useEffect(() => {
    const fitWindowsToViewport = () => {
      const viewportWidth = embedded ? (desktopRef.current?.clientWidth || 920) : window.innerWidth;
      const viewportHeight = embedded ? (desktopRef.current?.clientHeight || 600) : window.innerHeight;
      const minWidth = Math.min(320, Math.max(240, viewportWidth - 16));
      const minHeight = embedded ? Math.min(260, Math.max(220, viewportHeight - 72)) : Math.min(280, Math.max(180, viewportHeight - 110));
      setWindows(current => current.map(item => {
        if (item.maximized) return item;
        const width = Math.min(Math.max(minWidth, item.width), Math.max(minWidth, viewportWidth - 16));
        const height = Math.min(Math.max(minHeight, item.height), Math.max(minHeight, viewportHeight - (embedded ? 72 : 108)));
        const x = Math.max(8, Math.min(item.x, viewportWidth - width - 8));
        const y = Math.max(10, Math.min(item.y, viewportHeight - height - 58));
        return { ...item, x, y, width, height };
      }));
    };
    window.addEventListener("resize", fitWindowsToViewport);
    return () => window.removeEventListener("resize", fitWindowsToViewport);
  }, [embedded]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const close = (id: AppId) => {
    setWindows(current => {
      const next = current.filter(w => w.id !== id);
      setActive(activeId => activeId === id ? (next.filter(w => !w.minimized).at(-1)?.id ?? null) : activeId);
      return next;
    });
  };
  const toggleMaximize = (id: AppId) => {
    setWindows(current => current.map(w => {
      if (w.id !== id) return w;
      if (w.maximized) return { ...w, maximized: false, ...(w.restore || {}), restore: undefined };
      return { ...w, maximized: true, restore: { x: w.x, y: w.y, width: w.width, height: w.height } };
    }));
    setActive(id);
  };

  const resize = (id: AppId, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const current = windows.find(item => item.id === id);
    if (!current || current.maximized) return;
    const startX = event.clientX, startY = event.clientY, startWidth = current.width, startHeight = current.height, pointerId = event.pointerId;
    setActive(id);
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const viewportWidth = embedded ? (desktopRef.current?.clientWidth || 920) : window.innerWidth;
      const viewportHeight = embedded ? (desktopRef.current?.clientHeight || 600) : window.innerHeight;
      const maxWidth = Math.max(320, viewportWidth - current.x - 8);
      const maxHeight = Math.max(280, viewportHeight - current.y - (embedded ? 62 : 62));
      const width = Math.max(320, Math.min(maxWidth, startWidth + e.clientX - startX));
      const height = Math.max(280, Math.min(maxHeight, startHeight + e.clientY - startY));
      setWindows(items => items.map(item => item.id === id ? { ...item, width, height } : item));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };

  const drag = (id: AppId, event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const windowState = windows.find(w => w.id === id);
    if (!windowState || windowState.maximized) return;
    const startX = event.clientX, startY = event.clientY;
    const originX = windowState.x, originY = windowState.y, pointerId = event.pointerId;
    setActive(id);
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const viewportWidth = embedded ? (desktopRef.current?.clientWidth || 920) : window.innerWidth;
      const viewportHeight = embedded ? (desktopRef.current?.clientHeight || 600) : window.innerHeight;
      const x = Math.max(0, Math.min(Math.max(0, viewportWidth - 280), originX + e.clientX - startX));
      const y = Math.max(8, Math.min(Math.max(8, viewportHeight - 96), originY + e.clientY - startY));
      setWindows(current => current.map(w => w.id === id ? { ...w, x, y } : w));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return <div
    ref={desktopRef}
    className={`${embedded ? "relative h-full w-full" : "fixed inset-0 z-[160]"} overflow-hidden bg-[#071a35] text-white peak-os-desktop ${visible ? "" : "hidden"}`}
    role="dialog" aria-modal="true" aria-label="Sistema operativo PEAK OS"
    style={{ isolation: "isolate", WebkitFontSmoothing: "antialiased", textRendering: "geometricPrecision" }}
  >
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{
      backgroundImage: desktopWallpaper
        ? "linear-gradient(145deg,rgba(4,18,43,.12),rgba(4,18,43,.28)),url('" + desktopWallpaper + "')"
        : "radial-gradient(ellipse 54% 82% at 74% 38%,rgba(115,166,190,.76) 0%,rgba(49,103,132,.42) 34%,transparent 70%),radial-gradient(ellipse 50% 76% at 24% 72%,rgba(38,91,111,.78) 0%,rgba(19,53,76,.44) 46%,transparent 74%),radial-gradient(ellipse 36% 54% at 54% 12%,rgba(191,207,202,.25) 0%,transparent 72%),linear-gradient(138deg,#101d2a 0%,#1b3b4c 48%,#0b1724 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#b79b65]/35 to-transparent" />
    </div>

    <section className="absolute inset-x-0 top-0 bottom-[68px] z-10" aria-label="Escritorio"
      onClick={event => {
        if (event.target === event.currentTarget) {
          setSelectedDesktopShortcut(null);
          setStartMenuOpen(false);
          setNotificationCenterOpen(false);
        }
      }}
      onKeyDown={event => {
        if ((event.key === "Enter" || event.key === " ") && selectedDesktopShortcut) {
          event.preventDefault();
          open(selectedDesktopShortcut);
        }
      }}
    >
      <div className="peak-os-shortcut-grid absolute left-5 top-5 grid w-[104px] grid-cols-1 content-start gap-2 border-0 bg-transparent p-0 shadow-none outline-none">
        {(["files","mail","messages","timeline","case"] as AppId[]).map(id => {
          const Icon = APP_META[id].icon;
          const selected = selectedDesktopShortcut === id;
          const descriptions: Record<AppId,string> = { files:"Documentos", mail:"Correo", messages:"Mensajes", timeline:"Cronología", case:"Seguridad" };
          return (
            <button key={id} type="button" aria-pressed={selected}
              onClick={() => setSelectedDesktopShortcut(id)}
              onDoubleClick={() => open(id)}
              onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); open(id); } }}
              className={`peak-os-shortcut group flex min-h-[76px] w-full flex-col items-center justify-center gap-1 border px-1 py-1.5 text-center transition ${selected ? "border-[#b7c79f]/55 bg-[#dce5d1]/[.19]" : "border-transparent hover:border-white/15 hover:bg-white/[.07]"}`}
              title={`Abrir ${APP_META[id].title}`}
            >
              <span className="relative grid h-10 w-10 place-items-center border-0 bg-transparent text-[#d7efff] drop-shadow-[0_2px_10px_rgba(30,155,255,.38)] group-hover:text-white">
                <Icon size={19} strokeWidth={1.6}/>
                {id === "messages" && unreadNotifications.filter(item => item.kind === "message").length > 0 && <span className="peak-os-app-badge">{unreadNotifications.filter(item => item.kind === "message").length}</span>}
                {id === "mail" && unreadNotifications.filter(item => item.kind === "email").length > 0 && <span className="peak-os-app-badge">{unreadNotifications.filter(item => item.kind === "email").length}</span>}
              </span>
              <span className="max-w-full truncate text-[11px] font-medium leading-tight text-white">{descriptions[id]}</span>
            </button>
          );
        })}
      </div>
    </section>

    {desktopToast && (
      <button type="button" onClick={() => {
        setReadNotificationIds(current => current.includes(desktopToast.id) ? current : [...current,desktopToast.id]);
        open(desktopToast.record_type === "email" ? "mail" : "messages");
      }} className="absolute right-3 top-3 z-[55] w-[min(310px,calc(100%-24px))] border border-[#c4c8b5]/40 bg-[#e3e5db]/95 p-3 text-left text-[#26372c] shadow-[0_10px_32px_rgba(0,0,0,.48)]">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] font-bold tracking-[.14em] text-[#53644e]"><span>PEAK OS · {desktopToast.record_type === "email" ? "CORREO" : "MENSAJERÍA"}</span><span>NUEVO</span></div>
        <p className="mt-2 truncate text-[12px] font-semibold">{desktopToast.title || "Nuevo mensaje"}</p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#566253]">{desktopToast.body}</p>
        <p className="mt-2 text-[10px] font-semibold text-[#51674d]">Abrir {desktopToast.record_type === "email" ? "Correo" : "Mensajería"} →</p>
      </button>
    )}

    {windows.filter(w => !w.minimized).map((w, index) => <section key={w.id} onPointerDown={() => { setActive(w.id); setWindowMenuOpen(null); }} className="peak-os-window absolute flex flex-col overflow-hidden rounded-[14px] border border-white/35 bg-[#f5f7fb] shadow-[0_24px_80px_rgba(0,0,0,.48)]" style={w.maximized ? { left: 8, top: 8, width: "calc(100% - 16px)", height: "calc(100% - 68px)", zIndex: active === w.id ? 40 : 20 + index } : { left: w.x, top: w.y, width: w.width, height: w.height, minWidth: "min(320px, calc(100vw - 16px))", minHeight: "min(280px, calc(100vh - 108px))", maxWidth: "calc(100vw - 16px)", maxHeight: "calc(100vh - 108px)", zIndex: active === w.id ? 40 : 20 + index }}>
      <div onDoubleClick={() => toggleMaximize(w.id)} onPointerDown={e => drag(w.id,e)} className="peak-os-window-titlebar flex h-12 shrink-0 cursor-move items-center justify-between bg-[#142b49] px-4 text-white touch-none">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold"><Monitor size={15}/><span className="truncate">{w.title}</span><span className="hidden truncate font-normal text-white/65 sm:inline">— {caseTitle}</span></div>
        <div className="flex shrink-0 gap-1"><button onPointerDown={e=>e.stopPropagation()} onClick={() => setWindows(c => c.map(x => x.id === w.id ? {...x,minimized:true}:x))} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label="Minimizar"><Minus size={14}/></button><button onPointerDown={e=>e.stopPropagation()} onClick={() => toggleMaximize(w.id)} className="grid h-7 w-8 place-items-center hover:bg-white/15" aria-label={w.maximized?"Restaurar":"Maximizar"}><span className="text-sm leading-none">{w.maximized?"❐":"□"}</span></button><button onPointerDown={e=>e.stopPropagation()} onClick={() => close(w.id)} className="grid h-7 w-8 place-items-center hover:bg-[#8b4a3d]" aria-label="Cerrar"><X size={14}/></button></div>
      </div>
      <div className="peak-os-menubar relative z-[48] flex h-10 shrink-0 items-center gap-1 border-b border-[#dbe3ef] bg-[#edf2f8] px-3 text-[12px] text-[#35465d]">
        {(["Archivo","Edición","Ver","Herramientas","Ayuda"] as const).map(item => (
          <button key={item} type="button" aria-expanded={windowMenuOpen === item}
            onPointerDown={event => event.stopPropagation()}
            onClick={() => { setActive(w.id); setWindowMenuOpen(current => current === item ? null : item); }}
            className={`h-7 border px-3 text-[12px] transition-colors ${windowMenuOpen === item ? "border-[#9aaa94] bg-[#edf0e6]" : "border-transparent hover:border-[#b1bca9] hover:bg-[#e4e9df]"}`}
          >{item}</button>
        ))}
      </div>
      {windowMenuOpen && active === w.id && (
        <div role="menu" aria-label={windowMenuOpen} className="absolute left-2 top-[77px] z-[90] min-w-[220px] border border-[#899a83] bg-[#e7ebdf] p-1 text-[#2e4032] shadow-[0_12px_28px_rgba(0,0,0,.42)]">
          {windowMenuOpen === "Archivo" && <>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); open("files"); }} className="peak-os-menu-item">Abrir Explorador</button>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); close(w.id); }} className="peak-os-menu-item">Cerrar esta ventana</button>
            <div className="my-1 border-t border-[#bdc8b7]"/>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); onClose(); }} className="peak-os-menu-item">Salir de PEAK OS</button>
          </>}
          {windowMenuOpen === "Edición" && <>
            <button role="menuitem" onClick={() => {
              setWindowMenuOpen(null);
              const reference = selectedRecord?.document_reference || selectedRecord?.evidence_code || selectedEvidence?.code || passageId;
              void navigator.clipboard?.writeText(reference).catch(() => undefined);
            }} className="peak-os-menu-item">Copiar referencia seleccionada</button>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); setReadNotificationIds(recentNotifications.map(item => item.id)); }} className="peak-os-menu-item">Marcar comunicaciones como leídas</button>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); setManualRefreshKey(value => value + 1); }} className="peak-os-menu-item">Actualizar registros del expediente</button>
          </>}
          {windowMenuOpen === "Ver" && <>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); setWindows(current => current.map(item => ({ ...item, minimized: true }))); setActive(null); }} className="peak-os-menu-item">Mostrar escritorio</button>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); setWindows(current => current.map(item => ({ ...item, minimized: false }))); setActive(w.id); }} className="peak-os-menu-item">Restaurar ventanas</button>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); toggleMaximize(w.id); }} className="peak-os-menu-item">{w.maximized ? "Restaurar tamaño" : "Maximizar ventana"}</button>
          </>}
          {windowMenuOpen === "Herramientas" && (Object.keys(APP_META) as AppId[]).map(id => {
            const Icon = APP_META[id].icon;
            return <button key={id} role="menuitem" onClick={() => open(id)} className="peak-os-menu-item"><Icon size={14}/>{APP_META[id].title}</button>;
          })}
          {windowMenuOpen === "Ayuda" && <>
            <button role="menuitem" onClick={() => { setWindowMenuOpen(null); setHelpOpen(true); }} className="peak-os-menu-item">Guía de uso de PEAK OS</button>
            <div className="my-1 border-t border-[#bdc8b7]"/>
            <p className="px-3 py-2 font-mono text-[9px] tracking-[.12em] text-[#75816f]">PEAK SYSTEMS · ESTACIÓN LOCAL</p>
          </>}
        </div>
      )}
      {w.id === "files" && (
        <div
          onKeyDown={handleExplorerKeys}
          tabIndex={0}
          aria-label="Explorador de archivos. Usa flechas para seleccionar, Enter para abrir y retroceso para volver."
          className="peak-os-workspace flex min-h-0 flex-1 flex-col bg-[#dfe6d8] text-xs outline-none"
        >
          <div className="flex min-h-0 flex-1">
            <aside className="peak-os-sidebar hidden w-40 shrink-0 border-r border-[#b4c2ac] bg-[#d4dfd0] p-3 sm:block">
              <div className="mb-3 flex items-center justify-between border-b border-[#c0cdb9] pb-2">
                <p className="font-mono text-[10px] font-bold tracking-widest text-[#526b50]">CARPETAS</p>
                <span className="font-mono text-[9px] text-[#71806f]">{suspectFolders.length}</span>
              </div>
                <div className="space-y-1">
                  {suspectFolders.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => navigateFiles(name)}
                      className={[
                        "flex w-full items-center gap-2 px-2 py-2 text-left text-[11px] transition",
                        fileFolder === name
                          ? "bg-[#c7d9c0] font-semibold text-[#2d4933]"
                          : "text-[#596d56] hover:bg-[#dce6d5]",
                      ].join(" ")}
                    >
                      <Folder size={12} />
                      <span className="min-w-0 flex-1 truncate">
                        {name === "Todos" ? "Todos los registros" : name}
                      </span>
                      <span className="font-mono text-[9px]">
                        {name === "Todos"
                          ? files.length
                          : files.filter((file) => file.item.suspect === name).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </aside>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex border border-[#b4c2ac] bg-[#edf1e8] p-0.5" role="group" aria-label="Modo de vista">
                  <button
                    type="button"
                    aria-pressed={fileView === "list"}
                    onClick={() => setFileView("list")}
                    className={fileView === "list"
                      ? "bg-[#c7d9c0] px-2.5 py-1.5 text-[11px] font-bold text-[#2d4933]"
                      : "px-2.5 py-1.5 text-[11px] text-[#667564]"}
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    aria-pressed={fileView === "grid"}
                    onClick={() => setFileView("grid")}
                    className={fileView === "grid"
                      ? "bg-[#c7d9c0] px-2.5 py-1.5 text-[11px] font-bold text-[#2d4933]"
                      : "px-2.5 py-1.5 text-[11px] text-[#667564]"}
                  >
                    Iconos
                  </button>
                </div>

                <button
                  type="button"
                  disabled={fileHistoryIndex === 0}
                  onClick={() => moveFileHistory(-1)}
                  className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-xs text-[#405840] disabled:opacity-35"
                  aria-label="Volver a carpeta anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={fileHistoryIndex >= fileHistory.length - 1}
                  onClick={() => moveFileHistory(1)}
                  className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-xs text-[#405840] disabled:opacity-35"
                  aria-label="Avanzar a carpeta siguiente"
                >
                  →
                </button>

                                <label className="peak-os-search-field flex min-w-[min(100%,190px)] flex-[2_1_190px] items-center gap-2 border border-[#9fb0bf] bg-[#e4ebf1] px-3 py-2 text-[#40566b] shadow-[inset_0_1px_3px_rgba(34,54,73,.12)]">
                  <Search size={14} />
                  <span className="sr-only">Buscar archivos</span>
                  <input
                    value={fileQuery}
                    onChange={(event) => setFileQuery(event.target.value)}
                    placeholder="Buscar en este expediente…"
                    className="min-w-0 flex-1 bg-transparent text-xs text-[#26392c] outline-none placeholder:text-[#92998f]"
                  />
                </label>

                <select
                  aria-label="Ordenar documentos"
                  value={fileSort}
                  onChange={(event) => setFileSort(event.target.value as "name" | "person" | "code")}
                  className="border border-[#b4c2ac] bg-[#edf1e8] px-2 py-2 text-[11px] text-[#405840]"
                >
                  <option value="name">Orden: nombre</option>
                  <option value="person">Orden: persona</option>
                  <option value="code">Orden: código</option>
                </select>
              </div>

              <div className="mb-3 flex items-center justify-between text-[10px] text-[#64785f]">
                <span>{filteredFiles.length} documentos encontrados</span>
                <button
                  type="button"
                  onClick={() => {
                    setFileQuery("");
                    navigateFiles("Todos");
                  }}
                  className="underline decoration-[#a6b49e] underline-offset-2 hover:text-[#2c4432]"
                >
                  Limpiar filtros
                </button>
              </div>

              {fileView === "list" && (
                <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(70px,.8fr)] border-b border-[#b4c2ac] pb-2 font-mono text-[10px] font-bold tracking-wider text-[#697468] sm:grid-cols-[minmax(0,1.5fr)_minmax(90px,.8fr)_70px]">
                  <span>DOCUMENTO</span>
                  <span>CLASIFICACIÓN</span>
                  <span className="hidden sm:block">ESTADO</span>
                </div>
              )}

              <div
                className={[
                  "min-h-[280px] flex-[1_1_0%] overflow-y-auto overflow-x-hidden peak-os-scroll peak-os-explorer-list",
                  fileView === "grid"
                    ? "grid auto-rows-max grid-cols-2 content-start gap-2 p-1 sm:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col",
                ].join(" ")}
              >
                {filteredFiles.map((file) => (
                  <button
                    type="button"
                    key={file.item.code + "-" + file.item.suspect}
                    onClick={() => setSelectedEvidence(file.item)}
                    onDoubleClick={() => setPreviewEvidence(file.item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setPreviewEvidence(file.item);
                      }
                    }}
                    className={[
                      "peak-os-explorer-file text-left text-[#26392c] transition hover:bg-[#d0dfca] focus:bg-[#e1e8dc] focus:outline-none",
                      fileView === "grid"
                        ? "flex min-h-[154px] flex-col items-start justify-between border border-[#c3d0bd] bg-[#e8eee3] p-3"
                        : "grid min-h-[58px] w-full grid-cols-[minmax(0,1.5fr)_minmax(70px,.8fr)] items-center border-b border-[#c3d0bd] px-2 py-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(90px,.8fr)_70px]",
                      selectedEvidence?.code === file.item.code && selectedEvidence?.suspect === file.item.suspect
                        ? "bg-[#c7d9c0] ring-inset ring-1 ring-[#829a78]"
                        : "",
                    ].join(" ")}
                  >
                    <span className={["flex min-w-0 items-center gap-2", fileView === "grid" ? "w-full flex-col items-start gap-3" : ""].join(" ")}>
                      <span className={["grid shrink-0 place-items-center text-[#647d65]", fileView === "grid" ? "h-10 w-10 border border-[#b9c7b2] bg-[#dce5d6]" : "h-7 w-7"].join(" ")}>
                        <FileText size={fileView === "grid" ? 22 : 15} />
                      </span>
                      <span className="min-w-0 w-full">
                        <span className={fileView === "grid" ? "block line-clamp-3 whitespace-normal break-words text-[12px] font-semibold leading-5" : "block truncate font-semibold"}>{file.item.title}</span>
                        <span className="mt-1 block whitespace-normal break-words font-mono text-[10px] leading-4 text-[#879080]">{file.item.code} · {file.item.suspect}</span>
                      </span>
                    </span>
                    {fileView === "list" ? (
                      <>
                        <span className="truncate text-[11px] text-[#596d56]">{file.type}</span>
                        <span className="hidden font-mono text-[10px] text-[#61775e] sm:block">INDEXADO</span>
                      </>
                    ) : (
                      <>
                        <span className="mt-2 border border-[#c0cdb8] px-2 py-1 font-mono text-[9px] text-[#65765f]">{file.type}</span>
                        {file.item.imageUrl && <span className="mt-1 text-[9px] font-semibold text-[#566b53]">ADJUNTO DISPONIBLE</span>}
                      </>
                    )}
                  </button>
                ))}

                {filteredFiles.length === 0 && (
                  <div className="grid h-full min-h-32 place-items-center px-5 text-center">
                    <div>
                      <Folder size={24} className="mx-auto mb-3 text-[#8a9981]" />
                      <p className="text-xs font-semibold text-[#4c6249]">
                        {files.length === 0
                          ? "Todavía no hay fichas documentales para este expediente."
                          : "No encontramos documentos con esos filtros."}
                      </p>
                      <p className="mt-2 max-w-xs text-[11px] leading-5 text-[#7d8878]">
                        {files.length === 0
                          ? "Cuando el expediente tenga evidencias registradas, aparecerán aquí. Los archivos originales solo se mostrarán si están adjuntos."
                          : "Prueba otra búsqueda o vuelve a Todos los registros."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex shrink-0 items-center justify-between border-t border-[#bdcbb7] pt-3 text-[10px] text-[#64785f]">
                <span>{files.length} registros · Fuente del expediente</span>
                <span>Un clic: detalles · Enter o doble clic: abrir</span>
              </div>
            </div>

            <aside className={selectedEvidence ? "hidden w-[245px] shrink-0 border-l border-[#b4c2ac] bg-[#dce5d6] p-4 lg:block" : "hidden"}>
              {selectedEvidence && (
                <>
                  <p className="font-mono text-[10px] tracking-[.16em] text-[#7b806e]">VISTA DE DETALLE</p>
                  {selectedEvidence.imageUrl ? <Image src={selectedEvidence.imageUrl} alt={selectedEvidence.title} width={120} height={88} unoptimized className="my-4 max-h-24 w-full border border-[#b9c4b1] bg-[#d9e0d3] object-contain" /> : <div className="my-4 grid h-12 w-12 place-items-center border border-[#b9c4b1] bg-[#d9e0d3] text-[#55715d]"><FileText size={22} /></div>}
                  <h4 className="text-sm font-bold leading-5 text-[#2e4934]">{selectedEvidence.title}</h4>
                  <p className="mt-2 font-mono text-[10px] text-[#78816f]">{selectedEvidence.code} · {selectedEvidence.suspect}</p>
                  <div className="my-4 h-px bg-[#c8cbbd]" />
                  <p className="font-mono text-[9px] tracking-widest text-[#617b59]">FUENTE</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#5c6659]">{selectedEvidence.source}</p>
                  <p className="mt-4 font-mono text-[9px] tracking-widest text-[#617b59]">ALCANCE</p>
                  <p className="mt-1 line-clamp-5 text-[11px] leading-5 text-[#5c6659]">{selectedEvidence.scope}</p>
                  <button
                    type="button"
                    onClick={() => setPreviewEvidence(selectedEvidence)}
                    className="mt-5 w-full border border-[#667e66] bg-[#354d3c] px-3 py-2.5 font-mono text-[10px] tracking-wider text-[#f0eddf] transition hover:bg-[#49634d]"
                  >
                    ABRIR DOCUMENTO ↗
                  </button>
                </>
)}
            </aside>
          </div>
        </div>
      )}
      {w.id === "mail" && <div className="peak-os-app-surface flex min-h-0 flex-1 flex-col bg-[#e0e7da] text-[#2c4432]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#b4c2ac] bg-[#e3e9dd] px-4 py-3">
          <div><p className="font-mono text-[10px] tracking-[.18em] text-[#7b846f]">CORRESPONDENCIA DIGITAL</p><h3 className="mt-1 text-sm font-bold">Correo del expediente</h3><p className="mt-1 text-[11px] text-[#7c8576]">{caseTitle} · {filteredEmails.length} de {storedEmails.length} mensajes</p></div>
          <label className="peak-os-search-field flex min-w-[170px] flex-1 items-center gap-2 border border-[#9fb0bf] bg-[#e4ebf1] px-3 py-2 shadow-[inset_0_1px_3px_rgba(34,54,73,.12)] sm:max-w-[280px]"><Search size={13}/><span className="sr-only">Buscar correo</span><input value={mailQuery} onChange={e=>setMailQuery(e.target.value)} placeholder="Buscar asunto, remitente…" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#92998f]"/></label>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#b4c2ac] bg-[#d4dfd0] px-3 py-2">
          {([{id:"all",label:"Todos"},{id:"linked",label:"Con evidencia"},{id:"referenced",label:"Con radicado"}] as const).map(tab=><button key={tab.id} onClick={()=>setMailFilter(tab.id)} className={`border px-3 py-1.5 text-[11px] transition ${mailFilter===tab.id?"border-[#718d70] bg-[#c1d2ba] font-bold text-[#2d4933]":"border-transparent text-[#61735d] hover:bg-[#e1e8dc]"}`}>{tab.label}</button>)}
        </div>
        {recordsLoading?<p className="p-8 text-center text-xs text-[#596d56]">Consultando archivo…</p>:recordsError?<p role="alert" className="p-8 text-center text-xs text-[#8b493d]">{recordsError}</p>:<div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 w-full flex-col border-r border-[#b4c2ac] md:w-[48%]">
            <div className="flex items-center justify-between border-b border-[#c2d0bb] px-4 py-2 font-mono text-[9px] tracking-wider text-[#778174]"><span>MENSAJES INDEXADOS</span><span>{filteredEmails.length.toString().padStart(2,"0")}</span></div>
            <div className="min-h-0 flex-1 overflow-auto peak-os-scroll divide-y divide-[#c2d0bb]">
              {filteredEmails.map(record=><button key={record.id} onClick={()=>setSelectedRecord(record)} className={`block w-full border-l-2 px-4 py-3 text-left transition hover:bg-[#dce7d8] ${selectedRecord?.id===record.id?"border-[#526f50] bg-[#c7d9c0]":"border-transparent"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-[#304936]">{record.sender||"Remitente no registrado"}</span><span className="shrink-0 font-mono text-[9px] text-[#7b846f]">{record.occurred_at}</span></div>
                <p className="mt-1 truncate text-xs font-bold text-[#2e4934]">{record.subject||record.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#667264]">{record.body}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{record.evidence_code&&<span className="border border-[#b4c5a9] bg-[#e5ecdf] px-1.5 py-0.5 font-mono text-[9px] text-[#587052]">{record.evidence_code}</span>}{record.document_reference&&<span className="border border-[#c3c9b6] px-1.5 py-0.5 font-mono text-[9px] text-[#6b725f]">{record.document_reference}</span>}</div>
              </button>)}
              {!filteredEmails.length&&<div className="grid min-h-40 place-items-center p-6 text-center"><div><Mail size={24} className="mx-auto text-[#82917a]"/><p className="mt-3 text-xs font-semibold text-[#486149]">No hay correos en esta vista</p><p className="mt-1 text-[11px] leading-5 text-[#858d7d]">Prueba otro filtro o cambia la búsqueda. No se generan mensajes ficticios.</p></div></div>}
            </div>
          </div>
          <div className="hidden min-w-0 flex-1 flex-col bg-[#e9eee4] md:flex">
            {selectedRecord?.record_type==="email"?<div className="min-h-0 flex-1 overflow-auto peak-os-scroll p-5 lg:p-7">
              <div className="flex items-start justify-between gap-3 border-b border-[#c5d0be] pb-4"><div><p className="font-mono text-[9px] tracking-[.18em] text-[#7b846f]">LECTURA DE MENSAJE</p><h4 className="mt-2 text-base font-bold leading-6 text-[#2c4432]">{selectedRecord.subject||selectedRecord.title}</h4></div><span className="border border-[#a9bb9e] bg-[#dce6d5] px-2 py-1 font-mono text-[9px] text-[#526650]">{selectedRecord.classification||"RESERVADO"}</span></div>
              <dl className="mt-4 grid grid-cols-[58px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[11px]"><dt className="text-[#7b846f]">DE</dt><dd className="break-words text-[#344b38]">{selectedRecord.sender||"No registrado"}</dd><dt className="text-[#7b846f]">PARA</dt><dd className="break-words text-[#344b38]">{selectedRecord.recipient||"No registrado"}</dd><dt className="text-[#7b846f]">FECHA</dt><dd className="text-[#344b38]">{selectedRecord.occurred_at}</dd></dl>
              <div className="my-5 h-px bg-[#c5d0be]"/><p className="whitespace-pre-wrap text-xs leading-7 text-[#344b38]">{selectedRecord.body}</p>
              <div className="mt-6 border-t border-[#c5d0be] pt-4"><p className="font-mono text-[9px] tracking-[.16em] text-[#7b846f]">TRAZABILIDAD DOCUMENTAL</p><p className="mt-2 text-[11px] text-[#596d56]">FUENTE: {selectedRecord.source||"No especificada"}</p><p className="mt-1 font-mono text-[10px] text-[#7a806f]">{selectedRecord.document_reference||"SIN RADICADO"} · {selectedRecord.page_number||"FOLIO NO ASIGNADO"}</p>{selectedRecord.evidence_asset_id&&<button onClick={()=>setLinkedEvidencePreview(selectedRecord)} className="mt-4 border border-[#718d70] bg-[#dce6d5] px-3 py-2 font-mono text-[10px] tracking-wider text-[#526650] hover:bg-[#c7d9c0]">ABRIR DOCUMENTO ADJUNTO ↗</button>}</div>
            </div>:<div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><Mail size={30} className="text-[#87977f]"/><h4 className="mt-4 text-sm font-bold text-[#39483d]">Selecciona un correo</h4><p className="mt-2 max-w-xs text-[11px] leading-5 text-[#727c70]">El contenido completo, los participantes y las referencias aparecerán aquí.</p></div>}
          </div>
        </div>}
      </div>}
      {w.id === "messages" && <div className="peak-os-app-surface flex min-h-0 flex-1 flex-col bg-[#dfe8da] text-[#29412f]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#afc2aa] bg-[#d4e0d0] px-4 py-3">
          <div><p className="font-mono text-[10px] tracking-[.18em] text-[#6d806b]">RED DE COMUNICACIONES</p><h3 className="mt-1 text-sm font-bold">Mensajería del expediente</h3><p className="mt-1 text-[11px] text-[#71816e]">{caseTitle} · {messageThreads.length} conversaciones · {filteredMessages.length} mensajes</p></div>
          <label className="peak-os-search-field flex min-w-[170px] flex-1 items-center gap-2 border border-[#9fb0bf] bg-[#e4ebf1] px-3 py-2 shadow-[inset_0_1px_3px_rgba(34,54,73,.12)] sm:max-w-[280px]"><Search size={13}/><span className="sr-only">Buscar conversaciones</span><input value={messageQuery} onChange={e=>setMessageQuery(e.target.value)} placeholder="Buscar contacto o mensaje…" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#899686]"/></label>
        </div>
        {recordsLoading?<p className="p-8 text-center text-xs text-[#596d56]">Consultando comunicaciones…</p>:recordsError?<p role="alert" className="p-8 text-center text-xs text-[#8b493d]">{recordsError}</p>:<div className="flex min-h-0 flex-1">
          <aside className="flex w-full min-h-0 flex-col border-r border-[#b5c7b0] bg-[#e5ecdf] sm:w-[42%] lg:w-[34%]">
            <div className="flex items-center justify-between border-b border-[#c4d2bf] px-4 py-2 font-mono text-[9px] tracking-wider text-[#7a8975]"><span>CONVERSACIONES</span><span>{messageThreads.length.toString().padStart(2,"0")}</span></div>
            <div className="min-h-0 flex-1 overflow-auto peak-os-scroll divide-y divide-[#c8d5c2]">
              {messageThreads.map(thread=><button key={thread.key} onClick={()=>{setSelectedConversation(thread.key);setSelectedRecord(thread.latest);}} className={`block w-full border-l-[3px] px-4 py-3 text-left transition hover:bg-[#dce8d7] ${selectedConversation===thread.key?"border-[#476d49] bg-[#cfdfc9]":"border-transparent"}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate text-[12px] font-bold text-[#304b35]">{thread.key}</span><span className="shrink-0 font-mono text-[9px] text-[#7b8975]">{thread.latest.occurred_at}</span></div>
                <p className="mt-1 truncate text-[11px] text-[#526b50]">{thread.latest.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#71806d]">{thread.latest.body}</p>
                <div className="mt-2 flex items-center justify-between"><span className="font-mono text-[9px] text-[#72866d]">{thread.records.length} {thread.records.length===1?"MENSAJE":"MENSAJES"}</span>{thread.latest.evidence_code&&<span className="border border-[#b5c8ac] bg-[#edf3e8] px-1.5 py-0.5 font-mono text-[9px] text-[#567451]">{thread.latest.evidence_code}</span>}</div>
              </button>)}
              {!messageThreads.length&&<div className="grid min-h-40 place-items-center p-6 text-center"><div><MessageSquare size={24} className="mx-auto text-[#82947d]"/><p className="mt-3 text-xs font-semibold text-[#486149]">No hay conversaciones registradas</p><p className="mt-1 text-[11px] leading-5 text-[#858d7d]">{lockedMessages > 0 ? `Hay ${lockedMessages} comunicaciones selladas. Responde más preguntas del libro para desbloquearlas.` : "Este expediente todavía no tiene comunicaciones registradas. No se crean mensajes ficticios."}</p></div></div>}
            </div>
          </aside>
          <section className="hidden min-w-0 flex-1 flex-col bg-[#edf1e8] sm:flex">
            {selectedConversation&&messageThreads.find(thread=>thread.key===selectedConversation)?<><div className="shrink-0 border-b border-[#c5d2bf] bg-[#e2eadd] px-5 py-4"><p className="font-mono text-[9px] tracking-[.18em] text-[#7b8a75]">HILO DE COMUNICACIÓN</p><h4 className="mt-1 text-sm font-bold text-[#304b35]">{selectedConversation}</h4><p className="mt-1 text-[10px] text-[#788875]">{messageThreads.find(thread=>thread.key===selectedConversation)?.records.length} registros · orden cronológico</p></div>
              <div className="min-h-0 flex-1 overflow-auto peak-os-scroll px-4 py-5 lg:px-6">{messageThreads.find(thread=>thread.key===selectedConversation)?.records.map(record=><article key={record.id} className="mb-4 max-w-[88%]"><div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] text-[#758572]"><span className="font-semibold text-[#496347]">{record.sender||"Remitente no registrado"}</span><time className="font-mono">{record.occurred_at}</time></div><div className="border border-[#c2d1bc] bg-[#e1eadc] px-4 py-3 shadow-[0_1px_2px_rgba(40,65,45,.06)]"><p className="text-[12px] font-bold text-[#304b35]">{record.title}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[#405840]">{record.body}</p>{record.source&&<p className="mt-3 border-t border-[#c6d4c0] pt-2 text-[10px] text-[#71816e]">FUENTE: {record.source}</p>}<div className="mt-2 flex flex-wrap gap-2">{record.evidence_code&&<span className="font-mono text-[9px] text-[#597853]">EVIDENCIA: {record.evidence_code}</span>}{record.document_reference&&<span className="font-mono text-[9px] text-[#7a806f]">RADICADO: {record.document_reference}</span>}</div>{record.evidence_asset_id&&<button onClick={()=>setLinkedEvidencePreview(record)} className="mt-3 border border-[#8ba384] bg-[#d7e4d1] px-3 py-1.5 font-mono text-[9px] tracking-wider text-[#496847] hover:bg-[#c8dbc0]">CONSULTAR ADJUNTO ↗</button>}</div></article>)}</div>
            </>:<div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><MessageSquare size={30} className="text-[#87977f]"/><h4 className="mt-4 text-sm font-bold text-[#39483d]">Selecciona una conversación</h4><p className="mt-2 max-w-xs text-[11px] leading-5 text-[#727c70]">El historial, sus participantes y las referencias documentales se mostrarán en este panel.</p></div>}
          </section>
        </div>}
      </div>}
      {w.id === "timeline" && <div className="peak-os-app-surface min-h-0 flex-1 overflow-auto peak-os-scroll bg-[#e0e7da] p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#b4c2ac] pb-4">
          <div><p className="font-mono text-[10px] tracking-[.18em] text-[#78816f]">SECUENCIA DOCUMENTAL</p><h3 className="mt-1 text-lg font-bold text-[#2c4432]">Cronología forense</h3><p className="mt-1 text-[12px] text-[#6c7569]">{caseTitle} · {filteredTimeline.length} de {allTimeline.length} eventos</p></div>
          <div className="flex flex-wrap gap-2"><label className="peak-os-search-field flex min-w-[190px] items-center gap-2 border border-[#9fb0bf] bg-[#e4ebf1] px-3 py-2 text-[#40566b] shadow-[inset_0_1px_3px_rgba(34,54,73,.12)]"><Search size={13}/><span className="sr-only">Filtrar cronología</span><input value={timelineQuery} onChange={e=>setTimelineQuery(e.target.value)} placeholder="Buscar hecho, fuente…" className="min-w-0 flex-1 bg-transparent text-xs text-[#26392c] outline-none placeholder:text-[#92998f]"/></label><select value={timelinePerson} onChange={e=>setTimelinePerson(e.target.value)} className="border border-[#b4c2ac] bg-[#edf1e8] px-3 py-2 text-[11px] text-[#405840] outline-none"><option value="Todos">Todas las personas</option>{timelinePeople.filter(name=>name!=="Todos").map(name=><option key={name} value={name}>{name}</option>)}</select></div>
        </div>
        {recordsLoading&&<p className="mt-4 text-[11px] text-[#71816e]">Consultando registros adicionales del expediente…</p>}
        {filteredTimeline.length ? <div className="mt-5 space-y-6">{timelinePeople.filter(person=>person!=="Todos"&&(timelinePerson==="Todos"||timelinePerson===person)).map(person=>{
          const entries=filteredTimeline.filter(item=>item.suspect===person);
          if(!entries.length)return null;
          return <section key={person}><div className="mb-3 flex items-center gap-2"><span className="h-px flex-1 bg-[#c7cbbb]"/><h4 className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#526650]">{person}</h4><span className="h-px flex-1 bg-[#c7cbbb]"/></div><div className="space-y-2">{entries.map((item,index)=><article key={item.id} className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-3">
            <div className="relative flex min-h-full flex-col items-center">
              <time className="w-full border border-[#b8c7d4] bg-[#e8eef3] px-1.5 py-2 text-center font-mono text-[10px] font-bold leading-4 text-[#31516d]">{item.time}</time>
              {index < entries.length - 1 && <span className="mt-1 min-h-5 w-px flex-1 bg-[#a9bdcd]"/>}
            </div>
            <div className="min-w-0 border border-[#c6d2dc] bg-[#f4f7f9] px-3.5 py-3 shadow-[0_1px_2px_rgba(31,55,78,.06)]">
              <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#526b80]">{item.record}</span>{item.evidenceCode&&<span className="border border-[#c4d3df] bg-[#e7eff5] px-1.5 py-0.5 font-mono text-[9px] text-[#49657d]">{item.evidenceCode}</span>}</div>
              <p className="text-[12px] leading-[1.75] text-[#283d50]">{item.event}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#d8e1e8] pt-2"><p className="min-w-0 text-[10px] leading-4 text-[#667c8e]"><span className="font-semibold uppercase tracking-wider">Fuente</span> · {item.source}</p>{item.evidenceCode&&<button onClick={()=>{const linked=evidence.find(file=>file.code===item.evidenceCode);if(linked)setPreviewEvidence(linked);else {const record=storedTimeline.find(entry=>entry.id===item.id);if(record?.evidence_asset_id)setLinkedEvidencePreview(record);}}} className="shrink-0 border border-[#9eb2c4] bg-[#e7eff5] px-2.5 py-1.5 font-mono text-[9px] font-semibold tracking-wide text-[#365771] hover:bg-[#d8e6f0]">CONSULTAR EVIDENCIA ↗</button>}</div>
            </div>
          </article>)}</div></section>;
        })}</div>:<p className="mt-8 border border-dashed border-[#a9bb9e] p-8 text-center text-xs text-[#78816f]">{allTimeline.length?"No hay eventos que coincidan con los filtros.":"Este expediente todavía no tiene una cronología digital asociada. La lectura física sigue siendo la fuente principal."}</p>}
        {recordsError&&<p role="alert" className="mt-4 text-[11px] text-[#8b493d]">{recordsError}</p>}
        <p className="mt-6 border-t border-[#bdcbb7] pt-3 text-[10px] leading-5 text-[#7a806f]">Las horas y fuentes se presentan tal como aparecen en el expediente. Una declaración no equivale a un hecho verificado.</p>
      </div>}
      {w.id === "case" && <div className="peak-os-app-surface min-h-0 flex-1 overflow-auto peak-os-scroll p-6"><div className="flex items-center gap-3 border-b border-[#b4c2ac] pb-4"><ShieldAlert size={25} className="text-[#54744f]"/><div><p className="text-[11px] uppercase tracking-widest text-[#76806f]">Archivo de investigación</p><h3 className="font-bold">{caseTitle}</h3></div></div><div className="mt-4 flex items-center justify-between text-[11px] text-[#697468]"><span>{indexedEvidence.length} registros documentados</span><span>FUENTE Y ALCANCE</span></div>{indexedEvidence.length ? <div className="mt-3 space-y-3">{indexedEvidence.map(item=><article key={item.id || item.suspect+item.code} className="border border-[#b4c2ac] bg-[#edf1e8] p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[11px] font-bold text-[#55715d]">{item.code} · {item.suspect}</span><span className="text-[10px] uppercase tracking-wider text-[#617b59]">Ficha</span></div><h4 className="mt-2 text-sm font-bold text-[#26392c]">{item.title}</h4><p className="mt-2 text-xs leading-6 text-[#48544a]">{item.detail}</p><p className="mt-3 text-[11px] text-[#64745f]">FUENTE: {item.source}</p><p className="mt-1 border-l-2 border-[#819a72] bg-[#dce6d5] px-3 py-2 text-[11px] leading-5 text-[#6d6657]">ALCANCE: {item.scope}</p></article>)}</div> : <p className="mt-6 border border-[#a9bb9e] bg-[#dce6d5] p-4 text-xs leading-6 text-[#5c574b]">Este libro aún no tiene fichas digitales de evidencia asociadas. El contenido de la lectura física sigue siendo la fuente principal.</p>}</div>}
      {!w.maximized && <div onPointerDown={event => resize(w.id,event)} role="separator" aria-label={`Cambiar tamaño de ${w.title}`} className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-nwse-resize touch-none before:absolute before:bottom-1 before:right-1 before:h-2 before:w-2 before:border-b-2 before:border-r-2 before:border-[#71836b]"/>}
    </section>)}
    {linkedEvidencePreview && <div className="absolute inset-0 z-[75] grid place-items-center overflow-auto peak-os-scroll bg-[#020704]/80 p-4"><article className="relative my-auto max-h-[92%] w-full max-w-[860px] overflow-auto peak-os-scroll border border-[#b7a276] bg-[#e8e3d3] text-[#30382e] shadow-[0_30px_110px_rgba(0,0,0,.8)]"><div className="pointer-events-none absolute inset-0 opacity-[.13]" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0px,transparent 27px,rgba(95,83,58,.18) 28px),radial-gradient(#8c8064 .55px,transparent .7px)",backgroundSize:"100% 28px,5px 5px"}}/><div className="pointer-events-none absolute right-8 top-24 rotate-[14deg] border-[5px] border-[#873b32]/45 px-4 py-2 font-mono text-2xl font-black tracking-[.18em] text-[#873b32]/45">{linkedEvidencePreview.seal||"CONFIDENCIAL"}</div><button type="button" onClick={()=>setLinkedEvidencePreview(null)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-[#91846b] bg-[#f1eddf]/90 hover:bg-white" aria-label="Cerrar documento"><X size={16}/></button><header className="relative border-b-2 border-[#847454] px-7 pb-5 pt-7 sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[.17em] text-[#746b56]"><span>PEAK SYSTEMS · ARCHIVE DIVISION</span><span>{linkedEvidencePreview.classification||"RESERVADO"}</span></div><div className="mt-6 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.2em] text-[#8b7652]">DOCUMENTO DE INVESTIGACIÓN</p><h2 className="mt-2 max-w-[600px] font-serif text-2xl font-bold sm:text-3xl">{linkedEvidencePreview.evidence_title||linkedEvidencePreview.title}</h2><p className="mt-2 font-mono text-[11px] text-[#766a52]">{linkedEvidencePreview.document_reference||linkedEvidencePreview.evidence_code||"SIN RADICADO"} · {linkedEvidencePreview.page_number||"FOLIO NO ASIGNADO"}</p></div><span className="hidden border border-[#9d8e6e] px-3 py-2 font-mono text-[10px] tracking-widest text-[#806d4d] sm:inline">COPIA DE CONSULTA</span></div></header><div className="relative grid gap-6 px-7 py-7 sm:grid-cols-[minmax(0,1fr)_190px] sm:px-10"><div className="min-w-0"><p className="font-mono text-[10px] font-bold tracking-[.2em] text-[#897653]">DESCRIPCIÓN DEL REGISTRO</p><p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-8">{linkedEvidencePreview.evidence_description||linkedEvidencePreview.body}</p>{linkedEvidencePreview.evidence_url&&<figure className="mt-6 border border-[#b9ad92] bg-[#d8d2c1] p-2"><Image src={linkedEvidencePreview.evidence_url} alt={linkedEvidencePreview.evidence_title||"Fotografía de evidencia"} width={1200} height={900} unoptimized className="max-h-[46vh] w-full object-contain"/><figcaption className="mt-2 font-mono text-[9px] tracking-wider text-[#776c55]">IMAGEN ASOCIADA AL REGISTRO · NO ALTERAR EL ORIGINAL</figcaption></figure>}<div className="mt-7 border-t border-[#bdb39c] pt-4"><p className="font-mono text-[10px] font-bold tracking-[.18em] text-[#897653]">PROCEDENCIA</p><p className="mt-2 text-xs leading-6">{linkedEvidencePreview.source||"Fuente no consignada"}</p><p className="mt-3 text-[11px] leading-5 text-[#776e5b]">La ficha es una representación digital del registro incorporado al expediente. No certifica por sí sola la autenticidad material del documento original.</p></div></div><aside className="space-y-4 border-t border-[#bdb39c] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><div><p className="font-mono text-[9px] tracking-widest text-[#897653]">CÓDIGO</p><p className="mt-1 font-mono text-sm font-bold">{linkedEvidencePreview.evidence_code||"S/C"}</p></div><div><p className="font-mono text-[9px] tracking-widest text-[#897653]">PERSONA RELACIONADA</p><p className="mt-1 text-xs">{linkedEvidencePreview.suspect_name||"No especificada"}</p></div><div><p className="font-mono text-[9px] tracking-widest text-[#897653]">NOTA DE FIRMA</p><p className="mt-1 text-[11px] leading-5">{linkedEvidencePreview.signature_note||"No se ha consignado una nota de autenticación."}</p></div><div className="border border-[#b9ad92] bg-[#e1dac8] p-3"><p className="font-mono text-[9px] tracking-widest text-[#897653]">ESTADO DE CONSULTA</p><p className="mt-2 text-[11px] leading-5">Copia digital de consulta. Contrastar con la fuente primaria.</p></div></aside></div><footer className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#bdb39c] px-7 py-4 font-mono text-[9px] tracking-wider text-[#766c56] sm:px-10"><span>PEAKSCORE · EXPEDIENTE {caseTitle}</span><span>DOCUMENTO DE USO INTERNO · NO DISTRIBUIR</span></footer></article></div>}
    {previewEvidence && <div className="absolute inset-0 z-[70] grid place-items-center overflow-auto peak-os-scroll bg-[#020704]/80 p-4"><article className="relative my-auto max-h-[92%] w-full max-w-[860px] overflow-auto peak-os-scroll border border-[#b7a276] bg-[#e8e3d3] text-[#30382e] shadow-[0_30px_110px_rgba(0,0,0,.8)]"><div className="pointer-events-none absolute inset-0 opacity-[.13]" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0px,transparent 27px,rgba(95,83,58,.18) 28px),radial-gradient(#8c8064 .55px,transparent .7px)",backgroundSize:"100% 28px,5px 5px"}}/><div className="pointer-events-none absolute right-8 top-24 rotate-[14deg] border-[5px] border-[#873b32]/45 px-4 py-2 font-mono text-2xl font-black tracking-[.18em] text-[#873b32]/45">CONFIDENCIAL</div><button type="button" onClick={() => setPreviewEvidence(null)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center border border-[#91846b] bg-[#f1eddf]/90 hover:bg-white" aria-label="Cerrar documento"><X size={16}/></button><header className="relative border-b-2 border-[#847454] px-7 pb-5 pt-7 sm:px-10"><div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] tracking-[.17em] text-[#746b56]"><span>PEAK SYSTEMS · ARCHIVE DIVISION</span><span>USO INTERNO</span></div><div className="mt-6"><p className="font-mono text-[10px] tracking-[.2em] text-[#8b7652]">DOCUMENTO DE INVESTIGACIÓN</p><h2 className="mt-2 max-w-[600px] font-serif text-2xl font-bold sm:text-3xl">{previewEvidence.title}</h2><p className="mt-2 font-mono text-[11px] text-[#766a52]">{previewEvidence.code} · {previewEvidence.suspect}</p></div></header><div className="relative grid gap-6 px-7 py-7 sm:grid-cols-[minmax(0,1fr)_190px] sm:px-10"><div><p className="font-mono text-[10px] font-bold tracking-[.2em] text-[#897653]">REGISTRO DOCUMENTAL</p><p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-8">{previewEvidence.detail}</p>
              {previewEvidence.imageUrl && <figure className="mt-5 border border-[#b9ad92] bg-[#d8d2c1] p-2"><Image src={previewEvidence.imageUrl} alt={previewEvidence.title} width={1200} height={900} unoptimized className="max-h-[44vh] w-full object-contain" /><figcaption className="mt-2 font-mono text-[9px] text-[#776c55]">ADJUNTO DEL EXPEDIENTE · CONSULTA</figcaption></figure>}<div className="mt-7 border-t border-[#bdb39c] pt-4"><p className="font-mono text-[10px] font-bold tracking-[.18em] text-[#897653]">PROCEDENCIA</p><p className="mt-2 text-xs leading-6">{previewEvidence.source}</p><p className="mt-3 text-[11px] leading-5 text-[#776e5b]">{previewEvidence.scope}</p></div></div><aside className="space-y-4 border-t border-[#bdb39c] pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0"><div><p className="font-mono text-[9px] tracking-widest text-[#897653]">CÓDIGO</p><p className="mt-1 font-mono text-sm font-bold">{previewEvidence.code}</p></div><div><p className="font-mono text-[9px] tracking-widest text-[#897653]">PERSONA RELACIONADA</p><p className="mt-1 text-xs">{previewEvidence.suspect}</p></div><div className="border border-[#b9ad92] bg-[#e1dac8] p-3"><p className="font-mono text-[9px] tracking-widest text-[#897653]">ESTADO DE CONSULTA</p><p className="mt-2 text-[11px] leading-5">Ficha digital derivada del expediente. Contrastar con la fuente primaria.</p></div></aside></div><footer className="relative flex flex-wrap items-center justify-between gap-2 border-t border-[#bdb39c] px-7 py-4 font-mono text-[9px] tracking-wider text-[#766c56] sm:px-10"><span>PEAKSCORE · EXPEDIENTE {caseTitle}</span><span>DOCUMENTO DE USO INTERNO · NO DISTRIBUIR</span></footer></article></div>}
    <footer className="peak-os-taskbar absolute bottom-2 left-1/2 z-50 flex h-[58px] w-[min(850px,calc(100%-20px))] -translate-x-1/2 items-center justify-center gap-2 border border-[#7f9bb2] bg-gradient-to-b from-[#365773] via-[#233f59] to-[#142b41] px-2.5 text-white shadow-[0_5px_0_rgba(5,15,24,.65),0_13px_30px_rgba(0,0,0,.45),inset 0_1px 0_rgba(255,255,255,.28)]">
      <button type="button" aria-expanded={startMenuOpen}
        onClick={() => { setStartMenuOpen(value => !value); setNotificationCenterOpen(false); setWindowMenuOpen(null); }}
        className={`grid h-10 w-[82px] shrink-0 place-items-center rounded-[7px] border border-[#8297a8] bg-gradient-to-b from-[#657b8b] via-[#425768] to-[#293c4b] shadow-[inset_0_1px_0_rgba(255,255,255,.28),inset_0_-2px_0_rgba(0,0,0,.18)] transition ${startMenuOpen ? "brightness-125" : "hover:brightness-110"}`}
        aria-label="Abrir inicio de PeakOS"
      ><span className="grid h-8 w-8 place-items-center text-[15px] font-black tracking-[-.08em] text-[#a9dcff] drop-shadow-[0_0_12px_rgba(62,174,255,.65)]">PS</span><span className="sr-only">Inicio</span></button>
      <label className="peak-os-task-search hidden h-10 min-w-[150px] max-w-[220px] flex-1 items-center gap-2 border border-[#8198aa] bg-[#dfe7ec] px-3 text-[11px] text-[#465a6b] shadow-[inset_0_2px_4px_rgba(23,39,53,.2),0_1px_0_rgba(255,255,255,.16)] sm:flex"><Search size={14}/><input aria-label="Buscar en PeakOS" value={desktopQuery} onChange={event => { setDesktopQuery(event.target.value); setStartMenuOpen(true); setNotificationCenterOpen(false); }} onFocus={() => { setStartMenuOpen(true); setNotificationCenterOpen(false); }} onKeyDown={event => { if (event.key === "Enter") { if (desktopRecordMatches[0]) openDesktopSearchResult(desktopRecordMatches[0]); else if (desktopSearchMatches[0]) open(desktopSearchMatches[0]); } }} placeholder="Buscar en PeakOS…" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#26394d] outline-none placeholder:text-[#607487]"/></label>
      <div className="peak-os-dock-apps flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden">
        {(["files","mail","messages","timeline","case"] as AppId[]).map(id => {
          const Icon = APP_META[id].icon;
          const isCurrent = active === id && windows.some(item => item.id === id && !item.minimized);
          const hasUnread = id === "messages" ? unreadNotifications.some(item => item.kind === "message") : id === "mail" ? unreadNotifications.some(item => item.kind === "email") : false;
          return <button key={id} type="button" aria-pressed={isCurrent} onClick={() => open(id)}
            className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-[12px] text-white/85 transition hover:bg-white/12 ${isCurrent ? "bg-white/15" : ""}`}
            title={APP_META[id].title}
          ><Icon size={19} strokeWidth={1.7}/>{hasUnread && <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-[#14233b] bg-[#55b8ff]"/>}{isCurrent && <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[#65c5ff]"/>}</button>;
        })}
      </div>
      <div className="flex h-10 shrink-0 items-center gap-1 border-l border-white/15 pl-1.5">
        <button type="button" aria-label="Centro de notificaciones" aria-expanded={notificationCenterOpen}
          onClick={() => { setNotificationCenterOpen(value => !value); setStartMenuOpen(false); }}
          className={`relative grid h-10 w-9 place-items-center rounded-xl text-white/85 hover:bg-white/10 ${notificationCenterOpen ? "bg-white/12" : ""}`}
        ><Bell size={16}/>{unreadNotifications.length > 0 && <span className="absolute right-0.5 top-0.5 min-w-[15px] rounded-full bg-[#2d8be8] px-1 text-center text-[9px] font-bold leading-[15px] text-white">{unreadNotifications.length}</span>}</button>
        <button type="button" onClick={() => { setNotificationCenterOpen(value => !value); setStartMenuOpen(false); }}
          className="flex h-10 flex-col justify-center rounded-xl px-2 text-right text-white hover:bg-white/10" aria-label="Abrir calendario y notificaciones"
        ><span className="font-mono text-[11px] font-semibold leading-4">{clock}</span><span className="font-mono text-[9px] leading-3 text-white/55">{new Date().toLocaleDateString("es-CO",{day:"2-digit",month:"2-digit",year:"numeric"})}</span></button>
      </div>
    </footer>

    {notificationCenterOpen && (
      <section role="dialog" aria-label="Centro de notificaciones" className="peak-os-notification-center absolute bottom-[76px] right-3 z-[95] flex max-h-[min(340px,calc(100%-88px))] w-[min(330px,calc(100%-16px))] flex-col overflow-hidden rounded-[13px] border border-[#7890a6] bg-[#172d45] text-white shadow-[0_18px_44px_rgba(0,0,0,.48)]">
        <header className="flex items-center justify-between border-b border-[#49627b] bg-gradient-to-b from-[#294a69] to-[#1a344e] px-3.5 py-3"><div><p className="text-[13px] font-semibold text-[#f5f8fc]">Notificaciones</p><p className="mt-0.5 text-[10px] text-[#c3d4e4]">{unreadNotifications.length} sin leer</p></div><button type="button" onClick={() => setReadNotificationIds(recentNotifications.map(item => item.id))} className="text-[10px] font-semibold text-[#dceafa] hover:text-white hover:underline">Marcar todo leído</button></header>
        <div className="min-h-0 flex-1 overflow-y-auto peak-os-scroll p-2">
          {recentNotifications.length ? recentNotifications.map(item => <button key={item.id} type="button"
            onClick={() => {
              setReadNotificationIds(current => current.includes(item.id) ? current : [...current,item.id]);
              open(item.kind === "email" ? "mail" : "messages");
            }}
            className="mb-2 block w-full cursor-pointer border border-[#c0cbd7] bg-[#f4f6f8] p-3 text-left text-[#26384b] shadow-[inset_0_1px_0_rgba(255,255,255,.95)] transition hover:border-[#7798b6] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#70a9df]"
          >
            <div className="flex items-center justify-between gap-2"><span className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#62765e]">{item.kind === "email" ? "Correo" : "Mensajería"}</span><span className="text-[9px] text-[#7b8576]">{item.occurred_at}</span></div>
            <p className="mt-1 text-[12px] font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#697565]">{item.body}</p>
            {item.evidence_code && <p className="mt-2 font-mono text-[9px] tracking-wider text-[#8d7146]">EVIDENCIA · {item.evidence_code}</p>}
            {readNotificationIds.includes(item.id) ? <span className="mt-2 inline-block text-[9px] text-[#8c9687]">Leído</span> : <span className="mt-2 inline-block text-[9px] font-bold text-[#466c49]">Nuevo · Abrir</span>}
          </button>) : <p className="px-3 py-8 text-center text-[11px] text-[#768271]">No hay notificaciones registradas para este expediente.</p>}
        </div>
        <footer className="border-t border-[#49627b] bg-[#1a344e] px-3.5 py-2 text-[9px] text-[#c0d0df]">Las comunicaciones dependen del progreso y los registros del caso.</footer>
      </section>
    )}

    {startMenuOpen && (
      <section role="dialog" aria-label="Menú Inicio de PeakOS" className="peak-os-start-menu absolute bottom-[76px] left-1/2 z-[95] flex max-h-[min(540px,calc(100%-90px))] w-[min(570px,calc(100%-18px))] -translate-x-1/2 flex-col overflow-hidden rounded-[24px] border border-white/20 bg-[#14243b]/90 text-white shadow-[0_28px_90px_rgba(0,0,0,.55)] backdrop-blur-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center text-base font-black tracking-[-.08em] text-[#a9dcff] drop-shadow-[0_0_14px_rgba(62,174,255,.65)]">PS</span><div><p className="text-[13px] font-semibold tracking-wide">Peak Systems</p><p className="mt-0.5 text-[10px] text-white/55">Estación de investigación · Sesión local</p></div></div>
          <span className="rounded-full border border-[#66c5ff]/25 bg-[#66c5ff]/10 px-3 py-1 font-mono text-[9px] tracking-wider text-[#9cdbff]">PEAK OS 2.4</span>
        </header>
        <div className="px-6 pt-4"><label className="flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[.08] px-3 text-white/60 focus-within:border-[#55baff]/70"><Search size={15}/><input value={desktopQuery} onChange={event => setDesktopQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { if (desktopRecordMatches[0]) openDesktopSearchResult(desktopRecordMatches[0]); else if (desktopSearchMatches[0]) open(desktopSearchMatches[0]); } }} placeholder="Buscar apps, documentos y comunicaciones…" className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/40"/></label></div>
        <div className="min-h-0 flex-1 overflow-y-auto peak-os-scroll px-6 pb-4 pt-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-[11px] font-semibold tracking-wide text-white/90">Aplicaciones ancladas</h3><span className="text-[9px] text-white/45">Todas las herramientas <ChevronRight size={11} className="inline"/></span></div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {desktopSearchMatches.map(id => { const Icon = APP_META[id].icon; return <button key={id} type="button" onClick={() => open(id)} className="group flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-[14px] border border-transparent px-2 py-3 text-center transition hover:border-white/10 hover:bg-white/[.09]"><span className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/15 bg-gradient-to-br from-white/15 to-white/[.04] text-[#c8e8ff] shadow-lg group-hover:border-[#62c4ff]/40 group-hover:text-white"><Icon size={19} strokeWidth={1.7}/></span><span className="text-[10px] font-medium text-white/85">{APP_META[id].title}</span></button>; })}
            {!desktopSearchMatches.length && <p className="col-span-3 py-4 text-center text-[11px] text-white/55">No se encontraron aplicaciones.</p>}
          </div>
          {desktopQuery.trim() && <section className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-2 flex items-center justify-between"><h3 className="text-[11px] font-semibold tracking-wide text-white/90">Coincidencias del expediente</h3><span className="font-mono text-[9px] text-white/45">{desktopRecordMatches.length} resultados</span></div>
            {desktopRecordMatches.length ? <div className="space-y-1.5">{desktopRecordMatches.map(result => <button key={result.id} type="button" onClick={() => openDesktopSearchResult(result)} className="flex w-full items-center gap-3 border border-white/10 bg-white/[.045] px-3 py-2.5 text-left transition hover:border-[#77bde8]/35 hover:bg-white/[.09]">
              <span className="grid h-8 w-8 shrink-0 place-items-center border border-white/10 bg-white/[.07] text-[#b9dcf5]">{result.app === "files" ? <FileText size={15}/> : result.app === "mail" ? <Mail size={15}/> : <MessageSquare size={15}/>}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-white/90">{result.title}</span><span className="mt-0.5 block truncate text-[9px] text-white/50">{result.detail}</span></span>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-[#9bc6e4]">{result.kind}</span>
            </button>)}</div> : <p className="py-3 text-[10px] text-white/50">No hay documentos ni comunicaciones que coincidan.</p>}
          </section>}
          <div className="mb-3 mt-5 flex items-center justify-between"><h3 className="text-[11px] font-semibold tracking-wide text-white/90">Última actividad</h3><span className="text-[9px] text-white/45">Del expediente</span></div>
          {latestUnlockedMessage ? <button type="button" onClick={() => { setReadNotificationIds(current => current.includes(latestUnlockedMessage.id) ? current : [...current,latestUnlockedMessage.id]); open("messages"); }} className="flex w-full items-center gap-3 rounded-[14px] border border-white/10 bg-white/[.055] p-3 text-left transition hover:bg-white/[.10]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2469a9]/35 text-[#9ed8ff]"><MessageSquare size={18}/></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-white/90">{latestUnlockedMessage.title || "Mensaje nuevo"}</span><span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-white/55">{latestUnlockedMessage.body}</span></span><ChevronRight size={15} className="shrink-0 text-white/45"/></button>
          : <p className="px-1 py-3 text-[10px] leading-5 text-white/50">Aún no hay comunicaciones desbloqueadas en este expediente.</p>}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-5 py-3">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-[10px] font-bold">PS</span><div><p className="text-[10px] font-semibold text-white/90">Peak Systems</p><p className="text-[9px] text-white/45">Terminal de campo</p></div></div>
          <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-xl border border-[#ff9b8b]/20 bg-[#a94338]/15 px-3 py-2 text-[10px] font-semibold text-[#ffc0b5] transition hover:border-[#ff9b8b]/45 hover:bg-[#a94338]/30"><Power size={14}/> Apagar estación</button>
        </footer>
      </section>
    )}

    {helpOpen&&<div className="absolute inset-0 z-[100] grid place-items-center overflow-auto peak-os-scroll bg-[#07110b]/80 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="peak-help-title" className="w-full max-w-[720px] border border-[#aeb89b] bg-[#e4e7d9] text-[#2e4031] shadow-[0_24px_90px_rgba(0,0,0,.6)]">
        <header className="flex items-start justify-between gap-4 bg-[#193326] px-6 py-5 text-[#e5e8d9]"><div><p className="font-mono text-[9px] tracking-[.2em] text-[#c1ad78]">PEAK FIELDSTATION · GUÍA RÁPIDA</p><h2 id="peak-help-title" className="mt-2 font-serif text-2xl">Investiga sin perderte</h2><p className="mt-1 text-[11px] text-[#b8c4b0]">Estas son las herramientas y controles básicos de tu estación.</p></div><button onClick={()=>setHelpOpen(false)} aria-label="Cerrar guía" className="grid h-8 w-8 shrink-0 place-items-center border border-white/30 hover:bg-white/10"><X size={15}/></button></header>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[{n:"01",t:"Explorador",d:"Busca documentos del caso. Elige una carpeta por persona, escribe en el buscador y cambia entre lista e iconos."},{n:"02",t:"Correo",d:"Consulta los correos que forman parte del expediente. Si no hay registros, la bandeja te lo indicará."},{n:"03",t:"Mensajería",d:"Revisa conversaciones registradas, sus participantes y el orden de los mensajes."},{n:"04",t:"Cronología",d:"Organiza los acontecimientos por persona y hora. Recuerda: una declaración no demuestra por sí sola que algo ocurrió."},{n:"05",t:"Centro de seguridad",d:"Consulta información del expediente, fuentes y límites de los registros disponibles."},{n:"06",t:"Ventanas",d:"Arrastra la barra superior para mover una ventana. Usa los controles para minimizar, maximizar o cerrar."}].map(item=><article key={item.n} className="border border-[#c0cbb8] bg-[#edf0e6] p-4"><p className="font-mono text-[9px] tracking-widest text-[#8a7955]">{item.n} / HERRAMIENTA</p><h3 className="mt-1 text-xs font-bold">{item.t}</h3><p className="mt-2 text-[11px] leading-5 text-[#667260]">{item.d}</p></article>)}
          <article className="border border-[#c0cbb8] bg-[#edf0e6] p-4 sm:col-span-2"><p className="font-mono text-[9px] tracking-widest text-[#8a7955]">ATAJOS ÚTILES</p><div className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2"><p><b>ESC</b> · Cierra la capa abierta o minimiza la ventana activa.</p><p><b>Ctrl + Alt + Tab</b> · Cambia entre ventanas abiertas.</p><p><b>Inicio</b> · Abre la búsqueda y los accesos a las aplicaciones del expediente.</p><p><b>Iconos del escritorio</b> · Un clic selecciona; doble clic abre la aplicación.</p><p><b>Barra de tareas</b> · Cambia entre las ventanas abiertas y vuelve al escritorio al minimizarlas.</p><p><b>Centro de notificaciones</b> · Consulta los correos y mensajes registrados; selecciona uno para abrir su aplicación.</p><p><b>Ctrl + Alt + ← / →</b> · Acomoda la ventana a un lado.</p><p><b>Ctrl + Alt + ↑ / ↓</b> · Maximiza o minimiza.</p><p><b>Ctrl + E</b> · Abre el Explorador.</p><p><b>Ctrl + M</b> · Abre Correo · <b>Ctrl + Shift + M</b> · Mensajería.</p></div></article>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c3cdbb] px-5 py-4"><p className="text-[10px] text-[#74806e]">El contenido depende de los registros disponibles en este expediente.</p><button onClick={()=>setHelpOpen(false)} className="bg-[#294633] px-5 py-2.5 text-[11px] font-bold tracking-wide text-white hover:bg-[#36583f]">ENTENDIDO</button></footer>
      </section>
    </div>}
    <style jsx global>{`
      .peak-os-desktop { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; color: #eef5ff; background: #071326; }
      .peak-os-desktop > div[aria-hidden="true"] { background-color: #071326; }
      .peak-os-desktop > div[aria-hidden="true"]::before { content: ""; position: absolute; width: 86%; height: 150%; left: 26%; top: -28%; border-radius: 48% 52% 62% 38% / 42% 45% 55% 58%; transform: rotate(-24deg); background: linear-gradient(128deg,transparent 4%,rgba(0,177,255,.05) 24%,rgba(27,156,255,.72) 36%,rgba(93,224,255,.9) 39%,rgba(23,105,255,.38) 46%,transparent 59%); filter: blur(1px); }
      .peak-os-desktop > div[aria-hidden="true"]::after { content: ""; position: absolute; width: 74%; height: 130%; left: 37%; top: -5%; border-radius: 50%; transform: rotate(24deg); border: 1px solid rgba(102,190,255,.22); box-shadow: 0 0 90px rgba(35,130,255,.3), inset 0 0 85px rgba(25,120,255,.18); }
      .peak-os-shortcut-grid { width: 104px !important; grid-template-columns: 1fr !important; gap: 8px !important; border: 0 !important; outline: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; backdrop-filter: none !important; }
      .peak-os-shortcut { min-height: 72px !important; border: 0 !important; border-radius: 14px !important; background: transparent !important; box-shadow: none !important; text-shadow: 0 2px 8px rgba(0,0,0,.65); }
      .peak-os-shortcut:hover, .peak-os-shortcut[aria-pressed="true"] { border: 0 !important; background: rgba(91,177,255,.10) !important; box-shadow: none !important; }
      .peak-os-shortcut > span:first-child { width: 42px !important; height: 42px !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; color: #d8efff !important; box-shadow: none !important; backdrop-filter: none !important; }
      .peak-os-window { border-radius: 10px !important; border: 1px solid #8ea4b8 !important; background: #edf2f7 !important; box-shadow: 0 24px 66px rgba(0,0,0,.44), inset 0 1px 0 rgba(255,255,255,.95) !important; }
      .peak-os-window-titlebar { height: 42px !important; background: linear-gradient(180deg,#315b7d 0%,#1d405f 54%,#173650 100%) !important; border-bottom: 1px solid #102b43; }
      .peak-os-window-titlebar button { border-radius: 8px; }
      .peak-os-window-titlebar button:last-child:hover { background: #b93636 !important; }
      .peak-os-window-titlebar button { border: 1px solid rgba(225,237,248,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.12); }
      .peak-os-window-titlebar button:hover { background: rgba(255,255,255,.16); }
      .peak-os-menubar button { padding: 5px 10px; }
      .peak-os-menubar button:hover { background: #d5e2ef; color: #193b59; }
      .peak-os-window { overflow: hidden; }
      .peak-os-workspace { font-size: 12px; line-height: 1.5; }
      .peak-os-workspace :is(p,span,label,button,input,select) { text-rendering: optimizeLegibility; }
      .peak-os-workspace input::placeholder, .peak-os-app-surface input::placeholder { color: #7a8997; opacity: 1; }
      .peak-os-shortcut { text-shadow: 0 1px 3px rgba(0,0,0,.9),0 2px 9px rgba(0,0,0,.65); }
      .peak-os-taskbar { border-radius: 10px !important; }
      .peak-os-taskbar .peak-os-dock-apps > button { border-radius: 8px !important; }
      .peak-os-notification-center { border-radius: 11px !important; }
      .peak-os-notification-center button p { overflow-wrap: anywhere; }
      .peak-os-search-field { min-height: 36px; border-radius: 4px !important; }
      .peak-os-search-field input { min-width: 0; border: 0 !important; border-radius: 2px !important; background: #f7f9fb !important; padding: 4px 7px !important; color: #24384b !important; box-shadow: inset 0 1px 2px rgba(24,43,61,.13) !important; }
      .peak-os-search-field input::placeholder { color: #718294 !important; opacity: 1 !important; }
      .peak-os-search-field:focus-within { border-color: #6d9fc8 !important; box-shadow: 0 0 0 2px rgba(88,153,207,.15),inset 0 1px 3px rgba(34,54,73,.12) !important; }
      .peak-os-task-search { border-radius: 5px !important; }
      .peak-os-menubar { height: 32px !important; background: linear-gradient(180deg,#f8fafc 0%,#e2eaf2 100%) !important; border-color: #bdcbd8 !important; color: #344a60 !important; }
      .peak-os-menubar button { border-radius: 9px; font-size: 11px !important; }
      .peak-os-menubar button[aria-expanded="true"] { background: #dceaff !important; border-color: #b8d2f3 !important; color: #174c88 !important; }
      .peak-os-workspace, .peak-os-app-surface { background: #e7edf3 !important; color: #26394d !important; }
      .peak-os-app-surface { color-scheme: light; }
      .peak-os-workspace button:not([class*="bg-"]):not(.peak-os-explorer-file), .peak-os-app-surface button:not([class*="bg-"]) { border: 1px solid #aab9c8; background: linear-gradient(180deg,#fbfcfd 0%,#e7edf3 52%,#d5dfe8 100%); color: #30465b; box-shadow: inset 0 1px 0 rgba(255,255,255,.96), inset 0 -1px 0 rgba(154,172,190,.28), 0 1px 1px rgba(35,55,76,.08); }
      .peak-os-workspace button:not([class*="bg-"]):not(.peak-os-explorer-file):hover, .peak-os-app-surface button:not([class*="bg-"]):hover { border-color: #829eb7; background: linear-gradient(180deg,#fff 0%,#edf4fa 100%); }
      .peak-os-workspace button:not([class*="bg-"]):not(.peak-os-explorer-file):active, .peak-os-app-surface button:not([class*="bg-"]):active { background: linear-gradient(180deg,#d5e0ea,#edf2f7); box-shadow: inset 0 1px 2px rgba(36,58,80,.18); transform: translateY(1px); }
      .peak-os-workspace button:disabled, .peak-os-app-surface button:disabled { cursor: not-allowed; opacity: .48; filter: grayscale(.2); }
      .peak-os-sidebar { background: linear-gradient(180deg,#edf4fb,#e7eff8) !important; border-color: #dce5f0 !important; }
      .peak-os-workspace input, .peak-os-workspace select, .peak-os-app-surface input, .peak-os-app-surface select { border-radius: 9px !important; border-color: #d4deeb !important; background: #fff !important; color: #24364e !important; }
      .peak-os-explorer-file { min-height: 54px; border-radius: 10px; border-color: rgba(188,207,228,.72) !important; }
      .peak-os-explorer-file:hover { background: #e6f1ff !important; }
      .peak-os-explorer-file[aria-pressed="true"], .peak-os-explorer-file:focus { background: #dcecff !important; outline: 1px solid #9dc5f5 !important; }
      .peak-os-taskbar { height: 56px !important; border-radius: 12px !important; }

      .peak-os-shortcut-grid::before, .peak-os-shortcut-grid::after { display: none !important; content: none !important; }
      .peak-os-shortcut { appearance: none !important; outline: none !important; border-width: 0 !important; background: transparent !important; box-shadow: none !important; }
      .peak-os-shortcut:focus-visible { outline: 1px solid rgba(151,207,255,.72) !important; outline-offset: 2px; background: rgba(71,151,218,.12) !important; }
      .peak-os-dock-apps { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      .peak-os-dock-apps::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      .peak-os-dock-apps > button { width: 42px !important; height: 42px !important; border: 1px solid rgba(255,255,255,.08); border-radius: 14px !important; background: linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.025)); box-shadow: inset 0 1px 0 rgba(255,255,255,.10),0 5px 14px rgba(0,0,0,.16); }
      .peak-os-dock-apps > button:hover { transform: translateY(-2px); border-color: rgba(137,203,255,.45); background: linear-gradient(145deg,rgba(105,190,255,.2),rgba(255,255,255,.06)); }
      .peak-os-dock-apps > button[aria-pressed="true"] { border-color: rgba(106,194,255,.42); background: linear-gradient(145deg,rgba(62,150,219,.30),rgba(255,255,255,.07)); box-shadow: inset 0 1px 0 rgba(255,255,255,.14),0 0 18px rgba(51,155,232,.16); }
      .peak-os-explorer-list { flex: 1 1 0% !important; height: 0; min-height: 280px !important; overflow-y: auto !important; overflow-x: hidden !important; overscroll-behavior: contain; }
      .peak-os-explorer-list.flex > .peak-os-explorer-file { display: grid; flex: 0 0 auto; min-height: 52px !important; align-items: center; }
      .peak-os-explorer-list.grid > .peak-os-explorer-file { display: flex; min-height: 154px !important; }
      .peak-os-workspace { min-height: 0 !important; }
      .peak-os-workspace > div.flex.min-h-0.flex-1 { min-height: 0 !important; }
      .peak-os-workspace > div.flex.min-h-0.flex-1 > div.flex.min-h-0.min-w-0.flex-1.flex-col { min-height: 0 !important; }
      .peak-os-workspace button, .peak-os-app-surface button { transition: background-color .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease; }
      .peak-os-workspace button:not(.peak-os-explorer-file), .peak-os-app-surface button { border-radius: 10px; }
      .peak-os-workspace input:focus, .peak-os-workspace select:focus, .peak-os-app-surface input:focus, .peak-os-app-surface select:focus { outline: 2px solid rgba(62,145,220,.22); border-color: #86b8e7 !important; }
      .peak-os-workspace [role="group"] { border-radius: 12px; overflow: hidden; box-shadow: 0 3px 12px rgba(36,67,99,.06); }
      .peak-os-workspace .peak-os-sidebar button { border-radius: 10px; }
      .peak-os-taskbar { background: linear-gradient(180deg,rgba(44,70,94,.98),rgba(19,38,57,.99)) !important; border: 1px solid rgba(166,193,216,.48) !important; box-shadow: 0 12px 32px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.2) !important; }

      .peak-os-taskbar .peak-os-dock-apps { scrollbar-width: none !important; -ms-overflow-style: none !important; }
      .peak-os-taskbar .peak-os-dock-apps::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      .peak-os-notification-center { color: #edf5ff !important; }

      .peak-os-start-menu { color: #f3f7ff !important; }
      .peak-os-start-menu input { color: #fff !important; }
      .peak-os-menu-item { display: flex; width: 100%; align-items: center; gap: 9px; border-radius: 8px; padding: 9px 11px; color: #263a55; text-align: left; font-size: 11px; }
      .peak-os-menu-item:hover { background: #e5effb; color: #14569a; }
      .peak-os-scroll { scrollbar-color: rgba(115,145,183,.45) transparent; scrollbar-width: thin; }
      .peak-os-explorer-list { min-height: 280px !important; overscroll-behavior: contain; }
      .peak-os-explorer-list::-webkit-scrollbar { width: 8px; }
      .peak-os-explorer-list::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 99px; background: rgba(104,139,177,.42); background-clip: padding-box; }
      .peak-os-explorer-list::-webkit-scrollbar-track { background: transparent; }
      @media (max-width: 640px) { .peak-os-shortcut-grid { left: 8px !important; top: 8px !important; width: 76px !important; gap: 4px !important; } .peak-os-shortcut { min-height: 68px !important; } .peak-os-taskbar { bottom: 5px !important; } }
    `}</style>
  </div>;
}
