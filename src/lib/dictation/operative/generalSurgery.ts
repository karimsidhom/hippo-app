import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import { laparotomyPreamble, laparoscopicPreamble } from "../shared/preamble";
import { standardOpenClosure, standardLapClosure } from "../shared/closure";
import type { TopMatter } from "./types";

// ---------------------------------------------------------------------------
// General Surgery — forced fields:
//   - Incision type (laparoscopic port layout or open incision)
//   - Wound contamination class
//   - Bowel findings and peristalsis
//   - Anastomosis details (staple load / handsewn / air-leak test)
//   - Drains (type + location)
//   - Closure type (fascia, skin)
//   - Postoperative diet and activity plan
// ---------------------------------------------------------------------------

export function generalSurgeryTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cholecystectomy", "lap chole"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Gallbladder with cystic duct and cystic artery stumps intact.",
      disposition:
        "The patient tolerated the procedure well and was awakened from anesthesia uneventfully. All counts were reported as correct. Discharge home the same day on a regular diet as tolerated, ambulating ad lib, with return precautions for fever, jaundice, abdominal pain, or persistent nausea. Follow-up in clinic in 2 weeks.",
    };
  }

  if (includesAny(name, ["appendectomy", "appy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Appendix.",
      disposition:
        "The patient tolerated the procedure well. Advance diet as tolerated and ambulate ad lib. Discharge home when tolerating PO and voiding. Return for fever, worsening pain, or drainage from wound sites.",
    };
  }

  if (includesAny(name, ["inguinal hernia", "ventral hernia", "umbilical hernia", "incisional hernia"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None (or 15 Fr closed-suction drain for large incisional repairs).",
      specimens: "Hernia sac / None.",
      disposition:
        "The patient tolerated the procedure well. Discharge home on a regular diet, with activity restriction of no lifting > 10 lbs × 4–6 weeks. Return precautions for fever, wound drainage, or recurrent bulge.",
    };
  }

  if (includesAny(name, ["right hemicolectomy", "right colectomy", "left hemicolectomy", "sigmoid colectomy", "low anterior resection", "lar", "colectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with epidural catheter for postoperative analgesia.",
      ebl: "Approximately 100–200 ml.",
      drains: "None routinely (pelvic drain may be placed for low anastomoses).",
      specimens: "Colonic segment with mesentery en bloc, including lymph node harvest.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the surgical floor on an ERAS pathway. Clear liquids on POD 0 advancing as tolerated, early ambulation, multimodal analgesia. Return of bowel function expected by POD 3–4. DVT prophylaxis continued.",
    };
  }

  if (includesAny(name, ["whipple", "pancreaticoduodenectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central access; epidural catheter placed preoperatively.",
      ebl: "Approximately 400–600 ml.",
      drains: "Two 19 Fr Blake drains — one at the pancreaticojejunostomy and one at the hepaticojejunostomy.",
      specimens: "En bloc specimen including pancreatic head, duodenum, distal common bile duct, gallbladder, and regional lymph nodes.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the ICU for overnight monitoring. NG decompression, strict glycemic control, and serial drain amylase checks. Advance diet carefully over several days per pancreas service protocol.",
    };
  }

  if (includesAny(name, ["mastectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 50–150 ml.",
      drains: "15 Fr Blake drain in the mastectomy bed brought out through a separate stab incision; axillary drain placed for lymph node dissection when performed.",
      specimens: "Breast tissue with nipple-areolar complex (if total/simple) oriented for pathology; sentinel lymph nodes submitted separately when harvested.",
      disposition:
        "The patient tolerated the procedure well. Admitted for overnight observation or discharged same day per standard pathway. Drain output teaching provided. Follow-up in 1 week for wound check and drain management.",
    };
  }

  if (includesAny(name, ["thyroid"])) {
    return {
      anesthesia: "General endotracheal anesthesia with continuous recurrent laryngeal nerve monitoring.",
      ebl: "Minimal.",
      drains: "None routinely.",
      specimens: "Thyroid lobe / gland, oriented for pathology.",
      disposition:
        "The patient tolerated the procedure well. Admitted for overnight observation for airway and calcium monitoring. Serial ionized calcium checks; replete as needed. Voice assessed postoperatively. Discharge home on postoperative day 1 if stable.",
    };
  }

  if (includesAny(name, ["fundoplication", "nissen", "toupet", "anti-reflux"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None routinely (hiatal hernia sac to pathology if excised).",
      disposition:
        "The patient tolerated the procedure well. Admitted overnight on a clear liquid / full liquid diet × 24h, advancing to soft diet over 2 weeks. Anti-reflux lifestyle counselling. Follow-up in 4 weeks.",
    };
  }

  if (includesAny(name, ["sleeve gastrectomy", "vsg", "lsg"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal to approximately 50 ml.",
      drains: "None routinely (per ERAS) — surgeon may place a drain along the staple line.",
      specimens: "Resected gastric body and fundus.",
      disposition:
        "The patient tolerated the procedure well. Admitted on bariatric ERAS pathway: clear liquids POD 0, advance per bariatric dietitian, ambulate immediately, DVT prophylaxis. Discharge POD 1–2 with vitamin supplementation and bariatric follow-up.",
    };
  }

  if (includesAny(name, ["roux-en-y", "rygb", "gastric bypass"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 50–100 ml.",
      drains: "None routinely.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted on bariatric ERAS pathway. Plan: GI series on POD 1 if surgeon protocol, advance diet over weeks per dietitian, DVT prophylaxis, lifelong vitamin/mineral supplementation, multidisciplinary follow-up.",
    };
  }

  if (includesAny(name, ["splenectomy"]) && !includesAny(name, ["pancreat"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–200 ml (variable; can be brisk).",
      drains: "Left subdiaphragmatic Blake drain only if pancreatic tail manipulation.",
      specimens: "Spleen (note weight + accessory spleens).",
      disposition:
        "The patient tolerated the procedure well. Admitted to the surgical floor. Plan: post-splenectomy vaccinations confirmed (pneumococcal, meningococcal, Hib) — administered preoperatively or 14 days post-op. Lifelong daily prophylactic penicillin counselled in select cases. Medical alert bracelet recommended.",
    };
  }

  if (includesAny(name, ["small bowel resection", "sbr", "enterectomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Approximately 100–200 ml.",
      drains: "None routinely.",
      specimens: "Diseased small bowel segment with mesentery.",
      disposition:
        "The patient tolerated the procedure well. Admitted to the surgical floor on ERAS pathway. Advance diet as tolerated, NG decompression rarely needed. DVT prophylaxis. Return-of-bowel-function expected POD 2–4.",
    };
  }

  if (includesAny(name, ["abscess drainage", "i&d abdominal", "intraabdominal abscess"])) {
    return {
      anesthesia: "General anesthesia (or local with sedation for small superficial collections).",
      ebl: "Minimal.",
      drains: "Drain to dependent collection (Penrose / 19 Fr Blake / pigtail).",
      specimens: "Pus to gram stain + culture & sensitivity (aerobic + anaerobic).",
      disposition:
        "The patient tolerated the procedure well. Plan: IV antibiotics tailored to cultures, drain output documented, drain removed when output is < 30 mL/day or per imaging.",
    };
  }

  if (includesAny(name, ["diagnostic laparoscopy", "exploratory laparotomy", "ex lap"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Variable.",
      drains: "Per indication.",
      specimens: "Biopsies / fluid for cytology + culture as indicated.",
      disposition:
        "The patient tolerated the procedure well. Plan: monitored on the surgical floor; further intervention based on findings.",
    };
  }

  // Generic general surgery default
  return {
    anesthesia: "General endotracheal anesthesia.",
    ebl: "Approximately ________ ml.",
    drains: "[Type and location of drains, or 'None'].",
    specimens: "[Specimens sent to pathology, or 'None'].",
    disposition:
      "The patient tolerated the procedure well. Postoperative diet and activity plan per standard service protocol with return precautions for fever, bleeding, or wound drainage.",
  };
}

export function generalSurgeryFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["cholecystectomy", "lap chole"])) {
    return `The gallbladder was [distended / inflamed / chronically fibrotic] with [clear / cloudy / purulent] bile. The critical view of safety was achieved with the cystic duct and cystic artery clearly identified as the only two structures entering the gallbladder. The liver bed and cystic plate were normal. No evidence of bile leak or ductal injury was appreciated. The duodenum, small bowel, and colon were normal in the field of view. Wound contamination class: II (clean-contaminated).`;
  }

  if (includesAny(name, ["appendectomy", "appy"])) {
    return `The appendix was [acutely inflamed, edematous, and injected / gangrenous / perforated with localized purulent fluid]. The base of the appendix and cecum were [healthy / inflamed]. No evidence of free perforation or diffuse peritonitis was encountered. The small bowel and right colon were unremarkable in the field of view. Wound contamination class: II (clean-contaminated) or III (contaminated) depending on perforation.`;
  }

  if (includesAny(name, ["inguinal hernia"])) {
    const side = /\bbilateral\b/.test(name) ? "bilateral" : /\bleft\b/.test(name) ? "left" : /\bright\b/.test(name) ? "right" : "[side]";
    return `A ${side} [indirect / direct] inguinal hernia was identified with a [small / moderate / large] defect and [reducible / incarcerated] contents consisting of [omentum / small bowel / preperitoneal fat]. The sac was easily reduced and found to be viable. The spermatic cord structures and ilioinguinal nerve were identified and preserved. No additional femoral or obturator defect was identified. Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["ventral hernia", "umbilical hernia", "incisional hernia"])) {
    return `A ventral / incisional defect measuring approximately [__] × [__] cm was identified with reducible / incarcerated contents. The contents were viable and were reduced without difficulty. The fascial edges were healthy and suitable for primary re-approximation with mesh reinforcement. Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["right hemicolectomy", "right colectomy", "left hemicolectomy", "sigmoid colectomy", "low anterior resection", "lar", "colectomy"])) {
    return `The abdomen was explored and there was no evidence of carcinomatosis, liver metastases, or ascites. The target segment of colon contained [a palpable mass / a tattoo-marked lesion / diverticular disease with a narrowed segment]. The remainder of the small bowel and colon was normal in caliber and viable. The ureter was identified and protected throughout. Wound contamination class: II (clean-contaminated). A [stapled side-to-side / handsewn end-to-end] anastomosis was created and found to be patent, well-perfused, and tension-free. An air-leak test was performed for low anastomoses and was negative.`;
  }

  if (includesAny(name, ["whipple", "pancreaticoduodenectomy"])) {
    return `The abdomen was explored and there was no evidence of liver metastases, peritoneal carcinomatosis, or celiac / SMA encasement by tumor. The pancreatic head mass was palpable and determined to be resectable. The portal vein and SMV were free of tumor on dissection. The pancreatic neck was transected with a soft pancreas and a [small / normal-caliber] pancreatic duct. Pancreaticojejunostomy, hepaticojejunostomy, and gastrojejunostomy were constructed without tension, with excellent perfusion. Wound contamination class: II (clean-contaminated).`;
  }

  if (includesAny(name, ["mastectomy"])) {
    return `The [left / right / bilateral] breast contained the previously biopsied mass at the [UOQ / UIQ / LOQ / LIQ / central] position. The skin flaps were raised cleanly in the avascular plane between the subcutaneous fat and breast parenchyma, and the breast was dissected off the pectoralis major fascia without evidence of chest wall invasion. Axillary sentinel lymph node biopsy / level I–II dissection identified [__] lymph nodes. The long thoracic and thoracodorsal nerves were preserved. Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["thyroid"])) {
    return `The thyroid was [diffusely enlarged / nodular / contained a [__] cm dominant nodule in the [right / left] lobe]. Both recurrent laryngeal nerves were identified and preserved with continuous intraoperative nerve monitoring confirming intact signal pre- and post-resection. All four parathyroid glands were identified and preserved on their vascular pedicles. No evidence of extrathyroidal extension or lymphadenopathy in the central compartment was appreciated. Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["fundoplication", "nissen", "toupet"])) {
    return `A type [I / III] hiatal hernia with [__] cm axial herniation was identified. The crural pillars were healthy and amenable to primary closure. The vagus nerves were identified bilaterally and preserved. The short gastric vessels were taken to mobilise the fundus for a tension-free wrap. The wrap was constructed without esophageal narrowing (a 56 Fr bougie was passed without resistance through the wrap). Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["sleeve gastrectomy", "vsg", "lsg"])) {
    return `The stomach was inspected and was suitable for sleeve gastrectomy. The greater curvature was completely mobilised from the gastrocolic ligament with division of short gastric vessels. The angle of His was fully exposed. A 36 Fr orogastric bougie was passed transorally and positioned along the lesser curvature. The staple line was created [__] cm from the pylorus to the angle of His. The staple line was inspected and was hemostatic with a methylene blue leak test negative. Wound contamination class: II.`;
  }

  if (includesAny(name, ["roux-en-y", "rygb", "gastric bypass"])) {
    return `The stomach was inspected and a [25 mL] gastric pouch was created using sequential Endo GIA firings, completely separating the pouch from the gastric remnant. A Roux limb of [100–150 cm] was measured from the ligament of Treitz, and a side-to-side jejunojejunostomy was created with the biliopancreatic limb at [50–100 cm]. The Roux limb was brought antecolic / retrocolic to the gastric pouch and a stapled gastrojejunal anastomosis was created over a [12 mm] EEA stapler. Petersen's defect and the mesenteric defect were closed with non-absorbable sutures. Leak test was negative. Wound contamination class: II.`;
  }

  if (includesAny(name, ["splenectomy"]) && !includesAny(name, ["pancreat"])) {
    return `The spleen was identified and was [normal-sized / enlarged at __ × __ × __ cm], consistent with [ITP / hereditary spherocytosis / lymphoma / trauma]. There was no accessory spleen identified after careful inspection of the splenic hilum, gastrosplenic ligament, splenocolic ligament, omentum, mesentery, and presacral region. The splenic hilum was controlled and the spleen removed without spillage. Wound contamination class: I (clean).`;
  }

  if (includesAny(name, ["small bowel resection", "sbr", "enterectomy"])) {
    return `The diseased small bowel segment ([__] cm long, located [__] cm from the ligament of Treitz / ileocecal valve) was identified, consistent with [Crohn's disease / mass / ischemia / obstructing adhesion]. The remaining bowel was viable. Mesenteric vessels were normal. The anastomosis was patent, well-perfused, and tension-free with negative air-leak test. Wound contamination class: II.`;
  }

  if (includesAny(name, ["abscess drainage", "i&d abdominal", "intraabdominal abscess"])) {
    return `An organised collection of [__] mL of [purulent / serous / faeculent] fluid was identified at the [location], consistent with the preoperative imaging. The cavity was widely opened, evacuated, and irrigated copiously. The cavity walls were inspected; there was no obvious source [or: source was identified as ___ and addressed]. A drain was positioned dependently. Wound contamination class: III–IV depending on contents.`;
  }

  if (includesAny(name, ["diagnostic laparoscopy", "exploratory laparotomy", "ex lap"])) {
    return `Systematic abdominal exploration was performed. [Findings: ___]. There was no evidence of unanticipated pathology beyond what was found. Biopsies were taken for permanent section / cytology / culture as indicated. Wound contamination class: [variable per findings].`;
  }

  return `The abdomen was entered and the relevant anatomy was identified. There was no evidence of unanticipated pathology. Hemostasis was satisfactory at the conclusion of the case. Wound contamination class: [I / II / III / IV].`;
}

function generalSurgeryOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const open = c.surgicalApproach === "OPEN";

  if (includesAny(name, ["cholecystectomy", "lap chole"])) {
    return [
      `The gallbladder was grasped at the fundus and retracted cephalad over the dome of the liver. The infundibulum was grasped and retracted laterally to open the hepatocystic triangle.`,
      `The peritoneum overlying the hepatocystic triangle was dissected on both the anterior and posterior aspects, clearing fibrofatty tissue off the gallbladder-cystic duct junction. A critical view of safety was obtained, with only two structures — the cystic duct and cystic artery — entering the gallbladder and the lower third of the gallbladder separated from the liver bed.`,
      `The cystic artery was doubly clipped proximally and distally and divided. The cystic duct was likewise doubly clipped proximally and singly clipped distally and divided. [Intraoperative cholangiogram was performed / was not indicated.]`,
      `The gallbladder was taken down from the liver bed using electrocautery, staying in the avascular plane. The liver bed and clip line were re-inspected and were hemostatic with no evidence of bile leak. The gallbladder was placed in an Endo Catch bag and removed through the umbilical port.`,
      ``,
    ];
  }

  if (includesAny(name, ["appendectomy", "appy"])) {
    return [
      `The cecum was identified and followed to the base of the appendix. The appendix was grasped and delivered into the operative field. The mesoappendix was inspected and the appendiceal artery identified.`,
      `The mesoappendix was divided using an energy device [LigaSure/harmonic] taking care to achieve hemostasis along the appendiceal artery. The base of the appendix was skeletonized and a window created.`,
      `An Endo GIA stapler with a [white / tan] load was fired across the base of the appendix, and the specimen was placed in an Endo Catch bag and removed through a 12 mm port. The staple line was inspected and was intact and hemostatic.`,
      ``,
    ];
  }

  if (includesAny(name, ["inguinal hernia"])) {
    return open
      ? [
          `A transverse incision was made over the inguinal canal and carried down through Scarpa's fascia to the external oblique aponeurosis. The external oblique was opened in the line of its fibers, taking care to preserve the ilioinguinal nerve. The spermatic cord was encircled with a Penrose drain.`,
          `The cord was dissected circumferentially and the hernia sac identified. The sac was a [direct / indirect] hernia. An indirect sac was dissected off the cord structures and reduced into the preperitoneal space after high ligation with 2-0 silk. A direct defect was reduced and the transversalis fascia imbricated.`,
          `A prefabricated polypropylene mesh was tailored to the floor of the inguinal canal and secured to the pubic tubercle, shelving edge of the inguinal ligament, and conjoint tendon with interrupted 2-0 Prolene, creating a new internal ring around the cord.`,
          `The external oblique was re-approximated with 2-0 Vicryl, Scarpa's with 3-0 Vicryl, and the skin with 4-0 Monocryl subcuticular and Dermabond.`,
        ]
      : [
          `The preperitoneal space was developed by balloon dissector in a TEP fashion (or transperitoneal dissection in a TAPP repair). The pubic symphysis, Cooper's ligament, epigastric vessels, and cord structures were identified bilaterally.`,
          `The hernia sac was reduced back into the peritoneal cavity. The myopectineal orifice was cleared of adhesions. A large pre-shaped polypropylene mesh was introduced and positioned to cover the direct, indirect, and femoral spaces, with wide overlap across the midline.`,
          `The mesh was secured [with tacks to Cooper's ligament, avoiding the triangle of doom and triangle of pain / with self-gripping technology]. Pneumoperitoneum was released and the peritoneal flap re-approximated if TAPP.`,
        ];
  }

  if (includesAny(name, ["ventral hernia", "umbilical hernia", "incisional hernia"])) {
    return [
      `The hernia sac was identified and dissected free of the surrounding subcutaneous tissue down to the fascial defect. The sac contents were reduced. The fascial edges were circumferentially cleared of adherent tissue to expose at least 4 cm of healthy fascia on each side.`,
      `A [retrorectus / intraperitoneal / onlay] polypropylene mesh was positioned with wide (≥ 4 cm) overlap of the defect and secured with interrupted 0 Prolene. The anterior fascia was re-approximated with running #1 looped PDS.`,
      `The subcutaneous tissue was irrigated and the skin was approximated with 4-0 Monocryl subcuticular and Dermabond.`,
    ];
  }

  if (includesAny(name, ["right hemicolectomy", "right colectomy"])) {
    return [
      `The right colon was mobilized along the white line of Toldt from the cecum to the hepatic flexure. The hepatocolic and gastrocolic ligaments were divided. The duodenum was swept posteriorly and care was taken to protect the right ureter and gonadal vessels.`,
      `The ileocolic pedicle was identified, skeletonized, and divided with an energy device or stapler at its origin off the SMA/SMV. The right colic and right branch of the middle colic were similarly divided.`,
      `The terminal ileum and transverse colon were transected with an Endo GIA stapler and the specimen was removed. A side-to-side functional end-to-end stapled ileocolic anastomosis was created and the common enterotomy closed with a second stapler firing. The anastomosis was inspected and was patent and hemostatic. The mesenteric defect was closed with 3-0 silk.`,
    ];
  }

  if (includesAny(name, ["mastectomy"])) {
    return [
      `An elliptical incision was marked to include the nipple-areolar complex (for total/simple mastectomy) or oriented appropriately for a skin-sparing / nipple-sparing approach. The skin flaps were raised in the avascular plane between the subcutaneous fat and the breast parenchyma using electrocautery, extending superiorly to the clavicle, medially to the sternum, inferiorly to the inframammary fold, and laterally to the latissimus dorsi.`,
      `The breast was dissected off the pectoralis major fascia from medial to lateral. [Axillary sentinel lymph node biopsy / level I–II axillary lymph node dissection] was performed through the same or a separate incision, identifying and preserving the long thoracic, thoracodorsal, and intercostobrachial nerves when feasible.`,
      `Hemostasis was achieved. A 15 Fr Blake drain was placed in the mastectomy bed and brought out through a separate stab incision. The skin was closed with 3-0 Vicryl in the deep dermis and 4-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["thyroid"])) {
    return [
      `A transverse collar incision was made two finger-breadths above the sternal notch and carried down through the platysma. Subplatysmal flaps were raised superiorly to the thyroid cartilage and inferiorly to the sternal notch.`,
      `The strap muscles were separated in the midline and retracted laterally to expose the thyroid. The superior pole was mobilized, identifying and ligating the superior thyroid artery branches on the capsule to protect the external branch of the superior laryngeal nerve. The middle thyroid vein was ligated and divided.`,
      `The recurrent laryngeal nerve was identified in the tracheo-esophageal groove and traced superiorly, preserved throughout. The parathyroid glands were identified and preserved on their vascular pedicles. The inferior thyroid artery was ligated on the capsule and the ligament of Berry divided sharply.`,
      `The thyroid [lobe / gland] was removed. Hemostasis was meticulously confirmed. The strap muscles were re-approximated in the midline with 3-0 Vicryl, the platysma with 3-0 Vicryl, and the skin with 4-0 Monocryl subcuticular and Dermabond.`,
    ];
  }

  if (includesAny(name, ["fundoplication", "nissen", "toupet"])) {
    const isNissen = name.includes("nissen") || (!name.includes("toupet") && !name.includes("dor"));
    return [
      `The patient was positioned in low lithotomy with the surgeon between the legs (French position) — alternative split-leg or supine with footboard. The arms were tucked at the sides. Sequential compression devices were placed. The abdomen was prepped from nipples to mid-thigh and draped. Antibiotic prophylaxis (cefazolin 2 g IV) was administered. Preoperative workup was reviewed and confirmed indication for anti-reflux surgery: refractory GERD on optimal medical therapy with abnormal pH study (DeMeester score > 14.7), large hiatal hernia with mechanical symptoms, atypical symptoms (cough, asthma) with documented reflux on impedance-pH, or BE with persistent symptoms. Preoperative manometry confirmed adequate esophageal motility — < 60% peristaltic contractions or distal contractile integral < 450 mmHg·s·cm favored partial Toupet wrap over Nissen.`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point or supraumbilical Hasson. Five ports were placed in the standard French configuration: 12 mm supraumbilical (camera, slightly to left of midline), 5 mm right subcostal mid-clavicular (left-hand operator), 5 mm left subcostal mid-clavicular (right-hand operator), 5 mm left lateral subcostal (assistant), and 5 mm Nathanson liver retractor port at subxiphoid (or Allis-grasper holding the left lobe). Reverse Trendelenburg was used for exposure.`,
      `The liver was retracted with a Nathanson retractor to expose the gastrohepatic ligament. The pars flaccida (gastrohepatic ligament) was opened to enter the lesser sac, with care to identify and preserve any aberrant left hepatic artery (present in 15-20%). The right crus was identified and the phrenoesophageal ligament incised to develop a posterior window. The hiatal hernia sac (if present) was reduced into the abdomen by gentle traction. The sac was carefully dissected off both crura, with attention not to enter the chest (causing pneumothorax) — small breaches were treated with reduction of CO2 pressure and observation; larger pneumothoraces required chest tube.`,
      `The esophagus was circumferentially mobilised within the mediastinum to obtain at least 2.5-3 cm of intra-abdominal esophageal length without tension (Collis gastroplasty was reserved for short esophagus that could not be reduced — performed in 5-15% of cases). Both vagus nerves were identified and preserved: anterior vagus on the anterior esophagus, posterior vagus posterolaterally — both included within the wrap (not separated, to preserve gastric emptying). A Penrose drain was passed posterior to the esophagus to facilitate retraction.`,
      `Short gastric vessels were divided with a vessel-sealing device (LigaSure or Harmonic) along the greater curvature from the inferior pole of the spleen up to the angle of His, fully mobilising the fundus to permit a tension-free wrap. The retrogastric attachments and posterior gastric artery were taken down. The fundus was inspected for adequate mobility — the "shoeshine" maneuver (passing the fundus back and forth posterior to the esophagus) confirmed adequate mobilisation without tension.`,
      `The crura were re-approximated posteriorly with 2-3 interrupted 0 Ethibond non-absorbable sutures placed posterior to the esophagus, with care to avoid injury to the aorta. The closure was sized to permit a 56 Fr bougie (passed transorally by anaesthesia after intubation, manipulated by the surgeon at the GE junction) to pass without resistance — overly tight closure causes dysphagia, overly loose causes recurrent hernia. Pledgeted sutures were used in cases of attenuated crura. Mesh reinforcement (biologic or absorbable synthetic) was used for hiatal defects > 5 cm or attenuated crura per SAGES 2013 guidelines.`,
      `${isNissen ? "Nissen 360° fundoplication: the fundus was passed posterior to the esophagus from left to right, with the right and left limbs of the wrap meeting anterior to the esophagus. The 'shoeshine' maneuver confirmed correct orientation. The wrap was constructed with 3 interrupted 2-0 Ethibond non-absorbable sutures over a 2-3 cm length on the anterior esophagus, each suture incorporating partial-thickness anterior esophageal bite (Nissen-Rossetti modification omits the esophageal bite to reduce dysphagia). The wrap should be 'short and floppy' (DeMeester 1986) — wrap length 2-3 cm, with one finger easily passing between wrap and esophagus." : "Toupet 270° posterior fundoplication: the fundus was passed posterior to the esophagus and the right and left limbs were sutured to the right and left anterolateral esophagus respectively, leaving the anterior esophagus uncovered. The wrap was secured with 2-0 Ethibond interrupted sutures: 3 sutures securing each limb to the corresponding side of the anterior esophagus, plus 2 sutures securing the wrap to the right crus to prevent slippage. The 270° configuration preserves an anterior 90° gap that reduces postoperative dysphagia and gas-bloat syndrome."}`,
      `The bougie was withdrawn and the wrap re-inspected. The wrap should sit at the GE junction (not slipped onto the gastric body — slipped Nissen, recognised by 'two-compartment' appearance). Hemostasis was confirmed. Pneumoperitoneum was released and ports removed under direct vision. 12 mm fascia closed with 0 Vicryl Carter-Thomason. Skin closed with 4-0 Monocryl. Postoperative pathway: clear liquids POD 0, full liquids × 1 week, soft diet × 2 weeks, regular diet at 4 weeks. Patient counselling: gas-bloat syndrome (5-10% of Nissen, less for Toupet — diet modification + simethicone), dysphagia (transient in 30-50%, persistent > 6 weeks in 5-10% requiring dilation), recurrence (10-15% at 5 years for Nissen). Long-term follow-up: pH study and manometry at 6 months for symptom recurrence, GI consult for any new dysphagia or weight loss.`,
    ];
  }

  if (includesAny(name, ["sleeve gastrectomy", "vsg", "lsg"])) {
    return [
      `Bariatric eligibility was confirmed: BMI ≥ 40 (or ≥ 35 with comorbidity per ASMBS / ACS-MBSAQIP guidelines), failure of supervised dietary management × 6 months, multidisciplinary clearance (psychology, dietitian, medical co-management of comorbidities). Preoperative VLCD (very-low-calorie diet) × 2-4 weeks shrank the liver volume by 15-30% to facilitate retraction. The patient was positioned supine on a bariatric-rated table with footboard for reverse Trendelenburg. Sequential compression devices and DVT prophylaxis (enoxaparin 40-60 mg SQ pre-op weight-adjusted) were administered. Antibiotic prophylaxis (cefazolin 3 g IV for BMI > 40, vancomycin if MRSA risk).`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point (left upper quadrant — preferred to umbilicus in obese patients due to thicker abdominal wall and uncertain umbilical anatomy). Five ports were placed: 12 mm supraumbilical (camera), 12 mm left mid-clavicular subcostal (stapler), 5 mm right mid-clavicular subcostal (left hand), 5 mm left lateral subcostal (assistant), and Nathanson liver retractor at subxiphoid. Reverse Trendelenburg.`,
      `The liver was retracted to expose the entire stomach and angle of His. The pylorus was identified — the staple line begins 4-6 cm proximal to the pylorus (preserving the antral pump function — sleeves starting < 2 cm from pylorus have higher reflux risk; > 6 cm leads to fundus retention and inadequate weight loss). The greater curvature was mobilised from the antrum to the angle of His using LigaSure or Harmonic, sequentially dividing the gastrocolic ligament + gastrosplenic ligament + short gastric vessels. The posterior gastric attachments were taken down to fully mobilise the fundus and expose the left crus posteriorly — incomplete posterior fundic mobilisation results in retained fundus and inadequate restriction.`,
      `A 36 Fr orogastric bougie (preferred — < 32 Fr risks stenosis; > 40 Fr risks inadequate restriction) was passed transorally by anesthesia and positioned along the lesser curvature against the pyloric channel down to the antrum. The bougie was used as a sizer for staple line trajectory.`,
      `Sequential Endo GIA staple firings (green load — 4.1 mm closed staple height for thicker antral wall first 1-2 firings; tan/black for body and fundus to 3.5 mm closed staple height) were used to create the sleeve, with each firing tightly along the bougie but without compressing it. The line started 4-6 cm proximal to the pylorus and progressed cephalad in serial firings to the angle of His, with care to: (1) avoid spiraling around the bougie (causes torsion and obstruction); (2) leave 1-2 cm of fundus lateral to the angle of His to prevent leak from the high-pressure proximal staple line (most common leak site, 1-2% incidence); (3) avoid encroachment on the GE junction (causes stricture).`,
      `Reinforcement: staple line was inspected for hemostasis. Bleeding sites were controlled with bipolar cautery or oversewn with 3-0 Vicryl Lembert sutures. Buttressing material (Seamguard, Peristrips Dry) was selectively used per surgeon preference — Cochrane meta-analysis suggests modest reduction in staple line bleeding without significant impact on leak rate. A methylene blue leak test was performed: the bougie was withdrawn, an OG tube was passed, and 60 mL of methylene blue + saline was instilled while occluding the antrum with a bowel grasper. No extravasation was confirmed along the entire staple line. Alternative: intraoperative endoscopy (preferred by some surgeons — visualises the staple line internally + confirms patency + tests with air insufflation under saline).`,
      `The resected stomach was placed in an Endo Catch bag and removed through the 12 mm supraumbilical port (port site enlarged to ~2 cm if needed). The fascia at the 12 mm port site was closed with 0 Vicryl figure-of-eight Carter-Thomason. 5 mm port sites closed at skin only with 4-0 Monocryl subcuticular. Pneumoperitoneum was released. Postoperative pathway: bariatric ERAS — clear liquids POD 0 (50 mL/hr), full liquids POD 1, discharge POD 1-2 with home opioid + GI prophylaxis (PPI × 6 months — 30% develop new-onset GERD post-VSG). UGI series at POD 1 was protocol at some institutions. Long-term: lifelong vitamin/mineral supplementation (multivitamin, B12 1000 mcg monthly IM or 350 mcg PO daily, calcium citrate 1200 mg/day, vitamin D 3000 IU/day), bariatric clinic follow-up at 2 weeks, 3 months, 6 months, then annually. Expected outcomes: 50-70% excess weight loss at 1-2 years, T2DM remission ~60%, hypertension remission ~40%, sleep apnea improvement ~80%.`,
    ];
  }

  if (includesAny(name, ["roux-en-y", "rygb", "gastric bypass"])) {
    return [
      `Bariatric eligibility per ASMBS/ACS-MBSAQIP confirmed (as for VSG above). Pre-op VLCD × 2-4 weeks. Patient positioned supine with footboard. SCDs + DVT prophylaxis. Antibiotic prophylaxis (cefazolin 3 g IV).`,
      `Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point. Five-six ports were placed: 12 mm supraumbilical (camera), 12 mm right paramedian (stapler), 5 mm × 3 (right and left subcostal, left lateral), and Nathanson liver retractor at subxiphoid. Reverse Trendelenburg.`,
      `Pouch creation: the gastrohepatic ligament was opened along the lesser curvature 4-5 cm distal to the GE junction to identify the lesser-sac peritoneal reflection. A retrogastric window was developed posteriorly. A horizontal Endo GIA staple firing (blue load — 3.5 mm closed staple height for the lesser curvature) was placed across the lesser curvature, then sequential vertical firings (blue/black) extending toward the angle of His to fully transect the stomach and create a small (~25-30 mL) gastric pouch. The pouch should be vertically oriented along the lesser curvature, narrow, and contain no fundus (residual fundus increases pouch volume and weight regain risk). The gastric remnant was confirmed completely separated from the pouch.`,
      `Roux limb measurement: the ligament of Treitz was identified. A Roux limb of 100-150 cm (longer for super-obese BMI > 50 — alimentary limb 150 cm; standard 100 cm) was measured by passing the small bowel between two atraumatic graspers placed 30 cm apart along the antimesenteric border. The biliopancreatic limb (proximal segment from Treitz) was 50-100 cm. Selection of limb lengths trades weight loss vs nutritional risk: longer Roux + shorter BP = more weight loss + higher protein-calorie malnutrition risk; shorter Roux + longer BP = less weight loss + lower nutritional risk.`,
      `Jejunojejunostomy creation: the proximal jejunum (BP limb) was approximated antimesenterically to the Roux limb at the chosen point. A side-to-side stapled jejunojejunostomy was created with a 60 mm white/blue Endo GIA load. The common enterotomy was closed transversely with running 3-0 Vicryl (avoiding stenosis from longitudinal closure). The mesenteric defect at the JJ was identified.`,
      `Roux limb routing: the Roux limb was brought up to the gastric pouch in either antecolic (preferred for less internal hernia risk per SAGES recommendation, though longer limb required) or retrocolic (shorter limb path, but creates a Petersen's defect requiring closure) fashion. For retrocolic: a window was created in the transverse mesocolon to the left of the middle colic vessels.`,
      `Gastrojejunostomy creation: ${name.includes("eea") || name.includes("circular") ? "circular-stapled GJ technique using a 21-25 mm EEA stapler — the anvil was pre-placed transorally via OG tube and pulled through the gastric pouch wall with a Penrose; the stapler was passed through the open end of the Roux limb and docked with the anvil; the stapler was fired creating a 21-25 mm GJ" : "linear-stapled GJ technique — a small 1 cm enterotomy was made in the gastric pouch and antimesenteric border of the Roux limb, a 45 mm blue Endo GIA load was fired creating the back wall of the GJ, and the common enterotomy was closed with running 3-0 Vicryl in two layers"} or hand-sewn technique. GJ stoma diameter target 12-15 mm (overly wide stoma — early dumping and weight regain; overly narrow — stricture). The Roux limb was secured to the gastric pouch with anti-tension sutures (Cattell-Braasch maneuver alternative).`,
      `Internal hernia prevention: Petersen's defect (between Roux limb mesentery and transverse mesocolon) and the JJ mesenteric defect were closed with non-absorbable 0 Ethibond running suture (per Stenberg trial, prophylactic mesenteric closure reduces internal hernia rate from 6.6% to 1.7% at 5 years). Routine closure of these defects is now standard.`,
      `Leak test: a methylene blue test (60 mL of methylene blue + saline injected via OG tube into the pouch with the Roux limb occluded distally) confirmed no extravasation at the GJ; alternatively, intraoperative endoscopy with air insufflation under saline submersion. The bowel was inspected from JJ to GJ for kinking or torsion.`,
      `Closure: 12 mm port sites closed at fascia with 0 Vicryl Carter-Thomason; 5 mm at skin with 4-0 Monocryl. Pneumoperitoneum released. Postop bariatric ERAS pathway: UGI series POD 1 (institutional preference), clear liquids POD 0-1, advance per dietitian over 8 weeks (clear liquids → full liquids → pureed → soft → regular). DVT prophylaxis × 4 weeks. Lifelong vitamin/mineral supplementation: multivitamin + iron, B12 1000 mcg monthly IM (B12 deficiency 30%), calcium citrate 1500 mg/day with vitamin D, occasionally folate. Bariatric clinic follow-up: 2 weeks, 6 weeks, 3 months, 6 months, 12 months, then annually. Expected outcomes: 60-80% excess weight loss at 1-2 years, T2DM remission ~80%, dumping syndrome 20-30%, internal hernia 1-3% lifetime, marginal ulcer 5-10% (especially smokers, NSAIDs, H. pylori).`,
    ];
  }

  if (includesAny(name, ["splenectomy"]) && !includesAny(name, ["pancreat"])) {
    const isLap = c.surgicalApproach !== "OPEN";
    return [
      `Indication confirmed: ITP refractory to medical management (steroid + IVIG + rituximab — splenectomy 60-80% durable response), hereditary spherocytosis with significant hemolysis or symptomatic gallstones, hereditary elliptocytosis, hairy cell leukemia, splenic lymphoma, traumatic splenic rupture (failed embolization), splenic abscess, splenic vein thrombosis with hypersplenism. Vaccination protocol per CDC: pneumococcal (PCV13 then PPSV23 ≥ 8 weeks later), meningococcal ACWY + B (Menveo + Bexsero), Haemophilus influenzae type B — administered ≥ 14 days preoperatively (preferred) or ≥ 14 days postoperatively for emergency splenectomy. Post-splenectomy sepsis (OPSI) risk is highest in children < 5 and lifelong, with mortality 50% per episode — vaccination + lifelong on-demand antibiotics + medical alert ID essential.`,
      `${isLap ? "The patient was positioned in right lateral decubitus at 45-60° (modified — preferred for laparoscopic splenectomy) with axillary roll and beanbag stabilisation. Kidney rest was elevated and table flexed at the costo-iliac angle. Sequential compression devices were placed. The abdomen was prepped from nipples to mid-thigh." : "The patient was positioned supine. A long left subcostal incision (Kocher) or upper midline was made. The abdomen was entered."} Antibiotic prophylaxis (cefazolin 2 g IV) was given.`,
      `${isLap ? "Pneumoperitoneum was established to 15 mmHg via Veress or Hasson at the umbilicus (or supraumbilical for high-riding spleen). Four ports were placed: 12 mm camera at umbilicus or left subcostal mid-clavicular, 12 mm working port (for stapler) at left subcostal anterior axillary, 5 mm at left mid-clavicular subcostal, and 5 mm at left posterior axillary subcostal." : ""}The splenic flexure of the colon was mobilised by dividing the lateral attachments and reflecting medially. The splenocolic and lienorenal ligaments were divided sharply, mobilising the spleen toward the midline. The gastrosplenic ligament was opened with a vessel-sealing device, sequentially dividing the short gastric vessels (5-7 vessels typically), with care to avoid injury to the gastric wall (visible mucosa breach is repaired with seromuscular Lembert 3-0 silk).`,
      `The spleen was retracted laterally and the splenic hilum was exposed. The pancreatic tail was identified and protected — the tail extends within the lienorenal ligament in 30% of patients to within 1 cm of the splenic hilum, with iatrogenic pancreatic tail injury occurring in 1-3% of splenectomies (causing pancreatic fistula). The splenic artery was identified at the superior aspect of the hilum (typically anterior and superior to the splenic vein) and isolated. The splenic vein was identified inferior and posterior.`,
      `Splenic artery preliminary ligation (preferred for large spleens > 1 kg or significant splenomegaly to allow autotransfusion of splenic blood and reduce hilar bleeding during transection): the splenic artery was clipped or ligated with 2-0 silk at the superior pole of the hilum, sparing the splenic vein. The spleen visibly contracted as 200-500 mL of blood autotransfused into circulation over 5-10 minutes, reducing hilar transection bleeding by 30-50%. The splenic hilum was then transected en bloc with a vascular load Endo GIA stapler (white load — 2.5 mm closed staple height for vascular structures), with care to leave at least 5 mm of vascular pedicle distal to the stapler line for a backup ligature if needed. Alternative: individual ligation of artery and vein with 2-0 silk for the open approach.`,
      `Accessory spleen search: a systematic search was performed for accessory spleens (present in 15-30% of patients — failure to remove accessory spleens is the most common cause of recurrent ITP after splenectomy). Locations searched in order: splenic hilum (most common, 50%), gastrosplenic ligament + greater omentum (25%), tail of pancreas + splenocolic ligament (10%), small bowel mesentery + presacral region (10%), pelvis + adnexa in females (5%). Any identified accessory spleens were removed and submitted as separately labelled specimens.`,
      `${isLap ? "The spleen was placed in a heavy-duty 15 mm Endo Catch bag (Inzii, Roeder, or LapSac — note the bag must be intact and morcellation-rated; standard Endo Catch bags can rupture during morcellation). The neck of the bag was exteriorised through the 12 mm port site and the spleen morcellated within the bag using ring forceps, taking care not to puncture the bag (splenic tissue spillage causes splenosis with possible recurrence of ITP)." : "The spleen was removed intact through the open incision."} The splenic bed was inspected and confirmed hemostatic with insufflation pressure briefly reduced to 8 mmHg. The pancreatic tail was inspected for any thermal injury or capsular violation. A 19 Fr Blake drain was placed in the splenic bed only for cases with extensive pancreatic tail dissection or oozing bed; routine drainage was not performed for elective splenectomy.`,
      `Closure: ${isLap ? "12 mm port site fascia closed with 0 Vicryl Carter-Thomason; 5 mm at skin with 4-0 Monocryl; pneumoperitoneum released" : "midline closed with running 1 PDS; subcutaneous 3-0 Vicryl; skin staples or 4-0 Monocryl"}. Postop pathway: clear liquids POD 0, advance per ERAS. Routine perioperative platelet count for ITP. Counseling reinforced: lifelong post-splenectomy sepsis (OPSI) risk; on-demand antibiotic prescription (amoxicillin-clavulanate or levofloxacin) for any febrile illness; medical alert bracelet; vaccinations; travel precautions (yellow fever vaccine contraindicated in some asplenic patients). For ITP: platelet response monitored at 6 weeks, 3 months, 6 months — durable response in 60-80%.`,
    ];
  }

  if (includesAny(name, ["small bowel resection", "sbr", "enterectomy"])) {
    return [
      `Indication was reviewed and confirmed: small bowel obstruction requiring resection (failed conservative management with adhesive SBO, closed-loop obstruction, mass-effect tumor, intussusception), Crohn's disease with stricture or fistula, mesenteric ischemia with non-viable bowel (visible necrosis with negative second-look planned), bowel tumor (carcinoid, lymphoma, GIST, adenocarcinoma), Meckel's diverticulum with complications, traumatic injury. Preoperative workup reviewed: CT/CTE imaging, endoscopy/balloon enteroscopy if applicable, nutritional status (consider TPN if NBM > 7 days). Antibiotic prophylaxis (cefazolin 2 g + metronidazole 500 mg IV) given.`,
      `The patient was positioned supine. ${c.surgicalApproach === "OPEN" ? "A midline laparotomy incision was made and the abdomen entered." : "Pneumoperitoneum was established to 15 mmHg via Veress or Hasson at the umbilicus. Four ports were placed: 12 mm umbilical (camera), 5 mm right and left lower quadrants, and 12 mm left lower quadrant (for stapler). Steep Trendelenburg + reverse rotation as needed."} A systematic abdominal exploration was performed.`,
      `The small bowel was systematically run from the ligament of Treitz to the ileocecal valve, with 'walking the bowel' between two atraumatic graspers (alternating proximal and distal). The diseased segment was identified — its location was characterised: distance from ligament of Treitz [__] cm, distance from ileocecal valve [__] cm, length of diseased bowel [__] cm. The proximal and distal margins of the resection were marked at healthy bowel — for malignancy, oncologic margins of 5-10 cm proximal and distal; for Crohn's, only the diseased segment plus 2 cm of healthy bowel (preserve length); for ischemia, the resection extended back to clearly viable, well-perfused bowel with peristalsis (Doppler signal in the mesenteric arcade, fluorescein angiography, or ICG fluorescence imaging confirmed perfusion).`,
      `The mesentery was divided in a V-shape between the marked transection points, working from the bowel inward. For benign disease (Crohn's, adhesions): the mesenteric division was kept close to the bowel to minimise lymphatic and short-segment vessel sacrifice. For malignancy: the mesenteric division extended to the SMA at the base of the mesentery for adequate lymph node yield (≥ 12 nodes per AJCC). Mesenteric vessels were controlled with vessel-sealing device (LigaSure, Harmonic) for short pedicles or sequential ligatures with 2-0 silk for longer pedicles.`,
      `The bowel was transected proximally and distally with linear staplers — 60 mm Endo GIA white or blue load (2.5 or 3.5 mm closed staple height) for normal-thickness small bowel. Care was taken to ensure the staple line was perpendicular to the long axis of the bowel and on healthy, well-vascularised tissue. The specimen was passed off and inspected (location of pathology, margin distances grossly clear).`,
      `Anastomosis: a side-to-side functional end-to-end stapled anastomosis was created (preferred technique per multiple meta-analyses — lower stricture rate and faster operative time than end-to-end handsewn). The two bowel ends were aligned antimesentericly. A small enterotomy was made on the antimesenteric border of each end, 3-4 cm from the staple line. A 60 mm Endo GIA white/blue load was placed through the enterotomies with one jaw in each bowel limb and fired to create the back wall of the anastomosis. The common enterotomy was closed with a second linear stapler firing (transverse closure to avoid narrowing) or with hand-sewn 3-0 Vicryl in two layers (Connell + Lembert).`,
      `Anastomosis inspection: patency was confirmed by passing a finger through the lumen (anastomosis should easily admit 2-3 fingerbreadths). Hemostasis of the staple line was confirmed by direct visualisation. The bowel was inspected for proper orientation — no twisting, no kinking, no Roux malposition. Mesentery was reapproximated with running 3-0 silk to prevent internal hernia (especially important for Crohn's resections and laparoscopic procedures). Hand-sewn anastomosis is alternative for Crohn's strictures with thickened mesentery, distal ileal anastomoses adjacent to ileocecal valve (preferring tapered handsewn over stapled), or in patients on chemotherapy with concern for tissue quality.`,
      `${c.surgicalApproach !== "OPEN" ? "The specimen was placed in an Endo Catch bag and removed through the umbilical port (extended to 4-5 cm). Pneumoperitoneum released. 12 mm fascia closed with 0 Vicryl Carter-Thomason." : "The midline was closed in standard fashion: fascia with running #1 PDS or looped 1 Vicryl, subcutaneous 3-0 Vicryl, skin with 4-0 Monocryl subcuticular or staples."} Postop ERAS pathway: clear liquids POD 0 with progression as tolerated, NG tube only for ileus, early ambulation, multimodal analgesia. Anticipate return of bowel function POD 2-4. Specimen sent for pathology with margin orientation. Long-term: surveillance per indication (Crohn's — biologic therapy resumption, surveillance colonoscopy; cancer — adjuvant therapy if appropriate, oncology follow-up, surveillance imaging).`,
    ];
  }

  if (includesAny(name, ["abscess drainage", "i&d abdominal", "intraabdominal abscess"])) {
    return [
      `Preoperative workup was reviewed: CT-confirmed abscess location, size, and proximity to organs / vessels; etiology (postoperative leak, perforated viscus, diverticular abscess, appendiceal abscess, tubo-ovarian abscess, Crohn's-related, hepatic abscess, splenic abscess); coexisting source pathology requiring management. The choice of drainage approach was guided by abscess characteristics: percutaneous IR drainage for accessible unilocular collections > 4 cm — first-line for diverticular and appendiceal abscesses (Hinchey II), allowing 'cool-down' before interval surgical management; surgical drainage for multilocular collections, abscesses inaccessible to percutaneous drainage, abscesses with associated source requiring surgical management (free perforation, fistula), or failed percutaneous drainage. Antibiotic prophylaxis was tailored to the suspected pathogen and continued therapeutically: piperacillin-tazobactam, ceftriaxone + metronidazole, or per local antibiogram.`,
      `${name.includes("percutaneous") || name.includes("ir") ? "Percutaneous image-guided drainage: under CT or ultrasound guidance, the optimal trajectory was planned avoiding bowel, vessels, and pleura. Local anesthesia (1% lidocaine) was infiltrated. A 22 Fr trochar or Seldinger-technique pigtail catheter (8-14 Fr) was advanced into the cavity and the contents aspirated. Cultures were sent (aerobic + anaerobic + fungal + AFB if indicated). The drain was secured with a stitch and connected to a closed drainage system." : "Surgical drainage: the patient was positioned supine. The cavity was approached through the most direct route — extension of a previous incision, fresh laparotomy, or laparoscopic approach. The peritoneal cavity was entered and the abdomen explored with attention to identifying any source pathology."} Whatever the approach, the cavity was unroofed and the contents widely evacuated. Cultures were sent for gram stain, aerobic + anaerobic culture and sensitivity, and acid-fast or fungal stains when appropriate.`,
      `The cavity was irrigated copiously with warm saline (3-5 L) until the effluent ran clear. Loculations within the cavity were broken down with finger fracture or gentle blunt dissection. The cavity walls were systematically inspected for: residual loculations or daughter abscesses; the source of the abscess (perforation, fistula, foreign body, prior staple line); evidence of unsuspected pathology (tumor, fistula). Source control was performed when feasible: closure of small perforations with two-layer 3-0 Vicryl + omental patch (Graham patch); resection of perforated viscus when extensive (Hartmann's for sigmoid perforation); removal of foreign body; primary repair of fistula tract.`,
      `Drain selection and placement: a [Penrose × 1-2 / 19 Fr Blake / 14 Fr pigtail] drain was positioned dependently within the cavity, with the drain tip in the most dependent portion to allow gravity drainage. Multiple drains may be needed for large or multilocular cavities. The drain was brought out through a separate stab incision distant from the main wound (reduces wound infection rate). The drain was secured to the skin with 2-0 silk anchor stitch and connected to: closed drainage (Jackson-Pratt bulb suction) for cavity drainage favoring gentle suction; gravity drainage for fistula or anastomotic leak collections; or wide-open Penrose drainage for highly contaminated cavities.`,
      `Wound management: for highly contaminated cavities (Class III or IV — feculent, purulent, fistula-associated), the wound was left open with negative pressure dressing (wound VAC) for delayed primary closure or healing by secondary intention; alternatively, the deep layers were closed with delayed primary closure technique. For clean-contaminated drainage (Class II), primary skin closure with prophylactic antibiotic-impregnated suture and standard wound care was acceptable.`,
      `Postoperative management: drain output was tracked daily (volume, character — purulent vs serous vs feculent). Drains were removed when output was < 30 mL/day for 2-3 consecutive days, when imaging confirmed cavity collapse, or when output became non-productive. Antibiotics were continued per culture results, typically 7-14 days for uncomplicated abscess. Persistent drainage or rising output prompted CT imaging to assess for re-accumulation. Source control failure (persistent leak, fistula formation) required interventional management. Discharge home was planned with home health for drain management, return precautions for fevers > 38.5°C, increasing pain, or change in drain character.`,
    ];
  }

  if (includesAny(name, ["diagnostic laparoscopy", "exploratory laparotomy", "ex lap"])) {
    const isLap = c.surgicalApproach !== "OPEN" && !name.includes("laparotomy");
    return [
      `The indication for exploration was reviewed: acute abdomen of uncertain etiology (high suspicion for surgical pathology with non-diagnostic imaging), suspected perforation with peritonitis, suspected mesenteric ischemia (high lactate + abdominal pain out of proportion to exam), staging for malignancy, traumatic injury (blunt or penetrating with positive FAST or CT findings), recurrent pain post-surgery (adhesions, internal hernia), or chronic pelvic pain workup. Hemodynamic stability was assessed — unstable patients required immediate exploration without delay; stable patients had OR resources mobilised. Antibiotic prophylaxis (broad-spectrum: piperacillin-tazobactam or cefoxitin) was administered. Type and screen / cross-match was confirmed.`,
      `The patient was positioned supine with arms tucked. ${isLap ? "Pneumoperitoneum was established to 15 mmHg via Veress at Palmer's point (preferred for prior abdominal surgery) or Hasson at the umbilicus." : "A midline laparotomy incision was made from xiphoid to pubis (or limited to the area of suspected pathology, with extension as needed). The abdomen was entered sharply through the linea alba."}`,
      `${isLap ? "Three ports were placed initially under direct vision (umbilical 12 mm camera + two 5 mm working ports in the lower quadrants), with additional ports added as needed based on findings. " : ""}A systematic abdominal exploration was performed in a standardised sequence to avoid missed pathology: (1) Right upper quadrant — liver surfaces (palpation for masses, capsular tears, abscesses), gallbladder, falciform ligament, right diaphragm; (2) Left upper quadrant — spleen, left diaphragm, splenic flexure of colon; (3) Stomach — anterior surface, posterior surface (via lesser sac through gastrohepatic ligament), GE junction, pylorus; (4) Duodenum — first to fourth portions, with Kocher maneuver if posterior pathology suspected; (5) Small bowel — running from ligament of Treitz to ileocecal valve, examining proximal-to-distal serosa for mass, perforation, stricture, ischemia, or foreign body; (6) Colon — cecum, ascending, transverse, descending, sigmoid, with examination for tumors, perforation, ischemia, or volvulus; (7) Pelvis — bladder, uterus + adnexa (women), prostate (men), pelvic peritoneum; (8) Retroperitoneum — kidneys, adrenals, great vessels (via lateral peritoneal reflection if pathology suspected); (9) Mesentery and lymph nodes — palpated for masses or adenopathy.`,
      `Findings were systematically documented and photographed. Specific maneuvers based on findings: peritoneal fluid was characterised (clear straw-coloured normal vs cloudy infected vs hemoperitoneum vs feculent perforation vs bilious vs chylous) and submitted for cytology + gram stain + culture; biopsies of suspicious tissue were taken and sent for permanent + frozen as appropriate; intraoperative ultrasound was used for liver lesion characterisation when needed.`,
      `If pathology was identified, definitive management was performed in the same setting when feasible: appendectomy for acute appendicitis, diverticulectomy or sigmoid colectomy for diverticulitis, repair of perforation with Graham patch or resection for perforated peptic ulcer, adhesiolysis for SBO, ovarian cystectomy for adnexal mass, cholecystectomy for gallstone disease. For findings beyond the operator's scope or expertise (vascular injury, complex hepatobiliary pathology, advanced malignancy requiring multidisciplinary input): the case was paused, appropriate consultations called in, and the patient stabilised pending definitive management.`,
      `If no pathology was identified (negative exploration ~5-10% of cases): a focused biopsy of any suspicious area was performed; peritoneal washings were collected; documentation included thorough description of normal anatomy at each examined site; the abdomen was irrigated and closed.`,
      `${isLap ? "Pneumoperitoneum was released and ports removed under direct vision. 12 mm port fascia closed with 0 Vicryl Carter-Thomason; 5 mm closed at skin with 4-0 Monocryl subcuticular." : "Closure: fascia with running #1 PDS or 1 looped Vicryl; subcutaneous tissue with 3-0 Vicryl; skin with staples or 4-0 Monocryl. Drains placed dependently for contaminated cases."} Postop monitoring per findings — surgical floor for benign findings, ICU for severe peritonitis or hemodynamic compromise. Empiric broad-spectrum antibiotics continued therapeutically per culture results; tailored to source pathology.`,
    ];
  }

  // Generic fallback — still better than the placeholder list
  return [
    `The operative field was exposed and the relevant anatomy identified. Key structures were dissected free and controlled. The ${c.procedureName} was performed in standard fashion, with attention to anatomic planes, hemostasis, and preservation of adjacent structures. [Expand with procedure-specific technical steps.]`,
    ``,
  ];
}

export function generalSurgeryBody(c: CaseLog): string[] {
  const open = c.surgicalApproach === "OPEN";
  const preamble = open
    ? laparotomyPreamble(c, "midline")
    : laparoscopicPreamble(c, {
        ports: [
          "5 mm subxiphoid",
          "5 mm right mid-clavicular",
          "5 mm right anterior axillary (for lap chole)",
          "[additional ports as dictated by the procedure]",
        ],
      });
  const steps = generalSurgeryOpSteps(c);
  const closure = open ? standardOpenClosure() : standardLapClosure();
  return [...preamble, ...steps, ...closure];
}
