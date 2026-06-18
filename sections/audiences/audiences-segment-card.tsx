import Image from "next/image"
import {
  Clock,
  Globe,
  Heart,
  Layers,
  Lock,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { posterUrl, type Segment, type SegmentKind, type Title } from "@/data/db"
import { isSeedRow } from "@/data/store"

const kindMeta: Record<SegmentKind, { label: string; icon: LucideIcon }> = {
  fallback: { label: "Fallback", icon: Layers },
  region: { label: "Region", icon: Globe },
  behavior: { label: "Behavior", icon: Clock },
  taste: { label: "Taste", icon: Heart },
}

export function AudiencesSegmentCard({
  segment,
  usedBy,
  onEdit,
  onDelete,
}: {
  segment: Segment
  usedBy: Title[]
  onEdit?: (segment: Segment) => void
  onDelete?: (segment: Segment) => void
}) {
  const meta = kindMeta[segment.kind]
  const Icon = meta.icon
  const isFallback = segment.kind === "fallback"
  const isSeed = isSeedRow("segments", segment.id)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Header: art swatch + name + kind */}
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "size-10 shrink-0 rounded-md bg-linear-to-br ring-1 ring-foreground/10",
              segment.art
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium">{segment.name}</h3>
              <Badge variant="outline" className="shrink-0 gap-1">
                <Icon className="size-3" />
                {meta.label}
              </Badge>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {segment.description}
            </p>
          </div>
          {!isFallback ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit segment"
                onClick={() => onEdit?.(segment)}
              >
                <Pencil />
              </Button>
              {isSeed ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Sample segment — protected"
                        disabled
                      >
                        <Lock />
                      </Button>
                    }
                  />
                  <TooltipContent>Sample data — can&apos;t delete</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete segment"
                  onClick={() => onDelete?.(segment)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Reach */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Estimated reach</span>
            <span className="font-medium tabular-nums">
              {segment.members}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-linear-to-r", segment.art)}
              style={{ width: `${segment.reachPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {segment.reachPercent}% of audience
          </span>
        </div>

        {/* Targeting rules */}
        {segment.rules.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Targeting rules
            </span>
            <div className="flex flex-col gap-1">
              {segment.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                >
                  <span className="font-medium">{rule.field}</span>
                  <span className="text-muted-foreground">{rule.op}</span>
                  <span className="font-mono text-[11px]">{rule.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
            No rules — applies when nothing more specific matches.
          </p>
        )}

        {/* Usage */}
        <div className="flex items-center justify-between border-t pt-3 text-xs">
          <span className="text-muted-foreground">
            Used by{" "}
            <span className="font-medium text-foreground tabular-nums">
              {usedBy.length}
            </span>{" "}
            {usedBy.length === 1 ? "title" : "titles"}
          </span>
          <div className="flex -space-x-1.5">
            {usedBy.slice(0, 5).map((title) => {
              const src = posterUrl(title.poster, "w185")
              return (
                <span
                  key={title.id}
                  title={title.name}
                  className="relative size-6 overflow-hidden rounded-full bg-secondary ring-2 ring-card"
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={title.name}
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[9px] font-medium uppercase">
                      {title.name.slice(0, 1)}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
