"use client"

import { useRole } from "@/layouts/role-context"
import { DashboardActivity } from "@/sections/dashboard/dashboard-activity"
import { DashboardHeading } from "@/sections/dashboard/dashboard-heading"
import { DashboardPipeline } from "@/sections/dashboard/dashboard-pipeline"
import { DashboardQueue } from "@/sections/dashboard/dashboard-queue"
import { DashboardReleases } from "@/sections/dashboard/dashboard-releases"
import { DashboardReturned } from "@/sections/dashboard/dashboard-returned"
import { DashboardStats } from "@/sections/dashboard/dashboard-stats"
import { DashboardUploads } from "@/sections/dashboard/dashboard-uploads"

export function DashboardView() {
  const { role } = useRole()

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DashboardHeading />
      <DashboardStats />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Primary work column */}
        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2">
          <DashboardPipeline />
          {role === "editor" ? <DashboardReturned /> : <DashboardQueue />}
          <DashboardActivity />
        </div>

        {/* Side rail */}
        <div className="flex flex-col gap-4 md:gap-6">
          {role === "editor" ? <DashboardUploads /> : null}
          <DashboardReleases />
        </div>
      </div>
    </div>
  )
}
