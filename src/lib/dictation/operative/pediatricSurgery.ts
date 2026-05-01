import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import type { TopMatter } from "./types";
import {
  laparotomyPreamble,
  laparoscopicPreamble,
} from "../shared/preamble";
import {
  standardOpenClosure,
  standardLapClosure,
} from "../shared/closure";

// ---------------------------------------------------------------------------
// Pediatric Surgery — forced fields:
//   - Age and weight (weight-based dosing)
//   - Thermoregulation during case
//   - Pylorus dimensions for pyloromyotomy
//   - Sac integrity for hernia repairs
//   - Air-leak test when applicable
//   - Specific anatomic findings
//   - Feeding / activity plan
// ---------------------------------------------------------------------------

export function pediatricSurgeryTopMatter(c: CaseLog): TopMatter {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["pyloromyotomy"])) {
    return {
      anesthesia: "General endotracheal anesthesia; stomach decompressed preoperatively.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Extubated in the OR. Ad lib feeds started 4 hours postoperatively per pediatric surgery protocol. Discharge home when tolerating goal feeds without emesis.",
    };
  }

  if (includesAny(name, ["inguinal hernia", "high ligation"])) {
    return {
      anesthesia: "General anesthesia with caudal block for postoperative analgesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Hernia sac to pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Regular diet and activity per age. Return precautions for bulge, redness, or fever.",
    };
  }

  if (includesAny(name, ["orchidopexy"])) {
    return {
      anesthesia: "General anesthesia with caudal block.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Scrotal exam at 1 week and 3 months to confirm testicular position and viability.",
    };
  }

  if (includesAny(name, ["umbilical hernia"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "Hernia sac to pathology.",
      disposition: "The patient tolerated the procedure well. Discharge home the same day. Return precautions for fever or wound concerns.",
    };
  }

  if (includesAny(name, ["ladd", "malrotation"])) {
    return {
      anesthesia: "General endotracheal anesthesia.",
      ebl: "Minimal.",
      drains: "None.",
      specimens: "None (or ischemic bowel if resected).",
      disposition: "The patient tolerated the procedure well. Admitted for bowel rest and gradual advancement of feeds per pediatric surgery protocol.",
    };
  }

  if (includesAny(name, ["peg tube"])) {
    return {
      anesthesia: "General anesthesia.",
      ebl: "Minimal.",
      drains: "PEG tube in place to gravity drainage.",
      specimens: "None.",
      disposition: "The patient tolerated the procedure well. PEG feeds can be initiated 6 hours postoperatively. Site care teaching and follow-up scheduled.",
    };
  }

  // REVIEW: pediatric surgery attending sign-off needed before residents bill from these.
  if (includesAny(name, ["gastroschisis", "omphalocele"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central access.",
      ebl: "Approximately 50–150 ml.",
      drains: "None.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted to NICU. Plan: TPN until enteral feeds tolerated, watch for compartment syndrome and intestinal ischemia, ventilation as needed for primary closure pressures.",
    };
  }

  if (includesAny(name, ["nec", "necrotizing enterocolitis"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central access.",
      ebl: "Approximately 50–200 ml (variable).",
      drains: "Penrose drain optional in stoma site.",
      specimens: "Necrotic bowel + lymph nodes to pathology and culture.",
      disposition:
        "The patient tolerated the procedure well. Admitted to NICU on TPN, antibiotics, ventilation. Plan: stoma care, bowel rest, contrast study before reanastomosis at 6–12 weeks.",
    };
  }

  if (includesAny(name, ["congenital diaphragmatic hernia", "cdh", "bochdalek"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line, central access; HFOV / ECMO availability.",
      ebl: "Approximately 50–100 ml.",
      drains: "Chest tube to underwater seal.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted to NICU. Plan: gentle ventilation, permissive hypercapnia, pulmonary hypertension management with iNO/sildenafil, gradual feeding advancement.",
    };
  }

  if (includesAny(name, ["pectus", "nuss", "ravitch"])) {
    return {
      anesthesia: "General endotracheal anesthesia with thoracic epidural for pain management.",
      ebl: "Approximately 50–150 ml.",
      drains: "Chest tube on the side(s) of dissection × 24h.",
      specimens: "None.",
      disposition:
        "The patient tolerated the procedure well. Admitted for 3–5 days for pain management with thoracic epidural. Plan: incentive spirometry, gradual return to activity, bar removal at 2–3 years.",
    };
  }

  if (includesAny(name, ["wilms", "neuroblastoma", "pediatric tumor"])) {
    return {
      anesthesia: "General endotracheal anesthesia with arterial line and central access.",
      ebl: "Approximately 100–300 ml.",
      drains: "None routinely.",
      specimens: "Tumor specimen + regional lymph nodes oriented for pathology + tissue for biobank.",
      disposition:
        "The patient tolerated the procedure well. Admitted to PICU / surgical floor. Plan: postoperative pain management, advance diet as tolerated, oncology follow-up for adjuvant therapy.",
    };
  }

  if (includesAny(name, ["hirschsprung", "pull-through", "soave", "swenson", "duhamel"])) {
    return {
      anesthesia: "General endotracheal anesthesia with caudal block.",
      ebl: "Approximately 50–150 ml.",
      drains: "None routinely.",
      specimens: "Resected aganglionic bowel + transition zone for pathology + frozen sections.",
      disposition:
        "The patient tolerated the procedure well. Admitted for postoperative care. Plan: stool softeners, anal dilations starting at 2 weeks, follow-up for enterocolitis surveillance.",
    };
  }

  return {
    anesthesia: "General anesthesia.",
    ebl: "Minimal.",
    drains: "None.",
    specimens: "[Specimens or 'None'].",
    disposition: "The patient tolerated the procedure well. Postoperative plan per pediatric surgery protocol.",
  };
}

export function pediatricSurgeryFindings(c: CaseLog): string {
  const name = c.procedureName.toLowerCase();

  if (includesAny(name, ["pyloromyotomy"])) {
    return `Preoperative ultrasound demonstrated pyloric stenosis with a pyloric channel length of [__] mm and muscle thickness of [__] mm, consistent with the clinical presentation of projectile non-bilious emesis. Intraoperatively the pylorus was thickened, olive-shaped, and clearly demarcated from the antrum and duodenum. The seromuscular incision was carried through to the submucosal plane without mucosal breach. An air-leak test with instilled air via the OG tube confirmed intact mucosa. Infant thermoregulation was maintained throughout the case with forced-air warming.`;
  }

  if (includesAny(name, ["inguinal hernia", "high ligation"])) {
    return `A [left / right / bilateral] indirect inguinal hernia was identified with a thin-walled sac extending through the internal ring. The sac was dissected free of the cord structures without injury to the vas deferens or testicular vessels. High ligation was performed at the level of the internal ring. The cord structures were returned to the scrotum and the testis palpated to confirm normal position.`;
  }

  if (includesAny(name, ["orchidopexy"])) {
    return `A [left / right / bilateral] undescended testis was identified in the [inguinal canal / superficial ring / abdominal]. The testis was of [normal / atrophic] size and had [normal / short] gubernaculum. The vas deferens and spermatic vessels were mobilized to achieve tension-free descent into the dependent scrotum. The testis was fixed in a sub-dartos pouch without tension on the cord.`;
  }

  if (includesAny(name, ["umbilical hernia"])) {
    return `An umbilical fascial defect measuring approximately [__] cm was identified. The hernia sac contained [omentum / preperitoneal fat]. The contents were reduced and the fascial edges were healthy. Primary closure was achieved without tension.`;
  }

  if (includesAny(name, ["ladd", "malrotation"])) {
    return `Malrotation was confirmed with a narrow-based mesentery and duodenal obstruction by Ladd's bands. [No / Segmental] volvulus was present. The bowel was viable throughout. The Ladd's bands were divided, the mesentery was widened, and an incidental appendectomy was performed. The bowel was returned to the abdomen in non-rotation position.`;
  }

  // REVIEW: pediatric surgery attending sign-off needed
  if (includesAny(name, ["gastroschisis", "omphalocele"])) {
    return `${name.includes("gastroschisis") ? "Gastroschisis with herniated bowel +/- stomach through a defect to the right of the umbilicus, [edematous / inflamed / matted]" : "Omphalocele containing [bowel only / liver]; size [__] cm; covering membrane [intact / ruptured]"}. The herniated viscera were inspected and viable. Bowel anatomy was normal with no atresias / perforations. ${name.includes("gastroschisis") ? "Primary closure was [achievable / required silo placement and staged reduction]" : "Primary closure was [achievable / required staged closure with prosthetic patch and skin closure]"} based on intra-abdominal volume tolerance and ventilatory pressures.`;
  }

  if (includesAny(name, ["nec", "necrotizing enterocolitis"])) {
    return `Necrotising enterocolitis with [pneumatosis, portal venous gas, perforation] confirmed. Intraoperative findings: [__] cm of [duodenum/jejunum/ileum/colon] involved with [necrosis / pneumatosis / frank perforation]. Bowel viability assessed: [grossly necrotic segment requires resection; remaining bowel viable]. Total residual bowel length post-resection: [__] cm. ${includesAny(name, ["primary anastomosis"]) ? "Primary anastomosis performed." : "Stoma created; mucous fistula brought up adjacent."}`;
  }

  if (includesAny(name, ["congenital diaphragmatic hernia", "cdh", "bochdalek"])) {
    return `${name.includes("right") ? "Right" : "Left"}-sided Bochdalek-type CDH with herniation of [stomach / spleen / colon / small bowel] into the chest. Lung was [severely / moderately] hypoplastic. The diaphragmatic defect was [__] × [__] cm with [presence of / absence of] hernia sac. ${includesAny(name, ["patch"]) ? "Defect was too large for primary closure; a synthetic patch (Gore-Tex / PTFE) or muscle flap was used." : "Defect was closable primarily."}`;
  }

  if (includesAny(name, ["pectus", "nuss", "ravitch"])) {
    return `Pectus excavatum with Haller index of [__] confirmed preoperatively. Sternum was [moderately / severely] depressed with [symmetric / asymmetric] morphology. Cardiac compression was [absent / present] on preoperative echo. Costal cartilages were [normal / abnormal-deformed]. ${includesAny(name, ["nuss"]) ? "A pre-bent Lorenz pectus bar was passed beneath the sternum and rotated into corrective position with restoration of anterior chest contour." : "Affected costal cartilages were resected and the sternum osteotomized and stabilised in corrected position."}`;
  }

  if (includesAny(name, ["wilms", "neuroblastoma", "pediatric tumor"])) {
    return `${name.includes("wilms") ? "Wilms tumor" : name.includes("neuroblastoma") ? "Neuroblastoma" : "Pediatric tumor"} confirmed at [location] measuring [__] × [__] cm. There was no gross [contralateral involvement / vascular invasion / extracapsular extension on initial inspection]. ${name.includes("wilms") ? "Renal vein, IVC, and contralateral kidney were inspected; no thrombus identified." : "Tumor was [encasing / abutting] [vascular structure]; resectability was confirmed."} Regional lymph nodes were sampled / dissected for pathologic staging.`;
  }

  if (includesAny(name, ["hirschsprung", "pull-through", "soave", "swenson", "duhamel"])) {
    return `Hirschsprung disease confirmed by preoperative biopsy showing aganglionosis. Intraoperative seromuscular biopsies from sequential proximal levels confirmed transition zone at [rectosigmoid / sigmoid / descending colon]. Aganglionic segment length: [__] cm. Bowel proximal to transition zone was [moderately / severely] dilated. Distal aganglionic bowel was resected and ganglionic bowel was anastomosed [coloanally / Duhamel-style retrorectal pouch].`;
  }

  return `Intraoperative findings were consistent with the preoperative diagnosis. The patient tolerated the procedure well with stable vital signs and maintained thermoregulation throughout.`;
}

// ---------------------------------------------------------------------------
// Pediatric Surgery — procedure-specific operative steps.
// ---------------------------------------------------------------------------

function pedsOpSteps(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();

  // -- Pyloromyotomy ---------------------------------------------------------
  if (includesAny(name, ["pyloromyotomy", "ramstedt", "hypertrophic pyloric"])) {
    const isLap = c.surgicalApproach === "LAPAROSCOPIC";
    if (isLap) {
      return [
        `An umbilical 5 mm incision was made and pneumoperitoneum established to 8 mmHg with a blunt port. The camera was introduced. Two additional 3 mm stab incisions were made in the [right upper quadrant] for a grasper and in the epigastrium for the pyloromyotomy knife.`,
        `The hypertrophied pylorus was identified and stabilized with an atraumatic grasper at the duodenal end. A seromuscular incision was made along the avascular plane from just proximal to the pyloroduodenal junction to the gastric antrum.`,
        `A pyloromyotomy spreader was used to split the hypertrophic muscle down to the submucosa, taking care to avoid duodenal perforation. A leak test was performed by insufflating air through an orogastric tube; no leak was identified. Hemostasis was confirmed.`,
      ];
    }
    return [
      `A right upper quadrant transverse incision was made and carried down to the peritoneum. The pylorus was delivered into the wound and stabilized between the surgeon's fingers.`,
      `A seromuscular incision was made along the avascular plane from just proximal to the pyloroduodenal junction to the gastric antrum. A Benson spreader was used to split the hypertrophic muscle down to the submucosa with care taken to avoid duodenal perforation.`,
      `A leak test was performed by insufflating air through an orogastric tube; no leak was identified. The pylorus was returned to the abdomen. The wound was closed in layers with absorbable suture and skin glue.`,
    ];
  }

  // -- Inguinal hernia (pediatric) -------------------------------------------
  if (includesAny(name, ["pediatric inguinal", "high ligation", "indirect inguinal"])) {
    return [
      `A transverse inguinal crease incision was made and carried through Scarpa's fascia. The external oblique aponeurosis was exposed and opened in the line of its fibers, preserving the ilioinguinal nerve.`,
      `The cord structures were identified. The hernia sac was found anteromedial to the cord, isolated, and carefully separated from the vas deferens and gonadal vessels with microscopic attention in small children. The sac was traced to the internal ring.`,
      `The sac was opened to confirm its contents, twisted, and high-ligated at the internal ring with 3-0 Vicryl suture-ligature. The distal sac was left in situ. The contralateral side was examined laparoscopically through the sac as indicated.`,
      `The external oblique was closed with 4-0 Vicryl, Scarpa's with 5-0 Vicryl, and skin with 5-0 Monocryl subcuticular. Skin glue was applied.`,
    ];
  }

  // -- Orchidopexy / undescended testis --------------------------------------
  if (includesAny(name, ["orchidopexy", "undescended testis", "cryptorchidism"])) {
    return [
      `An inguinal incision was made over the inguinal canal. The external oblique was opened and the cord structures identified. The undescended testis was found in the [inguinal canal / high scrotum].`,
      `The testis was mobilized by dividing the gubernaculum and dissecting the processus vaginalis off the cord, then high-ligating it at the internal ring. The cord was further mobilized proximally to achieve adequate length for a tension-free scrotal placement.`,
      `A separate scrotal incision was made and a subdartos pouch developed. The testis was delivered into the pouch and secured with a 5-0 absorbable suture between the tunica albuginea and the dartos. The inguinal wound was closed in layers.`,
    ];
  }

  // -- Umbilical hernia ------------------------------------------------------
  if (includesAny(name, ["umbilical hernia"])) {
    return [
      `An infra-umbilical curvilinear incision was made and carried down to the fascia. The hernia sac was identified, dissected free circumferentially, and separated from the undersurface of the umbilical skin.`,
      `The sac was reduced into the abdomen. The fascial defect was closed transversely with interrupted 2-0 or 3-0 Vicryl sutures. The umbilical skin was tacked down to the fascia to prevent an umbilical depression, and the skin was closed with absorbable subcuticular sutures.`,
    ];
  }

  // -- Pediatric appendectomy ------------------------------------------------
  if (includesAny(name, ["pediatric appendectomy", "lap appy"]) && c.surgicalApproach === "LAPAROSCOPIC") {
    return [
      `A 5 mm umbilical port was placed via open Hasson technique. Pneumoperitoneum was established to [10-12] mmHg. Two additional 5 mm ports were placed in the [suprapubic / left lower quadrant] under direct visualization.`,
      `The abdomen was inspected. The cecum was identified and the appendix was found to be [inflamed / perforated with localized peritonitis]. The mesoappendix was divided with an energy device, and the base of the appendix was controlled with [Endoloop ligatures / endoscopic stapler] and transected.`,
      `The specimen was removed in an Endocatch bag. The right lower quadrant was irrigated and suctioned dry. Ports were removed under direct vision and closed in standard fashion.`,
    ];
  }

  // -- Malrotation / Ladd's procedure ----------------------------------------
  if (includesAny(name, ["ladd", "malrotation", "intestinal malrotation"])) {
    return [
      `A transverse supraumbilical incision was made and the abdomen entered. The bowel was eviscerated into the wound. Malrotation was confirmed with an abnormally placed cecum and short narrow mesenteric base.`,
      `If volvulus was present, the bowel was de-rotated in a counter-clockwise direction until the base of the mesentery was straightened. Ladd's bands were identified overlying the duodenum and were sharply divided, freeing the duodenum from the colon.`,
      `The mesenteric base was widened by spreading the peritoneum between the duodenum and cecum. An appendectomy was performed given the abnormal cecal position. The small bowel was placed on the right side of the abdomen and the colon on the left in a non-rotation configuration.`,
      `The bowel was returned to the abdomen and the wound was closed in layers.`,
    ];
  }

  // -- Intussusception reduction ---------------------------------------------
  if (includesAny(name, ["intussusception"])) {
    return [
      `After a failed / contraindicated air or contrast enema, a right lower quadrant transverse incision was made and the abdomen entered. The ileocolic intussusception was identified and delivered into the wound.`,
      `Gentle milking pressure was applied to the distal lead point in a retrograde fashion, reducing the intussusception progressively through the ileocecal valve. The bowel was carefully inspected for viability; no evidence of ischemia or perforation was identified, and an incidental appendectomy was performed.`,
      `The bowel was returned to the abdomen and the wound closed in layers.`,
    ];
  }

  // -- Circumcision (pediatric) ----------------------------------------------
  if (includesAny(name, ["circumcision"])) {
    return [
      `A dorsal penile nerve block was performed. The foreskin was retracted and any preputial adhesions bluntly divided. The coronal margin was marked.`,
      `A [Gomco / Plastibell / Mogen] clamp was applied to the foreskin over the glans, ensuring no glans tissue was entrapped. The clamp was tightened and the excess foreskin was excised. The clamp was removed and hemostasis confirmed.`,
      `Petroleum gauze was applied. Parents were educated on diaper and wound care.`,
    ];
  }

  // -- G-tube insertion ------------------------------------------------------
  if (includesAny(name, ["gastrostomy", "g-tube", "peg tube"])) {
    return [
      `Gastroscopy was performed via the orogastric route and the stomach insufflated. The anterior abdominal wall was trans-illuminated and an appropriate site was selected in the left upper quadrant, confirmed by one-to-one finger indentation visible endoscopically.`,
      `The skin was prepped and a small stab incision was made at the selected site. A trocar and sheath were inserted into the stomach under endoscopic visualization. A guidewire was passed through the sheath into the stomach and grasped with an endoscopic snare.`,
      `The wire was pulled out through the mouth. A PEG tube was attached and pulled back antegrade through the esophagus and stomach until its internal bolster seated gently against the gastric mucosa. The external bolster was secured without excessive tension.`,
      `Endoscopy confirmed correct position of the internal bolster without tension. The tube was flushed with saline to confirm patency.`,
    ];
  }

  // -- Gastroschisis / omphalocele closure -----------------------------------
  if (includesAny(name, ["gastroschisis", "omphalocele"])) {
    return [
      `The neonate was transferred to the operating room within 60-90 minutes of delivery (for gastroschisis), with the eviscerated bowel kept moist with warm saline-soaked gauze and protected from heat loss using a sterile bowel bag from the time of delivery. The neonate was placed supine on a radiant warmer with continuous core temperature monitoring (preventing hypothermia is critical in neonatal surgery), with arterial line, central venous access, and orogastric tube placed by the anaesthesia team.`,
      `${name.includes("gastroschisis") ? "The gastroschisis defect was inspected: a 2-4 cm paraumbilical full-thickness abdominal wall defect typically located to the right of the umbilical cord, with no covering peritoneum. The eviscerated bowel — including small bowel, often stomach, and occasionally other viscera — was carefully examined. The bowel was assessed for: peel (matted appearance from chemical peritonitis), atresia (most commonly jejunal or ileal), perforation, and viability. Manual bowel decompression was performed by milking from the stomach to the most distal portion to reduce volume." : "The omphalocele was inspected: a midline abdominal wall defect with intact covering membrane (amnion-Wharton's jelly-peritoneum) containing herniated viscera with the umbilical cord inserting at the apex. The defect was sized — small (<4 cm), giant (≥4 cm and containing liver). The covering sac was assessed for integrity. The umbilical cord and umbilical vessels (single umbilical artery in 20%, two arteries and one vein typically) were identified and preserved during sac excision."}`,
      `Bowel viability and continuity were systematically assessed from the ligament of Treitz to the rectum. ${name.includes("gastroschisis") ? "The right paramedian fascial defect was widened slightly with a single 1-cm cephalic extension if needed to permit reduction; over-widening compromises the abdominal wall reconstruction. The umbilical cord was preserved at the natural cord insertion (left of the defect). " : "The covering sac was sharply excised at the skin-amnion junction, preserving the umbilical vessels for division and ligation. The umbilical vein was used as a future infusion route in selected cases prior to its ligation. "}`,
      `Reduction was attempted by gentle manipulation of bowel back into the abdominal cavity, sequentially from cephalad-most loops to caudal. During reduction, intra-abdominal pressure was continuously monitored using bladder pressure (>20 mmHg suggests abdominal compartment syndrome), peak inspiratory pressure (PIP rise >5 cm H2O over baseline indicates ventilatory compromise), and inferior vena caval blood flow assessed by femoral pulses and urine output. The decision tree was: if reduction was feasible without compromising any of these parameters, primary closure proceeded; if any parameter was compromised, staged closure was elected.`,
      `${includesAny(name, ["silo"]) ? "Staged closure was elected: a preformed Silastic Silo (Bentec or similar) of appropriate size was placed circumferentially around the eviscerated bowel and secured to the fascial edges with 4-0 Vicryl. The silo was hung from the radiant warmer canopy; bowel was gradually reduced into the abdomen over 3-7 days by sequentially tightening sutures or applying umbilical tape ligatures, with daily reduction checks until the silo was empty. Definitive closure was then performed at the bedside or in the OR." : "Primary closure was performed: the fascia was closed using interrupted 3-0 PDS sutures placed approximately 5 mm apart, taking care to invert any redundant peritoneum. The skin was closed using 4-0 Monocryl subcuticular running suture, with placement of an umbilicoplasty using the umbilical stalk to create a cosmetically acceptable umbilicus when feasible. Closure was performed without excessive tension."}`,
      `Final intra-abdominal pressure was confirmed within acceptable range (<20 mmHg via bladder pressure, no significant rise in PIP, palpable femoral pulses). The neonate was returned to the NICU on appropriate ventilatory support, with anticipated transition to total parenteral nutrition until enteral feeds could be advanced (typically delayed 2-3 weeks for gastroschisis until peristalsis returns, and 7-10 days for omphalocele). Surveillance for short bowel syndrome and necrotising enterocolitis was instituted.`,
    ];
  }

  // -- NEC laparotomy --------------------------------------------------------
  if (includesAny(name, ["nec", "necrotizing enterocolitis"])) {
    return [
      `The neonate was transferred to the operating room or operated on at the bedside in the NICU depending on hemodynamic stability. Continuous core temperature monitoring was instituted via radiant warmer or warmed isolette to prevent intraoperative hypothermia. Arterial line and central venous access were confirmed in place. Broad-spectrum antibiotics (typically ampicillin, gentamicin, and metronidazole or piperacillin-tazobactam) had been initiated preoperatively. The abdomen was prepped with chlorhexidine and draped to allow access from the xiphoid to the pubis.`,
      `A transverse supraumbilical incision was made (Kanani's incision) extending from the lateral border of one rectus abdominis muscle to the other, approximately 2-3 cm above the umbilicus. This incision provided optimal access to the entire small bowel and colon while avoiding the umbilical vein for future TPN access. The incision was deepened through the subcutaneous tissue, both anterior rectus sheaths, the rectus muscles (split or transected as needed), and the peritoneum. Free peritoneal fluid was encountered upon entry — its character was documented (serosanguinous, feculent, frankly purulent, or clear) and a sample was sent for Gram stain and aerobic + anaerobic culture.`,
      `A systematic exploration was performed from the ligament of Treitz to the rectum. The bowel was inspected for the four characteristic NEC findings: pneumatosis intestinalis (gas within the bowel wall, palpable as crackling or "bubble wrap" feel), portal venous gas (visible in mesenteric vessels), full-thickness necrosis (segmental dusky/black bowel), and perforation (free perforation site). Each affected segment was characterised: location, length of involvement, viability assessment, and contiguity. The "pan-NEC" or "totalis" form (>75% bowel involvement) was distinguished from focal disease, as it carries a much different prognosis.`,
      `Bowel viability assessment was performed using clinical signs (color, peristalsis, mesenteric pulse) and pharmacologic evaluation (warm saline irrigation, papaverine application). Marginally viable segments were noted for second-look planning. The principle of "minimal resection, maximum bowel preservation" guided the operation — every centimeter of viable bowel preserved is meaningful in a neonate where total bowel length is only 200-300 cm and short bowel syndrome is a devastating complication.`,
      `${includesAny(name, ["primary anastomosis"]) ? "Primary anastomosis was elected (Bell stage IIIa with localised disease and stable patient): the necrotic segment was resected with healthy margins on each side. End-to-end primary anastomosis was created using interrupted 5-0 or 6-0 PDS sutures placed in single-layer Lembert technique, ensuring water-tight seromuscular apposition and mucosal alignment. The mesenteric defect was closed with running 6-0 Vicryl. The anastomosis was tested by gentle saline irrigation through the proximal end." : "Stoma creation was elected (more common, especially for extensive disease or unstable patients): the most necrotic segment was resected. The proximal end was matured as an end stoma at the surgeon's preferred site (usually right paramedian for ileostomy, left for colostomy), with full-thickness everted mucosa-to-skin sutures using interrupted 4-0 Vicryl. The distal end was brought up adjacent as a mucous fistula and similarly matured (ensuring future stoma closure access), or closed and tagged with a long suture for future identification (Hartmann-style)."}`,
      `${includesAny(name, ["clip and drop", "second look"]) ? "Second-look laparotomy was planned given marginal bowel viability: marginally viable segments were left intact (clip-and-drop technique using staple lines or sutures to close marginally affected ends, then dropping these back into the abdomen) for re-evaluation in 24-48 hours when demarcation between viable and non-viable bowel becomes clearer. " : ""}The abdomen was irrigated with 200 mL of warm saline. ${includesAny(name, ["second look"]) ? "Temporary abdominal closure was performed using a Bogota bag (sterile IV bag), VAC dressing, or running monocryl skin-only closure for planned re-exploration." : "Final closure was performed: fascia with interrupted 3-0 PDS, skin with 4-0 Monocryl subcuticular. In contaminated cases, the skin was left open for delayed primary closure or healing by secondary intention."}`,
      `The neonate was returned to the NICU. Postoperative care included continued bowel rest with TPN, broad-spectrum antibiotics for 7-14 days based on culture results, NG decompression, ventilatory support as needed, vasopressors for septic shock, serial abdominal exams and imaging to detect recurrence or stricture, and gradual enteral feed advancement once peristalsis returned and the patient was clinically improving. Stoma care was initiated by the wound-ostomy nurses. Reanastomosis was scheduled at 6-12 weeks based on patient growth and clinical status, with preoperative contrast study to assess distal bowel patency.`,
    ];
  }

  // -- CDH repair ------------------------------------------------------------
  if (includesAny(name, ["congenital diaphragmatic hernia", "cdh", "bochdalek"])) {
    return [
      `The neonate was prepared in the OR or operating-room-NICU after stabilisation on appropriate ventilation (high-frequency oscillatory ventilation or conventional gentle ventilation with permissive hypercapnia), pulmonary hypertension management (inhaled nitric oxide, sildenafil), and arterial/central access. Hemodynamic stability had been achieved (preductal SpO2 >85%, MAP >40 mmHg, lactate <5). ECMO availability was confirmed. The patient was positioned supine for an abdominal approach (preferred for left-sided CDH and for unstable patients) or in lateral decubitus for a thoracoscopic approach (selected stable patients with smaller defects).`,
      `${name.includes("right") ? "A right" : "A left"} subcostal incision was made approximately 2 cm below the costal margin, extending from the midline laterally for 4-5 cm. The incision was deepened through subcutaneous tissue, anterior rectus sheath, rectus and lateral oblique muscles, and the peritoneum was entered. Care was taken upon peritoneal entry, as bowel may be immediately subjacent.`,
      `The herniated viscera were systematically identified and assessed. ${name.includes("right") ? "For right-sided CDH (less common, ~15% of cases): the liver was the most commonly herniated organ, often with hepatic vasculature compromise; small bowel and right colon may also be present. Reduction was performed gently to avoid hepatic vascular injury, often requiring patience over several minutes." : "For left-sided CDH (most common, ~85%): the stomach was typically the most cephalad herniated organ, followed by spleen, transverse colon, small bowel loops, and occasionally the left lobe of liver. Each organ was carefully reduced into the abdomen in sequence, beginning with the most cephalad organs."} The abdominal cavity was assessed for adequate domain to receive the reduced viscera; congenital CDH abdomen is small ("scaphoid abdomen") and may not accommodate reduced contents.`,
      `Once the viscera were reduced, the diaphragmatic defect was inspected. The defect was characterised: location (posterolateral Bochdalek-type, retrosternal Morgagni-type, or central), size in cm × cm, presence or absence of a hernia sac (sac is present in ~20% of cases and aids primary closure), and the integrity of the surrounding diaphragmatic muscle. The lung was inspected: the ipsilateral lung is variably hypoplastic (the degree of hypoplasia is the most important prognostic factor), often appearing as a small, dense, dysmorphic structure unable to fill the chest cavity initially.`,
      `${includesAny(name, ["patch"]) ? "Patch repair was elected because the defect was too large for primary closure (typically >30% of the hemidiaphragm). A Gore-Tex (PTFE) or Surgisis biological patch was sized 1 cm larger than the defect in each direction. The patch was secured to the diaphragmatic edges and chest wall with interrupted non-absorbable sutures (2-0 Ethibond or Prolene), placing sutures through the chest wall musculature and tied externally over rib bolsters when sufficient diaphragmatic muscle was unavailable laterally. For very large defects: an alternative was a muscle flap repair using a rotational flap from the latissimus dorsi or transversus abdominis." : "Primary repair was performed because the defect was small with adequate surrounding diaphragm. The diaphragmatic edges were re-approximated using interrupted 2-0 Ethibond mattress sutures, taking 5-mm bites of healthy diaphragm on each side. Sutures were tied without tension. Posteriorly, the diaphragm was re-attached to the chest wall in cases where the posterior rim was deficient by passing sutures around adjacent ribs."}`,
      `A chest tube (typically 12-14 Fr Argyle Trocar) was placed in the affected hemithorax through a separate stab incision and connected to underwater seal — minimal or no suction was applied to avoid contralateral mediastinal shift in the setting of pulmonary hypoplasia. The abdomen was inspected for additional malformations (intestinal malrotation occurs in nearly all CDH cases — Ladd's procedure was performed if not already done). Hemostasis was confirmed.`,
      `Abdominal closure was challenging: the small abdominal domain often did not accommodate primary fascial closure. Options were exercised based on intraoperative pressure assessment: primary closure if pressure was acceptable; ventral hernia (skin-only closure leaving fascia open, with planned delayed fascial closure at 6-12 months); silastic silo with staged reduction if abdominal compartment syndrome was risked. The skin was closed with running 4-0 Monocryl subcuticular suture or staples, depending on closure approach. The neonate was returned to NICU on continued ventilation, pulmonary hypertension management, and gradual weaning over days to weeks.`,
    ];
  }

  // -- Pectus repair (Nuss / Ravitch) ----------------------------------------
  if (includesAny(name, ["pectus", "nuss", "ravitch"])) {
    if (includesAny(name, ["nuss"])) {
      return [
        `The patient was positioned supine with both arms abducted to 90° on padded arm boards. Standard ASA monitors plus arterial line, central access, and double-lumen intubation (or single-lumen with selective bronchial intubation) were placed by anesthesia. Continuous epidural anesthesia was placed for postoperative pain control. The chest was prepped from the neck to the umbilicus and from posterior axillary line to posterior axillary line bilaterally. The deepest point of the pectus deformity was marked, along with the proposed bar entry and exit sites at the lateral chest wall.`,
        `Two 2-3 cm lateral chest incisions were marked at the level of the deepest pectus deformity, in line with the planned bar pathway, typically along the midaxillary line at the 5th or 6th intercostal space. The incisions were infiltrated with 1% lidocaine with epinephrine. Subcutaneous tunnels were developed bilaterally from each lateral incision toward the sternum, working in the subcutaneous plane just superficial to the pectoralis major muscle, using a long curved hemostat or DeBakey forceps.`,
        `Thoracoscopy was established through a 5-mm port placed in the right midaxillary line, typically two intercostal spaces below the planned bar pathway. CO2 insufflation at 6-8 mmHg was used (low pressure to minimize hemodynamic compromise). The thorax was inspected: heart, great vessels, pleural space, and diaphragm were visualised. The right lung was selectively deflated for visualization. The pericardium and the inner surface of the sternum were identified.`,
        `A custom pectus introducer (Lorenz introducer) was passed through the right intercostal space at the level of the deformity, advanced beneath the sternum in the substernal mediastinal plane (between the pericardium and the posterior surface of the sternum), and brought out through the contralateral intercostal space. The pathway was carefully monitored under thoracoscopic visualisation throughout the entire passage, with frequent confirmation that the introducer remained in the substernal plane and away from the pericardium. Care was taken at the most critical moment when crossing the midline.`,
        `A pre-bent Lorenz pectus bar was selected matched to the patient's chest dimensions (chest circumference, intermammillary distance, and depth of pectus deformity). The bar was attached to the introducer using umbilical tape or a heavy silk tie. The introducer was carefully retracted, pulling the bar across the mediastinum into position. Once the bar was in place, it was rotated 180° using a Lorenz Flipper instrument, elevating the sternum into corrected anterior position. Sternal correction was confirmed visually and by palpation.`,
        `The bar was secured to the chest wall to prevent migration. Lateral stabilisers were attached to each end of the bar and secured to the underlying ribs using #5 Ethibond suture passed around the rib through small incisions in the intercostal muscles. For complex deformities or older patients with rigid chests, a second pectus bar was placed cranially or caudally to the first bar in a similar manner for additional sternal elevation and stability. Pleural drains were typically not required (or a small Blake drain was placed temporarily). Lateral incisions were closed in layers: subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular. Bar removal was scheduled at 2-3 years.`,
      ];
    }
    return [
      `The patient was positioned supine with arms tucked at the sides. A vertical or transverse anterior chest incision was made in the midline, extending from approximately 2 cm above the level of the deformity to 2 cm below. The incision was deepened through subcutaneous tissue. The pectoralis major muscles were identified and elevated bilaterally as flaps off the underlying costal cartilages and sternum, exposing the deformed costal cartilages.`,
      `The deformed costal cartilages (typically 3rd through 6th or 3rd through 7th bilaterally) were systematically resected subperichondrially. The perichondrium was incised longitudinally over each affected cartilage, then elevated meticulously to free the perichondrial sleeve from the underlying cartilage. The cartilage was then resected entirely, preserving the perichondrial sleeve completely intact — this is critical because new cartilage will regrow within the perichondrial tube, restoring chest wall stability.`,
      `A transverse osteotomy of the sternum was performed at the level of maximum deformity using an oscillating saw, taking care not to penetrate the posterior cortex completely. The osteotomy created a hinge that allowed the lower sternum to be rotated forward into corrected anatomic position. The sternum was elevated and held in corrected position.`,
      `Internal fixation was applied to maintain sternal correction: a titanium plate (Stratos system or similar) was placed across the osteotomy and secured with locking screws, providing rigid fixation that maintained the corrected position during cartilage regrowth (3-6 months). Alternative fixation with a transverse strut bar (Adkins strut) under the sternum was used in some cases.`,
      `The pectoralis major muscles were re-approximated to the midline over the reconstructed chest with interrupted 0 Vicryl sutures. A 15-Fr closed-suction drain was placed beneath each pectoralis flap to prevent seroma. The subcutaneous tissue was closed with 3-0 Vicryl interrupted sutures and the skin with 4-0 Monocryl subcuticular running suture. The patient was placed on activity restrictions (no heavy lifting, no contact sports) for 6-8 weeks while cartilage regrowth occurred. Plate removal at 12-18 months was discussed.`,
    ];
  }

  // -- Pediatric tumor resection (Wilms / neuroblastoma) ---------------------
  if (includesAny(name, ["wilms", "neuroblastoma", "pediatric tumor"])) {
    return [
      `The patient (typically age 2-5 for Wilms, infant to age 5 for neuroblastoma) was positioned supine on the warmed operating room table with arterial line, central venous access, and Foley catheter placed by anesthesia. Adequate cross-matched blood was confirmed available given the potential for significant blood loss in pediatric tumor resection. Preoperative CT or MRI imaging was reviewed in the OR to confirm tumor location, vascular involvement, and contralateral kidney/structures (essential for Wilms staging).`,
      `A wide transverse abdominal incision was made (extending from the contralateral midaxillary line across the abdomen ipsilaterally to the operative side) to provide maximum exposure for the en bloc resection. For very large tumors or thoracoabdominal extension, a thoracoabdominal incision was used. The incision was deepened through subcutaneous tissue, anterior rectus sheath, rectus muscles, and peritoneum.`,
      `The contralateral kidney (for Wilms tumor) was inspected and palpated bimanually as the first step — bilateral Wilms tumor occurs in approximately 5% of cases (Stage V) and dictates a different surgical strategy. The contralateral kidney was confirmed normal. The peritoneal cavity was systematically explored: liver, spleen, omentum, and pelvic peritoneum were inspected for metastatic disease. Any suspicious lesions were biopsied for frozen section.`,
      `${name.includes("wilms") ? "For Wilms tumor: the colon was reflected medially along the line of Toldt to expose the retroperitoneum and the kidney with surrounding Gerota's fascia. The renal vein and inferior vena cava were inspected first for tumor thrombus, palpating along the entire IVC course up to the right atrium when indicated by preoperative imaging — Wilms tumor extends into the IVC in approximately 4% of cases and may extend into the right atrium. The renal artery was identified at the renal hilum, isolated, ligated with 2-0 silk in continuity, and divided. The renal vein was similarly controlled — ligated and divided with the IVC end on the patient side controlled in case of inadvertent embolization. Early vascular control before tumor manipulation is critical to prevent intraoperative tumor embolization." : "For neuroblastoma: the tumor was approached based on its specific location (most commonly retroperitoneal in adrenal medulla, but possible in paraspinal sympathetic chain at any level). The encasement of major vessels (aorta, IVC, mesenteric vessels, renal vessels, celiac axis) was carefully assessed by sharp dissection in the periadventitial plane. Image-defined risk factors (IDRFs) were re-confirmed intraoperatively. Tumor was carefully dissected from surrounding structures, with named vessels protected throughout."}`,
      `The tumor was mobilised within ${name.includes("wilms") ? "Gerota's fascia (preserving the fascia intact as a barrier preventing tumor spillage)" : "its surrounding fat and connective tissue"} circumferentially. Tumor rupture was avoided at all costs — intraoperative tumor spillage upstages a Wilms tumor and increases the risk of recurrence, requiring more intensive chemotherapy. The tumor was delivered en bloc into a sterile basin without compression, with the specimen weight recorded, the surface inspected for capsular integrity, and the orientation marked with sutures (right superior, left superior, right inferior).`,
      `Regional lymph node dissection was performed systematically. ${name.includes("wilms") ? "For Wilms tumor staging: para-aortic and para-caval lymph nodes, plus renal hilar nodes, were sampled — at least 7 nodes are required for adequate staging per COG guidelines. " : "For neuroblastoma: regional sympathetic chain nodes and any clinically enlarged nodes were sampled. "}Specimens were labelled separately by station and submitted to pathology in formalin. Tissue for biobanking, cytogenetics, and tumor-specific molecular testing (MYCN amplification for neuroblastoma, WT1 for Wilms) was collected in appropriate transport media (RPMI for cytogenetics, fresh-frozen for molecular).`,
      `The wound was irrigated copiously with warm saline. Hemostasis was meticulously confirmed at the renal bed (Wilms) or tumor bed (neuroblastoma), with attention to small lumbar arteries that may bleed retroperitoneally. The retroperitoneum was closed with running 3-0 Vicryl. The abdomen was closed in standard fashion: peritoneum and posterior rectus sheath with running 2-0 PDS, anterior rectus sheath with running 0 Vicryl, subcutaneous tissue with 3-0 Vicryl, skin with 4-0 Monocryl subcuticular running suture and Steri-Strips. The patient was admitted postoperatively to the surgical oncology / PICU service and oncology was notified for adjuvant chemotherapy planning per COG protocols.`,
    ];
  }

  // -- Hirschsprung pull-through ---------------------------------------------
  if (includesAny(name, ["hirschsprung", "pull-through", "soave", "swenson", "duhamel"])) {
    return [
      `The patient was positioned supine in lithotomy or low-lithotomy depending on the chosen approach (transanal versus laparoscopic-assisted versus open). The lower abdomen, perineum, and gluteal region were prepped and draped to allow access to both abdominal and perineal/anal fields simultaneously. A Foley catheter was placed transurethrally. For neonates and infants, anal dilation prior to incision was helpful for transanal exposure. Continuous core temperature monitoring was instituted.`,
      `Initial seromuscular biopsies were obtained at sequential proximal levels of bowel to map the transition zone definitively. Biopsies were taken from: (1) the rectosigmoid junction (typically aganglionic), (2) the proximal sigmoid (often transition zone), (3) the descending colon (typically ganglionic), and (4) more proximally if needed. Each biopsy was a full-thickness specimen approximately 1 × 1 cm taken from the antimesenteric border and submitted for frozen section. The pathologist confirmed the presence or absence of myenteric ganglion cells in Auerbach's plexus at each level using H&E or rapid acetylcholinesterase staining.`,
      `${includesAny(name, ["soave"]) ? "Modified Soave (Boley modification, transanal endorectal pull-through) approach was selected: starting transanally, a circumferential incision was made just inside the dentate line, preserving the anal canal mucosa and sphincter. Submucosal dissection was performed circumferentially using cautery and tenotomy scissors, working proximally as a mucosal cuff while preserving the rectal muscular sleeve. The mucosectomy was carried 5-7 cm proximally until peritoneal reflection was reached, at which point the rectal muscular sleeve was incised circumferentially and the proximal aganglionic bowel was eviscerated through the anus. The eviscerated bowel was resected at a point of confirmed ganglionic bowel (frozen section confirmation), and the proximal ganglionic colon was anastomosed to the residual mucosal cuff/anal canal." : includesAny(name, ["swenson"]) ? "Swenson (full-thickness pull-through) was performed: through a low transverse abdominal incision, the rectum and aganglionic sigmoid were mobilised completely down to the levator ani, with careful preservation of the periureteric and pelvic autonomic nerves. The dissection was continued perineally, removing the entire aganglionic rectum to within 1-2 cm of the dentate line. Ganglionic colon was pulled through the pelvis to the perineum and anastomosed to the anal canal in a two-layer hand-sewn fashion." : "Duhamel (retrorectal pull-through) was performed: through an abdominal approach, the aganglionic rectum was preserved as a stump (closed at the rectosigmoid level). The ganglionic proximal colon was mobilised and pulled retrorectally (in the avascular plane between the rectum and the sacrum) down to the level of the dentate line. A side-to-side anastomosis was created between the posterior rectum and the anterior side of the pulled-through ganglionic colon using a stapling device or hand-sewn technique, creating a posteriorly placed neorectum (Martin modification)."}`,
      `Pulled-through bowel was confirmed to have ganglion cells on frozen section at the planned anastomotic level — multiple sections of the proximal cut edge were submitted to ensure complete absence of aganglionic or transition-zone bowel. If frozen section showed persistent aganglionosis or transition-zone changes at the planned level, additional bowel was resected and re-checked. This is critical because anastomosing transition-zone bowel results in persistent obstructive symptoms and need for re-do surgery.`,
      `The anastomosis was created with interrupted 4-0 absorbable sutures (Vicryl or PDS), placed circumferentially in two layers (mucosa-to-mucosa inner layer, seromuscular outer layer) for hand-sewn techniques, or with a circular stapler for stapled techniques. Anastomotic integrity was tested by gentle dilation and absence of leak. The pulled-through colon was confirmed to be tension-free, well-perfused, and without rotation or twisting.`,
      `${includesAny(name, ["soave"]) ? "The rectal muscular sleeve was preserved as a cuff around the pulled-through colon, providing structural support without continued aganglionic obstruction. " : ""}For all approaches, hemostasis was meticulously confirmed. The wound was irrigated with warm saline. Closure was performed in layers: peritoneum/fascia with running 3-0 Vicryl, subcutaneous tissue with 4-0 Vicryl, skin with 4-0 Monocryl subcuticular for abdominal incisions; perineal/anal anastomosis was secured with the chosen suture material as above.`,
      `The patient was returned to the PICU or surgical floor. Postoperative care included nothing per rectum × 1-2 weeks, advancing diet as tolerated once enteral feeding resumed, anal dilations starting at 2 weeks (if anastomosis was healed) and continuing for 3-6 months to prevent stenosis at the anastomosis, and surveillance for Hirschsprung-associated enterocolitis (HAEC) — a feared complication marked by abdominal distension, fever, and explosive diarrhea, treated with rectal irrigations and antibiotics. Long-term follow-up monitored bowel function, soiling, and constipation, with anorectal manometry as indicated.`,
    ];
  }

  // Generic pediatric surgery fallback
  return [
    `Due attention was paid to the pediatric patient's thermoregulation, fluid balance, and small operative corridor. The ${c.procedureName} was performed with age-appropriate instrumentation and suture selection. [Expand with procedure-specific technical steps.]`,
    ``,
    `Hemostasis was confirmed and the wound was closed with fine absorbable sutures and skin glue.`,
  ];
}

export function pediatricSurgeryBody(c: CaseLog): string[] {
  const name = c.procedureName.toLowerCase();
  const isLap = c.surgicalApproach === "LAPAROSCOPIC" || c.surgicalApproach === "ROBOTIC";
  const isOpen = c.surgicalApproach === "OPEN";

  let preamble: string[];
  let closure: string[];

  if (isLap && includesAny(name, ["appendectomy", "pyloromyotomy", "ladd"])) {
    preamble = laparoscopicPreamble(c, {
      ports: [
        "5 mm umbilical camera port",
        "3-5 mm working port in the right/left lower quadrant",
        "3-5 mm working port in the epigastrium",
      ],
    });
    closure = standardLapClosure();
  } else if (isOpen && includesAny(name, ["ladd", "intussusception", "malrotation"])) {
    preamble = laparotomyPreamble(c, "transverse supraumbilical");
    closure = standardOpenClosure(true);
  } else {
    // Focal cases (hernia, orchidopexy, pyloromyotomy open, G-tube) get a
    // lightweight peds-appropriate preamble.
    preamble = [
      `Description of Procedure: The risks, benefits, and alternatives were discussed with the parents/guardians and informed consent was obtained. The patient was brought to the operating room and placed supine with careful attention to thermoregulation, padded positioning, and age-appropriate IV access and monitoring. After induction of general anesthesia, pre-incision antibiotics were administered.`,
      ``,
      `A surgical time-out was completed. The operative site was prepped and draped in the usual sterile fashion.`,
      ``,
    ];
    closure = [
      ``,
      `Hemostasis was confirmed. The wound was closed in layers with fine absorbable sutures and skin adhesive. The patient tolerated the procedure well and was transferred to recovery in stable condition.`,
    ];
  }

  return [...preamble, ...pedsOpSteps(c), ...closure];
}
