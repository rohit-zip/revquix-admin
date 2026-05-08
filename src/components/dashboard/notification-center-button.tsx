"use client"

import { useState } from "react"
import { useUnreadCount } from "@/features/notifications/api/notifications.hooks"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { cn } from "@/lib/utils"

interface NotificationCenterButtonProps {
  className?: string
}

/**
 * Centralized notification trigger used in the admin top navigation.
 * Includes the bell trigger, panel open state, and unread badge.
 */
export function NotificationCenterButton({ className }: NotificationCenterButtonProps) {
  const [open, setOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <div className={cn("relative", className)}>
      <NotificationBell open={open} onOpenChange={setOpen} />
      {unreadCount > 0 && (
        <span className="pointer-events-none absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  )
}
