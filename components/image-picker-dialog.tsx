"use client"

import { useState } from "react"
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

// Demo upload — generate a gradient still so the flow continues without a real
// file picker. Each click varies the colours.
const SAMPLE_GRADIENTS: [string, string][] = [
  ["#f43f5e", "#ea580c"],
  ["#6366f1", "#7c3aed"],
  ["#10b981", "#0f766e"],
  ["#0ea5e9", "#1d4ed8"],
  ["#d946ef", "#7e22ce"],
]

function makeSampleImage(index: number): string {
  const canvas = document.createElement("canvas")
  canvas.width = 640
  canvas.height = 360
  const ctx = canvas.getContext("2d")
  const [a, b] = SAMPLE_GRADIENTS[index % SAMPLE_GRADIENTS.length]
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 640, 360)
    grad.addColorStop(0, a)
    grad.addColorStop(1, b)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 640, 360)
  }
  return canvas.toDataURL("image/png")
}

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
  const [uploading, setUploading] = useState(false)
  // Local selection — picking a tile or uploading only *previews* the choice;
  // it's applied to the thumbnail when the user confirms.
  const [selectedId, setSelectedId] = useState<string | null>(currentMediaId)

  const uploadSample = async () => {
    setUploading(true)
    try {
      const created = await create.mutateAsync({
        name: `Uploaded still ${items.length + 1}`,
        url: makeSampleImage(items.length),
        kind: "art",
        titleId,
      })
      // Show it as the freshly-uploaded, selected image — confirm applies it.
      setSelectedId(created.id)
      toast.success("Image uploaded — confirm to apply")
    } catch {
      toast.error("Couldn't add the image")
    } finally {
      setUploading(false)
    }
  }

  const confirm = () => {
    onPick(selectedId)
    onOpenChange(false)
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
            const selected = m.id === selectedId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
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

          {/* Upload tile — drops in a sample still so the flow keeps moving */}
          <button
            type="button"
            onClick={uploadSample}
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={!selectedId} onClick={confirm}>
              <Check />
              Confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
