import { cn } from "@/lib/utils"
import type { AssetKey } from "@/data/db"
import { assetMeta } from "@/sections/library/library-data"

/**
 * Per-asset-type count strip (like the Asset QC dashboard): one icon per asset
 * type with how many of the title's episodes have it. `total` is the episode
 * count, so a complete asset (count === total) reads as "done".
 */
export function LibraryAssetCounts({
  counts,
  total,
  size = "default",
}: {
  counts: Record<AssetKey, number>
  total: number
  size?: "default" | "sm"
}) {
  return (
    <div className={cn("flex items-center", size === "sm" ? "gap-2.5" : "gap-4")}>
      {assetMeta.map(({ key, label, icon: Icon }) => {
        const n = counts[key]
        const complete = total > 0 && n === total
        const empty = n === 0
        return (
          <div
            key={key}
            title={`${label}: ${n}/${total}`}
            className="flex flex-col items-center gap-0.5"
          >
            <Icon
              className={cn(
                size === "sm" ? "size-3.5" : "size-4",
                complete
                  ? "text-emerald-600 dark:text-emerald-500"
                  : empty
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "tabular-nums leading-none",
                size === "sm" ? "text-[10px]" : "text-xs",
                empty ? "text-muted-foreground/50" : "font-medium"
              )}
            >
              {n}
            </span>
          </div>
        )
      })}
    </div>
  )
}
