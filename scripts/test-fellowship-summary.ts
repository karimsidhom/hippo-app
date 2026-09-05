/* Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-fellowship-summary.ts */
import assert from 'node:assert/strict';
import { buildFellowshipSummary } from '../src/lib/reports/fellowship-summary';

const s = buildFellowshipSummary([
  { caseDate: '2025-03-01', procedureCategory: 'Endourology', procedureName: 'URS', role: 'PRIMARY', autonomyLevel: 'SUPERVISED' },
  { caseDate: '2025-04-01', procedureCategory: 'Endourology', procedureName: 'URS', role: 'ASSIST', autonomyLevel: 'SUPERVISED' },
  { caseDate: '2026-01-10', procedureCategory: 'Endourology', procedureName: 'PCNL', role: 'PRIMARY', autonomyLevel: 'INDEPENDENT' },
  { caseDate: '2026-02-10', procedureCategory: 'Oncology', procedureName: 'RARP', role: 'ASSIST', autonomyLevel: 'SUPERVISED' },
  { caseDate: null, procedureCategory: '', procedureName: '', role: null, autonomyLevel: null },
]);

assert.deepEqual(s.years, [2025, 2026]);
assert.deepEqual(s.roles, ['ASSIST', 'PRIMARY', 'Unknown']);
assert.equal(s.rows[0].category, 'Endourology');
assert.equal(s.rows[0].total, 3);
assert.equal(s.rows[0].byRole.PRIMARY, 2);
assert.equal(s.rows[0].byYear[2025], 2);
assert.equal(s.rows.find((r) => r.category === 'Uncategorized')?.total, 1);
assert.equal(s.totals.total, 5);
assert.equal(s.totals.byYear[2026], 2);
assert.equal(s.autonomy[0].level, 'SUPERVISED');
assert.equal(s.autonomy[0].percent, 60);
assert.equal(s.topProcedures[0].procedureName, 'URS');
assert.equal(s.topProcedures[0].count, 2);
assert.equal(buildFellowshipSummary([]).totals.total, 0);
console.log('fellowship summary: 13 checks passed');
