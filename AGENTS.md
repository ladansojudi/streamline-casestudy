<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working method — consult skills first

Before starting **any** task, identify which installed skills apply and follow their guidance. Do this as the first step, before writing or changing code:

- **insider-one** — this repo's own architecture and conventions: the product/personas/IA, the data layer (JSON seed + localStorage store + React Query), the role switch, and the `@base-ui/react` quirks behind `components/ui`. Consult it before touching `data/`, `components/ui/`, or adding pages/sections; read its reference files for the matching area.
- **ui-ux-pro-max** — any UI/UX design work: planning, designing, building, or reviewing layouts, color, typography, spacing, animation, and accessibility. Consult it for design direction before/while building UI; pair it with `shadcn` for implementation.
- **shadcn** — any UI/component work: adding, composing, styling, or debugging shadcn/ui. Install reusables via shadcn, never hand-roll them.
- **react-best-practices** — writing/reviewing/refactoring React or Next.js (components, data fetching, bundle/performance).
- **react-view-transitions** — any page/route/shared-element/list animation or view transitions.
- **web-design-guidelines** — building or reviewing UI for accessibility, UX, and interface quality.
- **writing-guidelines** — authoring or reviewing docs/prose.

If more than one applies, follow all of them. When a skill is `user-invocable: false` (like `shadcn`) it auto-triggers, but still actively apply its rules rather than waiting. Prefer the skill's documented approach over training-data defaults.

# Project structure & conventions

## Reusable UI comes from shadcn — never hand-rolled
- Every reusable UI primitive (button, input, dialog, card, etc.) is installed from shadcn/ui with `npx shadcn@latest add <component>` and imported from `@/components/ui`.
- Do **not** author reusable primitives by hand. If one is missing, add it via shadcn. The `shadcn` skill is wired up for this project — use it for adding, composing, and styling components.

## Pages are thin — all UI lives in `sections/`
- Files in `app/` stay minimal: a route renders a single section **view** and handles only routing concerns (metadata, params, data fetching). No layout/markup beyond rendering the view.
- All page UI lives under `sections/<section>/`. One folder per page/section (`sections/home`, `sections/contact`, …).

## `sections/` layout & naming — all files kebab-case
- **Every file inside `sections/<section>/` is prefixed with the section name.**
- The composed page view goes in a `view/` subfolder:
  - `sections/<section>/view/<section>-view.tsx`, exporting `<Section>View`.
  - e.g. `sections/home/view/home-view.tsx` → `HomeView`; `sections/contact/view/contact-view.tsx` → `ContactView`.
- Section-local components (used **only** in that section, not reusable) sit directly in the section folder, section-name-prefixed:
  - e.g. `sections/contact/contact-form.tsx` → `ContactForm`; `sections/home/home-hero.tsx` → `HomeHero`.
- If a component is reused across sections, it is **not** a section component — promote it to shadcn (`@/components/ui`) or `@/components`.

## Imports
- Always use the `@/` alias: `@/components/ui/button`, `@/sections/home/view/home-view`.

## Shape at a glance
```
app/page.tsx                      → renders <HomeView/>           (thin route)
app/contact/page.tsx              → renders <ContactView/>        (thin route)
sections/
  home/
    view/home-view.tsx            → HomeView   (composes the page)
    home-hero.tsx                 → HomeHero   (section-only component)
  contact/
    view/contact-view.tsx         → ContactView
    contact-form.tsx              → ContactForm (section-only component)
components/ui/                     → shadcn primitives (button, input, …)
```
