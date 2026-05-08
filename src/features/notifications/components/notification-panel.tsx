"use client"

import {
  ArrowRight,
  Bell,
  BellOff,
  Calendar,
  CheckCheck,
  CreditCard,
  ExternalLink,
  Gavel,
  Megaphone,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Video,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "../api/notifications.hooks"
import { PATH_CONSTANTS } from "@/core/constants/path-constants"
import type { NotificationCategory, NotificationResponse } from "../api/notifications.types"

// ─── Category config: icon + color ───────────────────────────────────────────

type CategoryConfig = {
  Icon: React.ElementType
  bg: string
  text: string
}

const CATEGORY_CONFIG: Record<NotificationCategory, CategoryConfig> = {
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

const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  Icon: Sparkles,
  bg: "bg-muted",
  text: "text-muted-foreground",
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(dateString).toLocaleDateString()
}

// ─── Single notification item ─────────────────────────────────────────────────

interface NotificationItemProps {
  notification: NotificationResponse
  onRead: (id: string) => void
  onDelete: (id: string) => void
  onClose?: () => void
}

function NotificationItem({ notification, onRead, onDelete, onClose }: NotificationItemProps) {
  const { notificationId, title, message, category, read, createdAt, actionButtons } = notification
  const cfg = CATEGORY_CONFIG[category as NotificationCategory] ?? DEFAULT_CATEGORY_CONFIG
  const { Icon } = cfg
  const router = useRouter()

  return (
    <div
      className={[
        "group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50",
        !read ? "border-l-2 border-l-primary bg-primary/3" : "border-l-2 border-l-transparent",
      ].join(" ")}
      onClick={() => !read && onRead(notificationId)}
      role={!read ? "button" : undefined}
      tabIndex={!read ? 0 : undefined}
      onKeyDown={(e) => {
        if (!read && (e.key === "Enter" || e.key === " ")) onRead(notificationId)
      }}
    >
      {/* Category icon */}
      <div
        className={[
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          cfg.bg,
        ].join(" ")}
      >
        <Icon className={["h-3.5 w-3.5", cfg.text].join(" ")} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={[
              "text-[13px] leading-snug line-clamp-2",
              read ? "font-normal text-foreground/80" : "font-semibold text-foreground",
            ].join(" ")}
          >
            {title}
          </p>
          <span className="mt-0.5 shrink-0 text-[10px] tabular-nums text-muted-foreground whitespace-nowrap">
            {relativeTime(createdAt)}
          </span>
        </div>

        {message && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {message}
          </p>
        )}

        {actionButtons && actionButtons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {actionButtons.map((btn, i) => {
              const isExternal = /^https?:\/\//.test(btn.url)
              const isPrimary = i === 0
              if (isExternal) {
                return (
                  <Button
                    key={i}
                    variant={isPrimary ? "default" : "ghost"}
                    size="sm"
                    className="h-7 gap-1 px-2.5 text-[11px] font-medium"
                    asChild
                  >
                    <a
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!read) onRead(notificationId)
                      }}
                    >
                      {btn.label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </Button>
                )
              }
              return (
                <Button
                  key={i}
                  variant={isPrimary ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1 px-2.5 text-[11px] font-medium"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!read) onRead(notificationId)
                    onClose?.()
                    router.push(btn.url)
                  }}
                >
                  {btn.label}
                  <ArrowRight className="h-2.5 w-2.5" />
                </Button>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete — always visible on mobile, hover-only on desktop */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(notificationId)
        }}
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:text-muted-foreground sm:text-muted-foreground/0"
        title="Delete notification"
        aria-label="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function NotificationSkeletons() {
  return (
    <div className="divide-y">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3.5">
          <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-0.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <BellOff className="h-6 w-6 text-muted-foreground/60" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
        <p className="text-xs text-muted-foreground">
          We&apos;ll notify you when something needs attention.
        </p>
      </div>
    </div>
  )
}

// ─── Shared panel content (rendered inside Popover or Sheet) ─────────────────

interface NotificationPanelContentProps {
  /** Callback to close the containing Popover/Sheet */
  onClose?: () => void
}

export function NotificationPanelContent({ onClose }: NotificationPanelContentProps) {
  const { data, isLoading } = useMyNotifications(0, 10)
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead()
  const { mutate: deleteNotif } = useDeleteNotification()

  const notifications = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length
  const hasMore = totalElements > notifications.length

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <Separator />

      {/* Scrollable list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading && <NotificationSkeletons />}
        {!isLoading && notifications.length === 0 && <EmptyState />}
        {!isLoading && notifications.length > 0 && (
          <div className="divide-y">
            {notifications.map((n) => (
              <NotificationItem
                key={n.notificationId}
                notification={n}
                onRead={(id) => markRead(id)}
                onDelete={(id) => deleteNotif(id)}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — always rendered so user can reach /notifications */}
      {!isLoading && (
        <>
          <Separator />
          <div className="px-4 py-3">
            <Link
              href={PATH_CONSTANTS.NOTIFICATIONS}
              onClick={onClose}
              className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {hasMore ? (
                <>
                  View all
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                    {totalElements.toLocaleString()}
                  </span>
                  notifications
                </>
              ) : (
                "View all notifications"
              )}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Public prop type (for bell) ──────────────────────────────────────────────

export interface NotificationPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
