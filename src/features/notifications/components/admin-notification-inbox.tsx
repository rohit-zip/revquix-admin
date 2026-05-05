"use client"

import { useState } from "react"
import {
  Bell,
  BellOff,
  Calendar,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gavel,
  Megaphone,
  Sparkles,
  TrendingUp,
  UserCheck,
  Video,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../api/notifications.hooks"
import type { NotificationCategory, NotificationResponse } from "../api/notifications.types"

// ─── Category visual config ───────────────────────────────────────────────────

type CategoryVisual = { Icon: React.ElementType; bg: string; text: string }

const CATEGORY_VISUAL: Record<NotificationCategory, CategoryVisual> = {
  BOOKINGS:           { Icon: Calendar,   bg: "bg-blue-100 dark:bg-blue-950",       text: "text-blue-600 dark:text-blue-400" },
  PAYMENTS:           { Icon: CreditCard, bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400" },
  MOCK_INTERVIEWS:    { Icon: Video,      bg: "bg-violet-100 dark:bg-violet-950",   text: "text-violet-600 dark:text-violet-400" },
  HOURLY_SESSIONS:    { Icon: Calendar,   bg: "bg-sky-100 dark:bg-sky-950",         text: "text-sky-600 dark:text-sky-400" },
  DISPUTES:           { Icon: Gavel,      bg: "bg-red-100 dark:bg-red-950",         text: "text-red-600 dark:text-red-400" },
  MENTOR_APPLICATION: { Icon: UserCheck,  bg: "bg-indigo-100 dark:bg-indigo-950",   text: "text-indigo-600 dark:text-indigo-400" },
  MENTOR_EARNINGS:    { Icon: Wallet,     bg: "bg-teal-100 dark:bg-teal-950",       text: "text-teal-600 dark:text-teal-400" },
  MENTOR_STATUS:      { Icon: TrendingUp, bg: "bg-orange-100 dark:bg-orange-950",   text: "text-orange-600 dark:text-orange-400" },
  PLATFORM:           { Icon: Megaphone,  bg: "bg-pink-100 dark:bg-pink-950",       text: "text-pink-600 dark:text-pink-400" },
}

const DEFAULT_VISUAL: CategoryVisual = { Icon: Sparkles, bg: "bg-muted", text: "text-muted-foreground" }

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateString).toLocaleDateString()
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({ notification }: { notification: NotificationResponse }) {
  const { mutate: markRead } = useMarkNotificationRead()
  const visual = CATEGORY_VISUAL[notification.category] ?? DEFAULT_VISUAL
  const { Icon } = visual

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
        !notification.read && "border-l-2 border-primary bg-primary/2",
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", visual.bg)}>
        <Icon className={cn("h-4 w-4", visual.text)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("text-sm leading-snug", !notification.read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
              {notification.title}
            </p>
            {notification.message && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </p>
            )}
          </div>

          {/* Right side: time + unread dot */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {relativeTime(notification.createdAt)}
            </span>
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {notification.category.replace(/_/g, " ")}
          </Badge>
          {!notification.read && (
            <button
              onClick={() => markRead(notification.notificationId)}
              className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="h-3 w-3" />
              Mark read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminNotificationInbox() {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data, isLoading, isError } = useMyNotifications(page, PAGE_SIZE)
  const { mutate: markAll, isPending: isMarkingAll } = useMarkAllNotificationsRead()

  const notifications = data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">My Notifications</span>
          {unreadCount > 0 && (
            <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll()}
            disabled={isMarkingAll}
            className="h-7 gap-1.5 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Failed to load notifications</p>
          <p className="text-xs text-muted-foreground">Please refresh the page.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="text-xs text-muted-foreground">No notifications yet.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
      )}

      {/* List */}
      {!isLoading && notifications.length > 0 && (
        <div className="divide-y">
          {notifications.map((n) => (
            <NotificationRow key={n.notificationId} notification={n} />
          ))}
        </div>
      )}

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {totalElements.toLocaleString()} total &middot; page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
