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
      "inline-flex h-[30px] min-w-[30px] shrink-0 items-center justify-center rounded-[4px] border px-1.5",
      "font-mono text-[10px] font-bold tracking-wide transition-[background,border-color,box-shadow,transform] duration-100",
      active
        ? "translate-y-px border-[#f1d19a] bg-[#a77a3c] text-white shadow-[0_0_10px_rgba(224,174,94,.4)]"
        : "border-[#c09a61]/80 bg-gradient-to-b from-[#514331] via-[#34291e] to-[#211b15] text-[#f7ead4] shadow-[0_2px_0_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.12)]",
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
    <div className={["flex min-w-0 items-center justify-between gap-2 border-b border-[#d4b37c]/15 last:border-0", compact ? "min-h-[39px] py-1.5" : "min-h-[47px] py-2"].join(" ")}>
      <div className="min-w-0">
        <p className="text-xs leading-snug text-[#f7eddf] sm:text-[13px]">{action.title}</p>
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
    <section className="relative min-w-0 overflow-hidden rounded-[6px] border border-[#c39a61]/75 bg-[linear-gradient(145deg,rgba(48,37,25,.94),rgba(15,15,14,.96))] shadow-[0_10px_26px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,231,191,.15)]">
      <header className="relative flex items-center gap-3 border-b border-[#b18a55]/45 bg-[linear-gradient(90deg,rgba(112,75,35,.62),rgba(42,31,21,.82))] px-4 py-3">
        <span aria-hidden="true" className="h-6 w-[3px] shrink-0 bg-gradient-to-b from-[#f4d69d] via-[#c2934e] to-[#79532b] shadow-[0_0_9px_rgba(211,160,83,.35)]" />
        <div className="min-w-0">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.26em] text-[#e5bb79]">{label}</p>
          <h3 className="mt-0.5 text-[14px] font-extrabold tracking-[.035em] text-[#fff1d9]">{title}</h3>
        </div>
        <span aria-hidden="true" className="ml-auto h-px w-10 bg-gradient-to-l from-[#d1a15c]/70 to-transparent" />
      </header>
      <div className="px-4 py-1">
        {actions.map((action, index) => <ActionRow key={label + "-" + index} action={action} pressed={pressed} />)}
      </div>
    </section>
  );
}

function PeakOsSection({ pressed }: { pressed: string[] }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[5px] border border-[#b58b50]/70 bg-[linear-gradient(145deg,rgba(43,34,24,.96),rgba(14,15,14,.97))] shadow-[0_10px_26px_rgba(0,0,0,.32),inset_0_1px_0_rgba(255,231,191,.14)]">
      <header className="flex items-center gap-3 border-b border-[#b18a55]/45 bg-[linear-gradient(90deg,rgba(91,62,31,.55),rgba(36,29,21,.7))] px-4 py-2.5">
        <span aria-hidden="true" className="h-6 w-[3px] shrink-0 bg-gradient-to-b from-[#f4d69d] via-[#c2934e] to-[#79532b]" />
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.26em] text-[#e5bb79]">Herramientas del escritorio</p>
          <h3 className="mt-0.5 text-[14px] font-extrabold tracking-[.035em] text-[#fff1d9]">Atajos de PEAK OS</h3>
        </div>
      </header>
      <div className="grid grid-cols-2 divide-x divide-y divide-[#c49a5c]/30 px-2 py-1 sm:grid-cols-4 xl:grid-cols-7">
        {PEAK_OS.map((action, index) => (
          <div key={"peak-os-" + index} className="flex min-w-0 flex-col items-center justify-center gap-2 px-2.5 py-3.5 text-center">
            <p className="min-h-[28px] text-[10px] font-semibold leading-snug text-[#f3e6d1]">{action.title}</p>
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
      <div aria-hidden="true" className="absolute inset-0 bg-[#080907]/28 backdrop-blur-[1px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.045]" style={{ backgroundImage: "linear-gradient(rgba(218,177,111,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(218,177,111,.18) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />

      <div className="relative flex max-h-[88vh] w-full max-w-[900px] flex-col overflow-hidden rounded-[10px] border border-[#d0a565]/80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(156,106,48,.24),transparent_52%),radial-gradient(ellipse_at_0%_100%,rgba(105,70,32,.12),transparent_45%),linear-gradient(145deg,rgba(36,29,21,.98),rgba(11,13,13,.98))] shadow-[0_20px_70px_rgba(0,0,0,.52),inset_0_1px_0_rgba(255,235,198,.12)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[6px] rounded-[7px] border border-[#d1ad76]/20" />
        <header className="relative flex shrink-0 items-center justify-center border-b border-[#b18a55]/60 bg-[radial-gradient(ellipse_at_50%_0%,rgba(174,125,57,.2),transparent_65%),linear-gradient(180deg,rgba(52,39,26,.94),rgba(25,22,18,.96))] px-5 py-4 sm:py-[19px]">
          <span aria-hidden="true" className="absolute left-7 right-7 top-1/2 h-px bg-gradient-to-r from-transparent via-[#c99b58]/75 to-transparent" />
          <span aria-hidden="true" className="absolute left-1/2 top-0 h-[3px] w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#e5bd7b] to-transparent" />
          <h2 className="relative bg-[#211b14] px-8 text-[24px] font-black uppercase tracking-[.2em] text-[#fff0d5] drop-shadow-[0_2px_8px_rgba(0,0,0,.75)] sm:text-[28px]">Controles</h2>
          <button type="button" onClick={onClose} className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md border border-[#cba365]/80 bg-[linear-gradient(180deg,#614a2d,#2b2117)] text-xl leading-none text-[#ffebc8] shadow-[0_2px_0_rgba(0,0,0,.65),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:border-[#ffe0a0] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd7b]" aria-label="Cerrar controles">×</button>
        </header>

        <main className="relative min-h-0 overflow-y-auto p-3.5 sm:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
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
          <p className="font-mono text-[8px] uppercase tracking-[.19em] text-[#d3aa6b]">Peak Systems <span className="px-1 text-[#796348]">/</span> Input guide</p>
        </footer>
      </div>
    </div>,
    document.body
  );
}
