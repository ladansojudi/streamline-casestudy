import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clapperboard, Film } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  isEpisodicTitle,
  posterUrl,
  titleTypeLabel,
  type AssetKey,
  type EpisodeStatus,
  type Title,
} from "@/data/db"
import { LibraryAssetCounts } from "@/sections/library/library-asset-counts"

export function LibraryTitleCard({
  title,
  episodeCount,
  statusCounts,
  assetCounts,
  failed,
}: {
  title: Title
  episodeCount: number
  statusCounts: Record<EpisodeStatus, number>
  assetCounts: Record<AssetKey, number>
  failed: number
}) {
  const poster = posterUrl(title.poster, "w185")
  const TypeIcon = isEpisodicTitle(title.type) ? Clapperboard : Film

  return (
    <Card className="transition-colors hover:bg-muted/40">
      <Link
        href={`/library/${title.id}`}
        className="flex items-center gap-4 px-4 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {/* Poster */}
        <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 sm:w-36">
          {poster ? (
            <Image
              src={poster}
              alt={title.name}
              fill
              sizes="144px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <TypeIcon className="size-5" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{title.name}</span>
            <Badge variant="outline" className="shrink-0">
              {titleTypeLabel(title.type)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {title.genre} · {episodeCount}{" "}
            {episodeCount === 1 ? "episode" : "episodes"}
          </p>
          {failed > 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              {failed} need fixes
            </span>
          ) : statusCounts.published === episodeCount && episodeCount > 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              All published
            </span>
          ) : null}
        </div>

        {/* Per-asset-type counts (Asset QC style) */}
        <div className="hidden md:block">
          <LibraryAssetCounts counts={assetCounts} total={episodeCount} size="sm" />
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </Card>
  )
}
