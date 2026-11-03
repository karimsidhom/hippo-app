# Hippo — Surgical Case Log

> The operating system for surgical growth. Log cases, track performance, benchmark against peers, and build a fellowship-worthy portfolio.

---

## Overview

Hippo is a PHIA-safe surgical case logging and performance analytics platform for residents, fellows, and attending surgeons. It is built to the precision of a surgical logbook, with the pace of something you actually open after a list.

**Core features:**
- Fast case logging (Quick-add in ~10 seconds, full entry with all fields)
- Operative time tracking and learning curve analytics
- Personal records and milestone achievements
- Opt-in social benchmarking with peers
- Privacy-safe Excel export (PHIA/HIPAA compliant)
- Leaderboards (complexity-adjusted, opt-in only)
- 10+ surgical specialties supported

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Custom (shadcn/ui inspired) |
| Database ORM | Prisma (PostgreSQL) |
| Validation | Zod |
| Excel Export | ExcelJS |
| Icons | Lucide React |
| Auth | next-auth (structure in place) |

---

## Project Structure

```
surgitrack/
├── prisma/
│   ├── schema.prisma          # Full data model
│   └── seed.ts                # Dev seed data
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated app shell
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── log/           # Multi-step case logging
│   │   │   ├── cases/         # Case history + filters
│   │   │   ├── analytics/     # Charts & learning curves
│   │   │   ├── benchmarks/    # Procedure benchmarks
│   │   │   ├── leaderboard/   # Opt-in rankings
│   │   │   ├── social/        # Friends & feed
│   │   │   ├── profile/       # Surgeon profile
│   │   │   └── settings/      # Privacy & account settings
│   │   ├── onboarding/        # First-run flow
│   │   ├── api/
│   │   │   └── export/        # Excel export endpoint
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Core UI primitives
│   │   ├── charts/            # SVG chart components
│   │   ├── layout/            # Sidebar, TopBar, MobileNav
│   │   ├── cases/             # Case cards, table, filters
│   │   ├── dashboard/         # Stat cards, milestones, streaks
│   │   ├── social/            # Friend cards, feed, compare
│   │   └── shared/            # ProGate, CelebrationModal, etc.
│   ├── data/
│   │   └── mockData.ts        # 42 seed cases + all mock data
│   ├── hooks/
│   │   ├── useCases.ts        # Case state + CRUD
│   │   ├── useStats.ts        # Computed analytics
│   │   ├── useUser.ts         # User/profile state
│   │   └── useMilestones.ts   # PR + milestone tracking
│   └── lib/
│       ├── constants.ts       # Enums, specialty/procedure lists
│       ├── types.ts           # TypeScript interfaces
│       ├── phia.ts            # Privacy validation + scrubbing
│       ├── milestones.ts      # Achievement logic
│       ├── stats.ts           # Analytics calculations
│       └── excel.ts           # Export helpers
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (for full DB mode)
- pnpm or npm

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hippo"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** The app runs in frontend-only MVP mode using `src/data/mockData.ts` — no database required for development. All data is in-memory with 42 pre-seeded surgical cases.

### 5. Install Optional Dependencies

For Excel export:
```bash
npm install exceljs
```

---

## Key Features

### Case Logging
- **Quick-add mode:** Log specialty + procedure + role + duration in under 15 seconds
- **Full entry:** 20+ structured fields including approach, difficulty, autonomy, outcome, and more
- **PHIA validation:** Real-time note scanning for prohibited identifiers

### Analytics
- Learning curve charts (OR time vs. case number)
- Monthly volume heatmap (GitHub-style)
- Role progression over time
- Approach distribution
- Autonomy trend tracking

### Benchmarks
- Compare your operative times against anonymized peer data
- PGY-stratified medians
- Approach-specific benchmarks
- Percentile visualization (Pro feature)

### Milestones & PRs
- Automatic milestone detection after case submission
- Personal record tracking per procedure
- Logging streak counter
- Celebration modal with confetti on achievement

### Social (Pro)
- Friend system with privacy-safe activity feed
- Head-to-head metric comparison
- Only aggregates shared — never case-level details

### Excel Export
- Full case log (PHIA-safe, no patient identifiers)
- Annual summary sheet
- Milestones & PRs sheet
- Aggregate benchmark sheet
- All exports automatically scrubbed

---

## Privacy & PHIA Compliance

Hippo is architected privacy-first:

- **Never collected:** MRNs, patient names, DOB, health card numbers, exact OR timestamps
- **Note scrubbing:** Regex-based detection of PHIN-like patterns, health card formats, names
- **Export safety:** `exportSafeTransform()` applied to every export
- **Social sharing:** Only anonymized surgeon aggregates — never case specifics
- **Leaderboard safety:** Minimum case thresholds, rare procedure suppression, complexity-adjusted
- **Opt-in only:** Benchmark contribution and public profiles require explicit opt-in

See `src/lib/phia.ts` for all validation logic.

---

## Monetization

| Tier | Price | Features |
|---|---|---|
| Free | $0 | 5 cases/week, 1 specialty, basic analytics, ads |
| Pro | $29/mo | Unlimited cases, all specialties, social, benchmarks, export, no ads |
| Institution | $199/mo | Everything in Pro + multi-resident dashboards, ACGME/RCPSC exports, cohort analytics |

---

## Specialties Supported

Urology · General Surgery · Cardiac Surgery · Vascular Surgery · ENT · Neurosurgery · Orthopedics · Plastic Surgery · Thoracic Surgery · OB/GYN · Pediatric Surgery · Ophthalmology · Other

---

## Roadmap

- [ ] Real authentication (next-auth with credentials + OAuth)
- [ ] PostgreSQL integration (Prisma queries replacing mock data)
- [ ] AI learning curve insights (Claude API)
- [ ] Mobile app (React Native / Expo)
- [ ] ACGME/RCPSC milestone mapping
- [ ] Simulation vs. OR performance tracking
- [ ] Fellowship portfolio PDF export
- [ ] Mentor-trainee group comparisons
- [ ] Program director dashboard (Institution tier)

---

## Development Notes

**Frontend-only mode** is the default. `mockData.ts` contains 42 realistic cases across 12 months for Dr. Alex Chen (PGY-3, Urology). All hooks operate on in-memory state — changes persist only for the browser session.

To connect a real database, replace the mock imports in each page with Prisma queries via Server Actions.

---

## License

MIT — built for the surgical education community.

---

*Hippo — Track the cases. Build the surgeon.*
# hippo-app
