import type { CaseLog } from "@/lib/types";
import { includesAny } from "../shared/format";
import { laparotomyPreamble, laparoscopicPreamble } from "../shared/preamble";
import { standardOpenClosure, standardLapClosure } from "../shared/closure";

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
