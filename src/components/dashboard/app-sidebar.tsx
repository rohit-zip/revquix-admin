"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Logo from "@/components/logo"
import { useLogout } from "@/features/auth/api/auth.hooks"
import { LogOut, ShieldCheck } from "lucide-react"
import { ADMIN_NAV_SECTIONS } from "@/config/dashboard/nav.config"
import { useFilteredSections } from "@/hooks/useFilteredSections"

/**
 * ─── ADMIN APP SIDEBAR ───────────────────────────────────────────────────────
 *
 * Simplified sidebar for revquix-admin — no workspace switcher.
 * Sections and items are authority-filtered via useFilteredSections(), so each
 * user only sees the nav items their roles/permissions allow.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  // Filter sections and items by the user's current authorities
  const sections = useFilteredSections(ADMIN_NAV_SECTIONS)

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: Logo + App Label ── */}
      <SidebarHeader className="gap-0">
        <div className="flex h-12 items-center gap-2.5 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0">
          <Logo
            size={22}
            className="shrink-0 group-data-[collapsible=icon]:size-7"
          />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm tracking-tight leading-tight">
              Revquix
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-tight">
              <ShieldCheck className="h-2.5 w-2.5" />
              Admin Panel
            </span>
          </div>
        </div>

        <SidebarSeparator />
      </SidebarHeader>

      {/* ── Content: Authority-filtered navigation ── */}
      <SidebarContent>
        {sections.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.title && (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const ItemIcon = item.Icon
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <ItemIcon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer: Sign out ── */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              disabled={isLoggingOut}
              onClick={() => logout()}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut />
              <span>{isLoggingOut ? "Signing out…" : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

