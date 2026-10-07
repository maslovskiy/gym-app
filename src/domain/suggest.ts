export type SetResult = { weightKg: number; reps: number };

// Informational only: if every set reached the top of the rep range,
// suggest one increment above the heaviest weight used. Never applied
// automatically.
export function suggestWeight(
  previous: SetResult[],
  target: { repsMax: number; increment: number },
): number | null {
  if (previous.length === 0) return null;
  if (!previous.every((s) => s.reps >= target.repsMax)) return null;
  const heaviest = Math.max(...previous.map((s) => s.weightKg));
  if (heaviest <= 0) return null;
  return heaviest + target.increment;
}

export function formatKg(kg: number): string {
  return `${Number.isInteger(kg) ? kg : Number(kg.toFixed(2))} kg`;
}

export function formatSets(sets: SetResult[]): string {
  return sets.map((s) => `${formatKg(s.weightKg)} × ${s.reps}`).join(' / ');
}
