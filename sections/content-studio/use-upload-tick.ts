"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { episodes as allEpisodes } from "@/data/db"
import { updateRow } from "@/data/store"
import { demoMode } from "@/lib/demo-mode"

/** How much each in-flight upload advances per tick, and how often. */
const STEP_PERCENT = 8
const INTERVAL_MS = 600

/**
 * Background "resumable upload" simulation for the title being prepared. Every
 * tick, advance that title's not-yet-uploaded episodes (`draft` or `uploading`,
 * progress < 100) toward 100 — showing the climbing percentage — and mark each
 * `ready` once it lands. This finishes both the placeholder episode created
 * with the title and any files dropped in Content Studio, so the prep
 * checklist's "Upload files" step can complete and Submit unlocks. Scoped to
 * the active title so other titles aren't touched; resumes where it left off
 * when you come back to the title.
 */
export function useUploadTick(titleId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!titleId) return

    const id = setInterval(async () => {
      // Offline (real or simulated) → uploads pause and resume when back.
      const offline =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        demoMode.isForcedOffline()
      if (offline) return

      const inFlight = allEpisodes().filter(
        (e) =>
          e.titleId === titleId &&
          e.uploadProgress < 100 &&
          (e.status === "uploading" || e.status === "draft")
      )
      if (inFlight.length === 0) return

      for (const e of inFlight) {
        const next = Math.min(100, e.uploadProgress + STEP_PERCENT)
        await updateRow("episodes", e.id, {
          uploadProgress: next,
          status: next >= 100 ? "ready" : "uploading",
        })
      }
      await qc.invalidateQueries()
    }, INTERVAL_MS)

    return () => clearInterval(id)
  }, [qc, titleId])
}
