/* eslint-disable */
// Demo script: renders sample operative dictations across several services
// so you can eyeball what the system produces without logging into the app.
//
// Run with:  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/demo-dictation.ts

import { generateDictation } from "../src/lib/dictation";
import type { CaseLog } from "../src/lib/types";

function makeCase(overrides: Partial<CaseLog>): CaseLog {
  const base: CaseLog = {
    id: "demo",
    userId: "demo-user",
    caseDate: new Date("2026-04-10"),
    procedureName: "",
    specialtyName: "",
    diagnosisCategory: "",
    surgicalApproach: "OPEN",
    autonomyLevel: "SUPERVISOR_PRESENT",
    role: "Primary Surgeon",
    attendingLabel: "Dr. Smith",
    patientAgeBin: "AGE_46_60",
    institutionSite: "University Hospital",
    outcomeCategory: "UNCOMPLICATED",
    complicationCategory: "NONE",
    conversionOccurred: false,
    difficultyScore: 3,
    durationMinutes: 120,
    notes: null,
    reflection: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as CaseLog;
  return { ...base, ...overrides };
}

const samples: Array<{ label: string; c: CaseLog }> = [
  {
    label: "General Surgery — Laparoscopic Cholecystectomy",
    c: makeCase({
      specialtyName: "General Surgery",
      procedureName: "Laparoscopic cholecystectomy",
      diagnosisCategory: "Symptomatic cholelithiasis",
      surgicalApproach: "LAPAROSCOPIC",
    }),
  },
  {
    label: "Vascular — Carotid Endarterectomy",
    c: makeCase({
      specialtyName: "Vascular Surgery",
      procedureName: "Left carotid endarterectomy with patch angioplasty",
      diagnosisCategory: "Symptomatic left carotid stenosis (>70%)",
      surgicalApproach: "OPEN",
      difficultyScore: 4,
    }),
  },
  {
    label: "Urology — TURBT",
    c: makeCase({
      specialtyName: "Urology",
      procedureName: "TURBT",
      diagnosisCategory: "Bladder tumor, left lateral wall",
      surgicalApproach: "ENDOSCOPIC",
      autonomyLevel: "INDEPENDENT",
    }),
  },
  {
    label: "Orthopedics — Total Knee Arthroplasty",
    c: makeCase({
      specialtyName: "Orthopedic Surgery",
      procedureName: "Right total knee arthroplasty",
      diagnosisCategory: "End-stage osteoarthritis, right knee",
      surgicalApproach: "OPEN",
      patientAgeBin: "AGE_61_75",
    }),
  },
  {
    label: "Neurosurgery — Craniotomy for Tumor",
    c: makeCase({
      specialtyName: "Neurosurgery",
      procedureName: "Right frontal craniotomy for tumor resection",
      diagnosisCategory: "Right frontal glioma",
      surgicalApproach: "OPEN",
      difficultyScore: 5,
      autonomyLevel: "ASSISTANT",
    }),
  },
  {
    label: "OB/GYN — Cesarean Section",
    c: makeCase({
      specialtyName: "OB/GYN",
      procedureName: "Primary low transverse cesarean section",
      diagnosisCategory: "Arrest of dilation at 6 cm",
      surgicalApproach: "OPEN",
      patientAgeBin: "AGE_31_45",
    }),
  },
  {
    label: "Cardiothoracic — CABG x3",
    c: makeCase({
      specialtyName: "Cardiothoracic Surgery",
      procedureName: "CABG x3",
      diagnosisCategory: "Triple vessel coronary artery disease",
      surgicalApproach: "OPEN",
      patientAgeBin: "AGE_61_75",
      difficultyScore: 5,
    }),
  },
];

for (const { label, c } of samples) {
  console.log("\n\n" + "#".repeat(72));
  console.log("# " + label);
  console.log("#".repeat(72));
  console.log(generateDictation(c));
}
