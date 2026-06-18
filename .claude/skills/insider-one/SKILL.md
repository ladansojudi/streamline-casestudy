---
name: insider-one
description: Architecture and conventions for the Insider One case-study app. Use when working anywhere in this repo — understanding the product/personas, the data layer (JSON seed + localStorage store + React Query), the role switch, or the @base-ui/react quirks behind components/ui. Read the matching reference before touching that area.
metadata:
  type: project
  version: "1.0.0"
---

# Insider One

A Netflix-Studio-style content management dashboard built as a portfolio **case study** (not a real product). Two roles share one app via a global Role Switch:

- **Editor** — creates titles, uploads files, prepares metadata/subtitles/thumbnails, submits for review. Persona: *Eren* (junior–mid, fast, deadline-pressured).
- **Publisher** — reviews submissions, requests changes, approves, schedules. Persona: *Maya* (detail-oriented gatekeeper).

The UI expresses four validated product bets: (1) auto-propose Series→Season→Episode structure from dropped files, (2) background/resumable uploads, (3) audience-specific thumbnails with rule priority, (4) review comments pinned to a timestamp or a field.

## Repo conventions (see AGENTS.md — they override defaults)

- **Pages are thin**: `app/<route>/page.tsx` renders a single section *view* and nothing else.
- **All page UI lives in `sections/<section>/`**, every file prefixed with the section name; the composed page is `sections/<section>/view/<section>-view.tsx`.
- **Reusable primitives come from shadcn only** (`@/components/ui`) — never hand-rolled. Add via `npx shadcn@latest add <name>`.
- **Imports use the `@/` alias.**
- Theme is **clean neutral** light/dark shadcn — deliberately NOT the dark Netflix-ops look.

## Reference files — read the relevant one before editing

- **[references/data-layer.md](references/data-layer.md)** — how ALL app data flows. Read before touching anything under `data/` or any section that reads/mutates data. Covers the JSON seed → localStorage store → `db.ts` query layer → React Query hooks, seed-row protection, and the real-Netflix-titles + TMDB poster setup.
- **[references/base-ui.md](references/base-ui.md)** — this project's shadcn is the `base-lyra` style on **`@base-ui/react`, NOT radix**. Read before editing `components/ui/*` or composing primitives. Documents the `render`-vs-`asChild` rule, the patched Button, group-label requirement, tooltip `delay`, and other gotchas that have caused real bugs.
- **[references/product.md](references/product.md)** — the case study's IA, personas, the four bets, and what's built vs. still placeholder. Read before adding pages/sections or changing navigation.
