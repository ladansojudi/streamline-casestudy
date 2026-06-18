import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getReleases } from "@/sections/dashboard/dashboard-data"

export function DashboardReleases() {
  const releases = getReleases()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming releases</CardTitle>
        <CardDescription>Next titles going live.</CardDescription>
        <CardAction>
          <Link
            href="/schedule"
            className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Schedule
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {releases.map((release) => (
          <div key={release.title} className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-md border bg-muted/40 leading-none">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {release.day}
              </span>
              <span className="text-sm font-semibold">
                {release.date.split(" ")[1]}
              </span>
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-medium">{release.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {release.detail}
              </p>
            </div>
            <Badge
              variant={release.status === "Scheduled" ? "secondary" : "outline"}
              className="shrink-0"
            >
              {release.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
