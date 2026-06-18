"use client"

import { useState } from "react"
import { FolderUp, Layers } from "lucide-react"

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

export function ContentStudioAddSeasonDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (episodeCount: number) => Promise<void>
}) {
  const [episodes, setEpisodes] = useState(6)
  const [running, setRunning] = useState(false)

  const add = async () => {
    setRunning(true)
    try {
      await onAdd(Math.max(1, Math.min(20, episodes)))
      onOpenChange(false)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Add a season
          </DialogTitle>
          <DialogDescription>
            Drop the season&apos;s files — we&apos;ll add the episodes and start
            uploading.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-5 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
            <FolderUp className="size-5" />
          </span>
          <p className="text-xs text-muted-foreground">
            Drop files here, or set how many episodes to add.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="season-eps">Episodes</Label>
          <Input
            id="season-eps"
            type="number"
            min={1}
            max={20}
            value={episodes}
            onChange={(e) =>
              setEpisodes(Math.max(1, Math.min(20, +e.target.value || 1)))
            }
          />
          <p className="text-xs text-muted-foreground">
            Creates a new season with{" "}
            <span className="font-medium text-foreground tabular-nums">
              {episodes}
            </span>{" "}
            episode{episodes > 1 ? "s" : ""}.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={add} disabled={running}>
            {running ? "Adding…" : "Add season"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
