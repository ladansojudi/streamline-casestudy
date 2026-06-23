"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, Plus, Sparkles, Users, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { mediaUrl, type ThumbnailView, type TitleNote } from "@/data/db"
import {
  useCreateRow,
  useDeleteRow,
  useEpisodeThumbnails,
  useSegments,
  useThumbnails,
  useUpdateRow,
} from "@/data/hooks"
import { ImagePickerDialog } from "@/components/image-picker-dialog"
import { AudiencesSegmentDialog } from "@/sections/audiences/audiences-segment-dialog"
import { FieldNoteBadge } from "@/sections/content-studio/content-studio-field-note-badge"

/** Id for the virtual Default tile shown until a real fallback row exists. */
const DEFAULT_TILE_ID = "__default__"

export function ContentStudioThumbnails({
  titleId,
  episodeId,
  poster,
  invalid = false,
  fieldNotes,
  onResolveField,
}: {
  titleId: string
  /** Set → per-episode artwork; absent → title-level audience thumbnails. */
  episodeId?: string
  poster: string | null
  /** A failed Submit attempt with no audience thumbnail yet — highlight in red. */
  invalid?: boolean
  fieldNotes?: (field: string) => TitleNote[]
  onResolveField?: (field: string) => void
}) {
  const { data } = useSegments()
  // Scope the variants to the title or the episode (both hooks always run).
  const titleThumbs = useThumbnails(episodeId ? "" : titleId)
  const episodeThumbs = useEpisodeThumbnails(episodeId ?? "")
  const thumbnailVariants: ThumbnailView[] = episodeId
    ? (episodeThumbs.data ?? [])
    : (titleThumbs.data ?? [])
  const isEpisode = !!episodeId
  const addThumbnail = useCreateRow("thumbnails", "th")
  const removeThumbnail = useDeleteRow("thumbnails")
  const updateThumbnail = useUpdateRow("thumbnails")
  const [createOpen, setCreateOpen] = useState(false)
  // The thumbnail whose image we're picking (id + current media is all we need).
  const [picking, setPicking] = useState<{
    id: string
    mediaId: string | null
  } | null>(null)
  // A segment just added via "+": if the picker is dismissed without choosing
  // art, roll the segment back so closing = "never mind". A ref (not state) so
  // setImage can clear it synchronously before the close handler reads it.
  const pendingNewIdRef = useRef<string | null>(null)

  const assignedSegmentIds = new Set(thumbnailVariants.map((v) => v.segmentId))
  const available = (data?.all ?? []).filter(
    (s) => s.kind !== "fallback" && !assignedSegmentIds.has(s.id)
  )

  // Always show a Default tile. When the scope has no stored fallback (a new
  // title, or any episode), render a virtual one — it becomes real on first
  // image set, so the artwork is never empty.
  const fallbackSegment = (data?.all ?? []).find((s) => s.kind === "fallback")
  const hasFallback = thumbnailVariants.some(
    (v) => v.segment.kind === "fallback"
  )
  const variants: ThumbnailView[] =
    hasFallback || !fallbackSegment
      ? thumbnailVariants
      : [
          {
            id: DEFAULT_TILE_ID,
            titleId,
            episodeId: episodeId ?? null,
            segmentId: fallbackSegment.id,
            rulePriority: 0,
            mediaId: null,
            segment: fallbackSegment,
            media: null,
          },
          ...thumbnailVariants,
        ]

  const assignSegment = async (segmentId: string, segmentName: string) => {
    // Next priority = one above the current highest.
    const nextPriority =
      Math.max(0, ...thumbnailVariants.map((v) => v.rulePriority)) + 1
    const created = await addThumbnail.mutateAsync({
      titleId,
      episodeId: episodeId ?? null,
      segmentId,
      rulePriority: nextPriority,
    })
    // Go straight to choosing/uploading this segment's artwork.
    pendingNewIdRef.current = created.id
    setPicking({ id: created.id, mediaId: created.mediaId ?? null })
    toast.success(`Choose artwork for ${segmentName}`)
  }

  // Closing the picker. If a freshly-added segment was never given art (no
  // explicit choice), undo the add so the user can back out cleanly.
  const closePicker = async (open: boolean) => {
    if (open) return
    const abandoned = pendingNewIdRef.current
    pendingNewIdRef.current = null
    setPicking(null)
    if (abandoned) {
      await removeThumbnail.mutateAsync(abandoned)
      toast.message("Segment discarded")
    }
  }

  const removeVariant = async (id: string, segmentName: string) => {
    const result = await removeThumbnail.mutateAsync(id)
    if (result === "deleted") toast.success(`Removed ${segmentName} artwork`)
    else if (result === "protected")
      toast.error("Sample artwork can't be removed")
    else toast.error("Couldn't remove that artwork")
  }

  const setImage = async (thumbnailId: string, mediaId: string | null) => {
    // An explicit choice (an image, or "use title poster") keeps the segment.
    pendingNewIdRef.current = null
    // First image on the virtual default → materialise the fallback row.
    if (thumbnailId === DEFAULT_TILE_ID) {
      if (!fallbackSegment) return
      await addThumbnail.mutateAsync({
        titleId,
        episodeId: episodeId ?? null,
        segmentId: fallbackSegment.id,
        rulePriority: 0,
        mediaId,
      })
      return
    }
    await updateThumbnail.mutateAsync({ id: thumbnailId, patch: { mediaId } })
  }

  return (
    <Card
      data-tour={isEpisode ? undefined : "audience"}
      className={cn("transition-shadow", invalid && "ring-2 ring-destructive/60")}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          {isEpisode ? "Episode artwork" : "Audience thumbnails"}
        </CardTitle>
        <CardDescription className={cn(invalid && "text-destructive")}>
          {invalid
            ? "Set the cover (or add an audience thumbnail) before submitting for review."
            : isEpisode
              ? "Per-episode artwork by audience. Add a segment to override the title's thumbnail for those viewers."
              : "Show the right artwork to different viewers. Add a segment to give it its own thumbnail — highest rule priority wins."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {variants.map((variant) => {
          const isDefault = variant.segment.kind === "fallback"
          const customSrc = mediaUrl(variant.media?.url, "w342")
          return (
            <div
              key={variant.id}
              data-field={`Artwork · ${variant.segment.name}`}
              className="group flex flex-col gap-2 rounded-md transition-shadow"
            >
              <div
                className={cn(
                  "relative aspect-video w-full overflow-hidden rounded-md bg-linear-to-br ring-1 ring-foreground/10",
                  variant.segment.art
                )}
              >
                {customSrc ? (
                  // Assigned media — show it clean (no wash).
                  <Image
                    src={customSrc}
                    alt={`${variant.segment.name} artwork`}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-cover"
                  />
                ) : (
                  // No image yet — fall back to the title poster + segment wash.
                  <>
                    {poster ? (
                      <Image
                        src={poster}
                        alt={`${variant.segment.name} artwork`}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover mix-blend-luminosity opacity-90"
                      />
                    ) : null}
                    <div
                      className={cn(
                        "absolute inset-0 bg-linear-to-t opacity-40 mix-blend-multiply",
                        variant.segment.art
                      )}
                    />
                  </>
                )}

                {isDefault ? (
                  <Badge
                    variant="secondary"
                    className="absolute left-1.5 top-1.5"
                  >
                    Default
                  </Badge>
                ) : (
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    P{variant.rulePriority}
                  </span>
                )}

                {/* Set image (all variants, including default) */}
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  className="absolute bottom-1.5 left-1.5 h-6 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={() =>
                    setPicking({
                      id: variant.id,
                      mediaId: variant.mediaId ?? null,
                    })
                  }
                >
                  <ImageIcon />
                  {variant.media ? "Change" : "Set image"}
                </Button>

                {!isDefault ? (
                  <button
                    type="button"
                    aria-label={`Remove ${variant.segment.name} artwork`}
                    disabled={removeThumbnail.isPending}
                    onClick={() => removeVariant(variant.id, variant.segment.name)}
                    className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>
              <div className="leading-tight">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium">{variant.segment.name}</p>
                  {!isDefault ? (
                    <FieldNoteBadge
                      notes={fieldNotes?.(`Artwork · ${variant.segment.name}`) ?? []}
                      onResolve={() =>
                        onResolveField?.(`Artwork · ${variant.segment.name}`)
                      }
                    />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isDefault
                    ? "Fallback"
                    : `${variant.segment.reachPercent}% of audience`}
                </p>
              </div>
            </div>
          )
        })}

        {/* Add segment */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                disabled={addThumbnail.isPending}
              >
                <Plus className="size-5" />
                <span className="text-xs font-medium">Add segment</span>
              </button>
            }
          />
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Assign an audience</DropdownMenuLabel>
              {available.length > 0 ? (
                available.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => assignSegment(s.id, s.name)}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full bg-linear-to-br",
                        s.art
                      )}
                    />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {s.reachPercent}%
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  All segments already added
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCreateOpen(true)}>
              <Sparkles />
              Create new segment…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      {/* Create a brand-new segment, then it becomes assignable above */}
      <AudiencesSegmentDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Pick / upload the artwork for a variant */}
      {picking ? (
        <ImagePickerDialog
          titleId={titleId}
          currentMediaId={picking.mediaId ?? null}
          open={!!picking}
          onOpenChange={closePicker}
          onPick={(mediaId) => setImage(picking.id, mediaId)}
        />
      ) : null}
    </Card>
  )
}
