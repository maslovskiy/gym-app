import type { ImageSourcePropType } from 'react-native';
import type { WorkoutType } from './schedule.ts';

export type StrengthExercise = {
  kind: 'strength';
  id: string;
  name: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  // Step used for the "consider X kg" hint.
  increment: number;
  muscle: string;
  howTo: string;
  // Drop a require('../../assets/exercises/<id>.png') (or a GIF) here later.
  image?: ImageSourcePropType;
};

export type CardioExercise = {
  kind: 'cardio';
  id: string;
  name: string;
  minutesMin: number;
  minutesMax: number;
  muscle: string;
  howTo: string;
  image?: ImageSourcePropType;
};

export type Exercise = StrengthExercise | CardioExercise;

const exercises = {
  benchPress: {
    kind: 'strength',
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    increment: 2.5,
    muscle: 'Chest (also front shoulders, triceps)',
    howTo:
      'Lie on the flat bench, eyes under the bar, feet flat. Grip slightly wider than shoulders. Unrack, lower the bar under control to mid-chest, then press back up until arms are straight. Keep shoulder blades squeezed together.',
  },
  latPulldown: {
    kind: 'strength',
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    increment: 2.5,
    muscle: 'Back (lats), biceps',
    howTo:
      'Sit at the cable machine with thighs under the pads. Grab the wide bar, lean back slightly, and pull it down to your upper chest by driving elbows down. Control it back up until arms are straight.',
  },
  legPress: {
    kind: 'strength',
    id: 'leg-press',
    name: 'Leg Press',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    increment: 5,
    muscle: 'Quads, glutes',
    howTo:
      'Sit in the machine, feet shoulder-width on the platform. Release the safeties, lower the platform until knees are around 90°, then push back up without locking your knees. Keep your lower back against the pad.',
  },
  shoulderPress: {
    kind: 'strength',
    id: 'seated-dumbbell-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    sets: 3,
    repsMin: 10,
    repsMax: 10,
    increment: 2,
    muscle: 'Shoulders, triceps',
    howTo:
      'Sit on an upright bench with a dumbbell in each hand at shoulder height, palms forward. Press both overhead until arms are almost straight, then lower slowly back to shoulder height.',
  },
  bicepsCurl: {
    kind: 'strength',
    id: 'dumbbell-biceps-curl',
    name: 'Dumbbell Biceps Curl',
    sets: 2,
    repsMin: 10,
    repsMax: 12,
    increment: 1,
    muscle: 'Biceps',
    howTo:
      'Stand holding dumbbells at your sides, palms forward. Keeping elbows pinned to your sides, curl the weights up to your shoulders, then lower slowly. No swinging.',
  },
  inclineDbPress: {
    kind: 'strength',
    id: 'incline-dumbbell-bench-press',
    name: 'Incline Dumbbell Bench Press',
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    increment: 2,
    muscle: 'Upper chest, front shoulders, triceps',
    howTo:
      'Set the bench to about 30°. Sit back with a dumbbell in each hand at chest level. Press up until arms are straight over your chest, then lower slowly until the dumbbells are beside your chest.',
  },
  cableRow: {
    kind: 'strength',
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    sets: 3,
    repsMin: 10,
    repsMax: 12,
    increment: 2.5,
    muscle: 'Mid back, lats, biceps',
    howTo:
      'Sit at the low cable with feet on the platform, knees slightly bent. Hold the handle with arms straight, back upright. Pull the handle to your belly, squeezing shoulder blades together, then let it return slowly.',
  },
  rdl: {
    kind: 'strength',
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    sets: 3,
    repsMin: 8,
    repsMax: 10,
    increment: 2.5,
    muscle: 'Hamstrings, glutes, lower back',
    howTo:
      'Stand holding a barbell (or dumbbells) at hip height. With knees slightly bent and back flat, push your hips back and slide the weight down your thighs until you feel a stretch in the hamstrings. Drive hips forward to stand up.',
  },
  lateralRaise: {
    kind: 'strength',
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    sets: 3,
    repsMin: 12,
    repsMax: 15,
    increment: 1,
    muscle: 'Side shoulders',
    howTo:
      'Stand with light dumbbells at your sides. With a slight bend in the elbows, raise your arms out to the sides until they are at shoulder height, then lower slowly. Lead with the elbows, don’t shrug.',
  },
  tricepsPushdown: {
    kind: 'strength',
    id: 'cable-triceps-pushdown',
    name: 'Cable Triceps Pushdown',
    sets: 2,
    repsMin: 10,
    repsMax: 12,
    increment: 2.5,
    muscle: 'Triceps',
    howTo:
      'Stand at the high cable with a bar or rope attachment. Elbows tucked at your sides, push the handle down until arms are straight, then let it rise back to about chest height without moving your elbows.',
  },
  treadmill: {
    kind: 'cardio',
    id: 'treadmill',
    name: 'Cardio — Treadmill',
    minutesMin: 15,
    minutesMax: 20,
    muscle: 'Heart & lungs',
    howTo:
      'Brisk walk on an incline or an easy jog. You should be able to talk in short sentences. Start slower for the first couple of minutes.',
  },
} satisfies Record<string, Exercise>;

export const program: Record<WorkoutType, Exercise[]> = {
  A: [
    exercises.benchPress,
    exercises.latPulldown,
    exercises.legPress,
    exercises.shoulderPress,
    exercises.bicepsCurl,
    exercises.treadmill,
  ],
  B: [
    exercises.inclineDbPress,
    exercises.cableRow,
    exercises.rdl,
    exercises.lateralRaise,
    exercises.tricepsPushdown,
    exercises.treadmill,
  ],
};

export function findExercise(id: string): Exercise | undefined {
  return Object.values(exercises).find((e) => e.id === id);
}

export function targetLabel(e: Exercise): string {
  if (e.kind === 'cardio') return `${e.minutesMin}–${e.minutesMax} min`;
  const reps = e.repsMin === e.repsMax ? `${e.repsMin}` : `${e.repsMin}–${e.repsMax}`;
  return `${e.sets} × ${reps}`;
}
