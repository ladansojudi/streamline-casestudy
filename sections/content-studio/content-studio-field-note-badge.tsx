"use client"

import { MessageSquare } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { TitleNote } from "@/data/db"

/** Field labels that show their notes inline (as a per-field badge). */
export const ANCHORED_FIELD_LABELS = [
  "Title synopsis",
  "Genre",
  "Cast",
  "Maturity rating",
  "Episode title",
  "Episode synopsis",
  "Runtime",
  "Air date",
  "Director",
  "Writers",
  "Guest stars",
  "Episode thumbnail",
]

/** True when a note is pinned to a field shown in the editor (so it has a badge). */
export function isAnchoredField(field: string | null) {
  if (!field) return false
  return ANCHORED_FIELD_LABELS.includes(field) || field.startsWith("Artwork · ")
}

/**
 * Marks a field that has open Publisher notes. Hover shows the note(s) the way
 * the Publisher pinned them; clicking marks them resolved — so the Editor reads
 * and clears feedback right on the section, like the review screen.
 */
export function FieldNoteBadge({
  notes,
  onResolve,
}: {
  notes: TitleNote[]
  onResolve: () => void
}) {
  if (notes.length === 0) return null
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onResolve}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-500/25 dark:text-amber-500"
          >
            <MessageSquare className="size-2.5" />
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </button>
        }
      />
      <TooltipContent
        side="top"
        align="end"
        className="max-w-xs flex-col items-start gap-1.5 text-left"
      >
        {notes.map((note) => (
          <div key={note.id} className="flex flex-col">
            <span>{note.body}</span>
            <span className="opacity-70">
              {note.author.name} · {note.ago}
            </span>
          </div>
        ))}
        <span className="opacity-70">Click the badge to mark resolved.</span>
      </TooltipContent>
    </Tooltip>
  )
}
