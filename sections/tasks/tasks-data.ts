import {
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  SquarePen,
  type LucideIcon,
} from "lucide-react"

import {
  allEpisodeViews,
  comments,
  episodeView,
  getEpisode,
  uploadViews,
} from "@/data/db"

export type Task = {
  id: string
  title: string
  meta: string
  detail: string
  age: string
  cta: string
  href: string
}

export type TaskGroup = {
  key: "returned" | "fields" | "comments" | "uploads"
  label: string
  description: string
  icon: LucideIcon
  tone: "warning" | "default" | "destructive"
  tasks: Task[]
}

/** Derive the Editor's actionable task groups from the live data. */
export function getTaskGroups(): TaskGroup[] {
  const episodes = allEpisodeViews()

  // Returned titles — changes requested by the Publisher.
  const returned: Task[] = episodes
    .filter((e) => e.status === "changes")
    .map((e) => {
      const open = comments().filter((c) => c.episodeId === e.id && !c.resolved)
      return {
        id: `r_${e.id}`,
        title: e.displayName,
        meta: `${open.length} ${open.length === 1 ? "comment" : "comments"}`,
        detail: open[0]?.body ?? "Fixes requested before resubmitting.",
        age: e.updated,
        cta: "Open fix list",
        href: `/content-studio/${e.titleId}`,
      }
    })

  // Missing required fields — metadata gaps on episodes being prepared.
  const fields: Task[] = episodes
    .filter(
      (e) =>
        e.missing.some((m) => m === "Cast" || m === "Maturity rating") &&
        e.status !== "published"
    )
    .flatMap((e) =>
      e.missing
        .filter((m) => m === "Cast" || m === "Maturity rating")
        .map((field) => ({
          id: `f_${e.id}_${field}`,
          title: e.displayName,
          meta: field,
          detail: `${field} is required before this title can ship.`,
          age: e.updated,
          cta: "Fill in",
          href: `/content-studio/${e.titleId}`,
        }))
    )

  // Unresolved comments assigned back to the Editor.
  const unresolved: Task[] = comments()
    .filter((c) => !c.resolved)
    .filter((c) => getEpisode(c.episodeId)?.status === "changes")
    .map((c) => {
      const ep = episodeView(getEpisode(c.episodeId)!)
      return {
        id: `c_${c.id}`,
        title: ep.displayName,
        meta: c.kind === "timestamp" ? `At ${c.at}` : (c.field ?? "Field"),
        detail: c.body,
        age: c.ago,
        cta: "Resolve",
        href: `/content-studio/${ep.titleId}`,
      }
    })

  // Failed uploads — need a resume.
  const uploads: Task[] = uploadViews()
    .filter((u) => u.state === "failed")
    .map((u) => ({
      id: `u_${u.id}`,
      title: u.episode.displayName,
      meta: `${u.size} · stopped at ${u.progress}%`,
      detail: "Connection lost — resume from the last chunk.",
      age: u.episode.updated,
      cta: "Resume",
      href: `/content-studio/${u.episode.titleId}`,
    }))

  return [
    {
      key: "returned",
      label: "Returned titles",
      description: "Sent back by the Publisher with fix notes",
      icon: RotateCcw,
      tone: "warning",
      tasks: returned,
    },
    {
      key: "fields",
      label: "Missing required fields",
      description: "Metadata needed before submit",
      icon: SquarePen,
      tone: "default",
      tasks: fields,
    },
    {
      key: "comments",
      label: "Unresolved comments",
      description: "Open feedback awaiting your action",
      icon: MessageSquare,
      tone: "default",
      tasks: unresolved,
    },
    {
      key: "uploads",
      label: "Failed uploads",
      description: "Transfers that need a resume",
      icon: AlertTriangle,
      tone: "destructive",
      tasks: uploads,
    },
  ]
}
