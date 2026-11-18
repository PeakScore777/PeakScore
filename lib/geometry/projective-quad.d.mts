export type ProjectedScreenPoint = Readonly<{ x: number; y: number }>;

export declare function projectMonitorQuad(
  points: readonly ProjectedScreenPoint[],
  width: number,
  height: number,
): string | null;
