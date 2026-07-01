---
name: advise-project
description: The outward-facing, propose-only idea engine — the sibling of improve-system. Reads the knowledge base, ingested activity, its own strategic reasoning, and the live-metrics feed (raw/metrics/), then writes a ranked, evidence-grounded list of project ideas to outputs/ideas-*.md across four lenses (improve / scale / maintain / pattern). It never applies changes: approval yields a brief or a review item, leaving the user the decision-maker.
---

# advise-project

The proactive advisor. Where `improve-system` looks *inward* and heals the foundation,
this skill looks *outward* at the user's actual project — its growth, quality, health, and
usage — and brings ranked ideas to the user. It is **propose-only**: it writes only inside
`outputs/`, never applies a change, and never writes `change-log.md`. Approving an idea
produces a *proposal* (a brief or a review item), never a shipped change — `improve-system`
stays the single applier. It rides the existing maintenance tick, so it thinks every run
with no new scheduling.

## When to use

On a schedule (it runs as step 3 of `maintenance-loop`, after `improve-system`), or on
demand when you want a fresh ranked list of project ideas. Run manually first to see what it
proposes — it interviews no one and changes nothing outside the idea queue.

## Inputs (zero-argument, unattended-safe)

No arguments, no interview — same discipline as the sync skills. Skip any missing signal
gracefully and note the skip in the run summary; never block on configuration. Read
behaviour from `.claude/skills/advise-project/config.json`:

- `alert_threshold` (default 70) — a new idea at or above this weight pings the user.
- `age_out_ticks` (default 3) — unapproved ideas older than this many ticks are archived.
- `max_ideas_per_tick` (default 7) — hard cap on ideas written per run, so it never floods.
- `dimensions` — the four enabled lenses (`improve`, `scale`, `maintain`, `pattern`).

Run-state lives in `outputs/runs/advise-project.json` — `last_run`, a `tick` counter (drives
aging), and the last-seen metrics cursor. Create it on the first run if absent.

## Procedure

Run unattended — **do not ask the user questions.** If a signal is missing, skip it and log
a note rather than blocking.

### 1. Gather signals
- **KB state** — `wiki/index.md` + recently updated pages; `raw/` growth, plus thin / orphan
  / stale page detection and coverage gaps.
- **Ingested activity** — recent `raw/inputs/processed/` summaries and `raw/ecosystem/` data.
- **Metrics feed** — `raw/metrics/*.json`: the latest snapshot **and the delta vs. the
  previous snapshot** (for trend direction). **Ignore files named `EXAMPLE*` and dotfiles.**
- **Project identity** — `wiki/charter.md` when present (purpose/audience/success/scope/constraints); otherwise `projectType` + tagline from `aios/src/config/project.ts` / `aios/src/config/brand.ts`; also `wiki/design-system.md` when present (the design direction). Either anchors strategic reasoning to *this* project.
- **Memory** — `outputs/ideas-log.md` + any open `outputs/ideas-*.md`, so it knows what it
  has already said.

### 2. Generate candidates across all four lenses
Produce concrete, project-specific ideas across `improve` (quality), `scale` (grow),
`maintain` (fix), and `pattern` (spot trends). **Grounding rule: every idea cites ≥ 1
evidence source in its `from:` line; a pure-reasoning idea is allowed but is labeled low
confidence.**

### 3. Dedup & re-surface
Drop anything already in `ideas-log.md` or an open queue — **unless its weight has materially
risen** (a worsening problem re-earns attention without nagging).

### 4. Score & rank
Each sub-score is **1–10**: `impact`, `confidence`, `effort` (raw effort, 1 = trivial →
10 = huge). Then:

    ease   = 11 − effort
    weight = round(10 × (0.5·impact + 0.3·confidence + 0.2·ease))   (range 0–100)

Show the sub-scores so the weight is auditable, never a black box. Confidence is higher for
live-metric or repeated evidence, lower for a one-off hunch. Sort highest-first; **cap at
`max_ideas_per_tick`.**

### 5. Write the queue
Append new ideas to today's `outputs/ideas-YYYY-MM-DD.md` using the anchor-line +
indented-block contract below (**new ids, never renumber** existing items). When creating the
file fresh, start it with RAG-ready frontmatter (`title`, `source_id: outputs:ideas-<date>`,
`updated: <date>`), like the other `outputs/` files. Log each one `proposed` in
`outputs/ideas-log.md`.

### 6. Promote approved
For any `- [x]` idea from a prior queue, promote it by lane:
- **`project` lane** → write a starting spec to `outputs/briefs/<id>.md` for the user + Claude
  to carry into brainstorming. *(On-demand only: the user may `roast` a high-weight project idea for a
  GO/RESHAPE/KILL gut-check before carrying it into brainstorming, and a GO-vetted idea's brief may
  point to `build-app` (web), `build-mobile` (phone), or `build-plugin` (browser extension) as the suggested next step. Never auto-run a roast, `build-app`, `build-mobile`, or `build-plugin` inside the
  unattended tick — all are attended; advise-project stays propose-only and asks no one.)*
- **`foundation` lane** → append a NEEDS SIGN-OFF item to today's `outputs/review-*.md`,
  referencing the source `idea-<id>`. **Read the current max `rv-YYYYMMDD-NNN` id in that
  file, continue the sequence, and never renumber existing items.** `improve-system` then
  handles it through its normal gates. **No change to `improve-system` — it stays the single
  applier.**

Log each promotion `promoted` in `ideas-log.md`.

### 7. Age out & alert
- Move ideas older than `age_out_ticks` (tracked via the run-state `tick` counter) under a
  `## Archived` heading in their queue file, and log each `expired`.
- If any *new* idea's weight is ≥ `alert_threshold`, hand the top items (title · weight · why
  · id) to `human-improve-system` / the notify path. If notify is unconfigured, skip the step
  and log it — same as every other unattended step.

### 8. Summarize
Report counts per lens, the top ideas by weight, what was promoted, what is alerting, and the
path to the queue file.

## The `ideas-*.md` contract

Each idea is a machine-parseable **anchor line** (the GUI toggles its checkbox) plus an
**indented human block**:

    - [ ] `idea-20260630-003` — Add a first-run onboarding checklist  ·  dim: scale  ·  weight: 80  ·  lane: project
          why:   D1→D7 retention is dropping and 3 sessions mention users "not sure what to do first."
          score: impact 9 · confidence 7 · effort 4  → ease 7 → weight 80
          from:  raw/metrics/2026-06-29-dau.json · raw/inputs/processed/2026-06-27-session.md
          next:  Draft a 4-step in-app onboarding checklist — spec written on approval.

- **Anchor line:** `- [ ]` (or `- [x]` when approved), then a backtick-wrapped
  `idea-YYYYMMDD-NNN`, then `—`, then the idea text, then
  `·  dim: <improve|scale|maintain|pattern>  ·  weight: <0–100>  ·  lane: <project|foundation>`.
- **Indented block keys:**
  - `why:` — one line of rationale.
  - `score:` — the sub-scores and the worked weight (`impact N · confidence N · effort N → ease N → weight NN`).
  - `from:` — a `·`-separated list of source paths (the grounding evidence; ≥ 1 required).
  - `next:` — one concrete, approvable action.
- **Aged-out items** live under a `## Archived` heading in the same file.

Ids are stable and append-only — the GUI depends on them. **Never renumber or rewrite an
existing item; only append new ones.**

## Safety invariants

> **Propose-only — the user stays the decision-maker.** This skill suggests; it never ships.

- **Writes only inside `outputs/`** — `ideas-*.md`, `ideas-log.md`, `briefs/`, and (only when
  promoting an approved **foundation**-lane idea) a *proposal* item appended to `review-*.md`.
  It still never *applies* a review item.
- **Never edits** `raw/` (immutable), `wiki/`, `.claude/skills/`, or the project's code /
  product.
- **Never writes** `outputs/change-log.md` and **never auto-applies** anything. `improve-system`
  stays the *single* applier and the *single* `change-log.md` writer; approval here produces a
  *proposal* (a brief or a review item), not a change.
- **State:** read from / write to `outputs/runs/advise-project.json` (`last_run`, `tick`,
  last-seen metrics cursor), created on the first run.
- **Unattended:** no interview; skip a missing signal with a logged note rather than blocking.

## Output

A short summary: counts per lens, the top ideas by weight, what was promoted (briefs written /
review items appended), what is alerting, the new `tick` value, and the path to today's
`outputs/ideas-YYYY-MM-DD.md`.

## Post-build invocation (driven by `autopilot`)

When invoked by `autopilot` right after a build (its **Phase E** — a distinct trigger from the build-chain
`## Autonomous invocation` notes on the build skills), focus your four lenses on the **just-built project**:
the charter's `Later`/`Out` deferred items → `scale`/`improve` ideas; the decision ledger's
`(assumed — confirm later)` flags (`outputs/autopilot/<date>-<slug>/decisions.md`) → `maintain`/validate
ideas; the deferred tiers (real data → the `build-backend` skill, testing → the `test-app` skill, deploy, more build targets) → next-step ideas; the build record
(`raw/builds/` + the run's `plan.md`/`run.md`) → what exists now. The `raw/metrics/` usage feed will be
empty for a fresh build — that's fine; skip it and ground on the charter/ledger/build-record. Run **only
your generate-and-append steps** (gather → generate → dedup → score → write the queue → summarize) and
**skip "Promote approved" (step 6) and "Age out & alert" (step 7)** — this post-build pass proposes what's
next only, so it must not promote a pre-existing `- [x]` idea into a brief / `review-*.md` item or archive
an old queue (that stays with the normal `maintenance-loop` tick). Write new ideas to `outputs/ideas-*.md`
as usual — stable ids, the `max_ideas_per_tick` cap, `ideas-log.md` dedup, and the propose-only invariants
(write only in `outputs/`, never apply, `improve-system` stays the single applier). This note is additive —
your attended and maintenance-loop (unattended) behavior above is unchanged.
