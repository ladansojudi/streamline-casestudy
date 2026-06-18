import {
  AudioLines,
  Captions,
  Image as ImageIcon,
  Subtitles,
  Video,
  type LucideIcon,
} from "lucide-react"

import type { AssetKey, EpisodeStatus } from "@/data/db"

/** UI config for asset-coverage icons (data lives in the db). */
export const assetMeta: { key: AssetKey; label: string; icon: LucideIcon }[] = [
  { key: "video", label: "Video", icon: Video },
  { key: "audio", label: "Audio", icon: AudioLines },
  { key: "subtitles", label: "Subtitles", icon: Subtitles },
  { key: "captions", label: "Captions", icon: Captions },
  { key: "thumbnail", label: "Thumbnail", icon: ImageIcon },
]

/** UI config for status chips. */
export const statusMeta: Record<
  EpisodeStatus,
  { label: string; dot: string; text: string }
> = {
  draft: { label: "Draft", dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
  uploading: { label: "Uploading", dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" },
  ready: { label: "Ready", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-500" },
  "in-review": { label: "In review", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-500" },
  changes: { label: "Changes requested", dot: "bg-destructive", text: "text-destructive" },
  published: { label: "Published", dot: "bg-primary", text: "text-primary" },
}

export type StatusFilter = "all" | EpisodeStatus

export const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "uploading", label: "Uploading" },
  { key: "ready", label: "Ready" },
  { key: "in-review", label: "In review" },
  { key: "changes", label: "Changes" },
  { key: "published", label: "Published" },
]
