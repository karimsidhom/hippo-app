# Hippo email setup — Reset Password from `noreply@hippomedicine.com`

This doc covers two separate things:

1. **Email content** — already done via Supabase Management API.
   The Hippo-branded reset-password HTML lives in
   [`reset-password.html`](./reset-password.html) and is wired live in
   the **HippoVFinal** project (`nitdinoerkzgoozpucgm`).
2. **Sender identity** — making the email come *from*
   `noreply@hippomedicine.com` (not the default
   `noreply@mail.app.supabase.io`). Requires Brevo + DNS records.

> **Live project:** HippoVFinal (`nitdinoerkzgoozpucgm`, ca-central-1)
> **Dashboard:** https://supabase.com/dashboard/project/nitdinoerkzgoozpucgm

---

## Status

| Step | State |
|---|---|
| Branded HTML written | ✅ committed (`reset-password.html`) |
| HTML + subject + Site URL + redirect allowlist applied to Supabase | ✅ live (PATCH /v1/projects/.../config/auth) |
| Sender = `noreply@hippomedicine.com` | ⏳ needs Brevo + DNS (below) |
| Sender display name = `Hippo` | ⏳ same — Supabase rejects this without Custom SMTP |

---

## Brevo setup — 3 phases

### Phase 1: Brevo account + domain (5 min, in Brevo)

1. Sign up at https://www.brevo.com — free tier is **300 emails/day forever**, no
   payment card required at signup.
2. Skip the marketing-automation setup wizard. Go directly to
   **Senders, Domains & Dedicated IPs** → **Domains** tab → **Add a domain**.
3. Enter `hippomedicine.com`. Brevo gives you 2 DNS records to add:

   | Type | Host                               | Value                                      |
   |------|------------------------------------|--------------------------------------------|
   | TXT  | `@` (or `hippomedicine.com`)       | `v=spf1 include:spf.brevo.com mx ~all`     |
   | TXT  | `mail._domainkey.hippomedicine.com`| `k=rsa; p=<long DKIM public key>`          |

   The exact DKIM `p=` value is per-account — copy it directly from Brevo's UI,
   don't try to fabricate it.

### Phase 2: DNS records (5–30 min wait)

Add the 2 records above wherever DNS for `hippomedicine.com` is hosted
(Cloudflare, Namecheap, GoDaddy, Vercel DNS, etc.).

- **SPF**: paste exactly as Brevo shows it. If you already have an SPF record
  on `@`, you must merge — only **one** SPF record per domain is valid. Add
  `include:spf.brevo.com` to the existing one rather than creating a second.
- **DKIM**: this is a long key, paste the entire `p=...` value verbatim. Some
  DNS providers automatically wrap long TXT values; that's fine.

Back in Brevo, click **Authenticate this domain**. Wait until both records
show ✅ green (5–30 min typical, up to 48h worst case).

### Phase 3: SMTP key + Supabase wire-up

1. In Brevo: **Senders, Domains & Dedicated IPs** → **SMTP & API** tab →
   **Generate a new SMTP key**. Name it `supabase-hippo`. Copy the key —
   shown only once. Format: `xsmtpsib-xxxxxxxxxxxxxxxx`.

2. In Brevo: **Senders & IP** → **Senders** tab → **Add a sender** → enter
   `Hippo` for the name and `noreply@hippomedicine.com` for the email →
   confirm. (Brevo will send a verification link to that address — set up a
   forwarder so you can click the verification, e.g. forward
   `noreply@hippomedicine.com` to your real inbox, or use a catch-all.)

3. Once domain is authenticated AND sender is verified, paste the SMTP key
   into the Supabase Management API call (Hippo will run this for you when
   you provide the key — see below).

### Supabase fields (filled in by the API call once you give the key)

| Field             | Value                              |
|-------------------|------------------------------------|
| SMTP_HOST         | `smtp-relay.brevo.com`             |
| SMTP_PORT         | `587`                              |
| SMTP_USER         | the email you signed up with       |
| SMTP_PASS         | the `xsmtpsib-…` key from step 1   |
| SMTP_ADMIN_EMAIL  | `noreply@hippomedicine.com`        |
| SMTP_SENDER_NAME  | `Hippo`                            |

Once these are saved, Supabase routes all auth emails (reset password,
magic link, signup confirmation, email change) through Brevo, signed
with your DKIM, from your domain.

---

## Files in this folder

```
supabase/email-templates/
  reset-password.html   ← live in Supabase (subject + body)
  SETUP.md              ← this file
```

Future templates (magic-link, signup confirmation, change-email,
identity-linked notification, etc.) get added the same way: write HTML,
PATCH it via the Management API, commit alongside the rest.

## Rotating the Supabase Management API token

The token used to apply the template was pasted in chat once and should be
rotated:
https://supabase.com/dashboard/account/tokens — revoke `sbp_0654…7596`,
generate a fresh one when you next need it.

## Troubleshooting

- **Email not arriving** — check spam first. Then Brevo dashboard → Logs.
  If Brevo shows "delivered" but you don't see it, Gmail may be soft-filtering
  the new sender domain — wait 24–48h, send a few more, reputation builds.
- **"From" still shows mail.app.supabase.io** — Custom SMTP fields not saved
  yet, or one of the 6 SMTP_* fields is missing. All six must be set together;
  Supabase rejects partial configurations.
- **DKIM fails verification** — most common cause: DNS provider truncated the
  long TXT value. Some require splitting into multiple chunks separated by
  quotes. Brevo's UI will tell you precisely which record failed.
- **Reset email link 404s** — `https://hippomedicine.com/reset-password` is
  not in the redirect allowlist. (Already fixed live, but if a future template
  uses a different URL, add it to URL Configuration → Redirect URLs.)
