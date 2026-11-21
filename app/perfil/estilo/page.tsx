"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Coins,
  Crown,
  Eye,
  Lock,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";

type Category = "avatar_frame" | "profile_banner" | "profile_effect" | "nameplate" | "profile_theme";
type Cosmetic = {
  id: string;
  name: string;
  description: string;
  category: Category;
  asset_path: string | null;
  preview_path: string | null;
  price_coins: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  metadata: Record<string, unknown>;
  is_limited: boolean;
};
type PeakStyleData = {
  profile: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string;
    pronouns: string;
    level: number;
    coins: number;
  };
  catalog: Cosmetic[];
  inventory: { cosmetic_id: string; purchased_at: string; price_paid: number }[];
  ownedIds: string[];
  equippedBySlot: Partial<Record<Category, string>>;
};

const CATEGORY_LABELS: Record<Category | "all" | "collection", string> = {
  all: "Descubrir",
  avatar_frame: "Marcos",
  profile_banner: "Banners",
  profile_effect: "Efectos",
  nameplate: "Placas",
  profile_theme: "Temas",
  collection: "Mi colección",
};

const SLOT_LABELS: Record<Category, string> = {
  avatar_frame: "Marco de avatar",
  profile_banner: "Banner de perfil",
  profile_effect: "Efecto de perfil",
  nameplate: "Placa de nombre",
  profile_theme: "Tema de perfil",
};

const CATEGORY_ICONS: Record<Category | "all" | "collection", typeof Sparkles> = {
  all: WandSparkles,
  avatar_frame: Crown,
  profile_banner: Palette,
  profile_effect: Sparkles,
  nameplate: ShieldCheck,
  profile_theme: Eye,
  collection: UserRound,
};

const RARITY_LABELS = {
  common: "Común",
  rare: "Raro",
  epic: "Épico",
  legendary: "Legendario",
} as const;

const CATEGORIES = Object.keys(CATEGORY_LABELS) as (Category | "all" | "collection")[];

function coinLabel(value: number) {
  return Math.max(0, Number(value) || 0).toLocaleString("es-CO");
}

function cosmeticFor(data: PeakStyleData | null, id?: string) {
  return data?.catalog.find((item) => item.id === id) ?? null;
}

function PeakAvatar({
  url,
  displayName,
  frame,
  size = "large",
}: {
  url: string | null;
  displayName: string;
  frame: Cosmetic | null;
  size?: "large" | "small";
}) {
  return (
    <div className={"peakstyle-avatar peakstyle-avatar-" + size}>
      <div className="peakstyle-avatar-image">
        {url ? (
          <Image src={url} alt={"Avatar de " + displayName} fill unoptimized sizes="112px" className="object-cover" />
        ) : (
          <span>{displayName.trim().slice(0, 1).toUpperCase() || "P"}</span>
        )}
      </div>
      {frame?.asset_path && (
        <Image
          src={frame.asset_path}
          alt=""
          fill
          unoptimized
          sizes="140px"
          aria-hidden="true"
          className="peakstyle-avatar-frame"
        />
      )}
      {frame && !frame.asset_path && <div className="peakstyle-avatar-frame-fallback" aria-hidden="true"/>}
    </div>
  );
}

export default function PeakStylePage() {
  const [data, setData] = useState<PeakStyleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | "all" | "collection">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmPurchaseId, setConfirmPurchaseId] = useState<string | null>(null);
  const [draftEquipment, setDraftEquipment] = useState<Partial<Record<Category, string>>>({});
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [uploadingAsset, setUploadingAsset] = useState<"avatar" | "banner" | null>(null);
  const [error, setError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async (syncIdentity = true) => {
    try {
      setError("");
      const response = await fetch("/api/profile/cosmetics", { cache: "no-store" });
      const result = await response.json().catch(() => null) as PeakStyleData | { error?: string } | null;
      if (!response.ok || !result || !("catalog" in result)) {
        throw new Error(result && "error" in result ? result.error ?? "No se pudo cargar PeakStyle." : "No se pudo cargar PeakStyle.");
      }
      setData(result);
      if (syncIdentity) {
        setDisplayName(result.profile.displayName ?? "");
        setBio(result.profile.bio ?? "");
        setPronouns(result.profile.pronouns ?? "");
      }
      setDraftEquipment(result.equippedBySlot ?? {});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar PeakStyle.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadData());
    return () => window.cancelAnimationFrame(frame);
  }, [loadData]);

  const selected = useMemo(() => cosmeticFor(data, selectedId), [data, selectedId]);
  const purchaseCandidate = useMemo(() => cosmeticFor(data, confirmPurchaseId ?? undefined), [data, confirmPurchaseId]);
  const previewEquipment = selected
    ? { ...draftEquipment, [selected.category]: selected.id }
    : draftEquipment;
  const previewFrame = cosmeticFor(data, previewEquipment.avatar_frame);
  const previewBanner = cosmeticFor(data, previewEquipment.profile_banner);
  const previewEffect = cosmeticFor(data, previewEquipment.profile_effect);
  const previewNameplate = cosmeticFor(data, previewEquipment.nameplate);
  const previewTheme = cosmeticFor(data, previewEquipment.profile_theme);

  const visibleCatalog = useMemo(() => {
    if (!data) return [];
    if (activeCategory === "collection") return data.catalog.filter((item) => data.ownedIds.includes(item.id));
    if (activeCategory === "all") return data.catalog;
    return data.catalog.filter((item) => item.category === activeCategory);
  }, [activeCategory, data]);

  async function mutateCosmetic(action: "purchase" | "equip" | "unequip", item: Cosmetic) {
    setBusyId(item.id);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/profile/cosmetics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          cosmeticId: item.id,
          slot: item.category,
        }),
      });
      const result = await response.json().catch(() => null) as {
        error?: string;
        coins?: number;
        alreadyOwned?: boolean;
      } | null;
      if (!response.ok) throw new Error(result?.error ?? "No se pudo actualizar el cosmético.");
      if (action === "purchase") {
        await loadData(false);
        setSavedMessage(result?.alreadyOwned ? "Este objeto ya estaba en tu colección." : "Objeto añadido a tu colección.");
        return;
      }
      setDraftEquipment((current) => {
        const next = { ...current };
        if (action === "equip") next[item.category] = item.id;
        else delete next[item.category];
        return next;
      });
      await loadData(false);
      setSavedMessage(action === "equip" ? item.name + " equipado." : "Objeto retirado.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la acción.");
    } finally {
      setBusyId(null);
    }
  }

  async function uploadAsset(assetType: "avatar" | "banner", file: File | null) {
    if (!file) return;
    setError("");
    setSavedMessage("");
    if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
      setError("La imagen debe pesar máximo 8 MB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Solo se permiten imágenes PNG, JPG o WebP estáticas.");
      return;
    }

    setUploadingAsset(assetType);
    try {
      const form = new FormData();
      form.set("asset_type", assetType);
      form.set("file", file);
      const response = await fetch("/api/profile/assets", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      });
      const result = await response.json().catch(() => null) as { error?: string; assetUrl?: string; metadataRemoved?: boolean } | null;
      if (!response.ok || !result?.assetUrl) {
        throw new Error(result?.error ?? "No se pudo actualizar la imagen.");
      }
      await loadData(false);
      setSavedMessage(assetType === "avatar"
        ? "Tu avatar quedó actualizado y sin metadatos de ubicación."
        : "Tu banner quedó actualizado y sin metadatos de ubicación.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo actualizar la imagen.");
    } finally {
      setUploadingAsset(null);
      if (assetType === "avatar" && avatarInputRef.current) avatarInputRef.current.value = "";
      if (assetType === "banner" && bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError("");
    setSavedMessage("");
    try {
      const response = await fetch("/api/profile/cosmetics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", displayName, bio, pronouns }),
      });
      const result = await response.json().catch(() => null) as { error?: string; profile?: { displayName: string; bio: string; pronouns: string } } | null;
      if (!response.ok || !result?.profile) throw new Error(result?.error ?? "No se pudo guardar el perfil.");
      setDisplayName(result.profile.displayName);
      setBio(result.profile.bio);
      setPronouns(result.profile.pronouns);
      setSavedMessage("Tu identidad PeakStyle quedó guardada.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  const previewBannerUrl = previewBanner?.asset_path ?? data?.profile.bannerUrl ?? null;
  const bannerStyle = previewBannerUrl
    ? { backgroundImage: "linear-gradient(180deg,rgba(5,8,20,.08),rgba(5,8,20,.72)),url(" + JSON.stringify(previewBannerUrl) + ")" }
    : undefined;

  const themeMetadata = previewTheme?.metadata ?? {};
  const themeStyle = {
    "--peakstyle-primary": typeof themeMetadata.primary === "string" ? themeMetadata.primary : "#0B1020",
    "--peakstyle-surface": typeof themeMetadata.surface === "string" ? themeMetadata.surface : "#141D36",
    "--peakstyle-accent": typeof themeMetadata.accent === "string" ? themeMetadata.accent : "#39D6F0",
    "--peakstyle-highlight": typeof themeMetadata.highlight === "string" ? themeMetadata.highlight : "#7FE05C",
  } as CSSProperties;

  return (
    <main className="peakstyle-page" style={themeStyle}>
      <div className="peakstyle-shell">
        <div className="peakstyle-topline">
          <Link href="/perfil/personaje" className="peakstyle-back">
            <ArrowLeft size={16}/> Perfil y personajes
          </Link>
          <div className="peakstyle-wallet">
            <Image src="/images/currency/peakcoin.webp" alt="" width={24} height={24}/>
            <span>{coinLabel(data?.profile.coins ?? 0)}</span>
            <small>PEAKCOINS</small>
          </div>
        </div>

        <header className="peakstyle-heading">
          <div>
            <p className="peakstyle-kicker">PEAKSCORE IDENTITY SYSTEM · 01</p>
            <h1>Diseña tu identidad.</h1>
            <p className="peakstyle-intro">Tu perfil no es una tarjeta más. Es tu espacio, tu estilo y tu historia dentro de PeakScore.</p>
          </div>
          <div className="peakstyle-heading-stamp">
            <span><Sparkles size={14}/> PEAKSTYLE</span>
            <strong>MAKE IT YOURS</strong>
          </div>
        </header>

        {error && <p role="alert" className="peakstyle-alert peakstyle-alert-error">{error}</p>}
        {savedMessage && <p role="status" className="peakstyle-alert peakstyle-alert-success">{savedMessage}</p>}

        <div className="peakstyle-grid">
          <section className="peakstyle-preview-column">
            <div className="peakstyle-section-heading">
              <div>
                <p className="peakstyle-kicker">LIVE PREVIEW</p>
                <h2>Así te verá la comunidad</h2>
              </div>
              <span className="peakstyle-preview-status"><i/> VISTA PREVIA</span>
            </div>

            <article className={"peakstyle-profile-card " + (previewEffect?.id ?? "")}>
              <div className="peakstyle-banner" style={bannerStyle}>
                {!previewBannerUrl && <div className="peakstyle-banner-default"><span>PEAKSCORE</span><b>PLAYER PROFILE</b></div>}
                {previewEffect?.id === "effect-starfall" && <div className="peakstyle-effect peakstyle-effect-starfall" aria-hidden="true"/>}
                {previewEffect?.id === "effect-pixel-burst" && <div className="peakstyle-effect peakstyle-effect-burst" aria-hidden="true"/>}
                <div className="peakstyle-banner-corner">PS / PROFILE</div>
              </div>
              <div className="peakstyle-profile-body">
                <div className="peakstyle-profile-top">
                  <PeakAvatar
                    url={data?.profile.avatarUrl ?? null}
                    displayName={displayName || data?.profile.displayName || "Peak Player"}
                    frame={previewFrame}
                  />
                  <div className="peakstyle-identity">
                    <p className="peakstyle-level-tag">LEVEL {data?.profile.level ?? 1} <span>·</span> PEAKSCORE</p>
                    <h3>{displayName || "Tu nombre"}</h3>
                    {pronouns && <p className="peakstyle-pronouns">{pronouns}</p>}
                    {previewNameplate?.asset_path && <Image src={previewNameplate.asset_path} alt="" width={240} height={47} unoptimized className="peakstyle-nameplate"/>}
                    {!previewNameplate && <p className="peakstyle-member-tag">MEMBER · PEAKSCORE</p>}
                  </div>
                  <div className="peakstyle-online-mark"><i/> ONLINE</div>
                </div>
                <p className="peakstyle-bio">{bio || "Tu descripción aparecerá aquí. Cuenta algo sobre ti, tus juegos o tu camino hacia el Saber 11."}</p>
                <div className="peakstyle-profile-divider"/>
                <div className="peakstyle-profile-stats">
                  <div><span>RANGO</span><strong>PEAK PLAYER</strong></div>
                  <div><span>IDENTIDAD</span><strong>{previewTheme?.name ?? "MIDNIGHT ARCADE"}</strong></div>
                  <div><span>COLECCIÓN</span><strong>{data?.ownedIds.length ?? 0} ITEMS</strong></div>
                </div>
              </div>
            </article>

            <div className="peakstyle-equipment-panel">
              <div className="peakstyle-equipment-title"><ShieldCheck size={16}/> EQUIPAMIENTO ACTUAL</div>
              {(["avatar_frame","profile_banner","profile_effect","nameplate","profile_theme"] as Category[]).map((slot) => {
                const item = cosmeticFor(data, draftEquipment[slot]);
                return <div className="peakstyle-equipment-row" key={slot}>
                  <span>{SLOT_LABELS[slot]}</span>
                  <strong>{item?.name ?? "Sin equipar"}</strong>
                </div>;
              })}
            </div>
          </section>

          <section className="peakstyle-editor-column">
            <div className="peakstyle-panel peakstyle-profile-editor">
              <div className="peakstyle-panel-heading">
                <div><p className="peakstyle-kicker">YOUR IDENTITY</p><h2>Tu perfil</h2></div>
                <UserRound size={20}/>
              </div>
              <label className="peakstyle-field">
                <span>Nombre visible <small>{displayName.length}/32</small></span>
                <input value={displayName} maxLength={32} onChange={(event) => setDisplayName(event.target.value)} placeholder="¿Cómo te llaman?" autoComplete="nickname"/>
              </label>
              <label className="peakstyle-field">
                <span>Sobre mí <small>{bio.length}/160</small></span>
                <textarea value={bio} maxLength={160} rows={3} onChange={(event) => setBio(event.target.value)} placeholder="Tu historia, tus intereses, tu meta..."/>
              </label>
              <label className="peakstyle-field">
                <span>Pronombres <small>Opcional</small></span>
                <input value={pronouns} maxLength={32} onChange={(event) => setPronouns(event.target.value)} placeholder="Ej. él / ella / elle"/>
              </label>
              <div className="peakstyle-asset-controls">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="peakstyle-file-input"
                  aria-label="Subir avatar"
                  onChange={(event) => void uploadAsset("avatar", event.target.files?.[0] ?? null)}
                />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="peakstyle-file-input"
                  aria-label="Subir banner"
                  onChange={(event) => void uploadAsset("banner", event.target.files?.[0] ?? null)}
                />
                <button type="button" className="peakstyle-upload-button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAsset !== null}>
                  <UserRound size={14}/>{uploadingAsset === "avatar" ? "Subiendo avatar..." : "Cambiar avatar"}
                </button>
                <button type="button" className="peakstyle-upload-button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingAsset !== null}>
                  <Image src="/profile-cosmetics/banners/celestial-rift.svg" alt="" width={16} height={16} unoptimized/>{uploadingAsset === "banner" ? "Subiendo banner..." : "Subir banner"}
                </button>
              </div>
              <p className="peakstyle-upload-note">PNG, JPG o WebP · Máximo 8 MB · Se eliminan EXIF, GPS y otros metadatos · No se admiten GIF/APNG animados.</p>
              <button type="button" className="peakstyle-save-profile" onClick={() => void saveProfile()} disabled={savingProfile || !displayName.trim()}>
                {savingProfile ? <span className="peakstyle-button-spinner"/> : <Save size={15}/>}
                Guardar identidad
              </button>
            </div>

            <div className="peakstyle-catalog-panel">
              <div className="peakstyle-panel-heading">
                <div><p className="peakstyle-kicker">THE COLLECTION</p><h2>Tu estilo, tus reglas</h2></div>
                <span className="peakstyle-coin-note"><Coins size={15}/> Solo PeakCoins</span>
              </div>
              <p className="peakstyle-catalog-intro">Explora, previsualiza y equipa. Lo que desbloqueas se queda en tu colección.</p>
              <div className="peakstyle-category-tabs" role="tablist" aria-label="Categorías de PeakStyle">
                {CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category];
                  return <button type="button" key={category} role="tab" aria-selected={activeCategory === category}
                    className={activeCategory === category ? "peakstyle-category-active" : ""}
                    onClick={() => setActiveCategory(category)}>
                    <Icon size={14}/>{CATEGORY_LABELS[category]}
                  </button>;
                })}
              </div>

              {loading ? (
                <div className="peakstyle-loading-grid">{[0,1,2].map((n) => <div key={n} className="peakstyle-skeleton-card"/>)}</div>
              ) : visibleCatalog.length === 0 ? (
                <div className="peakstyle-empty"><Sparkles size={25}/><strong>Aún no hay objetos en esta sección.</strong><span>Pronto habrá nuevas piezas para ampliar tu identidad.</span></div>
              ) : (
                <div className="peakstyle-cosmetic-grid">
                  {visibleCatalog.map((item) => {
                    const owned = data?.ownedIds.includes(item.id) ?? false;
                    const equipped = draftEquipment[item.category] === item.id;
                    const busy = busyId === item.id;
                    const selectedCard = selectedId === item.id;
                    return <article className={"peakstyle-cosmetic-card " + (selectedCard ? "peakstyle-cosmetic-selected" : "")} key={item.id}>
                      <button type="button" className="peakstyle-cosmetic-art" onClick={() => setSelectedId(item.id)} aria-pressed={selectedCard}>
                        {item.preview_path && <Image src={item.preview_path} alt="" fill unoptimized sizes="(max-width: 640px) 45vw, 230px" className="peakstyle-art-image"/>}
                        {!item.preview_path && <div className={"peakstyle-art-theme " + item.id}/>}
                        <span className={"peakstyle-rarity peakstyle-rarity-" + item.rarity}>{RARITY_LABELS[item.rarity]}</span>
                        {owned && <span className="peakstyle-owned-mark"><Check size={12}/> TUYO</span>}
                      </button>
                      <div className="peakstyle-cosmetic-info">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="peakstyle-item-footer">
                          <span className="peakstyle-price">{owned ? "DESBLOQUEADO" : <><Image src="/images/currency/peakcoin.webp" alt="" width={17} height={17}/>{coinLabel(item.price_coins)}</>}</span>
                          {owned ? (
                            equipped ? (
                              <button type="button" className="peakstyle-equipped-button" onClick={() => void mutateCosmetic("unequip", item)} disabled={busy}>RETIRAR</button>
                            ) : (
                              <button type="button" className="peakstyle-equip-button" onClick={() => void mutateCosmetic("equip", item)} disabled={busy}>
                                {busy ? "..." : "EQUIPAR"}
                              </button>
                            )
                          ) : (
                            <button type="button" className="peakstyle-buy-button" onClick={() => setConfirmPurchaseId(item.id)} disabled={busy}>
                              OBTENER
                            </button>
                          )}
                        </div>
                      </div>
                    </article>;
                  })}
                </div>
              )}
              {selected && <div className="peakstyle-selected-note"><Eye size={15}/><span>Previsualizando <strong>{selected.name}</strong> en el perfil. {data?.equippedBySlot[selected.category] === selected.id ? "Ya está equipado." : "No cambia tu perfil hasta equiparlo."}</span></div>}
            </div>
          </section>
        </div>

        {purchaseCandidate && (
          <div className="peakstyle-purchase-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmPurchaseId(null); }}>
            <section className="peakstyle-purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="peakstyle-purchase-title">
              <div className="peakstyle-purchase-symbol"><Coins size={22}/></div>
              <p className="peakstyle-kicker">CONFIRM COLLECTION</p>
              <h2 id="peakstyle-purchase-title">Añadir a tu colección</h2>
              <p className="peakstyle-purchase-item">{purchaseCandidate.name}</p>
              <p className="peakstyle-purchase-description">{purchaseCandidate.description}</p>
              <div className="peakstyle-purchase-cost">
                <span>Coste</span>
                <strong><Image src="/images/currency/peakcoin.webp" alt="" width={23} height={23}/>{coinLabel(purchaseCandidate.price_coins)} PeakCoins</strong>
              </div>
              <p className="peakstyle-purchase-note">El objeto será tuyo permanentemente. No se realiza ningún pago con dinero real.</p>
              <div className="peakstyle-purchase-actions">
                <button type="button" onClick={() => setConfirmPurchaseId(null)} className="peakstyle-purchase-cancel">Ahora no</button>
                <button type="button" onClick={() => { setConfirmPurchaseId(null); void mutateCosmetic("purchase", purchaseCandidate); }} className="peakstyle-purchase-confirm" disabled={busyId === purchaseCandidate.id}>
                  Confirmar compra
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="peakstyle-footer">
          <span><Lock size={13}/> Compras protegidas por el servidor · Sin pagos reales · Sin objetos temporales</span>
          <Link href="/perfil/personaje">Volver a mi personaje <ChevronRight size={14}/></Link>
        </footer>
      </div>
    </main>
  );
}
