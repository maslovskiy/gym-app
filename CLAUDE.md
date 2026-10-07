# gym-app

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues (`maslovskiy/gym-app`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## App

Expo SDK 57 iOS-only app — see `README.md` for layout and `AGENTS.md` for Expo rules. Run `npm run typecheck`, `npm run lint` and `npm test` before declaring work done. `npx expo install` can't reach Expo's API from cloud sessions; pin versions from `node_modules/expo/bundledNativeModules.json` instead.
