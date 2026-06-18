"use client"

import { useRouter } from "next/navigation"
import { Check, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  titleTypeLabel,
  type EpisodeView,
  type ThumbnailView,
} from "@/data/db"
import { useComments, useUpdateRow } from "@/data/hooks"
import { ReviewComments } from "@/sections/review/review-comments"
import { ReviewFields } from "@/sections/review/review-fields"
import { ReviewPlayer } from "@/components/review-player"

export function ReviewDetail({
  item,
  thumbnails,
}: {
  item: EpisodeView
  thumbnails: ThumbnailView[]
}) {
  const router = useRouter()
  const { data: comments = [] } = useComments(item.id)
  const updateEpisode = useUpdateRow("episodes")

  const openCount = comments.filter((c) => !c.resolved).length

  const approve = async () => {
    await updateEpisode.mutateAsync({
      id: item.id,
      patch: { status: "published", updated: "just now" },
    })
    toast.success(`Approved “${item.displayName}” — cleared to publish`)
    router.push("/review")
  }

  const requestChanges = async () => {
    await updateEpisode.mutateAsync({
      id: item.id,
      patch: { status: "changes", updated: "just now" },
    })
    toast(`Returned “${item.displayName}” with ${openCount} open notes`)
    router.push("/review")
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header + decision */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{item.title.name}</CardTitle>
                {item.season !== null ? (
                  <span className="font-mono text-sm text-muted-foreground">
                    {item.label}
                  </span>
                ) : (
                  <Badge variant="outline">{titleTypeLabel(item.title.type)}</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted by {item.ownerName} · {item.submittedAgo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={requestChanges}
                disabled={updateEpisode.isPending}
              >
                <RotateCcw />
                Request changes
              </Button>
              <Button
                size="sm"
                onClick={approve}
                disabled={updateEpisode.isPending}
              >
                <Check />
                Approve
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Review the content, metadata, and artwork. Pin a note to any field —
            returning sends every open note to the Editor as one fix list.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewPlayer
                runtime={item.reviewRuntime ?? "—"}
                comments={comments}
                poster={item.title.poster}
                title={item.displayName}
              />
            </CardContent>
          </Card>

          <ReviewFields item={item} thumbnails={thumbnails} comments={comments} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardContent>
                <ReviewComments episodeId={item.id} comments={comments} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
