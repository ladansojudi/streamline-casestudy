"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Clapperboard, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { posterUrl, titleTypeLabel, type EpisodeStatus } from "@/data/db"
import { useTitleRollups } from "@/data/hooks"
import { ContentStudioNewTitleDialog } from "@/sections/content-studio/content-studio-new-title-dialog"

type StatusCounts = Record<EpisodeStatus, number>
type Filter = "all" | "in-progress" | "in-review" | "changes" | "published"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "in-review", label: "In review" },
  { key: "changes", label: "Needs changes" },
  { key: "published", label: "Published" },
]

function matchesFilter(sc: StatusCounts, f: Filter) {
  switch (f) {
    case "all":
      return true
    case "in-progress":
      return sc.draft + sc.uploading + sc.ready > 0
    case "in-review":
      return sc["in-review"] > 0
    case "changes":
      return sc.changes > 0
    case "published":
      return sc.published > 0
  }
}

/** The most actionable status for a title, for its catalogue chip. */
function primaryStatus(sc: StatusCounts): { label: string; cls: string } {
  if (sc.changes > 0)
    return {
      label: "Needs changes",
      cls: "border-amber-500/30 text-amber-600 dark:text-amber-500",
    }
  if (sc["in-review"] > 0)
    return {
      label: "In review",
      cls: "border-sky-500/30 text-sky-600 dark:text-sky-400",
    }
  if (sc.draft + sc.uploading > 0)
    return { label: "In progress", cls: "text-muted-foreground" }
  if (sc.ready > 0)
    return {
      label: "Ready",
      cls: "border-emerald-500/30 text-emerald-600 dark:text-emerald-500",
    }
  if (sc.published > 0)
    return { label: "Published", cls: "text-muted-foreground" }
  return { label: "Empty", cls: "text-muted-foreground" }
}

export function ContentStudioLanding({ autoNew = false }: { autoNew?: boolean }) {
  const { data: rollups = [], isLoading } = useTitleRollups()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [newOpen, setNewOpen] = useState(false)

  // Tour bet #1: land here and open the New title dialog to start the flow.
  useEffect(() => {
    if (!autoNew) return
    setNewOpen(true)
    toast("Drop-and-build hierarchy", {
      description:
        "Name a title here, then drop files — the app proposes the Series → Season → Episode tree.",
      duration: 7000,
    })
  }, [autoNew])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rollups.length,
      "in-progress": 0,
      "in-review": 0,
      changes: 0,
      published: 0,
    }
    for (const r of rollups) {
      if (matchesFilter(r.statusCounts, "in-progress")) c["in-progress"]++
      if (matchesFilter(r.statusCounts, "in-review")) c["in-review"]++
      if (matchesFilter(r.statusCounts, "changes")) c.changes++
      if (matchesFilter(r.statusCounts, "published")) c.published++
    }
    return c
  }, [rollups])

  const visible = useMemo(
    () =>
      rollups.filter(
        (r) =>
          matchesFilter(r.statusCounts, filter) &&
          (query.trim() === "" ||
            r.title.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [rollups, filter, query]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Content Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Your whole catalogue — open a title to prepare it, or start a new one.
          </p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus />
          New title
        </Button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 flex flex-wrap items-center gap-1 px-1">
          {FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {t.label}
              <span className="tabular-nums opacity-70">{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
            className="h-8 pl-8"
          />
        </div>
      </div>

      {/* Catalogue */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
            <Clapperboard className="size-5" />
          </span>
          <div className="grid gap-1">
            <p className="text-sm font-medium">No titles here</p>
            <p className="text-xs text-muted-foreground">
              Try another filter, or start a new title.
            </p>
          </div>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus />
            New title
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => {
            const status = primaryStatus(r.statusCounts)
            const poster = posterUrl(r.title.poster, "w185")
            const uploading = r.statusCounts.uploading
            return (
              <Card key={r.title.id} className="transition-colors hover:bg-muted/40">
                <Link
                  href={`/content-studio/${r.title.id}`}
                  className="flex gap-3 px-4 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={r.title.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Clapperboard className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate font-medium">{r.title.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {titleTypeLabel(r.title.type)}
                      </Badge>
                      <Badge variant="outline" className={status.cls}>
                        {status.label}
                      </Badge>
                    </div>
                    <span className="mt-auto text-xs text-muted-foreground">
                      {uploading > 0 ? (
                        <span className="flex items-center gap-1 text-sky-600 dark:text-sky-500">
                          <Loader2 className="size-3 animate-spin" />
                          {uploading} uploading
                        </span>
                      ) : (
                        `${r.episodeCount} ${r.episodeCount === 1 ? "episode" : "episodes"}`
                      )}
                    </span>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      <ContentStudioNewTitleDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  )
}
