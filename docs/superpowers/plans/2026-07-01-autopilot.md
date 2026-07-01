# autopilot Implementation Plan (Phase 15)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Author the `autopilot` skill (+ config + doc + the 7 additive `## Autonomous invocation` notes +
wiring) — the capstone orchestrator that turns one goal into a built project via an upfront grill → vet →
research → single confirm → hands-off design+build. Author only; never run autopilot for real here.

**Architecture:** One attended-started/hands-off-executed skill (`.claude/skills/autopilot/{SKILL.md,config.json}`)
that drives the existing pipeline skills in a new autonomous mode, records a decision ledger under
`outputs/autopilot/`, and delegates grunt work to the Phase 14 `.claude/agents/` fleet. Each of 7 sub-skills
gains an ADDITIVE `## Autonomous invocation` note (mirrors the sync skills' `## Unattended invocation` note).
Source of truth: the committed spec `docs/superpowers/specs/2026-07-01-autopilot-design.md`.

**Tech Stack:** Markdown/JSON authoring (no code/tests). Verification is by `grep`/`wc`/`git` DoD checks.

**Branch:** all work on `phase-15-autopilot` (already created off `main`; the spec is committed there).
Task 8's `git diff main..HEAD` checks depend on it — do not commit on `main`.

**Discipline (every task):** Ship the skill + config + doc + the additive notes + wiring ONLY. The
`## Autonomous invocation` notes are ADDITIVE — never remove or reword a sub-skill's attended interview/gates.
**Never** touch `maintenance-loop` or `improve-system`. **Never** run `autopilot` for real (no committed
charter/design/verdict/briefing/`app`/`mobile`/`plugin`/ledger). Keep `CLAUDE.md` under 125 lines.

---

### Task 1: Skill config + output dir — `config.json` + `outputs/autopilot/.gitkeep`

**Files:**
- Create: `.claude/skills/autopilot/config.json`
- Create: `outputs/autopilot/.gitkeep`

- [ ] **Step 1: Create `.claude/skills/autopilot/config.json`** with exactly:

````json
{
  "run_dir": "autopilot",
  "confidence_chain": ["define-project", "roast", "storm-research"],
  "build_chain": ["define-design", "build"],
  "default_target": "",
  "grill_round_cap": 3,
  "research_upfront": true,
  "stop_on_kill": true,
  "auto_adopt_reshape": true
}
````

- [ ] **Step 2: Create `outputs/autopilot/.gitkeep`** (empty file).

- [ ] **Step 3: Verify DoD**
```bash
node -e "console.log(require('./.claude/skills/autopilot/config.json').confidence_chain.join(','))"   # expect define-project,roast,storm-research
test -f outputs/autopilot/.gitkeep && echo GITKEEP_OK
```
Expect: `define-project,roast,storm-research` and `GITKEEP_OK`.

- [ ] **Step 4: Commit**
```bash
git add .claude/skills/autopilot/config.json outputs/autopilot/.gitkeep
git commit -m "feat(autopilot): skill config + outputs/autopilot output dir"
```

---

### Task 2: The `autopilot` SKILL.md

**Files:**
- Create: `.claude/skills/autopilot/SKILL.md`

**Context for the implementer:** The core artifact. Write it in the voice/structure of the build-* skills
(calm, plain, procedural). Full content below; write it verbatim (it encodes the committed spec).

- [ ] **Step 1: Create `.claude/skills/autopilot/SKILL.md`** with exactly this content:

````markdown
---
name: autopilot
description: Use when someone asks to "build my whole project", "do the whole thing for me", "take it from here", "set it and forget it", "run it on autopilot", "build it end-to-end", or says "/autopilot". The capstone — describe your goal once, get grilled once, confirm one vetted + researched plan, then it runs define-project → roast → storm-research → define-design → build hands-off, pausing only on a KILL verdict. User-initiated, then hands-off. Delegates grunt work to the .claude/agents/ fleet. Tier 0 (mock/local data — no backend, keys, or accounts). Attended-started — NEVER runs in the unattended maintenance loop. Zero-argument safe.
argument-hint: "[describe your goal in one line, or leave blank and I'll ask]"
---

# autopilot

The capstone. The foundation already helps a non-technical user get clear on *what* they're building
(`define-project`), *whether it's worth building* (`roast`/`storm-research`), *how it should look*
(`define-design`), and turns that into a working app (`build-app`/`build-mobile`/`build-plugin`). But
running those one at a time — each with its own interview and confirm gate — makes the **user** the
orchestrator and the bottleneck. This skill removes that: you describe your goal **once**, it grills you
**once** to reach real clarity, **vets and researches** the idea, shows you **one** plan to confirm, then
builds the whole thing **hands-off** — surfacing only if the idea gets a **KILL** verdict. All the
engagement is packed into the front; then you get your time back.

What it produces: the same artifacts the individual skills produce — `wiki/charter.md`, a vetting verdict
in `outputs/vetting/`, `wiki/design-system.md`, and a built `app/`|`mobile/`|`plugin/` — plus a
**decision ledger** in `outputs/autopilot/<date>-<slug>/` recording every autonomous call for you to
review after.

## When to use

When the user says "build my whole project", "do the whole thing for me", "take it from here", "set it
and forget it", "run it on autopilot", "build it end-to-end", or `/autopilot`. Also offered by
`what-can-i-do` and by `setup-project`. It is **attended-STARTED, hands-off-EXECUTED**: a human types the
goal and gives one plan-confirm; after that it runs to completion without pausing (except a KILL verdict,
surfaced *before* the confirm). It is **never added to the unattended `maintenance-loop`** — the build
skills' "never unattended" rule is about the cron loop, not a user-initiated run.

## Configuration

Read `.claude/skills/autopilot/config.json` (all values default; never block on absence):
- `run_dir` (default `"autopilot"`) — the run-record folder under `outputs/`.
- `confidence_chain` (default `["define-project","roast","storm-research"]`) — the UPFRONT phase (charter → vet → research), before the confirm gate.
- `build_chain` (default `["define-design","build"]`) — the HANDS-OFF phase (design → build), after the gate.
- `default_target` (default `""`) — `""` = ask/infer the build target in the grill; else `web|mobile|plugin`.
- `grill_round_cap` (default `3`) — max follow-up rounds per dimension before defaulting-with-assumption.
- `research_upfront` (default `true`) — run `storm-research` upfront; web-gated / graceful-off.
- `stop_on_kill` (default `true`) — a KILL verdict is the one stop (surfaced upfront, before the confirm).
- `auto_adopt_reshape` (default `true`) — a non-KILL RESHAPE is auto-adopted (folded in, logged, no pause).

## Procedure

### Phase A — Upfront confidence & clarity (attended; ALL engagement lives here)

**1. Grill — ONE concentrated session.** Run your own consolidated interview so the sub-skills' interview
code is never entered. Walk three domains back-to-back, each question offering **2–4 options + a
recommended default** (propose-don't-just-ask, so it's thorough but fast), reusing the sub-skills' option
libraries:
- **Project (5 dims)** — purpose / audience / success / scope (In/Out/Later) / constraints (the
  `define-project` model + its 5 starter archetypes for a blank user).
- **Design (5 dims)** — style / color / type & shape / voice / targets (the `define-design` 5 style
  archetypes; recommend a direction inferred from the project answers).
- **Target (1)** — web (`app/`) / phone (`mobile/`) / browser extension (`plugin/`); recommend
  `config.default_target` if set, else infer from purpose/audience.

Cap follow-ups at `config.grill_round_cap`; anything still thin becomes the recommended default flagged
`(assumed — confirm later)` and goes to the ledger — never a blocking loop. **Exit when** all 10
dimensions are answered-or-defaulted, a target is chosen, and no unresolved either/or would change scope.
Then write the gathered project/design/target answers to `outputs/autopilot/<date>-<slug>/intake.md` — the
consolidated intake the Phase A sub-skills read.

**2. `define-project` (autonomous)** — read `intake.md`, write `wiki/charter.md` +
`raw/project/<date>-discovery.md` from the answers; no interview, no draft-gate, no roast-offer (you own
vetting). Log the charter to `run.md`.

**3. `roast` (autonomous) — VET the charter.** Build the brief from the charter (skip the ≤4-question
batch), convene the 5-persona council, get the Judge's **GO / RESHAPE / KILL** verdict + cheapest 48h test
→ `outputs/vetting/<date>-<slug>/roast-verdict.md` + `wiki/vetting.md`. The Researcher persona may run as
the `web-researcher` agent.
- **KILL → the one stop, and it's UPFRONT** (you're present): surface the verdict + biggest risk, and ask
  **reshape / proceed-anyway / stop**. *reshape* → fold the pivot into the charter (define-project pivot
  mode), continue. *stop* → halt gracefully (charter + verdict remain; resumable). *proceed-anyway* →
  continue to the gate (the build record logs the override). Record the choice in `decisions.md`.
- **RESHAPE (non-KILL) →** auto-adopt the pivot (fold into the charter, log, continue, no pause).
- **GO →** log and continue.

**4. `storm-research` (autonomous, web-gated) — RESEARCH the vetted idea.** Run the STORM pipeline (expert
lenses → contradiction map → citation-verified HTML briefing) →
`outputs/vetting/<date>-<slug>/<slug>-briefing.html`; fold the key findings into the plan. Lenses may run
as the `web-researcher` agent. **Graceful-off:** if web is unavailable, skip with a `run.md` note
("research skipped — offline") and proceed on the roast verdict alone.

### Phase B — Plan outline + SINGLE confirm gate (on a vetted + researched plan)

Write the confirmed intent to `outputs/autopilot/<date>-<slug>/plan.md` (built from the intake + charter +
verdict + research + design direction + target), and show it in **one** message: the app name + one-liner,
the charter summary (purpose/audience/success/scope), **the GO verdict + cheapest test**, **the key
research findings**, the design direction, the target + what it will build, and the
`(assumed — confirm later)` list. Ask **one** question:

> *"This is the plan — already vetted (**GO**) and researched. After you say go, I'll design it and build
> it end-to-end **without stopping**. Every judgment call I make gets logged for you to review after.
> Go? (yes / tweak something)"*

On "tweak", revise and re-show. On **yes**, this single gate **satisfies each build skill's own confirm
gate**; begin the hands-off build.

### Phase C — Hands-off build (silent; after the gate)

Run `config.build_chain` in order, driving each sub-skill in autonomous mode, logging each step to
`run.md`. **No vetting stop (already GO); halt only on a genuine failure** (graceful + resumable):
1. **`define-design` (autonomous)** — infer the direction from the charter + the intake's design answers;
   synthesize from those alone (no Stitch paste-back wait; console-theming stays opt-in attended, skip
   it) → `wiki/design-system.md` + `raw/design/<date>-<slug>/`.
2. **`build-<target>` (autonomous)** — read `plan.md` + `wiki/charter.md` + `wiki/design-system.md` + the
   GO verdict; **skip the Phase 2 confirm gate** (your gate covered it); the RESHAPE pivot is already
   folded; scaffold `app/`|`mobile/`|`plugin/` **offline** (do NOT run `npm install`) →
   `raw/builds/<date>-<slug>.md` + `wiki/build.md` + its own `applied` change-log line.

### Phase D — Hand it over

Close plainly: point the user at the **decision ledger** (`outputs/autopilot/<date>-<slug>/decisions.md`
— every autonomous call, for review/override), the run log, the vetting verdict + research briefing, and
the one-command preview path for the built target (copied from the build skill's close-out). Approval has
shifted from approve-before-each-step to **decide-then-review-after**.

## The decision ledger + run record

Everything for a run lives in **`outputs/autopilot/<YYYY-MM-DD>-<slug>/`** (dated-slug; `-2` for same-day
re-runs), each file opening with RAG frontmatter (see `docs/WIKI-FRONTMATTER.md`):
- **`intake.md`** — the raw gathered answers from the grill (what Phase A reads).
- **`plan.md`** — the confirmed, vetted + researched plan (what Phase C reads).
- **`decisions.md`** — the **ledger**: append-only, stable `ap-YYYYMMDD-NNN` ids (never renumber), one
  anchor line + `why / basis / review` block per call; `type ∈ {assumption|inference|verdict|reshape|override|default}`.
  Plain bullets (not checkboxes — nothing consumes them the way `improve-system` consumes `review-*.md`).
  Records the verdict, any override, and the research outcome.
- **`run.md`** — the append-only step log (newest-first, like `outputs/runs/maintenance-loop.md`).

Run-state lives in `outputs/runs/autopilot.json` (`last_run`, `current_slug`, `phase`, `status`,
`step_index`, counts, error) for resumability. The ledger **links to, never duplicates** the canonical
artifacts the sub-skills author. **`autopilot` writes no `change-log.md` line of its own** — the
sub-skills (including `build-*`'s `applied` line) write theirs; `improve-system` stays the single applier.

## Re-running & edge cases

- **KILL** — handled upfront (reshape / proceed-anyway / stop), before the confirm. A re-run after a
  KILL-**stop** resumes from `autopilot.json` (`status=stopped_kill`) and re-presents that choice rather
  than re-grilling.
- **Research offline** — skip `storm-research` with a logged note; proceed on the roast verdict.
- **Thin goal** — default-with-assumption up to `grill_round_cap`; the worst case is an assumption-heavy
  `plan.md` you correct at the single confirm — never a silent block.
- **Sub-skill failure mid-run** — stop gracefully (log, set `status=failed` + `step_index`); re-invoking
  resumes from the failed step.
- **Re-run / existing artifacts** — offer resume / extend / restart; if a charter/design already exists,
  the grill offers use-as-is / refine / start-fresh (a **fresh** invocation, distinct from a KILL-stop
  resume). Never silently overwrite.

## Rules & guardrails

- **Attended-started, hands-off-executed — NEVER in `maintenance-loop`.** A human starts it and gives the
  single plan-confirm; the unattended cron tick never chains into `autopilot` or the `build-*` skills.
- **Tier 0 — no keys, no accounts, mock data.** No backend, auth, deploy, env, or secrets; nothing is
  collected in chat. Deeper-tier/keyed builds are a later slice. Scaffolding is offline; only the opt-in
  post-run `npm install` needs the network.
- **`improve-system` stays the single applier; `raw/` is immutable.** Autopilot writes only its own run
  folder and drives the sub-skills, which write their own provenance.
- **Delegate grunt work to the `.claude/agents/` fleet** (research → `web-researcher`, etc.) for cheaper,
  safer, consistent work.
- **Be honest.** The ledger + the close-out name every assumption and the deferred tiers.

## Output

A built `app/`|`mobile/`|`plugin/` (themed, mock data), the charter + vetting verdict + research briefing
+ design system the sub-skills wrote, and `outputs/autopilot/<date>-<slug>/` (intake · plan · decisions ·
run) — reached from one goal, one grill, and one confirm.
````

- [ ] **Step 2: Verify DoD**
```bash
cd .claude/skills/autopilot
grep -q "^name: autopilot" SKILL.md && echo NAME_OK
grep -q "argument-hint:" SKILL.md && echo HINT_OK
grep -qi "attended-started" SKILL.md && grep -qi "never.*maintenance" SKILL.md && echo ATTENDED_OK
grep -q "Phase A" SKILL.md && grep -q "Phase B" SKILL.md && grep -q "Phase C" SKILL.md && echo PHASES_OK
grep -qi "KILL" SKILL.md && grep -qi "reshape / proceed-anyway / stop" SKILL.md && echo KILL_OK
grep -q "intake.md" SKILL.md && grep -q "plan.md" SKILL.md && grep -q "decisions.md" SKILL.md && echo LEDGER_OK
grep -q "confidence_chain" SKILL.md && grep -q "build_chain" SKILL.md && grep -q "stop_on_kill" SKILL.md && echo CONFIG_OK
grep -q "web-researcher" SKILL.md && echo FLEET_OK
grep -qi "no `change-log.md` line of its own" SKILL.md && echo SINGLEAPPLIER_OK
```
Expect: NAME_OK HINT_OK ATTENDED_OK PHASES_OK KILL_OK LEDGER_OK CONFIG_OK FLEET_OK SINGLEAPPLIER_OK.

- [ ] **Step 3: Commit**
```bash
git add .claude/skills/autopilot/SKILL.md
git commit -m "feat(autopilot): the autopilot skill (grill → vet+research → confirm → hands-off build)"
```

---

### Task 3: `docs/AUTOPILOT.md`

**Files:**
- Create: `docs/AUTOPILOT.md`

- [ ] **Step 1: Create `docs/AUTOPILOT.md`** with exactly this content:

````markdown
# Building your whole project at once — the `autopilot` skill

`autopilot` is the capstone. Instead of running `define-project`, `roast`, `define-design`, and a
`build-*` skill one at a time — each with its own questions — you describe your goal **once**, get grilled
**once**, confirm **one** plan, and it builds the whole thing hands-off.

## How it works

1. **You describe your goal** — one line, or just start it and it asks.
2. **It grills you once** — a single, fast interview (what you're building, who it's for, how it should
   look, and whether it's a web app / phone app / browser extension), always offering options + a
   recommended pick so it moves quickly.
3. **It vets and researches — upfront** — it runs the `roast` council for a **go / reshape / stop**
   verdict and (when online) a fact-checked research briefing, *before* you commit. If the idea gets a
   **stop (KILL)** verdict, it pauses and asks you what to do.
4. **It shows you one plan** — already vetted and researched — and asks once: *"Build this?"*
5. **It builds hands-off** — designs it, then scaffolds your `app/` / `mobile/` / `plugin/` — no more
   questions.
6. **It hands you a decision log** — every judgment call it made, in `outputs/autopilot/<date>-<slug>/`,
   for you to review after (not before).

## What you end up with

The same things the individual skills make — your charter, a vetting verdict, a design system, and a
built app with mock data — plus the decision log. Preview the app with the one command it prints.

## The one pause

It only stops mid-run for a **stop (KILL)** verdict, and that happens **before** you confirm the plan — so
once you say "go," it runs to the end. Everything else it decides on its own and logs for you.

## What it is (and isn't)

- **User-started, then hands-off.** You start it and confirm the plan; it never runs on its own in the
  background. It is **not** part of the scheduled maintenance loop.
- **Tier 0** — mock data, no keys, no accounts. Real data, accounts, deployment, and app-store / Web-Store
  publishing are later tiers (run the individual skills for those).
- **It reuses your existing skills** — `define-project`, `roast`, `storm-research`, `define-design`, and
  `build-app`/`mobile`/`plugin` — driving each in an automatic mode. Their normal, one-at-a-time behavior
  is unchanged; autopilot just chains them for you, and hands the grunt work to the tuned
  [`.claude/agents/`](SUBAGENTS.md) fleet.

## Re-running

Run it again any time. It resumes a stopped run, or offers to reuse / refine / restart what's already
there — it never silently overwrites your work.

## The journey it completes

define → vet → design → build — now in one go. See [charter](../wiki/charter.md) (once built),
[building your app](BUILD-APP.md), and [the subagent fleet](SUBAGENTS.md) it runs on.
````

- [ ] **Step 2: Verify DoD**
```bash
grep -qi "the capstone" docs/AUTOPILOT.md && grep -qi "hands-off" docs/AUTOPILOT.md && grep -qi "decision log" docs/AUTOPILOT.md && grep -qi "not part of the scheduled maintenance loop" docs/AUTOPILOT.md && echo DOC_OK
```
Expect: DOC_OK.

- [ ] **Step 3: Commit**
```bash
git add docs/AUTOPILOT.md
git commit -m "docs(autopilot): AUTOPILOT.md how-to page"
```

---

### Task 4: The 7 additive `## Autonomous invocation` notes

**Files (append a section to the END of each):**
- Modify: `.claude/skills/define-project/SKILL.md`, `.claude/skills/roast/SKILL.md`,
  `.claude/skills/storm-research/SKILL.md`, `.claude/skills/define-design/SKILL.md`,
  `.claude/skills/build-app/SKILL.md`, `.claude/skills/build-mobile/SKILL.md`,
  `.claude/skills/build-plugin/SKILL.md`

**Context:** Append a new `## Autonomous invocation (driven by `autopilot`)` H2 at the **end of the file**
for each of the 7 sub-skills — additive, leaving all existing content untouched (mirrors the sync skills'
`## Unattended invocation` note). Four skills get a distinct note; the three `build-*` share one identical note.

- [ ] **Step 1: `define-project`** — append at end of `.claude/skills/define-project/SKILL.md`:

````markdown

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` (the capstone orchestrator) rather than a human, do **not** open your
interview or draft-confirm gate — `autopilot` owns the single confirm gate. Read the consolidated intake
at `outputs/autopilot/<date>-<slug>/intake.md`, infer and pick your **recommended defaults** for anything
thin (the same propose-a-default logic you use when a human is vague), flag each `(assumed — confirm later)`
in the charter AND report it to `autopilot` for the decision ledger, then write `wiki/charter.md` +
`raw/project/<date>-discovery.md` and your `change-log.md` line exactly as in attended mode. Do **not**
offer the optional roast (autopilot runs vetting as its own step). On a RESHAPE fold-in, use your existing
pivot mode to update the charter in place. This note is additive — your attended behavior above is
unchanged; `autopilot` is user-initiated and never part of the unattended `maintenance-loop`.
````

- [ ] **Step 2: `roast`** — append at end of `.claude/skills/roast/SKILL.md`:

````markdown

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, build the brief from `wiki/charter.md` (skip your
≤4-question intake batch) and skip the storm-research offer (autopilot runs research as its own step).
Convene the council and return the GO/RESHAPE/KILL verdict exactly as normal — but **hand the KILL/RESHAPE
decision to `autopilot`** rather than prompting, and record the verdict for its decision ledger. The
Researcher persona may run as the `web-researcher` agent (Sonnet + web-restricted), keeping its persona
prompt/output contract. This note is additive — your attended behavior above is unchanged; `autopilot` is
user-initiated and never part of the unattended `maintenance-loop`.
````

- [ ] **Step 3: `storm-research`** — append at end of `.claude/skills/storm-research/SKILL.md`:

````markdown

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, run the STORM pipeline on the vetted idea (from
`wiki/charter.md` + the roast verdict) without an interview. You are **web-gated as always** — if web is
unavailable, **skip with a note** ("research skipped — offline") rather than fabricating; `autopilot`
proceeds on the roast verdict alone. Your lenses and citation verifiers may run as the `web-researcher`
agent (Sonnet + web-restricted), keeping each lens's prompt/output contract. Report the briefing path (or
the skip) to `autopilot` for its decision ledger. This note is additive — your attended behavior above is
unchanged; `autopilot` is user-initiated and never part of the unattended `maintenance-loop`.
````

- [ ] **Step 4: `define-design`** — append at end of `.claude/skills/define-design/SKILL.md`:

````markdown

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, do **not** open your interview or draft-confirm gate —
`autopilot` owns the single confirm gate. Infer the design direction from `wiki/charter.md` + the design
answers in `outputs/autopilot/<date>-<slug>/intake.md`, pick your **recommended defaults** (the archetype
library + token derivation), flag each `(assumed — confirm later)` AND report it to `autopilot` for the
ledger, then write `wiki/design-system.md` + `raw/design/<date>-<slug>/` exactly as attended. Synthesize
from those inputs alone — do **not** wait on a Stitch paste-back (use the MCP only if already configured),
and **never run console-theming** (that stays opt-in attended). This note is additive — your attended
behavior above is unchanged; `autopilot` is user-initiated and never part of the unattended
`maintenance-loop`.
````

- [ ] **Step 5: `build-app`, `build-mobile`, `build-plugin`** — append this **same** note at the end of
  **each** of the three `build-*` SKILL.md files:

````markdown

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, read `wiki/charter.md` + `wiki/design-system.md` + the
latest `outputs/vetting/.../roast-verdict.md` + the confirmed `outputs/autopilot/<date>-<slug>/plan.md`,
and **skip your Phase 2 confirm gate** — `autopilot`'s single plan-confirm already covered it. Any RESHAPE
pivot is already folded into the charter; record any KILL override `autopilot` passes exactly as your
attended mode does. Scaffold **offline** and do **not** run `npm install` (the preview command stays a
post-run offer `autopilot` makes at the end). Flag any `(assumed — confirm later)` choice to `autopilot`
for its decision ledger, and write your `raw/builds/` record + `wiki/build.md` + `change-log.md` line as
usual. This note is additive — your attended behavior above is unchanged; `autopilot` is user-initiated
and never part of the unattended `maintenance-loop` (that rule is untouched).
````

- [ ] **Step 6: Verify DoD**
```bash
for f in define-project roast storm-research define-design build-app build-mobile build-plugin; do
  grep -q "^## Autonomous invocation (driven by \`autopilot\`)" .claude/skills/$f/SKILL.md && echo "$f NOTE_OK" || echo "$f NOTE_FAIL"
done
# additive proof: each skill's original attended anchor is still present
grep -q "^# define-project" .claude/skills/define-project/SKILL.md && grep -q "You are the Contrarian on an idea council" .claude/skills/roast/SKILL.md && grep -q "five expert lenses" .claude/skills/storm-research/SKILL.md && echo ATTENDED_INTACT
grep -q "Build this? I'll create the .app/. folder" .claude/skills/build-app/SKILL.md && echo BUILDAPP_GATE_INTACT
```
Expect: seven `NOTE_OK`, `ATTENDED_INTACT`, `BUILDAPP_GATE_INTACT`.

- [ ] **Step 7: Commit**
```bash
git add .claude/skills/define-project/SKILL.md .claude/skills/roast/SKILL.md .claude/skills/storm-research/SKILL.md .claude/skills/define-design/SKILL.md .claude/skills/build-app/SKILL.md .claude/skills/build-mobile/SKILL.md .claude/skills/build-plugin/SKILL.md
git commit -m "feat(autopilot): additive '## Autonomous invocation' note on the 7 pipeline sub-skills"
```

---

### Task 5: Wire the menu + setup + CLAUDE.md

**Files:**
- Modify: `.claude/skills/what-can-i-do/SKILL.md`
- Modify: `.claude/skills/setup-project/SKILL.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: `what-can-i-do`** — add a TOP menu item. Replace:

```
   - **Get clear on your project** — figure out its goal, who it's for, and what success looks like → runs `define-project`
```

with:

```
   - **Build my whole project for me** — describe it once, come back to a built app → runs `autopilot`
   - **Get clear on your project** — figure out its goal, who it's for, and what success looks like → runs `define-project`
```

- [ ] **Step 2: `setup-project`** — extend the step-8 offer. Replace:

```
   - If `wiki/charter.md` and `wiki/design-system.md` both exist, offer: *"Want me to build a
     first version of your app now? → runs `build-app` (web), `build-mobile` (phone), or `build-plugin` (browser extension)"* (propose-only — never auto-run).
```

with:

```
   - If `wiki/charter.md` and `wiki/design-system.md` both exist, offer: *"Want me to build a
     first version of your app now? → runs `build-app` (web), `build-mobile` (phone), or `build-plugin` (browser extension)"* (propose-only — never auto-run).
   - Or offer the one-go path: *"Want me to do the whole thing — grill you once, vet + research it, then build it hands-off? → runs `autopilot`"* (propose-only — never auto-run).
```

- [ ] **Step 3: `CLAUDE.md`** — add the `autopilot` Skills bullet immediately after the `build-plugin`
  bullet (currently line 83). Replace:

```
- **`build-plugin`** — the browser-extension sibling of `build-app`: turn the charter + design system into a themed **Manifest V3** browser extension (popup + options page) in a new top-level `plugin/` folder (plain Vite+React, like `app/`), previewed in Chrome via **Load unpacked**. Attended, Tier 0 (mock data, no keys/permissions); one confirm gate; re-runnable; **never in the unattended loop**. Packaging + Chrome Web Store are a later tier. See `docs/BUILD-PLUGIN.md`.
```

with:

```
- **`build-plugin`** — the browser-extension sibling of `build-app`: turn the charter + design system into a themed **Manifest V3** browser extension (popup + options page) in a new top-level `plugin/` folder (plain Vite+React, like `app/`), previewed in Chrome via **Load unpacked**. Attended, Tier 0 (mock data, no keys/permissions); one confirm gate; re-runnable; **never in the unattended loop**. Packaging + Chrome Web Store are a later tier. See `docs/BUILD-PLUGIN.md`.
- **`autopilot`** — the capstone: describe your goal once → it grills you once, **vets + researches** it, shows one plan to confirm, then runs `define-project → roast → storm-research → define-design → build-*` **hands-off**, pausing only on a KILL verdict; logs every call to `outputs/autopilot/<date>-<slug>/`; delegates grunt work to the `.claude/agents/` fleet. **Attended-started, hands-off-executed — never in `maintenance-loop`.** Tier 0. See `docs/AUTOPILOT.md`.
```

- [ ] **Step 4: Verify DoD**
```bash
grep -q "Build my whole project for me" .claude/skills/what-can-i-do/SKILL.md && echo MENU_OK
grep -q "autopilot" .claude/skills/setup-project/SKILL.md && grep -qi "propose-only" .claude/skills/setup-project/SKILL.md && echo SETUP_OK
grep -q '`autopilot`' CLAUDE.md && echo BULLET_OK
LINES=$(wc -l < CLAUDE.md); echo "CLAUDE.md lines: $LINES"; [ "$LINES" -lt 125 ] && echo CAP_OK
```
Expect: MENU_OK SETUP_OK BULLET_OK CAP_OK (lines < 125).

- [ ] **Step 5: Commit**
```bash
git add .claude/skills/what-can-i-do/SKILL.md .claude/skills/setup-project/SKILL.md CLAUDE.md
git commit -m "feat(autopilot): wire into what-can-i-do, setup-project, CLAUDE.md"
```

---

### Task 6: `README.md` + `docs/USING-THIS-FOR-ANY-PROJECT.md`

**Files:**
- Modify: `README.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`

- [ ] **Step 1: README — "What you get" bullet.** After the `🛠️ **Built for you**` bullet (line 43),
  insert (before the `🤖 **Sharp under the hood**` bullet):

```
- 🚀 **Or do it all in one go** — say **"build my whole project"** and it grills you once, vets + researches the idea, confirms one plan, then builds it end-to-end hands-off — pausing only if the idea gets a "stop" verdict (see [autopilot](docs/AUTOPILOT.md)).
```

- [ ] **Step 2: README — docs table.** After the `[Subagents](docs/SUBAGENTS.md)` row (line 61), add:

```
| [Autopilot](docs/AUTOPILOT.md) | Describe your goal once — it vets, designs, and builds end-to-end. |
```

- [ ] **Step 3: README — build-status.** After the Phase 14 line (line 133), add:

```
- Phase 15 — `autopilot`: describe once → grill + vet + research + confirm → hands-off design+build (the capstone) ✅
```

- [ ] **Step 4: USING — one line.** After the `**Then build it:**` paragraph (line 30), insert a new
  paragraph (before the `**Under the hood:**` line):

```
**Or do it all in one go:** run **`autopilot`** — describe your goal once and it grills you, vets + researches the idea, shows you one plan to confirm, then runs the whole define→vet→design→build chain hands-off (pausing only on a "stop" verdict), logging every call for you to review after. Tier 0; user-initiated, never unattended. See `docs/AUTOPILOT.md`.
```

- [ ] **Step 5: Verify DoD**
```bash
grep -q "AUTOPILOT.md" README.md && grep -q "Phase 15" README.md && grep -qi "build my whole project" README.md && echo README_OK
grep -q "autopilot" docs/USING-THIS-FOR-ANY-PROJECT.md && echo USING_OK
```
Expect: README_OK USING_OK.

- [ ] **Step 6: Commit**
```bash
git add README.md docs/USING-THIS-FOR-ANY-PROJECT.md
git commit -m "docs(autopilot): surface the one-go path in README + USING"
```

---

### Task 7: Phase 15 addendum to the master design spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`

- [ ] **Step 1:** Find the `## Phase 14 addendum` section (ends ~line 322) and append a **Phase 15
  addendum** after it, in the same single-dense-paragraph voice/format (with the `(2026-07-01)` date
  suffix). Cover: Phase 15 = the `autopilot` capstone — a user-initiated, then hands-off orchestrator that
  chains grill → `define-project` → `roast` (vet) → `storm-research` (research) UPFRONT → a single
  plan-confirm → hands-off `define-design` → `build-<target>`, pausing only on a KILL verdict (surfaced
  pre-confirm); the additive `## Autonomous invocation` note on the 7 sub-skills (infer defaults, flag
  `(assumed — confirm later)`, skip their own gate — attended behavior byte-for-byte unchanged); the
  decision ledger in `outputs/autopilot/<date>-<slug>/` (intake/plan/decisions/run) with approval shifted
  to decide-then-review-after; that it **delegates grunt work to the Phase 14 fleet** and is
  **attended-started, hands-off-executed, NEVER in `maintenance-loop`** (the reconciliation of the build-*
  "never unattended" rule); Tier 0 (no keys/accounts); `improve-system` single-applier + `raw/`
  immutability untouched; and the later tiers (loop-in improve/advise, multi-target, deeper/keyed,
  silent-no-grill). Point to `docs/AUTOPILOT.md` and `docs/superpowers/specs/2026-07-01-autopilot-design.md`.

- [ ] **Step 2: Verify DoD**
```bash
grep -q "Phase 15 addendum" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && grep -q "autopilot" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && echo ADDENDUM_OK
```
Expect: ADDENDUM_OK.

- [ ] **Step 3: Commit**
```bash
git add docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md
git commit -m "docs(autopilot): Phase 15 addendum in the master design spec"
```

---

### Task 8: Final verification (additive-only + no-pollution)

**Files:** none (verification only).

- [ ] **Step 1: No real run artifacts / apps committed.**
```bash
test ! -e app && test ! -e mobile && test ! -e plugin && echo NO_APPS_OK
test ! -e wiki/charter.md && test ! -e wiki/design-system.md && test ! -e wiki/build.md && echo NO_NORTHSTARS_OK
ls outputs/autopilot | grep -v '^\.gitkeep$' | grep -q . && echo "POLLUTION: real run dir" || echo NO_RUNDIR_OK
test ! -e outputs/runs/autopilot.json && echo NO_RUNSTATE_OK
git status --porcelain   # expect clean
```
Expect: NO_APPS_OK, NO_NORTHSTARS_OK, NO_RUNDIR_OK, NO_RUNSTATE_OK, clean tree.

- [ ] **Step 2: Invariants + additive-only.**
```bash
# maintenance-loop + improve-system byte-for-byte unchanged (expect EMPTY)
git diff --name-only main..HEAD -- .claude/skills/maintenance-loop .claude/skills/improve-system raw
# the 7 sub-skills changed ONLY by the appended note (their attended anchors intact — spot check)
grep -q "Build this? I'll create the .mobile/. folder" .claude/skills/build-mobile/SKILL.md && grep -q "Build this? I'll create the .plugin/. folder" .claude/skills/build-plugin/SKILL.md && echo BUILD_GATES_INTACT
grep -q "Does this look right" .claude/skills/define-project/SKILL.md && grep -q "Does this look right" .claude/skills/define-design/SKILL.md && echo DEFINE_GATES_INTACT
```
Expect: EMPTY diff for maintenance-loop/improve-system/raw; BUILD_GATES_INTACT; DEFINE_GATES_INTACT.

- [ ] **Step 3: Only intended files changed + cap.**
```bash
git diff --name-only main..HEAD | sort
LINES=$(wc -l < CLAUDE.md); echo "CLAUDE.md: $LINES"; [ "$LINES" -lt 125 ] && echo CAP_OK
```
Expect exactly: created `.claude/skills/autopilot/{SKILL.md,config.json}`, `docs/AUTOPILOT.md`,
`outputs/autopilot/.gitkeep`; modified the 7 sub-skills, `.claude/skills/{what-can-i-do,setup-project}/SKILL.md`,
`CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` + the 2 session spec/plan docs. Nothing
else; CAP_OK.

- [ ] **Step 4:** No commit (verification only). Proceed to the final gates (Claude whole-branch review +
  Codex `codex review --base main`), then `finishing-a-development-branch`. Merge/push only on the user's
  explicit request.

---

## Notes for the executor
- **DRY/YAGNI:** ship exactly the spec — no extra features, no real run.
- **Voice:** the SKILL.md mirrors the build-* skills; `docs/AUTOPILOT.md` mirrors the plain, welcoming
  `docs/BUILD-APP.md`.
- **Additive is load-bearing:** the 7 `## Autonomous invocation` notes only ADD; never remove or reword a
  sub-skill's attended interview/gates. **Never** touch `maintenance-loop`/`improve-system`.
- **Do NOT run `autopilot`** for real against this template at any point.
- After all tasks: dispatch a final whole-branch Claude review, run the Codex gate, then use
  `finishing-a-development-branch`. Merge/push only on the user's explicit request.
