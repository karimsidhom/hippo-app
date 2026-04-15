// @ts-nocheck — seed data uses demo UUIDs; User.id is set by Supabase auth in production
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create specialties
  const specialties = await Promise.all([
    prisma.specialty.upsert({ where: { slug: "urology" }, update: {}, create: { name: "Urology", slug: "urology" } }),
    prisma.specialty.upsert({ where: { slug: "general-surgery" }, update: {}, create: { name: "General Surgery", slug: "general-surgery" } }),
    prisma.specialty.upsert({ where: { slug: "orthopedic" }, update: {}, create: { name: "Orthopedic Surgery", slug: "orthopedic" } }),
    prisma.specialty.upsert({ where: { slug: "cardiothoracic" }, update: {}, create: { name: "Cardiothoracic Surgery", slug: "cardiothoracic" } }),
    prisma.specialty.upsert({ where: { slug: "neurosurgery" }, update: {}, create: { name: "Neurosurgery", slug: "neurosurgery" } }),
    prisma.specialty.upsert({ where: { slug: "plastic-surgery" }, update: {}, create: { name: "Plastic Surgery", slug: "plastic-surgery" } }),
    prisma.specialty.upsert({ where: { slug: "vascular" }, update: {}, create: { name: "Vascular Surgery", slug: "vascular" } }),
    prisma.specialty.upsert({ where: { slug: "gynecology" }, update: {}, create: { name: "Gynecologic Oncology", slug: "gynecology" } }),
    prisma.specialty.upsert({ where: { slug: "hepatobiliary" }, update: {}, create: { name: "Hepatobiliary Surgery", slug: "hepatobiliary" } }),
    prisma.specialty.upsert({ where: { slug: "colorectal" }, update: {}, create: { name: "Colorectal Surgery", slug: "colorectal" } }),
    prisma.specialty.upsert({ where: { slug: "transplant" }, update: {}, create: { name: "Transplant Surgery", slug: "transplant" } }),
  ]);

  const urologySpecialty = specialties[0];
  const generalSpecialty = specialties[1];

  // Urology procedures
  const urologyProcedures = [
    { name: "Robot-Assisted Radical Prostatectomy", category: "Oncology", defaultApproach: "ROBOTIC" as const, cptCode: "55866", avgDurationMinutes: 180, difficultyBase: 5 },
    { name: "Laparoscopic Radical Nephrectomy", category: "Oncology", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "50545", avgDurationMinutes: 150, difficultyBase: 4 },
    { name: "Robot-Assisted Partial Nephrectomy", category: "Oncology", defaultApproach: "ROBOTIC" as const, cptCode: "50543", avgDurationMinutes: 180, difficultyBase: 5 },
    { name: "Laparoscopic Pyeloplasty", category: "Reconstruction", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "50544", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Robot-Assisted Pyeloplasty", category: "Reconstruction", defaultApproach: "ROBOTIC" as const, cptCode: "50544", avgDurationMinutes: 110, difficultyBase: 4 },
    { name: "Percutaneous Nephrolithotomy", category: "Endourology", defaultApproach: "PERCUTANEOUS" as const, cptCode: "50080", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Ureteroscopy with Laser Lithotripsy", category: "Endourology", defaultApproach: "ENDOSCOPIC" as const, cptCode: "52356", avgDurationMinutes: 60, difficultyBase: 3 },
    { name: "Transurethral Resection of Prostate", category: "BPH", defaultApproach: "ENDOSCOPIC" as const, cptCode: "52601", avgDurationMinutes: 75, difficultyBase: 3 },
    { name: "Holmium Laser Enucleation of Prostate", category: "BPH", defaultApproach: "ENDOSCOPIC" as const, cptCode: "52649", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Transurethral Resection of Bladder Tumor", category: "Oncology", defaultApproach: "ENDOSCOPIC" as const, cptCode: "52235", avgDurationMinutes: 45, difficultyBase: 3 },
    { name: "Radical Cystectomy with Ileal Conduit", category: "Oncology", defaultApproach: "OPEN" as const, cptCode: "51570", avgDurationMinutes: 300, difficultyBase: 5 },
    { name: "Robot-Assisted Radical Cystectomy", category: "Oncology", defaultApproach: "ROBOTIC" as const, cptCode: "51597", avgDurationMinutes: 360, difficultyBase: 5 },
    { name: "Laparoscopic Adrenalectomy", category: "Adrenal", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "60650", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Renal Transplant", category: "Transplant", defaultApproach: "OPEN" as const, cptCode: "50360", avgDurationMinutes: 180, difficultyBase: 5 },
    { name: "Ureteral Reimplantation", category: "Reconstruction", defaultApproach: "OPEN" as const, cptCode: "50780", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Penile Prosthesis Implantation", category: "Male Health", defaultApproach: "OPEN" as const, cptCode: "54405", avgDurationMinutes: 90, difficultyBase: 3 },
    { name: "Artificial Urinary Sphincter", category: "Incontinence", defaultApproach: "OPEN" as const, cptCode: "53445", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Male Urethral Sling", category: "Incontinence", defaultApproach: "OPEN" as const, cptCode: "53440", avgDurationMinutes: 60, difficultyBase: 3 },
    { name: "Varicocelectomy", category: "Male Health", defaultApproach: "OPEN" as const, cptCode: "55530", avgDurationMinutes: 60, difficultyBase: 3 },
    { name: "Scrotal Exploration / Orchiopexy", category: "Male Health", defaultApproach: "OPEN" as const, cptCode: "54650", avgDurationMinutes: 45, difficultyBase: 2 },
    { name: "Orchiectomy", category: "Oncology", defaultApproach: "OPEN" as const, cptCode: "54520", avgDurationMinutes: 45, difficultyBase: 2 },
    { name: "Retroperitoneal Lymph Node Dissection", category: "Oncology", defaultApproach: "OPEN" as const, cptCode: "55845", avgDurationMinutes: 240, difficultyBase: 5 },
    { name: "Hypospadias Repair", category: "Pediatric", defaultApproach: "OPEN" as const, cptCode: "54308", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Cystoscopy with Biopsy", category: "Endourology", defaultApproach: "ENDOSCOPIC" as const, cptCode: "52204", avgDurationMinutes: 30, difficultyBase: 2 },
    { name: "Urethroplasty", category: "Reconstruction", defaultApproach: "OPEN" as const, cptCode: "53410", avgDurationMinutes: 180, difficultyBase: 5 },
    { name: "Nephroureterectomy", category: "Oncology", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "50548", avgDurationMinutes: 180, difficultyBase: 4 },
    { name: "Suprapubic Tube Placement", category: "Endourology", defaultApproach: "PERCUTANEOUS" as const, cptCode: "51040", avgDurationMinutes: 30, difficultyBase: 2 },
    { name: "Intravesical BCG Instillation", category: "Oncology", defaultApproach: "ENDOSCOPIC" as const, cptCode: "51720", avgDurationMinutes: 30, difficultyBase: 1 },
    { name: "Extracorporeal Shock Wave Lithotripsy", category: "Endourology", defaultApproach: "PERCUTANEOUS" as const, cptCode: "50590", avgDurationMinutes: 60, difficultyBase: 2 },
    { name: "Laparoscopic Nephroureterectomy", category: "Oncology", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "50548", avgDurationMinutes: 180, difficultyBase: 4 },
  ];

  for (const proc of urologyProcedures) {
    await prisma.procedureDefinition.upsert({
      where: { specialtyId_name: { specialtyId: urologySpecialty.id, name: proc.name } },
      update: {},
      create: { ...proc, specialtyId: urologySpecialty.id },
    });
  }

  // General Surgery procedures
  const generalProcedures = [
    { name: "Laparoscopic Cholecystectomy", category: "Biliary", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "47562", avgDurationMinutes: 60, difficultyBase: 2 },
    { name: "Laparoscopic Appendectomy", category: "Colorectal", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "44950", avgDurationMinutes: 45, difficultyBase: 2 },
    { name: "Inguinal Hernia Repair", category: "Hernia", defaultApproach: "OPEN" as const, cptCode: "49505", avgDurationMinutes: 60, difficultyBase: 2 },
    { name: "Laparoscopic Inguinal Hernia Repair (TEP)", category: "Hernia", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "49650", avgDurationMinutes: 75, difficultyBase: 3 },
    { name: "Laparoscopic Nissen Fundoplication", category: "Upper GI", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "43280", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Roux-en-Y Gastric Bypass", category: "Bariatric", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "43644", avgDurationMinutes: 150, difficultyBase: 5 },
    { name: "Sleeve Gastrectomy", category: "Bariatric", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "43775", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Right Hemicolectomy", category: "Colorectal", defaultApproach: "LAPAROSCOPIC" as const, cptCode: "44160", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Hartmann's Procedure", category: "Colorectal", defaultApproach: "OPEN" as const, cptCode: "44143", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Whipple Procedure", category: "Pancreatic", defaultApproach: "OPEN" as const, cptCode: "48150", avgDurationMinutes: 360, difficultyBase: 5 },
    { name: "Thyroidectomy", category: "Endocrine", defaultApproach: "OPEN" as const, cptCode: "60240", avgDurationMinutes: 120, difficultyBase: 4 },
    { name: "Parathyroidectomy", category: "Endocrine", defaultApproach: "OPEN" as const, cptCode: "60500", avgDurationMinutes: 90, difficultyBase: 4 },
    { name: "Mastectomy", category: "Breast", defaultApproach: "OPEN" as const, cptCode: "19303", avgDurationMinutes: 120, difficultyBase: 3 },
  ];

  for (const proc of generalProcedures) {
    await prisma.procedureDefinition.upsert({
      where: { specialtyId_name: { specialtyId: generalSpecialty.id, name: proc.name } },
      update: {},
      create: { ...proc, specialtyId: generalSpecialty.id },
    });
  }

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: "alex.chen@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "alex.chen@hospital.com",
      name: "Dr. Alex Chen",
      role: "USER",
      profile: {
        create: {
          roleType: "RESIDENT",
          specialty: "Urology",
          subspecialty: "Endourology",
          institution: "University Health Network",
          city: "Toronto",
          pgyYear: 4,
          trainingYearLabel: "PGY-4",
          publicProfile: true,
          allowFriendRequests: true,
          allowLeaderboardParticipation: true,
          allowBenchmarkSharing: true,
          bio: "Urology resident with interest in minimally invasive surgery and robotic procedures.",
          onboardingCompleted: true,
        },
      },
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sarah.kim@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "sarah.kim@hospital.com",
      name: "Dr. Sarah Kim",
      role: "USER",
      profile: {
        create: {
          roleType: "RESIDENT",
          specialty: "Urology",
          institution: "Mount Sinai Hospital",
          city: "Toronto",
          pgyYear: 3,
          trainingYearLabel: "PGY-3",
          publicProfile: true,
          onboardingCompleted: true,
        },
      },
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "james.wilson@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "james.wilson@hospital.com",
      name: "Dr. James Wilson",
      role: "USER",
      profile: {
        create: {
          roleType: "FELLOW",
          specialty: "Urology",
          subspecialty: "Urologic Oncology",
          institution: "Princess Margaret Hospital",
          city: "Toronto",
          pgyYear: 6,
          trainingYearLabel: "Fellow Year 1",
          publicProfile: true,
          onboardingCompleted: true,
        },
      },
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: "priya.patel@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "priya.patel@hospital.com",
      name: "Dr. Priya Patel",
      role: "USER",
      profile: {
        create: {
          roleType: "RESIDENT",
          specialty: "General Surgery",
          institution: "St. Michael's Hospital",
          city: "Toronto",
          pgyYear: 5,
          trainingYearLabel: "PGY-5",
          publicProfile: true,
          onboardingCompleted: true,
        },
      },
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: "michael.okonkwo@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "michael.okonkwo@hospital.com",
      name: "Dr. Michael Okonkwo",
      role: "USER",
      profile: {
        create: {
          roleType: "RESIDENT",
          specialty: "Urology",
          institution: "Sunnybrook Health Sciences",
          city: "Toronto",
          pgyYear: 2,
          trainingYearLabel: "PGY-2",
          publicProfile: false,
          onboardingCompleted: true,
        },
      },
    },
  });

  // Attending — required for pearl endorsements (gated on roleType === ATTENDING).
  // Having at least one attending on staff is what separates Hippo from a
  // student-only journal; their endorsements are the social moat.
  const attending1 = await prisma.user.upsert({
    where: { email: "david.hernandez@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "david.hernandez@hospital.com",
      name: "Dr. David Hernandez",
      role: "USER",
      profile: {
        create: {
          roleType: "ATTENDING",
          specialty: "Urology",
          subspecialty: "Robotic Oncology",
          institution: "University Health Network",
          city: "Toronto",
          pgyYear: 15,
          trainingYearLabel: "Attending",
          publicProfile: true,
          allowFriendRequests: true,
          bio: "Staff urologist. Robotic oncology lead at UHN. I co-sign what I'd teach in my own OR.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // A general surgery attending for cross-specialty variety.
  const attending2 = await prisma.user.upsert({
    where: { email: "rachel.thompson@hospital.com" },
    update: {},
    create: {
      id: randomUUID(),
      email: "rachel.thompson@hospital.com",
      name: "Dr. Rachel Thompson",
      role: "USER",
      profile: {
        create: {
          roleType: "ATTENDING",
          specialty: "General Surgery",
          subspecialty: "Hepatobiliary",
          institution: "St. Michael's Hospital",
          city: "Toronto",
          pgyYear: 12,
          trainingYearLabel: "Attending",
          publicProfile: true,
          allowFriendRequests: true,
          bio: "HPB staff. Teaching is the job.",
          onboardingCompleted: true,
        },
      },
    },
  });

  // Fetch procedure definitions for case logs
  const rarp = await prisma.procedureDefinition.findFirst({ where: { name: "Robot-Assisted Radical Prostatectomy" } });
  const urs = await prisma.procedureDefinition.findFirst({ where: { name: "Ureteroscopy with Laser Lithotripsy" } });
  const turbt = await prisma.procedureDefinition.findFirst({ where: { name: "Transurethral Resection of Bladder Tumor" } });
  const pcnl = await prisma.procedureDefinition.findFirst({ where: { name: "Percutaneous Nephrolithotomy" } });
  const lapNeph = await prisma.procedureDefinition.findFirst({ where: { name: "Laparoscopic Radical Nephrectomy" } });
  const holep = await prisma.procedureDefinition.findFirst({ where: { name: "Holmium Laser Enucleation of Prostate" } });
  const partNeph = await prisma.procedureDefinition.findFirst({ where: { name: "Robot-Assisted Partial Nephrectomy" } });
  const lapPyelo = await prisma.procedureDefinition.findFirst({ where: { name: "Laparoscopic Pyeloplasty" } });
  const turp = await prisma.procedureDefinition.findFirst({ where: { name: "Transurethral Resection of Prostate" } });

  // Generate 40+ case logs for user1 spread across 12 months
  const now = new Date("2025-12-31");
  const caseLogs = [
    // January
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-01-08"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 220, consoleTimeMinutes: 195, dockingTimeMinutes: 20, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-01-15"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 55, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Transurethral Resection of Bladder Tumor", procedureDefinitionId: turbt?.id, caseDate: new Date("2025-01-22"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 40, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
    // February
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-02-05"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 50, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Percutaneous Nephrolithotomy", procedureDefinitionId: pcnl?.id, caseDate: new Date("2025-02-12"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 95, difficultyScore: 4, surgicalApproach: "PERCUTANEOUS" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-02-19"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 205, consoleTimeMinutes: 180, dockingTimeMinutes: 18, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Cystoscopy with Biopsy", caseDate: new Date("2025-02-26"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 25, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
    // March
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-03-05"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 195, consoleTimeMinutes: 170, dockingTimeMinutes: 17, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Laparoscopic Radical Nephrectomy", procedureDefinitionId: lapNeph?.id, caseDate: new Date("2025-03-12"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 155, difficultyScore: 4, surgicalApproach: "LAPAROSCOPIC" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-03-19"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 48, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Holmium Laser Enucleation of Prostate", procedureDefinitionId: holep?.id, caseDate: new Date("2025-03-26"), autonomyLevel: "ASSISTANT" as const, role: "Assist", operativeDurationMinutes: 100, difficultyScore: 4, surgicalApproach: "ENDOSCOPIC" as const },
    // April
    { procedureName: "Robot-Assisted Partial Nephrectomy", procedureDefinitionId: partNeph?.id, caseDate: new Date("2025-04-02"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 185, consoleTimeMinutes: 160, dockingTimeMinutes: 18, difficultyScore: 5, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Transurethral Resection of Bladder Tumor", procedureDefinitionId: turbt?.id, caseDate: new Date("2025-04-09"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 42, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-04-16"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 188, consoleTimeMinutes: 162, dockingTimeMinutes: 16, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Laparoscopic Pyeloplasty", procedureDefinitionId: lapPyelo?.id, caseDate: new Date("2025-04-23"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 125, difficultyScore: 4, surgicalApproach: "LAPAROSCOPIC" as const },
    // May
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-05-07"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 45, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-05-14"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 175, consoleTimeMinutes: 155, dockingTimeMinutes: 15, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Percutaneous Nephrolithotomy", procedureDefinitionId: pcnl?.id, caseDate: new Date("2025-05-21"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 88, difficultyScore: 4, surgicalApproach: "PERCUTANEOUS" as const },
    { procedureName: "Transurethral Resection of Prostate", procedureDefinitionId: turp?.id, caseDate: new Date("2025-05-28"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 80, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    // June
    { procedureName: "Robot-Assisted Partial Nephrectomy", procedureDefinitionId: partNeph?.id, caseDate: new Date("2025-06-04"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 175, consoleTimeMinutes: 152, dockingTimeMinutes: 17, difficultyScore: 5, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Laparoscopic Radical Nephrectomy", procedureDefinitionId: lapNeph?.id, caseDate: new Date("2025-06-11"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 145, difficultyScore: 4, surgicalApproach: "LAPAROSCOPIC" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-06-18"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 168, consoleTimeMinutes: 148, dockingTimeMinutes: 14, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-06-25"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 42, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    // July
    { procedureName: "Holmium Laser Enucleation of Prostate", procedureDefinitionId: holep?.id, caseDate: new Date("2025-07-02"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 95, difficultyScore: 4, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-07-09"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 162, consoleTimeMinutes: 143, dockingTimeMinutes: 14, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Transurethral Resection of Bladder Tumor", procedureDefinitionId: turbt?.id, caseDate: new Date("2025-07-16"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 38, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Percutaneous Nephrolithotomy", procedureDefinitionId: pcnl?.id, caseDate: new Date("2025-07-23"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 82, difficultyScore: 4, surgicalApproach: "PERCUTANEOUS" as const },
    { procedureName: "Robot-Assisted Partial Nephrectomy", procedureDefinitionId: partNeph?.id, caseDate: new Date("2025-07-30"), autonomyLevel: "SUPERVISOR_PRESENT" as const, role: "First Surgeon", operativeDurationMinutes: 165, consoleTimeMinutes: 145, dockingTimeMinutes: 15, difficultyScore: 5, surgicalApproach: "ROBOTIC" as const },
    // August
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-08-06"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 40, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-08-13"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 155, consoleTimeMinutes: 138, dockingTimeMinutes: 13, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Laparoscopic Pyeloplasty", procedureDefinitionId: lapPyelo?.id, caseDate: new Date("2025-08-20"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 115, difficultyScore: 4, surgicalApproach: "LAPAROSCOPIC" as const },
    // September
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-09-03"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 150, consoleTimeMinutes: 132, dockingTimeMinutes: 13, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Holmium Laser Enucleation of Prostate", procedureDefinitionId: holep?.id, caseDate: new Date("2025-09-10"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 88, difficultyScore: 4, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Percutaneous Nephrolithotomy", procedureDefinitionId: pcnl?.id, caseDate: new Date("2025-09-17"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 78, difficultyScore: 3, surgicalApproach: "PERCUTANEOUS" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-09-24"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 38, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
    // October
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-10-01"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 145, consoleTimeMinutes: 128, dockingTimeMinutes: 12, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Robot-Assisted Partial Nephrectomy", procedureDefinitionId: partNeph?.id, caseDate: new Date("2025-10-08"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 158, consoleTimeMinutes: 140, dockingTimeMinutes: 13, difficultyScore: 5, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Transurethral Resection of Bladder Tumor", procedureDefinitionId: turbt?.id, caseDate: new Date("2025-10-15"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 35, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Laparoscopic Radical Nephrectomy", procedureDefinitionId: lapNeph?.id, caseDate: new Date("2025-10-22"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 135, difficultyScore: 4, surgicalApproach: "LAPAROSCOPIC" as const },
    // November
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-11-05"), autonomyLevel: "TEACHING" as const, role: "First Surgeon", operativeDurationMinutes: 200, consoleTimeMinutes: 175, dockingTimeMinutes: 16, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-11-12"), autonomyLevel: "TEACHING" as const, role: "First Surgeon", operativeDurationMinutes: 55, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Holmium Laser Enucleation of Prostate", procedureDefinitionId: holep?.id, caseDate: new Date("2025-11-19"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 85, difficultyScore: 4, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Percutaneous Nephrolithotomy", procedureDefinitionId: pcnl?.id, caseDate: new Date("2025-11-26"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 75, difficultyScore: 3, surgicalApproach: "PERCUTANEOUS" as const },
    // December
    { procedureName: "Robot-Assisted Radical Prostatectomy", procedureDefinitionId: rarp?.id, caseDate: new Date("2025-12-03"), autonomyLevel: "TEACHING" as const, role: "First Surgeon", operativeDurationMinutes: 195, consoleTimeMinutes: 170, dockingTimeMinutes: 15, difficultyScore: 4, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Robot-Assisted Partial Nephrectomy", procedureDefinitionId: partNeph?.id, caseDate: new Date("2025-12-10"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 150, consoleTimeMinutes: 133, dockingTimeMinutes: 12, difficultyScore: 5, surgicalApproach: "ROBOTIC" as const },
    { procedureName: "Ureteroscopy with Laser Lithotripsy", procedureDefinitionId: urs?.id, caseDate: new Date("2025-12-17"), autonomyLevel: "TEACHING" as const, role: "First Surgeon", operativeDurationMinutes: 50, difficultyScore: 3, surgicalApproach: "ENDOSCOPIC" as const },
    { procedureName: "Transurethral Resection of Bladder Tumor", procedureDefinitionId: turbt?.id, caseDate: new Date("2025-12-24"), autonomyLevel: "INDEPENDENT" as const, role: "First Surgeon", operativeDurationMinutes: 32, difficultyScore: 2, surgicalApproach: "ENDOSCOPIC" as const },
  ];

  for (const caseLog of caseLogs) {
    await prisma.caseLog.create({
      data: {
        userId: user1.id,
        specialtyId: urologySpecialty.id,
        procedureName: caseLog.procedureName,
        procedureDefinitionId: caseLog.procedureDefinitionId,
        surgicalApproach: caseLog.surgicalApproach || "LAPAROSCOPIC",
        role: caseLog.role,
        autonomyLevel: caseLog.autonomyLevel,
        difficultyScore: caseLog.difficultyScore,
        operativeDurationMinutes: caseLog.operativeDurationMinutes,
        consoleTimeMinutes: caseLog.consoleTimeMinutes || null,
        dockingTimeMinutes: caseLog.dockingTimeMinutes || null,
        outcomeCategory: "UNCOMPLICATED",
        complicationCategory: "NONE",
        patientAgeBin: "AGE_61_75",
        caseDate: caseLog.caseDate,
        benchmarkOptIn: true,
        isPublic: false,
      },
    });
  }

  // Milestones for user1
  await prisma.milestone.createMany({
    data: [
      { userId: user1.id, type: "PROCEDURE_COUNT", procedureName: "Robot-Assisted Radical Prostatectomy", value: 10, achievedAt: new Date("2025-05-14"), badgeKey: "rarp_10" },
      { userId: user1.id, type: "PROCEDURE_COUNT", procedureName: "Robot-Assisted Radical Prostatectomy", value: 20, achievedAt: new Date("2025-09-03"), badgeKey: "rarp_20" },
      { userId: user1.id, type: "TOTAL_CASES", value: 25, achievedAt: new Date("2025-07-09"), badgeKey: "total_25" },
      { userId: user1.id, type: "TOTAL_CASES", value: 40, achievedAt: new Date("2025-10-22"), badgeKey: "total_40" },
      { userId: user1.id, type: "AUTONOMY_UNLOCK", procedureName: "Robot-Assisted Radical Prostatectomy", value: 1, achievedAt: new Date("2025-05-14"), badgeKey: "rarp_independent" },
      { userId: user1.id, type: "STREAK", value: 30, achievedAt: new Date("2025-04-30"), badgeKey: "streak_30" },
    ],
  });

  // Personal Records for user1
  await prisma.personalRecord.createMany({
    data: [
      { userId: user1.id, procedureName: "Robot-Assisted Radical Prostatectomy", recordType: "FASTEST_TIME", value: 145, previousValue: 155, achievedAt: new Date("2025-10-01") },
      { userId: user1.id, procedureName: "Ureteroscopy with Laser Lithotripsy", recordType: "FASTEST_TIME", value: 38, previousValue: 40, achievedAt: new Date("2025-09-24") },
      { userId: user1.id, procedureName: "Robot-Assisted Partial Nephrectomy", recordType: "FASTEST_TIME", value: 150, previousValue: 158, achievedAt: new Date("2025-12-10") },
    ],
  });

  // Friendships
  const friendship1 = await prisma.friendship.create({
    data: { user1Id: user1.id, user2Id: user2.id },
  });
  const friendship2 = await prisma.friendship.create({
    data: { user1Id: user1.id, user2Id: user3.id },
  });

  // Feed events
  await prisma.feedEvent.createMany({
    data: [
      { userId: user1.id, eventType: "MILESTONE", title: "Reached 20 RARP cases!", description: "Completed their 20th Robot-Assisted Radical Prostatectomy", isPublic: true, createdAt: new Date("2025-09-03") },
      { userId: user1.id, eventType: "PERSONAL_RECORD", title: "New PR: RARP in 145 min", description: "Set a new personal best operative time for RARP", isPublic: true, createdAt: new Date("2025-10-01") },
      { userId: user2.id, eventType: "MILESTONE", title: "Reached 10 URS cases!", description: "Completed their 10th Ureteroscopy with Laser Lithotripsy", isPublic: true, createdAt: new Date("2025-08-15") },
      { userId: user3.id, eventType: "MILESTONE", title: "First Independent Cystectomy!", description: "Completed first independent Radical Cystectomy", isPublic: true, createdAt: new Date("2025-07-20") },
      { userId: user1.id, eventType: "CASE_LOG", title: "Logged a new case", description: "Completed a Robot-Assisted Partial Nephrectomy", isPublic: true, createdAt: new Date("2025-12-10") },
    ],
  });

  // ─── Pearls (social feed) ────────────────────────────────────────────────
  // A resident or PD opening the feed for the first time needs to see a live
  // community, not an empty state. We seed 6 canonical pearls covering the
  // post types (pearl, case_share, discussion, research, poll) and author
  // them across resident + attending roles. Two are endorsed by an attending
  // (the "co-sign" ribbon) and two are marked isFeatured for the empty-state
  // rail. Idempotent: if any featured pearls already exist we skip — this
  // lets `prisma db seed` be re-run safely.
  const existingFeatured = await prisma.pearl.count({ where: { isFeatured: true } });
  if (existingFeatured === 0) {
    const pearlSeeds: Array<{
      author: typeof user1;
      data: Parameters<typeof prisma.pearl.create>[0]["data"];
      endorsedBy?: Array<typeof attending1>;
      reactions?: Array<{ user: typeof user1; kind: string }>;
      comments?: Array<{ author: typeof user1; content: string }>;
    }> = [
      {
        // Endorsed attending pearl — the kind of content that makes a resident
        // scroll. Short, specific, "I wish I knew this sooner" tone.
        author: attending1,
        data: {
          authorId: attending1.id,
          procedureName: "Robot-Assisted Radical Prostatectomy",
          category: "Oncology",
          postType: "pearl",
          title: "The apex dissection trick nobody taught me until year 4 of fellowship",
          content:
            "Before you transect the DVC, lower the pneumoperitoneum to 8 mmHg for 30 seconds. Venous bleeders that were hiding under 15 mmHg become obvious. I've never re-packed an apex since I started doing this.\n\nSmall change. Saves 10 minutes and a transfusion on the cases where it matters.",
          tags: ["RARP", "technique", "bleeding-control"],
          isFeatured: true,
          likeCount: 42,
          saveCount: 28,
          commentCount: 3,
          reactionCount: 31,
          endorseCount: 2,
        },
        endorsedBy: [attending2],
        reactions: [
          { user: user1, kind: "technique" },
          { user: user2, kind: "saved" },
          { user: user3, kind: "teaching" },
          { user: user4, kind: "technique" },
          { user: user5, kind: "saved" },
        ],
        comments: [
          {
            author: user3,
            content:
              "Tried this last week on a case with a high-riding apex. Completely changed the dissection. Thanks for sharing.",
          },
          {
            author: user1,
            content:
              "Wait — is 8 mmHg safe for a full 30 seconds intraop? Any concern about gas embolism?",
          },
          {
            author: attending1,
            content:
              "Great question. I've never seen an issue at 8 for <60s in a patient with normal CO2 clearance — I bump it back to 15 the moment I see the venous anatomy.",
          },
        ],
      },
      {
        // Resident case share — mistakes + what they'd do differently. Honest.
        author: user1,
        data: {
          authorId: user1.id,
          procedureName: "Laparoscopic Pyeloplasty",
          category: "Reconstruction",
          postType: "case_share",
          title: "Anastomosis took me 90 minutes today. Here's why.",
          content:
            "Did a lap pyelo as primary surgeon, UPJ anastomosis. Planned for 20 min, took 90. What went wrong:\n\n• Picked the 5-0 Monocryl on a curved needle instead of the V-Loc that our attendings use\n• Didn't mark the apex stitch before starting — got disoriented on my second run\n• Tension was higher than I thought; should have done more ureteral mobilization up front\n\nNext time: V-Loc, mark the apex with a 4-0 silk tagger, 2 cm more mobilization before committing.",
          tags: ["pyeloplasty", "anastomosis", "lessons-learned"],
          isFeatured: false,
          likeCount: 18,
          saveCount: 24,
          commentCount: 2,
          reactionCount: 19,
          endorseCount: 1,
        },
        endorsedBy: [attending1],
        reactions: [
          { user: user2, kind: "teaching" },
          { user: user3, kind: "teaching" },
          { user: user5, kind: "saved" },
          { user: attending1, kind: "technique" },
        ],
        comments: [
          {
            author: attending1,
            content:
              "This is exactly the kind of self-reflection I want to see from my residents. V-Loc is a game changer for UPJ — try it next case.",
          },
        ],
      },
      {
        // Warning-kind pearl — complication avoidance. Dense and useful.
        author: user3,
        data: {
          authorId: user3.id,
          procedureName: "Robot-Assisted Partial Nephrectomy",
          category: "Oncology",
          postType: "pearl",
          title: "Warning: don't trust the pre-op CT for renal artery count",
          content:
            "Third partial this year where the pre-op CT missed an accessory lower-pole artery. On one of them we hit it during hilar dissection and had to convert to ischemia before I was ready.\n\nIf the tumor sits on the lower pole or you see any asymmetry in the arterial phase, get the 3D reconstruction. Radiology misses accessories 10–15% of the time.",
          tags: ["partial-nephrectomy", "anatomy", "safety"],
          isFeatured: true,
          likeCount: 31,
          saveCount: 19,
          commentCount: 1,
          reactionCount: 22,
          endorseCount: 1,
        },
        endorsedBy: [attending1],
        reactions: [
          { user: user1, kind: "warning" },
          { user: user2, kind: "warning" },
          { user: user4, kind: "saved" },
          { user: attending1, kind: "teaching" },
        ],
        comments: [
          {
            author: user2,
            content:
              "Can confirm. Had the same thing in a right lower-pole case last month. 3D recon caught it on review.",
          },
        ],
      },
      {
        // Research share — journal club material. Links to a paper (linkUrl).
        author: user4,
        data: {
          authorId: user4.id,
          procedureName: "Laparoscopic Cholecystectomy",
          category: "Biliary",
          postType: "research",
          title: "New meta-analysis: critical view of safety halves bile duct injury rate",
          content:
            "32,000-patient meta-analysis in Annals of Surgery (Feb 2026). CVS reduced BDI from 0.4% to 0.17% across training hospitals. The kicker: adoption is still only 48% globally.\n\nIf your program isn't tracking CVS on every lap chole, this should change that. Our attending is rolling out a post-op photo review — one minute, every case.",
          tags: ["cholecystectomy", "CVS", "patient-safety", "journal-club"],
          linkUrl: "https://journals.lww.com/annalsofsurgery",
          isFeatured: false,
          likeCount: 12,
          saveCount: 15,
          commentCount: 0,
          reactionCount: 9,
          endorseCount: 0,
        },
        reactions: [
          { user: user1, kind: "seen" },
          { user: user3, kind: "teaching" },
          { user: attending2, kind: "teaching" },
        ],
      },
      {
        // Discussion — open question to the community. Good for engagement.
        author: user2,
        data: {
          authorId: user2.id,
          procedureName: "Ureteroscopy with Laser Lithotripsy",
          category: "Endourology",
          postType: "discussion",
          title: "Dusting vs. basketing for sub-1cm lower-pole stones — what's your default?",
          content:
            "We've been running a split of ~60% dusting, 40% basketing for lower-pole stones under 10mm. Attending preference varies heavily.\n\nI keep seeing dusted fragments float up and re-obstruct. Anyone else moved toward basketing as a default for lower pole specifically? What's your stone-free rate at 6 weeks?",
          tags: ["URS", "stone-management", "technique-debate"],
          isFeatured: false,
          likeCount: 8,
          saveCount: 3,
          commentCount: 2,
          reactionCount: 6,
          endorseCount: 0,
        },
        reactions: [
          { user: user1, kind: "seen" },
          { user: user5, kind: "seen" },
          { user: attending1, kind: "teaching" },
        ],
        comments: [
          {
            author: user1,
            content:
              "Basket every lower pole under 1cm. Dusting gives you a pretty OR but the follow-up CT rate is higher than people admit.",
          },
          {
            author: user3,
            content:
              "Agree. We moved to basketing default 6 months ago — re-treatment rate dropped from 14% to 6%.",
          },
        ],
      },
      {
        // Poll — quick engagement pearl. Gets residents voting on something
        // real. Adds social liveness even without an endorsement.
        author: attending2,
        data: {
          authorId: attending2.id,
          procedureName: "Laparoscopic Appendectomy",
          category: "Colorectal",
          postType: "poll",
          title: "Intracorporeal knot vs. endoloop for the appendiceal stump — what do you teach?",
          content:
            "Asking because I'm building our new resident curriculum. Curious what senior trainees actually prefer in real life.",
          tags: ["appendectomy", "teaching", "technique"],
          pollOptions: [
            { id: "opt-endoloop", label: "Endoloop — faster, simpler for juniors" },
            { id: "opt-intracorp", label: "Intracorporeal knot — builds skill, same safety" },
            { id: "opt-stapler", label: "Endo GIA stapler — least variable outcome" },
            { id: "opt-depends", label: "Depends on the stump — case by case" },
          ],
          isFeatured: false,
          likeCount: 5,
          saveCount: 2,
          commentCount: 0,
          reactionCount: 4,
          endorseCount: 0,
        },
        reactions: [
          { user: user1, kind: "teaching" },
          { user: user4, kind: "teaching" },
          { user: user2, kind: "seen" },
        ],
      },
    ];

    // Spread createdAt across the last 10 days so the feed has a believable
    // timeline rather than six posts all stamped "now".
    const dayMs = 24 * 60 * 60 * 1000;
    const baseTime = Date.now();
    for (let i = 0; i < pearlSeeds.length; i++) {
      const spec = pearlSeeds[i];
      const createdAt = new Date(baseTime - i * 1.7 * dayMs);

      const pearl = await prisma.pearl.create({
        data: {
          ...spec.data,
          createdAt,
          updatedAt: createdAt,
        },
      });

      if (spec.endorsedBy?.length) {
        for (const endorser of spec.endorsedBy) {
          await prisma.pearlEndorsement.create({
            data: {
              pearlId: pearl.id,
              userId: endorser.id,
              createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
            },
          });
        }
      }

      if (spec.reactions?.length) {
        for (let r = 0; r < spec.reactions.length; r++) {
          const { user: reactor, kind } = spec.reactions[r];
          await prisma.pearlReaction.create({
            data: {
              pearlId: pearl.id,
              userId: reactor.id,
              kind,
              createdAt: new Date(createdAt.getTime() + (30 + r * 15) * 60 * 1000),
            },
          });
        }
      }

      if (spec.comments?.length) {
        for (let c = 0; c < spec.comments.length; c++) {
          const { author: commenter, content } = spec.comments[c];
          const commentedAt = new Date(createdAt.getTime() + (60 + c * 45) * 60 * 1000);
          await prisma.pearlComment.create({
            data: {
              pearlId: pearl.id,
              authorId: commenter.id,
              content,
              createdAt: commentedAt,
              updatedAt: commentedAt,
            },
          });
        }
      }
    }

    console.log(`Seeded ${pearlSeeds.length} pearls with reactions, endorsements, and comments.`);
  } else {
    console.log("Pearls already seeded; skipping.");
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
