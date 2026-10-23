"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Clock3, Lightbulb, RotateCcw, Sparkles, Trophy, XCircle } from "lucide-react";

type Subject = "Matemáticas" | "Química" | "Física" | "Biología" | "Historia" | "Inglés";
type Question = { id: string; subject: Subject; topic: string; clue: string; options: string[]; answer: number; explanation: string; hint: string };

const QUESTION_BANK: Question[] = [
  { id:"m1",subject:"Matemáticas",topic:"Porcentajes",clue:"En una tienda, una mochila cuesta $80.000 y tiene un descuento del 25 %. ¿Qué operación permite calcular el descuento?",options:["80.000 ÷ 25","80.000 × 0,25","80.000 + 0,25","25 ÷ 0,25"],answer:1,explanation:"El 25 % equivale a 0,25. Multiplicar 80.000 por 0,25 da un descuento de $20.000; el precio final sería $60.000.",hint:"Convierte el porcentaje en un número decimal antes de operar."},
  { id:"m2",subject:"Matemáticas",topic:"Ecuaciones básicas",clue:"Un número multiplicado por 3 y luego aumentado en 4 da 19. ¿Qué número es?",options:["3","4","5","7"],answer:2,explanation:"La situación se representa con 3x + 4 = 19. Restamos 4: 3x = 15. Dividimos entre 3: x = 5.",hint:"Deshaz las operaciones en orden inverso: primero resta 4 y luego divide entre 3."},
  { id:"m3",subject:"Matemáticas",topic:"Medidas de tendencia central",clue:"Las notas de cuatro actividades son 3, 4, 4 y 5. ¿Cuál es la mediana?",options:["3","3,5","4","4,5"],answer:2,explanation:"Los datos ya están ordenados. Como hay cuatro valores, la mediana es el promedio de los dos centrales: (4 + 4) / 2 = 4.",hint:"Con una cantidad par de datos, promedia los dos valores del centro."},
  { id:"m4",subject:"Matemáticas",topic:"Plano cartesiano",clue:"Un punto se ubica en (−2, 3). ¿En qué cuadrante del plano cartesiano está?",options:["I","II","III","IV"],answer:1,explanation:"En el segundo cuadrante la coordenada x es negativa y la coordenada y es positiva. El punto (−2, 3) cumple esas condiciones.",hint:"Mira primero el signo de x y después el de y."},
  { id:"q1",subject:"Química",topic:"Materia y sus propiedades",clue:"Un estudiante mezcla arena con agua. Después de agitar, puede distinguir los dos componentes y separarlos por filtración. ¿Cómo se clasifica la mezcla?",options:["Sustancia pura","Mezcla heterogénea","Elemento químico","Compuesto puro"],answer:1,explanation:"En una mezcla heterogénea los componentes no se distribuyen uniformemente y pueden distinguirse o separarse mediante métodos físicos, como la filtración.",hint:"Pregúntate si la composición es uniforme en toda la muestra."},
  { id:"q2",subject:"Química",topic:"Escalas de temperatura",clue:"Una muestra pasa de 20 °C a 35 °C. ¿Cuánto aumentó su temperatura?",options:["15 °C","20 °C","35 °C","55 °C"],answer:0,explanation:"El cambio de temperatura es la diferencia entre el valor final y el inicial: 35 − 20 = 15 °C.",hint:"Calcula temperatura final menos temperatura inicial."},
  { id:"q3",subject:"Química",topic:"Átomo y sus características",clue:"¿Qué partícula subatómica tiene carga eléctrica negativa?",options:["Protón","Neutrón","Electrón","Núcleo"],answer:2,explanation:"El electrón tiene carga negativa; el protón tiene carga positiva y el neutrón no tiene carga eléctrica neta.",hint:"Es la partícula que se encuentra alrededor del núcleo en el modelo escolar del átomo."},
  { id:"q4",subject:"Química",topic:"Tipos de reacciones y pH",clue:"Una solución tiene pH 3. Si se compara con una solución de pH 8, ¿cuál afirmación es correcta?",options:["La de pH 3 es más ácida","La de pH 3 es más básica","Ambas son neutras","El pH no informa sobre acidez"],answer:0,explanation:"En la escala habitual, un pH menor que 7 indica acidez y un pH mayor que 7 indica basicidad. Por eso, pH 3 es más ácido que pH 8.",hint:"En la escala de pH, los valores por debajo de 7 son ácidos."},
  { id:"f1",subject:"Física",topic:"Cinemática",clue:"Una ciclista recorre 120 metros en 20 segundos a rapidez constante. ¿Cuál es su rapidez media?",options:["2 m/s","4 m/s","6 m/s","12 m/s"],answer:2,explanation:"La rapidez media es distancia dividida entre tiempo: 120 m ÷ 20 s = 6 m/s.",hint:"Usa rapidez = distancia / tiempo."},
  { id:"f2",subject:"Física",topic:"Dinámica",clue:"Un carrito recibe un empujón y acelera. Según la segunda ley de Newton, si la masa permanece igual y la fuerza neta aumenta, ¿qué ocurre con la aceleración?",options:["Disminuye","Aumenta","Permanece siempre en cero","Se convierte en masa"],answer:1,explanation:"La segunda ley de Newton establece que la fuerza neta es igual a masa por aceleración (F = ma). Para una masa constante, una fuerza neta mayor produce una aceleración mayor.",hint:"Recuerda la relación F = m × a."},
  { id:"f3",subject:"Física",topic:"Movimiento ondulatorio",clue:"En una onda, ¿cómo se llama la distancia entre dos crestas consecutivas?",options:["Amplitud","Frecuencia","Longitud de onda","Período"],answer:2,explanation:"La longitud de onda es la distancia entre dos puntos consecutivos que están en la misma fase, por ejemplo, dos crestas.",hint:"Se representa con la letra griega lambda (λ)."},
  { id:"b1",subject:"Biología",topic:"Célula procariota vs. eucariota",clue:"Una célula observada al microscopio tiene ADN en una región sin membrana nuclear. ¿A qué tipo corresponde?",options:["Eucariota","Procariota","Célula muscular","Ninguna célula"],answer:1,explanation:"Las células procariotas no tienen núcleo delimitado por membrana. En las eucariotas, el ADN se encuentra principalmente dentro de un núcleo.",hint:"La clave es si el material genético está encerrado en un núcleo."},
  { id:"b2",subject:"Biología",topic:"Transporte de membrana",clue:"Una gota de colorante se dispersa en un vaso con agua sin que se agite. Las partículas se mueven desde la zona más concentrada hacia zonas menos concentradas. ¿Qué proceso describe?",options:["Difusión","Fotosíntesis","Mitosis","Digestión"],answer:0,explanation:"La difusión es el movimiento neto de partículas desde una región de mayor concentración hacia otra de menor concentración, debido a su movimiento aleatorio.",hint:"Es un tipo de transporte pasivo."},
  { id:"b3",subject:"Biología",topic:"Ecosistemas",clue:"En una cadena alimentaria, el pasto recibe energía de la luz solar y produce materia orgánica. ¿Qué papel cumple?",options:["Consumidor secundario","Descomponedor","Productor","Depredador tope"],answer:2,explanation:"Las plantas son productores porque elaboran materia orgánica a partir de sustancias inorgánicas usando energía luminosa mediante la fotosíntesis.",hint:"Piensa en el organismo que inicia muchas cadenas alimentarias."},
  { id:"b4",subject:"Biología",topic:"Genética mendeliana",clue:"En una planta, el alelo A domina sobre a. Si se cruza Aa × aa, ¿qué proporción de descendientes se espera que tenga genotipo Aa?",options:["0 %","25 %","50 %","100 %"],answer:2,explanation:"El primer progenitor puede aportar A o a; el segundo solo puede aportar a. La mitad de combinaciones son Aa y la otra mitad aa.",hint:"Escribe las dos posibilidades del primer progenitor: A y a."},
  { id:"h1",subject:"Historia",topic:"Historia de Colombia",clue:"Una fuente histórica es una carta escrita por una persona que participó en un acontecimiento. ¿Por qué puede ser útil para estudiar ese hecho?",options:["Porque nunca contiene sesgos","Porque aporta un testimonio que debe contextualizarse","Porque reemplaza todas las demás fuentes","Porque siempre es más exacta que una cifra"],answer:1,explanation:"Una fuente primaria puede aportar información directa sobre una época, pero debe analizarse teniendo en cuenta quién la produjo, cuándo, con qué propósito y qué perspectiva presenta.",hint:"Una fuente es valiosa, pero también debe evaluarse críticamente."},
  { id:"h2",subject:"Historia",topic:"Modelos económicos",clue:"Un gobierno decide que ciertos servicios esenciales sean financiados y administrados principalmente por el Estado. ¿Qué aspecto del modelo económico está definiendo?",options:["La organización del papel estatal en la economía","La ubicación de los continentes","La composición de un átomo","La duración de una onda"],answer:0,explanation:"Los modelos económicos se diferencian, entre otros aspectos, por el papel que asignan al Estado, al mercado y a los agentes privados en la producción y distribución.",hint:"La pista está en quién financia y administra los servicios."},
  { id:"e1",subject:"Inglés",topic:"Present simple",clue:"Choose the correct option: “My sister ___ to school by bus every day.”",options:["go","goes","going","gone"],answer:1,explanation:"In the present simple, a third-person singular subject (he, she, it) usually takes a verb ending in -s or -es. Therefore, “goes” is correct.",hint:"“My sister” is third-person singular."},
  { id:"e2",subject:"Inglés",topic:"Connectors",clue:"Choose the best connector: “It was raining, ___ we stayed at home.”",options:["because","but","so","although"],answer:2,explanation:"“So” introduces a result. It was raining; as a result, we stayed at home.",hint:"Choose the word that introduces a consequence."},
  { id:"e3",subject:"Inglés",topic:"Past simple",clue:"Choose the correct sentence about yesterday.",options:["They visit the museum yesterday.","They visited the museum yesterday.","They visiting the museum yesterday.","They visits the museum yesterday."],answer:1,explanation:"The sentence refers to a finished action in the past. For the regular verb “visit”, the past simple form is “visited”.",hint:"Look for the regular past-tense ending -ed."},
  { id:"m5",subject:"Matemáticas",topic:"Teorema de Pitágoras",clue:"Un triángulo rectángulo tiene catetos de 6 cm y 8 cm. ¿Cuánto mide la hipotenusa?",options:["7 cm","10 cm","12 cm","14 cm"],answer:1,explanation:"Por el teorema de Pitágoras, c² = 6² + 8² = 36 + 64 = 100. Entonces c = 10 cm.",hint:"Eleva ambos catetos al cuadrado, suma y saca la raíz cuadrada."},
];

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = "peakscore-que-es-esa-vaina-v1";

type SavedProgress = { bestScore: number; completedIds: string[]; chests: number };

function getRounds(): Question[] {
  const pool = [...QUESTION_BANK];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOTAL_ROUNDS);
}

export default function QueEsEsaVainaGame() {
  const [rounds, setRounds] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState<SavedProgress>({ bestScore: 0, completedIds: [], chests: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [accountProgress, setAccountProgress] = useState<{ best_score: number; best_correct: number; games_completed: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedProgress>;
        setSaved({
          bestScore: Math.max(0, Number(parsed.bestScore) || 0),
          completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds.filter((id): id is string => typeof id === "string") : [],
          chests: Math.max(0, Number(parsed.chests) || 0),
        });
      }
    } catch {
      // El juego continúa sin progreso guardado si el almacenamiento está bloqueado.
    }
    setRounds(getRounds());
    setHydrated(true);

    let active = true;
    void fetch("/api/games/progress", { method: "GET", cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.progress ?? null;
      })
      .then((progress) => {
        if (!active || !progress) return;
        setAccountProgress({
          best_score: Math.max(0, Number(progress.best_score) || 0),
          best_correct: Math.max(0, Number(progress.best_correct) || 0),
          games_completed: Math.max(0, Number(progress.games_completed) || 0),
        });
      })
      .catch(() => {
        // El juego sigue disponible aunque no se pueda consultar el progreso de la cuenta.
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // El progreso de esta sesión sigue funcionando aunque localStorage no esté disponible.
    }
  }, [saved, hydrated]);

  const question = rounds[index];
  const chestLevel = Math.min(5, Math.floor(correctCount / 2));
  const progress = finished ? 100 : Math.round((index / TOTAL_ROUNDS) * 100);
  const answeredCorrectly = selected !== null && question?.answer === selected;

  const chooseOption = useCallback((optionIndex: number) => {
    if (revealed || finished) return;
    setSelected(optionIndex);
    setRevealed(true);
    const current = rounds[index];
    if (!current) return;
    const isCorrect = optionIndex === current.answer;
    if (isCorrect) {
      setScore((value) => value + 100);
      setCorrectCount((value) => value + 1);
    }
    setSaved((value) => ({
      ...value,
      completedIds: value.completedIds.includes(current.id) ? value.completedIds : [...value.completedIds, current.id],
    }));
  }, [finished, index, revealed, rounds]);

  const next = useCallback(() => {
    if (!revealed) return;
    if (index + 1 >= rounds.length) {
      setFinished(true);
      setSaved((value) => ({
        ...value,
        bestScore: Math.max(value.bestScore, score),
        chests: Math.max(value.chests, Math.min(5, Math.floor(correctCount / 2))),
      }));
      setSaveStatus("saving");
      void fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct: correctCount }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("No se pudo guardar el progreso de la cuenta.");
          const payload = await response.json();
          const progress = payload?.progress;
          if (progress) {
            setAccountProgress({
              best_score: Math.max(0, Number(progress.best_score) || 0),
              best_correct: Math.max(0, Number(progress.best_correct) || 0),
              games_completed: Math.max(0, Number(progress.games_completed) || 0),
            });
          }
          setSaveStatus("saved");
        })
        .catch(() => setSaveStatus("error"));
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setShowHint(false);
  }, [correctCount, index, revealed, rounds.length, score]);

  const restart = useCallback(() => {
    setRounds(getRounds());
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setCorrectCount(0);
    setHintsUsed([]);
    setShowHint(false);
    setFinished(false);
  }, []);

  const useHint = () => {
    if (!question || showHint) return;
    setShowHint(true);
    setHintsUsed((current) => current.includes(question.id) ? current : [...current, question.id]);
  };

  const totalCorrect = finished ? correctCount : correctCount;
  const earnedChests = Math.min(5, Math.floor(totalCorrect / 2));

  const chestMessage = useMemo(() => {
    if (chestLevel >= 5) return "¡Cofre completo! Dominas esta ronda.";
    if (chestLevel >= 3) return "¡Vas muy bien! El cofre ya está tomando forma.";
    if (chestLevel >= 1) return "¡Buen comienzo! Cada dos aciertos fortalecen tu recompensa.";
    return "Resuelve preguntas para llenar el cofre.";
  }, [chestLevel]);

  if (!hydrated || rounds.length === 0) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#07091a] text-white"><p className="animate-pulse text-sm">Preparando el desafío...</p></main>;
  }

  const playButtonSound = () => {
    try {
      const audio = new Audio("/sounds/navigation.mp3");
      audio.volume = 0.35;
      void audio.play().catch(() => undefined);
    } catch {
      // El sonido es decorativo; nunca debe bloquear el juego.
    }
  };

  const handleNext = () => {
    playButtonSound();
    next();
  };

  return (
    <main className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[#070b18] text-white">
      <div className="absolute inset-0 -z-30 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} />
      <div className="absolute inset-0 -z-20 bg-[#040817]/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#030817]/25 via-[#06102b]/25 to-[#030817]/80" />

      <div className="mx-auto w-full max-w-[1500px] px-3 pb-8 pt-4 sm:px-5 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex min-h-10 items-center gap-2 border-2 border-[#777f9c] bg-[#10172b]/95 px-3 py-2 text-xs font-black text-white shadow-[3px_3px_0_#030713] transition hover:bg-[#1c2942]" onClick={playButtonSound}><ArrowLeft className="h-4 w-4" /> Todos los juegos</Link>
          <div className="border-2 border-[#68728f] bg-[#0a1026]/95 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#f5d8ff] shadow-[3px_3px_0_#030713]"><Sparkles className="mr-1 inline h-4 w-4 text-[#f5c65d]" /> ¿Qué es esa vaina?</div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_285px]">
          <section className="min-w-0 border-[3px] border-[#65718e] bg-[#070d22]/[.97] shadow-[0_0_0_3px_#11182d,8px_8px_0_rgba(0,0,0,.45)]">
            <header className="border-b-2 border-[#303c59] px-4 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f0c86d]">Ronda {finished ? TOTAL_ROUNDS : index + 1} de {TOTAL_ROUNDS}</p>
                  <h1 className="mt-2 text-xl font-black text-white sm:text-2xl">{finished ? "¡Desafío completado!" : "Descifra la pista"}</h1>
                </div>
                <div className="grid grid-cols-2 overflow-hidden border-2 border-[#4c5877] bg-[#050a19] sm:min-w-[260px] sm:grid-cols-2">
                  <div className="px-4 py-2 text-center">
                    <p className="text-[9px] font-bold text-[#aab4cf]">Puntos</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-lg font-black text-[#ffd65c]"><span>★</span>{score}</p>
                  </div>
                  <div className="border-l-2 border-[#303b57] px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-[#aab4cf]">Peak Coins</p>
                    <div className="mt-1 flex items-center justify-center gap-1"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={22} height={22} className="h-5 w-5 object-contain" /><span className="text-sm font-black text-[#7feaff]">—</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-1.5" aria-label={`Progreso: ${progress}%`}>
                {Array.from({ length: TOTAL_ROUNDS }, (_, i) => <div key={i} className={`h-3 flex-1 border border-[#737c93] transition-colors duration-300 ${i < (finished ? TOTAL_ROUNDS : index) ? "bg-[#f3c94f] shadow-[inset_0_0_0_1px_#fff0a3]" : "bg-[#151c31]"}`} />)}
              </div>
            </header>

            {finished ? (
              <div className="p-5 text-center sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center border-[3px] border-[#eac45a] bg-[#302716] shadow-[4px_4px_0_#030713]"><Trophy className="h-8 w-8 text-[#ffda69]" /></div>
                <h2 className="mt-4 text-2xl font-black text-[#ffe28b]">¡Ronda terminada!</h2>
                <p className="mt-2 text-sm text-slate-200">Acertaste {correctCount} de {TOTAL_ROUNDS} preguntas y conseguiste {score} puntos.</p>
                <p className="mt-2 text-xs text-slate-400">{saveStatus === "saving" ? "Guardando tu progreso…" : saveStatus === "saved" ? "Progreso guardado en tu cuenta." : saveStatus === "error" ? "No se pudo guardar en la cuenta; tu partida local sigue disponible." : "Tu resultado está listo."}</p>
                <div className="mx-auto mt-5 max-w-sm border-2 border-[#6c7590] bg-[#0b1228] p-4">
                  <Image src="/images/games/poco-responda/cofre.png" alt="Cofre de recompensas" width={180} height={130} className="mx-auto h-28 w-36 object-contain" />
                  <div className="mt-3 flex gap-1.5">{Array.from({ length: 5 }, (_, i) => <div key={i} className={`h-3 flex-1 border border-[#6c7590] ${i < earnedChests ? "bg-[#f3c94f]" : "bg-[#151c31]"}`} />)}</div>
                  <p className="mt-2 text-xs text-[#f5d987]">{earnedChests} / 5 fragmentos del cofre</p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={() => { playButtonSound(); restart(); }} className="inline-flex min-h-11 items-center gap-2 border-2 border-[#a8d99a] bg-[#287b42] px-5 text-xs font-black text-white shadow-[3px_3px_0_#102b1c] hover:bg-[#32934f]"><RotateCcw className="h-4 w-4" /> Jugar otra vez</button>
                  <Link href="/aprender/juegos" onClick={playButtonSound} className="inline-flex min-h-11 items-center gap-2 border-2 border-[#737c93] bg-[#111a31] px-5 text-xs font-bold text-white hover:bg-[#1a2944]">Volver a juegos</Link>
                </div>
              </div>
            ) : question ? (
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="border-2 border-[#627d8d] bg-[#172b3a] px-3 py-1.5 text-[10px] font-black text-[#b8f3e7]">{question.subject}</span>
                  <span className="border-2 border-[#424c68] bg-[#10172c] px-3 py-1.5 text-[10px] font-bold text-[#c4cbe0]">{question.topic}</span>
                </div>

                <div className="relative border-[3px] border-[#7b849c] bg-[#111a31] p-5 shadow-[inset_0_0_0_3px_#29344e,5px_5px_0_#030713] sm:p-7">
                  <div className="absolute left-3 top-3 h-2 w-2 bg-[#aeb8ce]" />
                  <div className="absolute right-3 top-3 h-2 w-2 bg-[#aeb8ce]" />
                  <div className="mb-4 flex h-10 w-10 items-center justify-center border-2 border-[#77829d] bg-[#252e49]"><CircleHelp className="h-5 w-5 text-[#f5d77c]" /></div>
                  <p className="text-base font-bold leading-7 text-white sm:text-lg sm:leading-8">{question.clue}</p>
                  <button type="button" onClick={() => { playButtonSound(); useHint(); }} disabled={showHint} className="mt-5 inline-flex min-h-10 items-center gap-2 border-2 border-[#8e8059] bg-[#28243a] px-3 text-xs font-black text-[#ffe7a2] shadow-[3px_3px_0_#050817] transition hover:bg-[#39334a] disabled:opacity-60"><Lightbulb className="h-4 w-4" /> {showHint ? "Pista revelada" : "Dame una pista"}</button>
                  {showHint && <p className="mt-3 border-2 border-[#89774c] bg-[#242032] p-3 text-sm leading-6 text-[#ffedb8]">{question.hint}</p>}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selected === optionIndex;
                    const isCorrect = optionIndex === question.answer;
                    const stateClass = !revealed ? "border-[#606b86] bg-[#111a31] hover:border-[#d8c16b] hover:bg-[#222a40]" : isCorrect ? "border-[#8bc79a] bg-[#193b32]" : isSelected ? "border-[#d58a91] bg-[#3b202d]" : "border-[#3c4762] bg-[#0b1226] opacity-75";
                    return <button key={option} type="button" onClick={() => { playButtonSound(); chooseOption(optionIndex); }} disabled={revealed} aria-pressed={isSelected} className={`flex min-h-[66px] items-center gap-3 border-2 p-4 text-left text-sm font-bold leading-6 shadow-[3px_3px_0_#030713] transition ${stateClass}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#69738c] bg-[#080e20] text-xs font-black text-[#f5d77c]">{String.fromCharCode(65 + optionIndex)}</span>
                      <span>{option}</span>
                      {revealed && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-[#a5e6b1]" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 shrink-0 text-[#ff9aa5]" />}
                    </button>;
                  })}
                </div>

                {revealed && <div role="status" aria-live="polite" className={`mt-4 border-2 p-4 ${answeredCorrectly ? "border-[#80bd8d] bg-[#14352c]" : "border-[#ca858d] bg-[#351d2a]"}`}>
                  <p className="text-sm font-black">{answeredCorrectly ? "¡Correcto, bien hecho!" : "Esta vez no fue. ¡Aprendamos!"}</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{question.explanation}</p>
                </div>}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[10px] font-semibold text-[#b5bfd5]"><Clock3 className="h-4 w-4" /> Sin límite de tiempo: piensa con calma</p>
                  <button type="button" onClick={handleNext} disabled={!revealed} className="inline-flex min-h-11 items-center gap-2 border-2 border-[#9ad49b] bg-[#267b43] px-5 text-xs font-black text-white shadow-[4px_4px_0_#102b1c] transition hover:bg-[#32984f] active:translate-y-0.5 active:shadow-[2px_2px_0_#102b1c] disabled:cursor-not-allowed disabled:border-[#424b60] disabled:bg-[#222a3b] disabled:text-[#7c8497] disabled:shadow-none">{index + 1 === TOTAL_ROUNDS ? "Ver resultados" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            ) : null}
          </section>

          {!finished && <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="border-[3px] border-[#746e88] bg-[#0a1026]/[.97] p-4 shadow-[5px_5px_0_rgba(0,0,0,.45)] sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f0d28a]">Recompensa de la ronda</p>
              <h2 className="mt-2 text-base font-black">El cofre misterioso</h2>
              <Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className="mx-auto my-3 h-36 w-full object-contain drop-shadow-[0_5px_0_rgba(0,0,0,.5)]" />
              <div className="grid grid-cols-5 gap-1.5" aria-label={`${chestLevel} de 5 fragmentos del cofre`}>
                {Array.from({ length: 5 }, (_, i) => <div key={i} className={`h-3 border-2 ${i < chestLevel ? "border-[#ffdc7a] bg-[#f5bf37] shadow-[inset_0_0_0_1px_#fff0a7]" : "border-[#343c55] bg-[#151b2d]"}`} />)}
              </div>
              <p className="mt-3 text-xs font-black leading-5 text-[#ffe5a0]">{chestMessage}</p>
              <p className="mt-2 text-[10px] leading-5 text-[#9da8c5]">Cada dos respuestas correctas llena un fragmento. Completa las {TOTAL_ROUNDS} preguntas para descubrir cuánto has aprendido.</p>
            </section>

            <section className="border-[3px] border-[#5e6d8c] bg-[#081027]/[.97] p-4 shadow-[5px_5px_0_rgba(0,0,0,.4)] sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#b8c8e9]">Pistas</p>
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => { playButtonSound(); useHint(); }} disabled={showHint} className={`flex items-center gap-3 border-2 p-3 text-left ${showHint ? "border-[#6e6484] bg-[#17172e] opacity-70" : "border-[#b58cdb] bg-[#251c3c] shadow-[0_0_12px_rgba(190,120,255,.12)] hover:bg-[#32234d]"}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#8b75b5] bg-[#382a52]"><Lightbulb className="h-5 w-5 text-[#ffe36b]" /></span>
                  <span className="min-w-0"><span className="block text-sm font-black text-[#f4d8ff]">Pista 1</span><span className="block text-xs text-[#d8cce8]">{showHint ? "Ya revelada" : "Revelar una orientación"}</span></span>
                </button>
                <div className="flex items-center gap-3 border-2 border-[#35425e] bg-[#10172c] p-3 opacity-65">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#405477] bg-[#152542] text-lg">◉</span>
                  <span><span className="block text-sm font-black text-[#a9dff4]">Pista 2</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span>
                </div>
                <div className="flex items-center gap-3 border-2 border-[#35425e] bg-[#10172c] p-3 opacity-65">
                  <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-[#405477] bg-[#152542] text-lg">▤</span>
                  <span><span className="block text-sm font-black text-[#a9dff4]">Pista 3</span><span className="block text-xs text-[#9da8c5]">Próximamente</span></span>
                </div>
              </div>
            </section>

            <section className="border-2 border-[#3b4c70] bg-[#071027]/95 p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9abbe9]">Tu sesión</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="border-2 border-[#263654] bg-[#111a31] p-3"><p className="text-[10px] text-[#9da8c5]">Aciertos</p><p className="mt-1 text-xl font-black text-[#a8f1d9]">{correctCount}<span className="text-xs text-[#9da8c5]">/{TOTAL_ROUNDS}</span></p></div>
                <div className="border-2 border-[#263654] bg-[#111a31] p-3"><p className="text-[10px] text-[#9da8c5]">Pistas usadas</p><p className="mt-1 text-xl font-black text-[#f3d785]">{hintsUsed.length}</p></div>
              </div>
              <p className="mt-4 text-[10px] leading-5 text-[#9da8c5]">Temas de matemáticas, química, física, biología, historia e inglés.</p>
            </section>
            <section className="border-2 border-[#39577b] bg-[#071027]/95 p-4"><p className="text-[11px] font-black text-[#bde7ff]">Consejo de Nova</p><p className="mt-2 text-xs leading-5 text-[#aab7d2]">No te quedes solo con la opción correcta. Lee la explicación: entender el razonamiento te prepara para el ICFES.</p></section>
          </aside>}
        </div>
      </div>
    </main>
  );
}
