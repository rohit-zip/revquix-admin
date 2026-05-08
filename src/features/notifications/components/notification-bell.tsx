"use client"

import { useEffect } from "react"
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { NotificationPanelContent, type NotificationPanelProps } from "./notification-panel"
import { useMarkAllNotificationsRead } from "../api/notifications.hooks"

/**
 * Responsive notification bell:
 * - Desktop (≥1000 px): Popover anchored below the bell icon
 * - Mobile (<1000 px): bottom Sheet with a drag handle
 */
export function NotificationBell({ open, onOpenChange }: NotificationPanelProps) {
  const isMobile = useIsMobile()
  const { mutate: markAllRead } = useMarkAllNotificationsRead()

  // Mark all as read the moment the panel opens
  useEffect(() => {
    if (open) markAllRead()
  }, [open, markAllRead])

  const triggerButton = (
    <button
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Open notifications"
      onClick={() => isMobile && onOpenChange(!open)}
    >
      <Bell className="h-4.5 w-4.5" />
    </button>
  )

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-95 overflow-hidden p-0 shadow-xl"
        >
          <NotificationPanelContent onClose={() => onOpenChange(false)} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      {triggerButton}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto gap-0 p-0" showCloseButton={false}>
          {/* Accessible but visually hidden title/description for screen readers */}
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <SheetDescription className="sr-only">
            Your recent platform notifications
          </SheetDescription>
          <NotificationPanelContent onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
