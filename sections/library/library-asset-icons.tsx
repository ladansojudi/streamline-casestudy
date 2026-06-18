import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AssetKey } from "@/data/db"
import { assetMeta } from "@/sections/library/library-data"

export function LibraryAssetIcons({
  assets,
}: {
  assets: Record<AssetKey, boolean>
}) {
  return (
    <div className="flex items-center gap-1">
      {assetMeta.map(({ key, label, icon: Icon }) => {
        const present = assets[key]
        return (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded",
                    present
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                      : "bg-muted text-muted-foreground/40"
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              }
            />
            <TooltipContent>
              {label}: {present ? "ready" : "missing"}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
