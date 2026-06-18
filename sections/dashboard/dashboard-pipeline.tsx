"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRole } from "@/layouts/role-context"
import { getPipeline } from "@/sections/dashboard/dashboard-data"

const stageColor: Record<string, string> = {
  // Editor stages
  draft: "bg-muted-foreground/30",
  uploading: "bg-sky-500",
  ready: "bg-emerald-500",
  review: "bg-amber-500",
  published: "bg-primary",
  // Publisher stages
  queue: "bg-amber-500",
  reviewing: "bg-sky-500",
  returned: "bg-muted-foreground/40",
  approved: "bg-emerald-500",
  scheduled: "bg-primary",
}

export function DashboardPipeline() {
  const { role } = useRole()
  const stages = getPipeline(role)
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{role === "editor" ? "Content status" : "Review pipeline"}</CardTitle>
        <CardDescription>
          {total} titles across {role === "editor" ? "your pipeline" : "the review flow"}.
        </CardDescription>
        <CardAction>
          <Link
            href={role === "editor" ? "/content-studio" : "/review"}
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {role === "editor" ? "Content Studio" : "Review"}
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Stacked proportion bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          {stages.map((stage) => (
            <div
              key={stage.key}
              className={stageColor[stage.key]}
              style={{ width: `${(stage.count / total) * 100}%` }}
              title={`${stage.label}: ${stage.count}`}
            />
          ))}
        </div>

        {/* Legend / counts */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          {stages.map((stage) => (
            <div key={stage.key} className="flex items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${stageColor[stage.key]}`}
                aria-hidden
              />
              <div className="grid leading-tight">
                <span className="text-sm font-semibold tabular-nums">
                  {stage.count}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stage.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
