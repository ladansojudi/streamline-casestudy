"use client"

import { useState } from "react"
import { Layers, Plus, Target, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDeleteRow, useSegments } from "@/data/hooks"
import type { Segment } from "@/data/schema"
import { AudiencesSegmentCard } from "@/sections/audiences/audiences-segment-card"
import { AudiencesSegmentDialog } from "@/sections/audiences/audiences-segment-dialog"

export function AudiencesView() {
  const { data, isLoading } = useSegments()
  const del = useDeleteRow("segments")

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Segment | null>(null)
  const [deleting, setDeleting] = useState<Segment | null>(null)

  const allSegments = data?.all ?? []
  const usage = data?.usage ?? {}
  const targetable = allSegments.filter((s) => s.kind !== "fallback")
  const totalReach = targetable.reduce((sum, s) => sum + s.reachPercent, 0)
  const titlesPersonalized = new Set(
    targetable.flatMap((s) => (usage[s.id] ?? []).map((t) => t.id))
  ).size

  const summary = [
    { label: "Active segments", value: String(targetable.length), icon: Layers },
    { label: "Targeted reach", value: `${totalReach}%`, icon: Target },
    { label: "Personalized titles", value: String(titlesPersonalized), icon: Users },
  ]

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await del.mutateAsync(deleting.id)
    if (result === "deleted") toast.success(`Deleted “${deleting.name}”`)
    else if (result === "protected") toast.error("Sample data can't be deleted")
    else toast.error("Segment not found")
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Audiences
          </h1>
          <p className="text-sm text-muted-foreground">
            Build reusable segments and targeting rules for audience-specific
            artwork.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus />
          New segment
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summary.map((stat) => (
          <Card key={stat.label} className="px-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <stat.icon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="font-heading text-xl font-semibold tabular-nums">
                  {isLoading ? "—" : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reach composition bar */}
      {!isLoading ? (
        <Card className="px-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Reach composition
            </span>
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
              {targetable.map((s) => (
                <div
                  key={s.id}
                  className={cn("bg-linear-to-r", s.art)}
                  style={{ width: `${s.reachPercent}%` }}
                  title={`${s.name}: ${s.reachPercent}%`}
                />
              ))}
              <div
                className="bg-muted"
                style={{ width: `${Math.max(0, 100 - totalReach)}%` }}
                title="Untargeted"
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {targetable.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className={cn("size-2 rounded-full bg-linear-to-r", s.art)}
                    aria-hidden
                  />
                  {s.name}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-muted" aria-hidden />
                Untargeted ({Math.max(0, 100 - totalReach)}%)
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Segment grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-none" />
            ))
          : allSegments.map((segment) => (
              <AudiencesSegmentCard
                key={segment.id}
                segment={segment}
                usedBy={usage[segment.id] ?? []}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
      </div>

      {/* Create dialog */}
      <AudiencesSegmentDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit dialog */}
      <AudiencesSegmentDialog
        segment={editing ?? undefined}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete segment?</DialogTitle>
            <DialogDescription>
              “{deleting?.name}” will be removed. Titles using it fall back to
              the default artwork. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={del.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
