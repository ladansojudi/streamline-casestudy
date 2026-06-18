"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { demoMode } from "@/lib/demo-mode"

type Bet = {
  n: number
  title: string
  desc: string
  href: string
}

const BETS: Bet[] = [
  {
    n: 1,
    title: "Drop-and-build hierarchy",
    desc: "Start a new title, then drop files → Series → Season → Episode tree.",
    href: "/content-studio?new=1",
  },
  {
    n: 2,
    title: "Background, resumable uploads",
    desc: "A docked Upload Manager — chunked, resumable, survives dropped connections.",
    href: "/?tour=upload",
  },
  {
    n: 3,
    title: "In-flow audience segmentation",
    desc: "Build segments inside the flow; a required default → no blanks.",
    href: "/content-studio/t_stranger?tour=audience",
  },
  {
    n: 4,
    title: "Pinned feedback → fix list",
    desc: "Comments pinned to the exact field or timestamp, bundled into one fix list.",
    href: "/content-studio/t_wednesday?tour=feedback",
  },
]

export function TourPanel() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const showMe = (href: string) => {
    // Make sure a simulated-offline session doesn't muddy the tour.
    demoMode.setForcedOffline(false)
    setOpen(false)
    router.push(href)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            aria-label="How it works"
          >
            <Lightbulb className="size-4" />
            <span className="hidden sm:inline">How it works</span>
          </Button>
        }
      />
      <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-primary" />
            Four problems, four answers
          </SheetTitle>
          <SheetDescription>
            The bets this product makes. Click one to jump to where it lives —
            it&apos;ll spotlight the spot.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-6">
          {BETS.map((b) => (
            <button
              key={b.n}
              type="button"
              onClick={() => showMe(b.href)}
              className="group flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-semibold text-amber-700 tabular-nums dark:text-amber-500">
                {b.n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
                <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Show me
                  <ChevronRight className="size-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
