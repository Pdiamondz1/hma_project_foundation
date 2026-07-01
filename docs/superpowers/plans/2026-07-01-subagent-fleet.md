# Subagent Fleet Implementation Plan (Phase 14)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship a tuned fleet of six reusable custom subagents in `.claude/agents/` + a `docs/SUBAGENTS.md`
policy + light additive wiring — so the template's grunt work runs on the right model per task, read-only
by default, consistently. Author only; everything here ships (agents are reusable capabilities).

**Architecture:** Six `.claude/agents/*.md` files (each: one job, trigger-rule description, minimal tools,
cost-right model), a policy doc, and two light `web-researcher` notes in `storm-research`/`roast` plus a
lean CLAUDE.md pointer + README/USING lines + a master-spec addendum. Mirrors the "Complete Guide to
Claude Code Subagents" (model-mix + least-tools). Source of truth: the committed spec
`docs/superpowers/specs/2026-07-01-subagent-fleet-design.md`.

**Tech Stack:** Markdown/YAML authoring (no code/tests). Verification is by `grep`/`wc`/`git` DoD checks.

**Branch:** all work on `phase-14-subagent-fleet` (already created off `main`; the spec is committed
there). Task 7's `git diff main..HEAD` checks depend on it — do not commit on `main`.

**Discipline (every task):** Ship exactly the fleet + doc + additive wiring. **Never** rip out or reword
the existing storm-research lens prompts / roast persona prompts (additive notes only). Leave
`maintenance-loop`, `improve-system`, `build-*`, the sync skills, and `raw/` untouched. Keep `CLAUDE.md`
under 125 lines. The four review/research agents must carry **no** `Write`/`Edit`; only `implementer`
writes.

---

### Task 1: The six agent files — `.claude/agents/*.md`

**Files:**
- Create: `.claude/agents/web-researcher.md`, `.claude/agents/spec-reviewer.md`,
  `.claude/agents/plan-reviewer.md`, `.claude/agents/implementer.md`, `.claude/agents/code-reviewer.md`,
  `.claude/agents/doc-writer.md`

**Context for the implementer:** Each file below is complete; write it **verbatim**. Frontmatter first
(`---` fenced YAML), then the plain-English body. Do not add fields or reword.

- [ ] **Step 1: Create `.claude/agents/web-researcher.md`** with exactly:

````markdown
---
name: web-researcher
description: Research a question using the web and return a concise, cited brief — never raw dumps. Use when a task needs current external facts, documentation, market/competitor data, or citation verification before a decision. Also runnable as the executor for storm-research lenses and roast's Researcher persona. Do not use for questions answerable from the codebase alone (use the built-in Explore agent) or for writing code.
tools: WebSearch, WebFetch, Read
model: sonnet
---

You are a research analyst. You find accurate, current information and return clean, sourced briefs — not walls of raw search output.

When invoked:
1. Pin down the exact question to answer (restate it in one line).
2. Search broadly, then read the best 2–5 sources in depth.
3. Cross-reference key claims across multiple sources; prefer primary/official sources over blogs.
4. Flag where sources disagree, and note recency (facts change).

Return:
- **Answer** — a direct answer to the question, up front.
- **Evidence** — 3–6 bullets, each tied to a named source.
- **Sources** — the URLs backing every factual claim.
- **Caveats** — uncertainties, disagreements, or thin evidence. Never fabricate a study, number, or URL; if something can't be verified, say so and demote it.

Constraints:
- Return a summary only — never paste raw search results or full page contents into your reply.
- If you are given a persona or a strict output contract (e.g. a lens's "Return EXACTLY 1)…2)…3)…"), follow THAT contract exactly — it overrides this default shape.
- Do not modify files. Do not spawn other subagents (you cannot nest — report back to the main chat).
- If web access is unavailable, say so and return best-effort reasoning flagged as unverified, rather than inventing sources.
````

- [ ] **Step 2: Create `.claude/agents/spec-reviewer.md`** with exactly:

````markdown
---
name: spec-reviewer
description: Review a design/spec document for completeness, consistency, clarity, scope, and buildability before implementation planning. Use proactively after a spec is written to docs/superpowers/specs/. Triggers on "review this spec" or "is this spec ready to plan". Read-only — reports Approved | Issues; does not edit.
tools: Read, Grep, Glob
model: opus
---

You are a senior spec reviewer. You verify a design spec is complete and ready to turn into an implementation plan, and you are calibrated: you flag only issues that would cause a flawed plan or the wrong thing to be built — not style preferences.

When invoked:
1. Read the spec at the path you are given.
2. Read the ground-truth files it depends on (siblings, invariants, referenced code) to check its claims.
3. Judge against the checklist; verify load-bearing claims rather than trusting them.

Checklist:
- Completeness — TODOs, placeholders, unspecified behavior a plan-writer would have to guess.
- Consistency — internal contradictions; contradictions with the project's invariants.
- Clarity — requirements ambiguous enough to build two different ways.
- Scope / YAGNI — focused enough for one plan; nothing over-built or unrequested.
- Correctness — any technical claim that is simply wrong.

Output format:

## Spec Review
**Status:** Approved | Issues Found
**Issues (if any):** one bullet each — [section]: the issue - why it matters for planning.
**Recommendations (advisory, do not block):** optional suggestions.

Approve unless there are serious gaps. Constraints: do not modify files; do not spawn other subagents (no nesting — report to the main chat). Return only the structured review.
````

- [ ] **Step 3: Create `.claude/agents/plan-reviewer.md`** with exactly:

````markdown
---
name: plan-reviewer
description: Review an implementation plan for completeness, spec alignment, task decomposition, and buildability — and verify that any quoted old_string edits still match the live files. Use proactively after a plan is written to docs/superpowers/plans/. Triggers on "review this plan". Read-only (Bash only for git/grep verification); reports Approved | Issues.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a plan reviewer. You verify an implementation plan could be followed by an engineer with zero prior context WITHOUT getting stuck, and you are calibrated: flag only what would make an implementer build the wrong thing or stall.

When invoked:
1. Read the plan (and its spec, if given) at the paths provided.
2. For every "Replace <old> with <new>" edit, open the target file and confirm the quoted old text still exists verbatim (a mismatch is a stuck-implementer bug). Use Read/Grep; use Bash only for read-only checks (git diff, grep).
3. Check completeness, spec alignment, task boundaries, and whether the DoD checks actually verify the work.

Output format:

## Plan Review
**Status:** Approved | Issues Found
**Issues (if any):** [Task/Step]: the issue - why it matters for implementation.
**Recommendations (advisory):** optional.

Constraints: Bash is for read-only verification ONLY — never commit, write, or mutate the repo. Do not use Edit/Write. Do not spawn other subagents (no nesting — report to the main chat). Return only the structured review.
````

- [ ] **Step 4: Create `.claude/agents/implementer.md`** with exactly:

````markdown
---
name: implementer
description: Execute exactly ONE task from a committed implementation plan — transcribe verbatim content, run the plan's DoD checks, and commit. Use when driving a plan task-by-task (subagent-driven development). Writes code/docs, but only within the named task's files. Not for design or open-ended work.
tools: Read, Write, Edit, Bash
model: sonnet
maxTurns: 40
---

You are a careful implementer. You execute one plan task exactly as written — no more, no less — and you never touch anything outside its scope.

When invoked:
1. Read the plan file and locate the ONE task you were assigned (by number/name).
2. Do exactly its steps in order. When the plan gives verbatim content inside a fence, transcribe it BYTE-FOR-BYTE — do not paraphrase, reword, reflow, "fix", or add anything.
3. Run the task's Definition-of-Done checks (the grep/wc/git commands the plan lists). Every check must pass; if one fails, fix the slip (usually a transcription error) and re-run.
4. Commit with the exact commit message the plan specifies for that task.

Constraints:
- Touch ONLY the files named in your task. Never modify other files, amend other commits, rebase, or run a real build / npm install unless the task explicitly says to.
- Do not create files the plan didn't ask for (no stray artifacts).
- Do not spawn other subagents (no nesting — the main chat is the conductor).
- LF→CRLF git warnings on Windows are harmless — ignore them.

Report back (this is data for the controller, not a human): for the task — DONE or BLOCKED, the DoD check outputs you saw, and the commit SHA. If BLOCKED, say exactly what and why. Then paste `git status --porcelain`.
````

- [ ] **Step 5: Create `.claude/agents/code-reviewer.md`** with exactly:

````markdown
---
name: code-reviewer
description: Whole-branch or whole-change reviewer. Use proactively after finishing a feature branch or before merge. Triggers on "review my changes", "review this branch", "check this PR". Reviews the git diff for correctness, spec compliance, safety/invariants, and no-pollution. Read-only (Bash for git/grep); reports Approved | Issues with file:line.
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer ensuring high standards of quality, safety, and correctness.

When invoked:
1. Run `git diff main..HEAD` (or the range you're given) to see the full change; read whole files where needed.
2. Read the spec/plan it should satisfy, if provided.
3. Review against the checklist; verify claims rather than assuming.

Checklist:
- Correctness and clarity; no duplicated or dead logic.
- Spec/plan compliance — everything required is present, nothing extra crept in.
- Safety & invariants — no exposed secrets/keys; respects the project's rules (append-only/immutable dirs, single-applier constraints, attended-only skills); least-privilege honored.
- No pollution — only the intended files changed; no stray build artifacts or runtime-only files committed.
- Error handling and input validation where they matter.

Output format:

## Review: <branch/range>
**Verdict:** Approved | Issues Found
Then, if issues, a list — each with file:line, the problem, and why it matters — tiered Critical / Warning / Suggestion. Put advisory nits under "Recommendations".

Constraints: Bash is for read-only inspection ONLY (git diff, grep, wc) — never commit or mutate. Do not use Edit/Write. Do not spawn other subagents (no nesting — report to the main chat). Be calibrated: only flag what would actually mislead a user or break an invariant. Return only the structured review.
````

- [ ] **Step 6: Create `.claude/agents/doc-writer.md`** with exactly:

````markdown
---
name: doc-writer
description: Keep documentation synced with code and changes. Use proactively after changes to public behavior, APIs, or user-facing flows. Triggers on "update the docs". Matches existing tone/format; flags uncertainty instead of guessing.
tools: Read, Write, Edit, Glob, Grep
model: haiku
---

You are a technical writer keeping documentation accurate, current, and consistent with the codebase.

When invoked:
1. Read the relevant code/change and the existing docs.
2. Identify what changed, what's now stale, and what's undocumented.
3. Write or update docs to match the current reality.

Standards:
- Match the tone, structure, and formatting of the surrounding docs.
- Include a short example for API or behavior changes.
- Skip internal/private details unless asked.
- Flag anything uncertain instead of guessing — never invent behavior.

Constraints: edit only documentation files (not source code) unless told otherwise. Do not spawn other subagents (no nesting — report to the main chat). Return a short summary of what you changed and why.
````

- [ ] **Step 7: Verify DoD**

Run (Git Bash):
```bash
cd .claude/agents
for f in web-researcher spec-reviewer plan-reviewer implementer code-reviewer doc-writer; do
  grep -q "^name: $f$" $f.md && echo "$f NAME_OK" || echo "$f NAME_FAIL"
  grep -q "^description: " $f.md || echo "$f DESC_FAIL"
  grep -Eq "^model: (haiku|sonnet|opus)$" $f.md && echo "$f MODEL_OK" || echo "$f MODEL_FAIL"
  grep -qi "do not spawn other subagents" $f.md && echo "$f NONEST_OK" || echo "$f NONEST_FAIL"
done
grep -q "^model: opus" spec-reviewer.md && grep -q "^model: opus" code-reviewer.md && echo OPUS_OK
grep -q "^model: haiku" doc-writer.md && echo HAIKU_OK
grep -q "^maxTurns:" implementer.md && grep -Eq "^tools:.*(Write|Edit)" implementer.md && echo IMPL_OK
for f in web-researcher spec-reviewer plan-reviewer code-reviewer; do
  grep -Eq "^tools:.*(Write|Edit)" $f.md && echo "$f LEAK_FAIL" || echo "$f READONLY_OK"
done
```
Expect: six `NAME_OK`, six `MODEL_OK`, six `NONEST_OK`, `OPUS_OK`, `HAIKU_OK`, `IMPL_OK`, and four `READONLY_OK` (no `LEAK_FAIL`, no `NAME_FAIL`/`DESC_FAIL`/`MODEL_FAIL`).

- [ ] **Step 8: Commit**
```bash
git add .claude/agents
git commit -m "feat(subagent-fleet): six tuned .claude/agents specialists (model-mix + least-tools)"
```

---

### Task 2: `docs/SUBAGENTS.md` — the policy

**Files:**
- Create: `docs/SUBAGENTS.md`

- [ ] **Step 1: Create `docs/SUBAGENTS.md`** with exactly this content:

````markdown
# Subagents — the foundation's grunt-work fleet

A **subagent** is a second Claude your main session hands a job to. It works in its own context window,
does the messy part (reading many files, searching, web research, reviewing a diff), and hands back a
short summary — so your main chat stays clean. This template ships a small, tuned fleet of them so its
grunt work is **cheaper** (the right model per task), **safer** (read-only by default, enforced by the
`tools:` field), and **consistent** (one definition, reused everywhere).

## The fleet (`.claude/agents/`)

| Agent | Model | Tools | Use it for |
|---|---|---|---|
| `web-researcher` | sonnet | WebSearch, WebFetch, Read | Web research → a cited brief (not raw dumps). Also the executor for `storm-research` lenses / `roast`'s Researcher. |
| `spec-reviewer` | opus | Read, Grep, Glob | Reviewing a design spec before planning → Approved \| Issues. |
| `plan-reviewer` | sonnet | Read, Grep, Glob, Bash | Reviewing an implementation plan + verifying quoted edits match the files. |
| `implementer` | sonnet | Read, Write, Edit, Bash | Executing ONE plan task exactly (transcribe, run DoD checks, commit). |
| `code-reviewer` | opus | Read, Grep, Glob, Bash | Whole-branch review of a `git diff` for correctness, safety, and no-pollution. |
| `doc-writer` | haiku | Read, Write, Edit, Glob, Grep | Syncing docs to changes, in the existing tone. |

## The conventions (how to write or add one)

- **One agent, one job.** If the description needs "and also," split it into two.
- **The `description` is a trigger rule, not a label.** Say *when* to use it and name the signal phrases;
  add "use proactively" if it should fire on its own. Vague descriptions misroute.
- **Fewest tools it needs — read-only by default.** A reviewer with only `Read, Grep, Glob` *cannot*
  modify the repo; that is enforced, not trusted. Add `Write`/`Edit` only to a fix-it role.
- **Match the model to the task** — the main cost dial:

| Model | Use it for |
|---|---|
| **haiku** | Scanning files, summarizing, docs — the cheap workhorse. |
| **sonnet** | Most build/review/research work — the default. |
| **opus** | Deep reasoning / high-stakes review — where a wrong answer is expensive. |

- **Cap wanderers.** Set `maxTurns` on open-ended agents so they can't burn tokens on tangents.
- `color` is optional (UI only). `name` must equal the filename (lowercase-hyphen).

## When to use one (and when not)

The gut check: **"Is this about to dump a pile of stuff into my chat I'll never re-read?"** If yes →
subagent. Rule of thumb: **10+ files, or throwaway output → subagent; small, iterative, or needs the
whole conversation → stay inline.** A subagent starts blank and re-gathers context, so it is wasteful on
a 30-second task.

## How the foundation orchestrates them

- **Sequential pipeline** — the phase build: `spec-reviewer` → `plan-reviewer` → `implementer` →
  `code-reviewer`, each feeding the next (the main chat is the conductor).
- **Fan-out (parallel)** — `roast`'s 5-persona council and `storm-research`'s 5 lenses run at once, then
  the main chat synthesizes. Those personas stay defined **inside their skills** (they're parameterized
  per idea) — but their web-facing roles *may* run as `web-researcher` for the Sonnet + web-restricted
  tooling, keeping the persona's own prompt and output contract.
- **Builder / validator** — `implementer` writes, then a fresh `code-reviewer` (which never saw the
  reasoning) judges the result on its own terms.

**Composition rules:** skills can call agents, agents can call skills, but **agents cannot call agents**
(no nesting) — the main conversation is always the conductor.

## Adding your own

Run `/agents` in Claude Code for a guided form (applies immediately), or hand-write
`.claude/agents/<name>.md` and **restart the session** so it loads. Project-level agents (here, in the
repo) ship in git, so every clone of this template gets the fleet automatically.

> **Security:** before dropping in a community/imported agent file, **vet it for prompt injection** —
> read its body and tool grants. The six above are hand-authored and read-only by default.

## Credit

The conventions distilled here follow the "Complete Guide to Claude Code Subagents"
(video: `youtu.be/e18sdZLwP7o`) and the community "Awesome Claude Code Subagents" collection.
````

- [ ] **Step 2: Verify DoD**
```bash
grep -q "The fleet" docs/SUBAGENTS.md && grep -qi "one agent, one job" docs/SUBAGENTS.md && echo POLICY_OK
grep -qi "vet it for prompt injection" docs/SUBAGENTS.md && echo INJECTION_OK
grep -q "haiku" docs/SUBAGENTS.md && grep -q "sonnet" docs/SUBAGENTS.md && grep -q "opus" docs/SUBAGENTS.md && echo MODELMIX_OK
grep -q "e18sdZLwP7o" docs/SUBAGENTS.md && echo CREDIT_OK
```
Expect: POLICY_OK INJECTION_OK MODELMIX_OK CREDIT_OK.

- [ ] **Step 3: Commit**
```bash
git add docs/SUBAGENTS.md
git commit -m "docs(subagent-fleet): SUBAGENTS.md policy (model-mix, least-tools, patterns)"
```

---

### Task 3: Light wiring — `storm-research` + `roast` (additive notes only)

**Files:**
- Modify: `.claude/skills/storm-research/SKILL.md`
- Modify: `.claude/skills/roast/SKILL.md`

- [ ] **Step 1: `storm-research`** — add the `web-researcher` option. Replace:

```
Spawn **five `general-purpose` agents in a single message** so they run concurrently.
```

with:

```
Spawn **five `general-purpose` agents in a single message** so they run concurrently. *(Each lens — and the Phase 4b citation verifiers — may instead be dispatched as the `web-researcher` agent: Sonnet + web-restricted tools in place of `general-purpose`, keeping the exact lens/verifier prompt and its "Return EXACTLY…" output contract below. See `docs/SUBAGENTS.md`.)*
```

- [ ] **Step 2: `roast`** — extend the Web-availability note. Replace:

```
**Web-availability note.** The Researcher relies on web search. If web access is unavailable,
instruct the Researcher to reason from general knowledge instead and flag that its evidence is
unverified — the council still runs and the Judge still delivers a verdict (Tier 0, no web, no keys).
```

with:

```
**Web-availability note.** The Researcher relies on web search. If web access is unavailable,
instruct the Researcher to reason from general knowledge instead and flag that its evidence is
unverified — the council still runs and the Judge still delivers a verdict (Tier 0, no web, no keys).
When web IS available, the Researcher may be dispatched as the `web-researcher` agent (Sonnet + web-restricted tools) instead of `general-purpose` — keep the Researcher persona prompt and its output contract exactly as above. See `docs/SUBAGENTS.md`.
```

- [ ] **Step 3: Verify DoD**
```bash
grep -q "web-researcher" .claude/skills/storm-research/SKILL.md && grep -q "five .general-purpose. agents" .claude/skills/storm-research/SKILL.md && echo STORM_OK
grep -q "web-researcher" .claude/skills/roast/SKILL.md && grep -qi "Tier 0, no web, no keys" .claude/skills/roast/SKILL.md && echo ROAST_OK
# additive proof: the original persona/lens dispatch text is still present
grep -q "subagent_type: general-purpose" .claude/skills/roast/SKILL.md && echo ROAST_PERSONAS_INTACT
```
Expect: STORM_OK ROAST_OK ROAST_PERSONAS_INTACT.

- [ ] **Step 4: Commit**
```bash
git add .claude/skills/storm-research/SKILL.md .claude/skills/roast/SKILL.md
git commit -m "feat(subagent-fleet): storm-research + roast may run their research roles as web-researcher (additive)"
```

---

### Task 4: `CLAUDE.md` — the Pointers bullet (keep < 125 lines)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a Subagents pointer.** In the `## Pointers` section, replace:

```
- Design spec: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`. The AIOS console (`aios/`) is file-first — reads this KB, writes only to `outputs/`.
```

with:

```
- Design spec: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`. The AIOS console (`aios/`) is file-first — reads this KB, writes only to `outputs/`.
- Subagents: the tuned `.claude/agents/` fleet (web-researcher · spec-reviewer · plan-reviewer · implementer · code-reviewer · doc-writer) does the grunt work — least-tools (read-only by default), model per task (haiku scan / sonnet build+review / opus reason); the phase-build pipeline delegates to spec-reviewer/plan-reviewer/implementer/code-reviewer. See `docs/SUBAGENTS.md`.
```

- [ ] **Step 2: Verify DoD**
```bash
grep -q '`.claude/agents/` fleet' CLAUDE.md && echo POINTER_OK
LINES=$(wc -l < CLAUDE.md); echo "CLAUDE.md lines: $LINES"; [ "$LINES" -lt 125 ] && echo CAP_OK
```
Expect: POINTER_OK CAP_OK (lines < 125).

- [ ] **Step 3: Commit**
```bash
git add CLAUDE.md
git commit -m "docs(subagent-fleet): CLAUDE.md Pointers bullet for the .claude/agents fleet"
```

---

### Task 5: `README.md` + `docs/USING-THIS-FOR-ANY-PROJECT.md`

**Files:**
- Modify: `README.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`

- [ ] **Step 1: README — "What you get" bullet.** After the `🛠️ **Built for you**` bullet (line 43),
  add a new bullet:

```
- 🤖 **Sharp under the hood** — the grunt work runs on a tuned fleet of specialist subagents that ships with the template (the right model per job, read-only by default), so it's cheaper, safer, and consistent (see [subagents](docs/SUBAGENTS.md)).
```

- [ ] **Step 2: README — docs table.** After the `[Extending](docs/EXTENDING.md)` row (line 59), add:

```
| [Subagents](docs/SUBAGENTS.md) | The tuned agent fleet that does the grunt work — and how to add your own. |
```

- [ ] **Step 3: README — build-status.** After the Phase 13 line (line 130), add:

```
- Phase 14 — tuned `.claude/agents/` subagent fleet + `docs/SUBAGENTS.md` policy (model-mix + least-tools) ✅
```

- [ ] **Step 4: USING — one line.** Replace the `**Then build it:**` paragraph's trailing link line —
  find the line ending `See `docs/BUILD-APP.md` · `docs/BUILD-MOBILE.md` · `docs/BUILD-PLUGIN.md`.` and
  append a new paragraph immediately after it:

```
**Under the hood:** the template ships a tuned fleet of specialist subagents (`.claude/agents/`) that does the grunt work — the right model per job, read-only by default — so building is cheaper, safer, and consistent. See `docs/SUBAGENTS.md`.
```

- [ ] **Step 5: Verify DoD**
```bash
grep -q "SUBAGENTS.md" README.md && grep -q "Phase 14" README.md && echo README_OK
grep -q "SUBAGENTS.md" docs/USING-THIS-FOR-ANY-PROJECT.md && echo USING_OK
```
Expect: README_OK USING_OK.

- [ ] **Step 6: Commit**
```bash
git add README.md docs/USING-THIS-FOR-ANY-PROJECT.md
git commit -m "docs(subagent-fleet): surface the fleet in README + USING"
```

---

### Task 6: Phase 14 addendum to the master design spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`

- [ ] **Step 1:** Find the `## Phase 13 addendum` section and append a **Phase 14 addendum** after it, in
  the same single-dense-paragraph voice/format (including the `(2026-07-01)` date suffix). Cover: Phase 14
  = a tuned six-agent fleet in `.claude/agents/` (web-researcher/spec-reviewer/plan-reviewer/implementer/
  code-reviewer/doc-writer) implementing the Subagents-guide practices — one-job, trigger-rule
  descriptions, least-tools (read-only by default, enforced), and model-mix (haiku scan / sonnet
  build+review / opus reason), the template's previously-unused cost lever; a `docs/SUBAGENTS.md` policy;
  everything ships (agents are reusable capabilities, unlike the `build-*` runtime outputs); light additive
  wiring only (storm-research + roast may run their research roles as web-researcher, keeping their
  persona prompts/output contracts; a CLAUDE.md pointer; README/USING lines); nothing rewired, no skill's
  attended behavior touched; and that **autopilot (Phase 15) is sequenced next and will delegate to this
  fleet**. Point to `docs/SUBAGENTS.md` and `docs/superpowers/specs/2026-07-01-subagent-fleet-design.md`.

- [ ] **Step 2: Verify DoD**
```bash
grep -q "Phase 14 addendum" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && grep -q ".claude/agents" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && echo ADDENDUM_OK
```
Expect: ADDENDUM_OK.

- [ ] **Step 3: Commit**
```bash
git add docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md
git commit -m "docs(subagent-fleet): Phase 14 addendum in the master design spec"
```

---

### Task 7: Final verification (additive-only + integrity)

**Files:** none (verification only).

- [ ] **Step 1: Fleet integrity.**
```bash
ls .claude/agents | sort   # expect the six .md files
cd .claude/agents && for f in *.md; do head -1 "$f" | grep -q '^---$' && echo "$f FM_OK" || echo "$f FM_FAIL"; done; cd ../..
```
Expect: six files, six `FM_OK`.

- [ ] **Step 2: Additive-only proof (no skill behavior removed).**
```bash
# storm-research lens prompts + roast persona prompts must still be intact
grep -q "You are the Contrarian on an idea council" .claude/skills/roast/SKILL.md && echo ROAST_INTACT
grep -q "five expert lenses" .claude/skills/storm-research/SKILL.md && echo STORM_INTACT
# untouched invariants (expect EMPTY)
git diff --name-only main..HEAD -- .claude/skills/maintenance-loop .claude/skills/improve-system .claude/skills/build-app .claude/skills/build-mobile .claude/skills/build-plugin raw outputs/change-log.md
```
Expect: ROAST_INTACT, STORM_INTACT, and an EMPTY diff for the untouched paths.

- [ ] **Step 3: Only intended files changed + cap.**
```bash
git diff --name-only main..HEAD | sort
LINES=$(wc -l < CLAUDE.md); echo "CLAUDE.md: $LINES"; [ "$LINES" -lt 125 ] && echo CAP_OK
git status --porcelain   # expect clean
```
Expect exactly: the 6 `.claude/agents/*.md` + `docs/SUBAGENTS.md` created, and modified `CLAUDE.md`,
`README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`, `.claude/skills/storm-research/SKILL.md`,
`.claude/skills/roast/SKILL.md`, `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`
+ the two session spec/plan docs. Nothing else; CAP_OK; clean tree.

- [ ] **Step 4:** No commit (verification only). Proceed to the final review gates (Claude whole-branch
  review + Codex `codex review --base main`), then `finishing-a-development-branch`. Merge/push only on
  the user's explicit request.

---

## Notes for the executor
- **DRY/YAGNI:** ship exactly the fleet + doc + additive wiring. No extra agents, no skill rewrites.
- **Voice:** the agent bodies are terse and imperative (role → workflow → output → constraints); the
  policy doc matches the plain, welcoming tone of `docs/BUILD-APP.md`.
- **Least-privilege is load-bearing:** never add `Write`/`Edit` to the four review/research agents.
- After all tasks: dispatch a final whole-branch Claude review, run the Codex gate
  (`codex review --base main`), then use `finishing-a-development-branch`. Merge/push only on the user's
  explicit request.
