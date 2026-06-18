"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { createRow } from "@/data/store"
import { TITLE_TYPES, type TitleType } from "@/data/schema"

const TYPE_VALUES = TITLE_TYPES.map((t) => t.value) as [TitleType, ...TitleType[]]
const TYPE_ITEMS = Object.fromEntries(TITLE_TYPES.map((t) => [t.value, t.label]))

const schema = z.object({
  name: z.string().min(2, "Title name is too short"),
  type: z.enum(TYPE_VALUES),
  synopsis: z.string().min(5, "Add a short synopsis"),
  genres: z.array(z.string()).min(1, "Pick at least one genre"),
})

type FormValues = z.infer<typeof schema>

export function ContentStudioNewTitleDialog({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "series", synopsis: "", genres: [] },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      // Create only the title — no structure yet. The Editor lands on an empty
      // title and drops files to build the Series → Season → Episode tree.
      const title = await createRow("titles", "t", {
        name: values.name,
        type: values.type,
        synopsis: values.synopsis,
        genre: values.genres.join(", "),
        runtime: "TBD",
        ownerId: "u_eren",
        poster: "",
      })
      await qc.invalidateQueries()
      toast.success(`Created “${values.name}” — drop files to build it`)
      onOpenChange?.(false)
      form.reset()
      // Take the editor straight into preparing the new title.
      router.push(`/content-studio/${title.id}`)
    } catch {
      toast.error("Couldn't create the title. Try again.")
    }
  }

  const err = (p: keyof FormValues) =>
    form.formState.errors[p]?.message as string | undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New title</DialogTitle>
          <DialogDescription>
            Start a title. You can drop files and build structure in Content
            Studio next.
          </DialogDescription>
        </DialogHeader>

        <form
          id="title-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="title-name">Name</Label>
              <Input
                id="title-name"
                {...form.register("name")}
                placeholder="e.g. Tidewater"
              />
              {err("name") ? (
                <p className="text-xs text-destructive">{err("name")}</p>
              ) : null}
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select
                items={TYPE_ITEMS}
                value={form.watch("type")}
                onValueChange={(v) =>
                  form.setValue("type", (v as FormValues["type"]) ?? "series")
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TITLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Genre</Label>
            <GenreMultiSelect
              value={form.watch("genres")}
              onChange={(g) =>
                form.setValue("genres", g, { shouldValidate: true })
              }
            />
            {err("genres") ? (
              <p className="text-xs text-destructive">{err("genres")}</p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="title-synopsis">Synopsis</Label>
            <Textarea
              id="title-synopsis"
              rows={3}
              {...form.register("synopsis")}
              placeholder="One or two lines about the story."
            />
            {err("synopsis") ? (
              <p className="text-xs text-destructive">{err("synopsis")}</p>
            ) : null}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="title-form"
            size="sm"
            disabled={form.formState.isSubmitting}
          >
            Create title
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
