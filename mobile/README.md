# Hippo — iOS / Android app

React Native via **Expo SDK 52** in bare workflow (`expo prebuild` writes
the native `ios/` and `android/` directories — they are **not** checked
in, so `.gitignore` excludes them). Releases go through **EAS Build** and
**EAS Submit** for App Store and Play Store.

This is the strongest practical mobile stack for a Next.js-backed app:
real native UI on both platforms, a single TypeScript codebase, the
ability to drop into Swift/Kotlin via Expo Modules when we need to, and —
most importantly — shared business logic with the web app so we never
diverge on medical-education correctness.

## Why Expo over pure Swift

| Axis | Expo + EAS | Native Swift |
|---|---|---|
| Shared logic with web | Yes — Zod schemas, EPA data, API types, prompts | None — every domain rule is rewritten |
| Time to market | Weeks | Months + parallel Android still needed |
| Native feel on iOS | ~98% (Linear, Bluesky, Discord ship on this) | 100% |
| Apple/Google reviewer experience | Same binary as native | Same |
| Ability to drop into Swift | Yes — Expo Modules | n/a |

The 2% gap is worth the single-source-of-truth for a medical app where
drift between platforms is a correctness risk, not just a UX risk.

## Architecture

```
mobile/
├── app.json            # Expo config — bundle IDs, permissions, associated domains
├── eas.json            # EAS build & submit profiles
├── metro.config.js     # Resolves ../src/lib/shared for shared code with web
├── babel.config.js     # Reanimated plugin, preset-expo
├── tsconfig.json       # strict + noUncheckedIndexedAccess + path aliases
├── src/
│   ├── app/            # expo-router file-based routing
│   │   ├── _layout.tsx
│   │   ├── index.tsx           # auth gate — redirects to (auth) or (app)
│   │   ├── (auth)/             # login, signup
│   │   └── (app)/              # dashboard, cases, analytics, profile
│   ├── components/     # UI primitives matching web design system
│   ├── lib/
│   │   ├── supabase.ts         # SecureStore-backed auth client
│   │   └── api.ts              # Typed fetch wrapper w/ Zod validation
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   └── theme/
│       └── tokens.ts           # Design tokens mirrored from globals.css
└── assets/             # icons, splash, adaptive icons, notification icon
```

## Shared code with the web app

The mobile app imports from `../src/lib/shared/*` via the `@hippo/shared`
path alias (see `tsconfig.json`) and Metro's `watchFolders` (see
`metro.config.js`). **Today that directory does not exist yet** — the
shared code still lives inline in `src/lib/`. Phase 2 is to extract:

- `src/lib/epa/data.ts` → `src/lib/shared/epa/data.ts`
- `src/lib/dictation/` schemas → `src/lib/shared/dictation/`
- `z.object(...)` API payload schemas in each `api/*/route.ts` → `src/lib/shared/api-schemas/`

Both platforms then import identical Zod schemas, so a response that
passes validation on web is guaranteed to pass on mobile.

Phase 3 promotes the repo to a proper pnpm-workspaces monorepo with
`apps/web/`, `apps/mobile/`, and `packages/shared/`. Not today.

## Development

```bash
cd mobile
npm install
cp .env.example .env.local
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# Install native dirs (one-time, regenerate on plugin changes):
npm run prebuild

# Run on iOS simulator:
npm run ios

# Run on Android emulator:
npm run android
```

## First production build

```bash
# One-time setup
npm install -g eas-cli
eas login
eas init --id <new-project-id>                   # replace in app.json + eas.json
eas credentials                                   # Apple + Google signing
eas build:configure

# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --latest
```

## App Store / Play Store requirements (don't skip)

- **Apple Developer Program** — $99 USD/yr, paid under Hippo Medicine Inc.
  (NOT a personal account — corporate account means Hippo owns the app,
  not Karim personally). Requires D-U-N-S number for Hippo Medicine Inc.
- **Google Play Console** — $25 USD one-time.
- **App Privacy labels** — must match the Privacy Policy at
  `https://hippomedicine.com/legal/privacy`. The EULA route on the web
  is the canonical record; keep the App Store description in sync.
- **Data Safety (Play)** — Google's equivalent to Apple's privacy labels.
- **Account deletion path** — both stores now require in-app account
  deletion (not just a "email us" link). Route: Profile → Delete account.
- **Age rating** — select "Medical/Health Information", rated 17+ on
  Apple, Mature on Google.
- **Export compliance** — `ITSAppUsesNonExemptEncryption: false` is set
  in `app.json`. Valid because we only use HTTPS/TLS (Apple's exemption).
- **Associated domains** — `applinks:hippomedicine.com` is configured.
  You must also host `.well-known/apple-app-site-association` on the
  web side (Next.js: create `public/.well-known/apple-app-site-association`
  with your team ID + bundle ID).

See `docs/IP-FILING-CHECKLIST.md` at the repo root for legal prereqs
(Hippo Medicine Inc. incorporation, trademark, etc.) that block App
Store publication.
