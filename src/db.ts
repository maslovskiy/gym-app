import type { SQLiteDatabase } from 'expo-sqlite';
import type { Draft, LoggedExercise, PreviousLog } from './domain/draft.ts';
import type { PlannedWorkout, ScheduleConfig, WorkoutType } from './domain/schedule.ts';
import { todayString } from './domain/schedule.ts';

export const DATABASE_NAME = 'gym.db';

export type WorkoutSummary = { id: number; date: string; type: WorkoutType };
export type WorkoutRecord = WorkoutSummary & { exercises: LoggedExercise[] };

// Bump user_version and append a step to add schema changes later.
export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('A', 'B')),
        completed_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS exercise_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        exercise_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('strength', 'cardio')),
        duration_min REAL,
        distance_km REAL
      );
      CREATE INDEX IF NOT EXISTS exercise_logs_exercise ON exercise_logs(exercise_id);
      CREATE TABLE IF NOT EXISTS sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
        set_number INTEGER NOT NULL,
        weight_kg REAL NOT NULL,
        reps INTEGER NOT NULL
      );
      PRAGMA user_version = 1;
    `);
  }
  await db.execAsync('PRAGMA foreign_keys = ON');
}

async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

// --- Schedule config -------------------------------------------------------

export async function getConfig(db: SQLiteDatabase): Promise<ScheduleConfig> {
  const raw = await getSetting(db, 'schedule');
  if (raw) return JSON.parse(raw) as ScheduleConfig;
  // First launch: training starts today, every 2 days.
  const config = { startDate: todayString(), intervalDays: 2 };
  await setConfig(db, config);
  return config;
}

export async function setConfig(db: SQLiteDatabase, config: ScheduleConfig): Promise<void> {
  await setSetting(db, 'schedule', JSON.stringify(config));
}

// --- In-progress workout (survives the app being killed between sets) ------

export async function getDraft(db: SQLiteDatabase): Promise<Draft | null> {
  const raw = await getSetting(db, 'draft');
  return raw ? (JSON.parse(raw) as Draft) : null;
}

export async function saveDraft(db: SQLiteDatabase, draft: Draft): Promise<void> {
  await setSetting(db, 'draft', JSON.stringify(draft));
}

export async function clearDraft(db: SQLiteDatabase): Promise<void> {
  await db.runAsync("DELETE FROM settings WHERE key = 'draft'");
}

// --- Workouts --------------------------------------------------------------

export async function getLastWorkout(db: SQLiteDatabase): Promise<PlannedWorkout | null> {
  return db.getFirstAsync<PlannedWorkout>(
    'SELECT date, type FROM workouts ORDER BY date DESC, id DESC LIMIT 1',
  );
}

export async function listWorkouts(db: SQLiteDatabase): Promise<WorkoutSummary[]> {
  return db.getAllAsync<WorkoutSummary>(
    'SELECT id, date, type FROM workouts ORDER BY date DESC, id DESC',
  );
}

type LogRow = {
  id: number;
  exercise_id: string;
  exercise_name: string;
  kind: LoggedExercise['kind'];
  duration_min: number | null;
  distance_km: number | null;
};

async function setsFor(db: SQLiteDatabase, logId: number) {
  return db.getAllAsync<{ weightKg: number; reps: number }>(
    'SELECT weight_kg AS weightKg, reps FROM sets WHERE log_id = ? ORDER BY set_number',
    logId,
  );
}

export async function getWorkout(db: SQLiteDatabase, id: number): Promise<WorkoutRecord | null> {
  const workout = await db.getFirstAsync<WorkoutSummary>(
    'SELECT id, date, type FROM workouts WHERE id = ?',
    id,
  );
  if (!workout) return null;
  const logs = await db.getAllAsync<LogRow>(
    'SELECT * FROM exercise_logs WHERE workout_id = ? ORDER BY position',
    id,
  );
  const exercises: LoggedExercise[] = [];
  for (const log of logs) {
    exercises.push({
      exerciseId: log.exercise_id,
      name: log.exercise_name,
      kind: log.kind,
      sets: await setsFor(db, log.id),
      durationMin: log.duration_min,
      distanceKm: log.distance_km,
    });
  }
  return { ...workout, exercises };
}

// Most recent logged result for each exercise id.
export async function getPreviousLogs(db: SQLiteDatabase): Promise<Record<string, PreviousLog>> {
  const logs = await db.getAllAsync<LogRow>(`
    SELECT l.* FROM exercise_logs l
    JOIN workouts w ON w.id = l.workout_id
    WHERE l.id = (
      SELECT l2.id FROM exercise_logs l2
      JOIN workouts w2 ON w2.id = l2.workout_id
      WHERE l2.exercise_id = l.exercise_id
      ORDER BY w2.date DESC, w2.id DESC
      LIMIT 1
    )
  `);
  const result: Record<string, PreviousLog> = {};
  for (const log of logs) {
    result[log.exercise_id] = {
      sets: await setsFor(db, log.id),
      durationMin: log.duration_min,
      distanceKm: log.distance_km,
    };
  }
  return result;
}

export async function saveWorkout(
  db: SQLiteDatabase,
  workout: { date: string; type: WorkoutType; exercises: LoggedExercise[] },
): Promise<void> {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const { lastInsertRowId: workoutId } = await tx.runAsync(
      'INSERT INTO workouts (date, type, completed_at) VALUES (?, ?, ?)',
      workout.date,
      workout.type,
      new Date().toISOString(),
    );
    for (const [position, e] of workout.exercises.entries()) {
      const { lastInsertRowId: logId } = await tx.runAsync(
        `INSERT INTO exercise_logs
           (workout_id, position, exercise_id, exercise_name, kind, duration_min, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        workoutId,
        position,
        e.exerciseId,
        e.name,
        e.kind,
        e.durationMin,
        e.distanceKm,
      );
      for (const [i, s] of e.sets.entries()) {
        await tx.runAsync(
          'INSERT INTO sets (log_id, set_number, weight_kg, reps) VALUES (?, ?, ?, ?)',
          logId,
          i + 1,
          s.weightKg,
          s.reps,
        );
      }
    }
    await tx.runAsync("DELETE FROM settings WHERE key = 'draft'");
  });
}

export async function deleteWorkout(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM workouts WHERE id = ?', id);
}

export async function resetAll(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM sets;
    DELETE FROM exercise_logs;
    DELETE FROM workouts;
    DELETE FROM settings;
  `);
}
