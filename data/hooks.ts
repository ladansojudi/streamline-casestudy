"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"

import {
  allEpisodeViews,
  commentsForEpisode,
  episodeView,
  episodesForTitle,
  getEpisode,
  getTitle,
  media,
  mediaForTitle,
  openNotesForTitle,
  reviewQueue,
  seasonsForTitle,
  segments,
  thumbnailsForTitle,
  titleAssetCounts,
  titles,
  titlesUsingSegment,
  titleStatusCounts,
} from "./db"
import {
  createRow,
  deleteRow,
  updateRow,
  type DbState,
  type TableName,
} from "./store"
import type { Comment, Episode, Segment, Title } from "./schema"

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const qk = {
  segments: ["segments"] as const,
  titles: ["titles"] as const,
  episodes: ["episodes"] as const,
  reviewQueue: ["review-queue"] as const,
  comments: (episodeId: string) => ["comments", episodeId] as const,
  // Anything derived from the whole db (dashboard, tasks) keys off "db".
  db: ["db"] as const,
}

/** Invalidate everything that could depend on a table change. */
function invalidateAll(qc: QueryClient) {
  qc.invalidateQueries()
}

/* ------------------------------------------------------------------ */
/* Queries (read live db helpers)                                      */
/* ------------------------------------------------------------------ */

export function useSegments() {
  return useQuery({
    queryKey: qk.segments,
    queryFn: async () => ({
      all: segments(),
      usage: Object.fromEntries(
        segments().map((s) => [s.id, titlesUsingSegment(s.id)])
      ) as Record<string, Title[]>,
    }),
  })
}

export function useTitles() {
  return useQuery({ queryKey: qk.titles, queryFn: async () => titles() })
}

export function useEpisodes() {
  return useQuery({
    queryKey: qk.episodes,
    queryFn: async () => allEpisodeViews(),
  })
}

export function useSeasons(titleId: string) {
  return useQuery({
    queryKey: ["seasons", titleId],
    queryFn: async () => seasonsForTitle(titleId),
    enabled: !!titleId,
  })
}

/** All media (Media Library page). */
export function useMedia() {
  return useQuery({ queryKey: ["media"], queryFn: async () => media() })
}

/** Media available to a title (its own + shared) — for the image picker. */
export function useMediaForTitle(titleId: string) {
  return useQuery({
    queryKey: ["media", titleId],
    queryFn: async () => mediaForTitle(titleId),
    enabled: !!titleId,
  })
}

export function useReviewQueue() {
  return useQuery({
    queryKey: qk.reviewQueue,
    queryFn: async () => reviewQueue(),
  })
}

/** A single review item (episode view + its title's thumbnails) by id. */
export function useReviewItem(episodeId: string) {
  return useQuery({
    queryKey: ["review-item", episodeId],
    queryFn: async () => {
      const e = getEpisode(episodeId)
      if (!e) return null
      const item = episodeView(e)
      return { item, thumbnails: thumbnailsForTitle(item.titleId) }
    },
    enabled: !!episodeId,
  })
}

/** Open Publisher notes across a title's episodes — shown to the Editor. */
export function useTitleNotes(titleId: string) {
  return useQuery({
    queryKey: ["title-notes", titleId],
    queryFn: async () => openNotesForTitle(titleId),
    enabled: !!titleId,
  })
}

export function useComments(episodeId: string) {
  return useQuery({
    queryKey: qk.comments(episodeId),
    queryFn: async () => commentsForEpisode(episodeId),
    enabled: !!episodeId,
  })
}

export function useThumbnails(titleId: string) {
  return useQuery({
    queryKey: ["thumbnails", titleId],
    queryFn: async () => thumbnailsForTitle(titleId),
    enabled: !!titleId,
  })
}

/** Titles with their episode/status/asset rollups — for the Library card view. */
export function useTitleRollups() {
  return useQuery({
    queryKey: ["title-rollups"],
    queryFn: async () =>
      titles().map((t) => {
        const eps = episodesForTitle(t.id)
        const sc = titleStatusCounts(t.id)
        return {
          title: t,
          episodeCount: eps.length,
          statusCounts: sc,
          assetCounts: titleAssetCounts(t.id),
          failed: sc.changes,
        }
      }),
  })
}

/** Everything the title detail page needs, in one query. */
export function useTitleDetail(titleId: string) {
  return useQuery({
    queryKey: ["title-detail", titleId],
    queryFn: async () => {
      const title = getTitle(titleId)
      if (!title) return null
      return {
        title,
        episodes: episodesForTitle(titleId),
        statusCounts: titleStatusCounts(titleId),
        assetCounts: titleAssetCounts(titleId),
        thumbnails: thumbnailsForTitle(titleId),
      }
    },
    enabled: !!titleId,
  })
}

/** Generic "whole-db" query — for views derived from multiple tables (Tasks). */
export function useDerived<T>(key: string, compute: () => T) {
  return useQuery({ queryKey: ["derived", key], queryFn: async () => compute() })
}

/* ------------------------------------------------------------------ */
/* Generic mutations                                                   */
/* ------------------------------------------------------------------ */

export function useCreateRow<T extends TableName>(table: T, prefix: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (row: Omit<DbState[T][number], "id"> & { id?: string }) =>
      createRow(table, prefix, row),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateRow<T extends TableName>(table: T) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<DbState[T][number]>
    }) => updateRow(table, id, patch),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteRow<T extends TableName>(table: T) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => invalidateAll(qc),
  })
}

/* ------------------------------------------------------------------ */
/* Typed convenience wrappers                                          */
/* ------------------------------------------------------------------ */

export type SegmentInput = Omit<Segment, "id">
export type TitleInput = Omit<Title, "id">
export type EpisodePatch = Partial<Episode>
export type CommentInput = Omit<Comment, "id">
