"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Props = { onClose: () => void };
type KeyToken = { label: string; codes: string[] };
type Action = { title: string; keys: KeyToken[][]; hint?: string };

const key = (label: string, ...codes: string[]): KeyToken => ({ label, codes });
const wasd = [key("W", "KeyW"), key("A", "KeyA"), key("S", "KeyS"), key("D", "KeyD")];
const arrows = [key("↑", "ArrowUp"), key("←", "ArrowLeft"), key("↓", "ArrowDown"), key("→", "ArrowRight")];

const MOVEMENT: Action[] = [
  { title: "Moverse por la habitación", keys: [wasd, arrows], hint: "WASD o flechas" },
];

const INTERACTION: Action[] = [
  { title: "Recoger el libro", keys: [[key("R", "KeyR")]], hint: "Mantener" },
  { title: "Abrir el libro sobre la mesa", keys: [[key("C", "KeyC")]], hint: "Mantener" },
  { title: "Devolver el libro al estante", keys: [[key("E", "KeyE")]], hint: "Mantener" },
];

const READING: Action[] = [
  { title: "Enfocar / abrir mesa de sospechosos", keys: [[key("F", "KeyF")]] },
  { title: "Cambiar de ficha", keys: [[key("←", "ArrowLeft")], [key("→", "ArrowRight")]] },
  { title: "Enfocar el computador", keys: [[key("T", "KeyT")]] },
  { title: "Salir de la lectura / devolver el libro", keys: [[key("SHIFT", "ShiftLeft", "ShiftRight")]] },
];

const SYSTEM: Action[] = [
  { title: "Liberar cursor / cerrar el mapa", keys: [[key("ESC", "Escape")]] },
  { title: "Abrir o cerrar este mapa", keys: [[key("H", "KeyH")]] },
  { title: "Continuar / iniciar sesión", keys: [[key("ENTER", "Enter")]] },
  { title: "Cambiar entre ventanas", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("TAB", "Tab")]] },
  { title: "Ajustar ventana a la izquierda o derecha", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("←", "ArrowLeft")], [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("→", "ArrowRight")]] },
  { title: "Maximizar / minimizar ventana", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("↑", "ArrowUp")], [key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("↓", "ArrowDown")]] },
  { title: "Abrir Explorador", keys: [[key("CTRL", "ControlLeft"), key("E", "KeyE")]] },
  { title: "Abrir Correo", keys: [[key("CTRL", "ControlLeft"), key("M", "KeyM")]] },
  { title: "Abrir Mensajería", keys: [[key("CTRL", "ControlLeft"), key("SHIFT", "ShiftLeft", "ShiftRight"), key("M", "KeyM")]] },
  { title: "Abrir Cronología", keys: [[key("CTRL", "ControlLeft"), key("T", "KeyT")]] },
];

function KeyCap({ token, pressed }: { token: KeyToken; pressed: string[] }) {
  const active = token.codes.some((code) => pressed.includes(code));
  return (
    <kbd className={[
      "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2",
      "font-mono text-[11px] font-bold tracking-wide transition-all duration-100",
      active
        ? "border-[#ffe0a0] bg-[#9b7130] text-white shadow-[0_0_14px_rgba(232,181,91,.38)]"
        : "border-[#53616a] bg-gradient-to-b from-[#29323a] to-[#171e25] text-[#f2f3f4] shadow-[0_2px_0_#080c10]",
    ].join(" ")}>
      {token.label}
    </kbd>
  );
}

function KeyGroups({ groups, pressed }: { groups: KeyToken[][]; pressed: string[] }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 && <span className="px-0.5 text-[10px] text-[#a98a56]">o</span>}
          {group.map((token, tokenIndex) => (
            <span key={tokenIndex} className="flex items-center gap-1">
              {tokenIndex > 0 && <span className="text-[10px] text-[#9ca3a9]">+</span>}
              <KeyCap token={token} pressed={pressed} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActionRow({ action, pressed }: { action: Action; pressed: string[] }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-3 border-b border-white/[0.07] py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-[12px] leading-snug text-[#e8e9e9] sm:text-[13px]">{action.title}</p>
        {action.hint && <p className="mt-1 text-[10px] text-[#c5a36a]">{action.hint}</p>}
      </div>
      <KeyGroups groups={action.keys} pressed={pressed} />
    </div>
  );
}

function Section({
  number, title, description, actions, pressed, className = "", compact = false,
}: {
  number: string; title: string; description: string; actions: Action[];
  pressed: string[]; className?: string; compact?: boolean;
}) {
  return (
    <section className={[
      "min-w-0 overflow-hidden rounded-xl border border-[#665638]/70",
      "bg-gradient-to-br from-[#22262b] to-[#15191e] shadow-[0_8px_24px_rgba(0,0,0,.2)]",
      className,
    ].join(" ")}>
      <header className="flex items-center gap-3 border-b border-[#80683f]/35 bg-[#292b2d]/75 px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#b28b4b]/55 bg-[#7d5d2b]/20 font-mono text-xs font-bold text-[#e5bd78]">
          {number}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-wide text-[#f4e7cf]">{title}</h3>
          <p className="mt-0.5 text-[10px] text-[#aeb0b2]">{description}</p>
        </div>
      </header>
      <div className={compact ? "px-4 py-1" : "px-4 py-2"}>
        {actions.map((action, index) => (
          <ActionRow key={number + "-" + index} action={action} pressed={pressed} />
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
      // H is handled by the game's existing map toggle.
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
      className="fixed inset-0 z-[2147483000] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#090d12]/95 text-white backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Controles de Archivo Oculto y PEAK OS"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.12]"
        style={{
          backgroundImage: "linear-gradient(rgba(204,166,100,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(204,166,100,.18) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#8a7048]/45 bg-[#11161c]/95 px-5 py-4 sm:px-8">
        <div>
          <p className="font-mono text-[9px] font-bold tracking-[.24em] text-[#d0a65f]">PEAKSCORE / ARCHIVO OCULTO</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-wide text-[#f7f0e5] sm:text-2xl">Controles del juego</h2>
          <p className="mt-1 text-[11px] text-[#aeb5bb]">Todos los controles en un solo lugar</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#8b7048]/70 bg-[#24272a] text-2xl leading-none text-[#f2dfbd] transition hover:border-[#e1bd7b] hover:bg-[#403522] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e1bd7b]"
          aria-label="Cerrar controles"
        >
          ×
        </button>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:flex lg:items-center lg:justify-center">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <Section number="01" title="Movimiento" description="Desplázate por la habitación" actions={MOVEMENT} pressed={pressed} />
          <Section number="02" title="Interacción" description="Manipula libros y objetos" actions={INTERACTION} pressed={pressed} />
          <Section number="03" title="Lectura e inspección" description="Consulta el computador y revisa sospechosos" actions={READING} pressed={pressed} />
          <Section number="04" title="Sistema" description="Controles del mapa y atajos de PEAK OS" actions={SYSTEM} pressed={pressed} compact />
        </div>
      </main>

      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-[#8a7048]/45 bg-[#11161c]/95 px-5 py-3 sm:px-8">
        <p className="text-[10px] text-[#aeb5bb]">Presiona <kbd className="mx-1 rounded border border-[#59616a] bg-[#252c33] px-1.5 py-0.5 font-mono text-[9px] text-white">ESC</kbd> para cerrar</p>
        <p className="font-mono text-[9px] tracking-[.12em] text-[#c9a363]">PEAK SYSTEMS / INPUT GUIDE</p>
      </footer>
    </div>,
    document.body
  );
}
