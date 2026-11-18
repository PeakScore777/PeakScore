"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Slot = "desktop" | "lock";
type Wallpaper = { id: string; slot: Slot; title: string; image_url: string; storage_path: string; sort_order: number; is_active: boolean };
const field = "w-full border border-[#5a503e] bg-[#17130e] px-3 py-2.5 text-sm text-[#f5e6c7] outline-none focus:border-[#d4ab68]";

export default function ArchivoOcultoOSStudio() {
  const [items, setItems] = useState<Wallpaper[]>([]);
  const [slot, setSlot] = useState<Slot>("desktop");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/archivo-oculto/os-wallpapers", { credentials: "same-origin", cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los fondos.");
    setItems(Array.isArray(data.wallpapers) ? data.wallpapers : []);
  }, []);

  useEffect(() => {
    let active = true;
    void load().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Error al cargar."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const choose = (next: File | null) => {
    setFile(next);
    setPreview((current) => { if (current.startsWith("blob:")) URL.revokeObjectURL(current); return next ? URL.createObjectURL(next) : ""; });
    setError("");
  };

  const save = async () => {
    if (!file || title.trim().length < 2) { setError("Escribe un nombre y selecciona una imagen."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      const form = new FormData(); form.set("file", file);
      const upload = await fetch("/api/admin/game-content/upload", { method: "POST", body: form, credentials: "same-origin" });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error ?? "No se pudo subir la imagen.");
      const response = await fetch("/api/admin/archivo-oculto/os-wallpapers", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, title: title.trim(), imageUrl: uploaded.url, storagePath: uploaded.path }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar.");
      choose(null); setTitle(""); setNotice("Fondo guardado y aplicado.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  };

  const toggle = async (item: Wallpaper) => {
    setError(""); setNotice("");
    const response = await fetch("/api/admin/archivo-oculto/os-wallpapers", {
      method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "No se pudo actualizar."); return; }
    setNotice(item.slot === "desktop" ? "Fondo de escritorio actualizado." : "Selección de pantalla de bloqueo actualizada.");
    await load();
  };

  const remove = async (item: Wallpaper) => {
    const response = await fetch("/api/admin/archivo-oculto/os-wallpapers?id=" + encodeURIComponent(item.id), { method: "DELETE", credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "No se pudo eliminar."); return; }
    setNotice("Imagen eliminada."); await load();
  };

  const desktop = items.filter((item) => item.slot === "desktop");
  const locks = items.filter((item) => item.slot === "lock");
  return <main className="min-h-screen bg-[#120e0a] px-4 py-8 text-[#f4e6ca] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard/admin/games" className="text-xs text-[#d7b77e] hover:underline">← Volver al estudio de contenidos</Link>
      <header className="mb-8 mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#d1a762]">PeakScore · El Archivo Oculto</p>
        <h1 className="mt-2 font-serif text-3xl font-black sm:text-4xl">Personalización de PEAK OS</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#b9a789]">Administra el fondo del escritorio y las imágenes que aparecen al encender el computador. Las imágenes de bloqueo pueden rotar aleatoriamente en cada inicio.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
        <div className="border border-[#765a35] bg-[#21170f] p-5">
          <h2 className="font-serif text-xl font-bold">Añadir imagen</h2>
          <p className="mt-1 text-xs text-[#b9a789]">PNG, JPG o WebP · máximo 10 MB</p>
          <label className="mb-2 mt-5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Destino</label>
          <select className={field} value={slot} onChange={(event) => setSlot(event.target.value as Slot)}>
            <option value="desktop">Fondo del escritorio (uno activo)</option>
            <option value="lock">Pantalla de bloqueo (varios para rotación)</option>
          </select>
          <label className="mb-2 mt-5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Nombre de la imagen</label>
          <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ej. Biblioteca nocturna"/>
          <label className="mb-2 mt-5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#c8ad7d]">Archivo de imagen</label>
          <input className={field} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => choose(event.target.files?.[0] ?? null)}/>
          {preview && <div className="relative mt-4 aspect-video overflow-hidden border border-[#8b7049]"><Image src={preview} alt="Vista previa" fill unoptimized className="object-cover"/></div>}
          <button type="button" disabled={saving || !file || title.trim().length < 2} onClick={() => void save()} className="mt-5 w-full border border-[#b58a50] bg-[#6b4b21] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#805d2b] disabled:opacity-40">{saving ? "GUARDANDO..." : "SUBIR Y GUARDAR IMAGEN"}</button>
          {notice && <p role="status" className="mt-4 text-sm text-emerald-300">{notice}</p>}
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        </div>

        <div className="space-y-5">
          <section className="border border-[#765a35] bg-[#21170f] p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-bold">Fondo del escritorio</h2><span className="text-[10px] text-[#c8ad7d]">1 activo</span></div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {desktop.map((item) => <article key={item.id} className="overflow-hidden border border-[#765a35] bg-[#17120d]">
                <div className="relative aspect-video"><Image src={item.image_url} alt={item.title} fill unoptimized className="object-cover"/></div>
                <div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs">{item.title}</span><button type="button" onClick={() => void remove(item)} className="text-[10px] text-red-300 hover:underline">Eliminar</button></div>
                <div className="px-2 pb-2"><span className={"text-[10px] " + (item.is_active ? "text-emerald-300" : "text-[#a99a7d]")}>{item.is_active ? "Aplicado" : "Guardado"}</span>{!item.is_active && <button type="button" onClick={() => void toggle(item)} className="ml-2 text-[10px] text-[#e6c38c] underline">Aplicar</button>}</div>
              </article>)}
              {!desktop.length && <p className="col-span-2 text-xs text-[#b9a789]">{loading ? "Cargando..." : "Aún no hay fondos personalizados."}</p>}
            </div>
          </section>

          <section className="border border-[#765a35] bg-[#21170f] p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-lg font-bold">Pantalla de bloqueo</h2><span className="text-[10px] text-[#c8ad7d]">{locks.filter((item) => item.is_active).length} seleccionadas</span></div>
            <p className="mt-1 text-xs text-[#b9a789]">Selecciona varias. Se elige una diferente aleatoriamente cada vez que se enciende el computador.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {locks.map((item) => <article key={item.id} className="overflow-hidden border border-[#765a35] bg-[#17120d]">
                <div className="relative aspect-video"><Image src={item.image_url} alt={item.title} fill unoptimized className="object-cover"/></div>
                <div className="p-2"><p className="truncate text-xs">{item.title}</p><button type="button" onClick={() => void toggle(item)} className={"mt-1 text-[10px] underline " + (item.is_active ? "text-emerald-300" : "text-[#d4b37c]")}>{item.is_active ? "Incluida en rotación" : "Incluir en rotación"}</button><button type="button" onClick={() => void remove(item)} className="ml-3 text-[10px] text-red-300 hover:underline">Eliminar</button></div>
              </article>)}
              {!locks.length && <p className="col-span-2 text-xs text-[#b9a789]">{loading ? "Cargando..." : "Añade al menos dos imágenes para activar la rotación."}</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  </main>;
}
