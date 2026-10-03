/** SOURCE OF TRUTH: Seene identity, attribution and canonical links.
 * WHAT: the product/organization/person hierarchy every surface renders.
 * WHY: one place so the CLI, studio, docs and public site never disagree.
 * WHERE: consumed by the CLI, preview attribution and the public site.
 */
export const SEENE_BRAND = Object.freeze({
  name: "Seene",
  /** Human-facing product statement. Used as the site and package tagline. */
  tagline: "Cinematic scenes for real React interfaces.",
  /** Organization behind the project. */
  creator: "THATG33K",
  /** Person who creates and maintains the project. */
  maintainer: "Yonela Johannes",
  title: "Seene by THATG33K",
  /** Canonical project home. */
  url: "https://thatg33k-t33.github.io/Seene/",
  organization: "https://github.com/thatg33k-t33",
  repository: "https://github.com/thatg33k-t33/Seene",
  npm: "https://www.npmjs.com/package/@thatg33k/seene",
  docs: "https://github.com/thatg33k-t33/Seene#readme",
  examples: "https://github.com/thatg33k-t33/Seene/tree/main/examples",
  issues: "https://github.com/thatg33k-t33/Seene/issues",
  license: "MIT",
  packageName: "@thatg33k/seene",
  maintainerProfile: "https://github.com/Yonela-Johannes",
  maintainerSite: "https://yonela-johannes.vercel.app",
});

/** The single supported one-step install command. */
export const SEENE_INSTALL_COMMAND = `npx ${SEENE_BRAND.packageName} init`;
