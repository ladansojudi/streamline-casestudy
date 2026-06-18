"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useRole } from "@/layouts/role-context"
import { getStats } from "@/sections/dashboard/dashboard-data"

const toneAccent: Record<string, string> = {
  default: "bg-muted-foreground/40",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
}

const toneValue: Record<string, string> = {
  default: "text-foreground",
  warning: "text-amber-600 dark:text-amber-500",
  success: "text-emerald-600 dark:text-emerald-500",
}

export function DashboardStats() {
  const { role } = useRole()
  const stats = getStats(role)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="group relative overflow-hidden transition-colors hover:bg-muted/40"
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-0.5",
              toneAccent[stat.tone]
            )}
            aria-hidden
          />
          <Link
            href={stat.href}
            className="flex flex-col gap-1 px-4 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <span
              className={cn(
                "font-heading text-3xl font-semibold tabular-nums",
                toneValue[stat.tone]
              )}
            >
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.hint}</span>
          </Link>
        </Card>
      ))}
    </div>
  )
}
