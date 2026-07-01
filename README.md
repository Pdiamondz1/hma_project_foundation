# Project Foundation

**A starter kit you copy to begin any new project — with a built-in "second brain" that
remembers and organizes everything you feed it, and a helper you talk to in plain English.**

Think of it as an empty, *smart* notebook for a new project. You add notes, files, and links
by just talking; it quietly files them away, keeps a tidy index, and even tidies and improves
itself over time. Use it for almost anything — a business idea, a research project, a web or
mobile app, a portfolio, or a growing collection of notes.

> 💡 **You don't need to be a programmer, and you don't need to know GitHub.** A free app called
> **Claude Code** does the technical parts for you. Start with **[Start here »](docs/START-HERE.md)**

---

## 🚀 Start here

Pick whichever fits you:

| You are… | Go to | What it's like |
|---|---|---|
| **New to this, or new to GitHub** | **[Start here](docs/START-HERE.md)** | The simplest path. No terminal, no commands — you install one app and just talk to it. |
| **Comfortable and want every step** | [New project walkthrough](docs/NEW-PROJECT-WALKTHROUGH.md) | The full hands-on guide: copy it, set it up, run the dashboard, pick options. |

Once you're set up, you can always type **"what can I do?"** and it'll show you a friendly menu.

> On this GitHub page, the green **Use this template** button (top of the page) makes your own
> copy. If you follow **[Start here](docs/START-HERE.md)**, the app can do that for you too.

---

## What you get

Everything below is built in from day one:

- 🧠 **A second brain** — everything you add is kept, organized, and searchable.
- 🔎 **Auto-research** — it can pull in your notes, files, and sources for you.
- 📈 **Self-learning** — repeated work turns into reusable, saved know-how.
- 🩹 **Self-healing** — it spots and proposes fixes, and **always asks before** changing anything important.
- 💡 **Proactive advisor** — it reads your usage data and proactively proposes improve, scale, and maintain ideas for you to approve (see [metrics feed](docs/METRICS-FEED.md)).
- 🧪 **Vetted before you build** — say **"/roast"** and a council of expert "advisors" pressure-tests your idea, returns a clear **go / reshape / stop** verdict plus the cheapest way to test it, and can back it with a fact-checked research briefing — so you don't pour time into the wrong thing (see [idea vetting](docs/IDEA-VETTING.md)).
- 🎨 **Designed, not generic** — a guided design step (Google Stitch–aware) captures your look-and-feel so what you build looks intentional, not AI-default.
- 🛠️ **Built for you** — when you're ready, say **"build my app"** (web), **"build my mobile app"** (phone), or **"build my browser extension"** (Chrome) and it scaffolds a working, on-brand first version in an `app/`, `mobile/`, or `plugin/` folder — mock data first, no coding (see [web](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md) · [extension](docs/BUILD-PLUGIN.md)).
- 🚀 **Or do it all in one go** — say **"build my whole project"** and it grills you once, vets + researches the idea, confirms one plan, then builds it end-to-end hands-off — for **one platform or several** (web + phone + extension from a single run) — pausing only if the idea gets a "stop" verdict, then proposing what to build next (see [autopilot](docs/AUTOPILOT.md)).
- 🤖 **Sharp under the hood** — the grunt work runs on a tuned fleet of specialist subagents that ships with the template (the right model per job, read-only by default), so it's cheaper, safer, and consistent (see [subagents](docs/SUBAGENTS.md)).

---

## 📚 Documentation

Every link below is clickable:

| Guide | Read it for… |
|---|---|
| [Start here](docs/START-HERE.md) | The simplest, plain-language way to begin. |
| [New project walkthrough](docs/NEW-PROJECT-WALKTHROUGH.md) | The full step-by-step — including how to pull in updates later. |
| [Using this for any project](docs/USING-THIS-FOR-ANY-PROJECT.md) | The mental model + how far to take it (the "tiers"). |
| [Building your app](docs/BUILD-APP.md) | How the system builds your app for you. |
| [Building your mobile app](docs/BUILD-MOBILE.md) | How the system builds a phone app for you. |
| [Building your browser extension](docs/BUILD-PLUGIN.md) | How the system builds a Chrome extension for you. |
| [Make data real](docs/BUILD-BACKEND.md) | Add a real Supabase backend + sign-in to your built app. |
| [Path to production](docs/PATH-TO-PRODUCTION.md) | The ordered map from prototype to a shippable product. |
| [Extending](docs/EXTENDING.md) | Adding your own skills, sources, tools, and pages. |
| [Subagents](docs/SUBAGENTS.md) | The tuned agent fleet that does the grunt work — and how to add your own. |
| [Autopilot](docs/AUTOPILOT.md) | Describe your goal once — it vets, designs, and builds end-to-end. |
| [Scheduling](docs/SCHEDULING.md) | Letting it run and improve itself on a schedule. |
| [Design spec](docs/superpowers/specs/2026-06-29-hma-project-foundation-design.md) | The full design, for the curious. |
| [CLAUDE.md](CLAUDE.md) | The rules the AI follows every session. |

---

## How it works (in plain terms)

1. You drop something in — a file, a note, a link.
2. It saves the original, untouched, in a safe folder.
3. It writes a short, organized summary so you can find it later.
4. Now and then it reviews everything, fixes small things, and **asks you** before bigger changes.

Three folders do the work (all clickable):

- [`raw/`](raw) — your originals, never changed.
- [`wiki/`](wiki) — the AI-written, organized index of your originals.
- [`outputs/`](outputs) — reports and the "please approve this" lists.

---

## Make it your project

This is meant to become *your* thing — a web or mobile app, a workflow, a portfolio or data
manager, a research notebook. The natural order is **define it → vet it → design it → build it**:

1. **Define it** — run **[`define-project`](.claude/skills/define-project/SKILL.md)**, a short discovery interview that captures your goal, audience, and success in `wiki/charter.md` so the rest of the system has a north star.
2. **Vet it** — want a gut-check before you build? Say **"/roast"** and **[`roast`](.claude/skills/roast/SKILL.md)** convenes a council that pressure-tests the idea and gives a clear **go / reshape / stop** verdict, with an optional fact-checked briefing — so you only build what's worth building.
3. **Design it** — run **[`define-design`](.claude/skills/define-design/SKILL.md)** to capture how it should *look* — a design system in `wiki/design-system.md` so your UI isn't generic.
4. **Build it** — when the plan and look are set, run **[`build-app`](.claude/skills/build-app/SKILL.md)** (or just say "build my app") and it scaffolds a working, themed first version of your web app into an `app/` folder, runnable with `npm run dev`. Prefer a phone app? Run **[`build-mobile`](.claude/skills/build-mobile/SKILL.md)** ("build my mobile app") for an Expo app in a `mobile/` folder you preview on your phone via a QR code. Prefer a browser extension? Run **[`build-plugin`](.claude/skills/build-plugin/SKILL.md)** ("build my browser extension") for a themed Manifest V3 extension in a `plugin/` folder you load into Chrome via Developer mode. All three are front-end MVPs with placeholder data — real data, accounts, and deployment come later. See [web](docs/BUILD-APP.md) · [mobile](docs/BUILD-MOBILE.md) · [extension](docs/BUILD-PLUGIN.md).

The easiest route is to let the **setup** step do it for you
(it's part of [Start here](docs/START-HERE.md)). To go deeper, see
[Using this for any project](docs/USING-THIS-FOR-ANY-PROJECT.md) and [Extending](docs/EXTENDING.md).

Smarter features are **optional and off by default** — it works fully with no keys and no extra
setup. Turn on better search, a live chat assistant, or cloud storage only if and when you want
them. Each is explained in [Using this for any project](docs/USING-THIS-FOR-ANY-PROJECT.md).

---

## 🔧 Under the hood (for the curious)

The technical reference — skip this if you just want to use it.

| Path | What it is |
|---|---|
| [`raw/`](raw) | Original, immutable ingested assets. Never edited by hand or AI. |
| [`wiki/`](wiki) | AI-written table of contents over `raw/`. Never hand-edited. |
| [`outputs/`](outputs) | Generated reports + the self-improvement approval queues. |
| [`.claude/skills/`](.claude/skills) | The skills that grow and maintain the knowledge base. |
| [`aios/`](aios) | The file-first web console (`cd aios && npm install && npm run dev`). |
| [`docs/`](docs) | All the guides + the design spec. |
| [`CLAUDE.md`](CLAUDE.md) | The operating rules the AI loads every session. |

**Build status** — all phases shipped:

- Phase 0 — knowledge foundation + `add-new-resource` ✅
- Phase 1 — ingest/sync skills + `data-ingestion` orchestrator ✅
- Phase 2 — `improve-system` + `human-improve-system` (self-healing) ✅
- Phase 3 — the `aios/` web console (file-first) ✅
- Phase 4 — optional intelligence layer (semantic search + Anthropic agent) ✅
- Phase 5 — guided `setup-project` + autonomous `maintenance-loop` (scheduling) ✅
- Phase 6 — `advise-project` proactive advisor (propose-only, rides `maintenance-loop` tick) ✅
- Phase 7 — optional `codex-review` cross-model code-review gate (graceful-off) ✅
- Phase 8 — `define-project` discovery interview → project charter (`wiki/charter.md`) ✅
- Phase 9 — `define-design` design-discovery + design system (`wiki/design-system.md`, Google Stitch–aware) ✅
- Phase 10 — `roast` + `storm-research` idea-vetting gate (vet before you build) ✅
- Phase 11 — `build-app`: turn the charter + design system into a working, themed web app (`app/`) ✅
- Phase 12 — `build-mobile`: turn the charter + design system into a themed Expo phone app (`mobile/`) ✅
- Phase 13 — `build-plugin`: turn the charter + design system into a themed Manifest V3 browser extension (`plugin/`) ✅
- Phase 14 — tuned `.claude/agents/` subagent fleet + `docs/SUBAGENTS.md` policy (model-mix + least-tools) ✅
- Phase 15 — `autopilot`: describe once → grill + vet + research + confirm → hands-off design+build (the capstone) ✅
- Phase 16 — `autopilot` multi-target: one grill builds any combination of web + mobile + plugin in a single run ✅
- Phase 17 — `autopilot` loop-aware: after building, it proposes ranked "what's next" ideas (propose-only) ✅
- Phase 18 — `build-backend`: upgrades the built web app to real data — Supabase schema + graceful-off data layer + auth + go-live checklist (offline scaffold; keyed go-live stays the user's) ✅
