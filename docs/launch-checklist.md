# Hippo — Launch Checklist

The four tasks below require action from you (Karim) because they involve
external accounts or DNS — they can't be done from this repo alone. Each is
small (5–30 min). None of them block the friends-and-residents beta; all of
them should be done before a broad public launch.

Order of priority, worst-case scenarios, and the exact steps.

---

## 1. Activate Sentry (error monitoring) — ~15 min

**Why**: right now if a user hits a bug, you only learn about it if they
submit the feedback form. Sentry catches every unhandled exception, groups
them by stack trace, and emails you the first time a new error appears.

**Code status**: Fully wired. Activates the moment the DSN env var is set.

### Steps

1. **Sign up**: https://sentry.io → "Start a trial" (free tier: 5K errors/mo, 50 replays/mo)
2. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue**
   - Team: (create or use default)
   - Project name: `hippo-web`
3. Sentry shows you a **DSN** (looks like `https://xxxx@o123.ingest.sentry.io/456`). Copy it.
4. Also note your **org slug** and **project slug** from the URL (`sentry.io/organizations/<ORG>/projects/<PROJECT>`).
5. (Optional but recommended) In Sentry → Settings → Auth Tokens → Create new token with `project:releases` scope. Copy.
6. Add 3 env vars in Vercel (Settings → Environment Variables, scope = Production + Preview):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SENTRY_DSN` | the DSN from step 3 |
   | `SENTRY_ORG` | your org slug |
   | `SENTRY_PROJECT` | `hippo-web` |
   | `SENTRY_AUTH_TOKEN` | the token from step 5 (optional — enables source-map upload) |

7. Redeploy: `vercel deploy --prod --yes`
8. Trigger a test error: open DevTools on hippomedicine.com, run `throw new Error("sentry test")`. Within ~60s it should appear in Sentry.

### What you get
- Email alert the first time any new error appears
- Stack trace with file/line (source maps included)
- Session replay for the 10 seconds before the error
- User-agent, browser, URL, route, previous breadcrumbs

---

## 2. Resend email deliverability (SPF + DKIM) — ~10 min

**Why**: your feedback emails to `karimsidhom@outlook.com` and your program
invite emails from `noreply@hippomedicine.com` will land in recipients' spam
folders until you authenticate the domain at Resend. Easy to fix, but
invisible until you do.

### Steps

1. **Resend dashboard**: https://resend.com/domains
2. Click **Add Domain** → enter `hippomedicine.com` → Add
3. Resend shows you **3 DNS records** to add:
   - MX (for bounce routing)
   - TXT (SPF)
   - CNAME × 2 (DKIM)
4. Go to wherever your `hippomedicine.com` DNS is managed (Cloudflare / Namecheap / Vercel / wherever you bought the domain). Add all 3 records exactly as shown. TTL = Auto or 3600.
5. Back in Resend → click **Verify DNS Records** button. Should go green within 5 min (sometimes up to an hour for DNS propagation).
6. Send yourself a test: log in to Hippo, go to Settings → Feedback → type "test" → Send. It should arrive in your Outlook inbox, not spam.

### If Vercel manages your DNS
Vercel domains have a "DNS Records" panel. Paste the 3 records there. No separate provider needed.

---

## 3. Supabase backups verification — ~5 min

**Why**: free tier Supabase gives 7 days of point-in-time recovery. Pro tier
gives 14 days + daily backups. You want to confirm which you have and that
PITR is on, because the day you need it isn't the day you want to discover
it was off.

### Steps

1. **Supabase dashboard**: https://supabase.com/dashboard/project/nitdinoerkzgoozpucgm
   (that's your prod project — the ID came from the env audit I did earlier)
2. Left sidebar → **Database** → **Backups**
3. You'll see one of three states:
   - **"Daily backups enabled"** + a PITR slider → good, note the PITR window (days)
   - **"Upgrade to Pro for backups"** → **you have no backups**. A DB-corruption event would be unrecoverable.
   - **"Restore" button visible** → already on paid tier, good
4. If on free tier and planning any real launch: upgrade to **Supabase Pro** ($25/mo). Gets you daily backups + 14-day PITR + more compute.
5. While you're there, go to **Database → Connection Pooling** and verify the **Session mode** pooler is on (it is, based on your `DATABASE_URL` containing `pgbouncer=true`).

### How to test a recovery
In the Backups panel, click **Restore to new project** on any backup point. This
spins up a sandbox copy of your DB at that point in time. You can connect to it,
browse data, verify it looks right. Delete the sandbox project when done. Don't
actually restore to prod — that overwrites current data.

---

## 4. (Later) Vertex AI migration — ~2–3 hours

**Why**: you currently use the free Google AI Studio tier for Gemini. Its
terms of service allow them to retain inputs for training. Your `scrubNotes()`
regex redacts obvious PHI before the prompt leaves Hippo, but that's
defense-in-depth, not a contractual no-train guarantee.

For a friends beta this is fine and documented in `/legal/phia §4`. For a
broad public launch (e.g., announcing on Twitter), you want to be on
Vertex AI, which has a contractual no-train clause and a HIPAA BAA option.

**Do this only when**: you're ready to tell strangers about the app, or a
residency program asks about your AI provider stance.

**Cost**: ~$20–$50/mo for a 30-user beta at current usage.

### Steps (high-level — I'll do the actual code when you give the green light)

1. **Google Cloud** https://console.cloud.google.com → New project "hippo-prod"
2. **Enable Vertex AI API** in the project
3. Create a **service account** with `roles/aiplatform.user`, download the JSON key
4. Put the JSON key on Vercel as env var (multi-line, base64'd — I'll script it)
5. Swap Gemini endpoint in `src/lib/dictation/llm.ts` from
   `generativelanguage.googleapis.com` to the Vertex API
6. Update `/legal/phia §4` to reflect the new no-train contractual position
7. Bump `POLICY_VERSIONS.phia` so users re-accept

Estimated code change: ~2 hours.

---

## 5. Mobile TestFlight submission — ~4–6 hours + 1 week Apple wait

**Why**: the iOS app is code-complete locally but not in any user's hands.
TestFlight is the standard path to beta-test on real iPhones before App Store.

**Code status**: Dashboard, Cases list + detail, Log (manual + voice), EPA
Suggest — all working in Expo. Needs packaging + submission.

### Prerequisites (the long pole)

1. **Apple Developer Program** enrollment — $99/yr, under Hippo Medicine Inc.
   not your personal name. Requires:
   - D-U-N-S number for Hippo Medicine Inc. (free, 5 days to issue from dnb.com)
   - Hippo Medicine Inc. legal entity (need to confirm this is already incorporated)
   - Apple reviews the enrollment for ~3–5 business days
2. **App Store Connect** app record — 30 min once Apple Dev is active

### When Apple Dev is approved, the submit flow

```bash
cd /Users/karimsidhom/Desktop/ClaudeStuff/surgitrack/mobile
npm install
npm install -g eas-cli
eas login
eas init                              # links the local repo to an EAS project
eas build:configure                   # creates eas.json profiles (already done)
eas build --platform ios --profile production
# ~20 min wait — Apple provisioning + IPA build
eas submit --platform ios --latest
# Upload to App Store Connect
```

Then in App Store Connect web UI:
- Add TestFlight testers (internal — you + friends with Apple IDs)
- Fill in required metadata: app description, screenshots, privacy labels
- Wait ~1 day for Apple's internal TestFlight review
- Testers get an email with a TestFlight install link

### Before submitting, two things must match in `mobile/app.json`

- `ios.bundleIdentifier` — must match what you registered in App Store Connect
  (currently `com.hippomedicine.hippo` — register this one)
- Privacy manifest: the app's `NSSpeechRecognitionUsageDescription`,
  `NSCameraUsageDescription`, etc. are already set (I wrote them in a previous
  session)

### What I can help with when you're ready
- Run `eas build` and watch the logs for errors
- Draft the App Store description + privacy labels
- Verify the app boots correctly in TestFlight

But none of it can happen before your Apple Developer Program is approved.

---

## Minimum set to call this "ready for a public launch"

1. Sentry activated (task 1) — **1 hour of your time**
2. Resend verified (task 2) — **30 min**
3. Supabase backups on paid tier (task 3) — **5 min + $25/mo**
4. Either Vertex AI (task 4) OR a clear "PHI-free by user attestation"
   disclosure in the signup flow — **either 3 hours or 30 min depending on path**

Tasks 1–3 in a single evening gets you launch-ready for everything short of a
Product Hunt top-10 post.

Task 5 (Mobile) is its own arc — parallel track with the web work.
