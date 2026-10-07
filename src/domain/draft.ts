import type { Exercise } from './program.ts';
import { program } from './program.ts';
import type { WorkoutType } from './schedule.ts';
import type { SetResult } from './suggest.ts';

// What gets stored per exercise in a finished workout.
export type LoggedExercise = {
  exerciseId: string;
  name: string;
  kind: Exercise['kind'];
  sets: SetResult[];
  durationMin: number | null;
  distanceKm: number | null;
};

export type PreviousLog = Pick<LoggedExercise, 'sets' | 'durationMin' | 'distanceKm'>;

// In-progress workout: raw text exactly as typed, so inputs round-trip.
export type DraftSet = { weight: string; reps: string };
export type DraftEntry = { sets: DraftSet[]; duration: string; distance: string };
export type Draft = {
  type: WorkoutType;
  date: string;
  entries: Record<string, DraftEntry>;
};

export function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function weightText(kg: number | undefined): string {
  return kg === undefined || kg === 0 ? '' : String(kg);
}

export function newDraft(
  type: WorkoutType,
  date: string,
  previousFor: (exerciseId: string) => PreviousLog | null,
): Draft {
  const entries: Record<string, DraftEntry> = {};
  for (const e of program[type]) {
    const prev = previousFor(e.id);
    const setCount = e.kind === 'strength' ? e.sets : 0;
    const sets: DraftSet[] = [];
    for (let i = 0; i < setCount; i++) {
      const prevSet = prev?.sets[i] ?? prev?.sets[prev.sets.length - 1];
      sets.push({ weight: weightText(prevSet?.weightKg), reps: '' });
    }
    entries[e.id] = { sets, duration: '', distance: '' };
  }
  return { type, date, entries };
}

export function draftToExercises(draft: Draft, exercises: Exercise[]): LoggedExercise[] {
  const result: LoggedExercise[] = [];
  for (const e of exercises) {
    const entry = draft.entries[e.id];
    if (!entry) continue;
    const sets: SetResult[] = [];
    for (const s of entry.sets) {
      const reps = parseNumber(s.reps);
      if (reps === null || reps <= 0) continue;
      sets.push({ weightKg: parseNumber(s.weight) ?? 0, reps: Math.round(reps) });
    }
    const durationMin = parseNumber(entry.duration);
    const distanceKm = parseNumber(entry.distance);
    if (sets.length === 0 && durationMin === null && distanceKm === null) continue;
    result.push({
      exerciseId: e.id,
      name: e.name,
      kind: e.kind,
      sets,
      durationMin,
      distanceKm,
    });
  }
  return result;
}
