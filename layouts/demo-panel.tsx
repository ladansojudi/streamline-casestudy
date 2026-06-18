"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ChevronRight,
  FlaskConical,
  Inbox,
  RotateCcw,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { demoMode, useForcedOffline } from "@/lib/demo-mode"
import { DemoPreview, type DemoKind } from "@/layouts/demo-previews"

type EdgeCase = {
  kind: DemoKind
  icon: LucideIcon
  title: string
  where: string
  href: string
}

const EDGE_CASES: EdgeCase[] = [
  {
    kind: "offline",
    icon: WifiOff,
    title: "Dropped connection",
    where: "Offline banner appears and uploads pause until you're back.",
    href: "/",
  },
  {
    kind: "failed-uploads",
    icon: AlertTriangle,
    title: "Failed uploads",
    where: "A lost connection offers Resume; a server error offers Retry.",
    href: "/",
  },
  {
    kind: "returned-changes",
    icon: RotateCcw,
    title: "Returned with changes",
    where: "Publisher notes pinned to each field, with a fix view.",
    href: "/content-studio/t_wednesday",
  },
  {
    kind: "incomplete-submit",
    icon: AlertTriangle,
    title: "Incomplete submit",
    where: "Submitting before it's ready flags the missing fields in red.",
    href: "/content-studio/t_wednesday",
  },
  {
    kind: "empty-queue",
    icon: Inbox,
    title: "Empty review queue",
    where: "An 'All caught up' state instead of a blank screen.",
    href: "/review",
  },
]

export function DemoPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<EdgeCase | null>(null)
  const forcedOffline = useForcedOffline()

  const seeLive = (href: string) => {
    setPreview(null)
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              aria-label="Edge cases"
            >
              <FlaskConical className="size-4" />
              <span className="hidden sm:inline">Edge cases</span>
            </Button>
          }
        />
        <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-primary" />
              Edge cases
            </SheetTitle>
            <SheetDescription>
              Click any case to preview it. Or flip the toggle to drop the
              connection for real.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
            {/* Live toggle: simulate offline */}
            <div
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 transition-colors",
                forcedOffline
                  ? "border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20"
                  : "border-border"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  forcedOffline
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-500"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {forcedOffline ? (
                  <WifiOff className="size-4" />
                ) : (
                  <Wifi className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Simulate offline (live)</p>
                <p className="text-xs text-muted-foreground">
                  {forcedOffline
                    ? "Connection is simulated as lost — uploads are paused."
                    : "Flip this to drop the connection app-wide."}
                </p>
              </div>
              <Button
                variant={forcedOffline ? "default" : "outline"}
                size="sm"
                onClick={() => demoMode.toggleOffline()}
              >
                {forcedOffline ? "Go online" : "Go offline"}
              </Button>
            </div>

            {/* Previewable cases */}
            <ul className="flex flex-col gap-2">
              {EDGE_CASES.map((c) => (
                <li key={c.kind}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setPreview(c)
                    }}
                    className="group flex w-full gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <c.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.where}</p>
                    </div>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview modal */}
      <Dialog
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
      >
        {preview ? (
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <preview.icon className="size-4 text-muted-foreground" />
                {preview.title}
              </DialogTitle>
              <DialogDescription>{preview.where}</DialogDescription>
            </DialogHeader>

            <DemoPreview kind={preview.kind} />

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreview(null)}
              >
                Close
              </Button>
              <Button size="sm" onClick={() => seeLive(preview.href)}>
                See it live
                <ChevronRight />
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  )
}
