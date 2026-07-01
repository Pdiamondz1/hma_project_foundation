---
name: what-can-i-do
description: Use when someone asks "what can I do here?", seems unsure where to start, or just finished setup. Shows a short, friendly menu of everyday actions (add something, find something, see what's saved, set up or adjust the project) in plain language, then does whichever they pick — without making them learn skill names.
---

# what-can-i-do

A tiny orientation helper for anyone staring at a blank screen. It offers a short menu of
plain-language choices and then does whatever the person picks.

## When to use

When the user asks "what can I do?", looks unsure, just finished setup, or you sense they're
not sure what to try next. Offer it proactively too (see `CLAUDE.md` → *Be welcoming to
everyone*).

## Procedure

1. **Show a short, plain menu** — 4–5 everyday actions, no skill names or jargon. Tailor the
   wording to the project's type if you know it. A good default:
   - **Get clear on your project** — figure out its goal, who it's for, and what success looks like → runs `define-project`
   - **Pressure-test an idea** — get a brutal second opinion before you build → runs `roast`
   - **Make it look great** — set your project's design: style, colors, and feel → runs `define-design`
   - **Build a first version of your app** — turn your plan into something you can click → runs `build-app`
   - **Build a mobile app** — turn your plan into an app you can open on your phone → runs `build-mobile`
   - **Add something** — save a note, a file, or a link → runs `add-new-resource`
   - **Find something** — search what you've saved so far → searches the knowledge base
   - **See what's saved** — a quick overview of the project so far → reads `wiki/index.md`
   - **Set up or change the project** — its name, focus, or options → runs `setup-project`
   - **Keep it tidy automatically** — turn on weekly upkeep → schedules `maintenance-loop`
     (see `docs/SCHEDULING.md`)
2. **Let them choose** by number or in their own words; accept natural language ("I want to
   add a photo of my receipt").
3. **Do the chosen action** by running the matching skill yourself — never make them learn or
   type the skill name.
4. **Close warmly** — remind them they can ask "what can I do?" anytime.

## Output

The menu, then (after they choose) the result of the action they picked, described plainly.
