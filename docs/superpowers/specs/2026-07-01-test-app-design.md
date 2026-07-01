# test-app — "prove it works" (path-to-production rung 2) — design

## Context

**What prompted this.** After Phase 18 (`build-backend`) the user chose to walk the path-to-production
roadmap (`docs/PATH-TO-PRODUCTION.md`) rung by rung. Rung 1 (real data & identity) shipped as
`build-backend`. **Rung 2 is testing** — the user's instruction: *"Let's do testing next."* Today the
template delivers a themed, working front-end (`build-app`) that can be upgraded to real data
(`build-backend`), but **a prototype has no tests; a product does.** This phase adds the dedicated testing
tier.

**What the roadmap already committed to.** `docs/PATH-TO-PRODUCTION.md` rung 2 reads: *"A `test-app` skill:
generate unit + integration + end-to-end (Playwright) tests against your app **and** the charter's success
criteria, produce a runnable suite + coverage, and wire it into the subagent fleet."* This spec honors that
verbatim.

**The three forks the user resolved (brainstorming):**
1. **Generation depth → real suite + honest coverage map.** Generate the tests we can write *reliably and
   deterministically* (unit: utils + data accessors; component: each page mounts + shows its key mock
   content + forms validate; E2E: per-route happy-path smoke), **plus** map each charter success criterion
   to either an automatable E2E flow or a flagged `manual/metric — not automatable` note. Ships a green,
   runnable suite + a coverage/criteria manifest — honest that deep behavioral assertions and the
   manual/metric criteria remain the user's to add. (Rejected: "harness + one example only" = a starter kit,
   not a testing tier; "deep behavioral generation" = brittle/false-confidence auto-gen for arbitrary apps.)
2. **Fleet wiring → add a `test-writer` agent.** A 7th one-job/least-tools agent whose job is
   *write-tests-and-iterate-to-green* — fulfilling the roadmap's "wire into the fleet" literally and matching
   the fleet philosophy. (Rejected: reuse `implementer`, whose verbatim-transcription job has no run-loop.)
3. **Autopilot → opt-in, default OFF.** An optional autopilot test phase gated on `test_after_build`
   (default `false`), exactly mirroring `build-backend`'s `wire_backend_after_build`. (Rejected: default-on
   is more opinionated / less consistent; deferring autopilot wiring breaks `build-backend`'s precedent of
   including it.)

**Intended outcome.** (a) A new **attended** `test-app` skill that gives any built `app/` a real, runnable
test suite anchored to the charter's success criteria, scaffolded fully offline; (b) a `test-writer`
subagent added to the fleet; (c) opt-in, default-off autopilot integration; (d) the roadmap doc updated to
mark rung 2 shipped. All **author-only** — the template ships clean, never with a real generated suite.

---

## Design

### The skill: `test-app` (`.claude/skills/test-app/{SKILL.md,config.json}`)

The **"prove it works"** step and the testing sibling of the `build-*` family. It takes any built `app/`
(whether a plain `build-app` prototype or a `build-backend`-wired one) and gives it a real test suite:
Vitest + Testing Library + Playwright + coverage. It reuses the **Vitest test-runner convention `aios/`
already ships** (`aios/package.json` → `"test": "vitest run"`, colocated `*.test.ts`); the **jsdom +
Testing Library + coverage** layer is net-new (aios runs `environment: "node"` and carries none of it). It
then maps that suite back to the charter's **success criteria**, so the tests prove *the user's* definition
of "works."

**When to use.** "test my app", "add tests", "write tests", "does my app actually work", "check my app",
`/test-app`. Also offered by `what-can-i-do` and pointed to by `advise-project` as the next step after a
build. **Requires an already-built `app/`.** **Attended** (one confirm gate) and **never in the unattended
`maintenance-loop`**.

**Coexistence with `build-backend`.** `build-backend` already adds `vitest` + `@playwright/test` and a
handful of tests (data-layer fallback, auth guard, an E2E smoke) *when a backend is wired*. `test-app` is
the dedicated, comprehensive tier that works on **any** `app/`. When a prior test setup exists (from
`build-backend` or a previous `test-app` run), `test-app` **extends** it (incremental mode) rather than
duplicating or clobbering.

**Inputs it reads (all offline, no keys):**
- The built **`app/`** — `src/pages/` + `App.tsx` (the route table → which pages to test), `src/data/`
  fixtures + accessors (`getX`/`listX` → unit targets and the known values component tests assert on),
  `src/lib/utils.ts` (the `cn` helper), `src/components/`, and `src/data/store/` if `build-backend` ran.
- **`wiki/charter.md`** — `## Success & outcomes` (the criteria to map) + `## Scope` In/MVP (the flows).
  **Missing →** generate the code-level suite, skip the criteria mapping, and flag it plainly.
- **`wiki/build.md`** + the latest `raw/builds/` record — what screens/entities exist.
- **Autonomous mode only:** the confirmed `outputs/autopilot/<date>-<slug>/plan.md`.

**Configuration (`config.json`, all default; never block on absence):**
- `app_dir` (default `"app"`) — the built app to test.
- `coverage_target` (default `70`) — a **soft** coverage goal noted in the plan/manifest, **never a hard
  gate** (the skill never fails or blocks on coverage).
- `include_e2e` (default `true`) — scaffold the Playwright E2E layer.
- `max_specs` (default `12`) — the cap on generated spec files in one pass (the runaway-scope guard).

**Procedure (mirrors `build-*` Phase 0–5):**

- **Phase 0 — Pre-flight (require the app; read it; route, don't guess).**
  - A built `app/` is **required**. Missing → offer `build-app` first (*"Testing proves out an app you've
    already built. Want me to build the app first, then test it?"*); on yes run `build-app` then continue,
    on no stop gracefully (nothing to test).
  - Read the app structure (routes, fixtures, utils, store) and the charter. An **existing test setup**
    (`app/vitest.config.*` / a test block in `vite.config.ts`, `app/e2e/`, `app/playwright.config.ts`, or
    colocated `*.test.*`) → **incremental mode** (see *Re-running*).

- **Phase 1 — Derive the test plan.**
  - **Unit:** `src/lib/utils.ts` (`cn`), each `src/data/` accessor (`getX(id)` / `listX()` return the
    expected shape from the fixtures), and the store fallback (`getActiveStore()` → `MockStore` with no env)
    if `build-backend` ran.
  - **Component/integration:** one test per page/route — render under a router wrapper (+ any providers the
    app already has, e.g. `QueryClientProvider` if backend-wired), assert it **mounts without crashing** and
    that a **known fixture value appears**, and that any form on the page **surfaces its validation**.
  - **E2E (Playwright, if `include_e2e`):** a per-route happy-path smoke (the app loads, primary nav works).
  - **Criteria map (the differentiator):** each `## Success & outcomes` criterion → **either** an
    automatable Playwright flow **or** a flagged `manual/metric — not automatable` note (e.g. "10 paying
    customers by month 3" is a business metric, not a browser flow). Scope In/MVP flows → E2E happy-paths.
  - **Stay scoped:** cap at `config.max_specs`; if the app implies more, generate the **core slice** and
    list the rest under `Later (not in this pass)`.

- **Phase 2 — Confirm once, then generate.** One message, one question. Show: the levels (unit / component /
  E2E) and the file count; the **criteria→test map** (which criteria become automated tests, which are
  flagged manual/metric); the harness being added (Vitest + Testing Library + jsdom + Playwright + coverage
  + scripts); the **soft** `coverage_target`; that it stays **offline** and the run is **offered, not run**.
  Ask: *"Generate this test suite? I'll scaffold everything offline — then hand you the one command to run
  it. (yes / tweak something)"* No per-test interrogation.

- **Phase 3 — Scaffold the suite (offline; via the `test-writer` agent).**
  1. **Harness.** Add (or **extend**, if present) the Vitest config — a `test` block in
     `app/vite.config.ts` with `environment: "jsdom"` (component tests need a DOM — this differs from
     `aios/`'s `node` env), a `src/test/setup.ts` that registers `@testing-library/jest-dom`, and coverage
     via `@vitest/coverage-v8` **pinned to the same major as `vitest`** (both `^4` — a coverage-v8/vitest
     major mismatch is a common footgun, and `aios/` carries no coverage-v8 to copy). Add
     `app/playwright.config.ts` — base URL = the app's `dev_port`, **and a `webServer: { command: "npm run
     dev", port: <dev_port>, reuseExistingServer: !process.env.CI }` block** so `npm run test:e2e`
     auto-starts the dev server and the E2E suite is actually runnable (without it the base URL points at
     nothing). Add dev deps: `vitest` (+ `@vitest/coverage-v8`), `@testing-library/react`,
     `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@playwright/test` — pinned to the
     majors `aios/` already uses where it has them (only `vitest ^4`, which `@vitest/coverage-v8` tracks);
     the Testing Library / jsdom / Playwright deps are net-new. Add each **only if not already present**
     (build-backend may have added `vitest` / `@playwright/test`). Add scripts: `test` (`vitest run`),
     `test:watch` (`vitest`), `test:coverage` (`vitest run --coverage`), `test:e2e` (`playwright test`). No
     other stack drift.
  2. **Unit tests** — colocated `*.test.ts(x)` next to their targets.
  3. **Component/integration tests** — colocated `*.test.tsx` per page, using a small shared render helper
     (router + providers).
  4. **E2E** — `app/e2e/*.spec.ts` (per-route smoke + the automatable criteria flows).
  - **Delegation.** `test-app` delegates the actual writing to the **`test-writer`** agent, which writes
    each unit/component test **and runs `vitest` to green**, iterating on failures. It **never installs**
    (see the boundary): if the app's dev deps aren't installed in the working tree, `test-writer` writes the
    tests from the source it can read and **reports them as authored-not-run**, leaving the green run to the
    user's `npm install`. E2E specs are always authored-not-run (they need browsers). **In the template's
    own default flow a freshly `build-app`'d `app/` has no `node_modules`, so `test-writer` most often
    authors-not-runs** — the run-to-green loop pays off on re-runs and when the user has already installed
    deps.

- **Phase 4 — Record it (provenance; rides the shared spine).**
  - **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; `-2` for same-day re-runs)* — RAG
    frontmatter, then: the test plan, the levels + file list, the **criteria→test map**, the
    `coverage_target`, the deps added, and what's flagged manual/deferred. **Tag it `layer: tests`** (in the
    frontmatter `tags` and a `layer:` line) so it's distinct from the front-end / backend build records.
  - **`wiki/build.md`** — add a **`## Tests`** section (preserving the existing Web / Mobile /
    Browser-extension / Backend sections): what's covered, where the tests live, how to run them, the soft
    coverage goal, and links to the `raw/builds/` record + the `outputs/tests/` manifest.
  - **`outputs/change-log.md`** — append one attributed line (newest-at-top):
    `- <YYYY-MM-DD> — test-app — generated test suite (unit + component + E2E) for app/ mapped to wiki/charter.md success criteria — applied`

  `improve-system` stays the single applier — `test-app` writes only its own `applied` line, exactly as the
  other `build-*` skills do.

- **Phase 5 — Hand over (offer, then run only on explicit yes — exactly as `build-app` does).** Write the
  coverage/criteria **manifest** to **`outputs/tests/<YYYY-MM-DD>-<slug>/TEST-PLAN.md`** (RAG frontmatter +
  the criteria→test map + what's covered + what's flagged manual + the run commands), then close in plain
  words. **Do not run anything unprompted** that hits the network or installs to disk — **offer** it (the
  same rule `build-app`'s Phase 5 uses before it runs `npm run dev`). The close offers:
  > *"Your test suite is ready. To run it: `cd app && npm install` (one time), then `npm test`. For the
  > browser (E2E) tests, also run `npx playwright install` once (a bigger one-time download of test
  > browsers), then `npm run test:e2e`. Want me to run the unit tests for you?"*
  On an **explicit yes**, run **only** the unit tests with `app/` as the working directory
  (`cd app && npm install && npm test`) — exactly the Tier-0, explicit-consent convenience `build-app`
  already ships for the dev server. **Never** run the Playwright browser download (`npx playwright install`)
  unless the user explicitly asks (it is a large download); E2E specs stay authored-not-run by default. This
  is Tier 0 — no keys, no deploy, nothing irreversible; the run is a convenience, never automatic.

**Re-running (incremental, never clobber).** If a test setup already exists, switch to **incremental
mode**: read the existing tests + latest `raw/builds/` test record, diff the current app/charter against
what's covered, and at the confirm gate offer: **add coverage for new screens/criteria**, **re-derive the
suite**, or **both**. Write **new** test files freely; for any **existing** file, show a diff and **confirm
before overwriting**. Each re-run writes a **new** `raw/builds/` record. Never clobber a user's hand-written
tests.

**Rules & guardrails.**
- **Attended-only — never in `maintenance-loop`.** It writes project source and offers `npm install`
  (network + disk); the unattended tick never runs it.
- **Tier 0 — offline, no keys.** Testing needs no keys; scaffolding is fully offline. Only the opt-in **run**
  needs `npm install` / the browser download, which stay the user's.
- **Honest about what it is.** Every artifact calls it a **real but non-exhaustive** suite: deep behavioral
  assertions and the `manual/metric` success criteria remain the user's to add. No false "fully tested"
  claim.
- **`improve-system` stays the single applier; `raw/` is immutable.** `test-app` writes its own provenance
  (`raw/builds/` record + `wiki/build.md` section + one `change-log.md` line); the test code lives in
  `app/` (a build target outside the knowledge folders).
- **Web `app/` only (v1).** Test tiers for `mobile/` / `plugin/` are a later phase.

**`## Autonomous invocation (driven by `autopilot`)` note (additive).** When `autopilot` drives it, read the
charter + built `app/` + the confirmed `plan.md`, **skip the Phase 2 confirm gate** (autopilot's single gate
covered it), generate **offline** via `test-writer` (tests authored; the green run stays a post-run offer),
flag every `(assumed — confirm later)` choice to the decision ledger, write provenance as usual, and surface
the `outputs/tests/<date>-<slug>/TEST-PLAN.md` path for the hand-over. Attended behavior above is byte-for-
byte unchanged.

### The `test-writer` agent (`.claude/agents/test-writer.md`)

A 7th one-job agent following the exact fleet conventions (`docs/SUBAGENTS.md`):
- **`model: sonnet`** — test writing needs judgment about what to assert (haiku too weak, opus wasteful).
- **`tools: Read, Write, Edit, Bash`** — Read the source under test; Write/Edit the test files; **Bash to run
  `vitest`** and the grep/git DoD checks. It is a **scoped writer, exactly like `implementer`** (it holds
  `Write`/`Edit`): its honest limit is body-instructed and *scope-based* — it touches only test files + the
  test harness/config it's told to add, never product source under test.
- **`maxTurns`** set (a run-to-green loop can wander) — cap it (e.g. `40`, matching `implementer`).
- **Body:** one job — *write the assigned test(s) → run `vitest` → iterate to green → report*. Constraints:
  touch only test files (+ the test harness/config it's told to add); never modify product source under
  test; never `npm install`; if deps are absent, author the tests and report **authored-not-run**; no
  nesting (agents can't call agents). Report is data for the controller (DONE/BLOCKED + the `vitest` output
  + files written).

`docs/SUBAGENTS.md` gets a new fleet-table row. **It is documented `implementer`-style — a *scoped
writer*.** It must **not** be appended to the `code-reviewer` Bash-nuance note (lines 28–29), which is
specifically about a *read-only* agent with "no `Write`/`Edit`"; `test-writer` holds `Write`/`Edit`, so
that sentence would be false of it. Document its limit the way `implementer`'s is — a writer scoped to test
files only.

### Autopilot integration (opt-in, default OFF)

Add an optional **test phase** to `autopilot`, gated on config **`test_after_build`** (default `false`),
mirroring `build-backend`'s `wire_backend_after_build`. When enabled, after `build-<target>` (web target
only, like the backend-wire) and before the hand-over, `autopilot` runs `test-app` in **scaffold-only /
graceful mode**: skip the confirm gate, `test-writer` generates offline (no install), flag assumptions to
the decision ledger, and add the `outputs/tests/.../TEST-PLAN.md` path to the hand-over. Autopilot stays
**Tier 0** (no keys), **user-initiated**, and **never in `maintenance-loop`**. Default off because a "build
my whole project" user shouldn't be surprised with extra tooling; one flag / one grill answer opts in.
Where the backend-wire and test phases are both on, the natural order is **build → (wire backend) → test →
advise** (test the app in whatever data shape it ends in).

### Not changed

`improve-system` (single applier), `maintenance-loop`, `build-app/mobile/plugin/backend` SKILL.md
(untouched — this ADDS a sibling and wires visibility via `what-can-i-do` + `advise-project` + docs, exactly
as `build-backend` did), `define-*`, `roast`, `storm-research`, `raw/` immutability. Autopilot's existing
Phases A–E are unchanged (the test phase is additive and off by default).

## Safety / reconciliation

- **Offline, no keys, no irreversible action.** `test-app` writes test files + config + a manifest fully
  offline; it never enters a key and never deploys. It never runs anything **unprompted**; on an explicit
  yes it may run the unit tests (`cd app && npm install && npm test`) — exactly the Tier-0,
  explicit-consent convenience `build-app`'s Phase 5 already ships for `npm run dev`. It **never** runs the
  Playwright browser download unless explicitly asked. The confirm gate covers the file-writing; every run
  is user-initiated.
- **Attended for the app-shape change; Tier 0 preserved for autopilot.** The skill's own run has a confirm
  gate; autopilot's test phase is opt-in/default-off and only does the offline scaffold. Neither is ever
  added to `maintenance-loop`.
- **`improve-system` stays the single applier; `raw/` immutable.** `test-app` writes its own provenance
  (`raw/builds/` record + `wiki/build.md` section + one `change-log.md` line); code lives in `app/`.
- **Honest coverage.** The manifest and `wiki/build.md` state plainly what's automated vs. flagged
  manual/metric — no "fully tested" overclaim.
- **Author-only — never run for real against the template.** No real `app/` test files,
  `outputs/tests/<date>-*`, or `wiki/build.md` committed; the template ships clean (skill + config + the
  `test-writer` agent + docs + wiring + `outputs/tests/.gitkeep` only).

## Critical files

- **Create (shipped):** `.claude/skills/test-app/SKILL.md` + `config.json`; `.claude/agents/test-writer.md`;
  `docs/TEST-APP.md`; `outputs/tests/.gitkeep`;
  `docs/superpowers/specs/2026-07-01-test-app-design.md` (this spec).
- **Modify (shipped, light/additive):** `.claude/skills/autopilot/{SKILL.md,config.json}` (opt-in test phase
  + `test_after_build:false`); `.claude/skills/what-can-i-do/SKILL.md` (menu item);
  `.claude/skills/advise-project/SKILL.md` (extend the deferred-tier / next-step clause to name `test-app`
  after a build — additive); `CLAUDE.md` (skill bullet + `outputs/tests/` pointer, hold < 125 lines);
  `README.md` (build-status Phase 19 line + guide row); `docs/PATH-TO-PRODUCTION.md` (mark rung 2 shipped);
  `docs/SUBAGENTS.md` (add the `test-writer` **fleet-table row only** — document it `implementer`-style as a
  scoped writer; do **NOT** add it to the `code-reviewer` Bash-nuance note, which is about a read-only agent); `docs/USING-THIS-FOR-ANY-PROJECT.md`
  (a testing rung/clause); `docs/AUTOPILOT.md` (the optional test-phase note);
  `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md` (Phase 19 addendum).
- **Reuse (reference, do not modify):** `aios/vite.config.ts` + `aios/package.json` (the Vitest convention:
  `vitest run`, config shape, deps/majors), `aios/server/kb/store.test.ts` (the test style), `build-app` /
  `build-backend` `SKILL.md` (Phase 0–5 + `## Autonomous invocation` note shape), `.claude/agents/
  implementer.md` (the agent-file shape test-writer mirrors), `docs/SUBAGENTS.md` (fleet conventions).

## Verification

Authoring task (skill / agent / docs / wiring) → DoD via `grep`/`wc`/`git`, plus (documented, NOT run
against the template) a manual smoke of a generated suite:
- **Skill present & shaped:** `test-app/SKILL.md` has Phase 0–5 + a `## Autonomous invocation` note + the
  three levels + the criteria-map description; `config.json` has the four keys with the stated defaults.
- **Real-suite + honest-map explicit:** SKILL.md describes generating unit + component + E2E tests AND
  mapping charter success criteria to automated-or-flagged-manual (grep the wording); states the suite is
  real-but-not-exhaustive.
- **Offer-then-run-on-yes + no-keys:** SKILL.md forbids running anything **unprompted** and never collects
  a key; it runs **only** the unit tests on an explicit yes (`cd app && npm install && npm test`, matching
  `build-app`'s dev-server precedent) and **never** the Playwright browser download unless explicitly asked;
  it writes the `outputs/tests/` manifest.
- **`test-writer` agent correct:** `.claude/agents/test-writer.md` has `name: test-writer` (== the
  filename, per the SUBAGENTS convention), `model: sonnet`, `tools: Read, Write, Edit, Bash`, a `maxTurns`,
  a one-job body (write→run→iterate→report), and the never-install / authored-not-run fallback;
  `docs/SUBAGENTS.md` lists it as a scoped writer (NOT in the code-reviewer Bash-nuance note).
- **Autopilot test phase opt-in/off:** `autopilot/config.json` has `test_after_build:false`; the SKILL.md
  test phase is described as opt-in / web-only / offline; autopilot stays Tier 0 / never in
  `maintenance-loop` (grep those invariants intact).
- **Untouched invariants (expect empty diff):** `git diff --name-only main..HEAD` for `improve-system`,
  `maintenance-loop`, `build-app/mobile/plugin/backend`, `define-*`, `roast`, `storm-research`, `raw`.
- **No pollution:** no real `app/` test files, `app/e2e/`, `outputs/tests/<date>-*`, or `wiki/build.md`
  committed; only intended files in the diff; `CLAUDE.md` < 125 lines.
- **Roadmap updated:** `docs/PATH-TO-PRODUCTION.md` rung 2 marked shipped (Phase 19), matching rung 1's
  format.

## Execution (after approval)

The project's standard pipeline, **dogfooding the tuned fleet** (as in Phases 16–18): this spec →
`spec-reviewer` → user review → `writing-plans` → `plan-reviewer` → subagent build with `implementer`s
(per-task, verbatim transcription + grep/git DoD + per-task commits) — **and, fittingly, the new
`test-writer` agent authors this phase's own generated-test examples where the plan calls for them** →
`code-reviewer` + Codex `codex review --base main` → `finishing-a-development-branch`. Branch:
`phase-19-test-app`. **Author only — never run `test-app`/`autopilot` for real against the template.**
