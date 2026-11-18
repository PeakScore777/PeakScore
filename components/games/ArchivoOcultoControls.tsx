"use client";

import { useEffect, useState } from "react";

export type ArchivoControlMode = "library" | "reading" | "suspects" | "computer";
type Props = { initialMode: ArchivoControlMode; onClose: () => void };
type KeyCap = { code: string; label: string; x: number; y: number; w: number; secondary?: string };
type Action = { title: string; detail: string; keyLabel: string; codes: string[]; side: "left" | "right"; y: number };

const KEY_H = 39;

function row(y: number, x: number, specs: Array<{code:string;label:string;w?:number;secondary?:string}>, gap=6): KeyCap[] {
  return specs.map((spec) => {
    const item = { code: spec.code, label: spec.label, x, y, w: spec.w ?? 47, secondary: spec.secondary };
    x += item.w + gap;
    return item;
  });
}

const KEYBOARD: KeyCap[] = [
  ...row(178,265,[
    {code:"Escape",label:"ESC",w:61},
    {code:"F1",label:"F1",w:43},{code:"F2",label:"F2",w:43},{code:"F3",label:"F3",w:43},{code:"F4",label:"F4",w:43},
    {code:"F5",label:"F5",w:43},{code:"F6",label:"F6",w:43},{code:"F7",label:"F7",w:43},{code:"F8",label:"F8",w:43},
    {code:"F9",label:"F9",w:43},{code:"F10",label:"F10",w:43},{code:"F11",label:"F11",w:43},{code:"F12",label:"F12",w:43},
    {code:"Delete",label:"SUPR",w:61}
  ],7),
  ...row(226,265,[
    {code:"Backquote",label:"º"},{code:"Digit1",label:"1",secondary:"!"},{code:"Digit2",label:"2",secondary:'"'},
    {code:"Digit3",label:"3",secondary:"·"},{code:"Digit4",label:"4",secondary:"$"},{code:"Digit5",label:"5",secondary:"%"},
    {code:"Digit6",label:"6",secondary:"&"},{code:"Digit7",label:"7",secondary:"/"},{code:"Digit8",label:"8",secondary:"("},
    {code:"Digit9",label:"9",secondary:")"},{code:"Digit0",label:"0",secondary:"="},{code:"Minus",label:"'"},
    {code:"Equal",label:"¡"},{code:"Backspace",label:"RETRO",w:74}
  ]),
  ...row(274,265,[
    {code:"Tab",label:"TAB",w:72},{code:"KeyQ",label:"Q"},{code:"KeyW",label:"W"},{code:"KeyE",label:"E"},
    {code:"KeyR",label:"R"},{code:"KeyT",label:"T"},{code:"KeyY",label:"Y"},{code:"KeyU",label:"U"},
    {code:"KeyI",label:"I"},{code:"KeyO",label:"O"},{code:"KeyP",label:"P"},{code:"BracketLeft",label:"+"},
    {code:"BracketRight",label:"*"}
  ]),
  ...row(322,285,[
    {code:"CapsLock",label:"BLOQ MAYÚS",w:88},{code:"KeyA",label:"A"},{code:"KeyS",label:"S"},{code:"KeyD",label:"D"},
    {code:"KeyF",label:"F"},{code:"KeyG",label:"G"},{code:"KeyH",label:"H"},{code:"KeyJ",label:"J"},
    {code:"KeyK",label:"K"},{code:"KeyL",label:"L"},{code:"Semicolon",label:"Ñ"},{code:"Quote",label:"´"},
    {code:"Enter",label:"ENTER",w:81}
  ]),
  ...row(370,265,[
    {code:"ShiftLeft",label:"SHIFT",w:107},{code:"IntlBackslash",label:"<"},{code:"KeyZ",label:"Z"},
    {code:"KeyX",label:"X"},{code:"KeyC",label:"C"},{code:"KeyV",label:"V"},{code:"KeyB",label:"B"},
    {code:"KeyN",label:"N"},{code:"KeyM",label:"M"},{code:"Comma",label:","},{code:"Period",label:"."},
    {code:"Slash",label:"-"},{code:"ShiftRight",label:"SHIFT",w:102}
  ]),
  ...row(418,340,[
    {code:"ControlLeft",label:"CTRL",w:74},{code:"MetaLeft",label:"WIN",w:58},{code:"AltLeft",label:"ALT",w:67},
    {code:"Space",label:"ESPACIO",w:324},{code:"AltRight",label:"ALT",w:67},{code:"ContextMenu",label:"MENÚ",w:58},
    {code:"ControlRight",label:"CTRL",w:74}
  ]),
  ...row(466,981,[
    {code:"ArrowLeft",label:"←",w:48},{code:"ArrowDown",label:"↓",w:48},{code:"ArrowUp",label:"↑",w:48},{code:"ArrowRight",label:"→",w:48}
  ],5)
];
const KEY_BY_CODE = new Map(KEYBOARD.map((key)=>[key.code,key]));
const MODES:Array<{id:ArchivoControlMode;label:string;index:string}>=[
  {id:"library",label:"Biblioteca",index:"01"},{id:"reading",label:"Lectura",index:"02"},
  {id:"suspects",label:"Sospechosos",index:"03"},{id:"computer",label:"PEAK OS",index:"04"}
];
const ACTIONS:Record<ArchivoControlMode,Action[]>={
  library:[
    {title:"DESPLAZAMIENTO",detail:"Moverse por la biblioteca",keyLabel:"W A S D",codes:["KeyW","KeyA","KeyS","KeyD"],side:"left",y:232},
    {title:"LIBERAR CURSOR",detail:"Soltar la cámara",keyLabel:"ESC",codes:["Escape"],side:"left",y:356},
    {title:"MANUAL DE CONTROLES",detail:"Mostrar u ocultar esta pantalla",keyLabel:"H",codes:["KeyH"],side:"left",y:480},
    {title:"RECOGER LIBRO",detail:"Mantener mientras apuntas al lomo",keyLabel:"R · MANTENER",codes:["KeyR"],side:"right",y:232},
    {title:"ABRIR LIBRO",detail:"Mantener con el libro sobre la mesa",keyLabel:"C · MANTENER",codes:["KeyC"],side:"right",y:356},
    {title:"DEVOLVER AL ESTANTE",detail:"Con el libro en las manos o en la mesa",keyLabel:"E · MANTENER",codes:["KeyE"],side:"right",y:480}
  ],
  reading:[
    {title:"COMPUTADOR",detail:"Enfocar el CRT y abrir el acceso",keyLabel:"T",codes:["KeyT"],side:"left",y:260},
    {title:"INSPECCIONAR SOSPECHOSOS",detail:"Abrir la mesa de fotografías",keyLabel:"F",codes:["KeyF"],side:"left",y:398},
    {title:"MANUAL DE CONTROLES",detail:"Mostrar u ocultar esta pantalla",keyLabel:"H",codes:["KeyH"],side:"right",y:260},
    {title:"DEVOLVER LIBRO",detail:"Cerrar la lectura y volver al estante",keyLabel:"SHIFT",codes:["ShiftLeft","ShiftRight"],side:"right",y:398}
  ],
  suspects:[
    {title:"VOLVER A LA LECTURA",detail:"Cerrar la mesa de sospechosos",keyLabel:"F",codes:["KeyF"],side:"left",y:260},
    {title:"DEVOLVER LIBRO",detail:"Cerrar el caso y volver al estante",keyLabel:"SHIFT",codes:["ShiftLeft","ShiftRight"],side:"left",y:398},
    {title:"CAMBIAR FICHA",detail:"Anterior / siguiente sospechoso seleccionado",keyLabel:"←  →",codes:["ArrowLeft","ArrowRight"],side:"right",y:260},
    {title:"MANUAL DE CONTROLES",detail:"Mostrar u ocultar esta pantalla",keyLabel:"H",codes:["KeyH"],side:"right",y:398}
  ],
  computer:[
    {title:"CONTINUAR / INICIAR SESIÓN",detail:"Avanzar desde bloqueo y acceso",keyLabel:"ENTER",codes:["Enter"],side:"left",y:232},
    {title:"CAMBIAR VENTANA",detail:"Alternar entre aplicaciones",keyLabel:"CTRL + ALT + TAB",codes:["ControlLeft","AltLeft","Tab"],side:"left",y:356},
    {title:"ABRIR EXPLORADOR",detail:"Acceso directo de PEAK OS",keyLabel:"CTRL + E",codes:["ControlLeft","KeyE"],side:"left",y:480},
    {title:"VOLVER / MINIMIZAR",detail:"Cerrar el panel superior o minimizar",keyLabel:"ESC",codes:["Escape"],side:"right",y:232},
    {title:"ABRIR CORREO",detail:"Acceso directo de PEAK OS",keyLabel:"CTRL + M",codes:["ControlLeft","KeyM"],side:"right",y:330},
    {title:"ABRIR MENSAJERÍA",detail:"Acceso directo de PEAK OS",keyLabel:"CTRL + SHIFT + M",codes:["ControlLeft","ShiftLeft","KeyM"],side:"right",y:420},
    {title:"ABRIR CRONOLOGÍA",detail:"Acceso directo de PEAK OS",keyLabel:"CTRL + T",codes:["ControlLeft","KeyT"],side:"right",y:500}
  ]
};
const META:Record<ArchivoControlMode,{eyebrow:string;title:string;description:string}>={
  library:{eyebrow:"ARCHIVO OCULTO / EXPLORACIÓN",title:"Controles de biblioteca",description:"Movimiento, cámara y manipulación de libros."},
  reading:{eyebrow:"ARCHIVO OCULTO / LECTURA",title:"Controles de lectura",description:"Accesos a sospechosos, computador y salida del expediente."},
  suspects:{eyebrow:"ARCHIVO OCULTO / INSPECCIÓN",title:"Controles de sospechosos",description:"Navega por las fichas y vuelve a la investigación."},
  computer:{eyebrow:"PEAK SYSTEMS / ESTACIÓN LOCAL",title:"Controles de PEAK OS",description:"Accesos rápidos del escritorio y sus ventanas."}
};

function keyPoint(codes:string[]){
  const keys=codes.map((code)=>KEY_BY_CODE.get(code)).filter((key):key is KeyCap=>Boolean(key));
  if(!keys.length)return{x:720,y:315};
  return{
    x:keys.reduce((sum,key)=>sum+key.x+key.w/2,0)/keys.length,
    y:keys.reduce((sum,key)=>sum+key.y+KEY_H/2,0)/keys.length
  };
}

export default function ArchivoOcultoControls({initialMode,onClose}:Props){
  const [mode,setMode]=useState<ArchivoControlMode>(initialMode);
  const [pressedCodes,setPressedCodes]=useState<string[]>([]);
  const [pressedMouse,setPressedMouse]=useState<"left"|"right"|"middle"|null>(null);
  useEffect(()=>{
    const down=(event:KeyboardEvent)=>setPressedCodes(current=>current.includes(event.code)?current:[...current,event.code]);
    const up=(event:KeyboardEvent)=>setPressedCodes(current=>current.filter(code=>code!==event.code));
    const clear=()=>{setPressedCodes([]);setPressedMouse(null);};
    const mouseDown=(event:MouseEvent)=>setPressedMouse(event.button===0?"left":event.button===2?"right":"middle");
    const mouseUp=()=>setPressedMouse(null);
    window.addEventListener("keydown",down);
    window.addEventListener("keyup",up);
    window.addEventListener("blur",clear);
    window.addEventListener("mousedown",mouseDown);
    window.addEventListener("mouseup",mouseUp);
    return()=>{
      window.removeEventListener("keydown",down);
      window.removeEventListener("keyup",up);
      window.removeEventListener("blur",clear);
      window.removeEventListener("mousedown",mouseDown);
      window.removeEventListener("mouseup",mouseUp);
    };
  },[]);
  useEffect(()=>{
    const closeOnEscape=(event:KeyboardEvent)=>{
      if(event.code==="Escape"){event.preventDefault();event.stopImmediatePropagation();onClose();}
    };
    window.addEventListener("keydown",closeOnEscape,true);
    return()=>window.removeEventListener("keydown",closeOnEscape,true);
  },[onClose]);

  const actions=ACTIONS[mode];
  const mouseActions: Array<{ title: string; detail: string; part: "move" | "left" | "wheel"; side: "left" | "right"; y: number }> =
    mode === "library"
      ? [{ title: "MIRAR ALREDEDOR", detail: "Mover el mouse para girar la cámara", part: "move", side: "left", y: 630 }]
      : mode === "computer"
        ? [
            { title: "SELECCIONAR", detail: "Clic izquierdo para abrir y elegir", part: "left", side: "left", y: 620 },
            { title: "DESPLAZAR", detail: "Usar la rueda para recorrer documentos", part: "wheel", side: "right", y: 620 },
          ]
        : [{ title: mode === "suspects" ? "ABRIR FICHA" : "INTERACTUAR", detail: mode === "suspects" ? "Clic izquierdo sobre una fotografía" : "Seleccionar respuestas y botones del libro", part: "left", side: "left", y: 630 }];

  return(
    <div className="fixed inset-0 z-[180] flex items-center justify-center overflow-hidden bg-[#050c13]/[.97] px-3 py-3 text-[#e0faff] sm:px-6 sm:py-5"
      role="dialog" aria-modal="true" aria-label="Mapa visual de controles"
      onPointerDown={event=>event.stopPropagation()}
      onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
      <div className="relative flex h-full w-full max-w-[1680px] flex-col overflow-hidden border border-[#51d8ea]/60 bg-[#08141e] shadow-[0_28px_100px_rgba(0,0,0,.8)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.16]" style={{backgroundImage:"linear-gradient(rgba(197,165,108,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(197,165,108,.16) 1px, transparent 1px)",backgroundSize:"32px 32px"}}/>
        <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#2b7883]/50 bg-[#0d1922] px-4 py-3 sm:px-7 sm:py-4">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold tracking-[.25em] text-[#87ecf5] sm:text-[10px]">PEAK SYSTEMS / ARCHIVO CONFIDENCIAL</p>
            <h2 className="mt-1 font-serif text-xl font-bold tracking-wide text-[#e9fdff] sm:text-2xl">{META[mode].title}</h2>
            <p className="mt-1 text-[11px] text-[#9fbfc5] sm:text-xs">{META[mode].description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden border border-[#2b7883]/50 px-3 py-2 font-mono text-[9px] tracking-[.16em] text-[#a9987c] md:inline">MANUAL DE CAMPO · 01</span>
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center border border-[#51d8ea]/70 bg-[#132731] text-xl text-[#e7d9bd] transition hover:bg-[#1d4651] hover:text-white" aria-label="Cerrar controles">×</button>
          </div>
        </header>
        <nav aria-label="Secciones de controles" className="relative z-10 flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[#2b7883]/35 bg-[#111e28] px-3 py-2 sm:justify-center sm:gap-2">
          {MODES.map(item=><button key={item.id} type="button" onClick={()=>setMode(item.id)} aria-pressed={mode===item.id}
            className={"flex shrink-0 items-center gap-2 border px-3 py-2 text-[10px] font-semibold tracking-wide transition sm:px-5 sm:text-xs "+(mode===item.id?"border-[#62dce9] bg-[#12313a] text-[#fff0d4]":"border-[#27535b] bg-[#1a1b15] text-[#b8ad98] hover:border-[#53d7e6] hover:text-[#f0e3ca]")}>
            <span className="font-mono text-[9px] text-[#8debf5]">{item.index}</span>{item.label}
          </button>)}
        </nav>
        <div className="relative min-h-0 flex-1">
          <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Teclado y mouse con sus controles">
            <defs>
              <linearGradient id="peak-key-face" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#12232c"/><stop offset="100%" stopColor="#0b151d"/></linearGradient>
              <linearGradient id="peak-key-active" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2a7c88"/><stop offset="100%" stopColor="#17525c"/></linearGradient>
              <filter id="peak-key-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect x="245" y="145" width="950" height="365" rx="13" fill="#0c100d" stroke="#4ed8e8" strokeWidth="1.3"/>
            <rect x="253" y="153" width="934" height="349" rx="9" fill="none" stroke="#6a5a3d" strokeOpacity=".42"/>
            {actions.map((action,index)=>{
              const point=keyPoint(action.codes);
              const endX=action.side==="left"?245:1195;
              const labelX=action.side==="left"?230:1215;
              const anchor=action.side==="left"?"end":"start";
              return <g key={mode+"-line-"+index} pointerEvents="none">
                <path d={"M "+point.x+" "+point.y+" L "+endX+" "+action.y} fill="none" stroke="#4cd9e9" strokeWidth="1.25" strokeOpacity=".82"/>
                <circle cx={point.x} cy={point.y} r="3.2" fill="#a0f5ff"/><circle cx={endX} cy={action.y} r="4.2" fill="#55dff0"/>
                <text x={labelX} y={action.y-5} textAnchor={anchor} fill="#e4fbff" fontSize="16" fontWeight="700" letterSpacing="1">{action.title}</text>
                <text x={labelX} y={action.y+14} textAnchor={anchor} fill="#93b6bc" fontSize="12">{action.detail}</text>
                <text x={labelX} y={action.y+30} textAnchor={anchor} fill="#55dff0" fontSize="12" fontFamily="monospace">{action.keyLabel}</text>
              </g>;
            })}
            {KEYBOARD.map(key=>{
              const active=pressedCodes.includes(key.code);
              return <g key={key.code}>
                <rect x={key.x} y={key.y} width={key.w} height={KEY_H} rx="6" fill={active?"url(#peak-key-active)":"url(#peak-key-face)"} stroke={active?"#a6f7ff":"#3c9ba8"} strokeWidth={active?2:1} filter={active?"url(#peak-key-glow)":undefined}/>
                {key.secondary&&<text x={key.x+key.w/2} y={key.y+13} textAnchor="middle" fill="#9abec4" fontSize="10">{key.secondary}</text>}
                <text x={key.x+key.w/2} y={key.y+(key.secondary?29:24)} textAnchor="middle" fill={active?"#f4feff":"#d7f9fc"} fontSize={key.w>90?13:key.w<45?11:13} fontWeight={active?800:500} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">{key.label}</text>
              </g>;
            })}
            <g>
              <rect x="670" y="555" width="100" height="130" rx="44" fill="#101821" stroke="#55dff0" strokeWidth="2"/>
              <path d="M720 557 V594 M670 596 Q720 614 770 596" fill="none" stroke="#55dff0" strokeOpacity=".8" strokeWidth="1.2"/>
              <rect x="712" y="578" width="16" height="30" rx="8" fill={pressedMouse==="middle"?"#9cf5ff":"#14232c"} stroke="#8debf5" strokeWidth="1.2"/>
              <path d="M720 584 V598" stroke="#9cf5ff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M672 560 Q694 549 718 560 L718 594 Q695 600 672 594 Z" fill={pressedMouse==="left"?"#4d9ca8":"#17242b"} stroke="#55dff0" strokeOpacity=".65"/>
              <path d="M722 560 Q746 549 768 560 L768 594 Q745 600 722 594 Z" fill={pressedMouse==="right"?"#4d9ca8":"#17242b"} stroke="#55dff0" strokeOpacity=".65"/>
              <text x="720" y="707" textAnchor="middle" fill="#7ca8b0" fontSize="10" letterSpacing="1.7">MOUSE</text>
            </g>
            {mouseActions.map((action,index)=>{
              const point = action.part === "move"
                ? {x:720,y:620}
                : action.part === "left"
                  ? {x:694,y:575}
                  : {x:720,y:592};
              const endX = action.side === "left" ? 500 : 940;
              const labelX = action.side === "left" ? 480 : 960;
              const anchor = action.side === "left" ? "end" : "start";
              return <g key={"mouse-action-"+index} pointerEvents="none">
                <path d={"M "+point.x+" "+point.y+" L "+endX+" "+(action.y+2)} fill="none" stroke="#55dff0" strokeWidth="1.15" strokeOpacity=".72"/>
                <circle cx={point.x} cy={point.y} r="3" fill="#9cf5ff"/>
                <circle cx={endX} cy={action.y+2} r="4" fill="#55dff0"/>
                <text x={labelX} y={action.y-5} textAnchor={anchor} fill="#e4fbff" fontSize="15" fontWeight="700">{action.title}</text>
                <text x={labelX} y={action.y+14} textAnchor={anchor} fill="#93b6bc" fontSize="12">{action.detail}</text>
              </g>;
            })}
          </svg>
        </div>
        <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#2b7883]/45 bg-[#0b151d] px-4 py-2.5 sm:px-7">
          <p className="font-mono text-[9px] tracking-[.12em] text-[#93b7be]">LAS TECLAS SE ILUMINAN AL PULSARLAS · H / ESC PARA CERRAR</p>
          <p className="font-mono text-[9px] tracking-[.12em] text-[#8debf5]">PEAK SYSTEMS // INPUT MAP</p>
        </footer>
      </div>
    </div>
  );
}
