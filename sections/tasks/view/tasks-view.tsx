"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useDerived } from "@/data/hooks"
import { getTaskGroups } from "@/sections/tasks/tasks-data"

const toneRing: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  default: "bg-muted text-muted-foreground",
  destructive: "bg-destructive/10 text-destructive",
}

export function TasksView() {
  const { data: taskGroups = [] } = useDerived("tasks", getTaskGroups)
  const total = taskGroups.reduce((sum, g) => sum + g.tasks.length, 0)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Heading */}
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Tasks
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} items need your action before titles can move forward.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {taskGroups.map((group) => (
          <Card key={group.key} className="px-4">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  toneRing[group.tone]
                )}
              >
                <group.icon className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="font-heading text-xl font-semibold tabular-nums">
                  {group.tasks.length}
                </p>
                <p className="text-xs text-muted-foreground">{group.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Grouped task lists */}
      <div className="flex flex-col gap-4 md:gap-6">
        {taskGroups.map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded",
                    toneRing[group.tone]
                  )}
                >
                  <group.icon className="size-3.5" />
                </span>
                {group.label}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  {group.tasks.length}
                </span>
              </CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium">{task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {task.meta}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {task.detail}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {task.age}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      render={<Link href={task.href} />}
                    >
                      {task.cta}
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
