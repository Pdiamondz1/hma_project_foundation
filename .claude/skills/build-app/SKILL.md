---
name: build-app
description: Use when someone asks to "build my app", "build it", "make the app", "scaffold the app", "turn my idea into a working app", or says "/build-app". Turns the project's charter (the MVP scope) + design system (the theme) into a working, themed front-end web app in a new top-level app/ folder, runnable with `npm run dev`. Reads wiki/charter.md, wiki/design-system.md, and the latest outputs/vetting/ verdict; one screen-plan confirm gate; Tier 0 (mock/local data — no backend, auth, deploy, or keys). Attended-only — never runs in the maintenance loop. Re-runnable: adds screens incrementally and never overwrites a file without asking. Zero-argument safe.
argument-hint: "[what to build, or leave blank to use your charter]"
---

# build-app

The last mile. The foundation already helps a non-technical user get clear on *what* they're building
(`define-project` → `wiki/charter.md`), *whether it's worth building* (`roast`/`storm-research` →
`outputs/vetting/`), and *how it should look* (`define-design` → `wiki/design-system.md`). This skill
turns those three north-stars into an actual, working, on-brand **web app** they can open in a
browser — without making them figure out any of the building themselves.

What it produces: a new top-level **`app/`** folder — its own minimal Vite + React + TypeScript +
Tailwind project (the same proven stack as the `aios/` console), themed from the design system, with a
screen for each item in the charter's MVP, wired to **mock/local data**. It runs with `npm run dev`.
It is a **front-end MVP with placeholder data** — no backend, accounts, or deployment (those are later
tiers).

## When to use

When the user says "build my app", "build it", "make/scaffold the app", "turn my idea into a working
app", or `/build-app`. Also offered by `what-can-i-do`, by `setup-project` once a charter + design
exist, and pointed to by `advise-project` for a GO-vetted idea. It is **attended** — it asks one
confirming question before building — and **never runs in the unattended `maintenance-loop`**.

## Configuration

Read `.claude/skills/build-app/config.json` (all values default; never block on absence):
- `app_dir` (default `"app"`) — where the app is written.
- `dev_port` (default `5174`) — the app's dev-server port, deliberately different from the AIOS
  console's so both can run at once.
- `max_screens` (default `6`) — the cap on screens built in one pass (the runaway-scope guard).
- `include_react_query` (default `false`) — mock data needs no query cache; leave off for v1.

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
     declined, proceed with the default tokens already in `aios/src/index.css` and say so plainly:
     *"I'll use a clean default theme — run `define-design` any time and I'll re-theme the app."*
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
4. **Existing `app/` →** switch to **incremental mode** (see *Re-running*).

### Phase 1 — Derive the screen plan

From the charter's **In / MVP** list, derive a **small** set of screens/routes — each with the
components it needs and the mock entities it shows. Use `Purpose`/`Audience` to choose a layout
archetype (a **dashboard**, a **list + detail**, a **form-centric** tool, or a **landing + content**
site) and the design system's **Voice** for the wording.

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
- the **stack** and that it lives in `app/`, runnable with `npm run dev`,
- anything **deferred** (the core-slice note), and
- the **vetting status** folded in.

Ask: *"Build this? I'll create the `app/` folder and you'll be able to preview it.
(yes / tweak something)"* On "tweak", revise and show again. **No per-screen interrogation.**

### Phase 3 — Scaffold + theme `app/`

Build **in-session, in order** (the scaffold is mostly shared spine with hard dependencies — not
something to fan out to parallel agents). Create `app/` as its own minimal project:

```
app/
├── package.json          # own; shared subset of aios majors (see below). Scripts: dev/build/preview/typecheck
├── vite.config.ts        # plain Vite + @vitejs/plugin-react + "@" alias; NO fileApi middleware; server.port = dev_port
├── index.html            # <html class="dark"> if dark-first; <title> + meta from charter
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json   # copied from the aios shape
├── postcss.config.js     # tailwind + autoprefixer (identical to aios)
├── tailwind.config.ts    # copied from aios (resolves CSS vars; no hardcoded colors)
├── .gitignore            # node_modules, dist
├── README.md             # how to run + "themed front-end MVP, mock data" + pointer to the raw/builds record
├── public/               # optional favicon/emblem
└── src/
    ├── main.tsx          # mirrors aios main.tsx (createRoot + import "./index.css")
    ├── App.tsx           # BrowserRouter + a <Route> per screen under a shared AppShell
    ├── index.css         # 13 base tokens + contrast pairs + --radius + shadows, FROM the design system
    ├── vite-env.d.ts
    ├── lib/utils.ts      # the cn() helper (copied)
    ├── config/app.ts     # app name/tagline from the charter (words only)
    ├── components/ui/    # ONLY the primitives used (button, card, input, badge…) — copied
    ├── components/layout/AppShell.tsx   # themed nav/header
    ├── pages/            # one file per derived route
    └── data/             # typed mock fixtures + getX()/listX() accessors — no fetch, no env, offline
```

**Pin the stack from `aios/`, don't hardcode.** Read `aios/package.json` and pin the **same major
versions** for the shared subset: `react`, `react-dom`, `react-router-dom`,
`class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `lucide-react`; dev:
`vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `autoprefixer`, `postcss`, the `@types/*`,
and `@tailwindcss/typography` only if the design uses prose. **Exclude** the KB-console-only deps:
`@anthropic-ai/sdk`, `@supabase/supabase-js`, `gray-matter`, `react-markdown`, `remark-gfm`, `vitest`,
and `@tanstack/react-query` (unless `include_react_query` is true). Scripts: `dev`, `build`, `preview`,
`typecheck` only.

**Theme it the same way `define-design` themes the console.** Write the 13 base tokens for `:root` and
`.dark` into `app/src/index.css`, **re-derive and eyeball the contrast pairs** (`--*-foreground`,
`--popover*`) so text stays legible, and set `--radius` + the shadow vars from *Typography & shape*.
Copy `tailwind.config.ts` unchanged (it only reads the CSS vars). Default to the Inter/system font
stack; only add a webfont `<link>` if the design names one. Honor "dark-first" for the `<html class>`
(default dark, like `aios/`).

**Mock data, not a backend.** Put a typed fixture module per entity in `src/data/` (plain arrays +
`getX()`/`listX()` accessors), imported directly by pages. No fetch, no env, no network. Every screen
is clearly placeholder-powered; say so in `app/README.md`.

**Routes & components.** `App.tsx` mirrors `aios/src/App.tsx` (a `<Route>` per screen under a shared
`AppShell`). Reuse the shadcn-style `cva` primitives (button, card, input, badge…) so the look matches
the foundation's quality bar. Copy only the primitives you actually use.

### Phase 4 — Record it (provenance)

The **code** lives in `app/` (a build target outside the knowledge folders, like `aios/`). The
**record** lands in the knowledge base:
- **`raw/builds/<YYYY-MM-DD>-<slug>.md`** *(immutable, append-only; new dated file per build, `-2` for
  same-day re-runs)* — opens with RAG frontmatter (`title`/`source_id`/`path`/`tags`/`updated`), then
  captures: the confirmed screen plan, components, mock entities, the theme source, the charter
  version, the vetting verdict referenced (and any KILL override), the pinned stack/versions, and
  anything deferred.
- **`wiki/build.md`** *(AI-written index; created on the first build, like `roast` creates
  `wiki/vetting.md`; opens with the standard RAG frontmatter — see `docs/WIKI-FRONTMATTER.md`)* — the
  current app summary, the route list, where it lives (`app/`), the one-command run instructions, the
  theme source, and links to the `raw/builds/` record(s), `wiki/charter.md`, and
  `wiki/design-system.md`. Cross-link it from `wiki/index.md` (pinned under "By area" + a "Recent
  additions" line) on first creation. Reference the raw record — never paste app code.
- **`outputs/change-log.md`** — append one attributed line (newest-at-top, as the sibling skills write
  it): `- <YYYY-MM-DD> — build-app — scaffolded web app (app/) from wiki/charter.md MVP; themed from wiki/design-system.md — applied`

`improve-system` stays the single applier for the self-improvement lanes — this skill only writes its
own `applied` line, exactly as `define-project`/`define-design` do.

### Phase 5 — Hand it over, simply

Don't run anything that hits the network or installs to disk — **offer** it. Close with the
plain-words preview path:

> *"Your app is ready in the `app/` folder. To see it: open a terminal here and run
> `cd app && npm install` (one time — this downloads the app's building blocks), then `npm run dev`,
> and open the link it prints (http://localhost:<dev_port>). Want me to start it for you?"*

If they say yes, run the install and dev-server commands **with `app/` as the working directory** —
as one compound command (`cd app && npm install && npm run dev`) or via `npm --prefix app install`
then `npm --prefix app run dev`. Don't split a bare `cd app` from a later `npm run dev`: shell
`cd` does not persist across separate command invocations, so the dev server would otherwise start
from the repo root and fail. Optionally offer `npm --prefix app run typecheck` to check it over, and —
if a browser is available — a screenshot; offer to fix any type errors on the spot. The app runs on a
different port than the console, so both can run at once.

## Re-running (incremental, never clobber)

If `app/` already exists, switch to **incremental mode**: read the existing `app/`, the latest
`raw/builds/` record, and `wiki/build.md`, then diff the current charter MVP against what's already
built. At the confirm gate, offer a small menu:
1. **Add / update screens** — only the deltas,
2. **Re-apply the theme** — from the current `wiki/design-system.md`,
3. **Both.**

Write **new** files freely; for any **existing** file, show the change as a diff and **confirm before
overwriting**. Each re-run writes a **new** `raw/builds/` record and updates `wiki/build.md` in place.
If a prior build is partial/broken (missing spine files), offer a targeted repair.

`build-app` **owns everything under `app/`, including its theme** — so a restyle is just a re-run
(option 2), not a job for `define-design` (which owns `aios/`).

## Rules & guardrails

- **Attended-only — never in `maintenance-loop`.** This skill writes project source and offers
  `npm install` (network + disk); it must never run unattended. It is built around the one confirm
  gate.
- **Tier 0 — no keys, mock data.** v1 has no backend, auth, deploy, env, or secrets; nothing is
  collected in chat. Scaffolding works fully offline (only the opt-in `npm install` needs the
  network — if offline, the app is still written; install later).
- **Stay scoped.** Honor `max_screens` and the charter's `Out`/`Later`; build the core slice and name
  what's deferred, rather than ballooning.
- **Be honest about what it is.** Every artifact (the `app/README.md`, `wiki/build.md`, the close-out)
  calls it a **themed front-end MVP with placeholder data**, and names the later tiers (real
  data/accounts/deploy, mobile, plugins) so no one mistakes it for a finished product.
- **Web only (v1).** Mobile and plugins are later phases.

## Output

A new `app/` folder (a runnable, themed front-end MVP), an immutable `raw/builds/<date>-<slug>.md`
record, a created/updated `wiki/build.md` (+ `wiki/index.md` cross-links), one `change-log.md` line —
and a one-command path to preview it.

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
