---
name: test-app
description: Use when someone asks to "test my app", "add tests", "write tests", "does my app actually work", "check that my app works", or says "/test-app". Generates a real, runnable test suite (Vitest + Testing Library + Playwright + coverage) for the already-built web app in app/, and maps it to your charter's success criteria — each becomes an automated test or a flagged manual/metric note. Reads the built app/ and wiki/charter.md; one confirm gate; scaffolds fully OFFLINE (no keys, nothing installed). Extends an existing test setup rather than duplicating it. Offers the run — runs only the fast Vitest suite (unit + component) on an explicit yes (as build-app runs the dev server), never the Playwright browser download unprompted. Tier 0. Attended-only — never runs in the maintenance loop. Re-runnable. Zero-argument safe.
argument-hint: "[leave blank to test your whole app, or name a screen/criterion to focus on]"
---

# test-app

The "prove it works" step. `build-app` gives a non-technical user a themed, working web app in `app/`, and
`build-backend` can make its data real — but **a prototype has no tests; a product does.** This skill gives
that same `app/` a **real, runnable test suite** — Vitest + Testing Library + Playwright + coverage — and,
the differentiator, **maps it back to the charter's success criteria** so the tests prove *the user's*
definition of "works," not merely that code runs. It writes no product code and asks the user to write none.

What it produces (all **offline, nothing installed**): a test harness added to `app/` (Vitest config +
Testing Library + coverage + a Playwright `e2e/` layer + `npm test` scripts), colocated unit + component
tests, per-route E2E specs, and a **coverage/criteria manifest** at
`outputs/tests/<date>-<slug>/TEST-PLAN.md`. It **offers** the run and — exactly as `build-app` offers to
start the dev server — runs the unit tests only on an explicit yes; the Playwright browser download stays
the user's.

## When to use

When the user says "test my app", "add tests / write tests", "does my app actually work", "check my app",
or `/test-app`. Also offered by `what-can-i-do` and pointed to by `advise-project` as the next step after a
build. It **requires an already-built `app/`** (from `build-app`). It is **attended** — one confirm gate
before generating — and **never runs in the unattended `maintenance-loop`**.

## Configuration

Read `.claude/skills/test-app/config.json` (all values default; never block on absence):
- `app_dir` (default `"app"`) — the built web app to test.
- `coverage_target` (default `70`) — a **soft** coverage goal noted in the plan/manifest; **never a hard
  gate** (the skill never fails or blocks on coverage).
- `include_e2e` (default `true`) — scaffold the Playwright end-to-end layer.
- `max_specs` (default `12`) — the cap on generated spec files in one pass (the runaway-scope guard).

## Procedure

### Phase 0 — Pre-flight (require the app; read it; route, don't guess)

1. **A built `app/` (required).** There is nothing to test without it.
   - **Missing →** offer `build-app` first: *"Testing proves out an app you've already built. Want me to
     build the app first (a quick, themed front-end), then test it?"* On yes, run `build-app`, then
     continue. On no, stop gracefully (nothing to test).
   - Read the app: `src/pages/` + `src/App.tsx` (the **route table** → which pages to test), `src/data/`
     fixtures + `getX()`/`listX()` accessors (**unit targets** and the **known values** component tests
     assert on), `src/lib/utils.ts` (the `cn` helper), `src/components/`, and `src/data/store/` if
     `build-backend` ran.
2. **Charter — `wiki/charter.md` (recommended).** Read `## Success & outcomes` (the **criteria to map**) +
   `## Scope` (the In/MVP flows). **Missing →** generate the code-level suite (unit + component + route
   smoke), skip the criteria mapping, and flag it plainly (`no charter — success-criteria mapping skipped`).
3. **Existing test setup** (`app/vitest.config.*` or a `test` block in `app/vite.config.ts`, `app/e2e/`,
   `app/playwright.config.ts`, or colocated `*.test.*`) → switch to **incremental mode** (see *Re-running*).

### Phase 1 — Derive the test plan

- **Unit** — `src/lib/utils.ts` (`cn`), each `src/data/` accessor (`getX(id)` / `listX()` returns the shape
  the fixtures define), and the store fallback (`getActiveStore()` → `MockStore` with no env) if
  `build-backend` ran.
- **Component/integration** — one test per page/route: render it under a router wrapper (+ any providers the
  app already has, e.g. `QueryClientProvider` if backend-wired), assert it **mounts without crashing**, that
  a **known fixture value appears**, and that any form on the page **surfaces its validation**.
- **E2E (Playwright, if `include_e2e`)** — a per-route happy-path smoke (the app loads; primary nav works).
- **Criteria map (the differentiator)** — each `## Success & outcomes` criterion → **either** an automatable
  Playwright flow **or** a flagged `manual/metric — not automatable` note (e.g. "10 paying customers by
  month 3" is a business metric, not a browser flow). Scope In/MVP flows → E2E happy-paths.
- **Stay scoped (the runaway guard):** cap at `config.max_specs`; if the app implies more, generate the
  **core slice** and list the rest under `Later (not in this pass)`.

### Phase 2 — Confirm once, then generate

Show the plan in **one message** and ask **one** question. Include:
- the levels (unit / component / E2E) and the **file count**,
- the **criteria→test map** — which criteria become automated tests, which are flagged manual/metric,
- what will be added: the Vitest + Testing Library + jsdom + coverage harness, the Playwright `e2e/` layer,
  and the `test` / `test:watch` / `test:coverage` / `test:e2e` scripts,
- the **soft** `coverage_target` (a goal, never a gate),
- that it stays **offline** and the run is **offered, not run**.

Ask: *"Generate this test suite? I'll scaffold everything offline — then hand you the one command to run it.
(yes / tweak something)"* On "tweak", revise and show again. **No per-test interrogation.**

### Phase 3 — Generate the suite (offline; via the `test-writer` agent)

Build **in-session, in order** — all offline, no network, nothing installed:

1. **Harness.** Add (or **extend**, if a setup already exists — never duplicate) to `app/`:
   - a `test` block in `app/vite.config.ts` with `environment: "jsdom"` (component tests need a DOM — this
     differs from `aios/`'s `node` env), `globals: true`, and `setupFiles: ["./src/test/setup.ts"]`;
   - `app/src/test/setup.ts` registering `@testing-library/jest-dom`;
   - coverage via `@vitest/coverage-v8` **pinned to the same major as `vitest`** (both `^4` — a
     coverage-v8/vitest major mismatch is a common footgun);
   - **only if `include_e2e`:** `app/playwright.config.ts` — `use.baseURL` = the app's dev port, **and a
     `webServer` block** (`command: "npm run dev"`, the same port, `reuseExistingServer: !process.env.CI`)
     so `npm run test:e2e` auto-starts the dev server (without it the base URL points at nothing);
   - dev deps in `app/package.json`: `vitest` (+ `@vitest/coverage-v8`), `@testing-library/react`,
     `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, and — **only if `include_e2e`** —
     `@playwright/test`; each added **only if not already present** (`build-backend` may have added
     `vitest` / `@playwright/test`);
   - scripts: `test` (`vitest run`), `test:watch` (`vitest`), `test:coverage` (`vitest run --coverage`),
     and — **only if `include_e2e`** — `test:e2e` (`playwright test`).
2. **Unit tests** — colocated `*.test.ts(x)` next to their targets.
3. **Component/integration tests** — colocated `*.test.tsx` per page, via a small shared render helper
   (router + providers).
4. **E2E (only if `include_e2e`)** — `app/e2e/*.spec.ts` (per-route smoke + the automatable criteria flows).
   When `include_e2e` is false, skip the Playwright config, the `@playwright/test` dep, the `test:e2e`
   script, and the `e2e/` specs **entirely** (the Vitest unit + component tests still ship) and note the
   skip in the manifest.

**Delegation.** Delegate the writing to the **`test-writer`** agent (Read/Write/Edit/Bash, sonnet), which
writes each unit/component test **and runs `vitest` to green**, iterating on failures. It **never installs**:
if the app's dev deps aren't in the working tree, it authors the tests from the source it can read and
reports them **authored-not-run**, leaving the green run to the user's `npm install`. E2E specs are always
authored-not-run (they need browsers). In the template's own flow a freshly built `app/` has no
`node_modules`, so `test-writer` most often authors-not-runs — the run-to-green loop pays off on re-runs and
once the user has installed deps.

### Phase 4 — Record it (provenance)

The **test code** lives in `app/` (a build target outside the knowledge folders, like `aios/`). The
**record** lands in the knowledge base:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; `-2` for same-day re-runs)* — RAG
  frontmatter, then: the test plan, the levels + file list, the **criteria→test map**, the
  `coverage_target`, the deps added, and what's flagged manual/deferred. **Tag it `layer: tests`** (in the
  frontmatter `tags` and a `layer:` line) so it's distinct from the front-end / backend build records.
- **`wiki/build.md`** — add a **`## Tests`** section (preserving the existing Web / Mobile /
  Browser-extension / Backend sections): what's covered, where the tests live, how to run them, the soft
  coverage goal, and links to the `raw/builds/` record + the `outputs/tests/` manifest.
- **`outputs/change-log.md`** — append one attributed line (newest-at-top):
  `- <YYYY-MM-DD> — test-app — generated test suite (unit + component + E2E) for app/ mapped to wiki/charter.md success criteria — applied`

`improve-system` stays the single applier — this skill writes only its own `applied` line, exactly as the
other `build-*` skills do.

### Phase 5 — Hand over (offer, then run only on explicit yes)

Write the coverage/criteria **manifest** to **`outputs/tests/<YYYY-MM-DD>-<slug>/TEST-PLAN.md`** (RAG
frontmatter + the criteria→test map + what's covered + what's flagged manual + the run commands), then close
in plain words. **Do not run anything unprompted** that hits the network or installs to disk — **offer** it
(the same rule `build-app`'s Phase 5 uses before it runs `npm run dev`). The close offers:

> *"Your test suite is ready. To run it: `cd app && npm install` (one time), then `npm test` (that runs
> Vitest). For the browser (E2E) tests, also run `npx playwright install` once — a bigger one-time download
> of test browsers — then `npm run test:e2e`. Want me to run the unit tests for you?"*

On an **explicit yes**, run **only** the Vitest suite (unit + component tests) with `app/` as the working
directory (`cd app && npm install && npm test`) — exactly the Tier-0, explicit-consent convenience
`build-app` ships for the dev server. **Never** run the Playwright browser download (`npx playwright install`) unless the user
explicitly asks (it is a large download); E2E specs stay authored-not-run by default. This is Tier 0 — no
keys, no deploy, nothing irreversible; the run is a convenience, never automatic.

Close: *"Your app now has a real test suite mapped to your success criteria. It's a solid foundation, not
exhaustive — deeper behavioral tests and the criteria I flagged 'manual' are yours to grow."*

## Re-running (incremental, never clobber)

If a test setup already exists, switch to **incremental mode**: read the existing tests + the latest
`raw/builds/` test record, diff the current app/charter against what's covered, and at the confirm gate
offer: **add coverage for new screens/criteria**, **re-derive the suite**, or **both**. Write **new** test
files freely; for any **existing** file, show a diff and **confirm before overwriting**. Each re-run writes
a **new** `raw/builds/` record. **Never clobber a user's hand-written tests.**

## Rules & guardrails

- **Attended-only — never in `maintenance-loop`.** It writes project source and offers `npm install`
  (network + disk); the unattended tick never runs it.
- **Tier 0 — offline, no keys.** Testing needs no keys; scaffolding is fully offline. Only the opt-in **run**
  needs `npm install` / the browser download, which stay the user's (the unit-test run only on explicit yes).
- **Honest about what it is.** Every artifact calls it a **real but non-exhaustive** suite: deep behavioral
  assertions and the `manual/metric` success criteria remain the user's to add. Never a "fully tested"
  overclaim.
- **`improve-system` stays the single applier; `raw/` is immutable.** It writes its own provenance
  (`raw/builds/` record + `wiki/build.md` section + one `change-log.md` line); the test code lives in `app/`.
- **Extends, never duplicates.** A prior test setup (from `build-backend` or an earlier run) is extended,
  not re-created; deps are added only if absent.
- **Web `app/` only (v1).** Test tiers for `mobile/` / `plugin/` are a later phase.

## Output

An `app/` with a real test suite (Vitest + Testing Library + coverage + a Playwright `e2e/` layer + `npm
test` scripts), an immutable `raw/builds/<date>-<slug>.md` record tagged `layer: tests`, a new `## Tests`
section in `wiki/build.md`, one `change-log.md` line, and `outputs/tests/<date>-<slug>/TEST-PLAN.md` — with
the run offered, not forced.

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, read `wiki/charter.md` + the built `app/` + the confirmed
`outputs/autopilot/<date>-<slug>/plan.md`, and **skip your Phase 2 confirm gate** — `autopilot`'s single
plan-confirm already covered it. Generate **offline** via `test-writer` (tests authored; the green run stays
a post-run offer — do **not** run `npm install` or the tests), flag any `(assumed — confirm later)` choice
(inferred criteria mappings) to `autopilot` for its decision ledger, write your `raw/builds/` record +
`wiki/build.md` section + `change-log.md` line as usual, and surface the
`outputs/tests/<date>-<slug>/TEST-PLAN.md` path for `autopilot`'s hand-over. This note is additive — your
attended behavior above is unchanged; `autopilot` is user-initiated and never part of the unattended
`maintenance-loop` (that rule is untouched).
