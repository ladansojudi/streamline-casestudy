"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react"
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
import { mediaUrl, posterUrl, type EpisodeView, type TitleNote } from "@/data/db"
import { useMediaForTitle, useUpdateRow } from "@/data/hooks"
import { ImagePickerDialog } from "@/components/image-picker-dialog"
import { FieldNoteBadge } from "@/sections/content-studio/content-studio-field-note-badge"

export function ContentStudioEpisodeThumbnail({
  episode,
  fieldNotes,
  onResolveField,
}: {
  episode: EpisodeView
  fieldNotes?: (field: string) => TitleNote[]
  onResolveField?: (field: string) => void
}) {
  const update = useUpdateRow("episodes")
  const { data: media = [] } = useMediaForTitle(episode.titleId)
  const [picking, setPicking] = useState(false)

  const thumbMedia = media.find((m) => m.id === episode.thumbnailMediaId)
  const thumbSrc = mediaUrl(thumbMedia?.url, "w342")
  const posterSrc = posterUrl(episode.title.poster, "w342")

  const setThumbnail = async (mediaId: string | null) => {
    await update.mutateAsync({
      id: episode.id,
      patch: {
        thumbnailMediaId: mediaId,
        assets: { ...episode.assets, thumbnail: mediaId !== null },
      },
    })
    toast.success(mediaId ? "Episode thumbnail set" : "Reverted to title poster")
  }

  return (
    <Card data-field="Episode thumbnail" className="transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="size-4 text-muted-foreground" />
          Episode thumbnail
          <FieldNoteBadge
            notes={fieldNotes?.("Episode thumbnail") ?? []}
            onResolve={() => onResolveField?.("Episode thumbnail")}
          />
        </CardTitle>
        <CardDescription>
          Set a still for this episode. Falls back to the title poster when none
          is chosen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 sm:w-56">
            {thumbSrc ? (
              <Image
                src={thumbSrc}
                alt={`${episode.label} thumbnail`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
              />
            ) : posterSrc ? (
              <Image
                src={posterSrc}
                alt={`${episode.label} thumbnail`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className={cn("object-cover opacity-90 mix-blend-luminosity")}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPicking(true)}
            >
              <ImageIcon />
              {thumbMedia ? "Change image" : "Set image"}
            </Button>
            {thumbMedia ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={update.isPending}
                onClick={() => setThumbnail(null)}
              >
                Use title poster
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {thumbMedia
                ? "Custom thumbnail for this episode."
                : "Currently using the title poster."}
            </p>
          </div>
        </div>
      </CardContent>

      {picking ? (
        <ImagePickerDialog
          titleId={episode.titleId}
          currentMediaId={episode.thumbnailMediaId ?? null}
          open={picking}
          onOpenChange={setPicking}
          onPick={setThumbnail}
        />
      ) : null}
    </Card>
  )
}
