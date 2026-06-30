# Scheduling the self-improving loop

The foundation's "self-healing / auto-research" promise only pays off if the loop runs
**on its own**. This doc shows how to make that happen with **Claude Code Routines** — the
recommended, native way — plus the two alternatives and when you'd reach for them.

## The thing that gets scheduled

You don't schedule the individual skills; you schedule one portable tick:

> **`maintenance-loop`** — runs `data-ingestion` (gather everything new), then
> `improve-system` (one self-improvement pass), unattended, and appends a run block to
> `outputs/runs/maintenance-loop.md`.

Starting with Phase 6, the same weekly tick also runs `advise-project`, so proactive project ideas accumulate on the same schedule without any extra configuration.

It is safe to fire with no human present: `improve-system` only ever applies the low-risk
AUTO-APPROVE bucket and items you already checked off; everything structural or
skill-related is *queued* for sign-off, never auto-applied. See
`.claude/skills/maintenance-loop/SKILL.md`.

## Recommended: a Claude Code Routine

A Routine is a scheduled trigger that fires a prompt into a Claude Code session on a cron
schedule — so the skills run exactly as designed, with full access to your local context
(e.g. `sync-claude-sessions` reading `~/.claude/projects/`).

**Register it** by asking Claude Code to create a routine with these parameters:

| Field | Value |
|---|---|
| **name** | `Weekly maintenance loop` |
| **cron** | `0 9 * * 1` (Mondays, 09:00 local — adjust to taste; minimum interval is hourly) |
| **prompt** | `Run the maintenance-loop skill.` |
| **mode** | a fresh session per firing (clean run each week) |

Either let the **`setup-project`** skill offer to register it for you at the end of setup,
or just say to Claude Code: *"Create a weekly routine, Mondays at 9am, that runs the
maintenance-loop skill."* It will use the routine/trigger mechanism to create it.

**Adjust, pause, or remove it** the same way — ask Claude Code to list your routines and
update the cron, disable, or delete the one named `Weekly maintenance loop`. Disabling keeps
it stored but stops it firing; deleting removes it.

**Cadence guidance.** Weekly is a good default for most projects. Go daily if you ingest
fast-moving sources (active Slack, frequent sessions); go monthly for a slow research vault.
Whatever you pick, the loop is incremental — it never re-ingests what a cursor has passed.

**A note on when it fires.** A Routine runs in your Claude Code environment, so that
environment needs to be available when the cron fires. If your machine is asleep at the
scheduled time, the run waits for the next opportunity rather than running on a powered-off
box — if you need a run that survives reboots and closed sessions, use Task Scheduler below.

## Alternatives

- **Windows Task Scheduler (robust, OS-level).** A scheduled task runs Claude Code headless
  (`claude -p "Run the maintenance-loop skill."`) on a timer, firing across reboots without
  an open session. Trade-off: Windows-only and it depends on the skills' unattended mode
  (which they support — no interview, skip unconfigured sources). Reach for this when you
  want the loop to run regardless of whether Claude Code is open.
- **GitHub Actions (hands-off, but partial).** A scheduled workflow can run `improve-system`
  over the repo's own content. Trade-off: CI has **no** access to your local
  `~/.claude/projects/` or connected sources, so the *sync* skills can't fully run there —
  it maintains the wiki/outputs it can see, but doesn't ingest your ecosystem. Useful as a
  repo-hygiene backstop, not a replacement for a local Routine.

## Why no trigger ships in the repo

This is a template that gets cloned. A baked-in Routine would be bound to one account and
one environment, so it wouldn't travel. Instead the repo ships the portable `maintenance-loop`
tick and this doc, and `setup-project` offers to register the Routine in *your* environment
on an explicit yes. That keeps the clone generic and puts you in control of the one
side-effectful, account-bound step.
