import Link from "next/link"
import { ChevronRight, Flag } from "lucide-react"

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
import { getReviewQueue } from "@/sections/dashboard/dashboard-data"

export function DashboardQueue() {
  const reviewQueue = getReviewQueue()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review queue</CardTitle>
        <CardDescription>
          Submitted titles waiting for your decision.
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="xs" render={<Link href="/review" />}>
            Open queue
            <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {reviewQueue.map((item, index) => (
          <Link
            key={item.id}
            href={`/review/${item.id}`}
            className="group flex items-center gap-3 py-3 outline-none first:pt-0 last:pb-0 focus-visible:bg-muted/40"
          >
            <span className="w-4 shrink-0 text-center text-xs font-medium tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{item.title}</span>
                {item.episode ? (
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {item.episode}
                  </span>
                ) : (
                  <Badge variant="outline" className="shrink-0">
                    {item.type}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.submittedBy} · {item.submittedAgo}
              </p>
            </div>

            {item.flags > 0 ? (
              <span className="flex items-center gap-1 text-xs text-amber-600 tabular-nums dark:text-amber-500">
                <Flag className="size-3.5" />
                {item.flags}
              </span>
            ) : null}
            <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
