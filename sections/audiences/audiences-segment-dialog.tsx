"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
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
import { useCreateRow, useUpdateRow } from "@/data/hooks"
import type { Segment, SegmentKind } from "@/data/schema"

const ART_OPTIONS: { value: string; label: string }[] = [
  { value: "from-rose-500 to-orange-600", label: "Sunset" },
  { value: "from-indigo-500 to-violet-700", label: "Twilight" },
  { value: "from-emerald-500 to-teal-700", label: "Forest" },
  { value: "from-amber-500 to-red-700", label: "Ember" },
  { value: "from-sky-500 to-blue-700", label: "Ocean" },
  { value: "from-fuchsia-500 to-purple-700", label: "Orchid" },
]

/** Targeting rule fields, each with the operators that make sense for it. */
const RULE_FIELDS: {
  field: string
  operators: string[]
  placeholder: string
}[] = [
  { field: "Country", operators: ["is one of", "is not one of"], placeholder: "MX, BR, AR" },
  { field: "Language", operators: ["is", "is one of"], placeholder: "es, pt" },
  { field: "Account age", operators: ["is under", "is over"], placeholder: "30 days" },
  { field: "Taste cluster", operators: ["includes", "excludes"], placeholder: "Thriller, Suspense" },
  { field: "Watch history", operators: ["contains", "does not contain"], placeholder: "3+ thrillers / 90d" },
]

const RULE_FIELD_ITEMS = Object.fromEntries(
  RULE_FIELDS.map((f) => [f.field, f.field])
)
const operatorsFor = (field: string) =>
  RULE_FIELDS.find((f) => f.field === field)?.operators ?? ["is"]
const placeholderFor = (field: string) =>
  RULE_FIELDS.find((f) => f.field === field)?.placeholder ?? "Value"

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  kind: z.enum(["region", "behavior", "taste"]),
  description: z.string().min(5, "Add a short description"),
  reachPercent: z.number().min(0).max(100),
  art: z.string().min(1),
  rules: z
    .array(
      z.object({
        field: z.string().min(1, "Field"),
        op: z.string().min(1, "Operator"),
        value: z.string().min(1, "Value"),
      })
    )
    .min(1, "Add at least one rule"),
})

type FormValues = z.infer<typeof schema>

const KINDS: { value: SegmentKind; label: string }[] = [
  { value: "region", label: "Region" },
  { value: "behavior", label: "Behavior" },
  { value: "taste", label: "Taste" },
]

// value → label maps so <SelectValue> shows the label, not the raw value (Base UI)
const KIND_ITEMS = Object.fromEntries(KINDS.map((k) => [k.value, k.label]))
const ART_ITEMS = Object.fromEntries(ART_OPTIONS.map((a) => [a.value, a.label]))

/** Total addressable audience — reach % is taken against this. */
const TOTAL_AUDIENCE = 68_800_000

/** "12.4M accounts" from a reach percentage. */
function membersFromReach(reachPercent: number): string {
  const count = Math.round((TOTAL_AUDIENCE * reachPercent) / 100)
  const millions = count / 1_000_000
  const label =
    millions >= 1
      ? `${millions.toFixed(1)}M`
      : `${Math.round(count / 1_000)}K`
  return `${label} accounts`
}

/* ------------------------------------------------------------------ */
/* Reach estimate — the app works out how much of the audience the      */
/* segment covers as you add rules (instead of you typing a number).    */
/* ------------------------------------------------------------------ */

/** Base coverage for a kind before any rule narrows it. */
const KIND_BASE: Record<string, number> = {
  region: 0.62,
  behavior: 0.4,
  taste: 0.3,
}

/** How much of the audience a typical filter on each field keeps. */
const FIELD_KEEP: Record<string, number> = {
  Country: 0.45,
  Language: 0.55,
  "Account age": 0.6,
  "Taste cluster": 0.4,
  "Watch history": 0.3,
}

function ruleFactor(field: string, op: string, value: string): number {
  const keep = FIELD_KEEP[field] ?? 0.5
  const valueCount =
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length || 1
  const exclusive = /not|exclude|does not/i.test(op)
  if (exclusive) {
    // Excluding a slice — more values excluded narrows it further.
    return Math.max(0.5, 0.85 - (valueCount - 1) * 0.05)
  }
  // Including a slice — more values broaden it.
  const breadth = Math.min(1.9, 1 + (valueCount - 1) * 0.3)
  return Math.min(0.98, keep * breadth)
}

/** Estimated reach % from the kind + the completed targeting rules. */
function estimateReachPercent(
  kind: string,
  rules: { field: string; op: string; value: string }[]
): number {
  let reach = KIND_BASE[kind] ?? 0.5
  for (const r of rules) {
    if (!r.field || !r.value?.trim()) continue
    reach *= ruleFactor(r.field, r.op, r.value)
  }
  return Math.max(1, Math.min(95, Math.round(reach * 100)))
}

export function AudiencesSegmentDialog({
  segment,
  open,
  onOpenChange,
}: {
  segment?: Segment
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = !!segment
  const create = useCreateRow("segments", "seg")
  const update = useUpdateRow("segments")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: segment?.name ?? "",
      kind: (segment?.kind as "region" | "behavior" | "taste") ?? "region",
      description: segment?.description ?? "",
      reachPercent: segment?.reachPercent ?? 10,
      art: segment?.art ?? ART_OPTIONS[0].value,
      rules: segment?.rules?.length
        ? segment.rules
        : [{ field: "", op: "is", value: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules",
  })

  // Reset when the edited segment changes.
  useEffect(() => {
    if (segment) {
      form.reset({
        name: segment.name,
        kind: segment.kind as "region" | "behavior" | "taste",
        description: segment.description,
        reachPercent: segment.reachPercent,
        art: segment.art,
        rules: segment.rules.length
          ? segment.rules
          : [{ field: "", op: "is", value: "" }],
      })
    }
  }, [segment, form])

  // The app works out reach from the kind + rules as you fill them in.
  const estimatedReach = estimateReachPercent(
    form.watch("kind"),
    form.watch("rules") ?? []
  )
  const membersLabel = membersFromReach(estimatedReach)

  const onSubmit = async (values: FormValues) => {
    try {
      const reachPercent = estimateReachPercent(values.kind, values.rules)
      const members = membersFromReach(reachPercent)
      if (isEdit && segment) {
        await update.mutateAsync({
          id: segment.id,
          patch: { ...values, reachPercent, members },
        })
        toast.success(`Updated “${values.name}”`)
      } else {
        await create.mutateAsync({
          ...values,
          reachPercent,
          members,
          createdBy: "u_eren",
        })
        toast.success(`Created segment “${values.name}”`)
      }
      onOpenChange?.(false)
      if (!isEdit) form.reset()
    } catch {
      toast.error("Something went wrong. Try again.")
    }
  }

  const fieldError = (path: keyof FormValues) =>
    form.formState.errors[path]?.message as string | undefined

  const body = (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit segment" : "New segment"}</DialogTitle>
        <DialogDescription>
          Define who this audience is and how to target them.
        </DialogDescription>
      </DialogHeader>

      <form
        id="segment-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} placeholder="e.g. EMEA" />
          {fieldError("name") ? (
            <p className="text-xs text-destructive">{fieldError("name")}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label>Kind</Label>
          <Select
            items={KIND_ITEMS}
            value={form.watch("kind")}
            onValueChange={(v) =>
              form.setValue("kind", v as FormValues["kind"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={2}
            {...form.register("description")}
            placeholder="Who is in this audience and what art suits them?"
          />
          {fieldError("description") ? (
            <p className="text-xs text-destructive">
              {fieldError("description")}
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label>Artwork</Label>
          <Select
            items={ART_ITEMS}
            value={form.watch("art")}
            onValueChange={(v) => form.setValue("art", v ?? ART_OPTIONS[0].value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ART_OPTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <span
                    className={`size-3 rounded-full bg-linear-to-br ${a.value}`}
                  />
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Targeting rules */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Targeting rules</Label>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() =>
                append({
                  field: RULE_FIELDS[0].field,
                  op: RULE_FIELDS[0].operators[0],
                  value: "",
                })
              }
            >
              <Plus />
              Add rule
            </Button>
          </div>
          {fields.map((ruleField, index) => {
            const field = form.watch(`rules.${index}.field`)
            const operators = operatorsFor(field)
            const operatorItems = Object.fromEntries(
              operators.map((o) => [o, o])
            )
            return (
              <div key={ruleField.id} className="flex items-center gap-1.5">
                <Select
                  items={RULE_FIELD_ITEMS}
                  value={field}
                  onValueChange={(v) => {
                    if (!v) return
                    form.setValue(`rules.${index}.field`, v)
                    // Reset operator to one valid for the new field.
                    form.setValue(`rules.${index}.op`, operatorsFor(v)[0])
                  }}
                >
                  <SelectTrigger className="h-8 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_FIELDS.map((f) => (
                      <SelectItem key={f.field} value={f.field}>
                        {f.field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  items={operatorItems}
                  value={form.watch(`rules.${index}.op`)}
                  onValueChange={(v) =>
                    v && form.setValue(`rules.${index}.op`, v)
                  }
                >
                  <SelectTrigger className="h-8 w-32 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  aria-label="Value"
                  placeholder={placeholderFor(field)}
                  className="h-8 flex-1"
                  {...form.register(`rules.${index}.value`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove rule"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            )
          })}
          {fieldError("rules") ? (
            <p className="text-xs text-destructive">{fieldError("rules")}</p>
          ) : null}
        </div>

        {/* The app's estimate — updates live as you add kind + rules */}
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2.5">
          <div className="leading-tight">
            <p className="text-sm font-medium">Estimated reach</p>
            <p className="text-xs text-muted-foreground">
              Worked out from the kind and your rules.
            </p>
          </div>
          <div className="text-right leading-tight">
            <p className="text-lg font-semibold tabular-nums">
              {estimatedReach}%
            </p>
            <p className="text-xs text-muted-foreground">≈ {membersLabel}</p>
          </div>
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
          form="segment-form"
          size="sm"
          disabled={create.isPending || update.isPending}
        >
          {isEdit ? "Save changes" : "Create segment"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {body}
    </Dialog>
  )
}
