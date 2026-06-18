# Product: IA, personas, bets, status

Insider One is a Netflix-Studio-style content management dashboard — a portfolio **case study**, not a real product. Two roles share one app via a global Role Switch.

## Roles & personas

- **Editor** — creates titles, uploads files, prepares metadata/subtitles/thumbnails, submits for review. Persona **Eren** (22–28, junior–mid, fast, deadline-pressured). Success = a whole series ready for review without babysitting uploads.
- **Publisher** — reviews submissions, requests changes, approves, schedules. Persona **Maya** (mid, detail-oriented quality gatekeeper). Success = a correct title goes live in one pass; a flawed one returns with a clear fix list.

## Information architecture (sidebar)

Dashboard · Content Studio · Library · Audiences · Schedule · Tasks · Review (+ Notifications, Settings as secondary). Defined in `layouts/nav-config.ts`.

## The four product bets the UI expresses

1. Auto-propose Series→Season→Episode structure from dropped files (less manual setup).
2. Background, resumable uploads so the Editor keeps working (resume from the last chunk after a dropped connection).
3. Audience-specific thumbnails assigned inside the upload flow (segments + rule priority).
4. Pinned review comments (to a video timestamp or a field) so fix round-trips drop.

## What's built

Clean-neutral light/dark shadcn theme (deliberately NOT the dark Netflix-ops look — the brief was to be creative, not clone Netflix).

- **Global role switch** — `layouts/role-context.tsx` (`RoleProvider` + `useRole`, persisted to `localStorage` key `insider-one:role`), switched from the user menu in `layouts/nav-user.tsx`. The home Dashboard adapts per role (Editor: uploads / returned / content-status; Publisher: review queue / decisions / review-pipeline) — see `sections/dashboard/`.
- **Library** (`sections/library/`) — two views toggled top-right: a **card view** grouped by title (poster + per-asset-type counts, Asset-QC style) and a **table view** of episodes. Status health bar, filter tabs with counts, asset-coverage icons, search. **Rows/cards link to the title detail page** `/library/[id]` (`title-detail-view.tsx`): poster + metadata, per-asset-type count strip, status tabs, and the episode/asset list. db helpers: `episodesForTitle`, `titleStatusCounts`, `titleAssetCounts`; hooks `useTitleDetail`, `useTitleRollups`.
- **Content Studio** (`sections/content-studio/`) — a **master–detail editor** for one title (title picker in the header; route `/content-studio/[id]`). Left: a **Structure tree** (Title → Seasons → Episodes) that is also a structure editor (add/rename/remove season & episode, seed rows protected; `use-structure-actions.ts`). Right panel is context-aware: **Title** node → editable title metadata (synopsis, **genre via shared `GenreMultiSelect`**, cast, maturity rating) + the **audience-thumbnails** grid; **Season** node → season metadata; **Episode** node → episode metadata. Seasons are a real table (`data/seasons.json`, episodes link via `seasonId`). A **prep checklist** gates Submit. Audience thumbnails (bet #3) attach **per title**; each variant can get its own image via **"Set image"** → the reusable `components/image-picker-dialog.tsx`.
- **Media Library** (`/media`, `sections/media/`) — browse images, **upload** (mock: `read-image-file.ts` downscales to a data URL), delete (seed-protected). The `media` table (`data/media.json`) seeds one poster per title. Thumbnails reference a media item via `mediaId`; `mediaUrl(url, size)` in `db.ts` resolves a TMDB path / absolute / data URL. The genre list lives once in `data/genres.ts`.
- **Review** (`sections/review/`) — Publisher queue + detail with a video scrubber showing pinned timestamp comments and field comments, Approve / Request-changes (bet #4).
- **Tasks** (`sections/tasks/`) — grouped actionable list (returned titles, missing fields, unresolved comments, failed uploads), derived live from the data.
- **Audiences** (`sections/audiences/`) — reusable segments with reach, targeting rules, and usage; full create/edit/delete.

## Still placeholder

Schedule, Notifications, Settings.

## Reference note

The Netflix Partner Help links were used only for *workflow* patterns (status health bars, auto-detect upload summary, fix notes). They are login-gated; WebFetch can read their text but not their screenshots.
