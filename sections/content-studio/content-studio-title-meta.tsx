"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { GenreMultiSelect } from "@/components/genre-multi-select"
import { titleTypeLabel, type Title, type TitleNote } from "@/data/db"
import { splitGenres } from "@/data/genres"
import { useUpdateRow } from "@/data/hooks"
import { FieldNoteBadge } from "@/sections/content-studio/content-studio-field-note-badge"

const RATINGS = ["G", "PG", "PG-13", "TV-14", "TV-MA", "R"]
const RATING_ITEMS = Object.fromEntries(RATINGS.map((r) => [r, r]))

const schema = z.object({
  name: z.string().min(2, "Add a title name"),
  synopsis: z.string().min(5, "Add a short synopsis"),
  genres: z.array(z.string()).min(1, "Pick at least one genre"),
  cast: z.string().min(2, "Add the main cast"),
  maturityRating: z.string().min(1, "Pick a rating"),
})

type FormValues = z.infer<typeof schema>

export function ContentStudioTitleMeta({
  title,
  forceValidate = false,
  fieldNotes,
  onResolveField,
}: {
  title: Title
  /** A failed Submit-for-review attempt — surface required-field errors in red. */
  forceValidate?: boolean
  /** Open Publisher notes per field (when a returned title is being fixed). */
  fieldNotes?: (field: string) => TitleNote[]
  onResolveField?: (field: string) => void
}) {
  const noteBadge = (field: string) => (
    <FieldNoteBadge
      notes={fieldNotes?.(field) ?? []}
      onResolve={() => onResolveField?.(field)}
    />
  )
  const update = useUpdateRow("titles")
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: title.name,
      synopsis: title.synopsis,
      genres: splitGenres(title.genre),
      cast: title.cast ?? "",
      maturityRating: title.maturityRating ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      name: title.name,
      synopsis: title.synopsis,
      genres: splitGenres(title.genre),
      cast: title.cast ?? "",
      maturityRating: title.maturityRating ?? "",
    })
  }, [title, form])

  // When the user tried to submit while incomplete, show the red field errors.
  useEffect(() => {
    if (forceValidate) form.trigger()
  }, [forceValidate, title, form])

  const onSubmit = async (values: FormValues) => {
    const { genres, ...rest } = values
    await update.mutateAsync({
      id: title.id,
      patch: { ...rest, genre: genres.join(", ") },
    })
    toast.success("Title metadata saved")
    form.reset(values)
  }

  const err = (p: keyof FormValues) =>
    form.formState.errors[p]?.message as string | undefined

  return (
    <Card className={cn(forceValidate && "ring-2 ring-destructive/60")}>
      <CardHeader>
        <CardTitle>Title metadata</CardTitle>
        <CardDescription
          className={cn(forceValidate && "text-destructive")}
        >
          {forceValidate
            ? "Fill the required fields below before submitting for review."
            : `Applies to the whole ${titleTypeLabel(title.type).toLowerCase()}. Required before submitting.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" {...form.register("name")} />
            {err("name") ? (
              <p className="text-xs text-destructive">{err("name")}</p>
            ) : null}
          </div>

          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Title synopsis"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="t-synopsis">Synopsis</Label>
              {noteBadge("Title synopsis")}
            </div>
            <Textarea id="t-synopsis" rows={3} {...form.register("synopsis")} />
            {err("synopsis") ? (
              <p className="text-xs text-destructive">{err("synopsis")}</p>
            ) : null}
          </div>

          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Genre"
          >
            <div className="flex items-center justify-between gap-2">
              <Label>Genre</Label>
              {noteBadge("Genre")}
            </div>
            <GenreMultiSelect
              value={form.watch("genres")}
              onChange={(g) =>
                form.setValue("genres", g, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {err("genres") ? (
              <p className="text-xs text-destructive">{err("genres")}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="grid gap-1.5 rounded-md transition-shadow"
              data-field="Maturity rating"
            >
              <div className="flex items-center justify-between gap-2">
                <Label>Maturity rating</Label>
                {noteBadge("Maturity rating")}
              </div>
              <Select
                items={RATING_ITEMS}
                value={form.watch("maturityRating")}
                onValueChange={(v) =>
                  form.setValue("maturityRating", v ?? "", {
                    shouldValidate: true,
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
              {err("maturityRating") ? (
                <p className="text-xs text-destructive">
                  {err("maturityRating")}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="grid gap-1.5 rounded-md transition-shadow"
            data-field="Cast"
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="t-cast">Cast</Label>
              {noteBadge("Cast")}
            </div>
            <Input
              id="t-cast"
              {...form.register("cast")}
              placeholder="Lead actors, comma separated"
            />
            {err("cast") ? (
              <p className="text-xs text-destructive">{err("cast")}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
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
