---
name: build-mobile
description: Use when someone asks to "build my mobile app", "build the mobile app", "make a mobile app", "build it for phones", "turn my idea into a phone app", or says "/build-mobile". Turns the project's charter (the MVP scope) + design system (the theme) into a working, themed Expo (React Native) mobile app in a new top-level mobile/ folder, previewed on a phone by scanning a QR code with the free Expo Go app. Reads wiki/charter.md, wiki/design-system.md, and the latest outputs/vetting/ verdict; one screen-plan confirm gate; Tier 0 (mock/local data — no backend, auth, deploy, accounts, or keys). Attended-only — never runs in the maintenance loop. Re-runnable: adds screens incrementally and never overwrites a file without asking. Zero-argument safe.
argument-hint: "[what to build, or leave blank to use your charter]"
---

# build-mobile

The phone-app sibling of `build-app`. The foundation already helps a non-technical user get clear on
*what* they're building (`define-project` → `wiki/charter.md`), *whether it's worth building*
(`roast`/`storm-research` → `outputs/vetting/`), and *how it should look* (`define-design` →
`wiki/design-system.md`). This skill turns those three north-stars into an actual, working, on-brand
**phone app** they can open on their own device — without making them figure out any of the building
themselves.

What it produces: a new top-level **`mobile/`** folder — its own **Expo (React Native) + Expo Router +
NativeWind + TypeScript** project, themed from the design system (the same 13 tokens as the web app),
with a screen for each item in the charter's MVP, wired to **mock/local data**. You preview it on your
phone by scanning a QR code with the free Expo Go app — no Mac, no Xcode. It is a **front-end MVP with
placeholder data** — no backend, accounts, or app-store build (those are later tiers).

## When to use

When the user says "build my mobile app", "build the mobile app", "make a mobile app", "build it for
phones", "turn my idea into a phone app", or `/build-mobile`. Also offered by `what-can-i-do`, by
`setup-project` once a charter + design exist, and pointed to by `advise-project` for a GO-vetted idea.
It is **attended** — it asks one confirming question before building — and **never runs in the
unattended `maintenance-loop`**. This is the phone sibling of `build-app` (which builds a web app into
`app/`).

## Configuration

Read `.claude/skills/build-mobile/config.json` (all values default; never block on absence):
- `mobile_dir` (default `"mobile"`) — where the app is written.
- `expo_sdk` (default `"56"`) — the pinned Expo SDK. **Confirm the current stable SDK at build time**
  rather than trusting the default on faith; bumping is a one-line change and `npx expo install`
  reconciles native versions.
- `max_screens` (default `6`) — the cap on screens built in one pass (the runaway-scope guard).

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
     app."*
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
4. **Existing `mobile/` →** switch to **incremental mode** (see *Re-running*).

### Phase 1 — Derive the screen plan

From the charter's **In / MVP** list, derive a **small** set of screens/routes — each becomes an Expo
Router route file, each with the components it needs and the mock entities it shows. Use
`Purpose`/`Audience` to choose a mobile nav archetype (**tabs**, a **stack**, or **list + detail**) and
the design system's **Voice** for the wording.

**Stay scoped (the runaway guard):** cap at `config.max_screens` (default 6). If the MVP implies more,
build the **core slice** — the 3–6 most central screens — and list the rest under
`Later (not in this build)`. Never exceed the cap in one pass.

### Phase 2 — Confirm once, then build

Show the plan in **one message** and ask **one** question. ("Single gate" = the build decision; the
Phase 0 routing above is separate pre-flight.) Include:
- the app's name + one-liner (from the charter),
- the screen list — one line of purpose each,
- the components + mock entities per screen,
- the **theme source** (`wiki/design-system.md`, or "clean default"),
- the **stack** (Expo SDK + Expo Router + NativeWind) and that it lives in `mobile/`, previewed on a
  phone via a QR code,
- anything **deferred** (the core-slice note), and
- the **vetting status** folded in.

Ask: *"Build this? I'll create the `mobile/` folder and you'll be able to preview it on your phone.
(yes / tweak something)"* On "tweak", revise and show again. **No per-screen interrogation.**

### Phase 3 — Scaffold + theme `mobile/`

Build **in-session, in order** (the scaffold is mostly shared spine with hard dependencies — not
something to fan out to parallel agents). Hand-write the project **offline**. Note: Expo Router's
routes dir is **`mobile/app/`**, distinct from the repo-root web `app/` (no collision). Create
`mobile/` as its own minimal project:

```
mobile/
├── package.json          # own; "main":"expo-router/entry" (REQUIRED — no index.html entry); pinned Expo
│                         #   SDK (config.expo_sdk): expo, react, react-native, expo-router, nativewind,
│                         #   react-native-safe-area-context, react-native-reanimated, class-variance-authority,
│                         #   clsx, tailwind-merge; dev: typescript,
│                         #   tailwindcss@^3.4, babel-preset-expo, @types/*. Scripts: start (expo start),
│                         #   android, ios, web (expo start --web).
├── app.json              # Expo config: name/slug from charter; expo-router plugin; icon/splash placeholders
├── babel.config.js       # babel-preset-expo + nativewind/babel (add react-native-reanimated/plugin LAST if the SDK preset doesn't include it)
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
    ├── config/app.ts     # app name/tagline from the charter (words only)
    ├── lib/utils.ts      # cn() helper
    └── data/             # typed mock fixtures + getX()/listX() accessors — no fetch, no env, offline
```

**Pin the stack from the Expo SDK.** There is no Expo project in the repo to mirror, so pin the stable
Expo SDK named in `config.expo_sdk` (confirm the current stable SDK at build time) and let
**`npx expo install`** reconcile native-dep versions at install time — the idiomatic RN approach (pin
the SDK; don't hand-pin React Native). Hand-write `package.json` with the SDK-pinned versions, plus
`"main": "expo-router/entry"`.

**Theme it exactly like the web app.** Write the same 13 base tokens (`:root` and dark) into
`mobile/global.css` — identical names/format to `app/src/index.css` (space-separated HSL triplets, no
`hsl()` wrapper) — and **re-derive + eyeball the contrast pairs** (`--*-foreground`, `--popover*`) so
text stays legible; set `--radius` + the shadow vars from *Typography & shape*. `tailwind.config.js`
maps each token to `hsl(var(--token) / <alpha-value>)` (the one theming difference from web: RN needs
the config's colors block; the token *values* are identical). Dark mode via NativeWind `dark:` +
`useColorScheme`. **Fonts:** default to the system stack (SF Pro / Roboto) for v1; only wire a custom
font (expo-font) if the design names one. **Safe area** via `react-native-safe-area-context`; keep icon
use light (the Expo-recommended icon set for the pinned SDK).

**Mock data, not a backend.** Put a typed fixture module per entity in `src/data/` (plain arrays +
`getX()`/`listX()` accessors), imported directly by screens. No fetch, no env, no network. Every screen
is clearly placeholder-powered; say so in `mobile/README.md`.

**Routes & components.** File-based routes in `mobile/app/` (Expo Router) under a shared `_layout.tsx`
(SafeAreaProvider + a Stack or Tabs navigator). Reuse cva + NativeWind primitives (button, card, input,
badge…) so the look matches the design system's quality bar. Copy only the primitives you actually use.

### Phase 4 — Record it (provenance)

The **code** lives in `mobile/` (a build target outside the knowledge folders, like `aios/` and
`app/`). The **record** lands in the knowledge base, on the same spine as `build-app`:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; new dated file per build, `-2` for
  same-day re-runs)* — opens with RAG frontmatter (`title`/`source_id`/`path`/`tags`/`updated`) **with
  `target: mobile`** (+ a `mobile` tag), then captures: the confirmed screen plan, components, mock
  entities, the theme source, the charter version, the vetting verdict referenced (and any KILL
  override), the pinned Expo SDK / stack, and anything deferred.
- **`wiki/build.md`** *(the shared, multi-target build index; created on the first build of any kind,
  like `roast` creates `wiki/vetting.md`; opens with RAG frontmatter — see `docs/WIKI-FRONTMATTER.md`)*
  — add/maintain a **`## Mobile app (`mobile/`)`** section (route list, where it lives, the QR-preview
  instructions, theme source, links to the `raw/builds/` record(s) + `wiki/charter.md` +
  `wiki/design-system.md`). **Preserve any existing web content:** `build-app` writes this file as a
  flat, un-sectioned web index — so if a prior flat web index exists, **first wrap it under a
  `## Web app (`app/`)` heading**, then add the Mobile section below it; never drop or overwrite the web
  content. If the file doesn't exist yet, create it with just the Mobile section. Cross-link from
  `wiki/index.md` (pinned under "By area" + a "Recent additions" line) on first creation. Reference the
  raw record — never paste app code.
- **`outputs/change-log.md`** — append one attributed line (newest-at-top, as the sibling skills write
  it): `- <YYYY-MM-DD> — build-mobile — scaffolded Expo mobile app (mobile/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

`raw/builds/.gitkeep` already ships — nothing new. `improve-system` stays the single applier for the
self-improvement lanes — this skill only writes its own `applied` line, exactly as
`build-app`/`define-design` do.

### Phase 5 — Hand it over, simply

Don't run anything that hits the network or installs to disk — **offer** it, keeping `mobile/` as the
working directory (as one compound command, or via `npm --prefix mobile` — don't split a bare `cd`
from a later command, since shell `cd` doesn't persist across separate invocations). Close with the
plain-words preview path:

> *"Your mobile app is ready in the `mobile/` folder. To see it on your phone: run
> `cd mobile && npm install` (one time — this downloads the app's building blocks), then `npm run
> start` (or `npx expo start`) — it shows a QR code. Open the free **Expo Go** app on your phone and
> scan it; your app loads in a few seconds. No Mac or app-store setup needed. Prefer your computer?
> `npm run web` opens it in a browser. Want me to start it for you?"*

If they say yes, run the commands with `mobile/` as the working directory. Optionally offer
`npm --prefix mobile run typecheck` to check it over; offer to fix any type errors on the spot. If
offline, the app is still fully written — install and preview when back online.

## Re-running (incremental, never clobber)

If `mobile/` already exists, switch to **incremental mode**: read the existing `mobile/`, the latest
`raw/builds/` record, and `wiki/build.md`, then diff the current charter MVP against what's already
built. At the confirm gate, offer a small menu:
1. **Add / update screens** — only the deltas,
2. **Re-apply the theme** — from the current `wiki/design-system.md`,
3. **Both.**

Write **new** files freely; for any **existing** file, show the change as a diff and **confirm before
overwriting**. Each re-run writes a **new** `raw/builds/` record and updates the Mobile section of
`wiki/build.md` in place. If a prior build is partial/broken (missing spine files), offer a targeted
repair.

`build-mobile` **owns everything under `mobile/`, including its theme** — so a restyle is just a re-run
(option 2), not a job for `define-design` (which owns `aios/`).

## Rules & guardrails

- **Attended-only — never in `maintenance-loop`.** This skill writes project source and offers
  `npm install` (network + disk); it must never run unattended. It is built around the one confirm
  gate.
- **Tier 0 — no keys, no accounts, mock data.** v1 has no backend, auth, deploy, env, or secrets;
  nothing is collected in chat. **Installable app-store builds (EAS) + an Expo account are a later
  tier.** Scaffolding works fully offline (only the opt-in `npm install` needs the network — if
  offline, the app is still written; install later).
- **Stay scoped.** Honor `max_screens` and the charter's `Out`/`Later`; build the core slice and name
  what's deferred, rather than ballooning.
- **Be honest about what it is.** Every artifact (the `mobile/README.md`, `wiki/build.md`, the
  close-out) calls it a **themed mobile MVP with placeholder data, previewed via Expo Go** (not a
  store-published app), and names the later tiers (installable builds via EAS + a free Expo account,
  real data/accounts/backend, plus web and plugins are other slices).

## Output

A new `mobile/` folder (a runnable, themed Expo mobile MVP), an immutable `raw/builds/<date>-<slug>.md`
record tagged `target: mobile`, a created/updated `wiki/build.md` Mobile section (+ `wiki/index.md`
cross-links), one `change-log.md` line — and a QR-code path to preview it on a phone.
