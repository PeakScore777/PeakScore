export type EvidenceSubject = "Biología" | "Física" | "Química" | "Ciencias Naturales";

export type EvidenceCase = {
  id: string;
  subject: EvidenceSubject;
  topic: string;
  competence: "Uso comprensivo" | "Explicación de fenómenos" | "Indagación";
  difficulty: "Alta" | "Alta · datos";
  title: string;
  context: string;
  evidenceLabel: string;
  evidenceRows: { label: string; value: number; displayValue: string }[];
  evidenceUnit: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  hint: string;
};

export const CASE_ZERO_QUESTIONS: EvidenceCase[] = [
  {
    id: "cc-bio-01",
    subject: "Biología",
    topic: "Fotosíntesis · interpretación experimental",
    competence: "Indagación",
    difficulty: "Alta · datos",
    title: "El invernadero silencioso",
    context: "Un equipo mantiene plantas acuáticas de la misma especie en recipientes idénticos. La temperatura, el volumen de agua y la concentración inicial de CO₂ se mantienen constantes. Se cambia únicamente el tiempo de exposición a una lámpara y se mide el oxígeno disuelto producido durante el ensayo.",
    evidenceLabel: "Oxígeno registrado por exposición",
    evidenceRows: [
      { label: "0 horas", value: 0.1, displayValue: "0,1 mg/L" },
      { label: "2 horas", value: 1.8, displayValue: "1,8 mg/L" },
      { label: "4 horas", value: 3.6, displayValue: "3,6 mg/L" },
      { label: "6 horas", value: 3.5, displayValue: "3,5 mg/L" },
    ],
    evidenceUnit: "mg/L de oxígeno",
    question: "¿Cuál conclusión está mejor respaldada por estos resultados, sin afirmar más de lo que permite el experimento?",
    options: [
      "En estas condiciones, aumentar la exposición elevó el oxígeno hasta cerca de 4 horas; después no se observó un incremento adicional.",
      "La luz es el único factor que controla la fotosíntesis en cualquier especie vegetal.",
      "A las 6 horas las plantas dejaron de realizar fotosíntesis por completo.",
      "La concentración inicial de CO₂ necesariamente aumentó mientras se iluminaban los recipientes.",
    ],
    answer: 0,
    explanation: "Los registros aumentan de 0 a 4 horas y luego se mantienen casi iguales. Eso respalda una respuesta que se aproxima a una meseta bajo las condiciones probadas. No demuestra que la luz sea el único factor posible ni que la fotosíntesis se haya detenido. Para estudiar la causa de la meseta sería necesario controlar o medir otros factores, como CO₂ y temperatura.",
    hint: "Compara la tendencia de 0 a 4 horas con la diferencia entre 4 y 6 horas."
  },
  {
    id: "cc-bio-02",
    subject: "Biología",
    topic: "Enzimas · variables y condiciones",
    competence: "Explicación de fenómenos",
    difficulty: "Alta · datos",
    title: "La reacción que perdió velocidad",
    context: "En un laboratorio se mide la velocidad de una reacción catalizada por una enzima. En todos los ensayos se usa la misma cantidad de enzima y sustrato; solo cambia la temperatura. El equipo espera hasta que la reacción alcanza una velocidad estable y registra el resultado.",
    evidenceLabel: "Velocidad relativa de reacción",
    evidenceRows: [
      { label: "10 °C", value: 2, displayValue: "2 unidades" },
      { label: "20 °C", value: 5, displayValue: "5 unidades" },
      { label: "30 °C", value: 9, displayValue: "9 unidades" },
      { label: "40 °C", value: 6, displayValue: "6 unidades" },
      { label: "50 °C", value: 1, displayValue: "1 unidad" },
    ],
    evidenceUnit: "unidades por minuto",
    question: "¿Qué explicación concuerda mejor con el patrón observado?",
    options: [
      "La enzima tiene una velocidad máxima cercana a 30 °C en las condiciones ensayadas; a temperaturas mayores puede perder actividad por cambios en su estructura.",
      "El sustrato desaparece siempre a 30 °C, por lo que ya no puede reaccionar a 40 °C.",
      "La temperatura no afecta la velocidad porque todas las muestras contienen la misma cantidad de enzima.",
      "Los datos prueban que cualquier enzima del organismo humano funciona mejor exactamente a 30 °C.",
    ],
    answer: 0,
    explanation: "La velocidad sube hasta 30 °C y luego cae. Es compatible con una temperatura óptima para esta enzima y con pérdida de actividad a temperaturas altas, que pueden alterar la estructura proteica. La conclusión se limita a las condiciones y a la enzima estudiada; no se generaliza a todas las enzimas.",
    hint: "Busca el valor máximo y observa qué ocurre al superar esa temperatura."
  },
  {
    id: "cc-bio-03",
    subject: "Biología",
    topic: "Osmosis · interpretación de resultados",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "Las muestras encogidas",
    context: "Un grupo corta cilindros de papa de igual tamaño, mide su masa inicial y los deja el mismo tiempo en soluciones con diferentes concentraciones de sal. Luego seca suavemente la superficie y calcula el cambio porcentual de masa.",
    evidenceLabel: "Cambio de masa de los cilindros",
    evidenceRows: [
      { label: "0 % de sal", value: 12, displayValue: "+12 %" },
      { label: "1 % de sal", value: 4, displayValue: "+4 %" },
      { label: "2 % de sal", value: 0, displayValue: "0 %" },
      { label: "4 % de sal", value: -10, displayValue: "−10 %" },
    ],
    evidenceUnit: "variación porcentual de masa",
    question: "¿Qué interpretación explica mejor que la masa no cambie aproximadamente en la solución de 2 %?",
    options: [
      "La solución tiene una concentración efectiva cercana a la del interior del tejido, por lo que no hay flujo neto apreciable de agua.",
      "La membrana celular deja de permitir el paso del agua cuando aparece sal.",
      "La papa produce agua nueva para compensar exactamente la masa perdida.",
      "La sal entra a las células y convierte directamente toda su masa en agua.",
    ],
    answer: 0,
    explanation: "En ósmosis, el agua cruza una membrana selectiva según la diferencia de potencial hídrico. Cerca del punto isotónico, la entrada y salida de agua se equilibran y el cambio neto de masa es cercano a cero. Esto no significa que el agua deje de moverse, sino que no hay un flujo neto importante.",
    hint: "El valor cercano a cero identifica la condición donde la entrada y la salida se equilibran."
  },
  {
    id: "cc-bio-04",
    subject: "Biología",
    topic: "Genética mendeliana · probabilidad",
    competence: "Uso comprensivo",
    difficulty: "Alta",
    title: "El rasgo oculto",
    context: "En una especie ficticia, el alelo A determina pigmentación normal y domina sobre el alelo a, que produce un rasgo recesivo. Dos individuos heterocigotos (Aa) se cruzan. Supón segregación mendeliana y que los genotipos de los descendientes son igualmente probables.",
    evidenceLabel: "Cruce parental",
    evidenceRows: [
      { label: "Progenitor 1", value: 1, displayValue: "Aa" },
      { label: "Progenitor 2", value: 1, displayValue: "Aa" },
    ],
    evidenceUnit: "genotipo",
    question: "¿Cuál es la probabilidad de que un descendiente exprese el rasgo recesivo?",
    options: [
      "0 %, porque ambos progenitores presentan pigmentación normal.",
      "25 %, porque solo el genotipo aa expresa el rasgo recesivo.",
      "50 %, porque la mitad de los alelos heredados son a.",
      "75 %, porque tres de las cuatro combinaciones presentan al menos una A.",
    ],
    answer: 1,
    explanation: "Cada progenitor aporta A o a. El cuadro de Punnett produce AA, Aa, Aa y aa. Solo una de las cuatro combinaciones es aa, por lo que la probabilidad es 1/4 = 25 %. La apariencia de los progenitores no impide que porten un alelo recesivo.",
    hint: "Escribe las cuatro combinaciones posibles antes de calcular la proporción."
  },
  {
    id: "cc-phy-01",
    subject: "Física",
    topic: "Cinemática · cambio de velocidad",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "El vehículo de prueba",
    context: "Un carrito se mueve en línea recta. Un sensor registra su velocidad en intervalos iguales. Se considera despreciable la fricción durante el tramo medido y las lecturas presentan el siguiente patrón.",
    evidenceLabel: "Velocidad medida por el sensor",
    evidenceRows: [
      { label: "0 s", value: 0, displayValue: "0 m/s" },
      { label: "1 s", value: 3, displayValue: "3 m/s" },
      { label: "2 s", value: 6, displayValue: "6 m/s" },
      { label: "3 s", value: 9, displayValue: "9 m/s" },
    ],
    evidenceUnit: "velocidad",
    question: "Si el patrón se mantiene durante ese intervalo, ¿cuál es la aceleración del carrito?",
    options: ["1 m/s²", "3 m/s²", "6 m/s²", "9 m/s²"],
    answer: 1,
    explanation: "La aceleración es el cambio de velocidad dividido por el tiempo transcurrido. Entre 0 y 3 s, la velocidad pasa de 0 a 9 m/s: a = (9 − 0) / 3 = 3 m/s². La velocidad aumenta 3 m/s cada segundo, lo que coincide con una aceleración constante.",
    hint: "Calcula cuánto cambia la velocidad total y divide por el tiempo total, no por la velocidad final."
  },
  {
    id: "cc-phy-02",
    subject: "Física",
    topic: "Electricidad · ley de Ohm",
    competence: "Explicación de fenómenos",
    difficulty: "Alta · datos",
    title: "La corriente desaparecida",
    context: "Un técnico conecta resistencias distintas a la misma fuente ideal de 12 V. Mide la corriente en cada circuito y mantiene constantes las demás condiciones del montaje.",
    evidenceLabel: "Corriente para una fuente de 12 V",
    evidenceRows: [
      { label: "2 Ω", value: 6, displayValue: "6 A" },
      { label: "4 Ω", value: 3, displayValue: "3 A" },
      { label: "6 Ω", value: 2, displayValue: "2 A" },
      { label: "12 Ω", value: 1, displayValue: "1 A" },
    ],
    evidenceUnit: "intensidad de corriente",
    question: "¿Qué relación entre resistencia y corriente está respaldada por los datos?",
    options: [
      "Con voltaje constante, la corriente disminuye cuando aumenta la resistencia, de acuerdo con I = V/R.",
      "La corriente aumenta siempre en la misma proporción que la resistencia.",
      "La resistencia no afecta la corriente; las diferencias se deben solo al orden de medición.",
      "El voltaje aumenta con cada resistencia, aunque la fuente se mantuvo en 12 V.",
    ],
    answer: 0,
    explanation: "Con V constante, la ley de Ohm establece I = V/R. Al duplicar la resistencia de 2 Ω a 4 Ω, la corriente baja de 6 A a 3 A; al duplicarla otra vez a 8 Ω se esperaría la mitad, y la tabla mantiene la relación inversa. El voltaje no cambió según el montaje descrito.",
    hint: "Verifica si el producto entre voltaje y corriente o la razón V/I se mantiene conforme cambia R."
  },
  {
    id: "cc-phy-03",
    subject: "Física",
    topic: "Transferencia de calor · diseño experimental",
    competence: "Indagación",
    difficulty: "Alta · datos",
    title: "El recipiente que conserva energía",
    context: "Se vierte agua a 80 °C en recipientes idénticos, con igual volumen y tapa. Cada recipiente tiene un material aislante diferente. Tras diez minutos en el mismo salón, se mide la temperatura final. El salón permanece a 22 °C.",
    evidenceLabel: "Temperatura tras diez minutos",
    evidenceRows: [
      { label: "Sin aislante", value: 48, displayValue: "48 °C" },
      { label: "Tela", value: 57, displayValue: "57 °C" },
      { label: "Corcho", value: 64, displayValue: "64 °C" },
    ],
    evidenceUnit: "temperatura final",
    question: "¿Cuál afirmación interpreta mejor el resultado sin confundir temperatura con cantidad total de energía?",
    options: [
      "El corcho redujo más la pérdida de temperatura durante el intervalo, bajo las condiciones probadas.",
      "El corcho produjo energía térmica adicional dentro del recipiente.",
      "El recipiente sin aislante conserva más calor porque la temperatura ambiente es menor que la del agua.",
      "La tela es mejor aislante porque su temperatura final es menor que la del corcho.",
    ],
    answer: 0,
    explanation: "Los recipientes parten de la misma temperatura y volumen. El que termina a mayor temperatura perdió menos temperatura durante esos diez minutos. Eso indica mejor aislamiento relativo en este ensayo; no que el corcho haya generado energía. El diseño controlado permite comparar los materiales porque las demás condiciones se mantuvieron iguales.",
    hint: "Compara cuánto se aleja cada recipiente de los 80 °C iniciales."
  },
  {
    id: "cc-che-01",
    subject: "Química",
    topic: "Conservación de la masa · sistema cerrado",
    competence: "Uso comprensivo",
    difficulty: "Alta",
    title: "El matraz sellado",
    context: "Dos sustancias reaccionan dentro de un matraz herméticamente cerrado. Antes de iniciar la reacción, la masa total del sistema es de 86 g. Después de que la reacción termina, el matraz continúa cerrado y se pesa con el mismo instrumento.",
    evidenceLabel: "Masa total del sistema",
    evidenceRows: [
      { label: "Antes", value: 86, displayValue: "86 g" },
      { label: "Después", value: 86, displayValue: "86 g" },
    ],
    evidenceUnit: "masa",
    question: "¿Qué conclusión explica correctamente que la masa total no haya cambiado?",
    options: [
      "En el sistema cerrado se conserva la masa total; los átomos se reorganizan para formar productos.",
      "La reacción no ocurrió, porque toda reacción química debe reducir la masa.",
      "Los reactivos dejaron de tener átomos y los productos se crearon de la nada.",
      "La masa solo se conserva en cambios físicos, nunca en cambios químicos.",
    ],
    answer: 0,
    explanation: "En una reacción química ordinaria, los átomos se reorganizan; no desaparecen ni se crean. En un sistema cerrado la masa total se conserva. En un sistema abierto, gases que entran o salen pueden hacer que la masa medida del recipiente y su contenido cambie, sin contradecir la conservación en el conjunto de la materia.",
    hint: "El matraz no permite que sustancias entren o salgan: piensa en los átomos que ya estaban dentro."
  },
  {
    id: "cc-che-02",
    subject: "Química",
    topic: "Soluciones · concentración",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "La solución más concentrada",
    context: "Dos equipos preparan soluciones de la misma sustancia a la misma temperatura. El primer equipo disuelve 10 g de soluto y completa hasta 200 mL de solución. El segundo disuelve 20 g y completa hasta el mismo volumen final. No se produce reacción química.",
    evidenceLabel: "Soluto disuelto por volumen final",
    evidenceRows: [
      { label: "Solución A", value: 10, displayValue: "10 g / 200 mL" },
      { label: "Solución B", value: 20, displayValue: "20 g / 200 mL" },
    ],
    evidenceUnit: "masa de soluto",
    question: "¿Cómo se comparan las concentraciones en masa por volumen de ambas soluciones?",
    options: [
      "La solución B tiene el doble de concentración que la A.",
      "Las dos tienen la misma concentración porque ocupan el mismo volumen.",
      "La solución A tiene el doble de concentración porque contiene menos soluto.",
      "No se pueden comparar aunque se conozcan la masa del soluto y el volumen final.",
    ],
    answer: 0,
    explanation: "La concentración en masa por volumen se calcula como masa de soluto dividida entre volumen final. A: 10 g / 0,2 L = 50 g/L. B: 20 g / 0,2 L = 100 g/L. La solución B tiene el doble de concentración porque contiene el doble de soluto en el mismo volumen final.",
    hint: "Convierte 200 mL a 0,2 L y divide la masa de soluto por el volumen final."
  },
  {
    id: "cc-nat-01",
    subject: "Ciencias Naturales",
    topic: "Indagación · grupo control y variables",
    competence: "Indagación",
    difficulty: "Alta",
    title: "El fertilizante sospechoso",
    context: "Una estudiante quiere determinar si un fertilizante aumenta el crecimiento de una planta. Distribuye al azar plantas de la misma especie y edad en grupos, usa recipientes y suelo iguales, y mantiene el agua y la iluminación constantes. Cada grupo recibe una dosis diferente.",
    evidenceLabel: "Altura media tras tres semanas",
    evidenceRows: [
      { label: "0 g de fertilizante", value: 10, displayValue: "10 cm" },
      { label: "10 g de fertilizante", value: 14, displayValue: "14 cm" },
      { label: "20 g de fertilizante", value: 18, displayValue: "18 cm" },
      { label: "40 g de fertilizante", value: 12, displayValue: "12 cm" },
    ],
    evidenceUnit: "altura media",
    question: "¿Cuál conclusión es la más sólida a partir de los datos obtenidos?",
    options: [
      "En las condiciones evaluadas, las dosis tuvieron resultados diferentes y la dosis mayor probada no produjo el mayor crecimiento.",
      "Cualquier cantidad de fertilizante aumenta el crecimiento indefinidamente.",
      "El fertilizante es la única variable que puede afectar el crecimiento de cualquier planta.",
      "La dosis de 20 g es óptima para todas las especies y todos los tipos de suelo.",
    ],
    answer: 0,
    explanation: "Los grupos tratados no muestran una relación lineal creciente: la altura media sube hasta 20 g y luego baja con 40 g. El grupo de 0 g sirve como comparación. Los resultados apoyan una conclusión limitada a esta especie, duración y condiciones; no bastan para declarar una dosis universal óptima.",
    hint: "Compara el grupo sin fertilizante con todas las dosis y evita generalizar más allá de las plantas estudiadas."
  },
  {
    id: "cc-nat-02",
    subject: "Ciencias Naturales",
    topic: "Ecología · correlación y causalidad",
    competence: "Explicación de fenómenos",
    difficulty: "Alta",
    title: "La laguna sin peces",
    context: "Después de que una granja comienza a descargar agua en una quebrada, una comunidad registra menos peces en una laguna cercana. El equipo toma una muestra en un punto antes de la descarga y otra aguas abajo durante una sola mañana. No dispone de datos históricos ni de mediciones en otras quebradas.",
    evidenceLabel: "Oxígeno disuelto medido",
    evidenceRows: [
      { label: "Antes de descarga", value: 8.1, displayValue: "8,1 mg/L" },
      { label: "Aguas abajo", value: 3.2, displayValue: "3,2 mg/L" },
    ],
    evidenceUnit: "oxígeno disuelto",
    question: "¿Qué acción investigativa permitiría evaluar mejor si la descarga está relacionada con la disminución de peces?",
    options: [
      "Repetir mediciones en varios momentos y comparar puntos aguas arriba y abajo, junto con sitios de control sin descarga.",
      "Concluir de inmediato que la granja es la única causa porque el oxígeno aguas abajo es menor.",
      "Medir únicamente el color del agua una vez y usarlo como prueba definitiva.",
      "Eliminar todas las plantas acuáticas para comprobar si los peces regresan.",
    ],
    answer: 0,
    explanation: "La diferencia de oxígeno es una señal relevante, pero una medición puntual no prueba por sí sola causalidad ni descarta otras variables. Mediciones repetidas y sitios de control ayudan a distinguir cambios asociados a la descarga de variaciones estacionales, temperatura, caudal u otras fuentes de contaminación.",
    hint: "Una investigación sólida compara más de un momento y más de un lugar para descartar explicaciones alternativas."
  },
  {
    id: "cc-che-03",
    subject: "Química",
    topic: "Separación de mezclas · propiedades físicas",
    competence: "Uso comprensivo",
    difficulty: "Alta",
    title: "La muestra contaminada",
    context: "Una muestra sólida contiene limaduras de hierro, arena y cloruro de sodio. El equipo debe recuperar cada componente sin transformar químicamente las sustancias. Dispone de un imán, agua, un filtro y un equipo para evaporar el agua.",
    evidenceLabel: "Propiedades disponibles",
    evidenceRows: [
      { label: "Limaduras de hierro", value: 3, displayValue: "Atraídas por imán" },
      { label: "Arena", value: 2, displayValue: "No disuelta en agua" },
      { label: "Sal", value: 1, displayValue: "Disuelta en agua" },
    ],
    evidenceUnit: "propiedad física",
    question: "¿Cuál secuencia permite separar los tres componentes usando las propiedades indicadas?",
    options: [
      "Retirar el hierro con el imán, añadir agua, filtrar la arena y evaporar el agua de la solución salina.",
      "Evaporar primero toda la mezcla sólida, filtrar el residuo y luego atraer la arena con el imán.",
      "Filtrar la mezcla seca para separar los tres sólidos y usar agua solo para recuperar el hierro.",
      "Añadir agua para disolver los tres componentes, luego usar un imán para recuperar la sal.",
    ],
    answer: 0,
    explanation: "El hierro se separa por magnetismo. El agua disuelve la sal pero no la arena; la filtración retiene la arena y deja pasar la solución salina. Finalmente se evapora el agua para recuperar la sal. La secuencia se basa en propiedades físicas y no requiere una reacción química.",
    hint: "Primero aprovecha la propiedad que distingue al hierro, luego diferencia lo soluble de lo insoluble."
  },
];

export const CASE_ZERO_GAME_KEY = "caso-cero";
