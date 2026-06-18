# Data layer

All app data lives in `/data` as a small mutable "database". **Do NOT add hardcoded mock arrays inside sections — extend the tables / store instead.**

## Layers

1. **`data/schema.ts`** — row TYPES + immutable SEED arrays (from the JSON files). No logic, no store dependency (this breaks the import cycle). Source files: `people / titles / episodes / uploads / segments / thumbnails / comments / activity.json`, joined by id (e.g. `episodes.titleId → titles.id`, `thumbnails.segmentId → segments.id`, `comments.episodeId → episodes.id`). Referential integrity is clean — keep it that way when editing.

2. **`data/store.ts`** — the LIVE mutable tables. Seeds from schema into `localStorage` key `insider-one:db` on first load; isomorphic (SSR falls back to the seed, never persists server-side). Async CRUD:
   - `createRow(table, prefix, row)` — new id via `crypto.randomUUID()`
   - `updateRow(table, id, patch)`
   - `deleteRow(table, id)` — **seed rows are protected: returns `"protected"` for any seed id** (sample data can't be deleted; edits ARE allowed)
   - `resetStore()` — restores the seed snapshot. Surfaced in the UI as **"Reset demo data"** in the user menu (`layouts/reset-data-dialog.tsx`), which calls it then `invalidateQueries()` so the UI refetches. Does NOT touch the role key.
   - `isSeedRow(table, id)`

3. **`data/db.ts`** — query layer. **Table accessors are FUNCTIONS that read live state**: `segments()`, `episodes()`, `titles()`, etc. (call them — they are not arrays). Joined helpers: `allEpisodeViews()` (episode + title + owner, with `displayName`/`ownerName`), `statusCounts`, `commentsForEpisode`, `openCommentCount`, `uploadViews`, `thumbnailsForTitle`, `titlesUsingSegment`, `reviewQueue`, `activityFor(role)`, `getPerson/getTitle/getEpisode/getSegment`, and `posterUrl(path, size)` (see Images).

4. **`data/hooks.ts`** — React Query over the above: `useSegments/useTitles/useEpisodes/useReviewQueue/useComments/useThumbnails`, generic `useCreateRow/useUpdateRow/useDeleteRow` (invalidate all on success), and `useDerived(key, fn)` for multi-table views (Tasks). Provider is `layouts/query-provider.tsx`, wired in `dashboard-layout.tsx` alongside `<Toaster/>` (sonner).

## Central row & statuses

The **episode** is the central row: films = one episode with `season: null` (label "Feature"); series = one per episode. `EpisodeStatus` = `draft | uploading | ready | in-review | changes | published`.

## Section data modules return functions

Section data modules export FUNCTIONS now (`getStats(role)`, `getReturnedTitles()`, `getTaskGroups()`, …), not module-level const arrays — so they reflect live mutations. If you add a derived view, follow the same pattern.

## CRUD UI that's live

- **Audiences** — create / edit / delete segments (`sections/audiences/audiences-segment-dialog.tsx`, react-hook-form + zod)
- **Library** — new title creates a title + its first episode; delete episode (`sections/library/library-title-dialog.tsx`)
- **Review** — resolve / reopen + add comments; Approve → `published`, Request changes → `changes`

Forms use shadcn `Input/Select/Textarea/Label` directly — **the `base-lyra` registry has NO `form` component** (see base-ui.md).

## Images: real Netflix titles + TMDB posters

Sample titles are real Netflix originals with real TMDB poster art (Stranger Things, The Witcher, Wednesday, Money Heist, Dark, Squid Game, The Crown). Each `Title` has a `poster` field = a TMDB poster path (e.g. `/49WJfeN0moxb9IPfGn8AIqMGskD.jpg`).

- Build the URL with `posterUrl(path, size)` from `db.ts` (sizes `w185/w342/w500/w780`).
- `next.config.ts` allowlists `image.tmdb.org` under `images.remotePatterns`.
- Posters render via `next/image` in Library (`library-poster.tsx`, 2:3 thumb), Content Studio thumbnails (poster + segment color wash), the Review player (w780 backdrop), and Audiences "used by" avatars.
- New user-created titles get `poster: ""` → graceful Film-icon fallback.
- **When adding titles, grab a real TMDB poster path and confirm it returns HTTP 200 — TMDB hashes change, so don't guess them.**
