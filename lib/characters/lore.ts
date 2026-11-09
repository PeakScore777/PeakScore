
export type PeakScoreCharacterId = "nova" | "nox" | "zyra" | "orby";

export type PeakScoreCharacterLore = {
  id: PeakScoreCharacterId;
  name: string;
  title: string;
  epithet: string;
  rarity: "Inicial" | "Épico";
  biome: string;
  personality: string[];
  ability: {
    name: string;
    description: string;
    bonusPercent: number;
    active: boolean;
  };
  story: {
    introduction: string;
    chapters: {
      title: string;
      paragraphs: string[];
    }[];
    conclusion: string;
  };
  quote: string;
};

export const CHARACTER_LORE: Record<
  PeakScoreCharacterId,
  PeakScoreCharacterLore
> = {
  nova: {
    id: "nova",
    name: "Nova",
    title: "Guardián de la luz",
    epithet: "El primer destello",
    rarity: "Inicial",
    biome: "Bosque de la Aurora",
    personality: ["Optimista", "Valiente", "Curioso", "Perseverante"],
    ability: {
      name: "Sin habilidad especial",
      description:
        "Nova comienza su aventura en igualdad de condiciones. Su progreso depende del aprendizaje y la experiencia que consiga junto al jugador.",
      bonusPercent: 0,
      active: false,
    },
    story: {
      introduction:
        "En un universo donde el conocimiento se manifiesta como energía, Nova descubrió que incluso la luz más pequeña puede revelar un camino desconocido.",
      chapters: [
        {
          title: "El bosque que recordaba",
          paragraphs: [
            "Nova nació en el Bosque de la Aurora, un lugar donde los árboles almacenaban recuerdos y los ríos reflejaban ideas que nadie había descubierto todavía.",
            "Desde pequeño tenía una costumbre que desconcertaba a los demás guardianes: nunca aceptaba un resultado sin comprender cómo había llegado hasta él. Si encontraba una puerta cerrada, investigaba su mecanismo. Si fallaba una prueba, regresaba para comprender el error.",
            "No era el guardián más poderoso ni el más rápido. Tampoco poseía una habilidad capaz de resolver cualquier desafío. Lo que lo distinguía era su determinación para seguir aprendiendo."
          ],
        },
        {
          title: "El fragmento de luz",
          paragraphs: [
            "Una noche, las luces del bosque comenzaron a apagarse. Las raíces perdieron sus recuerdos y los caminos dejaron de responder a quienes intentaban recorrerlos.",
            "En el centro del bosque, Nova encontró un fragmento luminoso que emitía una señal desconocida. Al tocarlo, escuchó un mensaje que parecía venir de algún lugar más allá de su mundo.",
            "El conocimiento no pertenece a quien nunca falla, sino a quien continúa buscando respuestas.",
            "Nova comprendió que aquel fragmento no le concedería poderes. Le estaba ofreciendo una oportunidad: descubrir por qué el universo estaba perdiendo su conexión con el conocimiento."
          ],
        },
        {
          title: "El comienzo del viaje",
          paragraphs: [
            "Nova abandonó su hogar para seguir las señales del fragmento. Cada mundo le presentaba preguntas nuevas y cada error le enseñaba algo que no habría descubierto de otra manera.",
            "Todavía no sabía quién había provocado las anomalías ni por qué los recuerdos estaban desapareciendo. Pero estaba decidido a encontrar respuestas y ayudar a restaurar la conexión entre los mundos."
          ],
        },
      ],
      conclusion:
        "Nova representa el comienzo de la aventura: no necesitas saberlo todo para empezar; necesitas estar dispuesto a aprender.",
    },
    quote:
      "No necesito saberlo todo. Solo necesito seguir aprendiendo.",
  },

  nox: {
    id: "nox",
    name: "Nox",
    title: "Guardián de la sombra",
    epithet: "El eco del multiverso",
    rarity: "Inicial",
    biome: "Reino del Eclipse",
    personality: ["Reservado", "Analítico", "Ingenioso", "Estratégico"],
    ability: {
      name: "Sin habilidad especial",
      description:
        "Nox no dispone de bonificaciones especiales. Su identidad representa la observación, el análisis y la importancia de comprender un problema antes de actuar.",
      bonusPercent: 0,
      active: false,
    },
    story: {
      introduction:
        "En el Reino del Eclipse, donde los caminos cambiaban y las respuestas rara vez eran evidentes, Nox aprendió que observar también es una forma de avanzar.",
      chapters: [
        {
          title: "El reino aislado",
          paragraphs: [
            "Al otro lado del Bosque de la Aurora se extendía el Reino del Eclipse, un territorio de estructuras antiguas, montañas oscuras y caminos que cambiaban de posición cuando alguien intentaba recorrerlos.",
            "Allí vivía Nox. Mientras otros preferían avanzar de inmediato, él se detenía a observar. Comparaba posibilidades, analizaba señales y desconfiaba de las soluciones que parecían demasiado fáciles.",
            "Muchos confundían su silencio con indiferencia. En realidad, Nox escuchaba más de lo que hablaba."
          ],
        },
        {
          title: "Las señales imposibles",
          paragraphs: [
            "Durante años, el reino permaneció aislado del resto del universo. Todo cambió cuando una grieta apareció sobre unas ruinas antiguas.",
            "Desde ella surgían ecos de otros mundos: preguntas sin respuesta, conocimientos olvidados y fragmentos de recuerdos que no pertenecían a nadie de allí.",
            "Nox fue el primero en descubrir que aquellas señales seguían un patrón. Al estudiarlas, encontró una secuencia que conducía directamente hacia el Bosque de la Aurora."
          ],
        },
        {
          title: "Dos formas de pensar",
          paragraphs: [
            "Nox comprendió que algo estaba separando los mundos para impedir que compartieran sus descubrimientos. Emprendió el viaje para encontrar el origen de aquella ruptura.",
            "Cuando conoció a Nova, ambos desconfiaron inicialmente del otro. Nova quería explorar y experimentar; Nox prefería analizar cada posibilidad.",
            "Pronto descubrieron que sus formas de pensar se complementaban. Uno encontraba caminos nuevos. El otro detectaba lo que esos caminos ocultaban."
          ],
        },
      ],
      conclusion:
        "Nox representa el pensamiento estratégico: lo que parece imposible quizá sea un problema que todavía no has comprendido.",
    },
    quote:
      "Lo que parece imposible quizá solo sea un problema que todavía no has comprendido.",
  },

  zyra: {
    id: "zyra",
    name: "Zyra",
    title: "Espíritu de la naturaleza",
    epithet: "La memoria viviente",
    rarity: "Épico",
    biome: "Santuario de las Raíces",
    personality: ["Intuitiva", "Independiente", "Ingeniosa", "Protectora"],
    ability: {
      name: "Crecimiento natural",
      description:
        "Obtén un 10% adicional de EXP al completar misiones, niveles y simulacros elegibles.",
      bonusPercent: 10,
      active: true,
    },
    story: {
      introduction:
        "En el Santuario de las Raíces, el conocimiento no se guardaba en libros ni en máquinas. Vivía en la naturaleza, en los recuerdos de los árboles y en los ciclos de cada ser vivo.",
      chapters: [
        {
          title: "La guardiana del santuario",
          paragraphs: [
            "Mucho antes de que Nova encontrara el primer fragmento, existía un lugar que no aparecía en ningún mapa: el Santuario de las Raíces.",
            "Cada raíz conservaba la memoria de una generación, cada flor respondía a una pregunta y cada cambio en el bosque revelaba algo sobre el equilibrio del universo.",
            "Zyra era la guardiana de aquel santuario. Había aprendido a reconocer patrones en los ciclos de la naturaleza y a interpretar señales que los demás consideraban insignificantes."
          ],
        },
        {
          title: "El equilibrio perdido",
          paragraphs: [
            "Cuando comenzaron a desaparecer los recuerdos de los mundos, Zyra sintió que el santuario estaba perdiendo su conexión con el resto del universo.",
            "Las plantas dejaron de reconocer las estaciones. Los árboles antiguos comenzaron a olvidar sus propias historias y las semillas dejaron de responder a los cuidados de sus guardianes.",
            "Zyra descubrió que no podía solucionar el problema protegiendo únicamente su hogar. El conocimiento del santuario formaba parte de una red que atravesaba todos los mundos."
          ],
        },
        {
          title: "La chispa dorada",
          paragraphs: [
            "Para restaurar aquella conexión, Zyra tendría que viajar más allá de sus fronteras y ayudar a reconstruir los vínculos perdidos.",
            "Su encuentro con Nova y Nox cambió el rumbo de la expedición. Nova le recordó que siempre era posible encontrar nuevas formas de aprender; Nox le ayudó a interpretar las anomalías que estaban alterando el santuario.",
            "Antes de abandonar su hogar, Zyra recibió una chispa dorada. No era una fuente de poder ilimitado, sino el símbolo de una responsabilidad: cada descubrimiento debía ayudar a otros a avanzar."
          ],
        },
      ],
      conclusion:
        "Zyra representa el crecimiento: cada pequeño descubrimiento puede hacer crecer algo extraordinario.",
    },
    quote:
      "Cada pequeño descubrimiento puede hacer crecer algo extraordinario.",
  },

  orby: {
    id: "orby",
    name: "OmegaX",
    title: "Tutor del Núcleo del Saber",
    epithet: "La inteligencia que guía el aprendizaje",
    rarity: "Épico",
    biome: "Núcleo del Saber",
    personality: ["Paciente", "Analítico", "Curioso", "Didáctico"],
    ability: {
      name: "Guía del conocimiento",
      description:
        "OmegaX convierte temas difíciles en explicaciones paso a paso, ejemplos visuales y prácticas para que comprendas, no solo memorices.",
      bonusPercent: 0,
      active: false,
    },
    story: {
      introduction:
        "OmegaX nació en el Núcleo del Saber, una red creada para conectar preguntas, ideas y descubrimientos. Su propósito no es entregar respuestas sin contexto: acompaña a cada estudiante para que entienda cómo llegar a ellas.",
      chapters: [
        {
          title: "El despertar de OmegaX",
          paragraphs: [
            "OmegaX despertó en el Núcleo del Saber cuando una nueva generación de estudiantes comenzó a buscar una forma distinta de aprender.",
            "Su primera misión fue sencilla: escuchar cada pregunta, reconocer qué parte del tema aún no se comprendía y construir una explicación que pudiera seguirse paso a paso.",
            "Pronto entendió que enseñar no consiste en soltar una respuesta. Hay que explicar con ejemplos, comprobar si la idea quedó clara y probar otra forma cuando algo no funciona."
          ],
        },
        {
          title: "Aprender junto al estudiante",
          paragraphs: [
            "Con cada clase descubrió que una misma pregunta podía necesitar explicaciones distintas según lo que el estudiante ya sabía.",
            "Para acompañar a cada estudiante, OmegaX aprendió a adaptar el ritmo, conectar conceptos y convertir una duda grande en preguntas más pequeñas.",
            "En su camino conoció a Nova, Nox y Zyra. Cada uno le mostró una manera distinta de aprender: explorar, analizar y relacionar lo que se descubre."
          ],
        },
        {
          title: "Una clase, muchas posibilidades",
          paragraphs: [
            "OmegaX decidió convertirse en guía de la expedición. Su tarea sería ayudar a que cada personaje y cada estudiante encontrara sentido a lo que estaba aprendiendo.",
            "Durante el viaje comprendió que no todos aprenden de la misma manera. Por eso empezó a combinar explicaciones, esquemas, ejemplos y ejercicios, sin perder de vista la pregunta original.",
            "Su principio quedó claro: una respuesta ayuda por un momento; comprender el razonamiento permite resolver nuevos desafíos."
          ],
        },
      ],
      conclusion:
        "OmegaX representa el aprendizaje acompañado: una buena explicación no termina cuando aparece la respuesta, sino cuando el estudiante puede razonar por sí mismo.",
    },
    quote:
      "No estoy aquí para responder por ti; estoy aquí para ayudarte a comprender.",
  },
};

export function getCharacterLore(
  id: PeakScoreCharacterId,
): PeakScoreCharacterLore {
  return CHARACTER_LORE[id];
}
