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

Four things, built in from day one:

- 🧠 **A second brain** — everything you add is kept, organized, and searchable.
- 🔎 **Auto-research** — it can pull in your notes, files, and sources for you.
- 📈 **Self-learning** — repeated work turns into reusable, saved know-how.
- 🩹 **Self-healing** — it spots and proposes fixes, and **always asks before** changing anything important.
- 💡 **Proactive advisor** — it reads your usage data and proactively proposes improve, scale, and maintain ideas for you to approve (see [metrics feed](docs/METRICS-FEED.md)).

---

## 📚 Documentation

Every link below is clickable:

| Guide | Read it for… |
|---|---|
| [Start here](docs/START-HERE.md) | The simplest, plain-language way to begin. |
| [New project walkthrough](docs/NEW-PROJECT-WALKTHROUGH.md) | The full step-by-step — including how to pull in updates later. |
| [Using this for any project](docs/USING-THIS-FOR-ANY-PROJECT.md) | The mental model + how far to take it (the "tiers"). |
| [Extending](docs/EXTENDING.md) | Adding your own skills, sources, tools, and pages. |
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
manager, a research notebook. The easiest route is to let the **setup** step do it for you
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
