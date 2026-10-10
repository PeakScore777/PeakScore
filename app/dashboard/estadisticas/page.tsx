import { BookOpen, Target, TrendingUp, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type AttemptRow = {
  id: string;
  simulation_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | string | null;
  correct_answers: number;
  incorrect_answers: number;
  unanswered_answers: number;
  total_questions: number;
};

type AnswerRow = {
  attempt_id: string;
  question_id: string;
  is_correct: boolean | null;
};

type QuestionRow = {
  id: string;
  subject: string | null;
  subject_id: string | null;
};

type SubjectRow = { id: string; name: string };
type SimulationRow = { id: string; title: string; subject: string | null };

type SubjectPerformance = {
  name: string;
  answered: number;
  correct: number;
  percentage: number;
};

const ATTEMPT_PAGE_SIZE = 500;
const MAX_ATTEMPTS_TO_LOAD = 10_000;
const RECENT_ATTEMPTS_TO_ANALYZE = 100;

function scoreValue(attempt: AttemptRow): number | null {
  if (attempt.score === null) return null;
  const value = Number(attempt.score);
  return Number.isFinite(value) ? value : null;
}

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Sin datos";
  }

  return value.toLocaleString("es-CO", { maximumFractionDigits: 1 });
}

function formatDate(value: string | null) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota",
  }).format(date);
}

export default async function StatisticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, target_score, streak")
    .eq("id", user.id)
    .maybeSingle();

  // Paginate the authenticated user's completed attempts instead of relying on
  // the API's default row limit. The exact count powers the total-completions card.
  const attempts: AttemptRow[] = [];
  let attemptCount: number | null = null;
  let attemptsLoadError = false;
  let offset = 0;

  while (offset < MAX_ATTEMPTS_TO_LOAD) {
    const query = supabase
      .from("simulation_attempts")
      .select(
        "id, simulation_id, started_at, completed_at, score, correct_answers, incorrect_answers, unanswered_answers, total_questions",
        offset === 0 ? { count: "exact" } : undefined,
      )
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + ATTEMPT_PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (error) {
      attemptsLoadError = true;
      break;
    }

    if (offset === 0) attemptCount = count ?? data.length;
    const page = (data ?? []) as AttemptRow[];
    attempts.push(...page);

    if (page.length < ATTEMPT_PAGE_SIZE) break;
    offset += ATTEMPT_PAGE_SIZE;
  }

  const historyTruncated =
    !attemptsLoadError &&
    attemptCount !== null &&
    attemptCount > attempts.length;
  const scoredAttempts = attempts
    .map((attempt) => ({ attempt, score: scoreValue(attempt) }))
    .filter(
      (item): item is { attempt: AttemptRow; score: number } =>
        item.score !== null,
    );

  const bestScore =
    scoredAttempts.length > 0
      ? Math.max(...scoredAttempts.map((item) => item.score))
      : null;
  const averageScore =
    scoredAttempts.length > 0
      ? scoredAttempts.reduce((sum, item) => sum + item.score, 0) /
        scoredAttempts.length
      : null;
  const chartItems = scoredAttempts.slice(-10);

  let simulationById = new Map<string, SimulationRow>();
  if (!attemptsLoadError && attempts.length > 0) {
    const simulationIds = [...new Set(attempts.slice(-20).map((item) => item.simulation_id))];
    const { data: simulations } = await supabase
      .from("simulations")
      .select("id, title, subject")
      .in("id", simulationIds);

    simulationById = new Map(
      ((simulations ?? []) as SimulationRow[]).map((simulation) => [
        simulation.id,
        simulation,
      ] as const),
    );
  }

  let subjectPerformance: SubjectPerformance[] = [];
  let subjectUnavailableMessage = "";

  const recentAttempts = attempts.slice(-RECENT_ATTEMPTS_TO_ANALYZE);
  if (attemptsLoadError) {
    subjectUnavailableMessage =
      "No se pudo cargar el historial de simulacros. Vuelve a intentarlo más tarde.";
  } else if (recentAttempts.length === 0) {
    subjectUnavailableMessage =
      "Completa un simulacro para empezar a ver tu rendimiento por materia.";
  } else {
    const { data: answers, error: answersError } = await supabase
      .from("simulation_answers")
      .select("attempt_id, question_id, is_correct")
      .in("attempt_id", recentAttempts.map((attempt) => attempt.id));

    if (answersError) {
      subjectUnavailableMessage =
        "Los datos de respuestas por materia no están disponibles para esta sesión.";
    } else if (!answers?.length) {
      subjectUnavailableMessage =
        "Todavía no hay respuestas registradas para analizar por materia.";
    } else {
      const typedAnswers = answers as AnswerRow[];
      const questionIds = [...new Set(typedAnswers.map((answer) => answer.question_id))];
      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("id, subject, subject_id")
        .in("id", questionIds);

      if (questionsError || !questions?.length) {
        subjectUnavailableMessage =
          "No se pudo asociar las respuestas con sus materias.";
      } else {
        const typedQuestions = questions as QuestionRow[];
        const subjectIds = [
          ...new Set(
            typedQuestions
              .map((question) => question.subject_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        let subjectNameById = new Map<string, string>();
        if (subjectIds.length > 0) {
          const { data: subjects, error: subjectsError } = await supabase
            .from("subjects")
            .select("id, name")
            .in("id", subjectIds);

          if (!subjectsError && subjects) {
            subjectNameById = new Map(
              (subjects as SubjectRow[]).map((subject) => [
                subject.id,
                subject.name,
              ] as const),
            );
          }
        }

        const questionById = new Map(
          typedQuestions.map((question) => [question.id, question] as const),
        );
        const grouped = new Map<
          string,
          { answered: number; correct: number }
        >();

        for (const answer of typedAnswers) {
          // Null means the answer was not graded. Do not count it as incorrect.
          if (answer.is_correct === null) continue;
          const question = questionById.get(answer.question_id);
          if (!question) continue;

          const name = (
            (question.subject_id
              ? subjectNameById.get(question.subject_id)
              : null) ??
            question.subject ??
            ""
          ).trim();
          if (!name) continue;

          const normalizedName = name;
          const group = grouped.get(normalizedName) ?? {
            answered: 0,
            correct: 0,
          };
          group.answered += 1;
          if (answer.is_correct) group.correct += 1;
          grouped.set(normalizedName, group);
        }

        subjectPerformance = [...grouped.entries()]
          .filter(([, values]) => values.answered > 0)
          .map(([name, values]) => ({
            name,
            answered: values.answered,
            correct: values.correct,
            percentage: (values.correct / values.answered) * 100,
          }))
          .sort((a, b) => b.percentage - a.percentage);

        if (subjectPerformance.length === 0) {
          subjectUnavailableMessage =
            "No hay respuestas calificadas y asociadas a una materia para calcular porcentajes.";
        }
      }
    }
  }

  const bestSubject = subjectPerformance[0] ?? null;
  const improvementSubject =
    subjectPerformance.length > 1
      ? subjectPerformance[subjectPerformance.length - 1]
      : null;
  const latestAttempts = attempts.slice(-10).reverse();
  const name = profile?.full_name?.trim();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-7 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">
            PEAKSCORE · TU PROGRESO
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {name ? `Estadísticas de ${name}` : "Tus estadísticas"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tu rendimiento se calcula con los simulacros y las respuestas guardadas en tu cuenta.
            Las secciones sin datos registrados se muestran como disponibles próximamente o sin datos;
            no se rellenan con cifras de ejemplo.
          </p>
        </header>

        {profileError && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            No se pudieron cargar todos los datos del perfil. Las estadísticas que dependen de esos campos aparecen como no disponibles.
          </div>
        )}
        {attemptsLoadError && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            No se pudo consultar tu historial de simulacros. Intenta recargar la página más tarde.
          </div>
        )}
        {historyTruncated && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Tu historial es muy extenso. Los puntajes se calculan sobre los últimos {attempts.length.toLocaleString("es-CO")} intentos cargados; el total de simulacros completados sí refleja el conteo de la base de datos.
          </div>
        )}

        <section aria-label="Resumen de rendimiento" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Trophy className="mb-4 text-amber-500" size={30} />
            <p className="text-sm font-semibold text-slate-500">Mejor puntaje registrado</p>
            <p className="mt-2 text-3xl font-black">{attemptsLoadError ? "No disponible" : formatScore(bestScore)}</p>
            <p className="mt-1 text-xs text-slate-400">Solo intentos completados con puntaje guardado</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Target className="mb-4 text-blue-600" size={30} />
            <p className="text-sm font-semibold text-slate-500">Tu meta de puntaje</p>
            <p className="mt-2 text-3xl font-black">{profileError ? "No disponible" : profile?.target_score == null ? "Sin meta" : formatScore(profile.target_score)}</p>
            <p className="mt-1 text-xs text-slate-400">Valor guardado en tu perfil</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <TrendingUp className="mb-4 text-emerald-600" size={30} />
            <p className="text-sm font-semibold text-slate-500">Promedio de puntajes</p>
            <p className="mt-2 text-3xl font-black">{attemptsLoadError ? "No disponible" : formatScore(averageScore)}</p>
            <p className="mt-1 text-xs text-slate-400">Promedio de intentos con puntaje registrado</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="mb-4 text-violet-600" size={30} />
            <p className="text-sm font-semibold text-slate-500">Simulacros completados</p>
            <p className="mt-2 text-3xl font-black">{attemptsLoadError ? "No disponible" : (attemptCount ?? attempts.length).toLocaleString("es-CO")}</p>
            <p className="mt-1 text-xs text-slate-400">Intentos con fecha de finalización</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Evolución del puntaje</h2>
              <p className="mt-1 text-sm text-slate-500">Tus últimos 10 intentos con puntaje guardado.</p>
            </div>
            <p className="text-sm text-slate-500">
              Racha registrada: <span className="font-bold text-slate-900">{profileError || profile?.streak == null ? "No disponible" : profile.streak.toLocaleString("es-CO") + " días"}</span>
            </p>
          </div>

          {attemptsLoadError ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No se pudo cargar la evolución.</p>
          ) : chartItems.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Aún no tienes puntajes registrados. Cuando completes un simulacro con resultado guardado, aparecerá aquí.</p>
          ) : (
            <div className="mt-7 space-y-4">
              {chartItems.map(({ attempt, score }) => {
                const maxScore = Math.max(...chartItems.map((item) => item.score), 1);
                const percentage = Math.max(2, (score / maxScore) * 100);
                return (
                  <div key={attempt.id} className="grid grid-cols-[95px_minmax(0,1fr)_55px] items-center gap-3">
                    <span className="text-xs text-slate-500">{formatDate(attempt.completed_at)}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                        aria-label={`Puntaje ${formatScore(score)}`}
                      />
                    </div>
                    <span className="text-right text-sm font-bold tabular-nums">{formatScore(score)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">Rendimiento por materia</h2>
            <p className="mt-1 text-sm text-slate-500">
              Calculado desde respuestas calificadas de tus últimos {RECENT_ATTEMPTS_TO_ANALYZE} simulacros completados como máximo.
            </p>

            {subjectPerformance.length === 0 ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{subjectUnavailableMessage}</p>
            ) : (
              <div className="mt-6 space-y-5">
                {subjectPerformance.map((subject) => (
                  <div key={subject.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{subject.name}</span>
                      <span className="shrink-0 font-bold tabular-nums">{subject.percentage.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%</span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                      aria-label={`${subject.name}: ${subject.percentage.toFixed(1)} por ciento`}
                    >
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${subject.percentage}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{subject.correct} correctas de {subject.answered} respuestas calificadas</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-black">Resumen personal</h2>
            <div className="mt-5 divide-y divide-slate-100">
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">Materia con mejor resultado</p>
                  <p className="mt-1 text-sm text-slate-500">Según respuestas calificadas registradas.</p>
                </div>
                <p className="max-w-[45%] text-right text-sm font-bold text-emerald-700">{bestSubject?.name ?? "Sin datos"}</p>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">Materia para reforzar</p>
                  <p className="mt-1 text-sm text-slate-500">La de menor porcentaje entre las materias calculables.</p>
                </div>
                <p className="max-w-[45%] text-right text-sm font-bold text-amber-700">{improvementSubject?.name ?? "Sin datos suficientes"}</p>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">Meta personal</p>
                  <p className="mt-1 text-sm text-slate-500">Objetivo registrado en la configuración de tu perfil.</p>
                </div>
                <p className="text-right text-sm font-bold">{profileError || profile?.target_score == null ? "No disponible" : formatScore(profile.target_score)}</p>
              </div>
              <div className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-semibold">Últimos simulacros</p>
                  <p className="mt-1 text-sm text-slate-500">Resultados guardados más recientes.</p>
                </div>
                <p className="text-right text-sm font-bold">{attemptsLoadError ? "No disponible" : latestAttempts.length.toLocaleString("es-CO")}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-xl font-black">Historial reciente</h2>
            <p className="mt-1 text-sm text-slate-500">Hasta 10 simulacros completados, ordenados del más reciente al más antiguo.</p>
          </div>
          {attemptsLoadError ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No se pudo cargar el historial.</p>
          ) : latestAttempts.length === 0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Todavía no tienes simulacros completados.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-bold">Fecha</th>
                    <th className="pb-3 pr-4 font-bold">Simulacro</th>
                    <th className="pb-3 pr-4 font-bold">Correctas</th>
                    <th className="pb-3 text-right font-bold">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {latestAttempts.map((attempt) => {
                    const simulation = simulationById.get(attempt.simulation_id);
                    return (
                      <tr key={attempt.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-500">{formatDate(attempt.completed_at)}</td>
                        <td className="py-3 pr-4 font-semibold">{simulation?.title ?? simulation?.subject ?? "Simulacro"}</td>
                        <td className="py-3 pr-4 text-slate-600">{attempt.correct_answers} / {attempt.total_questions}</td>
                        <td className="py-3 text-right font-bold tabular-nums">{formatScore(scoreValue(attempt))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
