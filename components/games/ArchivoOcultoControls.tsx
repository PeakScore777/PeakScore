"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Props = { onClose: () => void };
type KeyToken = { label: string; codes: string[] };
type Action = { title: string; keys: KeyToken[][]; hint?: string };

const key = (label: string, ...codes: string[]): KeyToken => ({ label, codes });
const MOVEMENT: Action[] = [
  {
    title: "Moverse por la habitación",
    keys: [
      [key("W", "KeyW"), key("A", "KeyA"), key("S", "KeyS"), key("D", "KeyD")],
      [key("↑", "ArrowUp"), key("←", "ArrowLeft"), key("↓", "ArrowDown"), key("→", "ArrowRight")],
    ],
    hint: "WASD o flechas",
  },
];

const INTERACTION: Action[] = [
  { title: "Recoger el libro", keys: [[key("R", "KeyR")]], hint: "Mantener" },
  { title: "Abrir el libro sobre la mesa", keys: [[key("C", "KeyC")]], hint: "Mantener" },
  { title: "Devolver el libro al estante", keys: [[key("E", "KeyE")]], hint: "Mantener" },
];

const READING: Action[] = [
  { title: "Inspeccionar sospechosos", keys: [[key("F", "KeyF")]] },
  { title: "Cambiar de ficha", keys: [[key("←", "ArrowLeft")], [key("→", "ArrowRight")]] },
  { title: "Abrir el computador", keys: [[key("T", "KeyT")]] },
  { title: "Salir y devolver el libro", keys: [[key("SHIFT", "ShiftLeft", "ShiftRight")]] },
];

const SYSTEM: Action[] = [
  { title: "Cerrar el mapa", keys: [[key("ESC", "Escape")]] },
  { title: "Mostrar / ocultar controles", keys: [[key("H", "KeyH")]] },
  { title: "Continuar / iniciar sesión", keys: [[key("ENTER", "Enter")]] },
  { title: "Cambiar entre ventanas", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("TAB", "Tab")]] },
  {
    title: "Ajustar ventana a un lado",
    keys: [
      [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("←", "ArrowLeft")],
      [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("→", "ArrowRight")],
    ],
  },
  {
    title: "Maximizar / minimizar ventana",
    keys: [
      [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("↑", "ArrowUp")],
      [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("↓", "ArrowDown")],
    ],
  },
  { title: "Abrir Explorador", keys: [[key("CTRL", "ControlLeft"), key("E", "KeyE")]] },
  { title: "Abrir Correo", keys: [[key("CTRL", "ControlLeft"), key("M", "KeyM")]] },
  { title: "Abrir Mensajería", keys: [[key("CTRL", "ControlLeft"), key("SHIFT", "ShiftLeft", "ShiftRight"), key("M", "KeyM")]] },
  { title: "Abrir Cronología", keys: [[key("CTRL", "ControlLeft"), key("T", "KeyT")]] },
];

function KeyCap({ token, pressed }: { token: KeyToken; pressed: string[] }) {
  const active = token.codes.some((code) => pressed.includes(code));
  return (
    <kbd
      className={[
        "inline-flex h-[29px] min-w-[29px] items-center justify-center rounded-[5px] border px-2",
        "font-mono text-[10px] font-bold tracking-wide transition-all duration-100",
        active
          ? "border-[#f4d59c] bg-[#a77b3d] text-white shadow-[0_0_13px_rgba(224,174,94,.42)] translate-y-px"
          : "border-[#8a704b]/75 bg-gradient-to-b from-[#494237] to-[#29251f] text-[#f4e7d0] shadow-[0_2px_0_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.12)]",
      ].join(" ")}
    >
      {token.label}
    </kbd>
  );
}

function KeyGroups({ groups, pressed }: { groups: KeyToken[][]; pressed: string[] }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 && <span className="px-0.5 text-[9px] font-semibold text-[#c49b5c]">o</span>}
          {group.map((token, tokenIndex) => (
            <span key={tokenIndex} className="flex items-center gap-1">
              {tokenIndex > 0 && <span className="text-[9px] text-[#b8a17e]">+</span>}
              <KeyCap token={token} pressed={pressed} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActionRow({ action, pressed, dense = false }: { action: Action; pressed: string[]; dense?: boolean }) {
  return (
    <div className={[
      "flex min-h-[42px] items-center justify-between gap-3 border-b border-[#d0b17b]/15 last:border-0",
      dense ? "py-1.5" : "py-2",
    ].join(" ")}>
      <div className="min-w-0">
        <p className="text-[11px] leading-snug text-[#f0e8dc] sm:text-xs">{action.title}</p>
        {action.hint && <p className="mt-0.5 text-[9px] uppercase tracking-[.12em] text-[#c5a36d]">{action.hint}</p>}
      </div>
      <KeyGroups groups={action.keys} pressed={pressed} />
    </div>
  );
}

function Section({
  eyebrow, title, description, actions, pressed, className = "", columns = 1, dense = false,
}: {
  eyebrow: string; title: string; description: string; actions: Action[];
  pressed: string[]; className?: string; columns?: 1 | 2; dense?: boolean;
}) {
  return (
    <section className={[
      "min-w-0 overflow-hidden rounded-lg border border-[#a17d4d]/45",
      "bg-[linear-gradient(145deg,rgba(47,39,29,.91),rgba(23,22,20,.91))]",
      "shadow-[0_10px_30px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,239,210,.06)]",
      className,
    ].join(" ")}>
      <header className="relative border-b border-[#b18a55]/30 px-4 pb-2.5 pt-3">
        <span className="absolute bottom-0 left-4 h-px w-12 bg-[#d7ad6a]" />
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[.22em] text-[#d2aa6e]">{eyebrow}</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="text-[13px] font-bold tracking-wide text-[#fff3df]">{title}</h3>
          <p className="text-[9px] text-[#b8afa1]">{description}</p>
        </div>
      </header>
      <div className={columns === 2 ? "grid grid-cols-1 gap-x-5 px-4 py-1 sm:grid-cols-2" : "px-4 py-1"}>
        {actions.map((action, index) => (
          <ActionRow key={eyebrow + "-" + index} action={action} pressed={pressed} dense={dense} />
        ))}
      </div>
    </section>
  );
}

export default function ArchivoOcultoControls({ onClose }: Props) {
  const [pressed, setPressed] = useState<string[]>([]);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setPressed((current) => current.includes(event.code) ? current : [...current, event.code]);
      // H remains available to the game's existing help-toggle listener.
      if (event.code === "KeyH") return;
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onKeyUp = (event: KeyboardEvent) => setPressed((current) => current.filter((code) => code !== event.code));
    const clear = () => setPressed([]);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", clear);
    };
  }, [onClose]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden px-3 py-3 sm:px-6 sm:py-5"
      role="dialog"
      aria-modal="true"
      aria-label="Controles de Archivo Oculto y PEAK OS"
    >
      {/* The world remains visible and recognizable behind the guide. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[#080907]/40 backdrop-blur-[1.5px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[.08]"
        style={{
          backgroundImage: "linear-gradient(rgba(218,177,111,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(218,177,111,.2) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative flex max-h-full w-full max-w-[1160px] flex-col overflow-hidden rounded-xl border border-[#b18a55]/65 bg-[linear-gradient(145deg,rgba(34,29,23,.94),rgba(15,17,17,.94))] shadow-[0_24px_90px_rgba(0,0,0,.58),inset_0_1px_0_rgba(255,235,198,.12)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[5px] rounded-lg border border-[#d1ad76]/15" />
        <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-[#b18a55]/40 bg-[#211d18]/65 px-5 py-3 sm:px-7">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[.25em] text-[#d2aa6e]">PeakScore <span className="px-1 text-[#806746]">/</span> Archivo confidencial</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="text-lg font-bold tracking-wide text-[#fff2dd] sm:text-xl">Guía de controles</h2>
              <p className="text-[10px] text-[#b8afa1]">Todo lo necesario para investigar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#9b784a]/65 bg-[#332a20]/90 text-xl leading-none text-[#ead3ad] transition hover:border-[#e4bd7b] hover:bg-[#57432a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd7b]"
            aria-label="Cerrar controles"
          >
            ×
          </button>
        </header>

        <main className="relative min-h-0 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
            <Section eyebrow="Exploración" title="Movimiento" description="Desplázate por la habitación" actions={MOVEMENT} pressed={pressed} />
            <Section eyebrow="Manipulación" title="Libros y objetos" description="Interactúa con el entorno" actions={INTERACTION} pressed={pressed} />
            <Section eyebrow="Investigación" title="Expediente" description="Inspecciona las pistas y personas" actions={READING} pressed={pressed} />
            <Section eyebrow="Atajos" title="Sistema" description="Mapa y herramientas de PEAK OS" actions={SYSTEM} pressed={pressed} columns={2} dense />
          </div>
        </main>

        <footer className="relative flex shrink-0 items-center justify-between gap-3 border-t border-[#b18a55]/35 bg-[#1b1916]/75 px-5 py-2.5 sm:px-7">
          <p className="text-[10px] text-[#c3b8a6]">Presiona <kbd className="mx-1 rounded border border-[#a4875c]/65 bg-[#393127] px-1.5 py-0.5 font-mono text-[9px] text-[#fff0d6]">ESC</kbd> para cerrar</p>
          <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c5a06a]">Peak Systems <span className="px-1 text-[#796348]">/</span> Input guide</p>
        </footer>
      </div>
    </div>,
    document.body
  );
}
