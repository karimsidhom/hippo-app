# Hippo Mobile — Built Status

Last updated: night of the big session.

This is a checkpoint document written when the mobile app first reached
"usable for the core resident + attending flow" in Expo Go. It tracks
what's on device today, what's not, and what needs to happen before the
app is ready to distribute beyond our own phones.

---

## ✅ What works right now (Expo Go, hippomedicine.com data)

### Auth
- Login with existing hippomedicine.com email + password
- Supabase session persists across app restarts
- Sign out from Profile tab

### Dashboard (Home tab)
- 4 KPI cards: Total cases, This month, Avg OR time, Primary surgeon %
- Voice log hero button (opens voice sheet; native speech-recognition
  requires a dev build, not Expo Go — see below)
- Manual log button (goes to Log tab)
- Recent 5 cases list
- **Staff/PD**: "EPAs to complete" card appears at top, shows pending
  sign-off count, taps through to Inbox. Hot styling when > 0, muted
  when queue is clear.

### Cases tab
- List view of all logged cases
- Search by procedure name
- Filter: year tabs, approach, role (collapsible panel)
- Pull-to-refresh
- Tap any case → detail screen (read-only)
- Detail: all fields (specialty, role, autonomy, approach, OR duration,
  console/docking time, difficulty, outcome, complication, diagnosis,
  site, notes, reflection)
- "Edit on web" button — deep-links to web for complex edits we haven't
  ported yet (dictation drawer, debrief, pearl share)
- Delete case with confirm

### Log tab (manual entry)
- Full case-log form mirroring web's QuickAddModal
- Role, autonomy, approach, difficulty — chip groups (faster than selects
  on mobile)
- OR time, attending, diagnosis, patient age, outcome, notes
- Save → creates case server-side
- Post-save: EPA suggestions sheet (taps your specialty + case context)
- Voice log sheet — sends transcript to `/api/voice-log` which parses
  with Claude Opus + hands back structured fields that pre-fill the form

### Stats tab (Analytics)
- 4 KPI tiles (Total, This year, This week, This month)
- Operative time card (total hours, avg, median)
- Autonomy % (Primary/Console surgeon rate)
- 6-month bar chart (pure View-based, no SVG)
- Top 5 procedures with horizontal bars
- Breakdowns: by role, by approach, by specialty (if >1)
- "Open full analytics on web" escape hatch for learning curves + heatmaps

### Profile tab
- Identity card: name, email, role label, training year, specialty,
  institution
- "Edit profile on web" + "Settings on web" + "Send feedback" → all
  open hippomedicine.com in the system browser
- Legal links: Terms, Privacy, PHIA, Acceptable Use
- Sign out with confirm

### Inbox (staff-only, reached from dashboard)
- List of pending EPA observations awaiting your signature
- Tap any observation to expand
- Read resident's notes + self-assessed O-score
- Set your O-score (5-button pill strip with entrustment color)
- Achievement: Achieved vs Not yet
- Sign off → POSTs to `/api/attending/observations/[id]`
- Return with reason → sends back to resident
- Recently signed list at the bottom (read-only)
- Role gate: residents get a friendly "this tab is for attendings"
  message instead

---

## ⚠️ Known limitations / not yet ported

### Voice log in Expo Go
`expo-speech-recognition` requires a custom native build. In Expo Go, the
voice button opens the sheet but fails to access the microphone. Working
in the sheet yourself should be fine (Alert errors out gracefully). To
unlock voice, install Xcode (in progress) and run `npm run ios` for a
local dev build, or kick off an EAS dev build.

### Not in the app at all
- **PD Dashboard / cohort view** — complex, multi-section. Web fallback.
- **Program calendar + events + invites** — needs design work for mobile.
  Self-hides on web if user has no programs, so this isn't a regression
  for solo residents.
- **Social / Pearls / Leaderboards** — not critical for logging workflow.
- **Settings — deep tabs** (privacy, leaderboard, social, export,
  subscription, feedback composer). Profile tab deep-links to web for now.
- **Full analytics** — learning curves, volume heatmaps, EPA target
  tracking panel. Web-only for v1.
- **Case editing / dictation drawer / debrief** — detail screen is
  read-only; edits go to web.
- **Exports (Excel, PDF)** — web-only. PDF export uses browser print
  dialog anyway.
- **Onboarding flow** — new users created from the mobile signup are
  redirected to the web for onboarding per the onboarding gate.
- **Bulk EPA sign-off / AI O-score suggest** — web-only (Pro features,
  deferred).

### Minor things
- Empty states are functional but plain
- No pull-to-refresh on Profile or Dashboard (would be nice)
- No haptic feedback on expand/collapse (only on Button)
- Mobile layout auditing on iPhone SE (narrowest screen) hasn't happened

---

## 🛠 Tech stack / arch notes for future me

- **Expo SDK 54**, **expo-router 6** (file-based routing, shares `app/`
  filename conventions with Next.js web)
- **React Native 0.81**, **React 19.1**
- **Supabase** via `@supabase/supabase-js` — bearer token stored in
  `expo-secure-store`
- **Zustand** installed but unused so far (state was trivial; can adopt
  if screens get more complex)
- **lucide-react-native** for icons (same icon set as web)
- **zod** for runtime validation of every API response — mobile can't
  trust the server during a rolling deploy
- **No global context** — each screen owns its fetches. Simpler than
  the web's AuthContext but means role-gate screens (Inbox, Dashboard
  staff card) each fetch `/api/auth/me` independently. Could be a
  small Context later if that becomes a perf problem.

### API surface consumed
- `/api/auth/me` — identity + profile
- `/api/cases` (GET, POST, GET :id, DELETE :id)
- `/api/milestones` (GET via useAuth — not yet wired but endpoint works)
- `/api/epa/suggest`, `/api/epa/ai-suggest` — EPA matcher for the log form
- `/api/voice-log` — Claude-based voice transcript parser
- `/api/attending/inbox` — EPA observations awaiting sign-off
- `/api/attending/observations/[id]` — sign / return action
- `/api/attending/summary` — pending count for dashboard card

All endpoints hit **prod** (`https://hippomedicine.com`). Changing that
would require a new `EXPO_PUBLIC_API_URL` build-time env.

---

## 🚀 Next logical steps (for the morning / next session)

### High-impact
1. **Install Xcode → run `npm run ios`** for a dev build so voice log
   works on a real device. The Xcode download is in progress as of
   this checkpoint.
2. **Test on your phone for 10 minutes** — specifically: log a case,
   check it shows in Cases list + detail, run stats, sign off an EPA
   if you have one pending. Log anything weird in the feedback form or
   send me a message.
3. **Submit to EAS for a real dev build** — once Xcode is installed
   and the local run is clean:
   ```
   npm install -g eas-cli
   eas login
   eas build --platform ios --profile development
   ```
   That produces an installable IPA you can sideload via TestFlight or
   Apple Configurator. Requires paid Apple Developer account ($99/yr)
   to distribute to other testers, but personal use on your own device
   just needs an Apple ID.

### Medium-impact (next 1–2 sessions)
4. Port **PD Dashboard** (cohort view) — attending/PD usecase.
5. Port **Program calendar** with basic read-only view.
6. Port **Onboarding flow** natively so signup doesn't require a web
   bounce.
7. Port **Case edit flow** (currently read-only detail → edit on web).
8. Wire a small **global auth/profile context** to cut redundant
   `/api/auth/me` fetches.

### Later (polish + distribution)
9. Haptics + animation polish.
10. Apple Watch complication (today's case count).
11. Home-screen widget (today's schedule).
12. Push notifications for "EPA awaiting your signature" via Expo
    Notifications + Supabase Edge Functions.
13. iPad-specific layout (ScheduleSection, Cases list would both
    benefit from two-pane).

---

## File map

```
mobile/
├── src/app/(auth)/                    # Login, signup
│   ├── login.tsx
│   └── signup.tsx
├── src/app/(app)/                     # Authenticated tab stack
│   ├── _layout.tsx                    # Tabs + role-gated inbox route
│   ├── dashboard.tsx                  # Home
│   ├── cases/
│   │   ├── index.tsx                  # List + filters
│   │   └── [id].tsx                   # Detail (read-only)
│   ├── log.tsx                        # Manual add + voice sheet
│   ├── analytics.tsx                  # Stats
│   ├── inbox.tsx                      # Attending sign-off (staff only)
│   └── profile.tsx                    # Identity + legal + sign out
├── src/components/                    # Shared UI primitives
│   ├── Screen.tsx  Text.tsx  Button.tsx  Input.tsx  Card.tsx
│   ├── ChipGroup.tsx                  # Form chip picker
│   ├── EpaSuggestionSheet.tsx         # Post-log EPA suggestions
│   └── VoiceLogSheet.tsx              # Voice dictation hero
├── src/lib/
│   ├── api.ts                         # Typed fetch + Zod validation
│   ├── supabase.ts                    # SecureStore-backed auth client
│   ├── cases.ts  epa.ts               # Typed API helpers
│   ├── voice.ts  voiceLog.ts          # expo-speech-recognition wrapper + API
└── docs/BUILT.md                      # you are here
```
