"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Check, ImagePlus, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { mediaUrl } from "@/data/db"
import { useCreateRow, useMediaForTitle } from "@/data/hooks"
import { readImageFile } from "@/sections/media/read-image-file"

export function ImagePickerDialog({
  titleId,
  currentMediaId,
  open,
  onOpenChange,
  onPick,
}: {
  titleId: string
  currentMediaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null clears the assignment (falls back to title poster). */
  onPick: (mediaId: string | null) => void
}) {
  const { data: items = [] } = useMediaForTitle(titleId)
  const create = useCreateRow("media", "md")
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    setUploading(true)
    try {
      const url = await readImageFile(file)
      const created = await create.mutateAsync({
        name: file.name.replace(/\.[^.]+$/, ""),
        url,
        kind: "art",
        titleId,
      })
      onPick(created.id)
      toast.success("Image uploaded and selected")
      onOpenChange(false)
    } catch {
      toast.error("Couldn't read that image")
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
          <DialogDescription>
            Pick from your media library or upload a new image.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {items.map((m) => {
            const src = mediaUrl(m.url, "w342")
            const selected = m.id === currentMediaId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  onPick(m.id)
                  onOpenChange(false)
                }}
                className={cn(
                  "group relative aspect-video w-full overflow-hidden rounded-md bg-muted ring-1 transition-all",
                  selected
                    ? "ring-2 ring-primary"
                    : "ring-foreground/10 hover:ring-foreground/30"
                )}
              >
                {src ? (
                  <Image
                    src={src}
                    alt={m.name}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                ) : null}
                {selected ? (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1.5 py-1 text-left text-[10px] text-white">
                  {m.name}
                </span>
              </button>
            )
          })}

          {/* Upload tile */}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            {uploading ? (
              <Upload className="size-5 animate-pulse" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading…" : "Upload"}
            </span>
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={!currentMediaId}
            onClick={() => {
              onPick(null)
              onOpenChange(false)
            }}
          >
            Use title poster
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
