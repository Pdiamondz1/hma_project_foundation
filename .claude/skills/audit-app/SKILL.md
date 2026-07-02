---
name: audit-app
description: Use when someone asks to "audit my app", "is my app safe/secure", "security review", "check for vulnerabilities", "check accessibility", "is my app accessible", "is my app fast", "check performance", or says "/audit-app". Reads the already-built web app in app/ and produces ONE prioritized findings report across three lenses — security (deps + secrets + authz/injection/OWASP-style), accessibility (WCAG), and performance — tagged by severity (CRITICAL/MAJOR/MINOR/INFO). PROPOSE-ONLY: writes only a report to outputs/audits/, never modifies the app, never auto-fixes, never writes raw/wiki/change-log (mirrors codex-review). Reasoning-first and fully OFFLINE; npm audit / Lighthouse / axe are OFFERED, never run unprompted. No confirm gate (it changes nothing). Requires a built app/. Tier 0. On-demand; never in the maintenance loop. Re-runnable. Zero-argument safe.
argument-hint: "[leave blank to audit everything, or name a lens: security / accessibility / performance]"
---

# audit-app

The "prove it's safe" step. `build-app` builds it, `build-backend` makes its data real, `test-app` proves it
works — this skill checks it's **safe, accessible, and fast**. It reads the built `app/` + charter and
produces **one prioritized findings report** across three lenses — **security**, **accessibility (WCAG)**,
and **performance** — each finding tagged with a severity and a concrete fix.

It is **propose-only**, mirroring `codex-review`: it writes **only** a findings report to
`outputs/audits/<date>-<slug>/AUDIT.md` (+ its run-state). It **never modifies the app, never auto-fixes a
finding, and never writes** the `raw/builds/` / `wiki/build.md` / `change-log.md` provenance spine that the
`build-*` skills use — an audit is a *proposal*, not an applied change. Because it changes nothing, it has
**no confirm gate**: it reads and reports, like `codex-review`.

The report is **reasoning-first and fully offline** — it always works with no tools. The deeper,
tool-assisted checks (`npm audit` for live CVEs, Lighthouse for performance, axe for dynamic a11y) are
**offered, never run** for you (they need `npm install` / a browser); the report lists the exact commands.

## When to use

When the user says "audit my app", "is my app safe / secure", "security review / check for vulnerabilities",
"check accessibility / is it accessible", "is my app fast / check performance", or `/audit-app`. Also offered
by `what-can-i-do` and pointed to by `advise-project` after a build. It **requires an already-built `app/`**
(from `build-app`). **On-demand** (and an opt-in `autopilot` tail); it is propose-only, so it is safe, but it
is **not** wired into the unattended `maintenance-loop` (a loop hook is a later option).

## Configuration

Read `.claude/skills/audit-app/config.json` (all values default; never block on absence):
- `app_dir` (default `"app"`) — the built web app to audit.
- `dimensions` (default `["security","accessibility","performance"]`) — the enabled lenses (narrow to one,
  e.g. `["security"]`, to run a single lens).
- `caution_severity` (default `"CRITICAL"`) — the threshold at/above which a finding is surfaced
  **prominently** (in the `autopilot` ledger/hand-over when chained). **There is no cap on findings** — a
  safety audit never hides an issue behind a limit.

## Severity scale

Every finding is tagged (the `codex-review` canon): **CRITICAL > MAJOR > MINOR > INFO** — plus its lens, a
`file:line` location where applicable, why it matters, and a concrete remediation.

## Procedure

`audit-app` runs like `codex-review` — **no interview, no confirm gate.** It reads, reasons, and writes a
report; it changes nothing.

### Phase 0 — Pre-flight (require the app; read it; route, don't guess)

1. **A built `app/` (required).** There is nothing to audit without it.
   - **Missing →** offer `build-app` first: *"An audit checks an app you've already built. Want me to build
     the app first, then audit it?"* On yes, run `build-app`, then continue. On no, stop gracefully.
   - Read the app: `package.json` (deps → the dependency check; scripts), `src/` (JSX → the a11y lens; app
     code → injection/authz/XSS review), `src/index.css` (the design-system tokens → contrast), the Vite
     config, any `.env.example`; and `src/data/store/` + auth if `build-backend` ran (→ deeper authz/RLS
     review).
2. **Charter — `wiki/charter.md` (recommended).** Read `## Audience & users` (a broad/public audience raises
   the WCAG bar; an internal tool lowers it) and any data-sensitivity/compliance constraints. **Missing →**
   audit with default assumptions and flag it.
3. **Config.** Read `config.dimensions` for which lenses to run; read `wiki/build.md` + the latest
   `raw/builds/` record for what exists (and whether a backend is wired).

### Phase 1 — Run the enabled lenses (reasoning-first, offline)

- **Security.** (a) **Dependencies** — read `package.json`, flag outdated/risky patterns; **offer** `npm
  audit` for the live advisory DB (offer-don't-run — needs `npm install`). (b) **Secrets** — offline regex
  scan for hardcoded keys/tokens/passwords; flag any real committed `.env` (vs the `.env.example` template).
  (c) **Code** — authorization (auth guards present? Supabase RLS shared-read/authenticated-write, not
  anon-writable? any client-only "protection"?), input-validation / injection, XSS
  (`dangerouslySetInnerHTML`, unsanitized HTML), insecure config. (d) An **OWASP-style checklist** scoped to
  a Vite + React + Supabase app (injection, broken auth, sensitive-data exposure, misconfig, XSS, vulnerable
  components).
- **Accessibility (WCAG).** Static JSX review: images without `alt`, inputs without labels, controls without
  accessible names, heading order, semantic HTML vs `div` soup, aria misuse, keyboard/focus reachability, and
  **color contrast computed from the design-system tokens in `src/index.css`** against WCAG AA (the charter's
  audience sets the bar). **Offer** axe / Lighthouse-a11y for the dynamic parts (offer-don't-run — needs a
  running app + browser).
- **Performance.** Static review: heavy/duplicate deps, missing code-splitting / lazy-loading, large
  unoptimized images/assets, obvious re-render or blocking-resource risks; **name what only a runtime pass
  can measure** (LCP / CLS / TBT / bundle size). **Offer** `npm run build` + Lighthouse against the preview
  build (offer-don't-run — needs install + a headless browser).

### Phase 2 — Prioritize & write the report

Write **`outputs/audits/<YYYY-MM-DD>-<slug>/AUDIT.md`** — RAG frontmatter (`title`, `source_id:
outputs:audit:<date>-<slug>`, `max_severity`, per-dimension `counts`, `updated`), then a summary header
(per-lens counts + `max_severity`) and, per lens, the findings (each: severity, `file:line`, the issue, why
it matters, a concrete remediation). End with a **"Tool-assisted deepening"** section: the exact `npm audit`
/ `npm run build` + Lighthouse / axe commands to run for the live checks, marked *offered, not run*. State
plainly that a static audit is real but **not** a substitute for a full pen-test / live scan, and name what
only the tool runs can surface.

### Phase 3 — Hand over (propose-only; offer-don't-fix, offer-don't-run)

Point the user at the report and summarize (per-lens counts + `max_severity` + the top findings). **Never
auto-fix** any finding — a fix is a separate, user-picked, attended action; offer to fix specific findings on
request. **Offer** the tool-assisted checks and — exactly as `test-app` / `build-app` do — run one only on an
**explicit yes** (e.g. `cd app && npm install && npm audit`), **never** the Lighthouse browser download
unprompted. Close plainly: *"Here's your audit — <N> findings (<max_severity> highest). Nothing's changed;
these are recommendations. Want me to fix any of them, or run the deeper `npm audit` / Lighthouse checks?"*

## Re-running

Each run writes a **new** dated report under `outputs/audits/`; nothing is overwritten. After fixes, re-run
for a fresh report to diff against the prior one.

## Rules & guardrails

- **Propose-only — writes only inside `outputs/`.** The report (`outputs/audits/<date>-<slug>/AUDIT.md`) +
  run-state (`outputs/runs/audit-app.json`). It **never** modifies the app, **never** auto-fixes, and
  **never** writes `raw/` / `wiki/` / `change-log.md`. `improve-system` stays the single applier. (This is
  the `codex-review` shape — stronger than the `build-*` family.)
- **Offline, no keys.** The audit reasons offline; `npm audit` / Lighthouse / axe need `npm install` / a
  browser and are **offer-don't-run** — run only on an explicit yes, never the browser download unprompted.
- **Honest about what it is.** A real, useful **static** audit — not a full pen-test, live CVE scan, or
  runtime a11y/perf measurement. Every report names what only the offered tool runs can find.
- **No confirm gate** (it changes nothing) — not an omission; the `codex-review` shape.
- **On-demand + autopilot-opt-in; NOT in `maintenance-loop`.** Propose-only means a loop hook is *possible*
  later (as `codex-review` has), but this phase does not wire one.
- **Requires a built `app/`; web-only (v1).** Auditing `mobile/` / `plugin/` is a later phase.

## Output

One prioritized findings report at `outputs/audits/<date>-<slug>/AUDIT.md` (security + accessibility +
performance, severity-tagged, with remediations + the offered tool commands) and
`outputs/runs/audit-app.json` run-state — with nothing in the app changed and nothing fixed unless the user
asks.

## Autonomous invocation (driven by `autopilot`)

When invoked by `autopilot` rather than a human, read `wiki/charter.md` + the built `app/` + the confirmed
`outputs/autopilot/<date>-<slug>/plan.md`, run the enabled lenses **offline (reasoning only — do NOT run
`npm audit` / Lighthouse / `npm install`)**, write the `outputs/audits/<date>-<slug>/AUDIT.md` report, and
**surface any finding at/above `caution_severity` (CRITICAL by default) — plus the report path — to
`autopilot` for its decision ledger / hand-over.** It fixes nothing and applies nothing (propose-only holds).
This note is additive — the on-demand behavior above is unchanged; `autopilot` is user-initiated and never
part of the unattended `maintenance-loop` (that rule is untouched).
