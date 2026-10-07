# Gym

Tiny personal iOS workout tracker: next workout (A/B, every N days), set logging, history. Expo + React Native + TypeScript, data in on-device SQLite. iOS only.

## Run

```bash
npm install
npm run ios        # starts Metro; open in Expo Go or the iOS simulator
```

## Checks

```bash
npm run typecheck
npm run lint
npm test           # node's built-in test runner on src/domain
```

## Layout

- `src/app/` — Expo Router screens (Home & History tabs, workout, history detail, exercise info, settings)
- `src/domain/` — pure logic, no React: schedule, program (Workout A/B + exercise info), draft → log conversion, weight suggestion
- `src/db.ts` — all SQLite access and the schema migration (`PRAGMA user_version`)

## Notes

- Schedule: training days are `startDate + k × intervalDays`. A/B alternates on the last *completed* workout, so a missed day never skips a workout.
- The in-progress workout is saved on every keystroke and resumed from Home if the app is closed.
- Exercise images: set `image: require('../../assets/exercises/<id>.png')` on an exercise in `src/domain/program.ts`; the info screen shows it in place of the placeholder.
