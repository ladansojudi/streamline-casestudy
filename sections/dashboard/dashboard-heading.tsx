"use client"

import { useState } from "react"
import Link from "next/link"
import { FolderOpen, Plus, ClipboardCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useRole } from "@/layouts/role-context"
import { ContentStudioNewTitleDialog } from "@/sections/content-studio/content-studio-new-title-dialog"

export function DashboardHeading() {
  const { role, persona } = useRole()
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {persona.label} workspace
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Welcome back, {persona.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {role === "editor"
            ? "3 titles need your attention before they can ship."
            : "6 titles are waiting in your review queue."}
        </p>
      </div>

      {role === "editor" ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/content-studio" />}
          >
            <FolderOpen />
            Resume drafts
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            New title
          </Button>
          <ContentStudioNewTitleDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<Link href="/schedule" />}>
            <FolderOpen />
            Release calendar
          </Button>
          <Button size="sm" render={<Link href="/review" />}>
            <ClipboardCheck />
            Open review queue
          </Button>
        </div>
      )}
    </div>
  )
}
