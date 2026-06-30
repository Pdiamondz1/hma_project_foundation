/**
 * Path resolution for the intelligence layer — kept self-contained (it imports
 * nothing from the rest of the server) so it never participates in an import
 * cycle and is safe to load from any entry point (Vite middleware, the
 * `kb:index` script, or Vitest).
 *
 * KB_ROOT mirrors the resolution in server/fileApi.ts: the `KB_ROOT` env
 * override, else the first ancestor that looks like the knowledge-base root
 * (has wiki/ + raw/ + outputs/). Index + cache live UNDER aios/ (gitignored), so
 * they travel with the console, not the knowledge base.
 */
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url)); // aios/server/kb

/** aios/ — the console package root (two levels up from this module). */
export const AIOS_DIR: string = path.resolve(moduleDir, "..", "..");

/** Walk up from `start` to the first dir that looks like the KB root. */
function findKbRoot(start: string): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (
      existsSync(path.join(dir, "wiki")) &&
      existsSync(path.join(dir, "raw")) &&
      existsSync(path.join(dir, "outputs"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

/** KB root = `KB_ROOT` env override, else the repo root (parent of aios/). */
export const KB_ROOT: string = process.env.KB_ROOT
  ? path.resolve(process.env.KB_ROOT)
  : findKbRoot(AIOS_DIR);

export const WIKI_DIR: string = path.join(KB_ROOT, "wiki");
export const RAW_DIR: string = path.join(KB_ROOT, "raw");
export const OUTPUTS_DIR: string = path.join(KB_ROOT, "outputs");

/** Persisted local vector/lexical index — gitignored, lives under aios/. */
export const KB_INDEX_DIR: string = path.join(AIOS_DIR, ".kb-index");
export const KB_INDEX_FILE: string = path.join(KB_INDEX_DIR, "index.json");

/** Model/transformers cache — gitignored, lives under aios/. */
export const CACHE_DIR: string = path.join(AIOS_DIR, ".cache");

/** aios/.env — loaded by server/env.ts with a tiny no-dep parser. */
export const ENV_FILE: string = path.join(AIOS_DIR, ".env");
