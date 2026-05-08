"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ExternalLink, LogOut, ChevronDown, LayoutDashboard } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { useLogout } from "@/features/auth/api/auth.hooks"
import { NotificationCenterButton } from "@/components/dashboard/notification-center-button"

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:2000"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DashboardTopbarProps {}

function TopbarUserMenu() {
  const { user, currentUser } = useAuth()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open user menu"
        >
          <UserAvatar
            user={user}
            currentUser={currentUser}
            className="cursor-pointer transition-opacity hover:opacity-80"
          />
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UserAvatar user={user} currentUser={currentUser} className="shrink-0" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {user?.name ?? user?.username ?? "Admin"}
            </span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href={DASHBOARD_URL} className="cursor-pointer">
              <LayoutDashboard className="size-4" />
              User Dashboard
              <ExternalLink className="ml-auto size-3 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          disabled={isLoggingOut}
          onClick={() => logout()}
        >
          <LogOut className="size-4" />
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardTopbar(_props: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="ml-auto flex items-center gap-2">
        <NotificationCenterButton />
        <TopbarUserMenu />
      </div>
    </header>
  )
}
