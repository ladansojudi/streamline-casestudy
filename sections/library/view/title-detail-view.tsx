"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clapperboard, Film } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { isEpisodicTitle, posterUrl, titleTypeLabel, type EpisodeStatus } from "@/data/db"
import { useTitleDetail } from "@/data/hooks"
import { LibraryAssetCounts } from "@/sections/library/library-asset-counts"
import { LibraryAssetIcons } from "@/sections/library/library-asset-icons"
import { LibraryStatus } from "@/sections/library/library-status"
import { statusMeta } from "@/sections/library/library-data"

const healthOrder: EpisodeStatus[] = [
  "draft",
  "uploading",
  "ready",
  "in-review",
  "changes",
  "published",
]

export function TitleDetailView({ titleId }: { titleId: string }) {
  const { data, isLoading } = useTitleDetail(titleId)
  const [filter, setFilter] = useState<"all" | EpisodeStatus>("all")

  const episodes = useMemo(() => data?.episodes ?? [], [data])
  const visible = useMemo(
    () => (filter === "all" ? episodes : episodes.filter((e) => e.status === filter)),
    [episodes, filter]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <Skeleton className="h-6 w-24 rounded-none" />
        <Skeleton className="h-40 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-muted-foreground">Title not found.</p>
        <Button variant="outline" size="sm" render={<Link href="/library" />}>
          <ArrowLeft />
          Back to Library
        </Button>
      </div>
    )
  }

  const { title, statusCounts, assetCounts } = data
  const poster = posterUrl(title.poster, "w342")
  const failed = statusCounts.changes
  const TypeIcon = isEpisodicTitle(title.type) ? Clapperboard : Film

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Breadcrumb / back */}
      <Link
        href="/library"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Library
      </Link>

      {/* Title header */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
            {poster ? (
              <Image
                src={poster}
                alt={title.name}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <TypeIcon className="size-6" />
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {title.name}
                </h1>
                <Badge variant="outline">
                  {titleTypeLabel(title.type)}
                </Badge>
                {failed > 0 ? (
                  <Badge variant="destructive">{failed} need fixes</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {title.genre} · {title.runtime} · {episodes.length}{" "}
                {episodes.length === 1 ? "episode" : "episodes"}
              </p>
              <p className="line-clamp-2 max-w-prose text-sm text-muted-foreground">
                {title.synopsis}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <LibraryAssetCounts counts={assetCounts} total={episodes.length} />
              <Button
                size="sm"
                render={<Link href={`/content-studio/${title.id}`} />}
              >
                Open in Content Studio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status filter tabs */}
      <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
            filter === "all"
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All
          <span className="rounded bg-muted px-1 text-xs tabular-nums">
            {episodes.length}
          </span>
        </button>
        {healthOrder.map((status) => {
          const n = statusCounts[status]
          if (n === 0) return null
          const active = filter === status
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusMeta[status].dot)} />
              {statusMeta[status].label}
              <span
                className={cn(
                  "rounded px-1 text-xs tabular-nums",
                  active ? "bg-background/60" : "bg-muted"
                )}
              >
                {n}
              </span>
            </button>
          )
        })}
      </div>

      {/* Episode / asset list */}
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Episode</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Assets</TableHead>
                <TableHead className="hidden sm:table-cell">Size</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{ep.episodeTitle}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {ep.season !== null ? `${ep.label} · ${ep.code}` : "Feature"}
                      </span>
                      <div className="md:hidden">
                        <LibraryStatus status={ep.status} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <LibraryStatus status={ep.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <LibraryAssetIcons assets={ep.assets} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                    {ep.size}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {ep.updated}
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No episodes in this status.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
