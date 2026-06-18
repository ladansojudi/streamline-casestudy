"use client"

import Image from "next/image"
import { Play } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { posterUrl, type CommentView } from "@/data/db"

export function ReviewPlayer({
  runtime,
  comments,
  poster,
  title,
}: {
  runtime: string
  comments: CommentView[]
  poster: string | null
  title: string
}) {
  const pins = comments.filter((c) => c.kind === "timestamp")
  const src = posterUrl(poster, "w780")

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
            className="object-cover opacity-80"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-background/15 text-white backdrop-blur-sm ring-1 ring-white/20">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
        </div>
        <div className="absolute bottom-2 left-3 text-xs font-medium text-white/90 tabular-nums">
          00:00 / {runtime}
        </div>
      </div>

      {/* Scrubber with pinned comment markers */}
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted">
          <div className="h-full w-[23%] rounded-full bg-primary/70" />
        </div>
        {pins.map((pin) => (
          <Tooltip key={pin.id}>
            <TooltipTrigger
              render={
                <button
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 ring-2 ring-card transition-transform hover:scale-125"
                  style={{ left: `${pin.atPercent ?? 0}%` }}
                  aria-label={`Comment at ${pin.at}`}
                />
              }
            />
            <TooltipContent className="max-w-56">
              <span className="font-mono text-[10px] opacity-70">{pin.at}</span>{" "}
              {pin.body}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
