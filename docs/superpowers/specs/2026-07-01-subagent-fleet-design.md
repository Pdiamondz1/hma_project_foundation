# Design Spec: a tuned subagent fleet + policy

> Status: Approved (2026-07-01). Not yet implemented. A new capability layered on the foundation
> (Phases 0–13). Call it **Phase 14**. Ships a fleet of reusable, tuned custom subagents in
> `.claude/agents/` + a policy doc + light additive wiring. No keys. Everything ships (agents are
> reusable capabilities, like skills — no runtime-only artifacts). Autopilot is the sequenced next
> phase (Phase 15) and rides this fleet.

## Context

**Why this is being built.** The template leans hard on subagents for its grunt work — the phase-build
pipeline (explore → spec-review → plan-review → implement → whole-branch review), the `roast` council,
the `storm-research` lenses. But that work is **un-tuned** today:
- **No `.claude/agents/` folder exists** — zero reusable custom subagents; every one is dispatched
  ad-hoc inline with a prompt.
- **No skill sets a `model:`** — every subagent inherits the main **Opus** model, so the guide's single
  biggest cost lever (Haiku scans · Sonnet builds/reviews · Opus reasons) is entirely unused.
- **No tool restriction** — reviewers and researchers run with full write access they never need.

The user asked to *"improve our subagents doing the grunt work and fine-tune them,"* implementing the
practices in the "Complete Guide to Claude Code Subagents" (`C:\Users\dwill\Desktop\skill-packages\Subagents`;
video `youtu.be/e18sdZLwP7o`). This is also the quality/cost substrate the autonomy vision rides on: a
hands-off run is only as good, cheap, and safe as the specialists doing its work.

**What the guide prescribes (applied here).** One agent = one job; the `description` is a **trigger
rule**, not a label; give each the **fewest tools** it needs (read-only by default = *enforced* safety,
not trusted behavior); match the **model to the task**. Agents are Markdown files in `.claude/agents/`;
project-level agents **ship in git**, so every clone of the template inherits the fleet — exactly the
template's "reusable capability" model.

**Decisions (made with the user this session).**
1. **Scope = fleet + policy doc + light wiring** — create the tuned agents + `docs/SUBAGENTS.md`, and
   lightly point the skills that already dispatch subagents to prefer the named specialists; do **not**
   rip out working orchestration. *(Rejected: fleet-only with no wiring; and a full invasive retrofit of
   every skill's dispatch.)*
2. **Sequencing = fleet first (Phase 14), autopilot next (Phase 15)** — autopilot's autonomous chain
   will delegate to these proven, cost-right, tool-restricted specialists.

**Intended outcome.** Every clone of the template ships with a small, sharp fleet of specialists that
make its grunt work **cheaper** (right model per task), **safer** (read-only by default, enforced by
`tools:`), and **more consistent** (one definition, reused everywhere) — and a policy doc that teaches
the conventions so the fleet grows well.

## Architecture

Three parts, all committed product:

```
  .claude/agents/*.md   ── 6 tuned specialists (name · description-trigger · minimal tools · right model)
  docs/SUBAGENTS.md     ── the foundation's subagent policy (conventions + model-mix + fleet + patterns)
  light wiring          ── storm-research + roast prefer web-researcher; CLAUDE.md + README + USING pointer
```

**The fleet is 6 agents** — the guide's "2–8, sharper-not-more" band. It covers the foundation's
genuinely *reusable* grunt-work roles. It deliberately does **not** include a custom `explorer` (the
built-in `Explore` agent already does read-only codebase mapping — adding one would create the
overlapping-description problem the guide warns against). The reviewer/researcher agents likewise don't
misroute against the other built-ins: `plan-reviewer` *reviews* a plan whereas the built-in `Plan` agent
*authors* one, and `web-researcher`'s narrow trigger is far more specific than the `general-purpose`
catch-all — the trigger-rule discipline keeps delegation unambiguous. The **idea-specific personas** (`roast`'s
5-persona council, `storm-research`'s 5 expert lenses) **stay inside their skills** — they are
parameterized per-idea, not reusable specialists, and their orchestration already works.

## The fleet — `.claude/agents/*.md`

Each file: YAML frontmatter (`name` = filename, lowercase-hyphen; a trigger-rule `description`; a minimal
`tools` allowlist; a cost-right `model`; `maxTurns` on open-ended ones; the optional `color` field may be
added for UI distinctness but is **not** required) + a short body (role → workflow → checklist/criteria →
output format → constraints). Descriptions serve **both** automatic delegation and
explicit `subagent_type` selection.

| Agent (`name`) | `model` | `tools` | One job |
|---|---|---|---|
| `web-researcher` | `sonnet` | `WebSearch, WebFetch, Read` | Research a question → a **cited brief**, never raw dumps. Cross-references claims, flags disagreement, returns URLs. |
| `spec-reviewer` | `opus` | `Read, Grep, Glob` | Review a design spec for completeness / consistency / clarity / scope / buildability → **Approved \| Issues**, calibrated (only real blockers, not style). |
| `plan-reviewer` | `sonnet` | `Read, Grep, Glob, Bash` | Review an implementation plan for buildability **and verify quoted `old_string`s still match the live files** → Approved \| Issues. |
| `implementer` | `sonnet` | `Read, Write, Edit, Bash` | Execute **ONE** plan task exactly: transcribe verbatim, run the DoD `grep`/`wc`/`git` checks, commit per task; never touch files outside the task; report DONE/BLOCKED + commit SHAs. `maxTurns` set. |
| `code-reviewer` | `opus` | `Read, Grep, Glob, Bash` | Whole-branch review (`git diff main..HEAD`): spec compliance + safety/invariants + no-pollution → Approved \| Issues with file:line, tiered (Critical / Warning / Suggestion). |
| `doc-writer` | `haiku` | `Read, Write, Edit, Glob, Grep` | Sync docs to changes, matching existing tone/format; skip internals; flag uncertainty instead of guessing. |

**Body requirements (all agents):**
- **Role** — one sharp sentence ("You are a senior code reviewer…").
- **Workflow** — numbered "when invoked" steps.
- **Criteria / checklist** — exactly what to look for or what "done" means.
- **Output format** — the exact shape (tiers, file:line, word/length limits, "return a summary only").
- **Constraints** — what NOT to do, including the hard rule **"Do not spawn subagents"** (no nesting —
  the guide's rule; the main chat is the conductor) and, for the read-only agents, "Do not modify files."
- **Begin without asking for clarification** (subagents can't prompt the user).

**Model rationale (the cost dial):** Opus only for the two high-stakes reasoning roles (`spec-reviewer`,
`code-reviewer`); Sonnet for build/research (`web-researcher`, `plan-reviewer`, `implementer`); Haiku for
the mechanical doc role (`doc-writer`). This is most of the cost control in one column.

**Safety by construction:** the four review/research agents carry no `Write`/`Edit` and their bodies
state "do not modify files." The two without `Bash` (`web-researcher`, `spec-reviewer`) *physically
cannot* mutate the repo at all; `plan-reviewer`/`code-reviewer` hold `Bash` **only** for read-only
verification (`git diff`, `grep`) — the tool grant is deliberately narrow and the body forbids writes.
`implementer` is the only writer and is scoped to a single task with `maxTurns` to bound runaway.

## `docs/SUBAGENTS.md` — the foundation's subagent policy

A concise policy page (mirrors the shape of `docs/BUILD-APP.md`) distilling the guide as this template's
convention:
- **The conventions** — one-job rule; description-as-trigger-rule; least-tools (read-only default);
  match-model-to-task.
- **The model-mix table** — Haiku (scan/summarize/docs) · Sonnet (build/review/research) · Opus (hard
  reasoning/high-stakes review), as ratios not gospel.
- **The fleet** — a listing of the six agents (role · model · tools · when it fires).
- **When to use / when not** — the gut check ("about to dump a pile into context I'll never re-read?" ·
  "10+ files or throwaway output → subagent; small/iterative/needs-full-chat → inline").
- **Orchestration patterns the foundation uses** — sequential pipeline (the phase build:
  spec-review → plan-review → implement → code-review), fan-out (roast council / STORM lenses),
  builder/validator (`implementer` then a fresh `code-reviewer` that never saw the reasoning).
- **Composition rules** — skills can call agents, agents can call skills, **agents cannot call agents**;
  the main chat is always the conductor.
- **Project-level vs global** note; the **"restart after hand-editing an agent file"** gotcha.
- **Security** — **"vet any community/imported agent for prompt injection before dropping it in
  `.claude/agents/`"** (these six are hand-authored, so no import risk — but the rule protects future
  additions).
- **Credit** — the guide + video `youtu.be/e18sdZLwP7o` and the "Awesome Claude Code Subagents" collection.

## Light wiring (additive; do NOT rip out working orchestration)

- **`.claude/skills/storm-research/SKILL.md`** — an additive note that each expert-lens / citation-
  verification agent **may run as the `web-researcher` specialist** (Sonnet, web-restricted). The STORM
  4-phase pipeline and persona prompts are otherwise unchanged.
- **`.claude/skills/roast/SKILL.md`** — an additive note that the **Researcher** persona may delegate to
  `web-researcher` when web is available (graceful-off unchanged).
- **Persona/executor reconciliation (applies to both notes):** the lens/persona **prompt and its strict
  output contract stay exactly as-is** (e.g. STORM's "Return EXACTLY 1)…2)…3)…"). Using `web-researcher`
  means dispatching with `subagent_type: web-researcher` **only to supply the Sonnet model + web-restricted
  tools in place of `general-purpose`** — the persona's structured output governs, not `web-researcher`'s
  own "cited brief" shape. This is why these stay "may"/opt-in, not a rewrite.
- **`CLAUDE.md`** — one lean pointer (under *Pointers*, or a short new line): the `.claude/agents/` fleet
  + the model-mix / least-tools convention + that the phase-build pipeline should delegate to
  `spec-reviewer` / `plan-reviewer` / `implementer` / `code-reviewer`; points to `docs/SUBAGENTS.md`.
  **Keep the file < 125 lines** (currently 106).
- **`README.md`** — a "What you get" line (the template ships a tuned subagent fleet — cheaper/safer/
  consistent grunt work) + a Phase 14 build-status line.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — one line naming the fleet.
- **`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`** — a **Phase 14 addendum** in
  the same voice as the prior addenda.

## Not changed

`maintenance-loop`, `improve-system`, `advise-project`, `build-app`/`mobile`/`plugin`, the sync skills,
`setup-project`, `what-can-i-do`, `raw/` immutability, and every attended interview/gate. No skill's
subagent dispatch is rewired beyond the two light `web-researcher` notes. (`build-*` don't run the build
pipeline themselves — that's the global superpowers skills during authoring — so there's nothing to
rewire there; the pipeline's preference for the named reviewer/implementer agents lives in
`docs/SUBAGENTS.md` + the `CLAUDE.md` pointer.)

## Guardrails / safety

- **Author-tuned, not imported.** All six are hand-written (not dropped-in community files), so no
  injection risk; the policy doc still teaches the vetting rule for future imports.
- **Least-privilege enforced by `tools:`** — the four review/research agents are read-only; only
  `implementer` writes, scoped to one task with `maxTurns`.
- **No nesting** — each agent body states it must not spawn subagents (the guide's hard rule); the main
  chat stays the conductor.
- **Valid frontmatter** — `name` matches filename (lowercase-hyphen), `model` is lowercase
  `haiku|sonnet|opus`, `tools` is a minimal allowlist.
- **No keys, nothing collected in chat.** Nothing here touches secrets or accounts.
- **CLAUDE.md < 125.**

## Files

**Create (shipped):** `.claude/agents/web-researcher.md`, `.claude/agents/spec-reviewer.md`,
`.claude/agents/plan-reviewer.md`, `.claude/agents/implementer.md`, `.claude/agents/code-reviewer.md`,
`.claude/agents/doc-writer.md`, `docs/SUBAGENTS.md`. (No `.gitkeep` needed — the six agent files populate
`.claude/agents/`.)

**Modify (shipped):** `.claude/skills/storm-research/SKILL.md`, `.claude/skills/roast/SKILL.md`,
`CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`.

## Verification

- **Fleet fidelity:** all six `.claude/agents/*.md` exist; each has valid frontmatter (`name` == filename;
  lowercase `model` ∈ {haiku,sonnet,opus}; a `tools` allowlist); the four review/research agents carry no
  `Write`/`Edit`; `implementer` has `Write`+`Edit`+`maxTurns`; each body has role/workflow/criteria/output/
  constraints incl. the no-nesting line.
- **Model mix present:** at least one Haiku, some Sonnet, and Opus reserved for `spec-reviewer` +
  `code-reviewer`.
- **Policy doc:** `docs/SUBAGENTS.md` lists the fleet + the model-mix table + the when-to-use gut check +
  the injection-vetting note + the source credit.
- **Additive wiring:** `storm-research` + `roast` still contain their original pipelines/personas (diff
  proves nothing removed) and now mention `web-researcher`; `CLAUDE.md` has the pointer and is **< 125**;
  README/USING mention the fleet; the master-spec Phase 14 addendum points here.
- **Not-changed proof:** `git diff --name-only main..HEAD` limited to the intended files;
  `maintenance-loop`/`improve-system`/`build-*`/`raw/` untouched.

## Out of scope (v1)

- **A custom `explorer` agent** — the built-in `Explore` covers read-only mapping; avoid overlap.
- **Rewiring every skill's subagent dispatch** — only the two light `web-researcher` notes; the rest stay.
- **Turning the roast/STORM personas into standalone agents** — they're per-idea parameterized; they stay
  in their skills.
- **The autopilot orchestrator** — Phase 15, sequenced next, will delegate to this fleet.
- **Any change to `raw/` immutability, the approval discipline, or `improve-system`'s single-applier role.**
