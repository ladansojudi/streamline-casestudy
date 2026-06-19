"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { MessageSquarePlus, Pause, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { posterUrl, type CommentView } from "@/data/db"

function parseRuntime(s: string): number | null {
  const m = s.match(/(\d+):(\d+)/)
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null
}

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`
}

export function ReviewPlayer({
  runtime,
  comments,
  poster,
  title,
  onPin,
}: {
  runtime: string
  comments: CommentView[]
  poster: string | null
  title: string
  /** When set, the player can pin a note to the current moment. */
  onPin?: (atPercent: number, at: string, body: string) => Promise<void>
}) {
  const pins = comments.filter((c) => c.kind === "timestamp")
  const src = posterUrl(poster, "w780")
  const totalSec = parseRuntime(runtime) || 354

  const [playing, setPlaying] = useState(false)
  const [currentSec, setCurrentSec] = useState(0)
  const [composerOpen, setComposerOpen] = useState(false)
  const [draft, setDraft] = useState("")

  // Simulated playback — the playhead sweeps the clip in ~30s of real time.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setCurrentSec((s) => Math.min(totalSec, s + totalSec / 120))
    }, 250)
    return () => clearInterval(id)
  }, [playing, totalSec])

  useEffect(() => {
    if (currentSec >= totalSec) setPlaying(false)
  }, [currentSec, totalSec])

  const percent = Math.min(100, (currentSec / totalSec) * 100)

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    )
    setCurrentSec((pct / 100) * totalSec)
  }

  const startNote = () => {
    setPlaying(false)
    setComposerOpen(true)
  }

  const pin = async () => {
    if (draft.trim() === "" || !onPin) return
    await onPin(Math.round(percent), fmt(currentSec), draft.trim())
    setComposerOpen(false)
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Preview surface */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-linear-to-br from-slate-800 to-slate-950 ring-1 ring-foreground/10">
        {src ? (
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className={cn("object-cover", playing ? "opacity-60" : "opacity-80")}
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30" />
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="absolute inset-0 flex items-center justify-center outline-none"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-background/15 text-white backdrop-blur-sm ring-1 ring-white/20 transition-transform hover:scale-105">
            {playing ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 translate-x-0.5 fill-current" />
            )}
          </span>
        </button>
        <div className="absolute bottom-2 left-3 text-xs font-medium text-white/90 tabular-nums">
          {fmt(currentSec)} / {runtime === "—" ? fmt(totalSec) : runtime}
        </div>
      </div>

      {/* Control bar: play/pause · scrubber (with pins) · time */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 translate-x-px fill-current" />
          )}
        </Button>

        <div className="relative h-6 flex-1 cursor-pointer" onClick={seek}>
          <div className="pointer-events-none absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
            style={{ left: `${percent}%` }}
          />
          {pins.map((p) => (
          <Tooltip key={p.id}>
            <TooltipTrigger
              render={
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentSec(((p.atPercent ?? 0) / 100) * totalSec)
                  }}
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-2 ring-card transition-transform hover:scale-125"
                  style={{ left: `${p.atPercent ?? 0}%` }}
                  aria-label={`Comment at ${p.at}`}
                />
              }
            />
            <TooltipContent className="max-w-56">
              <span className="font-mono text-[10px] opacity-70">{p.at}</span>{" "}
              {p.body}
            </TooltipContent>
          </Tooltip>
          ))}
        </div>

        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {fmt(currentSec)} / {runtime === "—" ? fmt(totalSec) : runtime}
        </span>

        {onPin ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={startNote}
          >
            <MessageSquarePlus />
            Comment
          </Button>
        ) : null}
      </div>

      {/* Pause-and-comment composer (like Hotjar) */}
      {onPin && composerOpen ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquarePlus className="size-3.5 text-primary" />
            Comment at{" "}
            <span className="font-mono tabular-nums text-foreground">
              {fmt(currentSec)}
            </span>
          </div>
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                pin()
              }
            }}
            placeholder="Write your note for this moment…"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setComposerOpen(false)
                setDraft("")
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={pin} disabled={draft.trim() === ""}>
              Save
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
