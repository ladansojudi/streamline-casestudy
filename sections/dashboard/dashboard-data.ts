import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  RotateCcw,
  Send,
  UploadCloud,
  type LucideIcon,
} from "lucide-react"

import {
  activityFor,
  allEpisodeViews,
  episodes,
  openCommentCount,
  reviewQueue as dbReviewQueue,
  statusCounts,
  titleTypeLabel,
  uploadViews,
  type ActivityTone,
  type Role,
} from "@/data/db"

/* ------------------------------------------------------------------ */
/* Top-line stats (per role)                                           */
/* ------------------------------------------------------------------ */

export type Stat = {
  label: string
  value: number
  hint: string
  tone: "default" | "warning" | "success"
  href: string
}

export function getStats(role: Role): Stat[] {
  const counts = statusCounts()
  const released = episodes().filter((e) => e.releaseDate !== null).length
  if (role === "editor") {
    return [
      { label: "In progress", value: counts.draft + counts.uploading, hint: "drafts you're preparing", tone: "default", href: "/content-studio" },
      { label: "Awaiting review", value: counts["in-review"], hint: "submitted to Publisher", tone: "default", href: "/review" },
      { label: "Returned to you", value: counts.changes, hint: "need fixes", tone: "warning", href: "/tasks" },
      { label: "Ready", value: counts.ready, hint: "cleared to submit", tone: "success", href: "/content-studio" },
    ]
  }
  return [
    { label: "In queue", value: counts["in-review"], hint: "waiting for review", tone: "warning", href: "/review" },
    { label: "Published", value: counts.published, hint: "live now", tone: "success", href: "/library" },
    { label: "Returned", value: counts.changes, hint: "sent back with notes", tone: "default", href: "/review" },
    { label: "Releasing soon", value: released, hint: "have a release date", tone: "default", href: "/schedule" },
  ]
}

/* ------------------------------------------------------------------ */
/* Upload Manager (derived from the uploads table)                     */
/* ------------------------------------------------------------------ */

export type UploadState = "uploading" | "processing" | "failed" | "complete"

export type Upload = {
  title: string
  detail: string
  progress: number
  state: UploadState
  size: string
  speed: string
  reason?: string
}

export function getUploads(): Upload[] {
  return uploadViews().map((u) => ({
    title: u.episode.displayName,
    detail: `${u.format} · ${u.size}`,
    progress: u.progress,
    state: u.state,
    size: u.size,
    speed: u.speed,
    reason: u.reason,
  }))
}

/* ------------------------------------------------------------------ */
/* Content / review pipeline overview                                  */
/* ------------------------------------------------------------------ */

export type PipelineStage = { key: string; label: string; count: number }

export function getPipeline(role: Role): PipelineStage[] {
  const counts = statusCounts()
  const released = episodes().filter((e) => e.releaseDate !== null).length
  if (role === "editor") {
    return [
      { key: "draft", label: "Draft", count: counts.draft },
      { key: "uploading", label: "Uploading", count: counts.uploading },
      { key: "ready", label: "Ready", count: counts.ready },
      { key: "review", label: "In review", count: counts["in-review"] },
      { key: "published", label: "Published", count: counts.published },
    ]
  }
  return [
    { key: "queue", label: "In queue", count: counts["in-review"] },
    { key: "reviewing", label: "Reviewing", count: Math.min(2, counts["in-review"]) },
    { key: "returned", label: "Returned", count: counts.changes },
    { key: "approved", label: "Approved", count: counts.published },
    { key: "scheduled", label: "Scheduled", count: released },
  ]
}

/* ------------------------------------------------------------------ */
/* Returned titles (Editor) — changes-status episodes                  */
/* ------------------------------------------------------------------ */

export type ContentType = string

export type ReturnedTitle = {
  id: string
  titleId: string
  title: string
  type: ContentType
  episode?: string
  returnedAgo: string
  openComments: number
  topNote: string
}

export function getReturnedTitles(): ReturnedTitle[] {
  return allEpisodeViews()
    .filter((e) => e.status === "changes")
    .map((e) => ({
      id: e.id,
      titleId: e.titleId,
      title: e.title.name,
      type: titleTypeLabel(e.title.type),
      episode: e.season !== null ? e.label : undefined,
      returnedAgo: e.updated,
      openComments: openCommentCount(e.id),
      topNote: e.missing.length
        ? `Missing: ${e.missing.join(", ")}`
        : "Fixes requested before resubmitting.",
    }))
}

/* ------------------------------------------------------------------ */
/* Review queue (Publisher) — in-review episodes                       */
/* ------------------------------------------------------------------ */

export type QueueItem = {
  id: string
  title: string
  type: ContentType
  episode?: string
  submittedAgo: string
  submittedBy: string
  flags: number
}

export function getReviewQueue(): QueueItem[] {
  return dbReviewQueue().map((e) => ({
    id: e.id,
    title: e.title.name,
    type: titleTypeLabel(e.title.type),
    episode: e.season !== null ? e.label : undefined,
    submittedAgo: e.submittedAgo ?? "—",
    submittedBy: e.ownerName,
    flags: openCommentCount(e.id),
  }))
}

/* ------------------------------------------------------------------ */
/* Upcoming releases — episodes with a release date                    */
/* ------------------------------------------------------------------ */

export type Release = {
  title: string
  detail: string
  date: string
  day: string
  status: "Scheduled" | "Awaiting review"
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function getReleases(): Release[] {
  return allEpisodeViews()
    .filter((e) => e.releaseDate !== null)
    .sort((a, b) => (a.releaseDate! < b.releaseDate! ? -1 : 1))
    .slice(0, 4)
    .map((e) => {
      const d = new Date(e.releaseDate!)
      return {
        title: e.season !== null ? `${e.title.name} · ${e.label}` : e.title.name,
        detail: `${titleTypeLabel(e.title.type)} · ${e.title.runtime}`,
        date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
        day: DAYS[d.getUTCDay()],
        status: e.status === "published" ? "Scheduled" : "Awaiting review",
      }
    })
}

/* ------------------------------------------------------------------ */
/* Activity / decisions feed (per role)                                */
/* ------------------------------------------------------------------ */

export type Activity = {
  icon: LucideIcon
  text: string
  time: string
  tone: ActivityTone
}

const iconMap: Record<string, LucideIcon> = {
  returned: RotateCcw,
  ready: CheckCircle2,
  approved: CheckCircle2,
  submitted: Send,
  failed: AlertTriangle,
  comment: MessageSquare,
  upload: UploadCloud,
}

export function getFeed(role: Role): Activity[] {
  return activityFor(role).map((a) => ({
    icon: iconMap[a.icon] ?? MessageSquare,
    text: a.text,
    time: a.time,
    tone: a.tone,
  }))
}
