# Idea Vetting — vet before you build

Two skills give a project's core idea a hard look *before* time goes into building it. They turn a
vague idea into (a) a brutal, decisive verdict and (b) — on request — a verified, multi-perspective
evidence briefing, both saved to the knowledge base.

## `roast` — the council + the Judge

`roast` convenes a **five-persona council** that attacks the idea from every angle in parallel, then
the running agent acts as the **Judge** and returns one decisive verdict.

- **The council (5 parallel agents):** the Contrarian (find the fatal flaw), the Expansionist (the
  10× upside), the Logician (first-principles, no web), the Researcher (real-world evidence, web), and
  the Buyer (role-plays the target customer). Each returns a stance, 3–5 sharp points, the one
  must-hear thing, and a 1–10 score.
- **The Judge (the running agent, not a 6th agent):** weighs the council, resolves the tension, folds
  in the economics, and returns **GO / RESHAPE / KILL** with confidence, the biggest risk and upside,
  a money read, and — the most important output — **the cheapest 48-hour test** to validate the
  riskiest assumption before building anything.

Triggers: "roast", "convene the council", "brutal/second opinion", "pressure/stress-test", "validate
this business idea", or `/roast <idea>`. Runs at **Tier 0** — no web, no keys (offline, the Researcher
reasons without sources and says so).

## `storm-research` — the verified briefing

`storm-research` runs Stanford's **STORM** method as a 4-phase pipeline:

1. **Five expert lenses** (Practitioner, Academic, Skeptic, Economist, Historian) research the topic
   in parallel, each citing real sources.
2. **Contradiction map** — where the lenses agree, where they clash, and the single question that
   would settle the biggest conflict.
3. **HTML synthesis** — a single self-contained briefing, cloned from `report-template.html` (the CSS
   is kept verbatim), with findings ranked by reliability.
4. **Adversarial peer review + primary-source verification** — it critiques its own draft, then spawns
   parallel agents that verify **every citation against its primary source** (CONFIRMED / PARTIALLY
   CONFIRMED / UNVERIFIED / FALSE), applies corrections, and fills a truthful verification banner.

**It requires the built-in web tools** (`WebSearch` / `WebFetch` — no API key). If web access is
unavailable it **refuses rather than fabricates**: no invented studies, numbers, or URLs, ever.

## How they work together

`roast` is the front door. After the verdict it offers to commission a `storm-research` briefing as
the evidence layer; on yes (and with web available) the briefing lands in the same run folder and the
Judge folds its findings into the verdict. `storm-research` also runs standalone for any topic.

## Where the artifacts land

Every run writes to a dated folder under `outputs/vetting/`:

```
outputs/vetting/<YYYY-MM-DD>-<slug>/
  roast-verdict.md        # the GO/RESHAPE/KILL verdict + council scores (if roasted)
  <slug>-briefing.html    # the verified STORM briefing (if storm ran)
```

`wiki/vetting.md` is the AI-written index of vetted ideas (idea · date · verdict · links), cross-linked
from `wiki/index.md`. Each run appends one attributed line to `outputs/change-log.md`. The template
ships only `outputs/vetting/.gitkeep`; real verdicts and briefings appear once you vet something.

## The "vet before you build" workflow

`define-project` offers a roast at its draft-confirm gate, so a charter can be pressure-tested before
it hardens; the charter records a one-line `## Vetting` pointer. You can also pressure-test any idea
on demand via `what-can-i-do` or by saying `/roast`.

## Provenance & credit

Both skills are embedded from packages shared by the community, kept faithful to their original design:

- **`roast`** — from the "make Claude Code a money-making partner" upgrades. Video:
  https://youtu.be/iTY8Q449YNQ
- **`storm-research`** — Stanford's STORM method as a self-contained Claude skill. Video:
  https://youtu.be/Tj3018n5MVg
