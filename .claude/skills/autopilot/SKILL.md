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
- `build_chain` (default `["define-design","build-<target>"]`) — the HANDS-OFF phase, after the gate; the `build-<target>` step resolves to the target-specific skill `build-app` | `build-mobile` | `build-plugin` chosen in the grill (there is no skill literally named `build`).
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
1. **`define-design` (autonomous)** — infer the direction from the confirmed `plan.md` + the charter + the intake's design answers;
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
