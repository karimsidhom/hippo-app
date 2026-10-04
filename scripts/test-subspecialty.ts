/* Run: npx ts-node -T --compiler-options '{"module":"CommonJS","moduleResolution":"node","esModuleInterop":true}' scripts/test-subspecialty.ts */
import assert from 'node:assert/strict';
import {
  resolveCaseSection,
  sectionBreakdown,
  inferUserSpecialty,
  normalizeProcedureName,
  SECTION_BY_PROCEDURE_ID,
  SPECIALTY_SECTIONS,
} from '../src/lib/subspecialty';
import { PROCEDURE_LIBRARY } from '../src/lib/procedureLibrary';

const uro = (name: string, extra: { specialtyId?: string | null } = {}) =>
  resolveCaseSection({ procedureName: name, ...extra }, 'urology').label;

// 1. Normalisation handles slugs, slashes, brackets
assert.equal(normalizeProcedureName('penile_plication/nesbit'), 'penile plication nesbit');
assert.equal(normalizeProcedureName('Caesarean Section (Repeat)'), 'caesarean section repeat');
assert.equal(normalizeProcedureName('Robot-Assisted Radical Cystectomy'), 'robot assisted radical cystectomy');

// 2. Real-looking urology names, in any casing / slug form
assert.equal(uro('laparoscopic partial nephrectomy'), 'Oncology');
assert.equal(uro('laparoscopic_partial_nephrectomy'), 'Oncology');
assert.equal(uro('robot-assisted radical cystectomy'), 'Oncology');
assert.equal(uro('Robot-Assisted Radical Prostatectomy'), 'Oncology');
assert.equal(uro('TURBT'), 'Oncology');
assert.equal(uro('Intravesical BCG Instillation'), 'Oncology');
assert.equal(uro('Orchiectomy (Radical)'), 'Oncology');
assert.equal(uro('penile plication/nesbit'), 'Andrology');
assert.equal(uro('Penile Implant Placement'), 'Andrology');
assert.equal(uro('Microscopic Vasovasostomy'), 'Andrology');
assert.equal(uro('Microscopic Testis Sperm Extraction (Micro TESE)'), 'Andrology');
assert.equal(uro('Varicocelectomy'), 'Andrology');
assert.equal(uro('Vasectomy'), 'Andrology');
assert.equal(uro('Rezum'), 'Endourology & Stones');
assert.equal(uro('HoLEP'), 'Endourology & Stones');
assert.equal(uro('BPH Surgery - MIST (Rezum, UroLift, iTind)'), 'Endourology & Stones');
assert.equal(uro('Ureteroscopy with laser lithotripsy'), 'Endourology & Stones');
assert.equal(uro('URS'), 'Endourology & Stones');
assert.equal(uro('PCNL'), 'Endourology & Stones');
assert.equal(uro('Ureteral Stent Placement'), 'Endourology & Stones');
assert.equal(uro('Nephrostomy tube placement'), 'Endourology & Stones');
assert.equal(uro('Urethroplasty'), 'Reconstruction');
assert.equal(uro('Robot-Assisted Pyeloplasty'), 'Reconstruction');
assert.equal(uro('Ureteral reimplantation'), 'Reconstruction');
assert.equal(uro('Augmentation Cystoplasty'), 'Reconstruction');
assert.equal(uro('Mid-Urethral Sling Placement'), 'Functional & Female');
assert.equal(uro('Intravesical Botox injection'), 'Functional & Female');
assert.equal(uro('Sacral Neuromodulation'), 'Functional & Female');
assert.equal(uro('Hypospadias Repair'), 'Pediatric');
assert.equal(uro('Pediatric pyeloplasty'), 'Pediatric');
assert.equal(uro('Renal Transplant'), 'Transplant');
assert.equal(uro('Circumcision'), 'General');
assert.equal(uro('Hydrocelectomy'), 'General');
assert.equal(uro('Hydrocele/Spermatocele/Epididymal Cyst Repair'), 'General');
assert.equal(uro('Scrotal exploration for torsion'), 'General');
assert.equal(uro('Cystoscopy'), 'General');
assert.equal(uro('Flexible cystoscopy'), 'General');
assert.equal(uro('Simple nephrectomy'), 'General');

// 3. Off-service rotations are not forced into urology
assert.equal(uro('caesarean section (repeat)'), 'Off-service');
assert.equal(uro('caesarean_section_(repeat)'), 'Off-service');
assert.equal(uro('Hysterectomy (Laparoscopic)'), 'Off-service');
assert.equal(uro('Radical Hysterectomy'), 'Off-service');
assert.equal(uro('Laparoscopic Cholecystectomy'), 'Off-service');
assert.equal(uro('Laparoscopic Appendectomy'), 'Off-service');
// Explicitly filed under another specialty wins, even for a urology-sounding name
assert.equal(uro('Cystoscopy', { specialtyId: 'general-surgery' }), 'Off-service');
// Andrology (smsna) cases are urology family, never off-service for a urologist
assert.equal(uro('Penile Implant Placement', { specialtyId: 'smsna' }), 'Andrology');
// Unknown free text stays Other rather than guessing
assert.equal(uro('Teaching session'), 'Other');

// 4. General surgery sections
const gs = (name: string) => resolveCaseSection({ procedureName: name }, 'general-surgery').label;
assert.equal(gs('Laparoscopic Cholecystectomy'), 'HPB');
assert.equal(gs('Laparoscopic Appendectomy'), 'Acute Care & Trauma');
assert.equal(gs('Laparoscopic inguinal hernia repair'), 'Hernia & Abdominal Wall');
assert.equal(gs('Sleeve gastrectomy'), 'Upper GI & Bariatric');
assert.equal(gs('Total thyroidectomy'), 'Breast & Endocrine');
assert.equal(gs('Right hemicolectomy'), 'Colorectal');
assert.equal(gs('Robot-assisted radical prostatectomy'), 'Off-service');

// 5. Obstetrics resident: the caesarean is their own work
assert.equal(resolveCaseSection({ procedureName: 'caesarean section (repeat)' }, 'obgyn').label, 'Obstetrics');

// 6. No specialty known: everything is Other (the UI asks the user to set one)
assert.equal(resolveCaseSection({ procedureName: 'TURBT' }, null).label, 'Other');

// 7. Every library procedure maps to a declared section of its own specialty
for (const p of PROCEDURE_LIBRARY) {
  const entry = SECTION_BY_PROCEDURE_ID[p.id];
  assert.ok(entry, `missing ${p.id}`);
  const declared = (SPECIALTY_SECTIONS[p.specialty] ?? []).map((s) => s.key);
  assert.ok(declared.includes(entry.section), `${p.id} ${p.name} -> ${entry.section} not declared for ${p.specialty}`);
  // and resolving the library's own name lands in the same section
  const r = resolveCaseSection({ procedureName: p.name }, p.specialty);
  assert.equal(r.offService, false, `${p.id} ${p.name} resolved off-service for its own specialty`);
}

// 8. Breakdown: ranked, percentages, independence share, Off-service last
const cases = [
  { procedureName: 'TURBT', autonomyLevel: 'INDEPENDENT' },
  { procedureName: 'TURBT', autonomyLevel: 'ASSISTANT' },
  { procedureName: 'RARP', autonomyLevel: 'ASSISTANT' },
  { procedureName: 'Vasectomy', autonomyLevel: 'TEACHING' },
  { procedureName: 'caesarean section (repeat)', autonomyLevel: 'OBSERVER' },
];
const b = sectionBreakdown(cases, 'urology');
assert.deepEqual(b.map((r) => r.label), ['Oncology', 'Andrology', 'Off-service']);
assert.equal(b[0].count, 3);
assert.equal(b[0].pct, 60);
assert.equal(b[0].independentPct, 33);
assert.equal(b[1].independentPct, 100);
const full = sectionBreakdown(cases, 'urology', { includeEmpty: true });
assert.equal(full.filter((r) => !r.offService && r.key !== 'other').length, SPECIALTY_SECTIONS.urology.length);

// 9. Specialty inference: profile first, then majority of case slugs
assert.equal(inferUserSpecialty('Urology', []), 'urology');
assert.equal(inferUserSpecialty('urology', []), 'urology');
assert.equal(inferUserSpecialty(null, [{ procedureName: 'x', specialtyId: 'urology' }, { procedureName: 'y', specialtyId: 'urology' }, { procedureName: 'z', specialtyId: 'obgyn' }]), 'urology');
assert.equal(inferUserSpecialty(null, []), null);

console.log('subspecialty: all assertions passed');
