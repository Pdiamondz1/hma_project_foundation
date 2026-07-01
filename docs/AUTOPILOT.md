# Building your whole project at once — the `autopilot` skill

`autopilot` is the capstone. Instead of running `define-project`, `roast`, `define-design`, and a
`build-*` skill one at a time — each with its own questions — you describe your goal **once**, get grilled
**once**, confirm **one** plan, and it builds the whole thing hands-off.

## How it works

1. **You describe your goal** — one line, or just start it and it asks.
2. **It grills you once** — a single, fast interview (what you're building, who it's for, how it should
   look, and which platforms — a web app, a phone app, a browser extension, **or any combination**),
   always offering options + a recommended pick so it moves quickly.
3. **It vets and researches — upfront** — it runs the `roast` council for a **go / reshape / stop**
   verdict and (when online) a fact-checked research briefing, *before* you commit. If the idea gets a
   **stop (KILL)** verdict, it pauses and asks you what to do.
4. **It shows you one plan** — already vetted and researched — and asks once: *"Build this?"*
5. **It builds hands-off** — designs it once, then scaffolds **each app you picked** (`app/` and/or
   `mobile/` and/or `plugin/`) — no more questions.
6. **It hands you a decision log** — every judgment call it made, in `outputs/autopilot/<date>-<slug>/`,
   for you to review after (not before).
7. **It tells you what's next** — once it's built, it files a ranked list of next moves (from your deferred
   "later" items, the assumptions it flagged, and the next tiers) to `outputs/ideas-*.md` — for you to
   approve; nothing is applied.

## What you end up with

The same things the individual skills make — your charter, a vetting verdict, a design system, and a
built app (or **several — one per platform you picked**) with mock data — plus the decision log. Preview
each app with the one command it prints.

## The one pause

It only stops mid-run for a **stop (KILL)** verdict, and that happens **before** you confirm the plan — so
once you say "go," it runs to the end. Everything else it decides on its own and logs for you.

## What it is (and isn't)

- **User-started, then hands-off.** You start it and confirm the plan; it never runs on its own in the
  background. It is **not** part of the scheduled maintenance loop.
- **Tier 0** — mock data, no keys, no accounts. Real data, accounts, deployment, and app-store / Web-Store
  publishing are later tiers (run the individual skills for those).

Optionally, autopilot can make the built web app **backend-ready** in the same hands-off run: set `wire_backend_after_build: true` in `.claude/skills/autopilot/config.json` and, after the build, it runs `build-backend` (offline, graceful-off — no keys) so you finish with a real schema + data layer + sign-in scaffolded, and a go-live checklist. It's **off by default** (it adds sign-in, which changes the app's shape) and autopilot still never touches a key. See `docs/BUILD-BACKEND.md`.

- **It reuses your existing skills** — `define-project`, `roast`, `storm-research`, `define-design`, and
  `build-app`/`mobile`/`plugin` — driving each in an automatic mode. Their normal, one-at-a-time behavior
  is unchanged; autopilot just chains them for you, and hands the grunt work to the tuned
  [`.claude/agents/`](SUBAGENTS.md) fleet.

## Re-running

Run it again any time. It resumes a stopped run, or offers to reuse / refine / restart what's already
there — it never silently overwrites your work.

## The journey it completes

define → vet → design → build — now in one go. See [building your app](BUILD-APP.md) and
[the subagent fleet](SUBAGENTS.md) it runs on.
