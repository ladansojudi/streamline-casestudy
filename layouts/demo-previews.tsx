"use client"

import type { ReactNode } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Tag,
  UploadCloud,
  WifiOff,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type DemoKind =
  | "offline"
  | "failed-uploads"
  | "returned-changes"
  | "incomplete-submit"
  | "empty-queue"

function UploadRow({
  name,
  detail,
  progress,
  failed = false,
  right,
  status,
}: {
  name: string
  detail: string
  progress: number
  failed?: boolean
  right?: ReactNode
  status: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="grid leading-tight">
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{detail}</span>
        </div>
        {right}
      </div>
      <Progress
        value={progress}
        className={cn(
          failed && "[&_[data-slot=progress-indicator]]:bg-destructive"
        )}
      />
      <div className="flex items-center justify-between text-xs">{status}</div>
    </div>
  )
}

export function DemoPreview({ kind }: { kind: DemoKind }) {
  if (kind === "offline") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <WifiOff className="size-3.5 shrink-0" />
          You&apos;re offline — uploads are paused and will resume automatically
          when you&apos;re back online.
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UploadCloud className="size-4 text-muted-foreground" />
              Upload Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            <UploadRow
              name="Stranger Things · S4 · E09"
              detail="ProRes 4444 · 92.2 GB"
              progress={72}
              status={
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                  <WifiOff className="size-3" />
                  Waiting for connection
                </span>
              }
            />
            <UploadRow
              name="Money Heist · Part 5 · E07"
              detail="ProRes 422 · 22.4 GB"
              progress={34}
              status={
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                  <WifiOff className="size-3" />
                  Waiting for connection
                </span>
              }
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (kind === "failed-uploads") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UploadCloud className="size-4 text-muted-foreground" />
            Upload Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          <UploadRow
            name="Stranger Things · S4 · E09"
            detail="ProRes 4444 · 92.2 GB"
            progress={72}
            right={
              <span className="text-xs font-medium tabular-nums">
                72% · 134 Mbps
              </span>
            }
            status={
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Uploading
              </span>
            }
          />
          <UploadRow
            name="Money Heist · Part 5 · E07"
            detail="ProRes 422 · 22.4 GB"
            progress={34}
            failed
            right={
              <Button variant="outline" size="xs">
                <RefreshCw />
                Resume
              </Button>
            }
            status={<span className="text-destructive">Connection lost</span>}
          />
          <UploadRow
            name="Wednesday · S1 · E06"
            detail="ProRes 4444 · 46.7 GB"
            progress={18}
            failed
            right={
              <Button variant="outline" size="xs">
                <RefreshCw />
                Retry
              </Button>
            }
            status={
              <span className="text-destructive">
                Server error during transcode
              </span>
            }
          />
        </CardContent>
      </Card>
    )
  }

  if (kind === "empty-queue") {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
          <CardDescription>Nothing awaiting review</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col px-0">
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-5" />
            </span>
            <p className="text-sm font-medium">All caught up</p>
            <p className="text-xs text-muted-foreground">
              No titles are waiting for review right now.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (kind === "returned-changes") {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-1.5 rounded-md p-2.5 ring-2 ring-amber-500">
          <div className="flex items-center justify-between gap-2">
            <Label>Synopsis</Label>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-500">
              <MessageSquare className="size-2.5" />1 note
            </span>
          </div>
          <Input
            readOnly
            value="Wednesday Addams navigates her years at Nevermore Academy…"
          />
        </div>

        <Card className="border border-amber-500/30 bg-amber-50/60 ring-0 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <RotateCcw className="size-4 text-amber-600 dark:text-amber-500" />
              Publisher notes
            </CardTitle>
            <CardDescription>
              2 open. Fix each and resolve, then resubmit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              {
                tag: "Synopsis",
                icon: <Tag className="size-2.5" />,
                body: "Tighten the logline to one sentence.",
                cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
              },
              {
                tag: "12:04",
                icon: <Clock className="size-2.5" />,
                body: "Audio dips on the dialogue track — bring the mix up.",
                cls: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
              },
            ].map((n) => (
              <div
                key={n.tag}
                className="flex gap-2 rounded-md border border-border bg-background p-2.5"
              >
                <span
                  className={cn(
                    "flex h-5 shrink-0 items-center gap-1 rounded px-1 text-[10px] font-medium",
                    n.cls
                  )}
                >
                  {n.icon}
                  {n.tag}
                </span>
                <p className="min-w-0 flex-1 text-sm">{n.body}</p>
                <Badge variant="outline" className="shrink-0">
                  Resolve
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // incomplete-submit
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
        <AlertTriangle className="size-3.5 shrink-0" />
        Finish these before submitting: complete title metadata, add an audience
        thumbnail.
      </div>
      <Card className="ring-2 ring-destructive/60">
        <CardHeader>
          <CardTitle className="text-sm">Title metadata</CardTitle>
          <CardDescription className="text-destructive">
            Fill the required fields below before submitting for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label>Cast</Label>
            <Input placeholder="Lead actors, comma separated" />
            <p className="text-xs text-destructive">Add the main cast</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
