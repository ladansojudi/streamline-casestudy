import { Lock } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function ContentStudioReviewLock({
  titleName,
  submittedAgo,
}: {
  titleName: string
  submittedAgo?: string
}) {
  return (
    <Card className="border border-amber-500/30 bg-amber-50/60 ring-0 dark:bg-amber-950/20">
      <CardContent className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-500">
          <Lock className="size-4" />
        </span>
        <div className="grid gap-0.5">
          <p className="text-sm font-medium">
            Submitted for review — locked for editing
          </p>
          <p className="text-xs text-muted-foreground">
            {titleName} is with the Publisher
            {submittedAgo ? ` (sent ${submittedAgo})` : ""}. You can&apos;t make
            changes while it&apos;s in review. If it&apos;s returned with
            changes, editing unlocks again.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
