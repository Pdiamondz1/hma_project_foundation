/**
 * Per-deployment feature flags — the plug-and-play lever.
 *
 * Toggle a module off and it disappears from the nav AND its route stops
 * resolving (deep links fall back to Overview). No component code changes.
 * Overview is always on (the home surface).
 *
 * Ported from harbormill-aios; surfaces remapped to the file-first console.
 */
export interface FeatureFlags {
  /** Browse + render the AI-written wiki/ table of contents. */
  wiki: boolean;
  /** Read-only listing of immutable raw/ assets. */
  raw: boolean;
  /** The NEEDS SIGN-OFF review queue (the one interactive surface). */
  review: boolean;
  /** Open MORE CONTEXT questions for the human. */
  needsContext: boolean;
  /** The applied-changes ledger. */
  changeLog: boolean;
  /** The "ask the knowledge base" search panel (RAG-ready seam). */
  assistant: boolean;
  /** The proactive project advisor's idea inbox (approve a checkbox to accept an idea). */
  ideas: boolean;
}

export const features: FeatureFlags = {
  wiki: true,
  raw: true,
  review: true,
  needsContext: true,
  changeLog: true,
  assistant: true,
  ideas: true,
};

export type FeatureKey = keyof FeatureFlags;
