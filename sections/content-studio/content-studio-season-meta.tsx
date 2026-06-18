"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import type { Season } from "@/data/db"
import { useUpdateRow } from "@/data/hooks"

const schema = z.object({
  title: z.string().min(1, "Add a season title"),
  synopsis: z.string().min(5, "Add a short synopsis"),
})

type FormValues = z.infer<typeof schema>

export function ContentStudioSeasonMeta({ season }: { season: Season }) {
  const update = useUpdateRow("seasons")
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: season.title, synopsis: season.synopsis },
  })

  useEffect(() => {
    form.reset({ title: season.title, synopsis: season.synopsis })
  }, [season, form])

  const onSubmit = async (values: FormValues) => {
    await update.mutateAsync({ id: season.id, patch: values })
    toast.success("Season metadata saved")
    form.reset(values)
  }

  const err = (p: keyof FormValues) =>
    form.formState.errors[p]?.message as string | undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>Season metadata</CardTitle>
        <CardDescription>
          Season {season.number} · applies to its episodes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="s-title">Season title</Label>
            <Input id="s-title" {...form.register("title")} />
            {err("title") ? (
              <p className="text-xs text-destructive">{err("title")}</p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="s-synopsis">Synopsis</Label>
            <Textarea id="s-synopsis" rows={3} {...form.register("synopsis")} />
            {err("synopsis") ? (
              <p className="text-xs text-destructive">{err("synopsis")}</p>
            ) : null}
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
