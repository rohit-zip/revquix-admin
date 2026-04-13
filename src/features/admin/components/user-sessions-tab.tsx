/**
 * ─── USER SESSIONS TAB (ADMIN) ───────────────────────────────────────────────
 *
 * Displays all active sessions for a specific user in the admin panel.
 * Admins can revoke individual sessions or force-sign-out from all devices.
 */

"use client"

import React, { useState } from "react"
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  useAdminUserSessions,
  useAdminRevokeSession,
  useAdminRevokeAllSessions,
} from "@/features/admin/api/admin-user.hooks"
import type { UserSessionResponse } from "@/features/user/api/session.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DeviceIcon({ deviceType }: { deviceType: string | null }) {
  const cls = "size-5 text-muted-foreground"
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <Smartphone className={cls} />
    case "tablet":
      return <Tablet className={cls} />
    default:
      return <Monitor className={cls} />
  }
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 2) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserSessionsTabProps {
  userId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserSessionsTab({ userId }: UserSessionsTabProps) {
  const [revokeAllOpen, setRevokeAllOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<UserSessionResponse | null>(null)

  const { data: sessions, isLoading, isError, refetch } = useAdminUserSessions(userId)
  const revokeSession = useAdminRevokeSession(userId)
  const revokeAll = useAdminRevokeAllSessions(userId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
          <p className="text-sm text-muted-foreground">Failed to load sessions</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const activeSessions = sessions ?? []

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5" />
                Active Sessions
              </CardTitle>
              <CardDescription className="mt-1">
                {activeSessions.length} active session{activeSessions.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="size-4" />
                Refresh
              </Button>
              {activeSessions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setRevokeAllOpen(true)}
                  disabled={revokeAll.isPending}
                >
                  {revokeAll.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  Force Sign Out All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Shield className="size-10 opacity-40" />
              <p className="text-sm">No active sessions — user is not currently signed in</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session.sessionId}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0 p-2 rounded-lg bg-muted">
                  <DeviceIcon deviceType={session.deviceType} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{session.browser ?? "Unknown Browser"}</span>
                    <span className="text-muted-foreground text-xs">on</span>
                    <span className="text-sm text-muted-foreground">{session.os ?? "Unknown OS"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
                      <Clock className="size-3" />
                      Last active {formatRelativeTime(session.lastUsedAt)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Signed in {formatDateTime(session.issuedAt)}
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setRevokeTarget(session)}
                        disabled={revokeSession.isPending}
                      >
                        {revokeSession.isPending && revokeSession.variables === session.sessionId ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Revoke this session</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Confirm revoke single */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The session on <strong>{revokeTarget?.browser ?? "Unknown"}</strong>{" "}
              ({revokeTarget?.os ?? "Unknown OS"}) will be immediately invalidated.
              {revokeTarget?.location && (
                <> Location: {revokeTarget.location}.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (revokeTarget) revokeSession.mutate(revokeTarget.sessionId)
                setRevokeTarget(null)
              }}
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm revoke all */}
      <AlertDialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force sign out from all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke all <strong>{activeSessions.length} active session{activeSessions.length !== 1 ? "s" : ""}</strong> for this user.
              They will need to sign in again on all devices.
              This action also clears all cached refresh tokens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                revokeAll.mutate()
                setRevokeAllOpen(false)
              }}
            >
              Force Sign Out All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


