// ---------------------------------------------------------------------------
// Shared types for the operative builder.
//
// Keeping this in its own file breaks what would otherwise be a circular
// dependency: specialty modules (generalSurgery, vascular, etc.) need the
// TopMatter shape, but `./index.ts` imports each specialty module, which
// would mean each specialty module importing `./index` to read `TopMatter`.
// Even a type-only import can trip up the bundler's module graph analysis,
// so we keep the shape here instead.
// ---------------------------------------------------------------------------

/**
 * Top-matter overrides that specialty modules can supply to replace the
 * generic defaults for ANESTHESIA, ESTIMATED BLOOD LOSS, DRAINS, SPECIMENS,
 * and the Disposition line.
 */
export interface TopMatter {
  anesthesia?: string;
  ebl?: string;
  drains?: string;
  specimens?: string;
  disposition?: string;
}
