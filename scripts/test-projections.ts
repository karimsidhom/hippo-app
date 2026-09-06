/* Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-projections.ts */
import assert from 'node:assert/strict';
import { projectTarget, projectAll, ratePerMonth, suggestTargetsFromLog } from '../src/lib/projections';
import type { CaseLog } from '../src/lib/types';

const today = new Date('2026-09-05T12:00:00Z');
const grad = new Date('2028-06-30T12:00:00Z'); // ~21.8 months out

function mk(daysAgo: number, over: Partial<CaseLog> = {}): CaseLog {
  return {
    id: `c${daysAgo}-${Math.random()}`,
    userId: 'u',
    specialtyId: 'urology',
    procedureDefinitionId: null,
    procedureName: 'Ureteroscopy with laser lithotripsy',
    procedureCategory: 'Endourology',
    surgicalApproach: 'ENDOSCOPIC' as never,
    role: 'PRIMARY',
    autonomyLevel: 'SUPERVISED' as never,
    difficultyScore: 3,
    operativeDurationMinutes: 60,
    consoleTimeMinutes: null,
    dockingTimeMinutes: null,
    attendingLabel: null,
    institutionSite: null,
    patientAgeBin: 'ADULT' as never,
    diagnosisCategory: null,
    outcomeCategory: 'UNEVENTFUL' as never,
    complicationCategory: 'NONE' as never,
    conversionOccurred: false,
    notes: null,
    tags: [],
    reflection: null,
    isPublic: false,
    benchmarkOptIn: true,
    caseDate: new Date(today.getTime() - daysAgo * 86400000),
    createdAt: today,
    updatedAt: today,
    ...over,
  };
}

// 1. rate: 30 cases in the last 180 days = ~5.07 per 30.44-day month
const spread = Array.from({ length: 30 }, (_, i) => mk(i * 6));
const r = ratePerMonth(spread.map((c) => c.caseDate), today, 180);
assert.ok(r > 4.9 && r < 5.3, `rate ${r}`);

// 2. a target that is on track
const t1 = projectTarget(spread, { id: 't', label: 'Endourology', matchType: 'CATEGORY', matchValue: 'endourology', target: 100, dueDate: null }, { today, graduationDate: grad });
assert.equal(t1.current, 30);
assert.equal(t1.remaining, 70);
assert.equal(t1.status, 'on_track', JSON.stringify(t1));
assert.ok((t1.projected ?? 0) >= 100);
assert.ok((t1.neededPerMonth ?? 99) < t1.ratePerMonth);

// 3. behind: same rate, target 300
const t2 = projectTarget(spread, { id: 't2', label: 'Endo', matchType: 'CATEGORY', matchValue: 'Endourology', target: 300, dueDate: null }, { today, graduationDate: grad });
assert.equal(t2.status, 'behind');

// 4. at risk: projected within 85 percent of target
const t3 = projectTarget(spread, { id: 't3', label: 'Endo', matchType: 'CATEGORY', matchValue: 'Endourology', target: 150, dueDate: null }, { today, graduationDate: grad });
assert.equal(t3.status, 'at_risk', JSON.stringify(t3));

// 5. done
const t4 = projectTarget(spread, { id: 't4', label: 'Endo', matchType: 'CATEGORY', matchValue: 'Endourology', target: 10, dueDate: null }, { today, graduationDate: grad });
assert.equal(t4.status, 'done');
assert.equal(t4.remaining, 0);

// 6. no due date
const t5 = projectTarget(spread, { id: 't5', label: 'Endo', matchType: 'CATEGORY', matchValue: 'Endourology', target: 100, dueDate: null }, { today });
assert.equal(t5.status, 'no_due_date');

// 7. per-target due date beats graduation; past due with remaining = behind
const t6 = projectTarget(spread, { id: 't6', label: 'Endo', matchType: 'CATEGORY', matchValue: 'Endourology', target: 100, dueDate: new Date('2026-01-01') }, { today, graduationDate: grad });
assert.equal(t6.status, 'behind');
assert.equal(t6.monthsLeft, 0);

// 8. procedure substring match, case-insensitive; independent match
const mixed = [
  ...spread,
  mk(3, { procedureName: 'Robotic Radical Prostatectomy', procedureCategory: 'Oncology', autonomyLevel: 'INDEPENDENT' as never }),
  mk(9, { procedureName: 'PCNL left', procedureCategory: 'Endourology', autonomyLevel: 'TEACHING' as never }),
];
const p = projectTarget(mixed, { id: 'p', label: 'RARP', matchType: 'PROCEDURE', matchValue: 'prostatectomy', target: 5, dueDate: null }, { today, graduationDate: grad });
assert.equal(p.current, 1);
const ind = projectTarget(mixed, { id: 'i', label: 'Independent', matchType: 'INDEPENDENT', matchValue: null, target: 5, dueDate: null }, { today, graduationDate: grad });
assert.equal(ind.current, 2);
const tot = projectTarget(mixed, { id: 'tot', label: 'Total', matchType: 'TOTAL', matchValue: null, target: 5, dueDate: null }, { today, graduationDate: grad });
assert.equal(tot.current, 32);

// 9. sorting: behind first, done last
const all = projectAll(spread, [
  { id: 'a', label: 'done', matchType: 'TOTAL', matchValue: null, target: 1, dueDate: null },
  { id: 'b', label: 'behind', matchType: 'TOTAL', matchValue: null, target: 999, dueDate: null },
  { id: 'c', label: 'ontrack', matchType: 'TOTAL', matchValue: null, target: 60, dueDate: null },
], { today, graduationDate: grad });
assert.deepEqual(all.map((x) => x.status), ['behind', 'on_track', 'done']);

// 10. suggestions
const s = suggestTargetsFromLog(mixed);
assert.equal(s[0].matchType, 'TOTAL');
assert.ok(s.some((x) => x.matchType === 'CATEGORY' && x.matchValue === 'Endourology'));

// 11. empty log never throws
const e = projectTarget([], { id: 'e', label: 'x', matchType: 'TOTAL', matchValue: null, target: 10, dueDate: null }, { today, graduationDate: grad });
assert.equal(e.status, 'behind');
assert.equal(e.ratePerMonth, 0);

console.log('projections: 11 checks passed');
