"use client"

import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  episodes as allEpisodes,
  getTitle,
  isEpisodicTitle,
  seasonsForTitle,
} from "@/data/db"
import { createRow, deleteRow, isSeedRow, updateRow } from "@/data/store"
import type { EpisodeStatus } from "@/data/schema"

const EMPTY_ASSETS = {
  video: false,
  audio: false,
  subtitles: false,
  captions: false,
  thumbnail: false,
}

/** Structure mutations for Content Studio (add/remove seasons & episodes). */
export function useStructureActions(titleId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries()

  const addSeason = async () => {
    const existing = seasonsForTitle(titleId)
    const number = (existing.at(-1)?.number ?? 0) + 1
    await createRow("seasons", "se", {
      titleId,
      number,
      title: `Season ${number}`,
      synopsis: "",
    })
    await refresh()
    toast.success(`Added Season ${number}`)
  }

  /** Append one season with `episodeCount` episodes, uploading like a fresh drop. */
  const addSeasonWithEpisodes = async (episodeCount: number) => {
    const title = getTitle(titleId)
    const number = (seasonsForTitle(titleId).at(-1)?.number ?? 0) + 1
    const season = await createRow("seasons", "se", {
      titleId,
      number,
      title: `Season ${number}`,
      synopsis: "",
    })
    const startProgress = [4, 20, 10, 28]
    const count = Math.max(1, Math.min(20, Math.trunc(episodeCount) || 1))
    for (let ep = 1; ep <= count; ep++) {
      const pad = String(ep).padStart(2, "0")
      await createRow("episodes", "e", {
        titleId,
        seasonId: season.id,
        season: number,
        episode: ep,
        label: `S${number} · E${pad}`,
        code: `EP${number}${pad}`,
        episodeTitle: `Episode ${ep}`,
        file: `${(title?.name ?? "title").replace(/\s+/g, "_")}_S${pad}E${pad}_master.mov`,
        size: "—",
        status: "uploading",
        uploadProgress: startProgress[(ep - 1) % startProgress.length],
        assets: { ...EMPTY_ASSETS },
        missing: ["Everything"],
        updated: "just now",
        releaseDate: null,
      })
    }
    await refresh()
    toast.success(`Added Season ${number} · ${count} episode${count > 1 ? "s" : ""}`)
  }

  const addEpisode = async (seasonId: string) => {
    const season = seasonsForTitle(titleId).find((s) => s.id === seasonId)
    if (!season) return
    const eps = allEpisodes().filter((e) => e.seasonId === seasonId)
    const number = (Math.max(0, ...eps.map((e) => e.episode ?? 0)) || 0) + 1
    const pad = String(number).padStart(2, "0")
    await createRow("episodes", "e", {
      titleId,
      seasonId,
      season: season.number,
      episode: number,
      label: `S${season.number} · E${pad}`,
      code: `EP${season.number}${pad}`,
      episodeTitle: `Episode ${number}`,
      file: "—",
      size: "—",
      status: "draft",
      uploadProgress: 0,
      assets: { ...EMPTY_ASSETS },
      missing: ["Everything"],
      updated: "just now",
      releaseDate: null,
    })
    await refresh()
    toast.success(`Added episode to ${season.title}`)
  }

  const removeEpisode = async (episodeId: string) => {
    const result = await deleteRow("episodes", episodeId)
    if (result === "deleted") toast.success("Episode removed")
    else if (result === "protected") toast.error("Sample episodes can't be removed")
    else toast.error("Episode not found")
    await refresh()
    return result
  }

  /** Removing a season also removes its episodes (cascade). */
  const removeSeason = async (seasonId: string) => {
    const result = await deleteRow("seasons", seasonId)
    if (result === "protected") {
      toast.error("Sample seasons can't be removed")
      return result
    }
    if (result === "not-found") {
      toast.error("Season not found")
      return result
    }
    // Cascade: delete this season's episodes too.
    const eps = allEpisodes().filter((e) => e.seasonId === seasonId)
    for (const e of eps) await deleteRow("episodes", e.id)
    await refresh()
    toast.success("Season and its episodes removed")
    return result
  }

  /**
   * Simulate dropping files: auto-build one season per entry in
   * `episodesPerSeason`, each with its own episode count (real shows vary
   * per season) — or a single Feature for a film. Mixed upload states make it
   * look like a real in-progress ingest.
   */
  const simulateUpload = async (episodesPerSeason: number[]) => {
    const title = getTitle(titleId)
    if (!title) return

    // Re-import replaces, it doesn't stack: drop this title's editable
    // structure first (sample/seed rows are protected, so they stay).
    for (const e of allEpisodes().filter((ep) => ep.titleId === titleId)) {
      if (!isSeedRow("episodes", e.id)) await deleteRow("episodes", e.id)
    }
    for (const s of seasonsForTitle(titleId)) {
      if (!isSeedRow("seasons", s.id)) await deleteRow("seasons", s.id)
    }

    // Everything starts transferring low and at varied progress so the ingest
    // looks live; the background upload tick then climbs each to 100 → ready.
    const startProgress = [4, 20, 10, 28]
    const stateFor = (i: number): { status: EpisodeStatus; progress: number } => ({
      status: "uploading",
      progress: startProgress[i % startProgress.length],
    })

    if (!isEpisodicTitle(title.type)) {
      await createRow("episodes", "e", {
        titleId,
        seasonId: null,
        season: null,
        episode: null,
        label: "Feature",
        code: "FEAT",
        episodeTitle: title.name,
        file: `${title.name.replace(/\s+/g, "_")}_master.mov`,
        size: "48.0 GB",
        status: "uploading",
        uploadProgress: 40,
        assets: { ...EMPTY_ASSETS },
        missing: ["Everything"],
        updated: "just now",
        releaseDate: null,
      })
      await refresh()
      toast.success("Uploaded feature file — building structure")
      return
    }

    const startSeason = (seasonsForTitle(titleId).at(-1)?.number ?? 0) + 1
    let counter = 0
    for (let s = 0; s < episodesPerSeason.length; s++) {
      const number = startSeason + s
      const season = await createRow("seasons", "se", {
        titleId,
        number,
        title: `Season ${number}`,
        synopsis: "",
      })
      const seasonEpisodes = Math.max(1, episodesPerSeason[s] ?? 1)
      for (let ep = 1; ep <= seasonEpisodes; ep++) {
        const pad = String(ep).padStart(2, "0")
        const { status, progress } = stateFor(counter++)
        await createRow("episodes", "e", {
          titleId,
          seasonId: season.id,
          season: number,
          episode: ep,
          label: `S${number} · E${pad}`,
          code: `EP${number}${pad}`,
          episodeTitle: `Episode ${ep}`,
          file: `${title.name.replace(/\s+/g, "_")}_S${pad}E${pad}_master.mov`,
          size: `${(38 + ((counter * 7) % 20)).toFixed(1)} GB`,
          status,
          uploadProgress: progress,
          assets: { ...EMPTY_ASSETS },
          missing: ["Everything"],
          updated: "just now",
          releaseDate: null,
        })
      }
    }
    await refresh()
    const seasonCount = episodesPerSeason.length
    const totalEpisodes = episodesPerSeason.reduce((sum, n) => sum + Math.max(1, n), 0)
    toast.success(
      `Uploaded ${seasonCount} season${seasonCount > 1 ? "s" : ""} · ${totalEpisodes} episodes — structure built`
    )
  }

  /** Send every prepared episode of this title to the Publisher's review queue. */
  const submitForReview = async () => {
    const submittable = allEpisodes().filter(
      (e) =>
        e.titleId === titleId &&
        (e.status === "ready" || e.status === "changes")
    )
    if (submittable.length === 0) return
    for (const e of submittable) {
      await updateRow("episodes", e.id, {
        status: "in-review",
        submittedById: "u_eren",
        submittedAgo: "just now",
      })
    }
    await refresh()
    const title = getTitle(titleId)
    toast.success(`Submitted ${title?.name ?? "title"} for review`)
  }

  return {
    addSeason,
    addSeasonWithEpisodes,
    addEpisode,
    removeEpisode,
    removeSeason,
    simulateUpload,
    submitForReview,
  }
}
