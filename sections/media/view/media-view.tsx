"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, Lock, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { mediaUrl, type Media } from "@/data/db"
import { useCreateRow, useDeleteRow, useMedia } from "@/data/hooks"
import { isSeedRow } from "@/data/store"
import { readImageFile } from "@/sections/media/read-image-file"

export function MediaView() {
  const { data: items = [], isLoading } = useMedia()
  const create = useCreateRow("media", "md")
  const del = useDeleteRow("media")
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<Media | null>(null)

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue
        const url = await readImageFile(file)
        await create.mutateAsync({
          name: file.name.replace(/\.[^.]+$/, ""),
          url,
          kind: "art",
          titleId: null,
        })
      }
      toast.success("Image added to your media")
    } catch {
      toast.error("Couldn't read that image")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const result = await del.mutateAsync(deleting.id)
    if (result === "deleted") toast.success(`Deleted “${deleting.name}”`)
    else if (result === "protected") toast.error("Sample media can't be deleted")
    else toast.error("Couldn't delete that")
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Media Library
          </h1>
          <p className="text-sm text-muted-foreground">
            Images you can assign to title posters and audience thumbnails.
          </p>
        </div>
        <Button
          size="sm"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          <Upload />
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-none" />
            ))
          : items.map((m) => {
              const src = mediaUrl(m.url, "w342")
              const seed = isSeedRow("media", m.id)
              return (
                <Card key={m.id} className="group overflow-hidden">
                  <CardContent className="flex flex-col gap-2 px-0">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      {src ? (
                        <Image
                          src={src}
                          alt={m.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 240px"
                          className="object-cover"
                        />
                      ) : null}
                      {seed ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded bg-black/50 text-white">
                                <Lock className="size-3" />
                              </span>
                            }
                          />
                          <TooltipContent>Sample media</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${m.name}`}
                          className="absolute right-1.5 top-1.5 bg-black/50 text-white opacity-0 hover:bg-black/70 group-hover:opacity-100"
                          onClick={() => setDeleting(m)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 pb-1">
                      <span className="truncate text-sm font-medium">
                        {m.name}
                      </span>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {m.kind}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

        {/* Upload tile */}
        {!isLoading ? (
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <ImagePlus className="size-5" />
            <span className="text-xs font-medium">Upload</span>
          </button>
        ) : null}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete image?</DialogTitle>
            <DialogDescription>
              “{deleting?.name}” will be removed. Thumbnails using it fall back
              to the title poster.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleting(null)}>
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
