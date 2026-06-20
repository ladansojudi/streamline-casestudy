"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Clapperboard, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReviewPlayer } from "@/components/review-player"
import { isEpisodicTitle } from "@/data/schema"
import {
  useComments,
  useCreateRow,
  useEpisodes,
  useSeasons,
  useThumbnails,
  useTitleNotes,
  useTitles,
  useUpdateRow,
} from "@/data/hooks"
import { ContentStudioDropzone } from "@/sections/content-studio/content-studio-dropzone"
import { ContentStudioEpisodeMeta } from "@/sections/content-studio/content-studio-episode-meta"
import { ContentStudioSeasonMeta } from "@/sections/content-studio/content-studio-season-meta"
import { ContentStudioSubmitDialog } from "@/sections/content-studio/content-studio-submit-dialog"
import { ContentStudioReviewLock } from "@/sections/content-studio/content-studio-review-lock"
import { ContentStudioNotesPanel } from "@/sections/content-studio/content-studio-notes-panel"
import { cn } from "@/lib/utils"
import { ContentStudioThumbnails } from "@/sections/content-studio/content-studio-thumbnails"
import { ContentStudioTitleMeta } from "@/sections/content-studio/content-studio-title-meta"
import { ContentStudioTree } from "@/sections/content-studio/content-studio-tree"
import { useStructureActions } from "@/sections/content-studio/use-structure-actions"
import { useUploadTick } from "@/sections/content-studio/use-upload-tick"
import { ContentStudioLanding } from "@/sections/content-studio/content-studio-landing"
import {
  buildTree,
  posterForTitle,
  type Selection,
} from "@/sections/content-studio/content-studio-data"

/** A title is "in prep" if it has episodes still being worked on. */
const PREP_STATUSES = new Set(["draft", "uploading", "ready", "changes"])

/** Note fields that belong to an episode node (others sit on the title node). */
const EPISODE_NOTE_FIELDS = new Set([
  "Episode title",
  "Episode synopsis",
  "Runtime",
  "Air date",
  "Director",
  "Writers",
  "Guest stars",
  "Episode thumbnail",
])

export function ContentStudioView({
  initialTitleId = null,
  autoNewTitle = false,
}: {
  initialTitleId?: string | null
  /** Opened from the tour with ?new=1 → auto-open the New title dialog. */
  autoNewTitle?: boolean
}) {
  const { data: titles = [] } = useTitles()
  const { data: episodes = [] } = useEpisodes()

  const prepTitleIds = useMemo(() => {
    const ids = new Set<string>()
    for (const e of episodes) if (PREP_STATUSES.has(e.status)) ids.add(e.titleId)
    return ids
  }, [episodes])

  const orderedTitles = useMemo(() => {
    return [...titles].sort((a, b) => {
      const ap = prepTitleIds.has(a.id) ? 0 : 1
      const bp = prepTitleIds.has(b.id) ? 0 : 1
      return ap - bp || a.name.localeCompare(b.name)
    })
  }, [titles, prepTitleIds])

  const [titleId, setTitleId] = useState<string | null>(null)
  const urlTitleId =
    initialTitleId && titles.some((t) => t.id === initialTitleId)
      ? initialTitleId
      : null
  // No auto-dive into an arbitrary title — land on the picker until one is chosen.
  const activeTitleId = titleId ?? urlTitleId ?? ""
  const activeTitle = titles.find((t) => t.id === activeTitleId)
  const activeTitleName = activeTitle?.name ?? "this title"

  // Advance the active title's in-flight uploads to completion so it can submit.
  useUploadTick(activeTitleId)

  const titleItems = useMemo(
    () => Object.fromEntries(orderedTitles.map((t) => [t.id, t.name])),
    [orderedTitles]
  )

  void episodes
  const tree = buildTree(activeTitleId)
  const { data: variants = [] } = useThumbnails(activeTitleId)
  const { data: seasons = [] } = useSeasons(activeTitleId)
  const poster = posterForTitle(activeTitleId)

  // Master–detail selection — defaults to the title node.
  const [selection, setSelection] = useState<Selection>({ kind: "title" })
  // Which episode the publisher-style fix view is editing.
  const [fixEpisodeId, setFixEpisodeId] = useState<string | null>(null)
  const structure = useStructureActions(activeTitleId)

  // Submit-for-review confirmation + a failed-attempt flag that turns the
  // unfinished requirements red (instead of a standing checklist).
  const [submitOpen, setSubmitOpen] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const submittableCount = episodes.filter(
    (e) =>
      e.titleId === activeTitleId &&
      (e.status === "ready" || e.status === "changes")
  ).length

  // Once submitted, the title is locked for editing until the Publisher returns it.
  const reviewEpisode = episodes.find(
    (e) => e.titleId === activeTitleId && e.status === "in-review"
  )
  const inReview = !!reviewEpisode
  // Returned with changes → show the Publisher's notes so the Editor can fix them.
  const hasChanges = episodes.some(
    (e) => e.titleId === activeTitleId && e.status === "changes"
  )
  const reviewedEpisode = episodes.find(
    (e) => e.titleId === activeTitleId && e.status === "changes"
  )
  const playerRuntime = reviewedEpisode?.reviewRuntime ?? "—"
  const { data: titleNotes = [] } = useTitleNotes(activeTitleId)
  const resolveComment = useUpdateRow("comments")
  // Per-field Publisher notes, shown inline on each section while fixing.
  const fieldNotes = hasChanges
    ? (field: string) => titleNotes.filter((n) => n.field === field)
    : undefined
  const onResolveField = hasChanges
    ? async (field: string) => {
        const open = titleNotes.filter((n) => n.field === field)
        if (open.length === 0) return
        for (const n of open) {
          await resolveComment.mutateAsync({ id: n.id, patch: { resolved: true } })
        }
        toast.success(
          open.length === 1 ? "Note resolved" : `${open.length} notes resolved`
        )
      }
    : undefined

  // Notes grouped per tree node, so the Editor can read them from the tree.
  const treeNoteGroups = hasChanges
    ? titleNotes.reduce(
        (acc, n) => {
          if (n.field && EPISODE_NOTE_FIELDS.has(n.field)) {
            ;(acc.byEpisode[n.episodeId] ??= []).push(n)
          } else {
            acc.title.push(n)
          }
          return acc
        },
        {
          title: [] as typeof titleNotes,
          byEpisode: {} as Record<string, typeof titleNotes>,
        }
      )
    : undefined

  // Publisher-style fix view (returned titles): video + editable fields + notes.
  const timestampNotes = titleNotes.filter((n) => n.kind === "timestamp")
  const titleEpisodes = episodes.filter((e) => e.titleId === activeTitleId)
  const isEpisodic = activeTitle ? isEpisodicTitle(activeTitle.type) : false
  const fixEpisode =
    titleEpisodes.find((e) => e.id === fixEpisodeId) ??
    titleEpisodes.find((e) => treeNoteGroups?.byEpisode[e.id]?.length) ??
    titleEpisodes[0]
  const fixEpisodeItems = Object.fromEntries(
    titleEpisodes.map((e) => [e.id, e.season !== null ? e.label : "Feature"])
  )

  // Editor can pin a note to a moment in any episode's video (like the Publisher).
  const createComment = useCreateRow("comments", "cm")
  const makePin = (episodeId?: string) =>
    episodeId
      ? async (atPercent: number, at: string, body: string) => {
          await createComment.mutateAsync({
            episodeId,
            kind: "timestamp",
            at,
            atPercent,
            field: null,
            body,
            authorId: "u_eren",
            ago: "just now",
            resolved: false,
          })
          toast.success(`Pinned a note at ${at}`)
        }
      : undefined

  // Click a note in the panel → reveal & flash the field it's pinned to.
  const jumpToNote = (note: (typeof titleNotes)[number]) => {
    const episodeLevel = !!note.field && EPISODE_NOTE_FIELDS.has(note.field)
    const switching = episodeLevel && note.episodeId !== fixEpisode?.id
    if (switching) setFixEpisodeId(note.episodeId)
    const anchor = note.kind === "timestamp" ? "video" : note.field
    if (!anchor) return
    window.setTimeout(
      () => {
        const el = document.querySelector(`[data-field="${anchor}"]`)
        if (!el) return
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-amber-500")
        window.setTimeout(
          () => el.classList.remove("ring-2", "ring-amber-500"),
          1600
        )
      },
      switching ? 90 : 0
    )
  }

  const removeSeason = async (seasonId: string) => {
    if (selection.kind === "season" && selection.seasonId === seasonId) {
      setSelection({ kind: "title" })
    }
    await structure.removeSeason(seasonId)
  }
  const removeEpisode = async (episodeId: string) => {
    if (selection.kind === "episode" && selection.episodeId === episodeId) {
      setSelection({ kind: "title" })
    }
    await structure.removeEpisode(episodeId)
  }

  const selectedEpisode =
    selection.kind === "episode"
      ? episodes.find((e) => e.id === selection.episodeId)
      : undefined
  const selectedSeason =
    selection.kind === "season"
      ? seasons.find((s) => s.id === selection.seasonId)
      : undefined
  // The selected episode's comments power its video player (pins + notes).
  const { data: selectedEpisodeComments = [] } = useComments(
    selection.kind === "episode" ? selection.episodeId : ""
  )

  // Land on the title's first episode (video front) once its episodes load —
  // like the Publisher opening straight onto a video. Runs once per title.
  const autoSelectedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!activeTitleId || autoSelectedRef.current === activeTitleId) return
    const firstEp = episodes.find((e) => e.titleId === activeTitleId)
    if (!firstEp) return
    autoSelectedRef.current = activeTitleId
    setSelection({ kind: "episode", episodeId: firstEp.id })
  }, [activeTitleId, episodes])

  // Submit-for-review requirements (title-level).
  const filesUploaded =
    titleEpisodes.length > 0 &&
    titleEpisodes.every((e) => e.uploadProgress === 100)
  const structureBuilt = (tree?.seasons.length ?? 0) > 0
  const metadataComplete = !!(
    activeTitle?.synopsis &&
    activeTitle?.genre &&
    activeTitle?.cast &&
    activeTitle?.maturityRating
  )
  const thumbnailsAssigned = variants.some((v) => v.segment.kind !== "fallback")

  const missingSteps = [
    !filesUploaded && "finish uploading files",
    !structureBuilt && "add structure",
    !metadataComplete && "complete title metadata",
    !thumbnailsAssigned && "add an audience thumbnail",
  ].filter(Boolean) as string[]
  const readyToSubmit = missingSteps.length === 0
  const inPrep = prepTitleIds.has(activeTitleId)

  const onPickTitle = (v: string | null) => {
    if (!v) return
    setTitleId(v)
    setSelection({ kind: "title" })
    setAttemptedSubmit(false)
  }

  const onSubmitClick = () => {
    if (readyToSubmit) {
      setSubmitOpen(true)
      return
    }
    // Incomplete: flag the requirements red and point the user at the fixes.
    setAttemptedSubmit(true)
    if (!metadataComplete || !thumbnailsAssigned || !structureBuilt) {
      setSelection({ kind: "title" })
    }
    toast.error(`Finish these before submitting: ${missingSteps.join(", ")}.`)
  }

  // No title chosen (entered via the nav, not a deep link) → show the catalogue.
  if (!activeTitleId) {
    return <ContentStudioLanding autoNew={autoNewTitle} />
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="relative aspect-2/3 w-14 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
            {poster ? (
              <Image
                src={poster}
                alt={activeTitleName}
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Clapperboard className="size-5" />
              </div>
            )}
          </div>
          <div className="grid gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {hasChanges
                ? "Changes requested · "
                : inReview
                  ? "In review · "
                  : "Preparing "}
              {activeTitleName}
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Content Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasChanges
                ? "Returned by the Publisher — fix the flagged notes, then resubmit."
                : inReview
                  ? "Submitted to the Publisher. Locked for editing until it's returned."
                  : "Build structure, edit metadata at each level, and assign audience artwork before submitting for review."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select items={titleItems} value={activeTitleId} onValueChange={onPickTitle}>
            <SelectTrigger className="h-8 w-52">
              <SelectValue placeholder="Choose a title…" />
            </SelectTrigger>
            <SelectContent>
              {orderedTitles.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span
                    className={
                      prepTitleIds.has(t.id)
                        ? "size-1.5 rounded-full bg-amber-500"
                        : "size-1.5 rounded-full bg-muted-foreground/40"
                    }
                  />
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!inPrep || (inReview && !hasChanges)}
            onClick={onSubmitClick}
          >
            <Send />
            Submit for review
          </Button>
        </div>
      </div>

      <ContentStudioSubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        titleName={activeTitleName}
        episodeCount={submittableCount}
        onConfirm={structure.submitForReview}
      />

      {hasChanges ? null : inReview ? (
        <ContentStudioReviewLock
          titleName={activeTitleName}
          submittedAgo={reviewEpisode?.submittedAgo}
        />
      ) : (
        <ContentStudioDropzone
          titleType={activeTitle?.type ?? "series"}
          onSimulate={structure.simulateUpload}
          hasStructure={titleEpisodes.length > 0}
        />
      )}

      {/* Returned title → publisher-style fix view (video + fields + notes) */}
      {tree && activeTitle && hasChanges ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:col-span-2">
            <Card data-field="video" className="transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm">Content</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewPlayer
                  runtime={playerRuntime}
                  comments={timestampNotes}
                  poster={poster}
                  title={activeTitleName}
                  onPin={makePin(fixEpisode?.id)}
                />
              </CardContent>
            </Card>

            <ContentStudioTitleMeta
              title={activeTitle}
              forceValidate={attemptedSubmit && !metadataComplete}
              fieldNotes={fieldNotes}
              onResolveField={onResolveField}
            />
            <ContentStudioThumbnails
              titleId={activeTitleId}
              poster={poster}
              invalid={attemptedSubmit && !thumbnailsAssigned}
              fieldNotes={fieldNotes}
              onResolveField={onResolveField}
            />

            {fixEpisode ? (
              <>
                {isEpisodic && titleEpisodes.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Episode
                    </span>
                    <Select
                      items={fixEpisodeItems}
                      value={fixEpisode.id}
                      onValueChange={(v) => v && setFixEpisodeId(v)}
                    >
                      <SelectTrigger className="h-8 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {titleEpisodes.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.season !== null ? e.label : "Feature"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <ContentStudioEpisodeMeta
                  episode={fixEpisode}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
                <ContentStudioThumbnails
                  titleId={activeTitleId}
                  episodeId={fixEpisode.id}
                  poster={poster}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
              </>
            ) : null}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">
              <ContentStudioNotesPanel
                titleId={activeTitleId}
                onJumpToNote={jumpToNote}
              />
            </div>
          </div>
        </div>
      ) : tree && activeTitle ? (
        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <ContentStudioTree
              tree={tree}
              selection={selection}
              onSelect={setSelection}
              onAddSeason={structure.addSeasonWithEpisodes}
              onAddEpisode={structure.addEpisode}
              onRemoveSeason={removeSeason}
              onRemoveEpisode={removeEpisode}
              locked={inReview}
              invalid={attemptedSubmit && !structureBuilt}
              noteGroups={treeNoteGroups}
            />
          </div>

          <fieldset
            disabled={inReview}
            className={cn(
              "flex min-w-0 flex-col gap-4 md:gap-6 lg:col-span-9",
              inReview && "opacity-95"
            )}
          >
            {selection.kind === "title" ? (
              <>
                <ContentStudioTitleMeta
                  title={activeTitle}
                  forceValidate={attemptedSubmit && !metadataComplete}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
                <ContentStudioThumbnails
                  titleId={activeTitleId}
                  poster={poster}
                  invalid={attemptedSubmit && !thumbnailsAssigned}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
              </>
            ) : null}

            {selection.kind === "episode" && selectedEpisode ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewPlayer
                      runtime={selectedEpisode.reviewRuntime ?? "—"}
                      comments={selectedEpisodeComments}
                      poster={activeTitle.poster}
                      title={selectedEpisode.displayName}
                      onPin={makePin(selectedEpisode.id)}
                    />
                  </CardContent>
                </Card>
                <ContentStudioEpisodeMeta
                  episode={selectedEpisode}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
                <ContentStudioThumbnails
                  titleId={activeTitleId}
                  episodeId={selectedEpisode.id}
                  poster={poster}
                  fieldNotes={fieldNotes}
                  onResolveField={onResolveField}
                />
              </>
            ) : null}

            {selection.kind === "season" && selectedSeason ? (
              <ContentStudioSeasonMeta season={selectedSeason} />
            ) : null}
          </fieldset>
        </div>
      ) : null}
    </div>
  )
}
