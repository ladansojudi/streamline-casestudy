"use client"

import Link from "next/link"
import { CheckCircle2, ChevronRight, MessageSquare } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { openCommentCount, type EpisodeView } from "@/data/db"

export function ReviewQueue({
  items,
  isLoading = false,
}: {
  items: EpisodeView[]
  isLoading?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Queue</CardTitle>
        <CardDescription>
          {items.length > 0
            ? `${items.length} ${items.length === 1 ? "title" : "titles"} awaiting review`
            : "Nothing awaiting review"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col px-0">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 px-4 py-3">
                <Skeleton className="h-4 w-2/3 rounded-none" />
                <Skeleton className="h-3 w-1/2 rounded-none" />
              </div>
            ))
          : null}

        {!isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground">
              No titles are waiting for review right now.
            </p>
          </div>
        ) : null}

        {!isLoading &&
          items.map((item) => {
            const open = openCommentCount(item.id)
            return (
              <Link
                key={item.id}
                href={`/review/${item.id}`}
                className="group flex items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
              >
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium group-hover:underline">
                      {item.title.name}
                    </span>
                    {item.season !== null ? (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {item.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.ownerName} · {item.submittedAgo}
                  </p>
                </div>

                {open > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-amber-600 tabular-nums dark:text-amber-500">
                    <MessageSquare className="size-3.5" />
                    {open}
                  </span>
                ) : null}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            )
          })}
      </CardContent>
    </Card>
  )
}
