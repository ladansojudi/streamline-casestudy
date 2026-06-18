"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { resetStore } from "@/data/store"

export function ResetDataDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)

  const confirm = async () => {
    setPending(true)
    // Restore the seed snapshot, then refetch every query so the UI updates.
    resetStore()
    await qc.invalidateQueries()
    setPending(false)
    onOpenChange(false)
    toast.success("Demo data reset to its original state")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="size-4 text-muted-foreground" />
            Reset demo data?
          </DialogTitle>
          <DialogDescription>
            This restores all titles, segments, and comments to the original
            sample data. Anything you&apos;ve created, edited, or deleted in this
            browser will be discarded.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={confirm}
            disabled={pending}
          >
            <RotateCcw />
            Reset data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
