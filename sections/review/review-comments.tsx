"use client"

import { useState } from "react"
import { Check, Clock, CornerDownRight, RotateCcw, Tag } from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getPerson, type CommentView } from "@/data/db"
import { useCreateRow, useUpdateRow } from "@/data/hooks"

const personName = (id: string) => getPerson(id)?.name ?? "Someone"

function CommentItem({
  comment,
  onToggleResolved,
  onReply,
}: {
  comment: CommentView
  onToggleResolved: () => void
  onReply: (body: string) => Promise<void>
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
    <li
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3",
        comment.resolved ? "border-border bg-muted/30" : "border-border"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "flex h-6 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] font-medium",
            comment.kind === "timestamp"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
          )}
        >
          {comment.kind === "timestamp" ? (
            <>
              <Clock className="size-3" />
              <span className="font-mono tabular-nums">{comment.at}</span>
            </>
          ) : (
            <>
              <Tag className="size-3" />
              {comment.field}
            </>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm", comment.resolved && "line-through")}>
            {comment.body}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {comment.author.name} · {comment.ago}
          </p>
        </div>

        <Button
          variant="ghost"
          size="xs"
          className="-mt-1 -mr-1 self-start"
          onClick={onToggleResolved}
        >
          {comment.resolved ? (
            <>
              <RotateCcw />
              Reopen
            </>
          ) : (
            <>
              <Check />
              Resolve
            </>
          )}
        </Button>
      </div>

      {comment.replies?.length ? (
        <div className="ml-1 flex flex-col gap-1.5 border-l-2 border-border pl-2.5">
          {comment.replies.map((r, i) => (
            <div key={i} className="leading-tight">
              <p className="text-sm break-words">{r.body}</p>
              <p className="text-xs text-muted-foreground">
                {personName(r.authorId)} · {r.ago}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {replyOpen ? (
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
      )}
    </li>
  )
}

export function ReviewComments({
  episodeId,
  comments,
}: {
  episodeId: string
  comments: CommentView[]
}) {
  const open = comments.filter((c) => !c.resolved).length
  const updateComment = useUpdateRow("comments")
  const createComment = useCreateRow("comments", "cm")
  const [draft, setDraft] = useState("")

  const toggleResolved = (id: string, resolved: boolean) =>
    updateComment.mutate({ id, patch: { resolved: !resolved } })

  const reply = async (comment: CommentView, body: string) => {
    await updateComment.mutateAsync({
      id: comment.id,
      patch: {
        replies: [
          ...(comment.replies ?? []),
          { authorId: "u_maya", body, ago: "just now" },
        ],
      },
    })
    toast.success("Reply sent")
  }

  const addComment = async () => {
    if (draft.trim() === "") return
    await createComment.mutateAsync({
      episodeId,
      kind: "field",
      at: null,
      atPercent: null,
      field: "General",
      body: draft.trim(),
      authorId: "u_maya",
      ago: "just now",
      resolved: false,
    })
    setDraft("")
    toast.success("Comment pinned")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Comments
          <span className="ml-1.5 text-muted-foreground tabular-nums">
            {open} open
          </span>
        </h3>
        <span className="text-xs text-muted-foreground">
          Pinned to a timestamp or a field
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          No comments yet. Pin one to the current frame or a field below.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onToggleResolved={() =>
                toggleResolved(comment.id, comment.resolved)
              }
              onReply={(body) => reply(comment, body)}
            />
          ))}
        </ul>
      )}

      {/* Add comment */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addComment()
            }
          }}
          placeholder="Add a comment — pin it to the current frame…"
          className="h-8"
        />
        <Button size="sm" onClick={addComment} disabled={draft.trim() === ""}>
          Pin
        </Button>
      </div>
    </div>
  )
}
