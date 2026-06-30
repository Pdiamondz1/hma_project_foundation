# Wiki page frontmatter

Every `wiki/` page opens with a YAML frontmatter block so the knowledge base is
**RAG-ready** — pages can be embedded into a vector store later with no rework. This is the
canonical template that `CLAUDE.md` points to (kept here, out of the always-loaded
`CLAUDE.md`, so the operating-rules file stays lean).

```
---
title: <human title>
source_id: <stable id, e.g. wiki:index or raw/curated/2026-06-29-foo.md>
path: <what this page indexes, relative to repo root>
tags: [topic, topic]
updated: <YYYY-MM-DD>
---
```

Fields:

- **title** — the human-readable page title.
- **source_id** — a stable identifier, e.g. `wiki:index`, or the `raw/` path the page distills.
- **path** — what this page indexes (the `raw/` file or folder it summarizes), relative to the repo root.
- **tags** — a short topic list, used for retrieval and filtering.
- **updated** — the last-touched date, in `YYYY-MM-DD` form.

Tips:

- When in doubt, copy the header of any existing `wiki/` page and adjust the values.
- Keep pages small and cross-linked; **reference** `raw/` files, never paste their content here.
