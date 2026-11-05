/**
 * Keep administrator-facing analysis calibrated to the secondary-school
 * level required by Colombia's Saber 11 exam. Advanced source material may be
 * discussed as optional context, never as an exam requirement.
 */
export function normalizeOrbySaber11Level(value: string): string {
  return value
    .replace(/\bnivel\s+de\s+profundidad\s+t[eé]cnica\s+superior\s*\(?universitari[oa]\)?/gi, "nivel escolar de preparación para Saber 11")
    .replace(/\b(?:nivel|profundidad|exigencia|enfoque|preparaci[oó]n|formaci[oó]n|est[aá]ndar)\s+(?:t[eé]cnica\s+)?universitari[oa]\b/gi, "profundización opcional, no exigida para Saber 11")
    .replace(/\b(?:contenido|temario|conocimiento)\s+universitari[oa]\b/gi, "contenido de profundización opcional")
    .replace(/\ba nivel de (?:pregrado|posgrado)\b/gi, "como profundización opcional")
    .replace(/\bde (?:pregrado|posgrado)\b/gi, "de profundización opcional");
}
