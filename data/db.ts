/**
 * Query layer over the live store.
 *
 * Types and seed data live in schema.ts; the mutable tables live in store.ts.
 * These helpers always read the CURRENT store state, so they reflect any
 * add/edit/delete the user has made. UI sections call these (or the React Query
 * hooks that wrap them) instead of touching raw rows.
 */
import { getState } from "./store"

export type {
  ActivityEvent,
  ActivityTone,
  AssetKey,
  Comment,
  CommentKind,
  Episode,
  EpisodeStatus,
  Media,
  MediaKind,
  Person,
  Role,
  Season,
  Segment,
  SegmentKind,
  SegmentRule,
  Thumbnail,
  Title,
  TitleType,
  Upload,
  UploadState,
} from "./schema"

export {
  TITLE_TYPES,
  titleTypeLabel,
  isEpisodicTitle,
} from "./schema"

import type {
  ActivityEvent,
  AssetKey,
  Comment,
  Episode,
  EpisodeStatus,
  Media,
  Person,
  Role,
  Season,
  Segment,
  Thumbnail,
  Title,
  Upload,
} from "./schema"

/* ------------------------------------------------------------------ */
/* Live table accessors                                                */
/* ------------------------------------------------------------------ */

export const people = (): Person[] => getState().people
export const titles = (): Title[] => getState().titles
export const seasons = (): Season[] => getState().seasons
export const episodes = (): Episode[] => getState().episodes
export const uploads = (): Upload[] => getState().uploads
export const segments = (): Segment[] => getState().segments
export const thumbnails = (): Thumbnail[] => getState().thumbnails
export const comments = (): Comment[] => getState().comments
export const activity = (): ActivityEvent[] => getState().activity
export const media = (): Media[] => getState().media

/* ------------------------------------------------------------------ */
/* Image helpers                                                       */
/* ------------------------------------------------------------------ */

/** Build a TMDB image URL from a poster path. size: w185|w342|w500|w780|original */
export function posterUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342"
): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

/**
 * Resolve any media url to something <img> can load. Handles a TMDB path
 * ("/abc.jpg"), an absolute http(s) url, or a data: URL (mock upload).
 */
export function mediaUrl(
  url: string | null | undefined,
  size: "w185" | "w342" | "w500" | "w780" = "w342"
): string | null {
  if (!url) return null
  if (url.startsWith("/")) return posterUrl(url, size)
  return url // absolute or data: URL
}

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

export function getMedia(id: string): Media | undefined {
  return media().find((m) => m.id === id)
}

/** Media available to a title: its own items + general/shared art. */
export function mediaForTitle(titleId: string): Media[] {
  return media().filter((m) => m.titleId === titleId || m.titleId === null)
}

export function getPerson(id: string): Person | undefined {
  return people().find((p) => p.id === id)
}

export function getTitle(id: string): Title | undefined {
  return titles().find((t) => t.id === id)
}

export function getEpisode(id: string): Episode | undefined {
  return episodes().find((e) => e.id === id)
}

export function getSegment(id: string): Segment | undefined {
  return segments().find((s) => s.id === id)
}

export function getSeason(id: string): Season | undefined {
  return seasons().find((s) => s.id === id)
}

/** Seasons of a title, ordered by number. */
export function seasonsForTitle(titleId: string): Season[] {
  return seasons()
    .filter((s) => s.titleId === titleId)
    .sort((a, b) => a.number - b.number)
}

/* ------------------------------------------------------------------ */
/* Joined / derived views                                              */
/* ------------------------------------------------------------------ */

/** An episode with its parent title and owner resolved. */
export type EpisodeView = Episode & {
  title: Title
  owner: Person
  /** "Squid Game" for films, "Stranger Things · S4 · E09" for series */
  displayName: string
  ownerName: string
}

export function episodeView(e: Episode): EpisodeView {
  const title = getTitle(e.titleId)!
  const owner = getPerson(title.ownerId)!
  const isFeature = e.season === null
  return {
    ...e,
    title,
    owner,
    displayName: isFeature ? title.name : `${title.name} · ${e.label}`,
    ownerName: owner.name,
  }
}

export function allEpisodeViews(): EpisodeView[] {
  return episodes().map(episodeView)
}

export function episodesByStatus(status: EpisodeStatus): EpisodeView[] {
  return allEpisodeViews().filter((e) => e.status === status)
}

function emptyStatusCounts(): Record<EpisodeStatus, number> {
  return {
    draft: 0,
    uploading: 0,
    ready: 0,
    "in-review": 0,
    changes: 0,
    published: 0,
  }
}

export function statusCounts(): Record<EpisodeStatus, number> {
  const counts = emptyStatusCounts()
  for (const e of episodes()) counts[e.status]++
  return counts
}

/* ------------------------------------------------------------------ */
/* Title-scoped views (for the title detail page)                      */
/* ------------------------------------------------------------------ */

export function episodesForTitle(titleId: string): EpisodeView[] {
  return episodes()
    .filter((e) => e.titleId === titleId)
    .sort((a, b) => (a.season ?? 0) - (b.season ?? 0) || (a.episode ?? 0) - (b.episode ?? 0))
    .map(episodeView)
}

export function titleStatusCounts(titleId: string): Record<EpisodeStatus, number> {
  const counts = emptyStatusCounts()
  for (const e of episodes()) {
    if (e.titleId === titleId) counts[e.status]++
  }
  return counts
}

/** Per asset-type: how many of the title's episodes have that asset ready. */
export function titleAssetCounts(titleId: string): Record<AssetKey, number> {
  const counts: Record<AssetKey, number> = {
    video: 0,
    audio: 0,
    subtitles: 0,
    captions: 0,
    thumbnail: 0,
  }
  for (const e of episodes()) {
    if (e.titleId !== titleId) continue
    for (const key of Object.keys(counts) as AssetKey[]) {
      if (e.assets[key]) counts[key]++
    }
  }
  return counts
}

/** Comments for an episode, with the author resolved. */
export type CommentView = Comment & { author: Person }

export function commentsForEpisode(episodeId: string): CommentView[] {
  return comments()
    .filter((c) => c.episodeId === episodeId)
    .map((c) => ({ ...c, author: getPerson(c.authorId)! }))
}

/** An open Publisher note for a title, with which episode it sits on. */
export type TitleNote = CommentView & { episodeLabel: string | null }

/** Open (unresolved) notes across all of a title's episodes — the fix list. */
export function openNotesForTitle(titleId: string): TitleNote[] {
  const eps = episodes().filter((e) => e.titleId === titleId)
  const byId = new Map(eps.map((e) => [e.id, e]))
  return comments()
    .filter((c) => !c.resolved && byId.has(c.episodeId))
    .map((c) => {
      const ep = byId.get(c.episodeId)!
      return {
        ...c,
        author: getPerson(c.authorId)!,
        episodeLabel: ep.season !== null ? ep.label : null,
      }
    })
}

export function openCommentCount(episodeId: string): number {
  return comments().filter((c) => c.episodeId === episodeId && !c.resolved).length
}

/** Uploads with their episode resolved. */
export type UploadView = Upload & { episode: EpisodeView }

export function uploadViews(): UploadView[] {
  return uploads().map((u) => ({ ...u, episode: episodeView(getEpisode(u.episodeId)!) }))
}

/** Thumbnail variants for a title, joined to their segment + media, sorted. */
export type ThumbnailView = Thumbnail & {
  segment: Segment
  media: Media | null
}

export function thumbnailsForTitle(titleId: string): ThumbnailView[] {
  return thumbnails()
    .filter((t) => t.titleId === titleId)
    .map((t) => ({
      ...t,
      segment: getSegment(t.segmentId)!,
      media: t.mediaId ? (getMedia(t.mediaId) ?? null) : null,
    }))
    .sort((a, b) => a.rulePriority - b.rulePriority)
}

/** How many titles use a given segment (for the Audiences page). */
export function titlesUsingSegment(segmentId: string): Title[] {
  const titleIds = new Set(
    thumbnails().filter((t) => t.segmentId === segmentId).map((t) => t.titleId)
  )
  return titles().filter((t) => titleIds.has(t.id))
}

/** Episodes currently in the Publisher's review queue. */
export function reviewQueue(): EpisodeView[] {
  return allEpisodeViews().filter((e) => e.status === "in-review")
}

export function activityFor(role: Role): ActivityEvent[] {
  return activity().filter((a) => a.audience === role || a.audience === "all")
}
