import { Suspense } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppHeader } from "@/layouts/app-header"
import { AppSidebar } from "@/layouts/app-sidebar"
import { OfflineBanner } from "@/layouts/offline-banner"
import { QueryProvider } from "@/layouts/query-provider"
import { RoleProvider } from "@/layouts/role-context"
import { TourSpotlight } from "@/layouts/tour-spotlight"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RoleProvider>
        <TooltipProvider delay={0}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <OfflineBanner />
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Suspense fallback={null}>
            <TourSpotlight />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </RoleProvider>
    </QueryProvider>
  )
}
