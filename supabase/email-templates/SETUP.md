# Hippo email setup — Reset Password from `noreply@hippomedicine.com`

This doc covers two separate things:

1. **Email content** — the Hippo-branded HTML for the reset email (one-time paste).
2. **Sender identity** — getting the email to come *from* `noreply@hippomedicine.com`
   instead of Supabase's default `noreply@mail.app.supabase.io`. This requires
   Custom SMTP and DNS records.

> **Live project:** HippoVFinal (`nitdinoerkzgoozpucgm`, ca-central-1)
> **Dashboard:** https://supabase.com/dashboard/project/nitdinoerkzgoozpucgm

---

## Part 1 — Reset Password email template (5 minutes, dashboard only)

The "Reset Password" template is **enabled by default** in every Supabase
project — there is no toggle. What you control is the subject + HTML body.

### Steps

1. Open the dashboard:
   https://supabase.com/dashboard/project/nitdinoerkzgoozpucgm/auth/templates
2. Click **Reset Password** in the template list.
3. **Sender name**: `Hippo`
4. **Subject heading**: `Reset your Hippo password`
5. **Message body**: open `supabase/email-templates/reset-password.html`
   from this repo, copy the entire file, paste into the dashboard textarea,
   and click **Save**.
6. (Optional) Click the **Preview** tab to confirm rendering — the variables
   `{{ .ConfirmationURL }}` and `{{ .Email }}` populate with sample values.

### Confirm Site URL & redirect URLs are set

Same dashboard project → **Authentication → URL Configuration**:

- **Site URL**: `https://hippomedicine.com`
- **Redirect URLs** (one per line):
  - `https://hippomedicine.com/reset-password`
  - `https://hippomedicine.com/dashboard`
  - `http://localhost:3000/reset-password`  (for local dev)
  - `http://localhost:3000/dashboard`        (for local dev)

The reset email link won't work without `https://hippomedicine.com/reset-password`
explicitly in the allowlist.

---

## Part 2 — Custom SMTP so emails come from `noreply@hippomedicine.com`

Without this step, your reset emails are sent from
`noreply@mail.app.supabase.io` — they'll *work* but they look like generic
Supabase emails, and Supabase rate-limits the default sender to 4 emails/hour
which is fine for testing but eventually breaks under real traffic.

You need three things:

1. An external SMTP provider account (recommended: **Resend**).
2. DNS records added to `hippomedicine.com`.
3. SMTP credentials pasted into the Supabase dashboard.

### A. Why Resend (vs SendGrid / Postmark / SES / Mailgun)

| Provider  | Free tier         | Setup speed | Notes                                    |
|-----------|-------------------|-------------|------------------------------------------|
| **Resend**| 3,000/mo, 100/day | 5 min       | Built for developers, modern UI, simple. |
| Postmark  | 100/mo            | 10 min      | Best deliverability but tiny free tier.  |
| SendGrid  | 100/day           | 20 min      | Sales-y signup, slower onboarding.       |
| AWS SES   | 200/day in sandbox| 60 min      | Cheapest at scale, requires sandbox req. |
| Mailgun   | 100/day for 30d   | 10 min      | Trial only, then paid.                   |

For Hippo's volume (residents resetting passwords), Resend's free tier is
plenty. Switch later if you outgrow it.

### B. Resend setup (5 min)

1. Sign up at https://resend.com (use your `karimsidhom@outlook.com` or your
   Hippo work email).
2. **Domains** → **Add Domain** → enter `hippomedicine.com` → **Add**.
3. Resend shows you 3 DNS records to add. Copy them. They look like:

   | Type | Name                              | Value                                                         |
   |------|-----------------------------------|---------------------------------------------------------------|
   | MX   | `send.hippomedicine.com`          | `feedback-smtp.us-east-1.amazonses.com` (priority 10)         |
   | TXT  | `send.hippomedicine.com`          | `v=spf1 include:amazonses.com ~all`                           |
   | TXT  | `resend._domainkey.hippomedicine.com` | `p=<long DKIM public key>`                                |

   Exact values vary per account — copy them directly from the Resend UI.

4. Add those records to whatever DNS host runs `hippomedicine.com`
   (Cloudflare, Namecheap, GoDaddy, etc.). Most propagate in 5–30 minutes.
5. Back in Resend, click **Verify DNS records**. Wait until all 3 show green.
6. **API Keys** → **Create API Key** → name it `supabase-smtp` → permission
   "Sending access" → copy the key (you'll only see it once). Format:
   `re_xxxxxxxxxxxx`.

### C. Wire Resend into Supabase (2 min)

Dashboard → https://supabase.com/dashboard/project/nitdinoerkzgoozpucgm/settings/auth
→ scroll to **SMTP Settings** → **Enable Custom SMTP** → fill in:

| Field             | Value                              |
|-------------------|------------------------------------|
| Sender email      | `noreply@hippomedicine.com`        |
| Sender name       | `Hippo`                            |
| Host              | `smtp.resend.com`                  |
| Port              | `465`                              |
| Username          | `resend`                           |
| Password          | (the `re_…` API key from step B6)  |
| Minimum interval  | `60` (seconds between emails)      |

Click **Save**. Send a test reset email to your own address —
within 30 seconds you should have a Hippo-branded email from
`noreply@hippomedicine.com` in your inbox.

### D. Optional: DMARC

For best deliverability (less likely to land in spam), add a DMARC record:

| Type | Name                       | Value                                                        |
|------|----------------------------|--------------------------------------------------------------|
| TXT  | `_dmarc.hippomedicine.com` | `v=DMARC1; p=none; rua=mailto:postmaster@hippomedicine.com`  |

Start with `p=none` (monitor only). After a week of clean reports, escalate
to `p=quarantine` then `p=reject`.

---

## What this repo provides

```
supabase/email-templates/
  reset-password.html   ← paste into dashboard
  SETUP.md              ← this file
```

Future templates (magic-link, signup confirmation, change-email) will live in
the same folder. Each is paired with a paste-target in the Supabase dashboard.

## Troubleshooting

- **Email not arriving** — check spam, then check Resend → Logs to see if it
  was sent at all. If Resend says "delivered" but you don't see it, your
  inbox provider may have throttled the new sender domain — wait 24 h.
- **"Invalid redirect URL" when clicking reset link** — the URL the link
  points to is not in **Redirect URLs** in URL Configuration. Add
  `https://hippomedicine.com/reset-password`.
- **DKIM fails on Resend** — paste only the public-key portion the UI shows;
  some DNS providers strip the `p=` prefix automatically and others don't.
- **"From" still shows mail.app.supabase.io** — Custom SMTP isn't enabled
  yet, or the toggle is off. Save the form once with the toggle ON.
