/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSets, suggestWeight } from './suggest.ts';

const target = { repsMin: 8, repsMax: 10, increment: 2.5 };

test('suggests the next increment when every set hit the top of the range', () => {
  const sets = [
    { weightKg: 45, reps: 10 },
    { weightKg: 45, reps: 10 },
    { weightKg: 45, reps: 10 },
  ];
  assert.equal(suggestWeight(sets, target), 47.5);
});

test('no suggestion when some set fell short of the top of the range', () => {
  const sets = [
    { weightKg: 45, reps: 10 },
    { weightKg: 45, reps: 9 },
    { weightKg: 45, reps: 8 },
  ];
  assert.equal(suggestWeight(sets, target), null);
});

test('no suggestion without previous sets', () => {
  assert.equal(suggestWeight([], target), null);
});

test('suggestion builds on the heaviest weight used', () => {
  const sets = [
    { weightKg: 40, reps: 12 },
    { weightKg: 45, reps: 10 },
  ];
  assert.equal(suggestWeight(sets, target), 47.5);
});

test('formatSets renders a compact summary', () => {
  assert.equal(
    formatSets([
      { weightKg: 45, reps: 10 },
      { weightKg: 47.5, reps: 9 },
    ]),
    '45 kg × 10 / 47.5 kg × 9',
  );
});
