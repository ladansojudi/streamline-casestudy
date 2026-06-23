/**
 * Schema: row types + immutable SEED data (from the JSON tables).
 *
 * This module has NO logic and NO store dependency, so both store.ts and db.ts
 * can import it without a cycle. Mutations never touch these arrays — the store
 * snapshots them on first load.
 */
import activityJson from "./activity.json"
import mediaJson from "./media.json"
import commentsJson from "./comments.json"
import episodesJson from "./episodes.json"
import seasonsJson from "./seasons.json"
import peopleJson from "./people.json"
import segmentsJson from "./segments.json"
import thumbnailsJson from "./thumbnails.json"
import titlesJson from "./titles.json"
import uploadsJson from "./uploads.json"

/* ------------------------------------------------------------------ */
/* Row types                                                           */
/* ------------------------------------------------------------------ */

export type Role = "editor" | "publisher"

export type Person = {
  id: string
  name: string
  firstName: string
  initials: string
  email: string
  role: Role
  tagline: string
}

/**
 * Catalog content types. `episodic` titles get a Season → Episode structure;
 * the rest are a single feature (one "Feature" episode, no season row).
 * This registry is the single source of truth — derive the union, the human
 * labels and the form options from it so adding a type is a one-line change.
 */
export const TITLE_TYPES = [
  { value: "series", label: "Series", episodic: true },
  { value: "limited-series", label: "Limited series", episodic: true },
  { value: "docuseries", label: "Docuseries", episodic: true },
  { value: "reality", label: "Reality", episodic: true },
  { value: "anime", label: "Anime", episodic: true },
  { value: "film", label: "Movie", episodic: false },
  { value: "documentary", label: "Documentary", episodic: false },
  { value: "short", label: "Short", episodic: false },
  { value: "special", label: "Special", episodic: false },
] as const

export type TitleType = (typeof TITLE_TYPES)[number]["value"]

const TITLE_TYPE_BY_VALUE = new Map<TitleType, (typeof TITLE_TYPES)[number]>(
  TITLE_TYPES.map((t) => [t.value, t]),
)

/** Human label for a title type ("limited-series" → "Limited series"). */
export function titleTypeLabel(type: TitleType): string {
  return TITLE_TYPE_BY_VALUE.get(type)?.label ?? type
}

/** True for episodic types (Season → Episode), false for single features. */
export function isEpisodicTitle(type: TitleType): boolean {
  return TITLE_TYPE_BY_VALUE.get(type)?.episodic ?? false
}

export type Title = {
  id: string
  name: string
  type: TitleType
  synopsis: string
  genre: string
  runtime: string
  ownerId: string
  /** TMDB poster path, e.g. "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg" */
  poster: string
  /** Editable metadata (optional so existing seed rows stay valid). */
  cast?: string
  maturityRating?: string
}

export type EpisodeStatus =
  | "draft"
  | "uploading"
  | "ready"
  | "in-review"
  | "changes"
  | "published"

export type AssetKey = "video" | "audio" | "subtitles" | "captions" | "thumbnail"

export type Season = {
  id: string
  titleId: string
  number: number
  title: string
  synopsis: string
}

export type Episode = {
  id: string
  titleId: string
  seasonId: string | null
  season: number | null
  episode: number | null
  label: string
  code: string
  episodeTitle: string
  /** Editable episode synopsis (optional). */
  episodeSynopsis?: string
  /** Editable per-episode metadata (optional so existing seed rows stay valid). */
  runtime?: string
  director?: string
  writers?: string
  guestStars?: string
  maturityRating?: string
  /** Per-episode thumbnail media id; null → falls back to the title poster. */
  thumbnailMediaId?: string | null
  file: string
  size: string
  status: EpisodeStatus
  uploadProgress: number
  assets: Record<AssetKey, boolean>
  missing: string[]
  updated: string
  releaseDate: string | null
  submittedById?: string
  submittedAgo?: string
  priority?: "high" | "normal"
  reviewRuntime?: string
}

export type UploadState = "uploading" | "processing" | "failed" | "complete"

export type Upload = {
  id: string
  episodeId: string
  state: UploadState
  progress: number
  size: string
  format: string
  speed: string
  /** Why a failed upload stopped — drives the recovery action (Resume vs Retry). */
  reason?: string
}

export type SegmentKind = "fallback" | "region" | "behavior" | "taste"

export type SegmentRule = { field: string; op: string; value: string }

export type Segment = {
  id: string
  name: string
  kind: SegmentKind
  description: string
  reachPercent: number
  members: string
  art: string
  rules: SegmentRule[]
  createdBy: string
}

export type Thumbnail = {
  id: string
  titleId: string
  /** Set → this is per-episode artwork; absent/null → title-level. */
  episodeId?: string | null
  segmentId: string
  rulePriority: number
  /** Assigned media item id; null → falls back to the title poster. */
  mediaId?: string | null
}

export type MediaKind = "poster" | "backdrop" | "art"

export type Media = {
  id: string
  name: string
  /** TMDB path ("/abc.jpg"), absolute URL, or a data: URL (mock upload). */
  url: string
  kind: MediaKind
  /** Optional owning title; null = general/shared art. */
  titleId: string | null
}

export type CommentKind = "timestamp" | "field"

/** A back-and-forth reply on a comment thread. */
export type CommentReply = {
  authorId: string
  body: string
  ago: string
}

export type Comment = {
  id: string
  episodeId: string
  kind: CommentKind
  at: string | null
  atPercent: number | null
  field: string | null
  body: string
  authorId: string
  ago: string
  resolved: boolean
  /** Conversation under the original note (Publisher ↔ Editor). */
  replies?: CommentReply[]
}

export type ActivityTone = "default" | "success" | "warning"

export type ActivityEvent = {
  id: string
  audience: Role | "all"
  icon: string
  text: string
  time: string
  tone: ActivityTone
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const seedPeople = peopleJson as Person[]
export const seedTitles = titlesJson as Title[]
export const seedSeasons = seasonsJson as Season[]
export const seedEpisodes = episodesJson as Episode[]
export const seedUploads = uploadsJson as Upload[]
export const seedSegments = segmentsJson as Segment[]
export const seedThumbnails = thumbnailsJson as Thumbnail[]
export const seedComments = commentsJson as Comment[]
export const seedActivity = activityJson as ActivityEvent[]
export const seedMedia = mediaJson as Media[]
