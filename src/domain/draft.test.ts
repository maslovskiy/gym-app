/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftToExercises, newDraft, parseNumber } from './draft.ts';
import { program } from './program.ts';

test('parseNumber accepts a decimal comma from European keypads', () => {
  assert.equal(parseNumber('47,5'), 47.5);
  assert.equal(parseNumber(' 45 '), 45);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('abc'), null);
});

test('newDraft prefills weight from the previous session, reps stay empty', () => {
  const draft = newDraft('A', '2026-10-07', (id) =>
    id === 'barbell-bench-press'
      ? {
          sets: [
            { weightKg: 45, reps: 10 },
            { weightKg: 42.5, reps: 9 },
          ],
          durationMin: null,
          distanceKm: null,
        }
      : null,
  );
  const bench = draft.entries['barbell-bench-press'];
  // 3 target sets; the missing third falls back to the last weight used
  assert.deepEqual(
    bench.sets.map((s) => s.weight),
    ['45', '42.5', '42.5'],
  );
  assert.ok(bench.sets.every((s) => s.reps === ''));
  assert.deepEqual(
    draft.entries['lat-pulldown'].sets.map((s) => s.weight),
    ['', '', ''],
  );
});

test('draftToExercises keeps only sets with reps and skips untouched exercises', () => {
  const draft = newDraft('A', '2026-10-07', () => null);
  draft.entries['barbell-bench-press'].sets = [
    { weight: '45', reps: '10' },
    { weight: '45', reps: '9' },
    { weight: '45', reps: '' },
  ];
  draft.entries['treadmill'].duration = '18';
  draft.entries['treadmill'].distance = '2,1';

  const result = draftToExercises(draft, program.A);
  assert.deepEqual(result, [
    {
      exerciseId: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      kind: 'strength',
      sets: [
        { weightKg: 45, reps: 10 },
        { weightKg: 45, reps: 9 },
      ],
      durationMin: null,
      distanceKm: null,
    },
    {
      exerciseId: 'treadmill',
      name: 'Cardio — Treadmill',
      kind: 'cardio',
      sets: [],
      durationMin: 18,
      distanceKm: 2.1,
    },
  ]);
});

test('bodyweight sets (empty weight) are stored as 0 kg', () => {
  const draft = newDraft('A', '2026-10-07', () => null);
  draft.entries['lat-pulldown'].sets[0] = { weight: '', reps: '12' };
  const [log] = draftToExercises(draft, program.A);
  assert.deepEqual(log.sets, [{ weightKg: 0, reps: 12 }]);
});
