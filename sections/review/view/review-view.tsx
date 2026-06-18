"use client"

import { useReviewQueue } from "@/data/hooks"
import { ReviewQueue } from "@/sections/review/review-queue"

export function ReviewView() {
  const { data: queue = [], isLoading } = useReviewQueue()

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="grid gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Review
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a submitted title to inspect its content, metadata, and artwork —
          then approve or send it back with notes.
        </p>
      </div>

      <ReviewQueue items={queue} isLoading={isLoading} />
    </div>
  )
}
