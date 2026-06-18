# Base UI (not Radix)

UI primitives in `components/ui/` are the shadcn **`base-lyra`** style, built on **`@base-ui/react` — NOT radix-ui**. Components are installed via `npx shadcn@latest add <name>` and imported from `@/components/ui`. Per AGENTS.md: never hand-roll primitives; always add via shadcn.

> The `base-lyra` registry has **no `form` component** — build forms with shadcn `Input/Select/Textarea/Label` + react-hook-form + zod directly.

## API differences from Radix that have caused real bugs

- **No `asChild`.** Use the `render` prop instead:
  ```tsx
  <Button render={<Link href="…">…</Link>} />
  <SidebarMenuButton render={<Link/>} />
  <DropdownMenuTrigger render={<Button/>} />
  ```
  Passing `asChild` is a type error and won't compose.

- **`Button` + `render={<Link/>}` warns** *"expected a native `<button>` because nativeButton is true"*. `components/ui/button.tsx` is **patched** to default `nativeButton` to `false` whenever a `render` prop is passed, so button-as-link works without per-call props. **If you regenerate `button.tsx` via shadcn, re-apply that patch.**

- **`DropdownMenuLabel` → `Menu.GroupLabel`**, which requires a `<DropdownMenuGroup>` ancestor or it throws `MenuGroupContext is missing` at render. Wrap standalone labels in a group.

- **`TooltipProvider` uses `delay`**, not `delayDuration`.

- **Open-state styling** uses `data-popup-open:` (canonical, no brackets), not `data-[state=open]:`.

- **Anchor width** CSS var is `--anchor-width`, not `--radix-…-trigger-width`.

- **`Progress`** is `<Progress value={n} />` and renders its own track + indicator; override the indicator via `[&_[data-slot=progress-indicator]]:…`.

- **`Select`** root takes `value` / `onValueChange`; `onValueChange` can emit `null`, so guard it (`v ?? fallback`).

- **`SelectValue` shows the raw value, not the label** — unless `Select.Root` gets an `items` prop. Pass a `{value: label}` map (`<Select items={{ series: "Series", film: "Film" }} …>`) so the trigger renders the human label instead of e.g. `series` or `from-rose-500 to-orange-600`.

## Patched primitives (re-apply if regenerated via shadcn)

- **`button.tsx`** — defaults `nativeButton` to `false` when a `render` prop is passed (see above).
- **`sidebar.tsx` `SidebarMenuSkeleton`** — stock shadcn uses `Math.random()` for the skeleton width, which causes an SSR/client **hydration mismatch**. Patched to cycle deterministic preset widths (`SKELETON_WIDTHS`) instead.

## Hydration note

A hydration error whose server/client diff shows `id="scrnli_recorder_root"` (or similar injected nodes) is caused by a **browser extension** (e.g. Screenity screen recorder) mutating the DOM before React hydrates — NOT a bug in this app. Confirm by loading in an incognito window. The app's server HTML is stable and extension-free.

## Avatar squaring gotcha

The Avatar border is drawn by an `::after` pseudo-element hardcoded to `after:rounded-full`. To square an avatar you must add BOTH `rounded-md` (background) and `after:rounded-md` (border) — `rounded-md` alone gives a square background with a still-round border.
