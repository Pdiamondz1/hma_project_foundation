# build-plugin Implementation Plan (Phase 13)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author the `build-plugin` skill (+ doc + wiring) — the browser-extension sibling of
`build-app`/`build-mobile` — that turns a project's charter, design system, and vetting verdict into a
themed **Manifest V3 browser extension** (popup + options page) in a new top-level `plugin/` folder,
previewed in Chrome via **Load unpacked**. Author only; never build a real extension into this template.

**Architecture:** One attended Claude Code skill (`.claude/skills/build-plugin/SKILL.md` +
`config.json`) plus a detail doc (`docs/BUILD-PLUGIN.md`) and small wiring edits. The skill mirrors
`build-app` (same phases, guardrails, provenance) but scaffolds a **plain Vite + React + TypeScript +
Tailwind → MV3** project into `plugin/` (popup + options page, hand-written `manifest.json`), themed
from the same 13 HSL tokens, and records the build on the **shared** `raw/builds/` + `wiki/build.md`
spine tagged `target: plugin`. `plugin/` is a build target outside the three-folder knowledge discipline.

**Tech Stack:** Markdown/JSON skill authoring (no code/tests). Source of truth: the committed spec
`docs/superpowers/specs/2026-06-30-build-plugin-design.md`. Verification is by `grep`/`wc`/`git` DoD
checks (documentation, not code — there is no test suite).

**Branch:** all work happens on `phase-13-build-plugin` (already created off `main`; the spec is already
committed there). The Task 8 `git diff main..HEAD` checks depend on it — do not commit on `main`.

**Discipline (every task):** Ship ONLY the skill + doc + wiring edits. **No new `.gitkeep`**
(`raw/builds/.gitkeep` already ships). **Never** create a real `plugin/`, `raw/builds/<date>-<slug>.md`,
or `wiki/build.md`. **Never** run a real build. Keep `CLAUDE.md` under 125 lines. Leave `build-app`,
`build-mobile`, `improve-system`, `maintenance-loop`, and `raw/` immutability untouched (this phase only
ADDS the plugin skill + additive wiring).

---

### Task 1: Skill config — `config.json`

**Files:**
- Create: `.claude/skills/build-plugin/config.json`

- [ ] **Step 1: Create `.claude/skills/build-plugin/config.json`** with exactly:

````json
{
  "plugin_dir": "plugin",
  "surfaces": ["popup", "options"],
  "max_views": 6,
  "include_side_panel": false
}
````

- [ ] **Step 2: Verify DoD**

Run: `node -e "console.log(require('./.claude/skills/build-plugin/config.json').plugin_dir)"` → expect `plugin`.
(No `raw/builds/.gitkeep` to create — it already ships from Phase 11.)

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/build-plugin/config.json
git commit -m "feat(build-plugin): skill config"
```

---

### Task 2: The `build-plugin` SKILL.md

**Files:**
- Create: `.claude/skills/build-plugin/SKILL.md`

**Context for the implementer:** The core artifact. Write it in the voice/structure of
`.claude/skills/build-app/SKILL.md` and `.claude/skills/build-mobile/SKILL.md` (its siblings) — calm,
plain, procedural. The full content is given below; write it verbatim (it encodes the committed spec
`2026-06-30-build-plugin-design.md`). Do not invent extra features.

- [ ] **Step 1: Create `.claude/skills/build-plugin/SKILL.md`** with exactly this content:

````markdown
---
name: build-plugin
description: Use when someone asks to "build my browser extension", "build the extension", "make a browser plugin", "build it for Chrome", "turn my idea into a browser extension", or says "/build-plugin". Turns the project's charter (the MVP scope) + design system (the theme) into a working, themed Manifest V3 browser extension (popup + options page) in a new top-level plugin/ folder, previewed in Chrome via "Load unpacked". Reads wiki/charter.md, wiki/design-system.md, and the latest outputs/vetting/ verdict; one view-plan confirm gate; Tier 0 (mock/local data — no backend, auth, deploy, permissions, accounts, or keys). Attended-only — never runs in the maintenance loop. Re-runnable: adds views incrementally and never overwrites a file without asking. Zero-argument safe.
argument-hint: "[what to build, or leave blank to use your charter]"
---

# build-plugin

The browser-extension sibling of `build-app`. The foundation already helps a non-technical user get
clear on *what* they're building (`define-project` → `wiki/charter.md`), *whether it's worth building*
(`roast`/`storm-research` → `outputs/vetting/`), and *how it should look* (`define-design` →
`wiki/design-system.md`). This skill turns those three north-stars into an actual, working, on-brand
**browser extension** they can load into Chrome and try — without making them figure out any of the
building themselves.

What it produces: a new top-level **`plugin/`** folder — its own minimal **Vite + React + TypeScript +
Tailwind** project (the same proven stack as the `aios/` console and the web app) that builds to a
**Manifest V3** extension with a **popup** + an **options page**, themed from the design system (the
same 13 tokens as the web app), wired to **mock/local data**. You preview it in Chrome by turning on
Developer mode and clicking **Load unpacked** — no accounts, no store, no packaging. It is a **front-end
MVP with placeholder data** — no backend, accounts, permissions, or store submission (those are later
tiers).

## When to use

When the user says "build my browser extension", "build the extension", "make a browser plugin", "build
it for Chrome", "turn my idea into a browser extension", or `/build-plugin`. Also offered by
`what-can-i-do`, by `setup-project` once a charter + design exist, and pointed to by `advise-project`
for a GO-vetted idea. It is **attended** — it asks one confirming question before building — and **never
runs in the unattended `maintenance-loop`**. This is the browser-extension sibling of `build-app` (web
→ `app/`) and `build-mobile` (phone → `mobile/`).

## Configuration

Read `.claude/skills/build-plugin/config.json` (all values default; never block on absence):
- `plugin_dir` (default `"plugin"`) — where the extension is written.
- `surfaces` (default `["popup", "options"]`) — the MV3 UI surfaces built by default. The
  `manifest.json` is generated from the surfaces actually built.
- `max_views` (default `6`) — the cap on distinct views built in one pass (the runaway-scope guard).
- `include_side_panel` (default `false`) — when true, add a third `chrome.sidePanel` surface (+ its
  opt-in `sidePanel` permission).

(No `dev_port` — there is no dev server for the extension context; preview is a build + Load unpacked,
with `vite preview` as an optional browser quick-look.)

## Procedure

### Phase 0 — Pre-flight (read the north-stars; route, don't guess)

Read the three inputs, in order, and **route** rather than guess:

1. **Charter — `wiki/charter.md` (required).** There is nothing to build without a scope.
   - **Missing →** offer to run `define-project` first: *"To build the right thing, I need to know
     what we're building. Want me to run a quick discovery interview first? It only takes a few
     minutes, then I'll build straight from it."* On yes, run `define-project`, then read the charter.
     On no, accept a **one-paragraph scope in chat** as a degraded fallback (record it in the build
     record as "scope supplied in chat — no charter").
   - Read `## Purpose & problem`, `## Audience & users`, and especially `## Scope` → the **In / MVP**
     list. Treat `Out` and `Later` as hard exclusions.
2. **Design system — `wiki/design-system.md` (recommended).**
   - **Missing →** offer `define-design`: *"Want to set how it looks first, so it isn't generic?"* If
     declined, proceed with the default tokens (the `aios/src/index.css` reference values) and say so
     plainly: *"I'll use a clean default theme — run `define-design` any time and I'll re-theme the
     extension."*
   - When present, use its **Palette** (the 13 HSL tokens + their contrast pairs), **Typography &
     shape** (`--radius`, the type pairing), and **Voice** (microcopy tone).
3. **Vetting verdict — the latest `outputs/vetting/<date>-<slug>/roast-verdict.md`** (via the
   charter's `## Vetting` link, else the newest folder under `outputs/vetting/`):
   - **GO** → proceed.
   - **RESHAPE** → surface the pivot line and **build the reshaped version**; fold it into the plan.
   - **KILL** → **stop.** *"This idea was judged **KILL** — '<one-line why>'. Building it as-is risks
     <biggest risk>. I'd reshape it first (run `define-project`). To build it anyway, say
     'build anyway'."* Continue **only** on that explicit override, and record the override in the
     build record.
   - **No vetting found →** one-line optional offer (*"Want a quick gut-check first? Say `roast`.
     Otherwise I'll go ahead."*) — never force it.
4. **Existing `plugin/` →** switch to **incremental mode** (see *Re-running*).

### Phase 1 — Derive the view plan

From the charter's **In / MVP** list, derive the extension's **surfaces + views**:
- **Popup** (always) — the toolbar-click window; the primary surface. It may hold a **small** set of
  views (e.g. a main view + a detail or quick-action view).
- **Options page** (default on — it's in `config.surfaces`) — a full-tab page for preferences, an
  "about", or a fuller workspace. Build it by default; **omit it only** if the MVP genuinely has no
  settings or secondary content (then drop the `options_page` key from the manifest and skip its
  files). Don't invent settings just to fill it.
- **Side panel** (only when `config.include_side_panel` is true) — an optional third surface
  (`chrome.sidePanel`), same rendering model, one more HTML entry.

Each view maps to the components it needs and the mock entities it shows. Use `Purpose`/`Audience` to
choose the popup's shape (a compact dashboard, a quick-capture form, a list, a toggle panel) and the
design system's **Voice** for the wording. The `manifest.json` is generated from the **resolved**
surface set — a surface that isn't built has no manifest entry and no HTML file.

**Stay scoped (the runaway guard):** cap the total distinct views at `config.max_views` (default 6). If
the MVP implies more, build the **core slice** — the most central views — and list the rest under
`Later (not in this build)`. Never exceed the cap in one pass. Honor the charter's `Out`/`Later` as hard
exclusions.

### Phase 2 — Confirm once, then build

Show the plan in **one message** and ask **one** question. ("Single gate" = the build decision; the
Phase 0 routing above is separate pre-flight.) Include:
- the extension's name + one-liner (from the charter),
- the **surfaces + views** — one line of purpose each,
- the components + mock entities per view,
- the **theme source** (`wiki/design-system.md`, or "clean default"),
- the **stack** (plain Vite + React + Tailwind → Manifest V3) and that it lives in `plugin/`, previewed
  in Chrome via **Load unpacked**,
- anything **deferred** (the core-slice note), and
- the **vetting status** folded in.

Ask: *"Build this? I'll create the `plugin/` folder and you'll be able to load it into Chrome to try it.
(yes / tweak something)"* On "tweak", revise and show again. **No per-view interrogation.**

### Phase 3 — Scaffold + theme `plugin/`

Build **in-session, in order** (the scaffold is mostly shared spine with hard dependencies — not
something to fan out to parallel agents). Hand-write the project **offline**. Popup/options are
multi-page Vite HTML entries at the project root; `manifest.json` + icons live in `public/` so Vite
copies them verbatim into `dist/`. Create `plugin/` as its own minimal project:

```
plugin/
├── package.json          # own; mirror aios/ majors for the shared subset (read aios/package.json):
│                         #   react, react-dom, class-variance-authority, clsx, tailwind-merge,
│                         #   tailwindcss-animate, lucide-react; dev: vite, @vitejs/plugin-react, typescript,
│                         #   tailwindcss, autoprefixer, postcss, @types/react, @types/react-dom, and
│                         #   @types/chrome (the ONLY extension-specific add). EXCLUDE the KB-console-only deps
│                         #   (@anthropic-ai/sdk, @supabase/supabase-js, gray-matter, react-markdown, remark-gfm,
│                         #   vitest, @tanstack/react-query, react-router-dom — a popup/options MVP needs no router).
│                         #   Scripts: build (vite build), build:watch (vite build --watch), preview (vite preview),
│                         #   typecheck (tsc --noEmit). NO dev server / no `dev` script.
├── vite.config.ts        # plain Vite + @vitejs/plugin-react + "@" alias; NO fileApi middleware; build.outDir "dist";
│                         #   build.rollupOptions.input = { index: index.html, popup: popup.html, options: options.html (+ sidepanel if enabled) }
│                         #   (index is a dev-only quick-look landing page; only popup/options/sidepanel are wired into the manifest)
├── popup.html            # Vite entry — <div id="root"> + <script type="module" src="/src/popup/main.tsx">
├── options.html          # Vite entry — <div id="root"> + <script type="module" src="/src/options/main.tsx">
├── index.html            # dev-only quick-look landing page (links to popup.html + options.html); NOT in the manifest
├── postcss.config.js     # tailwind + autoprefixer (identical to aios/app)
├── tailwind.config.ts    # copied from aios (resolves the CSS vars; no hardcoded colors); content globs cover ./*.html + ./src/**
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json   # from the aios shape; "types": ["chrome"] where appropriate
├── .gitignore            # node_modules, dist
├── README.md             # how to preview (build → Load unpacked) + "themed extension MVP, mock data" + raw/builds pointer
├── public/
│   ├── manifest.json     # MV3 (see below) — copied verbatim to dist/manifest.json
│   └── icons/            # OPTIONAL placeholder PNGs (16/48/128); omit the manifest "icons" key if none (Chrome shows a default)
└── src/
    ├── index.css         # 13 base tokens + contrast pairs + --radius + shadows, FROM the design system (shared by all entries)
    ├── vite-env.d.ts
    ├── lib/utils.ts      # the cn() helper (copied)
    ├── config/app.ts     # extension name/tagline from the charter (words only)
    ├── components/ui/    # ONLY the primitives used (button, card, input, badge…) — copied cva primitives
    ├── components/layout/PopupShell.tsx + OptionsShell.tsx   # themed chrome per surface (or one shared AppShell)
    ├── popup/main.tsx    # createRoot(#root) + import "../index.css"; renders <Popup>
    ├── popup/Popup.tsx   # the popup UI (fixed width — see below)
    ├── options/main.tsx  # createRoot(#root) + import "../index.css"; renders <Options>
    ├── options/Options.tsx   # the options-page UI
    └── data/             # typed mock fixtures + getX()/listX() accessors — no fetch, no env, offline
```

**Minimal correct MV3 `manifest.json`** (popup + options; no worker/content script in v1):

```json
{
  "manifest_version": 3,
  "name": "<from charter>",
  "version": "0.1.0",
  "description": "<one-liner from charter>",
  "action": { "default_popup": "popup.html", "default_title": "<name>" },
  "options_page": "options.html",
  "permissions": []
}
```

Generate the manifest from the **resolved** surface set: include `options_page` only if the options
surface is built; add `"side_panel": { "default_path": "sidepanel.html" }` + `"sidePanel"` in
`permissions` only when `config.include_side_panel` is true. Add
`"icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }` **only if** placeholder
icons are written to `public/icons/` — otherwise omit the key (Chrome shows a default puzzle icon; the
extension still loads and the popup/options still work), keeping the scaffold fully text-only/offline (no
hand-authored binary assets). Keep `permissions: []` at Tier 0 (the sole exception is the opt-in
`sidePanel` permission above, only when `include_side_panel` is true). **No `background.service_worker`**
and **no content script** in v1 (a pure-UI MVP needs neither); both are named as later tiers.

**Pin the stack from `aios/`, don't hardcode.** Read `aios/package.json` and pin the **same major
versions** for the shared subset: `react`, `react-dom`, `class-variance-authority`, `clsx`,
`tailwind-merge`, `tailwindcss-animate`, `lucide-react`; dev: `vite`, `@vitejs/plugin-react`,
`typescript`, `tailwindcss`, `autoprefixer`, `postcss`, the `@types/*`, and `@tailwindcss/typography`
only if the design uses prose. The **only** extension-specific addition is dev-only **`@types/chrome`**
(so any future `chrome.*` usage typechecks; a mock-data v1 may not call chrome APIs at all). **Exclude**
the KB-console-only deps: `@anthropic-ai/sdk`, `@supabase/supabase-js`, `gray-matter`, `react-markdown`,
`remark-gfm`, `vitest`, `@tanstack/react-query`, and `react-router-dom` (a popup/options MVP navigates
with simple local state, not a router). Scripts: `build`, `build:watch` (`vite build --watch`), `preview`
(`vite preview`), `typecheck` (`tsc --noEmit`) — **no `dev` server**.

**Theme it the same way `define-design` themes the console.** Write the 13 base tokens for `:root` and
`.dark` into `plugin/src/index.css`, **re-derive and eyeball the contrast pairs** (`--*-foreground`,
`--popover*`) so text stays legible, and set `--radius` + the shadow vars from *Typography & shape*.
Copy `tailwind.config.ts` unchanged (it only reads the CSS vars; ensure its `content` globs cover the
root `*.html` entries and `src/**`). Default to the Inter/system font stack; only add a webfont `<link>`
if the design names one. Honor "dark-first" for the entries' `<html class>`. **The one platform
nuance:** a toolbar **popup sizes to its content** (up to ~800×600), so the popup root/body gets an
**explicit width** (~360–400px, e.g. a `w-[380px]` root wrapper) and a sensible min-height, so it
renders as a proper popup rather than a sliver. The options page is a full tab and needs no fixed width.

**Mock data, not a backend.** Put a typed fixture module per entity in `src/data/` (plain arrays +
`getX()`/`listX()` accessors), imported directly by views. No fetch, no env, no network, no
`chrome.storage`. Every view is clearly placeholder-powered; say so in `plugin/README.md`.

**Surfaces & components.** Each surface (`popup.html`, `options.html`, optionally `sidepanel.html`) is
its own Vite entry mounting a React root that imports the shared `src/index.css` and renders its shell +
views. In-popup navigation between views is simple local state (no router). Reuse the shadcn-style `cva`
primitives (button, card, input, badge…) so the look matches the design system's quality bar. Copy only
the primitives you actually use. The dev-only `index.html` is a small landing page linking to the popup
and options for `npm run preview` — it is **not** referenced by the manifest.

### Phase 4 — Record it (provenance)

The **code** lives in `plugin/` (a build target outside the knowledge folders, like `aios/`, `app/`, and
`mobile/`). The **record** lands in the knowledge base, on the same spine as `build-app`/`build-mobile`:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; new dated file per build, `-2` for
  same-day re-runs)* — opens with RAG frontmatter (`title`/`source_id`/`path`/`tags`/`updated`) **with
  `target: plugin`** (+ `plugin` and `extension` tags), then captures: the confirmed surfaces + view
  plan, components, mock entities, the theme source, the charter version, the vetting verdict referenced
  (and any KILL override), the pinned stack (mirrored from `aios/`), the MV3 surfaces built, and anything
  deferred.
- **`wiki/build.md`** *(the shared, multi-target build index; created on the first build of any kind,
  like `roast` creates `wiki/vetting.md`; opens with RAG frontmatter — see `docs/WIKI-FRONTMATTER.md`)*
  — add/maintain a **`## Browser extension (`plugin/`)`** section (surface + view list, where it lives,
  the Load-unpacked preview instructions, theme source, links to the `raw/builds/` record(s) +
  `wiki/charter.md` + `wiki/design-system.md`). **Preserve any existing Web and Mobile content:** if a
  prior **flat** (un-sectioned) web index exists, **first wrap it under a `## Web app (`app/`)`
  heading**; preserve any existing Web and Mobile sections untouched; then add/update the Browser-
  extension section. **Match existing sections on a stable substring** ("Web app", "Mobile app",
  "Browser extension") — not an exact heading string — since `build-mobile` writes its headings with
  backticks around the folder name. If the file doesn't exist yet, create it with just the Browser-
  extension section. Cross-link from `wiki/index.md` (pinned under "By area" + a "Recent additions"
  line) on first creation. Reference the raw record — never paste extension code.
- **`outputs/change-log.md`** — append one attributed line (newest-at-top, as the sibling skills write
  it): `- <YYYY-MM-DD> — build-plugin — scaffolded browser extension (plugin/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

`raw/builds/.gitkeep` already ships — nothing new. `improve-system` stays the single applier for the
self-improvement lanes — this skill only writes its own `applied` line, exactly as
`build-app`/`build-mobile` do.

### Phase 5 — Hand it over, simply

Don't run anything that hits the network or installs to disk — **offer** it, keeping `plugin/` as the
working directory (as one compound command, or via `npm --prefix plugin` — don't split a bare `cd` from
a later command, since shell `cd` doesn't persist across separate invocations). Close with the
plain-words path:

> *"Your browser extension is ready in the `plugin/` folder. To try it in Chrome:*
> *1. Run `cd plugin && npm install` (one time — this downloads the building blocks), then*
>    *`npm run build` (this creates the `dist/` folder Chrome loads).*
> *2. Open `chrome://extensions`, turn on **Developer mode** (top-right), click **Load unpacked**, and*
>    *pick the `plugin/dist` folder.*
> *3. The extension's icon appears in your toolbar — click it to see the popup; right-click it →*
>    ***Options** for the settings page.*
> *After any change, run `npm run build` again and click the reload (↻) icon on the extension's card.*
> *Prefer a quick look without Chrome? `npm run preview` opens a quick-look page (linking to the*
> *popup and options) in a browser tab. Want me to build it for you?"*

Be honest that plain Vite has **no live popup hot-reload** (MV3's strict CSP blocks the dev server
inside the extension context); the working dev loop is `npm run build:watch` + click-reload on the card.
If they say yes, run the commands with `plugin/` as the working directory. Optionally offer
`npm --prefix plugin run typecheck` and offer to fix any type errors on the spot. If offline, the
extension is still fully written — install/build/preview when back online.

## Re-running (incremental, never clobber)

If `plugin/` already exists, switch to **incremental mode**: read the existing `plugin/`, the latest
`raw/builds/` record, and `wiki/build.md`, then diff the current charter MVP against what's already
built. At the confirm gate, offer a small menu:
1. **Add / update surfaces or views** — only the deltas,
2. **Re-apply the theme** — from the current `wiki/design-system.md`,
3. **Both.**

Write **new** files freely; for any **existing** file, show the change as a diff and **confirm before
overwriting**. Each re-run writes a **new** `raw/builds/` record and updates the **Browser extension**
section of `wiki/build.md` in place. If a prior build is partial/broken (missing spine files), offer a
targeted repair.

`build-plugin` **owns everything under `plugin/`, including its theme** — so a restyle is just a re-run
(option 2), not a job for `define-design` (which owns `aios/`).

## Rules & guardrails

- **Attended-only — never in `maintenance-loop`.** This skill writes project source and offers
  `npm install` (network + disk); it must never run unattended. It is built around the one confirm
  gate.
- **Tier 0 — no keys, no accounts, no permissions, mock data.** v1 has no backend, auth, deploy, env,
  secrets, host permissions, or service worker; nothing is collected in chat. **Packaging + Chrome Web
  Store submission (a paid developer account) are a later tier.** Scaffolding works fully offline (only
  the opt-in `npm install` needs the network — if offline, the extension is still written; install
  later).
- **Stay scoped.** Honor `max_views` and the charter's `Out`/`Later`; build the core slice and name
  what's deferred, rather than ballooning.
- **Be honest about what it is.** Every artifact (the `plugin/README.md`, `wiki/build.md`, the
  close-out) calls it a **themed extension MVP with placeholder data, previewed via Load unpacked** (not
  a store-published extension), and names the later tiers (packaging + Chrome Web Store + a paid
  developer account, cross-browser packaging, real permissions/host access, a background service worker,
  plus web and mobile are other slices).

## Output

A new `plugin/` folder (a buildable, themed MV3 browser-extension MVP), an immutable
`raw/builds/<date>-<slug>.md` record tagged `target: plugin`, a created/updated `wiki/build.md`
Browser-extension section (+ `wiki/index.md` cross-links), one `change-log.md` line — and a
Load-unpacked path to preview it in Chrome.
````

- [ ] **Step 2: Verify DoD**

Run (Git Bash), all must print a match:
```bash
cd .claude/skills/build-plugin
grep -q "^name: build-plugin" SKILL.md && echo NAME_OK
grep -q "argument-hint:" SKILL.md && echo HINT_OK
grep -qi "attended-only" SKILL.md && grep -qi "never.*maintenance" SKILL.md && echo ATTENDED_OK
grep -q "raw/builds/" SKILL.md && grep -q "wiki/build.md" SKILL.md && grep -q "target: plugin" SKILL.md && echo PROVENANCE_OK
grep -qi "build anyway" SKILL.md && echo KILL_GATE_OK
grep -q "max_views" SKILL.md && grep -q "plugin_dir" SKILL.md && grep -q "surfaces" SKILL.md && echo CONFIG_OK
grep -qi "mock" SKILL.md && grep -qi "no backend" SKILL.md && echo TIER0_OK
grep -qi "Manifest V3" SKILL.md && grep -qi "Load unpacked" SKILL.md && grep -q "manifest.json" SKILL.md && echo MV3_OK
grep -q "index.css" SKILL.md && grep -qi "popup" SKILL.md && grep -qi "options" SKILL.md && echo THEME_OK
```
Expect: NAME_OK HINT_OK ATTENDED_OK PROVENANCE_OK KILL_GATE_OK CONFIG_OK TIER0_OK MV3_OK THEME_OK.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/build-plugin/SKILL.md
git commit -m "feat(build-plugin): the build-plugin skill (MV3 browser extension, Load-unpacked preview)"
```

---

### Task 3: `docs/BUILD-PLUGIN.md`

**Files:**
- Create: `docs/BUILD-PLUGIN.md`

- [ ] **Step 1: Create `docs/BUILD-PLUGIN.md`** with exactly this content:

````markdown
# Building your browser extension — the `build-plugin` skill

`build-plugin` is the browser-extension sibling of [`build-app`](BUILD-APP.md) and
[`build-mobile`](BUILD-MOBILE.md). Once you know *what* you're building (`define-project` →
`wiki/charter.md`), that it's *worth* building (`roast`/`storm-research`), and *how it should look*
(`define-design` → `wiki/design-system.md`), `build-plugin` turns those into an actual, working
**browser extension** you can load into Chrome and try — without you having to write or wire up any of
it.

## What it makes

A new top-level **`plugin/`** folder: its own minimal **Vite + React + TypeScript + Tailwind** project
— the same proven stack as the `aios/` console and your web app — that builds to a **Manifest V3**
extension with a **popup** and an **options page**, themed from your design system (the *same* 13 color
tokens), with your MVP's views wired to **mock (placeholder) data**.

It is a **front-end MVP**: the surfaces, layout, and theme are real; the data is placeholder. There is
no backend, no accounts, no permissions, and no store submission yet — those are **later tiers** (below).

## How it works

1. **Reads your north-stars** — the charter (your MVP list), the design system (your theme), and the
   latest vetting verdict. A missing charter → it offers `define-project` first; a missing design → it
   uses a clean default and offers `define-design`; a **KILL** verdict stops it unless you say "build
   anyway".
2. **Drafts a short view list** from your MVP (capped so it can't run away) and shows it to you.
3. **Asks once: "build this?"** — then scaffolds and themes `plugin/`, with mock data.
4. **Records what it built** — an immutable note in `raw/builds/` (tagged `target: plugin`), a Browser-
   extension section in the shared `wiki/build.md` index, and a line in the change log.
5. **Hands it to you** — the few clicks to load it into Chrome.

## Trying it in Chrome (no store, no account)

```
cd plugin
npm install       # one time — downloads the building blocks
npm run build     # creates the dist/ folder Chrome loads
```

Then, in Chrome:
1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked** and pick the **`plugin/dist`** folder.
4. The extension's icon appears in your toolbar — click it for the popup; right-click → **Options** for
   the settings page.

After any change, run `npm run build` again and click the reload (↻) icon on the extension's card.
Plain Vite doesn't hot-reload a popup (Manifest V3's security rules block the dev server inside the
extension context), so the dev loop is `npm run build:watch` + click reload — that's the one tradeoff of
the no-framework scaffold. Prefer a quick look without Chrome? `npm run preview` opens a page linking to
the popup and options in a browser tab.

## Where things live

- **`plugin/`** — your extension's code. Like `aios/`, `app/`, and `mobile/`, it's a **build target**,
  not part of the knowledge base — so it lives outside the `raw/` / `wiki/` / `outputs/` discipline, and
  it's yours to edit.
- **`raw/builds/<date>-<slug>.md`** — an immutable record of each build (tagged `target: plugin`).
- **`wiki/build.md`** — the shared, AI-written index of everything you've built (a "Web app", "Mobile
  app", and/or "Browser extension" section), with links back to the records and your charter/design.

## The stack (and why not a framework)

Plain **Vite + React + TypeScript + Tailwind** (the same majors as `aios/`) building to **Manifest V3**
— the popup and options page are ordinary web pages, so your 13 design tokens carry over **unchanged** (a
popup is just a themed page). The only extension-specific addition is the dev-only `@types/chrome`.

We deliberately use plain Vite + a hand-written `manifest.json` rather than a framework like WXT or
CRXJS: it mirrors your web app's scaffold exactly, with no generated-manifest "magic" — and a
popup+options MVP needs no background worker or content script at all. The tradeoff is no live popup
hot-reload (see above); if that friction ever matters, adopting a framework is a later, opt-in step.

## Re-running

Run `build-plugin` again any time. It won't clobber your work: it diffs your current MVP against what's
built and offers to **add/update surfaces or views**, **re-apply the theme** (after you tweak the design
system), or **both** — showing a diff and asking before it overwrites anything you've edited.

## What ships in the template

Only the skill and this doc ship. **No `plugin/` is ever built into the template itself.** Your
`plugin/` appears only when *you* run `build-plugin` in your own copy.

## Later tiers (not in v1)

- **Packaging + Chrome Web Store** — zip the build and submit it to the Chrome Web Store (needs a
  one-time paid developer account and a review). A bigger lift, so it's a dedicated later tier beyond the
  no-accounts default.
- **Cross-browser (Firefox / Edge / Safari)** — one codebase, per-store packaging (Firefox wants a small
  polyfill). A later slice.
- **Real permissions, host access, a background service worker, storage, network** — swap mock data for
  real behavior. These need permissions/keys, so they're opt-in tiers beyond Tier 0.
- **Other targets** — the **web** app ([`build-app`](BUILD-APP.md)) and **mobile** app
  ([`build-mobile`](BUILD-MOBILE.md)) are separate slices; the `raw/builds/` + `wiki/build.md`
  provenance already accommodates them.

## Credit / inspiration

The "scaffold → theme → mock data → preview" flow follows the modern Claude Code build workflow shown
in Chris Raroque's *"How I Build Apps So Fast."*
````

- [ ] **Step 2: Verify DoD**

Run: `grep -qi "later tiers" docs/BUILD-PLUGIN.md && grep -qi "Load unpacked" docs/BUILD-PLUGIN.md && grep -qi "ships in the template" docs/BUILD-PLUGIN.md && grep -q "target: plugin" docs/BUILD-PLUGIN.md && echo DOC_OK` → expect `DOC_OK`.

- [ ] **Step 3: Commit**

```bash
git add docs/BUILD-PLUGIN.md
git commit -m "docs(build-plugin): BUILD-PLUGIN.md detail page"
```

---

### Task 4: Wire the menu + advisor + setup (`what-can-i-do`, `advise-project`, `setup-project`)

**Files:**
- Modify: `.claude/skills/what-can-i-do/SKILL.md`
- Modify: `.claude/skills/setup-project/SKILL.md`
- Modify: `.claude/skills/advise-project/SKILL.md`

- [ ] **Step 1: `what-can-i-do`** — insert a new menu bullet immediately AFTER the existing
  `Build a mobile app` line (currently line 25). Replace:

```
   - **Build a mobile app** — turn your plan into an app you can open on your phone → runs `build-mobile`
```

with:

```
   - **Build a mobile app** — turn your plan into an app you can open on your phone → runs `build-mobile`
   - **Build a browser extension** — turn your plan into a Chrome extension you can load and try → runs `build-plugin`
```

- [ ] **Step 2: `setup-project`** — in step 8, extend the build offer to name all three. Replace:

```
   - If `wiki/charter.md` and `wiki/design-system.md` both exist, offer: *"Want me to build a
     first version of your app now? → runs `build-app` (web) or `build-mobile` (phone)"* (propose-only — never auto-run).
```

with:

```
   - If `wiki/charter.md` and `wiki/design-system.md` both exist, offer: *"Want me to build a
     first version of your app now? → runs `build-app` (web), `build-mobile` (phone), or `build-plugin` (browser extension)"* (propose-only — never auto-run).
```

- [ ] **Step 3: `advise-project`** — in the Procedure step 6 `project`-lane parenthetical (currently
  lines 84–85), make two edits. Replace:

```
  point to `build-app` (web) or `build-mobile` (phone) as the suggested next step. Never auto-run a roast, `build-app`, or `build-mobile` inside the
```

with:

```
  point to `build-app` (web), `build-mobile` (phone), or `build-plugin` (browser extension) as the suggested next step. Never auto-run a roast, `build-app`, `build-mobile`, or `build-plugin` inside the
```

(The trailing `— all are attended; advise-project stays propose-only and asks no one.)*` is unchanged and
already covers the now-four items. Preserve the propose-only invariant.)

- [ ] **Step 4: Verify DoD**

```bash
grep -q "Build a browser extension" .claude/skills/what-can-i-do/SKILL.md && echo MENU_OK
grep -q "build-plugin" .claude/skills/setup-project/SKILL.md && echo SETUP_OK
grep -q "build-plugin" .claude/skills/advise-project/SKILL.md && grep -qi "propose-only" .claude/skills/advise-project/SKILL.md && echo ADVISE_OK
```
Expect: MENU_OK SETUP_OK ADVISE_OK. Confirm `advise-project` still says it never auto-applies / stays propose-only.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/what-can-i-do/SKILL.md .claude/skills/advise-project/SKILL.md .claude/skills/setup-project/SKILL.md
git commit -m "feat(build-plugin): wire into what-can-i-do, setup-project, advise-project (propose-only)"
```

---

### Task 5: `CLAUDE.md` — skill bullet + widen the `raw/builds/` line (keep < 125 lines)

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Widen the `raw/builds/` subfolder line.** Replace the current line 24:

```
  - `raw/builds/` — `build-app`/`build-mobile` build records; the apps live in `app/` (web) and `mobile/` (build targets outside the knowledge system, like `aios/`)
```

with:

```
  - `raw/builds/` — `build-app`/`build-mobile`/`build-plugin` build records; the apps live in `app/` (web), `mobile/` (phone), and `plugin/` (browser extension) — build targets outside the knowledge system, like `aios/`
```

- [ ] **Step 2: Add the `build-plugin` Skills bullet** immediately after the `build-mobile` bullet
  (currently line 82). Replace:

```
- **`build-mobile`** — the phone sibling of `build-app`: turn the charter + design system into a themed **Expo (React Native)** app in a new top-level `mobile/` folder, previewed on a phone by scanning a QR code (Expo Go — no Mac/Xcode). Attended, Tier 0 (mock data, no keys/accounts); one confirm gate; re-runnable; **never in the unattended loop**. Installable app-store builds (EAS) are a later tier. See `docs/BUILD-MOBILE.md`.
```

with (the same bullet, then the new one appended):

```
- **`build-mobile`** — the phone sibling of `build-app`: turn the charter + design system into a themed **Expo (React Native)** app in a new top-level `mobile/` folder, previewed on a phone by scanning a QR code (Expo Go — no Mac/Xcode). Attended, Tier 0 (mock data, no keys/accounts); one confirm gate; re-runnable; **never in the unattended loop**. Installable app-store builds (EAS) are a later tier. See `docs/BUILD-MOBILE.md`.
- **`build-plugin`** — the browser-extension sibling of `build-app`: turn the charter + design system into a themed **Manifest V3** browser extension (popup + options page) in a new top-level `plugin/` folder (plain Vite+React, like `app/`), previewed in Chrome via **Load unpacked**. Attended, Tier 0 (mock data, no keys/permissions); one confirm gate; re-runnable; **never in the unattended loop**. Packaging + Chrome Web Store are a later tier. See `docs/BUILD-PLUGIN.md`.
```

- [ ] **Step 3: Verify DoD**

```bash
grep -q '`build-plugin`' CLAUDE.md && echo BULLET_OK
grep -q 'build-app`/`build-mobile`/`build-plugin' CLAUDE.md && echo RAWLINE_OK
LINES=$(wc -l < CLAUDE.md); echo "CLAUDE.md lines: $LINES"; [ "$LINES" -lt 125 ] && echo CAP_OK
```
Expect: BULLET_OK RAWLINE_OK CAP_OK (lines < 125).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(build-plugin): CLAUDE.md skill bullet + widen raw/builds note"
```

---

### Task 6: `README.md` + `docs/USING-THIS-FOR-ANY-PROJECT.md` + `docs/BUILD-APP.md` + `docs/BUILD-MOBILE.md`

**Files:**
- Modify: `README.md`
- Modify: `docs/USING-THIS-FOR-ANY-PROJECT.md`
- Modify: `docs/BUILD-APP.md`
- Modify: `docs/BUILD-MOBILE.md`

- [ ] **Step 1: README — "Built for you" bullet** (line 43). Replace:

```
- 🛠️ **Built for you** — when you're ready, say **"build my app"** (web) or **"build my mobile app"** (phone) and it scaffolds a working, on-brand first version in an `app/` or `mobile/` folder — the mobile one previews on your phone via a QR code, mock data first, no coding (see [building your app](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md)).
```

with:

```
- 🛠️ **Built for you** — when you're ready, say **"build my app"** (web), **"build my mobile app"** (phone), or **"build my browser extension"** (Chrome) and it scaffolds a working, on-brand first version in an `app/`, `mobile/`, or `plugin/` folder — mock data first, no coding (see [web](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md) · [extension](docs/BUILD-PLUGIN.md)).
```

- [ ] **Step 2: README — docs table** (after the `Building your mobile app` row, line 57). Replace:

```
| [Building your mobile app](docs/BUILD-MOBILE.md) | How the system builds a phone app for you. |
```

with:

```
| [Building your mobile app](docs/BUILD-MOBILE.md) | How the system builds a phone app for you. |
| [Building your browser extension](docs/BUILD-PLUGIN.md) | How the system builds a Chrome extension for you. |
```

- [ ] **Step 3: README — the "Build it" journey step** (line 88). Append a browser-extension sentence to
  step 4 (keep the existing web + mobile text; add the extension option + link). Replace the trailing
  `Both are front-end MVPs with placeholder data — real data, accounts, and deployment come later. See [building your app](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md).`
  with:

```
Prefer a browser extension? Run **[`build-plugin`](.claude/skills/build-plugin/SKILL.md)** ("build my browser extension") for a themed Manifest V3 extension in a `plugin/` folder you load into Chrome via Developer mode. All three are front-end MVPs with placeholder data — real data, accounts, and deployment come later. See [web](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md) · [extension](docs/BUILD-PLUGIN.md).
```

- [ ] **Step 4: README — build-status list** (after the Phase 12 line, line 128). Replace:

```
- Phase 12 — `build-mobile`: turn the charter + design system into a themed Expo phone app (`mobile/`) ✅
```

with:

```
- Phase 12 — `build-mobile`: turn the charter + design system into a themed Expo phone app (`mobile/`) ✅
- Phase 13 — `build-plugin`: turn the charter + design system into a themed Manifest V3 browser extension (`plugin/`) ✅
```

- [ ] **Step 5: USING** — replace the `**Then build it:**` line (line 30) with a version that adds the
  extension option (keep web + mobile; append the extension sentence + link). Replace:

```
**Then build it:** run **`build-app`** — it turns the charter (the MVP scope) + design system (the theme) into a working, themed front-end web app in a new top-level `app/` folder, runnable with `npm run dev`. Prefer a phone app? Run **`build-mobile`** for a themed Expo (React Native) app in a `mobile/` folder you preview on your phone via a QR code (Expo Go). Both are Tier-0 front-end MVPs (mock data, no keys); real data/accounts/deploy and app-store/installable builds are later tiers. See `docs/BUILD-APP.md` · `docs/BUILD-MOBILE.md`.
```

with:

```
**Then build it:** run **`build-app`** — it turns the charter (the MVP scope) + design system (the theme) into a working, themed front-end web app in a new top-level `app/` folder, runnable with `npm run dev`. Prefer a phone app? Run **`build-mobile`** for a themed Expo (React Native) app in a `mobile/` folder you preview on your phone via a QR code (Expo Go). Prefer a browser extension? Run **`build-plugin`** for a themed Manifest V3 extension in a `plugin/` folder you load into Chrome via Developer mode. All are Tier-0 front-end MVPs (mock data, no keys); real data/accounts/deploy, installable/app-store builds, and Chrome Web Store submission are later tiers. See `docs/BUILD-APP.md` · `docs/BUILD-MOBILE.md` · `docs/BUILD-PLUGIN.md`.
```

- [ ] **Step 6: `docs/BUILD-APP.md`** — after the existing `> For a **phone app**…` cross-reference
  line (line 8), add a second cross-reference line:

```
> For a **browser extension**, see the sibling skill [`build-plugin`](BUILD-PLUGIN.md).
```

- [ ] **Step 7: `docs/BUILD-MOBILE.md`** — in the "Later tiers" list, replace the `**Other targets**`
  bullet (currently naming "plugins" as unbuilt) so it points to the now-available `build-plugin`.
  Replace:

```
- **Other targets** — the **web** app ([`build-app`](BUILD-APP.md)) and **plugins** are separate
  slices; the `raw/builds/` + `wiki/build.md` provenance already accommodates them.
```

with:

```
- **Other targets** — the **web** app ([`build-app`](BUILD-APP.md)) and **browser extension**
  ([`build-plugin`](BUILD-PLUGIN.md)) are separate slices; the `raw/builds/` + `wiki/build.md`
  provenance already accommodates them.
```

- [ ] **Step 8: Verify DoD**

```bash
grep -q "BUILD-PLUGIN.md" README.md && grep -q "Phase 13" README.md && grep -qi "build my browser extension" README.md && echo README_OK
grep -q "build-plugin" docs/USING-THIS-FOR-ANY-PROJECT.md && echo USING_OK
grep -q "BUILD-PLUGIN.md" docs/BUILD-APP.md && echo XREF_APP_OK
grep -q "BUILD-PLUGIN.md" docs/BUILD-MOBILE.md && echo XREF_MOBILE_OK
```
Expect: README_OK USING_OK XREF_APP_OK XREF_MOBILE_OK.

- [ ] **Step 9: Commit**

```bash
git add README.md docs/USING-THIS-FOR-ANY-PROJECT.md docs/BUILD-APP.md docs/BUILD-MOBILE.md
git commit -m "docs(build-plugin): README + USING + BUILD-APP/BUILD-MOBILE — surface the extension build option"
```

---

### Task 7: Phase 13 addendum to the master design spec

**Files:**
- Modify: `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`

- [ ] **Step 1:** Append a **Phase 13 addendum** after the Phase 12 addendum (ends ~line 264), in the
  same voice/format. It should: name Phase 13 = `build-plugin` (the browser-extension sibling of
  `build-app`); summarize that the build step is now **web, mobile, *or* browser extension**; note the
  plain **Vite + React + TypeScript + Tailwind → Manifest V3** stack (popup + options page, hand-written
  `manifest.json`, chosen over WXT/@crxjs to mirror `build-app`), the **Load-unpacked** Chrome preview
  (Developer mode; no store/account), that the 13 HSL tokens carry over **unchanged** (a popup is just a
  themed page), the `plugin/` target folder (a build target outside the three-folder discipline, like
  `aios/`/`app/`/`mobile/`), and the **shared** `raw/builds/` + `wiki/build.md` provenance now tagging
  `target: plugin` (a Browser-extension section alongside Web/Mobile). Note attended-only / Tier 0 (mock
  data, no keys/permissions/accounts) and that packaging + Chrome Web Store submission remain a later
  slice. Wired into `what-can-i-do`, `setup-project`, and `advise-project` (propose-only). Point to
  `docs/BUILD-PLUGIN.md` and `docs/superpowers/specs/2026-06-30-build-plugin-design.md`.

- [ ] **Step 2: Verify DoD**

```bash
grep -q "Phase 13" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && grep -q "build-plugin" docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md && echo ADDENDUM_OK
```
Expect: ADDENDUM_OK.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md
git commit -m "docs(build-plugin): Phase 13 addendum in the master design spec"
```

---

### Task 8: Final no-pollution + integrity verification

**Files:** none (verification only).

- [ ] **Step 1: No real extension/artifacts committed.**

```bash
test ! -e plugin && echo NO_PLUGIN_OK
ls raw/builds/ | grep -v '^\.gitkeep$' | grep -q . && echo "POLLUTION: real build record" || echo NO_BUILD_RECORD_OK
test ! -e wiki/build.md && echo NO_WIKI_BUILD_OK
git status --porcelain   # expect: clean
```
Expect: NO_PLUGIN_OK, NO_BUILD_RECORD_OK, NO_WIKI_BUILD_OK, clean tree.

- [ ] **Step 2: Invariants intact.** The real invariant: no *existing* `raw/` content mutated (and NO
  new file under `raw/` at all this phase — `raw/builds/.gitkeep` already shipped in Phase 11);
  `improve-system`, `build-app`, `build-mobile`, `maintenance-loop`, and the change-log ledger untouched.

```bash
git diff --name-only main..HEAD -- .claude/skills/improve-system .claude/skills/build-app .claude/skills/build-mobile .claude/skills/maintenance-loop raw outputs/change-log.md   # expect EMPTY
```
Expect: EMPTY.

- [ ] **Step 3: Only the intended files changed.**

```bash
git diff --name-only main..HEAD
```
Expect exactly: the 3 created (`.claude/skills/build-plugin/SKILL.md`, `.claude/skills/build-plugin/config.json`,
`docs/BUILD-PLUGIN.md`) + the 9 modified (`CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/BUILD-APP.md`, `docs/BUILD-MOBILE.md`, `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`,
`.claude/skills/{what-can-i-do,setup-project,advise-project}/SKILL.md`) + the two spec/plan docs from
this session (`docs/superpowers/specs/2026-06-30-build-plugin-design.md`,
`docs/superpowers/plans/2026-06-30-build-plugin.md`). Nothing else — and NO `plugin/`.

- [ ] **Step 4:** No commit (verification only). Proceed to the final review gates (Claude whole-branch
  review + Codex `codex review --base main`), then `finishing-a-development-branch`. Merge/push only on
  the user's explicit request.

---

## Notes for the executor
- **DRY/YAGNI:** ship exactly the spec — no extra features, no real `plugin/`.
- **Voice:** mirror `build-app`/`build-mobile` (calm, plain, procedural); the non-technical user is the reader.
- **Do NOT run a real build** (`build-plugin`) against this template at any point.
- After all tasks: dispatch a final whole-branch Claude review, then run the Codex gate
  (`codex review --base main`), then use `finishing-a-development-branch`. Merge/push only on the
  user's explicit request.
