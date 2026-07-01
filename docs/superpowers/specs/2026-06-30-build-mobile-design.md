# Design Spec: `build-mobile` — turn the charter + design system into a phone app

> Status: Approved (2026-06-30). Not yet implemented. A new capability layered on the foundation
> (Phases 0–11). Call it **Phase 12**. One attended, interview-light skill — the mobile sibling of
> `build-app` (Phase 11). Tier 0 (mock/local data, no backend, auth, deploy, accounts, or keys).
> Expo (React Native); installable app-store builds are an explicit later tier. No API keys.

## Context

**Why this is being built.** Phase 11 shipped `build-app`, which turns `wiki/charter.md` (MVP scope)
+ `wiki/design-system.md` (theme) + the `outputs/vetting/` verdict into a working, themed **web** app
in a top-level `app/` folder. That slice was deliberately "web-first," and its provenance
(`raw/builds/` + `wiki/build.md`) was written multi-target so a mobile sibling "slots in without
rework." The user asked for **mobile next.** `build-mobile` is that sibling: the same one-confirm,
themed, mock-data flow, producing a **phone app** the user previews on their actual device.

**Why the stack fits (Expo SDK 56, mid-2026).** The mobile toolchain that stays cohesive and
non-technical-friendly:
- **Expo (React Native) + Expo Router + NativeWind + TypeScript** — the *same React/TS world* as the
  web app and the AIOS console.
- **NativeWind v4 reads the exact same 13 HSL design tokens** (`--primary: H S% L%` …) the web app
  writes, so `wiki/design-system.md` carries over **1:1** — no theme rework.
- **Preview on a real phone by scanning a QR code** (the free Expo Go app) — *no Xcode/Android Studio,
  works from Windows*, hot-reloads. Plus `expo start --web` for an instant browser look.
- **Hand-scaffolds offline** (pin the Expo SDK; installs are only *offered*) — same discipline as
  build-app.

**Decisions (made with the user this session):**
1. **Toolchain = Expo + React Native** (Expo Router + NativeWind + TS). *(Rejected: Flutter — a
   separate Dart ecosystem, no code/token reuse; bare React Native — needs Xcode/Android Studio, too
   heavy for a first mobile slice.)*
2. **v1 = a themed mobile MVP + phone preview** — mock/local data; Expo Go QR + browser preview. No
   accounts, keys, or app-store setup. **Installable builds via EAS are an explicit later tier**
   (keeps the Tier-0 no-keys default intact). *(Rejected: bundling EAS/accounts into v1.)*

**Intended outcome.** The foundation's build step becomes **web *or* mobile.** A non-technical user
says "build my mobile app" and gets a themed, on-brand app they preview on their phone by scanning a
QR code — behind one draft-confirm gate, with nothing to install on their computer.

## Architecture

One attended, interview-light skill — a faithful sibling of `build-app`, differing only where the
mobile toolchain requires. It reads the three north-stars, confirms a screen plan once, then
scaffolds and themes a new top-level `mobile/` Expo project, and records the build on the **same**
provenance spine Phase 11 established.

```
                          ┌──────────────────────────────────────────────┐
  "build my mobile app" ─▶│                 build-mobile                 │
  "make a mobile app"     │  0. pre-flight gates (read north-stars)       │
  "build it for phones"   │     charter · design · vetting                │
  "/build-mobile"         │  1. derive screen plan (Expo Router routes)   │
  what-can-i-do / setup ─▶│  2. ONE draft-confirm gate                    │
  advise-project (GO) ───▶│  3. scaffold + theme mobile/ (Expo+NativeWind)┼─▶ mobile/  (Expo app, mock data,
                          │  4. provenance (target: mobile) ──────────────┼─▶   preview on phone via QR)
                          │  5. offer to preview (QR / Expo Go)           │     raw/builds/<date>-<slug>.md
                          └──────────────────────────────────────────────┘     wiki/build.md (Mobile section) + change-log
```

**Parts, reusing existing patterns:**
1. **`build-mobile` skill** *(new)* — mirrors `build-app`'s read → plan → confirm → scaffold → record
   pipeline, voice, and guardrails.
2. **`mobile/`** *(written at runtime, not shipped)* — the generated Expo app; its own project.
3. **`raw/builds/`** *(shared with build-app; already ships `.gitkeep`)* — immutable per-build records,
   now with a `target` dimension.
4. **`wiki/build.md`** *(shared, runtime-created)* — the multi-target build index (Web + Mobile sections).
5. **`docs/BUILD-MOBILE.md`** *(new)* — the detail-holder (the `mobile/` layout, the QR preview, the
   later tiers).

## The `build-mobile` skill

`.claude/skills/build-mobile/SKILL.md` (+ `.claude/skills/build-mobile/config.json`). Frontmatter
`name: build-mobile` + `argument-hint: "[what to build, or leave blank to use your charter]"`; trigger
list: "build my mobile app", "build the mobile app", "make a mobile app", "build it for phones", "turn
my idea into a phone app", `/build-mobile`. Zero-argument safe (no args → use the charter). Voice and
phase structure mirror `build-app`.

**`config.json`** (all defaulted; never block on absence):
`{ "mobile_dir": "mobile", "expo_sdk": "56", "max_screens": 6 }`
(No `dev_port` — preview is the Expo Go QR / `expo start`; `expo_sdk` makes the pinned stack a
one-line bump.)

### Phase 0 — Pre-flight gates (identical to build-app)

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
- **Existing `mobile/`** → incremental mode (see Re-run).

### Phase 1 — Derive the screen plan (identical to build-app)

From the charter's `In / MVP:`, derive a **small** set of screens/routes (each becomes an Expo Router
route file), each with its components + mock entities. Pick a mobile-appropriate nav archetype (tabs ·
stack · list+detail) from Purpose/Audience and microcopy tone from the design-system Voice.
**Runaway-scope guard:** cap at `config.max_screens` (default 6); build the **core slice** and list the
rest as `Later (not in this build)`. Honor the charter's `Out`/`Later` as hard exclusions.

### Phase 2 — Single draft-confirm gate (identical to build-app)

One message, one confirm. ("Single gate" = the build decision; the Phase 0 routing is separate
pre-flight.) Show: app name + one-liner, the screen list (one line each), components + mock entities
per screen, the theme source, the stack (Expo SDK 56 + Expo Router + NativeWind) + that it lives in
`mobile/` and previews on a phone via QR, anything deferred, and the vetting status. Ask once: *"Build
this? I'll create the `mobile/` folder and you'll be able to preview it on your phone. (yes / tweak
something)."*

### Phase 3 — Scaffold + theme `mobile/` (the main delta)

Build **in-session, in order** (the scaffold is mostly shared spine with hard dependencies — not
something to fan out). Hand-write the project **offline**. Directory layout — note Expo Router's routes
dir is **`mobile/app/`**, distinct from the repo-root web `app/` (no collision):

```
mobile/
├── package.json          # own; pinned Expo SDK (config.expo_sdk, default 56): expo, react, react-native,
│                         #   expo-router, nativewind, react-native-safe-area-context, react-native-reanimated;
│                         #   dev: typescript, tailwindcss@^3.4, babel-preset-expo, @types/*.
│                         #   Scripts: start (expo start), android, ios, web (expo start --web).
├── app.json              # Expo config: name/slug from charter; expo-router plugin; icon/splash placeholders
├── babel.config.js       # babel-preset-expo + nativewind/babel
├── metro.config.js       # withNativeWind(config, { input: './global.css' })
├── tailwind.config.js    # presets:[nativewind/preset]; content globs; colors → hsl(var(--token)/<alpha-value>); --radius
├── global.css            # the 13 HSL tokens (:root + dark) FROM wiki/design-system.md — mirrors app/src/index.css
├── tsconfig.json         # extends expo/tsconfig.base, strict
├── nativewind-env.d.ts   # NativeWind types reference
├── .gitignore            # node_modules, .expo/, dist/, web-build/, *.log  (Expo's standard ignores)
├── README.md             # how to preview (QR + Expo Go) + "themed mobile MVP, mock data" + raw/builds pointer
├── assets/               # icon/splash placeholders (optional)
├── app/                  # Expo Router routes (mobile/app/, NOT the repo-root web app/)
│   ├── _layout.tsx       # SafeAreaProvider + Stack/Tabs nav; imports global.css
│   ├── index.tsx         # home screen
│   └── <one file per derived screen>   # e.g. items.tsx, [id].tsx for detail
└── src/
    ├── components/ui/    # RN shadcn-style primitives (Button=Pressable+Text, Card=View, Input=TextInput…) via cva + NativeWind
    ├── components/layout/AppShell.tsx   # themed header/nav
    ├── config/app.ts     # app name/tagline from charter (words only)
    ├── lib/utils.ts      # cn() helper
    └── data/             # typed mock fixtures + getX()/listX() accessors — no fetch, no env, offline
```

**Pin the stack from the Expo SDK (delta — no sibling to mirror).** Unlike `build-app` (which reads
`aios/package.json`), there is no Expo project in the repo to mirror, so `build-mobile` pins the
**stable Expo SDK named in `config.expo_sdk`** (default 56) and lets **`npx expo install`** reconcile
native-dep versions at install time — the idiomatic RN approach (pin the SDK, don't hand-pin React
Native). Hand-write `package.json` with the SDK-pinned versions; name the canonical SDK in
`docs/BUILD-MOBILE.md` + `mobile/README.md`.

**Theme it exactly like the web app (delta = target file).** Write the same 13 HSL tokens (`:root` +
dark) into **`mobile/global.css`** — identical names/format to `app/src/index.css` — re-derive and
sanity-check the paired contrast tokens for legibility, set `--radius` + shadow vars from Typography &
shape. `tailwind.config.js` maps each token to `hsl(var(--token) / <alpha-value>)` (this is the one
theming difference from web: RN needs the config's colors block; the *token values themselves* are
identical). Dark mode via NativeWind `dark:` + `useColorScheme`. **Fonts:** default to the system
stack (SF Pro / Roboto) for v1; only wire a custom font (expo-font) if the design names one. **Safe
area** via `react-native-safe-area-context`; keep icon use light (the Expo-recommended icon set for
the SDK).

**Mock/local data approach (identical to build-app).** A `src/data/` module per entity with typed
fixtures (plain TS arrays/objects) + small accessors (`getX()`, `listX()`), imported directly by
screens. No fetch, no env, no network — fully Tier-0/offline. Every screen is clearly placeholder-
powered; stated in `mobile/README.md` and `wiki/build.md`.

**Routes & components.** File-based routes in `mobile/app/` (Expo Router) under a shared `_layout.tsx`
(SafeAreaProvider + Stack or Tabs). Reuse cva + NativeWind primitives (button/card/input/badge…) so
the look matches the design system's quality bar. Copy only the primitives used.

### Phase 4 — Provenance & KB integration (SHARED spine; delta = a `target` tag)

`mobile/` holds the **code** (a build target outside the knowledge folders, like `aios/` and `app/`).
The **record** lands in the knowledge base, on the same spine as `build-app`:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** — immutable, append-only build record (RAG frontmatter),
  **with `target: mobile`** in the frontmatter (+ a `mobile` tag). Captures the confirmed screen plan,
  components, mock entities, theme source + token snapshot reference, charter version, vetting verdict
  referenced (+ any KILL override), the pinned Expo SDK / stack, and anything deferred. (`build-app`
  records are implicitly `target: web`; existing records without the field are treated as web.)
- **`wiki/build.md`** — the AI-written **multi-target** index (created at runtime on first build of any
  kind, like `roast` creates `wiki/vetting.md`; RAG frontmatter per `docs/WIKI-FRONTMATTER.md`).
  `build-mobile` adds/maintains a **"Mobile app (`mobile/`)"** section (route list, where it lives, the
  QR-preview instructions, theme source, links to the `raw/builds/` record(s) + charter + design
  system), and **preserves any existing "Web app (`app/`)" section** from a prior `build-app` run.
  Cross-linked from `wiki/index.md` on first creation.
- **`outputs/change-log.md`** — one attributed line (newest-at-top):
  `- <YYYY-MM-DD> — build-mobile — scaffolded Expo mobile app (mobile/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

`raw/builds/.gitkeep` already ships (Phase 11) — nothing new. `improve-system` remains the single
applier for the self-improvement lanes — this skill writes only its own `applied` line.

### Phase 5 — Offer to preview, then close plainly (delta = the QR preview)

Don't auto-run anything that touches the network or disk-installs. **Offer** it, keeping `mobile/` as
the working directory (apply build-app's Codex lesson — don't split a bare `cd` from the command that
depends on it; use a compound command or `npm --prefix mobile`). Close with the plain-words path:

> *"Your mobile app is ready in the `mobile/` folder. To see it on your phone: run `cd mobile && npm
> install` (one time — this downloads the app's building blocks), then `npm run start` (or `npx expo
> start`) — it shows a QR code. Open the free **Expo Go** app on your phone and scan it; your app
> loads in a few seconds. No Mac or app-store setup needed. Prefer your computer? `npm run web` opens
> it in a browser. Want me to start it for you?"*

Optionally offer a typecheck and offer to fix any type errors on the spot. If offline, the app is
still fully written; install/preview when back online.

### Re-run / idempotency (identical to build-app)

`mobile/` exists → incremental, never clobber. Diff the current charter MVP vs. what's built; offer a
menu: (1) add/update screens (deltas only), (2) re-apply the theme from the current
`wiki/design-system.md`, (3) both. New files written freely; existing files shown as a diff and
confirmed before overwrite. Each re-run writes a **new** `raw/builds/` record and updates the **Mobile**
section of `wiki/build.md` in place. Detect a partial/broken prior build (missing spine files) and
offer targeted repair. **`build-mobile` owns everything under `mobile/`, including its theme** — a
restyle is a re-run (option 2); `define-design` (which owns `aios/`) is not extended to write
`mobile/`.

## Wiring

- **`.claude/skills/what-can-i-do/SKILL.md`** — new menu item: *"Build a mobile app — turn your plan
  into an app you can open on your phone → runs `build-mobile`."*
- **`.claude/skills/setup-project/SKILL.md`** — extend the step-8 propose-only offer to name both:
  *"…build a first version of your app? → `build-app` (web) or `build-mobile` (phone)"* (propose-only).
- **`.claude/skills/advise-project/SKILL.md`** — extend the one propose-only project-lane clause so a
  GO-vetted brief may point to `build-app` **or `build-mobile`**. Still never auto-run in the tick.
- **`CLAUDE.md`** — add one `build-mobile` Skills bullet after the `build-app` bullet; update the
  existing `raw/builds/` subfolder line to name both apps (*"…the apps live in `app/` (web) and
  `mobile/`"*). Keep the file under the `<125`-line cap (currently 104).
- **`docs/BUILD-MOBILE.md`** *(new)* — the detail page: the Expo stack + pinned SDK, the QR/phone
  preview story (+ browser fallback), how the design tokens carry over via NativeWind, the `mobile/`
  layout, the screen-cap/core-slice logic, re-run behavior, the shared multi-target build index, and
  the LATER tiers (installable builds via EAS + a free Expo account, real data/backend, plus web and
  plugins are other slices). `CLAUDE.md` stays a pointer.
- **`README.md`** — extend the "🛠️ Built for you" bullet + the "Build it" journey step to note **web
  or mobile**; add the Phase 12 build-status line; link `docs/BUILD-MOBILE.md`.
- **`docs/USING-THIS-FOR-ANY-PROJECT.md`** — extend the "Then build it" line to note the mobile option
  (`build-mobile` → a phone app previewed via Expo Go).
- **`docs/BUILD-APP.md`** — one cross-reference line ("for a phone app, see `build-mobile` /
  `docs/BUILD-MOBILE.md`").
- **`docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`** — a **Phase 12 addendum** in
  the same voice as the Phase 11 addendum.

## Graceful-off / keys / tiers / safety

- **Attended-only; never added to `maintenance-loop`.** Same justification as `build-app`: it
  creates/overwrites project source and offers `npm install` (network + arbitrary postinstall + disk);
  it must never run unattended; it is built around the one confirm gate. `maintenance-loop/SKILL.md` is
  **not** modified.
- **Tier 0 / no keys / no accounts / mock data only.** The v1 app has no backend, auth, deploy, env, or
  secrets; nothing is collected in chat. **Installable builds (EAS) + an Expo account are an explicit
  later tier.** Scaffolding writes only local files and works fully offline; only the opt-in
  `npm install` needs the network.
- **No API keys are ever collected in chat.**

## Files

**Create (shipped):** `.claude/skills/build-mobile/SKILL.md`, `.claude/skills/build-mobile/config.json`,
`docs/BUILD-MOBILE.md`. (No new `.gitkeep` — `raw/builds/.gitkeep` already ships. `mobile/**`, the
`raw/builds/<date>-<slug>.md` record, `wiki/build.md`, the `wiki/index.md` cross-links, and the
`change-log.md` line are written by the skill at runtime — **not shipped**.)

**Modify (shipped):** `CLAUDE.md`, `README.md`, `docs/USING-THIS-FOR-ANY-PROJECT.md`,
`docs/BUILD-APP.md`, `docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md`,
`.claude/skills/what-can-i-do/SKILL.md`, `.claude/skills/setup-project/SKILL.md`,
`.claude/skills/advise-project/SKILL.md`.

## Verification

- **Authoring fidelity:** the skill mirrors `build-app`'s phase structure (pre-flight routing incl.
  charter-hard / design-soft / GO-RESHAPE-KILL-override / existing-`mobile/`; screen-plan cap; single
  confirm gate; provenance; re-run; attended-only rules), differing only in the Expo scaffold, the
  NativeWind token mapping, and the QR preview. Every path the skill names is real or runtime-created.
- **Mobile stack fidelity:** the generated `package.json` pins the Expo SDK from `config.expo_sdk` and
  the skill advises `npx expo install`; `mobile/app/` (Expo Router) is used, distinct from the web
  `app/`; `mobile/global.css` carries the same 13 HSL tokens, mapped in `tailwind.config.js`; the skill
  writes `mobile/.gitignore` (incl. `.expo/`).
- **Provenance:** a build writes `raw/builds/<date>-<slug>.md` with `target: mobile`, adds/updates the
  Mobile section of `wiki/build.md` (preserving any Web section) + `wiki/index.md` cross-links, and
  appends one attributed `applied` change-log line; `mobile/` stays out of `raw/`/`wiki/`/`outputs/`.
  `improve-system` unchanged.
- **Safety:** attended-only; `maintenance-loop/SKILL.md` unchanged; `npm install`/`expo start` are
  offered, never run by the skill; KILL requires an explicit override; no keys/accounts requested;
  works offline.
- **Wiring:** `what-can-i-do` shows the item; `setup-project`/`advise-project` changes are additive and
  propose-only; `wc -l CLAUDE.md` **< 125** with the bullet + note added; README/USING/BUILD-APP mention
  the mobile option; the design-spec Phase 12 addendum points here.
- **No pollution:** `git status` clean aside from the intended files; **no `mobile/` committed**; no
  real `raw/builds/<date>-<slug>.md`, no `wiki/build.md`; no new `.gitkeep`; **do not run a real build
  against this template repo.**

## Out of scope (v1)

- **Installable app-store builds (EAS) + Expo accounts** — an explicit later tier; v1 is Expo Go
  preview only.
- **Backend/data/auth** — higher tiers later; v1 is mock/local data only (keeps Tier 0 intact).
- **Plugin builds** and any change to the shipped **web** `build-app` — separate slices; `build-mobile`
  only adds its own skill + the additive wiring + the shared-index `target` dimension.
- **Parallel-subagent leaf-screen builds** — documented in build-app as a later optimization; v1 builds
  in-session.
- Any change to `raw/` immutability, the approval discipline, or `improve-system`'s role.
