/**
 * Ideas parser + checkbox toggle — the pure core of the console "Ideas" surface.
 *
 * Mirrors the review-item parser in server/fileApi.ts (parseReviewItems /
 * toggleReviewCheckbox / ITEM_RE) but for the `outputs/ideas-*.md` contract:
 * an anchor checkbox line carrying inline `· key: value` segments, followed by
 * an indented block of `why:/score:/from:/next:` fields. Items beneath an
 * "Archived" heading are flagged. Kept in its own module so neither file grows
 * unwieldy. Pure: no filesystem, no side effects.
 *
 * Anchor line shape:
 *   - [ ] `idea-YYYYMMDD-NNN` — <text>  ·  dim: <d>  ·  weight: <n>  ·  lane: <l>
 *         why:   <...>
 *         score: <...>
 *         from:  <pathA> · <pathB>
 *         next:  <...>
 */

export interface IdeaItem {
  id: string;
  checked: boolean;
  text: string;
  dim?: string;
  weight?: number;
  lane?: string;
  why?: string;
  score?: string;
  from?: string[];
  next?: string;
  archived: boolean;
  raw: string;
}

const ANCHOR_RE = /^\s*-\s*\[([ xX])\]\s*`(idea-[^`]+)`\s*(.*)$/;
const BLOCK_RE = /^\s+(why|score|from|next):\s*(.*)$/i;
// Intentionally matches ANY heading containing "archived" (e.g. "## Archived",
// "### Archived ideas") — do not tighten this or real files stop flagging.
const ARCHIVED_RE = /^#{1,6}\s+.*archived/i;

export function parseIdeaItems(markdown: string): IdeaItem[] {
  const items: IdeaItem[] = [];
  let archived = false;
  let current: IdeaItem | null = null;
  for (const line of markdown.split(/\r?\n/)) {
    if (ARCHIVED_RE.test(line)) { archived = true; current = null; continue; }
    const a = ANCHOR_RE.exec(line);
    if (a) {
      const rest = a[3].trim().replace(/^[—–-]\s*/, "");
      const segs = rest.split("·").map((s) => s.trim()).filter(Boolean);
      const item: IdeaItem = {
        id: a[2], checked: a[1].toLowerCase() === "x", text: "", archived, raw: line,
      };
      segs.forEach((seg, i) => {
        const low = seg.toLowerCase();
        if (low.startsWith("dim:")) item.dim = seg.slice(seg.indexOf(":") + 1).trim();
        else if (low.startsWith("weight:")) item.weight = Number(seg.slice(seg.indexOf(":") + 1).trim());
        else if (low.startsWith("lane:")) item.lane = seg.slice(seg.indexOf(":") + 1).trim();
        else if (i === 0 || !item.text) item.text = seg;
      });
      items.push(item);
      current = item;
      continue;
    }
    const b = current ? BLOCK_RE.exec(line) : null;
    if (b && current) {
      const key = b[1].toLowerCase();
      const val = b[2].trim();
      if (key === "from") current.from = val.split("·").map((s) => s.trim()).filter(Boolean);
      else if (key === "why") current.why = val;
      else if (key === "score") current.score = val;
      else if (key === "next") current.next = val;
    } else if (line.trim() !== "") {
      current = null; // a non-blank line ends the current item's block (block fields are consumed above)
    }
  }
  return items;
}

/**
 * Flip ONLY the anchor checkbox for `id` (`[ ]` ↔ `[x]`) and return the new
 * body. Never touches the indented block lines or any other anchor. An unknown
 * id, or a box already in the requested state, returns the original string
 * unchanged. Preserves the source EOL style (CRLF vs LF). Pure.
 */
export function toggleIdeaCheckbox(markdown: string, id: string, checked: boolean): string {
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n";
  let changed = false;
  const lines = markdown.split(/\r?\n/).map((line) => {
    const m = ANCHOR_RE.exec(line);
    if (m && m[2] === id) {
      const replaced = line.replace(/\[[ xX]\]/, `[${checked ? "x" : " "}]`);
      if (replaced !== line) changed = true;
      return replaced;
    }
    return line;
  });
  return changed ? lines.join(eol) : markdown;
}
