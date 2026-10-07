// Dates are local calendar days as 'YYYY-MM-DD' strings. Arithmetic goes
// through UTC so daylight-saving changes never shift a day.

export type WorkoutType = 'A' | 'B';

export type ScheduleConfig = {
  startDate: string;
  intervalDays: number;
};

export type PlannedWorkout = { date: string; type: WorkoutType };

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

// A/B alternates on what was actually done, so a missed day never
// makes you skip a workout.
export function nextWorkoutType(lastType: WorkoutType | null): WorkoutType {
  return lastType === 'A' ? 'B' : 'A';
}

// First training day on or after `from`.
function firstSlotOnOrAfter(config: ScheduleConfig, from: string): string {
  const diff = daysBetween(config.startDate, from);
  if (diff <= 0) return config.startDate;
  const steps = Math.ceil(diff / config.intervalDays);
  return addDays(config.startDate, steps * config.intervalDays);
}

export function upcomingWorkouts(args: {
  config: ScheduleConfig;
  today: string;
  lastWorkout: PlannedWorkout | null;
  count: number;
}): PlannedWorkout[] {
  const { config, today, lastWorkout, count } = args;
  const doneToday = lastWorkout !== null && lastWorkout.date >= today;
  let date = firstSlotOnOrAfter(config, doneToday ? addDays(today, 1) : today);
  let type = nextWorkoutType(lastWorkout?.type ?? null);

  const result: PlannedWorkout[] = [];
  for (let i = 0; i < count; i++) {
    result.push({ date, type });
    date = addDays(date, config.intervalDays);
    type = nextWorkoutType(type);
  }
  return result;
}
