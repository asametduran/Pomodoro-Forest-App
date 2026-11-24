# Forest Pomodoro 🌳

_Focus. Grow. Breathe._ A Forest-style Pomodoro timer for iOS, Android and the web. Start a focus
session and a tree grows from seed to full tree on screen. Stay focused to add it to your forest;
give up or leave the app and it withers.

Built with **Expo SDK 58 / React Native 0.88**, Expo Router, Zustand, react-native-svg and Reanimated,
with optional **Supabase** auth and cloud sync.

| Idle (dark) | Focus (light) | Break | Completed |
| --- | --- | --- | --- |
| ![Idle](docs/screenshots/idle-dark.png) | ![Focus](docs/screenshots/focus-light.png) | ![Break](docs/screenshots/break-light.png) | ![Completed](docs/screenshots/done-dark.png) |

| My Forest | Tree detail | Idle (light) | Settings |
| --- | --- | --- | --- |
| ![Forest](docs/screenshots/forest-light.png) | ![Detail](docs/screenshots/detail-dark.png) | ![Idle light](docs/screenshots/idle-light.png) | ![Settings](docs/screenshots/settings-light.png) |

## Features

- **Growing tree timer**: seed → sprout → sapling → full tree, drawn as animated vector art (crisp on
  every screen). Trees sway, breathe, react when tapped, and celebrate when you finish.
- **Focus rules**: give up, or leave the app/tab longer than the grace period, and the tree withers.
  The timer runs from a stored end time, so backgrounding or reloading never loses time.
- **Tags & durations**: Study / Coding / Work / Reading, 15 / 25 / 45 / 60 min presets (or custom),
  short and long breaks.
- **My Forest**: grid of every session with clear Grown / Withered badges, filters by tag, totals, a
  14-day trees-per-day chart, and a detail sheet per tree (with sharing).
- **Progress**: levels with XP, daily streak, coins (1 per focused minute) and four unlockable species.
- **Stats**: today / last 7 days, daily focus chart, recent sessions, time by tag.
- **Settings**: timer lengths, sound + haptic alerts, strict mode, a **Growth lab** to preview every
  animation state, and account management.
- **Accounts & sync (optional)**: email/password sign-up, sign-in, sign-out and password reset via
  Supabase (PKCE). Works fully offline as a guest; signing in merges guest sessions, coins and species
  into the account and keeps devices in sync.
- **Light & dark themes** following the design mockups in [`design/mockups`](design/mockups).

## Getting started

Prerequisites: Node 20+, npm, and either a phone with Expo Go / a development build, an emulator, or a browser.

```bash
npm install
cp .env.example .env.local   # optional: only needed for accounts & cloud sync
npm run web                  # or: npm run ios / npm run android / npm start
```

Without `.env.local` the app runs in local-only guest mode.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server (scan the QR code with Expo Go or a dev build) |
| `npm run web` / `ios` / `android` | Start on a specific platform |
| `npm test` | Jest unit tests (timer engine, stats, progress, sync merge rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`expo lint`) |
| `npx expo-doctor` | Dependency / config health check |

## Cloud sync with Supabase (optional)

The app shares an existing Supabase project, so every table is prefixed `pomodoro_`:

- `pomodoro_profiles`: coins, selected / unlocked species, focus streak, settings (one row per user)
- `pomodoro_sessions`: one row per finished focus session

Both have Row Level Security with `auth.uid() = user_id` policies for select, insert (`WITH CHECK`),
update (`USING` + `WITH CHECK`) and delete; the `anon` role has no access. CHECK constraints validate
every column server-side. Schema: [`supabase/migrations/20261124000000_pomodoro_schema.sql`](supabase/migrations/20261124000000_pomodoro_schema.sql).

1. Fill in `.env.local` (see [`.env.example`](.env.example)):
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
   Only the **anon** key belongs in the app. Never put the `service_role` key in an `EXPO_PUBLIC_` variable.
2. Apply the migration:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push --remote
   ```
   The `*_habit_tracker_app_placeholder.sql` files are intentionally empty: they mirror migrations
   that the other app already applied to the shared project, so `db push` only applies `pomodoro_*`.
3. In the Supabase dashboard → **Authentication → URL Configuration**, add the app's redirect URLs
   (for example `pomodoroapp://**` and your web origin) so confirmation and reset links open the app.

Session tokens are stored in the iOS Keychain / Android Keystore via `expo-secure-store`
(chunked, since sessions can exceed 2 KB) and in `localStorage` on web.

## Architecture

```
src/
  app/                 Expo Router screens: index (Focus), forest, stats, seeds, settings, _layout
  components/          UI kit (ui.tsx), growth stage, scene + tree SVG art, sheets, icons, tab bars
    tree/              tree-svg (all species × growth stages), species-badge
  lib/                 Pure, unit-tested logic
    engine.ts          Timer state machine: start / finish / give up / leave-the-app rules, coins
    stats.ts           Daily totals, summaries, formatting
    progress.ts        Levels and streaks
    sync.ts            Supabase row mapping + merge rules
    supabase.ts        Supabase client (PKCE, secure storage, foreground token refresh)
    secure-storage.ts  Chunked SecureStore adapter (native) / localStorage (web)
  store/
    app-store.ts       Zustand store persisted to AsyncStorage (UUID + timestamp records)
    auth-store.ts      Auth flows, deep-link code exchange, debounced cloud sync
  hooks/               Timer runtime (end detection, app/tab leave detection, keep-awake), etc.
supabase/migrations/   Database schema + RLS
design/mockups/        Reference screens cropped from the design boards
```

Data flow: screens call store actions → `lib/engine.ts` returns the next state → Zustand persists it
locally. When signed in, `auth-store` watches for changes and syncs: it uploads new sessions, merges
the profile (unsynced local edits win, otherwise the cloud copy), and on first sign-in adds guest coins
and species to the account. Signing out clears the device copy; the data stays in the cloud.

## Testing & quality

- `npm test`: 73 unit tests covering the timer engine, stats, streaks/levels and sync merge rules.
- `npm run typecheck` and `npm run lint` must pass with zero errors.
- Visual checks: the screens were compared side-by-side with the mockups in `design/mockups` using
  headless Chrome screenshots at 390 × 784.

## Notes

- `ios/` and `android/` are generated (Continuous Native Generation); configure native behaviour in
  `app.json`. Native modules beyond Expo Go need a development build (`eas build --profile development`).
- Replace the placeholder bundle identifier `com.example.pomodoroapp` in `app.json` before publishing.
