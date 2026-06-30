/**
 * AIOS — white-label control panel.
 *
 * This file holds every piece of client-facing *text and imagery*. To rebrand,
 * edit the values here, swap the logo asset in /public, and adjust the color
 * variables in `src/index.css`. No component code should need to change.
 *
 * (Colors live in src/index.css :root/.dark; this file is words + logos + names.)
 *
 * Ported from harbormill-aios with neutral, generic defaults.
 */
export interface BrandConfig {
  /** Product name shown in the nav, title bar, and docs. */
  productName: string;
  /** Short tagline under the product name on the dashboard. */
  tagline: string;
  /** The AI assistant's display name. */
  assistantName: string;
  /** One-line persona used in the assistant's empty state. */
  assistantPersona: string;
  /** Public path to the logo (place the file in /public). */
  logoSrc: string;
  /** Public path to a square mark/emblem (favicon, assistant avatar). */
  emblemSrc: string;
  /** The operator/team running this deployment. */
  company: {
    name: string;
    url: string;
  };
}

export const brand: BrandConfig = {
  productName: "AIOS",
  tagline: "A file-first window onto your self-improving knowledge base.",
  assistantName: "Ada",
  assistantPersona:
    "a knowledge-base search assistant — it finds and cites the wiki pages that answer your question",
  logoSrc: "/logo.svg",
  emblemSrc: "/emblem.svg",
  company: {
    name: "Your Team",
    url: "https://example.com",
  },
};
