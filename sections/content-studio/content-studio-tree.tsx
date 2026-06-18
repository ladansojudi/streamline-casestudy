"use client"

import { useState } from "react"
import {
  CheckCircle2,
  Clapperboard,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContentStudioAddSeasonDialog } from "@/sections/content-studio/content-studio-add-season-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { isSeedRow } from "@/data/store"
import type { TitleNote } from "@/data/db"
import type {
  EpisodeNode,
  NodeStatus,
  Selection,
  SeriesTree,
} from "@/sections/content-studio/content-studio-data"

/** Amber marker on a node with open notes — hover to read them. */
function NoteDot({ notes }: { notes: TitleNote[] }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-500">
            <MessageSquare className="size-2.5" />
            {notes.length}
          </span>
        }
      />
      <TooltipContent
        side="right"
        align="start"
        className="max-w-xs flex-col items-start gap-1.5 text-left"
      >
        {notes.map((note) => (
          <div key={note.id} className="flex flex-col">
            <span className="opacity-70">
              {note.kind === "timestamp" ? `At ${note.at}` : note.field}
            </span>
            <span>{note.body}</span>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

const statusDot: Record<NodeStatus, string> = {
  ready: "bg-emerald-500",
  uploading: "bg-sky-500",
  queued: "bg-muted-foreground/40",
  failed: "bg-destructive",
}

function EpisodeStatus({ episode }: { episode: EpisodeNode }) {
  switch (episode.status) {
    case "ready":
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500">
          <CheckCircle2 className="size-3.5" />
          Ready
        </span>
      )
    case "uploading":
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Loader2 className="size-3.5 animate-spin" />
          {episode.progress}%
        </span>
      )
    case "queued":
      return <span className="text-xs text-muted-foreground">Queued</span>
    case "failed":
      return (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <RefreshCw className="size-3.5" />
          Failed
        </span>
      )
  }
}

export function ContentStudioTree({
  tree,
  selection,
  onSelect,
  onAddSeason,
  onAddEpisode,
  onRemoveSeason,
  onRemoveEpisode,
  locked = false,
  invalid = false,
  noteGroups,
}: {
  tree: SeriesTree
  selection: Selection
  onSelect: (selection: Selection) => void
  /** Adds a season with the chosen number of (uploading) episodes. */
  onAddSeason: (episodeCount: number) => Promise<void>
  onAddEpisode: (seasonId: string) => void
  onRemoveSeason: (seasonId: string) => void
  onRemoveEpisode: (episodeId: string) => void
  /** In review: keep navigation, but hide structure-editing affordances. */
  locked?: boolean
  /** A failed Submit attempt with no structure yet — highlight in red. */
  invalid?: boolean
  /** Open Publisher notes per node — hover the badge to read them. */
  noteGroups?: { title: TitleNote[]; byEpisode: Record<string, TitleNote[]> }
}) {
  const titleActive = selection.kind === "title"
  const [seasonOpen, setSeasonOpen] = useState(false)

  return (
    <Card
      data-tour="hierarchy"
      className={cn("transition-shadow", invalid && "ring-2 ring-destructive/60")}
    >
      <CardHeader>
        <CardTitle>Structure</CardTitle>
        <CardDescription className={cn(invalid && "text-destructive")}>
          {invalid
            ? "Upload files to build the Season → Episode structure before submitting."
            : "Auto-built from your files. Select a level to edit it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {/* Title node */}
        <button
          onClick={() => onSelect({ kind: "title" })}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium transition-colors",
            titleActive ? "bg-accent" : "hover:bg-muted/60"
          )}
        >
          <Clapperboard className="size-4 text-primary" />
          <span className="flex-1 truncate">{tree.title}</span>
          {noteGroups?.title.length ? (
            <NoteDot notes={noteGroups.title} />
          ) : null}
          <span className="text-[11px] font-normal text-muted-foreground">
            Title
          </span>
        </button>

        {/* Seasons + episodes */}
        {tree.seasons.map((season) => {
          const seasonActive =
            selection.kind === "season" &&
            selection.seasonId === season.seasonId
          const seasonIsSeed =
            season.seasonId !== null && isSeedRow("seasons", season.seasonId)
          return (
            <div key={season.seasonId ?? "loose"} className="flex flex-col">
              {/* Season header row */}
              <div
                className={cn(
                  "group ml-2 flex items-center gap-1 rounded-md pr-1 transition-colors",
                  seasonActive ? "bg-accent" : "hover:bg-muted/60"
                )}
              >
                <button
                  disabled={season.seasonId === null}
                  onClick={() =>
                    season.seasonId &&
                    onSelect({ kind: "season", seasonId: season.seasonId })
                  }
                  className="flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm font-medium disabled:cursor-default"
                >
                  <Layers className="size-3.5 text-muted-foreground" />
                  <span className="flex-1">{season.label}</span>
                  <Badge variant="secondary">{season.episodes.length}</Badge>
                </button>
                {season.seasonId && !locked ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Add episode"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => onAddEpisode(season.seasonId!)}
                    >
                      <Plus />
                    </Button>
                    {!seasonIsSeed ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remove season"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => onRemoveSeason(season.seasonId!)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="ml-4 flex flex-col border-l border-border pl-3">
                {season.episodes.map((episode) => {
                  const active =
                    selection.kind === "episode" &&
                    selection.episodeId === episode.id
                  const epIsSeed = isSeedRow("episodes", episode.id)
                  return (
                    <div
                      key={episode.id}
                      className={cn(
                        "group flex items-center gap-1 rounded-md pr-1 transition-colors",
                        active ? "bg-accent" : "hover:bg-muted/60"
                      )}
                    >
                      <button
                        onClick={() =>
                          onSelect({ kind: "episode", episodeId: episode.id })
                        }
                        className="flex flex-1 items-center gap-3 px-2 py-2 text-left"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            statusDot[episode.status]
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {episode.label}
                            </span>
                            {noteGroups?.byEpisode[episode.id]?.length ? (
                              <NoteDot notes={noteGroups.byEpisode[episode.id]} />
                            ) : episode.missing.length > 0 ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-500">
                                {episode.missing.length} to prep
                              </span>
                            ) : null}
                          </div>
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {episode.file}
                          </span>
                        </div>
                        <EpisodeStatus episode={episode} />
                      </button>
                      {!epIsSeed && !locked ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Remove episode"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => onRemoveEpisode(episode.id)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Add season */}
        {!locked ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 justify-start text-muted-foreground"
            onClick={() => setSeasonOpen(true)}
          >
            <Plus />
            Add season
          </Button>
        ) : null}
      </CardContent>

      <ContentStudioAddSeasonDialog
        open={seasonOpen}
        onOpenChange={setSeasonOpen}
        onAdd={onAddSeason}
      />
    </Card>
  )
}
