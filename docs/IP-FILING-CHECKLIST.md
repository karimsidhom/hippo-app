# Hippo — IP & Legal Filing Checklist

> **Drafted by the engineering team, NOT by a lawyer.** Everything below
> is a plain-language summary of what I believe needs to happen to
> protect the brand and code for the Canadian launch. Nothing here is
> legal advice. Before filing anything that costs money or creates a
> public record, hire a Canadian IP lawyer — Gowling WLG, Smart & Biggar,
> Bereskin & Parr, and Osler Hoskin & Harcourt all have Winnipeg or
> Manitoba-facing IP practices. Expect CAD $2–5k for the incorporation
> + initial trademark application. This is the single cheapest insurance
> you can buy for a consumer-facing brand.

---

## Priority 0 — Before you talk to investors, the App Store, or a journalist

These four things should be done first because they set the ownership
structure that everything else hangs off.

### 0.1 Incorporate **Hippo Medicine Inc.** (federal, Canada)

- [ ] File Articles of Incorporation federally via Corporations Canada,
      not provincially. Federal gives you the "Inc." anywhere in Canada
      and harmonizes the name with the "Hippo Medicine Inc." already
      written into the Terms of Use and EULA at `/legal/*`.
- [ ] NUANS name search first (~$75). "Hippo Medicine" is likely
      available but the clearance search is required.
- [ ] Minute book, share structure (you probably want Class A voting +
      Class B non-voting so future investors can take preferred without
      rewiring the cap table).
- [ ] Provincial extra-provincial registration in Manitoba once federal
      is granted (~$60). Required to do business in MB.
- [ ] Get a **D-U-N-S number** from Dun & Bradstreet (free, takes
      ~5 business days). Apple Developer Program enrollment as a company
      requires D-U-N-S — without it you'd have to enroll as an
      individual, and an individual account means the App Store listing
      is owned by Karim personally, not Hippo Medicine Inc. That is
      **very hard to unwind** later.

### 0.2 Assign all pre-existing IP to the corporation

This is the one most first-time founders skip and later regret.

- [ ] Signed **IP Assignment Agreement** from Karim Sidhom → Hippo
      Medicine Inc. covering everything built before incorporation:
      the Next.js codebase, the brand, the domain (hippomedicine.com),
      the Figma/design files, the demo videos, the database schema,
      the EPA/milestone mappings, the prompts, the voice-log rules.
      Without this, *you personally* own the IP — not the company —
      and any investor will refuse to close.
- [ ] Also assign from every contractor who has ever touched the code.
      Check git log; if there's anyone other than Karim, they need a
      signed assignment. Retrospective assignment works but get it now.
- [ ] Transfer the **domain registration** (hippomedicine.com) from
      Karim's personal registrar account to a corporate account once
      the company exists. Use Cloudflare Registrar at cost.
- [ ] Transfer the **GitHub repo** to a `hippomedicine` org, not a
      personal account.
- [ ] Transfer **Vercel, Supabase, Stripe, Resend, Anthropic,
      Google AI, OpenAI, EAS/Expo, Apple Developer, Google Play**
      accounts to the corporate email (e.g. `founders@hippomedicine.com`).

### 0.3 Founder paperwork

- [ ] **Shareholder agreement** — even as sole founder, you want this
      before your first hire or investor. Pre-packages: vesting,
      drag-along, tag-along, right of first refusal.
- [ ] **Founder stock purchase** — issue yourself founder shares at a
      nominal value (e.g. 10,000,000 shares at $0.0001 = $1,000 total)
      with a 4-year vest and 1-year cliff. This is a tax-timing move:
      buying cheap stock NOW, before any valuation, avoids a massive
      income-inclusion event later when the shares are worth more.
- [ ] **83(b) equivalent in Canada** — Canadian tax doesn't require an
      83(b) election, but the vesting/repurchase structure still matters.
      A CDN tax lawyer or accountant can walk you through it.

### 0.4 Directors & Officers insurance (cheap, do it early)

- [ ] A D&O policy for a seed-stage company is typically $1.5–3k/yr
      CAD. Covers you personally against claims related to running the
      company. Medical apps attract marginally higher premiums. Not
      needed before revenue or investor, but do it before board formation.

---

## Priority 1 — Trademark the brand

### 1.1 Canadian Intellectual Property Office (CIPO) — "HIPPO" word mark

- [ ] File a CIPO application for **"HIPPO"** as a word mark.
- [ ] Classes (Nice Classification — file in multiple):
      - **Class 9** — downloadable software, mobile apps.
      - **Class 42** — SaaS, software-as-a-service platforms, hosted
        medical software, computer services for analyzing medical data.
      - **Class 41** — educational services, specifically
        post-graduate medical training, competency tracking for
        residents. (This one is specific to Hippo's market.)
- [ ] Filing fees: ~$458 CAD per class for the first class, ~$139 per
      additional class. Budget ~$900 for three classes.
- [ ] Examination + publication takes 18–24 months. Registration grants
      "®" rights; until then use "™" (already in the CopyrightFooter).
- [ ] **File a pre-application search first** — "Hippo" is a common
      English word and there are likely existing marks (hippo the pet
      store, Hippo Insurance, etc.). Your lawyer will advise if the
      medical-education specificity is enough to differentiate.

### 1.2 US Patent and Trademark Office (USPTO)

- [ ] File **concurrently or immediately after** the Canadian
      application. US market access matters for investors and for App
      Store visibility (most Anglophone residents live in the US).
- [ ] Same classes (9, 42, 41). USPTO fees: ~$250 USD per class under
      the TEAS Plus form. Budget ~$900 USD for three classes plus
      attorney fees.
- [ ] The USPTO has stricter specimen-of-use requirements — you must
      show the mark used in commerce on US-based residents before
      registration completes. Use an "intent-to-use" filing if you're
      pre-launch in the US.

### 1.3 Madrid Protocol (later)

- [ ] Once the CA + US marks are on file, you can extend via Madrid
      to the UK, EU, and Australia in one application (~$1,500 USD
      base fee plus per-country fees). Only relevant when you're
      actually entering those markets.

### 1.4 Logo mark (the "HippoMark" SVG)

- [ ] Separate trademark application for the **design mark** (the
      scalpel-hippo logomark, not the word). Stronger protection
      because a word mark alone doesn't cover visual imitators.
- [ ] Same classes, same fees. Your lawyer may suggest a combined
      "word + design" mark as a single filing instead.

---

## Priority 2 — Copyright registration

Copyright exists automatically on creation (Berne Convention) — but
registration makes infringement cases dramatically easier and unlocks
statutory damages in the US.

### 2.1 Canadian Intellectual Property Office

- [ ] File a **copyright registration** for the Hippo software work.
      ~$65 CAD. Single filing covers the whole codebase.
- [ ] File a separate copyright registration for the Hippo design
      system / visual assets (logomark, color palette, typography
      choices are not copyrightable but the logomark itself is).
- [ ] File copyright for any long-form original content: the EPA
      scoring engine, milestone explanations, onboarding copy.

### 2.2 US Copyright Office

- [ ] File registration via the **eCO system** (~$65 USD). US
      registration unlocks **statutory damages** (up to $150k per
      infringement) and attorney's-fee recovery — which together are
      the reason anyone actually sues over software copyright.
- [ ] Deposit the source code (redacted — the Copyright Office accepts
      a first-25-and-last-25-pages deposit for trade-secret protection).

---

## Priority 3 — Operational protection

### 3.1 Contracts for anyone who touches the code or data

- [ ] **NDA** for any advisor, contractor, or candidate before they
      see the codebase or the product roadmap. Mutual NDA is fine.
- [ ] **Contractor Agreement + IP Assignment** for every contractor.
      Template from Cooley GO or Clerky is a decent starting point
      but have a lawyer review before use.
- [ ] **Employee Agreement + IP Assignment + Non-Solicit** for every
      employee. Non-competes are mostly unenforceable in Canada, so
      don't lean on them; non-solicit of employees and customers does
      hold up.
- [ ] **Data Processing Agreements (DPA)** with every AI vendor:
      Anthropic, Google (Gemini), OpenAI, Resend, Supabase, Stripe,
      Vercel. Several of these have standard DPAs you just sign —
      Anthropic's is at anthropic.com/legal/dpa, Google Cloud's is
      in the Google Cloud Terms. Supabase, Stripe, Vercel, Resend all
      publish theirs. **Sign them all.** Without signed DPAs, the
      PHIA statements in `/legal/phia` are technically unenforceable.

### 3.2 Clean the dependency tree

- [ ] Audit the GPL-risk deps flagged in the earlier audit:
      - `jszip` is actually dual-licensed MIT or GPL-3.0-or-later; we
        can elect MIT. Add a `DEPENDENCIES.md` or SPDX header asserting
        the MIT election.
      - `@img/sharp-libvips-darwin-arm64` is LGPL-3.0 — but it's an
        **optional platform-specific binary**, and LGPL allows
        linking from a proprietary app as long as users can replace
        the LGPL component. We comply by using it as an unmodified
        dynamic library. Document this in a NOTICE file.
- [ ] Generate and commit an **SBOM** (software bill of materials)
      using `cyclonedx-node-npm` or similar. Required for enterprise
      customers and increasingly for government procurement.
- [ ] Add `npm audit` and `osv-scanner` to CI.

### 3.3 Business insurance

- [ ] **Cyber / technology E&O policy**. Critical for a medical app.
      Budget $3–5k CAD/yr at seed scale. Covers breach response,
      ransomware, and errors-and-omissions claims (e.g. a resident
      claims bad data caused a missed milestone).
- [ ] **Commercial general liability** (bundled with E&O usually).
- [ ] **Directors & officers** — see 0.4.

### 3.4 Privacy regulators & health-data specifics

- [ ] Manitoba **PHIA** — the `/legal/phia` page correctly declares
      Hippo is **not** a trustee. That's the right posture (Hippo never
      ingests identified PHI). Document the de-identification
      architecture in `docs/PHIA-ARCHITECTURE.md` so a regulator who
      asks can see the design decisions.
- [ ] Register as a business collecting personal information under
      **PIPEDA** (federal private-sector privacy act). Registration
      isn't required but designate a **Privacy Officer** in writing —
      the person's name + contact must appear in the Privacy Policy.
      Today the Privacy Policy references "the Privacy Officer" without
      naming one. Add: "Privacy Officer: Karim Sidhom, privacy@hippomedicine.com."
- [ ] US HIPAA: Hippo doesn't handle US PHI today. If you ever sign a
      US hospital or US program, you become a **Business Associate**
      and will need a Business Associate Agreement (BAA) plus HIPAA-
      compliant sub-processors. Anthropic and Google Cloud offer BAAs
      on specific tiers — plan for this when US expansion is on the
      roadmap. Today, the "Hippo is not for US PHI" warning should
      appear in the App Store description.

### 3.5 App Store / Play Store compliance

- [ ] **Apple App Privacy labels** — match the Privacy Policy exactly.
      Mismatch is a top-3 rejection reason for medical apps.
- [ ] **Google Play Data Safety form** — same.
- [ ] **Account deletion** — both stores now require in-app deletion,
      not "email us to delete." Implement at Profile → Delete account.
      Delete must be irreversible after a 30-day grace window.
- [ ] **Paid app / subscription disclosures** — the Terms mention
      Stripe billing; the App Store also requires the subscription
      length, price, renewal terms, and a link to the Privacy Policy
      to be visible **before purchase** inside the app.
- [ ] **External purchase links** — Apple's current rules permit
      linking to Stripe-hosted checkout from inside the iOS app in
      Canada. Use `expo-web-browser` to open the checkout, do NOT
      use an embedded WebView, and disclose that the purchase is
      outside the App Store.
- [ ] **Age rating** — 17+ on iOS, Mature on Android. Medical content
      justifies this; going lower would invite questions.

---

## Priority 4 — Things to NOT do (common mistakes)

- [ ] **Don't** sign a single investor term sheet without reading
      clauses 4, 5, and 10 of anything claiming to be "standard".
      Get a lawyer. Standard terms are sometimes standard and
      sometimes not; "super pro rata" and "broad anti-dilution" are
      the two that most often bite founders.
- [ ] **Don't** promise in marketing copy that Hippo is "HIPAA
      compliant" or "RCPSC-endorsed" unless both are literally true
      with a paper trail. Use "designed for PHIA compliance" and
      "RCPSC-aligned (not affiliated)" instead.
- [ ] **Don't** let "Program Director demo" slip into using real
      patient data. The `/legal/phia` page commits to zero PHI; a
      demo with one real MRN invalidates the entire posture.
- [ ] **Don't** register the trademark as an individual. Wait for
      the corporation and register in the corporation's name. Otherwise
      you'll pay again to transfer it.
- [ ] **Don't** open-source any part of the repo before the
      trademark is filed. A premature public release can be cited
      against a mark's distinctiveness.

---

## Rough budget summary (Year 1)

| Item | Cost (CAD) |
|---|---|
| Federal incorporation + MB registration + NUANS | ~$400 |
| IP lawyer (incorporation docs, IP assignment, shareholder agreement) | ~$2,500 |
| CA trademark (3 classes, word + design) | ~$1,800 in fees + ~$2,000 legal |
| US trademark (3 classes) | ~$1,200 USD fees + ~$2,500 USD legal |
| Copyright registrations (CA + US) | ~$200 |
| Apple Developer Program | ~$135/yr |
| Google Play Console | ~$35 one-time |
| D-U-N-S registration | Free |
| Cyber/E&O insurance (seed scale) | ~$3,500/yr |
| Directors & Officers insurance | ~$2,000/yr |
| **Total Year 1** | **~$15,000–20,000 CAD** |

This is the floor for a company that's about to pitch program directors
and eventually enter a regulated market. Skipping any item in Priority 0
or Priority 1 is a false economy — fixing a missing IP assignment
mid-diligence costs more than the filing itself.

---

## What to ask a prospective lawyer on the first call

1. Have you worked on a Canadian digital-health startup before? (Not
   just a generic SaaS.)
2. Do you do both Canadian and US trademark filings in-house, or do
   you refer out? (In-house is cheaper.)
3. What's your flat fee for incorporation + founder docs + first
   trademark application? (Should be a flat number, not hourly, at
   this stage.)
4. Do you have a DPA template that works with Anthropic + Google AI?
5. How do you typically handle PHIA for a non-trustee processor?
6. What's the typical timeline from engagement to filed CA trademark?
7. Do you have an in-house paralegal who manages the CIPO/USPTO
   back-and-forth? (Yes is cheaper than partner-managed.)

---

*Last revised 2026-04-15 by the engineering team. This document is
maintained in the repository so changes are version-controlled; when
you engage a lawyer, share the repo-local version as the source of
truth rather than emailing a one-off export.*
