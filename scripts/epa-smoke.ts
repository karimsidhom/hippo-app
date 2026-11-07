import { getSpecialtyEpaData } from "../src/lib/epa/data";
import { suggestEpasForCase } from "../src/lib/epa/suggest";

const testCases = [
  { procedureName: "Flexible cystoscopy", surgicalApproach: "ENDOSCOPIC", role: "First Surgeon", autonomyLevel: "SUPERVISOR_PRESENT", difficultyScore: 2, diagnosisCategory: "hematuria", procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
  { procedureName: "Radical prostatectomy", surgicalApproach: "ROBOTIC", role: "First Surgeon", autonomyLevel: "SUPERVISOR_PRESENT", difficultyScore: 4, diagnosisCategory: "prostate cancer", procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
  { procedureName: "TURBT", surgicalApproach: "ENDOSCOPIC", role: "First Surgeon", autonomyLevel: "INDEPENDENT", difficultyScore: 3, diagnosisCategory: "bladder cancer", procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
  { procedureName: "Orchiopexy", surgicalApproach: "OPEN", role: "First Surgeon", autonomyLevel: "SUPERVISOR_PRESENT", difficultyScore: 3, diagnosisCategory: "undescended testicle", procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
  { procedureName: "Something weird unknown procedure", surgicalApproach: "OPEN", role: "First Surgeon", autonomyLevel: "SUPERVISOR_PRESENT", difficultyScore: 2, diagnosisCategory: null, procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
  { procedureName: "Ureteroscopy with laser lithotripsy", surgicalApproach: "ENDOSCOPIC", role: "First Surgeon", autonomyLevel: "SUPERVISOR_PRESENT", difficultyScore: 3, diagnosisCategory: null, procedureCategory: null, attendingLabel: null, outcomeCategory: "UNCOMPLICATED", notes: null, specialtyId: "urology" },
];

const data = getSpecialtyEpaData("urology", "CA")!;
console.log("loaded:", data.specialty, data.system, "epas=", data.epas.length);

for (const tc of testCases) {
  const results = suggestEpasForCase(tc as never, data, {});
  console.log(`\n→ "${tc.procedureName}" -> ${results.length} suggestions`);
  for (const r of results) console.log(`  ${r.epaId} [${r.confidence}] score=${r.score}  ${r.epaTitle.slice(0,60)}`);
}
