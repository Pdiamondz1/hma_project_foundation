# Design Spec: `build-app` — turn the charter + design system into a working app

> Status: Approved (2026-06-30). Not yet implemented. A new capability layered on the foundation
> (Phases 0–10). Call it **Phase 11**. One attended, interview-light skill that completes the
> **define → vet → design → build** journey. Tier 0 (mock/local data, no backend, auth, deploy, or
> keys). Web-first; mobile and plugins are explicitly later phases. No API keys.

## Context

**Why this is being built.** The foundation now grills a non-technical user into *what* they're
building (`define-project` → `wiki/charter.md`), *whether it's worth building* (`roast`/`storm-research`
→ `outputs/vetting/`), and *how it should look* (`define-design` → `wiki/design-system.md`). But it
then **stops short of actually building the thing** — the last mile. The user wants the system to
build it *for* them — "without the user trying to figure this out on their own (or even being guided
to do it themselves)." (Reference: Chris Raroque, *"How I Build Apps So Fast"* — the modern Claude
Code build workflow: scaffold → theme → mock data → verify → review.)

**Why it's possible now.** Three of the four pieces already exist, and the **AIOS console is living
proof** the build stack works in this repo: Vite + React 18 + TypeScript + Tailwind 3.4 + shadcn-style
primitives, 13 HSL palette tokens in `aios/src/index.css`, runnable with `npm run dev`. The missing
piece is a skill that turns charter + design-system + vetting into a working, themed app.

**Decisions (made with the user this session):**
1. **First slice = web app.** Mobile (Expo/React Native/Flutter) and plugins (browser/Figma) are
   explicitly **later phases**. Design the provenance generically so those slot in later, but build
   only the web path now. (Rejected: a single "build any app type" skill in v1 — three different
   toolchains, far too big for one phase.)
2. **The built app lives in a new top-level `app/` folder**, separate from the `aios/` knowledge
   console. `app/` is the **end-user product**; `aios/` stays the internal KB dashboard. (Rejected:
   building inside `aios/` — mixes two audiences in one app; a separate sibling repo — loosens the
   live link to the charter/design KB.)
3. **v1 output = a working, themed front-end MVP.** Runnable `npm run dev`, scoped to the charter's
   MVP list, themed from the design system, **mock/local data only** — no backend, accounts, or
   deployment (those are higher tiers later, and they would break the Tier-0 no-keys default).
   (Rejected: full-stack v1 — needs external services/keys; "build plan only" — doesn't deliver
   "build it for them.")

**Intended outcome.** The journey completes: **define → vet → design → build.** A non-technical user
says "build my app" and gets a runnable, on-brand first version of their product, behind one
draft-confirm gate, with one copy-paste command to preview it.

## Architecture

One attended, interview-light skill that reads the three north-stars, confirms a screen plan once,
then scaffolds and themes a new `app/` project — reusing the proven `aios/` stack and the
`define-design` token→CSS mapping. The **code** lives in `app/` (a build target outside the
three-folder knowledge discipline, exactly like `aios/`); the **record** of what was built lands in
the knowledge base.

```
                          ┌──────────────────────────────────────────────┐
  "build my app"  ───────▶│                  build-app                   │
  "build it"              │  0. pre-flight gates (read north-stars)       │
  "make/scaffold the app" │     charter (hard) · design (soft) · vetting  │
  "/build-app"            │  1. derive screen plan from charter In/MVP    │
  what-can-i-do / setup ─▶│     (cap max_screens; honor Out/Later)        │
  advise-project (GO) ───▶│  2. ONE draft-confirm gate ("build this?")    │
                          │  3. scaffold + theme app/  ──────────────────┼──▶ app/  (web app, mock data,
                          │     (in-session, sequential)                  │       runnable `npm run dev`)
                          │  4. provenance ──────────────────────────────┼──▶ raw/builds/<date>-<slug>.md
                          │  5. offer to run/verify, close plainly        │     wiki/build.md  (+ index, change-log)
                          └──────────────────────────────────────────────┘
```

**Parts, reusing existing patterns:**
1. **`build-app` skill** *(new)* — the read → plan → confirm → scaffold → record pipeline. Mirrors the
   `define-*` skills' voice, single draft-confirm gate, and attended discipline.
2. **`app/`** *(written at runtime, not shipped)* — the generated web app; its own minimal project.
3. **`raw/builds/`** *(new dir, ships `.gitkeep` only)* — immutable per-build records.
4. **`wiki/build.md`** *(written at runtime, not shipped)* — the AI-written index of what's been built.
5. **`docs/BUILD-APP.md`** *(new)* — the detail-holder (the `app/` layout, token flow, the later tiers).

## The `build-app` skill

`.claude/skills/build-app/SKILL.md` (+ `.claude/skills/build-app/config.json`). Frontmatter
`name: build-app` + `argument-hint: "[what to build, or leave blank to use your charter]"`; trigger
list: "build my app", "build it", "make the app", "scaffold the app", "turn my idea into a working
app", `/build-app`. Zero-argument safe (no args → use the charter). Voice/structure mirror the
sibling `define-*` skills.

**`config.json`** (all defaulted; never block on absence):
`{ "app_dir": "app", "dev_port": 5174, "max_screens": 6, "include_react_query": false }`
(`dev_port` deliberately ≠ the AIOS console's port so both can run at once.)

### Phase 0 — Pre-flight gates (read the north-stars; route, don't guess)

- **Charter (`wiki/charter.md`) — hard prerequisite.** Nothing to build without a scope. Missing →
  offer to run `define-project` first; if declined, accept a one-paragraph inline scope as a degraded
  fallback (recorded in the build record as "scope supplied in chat — no charter"). Read
  `## Purpose & problem`, `## Audience & users`, and especially `## Scope → In / MVP:`.
- **Design system (`wiki/design-system.md`) — soft prerequisite.** Missing → offer `define-design`;
  if declined, proceed using `aios/src/index.css`'s current default tokens and say so plainly
  ("neutral default theme; run `define-design` and I can re-theme any time"). When present, use its
  Palette (13 tokens + contrast pairs), Typography & shape (`--radius`, type pairing), and Voice.
- **Vetting verdict** — resolve the latest `outputs/vetting/<date>-<slug>/roast-verdict.md` via the
  charter's `## Vetting` link, else the newest folder under `outputs/vetting/`. **GO** → proceed;
  **RESHAPE** → surface the pivot and fold it into the screen plan; **KILL** → **hard stop**, name the
  one-line why + biggest risk, and require an explicit "build anyway" override (recorded); **none** →
  one-line optional roast offer, never forced.
- **Existing `app/`** → switch to incremental mode (see Re-run).

### Phase 1 — Derive the screen plan

Parse the charter's `In / MVP:` free-text into a **small** set of routes/screens, each with the
components it needs and the mock entities it reads. Pick a layout archetype (dashboard · list+detail ·
form-centric · landing+content) from Purpose/Audience and microcopy tone from the design-system Voice.
**Runaway-scope guard:** cap at `config.max_screens` (default 6); if the MVP implies more, build the
**core slice** (the 3–6 most central screens) and list the rest as `Later (not in this build)`. The
charter's `Out`/`Later` sections are honored as hard exclusions.

### Phase 2 — Single draft-confirm gate

One message, one confirm — consistent with `define-project`/`define-design`, but **minimal
hand-holding** per the user's intent. ("Single gate" means the *build* decision; the Phase 0
pre-flight routing — offering `define-project`, accepting an inline scope, the KILL "build anyway"
override — are separate pre-flight interactions, not extra build gates.) Show: app name + one-liner
(from charter), the route/screen list
(one line of purpose each), components + mock entities per screen, the theme source
(`wiki/design-system.md` or "neutral default"), the stack + that it lives in `app/` runnable with
`npm run dev`, anything deferred (core-slice note), and the folded-in vetting status. Ask once:
*"Build this? I'll create the `app/` folder and you'll be able to preview it. (yes / tweak
something)."* On tweak → revise, show again, confirm. No per-screen interrogation.

### Phase 3 — Scaffold + build `app/` (in-session, sequential)

**Build mechanic — in-session for v1.** A scaffolded app is mostly **shared spine** (`package.json`,
the three `tsconfig`s, `tailwind.config.ts`, `index.css` theme, `App.tsx` routing, `main.tsx`, the
shared UI primitives, the mock-data layer) with hard sequential dependencies — exactly the case *not*
to fan out to parallel agents. For a `max_screens ≤ 6` MVP, in-session keeps the build attended,
coherent, and inside the single confirm gate (how `setup-project`/`define-design` already touch
project source). **Documented for LATER (large MVPs only):** once the spine + a fixed contract (route
list, component prop signatures, mock-data shapes, design tokens) is written in-session, leaf pages
*may* be fanned out — each owns exactly one `src/pages/X.tsx`; the coordinator wires `App.tsx` routing
after. Not in v1.

**`app/` directory layout** (its own minimal project — the end-user product, NOT the KB console):

```
app/
├── package.json          # own; shared subset of aios majors (see below). Scripts: dev/build/preview/typecheck
├── vite.config.ts        # plain Vite + @vitejs/plugin-react + "@" alias; NO fileApi middleware; server.port = dev_port
├── index.html            # <html class="dark"> if design is dark-first; <title> + meta from charter
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json   # copied from the aios shape
├── postcss.config.js     # tailwind + autoprefixer (identical to aios)
├── tailwind.config.ts    # copied from aios (resolves CSS vars; no hardcoded colors)
├── .gitignore            # node_modules, dist (also covered by the root .gitignore bare patterns)
├── README.md             # how to run + "themed front-end MVP, mock data" + pointer to raw/builds record
├── public/               # optional favicon/emblem
└── src/
    ├── main.tsx          # mirrors aios main.tsx (createRoot + import "./index.css")
    ├── App.tsx           # BrowserRouter + a <Route> per screen under a shared AppShell layout
    ├── index.css         # 13 base tokens + contrast pairs + --radius + shadows, FROM design-system
    ├── vite-env.d.ts
    ├── lib/utils.ts      # the cn() helper (copied)
    ├── config/app.ts     # app name/tagline mirrored from charter (words only)
    ├── components/ui/    # ONLY the primitives used (button, card, input, badge…) — copied shadcn-style
    ├── components/layout/AppShell.tsx   # themed nav/header
    ├── pages/            # one file per derived route
    └── data/             # typed mock fixtures + getX()/listX() accessors — no fetch, no env, offline
```

**`package.json` — pin the shared subset of the aios majors.** To prevent **stack drift**, the skill
reads `aios/package.json` at runtime and pins the **same major versions it finds there** for the
shared subset (single source of truth), rather than hardcoding versions in the skill text. Shared
subset (current aios values, for reference): `react ^18.3.1`, `react-dom ^18.3.1`,
`react-router-dom ^6.26.2`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^2.5.2`,
`tailwindcss-animate ^1.0.7`, `lucide-react ^0.462.0`; dev: `vite ^5.4.1`,
`@vitejs/plugin-react ^4.3.4`, `typescript ^5.5.3`, `tailwindcss ^3.4.11`, `autoprefixer ^10.4.20`,
`postcss ^8.4.47`, `@types/node`, `@types/react ^18.3.3`, `@types/react-dom ^18.3.0`
(`@tailwindcss/typography ^0.5.15` only if the design uses prose). **Deliberately excluded**
(KB-console-specific, not the end-user product): `@anthropic-ai/sdk`, `@supabase/supabase-js`,
`gray-matter`, `react-markdown`, `remark-gfm`, `vitest`, and `@tanstack/react-query` (off by default
via `include_react_query:false` — mock data needs no query cache).

**Token + typography flow (design-system → app).** Reuse the **exact** mapping `define-design` uses to
theme the console, applied to `app/src/index.css` instead of `aios/src/index.css`: write the 13 base
tokens for `:root` and `.dark`, and **re-derive + sanity-check the paired contrast tokens**
(`--*-foreground`, `--popover`/`--popover-foreground`) against the palette so text stays legible.
Set `--radius` and the shadow vars from Typography & shape. `tailwind.config.ts` is copied unchanged
(it only reads the CSS vars). Default to the Inter/system stack already in `aios/tailwind.config.ts`;
only if the design names a webfont, add a `<link>` in `app/index.html` and the family in the config
(keep webfont loading minimal for v1). Honor the design-system "dark-first?" answer for the
`<html class>`; default dark like `aios/`.

**Mock/local data approach.** A `src/data/` module per entity with typed fixtures (plain TS
arrays/objects) and small accessor functions (`getX()`, `listX()`), imported directly by pages. No
fetch, no env, no network — fully Tier-0/offline. Every page is clearly a **front-end MVP with
placeholder data**; this is stated in `app/README.md` and `wiki/build.md` so no one mistakes it for a
live backend.

**Routes/pages/components.** `App.tsx` mirrors `aios/src/App.tsx` (BrowserRouter + a `<Route>` per
screen under a shared `AppShell`). Pages live in `src/pages/`, shared primitives in
`src/components/ui/` (copied only as needed), the themed nav in `src/components/layout/AppShell.tsx`.
Components reuse the proven shadcn-style `cva` primitives so the look matches the foundation's quality
bar.

### Phase 4 — Provenance & KB integration (fits the 3-folder rules)

`app/` holds the **code** (a build target like `aios/`, outside knowledge discipline). The **record**
of what/why/when lands in the knowledge base:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** — immutable, append-only build record (RAG frontmatter —
  `title`/`source_id`/`path`/`tags`/`updated`; a new dated file per build, `-2` suffix for same-day
  re-runs). Captures: the confirmed screen plan, components, mock entities, theme source + a token
  snapshot reference, the charter version, the vetting verdict referenced (+ any KILL override), the
  pinned stack/versions, and anything deferred. Follows the `raw/project/` (define-project discovery
  record) precedent — AI-written but immutable ground truth, append-only.
- **`wiki/build.md`** — AI-written index (created at runtime on first build, like `roast` creates
  `wiki/vetting.md`; normal wiki maintenance, no sign-off; opens with the standard RAG frontmatter per
  `docs/WIKI-FRONTMATTER.md`). Holds: the current app summary, the route
  list, where it lives (`app/`), the one-command run instructions, the theme source, and links to the
  `raw/builds/` record(s), `wiki/charter.md`, and `wiki/design-system.md`. Cross-linked from
  `wiki/index.md` (pinned under "By area" + a "Recent additions" line) on first creation. No pasted
  code — it references the raw record.
- **`outputs/change-log.md`** — one attributed line per build (attended write touching project source,
  so `applied`, like `setup-project`/`define-design` console theming), following the file's prevailing
  order (newest-at-top, as the sibling skills write it):
  `- <YYYY-MM-DD> — build-app — scaffolded web app (app/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

This respects the rules: `raw/builds/` is append-only ground truth; `wiki/build.md` is an AI-written
index that **references** the raw record; `outputs/change-log.md` gets one attributed `applied` line
written by the skill; `app/` itself stays out of all three. **`improve-system` remains the single
applier for the self-improvement lanes — untouched** (`build-app` writes its own `applied` line, as
`define-project`/`define-design` already do).

### Phase 5 — Offer to run/verify, then close plainly

Don't auto-run anything that touches the network or disk-installs. **Offer** the commands (like
`setup-project` step 8 "offer follow-ups — don't run without a yes"): `cd app && npm install` (explained
plainly as "this downloads the app's building blocks from the internet"), then `npm run dev`, naming
the exact localhost URL (`http://localhost:<dev_port>`), plus an offer to start it for them. Optional
verify: `npm run typecheck`; if a browser MCP is available, optionally screenshot the running app and
offer to fix any type errors on the spot. Note that the app's port differs from the console's so both
can run at once.

### Re-run / idempotency

`app/` exists → **incremental, never clobber.** Read the existing `app/`, the latest `raw/builds/`
record, and `wiki/build.md`. Diff the current charter MVP against what's already built and present a
menu at the confirm gate: (1) **add/update screens** (deltas only), (2) **re-apply the theme** from
the current `wiki/design-system.md`, (3) **both**. New files are written freely; **existing files are
shown as a diff and confirmed before overwrite.** Each re-run writes a **new** `raw/builds/` dated
record and updates `wiki/build.md` in place. Detect a partial/broken prior build (missing spine files)
and offer targeted repair.

**Re-theming ownership.** `build-app` is the **single owner/applier of everything under `app/`,
including its theme** (one applier per target: `define-design`→`aios/`, `build-app`→`app/`). A restyle
= re-run `build-app`, which detects `app/` and offers the theme-only refresh (option 2) using the
current `wiki/design-system.md`. We **do not** extend `define-design` Phase 7 to also write `app/`
(that would couple `define-design` to a folder it doesn't own and split applier ownership).

## Wiring

- **`.claude/skills/what-can-i-do/SKILL.md`** — new menu item: *"Build a first version of your app —
  turn your plan into something you can click → runs `build-app`."*
- **`.claude/skills/setup-project/SKILL.md`** — in the "Offer follow-ups" step, add a one-clause offer:
  once charter + design exist, *"want me to build a first version of your app? → `build-app`"*
  (propose-only, never auto-run).
- **`.claude/skills/advise-project/SKILL.md`** *(light)* — one additive clause in the `project`-lane
  promotion note: a **GO-vetted** idea's brief may point to `build-app` as the next step.
  **Propose-only**; `build-app` is **never** auto-spawned inside the unattended `maintenance-loop` tick.
  No change to scoring, lenses, or the propose-only invariants.
- **`CLAUDE.md`** — add one `build-app` Skills bullet; add `raw/builds/` to the `raw/` subfolder list
  (one line: the app itself lives in `app/`); add one note that `app/` (like `aios/`) is a **build
  target outside the knowledge discipline**. **Keep the file under the `<125`-line working cap**
  (currently ~102 lines). Detail lives in `docs/BUILD-APP.md`.
- **`docs/BUILD-APP.md`** *(new)* — the detail page: what `build-app` does, ships-vs-runtime, the
  `app/` layout, the token/theme flow, the screen-cap/core-slice logic, re-run behavior, how to preview,
  the two-dev-servers/port note, and the explicitly-LATER tiers (real data/auth/deploy, mobile,
  plugins). `CLAUDE.md` stays a pointer.
- **`README.md`** — extend the journey to **define → vet → design → build**; add Phase 11 to the
  build-status list; link `docs/BUILD-APP.md`; optionally a "What you get" bullet (🛠️ *Built for you*).
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — add the build step completing the sequence and a line that
  `app/` is the generated **Tier-0 front-end MVP** product target (backend/mobile/plugins are later
  tiers).
- **`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`** — a **Phase 11 addendum** in
  the same voice as Phases 5/6/8/9/10; note the `raw/builds/` + `wiki/build.md` provenance is generic
  enough that future `build-mobile`/`build-plugin` slices add parallel records and their own target
  folders without reworking the model.

## Graceful-off / keys / tiers / safety

- **Attended-only; never added to `maintenance-loop`.** Justified by precedent and contract: (1) it
  creates/overwrites **project source** — the same reason `setup-project` and `define-design`
  console-theming are attended-only and excluded from the loop; (2) it offers `npm install` (network +
  arbitrary postinstall + disk), which must never happen unattended; (3) it is built around a human
  confirm gate; (4) the loop's guarantee is "never applies anything beyond `improve-system`'s
  AUTO-APPROVE bucket." The skill states this invariant; `maintenance-loop/SKILL.md` is **not**
  modified to call it.
- **Tier 0 / no keys / mock data only.** The v1 app has no backend, auth, deploy, env, or secrets —
  mock data only; nothing collected in chat. Scaffolding writes only local files and works fully
  offline; only the opt-in `npm install` needs the network — if offline, the app is still fully written
  and the user is told to install when back online. The Tier-0 default of the foundation is preserved.
- **No API keys are ever collected in chat.**

## Files

**Create (shipped):** `.claude/skills/build-app/SKILL.md`, `.claude/skills/build-app/config.json`,
`docs/BUILD-APP.md`, `raw/builds/.gitkeep`.
(`app/**`, `raw/builds/<date>-<slug>.md`, `wiki/build.md`, and the `wiki/index.md` cross-links + the
`change-log.md` line are written by the skill at runtime in a user's clone — **not shipped**.)

**Modify (shipped):** `CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`,
`.claude/skills/what-can-i-do/SKILL.md`, `.claude/skills/setup-project/SKILL.md`,
`.claude/skills/advise-project/SKILL.md`.

## Verification

- **Authoring fidelity:** the skill reads the three north-stars and routes correctly (charter hard,
  design soft, vetting GO/RESHAPE/KILL/none); derives a capped screen plan from the charter MVP; has
  exactly one draft-confirm gate; scaffolds an `app/` that mirrors the proven `aios/` stack; and themes
  `app/src/index.css` via the same 13-token mapping `define-design` uses. Every path the skill names is
  real or runtime-created.
- **Stack fidelity:** the generated `package.json` pins the **shared subset** read from
  `aios/package.json` and excludes the KB-console-only deps; `tailwind.config.ts` is copied; the Vite
  config has no fileApi middleware and uses `dev_port`.
- **Provenance:** a build writes `raw/builds/<date>-<slug>.md` (immutable), creates/updates
  `wiki/build.md` (+ `wiki/index.md` cross-links), and appends one attributed `applied` change-log
  line; `app/` stays out of `raw/`/`wiki/`/`outputs/`. `improve-system` unchanged.
- **Safety:** the skill is attended-only and `maintenance-loop/SKILL.md` is **not** modified to call it;
  `npm install`/`npm run dev` are offered, never run by the skill; KILL requires an explicit override;
  no keys requested anywhere; works offline (install deferred).
- **Wiring:** `what-can-i-do` shows the item; `setup-project` and `advise-project` changes are additive
  and propose-only; `wc -l CLAUDE.md` **< 125** with the bullet + notes added; README/USING mention the
  build step; the design-spec addendum points here.
- **No pollution:** `git status` clean aside from the intended files; **no `app/` and no `app/.gitkeep`
  committed** (a `.gitkeep` would falsely imply `app/` is a knowledge-discipline folder; `app/` is a
  build target that doesn't exist until built); only `raw/builds/.gitkeep` ships; **do not run a real
  build against this template repo.**

## Out of scope (v1)

- **Mobile and plugin builds** (Expo/React Native/Flutter; browser/Figma extensions) — explicitly
  later phases; the provenance model is written to accommodate them without rework.
- **Backend/data/auth/deploy** — higher tiers later; v1 is mock/local data only (keeps Tier 0 intact).
- **Parallel-subagent leaf-page builds** — documented as a later optimization for large MVPs only; v1
  builds in-session.
- **An AIOS console "Builds" surface** — the seam is open (`wiki/build.md` + `raw/builds/` are readable
  via the existing Wiki/Raw pages); a dedicated panel could come later.
- **Auto-building without asking** — always behind the single draft-confirm gate.
- Any change to `raw/` immutability, the approval discipline, or `improve-system`'s role.
