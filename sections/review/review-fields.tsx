"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon, MessageSquarePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  mediaUrl,
  posterUrl,
  type CommentView,
  type EpisodeView,
  type ThumbnailView,
} from "@/data/db"
import { useCreateRow, useMediaForTitle } from "@/data/hooks"

type AddNote = (field: string, body: string) => Promise<void>

/** A labelled value with an inline "pin a note to this field" composer. */
function FieldRow({
  label,
  value,
  openNotes,
  onAddNote,
}: {
  label: string
  value: string
  openNotes: number
  onAddNote: (body: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")

  const submit = async () => {
    if (draft.trim() === "") return
    await onAddNote(draft.trim())
    setDraft("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">
            {value ? (
              value
            ) : (
              <span className="text-muted-foreground italic">Not provided</span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="shrink-0"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageSquarePlus />
          {openNotes > 0 ? `${openNotes} note${openNotes > 1 ? "s" : ""}` : "Note"}
        </Button>
      </div>
      {open ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Note on ${label}…`}
            className="h-8"
          />
          <Button size="sm" onClick={submit} disabled={draft.trim() === ""}>
            Pin
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** An artwork tile with its own note composer below it. */
function ArtworkTile({
  src,
  caption,
  field,
  openNotes,
  onAddNote,
}: {
  src: string | null
  caption: string
  field: string
  openNotes: number
  onAddNote: (body: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")

  const submit = async () => {
    if (draft.trim() === "") return
    await onAddNote(draft.trim())
    setDraft("")
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
        {src ? (
          <Image src={src} alt={caption} fill sizes="200px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-xs">{caption}</span>
        <Button
          variant="ghost"
          size="xs"
          className="shrink-0"
          onClick={() => setOpen((o) => !o)}
        >
          <MessageSquarePlus />
          {openNotes > 0 ? openNotes : ""}
        </Button>
      </div>
      {open ? (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={`Note on ${field}…`}
            className="h-8"
          />
          <Button size="sm" onClick={submit} disabled={draft.trim() === ""}>
            Pin
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function ReviewFields({
  item,
  thumbnails,
  comments,
}: {
  item: EpisodeView
  thumbnails: ThumbnailView[]
  comments: CommentView[]
}) {
  const createComment = useCreateRow("comments", "cm")
  const { data: media = [] } = useMediaForTitle(item.titleId)

  const addNote: AddNote = async (field, body) => {
    await createComment.mutateAsync({
      episodeId: item.id,
      kind: "field",
      at: null,
      atPercent: null,
      field,
      body,
      authorId: "u_maya",
      ago: "just now",
      resolved: false,
    })
    toast.success(`Note pinned to ${field}`)
  }

  const openNotesFor = (field: string) =>
    comments.filter((c) => c.kind === "field" && c.field === field && !c.resolved)
      .length

  const titleFields = [
    { label: "Title synopsis", value: item.title.synopsis },
    { label: "Genre", value: item.title.genre },
    { label: "Cast", value: item.title.cast ?? "" },
    { label: "Maturity rating", value: item.title.maturityRating ?? "" },
  ]
  const episodeFields = [
    { label: "Episode title", value: item.episodeTitle },
    { label: "Episode synopsis", value: item.episodeSynopsis ?? "" },
    { label: "Runtime", value: item.runtime ?? "" },
    { label: "Air date", value: item.releaseDate ?? "" },
    { label: "Director", value: item.director ?? "" },
    { label: "Writers", value: item.writers ?? "" },
    { label: "Guest stars", value: item.guestStars ?? "" },
  ]

  const episodeThumb = media.find((m) => m.id === item.thumbnailMediaId)
  const fallback = posterUrl(item.title.poster, "w342")
  const artworks = [
    ...thumbnails
      .filter((v) => v.segment.kind !== "fallback")
      .map((v) => ({
        key: v.id,
        caption: v.segment.name,
        field: `Artwork · ${v.segment.name}`,
        src: mediaUrl(v.media?.url, "w342") ?? fallback,
      })),
    {
      key: "episode-thumb",
      caption: "Episode thumbnail",
      field: "Episode thumbnail",
      src: mediaUrl(episodeThumb?.url, "w342") ?? fallback,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Artwork</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {artworks.map((a) => (
            <ArtworkTile
              key={a.key}
              src={a.src}
              caption={a.caption}
              field={a.field}
              openNotes={openNotesFor(a.field)}
              onAddNote={(b) => addNote(a.field, b)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Title metadata</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {titleFields.map((f) => (
            <FieldRow
              key={f.label}
              label={f.label}
              value={f.value}
              openNotes={openNotesFor(f.label)}
              onAddNote={(b) => addNote(f.label, b)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Episode metadata</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {episodeFields.map((f) => (
            <FieldRow
              key={f.label}
              label={f.label}
              value={f.value}
              openNotes={openNotesFor(f.label)}
              onAddNote={(b) => addNote(f.label, b)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
