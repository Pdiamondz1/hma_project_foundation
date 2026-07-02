# audit-app — check your app is safe, accessible, and fast

`build-app` builds your app, `build-backend` makes its data real, `test-app` proves it works — `audit-app`
checks it's **safe, accessible, and fast**. It reads your app and writes one prioritized report of what to
fix, most serious first. It **changes nothing** — every finding is a recommendation you choose to act on.

Say **"audit my app"**, **"is my app secure?"**, **"check accessibility"**, **"is it fast?"**, or
**`/audit-app`**.

## What it checks

Three lenses, in one report:

- **Security** — risky or outdated dependencies, any secrets accidentally left in the code, and common
  vulnerabilities (weak access rules, injection, cross-site scripting) via an OWASP-style checklist.
- **Accessibility (WCAG)** — missing image descriptions, unlabeled form fields, heading structure, keyboard
  use, and color contrast (checked against your own design colors) — so everyone can use your app.
- **Performance** — heavy dependencies, images and code that could load faster, and what to measure live.

Each finding gets a severity (**critical / major / minor / info**), where it is, why it matters, and how to
fix it. It's all written to `outputs/audits/<date>-<slug>/AUDIT.md`.

## Offline first; deeper checks are offered

The audit is done by reading your app — it works fully offline, no setup. For the deeper, tool-based checks
it hands you the exact commands (it never runs them for you):

- `cd app && npm install && npm audit` — the live vulnerability database for your dependencies.
- `npm run build` + Lighthouse — real performance and accessibility scores in a browser.

If you say yes, it'll run the `npm audit` check for you; the browser-based checks stay yours to run.

## What it is (and isn't)

- **Is:** a real, useful audit that catches the common, important issues — a strong safety net and a
  prioritized to-do list.
- **Isn't:** a full penetration test or a live security scan. It says plainly what only the deeper tool runs
  can find.
- **Propose-only:** it never changes your app or fixes anything on its own — you decide what to act on. (Ask
  it to fix a specific finding and it will, as a separate step.)
- **Web app (`app/`) first;** phone/extension audits come later.

## Safety

It writes only a report (never touches your app's code), reasons fully offline, and **never runs in the
unattended maintenance loop**. Nothing installs, runs, or gets fixed without your say-so. Auditing is the
third rung of the **path to production** (`docs/PATH-TO-PRODUCTION.md`).
