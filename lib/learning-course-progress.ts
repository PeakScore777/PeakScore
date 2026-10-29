export type CuencaChapterProgress = {
  visitedLessonIds: string[];
  completed: boolean;
};

export const CUENCA_CHAPTER_ONE_LESSON_IDS = [
  "historia",
  "ecosistema",
  "habitat-poblacion-nicho",
  "evidencia-ecosistema",
  "puntos-clave",
] as const;

export const CUENCA_PROGRESS_EVENT = "peakscore:cuenca-progress-updated";

const CUENCA_PROGRESS_KEY = "peakscore:learning:cuenca-de-los-ecos:chapter-01";

const EMPTY_PROGRESS: CuencaChapterProgress = {
  visitedLessonIds: [],
  completed: false,
};

export function readCuencaChapterProgress(): CuencaChapterProgress {
  if (typeof window === "undefined") return EMPTY_PROGRESS;

  try {
    const raw = window.localStorage.getItem(CUENCA_PROGRESS_KEY);
    if (!raw) return EMPTY_PROGRESS;

    const parsed = JSON.parse(raw) as Partial<CuencaChapterProgress>;
    const validIds = Array.isArray(parsed.visitedLessonIds)
      ? parsed.visitedLessonIds.filter((id): id is string =>
          CUENCA_CHAPTER_ONE_LESSON_IDS.includes(
            id as (typeof CUENCA_CHAPTER_ONE_LESSON_IDS)[number],
          ),
        )
      : [];

    return {
      visitedLessonIds: parsed.completed
        ? [...CUENCA_CHAPTER_ONE_LESSON_IDS]
        : [...new Set(validIds)],
      completed: parsed.completed === true,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

function saveCuencaChapterProgress(progress: CuencaChapterProgress): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(CUENCA_PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent(CUENCA_PROGRESS_EVENT));
  } catch {
    // Progress UI remains usable if browser storage is disabled.
  }
}

export function markCuencaLessonVisited(lessonId: string): void {
  if (
    !CUENCA_CHAPTER_ONE_LESSON_IDS.includes(
      lessonId as (typeof CUENCA_CHAPTER_ONE_LESSON_IDS)[number],
    )
  ) {
    return;
  }

  const current = readCuencaChapterProgress();
  if (current.completed || current.visitedLessonIds.includes(lessonId)) return;

  saveCuencaChapterProgress({
    visitedLessonIds: [...current.visitedLessonIds, lessonId],
    completed: false,
  });
}

export function markCuencaChapterCompleted(): void {
  saveCuencaChapterProgress({
    visitedLessonIds: [...CUENCA_CHAPTER_ONE_LESSON_IDS],
    completed: true,
  });
}
