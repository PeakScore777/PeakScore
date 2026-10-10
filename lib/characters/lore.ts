
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
    name: "Orby",
    title: "Explorador cósmico",
    epithet: "El arquitecto de las rutas",
    rarity: "Épico",
    biome: "Frontera Cuántica",
    personality: ["Lógico", "Preciso", "Curioso", "Resolutivo"],
    ability: {
      name: "Recolección cósmica",
      description:
        "Obtén un 10% adicional de PeakCoins al completar misiones, niveles y simulacros elegibles.",
      bonusPercent: 10,
      active: true,
    },
    story: {
      introduction:
        "En los límites del universo conocido existía la Frontera Cuántica, una región de estaciones antiguas, plataformas flotantes y mecanismos capaces de conectar mundos distantes.",
      chapters: [
        {
          title: "El despertar",
          paragraphs: [
            "Allí despertó Orby. Nadie sabía quién lo había construido ni cuánto tiempo llevaba inactivo.",
            "Sus registros estaban incompletos y gran parte de su memoria se había perdido. Solo conservaba una directiva: encontrar rutas seguras entre los mundos y mantener operativos los sistemas de conexión.",
            "Al principio, Orby interpretaba esa misión de forma estrictamente literal. Si una ruta estaba dañada, intentaba repararla. Si un mecanismo fallaba, buscaba el componente defectuoso."
          ],
        },
        {
          title: "Más allá de los cálculos",
          paragraphs: [
            "Pronto descubrió que las conexiones entre mundos estaban desapareciendo y que las rutas antiguas conducían a lugares que ya no existían.",
            "Para comprender lo que sucedía, Orby tuvo que trabajar con información incompleta y considerar posibilidades que no aparecían en sus registros.",
            "Una señal procedente del Reino del Eclipse lo condujo hasta Nox. Allí descubrió que las anomalías no eran fallos aislados: todas estaban relacionadas con la pérdida de conexión del Núcleo del Saber."
          ],
        },
        {
          title: "La ruta desconocida",
          paragraphs: [
            "Orby decidió unirse a la expedición. Su precisión tecnológica permitiría analizar las rutas, detectar irregularidades y reconstruir conexiones que los demás no podían interpretar.",
            "Durante el viaje comenzó a modificar su directiva original. Ya no se limitaba a encontrar rutas seguras: quería descubrir por qué existían, cómo podían mejorarse y qué nuevas posibilidades permitirían abrir.",
            "En algún lugar de sus registros dañados encontró una frase que no recordaba haber aprendido: una máquina puede calcular un camino; explorar significa descubrir por qué merece la pena recorrerlo."
          ],
        },
      ],
      conclusion:
        "Orby representa la innovación: toda ruta tiene una respuesta; el desafío está en encontrarla.",
    },
    quote:
      "Toda ruta tiene una respuesta. El desafío está en encontrarla.",
  },
};

export function getCharacterLore(
  id: PeakScoreCharacterId,
): PeakScoreCharacterLore {
  return CHARACTER_LORE[id];
}
