import { supabase } from "@/lib/supabase/browser";

/* =========================================================
   TIPOS
========================================================= */

export interface SubjectPerformance {
  subject: string;
  percentage: number;
}

export interface DashboardSimulation {
  id: string;
  date: string;
  score: number;
  duration: string;
  status: string;
}

export interface ScoreHistory {
  label: string;
  score: number;
}

/* =========================================================
   MATERIAS
========================================================= */

const SUBJECTS = [
  "Matemáticas",
  "Lectura Crítica",
  "Ciencias Naturales",
  "Sociales",
  "Inglés",
];

/* =========================================================
   RENDIMIENTO POR MATERIA
========================================================= */

export async function getSubjectPerformance(
  userId: string
): Promise<SubjectPerformance[]> {
  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from("simulation_attempts")
    .select("id")
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  if (attemptsError) {
    console.error(
      "[PeakScore] Error obteniendo intentos:",
      attemptsError
    );

    return getEmptyPerformance();
  }

  if (!attempts || attempts.length === 0) {
    return getEmptyPerformance();
  }

  const attemptIds = attempts.map(
    (attempt) => attempt.id
  );

  const {
    data: answers,
    error: answersError,
  } = await supabase
    .from("simulation_answers")
    .select("question_id, is_correct")
    .in("attempt_id", attemptIds);

  if (answersError) {
    console.error(
      "[PeakScore] Error obteniendo respuestas:",
      answersError
    );

    return getEmptyPerformance();
  }

  if (!answers || answers.length === 0) {
    return getEmptyPerformance();
  }

  const questionIds = [
    ...new Set(
      answers.map(
        (answer) => answer.question_id
      )
    ),
  ];

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select("id, subject")
    .in("id", questionIds);

  if (questionsError) {
    console.error(
      "[PeakScore] Error obteniendo preguntas:",
      questionsError
    );

    return getEmptyPerformance();
  }

  if (!questions) {
    return getEmptyPerformance();
  }

  const questionMap = new Map(
    questions.map((question) => [
      question.id,
      question.subject,
    ])
  );

  const statistics = new Map<
    string,
    {
      total: number;
      correct: number;
    }
  >();

  answers.forEach((answer) => {
    const subject = questionMap.get(
      answer.question_id
    );

    if (!subject) {
      return;
    }

    const current =
      statistics.get(subject) ?? {
        total: 0,
        correct: 0,
      };

    current.total += 1;

    if (answer.is_correct) {
      current.correct += 1;
    }

    statistics.set(
      subject,
      current
    );
  });

  return SUBJECTS.map((subject) => {
    const stats =
      statistics.get(subject);

    if (!stats || stats.total === 0) {
      return {
        subject,
        percentage: 0,
      };
    }

    return {
      subject,
      percentage: Math.round(
        (stats.correct /
          stats.total) *
          100
      ),
    };
  });
}

/* =========================================================
   ÚLTIMOS SIMULACROS
========================================================= */

export async function getRecentSimulations(
  userId: string
): Promise<DashboardSimulation[]> {
  const {
    data,
    error,
  } = await supabase
    .from("simulation_attempts")
    .select(
      `
        id,
        started_at,
        completed_at,
        score
      `
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", {
      ascending: false,
    })
    .limit(5);

  if (error) {
    console.error(
      "[PeakScore] Error obteniendo simulacros recientes:",
      error
    );

    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((attempt) => {
    let duration = "—";

    if (
      attempt.started_at &&
      attempt.completed_at
    ) {
      const start =
        new Date(
          attempt.started_at
        ).getTime();

      const end =
        new Date(
          attempt.completed_at
        ).getTime();

      const minutes = Math.max(
        0,
        Math.round(
          (end - start) /
            60000
        )
      );

      if (minutes > 0) {
        duration = `${minutes} min`;
      }
    }

    return {
      id: attempt.id,
      date: formatDate(
        attempt.completed_at
      ),
      score: Number(
        attempt.score ?? 0
      ),
      duration,
      status: "Completado",
    };
  });
}

/* =========================================================
   HISTORIAL PARA GRÁFICA
========================================================= */

export async function getScoreHistory(
  userId: string
): Promise<ScoreHistory[]> {
  const {
    data,
    error,
  } = await supabase
    .from("simulation_attempts")
    .select(
      `
        id,
        score,
        completed_at
      `
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", {
      ascending: true,
    })
    .limit(12);

  if (error) {
    console.error(
      "[PeakScore] Error obteniendo historial:",
      error
    );

    return [];
  }

  if (!data) {
    return [];
  }

  return data.map(
    (attempt, index) => ({
      label: `Sim ${index + 1}`,
      score: Number(
        attempt.score ?? 0
      ),
    })
  );
}

/* =========================================================
   VALORES VACÍOS
========================================================= */

function getEmptyPerformance(): SubjectPerformance[] {
  return SUBJECTS.map(
    (subject) => ({
      subject,
      percentage: 0,
    })
  );
}

/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}