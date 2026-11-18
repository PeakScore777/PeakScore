"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Props = { onClose: () => void };
type KeyToken = { label: string; codes: string[] };
type Action = { title: string; keys: KeyToken[][]; hint?: string };

const key = (label: string, ...codes: string[]): KeyToken => ({ label, codes });

const MOVEMENT: Action[] = [
  { title: "Moverse", keys: [[key("W", "KeyW"), key("A", "KeyA"), key("S", "KeyS"), key("D", "KeyD")]], hint: "WASD" },
  { title: "Movimiento alternativo", keys: [[key("↑", "ArrowUp"), key("←", "ArrowLeft"), key("↓", "ArrowDown"), key("→", "ArrowRight")]], hint: "Flechas" },
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

function KeyCap({ token }: { token: KeyToken }) {
  return (
    <kbd data-key-codes={token.codes.join(" ")} className="inline-flex h-[30px] min-w-[30px] shrink-0 items-center justify-center rounded-[4px] border border-[#c09a61]/80 bg-gradient-to-b from-[#514331] via-[#34291e] to-[#211b15] px-1.5 font-mono text-[10px] font-bold tracking-wide text-[#f7ead4] shadow-[0_2px_0_rgba(0,0,0,.38)] transition-[background,border-color,transform] duration-75 data-[pressed=true]:translate-y-px data-[pressed=true]:border-[#f1d19a] data-[pressed=true]:bg-[#a77a3c] data-[pressed=true]:text-white">{token.label}</kbd>
  );
}

function KeyGroups({ groups }: { groups: KeyToken[][] }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1">
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 && <span className="px-0.5 text-[9px] font-semibold text-[#d2ad72]">/</span>}
          {group.map((token, tokenIndex) => (
            <span key={tokenIndex} className="flex items-center gap-1">
              {tokenIndex > 0 && <span className="text-[9px] text-[#bba17b]">+</span>}
              <KeyCap token={token} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActionRow({ action, compact = false }: { action: Action; compact?: boolean }) {
  return (
    <div className={["flex min-w-0 items-center justify-between gap-2 border-b border-[#d4b37c]/15 last:border-0", compact ? "min-h-[39px] py-1.5" : "min-h-[47px] py-2"].join(" ")}>
      <div className="min-w-0">
        <p className="text-xs leading-snug text-[#f7eddf] sm:text-[13px]">{action.title}</p>
        {action.hint && <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[.12em] text-[#d0a96c]">{action.hint}</p>}
      </div>
      <KeyGroups groups={action.keys} />
    </div>
  );
}

function Section({
  label, title, actions,
}: {
  label: string; title: string; actions: Action[];
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[6px] border border-[#c39a61]/75 bg-[linear-gradient(145deg,rgba(48,37,25,.94),rgba(15,15,14,.96))] shadow-[0_5px_14px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,231,191,.12)]">
      <header className="relative flex items-center gap-3 border-b border-[#b18a55]/45 bg-[linear-gradient(90deg,rgba(112,75,35,.62),rgba(42,31,21,.82))] px-4 py-3">
        <span aria-hidden="true" className="h-6 w-[3px] shrink-0 bg-gradient-to-b from-[#f4d69d] via-[#c2934e] to-[#79532b] shadow-[0_0_5px_rgba(211,160,83,.25)]" />
        <div className="min-w-0">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.26em] text-[#e5bb79]">{label}</p>
          <h3 className="mt-0.5 text-[14px] font-extrabold tracking-[.035em] text-[#fff1d9]">{title}</h3>
        </div>
        <span aria-hidden="true" className="ml-auto h-px w-10 bg-gradient-to-l from-[#d1a15c]/70 to-transparent" />
      </header>
      <div className="px-4 py-1">
        {actions.map((action, index) => <ActionRow key={label + "-" + index} action={action} />)}
      </div>
    </section>
  );
}

function PeakOsSection() {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[5px] border border-[#b58b50]/70 bg-[linear-gradient(145deg,rgba(43,34,24,.96),rgba(14,15,14,.97))] shadow-[0_5px_14px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,231,191,.12)]">
      <header className="flex items-center gap-3 border-b border-[#b18a55]/45 bg-[linear-gradient(90deg,rgba(91,62,31,.55),rgba(36,29,21,.7))] px-4 py-2.5">
        <span aria-hidden="true" className="h-6 w-[3px] shrink-0 bg-gradient-to-b from-[#f4d69d] via-[#c2934e] to-[#79532b]" />
        <div>
          <p className="font-mono text-[8px] font-bold uppercase tracking-[.26em] text-[#e5bb79]">Herramientas del escritorio</p>
          <h3 className="mt-0.5 text-[14px] font-extrabold tracking-[.035em] text-[#fff1d9]">Atajos de PEAK OS</h3>
        </div>
      </header>
      <div className="grid grid-cols-1 divide-y divide-[#c49a5c]/25 px-3 py-1 sm:grid-cols-2 sm:divide-x">
        {PEAK_OS.map((action, index) => (
          <div key={"peak-os-" + index} className="flex min-w-0 items-center justify-between gap-3 px-2.5 py-2.5 text-left">
            <p className="min-w-0 max-w-[48%] text-[10px] font-semibold leading-snug text-[#f3e6d1]">{action.title}</p>
            <KeyGroups groups={action.keys} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ArchivoOcultoControls({ onClose }: Props) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    const keycaps = Array.from(document.querySelectorAll<HTMLElement>("[data-key-codes]"));
    const keycapMap = new Map<string, HTMLElement[]>();
    for (const cap of keycaps) {
      for (const code of (cap.dataset.keyCodes || "").split(" ").filter(Boolean)) {
        const matches = keycapMap.get(code) || [];
        matches.push(cap);
        keycapMap.set(code, matches);
      }
    }
    const knownCodes = new Set(keycapMap.keys());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
        return;
      }
      if (!knownCodes.has(event.code)) return;
      for (const cap of keycapMap.get(event.code) || []) cap.dataset.pressed = "true";
      if (event.code === "KeyH") return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      for (const cap of keycapMap.get(event.code) || []) delete cap.dataset.pressed;
    };
    const clear = () => {
      for (const cap of keycaps) delete cap.dataset.pressed;
    };
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
    <div className="fixed inset-x-0 bottom-0 top-[68px] z-[2147483000] flex items-center justify-center overflow-hidden px-3 pb-3 pt-2 sm:top-[76px] sm:px-5 sm:pb-4 sm:pt-2" role="dialog" aria-modal="true" aria-label="Guía de controles de Archivo Oculto">
      <div aria-hidden="true" className="absolute inset-0 bg-[#080907]/38" />
 
      <div className="relative flex max-h-[calc(100dvh-82px)] w-full max-w-[940px] flex-col overflow-hidden rounded-[10px] border border-[#d0a565]/85 bg-[linear-gradient(145deg,rgba(39,30,21,.985),rgba(12,13,12,.99))] shadow-[0_16px_48px_rgba(0,0,0,.46),inset_0_1px_0_rgba(255,235,198,.12)] sm:max-h-[calc(100dvh-94px)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-[6px] rounded-[7px] border border-[#d1ad76]/20" />
        <header className="relative flex shrink-0 items-center justify-center border-b border-[#b18a55]/65 bg-[linear-gradient(180deg,#49331f_0%,#2a2118_55%,#201a14_100%)] px-5 py-3.5 sm:py-4">
          <span aria-hidden="true" className="absolute left-5 right-5 top-1/2 h-px bg-gradient-to-r from-transparent via-[#c99b58]/75 to-transparent" />
          <span aria-hidden="true" className="absolute left-1/2 top-0 h-[2px] w-28 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#f0cc88] to-transparent" />
          <h2 className="relative border border-[#c49a5c]/80 bg-[linear-gradient(180deg,#5a4026,#2b2016)] px-10 py-1.5 text-[22px] font-black uppercase tracking-[.22em] text-[#fff0d5] shadow-[0_3px_0_#130e09,0_7px_18px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,239,206,.22)] [clip-path:polygon(7%_0,93%_0,100%_50%,93%_100%,7%_100%,0_50%)] sm:text-[26px]">Controles</h2>
          <button type="button" onClick={onClose} className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md border border-[#cba365]/80 bg-[linear-gradient(180deg,#614a2d,#2b2117)] text-xl leading-none text-[#ffebc8] shadow-[0_2px_0_rgba(0,0,0,.65),inset_0_1px_0_rgba(255,255,255,.18)] transition hover:border-[#ffe0a0] hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4bd7b]" aria-label="Cerrar controles">×</button>
        </header>

        <main data-controls-scroll className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-3.5 [scrollbar-color:#9b7546_#17120d] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-[11px] [&::-webkit-scrollbar-track]:bg-[#17120d] [&::-webkit-scrollbar-track]:border-l [&::-webkit-scrollbar-track]:border-[#80603b]/45 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#17120d] [&::-webkit-scrollbar-thumb]:bg-[#98703f] [&::-webkit-scrollbar-thumb]:shadow-[inset_0_0_0_1px_rgba(255,224,173,.25)] [&::-webkit-scrollbar-thumb:hover]:bg-[#c69a5c] sm:p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
              <Section label="Exploración" title="Movimiento" actions={MOVEMENT} />
              <Section label="Investigación" title="Expediente" actions={INVESTIGATION} />
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
              <Section label="Manipulación" title="Libros y objetos" actions={INTERACTION} />
              <Section label="En el juego" title="Sistema" actions={GAME_SYSTEM} />
            </div>
            <div className="lg:col-span-2">
              <PeakOsSection />
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
