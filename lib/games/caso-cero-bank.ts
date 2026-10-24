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
      "En estas condiciones, el oxígeno aumentó hasta 4 horas y luego cambió muy poco; los datos no identifican por sí solos qué factor produjo la meseta.",
      "La producción de oxígeno fue proporcional al tiempo durante todo el intervalo, porque la lectura a las 6 horas sigue por encima de la inicial.",
      "La diferencia entre 4 y 6 horas demuestra que la respiración superó a la fotosíntesis en el último intervalo.",
      "Los resultados demuestran que el CO₂ dejó de limitar la fotosíntesis después de 4 horas.",
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
      "La solución externa es hipotónica respecto al tejido, así que el agua debe entrar y aumentar su masa.",
      "La solución externa es hipertónica, por lo que debería salir agua y disminuir la masa del tejido.",
      "La masa se mantiene porque la membrana deja de ser selectiva y permite que el soluto se distribuya por igual sin intercambio de agua.",
    ],
    answer: 0,
    explanation: "En ósmosis, el agua cruza una membrana selectiva según la diferencia de potencial hídrico. Cerca del punto isotónico, la entrada y salida de agua se equilibran y el cambio neto de masa es cercano a cero. Esto no significa que el agua deje de moverse, sino que no hay un flujo neto importante.",
    hint: "El valor cercano a cero identifica la condición donde la entrada y la salida se equilibran."
  },
  {
    id: "cc-bio-04",
    subject: "Biología",
    topic: "Genética mendeliana · probabilidad conjunta",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "El rasgo doble",
    context: "En una especie ficticia, A domina sobre a y B domina sobre b. Los dos genes se encuentran en loci distintos y segregan independientemente. Se cruzan dos individuos AaBb. Se considera que cada combinación de gametos tiene la misma probabilidad.",
    evidenceLabel: "Genotipos parentales",
    evidenceRows: [
      { label: "Progenitor 1", value: 1, displayValue: "AaBb" },
      { label: "Progenitor 2", value: 1, displayValue: "AaBb" },
    ],
    evidenceUnit: "genotipo",
    question: "¿Qué probabilidad tiene un descendiente de expresar simultáneamente ambos rasgos recesivos?",
    options: [
      "1/4, porque cada progenitor puede transmitir dos alelos recesivos.",
      "1/8, porque solo una combinación de cada ocho produce ambos rasgos.",
      "1/16, porque se requiere aa y bb y los dos eventos son independientes.",
      "3/16, porque basta con que aparezca al menos un alelo recesivo en cada gen.",
    ],
    answer: 2,
    explanation: "Para expresar el primer rasgo recesivo se requiere aa, con probabilidad 1/4. Para el segundo se requiere bb, también con probabilidad 1/4. Como los loci segregan independientemente, la probabilidad conjunta es (1/4) × (1/4) = 1/16. No basta con portar un alelo recesivo: el fenotipo recesivo exige dos copias recesivas en cada locus.",
    hint: "Calcula por separado la probabilidad de aa y la de bb; después combina ambos eventos independientes."
  },
  {
    id: "cc-phy-01",
    subject: "Física",
    topic: "Cinemática · área bajo la gráfica velocidad-tiempo",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "El vehículo de prueba",
    context: "Un carrito avanza en línea recta y un sensor registra su velocidad. Entre cada par de mediciones, la velocidad cambia uniformemente. La fricción es despreciable durante el tramo estudiado.",
    evidenceLabel: "Velocidad medida por el sensor",
    evidenceRows: [
      { label: "0 s", value: 0, displayValue: "0 m/s" },
      { label: "1 s", value: 3, displayValue: "3 m/s" },
      { label: "2 s", value: 6, displayValue: "6 m/s" },
      { label: "3 s", value: 9, displayValue: "9 m/s" },
    ],
    evidenceUnit: "velocidad",
    question: "¿Cuál es el desplazamiento del carrito durante los primeros 3 segundos?",
    options: ["9 m", "13,5 m", "18 m", "27 m"],
    answer: 1,
    explanation: "El desplazamiento corresponde al área bajo la gráfica velocidad-tiempo. Como la velocidad aumenta uniformemente de 0 a 9 m/s en 3 s, el área es un triángulo: (base × altura)/2 = (3 s × 9 m/s)/2 = 13,5 m. Sumar únicamente las velocidades o multiplicar la velocidad final por todo el intervalo sobreestima el desplazamiento.",
    hint: "Representa los datos en una gráfica velocidad-tiempo. El área del triángulo bajo la recta equivale al desplazamiento."
  },
  {
    id: "cc-phy-02",
    subject: "Física",
    topic: "Electricidad · ley de Ohm y potencia",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "La corriente desaparecida",
    context: "Un técnico conecta resistencias diferentes a una fuente ideal de 12 V. Mide la corriente en cada circuito y mantiene constantes las demás condiciones. Luego necesita estimar la energía disipada por una de las resistencias.",
    evidenceLabel: "Corriente para una fuente de 12 V",
    evidenceRows: [
      { label: "2 Ω", value: 6, displayValue: "6 A" },
      { label: "4 Ω", value: 3, displayValue: "3 A" },
      { label: "6 Ω", value: 2, displayValue: "2 A" },
      { label: "12 Ω", value: 1, displayValue: "1 A" },
    ],
    evidenceUnit: "intensidad de corriente",
    question: "¿Qué potencia eléctrica disipa la resistencia de 6 Ω conectada a la fuente de 12 V?",
    options: ["2 W", "12 W", "24 W", "72 W"],
    answer: 2,
    explanation: "Los datos muestran que la corriente en la resistencia de 6 Ω es 2 A. La potencia puede calcularse con P = I²R: P = (2 A)² × 6 Ω = 24 W. También se obtiene con P = V²/R = 144/6 = 24 W. La corriente y la potencia no son la misma magnitud.",
    hint: "Primero identifica la corriente correspondiente a 6 Ω y aplica P = I²R, o usa directamente P = V²/R."
  },
  {
    id: "cc-phy-03",
    subject: "Física",
    topic: "Transferencia de calor · cálculo energético",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "El recipiente que conserva energía",
    context: "Se vierten 250 g de agua a 80 °C en recipientes idénticos con distintos aislantes. Tras diez minutos en un salón a 22 °C, el agua del recipiente con corcho está a 64 °C. Supón que el calor específico del agua es 4,2 J/(g·°C) y desprecia la energía absorbida por el recipiente.",
    evidenceLabel: "Datos térmicos del ensayo",
    evidenceRows: [
      { label: "Temperatura inicial", value: 80, displayValue: "80 °C" },
      { label: "Temperatura con corcho", value: 64, displayValue: "64 °C" },
      { label: "Masa de agua", value: 250, displayValue: "250 g" },
      { label: "Calor específico", value: 4.2, displayValue: "4,2 J/(g·°C)" },
    ],
    evidenceUnit: "condiciones medidas",
    question: "¿Cuánta energía térmica perdió aproximadamente el agua de ese recipiente durante el intervalo?",
    options: ["8,4 kJ", "16,8 kJ", "42 kJ", "67,2 kJ"],
    answer: 1,
    explanation: "El cambio de temperatura en magnitud es ΔT = 80 − 64 = 16 °C. Con Q = m·c·ΔT, se obtiene Q = 250 g × 4,2 J/(g·°C) × 16 °C = 16 800 J = 16,8 kJ. El signo indica pérdida de energía por parte del agua; el cálculo estima la energía cedida bajo las suposiciones indicadas.",
    hint: "Calcula ΔT y multiplica la masa por el calor específico y por el cambio de temperatura."
  },
  {
    id: "cc-che-01",
    subject: "Química",
    topic: "Conservación de la masa · sistemas abiertos",
    competence: "Explicación de fenómenos",
    difficulty: "Alta · datos",
    title: "El gas que escapó",
    context: "Una reacción se realiza en un recipiente abierto. La masa inicial de los reactivos es 86 g. Al terminar, el residuo sólido pesa 75 g y un sistema de captura permite estimar que escaparon 11 g de producto gaseoso. No se detectan otros productos que entren o salgan del montaje.",
    evidenceLabel: "Balance de masa del ensayo",
    evidenceRows: [
      { label: "Reactivos iniciales", value: 86, displayValue: "86 g" },
      { label: "Residuo final", value: 75, displayValue: "75 g" },
      { label: "Gas liberado", value: 11, displayValue: "11 g" },
    ],
    evidenceUnit: "masa",
    question: "¿Qué interpretación reconcilia estos datos con la conservación de la masa?",
    options: [
      "El residuo pesa menos porque parte de la materia salió como gas; al incluir ese gas, 75 g + 11 g = 86 g.",
      "La masa inicial debería compararse solo con el residuo; el gas liberado ya no forma parte del balance de la reacción.",
      "La diferencia de 11 g corresponde necesariamente a energía liberada como calor, no a materia que salió del recipiente.",
      "La suma de las masas se conserva únicamente si ningún producto cambia de estado durante la reacción.",
    ],
    answer: 0,
    explanation: "En un recipiente abierto puede parecer que la masa disminuye cuando un gas abandona el montaje. La masa del residuo es 75 g y la del gas capturado es 11 g; juntas suman los 86 g iniciales. La conservación se evalúa considerando toda la materia del sistema, incluidos los productos gaseosos.",
    hint: "Haz el balance incluyendo tanto el residuo sólido como el gas que dejó el recipiente."
  },
  {
    id: "cc-che-02",
    subject: "Química",
    topic: "Soluciones · mezcla y dilución",
    competence: "Uso comprensivo",
    difficulty: "Alta · datos",
    title: "La solución más concentrada",
    context: "Se mezclan dos soluciones del mismo soluto sin que ocurra una reacción. La solución A tiene concentración de 0,50 mol/L y volumen de 100 mL; la solución B tiene 1,0 mol/L y volumen de 50 mL. Después de mezclarlas, se añade agua hasta obtener 200 mL de solución final.",
    evidenceLabel: "Soluciones antes de mezclar",
    evidenceRows: [
      { label: "Solución A", value: 0.5, displayValue: "0,50 mol/L · 100 mL" },
      { label: "Solución B", value: 1, displayValue: "1,0 mol/L · 50 mL" },
      { label: "Volumen final", value: 200, displayValue: "200 mL" },
    ],
    evidenceUnit: "concentración y volumen",
    question: "¿Cuál es la concentración molar final después de mezclar y diluir?",
    options: ["0,25 mol/L", "0,50 mol/L", "0,75 mol/L", "1,50 mol/L"],
    answer: 1,
    explanation: "Los moles de A son 0,50 mol/L × 0,100 L = 0,050 mol. Los de B son 1,0 mol/L × 0,050 L = 0,050 mol. La mezcla contiene 0,100 mol en total. Tras diluir a 0,200 L, la concentración final es 0,100/0,200 = 0,50 mol/L. No se promedian las concentraciones sin considerar los volúmenes.",
    hint: "Convierte los volúmenes a litros, calcula los moles de cada solución, súmalos y divide por el volumen final."
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
      "Los datos permiten afirmar que duplicar la dosis de 20 g siempre reduce a la mitad el crecimiento de una planta.",
      "La diferencia entre las alturas demuestra que el fertilizante es el único factor que puede afectar el crecimiento en cualquier especie.",
      "La dosis de 20 g es universalmente óptima, aunque el ensayo solo evaluó una especie, un suelo y tres semanas.",
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
      "Atribuir la disminución de peces a la descarga con certeza, porque una diferencia de oxígeno demuestra causalidad por sí sola.",
      "Medir solo el oxígeno aguas abajo durante varias mañanas, sin comparar con sitios de referencia ni registrar otras variables.",
      "Comparar únicamente el número de peces antes y después, sin controlar cambios de caudal, temperatura ni otras fuentes de contaminación.",
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
      "Añadir agua, filtrar la mezcla completa y evaporar el filtrado; después intentar separar el hierro del residuo con el imán.",
      "Filtrar la mezcla seca para separar los tres sólidos, porque el tamaño de partícula distingue por sí solo hierro, arena y sal.",
      "Disolver la mezcla en agua y destilar todo el líquido; la arena y el hierro pasan ambos al destilado, mientras la sal queda en el recipiente.",
    ],
    answer: 0,
    explanation: "El hierro se separa por magnetismo. El agua disuelve la sal pero no la arena; la filtración retiene la arena y deja pasar la solución salina. Finalmente se evapora el agua para recuperar la sal. La secuencia se basa en propiedades físicas y no requiere una reacción química.",
    hint: "Primero aprovecha la propiedad que distingue al hierro, luego diferencia lo soluble de lo insoluble."
  },
];

export const CASE_ZERO_GAME_KEY = "caso-cero";
