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
    return [
      `Pneumoperitoneum was established and ports were placed (Hasson 10 mm subxiphoid + 5 mm × 4 in upper abdomen for retraction). The liver was retracted to expose the GE junction. The hiatal hernia sac was reduced into the abdomen.`,
      `The pars flaccida was opened and the right crus was identified. The phrenoesophageal ligament was incised and the esophagus was circumferentially mobilised, with both vagi identified and preserved.`,
      `Short gastric vessels were divided with a vessel-sealing device along the greater curvature to mobilise the fundus completely. A retroesophageal window was created.`,
      `The crura were re-approximated posteriorly with interrupted 0 Ethibond sutures, sized so a 56 Fr bougie passed without resistance. The fundus was passed posterior to the esophagus and a [Nissen 360° / Toupet 270°] wrap was constructed with three interrupted sutures incorporating partial-thickness esophageal bites and the right and left limbs of the wrap.`,
      `The bougie was withdrawn and the wrap re-inspected. Pneumoperitoneum was released and the ports closed.`,
    ];
  }

  if (includesAny(name, ["sleeve gastrectomy", "vsg", "lsg"])) {
    return [
      `Pneumoperitoneum was established and ports placed (12 mm supraumbilical + 5 mm × 3 + 5 mm Nathanson for liver retraction). The liver was elevated.`,
      `The greater curvature was mobilised from approximately 4–6 cm proximal to the pylorus up to the angle of His using a vessel-sealing device, dividing the short gastric vessels and posterior gastric attachments.`,
      `A 36 Fr orogastric bougie was passed by anaesthesia and positioned along the lesser curvature against the pyloric channel. A series of Endo GIA staple firings (green/black/buttressed) were used to create the sleeve, beginning [__ cm] proximal to the pylorus and ending [__ cm] lateral to the angle of His.`,
      `The staple line was inspected for hemostasis and reinforced with bipolar cautery / oversewn with 3-0 Vicryl as needed. A methylene blue leak test was performed and was negative.`,
      `The resected stomach was placed in an Endo Catch bag and removed through the supraumbilical port. The fascia was closed with 0 Vicryl figure-of-eight and the skin with 4-0 Monocryl subcuticular.`,
    ];
  }

  if (includesAny(name, ["roux-en-y", "rygb", "gastric bypass"])) {
    return [
      `Pneumoperitoneum was established and 5–6 ports placed (12 mm supraumbilical + 12 mm right paramedian + 5 mm × 3 + Nathanson). The liver was retracted.`,
      `A small (~25 mL) gastric pouch was created with sequential Endo GIA firings beginning at the lesser curvature distal to the angle of His and extending towards the angle of His, fully transecting the stomach.`,
      `The ligament of Treitz was identified and a Roux limb of [100–150 cm] was measured. A jejunojejunostomy was created stapled side-to-side with a 60 mm white load, and the common enterotomy closed with running 3-0 Vicryl. The biliopancreatic limb was [50–100 cm].`,
      `The Roux limb was brought [antecolic / retrocolic] up to the gastric pouch. A stapled gastrojejunostomy was created using a [12 mm] EEA stapler with the anvil pre-placed transorally, or with a linear-stapled technique (60 mm blue load + handsewn closure).`,
      `Petersen's defect and the mesenteric defect were closed with non-absorbable 0 Ethibond running suture to prevent internal hernia. A methylene blue leak test or upper endoscopy demonstrated no leak.`,
    ];
  }

  if (includesAny(name, ["splenectomy"]) && !includesAny(name, ["pancreat"])) {
    return [
      `Pneumoperitoneum was established and ports placed (laparoscopic) or a left subcostal/midline incision made (open). The patient was placed in right lateral decubitus for laparoscopic approach.`,
      `The splenic flexure of the colon was mobilised and reflected medially. The splenocolic and splenorenal ligaments were divided, then the gastrosplenic ligament with the short gastric vessels.`,
      `The splenic hilum was approached posteriorly. The splenic artery was ligated first (preferable to allow autotransfusion + reduce splenic blood flow), followed by the splenic vein with a vascular load Endo GIA. The pancreatic tail was identified and protected.`,
      `The spleen was placed in a heavy-duty Endo Catch bag and morcellated within the bag for laparoscopic extraction (or removed intact through the open incision). The bed was inspected for hemostasis. Routine search for accessory spleens was performed.`,
    ];
  }

  if (includesAny(name, ["small bowel resection", "sbr", "enterectomy"])) {
    return [
      `The abdomen was entered and explored. The diseased small bowel segment was identified and the proximal and distal margins were marked at healthy bowel.`,
      `The mesentery was divided in a V-shape between the marked transection points, controlling vessels with a vessel-sealing device or sequential ligatures.`,
      `The bowel was transected proximally and distally with an Endo GIA stapler (white/blue load). The specimen was passed off.`,
      `A side-to-side, functional end-to-end stapled anastomosis was created with a 60 mm white/blue load, and the common enterotomy closed with a second stapler firing or hand-sewn 3-0 Vicryl. The anastomosis was inspected for patency and hemostasis. The mesenteric defect was closed with running 3-0 silk.`,
    ];
  }

  if (includesAny(name, ["abscess drainage", "i&d abdominal", "intraabdominal abscess"])) {
    return [
      `The collection was approached [percutaneously under image guidance / transabdominally / via direct extension of a previous incision]. The cavity was unroofed and the contents widely evacuated and sent for culture.`,
      `The cavity was irrigated copiously with warm saline until the effluent ran clear. The cavity walls were inspected for residual loculations or unaddressed source pathology.`,
      `A [Penrose / 19 Fr Blake / pigtail] drain was positioned dependently within the cavity and brought out through a separate stab incision, secured to the skin with 2-0 silk.`,
    ];
  }

  if (includesAny(name, ["diagnostic laparoscopy", "exploratory laparotomy", "ex lap"])) {
    return [
      `Pneumoperitoneum was established (laparoscopic) or a midline incision made (open). The peritoneal cavity was entered.`,
      `Systematic exploration was performed: liver surfaces, gallbladder, stomach, duodenum, small bowel from the ligament of Treitz to the ileocecal valve, colon and rectum, bilateral adnexa (women), pelvic peritoneum, and retroperitoneum as accessible.`,
      `Findings were [documented] and intervention performed as appropriate.`,
      `The abdomen was irrigated and closed in standard fashion.`,
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
