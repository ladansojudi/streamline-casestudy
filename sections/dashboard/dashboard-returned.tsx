import Link from "next/link"
import { ChevronRight, MessageSquare, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getReturnedTitles } from "@/sections/dashboard/dashboard-data"

export function DashboardReturned() {
  const returnedTitles = getReturnedTitles()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="size-4 text-amber-500" />
          Returned to you
        </CardTitle>
        <CardDescription>
          Sent back by the Publisher — fix and resubmit.
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="xs" render={<Link href="/tasks" />}>
            View all
            <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {returnedTitles.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{item.title}</span>
                <Badge variant="outline" className="shrink-0">
                  {item.type}
                </Badge>
                {item.episode ? (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {item.episode}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {item.topNote}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                <MessageSquare className="size-3.5" />
                {item.openComments} open
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {item.returnedAgo}
              </span>
              <Button
                variant="outline"
                size="xs"
                render={<Link href={`/content-studio/${item.titleId}`} />}
              >
                Open fix
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
