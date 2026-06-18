"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useReviewItem } from "@/data/hooks"
import { ReviewDetail } from "@/sections/review/review-detail"

export function ReviewDetailView({ episodeId }: { episodeId: string }) {
  const { data, isLoading } = useReviewItem(episodeId)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        render={<Link href="/review" />}
      >
        <ArrowLeft />
        Back to queue
      </Button>

      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : data?.item ? (
        <ReviewDetail item={data.item} thumbnails={data.thumbnails} />
      ) : (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium">Not found</p>
            <p className="text-xs text-muted-foreground">
              This item isn&apos;t in the review queue anymore.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
