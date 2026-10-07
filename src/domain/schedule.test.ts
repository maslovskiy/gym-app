/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, nextWorkoutType, upcomingWorkouts } from './schedule.ts';

test('addDays crosses month boundaries', () => {
  assert.equal(addDays('2026-10-30', 3), '2026-11-02');
});

test('addDays is not affected by DST changes', () => {
  assert.equal(addDays('2026-03-28', 2), '2026-03-30');
});

test('first workout is A when there is no history', () => {
  assert.equal(nextWorkoutType(null), 'A');
});

test('workouts alternate based on the last completed one', () => {
  assert.equal(nextWorkoutType('A'), 'B');
  assert.equal(nextWorkoutType('B'), 'A');
});

const config = { startDate: '2026-10-05', intervalDays: 2 };

test('next workout is the start date when today is before it', () => {
  const [next] = upcomingWorkouts({ config, today: '2026-10-01', lastWorkout: null, count: 1 });
  assert.deepEqual(next, { date: '2026-10-05', type: 'A' });
});

test('next workout is today when today is a training day', () => {
  const [next] = upcomingWorkouts({ config, today: '2026-10-07', lastWorkout: null, count: 1 });
  assert.equal(next.date, '2026-10-07');
});

test('next workout is the following training day when today is a rest day', () => {
  const [next] = upcomingWorkouts({ config, today: '2026-10-08', lastWorkout: null, count: 1 });
  assert.equal(next.date, '2026-10-09');
});

test('a workout already done today moves next to the following training day', () => {
  const [next] = upcomingWorkouts({
    config,
    today: '2026-10-07',
    lastWorkout: { date: '2026-10-07', type: 'A' },
    count: 1,
  });
  assert.deepEqual(next, { date: '2026-10-09', type: 'B' });
});

test('every second day rolls through all weekdays, alternating A/B', () => {
  const list = upcomingWorkouts({
    config: { startDate: '2026-10-05', intervalDays: 2 }, // a Monday
    today: '2026-10-05',
    lastWorkout: { date: '2026-10-03', type: 'B' },
    count: 5,
  });
  assert.deepEqual(list, [
    { date: '2026-10-05', type: 'A' },
    { date: '2026-10-07', type: 'B' },
    { date: '2026-10-09', type: 'A' },
    { date: '2026-10-11', type: 'B' },
    { date: '2026-10-13', type: 'A' },
  ]);
});

test('respects a custom interval', () => {
  const list = upcomingWorkouts({
    config: { startDate: '2026-10-05', intervalDays: 3 },
    today: '2026-10-06',
    lastWorkout: null,
    count: 2,
  });
  assert.deepEqual(
    list.map((w) => w.date),
    ['2026-10-08', '2026-10-11'],
  );
});
