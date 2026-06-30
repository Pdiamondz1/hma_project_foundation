---
name: define-project
description: Discovery-interview skill that grills the user — one question at a time, with proposed options and a recommended default whenever they're unsure — to extract their project's purpose, audience, success criteria, scope, and constraints, then writes a project charter to wiki/charter.md. Re-runnable for pivots; the charter becomes the north star that every other skill anchors to. Zero-argument safe: run with no arguments and it opens the interview.
---

# define-project

The project-clarity interview. Before the knowledge base can be useful, the project it
serves needs to be *defined* — not assumed. This skill asks the questions a good discovery
workshop asks, proposes concrete options when the user is vague or stuck, and writes a
clear charter that every other skill (advise-project, improve-system, sync skills) can
read as its north star.

It is **interview-first**: run it with no arguments and it opens the conversation.
It is **propose-don't-just-ask**: the moment an answer is thin or "I don't know," the
skill offers 2–4 example options plus a recommended default, so the user is always
picking/approving — never the bottleneck.

## When to use

- **First run on a fresh clone** — before adding resources or scheduling maintenance,
  define what the project *is*.
- **On a pivot** — re-run any time the goal, audience, or scope materially changes. The
  skill reads the existing `wiki/charter.md` for context, focuses the interview on what
  is changing, and updates the charter in place.
- **When other skills lack direction** — if `advise-project` ideas feel generic or
  `improve-system` proposals miss the point, run `define-project` first to give the
  system a clear target.

## Inputs (interview first; zero-argument safe)

No arguments needed. Run the skill and it opens the discovery interview immediately.
Never block waiting for a file or a config value; everything is gathered through
conversation.

On a **re-run (pivot)**, read `wiki/charter.md` before the first question so the
interview can use the existing answers as defaults and focus only on what has changed.

## Procedure

### Phase 1 — Discovery interview

#### Opening

Open warmly and set expectations in a single message before the first question. Something
like:

> "I'll ask a few questions to get your project clear — answer however you can. If
> you're unsure about anything, I'll suggest some options and a recommendation, so you
> can pick and tweak rather than stare at a blank answer."

#### Lost-user anchor (use if the user has no idea at all)

If the very first response makes it clear the user doesn't know where to start, offer a
short menu of **starter archetypes** to react to — for example:

- Personal knowledge vault (notes, research, ideas — for your own use)
- Small web or mobile app (a product for others to use)
- Portfolio or showcase (present your work or brand)
- Research project (explore a topic, collect sources, produce a report)
- Business or idea tracker (track a venture, side project, or startup)

Ask: "Which of these is closest to what you have in mind — or describe it in your own
words?" Then build every follow-up from the archetype they pick.

#### One question at a time — five dimensions in order

Walk these five dimensions **in order, one question per message**. Never bundle multiple
questions in one message.

**1. Purpose and problem**
Ask: "What is this project trying to do or solve?"
If vague, offer examples tied to the archetype they picked (or generic ones), e.g.:
- "Help me remember and find things I've learned" (vault)
- "Let customers book my services without back-and-forth email" (app)
- "Show potential clients what I've built" (portfolio)
Recommend the closest match, then let them confirm or adjust.

**2. Audience and users**
Ask: "Who is this for — just you, a small team, customers, the public?"
If vague, offer: just me · me and a few collaborators · a specific group (describe) ·
anyone on the internet. Recommend based on purpose.

**3. Success and outcomes**
Ask: "How will you know in 3–6 months that this worked? What does 'done well' look like?"
If vague, offer concrete examples:
- "I can find any note in under 30 seconds"
- "Ten paying customers by month 3"
- "A portfolio site that gets me one new client inquiry a month"
Recommend based on what they have said so far.

**4. Scope — MVP and non-goals**
Ask: "What's in the first version and what's intentionally out? What would make scope
creep?"
If vague, propose an MVP slice based on their purpose + audience, and list two or three
common things to leave for later. Let them adjust.

**5. Constraints and resources**
Ask: "Any hard limits — deadline, budget, tech stack, must-have integrations?"
This dimension is often quick; if they have none, that is a valid answer — record it.

#### Adaptive depth (propose-don't-just-ask)

After the initial open question for each dimension:
- If the answer is clear and specific → accept it and move on.
- If the answer is vague, thin, or "I don't know" → immediately offer **2–4 concrete
  example options** plus a **recommended default** inferred from what the user has
  already said. Let them pick, tweak, or approve the recommendation.

**Follow-up cap:** probe each dimension for at most **2–3 follow-up exchanges**. If a
dimension is still vague after the cap, record the recommended default as an assumption
flagged `(assumed — confirm later)` and move on. Never trap the user in a loop.

#### Draft-confirm gate

Before writing anything, reflect back a **complete draft charter** (all five dimensions
plus any flagged assumptions) in one message and ask: "Does this look right — anything to
correct or add before I write it up?"

Only proceed to Phase 2 after the user confirms (or makes corrections — then show the
updated draft and confirm again).

---

### Phase 2 — Write the raw record

Write the full discovery Q&A — every question asked and every answer given, verbatim —
to a **new dated file**:

    raw/project/<YYYY-MM-DD>-discovery.md

Use this frontmatter at the top of the raw file:

```markdown
---
title: Project Discovery — <YYYY-MM-DD>
source_id: raw/project/<YYYY-MM-DD>-discovery.md
path: raw/project/<YYYY-MM-DD>-discovery.md
tags: [discovery, charter, interview]
updated: <YYYY-MM-DD>
---
```

**Append-only rule:** each run (including pivot re-runs) writes a **new** dated file.
Never edit or overwrite an existing file in `raw/`. If today already has a file, use a
disambiguating suffix (e.g. `-discovery-2.md`).

**Use the real filename everywhere.** The `<YYYY-MM-DD>-discovery.md` shown in the templates
is a placeholder — wherever the actual record is referenced (this file's `source_id`/`path`
frontmatter, the charter's *Source* footer, and the `change-log.md` line), use the **exact
filename you wrote this run, including any disambiguating suffix**, so a same-day pivot's
provenance points at the new record, not the first one.

---

### Phase 3 — Write or update the charter

Write (first run) or update in place (pivot re-run) the charter at `wiki/charter.md`
using the template in "The charter (wiki/charter.md) shape" below.

This is normal AI wiki maintenance and writes to `wiki/` directly — no sign-off needed.

On a pivot re-run: update the content, bump `updated:` to today, and add a link to the
new raw record at the bottom alongside any prior ones.

---

### Phase 4 — Cross-link from wiki/index.md

Add or update an entry for `wiki/charter.md` in `wiki/index.md`:
- Under the "By area" section, as a **top or pinned entry** (the charter is the north
  star — it belongs at or near the top, not buried).
- Under "Recent additions" with today's date.

Follow the same cross-linking pattern `add-new-resource` uses when indexing any asset.

---

### Phase 5 — Log the change

Append one attributed line to `outputs/change-log.md`:

    - <YYYY-MM-DD> — define-project — wrote project charter (wiki/charter.md) from raw/project/<YYYY-MM-DD>-discovery.md — auto

---

## The charter (wiki/charter.md) shape

Every charter uses this exact template. Fill in every section; use
`(assumed — confirm later)` for anything the user left unresolved.

```markdown
---
title: Project Charter
source_id: wiki:charter
path: wiki/charter.md
tags: [charter, project, meta]
updated: <YYYY-MM-DD>
---

# Project Charter

**One-liner:** <elevator pitch — one sentence that captures what this is and for whom>

## Purpose & problem
<What the project does and the problem it solves. 2–4 sentences.>

## Audience & users
<Who uses this. Be specific: "just me", "a team of 3–5 engineers", "small-business owners
booking appointments".>

## Success & outcomes
<How success is measured in 3–6 months. Prefer concrete, observable signals.>

## Scope
**In / MVP:** <what ships first>
**Out / non-goals:** <what is intentionally excluded from v1>
**Later:** <things deferred to a future phase>

## Constraints & resources
<Hard limits: deadline, budget, tech stack, must-have integrations. "None identified" is
a valid value.>

## Open questions / assumptions
<Anything flagged "assumed — confirm later" from the interview, plus genuine open
questions the project still needs to answer.>

---
*Source: raw/project/<YYYY-MM-DD>-discovery.md (full discovery interview).*
```

---

## Output

End the session with a short summary:

- Confirmation that `raw/project/<YYYY-MM-DD>-discovery.md` was written (immutable
  record of the interview).
- Confirmation that `wiki/charter.md` was created or updated (the distilled north star).
- Any entries cross-linked in `wiki/index.md`.
- The `change-log.md` line appended.
- A reminder of any items flagged `(assumed — confirm later)` that the user should
  revisit.

Example:

> Charter written.
> - Raw record: raw/project/2026-06-30-discovery.md
> - Charter: wiki/charter.md (created)
> - Indexed in wiki/index.md (pinned under "By area", added to "Recent additions")
> - Logged to outputs/change-log.md
>
> 2 items marked "assumed — confirm later": tech stack preference; launch deadline.
> Re-run define-project any time the project pivots or those assumptions resolve.
