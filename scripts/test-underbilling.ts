/* Run: npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node","esModuleInterop":true}' scripts/test-underbilling.ts */
import assert from 'node:assert/strict';
import { matchUnclaimed, codeSupportedByNote } from '../src/lib/clinic/underbilling';

const codes = [
  { code: '07840', shortLabel: 'Cystoscopy', description: 'Cystourethroscopy, diagnostic', feeCents: 9500 },
  { code: '07822', shortLabel: 'Ureteric stent insertion', description: 'Insertion of ureteral stent, retrograde, unilateral', feeCents: 22000 },
  { code: '07811', shortLabel: 'Ureteroscopy with laser lithotripsy', description: 'Ureteroscopic laser fragmentation of ureteric or renal calculus', feeCents: 61000 },
  { code: 'T00001', shortLabel: 'Tray fee', description: 'Surgical tray fee for office procedure', feeCents: 3000, noteTypes: ['clinic'] },
  { code: '00110', shortLabel: 'Consultation', description: 'Consultation, specialist', feeCents: 17000 },
  { code: '08820', shortLabel: 'Vasectomy', description: 'Bilateral vasectomy', feeCents: 20000, specialties: ['urology'] },
];

const note = `Procedure: right ureteroscopy with laser lithotripsy of a 7 mm proximal ureteric calculus. A rigid cystoscopy was performed first. At the end of the case a retrograde ureteric stent was inserted on the right. Operative time 48 minutes.`;

// 1. label match, description match, and correct exclusion of claimed codes
const r = matchUnclaimed(codes, note, ['07811'], { noteType: 'operative', specialty: 'urology' });
const got = r.unclaimed.map((u) => u.code);
assert.ok(got.includes('07840'), got.join(','));
assert.ok(got.includes('07822'), got.join(','));
assert.ok(!got.includes('07811'));
assert.ok(!got.includes('00110'));
assert.ok(!got.includes('08820'));
assert.ok(!got.includes('T00001'), 'noteTypes filter should exclude the clinic-only tray fee');
assert.equal(r.unclaimedTotalCents, 9500 + 22000);
assert.equal(r.unclaimed[0].code, '07822', 'sorted by fee descending');
assert.deepEqual(r.claimedButUnsupported, []);

// 2. a claimed code the note does not support is flagged
const r2 = matchUnclaimed(codes, note, ['07811', '08820']);
assert.deepEqual(r2.claimedButUnsupported, ['08820']);

// 3. no false positives on an unrelated note
const r3 = matchUnclaimed(codes, 'Clinic visit for hypertension review. Blood pressure controlled. Follow up in six months.', []);
assert.equal(r3.unclaimed.length, 0);

// 4. description-level match needs a real majority of content words
const s = codeSupportedByNote({ code: 'X', shortLabel: 'Retrograde pyelogram', description: 'Retrograde pyelography, unilateral or bilateral' }, 'A retrograde pyelogram was performed on the left.');
assert.ok(s && s.strength === 'label');
const s2 = codeSupportedByNote({ code: 'Y', shortLabel: 'Nephrectomy', description: 'Radical nephrectomy with adrenalectomy' }, 'The adrenal gland was preserved.');
assert.equal(s2, null);

// 5. case-insensitive claimed codes
const r5 = matchUnclaimed(codes, note, ['t00001']);
assert.ok(r5.claimed.includes('T00001'));

console.log('underbilling: 14 checks passed');
