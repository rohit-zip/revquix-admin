"use client"

import React, { useState } from "react"
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DataExplorer, type DataColumn } from "@/components/data-explorer"
import { useAdminNotificationSearch } from "../api/notifications.hooks"
import type { NotificationResponse } from "../api/notifications.types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return "just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(dateString).toLocaleDateString()
}

const CATEGORY_COLOR: Record<string, string> = {
  BOOKINGS:           "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PAYMENTS:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  RESUME_REVIEW:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  MOCK_INTERVIEWS:    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  HOURLY_SESSIONS:    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  DISPUTES:           "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MENTOR_APPLICATION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  MENTOR_EARNINGS:    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  MENTOR_STATUS:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  PLATFORM:           "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
}

const CATEGORY_LABEL: Record<string, string> = {
  BOOKINGS:           "Bookings",
  PAYMENTS:           "Payments",
  RESUME_REVIEW:      "Resume Review",
  MOCK_INTERVIEWS:    "Mock Interviews",
  HOURLY_SESSIONS:    "Hourly Sessions",
  DISPUTES:           "Disputes",
  MENTOR_APPLICATION: "Mentor Application",
  MENTOR_EARNINGS:    "Mentor Earnings",
  MENTOR_STATUS:      "Mentor Status",
  PLATFORM:           "Platform",
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLOR[category] ?? "bg-muted text-muted-foreground"
  const label = CATEGORY_LABEL[category] ?? category.replace(/_/g, " ")
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", cls)}>
      {label}
    </span>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: DataColumn<NotificationResponse>[] = [
  { key: "user",       header: "User",         sortable: false },
  { key: "title",      header: "Notification",  sortable: false },
  { key: "category",   header: "Category",      sortable: true,  hideOnMobile: true },
  { key: "createdAt",  header: "Sent",          sortable: true },
  { key: "status",     header: "Status",        sortable: false,  hideOnMobile: true },
  { key: "expand",     header: "",              sortable: false },
]

// ─── Expanded detail panel ────────────────────────────────────────────────────

function ExpandedDetail({ n }: { n: NotificationResponse }) {
  return (
    <div className="grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {/* Recipient */}
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Recipient</p>
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="break-all">{n.targetUserEmail ?? n.targetUserId ?? "—"}</span>
        </div>
        {n.targetUserName && (
          <p className="pl-5 text-xs text-muted-foreground">{n.targetUserName}</p>
        )}
        {n.targetUserId && (
          <p className="pl-5 font-mono text-[10px] text-muted-foreground">{n.targetUserId}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Type</p>
        <Badge variant="outline" className="text-[10px]">
          {n.type.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Email */}
      <div className="space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email notification</p>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={n.email ? "text-foreground" : "text-muted-foreground"}>
            {n.email ? "Sent" : "Not sent"}
          </span>
        </div>
      </div>

      {/* Message */}
      {n.message && (
        <div className="space-y-0.5 sm:col-span-2 lg:col-span-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Message</p>
          <p className="whitespace-pre-wrap text-sm text-foreground/80">{n.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      {n.actionButtons && n.actionButtons.length > 0 && (
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Action Buttons</p>
          <div className="flex flex-wrap gap-2">
            {n.actionButtons.map((btn, i) => {
              const isExternal = btn.url?.startsWith("http")
              return (
                <a
                  key={i}
                  href={btn.url}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {btn.label}
                  {isExternal && <ExternalLink className="h-3 w-3" />}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* ID + timestamps */}
      <div className="space-y-0.5 sm:col-span-2 lg:col-span-3 border-t pt-2">
        <p className="font-mono text-[10px] text-muted-foreground">ID: {n.notificationId}</p>
        {n.expiresAt && (
          <p className="text-[10px] text-muted-foreground">
            Expires: {new Date(n.expiresAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationHistoryTable() {
  const search = useAdminNotificationSearch()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <DataExplorer
      search={search}
      columns={COLUMNS}
      title="Notification History"
      description="All notifications sent on the platform. Click a row to expand full details."
      headerActions={
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          {search.totalElements.toLocaleString()} total
        </div>
      }
      renderRow={(n) => {
        const isExpanded = expandedIds.has(n.notificationId)
        const hasUser = n.targetUserEmail || n.targetUserName || n.targetUserId

        return (
          <React.Fragment key={n.notificationId}>
            {/* ── Summary row ─────────────────────────────────────────── */}
            <TableRow
              className={cn(
                "group transition-colors",
                isExpanded && "bg-muted/30",
              )}
            >
              {/* User */}
              <TableCell className="max-w-45">
                {hasUser ? (
                  <div className="space-y-0.5">
                    <p className="truncate text-sm font-medium">
                      {n.targetUserName ?? n.targetUserEmail ?? n.targetUserId}
                    </p>
                    {n.targetUserEmail && n.targetUserName && (
                      <p className="truncate text-[11px] text-muted-foreground">{n.targetUserEmail}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">—</span>
                )}
              </TableCell>

              {/* Notification title */}
              <TableCell className="max-w-55">
                <p className="truncate text-sm font-medium">{n.title}</p>
                {n.message && (
                  <p className="truncate text-[11px] text-muted-foreground">{n.message}</p>
                )}
              </TableCell>

              {/* Category */}
              <TableCell className="hidden md:table-cell">
                <CategoryBadge category={n.category} />
              </TableCell>

              {/* Sent time */}
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {relativeTime(n.createdAt)}
              </TableCell>

              {/* Status */}
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      n.read ? "bg-muted-foreground/40" : "bg-primary",
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {n.read ? "Read" : "Unread"}
                  </span>
                  {n.email && (
                    <Mail className="h-3 w-3 text-muted-foreground" title="Email sent" />
                  )}
                </div>
              </TableCell>

              {/* Expand toggle */}
              <TableCell className="w-10 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleExpand(n.notificationId)}
                  aria-label={isExpanded ? "Collapse details" : "Expand details"}
                >
                  {isExpanded
                    ? <ChevronUp className="h-3.5 w-3.5" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </TableCell>
            </TableRow>

            {/* ── Expanded detail row ──────────────────────────────────── */}
            {isExpanded && (
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableCell colSpan={COLUMNS.length} className="p-0">
                  <ExpandedDetail n={n} />
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        )
      }}
    />
  )
}
