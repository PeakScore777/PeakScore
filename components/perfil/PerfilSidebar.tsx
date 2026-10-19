
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS = [
  {
    label: "Personajes",
    href: "/perfil/personaje",
    image: "/images/profile/sidebar/personajes.png",
  },
  {
    label: "Tu rango",
    href: "/perfil/rango",
    image: "/images/profile/sidebar/rangos.png",
  },
  {
    label: "Insignias",
    href: "/perfil/insignias",
    image: "/images/profile/sidebar/insignias.png",
  },
  {
    label: "Mi cuaderno",
    href: "/perfil/cuaderno",
    image: undefined,
  },
];

const FOUNDER_QUOTES = [
  "Toda leyenda empieza siendo alguien que se niega a rendirse.",
  "Cada error te revela lo que necesitas dominar para subir de nivel.",
  "Tu resultado de hoy no define hasta dónde puedes llegar.",
  "No persigas el rango: conviértete en alguien digno de alcanzarlo.",
  "Cuando la motivación se apague, deja que tu disciplina hable por ti.",
  "Las leyendas no se miden por dónde empiezan, sino por lo que se atreven a construir.",
  "Un día mirarás atrás y entenderás que cada pequeño esfuerzo te estaba preparando para algo grande.",
];

const FOUNDER_IMAGE =
  "/images/profile/rank/founder/the_character_animation.gif";

interface PerfilSidebarProps {
  open: boolean;
  onToggle: () => void;
  loading: boolean;
}

function SidebarItemsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 px-3"
    >
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex min-h-[82px] items-center gap-4 rounded-xl border border-[#49305f]/40 px-3"
        >
          <div className="size-[64px] shrink-0 animate-pulse rounded-xl border border-[#523367]/40 bg-[#21132f]" />

          <div className="h-3.5 w-20 max-w-full animate-pulse rounded bg-[#d8c9e9]/10" />
        </div>
      ))}
    </div>
  );
}

function FounderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-auto flex w-full shrink-0 flex-col items-center px-3 pb-5 pt-6"
    >
      <div className="mx-auto flex w-full max-w-[258px] flex-col items-center">
        {/* Globo provisional */}
        <div className="flex min-h-[76px] w-full items-center justify-center rounded-xl border border-[#9060bd]/40 bg-[#1b0e2c] p-4">
          <div className="h-3 w-4/5 animate-pulse rounded bg-[#d8b8ff]/10" />
        </div>

        {/* Silueta provisional del Founder */}
        <div className="flex h-[250px] w-full flex-col items-center justify-end">
          <div className="relative flex h-[220px] w-[190px] flex-col items-center justify-end">
            <div className="absolute top-3 size-[76px] animate-pulse rounded-[38%] border border-[#9060bd]/20 bg-[#9060bd]/10" />

            <div className="h-[125px] w-[100px] animate-pulse rounded-t-[38%] rounded-b-2xl border border-[#9060bd]/15 bg-[#9060bd]/10" />

            <div className="-mt-1 flex w-[112px] justify-between">
              <div className="h-3 w-10 animate-pulse rounded bg-[#9060bd]/15" />
              <div className="h-3 w-10 animate-pulse rounded bg-[#9060bd]/15" />
            </div>
          </div>
        </div>

        <div className="mt-2 h-2 w-20 animate-pulse rounded bg-[#c3a0eb]/10" />
      </div>
    </div>
  );
}

export default function PerfilSidebar({
  open,
  onToggle,
  loading,
}: PerfilSidebarProps) {
  const pathname = usePathname();
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Las frases comienzan a rotar cuando termina el skeleton.
  useEffect(() => {
    if (!open || loading) return;

    const intervalId = window.setInterval(() => {
      setQuoteIndex(
        (current) => (current + 1) % FOUNDER_QUOTES.length,
      );
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [open, loading]);

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside
        aria-label="Menú del perfil"
        aria-hidden={!open}
        aria-busy={loading}
        className={`
          fixed bottom-0 left-0 top-[66px] z-40 hidden
          flex-col overflow-x-hidden overflow-y-auto
          border-r border-[#49305f]
          bg-[#12091f] text-[#f2eaff]
          transition-[transform,opacity] duration-300 ease-in-out
          lg:flex lg:w-[270px] xl:w-[290px]
          ${
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none -translate-x-full opacity-0"
          }
        `}
      >
        {/* Botón para ocultar */}
        <div className="flex h-[60px] shrink-0 items-center justify-end px-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Ocultar sidebar"
            title="Ocultar sidebar"
            className="
              group flex size-10 shrink-0 items-center justify-center
              rounded-xl border border-[#8051b6]/60
              bg-[#24113c] text-[#d8b8ff]
              transition-colors duration-200
              hover:border-[#c4a2ff] hover:bg-[#442064]
              hover:text-white
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#c4a2ff]
            "
          >
            <ChevronLeft
              size={22}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </button>
        </div>

        {/* Durante la carga se conservan las dimensiones del menú */}
        {loading ? (
          <SidebarItemsSkeleton />
        ) : (
          <nav
            aria-label="Secciones del perfil"
            className="flex flex-col gap-3 px-3"
          >
            {ITEMS.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                    group relative flex min-h-[82px] shrink-0
                    items-center gap-4 rounded-xl border px-3
                    transition-colors duration-200
                    ${
                      active
                        ? "border-[#a47be0]/60 bg-[#542a7d]/35 text-white shadow-[inset_3px_0_0_#bd95ff]"
                        : "border-transparent text-[#d8c9e9] hover:border-[#704693]/50 hover:bg-[#29163d] hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`
                      flex size-[64px] shrink-0 items-center justify-center
                      rounded-xl border transition-colors
                      ${
                        active
                          ? "border-[#9a6bc9]/60 bg-[#341a4e]"
                          : "border-[#523367]/35 bg-[#21132f] group-hover:border-[#8253a8]/50 group-hover:bg-[#301943]"
                      }
                    `}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        aria-hidden="true"
                        width={60}
                        height={60}
                        className="size-[58px] object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <BookOpen size={30} aria-hidden="true" className="text-[#c09aff] transition-transform duration-200 group-hover:scale-105" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1 text-[15px] font-semibold">
                    {item.label}
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full bg-[#c09aff]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Founder solo en escritorio y cuando termina la carga */}
        {open && (
          loading ? (
            <FounderSkeleton />
          ) : (
            <div className="mt-auto flex w-full shrink-0 flex-col items-center px-3 pb-5 pt-6">
              <div className="mx-auto flex w-full max-w-[258px] flex-col items-center">
                <div className="relative mb-1 flex min-h-[76px] w-full items-center justify-center rounded-xl border border-[#9060bd]/70 bg-[#1b0e2c] px-3 py-3 text-center">
                  <p
                    key={quoteIndex}
                    className="w-full text-[12px] font-semibold leading-relaxed text-[#f2e6ff]"
                  >
                    {FOUNDER_QUOTES[quoteIndex]}
                  </p>

                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-[#9060bd]/70 bg-[#1b0e2c]"
                  />
                </div>

                <div className="flex h-[250px] w-full items-end justify-center">
                  <Image
                    src={FOUNDER_IMAGE}
                    alt="Founder de PeakScore"
                    width={230}
                    height={270}
                    unoptimized
                    loading="eager"
                    className="h-[245px] w-[225px] -translate-x-3 object-contain object-bottom"
                  />
                </div>

                <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-[#c3a0eb]">
                  PEAKSCORE
                </p>
              </div>
            </div>
          )
        )}
      </aside>

      {/* Botón para volver a abrir el sidebar */}
      {!open && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Abrir sidebar"
          title="Abrir sidebar"
          className="
            fixed left-3 top-[82px] z-50 hidden size-10
            items-center justify-center rounded-xl
            border border-[#8051b6]/70 bg-[#1a0c2a]
            text-[#d8b8ff] shadow-lg
            transition-colors duration-200
            hover:border-[#c4a2ff] hover:bg-[#442064]
            hover:text-white
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[#c4a2ff]
            lg:flex
          "
        >
          <ChevronRight size={22} strokeWidth={2.2} />
        </button>
      )}

      {/* Navegación móvil: tres apartados, sin Founder */}
      <nav
        aria-label="Secciones del perfil"
        aria-busy={loading}
        className="
          fixed inset-x-0 bottom-0 z-50 border-t
          border-[#49305f] bg-[#12091f]
          px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]
          text-[#f2eaff] lg:hidden
        "
      >
        {loading ? (
          <div
            aria-hidden="true"
            className="mx-auto flex max-w-lg items-stretch justify-around gap-2"
          >
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-2"
              >
                <div className="size-[44px] animate-pulse rounded-xl border border-[#523367]/40 bg-[#21132f]" />
                <div className="h-2.5 w-14 max-w-full animate-pulse rounded bg-[#d8c9e9]/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-lg items-stretch justify-around gap-2">
            {ITEMS.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`
                    relative flex min-w-0 flex-1 flex-col
                    items-center justify-center gap-1.5
                    rounded-xl border px-1 py-2
                    transition-colors duration-200
                    ${
                      active
                        ? "border-[#9360c7]/45 bg-[#542a7d]/35 text-white"
                        : "border-transparent text-[#d2c1e5] hover:bg-[#28143c]"
                    }
                  `}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      aria-hidden="true"
                      width={44}
                      height={44}
                      className="size-[44px] object-contain"
                    />
                  ) : (
                    <BookOpen size={27} aria-hidden="true" className="text-[#c09aff]" />
                  )}

                  <span className="max-w-full truncate text-[11px] font-semibold">
                    {item.label}
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 h-0.5 w-7 rounded-full bg-[#c09aff]"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
