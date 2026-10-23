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

  return (
    <main className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#07091a] text-white">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('/images/games/que-es-esa-vaina/que-es-esa-vaina-cover.png')" }} />
      <div className="absolute inset-0 -z-10 bg-[#050817]/[.28]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#050817]/15 via-[#07091a]/15 to-[#050817]/75" />

      <div className="mx-auto w-full max-w-[1380px] px-3 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/aprender/juegos" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#080d25]/80 px-3 py-2 text-xs font-bold text-white/80 transition hover:border-cyan-200/50 hover:text-white"><ArrowLeft className="h-4 w-4" /> Todos los juegos</Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/20 bg-[#080d25]/80 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-violet-100"><Sparkles className="h-4 w-4 text-fuchsia-300" /> ¿Qué es esa vaina?</div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-violet-200/20 bg-[#080d25]/95 shadow-[0_20px_60px_rgba(0,0,0,.38)] backdrop-blur-sm">
            <div className="border-b border-white/10 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/75">Ronda {finished ? TOTAL_ROUNDS : index + 1} de {TOTAL_ROUNDS}</p>
                  <h1 className="mt-2 text-xl font-black sm:text-2xl">{finished ? "¡Desafío completado!" : "Descifra la pista"}</h1>
                </div>
                <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-violet-200/25 bg-[#050a20]/95 shadow-[0_8px_24px_rgba(0,0,0,.35)] sm:min-w-[310px]">
                  <div className="border-r border-white/10 px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-violet-100/65">Puntos</p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-base font-black tabular-nums text-amber-200 sm:text-lg"><span>★</span>{score.toLocaleString("es-CO")}</p>
                  </div>
                  <div className="border-r border-white/10 px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-violet-100/65">Peak Coins</p>
                    <div className="mt-1 flex items-center justify-center gap-1"><Image src="/images/currency/peakcoin.webp" alt="Peak Coins" width={21} height={21} className="h-5 w-5 object-contain" /><span className="text-sm font-black text-cyan-200">—</span></div>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <p className="text-[9px] font-bold text-violet-100/65">Racha</p>
                    <p className="mt-1 text-base font-black text-orange-300 sm:text-lg">🔥 —</p>
                  </div>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            </div>

            {finished ? (
              <div className="px-5 py-9 text-center sm:px-10 sm:py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-200/10"><Trophy className="h-8 w-8 text-amber-200" /></div>
                <p className="mt-5 text-[10px] font-black uppercase tracking-[.2em] text-cyan-200">Misión completada</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">{correctCount} / {TOTAL_ROUNDS} correctas</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/65">{correctCount >= 8 ? "¡Excelente! Tienes una base sólida. Repite el reto para reforzar los temas que te costaron." : "Buen intento. Revisa las explicaciones y vuelve a intentarlo: equivocarse también hace parte de aprender."}</p>
                <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-amber-200/20 bg-[#130f2a]/90 p-4">
                  <Image src="/images/games/poco-responda/cofre.png" alt="Cofre de recompensas del juego" width={180} height={140} className="mx-auto h-28 w-36 object-contain drop-shadow-[0_8px_20px_rgba(245,158,11,.2)]" />
                  <p className="mt-2 text-sm font-black text-amber-100">{earnedChests} / 5 fragmentos del cofre</p>
                  <p className="mt-1 text-xs leading-5 text-white/50">En esta versión, el progreso del minijuego se guarda en este navegador. No suma todavía Peak Coins ni XP oficiales de tu perfil.</p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-xs font-black"><RotateCcw className="h-4 w-4" /> Jugar otra vez</button>
                  <Link href="/aprender/juegos" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-5 text-xs font-bold text-white/75 hover:bg-white/5">Volver a juegos</Link>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-black text-cyan-100">{question.subject}</span>
                  <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-bold text-white/55">{question.topic}</span>
                </div>
                <div className="rounded-2xl border border-violet-200/20 bg-gradient-to-br from-[#15133a]/90 to-[#090e25]/95 p-5 sm:p-7">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-200/20 bg-fuchsia-300/10"><CircleHelp className="h-5 w-5 text-fuchsia-200" /></div>
                  <p className="text-base font-semibold leading-7 text-white sm:text-lg sm:leading-8">{question.clue}</p>
                  <button type="button" onClick={useHint} disabled={showHint} className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-200/20 bg-amber-200/[.07] px-3 text-[11px] font-bold text-amber-100 transition hover:bg-amber-200/10 disabled:opacity-50"><Lightbulb className="h-4 w-4" /> {showHint ? "Pista revelada" : "Dame una pista"}</button>
                  {showHint && <p className="mt-3 rounded-lg border border-amber-200/15 bg-black/20 p-3 text-sm leading-6 text-amber-50/85">{question.hint}</p>}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isAnswer = optionIndex === question.answer;
                    const isSelected = optionIndex === selected;
                    const stateClass = revealed
                      ? isAnswer ? "border-emerald-300/65 bg-emerald-400/10 text-emerald-50" : isSelected ? "border-rose-300/50 bg-rose-400/10 text-rose-50" : "border-white/10 bg-white/[.025] text-white/35"
                      : "border-white/10 bg-white/[.035] text-white/85 hover:border-violet-200/45 hover:bg-violet-300/[.07]";
                    return <button key={option} type="button" onClick={() => chooseOption(optionIndex)} disabled={revealed} aria-pressed={isSelected} className={`flex min-h-[66px] items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold leading-6 transition disabled:cursor-default ${stateClass}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-black/15 text-xs font-black">{String.fromCharCode(65 + optionIndex)}</span>
                      <span className="flex-1">{option}</span>
                      {revealed && isAnswer && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />}
                      {revealed && isSelected && !isAnswer && <XCircle className="h-5 w-5 shrink-0 text-rose-300" />}
                    </button>;
                  })}
                </div>

                {revealed && <div role="status" aria-live="polite" className={`mt-5 rounded-xl border p-4 ${answeredCorrectly ? "border-emerald-300/25 bg-emerald-300/[.07]" : "border-rose-300/20 bg-rose-300/[.06]"}`}>
                  <p className={`flex items-center gap-2 text-sm font-black ${answeredCorrectly ? "text-emerald-200" : "text-rose-200"}`}>{answeredCorrectly ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{answeredCorrectly ? "¡Correcto! +100 puntos" : "Casi. Vamos a entenderlo"}</p>
                  <p className="mt-2 text-sm leading-6 text-white/75">{question.explanation}</p>
                </div>}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-[11px] text-white/45"><Clock3 className="h-4 w-4" /> Sin límite de tiempo: piensa con calma</p>
                  <button type="button" onClick={next} disabled={!revealed} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-xs font-black shadow-lg shadow-violet-950/40 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">{index + 1 === TOTAL_ROUNDS ? "Ver resultados" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-amber-200/20 bg-[#0c0b22]/95 p-4 shadow-[0_15px_40px_rgba(0,0,0,.28)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-100/65">Recompensa de la ronda</p><h2 className="mt-2 text-base font-black">El cofre misterioso</h2></div>
                <Sparkles className="h-5 w-5 text-amber-200" />
              </div>
              <Image src="/images/games/poco-responda/cofre.png" alt="Cofre pixel art" width={260} height={190} className="mx-auto my-3 h-36 w-full object-contain drop-shadow-[0_8px_22px_rgba(245,158,11,.15)]" />
              <div className="grid grid-cols-5 gap-1.5" aria-label={`${chestLevel} de 5 fragmentos del cofre`}>
                {Array.from({ length: 5 }, (_, i) => <div key={i} className={`h-2.5 rounded-sm border transition ${i < chestLevel ? "border-amber-200 bg-gradient-to-r from-amber-300 to-orange-400 shadow-[0_0_10px_rgba(251,191,36,.45)]" : "border-white/10 bg-white/[.05]"}`} />)}
              </div>
              <p className="mt-3 text-xs font-bold leading-5 text-amber-50/85">{chestMessage}</p>
              <p className="mt-2 text-[10px] leading-5 text-white/40">Cada 2 respuestas correctas llena un fragmento. Completa 10 preguntas para descubrir cuánto has aprendido.</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#080d25]/90 p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-200/75">Tu sesión</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[.04] p-3"><p className="text-[10px] text-white/45">Aciertos</p><p className="mt-1 text-xl font-black text-emerald-200">{correctCount}<span className="text-xs text-white/35">/{TOTAL_ROUNDS}</span></p></div>
                <div className="rounded-xl bg-white/[.04] p-3"><p className="text-[10px] text-white/45">Pistas usadas</p><p className="mt-1 text-xl font-black text-cyan-200">{hintsUsed.length}</p></div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-white/45">Temas mezclados de los temarios: matemáticas, química, física, biología, historia e inglés.</p>
            </section>
            <section className="rounded-xl border border-cyan-200/10 bg-cyan-200/[.04] p-4"><p className="text-[11px] font-black text-cyan-100">Consejo de Nova</p><p className="mt-2 text-xs leading-5 text-white/55">No te quedes solo con la opción correcta. Lee la explicación: entender el razonamiento es lo que te prepara para el ICFES.</p></section>
          </aside>
        </div>
        <div className="mt-6 text-center"><Link href="/aprender" className="text-xs font-bold text-white/45 underline-offset-4 hover:text-white hover:underline">Volver a Aprender · Niveles</Link></div>
      </div>
    </main>
  );
}
