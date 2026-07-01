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
│                         #   tailwindcss, autoprefixer, postcss, @tailwindcss/typography (the copied config registers it),
│                         #   @types/react, @types/react-dom, @types/node, and
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
`typescript`, `tailwindcss`, `autoprefixer`, `postcss`, the `@types/*` (incl. `@types/node`), and
**`@tailwindcss/typography`** (the copied `tailwind.config.ts` imports and registers it
unconditionally, so it must be present even when the design uses no prose). The **only**
extension-specific addition is dev-only **`@types/chrome`**
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
