export type OrbyQuestionSolutionPreview = {
  area: string;
  skill: string;
  problem_summary: string;
  reasoning_steps: string[];
  uncertainties: string[];
  confidence: number;
  answer_basis: "independent_reasoning" | "explicit_key" | "insufficient_information";
};

/**
 * Give the student a reusable reasoning blueprint, never the source question's
 * number, answer option, result, answer key, or private page references.
 */
export function toStudentSafeQuestionSolution(raw: unknown): OrbyQuestionSolutionPreview | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const area = typeof item.area === "string" ? item.area.trim().slice(0, 80) : "";
  const skill = typeof item.skill === "string" ? item.skill.trim().slice(0, 180) : "";
  const problemSummary = typeof item.problem_summary === "string" ? item.problem_summary.trim().slice(0, 500) : "";
  if (!area || !problemSummary) return null;

  const reasoningSteps = Array.isArray(item.reasoning_steps)
    ? item.reasoning_steps.filter((step): step is string => typeof step === "string" && step.trim().length > 0).slice(0, 8).map((step) => step.trim().slice(0, 320))
    : [];
  const uncertainties = Array.isArray(item.uncertainties)
    ? item.uncertainties.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0).slice(0, 5).map((entry) => entry.trim().slice(0, 240))
    : [];
  const answerBasis = item.answer_basis === "explicit_key" || item.answer_basis === "independent_reasoning"
    ? item.answer_basis
    : "insufficient_information";
  const confidence = typeof item.confidence === "number" && Number.isFinite(item.confidence)
    ? Math.max(0, Math.min(1, item.confidence))
    : 0;

  return {
    area,
    skill,
    problem_summary: problemSummary,
    reasoning_steps: reasoningSteps,
    uncertainties,
    confidence,
    answer_basis: answerBasis,
  };
}
