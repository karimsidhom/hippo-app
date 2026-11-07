/* Run: npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node","esModuleInterop":true}' scripts/test-autonomy-slope.ts */
import assert from 'node:assert/strict';
import { residentSlope, programSlope, AUTONOMY_ORDINAL } from '../src/lib/autonomy-slope';
import type { CaseLog, AutonomyLevel } from '../src/lib/types';

const start = new Date('2023-07-01T00:00:00Z');
function mk(monthsIn: number, level: AutonomyLevel): CaseLog {
  return {
    id: `c${monthsIn}-${level}-${Math.random()}`, userId: 'u', specialtyId: 'urology', procedureDefinitionId: null,
    procedureName: 'URS', procedureCategory: 'Endourology', surgicalApproach: 'ENDOSCOPIC', role: 'PRIMARY',
    autonomyLevel: level, difficultyScore: 3, operativeDurationMinutes: 60, consoleTimeMinutes: null, dockingTimeMinutes: null,
    attendingLabel: null, institutionSite: null, patientAgeBin: 'AGE_46_60', diagnosisCategory: null, outcomeCategory: 'UNCOMPLICATED',
    complicationCategory: 'NONE', conversionOccurred: false, notes: null, tags: [], reflection: null, isPublic: false, benchmarkOptIn: true,
    caseDate: new Date(start.getTime() + monthsIn * 30.44 * 86400000), createdAt: start, updatedAt: start,
  };
}

// 1. a resident who climbs one ordinal step every 12 months: slope ~1.0 per year
const climber: CaseLog[] = [];
for (let m = 0; m < 36; m += 1) {
  const level: AutonomyLevel = m < 12 ? 'ASSISTANT' : m < 24 ? 'SUPERVISOR_PRESENT' : 'INDEPENDENT';
  climber.push(mk(m, level));
}
const s1 = residentSlope('u', climber, start);
assert.ok(s1.eligible, s1.reason ?? '');
assert.ok(s1.slopePerYear !== null && s1.slopePerYear > 0.8 && s1.slopePerYear < 1.1, JSON.stringify(s1));
assert.equal(s1.recentIndependentShare, 1);

// 2. flat resident: slope ~0
const flat = Array.from({ length: 30 }, (_, i) => mk(i, 'ASSISTANT'));
const s2 = residentSlope('u', flat, start);
assert.ok(s2.eligible && Math.abs(s2.slopePerYear ?? 9) < 0.01);
assert.equal(s2.recentIndependentShare, 0);

// 3. ineligible: no start date, too few cases, too short a span
assert.equal(residentSlope('u', climber, null).reason, 'no residency start date');
assert.equal(residentSlope('u', climber.slice(0, 10), start).eligible, false);
const burst = Array.from({ length: 25 }, (_, i) => mk(i * 0.1, 'INDEPENDENT'));
assert.equal(residentSlope('u', burst, start).eligible, false);

// 4. ordinal is monotone
assert.ok(AUTONOMY_ORDINAL.OBSERVER < AUTONOMY_ORDINAL.ASSISTANT && AUTONOMY_ORDINAL.INDEPENDENT < AUTONOMY_ORDINAL.TEACHING);

// 5. program aggregate: not reportable under 5 eligible residents, reportable at 5 with median and IQR
const few = [s1, s2, s1];
assert.equal(programSlope(few).reportable, false);
const many = [s1, s2, s1, s2, s1, residentSlope('x', climber, null)];
const p = programSlope(many);
assert.equal(p.reportable, true);
assert.equal(p.residentsEligible, 5);
assert.equal(p.residentsMissingStartDate, 1);
assert.ok(p.medianSlopePerYear !== null && p.iqrSlopePerYear !== null);
assert.ok(p.iqrSlopePerYear![0] <= p.medianSlopePerYear! && p.medianSlopePerYear! <= p.iqrSlopePerYear![1]);

console.log('autonomy-slope: 15 checks passed');
