# The path to production

This template takes you from an idea to a **themed, working front-end prototype with mock data** (the
`define → vet → design → build → advise` arc, all **Tier 0** — no keys, offline). That's a prototype, not a
finished product. This page is the honest, ordered map of what stands between that prototype and a
**fully-tested, fully-audited, ready-for-production** product — and how the template grows to cover it.

Each rung is a future skill in the template's own idiom: a skill that writes provenance to `raw/`, a report
to `outputs/`, optionally an autopilot step, keys-in-env (never in chat), graceful-off, and **attended for
anything irreversible**. The safety-sensitive rungs (keys, deploy, payments, publish) always stay
**scaffold + checklist + guide** — the template prepares everything, but *you* do the actual key entry and
go-live. That boundary is deliberate and permanent.

## The rungs (in order)

1. **Real data & identity — `build-backend`** *(shipped, Phase 18 — the biggest jump).*
   Turn the mock-data app into a real, backend-ready app: a Supabase schema derived from your data, a
   graceful-off data layer (runs on mock with no keys; uses the real backend the moment keys are present),
   sign-in/auth, and a go-live checklist. Scaffolds hands-off; you do the one go-live step. See
   `docs/BUILD-BACKEND.md`.

2. **Prove it works — testing — `test-app`** *(shipped, Phase 19).*
   Generate unit + component + end-to-end (Playwright) tests against your app *and* the charter's success
   criteria (each criterion becomes an automated test or a flagged manual/metric note), produce a runnable
   suite + coverage, and a coverage/criteria manifest in `outputs/tests/`. Adds a `test-writer` agent to the
   fleet. Scaffolds offline; the run stays yours. See `docs/TEST-APP.md`.

3. **Prove it's safe — audit — `audit-app`** *(shipped, Phase 20).*
   One `audit-app` skill runs three lenses — security (dependency + secret scanning, authorization /
   input-validation / injection review, an OWASP-style checklist), **accessibility (WCAG)**, and
   **performance** — into one prioritized findings report in `outputs/audits/`, mirroring `codex-review`'s
   propose-only pattern (it writes only a report — never modifies the app or auto-fixes). Reasoning-first and
   offline; `npm audit` / Lighthouse / axe are offered, not run. *(The roadmap's `security-audit` + a11y/perf
   siblings resolved to one skill with three lenses, matching how rungs 1–2 were reconciled.)* See
   `docs/AUDIT-APP.md`.

4. **Ship it — deploy & operate.**
   A `deploy` skill: a hosting target + CI/CD + env/secrets management as **scaffold + guided checklist**
   (you pull the go-live trigger), plus **observability** — error tracking, logging, and real analytics that
   *feed* `raw/metrics/`, closing the loop with `advise-project` (which today consumes metrics nothing
   produces).

5. **The go/no-go gate — `ship-check`.**
   A production-readiness skill that runs the whole gauntlet — tests green? security clean? a11y/perf
   thresholds met? deploy config present? legal present? real content? — and returns a **GO / NOT-YET**
   verdict naming the exact blocking gaps. It's the production analog of `roast`'s idea gate. The arc
   becomes **define → vet → design → build → test → audit → ship → advise**.

6. **Make it legitimate — polish & compliance.**
   Real content/copy/assets (no more placeholder text), onboarding, empty/error/loading states;
   legal/privacy (privacy policy, terms, cookie consent, GDPR/CCPA); optional payments (a Stripe scaffold);
   and user docs.

## The rule that never changes

The template never enters your API keys, never charges your card, and never publishes or deploys on your
behalf. For every rung above, it does all the preparation it safely can **unattended**, then hands you a
short, well-marked checklist for the one step that must be yours. That's what keeps "hands-off" and "safe"
true at the same time.
