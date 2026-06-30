# Design Spec: Proactive Project Advisor — an outward-facing, propose-only idea engine

> Status: Approved (2026-06-30). Not yet implemented. Extends the self-improving foundation
> (`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`) with a new outward-facing
> layer. Builds on Phases 0–5; this is **Phase 6**.

## Context

**Why this is being built.** Today the foundation is *reactive on the project axis*: the user must
think of every improvement, fix, and growth idea themselves, then ask Claude to act. The existing
self-improvement engine (`improve-system`, fired on a schedule by `maintenance-loop`) is powerful but
**inward-facing** — it heals the *foundation itself* (wiki contradictions, broken links, stale pages,
coverage gaps, skill friction). Nothing ever looks *outward* at the user's actual project — its
growth, quality, health, or usage — and proactively brings ideas to the user.

**The goal (user's words):** make the build *proactive* so that "instead of the user asking questions
or providing thoughtful ideas as the project's usage is growing or is under-performing, the AI RAG
agent or the build is able to provide these ideas or solutions to the user proactively. That way it
shifts the user from being a bottleneck and allows them to become the decision maker / approver."

**Decisions (made with the user this session):**
1. **Scope → all four lenses.** The advisor reasons about the project across `improve` (quality),
   `scale` (grow), `maintain` (fix), and `pattern` (spot trends).
2. **Signals → everything available, metrics pluggable.** Knowledge-base state + ingested
   activity/sessions (already present) + the advisor's own strategic reasoning + **a new pluggable
   live-metrics feed** (`raw/metrics/`) so real product activity like DAU can drive ideas — vendor-neutral.
3. **Operating mode → "Digest + alerts."** The advisor thinks on the existing maintenance tick and
   files a ranked idea list to an approval queue + console inbox; high-impact ideas also ping the user.
   (The fuller "Reactive watch" — a live service reacting the instant metrics move — is explicitly
   deferred; this design is built so it can grow into that without a rewrite.)
4. **Architecture → Approach A.** A new outward-facing `advise-project` skill running *beside*
   `improve-system`, reusing the existing approval-queue + console + notify patterns. (Rejected:
   overloading `improve-system`; a standalone always-on service.)
5. **Weight & aging defaults.** Transparent `impact × confidence × effort` weight (0–100); alert at
   weight ≥ 70; auto-age unapproved ideas after 3 ticks.

**Intended outcome.** Clone → use the project → each scheduled tick the advisor reads the signals and
drops a short, ranked, evidence-grounded list of ideas into `outputs/ideas-*.md` and the console
"Ideas" inbox; high-weight ideas ping the user. The user approves with a checkbox; on approval the
advisor drafts a brief (it never ships a change). The user becomes the decision-maker/approver.

## Architecture

A new propose-only unit alongside the existing inward-facing engine. It communicates only through
files, and writes **only** inside `outputs/`.

```
   SIGNALS                          BRAIN                    SURFACE
 ┌─────────────────────┐                                ┌──────────────────────┐
 │ wiki/ + raw/ state   │                                │ outputs/ideas-*.md   │
 │ (growth, gaps,       │                                │  (ranked queue:      │
 │  stale/orphan pages) │──┐                             │   id · weight ·      │
 │ ingested activity/   │  │     ┌──────────────────┐    │   evidence · action  │
 │ sessions             │──┼────▶│  advise-project  │───▶│   · [ ] approve)     │
 │ raw/metrics/*.json   │  │     │  4 lenses, score │    │ AIOS "Ideas" inbox   │
 │ (DAU/usage, BYO)     │──┤     │  & rank, dedup   │    │  (read + check box)  │
 │ advisor's own        │──┘     └──────────────────┘    └──────────┬───────────┘
 │ strategic reasoning  │                                           │ weight ≥ 70
 └─────────────────────┘                                            ▼
                                                          Slack/email alert
                                                          (existing notify path)
```

**Five parts — four reuse existing machinery:**
1. **`advise-project` skill** *(new)* — the brain. Propose-only.
2. **Signals** — KB + ingested activity (existing) + advisor reasoning + the new `raw/metrics/` feed.
3. **`outputs/ideas-*.md` queue + `outputs/ideas-log.md` ledger** *(new convention)* — same
   checkbox/stable-id pattern as `review-*.md`, so it slots into the existing approval discipline.
4. **AIOS "Ideas" inbox** *(new console surface)* — read-only; its only mutation is toggling an
   approve checkbox, exactly like the review surface (honors CLAUDE.md's GUI rule).
5. **Alerts** — reuse `human-improve-system`/Slack notify.

**Heartbeat:** `maintenance-loop` gains a third step — **ingest → self-heal → advise** — so the
advisor thinks every tick with no new scheduling.

## The idea object & the queue

**Queue file:** `outputs/ideas-YYYY-MM-DD.md` — RAG-ready frontmatter, append-only, **never renumber
existing items** (stable ids the GUI depends on). **Dedup ledger:** `outputs/ideas-log.md`
(append-only, advisor-written) — the advisor's memory of every idea ever raised and how it ended.

**Each idea = a machine-parseable anchor line (the GUI toggles it) + an indented human block:**

```
- [ ] `idea-20260630-003` — Add a first-run onboarding checklist  ·  dim: scale  ·  weight: 78  ·  lane: project
      why:   D1→D7 retention is dropping and 3 of your sessions mention users "not sure what to do first."
      score: impact 9 · confidence 7 · effort 3  → weight 78  (strong signal, low effort)
      from:  raw/metrics/2026-06-29-dau.json · raw/inputs/processed/2026-06-27-session.md
      next:  Draft a 4-step in-app onboarding checklist — spec written on approval.
```

Fields:
- **`id`** — `idea-YYYYMMDD-NNN`; the checkbox lives here so approving works identically to `review-*.md`.
- **`dim`** — `improve` · `scale` · `maintain` · `pattern`.
- **`weight` (0–100)** — transparent blend of **impact × confidence × (low-)effort**, sub-scores shown
  so it is auditable, never a black box. Queue sorts highest-first; **weight ≥ 70 also alerts.**
  Confidence is higher for live-metric or repeated evidence, lower for a one-off hunch.
- **`from`** — links to the `raw/`/`wiki/`/`metrics/` sources that triggered it. **Grounding rule:**
  every idea cites ≥ 1 evidence source; a pure-reasoning idea is allowed but labeled low confidence.
- **`lane`** — `foundation` (system can safely act via `improve-system` on approval) vs `project`
  (real product work, drafted as a brief).
- **`next`** — one concrete, approvable action.

**Lifecycle (the user only ever approves or ignores):**
1. **Proposed** — in `ideas-*.md`, unchecked; logged `proposed`.
2. **Approved** — the box is checked (chat or console). Next run **promotes** it: the advisor writes a
   brief to `outputs/briefs/<id>.md` — a `project`-lane brief is a ready starting spec for the user +
   Claude; a `foundation`-lane brief is tagged so `improve-system` adopts it through its normal gates
   on its next pass. Logged `promoted`.
3. **Aged out** — an idea left unapproved for `age_out_ticks` (default 3) moves to an "Archived"
   section and is logged `expired`. It only returns if its weight materially rises (a worsening
   problem re-earns attention without nagging).

## The `advise-project` reasoning procedure

Zero-argument and unattended-safe (same discipline as the sync skills): no interview; skip missing
signals gracefully.

1. **Gather signals** — KB state (`wiki/index.md` + recent pages, `raw/` growth, thin/orphan/stale
   detection, coverage gaps); recent ingested activity (`raw/inputs/processed/`, `raw/ecosystem/`);
   the metrics feed (`raw/metrics/*.json` — latest snapshot **and the delta vs. the previous**, for
   trend direction); the project identity (`projectType` + tagline from setup config) to anchor
   strategic reasoning; `ideas-log.md` + open `ideas-*.md` so it knows what it already said.
2. **Generate candidates across all four lenses** — concrete, project-specific ideas. **Grounding
   rule** applies: each cites ≥ 1 source; pure-reasoning ideas are labeled low confidence.
3. **Dedup & re-surface** — drop anything already in `ideas-log.md` or an open queue, unless its
   weight has materially risen.
4. **Score & rank** — `impact × confidence × (low-)effort → weight`, sub-scores shown, sorted high→low;
   cap at `max_ideas_per_tick` (default 7) so it never floods.
5. **Write the queue** — append new ideas to today's `ideas-*.md` (new ids, never renumber); log each
   `proposed` in `ideas-log.md`.
6. **Promote approved** — for any `- [x]` idea from a prior queue, write `outputs/briefs/<id>.md` and
   log `promoted`.
7. **Age out & alert** — archive ideas older than `age_out_ticks` (`expired`); if any new idea's
   weight ≥ `alert_threshold`, hand the top items to the notify path.
8. **Summarize** — counts per lens, top ideas by weight, what was promoted, what's alerting.

**Propose-only safety invariants (what keeps the user the decision-maker):**
- The advisor **writes only inside `outputs/`** — `ideas-*.md`, `ideas-log.md`, `briefs/`.
- It **never** edits `raw/` (immutable), `wiki/`, `.claude/skills/`, or the project's code/product.
- It **never** writes `change-log.md` and **never auto-applies** anything. `improve-system` stays the
  *single* applier and the *single* `change-log.md` writer. Approval produces a *brief*, not a change.

## The metrics feed contract (`raw/metrics/`)

Anything that can write a file (the app, a cron, a webhook handler, a Zapier/Make step, a manual
paste) drops a dated JSON snapshot. Because `raw/` is append-only, each snapshot is a **new file** —
which is what lets the advisor compute trend deltas.

```
raw/metrics/2026-06-29-dau.json
```
```json
{
  "captured_at": "2026-06-29T00:00:00Z",
  "metrics": {
    "dau": 100, "wau": 420, "mau": 1200,
    "d1_retention": 0.22, "d7_retention": 0.09,
    "signups": 35, "errors": 12,
    "feature_usage": { "search": 540, "upload": 88 }
  },
  "notes": "optional freeform"
}
```

Every field is optional, so partial data degrades gracefully. The foundation ships an **example file
(`raw/metrics/EXAMPLE-dau.json`) + a one-page `docs/METRICS-FEED.md`**, not a vendor connector —
vendor-neutral by design. `setup-project` can offer to explain it. (An optional light `wiki/metrics.md`
index summarizing the latest snapshot is a nice-to-have, not required for v1.)

## The console "Ideas" inbox

A new AIOS surface reads `outputs/ideas-*.md` and renders idea **cards** sorted by weight — dimension
badge, weight + sub-scores, clickable evidence links, the next action. Its **only** mutation is
toggling the approve checkbox (writing `- [ ]`→`- [x]` back to the markdown), identical to the
existing review surface — so it obeys CLAUDE.md's "GUI only toggles a checkbox" rule. It never writes
`change-log.md` or anything else. Archived/expired ideas render collapsed. Gated by a new `features.ts`
flag `ideas` (default on), matching the existing `wiki`/`raw`/`review`/`needsContext`/`changeLog`/
`assistant` flags.

## Alerts

New ideas with weight ≥ `alert_threshold` hand off the top items (title · weight · why · id) to the
existing `human-improve-system`/Slack notify path. If Slack/email is not configured, the step is
skipped and logged — same as every other unattended step. No new alerting infrastructure.

## Wiring & configuration

- **`maintenance-loop`** gains step 3 (**advise**), after `improve-system`. Its run-log block gains
  advisor counts (proposed / promoted / alerted). `docs/SCHEDULING.md` notes the advisor rides the
  same tick.
- **`.claude/skills/advise-project/config.json`** — `alert_threshold: 70`, `age_out_ticks: 3`,
  `max_ideas_per_tick: 7`, enabled dimensions.
- **`outputs/runs/advise-project.json`** — `last_run`, a `tick` counter (drives aging), last-seen
  metrics cursor.
- **`CLAUDE.md`** is at its 99-line cap (hard limit < 100). Adding the advisor + the `ideas-*.md`
  queue + `raw/metrics/` requires **condensing existing lines to make room** — net result must stay
  under 100 lines.

## Files

**Create:**
- `.claude/skills/advise-project/SKILL.md` and `.claude/skills/advise-project/config.json`
- `docs/METRICS-FEED.md`
- `raw/metrics/.gitkeep` and `raw/metrics/EXAMPLE-dau.json`
- `outputs/ideas-log.md` (empty ledger, with header) ; `outputs/briefs/.gitkeep`
- AIOS "Ideas" inbox surface (new route/component reading `outputs/ideas-*.md`) + file-API support
  for listing/reading `ideas-*.md` and toggling its checkbox (mirroring the review surface)
- `outputs/runs/advise-project.json` is created on first run (not shipped)

**Modify:**
- `CLAUDE.md` — add the advisor skill entry, the `ideas-*.md` queue, and `raw/metrics/` to the three
  relevant sections, condensing to stay < 100 lines.
- `.claude/skills/maintenance-loop/SKILL.md` — add step 3 (advise) + run-log fields.
- `aios/src/config/features.ts` — add the `ideas` flag (default on).
- `docs/SCHEDULING.md` — one sentence that the advisor rides the same tick.
- `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` — a short "Phase 6 addendum"
  pointer to this spec.
- `README.md` / `docs/USING-THIS-FOR-ANY-PROJECT.md` — brief mention of the proactive advisor.

## Verification

- **Authoring sanity:** every path/field the skill names matches the verbatim shapes in the repo
  (`features.ts` flags, the `review-*.md` item conventions, the run-state JSON shape, the notify path).
- **Advisor smoke (file-first, safe):** seed one `raw/metrics/EXAMPLE-dau.json` (+ a second dated
  snapshot to create a delta) and a couple of `raw/inputs/processed/` summaries, run `advise-project`
  once → expect a ranked `outputs/ideas-*.md` with grounded `from:` links, sub-scores, lanes, and the
  `ideas-log.md` entries; confirm it wrote **nothing** outside `outputs/` (no `raw/`/`wiki/`/`.claude/`
  change, no `change-log.md` write).
- **Approval → promote:** check one box, re-run → expect `outputs/briefs/<id>.md` written and an
  `ideas-log.md` `promoted` line; project-lane brief is a spec stub, foundation-lane brief is tagged
  for `improve-system`.
- **Aging:** an unapproved idea older than `age_out_ticks` moves to Archived and logs `expired`.
- **maintenance-loop:** runs ingest → improve-system → advise-project; the run-log block shows advisor
  counts; the approval-gate guarantee still holds (nothing structural applied without a checked box).
- **Console:** the Ideas inbox lists ideas, links resolve, and the only write it can make is toggling a
  checkbox; `npm run typecheck` stays green.

## Out of scope (v1)

- The "Reactive watch" mode (a live service reacting the instant metrics move). This design leaves the
  seam for it (the `raw/metrics/` feed + weight/alert mechanics) but ships only the digest-on-tick form.
- Vendor-specific metrics connectors (Amplitude, GA, Stripe, etc.) — the feed is bring-your-own JSON.
- The advisor auto-implementing project changes. Approval yields a brief; building stays a deliberate,
  user-driven step (brainstorming → writing-plans → implementation).
- Any change to `improve-system`'s role as the single applier / single `change-log.md` writer.
