"use client"

import type { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"

/**
 * ─── ADMIN DASH LAYOUT ───────────────────────────────────────────────────────
 *
 * Sidebar + topbar shell for all admin pages.
 * No workspace switcher or WorkspaceProvider — the admin app is a single panel.
 * Authority filtering is done inside AppSidebar via useFilteredSections().
 */
export default function DashLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardTopbar />
        <div className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

