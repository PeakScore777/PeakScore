"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { onClose: () => void };
type KeyToken = { label: string; codes: string[] };
type Action = { title: string; bindings: KeyToken[][]; note?: string; separator?: "plus" | "none" };
type KeySpec = { label?: string; codes?: string[]; width?: number; height?: number };
type KeyCap = { x: number; y: number; width: number; height: number; label?: string; codes?: string[] };

const KEY_WIDTH = 40;
const KEY_HEIGHT = 42;
const KEY_GAP = 6;

function makeKeyboardRow(y: number, startX: number, specs: KeySpec[]): KeyCap[] {
  let x = startX;
  return specs.map((spec) => {
    const item: KeyCap = { x, y, width: spec.width ?? KEY_WIDTH, height: spec.height ?? KEY_HEIGHT, label: spec.label, codes: spec.codes };
    x += item.width + KEY_GAP;
    return item;
  });
}

const blank = (width = KEY_WIDTH): KeySpec => ({ width });
const cap = (label: string, width = KEY_WIDTH): KeySpec => ({ label, width });
const letter = (label: string, code: string): KeySpec => ({ label, codes: [code] });

/* Compact physical ISO-ES layout. Cyan caps are the game's real bindings. */
const KEYBOARD: KeyCap[] = [
  // Function row
  { x: 42, y: 72, width: 50, height: 42, label: "ESC", codes: ["Escape"] },
  ...makeKeyboardRow(72, 126, [
    cap("F1", 38), cap("F2", 38), cap("F3", 38), cap("F4", 38), blank(14),
    cap("F5", 38), cap("F6", 38), cap("F7", 38), cap("F8", 38), blank(14),
    cap("F9", 38), cap("F10", 38), cap("F11", 38), cap("F12", 38),
  ]),
  // Spanish number row
  ...makeKeyboardRow(134, 42, [
    cap("º"), cap("1"), cap("2"), cap("3"), cap("4"), cap("5"), cap("6"),
    cap("7"), cap("8"), cap("9"), cap("0"), cap("'"), cap("¡"), cap("⌫", 76),
  ]),
  // Q row
  ...makeKeyboardRow(196, 42, [
    { label: "TAB", codes: ["Tab"], width: 62 },
    cap("Q"), letter("W", "KeyW"), letter("E", "KeyE"), letter("R", "KeyR"),
    letter("T", "KeyT"), cap("Y"), cap("U"), cap("I"), cap("O"), cap("P"),
    cap("´"), cap("+"),
  ]),
  // Home row and vertical ISO Enter
  ...makeKeyboardRow(258, 70, [
    cap("BLOQ", 72), letter("A", "KeyA"), letter("S", "KeyS"), letter("D", "KeyD"),
    letter("F", "KeyF"), cap("G"), letter("H", "KeyH"), cap("J"), cap("K"),
    cap("L"), cap("Ñ"), cap("´"),
  ]),
  { x: 656, y: 196, width: 46, height: 104, label: "ENTER", codes: ["Enter"] },
  // ISO row, including the extra key left of Z
  ...makeKeyboardRow(320, 42, [
    { label: "SHIFT", codes: ["ShiftLeft"], width: 92 }, cap("< >", 30),
    cap("Z"), cap("X"), letter("C", "KeyC"), cap("V"), cap("B"), cap("N"),
    letter("M", "KeyM"), cap(","), cap("."), cap("-"),
    { label: "SHIFT", codes: ["ShiftRight"], width: 82 },
  ]),
  // Bottom modifiers and space bar
  ...makeKeyboardRow(382, 70, [
    { label: "CTRL", codes: ["ControlLeft"], width: 58 },
    cap("WIN", 52),
    { label: "ALT", codes: ["AltLeft"], width: 52 },
    cap("ESPACIO", 246),
    { label: "ALT", codes: ["AltRight"], width: 52 },
    cap("FN", 52),
    { label: "CTRL", codes: ["ControlRight"], width: 58 },
  ]),
  // Independent arrow cluster
  { x: 884, y: 320, width: 42, height: 42, label: "↑", codes: ["ArrowUp"] },
  { x: 838, y: 382, width: 42, height: 42, label: "←", codes: ["ArrowLeft"] },
  { x: 884, y: 382, width: 42, height: 42, label: "↓", codes: ["ArrowDown"] },
  { x: 930, y: 382, width: 42, height: 42, label: "→", codes: ["ArrowRight"] },
];
function letterToken(label: string, code: string): KeyToken {
  return { label, codes: [code] };
}

const EXPLORATION: Action[] = [
  {
    title: "Moverse por la biblioteca",
    bindings: [
      [letterToken("W", "KeyW"), letterToken("A", "KeyA"), letterToken("S", "KeyS"), letterToken("D", "KeyD")],
      [letterToken("↑", "ArrowUp"), letterToken("←", "ArrowLeft"), letterToken("↓", "ArrowDown"), letterToken("→", "ArrowRight")],
    ],
    separator: "none",
    note: "WASD o flechas",
  },
  { title: "Recoger el libro", bindings: [[letterToken("R", "KeyR")]], note: "Mantener" },
  { title: "Abrir el libro en la mesa", bindings: [[letterToken("C", "KeyC")]], note: "Mantener" },
  { title: "Devolverlo al estante", bindings: [[letterToken("E", "KeyE")]], note: "Mantener" },
  { title: "Soltar la cámara / cursor", bindings: [[letterToken("ESC", "Escape")]] },
  { title: "Mostrar u ocultar este mapa", bindings: [[letterToken("H", "KeyH")]] },
];

const READING: Action[] = [
  { title: "Abrir el computador", bindings: [[letterToken("T", "KeyT")]] },
  { title: "Abrir / cerrar inspección de sospechosos", bindings: [[letterToken("F", "KeyF")]] },
  { title: "Cambiar de sospechoso", bindings: [[letterToken("←", "ArrowLeft")], [letterToken("→", "ArrowRight")]] },
  { title: "Cerrar expediente y devolver el libro", bindings: [[letterToken("SHIFT", "ShiftLeft")]] },
];

const PEAK_OS: Action[] = [
  { title: "Continuar / iniciar sesión", bindings: [[letterToken("ENTER", "Enter")]] },
  { title: "Retroceder / cerrar ventana activa", bindings: [[letterToken("ESC", "Escape")]] },
  { title: "Cambiar entre ventanas", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("ALT", "AltLeft"), letterToken("TAB", "Tab")]] },
  { title: "Ajustar ventana a un lado", bindings: [
    [letterToken("CTRL", "ControlLeft"), letterToken("ALT", "AltLeft"), letterToken("←", "ArrowLeft")],
    [letterToken("CTRL", "ControlLeft"), letterToken("ALT", "AltLeft"), letterToken("→", "ArrowRight")],
  ] },
  { title: "Maximizar ventana", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("ALT", "AltLeft"), letterToken("↑", "ArrowUp")]] },
  { title: "Minimizar ventana", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("ALT", "AltLeft"), letterToken("↓", "ArrowDown")]] },
  { title: "Abrir Explorador", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("E", "KeyE")]] },
  { title: "Abrir Correo", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("M", "KeyM")]] },
  { title: "Abrir Mensajería", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("SHIFT", "ShiftLeft"), letterToken("M", "KeyM")]] },
  { title: "Abrir Cronología", bindings: [[letterToken("CTRL", "ControlLeft"), letterToken("T", "KeyT")]] },
];

function PhysicalKey({ keyCap, pressedCodes }: { keyCap: KeyCap; pressedCodes: string[] }) {
  const assigned = Boolean(keyCap.codes?.length);
  const active = Boolean(keyCap.codes?.some((code) => pressedCodes.includes(code)));
  return (
    <g>
      <rect x={keyCap.x} y={keyCap.y + 5} width={keyCap.width} height={keyCap.height} rx="5" fill="#02080c" opacity=".95" />
      <rect
        x={keyCap.x} y={keyCap.y} width={keyCap.width} height={keyCap.height} rx="5"
        fill={active ? "url(#peak-key-pressed)" : assigned ? "url(#peak-key-assigned)" : "url(#peak-key-idle)"}
        stroke={active ? "#b9fbff" : assigned ? "#59d8e8" : "#294149"}
        strokeWidth={active ? 2 : assigned ? 1.35 : 1}
        filter={active ? "url(#peak-key-active-glow)" : undefined}
      />
      <path
        d={"M " + (keyCap.x + 5) + " " + (keyCap.y + 2) + " H " + (keyCap.x + keyCap.width - 5)}
        stroke={active ? "#e6ffff" : assigned ? "#9cecf4" : "#536a70"}
        strokeOpacity={active ? ".8" : assigned ? ".36" : ".2"}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {keyCap.label ? (
        <text
          x={keyCap.x + keyCap.width / 2}
          y={keyCap.y + keyCap.height / 2 + 4}
          textAnchor="middle"
          fill={active ? "#ffffff" : assigned ? "#d7fbff" : "#71858a"}
          fontSize={keyCap.width > 75 ? 11 : keyCap.width < 37 ? 9 : 12}
          fontWeight={assigned ? "700" : "500"}
          opacity={assigned ? 1 : .58}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          letterSpacing={keyCap.width > 75 ? ".3" : "0"}
        >
          {keyCap.label}
        </text>
      ) : null}
    </g>
  );
}

function KeyboardDiagram({ pressedCodes }: { pressedCodes: string[] }) {
  return (
    <svg viewBox="0 0 1024 500" className="block h-auto w-full" role="img" aria-label="Teclado físico compacto español ISO; las teclas activas aparecen resaltadas">
      <defs>
        <linearGradient id="peak-keyboard-case" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#202c31" /><stop offset="45%" stopColor="#111b20" /><stop offset="100%" stopColor="#080e12" />
        </linearGradient>
        <linearGradient id="peak-key-idle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#18272d" /><stop offset="100%" stopColor="#0c171c" />
        </linearGradient>
        <linearGradient id="peak-key-assigned" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#20515a" /><stop offset="100%" stopColor="#102b33" />
        </linearGradient>
        <linearGradient id="peak-key-pressed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60dbe8" /><stop offset="100%" stopColor="#126a78" />
        </linearGradient>
        <filter id="peak-key-active-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="peak-keyboard-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000000" floodOpacity=".48" />
        </filter>
      </defs>
      <rect x="12" y="10" width="1000" height="480" rx="18" fill="url(#peak-keyboard-case)" stroke="#48616a" strokeWidth="1.5" filter="url(#peak-keyboard-shadow)" />
      <rect x="20" y="18" width="984" height="464" rx="12" fill="none" stroke="#02080b" strokeWidth="2" />
      <text x="38" y="30" fill="#63dce9" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="2">PEAK INPUT / ISO-ES 65%</text>
      <text x="990" y="30" textAnchor="end" fill="#78949b" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="1.2">TECLAS ASIGNADAS</text>
      {KEYBOARD.map((key, index) => <PhysicalKey key={index} keyCap={key} pressedCodes={pressedCodes} />)}
      <circle cx="27" cy="384" r="2.2" fill="#78949b" opacity=".6" />
      <circle cx="997" cy="384" r="2.2" fill="#78949b" opacity=".6" />
    </svg>
  );
}

function BindingKey({ token, pressedCodes }: { token: KeyToken; pressedCodes: string[] }) {
  const active = token.codes.some((code) => pressedCodes.includes(code));
  return (
    <kbd className={[
      "inline-flex min-h-[27px] min-w-[27px] items-center justify-center rounded-[4px] border px-2",
      "font-mono text-[10px] font-bold leading-none shadow-[0_2px_0_rgba(0,0,0,.45)] transition-colors",
      active ? "border-[#b8fbff] bg-[#238a98] text-white shadow-[0_0_10px_rgba(78,221,237,.32)]" : "border-[#4e9ca7] bg-gradient-to-b from-[#1b3d47] to-[#0e252d] text-[#d5faff]",
    ].join(" ")}>
      {token.label}
    </kbd>
  );
}

function Binding({ groups, pressedCodes, separator = "plus" }: { groups: KeyToken[][]; pressedCodes: string[]; separator?: "plus" | "none" }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {groups.map((group, groupIndex) => (
        <span key={groupIndex} className="flex items-center gap-1">
          {groupIndex > 0 ? <span className="px-0.5 text-[9px] font-semibold text-[#769ca3]">o</span> : null}
          {group.map((token, tokenIndex) => (
            <span key={tokenIndex} className="flex items-center gap-1">
              {tokenIndex > 0 && separator === "plus" ? <span className="text-[9px] text-[#70929a]">+</span> : null}
              <BindingKey token={token} pressedCodes={pressedCodes} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function ActionRow({ action, pressedCodes }: { action: Action; pressedCodes: string[] }) {
  return (
    <div className="flex min-h-[34px] items-center justify-between gap-2 border-b border-[#29434a]/70 py-1.5 last:border-0">
      <span className="min-w-0 text-[11px] leading-snug text-[#e0eeee] sm:text-xs">
        {action.title}
        {action.note ? <span className="ml-1 whitespace-nowrap font-mono text-[9px] text-[#72d6e2]">· {action.note}</span> : null}
      </span>
      <Binding groups={action.bindings} pressedCodes={pressedCodes} separator={action.separator} />
    </div>
  );
}

function GroupCard({
  index, title, subtitle, actions, pressedCodes, className = "", columns = 1,
}: {
  index: string; title: string; subtitle: string; actions: Action[]; pressedCodes: string[];
  className?: string; columns?: 1 | 2;
}) {
  return (
    <article className={"min-w-0 border border-[#285d67]/85 bg-[#0b1b23]/95 p-3 sm:p-4 " + className}>
      <header className="mb-2.5 border-b border-[#327782]/65 pb-2">
        <p className="font-mono text-[9px] font-bold tracking-[.18em] text-[#66dbe8]">{index} / CONTROLES</p>
        <h3 className="mt-1 text-sm font-bold tracking-wide text-[#efffff] sm:text-base">{title}</h3>
        <p className="mt-0.5 text-[10px] text-[#96b1b6]">{subtitle}</p>
      </header>
      <div className={columns === 2 ? "grid grid-cols-1 gap-x-5 sm:grid-cols-2" : "flex flex-col"}>
        {actions.map((action, actionIndex) => <ActionRow key={index + "-" + actionIndex} action={action} pressedCodes={pressedCodes} />)}
      </div>
    </article>
  );
}

export default function ArchivoOcultoControls({ onClose }: Props) {
  const [pressedCodes, setPressedCodes] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setPressedCodes((current) => current.includes(event.code) ? current : [...current, event.code]);
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
    const onKeyUp = (event: KeyboardEvent) => setPressedCodes((current) => current.filter((code) => code !== event.code));
    const clear = () => setPressedCodes([]);
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
    <div className="fixed inset-0 z-[2147483000] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#07121a] text-[#e8f5f5]"
      role="dialog" aria-modal="true" aria-label="Controles de Archivo Oculto y PEAK OS">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.11]"
        style={{
          backgroundImage: "linear-gradient(rgba(79,190,204,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(79,190,204,.2) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }} />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-[#2e7883] bg-[#0a1b24] px-4 py-3 sm:px-7 sm:py-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-[.24em] text-[#68dce9] sm:text-[10px]">PEAK SYSTEMS / ARCHIVO CONFIDENCIAL</p>
          <h2 className="mt-1 text-lg font-bold tracking-wide text-[#f0ffff] sm:text-2xl">Controles del juego</h2>
          <p className="mt-0.5 text-[10px] text-[#a2bdc2] sm:text-xs">Teclas asignadas en su posición real · teclado español ISO</p>
        </div>
        <button type="button" onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded border border-[#4d8790] bg-[#102c35] text-xl text-[#e5ffff] transition hover:border-[#9cf4fb] hover:bg-[#1a4a55]"
          aria-label="Cerrar controles">×</button>
      </header>

      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(500px,.92fr)] lg:overflow-hidden lg:p-5">
        <section className="flex min-h-[390px] flex-col justify-center border border-[#285d67]/85 bg-[#091820]/95 p-3 sm:p-4 lg:min-h-0 lg:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[9px] font-bold tracking-[.18em] text-[#66dbe8]">TECLADO COMPACTO / ISO-ES</p>
              <h3 className="mt-1 text-sm font-bold text-[#efffff] sm:text-base">Distribución física ISO-ES</h3>
            </div>
            <span className="border border-[#315963] bg-[#0c2028] px-2.5 py-1.5 font-mono text-[9px] text-[#a2c0c6]">QWERTY · Ñ</span>
          </div>
          <div className="mx-auto w-full max-w-[1020px]">
            <KeyboardDiagram pressedCodes={pressedCodes} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#24454e] pt-3">
            <p className="text-[10px] text-[#92b1b7] sm:text-xs">Las teclas iluminadas son las asignadas al juego; las demás son parte del teclado físico.</p>
            <div className="flex items-center gap-2 font-mono text-[9px] text-[#8fb9c0]">
              <span className="h-3 w-3 rounded-[3px] border border-[#7ce5ef] bg-[#20515a]" /> ASIGNADA
              <span className="ml-2 h-3 w-3 rounded-[3px] border border-[#294149] bg-[#101d24]" /> SIN ACCIÓN
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col justify-between gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <GroupCard index="01" title="Exploración" subtitle="Moverse y manipular libros" actions={EXPLORATION} pressedCodes={pressedCodes} />
            <GroupCard index="02" title="Libro e inspección" subtitle="Computador y sospechosos" actions={READING} pressedCodes={pressedCodes} />
          </div>
          <GroupCard index="03" title="PEAK OS" subtitle="Atajos del sistema operativo" actions={PEAK_OS} pressedCodes={pressedCodes} columns={2} />
        </section>
      </main>

      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-[#2e7883] bg-[#0a1b24] px-4 py-2.5 sm:px-7">
        <p className="font-mono text-[9px] tracking-[.12em] text-[#9ab7bc]">H / ESC · CERRAR MAPA</p>
        <p className="font-mono text-[9px] tracking-[.12em] text-[#68dce9]">PEAK SYSTEMS // INPUT MAP</p>
      </footer>
    </div>,
    document.body
  );
}
