# Project Foundation

A reusable, self-improving **project foundation** you clone to start new work with four
capabilities built in from day one:

- **2nd-brain knowledge** — a disciplined `raw/ → wiki/ → outputs/` knowledge base
- **Auto-researching** — sync skills that pull in sessions, ecosystem data, and curated content
- **Self-learning** — repeated work is distilled into reusable wiki pages and skill candidates
- **Self-healing** — an `improve-system` loop that proposes fixes behind human approval gates

It ships with a **file-first AIOS web console** (`aios/`) that surfaces the knowledge
base and the approval queues — no database required. An **optional intelligence layer**
(semantic search + an Anthropic agent with an extensible tool registry) is opt-in and
graceful: off by default, no keys needed; switch it on per project.

## Layout

| Path | What it is |
|---|---|
| `raw/` | Original, immutable ingested assets. Never edited by hand or AI. |
| `wiki/` | AI-written table of contents over `raw/`. Never hand-edited. |
| `outputs/` | Generated reports + the self-improvement approval queues. |
| `.claude/skills/` | The skills that grow and maintain the knowledge base. |
| `aios/` | The file-first AIOS web console (`cd aios && npm install && npm run dev`). |
| `docs/superpowers/specs/` | The design spec. |
| `CLAUDE.md` | The load-bearing operating rules (read this first). |

## How knowledge flows

1. You drop something in (a file, a session, a link).
2. A skill copies the original, unaltered, into the right `raw/` folder.
3. The skill writes/updates a `wiki/` page that indexes and references it.
4. `improve-system` periodically proposes improvements, routed through approval gates.

## Quickstart

This repo is the template. To use it for a new project, clone it and start adding
knowledge. In Claude Code, run the **`add-new-resource`** skill and follow the interview
to capture your first asset. The operating rules in `CLAUDE.md` load automatically every
session.

## Make it your project

This foundation is meant to be cloned and specialized into anything — a web/mobile app, a
workflow, a portfolio or data manager, a research second-brain. Start with
**`docs/USING-THIS-FOR-ANY-PROJECT.md`** (the mental model + the capability/infra ladder)
and **`docs/EXTENDING.md`** (concrete "add a skill / source / agent tool / surface / store"
steps).

The intelligence layer is **opt-in and graceful**: with no `aios/.env` the console runs
zero-config (file-first + keyword search); add an `ANTHROPIC_API_KEY` for the live agent,
embeddings for semantic search, or Supabase for cloud/multi-user — each degrades gracefully
if absent.

## Status

Built in phases (see the spec):

- **Phase 0 — knowledge foundation + `add-new-resource`** ✅ in place
- **Phase 1 — ingest/sync skills + `data-ingestion` orchestrator** ✅ in place
- **Phase 2 — `improve-system` + `human-improve-system` (self-healing)** ✅ in place
- **Phase 3 — the `aios/` web console (file-first)** ✅ in place
- **Phase 4 — optional intelligence layer (semantic search + Anthropic agent, local-first)** ✅ in place
