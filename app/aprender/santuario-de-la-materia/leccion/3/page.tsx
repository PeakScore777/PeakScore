"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Lightbulb } from "lucide-react";
import LessonNotesSelection from "@/components/aprender/LessonNotesSelection";
import LessonAITutor from "@/components/aprender/LessonAITutor";
import XpRewardAnimation from "@/components/gamification/XpRewardAnimation";

type Question = {
  difficulty: "Media" | "Difícil";
  competency: string;
  context: string;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
{difficulty:"Fácil",competency:"Explicación de fenómenos",context:"Nova mezcla nitrato de plata acuoso con cloruro de sodio acuoso. Aparece un sólido blanco que no se veía en las disoluciones iniciales.",prompt:"¿Qué conclusión está mejor respaldada?",options:[{label:"A",text:"El sólido demuestra que los átomos desaparecieron y se creó materia nueva."},{label:"B",text:"La formación de un precipitado es evidencia compatible con una reacción que produce una sustancia poco soluble, aunque debe interpretarse junto con controles."},{label:"C",text:"Como los líquidos eran transparentes, no pudo ocurrir una reacción."},{label:"D",text:"El color blanco demuestra que la temperatura necesariamente aumentó."}],answer:"B",explanation:"La formación de un precipitado puede indicar una reacción. En este caso, los iones Ag⁺ y Cl⁻ pueden formar cloruro de plata sólido (AgCl). Aun así, un indicio aislado no permite concluir cualquier cosa sobre la temperatura o la conservación de los átomos."},
{difficulty:"Fácil",competency:"Uso comprensivo del conocimiento científico",context:"La ecuación de formación de agua se escribe H₂ + O₂ → H₂O. La ecuación aún no está balanceada.",prompt:"¿Qué ajuste conserva el número de átomos de cada elemento?",options:[{label:"A",text:"H₂ + O₂ → H₂O₂, cambiando la fórmula del producto."},{label:"B",text:"2H₂ + O₂ → 2H₂O, con cuatro átomos de H y dos de O a cada lado."},{label:"C",text:"H₂ + 2O₂ → H₂O, aumentando el coeficiente del oxígeno."},{label:"D",text:"H₂ + O₂ → 2H₂O, porque solo importa el producto."}],answer:"B",explanation:"La ecuación 2H₂ + O₂ → 2H₂O conserva cuatro átomos de hidrógeno y dos de oxígeno en ambos lados. Se ajustan coeficientes, no subíndices que definen la identidad de las sustancias."},
{difficulty:"Fácil",competency:"Indagación y evaluación de evidencia",context:"Un equipo hace reaccionar sustancias en un recipiente cerrado y mide la misma masa total antes y después. En un vaso abierto, la masa registrada disminuye y se observa que se desprende un gas.",prompt:"¿Cuál explicación interpreta mejor la diferencia?",options:[{label:"A",text:"La conservación de la masa deja de cumplirse cuando se produce gas."},{label:"B",text:"Los átomos del gas se destruyeron en el vaso abierto."},{label:"C",text:"En el sistema abierto parte del gas puede escapar y dejar de ser incluido en la medición; el recipiente cerrado permite contabilizar el sistema completo."},{label:"D",text:"La masa disminuye en toda reacción que libera energía."}],answer:"C",explanation:"En una reacción química ordinaria los átomos se conservan. Si un gas escapa de un recipiente abierto, la balanza deja de medir parte de la materia del sistema. La diferencia aparente se debe a los límites de la medición."}
];
const retryQuestions: Question[] = [
{difficulty:"Fácil",competency:"Indagación y evaluación de evidencia",context:"Al mezclar un ácido con una disolución de carbonato aparecen burbujas. El equipo recoge el gas en una bolsa y desea determinar qué ocurrió.",prompt:"¿Qué procedimiento ofrece evidencia más sólida?",options:[{label:"A",text:"Afirmar que el gas es cualquier sustancia que se observa como burbujas."},{label:"B",text:"Repetir el experimento cambiando todas las cantidades a la vez."},{label:"C",text:"Usar controles, registrar las condiciones y aplicar una prueba adecuada al gas recogido."},{label:"D",text:"Concluir que hubo reacción solo porque el recipiente se ve diferente."}],answer:"C",explanation:"Las burbujas sugieren un gas, pero identificarlo requiere una prueba apropiada y controles. Una buena indagación mantiene registradas las condiciones y distingue observaciones de inferencias."},
{difficulty:"Fácil",competency:"Uso comprensivo del conocimiento científico",context:"El amoníaco se forma a partir de nitrógeno e hidrógeno. La ecuación propuesta es N₂ + H₂ → NH₃.",prompt:"¿Cuál representación está balanceada?",options:[{label:"A",text:"N₂ + 3H₂ → 2NH₃."},{label:"B",text:"N₂ + H₂ → N₂H₃."},{label:"C",text:"2N₂ + H₂ → 2NH₃."},{label:"D",text:"N₂ + 2H₂ → NH₃."}],answer:"A",explanation:"En N₂ + 3H₂ → 2NH₃ hay dos átomos de nitrógeno y seis de hidrógeno a cada lado. Balancear significa ajustar coeficientes, no modificar las fórmulas."},
{difficulty:"Fácil",competency:"Explicación de fenómenos",context:"En un experimento, la temperatura del entorno aumenta de 22 °C a 30 °C. En otro, con condiciones diferentes, disminuye de 22 °C a 17 °C.",prompt:"¿Qué conclusión es más rigurosa?",options:[{label:"A",text:"La primera reacción produjo necesariamente más masa."},{label:"B",text:"La segunda no pudo ser química porque enfrió el entorno."},{label:"C",text:"La temperatura identifica por sí sola todos los productos de ambas reacciones."},{label:"D",text:"Los cambios sugieren intercambios energéticos distintos, pero se deben controlar las condiciones y reunir más evidencia para compararlos."}],answer:"D",explanation:"Un cambio térmico puede ser compatible con un proceso exotérmico o endotérmico, pero la temperatura por sí sola no identifica productos ni demuestra la naturaleza completa del proceso."}
];

export default function DespertarDeLaReaccionPage() {
  const [stage, setStage] = useState<"theory" | "practice">("theory");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const activeQuestions = attempt === 0 ? questions : retryQuestions;
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [lost, setLost] = useState(false);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  function playSound(file: "navigation.mp3" | "level-win.mp3" | "game-over.wav", volume = 0.22) {
    if (typeof window === "undefined") return;
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = volume;
    void audio.play().catch(() => {});
  }

  useEffect(() => {
    if (finished && lost) playSound("game-over.wav", 0.3);
    if (finished && !lost && rewardOpen) playSound("level-win.mp3", 0.25);
  }, [finished, lost, rewardOpen]);
  const question = activeQuestions[index];
  const isCorrect = selected === question.answer;

  function checkAnswer() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) setCorrect((n) => n + 1);
  }

  function nextQuestion() {
    if (index < activeQuestions.length - 1) {
      playSound("navigation.mp3", 0.16);
      setIndex((n) => n + 1);
      setSelected(null);
      setChecked(false);
    } else {
      setFinished(true);
      const finalCorrect = correct;
      if (finalCorrect === activeQuestions.length) setRewardOpen(true);
      else setLost(true);
    }
  }

  function restart() {
    playSound("navigation.mp3", 0.16);
    setAttempt((n) => n + 1);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setCorrect(0);
    setFinished(false);
    setLost(false);
    setRewardOpen(false);
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#05070b] pb-28 text-[#f0f4fa]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101725]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[58px] max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/aprender/santuario-de-la-materia" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Santuario de la Materia</Link>
          <span className="pixel-font text-[8px] text-cyan-200">NIVEL 3 · QUÍMICA</span>
        </div>
      </header>

      {stage === "theory" ? (
        <div className="mx-auto max-w-[760px] px-5 pt-8 sm:px-8 sm:pt-10">
<p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Capítulo 03 · El despertar de la reacción</p>
<h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">La cámara sellada</h1>
<p className="mt-4 text-base leading-8 text-slate-300">Después de descifrar los cristales cambiantes, Nova descubre una cámara bajo el Santuario. Dos disoluciones se encuentran: aparece un sólido, cambia el color y el recipiente se calienta. La inscripción pregunta: «¿Cambió la apariencia o se formaron sustancias nuevas?». Para abrir la puerta tendrás que razonar con evidencias, no adivinar.</p>
<LessonNotesSelection sourceTitle="Nivel 3: El despertar de la reacción" sourcePath="/aprender/santuario-de-la-materia/leccion/3">
<section className="mt-8 overflow-hidden border border-white/[.09] bg-[#0b101b]"><button type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen(v => !v)} className="flex w-full items-center justify-between bg-[#131824] px-4 py-3 text-left text-sm font-semibold text-slate-200">Historia: la cámara de reacción <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${historyOpen ? "rotate-180" : ""}`} /></button>{historyOpen && <div className="space-y-4 px-5 py-5 text-sm leading-7 text-slate-300"><p>En el centro de la cámara hay dos recipientes conectados a una balanza y a un sensor térmico. Nova mezcla pequeñas cantidades de dos soluciones. Aparece un sólido blanco y la temperatura aumenta. Ninguna de esas observaciones, aislada, cuenta toda la historia.</p><p>El mecanismo proyecta dos explicaciones: una transformación física o una reacción química. Nova debe determinar qué evidencia distingue ambas posibilidades, qué sucede con los átomos y cómo representar el proceso.</p><p className="border-l-2 border-cyan-300/70 bg-cyan-300/[.045] px-4 py-3 text-cyan-100">Tu misión: explicar la formación de sustancias nuevas, conservar los átomos en las ecuaciones y evaluar las pruebas del experimento.</p></div>}</section>
<article className="mt-8 space-y-8">
<section><h2 className="text-xl font-bold text-cyan-200">1. ¿Cómo reconocemos una reacción química?</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una reacción química es un proceso en el que unas sustancias, llamadas reactivos, se transforman en otras, llamadas productos. La diferencia esencial no es solo que la muestra cambie de color, temperatura o estado, sino que cambia la composición química: los átomos se reorganizan y aparecen nuevas combinaciones. En una transformación física, como la fusión del hielo, la identidad química del agua se conserva; en una reacción, pueden romperse y formarse enlaces.</p><p className="mt-3 text-sm leading-7 text-slate-300">Entre las señales observables están la formación de un precipitado, el desprendimiento de gas, un cambio de color persistente y el intercambio de energía. Son indicios, no pruebas infalibles: las burbujas también pueden provenir de la ebullición y una variación térmica puede deberse al entorno. Una conclusión sólida reúne observaciones y controles pertinentes.</p></section>
<section><h2 className="text-xl font-bold text-cyan-200">2. Átomos, moléculas y enlaces</h2><p className="mt-3 text-sm leading-7 text-slate-300">Los átomos tienen un núcleo con protones y neutrones, rodeado por electrones. En las reacciones químicas habituales, los núcleos no se transforman: los cambios ocurren principalmente en la distribución de electrones y en los enlaces entre átomos. Una molécula es un conjunto definido de átomos enlazados, como H₂O; los sólidos iónicos forman redes de iones y no siempre se describen como moléculas independientes.</p><p className="mt-3 text-sm leading-7 text-slate-300">En un enlace covalente, los átomos comparten densidad electrónica; en uno iónico, la atracción electrostática entre iones de cargas opuestas contribuye a formar una red; en los metales, los electrones deslocalizados ayudan a explicar la conductividad y la cohesión. Son modelos útiles para explicar propiedades, aunque los enlaces reales pueden tener distintos grados de carácter.</p><p className="mt-3 text-sm leading-7 text-slate-300">Durante una reacción, algunos enlaces de los reactivos se rompen y otros se forman en los productos. Los átomos no desaparecen: cambian sus compañeros y su organización electrónica. Así se conectan los cambios microscópicos con propiedades macroscópicas como color, solubilidad y conductividad.</p></section>
<section><h2 className="text-xl font-bold text-cyan-200">3. Reactivos y productos: leer una ecuación</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una ecuación química resume una reacción mediante fórmulas. A la izquierda se escriben los reactivos; a la derecha, los productos; la flecha representa la transformación propuesta. Por ejemplo, 2H₂ + O₂ → 2H₂O expresa que hidrógeno y oxígeno forman agua en una proporción definida. Los subíndices pequeños forman parte de la identidad de la sustancia; los coeficientes delante de las fórmulas indican proporciones relativas de partículas o moles.</p><p className="mt-3 text-sm leading-7 text-slate-300">La ecuación no describe por sí sola la velocidad, el mecanismo ni si la reacción ocurre por completo. Para esas preguntas hacen falta datos adicionales y, a veces, modelos cinéticos o de equilibrio.</p><div className="mt-4 border border-cyan-200/20 bg-[#101725] p-4"><p className="text-sm font-bold text-cyan-100">Cómo leerla</p><p className="mt-2 text-sm leading-7 text-slate-300">2H₂ + O₂ → 2H₂O: cuatro átomos de hidrógeno y dos de oxígeno antes y después. A escala macroscópica, los coeficientes representan proporciones molares.</p></div></section>
<section><h2 className="text-xl font-bold text-cyan-200">4. La conservación de la materia</h2><p className="mt-3 text-sm leading-7 text-slate-300">En una reacción química ordinaria, los átomos de cada elemento se conservan: no aparecen ni desaparecen, sino que se reorganizan. Por eso, en un sistema cerrado, la masa total antes y después de la reacción es la misma, dentro de la incertidumbre de medición. Los reactivos se consumen y los productos se forman, pero la suma total se conserva.</p><p className="mt-3 text-sm leading-7 text-slate-300">En un recipiente abierto puede escapar un gas o entrar materia del aire. Si la balanza mide solo lo que permanece dentro, la masa registrada puede cambiar. Esto no refuta la conservación: significa que se está midiendo solo una parte del sistema. En ciencias es esencial definir el sistema y sus límites.</p></section>
<section><h2 className="text-xl font-bold text-cyan-200">5. Balancear ecuaciones químicas</h2><p className="mt-3 text-sm leading-7 text-slate-300">Balancear consiste en ajustar coeficientes para que el número de átomos de cada elemento sea igual en reactivos y productos. No se cambian los subíndices: hacerlo alteraría la identidad de las sustancias. Cuenta los átomos de ambos lados, ajusta coeficientes y comprueba cada elemento al final.</p><p className="mt-3 text-sm leading-7 text-slate-300">H₂ + O₂ → H₂O no está balanceada porque hay dos oxígenos a la izquierda y uno a la derecha. Al escribir 2H₂O hay cuatro hidrógenos a la derecha; por eso se coloca 2H₂ a la izquierda. Resultado: 2H₂ + O₂ → 2H₂O, con cuatro H y dos O a cada lado. Los coeficientes se reducen a la menor proporción entera.</p><p className="mt-3 text-sm leading-7 text-slate-300">Balancear representa la conservación de átomos, pero no demuestra por sí solo que un mecanismo sea único ni que la reacción sea rápida.</p></section>
<section><h2 className="text-xl font-bold text-cyan-200">6. Energía: exotérmico y endotérmico</h2><p className="mt-3 text-sm leading-7 text-slate-300">Romper enlaces requiere energía; formar enlaces libera energía. El balance entre ambas contribuciones determina si, bajo condiciones especificadas, el proceso libera energía al entorno (exotérmico) o la absorbe (endotérmico). Un aumento de temperatura puede ser compatible con un proceso exotérmico, pero se deben controlar los intercambios con el recipiente y el ambiente.</p><p className="mt-3 text-sm leading-7 text-slate-300">La energía de activación es la barrera que debe superarse para que ocurra la transformación. Una reacción puede liberar energía globalmente y aun así necesitar una chispa inicial. Un catalizador ofrece una ruta de menor energía de activación y acelera la reacción sin consumirse en la reacción global; no cambia por sí mismo la diferencia energética entre reactivos y productos.</p><p className="mt-3 text-sm leading-7 text-slate-300">No confundas temperatura con energía total: la temperatura caracteriza el estado térmico, mientras que la energía intercambiada depende de la cantidad de materia, el proceso y las condiciones experimentales.</p></section>
<section><h2 className="text-xl font-bold text-cyan-200">7. Indagación: ¿qué demuestra el experimento?</h2><p className="mt-3 text-sm leading-7 text-slate-300">Una investigación rigurosa distingue observación, inferencia e hipótesis. «Se formó un sólido blanco» es una observación; «el sólido es cloruro de plata» es una identificación que requiere evidencia adicional. Un control ayuda a establecer si el fenómeno depende de mezclar los reactivos. Repetir mediciones permite valorar la variabilidad y registrar resultados con unidades.</p><p className="mt-3 text-sm leading-7 text-slate-300">En preguntas tipo Saber 11, identifica qué variable se modifica, qué se mide y qué condiciones se mantienen constantes. Compara las explicaciones con los datos y evita conclusiones absolutas cuando hay varias causas posibles. Una opción puede incluir una idea verdadera y ser incorrecta si no responde al problema o excede lo que la evidencia permite afirmar.</p><div className="mt-4 border border-amber-200/30 bg-amber-200/[.045] p-4"><p className="flex items-center gap-2 text-sm font-bold text-amber-100"><Lightbulb className="h-4 w-4" /> Idea clave para Saber 11</p><p className="mt-2 text-sm leading-7 text-slate-300">No identifiques una reacción solo por un cambio visible. Busca evidencia de productos nuevos, define el sistema, conserva los átomos en la ecuación y elige la conclusión que realmente respalden los datos.</p></div></section>
<section className="border border-cyan-200/20 bg-cyan-200/[.035] p-5"><h2 className="text-lg font-bold text-cyan-100">Antes de entrar al desafío</h2><p className="mt-2 text-sm leading-7 text-slate-300">Debes distinguir reactivos y productos, explicar la reorganización de átomos y enlaces, balancear una ecuación sencilla y justificar por qué la masa medida puede cambiar en un sistema abierto. En el desafío, selecciona la respuesta que conteste exactamente la pregunta y esté respaldada por la evidencia.</p></section>
</article></LessonNotesSelection>
<div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between"><Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 bg-[#26364a] px-4 py-3 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link><button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-11 items-center justify-center gap-2 border border-emerald-300/60 bg-[#75df55] px-5 py-3 text-sm font-extrabold text-[#09200a]">Iniciar desafío · 3 preguntas <ArrowRight className="h-4 w-4" /></button></div></div>
      ) : (
        <div className="mx-auto max-w-[980px] px-4 pb-24 pt-7 sm:px-7">
          <p className="pixel-font text-[9px] uppercase tracking-[.12em] text-cyan-200">Desafío del Santuario · Pregunta {index + 1} de {activeQuestions.length}</p>
          {!finished ? (
            <section className="mt-5 border border-[#35506d] bg-[#0d1422]">
              <div className="border-b border-cyan-200/15 bg-gradient-to-br from-[#15243a] via-[#111b2c] to-[#101725] px-5 py-6 sm:px-7 sm:py-7">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-cyan-200">{question.competency}</p><span className="border border-amber-200/30 bg-amber-200/[.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100">Dificultad · {question.difficulty}</span></div><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Situación problema</p>
                <p className="mt-2 border-l-[3px] border-cyan-300 bg-[#0b1422]/90 px-5 py-5 text-sm leading-7 text-slate-100 shadow-inner sm:text-[15px] sm:leading-8">{question.context}</p>
                <div className="mt-5 rounded-sm border border-cyan-200/25 bg-gradient-to-r from-cyan-300/[.08] to-[#0c1a29] p-4 sm:p-5">
                  <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center border border-amber-200/30 bg-amber-200/[.08] text-amber-100">01</span><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-cyan-100">Repaso estratégico</p><p className="mt-1 text-xs text-slate-400">Conceptos esenciales para resolver la pregunta</p></div></div>{index === 0 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Reacción química:</strong> los reactivos se transforman en productos; un precipitado es un indicio, no una prueba aislada de todas las conclusiones.</p><p><strong className="text-cyan-100">Evidencia:</strong> interpreta los datos junto con controles adecuados.</p></div> : index === 1 ? <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Balanceo:</strong> el número de átomos de cada elemento debe ser igual a ambos lados.</p><p><strong className="text-cyan-100">Regla:</strong> ajusta coeficientes; no cambies subíndices.</p></div> : <div className="mt-2 space-y-2 text-sm leading-6 text-slate-200"><p><strong className="text-cyan-100">Conservación:</strong> la masa del sistema completo se conserva en una reacción química ordinaria.</p><p><strong className="text-cyan-100">Sistema abierto:</strong> el gas que escapa deja de contarse en la balanza, pero los átomos no se destruyen.</p></div>}
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Analiza la evidencia</p><h2 className="mt-2 text-xl font-extrabold leading-8 text-white sm:text-2xl sm:leading-9">{question.prompt}</h2><p className="mt-2 text-xs leading-5 text-slate-400">Selecciona la opción mejor sustentada. Dos ideas pueden parecer plausibles, pero solo una explica todos los datos.</p>
              </div>
              <div className="space-y-3 p-5 sm:p-7">
                {question.options.map((option) => {
                  const active = selected === option.label;
                  const right = checked && option.label === question.answer;
                  const wrong = checked && active && !isCorrect;
                  return <button key={option.label} type="button" disabled={checked} onClick={() => setSelected(option.label)} className={`group flex w-full items-start gap-3 border p-4 text-left transition duration-150 sm:p-5 ${right ? "border-emerald-300 bg-emerald-300/10" : wrong ? "border-rose-400 bg-rose-400/10" : active ? "border-cyan-300 bg-cyan-300/10" : "border-[#344a66] bg-[#111c2d] hover:border-cyan-300/60"}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold ${active ? "border-cyan-300 bg-cyan-300 text-[#06131b]" : "border-[#425977] bg-[#0a1220] text-slate-200"}`}>{option.label}</span>
                    <span className="pt-1 text-sm leading-6 text-slate-100">{option.text}</span>
                    {right && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 shrink-0 text-emerald-300" />}
                  </button>;
                })}
                {checked && <div aria-live="polite" className={`border p-4 ${isCorrect ? "border-emerald-300/50 bg-emerald-300/[.08]" : "border-amber-300/50 bg-amber-300/[.07]"}`}>
                  <p className="font-bold text-white">{isCorrect ? "Correcto: interpretación respaldada." : "Revisemos el razonamiento."}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">{question.explanation}</p>
                </div>}
                <div className="flex justify-end border-t border-[#293d56] pt-5">
                  {!checked ? <button type="button" disabled={!selected} onClick={checkAnswer} className="inline-flex min-h-11 items-center gap-2 border border-emerald-300 bg-[#65edb1] px-5 py-3 text-sm font-extrabold text-[#062218] disabled:opacity-40">Comprobar respuesta <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={nextQuestion} className="inline-flex min-h-11 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-5 py-3 text-sm font-bold text-cyan-100">{index === activeQuestions.length - 1 ? "Ver resultado" : "Siguiente pregunta"} <ArrowRight className="h-4 w-4" /></button>}
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-5 border border-cyan-200/25 bg-[#101725] p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-white">Desafío completado</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">Respondiste correctamente <strong className="text-cyan-100">{correct} de {activeQuestions.length}</strong> preguntas. Repasa las explicaciones y vuelve a intentarlo si quieres fortalecer tu comprensión.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={restart} className="inline-flex min-h-10 items-center gap-2 border border-cyan-300/50 bg-[#172c43] px-4 py-2 text-sm font-bold text-cyan-100">Repetir práctica <ArrowRight className="h-4 w-4" /></button>
                <Link href="/aprender/santuario-de-la-materia" className="inline-flex min-h-10 items-center gap-2 border border-white/15 bg-[#26364a] px-4 py-2 text-sm font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver al capítulo</Link>
              </div>
            </section>
          )}
          {!finished && <LessonAITutor open={tutorOpen} onOpenChange={setTutorOpen} subject="Ciencias Naturales" topic={`Nivel 3: reacciones químicas, enlaces, ecuaciones y conservación de la materia`} stage="practice" question={question.prompt} context={`Situación: ${question.context}\nOpciones: ${question.options.map((o) => `${o.label}) ${o.text}`).join("\n")}\nExplicación: ${question.explanation}`} />}
        </div>
      )}

      {finished && lost && <div className="game-over-overlay fixed inset-x-0 bottom-0 top-[68px] z-40 flex items-center justify-center overflow-y-auto px-5 py-8 text-center" role="dialog" aria-modal="true" aria-labelledby="level2-gameover-title">
        <div className="game-over-content relative z-10 flex w-full max-w-6xl flex-col items-center text-center"><div aria-hidden="true" className="game-over-pixels pointer-events-none absolute inset-0" /><div aria-hidden="true" className="game-over-crystal-glow pointer-events-none absolute inset-0" />
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-3"><h2 id="level2-gameover-title" className="pixel-font game-over-title">GAME</h2><Image src="/images/game-over/nova-dead-pixel.png" alt="Nova derrotado en pixel art" width={112} height={112} className="game-over-nova h-24 w-24 object-contain sm:h-36 sm:w-36 lg:h-40 lg:w-40"/><span className="pixel-font game-over-title">OVER</span></div>
          <p className="pixel-font mt-5 text-xs text-white sm:text-sm">PLAY AGAIN?</p><p className="game-over-copy mt-4 max-w-3xl text-sm font-extrabold leading-8 text-white sm:text-lg">No lograste acertar las tres preguntas de este desafío.</p><p className="game-over-copy mt-2 text-sm font-extrabold text-white sm:text-lg">Acertaste <strong className="text-cyan-300">{correct} de {activeQuestions.length}</strong> preguntas.</p><p className="game-over-copy mt-3 max-w-3xl text-sm font-bold leading-7 text-white sm:text-base sm:leading-8">Revisa los puntos clave de la teoría y vuelve a intentarlo. Cada distractor representa una idea que vale la pena comprender.</p>
          <div className="mt-6 flex w-full max-w-xl flex-col gap-2"><button type="button" onClick={restart} className="game-over-choice game-over-choice-yes"><span aria-hidden="true" className="game-over-cursor">▶</span><span>YES</span><span className="game-over-choice-detail">REPETIR CON PREGUNTAS NUEVAS</span></button><button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setStage("theory"); setFinished(false); setLost(false); setRewardOpen(false); }} className="game-over-choice game-over-choice-no"><span className="game-over-cursor game-over-cursor-hidden" aria-hidden="true">▶</span><span>NO</span><span className="game-over-choice-detail">REPASAR TEORÍA</span></button></div>
          <p className="pixel-font mt-7 text-[9px] tracking-[.1em] text-white/75 sm:mt-9 sm:text-[11px]">PEAKSCORE · CONTINÚA LA AVENTURA</p>
        </div>
      </div>}
      <XpRewardAnimation open={rewardOpen && finished && !lost} xp={60} nextLabel="SIGUIENTE NIVEL" onContinue={() => { setRewardOpen(false); window.location.href = "/aprender/santuario-de-la-materia"; }} />
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#344054] bg-[#142033]/[.98] backdrop-blur">
        <div className="mx-auto flex min-h-[62px] max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-7">
          <div><p className="pixel-font text-[8px] text-slate-100">NIVEL 3</p><p className="mt-1 text-[10px] text-slate-400">{stage === "theory" ? "Teoría" : finished ? "Práctica finalizada" : `Pregunta ${index + 1} / ${questions.length}`}</p></div>
          <div className="flex flex-1 justify-center">{stage === "practice" && !finished && <button type="button" onClick={() => { playSound("navigation.mp3", 0.16); setTutorOpen((v) => !v); }} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border-2 border-[#ffb347] bg-[#ff9f1c] px-3 py-2 font-bold text-[#251300] shadow-[3px_3px_0_#9a4e00] transition hover:bg-[#ffb84d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:min-h-10 sm:px-4"><span aria-hidden="true">🤖</span><span className="pixel-font text-[8px]">AI</span></button>}</div>
          {stage === "theory" ? <button type="button" onClick={() => setStage("practice")} className="inline-flex min-h-9 items-center gap-2 border border-emerald-300/60 bg-[#75df55] px-4 py-2 text-xs font-extrabold text-[#09200a]">Ir a la práctica <ArrowRight className="h-4 w-4" /></button> : <button type="button" onClick={() => setStage("theory")} className="inline-flex min-h-9 items-center gap-2 border border-white/10 bg-[#1a2235] px-4 py-2 text-xs font-semibold text-slate-200"><ArrowLeft className="h-4 w-4" /> Volver a teoría</button>}
        </div>
      </footer>
      <style jsx global>{`
        .game-over-overlay { position: fixed; top: 68px; right: 0; bottom: 0; left: 0; z-index: 40; min-height: calc(100dvh - 68px); padding: clamp(1rem, 3vh, 2.5rem) clamp(1rem, 4vw, 3rem); background: linear-gradient(180deg, rgba(2,5,13,.32) 0%, rgba(2,5,13,.50) 48%, rgba(0,0,0,.78) 100%), url("/images/aprender/santuario/game-over-laboratorio.png") center center / cover no-repeat, #020308 !important; isolation: isolate; }
        .game-over-content { animation: game-over-enter 520ms cubic-bezier(.2,.8,.2,1) both; }
        .game-over-pixels { z-index:-2; opacity:.28; background-image: radial-gradient(circle, rgba(255,40,74,.95) 0 2px, transparent 2.8px), radial-gradient(circle, rgba(44,187,255,.8) 0 1.5px, transparent 2.4px), linear-gradient(155deg, transparent 0 42%, rgba(125,16,43,.13) 42.2% 42.7%, transparent 43% 100%); background-size:83px 91px,127px 113px,100% 100%; animation:game-over-pixel-drift 8s linear infinite; }
        .game-over-crystal-glow { z-index:-1; background:radial-gradient(ellipse at 12% 72%,rgba(255,20,58,.23),transparent 28%),radial-gradient(ellipse at 88% 72%,rgba(255,20,58,.24),transparent 29%),radial-gradient(ellipse at 50% 12%,rgba(18,113,196,.14),transparent 35%); animation:game-over-crystal-pulse 3.6s ease-in-out infinite; }
        .game-over-heading { display:flex; align-items:center; gap:.3rem; filter:drop-shadow(0 0 22px rgba(20,210,255,.2)); }
        .game-over-title { color:#f8fafc; font-size:clamp(2.7rem,9.8vw,8rem); line-height:1.12; letter-spacing:-.065em; text-shadow:5px 5px 0 #155e75,9px 9px 0 #0b1220,0 0 30px rgba(34,211,238,.32); }
        .game-over-nova { image-rendering:pixelated; filter:drop-shadow(0 0 20px rgba(132,204,22,.42)); animation:game-over-nova-idle 2.2s steps(2,end) infinite; }
        .game-over-choice { position:relative; display:flex; width:100%; min-height:42px; align-items:center; justify-content:center; gap:.65rem; padding:.7rem .9rem; color:#e2e8f0; background:transparent; border:0; font-family:var(--font-press-start),"Press Start 2P",monospace; font-size:10px; letter-spacing:.04em; text-align:center; transition:color 140ms ease,transform 140ms ease,text-shadow 140ms ease; }
        .game-over-choice:hover,.game-over-choice:focus-visible { color:#a5f3fc; transform:translateX(3px); outline:none; text-shadow:0 0 14px rgba(34,211,238,.4); }
        .game-over-choice-yes { color:#a5f3fc; } .game-over-cursor { color:#22d3ee; font-size:11px; } .game-over-cursor-hidden { opacity:0; }
        .game-over-choice-detail { margin-left:.2rem; color:#94a3b8; font-family:Arial,Helvetica,sans-serif; font-size:clamp(13px,1.1vw,16px); font-weight:700; letter-spacing:.02em; }
        .game-over-copy { font-family:var(--font-press-start),"Press Start 2P",monospace !important; font-size:clamp(9px,1vw,13px) !important; font-weight:900 !important; line-height:2.15 !important; color:#fff !important; text-shadow:1px 1px 0 #080d18,2px 2px 0 rgba(0,0,0,.96),0 0 5px rgba(0,0,0,.95); }
        @keyframes game-over-enter { from {opacity:0;transform:translateY(10px) scale(.97)} to {opacity:1;transform:translateY(0) scale(1)} }
        @keyframes game-over-pixel-drift { from {background-position:8px 12px,42px 57px,center} to {background-position:91px 103px,-85px 170px,center} }
        @keyframes game-over-crystal-pulse { 0%,100% {opacity:.72;transform:scale(1)} 50% {opacity:1;transform:scale(1.025)} }
        @keyframes game-over-nova-idle { 0%,100% {transform:translateY(0)} 50% {transform:translateY(-3px)} }
        @media(max-width:640px) { .game-over-title {letter-spacing:-.075em;font-size:clamp(2.2rem,10.5vw,4.8rem)} .game-over-content {padding-top:1rem;padding-bottom:1rem} .game-over-choice {min-height:62px;font-size:12px;flex-wrap:wrap} .game-over-choice-detail {flex-basis:100%;margin-left:0;font-size:13px} }
        @media(prefers-reduced-motion:reduce) { .game-over-content,.game-over-pixels,.game-over-nova {animation:none!important} }
      `}</style>
    </main>
  );
}
