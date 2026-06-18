"use client"

import { useEffect, useRef } from "react"
import { WifiOff } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"

export function OfflineBanner() {
  const online = useOnlineStatus()
  const prevOnline = useRef(online)

  // Announce the transition (not the initial state).
  useEffect(() => {
    if (prevOnline.current === online) return
    prevOnline.current = online
    if (online) toast.success("Back online — resuming uploads")
    else toast.warning("You're offline — uploads paused")
  }, [online])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "overflow-hidden border-b border-amber-500/30 bg-amber-50 text-amber-800 transition-all dark:bg-amber-950/40 dark:text-amber-300",
        online ? "max-h-0 border-b-0" : "max-h-12"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium md:px-6">
        <WifiOff className="size-3.5 shrink-0" />
        You&apos;re offline — uploads are paused and will resume automatically
        when you&apos;re back online.
      </div>
    </div>
  )
}
