"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, BookOpen, Contrast, Crop, Eye, Hand,
  ImagePlus, LoaderCircle, Plus, RotateCcw, Save, Search, Sparkles,
  Sun, Trash2, Upload, X, ZoomIn, ZoomOut,
} from "lucide-react";

type EvidenceAsset = {
  id: string;
  title: string;
  description: string;
  tag: string;
  image_url: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};

type EditorTool = "magnifier" | "zoom" | "move";
type Point = { x: number; y: number };
type MagnifierTarget = {
  src: string;
  u: number;
  v: number;
  imageWidth: number;
  imageHeight: number;
};

type CropSettings = { zoom: number; x: number; y: number };
type Adjustments = { brightness: number; contrast: number; sharpness: number };

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAGNIFIER_ZOOM = 3.15;
const MAGNIFIER_DIAMETER = 138;

async function exportEditedPhoto(
  source: string,
  crop: CropSettings,
  adjustments: Adjustments,
): Promise<Blob> {
  const response = await fetch(source);
  if (!response.ok) throw new Error("No se pudo leer la fotografía para exportarla.");

  const bitmap = await createImageBitmap(await response.blob());
  const scale = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height));
  const outputWidth = Math.max(1, Math.round(bitmap.width * scale));
  const outputHeight = Math.max(1, Math.round(bitmap.height * scale));
  const sourceWidth = bitmap.width / Math.max(1, crop.zoom);
  const sourceHeight = bitmap.height / Math.max(1, crop.zoom);
  const centerX = bitmap.width / 2 + (crop.x / 100) * (bitmap.width - sourceWidth) / 2;
  const centerY = bitmap.height / 2 + (crop.y / 100) * (bitmap.height - sourceHeight) / 2;
  const sourceX = Math.max(0, Math.min(bitmap.width - sourceWidth, centerX - sourceWidth / 2));
  const sourceY = Math.max(0, Math.min(bitmap.height - sourceHeight, centerY - sourceHeight / 2));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d", { willReadFrequently: adjustments.sharpness > 0 });
  if (!context) {
    bitmap.close();
    throw new Error("El navegador no pudo preparar el lienzo de edición.");
  }

  context.filter = "brightness(" + adjustments.brightness / 100 + ") contrast(" + adjustments.contrast / 100 + ")";
  context.drawImage(bitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  context.filter = "none";
  bitmap.close();

  if (adjustments.sharpness > 0 && outputWidth > 2 && outputHeight > 2) {
    const imageData = context.getImageData(0, 0, outputWidth, outputHeight);
    const sourcePixels = new Uint8ClampedArray(imageData.data);
    const destination = imageData.data;
    const strength = (adjustments.sharpness / 100) * 0.8;
    for (let y = 1; y < outputHeight - 1; y += 1) {
      for (let x = 1; x < outputWidth - 1; x += 1) {
        const index = (y * outputWidth + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          const center = sourcePixels[index + channel];
          const neighbours = sourcePixels[index - 4 + channel]
            + sourcePixels[index + 4 + channel]
            + sourcePixels[index - outputWidth * 4 + channel]
            + sourcePixels[index + outputWidth * 4 + channel];
          destination[index + channel] = center + (center - neighbours / 4) * strength;
        }
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo exportar la fotografía editada."));
    }, "image/jpeg", 0.9);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ArchivoOcultoEvidenceStudio() {
  const [assets, setAssets] = useState<EvidenceAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("Nueva fotografía");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("EVIDENCIA");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tool, setTool] = useState<EditorTool>("magnifier");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [pointer, setPointer] = useState<Point | null>(null);
  const [magnifierTarget, setMagnifierTarget] = useState<MagnifierTarget | null>(null);
  const [crop, setCrop] = useState<CropSettings>({ zoom: 1, x: 0, y: 0 });
  const [cropDraft, setCropDraft] = useState<CropSettings>({ zoom: 1, x: 0, y: 0 });
  const [adjustments, setAdjustments] = useState<Adjustments>({ brightness: 100, contrast: 100, sharpness: 0 });
  const [cropOpen, setCropOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ start: Point; pan: Point; pointerId: number } | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? null,
    [assets, selectedId],
  );
  const photoSrc = previewUrl ?? selectedAsset?.image_url ?? null;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const refreshAssets = useCallback(async () => {
    const response = await fetch("/api/admin/archivo-oculto/evidence", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(data.assets)) {
      throw new Error(data.error ?? "No se pudo cargar la galería.");
    }
    const nextAssets = data.assets as EvidenceAsset[];
    setAssets(nextAssets);
    return nextAssets;
  }, []);

  useEffect(() => {
    let active = true;
    void refreshAssets()
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar la galería.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refreshAssets]);

  useEffect(() => {
    if (!selectedAsset) return;
    setTitle(selectedAsset.title);
    setDescription(selectedAsset.description);
    setTag(selectedAsset.tag);
    setCrop({ zoom: 1, x: 0, y: 0 });
    setCropDraft({ zoom: 1, x: 0, y: 0 });
    setAdjustments({ brightness: 100, contrast: 100, sharpness: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPendingFile(null);
    setPreviewUrl(null);
    setMagnifierTarget(null);
  }, [selectedAsset?.id]);

  const openNewEvidence = () => {
    setSelectedId(null);
    setTitle("Nueva fotografía");
    setDescription("");
    setTag("EVIDENCIA");
    setPendingFile(null);
    setPreviewUrl(null);
    setCrop({ zoom: 1, x: 0, y: 0 });
    setCropDraft({ zoom: 1, x: 0, y: 0 });
    setAdjustments({ brightness: 100, contrast: 100, sharpness: 0 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setError("");
    setNotice("");
    window.requestAnimationFrame(() => fileInputRef.current?.click());
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Usa una fotografía JPG, PNG o WebP.");
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      setError("La fotografía debe pesar menos de 10 MB.");
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMagnifierTarget(null);
    setNotice("Fotografía cargada en la vista previa. Guarda los cambios para reemplazarla.");
    setError("");
  };

  const handleImagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (tool !== "move") return;
    dragRef.current = {
      start: { x: event.clientX, y: event.clientY },
      pan,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleImagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const board = boardRef.current;
    const image = imageRef.current;
    if (!board || !image || !photoSrc) return;

    if (dragRef.current && dragRef.current.pointerId === event.pointerId) {
      const deltaX = event.clientX - dragRef.current.start.x;
      const deltaY = event.clientY - dragRef.current.start.y;
      setPan({ x: dragRef.current.pan.x + deltaX, y: dragRef.current.pan.y + deltaY });
    }

    const boardRect = board.getBoundingClientRect();
    const naturalWidth = image.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || 1;
    const fitScale = Math.min(
      boardRect.width / Math.max(1, naturalWidth),
      boardRect.height / Math.max(1, naturalHeight),
    );
    const displayedWidth = naturalWidth * fitScale * zoom * crop.zoom;
    const displayedHeight = naturalHeight * fitScale * zoom * crop.zoom;
    const imageCenterX = boardRect.left + boardRect.width / 2 + pan.x + crop.x * 1.8;
    const imageCenterY = boardRect.top + boardRect.height / 2 + pan.y + crop.y * 1.8;
    const left = imageCenterX - displayedWidth / 2;
    const top = imageCenterY - displayedHeight / 2;
    const u = (event.clientX - left) / Math.max(1, displayedWidth);
    const v = (event.clientY - top) / Math.max(1, displayedHeight);

    setPointer({ x: event.clientX - boardRect.left, y: event.clientY - boardRect.top });
    if (tool === "magnifier" && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      setMagnifierTarget({
        src: photoSrc,
        u: clamp(u, 0, 1),
        v: clamp(v, 0, 1),
        imageWidth: displayedWidth,
        imageHeight: displayedHeight,
      });
    } else {
      setMagnifierTarget(null);
    }
  };

  const handleImagePointerUp = () => {
    dragRef.current = null;
  };

  const handleImagePointerLeave = () => {
    setPointer(null);
    setMagnifierTarget(null);
    dragRef.current = null;
  };

  const changeAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments((current) => ({ ...current, [key]: value }));
  };

  const applyQuickEnhancement = () => {
    setAdjustments({ brightness: 104, contrast: 114, sharpness: 28 });
    setNotice("Mejora aplicada a la vista previa. Puedes afinarla antes de guardar.");
    setError("");
  };

  const openCropEditor = () => {
    setCropDraft(crop);
    setCropOpen(true);
  };

  const saveEvidence = async () => {
    if (!photoSrc) {
      setError("Primero sube una fotografía para esta evidencia.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Escribe un título de al menos tres caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const shouldUploadImage = Boolean(pendingFile) || !selectedAsset
        || crop.zoom !== 1 || crop.x !== 0 || crop.y !== 0
        || adjustments.brightness !== 100 || adjustments.contrast !== 100 || adjustments.sharpness !== 0;

      let imageUrl = selectedAsset?.image_url ?? "";
      let storagePath = selectedAsset?.storage_path ?? "";

      if (shouldUploadImage) {
        const blob = await exportEditedPhoto(photoSrc, crop, adjustments);
        const uploadFile = new File([blob], "archivo-oculto-evidencia.jpg", { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", uploadFile);

        const uploadResponse = await fetch("/api/admin/game-content/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || typeof uploadData.url !== "string" || typeof uploadData.path !== "string") {
          throw new Error(uploadData.error ?? "No se pudo subir la fotografía editada.");
        }
        imageUrl = uploadData.url;
        storagePath = uploadData.path;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        tag: tag.trim().toUpperCase(),
        imageUrl,
        storagePath,
      };
      const method = selectedAsset ? "PATCH" : "POST";
      const response = await fetch("/api/admin/archivo-oculto/evidence", {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedAsset ? { id: selectedAsset.id, ...payload } : payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.asset?.id) {
        throw new Error(data.error ?? "No se pudo guardar la evidencia.");
      }

      const nextAssets = await refreshAssets();
      setSelectedId(data.asset.id);
      setPendingFile(null);
      setPreviewUrl(null);
      setCrop({ zoom: 1, x: 0, y: 0 });
      setCropDraft({ zoom: 1, x: 0, y: 0 });
      setAdjustments({ brightness: 100, contrast: 100, sharpness: 0 });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      const saved = nextAssets.find((asset) => asset.id === data.asset.id);
      setNotice(saved ? "Evidencia guardada. La fotografía ya quedó almacenada." : "Evidencia guardada correctamente.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la evidencia.");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvidence = async () => {
    if (!selectedAsset || deleting) return;
    if (!window.confirm("¿Eliminar esta fotografía de la galería de evidencias?")) return;
    setDeleting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/archivo-oculto/evidence", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedAsset.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error ?? "No se pudo eliminar la evidencia.");
      const nextAssets = await refreshAssets();
      setSelectedId(nextAssets[0]?.id ?? null);
      setNotice("Evidencia eliminada de la galería.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar la evidencia.");
    } finally {
      setDeleting(false);
    }
  };

  const imageStyle = {
    transform: "translate(" + (pan.x + crop.x * 1.8) + "px," + (pan.y + crop.y * 1.8) + "px) scale(" + (zoom * crop.zoom) + ")",
    filter: "brightness(" + adjustments.brightness / 100 + ") contrast(" + adjustments.contrast / 100 + ")" + (adjustments.sharpness > 0 ? " url(#archivo-evidence-sharpness)" : "") + (adjustments.sharpness > 0 ? " url(#archivo-evidence-sharpness)" : ""),
  };

  const selectedLabel = selectedAsset ? selectedAsset.title : pendingFile ? pendingFile.name : "Sin fotografía seleccionada";

  return (
    <main className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#130d08] px-3 pb-8 pt-4 text-[#f3e4c8] sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-70" style={{
        backgroundImage: "radial-gradient(ellipse at 18% 10%,rgba(125,70,32,.34),transparent 36%),radial-gradient(ellipse at 88% 15%,rgba(201,143,70,.17),transparent 28%),repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0,rgba(255,255,255,.018) 1px,transparent 1px,transparent 7px),linear-gradient(180deg,#24160d 0%,#100a06 100%)",
      }} />

      <div className="relative mx-auto max-w-[1700px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/games" aria-label="Volver al estudio de contenidos" className="grid h-9 w-9 place-items-center border border-[#76532f] bg-[#27170e] text-[#e7c28b] transition hover:bg-[#3a2414]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="relative border-2 border-[#b58a50] bg-[#d7bc8c] px-3 py-1.5 text-[#27170f] shadow-[4px_4px_0_rgba(0,0,0,.4)]">
              <p className="font-serif text-[9px] font-black uppercase tracking-[.2em]">El Archivo</p>
              <p className="font-serif text-xl font-black leading-none tracking-tight">OCULTO</p>
              <span className="absolute -bottom-2 -left-2 grid h-6 w-6 place-items-center rounded-full border border-[#e4bd83] bg-[#8b171c] font-serif text-xs font-black text-[#f4dfbb]">A</span>
            </div>
          </div>

          <nav aria-label="Secciones del archivo" className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/dashboard/admin/games" className="border border-[#73512d] bg-[#21150d]/90 px-4 py-2 font-serif text-xs text-[#e8d4b3] transition hover:bg-[#382313] sm:px-6">Expediente</Link>
            <span aria-current="page" className="border border-[#c2382c] bg-gradient-to-b from-[#9f1e1c] to-[#5b100f] px-4 py-2 font-serif text-xs font-bold text-[#fff0d6] shadow-[0_0_18px_rgba(157,32,24,.28)] sm:px-6">Evidencias</span>
            <span aria-disabled="true" className="border border-[#73512d] bg-[#21150d]/60 px-4 py-2 font-serif text-xs text-[#8e785d] sm:px-6">Sospechosos</span>
            <Link href="/dashboard/admin/games" className="border border-[#73512d] bg-[#21150d]/90 px-4 py-2 font-serif text-xs text-[#e8d4b3] transition hover:bg-[#382313] sm:px-6">Lecturas</Link>
          </nav>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.24em] text-[#b8905c]">PeakScore · Administración · Archivo Oculto</p>
            <h1 className="mt-1 font-serif text-2xl font-black text-[#f4e4c8] sm:text-3xl">Estudio de evidencias fotográficas</h1>
          </div>
          <button type="button" onClick={openNewEvidence} className="inline-flex items-center gap-2 border border-[#b6905a] bg-[#5b2a19] px-4 py-2.5 text-xs font-bold text-[#f9e9cf] transition hover:bg-[#75361f]">
            <Plus className="h-4 w-4" /> Nueva evidencia
          </button>
        </div>

        {error && <p role="alert" className="mb-3 border border-[#a83c34] bg-[#3b1715] px-4 py-3 text-xs text-[#ffddd1]">{error}</p>}
        {notice && <p role="status" className="mb-3 border border-[#718b60] bg-[#1f3021] px-4 py-3 text-xs text-[#e3efd8]">{notice}</p>}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0">
            <div className="relative border-[9px] border-[#8b6941] bg-[#d7c19a] p-2 shadow-[0_16px_40px_rgba(0,0,0,.55)] sm:border-[12px] sm:p-3">
              <div className="relative overflow-hidden border border-[#4b3420] bg-[#17110c] shadow-[inset_0_0_30px_rgba(0,0,0,.6)]">
                <div
                  ref={boardRef}
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={handleImagePointerUp}
                  onPointerCancel={handleImagePointerUp}
                  onPointerLeave={handleImagePointerLeave}
                  onWheel={(event) => {
                    if (tool !== "zoom") return;
                    event.preventDefault();
                    setZoom((current) => clamp(current + (event.deltaY < 0 ? 0.12 : -0.12), 1, 3));
                  }}
                  className={"relative aspect-[1.48] min-h-[280px] w-full touch-pan-y sm:min-h-[440px] " + (tool === "move" ? "cursor-grab active:cursor-grabbing" : tool === "zoom" ? "cursor-zoom-in" : "cursor-crosshair")}
                >
                  {photoSrc ? (
                    <>
                      <Image
                        ref={imageRef}
                        src={photoSrc}
                        alt={title || "Fotografía de evidencia"}
                        fill
                        unoptimized
                        draggable={false}
                        sizes="(max-width: 1280px) 100vw, 1100px"
                        className="pointer-events-none select-none object-contain transition-[filter] duration-100"
                        style={imageStyle}
                      />
                      {tool === "magnifier" && pointer && magnifierTarget && (
                        <div aria-hidden="true" className="pointer-events-none absolute z-30 h-0 w-0" style={{ left: pointer.x, top: pointer.y }}>
                          <div className="absolute left-[34px] top-[43px] z-0 h-[25px] w-[148px] origin-[12px_12px] rotate-[43deg] rounded-[6px] border border-[#111619] shadow-[2px_5px_8px_rgba(0,0,0,.72)]" style={{ background: "linear-gradient(180deg,#e1e4df 0%,#858d8f 10%,#2e3539 26%,#111518 55%,#333a3e 78%,#b5babb 96%,#454c50 100%)" }} />
                          <div className="absolute left-[34px] top-[43px] z-[1] h-[29px] w-[32px] origin-[12px_14px] rotate-[43deg] rounded-[5px] border border-[#20272a]" style={{ background: "linear-gradient(135deg,#f3f1e8,#7b8588 28%,#242a2d 58%,#c3c9c6 84%,#565e61)" }} />
                          <div className="absolute -left-[77px] -top-[77px] z-[2] h-[154px] w-[154px] rounded-full border-[5px] border-[#171d20] shadow-[0_4px_12px_rgba(0,0,0,.6),inset_0_1px_2px_rgba(255,255,255,.75)]" style={{ background: "linear-gradient(135deg,#e2e5df 0%,#737d81 14%,#22282c 35%,#151a1d 58%,#c2c9c9 82%,#4d5559 100%)" }} />
                          <div className="absolute -left-[69px] -top-[69px] z-[3] h-[138px] w-[138px] overflow-hidden rounded-full border border-[#c5d1d4]/80" style={{ background: "rgba(184,214,225,.18)", boxShadow: "inset 0 1px 8px rgba(255,255,255,.23), inset 0 -2px 8px rgba(2,12,19,.20)" }}>
                            <div className="absolute inset-0" style={{
                              backgroundImage: "url('" + magnifierTarget.src + "')",
                              backgroundRepeat: "no-repeat",
                              backgroundSize: magnifierTarget.imageWidth * MAGNIFIER_ZOOM + "px " + magnifierTarget.imageHeight * MAGNIFIER_ZOOM + "px",
                              backgroundPosition: (MAGNIFIER_DIAMETER / 2 - magnifierTarget.u * magnifierTarget.imageWidth * MAGNIFIER_ZOOM) + "px " + (MAGNIFIER_DIAMETER / 2 - magnifierTarget.v * magnifierTarget.imageHeight * MAGNIFIER_ZOOM) + "px",
                              filter: "contrast(1.04) saturate(1.06)",
                            }} />
                            <div className="pointer-events-none absolute inset-0 rounded-full" style={{
                              background: "radial-gradient(ellipse at 24% 15%,rgba(255,255,255,.54),transparent 22%),radial-gradient(ellipse at 73% 82%,rgba(132,184,199,.18),transparent 38%),linear-gradient(132deg,rgba(239,251,255,.08),transparent 44%,rgba(3,14,22,.13))",
                              boxShadow: "inset 0 1px 8px rgba(255,255,255,.24),inset 0 -3px 8px rgba(4,12,18,.18)",
                            }} />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_center,rgba(136,87,42,.2),transparent_60%),#100b07] p-6 text-center">
                      <div className="max-w-sm">
                        <ImagePlus className="mx-auto h-12 w-12 text-[#c49a61]" />
                        <p className="mt-3 font-serif text-xl font-bold text-[#ead7b5]">Coloca la primera fotografía</p>
                        <p className="mt-2 text-xs leading-5 text-[#a99574]">Sube una imagen real o una fotografía creada por el equipo. Después podrás reemplazarla, recortarla y examinarla con la lupa.</p>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 border border-[#b8915a] bg-[#851c1b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a52622]">
                          <Upload className="h-4 w-4" /> Subir fotografía
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#4a321e]">
                <span>{selectedAsset ? "Evidencia registrada · " + selectedAsset.tag : pendingFile ? "Fotografía en edición" : "Archivo fotográfico"}</span>
                <span>{photoSrc ? "Lupa " + MAGNIFIER_ZOOM.toFixed(2) + "× · " + (zoom * crop.zoom).toFixed(1) + "× vista" : "Sin imagen cargada"}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-start gap-3">
              <div className="flex min-w-[72px] flex-col gap-1 rounded border border-[#74532f] bg-[#1c130d] p-1.5">
                {([
                  { id: "magnifier" as const, label: "Lupa", icon: <Search className="h-5 w-5" /> },
                  { id: "zoom" as const, label: "Zoom", icon: <ZoomIn className="h-5 w-5" /> },
                  { id: "move" as const, label: "Mover", icon: <Hand className="h-5 w-5" /> },
                ]).map((item) => (
                  <button key={item.id} type="button" onClick={() => { setTool(item.id); setPointer(null); setMagnifierTarget(null); }} aria-pressed={tool === item.id} className={"grid min-h-[62px] place-items-center gap-1 border px-2 text-[9px] font-bold transition " + (tool === item.id ? "border-[#d64a39] bg-[#841a19] text-white" : "border-transparent text-[#d8c29f] hover:border-[#775532] hover:bg-[#332115]")}>
                    {item.icon}{item.label}
                  </button>
                ))}
                <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setCrop({ zoom: 1, x: 0, y: 0 }); setAdjustments({ brightness: 100, contrast: 100, sharpness: 0 }); }} className="grid min-h-[54px] place-items-center gap-1 border border-transparent px-2 text-[9px] font-bold text-[#d8c29f] hover:border-[#775532] hover:bg-[#332115]">
                  <RotateCcw className="h-5 w-5" /> Restaurar
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 border border-[#765735] bg-[#21160e] px-3 py-2">
                  <p className="truncate font-serif text-sm font-bold text-[#f1dfc2]">{selectedLabel}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={!photoSrc} onClick={() => setZoom((current) => clamp(current - 0.2, 1, 3))} aria-label="Reducir zoom" className="border border-[#75542f] p-2 text-[#ead5b4] disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
                    <button type="button" disabled={!photoSrc} onClick={() => setZoom((current) => clamp(current + 0.2, 1, 3))} aria-label="Aumentar zoom" className="border border-[#75542f] p-2 text-[#ead5b4] disabled:opacity-40"><ZoomIn className="h-4 w-4" /></button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 border border-[#765735] bg-[#21160e] p-2">
                  <span className="flex-1 text-[10px] text-[#bba17a]">Selecciona una evidencia para editarla o crea una nueva.</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-[#c5a56d]"><BookOpen className="h-3.5 w-3.5" /> {assets.length} fotografías</span>
                </div>
              </div>
            </div>

            <section className="mt-4 border border-[#765735] bg-[#1a120c] p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div><h2 className="font-serif text-base font-bold text-[#f0dfc3]">Archivo fotográfico</h2><p className="mt-0.5 text-[9px] uppercase tracking-[.15em] text-[#a88c64]">Evidencias disponibles para editar</p></div>
                <button type="button" onClick={openNewEvidence} className="inline-flex items-center gap-1 border border-[#765735] px-2.5 py-2 text-[9px] font-bold text-[#e7d2b0] hover:bg-[#3a2616]"><Plus className="h-3.5 w-3.5" /> Añadir</button>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-xs text-[#c1a982]"><LoaderCircle className="h-4 w-4 animate-spin" /> Cargando fotografías…</div>
              ) : assets.length === 0 ? (
                <div className="border border-dashed border-[#765735] p-6 text-center text-xs text-[#a99574]">Todavía no hay fotografías guardadas. Sube la primera para crear tu galería.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {assets.map((asset) => (
                    <button key={asset.id} type="button" onClick={() => { setSelectedId(asset.id); setPreviewUrl(null); setPendingFile(null); setError(""); setNotice(""); }} aria-pressed={selectedId === asset.id} className={"group min-w-0 border p-1 text-left transition " + (selectedId === asset.id ? "border-[#d74a3b] bg-[#541a16] shadow-[0_0_0_2px_rgba(186,51,39,.2)]" : "border-[#735532] bg-[#2a1c11] hover:border-[#c39b60]")}>
                      <div className="relative aspect-[1.3] overflow-hidden bg-[#100b07]">
                        <Image src={asset.image_url} alt={asset.title} fill unoptimized sizes="160px" className="object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <span className="mt-1 block truncate font-serif text-[10px] font-bold text-[#ead7b5]">{asset.title}</span>
                      <span className="block truncate text-[8px] uppercase tracking-wider text-[#a88c64]">{asset.tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </section>

          <aside className="border-[8px] border-[#9a7748] bg-[#e7d0a9] p-3 text-[#2c1d11] shadow-[0_12px_35px_rgba(0,0,0,.48)] sm:p-4">
            <div className="relative border border-[#b89561] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,.58),transparent_55%),linear-gradient(135deg,#f3e2bf,#ddc092)] p-3 sm:p-4">
              <span aria-hidden="true" className="absolute right-3 top-2 rotate-[18deg] text-3xl text-[#765c3e]">⌁</span>
              <p className="font-serif text-xl font-black">Editor de Evidencia</p>
              <div className="mt-4 flex items-center gap-3 border-y border-[#c2a77a] py-3">
                <div className="relative h-[72px] w-[94px] shrink-0 overflow-hidden border-2 border-[#87653c] bg-[#d2bd94] p-1 shadow-[2px_3px_5px_rgba(0,0,0,.25)]">
                  {photoSrc ? <Image src={photoSrc} alt="Vista previa de la fotografía" fill unoptimized sizes="94px" className="object-cover" /> : <ImagePlus className="absolute inset-0 m-auto h-7 w-7 text-[#82613a]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-sm font-bold">{title || "Nueva evidencia"}</p>
                  <p className="mt-1 text-[10px] text-[#745a38]">{selectedAsset ? "Evidencia guardada" : pendingFile ? "Lista para guardar" : "Sin fotografía seleccionada"}</p>
                  {selectedAsset && <span className="mt-2 inline-flex border border-[#39703c] bg-[#24672d] px-2 py-1 text-[9px] font-bold text-white">En uso</span>}
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="sr-only" />

              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 border border-[#741613] bg-gradient-to-b from-[#b32825] to-[#741513] px-3 py-2 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_3px_5px_rgba(75,13,12,.25)] transition hover:brightness-110">
                <Upload className="h-5 w-5" /> Cambiar fotografía
              </button>
              <button type="button" disabled={!photoSrc} onClick={openCropEditor} className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 border border-[#98774a] bg-gradient-to-b from-[#f8e9ce] to-[#d6bb91] px-3 py-2 text-sm font-bold text-[#342313] shadow-[0_2px_4px_rgba(91,61,29,.18)] disabled:opacity-40">
                <Crop className="h-5 w-5" /> Ajustar y recortar
              </button>
              <button type="button" disabled={!photoSrc} onClick={applyQuickEnhancement} className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 border border-[#98774a] bg-gradient-to-b from-[#f8e9ce] to-[#d6bb91] px-3 py-2 text-sm font-bold text-[#342313] shadow-[0_2px_4px_rgba(91,61,29,.18)] disabled:opacity-40">
                <Sparkles className="h-5 w-5" /> Mejorar imagen
              </button>

              <div className="mt-4 space-y-3 border-y border-[#c2a77a] py-4">
                <label className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Brillo</span>
                  <input aria-label="Brillo" type="range" min="50" max="150" value={adjustments.brightness} onChange={(event) => changeAdjustment("brightness", Number(event.target.value))} className="w-full accent-[#8d211b]" />
                </label>
                <label className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-2"><Contrast className="h-4 w-4" /> Contraste</span>
                  <input aria-label="Contraste" type="range" min="50" max="150" value={adjustments.contrast} onChange={(event) => changeAdjustment("contrast", Number(event.target.value))} className="w-full accent-[#8d211b]" />
                </label>
                <label className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2 text-xs font-bold">
                  <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Nitidez</span>
                  <input aria-label="Nitidez" type="range" min="0" max="100" value={adjustments.sharpness} onChange={(event) => changeAdjustment("sharpness", Number(event.target.value))} className="w-full accent-[#8d211b]" />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <label className="block"><span className="mb-1 block text-[9px] font-black uppercase tracking-[.14em] text-[#725332]">Nombre de la evidencia</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} className="w-full border border-[#a78a5c] bg-[#f8ecd4] px-3 py-2 text-xs text-[#342313] outline-none focus:border-[#81201b]" placeholder="Ej. Fotografía del evento" /></label>
                <label className="block"><span className="mb-1 block text-[9px] font-black uppercase tracking-[.14em] text-[#725332]">Descripción / pista</span><textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} className="w-full resize-y border border-[#a78a5c] bg-[#f8ecd4] px-3 py-2 text-xs text-[#342313] outline-none focus:border-[#81201b]" placeholder="Qué detalle debe investigarse..." /></label>
                <label className="block"><span className="mb-1 block text-[9px] font-black uppercase tracking-[.14em] text-[#725332]">Etiqueta</span><input value={tag} onChange={(event) => setTag(event.target.value)} maxLength={40} className="w-full border border-[#a78a5c] bg-[#f8ecd4] px-3 py-2 text-xs uppercase text-[#342313] outline-none focus:border-[#81201b]" placeholder="EVIDENCIA" /></label>
              </div>

              <div className="mt-4 flex gap-2">
                <button type="button" disabled={!photoSrc} onClick={() => setPreviewOpen(true)} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 border border-[#98774a] bg-gradient-to-b from-[#f8e9ce] to-[#d6bb91] px-2 text-[11px] font-bold text-[#342313] disabled:opacity-40"><Eye className="h-4 w-4" /> Vista previa</button>
                <button type="button" disabled={!photoSrc || saving} onClick={() => void saveEvidence()} className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 border border-[#691310] bg-gradient-to-b from-[#b12b27] to-[#791714] px-2 text-[11px] font-bold text-white shadow-[0_3px_5px_rgba(82,19,15,.25)] disabled:opacity-45">
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
                </button>
              </div>
              {selectedAsset && <button type="button" onClick={() => void deleteEvidence()} disabled={deleting} className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-[#a14a3b] bg-[#f2d6c4] px-3 py-2 text-[10px] font-bold text-[#76221c] hover:bg-[#e9c0ad] disabled:opacity-45">{deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Eliminar evidencia</button>}
              <p className="mt-3 text-[9px] leading-4 text-[#765b39]">JPG, PNG o WebP · máximo 10 MB. Las fotografías se guardan en Supabase Storage y la galería solo está disponible para administradores.</p>
            </div>
          </aside>
        </div>
      </div>

      {cropOpen && photoSrc && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="archivo-crop-title">
          <div className="max-h-[94svh] w-full max-w-4xl overflow-y-auto border-[8px] border-[#9a7748] bg-[#e8d2ab] p-3 text-[#302113] shadow-[0_20px_80px_rgba(0,0,0,.7)] sm:p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#88653d]">Laboratorio fotográfico</p><h2 id="archivo-crop-title" className="font-serif text-xl font-black">Ajustar y recortar</h2></div><button type="button" onClick={() => setCropOpen(false)} aria-label="Cerrar editor de recorte" className="border border-[#9a7748] p-2"><X className="h-5 w-5" /></button></div>
            <div className="relative mt-4 aspect-[1.55] overflow-hidden border-[7px] border-[#795a35] bg-[#130d08]">
              <Image src={photoSrc} alt="Recorte de evidencia" fill unoptimized sizes="90vw" className="pointer-events-none object-contain" style={{ transform: "translate(" + cropDraft.x * 1.8 + "px," + cropDraft.y * 1.8 + "px) scale(" + cropDraft.zoom + ")", filter: "brightness(" + adjustments.brightness / 100 + ") contrast(" + adjustments.contrast / 100 + ")" + (adjustments.sharpness > 0 ? " url(#archivo-evidence-sharpness)" : "") }} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-[8%] border border-dashed border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,.2)]" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-bold">Zoom de recorte <input type="range" min="1" max="3" step="0.05" value={cropDraft.zoom} onChange={(event) => setCropDraft((current) => ({ ...current, zoom: Number(event.target.value) }))} className="mt-2 w-full accent-[#8d211b]" /></label>
              <label className="text-xs font-bold">Desplazamiento horizontal <input type="range" min="-50" max="50" value={cropDraft.x} onChange={(event) => setCropDraft((current) => ({ ...current, x: Number(event.target.value) }))} className="mt-2 w-full accent-[#8d211b]" /></label>
              <label className="text-xs font-bold">Desplazamiento vertical <input type="range" min="-50" max="50" value={cropDraft.y} onChange={(event) => setCropDraft((current) => ({ ...current, y: Number(event.target.value) }))} className="mt-2 w-full accent-[#8d211b]" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setCropOpen(false)} className="border border-[#947249] px-4 py-2 text-xs font-bold">Cancelar</button><button type="button" onClick={() => { setCrop(cropDraft); setCropOpen(false); }} className="border border-[#711a17] bg-[#8e201c] px-4 py-2 text-xs font-bold text-white">Aplicar recorte</button></div>
          </div>
        </div>
      )}

      {previewOpen && photoSrc && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-3" role="dialog" aria-modal="true" aria-label="Vista previa de fotografía">
          <div className="w-full max-w-5xl border-[9px] border-[#987548] bg-[#e5d0aa] p-2 shadow-2xl">
            <div className="mb-2 flex items-center justify-between text-[#302113]"><span className="font-serif text-lg font-bold">{title}</span><button type="button" onClick={() => setPreviewOpen(false)} aria-label="Cerrar vista previa" className="border border-[#987548] p-2"><X className="h-5 w-5" /></button></div>
            <div className="relative aspect-[1.55] overflow-hidden bg-[#100b07]">
              <Image src={photoSrc} alt={title} fill unoptimized sizes="95vw" className="object-contain" style={{ transform: "translate(" + (pan.x + crop.x * 1.8) + "px," + (pan.y + crop.y * 1.8) + "px) scale(" + (zoom * crop.zoom) + ")", filter: "brightness(" + adjustments.brightness / 100 + ") contrast(" + adjustments.contrast / 100 + ")" + (adjustments.sharpness > 0 ? " url(#archivo-evidence-sharpness)" : "") }} />
            </div>
          </div>
        </div>
      )}

      <svg aria-hidden="true" className="pointer-events-none fixed h-0 w-0">
        <filter id="archivo-evidence-sharpness">
          <feConvolveMatrix
            order="3"
            kernelMatrix={"0 " + (-(adjustments.sharpness / 100) * 0.28) + " 0 " + (-(adjustments.sharpness / 100) * 0.28) + " " + (1 + (adjustments.sharpness / 100) * 1.12) + " " + (-(adjustments.sharpness / 100) * 0.28) + " 0 " + (-(adjustments.sharpness / 100) * 0.28) + " 0"}
            preserveAlpha
          />
        </filter>
      </svg>
    </main>
  );
}
