---
name: human-improve-system
description: The human-in-the-loop companion to improve-system. Walks you through the pending NEEDS SIGN-OFF items and MORE CONTEXT questions so you can approve, reject, or answer them, and can notify you (e.g. on Slack) when items are waiting. Records your decisions; improve-system then applies them.
---

# human-improve-system

Closes the loop with you. It surfaces what `improve-system` has parked for review and helps
you clear it — interactively, or by pinging you when you're needed.

## When to use

When there are open `outputs/review-*.md` or `outputs/needs-context-*.md` files to clear,
or on a schedule to get notified that some are waiting.

## State

- **Config:** `.claude/skills/human-improve-system/config.json` —
  `{ notify: { slack: { enabled, target } } }`. On first run, interview for whether/how to
  be notified (a Slack channel or webhook, or "none").

## Modes

### Walk-through (default, zero-arg)
1. Read the most recent open `outputs/review-*.md` and `outputs/needs-context-*.md`.
2. Present each pending item one at a time with its `rv-id`, target, and detail.
3. Record the decision **by editing only the review file**:
   - approve → set the box to `- [x]`;
   - reject → leave unchecked and append ` — rejected: <reason>` to the item line;
   - defer → leave as-is.
   For each `needs-context` question, capture the answer inline under the question.
4. Offer to run `improve-system` now to apply the items you just checked. (Applying and
   logging to `change-log.md` is `improve-system`'s job, not this skill's.)

### Notify
If `config.notify.slack.enabled`, and pending items exist, send a short summary to the
configured target ("N items need sign-off, M questions open") via the available Slack
connector/MCP. Never send anything else; never auto-approve.

## Output

A short summary: items approved / rejected / deferred, questions answered, and whether
`improve-system` was run to apply them.
