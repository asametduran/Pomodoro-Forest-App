# Forest Pomodoro: store listing kit

Everything needed to publish on the Apple App Store and Google Play later. Nothing here costs money
until you choose to publish (Apple Developer Program: $99/year; Google Play Console: $25 one-time).
Until then, distribute for free as an Android `.apk` and an installable web app (see the README).

## Identity

| Field | Value |
| --- | --- |
| App name | Forest Pomodoro |
| Developer / seller | Abdulsamet Duran |
| Contact email | asametdurann@gmail.com |
| Bundle ID (iOS) / package (Android) | `com.asametduran.pomodoroforest` |
| Version | 1.0.0 (build numbers are managed by EAS, `appVersionSource: remote`) |
| Category | Productivity (secondary: Education) |
| Price | Free. No in-app purchases, no ads, no subscriptions |
| Age rating | 4+ (Apple) / Everyone (Google, IARC questionnaire: no objectionable content) |
| Support URL | `https://<your-site>.vercel.app/support` |
| Privacy policy URL | `https://<your-site>.vercel.app/privacy` |
| Terms URL | `https://<your-site>.vercel.app/terms` |

The web build serves `privacy.html`, `terms.html` and `support.html` from this folder at `/privacy`,
`/terms` and `/support`, so the URLs above work as soon as the site is deployed.

## Store text

**iOS subtitle** (30 max, 28 used)
> Focus timer that grows trees

**Google Play short description** (80 max, 69 used)
> A calm Pomodoro timer: stay focused and grow a tree for every session.

**iOS promotional text** (170 max)
> Plant a seed, stay focused, and watch it grow into a tree. Build a forest of finished focus
> sessions, earn coins, and unlock new trees.

**iOS keywords** (100 max, 87 used; no spaces after commas)
> pomodoro,focus,timer,study,productivity,concentration,deep work,habit,tree,forest,break

**Full description**

> Forest Pomodoro turns focus into something you can see. Start a session and a seed sprouts, grows
> into a sapling and becomes a full tree while you work. Finish the session and the tree joins your
> forest. Give up, or leave the app for too long, and it withers.
>
> FOCUS, BEAUTIFULLY
> • A calm Pomodoro timer with 15, 25, 45 or 60 minute sessions (or your own length)
> • Short and long breaks that follow the classic Pomodoro rhythm
> • Animated trees that grow in real time and celebrate when you finish
> • Gentle sound and haptic alerts
>
> GROW YOUR FOREST
> • Every finished session plants a tree in your personal forest
> • Tag sessions as Study, Coding, Work or Reading and filter your forest
> • See trees per day, daily and weekly focus time, and your recent sessions
>
> STAY MOTIVATED
> • Level up as you focus and keep a daily streak
> • Earn coins and unlock new species: Quiet Pine, Blossom Cherry and Ember Maple
>
> PRIVATE BY DEFAULT
> • Works fully offline with no account
> • Optional account to back up your forest and sync across devices
> • No ads, no tracking, no analytics
>
> Light and dark themes included.

**What's new in 1.0.0**
> First release: grow trees while you focus, build your forest, track your stats and unlock new species.

## App privacy answers

Use these for Apple's App Privacy section and Google Play's Data safety form. They match
[`privacy.html`](privacy.html).

- **Without an account (guest mode):** no data is collected; everything stays on the device.
- **With an optional account:**
  - *Contact info → Email address*: used for app functionality and account management. Linked to the
    user. Not used for tracking.
  - *User content → Other user content* (focus sessions: start/end time, duration, tag, tree species,
    coins earned) and *Other data* (coins, unlocked species, streak, timer settings): used for app
    functionality (backup and sync). Linked to the user. Not used for tracking.
  - *Identifiers → User ID* (account identifier): app functionality. Linked to the user.
- **Not collected:** location, contacts, photos, health, financial info, browsing history, diagnostics,
  advertising identifiers. No third-party advertising or analytics SDKs.
- **Tracking:** none (Apple: "Data Not Used to Track You").
- **Security:** encrypted in transit (HTTPS). Users can request deletion by email (see below).
- **Encryption export compliance:** uses only standard HTTPS, so `ITSAppUsesNonExemptEncryption` is
  `false` in `app.json`.

## Permissions

- Android: `INTERNET` (sync), `VIBRATE` (haptics), `WAKE_LOCK` (keeps the screen on during a session).
  The microphone permission is disabled (`expo-audio` is configured for playback only).
- iOS: no permission prompts.

## Screenshots

Current captures are in [`docs/screenshots`](../docs/screenshots). For the stores, capture on a device
or simulator at the required sizes:

- Apple: 6.9" iPhone (1320 × 2868 or 1290 × 2796); iPad 13" only if `supportsTablet` stays `true`.
- Google Play: at least 2 phone screenshots (min 320 px, max 3840 px, 16:9 or 9:16) and a
  1024 × 500 feature graphic.

Suggested order: Focus (growing tree) → Finished celebration → My Forest → Tree detail → Stats → Seeds.

## Before publishing: checklist

- [ ] **In-app account deletion.** Apple (Guideline 5.1.1(v)) and Google Play require a way to delete an
  account from inside the app (Google also wants a web link). Today users must email
  asametdurann@gmail.com. Add a "Delete my account and data" action before submitting. Note that the
  Supabase login is shared with habit-tracker-app, so decide whether deletion removes only the
  Pomodoro data or the whole account.
- [ ] **Name check.** "Forest" is also the name of a well-known focus app. Search the stores and
  trademark databases, and consider a more distinctive name if needed.
- [ ] **Legal review.** `privacy.html` and `terms.html` are good-faith templates, not legal advice. Have
  them reviewed for the countries where you publish (for example GDPR in the EU/UK).
- [x] **License.** `LICENSE` is the standard MIT License, Copyright (c) 2026 Abdulsamet Duran (replaced
  the Expo template's notice).
- [ ] **Hosted URLs.** Deploy the web app and replace `<your-site>` above with the real domain.
- [ ] **Supabase redirect URLs.** Add `pomodoroapp://**` and the web origin under Authentication → URL
  Configuration so email links open the app.
- [ ] **Screenshots and feature graphic** at the store sizes above.
- [ ] **Test** a production build on a real iPhone and Android phone.
