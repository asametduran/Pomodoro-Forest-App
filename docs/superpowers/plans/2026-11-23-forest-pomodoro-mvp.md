# Forest Pomodoro MVP — Implementation Plan

Decisions (confirmed with the user): animated 2D SVG trees; 4 species with shared growth stages;
local-first (Zustand persisted to AsyncStorage, UUID + timestamp records so Supabase sync can come later);
coins earned per completed session unlock species; no purchases/ads; iOS + Android + web (web = local testing).

Confirmed behaviour: timer runs from a stored end timestamp; giving up or leaving the app/tab
(beyond a short grace period) kills the tree and logs a withered session; web uses tab visibility.

## Architecture

- `src/lib/*` — pure, unit-tested logic (no React): `growth`, `species`, `timer`, `coins`, `stats`, `engine`.
- `src/store/app-store.ts` — thin Zustand + `persist` wrapper around `engine` transitions.
- `src/components/tree/*` — SVG tree (`TreeSvg`), swaying wrapper (Reanimated).
- `src/hooks/*` — `useNow` ticker, `useAppLeave` (AppState / visibilitychange), `useAlerts` (haptics + sound).
- `src/app/*` — Expo Router tabs: Focus, Forest, Stats, Seeds (shop), Settings.

## Data model (sync-ready)

`Session { id (uuid), startedAt, endedAt, plannedSeconds, actualSeconds, tag, speciesId,
status: 'completed' | 'withered', coinsEarned, createdAt, updatedAt }` (epoch ms).
Active timer is persisted so reloads/backgrounding keep accurate time.

## Steps

1. Dependencies + jest/eslint config; `web.output = static`.
2. Pure logic + tests (growth stages, timer math, coins, stats, engine transitions).
3. Store + hooks.
4. Palette (sage + warm earth, light/dark) and shared UI atoms.
5. `TreeSvg` (seed → sprout → sapling → tree, withered state, 4 species).
6. Screens: Focus (timer, tags, give up, results), Forest grid, Stats, Seeds shop, Settings.
7. Remove starter template files; verify `tsc`, `eslint`, `jest`; start web dev server.

## Out of scope (follow-ups)

Supabase auth/sync, local notifications when the timer ends in background, IAP/ads, widgets.
