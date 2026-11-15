"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Slot = "left" | "right";
type Frame = { id: string; slot: Slot; title: string; image_url: string; storage_path: string };
const field = "w-full border border-[#5a503e] bg-[#17130e] px-3 py-2.5 text-sm text-[#f5e6c7] outline-none focus:border-[#d4ab68]";

export default function ArchivoOcultoFrameStudio() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [slot, setSlot] = useState<Slot>("left");
  const [title, setTitle] = useState("Retrato principal");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/archivo-oculto/frames", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los cuadros.");
      setFrames(Array.isArray(data.frames) ? data.frames : []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error al cargar."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (next: File | null) => {
    setFile(next);
    setPreview((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return next ? URL.createObjectURL(next) : ""; });
    setError("");
  };

  const save = async () => {
    if (!file) { setError("Selecciona primero una imagen."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const form = new FormData(); form.set("file", file);
      const upload = await fetch("/api/admin/game-content/upload", { method: "POST", body: form, credentials: "same-origin" });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error ?? "No se pudo subir la imagen.");
      const response = await fetch("/api/admin/archivo-oculto/frames", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, title, imageUrl: uploaded.url, storagePath: uploaded.path }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el cuadro.");
      setNotice("Cuadro guardado. La biblioteca mostrará la imagen nueva al actualizarse.");
      chooseFile(null);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  };

  const remove = async (target: Slot) => {
    setError(""); setNotice("");
    const response = await fetch("/api/admin/archivo-oculto/frames?slot=" + target, { method: "DELETE", credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "No se pudo quitar."); return; }
    setFrames((current) => current.filter((frame) => frame.slot !== target));
    setNotice("Se restaurará la ilustración original de ese marco.");
  };

  const selected = frames.find((frame) => frame.slot === slot);
  return <main className="min-h-screen bg-[#120e0a] px-4 py-8 text-[#f4e6ca] sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/admin/games" className="text-xs text-[#d7b77e] hover:underline">← Volver al estudio de contenidos</Link>
      <header className="mb-8 mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#d1a762]">PeakScore · El Archivo Oculto</p>
        <h1 className="mt-2 font-serif text-3xl font-black sm:text-4xl">Restaurador de cuadros</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#b9a789]">Sube imágenes de buena resolución para los marcos de la biblioteca. El sistema recorta al formato del cuadro sin estirar ni deformar la fotografía.</p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="border border-[#765a35] bg-[#21170f] p-5">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Marco que vas a editar</label>
          <select className={field} value={slot} onChange={(event) => setSlot(event.target.value as Slot)}>
            <option value="left">Cuadro izquierdo · paisaje</option>
            <option value="right">Cuadro derecho · retrato</option>
          </select>
          <label className="mb-2 mt-5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Nombre de la obra</label>
          <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120}/>
          <label className="mb-2 mt-5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Imagen (PNG, JPG o WebP · máximo 10 MB)</label>
          <input className={field} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}/>
          <button type="button" disabled={saving || !file || title.trim().length < 2} onClick={() => void save()} className="mt-5 w-full border border-[#b58a50] bg-[#6b2118] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#853024] disabled:opacity-40">{saving ? "GUARDANDO..." : "GUARDAR IMAGEN EN EL MARCO"}</button>
          {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        </div>
        <div className="border border-[#765a35] bg-[#21170f] p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Vista previa del marco</p>
          <div className="mx-auto max-w-[300px] border-[12px] border-[#80562f] bg-[#21170f] p-3 shadow-xl">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#d8c9ad]">
              {preview ? <Image src={preview} alt="Vista previa del nuevo cuadro" fill unoptimized className="object-cover"/> : selected ? <Image src={selected.image_url} alt={selected.title} fill unoptimized className="object-cover"/> : <div className="grid h-full place-items-center text-center text-sm text-[#6c573c]">Se conservará la ilustración original</div>}
            </div>
          </div>
          {selected && <button type="button" onClick={() => void remove(slot)} className="mt-4 w-full border border-red-900/70 px-3 py-2 text-xs text-red-200 hover:bg-red-950/40">QUITAR IMAGEN Y RESTAURAR ORIGINAL</button>}
          <div className="mt-5 space-y-2">
            {loading ? <p className="text-xs text-[#b9a789]">Cargando...</p> : (["left","right"] as Slot[]).map((key) => {
              const frame = frames.find((item) => item.slot === key);
              return <button key={key} type="button" onClick={() => { setSlot(key); setTitle(frame?.title ?? (key === "left" ? "Paisaje" : "Retrato")); chooseFile(null); }} className={"flex w-full items-center justify-between border px-3 py-2 text-left text-xs " + (slot === key ? "border-[#d0a56b] bg-[#49301c]" : "border-[#5b452b] bg-[#17120d]")}>
                <span>{key === "left" ? "Marco izquierdo" : "Marco derecho"}</span><span className="text-[#d7b77e]">{frame ? "Imagen personalizada" : "Ilustración original"}</span>
              </button>;
            })}
          </div>
        </div>
      </section>
    </div>
  </main>;
}
