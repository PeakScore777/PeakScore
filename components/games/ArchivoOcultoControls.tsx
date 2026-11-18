"use client";

import { useEffect, useState } from "react";

type Props = { onClose: () => void };

type KeyViewProps = {
  label: string;
  codes?: string[];
  pressedCodes: string[];
  wide?: boolean;
  muted?: boolean;
};

type Action = {
  keys: string[];
  codes?: string[];
  title: string;
  detail?: string;
  hold?: boolean;
};

const GROUPS: Array<{
  id: string;
  title: string;
  subtitle: string;
  actions: Action[];
}> = [
  {
    id: "01",
    title: "Biblioteca",
    subtitle: "Explora y manipula los libros",
    actions: [
      { keys: ["W", "A", "S", "D"], codes: ["KeyW", "KeyA", "KeyS", "KeyD"], title: "Moverse por la habitación" },
      { keys: ["R"], codes: ["KeyR"], title: "Recoger el libro que estás mirando", hold: true },
      { keys: ["C"], codes: ["KeyC"], title: "Abrir el libro sobre la mesa", hold: true },
      { keys: ["E"], codes: ["KeyE"], title: "Devolver el libro al estante", hold: true },
      { keys: ["ESC"], codes: ["Escape"], title: "Liberar el cursor" },
      { keys: ["H"], codes: ["KeyH"], title: "Abrir o cerrar este mapa" },
    ],
  },
  {
    id: "02",
    title: "Lectura",
    subtitle: "Acciones disponibles con el libro abierto",
    actions: [
      { keys: ["T"], codes: ["KeyT"], title: "Enfocar y abrir el computador" },
      { keys: ["F"], codes: ["KeyF"], title: "Abrir la mesa de sospechosos" },
      { keys: ["SHIFT"], codes: ["ShiftLeft", "ShiftRight"], title: "Cerrar el libro y devolverlo" },
    ],
  },
  {
    id: "03",
    title: "Sospechosos",
    subtitle: "Navega por las fichas",
    actions: [
      { keys: ["←", "→"], codes: ["ArrowLeft", "ArrowRight"], title: "Cambiar de ficha seleccionada" },
      { keys: ["F"], codes: ["KeyF"], title: "Volver a la lectura" },
      { keys: ["SHIFT"], codes: ["ShiftLeft", "ShiftRight"], title: "Devolver el libro al estante" },
    ],
  },
  {
    id: "04",
    title: "PEAK OS",
    subtitle: "Atajos del sistema operativo",
    actions: [
      { keys: ["ENTER"], codes: ["Enter"], title: "Continuar e iniciar sesión" },
      { keys: ["ESC"], codes: ["Escape"], title: "Cerrar el panel superior o minimizar" },
      { keys: ["CTRL", "ALT", "TAB"], codes: ["ControlLeft", "AltLeft", "Tab"], title: "Cambiar entre ventanas" },
      { keys: ["CTRL", "ALT", "← / →"], codes: ["ControlLeft", "AltLeft", "ArrowLeft", "ArrowRight"], title: "Ajustar ventana a un lado" },
      { keys: ["CTRL", "ALT", "↑"], codes: ["ControlLeft", "AltLeft", "ArrowUp"], title: "Maximizar ventana" },
      { keys: ["CTRL", "ALT", "↓"], codes: ["ControlLeft", "AltLeft", "ArrowDown"], title: "Minimizar ventana" },
      { keys: ["CTRL", "E"], codes: ["ControlLeft", "KeyE"], title: "Abrir Explorador" },
      { keys: ["CTRL", "M"], codes: ["ControlLeft", "KeyM"], title: "Abrir Correo" },
      { keys: ["CTRL", "SHIFT", "M"], codes: ["ControlLeft", "ShiftLeft", "KeyM"], title: "Abrir Mensajería" },
      { keys: ["CTRL", "T"], codes: ["ControlLeft", "KeyT"], title: "Abrir Cronología" },
    ],
  },
];

const KEY_ROWS: Array<Array<{ label: string; codes?: string[]; width?: string; muted?: boolean }>> = [
  [
    { label: "ESC", codes: ["Escape"], width: "w-[8%]" },
    { label: "F1", muted: true }, { label: "F2", muted: true }, { label: "F3", muted: true }, { label: "F4", muted: true },
    { label: "F5", muted: true }, { label: "F6", muted: true }, { label: "F7", muted: true }, { label: "F8", muted: true },
    { label: "F9", muted: true }, { label: "F10", muted: true }, { label: "F11", muted: true }, { label: "F12", muted: true },
  ],
  [
    { label: "TAB", muted: true, width: "w-[8%]" },
    { label: "Q", muted: true }, { label: "W", codes: ["KeyW"] }, { label: "E", codes: ["KeyE"] },
    { label: "R", codes: ["KeyR"] }, { label: "T", codes: ["KeyT"] }, { label: "Y", muted: true },
    { label: "U", muted: true }, { label: "I", muted: true }, { label: "O", muted: true }, { label: "P", muted: true },
    { label: "SUPR", muted: true, width: "w-[8%]" },
  ],
  [
    { label: "BLOQ", muted: true, width: "w-[9%]" },
    { label: "A", codes: ["KeyA"] }, { label: "S", codes: ["KeyS"] }, { label: "D", codes: ["KeyD"] },
    { label: "F", codes: ["KeyF"] }, { label: "G", muted: true }, { label: "H", codes: ["KeyH"] },
    { label: "J", muted: true }, { label: "K", muted: true }, { label: "L", muted: true },
    { label: "Ñ", muted: true }, { label: "ENTER", codes: ["Enter"], width: "w-[10%]" },
  ],
  [
    { label: "SHIFT", codes: ["ShiftLeft", "ShiftRight"], width: "w-[14%]" },
    { label: "Z", muted: true }, { label: "X", muted: true }, { label: "C", codes: ["KeyC"] },
    { label: "V", muted: true }, { label: "B", muted: true }, { label: "N", muted: true },
    { label: "M", muted: true }, { label: "←", codes: ["ArrowLeft"] }, { label: "↓", codes: ["ArrowDown"] },
    { label: "↑", codes: ["ArrowUp"] }, { label: "→", codes: ["ArrowRight"] },
  ],
  [
    { label: "CTRL", codes: ["ControlLeft", "ControlRight"], width: "w-[12%]" },
    { label: "ALT", codes: ["AltLeft", "AltRight"], width: "w-[10%]" },
    { label: "ESPACIO", muted: true, width: "w-[44%]" },
    { label: "ALT", muted: true, width: "w-[10%]" },
    { label: "CTRL", muted: true, width: "w-[12%]" },
  ],
];

function KeyView({ label, codes = [], pressedCodes, wide = false, muted = false }: KeyViewProps) {
  const active = codes.some((code) => pressedCodes.includes(code));
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center justify-center rounded border px-2 font-mono font-bold leading-none transition-colors",
        wide ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs",
        active
          ? "border-[#9bf5ff] bg-[#1c7784] text-white shadow-[0_0_14px_rgba(76,217,233,.4),inset_0_1px_0_rgba(255,255,255,.3)]"
          : muted
            ? "border-[#29444b] bg-[#101d24] text-[#637d83]"
            : "border-[#55dff0]/80 bg-gradient-to-b from-[#18333c] to-[#0c1b22] text-[#c9f8fc] shadow-[0_3px_0_#061016]",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function KeyboardRow({
  keys,
  pressedCodes,
}: {
  keys: Array<{ label: string; codes?: string[]; width?: string; muted?: boolean }>;
  pressedCodes: string[];
}) {
  return (
    <div className="flex w-full gap-1.5 sm:gap-2">
      {keys.map((key, index) => (
        <div key={key.label + index} className={["min-w-0 flex-1", key.width ?? ""].join(" ")}>
          <KeyView label={key.label} codes={key.codes} pressedCodes={pressedCodes} wide={Boolean(key.width)} muted={key.muted} />
        </div>
      ))}
    </div>
  );
}

function ActionRow({ action, pressedCodes }: { action: Action; pressedCodes: string[] }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-[#25414a]/65 py-1.5 last:border-0">
      <span className="min-w-0 text-[11px] leading-snug text-[#d7e8e8] sm:text-xs">{action.title}{action.hold ? <span className="ml-1 text-[9px] text-[#83b7bf]">· mantener</span> : null}</span>
      <span className="flex shrink-0 items-center gap-1">
        {action.keys.map((key, index) => (
          <span key={key + index} className="flex items-center gap-1">
            {index > 0 ? <span className="text-[9px] text-[#5c8a92]">+</span> : null}
            <KeyView label={key} codes={action.codes?.filter((code) => {
              if (key === "SHIFT") return code.startsWith("Shift");
              if (key === "CTRL") return code.startsWith("Control");
              if (key === "ALT") return code.startsWith("Alt");
              if (key === "← / →") return code.startsWith("Arrow");
              if (key === "↑") return code === "ArrowUp";
              if (key === "↓") return code === "ArrowDown";
              if (key === "←" || key === "→") return code === (key === "←" ? "ArrowLeft" : "ArrowRight");
              if (key === "ESC") return code === "Escape";
              if (key === "ENTER") return code === "Enter";
              return code === "Key" + key || code === key;
            })} pressedCodes={pressedCodes} wide />
          </span>
        ))}
      </span>
    </div>
  );
}

export default function ArchivoOcultoControls({ onClose }: Props) {
  const [pressedCodes, setPressedCodes] = useState<string[]>([]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      setPressedCodes((current) => current.includes(event.code) ? current : [...current, event.code]);
    };
    const up = (event: KeyboardEvent) => {
      setPressedCodes((current) => current.filter((code) => code !== event.code));
    };
    const clear = () => setPressedCodes([]);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[180] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#06121a] text-[#e7f8f8]"
      role="dialog"
      aria-modal="true"
      aria-label="Todos los controles de Archivo Oculto"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[.12]"
        style={{
          backgroundImage: "linear-gradient(rgba(85,216,234,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(85,216,234,.22) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#2a7783] bg-[#0b1d27] px-4 py-3 sm:px-7 sm:py-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold tracking-[.24em] text-[#65dbe9] sm:text-[10px]">PEAK SYSTEMS / ARCHIVO CONFIDENCIAL</p>
          <h2 className="mt-1 text-lg font-semibold tracking-wide text-[#f0ffff] sm:text-2xl">Mapa de controles</h2>
          <p className="mt-0.5 text-[10px] text-[#99bdc3] sm:text-xs">Todos los controles del juego, en una sola pantalla</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center border border-[#397e88] bg-[#102c36] text-xl text-[#e4ffff] transition hover:border-[#8ef1fa] hover:bg-[#1b4a55]"
          aria-label="Cerrar controles"
        >
          ×
        </button>
      </header>

      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(500px,.96fr)] lg:overflow-hidden lg:p-5">
        <section className="flex min-h-[330px] flex-col justify-center border border-[#275a64]/80 bg-[#091922]/95 p-3 sm:p-5 lg:min-h-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] tracking-[.2em] text-[#58d4e4]">TECLADO · DISTRIBUCIÓN ESPAÑOLA</p>
              <h3 className="mt-1 text-sm font-semibold tracking-wide text-[#e9ffff] sm:text-base">Teclas utilizadas</h3>
            </div>
            <span className="border border-[#275a64] px-2 py-1 font-mono text-[9px] text-[#8ebdc4]">QWERTY ES</span>
          </div>
          <div className="mx-auto flex w-full max-w-[940px] flex-col gap-2 sm:gap-3">
            {KEY_ROWS.map((keys, index) => <KeyboardRow key={index} keys={keys} pressedCodes={pressedCodes} />)}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#24454e] pt-3">
            <p className="text-[10px] text-[#86aab0] sm:text-xs">Pulsa cualquier tecla para verla iluminarse.</p>
            <div className="flex items-center gap-2 font-mono text-[9px] text-[#80a9b0]">
              <span className="h-2.5 w-2.5 border border-[#9bf5ff] bg-[#1c7784] shadow-[0_0_9px_rgba(76,217,233,.45)]" />
              TECLA ACTIVA
            </div>
          </div>
        </section>

        <section className="grid min-h-[420px] grid-cols-1 gap-3 sm:grid-cols-2 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex min-h-0 flex-col gap-3">
            {GROUPS.slice(0, 2).map((group) => (
              <article key={group.id} className="border border-[#275a64]/80 bg-[#0a1b24]/95 p-3 sm:p-4">
                <div className="mb-2 border-b border-[#2d6973]/75 pb-2">
                  <p className="font-mono text-[9px] tracking-[.18em] text-[#61d9e7]">{group.id} / CONTROLES</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#efffff] sm:text-base">{group.title}</h3>
                  <p className="mt-0.5 text-[10px] text-[#8faeb3]">{group.subtitle}</p>
                </div>
                {group.actions.map((action, index) => <ActionRow key={group.id + index} action={action} pressedCodes={pressedCodes} />)}
              </article>
            ))}
          </div>
          <div className="flex min-h-0 flex-col gap-3">
            {GROUPS.slice(2).map((group) => (
              <article key={group.id} className="border border-[#275a64]/80 bg-[#0a1b24]/95 p-3 sm:p-4">
                <div className="mb-2 border-b border-[#2d6973]/75 pb-2">
                  <p className="font-mono text-[9px] tracking-[.18em] text-[#61d9e7]">{group.id} / CONTROLES</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#efffff] sm:text-base">{group.title}</h3>
                  <p className="mt-0.5 text-[10px] text-[#8faeb3]">{group.subtitle}</p>
                </div>
                {group.actions.map((action, index) => <ActionRow key={group.id + index} action={action} pressedCodes={pressedCodes} />)}
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-[#2a7783] bg-[#0b1d27] px-4 py-2.5 sm:px-7">
        <p className="font-mono text-[9px] tracking-[.12em] text-[#8baeb4]">H / ESC · CERRAR MAPA</p>
        <p className="font-mono text-[9px] tracking-[.12em] text-[#65dbe9]">PEAK SYSTEMS // INPUT MAP</p>
      </footer>
    </div>
  );
}
