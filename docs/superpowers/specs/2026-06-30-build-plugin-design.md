# Design Spec: `build-plugin` — turn the charter + design system into a browser extension

> Status: Approved (2026-06-30). Not yet implemented. A new capability layered on the foundation
> (Phases 0–12). Call it **Phase 13**. One attended, interview-light skill — the browser-extension
> sibling of `build-app` (Phase 11) and `build-mobile` (Phase 12). Tier 0 (mock/local data, no
> backend, auth, deploy, permissions, accounts, or keys). Manifest V3; store packaging + Chrome Web
> Store submission are an explicit later tier. No API keys.

## Context

**Why this is being built.** Phases 11–12 shipped `build-app` (a themed **web** app in `app/`) and
`build-mobile` (a themed **Expo** phone app in `mobile/`), both turning `wiki/charter.md` (MVP scope)
+ `wiki/design-system.md` (theme) + the `outputs/vetting/` verdict into a working, previewable MVP
behind one confirm gate. Both named **plugins** as the remaining planned target, and the shared
provenance (`raw/builds/` + `wiki/build.md`) was written multi-target so a plugin sibling "slots in
without rework." The user asked for **plugins next.** `build-plugin` is that third sibling: the same
one-confirm, themed, mock-data flow, producing a **browser extension** the user previews in Chrome.

**Why the stack fits (verified June 2026).** The plugin toolchain that stays cohesive and
non-technical-friendly:
- **A browser extension's UI surfaces (popup, options page) are ordinary web pages** rendered in an
  extension context — so a **Manifest V3 extension built with the same Vite + React + TypeScript +
  Tailwind stack as `build-app`/`aios/`** reuses the entire web scaffold, and the **13 HSL design
  tokens carry over unchanged** (no theming rework — a popup is just a themed page). A production
  `vite build` emits a static compiled CSS file (a `<link>` stylesheet), so MV3's strict, non-relaxable
  `extension_pages` CSP (`script-src 'self'`) is satisfied with no special handling.
- **Plain Vite + a hand-written `manifest.json`** is the right scaffold — *not* a framework. WXT and
  @crxjs/vite-plugin are both actively maintained and MV3-ready, but their generated-manifest /
  auto-import "magic" is exactly the surprise the foundation avoids, and neither mirrors the existing
  `build-app`/`aios/` Vite scaffold. Popup + options are just extra HTML entries in
  `build.rollupOptions.input` — identical to a normal multi-page Vite site — and a Tier-0 popup+options
  MVP needs **no background service worker and no content script at all**, so the config barely differs
  from `app/`.
- **Preview by "Load unpacked"** — `npm run build` → `chrome://extensions` → Developer mode → **Load
  unpacked** → pick `dist/`. Works from Windows, no accounts, no packaging. (The one honest tradeoff of
  plain Vite over a framework: **no live popup HMR** — MV3's CSP blocks Vite's eval-based dev-server
  HMR inside the extension context, so the dev loop is `vite build --watch` + click-reload on the
  extension card. Live popup HMR is precisely what WXT/@crxjs add, and the argument for adopting one
  *later* if that friction ever matters — not for the MVP.)
- **Hand-scaffolds offline** (mirror `aios/` version majors; the opt-in `npm install` is the only
  network step) — same discipline as `build-app`.
- **MV2 is dead** (disabled in stable since late 2024; last dev flag closing on the Chrome 150/151
  line, ~now) — **MV3 is the only supported format**; there is no reason to target MV2.

**Decisions (made with the user this session):**
1. **Platform = browser extension (Chrome/Edge, Manifest V3).** *(Rejected: a VS Code extension —
   different runtime, webview-messaging UI model, narrower developer audience, little token reuse; a
   Figma / design plugin — sandboxed-iframe UI + Figma plugin API, narrower designer audience,
   different runtime.)* The browser extension has the broadest, consumer-facing audience and reuses the
   web stack + design tokens 1:1.
2. **v1 = a themed extension MVP + load-unpacked preview** — mock/local data; Chrome Developer-mode
   Load-unpacked (+ an optional `vite preview` browser quick-look). No permissions, keys, accounts, or
   store submission. **Packaging (`.zip`) + Chrome Web Store submission (a paid developer account) are
   an explicit later tier** (keeps the Tier-0 no-accounts default intact). *(Rejected: bundling
   packaging/store submission into v1.)*

**Intended outcome.** The foundation's build step becomes **web, mobile, *or* browser extension.** A
non-technical user says "build my browser extension" and gets a themed, on-brand extension they load
into Chrome in a few clicks — behind one draft-confirm gate, with nothing to publish or pay for.

## Architecture

One attended, interview-light skill — a faithful sibling of `build-app`/`build-mobile`, differing only
where the extension platform requires. It reads the three north-stars, confirms a view plan once, then
scaffolds and themes a new top-level `plugin/` Vite project that builds to an MV3 extension, and
records the build on the **same** provenance spine Phases 11–12 established.

```
                          ┌──────────────────────────────────────────────┐
  "build my extension" ──▶│                 build-plugin                 │
  "make a browser plugin" │  0. pre-flight gates (read north-stars)       │
  "build it for Chrome"   │     charter · design · vetting                │
  "/build-plugin"         │  1. derive view plan (popup + options)        │
  what-can-i-do / setup ─▶│  2. ONE draft-confirm gate                    │
  advise-project (GO) ───▶│  3. scaffold + theme plugin/ (Vite + MV3)     ┼─▶ plugin/  (MV3 extension, mock data,
                          │  4. provenance (target: plugin) ──────────────┼─▶   preview via Load unpacked)
                          │  5. offer to preview (build → Load unpacked)  │     raw/builds/<date>-<slug>.md
                          └──────────────────────────────────────────────┘     wiki/build.md (Browser extension section) + change-log
```

**Parts, reusing existing patterns:**
1. **`build-plugin` skill** *(new)* — mirrors `build-app`'s read → plan → confirm → scaffold → record
   pipeline, voice, and guardrails.
2. **`plugin/`** *(written at runtime, not shipped)* — the generated MV3 extension; its own Vite project.
3. **`raw/builds/`** *(shared with build-app/build-mobile; already ships `.gitkeep`)* — immutable
   per-build records, keyed by the `target` dimension.
4. **`wiki/build.md`** *(shared, runtime-created)* — the multi-target build index (Web + Mobile +
   Browser-extension sections).
5. **`docs/BUILD-PLUGIN.md`** *(new)* — the detail-holder (the `plugin/` layout, the Load-unpacked
   preview, the later tiers).

## The `build-plugin` skill

`.claude/skills/build-plugin/SKILL.md` (+ `.claude/skills/build-plugin/config.json`). Frontmatter
`name: build-plugin` + `argument-hint: "[what to build, or leave blank to use your charter]"`; trigger
list: "build my browser extension", "build the extension", "make a browser plugin", "build it for
Chrome", "turn my idea into a browser extension", `/build-plugin`. Zero-argument safe (no args → use
the charter). Voice and phase structure mirror `build-app`/`build-mobile`.

**`config.json`** (all defaulted; never block on absence):
`{ "plugin_dir": "plugin", "surfaces": ["popup", "options"], "max_views": 6, "include_side_panel": false }`
(No `dev_port` — there is no dev server for the extension context; preview is a build + Load unpacked,
with `vite preview` as an optional browser quick-look. `surfaces` names the MV3 UI surfaces built by
default; `include_side_panel` adds a third `chrome.sidePanel` surface when true; `max_views` is the
runaway-scope guard.)

### Phase 0 — Pre-flight gates (identical to build-app/build-mobile)

Read the three north-stars, in order, and route rather than guess:
- **Charter (`wiki/charter.md`) — hard prerequisite.** Missing → offer `define-project`; if declined,
  accept a one-paragraph inline scope (recorded as such). Read `## Purpose & problem`,
  `## Audience & users`, and especially `## Scope → In / MVP:`.
- **Design system (`wiki/design-system.md`) — soft prerequisite.** Missing → offer `define-design`;
  if declined, proceed using the default tokens (the `aios/src/index.css` reference values) and say so
  plainly. When present, use its Palette (13 tokens + contrast pairs), Typography & shape (`--radius`,
  type pairing), and Voice.
- **Vetting verdict** (latest `outputs/vetting/.../roast-verdict.md`, via the charter `## Vetting` link
  or newest folder): **GO** → proceed; **RESHAPE** → fold the pivot in; **KILL** → hard stop requiring
  an explicit "build anyway" override (recorded); **none** → one-line optional roast offer, never
  forced.
- **Existing `plugin/`** → incremental mode (see Re-run).

### Phase 1 — Derive the view plan (delta = surfaces, not routes)

From the charter's `In / MVP:`, derive the extension's **surfaces + views**:
- **Popup** (always) — the toolbar-click window; the primary surface. It may hold a **small** set of
  views (e.g. a main view + a detail or quick-action view).
- **Options page** (default on — it's in `config.surfaces`) — a full-tab page for preferences, an
  "about", or a fuller workspace. Build it by default; **omit it only** if the MVP genuinely has no
  settings or secondary content, in which case drop the `options_page` key from the manifest and skip
  its files. Don't invent settings just to fill it.
- **Side panel** (only when `config.include_side_panel` is true) — an optional third surface
  (`chrome.sidePanel`), same rendering model, one more HTML entry.

The `manifest.json` is generated from the **resolved** surface set — a surface that isn't built has no
manifest entry (`options_page` / `side_panel`) and no HTML file; the sample manifest in Phase 3 shows
the default (popup + options).

Each view maps to the components it needs and the mock entities it shows. Use `Purpose`/`Audience` to
choose the popup's shape (a compact dashboard, a quick-capture form, a list, a toggle panel) and the
design-system Voice for the wording. **Runaway-scope guard:** cap the total distinct views at
`config.max_views` (default 6); build the **core slice** and list the rest as `Later (not in this
build)`. Honor the charter's `Out`/`Later` as hard exclusions.

### Phase 2 — Single draft-confirm gate (identical structure to build-app/build-mobile)

One message, one confirm. ("Single gate" = the build decision; the Phase 0 routing is separate
pre-flight.) Show: extension name + one-liner, the **surfaces + views** (one line each), components +
mock entities per view, the theme source, the stack (plain **Vite + React + Tailwind → Manifest V3**)
+ that it lives in `plugin/` and previews in Chrome via **Load unpacked**, anything deferred, and the
vetting status. Ask once: *"Build this? I'll create the `plugin/` folder and you'll be able to load it
into Chrome to try it. (yes / tweak something)."*

### Phase 3 — Scaffold + theme `plugin/` (the main delta)

Build **in-session, in order** (the scaffold is mostly shared spine with hard dependencies — not
something to fan out). Hand-write the project **offline**. Directory layout — popup/options are
multi-page Vite HTML entries at the project root; `manifest.json` + icons live in `public/` so Vite
copies them verbatim into `dist/`:

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

Add `"icons": { "16": "icons/16.png", "48": "icons/48.png", "128": "icons/128.png" }` **only if**
placeholder icons are written to `public/icons/` — otherwise omit the key (Chrome shows a default
puzzle icon; the extension still loads and the popup/options still work), keeping the scaffold fully
text-only/offline (no hand-authored binary assets). Add `"side_panel": { "default_path":
"sidepanel.html" }` + `"sidePanel"` in `permissions` only when `config.include_side_panel` is true.
Keep `permissions: []` at Tier 0 (the sole exception: the opt-in `sidePanel` permission above, only
when `include_side_panel` is true — a UI-only permission, off by default). **No
`background.service_worker`** and **no content script** in v1 (a
pure-UI MVP needs neither); both are named as later tiers.

**Pin the stack from `aios/`, don't hardcode (identical to build-app).** Read `aios/package.json` and
pin the **same major versions** for the shared subset (verified June 2026: `vite ^5`,
`@vitejs/plugin-react ^4`, `react`/`react-dom ^18.3`, `typescript ^5.5`, `tailwindcss ^3.4`, `postcss
^8.4`, `autoprefixer ^10.4`, plus `class-variance-authority`, `clsx`, `tailwind-merge`,
`tailwindcss-animate`, `lucide-react`). The **only** extension-specific addition is dev-only
**`@types/chrome`** (so any future `chrome.*` usage typechecks; a mock-data v1 may not call chrome APIs
at all). Prefer `@types/chrome` over `webextension-polyfill` for a Chrome-first MVP — cross-browser
packaging (which wants the polyfill) is a later tier. **Exclude** the KB-console-only deps
(`@anthropic-ai/sdk`, `@supabase/supabase-js`, `gray-matter`, `react-markdown`, `remark-gfm`, `vitest`,
`@tanstack/react-query`) and `react-router-dom` (a popup/options MVP navigates with simple local
state, not a router).

**Theme it exactly like the web app (delta = the popup's fixed size).** Write the same 13 base tokens
(`:root` and `.dark`) into **`plugin/src/index.css`** — identical names/format to `app/src/index.css`
(space-separated HSL triplets, no `hsl()` wrapper) — **re-derive and eyeball the paired contrast
tokens** (`--*-foreground`, `--popover*`) for legibility, and set `--radius` + the shadow vars from
Typography & shape. Copy `tailwind.config.ts` unchanged (it only reads the CSS vars; ensure its
`content` globs cover the root `*.html` entries and `src/**`). Default to the Inter/system font stack;
only add a webfont `<link>` if the design names one. Honor "dark-first" for the entries' `<html
class>`. **The one platform nuance:** a toolbar **popup sizes to its content (up to ~800×600)**, so the
popup root/body gets an **explicit width** (~360–400px, e.g. a `w-[380px]` root wrapper) and a sensible
min-height, so it renders as a proper popup rather than a sliver. The options page is a full tab and
needs no fixed width.

**Mock/local data approach (identical to build-app).** A `src/data/` module per entity with typed
fixtures (plain TS arrays/objects) + small accessors (`getX()`, `listX()`), imported directly by views.
No fetch, no env, no network, no `chrome.storage` — fully Tier-0/offline. Every view is clearly
placeholder-powered; stated in `plugin/README.md` and `wiki/build.md`.

**Surfaces & components.** Each surface (`popup.html`, `options.html`, optionally `sidepanel.html`) is
its own Vite entry mounting a React root that imports the shared `src/index.css` and renders its shell
+ views. In-popup navigation between views is simple local state (no router). Reuse the shadcn-style
`cva` primitives (button/card/input/badge…) so the look matches the design system's quality bar. Copy
only the primitives actually used.

### Phase 4 — Provenance & KB integration (SHARED spine; delta = a `target` tag)

`plugin/` holds the **code** (a build target outside the knowledge folders, like `aios/`, `app/`, and
`mobile/`). The **record** lands in the knowledge base, on the same spine as `build-app`/`build-mobile`:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** — immutable, append-only build record (RAG frontmatter),
  **with `target: plugin`** in the frontmatter (+ a `plugin` and `extension` tag). Captures the
  confirmed surfaces + view plan, components, mock entities, theme source + token snapshot reference,
  charter version, vetting verdict referenced (+ any KILL override), the pinned stack (mirrored from
  `aios/`), the MV3 surfaces built, and anything deferred. (`build-app` records are implicitly
  `target: web`, `build-mobile` records `target: mobile`; existing records without the field are
  treated as web.)
- **`wiki/build.md`** — the AI-written **multi-target** index (created at runtime on first build of any
  kind, like `roast` creates `wiki/vetting.md`; RAG frontmatter per `docs/WIKI-FRONTMATTER.md`).
  `build-plugin` adds/maintains a **"Browser extension (`plugin/`)"** section (surface + view list,
  where it lives, the Load-unpacked preview instructions, theme source, links to the `raw/builds/`
  record(s) + charter + design system), and **preserves any existing Web and Mobile sections.** Robust
  sectioning: the *already-shipped* `build-app` writes `wiki/build.md` as a **flat, un-sectioned** web
  index (no headings); `build-mobile` wraps that flat content under `## Web app (app/)` on first mobile
  build. So `build-plugin` must handle both: if a **flat** (un-sectioned) web index is present, **first
  wrap it under a `## Web app (app/)` heading**; **preserve** any existing Web and Mobile sections
  untouched; then add/update the `## Browser extension (plugin/)` section. **Match existing sections on
  a stable substring** ("Web app", "Mobile app", "Browser extension") — not an exact heading string —
  since `build-mobile` writes its headings with backticks around the folder name
  (`` ## Mobile app (`mobile/`) ``). If `wiki/build.md` doesn't exist yet, create it (RAG frontmatter)
  with just the Browser extension section. Cross-linked from `wiki/index.md` on first creation.
- **`outputs/change-log.md`** — one attributed line (newest-at-top):
  `- <YYYY-MM-DD> — build-plugin — scaffolded browser extension (plugin/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

`raw/builds/.gitkeep` already ships (Phase 11) — nothing new. `improve-system` remains the single
applier for the self-improvement lanes — this skill writes only its own `applied` line.

### Phase 5 — Offer to preview, then close plainly (delta = Load unpacked)

Don't auto-run anything that touches the network or disk-installs. **Offer** it, keeping `plugin/` as
the working directory (apply the build-app/build-mobile lesson — don't split a bare `cd` from the
command that depends on it; use a compound command or `npm --prefix plugin`). Close with the
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

Be honest that plain Vite has **no live popup hot-reload** (MV3's CSP blocks the dev server inside the
extension context); the working dev loop is `npm run build:watch` + click-reload on the card.
Optionally offer `npm --prefix plugin run typecheck` and offer to fix any type errors on the spot. If
offline, the extension is still fully written; install/build/preview when back online.

### Re-run / idempotency (identical to build-app/build-mobile)

`plugin/` exists → incremental, never clobber. Diff the current charter MVP vs. what's built; offer a
menu: (1) add/update surfaces or views (deltas only), (2) re-apply the theme from the current
`wiki/design-system.md`, (3) both. New files written freely; existing files shown as a diff and
confirmed before overwrite. Each re-run writes a **new** `raw/builds/` record and updates the **Browser
extension** section of `wiki/build.md` in place. Detect a partial/broken prior build (missing spine
files) and offer targeted repair. **`build-plugin` owns everything under `plugin/`, including its
theme** — a restyle is a re-run (option 2); `define-design` (which owns `aios/`) is not extended to
write `plugin/`.

## Wiring

- **`.claude/skills/what-can-i-do/SKILL.md`** — new menu item: *"Build a browser extension — turn your
  plan into a Chrome extension you can load and try → runs `build-plugin`."*
- **`.claude/skills/setup-project/SKILL.md`** — extend the step-8 propose-only offer to name all three:
  *"…build a first version of your app? → `build-app` (web), `build-mobile` (phone), or `build-plugin`
  (browser extension)"* (propose-only).
- **`.claude/skills/advise-project/SKILL.md`** — extend the one propose-only project-lane clause so a
  GO-vetted brief may point to `build-app`, `build-mobile`, **or `build-plugin`** (all three are
  attended; none auto-run in the tick).
- **`CLAUDE.md`** — add one `build-plugin` Skills bullet after the `build-mobile` bullet; update the
  existing `raw/builds/` subfolder line to name the browser extension too (*"…the apps live in `app/`
  (web), `mobile/` (phone), and `plugin/` (browser extension)"*). Keep the file under the `<125`-line
  cap (currently 105 → ~107).
- **`docs/BUILD-PLUGIN.md`** *(new)* — the detail page: the plain-Vite + MV3 stack (and why not
  WXT/@crxjs), the Load-unpacked preview story (+ the `vite preview` browser quick-look and the honest
  no-HMR note), how the design tokens carry over unchanged, the `plugin/` layout, the view-cap/core-
  slice logic, re-run behavior, the shared multi-target build index, and the LATER tiers (packaging +
  Chrome Web Store submission + a paid developer account, cross-browser packaging, real permissions /
  host access, a background service worker, plus web/mobile are other slices). `CLAUDE.md` stays a
  pointer.
- **`README.md`** — extend the "🛠️ Built for you" bullet + the "Build it" journey step to note **web,
  mobile, or browser extension**; add the Phase 13 build-status line; link `docs/BUILD-PLUGIN.md`.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — extend the "Then build it" line to note the extension
  option (`build-plugin` → a Chrome extension previewed via Load unpacked).
- **`docs/BUILD-APP.md`** and **`docs/BUILD-MOBILE.md`** — turn their "plugins are a later slice"
  bullets into a live cross-reference (*"for a browser extension, see `build-plugin` /
  `docs/BUILD-PLUGIN.md`"*).
- **`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`** — a **Phase 13 addendum** in
  the same voice as the Phase 11/12 addenda.

## Graceful-off / keys / tiers / safety

- **Attended-only; never added to `maintenance-loop`.** Same justification as `build-app`/`build-mobile`:
  it creates/overwrites project source and offers `npm install` (network + arbitrary postinstall +
  disk); it must never run unattended; it is built around the one confirm gate. `maintenance-loop/SKILL.md`
  is **not** modified.
- **Tier 0 / no keys / no accounts / no permissions / mock data only.** The v1 extension has no
  backend, auth, deploy, env, secrets, host permissions, or service worker; nothing is collected in
  chat. **Packaging + Chrome Web Store submission (a paid developer account) are an explicit later
  tier.** Scaffolding writes only local files and works fully offline; only the opt-in `npm install`
  needs the network.
- **No API keys are ever collected in chat.**

## Files

**Create (shipped):** `.claude/skills/build-plugin/SKILL.md`, `.claude/skills/build-plugin/config.json`,
`docs/BUILD-PLUGIN.md`. (No new `.gitkeep` — `raw/builds/.gitkeep` already ships. `plugin/**`, the
`raw/builds/<date>-<slug>.md` record, `wiki/build.md`, the `wiki/index.md` cross-links, and the
`change-log.md` line are written by the skill at runtime — **not shipped**.)

**Modify (shipped):** `CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/BUILD-APP.md`, `docs/BUILD-MOBILE.md`,
`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`,
`.claude/skills/what-can-i-do/SKILL.md`, `.claude/skills/setup-project/SKILL.md`,
`.claude/skills/advise-project/SKILL.md`.

## Verification

- **Authoring fidelity:** the skill mirrors `build-app`/`build-mobile`'s phase structure (pre-flight
  routing incl. charter-hard / design-soft / GO-RESHAPE-KILL-override / existing-`plugin/`; view-plan
  cap; single confirm gate; provenance; re-run; attended-only rules), differing only in the plain-Vite
  MV3 scaffold, the popup fixed-width nuance, and the Load-unpacked preview. Every path the skill names
  is real or runtime-created.
- **Extension stack fidelity:** the generated `package.json` mirrors `aios/` majors + adds only
  dev-only `@types/chrome`; `vite.config.ts` uses `build.rollupOptions.input` for the popup/options
  (+ sidepanel when enabled) entries; `public/manifest.json` is a valid minimal MV3 manifest (popup +
  options, `permissions: []`, no service worker/content script); the popup root carries an explicit
  fixed width; `plugin/src/index.css` carries the same 13 HSL tokens, resolved by `tailwind.config.ts`;
  the skill writes `plugin/.gitignore` (node_modules, dist).
- **Provenance:** a build writes `raw/builds/<date>-<slug>.md` with `target: plugin`, adds/updates the
  Browser-extension section of `wiki/build.md` (preserving any Web/Mobile sections; wrapping a legacy
  flat web index first) + `wiki/index.md` cross-links, and appends one attributed `applied` change-log
  line; `plugin/` stays out of `raw/`/`wiki/`/`outputs/`. `improve-system` unchanged.
- **Safety:** attended-only; `maintenance-loop/SKILL.md` unchanged; `npm install`/`npm run build` are
  offered, never run by the skill; KILL requires an explicit override; no keys/accounts/permissions
  requested; works offline.
- **Wiring:** `what-can-i-do` shows the item; `setup-project`/`advise-project` changes are additive and
  propose-only; `wc -l CLAUDE.md` **< 125** with the bullet + note added; README/USING/BUILD-APP/
  BUILD-MOBILE mention the extension option; the design-spec Phase 13 addendum points here.
- **No pollution:** `git status` clean aside from the intended files; **no `plugin/` committed**; no
  real `raw/builds/<date>-<slug>.md`, no `wiki/build.md`; no new `.gitkeep`; **do not run a real build
  against this template repo.** `build-app`, `build-mobile`, `improve-system`, `maintenance-loop`, and
  `raw/` are byte-for-byte untouched by the additive wiring.

## Out of scope (v1)

- **Packaging (`.zip`) + Chrome Web Store submission + a paid developer account** — an explicit later
  tier; v1 is Load-unpacked preview only.
- **Cross-browser packaging (Firefox/Edge/Safari)** — wants `webextension-polyfill` +
  `browser_specific_settings`; a later tier. v1 is Chrome/Edge (Chromium) first.
- **Real permissions / host access, a background service worker, content scripts, `chrome.storage`,
  network calls** — higher tiers later; v1 is a pure-UI popup/options MVP with mock/local data (keeps
  Tier 0 intact).
- **Live popup HMR tooling (WXT / @crxjs)** — v1 uses plain Vite (`build:watch` + reload); adopting a
  framework for HMR is a later, opt-in consideration.
- **Plugin builds for other hosts (VS Code, Figma)** and any change to the shipped **web** `build-app`
  or **mobile** `build-mobile` — separate slices; `build-plugin` only adds its own skill + the additive
  wiring + the shared-index `target` dimension.
- Any change to `raw/` immutability, the approval discipline, or `improve-system`'s role.
