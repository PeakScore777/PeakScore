"use client";

import Link from "next/link";
import Image from "next/image";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  Lightbulb,
  RotateCcw,
} from "lucide-react";

type Question = {
  prompt: string;
  context: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    context: "Nova mide tres muestras sólidas compactas a la misma temperatura. Registra estos resultados: muestra P: masa 24 g y volumen 8 cm³; muestra Q: masa 36 g y volumen 12 cm³; muestra R: masa 30 g y volumen 10 cm³. Supón que las mediciones no tienen errores relevantes.",
    prompt: "¿Cuál conclusión está mejor respaldada por los datos experimentales?",
    options: [
      { label: "A", text: "La muestra Q tiene mayor densidad porque su masa total es la mayor." },
      { label: "B", text: "Las tres muestras tienen la misma densidad, de 3 g/cm³." },
      { label: "C", text: "La muestra P es más densa porque ocupa el menor volumen." },
      { label: "D", text: "No se puede calcular densidad sin conocer el color y la composición de cada muestra." },
    ],
    answer: "B",
    explanation: "La densidad relaciona masa y volumen: ρ = m/V. Para P: 24 g ÷ 8 cm³ = 3 g/cm³; para Q: 36 g ÷ 12 cm³ = 3 g/cm³; para R: 30 g ÷ 10 cm³ = 3 g/cm³. Aunque la masa y el volumen totales son diferentes, la razón entre ambas magnitudes es igual. La opción A confunde masa total con densidad: un objeto puede tener más masa solo porque contiene más material.",
  },
  {
    context: "En el laboratorio, una estudiante calienta una pequeña cantidad de una sustancia pura. La muestra pasa de sólido a líquido y, al enfriarse, vuelve a solidificarse. No se detectan cambios en su composición.",
    prompt: "¿Qué interpretación explica mejor el fenómeno observado?",
    options: [
      { label: "A", text: "Ocurrió una reacción química porque la sustancia cambió de apariencia." },
      { label: "B", text: "La sustancia perdió masa necesariamente al convertirse en líquido." },
      { label: "C", text: "Es un cambio físico: varía el estado, pero no se evidencia la formación de otra sustancia." },
      { label: "D", text: "La muestra dejó de ser materia durante el calentamiento." },
    ],
    answer: "C",
    explanation: "Un cambio de estado es físico cuando la sustancia conserva su identidad química. En la fusión y la solidificación, las partículas cambian su organización y movilidad, pero eso no implica por sí mismo que se formen sustancias nuevas. La apariencia no basta para afirmar que hubo una reacción. Además, no puede concluirse que la masa se perdió: en un sistema cerrado, la masa total se conserva en los procesos físicos y químicos.",
  },
  {
    context: "Un equipo debe identificar una muestra metálica desconocida. Una integrante propone concluir que es cobre porque tiene color rojizo. Otra propone medir su masa y volumen, comparar su densidad con valores de referencia y repetir la medición para verificar la consistencia de los resultados.",
    prompt: "¿Por qué el segundo procedimiento permite construir una conclusión científica más sólida?",
    options: [
      { label: "A", text: "Porque una sola propiedad medida siempre identifica de forma absoluta cualquier material." },
      { label: "B", text: "Porque sustituye una impresión visual por mediciones comparables y permite evaluar la incertidumbre." },
      { label: "C", text: "Porque repetir una medición garantiza que no existan errores experimentales." },
      { label: "D", text: "Porque la densidad es una propiedad extensiva que aumenta con la cantidad de muestra." },
    ],
    answer: "B",
    explanation: "El color puede orientar una hipótesis, pero distintos materiales pueden presentar apariencias similares. Calcular la densidad a partir de masa y volumen aporta evidencia cuantitativa; comparar con referencias y repetir las mediciones ayuda a detectar resultados inconsistentes. Esto no elimina toda incertidumbre ni garantiza por sí solo una identificación definitiva: conviene contrastar varias propiedades. La opción D es incorrecta porque la densidad es intensiva en condiciones equivalentes, mientras que masa y volumen son extensivas.",
  },
];

const matterNotes = [
  {
    title: "Materia y composición",
    body: "La materia tiene masa y ocupa espacio. Puede ser una sustancia pura (elemento o compuesto) o una mezcla homogénea/heterogénea; la apariencia no basta para clasificarla.",
  },
  {
    title: "Extensivas e intensivas",
    body: "Masa y volumen dependen de la cantidad de muestra (extensivas). Densidad y punto de fusión, bajo condiciones definidas, no dependen directamente de cuánto material se toma (intensivas).",
  },
  {
    title: "Densidad y evidencia",
    body: "La densidad es ρ = m/V. Compara la masa por unidad de volumen. Revisa unidades, convierte antes de operar y no confundas densidad con peso ni con tamaño.",
  },
  {
    title: "Cambio físico o químico",
    body: "Un cambio físico altera estado, forma o distribución sin cambiar la identidad química; un cambio químico implica formación de sustancias diferentes. Una sola señal visual no siempre demuestra reacción.",
  },
];

export default function CristalesMisteriososPage() {
  const [stage, setStage] = useState<"theory" | "practice">("theory");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lost, setLost] = useState(false);

  const question = questions[questionIndex];
  const isCorrect = selected === question.answer;

  // Efectos retro locales: no requieren API ni dependencias adicionales.
  function playSound(file: "navigation.mp3" | "level-win.mp3" | "game-over.wav" | "xp-gain.mp3", volume = 0.22) {
    if (typeof window === "undefined") return;
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = volume;
    void audio.play().catch(() => {
      // El navegador puede bloquear audio hasta que exista interacción del usuario.
    });
  }

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrectCount((count) => count + 1);
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) {
      playSound("navigation.mp3", 0.16);
      setQuestionIndex((index) => index + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    setFinished(true);
    if (correctCount === questions.length) {
      setLost(false);
      playSound("level-win.mp3", 0.25);
      window.setTimeout(() => playSound("xp-gain.mp3", 0.22), 220);
    } else {
      setLost(true);
      playSound("game-over.wav", 0.3);
    }
  }

  function restartPractice() {
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
    setLost(false);
  }

  return (
    <main className="lesson-shell min-h-[calc(100vh-72px)] bg-[#05070b] text-[#f0f4fa]">
      <header className="lesson-topbar sticky top-0 z-30 border-b border-white/10 bg-[#101725]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[58px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7">
          <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-400 sm:flex">
            <span>Ciencias Naturales</span><span>›</span>
            <span>El Santuario de la Materia</span><span>›</span>
            <span className="truncate text-emerald-100">{stage === "theory" ? "Los cristales misteriosos" : "Misión: analiza las muestras"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="pixel-font text-[8px] text-white/70">LECCIÓN 1 / 13</span>
            <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
              <div className={`h-full rounded-full bg-emerald-300 transition-all ${stage === "practice" ? "w-[65%]" : "w-[30%]"}`} />
            </div>
            <span className="pixel-font text-[8px] text-emerald-200">{stage === "theory" ? "30%" : finished ? "100%" : "65%"}</span>
          </div>
        </div>
        <div className="h-[2px] bg-white/[.04]"><div className={`h-full bg-cyan-300 transition-all duration-300 ${stage === "theory" ? "w-[30%]" : finished ? "w-full" : "w-[65%]"}`} /></div>
      </header>

      {stage === "theory" ? (
        <div className="lesson-reading mx-auto max-w-[680px] px-5 pb-28 pt-7 sm:px-8 sm:pt-10">
          <div className="mb-6">
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-white sm:text-[28px]">Los cristales misteriosos</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">Primero observa. Después compara. Solo entonces saca una conclusión.</p>
          </div>

          <LessonNotesSelection sourceTitle="Los cristales misteriosos" sourcePath="/aprender/santuario-de-la-materia/leccion/1">
          <section className="mb-7">
            <button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)} className="flex w-full items-center justify-between border border-white/[.09] bg-[#131824] px-4 py-3 text-left transition hover:border-cyan-200/25">
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-200"><span aria-hidden="true">📖</span> Historia</span>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
            </button>
            {historyOpen && (
              <div className="border-x border-b border-white/[.08] bg-[#0b101b] px-4 py-5 sm:px-5">
                <p className="text-sm leading-7 text-slate-200">Al caer la tarde, Nova llega por primera vez a un antiguo santuario escondido entre ruinas. El lugar está en silencio, salvo por el sonido del agua que cae entre las piedras. Sobre una mesa encuentra tres muestras: una roca oscura, un cristal transparente y una pieza azul que refleja la luz.</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">Nova no sabe de qué materiales están hechas ni por qué son diferentes. En vez de adivinar, abre su cuaderno y anota lo que puede observar: color, brillo, forma y tamaño. También se pregunta qué podría medir para comparar las muestras de manera justa.</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">Una pequeña inscripción aparece en la mesa: <em className="text-cyan-100">«Quien observa con cuidado encuentra mejores respuestas».</em> Nova decide comenzar por lo esencial: entender qué es la materia y cuáles propiedades permiten describirla. Su investigación apenas comienza.</p>
                <div className="mt-5 border-l-2 border-cyan-300/70 bg-cyan-300/[.045] px-4 py-3">
                  <p className="text-xs font-bold text-cyan-100">Tu papel en esta aventura</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">Ayuda a Nova a distinguir una observación de una conclusión y a elegir qué propiedades necesita comparar. Por ahora, ella investiga sola: sus próximos encuentros llegarán cuando la historia avance.</p>
                </div>
              </div>
            )}
          </section>

          <article className="space-y-6">
            <section>
              <h2 className="text-lg font-bold text-cyan-200 sm:text-xl">¿Qué es la materia?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300"><strong className="rounded-sm bg-amber-300/[.09] px-1 font-semibold text-amber-200">La materia es todo aquello que tiene masa y ocupa un lugar en el espacio.</strong> Una piedra, el agua de una botella y el aire dentro de un balón son ejemplos de materia. Aunque el aire no siempre se vea, tiene masa y ocupa espacio.</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Para estudiar una muestra, no basta con decir «se ve bonita» o «parece pesada». En ciencias describimos características mediante observaciones y mediciones, y usamos esos datos para comparar muestras.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Propiedades generales y específicas</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Las propiedades de la materia nos ayudan a describirla. Se suelen estudiar en dos grupos:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="border border-white/10 bg-[#1c3045] p-4">
                  <h3 className="font-bold text-white">Propiedades generales</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Son comunes a la materia y no suelen identificar por sí solas una sustancia.</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                    <li><strong className="text-amber-200">Masa:</strong> cantidad de materia de una muestra.</li>
                    <li><strong className="text-amber-200">Volumen:</strong> espacio que ocupa.</li>
                  </ul>
                </div>
                <div className="border border-white/10 bg-[#101725] p-4">
                  <h3 className="font-bold text-white">Propiedades específicas</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Permiten comparar y, bajo condiciones controladas, ayudar a diferenciar materiales.</p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300">
                    <li><strong className="text-amber-200">Densidad:</strong> relación entre masa y volumen.</li>
                    <li><strong className="text-amber-200">Solubilidad:</strong> capacidad de disolverse en otra sustancia.</li>
                    <li><strong className="text-amber-200">Punto de fusión:</strong> temperatura a la que un sólido pasa a líquido, bajo una presión determinada.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">¿Cómo describimos una muestra?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Imagina que tienes dos cubos del mismo tamaño. Uno tiene más masa que el otro. El tamaño por sí solo no explica la diferencia: comparar la masa y el volumen permite calcular la <strong className="text-cyan-100">densidad</strong>.</p>
              <div className="my-4 border border-slate-600 bg-[#101725] p-4">
                <p className="pixel-font text-[8px] leading-5 text-slate-400">EJEMPLO GUIADO</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">Una muestra tiene una masa de 20 g y un volumen de 10 cm³.</p>
                <div className="my-3 border border-cyan-200/15 bg-[#080e19] px-4 py-3 font-mono text-sm text-cyan-100">Densidad = masa ÷ volumen<br />Densidad = 20 g ÷ 10 cm³<br />Densidad = 2 g/cm³</div>
                <p className="text-sm leading-7 text-slate-300">La operación permite comparar esta muestra con otras medidas en las mismas condiciones. No basta con observar su color para conocer su densidad.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Observación no es lo mismo que conclusión</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Si una muestra cambia de color, esa frase describe una observación. Decir que se formó una sustancia nueva ya es una conclusión que necesita más evidencias. Algunos cambios de apariencia no significan necesariamente que haya ocurrido una reacción química.</p>
              <div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave para Saber 11</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Lee qué datos entrega el enunciado, identifica qué propiedad describen y elige solo la conclusión respaldada por la evidencia. No agregues información que el problema no proporciona.</p>
              </div>
            </section>


            <section>
              <h2 className="text-lg font-bold text-cyan-200">Propiedades extensivas e intensivas: una distinción que sí importa</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Otra clasificación depende de si la propiedad cambia al aumentar o disminuir la cantidad de muestra. Las <strong className="text-cyan-100">propiedades extensivas</strong> dependen de la cantidad de materia: por ejemplo, la masa y el volumen de una misma sustancia aumentan si reunimos más muestra. Las <strong className="text-cyan-100">propiedades intensivas</strong> no dependen directamente de la cantidad: por ejemplo, la densidad y el punto de fusión de una sustancia pura, siempre que se comparen en condiciones equivalentes.</p>
              <div className="mt-4 overflow-hidden border border-white/10">
                <div className="grid grid-cols-[1fr_1fr] bg-[#182235] text-xs font-bold text-slate-100"><div className="p-3">Extensivas</div><div className="border-l border-white/10 p-3">Intensivas</div></div>
                <div className="grid grid-cols-[1fr_1fr] bg-[#1c3045] text-sm text-slate-300"><div className="p-3">Masa, volumen, longitud de una muestra.</div><div className="border-l border-white/10 p-3">Densidad, temperatura de fusión, conductividad característica.</div></div>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">Ejemplo: si cortas un bloque de cobre en dos partes, cada parte tendrá menos masa y volumen que el bloque original, pero ambas pueden conservar aproximadamente la misma densidad. Por eso la densidad es más útil que la masa aislada para comparar la identidad de materiales.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Propiedades físicas y químicas</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una <strong className="text-cyan-100">propiedad física</strong> se puede observar o medir sin transformar la sustancia en otra: densidad, color, dureza, conductividad, solubilidad y temperatura de fusión son ejemplos. Una <strong className="text-cyan-100">propiedad química</strong> describe la capacidad de una sustancia para participar en una transformación que cambia su composición, como la inflamabilidad o la tendencia del hierro a oxidarse.</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">No confundas propiedad con cambio. La inflamabilidad es una propiedad química; la combustión es un proceso químico. El punto de ebullición es una propiedad física; hervir agua es un cambio físico porque las moléculas siguen siendo H₂O, aunque cambie el estado.</p>
              <div className="mt-4 border border-emerald-200/25 bg-cyan-200/[.04] p-4">
                <p className="text-sm font-bold text-cyan-100">Cómo razonar en una pregunta</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">Pregúntate: ¿la identidad química de la sustancia cambia? Si no cambia y solo varían el estado, la forma o el tamaño, el proceso es físico. Si aparecen sustancias con composición diferente, el proceso es químico. La evidencia debe sostener la conclusión; burbujas o cambio de color, por sí solos, pueden tener más de una explicación.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Densidad: fórmula, unidades e interpretación</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">La densidad media de una muestra homogénea se calcula como <strong className="text-white">ρ = m/V</strong>, donde ρ representa la densidad, m la masa y V el volumen. En el sistema internacional se expresa en kg/m³; en laboratorio escolar también es común usar g/cm³ o g/mL. Recuerda que 1 mL equivale a 1 cm³, por lo que 1 g/mL y 1 g/cm³ son unidades numéricamente equivalentes.</p>
              <div className="my-4 border border-slate-600 bg-[#101725] p-4">
                <p className="pixel-font text-[8px] leading-5 text-slate-400">EJEMPLO CON DATOS EXPERIMENTALES</p>
                <p className="mt-3 text-sm leading-7 text-slate-200">Una muestra tiene masa de 54 g y volumen de 20 cm³. ¿Cuál es su densidad?</p>
                <div className="my-3 border border-cyan-200/15 bg-[#080e19] px-4 py-3 font-mono text-sm leading-7 text-cyan-100">ρ = m/V<br />ρ = 54 g ÷ 20 cm³<br />ρ = 2,7 g/cm³</div>
                <p className="text-sm leading-7 text-slate-300">Interpretación: cada centímetro cúbico de esa muestra corresponde, en promedio, a 2,7 gramos. No significa que el objeto tenga 2,7 gramos en total. Para comparar con una tabla de referencia, verifica que las unidades y las condiciones sean compatibles.</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">La densidad también puede ayudar a evaluar hipótesis. Si una muestra compacta y homogénea tiene una densidad muy distinta a la de una sustancia de referencia, esa evidencia cuestiona la identificación propuesta. Sin embargo, poros, impurezas, temperatura y errores de medición pueden alterar el resultado; la ciencia compara varias evidencias, no una cifra sin contexto.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Medir bien también es hacer ciencia</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Una medición combina un valor numérico con una unidad. Escribir «la masa es 12» es incompleto si no se indica si son gramos, kilogramos u otra unidad. Antes de calcular, comprueba que las magnitudes estén expresadas en unidades compatibles. Por ejemplo, no dividas directamente gramos entre metros cúbicos y reportes el resultado como g/cm³ sin convertir el volumen.</p>
              <p className="mt-3 text-sm leading-7 text-slate-300"><strong className="text-white">Precisión</strong> describe qué tan cercanas son entre sí mediciones repetidas; <strong className="text-white">exactitud</strong> describe qué tan cerca está una medición del valor aceptado o de referencia. Un instrumento puede producir resultados muy parecidos entre sí y, aun así, estar descalibrado. En una investigación, repetir medidas, registrar unidades y reconocer incertidumbres mejora la calidad de la evidencia.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Materia: sustancia pura o mezcla</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">Aunque esta lección se centra en propiedades, la composición ayuda a interpretar los datos. Una <strong className="text-cyan-100">sustancia pura</strong> tiene composición definida: puede ser un elemento (como cobre) o un compuesto (como agua pura). Una <strong className="text-cyan-100">mezcla</strong> combina sustancias en proporciones variables. Es homogénea si su composición es uniforme a la escala de observación —por ejemplo, sal disuelta en agua— y heterogénea si presenta regiones o fases distinguibles —por ejemplo, agua y aceite—.</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">No confundas «se ve uniforme» con «es sustancia pura»: el aire y el agua salada pueden parecer uniformes, pero son mezclas. Tampoco confundas una mezcla con un compuesto: en una mezcla, los componentes conservan sus identidades y pueden separarse mediante métodos físicos adecuados; en un compuesto, los elementos están unidos químicamente en proporciones definidas.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-cyan-200">Estrategia Saber 11: datos, modelo y conclusión</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300">
                <li><strong className="text-white">Identifica la pregunta:</strong> ¿pide clasificar una propiedad, calcular densidad, interpretar un cambio o evaluar una afirmación?</li>
                <li><strong className="text-white">Selecciona la evidencia pertinente:</strong> masa y volumen sirven para calcular densidad; color por sí solo no confirma la identidad.</li>
                <li><strong className="text-white">Aplica el modelo correcto:</strong> usa ρ = m/V y conserva las unidades durante el procedimiento.</li>
                <li><strong className="text-white">Descarta conclusiones exageradas:</strong> elige la afirmación que se deriva de los datos, no la que suena más científica.</li>
                <li><strong className="text-white">Evalúa el procedimiento:</strong> considera controles, repeticiones, instrumentos y condiciones de la muestra.</li>
              </ol>
              <div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Error frecuente</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">«Tiene más masa, por tanto es más densa» no siempre es válido. Para comparar densidades necesitas considerar también el volumen. Una muestra puede tener más masa simplemente porque contiene más material.</p>
              </div>
            </section>
          </article>
          </LessonNotesSelection>

        </div>
      ) : (
        <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-6 sm:px-7 sm:pt-8">
          <div className="mb-6">
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-white sm:text-[28px]">Misión 1: analiza las muestras</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Consulta la teoría a la izquierda cuando la necesites. Usa las evidencias para justificar tu respuesta.</p>
          </div>

          {finished ? (lost ? (
            <section className="mx-auto w-full max-w-4xl overflow-hidden border border-rose-300/30 bg-[#05070b] text-white shadow-[0_20px_60px_rgba(0,0,0,.35)]">
              <div className="relative aspect-video w-full bg-black">
                <Image src="/images/game-over/nova-derrotado.png" alt="Nova derrotado en el Santuario de la Materia" fill priority sizes="(max-width: 768px) 100vw, 896px" className="object-contain" />
              </div>
              <div className="flex flex-col gap-4 border-t border-rose-300/20 p-5 sm:flex-row sm:items-center sm:justify-center sm:p-6">
                <button type="button" onClick={restartPractice} className="inline-flex min-h-11 items-center justify-center gap-2 border border-rose-200/40 bg-[#24141a] px-5 py-3 text-xs font-bold text-rose-100 transition hover:bg-[#3a1c25]"><RotateCcw className="h-4 w-4" /> REPETIR PRÁCTICA</button>
                <button type="button" onClick={() => { setStage("theory"); setFinished(false); setLost(false); }} className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/20 bg-[#151b24] px-5 py-3 text-xs font-bold text-slate-100 transition hover:border-cyan-200/50 hover:bg-[#1d2931]"><BookOpen className="h-4 w-4" /> REPASAR TEORÍA</button>
              </div>
            </section>
          ) : (
            <section className="completion-panel relative mx-auto w-full max-w-2xl overflow-hidden border border-emerald-300/30 bg-[#05070b] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,.35)] sm:p-9">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-300 to-violet-400" />
              <div className="relative z-10 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="pixel-font text-[8px] tracking-[.16em] text-emerald-300">SANTUARIO DE LA MATERIA · NIVEL 01</p>
                  <h2 className="pixel-font mt-5 text-sm leading-8 text-white sm:text-base">¡NIVEL SUPERADO!</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">Completaste el análisis de las muestras y respondiste correctamente <strong className="text-white">{correctCount} de {questions.length}</strong> preguntas. La evidencia científica te acercó a dominar este desafío.</p>
                  <div className="mt-5 inline-flex items-center gap-3 border border-emerald-300/30 bg-emerald-300/[.07] px-4 py-3"><Image src="/peaky/homepage/xp.webp" alt="Experiencia XP" width={42} height={42} className="object-contain" /><div><p className="pixel-font text-[8px] text-emerald-200">RECOMPENSA</p><p className="mt-2 text-lg font-extrabold text-white">+50 XP</p></div></div>
                </div>
                <div className="completion-score mx-auto flex h-28 w-28 flex-col items-center justify-center border border-emerald-300/35 bg-[#101a20] sm:mx-0">
                  <span className="pixel-font text-2xl text-emerald-300">{Math.round((correctCount / questions.length) * 100)}%</span>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Precisión</span>
                </div>
              </div>
              <div className="relative z-10 mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                <button type="button" onClick={restartPractice} className="inline-flex min-h-11 items-center gap-2 border border-white/20 bg-[#151b24] px-4 py-2.5 text-xs font-bold text-slate-100 transition hover:border-emerald-300/50 hover:bg-[#1d2931]"><RotateCcw className="h-4 w-4" /> Repetir práctica</button>
                <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-11 items-center gap-2 bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#07130d] transition hover:bg-emerald-300"><BookOpen className="h-4 w-4" /> Repasar teoría</button>
              </div>
            </section>
          )) : (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,370px)_minmax(0,1fr)]">
              <aside className="border border-white/10 bg-[#152235] p-5 lg:sticky lg:top-[82px]">
                <p className="flex items-center gap-2 text-xs font-bold text-cyan-200"><BookOpen className="h-4 w-4" /> Repaso rápido</p>
                {matterNotes.map((note) => (
                  <section key={note.title} className="mt-5 border-t border-white/[.08] pt-4 first:border-0 first:pt-0">
                    <h2 className="text-sm font-bold text-white">{note.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{note.body}</p>
                  </section>
                ))}
                <div className="mt-5 border border-amber-200/25 bg-amber-200/[.04] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Recuerda</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Una observación es un dato; una conclusión debe estar respaldada por los datos.</p>
                </div>
              </aside>

              <section className="practice-panel border border-slate-300 bg-[#f4f6f8] p-5 text-slate-900 shadow-[0_12px_32px_rgba(0,0,0,.16)] sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="pixel-font text-[8px] leading-5 text-slate-600">PREGUNTA {questionIndex + 1} DE {questions.length}</p>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">Práctica</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden bg-slate-200"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
                <p className="mt-6 rounded-md border-l-4 border-slate-400 bg-white px-4 py-3 text-sm leading-7 text-slate-700">{question.context}</p>
                <h2 className="mt-4 text-lg font-bold leading-8 text-slate-950 sm:text-xl">{question.prompt}</h2>
                <div className="mt-6 space-y-3">
                  {question.options.map((option) => {
                    const active = selected === option.label;
                    const correctOption = checked && option.label === question.answer;
                    const wrongOption = checked && active && !isCorrect;
                    const style = correctOption ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500" : wrongOption ? "border-rose-500 bg-rose-50 ring-1 ring-rose-300" : active ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300" : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/60";
                    return (
                      <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`flex w-full items-start gap-3 rounded-md border p-4 text-left transition ${style}`}>
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-xs font-bold ${correctOption ? "border-emerald-600 bg-emerald-600 text-white" : wrongOption ? "border-rose-500 bg-rose-500 text-white" : active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-slate-50 text-slate-700"}`}>{option.label}</span>
                        <span className="pt-1 text-sm leading-6 text-slate-800">{option.text}</span>
                        {correctOption && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
                {checked && (
                  <div aria-live="polite" className={`mt-5 rounded-md border p-4 ${isCorrect ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
                    <p className="font-bold text-slate-900">{isCorrect ? "Respuesta correcta: interpretación adecuada de la evidencia." : "Analicemos el razonamiento y el error conceptual."}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{question.explanation}</p>
                  </div>
                )}
                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-600">Selecciona una opción y justifica tu decisión con los datos del enunciado.</p>
                  {!checked ? (
                    <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700">{questionIndex === questions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      <footer className="lesson-footer fixed inset-x-0 bottom-0 z-40 border-t border-[#344054] bg-[#142033]/[.98] shadow-[0_-8px_24px_rgba(0,0,0,.18)] backdrop-blur">
        <div className="mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="pixel-font text-[8px] leading-5 text-slate-100">{stage === "theory" ? "LECCIÓN 1 / 13" : finished ? "LECCIÓN 1 / 13 · COMPLETADA" : `LECCIÓN 1 / 13 · PRÁCTICA ${questionIndex + 1}/${questions.length}`}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 border border-emerald-300/20 bg-emerald-300/[.08] px-2 py-0.5 text-[9px] font-bold text-emerald-200"><Image src="/peaky/homepage/xp.webp" alt="" width={17} height={17} className="object-contain" /> 50 XP</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {stage === "theory" ? (
              <>
                <Link href="/aprender/santuario-de-la-materia" onClick={() => playSound("navigation.mp3", 0.16)} className="inline-flex min-h-9 items-center gap-2 border border-white/15 bg-[#26364a] px-3 py-2 text-[10px] font-semibold text-slate-200 transition hover:bg-[#252f46] sm:min-h-10 sm:px-4 sm:text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Anterior</Link>
                <button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setStage("practice"); }} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-3 py-2 text-[10px] font-extrabold text-[#09200a] shadow-[0_2px_0_#3a9a2b] transition hover:bg-[#8ced6d] active:translate-y-px active:shadow-none sm:min-h-10 sm:px-5 sm:text-xs">Siguiente <ArrowRight className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setStage("theory"); }} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-3 py-2 text-[10px] font-semibold text-slate-200 transition hover:bg-[#252f46] sm:min-h-10 sm:px-4 sm:text-xs"><ArrowLeft className="h-3.5 w-3.5" /> Anterior</button>
                {!finished && <span className="hidden items-center gap-1 text-[10px] text-slate-500 sm:inline-flex"><FlaskConical className="h-3.5 w-3.5" /> Razonamiento científico</span>}
              </>
            )}
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .lesson-shell { font-family: Arial, Helvetica, sans-serif; }
        .lesson-shell .pixel-font { font-family: var(--font-press-start), "Press Start 2P", monospace; }
        .lesson-shell .lesson-reading p, .lesson-shell .lesson-reading li { font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.8; }
        .lesson-shell .lesson-reading h2, .lesson-shell .lesson-reading h3 { font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 1.45; }
        .lesson-shell textarea { font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.7; }
        .lesson-pixel-mark { display: inline-flex; width: 29px; height: 29px; align-items: center; justify-content: center; border: 1px solid rgba(103,232,249,.6); color: #a5f3fc; font-family: var(--font-press-start), monospace; font-size: 11px; box-shadow: 3px 3px 0 #103345; }
        .lesson-reading { padding-bottom: 112px; }
        @media (max-width: 640px) {
          .lesson-footer .text-xs { font-size: 10px; }
          .lesson-footer .min-h-10 { min-height: 38px; }
        }
      `}</style>
    </main>
  );
}
