"use client"

import { useState } from "react"
import { Bell, ChevronLeft, ChevronRight, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminNotificationHistory } from "../api/notifications.hooks"

// ─── Simple relative time formatter ──────────────────────────────────────────

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

// ─── Notification History Table ───────────────────────────────────────────────

export function NotificationHistoryTable() {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data, isLoading } = useAdminNotificationHistory(page, PAGE_SIZE)

  const notifications = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notification History
        </CardTitle>
        <CardDescription>
          All notifications sent on the platform, ordered by most recent.
          {data && (
            <span className="ml-1 text-foreground font-medium">
              ({data.totalElements.toLocaleString()} total)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))}

              {!isLoading && notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No notifications sent yet.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                notifications.map((n) => {
                  const target = n.targetUserId
                    ? `User: ${n.targetUserId}`
                    : `Broadcast`

                  return (
                    <TableRow key={n.notificationId}>
                      <TableCell className="max-w-50">
                        <p className="truncate font-medium text-sm">{n.title}</p>
                        {n.message && (
                          <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">
                          {n.type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {n.category.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{target}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              n.read ? "bg-muted-foreground/40" : "bg-primary"
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {n.read ? "Read" : "Unread"}
                          </span>
                          {n.email && (
                            <Mail className="h-3 w-3 text-muted-foreground" title="Email sent" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(n.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
