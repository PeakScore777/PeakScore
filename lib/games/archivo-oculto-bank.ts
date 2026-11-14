export type ArchivoCompetency =
  | "Identificar y entender los contenidos locales"
  | "Comprender cómo se articulan las partes de un texto para darle sentido global"
  | "Reflexionar a partir de un texto y evaluar su contenido";

export type ArchivoContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; alt: string; caption?: string; layout?: "float" | "wide" };

export type ArchivoReading = {
  id: string;
  title: string;
  typeLabel: string;
  authorLabel: string;
  contentBlocks?: ArchivoContentBlock[];
  paragraphs?: string[];
};

export type ArchivoQuestion = {
  id: string;
  readingId: string;
  competency: ArchivoCompetency;
  competencyShort: string;
  difficulty: "Fácil" | "Media" | "Alta";
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const ARCHIVO_OCULTO_READINGS: ArchivoReading[] = [
  {
    id: "ciudad-que-camina",
    title: "La ciudad que decidió caminar",
    typeLabel: "Texto argumentativo",
    authorLabel: "Texto original de práctica · PeakScore",
    paragraphs: [
      "Durante años, muchas ciudades midieron su progreso por la velocidad con la que los automóviles podían atravesarlas. Se ampliaron avenidas, se construyeron pasos elevados y se redujeron andenes para ganar espacio a los vehículos. Sin embargo, una calle no es solamente un corredor para desplazarse: también es el lugar donde las personas esperan el bus, conversan, compran, juegan y se encuentran.",
      "Cuando un barrio recupera espacio para caminar, los cambios no se limitan a que haya menos carros. Un andén amplio permite que una persona mayor avance sin esquivar obstáculos; una esquina con buena visibilidad facilita el cruce de quien lleva un coche infantil; una banca ofrece descanso a quien no puede recorrer largas distancias. La movilidad peatonal, por tanto, también es una cuestión de autonomía y de acceso a la ciudad.",
      "Esto no significa que todos los viajes puedan hacerse a pie ni que el automóvil deba desaparecer de un día para otro. Hay personas que viven lejos de sus trabajos, cargan mercancías o necesitan desplazarse con herramientas. La transformación requiere transporte público frecuente, rutas seguras para bicicletas y conexiones entre distintos medios. Si esas alternativas no existen, restringir el tránsito puede trasladar el problema a quienes tienen menos opciones.",
      "Algunas administraciones han comenzado con intervenciones pequeñas: cerrar una calle al tráfico durante ciertas horas, ampliar una esquina o conectar un parque con una estación de transporte. Estas pruebas permiten observar quién usa el espacio, qué dificultades aparecen y qué ajustes hacen falta. Su valor no está en demostrar que una única solución sirve para todos los barrios, sino en convertir la experiencia cotidiana de sus habitantes en información para decidir.",
      "Una ciudad caminable no se reconoce únicamente por la cantidad de calles peatonales que inaugura. Se reconoce por la posibilidad real de que personas distintas puedan llegar a sus destinos con seguridad, sin depender siempre de un vehículo particular. La pregunta importante, entonces, no es cuántos automóviles caben en una avenida, sino a quién permite llegar y a quién deja por fuera."
    ],
  },
  {
    id: "valor-de-reparar",
    title: "El valor de reparar",
    typeLabel: "Texto expositivo-argumentativo",
    authorLabel: "Texto original de práctica · PeakScore",
    paragraphs: [
      "En muchos hogares, un aparato deja de utilizarse no porque haya perdido toda su utilidad, sino porque reparar una pieza parece más difícil que comprar otro. Un teléfono con la pantalla rota, una licuadora con un interruptor dañado o una lámpara que necesita un cable nuevo pueden terminar almacenados o convertirse en residuos, aunque una parte importante de sus componentes todavía funcione.",
      "La reparación suele presentarse como una decisión individual: comparar precios, buscar un técnico y decidir si vale la pena conservar el objeto. Pero esa elección depende también de cómo se diseñan y comercializan los productos. Cuando no se consiguen repuestos, los manuales no están disponibles o abrir un dispositivo exige herramientas especiales, el consumidor tiene menos posibilidades de prolongar su vida útil.",
      "A este escenario se suma la obsolescencia percibida: la sensación de que un producto ya no sirve o dejó de ser adecuado, aunque todavía cumpla su función. Un modelo nuevo puede ofrecer mejoras reales, pero también puede hacer que el anterior parezca anticuado por cambios de apariencia, publicidad o presión social. Distinguir entre una necesidad concreta y el deseo de reemplazar algo es parte de una decisión informada.",
      "Promover la reparación no consiste en conservar cualquier objeto a toda costa. Hay equipos cuyo consumo energético es demasiado alto, piezas cuya seguridad está comprometida o arreglos que cuestan más que una alternativa eficiente. La pregunta debe considerar el estado del aparato, la disponibilidad de repuestos, el costo, la seguridad y los materiales que se evitarían desechar.",
      "Por eso, alargar la vida de los productos no depende únicamente de que cada persona sea cuidadosa. También requiere que fabricantes faciliten información y repuestos, que existan servicios técnicos accesibles y que las políticas de residuos reconozcan el valor de recuperar materiales. Reparar puede ser una práctica cotidiana, pero sus posibilidades se deciden a lo largo de toda la cadena de producción y consumo."
    ],
  },
];

export const ARCHIVO_OCULTO_QUESTIONS: ArchivoQuestion[] = [
  {
    id: "ao-001", readingId: "ciudad-que-camina",
    competency: "Comprender cómo se articulan las partes de un texto para darle sentido global",
    competencyShort: "Sentido global", difficulty: "Media",
    prompt: "¿Cuál es la idea central que desarrolla el texto?",
    options: [
      "Las ciudades deberían eliminar todos los automóviles para recuperar sus calles.",
      "La movilidad peatonal debe entenderse como acceso al espacio urbano y planearse junto con otras formas de transporte.",
      "Las intervenciones pequeñas son más económicas que cualquier obra de transporte público.",
      "La velocidad de los automóviles es el indicador más confiable del progreso de una ciudad."
    ],
    answer: 1,
    explanation: "El texto sostiene que caminar no es solo desplazarse: permite acceder a servicios y espacios urbanos. También aclara que esa transformación requiere alternativas de transporte y decisiones ajustadas a cada barrio. Por eso no propone eliminar todos los vehículos ni medir el progreso por su velocidad."
  },
  {
    id: "ao-002", readingId: "ciudad-que-camina",
    competency: "Reflexionar a partir de un texto y evaluar su contenido",
    competencyShort: "Evaluación", difficulty: "Alta",
    prompt: "¿Qué situación pondría en mayor dificultad la propuesta que defiende el autor?",
    options: [
      "Un barrio amplía sus andenes y conserva zonas para sentarse.",
      "Una calle se cierra unas horas para observar cómo la usan sus habitantes.",
      "Se restringe el tránsito en una zona sin ofrecer transporte público frecuente ni conexiones alternativas.",
      "Una esquina se modifica para facilitar el cruce de personas con movilidad reducida."
    ],
    answer: 2,
    explanation: "El tercer párrafo advierte que restringir el tránsito sin alternativas puede trasladar el problema a quienes tienen menos opciones. La situación descrita contradice una condición explícita de la propuesta: combinar el espacio peatonal con transporte público y conexiones seguras."
  },
  {
    id: "ao-003", readingId: "ciudad-que-camina",
    competency: "Identificar y entender los contenidos locales",
    competencyShort: "Contenido local", difficulty: "Fácil",
    prompt: "En el primer párrafo, la expresión «Sin embargo» introduce una relación de",
    options: [
      "contraste entre la visión de la calle como vía para automóviles y su función como espacio de encuentro.",
      "causa entre la ampliación de avenidas y el aumento de los andenes.",
      "consecuencia entre la velocidad de los vehículos y la construcción de parques.",
      "enumeración de las obras que mejoran el tránsito."
    ],
    answer: 0,
    explanation: "La expresión presenta una idea que contrasta con la anterior. Después de describir la calle como corredor para automóviles, el autor recuerda que también es un espacio para actividades y encuentros cotidianos."
  },
  {
    id: "ao-004", readingId: "ciudad-que-camina",
    competency: "Comprender cómo se articulan las partes de un texto para darle sentido global",
    competencyShort: "Estructura", difficulty: "Media",
    prompt: "¿Qué función cumple el tercer párrafo dentro de la argumentación?",
    options: [
      "Presentar una historia personal que reemplaza las razones del texto.",
      "Negar que caminar pueda aportar beneficios a los habitantes.",
      "Introducir una precisión que evita interpretar la propuesta como una eliminación inmediata de los automóviles.",
      "Enumerar los resultados definitivos de las intervenciones urbanas."
    ],
    answer: 2,
    explanation: "El tercer párrafo introduce límites y condiciones: reconoce que no todos los viajes pueden hacerse a pie y que se necesitan otras opciones. Esa precisión matiza la tesis y evita una interpretación extrema."
  },
  {
    id: "ao-005", readingId: "ciudad-que-camina",
    competency: "Reflexionar a partir de un texto y evaluar su contenido",
    competencyShort: "Reflexión crítica", difficulty: "Alta",
    prompt: "¿Cuál de los siguientes datos respaldaría de manera más directa la postura del autor?",
    options: [
      "El número de automóviles vendidos en el país durante el último año.",
      "La cantidad de pintura utilizada para demarcar las avenidas principales.",
      "La opinión de un fabricante sobre el diseño de los nuevos vehículos.",
      "Un estudio que compare la seguridad y el acceso a servicios antes y después de ampliar andenes y mejorar conexiones de transporte."
    ],
    answer: 3,
    explanation: "La postura relaciona la movilidad peatonal con la seguridad y el acceso real a la ciudad. Un estudio que mida esos aspectos antes y después de las intervenciones aportaría evidencia directamente vinculada con la tesis."
  },
  {
    id: "ao-006", readingId: "valor-de-reparar",
    competency: "Comprender cómo se articulan las partes de un texto para darle sentido global",
    competencyShort: "Sentido global", difficulty: "Media",
    prompt: "¿Cuál afirmación resume mejor la tesis del texto?",
    options: [
      "Todos los aparatos deben repararse sin importar su costo o estado.",
      "Comprar productos nuevos siempre genera menos residuos que reparar los antiguos.",
      "La reparación puede reducir el reemplazo innecesario, pero depende tanto de decisiones personales como de condiciones creadas por fabricantes y servicios.",
      "La publicidad es la única causa por la que los consumidores reemplazan sus aparatos."
    ],
    answer: 2,
    explanation: "El texto presenta la reparación como una decisión que depende del estado y costo del arreglo, pero también de la disponibilidad de piezas, información y servicios. No afirma que todo deba repararse ni atribuye el problema a una sola causa."
  },
  {
    id: "ao-007", readingId: "valor-de-reparar",
    competency: "Reflexionar a partir de un texto y evaluar su contenido",
    competencyShort: "Inferencia", difficulty: "Alta",
    prompt: "Si un fabricante deja de ofrecer repuestos y manuales, ¿qué consecuencia se desprende del argumento del texto?",
    options: [
      "Disminuyen las posibilidades de que el consumidor prolongue la vida útil del producto.",
      "Aumenta necesariamente la eficiencia energética del aparato.",
      "El consumidor obtiene más información para elegir un servicio técnico.",
      "La reparación se vuelve más segura porque requiere menos herramientas."
    ],
    answer: 0,
    explanation: "El segundo párrafo explica que la falta de repuestos, manuales y herramientas accesibles limita la posibilidad de reparar. La consecuencia se refiere a una barrera para prolongar la vida útil, no a una mejora técnica del aparato."
  },
  {
    id: "ao-008", readingId: "valor-de-reparar",
    competency: "Identificar y entender los contenidos locales",
    competencyShort: "Contenido local", difficulty: "Fácil",
    prompt: "En el tercer párrafo, «obsolescencia percibida» se refiere a",
    options: [
      "la pérdida comprobada de todas las funciones de un aparato.",
      "la percepción de que un producto está anticuado, aunque todavía pueda funcionar.",
      "el desgaste físico que vuelve peligroso cualquier dispositivo.",
      "la obligación legal de reemplazar un producto después de cierto tiempo."
    ],
    answer: 1,
    explanation: "El propio párrafo define la expresión como la sensación de que un producto dejó de ser adecuado aunque todavía cumpla su función. La idea se relaciona con la percepción y no necesariamente con un daño real."
  },
  {
    id: "ao-009", readingId: "valor-de-reparar",
    competency: "Comprender cómo se articulan las partes de un texto para darle sentido global",
    competencyShort: "Estructura", difficulty: "Media",
    prompt: "¿Para qué se mencionan el teléfono con la pantalla rota, la licuadora y la lámpara en el primer párrafo?",
    options: [
      "Para demostrar que todos los aparatos presentan el mismo daño.",
      "Para presentar ejemplos cotidianos que introducen el problema de desechar objetos que aún conservan utilidad.",
      "Para comparar el precio de tres tipos de repuestos.",
      "Para probar que los consumidores siempre prefieren comprar productos nuevos."
    ],
    answer: 1,
    explanation: "Los tres objetos funcionan como ejemplos concretos de la situación que el texto plantea al inicio: aparatos que dejan de usarse aunque una parte importante todavía funcione. No se comparan sus precios ni se afirma que todos tengan el mismo daño."
  },
  {
    id: "ao-010", readingId: "valor-de-reparar",
    competency: "Reflexionar a partir de un texto y evaluar su contenido",
    competencyShort: "Evaluación", difficulty: "Alta",
    prompt: "¿Cuál evidencia permitiría evaluar mejor si una reparación reduce el impacto ambiental de un producto?",
    options: [
      "Una encuesta que pregunte qué color prefieren los compradores.",
      "El número de anuncios publicados por tiendas de electrodomésticos.",
      "Una comparación entre los materiales y la energía usados para reparar el aparato y los necesarios para reemplazarlo.",
      "La cantidad de modelos nuevos que una marca presenta cada temporada."
    ],
    answer: 2,
    explanation: "El cuarto párrafo advierte que reparar no siempre es la mejor opción: también importan el consumo energético, la seguridad y el costo. Comparar materiales y energía de reparación frente a reemplazo permite evaluar el impacto con criterios relacionados con el argumento."
  }
];
