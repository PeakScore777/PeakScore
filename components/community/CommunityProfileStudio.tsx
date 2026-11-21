"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Camera, ImagePlus, Palette, Frame, WandSparkles, Layers3, ShoppingBag, LockKeyhole, Ban, Save, ChevronDown } from "lucide-react";

type Slot = "avatar_frame" | "profile_banner" | "profile_effect" | "nameplate" | "profile_theme";
type Cosmetic = { id:string; name:string; description:string; category:Slot; assetPath:string|null; previewPath:string|null; priceCoins:number; rarity:string; metadata:Record<string,unknown>; limited:boolean };
type Profile = { id:string; displayName:string; avatarUrl:string|null; bannerUrl:string|null; bio:string; pronouns:string; level:number; xp:number; coins:number };
type Props = { onClose:()=>void; onSaved:()=>void };
const slots: {id:Slot;label:string;hint:string}[] = [
 {id:"nameplate",label:"Placa de identificación",hint:"Cómo aparece tu nombre en los miembros"},
 {id:"avatar_frame",label:"Marcos y decoración",hint:"Dale personalidad a tu avatar"},
 {id:"profile_banner",label:"Cartel de perfil",hint:"La portada de tu tarjeta"},
 {id:"profile_effect",label:"Efectos de perfil",hint:"Efectos visuales y animaciones"},
 {id:"profile_theme",label:"Color de cartel",hint:"El color de tu tarjeta"},
];
const hex=(v:unknown)=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v)?v:"#313338";

export default function CommunityProfileStudio({onClose,onSaved}:Props) {
 const [profile,setProfile]=useState<Profile|null>(null);
 const [catalog,setCatalog]=useState<Cosmetic[]>([]);
 const [inventory,setInventory]=useState<string[]>([]);
 const [equipped,setEquipped]=useState<Record<string,string>>({});
 const [displayName,setDisplayName]=useState("");
 const [bio,setBio]=useState("");
 const [pronouns,setPronouns]=useState("");
 const [status,setStatus]=useState("");
 const [active,setActive]=useState<Slot>("nameplate");
 const [picker,setPicker]=useState<Slot|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState<string|null>(null);
 const [uploading,setUploading]=useState<"avatar"|"banner"|null>(null);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const avatarRef=useRef<HTMLInputElement>(null);
 const bannerRef=useRef<HTMLInputElement>(null);

 const load=useCallback(async()=>{
  const r=await fetch("/api/profile/cosmetics",{cache:"no-store",credentials:"same-origin"});
  const d=await r.json();
  if(!r.ok||!d.profile) throw new Error(d.error??"No se pudo cargar la personalización.");
  setProfile(d.profile);setCatalog(d.catalog??[]);setInventory((d.inventory??[]).map((x:{cosmeticId:string})=>x.cosmeticId));
  setEquipped(Object.fromEntries((d.equipped??[]).map((x:{slot:string;cosmeticId:string})=>[x.slot,x.cosmeticId])));
  setDisplayName(d.profile.displayName??"");setBio(d.profile.bio??"");setPronouns(d.profile.pronouns??"");
  if(d.profile.id){const communityResponse=await fetch("/api/community/profile/"+d.profile.id,{credentials:"same-origin",cache:"no-store"});const communityData=await communityResponse.json().catch(()=>null);if(communityResponse.ok&&communityData?.profile)setStatus(communityData.profile.statusText??"");}
 },[]);
 useEffect(()=>{void load().catch(e=>setError(e.message));},[load]);
 const items=useMemo(()=>catalog.filter(x=>x.category===active),[catalog,active]);
 const chosen=items.find(x=>x.id===selected)??items.find(x=>x.id===equipped[active])??items[0]??null;
 const equippedItem=(slot:Slot)=>catalog.find(x=>x.id===equipped[slot]);

 async function upload(kind:"avatar"|"banner",file:File|null){
  if(!file)return;
  if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>(kind==="avatar"?5:8)*1024*1024){setError(kind==="avatar"?"Usa PNG, JPG o WebP de máximo 5 MB para el avatar.":"Usa PNG, JPG o WebP de máximo 8 MB para el cartel.");return;}
  setUploading(kind);setError("");
  try{
   const form=new FormData();form.set("asset_type",kind);form.set("file",file);
   const r=await fetch("/api/profile/assets",{method:"POST",credentials:"same-origin",body:form});
   const d=await r.json();if(!r.ok||!d.assetUrl)throw new Error(d.error??"No se pudo subir la imagen.");
   setProfile(p=>p?{...p,[kind==="avatar"?"avatarUrl":"bannerUrl"]:d.assetUrl}:p);
   if(kind==="avatar"){
    const communityForm=new FormData();communityForm.set("kind","avatar");communityForm.set("file",file);
    const communityResponse=await fetch("/api/community/profile/"+(profile?.id??""),{method:"POST",credentials:"same-origin",body:communityForm});
    const communityResult=await communityResponse.json();
    if(!communityResponse.ok)throw new Error(communityResult.error??"La foto se actualizó en tu cuenta, pero no en la comunidad.");
   }
   setNotice(kind==="avatar"?"Avatar actualizado.":"Cartel actualizado.");
  }catch(e){setError(e instanceof Error?e.message:"No se pudo subir.");}
  finally{setUploading(null);if(kind==="avatar"&&avatarRef.current)avatarRef.current.value="";if(kind==="banner"&&bannerRef.current)bannerRef.current.value="";}
 }
 async function save(){
  setBusy("save");setError("");setNotice("");
  try{
   const r=await fetch("/api/profile/cosmetics",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"updateProfile",displayName,bio,pronouns})});
   const d=await r.json();if(!r.ok)throw new Error(d.error??"No se pudo guardar.");
   setProfile(p=>p?{...p,displayName:d.profile.displayName,bio:d.profile.bio,pronouns:d.profile.pronouns}:p);
   const communityResponse=await fetch("/api/community/profile/"+(profile?.id??""),{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({displayName:d.profile.displayName,statusText:status,about:d.profile.bio})});
   const communityResult=await communityResponse.json();
   if(!communityResponse.ok)throw new Error(communityResult.error??"Se guardó tu perfil, pero no se pudo sincronizar la ficha comunitaria.");
   setNotice("Cambios guardados.");onSaved();
  }catch(e){setError(e instanceof Error?e.message:"No se pudo guardar.");}
  finally{setBusy(null);}
 }
 async function mutate(action:"purchase"|"equip"|"unequip",item?:Cosmetic){
  if(busy)return;setBusy(item?.id??action);setError("");setNotice("");
  try{
   const r=await fetch("/api/profile/cosmetics",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,cosmeticId:item?.id,slot:item?.category??active})});
   const d=await r.json();if(!r.ok)throw new Error(d.error??"No se pudo actualizar.");
   if(action==="purchase"&&item){setInventory(v=>v.includes(item.id)?v:[...v,item.id]);setProfile(p=>p?{...p,coins:d.coins??p.coins}:p);setNotice(item.name+" añadido a tu colección.");}
   if(action==="equip"&&item){setEquipped(v=>({...v,[item.category]:item.id}));setNotice(item.name+" equipado.");}
   if(action==="unequip"){setEquipped(v=>{const n={...v};delete n[item?.category??active];return n;});setNotice("Elemento retirado.");}
  }catch(e){setError(e instanceof Error?e.message:"No se pudo actualizar.");}
  finally{setBusy(null);}
 }
 const openPicker=(slot:Slot)=>{setActive(slot);setSelected(equipped[slot]??catalog.find(x=>x.category===slot)?.id??null);setPicker(slot);};

 return <div className="ps-studio-overlay" onMouseDown={e=>{if(e.target===e.currentTarget){picker?setPicker(null):onClose();}}}>
  <section className="ps-studio-shell" role="dialog" aria-modal="true" aria-label="Personalización del perfil">
   <header className="ps-studio-topbar"><div><span>PEAKSCORE</span><strong>PERSONALIZACIÓN DEL PERFIL</strong></div><button onClick={onClose} aria-label="Cerrar"><X size={20}/></button></header>
   <div className="ps-studio-layout">
    <aside className="ps-studio-sidebar">
     <div className="ps-studio-account"><span>PERFIL PRINCIPAL</span><ChevronDown size={15}/></div>
     {slots.map(s=><button key={s.id} className={"ps-studio-nav "+(active===s.id?"is-active":"")} onClick={()=>setActive(s.id)}>
      <span className="ps-studio-nav-icon">{s.id==="nameplate"?<Layers3/>:s.id==="avatar_frame"?<Frame/>:s.id==="profile_banner"?<ImagePlus/>:s.id==="profile_effect"?<WandSparkles/>:<Palette/>}</span>
      <span><strong>{s.label}</strong><small>{s.hint}</small></span><span className="ps-studio-nav-arrow">›</span>
     </button>)}
     <div className="ps-studio-sidebar-foot"><span>PEAKCOINS</span><strong>{Number(profile?.coins??0).toLocaleString("es-CO")} PC</strong><a href="/tienda">Explorar tienda ↗</a></div>
    </aside>
    <main className="ps-studio-main">
     <div className="ps-studio-heading"><div><span>IDENTITY STUDIO / {active.replace("_"," ").toUpperCase()}</span><h1>Personaliza tu perfil</h1><p>Los cambios se reflejan en tu identidad de PeakScore.</p></div><button className="ps-studio-close-mobile" onClick={onClose}><X/></button></div>
     {error&&<p className="ps-studio-feedback is-error">{error}</p>}{notice&&<p className="ps-studio-feedback">{notice}</p>}
     <div className="ps-studio-columns">
      <section className="ps-studio-preview-column">
       <div className="ps-studio-section-title"><span>VISTA PREVIA EN VIVO</span><i>PLAYER CARD</i></div>
       <article className="ps-studio-preview-card">
        <div className="ps-studio-banner" style={profile?.bannerUrl?{backgroundImage:"linear-gradient(180deg,transparent,rgba(0,0,0,.18)),url("+JSON.stringify(profile.bannerUrl)+")"}:equippedItem("profile_banner")?.assetPath?{backgroundImage:"url("+JSON.stringify(equippedItem("profile_banner")?.assetPath)+")"}:{}}>
         {!profile?.bannerUrl&&!equippedItem("profile_banner")?.assetPath&&<span>PEAKSCORE <small>YOUR JOURNEY. YOUR LEGACY.</small></span>}
        </div>
        <div className="ps-studio-card-content">
         <div className="ps-studio-avatar-wrap"><div className="ps-studio-avatar">{profile?.avatarUrl?<Image src={profile.avatarUrl} alt="" fill unoptimized sizes="100px"/>:<span>{(displayName||"P").slice(0,1).toUpperCase()}</span>}</div>
          {equippedItem("avatar_frame")?.assetPath&&<Image src={equippedItem("avatar_frame")!.assetPath!} alt="" fill unoptimized className="ps-studio-frame"/>}
         </div>
         <h2>{displayName||"Tu nombre"}</h2><p className="ps-studio-handle">{pronouns||"Miembro PeakScore"} · Nivel {profile?.level??1}</p>
         {status&&<p className="ps-studio-status">{status}</p>}
         {equippedItem("nameplate")?.previewPath&&<div className="ps-studio-nameplate" style={{backgroundImage:"url("+JSON.stringify(equippedItem("nameplate")?.previewPath)+")"}}/>}
         <p className="ps-studio-bio">{bio||"Tu historia empieza aquí. Cuéntale a la comunidad quién eres."}</p>
         <div className="ps-studio-stats"><span><small>EXPERIENCIA</small><b>{Number(profile?.xp??0).toLocaleString("es-CO")} XP</b></span><span><small>NIVEL</small><b>{profile?.level??1}</b></span></div>
        </div>
       </article>
       <div className="ps-studio-preview-hint">Así te verán en la comunidad y en tu perfil público.</div>
      </section>
      <section className="ps-studio-controls">
       {active==="nameplate"||active==="avatar_frame"||active==="profile_banner"||active==="profile_effect"?<>
        <div className="ps-studio-section-title"><span>{slots.find(x=>x.id===active)?.label.toUpperCase()}</span><button onClick={()=>openPicker(active)}>VER COLECCIÓN ↗</button></div>
        <div className="ps-studio-current">
         <div className="ps-studio-current-art">{chosen?.previewPath?<Image src={chosen.previewPath} alt="" fill unoptimized/>:<span>{active==="nameplate"?"Aa":active==="avatar_frame"?"◎":active==="profile_banner"?"▰":"✧"}</span>}</div>
         <div><strong>{equippedItem(active)?.name??"Ninguno equipado"}</strong><p>{equippedItem(active)?.description??"Elige un diseño de tu colección o descubre los artículos de la tienda."}</p></div>
         <button onClick={()=>openPicker(active)}>Cambiar</button>
        </div>
        {active==="profile_banner"&&<div className="ps-studio-upload-row"><ImagePlus/><div><strong>Subir tu propio cartel</strong><small>PNG, JPG o WebP · máximo 8 MB</small></div><button onClick={()=>bannerRef.current?.click()} disabled={uploading!==null}>{uploading==="banner"?"Subiendo…":"Subir imagen"}</button><input ref={bannerRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload("banner",e.target.files?.[0]??null)}/></div>}
        {active==="avatar_frame"&&<div className="ps-studio-upload-row"><Camera/><div><strong>Tu avatar</strong><small>Actualiza la foto de tu cuenta</small></div><button onClick={()=>avatarRef.current?.click()} disabled={uploading!==null}>{uploading==="avatar"?"Subiendo…":"Cambiar foto"}</button><input ref={avatarRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload("avatar",e.target.files?.[0]??null)}/></div>}
        <div className="ps-studio-collection-grid">{items.slice(0,6).map(item=><button key={item.id} onClick={()=>{setSelected(item.id);setPicker(active);}} className={"ps-studio-item "+(equipped[active]===item.id?"is-equipped":"")}>{item.previewPath?<Image src={item.previewPath} alt="" fill unoptimized/>:<span>{item.name.slice(0,2)}</span>}<small>{equipped[active]===item.id?"EQUIPADO":inventory.includes(item.id)?"EN TU COLECCIÓN":"TIENDA"}</small></button>)}{!items.length&&<p className="ps-studio-empty">Estamos preparando diseños originales para esta categoría.</p>}</div>
       </>:<div className="ps-studio-color-editor"><div className="ps-studio-section-title"><span>COLOR DE CARTEL</span></div><p>Elige el tono de tu tarjeta de perfil.</p><div className="ps-studio-color-swatches">{catalog.filter(x=>x.category==="profile_theme").slice(0,5).map(item=><button key={item.id} title={item.name} style={{background:hex(item.metadata.primary)}} onClick={()=>{setSelected(item.id);setPicker("profile_theme");}}/>)}{!catalog.some(x=>x.category==="profile_theme")&&<span>Próximamente</span>}</div><button onClick={()=>openPicker("profile_theme")}>Explorar temas</button></div>}
       <div className="ps-studio-edit-fields"><div className="ps-studio-section-title"><span>IDENTIDAD BÁSICA</span></div>
        <label>Nombre visible<input value={displayName} maxLength={32} onChange={e=>setDisplayName(e.target.value)} placeholder="Tu nombre"/></label>
        <label>Pronombres<input value={pronouns} maxLength={32} onChange={e=>setPronouns(e.target.value)} placeholder="Opcional"/></label>
        <label>Estado personalizado<input value={status} maxLength={80} onChange={e=>setStatus(e.target.value)} placeholder="¿Qué estás haciendo?"/></label>
        <label>Sobre mí<textarea value={bio} maxLength={160} onChange={e=>setBio(e.target.value)} placeholder="Cuéntale algo a la comunidad…"/></label>
        <button className="ps-studio-save" onClick={()=>void save()} disabled={busy!==null||displayName.trim().length<2}><Save size={16}/>{busy==="save"?"Guardando…":"Guardar cambios"}</button>
       </div>
      </section>
     </div>
    </main>
   </div>
   {picker&&<div className="ps-studio-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPicker(null);}}>
    <section className="ps-studio-picker" role="dialog" aria-modal="true" aria-label={"Cambiar "+picker}>
     <header><div><span>PEAKSTYLE / COLECCIÓN</span><h2>Cambiar {slots.find(x=>x.id===picker)?.label.toLowerCase()}</h2></div><button onClick={()=>setPicker(null)}><X/></button></header>
     <div className="ps-studio-picker-body"><div className="ps-studio-picker-grid">
      <button className={"ps-studio-none "+(!equipped[picker]?"is-selected":"")} onClick={()=>void mutate("unequip",equippedItem(picker))}><Ban/><strong>Ninguno</strong></button>
      {catalog.filter(x=>x.category===picker).map(item=><button key={item.id} className={"ps-studio-picker-item "+(selected===item.id?"is-selected":"")} onClick={()=>setSelected(item.id)}>{item.previewPath?<Image src={item.previewPath} alt="" fill unoptimized/>:<span>{item.name.slice(0,2)}</span>}{!inventory.includes(item.id)&&<i><LockKeyhole size={12}/></i>}{equipped[picker]===item.id&&<small>EQUIPADO</small>}</button>)}
     </div><aside className="ps-studio-picker-preview"><div className="ps-studio-picker-preview-stage"><div className="ps-studio-picker-preview-art">{chosen?.previewPath?<Image src={chosen.previewPath} alt="" fill unoptimized/>:<span>PEAKSCORE</span>}</div><strong>{chosen?.name??"Diseños en preparación"}</strong><p>{chosen?.description??"Pronto habrá nuevos artículos."}</p><small>{chosen?.rarity?.toUpperCase()??"PEAKSTYLE"}</small></div>
      {chosen&&<div className="ps-studio-picker-actions">{equipped[picker]===chosen.id?<button disabled>Equipado</button>:inventory.includes(chosen.id)?<button disabled={busy!==null} onClick={()=>void mutate("equip",chosen)}>Equipar</button>:<button disabled={busy!==null||Number(profile?.coins??0)<chosen.priceCoins} onClick={()=>void mutate("purchase",chosen)}><ShoppingBag size={15}/> {chosen.priceCoins} PeakCoins</button>}<a href="/tienda">Ir a la tienda ↗</a></div>}
     </aside></div><footer><span>Saldo: {Number(profile?.coins??0).toLocaleString("es-CO")} PeakCoins</span><button onClick={()=>setPicker(null)}>Cerrar</button></footer>
    </section>
   </div>}
  </section>
 </div>;
}
