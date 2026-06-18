"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRole } from "@/layouts/role-context"
import { getFeed } from "@/sections/dashboard/dashboard-data"

const toneClass: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
}

export function DashboardActivity() {
  const { role } = useRole()
  const items = getFeed(role)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{role === "editor" ? "Recent activity" : "Recent decisions"}</CardTitle>
        <CardDescription>
          {role === "editor"
            ? "Across your titles and uploads."
            : "Your latest review actions."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative flex flex-col gap-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {items.map((item, index) => (
            <li key={index} className="relative flex items-start gap-3">
              <span
                className={`z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${toneClass[item.tone]}`}
              >
                <item.icon className="size-3.5" />
              </span>
              <div className="grid gap-0.5 pt-0.5 leading-tight">
                <span className="text-sm">{item.text}</span>
                <span className="text-xs text-muted-foreground">
                  {item.time}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
