# Subagents — the foundation's grunt-work fleet

A **subagent** is a second Claude your main session hands a job to. It works in its own context window,
does the messy part (reading many files, searching, web research, reviewing a diff), and hands back a
short summary — so your main chat stays clean. This template ships a small, tuned fleet of them so its
grunt work is **cheaper** (the right model per task), **safer** (read-only by default, enforced by the
`tools:` field), and **consistent** (one definition, reused everywhere).

## The fleet (`.claude/agents/`)

| Agent | Model | Tools | Use it for |
|---|---|---|---|
| `web-researcher` | sonnet | WebSearch, WebFetch, Read | Web research → a cited brief (not raw dumps). Also the executor for `storm-research` lenses / `roast`'s Researcher. |
| `spec-reviewer` | opus | Read, Grep, Glob | Reviewing a design spec before planning → Approved \| Issues. |
| `plan-reviewer` | sonnet | Read, Grep, Glob | Reviewing an implementation plan + verifying quoted edits match the files. |
| `implementer` | sonnet | Read, Write, Edit, Bash | Executing ONE plan task exactly (transcribe, run DoD checks, commit). |
| `code-reviewer` | opus | Read, Grep, Glob, Bash | Whole-branch review of a `git diff` for correctness, safety, and no-pollution. |
| `doc-writer` | haiku | Read, Write, Edit, Glob, Grep | Syncing docs to changes, in the existing tone. |

## The conventions (how to write or add one)

- **One agent, one job.** If the description needs "and also," split it into two.
- **The `description` is a trigger rule, not a label.** Say *when* to use it and name the signal phrases;
  add "use proactively" if it should fire on its own. Vague descriptions misroute.
- **Fewest tools it needs — read-only by default.** A reviewer with only `Read, Grep, Glob` *cannot*
  modify the repo; that is enforced, not trusted. Add `Write`/`Edit` only to a fix-it role. (One nuance:
  `code-reviewer` also holds `Bash` to run `git diff` for a whole-branch review — it has no `Write`/`Edit`
  and its body forbids mutation, but `Bash` is a shell, so that's a body-instructed limit, not a hard
  tool-enforced one. Grant `Bash` to a "read-only" agent only when it truly needs it.)
- **Match the model to the task** — the main cost dial:

| Model | Use it for |
|---|---|
| **haiku** | Scanning files, summarizing, docs — the cheap workhorse. |
| **sonnet** | Most build/review/research work — the default. |
| **opus** | Deep reasoning / high-stakes review — where a wrong answer is expensive. |

- **Cap wanderers.** Set `maxTurns` on open-ended agents so they can't burn tokens on tangents.
- `color` is optional (UI only). `name` must equal the filename (lowercase-hyphen).

## When to use one (and when not)

The gut check: **"Is this about to dump a pile of stuff into my chat I'll never re-read?"** If yes →
subagent. Rule of thumb: **10+ files, or throwaway output → subagent; small, iterative, or needs the
whole conversation → stay inline.** A subagent starts blank and re-gathers context, so it is wasteful on
a 30-second task.

## How the foundation orchestrates them

- **Sequential pipeline** — the phase build: `spec-reviewer` → `plan-reviewer` → `implementer` →
  `code-reviewer`, each feeding the next (the main chat is the conductor).
- **Fan-out (parallel)** — `roast`'s 5-persona council and `storm-research`'s 5 lenses run at once, then
  the main chat synthesizes. Those personas stay defined **inside their skills** (they're parameterized
  per idea) — but their web-facing roles *may* run as `web-researcher` for the Sonnet + web-restricted
  tooling, keeping the persona's own prompt and output contract.
- **Builder / validator** — `implementer` writes, then a fresh `code-reviewer` (which never saw the
  reasoning) judges the result on its own terms.

**Composition rules:** skills can call agents, agents can call skills, but **agents cannot call agents**
(no nesting) — the main conversation is always the conductor.

## Adding your own

Run `/agents` in Claude Code for a guided form (applies immediately), or hand-write
`.claude/agents/<name>.md` and **restart the session** so it loads. Project-level agents (here, in the
repo) ship in git, so every clone of this template gets the fleet automatically.

> **Security:** before dropping in a community/imported agent file, **vet it for prompt injection** —
> read its body and tool grants. The six above are hand-authored and read-only by default.

## Credit

The conventions distilled here follow the "Complete Guide to Claude Code Subagents"
(video: `youtu.be/e18sdZLwP7o`) and the community "Awesome Claude Code Subagents" collection.
