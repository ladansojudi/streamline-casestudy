"use client"

import { useState } from "react"
import { CheckCircle2, FolderUp, RefreshCw, Sparkles, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isEpisodicTitle, type TitleType } from "@/data/schema"

const clampEpisodes = (n: number) => Math.max(1, Math.min(20, Math.trunc(n) || 1))

export function ContentStudioDropzone({
  titleType,
  onSimulate,
  hasStructure = false,
}: {
  titleType: TitleType
  onSimulate: (episodesPerSeason: number[]) => Promise<void>
  /** Files already dropped → collapse the prompt into an "add more" bar. */
  hasStructure?: boolean
}) {
  const [open, setOpen] = useState(false)
  // One entry per season — each holds that season's episode count, so seasons
  // can differ (S1: 8, S2: 10, …) instead of a single uniform number.
  const [episodeCounts, setEpisodeCounts] = useState<number[]>([8, 10])
  const [running, setRunning] = useState(false)

  const isFilm = !isEpisodicTitle(titleType)
  const totalEpisodes = episodeCounts.reduce((sum, n) => sum + n, 0)

  const setSeasonCount = (next: number) => {
    const count = Math.max(1, Math.min(10, Math.trunc(next) || 1))
    setEpisodeCounts((prev) => {
      if (count <= prev.length) return prev.slice(0, count)
      const fill = prev.at(-1) ?? 8
      return [...prev, ...Array(count - prev.length).fill(fill)]
    })
  }

  const setEpisodesAt = (index: number, value: number) =>
    setEpisodeCounts((prev) =>
      prev.map((n, i) => (i === index ? clampEpisodes(value) : n))
    )

  const run = async () => {
    setRunning(true)
    try {
      await onSimulate(isFilm ? [1] : episodeCounts)
      setOpen(false)
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      {hasStructure ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" />
            {isFilm
              ? "Feature uploaded — details below."
              : "Files uploaded — structure built below."}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setOpen(true)}
          >
            <RefreshCw />
            Replace files
          </Button>
        </div>
      ) : (
        <div className="group relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/50">
          <span className="flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
            <FolderUp className="size-5" />
          </span>
          <div className="grid gap-1">
            <p className="text-sm font-medium">
              Drop video files or a folder to start a title
            </p>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              We&apos;ll detect the Series → Season → Episode structure for you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Browse files
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
              <Wand2 />
              Upload sample files
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              {hasStructure ? "Re-detected structure" : "Detected structure"}
            </DialogTitle>
            <DialogDescription>
              {isFilm
                ? "We detected a single feature file. Confirm to add it."
                : hasStructure
                  ? "We re-read your files. Confirm to replace the current structure, or adjust below."
                  : "We read your files and proposed this layout. Confirm, or adjust it below."}
            </DialogDescription>
          </DialogHeader>

          {/* What the app detected — editable proposal */}
          <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            {isFilm ? (
              <span>
                Detected <span className="font-medium">1 feature file</span>.
              </span>
            ) : (
              <span>
                Detected{" "}
                <span className="font-medium tabular-nums">
                  {episodeCounts.length} season
                  {episodeCounts.length > 1 ? "s" : ""} · {totalEpisodes} episodes
                </span>{" "}
                — adjust if it&apos;s off.
              </span>
            )}
          </div>

          {!isFilm ? (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sim-seasons">Seasons</Label>
                <Input
                  id="sim-seasons"
                  type="number"
                  min={1}
                  max={10}
                  value={episodeCounts.length}
                  onChange={(e) => setSeasonCount(+e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label>Episodes per season</Label>
                <div className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-0.5">
                  {episodeCounts.map((count, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="w-12 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                        S{i + 1}
                      </span>
                      <Input
                        aria-label={`Season ${i + 1} episodes`}
                        type="number"
                        min={1}
                        max={20}
                        value={count}
                        onChange={(e) => setEpisodesAt(i, +e.target.value)}
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={run} disabled={running}>
              {running ? "Building…" : "Confirm & build"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
