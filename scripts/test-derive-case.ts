/* Run: npx ts-node --compiler-options '{"module":"CommonJS","moduleResolution":"node","esModuleInterop":true}' scripts/test-derive-case.ts */
import assert from 'node:assert/strict';
import { deriveCaseFromNote, toCasePrefill } from '../src/lib/dictation/derive-case';

const note1 = `OPERATIVE NOTE
Procedure: Laparoscopic cholecystectomy.
Attending surgeon: Dr. Okafor. Assistant: Dr. Sidhom (PGY-4).
Indication: symptomatic cholelithiasis.
Anesthesia: general.
Description: After time-out, pneumoperitoneum was established with a Veress needle and four trocars were placed. The gallbladder was retracted cephalad. The resident performed the dissection of the hepatocystic triangle and the critical view of safety was obtained under direct supervision with the attending scrubbed. The cystic artery and cystic duct were clipped and divided. The gallbladder was dissected off the liver bed with hook cautery and retrieved in a bag. Hemostasis was confirmed. Estimated blood loss 20 mL. Skin-to-skin operative time 55 minutes. There were no intraoperative complications and the patient tolerated the procedure well.`;

const d1 = deriveCaseFromNote(note1, 'general-surgery');
assert.ok(d1.procedure && /cholecystectomy/i.test(d1.procedure.value), JSON.stringify(d1.procedure));
assert.equal(d1.approach?.value, 'LAPAROSCOPIC');
assert.equal(d1.autonomyLevel?.value, 'SUPERVISOR_PRESENT', JSON.stringify(d1.autonomyLevel));
assert.equal(d1.role?.value, 'PRIMARY');
assert.equal(d1.suggestedEntrustment?.score, 4);
assert.equal(d1.attendingLabel?.value, 'Dr. Okafor', JSON.stringify(d1.attendingLabel));
assert.equal(d1.operativeDurationMinutes?.minutes, 55);
assert.equal(d1.conversionOccurred, false);
assert.equal(d1.complicationCategory, 'NONE');
assert.equal(d1.outcomeCategory, 'UNCOMPLICATED');
assert.ok(!d1.warnings.some((w) => /contradict/.test(w)));

const note2 = `Procedure: Robotic-assisted laparoscopic radical prostatectomy with bilateral pelvic lymph node dissection.
Staff: Dr. Nayak. The fellow performed the entire procedure independently with the attending available but not scrubbed. Console time 140 minutes. Operative time 3 hours. A small rectal serosal injury was recognized and repaired primarily; no other complications.`;
const d2 = deriveCaseFromNote(note2, 'urology');
assert.equal(d2.approach?.value, 'ROBOTIC');
assert.equal(d2.autonomyLevel?.value, 'INDEPENDENT', JSON.stringify(d2.autonomyLevel));
assert.equal(d2.suggestedEntrustment?.score, 5);
assert.equal(d2.complicationCategory, 'ORGAN_INJURY');
assert.equal(d2.outcomeCategory, 'MAJOR_COMPLICATION');
assert.equal(d2.operativeDurationMinutes?.minutes, 180, JSON.stringify(d2.operativeDurationMinutes));

const note3 = `Laparoscopic appendectomy was begun but dense adhesions required conversion to an open procedure through a right lower quadrant incision. The resident first assisted. The attending performed the key steps. Operative time 95 min.`;
const d3 = deriveCaseFromNote(note3);
assert.equal(d3.approach?.value, 'HYBRID');
assert.equal(d3.conversionOccurred, true);
assert.equal(d3.autonomyLevel?.value, 'ASSISTANT', JSON.stringify(d3.autonomyLevel));
assert.equal(d3.role?.value, 'ASSIST');
assert.equal(d3.complicationCategory, 'CONVERSION');

const note4 = `The resident performed the procedure independently. Later the attending performed the key steps of the closure.`;
const d4 = deriveCaseFromNote(note4);
assert.ok(d4.warnings.some((w) => /both independent and assistant/.test(w)), d4.warnings.join('|'));
assert.ok((d4.autonomyLevel?.confidence ?? 1) <= 0.5);

const d5 = deriveCaseFromNote('Short note.');
assert.equal(d5.procedure, null);
assert.ok(d5.warnings.length >= 2);

const pre = toCasePrefill(d1);
assert.equal(pre.surgicalApproach, 'LAPAROSCOPIC');
assert.equal(pre.operativeDurationMinutes, 55);
assert.equal(pre.autonomyLevel, 'SUPERVISOR_PRESENT');

console.log('derive-case: 24 checks passed');
