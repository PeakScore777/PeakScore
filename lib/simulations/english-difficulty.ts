export type EnglishDifficulty = "Fácil" | "Media" | "Difícil";

/**
 * Difficulty in the current English question bank.
 * Parts 1–2 are basic recognition; Parts 3–5 are intermediate;
 * Parts 6–7 require more demanding comprehension.
 */
const ENGLISH_DIFFICULTY_BY_PART: Record<string, EnglishDifficulty> = {
  "1": "Fácil",
  "2": "Fácil",
  "3": "Media",
  "4": "Media",
  "4A": "Media",
  "4B": "Media",
  "5": "Media",
  "6": "Difícil",
  "7": "Difícil",
  "7A": "Difícil",
  "7B": "Difícil",
};

export function getEnglishDifficulty(part: string): EnglishDifficulty {
  return ENGLISH_DIFFICULTY_BY_PART[part.toUpperCase()] ?? "Media";
}
