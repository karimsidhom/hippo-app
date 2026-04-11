export function standardOpenClosure(layered = true): string[] {
  const lines = [
    `Hemostasis was confirmed. The abdomen was irrigated with warm saline and suctioned dry. All counts were reported as correct by nursing staff prior to closure.`,
    ``,
  ];
  if (layered) {
    lines.push(
      `The fascia was closed with a running #1 looped PDS suture. The subcutaneous tissue was irrigated. The skin was approximated with 4-0 Monocryl in a subcuticular fashion and dressed with Dermabond and a sterile dressing.`,
    );
  } else {
    lines.push(
      `The wound was closed in a single layer with interrupted 0 Vicryl through the fascia, and the skin was approximated with staples or 4-0 Monocryl, followed by a sterile dressing.`,
    );
  }
  return lines;
}

export function standardLapClosure(): string[] {
  return [
    `Hemostasis was confirmed throughout the operative field. All instruments and ports were removed under direct visualization and the pneumoperitoneum was released. Fascia at the 10/12 mm port sites was closed with 0 Vicryl. The skin was approximated with 4-0 Monocryl in a subcuticular fashion and dressed with Dermabond.`,
  ];
}

export function endoscopicClosure(leaveCatheter = false): string[] {
  const lines = [
    `Hemostasis was confirmed. The bladder was emptied and the scope was removed.`,
  ];
  if (leaveCatheter) {
    lines.push(
      `A [18/20/22] Fr three-way Foley catheter was placed and connected to continuous bladder irrigation.`,
    );
  }
  return lines;
}
