/**
 * ─── USER LOGIN HISTORY TAB (ADMIN) ──────────────────────────────────────────
 *
 * Displays paginated login history for a specific user in the admin panel.
 * Shows all sessions (active and revoked) with device, IP, location, status.
 */

"use client"

import React, { useState } from "react"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  History,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAdminUserSessionHistory } from "@/features/admin/api/admin-user.hooks"
import type { UserSessionResponse } from "@/features/user/api/session.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  const cls = "size-4"
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className={cls} />
    case "tablet":
      return <Tablet className={cls} />
    default:
      return <Monitor className={cls} />
  }
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ session }: { session: UserSessionResponse }) {
  if (!session.isRevoked) {
    return (
      <Badge variant="outline" className="gap-1 text-xs border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" />
        Active
      </Badge>
    )
  }
  const revokedBy = session.revokedBy
  if (revokedBy === "ROTATED") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <RotateCw className="size-3" />
        Rotated
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1 text-xs opacity-80">
      <XCircle className="size-3" />
      {formatRevokeReason(revokedBy)}
    </Badge>
  )
}

function formatRevokeReason(reason: string | null): string {
  switch (reason) {
    case "USER_LOGOUT":
      return "User Logout"
    case "PASSWORD_CHANGE":
      return "Password Changed"
    case "ADMIN":
      return "Admin Revoked"
    case "REUSE_DETECTED":
      return "Security Alert"
    default:
      return "Revoked"
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserLoginHistoryTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export default function UserLoginHistoryTab({ userId }: UserLoginHistoryTabProps) {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, refetch } = useAdminUserSessionHistory(userId, page, PAGE_SIZE)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load login history</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const sessions = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="size-5" />
              Login History
            </CardTitle>
            <CardDescription className="mt-1">
              {totalElements} total session{totalElements !== 1 ? "s" : ""} — full sign-in history
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <History className="size-10 opacity-40" />
            <p className="text-sm">No login history found for this user</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Signed In</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revoked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon deviceType={session.deviceType} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[140px]">
                              {session.browser ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {session.os ?? "Unknown OS"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {session.location ? (
                            <>
                              <MapPin className="size-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{session.location}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-sm text-muted-foreground font-mono cursor-default">
                                <Globe className="size-3" />
                                {session.ipAddress ?? "—"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs font-mono">{session.ipAddress}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="size-3" />
                          {formatDateTime(session.issuedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(session.lastUsedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge session={session} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {session.revokedAt ? formatDateTime(session.revokedAt) : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden space-y-3">
              {sessions.map((session) => (
                <div key={session.sessionId} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DeviceIcon deviceType={session.deviceType} />
                      <div>
                        <p className="font-medium text-sm">{session.browser ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{session.os ?? "Unknown OS"}</p>
                      </div>
                    </div>
                    <StatusBadge session={session} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {session.location}
                      </span>
                    )}
                    {session.ipAddress && (
                      <span className="flex items-center gap-1">
                        <Globe className="size-3" />
                        {session.ipAddress}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDateTime(session.issuedAt)}
                    </span>
                    {session.revokedBy && session.revokedBy !== "ROTATED" && (
                      <span className="flex items-center gap-1 text-destructive">
                        {formatRevokeReason(session.revokedBy)} at {formatDateTime(session.revokedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

