"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  CheckCircle2,
  CircleAlert,
  Clapperboard,
  Loader2,
  Lock,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EpisodeView, TitleNote } from "@/data/db"
import { useUpdateRow } from "@/data/hooks"
import { FieldNoteBadge } from "@/sections/content-studio/content-studio-field-note-badge"

const RATINGS = ["G", "PG", "PG-13", "TV-14", "TV-MA", "R"]
const RATING_ITEMS = Object.fromEntries(RATINGS.map((r) => [r, r]))

const schema = z.object({
  episodeTitle: z.string().min(1, "Add an episode title"),
  episodeSynopsis: z.string().min(5, "Add a short synopsis"),
  runtime: z.string().optional(),
  airDate: z.string().optional(),
  maturityRating: z.string().optional(),
  director: z.string().optional(),
  writers: z.string().optional(),
  guestStars: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const toDefaults = (episode: EpisodeView): FormValues => ({
  episodeTitle: episode.episodeTitle,
  episodeSynopsis: episode.episodeSynopsis ?? "",
  runtime: episode.runtime ?? "",
  airDate: episode.releaseDate ?? "",
  maturityRating: episode.maturityRating ?? "",
  director: episode.director ?? "",
  writers: episode.writers ?? "",
  guestStars: episode.guestStars ?? "",
})

/** Prominent status read-out for an open episode: where it is + what's next. */
type StatusVisual = {
  label: string
  hint: string
  Icon: LucideIcon
  className: string
  spin?: boolean
}

function episodeStatusVisual(episode: EpisodeView): StatusVisual {
  // "Everything" is the catch-all placeholder for a brand-new draft.
  const items = episode.missing.filter((m) => m && m !== "Everything")
  switch (episode.status) {
    case "uploading":
      return {
        label: `Uploading · ${episode.uploadProgress}%`,
        hint: "Files are still transferring — metadata can wait until they finish.",
        Icon: Loader2,
        spin: true,
        className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
      }
    case "draft":
      return {
        label: "Draft",
        hint:
          items.length > 0
            ? `Still to add: ${items.join(", ")}.`
            : "Add the files and fill in the metadata to get started.",
        Icon: Clapperboard,
        className: "border-border bg-muted/50 text-muted-foreground",
      }
    case "ready":
      return items.length > 0
        ? {
            label: `Ready · ${items.length} to prep`,
            hint: `Still to add: ${items.join(", ")}.`,
            Icon: CircleAlert,
            className:
              "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-500",
          }
        : {
            label: "Ready to submit",
            hint: "Everything's filled in. Submit the title for review when you're done.",
            Icon: CheckCircle2,
            className:
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500",
          }
    case "in-review":
      return {
        label: "In review",
        hint: "With the Publisher — locked for edits until it's returned.",
        Icon: Lock,
        className:
          "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400",
      }
    case "changes":
      return {
        label: "Changes requested",
        hint: "The Publisher left notes — fix the flagged fields, then resubmit.",
        Icon: MessageSquare,
        className:
          "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
      }
    case "published":
      return {
        label: "Published",
        hint: "Live to audiences. Edits create a new version.",
        Icon: CheckCircle2,
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-500",
      }
  }
}

export function ContentStudioEpisodeMeta({
  episode,
  fieldNotes,
  onResolveField,
}: {
  episode: EpisodeView
  fieldNotes?: (field: string) => TitleNote[]
  onResolveField?: (field: string) => void
}) {
  const update = useUpdateRow("episodes")
  const noteBadge = (field: string) => (
    <FieldNoteBadge
      notes={fieldNotes?.(field) ?? []}
      onResolve={() => onResolveField?.(field)}
    />
  )
  // Fields the import can't detect — it leaves them for the Editor. Mark each as
  // a to-do while it's empty; the badge clears the moment it's filled.
  const needsInput = (value: string | undefined) =>
    value ? null : (
      <Badge
        variant="outline"
        className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-500"
      >
        <CircleAlert />
        Needs input
      </Badge>
    )
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(episode),
  })

  useEffect(() => {
    form.reset(toDefaults(episode))
  }, [episode, form])

  const onSubmit = async (values: FormValues) => {
    const { airDate, ...rest } = values
    await update.mutateAsync({
      id: episode.id,
      patch: { ...rest, releaseDate: airDate ? airDate : null },
    })
    toast.success("Episode metadata saved")
    form.reset(values)
  }

  const err = (p: keyof FormValues) =>
    form.formState.errors[p]?.message as string | undefined

  const status = episodeStatusVisual(episode)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{episode.label} metadata</CardTitle>
        <CardDescription>
          {episode.title.name} · {episode.code}
        </CardDescription>
        {/* Where this episode is + what to do next — visible the moment it opens. */}
        <div
          className={cn(
            "mt-1 flex items-start gap-2.5 rounded-md border px-3 py-2.5",
            status.className
          )}
        >
          <status.Icon
            className={cn("mt-0.5 size-4 shrink-0", status.spin && "animate-spin")}
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{status.label}</p>
            <p className="text-xs opacity-90">{status.hint}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Episode title"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="e-title">Episode title</Label>
              {noteBadge("Episode title")}
            </div>
            <Input id="e-title" {...form.register("episodeTitle")} />
            {err("episodeTitle") ? (
              <p className="text-xs text-destructive">{err("episodeTitle")}</p>
            ) : null}
          </div>

          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Episode synopsis"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="e-synopsis">Synopsis</Label>
              {noteBadge("Episode synopsis")}
            </div>
            <Textarea
              id="e-synopsis"
              rows={3}
              {...form.register("episodeSynopsis")}
              placeholder="What happens in this episode?"
            />
            {err("episodeSynopsis") ? (
              <p className="text-xs text-destructive">
                {err("episodeSynopsis")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div
              className="grid gap-1.5 rounded-md transition-shadow"
              data-field="Runtime"
            >
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="e-runtime">Runtime</Label>
                {noteBadge("Runtime")}
              </div>
              <Input
                id="e-runtime"
                {...form.register("runtime")}
                placeholder="e.g. 48 min"
              />
            </div>
            <div
              className="grid gap-1.5 rounded-md transition-shadow"
              data-field="Air date"
            >
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="e-airdate">Air date</Label>
                <div className="flex items-center gap-1.5">
                  {needsInput(form.watch("airDate"))}
                  {noteBadge("Air date")}
                </div>
              </div>
              <Input id="e-airdate" type="date" {...form.register("airDate")} />
            </div>
            <div className="grid gap-1.5">
              <Label>Maturity rating</Label>
              <Select
                items={RATING_ITEMS}
                value={form.watch("maturityRating") || ""}
                onValueChange={(v) =>
                  form.setValue("maturityRating", v ?? "", {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {RATINGS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="grid gap-1.5 rounded-md transition-shadow"
              data-field="Director"
            >
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="e-director">Director</Label>
                {noteBadge("Director")}
              </div>
              <Input
                id="e-director"
                {...form.register("director")}
                placeholder="Director name"
              />
            </div>
            <div
              className="grid gap-1.5 rounded-md transition-shadow"
              data-field="Writers"
            >
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="e-writers">Writers</Label>
                {noteBadge("Writers")}
              </div>
              <Input
                id="e-writers"
                {...form.register("writers")}
                placeholder="Comma separated"
              />
            </div>
          </div>

          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Guest stars"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="e-guests">Guest stars</Label>
              <div className="flex items-center gap-1.5">
                {needsInput(form.watch("guestStars"))}
                {noteBadge("Guest stars")}
              </div>
            </div>
            <Input
              id="e-guests"
              {...form.register("guestStars")}
              placeholder="Guest cast, comma separated"
            />
          </div>

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!form.formState.isDirty || update.isPending}
            >
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
