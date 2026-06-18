import { cn } from "@/lib/utils"
import type { EpisodeStatus } from "@/data/db"
import { statusMeta } from "@/sections/library/library-data"

export function LibraryStatus({ status }: { status: EpisodeStatus }) {
  const meta = statusMeta[status]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium">
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      <span className={meta.text}>{meta.label}</span>
    </span>
  )
}
