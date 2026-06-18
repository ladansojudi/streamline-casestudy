"use client"

import { Check, Clock, RotateCcw, Tag } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useTitleNotes, useUpdateRow } from "@/data/hooks"
import type { TitleNote } from "@/data/db"

/** Persistent right-hand notes column for the returned-changes fix view. */
export function ContentStudioNotesPanel({
  titleId,
  onJumpToNote,
}: {
  titleId: string
  onJumpToNote?: (note: TitleNote) => void
}) {
  const { data: notes = [] } = useTitleNotes(titleId)
  const updateComment = useUpdateRow("comments")

  const resolve = async (id: string) => {
    await updateComment.mutateAsync({ id, patch: { resolved: true } })
    toast.success("Note resolved")
  }

  return (
    <Card
      data-tour="feedback"
      className="border border-amber-500/30 bg-amber-50/60 ring-0 transition-shadow dark:bg-amber-950/20"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <RotateCcw className="size-4 text-amber-600 dark:text-amber-500" />
          Publisher notes
        </CardTitle>
        <CardDescription>
          {notes.length > 0
            ? `${notes.length} open. Fix each and resolve, then resubmit.`
            : "All notes resolved — you can resubmit for review."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing open.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex gap-2 rounded-md border border-border bg-background p-2.5"
            >
              <button
                type="button"
                onClick={() => onJumpToNote?.(note)}
                className="flex min-w-0 flex-1 gap-2 text-left outline-none"
                title="Go to this field"
              >
                <span
                  className={cn(
                    "flex h-5 shrink-0 items-center gap-1 rounded px-1 text-[10px] font-medium",
                    note.kind === "timestamp"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                  )}
                >
                  {note.kind === "timestamp" ? (
                    <>
                      <Clock className="size-2.5" />
                      <span className="font-mono tabular-nums">{note.at}</span>
                    </>
                  ) : (
                    <>
                      <Tag className="size-2.5" />
                      {note.field}
                    </>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm break-words hover:underline">
                    {note.body}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {note.author.name}
                    {note.episodeLabel ? ` · ${note.episodeLabel}` : ""} ·{" "}
                    {note.ago}
                  </span>
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Resolve note"
                className="-mt-0.5 -mr-0.5 self-start"
                onClick={() => resolve(note.id)}
                disabled={updateComment.isPending}
              >
                <Check />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
