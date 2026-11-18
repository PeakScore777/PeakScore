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

const INVESTIGATION: Action[] = [
  { title: "Inspeccionar sospechosos", keys: [[key("F", "KeyF")]] },
  { title: "Ficha anterior / siguiente", keys: [[key("←", "ArrowLeft")], [key("→", "ArrowRight")]] },
  { title: "Abrir el computador", keys: [[key("T", "KeyT")]] },
  { title: "Salir de la lectura y devolver el libro", keys: [[key("SHIFT", "ShiftLeft", "ShiftRight")]] },
];

const GAME_SYSTEM: Action[] = [
  { title: "Cerrar el mapa y liberar el cursor", keys: [[key("ESC", "Escape")]] },
  { title: "Mostrar u ocultar esta guía", keys: [[key("H", "KeyH")]] },
  { title: "Continuar / iniciar sesión", keys: [[key("ENTER", "Enter")]] },
];

const PEAK_OS: Action[] = [
  { title: "Cambiar entre ventanas", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("TAB", "Tab")]] },
  { title: "Ajustar ventana a izquierda / derecha", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("← / →", "ArrowLeft", "ArrowRight")]] },
  { title: "Maximizar / minimizar ventana", keys: [[key("CTRL", "ControlLeft"), key("ALT", "AltLeft"), key("↑ / ↓", "ArrowUp", "ArrowDown")]] },
  { title: "Abrir Explorador", keys: [[key("CTRL", "ControlLeft"), key("E", "KeyE")]] },
  { title: "Abrir Correo", keys: [[key("CTRL", "ControlLeft"), key("M", "KeyM")]] },
  { title: "Abrir Mensajería", keys: [[key("CTRL", "ControlLeft"), key("SHIFT", "ShiftLeft", "ShiftRight"), key("M", "KeyM")]] },
  { title: "Abrir Cronología", keys: [[key("CTRL", "ControlLeft"), key("T", "KeyT")]] },
];

function KeyCap({ token, pressed }: { token: KeyToken; pressed: string[] }) {
  const active = token.codes.some((code) => pressed.includes(code));
  return (
    <kbd className={[
      "inline-flex h-[27px] min-w-[27px] shrink-0 items-center justify-center rounded-[4px] border px-1.5",
      "font-mono text-[9px] font-bold tracking-wide transition-[background,border-color,box-shadow,transform] duration-100",
      active
        ? "translate-y-px border-[#f1d19a] bg-[#a77a3c] text-white shadow-[0_0_10px_rgba(224,174,94,.4)]"
        : "border-[#92764e]/75 bg-gradient-to-b from-[#4a4133] to-[#29251f] text-[#f7ead4] shadow-[0_2px_0_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.12)]",
    ].join(" ")}>
      {token.label}
    </kbd>
  );
}

function KeyGroups({ groups, pressed }: { groups: KeyToken[][]; pressed: string[] }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 && <span className="px-0.5 text-[9px] font-semibold text-[#d2ad72]">/</span>}
          {group.map((token, tokenIndex) => (
            <span key={tokenIndex} className="flex items-center gap-1">
              {tokenIndex > 0 && <span className="text-[9px] text-[#bba17b]">+</span>}
              <KeyCap token={token} pressed={pressed} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActionRow({ action, pressed, compact = false }: { action: Action; pressed: string[]; compact?: boolean }) {
  return (
    <div className={["flex min-w-0 items-center justify-between gap-2 border-b border-[#d4b37c]/15 last:border-0", compact ? "min-h-[35px] py-1" : "min-h-[40px] py-1.5"].join(" ")}>
      <div className="min-w-0">
        <p className="text-[10px] leading-snug text-[#f2e9dc] sm:text-[11px]">{action.title}</p>
        {action.hint && <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[.12em] text-[#d0a96c]">{action.hint}</p>}
      </div>
      <KeyGroups groups={action.keys} pressed={pressed} />
    </div>
  );
}

function Section({
  label, title, actions, pressed,
}: {
  label: string; title: string; actions: Action[]; pressed: string[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-[#a27d4c]/55 bg-[linear-gradient(145deg,rgba(42,35,27,.88),rgba(20,21,20,.9))] shadow-[0_6px_18px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,239,210,.06)]">
      <header className="flex items-center gap-2.5 border-b border-[#b18a55]/30 bg-[#30271d]/50 px-3.5 py-2">
        <span className="h-4 w-[2px] shrink-0 bg-[#d7ad6a]" />
        <div className="min-w-0">
          <p className="font-mono text-[8px] font-semibold uppercase tracking-[.2em] text-[#d2aa6e]">{label}</p>
          <h3 className="text-[12px] font-bold tracking-wide text-[#fff1dc]">{title}</h3>
        </div>
      </header>
      <div className="px-3.5 py-0.5">
        {actions.map((action, index) => <ActionRow key={label + "-" + index} action={action} pressed={pressed} />)}
      </div>
    </section>
  );
}

function PeakOsSection({ pressed }: { pressed: string[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-[#a27d4c]/55 bg-[linear-gradient(145deg,rgba(42,35,27,.88),rgba(20,21,20,.9))] shadow-[0_6px_18px_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,239,210,.06)]">
      <header className="flex items-center gap-2.5 border-b border-[#b18a55]/30 bg-[#30271d]/50 px-3.5 py-2">
        <span className="h-4 w-[2px] shrink-0 bg-[#d7ad6a]" />
        <div>
          <p className="font-mono text-[8px] font-semibold uppercase tracking-[.2em] text-[#d2aa6e]">Herramientas del escritorio</p>
          <h3 className="text-[12px] font-bold tracking-wide text-[#fff1dc]">Atajos de PEAK OS</h3>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-x-4 px-3.5 py-1 sm:grid-cols-2 xl:grid-cols-4">
        {PEAK_OS.map((action, index) => (
          <div key={"peak-os-" + index} className="flex min-w-0 items-center justify-between gap-2 border-b border-[#d4b37c]/15 py-1.5">
            <p className="min-w-0 text-[9px] leading-snug text-[#e9dfd0]">{action.title}</p>
            <KeyGroups groups={action.keys} pressed={pressed} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ArchivoOcultoControls({ onClose }: Props) {
  const [pressed, setPressed] = useState<string[]>([]);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setPressed((current) => current.includes(event.code) ? current : [...current, event.code]);
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
    <div className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-4" role="dialog" aria-modal="true" aria-label="Guía de controles de Archivo Oculto">
      <div aria-hidden="true" className="absolute inset-0 bg-[#080907]/30 backdrop-blur-[1px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.045]" style={{ backgroundImage: "linear-gradient(rgba(218,177,111,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(218,177,111,.18) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />

      <div className="relative flex max-h-[82vh] w-full max-w-[980px] flex-col overflow-hidden rounded-lg border border-[#b18a55]/65 bg-[linear-gradient(145deg,rgba(32,28,23,.92),rgba(13,16,16,.93))] shadow-[0_20px_70px_rgba(0,0,0,.52),inset_0_1px_0_rgba(255,235,198,.12)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[5px] rounded-md border border-[#d1ad76]/15" />
        <header className="relative flex shrink-0 items-center justify-between gap-3 border-b border-[#b18a55]/40 bg-[#211d18]/55 px-4 py-2.5 sm:px-5">
          <div className="min-w-0">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[.23em] text-[#d2aa6e]">PeakScore <span className="px-1 text-[#806746]">/</span> Archivo confidencial</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <h2 className="text-base font-bold tracking-wide text-[#fff2dd] sm:text-lg">Controles</h2>
              <p className="text-[9px] text-[#c3b8a6]">Todo lo necesario para investigar</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#9b784a]/65 bg-[#332a20]/90 text-lg leading-none text-[#ead3ad] transition hover:border-[#e4bd7b] hover:bg-[#57432a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd7b]" aria-label="Cerrar controles">×</button>
        </header>

        <main className="relative min-h-0 overflow-y-auto p-2.5 sm:p-3">
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2.5">
              <Section label="Exploración" title="Movimiento" actions={MOVEMENT} pressed={pressed} />
              <Section label="Investigación" title="Expediente" actions={INVESTIGATION} pressed={pressed} />
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
              <Section label="Manipulación" title="Libros y objetos" actions={INTERACTION} pressed={pressed} />
              <Section label="En el juego" title="Sistema" actions={GAME_SYSTEM} pressed={pressed} />
            </div>
            <div className="lg:col-span-2">
              <PeakOsSection pressed={pressed} />
            </div>
          </div>
        </main>

        <footer className="relative flex shrink-0 items-center justify-between gap-3 border-t border-[#b18a55]/35 bg-[#1b1916]/75 px-4 py-2 sm:px-5">
          <p className="text-[9px] text-[#d0c3b0]">Presiona <kbd className="mx-1 rounded border border-[#a4875c]/65 bg-[#393127] px-1.5 py-0.5 font-mono text-[8px] text-[#fff0d6]">ESC</kbd> para cerrar</p>
          <p className="font-mono text-[8px] uppercase tracking-[.15em] text-[#c5a06a]">Peak Systems <span className="px-1 text-[#796348]">/</span> Input guide</p>
        </footer>
      </div>
    </div>,
    document.body
  );
}
