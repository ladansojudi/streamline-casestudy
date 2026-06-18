"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ContentStudioSubmitDialog({
  open,
  onOpenChange,
  titleName,
  episodeCount,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  titleName: string
  episodeCount: number
  onConfirm: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)

  const confirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit {titleName} for review?</DialogTitle>
          <DialogDescription>
            {episodeCount} {episodeCount === 1 ? "episode" : "episodes"} will be
            sent to the Publisher&apos;s review queue. They&apos;ll either
            publish it or send it back with comments. You can keep editing once
            it&apos;s returned.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={confirm} disabled={submitting}>
            <Send />
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
