"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"

/** What each `?tour=` key points at and explains. */
const MESSAGES: Record<string, { title: string; body: string }> = {
  hierarchy: {
    title: "Drop-and-build hierarchy",
    body: "Drop files and the app proposes the Series → Season → Episode tree — far less manual setup before the real work.",
  },
  upload: {
    title: "Background, resumable uploads",
    body: "A docked Upload Manager keeps chunked transfers running — they survive dropped connections while you keep working.",
  },
  audience: {
    title: "In-flow audience segmentation",
    body: "Build audience segments right inside the flow; a required default means every viewer resolves to one image.",
  },
  feedback: {
    title: "Pinned feedback → fix list",
    body: "Publisher feedback is pinned to the exact field or timestamp, bundled into one actionable fix list.",
  },
}

const RING = ["ring-2", "ring-amber-500", "transition-shadow"]

/**
 * Reads `?tour=<key>` and spotlights the matching `[data-tour]` element —
 * scrolls to it, rings it, and explains the product bet in a toast. Drives the
 * "How it works" tour so a recruiter lands right on each of the four answers.
 */
export function TourSpotlight() {
  const params = useSearchParams()
  const pathname = usePathname()
  const tour = params.get("tour")

  useEffect(() => {
    if (!tour || !MESSAGES[tour]) return
    let el: HTMLElement | null = null
    let tries = 0
    let ringTimer = 0

    // The target may render after data loads — poll briefly for it.
    const poll = window.setInterval(() => {
      el = document.querySelector<HTMLElement>(`[data-tour="${tour}"]`)
      if (el) {
        window.clearInterval(poll)
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add(...RING)
        toast(MESSAGES[tour].title, {
          description: MESSAGES[tour].body,
          duration: 7000,
        })
        ringTimer = window.setTimeout(() => el?.classList.remove(...RING), 6000)
      } else if (++tries > 30) {
        window.clearInterval(poll)
      }
    }, 100)

    return () => {
      window.clearInterval(poll)
      window.clearTimeout(ringTimer)
      el?.classList.remove(...RING)
    }
  }, [tour, pathname])

  return null
}
