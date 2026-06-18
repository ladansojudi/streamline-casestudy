import {
  episodes,
  getTitle,
  isEpisodicTitle,
  posterUrl,
  seasonsForTitle,
  type Episode,
} from "@/data/db"

export type NodeStatus = "ready" | "uploading" | "queued" | "failed"

export type EpisodeNode = {
  id: string
  label: string
  file: string
  status: NodeStatus
  progress: number
  size: string
  missing: string[]
}

export type SeasonNode = {
  /** The real season row id, or null for a film's single "Feature" group. */
  seasonId: string | null
  label: string
  episodes: EpisodeNode[]
}

export type SeriesTree = {
  title: string
  detectedFrom: number
  seasons: SeasonNode[]
}

/** What the editor's right panel is currently editing. */
export type Selection =
  | { kind: "title" }
  | { kind: "season"; seasonId: string }
  | { kind: "episode"; episodeId: string }

/** Collapse the 6 episode statuses into the 4 the studio tree shows. */
function toNodeStatus(e: Episode): NodeStatus {
  if (e.status === "uploading" && e.uploadProgress < 5) return "queued"
  if (e.status === "uploading") return "uploading"
  if (e.status === "draft") return "queued"
  // ready / in-review / changes / published are all fully transferred
  return "ready"
}

function toEpisodeNode(e: Episode): EpisodeNode {
  return {
    id: e.id,
    label: e.season !== null ? `Episode ${e.episode}` : "Feature",
    file: e.file,
    status:
      e.status === "uploading" && e.uploadProgress < 30
        ? "failed"
        : toNodeStatus(e),
    progress: e.uploadProgress,
    size: e.size,
    missing: e.missing,
  }
}

/** Build the Series → Season → Episode tree from the live seasons + episodes. */
export function buildTree(titleId: string): SeriesTree | null {
  const title = getTitle(titleId)
  if (!title) return null
  const eps = episodes().filter((e) => e.titleId === titleId)
  const titleSeasons = seasonsForTitle(titleId)

  const seasons: SeasonNode[] = titleSeasons.map((s) => ({
    seasonId: s.id,
    label: s.title,
    episodes: eps
      .filter((e) => e.seasonId === s.id)
      .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0))
      .map(toEpisodeNode),
  }))

  // Episodes with no season row (e.g. a film's Feature) go in an unattached group.
  const looseEpisodes = eps.filter((e) => e.seasonId === null)
  if (looseEpisodes.length > 0) {
    seasons.push({
      seasonId: null,
      label: isEpisodicTitle(title.type) ? "Unsorted" : "Feature",
      episodes: looseEpisodes
        .sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0))
        .map(toEpisodeNode),
    })
  }

  return { title: title.name, detectedFrom: eps.length * 2 + 4, seasons }
}

/* ------------------------------------------------------------------ */
/* Audience thumbnails (bet #3)                                        */
/* ------------------------------------------------------------------ */

/** Poster of a title, for thumbnail artwork. */
export function posterForTitle(titleId: string): string | null {
  return posterUrl(getTitle(titleId)?.poster, "w342")
}
