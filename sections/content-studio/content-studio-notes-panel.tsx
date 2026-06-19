"use client"

import { useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  CornerDownRight,
  RotateCcw,
  Tag,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getPerson, type TitleNote } from "@/data/db"
import { useTitleNotesAll, useUpdateRow } from "@/data/hooks"

const personName = (id: string) => getPerson(id)?.name ?? "Someone"

/** One note + its conversation, with a reply box and resolve / reopen. */
function NoteThread({
  note,
  onJumpToNote,
  onReply,
  onResolve,
  onReopen,
}: {
  note: TitleNote
  onJumpToNote?: (note: TitleNote) => void
  onReply: (body: string) => Promise<void>
  onResolve?: () => void
  onReopen?: () => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [draft, setDraft] = useState("")

  const sendReply = async () => {
    if (draft.trim() === "") return
    await onReply(draft.trim())
    setDraft("")
    setReplyOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-2.5">
      <div className="flex gap-2">
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

        <button
          type="button"
          onClick={() => onJumpToNote?.(note)}
          className="min-w-0 flex-1 text-left outline-none"
          title="Go to this field"
        >
          <span
            className={cn(
              "block text-sm break-words hover:underline",
              note.resolved && "text-muted-foreground line-through"
            )}
          >
            {note.body}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {note.author.name} · {note.ago}
          </span>
        </button>

        {onResolve ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Resolve note"
            className="-mt-0.5 -mr-0.5 self-start"
            onClick={onResolve}
          >
            <Check />
          </Button>
        ) : onReopen ? (
          <Button
            variant="ghost"
            size="xs"
            className="-mt-0.5 -mr-0.5 self-start"
            onClick={onReopen}
          >
            <RotateCcw />
            Reopen
          </Button>
        ) : null}
      </div>

      {/* Conversation */}
      {note.replies?.length ? (
        <div className="ml-1 flex flex-col gap-1.5 border-l-2 border-border pl-2.5">
          {note.replies.map((r, i) => (
            <div key={i} className="leading-tight">
              <p className="text-sm break-words">{r.body}</p>
              <p className="text-xs text-muted-foreground">
                {personName(r.authorId)} · {r.ago}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Reply box (open notes only) */}
      {!note.resolved ? (
        replyOpen ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  sendReply()
                }
              }}
              placeholder="Write a reply…"
              className="h-8"
            />
            <Button size="sm" onClick={sendReply} disabled={draft.trim() === ""}>
              Send
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <CornerDownRight className="size-3" />
            Reply
          </button>
        )
      ) : null}
    </div>
  )
}

/** Persistent right-hand notes column for the returned-changes fix view. */
export function ContentStudioNotesPanel({
  titleId,
  onJumpToNote,
}: {
  titleId: string
  onJumpToNote?: (note: TitleNote) => void
}) {
  const { data: all = [] } = useTitleNotesAll(titleId)
  const updateComment = useUpdateRow("comments")
  const [showResolved, setShowResolved] = useState(false)

  const open = all.filter((n) => !n.resolved)
  const resolved = all.filter((n) => n.resolved)

  const setResolved = async (note: TitleNote, value: boolean) => {
    await updateComment.mutateAsync({ id: note.id, patch: { resolved: value } })
    toast.success(value ? "Note resolved" : "Note reopened")
  }

  const reply = async (note: TitleNote, body: string) => {
    await updateComment.mutateAsync({
      id: note.id,
      patch: {
        replies: [
          ...(note.replies ?? []),
          { authorId: "u_eren", body, ago: "just now" },
        ],
      },
    })
    toast.success("Reply sent")
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
          {open.length > 0
            ? `${open.length} open. Reply, fix, and resolve — then resubmit.`
            : "All notes resolved — you can resubmit for review."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {open.length === 0 && resolved.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing here yet.
          </p>
        ) : null}

        {open.map((note) => (
          <NoteThread
            key={note.id}
            note={note}
            onJumpToNote={onJumpToNote}
            onReply={(body) => reply(note, body)}
            onResolve={() => setResolved(note, true)}
          />
        ))}

        {/* Resolved archive */}
        {resolved.length > 0 ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowResolved((s) => !s)}
              className="flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showResolved ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Resolved ({resolved.length})
            </button>
            {showResolved
              ? resolved.map((note) => (
                  <NoteThread
                    key={note.id}
                    note={note}
                    onJumpToNote={onJumpToNote}
                    onReply={(body) => reply(note, body)}
                    onReopen={() => setResolved(note, false)}
                  />
                ))
              : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
