"use client"

import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  UploadCloud,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getUploads, type UploadState } from "@/sections/dashboard/dashboard-data"

// Connection loss is resumable (pick up from the last chunk); other failures retry.
const isConnectionLost = (reason?: string) => !reason || /connection/i.test(reason)

function StateLabel({
  state,
  online,
  reason,
}: {
  state: UploadState
  online: boolean
  reason?: string
}) {
  // While offline, in-flight transfers are paused, not progressing.
  if (!online && (state === "uploading" || state === "processing")) {
    return (
      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
        <WifiOff className="size-3" />
        Waiting for connection
      </span>
    )
  }
  switch (state) {
    case "uploading":
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Uploading
        </span>
      )
    case "processing":
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Processing
        </span>
      )
    case "failed":
      return <span className="text-destructive">{reason ?? "Connection lost"}</span>
    case "complete":
      return (
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
          <CheckCircle2 className="size-3" />
          Ready
        </span>
      )
  }
}

export function DashboardUploads() {
  const uploads = getUploads()
  const online = useOnlineStatus()
  const activeCount = uploads.filter(
    (u) => u.state === "uploading" || u.state === "processing"
  ).length

  return (
    <Card data-tour="upload" className="transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="size-4 text-muted-foreground" />
          Upload Manager
        </CardTitle>
        <CardDescription>
          Running in the background — you can keep working.
        </CardDescription>
        <CardAction>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {activeCount} active
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {uploads.map((upload) => (
          <div key={upload.title} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="grid leading-tight">
                <span className="font-medium">{upload.title}</span>
                <span className="text-xs text-muted-foreground">
                  {upload.detail}
                </span>
              </div>
              {upload.state === "failed" ? (
                <Button variant="outline" size="xs">
                  <RefreshCw />
                  {isConnectionLost(upload.reason) ? "Resume" : "Retry"}
                </Button>
              ) : upload.state === "uploading" ? (
                <span className="text-xs font-medium tabular-nums">
                  {upload.progress}%
                  {online && upload.speed && upload.speed !== "—"
                    ? ` · ${upload.speed}`
                    : ""}
                </span>
              ) : null}
            </div>
            <Progress
              value={upload.progress}
              className={cn(
                "[&_[data-slot=progress-indicator]]:transition-all",
                upload.state === "failed" &&
                  "[&_[data-slot=progress-indicator]]:bg-destructive",
                upload.state === "complete" &&
                  "[&_[data-slot=progress-indicator]]:bg-emerald-500"
              )}
            />
            <div className="flex items-center justify-between text-xs">
              <StateLabel
                state={upload.state}
                online={online}
                reason={upload.reason}
              />
              <span className="text-muted-foreground tabular-nums">
                {upload.size}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
