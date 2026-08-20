export interface Simulation {
  id: number;
  title: string;
  description: string;
  subject: string;
  questions: number;
  duration: number;
  difficulty: "Fácil" | "Media" | "Difícil";
  color: string;
  available: boolean;
}

export const simulations: Simulation[] = [
  {
    id: 1,
    title: "Simulacro Diagnóstico",
    description:
      "Evalúa tu nivel actual antes de comenzar tu preparación.",
    subject: "General",
    questions: 60,
    duration: 120,
    difficulty: "Media",
    color: "bg-blue-600",
    available: true,
  },
  {
    id: 2,
    title: "Matemáticas",
    description:
      "Fortalece razonamiento cuantitativo y resolución de problemas.",
    subject: "Matemáticas",
    questions: 45,
    duration: 90,
    difficulty: "Media",
    color: "bg-green-600",
    available: true,
  },
  {
    id: 3,
    title: "Lectura Crítica",
    description:
      "Mejora comprensión lectora, interpretación y argumentación.",
    subject: "Lectura Crítica",
    questions: 45,
    duration: 90,
    difficulty: "Media",
    color: "bg-orange-600",
    available: true,
  },
  {
    id: 4,
    title: "Ciencias Naturales",
    description:
      "Practica biología, química y física con preguntas tipo ICFES.",
    subject: "Ciencias",
    questions: 45,
    duration: 90,
    difficulty: "Difícil",
    color: "bg-emerald-600",
    available: true,
  },
  {
    id: 5,
    title: "Sociales y Ciudadanas",
    description:
      "Evalúa historia, geografía, política y ciudadanía.",
    subject: "Sociales",
    questions: 45,
    duration: 90,
    difficulty: "Media",
    color: "bg-purple-600",
    available: true,
  },
  {
    id: 6,
    title: "Inglés",
    description:
      "Pon a prueba tu comprensión del idioma inglés.",
    subject: "Inglés",
    questions: 55,
    duration: 60,
    difficulty: "Media",
    color: "bg-red-600",
    available: true,
  },
];