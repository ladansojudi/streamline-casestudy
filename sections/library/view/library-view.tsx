"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, Search, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { titleTypeLabel, type EpisodeStatus } from "@/data/db"
import { useEpisodes, useTitleRollups } from "@/data/hooks"
import { LibraryAssetIcons } from "@/sections/library/library-asset-icons"
import { LibraryPoster } from "@/sections/library/library-poster"
import { LibraryStatus } from "@/sections/library/library-status"
import { LibraryTitleCard } from "@/sections/library/library-title-card"
import {
  filterTabs,
  statusMeta,
  type StatusFilter,
} from "@/sections/library/library-data"

const healthOrder: EpisodeStatus[] = [
  "draft",
  "uploading",
  "ready",
  "in-review",
  "changes",
  "published",
]

export function LibraryView() {
  const { data: rows = [], isLoading } = useEpisodes()
  const { data: rollups = [] } = useTitleRollups()

  const [view, setView] = useState<"cards" | "table">("cards")
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [query, setQuery] = useState("")

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length }
    for (const status of healthOrder) {
      map[status] = rows.filter((t) => t.status === status).length
    }
    return map
  }, [rows])

  const visible = useMemo(() => {
    return rows.filter((t) => {
      const matchesFilter = filter === "all" || t.status === filter
      const matchesQuery =
        query.trim() === "" ||
        `${t.displayName} ${t.code} ${t.ownerName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [rows, filter, query])

  // Card view groups by title: a title shows if any of its episodes match.
  const visibleRollups = useMemo(() => {
    return rollups.filter((r) => {
      const matchesFilter = filter === "all" || r.statusCounts[filter] > 0
      const matchesQuery =
        query.trim() === "" ||
        r.title.name.toLowerCase().includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [rollups, filter, query])

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Every title across your catalog and its current stage. Open one in
            Content Studio to prepare it.
          </p>
        </div>
      </div>

      {/* Status health bar */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {healthOrder.map((status) => {
              const count = counts[status] ?? 0
              if (count === 0) return null
              return (
                <div
                  key={status}
                  className={statusMeta[status].dot}
                  style={{ width: `${(count / rows.length) * 100}%` }}
                  title={`${statusMeta[status].label}: ${count}`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {healthOrder.map((status) => (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className={cn("size-2 rounded-full", statusMeta[status].dot)}
                  aria-hidden
                />
                <span className="text-sm font-semibold tabular-nums">
                  {counts[status] ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">
                  {statusMeta[status].label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar: filter tabs + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
          {filterTabs.map((tab) => {
            const active = filter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded px-1 text-xs tabular-nums",
                    active ? "bg-background/60" : "bg-muted"
                  )}
                >
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, owners…"
              className="h-8 pl-8"
            />
          </div>
          <Button variant="outline" size="sm">
            <SlidersHorizontal />
            Filters
          </Button>

          {/* View toggle */}
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Card view"
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              <LayoutGrid />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <List />
            </Button>
          </div>
        </div>
      </div>

      {/* Card view — grouped by title (Asset QC style) */}
      {view === "cards" ? (
        <div className="flex flex-col gap-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-none" />
              ))
            : visibleRollups.map((r) => (
                <LibraryTitleCard
                  key={r.title.id}
                  title={r.title}
                  episodeCount={r.episodeCount}
                  statusCounts={r.statusCounts}
                  assetCounts={r.assetCounts}
                  failed={r.failed}
                />
              ))}
          {!isLoading && visibleRollups.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No titles match your filters.
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
      /* Table view — flat per-asset rows */
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assets</TableHead>
                <TableHead className="hidden sm:table-cell">Owner</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full rounded-none" />
                      </TableCell>
                    </TableRow>
                  ))
                : visible.map((ep) => {
                    return (
                      <TableRow key={ep.id} className="group">
                        <TableCell>
                          <Link
                            href={`/library/${ep.titleId}`}
                            className="flex items-center gap-3 outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <LibraryPoster
                              poster={ep.title.poster}
                              name={ep.title.name}
                            />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:underline">
                                  {ep.title.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="shrink-0"
                                >
                                  {titleTypeLabel(ep.title.type)}
                                </Badge>
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">
                                {ep.season !== null
                                  ? `${ep.label} · ${ep.code}`
                                  : ep.title.runtime}
                              </span>
                              <div className="md:hidden">
                                <LibraryStatus status={ep.status} />
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <LibraryStatus status={ep.status} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <LibraryAssetIcons assets={ep.assets} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {ep.ownerName}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {ep.updated}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              {!isLoading && visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No titles match your filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
